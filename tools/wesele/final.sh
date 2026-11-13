#!/bin/bash
cd "$(dirname "$0")/../.."
echo "== wydajnosc before"; CDP_PORT=9945 timeout 1500 node tests/wydajnosc_test.js 2>&1 | grep -E "passed|^FAIL|^ERR|ms" | cut -c1-220
echo "== wydajnosc after"; GAME_OVERLAY=tools/wesele/overlay GAME_OVERLAY_JS=1 CDP_PORT=9945 timeout 1500 node tests/wydajnosc_test.js 2>&1 | grep -E "passed|^FAIL|^ERR|ms" | cut -c1-220
echo "== tavern_life live"; CDP_PORT=9945 timeout 1500 node tests/tavern_life_test.js 2>&1 | grep -E "passed|^FAIL|^ERR" | cut -c1-260
echo "== wesele"; CDP_PORT=9946 node tests/wesele_test.js 2>&1 | grep -E "passed|^FAIL|^ERR" | cut -c1-300
echo done
