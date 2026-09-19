import { effectivePlan } from "./plans";

// Parcours d'un marchand, de l'inscription au premier paiement encaissé.
//
// La console savait combien de marchands existaient, pas où ils s'arrêtaient.
// Un compte créé qui ne publie jamais un produit, une boutique qui ne reçoit
// jamais de commande : ce sont deux problèmes différents, et ils ne se
// corrigent pas de la même façon.
//
// Tout se calcule à partir de ce que la base contient déjà : aucune mesure
// d'audience, aucun traceur.

export type FunnelStepKey = "signup" | "signedIn" | "catalog" | "firstOrder" | "cash" | "paying";

export const FUNNEL_STEPS: FunnelStepKey[] = ["signup", "signedIn", "catalog", "firstOrder", "cash", "paying"];

export interface FunnelInput {
  createdAt: string;
  lastSignInAt: string | null;
  products: number;
  orders: number;
  paidCents: number | null;
  plan: string;
  planUntil: string | null;
  firstOrderAt: string | null;
}

export interface FunnelStep {
  key: FunnelStepKey;
  /** Marchands ayant atteint cette étape. */
  count: number;
  /** Part de l'ensemble des inscrits. */
  pctOfTotal: number;
  /** Part de ceux qui avaient atteint l'étape précédente. */
  pctOfPrevious: number;
  /** Marchands perdus entre l'étape précédente et celle-ci. */
  lost: number;
}

export interface Cohort {
  /** Mois d'inscription, au format AAAA-MM. */
  month: string;
  signups: number;
  catalog: number;
  firstOrder: number;
  paying: number;
}

export interface FunnelResult {
  total: number;
  steps: FunnelStep[];
  /** Délai médian entre l'inscription et la première commande, en jours. */
  medianDaysToFirstOrder: number | null;
  /** Étape où le plus de monde s'arrête, hors inscription. */
  worstStep: FunnelStepKey | null;
  /**
   * Marchands qui paient un abonnement mais se sont arrêtés plus tôt dans le
   * parcours — une boutique vide qui paie tous les mois est un départ annoncé.
   */
  payingButStalled: number;
  cohorts: Cohort[];
}

const DAY = 86_400_000;

/** Conditions brutes, dans l'ordre du parcours. */
function conditions(m: FunnelInput, now: Date): boolean[] {
  return [
    true, // le compte existe
    Boolean(m.lastSignInAt),
    m.products > 0,
    m.orders > 0,
    (m.paidCents ?? 0) > 0,
    effectivePlan(m.plan, m.planUntil, now) !== "gratis",
  ];
}

/**
 * Une étape n'est atteinte que si toutes les précédentes le sont : un entonnoir
 * dont une étape est plus large que celle d'avant ne se lit pas. Un marchand
 * qui a encaissé mais dont le catalogue a été vidé depuis compte donc comme
 * arrêté au catalogue — ce qui est aussi ce qu'il faut aller regarder.
 */
function reached(m: FunnelInput, now: Date): boolean[] {
  const raw = conditions(m, now);
  const out: boolean[] = [];
  let alive = true;
  for (const ok of raw) {
    alive = alive && ok;
    out.push(alive);
  }
  return out;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10;
}

const monthOf = (iso: string) => iso.slice(0, 7);

export function buildFunnel(merchants: FunnelInput[], now: Date = new Date(), cohortMonths = 6): FunnelResult {
  const total = merchants.length;
  const matrix = merchants.map((m) => reached(m, now));

  const steps: FunnelStep[] = FUNNEL_STEPS.map((key, i) => {
    const count = matrix.reduce((n, row) => n + (row[i] ? 1 : 0), 0);
    const previous = i === 0 ? total : matrix.reduce((n, row) => n + (row[i - 1] ? 1 : 0), 0);
    return {
      key,
      count,
      pctOfTotal: total ? Math.round((count / total) * 100) : 0,
      pctOfPrevious: previous ? Math.round((count / previous) * 100) : 0,
      lost: Math.max(previous - count, 0),
    };
  });

  // L'étape qui coûte le plus de marchands, hors inscription : c'est par elle
  // qu'il faut commencer.
  const worst = steps.slice(1).reduce<FunnelStep | null>((acc, s) => (acc === null || s.lost > acc.lost ? s : acc), null);

  // Un décalage de quelques heures (données de démonstration, fuseau, reprise)
  // compte comme une vente le jour même. Au-delà d'un jour en arrière, il
  // s'agit d'un historique importé : la durée ne veut plus rien dire, on
  // l'écarte plutôt que de la ramener à zéro.
  const delays = merchants
    .filter((m) => m.firstOrderAt)
    .map((m) => (Date.parse(m.firstOrderAt as string) - Date.parse(m.createdAt)) / DAY)
    .filter((d) => Number.isFinite(d) && d > -1)
    .map((d) => Math.round(Math.max(d, 0) * 10) / 10);

  // Cohortes : les marchands inscrits le même mois vieillissent ensemble.
  const months = new Map<string, FunnelInput[]>();
  for (const m of merchants) {
    const key = monthOf(m.createdAt);
    months.set(key, [...(months.get(key) ?? []), m]);
  }
  const cohorts = [...months.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, cohortMonths)
    .map(([month, rows]) => {
      const flags = rows.map((m) => reached(m, now));
      const at = (i: number) => flags.reduce((n, row) => n + (row[i] ? 1 : 0), 0);
      return { month, signups: rows.length, catalog: at(2), firstOrder: at(3), paying: at(5) };
    });

  // Abonnés qui ne franchissent pas toutes les étapes : le compte payant
  // existe, la boutique ne tourne pas.
  const rawPaying = merchants.reduce((n, m) => n + (conditions(m, now)[5] ? 1 : 0), 0);

  return {
    total,
    steps,
    medianDaysToFirstOrder: median(delays),
    worstStep: worst && worst.lost > 0 ? worst.key : null,
    payingButStalled: Math.max(rawPaying - steps[steps.length - 1].count, 0),
    cohorts,
  };
}
