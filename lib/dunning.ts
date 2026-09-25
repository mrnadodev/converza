import type { OrderStatus } from "./types";

// Recouvrement : ce qu'un marchand doit aller chercher, et dans quel ordre.
//
// Un client qui a déjà commandé se convainc plus facilement qu'un inconnu, mais
// encore faut-il savoir qui rappeler. Jusqu'ici le tableau de bord affichait un
// seul nombre, « reste à encaisser », sans dire de qui il venait ni depuis
// combien de temps il traînait.
//
// Une dette n'existe qu'à partir du moment où le marchand s'est engagé :
// moyen de paiement convenu, commande confirmée, en route, livrée, ou en
// recouvrement. Une simple demande d'achat n'est pas une créance — la compter
// gonflait le chiffre et faisait relancer des gens qui n'avaient rien promis.

export const DEBT_STATUSES: OrderStatus[] = ["metod_peman", "konfime_peman", "sou_wout", "livre", "swivi"];

/**
 * Une commande est réglée quand l'argent est rentré — pas quand elle a avancé.
 *
 * Cette règle vit ici, contre DEBT_STATUSES, parce que les deux se répondent :
 * une commande réglée ne doit jamais apparaître dans les créances, et une
 * créance ne doit jamais être comptée comme un encaissement. Quand les deux
 * définitions vivaient dans deux fichiers, le tableau de bord affichait une
 * commande « payée » dans l'entonnoir et « à recouvrer » dix lignes plus haut.
 *
 * Le statut « peye » compte pour lui-même : certaines commandes sont marquées
 * réglées sans que le montant soit inscrit.
 */
export function isSettled(status: OrderStatus, totalCents: number, amountPaidCents: number): boolean {
  if (status === "peye") return true;
  return totalCents > 0 && amountPaidCents >= totalCents;
}

/** Au-delà, la dette est ancienne : plus elle vieillit, moins elle rentre. */
export const OLD_DAYS = 14;
/** En deçà, on laisse le client respirer. */
export const FRESH_DAYS = 3;

export type DebtTier = "fresh" | "due" | "old";

export interface DunningOrder {
  id: string;
  ref: string;
  status: OrderStatus;
  customerName: string;
  customerPhone: string | null;
  totalCents: number;
  owedCents: number;
  created_at: string;
}

export interface Debt extends DunningOrder {
  ageDays: number;
  tier: DebtTier;
  /** Faute de numéro, le marchand ne peut pas relancer depuis l'application. */
  reachable: boolean;
}

export interface DunningSummary {
  debts: Debt[];
  totalOwedCents: number;
  count: number;
  oldestDays: number;
  /** Montant par ancienneté, pour dire ce qui est en train de se perdre. */
  byTier: Record<DebtTier, { count: number; cents: number }>;
  /** Créances sans numéro de téléphone : impossibles à relancer d'ici. */
  unreachable: number;
}

const DAY = 86_400_000;

function tierOf(ageDays: number): DebtTier {
  if (ageDays < FRESH_DAYS) return "fresh";
  return ageDays >= OLD_DAYS ? "old" : "due";
}

/**
 * Trie les créances par ce qu'il faut traiter en premier : l'ancienneté
 * d'abord, parce qu'une vieille dette s'efface, puis le montant.
 */
export function collectDebts(orders: DunningOrder[], now: Date = new Date()): DunningSummary {
  const debts: Debt[] = orders
    .filter((o) => o.owedCents > 0 && DEBT_STATUSES.includes(o.status))
    .map((o) => {
      const parsed = Date.parse(o.created_at);
      const ageDays = Number.isFinite(parsed) ? Math.max(Math.floor((now.getTime() - parsed) / DAY), 0) : 0;
      return {
        ...o,
        ageDays,
        tier: tierOf(ageDays),
        reachable: Boolean(o.customerPhone && o.customerPhone.trim()),
      };
    })
    .sort((a, b) => {
      const rank = { old: 0, due: 1, fresh: 2 } as const;
      if (rank[a.tier] !== rank[b.tier]) return rank[a.tier] - rank[b.tier];
      return b.owedCents - a.owedCents;
    });

  const byTier: Record<DebtTier, { count: number; cents: number }> = {
    fresh: { count: 0, cents: 0 },
    due: { count: 0, cents: 0 },
    old: { count: 0, cents: 0 },
  };
  for (const d of debts) {
    byTier[d.tier].count++;
    byTier[d.tier].cents += d.owedCents;
  }

  return {
    debts,
    totalOwedCents: debts.reduce((n, d) => n + d.owedCents, 0),
    count: debts.length,
    oldestDays: debts.reduce((n, d) => Math.max(n, d.ageDays), 0),
    byTier,
    unreachable: debts.filter((d) => !d.reachable).length,
  };
}

/** Somme réellement due, pour le chiffre du tableau de bord. */
export function owedTotalOf(orders: DunningOrder[], now: Date = new Date()): number {
  return collectDebts(orders, now).totalOwedCents;
}
