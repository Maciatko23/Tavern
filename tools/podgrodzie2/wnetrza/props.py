# python tools/podgrodzie2/wnetrza/props.py  -> img/characters/!Podgrodzie2_Wnetrza.png (NOWY plik) + props_index.json obok
# Rekwizyty wnętrz nowego Podgrodzia (mapy 201-212, docs/podgrodzie/NOWE_PODGRODZIE.md) jako arkusz postaci RPG Maker
# (klatki 144x144: 8 bloków x 3 wzory x 4 kierunki), ułożony tak samo jak !Miasto2_Wnetrza (tools/miasto2/wnetrza/props.py):
# klatka jest wyśrodkowana na kratce zdarzenia; rzecz 1 kratki stoi w środkowej trzeciej części, 2 kratek - w prawych dwóch
# trzecich (zdarzenie stoi na LEWEJ kratce); każda rzecz stoi na dole klatki (= dół kratki zdarzenia).
# Źródła (wygląd Winlu):
#   - PixelLab (props_src/, ZRODLA.txt): piec garncarski (ogień w otworze przemalowany na pomarańczowo i ożywiony w trzech
#     klatkach), koło garncarskie, koza;
#   - kafle Winlu przerobione tutaj: posłanie ze słomy na ziemi (siennik z łóżka C 9,13-15 bez ramy, słoma dookoła),
#     koryto z gliną (koryto z Fantasy_Outside_C, woda -> mokra glina), dzbany wypalone / surowe (dzbany z arkusza D
#     przemalowane na glinę);
#   - narysowane tutaj: zabawki z patyków, grabie i widły oparte o ścianę.
# Nic tu nie nadpisuje istniejących plików gry - arkusz ma nową nazwę. Arkusz !Miasto2_Wnetrza zostaje nietknięty.
import os, sys, json, colorsys, random
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "tavern", "props_upper"))
import make_props as MP     # noqa: E402  (downscale, outline, with_shadow)

SRC = os.path.join(HERE, "props_src")
SHEET_NAME = "!Podgrodzie2_Wnetrza"
SHEET = os.path.join(ROOT, "img", "characters", SHEET_NAME + ".png")
INDEX = os.path.join(HERE, "props_index.json")
PREVIEW = os.path.join(HERE, "rekwizyty.png")
WINLU_I = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Interior", "Remaster", "tilesets")
TC = os.path.join(WINLU_I, "Fantasy_Inside_C.png")
TD = os.path.join(WINLU_I, "Fantasy_Inside_D.png")
EXT_C = os.path.join(ROOT, "img", "tilesets", "Winlu Fantasy Tileset - Exterior", "Winlu Fantasy Exterior", "tilesets",
                     "Fantasy_Outside_C.png")
F = 144


def crop(path, c, r, w=1, h=1, box=None):
    im = Image.open(path).convert("RGBA").crop((c * 48, r * 48, (c + w) * 48, (r + h) * 48))
    if box: im = im.crop(box)
    bb = im.getbbox()
    return im.crop(bb) if bb else im


def src(name):
    return Image.open(os.path.join(SRC, name)).convert("RGBA")


def frame_xy(idx, d, p):
    return (((idx % 4) * 3 + p) * F, ((idx // 4) * 4 + (d // 2 - 1)) * F)


class Sheet:
    def __init__(self):
        self.im = Image.new("RGBA", (12 * F, 8 * F), (0, 0, 0, 0))
        self.index = {}
        self.used = set()

    def put(self, key, idx, d, p, art, cells_w, place, name, dx=0, dy=0, occupy=None, extra=None, index=True):
        assert (idx, d, p) not in self.used, (key, idx, d, p)
        self.used.add((idx, d, p))
        fr = Image.new("RGBA", (F, F), (0, 0, 0, 0))
        left = {1: 48, 2: 48, 3: 0}[cells_w]
        span = cells_w * 48
        x = left + (span - art.width) // 2 + dx
        y = F - art.height + dy
        if y < 0:
            art = art.crop((0, -y, art.width, art.height)); y = 0
        fr.alpha_composite(art, (x, y))
        fx, fy = frame_xy(idx, d, p)
        self.im.alpha_composite(fr, (fx, fy))
        if not index: return
        bb = fr.getbbox() or (0, 0, 1, 1)
        e = {"sheet": SHEET_NAME, "index": idx, "direction": d, "pattern": p, "place": place, "w": F, "h": F,
             "art": list(bb), "name": name}
        if occupy: e["occupy"] = occupy
        if extra: e.update(extra)
        self.index[key] = e

    def save(self):
        self.im.save(SHEET)
        with open(INDEX, "wb") as f:
            f.write(json.dumps(self.index, ensure_ascii=False, indent=1).encode("utf-8"))


# ---------------------------------------------------------------------------------------------------- przeróbki
def recolor(im, fn):
    """fn(h, s, v, x, y) -> (h, s, v) albo None (bez zmian); h, s, v w 0..1"""
    out = im.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if not a: continue
            h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
            n = fn(h, s, v, x, y)
            if n is None: continue
            rr, gg, bb = colorsys.hsv_to_rgb(*n)
            px[x, y] = (int(rr * 255), int(gg * 255), int(bb * 255), a)
    return out


DARK = (44, 32, 26, 255)
WOOD, WOOD_L, WOOD_D = (122, 86, 52, 255), (160, 118, 76, 255), (86, 58, 36, 255)


# ---- piec garncarski: ogień w otworze
FIRE_KEYS = {(184, 179, 169): 3, (151, 117, 99): 2, (88, 38, 33): 1}
FIRE_COL = {3: (255, 222, 120, 255), 2: (238, 136, 48, 255), 1: (176, 58, 28, 255), 0: (52, 26, 24, 255)}


def _in_mouth(x, y):
    """otwór paleniska pieca (obrazek PixelLab 96x96): łuk nad prostokątem"""
    if 55 <= y <= 70: return 37 <= x <= 55
    if 49 <= y < 55:
        return (x - 46) ** 2 + (y - 56) ** 2 <= 9.5 ** 2
    return False


def kiln_frames():
    base = src("piec.png")
    px = base.load()
    heat = {}
    for y in range(base.height):
        for x in range(base.width):
            if not _in_mouth(x, y): continue
            r, g, b, a = px[x, y]
            if not a: continue
            heat[(x, y)] = FIRE_KEYS.get((r, g, b), 0)
    frames = []
    for k in range(3):
        im = base.copy(); p2 = im.load()
        for (x, y), hv in heat.items():
            if k == 1 and x % 2 == 1: hv = heat.get((x, y + 1), hv)          # języki ognia w górę (co druga kolumna)
            if k == 2 and x % 2 == 0: hv = heat.get((x, y + 1), hv)
            if k == 2 and x % 3 == 0 and hv == 3: hv = 2
            p2[x, y] = FIRE_COL[hv]
        # żar na dolnym progu otworu
        for x in range(39, 54):
            if (x + k) % 3 == 0 and p2[x, 70][3]: p2[x, 70] = FIRE_COL[2]
        frames.append(im)
    return frames


# ---- posłanie ze słomy na ziemi (siennik z łóżka Winlu bez ramy)
STRAW = [(214, 172, 96, 255), (186, 140, 70, 255), (232, 196, 120, 255), (150, 108, 52, 255)]


def bedding(scale=1.0, blanket=None, seed=1):
    rnd = random.Random(seed)
    inner = Image.open(TC).convert("RGBA").crop((9 * 48 + 4, 14 * 48 + 0, 9 * 48 + 44, 15 * 48 + 30))   # słoma + poduszka + koc
    pi = inner.load()
    for y in range(inner.height - 9, inner.height):          # resztki nóg łóżka w dolnych rogach -> koc
        for x in list(range(0, 6)) + list(range(inner.width - 6, inner.width)):
            pi[x, y] = pi[inner.width // 2, y - 4]
    if blanket:
        inner = recolor(inner, blanket)
    W, H = inner.width + 10, inner.height + 10
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # słoma wystająca spod siennika: nieregularny brzeg
    for y in range(H):
        for x in range(W):
            ex = min(x, W - 1 - x); ey = min(y, H - 1 - y)
            e = min(ex, ey)
            lim = 2 + rnd.randint(0, 3)
            if e >= lim or (e >= 1 and rnd.random() < 0.35):
                im.putpixel((x, y), STRAW[rnd.randint(0, 3)])
    for _ in range(int(W * H * 0.06)):                     # źdźbła
        x, y = rnd.randint(1, W - 3), rnd.randint(1, H - 3)
        c = STRAW[rnd.choice((0, 2, 3))]
        if rnd.random() < 0.5: d.line((x, y, x + 2, y), fill=c)
        else: d.line((x, y, x, y + 2), fill=c)
    im.alpha_composite(inner, (5, 5))
    if scale != 1.0:
        im = MP.downscale(im, scale)
    return MP.outline(im)


def blanket_grey(h, s, v, x, y):
    if 0.02 <= h <= 0.12 and 0.12 < s < 0.6 and v < 0.55 and y > 18:      # brązowy koc -> szary, wytarty
        return (0.6, 0.08, min(1.0, v * 1.1))
    return None


def patch(im, x, y, w, h, col):
    """łata na kocu"""
    d = ImageDraw.Draw(im)
    d.rectangle((x, y, x + w, y + h), fill=col)
    for i in range(x, x + w + 1, 2):
        im.putpixel((i, y), (60, 44, 36, 255)); im.putpixel((i, y + h), (60, 44, 36, 255))
    for j in range(y, y + h + 1, 2):
        im.putpixel((x, j), (60, 44, 36, 255)); im.putpixel((x + w, j), (60, 44, 36, 255))
    return im


# ---- koryto z gliną
def clay_trough():
    t = crop(EXT_C, 9, 2, 2, 1)
    rnd = random.Random(5)

    def fn(h, s, v, x, y):
        if 0.45 <= h <= 0.7 and s > 0.15:                      # woda -> mokra szarobrązowa glina
            n = rnd.uniform(-0.05, 0.05)
            return (0.07, 0.30, max(0.0, min(1.0, v * 0.85 + 0.12 + n)))
        return None
    t = recolor(t, fn)
    d = ImageDraw.Draw(t)
    bb = t.getbbox()
    cx = (bb[0] + bb[2]) // 2
    for (x, y, r) in ((cx - 14, 9, 4), (cx + 6, 8, 5), (cx - 2, 11, 3)):          # bryły gliny
        d.ellipse((x - r, y - r // 2 - 1, x + r, y + r // 2 + 1), fill=(150, 118, 92, 255), outline=(82, 60, 46, 255))
        d.point((x - 1, y - 1), fill=(186, 156, 128, 255))
    return t


# ---- dzbany (arkusz D) przemalowane na glinę
def pots(kind):
    D = Image.open(TD).convert("RGBA")
    parts = [D.crop((1 * 48, 8 * 48, 2 * 48, 9 * 48)), D.crop((4 * 48, 9 * 48, 5 * 48, 10 * 48)), D.crop((5 * 48, 15 * 48, 6 * 48, 16 * 48))]
    parts = [p.crop(p.getbbox()) for p in parts]
    if kind == "wypalone":
        fn = lambda h, s, v, x, y: (0.045, 0.62, min(1.0, v * 0.82 + 0.06)) if s < 0.35 else None
    else:
        fn = lambda h, s, v, x, y: (0.09, 0.16, min(1.0, v * 0.78 + 0.12)) if s < 0.35 else None
    parts = [recolor(p, fn) for p in parts]
    W = sum(p.width for p in parts) - 6
    H = max(p.height for p in parts)
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    x = 0
    for p in parts:
        im.alpha_composite(p, (x, H - p.height)); x += p.width - 3
    return im


# ---- węglarz: kupa węgla drzewnego i okopcone worki (kafle D przemalowane)
def charcoal_heap():
    t = crop(TD, 11, 7, 2, 2)
    rnd = random.Random(9)

    def fn(h, s, v, x, y):
        n = rnd.uniform(-0.03, 0.04)
        return (0.07, 0.18, max(0.0, min(1.0, v * 0.42 + n)))
    return recolor(t, fn)


def coal_sacks():
    t = crop(TD, 8, 2, 2, 2)

    def fn(h, s, v, x, y):
        return (0.08, s * 0.45, v * 0.55)
    t = recolor(t, fn)
    d = ImageDraw.Draw(t)
    rnd = random.Random(4)
    for _ in range(22):                                        # bryłki węgla na wierzchu i u stóp worków
        x, y = rnd.randint(4, t.width - 5), rnd.choice((rnd.randint(2, 10), rnd.randint(t.height - 6, t.height - 2)))
        d.rectangle((x, y, x + 1, y + 1), fill=(28, 24, 24, 255))
    return t


# ---- zabawki z patyków
def toys():
    im = Image.new("RGBA", (44, 28), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    stick, stick_l = (128, 92, 58, 255), (176, 134, 88, 255)
    rag, rag_l, rag_d = (150, 112, 78, 255), (190, 152, 110, 255), (96, 66, 44, 255)
    # konik na patyku (leży ukosem): kij + łeb z gałgana, ucho, grzywa ze słomy, oko
    for i in range(20):
        x, y = 2 + i, 25 - i * 11 // 20
        d.line((x, y - 1, x, y + 1), fill=DARK); im.putpixel((x, y), stick_l)
    hx, hy = 18, 5
    head = [(hx + 0, hy + 6), (hx + 3, hy + 2), (hx + 6, hy + 1), (hx + 10, hy + 3), (hx + 14, hy + 6), (hx + 14, hy + 9),
            (hx + 10, hy + 9), (hx + 6, hy + 11), (hx + 2, hy + 11)]
    d.polygon(head, fill=rag, outline=DARK)
    d.line((hx + 4, hy + 3, hx + 9, hy + 4), fill=rag_l)
    d.polygon([(hx + 4, hy + 2), (hx + 5, hy - 2), (hx + 7, hy + 1)], fill=rag, outline=DARK)      # ucho
    d.point((hx + 9, hy + 5), fill=DARK); d.point((hx + 13, hy + 7), fill=rag_d)                  # oko, chrapy
    for k in range(4):                                                                            # grzywa
        d.line((hx + 1 + k, hy + 4 - k // 2, hx - 1 + k, hy + 1 - k // 2), fill=STRAW[k % 3])
    # laleczka z patyków (krzyżyk) w czerwonej szmatce
    d.line((37, 12, 37, 26), fill=DARK, width=3); d.line((37, 12, 37, 26), fill=stick, width=1)
    d.line((32, 16, 42, 16), fill=DARK, width=3); d.line((32, 16, 42, 16), fill=stick_l, width=1)
    d.polygon([(34, 17), (40, 17), (41, 24), (33, 24)], fill=(156, 66, 52, 255), outline=(84, 36, 30, 255))
    d.ellipse((34, 8, 40, 14), fill=(206, 178, 136, 255), outline=DARK)
    # kółko z kamyków
    for (x, y) in ((4, 5), (9, 2), (14, 4), (13, 10), (6, 11)):
        d.ellipse((x - 2, y - 2, x + 2, y + 2), fill=(156, 152, 142, 255), outline=(66, 62, 58, 255))
        d.point((x - 1, y - 1), fill=(204, 200, 190, 255))
    return im


# ---- grabie i widły oparte o ścianę
def leaning_tool(kind, lean=1):
    im = Image.new("RGBA", (24, 76), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    x0 = 8 if lean > 0 else 15
    top, bot = 20, 74
    for i in range(bot - top):
        x = x0 + lean * i * 4 // (bot - top); y = top + i
        im.putpixel((x - 1, y), DARK); im.putpixel((x, y), WOOD_L); im.putpixel((x + 1, y), WOOD); im.putpixel((x + 2, y), DARK)
    if kind == "grabie":                          # grabie zębami do góry
        d.rectangle((x0 - 8, 14, x0 + 9, 17), fill=WOOD, outline=DARK)
        for tx in range(x0 - 7, x0 + 9, 3):
            d.line((tx, 6, tx, 14), fill=DARK); d.point((tx, 7), fill=WOOD_L)
    else:                                         # widły: trzy żelazne zęby
        iron, iron_l = (110, 114, 122, 255), (168, 172, 180, 255)
        d.rectangle((x0 - 5, 16, x0 + 6, 19), fill=iron, outline=DARK)
        for tx in (x0 - 4, x0, x0 + 4):
            d.line((tx, 2, tx, 16), fill=DARK, width=3); d.line((tx, 3, tx, 15), fill=iron_l)
    return im


def two_tools():
    a, b = leaning_tool("grabie", 1), leaning_tool("widly", -1)
    im = Image.new("RGBA", (40, 76), (0, 0, 0, 0))
    im.alpha_composite(b, (16, 0)); im.alpha_composite(a, (0, 0))
    return im


# ---------------------------------------------------------------------------------------------------- arkusz
def build():
    S = Sheet()
    # ======== blok 0: garncarnia
    kf = kiln_frames()
    for p, fr in enumerate(kf):
        art = MP.with_shadow(fr.crop(fr.getbbox()))
        S.put("piec_garncarski", 0, 2, p, art, 2, "floor", "piec do wypalania garnków (ogień)", occupy="right=1",
              extra={"anim": True}, index=(p == 0))
    if os.path.exists(os.path.join(SRC, "kolo.png")):
        k = src("kolo.png")
        k = MP.with_shadow(MP.outline(MP.downscale(k, 0.78)))
        S.put("kolo_garncarskie", 0, 4, 0, k, 1, "floor", "koło garncarskie z mokrą gliną")
    S.put("koryto_glina", 0, 4, 1, MP.with_shadow(clay_trough()), 2, "floor", "koryto z mokrą gliną", occupy="right=1")
    S.put("dzbany_wypalone", 0, 4, 2, pots("wypalone"), 1, "table", "wypalone dzbany i garnki")
    S.put("dzbany_surowe", 0, 6, 0, pots("surowe"), 1, "table", "surowe dzbany (schną przed wypałem)")
    S.put("dzbany_podloga", 0, 6, 1, MP.with_shadow(pots("wypalone")), 1, "floor", "wypalone garnki na podłodze")
    # ======== blok 1: domy biedoty
    b1 = MP.with_shadow(bedding(seed=3))
    S.put("poslanie", 1, 2, 0, b1, 1, "floor", "posłanie ze słomy na ziemi", occupy="up=1")
    b2 = bedding(blanket=blanket_grey, seed=7)
    b2 = patch(b2, 12, 44, 8, 6, (120, 84, 60, 255)); b2 = patch(b2, 26, 60, 7, 7, (96, 104, 84, 255))
    S.put("poslanie_szare", 1, 2, 1, MP.with_shadow(b2), 1, "floor", "posłanie ze słomy z połatanym kocem", occupy="up=1")
    b3 = MP.with_shadow(bedding(scale=0.72, seed=11))
    S.put("poslanie_male", 1, 2, 2, b3, 1, "floor", "małe posłanie dziecka", occupy="up=1")
    S.put("zabawki", 1, 4, 0, toys(), 1, "decal", "zabawki z patyków i kamyków")
    if os.path.exists(os.path.join(SRC, "koza.png")):
        kz = MP.downscale(src("koza.png"), 0.8)
        S.put("koza", 1, 6, 0, MP.with_shadow(kz), 1, "floor", "koza (głową w lewo)")
        S.put("koza_prawo", 1, 6, 1, MP.with_shadow(kz.transpose(Image.FLIP_LEFT_RIGHT)), 1, "floor", "koza (głową w prawo)")
    S.put("kupa_wegla", 1, 8, 0, charcoal_heap(), 2, "floor", "kupa węgla drzewnego", occupy="right=1")
    S.put("worki_wegla", 1, 8, 1, coal_sacks(), 2, "floor", "worki z węglem drzewnym", occupy="right=1")
    # ======== blok 2: szopa
    S.put("grabie", 2, 2, 0, MP.with_shadow(leaning_tool("grabie")), 1, "floor", "grabie oparte o ścianę")
    S.put("widly", 2, 2, 1, MP.with_shadow(leaning_tool("widly", -1)), 1, "floor", "widły oparte o ścianę")
    S.put("grabie_widly", 2, 2, 2, MP.with_shadow(two_tools()), 1, "floor", "grabie i widły oparte o ścianę")
    S.save()
    pv = Image.new("RGBA", S.im.size, (70, 60, 70, 255)); pv.alpha_composite(S.im)
    dr = ImageDraw.Draw(pv)
    for k, v in S.index.items():
        fx, fy = frame_xy(v["index"], v["direction"], v["pattern"])
        dr.rectangle((fx, fy, fx + F - 1, fy + F - 1), outline=(20, 20, 20))
        dr.text((fx + 3, fy + 3), k, fill=(255, 255, 0))
    bb = pv.getbbox()
    pv.crop((0, 0, 12 * F, 4 * F)).convert("RGB").save(PREVIEW)
    print("%s: %d rekwizytów -> %s" % (SHEET_NAME, len(S.index), os.path.relpath(SHEET, ROOT)))


if __name__ == "__main__":
    build()
