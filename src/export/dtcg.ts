import { deriveSwatches } from "../state";
import type { State } from "../state/types";
import { type ExportOptions, resolvePaletteIds, paletteName } from "./types";

/**
 * Generate DTCG-format design tokens for one or all palettes.
 *
 * Output follows the W3C DTCG spec:
 * https://tr.designtokens.org/format/
 *
 * Output example:
 * ```json
 * {
 *   "p1": {
 *     "0": { "$value": "oklch(0.98 0.02 264)", "$type": "color" },
 *     "50": { "$value": "oklch(0.95 0.04 264)", "$type": "color" }
 *   }
 * }
 * ```
 */
export function toDTCG(state: State, options: ExportOptions): string {
  const result: Record<string, Record<string, { $value: string; $type: "color" }>> = {};

  for (const paletteId of resolvePaletteIds(state, options.paletteIds)) {
    const swatches = deriveSwatches(state, paletteId);
    const name = paletteName(paletteId, options);
    const key = options.prefix ? `${options.prefix}-${name}` : name;

    result[key] = {};
    for (const swatch of swatches) {
      result[key][swatch.step] = {
        $value: swatch.css,
        $type: "color",
      };
    }
  }

  return JSON.stringify(result, null, 2) + "\n";
}
