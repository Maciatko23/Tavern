# tools/ubior/popiersie.py - ubiór na popiersiu bohatera w rozmowach (img/pictures/Hero_Bust.png, 330x350, malowane - nie pixel art):
#   img/system/Ubior_Maska_Hero_Bust.png   maska części (te same kolory co tools/ubior/maski.py): włosy, twarz i szyja, dłonie,
#                                          koszula (kurtka i koszula pod nią razem - gra przemalowuje je płynnie po jasności)
#   img/system/Ubior_Bust_Kapelusz.png     słomkowy kapelusz (kolory własne; ciemny wariant gra przemalowuje rampą)
#   img/system/Ubior_Bust_Czapka.png       filcowa czapka (szablon w szarościach - kolor z rampy wzoru)
#   img/system/Ubior_Bust_Chusta.png       chusta (szablon; kształt = górna część włosów z maski + węzeł z tyłu głowy)
#   img/system/Ubior_Bust_Opaska.png       opaska na czole (szablon)
# Rysowane kodem w 4x większej skali i zmniejszane (gładkie brzegi jak na malowanym portrecie), ciemny obrys, światło z lewej góry,
# półprzezroczysty cień pod rondem / brzegiem na twarzy.
#   python tools/ubior/popiersie.py [--podglad PLIK]
import sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from maski import KOD, KOLOR, hsv

GAME = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
SRC = os.path.join(GAME, 'img', 'pictures', 'Hero_Bust.png')
SS = 4   # nadpróbkowanie


def mask():
    a = np.array(Image.open(SRC).convert('RGBA'))
    H, W = a.shape[:2]
    rgb = a[:, :, :3].astype(float) / 255
    h, s, v = hsv(rgb)
    op = a[:, :, 3] > 40
    YY, XX = np.mgrid[0:H, 0:W]
    warm = (h <= 45) | (h >= 330)
    skin = op & warm & (s >= 0.12) & (s <= 0.70) & (v >= 0.50)
    r, g, b = a[:, :, 0].astype(int), a[:, :, 1].astype(int), a[:, :, 2].astype(int)
    head_zone = (YY < 200) & (XX > 75) & (XX < 262)
    hair = op & head_zone & ~skin & (v < 0.42) & (b >= r - 6)
    hair |= op & head_zone & (YY < 150) & ~skin & (v < 0.30)          # (cienie i obrysy włosów nad brodą)
    hair &= YY < 235
    lab = np.zeros((H, W), np.uint8)
    lab[op] = KOD['koszula']
    lab[op & (YY < 168) & ~hair] = KOD['twarz_szyja']                  # (nad kołnierzem: twarz, ucho, obrys twarzy)
    lab[skin & (YY < 290)] = KOD['twarz_szyja']
    lab[skin & (YY >= 280)] = KOD['dlonie']
    lab[hair] = KOD['wlosy']
    lab[op & (v < 0.10) & (YY >= 168)] = KOD['kontur']                  # (czarne obrysy ubrania zostają czarne)
    img = np.zeros((H, W, 4), np.uint8)
    for k, c in KOLOR.items():
        sel = lab == k
        img[sel, :3] = c
        img[sel, 3] = 255
    return Image.fromarray(img, 'RGBA'), lab


def shade(img, ramp_dark_light, base_mask, light_dir=(-0.6, -0.8)):
    """gładkie cieniowanie maski (SS) od jasnego z lewej góry do ciemnego"""
    H, W = base_mask.shape
    ys, xs = np.nonzero(base_mask)
    if not len(ys):
        return
    cx, cy = xs.mean(), ys.mean()
    rx, ry = max(1, xs.max() - xs.min()), max(1, ys.max() - ys.min())
    t = 0.55 - 0.45 * (((xs - cx) / rx) * light_dir[0] * -1 + ((ys - cy) / ry) * light_dir[1] * -1)
    t = np.clip(t, 0, 1)
    lo, hi = np.array(ramp_dark_light[0], float), np.array(ramp_dark_light[1], float)
    col = lo[None, :] + (hi - lo)[None, :] * t[:, None]
    img[ys, xs, :3] = col.astype(np.uint8)
    img[ys, xs, 3] = 255


def finish(big, outline=(26, 22, 20), width=2):
    """obrys dookoła kształtu i zmniejszenie z nadpróbkowania"""
    im = Image.fromarray(big, 'RGBA')
    a = im.split()[3]
    grown = a.filter(ImageFilter.MaxFilter(width * 2 + 1))
    out = Image.new('RGBA', im.size, outline + (0,))
    out.putalpha(grown)
    out.alpha_composite(im)
    return out.resize((im.width // SS, im.height // SS), Image.LANCZOS)


def ellipse_mask(W, H, box):
    m = Image.new('L', (W, H), 0)
    ImageDraw.Draw(m).ellipse(box, fill=255)
    return np.array(m) > 127


def kapelusz(W, H):
    S = SS
    big = np.zeros((H * S, W * S, 4), np.uint8)
    # rondo: elipsa, środek (170, 74), 270 x 64
    brim = ellipse_mask(W * S, H * S, [(170 - 138) * S, (74 - 30) * S, (170 + 138) * S, (74 + 30) * S])
    crown = ellipse_mask(W * S, H * S, [(170 - 74) * S, 2 * S, (170 + 74) * S, 120 * S]) & (np.mgrid[0:H * S, 0:W * S][0] < 76 * S)
    shade(big, ((176, 132, 62), (246, 220, 146)), brim)
    # splot słomy: koncentryczne pierścienie na rondzie
    YY, XX = np.mgrid[0:H * S, 0:W * S]
    rr = np.sqrt(((XX - 170 * S) / (138 * S)) ** 2 + ((YY - 74 * S) / (30 * S)) ** 2)
    rings = brim & ((rr * 16).astype(int) % 2 == 0)
    big[rings, :3] = (big[rings, :3] * 0.9).astype(np.uint8)
    # przód ronda (dolna połowa) jaśniejsza krawędź, spód w cieniu
    front = brim & (YY > 74 * S)
    big[front, :3] = np.clip(big[front, :3].astype(int) - 10, 0, 255).astype(np.uint8)
    # główka
    shade(big, ((168, 126, 58), (240, 212, 138)), crown)
    weave = crown & (((XX // (3 * S)) + (YY // (3 * S))) % 2 == 0)
    big[weave, :3] = (big[weave, :3] * 0.92).astype(np.uint8)
    # wstążka u dołu główki
    band = crown & (YY > 58 * S) & (YY < 74 * S)
    shade(big, ((70, 36, 22), (130, 72, 42)), band)
    # krawędź ronda przed główką (rondo zachodzi na główkę z przodu)
    lip = brim & ~ellipse_mask(W * S, H * S, [(170 - 136) * S, (74 - 26) * S, (170 + 136) * S, (74 + 26) * S]) & (YY > 74 * S)
    big[lip, :3] = (150, 108, 50)
    out = finish(big)
    # cień ronda na twarzy: półprzezroczysty pas pod przednią krawędzią
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse([170 - 120, 74 + 8, 170 + 120, 74 + 44], fill=(20, 12, 8, 70))
    sh = sh.filter(ImageFilter.GaussianBlur(5))
    res = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    res.alpha_composite(sh)
    res.alpha_composite(out)
    return res


def czapka(W, H):
    """miękka filcowa czapka: zaokrąglona, lekko opadająca na prawy bok, wywinięty brzeg"""
    S = SS
    big = np.zeros((H * S, W * S, 4), np.uint8)
    YY, XX = np.mgrid[0:H * S, 0:W * S]
    crown = ellipse_mask(W * S, H * S, [86 * S, 6 * S, 250 * S, 150 * S]) | ellipse_mask(W * S, H * S, [150 * S, 18 * S, 272 * S, 104 * S])
    crown &= YY < 76 * S
    shade(big, ((64, 64, 64), (206, 206, 206)), crown)
    # fałdy filcu: dwa miękkie łuki
    for cx, cy, rx, ry in ((200, 46, 60, 26), (150, 30, 50, 22)):
        arc = ellipse_mask(W * S, H * S, [(cx - rx) * S, (cy - ry) * S, (cx + rx) * S, (cy + ry) * S]) & ~ellipse_mask(W * S, H * S, [(cx - rx + 3) * S, (cy - ry + 3) * S, (cx + rx - 3) * S, (cy + ry - 3) * S])
        arc &= crown & (YY > cy * S)
        big[arc, :3] = (big[arc, :3] * 0.82).astype(np.uint8)
    roll = ellipse_mask(W * S, H * S, [(172 - 94) * S, 56 * S, (172 + 98) * S, 98 * S]) & (YY > 64 * S) & (YY < 90 * S)
    shade(big, ((86, 86, 86), (190, 190, 190)), roll)
    big[roll & (YY < 68 * S), :3] = (212, 212, 212)
    out = finish(big)
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse([172 - 86, 84, 172 + 86, 106], fill=(20, 12, 8, 60))
    sh = sh.filter(ImageFilter.GaussianBlur(4))
    res = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    res.alpha_composite(sh)
    res.alpha_composite(out)
    return res


def chusta(W, H, lab):
    S = SS
    hair = Image.fromarray(((lab == KOD['wlosy']) * 255).astype(np.uint8), 'L')
    top = np.array(hair) > 0
    YY, XX = np.mgrid[0:H, 0:W]
    edge_y = 86 + 10 * np.abs((XX - 170) / 80.0) ** 2        # (brzeg chusty: łuk nad czołem, niżej po bokach)
    skull = np.array(Image.fromarray(np.zeros((H, W), np.uint8)))
    sk = Image.new('L', (W, H), 0)
    ImageDraw.Draw(sk).ellipse([92, 4, 252, 190], fill=255)
    cloth = ((np.array(sk) > 127) | top) & (YY < edge_y) & (XX > 88) & (XX < 256)
    cl = Image.fromarray((cloth * 255).astype(np.uint8), 'L').resize((W * S, H * S), Image.BILINEAR)
    cl = cl.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(2))
    m = np.array(cl) > 110
    big = np.zeros((H * S, W * S, 4), np.uint8)
    shade(big, ((90, 90, 90), (222, 222, 222)), m)
    # fałdy: kilka łuków ciemniejszych
    BY, BX = np.mgrid[0:H * S, 0:W * S]
    folds = m & ((np.sin((BX / S - 170) / 9.0 + (BY / S) / 14.0) > 0.86))
    big[folds, :3] = (big[folds, :3] * 0.84).astype(np.uint8)
    # obszyty brzeg (dolny pas jaśniejszy)
    hem = m & ~(np.array(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(9))) > 127) & (BY > 60 * S)
    big[hem, :3] = np.clip(big[hem, :3].astype(int) + 18, 0, 255).astype(np.uint8)
    # węzeł z tyłu głowy (po prawej) i dwa końce
    knot = ellipse_mask(W * S, H * S, [236 * S, 70 * S, 262 * S, 94 * S])
    tail1 = Image.new('L', (W * S, H * S), 0)
    d = ImageDraw.Draw(tail1)
    d.polygon([(246 * S, 88 * S), (262 * S, 92 * S), (276 * S, 138 * S), (258 * S, 136 * S)], fill=255)
    d.polygon([(240 * S, 90 * S), (252 * S, 94 * S), (250 * S, 132 * S), (236 * S, 128 * S)], fill=255)
    tails = np.array(tail1) > 127
    shade(big, ((80, 80, 80), (200, 200, 200)), tails)
    shade(big, ((96, 96, 96), (214, 214, 214)), knot)
    out = finish(big)
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse([95, 84, 248, 104], fill=(20, 12, 8, 50))
    sh = sh.filter(ImageFilter.GaussianBlur(4))
    res = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    res.alpha_composite(sh)
    res.alpha_composite(out)
    return res


def opaska(W, H, lab):
    S = SS
    head = (lab == KOD['wlosy']) | (lab == KOD['twarz_szyja'])
    YY, XX = np.mgrid[0:H, 0:W]
    yc = 78 + 6 * ((XX - 170) / 80.0) ** 2                     # (łuk wzdłuż czoła)
    band = head & (YY >= yc) & (YY < yc + 13) & (XX > 92) & (XX < 252)
    bd = Image.fromarray((band * 255).astype(np.uint8), 'L').resize((W * S, H * S), Image.BILINEAR).filter(ImageFilter.GaussianBlur(2))
    m = np.array(bd) > 120
    big = np.zeros((H * S, W * S, 4), np.uint8)
    shade(big, ((80, 80, 80), (210, 210, 210)), m)
    BY = np.mgrid[0:H * S, 0:W * S][0]
    top_edge = m & ~np.roll(m, 3 * S, axis=0)
    big[top_edge, :3] = np.clip(big[top_edge, :3].astype(int) + 25, 0, 255).astype(np.uint8)
    # końce zawiązane z tyłu (po prawej)
    t = Image.new('L', (W * S, H * S), 0)
    d = ImageDraw.Draw(t)
    d.polygon([(248 * S, 84 * S), (258 * S, 86 * S), (270 * S, 120 * S), (260 * S, 122 * S)], fill=255)
    d.polygon([(244 * S, 86 * S), (252 * S, 88 * S), (254 * S, 116 * S), (244 * S, 114 * S)], fill=255)
    tails = np.array(t) > 127
    shade(big, ((70, 70, 70), (180, 180, 180)), tails)
    return finish(big)


def main(argv):
    src = Image.open(SRC)
    W, H = src.size
    mimg, lab = mask()
    out = {'Ubior_Maska_Hero_Bust': mimg, 'Ubior_Bust_Kapelusz': kapelusz(W, H), 'Ubior_Bust_Czapka': czapka(W, H),
           'Ubior_Bust_Chusta': chusta(W, H, lab), 'Ubior_Bust_Opaska': opaska(W, H, lab)}
    for n, im in out.items():
        p = os.path.join(GAME, 'img', 'system', n + '.png')
        im.save(p, optimize=True)
        print('->', os.path.relpath(p, GAME).replace('\\', '/'), im.size)
    if '--podglad' in argv:
        p = argv[argv.index('--podglad') + 1]
        base = Image.open(SRC).convert('RGBA')
        tiles = [base, Image.alpha_composite(Image.new('RGBA', (W, H), (66, 100, 62, 255)), mimg)]
        for n in ('Ubior_Bust_Kapelusz', 'Ubior_Bust_Czapka', 'Ubior_Bust_Chusta', 'Ubior_Bust_Opaska'):
            t = base.copy(); t.alpha_composite(out[n]); tiles.append(t)
        sheet = Image.new('RGBA', (W * len(tiles), H), (66, 100, 62, 255))
        for i, t in enumerate(tiles):
            sheet.alpha_composite(t, (i * W, 0))
        sheet.save(p)


if __name__ == '__main__':
    main(sys.argv[1:])
