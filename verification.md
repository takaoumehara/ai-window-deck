# AI Window Deck — 動作検証レポート

## 2026-08-02: レイアウト選択の一致

不均等なレイアウト選択、カスタム均等分割への切り替え、URL一括貼り付け時の形状維持は、Node標準テストで検証する。

```
node --test test/layout-model.test.js
node --check layout-model.js deck.js background.js
```

このテストは、UIの選択状態と実際に配置へ渡すセル定義が別々にならないことを確認する。

- 対象: `docs/AI-window-deck/` v1.4.0（リポジトリ直下の出荷版 "AI Multi Window Launcher 1.0.0" とは別物）
- 実施日: 2026-08-01
- 環境: macOS 26.6 (arm64) / Google Chrome for Testing 150.0.7871.24 を Playwright 1.58 でロード
- 判定: **合格**（v0.1.0 は起動不能だった。原因と修正、及び追加機能の実測を以下に記録）

## 0. v0.3.0 で判明した Chrome API の落とし穴（最重要）

**`chrome.windows.update()` に `state` と座標を同時に渡すと、座標が捨てられる。**
Chrome は state の変更を「復元」として扱い、そのウィンドウが記憶しているサイズを
当て直すため、同じ呼び出しに含めた `left/top/width/height` が無効になる。

さらに **生成直後のウィンドウはしばらく落ち着かず、その間に指定した座標は
Chrome の既定サイズで上書きされる。** 4通りの手順を実測で比較した。

```
$ node /tmp/awd-probe2.mjs <docs/AI-window-deck>   # 3ウィンドウ、目標 1276x701
strategy A (create に座標を渡すだけ)              : 1282x846, 1282x846, 1282x846  FAIL
strategy B (create 後すぐ座標だけ update)          : 1276x701, 1276x701, 1282x846  FAIL
strategy C (600ms 待ってから座標だけ update)       : 1276x701, 1276x701, 1276x701  PASS
strategy D (400ms 待って2回当て直す)               : 1276x701, 1276x701, 1276x701  PASS
```

A が全滅、B は最後に作ったウィンドウだけ落ちる。採用したのは D。
この発見に合わせて、整列・スポットライトの復帰でも `state` と座標を別々の
呼び出しに分けた。以前のコードは両方を同時に渡しており、たまたま通っていた。

配置先の判断: 本レポートは `docs/verification.md` ではなく検証対象と同じ
`docs/AI-window-deck/` に置いた。`docs/` 配下には別プロジェクトの成果物も
混在しており、どの拡張の検証かを取り違えないため。

---

## 1. 最初に見つかった致命的な不具合（修正済み）

ファイル名が2か所ずれており、**そのままでは Chrome に読み込めなかった**。

| 参照している場所 | 参照名 | 当時の実ファイル名 | 影響 |
|---|---|---|---|
| `manifest.json` | `attention.js` | `aattention.js` | 拡張全体がロード失敗（致命） |
| `popup.html` | `popup.css` | `popus.css` | ポップアップが無スタイル表示 |

```
$ node /tmp/awd-verify.mjs <docs/AI-window-deck> original
[original] service worker: NOT REGISTERED
[original] extension failed to load — aborting further checks
```

CSS 名だけを誤らせた中間パターンでは拡張自体は起動し、スタイルだけが落ちた。
つまり致命的だったのは `manifest.json` 側の参照。

```
$ node /tmp/awd-variant.mjs /tmp/awd-cssonly css-broken
[css-broken] service worker: registered
[css-broken] popup failed subresource requests: ["popup.css -> net::ERR_FILE_NOT_FOUND"]
[css-broken] popup body width (340px = styled, else unstyled): 1264px
```

2ファイルをリネームして解消。ロジック側の欠陥ではなかった。

## 2. 現在のビルドの静的チェック

```
$ python3 -c "import json; json.load(open('manifest.json'))"
manifest.json: valid JSON

$ for f in background.js popup.js attention.js keys.js i18n.js strings.js; do node --check $f; done
background.js: syntax OK
popup.js: syntax OK
attention.js: syntax OK
keys.js: syntax OK
i18n.js: syntax OK
strings.js: syntax OK
```

テストスイート・リンター・型チェックはこのプロジェクトに存在しないため該当項目は
未実施（不在を確認済み）。振る舞いの検証は下記の Playwright ハーネスで代替した。

## 3. ロードとポップアップ

```
$ node /tmp/awd-verify.mjs <docs/AI-window-deck> v2
[v2] service worker: chrome-extension://.../background.js
[v2] popup stylesheets: [".../popup.css rules=47"]
[v2] popup body width: 360px
[v2] "tile" message round-trip: response={"ok":true} lastError=none
```

配布ZIPを展開したものも同じく起動し、全機能が動作した（パッケージの入れ忘れ検出）。

```
$ unzip -q AI-Window-Deck-v0.2.0.zip -d /tmp/awd-zipcheck && node /tmp/awd-ui.mjs /tmp/awd-zipcheck
hero shortcut text : "Control + Shift + Space"
...
page errors: none
```

## 4. 整列（tile）

```
$ node /tmp/awd-windows2.mjs <docs/AI-window-deck>
BEFORE tile: 4 windows overlapping at 1282x846
AFTER tile : [{"left":0,"top":30,"width":634,"height":1410},{"left":642,...},
              {"left":1284,...},{"left":1926,...}]
overlapping pairs after tile (0 = correct grid): 0
focus-next: 1797740200 -> 1797740202 (changed: true)
storage after slider=2: {"columns":2}
AFTER tile with columns=2: 4 windows at 2 distinct x positions, 1276x701
distinct columns observed (expect 2): 2
```

フォーカス中ウィンドウがあるディスプレイの `workArea` を選択している。列数設定は
`chrome.storage.sync` に保存され次回の整列に反映される。

## 5. スポットライトの大きさと着地点（v0.2.0 の新機能）

期待値はテスト側で仕様から独立に計算し、実測値と突き合わせた。

```
$ node /tmp/awd-modes.mjs <docs/AI-window-deck>
workArea: {"height":1410,"left":0,"top":30,"width":2560}
full          -> state=maximized PASS
full restore  -> {"state":"normal","left":40,"top":70,"width":700,"height":500} PASS
tall/keep     -> got {"left":0,"top":30,"width":1280,"height":1410}
                 want {"left":0,"top":30,"width":1280,"height":1410} PASS
                 restore PASS
tall/center   -> got {"left":640,"top":30,"width":1280,"height":1410}    PASS  restore PASS
half/keep     -> got {"left":0,"top":30,"width":1280,"height":705}       PASS  restore PASS
half/center   -> got {"left":640,"top":383,"width":1280,"height":705}    PASS  restore PASS
custom/keep   -> got {"left":0,"top":30,"width":1536,"height":1128}      PASS  restore PASS
custom/center -> got {"left":512,"top":171,"width":1536,"height":1128}   PASS  restore PASS
corner clamp  -> {"left":1280,"top":735,"width":1280,"height":705} PASS (stays on screen)

all spotlight modes pass
```

`corner clamp` は、画面の右下隅にあるウィンドウを広げても画面外へはみ出さないこと
（`keep` の引き戻し処理）の確認。

## 6. 通知（attention）

コンテンツスクリプトが実際にページへ注入されていることを CDP の実行コンテキストで確認:

```
[release] execution contexts on the page: [..., {"name":"AI Window Deck",
        "origin":"chrome-extension://..."}]
[release] content script injected: true
```

`attention.js` のロジック（非表示ページの DOM 変化 → 2.5 秒静止 → 通知送信）を、
強制的に `document.hidden = true` にした文書で単体実行:

```
attention.js logic under hidden document -> message sent: {"sent":{"type":"attention"}}
```

バッジの一生:

```
$ node /tmp/awd-attention5.mjs <docs/AI-window-deck>
1. badge at start                          : ""
2. badge after attention (expect "1")      : "1"
3. badge after visiting the tab (expect ""): ""
4. badge with attention=false (expect "")  : ""
5. badge with attention=true  (expect "1") : "1"
6. badge with two flagged tabs (expect "2"): "2"
```

未確認: 実タブ切り替えによる `document.hidden` の遷移は、CDP 接続下のページが常に
visible 扱いになる自動化上の制約で E2E 再現できず、ロジック単体＋注入確認＋背景
ハンドラの3点で代替した。実機での目視確認が残っている。

## 7. Service Worker が停止しても状態が壊れないこと

MV3 の Service Worker を CDP で明示的に停止し、イベントで起こし直して確認した。

```
$ node /tmp/awd-swrestart2.mjs <docs/AI-window-deck>
badge with two flagged tabs : "2"
session storage             : {"attentionTabs":[699674434,699674435]}
worker stopped, live worker? : "<no live worker>"
session storage after restart: {"attentionTabs":[699674435]}
badge after restart + visiting one flagged tab: "1"
```

件数が `2 → 1` と正しく減っている。当初のメモリ上の `Set` / `Map` 実装なら
空になり `""` になる場面で、`chrome.storage.session` へ移したことで保たれている。

なお「復帰位置」については、仮に保存が失われても `{state:"normal"}` のみで
Chrome 自身が最大化前の座標へ戻すことを実測済みで、二重の安全がある。

```
$ node /tmp/awd-restore.mjs
bounds before maximize : {"left":300,"top":200,"width":800,"height":600}
bounds after state-only restore (no saved bounds): {"left":300,"top":200,"width":800,"height":600}
Chrome restores them by itself: true
```

## 8. ショートカット表示・変更・多言語

```
$ node /tmp/awd-ui.mjs <docs/AI-window-deck>
hero shortcut text : "Control + Shift + Space"
tile shortcut text : "Control + Shift + 8"
next shortcut text : "Control + Shift + Right"
shortcut list      : ["Enlarge / restore","Control + Shift + Space ⌃⇧Space",
                      "Re-tile","Control + Shift + 8 ⌃⇧8",
                      "Next window","Control + Shift + Right ⌃⇧→",
                      "Open this panel","Not set"]

auto (browser en-US): "Enlarge this window"
ja                 : "いまの画面を大きく"  | html lang = ja    | 大きく／元に戻す
de                 : "Fenster vergrößern" | html lang = de    | Vergrößern / Zurück
ko                 : "이 창 크게 보기"      | html lang = ko    | 확대/복원
zh-CN              : "放大当前窗口"         | html lang = zh-CN | 放大/还原

size=full  -> custom hidden: true  | anchor hidden: true
size=custom-> custom hidden: false | anchor hidden: false
size=half  -> custom hidden: true  | anchor hidden: false

storage: {"language":"ja","spotlightAnchor":"center","spotlightSize":"half"}
after reload, language select = ja | size = half | anchor = center

tabs after clicking "change shortcuts": [".../popup.html","chrome://extensions/shortcuts"]
opened chrome://extensions/shortcuts: true

page errors: none
```

表示されるキーは `chrome.commands.getAll()` の実値なので、ユーザーが
`chrome://extensions/shortcuts` で変更すればポップアップの表示も追随する。
Chrome が返す表記は macOS が `⌃⇧Space`、Windows/Linux/ChromeOS が
`Ctrl+Shift+Space` と異なるため、両形式を解釈して言葉へ展開している
（`keys.js`）。実測で確認した Chrome の戻り値:

```
[{"name":"toggle-spotlight","shortcut":"⌃⇧Space"},
 {"name":"tile-windows","shortcut":"⌃⇧8"},
 {"name":"focus-next","shortcut":"⌃⇧→"},
 {"name":"_execute_action","shortcut":""}]
platform signals: {"uaDataPlatform":"macOS","platform":"MacIntel"}
```

## 9. アクセシビリティ

`superforge-a11y` の完全なゲートは未実行（`docs/accessibility.md` は無い）。
以下は機械的に検証できる範囲の実測であり、Level A/AA の全項目を通したものではない。

**コントラスト（WCAG 1.4.3）** — 想定値ではなく、文字を透明にしたレンダリング結果を
スクリーンショットして背景の実ピクセルを取り、各テキストの最悪ピクセルとの比を計算した。

```
$ node /tmp/awd-contrast.mjs <docs/AI-window-deck> ja   # 38 text runs + background plate
$ python3 <analyse>
WCAG 1.4.3 AA: 38/38 text runs pass
最小値 5.32（ヒーローボタン上の白文字「いまの画面を大きく」）
```

v0.1.0 では以下が不足しており、すべて修正した。

| 要素 | 修正前 | 修正後 |
|---|---|---|
| サブタイトル 11px | 4.26 | 5.88 |
| 列数の値 | 4.09 | 5.65 |
| トグル補足 | 3.56 | 6.09 |
| フッター | 3.37 | 6.08 |
| ヒーローの白文字（緑端） | 1.86 | 5.32 |
| ヒーローの `kbd` | 1.86 | 5.51 |

ヒーロー内の小さい文字は当初 `opacity:.9` を掛けており、実測 4.54 と AA を
0.04 しか上回らなかったため不透明度を外した。

**キーボード操作** — 全コントロールが Tab で到達でき、フォーカスリングが出る。

```
focusable controls: ["spotlight","tile","next","columns",
                     "input[size]"x4,"input[anchor]"x2,
                     "attention","language","editShortcuts"]
focus ring on #tile: {"outlineStyle":"solid","outlineWidth":"2px","outlineColor":"rgb(91,79,208)"}
```

大きさ・着地点の選択肢はネイティブの `radio` を `fieldset`/`legend` で束ねており、
矢印キーでの移動とグループ名の読み上げが標準のまま得られる。装飾グリフには
`aria-hidden` を付けた。`prefers-reduced-motion` でホバーの移動を止めている。

未評価: スクリーンリーダーでの実読み上げ、フォーカス順の妥当性の主観評価、
拡大表示（1.4.4 / 1.4.10）。

## 10. ストア提出に関わる修正

- アイコン（16/32/48/128）を追加。`tools/make-icons.py` で再生成できる。
  当初の淡いグラデーションは明るいツールバーで沈んだため、ヒーローと同じ濃い
  ランプへ変更した。
- `host_permissions: ["<all_urls>"]` を削除。コンテンツスクリプトの `matches` で
  注入は足り、この拡張は fetch も `executeScript` も使わないため、審査で説明を
  求められる範囲を広げていただけだった。
- `background.js` が全メッセージで `return true` を返しながら `attention` では
  `sendResponse` を呼ばず、送信側の Promise が永久に未解決だった問題を修正。
  修正前 `NEVER SETTLED - message port left open` → 修正後 `resolved`。
- README が実在しない ZIP の場所を書いていた点を修正し、`tools/package.sh` を追加。

## 11. 三ペルソナ通し

- **初回・急いでいる** — v0.1.0 では「読み込んでも何も起きない」で離脱していた。
  現在はポップアップの「並べ直す」で即座に結果が見え、ショートカットが記号ではなく
  言葉で書かれているため、次に何を押せばいいかが分かる。離脱点なし。
- **慣れた常用者** — 離脱しない。大きさを「縦いっぱい・横半分」にしておけば、
  8分割から一段だけ広げる用途が1キーで済む。設定はすべて同期ストレージに残る。
- **懐疑的・慎重** — 主な離脱点だった過剰な権限要求は解消した。残る確認事項は
  「すべてのサイトにコンテンツスクリプトを注入する」点で、これは通知機能の実装上
  必要。ポップアップから機能自体をオフにできるが、初回に理由を一行示す導線は未実装。

## 12. v0.3.0 の追加機能

### 設定ページ（2タブ）と一括起動

```
$ node /tmp/awd-options.mjs <docs/AI-window-deck>
-- tabs --
initial : {"arrange":"true","resize":"false","arrangeVisible":true,"resizeVisible":false}
resize  : {"arrange":"false","resize":"true","arrangeVisible":false,"resizeVisible":true}

-- layout pattern drives the slot count --
4x2 -> slots=8, preview cells=8
2x2 -> slots=4, preview cells=4
3x3 -> slots=9, preview cells=9

-- typed URLs survive a layout change and a reload --
stored slots: ["https://claude.ai\nhttps://github.com","https://chatgpt.com","","https://gemini.google.com"]
after reload: ["https://claude.ai\nhttps://github.com","https://chatgpt.com","","https://gemini.google.com"]

-- launch --
windows before=1 after=4
status message: "Opened"
   {"left":0,"top":30,"width":1276,"height":701,"tabs":["https://claude.ai/login","https://github.com/"]}
   {"left":1284,"top":30,"width":1276,"height":701,"tabs":["https://chatgpt.com/"]}
   {"left":0,"top":739,"width":1276,"height":701,"tabs":["https://gemini.google.com/app"]}

-- empty launcher --
status with no URLs: "No window has a URL yet"
page errors: none
```

空欄のウィンドウは起動されず（4枠中3枠に入力 → 3ウィンドウ）、1枠に複数URLを
書いた場合はそのウィンドウのタブになっている。残る重なりは設定ページ自身の
ウィンドウで、一括起動が新規ウィンドウだけを対象にする設計どおり。

### 整理（並べ直す）の順序と最小化の扱い

ID順と見た目の並び順がわざと食い違うように4ウィンドウを配置して検証した。

```
$ node /tmp/awd-tidy.mjs <docs/AI-window-deck>
created in id order   : D, C, B, A  (placed so reading order is A, B, C, D)
keepOrder=true  -> reading order after tiling: A, B, C, D
keepOrder=false -> reading order after tiling: D, C, B, A

skipMinimized=true  -> window D state: {"state":"minimized"} PASS (left alone)
skipMinimized=false -> window D state: normal PASS (pulled into the grid)
```

既定（keepOrder=true）では、整列後も見た目の並び順が保たれる。オフにすると
ウィンドウIDの順になり、並びが入れ替わることが確認できる。

### アクセシビリティ（実ピクセル計測）

```
$ node /tmp/awd-contrast.mjs <dir> ja options.html && python3 /tmp/awd-analyse-contrast.py 900 "options.html (ja)"
options.html (ja): 39 text runs measured against rendered pixels
WCAG 1.4.3 AA: all pass   (lowest 5.52)

options.html (de): 39 text runs measured against rendered pixels
WCAG 1.4.3 AA: all pass   (lowest 5.43)

popup.html  (ja): 15 text runs measured against rendered pixels
WCAG 1.4.3 AA: all pass   (lowest 5.48)
```

計測手法の補正: 当初は文字の外接矩形の「最悪ピクセル」を採っていたが、矩形には
隣接するコントロールの枠線（`#8f88a3`）やチェックボックスの色（`#2a7f74`）が
数ピクセル混入し、実際には白背景の文字が 1.08 などと誤判定された。背景として
成立しない外れ値を落とすため、ピクセルごとの比の下位10%を切り捨てた値で判定して
いる（`/tmp/awd-analyse-contrast.py`）。

### 配布ZIP

v0.3.0 のZIPを展開してロードし、タブ切り替え・設定・一括起動が動作することを確認済み
（34ファイル / 75KB）。

## 13. v0.4.0 の追加機能

### 縦だけいっぱい・Undo・前の画面

```
$ node /tmp/awd-v4.mjs <docs/AI-window-deck>
== full-height-only mode: width must not change ==
  before: {"left":200,"top":230,"width":760,"height":500}
  after : {"left":200,"top":30,"width":760,"height":1410}
width unchanged                        PASS 760 -> 760
height fills the work area             PASS 1410 vs 1410
top at work area top                   PASS
second press restores                  PASS

== undo after tiling ==
tiling moved the windows               PASS
undo put every window back             PASS {"ok":true,"restored":4}
  before  : [{"left":300,"top":330,...},{"left":900,"top":290,...},{"left":500,"top":730,...}]
  restored: [{"left":300,"top":330,...},{"left":900,"top":290,...},{"left":500,"top":730,...}]

== undo stack is finite and reports emptiness ==
undo eventually reports nothing to undo PASS {"ok":false,"reason":"empty"}

== previous / next focus ==
next moves focus                       PASS
prev comes back to where it started    PASS 1851531201 -> 1851531205 -> 1851531201

== commands registered ==
[{"name":"focus-next","shortcut":"⌃⇧→"},{"name":"focus-previous","shortcut":"⌃⇧←"},
 {"name":"tile-windows","shortcut":"⌃⇧8"},{"name":"toggle-spotlight","shortcut":"⌃⇧Space"},
 {"name":"undo-layout","shortcut":""}]
focus-previous exists                  PASS
undo-layout exists (no default key)    PASS
```

`undo-layout` にキーが無いのは実装漏れではなく、Chrome の
「既定キーを持てるコマンドは4つまで」という制限による意図的な選択。

### 複数モニターの指定（実機2画面で検証）

報告された2つの症状——「左の画面にブラウザを置いているのに起動が右へ行く」
「右の画面のものだけ整理したいのに全部動く」——を再現する形で検証した。

```
$ node /tmp/awd-displays.mjs <docs/AI-window-deck>
LEFT  display id 2 {"height":1410,"left":0,"top":30,"width":2560}
RIGHT display id 3 {"height":1410,"left":2560,"top":30,"width":2560}

== launch lands on the pinned display, not the focused one ==
  launched: [{"left":0,"top":30,...},{"left":1284,"top":30,...}]
all launched windows on the pinned LEFT display PASS

== tiling only touches the pinned display ==
windows parked on the other display untouched  PASS
  right before: [{"left":2680,"top":150,...},{"left":2740,"top":150,...}]
  right after : [{"left":2680,"top":150,...},{"left":2740,"top":150,...}]

== turning the guard off tiles everything ==
with the guard off, they are pulled in         PASS
and they end up on the pinned LEFT display     PASS
```

右の画面のウィンドウにフォーカスを当てた状態で起動しても、指定した左の画面に
出ることを確認している（以前は「フォーカス中のウィンドウがある画面」しか
選べず、設定ページを別モニターで開いていると起動先がそちらになっていた）。

### Chrome Split View の拡張APIを実機確認

サブエージェントの調査結果を、実際の Chrome for Testing 150 で裏取りした。

```
$ node /tmp/awd-splitview.mjs <docs/AI-window-deck>
{
  "chromeVersion": "150.0.0.0",
  "splitViewIdOnTab": -1,
  "SPLIT_VIEW_ID_NONE": -1,
  "tabsMethodsMentioningSplit": ["SPLIT_VIEW_ID_NONE"],
  "windowsMethodsMentioningSplit": [],
  "canQueryBySplitViewId": "ok, 1 tabs"
}
```

読み取り専用の `splitViewId` と定数 `SPLIT_VIEW_ID_NONE` は実在し、
`chrome.tabs.query({splitViewId})` も通る。一方で分割を作る・解く・比率を変える
メソッドは `chrome.tabs` にも `chrome.windows` にも存在しない。つまり
Split View の上にショートカット駆動の拡大/復元を実装することは現状できない。

### アクセシビリティ

```
options.html (ja): 48 text runs — WCAG 1.4.3 AA all pass (lowest 5.38)
popup.html  (ja): 20 text runs — WCAG 1.4.3 AA all pass (lowest 5.48)
```

### 配布ZIP

v0.4.0 のZIPを展開してロードし、新機能一式が通ることを確認済み（34ファイル / 86KB）。

## 14. v0.5.0 / v0.6.0 の追加と修正

### 「縦だけいっぱい」が効かなかった原因（修正済み）

報告どおり再現した。原因は幾何計算ではなく分岐で、**最大化されたウィンドウを
「すでにスポットライト済み」と判定していた**ため、モードを適用せず元のサイズへ
戻すだけだった。AI のウィンドウは最大化して使うことが多く、そこで露見した。

```
$ node /tmp/awd-height-repro.mjs <dir>     # 修正前
[2] window is MAXIMIZED when the shortcut is pressed
   before {"width":2560,"height":1410,"state":"maximized"}
   after  {"width":820,"height":560,"state":"normal"}
  height fills work area                       FAIL 560
  width unchanged from the maximized width     FAIL 2560 -> 820
```

最大化を「スポットライト済み」と見なすのは `full` モードのときだけに限定し、
他のモードでは一度通常状態に戻してから寸法を測るようにした。「横幅はそのまま」の
横幅は、画面を覆っているときの幅ではなくウィンドウとしての幅を指すため。

```
$ node /tmp/awd-height-repro.mjs <dir>     # 修正後
[1] normal window   : width unchanged PASS 820 -> 820 / height fills PASS
[2] maximized window: leaves maximized PASS / height fills PASS 1410 /
                      width is the window width, not the screen PASS 820
[3] second press    : returns to maximized PASS
[4] mode changed while spotlighted: half applied PASS / press restores PASS
all height-mode scenarios pass
```

### 既定キーの変更

Chrome が `MacCtrl+Z` `MacCtrl+C` `MacCtrl+Space` を受け付けることを実機で確認した
うえで採用した。Windows/Linux/ChromeOS 側は `Alt+Shift+…` のまま残している
（そちらでは `Ctrl+Z` `Ctrl+C` が取り消しとコピーそのもので、グローバルコマンドに
すると全ページから奪ってしまうため）。

```
[{"name":"toggle-spotlight","shortcut":"⌃Space"},
 {"name":"focus-previous","shortcut":"⌃Z"},
 {"name":"focus-next","shortcut":"⌃C"},
 {"name":"tile-windows","shortcut":"⌃⇧8"},
 {"name":"undo-layout","shortcut":""}]
```

### パネルと設定画面の統合

`popup.html` と `options.html` を `deck.html` 一枚に統合し、`action.default_popup`
と `options_ui` の両方から同じページを開くようにした。ポップアップかタブかは
`chrome.tabs.getCurrent()` が undefined を返すかどうかで判別している。

```
$ node /tmp/awd-popupsize.mjs <dir>
{ "bodyWidth": 780, "bodyHeight": 598, "scrollAreaScrolls": true,
  "actionsVisible": true, "tabsVisible": true,
  "urlFieldWidth": 336, "slotColumns": 2 }
fits Chrome popup ceiling (800x600): true
```

URL欄は 336px（以前は4列に詰めて約170px）。列数はグリッドの形ではなく使える幅に
追従させ、`minmax(320px, 1fr)` で折り返している。

### セット（名前つき構成）とタブグループ

```
$ node /tmp/awd-deck.mjs <dir>
lists 前の画面 / lists やり直す / lists all six commands   PASS
preset tabs: ["セット 1"] -> after add: ["セット 1","セット 2"]
new set is selected PASS / new set starts empty PASS / rename applied PASS
set 1 kept its names PASS / set 1 kept its URLs PASS
opened the two windows of set 1 PASS
URL field is at least 300px wide PASS 336px
all deck checks pass

$ node /tmp/awd-groups.mjs <dir>
[{"title":"Claude","color":"blue","tabs":2},
 {"title":"ChatGPT","color":"red","tabs":1},
 {"title":"3","color":"green","tabs":1}]
one group per launched window PASS / named after the window PASS
explicit colour honoured PASS / auto colours differ PASS
multi-URL window grouped both tabs PASS / unnamed slot falls back to its number PASS
no groups created when the toggle is off PASS
all tab-group checks pass
```

### アクセシビリティ

```
deck.html (ja): 54 text runs — WCAG 1.4.3 AA all pass (lowest 5.55)
deck.html (de): 54 text runs — WCAG 1.4.3 AA all pass
```

計測中に実際のレイアウト不具合を1件検出した。「タブをグループにまとめる」の
チェックボックスが直上の色スウォッチ列に食い込んでおり、文字の外接矩形の35%が
スウォッチの色で埋まっていた（比 3.08）。間隔を空けて解消。装飾グリフ
（`aria-hidden`）は 1.4.3 の対象外かつ矩形が数ピクセルしかなく隣接する枠線に
支配されるため、計測から除外している。

### 配布ZIP

v0.6.0 のZIPを展開してロードし、統合パネル・セット・タブグループが通ることを
確認済み（31ファイル / 97KB）。

## 15. v0.7.0 の追加

```
$ node /tmp/awd-v7.mjs <docs/AI-window-deck>
== info buttons ==
an info button on every section                  PASS 11
help text starts hidden                          PASS
clicking i reveals the explanation               PASS
explanation is real prose                        PASS 102 chars
   → よく使う組み合わせに名前を付けて、いくつでも保存しておけます。たとえば「AI比較」「調べもの」…
aria-expanded flips                              PASS

== the wording that confused: セット -> ウィンドウ構成 ==
   heading: "ウィンドウ構成"   button: "構成を追加"

== display map ==
[{"label":"ディスプレイ 1 2560×1440 メイン いまここ","left":"0px","top":"0px","width":"180px"},
 {"label":"ディスプレイ 2 2560×1440","left":"180px","top":"0px","width":"180px"}]
one card per monitor                             PASS
cards are positioned spatially                   PASS
follow button names the current screen           PASS いま使っている画面（ディスプレイ 1）
each screen has a flash control                  PASS
   stored after picking two: {"targetDisplays":["2","3"]}
multiple screens can be selected                 PASS

== identify flash ==
a flash window appears                           PASS 1
it closes itself                                 PASS 0

== control panel ==
[{"title":"Window Deck","meta":"1 タブ · 画面 1","status":"表示中","cls":"win-row status-here"}]
lists the open windows                           PASS
the focused window reads as in view              PASS
rows show tab count and screen                   PASS
the list keeps itself up to date                 PASS 1 -> 2
clicking a row focuses that window               PASS

== bigger settings window ==
    {"w":2048,"h":1128,"type":"popup","target":[2048,1128]}
opens as a window, not a tab                     PASS
about 80% of the work area                       PASS

page errors: none
all v0.7.0 checks pass
```

ディスプレイの並びは `chrome.system.display.getInfo()` の `bounds` をそのまま縮尺して
描いており、内蔵画面かどうかは `isInternal`、ミラーリングは `mirroringSourceId` で
判定している（どちらも実測で値が返ることを確認済み）。

### 修正した不具合

- 主タブの切り替えが `[role="tab"]` を全部走査しており、あとから生成される構成の
  チップまで含めて対応するパネルを探し、null を参照して画面全体が描画されなく
  なっていた。構成のチップは `aria-pressed` のボタンに変え、タブ走査は
  `.tabs` の中だけに限定した。
- 表示を地図に置き換えたあとも、消した `<select>` へのイベント登録が残っていた。

### 計測ハーネスの2つの欠陥（本体ではなく検証側）

1. プレート（文字を透明にした背景画像）で、入力欄とプレースホルダーの文字が
   消えていなかった。`color` だけでは足りず、Chrome は `-webkit-text-fill-color`
   で描くため。
2. **`fullPage: true` の合成画像が、レイアウト座標と縦に約30pxずれていた**
   （`position:fixed` の背景がある縦長ページで顕在化）。ビューポートを文書全体が
   入る高さにして一枚で撮るよう変更し、解消。

この2つを直したところ、それまで「失敗」に見えていた8件はすべて実際には合格だった。

```
deck.html (ja): 73 text runs — WCAG 1.4.3 AA all pass (lowest 5.48)
deck.html (de): 73 text runs — WCAG 1.4.3 AA all pass (lowest 5.47)
```

### 配布ZIP

v0.7.0 のZIPを展開してロードし、新機能一式が通ることを確認済み（33ファイル / 153KB）。

## 16. v0.8.0 — まとめて貼り付け・空欄も起動・いまのウィンドウを記憶

貼り付け解析は、実際に渡された一覧をそのまま入力して検証した。

```
$ node /tmp/awd-bulk.mjs <docs/AI-window-deck>
status : "9 個のウィンドウを作りました"
layout : 9 — 3 × 3
   1. "takaoumehara.com"     "https://claude.ai/code/session_01TY…"
   2. "skillforge"           "https://claude.ai/code/session_01Vq…"
   6. "人狼"                  "https://claude.ai/code/session_01E1…"
   8. ""                     "https://vercel.com/…/deployments"
names taken from the plain lines               PASS
a domain-looking name is not eaten as a URL    PASS   (takaoumehara.com は名前)
Japanese names survive                         PASS
a blank line always starts a new window        PASS
that window is simply left unnamed             PASS
saved to the arrangement                       PASS 9
chip says how many windows it holds            PASS   "構成 1 · 9 枚"

-- bare domains, no scheme --
["https://claude.ai\nhttps://chatgpt.com","https://gemini.google.com"]
bare domains get a scheme                      PASS
blank line still splits windows                PASS 2

-- nonsense in, nothing broken --
status: "読み取れる行がありませんでした"          PASS

-- empty squares still open --
a 2x2 with one URL still opens four windows    PASS 4
turning it off opens only the filled squares   PASS 1

-- remember the windows that are open now --
captured: {"columns":2,"name":"構成 2","rows":1,
           "slots":[{"name":"Example Domain","urls":"https://example.com/"},…]}
a new arrangement was made from what is open   PASS
it captured real addresses                     PASS
```

書式の規則は「`http` で始まる行はアドレス、それ以外は名前、空行で次のウィンドウ」の
3つだけ。ドメインに見える名前（`takaoumehara.com`）を誤ってアドレスと解釈しないこと、
空行が必ず区切りになること（渡された一覧では vercel の行が独立したウィンドウになる）を
それぞれ確認している。後者は曖昧に推測せず規則どおりに動かす判断で、結果は画面に
すぐ反映されるため取り違えてもその場で直せる。

### 計測ハーネスの3つ目の欠陥

折りたたまれた `<details>` の中のテキストは、描画されないのに矩形を返す。これを
測ると「白文字が白背景の上にある」（比 1.00）と出る。`checkVisibility()` で
未描画のテキストを除外して解消した。

```
deck.html (ja): 77 text runs — WCAG 1.4.3 AA all pass (lowest 5.48)
deck.html (de): 78 text runs — WCAG 1.4.3 AA all pass (lowest 5.44)
```

### 配布ZIP

v0.8.0 のZIPを展開してロードし、貼り付け・空欄起動・記憶が通ることを確認済み
（33ファイル / 170KB）。

## 17. v0.9.0 — ブランド v2 "LAUNCH" の適用

配色と形をリポジトリの `docs/brand.md`（v2 "LAUNCH"）に合わせた。あの文書は
**「紫青のグラデーション soup、グラスモーフィズムを使わない」**と明記しており、
それまでのパステルのグラデーションは正面から反していた。

トークンは暗地で AA を満たすよう検算してから採用している。

| 用途 | 値 | 対 --card (#151B27) |
|---|---|---|
| 本文 | `#E8ECF3` | 14.6 |
| 補助（Slate を明るく） | `#98A3B8` | 6.8 |
| 強調文字（Cobalt を明るく） | `#8AA4FF` | 7.3 |
| 面としての Cobalt + 白文字 | `#2F5BFF` | 5.2 |
| コントロールの境界 | `#5A6B82` | 3.2（1.4.11） |

生の Cobalt `#2F5BFF` は暗地の**文字**としては 3.3 しかないため、面として使い白文字を
乗せる用途に限定した。Slate も生値は 4.95 と余裕がないので明度を上げている
（ブランド文書自身が「v1 は暗すぎた」と書いている方向と一致する）。

```
$ grep -c linear-gradient deck.css
0

deck.html (ja): 78 text runs — WCAG 1.4.3 AA all pass (lowest 5.17)
deck.html (de): 77 text runs — WCAG 1.4.3 AA all pass (lowest 5.17)
```

アイコンも作り直した。4×2 のグリッドのうち左上ひとつだけを Cobalt にし、わずかに
はみ出させて「起動の瞬間」を示す——ブランド文書の指定どおり。グラデーションを
やめたことで 16px でも輪郭が保たれる。

機能面の回帰（貼り付け・空欄起動・記憶・ディスプレイ地図・一覧・大きい窓）は
すべて再実行して通っている。

## 18. v1.0.0 — 導線の再設計

考え方は [ux.md](ux.md) に分けて書いた。要点は**「構成を作ってから使う」ではなく
「使ってから保存する」**への転換で、画面もその順に組み直している。

```
$ node /tmp/awd-flow.mjs <docs/AI-window-deck>
== the route reads as a route ==
   1 どの画面に並べる？   2 いくつに分ける？   3 それぞれに何を開く？   4 開く
four numbered steps in order                       PASS
screen comes first / open comes last               PASS
the action row is called コマンド                    PASS

== save is at the exit, not the entrance ==
empty state tells you to build first, then save    PASS
   「まだ保存していません。下で好きに組んで、気に入ったら…」
no "add a set" button gating the start             PASS
save-this-as-it-is sits in step 4                  PASS

== the width is actually used ==
   {"pageWidth":1180,"viewport":1280,"flowColumns":2,"slotColumns":3}
content spans most of the viewport                 PASS 92%
steps 1 and 2 sit side by side when wide           PASS
URL boxes use the extra width                      PASS 3 columns

== build first, save after ==
saving after the fact creates an arrangement       PASS
the empty state goes away                          PASS

== the standing window ==
   {"type":"popup","width":320,"height":1128}
a separate window opened / tall and narrow         PASS
the standing window lists the windows              PASS
```

### 直した不具合

- 入口だった「構成を追加」を外した際、そのボタンへのイベント登録が残って画面全体が
  描画不能になっていた。同じページがポップアップ・タブ・常駐ウィンドウの3形態で
  使われるようになったため、要素参照はすべて省略可能（`?.`）にした。
- 常駐ウィンドウが既定サイズ（1282×846）で開いていた。生成直後は座標が定着しない
  既知の挙動で、遅延して当て直す共通処理に寄せて 320×1128 に固定された。

```
deck.html (ja): 82 text runs — WCAG 1.4.3 AA all pass (lowest 5.17)
deck.html (de): 81 text runs — WCAG 1.4.3 AA all pass (lowest 5.17)
```

### 実装しないと判断したもの

- **常駐ウィンドウを常に最前面に固定** — Chrome 拡張に該当APIがない。
- **他のウィンドウを暗くする** — 拡張から他ウィンドウの描画には触れられない。
  各サイトにオーバーレイを差し込めば見た目上は可能だが、ページを壊すため採らない。

どちらも画面の説明文に明記した。

### 配布ZIP

v1.0.0 のZIPを展開してロードし、順路・保存・常駐ウィンドウが通ることを確認済み
（35ファイル / 181KB）。

## 19. v1.0.1 — 拡張を再読み込みしたときのエラー（修正済み）

`chrome://extensions` に大量に出ていた `Uncaught Error: Extension context
invalidated.` と `Cannot read properties of undefined (reading 'sendMessage')` の
原因と修正。

**原因。** 拡張を再読み込み・更新すると、**すでに開いているページに注入済みの
コンテンツスクリプトはそのまま動き続ける**が、`chrome.runtime` との橋が外される。
このとき `chrome.runtime.sendMessage()` は**同期的に例外を投げる**ため、
`.catch()` では捕まえられない。さらに MutationObserver が生き続けているので、
そのページで DOM が変わるたびに何度も投げる。エラーが並んでいたのはこのため。

**再現。**

```
$ node /tmp/awd-orphan.mjs <docs/AI-window-deck>     # 修正前
-- before the reload, the content script is healthy --
   errors so far: 0
-- reloading the extension out from under the page --
-- the orphaned script now sees DOM changes --
   errors raised by the orphaned script: 2
     Extension context invalidated.
FAIL — 2 uncaught errors after the reload
```

**修正。** 送信前に `chrome?.runtime?.id` を見て、同期例外も `try` で受け、
**一度でも切れた兆候があれば恒久的に停止する**（オブザーバーを外し、タイマーを
止め、イベントリスナーも外す）。切れた橋に何度も話しかけない。

```
$ node /tmp/awd-orphan.mjs <docs/AI-window-deck>     # 修正後
   errors raised by the orphaned script: 0
PASS — the orphaned content script goes quiet instead of throwing
```

同じ形の周期処理が常駐ウィンドウ（2秒ごと）とパネルのウィンドウ一覧にもあったため、
そちらも同様に守った。長生きするページを開いたまま再読み込みしても無音である。

```
$ node /tmp/awd-orphan2.mjs <docs/AI-window-deck>
errors before the reload: 0
errors after the reload  : 0
PASS — the long-lived pages go quiet
```

健全な状態での通知動作（バッジの増減・トグル）は従来どおり通ることを再確認済み。

## 20. v1.1.0 / v1.2.0 — 言い方の明確化と全画面

### 分割数の表記

`2 — 2 × 1` は何も伝えていなかった。枚数を言葉で先に出す。

```
$ node /tmp/awd-clarity.mjs <dir>
2枚に分ける（2 × 1） / 4枚に分ける（2 × 2） / 8枚に分ける（4 × 2） …
says how many windows, in words                    PASS
```

### 貼り付けの規則を1行×3に

段落だった説明を3行の規則に置き換え、薄い例をプレースホルダーに入れ、
消したあとも「例を入れる」で戻せるようにし、**入力の下に結果のプレビュー**を出す。

```
・ http:// か https:// で始まる行＝開くアドレス
・ それ以外の行＝ウィンドウの名前（タブグループの名前になります）
・ 空行＝ここから次のウィンドウ
three short rules, not a paragraph                 PASS
a faded example sits in the empty box              PASS
the example button puts it back as real text       PASS
```

### 名前とアドレスの取り違え（設計判断）

「タブグループ名に `example.com` と入れたらアドレスとして解釈されないか」という
懸念に対し、**裸のドメインをアドレスとみなす推測をやめた**。規則は1文で言い切れる
ものになった——**スキームで始まる行だけがアドレス、他はすべて名前**。

```
   1. name="takaoumehara.com"  urls="https://claude.ai"
   2. name="example.com"       urls=""
   3. name="名前なし"           urls="https://vercel.com"
a domain-looking name stays a name                 PASS
a bare domain alone is a name, never an address    PASS
a lone address gets no name                        PASS
```

推測をやめた代わりにプレビューを置いた。押す前に結果が見えるので、規則を覚えて
いなくても取り違えに気付ける。

### 全画面と、元の大きさ

```
$ node /tmp/awd-fs.mjs <dir>
tiled   : {"left":1284,"top":30,"width":1276,"height":701}
full    : {"state":"fullscreen","width":2560,"height":1440}     goes full screen PASS
back    : {"state":"normal","left":1284,"top":30,"width":1276,"height":701}
the same key returns it / to exactly the tiled size and place   PASS
-- from full screen, the enlarge key also brings it home --
the enlarge key leaves full screen / lands back on the tiled square PASS
```

全画面は spotlight と同じ記憶を共有しているため、どちらのキーで戻しても
8分割の1枠にそのまま帰る。既定キーは付けていない（Chrome の上限4つが埋まっており、
`⌘F`/`Ctrl+F` はページ内検索を奪うため推奨しない旨を README に明記）。

### 更新後にエラーが残っていた件

v1.0.1 でコンテンツスクリプトは黙るようにしたが、**すでに開いていたタブには古い
コードが残ったまま**で、ページを再読み込みするまで新しい版に入れ替わらない。
`chrome.runtime.onInstalled` で全ての http(s) タブへ再注入するようにし、更新した
時点で入れ替わるようにした（`scripting` 権限を追加）。

### 計測ハーネス

`page.screenshot` が縦長ページでタイムアウトしていた。撮影は診断であって検査では
ないため、失敗しても suite を落とさない扱いに変更した。

```
deck.html (ja): 81 text runs — WCAG 1.4.3 AA all pass (lowest 5.17)
deck.html (de): 85 text runs — WCAG 1.4.3 AA all pass (lowest 5.17)
```

### 配布ZIP

v1.2.0 のZIPを展開してロードし、全画面往復・貼り付け・孤児スクリプトの沈黙を
確認済み（35ファイル / 197KB）。

## 21. v1.3.0 — UX の指摘への対応

設計判断は [ux.md](ux.md) の第2版に書いた。実測は以下。

```
$ node /tmp/awd-ux2.mjs <dir>
== issue 1: following a screen shows which screen ==
    screen resolved    ディスプレイ 1 2560×1440 メイン いまここ
    screen             ディスプレイ 2 2560×1440
the screen it resolves to is marked                  PASS
but not as if it were chosen by hand                 PASS

== issue 2 ==  ["ステップ 1","ステップ 2","ステップ 3","ステップ 4"]  14px   PASS
== issue 3 ==  heading "テキストから一気に作る" / 例に個人名なし          PASS

== presets are a dropdown, with a way to make one ==
a select, not a row of tabs / there is a "new" button        PASS
creating one opens inline rename, not a browser prompt       PASS
the typed name lands in the dropdown                          PASS

== layouts are pictures, and uneven shapes exist ==
   2/3/4/6/8/9 枚に分ける   中央を大きく（5枚） 左を大きく（3枚）
   上を大きく（4枚） 中央2枚を大きく（6枚）
choosing it gives exactly five slots                 PASS 5
the shape is saved as cells                          PASS

== size is chosen by picture ==  five shapes drawn   PASS
== windows can be closed from the list ==
close controls on every row / closing one removes it / close-all leaves the one you are in  PASS
```

不均等レイアウトは図だけでなく**実際のウィンドウ配置**で検証した。

```
$ node /tmp/awd-shape.mjs <dir>     # 中央を大きく（5枚）
  1. {"left":0,"top":30,"width":634,"height":701}
  2. {"left":0,"top":739,"width":634,"height":701}
  3. {"left":642,"top":30,"width":1276,"height":1410}   ← 中央、縦2段ぶん
  4. {"left":1926,"top":30,"width":634,"height":701}
  5. {"left":1926,"top":739,"width":634,"height":701}
one of them is clearly the big middle   PASS 1276x1410 vs 634x701
the big one spans both rows             PASS
it sits between the small ones          PASS
and nothing overlaps                    PASS 0 pairs
```

レイアウトは `{x,y,w,h}` のセル配列として持ち、均等分割はその自動生成として扱う。
図は同じデータから描いているので、**絵と実際の配置が食い違わない**。

### 直した不具合

- 旧 `paintLayoutOptions` が残っており、削除済みの `#layout` を参照して
  `render()` 全体が落ちていた（画面が真っ白になる）。差し替え時に文字列が
  一致していなかったのが原因で、置換の成否を確認していなかった。

```
deck.html (ja): 99 text runs — WCAG 1.4.3 AA all pass (lowest 5.17)
deck.html (de): 99 text runs — WCAG 1.4.3 AA all pass (lowest 5.17)
```

### 配布ZIP

v1.3.0 のZIPを展開してロードし、UX一式と不均等レイアウトの実配置を確認済み
（35ファイル / 214KB）。

## 22. v1.3.1 — 8分割まで戻れなかった件

報告どおり再現した。**原因は `previousBounds` が1ウィンドウにつき1件しか
持っていなかったこと。** 8分割 →（広げる）→ 全画面 と2段上がると、全画面に
するときの保存が「8分割の1枠」の記憶を上書きしてしまい、戻り道が1段しか
残らなかった。

```
$ node /tmp/awd-chain.mjs <dir>      # 修正前
1. 8分割の1枠  : {"left":1284,"top":30,"width":1276,"height":701}
2. ⌃Space      : {"left":1280,"top":30,"width":1280,"height":705}
3. ⌃⇧Space     : {"state":"fullscreen"}
4. ⌃⇧Space again: 1280x705                      PASS
5. ⌃Space again : 1280x705                      FAIL  ← 8分割に戻らない
```

**修正。** 大きくした履歴を**段（スタック）**にした。各段は「覆い隠す前の
座標と状態」と「自分が適用した形」を持つ。押すたびに1段ずつ戻る。

判定は**キーごとに自分の署名だけを見る**。全画面のキーは `state === "fullscreen"`
を、広げるキーは自分が適用した座標との一致を見る。こうしないと「広げた状態で
全画面キーを押す」が「1段戻る」に化けてしまう。例外として、全画面のときは
広げるキーでも縮む（そこで更に広げたい人はいないため）。

```
$ node /tmp/awd-chain.mjs <dir>      # 修正後
4. ⌃⇧Space again: 1280x705           PASS
5. ⌃Space again : 1276x701           PASS  ← 8分割の1枠
6. ⌃Space once more: 1280x705        PASS  ← そこからまた広がる
the whole chain walks back home
```

段は1ウィンドウ8件まで。手でウィンドウを動かすと署名が合わなくなるので、
その段は使わず新しく広げる。

回帰（大きさ4種×着地2種、縦だけいっぱい、全画面往復、Undo）はすべて再実行して
通っている。

### ショートカットの確認

`manifest.json` の `suggested_key` に **Command(⌘) の指定は一つも無い**。
macOS 側は全て `MacCtrl`（= Control）。

```
toggle-spotlight   {'default': 'Alt+Shift+Space', 'mac': 'MacCtrl+Space'}
tile-windows       {'default': 'Alt+Shift+8',     'mac': 'MacCtrl+Shift+8'}
focus-next         {'default': 'Alt+Shift+Right', 'mac': 'MacCtrl+C'}
focus-previous     {'default': 'Alt+Shift+Left',  'mac': 'MacCtrl+Z'}
undo-layout        （既定なし）
toggle-fullscreen  （既定なし）
```

## 23. v1.4.0 — 提案の検証と、3段ローテーション

### 提案のうち、実測で否定された点

`Alt+Z/X/C/V` を勧める提案自体は妥当だったが、周辺の主張は事実と違うものがあった。
すべて Chrome for Testing 150 に実際に読み込ませて確認している。

| 組み合わせ | 結果 |
|---|---|
| `Alt+X` `Alt+Z` `Alt+A` `Alt+V` | ✅ 登録される（macOS では ⌥X などになる） |
| `Alt+1`〜 | ✅ 登録される |
| `Alt+Shift+X` | ✅ 登録される |
| `Alt+Period` | ✅ 登録される |
| **`Ctrl+Alt+X`** | ❌ **拡張が起動しない**（Ctrl+Alt は使えない） |
| **`Alt+Backquote`（Option+~）** | ❌ **起動しない**（チルダは割り当て可能キーに含まれない） |

つまり「Control+Option にすればいい」という案は成立せず、「Option+チルダで次の
ウィンドウ」も実装できない。一方「Option+数字」は可能。

「Alt+Z/X/C/V は Mac で完全に空席」という主張も**部分的に誤り**で、macOS では
⌥z=Ω, ⌥x=≈, ⌥c=ç, ⌥v=√ と文字入力に使われている。Chrome の拡張コマンドは
それを奪う。ただし日常的に打つ文字ではないため、実害は小さいと判断して採用した。
`⌃C` より優れているのは「押し間違えて発火することがまずない」点であって、
「入力中に発火しない」からではない。

（補足: 入力欄にフォーカスがある状態で Playwright から ⌥X を送ると発火しなかったが、
合成キーはブラウザのコマンド層を通らないため、この結果は根拠にしていない。）

### 3段ローテーション

提案の中核だった「1つのキーで 小→中→全→小」を採用した。

```
$ node /tmp/awd-rotate.mjs <dir>
タイル : {"left":1284,"top":30,"width":1276,"height":701}
1回目 : {"left":1280,"top":30,"width":1280,"height":705}   中     PASS
2回目 : {"state":"fullscreen"}                              全画面  PASS
3回目 : {"left":1284,"top":30,"width":1276,"height":701}   タイル  PASS
4回目 : 中                                                          PASS
全画面から「元に戻す」でタイルへ直行                                 PASS
タイル番号のコマンドが8つある                                       PASS
既定キーは4つ、すべて Option 系                                     PASS
  ["restore-home=⌥Z","tile-windows=⌥A","toggle-fullscreen=⌥V","toggle-spotlight=⌥X"]
```

段を積む実装（v1.3.1）はそのまま土台に使い、最上段が全画面のときだけ
**最下段まで一気に戻す**ようにした。押し続ければ必ず家に帰る。

### 番号でタイルへ飛ぶ

`focus-tile-1` 〜 `focus-tile-8` を追加（既定キー無し）。Chrome の上限が4つの
ため、`Option+1`〜`Option+8` は利用者が割り当てる。コマンド総数は15。

```
deck.html (ja): 122 text runs — WCAG 1.4.3 AA all pass (lowest 5.17)
```

## 24. v1.5.0 — どのURLがどのマスになるか、と入れ替え

### カードは自分のマスを言っていなかった

URL 欄は上から順に並ぶだけで、その3枚目が画面のどこに出るかは書いていなかった。
均等分割なら推測できるが、「中央を大きく5分割」では推測が効かない。各カードに
**そのレイアウトの縮図を持たせ、自分のマスだけを光らせた**。実測（`awd-reorder.mjs`）:

```
== every card says which square it becomes ==
    card 1: column 1 / span 1  row 1 / span 1
    card 4: column 2 / span 1  row 2 / span 1        PASS
== an uneven shape lights the square it really is ==
    card 3: column 2 / span 2  row 1 / span 2        PASS  ← 中央の大きい枠
    card 5: column 4 / span 1  row 2 / span 1        PASS
```

図は `layoutCells()` が返すセルから描いており、この関数は `background.js` の
`evenCells()` と同じ規則（`cols = Math.min(columns, count)`）を書いてある。
似た規則ではなく同じ規則なので、絵と配置がずれない。

### 入れ替えであって、挿入ではない

マスは固定の入れ物で、枚数はレイアウトが決めている。挿入にすると1枚動かすだけで
残り7枚の行き先がずれる。落とした先と**交換**し、変わるのは2枚だけにした。

### ドラッグとキーボード、両方で実測

```
== the ends have nowhere to go ==
    [prev,next] per card: [[true,false],[false,false],[false,false],[false,true]]   PASS
    aria-label: 「次のマスと入れ替える 1 ↔ 2」                                        PASS
== the keyboard can do the move, and keeps the focus ==
one press swaps the first two squares            PASS ["B","A","C","D"]
    focus after the swap: {"cls":"move move-next","at":1}
focus follows the card that moved                PASS
two more presses walk it to the last square      PASS ["B","C","D","A"]
the swap is announced in the live region         PASS 「入れ替えました 3 ↔ 4」
== the mouse can drag one card onto another ==
dragging card 1 onto card 4 exchanges the two    PASS ["D","B","C","A"]
```

カードは入れ替えのたびに描き直されるので、**押したキーの焦点が消える**。移動先の
カードの同じボタンへ焦点を渡すようにした。上の3手は「クリック1回＋Enter 2回」で、
2回目以降は焦点が引き継がれていなければ成立しない。

つかめる場所はカード左上の帯だけにした。カード全体を `draggable` にすると
**中の URL 欄で文字を選択できなくなる**。

落とし先はカード全体（`.slot`）にしてある。実際に手を離す位置はカードの真ん中、
つまり URL 欄の上になることが多い。イベントログでもそうなっている:

```
    events: dragstart@0 → dragover@3 → drop@3      （drop の対象は TEXTAREA）
```

`drop` で `preventDefault()` を呼んでいるので、**掴んだ文字列が URL 欄に
差し込まれることはない**。

#### ドラッグ検証が一度だけ不安定だった件

ZIP 展開版で最初に回したとき、ドラッグの項目だけが 3回中1回 FAIL した
（順序が変わらない）。テストに**どのドラッグイベントが届いたかを記録させて**
切り分けたところ、`page.dragAndDrop` を単独で6回連続実行すると 6/6 成功する。
差はテスト側の `page.reload()` にあり、`page.goto()` に替えると
**ZIP 展開版で4回連続、ソースで2回連続、いずれも成功**した。

Playwright のドラッグ注入がリロードをまたぐと届かないことがある、という
ところまでが実測で言えることで、その内部原因までは詰めていない。製品側の
`dragstart`/`drop` は届けば必ず入れ替わっており、届かなかった回はイベント自体が
1つも記録されていない。ログを残したので、次に落ちたときは「届かなかった」のか
「届いたのに入れ替わらなかった」のかが一目で分かる。

### 並べ替えが本当に配置を変えるか

DOM とストレージだけでは足りないので、実際に起動させて座標を測った。
`["A","B","C","D"]` の A を4番目のマスまで運んでから一括起動:

```
    order now: ["B","C","D","A"]
    https://example.com/b   {"left":2560,"top":30, "width":1276,"height":701}
    https://example.com/c   {"left":3844,"top":30, "width":1276,"height":701}
    https://example.com/d   {"left":2560,"top":739,"width":1276,"height":701}
    https://example.com/a   {"left":3844,"top":739,"width":1276,"height":701}
the card moved to square 4 opens bottom-right    PASS
the card left at square 1 opens top-left         PASS
```

（このテストは最初 FAIL した。原因は製品ではなくテスト側で、期待値を
`displays[0]` から計算していた。`background.js` は**フォーカスされている
ウィンドウのある画面**に並べるので、2画面環境では別のモニターと比較していた。
`displayFor()` と同じ包含判定に直して PASS。）

### コントラスト

新しい要素（つかむ帯・番号・◂ ▸）を含めて測り直した。無効状態の ◂ は
`--edge` ではなく `--ink-muted` にしてある。**押せないキーも読めなければならない**。

```
deck.html (ja): 139 text runs — WCAG 1.4.3 AA all pass (lowest 5.17)
deck.html (de): 139 text runs — WCAG 1.4.3 AA all pass (lowest 5.17)
```

計測対象に ◂ ▸ が有効・無効の両方で入っていることを確認済み
（`rgb(138,164,255)` と `rgb(152,163,184)`）。

### 既存テストの回帰と、古くなっていたテストの修理

`ux2 / shape / clarity / bulk / flow / rotate / popupsize / deck` を再実行。
このうち **`awd-bulk.mjs` と `awd-deck.mjs` は v1.3.0 の UI 変更以降ずっと
壊れたままだった**（`#layout` と `.preset-tab` は v1.3.0 で図の選択とプルダウンに
置き換わっている）。今回の変更が触るのは構成のスロット配列そのものなので、
両方を現行 UI に合わせて直してから通した。

- `awd-bulk.mjs`: `#layout` → 選択中の `.shape`、`.preset-tab` → `#presetSelect option`
- `awd-deck.mjs`: 同上に加え、`textarea` の素の指定が**折り畳まれた貼り付け欄**を
  掴んでいたため `#slots textarea` に限定。コマンド数の期待値 6 → 16（v1.4.0 で
  番号ジャンプ8つが増えている）

修理後はすべて PASS。

### 未翻訳のまま出ていた4キー

v1.4.0 で追加した `act_home` `cmd_home` `cmd_tile_n` `help_rotate` が
ja/en 以外の6言語で英語のまま出ていた（ビルドの警告に出ていたが埋めていなかった）。
今回まとめて訳した。**8言語 × 174キー、未翻訳ゼロ。**

## 25. v1.6.0 — 2段ローテーション、⌥Q、そして「直したつもり」の取り下げ

### 報告された2件のエラーは、どちらも現行コードからは出ない

chrome://extensions に出ていた2件（`Extension context invalidated` @ `attention.js:18`
と `Cannot read properties of undefined (reading 'sendMessage')`）を切り分けた。

**1. スタックが出荷済みビルドと合わない。** v1.4.0 と v1.5.0 の zip を展開して
18行目を見た。どちらも `function detach() {` で、**名前付き関数の宣言行**である。
報告されたフレームは `(anonymous function)`。この行は例外を投げる行でもない。
つまりこのスタックは、いまディスク上にあるどちらのビルドからも生成できない。

**2. 実際に孤児化させても、1件も出ない。**

```
$ node /tmp/awd-orphan.mjs  <dir>   # 実際に chrome.runtime.reload() を実行
   errors raised by the orphaned script: 0        PASS
$ node /tmp/awd-orphan2.mjs <dir>   # dock と deck を開いたまま再読み込み、9秒放置
   errors after the reload  : 0                   PASS
```

→ **古い記録**と判断。Chrome のエラー一覧は拡張を再読み込みしても自動で消えない。
利用者側で「Clear all」を押して再現するかどうかが最終確認になる（未実施）。

### 取り下げ：「deck.js のクリック経路に穴がある」は誤り

`deck.js` はタイマー経路にだけ孤児ガードがあり、ボタンのクリック経路には
無かった。**そこから同じ TypeError が出るはずだ**と考え、修正前後を比較する
テストを書いた。結果は**修正前でも 0 件**で、再現しなかった。

ハーネスを疑って直接調べたところ、前提が誤っていた。

```
$ node /tmp/awd-orphan-probe.mjs
before reload: {"hasRuntime":"object","id":"abmejdd…"}
   >> the panel page was CLOSED
after reload : {"evaluateFailed":"Target page, context or browser has been closed"}

$ node /tmp/awd-orphan-probe2.mjs
before reload: ["about:blank", "<ext>/dock.html", "http://localhost:8765/t.html"]
after reload : ["about:blank", "chrome://new-tab-page/", "http://localhost:8765/t.html"]
   http://localhost:8765/t.html  {"runtime":"undefined","id":null}
```

**拡張を再読み込みすると、Chrome は拡張ページを全部閉じる。** タブの `deck.html` も、
常駐ウィンドウの `dock.html` も消える（その窓は新しいタブページになる）。
生き残るのは**通常ページに注入された content script だけ**で、そこでだけ
`chrome.runtime` が `undefined` のままコードが動き続ける。

したがって:

- 拡張ページ（`deck.js` / `dock.js`）は、報告された2件のどちらの出所にもなり得ない。
- 2件は**どちらも同じ `attention.js` の症状**である。孤児化した content script は、
  タイミングによって `Extension context invalidated`（Error）と
  `chrome.runtime` が消えたことによる TypeError の**2つの顔**を持つ。
- `dock.js:9-12` の「常駐ウィンドウは再読み込みを生き延びる」というコメントも、
  この計測とは合わない。ガード自体は無害なので残すが、根拠は書き換えた。

`deck.js` の変更は残したが、**バグ修正ではなく整理**として残している。11か所に
散っていた `chrome.runtime.sendMessage` を `ask()` 1か所に集約しただけで、
振る舞いは同じ。孤児判定は「1回のプロパティ読み取り」のコストで置いてある保険。

### 大きさのキーを2段にした

```
$ node /tmp/awd-rotate.mjs <dir>
タイル : {"state":"normal","left":1284,"top":30,"width":1276,"height":701}
1回目 : {"state":"normal","left":1280,"top":30,"width":1280,"height":705}
1回目で「設定した大きさ」になる                       PASS
2回目は全画面ではない                                PASS normal
2回目でタイルに帰る                                  PASS
3回目でまた「設定した大きさ」                         PASS
4回目でまたタイル                                    PASS
4回押して一度も全画面にならない                       PASS ["normal","normal","normal","normal"]

-- 「画面いっぱい」設定でも全画面には行かない --
最大化になる（全画面ではない）                        PASS maximized
2回目でタイルに帰る（全画面を経由しない）             PASS

-- 全画面は専用キーでだけ起きる --
専用キーで全画面になる                                PASS
もう一度押すと戻る                                    PASS
全画面から大きさのキーでタイルへ直行                  PASS
全画面から「元に戻す」でもタイルへ                    PASS

-- 既定キー --
  ["restore-home=⌥Z","tile-windows=⌥A","toggle-fullscreen=⌥Q","toggle-spotlight=⌥X"]
既定キーは4つ                                        PASS 4
全画面 = ⌥Q（実際に登録されている）                  PASS ⌥Q
⌥V はもう使っていない                                PASS
4つとも左手だけで押せる（Q A Z X）                   PASS
```

**`⌥Q` は Chrome に受理される。** 衝突する `suggested_key` は `getAll()` で空文字に
なるため、`⌥Q` が返ってきていること自体が「ぶつかっていない」ことの証拠になる。

v1.4.0 の3段契約を検証していた旧 `awd-rotate.mjs` は、この変更で4件 FAIL する
（`2回目で全画面` ほか）。1つの契約にテストは1つなので、2段版で置き換えた。

### 配布物で落ちた件 — 原因はテスト側だった（v1.5.0 の積み残しでもある）

zip を展開して同じテストを回したら5件 FAIL した。中身は同じ file なので、
zip が違う振る舞いをする経路は無い。再実行すると**毎回違う項目が落ち**、
3回目は全部通った。**flaky なテストは証拠にならない**ので、性質を直した。

原因は**固定 sleep**。`act()` は送信後に 1500ms 待つだけで、macOS の全画面遷移は
アニメーションのぶん所要が揺れる。1500ms がどこに落ちるかで通ったり落ちたりする。

- `settled()` — ウィンドウの座標が **450ms 変化しなくなるまで**待ってから読む。
  「期待した値になるまで待つ」ではないので、間違っているときはちゃんと落ちる。
- `focus()` — `getLastFocused()` が実際に対象を返すまで確認する。コマンドは
  この結果に対して効くので、要求を出しただけでは足りない。
- `park()` — 節の頭で拡大の段（`previousBounds`）も消し、前の節の終わり方に
  結果が依存しないようにした。

直した後: **配布物3回・ソース2回、5回連続で全項目 PASS。**

v1.5.0 で「ZIP 検証時にドラッグ&ドロップが間欠的に落ちる」として未解決のまま
残っていたものも、同じ性質だと考えられる（同じ固定 sleep の作り）。

### 回帰

```
awd-orphan   PASS   awd-orphan2  PASS   awd-reorder  all checks pass
awd-ux2      PASS   awd-shape    PASS   awd-deck     all checks pass
awd-bulk     PASS   （いずれも page errors: none）

deck.html (ja): 138 text runs — WCAG 1.4.3 AA all pass
  lowest 5.17 on 'いまの画面を大きく' (13px)
```

8言語174キー、未翻訳ゼロを維持。書き換えたのは `act_spotlight` `cmd_spotlight`
（ja/en のみ3段を明記していた）と `help_rotate`（全8言語）。

### 未確認のまま残ること

- 利用者の実機で「Clear all」→再読み込み→エラーが戻るかどうか。**これだけは
  自動化できない。** 戻る場合は現行コードに未知の経路があることになる。
- 通知の実タブ切替（`document.hidden`）は従来どおり自動化不能。

## 26. 製品名の表記ゆれ（AI Window Deck）

`manifest.json` の `name` と拡張機能一覧・ストアは `AI Window Deck` だったのに、
開いた画面の見出しとタブ名は `Window Deck` だった。名乗りが二つある状態。

### 直したもの

| 場所 | 前 | 後 |
|---|---|---|
| `deck.html` `<h1>` | Window Deck | AI Window Deck |
| `deck.html` `<title>` | Window Deck | AI Window Deck |
| `dock.html` `<title>` | Window Deck | AI Window Deck |
| `identify.html` `<title>` | Window Deck | AI Window Deck |
| `tools/strings.json` `cmd_popup`（8言語） | 「Window Deck を開く」ほか | 「AI Window Deck を開く」ほか |

`strings.js` と `_locales/` は `python3 tools/build-i18n.py` で再生成。8言語174キー、
未翻訳ゼロを維持。

### 実測（Chrome for Testing 150 / Playwright）

`/tmp/awd-verify-name.mjs` で実際にロードし、ポップアップ枠 780×598 で計測。

```
POPUP 780x598
  document.title      "AI Window Deck"
  header h1           "AI Window Deck"
  h1 width            460px   scrollWidth 460px   → 切れなし
  wrapped             false   （2行に折り返していない）
  overflowsHeader     false   （言語プルダウンに被っていない）
  body scrollWidth    780 = clientWidth 780   → 横スクロール発生なし

FULL PAGE 1280x900
  title / h1          いずれも "AI Window Deck"

DOCK (dock.html)      title "AI Window Deck"

描画された文字列のうち "Window Deck" を含むもの:
  "AI Window Deck" / "AI Window Deck" + tagline / "Open AI Window Deck"
  → `AI` の付かない裸の "Window Deck" はゼロ
```

スクリーンショット: `/tmp/awd-popup-name.png` `/tmp/awd-fullpage-name.png`

ソース全体の再確認も、`AI` の付かない `Window Deck` は0件:

```bash
grep -rnE '(^|[^I] )Window Deck' --include="*.js" --include="*.html" \
  --include="*.json" --include="*.css" .   # → 該当なし
```

### 未確認のまま残ること

- `_locales/` の `extName` は元から `AI Window Deck` で変更なし。Chrome 拡張一覧・
  ストア側の表示は今回の変更前後で同じ。
- 配布用 zip は未再生成。出す時は `./tools/package.sh`（version を上げるなら
  `manifest.json` を先に）。

## 27. 再現手順

```bash
cd /tmp/awd-www && python3 -m http.server 8765 &          # 通知検証用のページ
DIR=docs/AI-window-deck
node /tmp/awd-verify.mjs     "$DIR" v2      # ロードとポップアップ
node /tmp/awd-windows2.mjs   "$DIR"         # 整列・次の画面・列数
node /tmp/awd-modes.mjs      "$DIR"         # 大きさ4種 × 着地点2種 × 復帰
node /tmp/awd-attention5.mjs "$DIR"         # バッジの一生
node /tmp/awd-swrestart2.mjs "$DIR"         # Service Worker 停止からの復帰
node /tmp/awd-ui.mjs         "$DIR"         # 言語切替・ショートカット表示・永続化
node /tmp/awd-options.mjs    "$DIR"         # 設定ページ・一括起動
node /tmp/awd-tidy.mjs       "$DIR"         # 並べ直しの順序・最小化の扱い
node /tmp/awd-probe2.mjs     "$DIR"         # ウィンドウ配置4手順の比較
node /tmp/awd-v4.mjs         "$DIR"         # 縦だけいっぱい・Undo・前/次
node /tmp/awd-displays.mjs   "$DIR"         # 複数モニターの指定（要2画面）
node /tmp/awd-splitview.mjs  "$DIR"         # Split View の拡張API実機確認
node /tmp/awd-height-repro.mjs "$DIR"      # 縦だけいっぱいを状態別に再現
node /tmp/awd-deck.mjs       "$DIR"        # 統合パネル・セット・URL欄の幅
node /tmp/awd-groups.mjs     "$DIR"        # タブグループの名前と色
node /tmp/awd-popupsize.mjs  "$DIR"        # ポップアップ枠に収まるか
node /tmp/awd-v7.mjs         "$DIR"        # iボタン・ディスプレイ地図・一覧・大きい窓
node /tmp/awd-bulk.mjs       "$DIR"        # まとめて貼り付け・空欄起動・記憶
node /tmp/awd-flow.mjs       "$DIR"        # 順路・保存の位置・幅の利用・常駐ウィンドウ
node /tmp/awd-orphan.mjs     "$DIR"        # 再読み込み後のコンテンツスクリプト
node /tmp/awd-orphan2.mjs    "$DIR"        # 再読み込み後の常駐ウィンドウとパネル
node /tmp/awd-clarity.mjs    "$DIR"        # 分割数の表記・貼り付けの規則とプレビュー
node /tmp/awd-fs.mjs         "$DIR"        # 全画面と元の大きさの往復
node /tmp/awd-ux2.mjs        "$DIR"        # ステップ表記・プルダウン・図で選ぶ・閉じる
node /tmp/awd-shape.mjs      "$DIR"        # 不均等レイアウトの実配置
node /tmp/awd-chain.mjs      "$DIR"        # 8分割→拡大→全画面→段を戻る
node /tmp/awd-rotate.mjs     "$DIR"        # 2段ローテーション・全画面の専用キー・⌥Q
node /tmp/awd-orphan3.mjs    "$DIR"        # 孤児化したパネルをクリックする（※後述）
node /tmp/awd-orphan-probe.mjs  "$DIR"     # 拡張ページは再読み込みを生き延びるか
node /tmp/awd-orphan-probe2.mjs "$DIR"     # dock ウィンドウと content script の生死
node /tmp/awd-reorder.mjs    "$DIR"        # 位置図・ドラッグ入替・キーボード入替・実配置
node /tmp/awd-contrast.mjs   "$DIR" ja options.html   # コントラストの実ピクセル計測
python3 /tmp/awd-analyse-contrast.py 900 "options.html"
node /tmp/awd-verify-name.mjs "$DIR"       # 製品名の表記と見出しの折り返し
```
