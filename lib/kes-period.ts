// Périodes et catégories de la Kès, sans dépendance serveur (testable).

export type KesPeriod = "day" | "week" | "month";
export const KES_PERIODS: KesPeriod[] = ["day", "week", "month"];

export const EXPENSE_CATEGORIES = ["loyer", "transport", "electricite", "communication", "salaire", "emballage", "publicite", "autre"] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

const TZ = "America/Port-au-Prince";

/** Début de la période (minuit, heure d'Haïti), en ISO avec son décalage. */
export function periodStart(period: KesPeriod, now = new Date()): { iso: string; date: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short", timeZoneName: "shortOffset" })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  // « GMT-4 » ou « GMT-5 » selon l'heure d'été.
  const offsetHours = Number((parts.timeZoneName ?? "GMT-5").replace("GMT", "") || "-5");
  const local = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
  if (period === "week") {
    // Semaine du lundi au dimanche.
    const dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(parts.weekday);
    local.setUTCDate(local.getUTCDate() - Math.max(dow, 0));
  } else if (period === "month") {
    local.setUTCDate(1);
  }
  const date = local.toISOString().slice(0, 10);
  const sign = offsetHours < 0 ? "-" : "+";
  const hh = String(Math.abs(offsetHours)).padStart(2, "0");
  return { iso: `${date}T00:00:00${sign}${hh}:00`, date };
}
