# -*- coding: utf-8 -*-
"""python tools/potwory2/art/zestawienie.py -> docs/zadania_nowe/potwory2_gra/zestawienie.png: the line-up next to the hero, every look's walk / blow / fall frames,
the crab and the giga crab, the big tentacles, the bones of day 10, the captain in the town."""
import os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
D = os.path.join(ROOT, "docs", "zadania_nowe", "potwory2_gra")
A = os.path.join(ROOT, "tools", "potwory2", "nowe", "img", "characters", "anim8")
W = 1920
try: F = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 22); FS = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 17)
except Exception: F = FS = ImageFont.load_default()
def shot(name, scale):
    im = Image.open(os.path.join(D, name)).convert("RGB")
    return im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)
def sheet(look, part, row, cols, scale=1.0):
    p = os.path.join(A, "Cr_%s_%s.png" % (look, part))
    if not os.path.exists(p): p = os.path.join(ROOT, "img", "characters", "anim8", "Cr_%s_%s.png" % (look, part))
    im = Image.open(p).convert("RGBA")
    return [im.crop((c * 96, row * 96, c * 96 + 96, row * 96 + 96)) for c in cols if c * 96 < im.width]
LOOKS = [("SkClub", "Szkielet z pałką (dzień 1+)"), ("SkSword", "Szkielet z mieczem (dzień 1+)"), ("SkSpear", "Szkielet z włócznią (dzień 20+)"), ("SkHammer", "Szkielet z młotem (dzień 20+)"),
         ("SkCaptain", "Kapitan z chorągwią (rozdz. 5)"), ("SeaCrab", "Krab olbrzym / krab-kolos (x2)")]
img = Image.new("RGB", (W, 5000), (24, 28, 26)); d = ImageDraw.Draw(img); y = 10
d.text((20, y), "W23 Coś z głębin, fala 2: utopieni żołnierze (szkielety), kraby, krab-kolos, kapitan, duże macki", font=F, fill=(240, 220, 120)); y += 40
a, b = shot("01_szeregiem_z_bohaterem.png", 0.75), shot("02_krab_i_kolos.png", 0.75)
img.paste(a, (0, y)); img.paste(b, (a.width + 0, y)); y += a.height + 10
d.text((20, y), "Chód (S, E, po 3 klatki), cios (E) i upadek (E) - arkusze gry, klatki powiększone 1:1 (arkusz ma komórki 96 px)", font=FS, fill=(200, 200, 200)); y += 26
for look, name in LOOKS:
    cells = sheet(look, "Walk8", 0, [1, 4, 7]) + sheet(look, "Walk8", 6, [1, 4, 7]) + sheet(look, "Atk8", 6, [2, 3, 4, 5, 6, 7]) + sheet(look, "Die8", 6, [0, 4, 6, 8])
    d.text((10, y + 30), name, font=FS, fill=(230, 230, 230))
    x = 300
    for c in cells:
        bg = Image.new("RGBA", (96, 96), (70, 80, 70, 255)); bg.alpha_composite(c); img.paste(bg.convert("RGB"), (x, y)); x += 98
    y += 100
y += 10
quad = [shot("06_macki_wynurzone.png", 0.75), shot("06_macka_uderza.png", 0.75), shot("07_kosci_dzien10.png", 0.75), shot("08_kapitan_miasto.png", 0.75)]
for i, q in enumerate(quad):
    img.paste(q, ((i % 2) * (q.width), y + (i // 2) * q.height))
y += 2 * quad[0].height
img = img.crop((0, 0, W, y))
img.save(os.path.join(D, "zestawienie.png")); print(img.size)
