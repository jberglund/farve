import type { State } from "../state/types";

export type ExportFormat = "css" | "dtcg" | "json";

export interface ExportOptions {
  /** Which format to output. */
  format: ExportFormat;
  /** Which palette IDs to export. */
  paletteIds: string[];
  /** Optional prefix for variable/token names. */
  prefix: string;
  /** Optional human-readable names keyed by palette ID. Falls back to the ID. */
  names?: Record<string, string>;
}

/** Resolve which palette IDs to export based on options. */
export function resolvePaletteIds(state: State, paletteIds: string[]): string[] {
  return paletteIds.filter((id) => state.palettes[id]);
}

/** Get the display name for a palette, falling back to its ID. */
export function paletteName(id: string, options: ExportOptions): string {
  return options.names?.[id] || id;
}

export const FORMAT_LABELS: Record<ExportFormat, string> = {
  css: "CSS Custom Properties",
  dtcg: "DTCG (Design Tokens)",
  json: "JSON",
};
