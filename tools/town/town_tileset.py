# python town_tileset.py  -> tools/town/staging/Tilesets_town.json (NOT data/: installed only with the editor closed, when
# the user has chosen)
# The proposed tileset of the town (Map008): the tileset author's own "Fantasy Exterior green" (his sample maps' tileset 1,
# tools/town/winlu_samples/Tilesets.json) put into OUR empty slot 11, with his full passage flags (8192), the sheet names
# pointing at our copies of the pack:
#   A1 Fantasy_Outside_A1_green  A2 Fantasy_Outside_A2_green  A3 Fantasy_Outside_A3  A4 Fantasy_Outside_A4_green
#   A5 Fantasy_Outside_A5_green  B Fantasy_Outside_B_green    C Fantasy_Outside_C    D Fantasy_Outside_D_green  E Fantasy_Roofs
# Why a new slot and not tileset 9: tileset 9 uses A2_2_green, whose kinds 20, 28, 29, 31, 39, 46, 47 look different from
# A2_green - and our maps use them (Map003, the meadows, the roads, Map020, Map024: kinds 28, 39, 46, 20...). Changing
# tileset 9's A2 would change how those maps look; a separate tileset changes only the map that uses it (Map008).
# With the author's flags his roofs (A3), walls (A3 / A4 wall sides), fortress pieces and props (B-E) close the way by
# themselves, tops are star tiles; blockers stay only where he used them too (empty events on prop footprints).
import os, sys, json, copy
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import winlu

ROOT = winlu.ROOT
SLOT = 11
NAME = "Wilu Fantasy Town (Exterior)"
OUT = os.path.join(HERE, "staging", "Tilesets_town.json")

def rel(name):
    """an author's sheet name -> our tilesetNames entry (a path under img/tilesets/, without .png)"""
    p = winlu.sheet_path(name)
    return os.path.relpath(p, ROOT + "img/tilesets").replace("\\", "/")[:-4]

def build():
    with open(os.path.join(ROOT, "data", "Tilesets.json"), "rb") as f:
        ours = json.loads(f.read().decode("utf-8"))
    slot = ours[SLOT]
    assert slot and not any(slot["tilesetNames"]) and not slot["name"], "slot %d is not empty any more" % SLOT
    author = winlu.R.load_json(os.path.join(winlu.SAMPLES, "Tilesets.json"))[1]
    t = copy.deepcopy(slot)
    t.update({"name": NAME, "mode": author["mode"], "flags": list(author["flags"]), "note": author.get("note", ""),
              "tilesetNames": [rel(n) if n else "" for n in author["tilesetNames"]]})
    for n in t["tilesetNames"]:
        assert not n or os.path.exists(ROOT + "img/tilesets/" + n + ".png"), n
    out = copy.deepcopy(ours)
    out[SLOT] = t
    lines = ["["] + [json.dumps(x, ensure_ascii=False, separators=(",", ":")) + ("," if i < len(out) - 1 else "") for i, x in enumerate(out)] + ["]"]
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "wb") as f:
        f.write("\n".join(lines).encode("utf-8"))
    changed = [i for i in range(len(ours)) if ours[i] != out[i]]
    return OUT, t, changed

if __name__ == "__main__":
    out, t, changed = build()
    print("wrote", out, "- changed slots:", changed)
    for i, n in enumerate(t["tilesetNames"]): print("  ", "A1 A2 A3 A4 A5 B C D E".split()[i], n)
