import { html, render } from "lit-html";
import { store } from "../../state/store";
import type { State } from "../../state/types";

/**
 * Header bar above the palette list.
 * Left: "Palettes" heading + add button. Right: Linked editing hint.
 */
class PalettesHeader extends HTMLElement {
  #unsub: (() => void) | null = null;

  connectedCallback() {
    this.#render();
    this.#unsub = store.subscribe(this.#onStoreChange);
  }

  disconnectedCallback() {
    this.#unsub?.();
  }

  #render() {
    render(
      html`
        <div class="stack-horizontal gap-m items-center mb-2xl">
          <h2>Palettes</h2>
          <button class="button" @click=${this.#addPalette}>
            <svg class="icon" viewBox="0 0 24 24"><use href="#icon-plus" /></svg>
            Add palette
          </button>

          <div class="stack-horizontal gap-m ml-auto items-stretch">
            <span class="label inline-flex items-center gap-xs">
              Hold <kbd class="keycap">Shift</kbd> while dragging to link edits
            </span>
          </div>
        </div>
      `,
      this,
    );
  }

  #onStoreChange = (_state: State) => {
    this.#render();
  };

  #addPalette = () => store.addDefaultPalette();
}

customElements.define("palettes-header", PalettesHeader);
