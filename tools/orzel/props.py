# python tools/orzel/props.py
#   -> img/system/Farm_OrzelKosz.png, Farm_OrzelGniazdo.png, Farm_OrzelGrzeda.png   the eagle's nests (Farming buildings)
#   -> img/characters/!$Orzel_Gniazdo.png   the broken eyrie on the ridge: row 1 (facing down) with the egg, the rest empty
#   -> img/characters/!$Orzel_Orlica.png, !$Orzel_Strzaly.png, !$Orzel_Misa.png, !$Orzel_Klatka.png (row 1 shut, the rest open)
#   -> tools/orzel/icons/453.png .. 457.png   the icons (egg, glove, feather, the eagle's head, the basket) for the IconSet (install.py)
# Biały orzeł, etap 2. Surowe obrazki z PixelLab: tools/orzel/raw2/ (bud_*, rek_*, ikona_*), tools/orzel/raw/jajo_gniazdo.png (the egg).
# A "!$" sheet: one picture in all 12 cells (3 columns x 4 rows), the feet on the cell's bottom (like the game's rocks).
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
RAW = os.path.join(HERE, "raw2")
SYS = os.path.join(ROOT, "img", "system")
CHR = os.path.join(ROOT, "img", "characters")
ICONS = os.path.join(HERE, "icons")


def load(name, folder=RAW):
    return Image.open(os.path.join(folder, name + ".png")).convert("RGBA")


def trim(im, even=True):
    bb = im.getbbox()
    im = im.crop(bb)
    if even and im.width % 2:
        pad = Image.new("RGBA", (im.width + 1, im.height), (0, 0, 0, 0))
        pad.alpha_composite(im, (0, 0))
        im = pad
    return im


def egg_sprite():
    """the egg out of the approved preview (raw/jajo_gniazdo.png): its light pixels round the middle"""
    src = load("jajo_gniazdo", os.path.join(HERE, "raw"))
    w, h = src.size
    out = Image.new("RGBA", src.size, (0, 0, 0, 0))
    px, op = src.load(), out.load()
    # the egg: the big light blob in the middle (cream, its dark outline next to it)
    cx, cy = w // 2, h // 2
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 100:
                continue
            light = (r + g + b) / 3 > 150 and max(r, g, b) - min(r, g, b) < 60
            if light and abs(x - cx) < 15 and abs(y - cy) < 14:
                op[x, y] = (r, g, b, a)
    # only the biggest blob (the egg) - not the feathers' light specks round it
    seen, best = set(), []
    for y in range(h):
        for x in range(w):
            if op[x, y][3] == 0 or (x, y) in seen:
                continue
            stack, part = [(x, y)], []
            seen.add((x, y))
            while stack:
                qx, qy = stack.pop()
                part.append((qx, qy))
                for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    n = (qx + dx, qy + dy)
                    if 0 <= n[0] < w and 0 <= n[1] < h and n not in seen and op[n][3] > 0:
                        seen.add(n)
                        stack.append(n)
            if len(part) > len(best):
                best = part
    keep = set(best)
    for y in range(h):
        for x in range(w):
            if (x, y) not in keep:
                op[x, y] = (0, 0, 0, 0)
    bb = out.getbbox()
    egg = out.crop(bb)
    # a dark outline round it (1 px), like the rest of the art
    ow = Image.new("RGBA", (egg.width + 2, egg.height + 2), (0, 0, 0, 0))
    ep, oo = egg.load(), ow.load()
    for y in range(egg.height):
        for x in range(egg.width):
            if ep[x, y][3] > 0:
                for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    oo[x + 1 + dx, y + 1 + dy] = (52, 40, 34, 255)
    ow.alpha_composite(egg, (1, 1))
    return ow


def sheet(im, rows=None, cell=None):
    """a '!$' sheet: rows - four pictures (down, left, right, up) or one for all; each in a cell w x h, the feet on its bottom"""
    rows = rows or [im] * 4
    cw = cell[0] if cell else max(r.width for r in rows)
    ch = cell[1] if cell else max(r.height for r in rows)
    cw += cw % 2
    out = Image.new("RGBA", (cw * 3, ch * 4), (0, 0, 0, 0))
    for r, pic in enumerate(rows):
        for c in range(3):
            out.alpha_composite(pic, (c * cw + (cw - pic.width) // 2, r * ch + ch - pic.height))
    return out


def main():
    os.makedirs(ICONS, exist_ok=True)
    # the buildings (Farming: the picture's foot-middle on the footprint's bottom row)
    for raw, name in (("bud_kosz", "Farm_OrzelKosz"), ("bud_gniazdo", "Farm_OrzelGniazdo"), ("bud_grzeda", "Farm_OrzelGrzeda")):
        im = trim(load(raw))
        im.save(os.path.join(SYS, name + ".png"))
        print(name, im.size)
    # the eyrie with and without the egg
    nest = trim(load("rek_gniazdo"))
    egg = egg_sprite()
    with_egg = nest.copy()
    with_egg.alpha_composite(egg, (nest.width // 2 - egg.width // 2 - 4, nest.height // 2 - egg.height // 2 + 2))
    sheet(nest, [with_egg, nest, nest, nest]).save(os.path.join(CHR, "!$Orzel_Gniazdo.png"))
    print("!$Orzel_Gniazdo", with_egg.size)
    for raw, name in (("rek_orlica", "!$Orzel_Orlica"), ("rek_strzaly", "!$Orzel_Strzaly"), ("rek_misa", "!$Orzel_Misa")):
        if os.path.exists(os.path.join(RAW, raw + ".png")):
            im = trim(load(raw))
            sheet(im).save(os.path.join(CHR, name + ".png"))
            print(name, im.size)
    if os.path.exists(os.path.join(RAW, "rek_klatka.png")):
        shut = trim(load("rek_klatka"))
        opened = trim(load("rek_klatka_otwarta")) if os.path.exists(os.path.join(RAW, "rek_klatka_otwarta.png")) else shut
        sheet(shut, [shut, opened, opened, opened]).save(os.path.join(CHR, "!$Orzel_Klatka.png"))
        print("!$Orzel_Klatka", shut.size)
    # the icons (32 x 32, the picture in the middle)
    def icon(im, idx):
        c = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
        im = trim(im, even=False)
        if im.width > 32 or im.height > 32:
            k = min(32 / im.width, 32 / im.height)
            im = im.resize((max(1, int(im.width * k)), max(1, int(im.height * k))), Image.NEAREST)
        c.alpha_composite(im, ((32 - im.width) // 2, (32 - im.height) // 2))
        c.save(os.path.join(ICONS, "%d.png" % idx))
    icon(egg, 453)
    icon(load("ikona_rekawica"), 454)
    icon(load("ikona_pioro"), 455)
    head = load("prawie25/Idle/rotations/east")
    bb = head.getbbox()
    # the head: the top 30 rows of the bird, the front part (facing right)
    hx1 = bb[2]
    icon(head.crop((hx1 - 32, bb[1], hx1, bb[1] + 30)), 456)
    kosz = trim(load("bud_kosz"))
    icon(kosz.resize((kosz.width // 2, kosz.height // 2), Image.NEAREST), 457)
    print("ikony 453-457 ->", ICONS)


if __name__ == "__main__":
    main()
