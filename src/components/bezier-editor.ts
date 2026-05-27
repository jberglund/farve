import { html, render } from "lit-html";
import { store } from "../state/store";
import { type BezierControls } from "../state/types";
import { BEZIER_PRESETS, findMatchingPreset } from "../state/bezier";
import { snap } from "../state/derive";
import { presetTip, startLightnessTip, endLightnessTip } from "./tool-tip-content";
import { renderBezierSvg } from "./bezier-svg";
import "./number-slider";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_HEIGHT = 200;
const PAD = 0;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Full lightness curve editor.
 *
 * Combines a cubic-bezier shape editor (SVG) with preset selection,
 * start/end lightness inputs, and direct store integration.
 *
 * All four bezier control points are editable:
 *   P0 = (0, p0y) — left-anchored, vertical-drag only  (start lightness)
 *   P3 = (1, p3y) — right-anchored, vertical-drag only (end lightness)
 *   P1, P2 — fully draggable shape handles
 *
 * @attr height — fixed px height for the SVG plot (default 200).
 */
class BezierEditor extends HTMLElement {
  static get observedAttributes() {
    return ["height"];
  }

  // Bezier controls — default to the S-curve shape with default lightness range
  #p0y = BEZIER_PRESETS[0].controls.p0y;
  #p1x = BEZIER_PRESETS[0].controls.p1x;
  #p1y = BEZIER_PRESETS[0].controls.p1y;
  #p2x = BEZIER_PRESETS[0].controls.p2x;
  #p2y = BEZIER_PRESETS[0].controls.p2y;
  #p3y = BEZIER_PRESETS[0].controls.p3y;

  // Preset tracking
  #activePresetKey: string | null = BEZIER_PRESETS[0].key;

  // Drag
  #dragging: "p0" | "p1" | "p2" | "p3" | null = null;

  // Sizing
  #svgHeight = DEFAULT_HEIGHT;
  #actualWidth = 300;
  #resizeObserver: ResizeObserver | null = null;

  // Store
  #unsub: (() => void) | null = null;

  // -------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------

  connectedCallback() {
    this.#readAttrs();
    // Hydrate from store (URL may have loaded different bezier controls)
    const c = store.getState().bezierControls;
    this.#p0y = c.p0y;
    this.#p1x = c.p1x;
    this.#p1y = c.p1y;
    this.#p2x = c.p2x;
    this.#p2y = c.p2y;
    this.#p3y = c.p3y;
    this.#activePresetKey = findMatchingPreset(c);
    this.#render();
    this.#unsub = store.subscribe(this.#onStoreChange);
  }

  disconnectedCallback() {
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = null;
    this.#unsub?.();
  }

  attributeChangedCallback(name: string, _old: string, newValue: string) {
    if (name === "height") {
      const v = parseFloat(newValue);
      if (!isNaN(v) && v > 0) this.#svgHeight = v;
      this.#render();
    }
  }

  // -------------------------------------------------------------------
  // Sizing
  // -------------------------------------------------------------------

  #observe() {
    this.#resizeObserver?.disconnect();
    const svgEl = this.querySelector("svg");
    if (!svgEl) return;
    this.#resizeObserver = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect && rect.width > 0 && Math.abs(rect.width - this.#actualWidth) > 0.5) {
        this.#actualWidth = rect.width;
        this.#render();
      }
    });
    this.#resizeObserver.observe(svgEl);
  }

  get #pw() {
    return this.#actualWidth - 2 * PAD;
  }
  get #ph() {
    return this.#svgHeight - 2 * PAD;
  }

  // -------------------------------------------------------------------
  // Coordinate helpers
  // -------------------------------------------------------------------

  #fromX = (px: number) => Math.max(0, Math.min(1, (px - PAD) / this.#pw));
  #fromY = (py: number) => Math.max(0, Math.min(1, (py - PAD) / this.#ph));

  // -------------------------------------------------------------------
  // Derived
  // -------------------------------------------------------------------

  /** startL = 1 − p0y  (y=0 → bright top, so p0y near 0 means startL near 1) */
  get #startL() {
    return snap(1 - this.#p0y);
  }

  /** endL = 1 − p3y */
  get #endL() {
    return snap(1 - this.#p3y);
  }

  // -------------------------------------------------------------------
  // Store
  // -------------------------------------------------------------------

  #pushControls() {
    store.setBezierControls(this.#controls);
  }

  get #controls(): BezierControls {
    return {
      p0y: this.#p0y,
      p1x: this.#p1x,
      p1y: this.#p1y,
      p2x: this.#p2x,
      p2y: this.#p2y,
      p3y: this.#p3y,
    };
  }

  /** Sync private state from the store (URL hydration, preset load, etc.). */
  #onStoreChange = () => {
    if (this.#dragging) return; // we are the source of truth during drag
    const c = store.getState().bezierControls;
    this.#p0y = c.p0y;
    this.#p1x = c.p1x;
    this.#p1y = c.p1y;
    this.#p2x = c.p2x;
    this.#p2y = c.p2y;
    this.#p3y = c.p3y;
    this.#activePresetKey = findMatchingPreset(c);
    this.#render();
  };

  // -------------------------------------------------------------------
  // Render — full UI
  // -------------------------------------------------------------------

  #render() {
    const startL = this.#startL;
    const endL = this.#endL;
    const activeKey = this.#activePresetKey;

    render(
      html`
        <section class="the-grid gap-xl">
          <div class="the-grid__configuration">
            <h4 class="mb-l">Config</h4>
            <div class="stack gap-l pt-xl">
              <div class="stack">
                <div class="stack-horizontal">
                  <label class="fs-xs t-bold" for="preset">Curve presets</label>
                  <tool-tip class="ml-2xs">${presetTip}</tool-tip>
                </div>
                <div class="stack-horizontal gap-xs">
                  <select id="preset" @change=${this.#onPresetChange} class="select flex-1">
                    <option value="" ?selected=${activeKey === null}>Custom…</option>
                    ${BEZIER_PRESETS.map(
                      (p) => html`
                        <option value="${p.key}" ?selected=${activeKey === p.key}>
                          ${p.label}
                        </option>
                      `,
                    )}
                  </select>
                  <button class="button" data-size="small" @click=${this.#onReset}>Reset</button>
                </div>
              </div>

              <div class="stack gap-2xs">
                <div class="stack-horizontal items-center">
                  <span class="fs-xs t-bold">Start</span>
                  <tool-tip class="ml-2xs">${startLightnessTip}</tool-tip>
                  <number-slider class="ml-auto">
                    <input
                      id="start-lightness"
                      class="input origin-text border-default t-right fs-xs"
                      style="width:12ch"
                      type="number"
                      min="0"
                      max="1"
                      step="0.001"
                      .value="${startL}"
                      @input=${this.#onStartChange}
                    />
                  </number-slider>
                </div>
                <div class="stack-horizontal items-center">
                  <span class="fs-xs t-bold">End</span>
                  <tool-tip class="ml-2xs">${endLightnessTip}</tool-tip>
                  <number-slider class="ml-auto">
                    <input
                      id="end-lightness"
                      class="input origin-text border-default t-right fs-xs"
                      style="width:12ch"
                      type="number"
                      min="0"
                      max="1"
                      step="0.001"
                      .value="${endL}"
                      @input=${this.#onEndChange}
                    />
                  </number-slider>
                </div>
              </div>
            </div>
          </div>

          <div class="the-grid__steps">
            <h4 class="mb-l">Lightness Curve</h4>
            <div>${this.#renderSvg()}</div>
          </div>
        </section>
      `,
      this,
    );

    // Re-attach ResizeObserver to newly rendered SVG
    this.#observe();
  }

  // -------------------------------------------------------------------
  // Render — SVG plot
  // -------------------------------------------------------------------

  #renderSvg() {
    return renderBezierSvg({
      height: this.#svgHeight,
      plotWidth: this.#pw,
      plotHeight: this.#ph,
      controls: this.#controls,
      dragging: this.#dragging,
      onMove: this.#onMove,
      onUp: this.#onUp,
      onPointerDown: (e, w) => this.#start(e, w),
    });
  }

  // -------------------------------------------------------------------
  // Drag
  // -------------------------------------------------------------------

  #start(e: PointerEvent, which: "p0" | "p1" | "p2" | "p3") {
    this.#dragging = which;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    this.#render();
    e.preventDefault();
  }

  #onMove = (e: PointerEvent) => {
    if (!this.#dragging) return;

    const svgEl = this.querySelector("svg")!;
    const rect = svgEl.getBoundingClientRect();
    const sx = this.#actualWidth / rect.width;
    const sy = this.#svgHeight / rect.height;
    const px = (e.clientX - rect.left) * sx;
    const py = (e.clientY - rect.top) * sy;
    const ny = this.#fromY(py);

    switch (this.#dragging) {
      case "p0":
        // x is fixed at 0
        this.#p0y = ny;
        break;
      case "p1":
        this.#p1x = this.#fromX(px);
        this.#p1y = ny;
        break;
      case "p2":
        this.#p2x = this.#fromX(px);
        this.#p2y = ny;
        break;
      case "p3":
        // x is fixed at 1
        this.#p3y = ny;
        break;
    }

    this.#activePresetKey = findMatchingPreset(this.#controls);
    this.#render();
    this.#pushControls();
  };

  #onUp = () => {
    if (this.#dragging) {
      this.#dragging = null;
      this.#render();
    }
  };

  // -------------------------------------------------------------------
  // Event handlers
  // -------------------------------------------------------------------

  #onPresetChange = (e: Event) => {
    const key = (e.target as HTMLSelectElement).value;
    const preset = BEZIER_PRESETS.find((p) => p.key === key);
    if (preset) {
      // Apply the full preset shape including endpoints.
      this.#p0y = preset.controls.p0y;
      this.#p1x = preset.controls.p1x;
      this.#p1y = preset.controls.p1y;
      this.#p2x = preset.controls.p2x;
      this.#p2y = preset.controls.p2y;
      this.#p3y = preset.controls.p3y;
      this.#activePresetKey = preset.key;
      this.#pushControls();
      this.#render();
    }
  };

  #onReset = () => {
    const c = BEZIER_PRESETS[0].controls;
    this.#p0y = c.p0y;
    this.#p1x = c.p1x;
    this.#p1y = c.p1y;
    this.#p2x = c.p2x;
    this.#p2y = c.p2y;
    this.#p3y = c.p3y;
    this.#activePresetKey = BEZIER_PRESETS[0].key;
    this.#pushControls();
    this.#render();
  };

  #onStartChange = (e: Event) => {
    this.#p0y = 1 - parseFloat((e.target as HTMLInputElement).value);
    this.#activePresetKey = null;
    this.#pushControls();
    this.#render();
  };

  #onEndChange = (e: Event) => {
    this.#p3y = 1 - parseFloat((e.target as HTMLInputElement).value);
    this.#activePresetKey = null;
    this.#pushControls();
    this.#render();
  };

  // -------------------------------------------------------------------
  // Attrs
  // -------------------------------------------------------------------

  #readAttrs() {
    const v = parseFloat(this.getAttribute("height") ?? "");
    if (!isNaN(v) && v > 0) this.#svgHeight = v;
  }
}

// -------------------------------------------------------------------
// Define
// -------------------------------------------------------------------

customElements.define("bezier-editor", BezierEditor);
