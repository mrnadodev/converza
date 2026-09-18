"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/data";
import { getMemberContext, getMemberPermissions } from "@/lib/auth";
import { isValidWaPhone, normalizePhoneHT } from "@/lib/whatsapp";

const KNOWN_TAGS = ["vip", "kliyan_fidel", "nouvo_kliyan"];

/**
 * Enregistre les étiquettes d'un client.
 * Les boutons ne faisaient que changer la couleur à l'écran : au rechargement,
 * l'étiquette posée avait disparu.
 */
export async function setCustomerTags(customerId: string, tags: string[]) {
  if (!hasSupabase()) return { ok: true, demo: true };

  const me = await getMemberContext();
  if (!me) return { ok: false, error: "Ou pa konekte" };

  const permissions = await getMemberPermissions();
  if (permissions && !permissions.canEditCustomers) {
    return { ok: false, error: "Ou pa gen dwa modifye fich kliyan yo" };
  }

  const clean = [...new Set(tags.filter((t) => KNOWN_TAGS.includes(t)))];
  const sb = createClient();
  const { error } = await sb
    .from("customers")
    .update({ tags: clean })
    .eq("id", customerId)
    .eq("business_id", me.businessId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/kliyan");
  return { ok: true, tags: clean };
}

/** Crée un client à la main (commande prise au téléphone, en boutique…). */
export async function createCustomer(input: { fullName: string; phone: string; address?: string }) {
  if (!hasSupabase()) return { ok: false, error: "Baz done a pa konfigire" };

  const me = await getMemberContext();
  if (!me) return { ok: false, error: "Ou pa konekte" };

  const permissions = await getMemberPermissions();
  if (permissions && !permissions.canEditCustomers) {
    return { ok: false, error: "Ou pa gen dwa ajoute yon kliyan" };
  }

  const fullName = input.fullName.trim();
  const phoneInput = input.phone.trim();
  const phone = isValidWaPhone(phoneInput) ? `+${normalizePhoneHT(phoneInput)}` : "";
  if (!fullName) return { ok: false, error: "Non an obligatwa" };
  if (!phone) return { ok: false, error: "Nimewo WhatsApp la obligatwa" };

  const sb = createClient();
  // Un même numéro ne doit pas créer deux fiches : on complète celle qui existe.
  const { data: existing } = await sb
    .from("customers")
    .select("id")
    .eq("business_id", me.businessId)
    .eq("phone_e164", phone)
    .maybeSingle();

  if (existing) {
    await sb
      .from("customers")
      .update({ full_name: fullName, address: input.address?.trim() || null })
      .eq("id", existing.id)
      .eq("business_id", me.businessId);
    revalidatePath("/kliyan");
    return { ok: true, id: existing.id, existed: true };
  }

  const { data, error } = await sb
    .from("customers")
    .insert({
      business_id: me.businessId,
      full_name: fullName,
      phone_e164: phone,
      address: input.address?.trim() || null,
      tags: [],
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  revalidatePath("/kliyan");
  revalidatePath("/");
  return { ok: true, id: data.id };
}
