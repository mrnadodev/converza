import { describe, expect, it } from "vitest";
import { getRolePermissions, type UserSession } from "./rbac";

const agent = (agentId: string): UserSession => ({
  full_name: "Ajan",
  role: "agent",
  agentId,
});

describe("permissions par profil métier", () => {
  it("le propriétaire garde toutes les colonnes du pipeline", () => {
    const p = getRolePermissions({ full_name: "Patwon", role: "owner", agentId: "owner" });
    expect(p.allowedPipelineColumns).toHaveLength(7);
    expect(p.canManageSettings).toBe(true);
    expect(p.canViewFinancialTurnover).toBe(true);
  });

  it("la caissière ne peut toucher que la confirmation de paiement", () => {
    const p = getRolePermissions(agent("marie"));
    expect(p.allowedPipelineColumns).toEqual(["konfime_peman"]);
    expect(p.allowedPipelineColumns).not.toContain("livre");
    expect(p.canEditCatalog).toBe(false);
  });

  it("le stockiste gère la livraison, pas le paiement", () => {
    const p = getRolePermissions(agent("pierre"));
    expect(p.allowedPipelineColumns).toEqual(["sou_wout", "livre"]);
    expect(p.allowedPipelineColumns).not.toContain("konfime_peman");
    expect(p.canEditStock).toBe(true);
  });

  it("aucun agent ne voit le chiffre d'affaires ni les réglages bancaires", () => {
    for (const id of ["marie", "jean", "pierre", "florence", "steeve", "gerant"]) {
      const p = getRolePermissions(agent(id));
      expect(p.canViewFinancialTurnover, id).toBe(false);
      expect(p.canManageSettings, id).toBe(false);
    }
  });

  it("le gérant supervise tout le pipeline sans pouvoir gérer l'équipe", () => {
    const p = getRolePermissions(agent("gerant"));
    expect(p.allowedPipelineColumns).toHaveLength(7);
    expect(p.canManageTeam).toBe(false);
  });

  it("un agent sans profil attribué retombe sur un accès restreint", () => {
    const p = getRolePermissions(agent("profil-inconnu"));
    expect(p.isReadOnly).toBe(true);
    expect(p.canEditCatalog).toBe(false);
    expect(p.canManageTeam).toBe(false);
    expect(p.allowedNavTabs).toEqual(["tablo", "chat", "komand"]);
  });
});
