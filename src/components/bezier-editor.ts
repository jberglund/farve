import { svg, render } from "lit-html";
import { cubicBezierPoint } from "../state/bezier";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_SIZE = 150;
const PAD = 10;
const HANDLE_R = 8;
const CURVE_STEPS = 60;

const snap3 = (n: number) => Number(n.toFixed(3));

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Cubic-bezier curve editor — 2 draggable shape handles, fixed endpoints.
 *
 * P0 = (0,0) top-left  (bright)  — fixed anchor
 * P3 = (1,1) bottom-right (dark) — fixed anchor
 * P1, P2 — draggable shape handles
 *
 * @attr p1x, p1y, p2x, p2y
 * @attr width, aspect-ratio
 * @fires bezier-change — { p1x, p1y, p2x, p2y }
 */
class BezierEditor extends HTMLElement {
  static get observedAttributes() {
    return ["p1x", "p1y", "p2x", "p2y", "width", "aspect-ratio"];
  }

  #p1x = 0.75;
  #p1y = 0.05;
  #p2x = 0.25;
  #p2y = 0.95;
  #dragging: "p1" | "p2" | null = null;

  // Sizing
  #width = DEFAULT_SIZE;
  #height = DEFAULT_SIZE;

  // -------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------

  connectedCallback() {
    this.#readAttrs();
    this.#resolveSize();
    this.#render();
  }

  attributeChangedCallback(name: string, _old: string, newValue: string) {
    if (["p1x", "p1y", "p2x", "p2y"].includes(name)) {
      const v = parseFloat(newValue);
      if (isNaN(v)) return;
      this.#setField(name, v);
    } else if (["width", "aspect-ratio"].includes(name)) {
      this.#resolveSize();
    }
    this.#render();
  }

  // -------------------------------------------------------------------
  // Sizing
  // -------------------------------------------------------------------

  #resolveSize() {
    const w = parseFloat(this.getAttribute("width") ?? "");
    const ar = parseFloat(this.getAttribute("aspect-ratio") ?? "");

    this.#width = isNaN(w) ? DEFAULT_SIZE : w;
    this.#height = this.#width * (isNaN(ar) ? 1 : ar);
  }

  /** Plot-area width (accounting for padding). */
  get #pw() {
    return this.#width - 2 * PAD;
  }
  /** Plot-area height (accounting for padding). */
  get #ph() {
    return this.#height - 2 * PAD;
  }

  // -------------------------------------------------------------------
  // Coordinate helpers (instance methods — depend on dynamic #pw / #ph)
  // -------------------------------------------------------------------

  /** Normalised (0–1) → SVG pixel.  y flips so 0=top, 1=bottom. */
  #toX = (n: number) => PAD + n * this.#pw;
  #toY = (n: number) => PAD + n * this.#ph;

  /** SVG pixel → normalised (0–1). */
  #fromX = (px: number) => Math.max(0, Math.min(1, (px - PAD) / this.#pw));
  #fromY = (py: number) => Math.max(0, Math.min(1, (py - PAD) / this.#ph));

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------

  #render() {
    const p1x = this.#p1x;
    const p1y = this.#p1y;
    const p2x = this.#p2x;
    const p2y = this.#p2y;
    const w = this.#width;
    const h = this.#height;
    const pw = this.#pw;
    const ph = this.#ph;
    const toX = this.#toX;
    const toY = this.#toY;

    // Build the curve polyline
    let pts = "";
    for (let i = 0; i <= CURVE_STEPS; i++) {
      const pt = cubicBezierPoint(i / CURVE_STEPS, p1x, p1y, p2x, p2y);
      pts += `${toX(pt.x)},${toY(pt.y)} `;
    }

    render(
      svg`
        <svg
          viewBox="0 0 ${w} ${h}"
          width="${w}" height="${h}"
          style="display:block;touch-action:none;user-select:none"
          @pointermove=${this.#onMove}
          @pointerup=${this.#onUp}
          @pointerleave=${this.#onUp}
        >
          <!-- Plot background -->
          <rect x="${PAD}" y="${PAD}" width="${pw}" height="${ph}" fill="var(--surface-raised)" />

          <!-- Grid -->
          ${[1, 2, 3].map(
            (i) => svg`
              <line x1="${PAD + (pw * i) / 4}" y1="${PAD}" x2="${PAD + (pw * i) / 4}" y2="${PAD + ph}" stroke="var(--border-default)" stroke-width="1" />
              <line x1="${PAD}" y1="${PAD + (ph * i) / 4}" x2="${PAD + pw}" y2="${PAD + (ph * i) / 4}" stroke="var(--border-default)" stroke-width="1" />
            `,
          )}

          <!-- Axes -->
          <line x1="${PAD}" y1="${PAD + ph}" x2="${PAD + pw}" y2="${PAD + ph}" stroke="var(--text-low)" stroke-width="1.5" />
          <line x1="${PAD}" y1="${PAD + ph}" x2="${PAD}" y2="${PAD}" stroke="var(--text-low)" stroke-width="1.5" />

          <!-- Control line P0(0,0) → P1 -->
          <line x1="${PAD}" y1="${PAD}" x2="${toX(p1x)}" y2="${toY(p1y)}" stroke="var(--border-default)" stroke-width="1" stroke-dasharray="4 3" />

          <!-- Control line P3(1,1) → P2 -->
          <line x1="${PAD + pw}" y1="${PAD + ph}" x2="${toX(p2x)}" y2="${toY(p2y)}" stroke="var(--border-default)" stroke-width="1" stroke-dasharray="4 3" />

          <!-- Curve -->
          <polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" />

          <!-- Fixed anchors: P0 and P3 -->
          <circle cx="${PAD}" cy="${PAD}" r="3" fill="var(--text-low)" />
          <circle cx="${PAD + pw}" cy="${PAD + ph}" r="3" fill="var(--text-low)" />

          <!-- P1 handle -->
          ${this.#handle(toX(p1x), toY(p1y), this.#dragging === "p1", "p1")}

          <!-- P2 handle -->
          ${this.#handle(toX(p2x), toY(p2y), this.#dragging === "p2", "p2")}
        </svg>
      `,
      this,
    );
  }

  #handle(cx: number, cy: number, active: boolean, which: "p1" | "p2") {
    return svg`
      <circle
        cx="${cx}" cy="${cy}" r="${HANDLE_R}"
        fill="${active ? "var(--accent)" : "var(--surface-default)"}"
        stroke="var(--accent)" stroke-width="2"
        style="cursor:grab"
        @pointerdown=${(e: PointerEvent) => this.#start(e, which)}
      />
      <circle cx="${cx}" cy="${cy}" r="2.5" fill="${active ? "var(--surface-default)" : "var(--accent)"}" pointer-events="none" />
    `;
  }

  // -------------------------------------------------------------------
  // Drag
  // -------------------------------------------------------------------

  #start(e: PointerEvent, which: "p1" | "p2") {
    this.#dragging = which;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    this.#render();
    e.preventDefault();
  }

  #onMove = (e: PointerEvent) => {
    if (!this.#dragging) return;

    const svgEl = this.querySelector("svg")!;
    const rect = svgEl.getBoundingClientRect();
    const sx = this.#width / rect.width;
    const sy = this.#height / rect.height;
    const px = (e.clientX - rect.left) * sx;
    const py = (e.clientY - rect.top) * sy;
    const nx = this.#fromX(px);
    const ny = this.#fromY(py);

    if (this.#dragging === "p1") {
      this.#p1x = nx;
      this.#p1y = ny;
    } else {
      this.#p2x = nx;
      this.#p2y = ny;
    }

    this.#render();
    this.#emitChange();
  };

  #onUp = () => {
    if (this.#dragging) {
      this.#dragging = null;
      this.#render();
    }
  };

  // -------------------------------------------------------------------
  // Events & attrs
  // -------------------------------------------------------------------

  #emitChange() {
    this.dispatchEvent(
      new CustomEvent("bezier-change", {
        detail: {
          p1x: snap3(this.#p1x),
          p1y: snap3(this.#p1y),
          p2x: snap3(this.#p2x),
          p2y: snap3(this.#p2y),
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  #setField(name: string, v: number) {
    const map: Record<string, () => void> = {
      p1x: () => (this.#p1x = v),
      p1y: () => (this.#p1y = v),
      p2x: () => (this.#p2x = v),
      p2y: () => (this.#p2y = v),
    };
    map[name]?.();
  }

  #readAttrs() {
    const a = (n: string, d: number) => {
      const v = parseFloat(this.getAttribute(n) ?? "");
      return isNaN(v) ? d : v;
    };
    this.#p1x = a("p1x", 0.75);
    this.#p1y = a("p1y", 0.05);
    this.#p2x = a("p2x", 0.25);
    this.#p2y = a("p2y", 0.95);
  }
}

customElements.define("bezier-editor", BezierEditor);
export default BezierEditor;
