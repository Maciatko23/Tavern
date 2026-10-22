# Arkusze obiektów paczki C (img/characters/!$Lud_*.png) z surowych obrazów PixelLab (tools/rozszerzenia/C/art/raw/obj_*.png).
# Każdy arkusz: 3 kolumny x 4 wiersze RÓWNYCH komórek; obiekt przy dolnej krawędzi komórki, wyśrodkowany (dół-środek komórki
# stoi na dole-środku pola zdarzenia; '!' = bez przesunięcia 6 px). Tło przezroczyste. Stany (żar, otwarta skrzynia, warianty
# osła) robione tu w kodzie, bez generacji. Deterministyczne - można uruchamiać wiele razy.
#   python tools/rozszerzenia/C/art/build_objects.py [nazwa ...]      (bez nazw: wszystkie, których surowe obrazy już są)
import os
import sys
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.normpath(os.path.join(HERE, "..", "..", "..", ".."))
RAW = os.path.join(HERE, "raw")
CHARS = os.path.join(GAME, "img", "characters")


# ------------------------------------------------------------------ helpers
def raw(name):
    return Image.open(os.path.join(RAW, name + ".png")).convert("RGBA")


def clean(im, a_min=100, keep=8):
    """Alpha to 0/255, stray specks (clusters up to `keep` px away from the main body) removed."""
    a = np.array(im)
    a[..., 3] = np.where(a[..., 3] >= a_min, 255, 0)
    op = a[..., 3] > 0
    H, W = op.shape
    seen = np.zeros_like(op)
    for y in range(H):
        for x in range(W):
            if op[y, x] and not seen[y, x]:
                stack, comp = [(y, x)], []
                seen[y, x] = True
                while stack:
                    cy, cx = stack.pop()
                    comp.append((cy, cx))
                    for dy in (-1, 0, 1):
                        for dx in (-1, 0, 1):
                            ny, nx = cy + dy, cx + dx
                            if 0 <= ny < H and 0 <= nx < W and op[ny, nx] and not seen[ny, nx]:
                                seen[ny, nx] = True
                                stack.append((ny, nx))
                if len(comp) <= keep:
                    for cy, cx in comp:
                        a[cy, cx, 3] = 0
    return Image.fromarray(a, "RGBA")


def crop(im):
    bb = im.getbbox()
    return im.crop(bb) if bb else im


def soften(im, sat=0.92):
    """Colours a touch less saturated (PixelLab is more vivid than the Winlu tiles)."""
    a = np.array(im).astype(np.float32)
    rgb = a[..., :3]
    g = rgb.mean(axis=2, keepdims=True)
    a[..., :3] = np.clip(g + (rgb - g) * sat, 0, 255)
    return Image.fromarray(a.astype(np.uint8), "RGBA")


def ground_shadow(w, h, rx, ry, cx=None, cy=None, alpha=90, col=(16, 30, 16), blur=2.0):
    """A soft dark ellipse (the object's shadow on the grass) as an RGBA layer w x h."""
    from PIL import ImageDraw
    cx = w / 2 if cx is None else cx
    cy = h - ry - 1 if cy is None else cy
    sh = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=col + (alpha,))
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    a = np.array(sh)
    a[..., 3] = np.where(a[..., 3] < 12, 0, a[..., 3])
    return Image.fromarray(a, "RGBA")


def in_cell(obj, cw, ch, dx=0, bottom=0, shadow=None):
    """The object in a cw x ch cell: bottom-centre on the cell's bottom-centre (raised by `bottom` px, moved by dx).
    shadow: (rx, ry, alpha) of a soft ground shadow under it, or None."""
    cell = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    if obj.width > cw or obj.height > ch:
        raise SystemExit("za duży obiekt %dx%d na komórkę %dx%d" % (obj.width, obj.height, cw, ch))
    x = (cw - obj.width) // 2 + dx
    y = ch - obj.height - bottom
    if shadow:
        rx, ry, al = shadow
        cell.alpha_composite(ground_shadow(cw, ch, rx, ry, cx=cw / 2 + dx, cy=ch - bottom - ry * 0.6, alpha=al))
    cell.alpha_composite(obj, (x, y))
    return cell


def sheet(rows, cw, ch, name):
    """rows: 4 lists of 3 cells (PIL images cw x ch) -> img/characters/<name>.png"""
    out = Image.new("RGBA", (3 * cw, 4 * ch), (0, 0, 0, 0))
    for r, row in enumerate(rows):
        for c, cell in enumerate(row):
            out.alpha_composite(cell, (c * cw, r * ch))
    p = os.path.join(CHARS, name + ".png")
    out.save(p)
    print("ok", name, out.size, "komórka", (cw, ch))
    return out


def same(cell):
    return [[cell] * 3 for _ in range(4)]


BUILDERS = {}


def builder(fn):
    BUILDERS[fn.__name__] = fn
    return fn


# ------------------------------------------------------------------ 1 mielerz (144 x 144)
def scorch(im, k=0.64, green_to_brown=0.7):
    """The mound darkened and charred: lower value, the turf's greens pulled to brown, more soot towards the top."""
    a = np.array(im).astype(np.float32)
    rgb = a[..., :3]
    r, g, b_ = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    green = np.clip((g - r) / 40.0, 0, 1)                       # (how green a pixel is)
    tgt = np.stack([g * 0.9, g * 0.72, b_ * 0.8], axis=-1)       # (a dry brown of the same lightness)
    rgb = rgb * (1 - green[..., None] * green_to_brown) + tgt * (green[..., None] * green_to_brown)
    H = a.shape[0]
    ys = np.arange(H, dtype=np.float32)[:, None]
    top = np.clip(1.0 - (ys - 20) / 90.0, 0, 1)                 # (soot: darker towards the vent)
    rgb *= (k - 0.12 * top)[..., None]
    a[..., :3] = np.clip(rgb, 0, 255)
    return Image.fromarray(a.astype(np.uint8), "RGBA")


EMBER = [(120, 28, 12), (196, 64, 18), (240, 128, 34), (255, 200, 90), (255, 238, 170)]


def ember(im, spots, power, seed):
    """Glowing embers in the mound's openings: each spot (x, y, rx, ry) an irregular blob, deep red rim -> orange -> yellow
    core; power 0..1 scales the core; a warm tint spreads a few px round each spot over the mound's own pixels."""
    a = np.array(im).astype(np.float32)
    op = a[..., 3] > 0
    H, W = op.shape
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    rng = np.random.RandomState(seed)
    for (x, y, rx, ry) in spots:
        jx, jy = rng.uniform(-0.6, 0.6), rng.uniform(-0.4, 0.4)
        d = np.sqrt(((xx - x - jx) / rx) ** 2 + ((yy - y - jy) / ry) ** 2)
        d += rng.uniform(-0.18, 0.18, d.shape) * (d < 1.6)          # (a ragged edge)
        glow = op & (d < 2.6) & (d >= 1.0)
        t = np.clip((2.6 - d) / 1.6, 0, 1) * 0.45 * power
        a[..., :3] = np.where(glow[..., None], a[..., :3] * (1 - t[..., None]) + np.array(EMBER[1], np.float32) * t[..., None], a[..., :3])
        for lim, col in ((1.0, EMBER[0]), (0.75, EMBER[1]), (0.5, EMBER[2]), (0.32 * power + 0.05, EMBER[3]), (0.14 * power, EMBER[4])):
            m = op & (d < lim)
            a[m, :3] = col
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGBA")


# the openings in the raw mound (raw picture's coordinates): the vent at the top, gaps between the log ends at the foot, two
# small side vents poked into the turf
MIEL_SPOTS = [(72, 31.5, 6.5, 2.4), (57, 113, 3.2, 2.5), (83, 114, 3.4, 2.5), (106, 112, 3.0, 2.3), (36, 108, 2.4, 2.0),
              (42, 84, 2.3, 1.8), (108, 78, 2.3, 1.8), (70, 112, 2.0, 1.8)]


@builder
def mielerz():
    cold = soften(clean(raw("obj_mielerz_a")), 0.92)
    box = cold.getbbox()
    smoul = scorch(cold)
    rows = []
    cells_cold = in_cell(cold.crop(box), 144, 144, shadow=(66, 7, 80))
    lit = []
    for i, pw in enumerate((0.75, 1.0, 0.55)):
        e = ember(smoul, MIEL_SPOTS, pw, seed=11 + i * 0 + 0)          # (same ragged shapes, only the strength differs)
        lit.append(in_cell(e.crop(box), 144, 144, shadow=(66, 7, 80)))
    try:
        ready = soften(clean(raw("obj_mielerz_gotowy")), 0.92)
        rb = ready.getbbox()
        cell_ready = in_cell(ready.crop(rb), 144, 144, dx=(rb[0] + rb[2]) // 2 - (box[0] + box[2]) // 2, shadow=(66, 7, 70))
    except FileNotFoundError:
        cell_ready = cells_cold
        print("  (brak obj_mielerz_gotowy - wiersz 2 = zimny)")
    rows = [[cells_cold] * 3, lit, [cell_ready] * 3, [cells_cold] * 3]
    sheet(rows, 144, 144, "!$Lud_Mielerz")


# ------------------------------------------------------------------ 6 szyb (96 x 96): wiersz 0 czynny, wiersz 1 zasypany
@builder
def szyb():
    a = soften(clean(raw("obj_szyb_a")), 0.95)
    z = soften(clean(raw("obj_szyb_zasypany")), 0.95)
    bb = a.getbbox()
    bz = z.getbbox()
    # the same crop box for both (the edit keeps the layout) so the rock does not jump between the states
    box = (min(bb[0], bz[0]), min(bb[1], bz[1]), max(bb[2], bz[2]), max(bb[3], bz[3]))
    ca = in_cell(a.crop(box), 96, 96)
    cz = in_cell(z.crop(box), 96, 96)
    sheet([[ca] * 3, [cz] * 3, [ca] * 3, [cz] * 3], 96, 96, "!$Lud_Szyb")


# ------------------------------------------------------------------ 2 szałas węglarza (144 x 96)
@builder
def szalas():
    im = crop(soften(clean(raw("obj_szalas_a")), 0.92))
    sheet(same(in_cell(im, 144, 96, shadow=(64, 5, 70))), 144, 96, "!$Lud_Szalas")


# ------------------------------------------------------------------ 3 koszar (240 x 192, 5 x 4 pola)
def insert_cols(im, x0, n):
    """n columns x0..x0+n-1 repeated (the wicker between two stakes gets longer)."""
    a = np.array(im)
    return Image.fromarray(np.concatenate([a[:, :x0 + n], a[:, x0:x0 + n], a[:, x0 + n:]], axis=1), "RGBA")


def insert_rows(im, y0, n):
    a = np.array(im)
    return Image.fromarray(np.concatenate([a[:y0 + n], a[y0:y0 + n], a[y0 + n:]], axis=0), "RGBA")


@builder
def koszar():
    """The raw pen is ~4 x 3.5 tiles; the wicker between the stakes is lengthened (columns/rows with no stake in them repeated)
    so the fences stand on the ring of border tiles of the 5 x 4 footprint: the left and right fences on the middle of columns 0
    and 4 (x 24 and 216), the back fence's foot at y ~39 (row 0), the front fence's foot at y ~178 (row 3), the gate gap in the
    middle tile of the front row (x 96-144). The inside stays transparent (the map's grass)."""
    im = soften(clean(raw("obj_koszar_a")), 0.92)
    im = insert_cols(im, 140, 11)      # (right of the gate: back fence between stakes 126/181, front between 125/198)
    im = insert_cols(im, 40, 10)       # (left of the gate: back fence between stakes 23/72, front between 13/83)
    im = insert_rows(im, 95, 18)       # (the side fences between the stakes at y 90 and 117)
    bb = im.getbbox()
    im = im.crop(bb)
    LEFT_FENCE = 19 - bb[0]            # (the left fence's middle in the cropped picture)
    cell = Image.new("RGBA", (240, 192), (0, 0, 0, 0))
    cell.alpha_composite(im, (24 - LEFT_FENCE, 192 - im.height))
    sheet(same(cell), 240, 192, "!$Lud_Koszar")


# ------------------------------------------------------------------ 4 wóz handlarza (144 x 96, bokiem, przód w lewo)
@builder
def woz():
    im = crop(soften(clean(raw("obj_woz_a")), 0.92))
    sheet(same(in_cell(im, 144, 96, shadow=(58, 5, 80))), 144, 96, "!$Lud_Woz")


# ------------------------------------------------------------------ 5 osioł (64 x 64, bokiem, łeb w lewo)
def move_px(im, box, dx, dy, where=None):
    """Pixels inside box (x0, y0, x1, y1 inclusive) moved by dx, dy (where: an extra mask fn(x, y) -> bool); the vacated
    pixels become transparent unless something moved onto them."""
    a = np.array(im)
    out = a.copy()
    x0, y0, x1, y1 = box
    pts = [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1) if a[y, x, 3] and (where is None or where(x, y))]
    for x, y in pts:
        out[y, x] = 0
    for x, y in pts:
        out[y + dy, x + dx] = a[y, x]
    return Image.fromarray(out, "RGBA")


@builder
def osiol():
    base = soften(clean(raw("obj_osiol_a")), 0.95)
    # col 1: the tail swings back (its lower part 1 px, the tuft 2 px); col 2: the front ear tips forward
    tail = move_px(base, (54, 38, 61, 45), 1, 0)
    tail = move_px(tail, (54, 46, 61, 53), 2, 0)
    ear = move_px(base, (6, 6, 10, 11), -1, 0)
    bb = base.getbbox()
    bb = (bb[0] - 1, bb[1], bb[2] + 2, bb[3])
    cells = [in_cell(im.crop(bb), 64, 64, shadow=(24, 3, 70)) for im in (base, tail, ear)]
    sheet([cells, cells, cells, cells], 64, 64, "!$Lud_Osiol")


# ------------------------------------------------------------------ 7 wylot jaskini (96 x 96)
@builder
def jaskinia():
    im = crop(soften(clean(raw("obj_jaskinia_a")), 0.92))
    sheet(same(in_cell(im, 96, 96)), 96, 96, "!$Lud_Jaskinia")


# ------------------------------------------------------------------ 8 stare krzyże (48 x 72): wiersz 0 zarośnięte, 1 oczyszczone
@builder
def krzyze():
    """The raw pictures hold the three crosses side by side, one in each 48 px third; each third is cut out on its own and put
    in its cell at the bottom, centred (the cleaned edit keeps the layout, so the same cross is in the same column)."""
    rows = []
    for name in ("obj_krzyze_a", "obj_krzyze_czyste"):
        im = soften(clean(raw(name)), 0.93)
        row = []
        for c in range(3):
            part = im.crop((c * 48, 0, c * 48 + 48, 72))
            bb = part.getbbox()
            row.append(in_cell(part.crop(bb), 48, 72, shadow=(17, 3, 60)))
        rows.append(row)
    sheet([rows[0], rows[1], rows[0], rows[1]], 48, 72, "!$Lud_KrzyzStary")


# ------------------------------------------------------------------ 9 ławka (96 x 48)
@builder
def lawka():
    """The raw bench is 64 px wide (1.3 tiles): the plank between the stumps is lengthened (18 columns repeated) to ~82 px."""
    im = soften(clean(raw("obj_lawka_a")), 0.95)
    im = insert_cols(im, 38, 18)
    sheet(same(in_cell(crop(im), 96, 48, bottom=2, shadow=(38, 4, 70))), 96, 48, "!$Lud_Lawka")


# ------------------------------------------------------------------ 11 skrzynia przemytnika (48 x 48): wiersz 0 zamknięta, 1 otwarta
def open_chest(im):
    """The lid taken off (no generation): everything above the iron rim goes, and the open box's top is painted in its place -
    a wooden rim with iron corners round a dark, empty inside (the back inner wall a little lighter)."""
    from PIL import ImageDraw
    a = np.array(im)
    a[:22] = 0
    out = Image.fromarray(a, "RGBA")
    d = ImageDraw.Draw(out)
    OUT, RIM, RIM_L, INS, INS_B, IRON = (22, 16, 22, 255), (104, 66, 40, 255), (138, 92, 56, 255), (22, 14, 10, 255), (58, 38, 26, 255), \
        (150, 150, 162, 255)
    d.polygon([(9, 12), (37, 12), (38, 24), (8, 24)], fill=RIM, outline=OUT)
    d.line([(10, 13), (36, 13)], fill=RIM_L)
    d.polygon([(12, 14), (34, 14), (35, 22), (11, 22)], fill=INS, outline=OUT)
    for y in (15, 16, 17):
        d.line([(13, y), (33, y)], fill=INS_B)                       # (the back inner wall, lit from above)
    d.line([(13, 17), (33, 17)], fill=(46, 30, 20, 255))
    for x in (20, 27):
        d.line([(x, 15), (x, 17)], fill=(34, 22, 16, 255))          # (its plank seams)
    for x, y in ((9, 13), (10, 13), (36, 13), (37, 13), (8, 23), (9, 23), (37, 23), (38, 23)):
        out.putpixel((x, y), IRON)
    return out


@builder
def skrzynia():
    shut = clean(raw("obj_skrzynia_a"))
    opened = open_chest(shut)
    shut, opened = soften(shut, 0.95), soften(opened, 0.95)
    bb = shut.getbbox()
    cells = []
    for im in (shut, opened):
        c = Image.new("RGBA", (48, 48), (0, 0, 0, 0))
        c.alpha_composite(ground_shadow(48, 48, 16, 3, cy=46, alpha=70))
        c.alpha_composite(im, ((48 - (bb[2] - bb[0])) // 2 - bb[0], 47 - bb[3]))     # (the same place for both: the box does not jump)
        cells.append(c)
    sheet([[cells[0]] * 3, [cells[1]] * 3, [cells[0]] * 3, [cells[1]] * 3], 48, 48, "!$Lud_Skrzynia")


# ------------------------------------------------------------------ 12 stół z rejestrem (96 x 64)
@builder
def stol():
    im = crop(soften(clean(raw("obj_stol_a")), 0.95))
    sheet(same(in_cell(im, 96, 64, shadow=(38, 4, 80))), 96, 64, "!$Lud_Stol")


# ------------------------------------------------------------------ 10 juk handlarza (48 x 48, leży na ziemi)
@builder
def juk():
    """obj_juk_b (the second try, the ground-item style of the mushrooms); obj_juk_a (the first, too busy) is not used.
    Lying on the ground: raised 6 px so it lies in the middle of its tile."""
    im = crop(soften(clean(raw("obj_juk_b")), 0.95))
    sheet(same(in_cell(im, 48, 48, bottom=6, shadow=(17, 3, 60))), 48, 48, "!$Lud_Juk")


if __name__ == "__main__":
    names = sys.argv[1:] or list(BUILDERS)
    for n in names:
        try:
            BUILDERS[n]()
        except FileNotFoundError as e:
            print("brak surowego obrazu dla", n, "-", os.path.basename(str(e.filename)))
