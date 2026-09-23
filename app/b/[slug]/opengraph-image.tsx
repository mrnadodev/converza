import { ImageResponse } from "next/og";
import { paletteFor } from "@/lib/storefront-designs";

// Vignette du lien partagé sur WhatsApp, Facebook ou TikTok.
//
// C'est la première chose qu'un client voit : avant la vitrine, avant les
// prix. Jusqu'ici, une boutique sans photo de couverture partageait un lien nu,
// sans image ni couleur — le message ressemblait à un lien suspect.
//
// La vignette reprend l'identité du marchand : son logo, sa photo de
// couverture quand il en a une, et la couleur de son secteur.

// Mode edge : l'image se génère au plus près du visiteur, et la police
// intégrée se charge sans passer par le système de fichiers (en mode Node,
// elle échouait sous Windows).
export const runtime = "edge";
export const alt = "Boutique sur CONVERZA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Les réseaux sociaux relisent rarement la vignette : une heure de cache
// suffit à suivre un changement de logo sans refabriquer l'image à chaque
// partage.
export const revalidate = 3600;

// Le moteur de rendu ne sait lire que le PNG et le JPEG. Or l'application
// enregistre les photos en WebP pour alléger la vitrine : une boutique dont la
// couverture était un .webp partageait donc un lien sans image — c'était le cas
// de la plupart des comptes récents. Supabase sait reconvertir un fichier
// stocké à la volée ; on passe par là, puis on intègre l'image dans la carte
// sous forme de données, pour que le rendu ne dépende plus d'un téléchargement
// qui peut échouer en silence.
const RENDERABLE = /^image\/(png|jpeg)$/;
const MAX_BYTES = 3_000_000;

async function inlineImage(raw: string | null, width: number, height: number): Promise<string | null> {
  if (typeof raw !== "string" || !raw.startsWith("http")) return null;

  const converted = raw.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
  const candidates = [raw];
  if (converted !== raw) candidates.push(`${converted}?width=${width}&height=${height}&resize=cover`);

  for (const href of candidates) {
    // Sans « image/webp » dans l'en-tête, Supabase renvoie du JPEG.
    const res = await fetch(href, { headers: { Accept: "image/png,image/jpeg" } }).catch(() => null);
    if (!res || !res.ok) continue;

    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!RENDERABLE.test(type)) continue;

    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length === 0 || bytes.length > MAX_BYTES) continue;

    let binary = "";
    for (let i = 0; i < bytes.length; i += 8192) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    }
    return `data:${type};base64,${btoa(binary)}`;
  }
  return null;
}

export default async function Image({ params }: { params: { slug: string } }) {
  let name = params.slug.replace(/-/g, " ");
  let category: string | null = null;
  let address: string | null = null;
  let sector: string | null = null;
  let coverUrl: string | null = null;
  let logoUrl: string | null = null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const res = await fetch(
      `${url}/rest/v1/public_businesses?select=name,category,address,business_type,cover_url,logo_url&slug=eq.${encodeURIComponent(params.slug)}&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    ).catch(() => null);
    const rows = res && res.ok ? ((await res.json()) as Record<string, string | null>[]) : [];
    const data = rows[0];
    if (data) {
      name = data.name ?? name;
      category = data.category ?? null;
      address = data.address ?? null;
      sector = data.business_type ?? null;
      coverUrl = data.cover_url ?? null;
      logoUrl = data.logo_url ?? null;
    }
  }

  const [cover, logo] = await Promise.all([inlineImage(coverUrl, 1200, 400), inlineImage(logoUrl, 320, 320)]);

  const palette = paletteFor(sector);
  const where = [category, address].filter(Boolean).join(" · ");

  // Deux dispositions. Avec une photo : la photo en haut, un bandeau de
  // couleur en bas pour le logo et le nom. Beaucoup de couvertures sont déjà
  // des affiches chargées de texte ; écrire par-dessus les rendait illisibles.
  // Sans photo : une carte pleine aux couleurs du secteur, logo en évidence.
  // Le logo mange une bonne part du bandeau : le nom se resserre pour que le
  // bouton WhatsApp reste entier, quelle que soit la longueur de l’enseigne.
  const room = logo ? name.length + 8 : name.length;
  const nameSize = room > 26 ? 46 : room > 16 ? 56 : 68;

  const logoBox = (side: number) =>
    logo ? (
      <div
        style={{
          display: "flex",
          width: side,
          height: side,
          background: "#FFFFFF",
          borderRadius: 28,
          padding: 12,
          flexShrink: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="" width={side - 24} height={side - 24} style={{ width: side - 24, height: side - 24, objectFit: "contain" }} />
      </div>
    ) : null;

  const cta = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 14, flexShrink: 0 }}>
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
  );

  const identity = (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", fontSize: nameSize, fontWeight: 900, color: "#FFFFFF", lineHeight: 1.05, letterSpacing: -1 }}>
        {name}
      </div>
      {where && <div style={{ display: "flex", fontSize: 28, color: "rgba(255,255,255,0.86)" }}>{where}</div>}
    </div>
  );

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: 1200, height: 630, background: palette.strong, fontFamily: "sans-serif" }}>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" width={1200} height={400} style={{ width: 1200, height: 400, objectFit: "cover" }} />
        )}
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
          <div style={{ display: "flex", alignItems: "center", gap: 28, flex: 1, minWidth: 0 }}>
            {logoBox(cover ? 150 : 200)}
            {identity}
          </div>
          {cta}
        </div>
      </div>
    ),
    size,
  );
}
