import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PWARegister } from "@/components/PWARegister";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageContext";

export const metadata: Metadata = {
  title: "CONVERZA — Gestion des Ventes & Clients WhatsApp",
  description:
    "Plateforme de gestion de ventes WhatsApp. Gérez vos clients, commandes et catalogue en un seul endroit.",
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
    <html lang="fr">
      <body className="font-sans text-ink">
        <LanguageProvider>
          <ThemeProvider>
            <div className="app-shell">{children}</div>
            <PWARegister />
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
