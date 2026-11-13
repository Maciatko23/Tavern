# -*- coding: utf-8 -*-
"""Arkusze lodzi z gory: nowe pliki img/characters/!$Lodz_*_z_gory.png (3 kolumny x 4 wiersze, kolumny = kolysanie 0/1/2 px w dol jak stare arkusze)."""
import os, sys
from PIL import Image, ImageEnhance
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
TMP = os.path.join(HERE, "tmp")
def tone(im, b=1.0, c=1.0, s=1.0):
    a = im.split()[3]; rgb = im.convert("RGB")
    rgb = ImageEnhance.Color(rgb).enhance(s); rgb = ImageEnhance.Brightness(rgb).enhance(b); rgb = ImageEnhance.Contrast(rgb).enhance(c)
    out = rgb.convert("RGBA"); out.putalpha(a); return out
def sheet(src, name, frame, center, b=1.0, s=1.0):
    im = Image.open(os.path.join(TMP, src)).convert("RGBA"); im = im.crop(im.getbbox()); im = tone(im, b, 1.0, s)
    fw, fh = frame; out = Image.new("RGBA", (fw * 3, fh * 4), (0, 0, 0, 0))
    ox, oy = center[0] - im.width // 2, center[1] - im.height // 2
    sh = Image.new("RGBA", im.size, (14, 34, 34, 255)); a = im.split()[3].point(lambda v: int(v * 0.38)); sh.putalpha(a)
    for r in range(4):
        for c in range(3):
            out.alpha_composite(sh, (c * fw + ox + 1, r * fh + oy + c + 5)); out.alpha_composite(im, (c * fw + ox, r * fh + oy + c))
    out.save(os.path.join(ROOT, "img", "characters", name + ".png")); print(name, out.size, "boat", im.size)
if __name__ == "__main__":
    sheet(sys.argv[1] if len(sys.argv) > 1 else "gen_sail2.png", "!$Lodz_Zaglowka_z_gory", (240, 120), (120, 64), 0.82, 0.9)
    sheet("gen_row1b.png", "!$Lodz_Janka_z_gory", (144, 72), (72, 34), 0.95, 0.5)
    sheet("gen_row2b.png", "!$Lodz_Mala_z_gory", (120, 64), (59, 29), 0.95, 0.5)
    # the same small-boat sheet as a staged replacement of the old side view one (Wyspy.js draws its own boats from it): copy at install
    import shutil; os.makedirs(os.path.join(HERE, "staging", "img", "characters"), exist_ok=True)
    shutil.copy(os.path.join(ROOT, "img", "characters", "!$Lodz_Mala_z_gory.png"), os.path.join(HERE, "staging", "img", "characters", "!$Przystan_Lodz_Mala.png"))
