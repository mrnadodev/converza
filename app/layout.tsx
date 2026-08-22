import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CONVERZA — Jere vant WhatsApp ou",
  description:
    "WhatsApp Sales & Customer Management pou biznis an Ayiti. Jere kliyan, kòmand ak katalòg ou nan yon sèl kote.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#008069",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
      </body>
    </html>
  );
}
