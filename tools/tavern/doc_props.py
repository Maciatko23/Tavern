# python doc_props.py -> docs/tawerna_nowa/rekwizyty.png : the new props in the game next to Winlu pieces.
# Needs staging/renders/showroom_all_plain.png (render.js staging/jobs_showroom_all.json) and Showroom_all_meta.json.
# Yellow numbered pins = our new props (legend on the right), blue = Winlu pieces placed beside them for comparison.
import os, json
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ren = Image.open(os.path.join(HERE, "staging", "renders", "showroom_all_plain.png")).convert("RGB")
meta = json.load(open(os.path.join(HERE, "staging", "Showroom_all_meta.json"), encoding="utf-8"))
F = "C:/Windows/Fonts/"
f_t, f_s, f_p, f_l, f_h = (ImageFont.truetype(F + "arialbd.ttf", 30), ImageFont.truetype(F + "arial.ttf", 15),
                           ImageFont.truetype(F + "arialbd.ttf", 12), ImageFont.truetype(F + "arial.ttf", 14), ImageFont.truetype(F + "arialbd.ttf", 17))
LEG = 470
img = Image.new("RGB", (ren.size[0] + LEG + 30, ren.size[1] + 100), (22, 19, 17))
img.paste(ren, (10, 90))
d = ImageDraw.Draw(img, "RGBA")
d.text((12, 14), "Nowe rekwizyty tawerny w grze (obok elementów Winlu)", font=f_t, fill=(255, 214, 90))
d.text((12, 56), "Żółte numery = nowe rekwizyty (!Tavern_Props, !Tavern_Props2, !$Tavern_Board), niebieskie = oryginalne elementy Winlu dla porównania.",
       font=f_s, fill=(225, 218, 205))
news = [l for l in meta["labels"] if l[3] == "new"]
olds = [l for l in meta["labels"] if l[3] == "winlu"]
def pin(x, y, s, col):
    cx, cy = 10 + x * 48 + 24, 90 + y * 48 + 24
    d.ellipse([cx - 10, cy - 10, cx + 10, cy + 10], fill=col, outline=(20, 16, 10), width=2)
    d.text((cx - d.textlength(s, font=f_p) / 2, cy - 7), s, font=f_p, fill=(20, 16, 10))
for i, (t, x, y, k) in enumerate(news, 1): pin(x, y, str(i), (255, 214, 60, 255))
for i, (t, x, y, k) in enumerate(olds, 1): pin(x, y, chr(ord("a") + i - 1), (120, 180, 255, 255))
lx, y = ren.size[0] + 30, 96
d.text((lx, y), "Nowe", font=f_h, fill=(255, 214, 90)); y += 26
for i, (t, x, yy, k) in enumerate(news, 1):
    d.text((lx, y), "%2d. %s" % (i, t), font=f_l, fill=(236, 232, 224)); y += 19
y += 12
d.text((lx, y), "Winlu (dla porównania)", font=f_h, fill=(120, 180, 255)); y += 26
for i, (t, x, yy, k) in enumerate(olds, 1):
    d.text((lx, y), " %s. %s" % (chr(ord("a") + i - 1), t), font=f_l, fill=(200, 215, 235)); y += 19
out = os.path.join(ROOT, "docs", "tawerna_nowa", "rekwizyty.png")
img = img.crop((0, 0, img.size[0], max(ren.size[1] + 100, y + 20)))
img.save(out)
print("saved", out, img.size)
