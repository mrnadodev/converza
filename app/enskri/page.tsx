import { RegisterForm } from "@/components/RegisterForm";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/data";

// Inscription marchand self-service.
//
// La page sert aussi de rattrapage : un compte authentifié sans boutique
// arrive ici pour la créer, sans avoir à se réinscrire avec une adresse déjà
// prise.
export default async function EnskriPage() {
  let finishing = false;
  let defaultName = "";

  if (hasSupabase()) {
    const sb = createClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (user) {
      const { data: member } = await sb
        .from("members")
        .select("business_id")
        .eq("user_id", user.id)
        .maybeSingle();
      finishing = !member?.business_id;
      defaultName = (user.user_metadata?.full_name as string) ?? user.email?.split("@")[0] ?? "";
    }
  }

  return <RegisterForm finishing={finishing} defaultName={defaultName} />;
}
