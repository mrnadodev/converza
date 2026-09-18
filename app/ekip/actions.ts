"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/data";
import { getMemberContext } from "@/lib/auth";
import { createInviteToken } from "@/lib/invite";
import { memberSeatsFor } from "@/lib/plans";
import { storefrontBaseUrl } from "@/lib/order";

export async function removeAgent(memberId: string) {
  if (!hasSupabase()) return { ok: true, demo: true };

  const me = await getMemberContext();
  if (!me) return { ok: false, error: "Ou pa konekte" };
  if (me.role !== "owner") return { ok: false, error: "Sèlman patwon an ka retire yon ajan" };

  const sb = createClient();
  // Bornes explicites : uniquement un agent, uniquement dans son business, et
  // jamais soi-même — sinon le patron peut se retirer de sa propre boutique.
  const { error } = await sb
    .from("members")
    .delete()
    .eq("id", memberId)
    .eq("business_id", me.businessId)
    .eq("role", "agent");

  revalidatePath("/ekip");
  return { ok: !error, error: error?.message };
}

// Profils métier reconnus. Ce sont les clés que lib/verticals.ts attribue déjà
// par secteur, et que lib/rbac.ts traduit en permissions.
const AGENT_PROFILES = ["marie", "jean", "pierre", "florence", "steeve", "gerant"];

/** Attribue son profil métier à un agent. Réservé au propriétaire. */
export async function setAgentProfile(memberId: string, profile: string) {
  if (!hasSupabase()) return { ok: true, demo: true };
  if (!AGENT_PROFILES.includes(profile)) return { ok: false, error: "Pwofil la pa valab" };

  const me = await getMemberContext();
  if (!me) return { ok: false, error: "Ou pa konekte" };
  if (me.role !== "owner") return { ok: false, error: "Sèlman patwon an ka chanje wòl yon ajan" };

  const sb = createClient();
  const { error } = await sb
    .from("members")
    .update({ agent_profile: profile })
    .eq("id", memberId)
    .eq("business_id", me.businessId)
    .eq("role", "agent");

  revalidatePath("/ekip");
  return { ok: !error, error: error?.message };
}

/** Lien d'invitation signé, valable 7 jours. Réservé au propriétaire. */
export async function createInviteLinkAction(): Promise<{ ok: boolean; url?: string; error?: string; seatsFull?: boolean }> {
  const me = await getMemberContext();
  if (!me) return { ok: false, error: "Ou pa konekte" };
  if (me.role !== "owner") return { ok: false, error: "Sèlman patwon an ka envite" };

  // La limite de sièges du plan se vérifie ici : sinon un lien copié une fois
  // continuerait d'ajouter des membres au-delà de ce que le plan autorise.
  const sb = createClient();
  const { data: business } = await sb.from("businesses").select("plan").eq("id", me.businessId).maybeSingle();
  const seats = memberSeatsFor(business?.plan);
  if (seats !== null) {
    const { count } = await sb
      .from("members")
      .select("id", { count: "exact", head: true })
      .eq("business_id", me.businessId);
    if ((count ?? 0) >= seats) return { ok: false, seatsFull: true, error: "Plan an pa pèmèt plis manm" };
  }

  try {
    const token = createInviteToken(me.businessId);
    return { ok: true, url: `${storefrontBaseUrl()}/join?b=${me.businessId}&k=${token}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erè" };
  }
}
