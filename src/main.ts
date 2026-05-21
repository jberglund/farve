import "./style.css";
import "./components/gamut-checker";
import "./components/step-slider";
import "./components/lightness-editor";
import "./components/palette-panel";
import { initUrlSync } from "./state";

// Hydrate from URL (if params exist) and wire up persistence
initUrlSync();
