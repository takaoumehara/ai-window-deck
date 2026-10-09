# Releasing AI Window Deck

The repository root is the extension package, so a release is the root zipped as is. There is no build step.

1. **Version.** Set the same `version` in `manifest.json` and `package.json`. It must be higher than the version published in the Chrome Web Store. Move the **Unreleased** entries in `CHANGELOG.md` under the new version.
2. **Panel changes.** If the panel changed, it was changed by a patch script (see `CONTRIBUTING.md`). Run it against the published 1.11.0 package and check the output equals the root:
   ```sh
   AWD_V1110_DIR=<unpacked-1.11.0> npm test
   ```
3. **Test and package.**
   ```sh
   npm test
   npm run package             # validates and writes ai-window-deck-vX.Y.Z.zip
   ```
   The validator (`tools/validate-package.mjs`) fails if a referenced file or `__MSG_` key is missing, a description exceeds 132 characters, a page loads a remote script, or sources, tests, docs or source maps end up in the archive.
4. **Smoke test.** Unzip the archive, load it unpacked in a clean Chrome profile, and try the main flow: Register URLs + Window (one by one and bulk), auto-place on the canvas, Launch, `Alt+X`, `Alt+Z`, and Escape in a form.
5. **Store assets.** If the UI changed, regenerate the listing graphics as described in `store-assets/PUBLISH-CHECKLIST.md`. They are uploaded separately from the package.
6. **Privacy policy.** If data handling changed, edit `PRIVACY.md` and regenerate `store-assets/privacy-policy.html`:
   ```sh
   python3 -c "import markdown,sys; print(markdown.markdown(open('PRIVACY.md').read(), extensions=['extra']))"
   ```
   Paste the result into the `<body>` of `store-assets/privacy-policy.html`.
7. **Upload.** In the Chrome Web Store dashboard, upload the ZIP (or use `node tools/cws-publish.mjs <zip>`), update the listing text and graphics from `store-assets/listing/`, and submit for review.
8. **Tag after approval.**
   ```sh
   git tag -a vX.Y.Z -m "AI Window Deck vX.Y.Z"
   git push origin vX.Y.Z
   gh release create vX.Y.Z ai-window-deck-vX.Y.Z.zip --title "vX.Y.Z" --notes-file <(sed -n '/## \[X.Y.Z\]/,/## \[/p' CHANGELOG.md)
   ```
   Release ZIPs are not committed (`.gitignore`). The GitHub Release is where they live.

The site in `site/` is deployed by Vercel from `main` with the root `vercel.json` (static, no build).
