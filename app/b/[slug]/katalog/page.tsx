import { notFound } from "next/navigation";
import { Storefront } from "@/components/Storefront";
import { getStorefront } from "@/lib/data";

// Catalogue complet public : /b/<slug>/katalog
export default async function StorefrontCatalogPage({
  params,
}: {
  params: { slug: string };
}) {
  const data = await getStorefront(params.slug);
  if (!data) notFound();
  return <Storefront business={data.business} products={data.products} view="full" />;
}
