# Privacy Policy for AI Window Deck

Effective date: October 4, 2026 (version 1.7.0)

AI Window Deck is a Chrome extension that opens user-configured sets of Chrome windows and arranges them on screen. This policy explains how the extension handles data.

## Summary

- AI Window Deck has no server, no accounts, no analytics and no advertising.
- It makes no network requests of its own and loads no remote code.
- The data it handles stays in your Chrome profile and is never sent to the developer or to third parties.

## Information the extension handles

The extension handles only the information its features need:

- **Your window sets and preferences.** This covers the window names and URLs you enter, canvas layouts and layout presets, configuration profile names, spotlight and display settings, your language choice, and the positions of the extension's own settings and controller windows. They are stored so the extension can reopen and arrange your windows.
- **Current Chrome window and tab metadata.** To arrange windows, list open windows, group tabs, and focus or close a window when you ask, the extension reads:
  - window position, size and state;
  - the title and URL of each window's active tab;
  - tab counts;
  - tab-group information.

  It reads this only while carrying out one of these actions and does not keep a history of it.
- **Display information.** It reads the size and position of your displays, so windows are placed on the monitor you choose.

The extension does not read the content of web pages and does not run scripts on websites. It does not collect personally identifiable, health, financial, authentication, communication or location information.

## How information is used

Information is used only to provide the extension's single purpose: creating, saving, reopening and arranging Chrome window layouts, and grouping the tabs it opens.

## Storage and retention

- Window sets and preferences are stored in `chrome.storage.sync`. If Chrome Sync is turned on, Chrome may sync them between browsers signed in to the same Google Account. That syncing is done by Chrome, under your Google Account settings, and not by the developer.
- Temporary state is stored in `chrome.storage.session` and cleared when the browser session ends. This includes undo history, the windows the deck opened, and the sizes to restore after a spotlight.
- When you choose *Backup*, a JSON file is downloaded to your computer. It stays under your control and is not uploaded anywhere.

## Sharing and sale

AI Window Deck does not sell, rent, transfer or share user data with third parties. It does not use user data for advertising, retargeting or profiling, and does not use it to determine creditworthiness or for lending. The developer cannot access your extension data.

## Permissions

The extension requests:

- `tabs`: open saved URLs and read open windows' tab titles and URLs;
- `tabGroups`: name and colour the tab groups it creates;
- `storage`: save your settings;
- `system.display`: place windows on the right monitor.

It requests no host permissions and has no content scripts.

## Your choices

- You can edit or delete saved windows, layouts and profiles in the extension.
- *Factory Reset* (Windows Library → Danger Zone) clears all stored settings.
- Removing the extension deletes its local data. Synced copies are handled by Chrome and your Google Account settings.

## Changes to this policy

If this policy changes, the effective date above will be updated and the revised policy will be published at the same address.

## Contact

For privacy questions and support, open an issue at <https://github.com/takaoumehara/ai-window-deck/issues>.

The use of information received from Chrome APIs by this extension adheres to the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq), including the Limited Use requirements.
