# Accessibility — AI Window Deck

> Written by: superforge-a11y · Last updated: 2026-08-07  
> Target: WCAG 2.2 AA · Platform: Chrome extension web UI · Standard: none stated  
> Surfaces: popup, full-page settings, floating controller; Arrange, Windows, Profiles, modal, empty-canvas, Spotlight preview states.

## Verdict

**Not assessable as conformant** — source and token review found and remediated several keyboard/name/status issues, but no interactive Chrome runtime, screen-reader session, or 400% browser zoom session was available here. Manual canvas dragging and resizing also still need a keyboard-equivalent design before a WCAG 2.2 AA claim can be made.

## Remediation in this change

| Finding | Criterion | Who is helped | Fix |
| --- | --- | --- | --- |
| Display cards were clickable `div`s. | 2.1.1, 4.1.2 | Keyboard and screen-reader users selecting a monitor. | Replaced them with pressed-state buttons and explicit names. |
| Command feedback was visual only. | 4.1.3 | Screen-reader users running launch, retile, and restore commands. | Kept a persistent polite live region in the DOM. |
| Several icon-only controls had no programmatic name. | 4.1.2 | Screen-reader and voice-control users. | Added action-specific labels for add, remove, edit, delete, and count controls. |
| Focus treatment varied by component. | 2.4.7, 1.4.11 | Keyboard users on the dark surface. | Standardized a two-pixel Cobalt focus ring with a dark offset. |
| Repeated controls preceded the workspace with no bypass. | 2.4.1 | Keyboard users. | Added a focus-visible skip link to the main workspace. |

## Remaining finding

| Severity | Finding | Criterion | Who is blocked | Where | Required next fix |
| --- | --- | --- | --- | --- | --- |
| Major | Manual move and four-edge resize of a canvas tile require dragging. | 2.5.7 | A keyboard or switch user cannot reproduce the free-form canvas adjustments. | Arrange → canvas tile. | Add a non-drag position/size editor or keyboard move/resize controls for each tile. |

## Seven-pass evidence

| Pass | Result | Evidence and limit |
| --- | --- | --- |
| 1. Automated | Partial | `npm test` and `npm run build` execute, but the project has no rendered-output a11y scanner. No axe/Lighthouse claim is made. |
| 2. Keyboard | Reasoned | Native buttons, inputs, selects, links, and focus styles were reviewed in source. Runtime Tab/Esc/modal traversal remains unexecuted. |
| 3. Screen reader | Reasoned | Landmark, heading, label, `aria-pressed`, `aria-expanded`, live-region, and native-element markup were reviewed. VoiceOver/NVDA listening was not run. |
| 4. Zoom & reflow | Reasoned | Layout uses responsive grid/flex patterns and no global horizontal overflow; 400% zoom and text-spacing bookmarklet were not run. |
| 5. Colour & contrast | Measured / partial | Token pairs below were measured. Alpha-composited hover/selected states still need rendered verification. |
| 6. Motion & time | Partial | Spotlight preview respects `prefers-reduced-motion`; no timers, autoplay media, or flashing animation were found in the reviewed UI. OS-level preference was not exercised. |
| 7. Forms & errors | Reasoned | Visible labels exist in the registration flow; invalid submission/error announcements require a runtime walkthrough. |

## Contrast evidence

Commands used: `python3 …/superforge-a11y/scripts/contrast.py <foreground> <background>`.

| Foreground | Background | Ratio | Use | Result |
| --- | --- | --- | --- | --- |
| `#E4E4E7` | `#18181B` | 13.96:1 | Keycap text on raised surface | Pass |
| `#A1A1AA` | `#18181B` | 6.91:1 | Secondary text on raised surface | Pass |
| `#BFDBFE` | `#09090B` | 14.00:1 | Focus outline on page ground | Pass |
| `#8AA4FF` | `#0B0E14` | 8.13:1 | Accent text on ink ground | Pass |
| `#2F5BFF` | `#0B0E14` | 3.74:1 | Filled control boundary on ink ground | Pass for non-text boundary (≥3:1); not used as normal-size text. |

## Criterion ledger

Results are source-reasoned unless explicitly called `measured`; `not present` means the reviewed product has no relevant content or process.

| SC | Level | Result | Evidence |
| --- | --- | --- | --- |
| 1.1.1 | A | reasoned | Icon controls have visible text or `aria-label`; no content images in reviewed screens. |
| 1.2.1–1.2.5 | A/AA | not present | No prerecorded or live media. |
| 1.3.1 | A | reasoned | Header, nav, main, section headings, visible form labels, and native controls reviewed. |
| 1.3.2 | A | reasoned | Reading order follows component DOM order; canvas remains a special absolute-position surface. |
| 1.3.3 | A | reasoned | Drop instructions name the target and do not rely only on colour. |
| 1.3.4 | AA | reasoned | No orientation lock. |
| 1.3.5 | AA | not present | No personal-data input purpose fields. |
| 1.4.1 | A | reasoned | Selected display combines border, check icon, and pressed state. |
| 1.4.2 | A | not present | No autoplay audio. |
| 1.4.3 | AA | measured / partial | Representative dark-mode pairs measured above; rendered alpha states remain to check. |
| 1.4.4 | AA | not assessed | Requires text-only zoom run. |
| 1.4.5 | AA | reasoned | No images of text. |
| 1.4.10 | AA | not assessed | Requires 320 CSS px / 400% zoom run. |
| 1.4.11 | AA | measured / partial | Focus and key control boundaries meet measured representative pairs. |
| 1.4.12 | AA | not assessed | Requires text-spacing bookmarklet run. |
| 1.4.13 | AA | not present | No hover-only persistent content. |
| 2.1.1 | A | reasoned / partial | Native display controls fixed; canvas drag/resize requires follow-up. |
| 2.1.2 | A | not assessed | Requires modal/menu Esc traversal. |
| 2.1.4 | A | reasoned | Extension shortcuts are user-changeable in Chrome settings. |
| 2.2.1–2.2.2 | A | not present | No time limit or auto-updating content. |
| 2.3.1 | A | reasoned | No flashing content found. |
| 2.4.1 | A | reasoned | Focus-visible skip link targets `main`. |
| 2.4.2 | A | reasoned | Document title updates with language. |
| 2.4.3 | A | not assessed | Requires keyboard traversal of modal/menu. |
| 2.4.4 | A | reasoned | Command names describe their destination/action in context. |
| 2.4.5 | AA | not present | Single-screen extension workflow; no multi-page navigation. |
| 2.4.6 | AA | reasoned | Panel headings and control labels describe their topics. |
| 2.4.7 | AA | reasoned | Shared focus-visible treatment added to primary controls. |
| 2.4.11 | AA | not assessed | Requires runtime focus-obscuration check. |
| 2.5.1–2.5.4 | A | reasoned | No multipoint/motion-only action; pointer actions trigger on click. |
| 2.5.7 | AA | fail | Canvas tile move/resize is drag-only. |
| 2.5.8 | AA | reasoned / partial | Added/edited controls are at least 24px; runtime spacing check remains. |
| 3.1.1 | A | reasoned | `html[lang]` begins as Japanese and updates when the language changes. |
| 3.1.2 | AA | not present | No mixed-language passages requiring language override. |
| 3.2.1–3.2.2 | A | reasoned | No action is triggered by focus or language selection alone beyond setting UI language. |
| 3.2.3–3.2.4 | AA | reasoned | Persistent command/tab names are consistently used. |
| 3.2.6 | A | not present | No help mechanism. |
| 3.3.1–3.3.3 | A/AA | not assessed | Registration validation needs invalid-form walkthrough. |
| 3.3.4 | AA | reasoned | Destructive reset requires a second explicit click. |
| 3.3.7–3.3.8 | A/AA | not present | No authentication or redundant personal-data process. |
| 4.1.2 | A | reasoned | Native buttons/selects and name/state properties reviewed. |
| 4.1.3 | AA | reasoned | Persistent polite status region wraps command notification. |

## Not assessable without a runtime

- Load the unpacked extension in Chrome, complete the primary Arrange flow with keyboard only, and record focus order, menu handling, modal return-focus, and skip-link landing.
- Inspect the rendered accessibility tree and perform a VoiceOver + Safari or NVDA + Chrome listening pass.
- Test 400% zoom, 200% text-only zoom, forced-colours, and text-spacing overrides on the full-page and popup layouts.
- Run axe against popup/page/dock, including open preset menu, registration modal, empty canvas, selected display, and command-notification states.

## What is already right

- Spotlight animation has an explicit reduced-motion fallback.
- Cobalt selection is paired with text/state/icon changes, not colour alone.
- Shortcut changes route users to Chrome's configurable shortcut screen rather than requiring a fixed character shortcut.
- The original-tile restore language and UI remain explicit about restoring the initially launched tile position and size.
