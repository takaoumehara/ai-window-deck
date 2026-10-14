# Accessibility — AI Window Deck for Mac (desktop app)

> Last updated: 2026-10-14 · Version 0.2.5  
> Target: WCAG 2.2 AA · Platform: Electron 38 desktop app (Chromium renderer), macOS first, Windows/Linux builds share the code  
> Surfaces: top bar, sidebar (expanded and rail), panes (title bar, tabs, address/find field, mobile preview stage), sheets (Settings, Shortcuts, Sets, Edit window, Paste a list, Find a feature palette, Tips), Google sign-in window  
> Out of scope: the third-party web pages shown inside panes (ChatGPT, Claude, Gmail…). Their accessibility belongs to those sites.

## Verdict

**Not claimed conformant.** This pass measured every colour pair the app draws, fixed all failures, and walked the main flows with the keyboard on a Linux VM build of the same renderer. That evidence supports *no known AA failures in the app's own UI apart from the minor findings below*, but it is not a conformance claim. No screen-reader session ran: VoiceOver needs a real Mac, and the VM has no Orca. 200 % zoom of the shell and macOS "Increase contrast" / "Reduce motion" were also not exercised.

## Remediation in this change

| Finding (before) | Criterion | Who was blocked or hindered | Fix |
| --- | --- | --- | --- |
| Sheets never moved focus inside on open. The panel is `visibility: hidden` until its open class lands a frame later, and `focus()` on a hidden element does nothing, so Edit window, Settings and others opened with focus still on the page behind. | 2.4.3, 2.1.1 | Keyboard and screen-reader users: typing went nowhere and Tab started from the page, behind the modal. | `Sheet` moves focus to the first field once the panel is visible (`ui/Sheet.jsx`). Esc closes, Tab is trapped, focus returns to the opener (verified on the VM). |
| ⌘K / ⌥S etc. pressed while a web page had focus opened a sheet the keyboard couldn't reach. | 2.1.1 | Keyboard users starting from a page. | Commands that open a sheet take the keyboard back to the shell first. |
| Field and choice borders measured 1.77:1 and 1.56:1 on paper; pill borders 2.04:1 on ink; key caps in sheets 2.01:1. | 1.4.11 | Low-vision users finding where to click or type. | One `--deck-edge-alpha` (0.5) for boundaries: 3.60:1 on paper, 4.88:1 on ink. |
| Address/find placeholders measured 2.66:1 and 3.50:1; hidden-window cards were dimmed to 3.22:1 with opacity. | 1.4.3 | Low-vision users reading hints and hidden windows' names. | `--deck-placeholder-alpha` (0.65): 5.99:1 and 7.63:1. Hidden cards dim only the favicon. Text is 9.04:1. |
| Muted text passed at 5–7:1, but at 9–11 px in light weights it read as faint (owner feedback). | 1.4.3 (exceeded on purpose), 1.4.12 | Low-vision users and anyone on a non-Retina display. | Muted inks raised to 9.04:1 (`#b0b0ab` on ink) and 7.36:1 (`#4f4f49` on paper). Mono labels 12 px / 500, key caps 11 px / 500, no text under 400 weight. UI text in Inter (OFL, bundled), with Zen Kaku Gothic New for Japanese at 500. |
| Text fields had only a hairline darkening on focus. | 2.4.7, 1.4.11 | Keyboard users. | 2 px `currentColor` outline with 2 px offset (`.deck-focus-ring`, `.deck-focus-within`), 17.57:1. |
| Hovering an icon inside a button showed the pane title bar's tooltip ("このペインを拡大") instead of the button's. Chromium skips the button's `title` over SVG. | 3.3.2 (helpfulness), 2.5.3 | Mouse users learning the controls, e.g. the mobile preview button. | `button svg { pointer-events: none }`. The mobile button reads "モバイル表示（スマホ・タブレットで確認） (⌘⇧M)". |
| URL order could only change by deleting and retyping. Tab order was fixed. | 2.1.1, 2.5.7 | Keyboard, switch and motor-impaired users. | Edit window: drag handle **plus** "Move URL n up/down" buttons and ⌥↑/↓ in the field. Focus follows the row, and a polite live region says "Moved to 2 of 2". Tabs: drag, ⇧←/→ on a focused tab, and palette commands. All are undoable with ⌘Z. |
| Edit window's remove buttons all read "URL を削除" with no row number. | 2.4.6, 4.1.2 | Screen-reader users couldn't tell which row a remove button acts on. | "URL 1 を削除", "URL 2 を削除"… in all 9 languages. |
| Zoom pill and error icon had no accessible name. | 1.1.1, 4.1.2 | Screen-reader users. | `aria-label` on the zoom reset pill; error icon is `role="img"` with the failure text. |
| No in-app help: features were only discoverable in menus and tooltips. | 3.2.6 (consistent help), 3.3.5 (AAA, informative) | Everyone, especially cognitive and new users. | **Find a feature** palette (⌘K / F1 / top-bar button). Every command is listed in plain words with its shortcut and searchable with synonyms ("スマホ", "iPhone", "mobile"). The palette is an ARIA combobox and listbox with `aria-activedescendant` and a live result count. Optional first-run Tips sheet. |

## Remaining findings

| Severity | Finding | Criterion | Who is blocked | Where | Next fix |
| --- | --- | --- | --- | --- | --- |
| Minor | Tab close buttons are 16 × 16 px, adjacent to the tab target. | 2.5.8 | Motor-impaired pointer users can hit the tab instead of ✕. ⌘W, the File menu and the palette entry close tabs without precision. | Pane title bar → tab ✕ | Grow the hit area to 24 px with a transparent pad, or show ✕ only on the selected tab with spacing. |
| Minor | In a compact pane (narrower than 380 px) the mobile preview button is hidden until a device is on. | 1.3.1 / discoverability | Mouse users with many panes don't see the control. Keyboard users can still use ⌘⇧M and the palette. | Pane title bar, compact | Move the button into an overflow menu instead of hiding it. |
| Advisory | ⌘K is taken by the deck everywhere, so pages' own ⌘K (Slack, Linear, ChatGPT search) no longer fires inside panes. | — (2.1.4 covers single-character keys only) | Users relying on a site's ⌘K. F1 and the button also open the palette. | Global | Make the palette shortcut configurable, or hand ⌘K to the page while a text field in it has focus. |

## Seven-pass evidence

| Pass | Result | Evidence and limit |
| --- | --- | --- |
| 1. Automated | Executed | `npm test` (75 tests, including WCAG maths and every audited pair ≥ its threshold) and `node scripts/contrast.mjs --check`. No axe/Lighthouse run: the shell is not a web page reachable by those tools without extra wiring. |
| 2. Keyboard | Executed on VM (Linux build, same renderer) | ⌘K (Ctrl+K on Linux) from a focused page → focus in the search field. Tab cycles inside the palette only. Esc closes and returns focus to the opener with a visible ring. Edit window: name field focused on open; move buttons keep focus on the moved row. ⇧→ on a tab moves it and keeps focus. Alt+←/→ (Linux) and Ctrl+[ step history. **Not run on macOS:** ⌘←/→, two-finger swipe and the app-command path. |
| 3. Screen reader | Not assessable here | Markup reviewed: names on icon buttons, `aria-pressed`, combobox/listbox roles, live regions for notices, moves and result counts. A VoiceOver + this app pass on a Mac is still required. Check rotor headings in sheets, palette option announcement, and the live region on URL moves. |
| 4. Zoom & reflow | Partial | Sheets are scrollable and capped at the window. The shell has no zoom shortcut of its own (⌘+ zooms the page). macOS display scaling not tested. |
| 5. Colour & contrast | Measured | `scripts/contrast.mjs` composites every alpha/opacity pair from the live tokens (`src/styles/cie/*.css` + `src/index.css`). Before/after below. |
| 6. Motion & time | Reasoned | Layout and sheet transitions follow `prefers-reduced-motion` (snapshot animation skipped, sheets instant). Notices stay 3.2 s (6 s with Undo). Undo is also on ⌘Z with no time limit. OS setting not toggled on a Mac. |
| 7. Forms & errors | Partial | Edit window and Paste a list have visible labels. Empty URL rows are dropped on save rather than flagged. The palette's empty state offers a next step (ask an AI chat). |

## Contrast evidence

`node desktop/scripts/contrast.mjs` (WCAG 2.x relative luminance, alpha composited over the real background).

### Before (origin/main, v0.2.4)

| Use | Foreground | Background | Ratio | Needs | Result |
| --- | --- | --- | --- | --- | --- |
| Sidebar hint text, set chips, rail hosts | `#9c9c98` | `#0b0b0b` | 7.14:1 | 4.5:1 | pass |
| Mono labels on the focused card / pane header | `#66665f` | `#f3f2ee` | 5.16:1 | 4.5:1 | pass |
| Pane header subtitle (unfocused) | `#9c9c98` | `#0b0b0b` | 7.14:1 | 4.5:1 | pass |
| Pane placeholder host label (page not drawn yet) | `#9c9c98` | `#171716` | 6.54:1 | 4.5:1 | pass |
| Hidden window card: number and favicon (opacity) | `#626260` | `#0b0b0b` | 3.22:1 | 4.5:1 | **FAIL** |
| Settings and dialog helper text | `#66665f` | `#f3f2ee` | 5.16:1 | 4.5:1 | pass |
| Text field placeholder (dialogs) | `#66665f` | `#f3f2ee` | 5.16:1 | 4.5:1 | pass |
| Address / find placeholder, focused pane | `#969693` | `#f3f2ee` | 2.66:1 | 4.5:1 | **FAIL** |
| Address / find placeholder, other panes | `#686766` | `#0b0b0b` | 3.50:1 | 4.5:1 | **FAIL** |
| Layout chip text on button fill | `#f3f2ee` | `#303030` | 11.71:1 | 4.5:1 | pass |
| Unselected tab pill text (unfocused pane) | `#9c9c98` | `#0b0b0b` | 7.14:1 | 4.5:1 | pass |
| Text field border (dialogs) | `#b9b8b5` | `#f3f2ee` | 1.77:1 | 3:1 | **FAIL** |
| Choice pill border, unselected | `#c5c4c1` | `#f3f2ee` | 1.56:1 | 3:1 | **FAIL** |
| Tab / select / switcher pill border on ink | `#454544` | `#0b0b0b` | 2.04:1 | 3:1 | **FAIL** |
| Key cap border | `#6c6c6a` | `#0b0b0b` | 3.75:1 | 3:1 | pass |
| Key cap border in sheets | `#adadaa` | `#f3f2ee` | 2.01:1 | 3:1 | **FAIL** |
| Focus ring (currentColor) on ink | `#f3f2ee` | `#0b0b0b` | 17.57:1 | 3:1 | pass |
| Focus ring (currentColor) on paper | `#0b0b0b` | `#f3f2ee` | 17.57:1 | 3:1 | pass |
| Disabled back / forward icon (exempt, reported) | `#51504f` | `#0b0b0b` | 2.45:1 | — | exempt |

19 pairs, 7 failing. The script listed 18 then; the key cap border in sheets (ink at alpha 0.3) was measured separately with the same functions.

### After (this change)

| Use | Foreground | Background | Ratio | Needs | Result |
| --- | --- | --- | --- | --- | --- |
| Sidebar hint text, set chips, rail hosts | `#b0b0ab` | `#0b0b0b` | 9.04:1 | 4.5:1 | pass |
| Mono labels on the focused card / pane header | `#4f4f49` | `#f3f2ee` | 7.36:1 | 4.5:1 | pass |
| Pane header subtitle (unfocused) | `#b0b0ab` | `#0b0b0b` | 9.04:1 | 4.5:1 | pass |
| Pane placeholder host label (page not drawn yet) | `#b0b0ab` | `#171716` | 8.27:1 | 4.5:1 | pass |
| Hidden window card: name, number, hosts | `#b0b0ab` | `#0b0b0b` | 9.04:1 | 4.5:1 | pass |
| Settings and dialog helper text | `#4f4f49` | `#f3f2ee` | 7.36:1 | 4.5:1 | pass |
| Text field placeholder (dialogs) | `#4f4f49` | `#f3f2ee` | 7.36:1 | 4.5:1 | pass |
| Address / find placeholder, focused pane | `#5c5c5a` | `#f3f2ee` | 5.99:1 | 4.5:1 | pass |
| Address / find placeholder, other panes | `#a2a19f` | `#0b0b0b` | 7.63:1 | 4.5:1 | pass |
| Layout chip text on button fill | `#f3f2ee` | `#303030` | 11.71:1 | 4.5:1 | pass |
| Command palette row hint on paper | `#4f4f49` | `#f3f2ee` | 7.36:1 | 4.5:1 | pass |
| Command palette selected row hint | `#b0b0ab` | `#0b0b0b` | 9.04:1 | 4.5:1 | pass |
| Unselected tab pill text (unfocused pane) | `#b0b0ab` | `#0b0b0b` | 9.04:1 | 4.5:1 | pass |
| Text field border (dialogs) | `#7f7f7d` | `#f3f2ee` | 3.60:1 | 3:1 | pass |
| Choice pill border, unselected | `#7f7f7d` | `#f3f2ee` | 3.60:1 | 3:1 | pass |
| Tab / select / switcher pill border on ink | `#7f7f7d` | `#0b0b0b` | 4.88:1 | 3:1 | pass |
| Key cap border | `#6c6c6a` | `#0b0b0b` | 3.75:1 | 3:1 | pass |
| Key cap border in sheets | `#7f7f7d` | `#f3f2ee` | 3.60:1 | 3:1 | pass |
| Focus ring (currentColor) on ink | `#f3f2ee` | `#0b0b0b` | 17.57:1 | 3:1 | pass |
| Focus ring (currentColor) on paper | `#0b0b0b` | `#f3f2ee` | 17.57:1 | 3:1 | pass |
| Disabled back / forward icon (exempt, reported) | `#686766` | `#0b0b0b` | 3.50:1 | — | exempt |

21 pairs, 0 failing.

## Criterion notes

Results are `measured` (script or VM run), `reasoned` (source review) or `not assessed`.

| SC | Result | Note |
| --- | --- | --- |
| 1.1.1 / 4.1.2 | reasoned | Every icon-only button has a localized `aria-label` in 9 languages. Pressed toggles use `aria-pressed`. The palette is a combobox with a listbox. |
| 1.3.1 | reasoned | Sheets are `role="dialog"` with `aria-modal` and a labelled title. Shortcut lists are `<dl>`. Pane groups are labelled sections. |
| 1.4.1 | reasoned | Focused pane, selected tab and pressed buttons change fill, not hue alone. |
| 1.4.3 / 1.4.11 | measured | See tables. All text ≥ 4.5:1 (muted text ≥ 7:1). Boundaries and focus ≥ 3:1. |
| 1.4.12 | not assessed | Line heights are relative. No text-spacing override run. |
| 1.4.13 | reasoned | Only native `title` tooltips. No custom hover content. |
| 2.1.1 | measured / reasoned | All app features have a keyboard path. The palette lists every command, and drag interactions have button/key equivalents. Third-party pages are out of scope. |
| 2.1.2 | measured | Esc leaves every sheet. Focus is trapped only while a sheet is open. |
| 2.1.4 | reasoned | No single-character shortcuts. All use ⌘/⌥/Ctrl. |
| 2.4.3 | measured (VM) | Focus enters sheets on open and returns to the opener. |
| 2.4.7 | measured | 2 px outline on buttons, fields and tabs. Checked on the VM. |
| 2.4.11 | reasoned | Sheets are centered and the panes stay underneath. Notices sit in the title bar and never cover focus. |
| 2.5.7 | measured (VM) | URL, tab and window-card reordering all have non-drag alternatives. |
| 2.5.8 | reasoned | Pane header buttons are 24 px. Tab ✕ is 16 px (Minor finding above). |
| 3.1.1 | reasoned | `html[lang]` follows the UI language (ja, en, zh-Hans, zh-Hant, ko, es, fr, de, pt). |
| 3.2.6 | reasoned | Help is in the same place on every window: the top-bar "Find a feature" button, the Help menu and F1. |
| 3.3.2 | reasoned | Fields have visible labels. The Edit window explains the URL order and its keys. |
| 4.1.3 | measured (VM) | Notices ("Moved to 2 of 2", undo messages, Google sign-in results, palette result count) use polite live regions. |

## Passes executed vs. not assessable

Executed here:

- The contrast script before and after.
- Unit tests for the contrast maths and every audited pair.
- A keyboard walkthrough on the Linux VM build: palette, Edit window, tab moves, back/forward keys, mouse back/forward buttons, focus return.
- Screenshots and a recording in `/opt/cursor/artifacts/v025/`.

Needs a real Mac:

- A **VoiceOver** pass: palette options, sheet titles, live-region announcements, the mobile model picker, and the Google sign-in window.
- ⌘←/→, two-finger swipe back, and Japanese IME typing into the palette. On the VM, katakana was injected through DevTools.
- macOS Increase contrast, Reduce motion and Reduce transparency.
- Display scaling at 1× ("Larger Text" resolutions).

## What is already right

- One undo stack (⌘Z) covers every deck edit, including reorders and per-window devices, and notices offer Undo inline.
- Reduced motion is honoured for layout animation and sheets.
- All UI strings, including palette synonyms, exist in 9 languages (enforced by `test/strings.test.js` and `test/palette.test.js`).
