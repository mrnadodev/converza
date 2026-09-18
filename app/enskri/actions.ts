"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SECTOR_THEME } from "@/lib/themes";
import { hasSupabase, setBusinessOverride, resetDataForNewBusiness } from "@/lib/data";

export interface RegisterInput {
  businessName: string;
  businessType: string;
  employeesCount: string;
  phone: string;
  fullName: string;
  email: string;
  password: string;
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "boutik"
  );
}

function setDisplayCookies(ownerName: string) {
  const opts = {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
  try {
    cookies().set("converza_role", "owner", opts);
    cookies().set("converza_user_name", ownerName, opts);
  } catch {
    // hors contexte de requête
  }
}

export async function registerMerchant(
  input: RegisterInput,
): Promise<{ ok: boolean; slug?: string; needsConfirm?: boolean; error?: string }> {
  if (!input.businessName.trim()) return { ok: false, error: "Non biznis obligatwa" };

  const ownerName = input.fullName.trim() || input.email.split("@")[0] || "Propriétaire";
  const baseSlug = slugify(input.businessName);
  const employeesCount = input.employeesCount ? parseInt(input.employeesCount, 10) || null : null;

  // Mode démo : on bascule la boutique fictive sur le nom saisi, sans compte.
  if (!hasSupabase()) {
    setBusinessOverride({
      name: input.businessName.trim(),
      slug: baseSlug,
      business_type: input.businessType,
      employees_count: employeesCount ?? 3,
      phone_e164: input.phone.trim() || null,
    });
    resetDataForNewBusiness(input.businessName.trim(), ownerName, input.businessType);
    setDisplayCookies(ownerName);
    return { ok: true, slug: baseSlug };
  }

  const sb = createClient();

  // Deux entrées mènent ici. Soit un visiteur qui crée son compte, soit un
  // marchand déjà connecté dont la boutique n'a jamais été créée — cas qui
  // laissait le compte dans une impasse, avec un tableau de bord vide et aucun
  // moyen de repartir.
  const {
    data: { user: existingUser },
  } = await sb.auth.getUser();

  let userId: string;

  if (existingUser) {
    const { data: alreadyMember } = await sb
      .from("members")
      .select("business_id")
      .eq("user_id", existingUser.id)
      .maybeSingle();
    if (alreadyMember?.business_id) {
      return { ok: false, error: "Ou gen yon biznis deja." };
    }
    userId = existingUser.id;
  } else {
    if (!input.email.trim()) return { ok: false, error: "Imèl obligatwa" };
    if (input.password.length < 6) return { ok: false, error: "Modpas la twò kout (6+)" };

    const { data: auth, error: aerr } = await sb.auth.signUp({
      email: input.email.trim(),
      password: input.password,
    });
    if (aerr) return { ok: false, error: aerr.message };
    if (!auth.user) return { ok: false, error: "Erè pandan kreyasyon kont lan" };
    // Sans session (confirmation e-mail activée), la RLS refuserait la création
    // du business. Le compte existe : on demande de confirmer puis de se
    // reconnecter, et la boutique se créera à ce moment-là.
    if (!auth.session) {
      return { ok: false, needsConfirm: true, error: "Tcheke imèl ou pou konfime kont lan, apre konekte." };
    }
    userId = auth.user.id;
  }

  // L'écriture passe par la clé service role. Juste après `signUp`, le client
  // serveur ne porte pas encore le jeton de la session qui vient d'être créée,
  // et la politique RLS `biz_create` refuse l'insertion : c'est ce qui laissait
  // des comptes sans boutique. Ici on connaît l'utilisateur et ce qu'on écrit.
  const writer = createAdminClient() ?? sb;

  // Le slug est unique en base : on suffixe jusqu'à trouver une place libre,
  // sinon deux « Ti Boutik » se disputeraient la même vitrine publique.
  let slug = baseSlug;
  let bizId: string | null = null;
  let lastError = "";
  for (let attempt = 0; attempt < 5 && !bizId; attempt++) {
    const { data: biz, error } = await writer
      .from("businesses")
      .insert({
        name: input.businessName.trim(),
        slug,
        business_type: input.businessType,
        employees_count: employeesCount,
        phone_e164: input.phone.trim() || null,
        theme: SECTOR_THEME,
      })
      .select("id")
      .single();
    if (biz) {
      bizId = biz.id;
      break;
    }
    lastError = error?.message ?? "";
    if (error?.code !== "23505") break;
    slug = `${baseSlug}-${Math.floor(Math.random() * 9000) + 1000}`;
  }

  if (!bizId) return { ok: false, error: lastError || "Enposib pou kreye biznis lan" };

  const { error: merr } = await writer.from("members").insert({
    business_id: bizId,
    user_id: userId,
    full_name: ownerName,
    role: "owner",
  });
  // Une boutique sans propriétaire est inaccessible : on la retire plutôt que
  // de laisser une ligne orpheline et un slug pris pour rien.
  if (merr) {
    await writer.from("businesses").delete().eq("id", bizId);
    return { ok: false, error: merr.message };
  }

  setDisplayCookies(ownerName);
  return { ok: true, slug };
}
