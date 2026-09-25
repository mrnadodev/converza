import { describe, expect, it } from "vitest";
import { collectDebts, isSettled, owedTotalOf, type DunningOrder } from "./dunning";
import type { OrderStatus } from "./types";

const now = new Date("2026-09-19T12:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString();

const order = (over: Partial<DunningOrder> = {}): DunningOrder => ({
  id: "o1",
  ref: "CMD-1",
  status: "livre" as OrderStatus,
  customerName: "Wideline",
  customerPhone: "+50937000000",
  totalCents: 100_000,
  owedCents: 100_000,
  created_at: daysAgo(5),
  ...over,
});

describe("créances à recouvrer", () => {
  it("ne compte pas une simple demande d'achat comme une dette", () => {
    // Le client a demandé un prix, il n'a rien promis : ce n'est pas un impayé.
    const s = collectDebts([order({ status: "demand_acha" }), order({ id: "o2", status: "kontak" })], now);
    expect(s.count).toBe(0);
    expect(s.totalOwedCents).toBe(0);
  });

  it("compte ce qui est engagé : paiement convenu, confirmé, en route, livré, en recouvrement", () => {
    const statuses: OrderStatus[] = ["metod_peman", "konfime_peman", "sou_wout", "livre", "swivi"];
    const s = collectDebts(
      statuses.map((status, i) => order({ id: "o" + i, status, owedCents: 10_000 })),
      now,
    );
    expect(s.count).toBe(5);
    expect(s.totalOwedCents).toBe(50_000);
  });

  it("ignore une commande entièrement payée", () => {
    expect(collectDebts([order({ owedCents: 0 })], now).count).toBe(0);
  });

  it("traite le plus ancien avant le plus gros", () => {
    const s = collectDebts(
      [
        order({ id: "grosse", owedCents: 900_000, created_at: daysAgo(1) }),
        order({ id: "vieille", owedCents: 20_000, created_at: daysAgo(30) }),
        order({ id: "moyenne", owedCents: 50_000, created_at: daysAgo(6) }),
      ],
      now,
    );
    expect(s.debts.map((d) => d.id)).toEqual(["vieille", "moyenne", "grosse"]);
  });

  it("classe par ancienneté, et range les plus gros montants d'abord à âge égal", () => {
    const s = collectDebts(
      [
        order({ id: "petite", owedCents: 10_000, created_at: daysAgo(20) }),
        order({ id: "grande", owedCents: 80_000, created_at: daysAgo(20) }),
      ],
      now,
    );
    expect(s.debts.map((d) => d.id)).toEqual(["grande", "petite"]);
    expect(s.byTier.old).toEqual({ count: 2, cents: 90_000 });
  });

  it("laisse respirer une commande d'hier", () => {
    const s = collectDebts([order({ created_at: daysAgo(1) })], now);
    expect(s.debts[0].tier).toBe("fresh");
    expect(s.byTier.fresh.count).toBe(1);
  });

  it("signale les créances sans numéro, impossibles à relancer d'ici", () => {
    const s = collectDebts([order({ customerPhone: null }), order({ id: "o2", customerPhone: "  " })], now);
    expect(s.unreachable).toBe(2);
    expect(s.debts.every((d) => d.reachable)).toBe(false);
  });

  it("donne l'ancienneté de la plus vieille créance", () => {
    const s = collectDebts([order({ created_at: daysAgo(3) }), order({ id: "o2", created_at: daysAgo(41) })], now);
    expect(s.oldestDays).toBe(41);
  });

  it("ne bronche pas sur une date illisible ni sur une liste vide", () => {
    expect(collectDebts([], now)).toMatchObject({ count: 0, totalOwedCents: 0, oldestDays: 0 });
    const s = collectDebts([order({ created_at: "pas une date" })], now);
    expect(s.debts[0].ageDays).toBe(0);
  });

  it("le total du tableau de bord suit la même règle", () => {
    const orders = [order({ owedCents: 30_000 }), order({ id: "o2", status: "demand_acha", owedCents: 900_000 })];
    expect(owedTotalOf(orders, now)).toBe(30_000);
  });
});

describe("une commande réglée n'est jamais une créance", () => {
  // Le tableau de bord affichait la même commande « payée » dans l'entonnoir
  // et « à recouvrer » dix lignes plus haut. Les deux lectures sont ici,
  // côte à côte, pour qu'elles ne puissent plus diverger.
  const vendue = (status: OrderStatus, total: number, paye: number) => ({
    id: "o1", ref: "CMD-1", status, customerName: "Client",
    customerPhone: null, totalCents: total, owedCents: Math.max(total - paye, 0),
    created_at: new Date().toISOString(),
  });

  it("une livraison à crédit est due, pas encaissée", () => {
    const o = vendue("livre", 1_800_000, 0);
    expect(isSettled(o.status, o.totalCents, 0)).toBe(false);
    expect(collectDebts([o]).count).toBe(1);
  });

  it("une livraison réglée est encaissée, et ne se relance plus", () => {
    const o = vendue("livre", 1_800_000, 1_800_000);
    expect(isSettled(o.status, o.totalCents, 1_800_000)).toBe(true);
    expect(collectDebts([o]).count).toBe(0);
  });

  it("aucun statut ne peut être à la fois encaissé et dû", () => {
    const statuses: OrderStatus[] = ["demand_acha", "kontak", "metod_peman", "konfime_peman", "sou_wout", "livre", "swivi", "pou_konfime", "peye"];
    for (const status of statuses) {
      for (const paye of [0, 500_000, 1_000_000]) {
        const o = vendue(status, 1_000_000, paye);
        const encaisse = isSettled(status, o.totalCents, paye);
        const due = collectDebts([o]).count > 0;
        expect(encaisse && due, `${status} payé ${paye}`).toBe(false);
      }
    }
  });
});
