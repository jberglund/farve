import Color from "colorjs.io";

const GAMUTS = ["srgb", "p3", "rec2020"] as const;

/**
 * A custom element that checks whether a color on a target element falls
 * within common display color spaces.
 *
 * Sets the `color-gamut` attribute on itself to one of:
 *   "srgb" | "p3" | "rec2020" | "rec2020+"
 *
 * @attr target          - Optional CSS selector for the element to observe.
 *                         Defaults to the host element itself.
 * @attr target-strategy - "descendants" (querySelector within host) or
 *                         "closest" (closest ancestor). Default: "descendants".
 * @attr property        - The CSS property to read color from. Supports custom
 *                         properties (--my-color). Default: "background-color".
 *
 * @example
 * <gamut-checker target=".swatch" property="--swatch-color"></gamut-checker>
 */
class GamutChecker extends HTMLElement {
  private observer: MutationObserver | null = null;
  private targetElement: HTMLElement | null = null;

  static get observedAttributes() {
    return ["target", "target-strategy", "property"];
  }

  connectedCallback() {
    // If the parent already set color-gamut, skip DOM-based auto-detection.
    if (this.hasAttribute("color-gamut")) return;

    this.resolveTarget();
    this.setupObserver();
    this.checkColor();
  }

  disconnectedCallback() {
    this.teardownObserver();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return;

    if (name === "target" || name === "target-strategy") {
      this.teardownObserver();
      this.resolveTarget();
      this.setupObserver();
    }

    this.checkColor();
  }

  // ---------------------------------------------------------------------------
  // Target resolution
  // ---------------------------------------------------------------------------

  private resolveTarget(): void {
    const selector = this.getAttribute("target");

    if (!selector) {
      this.targetElement = this;
      return;
    }

    const strategy = this.getAttribute("target-strategy") || "descendants";

    try {
      this.targetElement =
        strategy === "closest"
          ? (this.closest(selector) as HTMLElement | null)
          : this.querySelector(selector);

      if (!this.targetElement) {
        console.error(
          `[gamut-checker] No element found for selector: "${selector}" with strategy: "${strategy}"`,
        );
      }
    } catch (error) {
      console.error(`[gamut-checker] Invalid selector: "${selector}"`, error);
      this.targetElement = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Color checking
  // ---------------------------------------------------------------------------

  checkColor(): void {
    if (!this.targetElement) return;

    const propertyName = this.getAttribute("property") || "background-color";
    const colorValue = window
      .getComputedStyle(this.targetElement)
      .getPropertyValue(propertyName)
      .trim();

    if (!colorValue || colorValue === "rgba(0, 0, 0, 0)" || colorValue === "transparent") {
      this.removeAttribute("color-gamut");
      return;
    }

    try {
      const color = new Color(colorValue);

      for (const gamut of GAMUTS) {
        try {
          if (color.to(gamut).inGamut()) {
            this.setAttribute("color-gamut", gamut);
            return;
          }
        } catch {
          // Conversion failed for this space — try the next
        }
      }

      this.setAttribute("color-gamut", "rec2020+");
    } catch {
      console.error(`[gamut-checker] Invalid color value: "${colorValue}"`);
      this.removeAttribute("color-gamut");
    }
  }

  // ---------------------------------------------------------------------------
  // Observer management
  // ---------------------------------------------------------------------------

  private setupObserver(): void {
    if (!this.targetElement) return;

    this.observer = new MutationObserver(() => this.checkColor());

    this.observer.observe(this.targetElement, {
      attributes: true,
      attributeFilter: ["style", "class"],
    });
  }

  private teardownObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

customElements.define("gamut-checker", GamutChecker);

export default GamutChecker;
