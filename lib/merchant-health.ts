// Diagnostic d'un compte marchand, pour le support.
//
// Chaque contrôle répond à une question qu'un marchand pose au téléphone :
// « pourquoi ma vitrine est vide ? », « pourquoi personne ne peut me payer ? »,
// « pourquoi mon bénéfice est à zéro ? ». Les contrôles ne lisent que des
// données déjà chargées par la console : aucun appel supplémentaire.

export type IssueCode =
  | "suspended"
  | "noProducts"
  | "noPayMethod"
  | "noPhone"
  | "noCover"
  | "noDelivery"
  | "planExpired"
  | "noOrders"
  | "stale"
  | "noStock"
  | "noCosts"
  | "neverSignedIn";

export type IssueLevel = "blocker" | "warning" | "info";

export interface HealthInput {
  suspendedAt?: string | null;
  products: number;
  orders: number;
  /** Date de la dernière commande, `null` si aucune (ou migration 3 absente). */
  lastOrderAt?: string | null;
  createdAt: string;
  plan: string;
  planUntil?: string | null;
  phone?: string | null;
  coverUrl?: string | null;
  deliveryZones?: unknown[] | null;
  hasPayMethod: boolean;
  /** Produits dont la quantité est suivie. */
  trackedProducts?: number;
  /** Produits avec un prix d'achat saisi. */
  productsWithCost?: number;
  lastSignInAt?: string | null;
}

export interface Issue {
  code: IssueCode;
  level: IssueLevel;
}

const DAY = 86_400_000;
/** Une boutique sans commande depuis ce délai est probablement en train de partir. */
export const STALE_DAYS = 15;
/** Délai laissé à une nouvelle boutique avant de signaler l'absence de commande. */
const GRACE_DAYS = 7;

export function merchantIssues(m: HealthInput, now = Date.now()): Issue[] {
  const issues: Issue[] = [];
  const add = (code: IssueCode, level: IssueLevel) => issues.push({ code, level });
  const age = (iso?: string | null) => (iso ? (now - new Date(iso).getTime()) / DAY : null);

  if (m.suspendedAt) add("suspended", "blocker");

  // Ce qui empêche de vendre.
  if (m.products === 0) add("noProducts", "blocker");
  if (!m.hasPayMethod) add("noPayMethod", "blocker");
  if (!m.phone?.trim()) add("noPhone", "blocker");

  const planAge = age(m.planUntil);
  if (m.plan !== "gratis" && planAge !== null && planAge > 0) add("planExpired", "blocker");

  // Ce qui limite les ventes.
  if (!m.coverUrl) add("noCover", "info");
  if (!m.deliveryZones || m.deliveryZones.length === 0) add("noDelivery", "info");

  const signInAge = age(m.lastSignInAt);
  if (m.lastSignInAt === null || m.lastSignInAt === undefined) {
    // Information inconnue : on ne conclut rien.
  } else if (signInAge !== null && signInAge > STALE_DAYS) {
    add("neverSignedIn", "warning");
  }

  const createdAge = age(m.createdAt) ?? 0;
  const orderAge = age(m.lastOrderAt);
  if (m.orders === 0 && createdAge > GRACE_DAYS) add("noOrders", "warning");
  else if (orderAge !== null && orderAge > STALE_DAYS) add("stale", "warning");

  // Ce qui fausse les chiffres.
  if (m.products > 0 && (m.trackedProducts ?? 0) === 0) add("noStock", "info");
  if (m.products > 0 && (m.productsWithCost ?? 0) === 0) add("noCosts", "info");

  return issues;
}

/** Niveau le plus grave, pour trier et colorer la liste des marchands. */
export function worstLevel(issues: Issue[]): IssueLevel | null {
  if (issues.some((i) => i.level === "blocker")) return "blocker";
  if (issues.some((i) => i.level === "warning")) return "warning";
  return issues.length > 0 ? "info" : null;
}
