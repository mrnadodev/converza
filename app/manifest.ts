import type { MetadataRoute } from "next";

// PWA installable sur Android, iPhone, laptop, iPad, tablette.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PASRÈL",
    short_name: "PASRÈL",
    description: "Jere vant WhatsApp ou nan yon sèl kote.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#EFEAE2",
    theme_color: "#008069",
    lang: "ht",
    icons: [
      { src: "/pasrel-icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/pasrel-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/pasrel-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
