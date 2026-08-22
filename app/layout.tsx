import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PWARegister } from "@/components/PWARegister";

export const metadata: Metadata = {
  title: "CONVERZA — Jere vant WhatsApp ou",
  description:
    "WhatsApp Sales & Customer Management pou biznis an Ayiti. Jere kliyan, kòmand ak katalòg ou nan yon sèl kote.",
  manifest: "/manifest.webmanifest",
  applicationName: "CONVERZA",
  icons: {
    icon: [{ url: "/cvz-icon.svg", type: "image/svg+xml" }, { url: "/cvz-icon-192.png", sizes: "192x192" }],
    apple: [{ url: "/cvz-apple.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CONVERZA",
  },
};

export const viewport: Viewport = {
  themeColor: "#008069",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // gère l'encoche iPhone (safe-area)
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ht">
      <body className="font-sans text-ink">
        <div className="app-shell">{children}</div>
        <PWARegister />
      </body>
    </html>
  );
}
