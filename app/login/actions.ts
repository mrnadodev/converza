"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/data";
import { DEMO_PERSONAS } from "@/lib/session";
import { isAdminEmail } from "@/lib/admin";
import { storefrontBaseUrl } from "@/lib/order";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

// Ces cookies ne portent que de l'affichage (nom, libellé de rôle). Ils ne
// donnent aucun accès : le middleware et les Server Actions vérifient la
// session Supabase. httpOnly pour éviter qu'un script tiers ne les lise.
function setDisplayCookies(role: string, fullName?: string | null) {
  const c = cookies();
  const opts = {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
  c.set("converza_role", role, opts);
  if (fullName) c.set("converza_user_name", fullName, opts);
}

function clearSupabaseCookies() {
  const c = cookies();
  c.getAll().forEach((cookie) => {
    if (cookie.name.startsWith("sb-")) c.delete(cookie.name);
  });
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  clearSupabaseCookies();

  // Mode démo (aucun Supabase configuré) : les personas servent à parcourir
  // l'app sans base. Ce raccourci est volontairement inaccessible dès qu'une
  // vraie base existe, sinon n'importe quelle adresse contenant « marie »
  // ouvrirait un compte agent sans mot de passe.
  if (!hasSupabase()) {
    const personaKey = Object.keys(DEMO_PERSONAS).find((k) => email.toLowerCase().includes(k));
    if (personaKey) {
      setDisplayCookies(personaKey, DEMO_PERSONAS[personaKey].full_name);
      redirect("/");
    }
    setDisplayCookies("owner");
    redirect("/");
  }

  const sb = createClient();
  const { data: authData, error } = await sb.auth.signInWithPassword({ email, password });

  if (error || !authData?.user) {
    redirect("/login?error=" + encodeURIComponent(error?.message ?? "Koneksyon an echwe"));
  }

  const userEmail = authData.user.email ?? email;

  // Le statut super-admin vient exclusivement de la liste ADMIN_EMAILS, après
  // authentification réussie. Aucun motif dans l'adresse ne l'accorde.
  if (isAdminEmail(userEmail)) {
    setDisplayCookies("admin", userEmail);
    redirect("/admin");
  }

  const { data: member } = await sb
    .from("members")
    .select("full_name, role, agent_profile")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  // Pour un agent, le cookie porte son profil métier : c'est lui qui adapte
  // l'interface (colonnes du pipeline, onglets visibles). Les écritures, elles,
  // relisent ce profil en base à chaque appel.
  const displayRole =
    member?.role === "agent" ? member.agent_profile || "agent" : member?.role ?? "owner";

  setDisplayCookies(displayRole, member?.full_name ?? null);
  redirect("/");
}

/**
 * Envoie le lien de réinitialisation de mot de passe.
 *
 * On répond toujours « ok » : dire qu'une adresse est inconnue permettrait de
 * découvrir quels comptes existent. Le message affiché reste donc le même dans
 * les deux cas.
 */
export async function requestPasswordReset(email: string): Promise<{ ok: boolean; error?: string }> {
  const clean = email.trim();
  if (!clean || !clean.includes("@")) return { ok: false, error: "Adrès imèl la pa valab" };
  if (!hasSupabase()) return { ok: true };

  const sb = createClient();
  const { error } = await sb.auth.resetPasswordForEmail(clean, {
    redirectTo: `${storefrontBaseUrl()}/nouvo-modpas`,
  });

  if (error) console.error("requestPasswordReset:", error.message);
  return { ok: true };
}

export async function signOut() {
  const c = cookies();
  c.delete("converza_role");
  c.delete("converza_user_name");
  clearSupabaseCookies();
  if (hasSupabase()) {
    const sb = createClient();
    await sb.auth.signOut();
  }
  redirect("/login");
}
