# -*- coding: utf-8 -*-
"""Wielki wrak na mieliźnie (gracz 2026-11-07: „grafika wraku na mieliźnie do zmiany - ten statek powinien być wielki, ze 3 albo 4
razy większy”). Dwie połówki okrętu z PixelLab (tools/wrak_duzy/surowe: dziob.png, rufa.png, 688x384, w stylu starego wraku) przycięte
do swoich pikseli -> img/characters/!$1_Wrak_Dziob_Duzy.png, !$1_Wrak_Rufa_Duzy.png (jeden obrazek = jedna klatka, TawernaCore
„!$1_”). Map165: dziób (zdarzenie 1) w (12,16), rufa (2) w (26,16); kadłub zamknięty przez <Occupy> (dziób x 7-18, rufa x 26-31,
dwie blokady 3 i 4 na x 21-24 i na kolumnę 25 nad dziurą), rzędy 12-16; dziura w burcie (40) w (25,16) - wchodzi się z (25,17)
w górę; dawne blokady kadłuba 5-39 usunięte; bandera (41) na (33,18). Map166: wyjście przez dziurę ląduje na (25,17).
  python tools/wrak_duzy/zmien.py             (obrazki + kopie map w tools/wrak_duzy/staging/data)
  python tools/wrak_duzy/zmien.py --wykonaj   (do data/ - TYLKO przy zamkniętym edytorze; kopie: kopie_zapasowe/<czas>)"""
import datetime, json, os, shutil, sys
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as W
STG = os.path.join(HERE, "staging", "data")
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

PICS = {"dziob": "!$1_Wrak_Dziob_Duzy", "rufa": "!$1_Wrak_Rufa_Duzy"}


def pictures():
    for src, name in PICS.items():
        im = Image.open(os.path.join(HERE, "surowe", src + ".png")).convert("RGBA")
        bb = im.split()[3].point(lambda v: 255 if v > 16 else 0).getbbox()
        # (cropped to its pixels; an even width keeps the anchored middle on a whole pixel)
        x0, y0, x1, y1 = bb
        if (x1 - x0) % 2: x1 += 1
        im.crop((x0, y0, x1, y1)).save(os.path.join(ROOT, "img", "characters", name + ".png"))
        print("  %s.png %dx%d" % (name, x1 - x0, y1 - y0))


def occupy(note, spec):
    import re
    note = re.sub(r"<Occupy:[^>]*>", "", note or "")
    return note + "<Occupy:" + spec + ">"


def blank_page(page):
    p = json.loads(json.dumps(page))
    p["image"] = {"tileId": 0, "characterName": "", "direction": 2, "pattern": 0, "characterIndex": 0}
    p["list"] = [{"code": 0, "indent": 0, "parameters": []}]
    p["priorityType"] = 1
    p["trigger"] = 0
    return p


# (2026-11-07, second pass: the halves 35% bigger - tools/wrak_duzy/zloz135.py; 826x459 and 818x481) the layout for them, built from
# the map as it was before the first pass (--baza kopie_zapasowe/20261107_142720)
BASE = sys.argv[sys.argv.index("--baza") + 1] if "--baza" in sys.argv else None
L = dict(bow=(11, "left=6,right=6,up=4"), stern=(27, "left=0,right=7,up=4"), b3=(20, 16, "right=5,up=4"), b4=(26, 15, "up=3"),
         breach=(26, 16), flag=(34, 19), cargo_ev=(19, 17), mast=((29, 18), (30, 18)), gap=18, exit=(26, 17))


def map165():
    path = os.path.join(ROOT, "data", "Map165.json")
    raw = open(os.path.join(BASE, "Map165.json") if BASE else path, "rb").read()
    m = json.loads(raw.decode("utf-8"))
    if W.map_text(m).encode("utf-8") != raw: raise SystemExit("Map165 nie w układzie edytora")
    ev = m["events"]
    def at(i, x, y): ev[i]["x"], ev[i]["y"] = x, y
    # the bow and the stern: the big pictures, the hull's cells blocked
    for i, key, x, spec in ((1, "dziob", L["bow"][0], L["bow"][1]), (2, "rufa", L["stern"][0], L["stern"][1])):
        for p in ev[i]["pages"]: p["image"]["characterName"] = PICS[key]; p["image"]["direction"] = 2; p["image"]["pattern"] = 0
        at(i, x, 16)
        ev[i]["note"] = occupy(ev[i]["note"], spec)
    # two of the old hull blockers close the rest of the stern round the breach; the others go
    for i, x, y, spec, name in ((3, L["b3"][0], L["b3"][1], L["b3"][2], "Blokada: kadłub rufy"), (4, L["b4"][0], L["b4"][1], L["b4"][2], "Blokada: kadłub nad dziurą")):
        ev[i]["pages"] = [blank_page(ev[i]["pages"][0])]
        ev[i]["name"] = name
        ev[i]["note"] = "<Occupy:" + spec + ">"
        at(i, x, y)
    for i in range(5, 40):
        if ev[i] and ev[i]["name"].startswith("Blokada: kad"): ev[i] = None
    at(40, *L["breach"])  # the breach
    at(41, *L["flag"])    # the torn flag, off the bow
    at(42, *L["cargo_ev"])  # the cargo's crates: by the crates in the gap
    at(43, *L["mast"][0]); at(44, *L["mast"][1])   # the broken mast and its blocker: off the way to the breach
    # the cargo (B-E tiles: two crates 2x2 and two barrels) stood where the stern lies now: moved into the gap between the halves,
    # spilled from the broken middle
    W_, H_, d = m["width"], m["height"], m["data"]; n = W_ * H_
    g = L["gap"]
    moves = [((21, 15), (g, 15)), ((22, 15), (g + 1, 15)), ((21, 16), (g, 16)), ((22, 16), (g + 1, 16)),
             ((23, 14), (g, 13)), ((23, 15), (g, 14)), ((24, 14), (g + 1, 13)), ((24, 15), (g + 1, 14))]
    cells = {}
    for (src, dst) in moves:
        cells[src] = [d[z * n + src[1] * W_ + src[0]] for z in (2, 3)]
        for z in (2, 3): d[z * n + src[1] * W_ + src[0]] = 0
    for (src, dst) in moves:
        for k, z in enumerate((2, 3)): d[z * n + dst[1] * W_ + dst[0]] = cells[src][k]
    return path, raw, W.map_text(m).encode("utf-8")


def map166():
    path = os.path.join(ROOT, "data", "Map166.json")
    raw = open(os.path.join(BASE, "Map166.json") if BASE else path, "rb").read()
    m = json.loads(raw.decode("utf-8"))
    if W.map_text(m).encode("utf-8") != raw: raise SystemExit("Map166 nie w układzie edytora")
    n = 0
    for e in m["events"]:
        if not e: continue
        for p in e["pages"]:
            for c in p["list"]:
                if c["code"] == 201 and c["parameters"][0] == 0 and c["parameters"][1] == 165:
                    c["parameters"][2], c["parameters"][3], c["parameters"][4] = L["exit"][0], L["exit"][1], 2; n += 1
    print("  Map166: %d przejść na mieliznę -> %s" % (n, L["exit"]))
    return path, raw, W.map_text(m).encode("utf-8")


if "--bez-obrazkow" not in sys.argv: pictures()
files = [map165(), map166()]
if "--wykonaj" in sys.argv:
    W.need_editor_closed()
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(kop, exist_ok=True)
    for path, raw, new in files:
        open(os.path.join(kop, os.path.basename(path)), "wb").write(open(path, "rb").read())   # (the map as it is in data/ now)
        open(path, "wb").write(new)
    print("zapisane do data/; kopie:", kop)
else:
    os.makedirs(STG, exist_ok=True)
    for path, raw, new in files: open(os.path.join(STG, os.path.basename(path)), "wb").write(new)
    print("kopie w", STG)
