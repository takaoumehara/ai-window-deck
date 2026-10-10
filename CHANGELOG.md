# Changelog

All notable changes to AI Window Deck are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project uses [Semantic Versioning](https://semver.org/).

Versions before 1.7.0 were not tagged in git. Their entries are reconstructed
from the release archives that used to be committed to the repository root;
their dates are approximate (taken from file timestamps inside those archives).

## [Unreleased]

## [1.11.2] - 2026-10-09

Built from the 1.11.0 store package with `tools/patch-v1.11.2-inline-register.mjs`, which applies the 1.11.1 patch first.

### Repository
- The repository root is now the 1.11.2 package itself: load it unpacked or zip it with `npm run package`, with no install or build. The 1.7 source (`src/`, Vite, `deck.html` and their tests) moved to `legacy/v1.7/`.
- Vercel serves `site/` as a static site (root `vercel.json`), instead of building the repository with Vite.

### Changed
- The register button is now **Register URLs + Window**, and it opens inside the page instead of a modal dialog. The view you came from stays in place and keyboard focus returns to the button when the panel closes. The small dock window keeps the dialog.
- A new window starts at a choice between *One by one* and *Bulk (paste text)*. The bulk card shows a short animation of copying a list of sites from a chat and pasting it; with reduced motion it shows a still version. `Escape` in a form goes back to the choice first.
- After a bulk save, the choice to place the new windows on the canvas automatically or keep them in the library is shown in the page too.

### Added
- A Ko-fi link (https://ko-fi.com/G2G71VP1DF) at the end of the More view, in all eight languages.

## [1.11.1] - 2026-10-09

Built from the 1.11.0 store package with `tools/patch-v1.11-bulk-import.mjs`.

### Added
- Bulk import highlights the lines that need attention in red and lists each issue with a *Line N* link that jumps to it. **Fix** adds a missing blank line before a window name, and *Fix all fixable* fixes every such line at once.
- Addresses without a scheme are completed: `https://` for ordinary hosts, `http://` for `localhost`, IP addresses and `.test` hosts.
- Local files: absolute paths (including paths with spaces), `C:\` paths and `file:///` URLs are saved as `file://` URLs. A path that starts with `~` is reported, since Chrome cannot expand it. The hint about *Allow access to file URLs* also appears in bulk mode.
- Several URLs separated by spaces on one line each become a tab, when all of them have a scheme or none does and none is a local path.

### Fixed
- A line such as `Memo:` or `Research: AI tools` is read as a window name instead of an invalid URL.
- A block without a name is saved as *Window N* instead of being rejected.
- Clearer wording for a window name that follows URLs without a blank line, and issue counts that read correctly for one issue.

## [1.7.0] - 2026-10-04

The first release of the React panel. It replaces the earlier `deck.html` panel as the toolbar popup and the options page.

### Added
- React + Tailwind settings panel with a layout canvas: drag saved windows onto a 12 × 12 grid and resize from any edge. Layouts include Auto, Vertical, Horizontal, Grid, Focus and Freeform. The canvas has undo/redo and multiple layout presets.
- Spotlight settings: enlarge size (half, tall, three quarters, full height, full screen, custom) and where the window grows from. A preview shows the result.
- Window library with bulk text entry and `.txt` import/export, and JSON backup/restore.
- Floating controller and large-window modes for the panel.
- Panel translations for all eight locales: de, es, fr, ko, pt-BR, zh-CN, alongside en and ja.
- Keyboard command names in `chrome://extensions/shortcuts` are now localized.
- Window cards in the sidebar can be edited with `Enter` and deleted with `Delete`.
- `tools/validate-package.mjs` checks the store archive before upload.
- `PRIVACY.md`, `LICENSE` (MIT), `CONTRIBUTING.md`, `docs/RELEASING.md` and translated READMEs.

### Changed
- The panel follows the browser UI language until the user picks a language. It used to always start in Japanese.
- The options page uses the full tab width instead of the 780 px popup width.
- Shortcut key caps show the shortcuts actually assigned in Chrome, as `Alt+X` on Windows/Linux and `⌥X` on macOS.
- Secondary text raised from zinc-500 to zinc-400 to meet WCAG AA contrast (4.12:1 → 7.76:1 on the panel background).
- `tools/package.sh` packages the built panel (`dist/`) and only runtime files. It works without `zip(1)` and validates the archive.
- `dist/` contains only the built panel. The build no longer copies the manifest, service worker, icons or locales into it.

### Fixed
- Opening the panel no longer overwrites saved layout presets with the sample layout before settings finish loading.
- The canvas now shows the saved slots of the active layout when the panel opens.
- The first-run guide no longer reopens for users who have already finished it.
- The *Toggle Fullscreen* button did nothing because it sent an action the service worker does not handle.
- Dialogs now close with `Escape`, keep focus inside while open, return focus to the opener, and are announced as dialogs.
- Icon-only buttons (edit, delete, close, remove URL) now have accessible names. Form fields have labels.
- Failed window actions now show a message instead of failing silently. This covers a window that was already closed, and the case where there is nothing to undo.
- Hard-coded Japanese and English strings (skip link, error screen, import error, ARIA labels, placeholders) moved into translations.
- Japanese: *Undo* and *Redo* were both labelled やり直す.

### Removed
- The invalid `windows` permission. `chrome.windows` needs no permission.
- Release ZIPs are no longer committed to the repository. They are attached to GitHub Releases instead.

## [1.6.2] - 2026-08-02

### Removed
- The `scripting` permission and the website activity content script (`attention.js`). The extension no longer asks for access to websites.

## [1.6.1] - 2026-08-02

### Changed
- Layout selection and window placement share one layout model (`layout-model.js`), so the chosen layout and the opened windows stay in sync.

## [1.6.0] - 2026-08-01

### Added
- Chrome Web Store listing materials: store copy, screenshots and promo tiles, with localized product details for all eight locales.

## [1.5.0] - 2026-08-01

### Added
- Reorder windows in the window list by dragging, or with *Move to next* / *Move to previous*.

## [1.4.0] - 2026-08-01

### Added
- First packaged release: open and tile saved sets of Chrome windows, spotlight the active window, and use keyboard shortcuts to re-tile, undo, go to the next or previous window, focus windows 1–8 and toggle full screen.
- Tab groups for the windows the deck opens, multi-display support, a compact window list, and the display identification flash.
- UI in English, Japanese, German, Spanish, French, Korean, Brazilian Portuguese and Simplified Chinese.

[Unreleased]: https://github.com/takaoumehara/ai-window-deck/compare/v1.11.2...HEAD
[1.11.2]: https://github.com/takaoumehara/ai-window-deck/releases/tag/v1.11.2
[1.11.1]: https://github.com/takaoumehara/ai-window-deck/releases/tag/v1.11.1
[1.7.0]: https://github.com/takaoumehara/ai-window-deck/releases/tag/v1.7.0
