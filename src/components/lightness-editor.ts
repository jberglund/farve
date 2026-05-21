import { html, render } from "lit-html";
import { store } from "../state/store";
import { STEPS, type Step } from "../state";
import type { State } from "../state/types";
import "./step-slider";

/**
 * Global lightness editor — one vertical slider per step.
 * Writes to store.lightness and reads back for external updates (URL hydration).
 */
class LightnessEditor extends HTMLElement {
  #unsub: (() => void) | null = null;

  connectedCallback() {
    this.addEventListener("step-change", this.#onStepChange);
    this.#render();
    this.#unsub = store.subscribe(this.#onStoreChange);
  }

  disconnectedCallback() {
    this.#unsub?.();
  }

  #render() {
    const state = store.getState();

    render(
      html`
        <section class="lightness-section the-grid">
          <div class="the-grid__origin">Lightness controls</div>
          <div class="the-grid__steps palette-grid" data-editor="lightness">
            ${STEPS.map(
              (step) =>
                html`<step-slider
                  step-key="${step}"
                  value="${state.lightness[step]}"
                  min="0"
                  max="1"
                  orient="vertical"
                  show-label
                ></step-slider>`,
            )}
          </div>
        </section>
      `,
      this,
    );
  }

  #onStoreChange = (_state: State) => {
    this.#render();
  };

  #onStepChange = (e: Event) => {
    const { step, value } = (e as CustomEvent<{ step: Step; value: number }>).detail;
    store.setLightness(step, value);
  };
}

customElements.define("lightness-editor", LightnessEditor);
export default LightnessEditor;
