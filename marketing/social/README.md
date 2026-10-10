# AI Window Deck — Social media kit

LinkedIn・Reddit・X / Bluesky にそのまま貼れる原稿と、投稿順・添付素材のまとめです。

| ファイル | 中身 |
| --- | --- |
| [linkedin.md](linkedin.md) | ローンチ投稿（EN / JP）と、フォローアップ 3 本 |
| [reddit.md](reddit.md) | サブレディットごとのタイトル・本文、コメント返信テンプレート |
| [x-bluesky.md](x-bluesky.md) | 短文ポスト（EN / JP）とスレッド |
| [calendar.md](calendar.md) | 4 週間の投稿カレンダー |
| `media/launch-clip-45s.mp4` | プロモ動画 100〜145 秒の切り出し（1920 × 1056、音声なし、1.5 MB）。8 枚の Claude Code ウィンドウが一斉にタイル表示される場面 |

## リンク（必ずこちらを使う）

| 用途 | URL |
| --- | --- |
| Web サイト | `https://ai-window-deck.vercel.app/` |
| Chrome Web Store | `https://chromewebstore.google.com/detail/ai-window-deck/hnadegmlbljffcogkclppfdcaiijjcgc` |
| GitHub | `https://github.com/takaoumehara/ai-window-deck` |

Gemini 案にあった `ai-window-deck-4w1e3txyn-...vercel.app` は Vercel のプレビュー URL で、デプロイごとに変わり、保護されている場合もあるので使わないでください。`chromewebstore.google.com/`（トップページ）も上の詳細ページに置き換えています。

流入元を見たい場合は Web サイトの URL に `?utm_source=linkedin` / `reddit` / `x` / `bluesky` を付けます（Vercel Analytics などで集計する場合のみ意味があります）。Reddit は UTM 付きリンクを宣伝っぽく感じる人がいるので、本文中は素の URL のままにしています。

## 添付素材

| 素材 | 向いている場所 |
| --- | --- |
| `media/launch-clip-45s.mp4` | LinkedIn、Reddit（動画投稿）、X（140 秒以内なのでそのまま可） |
| `docs/images/focus-preview-en-dark.gif` / `-ja-dark.gif` | X / Bluesky の Alt+X デモ。Reddit のコメント欄 |
| `docs/images/register-paste-en-dark.gif` / `-ja-dark.gif` | 一括登録（チャットの URL リストを貼るだけ）の紹介 |
| `store-assets/screenshots/01-arrange.png` 〜 `05-popup.png` | LinkedIn のカルーセル（PDF にまとめるとカルーセル表示になります） |
| `site/assets/img/05-focus-enlarge.png` | 「その場で拡大 / 中央に拡大」の比較 |
| `AI-window-deck-promo.mp4`（3 分 24 秒） | YouTube や Web サイト用。SNS には長すぎます |

切り出し動画は Chrome for Testing で撮ったため、各ウィンドウ上部に「Chrome for Testing … only for automated testing」のバーが写っています。気になる場合は通常の Chrome で撮り直してください。

## 書き方のルール

- 実際の機能だけを書きます。AI Window Deck は Chrome のウィンドウを並べる拡張で、計算をクラウドに逃がす機能はありません。「Mac が熱くならない」は Claude Code on the web / Codex をクラウドで動かす効果であって、この拡張の効果ではないので、そう読める書き方にしています。
- 一人称は「I / 私」。個人開発であることは Reddit でも LinkedIn でも好意的に受け取られます。
- プライバシーの主張は README・PRIVACY.md と同じ範囲に留めます（アカウントなし、サーバーなし、解析なし、ページ内容を読まない、外部通信なし）。
- ショートカットは README の既定値どおり：`Alt+X`（Mac では `⌥X`）で拡大 / 戻す、`Alt+Z` で元のタイルへ、`Alt+A` で並べ直し、`Alt+Q` で全画面。

## 自動投稿について

まずは手動投稿をおすすめします。

- **Reddit**: 同じ文面を複数サブレディットに自動投稿するとスパム判定されやすく、アカウントごと制限されることがあります。サブレディットごとに文面を変え、日をずらして手で投稿し、コメントに返信するのが一番効果的です。
- **LinkedIn**: 個人アカウントへの API 投稿には LinkedIn Developer アプリと `w_member_social` 権限の OAuth が必要です。週 1〜2 本なら手動の方が早いです。予約投稿は LinkedIn の投稿画面の時計アイコンからできます。
- **X / Bluesky**: 本数が増えてきたら自動化の価値があります。Bluesky はアプリパスワードだけで AT Protocol から投稿でき、X は API の有料プランが必要です。必要になったら `queue.json` と GitHub Actions の cron で組めます。
