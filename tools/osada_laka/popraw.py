# -*- coding: utf-8 -*-
"""Osada Milczacych na lace Kruczego Jaru (2026-11-11): brama z Gor wyrzucona, cala osada z Map120 przeniesiona na Map004 (wschodnia laka),
chaty 121-124 wychodza na nia. Odbudowuje z BIEZACEGO data/ + js/ + tests/ -> tools/osada_laka/staging/ (te same sciezki wzgledne); nic poza stagingiem.
python popraw.py"""
import os, sys, json, copy, re
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as WS
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
STG = os.path.join(HERE, "staging")

# ------------------------------------------------------------------ geometria: stara osada (Map120) -> Map004
HOST = 4
DX, DY = 46, 27                      # nowe = stare + (DX, DY): palisada x 82..116, y 41..61, brama (99,61); kolumny bokow x 3 i 37 (osi bramy 20 symetrycznie)
OLD = dict(x0=3, x1=37, y0=9, y1=29)  # prostokat palisady w nowej osadzie (kolumny bokow: x0, x1; polnocna / poludniowa palisada: y0, y1)
GATE_X = (19, 20, 21)                # kratki bramy w palisadzie poludniowej (stare x)
GROVE_NEW = dict(x=71, y=27, w=9, h=7, centre=(75, 30))   # gaj Milczacych (Zakon): na polnoc od osady, na lace

def nx(x): return x + DX
def ny(y): return y + DY

def stage(rel, data):
    p = os.path.join(STG, *rel.split("/")); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "wb").write(data)
def stage_map(m, mid):
    txt = WS.map_text(m).encode("utf-8")
    assert WS.map_text(json.loads(txt.decode("utf-8"))).encode("utf-8") == txt
    for i, e in enumerate(m["events"]): assert e is None or e["id"] == i, (mid, i)
    stage("data/Map%03d.json" % mid, txt); print("  Map%03d staged" % mid)
def load(mid):
    o, lay = WS.read_json("data/Map%03d.json" % mid); assert lay == "map", mid; return o
def stop(msg): raise SystemExit("STOP: " + msg)

def read_text(rel):
    """(text with LF, was_crlf) of a live file; a file must be wholly LF or wholly CRLF"""
    raw = open(os.path.join(ROOT, *rel.split("/")), "rb").read(); crlf = b"\r\n" in raw
    if crlf and raw.count(b"\n") != raw.count(b"\r\n"): stop("%s ma mieszane konce linii" % rel)
    return raw.decode("utf-8").replace("\r\n", "\n"), crlf
def write_text(rel, t, crlf):
    stage(rel, (t.replace("\n", "\r\n") if crlf else t).encode("utf-8")); print("  patched", rel)
def patch(rel, pairs):
    """exact-string patch of a live text file (its own line endings kept) -> staging"""
    t, crlf = read_text(rel)
    for a, b in pairs:
        if t.count(a) != 1: stop("%s: kotwica %r wystepuje %d razy" % (rel, a[:80], t.count(a)))
        t = t.replace(a, b)
    write_text(rel, t, crlf)

at, put = WS.at, WS.put
def ev_at(m, x, y): return [e for e in m["events"] if e and e["x"] == x and e["y"] == y]

# ------------------------------------------------------------------ 0. zestaw kafli 9 dostaje arkusz C (chaty Milczacych: beczki, drewno, plot) - tylko puste dotad miejsce
def tilesets():
    ts, lay = WS.read_json("data/Tilesets.json"); assert lay == "db"
    t9, t11 = ts[9], ts[11]
    assert t9["tilesetNames"][6] == "" and t11["tilesetNames"][6].endswith("Fantasy_Outside_C"), (t9["tilesetNames"][6], t11["tilesetNames"][6])
    assert len(t9["flags"]) >= 512
    t9["tilesetNames"][6] = t11["tilesetNames"][6]
    t9["flags"][256:512] = t11["flags"][256:512]
    # nic w mapach zestawu 9 nie uzywa arkusza C (kafle 256-511 ani zdarzenia z takim kaflem): wtedy nic na nich sie nie zmienia
    for mid in (3, 4, 17, 18, 20, 21, 22, 23, 900, 901, 912, 933, 934, 991):
        mm = load(mid); W, H = mm["width"], mm["height"]
        used = [i for i in range(4 * W * H) if 256 <= mm["data"][i] < 512]
        evs = [e["id"] for e in mm["events"] if e and any(256 <= p["image"]["tileId"] < 512 for p in e["pages"])]
        if used or evs: print("  UWAGA Map%03d uzywa C: %d kafli, zdarzenia %s" % (mid, len(used), evs))
    stage("data/Tilesets.json", WS.json_text(ts, "db")); print("  Tilesets.json: zestaw 9 + arkusz C")
    return ts

# ------------------------------------------------------------------ 1. Map004: osada
def old_pass_class(m120, F, x, y):
    """(blokada, nad_graczem) komorki starej mapy wg flag zestawu 11 (jak Game_Map.checkPassage i gwiazdka)"""
    W, H = m120["width"], m120["height"]
    def t(z): return m120["data"][z * W * H + y * W + x]
    passable = False
    for z in (3, 2, 1, 0):
        f = F[t(z)]
        if f & 0x10: continue
        if f & 0x0f == 0: passable = True; break
        if f & 0x0f == 0x0f: passable = False; break
    star = False
    for z in (0, 1, 2, 3):
        v = t(z)
        if v and not (2048 <= v < 4352 or 1536 <= v < 1664) and F[v] & 0x10: star = True
    return (not passable), star

# drzewo za chata 3 (kafle B/D) ma korone uciecia na wierszu 19 (gorne wiersze nie istnieja): twarde krawedzie - zdjete w calosci (komin zostaje)
CLIPPED_TREE = [(2, 27, 19), (3, 27, 19), (3, 28, 19), (2, 30, 19), (3, 31, 19), (3, 32, 19), (3, 33, 19), (3, 32, 20), (3, 33, 20), (3, 32, 21), (3, 33, 21), (3, 33, 22)]   # (wiersze 22-25: wiata z desek przy chacie - zostaje)
def declip(m120):
    m120 = copy.deepcopy(m120)
    for (z, x, y) in CLIPPED_TREE:
        if at(m120, z, x, y) == 0 and z == 2 and (x, y) == (27, 19): continue
        put(m120, z, x, y, 0)
    return m120

def build_osada(m, m120, F):
    m120 = declip(m120)
    # (a) free the footprint (palisade ring + the gate path) and the grove: trees, rocks, bushes MOVED (nearest free cell outside), the tile things of
    #     the ring cells cleared; the interior's tiles are replaced below
    x0, x1, y0, y1 = nx(OLD["x0"]), nx(OLD["x1"]), ny(OLD["y0"]), ny(OLD["y1"])
    gx, gy, gw, gh = GROVE_NEW["x"], GROVE_NEW["y"], GROVE_NEW["w"], GROVE_NEW["h"]
    zones = [(x0 - 2, y0 - 3, x1 + 2, y1 + 3), (gx - 1, gy - 1, gx + gw, gy + gh)]
    inzone = lambda x, y: any(a <= x <= c and b <= y <= d for (a, b, c, d) in zones)
    inside = [e for e in m["events"] if e and inzone(e["x"], e["y"])]
    print("  zdarzenia do przeniesienia:", [(e["id"], e["name"], e["x"], e["y"]) for e in inside])
    ids_moving = {e["id"] for e in inside}
    W, H = m["width"], m["height"]
    def free_spot(ex, ey):
        best = None
        for y in range(max(3, y0 - 12), min(H - 3, y1 + 12)):
            for x in range(4, min(W - 5, x1 + 1)):   # (never to the east: that side is the open meadow towards the shore)
                if inzone(x, y) or inzone(x - 1, y) or inzone(x + 1, y) or inzone(x, y - 1) or inzone(x, y - 2): continue
                d = (x - ex) ** 2 + (y - ey) ** 2
                if best and d >= best[0]: continue
                if any(WS.kind_of(at(m, 0, x + i, y + j)) not in (16, 27) for i in (-1, 0, 1) for j in (-1, 0)): continue
                if any(at(m, z, x + i, y + j) for z in (1, 2, 3) for i in (-1, 0, 1) for j in (-1, 0)) or any(at(m, 5, x + i, y + j) for i in (-1, 0, 1) for j in (-1, 0)): continue
                if any(e and e["id"] not in ids_moving and abs(e["x"] - x) <= 2 and abs(e["y"] - y) <= 2 for e in m["events"]): continue
                best = (d, x, y)
        if not best: stop("brak wolnej kratki dla %s" % ((ex, ey),))
        return best[1], best[2]
    for e in inside:
        if not e["pages"][0]["image"].get("characterName") and e["pages"][0]["image"].get("tileId", 0) == 0: stop("w obszarze stoi zdarzenie bez obrazka: %s" % e["name"])
    for e in sorted(inside, key=lambda e: e["id"]):
        ox_, oy_ = e["x"], e["y"]
        e["x"], e["y"] = -50, -50
        nxy = free_spot(ox_, oy_)
        m["events"][e["id"]]["x"], m["events"][e["id"]]["y"] = nxy
        print("   %s %d (%d,%d) -> %s" % (e["name"], e["id"], ox_, oy_, nxy))
        ids_moving.discard(e["id"])
    # tile things in the ring's cells / the gate path: cleared (layers 1-3 + region)
    for y in range(y0 - 1, min(y1 + 6, H)):
        for x in range(x0 - 1, x1 + 2):
            for z in (1, 2, 3): put(m, z, x, y, 0)
            put(m, 5, x, y, 0)
    # (b) kafle: wnetrze (x 4..35, y 10..28) warstwy 0-3 ze starej mapy; pierscien palisady i gaj tylko region/zdarzenia
    for y in range(OLD["y0"] + 1, OLD["y1"]):
        for x in range(OLD["x0"] + 1, OLD["x1"] - 1):
            for z in range(4): put(m, z, nx(x), ny(y), at(m120, z, x, y))
    # (b2) pod zdjetym drzewem leżal prostokat ciemniejszej trawy (A2 27) o prostych brzegach: wraca zwykla trawa (kolejne plamy 27 zostaja - maja miekkie brzegi)
    cells = [(nx(x), ny(y)) for y in range(10, 29) for x in range(4, 36) if WS.kind_of(at(m120, 0, x, y)) == 27]
    for (x, y) in cells: put(m, 0, x, y, 2816)
    WS.reshape(m, 0, WS.ring(cells, 1))
    print("  trawa 27 -> 16 pod zdjetym drzewem:", len(cells))
    # (b3) the dark flat squares beside huts 1, 2, 4 (A2 36 + its rim) -> little vegetable beds of Winlu's C-sheet plants (cabbage, lettuce: tiles 277-279, 285-287)
    BEDS = [(11, 13, 13, 15), (11, 13, 23, 25), (31, 33, 15, 16)]
    PLANTS = [[277, 278, 279], [286, 287, 278], [279, 277, 287]]
    for (xa, xb, ya, yb) in BEDS:
        for y in range(ya - 1, yb + 2):
            for x in range(xa - 1, xb + 2):
                if WS.kind_of(at(m, 1, nx(x), ny(y))) in (36, 21) and (at(m120, 1, x, y) == at(m, 1, nx(x), ny(y))): put(m, 1, nx(x), ny(y), 0)
        for y in range(ya, yb + 1):
            for x in range(xa, xb + 1): put(m, 2, nx(x), ny(y), PLANTS[(y - ya) % 3][(x - xa) % 3])
    # (c) regiony: 2 = blokada, 3 = nad graczem (wg flag zestawu 11, bo zestaw 9 flag A2-A4 nie ma), reszta 7 (Farming: tu nic sie nie kopie)
    nb = ns = 0
    for y in range(OLD["y0"] + 1, OLD["y1"]):
        for x in range(OLD["x0"] + 1, OLD["x1"]):
            blocked, star = old_pass_class(m120, F, x, y) if x < OLD["x1"] - 1 else (False, False)
            r = 2 if blocked else (3 if star else 7)
            if any(xa <= x <= xb and ya <= y <= yb for (xa, xb, ya, yb) in BEDS): r = 2     # the beds are not walked over
            put(m, 5, nx(x), ny(y), r); nb += r == 2; ns += r == 3
    print("  regiony: blokada %d, nad graczem %d" % (nb, ns))
    # (d) palisada: pierscien regionu 2 (brama: 19..21 w poludniowej to region 7)
    for x in range(OLD["x0"], OLD["x1"] + 1):
        put(m, 5, nx(x), ny(OLD["y0"]), 2)
        put(m, 5, nx(x), ny(OLD["y1"]), 7 if x in GATE_X else 2)
    for y in range(OLD["y0"], OLD["y1"] + 1):
        put(m, 5, nx(OLD["x0"]), ny(y), 2); put(m, 5, nx(OLD["x1"]), ny(y), 2)
    # (e) droga od bramy: nakladka A2 39 jak w starej osadzie (wiersze 29..33 starej mapy), potem splywa w sciolke lasu
    for y in range(OLD["y1"], OLD["y1"] + 5):
        for x in GATE_X:
            put(m, 1, nx(x), ny(y), at(m120, 1, x, y))
    WS.reshape(m, 1, [(nx(x), ny(y)) for x in (18, 19, 20, 21, 22) for y in range(29, 35)])
    # (f) Cienie: the tile huts (A3 roof band + A4 face) throw a box shadow with a hard rectangle in front of the wall - they throw none (the note's <CienieBez:x0,y0,x1,y1>, Cienie.js)
    if "<CienieBez:" not in m["note"]: m["note"] = m["note"].rstrip("\n") + "\n<CienieBez:%d,%d,%d,%d>" % (nx(OLD["x0"]), ny(OLD["y0"]), nx(OLD["x1"]), ny(OLD["y1"]))

def new_events(m120):
    """the Osada's events (copies from Map120, moved by (DX, DY)): -> (EV: full events, PAL: palisade templates + points). Injected at runtime by
    js/plugins/Osada.js (ids 5300-5399 - the map file keeps no event of them: ids in the map files stay below 500)"""
    EV = []
    def clone(old_id, x=None, y=None, patch=None):
        e = copy.deepcopy(m120["events"][old_id])
        e["x"] = nx(e["x"] if x is None else x); e["y"] = ny(e["y"] if y is None else y)
        if patch: patch(e)
        return e
    for oid in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] + list(range(12, 22)) + [23, 27, 28]:   # huts' doors, chimneys, ring stones, mounds, posts, lamps (22: a mound on the rock shelf - outside the new palisade; 24-26: the dry stalks - the beds replace them)
        EV.append(clone(oid))
    def wall_words(e):
        for p in e["pages"]:
            for c in p["list"]:
                if c["code"] == 355:
                    c["parameters"][0] = (c["parameters"][0]
                        .replace("Stoi twarzą do skały.", "Stoi twarzą do pali palisady.")
                        .replace("Patrzy w kamień, jakby coś na nim czytała.", "Patrzy w pale, jakby coś na nich czytała."))
    for oid in range(86, 100): EV.append(clone(oid, patch=wall_words))
    EV.append(clone(338)); EV.append(clone(339))               # the gate (shut / open by switch 16), the marker osada_brama
    south = clone(306, x=5, y=29); bok = clone(316, x=3, y=11)
    pts = []
    for x in (5, 8, 11, 14, 17, 23, 26, 29, 32, 35): pts.append([0, nx(x), ny(29)])
    for x in (5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35): pts.append([0, nx(x), ny(9)])   # north: the same row, unbroken
    for y in range(11, 30, 2): pts.append([1, nx(3), ny(y)]); pts.append([1, nx(37), ny(y)])   # sides: poles, top = the north palisade's top, bottom = the south one's
    for e in (south, bok):
        for k in ("id", "x", "y"): e.pop(k, None)
    return EV, dict(tpl=[south, bok], pts=pts)

OSADA_JS_HEAD = open(os.path.join(HERE, "Osada_head.js"), "rb").read().decode("utf-8")
def osada_plugin(EV, PAL):
    for e in EV: e.pop("id", None)
    dump = lambda o: json.dumps(o, ensure_ascii=False, separators=(",", ":"))
    txt = OSADA_JS_HEAD.replace("__EV__", dump(EV)).replace("__PAL__", dump(PAL))
    stage("js/plugins/Osada.js", txt.encode("utf-8")); print("  js/plugins/Osada.js:", len(EV), "events +", len(PAL["pts"]), "palisade pieces")

# ------------------------------------------------------------------ 2. Map013: brama i jej slupki
def map013():
    m = load(13)
    for i, nm in ((6, "Brama Milcz"), (493, "Słup bramy"), (498, "Słup bramy")):
        e = m["events"][i]
        if not e or not e["name"].startswith(nm): stop("Map013 zdarzenie %d to nie %s" % (i, nm))
        m["events"][i] = None
    stage_map(m, 13)

# ------------------------------------------------------------------ 3. wnetrza 121-124: drzwi wychodza na Map004
def interiors():
    for mid, eid in ((121, 19), (122, 19), (123, 25), (124, 20)):
        m = load(mid); e = m["events"][eid]; n = 0
        for p in e["pages"]:
            for c in p["list"]:
                if c["code"] == 201 and c["parameters"][1] == 120:
                    c["parameters"][1] = HOST; c["parameters"][2] = nx(c["parameters"][2]); c["parameters"][3] = ny(c["parameters"][3]); n += 1
        assert n == 1, (mid, n)
        stage_map(m, mid)

# ------------------------------------------------------------------ 4. parkowane mapy z przejsciem do Osady (22, 159, 934): przejscia wyrzucone
def parked():
    for mid, ids in ((22, (62, 63, 64)), (159, (64, 66, 67)), (934, (22, 23, 24))):
        m = load(mid)
        for i in ids:
            e = m["events"][i]
            if not e or "Osada" not in e["name"]: stop("Map%03d zdarzenie %d nie jest przejsciem do Osady" % (mid, i))
            m["events"][i] = None
        stage_map(m, mid)

def mapinfos():
    mi, lay = WS.read_json("data/MapInfos.json")
    for e in mi:
        if e and e["id"] in (121, 122, 123, 124):
            assert e["parentId"] == 120; e["parentId"] = HOST
    stage("data/MapInfos.json", WS.json_text(mi, lay)); print("  MapInfos: chaty 121-124 pod mapa 3")

# ------------------------------------------------------------------ 5. kod i teksty
def code():
    cx, cy = GROVE_NEW["centre"]
    ox, oy = 57, 54    # stary srodek gaju (Map120)
    stones_old = [[57, 51], [59, 52], [60, 54], [59, 56], [57, 57], [55, 56], [54, 53]]
    stones = "[" + ", ".join("[%d, %d]" % (p[0] - ox + cx, p[1] - oy + cy) for p in stones_old) + "]"
    patch("js/plugins/TownQuests_Data.js", [
        ('w8_gate: { map: 120, id: 953, marker: "osada_brama", dx: 1, x: 21, y: 30,', 'w8_gate: { map: %d, id: 956, marker: "osada_brama", dx: 1, x: %d, y: %d,' % (HOST, nx(21), ny(30))),
        ('w8_osada: { map: 120, id: 951, marker: "osada_grum", x: 21, y: 25,', 'w8_osada: { map: %d, id: 957, marker: "osada_grum", x: %d, y: %d,' % (HOST, nx(21), ny(25)))])   # (ids 951-955 of Laka pod Gawra are taken by the packages' places, TQ_SPOTS)
    patch("js/plugins/Zakon_Data.js", [
        ("osada: 120, wrak: 165 };", "osada: 3, wrak: 165 };"),
        ("        map: 120, x: 53, y: 51, w: 9, h: 7, centre: [57, 54], r: 3, ids: 2850, centreId: 2857,\n        stones: [[57, 51], [59, 52], [60, 54], [59, 56], [57, 57], [55, 56], [54, 53]],",
         "        map: %d, x: %d, y: %d, w: %d, h: %d, centre: [%d, %d], r: 3, ids: 2850, centreId: 2857,\n        stones: %s,"
         % (HOST, GROVE_NEW["x"], GROVE_NEW["y"], GROVE_NEW["w"], GROVE_NEW["h"], cx, cy, stones)),
        ("// 7.8: the grove of the Silent on Map120 (Act II: switch 16 opens the settlement), the seven white stones round (57, 54)",
         "// 7.8: the grove of the Silent on Lake pod Gawra (Map004, on the meadow north of the Silent's settlement; 2026-11-11: was Map120 (57, 54)), the seven white stones round (%d, %d)" % (cx, cy)),
        ('{ key: "gaj", map: 120, x: 57, y: 54, near: 3,', '{ key: "gaj", map: %d, x: %d, y: %d, near: 3,' % (HOST, cx, cy)),
        ("//   - the grove of the Silent (Map120), the hour of silence", "//   - the grove of the Silent (Map004, north of the Silent's settlement), the hour of silence"),
        ('SPOTS.push({ key: "gaj_milczacych", map: 120, kind: "grove"', 'SPOTS.push({ key: "gaj_milczacych", map: GROVE.map, kind: "grove"')])
    patch("js/plugins/Zakon.js", [
        ("[TK.f9.gaj, 120, 57, 54]", "[TK.f9.gaj, D.GROVE.map, D.GROVE.centre[0], D.GROVE.centre[1]]"),
        ("return { go: [TK.kod.ok[14], 120, D.GROVE.centre[0],", "return { go: [TK.kod.ok[14], D.GROVE.map, D.GROVE.centre[0],")])
    patch("js/plugins/Okolice_Data.js", [
        ('{key: "gaj_milczacych", pkg: "D", map: 120, kind: "grove", name: "Gaj Milczących", mode: "reach", x: 53, y: 51, w: 9, h: 7}',
         '{key: "gaj_milczacych", pkg: "D", map: %d, kind: "grove", name: "Gaj Milczących", mode: "reach", x: %d, y: %d, w: %d, h: %d}' % (HOST, GROVE_NEW["x"], GROVE_NEW["y"], GROVE_NEW["w"], GROVE_NEW["h"]))])
    patch("js/plugins/MapaWyspy_Data.js", [
        ("        // (2026-11-11 questy_mapa) the pockets: Osada Milczących (through the gate in Góry), Pustelnia + Urwisko (the gate on Przystań), Spalona zagroda (Podgrodzie)\n"
         "        120: [13, \"Osada Milczących\"], 121: [13, \"Wspólna izba\"], 122: [13, \"Chata tkaczki\"], 123: [13, \"Chata Najstarszego\"], 124: [13, \"Chata rzeźbiarza\"],",
         "        // (2026-11-11 questy_mapa) the pockets: Pustelnia + Urwisko (the gate on Przystań), Spalona zagroda (Podgrodzie)\n"
         "        // (2026-11-11 osada_laka) the Silent's settlement stands on the east meadow of Laka pod Gawra (Map004; no map of its own any more); its four huts belong to it\n"
         "        121: [3, \"Wspólna izba\"], 122: [3, \"Chata tkaczki\"], 123: [3, \"Chata Najstarszego\"], 124: [3, \"Chata rzeźbiarza\"],")])
    patch("js/plugins/Swiat_Data.js", [
        ("the three pockets (Osada Milczących, Pustelnia + Urwisko,", "the pockets (the Silent's huts, Pustelnia + Urwisko,"),
        ("extra: [120, 121, 122, 123, 124, 168, 169, 175, 213],", "extra: [121, 122, 123, 124, 168, 169, 175, 213],")])
    patch("js/plugins/Debug.js", [
        ("the pockets (Osada Milczących, Pustelnia + Urwisko, Spalona zagroda)", "the pockets (the Silent's huts, Pustelnia + Urwisko, Spalona zagroda)")])
    patch("js/teksty/w8.txt", [
        ("za bramą w palisadzie, w dolinie na wschód od Gór (Akt II:", "za bramą w palisadzie, na łące na wschód od Gawry (Akt II:"),
        ("Za bramą w palisadzie, w dolinie na wschód od Gór, mieszkają Milczący", "Za bramą w palisadzie, na łące na wschód od Gawry, mieszkają Milczący")])

# ------------------------------------------------------------------ 6. testy (kopie w stagingu: tests/<name>.js)
def patchn(rel, triples):
    """(old, new, count) exact replacements of a live text file -> staging"""
    t, crlf = read_text(rel)
    for a, b, n in triples:
        if t.count(a) != n: stop("%s: kotwica %r wystepuje %d razy (a ma %d)" % (rel, a[:80], t.count(a), n))
        t = t.replace(a, b)
    write_text(rel, t, crlf)

def core_and_list():
    patch("js/plugins/TawernaCore.js", [
        ('''        { owner: "Ziemia", from: 3100, to: 3139,''', '''        // (2026-11-11) the Silent's settlement on the east meadow of Laka pod Gawra (Osada.js): doors, residents, stones, palisade, gate (Map004)
        { owner: "Osada", from: 5300, to: 5399, what: "Osada Milczących na łące Kruczego Jaru (mapa 4): drzwi chat, mieszkańcy, kamienie, palisada, brama" },
        { owner: "Ziemia", from: 3100, to: 3139,''')])
    t, crlf = read_text("js/tawerna_wtyczki.js")
    a = '{"name":"Zakon","status":true,'
    k = t.index(a); e = t.index("\n", k)
    assert t[e - 1] == ","
    entry = '{"name":"Osada","status":true,"description":"Osada Milczących na wschodniej łące pod Gawrą (Map004): drzwi chat, mieszkańcy, kamienie kręgu, palisada i brama wstawiane przy wczytaniu mapy. v1.0.0","parameters":{}},'
    t = t[:e + 1] + entry + "\n" + t[e + 1:]
    write_text("js/tawerna_wtyczki.js", t, crlf)
    patch("js/plugins/Cienie.js", [
        ('''        // a tile drawn over the characters (a "star" B-E tile: a roof of the roofs' sheet, a chimney, a crown) lies on the cell
''', '''        // (2026-11-11) <CienieBez:x0,y0,x1,y1> in the map's note (any number): tile buildings in these cells throw no shadow (the Silent's huts on
        // Laka pod Gawra: an A3 roof band over an A4 face is one hard box; the B-E things there are left out of "things" too)
        const bez = new Uint8Array(n), reBez = /<CienieBez:(\d+),(\d+),(\d+),(\d+)>/g;
        for (let q; (q = reBez.exec($dataMap.note || ""));) {
            for (let y = +q[2]; y <= +q[4] && y < H; y++) for (let x = +q[1]; x <= +q[3] && x < W; x++) { kind[y * W + x] = 0; bez[y * W + x] = 1; }
        }
        // a tile drawn over the characters (a "star" B-E tile: a roof of the roofs' sheet, a chimney, a crown) lies on the cell
'''),
        ('''            if (comp[i] >= 0 || extra[i]) continue;
            const t = topBE(i);''', '''            if (comp[i] >= 0 || extra[i] || bez[i]) continue;
            const t = topBE(i);''')])

def tests():
    ox, oy = DX, DY
    patchn("tests/osada_huts_test.js", [
        ("// The four huts of Osada Milczących (Map120) and their interiors", "// The four huts of Osada Milczących (since 2026-11-11 on the east meadow of Laka pod Gawra (Map004), Map004) and their interiors", 1),
        ("//   - each hut's front door on Map120:", "//   - each hut's front door on Laka pod Gawra (Map004):", 1),
        ("//     the doorway -> back on Map120 in front of the door, facing down", "//     the doorway -> back on Laka pod Gawra (Map004) in front of the door, facing down", 1),
        ("door on Map120, the cell in front", "door on Laka pod Gawra (Map004) (the old Map120 coordinates + (%d, %d)), the cell in front" % (ox, oy), 1),
        ("front: [8, 17], out:", "front: [%d, %d], out:" % (8 + ox, 17 + oy), 1),
        ("front: [29, 15], out:", "front: [%d, %d], out:" % (29 + ox, 15 + oy), 1),
        ("front: [29, 26], out:", "front: [%d, %d], out:" % (29 + ox, 26 + oy), 1),
        ("front: [8, 26], out:", "front: [%d, %d], out:" % (8 + ox, 26 + oy), 1),
        ("await t.newGame({ map: 120, x: 20, y: 31, dir: 8,", "await t.newGame({ map: 4, x: %d, y: %d, dir: 8," % (20 + ox, 31 + oy), 1),
        ('t.check("Map120: four hut doors, touched -> Map121-124"', 't.check("Laka pod Gawra (Map004): four hut doors, touched -> Map121-124"', 1),
        ("JSON.stringify(m.exits[0].town) === JSON.stringify(h.front)", "JSON.stringify([m.exits[0].town[0] + %d, m.exits[0].town[1] + %d]) === JSON.stringify(h.front)" % (ox, oy), 1),
        ("if (!(await t.eval(t.onMap(120)))) await t.go(120, h.front[0], h.front[1], 8);", "if (!(await t.eval(t.onMap(4)))) await t.go(4, h.front[0], h.front[1], 8);", 1),
        ("const outOk = await t.until(t.onMap(120), 20);", "const outOk = await t.until(t.onMap(4), 20);", 1),
        ("-> Map120 before ${h.door}", "-> Laka pod Gawra (Map004) before ${h.door}", 1),
        ("if (!(await t.eval(t.onMap(120)))) await t.go(120, 20, 31, 8);", "if (!(await t.eval(t.onMap(4)))) await t.go(4, %d, %d, 8);" % (20 + ox, 31 + oy), 1),
        ("await t.locate(29, 26, 8);", "await t.locate(%d, %d, 8);" % (29 + ox, 26 + oy), 1)])
    patchn("tests/questy_mapa_test.js", [
        ('''    await t.go(13, 6, 29, 8);
    await t.eval(`Input._currentState["up"] = true; 0`);
    await t.until(t.onMap(120), 15);
    await t.eval(`Input._currentState["up"] = false; 0`);
    const o = await J(`[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y]`);
    t.check("brama Gor prowadzi do Osady Milczacych (120)", o[0] === 120, o);
''', '''    await t.go(13, 6, 30, 8);
    await t.eval(`Input._currentState["up"] = true; 0`);
    await t.frames(320);
    await t.eval(`Input._currentState["up"] = false; 0`);
    const o = await J(`[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y]`);
    t.check("(2026-11-11) bramy Gor nie ma: sciezka idzie dalej na polnoc, Map013 zostaje", o[0] === 13 && o[2] <= 25, o);
    await t.go(4, %d, %d, 8);
''' % (20 + ox, 31 + oy), 1),
        ('''    t.check("W8 rozdz. 5: znacznik osada_brama (miejsce Gruma) jest w kieszeni", !!gate, gate);''',
         '''    t.check("W8 rozdz. 5: znacznik osada_brama (miejsce Gruma) jest na lace Kruczego Jaru (Osada przy wschodnim brzegu)", !!gate && gate[0] === %d && gate[1] === %d, gate);''' % (20 + ox, 30 + oy), 1),
        ('''    t.check("W8 mozna zaczac, kieszen Osady jest na mapie swiata", !!w8, { w8, q });
    await t.go(120, 46, 66, 8);
    await t.eval(`Input._currentState["down"] = true; 0`);
    await t.until(t.onMap(13), 15);
    await t.eval(`Input._currentState["down"] = false; 0`);
    t.check("z Osady krawedz wraca do Gor (6,28)", (await J(`$gameMap.mapId()`)) === 13);
''', '''    t.check("W8 mozna zaczac, Osada Milczacych jest na mapie swiata (Laka pod Gawra (Map004))", !!w8, { w8, q });
''', 1)])
    patchn("tests/zakon_test.js", [
        ("168, 175, 8, 120, 165];", "168, 175, 8, 165];", 1),
        ("await go(120, 57, 55, 12);", "await go(4, 75, 31, 12);", 1),
        ("$gamePlayer.locate(57, 54); return 0;", "$gamePlayer.locate(75, 30); return 0;", 2),
        ("$gamePlayer.locate(57, 59); 0", "$gamePlayer.locate(75, 35); 0", 1)])
    # mountain_places_test: the old gate block -> "the gate is gone"; the Osada block on Laka pod Gawra (Map004)
    rel = "tests/mountain_places_test.js"
    t, crlf = read_text(rel)
    skip_mp = "the old gate on Map013 (6,3): no part in anything now" not in t   # (2026-11-12: the stale-tests agent rewrites this test - it takes the Osada's move in itself)
    if skip_mp: print("  pominiety: tests/mountain_places_test.js (przepisywany osobno)")
    else:
        i = t.index("    // ================================================================ the old gate on Map013 (6,3): no part in anything now")
        j = t.index("    // ================================================================ the Silent's gate in the palisade of Map120 (switch 16)")
        new_block = '''    // ================================================================ Map013: the gate (6,27) and its posts are gone (2026-11-11 osada_laka)
        await t.go(13, 6, 31, 8);
        await t.frames(20);
        const gone13 = await t.json(`$gameMap.events().filter(e => /Brama Milczących|Słup bramy/.test(e.event().name)).length`);
        await bump("up", 360);
        const pass13 = await t.json(where);
        t.check("Map013: no gate 'Brama Milczących', no posts; the hero walks up through the passage (6,31) -> north of the wall (y <= 25), still on Map013 (nothing leads to the Osada from here any more)",
            gone13 === 0 && pass13.map === 13 && pass13.y <= 25, { gone13, pass13 });

    '''
        t = t[:i] + new_block + t[j:]
        for a, b, n in [
            ("the Silent's gate in the palisade of Map120 (switch 16)", "the Silent's gate in the palisade on Laka pod Gawra (Map004) (Map004, switch 16)", 1),
            ("await t.go(120, 20, 31, 8);", "await t.go(4, %d, %d, 8);" % (20 + ox, 31 + oy), 1),
            ("REACH(20, 31)", "REACH(%d, %d)" % (20 + ox, 31 + oy), 2),
            ("(await t.json(MARKERS)).osada_brama[0] === 20", "(await t.json(MARKERS)).osada_brama[0] === %d" % (20 + ox), 1),
            ("from before the gate (20,31) the Osada's inside", "from before the gate (%d,%d) the Osada's inside" % (20 + ox, 31 + oy), 1),
            ("await t.locate(20, 30, 8);", "await t.locate(%d, %d, 8);" % (20 + ox, 30 + oy), 2),
            ("gate.at.y === 30 && gate.blocked", "gate.at.y === %d && gate.blocked" % (30 + oy), 1),
            ("the gate (20,29) is closed", "the gate (%d,%d) is closed" % (20 + ox, 29 + oy), 1),
            ("(await t.json(`$gamePlayer.y`)) <= 28, await t.json(where));", "(await t.json(`$gamePlayer.y`)) <= %d, await t.json(where));" % (28 + oy), 1),
            ("the hero walks through the gate (20,29) into the village", "the hero walks through the gate (%d,%d) into the village" % (20 + ox, 29 + oy), 1),
            ("await t.locate(19, 23, 8);", "await t.locate(%d, %d, 8);" % (19 + ox, 23 + oy), 1)]:
            if t.count(a) != n: stop("mountain_places_test: kotwica %r %d razy (a ma %d)" % (a[:70], t.count(a), n))
            t = t.replace(a, b)
        write_text(rel, t, crlf)
    patchn("tests/w8_mountains_test.js", [
        ("await t.go(120, 20, 31, 8, { calm: false });", "await t.go(4, %d, %d, 8, { calm: false });" % (20 + ox, 31 + oy), 1),
        ("seen = new Uint8Array(W * H), q = [[20, 31]];", "seen = new Uint8Array(W * H), q = [[%d, %d]];" % (20 + ox, 31 + oy), 1),
        ("seen[31 * W + 20] = 1;", "seen[%d * W + %d] = 1;" % (31 + oy, 20 + ox), 1),
        ("for (let y = 8; y <= 28; y++) for (let x = 4; x <= 35; x++)", "for (let y = %d; y <= %d; y++) for (let x = %d; x <= %d; x++)" % (10 + oy, 28 + oy, 4 + ox, 36 + ox), 1),
        ("circle: !!seen[22 * W + 19]", "circle: !!seen[%d * W + %d]" % (22 + oy, 19 + ox), 1),
        ("s5.x === 21 && s5.y === 30", "s5.x === %d && s5.y === %d" % (21 + ox, 30 + oy), 1),
        ("await t.locate(20, 30, 6);", "await t.locate(%d, %d, 6);" % (20 + ox, 30 + oy), 1),
        ("await t.locate(20, 30, 8);", "await t.locate(%d, %d, 8);" % (20 + ox, 30 + oy), 1),
        ('(await J("$gamePlayer.y")) <= 28 && (await J("$gameMap.mapId()")) === 120', '(await J("$gamePlayer.y")) <= %d && (await J("$gameMap.mapId()")) === 4' % (28 + oy), 1),
        ("s6.x === 21 && s6.y === 25", "s6.x === %d && s6.y === %d" % (21 + ox, 25 + oy), 1),
        ("await t.locate(20, 25, 6);", "await t.locate(%d, %d, 6);" % (20 + ox, 25 + oy), 1),
        ("const s6 = await spot(951);", "const s6 = await spot(957);", 1),
        ('const os = await talkTo("$gameMap.event(951)"', 'const os = await talkTo("$gameMap.event(957)"', 1),
        ("const s5 = await spot(953);", "const s5 = await spot(956);", 1),
        ('const gate = await talkTo("$gameMap.event(953)"', 'const gate = await talkTo("$gameMap.event(956)"', 1)])
    stage("tests/osada_laka_test.js", open(os.path.join(HERE, "osada_laka_test.js"), "rb").read())
    # support files, so that the staged tests run from the staging folder (kit, cdp, the huts' fixtures)
    stage("tests/cdp.js", open(os.path.join(ROOT, "tests", "cdp.js"), "rb").read())
    for name in os.listdir(os.path.join(ROOT, "tests", "lib")): stage("tests/lib/" + name, open(os.path.join(ROOT, "tests", "lib", name), "rb").read())
    fx = os.path.join(ROOT, "tests", "fixtures", "osada")
    for name in os.listdir(fx): stage("tests/fixtures/osada/" + name, open(os.path.join(fx, name), "rb").read())

def main():
    import shutil
    if os.path.isdir(STG): shutil.rmtree(STG)
    m120 = load(120)
    ts = tilesets(); F = ts[11]["flags"]
    m = load(HOST)
    build_osada(m, m120, F)
    EV, PAL = new_events(m120)
    osada_plugin(EV, PAL)
    stage_map(m, HOST)
    map013(); interiors(); parked(); mapinfos(); code(); core_and_list(); tests()
    print("OK")

if __name__ == "__main__":
    main()
