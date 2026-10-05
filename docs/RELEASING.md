# Releasing AI Window Deck

1. **Version.** Set the same `version` in `manifest.json` and `package.json`, and in `package-lock.json` (`npm install --package-lock-only`). Move the **Unreleased** entries in `CHANGELOG.md` under the new version.
2. **Translations.** If strings changed, run `python3 tools/build-i18n.py` and check every locale is complete.
3. **Build and test.**
   ```sh
   npm ci
   npm test
   ./tools/package.sh          # builds, validates, writes AI-Window-Deck-vX.Y.Z.zip
   ```
   The validator fails if a referenced file or `__MSG_` key is missing, a description exceeds 132 characters, a page loads a remote script, or sources, tests, docs or source maps end up in the archive.
4. **Smoke test.** Unzip the archive, load it unpacked in a clean Chrome profile, and try the main flow: register a window, drag it onto the canvas, Launch, `Alt+X`, `Alt+Z`, and Escape in a dialog.
5. **Store assets.** If the UI changed, regenerate the screenshots and promo tiles:
   ```sh
   PLAYWRIGHT=/path/to/node_modules/playwright/index.mjs node store-assets/capture-store-assets.mjs store-assets en,ja
   ```
   This writes `store-assets/screenshots/<locale>/`. Copy `en` into `store-assets/screenshots/` and `ja` into `store-assets/localized/ja/screenshots/`.
6. **Privacy policy.** If data handling changed, edit `PRIVACY.md` and regenerate `store-assets/privacy-policy.html`:
   ```sh
   python3 -c "import markdown,sys; print(markdown.markdown(open('PRIVACY.md').read(), extensions=['extra']))"
   ```
   Paste the result into the `<body>` of `store-assets/privacy-policy.html`.
7. **Upload.** In the Chrome Web Store dashboard, upload the ZIP and update the listing and privacy fields from `store-assets/`. Submit for review.
8. **Tag after approval.**
   ```sh
   git tag -a vX.Y.Z -m "AI Window Deck vX.Y.Z"
   git push origin vX.Y.Z
   gh release create vX.Y.Z AI-Window-Deck-vX.Y.Z.zip --title "vX.Y.Z" --notes-file <(sed -n '/## \[X.Y.Z\]/,/## \[/p' CHANGELOG.md)
   ```
   Release ZIPs are not committed (`.gitignore`). The GitHub Release is where they live.
