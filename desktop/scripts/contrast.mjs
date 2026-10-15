// Measures every text / surface pair the shell uses against WCAG 2.2 AA,
// reading the token values from the CSS the app actually loads.
//   node scripts/contrast.mjs          table
//   node scripts/contrast.mjs --check  exit 1 when a pair fails
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { THRESHOLDS, composite, contrastRatio, parseColor, readTokens, toHex } from "../src/lib/contrast.js";

const root = new URL("../src/", import.meta.url);
const css = (file) => readFileSync(new URL(file, root), "utf8");

// `fg` / `bg` are a token, a token with Tailwind alpha ("paper/40") or a
// stack painted bottom-up ("ink > paper/5"). `opacity` is an element's own
// opacity, applied to the foreground only.
export const PAIRS = [
  { use: "Sidebar hint text, set chips, rail hosts", fg: "ink-mute", bg: "ink", kind: "text" },
  { use: "Mono labels on the focused card / pane header", fg: "paper-mute", bg: "paper", kind: "text" },
  { use: "Pane header subtitle (unfocused)", fg: "ink-mute", bg: "ink", kind: "text" },
  { use: "Pane placeholder host label (page not drawn yet)", fg: "ink-mute", bg: "deck-surface-ink", kind: "text" },
  { use: "Pane placeholder host label, focused pane", fg: "paper-mute", bg: "deck-surface-paper", kind: "text" },
  { use: "Hidden window card: name, number, hosts", fg: "ink-mute", bg: "ink", opacity: "hiddenOpacity", kind: "text" },
  { use: "Settings and dialog helper text", fg: "paper-mute", bg: "paper", kind: "text" },
  { use: "Text field placeholder (dialogs)", fg: "paper-mute", bg: "paper", kind: "text" },
  { use: "Address / find placeholder, focused pane", fg: "ink/placeholderAlpha", bg: "paper", kind: "text" },
  { use: "Address / find placeholder, other panes", fg: "paper/placeholderAlpha", bg: "ink", kind: "text" },
  { use: "Layout chip text on button fill", fg: "paper", bg: "ink > btn", kind: "text" },
  { use: "Command palette row hint on paper", fg: "paper-mute", bg: "paper", kind: "text" },
  { use: "Command palette selected row hint", fg: "ink-mute", bg: "ink", kind: "text" },
  { use: "Inactive tab title (other panes)", fg: "ink-mute", bg: "ink", kind: "text" },
  { use: "Inactive tab title, focused pane", fg: "paper-mute", bg: "paper", kind: "text" },
  { use: "Active tab title (other panes)", fg: "paper", bg: "deck-surface-ink", kind: "text" },
  { use: "Active tab title, focused pane", fg: "ink", bg: "deck-surface-paper", kind: "text" },
  { use: "Text field border (dialogs)", fg: "ink/edgeAlpha", bg: "paper", kind: "ui" },
  { use: "Choice pill border, unselected", fg: "ink/edgeAlpha", bg: "paper", kind: "ui" },
  { use: "Select / switcher pill border on ink", fg: "paper/edgeAlpha", bg: "ink", kind: "ui" },
  { use: "Active tab outline against the bar (other panes)", fg: "paper/edgeAlpha", bg: "ink", kind: "ui" },
  { use: "Active tab outline against the bar, focused pane", fg: "ink/edgeAlpha", bg: "paper", kind: "ui" },
  { use: "Key cap border", fg: "stroke", bg: "ink", kind: "ui" },
  { use: "Key cap border in sheets", fg: "ink/edgeAlpha", bg: "paper", kind: "ui" },
  { use: "Focus ring (currentColor) on ink", fg: "paper", bg: "ink", kind: "ui" },
  { use: "Focus ring (currentColor) on paper", fg: "ink", bg: "paper", kind: "ui" },
  { use: "AI status badge: Needs you", fg: "ink", bg: "deck-ai-wait", kind: "text" },
  { use: "AI status badge: Done", fg: "ink", bg: "deck-ai-done", kind: "text" },
  { use: "AI status badge: Error", fg: "ink", bg: "deck-ai-error", kind: "text" },
  { use: "Disabled back / forward icon (exempt, reported)", fg: "paper", bg: "ink", opacity: "disabledOpacity", kind: "exempt" },
];

// Alphas and opacities the components use. edgeAlpha and placeholderAlpha
// come from --deck-edge-alpha / --deck-placeholder-alpha in src/index.css
// (the Tailwind ink-edge, paper-edge, ink-hint and paper-hint colours);
// these defaults are the values before those tokens existed.
const COMPONENT_DEFAULTS = {
  hiddenOpacity: 1,
  placeholderAlpha: 0.4,
  edgeAlpha: 0.25,
  disabledOpacity: 0.4,
};

function resolveLayer(expr, tokens, values) {
  const [name, alpha] = expr.split("/");
  const raw = name === "ink" ? tokens["--cie-ink"] : name === "paper" ? tokens["--cie-paper"] : name.startsWith("deck-") ? tokens[`--${name}`] : tokens[`--cie-${name}`];
  if (!raw) throw new Error(`Unknown token ${name}`);
  const color = parseColor(raw);
  if (alpha == null) return color;
  const a = Number.isNaN(Number(alpha)) ? values[alpha] : Number(alpha) / 100;
  return { ...color, a: color.a * a };
}

function resolveStack(expr, tokens, values) {
  return expr
    .split(">")
    .map((layer) => resolveLayer(layer.trim(), tokens, values))
    .reduce((below, layer) => (below ? composite(layer, below) : { ...layer, a: 1 }), null);
}

export function audit({ tokens, values }) {
  return PAIRS.map((pair) => {
    const bg = resolveStack(pair.bg, tokens, values);
    const opacity = typeof pair.opacity === "string" ? values[pair.opacity] : pair.opacity ?? 1;
    const fg = composite(resolveLayer(pair.fg, tokens, values), bg, opacity);
    const ratio = contrastRatio(fg, bg);
    const need = THRESHOLDS[pair.kind] ?? null;
    return { ...pair, fgHex: toHex(fg), bgHex: toHex(bg), ratio, need, pass: need == null ? null : ratio >= need };
  });
}

/** Tokens as loaded (cie copies, then the app's overrides) and component alphas from --deck-* properties. */
export function currentTheme() {
  const tokens = readTokens(css("styles/cie/tokens.css"), css("index.css"));
  const values = { ...COMPONENT_DEFAULTS };
  for (const key of Object.keys(values)) {
    const name = `--deck-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
    if (tokens[name] != null) values[key] = parseFloat(tokens[name]);
  }
  return { tokens, values };
}

function print(rows) {
  const lines = ["| Use | Foreground | Background | Ratio | Needs | Result |", "| --- | --- | --- | --- | --- | --- |"];
  for (const row of rows) {
    const result = row.pass == null ? "exempt" : row.pass ? "pass" : "FAIL";
    lines.push(`| ${row.use} | \`${row.fgHex}\` | \`${row.bgHex}\` | ${row.ratio.toFixed(2)}:1 | ${row.need ? `${row.need}:1` : "—"} | ${result} |`);
  }
  return lines.join("\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rows = audit(currentTheme());
  console.log(print(rows));
  const failed = rows.filter((row) => row.pass === false);
  console.log(`\n${rows.length} pairs, ${failed.length} failing`);
  if (process.argv.includes("--check") && failed.length) process.exit(1);
}
