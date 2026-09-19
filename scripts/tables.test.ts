import { describe, expect, it } from "vitest";
// Module .mjs partagé avec les scripts de sauvegarde et de réécriture.
import { TABLES, TABLE_NAMES, derivedTables, purgeOrder, restoreOrder, sensitiveTables } from "./tables.mjs";

type Table = { name: string; after: string[]; derived?: boolean; sensitive?: boolean };
const tables = TABLES as Table[];

// Une sauvegarde qui se réécrit dans le mauvais ordre échoue sur les clés
// étrangères, à moitié : c'est le pire des cas, une base incohérente.
describe("ordre de réécriture des tables", () => {
  it("place chaque table après celles dont elle dépend", () => {
    const seen = new Set<string>();
    for (const name of restoreOrder()) {
      const table = tables.find((t) => t.name === name)!;
      for (const dep of table.after) expect(seen.has(dep), `${name} avant ${dep}`).toBe(true);
      seen.add(name);
    }
  });

  it("ne déclare que des dépendances qui existent", () => {
    for (const t of tables) for (const dep of t.after) expect(TABLE_NAMES).toContain(dep);
  });

  it("garde l'ordre correct sur un sous-ensemble", () => {
    expect(restoreOrder(["order_items", "orders", "products", "businesses"])).toEqual([
      "businesses",
      "products",
      "orders",
      "order_items",
    ]);
  });

  it("accepte un sous-ensemble dont les dépendances sont absentes de la cible", () => {
    // On réécrit le catalogue seul : businesses existe déjà dans la base cible.
    expect(restoreOrder(["products"])).toEqual(["products"]);
  });

  it("supprime dans l'ordre inverse, pour ne casser aucun lien", () => {
    const purge = purgeOrder(["businesses", "products", "orders", "order_items"]);
    expect(purge.indexOf("order_items")).toBeLessThan(purge.indexOf("orders"));
    expect(purge.indexOf("orders")).toBeLessThan(purge.indexOf("businesses"));
  });

  it("écarte les tables que la base recalcule à partir des commandes", () => {
    expect(derivedTables()).toEqual(["order_payments", "stock_movements"]);
  });

  it("signale les tables à ne pas laisser traîner en clair", () => {
    // Prix d'achat (marges), pièces d'identité, coordonnées d'encaissement.
    expect(sensitiveTables()).toContain("product_costs");
    expect(sensitiveTables()).toContain("phone_change_requests");
    expect(sensitiveTables()).toContain("businesses");
  });
});
