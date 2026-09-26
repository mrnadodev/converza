"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAppError } from "@/lib/app-errors";
import { generateOrderSecurityCode } from "@/lib/order";
import { isValidWaPhone, normalizePhoneHT } from "@/lib/whatsapp";

// Une commande vitrine est créée par un visiteur anonyme, via la clé service
// role (la RLS ne peut pas nous aider ici). Tout ce qui vient du navigateur est
// donc traité comme hostile : on ne garde que des identifiants et des quantités,
// et on relit prix, noms et frais de livraison dans la base.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_DISTINCT_ITEMS = 50;
const MAX_QTY_PER_ITEM = 999;
const MAX_NOTE_LEN = 500;
const MAX_TABLE_LEN = 12;

// Plafond de rafale par commerce : large pour un service de restaurant à
// l'heure du déjeuner, étroit pour un script.
const BURST_WINDOW_MS = 60_000;
const BURST_MAX_ORDERS = 40;

export interface StorefrontOrderItemInput {
  productId: string;
  qty: number;
}

function sanitizeText(value: string | null | undefined, maxLen: number): string | null {
  if (!value) return null;
  // On retire les caractères de contrôle : ces textes finissent dans des
  // exports CSV et des aperçus imprimables.
  const clean = value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, maxLen);
  return clean.length > 0 ? clean : null;
}

/**
 * Retrouve ou crée la fiche client à partir du nom et du téléphone saisis à la
 * commande. Renvoie `null` si le visiteur n'a rien laissé, ou si le numéro
 * n'est pas joignable sur WhatsApp — une fiche sans numéro utilisable ne sert
 * à rien au marchand.
 */
async function upsertCustomer(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  businessId: string,
  rawName: string | null | undefined,
  rawPhone: string | null | undefined,
): Promise<string | null> {
  const phoneInput = sanitizeText(rawPhone, 32);
  if (!phoneInput || !isValidWaPhone(phoneInput)) return null;

  const phone = `+${normalizePhoneHT(phoneInput)}`;
  const name = sanitizeText(rawName, 80) ?? "Kliyan vitrin";

  const { data: existing } = await admin
    .from("customers")
    .select("id")
    .eq("business_id", businessId)
    .eq("phone_e164", phone)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data, error } = await admin
    .from("customers")
    .insert({ business_id: businessId, full_name: name, phone_e164: phone, tags: ["vitrin"] })
    .select("id")
    .single();

  // Une fiche client absente ne doit pas faire échouer la commande.
  if (error) {
    console.error("upsertCustomer:", error.message);
    return null;
  }
  return data.id;
}

export async function createStorefrontOrderAction({
  businessId,
  items,
  tableNum,
  deliveryZoneName,
  note,
  customerName,
  customerPhone,
  source,
}: {
  businessId: string;
  items: StorefrontOrderItemInput[];
  tableNum?: string | null;
  deliveryZoneName?: string | null;
  note?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  source?: string | null;
}): Promise<
  | { ok: true; ref: string; orderId: string; securityCode: string; trackingToken: string | null }
  | { ok: false; error: string }
> {
  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, error: "Base de données non disponible" };
  }

  if (!UUID_RE.test(businessId ?? "")) {
    return { ok: false, error: "Biznis la pa valab" };
  }

  // Quantités : on normalise avant toute requête, et on fusionne les doublons.
  const wanted = new Map<string, number>();
  for (const raw of Array.isArray(items) ? items : []) {
    if (!UUID_RE.test(raw?.productId ?? "")) continue;
    const qty = Math.floor(Number(raw.qty));
    if (!Number.isFinite(qty) || qty <= 0) continue;
    const merged = Math.min((wanted.get(raw.productId) ?? 0) + qty, MAX_QTY_PER_ITEM);
    wanted.set(raw.productId, merged);
  }
  if (wanted.size === 0) return { ok: false, error: "Panye a vid" };
  if (wanted.size > MAX_DISTINCT_ITEMS) return { ok: false, error: "Twòp pwodwi nan panye a" };

  const { data: business, error: bizErr } = await admin
    .from("businesses")
    .select("id, delivery_zones, default_currency")
    .eq("id", businessId)
    .maybeSingle();
  if (bizErr || !business) return { ok: false, error: "Biznis la pa egziste" };

  // Garde-fou de débit. Cette action est appelable sans authentification et
  // écrit avec la clé service role : sans plafond, un script remplit le
  // pipeline du marchand. Le comptage se fait en base pour valoir aussi entre
  // instances serverless, contrairement à un compteur en mémoire.
  const { count: recent } = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .gte("created_at", new Date(Date.now() - BURST_WINDOW_MS).toISOString());
  if ((recent ?? 0) >= BURST_MAX_ORDERS) {
    return { ok: false, error: "Twòp kòmand nan yon ti moman. Tanpri eseye ankò nan yon minit." };
  }

  // Prix et noms viennent de la base, jamais du client : sinon n'importe qui
  // pourrait commander à 0 HTG ou injecter du texte dans le pipeline marchand.
  const { data: products, error: prodErr } = await admin
    .from("products")
    .select("id, name, price_cents, currency, is_active")
    .eq("business_id", businessId)
    .in("id", [...wanted.keys()]);
  if (prodErr) return { ok: false, error: "Erè pandan lekti katalòg la" };

  const sellable = (products ?? []).filter((p) => p.is_active);
  if (sellable.length === 0) return { ok: false, error: "Pwodwi yo pa disponib ankò" };

  const itemsToInsert = sellable.map((p) => ({
    product_id: p.id,
    name: p.name,
    unit_price_cents: p.price_cents,
    qty: wanted.get(p.id)!,
  }));

  // Frais de livraison : la zone choisie est un simple libellé, on retrouve le
  // tarif réel dans la fiche business (sinon la commande arrive sous-facturée).
  const zones: { name?: string; fee_cents?: number }[] = Array.isArray(business.delivery_zones)
    ? business.delivery_zones
    : [];
  const cleanTable = sanitizeText(tableNum, MAX_TABLE_LEN);
  const cleanZone = sanitizeText(deliveryZoneName, 80);
  const matchedZone = cleanTable ? null : zones.find((z) => z.name === cleanZone);
  const deliveryFeeCents = matchedZone ? Math.max(0, Math.round(Number(matchedZone.fee_cents) || 0)) : 0;

  const deliveryAddr = cleanTable
    ? `📍 Table #${cleanTable} (Sur place - Menu QR)`
    : matchedZone?.name ?? "Retrait / Sur place";

  const orderNote = cleanTable
    ? `🍽️ Commande Table #${cleanTable} via QR Code Menu`
    : sanitizeText(note, MAX_NOTE_LEN);

  const currency = business.default_currency === "USD" ? "USD" : "HTG";
  const securityCode = generateOrderSecurityCode();
  const cleanSource = sanitizeText(source, 60);

  // Fiche client. Sans elle, le marchand reçoit une commande mais aucun
  // contact rattaché : ni relance de dette, ni historique, ni segmentation —
  // c'est-à-dire la moitié des fonctions déjà construites.
  //
  // Le numéro était facultatif. Résultat en production : des commandes livrées
  // à crédit, sans fiche et sans moyen de relancer. Il est désormais exigé pour
  // toute commande à livrer ou à retirer. Une commande à table fait exception :
  // le client est devant le marchand, et il paie sur place.
  //
  // La règle est ici autant que dans la page : la page peut être contournée.
  const customerId = await upsertCustomer(admin, businessId, customerName, customerPhone);
  if (!cleanTable && !customerId) {
    return { ok: false, error: "Nimewo WhatsApp la obligatwa" };
  }

  // `ref` est unique par business : on laisse la contrainte trancher et on
  // retente, plutôt que d'espérer qu'un tirage sur 4 chiffres ne collisionne pas.
  let orderId: string | null = null;
  let trackingToken: string | null = null;
  let ref = "";
  for (let attempt = 0; attempt < 5 && !orderId; attempt++) {
    ref = `CMD-${Date.now().toString(36).toUpperCase().slice(-5)}${Math.floor(Math.random() * 36 ** 2)
      .toString(36)
      .toUpperCase()
      .padStart(2, "0")}`;
    const { data, error } = await admin
      .from("orders")
      .insert({
        business_id: businessId,
        ref,
        customer_id: customerId,
        status: "demand_acha",
        currency,
        delivery_fee_cents: deliveryFeeCents,
        amount_paid_cents: 0,
        delivery_addr: deliveryAddr,
        note: orderNote,
        source: cleanSource,
        security_code: securityCode,
      })
      // Le jeton de suivi est posé par la base (migration 6). On le relit ici
      // pour le rendre au client : c'est ce qui lui permet de savoir où en est
      // sa commande sans avoir à réécrire au marchand.
      .select("id, tracking_token")
      .single();
    if (data) {
      orderId = data.id;
      trackingToken = (data as { tracking_token?: string | null }).tracking_token ?? null;
      break;
    }
    if (error && error.code !== "23505") {
      await logAppError({ scope: "storefront.order", message: error.message, businessId, details: { step: "orders" } });
      return { ok: false, error: "Erreur de création de commande" };
    }
  }

  if (!orderId) return { ok: false, error: "Erreur de création de commande" };

  const { error: itemsErr } = await admin
    .from("order_items")
    .insert(itemsToInsert.map((it) => ({ ...it, order_id: orderId })));

  if (itemsErr) {
    // Une commande sans ligne est inexploitable pour le marchand : on annule.
    await logAppError({ scope: "storefront.order", message: itemsErr.message, businessId, details: { step: "order_items", lines: itemsToInsert.length } });
    await admin.from("orders").delete().eq("id", orderId);
    return { ok: false, error: "Erreur de création de commande" };
  }

  revalidatePath("/komand");
  revalidatePath("/admin");

  return { ok: true, ref, orderId, securityCode, trackingToken };
}
