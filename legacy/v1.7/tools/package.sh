#!/usr/bin/env bash
# Build the Chrome Web Store upload / release archive.
#   ./tools/package.sh            -> AI-Window-Deck-v<version>.zip in the repo root
#
# The archive holds runtime files only: the manifest, the service worker, the
# built React panel (dist/), the display-identify page, icons and _locales.
# No sources, tests, docs, source maps or node_modules.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"
version="$(node -p "require('./manifest.json').version")"
output="$root/AI-Window-Deck-v${version}.zip"

python3 tools/build-i18n.py >/dev/null
npm run build --silent

rm -f "$output"
# Python's zipfile instead of zip(1): available everywhere python3 is, and
# lets us pin timestamps so the same sources give the same archive.
python3 - "$output" manifest.json background.js identify.html identify.js \
  icons _locales dist/index.html dist/assets <<'PY'
import os, sys, zipfile
output, *paths = sys.argv[1:]
files = []
for path in paths:
    if os.path.isdir(path):
        for base, dirs, names in os.walk(path):
            dirs.sort()
            files += [os.path.join(base, n) for n in sorted(names)]
    else:
        files.append(path)
with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
    for file in files:
        if file.endswith((".map", ".DS_Store")):
            continue
        info = zipfile.ZipInfo(file, date_time=(2026, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        with open(file, "rb") as handle:
            archive.writestr(info, handle.read())
PY

node tools/validate-package.mjs "$output"
unzip -l "$output"
