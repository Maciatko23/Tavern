# The upper floors' own props, in Winlu Interior's look, as RPG Maker character sheets (my own files only):
#   img/characters/!Tavern_Props_Upper.png        48x96 frames  (8 blocks x 3 patterns x 4 directions)
#   img/characters/!$Tavern_Props_Upper_Big.png   144x192 frames (one block: 3 patterns x 4 directions)
#   img/characters/!Tavern_Props_Upper_Doors.png  48x96 frames: the numbered room doors 1..24 (dir 2 closed .. 8 open)
# Sources: PixelLab Pro Flash images in src/ (generated at 2x on a Winlu style reference, see SOURCES.txt) and Winlu's
# own frames (candles, doors, banners). Finishing like Winlu: premultiplied downscale, alpha cut to 0/255, a hard 40 %
# black drop shadow for things standing on the floor, a 1 px dark outline where the downscale lost it.
#   python make_props.py            (writes the sheets, previews into out/, and docs/tawerna_nowa/rekwizyty_pietra.png)
import os, sys, json
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
SRC = os.path.join(HERE, "src")
OUT = os.path.join(HERE, "out")
CHARS = os.path.join(ROOT, "img", "characters")
WINLU = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Interior", "Remaster")
DOCS = os.path.join(ROOT, "docs", "tawerna_nowa")
os.makedirs(OUT, exist_ok=True)

def src(name):
    return Image.open(os.path.join(SRC, name)).convert("RGBA")

def winlu_char(name, idx, d, p):
    im = Image.open(os.path.join(WINLU, "characters", name + ".png")).convert("RGBA")
    big = name.startswith("!$")
    pw, ph = (im.width // 3, im.height // 4) if big else (im.width // 12, im.height // 8)
    bx = 0 if big else (idx % 4) * 3; by = 0 if big else (idx // 4) * 4
    return im.crop(((bx + p) * pw, (by + d // 2 - 1) * ph, (bx + p + 1) * pw, (by + d // 2) * ph))

def downscale(im, scale):
    """premultiplied resize (no dark fringes), then Winlu's hard alpha"""
    bb = im.getbbox()
    im = im.crop(bb)
    w, h = max(1, round(im.width * scale)), max(1, round(im.height * scale))
    pm = im.convert("RGBa").resize((w, h), Image.LANCZOS).convert("RGBA")
    a = pm.getchannel("A").point(lambda v: 255 if v >= 110 else 0)
    pm.putalpha(a)
    return pm

def outline(im, color=(38, 28, 28, 255)):
    """close gaps in the dark outline: a transparent pixel next to an opaque one where the opaque one is light gets
    nothing; we only darken opaque edge pixels that are too light (keeps the shape, restores the rim)"""
    px = im.load()
    W, H = im.size
    out = im.copy(); po = out.load()
    for y in range(H):
        for x in range(W):
            r, g, b, a = px[x, y]
            if a == 0: continue
            edge = any(not (0 <= x + dx < W and 0 <= y + dy < H) or px[x + dx, y + dy][3] == 0
                       for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
            if edge and (r + g + b) / 3 > 70:
                po[x, y] = (int(r * 0.45), int(g * 0.42), int(b * 0.42), 255)
    return out

def with_shadow(im, dx=3, dy=2):
    """Winlu's floor shadow: the silhouette in 40 % black, moved right/down, behind the thing"""
    W, H = im.size
    out = Image.new("RGBA", (W + dx, H + dy), (0, 0, 0, 0))
    a = im.getchannel("A")
    sh = Image.new("RGBA", im.size, (0, 0, 0, 102)); sh.putalpha(a.point(lambda v: 102 if v else 0))
    out.alpha_composite(sh, (dx, dy))
    out.alpha_composite(im, (0, 0))
    return out

def place(frame, im, cx, base):
    """put `im` into `frame` with its horizontal centre at cx and its lowest row at y = base"""
    frame.alpha_composite(im, (int(round(cx - im.width / 2)), base - im.height))

def recolor_fabric(im, hue_to, sat=1.0, val=1.0, sel=lambda h, s, v: (h < 20 or h > 225) and s > 90):
    """recolour the red fabric of the canopy bed (hue 0..255 as PIL HSV)"""
    hsv = im.convert("RGB").convert("HSV")
    a = im.getchannel("A")
    H, S, V = hsv.split()
    hp, sp_, vp = H.load(), S.load(), V.load()
    for y in range(im.height):
        for x in range(im.width):
            h, s, v = hp[x, y], sp_[x, y], vp[x, y]
            if sel(h, s, v):
                hp[x, y] = hue_to
                sp_[x, y] = max(0, min(255, int(s * sat)))
                vp[x, y] = max(0, min(255, int(v * val)))
    out = Image.merge("HSV", (H, S, V)).convert("RGBA")
    out.putalpha(a)
    return out

# ================================================================================================ the small sheet
def small_sheet():
    sheet = Image.new("RGBA", (576, 768), (0, 0, 0, 0))
    def put(idx, d, p, fr):
        bx = (idx % 4) * 3; by = (idx // 4) * 4
        sheet.alpha_composite(fr, ((bx + p) * 48, (by + d // 2 - 1) * 96))
    F = lambda: Image.new("RGBA", (48, 96), (0, 0, 0, 0))
    # ---- idx 0: candles that stand ON a surface (the event stands on the table-top cell; cell y = frame y - 48)
    for p in range(3):
        one = winlu_char("!Decoration2", 1, 2, p)            # a single lit candle, its foot at frame y 82
        fr = F(); fr.alpha_composite(one, (0, 79 - 82))       # foot at frame 79 = cell y 31 (a bedside table's top)
        put(0, 2, p, fr)
        three = winlu_char("!Decoration2", 1, 6, p)          # three candles, foot at 65
        fr = F(); fr.alpha_composite(three, (0, 86 - 65))     # foot at frame 86 = cell y 38 (a round table's top)
        put(0, 4, p, fr)
    for p in range(2):                                        # a vase of flowers standing on a console table
        vase = winlu_char("!Decoration_static", 0, 2, p)      # its foot at frame y 55
        fr = F(); fr.alpha_composite(vase, (0, 79 - 55))      # foot at cell y 31 (the console's top)
        put(0, 8, p, fr)
    cand = downscale(src("candelabrum_a.png"), 0.5)
    for p in range(3):
        fr = F()
        c = cand.copy()
        if p:                                                 # a little flicker: the flames brighter / dimmer
            px = c.load()
            for y in range(c.height // 3):
                for x in range(c.width):
                    r, g, b, a = px[x, y]
                    if a and r > 200 and g > 120:
                        k = 1.08 if p == 1 else 0.92
                        px[x, y] = (min(255, int(r * k)), min(255, int(g * k)), min(255, int(b * k)), a)
        place(fr, c, 24, 86)                                  # foot at cell y 38 (a long table's back row)
        put(0, 6, p, fr)
    # ---- idx 1: things standing on the floor / hanging on walls
    harp = with_shadow(outline(downscale(src("harp_a.png"), 0.5)))
    fr = F(); place(fr, harp, 24, 94); put(1, 2, 0, fr)
    cart = with_shadow(outline(downscale(src("cart_a.png"), 0.9)))
    fr = F(); place(fr, cart, 24, 92); put(1, 2, 1, fr)
    wash = with_shadow(outline(downscale(src("washstand_a.png"), 0.75)))
    fr = F(); place(fr, wash, 24, 92); put(1, 2, 2, fr)
    lug = src("luggage_a.png")
    trunk = with_shadow(outline(downscale(lug.crop((0, 0, 96, 96)), 0.56)))
    bag = with_shadow(outline(downscale(lug.crop((96, 0, 192, 96)), 0.56)))
    fr = F(); place(fr, trunk, 24, 88); put(1, 4, 0, fr)
    fr = F(); place(fr, bag, 24, 88); put(1, 4, 1, fr)
    # ---- idx 1 dir 4 p2 + dir 6: the Zaleski arms (red, a gold beast) - the Winlu wolf banner recoloured
    wolf = winlu_char("!Flags_banner_Inside", 0, 2, 2)
    def zaleski(banner):
        """the purple cloth -> deep red, the dark wolf and the grey trims -> gold (the Lord's red-and-gold arms)"""
        out = banner.copy(); po = out.load()
        hsv = banner.convert("RGB").convert("HSV"); hp = hsv.load()
        lerp = lambda a, b, t: tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
        for y in range(banner.height):
            for x in range(banner.width):
                r, g, bb, al = po[x, y]
                if al == 0: continue
                h, s_, v = hp[x, y]
                if v <= 30: continue                                   # the outline stays dark
                if (h < 16 or h > 250) and v < 110:                    # the beast -> gold
                    t = max(0.0, min(1.0, (v - 30) / 60.0))
                    po[x, y] = lerp((120, 78, 20), (240, 196, 86), t) + (255,)
                elif 120 <= h < 150:                                   # the trims -> darker gold
                    t = max(0.0, min(1.0, (v - 40) / 120.0))
                    po[x, y] = lerp((96, 64, 20), (214, 170, 72), t) + (255,)
                else:                                                  # the cloth -> deep red
                    t = max(0.0, min(1.0, (v - 60) / 110.0))
                    po[x, y] = lerp((84, 14, 22), (186, 42, 44), t) + (255,)
        return out
    zb = zaleski(wolf)
    put(1, 6, 0, zb)
    put(1, 6, 1, zb.transpose(Image.FLIP_LEFT_RIGHT))
    Dsh = Image.open(os.path.join(WINLU, "tilesets", "Fantasy_Inside_D.png")).convert("RGBA")
    shape = Dsh.crop((3 * 48, 0, 4 * 48, 48))
    sb = shape.getbbox(); shape = shape.crop(sb)
    sh = Image.new("RGBA", shape.size, (0, 0, 0, 0)); spx = sh.load(); src_px = shape.load()
    for y in range(shape.height):
        for x in range(shape.width):
            r, g, b_, al = src_px[x, y]
            if al < 200: continue
            lum = (r + g + b_) / 3
            if lum < 45: spx[x, y] = (40, 16, 16, 255)                       # the rim
            else:
                t = min(1.0, max(0.0, (lum - 60) / 120.0)) * 0.35 + 0.55         # an even red, a little shading
                spx[x, y] = (int(90 + 110 * t), int(18 + 24 * t), int(24 + 22 * t), 255)
    for y in range(shape.height):                                            # a gold edge inside the dark rim
        for x in range(shape.width):
            if spx[x, y][3] and spx[x, y][0] > 60 and any(spx[x + dx, y + dy][0] == 40 for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
                                                          if 0 <= x + dx < shape.width and 0 <= y + dy < shape.height):
                spx[x, y] = (206, 160, 64, 255)
    beast = zb.crop(zb.getbbox()).crop((8, 12, 40, 62))
    bm = Image.new("RGBA", beast.size, (0, 0, 0, 0)); bpx = bm.load(); zpx = beast.load()
    for y in range(beast.height):
        for x in range(beast.width):
            r, g, b_, al = zpx[x, y]
            if al and r > 110 and g > 70 and b_ < 110: bpx[x, y] = (r, g, b_, 255)
    bm = bm.crop(bm.getbbox() or (0, 0, 1, 1))
    k = min((sh.width - 10) / bm.width, (sh.height - 12) / bm.height)
    bm = bm.resize((max(1, int(bm.width * k)), max(1, int(bm.height * k))), Image.NEAREST)
    sh.alpha_composite(bm, ((sh.width - bm.width) // 2, 4))
    fr = F(); place(fr, sh, 24, 64); put(1, 4, 2, fr)
    put(2, 2, 0, bell_frame())
    unlit = winlu_char("!Decoration2", 2, 2, 0)                # an unlit candle (TavernLife lights it when the room is rented)
    fr = F(); fr.alpha_composite(unlit, (0, 79 - 82)); put(2, 4, 0, fr)
    sheet.save(os.path.join(CHARS, "!Tavern_Props_Upper.png"))
    return sheet


def bell_frame():
    """the doorman's bell: a brass bell under a curled iron bracket on the wall, a pull cord with a red tassel;
    drawn 4x larger and reduced like the other props (soft edges, Winlu's hard alpha). It hangs in the wall face's
    middle row (the upper half of the 48x96 frame, the event stands on the face's bottom row)."""
    Z = 4
    im = Image.new("RGBA", (48 * Z, 96 * Z), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    O = (44, 30, 22, 255)
    # the wall plate and the bracket's arm with a curl at its end
    d.rounded_rectangle([7 * Z, 10 * Z, 12 * Z, 26 * Z], radius=Z, fill=(58, 44, 38, 255), outline=O, width=Z)
    d.line([12 * Z, 14 * Z, 31 * Z, 14 * Z], fill=(70, 56, 50, 255), width=int(2.2 * Z))
    d.arc([27 * Z, 9 * Z, 35 * Z, 17 * Z], 270, 180, fill=(70, 56, 50, 255), width=int(1.8 * Z))
    d.line([14 * Z, 22 * Z, 22 * Z, 15 * Z], fill=(70, 56, 50, 255), width=int(1.6 * Z))       # the brace
    # the bell (a dome with a flared lip), brass
    cx, top = 28 * Z, 15 * Z
    body = [(cx - 3 * Z, top + 2 * Z), (cx + 3 * Z, top + 2 * Z), (cx + 5 * Z, top + 10 * Z), (cx + 7 * Z, top + 12 * Z),
            (cx - 7 * Z, top + 12 * Z), (cx - 5 * Z, top + 10 * Z)]
    d.ellipse([cx - 3 * Z, top, cx + 3 * Z, top + 5 * Z], fill=(196, 150, 70, 255), outline=O, width=Z)
    d.polygon(body, fill=(196, 150, 70, 255), outline=O)
    d.line([(cx - 2 * Z, top + 3 * Z), (cx - 4 * Z, top + 10 * Z)], fill=(246, 214, 134, 255), width=int(1.4 * Z))   # the shine
    d.line([(cx + 3 * Z, top + 4 * Z), (cx + 5 * Z, top + 10 * Z)], fill=(136, 96, 40, 255), width=int(1.4 * Z))    # the shadow side
    d.ellipse([cx - 7 * Z, top + 11 * Z, cx + 7 * Z, top + 14 * Z], fill=(150, 108, 46, 255), outline=O, width=Z)       # the lip
    d.ellipse([cx - 2 * Z, top + 13 * Z, cx + 2 * Z, top + 17 * Z], fill=(60, 44, 30, 255))                            # the clapper
    # the pull cord and its tassel
    d.line([cx + 4 * Z, top + 13 * Z, cx + 4 * Z, 44 * Z], fill=(150, 40, 40, 255), width=int(1.2 * Z))
    d.polygon([(cx + 2 * Z, 44 * Z), (cx + 6 * Z, 44 * Z), (cx + 7 * Z, 50 * Z), (cx + Z, 50 * Z)], fill=(170, 40, 40, 255), outline=O)
    small = im.convert("RGBa").resize((48, 96), Image.LANCZOS).convert("RGBA")
    small.putalpha(small.getchannel("A").point(lambda v: 255 if v >= 110 else 0))
    return small

# ================================================================================================ the big sheet
def big_sheet():
    sheet = Image.new("RGBA", (432, 768), (0, 0, 0, 0))
    def put(d, p, fr):
        sheet.alpha_composite(fr, (p * 144, (d // 2 - 1) * 192))
    F = lambda: Image.new("RGBA", (144, 192), (0, 0, 0, 0))
    canopy = outline(downscale(src("canopy_a.png"), 0.63))
    variants = [canopy,                                              # red (the Lord's)
                recolor_fabric(canopy, 150, 0.9, 1.0),               # blue
                recolor_fabric(canopy, 85, 0.75, 0.95),              # green
                recolor_fabric(canopy, 240, 0.55, 1.12),             # rose
                recolor_fabric(canopy, 28, 1.0, 1.15)]               # gold
    for i, v in enumerate(variants):
        fr = F(); place(fr, with_shadow(v), 96, 190)                 # spans the event's cell and the one to its right
        put([2, 2, 2, 4, 4][i], [0, 1, 2, 0, 1][i], fr)
    spinet = with_shadow(outline(downscale(src("spinet_a.png"), 0.66)))
    fr = F(); place(fr, spinet, 96, 186); put(4, 2, fr)
    tub = with_shadow(outline(downscale(src("tub_a.png"), 0.55)))
    fr = F(); place(fr, tub, 96, 186); put(6, 0, fr)
    copper = recolor_fabric(downscale(src("tub_a.png"), 0.55), 16, 1.55, 1.38,
                            sel=lambda h, s, v: 5 <= h <= 40 and s > 30 and v < 170)
    fr = F(); place(fr, with_shadow(outline(copper)), 96, 186); put(6, 1, fr)
    tap = outline(downscale(src("tapestry_a.png"), 0.55))
    fr = F(); place(fr, tap, 72, 170); put(6, 2, fr)                # hangs on the wall face, centred on its cell
    # dir 8: Winlu's lit marble fireplace (!$Fireplace4, 3 fire frames) moved half a cell right, so an event on the
    # left of two middle cells shows it centred on a wall of even width
    for p in range(3):
        fire = winlu_char("!$Fireplace4", 0, 4, p)            # 144x144
        fr = F(); fr.alpha_composite(fire, (24, 48))
        put(8, p, fr)
    sheet.save(os.path.join(CHARS, "!$Tavern_Props_Upper_Big.png"))
    return sheet

# ================================================================================================ numbered doors
DIGITS = {  # 3x5 pixel digits
    "0": ["111", "101", "101", "101", "111"], "1": ["010", "110", "010", "010", "111"], "2": ["111", "001", "111", "100", "111"],
    "3": ["111", "001", "011", "001", "111"], "4": ["101", "101", "111", "001", "001"], "5": ["111", "100", "111", "001", "111"],
    "6": ["111", "100", "111", "101", "111"], "7": ["111", "001", "010", "010", "010"], "8": ["111", "101", "111", "101", "111"],
    "9": ["111", "101", "111", "001", "111"]}

def plaque(n):
    s = str(n)
    tw = len(s) * 3 + (len(s) - 1)
    W, H = tw + 6, 9
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W - 1, H - 1], radius=2, fill=(58, 40, 22, 255))          # dark rim
    d.rounded_rectangle([1, 1, W - 2, H - 2], radius=1, fill=(196, 152, 72, 255))        # brass
    d.line([2, 1, W - 3, 1], fill=(236, 204, 128, 255))                                   # light edge on top
    d.line([2, H - 2, W - 3, H - 2], fill=(150, 108, 48, 255))
    x = 3
    for ch in s:
        for yy, row in enumerate(DIGITS[ch]):
            for xx, v in enumerate(row):
                if v == "1": im.putpixel((x + xx, 2 + yy), (54, 34, 18, 255))
        x += 4
    return im

def hanger():
    """the 'Nie przeszkadzać' card hanging on the door knob: a little cream card with a red band"""
    im = Image.new("RGBA", (8, 13), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.line([3, 0, 1, 3], fill=(80, 60, 40, 255)); d.line([4, 0, 6, 3], fill=(80, 60, 40, 255))
    d.rectangle([0, 3, 7, 12], fill=(60, 40, 30, 255))
    d.rectangle([1, 4, 6, 11], fill=(236, 226, 200, 255))
    d.rectangle([1, 6, 6, 8], fill=(170, 40, 40, 255))
    return im

DND = {6, 20}       # rooms whose door (seen from a corridor) carries the "Nie przeszkadzać" card

def doors_sheet():
    sheet = Image.new("RGBA", (576, 768), (0, 0, 0, 0))
    for n in range(1, 25):
        idx, p = (n - 1) // 3, (n - 1) % 3
        bx = (idx % 4) * 3; by = (idx // 4) * 4
        for di, d in enumerate((2, 4, 6, 8)):
            fr = winlu_char("!Fantasy_door1", 0, d, 0).copy()
            if d == 2:
                pl = plaque(n)
                fr.alpha_composite(pl, (24 - pl.width // 2, 33))
                if n in DND:
                    fr.alpha_composite(hanger(), (5, 56))
            sheet.alpha_composite(fr, ((bx + p) * 48, (by + di) * 96))
    sheet.save(os.path.join(CHARS, "!Tavern_Props_Upper_Doors.png"))
    return sheet


# ================================================================================================ the gilded gate
def gate_sheet():
    """!$Tavern_Props_Upper_Gate: the gilded gate five cells wide (240x192 frames). dir 2 closed, 4 and 6 opening,
    8 open (the two leaves folded back against the posts). The event stands on the middle cell of the five."""
    g = downscale(src("gate_a.png"), 240.0 / 219)
    g = outline(g)
    W, H = g.size
    pl = pr = 32                                          # the posts
    mid = W // 2
    post_l, post_r = g.crop((0, 0, pl, H)), g.crop((W - pr, 0, W, H))
    leaf_l, leaf_r = g.crop((pl, 0, mid, H)), g.crop((mid, 0, W - pr, H))
    sheet = Image.new("RGBA", (720, 768), (0, 0, 0, 0))
    for di, f in enumerate((1.0, 0.62, 0.36, 0.16)):
        fr = Image.new("RGBA", (240, 192), (0, 0, 0, 0))
        top = 190 - H
        lw, rw = max(2, int(leaf_l.width * f)), max(2, int(leaf_r.width * f))
        fr.alpha_composite(leaf_l.resize((lw, H), Image.NEAREST) if f < 1 else leaf_l, (pl, top))
        fr.alpha_composite(leaf_r.resize((rw, H), Image.NEAREST) if f < 1 else leaf_r, (W - pr - rw, top))
        fr.alpha_composite(post_l, (0, top)); fr.alpha_composite(post_r, (W - pr, top))
        for p in range(3):
            sheet.alpha_composite(fr, (p * 240, di * 192))
    sheet.save(os.path.join(CHARS, "!$Tavern_Props_Upper_Gate.png"))
    return sheet

# ================================================================================================ the preview for the user
def preview(small, big, doors):
    T = os.path.join(WINLU, "tilesets")
    C = Image.open(os.path.join(T, "Fantasy_Inside_C.png")).convert("RGBA")
    D = Image.open(os.path.join(T, "Fantasy_Inside_D.png")).convert("RGBA")
    Fb = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 18)
    Fs = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 13)
    def frame_of(sheet, fw, fh, col, row):
        return sheet.crop((col * fw, row * fh, (col + 1) * fw, (row + 1) * fh))
    S = 2
    items = [   # (label, image) at 1x
        ("łoże z baldachimem (Lorda)", frame_of(big, 144, 192, 0, 0)), ("baldachim niebieski", frame_of(big, 144, 192, 1, 0)),
        ("baldachim zielony", frame_of(big, 144, 192, 2, 0)), ("baldachim różany", frame_of(big, 144, 192, 0, 1)),
        ("baldachim złoty", frame_of(big, 144, 192, 1, 1)), ("szpinet", frame_of(big, 144, 192, 2, 1)),
        ("balia drewniana", frame_of(big, 144, 192, 0, 2)), ("wanna miedziana", frame_of(big, 144, 192, 1, 2)),
        ("gobelin z jeleniem", frame_of(big, 144, 192, 2, 2)),
        ("harfa", frame_of(small, 48, 96, 3, 0)), ("wózek pokojówki", frame_of(small, 48, 96, 4, 0)),
        ("umywalka z dzbanem", frame_of(small, 48, 96, 5, 0)), ("kufer podróżny", frame_of(small, 48, 96, 3, 1)),
        ("torba podróżna", frame_of(small, 48, 96, 4, 1)), ("tarcza Zaleskich", frame_of(small, 48, 96, 5, 1)),
        ("chorągiew Zaleskich", frame_of(small, 48, 96, 3, 2)), ("świeca na stoliku", frame_of(small, 48, 96, 0, 0)),
        ("trzy świece na stół", frame_of(small, 48, 96, 0, 1)), ("srebrny kandelabr", frame_of(small, 48, 96, 0, 2)),
        ("drzwi nr 1", frame_of(doors, 48, 96, 0, 0)), ("drzwi nr 6 + „Nie przeszkadzać”", frame_of(doors, 48, 96, 5, 0)),
        ("drzwi nr 24", frame_of(doors, 48, 96, 2 + 3 * 3, 4)),
        ("złota krata (zamknięta)", Image.open(os.path.join(CHARS, "!$Tavern_Props_Upper_Gate.png")).crop((0, 0, 240, 192))),
        ("złota krata (otwarta)", Image.open(os.path.join(CHARS, "!$Tavern_Props_Upper_Gate.png")).crop((0, 576, 240, 768))),
        ("dzwonek na odźwiernego", frame_of(small, 48, 96, 6, 0)),
    ]
    winlu = [("Winlu: łoże królewskie", C.crop((11 * 48, 13 * 48, 13 * 48, 16 * 48))),
             ("Winlu: szafa", C.crop((5 * 48, 11 * 48, 6 * 48, 13 * 48))),
             ("Winlu: stolik nocny", C.crop((5 * 48, 0, 6 * 48, 96))),
             ("Winlu: fotel", C.crop((12 * 48, 2 * 48, 13 * 48, 4 * 48))),
             ("Winlu: beczka z wodą", D.crop((13 * 48, 0, 14 * 48, 96))),
             ("Winlu: toaletka", C.crop((8 * 48, 13 * 48, 9 * 48, 16 * 48)))]
    cells = []
    for lab, im in items + winlu:
        bb = im.getbbox() or (0, 0, 1, 1)
        cells.append((lab, im.crop(bb)))
    COLW, ROWH = 250, 330
    cols = 7
    rows = (len(cells) + cols - 1) // cols
    canvas = Image.new("RGBA", (cols * COLW + 40, rows * ROWH + 110), (34, 30, 36, 255))
    d = ImageDraw.Draw(canvas)
    d.text((20, 16), "Nowe rekwizyty pięter (własne arkusze) obok elementów Winlu — skala 2x", fill=(255, 214, 90), font=Fb)
    d.text((20, 44), "Obok: pod każdym rzeczy z Winlu dla porównania stylu. Źródła: PixelLab (styl z wycinków Winlu) + Winlu przemalowane.",
           fill=(220, 214, 204), font=Fs)
    for i, (lab, im) in enumerate(cells):
        cx, cy = 20 + (i % cols) * COLW, 80 + (i // cols) * ROWH
        floor = Image.new("RGBA", (COLW - 20, ROWH - 40), (128, 96, 76, 255))
        fd = ImageDraw.Draw(floor)
        for yy in range(0, floor.height, 24):
            fd.line([0, yy, floor.width, yy], fill=(112, 84, 66, 255))
        big2 = im.resize((im.width * S, im.height * S), Image.NEAREST)
        if big2.width > floor.width - 10 or big2.height > floor.height - 10:
            k = min((floor.width - 10) / big2.width, (floor.height - 10) / big2.height)
            big2 = im.resize((int(im.width * S * k), int(im.height * S * k)), Image.NEAREST)
        floor.alpha_composite(big2, ((floor.width - big2.width) // 2, floor.height - big2.height - 8))
        canvas.alpha_composite(floor, (cx, cy))
        col = (160, 210, 255) if lab.startswith("Winlu") else (255, 236, 200)
        d.text((cx, cy + ROWH - 36), lab, fill=col, font=Fs)
    out = os.path.join(DOCS, "rekwizyty_pietra.png")
    canvas.convert("RGB").save(out)
    print("preview", out, canvas.size)

if __name__ == "__main__":
    s = small_sheet()
    b = big_sheet()
    d = doors_sheet()
    g = gate_sheet()
    for n, im in (("small", s), ("big", b), ("doors", d), ("gate", g)):
        im.save(os.path.join(OUT, n + ".png"))
    preview(s, b, d)
    print("sheets written to", CHARS)
