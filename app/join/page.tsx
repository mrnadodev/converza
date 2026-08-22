import { JoinForm } from "@/components/JoinForm";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/data";

// Page d'invitation d'un agent (lien partagé par l'owner).
export default async function JoinPage({ searchParams }: { searchParams: { b?: string } }) {
  const businessId = searchParams.b ?? "";
  let name = "biznis lan";
  if (hasSupabase() && businessId) {
    const sb = createClient();
    const { data } = await sb.from("businesses").select("name").eq("id", businessId).maybeSingle();
    if (data?.name) name = data.name;
  }
  return <JoinForm businessId={businessId} businessName={name} />;
}
