import { notFound } from "next/navigation";
import { Storefront } from "@/components/Storefront";
import { getStorefront } from "@/lib/data";
import { loadPlatformSettings } from "@/lib/platform-store";
import { isLayoutKey, resolveLayout } from "@/lib/storefront-layouts";

// Vitrine publique partageable : converza.ht/b/<slug>
// Page d'atterrissage des pubs TikTok / Instagram / Facebook.
export default async function StorefrontPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { apercu?: string };
}) {
  const data = await getStorefront(params.slug);
  if (!data) notFound();

  // `?apercu=design2` montre une disposition sans l'enregistrer : le marchand
  // compare avant de choisir, le super-admin voit chaque disposition sur de
  // vrais produits. Rien n'est écrit, la vitrine publique reste inchangée.
  const preview = isLayoutKey(searchParams.apercu) ? searchParams.apercu : null;
  const { designs } = await loadPlatformSettings();
  const layout = preview ?? resolveLayout(data.business.layout, data.business.plan, designs);

  return <Storefront business={data.business} products={data.products} layout={layout} preview={!!preview} />;
}

// SEO / partage social (Open Graph) — pour que le lien soit joli dans les pubs.
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const data = await getStorefront(params.slug);
  if (!data) return { title: "Boutique introuvable · CONVERZA" };
  const { business } = data;
  // Le titre et la description apparaissent dans l'aperçu du lien partagé sur
  // WhatsApp : on n'y met que des informations réelles du marchand.
  const where = [business.category, business.address].filter(Boolean).join(" · ");
  const description = where
    ? `${where}. Commandez sur WhatsApp · Kòmande sou WhatsApp.`
    : "Commandez sur WhatsApp · Kòmande sou WhatsApp.";
  return {
    title: `${business.name} · Commander sur WhatsApp`,
    description,
    openGraph: {
      title: business.name,
      description,
      images: business.cover_url ? [business.cover_url] : business.logo_url ? [business.logo_url] : [],
    },
  };
}
