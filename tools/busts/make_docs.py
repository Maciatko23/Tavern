# Preview sheets for the busts (docs/postacie):
#  popiersia_wszystkie.png - each talking character's map sprite (standing, facing down, x3) beside its bust (x0.5)
#  popiersie_bohater.png / popiersie_dziadek.png - before / after at x1 and x3 crops of the painted details
# Run after make_hero.py and make_stach.py: python tools/busts/make_docs.py
import os
from PIL import Image, ImageDraw, ImageFont
from bustlib import ROOT, PICS

DOCS = os.path.join(ROOT, 'docs', 'postacie')
CHARS = os.path.join(ROOT, 'img', 'characters')
FONT = os.path.join(ROOT, 'fonts', 'AlegreyaSans-Medium.ttf')
f_big = ImageFont.truetype(FONT, 22); f_small = ImageFont.truetype(FONT, 16)
BG, PANEL, LINE, ACC, TXT, DIM, BAD = (0, 0, 0), (17, 18, 22), (58, 62, 70), (255, 210, 63), (236, 238, 240), (150, 154, 162), (255, 110, 90)


def frame(sheet, index=0, pattern=1, row=0):
    """Standing frame facing down, like the engine picks it ($ = one character, else 4x2 blocks of 3x4)."""
    im = Image.open(os.path.join(CHARS, sheet + '.png')).convert('RGBA')
    if sheet.startswith('Hero_'):
        return im.crop((0, 0, 64, 64))
    single = os.path.basename(sheet).lstrip('!').startswith('$')
    bw, bh = (im.width, im.height) if single else (im.width // 4, im.height // 2)
    fw, fh = bw // 3, bh // 4
    bx, by = (0, 0) if single else ((index % 4) * bw, (index // 4) * bh)
    return im.crop((bx + pattern * fw, by + row * fh, bx + (pattern + 1) * fw, by + (row + 1) * fh))


# name, map sprite (sheet, index), bust picture, how the bust is found, notes (checked by eye)
ROWS = [
    ('Borgar Kowal', ('People3_Tall', 4), 'People3_5', 'People3_Tall:4 -> People3_5',
     [('ok', 'siwe włosy i zarost, złoto-fioletowy strój - zgodne')]),
    ('Melia Srebrogłosa', ('People2_Tall', 7), 'People2_8', 'People2_Tall:7 -> People2_8',
     [('ok', 'różowo-rude włosy, gogle na głowie - zgodne')]),
    ('Grum Żelazna Pięść', ('Actor2_Tall', 4), 'Actor2_5', 'Actor2_Tall:4 -> Actor2_5',
     [('ok', 'zielone włosy, czerwona chusta - zgodne')]),
    ('Dziadek Ozzy', ('People2_Tall', 0), 'People2_1', 'People2_Tall:0 -> People2_1',
     [('ok', 'siwy starzec w okularach, biała szata - zgodne')]),
    ('Lord Leopold Zaleski', ('People2_Tall', 4), 'People2_5', 'People2_Tall:4 -> People2_5',
     [('ok', 'wąsy, fioletowy żabot, futro - zgodne')]),
    ('Dziadek Stach', ('$Npc_Dziadek', 0), 'Stach_Bust', 'nadpisanie $Npc_Dziadek:0 -> Stach_Bust',
     [('ok', 'brązowa czapka, siwa broda, brązowy płaszcz z łatami'),
      ('~', 'na mapie czapka z daszkiem, na popiersiu bez daszka')]),
    ('Bohater', ('Hero_Walk', 0), 'Hero_Bust', 'HeroLook -> Hero_Bust',
     [('ok', 'czarne włosy, ciemne oczy, szara lniana koszula, łaty, strzępy, brud'),
      ('~', 'na mapie bez kamizelki, włosy bardziej rozczochrane i skóra ciemniejsza (wersja A tak ma)')]),
]


def sheet_all():
    cw, ch = 590, 250
    cols = 2
    rows = (len(ROWS) + cols - 1) // cols
    img = Image.new('RGB', (cols * cw + 20, rows * ch + 70), BG)
    d = ImageDraw.Draw(img)
    d.text((20, 18), 'Kto ma które popiersie - postać na mapie (x3) i jej popiersie (x0.5)', font=f_big, fill=ACC)
    for k, (name, (sh, idx), bust, rule, notes) in enumerate(ROWS):
        x0 = 10 + (k % cols) * cw; y0 = 60 + (k // cols) * ch
        d.rectangle((x0 + 4, y0 + 4, x0 + cw - 8, y0 + ch - 8), fill=PANEL, outline=LINE)
        fr = frame(sh, idx)
        fr = fr.resize((fr.width * 3, fr.height * 3), Image.NEAREST)
        sx = x0 + 14 + (150 - fr.width) // 2
        img.paste(fr, (sx, y0 + 44 + max(0, 174 - fr.height)), fr)
        b = Image.open(os.path.join(PICS, bust + '.png')).convert('RGBA').resize((165, 175), Image.LANCZOS)
        img.paste(b, (x0 + 180, y0 + 40), b)
        d.text((x0 + 14, y0 + 10), name, font=f_big, fill=TXT)
        tx = x0 + 364
        d.text((tx, y0 + 44), bust, font=f_small, fill=ACC)
        ty = y0 + 70
        d.text((x0 + 354, ty), rule.replace(' -> ', '\n-> '), font=f_small, fill=DIM); ty += 48
        for tag, txt in notes:
            col = (120, 200, 120) if tag == 'ok' else ACC if tag == '~' else BAD
            words, line, lines = txt.split(), '', []
            for w in words:
                t = (line + ' ' + w).strip()
                if d.textlength(t, font=f_small) > 196 and line:
                    lines.append(line); line = w
                else:
                    line = t
            lines.append(line)
            d.text((x0 + 354, ty), ('✓ ' if tag == 'ok' else '! ') + '\n'.join(lines), font=f_small, fill=col)
            ty += 20 * len(lines) + 6
    img.save(os.path.join(DOCS, 'popiersia_wszystkie.png'))


def before_after(title, before, after, crops, out):
    """before / after at x1, then x3 crops (box, label) of the painted details."""
    A = Image.open(os.path.join(PICS, after + '.png')).convert('RGBA')
    B = before if isinstance(before, Image.Image) else Image.open(os.path.join(PICS, before + '.png')).convert('RGBA')
    zs = [(A.crop(b).resize(((b[2] - b[0]) * 3, (b[3] - b[1]) * 3), Image.NEAREST), lab) for b, lab in crops]
    probe = ImageDraw.Draw(Image.new('RGB', (1, 1)))
    cellw = [max(z.width, int(probe.textlength(lab + ' (x3)', font=f_small))) for z, lab in zs]
    W = max(720, sum(cellw) + 20 * (len(zs) + 1), int(probe.textlength(title, font=f_big)) + 40)
    Hh = 60 + 360 + 40 + max(z.height for z, _ in zs) + 40
    img = Image.new('RGB', (W, Hh), (60, 62, 68))
    d = ImageDraw.Draw(img)
    d.text((20, 16), title, font=f_big, fill=ACC)
    for i, (im, lab) in enumerate(((B, 'przed'), (A, 'po'))):
        x = 20 + i * 350
        img.paste(im, (x, 60), im)
        d.text((x, 60 + 352), lab, font=f_small, fill=TXT)
    x = 20; y = 60 + 360 + 40
    for (z, lab), cw in zip(zs, cellw):
        img.paste(z, (x, y), z)
        d.text((x, y - 22), lab + ' (x3)', font=f_small, fill=TXT)
        x += cw + 20
    img.save(os.path.join(DOCS, out))


if __name__ == '__main__':
    import numpy as np
    sheet_all()
    # hero "before" = option A exactly as the user saw it (People1_3 recoloured, no wear)
    import runpy, sys
    tmp = os.path.join(os.environ.get('TEMP', '.'), '_hero_tmp.png')
    sys.argv = ['x', tmp]
    g = runpy.run_path(os.path.join(os.path.dirname(__file__), 'make_hero.py'), run_name='docs')
    os.remove(tmp)
    from bustlib import to_img
    before_after('Popiersie bohatera: wersja A -> biedny chłopak (łaty, strzępy, dziury, brud)', to_img(g['base_a']),
                 'Hero_Bust', [((135, 165, 235, 245), 'postrzępiony dekolt'), ((238, 188, 292, 240), 'łata na ramieniu'),
                               ((30, 222, 125, 300), 'łata, dziura, strzępy'), ((114, 308, 152, 338), 'dziura w rękawie'),
                               ((170, 130, 206, 160), 'brud na policzku')], 'popiersie_bohater.png')
    before_after('Popiersie dziadka Stacha: People1_7 -> brązowa czapka, siwa broda, łatany płaszcz', 'People1_7',
                 'Stach_Bust', [((84, 140, 200, 275), 'broda i wąsy'), ((212, 226, 262, 272), 'łata'),
                                ((44, 262, 90, 306), 'ciemna łata')], 'popiersie_dziadek.png')
    print('ok')
