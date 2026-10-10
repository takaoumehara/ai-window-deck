# X / Bluesky

- X は 280 文字（日本語は全角 1 文字 = 2 カウントなので約 140 文字）、Bluesky は 300 文字。下の文面はどちらにも収まる長さです。
- X はリンク付きポストの表示が抑えられがちなので、リンクは**リプライ（返信）にぶら下げる**と伸びやすいです。Bluesky は本文にリンクを入れて問題ありません。
- GIF / 動画を付けると反応が大きく変わります。各ポストに添付素材を書いています。

リンク（リプライ用）:

```text
https://chromewebstore.google.com/detail/ai-window-deck/hnadegmlbljffcogkclppfdcaiijjcgc
```

---

## A. 課題共感

**A-1 EN** — 添付: `media/ai-window-deck-promo-en.mp4`

```text
The agents run in the cloud now. My laptop is quiet.

The new bottleneck: 5 Claude Code sessions, a preview, a PR, the docs, and me dragging Chrome windows around.

So I built a Chrome extension that opens the whole set tiled in one click.
```

**A-1 JP** — 添付: `media/ai-window-deck-promo-ja.mp4`

```text
重い処理は Claude Code や Codex がクラウドでやってくれる。Mac は静か。

なのに、セッション 5 つ＋プレビュー＋PR を手でちまちま並べ直す時間だけが残った。

保存した配置をワンクリックで全部タイル表示する Chrome 拡張を作りました。
```

**A-2 EN**

```text
"Which window was the API task again?"

If you run several agent sessions in parallel, name your windows. AI Window Deck puts the window name on its tab group, so every window is labeled.
```

**A-2 JP**

```text
「どのウィンドウで何のタスク動かしてたっけ？」

複数のエージェントを並行で回すなら、ウィンドウに名前を付けるのが一番効きます。AI Window Deck は各ウィンドウのタブグループに名前と色を付けて開きます。
```

---

## B. 操作デモ

**B-1 EN** — 添付: `docs/images/focus-preview-en-dark.gif`

```text
Tiles are great for watching. Too small for working.

⌥X: the window you're in grows (half, ¾, full height, full screen, or custom)
⌥X again: it snaps back to its tile

No dragging window edges.
```

**B-1 JP** — 添付: `docs/images/focus-preview-ja-dark.gif`

```text
タイル表示は「見張る」には最適、「作業する」には狭い。

⌥X → 作業中のウィンドウだけ拡大
もう一度 ⌥X（または ⌥Z）→ 元の枠にピタッと戻る

ウィンドウの端を掴んでリサイズする作業がなくなりました。
```

**B-2 EN** — 添付: `docs/images/register-paste-en-dark.gif`

```text
Setting up a workspace by asking your AI for it:

"List the sites I need for this project, one block per window."

Paste the answer into AI Window Deck. Each block becomes a window, and its URLs open as tabs.
```

**B-2 JP** — 添付: `docs/images/register-paste-ja-dark.gif`

```text
作業環境のセットアップは AI に頼むのが早い。

「このプロジェクトで使うサイトを、ウィンドウごとに空行で区切って出して」

その返答を AI Window Deck に貼るだけで、空行ごとに 1 ウィンドウ、URL はタブとして登録されます。
```

**B-3 EN** — 添付: `site/assets/img/05-focus-enlarge.png`

```text
Two ways to spotlight a window:

Grow in place: it expands from where it sits, so your eyes don't move
Center: it jumps to the middle of the screen

Pick one in step ③ of AI Window Deck.
```

---

## C. 構成レシピ

**C-1 EN** — 添付: `store-assets/listing/en/03-layout.png`

```text
My 4-slot layout for running two features at once:

1 Claude Code (API)
2 Codex (UI)
3 Vercel / localhost preview
4 GitHub PR + spec

Saved once. Opens tiled every morning in one click, tabs grouped and named.
```

**C-1 JP** — 添付: `store-assets/listing/ja/03-layout.png`

```text
「どのタブで何が動いてたっけ？」をなくす 4 枠レシピ

枠1 Claude Code（API・ロジック）
枠2 Codex（UI）
枠3 プレビュー（Vercel / localhost）
枠4 GitHub PR と仕様書

一度保存すれば、毎朝ワンクリックでこの陣形が立ち上がります。
```

**C-2 EN**

```text
Two monitors, two projects:

Left display: Project A deck (agent, preview, PR)
Right display: Project B deck

AI Window Deck lets you choose which display(s) a deck opens on. ⌥A re-tiles everything if windows drift.
```

**C-2 JP**

```text
モニター 2 枚で 2 プロジェクト並走。

左: プロジェクト A（エージェント・プレビュー・PR）
右: プロジェクト B

AI Window Deck はデッキを開くディスプレイを選べます。ウィンドウがずれたら ⌥A で全部並べ直し。
```

---

## D. 設計思想・プライバシー

**D-1 EN**

```text
Why a Chrome extension and not a new browser?

Signing in to GitHub again, redoing 2FA and reinstalling your password manager is a lot to ask for a tool that just arranges windows.

AI Window Deck opens ordinary Chrome windows in your profile. Everything else stays as it is.
```

**D-1 JP**

```text
なぜ専用ブラウザではなく Chrome 拡張なのか。

新しいブラウザに移ると、GitHub の再ログイン、二段階認証、パスワードマネージャーや拡張の入れ直しが待っています。

AI Window Deck は普段の Chrome プロファイルで通常のウィンドウを開くだけ。ログイン状態はそのままです。
```

**D-2 EN** — 本文にリンク: GitHub

```text
AI Window Deck permissions, in full:

tabs, tabGroups, storage, system.display

No host permissions. No content scripts. No network requests. No account. MIT licensed.

https://github.com/takaoumehara/ai-window-deck
```

**D-2 JP** — 本文にリンク: GitHub

```text
AI Window Deck が要求する権限はこれだけです。

tabs / tabGroups / storage / system.display

ページの中身は読まず、外部通信もなし、アカウントも不要。ソースは MIT で公開しています。

https://github.com/takaoumehara/ai-window-deck
```

---

## スレッド版（ローンチ日用、EN）

```text
1/ My AI coding moved to the cloud this year (Claude Code on the web, Codex). Laptop quiet, 4–5 projects in parallel.

The new bottleneck surprised me: arranging Chrome windows. 🧵
```

```text
2/ Every morning: open the same sessions, previews, PRs, docs. Drag them into place. Resize one whenever I need to read it. Resize it back.

So I built AI Window Deck.
```

```text
3/ Save a deck once: named windows, each with its URLs.
Lay them out on a canvas.
One click opens everything tiled, tabs grouped.
```

```text
4/ ⌥X enlarges the window you're in. ⌥X again and it snaps back to its tile.
```

（ここに `focus-preview-en-dark.gif` を添付）

```text
5/ Ordinary Chrome windows, so your sign-ins and extensions keep working. No account, no server, no tracking. Free, MIT, 8 languages.

https://chromewebstore.google.com/detail/ai-window-deck/hnadegmlbljffcogkclppfdcaiijjcgc
```

スレッドの 🧵 は X の慣習として入れています。不要なら消してください。
