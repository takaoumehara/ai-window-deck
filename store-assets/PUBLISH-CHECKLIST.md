# AI Window Deck — publish checklist (v1.7.0)

## Ready in the repository

- [x] Upload package: run `./tools/package.sh` → `AI-Window-Deck-v1.7.0.zip` (validated; not committed)
- [x] 128 × 128 store icon: `../icons/icon-128.png`
- [x] English listing copy: `STORE-LISTING.md`. All 8 locales: `LOCALIZED-PRODUCT-DETAILS.md`
- [x] Five English screenshots at 1280 × 800 (`screenshots/0[1-5]-*.png`) and five Japanese ones (`localized/ja/screenshots/`)
- [x] 440 × 280 small promo tile and 1400 × 560 marquee tile: `promo-small.png`, `promo-marquee.png`
- [x] Privacy policy: `../PRIVACY.md`, plus generated `privacy-policy.html`. Dashboard answers: `CHROME_WEB_STORE_PRIVACY_PRACTICES.md`
- [x] Support contact: `https://github.com/takaoumehara/ai-window-deck/issues`

## In the publisher's Chrome Web Store account

- [ ] Upload `AI-Window-Deck-v1.7.0.zip` to the existing draft and confirm the version reads 1.7.0.
- [ ] Paste listing copy per language and upload screenshots and promo tiles.
- [ ] Privacy practices: fill in exactly as in `CHROME_WEB_STORE_PRIVACY_PRACTICES.md`. Only **Web history** is checked, plus all three certifications, and remote code is **No**.
- [ ] Privacy policy URL: confirm it loads without signing in (the GitHub `blob/main/PRIVACY.md` URL works after merge).
- [ ] Optional promo video: `../AI-window-deck-promo.mp4` shows the pre-1.7 UI, so re-record it or skip it.
- [ ] Distribution: Public or Unlisted. Submit for review.
- [ ] After approval: tag `v1.7.0` on `main` and create a GitHub Release with the ZIP (see `../docs/RELEASING.md`).

## Final pre-submit check

- [ ] Load the exact ZIP unpacked in a clean Chrome profile and try: register → drag to canvas → Launch → Alt+X / Alt+Z → Escape closes the dialog.
- [ ] Screenshots show the current UI and no personal data.
- [ ] Permission warnings on install match the listing: "Read your browsing history" (from `tabs`) and nothing broader.
