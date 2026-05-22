# Shared vocabulary

## The backbone

**Step**
One of the 20 fixed stops: `0`, `50`, `100` … `950`. Think of these as the x-axis that everything hangs off — lightness, chroma, and hue shift are all defined per step.

**Step scale**
The full set of 20 steps. Referenced as `STEPS` in code.

---

## Curves

**Curve**
A mapping from each step to a numeric value (0–1 for lightness, 0–~0.6 for chroma). The `Curve` type.

**Lightness curve**
The global curve — one lightness value per step. Shared across all palettes. Shaped by the bezier editor and fine-tuned with per-step sliders.

**Chroma curve**
Per-palette — one chroma value per step. Initially derived from the origin color's fill ratio, then adjustable by the user step-by-step.

---

## Palettes & color

**Palette**
A hue family defined by an origin color, a chroma curve, and an optional hue shift. Multiple palettes can coexist, each with independent chroma and hue settings but sharing the global lightness curve.

**Origin**
The single source color (in OKLCH) that seeds a palette. Its hue defines the palette's identity. Its chroma sets the fill ratio used to derive the initial chroma curve.

**Swatch**
One computed color at a given step: `oklch(lightness, chroma, hue)`. The rendered output — a colored rectangle.

**Swatch row**
The horizontal strip of 20 swatches displayed above the chroma sliders in a palette panel.

**Hue shift**
A hue offset applied at the dark end (step 950) that tapers to zero at the light end (step 0). Controlled by two parameters:

- **Amount** — maximum degrees added at the dark end (-30° to +30°).
- **Taper** — exponent controlling how quickly the shift fades toward the light end.

---

## Derivation logic

**Gamut ceiling**
The maximum chroma at a given (L, H) that stays inside a target display gamut. Drawn as a danger-zone line on chroma sliders. The ceiling gamut is configurable: sRGB, P3, or Rec.2020.

**Fill ratio**
`origin.c / maxChromaAt(origin.l, origin.h)` — how saturated the origin is relative to the gamut ceiling at its own lightness and hue. The chroma curve is derived by multiplying the ceiling at each step by this ratio. This preserves the origin's relative saturation across the step scale and naturally handles hue-specific gamut shapes (e.g. blues peak at low L, yellows at high L).

---

## Editors & controls

**Step slider**
The `<step-slider>` web component — a range input paired with a number input, representing one step's value. Used for both lightness and chroma. Supports ceiling zone rendering and vertical orientation.

**Lightness editor**
The top section of the app. Contains the bezier curve widget, preset dropdown, start/end lightness inputs, and per-step lightness sliders.

**Bezier editor**
The SVG widget with two draggable control points (P1, P2) that shapes the lightness curve. P0 = (0,0) top-left (bright), P3 = (1,1) bottom-right (dark).

**Origin editor**
The color picker, hex input, OKLCH readout (L / C / H), and hue shift controls inside a palette panel.

**Chroma editor**
The row of per-step chroma sliders inside a palette panel. Each slider shows a gamut ceiling line based on the palette's hue and the configured ceiling gamut.

**Palette toolbar**
The global controls bar: add palette, max chroma, ceiling gamut selector, linked editing toggle, and propagation decay.

**Linked editing**
When enabled, dragging a step slider propagates a weighted delta to neighboring steps instead of only changing the dragged step.

**Propagation decay**
A value (0–1) controlling how fast the linked-editing ripple fades with distance from the changed step. Higher = broader spread.

---

## Layout

**The grid**
The two-column pattern used throughout: configuration on the left, step sliders and swatches on the right. Driven by `the-grid` and `the-grid__origin` / `the-grid__steps` CSS classes.

---

## Gamut classification

**Gamut badge**
The label on each swatch indicating which display gamut its color falls into: `srgb`, `p3`, `rec2020`, or `rec2020+` (beyond Rec.2020). Provided by `<gamut-checker>`.

---

## State & persistence

**Store**
The singleton state container. Holds lightness, palettes, and settings. All mutations go through the store; all components subscribe for updates.

**URL sync**
State is serialized to the URL hash fragment on every change, making any palette configuration shareable via URL. On load, URL params hydrate the store (URL wins over defaults).
