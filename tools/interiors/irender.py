# Pictures of interior maps on tileset 8 "Wilu Fantasy Interior" (Winlu Fantasy Interior Remaster) - the same drawing as
# tools/town/mzrender.py (autotiles, layers, star tiles, events bottom-centred, z order like the game), plus:
#   - the Winlu Interior Remaster character sheets as a fallback for pictures not yet copied to img/characters,
#   - the author's sample maps (tools/town/winlu_samples, his tileset 2 "Fantasy Interior" = our Remaster sheets with
#     E = Fantasy_Inside_E_Cathedral) for side-by-side study,
#   - a grid / labels overlay for the docs.
# Nothing here writes data/.
import os, sys, json
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, os.path.join(ROOT, "tools", "town"))
import mzrender as R  # noqa: E402

REM = ROOT + "img/tilesets/Winlu Fantasy Tileset - Interior/Remaster/"
REM_CHARS = REM + "characters/"
SAMPLES = ROOT + "tools/town/winlu_samples/"

class Sheets(R.Sheets):
    def __init__(self, tileset_id, tilesets=None, names=None, flags=None):
        if names is None:
            R.Sheets.__init__(self, tileset_id, tilesets)
        else:
            self.flags = flags or [0] * 8192
            self.sets = [Image.open(n).convert("RGBA") if n else None for n in names]
            self.chars, self.tiles = {}, {}
        self.lenient = True
    def char(self, name):
        if name not in self.chars:
            for d in (ROOT + "img/characters/", REM_CHARS, os.path.join(HERE, "chars") + "/"):
                p = d + name + ".png"
                if os.path.exists(p):
                    self.chars[name] = Image.open(p).convert("RGBA")
                    break
            else:
                self.missing = getattr(self, "missing", set()) | {name}
                self.chars[name] = None
        return self.chars[name]

def sample_sheets(tileset_id=2):
    ts = R.load_json(SAMPLES + "Tilesets.json")[tileset_id]
    names = []
    for n in ts["tilesetNames"]:
        if not n: names.append(None); continue
        p = REM + "tilesets/" + n + ".png"
        names.append(p if os.path.exists(p) else None)
    return Sheets(tileset_id, names=names, flags=ts["flags"])

def render(mp, sheets=None, hide=None):
    S = sheets or Sheets(mp["tilesetId"])
    return R.render(mp, S, hide)

def grid(img, x0=0, y0=0, every=1, color=(255, 255, 0), lines=True):
    img = img.convert("RGB")
    d = ImageDraw.Draw(img)
    W, H = img.width // 48, img.height // 48
    for y in range(H):
        for x in range(W):
            if lines: d.rectangle((x * 48, y * 48, x * 48 + 47, y * 48 + 47), outline=(70, 70, 70))
            if (x % every == 0 and y % every == 0):
                d.text((x * 48 + 2, y * 48 + 2), "%d,%d" % (x + x0, y + y0), fill=color)
    return img

if __name__ == "__main__":
    # python irender.py sample 3 out.png [grid]   |   python irender.py map data/Map019.json out.png [grid]
    what, src, out = sys.argv[1], sys.argv[2], sys.argv[3]
    if what == "sample":
        mp = R.load_json(SAMPLES + "Map%03d.json" % int(src))
        img = render(mp, sample_sheets(mp["tilesetId"]))
    else:
        mp = R.load_json(src)
        img = render(mp)
    if "grid" in sys.argv[4:]: img = grid(img)
    img.save(out)
