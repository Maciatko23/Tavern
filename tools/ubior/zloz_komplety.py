# tools/ubior/zloz_komplety.py - zestawienia zrzutów kompletów z gry (tests/ubior_komplety_shot_test.js -> docs/ekwipunek/mapa/zrzuty/):
# wiersz na komplet, kolumna na pozę (dół, prawo, góra, lewo, chód, chód w prawo, cios, cios w dół, siedzi), powiększenie x2.
#   python tools/ubior/zloz_komplety.py      -> docs/ekwipunek/mapa/komplety_1.png, komplety_2.png, komplety_3.png (po 5 kompletów)
import os, json
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.normpath(os.path.join(HERE, '..', '..'))
D = os.path.join(GAME, 'docs', 'ekwipunek', 'mapa')
SRC = os.path.join(D, 'zrzuty')
POSES = [('dol', 'dół'), ('prawo', 'prawo'), ('gora', 'góra'), ('lewo', 'lewo'), ('chod', 'chód'), ('chod_prawo', 'chód w prawo'),
         ('cios', 'cios'), ('cios_dol', 'cios w dół'), ('siedzi', 'siedzi')]
Z = 2
LEFT = 150
TOP = 26


def font(sz):
    for f in ('C:/Windows/Fonts/segoeui.ttf', 'C:/Windows/Fonts/arial.ttf'):
        if os.path.exists(f):
            return ImageFont.truetype(f, sz)
    return ImageFont.load_default()


def main():
    meta = json.load(open(os.path.join(SRC, 'pozycje.json'), encoding='utf-8'))
    sets = meta['sets']
    f1, f2 = font(15), font(12)
    for part, chunk in enumerate([sets[i:i + 5] for i in range(0, len(sets), 5)], 1):
        if not chunk:
            continue
        cw = ch = 112 * Z
        W = LEFT + len(POSES) * (cw + 4)
        H = TOP + len(chunk) * (ch + 4)
        out = Image.new('RGB', (W, H), (22, 21, 20))
        dr = ImageDraw.Draw(out)
        for j, (_, lab) in enumerate(POSES):
            dr.text((LEFT + j * (cw + 4) + 4, 6), lab, fill=(240, 200, 80), font=f1)
        for i, s in enumerate(chunk):
            y = TOP + i * (ch + 4)
            dr.text((6, y + 6), s['name'], fill=(240, 200, 80), font=f1)
            ty = y + 28
            for k, v in s['set'].items():
                dr.text((6, ty), v, fill=(200, 196, 186), font=f2)
                ty += 15
            if s.get('shield'):
                dr.text((6, ty), s['shield'], fill=(200, 196, 186), font=f2)
            got = {sh['n']: sh['f'] for sh in s['shots']}
            for j, (n, _) in enumerate(POSES):
                if n not in got:
                    continue
                im = Image.open(os.path.join(SRC, got[n])).convert('RGB')
                out.paste(im.resize((im.width * Z, im.height * Z), Image.NEAREST), (LEFT + j * (cw + 4), y))
        p = os.path.join(D, 'komplety_%d.png' % part)
        out.save(p, optimize=True)
        print(os.path.relpath(p, GAME), out.size)


if __name__ == '__main__':
    main()
