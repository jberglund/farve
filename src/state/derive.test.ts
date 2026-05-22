import { describe, it, expect } from "vitest";
import { snap } from "./derive";

describe("snap", () => {
  it("rounds to 3 decimal places", () => {
    expect(snap(0.1234)).toBe(0.123);
    expect(snap(3.14159)).toBe(3.142);
    expect(snap(2.7182)).toBe(2.718);
  });

  it("rounds up at the 4th decimal", () => {
    expect(snap(0.0005)).toBe(0.001);
    expect(snap(0.9999)).toBe(1);
    expect(snap(2.3456)).toBe(2.346);
  });

  it("leaves whole numbers as-is", () => {
    expect(snap(1)).toBe(1);
    expect(snap(0)).toBe(0);
    expect(snap(42)).toBe(42);
  });

  it("handles negative numbers", () => {
    expect(snap(-0.1234)).toBe(-0.123);
    expect(snap(-0.9999)).toBe(-1);
  });
});
