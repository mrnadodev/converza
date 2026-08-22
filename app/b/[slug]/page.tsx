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
  if (!data) return { title: "Boutik pa jwenn — CONVERZA" };
  const { business } = data;
  return {
    title: `${business.name} — Kòmande sou WhatsApp`,
    description: `${business.category ?? "Boutik"} · ${business.address ?? ""}. Kòmande fasil sou WhatsApp.`,
    openGraph: {
      title: business.name,
      description: "Kòmande fasil sou WhatsApp.",
      images: business.cover_url ? [business.cover_url] : [],
    },
  };
}
