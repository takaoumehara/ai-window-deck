# Canvas Drop & Spotlight Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** デッキ起動済みウィンドウだけを安全に再整列し、空きキャンバス枠への置換ドロップと画面比率に沿った拡大プレビューを提供する。

**Architecture:** `background.js` はデッキ起動時のウィンドウIDをセッションに記録し、そのIDだけを再整列する。React側は空きスロットを明示的なドロップターゲットにし、Spotlightプレビューは現在のキャンバスセルを選択ディスプレイ比率の縮小画面に再現する。

**Tech Stack:** Manifest V3, Chrome Windows/Tab Groups APIs, React 18, Vite, Tailwind CSS, Node test runner

## Global Constraints

- 再整列は新規ウィンドウを作成しない。
- 拡張自身のページは開いているウィンドウ一覧と再整列対象に含めない。
- ドロップ対象は空きキャンバススロットのみで、分割数を増やさない。

---

### Task 1: デッキ限定のウィンドウ一覧と再整列

**Files:**
- Modify: `background.js`
- Modify: `src/App.jsx`
- Modify: `src/components/WindowsTab.jsx`

**Proof:** `tile` に `deckOnly: true` を渡すと、`chrome.windows.create` を呼ばず、記録済みIDの正常ウィンドウだけを配置する。`windowList` は拡張URLのウィンドウを返さず、グループ名をタイトルとして返す。

- [x] 起動済みDeckウィンドウIDを `chrome.storage.session` に保存する。
- [x] Deck限定の並べ直しと、拡張ページ除外を実装する。
- [x] `WindowsTab` を `windowList` メッセージのデータ表示へ切り替える。

### Task 2: 空き枠へのドロップ置換

**Files:**
- Modify: `src/components/WorkspaceCanvas.jsx`
- Modify: `src/App.jsx`
- Modify: `src/lib/i18n.js`

**Proof:** URLなしの枠にだけ `dragover` ハイライトが出る。そこへドロップすると同じ枠ID・座標のまま登録済みウィンドウの名前と全URLが保存され、キャンバスの件数は変わらない。

- [x] 空き枠判定と、対象スロットごとの `dragover` / `drop` を実装する。
- [x] キャンバス背景へのドロップによる追加を削除し、説明通知を表示する。
- [x] ハイライト状態をドラッグ終了・ドロップ時に確実に解除する。

### Task 3: 表示比率を反映したSpotlightプレビュー

**Files:**
- Create: `src/components/SpotlightPreview.jsx`
- Modify: `src/components/SpotlightConfig.jsx`
- Modify: `src/App.jsx`
- Modify: `src/index.css`
- Modify: `src/lib/i18n.js`

**Proof:** `npm run build` が終了コード0。サイズ・アンカーを切り替えると、選択画面のアスペクト比と現在の分割数を保つプレビュー内で対象枠がアニメーションする。

- [x] 現在のスロット配置とディスプレイ比率から、縮小画面プレビューを描画する。
- [x] 選択サイズとアンカーをプレビュー座標に変換する。
- [x] `prefers-reduced-motion` ではアニメーションを止める。

### Task 4: Build and verification

**Files:**
- Modify: `docs/verification.md`

**Proof:** `node --check background.js && npm test && npm run build && git diff --check` が終了コード0。

- [x] 全自動検証を実行し、出力と未確認のChrome実機操作を記録する。
