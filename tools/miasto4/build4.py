# -*- coding: utf-8 -*-
"""Kruczogród od nowa (miasto4). Składa NOWĄ Map008 w tools/miasto4/staging/data (nic poza stagingiem nie jest ruszane):
 - zostają: pierścień murów z bramami, wzgórze zamkowe (x0-79, y0-33: tawerna, ogród rycerzy, kaplica + cmentarz, dom grabarza, dziedziniec, podwórze stajenne, Dom 15),
   pas południowy y>=97 (Błonia: pola, szubienica, miejsce obozu W6) - kopie kafli i zdarzeń z obecnej data/Map008.json (kafle B-E przenumerowane na Miasto2_*),
 - nowe: plac ze studnią w środku, domy mieszkańców (Winlu w stylu paczki + paczka), warsztaty, ogrody, sady.
  python tools/miasto4/zestaw4.py && python tools/miasto4/build4.py [--podglad]"""
import os, sys, json, copy, random, shutil
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib4 import *   # noqa

BASE_RAW = open(ROOT + "data/Map008.json", "rb").read()
open(STG + "base_Map008.json", "wb").write(BASE_RAW)
BASE = json.loads(BASE_RAW.decode("utf-8"))
OLD = {e["id"]: e for e in BASE["events"] if e}
M27 = load(ROOT + "data/Map027.json")
E27 = {e["id"]: e for e in M27["events"] if e}
ALL = [(x, y) for y in range(N) for x in range(N)]
rnd = random.Random(2026)
ERR = []


def in_ring(x, y): return x < 2 or x > 117 or y < 4 or y > 114
def in_K(x, y): return x <= 79 and y <= 33
def in_K2(x, y): return y >= 97
def kept(x, y): return in_ring(x, y) or in_K(x, y) or in_K2(x, y)


L = Layers()
L.kind(0, ALL, 19)
D0 = BASE["data"]
missing = set()
for z in range(4):
    for y in range(N):
        for x in range(N):
            if not kept(x, y): continue
            t = D0[(z * N + y) * N + x]
            if t == 0: continue
            if t < 1024:
                if t not in O2N: missing.add(t); continue
                t = O2N[t]
            elif z == 0 and (t - 2048) // 48 == 19: continue
            L.tile(z, x, y, t)
for y in range(N):
    for x in range(N):
        r = D0[(5 * N + y) * N + x]
        if r and kept(x, y): L.region[(x, y)] = r
if missing: ERR.append("kafle B-E bez przeniesienia: %s" % sorted(missing)[:20])

# ------------------------------------------------------------------ zdarzenia
EV = {}
KEEPIDS = set()
for i, e in OLD.items():
    if kept(e["x"], e["y"]):
        EV[i] = copy.deepcopy(e); KEEPIDS.add(i)
STABLE = {22, 39, 241, 242, 245, 246, 247, 43, 44, 45, 142}
STRUCT = {i for i, e in OLD.items() if i not in KEEPIDS and (e["name"].startswith(("Drzwi", "Miejsce", "Studnia", "Furtka", "Płyta")) or any(c["code"] == 201 for pg in e["pages"] for c in pg["list"]))}
_free = [i for i in list(range(1, 500)) + list(range(500, 656)) if i not in KEEPIDS and i not in STRUCT]
USED_NEW = set()


def new_id():
    i = _free.pop(0)
    USED_NEW.add(i)
    return i


def take(i):
    """ten sam numer zdarzenia ze starej mapy (stabilne id) w nowym miejscu"""
    if i in _free: _free.remove(i)
    USED_NEW.add(i)
    return i


def mv(i, x, y, **kw):
    e = copy.deepcopy(OLD[i])
    e["x"], e["y"] = x, y
    e.update(kw)
    take(i)
    EV[i] = e
    return e


def clone(tid, x, y, name=None, note=None, **img):
    e = copy.deepcopy(OLD[tid])
    e["id"] = new_id()
    e["x"], e["y"] = x, y
    if name is not None: e["name"] = name
    if note is not None: e["note"] = note
    for pg in e["pages"]: pg["image"].update(img)
    EV[e["id"]] = e
    return e


TREE = {"pear": 16, "apple": 52, "small": 291, "pine_a": 293, "pine_b": 318}
OCC = set()         # kratki zajęte budynkami i ich "oddechem"
EVCELL = set()      # kratki ze zdarzeniami-rekwizytami


def tree(kind, x, y):
    if (x, y) in OCC or (x, y) in EVCELL or kept(x, y) and False: return None
    EVCELL.add((x, y))
    return clone(TREE[kind], x, y)


def prop(tid, x, y, **kw):
    if (x, y) in OCC or (x, y) in EVCELL: return None
    EVCELL.add((x, y))
    return clone(tid, x, y, **kw)


def lamp(x, y):
    return prop(9, x, y)


def reserve(x0, y0, w, h, m=1):
    for yy in range(y0 - m, y0 + h + m):
        for xx in range(x0 - m, x0 + w + m): OCC.add((xx, yy))


def free_rect(x0, y0, w, h, m=0):
    for yy in range(y0 - m, y0 + h + m):
        for xx in range(x0 - m, x0 + w + m):
            if (xx, yy) in OCC: return False
            if kept(xx, yy) and 4 <= xx <= 115 and 4 <= yy <= 114 and not (xx > 79 and yy <= 33) and not (yy >= 96 and False): return False
    return True


BUILD = {}          # klucz budynku -> {"drzwi": [(x,y)...], "front": [(x,y)...], "rect": (x0,y0,w,h)}
DOORS027 = {"w_kuznia": [69], "w_kantor": [57, 58], "w_piekarnia": [85], "w_straznica": [81], "w_woziwoda": [89], "w_dom15": [43],
            "w_ratusz": [76], "w_kamienica": [48], "w_izba": [96], "w_grabarz": [39]}
PACKDOORS = {"ratusz": [(1, 7), (6, 7)]}


def put_pack(name, key, x0, y0, z=2):
    u = UK[key]
    if not free_rect(x0, y0, u["w"], u["h"]): ERR.append("kolizja: %s %s @%d,%d" % (name, key, x0, y0))
    for j, row in enumerate(u["kafle"]):
        for i, t in enumerate(row): L.tile(z, x0 + i, y0 + j, t)
    reserve(x0, y0, u["w"], u["h"])
    ds = PACKDOORS.get(key) or ([tuple(u["drzwi"])] if u.get("drzwi") else [])
    BUILD[name] = {"drzwi": [(x0 + i, y0 + j) for i, j in ds], "rect": (x0, y0, u["w"], u["h"]), "key": key}
    return BUILD[name]


def put_winlu(name, key, x0, y0):
    u = UK[key]
    if not free_rect(x0, y0, u["w"], u["h"]): ERR.append("kolizja: %s %s @%d,%d" % (name, key, x0, y0))
    for k, v in u["auto"].items():
        z, i, j = map(int, k.split(","))
        L.tile(z, x0 + i, y0 + j, v)
    for k, (z0, t) in u["kafle"].items():
        z, i, j = map(int, k.split(","))
        L.tile(z, x0 + i, y0 + j, t)
    reserve(x0, y0, u["w"], u["h"])
    doors, imgs = [], []
    for q in u["zdarzenia"]:
        e = q["ev"]
        if e["id"] in DOORS027[key]:
            doors.append((DOORS027[key].index(e["id"]), x0 + q["i"], y0 + q["j"], copy.deepcopy(e["pages"][0]["image"])))
    doors.sort()
    for q in u["zdarzenia"]:
        e = q["ev"]
        if e["id"] in DOORS027[key]: continue
        nm = e["name"]
        if nm.startswith("Drogowskaz") or nm.startswith("Kosz") or nm.startswith("Wóz"): continue
        x, y = x0 + q["i"], y0 + q["j"]
        if not (0 <= x < N and 0 <= y < N): continue
        if nm.startswith("Latarnia"):
            ev = clone(9, x, y); ev["pages"][0]["image"].update(copy.deepcopy(e["pages"][0]["image"]))
            continue
        ne = copy.deepcopy(e)
        ne["id"] = new_id(); ne["x"], ne["y"] = x, y
        for pg in ne["pages"]:
            tt = pg["image"].get("tileId", 0)
            if tt: pg["image"]["tileId"] = u["evtile"][str(tt)]
        EV[ne["id"]] = ne
    BUILD[name] = {"drzwi": [(x, y) for _, x, y, _ in doors], "imgs": [im for _, _, _, im in doors], "rect": (x0, y0, u["w"], u["h"]), "key": key}
    return BUILD[name]


def door_event(oldid, x, y, img=None):
    e = mv(oldid, x, y)
    if img:
        for pg in e["pages"]:
            pg["image"].update(img)
    return e


def front(name, k=0):
    x, y = BUILD[name]["drzwi"][k]
    return (x, y + 1)


def solid0(c): return L.L[0].get(c, ('k', 19))[0] == 't'


def yard(x0, y0, x1, y1, floor=17, fence=22, gaps=(), soft=True):
    cells = {c for c in rectc(x0, y0, x1, y1) if not solid0(c)}
    L.kind(0, cells, floor)
    if fence:
        edge = {(x, y) for (x, y) in cells if x in (x0, x1) or y in (y0, y1)}
        edge -= set(gaps)
        edge = {c for c in edge if not any(solid0((c[0] + dx, c[1] + dy)) for dx in (-1, 0, 1) for dy in (-1, 0, 1))}
        L.kind(1, edge, fence)
    OCC.update(edge if fence else ())
    return cells


def grass(cells, kind=27):
    cells = {c for c in cells if not solid0(c)}
    L.kind(0, cells, kind)


def orchard(cx, cy, rx, ry, seed, n, kinds=("apple", "pear"), flowers=True, sp=2.0):
    cells = blobc(cx, cy, rx, ry, seed, 0.35) - OCC
    grass(cells)
    r = random.Random(seed)
    placed = []
    for _ in range(n * 25):
        if len(placed) >= n: break
        x, y = r.choice(sorted(cells))
        if any(abs(x - a) < sp and abs(y - b) < sp for a, b in placed): continue
        if tree(r.choice(kinds), x, y): placed.append((x, y))
    if flowers:
        fl = {c for c in cells if r.random() < 0.10 and c not in EVCELL}
        L.kind(1, fl, 28)
    return cells


# =============================================================================================== UKŁAD
SHIFT = (9, 10)          # stary plac (studnia ok. 51,50) -> nowy środek (60,60)
SP = {}                  # klucz miejsca -> (x, y)
DROPSPOT = {"dom7_drzwi", "dom10_drzwi", "dom12_drzwi", "dom13_drzwi", "dom14_drzwi", "dom11_drzwi_" }


def sp(key, x, y): SP[key] = (x, y)


# ---- studnia w środku placu (Winlu 2x4) -------------------------------------------------------
WX, WY = 59, 57
put_winlu("studnia", "w_studnia", WX, WY)
WELLFRONT = (WX, WY + 4)
mv(241, WX, WY + 3); mv(242, WX + 1, WY + 3); mv(245, WX + 1, WY + 2)
# plac: bruk wszędzie; plama kostki z kamienia (32) wokół studni
L.kind(1, set(), 0)
OCC.update(rectc(WX - 1, WY - 1, WX + 2, WY + 5))

# ---- rząd północny: fronty przy ulicy głównej (y 49-51), dolna krawędź y=48; rząd południowy: fronty przy alejce y 81-83, dolna krawędź y=79
put_pack("szwaczka", "dom_kwiaty", 12, 43)
put_winlu("dom9", "w_izba", 19, 44)
put_pack("dom11", "dom_szachulec", 27, 41)
put_pack("agata", "sklep", 33, 39)
put_winlu("piekarnia", "w_piekarnia", 39, 39)
put_pack("ratusz", "ratusz", 57, 41)
put_winlu("kantor", "w_kantor", 67, 42)
put_winlu("bronek", "w_ratusz", 79, 39)
put_pack("weteran", "dom_wieza", 89, 41)
put_pack("dzwonnica", "dzwonnica", 94, 43)
put_winlu("straz", "w_straznica", 103, 42)
put_winlu("kuznia", "w_kuznia", 8, 73)
put_pack("garbarz", "chata_b", 33, 74)
put_winlu("ciesla", "w_dom15", 50, 70)
put_winlu("woziwoda", "w_woziwoda", 72, 74)
put_pack("wdowa", "chata_bale", 80, 74)
put_winlu("dom5", "w_grabarz", 87, 76)
put_winlu("dom2", "w_kamienica", 94, 68)

# ---- drzwi (id zostają, miejsca nowe) ----------------------------------------------------------
IMG = lambda n, k=0: BUILD[n].get("imgs", [None, None])[k] if BUILD[n].get("imgs") else None
DOORMAP = [("agata", 63, 0), ("piekarnia", 88, 0), ("ratusz", 114, 0), ("ratusz", 4, 1), ("kantor", 94, 0), ("kantor", 95, 1), ("bronek", 121, 0),
           ("straz", 152, 0), ("weteran", 216, 0), ("szwaczka", 129, 0), ("dom9", 218, 0), ("dom11", 235, 0), ("kuznia", 134, 0), ("garbarz", 141, 0),
           ("ciesla", 204, 0), ("dom5", 197, 0), ("woziwoda", 137, 0), ("wdowa", 180, 0), ("dom2", 84, 0), ("dzwonnica", 236, 0)]
for n, oid, k in DOORMAP:
    x, y = BUILD[n]["drzwi"][k]
    door_event(oid, x, y, IMG(n, k))
print("budynki:", len(BUILD))
exec(open(HERE + '/cechy5.py', encoding='utf-8').read())


# =============================================================================================== ZAPIS
def finish():
    data = L.resolve()
    n = N * N
    # bruk (rodzaj 19) zawsze w pełnym środku (kształt 0), bez trawiastych brzegów
    for i in range(n):
        t = data[i]
        if t >= 2048 and (t - 2048) // 48 == 19: data[i] = 2048 + 19 * 48
    m = copy.deepcopy(BASE)
    m["data"] = data
    m["events"] = [None] + [EV[i] for i in sorted(EV)]
    # zdarzenia: tablica indeksowana id (puste miejsca = null), jak w edytorze
    arr = [None] * (max(EV) + 1)
    for i, e in EV.items(): arr[i] = e
    m["events"] = arr
    return m


def save(m):
    os.makedirs(STG + "data", exist_ok=True)
    with open(STG + "data/Map008.json", "wb") as f: f.write(WS.map_text(m).encode("utf-8"))


def preview(out, region=None, scale=0.2):
    sys.path.insert(0, ROOT + "tools/mapy")
    import mapylib
    ts = load(STG + "data/Tilesets.json")
    raw = load(STG + "data/Map008.json")
    t = ts[13]
    z = mapylib.Zestaw(11); z.id = 13; z.pliki = t["tilesetNames"]; z.flags = list(t["flags"]) + [0] * (8192 - len(t["flags"]))
    z._sheets = {}; z._tiles = {}; z._alpha = {}; z._bbox = {}
    mapylib.zestaw = lambda i: z
    mp = mapylib.Mapa(8, raw=raw); mp.zest = z
    im = mapylib.render(mp, region=region, scale=scale)
    im.convert("RGB").save(out)
    print(out, im.size)


EXITS = [   # (mapa wnętrza, id zdarzenia wyjścia, budynek, nr drzwi, dx, dy, kierunek (None = bez zmiany))
    (102, 11, "piekarnia", 0), (103, 7, "kantor", 1), (103, 13, "kantor", 0), (104, 12, "ratusz", 0), (104, 15, "ratusz", 1), (105, 8, "kuznia", 0),
    (106, 13, "garbarz", 0), (107, 9, "woziwoda", 0), (108, 13, "dzwonnica", 0), (109, 14, "bronek", 0), (180, 25, "straz", 0), (182, 11, "agata", 0),
    (183, 16, "dom2", 0), (184, 13, "szwaczka", 0), (185, 19, "wdowa", 0), (186, 14, "dom5", 0), (187, 20, "ciesla", 0), (189, 13, "weteran", 0),
    (190, 8, "dom9", 0), (194, 11, "dom11", 0)]


def patch_interiors():
    out = []
    done_maps = set()
    for mid, eid, name, k in EXITS:
        rel = "data/Map%03d.json" % mid
        m, lay = WS.read_json(rel if mid not in done_maps else "tools/miasto4/staging/" + rel)
        done_maps.add(mid)
        x, y = BUILD[name]["drzwi"][k]
        done = False
        for e in m["events"]:
            if e and e["id"] == eid:
                for pg in e["pages"]:
                    for c in pg["list"]:
                        if c["code"] == 201 and c["parameters"][0] == 0 and c["parameters"][1] == 8:
                            c["parameters"][2], c["parameters"][3] = x, y + 1; done = True
        if not done: ERR.append("brak wyjścia %s ev%s" % (rel, eid))
        open(STG + "data/Map%03d.json" % mid, "wb").write(WS.json_text(m, lay))
        out.append((mid, eid, x, y + 1))
    # dno studni: lina wychodzi tuż przy studni
    m, lay = WS.read_json("data/Map118.json")
    for e in m["events"]:
        if e and e["id"] == 14:
            for pg in e["pages"]:
                for c in pg["list"]:
                    if c["code"] == 201 and c["parameters"][1] == 8:
                        c["parameters"][2], c["parameters"][3] = WX + 2, WY + 2
    open(STG + "data/Map118.json", "wb").write(WS.json_text(m, lay))
    out.append((118, 14, WX + 2, WY + 2))
    return out


def post_region():
    """region 31 (lądowisko orła) = przechodnie kratki placu x46-78, y51-69 bez zdarzeń-przeszkód; zapis ponownie"""
    import kontrola4 as K
    mp, raw = K.mapa()
    blk = {(e["x"], e["y"]) for e in raw["events"] if e and e["pages"][0]["priorityType"] == 1 and not e["pages"][0]["through"] and (e["pages"][0]["image"]["characterName"] or e["pages"][0]["image"].get("tileId"))}
    n = 0
    for y in range(51, 70):
        for x in range(46, 79):
            if (x, y) in blk or not all(mp.przechodnia(x, y, d) for d in (2, 4, 6, 8)): continue
            L.region[(x, y)] = 31; n += 1
    return n


if __name__ == "__main__":
    for e in ERR: print("BŁĄD:", e)
    save(finish())
    n31 = post_region()
    m = finish(); save(m)
    ex = patch_interiors()
    for e in ERR: print("BŁĄD:", e)
    json.dump({"drzwi": {k: v["drzwi"] for k, v in BUILD.items()}, "sp": SP, "studnia": [WX, WY], "region31": n31, "wyjscia": ex,
               "pominiete": [list(d) for d in DROPPED], "id_max": max(EV)}, open(HERE + "/nowe.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("zdarzeń:", len(EV), "region31:", n31, "pominięte:", len(DROPPED))
    if "--podglad" in sys.argv:
        preview(HERE.replace("\\", "/") + "/_pod/n_calosc.png", None, 0.2)
