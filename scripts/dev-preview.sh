#!/usr/bin/env bash
# Started by .claude/launch.json via wsl.exe. PORT is forwarded from Windows
# through WSLENV; next dev picks it up automatically.
set -euo pipefail
cd "$(dirname "$0")/.."

# WSLENV can set PORT to an empty string, which breaks `next dev`
if [ -z "${PORT:-}" ] || ! [[ "${PORT}" =~ ^[0-9]+$ ]]; then
  unset PORT
fi

DEV_PORT="${PORT:-3000}"
exec npm run dev -- -p "${DEV_PORT}"
