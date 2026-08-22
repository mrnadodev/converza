import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { hasSupabase } from "@/lib/data";
import { getAdminData } from "@/lib/admin-data";
import { AdminPanel } from "@/components/AdminPanel";

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-2 bg-[#F7F8F9] px-8 text-center">
      <h1 className="text-lg font-extrabold">{title}</h1>
      <p className="max-w-sm text-sm text-ink-muted">{body}</p>
    </div>
  );
}

export default async function AdminPage() {
  if (!hasSupabase()) return <Notice title="Admin" body="Supabase pa konfigire." />;

  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) return <Notice title="Aksè entèdi" body="Paj sa a se pou super-admin CONVERZA sèlman." />;

  const data = await getAdminData();
  if (!data) return <Notice title="Konfigirasyon manke" body="Ajoute SUPABASE_SERVICE_ROLE_KEY nan varyab anviwonman yo (Vercel + .env.local)." />;

  return <AdminPanel data={data} />;
}
