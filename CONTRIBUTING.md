# Contributing to AI Window Deck

Thanks for helping. Bug reports and ideas are welcome in [Issues](https://github.com/takaoumehara/ai-window-deck/issues).

## Development setup

The repository root is the 1.11.2 extension package. There is nothing to install or build:

```sh
npm test             # node --test test/*.test.js (Node 20+)
npm run package      # writes and validates ai-window-deck-vX.Y.Z.zip
```

Load the repository folder at `chrome://extensions` → **Developer mode** → **Load unpacked**. After pulling changes, click the reload icon on the extension card.

The panel in `dist/` is the built 1.11.x bundle. Its source is not in this repository, so changes to the panel are made as patch scripts against the published 1.11.0 package (`tools/patch-v1.11-bulk-import.mjs`, `tools/patch-v1.11.2-inline-register.mjs`). Each replacement must match exactly once:

```sh
npm run patch -- <unpacked-1.11.0> <out>          # rebuilds the 1.11.2 package
AWD_V1110_DIR=<unpacked-1.11.0> npm test          # also checks the output equals the repository root
```

Copy the patch output over the root files and commit both the script and the result. Do not edit `dist/` by hand.

The 1.7 source (`src/`, Vite, the older `deck.html` panel and their tests) lives in [`legacy/v1.7/`](legacy/v1.7/README.md) for reference.

## Tests

- `npm test` must pass before a pull request is merged.
- Add a test in `test/` when you change a patch script, the manifest or packaging.
- For UI changes, describe how you checked them manually. Include a screenshot if the change is visible.

## Translations (i18n)

- Chrome strings (description, shortcut names) are in `_locales/<locale>/messages.json`. Panel strings are inside the bundle and change through the patch scripts.
- Cover **all eight locales**: en, ja, de, es, fr, ko, pt-BR, zh-CN.
- The extension description must stay within 132 characters in every locale. `npm test` and `tools/package.sh` check this.

## Pull requests

- Branch from `main` and keep each PR focused on one change.
- Use [Conventional Commits](https://www.conventionalcommits.org/) style messages (`feat:`, `fix:`, `docs:`, `chore:` …).
- Keep the repository root loadable unpacked: it must always be a complete package.
- Do not add permissions, host access, remote code, analytics or network requests without discussing it in an issue first. The store listing and privacy policy promise none of them.
- Update `CHANGELOG.md` under **Unreleased**.

## Website

`site/` is a static site. Vercel serves it as is (root `vercel.json`: no install, no build, output `site`).

## Releases and tags

- Tags are `vX.Y.Z` on `main`. A version is tagged **after** the Chrome Web Store approves it.
- Each tag gets a GitHub Release with the ZIP from `npm run package` attached.

See [docs/RELEASING.md](docs/RELEASING.md) for the full checklist.
