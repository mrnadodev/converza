import { describe, expect, it } from "vitest";
import { maskPhone, normalizePhone, phoneNoticeState, samePhone } from "./phone-change";

const DAY = 86_400_000;
const changed = Date.UTC(2026, 8, 18);

describe("avis de changement de numéro", () => {
  const b = {
    phone_changed_at: new Date(changed).toISOString(),
    phone_notice_until: new Date(changed + 7 * DAY).toISOString(),
  };

  it("affiche le bandeau pendant la durée choisie", () => {
    expect(phoneNoticeState(b, changed + DAY)).toBe("banner");
  });

  it("passe à une mention discrète ensuite, jusqu'à 30 jours", () => {
    expect(phoneNoticeState(b, changed + 8 * DAY)).toBe("mention");
    expect(phoneNoticeState(b, changed + 31 * DAY)).toBeNull();
  });

  it("n'affiche rien sans changement", () => {
    expect(phoneNoticeState({}, changed)).toBeNull();
  });

  it("respecte un bandeau retiré par le marchand", () => {
    const hidden = { ...b, phone_notice_until: new Date(changed + DAY / 2).toISOString() };
    expect(phoneNoticeState(hidden, changed + DAY)).toBe("mention");
  });
});

describe("numéros", () => {
  it("masque l'ancien numéro", () => {
    expect(maskPhone("+50949453232")).toBe("+509 ••• 3232");
    expect(maskPhone("")).toBe("•••");
  });

  it("complète un numéro haïtien local", () => {
    expect(normalizePhone("4945 3232")).toBe("+50949453232");
    expect(normalizePhone("+1 (305) 555-0100")).toBe("+13055550100");
    expect(normalizePhone("123")).toBeNull();
  });

  it("compare sans tenir compte du format", () => {
    expect(samePhone("+509 4945-3232", "50949453232")).toBe(true);
    expect(samePhone("", "")).toBe(false);
  });
});
