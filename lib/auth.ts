import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/data";
import { getRolePermissions } from "@/lib/rbac";

export interface MemberContext {
  userId: string;
  businessId: string;
  role: "owner" | "agent";
  fullName: string;
  /** Profil métier de l'agent (marie, jean, pierre…), null pour un propriétaire. */
  agentProfile: string | null;
}

/**
 * Contexte serveur du membre connecté, lu dans Supabase — pas dans les cookies.
 * Les Server Actions qui écrivent doivent passer par ici : un cookie de rôle
 * peut être forgé, une session Supabase non.
 *
 * Retourne `null` en mode démo (aucune base) et pour un visiteur non connecté.
 */
export async function getMemberContext(): Promise<MemberContext | null> {
  if (!hasSupabase()) return null;

  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;

  const { data } = await sb
    .from("members")
    .select("business_id, role, full_name, agent_profile")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data?.business_id) return null;

  return {
    userId: user.id,
    businessId: data.business_id,
    role: data.role === "owner" ? "owner" : "agent",
    fullName: data.full_name ?? "",
    agentProfile: data.agent_profile ?? null,
  };
}

/**
 * Permissions réelles du membre connecté, calculées à partir de la base.
 * C'est cette version qui doit garder les Server Actions : les permissions
 * dérivées des cookies ne pilotent que l'affichage.
 */
export async function getMemberPermissions() {
  const me = await getMemberContext();
  if (!me) return null;
  return getRolePermissions({
    full_name: me.fullName,
    role: me.role,
    agentId: me.role === "owner" ? "owner" : me.agentProfile ?? undefined,
  });
}
