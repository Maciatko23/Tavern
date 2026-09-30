# The tileset author's own sample maps (tools/town/winlu_samples/: the free "Winlu Master Sample_maps" demo - reference only,
# never game data) and his tileset 1 "Fantasy Exterior green", with the sheets resolved to our copies of the pack:
#   python winlu.py render   -> docs/miasteczko/winlu_probki/MapXXX.png (every exterior sample map at 1:1, by mzrender.py)
#   python winlu.py info     -> which tiles / sheets / character images each sample map uses
# The author's tileset 1 = A1 Fantasy_Outside_A1_green, A2 Fantasy_Outside_A2_green, A3 Fantasy_Outside_A3,
# A4 Fantasy_Outside_A4_green, A5 Fantasy_Outside_A5_green, B Fantasy_Outside_B_green, C Fantasy_Outside_C,
# D Fantasy_Outside_D_green, E Fantasy_Roofs, with his full 8192 passage flags.
import os, sys, json, copy
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import mzrender as R

ROOT = R.ROOT
SAMPLES = os.path.join(HERE, "winlu_samples")
PACK = ROOT + "img/tilesets/Winlu Fantasy Tileset - Exterior/"
GREEN = PACK + "Fantasy_Tileset_Green_Edition_upgrade/tilesets/"
BASE = PACK + "Winlu Fantasy Exterior/tilesets/"
OUT = os.path.join(ROOT, "docs", "miasteczko", "winlu_probki")
STAGED_TS = os.path.join(HERE, "staging", "Tilesets_winlu.json")

def sheet_path(name):
    """one of the author's sheet names -> our file (the green edition folder, else the base folder)"""
    for d in (GREEN, BASE):
        p = d + name + ".png"
        if os.path.exists(p): return p
    raise FileNotFoundError(name)

def author_tilesets():
    """the author's Tilesets.json with tileset 1's sheet names resolved to absolute paths of our copies (for mzrender)"""
    ts = R.load_json(os.path.join(SAMPLES, "Tilesets.json"))
    t1 = copy.deepcopy(ts[1])
    t1["tilesetNames"] = [sheet_path(n) if n else "" for n in t1["tilesetNames"]]
    out = [None, t1]
    os.makedirs(os.path.dirname(STAGED_TS), exist_ok=True)
    with open(STAGED_TS, "wb") as f:
        f.write(json.dumps(out, ensure_ascii=False).encode("utf-8"))
    return STAGED_TS

def exterior_maps():
    infos = R.load_json(os.path.join(SAMPLES, "MapInfos.json"))
    out = []
    for i in infos:
        if not i: continue
        mp = R.load_json(os.path.join(SAMPLES, "Map%03d.json" % i["id"]))
        if mp["tilesetId"] == 1: out.append((i["id"], i["name"], mp))
    return out

def sheets():
    s = R.Sheets(1, author_tilesets())
    s.lenient = True
    return s

def render_all():
    os.makedirs(OUT, exist_ok=True)
    S = sheets()
    done = []
    for mid, name, mp in exterior_maps():
        im = R.render(mp, sheets=S).convert("RGB")
        p = os.path.join(OUT, "Map%03d.png" % mid)
        im.save(p, optimize=True)
        done.append((mid, name, mp["width"], mp["height"], p))
    return done, sorted(getattr(S, "missing", set()))

def info():
    for mid, name, mp in exterior_maps():
        chars = sorted({pg["image"]["characterName"] for e in mp["events"] if e for pg in e["pages"] if pg["image"]["characterName"]})
        miss = [c for c in chars if not any(os.path.exists(d + c + ".png") for d in (ROOT + "img/characters/", R.WINLU_EXT_CHARS, R.WINLU_GREEN_CHARS))]
        need = [c for c in chars if not os.path.exists(ROOT + "img/characters/" + c + ".png")]
        print("Map%03d %-10s %dx%d events %d" % (mid, name, mp["width"], mp["height"], len([e for e in mp["events"] if e])))
        print("   characters:", ", ".join(chars))
        print("   not in img/characters:", ", ".join(need) or "-", "| not in the pack either:", ", ".join(miss) or "-")

if __name__ == "__main__":
    if "info" in sys.argv: info()
    else:
        done, missing = render_all()
        for d in done: print("Map%03d %s %dx%d -> %s" % d)
        print("character sheets not found:", missing)
