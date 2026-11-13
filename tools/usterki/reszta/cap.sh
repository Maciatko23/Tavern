#!/bin/bash
# cap.sh MAP PORT [ONLY]  - zrzuty wszystkich ekranow mapy z nakladka staging
cd "$(dirname "$0")/../../.."
GAME_OVERLAY=tools/usterki/reszta/staging GAME_OVERLAY_JS=1 MAPY=$1 CDP_PORT=$2 OUT_DIR=tools/usterki/reszta/po S=0.5 ONLY=$3 node tools/usterki/reszta/zrzuty.js 2>&1 | tail -3
