import { redirect } from "next/navigation";
import { SuspendedNotice } from "@/components/SuspendedNotice";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/data";

// Écran affiché à un marchand dont la boutique est suspendue par CONVERZA.
// Ses données restent intactes ; il voit le motif et peut nous écrire.
export default async function SuspendedPage() {
  if (!hasSupabase()) redirect("/");

  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await sb.from("members").select("businesses(name, suspended_at, suspended_reason)").eq("user_id", user.id).maybeSingle();
  type Biz = { name: string; suspended_at: string | null; suspended_reason: string | null };
  const business = (Array.isArray(data?.businesses) ? data?.businesses[0] : data?.businesses) as Biz | undefined;

  // Plus de suspension : on renvoie au tableau de bord.
  if (!business?.suspended_at) redirect("/");

  return <SuspendedNotice name={business.name} reason={business.suspended_reason} since={business.suspended_at} />;
}
