# -*- coding: utf-8 -*-
"""Krok 4 planszy - miejsca odstawione na razie (gracz 2026-11-08: „na razie ich nie używamy”): przejścia i postoje we wtyczkach,
które prowadzą poza planszę, wyłączone w kopii próbnej (po wtyczki_kratki.py; bierze plik z kopii, jeśli już tam jest, inaczej z gry):
  - Woz.js: postój „lesna” (Leśna droga) bez kursu; postój przystani na drodze przy szopach (dawny stał w uciętej części);
  - Wyspa_Data.js: łacha Garnizon <-> Wrak;
  - Orzel_Data.js: wspinaczka na Orlą Grań (WAY_UP bez kratek); zejście z Grani ląduje w Górach o 24 rzędy niżej;
  - CzerwonaWoda.js: pas brzegu i na mapach planszy, które dostały morze (3, 4, 13, 24, 111).
  python tools/plansza/odstaw.py"""
import os, re
from plansza import ROOT, STG, BOARD
PL = os.path.join(STG, "js", "plugins")
os.makedirs(PL, exist_ok=True)


def src(f):
    p = os.path.join(PL, f)
    return open(p if os.path.exists(p) else os.path.join(ROOT, "js", "plugins", f), "rb").read().decode("utf-8")


def save(f, s): open(os.path.join(PL, f), "wb").write(s.encode("utf-8"))


def rep(s, old, new, f):
    if s.count(old) != 1: raise SystemExit("%s: nie znalazłem: %s" % (f, old[:80]))
    return s.replace(old, new)


s = src("Woz.js")
s = rep(s, '        lesna: { map: 21, woz: [7, 20], woznica: [5, 20, 2], land: [4, 20, 6] },             // (the road in from Polna droga)\n', '', "Woz.js")
s = re.sub(r'przystan: \{ map: 125, woz: \[\d+, \d+\], woznica: \[\d+, \d+, 2\], land: \[\d+, \d+, 6\] \}[^\n]*',
           'przystan: { map: 125, woz: [34, 7], woznica: [32, 7, 2], land: [31, 7, 6] }          // (plansza 3x3, 2026-11-08: the road by the sheds - the old stop was in the cut part)', s)
s = rep(s, '[13.5, "lesna"], [14.5, null]', '[13.5, null], [14.5, null]', "Woz.js")
save("Woz.js", s)

s = src("Wyspa_Data.js")
s2 = re.sub(r'        \{ from: 162, cells: \[\[\d+, \d+\], \[\d+, \d+\]\], to: 165,[^\n]*\n', '', s)
s2 = re.sub(r'        \{ from: 165, cells: \[\[\d+, \d+\], \[\d+, \d+\]\], to: 162,[^\n]*\n', '', s2)
if s2 == s: raise SystemExit("Wyspa_Data.js: nie ma łachy 162 <-> 165")
s2 = s2.replace("    const LINKS = [\n", "    const LINKS = [\n        // (plansza 3x3, 2026-11-08) the sandbar 162 <-> 165 (the wreck) is out: the wreck is not used for now\n", 1)
save("Wyspa_Data.js", s2)

s = src("Orzel_Data.js")
s = re.sub(r"    const WAY_UP = \{ map: GORY, cells: \[\[[^\n]*\n",
           "    // (plansza 3x3, 2026-11-08) the climb to Orla Grań is out for now (the ridge is not used): no cells\n    const WAY_UP = { map: GORY, cells: [], stand: [], to: MAP, land: [20, 57], dir: 8 };\n", s)
dy13 = BOARD[13][3]
s = re.sub(r"to: GORY, land: \[(\d+), (\d+)\], dir: 2 \};[^\n]*", lambda m: "to: GORY, land: [%s, %d], dir: 2 };   // (plansza 3x3: Góry +%d rows)" % (m.group(1), 7 + dy13, dy13), s)
save("Orzel_Data.js", s)

s = src("CzerwonaWoda.js")
m = re.search(r"const BRZEG_MAPS = \[([^\]]*)\];", s)
ids = [int(v) for v in m.group(1).split(",")]
for a in (3, 4, 13, 24, 111):
    if a not in ids: ids.append(a)
s = s[:m.start(1)] + ", ".join(str(v) for v in ids) + s[m.end(1):]
save("CzerwonaWoda.js", s)
print("odstawione: wóz (Leśna droga, postój przystani), łacha wraku, wspinaczka orła; pas brzegu na mapach planszy z morzem")
