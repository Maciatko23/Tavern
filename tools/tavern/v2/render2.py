# Pictures of a staged ground floor without the game (tools/town/mzrender.py: tiles, events like Sprite_Character):
#   python render2.py [map.json] [out.png] [x0 y0 x1 y1]   -> the whole map (or a part) at 1:1
# Character sheets are looked up in img/characters, then in the Winlu Interior Remaster pack, then staged sheets.
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "town"))
import mzrender as R
from PIL import Image
ROOT = R.ROOT
PACK_CHARS = ROOT + "img/tilesets/Winlu Fantasy Tileset - Interior/Remaster/characters/"
STAGED_CHARS = os.path.join(HERE, "staging", "characters") + "/"

_orig = R.Sheets.char
def _char(self, name):
    if name not in self.chars:
        for d in (STAGED_CHARS, ROOT + "img/characters/", PACK_CHARS):
            p = d + name + ".png"
            if os.path.exists(p):
                self.chars[name] = Image.open(p).convert("RGBA")
                break
    return _orig(self, name)
R.Sheets.char = _char

_S = None
def sheets():
    global _S
    if _S is None:
        _S = R.Sheets(8); _S.lenient = True
    return _S

def render(mp, box=None, scale=1.0, hide=None):
    im = R.render(mp, sheets=sheets(), hide=hide).convert("RGB")
    if box:
        x0, y0, x1, y1 = box
        im = im.crop((x0 * 48, y0 * 48, (x1 + 1) * 48, (y1 + 1) * 48))
    if scale != 1.0:
        im = im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)
    return im

if __name__ == "__main__":
    a = sys.argv[1:]
    src = a[0] if a else os.path.join(HERE, "staging", "Map001.json")
    out = a[1] if len(a) > 1 else os.path.join(HERE, "out", "v2_full.png")
    box = tuple(map(int, a[2:6])) if len(a) >= 6 else None
    mp = R.load_json(src)
    render(mp, box).save(out)
    print(out)
