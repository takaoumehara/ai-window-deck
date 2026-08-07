# キャンバス再整列・空き枠ドロップ・拡大設定 — Verification

Mode: single-pass (grader = implementer)

> Written by: superforge-verify · Last updated: 2026-08-07
> Status: partial — automated checks passed; Chrome実機操作はユーザー確認待ち
> Upstream: docs/plan.md

## Automated checks

### Grade A — JavaScript syntax

Command:

```sh
node --check background.js
```

Output: command exited with code 0 and produced no output.

### Grade A — existing layout tests

Command:

```sh
npm test
```

Output:

```text
TAP version 13
# Subtest: an uneven layout keeps its concrete unequal cells
ok 1 - an uneven layout keeps its concrete unequal cells
# Subtest: custom even grid clears an uneven layout selection and cells
ok 2 - custom even grid clears an uneven layout selection and cells
# Subtest: bulk URL entry preserves a selected uneven layout
ok 3 - bulk URL entry preserves a selected uneven layout
# Subtest: bulk URL entry chooses an even layout when no uneven shape is selected
ok 4 - bulk URL entry chooses an even layout when no uneven shape is selected
# Subtest: computeDynamicLayout correctly computes grid for odd and even counts with blank and hero modes
ok 5 - computeDynamicLayout correctly computes grid for odd and even counts with blank and hero modes
1..5
# tests 8
# pass 8
# fail 0
# duration_ms 43.14775
```

### Grade A — production build

Command:

```sh
npm run build
```

Output:

```text
vite v6.4.3 building for production...
transforming...
✓ 1600 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.47 kB │ gzip:  0.32 kB
dist/assets/popup-B0GGhQ_O.css   30.02 kB │ gzip:  6.30 kB
dist/assets/popup-BHeAslaJ.js   246.84 kB │ gzip: 74.80 kB
✓ built in 1.16s
```

### Grade A — diff whitespace

Command:

```sh
git diff --check
```

Output: command exited with code 0 and produced no output.

## Derived conclusions

- Grade C, based on the production build: the React component graph compiles with the new Spotlight configuration and retile action wiring.
- Grade C, based on the Node syntax check: the packaged service-worker source parses after accepting the canvas-layout message.
- Grade A, based on `test/background.test.js`: a Deck-only retile updates only a window ID stored as a Deck launch; an extension settings window and an unrelated website window are not updated.

## 確認していないこと

- Chromeの拡張機能を再読み込みして、Deckから起動済みの実ウィンドウだけをキャンバス配置へ再整列する操作。
- `Option+X` での拡大／直前サイズの交互切替、手動リサイズ後の `Option+Z` 復元。
- 空きキャンバス枠が青くハイライトした状態でのドロップ置換と、背景へのドロップが分割を増やさないこと。
- 選択ディスプレイの実アスペクト比に沿ったSpotlightプレビューのアニメーション。
- `chrome://extensions/shortcuts` でのショートカット変更と、変更後の表示反映。
- 実ディスプレイ複数台での配置と、macOSのグローバルショートカット競合。

これらはユーザーがChrome実機で確認する方針である。
