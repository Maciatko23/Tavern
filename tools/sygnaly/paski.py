# -*- coding: utf-8 -*-
"""tests/sygnaly_zdjecia.js frames -> strips (png) and GIFs in docs/zadania_nowe/sygnaly_gra/ (animacja_*.png / .gif); python tools/sygnaly/paski.py"""
import os, glob
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
GRA = os.path.join(ROOT, "docs", "zadania_nowe", "sygnaly_gra")
CROP = {"anim_skrzydla": (440, 70, 840, 340), "anim_latarnia": (600, 20, 1240, 380), "anim_lodz": (0, 280, 640, 560)}
NAME = {"anim_skrzydla": "animacja_skrzydla_B_do_D", "anim_latarnia": "animacja_latarnia_KDK", "anim_lodz": "animacja_lodz_dobija"}


def main():
    for d, box in CROP.items():
        files = sorted(glob.glob(os.path.join(GRA, d, "f*.png")))
        if not files:
            print("brak klatek:", d); continue
        ims = [Image.open(f).convert("RGB").crop(box) for f in files]
        w, h = ims[0].size
        cols = min(len(ims), 6)
        rows = (len(ims) + cols - 1) // cols
        strip = Image.new("RGB", (cols * w, rows * h), (20, 20, 24))
        for i, im in enumerate(ims):
            strip.paste(im, ((i % cols) * w, (i // cols) * h))
        strip.save(os.path.join(GRA, NAME[d] + ".png"))
        ims[0].save(os.path.join(GRA, NAME[d] + ".gif"), save_all=True, append_images=ims[1:], duration=140, loop=0)
        print(NAME[d], len(ims), "klatek")


if __name__ == "__main__":
    main()
