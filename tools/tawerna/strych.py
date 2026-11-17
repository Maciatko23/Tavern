# -*- coding: utf-8 -*-
"""Strych tawerny (gracz 2026-11-16: „strych, do którego wejście jest na razie ukryte i zamknięte”). Nowa mapa 49 x 42 (Map028)
nad piętrem II: dwie części poddasza przedzielone ścianą z desek, graty ze składziku parteru (beczki, skrzynie, półki).
Wejście: regał w bibliotece na piętrze II (Map026, 24,3) - na razie tylko myśl bohatera; strona z przełącznikiem D (ukryte
przejście odkryte) przenosi na strych. Ze strychu wraca się klapą.
  python tools/tawerna/strych.py <podglad.png>             (tylko obraz)
  python tools/tawerna/strych.py <podglad.png> --wykonaj   (Map028, MapInfos, regał na Map026; edytor zamknięty)"""
import copy, datetime, importlib.util, json, os, re, shutil, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy")); sys.path.insert(0, os.path.join(ROOT, "tools", "mapy", "pieczatki"))
import mapylib as L
import pieczatki as PZ
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)
ID, NW, NH = 28, 49, 42
C = lambda code, params, indent=0: {"code": code, "indent": indent, "parameters": params}
COND = {"actorId": 1, "actorValid": False, "itemId": 1, "itemValid": False, "selfSwitchCh": "A", "selfSwitchValid": False, "switch1Id": 1, "switch1Valid": False,
        "switch2Id": 1, "switch2Valid": False, "variableId": 1, "variableValid": False, "variableValue": 0}


def page(lst, pri=1, trigger=0, sw=None):
    c = dict(COND)
    if sw: c["selfSwitchCh"], c["selfSwitchValid"] = sw, True
    return {"conditions": c, "directionFix": True, "image": {"tileId": 0, "characterName": "", "direction": 2, "pattern": 1, "characterIndex": 0}, "list": lst + [C(0, [])],
            "moveFrequency": 3, "moveRoute": {"list": [{"code": 0, "parameters": []}], "repeat": True, "skippable": False, "wait": False}, "moveSpeed": 3, "moveType": 0,
            "priorityType": pri, "stepAnime": False, "through": False, "trigger": trigger, "walkAnime": False}


def build():
    hall, _ = RW.read_json("data/Map001.json"); up, lay = RW.read_json("data/Map026.json")
    assert hall["tilesetId"] == up["tilesetId"] == 8 and (hall["width"], up["width"]) == (49, 49)
    s1 = np.array(hall["data"], dtype=np.int64).reshape(6, hall["height"], hall["width"])
    s2 = np.array(up["data"], dtype=np.int64).reshape(6, up["height"], up["width"])
    new = np.zeros((6, NH, NW), dtype=np.int64)
    VOID = s2[:, 0, 0].copy(); new[:, :, :] = VOID[:, None, None]
    WALL = [s1[:, y, 30].copy() for y in (1, 2)]                 # the store's planks, a plain column
    FLOOR = s2[:, 8, 22].copy(); FLOOR[1:] = 0                      # the library's dark boards
    for c in WALL: c[1:4] = 0
    def face(y, x0, x1):
        for i in range(2): new[:, y + i, x0:x1 + 1] = WALL[i][:, None]
    def floor(y0, y1, x0, x1): new[:, y0:y1 + 1, x0:x1 + 1] = FLOOR[:, None, None]
    face(1, 1, 47); floor(3, 19, 1, 47)
    face(21, 1, 47); floor(23, 40, 1, 47)
    for x0 in (10, 35): floor(20, 23, x0, x0 + 2)                   # the two ways through the partition
    for z in (0, 1): PZ.przelicz_warstwe(new[z], {(x, y) for y in range(NH) for x in range(NW)})
    def stamp(sx0, sy0, sx1, sy1, nx, ny):                          # a piece of the store's things (upper layers, shadows)
        for z in (2, 3, 4):
            blk = s1[z, sy0:sy1 + 1, sx0:sx1 + 1]
            dst = new[z, ny:ny + blk.shape[0], nx:nx + blk.shape[1]]
            dst[blk != 0] = blk[blk != 0]
    SHELF_A, SHELF_B, BARRELS, CRATES = (35, 2, 37, 3), (44, 2, 47, 3), (30, 6, 33, 7), (43, 6, 47, 7)
    for nx in (2, 30): stamp(*SHELF_A, nx, 2)
    for nx in (14, 42): stamp(*SHELF_B, nx, 2)
    for nx in (3, 24, 41): stamp(*SHELF_A, nx, 22)
    for nx in (16, 29): stamp(*SHELF_B, nx, 22)
    for nx, ny in ((2, 8), (40, 6), (30, 15), (4, 30), (20, 37), (42, 33)): stamp(*BARRELS, nx, ny)
    for nx, ny in ((14, 13), (36, 11), (2, 16), (28, 28), (12, 36), (40, 38), (6, 25)): stamp(*CRATES, nx, ny)
    back = [C(250, [{"name": "Open1", "volume": 70, "pitch": 80, "pan": 0}]), C(221, []), C(201, [0, 26, 24, 4, 2, 2]), C(222, [])]
    hatch = {"id": 1, "name": "Klapa -> Biblioteka", "note": "", "pages": [page(back, pri=0, trigger=1)], "x": 24, "y": 6}
    out = copy.deepcopy(up)
    out.update({"width": NW, "height": NH, "displayName": "Strych", "autoplayBgm": False, "data": [int(v) for v in new.reshape(-1)], "events": [None, hatch],
                "note": "<Dust:off>\n<Dark:on>\n<DayNight:off>\n<DarkDay:120>\n<DarkNight:215>"})
    return up, lay, out


def main():
    up, lay, out = build()
    png = next((a for a in sys.argv[1:] if a.lower().endswith(".png")), None)
    if png: L.render(L.Mapa(ID, raw=out), grid=True).convert("RGB").save(png); print("podgląd:", png)
    if "--wykonaj" not in sys.argv: print("(podgląd - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "tawerna_strych_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S")); os.makedirs(bak, exist_ok=True)
    dst = os.path.join(ROOT, "data", "Map%03d.json" % ID)
    if os.path.exists(dst): raise SystemExit("Map%03d już jest." % ID)
    open(dst, "wb").write(RW.json_text(out, lay))
    mi, mlay = RW.read_json("data/MapInfos.json"); shutil.copy2(os.path.join(ROOT, "data", "MapInfos.json"), bak)
    order = next(m["order"] for m in mi if m and m["id"] == 26) + 1
    for m in mi:
        if m and m["order"] >= order: m["order"] += 1
    while len(mi) <= ID: mi.append(None)
    mi[ID] = {"id": ID, "expanded": False, "name": "Strych", "order": order, "parentId": 1, "scrollX": 0, "scrollY": 0}
    open(os.path.join(ROOT, "data", "MapInfos.json"), "wb").write(RW.json_text(mi, mlay))
    # the bookcase in the library: words only for now; with its self switch D - the way up
    shutil.copy2(os.path.join(ROOT, "data", "Map026.json"), bak)
    say = [C(101, ["", 0, 0, 2, ""]), C(401, ["Regał z księgami rachunkowymi, gruby od kurzu. Stoi mocno, ani drgnie."])]
    go = [C(250, [{"name": "Open1", "volume": 70, "pitch": 80, "pan": 0}]), C(221, []), C(201, [0, ID, 24, 7, 2, 2]), C(222, [])]
    if not any(e and e["name"].startswith("Regał (ukryte") for e in up["events"]):
        up["events"].append({"id": len(up["events"]), "name": "Regał (ukryte wejście na strych)", "note": "", "pages": [page(say), page(go, sw="D")], "x": 24, "y": 3})
        open(os.path.join(ROOT, "data", "Map026.json"), "wb").write(RW.json_text(up, lay))
    sp = os.path.join(ROOT, "data", "System.json"); shutil.copy2(sp, bak); s = open(sp, "rb").read()
    open(sp, "wb").write(re.sub(rb'"versionId":(\d+)', lambda k: b'"versionId":' + str(int(k.group(1)) + 1).encode(), s, count=1))
    print("Zapisano Map%03d, MapInfos, regał na Map026; kopia: %s" % (ID, bak))


if __name__ == "__main__":
    main()
