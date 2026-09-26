import { describe, expect, it } from "vitest";
import { generateReportXLSX, triggerReportPDF } from "./reports";
import { buildSheetXml } from "./xlsx";
import { getRolePermissions, type UserSession } from "./rbac";
import type { PipelineCard, Product } from "./types";

// L'inventaire et le rapport de ventes ne s'adressent pas aux mêmes personnes.
// Un seul fichier les mélangeait : l'application masquait le chiffre d'affaires
// au stockiste à l'écran, puis le lui rendait dans un téléchargement — avec le
// nom et le numéro de chaque client.

const PRODUITS: Product[] = [
  { id: "p1", business_id: "b", name: "Chemiz", category: "Homme · Vêtements", price_cents: 900_000, currency: "HTG", unit: null, stock_qty: 4, stock_state: "en_stok", photo_url: null, sold_count: 2, is_active: true },
  { id: "p2", business_id: "b", name: "Soulye", category: null, price_cents: 500_000, currency: "HTG", unit: null, stock_qty: 0, stock_state: "fini", photo_url: null, sold_count: 1, is_active: true },
];

const CARTES: PipelineCard[] = [
  { id: "o1", ref: "CMD-1", status: "livre", customerName: "Wideline Désir", phone_e164: "+50937124488", itemsSummary: "1 × Chemiz", totalCents: 1_800_000, owedCents: 1_800_000 },
];

/** Tout le texte du classeur, tel qu'Excel l'affichera. */
function texteDu(scope: "stock" | "sales"): string {
  const bytes = generateReportXLSX(scope, CARTES, PRODUITS, "month", "Boutik", "fr");
  // On relit l'archive plutôt que le plan : c'est le fichier livré qui compte.
  return new TextDecoder().decode(bytes);
}

describe("l'inventaire ne contient rien de commercial", () => {
  it("ni nom de client, ni numéro de téléphone", () => {
    const t = texteDu("stock");
    expect(t).not.toContain("Wideline");
    expect(t).not.toContain("50937124488");
    expect(t).not.toContain("CMD-1");
  });

  it("ni chiffre d'affaires, ni encaissé, ni reste à encaisser", () => {
    const t = texteDu("stock");
    for (const interdit of ["Ventes totales", "Montant encaissé", "Reste à encaisser"]) {
      expect(t, interdit).not.toContain(interdit);
    }
  });

  it("mais bien les produits et l'état du stock", () => {
    const t = texteDu("stock");
    expect(t).toContain("Chemiz");
    expect(t).toContain("Valeur du stock");
    expect(t).toContain("Épuisé");
  });
});

describe("le rapport de ventes ne contient pas l'inventaire", () => {
  it("il porte les clients et les montants", () => {
    const t = texteDu("sales");
    expect(t).toContain("Wideline Désir");
    expect(t).toContain("Ventes totales");
  });

  it("il ne porte pas le tableau du stock", () => {
    const t = texteDu("sales");
    expect(t).not.toContain("État du stock");
    expect(t).not.toContain("Stock restant");
  });
});

describe("droits par rôle", () => {
  const session = (agentId?: string, role: "owner" | "agent" = "agent"): UserSession => ({
    full_name: "T",
    role,
    agentId,
  });

  // Qui doit voir quoi. Ce tableau est la règle : le modifier, c'est décider.
  const ATTENDU: [string, UserSession, boolean, boolean][] = [
    ["propriétaire", session(undefined, "owner"), true, true],
    ["gérant", session("gerant"), true, true],
    ["stockiste", session("pierre"), true, false],
    ["agent promo", session("steeve"), true, false],
    ["caissière", session("marie"), false, false],
    ["commercial", session("jean"), false, false],
    ["service client", session("florence"), false, false],
    ["rôle inconnu", session("inconnu"), false, false],
  ];

  for (const [nom, s, stock, ventes] of ATTENDU) {
    it(`${nom} : inventaire ${stock ? "oui" : "non"}, ventes ${ventes ? "oui" : "non"}`, () => {
      const p = getRolePermissions(s);
      expect(p.canViewStockReport, "inventaire").toBe(stock);
      expect(p.canViewSalesReport, "ventes").toBe(ventes);
    });
  }

  it("personne ne lit les ventes sans voir aussi les chiffres financiers", () => {
    // Le rapport de ventes EST le chiffre d'affaires. Accorder l'un en
    // refusant l'autre à l'écran serait incohérent — sauf pour le gérant, qui
    // voit déjà chaque commande dans le pipeline mais pas le bénéfice net.
    for (const [nom, s] of ATTENDU.filter(([, , , v]) => v)) {
      const p = getRolePermissions(s);
      expect(p.canViewFinancialTurnover || s.agentId === "gerant", nom).toBe(true);
    }
  });

  it("aucun rôle privé d'inventaire ne peut atteindre l'écran Stock", () => {
    // Sinon le bloc serait simplement vide, ce qui ressemble à une panne.
    for (const [nom, s, stock] of ATTENDU) {
      const p = getRolePermissions(s);
      if (!stock && !p.canViewSalesReport) {
        expect(p.allowedNavTabs.includes("stok"), nom).toBe(false);
      }
    }
  });
});

describe("la version imprimable suit la même séparation", () => {
  /** Ouvre le rapport dans une fausse fenêtre et rend le HTML réellement écrit. */
  function imprimer(scope: "stock" | "sales"): string {
    let html = "";
    const faux = {
      open: () => ({
        document: {
          write: (s: string) => {
            html += s;
          },
          close: () => {},
        },
      }),
    };
    const global = globalThis as { window?: unknown };
    const avant = global.window;
    global.window = faux;
    try {
      triggerReportPDF(scope, CARTES, PRODUITS, "month", "Boutik", "fr");
    } finally {
      if (avant === undefined) delete global.window;
      else global.window = avant;
    }
    return html;
  }

  it("l'inventaire imprimé ne porte aucun client ni chiffre d'affaires", () => {
    const h = imprimer("stock");
    expect(h).toContain("Inventaire de stock");
    expect(h).toContain("Chemiz");
    expect(h).not.toContain("Wideline");
    expect(h).not.toContain("50937124488");
    expect(h).not.toContain("Ventes totales");
  });

  it("le rapport de ventes imprimé ne porte pas le tableau du stock", () => {
    const h = imprimer("sales");
    expect(h).toContain("Rapport de ventes");
    expect(h).toContain("Wideline Désir");
    expect(h).not.toContain("État du stock");
  });

  it("hors navigateur, elle se tait au lieu de faire tomber le rendu", () => {
    expect(() => triggerReportPDF("stock", CARTES, PRODUITS, "month", "Boutik", "fr")).not.toThrow();
  });
});
