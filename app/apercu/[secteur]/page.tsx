import { notFound } from "next/navigation";
import { Storefront } from "@/components/Storefront";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/data";
import { isAdminEmail } from "@/lib/admin";
import { demoStorefront, isDemoSector } from "@/lib/demo-storefront";
import { DEFAULT_LAYOUT, isLayoutKey } from "@/lib/storefront-layouts";
import { THEMES } from "@/lib/themes";

// Vitrine d'exemple d'un secteur, dans une disposition et une couleur
// données : la console super-admin montre ainsi chaque modèle sans compte
// marchand. Réservée aux super-admins.
export default async function DemoStorefrontPage({
  params,
  searchParams,
}: {
  params: { secteur: string };
  searchParams: { design?: string; theme?: string };
}) {
  if (hasSupabase()) {
    const {
      data: { user },
    } = await createClient().auth.getUser();
    if (!isAdminEmail(user?.email)) notFound();
  }
  if (!isDemoSector(params.secteur)) notFound();

  const layout = isLayoutKey(searchParams.design) ? searchParams.design : DEFAULT_LAYOUT;
  const theme = searchParams.theme && searchParams.theme in THEMES ? searchParams.theme : "whatsapp";
  const { business, products } = demoStorefront(params.secteur, theme);

  return <Storefront business={business} products={products} layout={layout} preview />;
}

export const metadata = { robots: { index: false, follow: false } };
