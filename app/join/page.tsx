import { JoinForm } from "@/components/JoinForm";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/data";
import { verifyInviteToken } from "@/lib/invite";

// Page d'invitation d'un agent (lien signé partagé par l'owner).
export default async function JoinPage({ searchParams }: { searchParams: { b?: string; k?: string } }) {
  const businessId = searchParams.b ?? "";
  const token = searchParams.k ?? "";

  let valid = false;
  try {
    valid = !!businessId && verifyInviteToken(businessId, token);
  } catch {
    valid = false;
  }

  let name = "biznis lan";
  // On ne révèle le nom du marchand qu'avec un jeton valide : sinon la page
  // servirait à énumérer les boutiques par identifiant.
  if (valid && hasSupabase()) {
    const sb = createClient();
    const { data } = await sb.from("public_businesses").select("name").eq("id", businessId).maybeSingle();
    if (data?.name) name = data.name;
  }

  return (
    <JoinForm
      businessId={valid ? businessId : ""}
      token={valid ? token : ""}
      businessName={name}
    />
  );
}
