import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { TrackingView, type TrackingData } from "@/components/TrackingView";

// Suivi public d'une commande, ouvert depuis le lien envoyé au client.
// Le jeton est aléatoire (colonne tracking_token) : on ne peut pas deviner
// la commande d'un autre client. On n'affiche que le prénom du client.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function TrackingPage({ params }: { params: { token: string } }) {
  if (!UUID.test(params.token)) notFound();
  const admin = createAdminClient();
  if (!admin) notFound();

  const { data: o } = await admin
    .from("orders")
    .select("ref, status, courier_name, customers(full_name), businesses(name, slug, phone_e164, logo_url), order_items(qty, name)")
    .eq("tracking_token", params.token)
    .maybeSingle();
  if (!o) notFound();

  const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);
  type Shop = { name: string; slug: string; phone_e164: string | null; logo_url: string | null };
  const shop = one(o.businesses as unknown as Shop | Shop[] | null);
  const customer = one(o.customers as unknown as { full_name: string } | { full_name: string }[] | null);

  const data: TrackingData = {
    ref: o.ref,
    status: o.status,
    firstName: (customer?.full_name ?? "").split(/\s+/)[0] ?? "",
    courier: o.courier_name ? String(o.courier_name).split(/\s+/)[0] : null,
    items: ((o.order_items ?? []) as { qty: number; name: string }[]).map((it) => `${Number(it.qty)} × ${it.name}`),
    shop: { name: shop?.name ?? "", slug: shop?.slug ?? "", phone: shop?.phone_e164 ?? null, logo: shop?.logo_url ?? null },
  };
  return <TrackingView data={data} />;
}

export const metadata = { title: "Suivi de commande · CONVERZA", robots: { index: false, follow: false } };
