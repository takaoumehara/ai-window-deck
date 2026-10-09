#!/usr/bin/env bash
# Build the Chrome Web Store upload / release archive from the repository root.
#   ./tools/package.sh            -> ai-window-deck-v<version>.zip in the repo root
#
# The repository root is the extension package as shipped: the manifest, the service
# worker, the panel (dist/), the display-identify page, icons and _locales. Nothing is
# built; the archive holds exactly these files. dist/ is the 1.11.2 bundle, produced by
# tools/patch-v1.11.2-inline-register.mjs from the 1.11.0 store package (npm run patch).
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"
version="$(node -p "require('./manifest.json').version")"
output="$root/ai-window-deck-v${version}.zip"

rm -f "$output"
# Python's zipfile instead of zip(1): available everywhere python3 is, and
# lets us pin timestamps so the same files give the same archive.
python3 - "$output" manifest.json background.js identify.html identify.js \
  icons _locales dist <<'PY'
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
