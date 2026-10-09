# AI Window Deck — publish checklist (v1.11.2)

## Package

The repository root is the 1.11.2 package. Zip it with no build step:

```sh
npm test
npm run package          # writes and validates ai-window-deck-v1.11.2.zip
```

The root files come from the published 1.11.0 store package through the patch scripts. To reproduce them:

```sh
npm run patch -- <unpacked-1.11.0> <out>          # also applies the 1.11.1 patch
AWD_V1110_DIR=<unpacked-1.11.0> npm test          # checks the output equals the root, byte for byte
```

- [x] `ai-window-deck-v1.11.2.zip`: 19 files, manifest 1.11.2, permissions `tabs`, `tabGroups`, `storage`, `system.display` (unchanged from 1.11.0), validated.
- [x] `npm run package` from the root gives the same 19 files, byte for byte.

## Listing graphics

The store listing graphics are uploaded separately from the package, so a new ZIP does not replace them. Upload these under **Store listing → Graphic assets** in the developer dashboard, and delete the old screenshots first:

| Dashboard field | File |
| --- | --- |
| Store icon (128 × 128) | `listing/store-icon-128.png` |
| Screenshots (1280 × 800), English | `listing/en/01-register.png`, `02-bulk-paste.png`, `03-layout.png`, `04-focus-view.png`, `05-launch.png` |
| Screenshots, Japanese listing | `listing/ja/01-…05-*.png` (Japanese captions and the Japanese UI) |
| Small promo tile (440 × 280) | `listing/promo-small.png` |
| Marquee promo tile (1400 × 560) | `listing/promo-marquee.png` |

Listing text, including "What's new in 1.11.2": `listing/en/description.txt` and `listing/ja/description.txt`. The short description is the manifest's `extDescription`; Chrome fills it in from the package. Other locales: `LOCALIZED-PRODUCT-DETAILS.md` (pre-1.11 text; add the register feature when you update them).

Regenerate the graphics in this order:

1. `python3 store-assets/make-store-icon.py` (store icon only; the package icons ship unchanged).
2. Serve the repository root (`python3 -m http.server 8782`) and run `store-assets/capture-app-screens.mjs`. It writes the extension screenshots used by the site, the READMEs and the listing into `site/assets/img/`.
3. Serve `site/` and run `store-assets/capture-listing-graphics.mjs` with `SITE_URL` pointing at it.

Both capture scripts take `PLAYWRIGHT` (path to `playwright-core`) and `CHROME` (path to Chrome).

## Ready in the repository

- [x] Listing graphics above, all at the store's exact sizes (screenshots and promo tiles opaque RGB; the store icon keeps its transparent padding).
- [x] Privacy policy: `../PRIVACY.md`, plus generated `privacy-policy.html`. Dashboard answers: `CHROME_WEB_STORE_PRIVACY_PRACTICES.md` (unchanged: no new permissions or data use in 1.11.2).
- [x] Support contact: `https://github.com/takaoumehara/ai-window-deck/issues`
- [x] Site (`site/`) updated for 1.11.2. Vercel deploys it from `main` after the release PR is merged; the root `vercel.json` serves `site/` as is, with no install or build.

## In the publisher's Chrome Web Store account

- [ ] Upload `ai-window-deck-v1.11.2.zip` to the existing item and confirm the version reads 1.11.2. With `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN` and `CWS_EXTENSION_ID` set, `node tools/cws-publish.mjs --check` confirms access, `node tools/cws-publish.mjs <zip>` uploads a draft, and adding `--publish` submits it for review. The API cannot change the listing text or graphics, so do the next step in the dashboard before submitting.
- [ ] Paste the detailed description from `listing/<locale>/description.txt` and upload the screenshots and promo tiles.
- [ ] Privacy practices: unchanged. Only **Web history** is checked, plus all three certifications, and remote code is **No**.
- [ ] Submit for review.
- [ ] After approval: tag `v1.11.2` on `main` and create a GitHub Release with the ZIP (see `../docs/RELEASING.md`).

## Final pre-submit check

- [ ] Load the exact ZIP unpacked in a clean Chrome profile and try: **Register URLs + Window** → bulk paste with a missing blank line → **Fix** → **Bulk Save** → auto-place → Launch → Alt+X / Alt+Z.
- [ ] With **Allow access to file URLs** on for the extension, a local file path opens as a `file://` tab.
- [ ] More → the Ko-fi link opens https://ko-fi.com/G2G71VP1DF in a new tab.
- [ ] Screenshots show the current UI and no personal data.
- [ ] Permission warnings on install match the listing: "Read your browsing history" (from `tabs`) and nothing broader.
