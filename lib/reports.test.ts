import { describe, expect, it } from "vitest";
import { csvCell } from "./reports";

describe("csvCell", () => {
  it("entoure la valeur de guillemets et double ceux qui s'y trouvent", () => {
    expect(csvCell('Diri "Tchako"')).toBe('"Diri ""Tchako"""');
  });

  it("neutralise une cellule qui serait interprétée comme formule Excel", () => {
    for (const start of ["=", "+", "-", "@"]) {
      expect(csvCell(`${start}HYPERLINK("http://x")`)).toMatch(/^"'\\?/);
    }
    expect(csvCell("=1+1")).toBe("\"'=1+1\"");
  });

  it("laisse une valeur ordinaire intacte", () => {
    expect(csvCell("Wideline Pierre")).toBe('"Wideline Pierre"');
    expect(csvCell(0)).toBe('"0"');
    expect(csvCell(null)).toBe('""');
  });
});
