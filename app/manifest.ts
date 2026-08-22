import type { MetadataRoute } from "next";

// PWA installable sur Android, iPhone, laptop, iPad, tablette.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CONVERZA",
    short_name: "CONVERZA",
    description: "Jere vant WhatsApp ou nan yon sèl kote.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#EFEAE2",
    theme_color: "#008069",
    lang: "ht",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
