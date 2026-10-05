# Render the tileset author's interior sample maps (tools/town/winlu_samples, the free "Winlu Master Sample_maps" demo -
# reference only) with our copies of the Winlu Fantasy Interior Remaster sheets, and the current Map001.
#   python tools/tavern/v2/samples.py   -> tools/tavern/v2/out/sample_Map004.png, current_Map001.png
import os, sys, json, copy
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "town"))
import mzrender as R
ROOT = R.ROOT
PACK = ROOT + "img/tilesets/Winlu Fantasy Tileset - Interior/Remaster/"
SAMPLES = os.path.join(HERE, "..", "..", "town", "winlu_samples")
OUT = os.path.join(HERE, "out")
R_CHARS = PACK + "characters/"

# characters of the interior pack too
_orig_char = R.Sheets.char
def _char(self, name):
    if name not in self.chars:
        p = R_CHARS + name + ".png"
        if os.path.exists(p) and not os.path.exists(ROOT + "img/characters/" + name + ".png"):
            from PIL import Image
            self.chars[name] = Image.open(p).convert("RGBA")
    return _orig_char(self, name)
R.Sheets.char = _char

def author_ts(tid=2):
    ts = R.load_json(os.path.join(SAMPLES, "Tilesets.json"))
    t = copy.deepcopy(ts[tid])
    t["tilesetNames"] = [(PACK + "tilesets/" + n + ".png") if n else "" for n in t["tilesetNames"]]
    p = os.path.join(OUT, "Tilesets_author.json")
    out = [None] * (tid + 1); out[tid] = t
    with open(p, "wb") as f: f.write(json.dumps(out).encode("utf-8"))
    return p

def sample_sheets():
    s = R.Sheets(2, author_ts(2)); s.lenient = True
    return s

def game_sheets():
    s = R.Sheets(8); s.lenient = True
    return s

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for mid in (3, 4):
        mp = R.load_json(os.path.join(SAMPLES, "Map%03d.json" % mid))
        S = sample_sheets()
        im = R.render(mp, sheets=S).convert("RGB")
        im.save(os.path.join(OUT, "sample_Map%03d.png" % mid))
        print(mid, mp["width"], mp["height"], getattr(S, "missing", None))
    mp = R.load_json(ROOT + "data/Map001.json")
    S = game_sheets()
    im = R.render(mp, sheets=S).convert("RGB")
    im.save(os.path.join(OUT, "current_Map001.png"))
    im.resize((im.width // 4, im.height // 4)).save(os.path.join(OUT, "current_Map001_small.png"))
    print("current", getattr(S, "missing", None))
