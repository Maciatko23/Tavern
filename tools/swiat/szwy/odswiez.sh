#!/bin/sh
# przebuduj staging i obrazy szwów (po/)
cd "$(dirname "$0")/../../.." || exit 1
python -X utf8 tools/swiat/szwy/zbuduj_szwy.py | tail -3 &&
python -X utf8 tools/mapy/swiat_szwy.py --dane tools/swiat/szwy/staging/data --out docs/swiat_szwy/po | tail -1
