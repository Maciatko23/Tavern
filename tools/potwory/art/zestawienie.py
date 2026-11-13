# -*- coding: utf-8 -*-
"""python tools/potwory/art/zestawienie.py -> docs/zadania_nowe/potwory_gra/: paski klatek (chód S i E, cios, upadek) każdego potwora i macki + zestawienie.png"""
import os, shutil
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
OUT = os.path.join(ROOT, "docs", "zadania_nowe", "potwory_gra")
os.makedirs(OUT, exist_ok=True)
CH = os.path.join(ROOT, "tools", "potwory", "nowe", "img", "characters")
NAMES = {"topielec": "SeaDrowned", "krab": "SeaCrab", "rybolak": "SeaFolk", "mglak": "SeaFog", "wiedzma": "SeaWitch"}
rows = []
for key, look in NAMES.items():
    for part in ("Walk8", "Atk8", "Die8"):
        p = os.path.join(CH, "anim8", "Cr_%s_%s.png" % (look, part))
        if not os.path.exists(p): continue
        im = Image.open(p).convert("RGBA"); n = im.width // 96
        strip = Image.new("RGBA", (96 * n, 96 * 2), (0, 0, 0, 0))
        for k, r in enumerate((0, 6)): strip.alpha_composite(im.crop((0, r * 96, 96 * n, r * 96 + 96)), (0, k * 96))   # S and E rows
        bg = Image.new("RGBA", strip.size, (62, 78, 70, 255)); bg.alpha_composite(strip)
        bg = bg.resize((bg.width * 2, bg.height * 2), Image.NEAREST)
        bg.save(os.path.join(OUT, "pasek_%s_%s.png" % (key, part)))
        if part == "Walk8": rows.append((key, bg))
m = Image.open(os.path.join(CH, "Morze_Macka.png")).convert("RGBA")
mb = Image.new("RGBA", m.size, (40, 80, 110, 255)); mb.alpha_composite(m); mb = mb.resize((m.width * 2, m.height * 2), Image.NEAREST); mb.save(os.path.join(OUT, "pasek_macka.png"))
rows.append(("macka", mb))
W = max(r[1].width for r in rows); H = sum(r[1].height + 6 for r in rows)
sheet = Image.new("RGBA", (W, H), (30, 36, 34, 255)); d = ImageDraw.Draw(sheet); y = 0
for key, im in rows:
    sheet.alpha_composite(im, (0, y)); d.text((6, y + 4), key, fill=(255, 220, 90, 255)); y += im.height + 6
sheet.save(os.path.join(OUT, "zestawienie.png"))
print("ok", OUT)
