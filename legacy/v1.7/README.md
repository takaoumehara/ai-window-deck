# Legacy: AI Window Deck 1.7 source

This folder is the pre-1.11 source of AI Window Deck: the 1.7 React + Tailwind panel (`src/`, `index.html`, Vite config), the older `deck.html` / `dock.html` pages, the 1.7 service worker, manifest, locales and icons, its build tools and its tests. It is kept for history and reference only. It is **not** what the Chrome Web Store ships.

The source of 1.11.x is not in this repository. The extension in the repository root is the 1.11.2 package itself. It is rebuilt from the published 1.11.0 store package by the patch scripts in `../../tools/`:

```sh
npm run patch -- <unpacked-1.11.0> <out>   # tools/patch-v1.11.2-inline-register.mjs (applies 1.11.1 first)
```

To work with the 1.7 code, run everything from this folder so nothing touches the root package:

```sh
cd legacy/v1.7
npm install
npm test            # the 1.7 unit tests
npm run build       # writes legacy/v1.7/dist/, never the root dist/
```

`legacy/v1.7/` also loads unpacked in Chrome as the 1.7 extension (its `dist/` is committed).
