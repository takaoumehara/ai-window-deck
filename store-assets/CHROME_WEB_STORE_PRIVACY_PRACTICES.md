# Chrome Web Store: Privacy practices submission copy

This file is the source of truth for completing the Chrome Web Store **Privacy
practices** form for AI Window Deck v1.6.1. It was checked against
`manifest.json`, `background.js`, `attention.js`, `deck.js`, and the privacy
policy in this directory on 2026-08-02.

Do not claim that the extension uses remote code. Every executable script is
packaged with the extension, and the source contains no network request,
external script, `eval`, or dynamically downloaded code.

## 1. Data usage

Select **Web history** and **Website content**.

Reason: the extension reads the URLs and titles of open Chrome tabs and can
save user-selected URLs in a window layout. They are used only to show the
window list, save/reopen a layout, and arrange the user's Chrome windows.

Leave all other data types unchecked:

- Personally identifiable information
- Health information
- Financial and payment information
- Authentication information
- Personal communications
- Location
- User activity

Important clarifications:

- The optional Gentle heads-up feature handles a minimal website-content
  signal: whether a page's DOM is changing. It sends the extension only a
  `busy`, `done`, or `seen` state and a timestamp; it does not read page text,
  form fields, messages, credentials, images, audio, or video.
- Saved layouts and preferences use `chrome.storage.sync`, so they can be
  synchronized by Chrome for the same signed-in Chrome profile. Temporary
  undo, attention, and activity state use `chrome.storage.session`.
- The extension has no developer-operated server and does not send user data
  to the publisher or to third parties.

## 2. Required certifications

Check all three certifications, provided the packaged extension remains
unchanged from the reviewed version:

- **I do not sell or transfer user data to third parties, outside of the
  approved use cases.**
- **I do not use or transfer user data for purposes that are unrelated to my
  item's single purpose.**
- **I do not use or transfer user data to determine creditworthiness or for
  lending purposes.**

## 3. Privacy policy URL

Publish `store-assets/privacy-policy.html` at a public HTTPS URL, then paste
that exact URL into **Privacy policy URL**. A repository path or a `file://`
URL is not acceptable.

Before publishing, replace the generic contact sentence in the policy with a
working support email address or support-page URL. The same contact should be
set and verified in Chrome Web Store **Account / Settings**.

Suggested field value after hosting (replace this example with the actual
deployed URL):

```text
https://YOUR-DOMAIN.example/privacy-policy
```

## 4. Single purpose description

Paste this in the **Single purpose description** field:

```text
AI Window Deck helps users create, save, reopen, and arrange Chrome window layouts across one or more displays. It also lets users group the tabs it opens and optionally receive a local heads-up when a background page appears to have stopped updating.
```

## 5. Permission justifications

Paste each paragraph into the matching Web Store field.

### tabs justification

```text
AI Window Deck uses the tabs permission to read the URL and title of tabs in the user's Chrome windows, list those windows in the extension UI, save a user-requested window layout, open the URLs the user configured, and focus the appropriate tab or window. This is required for the extension's core workspace-layout feature. Tab data is not sent to the developer or to third parties.
```

### tabGroups justification

```text
AI Window Deck uses the tabGroups permission only when it opens a user-configured window set. It creates a tab group for the tabs opened in each new window and applies the group name and color selected by the user, making each workspace window identifiable in Chrome. Tab groups are not used for advertising, profiling, or data transfer.
```

### scripting justification

```text
AI Window Deck uses the scripting permission to inject its packaged attention.js file into open HTTP and HTTPS tabs after installation or update. The same packaged script is declared as a content script. When the optional Gentle heads-up feature is enabled, it observes only whether a background page is changing and reports a local busy, done, or seen state so Chrome can draw attention to a window that may have finished. It does not read, store, transmit, or interpret website content, form fields, messages, credentials, or user input.
```

### storage justification

```text
AI Window Deck uses Chrome storage to save user-configured window layouts, the URLs and names in those layouts, display and language preferences, and the size and position of its settings and window-list panels. It uses session storage for temporary undo history and local attention state. Sync storage lets these user settings synchronize between Chrome browsers signed in to the same Chrome profile. The extension does not transmit this data to the developer or to third parties.
```

### system.display justification

```text
AI Window Deck uses system.display to obtain the connected displays and their work areas. This lets the user choose one or more displays and lets the extension calculate window positions and sizes when arranging a workspace. Display information is used locally only for this layout feature and is not sent to the developer or to third parties.
```

### Host permission justification

```text
AI Window Deck requests host access to HTTP and HTTPS pages because its optional Gentle heads-up feature must run consistently on any website a user chooses to place in a workspace. Its packaged content script observes only whether a background document is changing, so it can locally indicate that a page may have finished updating. The script does not read, store, transmit, or interpret website content, form fields, messages, credentials, or user input. It can be disabled in the extension settings.
```

## 6. Remote code

Select:

```text
No, I am not using remote code
```

Do **not** enter a remote-code justification. The extension runs only
JavaScript files contained in its uploaded package. In particular,
`chrome.scripting.executeScript({ files: ["attention.js"] })` injects the
local packaged file; it is not remote code.

## Pre-submit check

Before saving the draft, confirm all of the following:

1. The **Yes, I am using remote code** selection in the screenshot has been
   changed to **No, I am not using remote code**.
2. **Web history** and **Website content** are the only selected data types.
3. All three certification checkboxes are selected.
4. The privacy policy link is public, HTTPS, current, and contains a real
   support contact.
5. The publisher contact email is saved and verified in the developer account.
6. The Store listing describes the window-layout feature and the optional
   Gentle heads-up feature, matching the single-purpose description and
   privacy policy.
