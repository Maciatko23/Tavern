# -*- coding: utf-8 -*-
"""Plansze historyjek: tools/podroznicy/historyjki/H*_*.png (PixelLab Pro 640x360, 100 gen. razem) -> img/pictures/Hist_H*_*.png (1280x720, x2 bez wygładzania)."""
import os, glob
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "..", "..", "img", "pictures")
for f in sorted(glob.glob(os.path.join(HERE, "H*_*.png"))):
    im = Image.open(f).convert("RGBA")
    im.resize((im.width * 2, im.height * 2), Image.NEAREST).save(os.path.join(OUT, "Hist_" + os.path.basename(f)))
    print("Hist_" + os.path.basename(f))
