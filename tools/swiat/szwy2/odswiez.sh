#!/bin/sh
# przebuduj staging szwów rundy 2 i obrazy przed/po (docs/swiat_szwy2/)
cd "$(dirname "$0")/../../.." || exit 1
python -X utf8 tools/swiat/szwy2/zbuduj.py | tail -2 &&
python -X utf8 tools/mapy/swiat_szwy.py --out docs/swiat_szwy2/przed | tail -1 &&
python -X utf8 tools/mapy/swiat_szwy.py --dane tools/swiat/szwy2/staging/data --out docs/swiat_szwy2/po | tail -1 &&
python -X utf8 tools/swiat/szwy2/arkusze.py
