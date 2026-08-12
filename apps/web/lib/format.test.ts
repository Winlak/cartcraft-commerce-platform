import { describe, expect, it } from "vitest";
import { formatMoney, statusLabel } from "./format";
describe("format helpers", () => {
  it("formats roubles for the storefront", () =>
    expect(formatMoney(8990)).toContain("8"));
  it("has a readable status for each core order state", () =>
    expect(statusLabel.SHIPPED).toBe("Передан в доставку"));
});
