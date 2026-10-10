# プロモ動画の撮影スクリプト

`media/ai-window-deck-promo-{en,ja}.mp4` を作ったスクリプトです。Cursor のクラウドエージェント（Linux、XFCE デスクトップ、Google Chrome、ffmpeg、xdotool、xclip）で動かす前提です。Mac では動きません。

拡張を実際に Chrome に読み込み、本物のマウス操作とキー入力で「登録 → レイアウト → Focus view → 起動 → Alt+X」を 1 テイクで録画し、タイトルカードと字幕を重ねて仕上げます。

## 手順

```sh
cp -r marketing/social/video /tmp/promo && mkdir -p /tmp/promo/cards && mv /tmp/promo/cards.mjs /tmp/promo/cards/
DISPLAY=:1 xrandr -s 1920x1080            # 16:9 にする
node /tmp/promo/record.mjs en              # 録画 -> /tmp/promo/out/en/raw.mp4 と marks.json
node /tmp/promo/cards/cards.mjs en         # タイトル・字幕の画像（Chrome が起動している間に実行）
python3 /tmp/promo/compose.py en           # 仕上げ -> /tmp/promo/out/en/ai-window-deck-promo-en.mp4
```

日本語版は `en` を `ja` にします。

## 前提と注意

- パスは `/tmp/promo` 固定です。拡張は `/workspace` から読み込むので、拡張 ID（`record.mjs` の `EXT`）はこのパスで決まります。
- 市販版の Chrome は `--load-extension` を無視するため、`launch.mjs` は DevTools のパイプ経由で `Extensions.loadUnpacked` を呼んでいます。
- 開くサイトは `deck-en.txt` / `deck-ja.txt` です。ログインが必要なページ（claude.ai/code など）はボット判定で 403 になるので、公開ページだけにしています。
- 字幕の文言は `cards.mjs`、字幕を出すタイミングは `record.mjs` が書き出す `marks.json` で決まります。
- 撮影前にデスクトップのパネルを自動で隠し、壁紙を単色にしておくと見た目が整います（`xfconf-query` で設定）。
