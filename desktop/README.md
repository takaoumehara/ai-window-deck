# AI Window Deck — desktop (prototype)

The extension tiles separate Chrome windows. This app puts the same registered
windows inside **one** window: each window is a pane with its own live web page,
and a click or a shortcut enlarges it or puts it back.

- **Grid**: every visible window in a grid. *Arrange panes* (the button in the top bar, the palette or *Deck → Arrange Panes…*) picks the shape: automatic, side by side, stacked, 2 or 3 per row, big on the left or big on top (`src/lib/arrangement.js`).
- **Spotlight**: the focused pane takes most of the window; the rest stay live on a side rail.
- **Fill**: the focused pane covers the deck; the others keep running in the background.
- **Resize**: drag the gap between two panes (also the split between the spotlight and the rail). The divider is focusable: arrow keys move it 2% (`⇧` 10%), Enter or a double-click makes the panes equal again.
- **Rearrange**: drag a pane's title bar onto another pane. Dropping in the middle swaps the two; dropping near an edge puts it before or after. *Move Pane Earlier / Later* in the palette and the Deck menu do the same from the keyboard. Shape, sizes and order are saved per set.
- Click a pane's title bar to spotlight it, and click it again to go back to the grid. Clicking a pane on the rail swaps it in.
- Panes have rounded corners and Chrome-style tabs: the active tab joins the page, the others are flat with separators, each shows the site icon and title, ✕ appears on hover, and **+** adds a tab.
- With many tabs, tabs shrink to a minimum width (icon and short title; hover for the full title and URL), then the strip scrolls sideways with the trackpad, the mouse wheel or the ‹ › arrows, with faded edges where more tabs are hidden. The active tab always scrolls into view. The **12 ⌄** button at the end lists every tab with a search box. **+** and the pane buttons never scroll away. Narrow panes show only the current tab plus the list button. `⌃Tab` / `⌃⇧Tab` move to the next / previous tab of the focused pane, also while the page has focus.
- Windows with several URLs get tabs in the pane's title bar. Drag a tab (or press `⇧←` / `⇧→` on a focused tab) to change the order; *Edit window* reorders the same list with drag handles, up/down buttons or `⌥↑` / `⌥↓`. Undo covers both.
- **Find a feature** (`⌘K`, `F1`, or the button in the top bar) lists every action in plain words with its shortcut. Type in any of the 9 languages, in English or with everyday words ("スマホ", "iPhone", "mobile" all find the mobile preview), and Enter runs it on the focused pane. *Help → Tips* (also shown once on first launch) walks through the basics, and has a language picker for all 9 languages that also changes Settings.
- **Ask AI** (in the palette and the Help menu) opens Claude or ChatGPT in a pane with a guide to the app and your question filled in. No API key ships with the app; the chat uses your own account in that pane.
- **Back / forward**: `⌘[` / `⌘]`, `⌘←` / `⌘→` outside text fields, the mouse's back/forward buttons and two-finger swipes act on the focused pane. The buttons in the title bar are enabled only when there is somewhere to go.
- **Sets** are named decks, each with its own windows, layout and focus. Switch them from the sidebar (or the collapsed rail), and manage them in *Deck → Sets…*.
- **New Deck Window** (`⌘N`) opens another window showing a set that isn't open yet, for example on a second display. A set is open in one window at a time; picking one that is open elsewhere brings that window forward. Open windows and their sets come back on relaunch.
- **Paste a List** takes URLs (one window per URL, named by host, or all of them as tabs of one window) or the extension's window list (a name line, URL lines, a blank line between windows). It shows what will be created first, and can put the result in a new set.
- **Paste a list into one window**: *Edit window → Paste list* takes any text (one URL per line, URLs inside sentences, comma or space separated, bare domains like `moime.app`), shows how many URLs it found and how many are already there, and appends them or replaces the list. Pasting several URLs into a single URL field splits them into rows. Both have an *Undo* button, and saving is one deck undo step.
- **Import from extension** (in Settings) reads the JSON backup from *Profiles & Backup* or the `.txt` window list. Windows on the backup's active layout start visible; the rest of the library comes in hidden.
- **Undo** reverts deck edits (adding, editing, hiding, deleting, reordering windows, closing tabs, set changes, pane sizes, shapes and rearranging) without a limit. Switching between Grid, Spotlight and Fill isn't recorded. Hiding, deleting and closing also put an *Undo* button in the title bar.
- **AI status**: panes showing an AI site (Claude and Claude Code, ChatGPT and Codex, Gemini, Perplexity, Cursor agents, v0, Grok, DeepSeek, Copilot, Le Chat, Lovable, Bolt, NotebookLM) get a badge in the title bar and on the sidebar card: *Working*, *Done*, *Needs you* (a permission or approval prompt) or *Error*, each with its own icon and word, not just a colour. The top bar sums them up ("1 needs you · 2 working"); clicking it, or `⌘J`, goes to the next pane that needs you, then errors, then finished ones. When an AI you aren't looking at finishes or needs you, a notification says so (click it to go there; sound is off unless you turn it on), and the Dock badge counts the panes that need you. *Done* clears once you look at the pane. A page the deck doesn't recognise shows nothing rather than a guess.
- **Send to several AIs** (the paper-plane button in the top bar, or the palette): one prompt, typed into the prompt box of each AI pane you tick. Send is pressed only if you tick *Also press Send*; otherwise the text is just typed in for you to check. *Then show the panes side by side* switches to Grid in one row. Panes it couldn't type into are named in the title bar.
- **Sleeping panes**: a page that has been out of sight (a background tab, a pane hidden by Fill, a minimized window) and untouched for 30 minutes is closed to save memory. Its tab keeps a moon mark; showing it again reopens the page at the same address and scroll position, under a snapshot until it has loaded. Pages never sleep while on screen, while an AI in them is working, waiting or has unseen news, while they play sound or video, with text you haven't sent, during a sign-in or with a sign-in popup open, or when the pane is set to *Keep Pane Awake* (palette or Deck menu; a cup mark on its card). Settings turns it off or changes the time (10, 30, 60 or 120 minutes). Sites that scroll inside their own panel (most chat apps) reopen at their usual position.
- **Settings** (gear, `⌘,`): language (日本語, English, 简体中文, 繁體中文, 한국어, Español, Français, Deutsch, Português), the layout new sets start in, AI status (on/off, notifications, sound, per site), sleeping panes, sign-in, paste and import, updates.
- The collapsed sidebar is a rail with each window's site icon, name and hosts. Clicking a hidden window shows and focuses it.
- Logins are kept in one persistent session shared by all panes, so one sign-in covers every pane and survives a restart. Google sign-in opens in a small window of its own on the same session; when it finishes, the page that asked continues and the other Google panes reload (see *How it works*). A redirect to `accounts.google.com` (Gmail, or Vercel's "Continue with Google") changes the page's browser identity only after that redirect callback returns; doing it inside the callback quit 0.3.0. The in-page Google account prompt is also off, and those buttons open a normal popup. *File → Sign in to → Google / GitHub / Vercel* (also in the palette and Settings) opens that sign-in in a window of its own and reloads the matching panes when it's done. Sign-in popups ("Continue with GitHub" and the like) open as small windows in front of the deck and report back to the page that opened them.
- **Passkeys don't work inside the app** (Electron has no passkey support: no Touch ID, iCloud Keychain or phone sign-in), so a page that asks for one waits forever. The deck now says so in the title bar. On GitHub, sign in with your password and pick *More options* → authenticator app, GitHub Mobile or SMS for the second step. Password manager extensions don't run in the app either; copy from the 1Password or Passwords app.
- **Mobile preview**: the phone button in a pane's title bar shows the page as a phone or tablet does, in a device frame. The bar under the title switches the model from a list grouped by maker (iPhone, iPad, Pixel, Galaxy, Xperia, AQUOS, OPPO, Xiaomi, Android tablets) with a search box (name, maker, year, `390x844`, "fold", "tablet", …) and the last five devices used at the top; Settings uses the same list. It also rotates the device, and adds another pane with the same page on the next device, so several devices sit side by side. Each window keeps its own device and orientation, also while the preview is off, and undo covers them. Settings only picks the first device for a window that has never been previewed; changing it never touches existing windows. `⌘⇧M` toggles the preview on the focused pane.

| Shortcut | Action |
| --- | --- |
| `⌘K` / `Ctrl+K`, `F1` | Find a feature (command palette) |
| `⌥X` / `Alt+X` | Spotlight the focused pane / back to grid |
| `⌥Z` / `Alt+Z` (also `⌥A`) | Back to grid |
| `⌥Q` / `Alt+Q` | Fill the deck / back to grid |
| `⌥1`–`⌥8` | Focus pane 1–8 (it becomes the large pane in Spotlight and Fill) |
| `⌥]` / `⌥[` | Next / previous pane |
| `⌥B` | Show / hide the sidebar |
| `⌘R` / `Ctrl+R` | Reload the focused pane |
| `⌘[` / `⌘]`, `⌘←` / `⌘→` (`Ctrl+[` / `Ctrl+]`, `Alt+←` / `Alt+→`) | Back / forward in the focused pane |
| `⌘⇧M` / `Ctrl+Shift+M` | Mobile preview on / off for the focused pane |
| `⌃Tab` / `⌃⇧Tab` | Next / previous tab in the focused pane |
| `⌘J` / `Ctrl+J` | Go to the next AI that needs you (then errors, then finished ones) |
| `⌥S` / `Alt+S` | Sets |
| `⌘⌥1`–`⌘⌥9` / `Ctrl+Shift+1`–`9` | Switch to set 1–9 |
| `⌘N` / `Ctrl+N` | New deck window |
| `⌘,` / `Ctrl+,` | Settings |
| `⌘Z` / `⌘⇧Z` (`Ctrl+Z` / `Ctrl+Y`, `Ctrl+Shift+Z`) | Undo / redo a deck change |

The shortcuts work while a web page has keyboard focus, and only while the app is the active window.
Undo and redo are the exception: they only act on the deck while the deck itself has focus outside a
text field, so pages and inputs keep their own undo. *Edit → Undo Deck Change* works from anywhere.

## Design

Styled with [cie-ds](https://cie-ds.vercel.app) ([DESIGN.md](https://cie-ds.vercel.app/DESIGN.md)), not the extension's blue panel:

- Two inks only: ink `#0b0b0b` ground and paper `#f3f2ee`, plus alpha of the same inks. The focused pane and card swap to paper.
- `src/styles/cie/` holds verbatim copies of the cie-ds CSS (tokens, base, scrollbar, motion, interactions). Re-copy them to update.
- `tailwind.config.js` replaces Tailwind's palette, shadows and radii with cie tokens, so `bg-zinc-900`, `shadow-lg` and similar classes don't exist.
- Inter (UI text), Outfit (display headings), DM Mono and Zen Kaku Gothic New (used for `:lang(ja)`) are bundled with `@fontsource`, all SIL OFL, so the app looks the same offline.
- Contrast is measured, not estimated: `node scripts/contrast.mjs` composites every pair from the live tokens and `--check` fails below WCAG AA (text 4.5:1, boundaries and focus 3:1). The cie token copies stay verbatim; the app's overrides (muted inks, `--deck-edge-alpha`, `--deck-placeholder-alpha`) live in `src/index.css`. See [docs/accessibility.md](docs/accessibility.md).
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
*Check for Updates…* (app menu) and Settings check on demand. macOS only
applies an update signed by the same Developer ID, so every release must be signed.

## How it works

- `electron/main.cjs` owns a `BrowserWindow` per deck window for the shell UI (React, `src/`)
  and one `WebContentsView` per open tab. Pane IPC is routed by the sending window, and menu
  commands go to the focused one. The renderer measures each pane's content box and
  sends the rectangles over IPC; during layout transitions it streams them every frame,
  so native page views follow the CSS animation.
- Native views draw above the DOM. Dialogs hide them while open, and messages appear in
  the title bar instead of floating over the deck.
- Pages see a current desktop Chrome on the user's OS (`electron/identity.cjs`): a reduced
  Chrome user agent built from Electron's Chromium version, client hints with the Google Chrome
  brand (also as `Sec-CH-UA` headers, which Electron doesn't send itself, including the ones an
  origin asks for with `Accept-CH`) and a clean `Accept-Language`. It is set through a DevTools
  `Emulation.setUserAgentOverride` per page and sign-in popup. Google's sign-in page
  (`accounts.google.com`) rejects any Electron that claims Chrome, so there the page sees the
  same user agent without the `Chrome/` token and no Chrome client hints.
- Mobile preview is Chrome DevTools' device mode on a pane's page: the device's viewport, pixel
  ratio, orientation, touch, user agent and client hints, scaled down to the screen of a frame
  drawn by the shell (`src/components/DeviceStage.jsx`). It is still Chromium, so it shows the
  layout sites serve to that device, not Safari's or a real device's rendering. Devices come
  from `electron/devices.json`, and the app also fetches `site/devices.json` from the website
  (twice a day, cached) so new models arrive without an app update; the newer list wins.
  Both files are generated by `python3 scripts/build-devices.py` (edit the tables there, never
  the JSON). Sizes are CSS viewport pixels in portrait and the device pixel ratio; models whose
  viewport isn't confirmed yet (announced or regional models) carry `approx: true` and show as
  "estimate". `test/devices.test.js` checks the catalog and that both copies match.
- Shortcuts are matched in `before-input-event` on every web contents (`electron/commands.cjs`),
  by key code, so macOS Option characters (`⌥X` = `≈`) don't get in the way. `electron/commands.json`
  lists every command once (group, accelerator, label and synonym string keys); the app menu's
  accelerators and the palette (`src/lib/palette.js`) both read it, so they can't drift apart.
- Google sign-in: a click that leads a pane to `accounts.google.com` opens a dedicated
  `BrowserWindow` on the same `persist:deck` partition, so the cookies it sets are the panes'
  cookies. The window is not a child of the deck window, and it is created after the
  navigation event returns. The DevTools user-agent override is also applied on the next
  turn, not inside `did-redirect-navigation`: the 0.3.0 crash (Electron 38.8.6,
  `WebContentsImpl::DidRedirectNavigation`) was that override running while Chromium was
  still handling the redirect to `accounts.google.com`.
  FedCM (`FedCm`, `FedCmButtonMode`) is disabled before startup (`electron/crash-guards.cjs`),
  so a "Continue with Google" button falls back to that popup instead of a dialog Electron
  cannot show. When Google leaves its sign-in flow, the window closes and the pane loads where Google
  was heading. If Google answers "This browser may not be secure", the window retries once with a
  Firefox identity and remembers what worked. A watcher on the `SID` cookie reloads other Google
  panes after sign-in or sign-out. Signing in in Safari or Chrome can't help: their cookies live in
  another browser's store, which the app can't read.
- Popups (`electron/popups.cjs`): a `window.open` with size features, a blank `window.open()`,
  or one that goes to a sign-in or OAuth page (GitHub, Vercel, Google, Apple, Microsoft, Auth0,
  Okta, Clerk, any `/oauth/authorize`…) opens a real window on the same session, so
  `window.opener` and `postMessage` work and the popup can close itself. It is not a child of
  the deck window. Other `target=_blank` links load in the pane. When a popup has been through
  a sign-in page and reached the opener's site, closing it reloads the opener if the opener
  didn't move by itself.
- *File → Sign in to → GitHub / Vercel* opens the provider's login in its own window. Google's
  pages inside it go to the Google window and come back. The window closes once it reaches the
  provider's own pages signed in (GitHub: the `logged_in` cookie), then pages on that site reload,
  and a pane that was waiting on its login page (another app's "Continue with GitHub") carries on.
- Passkeys: Electron 38 has no WebAuthn prompt and no platform authenticator (Touch ID, iCloud
  Keychain, phone), so `navigator.credentials.get()` just stays pending. The pane preload notices a
  passkey request (autofill requests excepted, and never on Google's sign-in pages) and the deck
  says to pick another method. The request itself is left alone, since a USB security key may answer.
- AI status (`electron/ai-status.cjs`, site rules in `electron/ai-sites.json`): for a recognised
  site the main process injects a small monitor into the pane preload's isolated world, where the
  page's own scripts can't reach it. It reads the page (a visible Stop button, a permission prompt,
  an error alert, the title, and for agent pages sustained DOM activity), waits for the reading to
  settle, and reports Working / Needs you / Error / idle; the main process turns that into the
  pane's status (Done = it was working at least 1.5 s and stopped while you weren't looking).
  Unknown pages and unclear readings give no status. Adding a site is a JSON entry; HTML fixtures
  in `test/fixtures/ai/` check the rules. Send to several AIs uses the same rules to find the
  prompt box and types with `insertText` (or the native value setter plus an input event), so
  React and ProseMirror editors see it.
- Pane sleep (`electron/pane-sleep.cjs`): every 30 s the main process looks at pages that aren't on
  screen. One idle past the limit is asked (in the isolated world) whether it plays media or holds
  unsent text; if not, the deck keeps its URL, scroll position and a snapshot, and closes it. The tab
  reopens it when shown. The same rules decide everything, and `test/pane-sleep.test.js` covers them.
- Data is saved to `deck.json` in the app's user-data folder. The main process owns it
  (`electron/store.cjs`, which also migrates older files): windows send patches of the sets
  they changed, and the others get the result. Undo history (`src/lib/history.js`) lives in
  each window and holds per-set before/after pairs.

## Known limits of the prototype

- Sites with bot checks (Cloudflare and others) may challenge the panes the same way they challenge any new browser.
- No passkeys (Touch ID, iCloud Keychain, phone) and no password manager extensions; see *How it works*.
- AI status reads each site's page, so a site redesign can hide a state until its rules are updated (it then shows no badge, never a wrong one). Notifications need macOS permission for the app.
- Panes share one login session; separate sessions per pane (for example, two accounts on the same service) are not built yet.
- No Windows build in CI yet; `npm run dist:win` works locally but is unsigned.
