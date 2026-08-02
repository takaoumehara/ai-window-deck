#!/bin/zsh
# Build the loadable/uploadable AI Window Deck archive.
#   ./tools/package.sh
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
version="$(python3 -c "import json;print(json.load(open('$root/manifest.json'))['version'])")"
output="$root/AI-Window-Deck-v${version}.zip"

cd "$root"
rm -f "$output"
zip -rq "$output" manifest.json deck.html deck.js deck.css background.js attention.js layout-model.js \
  strings.js keys.js i18n.js identify.html identify.js dock.html dock.js icons _locales \
  -x '*.DS_Store'
unzip -l "$output"
