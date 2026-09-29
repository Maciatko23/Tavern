# python make_house_props.py  -> img/characters/!House_Props.png (96x96 frames, 12 x 8) + tools/house/house_props_index.json
# Grandpa's cottage props that Winlu Fantasy Interior lacks, finished like the tavern's props (tools/tavern/props_upper/
# make_props.py): premultiplied downscale of a PixelLab picture made at 2x on a Winlu style reference, Winlu's hard
# alpha, a 1 px dark rim where the downscale lost it, a 40 % black drop shadow for things standing on the floor.
# Sources: src/grid_wheel_churn_rocker_pegs_s1919.png (PixelLab, see src/SOURCES.txt), the tavern's thick candle
# (!Tavern_Props index 0 dir 2), Winlu's small flower pots (!Decoration_static 0/2/0, 0/2/1) and a pipe drawn here.
# Every frame is placed so its thing lands exactly where the cottage puts it (a candle on a nightstand's top, a pot
# on a window sill, a pipe on the small round table) - the offsets are in the comments of each item.
import os, json
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
SRC = os.path.join(HERE, "src")
CHARS = os.path.join(ROOT, "img", "characters")
WINLU = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Interior", "Remaster")
SHEET = "!House_Props"
FW = FH = 96
INDEX = os.path.join(HERE, "..", "house_props_index.json")

def slot(n):
    """slot n (reading order over the 12 x 8 frame grid) -> (characterIndex, direction, pattern)"""
    col, row = n % 12, n // 12
    return (row // 4) * 4 + col // 3, (row % 4 + 1) * 2, col % 3

def downscale(im, scale):
    """premultiplied resize (no dark fringes), then Winlu's hard alpha"""
    im = im.crop(im.getbbox())
    w, h = max(1, round(im.width * scale)), max(1, round(im.height * scale))
    pm = im.convert("RGBa").resize((w, h), Image.LANCZOS).convert("RGBA")
    pm.putalpha(pm.getchannel("A").point(lambda v: 255 if v >= 110 else 0))
    return pm

def outline(im):
    """darken opaque edge pixels that are too light (restores the dark rim the downscale softened)"""
    px = im.load(); W, H = im.size
    out = im.copy(); po = out.load()
    for y in range(H):
        for x in range(W):
            r, g, b, a = px[x, y]
            if a == 0: continue
            edge = any(not (0 <= x + dx < W and 0 <= y + dy < H) or px[x + dx, y + dy][3] == 0 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
            if edge and (r + g + b) / 3 > 70:
                po[x, y] = (int(r * 0.45), int(g * 0.42), int(b * 0.42), 255)
    return out

def with_shadow(im, dx=3, dy=2):
    """Winlu's floor shadow: the silhouette in 40 % black, moved right / down, behind the thing"""
    out = Image.new("RGBA", (im.width + dx, im.height + dy), (0, 0, 0, 0))
    sh = Image.new("RGBA", im.size, (0, 0, 0, 102)); sh.putalpha(im.getchannel("A").point(lambda v: 102 if v else 0))
    out.alpha_composite(sh, (dx, dy)); out.alpha_composite(im, (0, 0))
    return out

def frame_of(sheet_path, fw, fh, idx, d, p, big=False):
    im = Image.open(sheet_path).convert("RGBA")
    bx, by = (0, 0) if big else ((idx % 4) * 3, (idx // 4) * 4)
    return im.crop(((bx + p) * fw, (by + d // 2 - 1) * fh, (bx + p + 1) * fw, (by + d // 2) * fh))

def canvas():
    return Image.new("RGBA", (FW, FH), (0, 0, 0, 0))

def put(fr, im, cx, base):
    """`im` into frame `fr` with its horizontal centre at cx and its lowest row at y = base - 1"""
    fr.alpha_composite(im, (int(round(cx - im.width / 2)), base - im.height))

def art_box(fr):
    a = fr.getchannel("A").point(lambda v: 255 if v > 100 else 0)
    return list(a.getbbox() or (0, 0, 0, 0))

def pipe():
    """grandpa's clay pipe lying on its side: a dark bowl, a long thin stem, a wisp of ash; drawn 4x larger and reduced"""
    S = 4
    PW, PH = 24, 12
    im = Image.new("RGBA", (PW * S, PH * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    OUT, WOOD, LIGHT, BIT = (38, 26, 22, 255), (128, 84, 52, 255), (186, 138, 96, 255), (60, 44, 36, 255)
    # the stem, from the bowl to the mouthpiece (up to the right), a dark bit at its end
    d.line([(7 * S, 7 * S), (22 * S, 3 * S)], fill=OUT, width=int(3.0 * S))
    d.line([(7 * S, 7 * S), (22 * S, 3 * S)], fill=WOOD, width=int(1.5 * S))
    d.line([(19 * S, int(3.8 * S)), (22 * S, 3 * S)], fill=BIT, width=int(1.5 * S))
    # the bowl: a warm wooden cup with a highlight on its left, the charred rim on top
    d.rounded_rectangle([1 * S, 2 * S, 9 * S, 11 * S], radius=int(2.6 * S), fill=OUT)
    d.rounded_rectangle([int(1.9 * S), int(2.9 * S), int(8.1 * S), int(10.1 * S)], radius=int(2 * S), fill=WOOD)
    d.ellipse([int(2.3 * S), int(2.4 * S), int(7.7 * S), int(4.8 * S)], fill=(48, 32, 26, 255))
    d.line([(int(2.9 * S), int(5.4 * S)), (int(2.9 * S), int(8.8 * S))], fill=LIGHT, width=int(1.1 * S))
    small = im.convert("RGBa").resize((PW, PH), Image.LANCZOS).convert("RGBA")
    small.putalpha(small.getchannel("A").point(lambda v: 255 if v >= 110 else 0))
    return small

PATCHES = [(158, 74, 58), (196, 152, 84), (92, 112, 146), (112, 124, 72), (206, 190, 152), (128, 86, 62), (166, 104, 112)]

def patchwork_quilt():
    """grandpa's double bed (Winlu C 13..14,10..12) with a patchwork quilt: the plain teal quilt's pixels recoloured in
    folk patches (rust, ochre, faded blue, olive, linen, brown, rose) with darker seams, Winlu's own shading kept (every
    pixel keeps its brightness relative to the quilt). Only the quilt is in the picture: it lies over the bed's tiles
    (an event below the characters), the headboard and the pillows (starred tiles) stay above it."""
    C = Image.open(os.path.join(WINLU, "tilesets", "Fantasy_Inside_C.png")).convert("RGBA")
    bed = C.crop((13 * 48, 10 * 48, 15 * 48, 13 * 48))
    px = bed.load()
    W, H = bed.size
    mask = {}
    for y in range(60, H):                      # (below the pillows)
        for x in range(W):
            r, g, b, a = px[x, y]
            if a > 200 and g >= r + 6 and b >= r and (r + g + b) / 3 < 125:
                mask[(x, y)] = (r + g + b) / 3.0
    mean = sum(mask.values()) / len(mask)
    y0 = min(y for x, y in mask)
    PW, PH = 12, 10
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    po = out.load()
    for (x, y), L in mask.items():
        cy = (y - y0) // PH
        sx = x - 2 + (PW // 2 if cy % 2 else 0)          # every other row shifted half a patch (sewn like bricks)
        cx = sx // PW
        c = PATCHES[(cx * 3 + cy * 5 + (cx * cy) % 3) % len(PATCHES)]
        gr = sum(c) / 3.0
        c = tuple(v * 0.8 + gr * 0.2 for v in c)          # a little faded, like Winlu's cloth
        k = 0.66 * (L / mean) ** 1.2                     # Winlu's fabric is darker than the patch colours
        seam = sx % PW == 0 or (y - y0) % PH == 0
        if seam: k *= 0.74
        po[x, y] = tuple(max(0, min(255, int(v * k))) for v in c) + (255,)
    return out

def main():
    # grandpa's patchwork quilt: a big single-frame sheet (144x144 frames), the quilt in the frame's left 96 px so that
    # the event on the bed's right bottom cell (x+1, y+1 of a bed whose top-left cell is x, y) lays it on the bed
    quilt = patchwork_quilt()
    qs = Image.new("RGBA", (144 * 3, 144 * 4), (0, 0, 0, 0))
    qs.alpha_composite(quilt, (0, 0))
    qs.save(os.path.join(CHARS, "!$House_Quilt.png"))
    grid = Image.open(os.path.join(SRC, "grid_wheel_churn_rocker_pegs_s1919.png")).convert("RGBA")
    q = lambda i: grid.crop(((i % 2) * 128, (i // 2) * 128, (i % 2) * 128 + 128, (i // 2) * 128 + 128))
    wheel = with_shadow(outline(downscale(q(0), 0.55)))
    churn = with_shadow(outline(downscale(q(1), 0.5)))
    rocker = with_shadow(outline(downscale(q(2), 0.52)))
    pegs = outline(downscale(q(3), 0.5))
    candle = [frame_of(os.path.join(CHARS, "!Tavern_Props.png"), 48, 96, 0, 2, p) for p in range(3)]
    pots = [frame_of(os.path.join(WINLU, "characters", "!Decoration_static.png"), 48, 96, 0, 2, p) for p in (0, 1)]
    sheet = Image.new("RGBA", (FW * 12, FH * 8), (0, 0, 0, 0))
    index = {}
    def add(n, fr, key, name, place, anim=False):
        col, row = n % 12, n // 12
        sheet.alpha_composite(fr, (col * FW, row * FH))
        if key is None: return
        i, d, p = slot(n)
        index[key] = {"sheet": SHEET, "index": i, "direction": d, "pattern": p, "w": FW, "h": FH, "slot": n,
                      "art": art_box(fr), "place": place, "name": name, "anim": anim}
    # 0-2  a candle on the bedside nightstand (C 5,0..1): the event on the nightstand's WALL-row cell, above the
    #      characters (the nightstand's top is a starred tile); its top lies in that cell at y 22..36 -> the candle's
    #      foot at frame y 80 (48 + 32)
    for p in range(3):
        fr = canvas(); c = candle[p].crop((0, 0, 48, 96)); fr.alpha_composite(c, (24, 80 - 56)); add(p, fr, "swieca_szafka" if p == 0 else None, "świeca na szafce nocnej (animowana)", "table", True)
    # 3-5  a candle on the big stool (C 14,0): the event on the stool's cell; its top at y 12..30 -> foot at 48 + 23
    for p in range(3):
        fr = canvas(); fr.alpha_composite(candle[p], (24, 71 - 56)); add(3 + p, fr, "swieca_stolek" if p == 0 else None, "świeca na stołku (animowana)", "table", True)
    # 6  the spinning wheel, 7 the butter churn, 8 the rocking chair: standing on the event's cell (feet at y 93)
    fr = canvas(); put(fr, wheel, 48, 95); add(6, fr, "kolowrotek", "kołowrotek z lnem", "floor")
    fr = canvas(); put(fr, churn, 48, 95); add(7, fr, "maselnica", "maselnica", "floor")
    fr = canvas(); put(fr, rocker, 48, 95); add(8, fr, "fotel_bujany", "fotel bujany dziadka z kocem", "floor")
    # 9  the peg rail with the hero's shirt, cap and bag: the event on the lowest wall row; the rail at frame y 20
    fr = canvas(); fr.alpha_composite(pegs, (48 - pegs.width // 2, 20)); add(9, fr, "kolki_ubrania", "kołki z koszulą, czapką i torbą", "wall")
    # 10 grandpa's pipe on the small round table (C 4,0..1): the event on the table's lower cell; the top at frame
    #    y 27..51 -> the pipe lies with its lowest row at y 44
    fr = canvas(); pp = pipe(); fr.alpha_composite(pp, (48 - pp.width // 2, 44 - pp.height)); add(10, fr, "fajka", "fajka dziadka", "table")
    # 11, 12 flower pots on a window sill (B 0,2..3): the event on the window's lower cell; the sill's top at y 16..21
    #    of that cell -> the pot's foot at frame y 48 + 20
    for k, pot in enumerate(pots):
        a = pot.getchannel("A").point(lambda v: 255 if v > 100 else 0); bb = a.getbbox()
        art = pot.crop(bb)
        fr = canvas(); fr.alpha_composite(art, (48 - art.width // 2, 68 - art.height)); add(11 + k, fr, "doniczka_%d" % (k + 1), "doniczka z kwiatami na parapecie", "sill")
    sheet.save(os.path.join(CHARS, SHEET + ".png"))
    with open(INDEX, "wb") as f:
        f.write(json.dumps(index, ensure_ascii=False, indent=1).encode("utf-8"))
    # a preview at 2x
    prev = Image.new("RGBA", (FW * 13 * 2 // 1, FH * 2 + 20), (70, 64, 60, 255))
    for n in range(13):
        col, row = n % 12, n // 12
        fr = sheet.crop((col * FW, row * FH, col * FW + FW, row * FH + FH)).resize((FW * 2, FH * 2), Image.NEAREST)
        prev.alpha_composite(fr, (n * FW * 2, 0))
    os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
    prev.save(os.path.join(HERE, "out", "preview.png"))
    print("%s.png: %d props -> %s" % (SHEET, len(index), os.path.relpath(INDEX, ROOT)))

if __name__ == "__main__":
    main()
