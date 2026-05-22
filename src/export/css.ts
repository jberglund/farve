import { deriveSwatches } from "../state";
import type { State } from "../state/types";
import { type ExportOptions, resolvePaletteIds, paletteName } from "./types";

/**
 * Generate CSS custom properties for one or all palettes.
 *
 * Output example:
 * ```css
 * :root {
 *   --p1-0: oklch(0.98 0.02 264);
 *   --p1-50: oklch(0.95 0.04 264);
 *   ...
 * }
 * ```
 */
export function toCSS(state: State, options: ExportOptions): string {
  const lines: string[] = [":root {"];

  for (const paletteId of resolvePaletteIds(state, options.paletteIds)) {
    const swatches = deriveSwatches(state, paletteId);
    const prefix = options.prefix ? `${options.prefix}-` : "";
    const name = paletteName(paletteId, options);

    for (const swatch of swatches) {
      const varName = `--${prefix}${name}-${swatch.step}`;
      lines.push(`  ${varName}: ${swatch.css};`);
    }
  }

  lines.push("}");
  return lines.join("\n") + "\n";
}
