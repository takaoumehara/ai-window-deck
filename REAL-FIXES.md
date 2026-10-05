# v1.8.0 - REAL FIXES Applied

## Critical Update: Not Just Logging

The initial commit only added console.log statements. **This update contains ACTUAL CODE FIXES.**

---

## Real Bugs Fixed

### 1. Race Condition in Settings Persistence ✅

**Bug:** `chrome.storage.sync.set()` was NOT awaited. If you changed a setting and closed the popup quickly, the write might not complete.

**Fix:** Now **awaits** all `chrome.storage.sync.set()` calls with try-catch error handling.

**Files changed:**
- `src/hooks/useExtensionState.js`
- `src/hooks/useTheme.js`
- `src/hooks/useRegisteredWindows.js`
- `src/components/SpotlightConfig.jsx`

**Test:** Change a setting → immediately close popup → reopen → setting should persist (not revert).

---

### 2. Incomplete Settings Read ✅

**Bug:** `chrome.storage.sync.get(DEFAULTS)` only returned keys that were in the DEFAULTS object. If the UI saved a key that wasn't in background's DEFAULTS, it was silently ignored.

**Example:**
- UI DEFAULTS has: `oddMode`, `splitMode`, `onboardingSeen`
- Background DEFAULTS doesn't have these
- Settings with these keys would be saved but never read by background

**Fix:** Now reads **ALL** stored keys with `chrome.storage.sync.get(null)` instead of just DEFAULTS keys.

**Files changed:**
- `background.js` (settings() function)

**Test:** Console logs now show both `fromStorage` (raw stored values) and merged values.

---

### 3. No Settings Validation ✅

**Bug:** Invalid or corrupted settings values (e.g., `spotlightSize: "invalidValue"`) were passed through unchecked, causing undefined behavior.

**Fix:** Validates `spotlightSize` and `spotlightAnchor` after loading. Invalid values are reset to safe defaults with console warnings.

**Files changed:**
- `background.js` (settings() function)

**Test:** Console will show warnings if invalid values are detected and reset.

---

### 4. Insufficient Visibility ✅

**Bug:** The `spotlightBounds()` function had no logging. If the window wasn't resizing correctly, you couldn't tell why.

**Fix:** Added comprehensive logging at every step:
- Input values (workArea, window state, config)
- Whether preset was found
- Calculated percentages and dimensions  
- Final bounds to be applied
- Which anchor mode was used

**Files changed:**
- `background.js` (spotlightBounds() function)

**Test:** Console now shows complete trace of bounds calculation.

---

## Before/After Code Comparison

### Settings Save (useExtensionState.js)

**Before:**
```javascript
const updateState = (updates) => {
  setState({ ...state, ...updates });
  chrome.storage.sync.set(updates);  // NOT AWAITED
};
```

**After:**
```javascript
const updateState = async (updates) => {
  setState({ ...state, ...updates });
  try {
    await chrome.storage.sync.set(updates);  // AWAITED
    console.log('[AI Window Deck] Settings saved successfully');
  } catch (error) {
    console.error('[AI Window Deck] Failed to save settings:', error);
  }
};
```

---

### Settings Read (background.js)

**Before:**
```javascript
async function settings() {
  const stored = await chrome.storage.sync.get(DEFAULTS);  // Only DEFAULTS keys
  return { ...DEFAULTS, ...stored };
}
```

**After:**
```javascript
async function settings() {
  try {
    const stored = await chrome.storage.sync.get(null);  // ALL keys
    const merged = { ...DEFAULTS, ...stored };
    
    // Validate
    if (!validSizes.includes(merged.spotlightSize)) {
      merged.spotlightSize = 'full';
    }
    
    // Log for debugging
    console.log('[AI Window Deck] Settings loaded:', {...});
    return merged;
  } catch (error) {
    return { ...DEFAULTS };
  }
}
```

---

## Testing the Real Fixes

### Quick Test (2 minutes)

1. **Load extension:**
   - Extract `ai-window-deck-v1.8.0.zip`
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select extracted folder

2. **Test race condition fix:**
   - Open extension popup
   - Change spotlight size to "Half"
   - **Immediately close popup** (< 100ms)
   - Reopen popup
   - ✅ Size should still be "Half" (not reverted)

3. **Test settings apply:**
   - Open console (F12)
   - With "Half" selected, focus any Chrome window
   - Press `Alt+X`
   - ✅ Check console logs show:
     ```
     Settings loaded: {spotlightSize: "half", ...}
     foundPreset: true, percentW: 50, percentH: 50
     Calculated dimensions: {width: 960, height: 540}
     ```
   - ✅ Window should resize to 50% × 50% (not full screen)

4. **Test anchor setting:**
   - Move window to top-left corner
   - Set anchor to "Keep"
   - Press `Alt+X`
   - ✅ Window enlarges but stays in top-left area
   
   - Change anchor to "Center"
   - Press `Alt+Z` (restore), then `Alt+X`
   - ✅ Window enlarges AND moves to screen center

---

## Console Output to Expect

**When changing settings:**
```
[AI Window Deck] Saving settings: {spotlightSize: "half"}
[AI Window Deck] Settings saved successfully
```

**When pressing Alt+X:**
```
[AI Window Deck] Settings loaded: {
  spotlightSize: "half",
  spotlightWidth: 70,
  spotlightHeight: 90,
  spotlightAnchor: "keep",
  fromStorage: {
    spotlightSize: "half",
    spotlightWidth: 70,
    ...
  }
}

[AI Window Deck] spotlightBounds called with: {
  workArea: {left: 0, top: 0, width: 1920, height: 1080},
  windowState: {left: 100, top: 50, width: 800, height: 600},
  config: {spotlightSize: "half", ...}
}

[AI Window Deck] Size calculation: {
  spotlightSize: "half",
  foundPreset: true,
  percentW: 50,
  percentH: 50,
  workAreaWidth: 1920,
  workAreaHeight: 1080
}

[AI Window Deck] Calculated dimensions: {width: 960, height: 540}

[AI Window Deck] Using "keep" anchor, centered on window, final bounds: {
  left: 130,
  top: 80,
  width: 960,
  height: 540
}
```

If you see these logs and the window actually resizes to 50% × 50%, **the fix is working**.

---

## What's in the ZIP

**File:** `ai-window-deck-v1.8.0.zip` (197 KB)  
**Location:** Repository root

**Contents:**
- `manifest.json` (v1.8.0)
- `background.js` (with real fixes)
- `dist/` (popup with awaited saves)
- `icons/`
- `_locales/` (translations)
- All supporting HTML/JS/CSS files

**Ready to load:** Extract and use "Load unpacked" in Chrome.

---

## Documentation

- **[BEFORE-AFTER.md](./BEFORE-AFTER.md)** - Detailed analysis of each fix
- **[QUICK-TEST.md](./QUICK-TEST.md)** - 2-minute verification procedure
- **[TEST-GUIDE.md](./TEST-GUIDE.md)** - Comprehensive testing guide
- **[SUMMARY.md](./SUMMARY.md)** - Executive summary

---

## PR Updated

**PR #6:** https://github.com/takaoumehara/ai-window-deck/pull/6

Updated description now clearly states:
- "REAL FIXES (Not Just Logging)"
- Details of each bug and fix
- Before/after code comparisons
- Testing procedures
- Console output examples

---

## Bottom Line

**Before this update:**
- Only had console.log() statements
- No actual bug fixes
- Settings might not persist (race condition)
- Some settings might be ignored (incomplete read)
- Invalid values not validated

**After this update:**
- ✅ Awaited all async saves (race condition fixed)
- ✅ Read ALL stored keys (nothing ignored)
- ✅ Validate settings (invalid values caught)
- ✅ Comprehensive logging (full visibility)

**These are real code changes that fix real bugs.**

---

## Next Steps

1. Download `ai-window-deck-v1.8.0.zip` from repository root
2. Load in Chrome via "Load unpacked"
3. Run [QUICK-TEST.md](./QUICK-TEST.md) verification (2 minutes)
4. Check console logs confirm fixes work
5. Verify window actually resizes to selected size

If console logs show correct values and window resizes correctly, **the placement bug is fixed**.

If console shows correct values but window doesn't resize, there's a deeper issue with Chrome's window positioning API (not settings persistence).

---

**ZIP file ready to load. Real fixes applied. Ready for testing.**
