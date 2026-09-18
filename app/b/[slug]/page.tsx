import { notFound } from "next/navigation";
import { Storefront } from "@/components/Storefront";
import { getStorefront } from "@/lib/data";

// Vitrine publique partageable : converza.ht/b/<slug>
// Page d'atterrissage des pubs TikTok / Instagram / Facebook.
export default async function StorefrontPage({
  params,
}: {
  params: { slug: string };
}) {
  const data = await getStorefront(params.slug);
  if (!data) notFound();
  return <Storefront business={data.business} products={data.products} />;
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
