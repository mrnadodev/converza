import type { Language } from "./translations";

// Écran d'un compte suspendu par CONVERZA.

export interface SuspendedCopy {
  title: string;
  body: (name: string, date: string) => string;
  reason: string;
  dataSafe: string;
  signOut: string;
}

export const SUSPENDED_COPY: Record<Language, SuspendedCopy> = {
  fr: {
    title: "Compte suspendu",
    body: (name, date) => `L'accès à ${name} est suspendu depuis le ${date}. Écrivez à CONVERZA pour le rétablir.`,
    reason: "Motif",
    dataSafe: "Vos produits, vos commandes et vos clients sont conservés : rien n'est supprimé.",
    signOut: "Se déconnecter",
  },
  ht: {
    title: "Kont sispann",
    body: (name, date) => `Aksè ${name} sispann depi ${date}. Ekri CONVERZA pou remete l.`,
    reason: "Rezon",
    dataSafe: "Pwodwi, kòmand ak kliyan ou yo konsève : anyen pa efase.",
    signOut: "Dekonekte",
  },
  en: {
    title: "Account suspended",
    body: (name, date) => `Access to ${name} has been suspended since ${date}. Contact CONVERZA to restore it.`,
    reason: "Reason",
    dataSafe: "Your products, orders and customers are kept: nothing is deleted.",
    signOut: "Sign out",
  },
};
