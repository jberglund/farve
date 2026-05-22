import type { State } from "../state/types";
import { toCSS } from "./css";
import { toDTCG } from "./dtcg";
import { toJSON } from "./json";
import type { ExportOptions } from "./types";

/** Dispatch to the correct exporter based on options.format. */
export function generateExport(state: State, options: ExportOptions): string {
  switch (options.format) {
    case "css":
      return toCSS(state, options);
    case "dtcg":
      return toDTCG(state, options);
    case "json":
      return toJSON(state, options);
  }
}
