# Quick Test: Verify Spotlight Placement Fix

This is a **2-minute test** to prove the placement bug is fixed.

## Setup

1. Load the extension in Chrome (`chrome://extensions/` → Load unpacked)
2. Open any Chrome window (e.g., Google.com)
3. Open Chrome DevTools (F12) → Console tab

## Test 1: Change Size Setting

**Step 1:** Open extension popup → Find "Spotlight Window Size" section

**Step 2:** Click on "Half" (50% × 50%) button

**Expected console output:**
```
[AI Window Deck] Saving settings: {spotlightSize: "half"}
```

**Step 3:** Close the popup, focus the Chrome window

**Step 4:** Press `Alt+X` (or your spotlight shortcut)

**Expected console output:**
```
[AI Window Deck] Settings loaded: {spotlightSize: "half", spotlightWidth: 70, spotlightHeight: 90, spotlightAnchor: "keep"}
[AI Window Deck] Applying spotlight bounds: {left: X, top: Y, width: W, height: H} with config: {size: "half", width: 70, height: 90, anchor: "keep"}
```

**Expected window behavior:**
- Window resizes to approximately 50% width × 50% height
- If you had a maximized/full-screen window, it shrinks to half size
- Position depends on anchor setting (default "keep" = stays roughly where it was)

## Test 2: Change Anchor Setting

**Step 1:** Open extension popup → Find "Anchor Position" section

**Step 2:** Move your test window to the **top-left corner** of your screen

**Step 3:** Click "Keep" anchor button (if not already selected)

**Step 4:** Close popup, press `Alt+X`

**Expected:**
- Window enlarges but stays in the top-left area (doesn't center)

**Step 5:** Open popup again, click "Center" anchor button

**Expected console output:**
```
[AI Window Deck] Saving settings: {spotlightAnchor: "center"}
```

**Step 6:** Press `Alt+Z` to restore window to original size

**Step 7:** Press `Alt+X` again

**Expected console output:**
```
[AI Window Deck] Settings loaded: {... spotlightAnchor: "center"}
[AI Window Deck] Applying spotlight bounds: ... with config: {... anchor: "center"}
```

**Expected window behavior:**
- Window enlarges AND moves to the center of your screen

## Test 3: Custom Size

**Step 1:** Open popup → Click "Custom" size button (× glyph)

**Step 2:** Two sliders appear. Set Width to 80% and Height to 60%

**Expected console output (for each slider change):**
```
[AI Window Deck] Saving settings: {spotlightWidth: 80}
[AI Window Deck] Saving settings: {spotlightHeight: 60}
```

**Step 3:** Close popup, press `Alt+X`

**Expected console output:**
```
[AI Window Deck] Settings loaded: {... spotlightSize: "custom", spotlightWidth: 80, spotlightHeight: 60}
[AI Window Deck] Applying spotlight bounds: ... with config: {size: "custom", width: 80, height: 60, ...}
```

**Expected window behavior:**
- Window resizes to approximately 80% width × 60% height

## ✅ Pass Criteria

The bug is **FIXED** if:
1. Console logs appear at each step (saving + loading + applying)
2. Window actually resizes to the selected size (not always full screen)
3. Anchor setting affects where the window is positioned
4. Custom width/height percentages are applied correctly

## ❌ Fail Criteria

The bug is **NOT FIXED** if:
- Console logs show wrong values (e.g., spotlightSize: "full" when you selected "half")
- Window always goes full screen regardless of settings
- No console logs appear (settings not being read/applied)
- Anchor setting has no effect on position

## Notes

- **First press of `Alt+X`:** Enlarges window
- **Second press of `Alt+X`:** Restores original size (toggle behavior)
- **Press `Alt+Z`:** Always restores original size (undo shortcut)

## Troubleshooting

**If logs don't appear:**
1. Make sure you're looking at the right console (the window you pressed `Alt+X` on, not the popup)
2. Reload the extension (`chrome://extensions/` → reload button)
3. Try opening a fresh window and testing again

**If window doesn't resize:**
1. Check console logs - do they show the correct config?
2. If logs show correct config but window doesn't resize, there's a real bug
3. If logs are missing, the background service worker may have crashed

## Expected Time

This test should take **2-3 minutes** total. If it takes longer, something is wrong.

## Success!

If all three tests pass, the placement bug is fixed! 🎉

The console logs prove that:
1. Settings are saved when you change them in the UI
2. Settings are read correctly from storage
3. Settings are applied to the window positioning logic

This is exactly what was requested in the bug report.
