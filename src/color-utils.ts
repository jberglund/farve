import Color from "colorjs.io";

export function maxChroma(L: number, H: number, gamut = "srgb") {
  const c = new Color("oklch", [L, 0.4, H]);
  return c.toGamut({ space: gamut, method: "css" }).oklch.c;
}
