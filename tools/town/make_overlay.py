# python make_overlay.py [A] [B] [C]  -> tools/town/staging/overlay_<X>/ (data/Map008.json, data/Tilesets.json, img/characters/*)
# A folder for the game harness's GAME_OVERLAY (tests/cdp.js serves its data/*.json and img/characters/*.png instead of the
# game's own), so a staged concept can be walked and photographed in the real game without touching data/ or img/.
# The character sheets the concept uses that img/characters lacks are copied in from the Winlu pack / the staging (the
# same list is what the install would copy: INSTALL_CHARS).
import os, sys, json, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from townlib import STAGING, ROOT, TILESETS, load_json
from mzrender import STAGED_CHARS, WINLU_EXT_CHARS, WINLU_GREEN_CHARS

def used_sheets(mp):
    names = set()
    for e in mp["events"]:
        if not e: continue
        for pg in e["pages"]:
            if pg["image"]["characterName"]: names.add(pg["image"]["characterName"])
    return sorted(names)

def missing_sheets(mp):
    """(name, source path) of every sheet the map uses that img/characters does not have"""
    out = []
    for n in used_sheets(mp):
        if os.path.exists(os.path.join(ROOT, "img", "characters", n + ".png")): continue
        for d in (STAGED_CHARS + "/", WINLU_EXT_CHARS, WINLU_GREEN_CHARS):
            p = d + n + ".png"
            if os.path.exists(p):
                out.append((n, p)); break
        else:
            raise FileNotFoundError(n)
    return out

def build(concept):
    src = os.path.join(STAGING, "Map008_%s.json" % concept)
    mp = load_json(src)
    od = os.path.join(STAGING, "overlay_%s" % concept)
    os.makedirs(os.path.join(od, "data"), exist_ok=True)
    os.makedirs(os.path.join(od, "img", "characters"), exist_ok=True)
    shutil.copyfile(src, os.path.join(od, "data", "Map008.json"))
    shutil.copyfile(TILESETS, os.path.join(od, "data", "Tilesets.json"))
    miss = missing_sheets(mp)
    for n, p in miss:
        shutil.copyfile(p, os.path.join(od, "img", "characters", n + ".png"))
    return od, [n for n, _ in miss]

if __name__ == "__main__":
    for c in [a for a in sys.argv[1:] if len(a) == 1] or ["A", "B", "C"]:
        od, miss = build(c)
        print("overlay", od, "+", ", ".join(miss))
