# Bakes the stable shift room (Stajnia_Zmiana.js) as pictures, built from the art of the Fantastic Buildings - Medieval pack (the same
# logs, shingles, thatch, rails, barrels and window as the log stable on the town map): the INSIDE of that stable.
# The layout is the scene one (BOXES, STATION, 19 x 13 tiles of 48 px):
#   img/pictures/Stajnia_Wnetrze.png 912x624 (under the people) and Stajnia_Wnetrze_Gora.png 912x56 (the upper row gate, over the
#   horses, placed at y 146).   python tools/stajnia/wnetrze.py
# The floor is a lighter, warmer ground (packed earth, straw-strewn boards), the stall beds lighter still, the walls dark logs only
# on the top and the sides.
import random, os
from PIL import Image, ImageDraw, ImageFilter
PACK = r"C:\Program Files (x86)\Steam\steamapps\common\RPG Maker MZ\dlc\Fantastic Buildings - Medieval\Tilesets"
T = 48; W, H = 19 * T, 13 * T
BOX_TX = [1, 7, 13]; BW, BH = 5, 3
rnd = random.Random(181)
_sheets = {}


def sheet(n):
    if n not in _sheets:
        _sheets[n] = Image.open(os.path.join(PACK, n + ".png")).convert("RGBA")
    return _sheets[n]


def cut(n, x0, y0, x1, y1):
    return sheet(n).crop((x0, y0, x1, y1))


def tile_fill(img, piece, x0, y0, x1, y1):
    """tile a piece over a rectangle"""
    for y in range(y0, y1, piece.height):
        for x in range(x0, x1, piece.width):
            c = piece.crop((0, 0, min(piece.width, x1 - x), min(piece.height, y1 - y)))
            img.alpha_composite(c, (x, y))


def noise(img, amt=8, box=None):
    px = img.load()
    x0, y0, x1, y1 = box or (0, 0, img.width, img.height)
    for y in range(y0, y1):
        for x in range(x0, x1):
            p = px[x, y]
            n = rnd.randint(-amt, amt)
            px[x, y] = (max(0, min(255, p[0] + n)), max(0, min(255, p[1] + n)), max(0, min(255, p[2] + n)), p[3])


def floor(img):
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, H], fill=(152, 120, 82))
    # trodden earth: big soft patches, then boards laid across the middle, then straw
    for _ in range(90):
        x, y, r = rnd.randint(0, W), rnd.randint(0, H), rnd.randint(30, 90)
        c = rnd.choice([(142, 111, 76), (162, 130, 90), (148, 116, 80), (170, 138, 96)])
        d.ellipse([x - r, y - r // 2, x + r, y + r // 2], fill=c)
    img.paste(img.filter(ImageFilter.GaussianBlur(9)), (0, 0))
    d = ImageDraw.Draw(img)
    noise(img, 9)
    d = ImageDraw.Draw(img)
    for _ in range(900):   # pebbles and dark specks of the packed earth
        x, y = rnd.randint(0, W), rnd.randint(0, H)
        d.rectangle([x, y, x + rnd.randint(1, 3), y + 1], fill=rnd.choice([(124, 96, 64), (176, 144, 102), (110, 84, 56)]))
    # the aisle: planks laid lengthwise from the door up to the boxes (a lighter, warmer tone)
    for x in range(8 * T, 11 * T, 24):
        k = (x // 24) % 2
        d.rectangle([x, 5 * T + 10, x + 22, H], fill=(186 + k * 8, 150 + k * 8, 104 + k * 6))
        d.line([x + 23, 5 * T + 10, x + 23, H], fill=(98, 72, 46))
    for y in range(5 * T + 40, H, 130):
        for x in range(8 * T, 11 * T, 24):
            if rnd.random() < 0.5: d.line([x, y, x + 22, y], fill=(98, 72, 46))
    for _ in range(520):   # straw strewn about
        x, y = rnd.randint(0, W), rnd.randint(60, H); l = rnd.randint(5, 14)
        d.line([x, y, x + l, y + rnd.randint(-2, 2)], fill=rnd.choice([(220, 190, 112), (196, 164, 92), (232, 206, 132)]))


def straw_bed(img, x, y, w, h):
    """a stall bed: golden straw (the pack thatch) lightened, with loose straws"""
    d = ImageDraw.Draw(img)
    d.rectangle([x, y, x + w - 1, y + h - 1], fill=(206, 176, 100))
    th = cut("Rural_TileE", 8, 596, 56, 644)
    bed = Image.new("RGBA", (w, h)); tile_fill(bed, th, 0, 0, w, h)
    over = Image.new("RGBA", (w, h), (236, 206, 128, 120)); bed.alpha_composite(over)
    img.alpha_composite(bed, (x, y))
    d = ImageDraw.Draw(img)
    for _ in range(260):
        sx, sy = x + rnd.randint(0, w - 12), y + rnd.randint(0, h - 2)
        d.line([sx, sy, sx + rnd.randint(4, 12), sy + rnd.randint(-1, 1)], fill=rnd.choice([(244, 220, 148), (222, 190, 112), (200, 168, 92)]))
    d.rectangle([x, y, x + w - 1, y + 6], fill=(150, 118, 64, 255))   # (shade under the back wall / rail)


def logs(img, x0, y0, x1, y1):
    """horizontal log courses from the pack (the log stable), tiled"""
    tile_fill(img, cut("Rural_TileD", 14, 432, 38, 480), x0, y0, x1, y1)


def log_ends(img, x0, y0, y1, flip=False):
    """the wall column with the round log ends (the building corner)"""
    c = cut("Rural_TileD", 0, 432, 12, 480)
    if flip: c = c.transpose(Image.FLIP_LEFT_RIGHT)
    for y in range(y0, y1, 48):
        img.alpha_composite(c.crop((0, 0, 12, min(48, y1 - y))), (x0, y))


def shingle(img, x0, y0, x1, y1):
    piece = cut("Rural_TileD", 64, 576, 112, 612)
    tile_fill(img, piece, x0, y0, x1, y1)


def rail(img, x0, x1, y):
    piece = cut("Rural_TileD", 158, 497, 188, 508)
    tile_fill(img, piece, x0, y, x1, y + piece.height)


def post(img, x, y0, y1):
    p = cut("Rural_TileD", 226, 470, 240, 520)
    tile_fill(img, p, x, y0, x + p.width, y1)


def gate(img, x, y, w, h, lower):
    ry = [y + 8, y + 24] if lower else [y + h - 32, y + h - 17]
    for q in ry:
        rail(img, x - 8, x + w + 8, q)
    for px in (x - 8, x + w // 2 - 7, x + w - 6):
        post(img, px, (y + 0) if lower else y + h - 42, (y + 46) if lower else y + h + 6)


def build():
    img = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    floor(img)
    # the boxes: golden straw beds, log partitions (posts), the lower row gate and back rail
    for r, ty in enumerate((1, 7)):
        for tx in BOX_TX:
            x, y, w, h = tx * T, ty * T, BW * T, BH * T
            straw_bed(img, x, y, w, h)
            post(img, x - 9, y, y + h); post(img, x + w - 5, y, y + h)
            if r == 1:
                rail(img, x - 8, x + w + 8, y + h - 12)
                gate(img, x, y, w, h, True)
    # the top wall: the roof edge (dark shingle, rafters), then log courses; a shadow under it
    logs(img, 0, 12, W, T)
    shingle(img, 0, 0, W, 12)
    d = ImageDraw.Draw(img)
    for x in range(30, W, 144):
        d.rectangle([x, 0, x + 10, 12], fill=(48, 34, 22))
    d.rectangle([0, 12, W, 13], fill=(38, 26, 16))
    shade = Image.new("RGBA", (W, 14), (0, 0, 0, 0)); sd = ImageDraw.Draw(shade)
    for i in range(14): sd.line([0, i, W, i], fill=(20, 12, 4, int(110 * (1 - i / 14))))
    img.alpha_composite(shade, (0, T))
    # the window (the log stable's own) over the aisle, with its light shaft
    win = cut("Rural_TileD", 268, 684, 334, 738)
    wx, wy = 9 * T - 33, 0
    img.alpha_composite(win.crop((0, 0, 66, 36)), (wx, 12))
    shaft = Image.new("RGBA", (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(shaft)
    sd.polygon([(wx + 4, 46), (wx + 62, 46), (wx + 200, 340), (wx - 60, 340)], fill=(255, 236, 170, 62))
    sd.polygon([(wx + 22, 46), (wx + 44, 46), (wx + 120, 340), (wx + 20, 340)], fill=(255, 244, 200, 46))
    img.alpha_composite(shaft.filter(ImageFilter.GaussianBlur(7)))
    # the side walls: logs with the round ends (left as the building corner, right mirrored)
    log_ends(img, 0, T, H); log_ends(img, W - 12, T, H, True)
    # the barrel rack along the right wall (the pack rack with barrels, repeated)
    rack = cut("Rural_TileD", 256, 408, 292, 528)
    for y in range(206, 560, 118):
        img.alpha_composite(rack, (W - 54, y))
    # the door at the bottom: daylight and log posts
    d = ImageDraw.Draw(img)
    d.rectangle([8 * T - 4, H - 26, 11 * T + 4, H], fill=(238, 220, 172))
    d.rectangle([8 * T - 4, H - 40, 11 * T + 4, H - 26], fill=(202, 176, 124))
    for x in (8 * T - 18, 11 * T + 4):
        tile_fill(img, cut("Rural_TileD", 14, 432, 28, 480), x, H - 168, x + 14, H)
    tile_fill(img, cut("Rural_TileD", 14, 432, 38, 456), 8 * T - 18, H - 176, 11 * T + 18, H - 168)
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0)); gd = ImageDraw.Draw(glow)
    gd.polygon([(8 * T, H), (11 * T, H), (11 * T + 50, H - 150), (8 * T - 50, H - 150)], fill=(255, 238, 180, 58))
    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(8)))
    vig = Image.new("RGBA", (W, H), (0, 0, 0, 0)); vd = ImageDraw.Draw(vig)
    for i in range(36):
        vd.rectangle([i, i, W - i, H - i], outline=(10, 6, 2, int(60 * (1 - i / 36))))
    img.alpha_composite(vig)
    return img


def top():
    img = Image.new("RGBA", (W, 56), (0, 0, 0, 0))
    for tx in BOX_TX:
        gate(img, tx * T, T - 146, BW * T, BH * T, False)
    return img


if __name__ == "__main__":
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "img", "pictures")
    build().save(os.path.join(out, "Stajnia_Wnetrze.png"))
    top().save(os.path.join(out, "Stajnia_Wnetrze_Gora.png"))
    print("ok")
