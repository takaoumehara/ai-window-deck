# AI Window Deck — Privacy practices answers

Enter the following in the Chrome Web Store Developer Dashboard. These answers are based on version `1.6.1` in this folder; update them if the extension’s behavior changes.

## Privacy policy

Provide the stable public HTTPS URL where `privacy-policy.html` is hosted.

## Data usage certification

- I do not sell or transfer user data to third parties.
- I do not use or transfer user data for purposes unrelated to the item’s core functionality.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.
- I do not use or transfer user data for personalized, retargeted, or interest-based advertising.
- I do not allow humans to read user data.

## Data disclosures

Mark the dashboard categories that match the following behavior. The dashboard wording can change; use the behavior statement as the source of truth.

| Data category presented by the dashboard | Answer | Purpose / handling statement |
| --- | --- | --- |
| Personally identifiable information | No | The extension does not collect names, email addresses, account identifiers, or contact details. |
| Financial and payment information | No | Not collected. |
| Health information | No | Not collected. |
| Authentication information | No | The extension does not read or transmit passwords, authentication cookies, or tokens. |
| Personal communications | No | The extension does not read or transmit messages, email, or chats. |
| Location | No | `system.display` identifies local display geometry only; it does not access geographic location. |
| Web history / browsing activity | Yes — local only | URLs and active-tab metadata are read only to open user-configured URLs, arrange windows, capture a user-requested window set, and show the in-product window list. Nothing is sent to a developer-operated server. |
| Website content | Yes — local, minimal signal only | With Gentle heads-up enabled, a content script detects whether a background page’s document structure is changing. It does not read, persist, interpret, or transmit the page’s text, form fields, messages, credentials, or content. |
| User-generated content | No | The extension does not read or transmit user-created text or files. |
| Other data | No | No analytics, advertising identifiers, or developer-operated telemetry is collected. |

## Justification for required permissions

| Manifest permission / access | User-facing reason |
| --- | --- |
| `tabs` | Read the active tab’s basic metadata, open URLs configured by the user, group tabs, and focus or close a window when the user chooses. |
| `tabGroups` | Give newly opened workspace windows a user-visible name and color in the Chrome tab strip. |
| `windows` | Create, arrange, focus, resize, restore, and close Chrome windows at the user’s request. |
| `storage` | Save user preferences, saved window sets, undo state, and optional attention state. |
| `system.display` | Place windows on the monitor selected by the user. |
| `scripting` | Ensure the local Gentle heads-up detector is available in already-open HTTP(S) tabs after installation or update. |
| All sites (`<all_urls>`) | The optional Gentle heads-up feature must observe local document-change signals in any background page the user may work in. It neither reads nor sends page contents and can be disabled in settings. |

## Prominent disclosure assessment

No separate consent dialog is planned because the extension does not collect or transmit personal or sensitive data to the publisher or any third party. The optional attention feature is disclosed in the product UI, store description, and privacy policy. Before publishing, review the current dashboard prompts and Chrome Web Store policy; if Chrome treats the local document-change signal as requiring prominent disclosure, add an explicit opt-in gate before the detector starts.
