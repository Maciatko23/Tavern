# tools/ubior/przeglad_masek.py - przegląd masek wszystkich arkuszy bohatera z wyników tests/ubior_maski_test.js:
#   docs/ekwipunek/maski/<arkusz>.png   każdy wiersz arkusza: oryginał / maska / strój A / B / C (A, B z kapeluszem: żółta kropka
#                                       w rogu klatki = kapelusz schowany - leży, przewrót; czerwona = problem z kapeluszem)
#   docs/ekwipunek/maski/PRZEGLAD.md    tabela: arkusz, klatki, ręczne poprawki, kapelusz schowany, problemy, czas składania
#   python tools/ubior/przeglad_masek.py tests/ubior_maski
import sys, os, json
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from maski import ARKUSZE, POPRAWKI, CZESCI

GAME = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
OUTDIR = os.path.join(GAME, 'docs', 'ekwipunek', 'maski')
NAMES = {'kontur': 'kontur', 'wlosy': 'włosy', 'kontur_wlosow': 'kontur włosów', 'skora': 'skóra (ręce, kolana)', 'stopy': 'stopy',
         'kontur_stop': 'kontur stóp', 'koszula': 'koszula', 'kontur_koszuli': 'kontur koszuli', 'spodnie': 'spodnie', 'pas': 'pas',
         'narzedzie': 'narzędzie / broń', 'oczy_usta': 'oczy, usta', 'inne': 'inne (iskry, grudki)', 'dlonie': 'dłonie', 'twarz_szyja': 'twarz i szyja'}


def font(size, bold=False):
    for f in (('arialbd.ttf' if bold else 'arial.ttf'), 'calibri.ttf'):
        p = os.path.join(os.environ.get('WINDIR', r'C:\Windows'), 'Fonts', f)
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def ranges(nums):
    nums = sorted(set(nums))
    out, i = [], 0
    while i < len(nums):
        j = i
        while j + 1 < len(nums) and nums[j + 1] == nums[j] + 1:
            j += 1
        out.append(str(nums[i]) if i == j else '%d-%d' % (nums[i], nums[j]))
        i = j + 1
    return ','.join(out)


def sheet_review(name, meta, src_dir):
    a = ARKUSZE[name]
    cell = a['cell']
    Z = 2 if cell == 64 else 1
    orig = Image.open(os.path.join(GAME, 'img', a['folder'], name + '.png')).convert('RGBA')
    mask = Image.open(os.path.join(GAME, 'img', 'system', 'Ubior_Maska_%s.png' % name)).convert('RGBA')
    dressed = {k: Image.open(os.path.join(src_dir, 'shots', f)).convert('RGBA') for k, f in meta['sheets'].get(name, {}).items()}
    W, H = orig.size
    rows = H // cell
    bands = [('oryginał', orig), ('maska', mask)] + [(k, dressed[k]) for k in ('A', 'B', 'C') if k in dressed]
    left, head = 150, 40
    img = Image.new('RGBA', (left + W * Z, head + rows * (len(bands) * cell * Z + 10) + 70), (24, 22, 20, 255))
    d = ImageDraw.Draw(img)
    fb, fs = font(18, True), font(13)
    fixes = sum(1 for p in POPRAWKI if p[0] == name)
    d.text((8, 8), '%s - %d wierszy x %d klatek %dx%d (x%d) · poprawek ręcznych: %d' % (name, rows, W // cell, cell, cell, Z, fixes), font=fb, fill=(250, 220, 90, 255))
    probs = meta['problems'].get(name) or {'list': []}
    off = {(p['c'], p['r']) for p in probs['list'] if p.get('off')}
    bad = {(p['c'], p['r']) for p in probs['list'] if not p.get('note')}
    y = head
    for r in range(rows):
        for bi, (label, im) in enumerate(bands):
            strip = Image.new('RGBA', (W, cell), (66, 100, 62, 255))
            strip.alpha_composite(im.crop((0, r * cell, W, (r + 1) * cell)))
            strip = strip.resize((W * Z, cell * Z), Image.NEAREST)
            img.paste(strip, (left, y))
            txt = ('wiersz %d (%s)  ' % (r, a['rows'][r] if r < len(a['rows']) else '?') if bi == 0 else '') + label
            d.text((8, y + 4), txt, font=fs, fill=(235, 235, 235, 255))
            if label in ('A', 'B'):
                for c in range(W // cell):
                    if (c, r) in off:
                        d.ellipse([left + c * cell * Z + 3, y + 3, left + c * cell * Z + 9, y + 9], fill=(250, 220, 60, 255))
                    if (c, r) in bad:
                        d.ellipse([left + c * cell * Z + 12, y + 3, left + c * cell * Z + 18, y + 9], fill=(230, 40, 40, 255))
            y += cell * Z
        y += 10
    # legend
    x = 8
    for k, n, col in CZESCI:
        d.rectangle([x, y + 6, x + 12, y + 18], fill=col + (255,), outline=(120, 120, 120, 255))
        d.text((x + 16, y + 4), NAMES.get(n, n), font=fs, fill=(220, 220, 220, 255))
        x += 22 + int(d.textlength(NAMES.get(n, n), font=fs)) + 14
        if x > img.width - 200:
            x = 8
            y += 22
    for lab in meta['outfits']:
        y += 22 if x == 8 else 0
        d.text((x, y + 4), '%s: %s' % (lab['key'], lab['label']), font=fs, fill=(250, 220, 90, 255))
        x += int(d.textlength('%s: %s' % (lab['key'], lab['label']), font=fs)) + 20
    img = img.crop((0, 0, img.width, min(img.height, y + 40)))
    out = os.path.join(OUTDIR, name + '.png')
    img.convert('RGB').save(out, optimize=True)
    return out, sorted(off), sorted(bad), probs


def main(argv):
    src = argv[0] if argv else os.path.join(GAME, 'tests', 'ubior_maski')
    meta = json.load(open(os.path.join(src, 'meta.json'), encoding='utf-8'))
    os.makedirs(OUTDIR, exist_ok=True)
    lines = ['# Maski części ciała - przegląd wszystkich arkuszy bohatera', '',
             'Z `tests/ubior_maski_test.js` (`tools/ubior/przeglad_masek.py`). Obrazki: `<arkusz>.png` w tym katalogu - każdy wiersz arkusza:',
             'oryginał / maska / A / B / C. A: czerwony kaftan + łapcie + kapelusz, B: lniana koszula + łapcie + kapelusz, C: niebieskie',
             'spodnie + skórzany pas + szare rękawice. Żółta kropka: kapelusz schowany (głowa nie nad ciałem - leży, przewrót), czerwona:',
             'problem z kapeluszem.', '',
             '| arkusz | klatki | poprawki ręczne | kapelusz schowany | problemy kapelusza | składanie (ms) |', '|---|---:|---:|---|---|---:|']
    detail = []
    for name in ARKUSZE:
        if name not in meta['sheets']:
            lines.append('| %s | - | - | - | brak wyników | - |' % name)
            continue
        out, off, bad, probs = sheet_review(name, meta, src)
        a = ARKUSZE[name]
        im = Image.open(os.path.join(GAME, 'img', a['folder'], name + '.png'))
        frames = (im.width // a['cell']) * (im.height // a['cell'])
        fixes = sum(1 for p in POPRAWKI if p[0] == name)
        byrow = {}
        for c, r in off:
            byrow.setdefault(r, []).append(c)
        offtxt = '; '.join('w%d: %s' % (r, ranges(cs)) for r, cs in sorted(byrow.items())) or '-'
        ms = meta.get('ms', {}).get(name, {})
        lines.append('| %s | %d | %d | %s | %s | %s |' % (name, frames, fixes, offtxt, len(bad) if bad else '0', ('%.1f-%.1f' % (ms['min'], ms['max'])) if ms else '-'))
        notes = [p for p in probs['list'] if not p.get('off')]
        if notes:
            detail.append('- **%s**: ' % name + '; '.join('w%d k%d: %s' % (p['r'], p['c'], p['what']) for p in notes))
        print('->', os.path.relpath(out, GAME).replace('\\', '/'))
    lines += ['', '## Uwagi i problemy kapelusza (poza schowanymi)', ''] + (detail or ['- brak'])
    p = os.path.join(OUTDIR, 'PRZEGLAD.md')
    open(p, 'w', encoding='utf-8', newline='\n').write('\n'.join(lines) + '\n')
    print('->', os.path.relpath(p, GAME).replace('\\', '/'))


if __name__ == '__main__':
    main(sys.argv[1:])
