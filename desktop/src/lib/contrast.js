// WCAG 2.2 contrast math (relative luminance, alpha compositing) for the
// token audit in scripts/contrast.mjs.

export function parseColor(value) {
  const text = String(value).trim().toLowerCase();
  const hex = text.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hex) {
    const digits = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join("") : hex[1];
    return { r: parseInt(digits.slice(0, 2), 16), g: parseInt(digits.slice(2, 4), 16), b: parseInt(digits.slice(4, 6), 16), a: 1 };
  }
  const rgb = text.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
  if (rgb) {
    const alpha = rgb[4] == null ? 1 : rgb[4].endsWith("%") ? parseFloat(rgb[4]) / 100 : parseFloat(rgb[4]);
    return { r: +rgb[1], g: +rgb[2], b: +rgb[3], a: alpha };
  }
  throw new Error(`Unsupported colour: ${value}`);
}

/** `top` (with its alpha, times `opacity`) painted over an opaque `bottom`. */
export function composite(top, bottom, opacity = 1) {
  const a = top.a * opacity;
  const mix = (channel) => top[channel] * a + bottom[channel] * (1 - a);
  return { r: mix("r"), g: mix("g"), b: mix("b"), a: 1 };
}

const linear = (channel) => {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

export function luminance({ r, g, b }) {
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

export function contrastRatio(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

export const toHex = ({ r, g, b }) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

// 1.4.3: 4.5:1 for text, 3:1 for large text (24px, or 18.66px bold).
// 1.4.11: 3:1 for component boundaries, focus indicators and meaningful icons.
export const THRESHOLDS = { text: 4.5, large: 3, ui: 3 };

/** Custom property values from CSS text; later declarations win, as in the cascade on :root. */
export function readTokens(...cssTexts) {
  const tokens = {};
  for (const css of cssTexts) {
    for (const [, name, value] of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) tokens[name] = value.trim();
  }
  return tokens;
}
