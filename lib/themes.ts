// Thèmes visuels de la vitrine. Un secteur propose un thème par défaut,
// mais le owner peut le changer dans les réglages.

export interface Theme {
  label: string;
  cover: string; // dégradé de la bannière (si pas de photo)
  accent: string; // couleur d'accent (titres, boutons secondaires)
  accentSoft: string; // fond doux (pills, boutons secondaires)
  accentText: string; // texte sur fond doux
}

export const THEMES: Record<string, Theme> = {
  whatsapp: {
    label: "WhatsApp (vèt)",
    cover: "radial-gradient(120% 90% at 80% -10%, #12B886 0%, transparent 55%), linear-gradient(135deg, #008069 0%, #0B6B57 100%)",
    accent: "#008069",
    accentSoft: "#E7F7F1",
    accentText: "#0B6B57",
  },
  midnight: {
    label: "Fintech (ble)",
    cover: "radial-gradient(120% 90% at 80% -10%, #3B82F6 0%, transparent 55%), linear-gradient(135deg, #0B1F3A 0%, #1E3A8A 100%)",
    accent: "#1E3A8A",
    accentSoft: "#E7EDFB",
    accentText: "#1E3A8A",
  },
  sunset: {
    label: "Ayiti Bold",
    cover: "radial-gradient(120% 90% at 80% -10%, #F59E0B 0%, transparent 55%), linear-gradient(135deg, #B91C1C 0%, #F59E0B 100%)",
    accent: "#B91C1C",
    accentSoft: "#FDECEC",
    accentText: "#B91C1C",
  },
  elegant: {
    label: "Elegan (nwa/lò)",
    cover: "radial-gradient(120% 90% at 80% -10%, #B7791F 0%, transparent 55%), linear-gradient(135deg, #111827 0%, #374151 100%)",
    accent: "#B7791F",
    accentSoft: "#FBF3E2",
    accentText: "#8A5A1E",
  },
};

export function themeOf(key: string | null | undefined): Theme {
  return THEMES[key ?? "whatsapp"] ?? THEMES.whatsapp;
}
