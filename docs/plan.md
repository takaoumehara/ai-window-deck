# キャンバス再整列と拡大設定 Implementation Plan

> Written by: superforge-dev · Last updated: 2026-08-07
> Status: in progress
> Upstream: docs/superpowers/specs/2026-08-07-spotlight-retile-design.md

**Goal:** キャンバス配置を起動済みウィンドウへ適用し、拡大サイズ・配置方法・ショートカット変更導線を提供する。

**Architecture:** バックグラウンドは受信したキャンバスセルを `tileWindows` に渡し、既存のセッション履歴を使って拡大前のタイル位置を保つ。React画面は設定を同期ストレージへ保存し、Chromeのショートカット設定への導線を持つ。

**Tech Stack:** Manifest V3, Chrome Windows API, React 18, Vite, Tailwind CSS, Node test runner

## Global Constraints

- 拡大開始前の最初のタイル位置・サイズを `Option+Z` の復帰先とする。
- `Option+X` と `Option+Z` のキー変更はChrome標準の設定画面でのみ行う。
- 既存の未コミット変更は保持して完成させる。

---

### Task 1: キャンバス再整列のメッセージ経路

**Files:**
- Modify: `background.js`
- Modify: `src/App.jsx`
- Modify: `src/components/WorkspaceCanvas.jsx`

**Proof:** `npm test && npm run build` が終了コード0。`tile` メッセージで受信した `preset.cells` とディスプレイ指定が `tileWindows` に渡る。

- [x] `tile` アクションをメッセージ全体とともに実行し、`targetDisplays`・`sameDisplayOnly`・`preset.cells` を保持する。
- [x] キャンバスの現在セルを12×12グリッドとして送信し、起動ボタンの直左から再整列を実行する。
- [x] ビルドを実行してReact側のプロパティ接続を確認する。

### Task 2: 拡大設定UIとショートカット導線

**Files:**
- Modify: `src/components/SpotlightConfig.jsx`
- Modify: `src/hooks/useExtensionState.js`
- Modify: `src/lib/i18n.js`

**Proof:** `npm run build` が終了コード0。すべての選択値が `spotlightSize` / `spotlightAnchor` / カスタム寸法として同期ストレージへ保存される。

- [x] サイズ候補に縦横半分、横半分・縦いっぱい、縦横3/4、画面いっぱい、縦だけいっぱい、カスタムを実装する。
- [x] カスタム選択時だけ幅・高さ（20〜100%）を表示し保存する。
- [x] 現在位置と中央配置を選択可能にし、ショートカットの説明とChrome設定ページを開くボタンを追加する。
- [x] 日本語・英語のUI文言を辞書へ追加する。

### Task 3: 拡大復元の保証とドキュメント同期

**Files:**
- Modify: `background.js`
- Modify: `docs/design.md`
- Modify: `docs/design.html`

**Proof:** `npm test && npm run build` が終了コード0。拡大履歴が最初のタイル位置を保持し、手動リサイズ後でも `restore-home` がスタック先頭へ戻す実装になっている。

- [x] `Option+X` と `Option+Z` の説明を実装どおりに整え、履歴の復帰先を明確化する。
- [x] デザイン仕様とスタイルガイドへSpotlight設定コンポーネントを追加する。
- [x] 全テストと本番ビルドを実行する。

## Progress log

- [x] Task 1
- [x] Task 2
- [x] Task 3

## Assumptions made

- ユーザーは実装後のChrome実機チェックを行う。自動検証はNodeテストとVite本番ビルドを行う。
