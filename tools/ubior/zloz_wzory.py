# tools/ubior/zloz_wzory.py - obrazki pełnego ubioru z wyników tests/ubior_test.js:
#   docs/ekwipunek/wzory_glowa.png, wzory_tors.png, wzory_nogi_stopy.png, wzory_pas_rece_plecy.png
#        każdy wzór z Ubior_Data.WZORY osobno (wiersze), ujęcia z przebranych arkuszy gry (kolumny), x2
#   docs/ekwipunek/stroje_w_grze.png   cztery pełne stroje na mapie (zrzuty z ekranu gry), x2
#   docs/ekwipunek/popiersia.png       popiersie z rozmów w czterech strojach + karta postaci (menu P -> Postać -> Ekwipunek)
#   python tools/ubior/zloz_wzory.py tests/ubior
import sys, os, json
from PIL import Image, ImageDraw, ImageFont

GAME = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
DOCS = os.path.join(GAME, 'docs', 'ekwipunek')
GROUPS = [('wzory_glowa', ['glowa'], 'Głowa'), ('wzory_tors', ['tors'], 'Tors'), ('wzory_nogi_stopy', ['nogi', 'stopy'], 'Nogi i stopy'),
          ('wzory_pas_rece_plecy', ['pas', 'rece', 'plecy'], 'Pas, rękawice, plecy')]
BG = (66, 100, 62)


def font(size, bold=False):
    for f in (('arialbd.ttf' if bold else 'arial.ttf'), 'calibri.ttf'):
        p = os.path.join(os.environ.get('WINDIR', r'C:\Windows'), 'Fonts', f)
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def grid(rows, cols, title, out, Z=2, left=250):
    """rows: [(label, sub, [file|None...])], cols: column labels"""
    cw = 96 * Z
    head = 70
    W = left + len(cols) * (cw + 4)
    H = head + len(rows) * (cw + 4) + 10
    img = Image.new('RGB', (W, H), (24, 22, 20))
    d = ImageDraw.Draw(img)
    fb, fs, ft = font(18, True), font(14), font(24, True)
    d.text((10, 8), title, font=ft, fill=(250, 220, 90))
    for j, c in enumerate(cols):
        d.text((left + j * (cw + 4) + 4, 44), c, font=fs, fill=(235, 235, 235))
    for i, (label, sub, files) in enumerate(rows):
        y = head + i * (cw + 4)
        d.text((10, y + cw // 2 - 20), label, font=fb, fill=(250, 220, 90))
        if sub:
            d.text((10, y + cw // 2 + 4), sub, font=fs, fill=(190, 190, 190))
        for j, f in enumerate(files):
            if not f:
                continue
            im = Image.open(f).convert('RGBA')
            bg = Image.new('RGBA', im.size, BG + (255,))
            bg.alpha_composite(im)
            img.paste(bg.convert('RGB').resize((im.width * Z, im.height * Z), Image.NEAREST), (left + j * (cw + 4), y))
    img.save(out, optimize=True)
    return img.size


def main(argv):
    src = argv[0] if argv else os.path.join(GAME, 'tests', 'ubior')
    shots = os.path.join(src, 'shots')
    meta = json.load(open(os.path.join(src, 'meta.json'), encoding='utf-8'))
    plain = next((p for p in meta['patterns'] if p['key'] == '_bez'), None)
    for name, places, title in GROUPS:
        rows = []
        if plain:
            rows.append(('bez stroju', 'łachman', [os.path.join(shots, f) if f else None for f in plain['files']]))
        for p in meta['patterns']:
            if p['miejsce'] in places:
                sub = p['miejsce'] + (' · nakładka: ' + p['nakladka'] if p['nakladka'] else ' · przemalowanie')
                rows.append((p['key'], sub, [os.path.join(shots, f) if f else None for f in p['files']]))
        out = os.path.join(DOCS, name + '.png')
        size = grid(rows, meta['views'], 'Ubiór - wzory: %s (z przebranych arkuszy gry, x2)' % title, out)
        print('->', os.path.relpath(out, GAME).replace('\\', '/'), '%dx%d' % size)
    # full outfits on the map
    rows = []
    cols = None
    for o in meta['outfits']:
        lst = meta['shots'].get(o['key'], [])
        cols = cols or [x['label'] for x in lst]
        rows.append((o['key'], o['label'][:40] + ('...' if len(o['label']) > 40 else ''), [os.path.join(shots, x['file']) for x in lst]))
    out = os.path.join(DOCS, 'stroje_w_grze.png')
    size = grid(rows, cols or [], 'Pełne stroje na mapie - zrzuty z ekranu gry (x2)', out, left=330)
    print('->', os.path.relpath(out, GAME).replace('\\', '/'), '%dx%d' % size)
    # busts + the talk + the card
    busts = [Image.open(os.path.join(shots, b['file'])).convert('RGBA') for b in meta['busts']]
    plain_bust = Image.open(os.path.join(GAME, 'img', 'pictures', 'Hero_Bust.png')).convert('RGBA')
    tiles = [('bez stroju', plain_bust)] + [(b['key'], im) for b, im in zip(meta['busts'], busts)]
    bw, bh = plain_bust.size
    talk = None   # (rozmowa bez popiersia rozmówcy pokazuje tylko dymki - zrzut nie mówi nic o ubiorze)
    card = Image.open(os.path.join(shots, 'karta_B.png')).convert('RGB') if os.path.exists(os.path.join(shots, 'karta_B.png')) else None
    W = max(len(tiles) * (bw + 8) + 10, 1290)
    H = 60 + bh + 40 + (370 if talk else 0) + (370 if card else 0)
    img = Image.new('RGB', (W, H), (24, 22, 20))
    d = ImageDraw.Draw(img)
    d.text((10, 8), 'Popiersie w rozmowach (ta sama metoda: maska portretu, płynne przemalowanie, nakrycie głowy)', font=font(22, True), fill=(250, 220, 90))
    for i, (lab, im) in enumerate(tiles):
        bg = Image.new('RGBA', im.size, BG + (255,))
        bg.alpha_composite(im)
        img.paste(bg.convert('RGB'), (10 + i * (bw + 8), 50))
        d.text((14 + i * (bw + 8), 52 + bh), lab + (': ' + next(o['label'] for o in meta['outfits'] if o['key'] == lab)[:44] if lab != 'bez stroju' else ''), font=font(13), fill=(220, 220, 220))
    y = 60 + bh + 30
    for label, im in (('rozmowa (strój A)', talk), ('karta postaci (strój B)', card)):
        if im is None:
            continue
        d.text((10, y), label, font=font(16, True), fill=(250, 220, 90))
        im2 = im.resize((im.width // 2, im.height // 2), Image.LANCZOS)
        img.paste(im2, (10, y + 24))
        y += im2.height + 40
    img = img.crop((0, 0, W, y))
    out = os.path.join(DOCS, 'popiersia.png')
    img.save(out, optimize=True)
    print('->', os.path.relpath(out, GAME).replace('\\', '/'), '%dx%d' % img.size)


if __name__ == '__main__':
    main(sys.argv[1:])
