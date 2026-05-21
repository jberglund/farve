import Color from "colorjs.io";
import { html, render } from "lit-html";
import { live } from "lit-html/directives/live.js";
import { store } from "../state/store";
import { STEPS, deriveSwatches, originToHex, type Step } from "../state";
import type { State } from "../state/types";
import { maxChroma } from "../color-utils";
import GamutChecker from "./gamut-checker";
import "./step-slider";

/**
 * A single palette: color input, swatches, and per-step chroma sliders.
 *
 * @attr palette-id     - The palette key in the store ("p1", "p2", etc.)
 * @attr ceiling-gamut  - Gamut used for the slider danger-zone ceiling.
 *                        One of "srgb", "p3", or "rec2020". Default: "p3".
 */
class PalettePanel extends HTMLElement {
  static get observedAttributes() {
    return ["palette-id", "ceiling-gamut"];
  }

  #paletteId = "p1";
  #ceilingGamut = "p3";
  #unsub: (() => void) | null = null;

  connectedCallback() {
    this.#paletteId = this.getAttribute("palette-id") ?? "p1";
    this.addEventListener("step-change", this.#onStepChange);
    this.#render();
    this.#unsub = store.subscribe(this.#onStoreChange);
  }

  disconnectedCallback() {
    this.#unsub?.();
  }

  attributeChangedCallback(name: string, _old: string, newValue: string) {
    if (name === "ceiling-gamut" && newValue) {
      this.#ceilingGamut = newValue;
      this.#onStoreChange(store.getState());
    }
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  #render() {
    const state = store.getState();
    const palette = state.palettes[this.#paletteId];
    if (!palette) return;

    const hex = originToHex(palette.origin);

    render(
      html`
        <section class="the-grid">
          <div class="the-grid__configuration palette-origin">
            <label for="origin-${this.#paletteId}" hidden>Origin color</label>
            <input
              type="color"
              .value=${live(hex)}
              id="origin-${this.#paletteId}"
              name="origin"
              @input=${this.#onColorInput}
            />
          </div>
          <div class="the-grid__steps">
            <div class="palette-grid" data-palette-grid>
              ${STEPS.map(
                (step) => html`
                  <div class="palette-swatch" style="background-color: var(--swatch-${step})">
                    <span hidden class="swatch-label">${step}</span>
                    <gamut-checker
                      target-strategy="closest"
                      target=".palette-swatch"
                    ></gamut-checker>
                  </div>
                `,
              )}
            </div>
            <div class="palette-grid" data-editor="chroma">
              ${STEPS.map((step) => {
                const L = state.lightness[step];
                const ceiling = maxChroma(L, palette.origin.h, this.#ceilingGamut);
                return html`
                  <step-slider
                    step-key="${step}"
                    value="${palette.chroma[step]}"
                    min="0"
                    max="0.4"
                    ceiling="${ceiling}"
                    orient="vertical"
                  ></step-slider>
                `;
              })}
            </div>
          </div>
        </section>
      `,
      this,
    );

    // Prime CSS variables with current store values
    this.#updateSwatches(state);
  }

  // -----------------------------------------------------------------------
  // Store subscription
  // -----------------------------------------------------------------------

  #onStoreChange = (state: State) => {
    this.#render();
    this.#updateSwatches(state);
  };

  #updateSwatches(state: State) {
    const swatches = deriveSwatches(state, this.#paletteId);
    for (const s of swatches) {
      this.style.setProperty(`--swatch-${s.step}`, s.css);
    }
    // Gamut checkers observe style *attributes*, not computed styles,
    // so nudging them is necessary after a CSS variable change.
    for (const gc of this.querySelectorAll<GamutChecker>("gamut-checker")) {
      gc.checkColor();
    }
  }

  // -----------------------------------------------------------------------
  // Event handlers
  // -----------------------------------------------------------------------

  #onStepChange = (e: Event) => {
    const { step, value } = (e as CustomEvent<{ step: Step; value: number }>).detail;
    store.setChroma(this.#paletteId, step, value);
  };

  #onColorInput = () => {
    const input = this.querySelector<HTMLInputElement>("input[type='color']");
    if (!input) return;
    try {
      const color = new Color(input.value);
      const [l = 0.5, c = 0.15, h = 264] = color.oklch as number[];
      store.setOrigin(this.#paletteId, l, c, h);
    } catch {
      // Unparseable color — ignore
    }
  };
}

customElements.define("palette-panel", PalettePanel);
export default PalettePanel;
