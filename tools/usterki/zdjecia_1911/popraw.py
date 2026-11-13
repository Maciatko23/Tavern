# -*- coding: utf-8 -*-
"""Poprawki ze zdjec gracza 2026-11-11 wieczorem (z biezacego data/ -> staging/data, nic w data/):
- dodatkowe slupki (B 216/217) przy koncach plotu na przejsciach: Map003 (77,43) (77,47) (42,45) (42,49), Map004 (34,67) (34,70)
- stog siana w zagrodzie dziadka (Map020, zdarzenie 11 !Tavern_Yard, obrazek 3 kratki szeroki): blokuje cala swoja szerokosc
python popraw.py"""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as WS
STG = os.path.join(HERE, "staging", "data")
DX, DY = 30, 10   # (krag menhirow: przesuniecie, nizej)

def load(mid):
    o, lay = WS.read_json("data/Map%03d.json" % mid); assert lay == "map"; return o
def save(m, mid):
    os.makedirs(STG, exist_ok=True)
    txt = WS.map_text(m).encode("utf-8")
    assert WS.map_text(json.loads(txt.decode("utf-8"))).encode("utf-8") == txt
    for i, e in enumerate(m["events"]): assert e is None or e["id"] == i, (mid, i)
    open(os.path.join(STG, "Map%03d.json" % mid), "wb").write(txt); print("Map%03d staged" % mid)
def at(m, z, x, y): return m["data"][(z * m["height"] + y) * m["width"] + x]
def put(m, z, x, y, t): m["data"][(z * m["height"] + y) * m["width"] + x] = t

# (map, x, y, layer, tile): the extra post beside the fence's own end
POSTS = {3: [(77, 43, 2, 216), (77, 47, 2, 216), (42, 45, 2, 217), (42, 49, 2, 217)],
         4: [(34, 67, 2, 216), (34, 67, 3, 217), (34, 70, 2, 216), (34, 70, 3, 217)]}
for mid, cells in POSTS.items():
    m = load(mid)
    for (x, y, z, t) in cells:
        if at(m, z, x, y) != t: raise SystemExit("STOP Map%03d (%d,%d) z%d: %d, a mial byc %d" % (mid, x, y, z, at(m, z, x, y), t))
        put(m, z, x, y, 0)
    save(m, mid)

m4 = json.loads(open(os.path.join(STG, "Map004.json"), "rb").read().decode("utf-8"))
for (eid, x0, y0, x1, y1) in ((408, 82, 91, 85, 94), (342, 77, 90, 73, 92), (354, 80, 93, 78, 97)):   # (sosny i suchy krzaczek z wnetrza kregu (80,88) / spod jego dolnego kamienia na wolne kratki obok)
    e = m4["events"][eid]
    if (e["x"], e["y"]) not in ((x0, y0), (x1, y1)): raise SystemExit("STOP Map004 zdarzenie %d nie stoi w (%d,%d)" % (eid, x0, y0))
    e["x"], e["y"] = x1, y1
# wnetrze kregu (9x9 wokol srodka): region 7 (Farming blockRegion - nic tu nie lezy ani nie rosnie: jagody, grzyby, ziola; po kratkach sie chodzi)
cx, cy = 50 + DX, 78 + DY
for y in range(cy - 4, cy + 5):
    for x in range(cx - 4, cx + 5):
        if at(m4, 5, x, y) not in (0, 7): raise SystemExit("STOP Map004 (%d,%d) ma juz region %d" % (x, y, at(m4, 5, x, y)))
        put(m4, 5, x, y, 7)
save(m4, 4)

m = load(20)
e = m["events"][11]
if not (e and e["x"] == 52 and e["y"] == 44 and e["pages"][0]["image"]["characterName"] == "!Tavern_Yard"): raise SystemExit("STOP Map020: zdarzenie 11 to nie stog")
if "<Occupy:" not in (e.get("note") or ""):
    e["note"] = "<Occupy:left=1,right=1>"
save(m, 20)

# ---- krag menhirow (Zakon, W/D36) z rogu ogrodzenia na Lace pod Gawra (srodek 50,78) na polane pod laskiem z jablonkami (88,89):
#      (polana (80,88) pod laskiem; 88,89 wypadlo w grze na suchym pasie przy brzegu) kazda kratka o ten sam wektor - okna godzin zagadki cienia Straznika zostaja te same (cien zalezy tylko od polozenia wzglednego)
def patch(rel, pairs):
    src = os.path.join(ROOT, rel); t = open(src, "rb").read().decode("utf-8")
    for a, b in pairs:
        if t.count(a) != 1: raise SystemExit("STOP %s: kotwica %r (%d)" % (rel, a[:70], t.count(a)))
        t = t.replace(a, b)
    dst = os.path.join(HERE, "staging", rel); os.makedirs(os.path.dirname(dst), exist_ok=True)
    open(dst, "wb").write(t.encode("utf-8")); print(rel, "staged")
mv = lambda x, y: "[%d, %d]" % (x + DX, y + DY)
STONES = [[50, 74], [53, 75], [54, 78], [53, 81], [50, 82], [47, 81], [46, 78]]
patch("js/plugins/Zakon_Data.js", [
    ("map: 4, centre: [50, 78], r: 4,   // (2026-11-11: Łąka under the Gawra; was Map018 centre (53,45), every cell moved by (-3, +33))",
     "map: 4, centre: %s, r: 4,   // (2026-11-11 evening: moved by (+30, +10) from the fence's corner (50,78) to the glade under the grove - the player; before: Map018 centre (53,45))" % mv(50, 78)),
    ("stones: [[50, 74], [53, 75], [54, 78], [53, 81], [50, 82], [47, 81], [46, 78]], stoneIds: 2760,",
     "stones: [%s], stoneIds: 2760," % ", ".join(mv(x, y) for x, y in STONES)),
    ("watchman: { x: 47, y: 75, id: 2767,", "watchman: { x: %d, y: %d, id: 2767," % (47 + DX, 75 + DY)),
    ("plate: { x: 50, y: 78, id: 2768 }, hole: { x: 49, y: 76, id: 2769 },", "plate: { x: %d, y: %d, id: 2768 }, hole: { x: %d, y: %d, id: 2769 }," % (50 + DX, 78 + DY, 49 + DX, 76 + DY)),
    ("back: [50, 79]   // where the steps of the chamber come out", "back: %s   // where the steps of the chamber come out" % mv(50, 79)),
    ('{ key: "menhiry_krag", map: 4, x: 50, y: 78, near: 4,', '{ key: "menhiry_krag", map: 4, x: %d, y: %d, near: 4,' % (50 + DX, 78 + DY)),
    ('{ key: "cien_straznika", map: 4, x: 49, y: 76, near: -1,', '{ key: "cien_straznika", map: 4, x: %d, y: %d, near: -1,' % (49 + DX, 76 + DY)),
])
patch("tests/zakon_test.js", [
    ("    await go(4, 49, 78, 12);\n", "    await go(4, %d, %d, 12);   // (the ring: ZakonData RING, moved 2026-11-11 to the glade under the apple grove)\n" % (49 + DX, 78 + DY)),
    ("    await t.eval(`__near(49, 76); window.__kit.pops.length = 0; 0`);", "    await t.eval(`__near(%d, %d); window.__kit.pops.length = 0; 0`);" % (49 + DX, 76 + DY)),
    ("Survival.calmWeather(); $gameScreen.clearWeather(); __near(49, 76); return 0;", "Survival.calmWeather(); $gameScreen.clearWeather(); __near(%d, %d); return 0;" % (49 + DX, 76 + DY)),
    ("    await t.eval(`$gamePlayer.locate(50, 79); 0`);", "    await t.eval(`$gamePlayer.locate(%d, %d); 0`);" % (50 + DX, 79 + DY)),
    ('t.check("schody komory wyprowadzają na Łąkę menhirów (50,79)", up && (await t.json(`[$gamePlayer.x, $gamePlayer.y]`)).join() === "50,79");',
     't.check("schody komory wyprowadzają na Łąkę menhirów (%d,%d)", up && (await t.json(`[$gamePlayer.x, $gamePlayer.y]`)).join() === "%d,%d");' % (50 + DX, 79 + DY, 50 + DX, 79 + DY)),
])
