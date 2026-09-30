# python street_test.py  -> tools/town/staging/Map008_ulica.json + docs/miasteczko/proba_ulicy.png
# A proof of the prefab route: one street of the town put together only from prefabs (prefabs.stamp) on the proposed town
# tileset 11 (town_tileset.py), fronts in one line along a cobbled street with a kerb, the buildings touching like in the
# author's town. The picture shows the street and, below it, what closes the way (the tileset's own flags + events) and the
# cells reachable on foot from the street - every door's front must be reachable.
import os, sys
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "..", "newstart"))
sys.path.insert(0, os.path.join(HERE, "..", "tavern"))
from nslib import NewMap, write_map
import mzrender as R
import prefabs as P
import town_tileset
from engine import Engine

ROOT = R.ROOT
ROW = ["kamienice_szachulec", "karczma_szachulcowa", "dom_lukarny_czarny", "sklep_waga", "kuznia_otwarta", "dom_lukarny_mikstury"]
STREET_Y = 11          # the first row of the street; every building's bottom row stands on STREET_Y - 1

def build():
    ts_path, _, _ = town_tileset.build()
    widths = [P.load(k)["w"] for k in ROW]
    W, H = sum(widths) + 2, 16
    mp = NewMap(8, W, H, town_tileset.SLOT, "Próba ulicy", "<Clouds:on>\n<Farm:off>", 11)
    mp.kind(0, mp.all, 16)                                            # grass
    street = mp.rect(0, STREET_Y, W - 1, STREET_Y + 2)
    mp.kind(0, street, 40)                                            # cobbles
    mp.kind(0, mp.rect(0, STREET_Y + 3, W - 1, STREET_Y + 3), 43)     # the kerb: light stones along the street's edge
    x = 1
    doors = []
    for k in ROW:
        pf = P.load(k)
        y = STREET_Y - pf["h"]
        mp.kind(0, mp.rect(x, 0, x + pf["w"] - 1, STREET_Y - 1), 40)  # the building's own ground: cobbles like the author's
        P.stamp(mp, k, x, y, ground=True)
        for ev in pf["events"]:
            im = ev["pages"][0]["image"]["characterName"]
            if im.startswith("!Fantasy_door") or im.startswith("!$Gate") or im == "!$Smith":
                doors.append((k, x + ev["x"], y + ev["y"]))
        x += pf["w"]
    data, events = mp.resolve(), mp.build_events()
    path = os.path.join(HERE, "staging", "Map008_ulica.json")
    props = dict(mp.props); props["tilesetId"] = town_tileset.SLOT
    write_map(path, props, data, events)
    return path, ts_path, doors

def main():
    path, ts_path, doors = build()
    mp = R.load_json(path)
    im = R.render(mp, tilesets=ts_path).convert("RGB")
    flags = R.load_json(ts_path)[town_tileset.SLOT]["flags"]
    W, H = mp["width"], mp["height"]
    eng = Engine(W, H, mp["data"], flags, mp["events"])
    reach = eng.reach([(0, STREET_Y + 1)])
    probs = [(k, x, y) for (k, x, y) in doors if (x, y + 1) not in reach]
    ov = im.copy().convert("RGBA")
    lay = Image.new("RGBA", ov.size, (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    for y in range(H):
        for x in range(W):
            if not eng.tile_open(x, y): d.rectangle([x * 48 + 2, y * 48 + 2, x * 48 + 45, y * 48 + 45], fill=(230, 40, 40, 110))
            elif (x, y) in eng.block: d.rectangle([x * 48 + 6, y * 48 + 6, x * 48 + 41, y * 48 + 41], fill=(255, 150, 30, 150))
            elif (x, y) in reach: d.ellipse([x * 48 + 20, y * 48 + 20, x * 48 + 28, y * 48 + 28], fill=(120, 255, 120, 220))
    ov.alpha_composite(lay)
    f = ImageFont.truetype(os.path.join(ROOT, "fonts", "AlegreyaSC-Bold.ttf"), 26)
    out = Image.new("RGB", (im.width, im.height * 2 + 120), (24, 22, 26))
    out.paste(im, (0, 50)); out.paste(ov.convert("RGB"), (0, im.height + 110))
    dr = ImageDraw.Draw(out)
    dr.text((12, 10), "Próba: ulica złożona tylko z prefabrykatów autora (tileset 11), fronty w jednej linii", font=f, fill=(250, 214, 64))
    dr.text((12, im.height + 66), "Co blokuje: czerwone = flagi kafelków autora, pomarańczowe = zdarzenia; zielone = dojście od ulicy. Drzwi osiągalne: %d/%d"
            % (len(doors) - len(probs), len(doors)), font=f, fill=(250, 214, 64))
    p = os.path.join(ROOT, "docs", "miasteczko", "proba_ulicy.png")
    out.save(p, optimize=True)
    print("wrote", p, "doors", doors, "unreachable", probs)

if __name__ == "__main__":
    main()
