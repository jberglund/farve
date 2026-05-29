import { html, render } from "lit-html";
import { store } from "../../state/store";
import { deriveSwatches } from "../../state";
import type { State } from "../../state/types";

/**
 * Full-viewport popover that previews all palettes as tall horizontal swatch
 * rows with step labels overlaid.
 *
 * Usage: call `openPalettesPreview()` from anywhere. The component is a
 * singleton appended to `document.body`.
 */
class PalettesPreview extends HTMLElement {
  #unsub: (() => void) | null = null;

  connectedCallback() {
    this.#render();
    this.#unsub = store.subscribe(this.#onStoreChange);
  }

  disconnectedCallback() {
    this.#unsub?.();
  }

  // --- public API ---

  open() {
    this.#render();
    const popover = this.querySelector(".palettes-preview") as HTMLElement | null;
    if (popover && !popover.matches(":popover-open")) {
      popover.showPopover();
    }
  }

  close() {
    const popover = this.querySelector(".palettes-preview") as HTMLElement | null;
    popover?.hidePopover();
  }

  // --- render ---

  #render() {
    const state = store.getState();
    const ids = Object.keys(state.palettes);

    render(
      html`
        <div class="palettes-preview" popover="auto">
          <div class="stack-horizontal items-center px-m py-s border-bottom-default">
            <h5 class="m-0 mr-auto">Palette Preview</h5>
            <button class="button button--icon" @click=${this.#onClose} aria-label="Close preview">
              <svg class="icon" viewBox="0 0 24 24"><use href="#icon-remove" /></svg>
            </button>
          </div>
          <div class="palettes-preview__body stack gap-xl p-m">
            ${ids.map((id) => {
              const palette = state.palettes[id];
              const swatches = deriveSwatches(state, id);
              return html`
                <div class="stack gap-xs">
                  <h3 class="fs-l m-0">${palette.name}</h3>
                  <div class="palette-preview-grid">
                    ${swatches.map(
                      (swatch) => html`
                        <div
                          class="palette-preview-swatch"
                          style="background-color: ${swatch.css};"
                        >
                          <span class="palette-preview-label">${swatch.step}</span>
                        </div>
                      `,
                    )}
                  </div>
                </div>
              `;
            })}
          </div>
        </div>
      `,
      this,
    );
  }

  // --- store ---

  #onStoreChange = (_state: State) => {
    this.#render();
  };

  // --- events ---

  #onClose = () => {
    this.close();
  };
}

// --- singleton ---

function getOrCreatePreview(): PalettesPreview {
  let el = document.querySelector("palettes-preview") as PalettesPreview | null;
  if (!el) {
    el = document.createElement("palettes-preview") as PalettesPreview;
    document.body.appendChild(el);
  }
  return el;
}

/** Open the full-viewport palette preview. */
export function openPalettesPreview(): void {
  getOrCreatePreview().open();
}

customElements.define("palettes-preview", PalettesPreview);
