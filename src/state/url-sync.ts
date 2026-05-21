import { type State, type AppSettings, STEPS, type Curve, type PaletteConfig } from "./types";
import { store, type Store } from "./store";

/**
 * Parse the current URL's search params into application state.
 * Expected format:
 *   ?L=0.985,0.97,...&p1=0.04,0.06,...&p1-origin=0.62,0.18,264
 */
export function parseSearchParams(): State | null {
  const params = new URLSearchParams(location.search);

  const lightnessRaw = params.get("L");
  if (!lightnessRaw) return null;

  const lightness = parseCurve(lightnessRaw);
  if (!lightness) return null;

  const palettes: Record<string, PaletteConfig> = {};

  for (const [key, val] of params) {
    // Match p1, p2, etc. — but not p1-origin
    const paletteMatch = key.match(/^p(\d+)$/);
    if (!paletteMatch) continue;

    const chroma = parseCurve(val);
    if (!chroma) continue;

    const originRaw = params.get(`${key}-origin`);
    const origin = originRaw ? parseOrigin(originRaw) : { l: 0.5, c: 0.15, h: 264 };

    palettes[key] = { chroma, origin };
  }

  // Require at least one palette
  if (Object.keys(palettes).length === 0) return null;

  const settings = parseSettings(params);

  return { lightness, palettes, settings };
}

/**
 * Serialize the current state into search params and push to the URL.
 * Builds the query string manually to avoid %2C encoding of commas.
 * Uses replaceState to avoid flooding browser history on every slider drag.
 */
export function syncToUrl(state: State): void {
  const parts = [`L=${curveToString(state.lightness)}`];

  for (const [id, palette] of Object.entries(state.palettes)) {
    parts.push(`${id}=${curveToString(palette.chroma)}`);
    parts.push(`${id}-origin=${palette.origin.l},${palette.origin.c},${palette.origin.h}`);
  }

  // Settings
  parts.push(`max-chroma=${state.settings.maxChroma}`);
  parts.push(`ceiling=${state.settings.ceilingGamut}`);

  const qs = parts.join("&");
  const url = `${location.pathname}?${qs}`;
  history.replaceState(null, "", url);
}

/**
 * Wire up the store so every change automatically syncs to the URL.
 * Returns an unsubscribe function.
 */
export function initUrlSync(s: Store = store): () => void {
  // Hydrate from URL on first load — URL wins over defaults
  const parsed = parseSearchParams();
  if (parsed) {
    s.load(parsed);
  } else {
    // Push initial state so the user gets a shareable URL immediately
    syncToUrl(s.getState());
  }

  return s.subscribe((state) => syncToUrl(state));
}

// --- helpers ---

function parseCurve(raw: string): Curve | null {
  const parts = raw.split(",").map(Number);
  if (parts.length !== STEPS.length) return null;

  // biome-ignore lint/style/noNonNullAssertion: checked length above
  const curve = {} as Curve;
  for (let i = 0; i < STEPS.length; i++) {
    // biome-ignore lint/style/noNonNullAssertion: checked length above
    curve[STEPS[i]!] = parts[i]!;
  }
  return curve;
}

function parseOrigin(raw: string): { l: number; c: number; h: number } {
  const parts = raw.split(",").map(Number);
  return {
    l: parts[0] ?? 0.5,
    c: parts[1] ?? 0.15,
    h: parts[2] ?? 264,
  };
}

function parseSettings(params: URLSearchParams): AppSettings {
  const maxChromaRaw = params.get("max-chroma");
  const ceilingRaw = params.get("ceiling");
  return {
    maxChroma: maxChromaRaw ? parseFloat(maxChromaRaw) : 0.35,
    ceilingGamut:
      ceilingRaw === "srgb" || ceilingRaw === "p3" || ceilingRaw === "rec2020" ? ceilingRaw : "p3",
  };
}

function curveToString(curve: Curve): string {
  return STEPS.map((s) => curve[s]).join(",");
}
