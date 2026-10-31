# -*- coding: utf-8 -*-
"""img/characters/!$Latarnia_Slup.png: latarnia stojaca na drewnianym slupie (zamiast kafli 375/383 + !Decoration 7, czyli lampy do powieszenia na scianie,
wiszacej w powietrzu nad zelaznym stelazem). Ta sama latarnia i to samo drewno wspornika, co w !Decoration (postac 7, kierunek 4, wspornik w prawo).
Klatka 48 x 96 (1 x 2 kratki), dol klatki = dol kratki podstawy slupa (zdarzenie stoi na dawnym kaflu 383). Arkusz 3x4 identycznych klatek.
  python tools/swiat/etap1/latarnia_slup.py"""
import os
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sheet = Image.open(os.path.join(ROOT, "img", "characters", "!Decoration.png")).convert("RGBA")
cw, ch = sheet.width // 12, sheet.height // 8          # 48 x 96
x0, y0 = 3 * 3 * cw, 1 * 4 * ch                         # postac 7 (kolumna 3, wiersz 1)
src = sheet.crop((x0 + 1 * cw, y0 + 1 * ch, x0 + 2 * cw, y0 + 2 * ch))   # kierunek 4 (wiersz 1), wzor 1: wspornik w prawo, latarnia lekko w lewo
# kolory drewna wspornika z arkusza (ciemne, srednie, jasne)
px = src.load()
wood = sorted({px[x, y][:3] for x in range(cw) for y in range(0, 24) if px[x, y][3] == 255 and px[x, y][0] > px[x, y][2] + 6}, key=lambda c: sum(c))
base = wood[len(wood) // 2]; dark = wood[max(0, len(wood) // 6)]; light = wood[min(len(wood) - 1, 5 * len(wood) // 6)]
out = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
d = ImageDraw.Draw(out)
PX0, PX1 = 11, 21          # slup: x 11..21 (10 px), lewy brzeg jasny, prawy ciemny
TOP, BOT = 8, ch - 1
# cien przy podstawie (elipsa pod slupem)
sh = Image.new("RGBA", (cw, ch), (0, 0, 0, 0)); ds = ImageDraw.Draw(sh)
ds.ellipse([2, ch - 11, 36, ch - 2], fill=(0, 0, 0, 80))
out.alpha_composite(sh)
# slup
d.rectangle([PX0, TOP, PX1, BOT - 3], fill=base + (255,))
d.line([PX0, TOP, PX0, BOT - 3], fill=light + (255,))
d.line([PX0 + 1, TOP, PX0 + 1, BOT - 3], fill=tuple((a + b) // 2 for a, b in zip(light, base)) + (255,))
d.line([PX1, TOP, PX1, BOT - 3], fill=dark + (255,))
d.line([PX1 - 1, TOP + 20, PX1 - 1, BOT - 3], fill=tuple((a + b) // 2 for a, b in zip(dark, base)) + (255,))
for y in range(TOP + 4, BOT - 6, 9):           # slady slojow drewna
    d.line([PX0 + 3, y, PX0 + 3, y + 3], fill=dark + (255,))
    d.line([PX0 + 6, y + 4, PX0 + 6, y + 7], fill=dark + (255,))
# cokol: szersza podstawa
d.rectangle([PX0 - 2, BOT - 8, PX1 + 2, BOT - 1], fill=base + (255,))
d.line([PX0 - 2, BOT - 8, PX1 + 2, BOT - 8], fill=light + (255,))
d.line([PX0 - 2, BOT - 1, PX1 + 2, BOT - 1], fill=dark + (255,))
d.line([PX1 + 2, BOT - 8, PX1 + 2, BOT - 1], fill=dark + (255,))
# glowica slupa pod ramieniem
d.rectangle([PX0 - 1, TOP - 1, PX1 + 1, TOP + 3], fill=base + (255,))
d.line([PX0 - 1, TOP - 1, PX1 + 1, TOP - 1], fill=light + (255,))
# ramie z latarnia z arkusza, ODWROCONE poziomo: gruby koniec belki (strona "scienna" w arkuszu) wchodzi w szczyt slupa, belka idzie od slupa
# na zewnatrz w prawo, latarnia wisi pod zewnetrznym koncem belki (po odbiciu zawartosc zajmuje x 0..34 klatki; przesuniecie 14 -> x 14..48)
from PIL import ImageOps
out.alpha_composite(ImageOps.mirror(src), (14, 0))
sheet_out = Image.new("RGBA", (cw * 3, ch * 4), (0, 0, 0, 0))
for i in range(3):
    for j in range(4): sheet_out.paste(out, (i * cw, j * ch))
dst = os.path.join(ROOT, "img", "characters", "!$Latarnia_Slup.png")
sheet_out.save(dst); print("zapisano", dst, sheet_out.size)
bg = Image.new("RGBA", out.size, (70, 105, 70, 255)); bg.alpha_composite(out)
bg.resize((cw * 6, ch * 6), Image.NEAREST).save(os.path.join(HERE, "staging", "latarnia_slup_podglad.png"))
bg.resize((cw * 3, ch * 3), Image.NEAREST).save(os.path.join(ROOT, "docs", "swiat_etap1", "latarnia_slup_zoom.png"))
