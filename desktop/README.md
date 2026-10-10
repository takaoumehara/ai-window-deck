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

For a Mac build that opens without a Gatekeeper warning, the app must be signed
with a Developer ID certificate and notarized (Apple Developer Program). Give
electron-builder `CSC_LINK`/`CSC_KEY_PASSWORD` and `APPLE_ID`/`APPLE_APP_SPECIFIC_PASSWORD`/`APPLE_TEAM_ID`.
Unsigned builds still run, but macOS blocks them on first launch. Since macOS 15 the right-click → Open bypass is gone: users have to try opening the app, then choose **Open Anyway** in System Settings → Privacy & Security.

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
- No app icon, auto-update, or signing configuration yet.
