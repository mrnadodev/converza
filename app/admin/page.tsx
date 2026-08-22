import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";
import { hasSupabase } from "@/lib/data";
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

  if (!isAdminEmail(user.email)) {
    return <Notice title="Aksè entèdi" body="Paj sa a se pou super-admin CONVERZA sèlman." />;
  }

  const admin = createAdminClient();
  if (!admin) {
    return <Notice title="Konfigirasyon manke" body="Ajoute SUPABASE_SERVICE_ROLE_KEY nan varyab anviwonman yo (Vercel + .env.local)." />;
  }

  const { data: payments } = await admin
    .from("subscription_payments")
    .select("id, plan, amount_cents, pay_method, pay_ref, status, created_at, business_id, businesses(name, slug)")
    .order("created_at", { ascending: false });

  const { data: businesses } = await admin
    .from("businesses")
    .select("id, name, slug, business_type, plan")
    .order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <AdminPanel payments={(payments ?? []) as any} businesses={(businesses ?? []) as any} />;
}
