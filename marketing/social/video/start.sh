#!/bin/bash
# fresh Chrome with the extension; prints extension id
LANG_UI=${1:-en-US}
tmux -f /exec-daemon/tmux.portal.conf kill-session -t promo-chrome 2>/dev/null
pkill -f promo-profile; sleep 1.5
rm -rf /tmp/promo-profile
tmux -f /exec-daemon/tmux.portal.conf new-session -d -s promo-chrome "LANG_UI=$LANG_UI node /tmp/promo/launch.mjs 2>&1 | tee /tmp/promo/launch.log"
for i in $(seq 1 20); do grep -q PIPE /tmp/promo/launch.log 2>/dev/null && break; sleep 0.5; done
grep PIPE /tmp/promo/launch.log
