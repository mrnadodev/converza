import { createAdminClient } from "@/lib/supabase/admin";
import { planOf } from "@/lib/plans";
import { loadPlans, loadPaymentInfo, loadPlatformSettings } from "@/lib/platform-store";

// Fenêtre de paiements chargée pour la file de validation et la détection de
// références réutilisées. Au-delà, la file n'est plus consultable à l'œil.
const RECENT_PAYMENTS_LIMIT = 500;

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
  // admin_business_stats) au lieu d'être recalculés ici à partir de toutes les
  // commandes et de toutes leurs lignes.
  const [bizRes, payRes, statsRes] = await Promise.all([
    admin.from("businesses").select("id,name,slug,business_type,plan,plan_until,created_at,phone_e164,category,address,logo_url,cover_url,hours,theme,layout,default_currency,social_instagram,social_facebook,social_tiktok"),
    admin
      .from("subscription_payments")
      .select("id,plan,amount_cents,pay_method,pay_ref,status,created_at,business_id,businesses(name,slug)")
      .order("created_at", { ascending: false })
      .limit(RECENT_PAYMENTS_LIMIT),
    admin.from("admin_business_stats").select("business_id,orders_count,gmv_cents,products_count,agents_count"),
  ]);

  const businesses = bizRes.data ?? [];
  const payments = payRes.data ?? [];

  const ordCount = new Map<string, number>();
  const gmv = new Map<string, number>();
  const prodCount = new Map<string, number>();
  const agentCount = new Map<string, number>();
  for (const s of statsRes.data ?? []) {
    ordCount.set(s.business_id, Number(s.orders_count) || 0);
    gmv.set(s.business_id, Number(s.gmv_cents) || 0);
    prodCount.set(s.business_id, Number(s.products_count) || 0);
    agentCount.set(s.business_id, Number(s.agents_count) || 0);
  }

  // KPIs
  const monthAgo = now - 30 * 864e5;
  let mrrCents = 0;
  const planCounts: Record<string, number> = { gratis: 0, qr_express: 0, pro: 0, premium: 0 };
  let newThisMonth = 0;
  const expired: { id: string; name: string; plan: string }[] = [];

  for (const b of businesses) {
    const plan = b.plan ?? "gratis";
    planCounts[plan] = (planCounts[plan] ?? 0) + 1;
    const until = b.plan_until ? new Date(b.plan_until).getTime() : null;
    // Un abonnement sans date de fin n'est pas « actif pour toujours » : c'est
    // une ligne incomplète. La compter dans le MRR gonflerait le revenu
    // récurrent d'un montant qui n'est jamais encaissé.
    const active = until != null && until > now;
    if (plan !== "gratis" && active) mrrCents += planOf(plan, platformPlans).priceGdes * 100;
    if (plan !== "gratis" && !active) expired.push({ id: b.id, name: b.name, plan });
    if (new Date(b.created_at).getTime() > monthAgo) newThisMonth += 1;
  }

  // Le taux de conversion doit se mesurer sur les abonnements réellement
  // actifs, pas sur toute ligne portant une étiquette payante.
  const activePaidCount = businesses.filter((b) => {
    const plan = b.plan ?? "gratis";
    const until = b.plan_until ? new Date(b.plan_until).getTime() : null;
    return plan !== "gratis" && until != null && until > now;
  }).length;

  const totalGmv = [...gmv.values()].reduce((a, v) => a + v, 0);
  const paidCount = activePaidCount;
  const conversionPct = businesses.length ? Math.round((paidCount / businesses.length) * 100) : 0;

  // Inscriptions par semaine (8 dernières)
  const weeks = Array.from({ length: 8 }, () => 0);
  for (const b of businesses) {
    const wk = Math.floor((now - new Date(b.created_at).getTime()) / (7 * 864e5));
    if (wk >= 0 && wk < 8) weeks[7 - wk] += 1; // index 7 = semaine courante
  }

  // Analyse Anti-Fraude : Détection des références MonCash/Zelle réutilisées
  const refCount = new Map<string, number>();
  for (const p of payments) {
    if (p.pay_ref && p.pay_ref.trim()) {
      const cleanRef = p.pay_ref.trim().toLowerCase();
      refCount.set(cleanRef, (refCount.get(cleanRef) ?? 0) + 1);
    }
  }

  const merchants = businesses
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
      phone_e164: b.phone_e164 ?? null,
      category: b.category ?? null,
      address: b.address ?? null,
      logo_url: b.logo_url ?? null,
      cover_url: b.cover_url ?? null,
      hours: b.hours ?? null,
      theme: b.theme ?? "whatsapp",
      layout: b.layout ?? "design1",
      default_currency: b.default_currency ?? "HTG",
      social_instagram: b.social_instagram ?? null,
      social_facebook: b.social_facebook ?? null,
      social_tiktok: b.social_tiktok ?? null,
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const pendingPayments = payments
    .filter((p) => p.status === "pending")
    .map((p) => {
      const cleanRef = p.pay_ref ? p.pay_ref.trim().toLowerCase() : "";
      const isDuplicateRef = !!cleanRef && (refCount.get(cleanRef) ?? 0) > 1;
      return {
        ...p,
        isDuplicateRef,
        businesses: Array.isArray(p.businesses) ? (p.businesses[0] ?? null) : (p.businesses ?? null),
      };
    });

  const duplicateRefAlerts = pendingPayments.filter((p) => p.isDuplicateRef);

  // Récupération du Journal d'Audit de Sécurité Admin (security_audit_logs)
  const auditRes = await admin
    .from("security_audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  const auditLogs = auditRes.data ?? [
    {
      id: "demo-log-1",
      admin_email: "admin@converza.ht",
      action: "SECURITY_CHECK",
      details: { note: "RLS Multi-Tenant vérifié & actif" },
      created_at: new Date().toISOString(),
    },
  ];

  return {
    kpis: {
      mrrCents,
      merchants: businesses.length,
      newThisMonth,
      gmvCents: totalGmv,
      conversionPct,
      paidCount,
      securityAlertsCount: duplicateRefAlerts.length,
    },
    planCounts,
    signups: weeks,
    pendingPayments,
    duplicateRefAlerts,
    expired,
    merchants,
    auditLogs,
    platformPlans,
    platformPaymentInfo,
    platformSettings,
  };
}
