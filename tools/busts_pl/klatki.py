# Cut a $Npc sheet's frames for PixelLab: python tools/busts_pl/klatki.py Key [Key ...]
# -> tools/busts_pl/klatki/<Key>_przod.png and <Key>_lewo.png: the standing frame (column 1) of row 0 (down) and row 1 (left),
#    64x64 enlarged x2 (nearest) = 128x128, and <Key>_podglad.png: front, left x4 and the current game bust side by side
import os
import sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
CHARS = os.path.join(ROOT, 'img', 'characters')
PICS = os.path.join(ROOT, 'img', 'pictures')
OUT = os.path.join(HERE, 'klatki')
SHEET = {'Stach': 'Dziadek'}     # bust key -> sheet key when they differ


def frame(key, row):
    s = Image.open(os.path.join(CHARS, '$Npc_%s.png' % SHEET.get(key, key))).convert('RGBA')
    return s.crop((64, row * 64, 128, row * 64 + 64))


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for key in sys.argv[1:]:
        f, l = frame(key, 0), frame(key, 1)
        f.resize((128, 128), Image.NEAREST).save(os.path.join(OUT, key + '_przod.png'))
        l.resize((128, 128), Image.NEAREST).save(os.path.join(OUT, key + '_lewo.png'))
        pv = Image.new('RGBA', (256 * 2 + 300, 280), (40, 42, 50, 255))
        pv.alpha_composite(f.resize((256, 256), Image.NEAREST), (0, 12))
        pv.alpha_composite(l.resize((256, 256), Image.NEAREST), (256, 12))
        bp = os.path.join(PICS, key + '_Bust.png')
        if os.path.exists(bp):
            b = Image.open(bp).convert('RGBA')
            b = b.resize((round(b.width * 270 / b.height), 270), Image.LANCZOS)
            pv.alpha_composite(b, (512, 6))
        pv.convert('RGB').save(os.path.join(OUT, key + '_podglad.png'))
        print('ok', key)
