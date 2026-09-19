import { createAdminClient } from "@/lib/supabase/admin";
import { planOf } from "@/lib/plans";
import { adminEmails } from "@/lib/admin";
import { loadPlans, loadPaymentInfo, loadPlatformSettings, loadLegalInfo } from "@/lib/platform-store";
import { merchantIssues, type Issue } from "@/lib/merchant-health";

// Fenêtre de paiements chargée pour la file de validation, l'historique et la
// détection de références réutilisées. Au-delà, la file n'est plus consultable.
const RECENT_PAYMENTS_LIMIT = 500;
const AUDIT_LIMIT = 50;
const EXPIRING_SOON_DAYS = 7;
const PHONE_REQUESTS_LIMIT = 40;

/** Plafond de lecture des commandes pour dater la première vente de chaque boutique. */
const FIRST_ORDER_SCAN = 20_000;

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
  /** Compte du propriétaire, pour les actions de support. */
  ownerUserId: string | null;
  lastSignInAt: string | null;
  /** Commandes reçues sur les 7 derniers jours. */
  orders7d: number;
  /** Date de la toute première commande : délai entre inscription et première vente. */
  firstOrderAt: string | null;
  suspendedAt: string | null;
  suspendedReason: string | null;
  /** Diagnostic (lib/merchant-health). */
  issues: Issue[];
}

/** Demande de changement de numéro, telle que la console la présente. */
export interface AdminPhoneRequest {
  id: string;
  businessId: string;
  businessName: string;
  slug: string;
  ownerName: string | null;
  ownerEmail: string | null;
  /** Numéro actuel de la boutique, pour repérer une demande devenue obsolète. */
  currentPhone: string | null;
  oldPhone: string | null;
  newPhone: string;
  reason: string;
  note: string | null;
  noticeDays: number;
  status: string;
  adminEmail: string | null;
  adminNote: string | null;
  createdAt: string;
  decidedAt: string | null;
  idDocUrl: string | null;
  proofUrls: string[];
}


/** Colonnes du marchand, hors suspension (migration 7). */
const BUSINESS_COLUMNS =
  "id,name,slug,business_type,plan,plan_until,created_at,phone_e164,category,address,logo_url,cover_url,hours,theme,layout,default_currency,social_instagram,social_facebook,social_tiktok,delivery_zones,moncash_number,natcash_number,bank_accounts,zelle_info,usdt_trc20_address";

/**
 * Lit les marchands, avec ou sans les colonnes de suspension.
 *
 * Demander `suspended_at` à une base où la migration 7 n'a pas encore été
 * jouée fait échouer toute la requête : la console affichait alors zéro
 * marchand, comme si la plateforme était vide. On retente sans ces colonnes
 * plutôt que de perdre la liste.
 */
async function readBusinesses(admin: NonNullable<ReturnType<typeof createAdminClient>>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const withSupport = await admin.from("businesses").select(`${BUSINESS_COLUMNS},suspended_at,suspended_reason`);
  if (!withSupport.error) return { rows: (withSupport.data ?? []) as any[], suspensionColumns: true };

  const plain = await admin.from("businesses").select(BUSINESS_COLUMNS);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { rows: (plain.data ?? []) as any[], suspensionColumns: false };
}

export async function getAdminData() {
  const admin = createAdminClient();
  if (!admin) return null;
  const now = Date.now();

  const [platformPlans, platformPaymentInfo, platformSettings, legalInfo] = await Promise.all([
    loadPlans(),
    loadPaymentInfo(),
    loadPlatformSettings(),
    loadLegalInfo(),
  ]);

  // Les compteurs par marchand sont agrégés par Postgres (vue
  // admin_business_stats) au lieu d'être recalculés ici.
  const [bizRes, payRes, statsRes, membersRes] = await Promise.all([
    readBusinesses(admin),
    admin
      .from("subscription_payments")
      .select("id,plan,amount_cents,pay_method,pay_ref,status,created_at,business_id,businesses(name,slug)")
      .order("created_at", { ascending: false })
      .limit(RECENT_PAYMENTS_LIMIT),
    admin.from("admin_business_stats").select("*"),
    admin.from("members").select("business_id,user_id,full_name,role").eq("role", "owner"),
  ]);

  const businesses = bizRes.rows;
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

  // Signaux d'activité récents, pour repérer un marchand qui décroche.
  const weekAgo = new Date(now - 7 * 864e5).toISOString();
  const [recentOrdersRes, trackedRes, costsRes, errorsRes, dbVersionRes, firstOrderRes] = await Promise.all([
    admin.from("orders").select("business_id").gte("created_at", weekAgo).limit(5000),
    admin.from("products").select("business_id,stock_qty").not("stock_qty", "is", null).limit(20000),
    admin.from("product_costs").select("business_id").limit(20000),
    admin.from("app_errors").select("id,scope,message,business_id,created_at").order("created_at", { ascending: false }).limit(50),
    admin.from("platform_settings").select("value").eq("key", "db_version").maybeSingle(),
    // Les plus anciennes d'abord : la première commande de chaque boutique est
    // donc dans le lot, tant que la plateforme reste sous ce plafond.
    admin.from("orders").select("business_id,created_at").order("created_at", { ascending: true }).limit(FIRST_ORDER_SCAN),
  ]);
  const firstOrder = new Map<string, string>();
  for (const row of firstOrderRes.data ?? []) {
    const id = row.business_id as string;
    if (id && !firstOrder.has(id)) firstOrder.set(id, row.created_at as string);
  }
  // Plafond atteint : les inscrits récents pourraient manquer à l'appel, on ne
  // publie alors pas de délai plutôt que d'en publier un faux.
  const firstOrderComplete = (firstOrderRes.data?.length ?? 0) < FIRST_ORDER_SCAN;
  // Repère posé par les migrations : une vue ne se reconnaît pas depuis l'app.
  const dbVersion = Number((dbVersionRes.data?.value as { migration?: number } | null)?.migration ?? 0);
  const countBy = (rows: { business_id: string | null }[] | null | undefined) => {
    const map = new Map<string, number>();
    for (const r of rows ?? []) if (r.business_id) map.set(r.business_id, (map.get(r.business_id) ?? 0) + 1);
    return map;
  };
  const orders7d = countBy(recentOrdersRes.data);
  const trackedProducts = countBy(trackedRes.data);
  const productsWithCost = countBy(costsRes.data);

  // Adresse du propriétaire de chaque boutique : le support en a besoin pour
  // répondre à un marchand, et elle n'existe que dans l'annuaire d'auth.
  const ownerEmailByBusiness = new Map<string, string>();
  const ownerUserByBusiness = new Map<string, string>();
  const lastSignInByBusiness = new Map<string, string | null>();
  const owners = membersRes.data ?? [];
  if (owners.length > 0) {
    try {
      const { data: userList } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const byUser = new Map((userList?.users ?? []).map((u) => [u.id, u]));
      for (const m of owners) {
        const user = byUser.get(m.user_id);
        if (!m.business_id) continue;
        if (user?.email) ownerEmailByBusiness.set(m.business_id, user.email);
        ownerUserByBusiness.set(m.business_id, m.user_id);
        lastSignInByBusiness.set(m.business_id, user?.last_sign_in_at ?? null);
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
      ownerUserId: ownerUserByBusiness.get(b.id) ?? null,
      lastSignInAt: lastSignInByBusiness.get(b.id) ?? null,
      orders7d: orders7d.get(b.id) ?? 0,
      firstOrderAt: firstOrder.get(b.id) ?? null,
      suspendedAt: b.suspended_at ?? null,
      suspendedReason: b.suspended_reason ?? null,
      issues: merchantIssues(
        {
          suspendedAt: b.suspended_at ?? null,
          products: prodCount.get(b.id) ?? 0,
          orders: ordCount.get(b.id) ?? 0,
          lastOrderAt: lastOrder.get(b.id) ?? null,
          createdAt: b.created_at,
          plan: b.plan ?? "gratis",
          planUntil: b.plan_until,
          phone: b.phone_e164,
          coverUrl: b.cover_url,
          deliveryZones: Array.isArray(b.delivery_zones) ? b.delivery_zones : [],
          hasPayMethod: Boolean(b.moncash_number || b.natcash_number || b.bank_accounts || b.zelle_info || b.usdt_trc20_address),
          trackedProducts: trackedProducts.get(b.id) ?? 0,
          productsWithCost: productsWithCost.get(b.id) ?? 0,
          lastSignInAt: lastSignInByBusiness.get(b.id) ?? null,
        },
        now,
      ),
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

  // Changements de numéro : la file en attente et les dernières décisions.
  const phoneRes = await admin
    .from("phone_change_requests")
    .select("id,business_id,old_phone_e164,new_phone_e164,reason,note,notice_days,proof_paths,id_doc_path,status,admin_email,admin_note,created_at,decided_at")
    .order("created_at", { ascending: false })
    .limit(PHONE_REQUESTS_LIMIT);
  const bizById = new Map(businesses.map((b) => [b.id, b]));
  const phoneRequests: AdminPhoneRequest[] = [];
  for (const r of phoneRes.data ?? []) {
    const b = bizById.get(r.business_id);
    // Les pièces ne sont lisibles que par des liens signés d'une heure : le
    // bucket est privé et elles sont supprimées après la décision.
    const paths = [r.id_doc_path, ...(r.proof_paths ?? [])].filter(Boolean) as string[];
    let urls: string[] = [];
    if (r.status === "pending" && paths.length) {
      const { data: signed } = await admin.storage.from("verification").createSignedUrls(paths, 3600);
      // Pas de filtre ici : l'ordre doit rester celui des chemins.
      urls = (signed ?? []).map((s) => s.signedUrl ?? "");
    }
    const idUrl = r.id_doc_path ? urls[0] || null : null;
    phoneRequests.push({
      id: r.id,
      businessId: r.business_id,
      businessName: b?.name ?? "—",
      slug: b?.slug ?? "",
      ownerName: owners.find((o) => o.business_id === r.business_id)?.full_name ?? null,
      ownerEmail: ownerEmailByBusiness.get(r.business_id) ?? null,
      currentPhone: b?.phone_e164 ?? null,
      oldPhone: r.old_phone_e164,
      newPhone: r.new_phone_e164,
      reason: r.reason,
      note: r.note,
      noticeDays: r.notice_days,
      status: r.status,
      adminEmail: r.admin_email,
      adminNote: r.admin_note,
      createdAt: r.created_at,
      decidedAt: r.decided_at,
      idDocUrl: idUrl,
      proofUrls: (r.id_doc_path ? urls.slice(1) : urls).filter(Boolean),
    });
  }

  // État de la configuration : ce que la console peut vraiment vérifier.
  const checks = {
    serviceRoleKey: true, // sans elle, getAdminData aurait déjà renvoyé null
    adminEmails: adminEmails().length,
    inviteSecret: Boolean(process.env.INVITE_SECRET),
    siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || "").trim(),
    auditTable: !auditRes.error,
    statsView: !statsRes.error,
    extendedStats: lastOrder.size > 0 && [...lastOrder.values()].some((v) => v !== null),
    phoneChanges: !phoneRes.error,
    support: !errorsRes.error,
    subscription: dbVersion >= 8,
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
    appErrors: (errorsRes.data ?? []).map((e) => ({
      id: e.id as string,
      scope: e.scope as string,
      message: e.message as string,
      businessId: (e.business_id as string | null) ?? null,
      createdAt: e.created_at as string,
    })),
    phoneRequests,
    checks,
    firstOrderComplete,
    platformPlans,
    platformPaymentInfo,
    legalInfo,
    platformSettings,
  };
}

export type AdminData = NonNullable<Awaited<ReturnType<typeof getAdminData>>>;
