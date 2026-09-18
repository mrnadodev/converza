import { createAdminClient } from "@/lib/supabase/admin";
import { planOf } from "@/lib/plans";
import { adminEmails } from "@/lib/admin";
import { loadPlans, loadPaymentInfo, loadPlatformSettings } from "@/lib/platform-store";

// Fenêtre de paiements chargée pour la file de validation, l'historique et la
// détection de références réutilisées. Au-delà, la file n'est plus consultable.
const RECENT_PAYMENTS_LIMIT = 500;
const AUDIT_LIMIT = 50;
const EXPIRING_SOON_DAYS = 7;

export interface AdminMerchant {
  id: string;
  name: string;
  slug: string;
  business_type: string | null;
  plan: string;
  plan_until: string | null;
  created_at: string;
  products: number;
  orders: number;
  agents: number;
  gmvCents: number;
  /** Montant réellement encaissé (nul tant que la migration 3 n'est pas passée). */
  paidCents: number | null;
  /** Date de la dernière commande, `null` si aucune ou migration 3 absente. */
  lastOrderAt: string | null;
  /** Adresse du propriétaire, pour le support. */
  ownerEmail: string | null;
  phone_e164: string | null;
  category: string | null;
  address: string | null;
  logo_url: string | null;
  cover_url: string | null;
  hours: string | null;
  theme: string | null;
  layout: string | null;
  default_currency: string | null;
  social_instagram: string | null;
  social_facebook: string | null;
  social_tiktok: string | null;
}

export async function getAdminData() {
  const admin = createAdminClient();
  if (!admin) return null;
  const now = Date.now();

  const [platformPlans, platformPaymentInfo, platformSettings] = await Promise.all([
    loadPlans(),
    loadPaymentInfo(),
    loadPlatformSettings(),
  ]);

  // Les compteurs par marchand sont agrégés par Postgres (vue
  // admin_business_stats) au lieu d'être recalculés ici.
  const [bizRes, payRes, statsRes, membersRes] = await Promise.all([
    admin
      .from("businesses")
      .select(
        "id,name,slug,business_type,plan,plan_until,created_at,phone_e164,category,address,logo_url,cover_url,hours,theme,layout,default_currency,social_instagram,social_facebook,social_tiktok",
      ),
    admin
      .from("subscription_payments")
      .select("id,plan,amount_cents,pay_method,pay_ref,status,created_at,business_id,businesses(name,slug)")
      .order("created_at", { ascending: false })
      .limit(RECENT_PAYMENTS_LIMIT),
    admin.from("admin_business_stats").select("*"),
    admin.from("members").select("business_id,user_id,full_name,role").eq("role", "owner"),
  ]);

  const businesses = bizRes.data ?? [];
  const payments = payRes.data ?? [];

  const ordCount = new Map<string, number>();
  const gmv = new Map<string, number>();
  const paid = new Map<string, number | null>();
  const lastOrder = new Map<string, string | null>();
  const prodCount = new Map<string, number>();
  const agentCount = new Map<string, number>();
  for (const s of (statsRes.data ?? []) as Record<string, unknown>[]) {
    const id = String(s.business_id);
    ordCount.set(id, Number(s.orders_count) || 0);
    gmv.set(id, Number(s.gmv_cents) || 0);
    prodCount.set(id, Number(s.products_count) || 0);
    agentCount.set(id, Number(s.agents_count) || 0);
    // Colonnes ajoutées par la migration 3 : absentes, elles restent nulles.
    paid.set(id, s.paid_cents === undefined || s.paid_cents === null ? null : Number(s.paid_cents));
    lastOrder.set(id, typeof s.last_order_at === "string" ? s.last_order_at : null);
  }

  // Adresse du propriétaire de chaque boutique : le support en a besoin pour
  // répondre à un marchand, et elle n'existe que dans l'annuaire d'auth.
  const ownerEmailByBusiness = new Map<string, string>();
  const owners = membersRes.data ?? [];
  if (owners.length > 0) {
    try {
      const { data: userList } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const emailByUser = new Map((userList?.users ?? []).map((u) => [u.id, u.email ?? ""]));
      for (const m of owners) {
        const email = emailByUser.get(m.user_id);
        if (email && m.business_id) ownerEmailByBusiness.set(m.business_id, email);
      }
    } catch {
      // L'annuaire d'auth peut être indisponible : la console reste utilisable
      // sans les adresses.
    }
  }

  // KPIs
  const monthAgo = now - 30 * 864e5;
  const soonLimit = now + EXPIRING_SOON_DAYS * 864e5;
  let mrrCents = 0;
  const mrrByPlan: Record<string, number> = {};
  const planCounts: Record<string, number> = { gratis: 0, qr_express: 0, pro: 0, premium: 0 };
  let newThisMonth = 0;
  const expired: { id: string; name: string; plan: string; until: string | null }[] = [];
  const expiringSoon: { id: string; name: string; plan: string; until: string | null }[] = [];

  for (const b of businesses) {
    const plan = b.plan ?? "gratis";
    planCounts[plan] = (planCounts[plan] ?? 0) + 1;
    const until = b.plan_until ? new Date(b.plan_until).getTime() : null;
    // Un abonnement sans date de fin n'est pas « actif pour toujours » : c'est
    // une ligne incomplète. La compter dans le MRR gonflerait le revenu
    // récurrent d'un montant qui n'est jamais encaissé.
    const active = until != null && until > now;
    if (plan !== "gratis" && active) {
      const priceCents = planOf(plan, platformPlans).priceGdes * 100;
      mrrCents += priceCents;
      mrrByPlan[plan] = (mrrByPlan[plan] ?? 0) + priceCents;
      if (until <= soonLimit) expiringSoon.push({ id: b.id, name: b.name, plan, until: b.plan_until });
    }
    if (plan !== "gratis" && !active) expired.push({ id: b.id, name: b.name, plan, until: b.plan_until });
    if (new Date(b.created_at).getTime() > monthAgo) newThisMonth += 1;
  }

  // Le taux de conversion se mesure sur les abonnements réellement actifs,
  // pas sur toute ligne portant une étiquette payante.
  const paidCount = businesses.filter((b) => {
    const plan = b.plan ?? "gratis";
    const until = b.plan_until ? new Date(b.plan_until).getTime() : null;
    return plan !== "gratis" && until != null && until > now;
  }).length;

  const totalGmv = [...gmv.values()].reduce((a, v) => a + v, 0);
  const conversionPct = businesses.length ? Math.round((paidCount / businesses.length) * 100) : 0;

  // Inscriptions par semaine (8 dernières)
  const weeks = Array.from({ length: 8 }, () => 0);
  for (const b of businesses) {
    const wk = Math.floor((now - new Date(b.created_at).getTime()) / (7 * 864e5));
    if (wk >= 0 && wk < 8) weeks[7 - wk] += 1; // index 7 = semaine courante
  }

  // Anti-fraude : une même référence de paiement utilisée plusieurs fois.
  const refCount = new Map<string, number>();
  for (const p of payments) {
    const ref = p.pay_ref?.trim().toLowerCase();
    if (ref) refCount.set(ref, (refCount.get(ref) ?? 0) + 1);
  }

  const merchants: AdminMerchant[] = businesses
    .map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      business_type: b.business_type,
      plan: b.plan ?? "gratis",
      plan_until: b.plan_until,
      created_at: b.created_at,
      products: prodCount.get(b.id) ?? 0,
      orders: ordCount.get(b.id) ?? 0,
      agents: agentCount.get(b.id) ?? 0,
      gmvCents: gmv.get(b.id) ?? 0,
      paidCents: paid.get(b.id) ?? null,
      lastOrderAt: lastOrder.get(b.id) ?? null,
      ownerEmail: ownerEmailByBusiness.get(b.id) ?? null,
      phone_e164: b.phone_e164 ?? null,
      category: b.category ?? null,
      address: b.address ?? null,
      logo_url: b.logo_url ?? null,
      cover_url: b.cover_url ?? null,
      hours: b.hours ?? null,
      theme: b.theme ?? "whatsapp",
      layout: b.layout ?? "auto",
      default_currency: b.default_currency ?? "HTG",
      social_instagram: b.social_instagram ?? null,
      social_facebook: b.social_facebook ?? null,
      social_tiktok: b.social_tiktok ?? null,
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const withBusiness = (p: (typeof payments)[number]) => ({
    ...p,
    isDuplicateRef: !!p.pay_ref?.trim() && (refCount.get(p.pay_ref.trim().toLowerCase()) ?? 0) > 1,
    businesses: Array.isArray(p.businesses) ? p.businesses[0] ?? null : p.businesses ?? null,
  });

  const pendingPayments = payments.filter((p) => p.status === "pending").map(withBusiness);
  const paymentHistory = payments.filter((p) => p.status !== "pending").slice(0, 60).map(withBusiness);
  const duplicateRefAlerts = pendingPayments.filter((p) => p.isDuplicateRef);

  // Journal d'audit réel. Aucune ligne de démonstration : une console de
  // sécurité qui invente une entrée ne vaut rien.
  const auditRes = await admin
    .from("security_audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(AUDIT_LIMIT);

  // État de la configuration : ce que la console peut vraiment vérifier.
  const checks = {
    serviceRoleKey: true, // sans elle, getAdminData aurait déjà renvoyé null
    adminEmails: adminEmails().length,
    inviteSecret: Boolean(process.env.INVITE_SECRET),
    siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || "").trim(),
    auditTable: !auditRes.error,
    statsView: !statsRes.error,
    extendedStats: lastOrder.size > 0 && [...lastOrder.values()].some((v) => v !== null),
  };

  return {
    kpis: {
      mrrCents,
      merchants: businesses.length,
      newThisMonth,
      gmvCents: totalGmv,
      conversionPct,
      paidCount,
      securityAlertsCount: duplicateRefAlerts.length,
      expiringSoonCount: expiringSoon.length,
    },
    mrrByPlan,
    planCounts,
    signups: weeks,
    pendingPayments,
    paymentHistory,
    duplicateRefAlerts,
    expired,
    expiringSoon,
    merchants,
    auditLogs: auditRes.data ?? [],
    checks,
    platformPlans,
    platformPaymentInfo,
    platformSettings,
  };
}

export type AdminData = NonNullable<Awaited<ReturnType<typeof getAdminData>>>;
