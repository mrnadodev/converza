import type { Language } from "../translations";

// Textes du diaporama vidéo.
//
// Le format est annoncé franchement : un WebM envoyé à un iPhone arrive comme
// un fichier mort, et mieux vaut que le marchand le sache avant de publier que
// de découvrir un statut que personne n'a pu ouvrir.

export interface ReelCopy {
  title: string;
  subtitle: (n: number, secondes: number) => string;
  close: string;
  style: string;
  styles: { shop: string; dark: string; light: string };
  pick: (max: number) => string;
  empty: string;
  export: string;
  recording: string;
  failed: string;
  unsupported: string;
  formatMp4: string;
  formatWebm: string;
}

const fr: ReelCopy = {
  title: "Vidéo de vos produits",
  subtitle: (n, s) => (n === 0 ? "Choisissez des produits" : `${n} produit${n > 1 ? "s" : ""} · ${s} secondes`),
  close: "Fermer",
  style: "Style",
  styles: { shop: "Couleurs de ma boutique", dark: "Fond sombre", light: "Fond clair" },
  pick: (max) => `Produits à montrer (${max} au maximum)`,
  empty: "Choisissez au moins un produit.",
  export: "Créer la vidéo",
  recording: "Création de la vidéo…",
  failed: "La vidéo n'a pas pu être créée. Réessayez.",
  unsupported: "Ce navigateur ne sait pas enregistrer de vidéo. Essayez depuis Chrome sur votre téléphone.",
  formatMp4: "Format MP4 : se publie partout, WhatsApp comme Facebook.",
  formatWebm: "Votre navigateur ne produit que du WebM. Android l'accepte, un iPhone non : publiez depuis Chrome sur téléphone pour obtenir du MP4.",
};

const ht: ReelCopy = {
  title: "Videyo pwodwi ou yo",
  subtitle: (n, s) => (n === 0 ? "Chwazi pwodwi" : `${n} pwodwi · ${s} segonn`),
  close: "Fèmen",
  style: "Stil",
  styles: { shop: "Koulè boutik mwen", dark: "Fon fonse", light: "Fon klè" },
  pick: (max) => `Pwodwi pou montre (${max} maksimòm)`,
  empty: "Chwazi omwen yon pwodwi.",
  export: "Kreye videyo a",
  recording: "N ap kreye videyo a…",
  failed: "Nou pa rive kreye videyo a. Eseye ankò.",
  unsupported: "Navigatè sa a pa ka anrejistre videyo. Eseye ak Chrome sou telefòn ou.",
  formatMp4: "Fòma MP4 : li pibliye toupatou, sou WhatsApp kou Facebook.",
  formatWebm: "Navigatè ou a bay sèlman WebM. Android aksepte l, iPhone non : sèvi ak Chrome sou telefòn pou jwenn MP4.",
};

const en: ReelCopy = {
  title: "Video of your products",
  subtitle: (n, s) => (n === 0 ? "Choose some products" : `${n} product${n > 1 ? "s" : ""} · ${s} seconds`),
  close: "Close",
  style: "Style",
  styles: { shop: "My shop colours", dark: "Dark background", light: "Light background" },
  pick: (max) => `Products to show (${max} at most)`,
  empty: "Choose at least one product.",
  export: "Create the video",
  recording: "Creating the video…",
  failed: "The video could not be created. Please try again.",
  unsupported: "This browser cannot record video. Try Chrome on your phone.",
  formatMp4: "MP4 format: publishes everywhere, WhatsApp and Facebook alike.",
  formatWebm: "Your browser only produces WebM. Android accepts it, an iPhone does not: use Chrome on a phone to get MP4.",
};

export const REEL_COPY: Record<Language, ReelCopy> = { fr, ht, en };
