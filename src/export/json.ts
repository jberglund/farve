import { deriveSwatches } from "../state";
import type { State } from "../state/types";
import { type ExportOptions, resolvePaletteIds, paletteName } from "./types";

/**
 * Generate a simple flat JSON mapping of token names to color values.
 *
 * Compatible with Style Dictionary and other token pipelines.
 *
 * Output example:
 * ```json
 * {
 *   "p1": {
 *     "0": { "value": "oklch(0.98 0.02 264)" },
 *     "50": { "value": "oklch(0.95 0.04 264)" }
 *   }
 * }
 * ```
 */
export function toJSON(state: State, options: ExportOptions): string {
  const result: Record<string, Record<string, { value: string }>> = {};

  for (const paletteId of resolvePaletteIds(state, options.paletteIds)) {
    const swatches = deriveSwatches(state, paletteId);
    const name = paletteName(paletteId, options);
    const key = options.prefix ? `${options.prefix}-${name}` : name;

    result[key] = {};
    for (const swatch of swatches) {
      result[key][swatch.step] = { value: swatch.css };
    }
  }

  return JSON.stringify(result, null, 2) + "\n";
}
