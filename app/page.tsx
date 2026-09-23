import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { DashboardView } from "@/components/DashboardView";
import { LandingPage } from "@/components/LandingPage";
import { getCatalog, getDashboard, getSourceBreakdown, hasSupabase, getCurrentUserSession, getRolePermissions, getShowcaseMerchants } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { loadLandingOverrides, loadPlans } from "@/lib/platform-store";

// Écran #1 — tableau de bord du marchand, ou page d'accueil pour les visiteurs.
export default async function TabloPage({ searchParams }: { searchParams?: { view?: string } }) {
  const session = getCurrentUserSession();
  const permissions = getRolePermissions(session);
  const roleCookie = cookies().get("converza_role")?.value;

  if (searchParams?.view === "landing") {
    return <LandingPage plans={await loadPlans()} overrides={await loadLandingOverrides()} showcase={await getShowcaseMerchants()} />;
  }

  // Un visiteur non connecté est accueilli sur la page publique. La racine étant
  // publique, le middleware ne la garde pas : c'est ici que l'on décide, sur la
  // session Supabase et jamais sur le cookie de rôle, qu'un visiteur peut poser.
  if (hasSupabase()) {
    const sb = createClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return <LandingPage plans={await loadPlans()} overrides={await loadLandingOverrides()} showcase={await getShowcaseMerchants()} />;
    if (isAdminEmail(user.email)) redirect("/admin");

    // Compte authentifié sans boutique : inscription arrêtée à mi-chemin.
    const { data: member } = await sb
      .from("members")
      .select("business_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!member?.business_id) redirect("/enskri");
  } else if (!roleCookie) {
    return <LandingPage plans={await loadPlans()} overrides={await loadLandingOverrides()} showcase={await getShowcaseMerchants()} />;
  }

  // L'attribution des ventes est un chiffre financier : on ne va même pas la
  // chercher pour un agent qui n'a pas le droit de la voir.
  const [dashboard, products, sources] = await Promise.all([
    getDashboard(),
    getCatalog(),
    permissions.canViewFinancialTurnover ? getSourceBreakdown() : Promise.resolve([]),
  ]);

  return (
    <DashboardView
      session={session}
      permissions={permissions}
      userName={dashboard.userName || session.full_name}
      business={dashboard.business}
      stats={dashboard.stats}
      funnel={dashboard.funnel}
      statusCounts={dashboard.statusCounts}
      recentOrders={dashboard.recentOrders}
      topCustomers={dashboard.topCustomers}
      sources={sources}
      products={products}
    />
  );
}
