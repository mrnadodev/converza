// Premiers pas d'une boutique, vus par le marchand lui-même.
//
// L'entonnoir de la console le dit sans ambiguïté : le plus gros décrochage se
// produit entre le compte créé et le premier produit publié. Un marchand qui
// repart sans rien publier a une vitrine vide, donc aucune commande, donc
// aucune raison de revenir — et cela arrive aussi à des marchands qui paient.
//
// Les mêmes signaux servent à la console (lib/merchant-health.ts), mais ici ils
// s'adressent au marchand : chaque ligne est une action à faire, pas un
// diagnostic.

export type SetupStepKey = "products" | "image" | "payments" | "delivery" | "share";

export interface SetupInput {
  activeProducts: number;
  coverUrl: string | null | undefined;
  logoUrl: string | null | undefined;
  hasPayMethod: boolean;
  deliveryZones: number;
  /** Une commande reçue prouve que le lien a circulé. */
  orders: number;
}

export interface SetupStep {
  key: SetupStepKey;
  done: boolean;
  /** Où le marchand doit aller pour la faire. */
  href: string;
  /** Sans elle, la vitrine ne peut pas vendre. */
  essential: boolean;
}

const STEPS: { key: SetupStepKey; href: string; essential: boolean }[] = [
  { key: "products", href: "/katalog", essential: true },
  { key: "image", href: "/reglaj", essential: false },
  { key: "payments", href: "/reglaj", essential: true },
  { key: "delivery", href: "/reglaj", essential: false },
  { key: "share", href: "", essential: true },
];

export function setupSteps(input: SetupInput): SetupStep[] {
  const done: Record<SetupStepKey, boolean> = {
    products: input.activeProducts > 0,
    image: Boolean(input.coverUrl || input.logoUrl),
    payments: input.hasPayMethod,
    delivery: input.deliveryZones > 0,
    share: input.orders > 0,
  };
  return STEPS.map((s) => ({ ...s, done: done[s.key] }));
}

/** Nombre d'étapes faites, et la prochaine à faire. */
export function setupProgress(steps: SetupStep[]): { done: number; total: number; next: SetupStep | null } {
  const done = steps.filter((s) => s.done).length;
  // On propose d'abord ce qui empêche de vendre, dans l'ordre du parcours.
  const next = steps.find((s) => !s.done && s.essential) ?? steps.find((s) => !s.done) ?? null;
  return { done, total: steps.length, next };
}

/** Rien n'est encore fait : la boutique n'a jamais servi. */
export function isFreshShop(steps: SetupStep[]): boolean {
  return steps.every((s) => !s.done);
}

/** La vitrine peut vendre : produit, moyen de paiement, et le lien partagé. */
export function canSell(steps: SetupStep[]): boolean {
  return steps.filter((s) => s.essential && s.key !== "share").every((s) => s.done);
}
