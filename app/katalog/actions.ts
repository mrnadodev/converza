"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase, setBusinessOverride, addDemoProduct, removeDemoProduct } from "@/lib/data";
import { getMemberPermissions } from "@/lib/auth";
import { demoBusiness } from "@/lib/demo";
import { toCents } from "@/lib/money";
import { stockStateFor } from "@/lib/stock_ai";
import type { Product, StockState } from "@/lib/types";

export interface ProductInput {
  id?: string;
  name: string;
  category: string;
  priceGdes: string;
  currency: "HTG" | "USD";
  unit: string;
  stockQty: string;
  stockState: StockState;
  photoUrl: string | null;
  photoUrl2?: string | null;
  photos?: string[];
  isActive: boolean;
}

async function memberBusinessId(sb: ReturnType<typeof createClient>) {
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb
    .from("members")
    .select("business_id")
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.business_id ?? null;
}

/**
 * Vérifie une permission auprès de la base, pas auprès des cookies. Les boutons
 * masqués dans l'interface n'empêchent pas d'appeler l'action directement.
 */
async function denyUnless(
  permission: "canEditCatalog" | "canEditStock",
): Promise<{ ok: false; error: string } | null> {
  const permissions = await getMemberPermissions();
  if (permissions && !permissions[permission]) {
    return { ok: false, error: "Ou pa gen dwa fè chanjman sa a" };
  }
  return null;
}

export async function saveProduct(input: ProductInput) {
  if (!input.name.trim()) return { ok: false, error: "Non pwodwi a obligatwa" };
  const denied = await denyUnless("canEditCatalog");
  if (denied) return denied;

  const photosList: string[] = [];
  if (input.photoUrl) photosList.push(input.photoUrl);
  if (input.photoUrl2) photosList.push(input.photoUrl2);

  const qty = input.stockQty === "" ? null : Math.max(0, parseInt(input.stockQty, 10) || 0);
  const state = stockStateFor(qty);

  const newProd: Product = {
    id: input.id || `prod-${Date.now()}`,
    business_id: demoBusiness.id,
    name: input.name.trim(),
    category: input.category.trim() || null,
    price_cents: toCents(input.priceGdes),
    currency: input.currency,
    unit: input.unit.trim() || null,
    stock_qty: qty,
    stock_state: state,
    photo_url: photosList[0] || null,
    photos: photosList,
    sold_count: 0,
    is_active: input.isActive,
  };

  if (!hasSupabase()) {
    addDemoProduct(newProd);
    revalidatePath("/katalog");
    return { ok: true, demo: true };
  }

  const sb = createClient();
  const bid = await memberBusinessId(sb);
  // Sans business rattaché, l'enregistrement démo ne survivrait pas au
  // rechargement : mieux vaut le dire que faire croire à une sauvegarde.
  if (!bid) return { ok: false, error: "Ou pa konekte ak yon biznis" };

  const row = {
    business_id: bid,
    name: input.name.trim(),
    category: input.category.trim() || null,
    price_cents: toCents(input.priceGdes),
    currency: input.currency,
    unit: input.unit.trim() || null,
    stock_qty: qty,
    stock_state: state,
    photo_url: photosList[0] || null,
    photos: photosList,
    is_active: input.isActive,
  };

  // `eq("business_id", bid)` sur la mise à jour : sans ça, un identifiant de
  // produit d'un autre marchand serait accepté tel quel.
  const res = input.id
    ? await sb.from("products").update(row).eq("id", input.id).eq("business_id", bid)
    : await sb.from("products").insert(row);

  revalidatePath("/katalog");
  revalidatePath("/stok");
  return { ok: !res.error, error: res.error?.message };
}

export async function saveBulkProducts(items: Partial<Product>[]) {
  const denied = await denyUnless("canEditCatalog");
  if (denied) return denied;
  if (!hasSupabase()) return { ok: true, count: items.length, demo: true };
  const sb = createClient();
  const bid = await memberBusinessId(sb);
  if (!bid) return { ok: false, error: "Ou pa konekte" };

  // Un import Excel arrive rarement propre : on écarte les lignes sans nom et
  // on borne les prix négatifs plutôt que de les laisser entrer en base.
  const rows = items
    .filter((p) => typeof p.name === "string" && p.name.trim().length > 0)
    .map((p) => ({
      business_id: bid,
      name: p.name!.trim().slice(0, 200),
      category: p.category || null,
      price_cents: Math.max(0, Math.round(p.price_cents ?? 0)),
      currency: p.currency || "HTG",
      unit: p.unit || null,
      stock_qty: p.stock_qty ?? null,
      stock_threshold: p.stock_threshold ?? 5,
      stock_state: stockStateFor(p.stock_qty ?? null, p.stock_threshold ?? 5),
      photo_url: p.photo_url || null,
      photos: p.photos || [],
      is_active: p.is_active ?? true,
    }));

  if (rows.length === 0) return { ok: false, count: 0, error: "Pa gen okenn liy valab nan fichye a" };

  const { error } = await sb.from("products").insert(rows);
  revalidatePath("/katalog");
  revalidatePath("/stok");
  return { ok: !error, count: rows.length, error: error?.message };
}

export async function deleteProduct(id: string) {
  const denied = await denyUnless("canEditCatalog");
  if (denied) return denied;
  if (!hasSupabase()) {
    removeDemoProduct(id);
    revalidatePath("/katalog");
    return { ok: true, demo: true };
  }
  const sb = createClient();
  const bid = await memberBusinessId(sb);
  if (!bid) return { ok: false, error: "Ou pa konekte ak yon biznis" };
  const { error } = await sb.from("products").delete().eq("id", id).eq("business_id", bid);
  revalidatePath("/katalog");
  revalidatePath("/stok");
  return { ok: !error, error: error?.message };
}

export async function updateProductStock(id: string, qty: number) {
  const denied = await denyUnless("canEditStock");
  if (denied) return denied;
  if (!hasSupabase()) return { ok: true, demo: true };
  const sb = createClient();
  const bid = await memberBusinessId(sb);
  if (!bid) return { ok: false, error: "Ou pa konekte ak yon biznis" };
  // Le seuil du produit fait foi pour l'état : l'appelant n'a pas à le calculer.
  const { data: product } = await sb
    .from("products")
    .select("stock_threshold")
    .eq("id", id)
    .eq("business_id", bid)
    .maybeSingle();
  const cleanQty = Math.max(0, Math.floor(qty) || 0);
  const { error } = await sb
    .from("products")
    .update({ stock_qty: cleanQty, stock_state: stockStateFor(cleanQty, product?.stock_threshold ?? 5) })
    .eq("id", id)
    .eq("business_id", bid);
  revalidatePath("/katalog");
  revalidatePath("/stok");
  return { ok: !error, error: error?.message };
}

export async function publishPromoAction(input: {
  title: string;
  priceGdes: string;
  badge: string;
  photoUrl?: string | null;
}) {
  const denied = await denyUnless("canEditCatalog");
  if (denied) return denied;

  const priceCents = toCents(input.priceGdes);
  const promoText = `🔥 *PWOMOSYON AKTIF*: ${input.title} - ${(priceCents / 100).toLocaleString("fr-HT")} HTG (${input.badge})!`;

  // Pas de photo de repli hébergée chez un tiers : une promo sans visuel vaut
  // mieux qu'une photo qui n'est pas celle du marchand.
  const photos = input.photoUrl ? [input.photoUrl] : [];

  const newProduct: Product = {
    id: `promo-${Date.now()}`,
    business_id: demoBusiness.id,
    name: input.title,
    category: "Pwomosyon",
    price_cents: priceCents,
    currency: "HTG",
    unit: "inite",
    stock_qty: 25,
    stock_threshold: 5,
    stock_state: "en_stok",
    photo_url: photos[0] ?? null,
    photos,
    sold_count: 0,
    is_active: true,
  };

  if (!hasSupabase()) {
    setBusinessOverride({ promo_text: promoText });
    addDemoProduct(newProduct);
    revalidatePath("/");
    revalidatePath("/katalog");
    revalidatePath(`/b/${demoBusiness.slug}`);
    return { ok: true, promoText, product: newProduct };
  }

  const sb = createClient();
  const bid = await memberBusinessId(sb);
  if (!bid) return { ok: false, error: "Ou pa konekte ak yon biznis" };

  const { data: biz } = await sb.from("businesses").select("slug").eq("id", bid).maybeSingle();
  await sb.from("businesses").update({ promo_text: promoText }).eq("id", bid);
  const { error } = await sb.from("products").insert({
    business_id: bid,
    name: input.title,
    category: "Pwomosyon",
    price_cents: priceCents,
    currency: "HTG",
    unit: "inite",
    stock_qty: 25,
    stock_threshold: 5,
    stock_state: "en_stok",
    photo_url: photos[0] ?? null,
    photos,
    is_active: true,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/katalog");
  if (biz?.slug) revalidatePath(`/b/${biz.slug}`);
  return { ok: true, promoText, product: newProduct };
}
