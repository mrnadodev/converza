import { describe, expect, it, beforeAll } from "vitest";
import { createInviteToken, verifyInviteToken } from "./invite";

const BIZ = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";

beforeAll(() => {
  process.env.INVITE_SECRET = "secret-de-test";
});

describe("invitations d'agent", () => {
  it("accepte un jeton fraîchement émis", () => {
    expect(verifyInviteToken(BIZ, createInviteToken(BIZ))).toBe(true);
  });

  it("refuse un jeton émis pour un autre business", () => {
    expect(verifyInviteToken(OTHER, createInviteToken(BIZ))).toBe(false);
  });

  it("refuse un jeton expiré", () => {
    expect(verifyInviteToken(BIZ, createInviteToken(BIZ, -1000))).toBe(false);
  });

  it("refuse une signature bricolée ou absente", () => {
    const exp = Date.now() + 60_000;
    expect(verifyInviteToken(BIZ, `${exp}.nimpotequoi`)).toBe(false);
    expect(verifyInviteToken(BIZ, String(exp))).toBe(false);
    expect(verifyInviteToken(BIZ, "")).toBe(false);
    expect(verifyInviteToken(BIZ, null)).toBe(false);
  });
});
