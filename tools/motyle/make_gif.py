# -*- coding: utf-8 -*-
"""GIF-y motyli z klatek tools/motyle/capture.js (wycinki ekranu, powiększone pikselowo) do docs/motyle/.
  python tools/motyle/make_gif.py <katalog z klatkami>
"""
import glob, os, sys
from PIL import Image

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "docs", "motyle")
os.makedirs(OUT, exist_ok=True)


def frames(prefix):
    return [Image.open(f).convert("RGB") for f in sorted(glob.glob(os.path.join(SRC, prefix + "_[0-9][0-9].png")))]


def gif(prefix, name, scale, ms, colors=64):
    fr = frames(prefix)
    if not fr:
        print("brak klatek", prefix)
        return
    w, h = fr[0].size
    out = [f.resize((w * scale, h * scale), Image.NEAREST).convert("P", palette=Image.ADAPTIVE, colors=colors) for f in fr]
    path = os.path.join(OUT, name)
    out[0].save(path, save_all=True, append_images=out[1:], duration=ms, loop=0, optimize=True)
    print("gif", path, len(out), "klatek", os.path.getsize(path) // 1024, "KB")


def still(prefix, name, scale):
    fs = sorted(glob.glob(os.path.join(SRC, prefix + "_[0-9][0-9].png")))
    if not fs:
        return
    im = Image.open(fs[-1]).convert("RGB")
    im.resize((im.width * scale, im.height * scale), Image.NEAREST).save(os.path.join(OUT, name))
    print("png", name)


gif("laka", "motyle_laka.gif", 1, 50)
gif("ramie", "motyl_na_ramieniu.gif", 2, 50)
still("ramie_stop", "motyl_na_ramieniu.png", 3)
gif("cmy", "cmy_przy_ognisku.gif", 2, 34)
gif("ela", "ela_pawik.gif", 1, 50)
gif("swieca", "cmy_przy_swiecy.gif", 3, 34)
