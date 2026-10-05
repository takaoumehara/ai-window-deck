# Chrome Web Store: Privacy practices submission copy (v1.7.0)

The source of truth for the **Privacy practices** tab. It was checked against `manifest.json`, `background.js` and `src/` on 2026-10-04. Update it whenever permissions or data handling change.


### Single purpose description

```text
AI Window Deck helps users save sets of Chrome windows, lay them out, open them tiled across one or more displays, and enlarge or restore a window with keyboard shortcuts. It also groups the tabs it opens.
```

### Permission justifications

**tabs**

```text
Used to open the URLs the user saved as tabs in new windows, and to read the title and URL of the active tab in each open window so the extension can list the user's windows, arrange them, and focus or close the one the user picks. This data is used only on the device for these features and is never sent to the developer or third parties.
```

**tabGroups**

```text
Used only when the extension opens a saved window set: the tabs opened in each new window are put in a tab group named after that window, so each workspace window is easy to identify. Tab-group data is not stored or transmitted.
```

**storage**

```text
Used to save the user's window library (names and URLs they enter), canvas layouts, spotlight/display/language preferences, and the position of the extension's own settings windows in chrome.storage.sync; temporary undo state uses chrome.storage.session. Chrome may sync this between the user's own browsers if Chrome Sync is on. Nothing is sent to the developer or third parties.
```

**system.display**

```text
Used to read the connected displays' sizes and work areas so the user can choose which monitor(s) to use and the extension can calculate where to place and how large to make each window. Display geometry is used locally only.
```

(There is **no** `windows` permission any more: chrome.windows needs none. No host permissions and no content scripts are requested, so no host-permission justification is needed.)

### Are you using remote code?

Select **No, I am not using remote code**.

```text
All JavaScript (background.js, identify.js and the built React panel in dist/assets/) is included in the uploaded package. The extension makes no network requests, loads no external scripts, fonts or stylesheets, and does not use eval or new Function.
```

### Data usage: what user data do you plan to collect?

Answers checked against `background.js` and `src/`. No data leaves the device except Chrome's own sync of `chrome.storage.sync`.

| Category | Check? | Why |
| --- | --- | --- |
| Personally identifiable information | ☐ No | No names, emails, addresses or IDs are collected. |
| Health information | ☐ No | Not handled. |
| Financial and payment information | ☐ No | Not handled. |
| Authentication information | ☐ No | No passwords, cookies or tokens are read. |
| Personal communications | ☐ No | Page content is never read, so chats, emails and messages are never accessed. |
| Location | ☐ No | `system.display` gives monitor geometry, not geographic location. |
| Web history | ☑ **Yes** | The extension reads the title and URL of the active tab in each open window, to list and arrange windows. It also stores the URLs the user saves in their window library. This is used only locally for the single purpose. It is not logged as history and not transmitted. |
| User activity | ☐ No | There is no click, mouse, scroll or keystroke monitoring. Keyboard shortcuts go through `chrome.commands` and are not logged. |
| Website content | ☐ No | There are no content scripts and no host permissions, so page text, images and media are never read. |

### Certifications (check all three)

- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases.
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes.

### Privacy policy URL

Primary (works once this branch is merged to `main`):

```text
https://github.com/takaoumehara/ai-window-deck/blob/main/PRIVACY.md
```

Alternative: enable GitHub Pages for the repository and publish `store-assets/privacy-policy.html`. That is the same text, generated from `PRIVACY.md`. The URL would be:

```text
https://takaoumehara.github.io/ai-window-deck/privacy-policy.html
```

The Pages URL needs Pages configured to serve that file, for example from a `docs/` folder or a `gh-pages` branch containing `privacy-policy.html`. Paste only a URL that loads without signing in. The full text is also in `privacy-policy.md` next to this file.
