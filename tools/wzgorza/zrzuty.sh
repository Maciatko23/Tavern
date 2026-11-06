#!/bin/bash
# zrzuty.sh przed|po 'ZBLIZENIA json'   (przed: bez nakładki, po: z wtyczką ze stagingu)
cd "$(dirname "$0")/../.."
export CDP_PORT=${CDP_PORT:-9413} PREFIKS=$1 ZBLIZENIA="$2"
if [ "$1" = "po" ]; then export GAME_OVERLAY=tools/wzgorza/staging GAME_OVERLAY_JS=1; fi
node tests/wzgorza_zrzuty.js 2>&1 | tail -${3:-6}
