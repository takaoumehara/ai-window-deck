# Canvas Workflow & First-run Guidance — Design

> Status: approved for implementation · 2026-08-07

## Goal

Let a knowledge worker construct a 1–16 window deck without losing an intentional layout: select a screen, select a count or common arrangement, then add registered window settings by drag and drop.

## Interaction contract

- Dropping a library card on canvas background appends one slot and applies the current responsive layout family.
- Dropping on an empty tile highlights that tile and replaces it without increasing the number of slots.
- Count supports 0–16. Zero is a truly blank canvas and still accepts background drops; the normal working range is 1–16.
- The compact gallery exposes only high-frequency families: Auto grid, vertical stack, horizontal row, and freeform. The number control supplies the normal range 1–16 plus an explicit 0 empty state; the gallery does not render sixteen visual cards.
- A chosen family survives count changes. For example, Stack + 4 becomes Stack + 5, not a generic grid. Explicit featured shapes remain intact while their count is unchanged; changing their count switches to the closest compatible family and records the operation in history.
- Freeform moves/resizes are never silently rewritten by a count change. Adding/removing in freeform produces an explicit auto-layout result only after the user selects a family or presses Equalize.
- Canvas history covers add, replacement, count changes, family selection, equalize, remove, move, and resize. It is local to the current UI session and supports undo/redo buttons.

## Bulk registration

After parsing valid bulk text, show a focused choice surface:

1. Save and auto-place: append the new records to the current canvas with the active layout family.
2. Save to Library: retain the current canvas and create/select a blank layout, where the user places cards deliberately.

## Display selection

Display miniatures share a common bounding board and preserve each display’s true `width / height` ratio. Selection is conveyed by state and checkmark; the non-actionable `Primary display` label is removed. The focused-screen label remains contextual, not a selection lock.

## First-run guidance

A dismissible, replayable three-step contextual guide appears only while no onboarding completion has been stored:

1. Choose display(s) for browser windows.
2. Choose a window count or a layout family.
3. Drag a saved window setting to the canvas.

Completion and Skip both persist; a compact “Guide” control replays it. The guide never blocks normal controls.

## Guardrails

- Preserve existing saved presets and legacy canvas slots.
- Do not add a third-party dependency.
- Keep the Ink/Cobalt, restrained operational visual language.
- Add pure-unit tests for layout-family and drop behavior; Chrome runtime interaction remains a manual verification item.
