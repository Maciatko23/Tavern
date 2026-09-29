# python check_decor.py  -> every problem of HomeDecor's decorations in the installed cottage (data/Map019.json), exit code 1 if any
# The cottage's placement rules (tools/house/check_house.py, from the tavern's check_placement.py) applied to the decorations of
# every season (all keepsakes earned), read from decor_index.json (what make_decor.py placed where) and the installed tileset-8
# flags:
#   1 table items   - a thing standing on the table lies inside its top surface, EDGE px from every edge
#   2 squeezed      - every decoration standing on the floor has a walkable neighbour
#   3 walkways      - every floor cell reachable from the landing stays reachable (but the decorations' own cells); no new
#                     1-cell slot squeezed between furniture; nothing (standing or lying) on the hearth rug, the runner from the
#                     door, the landing or the doorway
#   4 wall rhythm   - the wycinanki at one height and even spacing; the receipt at the Holy Mother's height and size
#   5 symmetry      - the wycinanki about the house's axis (the hearth, x 9.5), the receipt and the picture about grandpa's window,
#                     the pumpkins about the door, the jug and the basket about the table's middle
#   6 wall clutter  - a wall decoration does not overlap the wall things already there (windows, curtains, shelves, pegs, the
#                     picture, candles, herbs) nor another decoration - but where it is meant to (the towel and the spruce on the
#                     picture, the tusk on the antlers, the spruce on the receipt)
import os, sys, json
from collections import defaultdict
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "tavern"))
sys.path.insert(0, os.path.join(ROOT, "tools", "house"))
from engine import Engine
import check_placement as CP
import check_house as CH

EDGE = 2
KEEP_FREE = {(8, 5), (9, 5), (10, 5), (8, 6), (9, 6), (10, 6), (9, 8), (9, 9), (9, 10), (9, 11), (9, 12)}
SLOTS = {   # (the plugin's slots: key -> (event id, x, y, blocks))
    "rogi": (980, 1, 2, 0), "kiel": (981, 1, 2, 0), "list": (982, 1, 3, 0), "polka": (983, 3, 2, 0), "skora": (984, 3, 6, 0),
    "rama": (985, 17, 2, 0), "recznik": (986, 15, 2, 0), "wyc_2": (987, 2, 3, 0), "wyc_7": (988, 7, 3, 0), "wyc_11": (989, 11, 3, 0),
    "wyc_16": (990, 16, 3, 0), "chodnik": (991, 16, 6, 0), "komin": (992, 9, 2, 0), "stol_p": (993, 5, 10, 0), "stol_l": (994, 2, 10, 0),
    "wigilia": (995, 4, 10, 0), "dynie_l": (996, 8, 11, 1), "dynie_r": (997, 10, 11, 1), "snop": (998, 17, 7, 1)}
FRAME = {"!House_Decor": (144, 144), "!$House_Decor_Big": (288, 192)}
MEANT = {("recznik", "obrazek"), ("recznik_zima", "obrazek"), ("kiel_rog", "rogi"), ("pokwitowanie_zima", "pokwitowanie")}

def load(p):
    with open(p, "rb") as f: return json.loads(f.read().decode("utf-8"))

def season_looks(se, easter, wig):
    """what every slot shows in a season (all keepsakes earned) - HomeDecor.js's lookOf"""
    return {"rogi": "rogi", "kiel": "kiel_rog", "list": "list", "polka": "polka_oba", "skora": "skora",
            "rama": "pokwitowanie_zima" if se == 3 else "pokwitowanie", "recznik": "recznik_zima" if se == 3 else "recznik",
            "wyc_2": "wyc_2", "wyc_7": "wyc_7", "wyc_11": "wyc_11", "wyc_16": "wyc_16", "chodnik": "chodnik",
            "komin": "ziola" if se == 1 else "wieniec" if se == 2 else None,
            "stol_p": None if wig else "bazie" if se == 0 else "kwiaty" if se == 1 else None,
            "stol_l": None if wig else "pisanki" if easter else "jablka" if se == 2 else None,
            "wigilia": "wigilia" if wig else None, "dynie_l": "dynie_l" if se == 2 else None, "dynie_r": "dynie_r" if se == 2 else None,
            "snop": "snop" if wig else None}

CASES = [("wiosna", 0, False, False), ("Wielkanoc", 0, True, False), ("lato", 1, False, False), ("jesień", 2, False, False),
         ("zima", 3, False, False), ("Wigilia", 3, False, True)]

def box_px(idx, look):
    """the look's solid box in map pixels (its frame round its event's cell)"""
    v = idx[look]
    fw, fh = FRAME[v["sheet"]]
    x, y = v["cell"]
    ox, oy = x * 48 + 24 - fw // 2, (y + 1) * 48 - fh
    b = v["box"]
    return (ox + b[0], oy + b[1], ox + b[2], oy + b[3])

def wall_things(m):
    """the wall things already on the cottage's walls (rows 0..3): the Winlu tiles on layers 2-3 and the events' pictures"""
    W, H, data = m["width"], m["height"], m["data"]
    out = []
    for y in range(0, 4):
        for x in range(W):
            for z in (2, 3):
                ref = CP.tile_ref(data[(z * H + y) * W + x])
                if not ref: continue
                b = CP.tile_art(*ref)
                if b: out.append(("%s(%d,%d)" % ref, (x * 48 + b[0], y * 48 + b[1], x * 48 + b[2], y * 48 + b[3])))
    chars = os.path.join(ROOT, "img", "characters")
    winlu = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Interior", "Remaster", "characters")
    for e in m["events"]:
        if not e or e["y"] > 4: continue
        img = e["pages"][0]["image"]
        name = img["characterName"]
        if not name: continue
        p = os.path.join(chars, name + ".png")
        if not os.path.exists(p): p = os.path.join(winlu, name + ".png")
        im = Image.open(p).convert("RGBA")
        big = name.startswith("!$") or name.startswith("$")
        fw, fh = (im.width // 3, im.height // 4) if big else (im.width // 12, im.height // 8)
        bx, by = (0, 0) if big else ((img["characterIndex"] % 4) * 3, (img["characterIndex"] // 4) * 4)
        fr = np.array(im.crop(((bx + img["pattern"]) * fw, (by + img["direction"] // 2 - 1) * fh, (bx + img["pattern"] + 1) * fw, (by + img["direction"] // 2) * fh)))
        ys, xs = np.nonzero(fr[:, :, 3] > 100)
        if not len(xs): continue
        ox, oy = e["x"] * 48 + 24 - fw // 2, (e["y"] + 1) * 48 - fh
        kind = "obrazek" if "Matki" in e["name"] else e["name"]
        out.append((kind, (ox + int(xs.min()), oy + int(ys.min()), ox + int(xs.max()) + 1, oy + int(ys.max()) + 1)))
    return out

def overlap(a, b, m=0):
    return a[0] < b[2] - m and b[0] < a[2] - m and a[1] < b[3] - m and b[1] < a[3] - m

def check(m, flags, idx, name, se, easter, wig):
    W, H, data = m["width"], m["height"], m["data"]
    looks = season_looks(se, easter, wig)
    problems = defaultdict(list)
    base = [e for e in m["events"] if e]
    eng0 = Engine(W, H, data, flags, base)
    landing = (9, 11)
    people = []
    before = eng0.reach([landing])
    decor_events = []
    for key, look in looks.items():
        if not look: continue
        eid, x, y, blocks = SLOTS[key]
        decor_events.append({"id": eid, "x": x, "y": y, "note": "", "pages": [{"conditions": {}, "priorityType": 1 if blocks else 0, "through": not blocks}]})
    eng = Engine(W, H, data, flags, base + decor_events)
    after = eng.reach([landing])
    blocked = {(e["x"], e["y"]) for e in decor_events if e["pages"][0]["priorityType"] == 1}
    # 3 walkways
    for c in sorted(before - after - blocked):
        problems["3 pole odcięte przez ozdobę"].append("(%d,%d)" % c)
    for c in blocked & KEEP_FREE:
        problems["3 ozdoba na przejściu / dywanie / w drzwiach"].append("(%d,%d)" % c)
    for key, look in looks.items():
        if not look or idx[look]["kind"] not in ("floor", "flat"): continue
        bx = box_px(idx, look)
        for (x, y) in KEEP_FREE:
            if overlap(bx, (x * 48, y * 48, x * 48 + 48, y * 48 + 48)):
                problems["3 ozdoba na przejściu / dywanie / w drzwiach"].append("%s nad (%d,%d)" % (look, x, y))
    furn = set(eng0.block) | {(x, y) for x in range(W) for y in range(H) if not eng0.tile_open(x, y)}
    def slots_of(e, hard):
        out = set()
        for (x, y) in e:
            nb = [(x + dx, y + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))]
            walk = [n for n in nb if n in e]
            if len(walk) == 1 and len([n for n in nb if n in hard]) >= 2: out.add((x, y))
        return out
    beds = {(1, 4), (1, 5), (16, 4), (17, 4), (16, 5), (17, 5)}
    new_slots = slots_of(after, furn | blocked) - slots_of(before, furn)
    for c in sorted(new_slots):
        if any((c[0] + dx, c[1] + dy) in beds for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))): continue   # (a bedside nook)
        problems["3 szczelina wciśnięta między ozdobę a meble"].append("(%d,%d)" % c)
    if (9, 12) not in after: problems["3 drzwi nieosiągalne"].append("(9,12)")
    # 2 squeezed
    for (x, y) in blocked:
        if not any((x + dx, y + dy) in after for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            problems["2 ściśnięte (brak wolnego pola obok)"].append("(%d,%d)" % (x, y))
    # 1 table items: the foot of the thing inside the table's top surface
    S = CH.surfaces()
    def surface_rect(px, py):
        x, y = px // 48, py // 48
        for z in (3, 2, 1):
            ref = CP.tile_ref(data[(z * H + y) * W + x])
            if ref and ref in S:
                b = S[ref]
                return (x * 48 + b[0], y * 48 + b[1], x * 48 + b[2], y * 48 + b[3])
        return None
    for key, look in looks.items():
        if not look or idx[look]["kind"] != "table": continue
        x0, y0, x1, y1 = box_px(idx, look)
        fy0 = y1 - max(3, (y1 - y0) // 4)
        for (px, py) in ((x0 - EDGE, fy0), (x1 + EDGE - 1, fy0), (x0 - EDGE, y1 + EDGE - 1), (x1 + EDGE - 1, y1 + EDGE - 1)):
            r = surface_rect(px, py)
            if not r or not (r[0] <= px < r[2] and r[1] <= py < r[3]):
                problems["1 przedmiot poza blatem / na krawędzi"].append(look); break
    # 4 wall rhythm, 5 symmetry
    cen = lambda b: ((b[0] + b[2]) / 2.0, (b[1] + b[3]) / 2.0)
    wyc = [cen(box_px(idx, looks[k])) for k in ("wyc_2", "wyc_7", "wyc_11", "wyc_16")]
    if max(c[1] for c in wyc) - min(c[1] for c in wyc) > 1: problems["4 wycinanki na różnych wysokościach"].append(str([c[1] for c in wyc]))
    xs = sorted(c[0] / 48 for c in wyc); gaps = [b - a for a, b in zip(xs, xs[1:])]
    if max(gaps) - min(gaps) > 1.001: problems["4 nierówne odstępy wycinanek"].append(str(xs))
    if abs((wyc[0][0] + wyc[3][0]) / 2 - 9.5 * 48) > 1 or abs((wyc[1][0] + wyc[2][0]) / 2 - 9.5 * 48) > 1:
        problems["5 wycinanki niesymetryczne (oś 9.5)"].append(str([c[0] / 48 for c in wyc]))
    things = wall_things(m)
    pic = next((b for k, b in things if k == "obrazek"), None)
    rec = box_px(idx, "pokwitowanie")
    if pic:
        if (pic[1], pic[3], pic[2] - pic[0]) != (rec[1], rec[3], rec[2] - rec[0]):
            problems["4 pokwitowanie nie na wysokości / w rozmiarze obrazka"].append("%s / %s" % (pic, rec))
        if abs((pic[0] + pic[2]) / 2 + (rec[0] + rec[2]) / 2 - 2 * 16.5 * 48) > 1:
            problems["5 obrazek i pokwitowanie niesymetryczne (okno 16.5)"].append("%s / %s" % (pic, rec))
    if looks["dynie_l"]:
        a, b = cen(box_px(idx, "dynie_l")), cen(box_px(idx, "dynie_r"))
        if abs((a[0] + b[0]) / 2 - 9.5 * 48) > 1 or abs(a[1] - b[1]) > 0.5: problems["5 dynie niesymetryczne (drzwi 9.5)"].append("%s %s" % (a, b))
    tl, tr = looks["stol_l"], looks["stol_p"]
    if tl and tr:
        a, b = box_px(idx, tl), box_px(idx, tr)
        if abs(a[3] - b[3]) > 1: problems["5 dzbanek i koszyk nie na jednej linii"].append("%s %s" % (a, b))
    # 6 wall clutter
    wall_looks = [(look, box_px(idx, look)) for key, look in looks.items() if look and idx[look]["kind"] == "wall"]
    for look, bx in wall_looks:
        for kind, tb in things:
            if (look, kind) in MEANT: continue
            if overlap(bx, tb, 1): problems["6 ozdoba nachodzi na rzecz na ścianie"].append("%s na %s" % (look, kind))
        for other, ob in wall_looks:
            if other <= look or (look, other) in MEANT or (other, look) in MEANT: continue
            if overlap(bx, ob, 1): problems["6 ozdoby nachodzą na siebie"].append("%s / %s" % (look, other))
    total = sum(len(v) for v in problems.values())
    print("%-10s %2d ozdób, zamknięte pola %s, osiągalne %d z %d" % (name, sum(1 for v in looks.values() if v), sorted(blocked) or "-", len(after), len(before)))
    for k in sorted(problems):
        v = problems[k]
        print("   %s: %d  %s" % (k, len(v), "; ".join(v[:10])))
    return total

def main():
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8")
    m = load(os.path.join(ROOT, "data", "Map019.json"))
    flags = load(os.path.join(ROOT, "data", "Tilesets.json"))[m["tilesetId"]]["flags"]
    idx = load(os.path.join(HERE, "decor_index.json"))
    bad = sum(check(m, flags, idx, *c) for c in CASES)
    print("WYNIK: %s" % ("OK - nic do poprawy" if not bad else "%d problemów" % bad))
    sys.exit(1 if bad else 0)

if __name__ == "__main__":
    main()
