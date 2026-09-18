import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { hasSupabase } from "@/lib/data";
import { getAdminData } from "@/lib/admin-data";
import { AdminPanel } from "@/components/AdminPanel";
import { AdminNotice } from "@/components/AdminNotice";

export default async function AdminPage() {
  if (!hasSupabase()) return <AdminNotice kind="noSupabase" />;

  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) return <AdminNotice kind="forbidden" />;

  const data = await getAdminData();
  if (!data) return <AdminNotice kind="noServiceKey" />;

  return <AdminPanel data={data} />;
}
