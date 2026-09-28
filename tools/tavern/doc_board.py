# python doc_board.py -> docs/tawerna_nowa/tablica_zlecen.png: the quest board close-up (the game render x2 and the
# sprite x3) with a short caption. Needs staging/renders/showroom_18.png (render.js staging/jobs_showroom.json).
import os
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ren = Image.open(os.path.join(HERE, "staging", "renders", "showroom_18.png")).convert("RGB")
crop = ren.crop((264, 40, 264 + 288, 40 + 244)).resize((576, 488), Image.NEAREST)
spr = Image.open(os.path.join(ROOT, "img", "characters", "!$Tavern_Board.png")).convert("RGBA").crop((0, 0, 144, 144))
bgc = Image.new("RGBA", spr.size, (58, 50, 44, 255)); bgc.alpha_composite(spr)
spr3 = bgc.resize((432, 432), Image.NEAREST).convert("RGB")
W, H = 576 + 432 + 60, 488 + 120
img = Image.new("RGB", (W, H), (24, 20, 18))
img.paste(crop, (20, 96)); img.paste(spr3, (576 + 40, 96 + 28))
d = ImageDraw.Draw(img)
F = "C:/Windows/Fonts/"
d.text((20, 16), "Tablica zleceń (3x3 kratki) - w grze x2 i sam obrazek x3", font=ImageFont.truetype(F + "arialbd.ttf", 24), fill=(255, 214, 90))
f13 = ImageFont.truetype(F + "arial.ttf", 14)
d.text((20, 48), "Rzeźbiona rama z daszkiem, szyld ZLECENIA ze złotymi kuflami, latarnia, ogłoszenia z pieczęciami, wstążka,", font=f13, fill=(225, 218, 205))
d.text((20, 66), "podarty róg, list gończy POSZUKIWANY, półka z piórem, kałamarzem i kartkami. Stoi przy ścianie sieni, oświetlona.", font=f13, fill=(225, 218, 205))
H2 = 0
out = os.path.join(ROOT, "docs", "tawerna_nowa", "tablica_zlecen.png")
img.save(out)
print("saved", out, img.size)
