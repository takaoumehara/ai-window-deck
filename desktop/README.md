# AI Window Deck — desktop (prototype)

The extension tiles separate Chrome windows. This app puts the same registered
windows inside **one** window: each window is a pane with its own live web page,
and a click or a shortcut enlarges it or puts it back.

- **Grid**: every visible window in a grid, using the extension's layout math (`src/lib/layout-model.js`).
- **Spotlight**: the focused pane takes most of the window; the rest stay live on a side rail.
- **Fill**: the focused pane covers the deck; the others keep running in the background.
- Click a pane's title bar to spotlight it, and click it again to go back to the grid. Clicking a pane on the rail swaps it in.
- Windows with several URLs get tabs in the pane's title bar.
- **Import from extension** reads the JSON backup from *Profiles & Backup* or the `.txt` window list. Windows on the backup's active layout start visible; the rest of the library comes in hidden.
- Logins are kept in one persistent session shared by all panes.

| Shortcut | Action |
| --- | --- |
| `⌥X` / `Alt+X` | Spotlight the focused pane / back to grid |
| `⌥Z` / `Alt+Z` (also `⌥A`) | Back to grid |
| `⌥Q` / `Alt+Q` | Fill the deck / back to grid |
| `⌥1`–`⌥8` | Focus pane 1–8 (it becomes the large pane in Spotlight and Fill) |
| `⌥]` / `⌥[` | Next / previous pane |
| `⌥B` | Show / hide the sidebar |
| `⌘R` / `Ctrl+R` | Reload the focused pane |

The shortcuts work while a web page has keyboard focus, and only while the app is the active window.

## Design

Styled with [cie-ds](https://cie-ds.vercel.app) ([DESIGN.md](https://cie-ds.vercel.app/DESIGN.md)), not the extension's blue panel:

- Two inks only: ink `#0b0b0b` ground and paper `#f3f2ee`, plus alpha of the same inks. The focused pane and card swap to paper.
- `src/styles/cie/` holds verbatim copies of the cie-ds CSS (tokens, base, scrollbar, motion, interactions). Re-copy them to update.
- `tailwind.config.js` replaces Tailwind's palette, shadows and radii with cie tokens, so `bg-zinc-900`, `shadow-lg` and similar classes don't exist.
- Outfit, DM Mono and Zen Kaku Gothic New (used for `:lang(ja)`) are bundled with `@fontsource`, so the app looks the same offline.
- Motion uses `--cie-t-move` / `--cie-ease-expo` for pane layout changes and cie-ds sheets for dialogs. Everything stops under `prefers-reduced-motion`.

## Run

```sh
cd desktop
npm install
npm start              # build the shell UI and open the app
npm run dev            # Vite + Electron with hot reload for the shell UI
npm test
```

## Package

```sh
npm run dist:mac       # .dmg in desktop/release (run on a Mac)
npm run dist:win       # Windows installer
```

The `.dmg` is universal (Apple silicon and Intel).

### Signed and notarized builds (GitHub Actions)

`.github/workflows/desktop-mac.yml` builds on a macOS runner. Pull requests get an
unsigned `.dmg` as a workflow artifact. Manual runs (*Actions → Desktop app (macOS) →
Run workflow*) and `desktop-v*` tags sign and notarize, and a tag also attaches the
`.dmg` to a GitHub Release. Signing needs these repository secrets
(*Settings → Secrets and variables → Actions*):

| Secret | Where it comes from |
| --- | --- |
| `MAC_CERT_P12_BASE64` | A **Developer ID Application** certificate. Create it in Xcode (*Settings → Accounts → Manage Certificates → +*) or at developer.apple.com, export it from Keychain Access as `.p12`, then `base64 -i cert.p12 \| pbcopy`. |
| `MAC_CERT_PASSWORD` | The password set when exporting the `.p12`. |
| `APPLE_ID` | The Apple Account email of the developer team. |
| `APPLE_APP_SPECIFIC_PASSWORD` | Made at account.apple.com → *Sign-In and Security → App-Specific Passwords*. |
| `APPLE_TEAM_ID` | The 10-character Team ID at developer.apple.com/account → *Membership details*. |

Locally on a Mac, the same values go in `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`,
`APPLE_APP_SPECIFIC_PASSWORD` and `APPLE_TEAM_ID` before `npm run dist:mac`.

Unsigned builds still run, but macOS blocks them on first launch. Since macOS 15 the right-click → Open bypass is gone: users have to try opening the app, then choose **Open Anyway** in System Settings → Privacy & Security.

### Releasing a version

1. Set `version` in `desktop/package.json` (for example `0.3.0`) and merge it.
2. Tag that commit `desktop-v0.3.0` and push the tag. The workflow refuses a tag that
   doesn't match `package.json`.
3. The workflow publishes two releases, neither marked as the repository's latest (that
   stays the Chrome extension):
   - `desktop-v0.3.0`, the permanent record. Versions below 1.0 and versions with a
     `-` (such as `1.0.0-rc.1`) are marked pre-release.
   - `desktop-latest`, rebuilt on every tag. Its `latest-mac.yml` is the in-app update
     feed (`build.publish`), and its `AI-Window-Deck-mac.dmg` is the website's download
     link. Never delete it by hand.

### Updates

Packaged builds use `electron-updater` (`electron/updates.cjs`). They check
`desktop-latest` at launch and every six hours, download in the background, and show
*Restart to update* in the title bar. An update that isn't applied installs on quit.
*Check for Updates…* (app menu) and the shortcuts sheet check on demand. macOS only
applies an update signed by the same Developer ID, so every release must be signed.

## How it works

- `electron/main.cjs` owns one `BrowserWindow` for the shell UI (React, `src/`) and one
  `WebContentsView` per open tab. The renderer measures each pane's content box and
  sends the rectangles over IPC; during layout transitions it streams them every frame,
  so native page views follow the CSS animation.
- Native views draw above the DOM. Dialogs hide them while open, and messages appear in
  the title bar instead of floating over the deck.
- Shortcuts are matched in `before-input-event` on every web contents (`electron/commands.cjs`),
  by key code, so macOS Option characters (`⌥X` = `≈`) don't get in the way.
- Data is saved to `deck.json` in the app's user-data folder.

## Known limits of the prototype

- Sites with bot checks (Cloudflare and others) may challenge the panes the same way they challenge any new browser.
- Panes share one login session; separate sessions per pane (for example, two accounts on the same service) are not built yet.
- No Windows build in CI yet; `npm run dist:win` works locally but is unsigned.
