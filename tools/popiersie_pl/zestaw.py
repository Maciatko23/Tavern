# Compose the hero's bust from the layers (tools/popiersie_pl/warstwy.json, made by tnij.py) and draw check sheets.
#   python tools/popiersie_pl/zestaw.py warstwy          -> docs/ekwipunek/popiersie/warstwy_kontrola.png: per family the raw edit,
#                                                           the layer alone (on a checker) and base + layer
#   python tools/popiersie_pl/zestaw.py zestawy          -> docs/ekwipunek/popiersie/zestawy.png: full outfits from several layers
# compose(names) is the reference for the game's integration: base -> erase every worn piece's "ukryj" -> layers by "kolejnosc".
import json
import os
import sys

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
DOCS = os.path.join(ROOT, 'docs', 'ekwipunek', 'popiersie')
DATA = json.load(open(os.path.join(HERE, 'warstwy.json'), encoding='utf-8'))
BG = (46, 48, 56, 255)
from PIL import ImageFont
FONT = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 13) if os.path.exists('C:/Windows/Fonts/segoeui.ttf') else None
FONT_S = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 10) if os.path.exists('C:/Windows/Fonts/segoeui.ttf') else None

# full outfits to check (one thing per slot)
ZESTAWY = [
    ('chłop w słomkowym', ['kapelusz_slomkowy', 'koszula_lniana', 'torba']),
    ('zimą w kożuszku', ['czapka_filcowa', 'kozuszek', 'szal']),
    ('zwiadowca', ['kaptur_sukienny', 'skorznia', 'plecak']),
    ('łowca', ['kaptur_futrzany', 'skorznia_futrzana']),
    ('strażnik', ['kapalin', 'przeszywanica']),
    ('najemnik', ['czepiec_kolczy', 'kolczuga', 'plaszcz']),
    ('żelazny', ['helm_nosal', 'luska', 'plaszcz_futrzany']),
    ('rycerz', ['szyszak', 'napiersnik', 'peleryna']),
    ('zakonny', ['helm_zamkniety', 'brygantyna', 'plaszcz']),
    ('mieszczanin', ['kapelusz_filcowy', 'zupan', 'amulet']),
    ('kowal', ['opaska', 'fartuch_kowalski']),
    ('odświętnie', ['chusta', 'koszula_odswietna', 'amulet']),
    ('rzemieślnik', ['helm_otwarty', 'kurta', 'torba']),
    ('ćwieki', ['czepiec_pikowany', 'skorznia_cwiekowana']),
    ('w kaftanie', ['kaptur_skorzany', 'kaftan', 'szal']),
    ('z koszem', ['kapelusz_slomkowy', 'koszula_lniana', 'kosz_wiklinowy']),
    ('zwiadowca II', ['kaptur_sukienny', 'kurta', 'plaszcz']),
]


def img(rel):
    return Image.open(os.path.join(HERE, rel)).convert('RGBA')


def compose(names):
    out = img(DATA['_baza'])
    fams = [DATA[n] for n in names if n in DATA]
    px = out.load()
    for f in fams:
        if f.get('ukryj'):
            m = img(f['ukryj']).load()
            for y in range(128):
                for x in range(128):
                    if m[x, y][3]:
                        px[x, y] = (0, 0, 0, 0)
    for f in sorted(fams, key=lambda f: f['kolejnosc']):
        out.alpha_composite(img(f['plik']))
    return out


def on_bg(im, sc, checker=False):
    bg = Image.new('RGBA', im.size, BG)
    if checker:
        d = ImageDraw.Draw(bg)
        for y in range(0, im.height, 8):
            for x in range(0, im.width, 8):
                if (x // 8 + y // 8) % 2:
                    d.rectangle((x, y, x + 7, y + 7), fill=(90, 30, 90, 255))
    bg.alpha_composite(im)
    return bg.resize((im.width * sc, im.height * sc), Image.NEAREST)


def sheet_layers(out):
    names = [k for k in DATA if not k.startswith('_')]
    sc, W = 2, 256
    cols = 3
    rows = (len(names) + cols - 1) // cols
    cw = 3 * W + 30
    sh = Image.new('RGBA', (cols * cw + 10, rows * (W + 26) + 10), (22, 22, 26, 255))
    d = ImageDraw.Draw(sh)
    for i, n in enumerate(names):
        x0, y0 = 10 + (i % cols) * cw, 10 + (i // cols) * (W + 26)
        f = DATA[n]
        d.text((x0, y0), '%s  [%s, %s]%s' % (n, f['miejsce'], f['material'], '  ukrywa włosy' if f['ukrywa_wlosy'] else ''),
               fill=(255, 220, 90, 255), font=FONT)
        raw = img(f['surowe'])
        sh.alpha_composite(on_bg(raw, sc), (x0, y0 + 18))
        sh.alpha_composite(on_bg(img(f['plik']), sc, True), (x0 + W + 6, y0 + 18))
        sh.alpha_composite(on_bg(compose([n]), sc), (x0 + 2 * W + 12, y0 + 18))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    sh.convert('RGB').save(out)
    print('ok', out)


def sheet_sets(out):
    sc, W = 2, 256
    cols = 5
    rows = (len(ZESTAWY) + 1 + cols - 1) // cols
    sh = Image.new('RGBA', (cols * (W + 8) + 8, rows * (W + 44) + 8), (22, 22, 26, 255))
    d = ImageDraw.Draw(sh)
    items = [('baza', [])] + ZESTAWY
    for i, (name, parts) in enumerate(items):
        x0, y0 = 8 + (i % cols) * (W + 8), 8 + (i // cols) * (W + 44)
        d.text((x0, y0), name, fill=(255, 220, 90, 255), font=FONT)
        d.text((x0, y0 + 16), ' + '.join(parts) or 'hero_baza', fill=(170, 170, 180, 255), font=FONT_S)
        sh.alpha_composite(on_bg(compose(parts), sc), (x0, y0 + 36))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    sh.convert('RGB').save(out)
    print('ok', out)


if __name__ == '__main__':
    what = sys.argv[1] if len(sys.argv) > 1 else 'zestawy'
    if what == 'warstwy':
        sheet_layers(sys.argv[2] if len(sys.argv) > 2 else os.path.join(DOCS, 'warstwy_kontrola.png'))
    else:
        sheet_sets(sys.argv[2] if len(sys.argv) > 2 else os.path.join(DOCS, 'zestawy.png'))
