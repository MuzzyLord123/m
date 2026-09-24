#!/usr/bin/env bash
# ===================================================================
#  KH Painting and Decorating — start the site on this Mac or Linux box
#
#  Run ./start.sh from this folder. See RUN-ON-YOUR-PC.md if anything
#  goes wrong.
# ===================================================================

set -euo pipefail

cd "$(dirname "$0")"

echo
echo " KH Painting and Decorating"
echo " =========================="
echo

# --- Is Node installed? --------------------------------------------
if ! command -v node >/dev/null 2>&1; then
  echo " Node.js is not installed."
  echo
  echo " Go to https://nodejs.org and install the version marked LTS,"
  echo " then run this again."
  echo
  exit 1
fi

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
echo " Node $(node -v)"

if [ "$NODE_MAJOR" -lt 20 ]; then
  echo
  echo " That version is too old — the site needs Node 20 or newer."
  echo " Install the LTS version from https://nodejs.org and try again."
  echo
  exit 1
fi

# --- First run? Install what it needs. ------------------------------
if [ ! -d node_modules ]; then
  echo
  echo " First run — downloading what the site needs."
  echo " This takes a minute or two. It only happens once."
  echo
  npm install
fi

echo
echo " Starting. When you see \"Local: http://localhost:3000\","
echo " open that address in your browser."
echo
echo " To stop the site, press Ctrl and C together."
echo

npm run dev
