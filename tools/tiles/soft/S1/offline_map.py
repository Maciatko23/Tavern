"""Render the A2 layers (0 and 1) of a real map region with a given A2 sheet, the way MZ does
(shape = tile id % 48 through FLOOR_AUTOTILE_TABLE) - quick before/after without the game.
usage: python offline_map.py <map id> x0 y0 w h out.png [sheet.png]"""
import sys, json
from PIL import Image
from common import *
sys.path.insert(0, ROOT + "/tools/tiles")
import wang_to_a2_a as W

def render(map_id, x0, y0, w, h, sheet):
    m = json.load(open(ROOT + "/data/Map%03d.json" % map_id, encoding="utf8"))
    Wd, H, d = m["width"], m["height"], m["data"]
    table = W.mz_table()
    out = Image.new("RGBA", (w * 48, h * 48), (0, 0, 0, 255))
    for z in (0, 1):
        for y in range(y0, y0 + h):
            for x in range(x0, x0 + w):
                t = d[(z * H + y) * Wd + x]
                if not (2816 <= t < 4352):
                    continue
                kind, shape = (t - 2048) // 48, (t - 2048) % 48
                bx, by = block_xy(kind)
                for i in range(4):
                    qx, qy = table[shape][i]
                    q = sheet.crop((bx + qx * 24, by + qy * 24, bx + qx * 24 + 24, by + qy * 24 + 24))
                    out.alpha_composite(q, ((x - x0) * 48 + (i % 2) * 24, (y - y0) * 48 + (i // 2) * 24))
    return out

if __name__ == "__main__":
    a = sys.argv[1:]
    sheet = Image.open(a[6]).convert("RGBA") if len(a) > 6 else a2()
    render(int(a[0]), *map(int, a[1:5]), sheet).save(a[5])
