#!/usr/bin/env bash
# Restart the production server on a given port, replacing whatever is already
# there. `next start` keeps its build manifest in memory, so a server left
# running from before a rebuild serves the previous build's asset hashes and
# every audit run against it measures the wrong thing — which is subtle, silent
# and wastes a lot of time. This always kills first.
#
# usage: scripts/serve.sh [port]
set -euo pipefail
PORT="${1:-3100}"

# Two ways of finding it, because `ss` reports nothing in some sandboxes — and
# when it silently finds no listener, the old server survives the "restart" and
# every audit afterwards measures the previous build. pgrep is the one that
# works everywhere; ss stays as a backstop for a server started differently.
for pid in \
  $(pgrep -f "next start -p ${PORT}" 2>/dev/null || true) \
  $(pgrep -f "next-server" 2>/dev/null || true) \
  $(ss -lptn "sport = :${PORT}" 2>/dev/null | grep -o 'pid=[0-9]*' | cut -d= -f2 || true); do
  kill -9 "$pid" 2>/dev/null || true
done
sleep 2

# Refuse to continue if something is still answering — a silent stale server is
# worse than a loud failure.
if curl -sf -o /dev/null "http://127.0.0.1:${PORT}/" 2>/dev/null; then
  echo "port ${PORT} still answering after kill; refusing to start a second server" >&2
  exit 1
fi

nohup npx next start -p "$PORT" > "/tmp/next-${PORT}.log" 2>&1 &

for _ in $(seq 1 30); do
  if curl -sf -o /dev/null "http://127.0.0.1:${PORT}/"; then
    echo "serving on ${PORT}"
    exit 0
  fi
  sleep 1
done

echo "server on ${PORT} did not come up" >&2
tail -20 "/tmp/next-${PORT}.log" >&2
exit 1
