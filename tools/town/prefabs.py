# python prefabs.py [extract] [describe] [gallery]   (default: all three)
# The prefab library of the town: buildings and pieces cut tile-for-tile out of the tileset author's own sample maps
# (tools/town/winlu_samples, his tileset 1 = the proposed town tileset, see town_tileset.py):
#   extract   -> tools/town/prefabs/<key>.json: the rectangle's 4 tile layers + the shadow layer + the region layer (raw
#                tile ids, the autotile shapes as the author set them), the events standing in it (relative x, y; name,
#                note, pages - dormers, chimneys, signs, lamps, doors, banners, statues, trees), the character sheets they
#                need, and the cells the author's flags / events close
#   describe  -> tools/town/prefabs/_layers.txt: layer by layer which sheet / kind / tile each prefab uses (RECIPES.md is
#                written from it)
#   gallery   -> docs/miasteczko/prefaby.png: every prefab as the author drew it (a crop of his map), as the prefab alone
#                (what a stamp carries), and what closes the way in it (red: tile flags, orange: events)
# stamp(mp, key, x, y, ground=True) puts a prefab onto a tools/newstart NewMap (the town builder), ground=False leaves the
# A1/A2 ground of the rectangle out (the building only on the town's own ground).
import os, sys, json, copy
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "..", "tavern"))
import mzrender as R
import winlu
from engine import Engine, active_page, occupy_cells

ROOT = R.ROOT
PDIR = os.path.join(HERE, "prefabs")
DOCS = os.path.join(ROOT, "docs", "miasteczko")
T = 48

# key, sample map, x0, y0, x1, y1 (inclusive), Polish name, what it could be in our town
PREFABS = [
    ("karczma_szachulcowa", 10, 1, 1, 8, 10, "Karczma z krzyżowym szczytem, szyld z kuflem", "dom / piekarnia"),
    ("dom_lukarny_czarny", 10, 9, 6, 12, 12, "Dom z czarnym dachem i dwiema lukarnami", "dom"),
    ("sklep_waga", 10, 13, 7, 17, 12, "Sklep z wagą, czerwone drzwi, markiza", "kantor"),
    ("kuznia_otwarta", 10, 21, 6, 27, 12, "Kuźnia z otwartym paleniskiem i stojakami", "kuźnia"),
    ("wieza_helm", 10, 23, 0, 26, 5, "Wieża z niebieskim hełmem", "baszta twierdzy"),
    ("mur_przejscie_posagi", 10, 7, 16, 16, 19, "Mur z przejściem, posągi strażników, pochodnie", "brama miasta"),
    ("mlyn_karczma", 10, 11, 26, 19, 34, "Młyn-karczma z kołem wodnym (wzór 11)", "stary młyn (suche koryto)"),
    ("kamienice_szachulec", 8, 2, 0, 9, 9, "Dwie kamienice szachulcowe z kwiatami", "domy przy rynku"),
    ("twierdza_front", 8, 10, 0, 16, 9, "Front twierdzy: gotyckie okna, chorągwie, posągi", "świątynia / ratusz"),
    ("dom_szczyt_kuznia", 8, 17, 0, 22, 10, "Dom z pomarańczowym szczytem nad kuźnią", "kuźnia"),
    ("brama_zamkowa", 8, 9, 9, 18, 19, "Brama zamkowa z basztami i mostem", "brama twierdzy"),
    ("mury_baszta", 8, 0, 9, 8, 16, "Mury z okrągłą basztą i koszem żarowym", "mury twierdzy"),
    ("dom_lukarny_mikstury", 8, 3, 19, 9, 27, "Dom z lukarnami i szyldem mikstur", "zielarnia"),
    ("spichlerz_drewutnia", 8, 16, 20, 21, 29, "Spichlerz z pomarańczowym szczytem i drewutnią", "piekarnia / spichlerz"),
    ("kosze_zarowe", 8, 24, 6, 27, 9, "Kosze żarowe na słupach, pochodnie", "przed świątynią / ratuszem"),
    ("chata_strzecha", 15, 2, 0, 7, 3, "Chata kryta strzechą, szyld z łukiem", "dom / szewc"),
    ("kuznia_na_tarasie", 15, 8, 1, 17, 11, "Kuźnia na skalnym tarasie ze schodami", "kuźnia (koncepcja C)"),
    ("kantor_waga", 15, 1, 7, 6, 11, "Dom z wagą, czarny dach, latarnie", "kantor"),
    ("kamienica_choragiew", 15, 18, 7, 23, 12, "Kamienny dom z chorągwią i kratą", "posterunek garnizonu"),
    ("studnia", 15, 8, 12, 9, 15, "Studnia (u nas sucha)", "rynek"),
    ("woz_siano", 15, 0, 13, 2, 15, "Wóz z sianem", "rzecz"),
    ("chata_z_bali", 12, 3, 6, 10, 13, "Chata z bali z przybudówką", "dom / zielarnia"),
]

_maps = {}
def sample(mid):
    if mid not in _maps: _maps[mid] = R.load_json(os.path.join(winlu.SAMPLES, "Map%03d.json" % mid))
    return _maps[mid]

def author_flags():
    return R.load_json(os.path.join(winlu.SAMPLES, "Tilesets.json"))[1]["flags"]

def extract_one(key, mid, x0, y0, x1, y1, name, use):
    mp = sample(mid)
    W, H = mp["width"], mp["height"]
    w, h = x1 - x0 + 1, y1 - y0 + 1
    layers = []
    for z in range(6):
        layers.append([[mp["data"][(z * H + y) * W + x] for x in range(x0, x1 + 1)] for y in range(y0, y1 + 1)])
    evs = []
    for e in mp["events"]:
        if not e or not (x0 <= e["x"] <= x1 and y0 <= e["y"] <= y1): continue
        ev = {k: copy.deepcopy(e[k]) for k in ("name", "note", "pages")}
        ev["x"], ev["y"] = e["x"] - x0, e["y"] - y0
        evs.append(ev)
    chars = sorted({pg["image"]["characterName"] for ev in evs for pg in ev["pages"] if pg["image"]["characterName"]})
    pf = {"key": key, "name": name, "use": use, "source": "winlu_samples/Map%03d.json" % mid, "rect": [x0, y0, x1, y1],
          "w": w, "h": h, "tileset": "the author's tileset 1 (tools/town/town_tileset.py)", "layers": layers, "events": evs,
          "characters": chars, "missing_in_img_characters": [c for c in chars if not os.path.exists(ROOT + "img/characters/" + c + ".png")]}
    m = prefab_map(pf)
    eng = Engine(w, h, m["data"], author_flags(), m["events"])
    pf["closed_by_tiles"] = sorted([x, y] for y in range(h) for x in range(w) if not eng.tile_open(x, y))
    pf["closed_by_events"] = sorted([x, y] for (x, y) in eng.block if 0 <= x < w and 0 <= y < h)
    return pf

def prefab_map(pf):
    """the prefab alone as a map (for rendering / checking)"""
    w, h = pf["w"], pf["h"]
    data = []
    for z in range(6):
        for row in pf["layers"][z]: data.extend(row)
    events = [None]
    for i, ev in enumerate(pf["events"], 1):
        e = copy.deepcopy(ev); e["id"] = i
        events.append(e)
    return {"width": w, "height": h, "tilesetId": 1, "data": data, "events": events}

def save(pf):
    os.makedirs(PDIR, exist_ok=True)
    with open(os.path.join(PDIR, pf["key"] + ".json"), "wb") as f:
        f.write(json.dumps(pf, ensure_ascii=False, separators=(",", ":")).encode("utf-8"))

def load(key):
    return R.load_json(os.path.join(PDIR, key + ".json"))

def stamp(mp, key, x, y, ground=True):
    """a prefab onto a NewMap (tools/newstart/nslib.py) at (x, y): every tile as it is (("t", id): the author's autotile
    shapes), shadows, regions, events. ground=False: the A1/A2 tiles of layers 0/1 stay the map's own."""
    pf = load(key)
    for z in range(4):
        for j, row in enumerate(pf["layers"][z]):
            for i, t in enumerate(row):
                if not t: continue
                if not ground and z < 2 and 2048 <= t < 2048 + 48 * 48: continue
                mp.tile(z, x + i, y + j, t)
    for j, row in enumerate(pf["layers"][4]):
        for i, v in enumerate(row):
            if v: mp.shadow[(x + i, y + j)] = v
    for ev in pf["events"]:
        e = {k: copy.deepcopy(ev[k]) for k in ("name", "note", "pages")}
        mp.add(x + ev["x"], y + ev["y"], e, occupy_cells(x + ev["x"], y + ev["y"], ev.get("note")))
    return pf

# ------------------------------------------------------------------------------------------------ describing the layers
def tile_name(t):
    if t <= 0: return None
    if t >= 2048:
        k = (t - 2048) // 48
        s = "A1" if k < 16 else "A2" if k < 48 else "A3" if k < 80 else "A4"
        return "%s k%d" % (s, k)
    if 1536 <= t < 2048:
        return "A5(%d,%d)" % ((t - 1536) % 8, (t - 1536) // 8)
    sheet = "BCDE"[t // 256]
    tt = t % 256
    return "%s(%d,%d)" % (sheet, tt % 8 + (8 if tt >= 128 else 0), (tt % 128) // 8)

def describe(keys=None):
    out = []
    for key, *_ in PREFABS:
        if keys and key not in keys: continue
        pf = load(key)
        out.append("== %s  (%s, rect %s, %dx%d) - %s" % (key, pf["source"], pf["rect"], pf["w"], pf["h"], pf["name"]))
        for z in range(4):
            cnt = {}
            for row in pf["layers"][z]:
                for t in row:
                    n = tile_name(t)
                    if n: cnt[n] = cnt.get(n, 0) + 1
            if cnt: out.append("  layer %d: %s" % (z, ", ".join("%s x%d" % kv for kv in sorted(cnt.items(), key=lambda kv: -kv[1]))))
        sh = sum(1 for row in pf["layers"][4] for v in row if v)
        if sh: out.append("  shadows: %d cells" % sh)
        for ev in pf["events"]:
            pg = ev["pages"][0]; im = pg["image"]
            pic = im["characterName"] + "[%d d%d p%d]" % (im["characterIndex"], im["direction"], im["pattern"]) if im["characterName"] else tile_name(im["tileId"]) or "-"
            out.append("  event (%d,%d) %-24s %s prio %d%s%s" % (ev["x"], ev["y"], ev["name"][:24], pic, pg["priorityType"],
                       " through" if pg["through"] else "", " note " + ev["note"] if ev["note"] else ""))
        # the grid: which layer holds what, row by row (short codes)
        out.append("  rows (layer0 | layer2 | layer3):")
        for j in range(pf["h"]):
            cells = []
            for i in range(pf["w"]):
                l0, l2, l3 = (tile_name(pf["layers"][z][j][i]) or "." for z in (0, 2, 3))
                cells.append("%s|%s|%s" % (l0, l2, l3))
            out.append("   y%-2d " % j + "  ".join(cells))
    text = "\n".join(out)
    os.makedirs(PDIR, exist_ok=True)
    with open(os.path.join(PDIR, "_layers.txt"), "wb") as f: f.write(text.encode("utf-8"))
    return text

# ------------------------------------------------------------------------------------------------ the gallery
def gallery():
    S = winlu.sheets()
    font = ImageFont.truetype(os.path.join(ROOT, "fonts", "AlegreyaSans-Medium.ttf"), 20)
    fontb = ImageFont.truetype(os.path.join(ROOT, "fonts", "AlegreyaSC-Bold.ttf"), 22)
    renders = {}
    cards = []
    for key, mid, x0, y0, x1, y1, name, use in PREFABS:
        if mid not in renders: renders[mid] = Image.open(os.path.join(winlu.OUT, "Map%03d.png" % mid)).convert("RGB")
        ref = renders[mid].crop((x0 * T, y0 * T, (x1 + 1) * T, (y1 + 1) * T))
        pf = load(key)
        mine = R.render(prefab_map(pf), sheets=S).convert("RGB")
        ov = mine.copy().convert("RGBA")
        lay = Image.new("RGBA", ov.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
        for (x, y) in pf["closed_by_tiles"]: d.rectangle([x * T + 2, y * T + 2, x * T + T - 3, y * T + T - 3], fill=(230, 40, 40, 110), outline=(230, 40, 40, 220))
        for (x, y) in pf["closed_by_events"]: d.rectangle([x * T + 6, y * T + 6, x * T + T - 7, y * T + T - 7], fill=(255, 150, 30, 150))
        ov.alpha_composite(lay)
        cards.append((key, name, use, pf, ref, mine, ov.convert("RGB")))
    # layout: cards in two columns, each card = three pictures side by side at 1:1 scaled by SC
    SC = 0.5
    COLS = 2
    pad, head = 24, 56
    cw = max(int((c[4].width * 3 + 2 * 12) * SC) for c in cards) + pad
    rows = [cards[i:i + COLS] for i in range(0, len(cards), COLS)]
    rh = [max(int(c[4].height * SC) for c in r) + head + pad for r in rows]
    W = cw * COLS + pad
    H = 110 + sum(rh)
    out = Image.new("RGB", (W, H), (24, 22, 26))
    dr = ImageDraw.Draw(out)
    dr.text((pad, 16), "Prefabrykaty z map autora tilesetu (Winlu) - wzór | prefabrykat sam | co blokuje (czerwone: kafelki, pomarańczowe: zdarzenia)",
            font=fontb, fill=(250, 214, 64))
    dr.text((pad, 52), "Skala 1:2. Każdy prefabrykat to prostokąt mapy autora skopiowany kafelek po kafelku (4 warstwy, cienie, zdarzenia).",
            font=font, fill=(220, 215, 205))
    y = 110
    for r, h in zip(rows, rh):
        x = pad
        for key, name, use, pf, ref, mine, ov in r:
            dr.text((x, y), "%s  (%dx%d)" % (name, pf["w"], pf["h"]), font=fontb, fill=(250, 214, 64))
            dr.text((x, y + 26), "%s  |  u nas: %s  |  %s" % (key, use, pf["source"].split("/")[-1]), font=font, fill=(200, 196, 188))
            xx = x
            for im in (ref, mine, ov):
                sm = im.resize((int(im.width * SC), int(im.height * SC)), Image.LANCZOS)
                out.paste(sm, (xx, y + head))
                xx += sm.width + int(12 * SC) + 6
            x += cw
        y += h
    p = os.path.join(DOCS, "prefaby.png")
    out.save(p, optimize=True)
    return p

def main():
    what = [a for a in sys.argv[1:]] or ["extract", "describe", "gallery"]
    if "extract" in what:
        for spec in PREFABS:
            pf = extract_one(*spec); save(pf)
            print("prefab %-22s %2dx%-2d events %2d  needs %s" % (pf["key"], pf["w"], pf["h"], len(pf["events"]), ", ".join(pf["missing_in_img_characters"]) or "-"))
    if "describe" in what:
        describe(); print("wrote", os.path.join(PDIR, "_layers.txt"))
    if "gallery" in what:
        print("wrote", gallery())

if __name__ == "__main__":
    main()
