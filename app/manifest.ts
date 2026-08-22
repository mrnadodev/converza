import type { MetadataRoute } from "next";

// PWA installable sur le téléphone (léger, marche en mode dégradé).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CONVERZA",
    short_name: "CONVERZA",
    description: "Jere vant WhatsApp ou nan yon sèl kote.",
    start_url: "/",
    display: "standalone",
    background_color: "#EFEAE2",
    theme_color: "#008069",
    lang: "ht",
    icons: [
      // TODO: remplacer par le vrai logo (192x192 et 512x512) dans /public.
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
