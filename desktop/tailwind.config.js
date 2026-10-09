import animate from "tailwindcss-animate";
import extensionConfig from "../tailwind.config.js";

/** @type {import('tailwindcss').Config} */
export default {
  ...extensionConfig,
  content: ["./index.html", "./src/**/*.{js,jsx}", "../src/components/ui/**/*.jsx"],
  plugins: [animate],
};
