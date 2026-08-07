# Canvas Workflow & First-run Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Support 0–16 canvas slots, append-vs-replace drops, durable layout families, local undo/redo, ratio-true display selection, bulk placement choice, and first-run guidance.

**Architecture:** Pure canvas operations live in `src/lib/canvas-layout.js`; `WorkspaceCanvas` renders controls and delegates mutations upward. `App` owns persisted preset slots and history, while small focused components own bulk-choice and guide presentation.

**Tech Stack:** React 18, Tailwind CSS, Vite, Chrome extension storage, Node test runner.

## Global Constraints

- Keep saved slot coordinates intact unless the user chooses an auto family or Equalize.
- Background canvas drops append; empty-slot drops replace.
- Use no new dependencies.
- Use 0–16 as the supported count range.

### Task 1: Pure layout and history operations

**Files:** Create `src/lib/canvas-layout.js`; create `test/canvas-layout.test.js`.

- [x] Test `slotsWithCount(4, "stack")` creates four equal-height full-width tiles and `slotsWithCount(9, "grid")` creates 3×3 tiles.
- [x] Test `appendSlot([], item, "grid")` returns one linked tile and `replaceSlot(slots, index, item)` preserves the target coordinate and length.
- [x] Implement pure operations and run `node --test test/canvas-layout.test.js`.

### Task 2: Canvas controls and drop paths

**Files:** Modify `src/components/WorkspaceCanvas.jsx`, `src/components/WindowsSidebar.jsx`, `src/lib/i18n.js`.

- [x] Render compact family controls and Undo/Redo beside the count input.
- [x] Route background drops to append and empty-tile drops to replacement; keep target highlight.
- [x] Preserve freeform slots until an explicit family/equalize action.

### Task 3: App persistence and bulk choice

**Files:** Modify `src/App.jsx`, `src/components/RegisterModal.jsx`; create `src/components/BulkPlacementChoice.jsx`.

- [x] Persist family metadata with the active preset and maintain bounded in-memory history.
- [x] Present auto-place/library-only choice after bulk parsing.
- [x] Library-only creates/selects an empty preset and leaves the previous preset unchanged.

### Task 4: Display selector and onboarding

**Files:** Modify `src/components/DisplaySelector.jsx`, `src/hooks/useExtensionState.js`, `src/lib/i18n.js`; create `src/components/OnboardingGuide.jsx`.

- [x] Draw screen miniatures on a common scale and remove the primary-display chip.
- [x] Store guide completion and provide a replay control.
- [x] Render a non-blocking three-step guide with Skip and Done.

### Task 5: Verify

**Files:** Modify `docs/superforge-log.md`.

- [x] Run `npm test`, `npm run build`, and `git diff --check`.
- [x] Record the implementation and manual Chrome checks still required.
