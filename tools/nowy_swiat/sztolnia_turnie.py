# -*- coding: utf-8 -*-
"""Sztolnia Kruczych Turni (Map225; gracz 2026-11-15: „jaskinia musi być, ale nowa, ładna, równa, duża, z torami i wagonikiem, ukryte
wejścia itd.”): nowa kopalnia pod górami nowego świata, 80 x 80, z prostych, równych sal i chodników:
  - wejście z Kruczych Turni drzwiami „Kopalnia” (dół mapy), sala załadunkowa ze stacją A;
  - tory pętlą przez halę środkową (przystanek H, rozjazd J z dźwignią) do stacji B w sali północnej; ślepa odnoga do komory z rudą (S);
    wagoniki i jazda: Kopalnia.js (ta sama co w starej kopalni - wtyczka zna teraz obie mapy);
  - ukryte przejścia za rumowiskiem (zdarzenia „Rumowisko”: O = odwal kamienie): z komory rudy do „Starej jaskini” (drugie wyjście na
    Krucze Turnie), z chodnika wschodniego do schowka kopaczy (skrzynia), z chodnika zachodniego do obozu kopaczy (W8: Marek, skrzynia
    dowódcy - znaczniki „marek”, „list_kryjowka”).
Korzysta z klocków starej kopalni (tools/kopalnia/zbuduj.py, zestaw kafli 20 „Dungeon z torami”).
  python tools/nowy_swiat/sztolnia_turnie.py [--podglad plik.png] [--wykonaj]"""
import datetime, importlib.util, json, os, random, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
sys.path.insert(0, os.path.join(ROOT, "tools", "kopalnia"))
import zbuduj as K                       # (its imports bring uglib, nslib, art, the rails' tables)
from zbuduj import W, uglib, nslib, art, E, DMap, page, script, cmd, F_DIRT, FILM_RUBBLE, FILM_DUST, FILM_DIRT, FILM_CRACKS, W_CAVE, TIMBER_FACE, F_COBBLE
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

MAP_ID, MW, MH, TILESET, OUT = 225, 80, 80, 20, 222   # (80 x 80 like every map of the new world that is not a house - the user 2026-11-15)
NAME = "Sztolnia Kruczych Turni"
NOTE = K.NOTE
# the rails (Kopalnia.js reads the markers): main line A -> H -> J -> B, the spur J -> S
K.MAIN = [("A", 34, 71), (None, 68, 71), (None, 68, 40), ("H", 52, 40), ("J", 46, 40), (None, 12, 40), (None, 12, 10), ("B", 28, 10)]
K.SPUR = [("J", 46, 40), ("S", 46, 17)]
K.RAIL_ENDS = {"A": (31, 71), "B": (31, 10), "S": (46, 16)}
K.EXITS = {"A": (34, 72, 2), "H": (52, 39, 8), "B": (28, 11, 2), "S": (47, 17, 8)}
K.LEVER = (45, 41)
K.PARKED_DIR = {"A": 6, "B": 4}
IN_LAND = (40, 76, 8)                    # in from "Kopalnia"
CAVE_LAND = (57, 8, 2)                   # in from "Stara jaskinia"


def build():
    mp = DMap(MAP_ID, MW, MH, NAME, NOTE, bgm="", seed=225, tileset=TILESET)
    mp.props["bgs"] = {"name": "Drips", "pan": 0, "pitch": 90, "volume": 25}
    mp.props["autoplayBgs"] = True
    R = mp.rect
    hallA = R(27, 67, 53, 75); neck = R(39, 76, 41, 79)
    gS = R(53, 69, 69, 73); gE = R(66, 39, 70, 73)
    hallH = R(38, 35, 70, 45)
    gW = R(10, 38, 38, 42); gNW = R(10, 9, 14, 42)
    hallB = R(10, 6, 36, 14)
    spur = R(44, 16, 48, 35); chamber = R(38, 10, 60, 19)
    old = R(18, 18, 34, 33); passO = R(24, 34, 28, 37)                # the old working north of the west gallery
    dig = R(38, 49, 62, 64); passD = R(48, 46, 52, 48)                # the great working south of the halt
    passN = R(56, 5, 58, 9)                                         # hidden: to "Stara jaskinia"
    nook = R(73, 57, 77, 63); passE = R(71, 59, 72, 61)              # hidden: the diggers' cache
    camp = R(17, 56, 33, 65); passW = R(20, 43, 22, 55)              # hidden: the diggers' camp (W8)
    floor = hallA | neck | gS | gE | hallH | gW | gNW | hallB | spur | chamber | passN | nook | passE | camp | passW | old | passO | dig | passD
    tunnels = gS | gE | gW | gNW | spur | neck | passN | passE | passW | passO | passD
    faces = mp.shell(floor, F_DIRT, W_CAVE)
    for c in faces:
        if (c[0], c[1] + 1) in tunnels or (c[0], c[1] + 2) in tunnels or (c[0], c[1] + 1) in chamber: mp.layers[0][c] = ("k", TIMBER_FACE)
    platform = R(29, 72, 40, 73) | R(48, 38, 56, 39) | R(22, 11, 30, 12)
    for c in platform & floor: mp.layers[0][c] = ("k", F_COBBLE)
    rnd = random.Random(2250)
    sprinkle = lambda area, n: set(rnd.sample(sorted(area), min(n, len(area))))
    free = floor - platform
    mp.film(FILM_DIRT, sprinkle(free, 150)); mp.film(FILM_RUBBLE, sprinkle(chamber | camp | nook | hallH | old | dig, 70))
    mp.film(FILM_DUST, sprinkle(free, 50)); mp.film(FILM_CRACKS, sprinkle(free, 24))
    mp.shadows()

    conn = K.rail_cells(); rails = set(conn)
    for c, ds in conn.items():
        name = K.BUFFER_OF[next(iter(ds))] if len(ds) == 1 else K.TILE_OF[frozenset(ds)]
        mp.tile(2, c[0], c[1], E(*art.LAYOUT[name]))
        assert c in floor, "tor poza podłogą: %s" % (c,)

    # ---- the ways out
    for x in (39, 40, 41):
        mp.add(x, 79, {"name": "Przejście -> Krucze Turnie (kopalnia)", "note": "", "pages": [page(priority=0, trigger=1, cmds=[cmd(201, [0, OUT, 40, 15, 2, 0])])]})
    for x in (56, 57, 58):
        mp.add(x, 5, {"name": "Przejście -> Krucze Turnie (stara jaskinia)", "note": "", "pages": [page(priority=0, trigger=1, cmds=[cmd(201, [0, OUT, 57, 13, 2, 0])])]})

    # ---- the carts, the lever, the tags of Kopalnia.js
    cart = lambda d, prio=1, **kw: page(image={"characterName": "!$Kopalnia_Wagonik", "characterIndex": 0, "direction": d, "pattern": 1},
                                        priority=prio, trigger=0, cmds=script("Kopalnia.board(this)"), **kw)
    tag = K.marker_note
    for key in ("A", "B"):
        x, y = {"A": K.MAIN[0][1:], "B": K.MAIN[-1][1:]}[key]
        mp.add(x, y, {"name": "Wagonik " + key, "note": tag(KopWagon=key), "pages": [cart(K.PARKED_DIR[key])]}); mp.solid.add((x, y))
    mp.add(K.MAIN[0][1], K.MAIN[0][2], {"name": "Wagonik (jazda)", "note": tag(KopWagon="M"), "pages": [cart(6)]})
    rim = page(image={"characterName": "!$Kopalnia_Wagonik_Przod", "characterIndex": 0, "direction": 6, "pattern": 1}, priority=2, trigger=0, through=True)
    mp.add(K.MAIN[0][1], K.MAIN[0][2], {"name": "Wagonik (przód)", "note": tag(KopWagon="R") + K.LANTERN_LIGHT + "<LightFollow>", "pages": [rim]})
    mp.ev(K.LEVER[0], K.LEVER[1], "!Fantasy_switches2", 0, 6, 0, name="Dźwignia zwrotnicy", priority=1, through=False, note=tag(KopDzwignia=1), cmds=script("Kopalnia.lever()"))
    for i, (st, x, y) in enumerate(K.MAIN): mp.marker(x, y, "Tor główny %d" % i, note=tag(KopTor="main,%d%s" % (i, "," + st if st else "")))
    for i, (st, x, y) in enumerate(K.SPUR): mp.marker(x, y, "Tor odnogi %d" % i, note=tag(KopTor="spur,%d%s" % (i, "," + st if st else "")))
    for st, (x, y, d) in K.EXITS.items(): mp.marker(x, y, "Wysiadka " + st, note=tag(KopWysiadka="%s,%d" % (st, d)), d=d)

    # ---- the hidden ways: rubble across a passage; O clears it for good (self switch A)
    def rubble(cells, text):
        for (x, y) in cells:
            shut = page(image={"characterName": "!$Rock_Pile", "characterIndex": 0, "direction": 2, "pattern": 1}, priority=1, trigger=0,
                        cmds=[cmd(250, [{"name": "Earth3", "volume": 70, "pitch": 110, "pan": 0}]), cmd(355, ["Tawerna.popup(%s, { color: \"info\" });" % json.dumps(text, ensure_ascii=False)]),
                              cmd(123, ["A", 0])])
            gone = page(priority=0, trigger=0, through=True)
            gone["conditions"]["selfSwitchValid"] = True; gone["conditions"]["selfSwitchCh"] = "A"
            mp.add(x, y, {"name": "Rumowisko", "note": "<Cienie:off>", "pages": [shut, gone]}); mp.solid.add((x, y))
    rubble([(56, 9), (57, 9), (58, 9)], "Kamienie ustąpiły. Za rumowiskiem ciągnie chłodem - stary chodnik.")
    rubble([(71, 59), (71, 60), (71, 61)], "Rumowisko odwalone. Ktoś je tu ułożył ręką, nie góra.")
    rubble([(20, 43), (21, 43), (22, 43)], "Kamienie luźne, świeżo układane. Za nimi słychać trzask ognia.")

    # ---- W8: the diggers' camp (the quest's markers), the cache's chest
    mp.spot("marek", 27, 59, 2); mp.spot("list_kryjowka", 31, 57, 2); mp.spot("oboz_kopaczy", 25, 61, 8)
    K.brazier(mp, 25, 60, "Ognisko kopaczy")
    mp.ev(75, 58, "!Fantasy_chest", 6, 2, 0, name="Skrzynia kopaczy", priority=1, through=False,
          pages=[page(image={"characterName": "!Fantasy_chest", "characterIndex": 6, "direction": 2, "pattern": 0}, priority=1, trigger=0,
                      cmds=[cmd(250, [{"name": "Chest1", "volume": 80, "pitch": 100, "pan": 0}]), cmd(125, [0, 0, 60]), cmd(355, ["Tawerna.popup(\"Sakiewka kopaczy: 60 G\", { color: \"good\" });"]), cmd(123, ["A", 0])]),
                 dict(page(image={"characterName": "!Fantasy_chest", "characterIndex": 6, "direction": 8, "pattern": 0}, priority=1, trigger=0), conditions=dict(page()["conditions"], selfSwitchValid=True, selfSwitchCh="A"))])

    # ---- the lights (fire): lanterns on the wall faces every few cells of every hall and gallery, braziers by the platforms
    low = sorted(c for c in faces if (c[0], c[1] + 1) in floor)
    last = {}
    for (x, y) in low:
        if any(abs(x - px) < 6 and abs(y - py) < 3 for (px, py) in last): continue
        last[(x, y)] = 1; K.lantern(mp, x, y)
    K.brazier(mp, 28, 73, "Kosz z ogniem przy stacji A"); K.brazier(mp, 34, 12, "Kosz z ogniem przy stacji B"); K.brazier(mp, 57, 37, "Kosz z ogniem przy przystanku"); K.brazier(mp, 50, 56, "Kosz z ogniem w wyrobisku")
    mp.spot("wejscie", IN_LAND[0], IN_LAND[1], 8)

    # ---- the furnishing: stores by the stations, rock and junk in the halls (never on the rails, the platforms' edges or the ways)
    keep = set(rails) | {K.LEVER} | {(x, y) for (x, y, d) in K.EXITS.values()}
    clear = {(x + dx, y + dy) for (x, y) in keep for dx in (-1, 0, 1) for dy in (-1, 0, 1)} | neck | passN | passE | passW | R(38, 74, 42, 76) | R(55, 9, 59, 12) | passO | passD
    used = set()
    def piece(name, x, y):
        spec = uglib.PIECES[name]; w, h, block = spec[3], spec[4], spec[5]
        cells = [(x + dx, y + dy) for dy in range(h) for dx in range(w)]
        if any(c not in floor or c in clear or c in mp.solid or c in used or c in mp.taken for c in cells): return False
        used.update(cells)
        for dy in block:
            for dx in range(w): mp.solid.add((x + dx, y + dy))
        mp.piece(name, x, y); return True
    rocks = ["stalagmit_br", "stalagmit_br2", "stalagmit_br3", "kupa_skal", "glaz_brazowy", "kamien_okragly", "glazy_br", "stalagmity_male"]
    junk = ["gruz_belka", "rumowisko", "beczka_rozbita", "skrzynka_pusta", "worek_rozsypany", "deska_lezaca", "kamyki_br", "gruz_szary"]
    stores = ["skrzynie_wysokie", "skrzynka_otwarta", "worki_stos", "beczki_dwie", "beczka", "skrzynka_zamknieta", "skrzynka_plotno", "deski_oparte"]
    def row(names, x0, y, step=2):                       # stores in a tidy row along a wall
        for i, n in enumerate(names): piece(n, x0 + i * step, y)
    row(["worki_stos", "skrzynie_wysokie", "deski_oparte", "beczki_dwie", "skrzynka_otwarta", "beczka"], 28, 67)
    row(["skrzynka_zamknieta", "worki_stos", "beczki_dwie"], 45, 67)
    row(["skrzynie_wysokie", "beczka", "skrzynka_plotno", "worki_stos"], 16, 6)
    row(["deski_oparte", "skrzynka_otwarta", "beczki_dwie", "skrzynie_wysokie"], 58, 35)
    row(["worki_stos", "skrzynka_zamknieta", "beczka"], 18, 56)
    def scatter(area, names, n):
        area = sorted(area); done = 0
        for _ in range(600):
            if done >= n: break
            x, y = rnd.choice(area)
            if piece(rnd.choice(names), x, y): done += 1
    scatter(chamber, rocks, 9); scatter(old, rocks + junk, 12); scatter(dig, rocks + junk + stores, 16); scatter(hallH, rocks + junk, 10); scatter(hallA, junk, 5); scatter(hallB, rocks + junk, 7)
    scatter(camp, junk + stores, 6); scatter(nook, stores, 3); scatter(gW | gE | gS | gNW, junk, 8)
    return mp, dict(floor=floor, rails=rails)


def reach(mp, floor, start, shut=True):
    seen, q = {start}, [start]
    blocked = set(mp.solid)
    while q:
        x, y = q.pop()
        for c in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if c in floor and c not in seen and c not in blocked: seen.add(c); q.append(c)
    return seen


def main():
    mp, info = build()
    floor = info["floor"]
    r = reach(mp, floor, IN_LAND[:2])
    need = [K.EXITS[k][:2] for k in "AHBS"] + [(27, 11), (47, 14), (26, 25), (45, 58)]
    miss = [c for c in need if c not in r]
    assert not miss, "nie da się dojść pieszo: %s" % miss
    hidden = [c for c in ((57, 7), (75, 60), (25, 61)) if c in r]
    assert not hidden, "ukryte miejsca dostępne bez odwalenia rumowiska: %s" % hidden
    j = mp.to_json(); text = W.map_text(j).encode("utf-8")
    print("Map%d %s: %dx%d, %d zdarzeń, podłoga %d pól (%.0f%% mapy), pieszo z wejścia %d pól" % (MAP_ID, NAME, MW, MH, len(j["events"]) - 1, len(floor), 100.0 * len(floor) / (MW * MH), len(r)))
    if "--podglad" in sys.argv:
        ts, _ = K.read_db("data/Tilesets.json")
        img = uglib.render(json.loads(text.decode("utf-8")), None, sheets=K.KSheets(ts[TILESET]))
        img.convert("RGB").save(sys.argv[sys.argv.index("--podglad") + 1]); return
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    W.need_editor_closed()
    bak = os.path.join(ARCH, "sztolnia_turnie_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S")); os.makedirs(bak, exist_ok=True)
    open(os.path.join(ROOT, "data", "Map%03d.json" % MAP_ID), "wb").write(text)
    mi, lay = W.read_json("data/MapInfos.json")
    while len(mi) <= MAP_ID: mi.append(None)
    if not mi[MAP_ID]: mi[MAP_ID] = {"id": MAP_ID, "expanded": False, "name": NAME, "order": max(x["order"] for x in mi if x) + 1, "parentId": OUT, "scrollX": 0, "scrollY": 0}
    shutil.copy2(os.path.join(ROOT, "data", "MapInfos.json"), bak); open(os.path.join(ROOT, "data", "MapInfos.json"), "wb").write(W.json_text(mi, lay))
    # the two doors of Krucze Turnie
    m, lay = W.read_json("data/Map%03d.json" % OUT)
    for key, land in (("kopalnia", IN_LAND), ("jaskinia_serce", CAVE_LAND)):
        d = next(e for e in m["events"] if e and "<Town:door=%s>" % key in (e["note"] or ""))
        d["pages"][0]["list"] = [cmd(250, [{"name": "Move1", "volume": 70, "pitch": 90, "pan": 0}]), cmd(201, [0, MAP_ID, land[0], land[1], land[2], 0]), cmd(0, [])]
        d["pages"][0]["trigger"] = 1
    shutil.copy2(os.path.join(ROOT, "data", "Map%03d.json" % OUT), bak); open(os.path.join(ROOT, "data", "Map%03d.json" % OUT), "wb").write(W.json_text(m, lay))
    sp = os.path.join(ROOT, "data", "System.json"); s = open(sp, "rb").read(); shutil.copy2(sp, bak)
    open(sp, "wb").write(re.sub(rb'"versionId":(\d+)', lambda k: b'"versionId":' + str(int(k.group(1)) + 1).encode(), s, count=1))
    print("Zapisano; kopie: %s" % bak)


if __name__ == "__main__":
    main()
