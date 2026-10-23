# tools/ubior/zloz_proba.py - składa obrazki próby ubioru z wyników testu tests/ubior_proba_test.js:
#   docs/ekwipunek/proba_ubioru.png   siatka zrzutów z gry: wiersze = stroje, kolumny = kierunki chodu / klatki zamachu (x2)
#   docs/ekwipunek/proba_arkusze.png  przemalowane arkusze (wyjęte z gry) obok oryginału
#   docs/ekwipunek/proba_zblizenie.png  kilka klatek x4 we wszystkich strojach (piksele z bliska)
#   docs/ekwipunek/maska_przyklad.png  oryginał / maska części ciała / ubrany - kilka klatek x3 z legendą
#   python tools/ubior/zloz_proba.py tests/ubior_proba
import sys, os, json
from PIL import Image, ImageDraw, ImageFont

GAME = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
DOCS = os.path.join(GAME, 'docs', 'ekwipunek')


def font(size, bold=False):
    for f in (('arialbd.ttf' if bold else 'arial.ttf'), 'calibri.ttf', 'segoeui.ttf'):
        p = os.path.join(os.environ.get('WINDIR', r'C:\Windows'), 'Fonts', f)
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def wrap(d, text, f, width):
    words, lines, cur = text.split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if d.textlength(t, font=f) <= width or not cur:
            cur = t
        else:
            lines.append(cur); cur = w
    if cur:
        lines.append(cur)
    return lines


def grid(src, meta):
    shots = os.path.join(src, 'shots')
    Z = 2
    first = Image.open(os.path.join(shots, next(iter(meta['cells'].values()))['file']))
    cw, ch = first.width * Z, first.height * Z
    left, top, gap, head = 230, 128, 4, 66
    cols, rows = meta['cols'], meta['outfits']
    W = left + len(cols) * (cw + gap)
    H = top + len(rows) * (ch + gap) + 40
    img = Image.new('RGB', (W, H), (24, 22, 20))
    d = ImageDraw.Draw(img)
    fh, fb, fs = font(17), font(19, True), font(15)
    d.text((10, 8), 'Próba ubioru - zrzuty z gry (x2)', font=font(24, True), fill=(250, 220, 90))
    d.text((10, 40), 'chód: klatka 3 z 8 · zamach: klatka nad głową / klatka uderzenia', font=fs, fill=(200, 200, 200))
    for j, c in enumerate(cols):
        x = left + j * (cw + gap)
        lines = wrap(d, c['label'], fs, cw - 6)[:3]
        for k, line in enumerate(lines):
            d.text((x + 3, head + (3 - len(lines)) * 18 + k * 18), line, font=fs, fill=(235, 235, 235))
    for i, r in enumerate(rows):
        y = top + i * (ch + gap)
        for k, line in enumerate(wrap(d, r['label'], fb, left - 20)):
            d.text((10, y + ch // 2 - 14 + k * 24 - (12 if len(wrap(d, r['label'], fb, left - 20)) > 1 else 0)), line, font=fb, fill=(250, 220, 90))
        for j, c in enumerate(cols):
            cell = meta['cells'].get(r['key'] + '/' + c['key'])
            if not cell:
                continue
            im = Image.open(os.path.join(shots, cell['file'])).convert('RGB').resize((cw, ch), Image.NEAREST)
            img.paste(im, (left + j * (cw + gap), y))
    d.text((10, H - 30), 'tests/ubior_proba_test.js · js/plugins/Ubior.js · maski: tools/ubior/maski.py · kapelusz: tools/ubior/kapelusz.py', font=fs, fill=(160, 160, 160))
    out = os.path.join(DOCS, 'proba_ubioru.png')
    img.save(out, optimize=True)
    return out, img.size


def sheets(src, meta):
    shots = os.path.join(src, 'shots')
    sh = meta['sheets']
    get = lambda k, n: Image.open(os.path.join(shots, sh[k + '/' + n])).convert('RGBA') if (k + '/' + n) in sh else None
    names = {'bez': 'oryginał', 'len': 'lniana koszula', 'welna': 'wełniany kaftan', 'ziel': 'zielona kurta', 'wszystko': 'kapelusz + kaftan + buty'}
    blocks = [
        ('Hero_Walk - chód (8 kierunków x 9 klatek 64x64)', [[('bez', 'Hero_Walk'), ('len', 'Hero_Walk'), ('welna', 'Hero_Walk'), ('ziel', 'Hero_Walk')],
                                                            [('wszystko', 'Hero_Walk')]]),
        ('Hero_Axe - siekiera z góry (4 kierunki x 17 klatek 96x96)', [[('bez', 'Hero_Axe')], [('wszystko', 'Hero_Axe')], [('ziel', 'Hero_Axe')]]),
        ('Hero_AxeSide - siekiera z boku (4 kierunki x 17 klatek 96x96)', [[('bez', 'Hero_AxeSide')], [('wszystko', 'Hero_AxeSide')], [('len', 'Hero_AxeSide')]]),
    ]
    fb, fs = font(22, True), font(16)
    lay, W, y = [], 0, 10
    for title, lines in blocks:
        lay.append(('T', title, 10, y)); y += 34
        for line in lines:
            x = 10
            hmax = 0
            for k, n in line:
                im = get(k, n)
                if im is None:
                    continue
                lay.append(('L', names[k], x, y)); lay.append(('I', im, x, y + 22))
                x += im.width + 16
                hmax = max(hmax, im.height)
            W = max(W, x)
            y += 22 + hmax + 12
        y += 10
    img = Image.new('RGBA', (W, y), (24, 22, 20, 255))
    d = ImageDraw.Draw(img)
    for kind, a, x, yy in lay:
        if kind == 'T':
            d.text((x, yy), a, font=fb, fill=(250, 220, 90, 255))
        elif kind == 'L':
            d.text((x, yy), a, font=fs, fill=(235, 235, 235, 255))
        else:
            bg = Image.new('RGBA', a.size, (66, 100, 62, 255))
            bg.alpha_composite(a)
            img.paste(bg, (x, yy))
    out = os.path.join(DOCS, 'proba_arkusze.png')
    img.convert('RGB').save(out, optimize=True)
    return out, img.size


def closeup(src, meta):
    # x4: kilka klatek we wszystkich strojach obok siebie - piksele widać dokładnie
    shots = os.path.join(src, 'shots')
    Z, crop = 4, (16, 8, 80, 92)          # (wycinek zrzutu 96x92: postać bez pustych brzegów)
    picks = [('walk2', 'chód: dół'), ('walk6', 'chód: prawo'), ('walk8', 'chód: góra'), ('swing0', 'zamach nad głową'), ('swing4', 'z boku: uderzenie')]
    cw, ch = (crop[2] - crop[0]) * Z, (crop[3] - crop[1]) * Z
    left, top, gap = 190, 70, 6
    rows = meta['outfits']
    W = left + len(rows) * (cw + gap)
    H = top + len(picks) * (ch + gap) + 10
    img = Image.new('RGB', (W, H), (24, 22, 20))
    d = ImageDraw.Draw(img)
    fb, fs = font(19, True), font(16)
    d.text((10, 8), 'Próba ubioru - zbliżenie (x4, zrzuty z gry)', font=font(24, True), fill=(250, 220, 90))
    for j, r in enumerate(rows):
        lines = wrap(d, r['label'], fs, cw - 6)[:2]
        for k, line in enumerate(lines):
            d.text((left + j * (cw + gap) + 3, 40 + (2 - len(lines)) * 0 + k * 18 - (0 if len(lines) > 1 else -9)), line, font=fs, fill=(235, 235, 235))
    for i, (key, label) in enumerate(picks):
        y = top + i * (ch + gap)
        for k, line in enumerate(wrap(d, label, fb, left - 20)):
            d.text((10, y + ch // 2 - 12 + k * 24), line, font=fb, fill=(250, 220, 90))
        for j, r in enumerate(rows):
            cell = meta['cells'].get(r['key'] + '/' + key)
            if not cell:
                continue
            im = Image.open(os.path.join(shots, cell['file'])).convert('RGB').crop(crop).resize((cw, ch), Image.NEAREST)
            img.paste(im, (left + j * (cw + gap), y))
    out = os.path.join(DOCS, 'proba_zblizenie.png')
    img.save(out, optimize=True)
    return out, img.size


def masks(src, meta):
    # jak to działa: kilka klatek - oryginał, maska części ciała, ubrany (wszystko) - x3, z legendą kolorów maski
    shots = os.path.join(src, 'shots')
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from maski import CZESCI
    names = {'kontur': 'kontur', 'wlosy': 'włosy', 'kontur_wlosow': 'kontur włosów', 'skora': 'skóra', 'stopy': 'stopy (bose)',
             'kontur_stop': 'kontur stóp', 'koszula': 'koszula', 'kontur_koszuli': 'kontur koszuli', 'spodnie': 'spodnie', 'pas': 'pas (sznurek)',
             'narzedzie': 'narzędzie', 'twarz': 'oczy, usta', 'inne': 'inne'}
    picks = [('Hero_Walk', 64, 0, 3), ('Hero_Walk', 64, 6, 3), ('Hero_Walk', 64, 4, 0), ('Hero_Axe', 96, 0, 7), ('Hero_Axe', 96, 3, 14),
             ('Hero_AxeSide', 96, 2, 10)]
    Z, C = 3, 96
    rows = [('oryginał', 'bez'), ('maska', None), ('ubrany', 'wszystko')]
    left, top, gap = 120, 50, 6
    W = left + len(picks) * (C * Z + gap)
    H = top + len(rows) * (C * Z + gap) + 40 + 22 * ((len(CZESCI) + 3) // 4)
    img = Image.new('RGB', (W, H), (24, 22, 20))
    d = ImageDraw.Draw(img)
    fb, fs = font(19, True), font(16)
    d.text((10, 8), 'Maska części ciała: każdy piksel postaci ma swoją część (tools/ubior/maski.py)', font=font(22, True), fill=(250, 220, 90))
    for j, (name, cell, r, c) in enumerate(picks):
        x = left + j * (C * Z + gap)
        for i, (label, key) in enumerate(rows):
            y = top + i * (C * Z + gap)
            if j == 0:
                d.text((10, y + C * Z // 2 - 10), label, font=fb, fill=(250, 220, 90))
            path = os.path.join(GAME, 'img', 'system', 'Ubior_Maska_%s.png' % name) if key is None else os.path.join(shots, meta['sheets'][key + '/' + name])
            sheet = Image.open(path).convert('RGBA')
            tile = Image.new('RGBA', (C, C), (66, 100, 62, 255))
            off = (C - cell) // 2
            tile.alpha_composite(sheet.crop((c * cell, r * cell, (c + 1) * cell, (r + 1) * cell)), (off, C - cell))
            img.paste(tile.resize((C * Z, C * Z), Image.NEAREST).convert('RGB'), (x, y))
        d.text((x + 4, top + len(rows) * (C * Z + gap) - 2), '%s  wiersz %d, klatka %d' % (name, r, c), font=fs, fill=(200, 200, 200))
    y0 = top + len(rows) * (C * Z + gap) + 24
    for k, (code, n, col) in enumerate(CZESCI):
        x, y = 10 + (k % 4) * 300, y0 + (k // 4) * 22
        d.rectangle([x, y + 2, x + 16, y + 18], fill=col, outline=(120, 120, 120))
        d.text((x + 24, y), names.get(n, n), font=fs, fill=(235, 235, 235))
    out = os.path.join(DOCS, 'maska_przyklad.png')
    img.save(out, optimize=True)
    return out, img.size


def main(argv):
    src = argv[0] if argv else os.path.join(GAME, 'tests', 'ubior_proba')
    meta = json.load(open(os.path.join(src, 'meta.json'), encoding='utf-8'))
    os.makedirs(DOCS, exist_ok=True)
    for f in (grid, sheets, closeup, masks):
        out, size = f(src, meta)
        print('->', os.path.relpath(out, GAME).replace('\\', '/'), '%dx%d' % size)


if __name__ == '__main__':
    main(sys.argv[1:])
