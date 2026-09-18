"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabase } from "@/lib/data";
import { verifyInviteToken } from "@/lib/invite";
import { memberSeatsFor } from "@/lib/plans";

export interface JoinInput {
  businessId: string;
  token: string;
  fullName: string;
  email: string;
  password: string;
}

export async function joinBusiness(input: JoinInput) {
  if (!hasSupabase()) return { ok: false, error: "Supabase pa konfigire" };
  if (!input.businessId) return { ok: false, error: "Lyen envitasyon an pa valab" };
  // Le jeton signé est ce qui prouve l'invitation. Avec le seul identifiant du
  // business, n'importe qui pourrait s'ajouter comme agent chez un marchand.
  if (!verifyInviteToken(input.businessId, input.token)) {
    return { ok: false, error: "Lyen envitasyon an pa valab oswa li ekspire" };
  }
  if (input.password.length < 6) return { ok: false, error: "Modpas la twò kout (6+)" };

  const sb = createClient();
  // L'écriture dans `members` se fait avec la clé de service : la RLS du membre
  // qui vient de se créer ne lui permet pas encore d'insérer sa propre ligne.
  const writer = createAdminClient() ?? sb;

  // Un lien reste valable 7 jours : la limite du plan se revérifie au moment où
  // la personne rejoint réellement l'équipe.
  const { data: business } = await writer
    .from("businesses")
    .select("plan")
    .eq("id", input.businessId)
    .maybeSingle();
  const seats = memberSeatsFor(business?.plan);
  if (seats !== null) {
    const { count } = await writer
      .from("members")
      .select("id", { count: "exact", head: true })
      .eq("business_id", input.businessId);
    if ((count ?? 0) >= seats) {
      return { ok: false, error: "Ekip la konplè pou plan biznis sa a. Mande patwon an fè yon upgrade." };
    }
  }

  const { data: auth, error: aerr } = await sb.auth.signUp({
    email: input.email.trim(),
    password: input.password,
  });
  if (aerr) return { ok: false, error: aerr.message };
  if (!auth.user) return { ok: false, error: "Erè pandan kreyasyon kont" };
  if (!auth.session) return { ok: false, needsConfirm: true, error: "Tcheke imèl ou pou konfime, apre konekte." };

  const { error: merr } = await writer.from("members").insert({
    business_id: input.businessId,
    user_id: auth.user.id,
    full_name: input.fullName.trim() || input.email.trim(),
    role: "agent",
  });
  if (merr) return { ok: false, error: merr.message };

  return { ok: true };
}
