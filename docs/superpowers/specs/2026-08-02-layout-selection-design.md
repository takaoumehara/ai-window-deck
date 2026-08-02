# Layout selection consistency design

## Goal

Make the layout shown as selected in AI Window Deck identical to the layout used when windows are opened or re-tiled. Preserve the existing uneven shape cards and retain a clearly named custom **even-grid** option.

## Problem

The extension currently persists three overlapping pieces of layout state: `shape`, `cells`, and `columns`/`rows`. The picker renders its selection from `shape`, but the background worker lays out windows from `cells`. Bulk URL entry and changing the custom grid can clear or replace `cells` without clearing `shape`, so the UI can show an uneven shape while the actual layout is an even grid.

## Decisions

1. A single `layoutId` is the selected layout's source of truth.
2. Built-in uneven layouts own their `cells`; the background worker receives those cells as the placement instructions.
3. “Custom” becomes “Custom even grid.” Changing its columns or rows clears any uneven shape.
4. Selecting a built-in card updates the selected ID, dimensions, and cells together.
5. Bulk URL entry preserves a selected uneven layout. For even/custom layouts it chooses an appropriate even grid for the number entered.
6. The layout preview and slot diagrams use the same cells used by placement.

## Out of scope

Arbitrary uneven layouts are not included. A true free-form layout editor needs grid-cell merge/split and collision validation, and must be a separate feature. The custom even grid will not be presented as a free-form shape editor.

## Compatibility

Saved configurations without `layoutId` remain usable. The UI derives a reasonable selection from legacy `shape`, `cells`, or dimensions, and writes `layoutId` on the next user layout change.

## Validation

Node's built-in test runner will cover: selecting an uneven layout, changing to a custom even grid, preserving an uneven layout during bulk entry, and choosing an even grid when no uneven layout is selected. The project has no existing package manager or browser test setup, so syntax validation and an extension load check supplement the Node test.
