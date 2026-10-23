# tools/ubior/zloz_bron.py - obrazki broni, hełmów, zbroi i tarcz z wyników tests/ubior_bron_test.js:
#   docs/ekwipunek/bron_wrecz.png       zamach pałką: sztylet, buzdygan, kiścień, kostur, młot, pałka; zamach mieczem (Hero_Sword, 2026-10-23):
#                                       miecze, długie miecze, tasak, szabla (materiały)
#   docs/ekwipunek/bron_topory.png      zamach siekierą: siekiera, topór, czekan, bardysz
#   docs/ekwipunek/bron_drzewcowe.png   włócznia, rohatyna, sulica (pchnięcie), kilof i młot (kilof), sztylet w pięści
#   docs/ekwipunek/bron_dystans.png     łuki, proce (materiały)
#   docs/ekwipunek/helmy_1.png, helmy_2.png   każdy hełm w chodzie, biegu, pracy, walce, siedząc, leżąc, w przewrocie, na orle
#   docs/ekwipunek/helmy_w_grze.png     zrzuty z mapy (duszek nad głową), popiersia, karta postaci
#   docs/ekwipunek/zbroje_tors.png, zbroje_rece_nogi.png, zbroje_tarcze.png
#   python tools/ubior/zloz_bron.py tests/ubior_bron
import sys, os, json
from PIL import Image, ImageDraw, ImageFont

GAME = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
DOCS = os.path.join(GAME, 'docs', 'ekwipunek')
BG = (66, 100, 62)
FRAMES = ['dół: zamach', 'dół: cios', 'dół: po ciosie', 'bok: zamach', 'bok: cios', 'bok: po ciosie']


def font(size, bold=False):
    for f in (('arialbd.ttf' if bold else 'arial.ttf'), 'calibri.ttf'):
        p = os.path.join(os.environ.get('WINDIR', r'C:\Windows'), 'Fonts', f)
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def grid(rows, cols, title, out, cw=96, ch=108, Z=2, left=260):
    """rows: [(label, sub, [file|None...])]; each file drawn bottom-centred in a cw x ch cell, x Z"""
    head = 70
    W = left + len(cols) * (cw * Z + 4)
    H = head + len(rows) * (ch * Z + 4) + 10
    img = Image.new('RGB', (W, H), (24, 22, 20))
    d = ImageDraw.Draw(img)
    fb, fs, ft = font(18, True), font(14), font(24, True)
    d.text((10, 8), title, font=ft, fill=(250, 220, 90))
    for j, c in enumerate(cols):
        d.text((left + j * (cw * Z + 4) + 4, 44), c, font=fs, fill=(235, 235, 235))
    for i, (label, sub, files) in enumerate(rows):
        y = head + i * (ch * Z + 4)
        d.text((10, y + ch * Z // 2 - 20), label, font=fb, fill=(250, 220, 90))
        if sub:
            d.text((10, y + ch * Z // 2 + 4), sub, font=fs, fill=(190, 190, 190))
        for j, f in enumerate(files):
            if not f or not os.path.exists(f):
                continue
            im = Image.open(f).convert('RGBA')
            cell = Image.new('RGBA', (cw, ch), BG + (255,))
            cell.alpha_composite(im, ((cw - im.width) // 2, ch - im.height))
            img.paste(cell.convert('RGB').resize((cw * Z, ch * Z), Image.NEAREST), (left + j * (cw * Z + 4), y))
    img.save(out, optimize=True)
    print('->', os.path.relpath(out, GAME).replace('\\', '/'), img.size)


def main(argv):
    src = argv[0] if argv else os.path.join(GAME, 'tests', 'ubior_bron')
    shots = os.path.join(src, 'shots')
    meta = json.load(open(os.path.join(src, 'meta.json'), encoding='utf-8'))
    P = lambda f: os.path.join(shots, f) if f else None
    # the weapons, by their swing
    groups = [('bron_wrecz', ['Hero_Club', 'Hero_Sword'], 'Broń na zamachu pałką i mieczem (nowe rodzaje na osi starej broni, materiały)'),
              ('bron_topory', ['Hero_Axe', 'Hero_AxeSide'], 'Broń na zamachu siekierą'),
              ('bron_drzewcowe', ['Hero_Spear', 'Hero_Pick', 'Hero_Punch'], 'Pchnięcie (włócznie), kilof / młot, sztylet w pięści'),
              ('bron_dystans', ['Hero_Bow', 'Hero_Sling'], 'Łuki i proce (materiały)')]
    for name, sheets, title in groups:
        rows = []
        for w in meta['bron']:
            if w['sheet'] not in sheets:
                continue
            sub = '%s, %s%s' % (w['rodzaj'], w['material'], ' (zwykły arkusz)' if w['own'] else '')
            rows.append((w['key'].replace('bron_', ''), sub, [P(f) for f in w['files']]))
        if rows:
            grid(rows, FRAMES, title, os.path.join(DOCS, name + '.png'))
    # the helmets, in two halves
    hv = meta['helmViews'] + ['na orle']
    hs = meta['helmy']
    half = (len(hs) + 1) // 2
    for i, part in enumerate((hs[:half], hs[half:])):
        rows = [(h['key'].replace('helm_', ''), None, [P(f) for f in h['files']]) for h in part]
        grid(rows, hv, 'Hełmy, kaptury, czepce - z tym, co wystaje nad klatkę (część %d)' % (i + 1), os.path.join(DOCS, 'helmy_%d.png' % (i + 1)), Z=2, left=200)
    # in the game: the map's shots, the busts, the card
    rows = [('mapa', 'zrzuty z ekranu', [P(s['file']) for s in meta['shots']['mapa']])]
    grid(rows, [s['label'] for s in meta['shots']['mapa']], 'Hełm na mapie (duszek nad głową), pełna zbroja zakonna', os.path.join(DOCS, 'helmy_w_grze.png'), cw=96, ch=104)
    rows = [('popiersie', None, [P(b['file']) for b in meta['busts']])]
    grid(rows, [b['key'].replace('helm_', '') for b in meta['busts']], 'Hełmy na popiersiu w rozmowach', os.path.join(DOCS, 'helmy_popiersie.png'), cw=330, ch=350, Z=1, left=120)
    if os.path.exists(P('karta_figura.png')):
        im = Image.open(P('karta_figura.png'))
        grid([('karta', 'menu P -> Ekwipunek', [P('karta_figura.png')])], ['nosal stalowy, kolczuga, karwasze, nagolenniki, buty okute'],
             'Karta postaci: figura z koroną hełmu nad klatką', os.path.join(DOCS, 'helmy_karta.png'), cw=im.width, ch=im.height, Z=1, left=120)
    # the armour
    av = meta['armourViews']
    tors = [z for z in meta['zbroje'] if z['miejsce'] == 'tors']
    rest = [z for z in meta['zbroje'] if z['miejsce'] != 'tors']
    grid([(z['key'].replace('zbroja_', ''), None, [P(f) for f in z['files']]) for z in tors], av, 'Zbroje na koszuli (faktura w kolorach materiału)',
         os.path.join(DOCS, 'zbroje_tors.png'), left=230)
    grid([(z['key'], z['miejsce'], [P(f) for f in z['files']]) for z in rest], av, 'Karwasze, nagolenniki, buty okute', os.path.join(DOCS, 'zbroje_rece_nogi.png'), left=230)
    rows = [(t['key'].replace('tarcza_', ''), None, [P(f) for f in t['files']]) for t in meta['tarcze']]
    grid(rows, ['z przodu', 'z boku'], 'Tarcze (w gardzie: zamiast ikony)', os.path.join(DOCS, 'zbroje_tarcze.png'), cw=48, ch=48, Z=4, left=230)
    if meta['shots'].get('tarcza'):
        grid([('w gardzie', 'zrzuty z mapy', [P(s['file']) for s in meta['shots']['tarcza']])], [s['label'] for s in meta['shots']['tarcza']],
             'Tarcza w gardzie na mapie', os.path.join(DOCS, 'zbroje_tarcze_w_grze.png'), cw=96, ch=104)


if __name__ == '__main__':
    main(sys.argv[1:])
