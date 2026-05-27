import { html, render } from "lit-html";
import { store } from "../state/store";

/**
 * Footer below the palette list with an "Add palette" button,
 * so you don't have to scroll back up to add another.
 */
class PalettesFooter extends HTMLElement {
  connectedCallback() {
    this.#render();
  }

  #render() {
    render(
      html`
        <div class="toolbar-bar items-center border-bottom-default">
          <button class="button button--primary ml-auto" @click=${() => store.addDefaultPalette()}>
            <svg class="icon" viewBox="0 0 24 24"><use href="#icon-plus" /></svg>
            Add palette
          </button>
        </div>
      `,
      this,
    );
  }
}

customElements.define("palettes-footer", PalettesFooter);
