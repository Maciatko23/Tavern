# Composes the big stable pictures from pack pieces + PixelLab stalls. Usage: python zloz.py <scratch dir> <out dir>
import sys, random
from PIL import Image
S = sys.argv[1]; OUT = sys.argv[2]
PACK = 'C:/Program Files (x86)/Steam/steamapps/common/RPG Maker MZ/dlc/Fantastic Buildings - Medieval/Tilesets/'
E = Image.open(PACK + 'Rural_TileE.png').convert('RGBA')
D = Image.open(PACK + 'Rural_TileD.png').convert('RGBA')
s1 = Image.open(S + '/s1.png').convert('RGBA'); s2 = Image.open(S + '/s2.png').convert('RGBA')
tack = Image.open(S + '/tack.png').convert('RGBA'); props = Image.open(S + '/props.png').convert('RGBA')
W, H = 480, 336
POST1 = [17, 92, 167, 238]; POST2 = [19, 93, 165, 238]

def strip_h(im):
    bb = im.getbbox(); return im.crop((0, bb[3] - 97, im.width, bb[3]))
t1, t2 = strip_h(s1), strip_h(s2)
def stall(src, i):
    P = POST1 if src == 1 else POST2; im = t1 if src == 1 else t2
    return im.crop((P[i], 0, P[i + 1], 97))

def wall_fill(im):  # back wall behind transparent interior (tack panel)
    random.seed(3); out = im.copy(); px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            if px[x, y][3] < 255:
                g = random.choice([(66, 56, 46), (72, 62, 50), (60, 52, 44)]); px[x, y] = g + (255,)
    return out

def roof(width, height):
    src = E.crop((0, 576, 240, 672)); top = src.crop((0, 0, 240, 24)); bot = src.crop((0, 56, 240, 96)); mid = src.crop((0, 24, 240, 56))
    def wide(p):
        o = Image.new('RGBA', (width, p.height))
        for x in range(0, width, 240): o.paste(p if (x // 240) % 2 == 0 else p.transpose(Image.FLIP_LEFT_RIGHT), (x, 0))
        return o
    o = Image.new('RGBA', (width, height)); o.paste(wide(top), (0, 0)); y = 24
    while y < height - 40:
        o.paste(wide(mid), (0, y)); y += 32
    o.paste(wide(bot), (0, height - 40))
    px = o.load()
    for y in range(24, height):
        for x, c in ((0, (92, 62, 22, 255)), (1, (150, 108, 34, 255)), (width - 1, (88, 58, 20, 255)), (width - 2, (120, 84, 26, 255)), (width - 3, (166, 122, 40, 255))):
            px[x, y] = c
    return o

def dormer(hay=True):
    d = E.crop((238, 12, 292, 100)).copy(); px = d.load()
    if hay:
        for y in range(60, 84):
            for x in range(16, 40):
                px[x, y] = (52, 38, 26, 255)
        for y in range(76, 84):  # hay spilling from the hatch
            for x in range(14, 42):
                if (x + y) % 3: px[x, y] = (224, 178, 64, 255) if (x * y) % 5 else (190, 140, 44, 255)
    return d

def build(order, tack_on, wing_cut, props_on, name):
    img = Image.new('RGBA', (W, H))
    wingw = 144 - wing_cut; zone = W - wingw
    # roof
    rtop = 20; r = roof(zone + 60, 240 - rtop + 8)
    img.alpha_composite(r, (0, rtop))
    for dx in (70, 190): img.alpha_composite(dormer(), (dx, rtop + 70))
    # stalls
    x = 0; y0 = H - 97
    if tack_on:
        tk = wall_fill(tack).crop((0, 0, 57, 96)); img.alpha_composite(tk, (0, H - 96)); x = 57
    else:
        first = order[0]; P = POST1 if first[0] == 1 else POST2
        pieceL = (t1 if first[0] == 1 else t2).crop((P[first[1]] - 12, 0, P[first[1]], 97)); img.alpha_composite(pieceL, (0, y0)); x = 12
    for (src, i) in order:
        p = stall(src, i); img.alpha_composite(p, (x, y0)); x += p.width
    print(name, 'stall run ends at', x, 'zone', zone)
    # wing (cross gable with door)
    wing = E.crop((240 + wing_cut, 576, 384, 768))
    img.alpha_composite(wing, (W - wing.width, H - 192))
    if props_on: img.alpha_composite(props, (4, H - 64 + 3))
    # trim top transparent rows is not done: fixed canvas
    img.save(OUT + '/!$Stajnia_Duza_%s_raw.png' % name)
    return img

A = build([(2, 0), (2, 1), (1, 1), (1, 2)], True, 13, False, 'A')
B = build([(1, 0), (2, 1), (1, 1), (1, 2), (2, 0)], False, 43, True, 'B')
C = build([(1, 0), (2, 1), (1, 2), (1, 1)], True, 13, False, 'C')

# palette snap to the pack (256 colours from the thatched stable + log stable + houses)
pk = Image.new('RGB', (768, 768), (0, 0, 0)); pk.paste(E.convert('RGB'), (0, 0), E.split()[3])
pal = Image.new('RGB', (768 * 2, 768)); pal.paste(pk, (0, 0)); d2 = D.convert('RGB'); pal.paste(d2, (768, 0), D.split()[3])
q = pal.quantize(colors=255, method=Image.MEDIANCUT)
for n, im in (('A', A), ('B', B), ('C', C)):
    a = im.split()[3]; rgb = im.convert('RGB').quantize(palette=q, dither=Image.NONE).convert('RGB')
    out = rgb.convert('RGBA'); out.putalpha(a.point(lambda v: 255 if v > 127 else 0))
    out.save(OUT + '/!$Stajnia_Duza_%s_1.png' % n)
    sheet = Image.new('RGBA', (W * 3, H * 4))
    for r in range(4):
        for c in range(3): sheet.paste(out, (c * W, r * H))
    sheet.save(OUT + '/!$Stajnia_Duza_%s.png' % n)
