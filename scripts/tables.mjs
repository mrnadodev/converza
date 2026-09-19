// Inventaire des tables de CONVERZA, dans l'ordre où elles peuvent être
// réécrites : une table n'apparaît qu'après celles dont elle dépend.
//
// `derived: true` marque les tables que la base reconstruit elle-même à partir
// des commandes (encaissements, mouvements de stock) : les réécrire en l'état
// double les lignes, puisque les déclencheurs se redéclenchent à l'insertion.

/** @type {{ name: string, after: string[], derived?: boolean, sensitive?: boolean }[]} */
export const TABLES = [
  { name: "platform_settings", after: [], sensitive: true },
  { name: "businesses", after: [], sensitive: true },
  { name: "members", after: ["businesses"] },
  { name: "customers", after: ["businesses"] },
  { name: "suppliers", after: ["businesses"] },
  { name: "products", after: ["businesses"] },
  { name: "product_costs", after: ["products"], sensitive: true },
  { name: "purchases", after: ["businesses", "suppliers"] },
  { name: "purchase_items", after: ["purchases", "products"] },
  { name: "orders", after: ["businesses", "customers"] },
  { name: "order_items", after: ["orders", "products"] },
  { name: "order_payments", after: ["orders"], derived: true },
  { name: "stock_movements", after: ["businesses", "products", "orders"], derived: true },
  { name: "expenses", after: ["businesses"] },
  { name: "quick_replies", after: ["businesses"] },
  { name: "subscription_payments", after: ["businesses"] },
  { name: "phone_change_requests", after: ["businesses"], sensitive: true },
  { name: "security_audit_logs", after: ["businesses"] },
  { name: "app_errors", after: ["businesses"] },
];

export const TABLE_NAMES = TABLES.map((t) => t.name);

/** Ordre de réécriture. Lève une erreur si une dépendance arrive trop tard. */
export function restoreOrder(names = TABLE_NAMES) {
  const wanted = new Set(names);
  const order = TABLES.filter((t) => wanted.has(t.name)).map((t) => t.name);
  const seen = new Set();
  for (const name of order) {
    const table = TABLES.find((t) => t.name === name);
    for (const dep of table.after) {
      if (wanted.has(dep) && !seen.has(dep)) {
        throw new Error(`${name} dépend de ${dep}, qui doit être réécrite avant`);
      }
    }
    seen.add(name);
  }
  return order;
}

/** Ordre de suppression : l'inverse, pour vider une base sans casser les liens. */
export function purgeOrder(names = TABLE_NAMES) {
  return restoreOrder(names).slice().reverse();
}

/** Tables que la base recalcule seule : à ne pas réécrire par défaut. */
export function derivedTables() {
  return TABLES.filter((t) => t.derived).map((t) => t.name);
}

/** Tables qui contiennent des données à ne jamais laisser traîner en clair. */
export function sensitiveTables() {
  return TABLES.filter((t) => t.sensitive).map((t) => t.name);
}
