# -*- coding: utf-8 -*-
"""Krucza Grań (Map029) - górne piętro Kruczych Turni (gracz 2026-11-16: „z kopalni idzie się przez górę i wychodzi wyżej na półkę
skalną i tam jest kruczarnia”, „osobna mapa, ale też nie za mała”, nazwa „Krucza Grań”; gniazdo orła pójdzie na osobną „Orlą Grań”).
80 x 80, zestaw kafli gór (11). Wszystko z gotowych kawałków:
  - skalna ściana od północy i urwisko od południa: pasy z Kruczych Turni (Map222), z ramą wylotu sztolni;
  - kruczarnia z wieżą: kafel w kafel ze starego miasta (Map008), z jej zdarzeniami (stożek dachu, pochodnia, żerdzie kruków, drzwi);
  - skały, suche krzaki i sosny: zdarzenia Kruczych Turni.
Połączenia: wylot sztolni (40,9) <-> drabina w szybie północno-zachodniej komory sztolni (Map225 13,5); drabinka linowa na krawędzi
(46,76) <-> skała przy wejściu do kopalni (Map222 44,9; widoczna dopiero, gdy bohater raz zejdzie nią z góry); drzwi kruczarni (15,20)
<-> wnętrze (Map214).
  python tools/nowy_swiat/krucza_gran.py <podglad.png>             (tylko obraz)
  python tools/nowy_swiat/krucza_gran.py <podglad.png> --wykonaj   (Map029, MapInfos, zdarzenia na Map222/225/214, obrazki; edytor zamknięty)"""
import copy, datetime, importlib.util, json, os, random, re, shutil, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy")); sys.path.insert(0, os.path.join(ROOT, "tools", "mapy", "pieczatki"))
import mapylib as L
import pieczatki as PZ
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

ID, NW, NH = 29, 80, 80                     # (the user 2026-11-16: „mapa ma być 80x80” - like the other maps of the new world)
SX = 0                                      # the mountains' columns 0..63 make the north wall and the south drop
ROCK = [1608, 1609, 1610, 1616, 1617, 1618]  # the rock mass (A5 of the mountains' tileset)
MOUTH, LADDER_TOP = (40, 9), (46, 76)
SHAFT = (13, 5)                             # Map225: the ladder in the north-west hall's wall; the hero stands at (13,6)
LADDER_BOTTOM = (44, 9)                     # Map222: on the rock beside the mine's entrance; the hero stands at (44,10)
HOUSE = dict(sx0=107, sy0=7, sx1=113, sy1=13, dx=10, dy=14)   # the old loft with its tower (Map008) -> its place here
C = lambda code, params: {"code": code, "indent": 0, "parameters": params}
COND = {"actorId": 1, "actorValid": False, "itemId": 1, "itemValid": False, "selfSwitchCh": "A", "selfSwitchValid": False, "switch1Id": 1, "switch1Valid": False,
        "switch2Id": 1, "switch2Valid": False, "variableId": 1, "variableValid": False, "variableValue": 0}


def page(name="", lst=None, pri=1, trigger=0, through=False, sw=None, direction=2, pattern=0, index=0):
    c = dict(COND)
    if sw: c["selfSwitchCh"], c["selfSwitchValid"] = sw, True
    return {"conditions": c, "directionFix": True, "image": {"tileId": 0, "characterName": name, "direction": direction, "pattern": pattern, "characterIndex": index},
            "list": (lst or []) + [C(0, [])], "moveFrequency": 3, "moveRoute": {"list": [{"code": 0, "parameters": []}], "repeat": True, "skippable": False, "wait": False},
            "moveSpeed": 3, "moveType": 0, "priorityType": pri, "stepAnime": False, "through": through, "trigger": trigger, "walkAnime": False}


def go(map_id, x, y, d, se="Move1"):
    return [C(250, [{"name": se, "volume": 70, "pitch": 90, "pan": 0}]), C(201, [0, map_id, x, y, d, 0])]


# ------------------------------------------------------------------------------------------------ the two pictures
WOOD_O, WOOD_D, WOOD_M, WOOD_L, ROPE = (48, 34, 26, 255), (84, 60, 42, 255), (116, 86, 58, 255), (150, 116, 80, 255), (176, 150, 104, 255)


def ladder(h, rope=False):
    """a ladder seen against a wall, 48 wide: two rails (ropes for the cliff's one), a rung every 12 px"""
    im = Image.new("RGBA", (48, h), (0, 0, 0, 0)); px = im.load()
    for y in range(h):
        for x0 in (12, 32):
            cols = [WOOD_O, ROPE, (140, 116, 78, 255), WOOD_O] if rope else [WOOD_O, WOOD_L, WOOD_M, WOOD_D, WOOD_O]
            if rope and y % 6 == 0: cols = [WOOD_O, (140, 116, 78, 255), ROPE, WOOD_O]          # (the twist of the rope)
            for i, c in enumerate(cols): px[x0 + i, y] = c
    for y in range(6, h - 4, 12):
        for x in range(13, 36):
            px[x, y] = WOOD_O; px[x, y + 1] = WOOD_L; px[x, y + 2] = WOOD_M; px[x, y + 3] = WOOD_O
    return im


def ladder_top():
    """the top of the rope ladder on the cliff's edge: two stakes driven into the ground, the ropes going over the lip"""
    im = Image.new("RGBA", (48, 48), (0, 0, 0, 0)); px = im.load()
    for x0 in (10, 31):
        for y in range(14, 34):
            for i, c in enumerate([WOOD_O, WOOD_L, WOOD_M, WOOD_M, WOOD_D, WOOD_O]): px[x0 + i, y] = c
        for i in range(6): px[x0 + i, 13] = WOOD_O; px[x0 + i, 34] = WOOD_O
        for y in range(26, 48):                                                                 # the rope from the stake down over the edge
            for i, c in enumerate([WOOD_O, ROPE, (140, 116, 78, 255), WOOD_O]): px[x0 + 1 + i, y] = c
        for i in range(8): px[x0 - 1 + i, 24] = WOOD_O; px[x0 - 1 + i, 25] = ROPE; px[x0 - 1 + i, 26] = WOOD_O   # the knot
    return im


PICS = {"!$1_Drabina_Szyb": lambda: ladder(96), "!$1_Drabina_Linowa": lambda: ladder(144, rope=True), "!$1_Drabina_Gora": ladder_top}


# ------------------------------------------------------------------------------------------------ the map
def build():
    gory, lay = RW.read_json("data/Map222.json"); miasto, _ = RW.read_json("data/Map008.json")
    assert gory["tilesetId"] == miasto["tilesetId"] == 11
    g = np.array(gory["data"], dtype=np.int64).reshape(6, gory["height"], gory["width"])
    t = np.array(miasto["data"], dtype=np.int64).reshape(6, miasto["height"], miasto["width"])
    new = np.zeros((6, NH, NW), dtype=np.int64)
    rnd = random.Random(2911)
    GRASS, DIRT = 2048 + 16 * 48, 2048 + 17 * 48          # (the mountains' grass is A2 kind 16, the trodden earth of the paths kind 17)
    new[0, :, :] = GRASS
    new[:, 0:10, :] = g[:, 2:12, SX:SX + NW]                       # the north wall (with the frame of the mine's mouth at x30..34)
    new[:, 70:80, :] = g[:, 68:78, SX:SX + NW]                     # the meadow's last rows, the lip, the rock below
    for y in range(0, 10):                                          # (the mountains' pond and waterfall came with the wall: plain wall from further west)
        for x in range(56, NW): new[:, y, x] = new[:, y, x - 44]
    for y in range(4, 10):                                          # (the mountains' western bay would open onto the map's edge: rock)
        for x in range(0, 3): new[:, y, x] = 0; new[0, y, x] = rnd.choice(ROCK)
    # the sides: the rock mass, its edge wandering a little
    lm, rm = 3, 3
    for y in range(10, 77):
        lm = max(2, min(5, lm + rnd.choice((-1, 0, 0, 1)))); rm = max(2, min(5, rm + rnd.choice((-1, 0, 0, 1))))
        for x in list(range(0, lm)) + list(range(NW - rm, NW)):
            new[:, y, x] = 0; new[0, y, x] = rnd.choice(ROCK)
    # the paths: the mouth -> the fork -> the loft's door; the fork -> the rope ladder; the fork -> the look-out in the east
    path = set()
    def line(x0, y0, x1, y1, w=2):
        x, y = x0, y0
        while True:
            for dx in range(w):
                for dy in range(w): path.add((x + dx, y + dy))
            if (x, y) == (x1, y1): break
            if x != x1 and (y == y1 or rnd.random() < 0.5): x += 1 if x1 > x else -1
            else: y += 1 if y1 > y else -1
    line(40, 10, 40, 30); line(40, 30, 15, 22); line(15, 21, 15, 21); line(40, 30, 46, 74); line(40, 30, 66, 40)
    for (x, y) in path:
        if 10 <= y <= 75 and 6 <= x < NW - 6: new[0, y, x] = DIRT
    # the loft with its tower
    H = HOUSE; cells = set()
    for sy in range(H["sy0"], H["sy1"] + 1):
        for sx in range(H["sx0"], H["sx1"] + 1):
            nx, ny = sx - H["sx0"] + H["dx"], sy - H["sy0"] + H["dy"]
            v0 = int(t[0, sy, sx]); own = v0 >= 2048 and (v0 - 2048) // 48 not in (16, 17, 43) or 1536 <= v0 < 2048
            if own: new[0, ny, nx] = v0; cells.add((nx, ny))
            for z in (1, 2, 3):
                if t[z, sy, sx]: new[z, ny, nx] = t[z, sy, sx]; cells.add((nx, ny))
            if t[5, sy, sx]: new[5, ny, nx] = t[5, sy, sx]
    # the shapes of the grass and the paths (the copied strips and the house keep theirs)
    todo = {(x, y) for y in range(9, 71) for x in range(NW) if (x, y) not in cells and new[0, y, x] >= 2048}
    PZ.przelicz_warstwe(new[0], todo)

    events = [None]
    def add(ev, x, y):
        c = copy.deepcopy(ev); c["id"] = len(events); c["x"], c["y"] = x, y; events.append(c); return c
    def make(name, x, y, pages, note=""):
        e = {"id": len(events), "name": name, "note": note, "pages": pages, "x": x, "y": y}; events.append(e); return e
    by8 = {e["id"]: e for e in miasto["events"] if e}
    ox, oy = H["dx"] - H["sx0"], H["dy"] - H["sy0"]
    for i in (357, 358, 502, 503, 500, 501):                        # the torch, the tower's cone, the ravens' perches and their places
        add(by8[i], by8[i]["x"] + ox, by8[i]["y"] + oy)
    door = add(by8[364], 112 + ox, 13 + oy); door["name"] = "Drzwi: Kruczarnia"
    make("Miejsce: kruczarnia_drzwi", 112 + ox, 14 + oy, [page(pri=0, through=True)])
    make("Miejsce: widok_grani", 67, 41, [page(pri=0, through=True)])
    # the mine's mouth (the mountains' own picture) and the rope ladder
    mouth = add(next(e for e in gory["events"] if e and e["name"] == "Drzwi: Kopalnia"), *MOUTH)
    mouth["name"] = "Wylot sztolni"; mouth["note"] = ""; mouth["pages"][0]["list"] = go(225, SHAFT[0], SHAFT[1] + 1, 2) + [C(0, [])]
    make("Drabinka linowa w dół", LADDER_TOP[0], LADDER_TOP[1], [page("!$1_Drabina_Gora", [C(123, ["A", 0]), C(355, ["$gameSelfSwitches.setValue([222, %d, 'A'], true);" % 0])] +
         go(222, LADDER_BOTTOM[0], LADDER_BOTTOM[1] + 1, 2), pri=0, trigger=1)])
    # the mountains' things, sown over the meadow (rocks most of all - it is high up), away from the paths and the house
    keep = set(path) | cells
    for (x, y) in list(keep):
        for dx in (-2, -1, 0, 1, 2):
            for dy in (-2, -1, 0, 1, 2): keep.add((x + dx, y + dy))
    kinds = {}
    for e in gory["events"]:
        if e:
            n = e["pages"][0]["image"]["characterName"]
            if re.match(r"^!\$(Rock_|Bush_Bare|Pine_|Trunk_Dead)", n): kinds.setdefault(n, e)
    want = [(n, k) for n, k in (("!$Rock_Chunk", 16), ("!$Rock_Pile", 11), ("!$Rock_Jagged", 14), ("!$Rock_Cracked", 11), ("!$Rock_Mound", 11), ("!$Rock_Cairn", 4),
                                 ("!$Bush_Bare_A", 13), ("!$Bush_Bare_B", 11), ("!$Pine_C", 16), ("!$Pine_B", 14), ("!$Pine_A", 12), ("!$Trunk_Dead", 5)) if n in kinds]
    used = set()
    for n, k in want:
        for _ in range(k):
            for _try in range(200):
                x, y = rnd.randrange(7, NW - 7), rnd.randrange(12, 73)
                if (x, y) in keep or any(abs(x - a) <= 2 and abs(y - b) <= 2 for a, b in used) or new[0, y, x] < 2048: continue
                if n.startswith("!$Pine") and not (y > 52 or x < 13 or x > 64): continue      # (the pines keep to the edges and the south)
                add(kinds[n], x, y); used.add((x, y)); break
    out = copy.deepcopy(gory)
    out.update({"width": NW, "height": NH, "displayName": "Krucza Grań", "data": [int(v) for v in new.reshape(-1)], "events": events,
                "note": "<Clouds:on>\n<Farm:off>\n<Camp:off>\n<Poziom:5>"})
    return out, lay, door


def main():
    out, lay, door = build()
    png = next((a for a in sys.argv[1:] if a.lower().endswith(".png")), None)
    if png: L.render(L.Mapa(ID, raw=out)).convert("RGB").save(png); print("podgląd:", png, "zdarzeń:", len(out["events"]) - 1)
    if "--wykonaj" not in sys.argv: print("(podgląd - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    dst = os.path.join(ROOT, "data", "Map%03d.json" % ID)
    if os.path.exists(dst) and "--przebuduj" in sys.argv:
        # (asked by the user before he touched the map: the same map again in another size; the ways on the other maps stay, only the
        # rope ladder's foot on Map222 learns its new top)
        bak = os.path.join(ARCH, "krucza_gran_przebudowa_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S")); os.makedirs(bak, exist_ok=True)
        shutil.copy2(dst, bak); shutil.copy2(os.path.join(ROOT, "data", "Map222.json"), bak)
        m222, l222 = RW.read_json("data/Map222.json")
        bottom = next(e for e in m222["events"] if e and e["name"] == "Drabinka linowa -> Krucza Grań")
        for p in bottom["pages"]:
            for c in p["list"]:
                if c["code"] == 201: c["parameters"][1:4] = [ID, LADDER_TOP[0], LADDER_TOP[1] - 1]
        top = next(e for e in out["events"] if e and e["name"] == "Drabinka linowa w dół")
        top["pages"][0]["list"][1]["parameters"][0] = "$gameSelfSwitches.setValue([222, %d, 'A'], true);" % bottom["id"]
        top["pages"][0]["list"] = [c for c in top["pages"][0]["list"] if c["code"] != 123]
        open(dst, "wb").write(RW.json_text(out, lay)); open(os.path.join(ROOT, "data", "Map222.json"), "wb").write(RW.json_text(m222, l222))
        sp = os.path.join(ROOT, "data", "System.json"); s = open(sp, "rb").read()
        open(sp, "wb").write(re.sub(rb'"versionId":(\d+)', lambda k: b'"versionId":' + str(int(k.group(1)) + 1).encode(), s, count=1))
        print("Przebudowano Map%03d (%d x %d); kopia: %s" % (ID, NW, NH, bak)); return
    if os.path.exists(dst): raise SystemExit("Map%03d już jest - nie nadpisuję (gracz mógł ją poprawiać)." % ID)
    bak = os.path.join(ARCH, "krucza_gran_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S")); os.makedirs(bak, exist_ok=True)
    for k, f in PICS.items(): f().save(os.path.join(ROOT, "img", "characters", k + ".png"))
    # the mine's hall: the ladder in the shaft; the mountains: the rope ladder's foot; the loft's inside: its way out
    m225, l225 = RW.read_json("data/Map225.json"); m222, l222 = RW.read_json("data/Map222.json"); m214, l214 = RW.read_json("data/Map214.json")
    for n in (222, 225, 214, "Infos"): shutil.copy2(os.path.join(ROOT, "data", "Map%s.json" % (n if n == "Infos" else "%03d" % n)), bak)
    m225["events"].append({"id": len(m225["events"]), "name": "Drabina w szybie -> Krucza Grań", "note": "", "x": SHAFT[0], "y": SHAFT[1],
                           "pages": [page("!$1_Drabina_Szyb", go(ID, MOUTH[0], MOUTH[1] + 2, 2), pri=1, trigger=1)]})   # (two cells before the mouth: a step back in does not bump at once)
    bottom = {"id": len(m222["events"]), "name": "Drabinka linowa -> Krucza Grań", "note": "", "x": LADDER_BOTTOM[0], "y": LADDER_BOTTOM[1],
              "pages": [page("", pri=0, through=True), page("!$1_Drabina_Linowa", go(ID, LADDER_TOP[0], LADDER_TOP[1] - 1, 8), pri=1, trigger=1, sw="A")]}
    m222["events"].append(bottom)
    top = next(e for e in out["events"] if e and e["name"] == "Drabinka linowa w dół")
    top["pages"][0]["list"][1]["parameters"][0] = "$gameSelfSwitches.setValue([222, %d, 'A'], true);" % bottom["id"]
    top["pages"][0]["list"] = [c for c in top["pages"][0]["list"] if c["code"] != 123]
    for e in m214["events"]:
        if not e: continue
        for p in e["pages"]:
            for c in p["list"]:
                if c["code"] == 201 and c["parameters"][1] == 8: c["parameters"][1:4] = [ID, door["x"], door["y"] + 1]; e["name"] = "Drzwi -> Krucza Grań (kruczarnia)"
    for p in door["pages"]:
        for c in p["list"]:
            if c["code"] == 201: print("drzwi kruczarni ->", c["parameters"][1:4])
    open(dst, "wb").write(RW.json_text(out, lay))
    open(os.path.join(ROOT, "data", "Map225.json"), "wb").write(RW.json_text(m225, l225))
    open(os.path.join(ROOT, "data", "Map222.json"), "wb").write(RW.json_text(m222, l222))
    open(os.path.join(ROOT, "data", "Map214.json"), "wb").write(RW.json_text(m214, l214))
    mi, mlay = RW.read_json("data/MapInfos.json")
    order = next(m["order"] for m in mi if m and m["id"] == 225) + 1
    for m in mi:
        if m and m["order"] >= order: m["order"] += 1
    while len(mi) <= ID: mi.append(None)
    mi[ID] = {"id": ID, "expanded": False, "name": "Krucza Grań", "order": order, "parentId": 222, "scrollX": 0, "scrollY": 0}
    for m in mi:
        if m and m["id"] == 214: m["parentId"] = ID                 # (the loft's inside belongs under its new map in the editor's tree)
    open(os.path.join(ROOT, "data", "MapInfos.json"), "wb").write(RW.json_text(mi, mlay))
    sp = os.path.join(ROOT, "data", "System.json"); shutil.copy2(sp, bak); s = open(sp, "rb").read()
    open(sp, "wb").write(re.sub(rb'"versionId":(\d+)', lambda k: b'"versionId":' + str(int(k.group(1)) + 1).encode(), s, count=1))
    print("Zapisano Map%03d i przejścia; kopia: %s" % (ID, bak))


if __name__ == "__main__":
    main()
