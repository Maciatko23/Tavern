# docs/postacie/popiersia_lineup.png: every talk bust - the hero, grandpa, the tavern people (RTP) and the residents - at the
# game's size (273 px high), each with its name and its map sprite (the front frame of its sheet) under it, the RTP base noted.
# Run: python tools/busts/make_lineup.py [out.png]
import os
import sys
from PIL import Image, ImageDraw, ImageFont
from make_residents import RESIDENTS

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
PICS = os.path.join(ROOT, 'img', 'pictures')
CHARS = os.path.join(ROOT, 'img', 'characters')
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'docs', 'postacie', 'popiersia_lineup.png')

# (bust, name, sheet, base note)
ENTRIES = [('Hero_Bust', 'Bohater', None, 'People1_3*'), ('Stach_Bust', 'Dziadek Stach', '$Npc_Dziadek', 'People1_7*'),
           ('People3_5', 'Borgar', '$Npc_Borgar', 'RTP'), ('People2_8', 'Melia', '$Npc_Melia', 'RTP'), ('Actor2_5', 'Grum', '$Npc_Grum', 'RTP'),
           ('People2_1', 'Dziadek Ozzy', '$Npc_Ozzy', 'RTP'), ('People1_6', 'Wanda', '$Npc_Wanda', 'RTP')]
for key, who, base in RESIDENTS:
    ENTRIES.append((key[0].upper() + key[1:] + '_Bust', who, '$Npc_' + key[0].upper() + key[1:], base + '*'))

H = 273
COLS = 6
CW, CH = 270, H + 150
BG = (30, 31, 38)


def font(sz):
    for f in ('C:/Windows/Fonts/segoeui.ttf', 'C:/Windows/Fonts/arial.ttf'):
        if os.path.exists(f):
            return ImageFont.truetype(f, sz)
    return ImageFont.load_default()


F1, F2 = font(17), font(12)
rows = (len(ENTRIES) + COLS - 1) // COLS
sheet = Image.new('RGBA', (COLS * CW + 20, rows * CH + 60), BG + (255,))
d = ImageDraw.Draw(sheet)
d.text((12, 12), 'Popiersia w rozmowach (gra: 273 px wysokości; * = przemalowane RTP, tools/busts/make_*.py) - pod spodem postać z mapy',
       fill=(255, 220, 90, 255), font=F1)
for i, (bust, who, sheetname, note) in enumerate(ENTRIES):
    x0, y0 = 10 + (i % COLS) * CW, 50 + (i // COLS) * CH
    p = os.path.join(PICS, bust + '.png')
    if os.path.exists(p):
        im = Image.open(p).convert('RGBA')
        im = im.resize((round(im.width * H / im.height), H), Image.LANCZOS)
        sheet.alpha_composite(im, (x0 + (CW - im.width) // 2, y0))
    else:
        d.text((x0 + 20, y0 + 120), 'BRAK ' + bust, fill=(255, 90, 90, 255), font=F1)
    d.text((x0 + 6, y0 + H + 4), who, fill=(240, 240, 240, 255), font=F1)
    d.text((x0 + 6, y0 + H + 26), bust + '  (' + note + ')', fill=(170, 170, 180, 255), font=F2)
    if sheetname:
        sp = os.path.join(CHARS, sheetname + '.png')
        if os.path.exists(sp):
            s = Image.open(sp).convert('RGBA')
            fw, fh = s.width // 3, s.height // 4
            fr = s.crop((fw, 0, 2 * fw, fh)).resize((fw * 1, fh * 1), Image.NEAREST)
            bb = fr.getbbox()
            if bb:
                fr = fr.crop(bb)
                k = min(1.6, 90 / fr.height)
                fr = fr.resize((max(1, round(fr.width * k)), max(1, round(fr.height * k))), Image.NEAREST)
                sheet.alpha_composite(fr, (x0 + CW - fr.width - 12, y0 + H + 44 + (96 - fr.height)))
sheet.convert('RGB').save(OUT)
print('ok', OUT)
