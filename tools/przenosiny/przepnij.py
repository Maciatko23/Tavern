# -*- coding: utf-8 -*-
"""Kratki wtyczek, testów i przejść po przenosinach działki (Map003) i domu dziadka (Map020) - tools/przenosiny/przesuniecia.json:
kratka w starym prostokącie A -> +(dx, dy), w prostokącie łąki B -> -(dx, dy) (łąka przeszła na stare miejsce).
Wejście: spis z drzewa składni (scratch podzial/spis320.js -> spis320.json: obiekty z map: 3/20, go(), newGame(), reserveTransfer()...),
tylko rodzaje, które są położeniami (listy map, klatki animacji, liczby w danych broni - pominięte); ręcznie: Story.js (WEZ: podwórze
dziadka), Okolice_Data OLD (cała mapa to teraz nowa część), przejścia z Map019 i Map002. Testy przejść przez krawędź (swiat_etap2) bez zmian.
Kopie do tools/przenosiny/staging/<ścieżka>.   python tools/przenosiny/przepnij.py <spis320.json>"""
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as WS
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
STG = os.path.join(HERE, "staging")
SP = {int(k): v for k, v in json.load(open(os.path.join(HERE, "przesuniecia.json"))).items()}
def moved(mid, x, y):
    s = SP.get(mid)
    if not s: return None
    A, B, dx, dy = s["A"], s["B"], s["dx"], s["dy"]
    if A[0] <= x <= A[2] and A[1] <= y <= A[3]: return (x + dx, y + dy)
    if B[0] <= x <= B[2] and B[1] <= y <= B[3]: return (x - dx, y - dy)
    return None
KINDS_OK = re.compile(r"^(\{map\}\.(x/y|ruin\.x/y|well\.x/y|garden\.cells\[\d+\]|land\(x,y,dir\)|woz|woznica\(x,y,dir\))|go\(\)|reserveTransfer\(\))$")
WHITE = {("js/plugins/Okolice_Data.js", "[3]"), ("js/plugins/Okolice_Data.js", "[20]"), ("tests/mapa_probna_wydajnosc.js", "[id,x,y]")}
SKIP_LINES = {("tests/swiat_etap2_test.js", 26), ("tests/swiat_etap2_test.js", 27)}      # (walks over a map edge from the edge itself)
cen = json.load(open(sys.argv[1], encoding="utf-8"))
edits, log = {}, []
for o in cen:
    if "error" in o or len(o.get("value", [])) < 2 or o["map"] not in SP: continue
    f = o["file"].replace("\\", "/")
    if (f, o["line"]) in SKIP_LINES: continue
    ok = KINDS_OK.match(o["path"]) or (f, o["path"]) in WHITE or (f, "[id,x,y]") in WHITE and o["path"] == "[id,x,y]"
    if f == "js/plugins/Okolice_Data.js" and o["path"] in ("[3]", "[20]") and "ENTRY" not in o["text"]: ok = False
    if not ok: continue
    new = moved(o["map"], o["value"][0], o["value"][1])
    if not new: continue
    edits.setdefault(f, []).append((o["xs"], new[0])); edits.setdefault(f, []).append((o["ys"], new[1]))
    log.append("%-30s L%-5d map %d %s -> %s" % (os.path.basename(f), o["line"], o["map"], o["value"][:2], list(new)))
texts = {}
for f, es in edits.items():
    t = open(os.path.join(ROOT, f), encoding="utf-8", newline="").read()
    seen = set()
    for (s, e), v in sorted(es, key=lambda r: -r[0][0]):
        if (s, e) in seen: continue
        seen.add((s, e)); t = t[:s] + str(v) + t[e:]
    texts[f] = t
def swap(f, a, b):
    t = texts.get(f) or open(os.path.join(ROOT, f), encoding="utf-8", newline="").read()
    assert t.count(a) == 1, (f, a, t.count(a)); texts[f] = t.replace(a, b); log.append("%-30s %s -> %s" % (os.path.basename(f), a, b))
d20 = SP[20]["dx"], SP[20]["dy"]
swap("js/plugins/Story.js", "YARD_OUT: [15, 8], SIGN_AT: [14, 8],", "YARD_OUT: [%d, %d], SIGN_AT: [%d, %d]," % (15 + d20[0], 8 + d20[1], 14 + d20[0], 8 + d20[1]))
swap("js/plugins/Okolice_Data.js", "const OLD = { 3: [40, 30], 4: [40, 30], 8: [0, 0],", "const OLD = { 3: [0, 0], 4: [40, 30], 8: [0, 0],")
swap("js/plugins/Okolice_Data.js", " 20: [30, 22],", " 20: [0, 0],")
for l in log: print(l)
for f, t in texts.items():
    out = os.path.join(STG, *f.split("/")); os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, "w", encoding="utf-8", newline="").write(t)
# transfers from other maps into the moved boxes
import glob
for p in sorted(glob.glob(os.path.join(ROOT, "data", "Map[0-9][0-9][0-9].json"))):
    mid = int(os.path.basename(p)[3:6])
    if mid in SP: continue
    m = json.load(open(p, encoding="utf-8")); n = 0
    for e in m["events"]:
        if not e: continue
        for pg in e["pages"]:
            for c in pg["list"]:
                if c["code"] == 201 and c["parameters"][0] == 0 and c["parameters"][1] in SP:
                    new = moved(c["parameters"][1], c["parameters"][2], c["parameters"][3])
                    if new: print("Map%03d #%d %s -> %s" % (mid, e["id"], c["parameters"][1:4], list(new))); c["parameters"][2:4] = list(new); n += 1
    if n: open(os.path.join(STG, "data", os.path.basename(p)), "wb").write(WS.map_text(m).encode("utf-8"))
print("pliki: %d" % len(texts))
