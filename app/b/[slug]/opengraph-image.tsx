import { ImageResponse } from "next/og";
import { paletteFor } from "@/lib/storefront-designs";

// Vignette du lien partagé sur WhatsApp, Facebook ou TikTok.
//
// C'est la première chose qu'un client voit : avant la vitrine, avant les
// prix. Jusqu'ici, une boutique sans photo de couverture partageait un lien nu,
// sans image ni couleur — le message ressemblait à un lien suspect.
//
// La vignette reprend la couleur du secteur du marchand, sa photo quand il en
// a une, et dit en une ligne ce que le lien permet de faire.

// Mode edge : l'image se génère au plus près du visiteur, et la police
// intégrée se charge sans passer par le système de fichiers (en mode Node,
// elle échouait sous Windows).
export const runtime = "edge";
export const alt = "Boutique sur CONVERZA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  let name = params.slug.replace(/-/g, " ");
  let category: string | null = null;
  let address: string | null = null;
  let sector: string | null = null;
  let cover: string | null = null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const res = await fetch(
      `${url}/rest/v1/public_businesses?select=name,category,address,business_type,cover_url&slug=eq.${encodeURIComponent(params.slug)}&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    ).catch(() => null);
    const rows = res && res.ok ? ((await res.json()) as Record<string, string | null>[]) : [];
    const data = rows[0];
    if (data) {
      name = data.name ?? name;
      category = data.category ?? null;
      address = data.address ?? null;
      sector = data.business_type ?? null;
      cover = typeof data.cover_url === "string" && data.cover_url.startsWith("http") ? data.cover_url : null;
    }
  }

  const palette = paletteFor(sector);
  const where = [category, address].filter(Boolean).join(" · ");

  // Deux dispositions. Avec une photo : la photo en haut, un bandeau de
  // couleur en bas pour le nom. Beaucoup de couvertures sont déjà des affiches
  // chargées de texte ; écrire par-dessus les rendait illisibles. Sans photo :
  // une carte pleine aux couleurs du secteur.
  const nameSize = name.length > 26 ? 52 : name.length > 16 ? 62 : 72;

  const band = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 32,
        width: 1200,
        height: cover ? 230 : 630,
        padding: cover ? "0 64px" : "0 80px",
        background: cover ? palette.strong : `linear-gradient(135deg, ${palette.strong} 0%, ${palette.soft} 100%)`,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 760 }}>
        <div style={{ display: "flex", fontSize: nameSize, fontWeight: 900, color: "#FFFFFF", lineHeight: 1.05, letterSpacing: -1 }}>
          {name}
        </div>
        {where && <div style={{ display: "flex", fontSize: 28, color: "rgba(255,255,255,0.86)" }}>{where}</div>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 14 }}>
        <div
          style={{
            display: "flex",
            background: "#25D366",
            color: "#04231A",
            fontSize: 26,
            fontWeight: 800,
            padding: "14px 26px",
            borderRadius: 999,
          }}
        >
          Commandez sur WhatsApp
        </div>
        <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>converza</div>
      </div>
    </div>
  );

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: 1200, height: 630, background: palette.strong, fontFamily: "sans-serif" }}>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" width={1200} height={400} style={{ width: 1200, height: 400, objectFit: "cover" }} />
        )}
        {band}
      </div>
    ),
    size,
  );
}
