**English** | [日本語](README.ja.md) | [Deutsch](README.de.md) | [Español](README.es.md) | [Français](README.fr.md) | [한국어](README.ko.md) | [Português (BR)](README.pt_BR.md) | [简体中文](README.zh_CN.md)

# AI Window Deck

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/G2G71VP1DF)

**More cloud sessions. Room to think.**

Window manager for Claude Code in the cloud and Codex — run multiple projects at once without getting confused.

A Chrome extension for people who work with several AI tools and references side by side. Save the windows you use together, lay them out on a canvas, open them all at once as tiled Chrome windows, and spotlight one of them with a single shortcut.

Your Chrome profile, sign-ins, password manager and other extensions stay as they are. AI Window Deck only arranges ordinary Chrome windows.

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/focus-preview-en-dark.gif">
    <img src="docs/images/focus-preview-en-light.gif" width="720" alt="Five tiled windows. Alt+X enlarges one; pressing it again puts it back in its tile.">
  </picture>
</p>

Website: <https://ai-window-deck.vercel.app/>

## How it works

| **① Register URLs** | **② Layout** |
| --- | --- |
| <img src="site/assets/img/01-step1-urls.png" alt="① Register URLs" width="400"> | <img src="site/assets/img/02-step2-layout.png" alt="② Layout" width="400"> |
| Save a name and URLs for each window, or paste a list of sites to create several at once. Each URL opens as a tab. | Place windows on the canvas and resize their grid slots. |
| **③ Focus view** | **④ Launch** |
| <img src="site/assets/img/03-step3-focus.png" alt="③ Focus view" width="400"> | <img src="site/assets/img/04-step4-launch.png" alt="④ Launch" width="400"> |
| Choose an enlargement size and origin: grow in place or center. | Choose your displays and open the saved layout as Chrome windows. |

### Register URLs + Window (new in 1.11.2)

*Register URLs + Window* opens right in the page. Add windows one by one, or paste a message that lists your sites: each block separated by a blank line becomes a window. Lines that need attention turn red, and **Fix** adds the missing blank line.

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/register-paste-en-dark.gif">
    <img src="docs/images/register-paste-en-light.gif" width="480" alt="The bulk card: a chat message listing sites is copied, pasted, and saved as three windows.">
  </picture>
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="site/assets/img/register-bulk-en-dark.png">
    <img src="site/assets/img/register-bulk-en-light.png" width="720" alt="Bulk import with two lines marked in red and a Fix button for each issue.">
  </picture>
</p>

## Features

- **Register URLs + Window.** Each saved window has a name and one or more URLs, which open as tabs. Add windows one by one, or paste a list of sites: each block separated by a blank line becomes a window. Lines that need attention turn red, with a link to the line and a **Fix** button. You can also import and export a `.txt` file.
- **Addresses and local files.** `github.com` is saved as `https://github.com`; `localhost` and local addresses get `http://`. Local paths such as `/Users/me/My Site/index.html` or `C:\docs\notes.html` open as `file://` tabs once *Allow access to file URLs* is on for the extension. Several URLs on one line each become a tab.
- **Layout canvas.** Drag windows onto a 12 × 12 canvas and resize them from any edge. Layouts include Auto, Vertical, Horizontal, Grid, Focus (one large window) and Freeform. The canvas has undo and redo, and you can keep several layout presets (A, B, …).
- **Launch and re-tile.** One click opens every window in the layout and tiles it on the display(s) you chose, with its tabs grouped. *Retile* moves windows you already launched back into place.
- **Spotlight.** `Alt+X` enlarges the active window: half, tall, three quarters, full height, full screen or a custom size. You choose whether it grows from where it is or from the screen centre. Press `Alt+X` again, or `Alt+Z`, to put it back in its tile.
- **Move between windows.** Go to the previous or next window, focus window 1–8, undo the last arrangement, and toggle full screen.
- **Multiple displays.** Choose which monitor or monitors the deck opens on.
- **Floating controller and large window.** Keep a compact controller open, or open the settings in a window of their own.
- **Backup.** Back up or restore all windows, layouts and settings as a JSON file.
- **8 languages.** English, 日本語, Deutsch, Español, Français, 한국어, Português (Brasil) and 简体中文. The panel follows the browser language until you pick one.

<p align="center"><img src="site/assets/img/05-focus-enlarge.png" width="720" alt="Focus enlargement compared: grow in place on the left, center on the right"></p>
<p align="center"><em>Grow in place / Center — choose the origin in step ③.</em></p>

## Install

### Chrome Web Store

Install from the [Chrome Web Store](https://chromewebstore.google.com/detail/ai-window-deck/hnadegmlbljffcogkclppfdcaiijjcgc).

### From a release ZIP

1. Download `ai-window-deck-vX.Y.Z.zip` from [Releases](https://github.com/takaoumehara/ai-window-deck/releases) and unzip it.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and select the unzipped folder.

### From source

```sh
git clone https://github.com/takaoumehara/ai-window-deck.git
```

The repository root is the 1.11.2 extension package itself, so there is nothing to install or build. Load the cloned folder (the one that contains `manifest.json`) with **Load unpacked**.

## Usage

1. Click the toolbar icon. On first run, a short guide marks the three steps.
2. **Choose a display** under *Select Target Display(s)*.
3. **Register windows** with **Register URLs + Window**: choose *One by one* (a name, plus one or more URLs) or *Bulk (paste text)*.
4. **Drag windows onto the canvas.** Set how many windows you want, pick a layout, and resize tiles from their edges.
5. Click **Launch**. Each window opens in its own Chrome window, tiled to match the canvas.
6. Use the spotlight and navigation shortcuts while you work.

Tips:

- In the sidebar, double-click a window card or press `Enter` on it to edit it. `Delete` removes it.
- `Escape` closes the register panel (from a form, it first goes back to the choice), and keyboard focus returns to the button that opened it.
- *Open in Large Window* opens the same panel at a roomier size than the toolbar popup.

### Keyboard shortcuts

| Command | Default |
| --- | --- |
| Spotlight: enlarge the active window / back to its tile | `Alt+X` |
| Put the window back in the tile it started from | `Alt+Z` |
| Arrange (re-tile) the deck windows | `Alt+A` |
| Full screen / back | `Alt+Q` |
| Undo the last arrangement | not set |
| Next window / previous window | not set |
| Focus window 1–8 | not set |

Chrome lets an extension suggest only four default shortcuts. You can assign or change any of them at `chrome://extensions/shortcuts`; the panel's *Change shortcuts* link opens that page. On macOS, Chrome shows `Alt` as `⌥`.

## Permissions and privacy

| Permission | Why it is needed |
| --- | --- |
| `tabs` | Open saved URLs as tabs, and read the titles and URLs of open windows to list them and arrange them. |
| `tabGroups` | Name and colour the tab group of each window the deck opens. |
| `storage` | Save your windows, layouts and preferences. |
| `system.display` | Read display sizes and positions so windows are tiled on the right monitor. |

AI Window Deck has no host permissions or content scripts, and does not read page content. It makes no network requests and loads no remote code. There are no analytics and no accounts. Settings are stored with `chrome.storage.sync`, so Chrome can sync them between your own devices if you have Chrome Sync on. Temporary undo state is kept in `chrome.storage.session`. Nothing is sent to the developer or to third parties.

The full policy is in [PRIVACY.md](PRIVACY.md).

## Development

Requires Node.js 20+ (and Python 3 with Pillow for the store graphics).

```sh
npm test              # node --test
npm run package       # zip + validate ai-window-deck-v<version>.zip
```

The source of 1.11.x is not in this repository. The root holds the 1.11.2 package exactly as shipped. Its `dist/` bundle is rebuilt from the published 1.11.0 store package by exact, tested string patches. With the 1.11.0 package unpacked, the tests also check that the patch reproduces the root byte for byte:

```sh
npm run patch -- <unpacked-1.11.0> <out>    # tools/patch-v1.11.2-inline-register.mjs
AWD_V1110_DIR=<unpacked-1.11.0> npm test
```

Repository layout:

| Path | Contents |
| --- | --- |
| `manifest.json`, `background.js`, `identify.*`, `icons/`, `_locales/`, `dist/` | The 1.11.2 extension package, exactly as uploaded to the Chrome Web Store |
| `tools/` | Patch scripts (`patch-v1.11*.mjs`, with their strings and code in `v1.11.1/`, `v1.11.2/`), packaging, package validation, Chrome Web Store upload |
| `site/` | The website, deployed by Vercel (see `vercel.json`) |
| `store-assets/` | Chrome Web Store listing text, screenshots, promo tiles and capture scripts |
| `test/` | Unit tests |
| `legacy/v1.7/` | The pre-1.11 source (the 1.7 React panel and older pages), kept for reference. See its README |

## Release process

1. Bump `version` in `package.json` and in the patch script's manifest step, and update `CHANGELOG.md`.
2. Run `npm test` and `npm run package`. The validator checks referenced files, `__MSG_` keys in every locale, and description length.
3. Upload the ZIP to the Chrome Web Store dashboard.
4. After the store approves the version, tag `vX.Y.Z` on `main` and attach the ZIP to a GitHub Release.

See [docs/RELEASING.md](docs/RELEASING.md) for details.

## Support

Report bugs and suggestions on [GitHub Issues](https://github.com/takaoumehara/ai-window-deck/issues).

If AI Window Deck helps your day, you can support its development on [Ko-fi](https://ko-fi.com/G2G71VP1DF).

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/G2G71VP1DF)

## License

[MIT](LICENSE) © 2026 Takao Umehara
