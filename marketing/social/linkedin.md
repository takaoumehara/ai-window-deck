# LinkedIn

LinkedIn では最初の 2〜3 行（約 210 文字）だけが「…もっと見る」の前に表示されます。どの投稿も冒頭の 2 行で要点が伝わるようにしています。

- 外部リンクを本文に入れるとリーチが落ちやすいので、リンクは投稿後すぐに**自分の最初のコメント**に貼ります（本文の最後に「Link in the first comment」）。
- 動画（`media/ai-window-deck-promo-en.mp4`、日本語投稿は `-ja.mp4`）を直接アップロードします。LinkedIn は自動再生が無音なので、音声なしの動画で問題ありません。
- ハッシュタグは 3 個まで。
- 英語版と日本語版は同じ日に出さず、2〜3 日あけます。

---

## 1. ローンチ投稿（EN）

添付: `media/ai-window-deck-promo-en.mp4`

```text
My laptop stays quiet now. The agents run in the cloud. The hard part moved to my screen.

Claude Code on the web and Codex run the heavy work on remote machines, so I can keep several projects going at once. What I didn't expect: the bottleneck became window management. Five sessions, a preview, a PR, the docs. I spent more time dragging and resizing Chrome windows than reading what the agents wrote.

So I built AI Window Deck, a free Chrome extension:

→ Save each window once: a name and the URLs that open as its tabs
→ Arrange them on a canvas (grid, columns, one large window, or freeform)
→ Launch: every window opens tiled on the display you choose, tabs grouped
→ Alt+X enlarges the window you're working in. Press it again and it snaps back to its tile

It opens ordinary Chrome windows, so your sign-ins, password manager and other extensions keep working. No account, no server, no analytics, and it never reads page content.

Available in 8 languages. Open source (MIT).

If you run several agent sessions in parallel, how do you keep track of them? I'd like to hear what works for you.

Link in the first comment.

#ClaudeCode #DeveloperProductivity #ChromeExtension
```

最初のコメント:

```text
Chrome Web Store: https://chromewebstore.google.com/detail/ai-window-deck/hnadegmlbljffcogkclppfdcaiijjcgc
Website: https://ai-window-deck.vercel.app/?utm_source=linkedin
Source: https://github.com/takaoumehara/ai-window-deck
```

---

## 2. ローンチ投稿（JP）

添付: `media/ai-window-deck-promo-ja.mp4`

```text
Mac のファンが静かになった代わりに、画面の上が忙しくなりました。

Claude Code on the web や Codex は重い処理をクラウドで動かしてくれるので、複数のプロジェクトを同時に進められます。ところが実際にやってみると、詰まるのは「ウィンドウの管理」でした。セッションが 5 つ、プレビュー、PR、仕様書。エージェントの出力を読むより、Chrome のウィンドウを掴んで並べ直している時間の方が長い。

そこで AI Window Deck という Chrome 拡張を作りました（無料）。

→ ウィンドウごとに名前と URL（タブとして開くもの）を一度だけ登録
→ キャンバス上に配置（グリッド、縦・横分割、1 枚を大きく、自由配置）
→ 起動すると、選んだディスプレイに全部タイル状に開き、タブもグループ化
→ ⌥X で作業中のウィンドウを拡大、もう一度押すと元の枠に戻る

開くのは普段どおりの Chrome ウィンドウなので、ログイン状態もパスワードマネージャーも他の拡張もそのまま使えます。アカウント不要、サーバーなし、解析なし、ページの中身は読みません。

8 言語対応、オープンソース（MIT）です。

複数のエージェントを並行で動かしている方、どうやって画面を整理していますか？ ぜひ教えてください。

リンクは最初のコメントに貼っています。

#ClaudeCode #生産性向上 #個人開発
```

最初のコメント:

```text
Chrome ウェブストア: https://chromewebstore.google.com/detail/ai-window-deck/hnadegmlbljffcogkclppfdcaiijjcgc
Web サイト: https://ai-window-deck.vercel.app/?utm_source=linkedin
GitHub: https://github.com/takaoumehara/ai-window-deck
```

---

## 3. フォローアップ: ワークスペースの構成例（EN）

添付: `store-assets/listing/en/03-layout.png`（または `store-assets/listing/en/` の 01〜05 を PDF にしてカルーセル）

```text
A layout I use to run two features in parallel without losing the thread:

Slot 1 — Claude Code on the web: API and data layer
Slot 2 — Codex: UI components
Slot 3 — Preview (Vercel or localhost)
Slot 4 — The GitHub PR and the spec

The rule I follow: the agents work in the cloud, and the screen only shows what I need to read or approve. Tiles for watching, one large window for editing.

I save this once as a deck. Next morning it opens in one click, tiled exactly the same way, with each window's tabs grouped by name.

What does your layout look like when you run more than one agent?

#AIAgents #DeveloperProductivity #ClaudeCode
```

---

## 4. フォローアップ: なぜ専用ブラウザではなく Chrome 拡張なのか（EN）

添付: `media/thumbnail-en.png`（タイル表示された通常の Chrome ウィンドウ）

```text
Why I built a Chrome extension instead of a new browser or desktop app.

Every new browser asks you to sign in to GitHub again, set up 2FA again, reinstall your password manager and rebuild your extensions. For a tool whose only job is to arrange windows, that cost is too high.

AI Window Deck opens ordinary Chrome windows in your existing profile. It needs four permissions: tabs, tab groups, storage and display sizes. No host permissions, no content scripts, no network requests, no account. Your settings sync between your own devices through Chrome Sync, if you use it.

Small scope, small attack surface. The source is on GitHub if you want to check.

#ChromeExtension #Privacy #OpenSource
```

---

## 5. フォローアップ: 一括登録（EN）

添付: `docs/images/register-paste-en-dark.gif`（LinkedIn は GIF も動画として再生されます）

```text
The fastest way to set up a workspace: ask your AI for it.

In AI Window Deck you can paste a list of sites, and each block separated by a blank line becomes a window. Ask Claude or ChatGPT "list the sites I need for X, grouped by window" and paste the answer straight in.

Since 1.11, lines that need attention turn red, with a Fix button. github.com becomes https://github.com, localhost gets http://, and local files open as file:// tabs.

#Productivity #ClaudeCode #ChromeExtension
```
