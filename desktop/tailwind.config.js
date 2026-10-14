// Styled with cie-ds (https://cie-ds.vercel.app): two inks, no shadow, expo motion.
// `colors`, `boxShadow` and friends replace Tailwind's defaults instead of extending
// them, so palette classes like bg-zinc-900 or shadow-lg don't exist here.
const channel = (name) => `rgb(var(${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      ink: channel("--cie-ink-rgb"),
      paper: channel("--cie-paper-rgb"),
      "ink-mute": "var(--cie-ink-mute)",
      "paper-mute": "var(--cie-paper-mute)",
      stroke: "var(--cie-stroke)",
      btn: "var(--cie-btn)",
      "btn-hover": "var(--cie-btn-hover)",
      background: "var(--background)",
      foreground: "var(--foreground)",
    },
    fontFamily: {
      sans: ["var(--cie-sans)"],
      mono: ["var(--cie-mono)"],
    },
    boxShadow: { none: "none" },
    dropShadow: { none: "none" },
    borderRadius: {
      none: "0",
      tick: "4px",
      block: "var(--cie-r)",
      page: "var(--cie-r-page)",
      pill: "var(--cie-r-pill)",
    },
    extend: {
      transitionTimingFunction: {
        expo: "var(--cie-ease-expo)",
        out: "var(--cie-ease-out)",
        snap: "var(--cie-ease-snap)",
      },
      transitionDuration: {
        snap: "var(--cie-t-snap)",
        fast: "var(--cie-t-fast)",
        cell: "var(--cie-t-cell)",
        move: "var(--cie-t-move)",
        sheet: "var(--cie-t-sheet)",
      },
    },
  },
  plugins: [],
};
