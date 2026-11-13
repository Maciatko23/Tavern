# -*- coding: utf-8 -*-
"""Poprawki uzytkownika 2026-11-11 (5 usterek ze zrzutow): Map020 (dom dziadka: pole, trofeum, bramki zagrod, sciezka), Map003 (plot dzialki:
zachodni szereg, bramka, resztki), zrodla (Map003, Map004: pierscien, mokra ziemia), Map125 (Przystan: kieszen pustelni precz, kozlowy slup,
komora celna), kafle A2 (wypieczony czarny cien plotow i palisad) i wtyczki (Zasoby, Wyspa, Pustelnia, Podroznicy, Swiat_Data).

Czyta data/, js/, img/ - zapisuje TYLKO tools/poprawki_uzytkownika/staging/ (te same sciezki wzgledne). Edytor jest otwarty: nic w data/js/img.
   python tools/poprawki_uzytkownika/popraw.py
Dopasowanie tekstow JS: dokladne, STOP gdy brak albo wiecej niz jedno; mapy: uklad edytora sprawdzony w obie strony (W.read_json), zdarzenia
index == id (usuniete: null), pliki binarnie, LF."""
import copy, json, os, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
os.chdir(ROOT)
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as W
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
STAG = os.path.join(HERE, "staging")
A2 = lambda k: 2048 + k * 48
kind = lambda v: (v - 2048) // 48 if v >= 2048 else None


def stop(msg): raise SystemExit("STOP: " + msg)
def write_bin(rel, data):
    p = os.path.join(STAG, *rel.split("/")); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "wb").write(data)


# ------------------------------------------------------------------ maps
def load(n):
    o, lay = W.read_json("data/Map%03d.json" % n)
    if lay != "map": stop("Map%03d nie w ukladzie mapy" % n)
    for i, e in enumerate(o["events"]):
        if e is not None and e["id"] != i: stop("Map%03d: zdarzenie %d pod indeksem %d" % (n, e["id"], i))
    return o
def save(m, n):
    for i, e in enumerate(m["events"]):
        if e is not None and e["id"] != i: stop("Map%03d: id != indeks po zmianach (%d/%d)" % (n, e["id"], i))
    txt = W.map_text(m).encode("utf-8")
    if json.loads(txt.decode("utf-8")) != m: stop("Map%03d: round trip" % n)
    write_bin("data/Map%03d.json" % n, txt)
    print("   staging: data/Map%03d.json" % n)
def get(m, z, x, y): return m["data"][(z * m["height"] + y) * m["width"] + x]
def put(m, z, x, y, v): m["data"][(z * m["height"] + y) * m["width"] + x] = v
def ev(m, i):
    e = m["events"][i]
    if not e: stop("brak zdarzenia %d" % i)
    return e
def move(m, i, x, y): e = ev(m, i); e["x"], e["y"] = x, y
def drop(m, i): ev(m, i); m["events"][i] = None
def reshape(m, z, cells): W.reshape(m, z, W.ring(set(cells), 2))
def cells_of(x0, y0, x1, y1): return [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)]
def event_at(m, x, y): return [e["id"] for e in m["events"] if e and e["x"] == x and e["y"] == y]


# ------------------------------------------------------------------ the springs (Zasoby.js): the ring is solid (<Occupy>), the foot is damp
# ground, a short mud trickle runs from the spill, the ferns of the foot are cleared (layer 2 plants 672-767).
def spring_ground(m, sx, sy):
    """damp earth (A2 kind 17) round the foot, dark wet earth (kind 26, layer 1) as the trickle from the spill, no ferns over the stones"""
    damp = [(sx + dx, sy + dy) for dy in (-1, 0, 1) for dx in range(-2, 3) if not (abs(dx) == 2 and dy != 0)]
    damp += [(sx - 1, sy + 2), (sx, sy + 2), (sx + 1, sy + 2), (sx, sy + 3), (sx + 1, sy + 3), (sx + 1, sy + 4)]
    trickle = [(sx, sy + 1), (sx, sy + 2), (sx, sy + 3), (sx + 1, sy + 3), (sx + 1, sy + 4)]
    n = 0
    for (x, y) in damp:
        if kind(get(m, 0, x, y)) in (16, 17, 27) and not get(m, 3, x, y):
            put(m, 0, x, y, A2(17)); n += 1
            if get(m, 1, x, y) and kind(get(m, 1, x, y)) in (46, 21, 28, 20): put(m, 1, x, y, 0)
    reshape(m, 0, damp); reshape(m, 1, damp)
    for (x, y) in trickle:
        put(m, 1, x, y, A2(26))
    reshape(m, 1, trickle)
    for y in range(sy - 3, sy + 3):
        for x in range(sx - 3, sx + 4):
            t = get(m, 2, x, y)
            if 672 <= t < 768: put(m, 2, x, y, 0)
    return n


def strays(m, maxsize, keep, edge=3):
    """loose patches of bare earth (A2 kind 17 on layer 0, kinds 17 / 39 on layer 1) in a meadow: 8-connected pieces of at most maxsize cells that touch
    no keep box (x0, y0, x1, y1) and no map edge (within `edge` cells - a seam) go back to grass"""
    from collections import deque
    Wd, Hd = m["width"], m["height"]
    E = {(x, y) for y in range(Hd) for x in range(Wd) if kind(get(m, 0, x, y)) == 17 or kind(get(m, 1, x, y)) in (17, 39)}
    seen, out = set(), []
    for c in sorted(E):
        if c in seen: continue
        q, comp = deque([c]), [c]; seen.add(c)
        while q:
            x, y = q.popleft()
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    nb = (x + dx, y + dy)
                    if nb in E and nb not in seen: seen.add(nb); q.append(nb); comp.append(nb)
        xs = [a for a, b in comp]; ys = [b for a, b in comp]
        if len(comp) > maxsize or min(xs) < edge or min(ys) < edge or max(xs) >= Wd - edge or max(ys) >= Hd - edge: continue
        if any(not (max(xs) < k[0] or min(xs) > k[2] or max(ys) < k[1] or min(ys) > k[3]) for k in keep): continue
        for (x, y) in comp:
            if kind(get(m, 0, x, y)) == 17: put(m, 0, x, y, A2(16))
            if kind(get(m, 1, x, y)) in (17, 39): put(m, 1, x, y, 0)
        reshape(m, 0, comp); reshape(m, 1, comp); out.append((len(comp), min(xs), min(ys), max(xs), max(ys)))
    return out


# ================================================================== MAP 020
def map020():
    m = load(20)
    # field (events 17-23, 25, 26: a 3 x 3 patch of crops): moved one cell east so a free grass column lies between it and the cottage's earth
    # path, ONE tilled ground (A2 kind 17, all 3 x 3 on centre tiles, a soft 1-cell rim) under all of it, no decor inside
    FIELD = [18, 25, 26, 17, 19, 20, 21, 22, 23]
    for i in FIELD: ev(m, i)["x"] += 1
    for (x, y) in cells_of(48, 47, 55, 52):                              # the old patchy ground and decor of the east side go back to grass
        if kind(get(m, 0, x, y)) in (16, 17, 27): put(m, 0, x, y, A2(16))
        put(m, 1, x, y, 0)
    for (x, y) in cells_of(44, 47, 48, 54):                               # the path's margin: grass, no flowers on the path
        if kind(get(m, 0, x, y)) in (16, 17, 27): put(m, 0, x, y, A2(16))
        if kind(get(m, 1, x, y)) == 28: put(m, 1, x, y, 0)
    field = cells_of(49, 48, 53, 52)
    for (x, y) in field: put(m, 0, x, y, A2(17))
    reshape(m, 0, cells_of(44, 46, 55, 55))
    # path: 3 wide from the door (x45-47), constant, y47-54 (the old one widened to 4 beside the field and had rags of a 5th)
    road = cells_of(45, 47, 47, 54)
    for (x, y) in cells_of(45, 47, 49, 54): put(m, 1, x, y, 0)
    for (x, y) in road: put(m, 1, x, y, A2(39))
    reshape(m, 1, road)
    # the trophy (two axes and a shield) hung on the thatch above the door: a wall has no room for it between the door, the windows and the
    # corner logs - taken down (the event stays, empty)
    e = ev(m, 16); e["name"] = "Trofeum (zdjete)"; e["pages"][0]["image"]["characterName"] = ""
    # the yards: the gates get end posts (209 left of the gap, 208 right of it, layer 3, over the A2-22 fence), the back gap of the west yard is closed
    for (x, t) in ((39, 209), (41, 208), (51, 209), (53, 208)): put(m, 3, x, 46, t)
    put(m, 1, 40, 43, A2(22)); reshape(m, 1, [(x, 43) for x in range(38, 43)])
    # loose bare-earth patches in the meadow that lead nowhere (the yards' and the field's ground stay)
    print('   Map020 strays:', strays(m, 30, [(48, 42, 56, 53)]))
    save(m, 20)


# ================================================================== MAP 003
def map003():
    m = load(3)
    # the plot's vertical runs: one continuous line of posts (west 216, east 217), the gate's posts doubled (layer 2 holds the other half-post),
    # nothing else on the line; the corners as the horizontal runs have them (208 / 209 on layer 3)
    for x, own, extra, gate in ((42, 216, 217, range(46, 49)), (77, 217, 216, range(44, 47))):
        for y in range(34, 60):
            put(m, 2, x, y, 0)
        for y in range(35, 59):
            put(m, 3, x, y, 0 if y in gate else own)
        for y in (min(gate) - 1, max(gate) + 1): put(m, 2, x, y, extra)
        for y in gate: assert get(m, 1, x, y), ("the gate has no road tile", x, y)
    put(m, 3, 42, 34, 208); put(m, 3, 42, 59, 208); put(m, 3, 77, 34, 209); put(m, 3, 77, 59, 209)
    # a pine on the line (trunk at x41, crown over the posts): out of the way, west, as the trunk is 2 cells off the line
    if event_at(m, 39, 43): stop("(39,43) zajete")
    move(m, 37, 39, 43)
    # the neighbour's fence (Zasoby: a remnant of a fence standing alone on the path of the plot's west gate): moved by Zasoby_Data.js to the
    # neighbour's yard (8, 18-21)
    # O1: a ruin's stone corner without its lower part; a fern bush without its lower half
    put(m, 3, 25, 47, 668); put(m, 2, 77, 86, 740)
    put(m, 2, 38, 75, 0); put(m, 2, 39, 82, 0)       # two fern halves without their other halves
    for (x, y) in ((40, 79),): spring_ground(m, x, y)
    save(m, 3)


# ================================================================== MAP 004 (the spring of the forest road)
def map004():
    m = load(4)
    spring_ground(m, 42, 28)
    save(m, 4)


# ================================================================== MAP 125 (Przystan)
def map125():
    m = load(125)
    # 4: the hermitage's gate "Sciezka na klif": the gate, its posts, the palisade runs and the signpost go; the pocket is closed in Swiat_Data.js
    for i in (384, 385, 388, 389, 392, 393, 394, 397): drop(m, i)
    # 5 c: two bare posts (A2 palisade, single-cell shape with the shadow baked into the tile) lone on the road
    for (x, y) in ((39, 17), (39, 21)):
        assert kind(get(m, 1, x, y)) == 38
        put(m, 1, x, y, 0)
    # 5 a: the pile of sacks whole: tops 341 342 over feet 349 350 (it was two feet on two rows, no tops)
    put(m, 2, 28, 15, 341); put(m, 2, 29, 15, 342); put(m, 2, 28, 16, 349); assert get(m, 2, 29, 16) == 350
    # 5 b: the cart by the shed - the whole cart (434 435 / 442 443) instead of pieces of four things
    for (x, y), t in {(27, 21): 434, (28, 21): 435, (27, 22): 442, (28, 22): 443}.items(): put(m, 2, x, y, t)
    # O1: the woodshed's plank roof gets its logs; the notice board gets its legs (passable tile, under the guard)
    for x, t in ((85, 437), (86, 438), (87, 439)): put(m, 2, x, 98, t)
    put(m, 2, 38, 17, 376)
    save(m, 125)


# ================================================================== the A2 sheets: the baked black rectangles beside fence and palisade posts
def sheets():
    import numpy as np
    from PIL import Image
    T = json.load(open("data/Tilesets.json", encoding="utf-8"))
    done = {}
    for ts in T:
        if not ts or not ts["tilesetNames"][1] or ts["tilesetNames"][1] in done: continue
        rel = "img/tilesets/" + ts["tilesetNames"][1] + ".png"
        if not os.path.exists(rel): continue
        a = np.array(Image.open(rel).convert("RGBA")); n = 0
        for k in (22, 30, 38):                              # A2 fence, red fence, palisade
            idx = k - 16; col, row = idx % 8, idx // 8
            blk = a[row * 144:(row + 1) * 144, col * 96:(col + 1) * 96]
            sh = (blk[:, :, 0] == 0) & (blk[:, :, 1] == 0) & (blk[:, :, 2] == 0) & (blk[:, :, 3] == 102)
            n += int(sh.sum()); blk[sh] = (0, 0, 0, 0)
        done[ts["tilesetNames"][1]] = n
        if n:
            p = os.path.join(STAG, "img", "tilesets", *ts["tilesetNames"][1].split("/")) + ".png"
            os.makedirs(os.path.dirname(p), exist_ok=True)
            Image.fromarray(a).save(p, optimize=True)
            print("   staging: %s (%d px of baked shadow removed)" % (rel, n))
    return done


# ================================================================== the plugins
def js_patch(rel, pairs):
    p = os.path.join(ROOT, *rel.split("/")); raw = open(p, "rb").read()
    if b"\r" in raw: stop(rel + " ma CR")
    s = raw.decode("utf-8")
    for old, new in pairs:
        if s.count(old) != 1: stop("%s: tekst znaleziony %d razy: %s" % (rel, s.count(old), old[:90]))
        s = s.replace(old, new)
    write_bin(rel, s.encode("utf-8")); print("   staging: " + rel)


def plugins():
    # the hermitage pocket is closed: not in the world (Swiat_Data extra), Wyspa.ready() refuses 155/156/157, quests that live only there are off
    js_patch("js/plugins/Swiat_Data.js", [(
        "        extra: [120, 121, 122, 123, 124, 155, 156, 157, 168, 169, 175, 213],\n",
        "        // (2026-11-11 user: \"wywalamy to z mapy, na razie bez pustelni\") 155, 156, 157 (Pustelnia, Skryptorium, Urwisko Krukow) are OUT again:\n"
        "        // no gate on Przystan; bring them back with the gate there, these three numbers here and WyspaData.HERMITAGE_OPEN\n"
        "        extra: [120, 121, 122, 123, 124, 168, 169, 175, 213],\n")])
    js_patch("js/plugins/Wyspa_Data.js", [(
        "    window.WyspaData = { MAPS,",
        "    // (2026-11-11 user: \"wywalamy to z mapy, na razie bez pustelni\") THE switch of the hermitage pocket (Pustelnia 155, Skryptorium 156, Urwisko\n"
        "    // Krukow 157): false - Wyspa.ready()/isReady() refuse these maps, so everything that asks \"is the place built\" (K50, D23, K51, D24, K53,\n"
        "    // the cistern's grate, W11's lens at Kleofas, D40's view points) acts as if it were not built. true brings it back (also the gate event\n"
        "    // on Map125 and 155/156/157 in Swiat_Data.js's extra).\n"
        "    const HERMITAGE_OPEN = false, HERMITAGE_MAPS = [155, 156, 157];\n\n"
        "    window.WyspaData = { HERMITAGE_OPEN, HERMITAGE_MAPS, MAPS,"
    )])
    js_patch("js/plugins/Wyspa.js", [
        ("    const ready = mapId => { readyMaps.add(Number(mapId)); return true; };\n"
         "    const isReady = mapId => forced || readyMaps.has(Number(mapId));\n",
         "    // (the hermitage pocket 155-157 is switched off by WyspaData.HERMITAGE_OPEN - also against the F9 force)\n"
         "    const closed = mapId => !D.HERMITAGE_OPEN && D.HERMITAGE_MAPS.includes(Number(mapId));\n"
         "    const ready = mapId => { if (closed(mapId)) return false; readyMaps.add(Number(mapId)); return true; };\n"
         "    const isReady = mapId => !closed(mapId) && (forced || readyMaps.has(Number(mapId)));\n")])
    js_patch("js/plugins/Pustelnia_Data.js", [
        ('K50: { kind: "K", giver: "pustelnik", icon: 147, offer: ', 'K50: { kind: "K", giver: "pustelnik", icon: 147, oferta: "pustelniaOtwarta", offer: '),
        ('D23: { kind: "D", giver: "pustelnik", icon: 189, offer: ', 'D23: { kind: "D", giver: "pustelnik", icon: 189, oferta: "pustelniaOtwarta", offer: ')])
    js_patch("js/plugins/Pustelnia.js", [(
        "    w.haki({\n        // D23: the step's words (what is read, what waits in the bag, where to look); the marker over Kleofas\n",
        "    w.haki({\n        // K50, D23 are offered only while the hermitage is on (WyspaData.HERMITAGE_OPEN, Wyspa.isReady)\n"
        "        pustelniaOtwarta: () => { const wy = W(); return !!(wy && wy.isReady && wy.isReady(D.MAP)); },\n"
        "        // D23: the step's words (what is read, what waits in the bag, where to look); the marker over Kleofas\n")])
    js_patch("js/plugins/Podroznicy_Sprawy.js", [(
        '        d40Oferta: () => pierwszaWizyta("kartograf"),\n',
        '        // (D40 needs five of six view points, two of them on 155 and 157: off while the hermitage is - WyspaData.HERMITAGE_OPEN)\n'
        '        d40Oferta: () => pierwszaWizyta("kartograf") && !!(window.WyspaData && window.WyspaData.HERMITAGE_OPEN),\n')])
    # the springs: the ring is solid but for the drinking cell in front (Occupy: the ring's three cells), the neighbour's fence at his yard
    js_patch("js/plugins/Zasoby.js", [(
        'IMG.spring, { kind: "spring:" + sp.key, step: true })];',
        'IMG.spring, { kind: "spring:" + sp.key, step: true, note: "<Occupy:left=1,right=1>" })];')])
    js_patch("js/plugins/Zasoby_Data.js", [("        fence: { id: 2195, x: 39, y: 52 },\n", "        fence: { id: 2195, x: 8, y: 21 },   // (2026-11-11: was on the plot's west gate, 39,52 - a lone fence on a path; now at the neighbour's yard)\n")])
    js_patch("js/plugins/Okolice_Data.js", [(
        '{key: "zagroda_plot", pkg: "A", map: 3, kind: "fence", name: "Resztki płotu", mode: "reach", x: 39, y: 49, w: 1, h: 4},',
        '{key: "zagroda_plot", pkg: "A", map: 3, kind: "fence", name: "Resztki płotu", mode: "reach", x: 8, y: 18, w: 1, h: 4},')])


if __name__ == "__main__":
    if os.path.isdir(STAG):
        for sub in ("data", "js", "img"): shutil.rmtree(os.path.join(STAG, sub), ignore_errors=True)
    print("== mapy"); map020(); map003(); map004(); map125()
    print("== kafle A2"); sheets()
    print("== wtyczki"); plugins()
    print("gotowe: " + STAG)
