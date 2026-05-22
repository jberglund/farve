import { html, render } from "lit-html";
import { live } from "lit-html/directives/live.js";
import { store } from "../state/store";
import { deriveChromaCurve } from "../state/derive";
import "./number-slider";
import { openExportDialog } from "./export-dialog";
import { maxChromaTip, ceilingTip, linkedEditingTip, spreadTip } from "./tool-tip-content";
import type { State, PaletteConfig, AppSettings } from "../state/types";

const CEILING_OPTIONS = [
  { value: "srgb", label: "sRGB" },
  { value: "p3", label: "P3" },
  { value: "rec2020", label: "Rec.2020" },
] as const;

/**
 * Controls bar: add palette, max chroma slider, ceiling gamut select.
 *
 * Does NOT own or render <palette-panel> elements. Palette lifecycle (DOM
 * sync, clone/remove handling) lives in main.ts to keep the architecture
 * flat — each component manages itself via store subscriptions.
 */
class PaletteToolbar extends HTMLElement {
  #unsub: (() => void) | null = null;

  connectedCallback() {
    this.#render();
    this.#unsub = store.subscribe(this.#onStoreChange);
  }

  disconnectedCallback() {
    this.#unsub?.();
  }

  #render() {
    const { settings } = store.getState();

    render(
      html`
        <div class="stack-horizontal justify-end gap-m items-stretch py-xl">
          <button class="button button--primary" @click=${this.#addPalette}>+ Add palette</button>
          <button class="button" @click=${openExportDialog}>Export</button>

          <label
            class="toolbar-setting inline-flex items-center gap-m fs-s surface-raised border-default"
          >
            <span>Max chroma<tool-tip>${maxChromaTip}</tool-tip></span>
            <number-slider>
              <input
                type="number"
                min="0.2"
                max="0.4"
                step="0.01"
                .value=${live(String(settings.maxChroma))}
                @input=${this.#onMaxChromaInput}
              />
            </number-slider>
          </label>

          <label
            class="toolbar-setting inline-flex items-center gap-m fs-s surface-raised border-default"
          >
            <span>Ceiling<tool-tip>${ceilingTip}</tool-tip></span>
            <select .value=${settings.ceilingGamut} @change=${this.#onCeilingChange}>
              ${CEILING_OPTIONS.map(
                (opt) => html`
                  <option value="${opt.value}" ?selected=${settings.ceilingGamut === opt.value}>
                    ${opt.label}
                  </option>
                `,
              )}
            </select>
          </label>

          <label
            class="toolbar-setting inline-flex items-center gap-m fs-s surface-raised border-default"
            hotkey-key="l"
            hotkey-restore-focus
          >
            <input
              type="checkbox"
              .checked=${settings.propagateChanges}
              @change=${this.#onPropagateToggle}
            />
            <span>Linked editing<tool-tip>${linkedEditingTip}</tool-tip></span>
          </label>

          <label
            class="toolbar-setting inline-flex items-center gap-m fs-s surface-raised border-default"
          >
            <span>Spread<tool-tip>${spreadTip}</tool-tip></span>
            <number-slider>
              <input
                type="number"
                min="0.1"
                max="0.9"
                step="0.05"
                .value=${live(String(settings.propagateDecay))}
                ?disabled=${!settings.propagateChanges}
                @input=${this.#onPropagateDecayInput}
              />
            </number-slider>
          </label>
        </div>
      `,
      this,
    );
  }

  #onStoreChange = (_state: State) => {
    this.#render();
  };

  // --- Palette lifecycle ---

  #addPalette = () => {
    const id = nextPaletteId(store.getState());
    const origin = { l: 0.62, c: 0.18, h: 264 };
    const config: PaletteConfig = {
      chroma: deriveChromaCurve(origin, store.getState().lightness),
      origin,
    };
    store.addPalette(id, config);
  };

  // --- Settings ---

  #onMaxChromaInput = (e: Event) => {
    const value = parseFloat((e.target as HTMLInputElement).value);
    if (!isNaN(value)) store.setMaxChroma(value);
  };

  #onCeilingChange = (e: Event) => {
    const value = (e.target as HTMLSelectElement).value as AppSettings["ceilingGamut"];
    store.setCeilingGamut(value);
  };

  #onPropagateToggle = (e: Event) => {
    const checked = (e.target as HTMLInputElement).checked;
    store.setPropagateChanges(checked);
  };

  #onPropagateDecayInput = (e: Event) => {
    const value = parseFloat((e.target as HTMLInputElement).value);
    if (!isNaN(value)) store.setPropagateDecay(value);
  };
}

/** Find the next available palette ID: "p1", "p2", … */
export function nextPaletteId(state: State): string {
  const ids = Object.keys(state.palettes);
  const nums = ids.map((id) => parseInt(id.slice(1), 10)).filter((n) => !isNaN(n));
  return `p${Math.max(0, ...nums) + 1}`;
}

customElements.define("palette-toolbar", PaletteToolbar);
export default PaletteToolbar;
