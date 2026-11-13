# -*- coding: utf-8 -*-
"""Przepięcia wtyczek i testów dla Kruczogrodu w czterech dzielnicach (tools/miasto5): stara mapa Winlu wraca, więc
  1) odwraca przepięcia miasta v2 (tools/miasto4/przepiecia.json: nowa -> stara),
  2) potem przepięcia miasta v1 (tools/miasto3/przepiecia.json) - wartość końcowa = stara kratka starej mapy, chyba że
     KONIEC mówi inaczej (to, co stoi teraz gdzie indziej: bramy, obóz W6, postój wozu, szubienica, pola, dzwonnica, lądowiska orła),
  3) dopisuje NOWE (testy i miejsca spoza obu list).
Każda zamiana wymaga dokładnie jednego trafienia. Nic nie instaluje: kopie do tools/miasto5/staging/<ścieżka>.
  python tools/miasto5/przepnij5.py"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
STG = os.path.join(HERE, "staging")
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
L4 = json.load(open(os.path.join(ROOT, "tools", "miasto4", "przepiecia.json"), encoding="utf-8"))["zmiany"]
L3 = json.load(open(os.path.join(ROOT, "tools", "miasto3", "przepiecia.json"), encoding="utf-8"))["zmiany"]
CAMP = lambda x, y: (x + 31, y + 8)          # the W6 camp: from under the old south wall to the field x75-101 y93-105
# (file, old-map text) -> final text; anything not listed goes back to the old-map text
KONIEC = {
    ("js/plugins/Act3_Data.js", "bell: [85, 30], bellStand: [85, 31],"): "bell: [45, 103], bellStand: [45, 104],",   # the bell tower moved (-40, +73)
    ("js/plugins/TownLife_Data.js", "brama_wsch: [100, 51, 4], brama_pld: [52, 92, 2]"): "brama_wsch: [116, 49, 4], brama_pld: [31, 109, 2]",
    ("js/plugins/TownLife_Data.js", "pod_murem: [58, 90, 2], stodola: [48, 90, 2]"): "pod_murem: [%d, %d, 2], stodola: [%d, %d, 2]" % (CAMP(58, 90) + CAMP(48, 90)),
    ("js/plugins/TownLife_Data.js", "woz_pld: [54, 90, 2]"): "woz_pld: [35, 108, 2]",
    ("js/plugins/TownLife_Data.js", "w6_ognisko: [60, 90, 4]"): "w6_ognisko: [%d, %d, 4]" % CAMP(60, 90),
    ("js/plugins/Podroznicy_Data.js", "podr_droga: [52, 92, 2], podr_przystan: [52, 92, 2], podr_dwor: [100, 51, 6]"):
        "podr_droga: [31, 109, 2], podr_przystan: [31, 109, 2], podr_dwor: [116, 49, 6]",
    ("js/plugins/Dwor_Data.js", "out: [8, 102, 51, 4]"): None,                 # None = keep the v1 value (inside the new east gate)
    ("js/plugins/Dwor_Data.js", "town: { gate: [100, 51], f9: [50, 46, 8] }"): None,
    ("js/plugins/Dwor_Data.js", "TLD.SPOTS.brama_wsch || [100, 51, 4]"): None,
    ("js/plugins/TownQuests.js", "map: TOWN, x: 102, y: 51, dir: 4"): None,
    ("js/plugins/TownQuests_Data.js", "south_gate: { map: 8, id: 956, x: 53, y: 93,"): "south_gate: { map: 8, id: 956, x: 32, y: 110,",
    ("js/plugins/TownQuests_Data.js", "east_brazier: { map: 8, id: 958, x: 101, y: 49,"): None,
    ("js/plugins/TownQuests_Data.js", "w6_tent1: { map: 8, id: 903, x: 58, y: 92,"): "w6_tent1: { map: 8, id: 903, x: %d, y: %d," % CAMP(58, 92),
    ("js/plugins/TownQuests_Data.js", "w6_fire: { map: 8, id: 905, x: 59, y: 90,"): "w6_fire: { map: 8, id: 905, x: %d, y: %d," % CAMP(59, 90),
    ("js/plugins/TownQuests_Data.js", "w6_tent2: { map: 8, id: 904, x: 46, y: 90,"): "w6_tent2: { map: 8, id: 904, x: %d, y: %d," % CAMP(46, 90),
    ("js/plugins/TownQuests_Data.js", "w6_bogdan: { map: 8, id: 906, x: 50, y: 90,"): "w6_bogdan: { map: 8, id: 906, x: %d, y: %d," % CAMP(50, 90),
    ("js/plugins/TownQuests_Data.js", "w6_halina: { map: 8, id: 907, x: 56, y: 91,"): "w6_halina: { map: 8, id: 907, x: %d, y: %d," % CAMP(56, 91),
    ("js/plugins/Kantor_Data.js", "gateIn: [52, 104], gateOut: [52, 105], east: [101, 50]"): None,
    ("js/plugins/Woz.js", "miasto: { map: 8, woz: [56, 90], woznica: [54, 90, 2], land: [52, 90, 6] }"):
        "miasto: { map: 8, woz: [37, 108], woznica: [35, 108, 2], land: [34, 108, 6] }",
    ("js/plugins/Underground_Data.js", "{ ludmila: [57, 90, 6], ela: [58, 91, 8], marek: [59, 90, 4], rafal: [55, 90, 6] }"):
        "{ ludmila: [%d, %d, 6], ela: [%d, %d, 8], marek: [%d, %d, 4], rafal: [%d, %d, 6] }" % (CAMP(57, 90) + CAMP(58, 91) + CAMP(59, 90) + CAMP(55, 90)),
    ("js/plugins/Dezerter_Data.js", "oboz: [MAP.miasto, 57, 89, 2]"): "oboz: [MAP.miasto, %d, %d, 2]" % CAMP(57, 89),
    ("js/plugins/Garnizon_Data.js", "search: [{ id: 657, x: 59, y: 89 }, { id: 658, x: 47, y: 89 }]"):
        "search: [{ id: 657, x: %d, y: %d }, { id: 658, x: %d, y: %d }]" % (CAMP(59, 89) + CAMP(47, 89)),
    ("js/plugins/Zakon_Data.js", "const GALLOWS = { map: 8, x: 87, y: 121, w: 3, h: 3, id: 2840, at: [88, 123], creak: [22, 3] };"):
        "const GALLOWS = { map: 8, x: 113, y: 96, w: 3, h: 3, id: 2840, at: [114, 98], creak: [22, 3] };",
    ("js/plugins/Zakon_Data.js", '{ key: "szubienica", map: 8, x: 88, y: 124, near: 2,'): '{ key: "szubienica", map: 8, x: 114, y: 99, near: 2,',
    ("js/plugins/Zakon.js", "[TK.f9.szubienica, 8, 88, 125]"): "[TK.f9.szubienica, 8, 114, 100]",
    ("js/plugins/Orzel_Data.js", "8: [[29, 17, 76, 27], [30, 37, 73, 63], [2, 89, 101, 92]],"): "8: [[29, 17, 76, 27], [30, 37, 73, 63], [2, 107, 117, 109]],",
}
# texts built from the v1 strings (the Okolice / Zasoby place and field lines are long - only their coordinates change)
SUB = {"szubienica": ("x: 87, y: 108", "x: 113, y: 96"),
       "pole_1": ("x: 6, y: 108, w: 8, h: 4", "x: 77, y: 68, w: 7, h: 4"),
       "pole_2": ("x: 74, y: 108, w: 8, h: 4", "x: 86, y: 68, w: 6, h: 4"),
       "pole_3": ("x: 62, y: 108, w: 8, h: 5", "x: 77, y: 80, w: 7, h: 5")}
# tests and spots outside both lists (old-map text -> new); tests start where the thing now is
NOWE = [
    ("tests/garnizon_test.js", "map: 8, x: 58, y: 89,", "map: 8, x: %d, y: %d," % CAMP(58, 89)),
    ("tests/w6_test.js", "map: 8, x: 58, y: 89,", "map: 8, x: %d, y: %d," % CAMP(58, 89)),
    ("tests/w6_test.js", "t.go(8, 49, 89, 2)", "t.go(8, %d, %d, 2)" % CAMP(49, 89)),
    ("tests/mapa_woz_test.js", "t.go(8, 50, 90, 6)", "t.go(8, 34, 108, 6)"),
    ("tests/stajnia_test.js", "t.go(8, 52, 90, 6)", "t.go(8, 34, 108, 6)"),
    ("tests/zasoby_test.js", "t.go(8, 10, 109, 8)", "t.go(8, 80, 73, 8)"),
    ("js/plugins/Okolice_Data.js", "8: [104, 103], ", "8: [0, 0], "),            # (the town map is all town now: no "old part" check)
    ("js/plugins/TownQuests_Data.js", "w3_kupala: { map: 8, id: 959, x: 51, y: 90,", "w3_kupala: { map: 8, id: 959, x: 26, y: 107,"),  # by the new south gate
    ("tests/regulars_quests_test.js", "t.go(8, 51, 92, 8)", "t.go(8, 26, 109, 8)"),
    # the horses: the yard under stable A (fence x82 / x100 / y24, the stable's door 92,10), troughs against the west fence x83
    ("js/plugins/Konie.js", "const YARD = { x0: 63, x1: 77, y0: 9, y1: 24 };    // the cells a horse may stand on (the fence is 61 / 79 / 26; the buildings are held by the map)",
     "const YARD = { x0: 84, x1: 98, y0: 11, y1: 22 };   // the cells a horse may stand on (the fence is 82 / 100 / 24; stable A above row 11, the hay wagon on row 23)"),
    ("js/plugins/Konie.js", "against the west fence (x 62), a free cell row between them (y 20)", "against the west fence (x 83), a free cell row between them (y 18)"),
    ("js/plugins/Konie.js", "{ x: 62, y: 19, len: 3,", "{ x: 83, y: 17, len: 3,"),
    ("js/plugins/Konie.js", "{ x: 62, y: 23, len: 3,", "{ x: 83, y: 21, len: 3,"),
    ("js/plugins/Konie.js", "const DOOR_FALLBACK = { x: 75, y: 13 };", "const DOOR_FALLBACK = { x: 92, y: 10 };"),
    ("js/plugins/Konie.js", "at: [66, 17]", "at: [88, 16]"), ("js/plugins/Konie.js", "at: [72, 19]", "at: [94, 18]"),
    ("js/plugins/Konie.js", "at: [70, 22]", "at: [92, 21]"), ("js/plugins/Konie.js", "at: [74, 16]", "at: [96, 14]"),
    ("js/plugins/Konie.js", "at: [67, 21]", "at: [89, 20]"),
    ("tests/konie_test.js", "const HERO = [73, 28];", "const HERO = [103, 18];"),
    ("tests/konie_test.js", "(62, 17-19 and 21-23, row 20 free)", "(83, 15-17 and 19-21, row 18 free)"),
    ("tests/konie_test.js", "[[62, 19, false, false], [62, 19, true, false], [62, 18, true, false], [62, 17, true, false], [62, 23, false, false], [62, 23, true, false], [62, 22, true, false], [62, 21, true, false]]",
     "[[83, 17, false, false], [83, 17, true, false], [83, 16, true, false], [83, 15, true, false], [83, 21, false, false], [83, 21, true, false], [83, 20, true, false], [83, 19, true, false]]"),
    ("tests/konie_test.js", "geo.door.x === 75 && geo.door.y === 13", "geo.door.x === 92 && geo.door.y === 10"),
    ("tests/konie_test.js", "s.x === 63 && [17, 18, 21, 22].includes(s.y) && /_Pije$/", "s.x === 84 && [15, 16, 19, 20].includes(s.y) && /_Pije$/"),
    ("tests/konie_test.js", "const trough = cx === 62 && ((s.y >= 17 && s.y <= 19) || (s.y >= 21 && s.y <= 23)), drinkingHead = trough && s.d === 4 && s.x === 63 && cx === headX && [17, 18, 21, 22].includes(s.y);",
     "const trough = cx === 83 && ((s.y >= 15 && s.y <= 17) || (s.y >= 19 && s.y <= 21)), drinkingHead = trough && s.d === 4 && s.x === 84 && cx === headX && [15, 16, 19, 20].includes(s.y);"),
    ("tests/konie_test.js", "[[68, 17], [68, 22], [68, 20], [70, 18], [72, 22]]", "[[89, 15], [89, 20], [89, 18], [91, 16], [93, 20]]"),
    ("tests/konie_test.js", "[[66, 15, 6], [71, 16, 6], [67, 19, 4], [73, 18, 4], [69, 22, 6]]", "[[87, 13, 6], [92, 14, 6], [88, 17, 4], [94, 16, 4], [90, 20, 6]]"),
    ("tests/konie_test.js", "s.x >= 62 && s.x <= 78 && s.y >= 9 && s.y <= 25 && !(Math.abs(s.x - 75) <= 1 && s.y <= 15 && s.y > 13)",
     "s.x >= 83 && s.x <= 99 && s.y >= 11 && s.y <= 23 && !(Math.abs(s.x - 92) <= 1 && s.y <= 12 && s.y > 10)"),
    ("tests/konie_test.js", "loaded.every(s => s.x >= 62 && s.x <= 78 && s.y >= 9 && s.y <= 25 || s.hidden)", "loaded.every(s => s.x >= 83 && s.x <= 99 && s.y >= 11 && s.y <= 23 || s.hidden)"),
]
NOWE_ALL = [("tests/garnizon_test.js", "t.go(8, 58, 89, 8)", "t.go(8, %d, %d, 8)" % CAMP(58, 89)),
            ("tests/w6_test.js", "t.go(8, 57, 89, 2)", "t.go(8, %d, %d, 2)" % CAMP(57, 89))]

texts, log, errors = {}, [], []
def text(f):
    if f not in texts: texts[f] = open(os.path.join(ROOT, f), encoding="utf-8", newline="").read()
    return texts[f]
def swap(f, a, b, why, every=False):
    t = text(f); c = t.count(a)
    if c == 0 or (c > 1 and not every): errors.append("%s: %d trafień '%s'" % (f, c, a[:70])); return
    texts[f] = t.replace(a, b); log.append("%-34s %s -> %s  [%s]" % (os.path.basename(f), a[:60], b[:60], why))

for z in L4:                                   # 1) back from v2
    old = z["stara"]; fin = KONIEC.get((z["plik"], old), old)
    swap(z["plik"], z["nowa"], fin if fin is not None else old, "v2 -> stara mapa")
for z in L3:                                   # 2) back from v1 (or a new spot)
    key = (z["plik"], z["stara"])
    if key in KONIEC:
        fin = KONIEC[key]
        if fin is None: continue                # (the v1 value fits the new east gate)
    elif any(('"%s"' % name) in z["stara"] for name in SUB):
        continue                                # (Okolice / Zasoby places: changed in the current text below)
    else:
        fin = z["stara"]
    if fin != z["nowa"]: swap(z["plik"], z["nowa"], fin, "v1 -> nowe miasto")
for f in ("js/plugins/Okolice_Data.js", "js/plugins/Zasoby_Data.js"):
    for name, (a, b) in SUB.items():
        if a in text(f): swap(f, a, b, name)
for f, a, b in NOWE: swap(f, a, b, "nowe")
for f, a, b in NOWE_ALL: swap(f, a, b, "nowe (wszystkie)", every=True)

# the horse test's remaining yard cells (poses, the hero's spots): the yard moved by (+21, -2), never above row 11 (stable A)
import re
def yard(m):
    x, y = int(m.group(2)), int(m.group(3)); return "%s%d, %d" % (m.group(1), x + 21, max(11, y - 2))
f = "tests/konie_test.js"; t0 = text(f)
t1 = re.sub(r"(Konie\.pose\(\d, )(\d+), (\d+)", yard, t0)
t1 = re.sub(r"(\$gamePlayer\.locate\()(\d+), (\d+)", lambda m: "%s103, 18" % m.group(1) if (m.group(2), m.group(3)) == ("73", "28") else yard(m), t1)
t1 = t1.replace("const R = { x0: 63, x1: 77, y0: 9, y1: 24 };", "const R = { x0: 84, x1: 98, y0: 11, y1: 22 };")
t1 = t1.replace("Konie.pose(i, 66 + i * 2, 20,", "Konie.pose(i, 87 + i * 2, 18,").replace("(x 61 / 79, y 26)", "(x 82 / 100, y 24)").replace("e.locate(70, 20);", "e.locate(91, 18);")
if t1 != t0: texts[f] = t1; log.append("konie_test.js: kratki podwórza (+21, -2)")
for l in log: print(l)
if errors:
    print("BŁĘDY:"); [print("  " + e) for e in errors]; raise SystemExit(1)
for f, t in texts.items():
    out = os.path.join(STG, *f.split("/")); os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, "w", encoding="utf-8", newline="").write(t)
print("zmienione pliki: %d -> %s" % (len(texts), STG))
