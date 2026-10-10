# Reddit

Reddit は宣伝に厳しいので、LinkedIn とは書き方を変えています。

- **投稿前に各サブレディットのルール（サイドバー / Wiki）を必ず確認**してください。自作ツールの投稿を禁止していたり、特定の曜日・スレッド・フレア（flair）でしか認めていない場所があります。下の表の注意書きは目安で、ルールは変わります。
- 同じ文面を何か所にも同時に貼らない。1 日 1 サブレディット、文面も少しずつ変えます。
- タイトルに誇張や絵文字を入れない。「I built…」と事実を書くのが一番反応がいいです。
- 動画は Reddit に直接アップロード（Video 投稿）すると目に留まりやすいです。リンクは本文かコメントに入れます。
- 投稿後 2〜3 時間はコメントにすぐ返信します。最初の数時間の反応で表示順がほぼ決まります。
- 新しいアカウントや karma が少ないアカウントは自動で削除されやすいです。普段から関連スレッドにコメントしておくと安全です。

## 投稿先の候補

| サブレディット | 合うかどうか | 注意 |
| --- | --- | --- |
| r/ClaudeAI | ◎ Claude Code on the web のユーザーが多い | プロジェクト紹介用のフレアがあるか確認。Claude をどう使ったか（制作過程）を書くと受けがいい |
| r/ClaudeCode | ◎ ど真ん中の層 | 自作ツール投稿の可否を確認 |
| r/codex / r/OpenAI | ○ Codex ユーザー | r/OpenAI は宣伝に厳しめ。Codex 寄りに書き換える |
| r/chrome_extensions | ◎ 自作拡張の紹介が歓迎される | 特になし。フィードバックを求める形で |
| r/SideProject | ◎ 個人開発の紹介の場 | 作った経緯を中心に |
| r/webdev | ○ | 自作物の紹介は毎週土曜の「Showoff Saturday」のみ。タイトルに `[Showoff Saturday]` |
| r/ChatGPTCoding | ○ AI でコードを書く層 | プロジェクト紹介の可否・スレッドを確認 |
| r/productivity | △ | 宣伝の制限がかなり厳しい。後回しでよい |

---

## 1. r/ClaudeAI / r/ClaudeCode

形式: Video 投稿（`media/ai-window-deck-promo-en.mp4`）

**Title**

```text
I run 5+ Claude Code web sessions in parallel, so I built a Chrome extension to keep the windows from becoming a mess
```

**Body**

```text
Since Claude Code on the web runs everything in the cloud, my laptop stays cool and I can keep several projects going at once. The new problem was my screen: five sessions, a preview, a PR and the docs, and I kept losing track of which window was which and resizing them by hand.

So I built AI Window Deck. It's a free Chrome extension that:

- saves each window as a name plus the URLs to open as its tabs
- lets you arrange them on a canvas (grid, columns, one big window, freeform)
- launches them all at once, tiled on the monitor(s) you pick, tabs grouped by name
- Alt+X enlarges the window you're working in, and pressing it again puts it back in its tile

The windows are normal Chrome windows, so you stay signed in to claude.ai, GitHub, etc. No account, no server, no analytics, and it doesn't read page content.

Most of it was written with Claude Code; happy to talk about how that went.

Chrome Web Store: https://chromewebstore.google.com/detail/ai-window-deck/hnadegmlbljffcogkclppfdcaiijjcgc
Source (MIT): https://github.com/takaoumehara/ai-window-deck

Curious how others here handle many sessions at once. Separate Chrome profiles? Virtual desktops? Something else?
```

「Most of it was written with Claude Code」は事実と違えば消すか、実際の使い方に書き換えてください。r/ClaudeAI では制作過程の話が一番伸びます。

---

## 2. r/chrome_extensions

形式: Video 投稿、または画像投稿（`store-assets/listing/en/03-layout.png`）

**Title**

```text
I made a Chrome extension that saves a set of windows and opens them all tiled with one click (Alt+X to spotlight one)
```

**Body**

```text
AI Window Deck is a window manager for people who keep several sites open side by side. I built it for running multiple AI coding sessions (Claude Code, Codex), but it works for any set of windows.

How it works:
1. Register windows: a name and one or more URLs each. You can also paste a list of sites as text, and each block separated by a blank line becomes a window.
2. Drag them onto a 12 × 12 canvas and resize the slots.
3. Launch: every window opens on the display(s) you chose, tiled to match the canvas, with tabs grouped.
4. Alt+X enlarges the active window (half, three quarters, full height, full screen or custom). Alt+Z puts it back.

Permissions are only tabs, tabGroups, storage and system.display. No host permissions, no content scripts, no network requests. MV3, MIT licensed, 8 languages.

Store: https://chromewebstore.google.com/detail/ai-window-deck/hnadegmlbljffcogkclppfdcaiijjcgc
GitHub: https://github.com/takaoumehara/ai-window-deck

Feedback on the onboarding and the canvas especially welcome. It's the part I'm least sure about.
```

---

## 3. r/SideProject

形式: Video 投稿（`media/ai-window-deck-promo-en.mp4`）

**Title**

```text
My AI agents moved to the cloud, so my new bottleneck was arranging Chrome windows. I built a fix.
```

**Body**

```text
Background: I use Claude Code on the web and Codex for most of my coding now. Because they run remotely, I can keep 4–5 projects moving at the same time. But every morning I was opening the same sessions, previews and PRs and dragging them into place by hand, then resizing a window every time I needed to actually read something.

AI Window Deck is the Chrome extension I made for that:
- Save a "deck": named windows, each with its URLs
- Lay them out on a canvas once
- One click opens them all, tiled
- Alt+X to enlarge the window you're focused on, again to snap it back

What I learned building it:
- Chrome only lets an extension suggest 4 default shortcuts, so the rest are opt-in at chrome://extensions/shortcuts
- Keeping it as normal Chrome windows (instead of building a new browser) was the most important decision: I didn't want to sign in to GitHub, claude.ai and everything else again
- My site lists usually already live in a chat message, so pasting a whole message (each block = one window) became the fastest way to set up a deck

It's free and open source (MIT). No account, no tracking.

https://ai-window-deck.vercel.app/

Happy to answer questions about the build or the Chrome Web Store review.
```

「What I learned」は実際の体験があればそれに差し替えると、さらに反応がよくなります。

---

## 4. r/webdev（土曜のみ）

形式: Video 投稿

**Title**

```text
[Showoff Saturday] A Chrome extension that opens your dev workspace (agent sessions, preview, PR, docs) tiled in one click
```

**Body**

```text
I keep the same set of windows open every day: two AI coding sessions, a localhost or Vercel preview, the GitHub PR, and docs. AI Window Deck saves that set once and reopens it tiled on the monitor you choose. Alt+X enlarges the window you're working in and puts it back when you're done.

Small details web devs might like: localhost and IP addresses get http:// automatically, and local paths like /Users/me/site/index.html open as file:// tabs.

No account, no server, no content scripts. MIT.

https://github.com/takaoumehara/ai-window-deck
```

---

## 5. r/codex（Codex 寄りの書き換え）

**Title**

```text
Running several Codex cloud tasks at once? I built a Chrome extension to tile and spotlight the windows
```

本文は r/ClaudeAI 版の「Claude Code on the web」を「Codex」に、「claude.ai」を「chatgpt.com」に置き換えて使います。

---

## コメント返信テンプレート

よく来る質問への返し方です。コピペではなく、相手の言葉に合わせて少し変えてください。

**「Rectangle / Magnet / PowerToys FancyZones でよくない？」**

```text
Those are great and I still use one. The difference is that AI Window Deck knows which URLs belong in each window: it opens the whole set from scratch and tiles it, so there's nothing to arrange first. It also runs on any OS Chrome runs on, and the layout syncs with your Chrome profile.
```

**「専用ブラウザ（Arc など）のスペース機能と何が違う？」**

```text
It stays in your normal Chrome profile, so sign-ins, 2FA sessions, the password manager and other extensions just work. It's only a window arranger, not a new browser.
```

**「権限が怖い」**

```text
Fair question. It asks for tabs, tabGroups, storage and system.display only. No host permissions and no content scripts, so it can't read pages, and it makes no network requests. The full source is on GitHub, and PRIVACY.md lists exactly what is stored.
```

**「Firefox / Safari 版は？」**

```text
Chrome (and Chromium browsers) only for now. It relies on Chrome's tab groups and display APIs. If enough people ask I'll look into it.
```

Edge・Brave などで動くかは、事前に実機で確認してから答えてください。
