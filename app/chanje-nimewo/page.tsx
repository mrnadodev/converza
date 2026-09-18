import { redirect } from "next/navigation";
import { PhoneChangeClient } from "@/components/PhoneChangeClient";
import { getCustomers, getMyBusiness, getCurrentUserSession, hasSupabase } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { storefrontBaseUrl } from "@/lib/order";
import type { PhoneChangeRequest } from "@/lib/phone-change";

// Changement du numéro WhatsApp de la boutique, réservé au propriétaire.
export default async function ChanjeNimewoPage() {
  const session = getCurrentUserSession();
  if (session.role !== "owner") redirect("/");

  const [business, customers] = await Promise.all([getMyBusiness(), getCustomers()]);

  // La politique RLS ne rend que les demandes de la boutique du marchand.
  // Tant que la migration 4 n'est pas passée, la table manque : liste vide.
  let requests: PhoneChangeRequest[] = [];
  if (hasSupabase()) {
    const { data } = await createClient()
      .from("phone_change_requests")
      .select("id,business_id,old_phone_e164,new_phone_e164,reason,note,notice_days,status,admin_note,created_at,decided_at")
      .order("created_at", { ascending: false })
      .limit(10);
    requests = (data ?? []) as PhoneChangeRequest[];
  }

  return (
    <PhoneChangeClient
      business={business}
      requests={requests}
      customers={customers.map((c) => ({ id: c.id, name: c.full_name, phone: c.phone_e164 }))}
      storefrontUrl={`${storefrontBaseUrl()}/b/${business.slug}`}
    />
  );
}
