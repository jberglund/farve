import { type State, STEPS, type Step } from "./types";

export interface Swatch {
  step: Step;
  /** CSS color string, e.g. "oklch(0.62 0.18 264)" */
  css: string;
  l: number;
  c: number;
  h: number;
}

/**
 * Derive all swatches for a palette from the current state.
 * Pure function — no side effects, no store dependency.
 */
export function deriveSwatches(state: State, paletteId: string): Swatch[] {
  const palette = state.palettes[paletteId];
  if (!palette) return [];

  return STEPS.map((step) => {
    const l = state.lightness[step];
    const c = palette.chroma[step];
    const h = palette.origin.h;

    return {
      step,
      l: round(l),
      c: round(c),
      h: round(h),
      css: `oklch(${round(l)} ${round(c)} ${round(h)})`,
    };
  });
}

/**
 * Reconstruct a hex string from the origin LCH for hydrating a color input.
 */
export function originToHex(origin: { l: number; c: number; h: number }): string {
  // We want to avoid pulling in color.js for this one conversion,
  // so we lean on the browser's CSS parsing. Create a temporary element,
  // set its color, and read the computed hex.
  //
  // This is a pragmatic shortcut — if you prefer color.js, swap this out.
  const div = document.createElement("div");
  div.style.color = `oklch(${origin.l} ${origin.c} ${origin.h})`;
  document.body.appendChild(div);
  const hex = getComputedStyle(div).color;
  div.remove();

  // getComputedStyle returns something like "rgb(76, 127, 242)" or "#4c7ff2"
  // depending on the browser. Normalize to hex.
  if (hex.startsWith("#")) return hex;
  return rgbToHex(hex);
}

function round(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function rgbToHex(rgb: string): string {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return "#000000";
  const [, r, g, b] = match;
  return "#" + [r, g, b].map((x) => Number(x).toString(16).padStart(2, "0")).join("");
}
