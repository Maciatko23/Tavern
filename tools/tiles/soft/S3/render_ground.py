"""Quick ground-only render of a map window (A2 floor autotiles of layers 0 and 1, MZ's own
FLOOR_AUTOTILE_TABLE), for fast before/after checks without the browser.
Other tiles (water, walls, B-E objects, shadows) are skipped - the in-game shots show those.
  python render_ground.py <A2 sheet.png> <mapId> <dx> <dy> <w> <h> <out.png> [--zoom 1]
"""
import json, os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
sys.path.insert(0, os.path.join(HERE, "..", ".."))
import wang_to_a2_a as W

TABLE = W.mz_table()
Q = 24


def render(sheet_path, map_id, dx, dy, w, h):
    sheet = Image.open(sheet_path).convert("RGBA")
    m = json.load(open(os.path.join(ROOT, "data", "Map%03d.json" % map_id), encoding="utf8"))
    MW, MH, d = m["width"], m["height"], m["data"]
    out = Image.new("RGBA", (w * 48, h * 48), (0, 0, 0, 255))
    cache = {}
    for z in (0, 1):
        for y in range(h):
            for x in range(w):
                mx, my = dx + x, dy + y
                if not (0 <= mx < MW and 0 <= my < MH):
                    continue
                t = d[(z * MH + my) * MW + mx]
                if not (2816 <= t < 4352):          # A2 only (kinds 16-47)
                    continue
                kind, shape = (t - 2048) // 48, (t - 2048) % 48
                key = (kind, shape)
                if key not in cache:
                    c, r = (kind - 16) % 8, (kind - 16) // 8
                    bx, by = c * 96, r * 144
                    cell = Image.new("RGBA", (48, 48))
                    for i in range(4):
                        qsx, qsy = TABLE[shape][i]
                        q = sheet.crop((bx + qsx * Q, by + qsy * Q, bx + qsx * Q + Q, by + qsy * Q + Q))
                        cell.alpha_composite(q, ((i % 2) * Q, (i // 2) * Q))
                    cache[key] = cell
                out.alpha_composite(cache[key], (x * 48, y * 48))
    return out


if __name__ == "__main__":
    a = sys.argv[1:]
    zoom = 1
    if "--zoom" in a:
        i = a.index("--zoom"); zoom = int(a[i + 1]); a = a[:i] + a[i + 2:]
    sheet, mid, dx, dy, w, h, out = a[0], int(a[1]), int(a[2]), int(a[3]), int(a[4]), int(a[5]), a[6]
    im = render(sheet, mid, dx, dy, w, h)
    if zoom != 1:
        im = im.resize((im.width * zoom, im.height * zoom), Image.NEAREST)
    im.save(out)
