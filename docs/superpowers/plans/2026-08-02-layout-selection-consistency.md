# Layout Selection Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure the selected layout card and custom even-grid controls always produce the same window geometry that the user sees in the UI.

**Architecture:** Move the pure layout catalogue and layout-state transitions into `layout-model.js`. `deck.js` will use this module to select and render layouts, while `background.js` continues to place the concrete `cells` on the active arrangement.

**Tech Stack:** Manifest V3, browser JavaScript, Node.js built-in test runner.

## Global Constraints

- Do not load code from the network or add dependencies.
- Preserve legacy saved presets that lack `layoutId`.
- Custom layout means an even columns-by-rows grid, not a free-form editor.
- Keep translations in `tools/strings.json`, then regenerate generated locale assets with `tools/build-i18n.py`.

---

### Task 1: Define and test the layout state model

**Files:**

- Create: `test/layout-model.test.js`
- Create: `layout-model.js`

**Interfaces:** `layout-model.js` exposes `globalThis.AIWindowDeckLayout` in Chrome and `module.exports` in Node. It provides `layouts`, `applyLayout(preset, id)`, `applyCustomGrid(preset, columns, rows)`, `applyBulkLayout(preset, count)`, and `selectedLayoutId(preset)`.

- [ ] Write a failing test that asserts `applyLayout(preset, "3-left")` creates three unequal cells, and `applyCustomGrid(preset, 3, 1)` clears them and sets `layoutId` to `custom`.
- [ ] Run `node --test test/layout-model.test.js` and verify that it fails because the module is absent.
- [ ] Implement the minimal pure layout model, including defensive cloning of cells.
- [ ] Run `node --test test/layout-model.test.js` and verify all layout-state tests pass.

### Task 2: Make the picker consume the model

**Files:**

- Modify: `deck.html`
- Modify: `deck.js`
- Modify: `tools/strings.json`
- Generated: `_locales/*/messages.json`, `strings.js`

- [ ] Add a failing test that bulk entry preserves a `5-center` layout's five cells.
- [ ] Run the test and verify it fails until bulk-layout preservation is implemented.
- [ ] Load `layout-model.js` before `deck.js`; use it for picker clicks, custom-grid changes, bulk-entry decisions, and previews.
- [ ] Change the visible copy to “Custom even grid” in all eight supported languages and regenerate localizations.
- [ ] Run `node --test test/layout-model.test.js && python3 tools/build-i18n.py`.

### Task 3: Validate, document, and publish

**Files:**

- Modify: `README.md`
- Modify: `verification.md`

- [ ] Document that shape cards open exactly as drawn, custom means an equal grid, and free-form uneven layouts are not yet supported.
- [ ] Run `node --test test/layout-model.test.js` and `node --check layout-model.js deck.js background.js`.
- [ ] Stage the complete initial repository, commit `fix: keep layout selection and placement in sync`, and push `main` to `takaoumehara/ai-window-deck`.
