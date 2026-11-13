# -*- coding: utf-8 -*-
import os, sys
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
im = Image.new("RGBA", (1000, 280), (70, 90, 60, 255))
x = 0
for n, w, h in [("!$Mlyn_Kamien", 192, 96), ("!$Mlyn_Os", 144, 96), ("!$Mlyn_Dzwignia", 48, 96), ("!$Mlyn_Lodz", 192, 96), ("!$Mlyn_Worki", 96, 48)]:
    s = Image.open(os.path.join(ROOT, "img", "characters", n + ".png")).crop((w, 0, 2 * w, h))
    s = s.resize((w * 2, h * 2), Image.NEAREST) if w < 150 else s
    im.alpha_composite(s, (x, 10)); x += s.width + 6
im.save(sys.argv[1])
