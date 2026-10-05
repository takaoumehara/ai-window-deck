# AI Window Deck v1.8.0 - Test Guide

## Loading the Extension in Chrome

### Method 1: Load Unpacked (Recommended for Testing)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the extension folder containing `manifest.json`
   - Either: Extract `ai-window-deck-v1.8.0.zip` and select the extracted folder
   - Or: Clone the repo and select the `/workspace` directory directly
5. The extension should now appear in your extensions list
6. Pin it to your toolbar for easy access

### Method 2: Load from ZIP (Alternative)

If you prefer to load the pre-built ZIP:

1. Download `ai-window-deck-v1.8.0.zip` from the PR or artifacts
2. Extract it to a folder on your computer
3. Follow steps 1-5 from Method 1 above

## What's New in v1.8.0

### 1. ✅ **FIXED: Spotlight placement settings now apply correctly**

**What was broken:**
- Changing Spotlight size (half, tall, full, custom, etc.) settings in the UI did not affect where windows opened/expanded
- Settings appeared to save but weren't being applied when using Alt+X (spotlight) shortcut

**How it's fixed:**
- Added defensive logging to settings read/write operations
- Ensured settings are read fresh from `chrome.storage.sync` on every spotlight action
- Validated settings flow: UI → storage → background service worker → window positioning

**How to test:**
1. Open the extension popup
2. In the "Spotlight Window Size" section, change the size from "Full" to "Half" (50% × 50%)
3. Open the browser console (F12) to see the logs:
   ```
   [AI Window Deck] Saving settings: {spotlightSize: "half"}
   ```
4. Focus any Chrome window
5. Press `Alt+X` (or your configured spotlight shortcut)
6. Check the console again - you should see:
   ```
   [AI Window Deck] Settings loaded: {spotlightSize: "half", ...}
   [AI Window Deck] Applying spotlight bounds: {...} with config: {size: "half", ...}
   ```
7. **Expected result:** Window should resize to 50% width × 50% height
8. **Test other sizes:** Try "Tall" (50% × 100%), "Custom" with different percentages

**Test the Anchor setting:**
1. Set size to "Half" (50% × 50%)
2. Set Anchor to "Keep" (keeps window centered on its current position)
3. Move a window to the top-left corner of your screen
4. Press `Alt+X`
5. **Expected:** Window enlarges but stays roughly in the top-left area
6. Change Anchor to "Center" (centers window on screen)
7. Press `Alt+X` again (it will toggle back), then `Alt+X` once more to enlarge
8. **Expected:** Window enlarges and moves to the center of the screen

### 2. 🎨 **NEW: CIE Design System Integration**

**What changed:**
- Applied the CIE design system from https://github.com/takaoumehara/cie-ds
- Two-color design: Ink (#0b0b0b) and Paper (#f3f2ee)
- Outfit font family for all text
- DM Mono for keyboard shortcuts and code
- Snappy, refined motion using CIE easing curves (expo, ease-out)
- No accent colors, shadows, or gradients - clean and minimal

**Visual changes:**
- Header logo and buttons use ink/paper colors
- All cards and sections use subtle paper/ink backgrounds
- Buttons have smooth transitions with CIE timings (160ms snap, 520ms settle)
- Scrollbars are thin (5px) with paper-mute color
- Border radius uses CIE tokens (clamp(12px, 1.7vmin, 24px))

### 3. 🌓 **NEW: Light/Dark Mode Toggle**

**What it does:**
- Click the sun/moon icon in the header to switch between light and dark modes
- Preference is saved and persists across browser sessions
- Smooth transitions when switching themes (520ms with expo easing)

**Color schemes:**
- **Dark mode (default):** Paper (#f3f2ee) background, Ink (#0b0b0b) text
- **Light mode:** Ink (#0b0b0b) background, Paper (#f3f2ee) text

**How to test:**
1. Open the extension popup
2. Look for the sun/moon icon in the top-right of the header
3. Click it to toggle between light and dark modes
4. **Expected:** Entire UI smoothly transitions colors
5. Close and reopen the popup
6. **Expected:** Theme preference is remembered

### 4. ✨ **IMPROVED: Simplified UI**

**What changed:**
- Removed verbose descriptions from spotlight size/anchor buttons
- Cleaner button layout with centered icons and labels
- Less visual clutter and information overload
- Better hierarchy using size and weight instead of colors
- Reduced copy and improved scannability

**Before vs After:**
- **Before:** Each button had a title, icon, description (3+ lines of text)
- **After:** Each button shows just an icon glyph and label (2 lines max)

### 5. 🔤 **NEW: Google Fonts Integration**

**Fonts loaded:**
- Outfit (variable weight 100-900) for UI text
- DM Mono (400) for keyboard shortcuts and technical labels
- Zen Kaku Gothic New (300, 400, 500, 700) for Japanese text

**Where they're used:**
- Headers and body text: Outfit with -0.03em letter-spacing
- Keyboard shortcuts (`.key-cap`): DM Mono, 12px, uppercase
- Japanese content: Zen Kaku Gothic New with 'palt' feature

## Testing Checklist

### Core Functionality
- [ ] Extension loads without errors
- [ ] Popup opens when clicking extension icon
- [ ] All tabs (Arrange, Windows, Profiles) are accessible
- [ ] Language selector works (try switching to Japanese, Spanish, etc.)
- [ ] "Open in Tab" button works
- [ ] "Open Dock" button works

### Spotlight Feature (Priority Bug Fix)
- [ ] Change spotlight size to "Half" → Press Alt+X → Window resizes to 50×50%
- [ ] Change spotlight size to "Tall" → Press Alt+X → Window resizes to 50×100%
- [ ] Change spotlight size to "Custom" (70×90) → Press Alt+X → Window resizes accordingly
- [ ] Change anchor to "Keep" → Window stays in current position when enlarged
- [ ] Change anchor to "Center" → Window moves to screen center when enlarged
- [ ] Console logs show correct settings being loaded and applied
- [ ] Press Alt+Z to restore original window size (undo)

### Theme Toggle
- [ ] Click sun/moon icon → UI switches between light and dark
- [ ] Close and reopen popup → Theme preference is remembered
- [ ] All UI elements update colors correctly (no leftover old colors)
- [ ] Transitions are smooth (520ms)
- [ ] Both themes are readable and have good contrast

### Visual Design
- [ ] All text uses Outfit font
- [ ] Keyboard shortcuts use DM Mono font
- [ ] Buttons have subtle ink/paper colors (no blue/orange accents)
- [ ] Borders are subtle strokes (rgba with 0.42 opacity)
- [ ] Border radius is consistent (12-24px depending on viewport)
- [ ] Scrollbars are thin (5px) and use muted colors
- [ ] No shadows or gradients anywhere

### UI Simplification
- [ ] Spotlight size buttons show only glyph + label (no long descriptions)
- [ ] Anchor buttons show only icon + label
- [ ] UI feels less cluttered than before
- [ ] Hierarchy is clear (size and weight, not color)
- [ ] Important actions are easy to find

## Known Issues / Future Work

1. **Existing i18n strings:** Some UI text still references old design patterns (e.g., "spotlightHalfDesc" descriptions are no longer shown but still exist in translation files). This doesn't affect functionality but could be cleaned up in a future PR.

2. **Other components not yet updated:** Only the Header and SpotlightConfig components have been fully migrated to CIE design. Other components (WorkspaceCanvas, WindowsSidebar, etc.) still use Tailwind zinc colors. These will be updated in follow-up PRs to avoid a massive changeset.

3. **Motion preferences:** The CIE design system includes `prefers-reduced-motion` support, which is implemented for key animations. Users who have motion reduction enabled in their OS will see instant transitions instead of animated ones.

## Debugging Tips

### If settings don't apply:
1. Open Chrome DevTools (F12)
2. Look for console logs starting with `[AI Window Deck]`
3. Check if "Settings loaded" shows your expected values
4. Check if "Applying spotlight bounds" shows the correct config
5. If logs are missing, the background service worker may have been terminated - try reloading the extension

### If theme doesn't persist:
1. Check `chrome://settings/content/cookies` - ensure cookies/storage is enabled
2. Check if `chrome.storage.sync` is working: open DevTools → Application tab → Storage → Chrome Extension Storage
3. Look for a `theme` key with value "light" or "dark"

### If fonts don't load:
1. Check Network tab in DevTools for 404s on Google Fonts
2. Ensure you have an internet connection (fonts are loaded from CDN)
3. Check if `@import` in `src/index.css` is present and correct

## Files Changed

### New Files
- `src/cie-tokens.css` - CIE design system tokens (colors, fonts, spacing, motion)
- `src/hooks/useTheme.js` - Theme management hook
- `ai-window-deck-v1.8.0.zip` - Loadable Chrome extension package

### Modified Files
- `background.js` - Added defensive logging for settings debugging
- `manifest.json` - Version bumped to 1.8.0
- `package.json` - Version bumped to 1.8.0
- `src/index.css` - Import CIE tokens, update base styles, custom scrollbar
- `src/App.jsx` - Integrate theme hook, apply CIE colors
- `src/components/Header.jsx` - Add theme toggle button, use CIE design
- `src/components/SpotlightConfig.jsx` - Simplify UI, remove verbose text, use CIE design
- `src/hooks/useExtensionState.js` - Add logging to settings save

## Support

If you encounter any issues:
1. Check the console logs (F12 → Console)
2. Take screenshots of unexpected behavior
3. Note which Chrome version you're using
4. Share the console output with the logs

## License

MIT
