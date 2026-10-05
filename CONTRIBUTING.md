# Contributing to AI Window Deck

Thanks for helping. Bug reports and ideas are welcome in [Issues](https://github.com/takaoumehara/ai-window-deck/issues).

## Development setup

```sh
npm install
npm run build        # builds the React panel into dist/
npm test             # node --test test/*.test.js
```

Load the repository folder at `chrome://extensions` → **Developer mode** → **Load unpacked**. After changing `src/`, run `npm run build` and click the reload icon on the extension card. After changing `background.js` or `manifest.json`, reload the extension.

## Tests

- `npm test` must pass before a pull request is merged.
- Add a test in `test/` when you fix a bug in pure logic (`src/lib/`, `layout-model.js`) or change the manifest or packaging.
- For UI changes, describe how you checked them manually. Include a screenshot if the change is visible.

## Translations (i18n)

- Panel strings: `tools/ui-strings.json`. Chrome strings (description, shortcut names): `tools/strings.json`.
- Add every new key to **all eight locales**: en, ja, de, es, fr, ko, pt-BR, zh-CN. Keep `{placeholders}` identical.
- Regenerate with `python3 tools/build-i18n.py`. Do not edit `src/lib/ui-strings.js`, `strings.js` or `_locales/` by hand.
- The extension description must stay within 132 characters in every locale. `npm test` and `tools/package.sh` check this.

## Pull requests

- Branch from `main` and keep each PR focused on one change.
- Use [Conventional Commits](https://www.conventionalcommits.org/) style messages (`feat:`, `fix:`, `docs:`, `chore:` …).
- Commit the rebuilt `dist/` together with any `src/` change, so the repository keeps loading unpacked.
- Do not add permissions, host access, remote code, analytics or network requests without discussing it in an issue first. The store listing and privacy policy promise none of them.
- Update `CHANGELOG.md` under **Unreleased**.

## Releases and tags

- Tags are `vX.Y.Z` on `main`. A version is tagged **after** the Chrome Web Store approves it.
- Each tag gets a GitHub Release with `AI-Window-Deck-vX.Y.Z.zip` from `./tools/package.sh` attached.
- `v1.7.0` will be the first tag, created after this release is merged and approved. Earlier versions (1.4.0–1.6.2) are untagged.

See [docs/RELEASING.md](docs/RELEASING.md) for the full checklist.
