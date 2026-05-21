import { type State, type Step, type Curve, type PaletteConfig, type Origin } from "./types";

// --- sensible defaults for a 20-step lightness curve ---
const DEFAULT_LIGHTNESS: Curve = {
  "0": 0.995,
  "50": 0.985,
  "100": 0.97,
  "150": 0.945,
  "200": 0.92,
  "250": 0.895,
  "300": 0.87,
  "350": 0.81,
  "400": 0.75,
  "450": 0.685,
  "500": 0.62,
  "550": 0.575,
  "600": 0.53,
  "650": 0.485,
  "700": 0.44,
  "750": 0.39,
  "800": 0.34,
  "850": 0.29,
  "900": 0.24,
  "950": 0.17,
};

// --- sensible defaults for a 20-step chroma curve ---
const DEFAULT_CHROMA: Curve = {
  "0": 0.02,
  "50": 0.04,
  "100": 0.06,
  "150": 0.08,
  "200": 0.1,
  "250": 0.115,
  "300": 0.13,
  "350": 0.145,
  "400": 0.16,
  "450": 0.17,
  "500": 0.18,
  "550": 0.175,
  "600": 0.17,
  "650": 0.16,
  "700": 0.15,
  "750": 0.135,
  "800": 0.12,
  "850": 0.1,
  "900": 0.08,
  "950": 0.05,
};

export type Listener = (state: State) => void;

export class Store {
  #state: State;
  #listeners = new Set<Listener>();
  #dirty = false;

  constructor(state: State) {
    this.#state = structuredClone(state);
  }

  // --- readers ---

  getLightness(step: Step): number {
    return this.#state.lightness[step];
  }

  getChroma(paletteId: string, step: Step): number {
    return this.#state.palettes[paletteId].chroma[step];
  }

  getOrigin(paletteId: string): Origin {
    return this.#state.palettes[paletteId].origin;
  }

  getState(): State {
    return this.#state;
  }

  // --- writers ---

  setLightness(step: Step, value: number): void {
    this.#state.lightness[step] = value;
    this.#scheduleNotify();
  }

  setChroma(paletteId: string, step: Step, value: number): void {
    this.#state.palettes[paletteId].chroma[step] = value;
    this.#scheduleNotify();
  }

  setOrigin(paletteId: string, l: number, c: number, h: number): void {
    this.#state.palettes[paletteId].origin = { l, c, h };
    this.#scheduleNotify();
  }

  addPalette(id: string, config: PaletteConfig): void {
    this.#state.palettes[id] = config;
    this.#notify();
  }

  /** Replace the entire state — used when hydrating from URL. */
  load(state: State): void {
    this.#state = structuredClone(state);
    this.#notify();
  }

  // --- subscriptions ---

  subscribe(fn: Listener): () => void {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  // --- internal ---

  #scheduleNotify(): void {
    if (!this.#dirty) {
      this.#dirty = true;
      requestAnimationFrame(() => {
        this.#dirty = false;
        this.#notify();
      });
    }
  }

  #notify(): void {
    for (const fn of this.#listeners) {
      fn(this.#state);
    }
  }

  // --- serialization ---

  toJSON(): State {
    return this.#state;
  }

  static fromJSON(json: State): Store {
    return new Store(json);
  }

  // --- factory ---

  /** Create a store with sensible defaults and one palette. */
  static default(): Store {
    return new Store({
      lightness: { ...DEFAULT_LIGHTNESS },
      palettes: {
        p1: {
          chroma: { ...DEFAULT_CHROMA },
          origin: { l: 0.62, c: 0.18, h: 264 },
        },
      },
    });
  }
}

/** Singleton store instance. */
export const store = Store.default();
