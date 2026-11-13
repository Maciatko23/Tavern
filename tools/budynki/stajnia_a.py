# Stable A, corrected (2026-11-08): 12 x 6 tiles; both gable slopes, a stall each side of the door, hip at the right end, bigger hay hatches.
# python tools/budynki/stajnia_a.py   -> img/characters/!$Stajnia_Duza_A.png (3x4 sheet) + docs/stajnia_duza/A_poprawiona.png
import os, random
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..')); C = os.path.join(HERE, 'czesci')
PACK = 'C:/Program Files (x86)/Steam/steamapps/common/RPG Maker MZ/dlc/Fantastic Buildings - Medieval/Tilesets/'
E = Image.open(PACK + 'Rural_TileE.png').convert('RGBA'); D = Image.open(PACK + 'Rural_TileD.png').convert('RGBA')
ld = lambda n: Image.open(os.path.join(C, n)).convert('RGBA')
s1, s2, tack = ld('stajnia_pas1.png'), ld('stajnia_pas2.png'), ld('stajnia_siodla.png')
W, H = 576, 288
P1 = [17, 92, 167, 238]; P2 = [19, 93, 165, 238]
def strip(im):
    bb = im.getbbox(); return im.crop((0, bb[3] - 97, im.width, bb[3]))
t1, t2 = strip(s1), strip(s2)
def stall(src, i):
    P = P1 if src == 1 else P2; im = t1 if src == 1 else t2; return im.crop((P[i], 0, P[i + 1], 97))
def post_half(src, i):
    P = P1 if src == 1 else P2; im = t1 if src == 1 else t2; return im.crop((P[i], 0, P[i] + 12, 97))
def wall_fill(im):
    random.seed(3); o = im.copy(); px = o.load()
    for y in range(o.height):
        for x in range(o.width):
            if px[x, y][3] < 255: px[x, y] = random.choice([(66, 56, 46), (72, 62, 50), (60, 52, 44)]) + (255,)
    return o

RND = random.Random(11)
def band_src():
    st = E.crop((0, 576, 240, 672))
    return st
def roof(width, height):
    """thatch roof from the pack's own rows: ridge cap on top, body from shuffled bands (random offset / flip), the pack's eave edge at the bottom;
    a little shading under the ridge"""
    st = E.crop((0, 576, 240, 672)); big = E.crop((300, 4, 384, 100))
    o = Image.new('RGBA', (width, height))
    cap = st.crop((0, 0, 240, 22))
    for x in range(0, width, 240): o.paste(cap, (x, 0))
    bot = st.crop((0, 56, 240, 96)); y = 22
    while y < height - 40:
        h = RND.choice([10, 12, 14, 16]); r0 = RND.randint(0, 40); src = st.crop((0, 24 + r0 % 30, 240, 24 + r0 % 30 + h))
        if RND.random() < 0.5: src = src.transpose(Image.FLIP_LEFT_RIGHT)
        off = RND.randint(0, 239); strip = Image.new('RGBA', (width + 240, h))
        for x in range(-off, width + 240, 240): strip.paste(src, (x, 0))
        o.paste(strip.crop((0, 0, width, h)), (0, y)); y += h
    for x in range(0, width, 240): o.paste(bot, (x - RND.randint(0, 0), height - 40))
    px = o.load()
    for yy in range(22, min(height - 40, 90)):      # shade just under the ridge, fading
        k = 1.0 - 0.14 * (1 - (yy - 22) / 68.0)
        for xx in range(width):
            r_, g_, b_, a_ = px[xx, yy]; px[xx, yy] = (int(r_ * k), int(g_ * k), int(b_ * k * 0.97), a_)
    return o
HIPW = 78
def hip_right(h=196):
    """right hip face: a trapezoid (ridge end narrow on top, widening to the eave), strands of the pack's lit slope, own shading,
    dark outline outside, the pack's eave lip at the bottom"""
    o = Image.new('RGBA', (HIPW, h)); px = o.load(); T = E.crop((2, 72, 42, 112)); tp = T.load(); st = E.crop((0, 576, 240, 672)); lip = st.crop((0, 56, HIPW, 96)).load()
    for y in range(h):
        right = int(11 + (HIPW - 11) * min(1.0, y / 80.0))
        for x in range(0, right):
            r_, g_, b_, a_ = tp[(x + y // 3) % T.width, (y + x // 3) % T.height]
            k = 1.06 - 0.16 * x / HIPW - (0.10 * (1 - y / 70.0) if y < 70 else 0)
            px[x, y] = (min(255, int(r_ * k)), min(255, int(g_ * k)), int(b_ * k), 255)
        if right > 5:
            px[right - 1, y] = (92, 62, 22, 255); px[right - 2, y] = (126, 88, 28, 255); px[right - 3, y] = (176, 130, 44, 255)
    for x in range(0, 3):                           # ridge band
        for y in range(h): px[x, y] = [(150, 108, 34, 255), (252, 222, 120, 255), (214, 168, 60, 255)][x]
    for y in range(h - 40, h):                      # the eave lip of the pack
        for x in range(HIPW):
            c = lip[x, y - (h - 40)]
            if c[3] and x > 2 and px[x, y][3]: px[x, y] = c
    return o
def hip_left(): return hip_right().transpose(Image.FLIP_LEFT_RIGHT)
def dormer():
    """a proper dormer: pack gable + frame, open shutters, hay inside, shadow below its little roof; masked out of the surrounding thatch"""
    d = E.crop((238, 12, 292, 100)).copy(); mask = Image.new('L', d.size, 0)
    ImageDraw.Draw(mask).polygon([(31, 3), (49, 62), (45, 87), (9, 87), (2, 70)], fill=255)
    px = d.load(); rnd = random.Random(5)
    for y in range(58, 86):                       # window opening: dark inside + hay
        for x in range(13, 41):
            px[x, y] = (46, 33, 22, 255)
    for y in range(66, 86):
        for x in range(13, 41):
            w = 15 - abs(x - 27) * 0.8 + (y - 66) * 0.6
            if w > 5 and rnd.random() > 0.1: px[x, y] = rnd.choice([(226, 182, 70, 255), (196, 146, 46, 255), (240, 204, 100, 255), (170, 120, 36, 255)])
    for y in range(58, 64):                       # shadow under the little roof
        for x in range(13, 41): px[x, y] = (30, 21, 14, 255)
    for (x0, x1) in ((8, 13), (41, 46)):          # open shutters (planks)
        for y in range(56, 87):
            for x in range(x0, x1): px[x, y] = (150, 100, 48, 255) if (x - x0) % 2 == 0 else (112, 72, 32, 255)
        for x in range(x0, x1): px[x, 56] = px[x, 86] = (70, 44, 18, 255)
    d.putalpha(mask); return d
def shadow(w, h):
    o = Image.new('RGBA', (w, h)); dr = ImageDraw.Draw(o); dr.ellipse([0, 0, w - 1, h - 1], fill=(40, 24, 6, 70)); return o
def build():
    img = Image.new('RGBA', (W, H)); y0 = H - 97; rtop = 4; rh = 196
    body = roof(W - 2 * HIPW + 8, rh); img.alpha_composite(body, (HIPW - 4, rtop))
    img.alpha_composite(hip_left(), (0, rtop)); img.alpha_composite(hip_right(), (W - HIPW, rtop))
    for cx in (60, 178, 296):                      # three dormers, even spacing, the same size
        img.alpha_composite(shadow(36, 14), (cx - 5, rtop + 128)); img.alpha_composite(dormer(), (cx - 27, rtop + 52))
    x = 0; img.alpha_composite(wall_fill(tack).crop((0, 0, 57, 96)), (0, H - 96)); x = 57
    for (src, i) in [(2, 0), (2, 1), (1, 1), (1, 2)]:
        p = stall(src, i); img.alpha_composite(p, (x, y0)); x += p.width
    wing = E.crop((240 + 13, 576, 384, 768)).copy(); wp = wing.load()
    for yy in range(0, 156):                       # clear the main-roof thatch that sits above/left of the left slope (the gable stands on OUR roof)
        xb = int(70 * (1 - yy / 153.0)) - 13 - 1
        for xx in range(0, max(0, xb)): wp[xx, yy] = (0, 0, 0, 0)
    img.alpha_composite(wing, (x, H - 192)); door_x = x + 61
    pxx = img.load()
    for yy in range(0, 150):                       # valley: a dark line on the main roof along the gable's left slope
        xb = x + int(70 * (1 - yy / 153.0)) - 13 - 1
        for dx, al in ((-1, 150), (-2, 90), (-3, 40)):
            if 0 <= xb + dx < W: 
                r_, g_, b_, a_ = pxx[xb + dx, H - 192 + yy]
                if a_: pxx[xb + dx, H - 192 + yy] = (int(r_ * (1 - al / 255 * .6)), int(g_ * (1 - al / 255 * .6)), int(b_ * (1 - al / 255 * .6)), 255)
    x += wing.width
    for (src, i) in [(1, 0)]:
        p = stall(src, i); img.alpha_composite(p, (x, y0)); x += p.width
    img.alpha_composite(post_half(1, 3).crop((0, 0, 12, 97)), (x, y0)); x += 12
    print('wall ends', x, 'door centre x', door_x, 'tile col', door_x // 48)
    return img
def snap(im):
    pk = Image.new('RGB', (768 * 2, 768)); pk.paste(E.convert('RGB'), (0, 0), E.split()[3]); pk.paste(D.convert('RGB'), (768, 0), D.split()[3])
    q = pk.quantize(colors=255, method=Image.MEDIANCUT); a = im.split()[3]
    o = im.convert('RGB').quantize(palette=q, dither=Image.NONE).convert('RGBA'); o.putalpha(a.point(lambda v: 255 if v > 127 else 0)); return o
if __name__ == '__main__':
    im = snap(build()); im.save(os.path.join(HERE, 'stajnia_A_1.png'))
    sh = Image.new('RGBA', (W * 3, H * 4))
    for r in range(4):
        for c in range(3): sh.paste(im, (c * W, r * H))
    sh.save(os.path.join(ROOT, 'img', 'characters', '!$Stajnia_Duza_A.png'))
    random.seed(1); bg = Image.new('RGBA', (W + 20, H + 20), (0, 0, 0, 255)); d = ImageDraw.Draw(bg)
    for y in range(0, H + 20, 24):
        for x in range(-12 * (y // 24 % 2), W + 20, 24):
            g = random.randint(96, 128); d.rectangle([x + 1, y + 1, x + 22, y + 22], fill=(g, g - 6, g - 14, 255))
    bg.alpha_composite(im, (10, 10)); bg.save(os.path.join(ROOT, 'docs', 'stajnia_duza', 'A_poprawiona.png'))
