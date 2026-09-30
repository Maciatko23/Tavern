# python render_miasteczko.py [--game]  -> docs/miasteczko/miasteczko_C.png, miasteczko_C_czysta.png, miasteczko_C_blokady.png
# The pictures of the town of prefabs (build_miasteczko.py, tileset 11), drawn in Python by mzrender.py (byte-identical on a
# rerun), and the harness overlay tools/town/staging/overlay_C2/ (data/Map008.json, data/Tilesets.json = the staged tileset
# with slot 11, the character sheets img/characters lacks). --game: the 4 daytime game screens (shot_town.js, CDP 9412) ->
# miasteczko_C_gra_1..4.png.
import os, sys, shutil, subprocess
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import mzrender as R
import render_town as RT
import check_miasteczko as CHK
from townlib import STAGING, DOCS, ROOT

T = 48

def blocked(A):
    """what closes the way: red = the tileset's own flags (the author's), orange = events (pictures and invisible blockers),
    green dots = reachable on foot from the south gate; problems (none) in magenta / cyan"""
    base = R.render(A["map"], tilesets=CHK.TS)
    W, H = base.size
    eng, reach = A["eng"], A["reach"]
    dim = Image.blend(base.convert("RGB"), Image.new("RGB", base.size, (0, 0, 0)), 0.35).convert("RGBA")
    ov = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    for (x, y) in sorted(A["flagged"]):
        d.rectangle([x * T + 1, y * T + 1, x * T + T - 2, y * T + T - 2], fill=(230, 40, 40, 115))
    for (x, y) in sorted(eng.block):
        if 0 <= x < A["W"] and 0 <= y < A["H"] and (x, y) not in A["flagged"]:
            d.rectangle([x * T + 5, y * T + 5, x * T + T - 6, y * T + T - 6], fill=(255, 150, 30, 150))
    for (x, y) in sorted(A["solid"] & reach):
        d.rectangle([x * T + 1, y * T + 1, x * T + T - 2, y * T + T - 2], fill=(255, 0, 255, 200))
    for (x, y) in sorted(reach):
        d.ellipse([x * T + 20, y * T + 20, x * T + 28, y * T + 28], fill=(120, 255, 120, 220))
    dim.alpha_composite(ov)
    top = 100
    out = Image.new("RGB", (W, H + top), (24, 22, 26))
    out.paste(dim.convert("RGB"), (0, top))
    dd = ImageDraw.Draw(out)
    dd.text((16, 10), "%s - co zamyka drogę" % A["meta"]["title"], font=RT.font(30, True), fill=RT.GOLD)
    items = [((230, 40, 40), "kafelek zamknięty flagami tilesetu (%d pól)" % len(A["flagged"])),
             ((255, 150, 30), "zdarzenie: obraz albo niewidoczna blokada pod murem / dachem (%d pól)" % len(eng.block - A["flagged"])),
             ((120, 255, 120), "osiągalne pieszo od bramy miejskiej (%d pól)" % len(reach)),
             ((255, 0, 255), "BŁĄD: widać mur, a da się wejść (%d)" % len(A["solid"] & reach))]
    x = 16
    for col, t in items:
        dd.rectangle([x, 58, x + 22, 80], fill=col, outline=RT.INK)
        dd.text((x + 30, 56), t, font=RT.font(19), fill=RT.WHITE)
        x += 34 + int(dd.textlength(t, font=RT.font(19))) + 26
    return base, out

def overlay():
    """the harness overlay of the staged town"""
    od = os.path.join(STAGING, "overlay_C2")
    os.makedirs(os.path.join(od, "data"), exist_ok=True)
    os.makedirs(os.path.join(od, "img", "characters"), exist_ok=True)
    shutil.copyfile(os.path.join(STAGING, "Map008_C2.json"), os.path.join(od, "data", "Map008.json"))
    shutil.copyfile(CHK.TS, os.path.join(od, "data", "Tilesets.json"))
    mp = R.load_json(os.path.join(STAGING, "Map008_C2.json"))
    need = sorted({pg["image"]["characterName"] for e in mp["events"] if e for pg in e["pages"] if pg["image"]["characterName"]})
    copied = []
    for n in need:
        if os.path.exists(ROOT + "img/characters/" + n + ".png"): continue
        for d in (R.STAGED_CHARS + "/", R.WINLU_EXT_CHARS, R.WINLU_GREEN_CHARS):
            if os.path.exists(d + n + ".png"):
                shutil.copyfile(d + n + ".png", os.path.join(od, "img", "characters", n + ".png")); copied.append(n); break
        else:
            raise FileNotFoundError(n)
    return od, copied

def main():
    probs, A = CHK.check()
    if probs:
        sys.exit("check_miasteczko.py: %d problems - no pictures" % len(probs))
    base, bl = blocked(A)
    os.makedirs(DOCS, exist_ok=True)
    outs = {"miasteczko_C_czysta.png": base.convert("RGB"), "miasteczko_C.png": RT.labelled("C2", base, A), "miasteczko_C_blokady.png": bl}
    for n, im in outs.items():
        p = os.path.join(DOCS, n); im.save(p, optimize=True); print("wrote", p)
    od, copied = overlay()
    print("overlay", od, "+", ", ".join(copied))
    if "--game" in sys.argv:
        env = dict(os.environ, CDP_PORT=os.environ.get("CDP_PORT", "9412"))
        subprocess.run(["node", os.path.join(HERE, "shot_town.js"), "C2", DOCS], cwd=ROOT, env=env)
        for i in range(1, 5):
            src = os.path.join(DOCS, "koncepcja_C2_gra_%d.png" % i)
            if os.path.exists(src): os.replace(src, os.path.join(DOCS, "miasteczko_C_gra_%d.png" % i))

if __name__ == "__main__":
    main()
