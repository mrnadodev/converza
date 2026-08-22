import { describe, it, expect } from "vitest";
import { normalizePhoneHT, isValidWaPhone, waMeLink, fillTemplate } from "./whatsapp";

describe("normalizePhoneHT", () => {
  it("préfixe un numéro local haïtien de 8 chiffres", () => {
    expect(normalizePhoneHT("3712 4488")).toBe("50937124488");
  });
  it("garde un numéro déjà en +509", () => {
    expect(normalizePhoneHT("+509 3822 0145")).toBe("50938220145");
  });
  it("ignore les caractères non numériques", () => {
    expect(normalizePhoneHT("(509) 37-12-44-88")).toBe("50937124488");
  });
});

describe("isValidWaPhone", () => {
  it("accepte un numéro haïtien complet", () => {
    expect(isValidWaPhone("37124488")).toBe(true);
  });
  it("rejette un numéro trop court", () => {
    expect(isValidWaPhone("1234")).toBe(false);
  });
});

describe("waMeLink", () => {
  it("construit un lien avec message encodé", () => {
    expect(waMeLink("37124488", "Bonjou Wideline!")).toBe(
      "https://wa.me/50937124488?text=Bonjou%20Wideline!",
    );
  });
  it("construit un lien sans message", () => {
    expect(waMeLink("37124488")).toBe("https://wa.me/50937124488");
  });
});

describe("fillTemplate", () => {
  it("remplace les variables {kle}", () => {
    expect(fillTemplate("Bonjou {non}, total: {total}", { non: "Wideline", total: "590 HTG" }))
      .toBe("Bonjou Wideline, total: 590 HTG");
  });
  it("laisse les variables inconnues intactes", () => {
    expect(fillTemplate("Bonjou {non}", {})).toBe("Bonjou {non}");
  });
});
