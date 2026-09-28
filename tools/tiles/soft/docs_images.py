"""Picture sheets for docs/kafelki from a built sheet and the in-game shots (shots.js).

  python tools/tiles/soft/docs_images.py blocks <sheet.png> <out.png> kNN=Title ...
        the new blocks next to Winlu's own (the same slot of the Winlu A2) at x2, over the grass
  python tools/tiles/soft/docs_images.py pairs <shotsDir> <out.png> name:x:y:w:h:Label ...
        before | after pairs at 1:1 (crops of <name>_before.png / <name>_after.png)
  python tools/tiles/soft/docs_images.py zoom <out.png> <shotsDir>/<name>:x:y:w:h:Label ... [--f 4]
        before | after crops enlarged (nearest neighbour)
"""
import os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import numpy as np
from PIL import Image

from groundlib import mz, preview as PV, paths as P

GRASS = None


def over_grass(block):
    """A 96x144 block drawn over Winlu grass k16 (what the player sees)."""
    global GRASS
    if GRASS is None:
        GRASS = Image.fromarray(np.tile(np.asarray(mz.block(16).crop((0, 48, 48, 96))), (3, 2, 1)))
    im = GRASS.copy().convert("RGBA")
    im.alpha_composite(block.convert("RGBA"))
    return im.convert("RGB")


def blocks(sheet_path, out, specs):
    sheet = Image.open(sheet_path).convert("RGBA")
    items = []
    for spec in specs:
        k, title = spec.split("=", 1)
        k = int(k.lstrip("k"))
        x, y = mz.kind_xy(k)
        win = mz.block(k)
        new = sheet.crop((x, y, x + 96, y + 144))
        is_overlay = mz.is_overlay_kind(k)
        f = over_grass if is_overlay else (lambda b: b.convert("RGB"))
        items.append(("Winlu k%d (było)" % k, PV.zoom(f(win), 2)))
        items.append(("%s k%d (nowe)" % (title, k), PV.zoom(f(new), 2)))
        body = mz.body_cell(np.asarray(new).astype(float))           # the inner cell MZ repeats
        img = Image.fromarray(np.round(np.tile(body, (3, 2, 1))).astype(np.uint8), "RGBA")
        items.append(("wnętrze x2 (ta sama komórka co 48 px)", PV.zoom(f(img), 2)))
    PV.labelled(items, cols=3, title="Miękkie kafelki: Winlu (lewo) i nowe (środek), x2, nakładki na trawie Winlu k16").save(out)
    print("saved", out)


def pairs(shots, out, specs, title=None):
    items = []
    for spec in specs:
        name, x, y, w, h, label = spec.split(":", 5)
        x, y, w, h = int(x), int(y), int(w), int(h)
        a = Image.open(os.path.join(shots, name + "_before.png")).convert("RGB").crop((x, y, x + w, y + h))
        b = Image.open(os.path.join(shots, name + "_after.png")).convert("RGB").crop((x, y, x + w, y + h))
        items.append(("%s - przed (Winlu)" % label, a))
        items.append(("%s - po" % label, b))
    PV.labelled(items, cols=2, title=title).save(out)
    print("saved", out)


def zoom(out, specs, f=4, title=None):
    items = []
    for spec in specs:
        path, x, y, w, h, label = spec.rsplit(":", 5)        # (the path may hold a drive letter)
        x, y, w, h = int(x), int(y), int(w), int(h)
        a = Image.open(path + "_before.png").convert("RGB").crop((x, y, x + w, y + h))
        b = Image.open(path + "_after.png").convert("RGB").crop((x, y, x + w, y + h))
        items.append(("%s - przed x%d" % (label, f), PV.zoom(a, f)))
        items.append(("%s - po x%d" % (label, f), PV.zoom(b, f)))
    PV.labelled(items, cols=2, title=title).save(out)
    print("saved", out)


if __name__ == "__main__":
    cmd, args = sys.argv[1], sys.argv[2:]
    title = None
    if "--title" in args:
        i = args.index("--title")
        title = args[i + 1]
        args = args[:i] + args[i + 2:]
    if cmd == "blocks":
        blocks(args[0], args[1], args[2:])
    elif cmd == "pairs":
        pairs(args[0], args[1], args[2:], title)
    elif cmd == "zoom":
        f = 4
        if "--f" in args:
            i = args.index("--f")
            f = int(args[i + 1])
            args = args[:i] + args[i + 2:]
        zoom(args[0], args[1:], f, title)
