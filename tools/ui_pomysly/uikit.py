# Wspólne narzędzia makiet UI (docs/ui_pomysly): tła ze zrzutów gry, ikony z IconSet, czcionki, tekstury pikselowe, ramki.
# Wszystko rysowane w 1x pikselu (jak drzewa i budynki w grze); tekst wygładzony jak w grze (TTF), czcionka pikselowa bez wygładzania.
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SHOTS = os.path.join(HERE, "zrzuty")
OUT = os.path.join(ROOT, "docs", "ui_pomysly")
FONTS_GAME = os.path.join(ROOT, "fonts")
FONTS_NEW = os.path.join(HERE, "fonts")
W, H = 1280, 720

# ------------------------------------------------------------------ dane z gry (zapis day40_farm, godz. 11:05)
D = dict(
    hour="11:05", phase="Południe", day=40, season="Lato", hand=11 + 5 / 60,
    health=0.78, stamina=0.70, food=0.64, water=0.41, load=(41, 120), level=6, xp=0.72, gold=330,
    goal="Znajdź pracę w tawernie", goal_sub="Borgar z „Pod Złotym Kuflem” szuka rąk do pracy.",
    goal_icon=337, map="Pole dziadka", popup="Chce ci się pić", popup_icon=391,
    gains=[(381, "+6 Drewno"), (319, "+4 Kamień"), (332, "+8 Gałęzie")],
    hero=(680, 345), hero_feet=(680, 378),
    name="Reid", debt=(1250, 2500),
)
# plecak (prawdziwa zawartość zapisu): id, nazwa, ikona, ile, waga
BAG = [
    (61, "Drewno", 381, 11), (64, "Kamień", 319, 12), (67, "Nasiona ziemniaka", 322, 3), (70, "Nasiona jęczmienia", 325, 6),
    (77, "Gałęzie", 332, 18), (80, "Deski", 336, 12), (86, "Żelazo", 342, 3), (88, "Gwoździe", 344, 20),
    (95, "Pieczone mięso zająca", 351, 2), (102, "Jagody", 358, 6), (109, "Zupa", 365, 1), (139, "Dzikie jabłka", 401, 5),
    (127, "Strzały", 387, 12), (122, "Zepsute jedzenie", 382, 1), (129, "Bukłak", 389, 1),
]
TOOLS = [(60, "Kamienna siekiera", 377), (63, "Kamienny kilof", 378), (62, "Kamienna łopata", 379), (65, "Grabie", 320),
         (66, "Motyka", 321), (87, "Konewka", 343), (89, "Młotek", 345), (90, "Nóż kamienny", 346), (118, "Piła", 374),
         (125, "Proca", 385), (154, "Oszczep", 416)]
DESC = {
    67: ("Nasiona ziemniaka", "Sadzeniaki. Ziemniaki dojrzewają cztery dni.", "Waga: 1"),
    102: ("Jagody", "Dzikie jagody. Słodkie i sycące, ale na chwilę.", "Najstarsza sztuka zepsuje się za 3 dni."),
    61: ("Drewno", "Świeżo ścięte drewno. Nadaje się na opał.", "Waga: 2"),
}
GOALS = [  # (ikona, nazwa, zrobione)
    (337, "Znajdź pracę w tawernie", False), (330 + 6, "Zbierz len", False), (389, "Napij się wody", False),
    (380, "Prześpij noc na legowisku", False), (313, "Spłać dług dziadka (1250/2500)", False), (345, "Napraw narzędzie", False),
    (334, "Wypal węgiel drzewny", True), (340, "Wypal cegły", True), (342, "Wydobądź rudę żelaza", False),
]
GOALS[1] = (348, "Zbierz len", False)
GOALS[3] = (388, "Prześpij noc na legowisku", False)
JTABS = ["Cele", "Surowce", "Budynki", "Receptury", "Notatki", "Zapasy", "Zlecenia", "Miasteczko"]

# ------------------------------------------------------------------ obrazy
_cache = {}
def load(path):
    if path not in _cache:
        _cache[path] = Image.open(path).convert("RGBA")
    return _cache[path].copy()

def bg_map():
    return load(os.path.join(SHOTS, "mapa_bez_hud.png"))

def bg_hud_now():
    return load(os.path.join(SHOTS, "mapa_hud.png"))

def bg_menu(dim=0.55, blur=2.0, tint=(0, 0, 0)):
    im = bg_map().filter(ImageFilter.GaussianBlur(blur))
    ov = Image.new("RGBA", im.size, tint + (int(255 * dim),))
    im.alpha_composite(ov)
    return im

def minimap():
    # wnętrze minimapy z zrzutu gry (sama mapa, bez ramki)
    return bg_hud_now().crop((1063, 17, 1257, 164))

def icon(i, scale=1):
    s = load(os.path.join(ROOT, "img", "system", "IconSet.png"))
    t = s.crop(((i % 16) * 32, (i // 16) * 32, (i % 16) * 32 + 32, (i // 16) * 32 + 32))
    if scale != 1:
        t = t.resize((int(32 * scale), int(32 * scale)), Image.NEAREST)
    return t

def hero_bust():
    return load(os.path.join(ROOT, "img", "pictures", "Hero_Bust.png"))

def hero_sprite(row=0, col=1):
    s = load(os.path.join(ROOT, "img", "characters", "Hero_Walk.png"))
    return s.crop((col * 64, row * 64, col * 64 + 64, row * 64 + 64))

def put(dst, src, xy, alpha=1.0):
    x, y = int(xy[0]), int(xy[1])
    if alpha < 1:
        src = src.copy()
        a = np.array(src)
        a[..., 3] = (a[..., 3] * alpha).astype(np.uint8)
        src = Image.fromarray(a)
    dst.alpha_composite(src, (x, y))

# ------------------------------------------------------------------ czcionki
def font(name, size, wght=None):
    for d in (FONTS_GAME, FONTS_NEW):
        p = os.path.join(d, name)
        if os.path.exists(p):
            f = ImageFont.truetype(p, size)
            if wght is not None:
                try:
                    f.set_variation_by_axes([wght])
                except Exception:
                    pass
            return f
    raise FileNotFoundError(name)

def tw(s, f):
    b = f.getbbox(s)
    return b[2] - b[0]

def text(img, xy, s, f, fill, stroke=0, sfill=(0, 0, 0, 255), anchor="la", shadow=None, pixel=False, alpha=1.0):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    if pixel:
        d.fontmode = "1"
    if shadow:
        dx, dy, sc = shadow
        d.text((xy[0] + dx, xy[1] + dy), s, font=f, fill=sc, anchor=anchor, stroke_width=stroke, stroke_fill=sc)
    d.text(xy, s, font=f, fill=fill, anchor=anchor, stroke_width=stroke, stroke_fill=sfill)
    if alpha < 1:
        a = np.array(layer); a[..., 3] = (a[..., 3] * alpha).astype(np.uint8); layer = Image.fromarray(a)
    img.alpha_composite(layer)

def wrap(s, f, width):
    words, lines, cur = s.split(), [], ""
    for w_ in words:
        t = (cur + " " + w_).strip()
        if tw(t, f) <= width:
            cur = t
        else:
            lines.append(cur); cur = w_
    if cur:
        lines.append(cur)
    return lines

# ------------------------------------------------------------------ tekstury (szum wartości, skwantowany do kilku tonów - bez ditheringu)
def noise(w, h, cell=8, seed=0, octaves=3, aniso=(1, 1)):
    rng = np.random.default_rng(seed)
    acc = np.zeros((h, w), np.float32); amp, tot = 1.0, 0.0
    for o in range(octaves):
        cw, ch = max(1, int(cell * aniso[0] / (2 ** o))), max(1, int(cell * aniso[1] / (2 ** o)))
        gw, gh = w // cw + 2, h // ch + 2
        g = rng.random((gh, gw)).astype(np.float32)
        im = Image.fromarray((g * 255).astype(np.uint8)).resize((gw * cw, gh * ch), Image.BICUBIC)
        acc += np.asarray(im, np.float32)[:h, :w] / 255 * amp
        tot += amp; amp *= 0.5
    acc /= tot
    acc -= acc.min(); acc /= max(1e-6, acc.max())
    return acc

def quant(arr, colors, cuts=None):
    """arr 0..1 -> RGBA z len(colors) tonów (progi równe albo podane)."""
    n = len(colors)
    if cuts is None:
        cuts = [(i + 1) / n for i in range(n - 1)]
    idx = np.digitize(arr, cuts)
    pal = np.array([hexc(c) for c in colors], np.uint8)
    return Image.fromarray(pal[idx], "RGBA")

def hexc(c, a=255):
    if isinstance(c, tuple):
        return c if len(c) == 4 else c + (a,)
    c = c.lstrip("#")
    return (int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16), a)

def mix(a, b, t):
    a, b = hexc(a), hexc(b)
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(4))

# ------------------------------------------------------------------ maski kształtów
def rect_mask(w, h):
    return np.ones((h, w), bool)

def torn_mask(w, h, amp=3, seed=1, cell=6):
    rng = np.random.default_rng(seed)
    def edge(n):
        k = n // cell + 2
        g = rng.random(k)
        x = np.interp(np.arange(n) / cell, np.arange(k), g)
        x += rng.random(n) * 0.35   # drobne ząbki
        return np.round(x / 1.35 * amp).astype(int)
    top, bot, lef, rig = edge(w), edge(w), edge(h), edge(h)
    yy, xx = np.mgrid[0:h, 0:w]
    m = (yy >= top[None, :]) & (yy < h - bot[None, :]) & (xx >= lef[:, None]) & (xx < w - rig[:, None])
    return m

def round_mask(w, h, r):
    m = np.ones((h, w), bool)
    yy, xx = np.mgrid[0:h, 0:w]
    for cx, cy in ((r, r), (w - r - 1, r), (r, h - r - 1), (w - r - 1, h - r - 1)):
        corner = ((xx < r) if cx == r else (xx > w - r - 1)) & ((yy < r) if cy == r else (yy > h - r - 1))
        m &= ~(corner & (((xx - cx) ** 2 + (yy - cy) ** 2) > r * r + r * 0.6))
    return m

def cut_mask(w, h, c):
    yy, xx = np.mgrid[0:h, 0:w]
    m = np.ones((h, w), bool)
    m &= ~((xx + yy) < c)
    m &= ~(((w - 1 - xx) + yy) < c)
    m &= ~((xx + (h - 1 - yy)) < c)
    m &= ~(((w - 1 - xx) + (h - 1 - yy)) < c)
    return m

def circle_mask(d):
    yy, xx = np.mgrid[0:d, 0:d]
    c = (d - 1) / 2
    return ((xx - c) ** 2 + (yy - c) ** 2) <= (d / 2) ** 2 - 0.5

def erode(m, n=1):
    for _ in range(n):
        e = m.copy()
        e[1:, :] &= m[:-1, :]; e[:-1, :] &= m[1:, :]; e[:, 1:] &= m[:, :-1]; e[:, :-1] &= m[:, 1:]
        e[0, :] = False; e[-1, :] = False; e[:, 0] = False; e[:, -1] = False
        m = e
    return m

def ring(m, n=1):
    """krawędź maski grubości n (piksele maski, które sąsiadują z zewnętrzem)"""
    return m & ~erode(m, n)

def dist_in(m, maxd=8):
    """odległość (w pikselach, 4-sąsiedztwo) od brzegu maski, ucięta na maxd"""
    d = np.zeros(m.shape, np.int32)
    cur = m.copy()
    for i in range(maxd):
        d[cur] += 1
        cur = erode(cur)
        if not cur.any():
            break
    return d

def paint(img, mask, color, xy=(0, 0)):
    """maluje kolor tam, gdzie maska (mask w układzie img od xy)"""
    h, w = mask.shape
    lay = np.zeros((h, w, 4), np.uint8)
    lay[mask] = hexc(color)
    img.alpha_composite(Image.fromarray(lay, "RGBA"), (int(xy[0]), int(xy[1])))

def paint_tex(img, mask, tex, xy=(0, 0)):
    a = np.array(tex.convert("RGBA"))
    a[~mask] = 0
    img.alpha_composite(Image.fromarray(a, "RGBA"), (int(xy[0]), int(xy[1])))

def soft_shadow(img, mask, xy, off=(3, 4), alpha=110, blur=4):
    h, w = mask.shape
    pad = blur * 3
    sh = Image.new("L", (w + 2 * pad, h + 2 * pad), 0)
    sh.paste(Image.fromarray((mask * alpha).astype(np.uint8)), (pad, pad))
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    lay = Image.new("RGBA", sh.size, (0, 0, 0, 0))
    lay.putalpha(sh)
    img.alpha_composite(lay, (int(xy[0] + off[0] - pad), int(xy[1] + off[1] - pad)))

def hard_shadow(img, mask, xy, off=(2, 2), color=(0, 0, 0, 90)):
    paint(img, mask, color, (xy[0] + off[0], xy[1] + off[1]))

def line(img, pts, color, width=1):
    d = ImageDraw.Draw(img)
    d.line(pts, fill=hexc(color), width=width)

def rect(img, box, color, outline=None):
    d = ImageDraw.Draw(img)
    d.rectangle(box, fill=hexc(color) if color else None, outline=hexc(outline) if outline else None)

def dashed(img, x0, y0, x1, y1, color, dash=3, gap=2, shadow=None):
    d = ImageDraw.Draw(img)
    n = int(max(abs(x1 - x0), abs(y1 - y0)))
    on = True; k = 0
    for i in range(n + 1):
        x = round(x0 + (x1 - x0) * i / max(1, n)); y = round(y0 + (y1 - y0) * i / max(1, n))
        if on:
            if shadow:
                d.point((x + 1, y + 1), fill=hexc(shadow))
            d.point((x, y), fill=hexc(color))
        k += 1
        if (on and k >= dash) or (not on and k >= gap):
            on = not on; k = 0

def dashed_mask_edge(img, mask, xy, inset, color, dash=4, gap=3, shadow=None):
    """ścieg wzdłuż kształtu maski (inset px od brzegu)"""
    inner = erode(mask, inset)
    edge = ring(inner, 1)
    ys, xs = np.nonzero(edge)
    # porządek wzdłuż obwodu: po kącie od środka
    cy, cx = mask.shape[0] / 2, mask.shape[1] / 2
    ang = np.arctan2((ys - cy) / mask.shape[0], (xs - cx) / mask.shape[1])
    order = np.argsort(ang)
    d = ImageDraw.Draw(img)
    period = dash + gap
    for k, i in enumerate(order):
        if k % period < dash:
            if shadow:
                d.point((xy[0] + xs[i] + 1, xy[1] + ys[i] + 1), fill=hexc(shadow))
            d.point((xy[0] + xs[i], xy[1] + ys[i]), fill=hexc(color))

def gauge_bands(img, box, ratio, colors, bg, notch=None, notch_color=None):
    """pasek wypełniony pionowymi pasmami tonów (góra jasna -> dół ciemny) - pikselowo, bez gradientu"""
    x0, y0, x1, y1 = box
    rect(img, box, bg)
    fw = int(round((x1 - x0 + 1) * max(0, min(1, ratio))))
    if fw > 0:
        h = y1 - y0 + 1
        n = len(colors)
        for i, c in enumerate(colors):
            a = y0 + int(i * h / n); b = y0 + int((i + 1) * h / n) - 1
            rect(img, (x0, a, x0 + fw - 1, b), c)
    if notch:
        for x in range(x0 + notch, x1, notch):
            line(img, [(x, y0), (x, y1)], notch_color or bg)

def save(img, name):
    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, name)
    img.convert("RGB").save(p, optimize=True)
    return p

def caption(img, title, sub=None, f1=None):
    """mały podpis makiety w lewym dolnym rogu (żeby było wiadomo, który to pomysł)"""
    f1 = f1 or font("AlegreyaSans-Medium.ttf", 15)
    s = title + ("  ·  " + sub if sub else "")
    w_ = tw(s, f1) + 16
    lay = Image.new("RGBA", (w_, 22), (0, 0, 0, 150))
    img.alpha_composite(lay, (0, H - 22))
    text(img, (8, H - 19), s, f1, (255, 255, 255, 230))


def icon_bare(i, outline="#1a1410", scale=1):
    """ikona z IconSet bez ramki/tła RTP (zalewanie od brzegów po ciemnych i szarych pikselach) + 1 px obrys"""
    t = np.array(icon(i)).astype(np.int32)
    h, w = t.shape[:2]
    r, g, b, a = t[..., 0], t[..., 1], t[..., 2], t[..., 3]
    mx = np.maximum(np.maximum(r, g), b); mn = np.minimum(np.minimum(r, g), b)
    sat = (mx - mn) / np.maximum(mx, 1)
    bgl = (a < 40) | (mx < 95) | (sat < 0.28)
    seen = np.zeros((h, w), bool)
    stack = [(y, x) for y in range(h) for x in (0, w - 1)] + [(y, x) for x in range(w) for y in (0, h - 1)]
    while stack:
        y, x = stack.pop()
        if y < 0 or x < 0 or y >= h or x >= w or seen[y, x] or not bgl[y, x]:
            continue
        seen[y, x] = True
        stack += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
    keep = ~seen & (a > 40)
    keep[:3, :] = False; keep[-3:, :] = False; keep[:, :3] = False; keep[:, -3:] = False   # (resztki ramki RTP przy brzegach)
    out = np.zeros_like(t)
    out[keep] = t[keep]
    if outline:
        k = keep.copy()
        dil = k.copy(); dil[1:] |= k[:-1]; dil[:-1] |= k[1:]; dil[:, 1:] |= k[:, :-1]; dil[:, :-1] |= k[:, 1:]
        edge = dil & ~k
        out[edge] = hexc(outline)
    im = Image.fromarray(out.astype(np.uint8), "RGBA")
    if scale != 1:
        im = im.resize((int(32 * scale), int(32 * scale)), Image.NEAREST)
    return im


def icon_key(i, kind="green", outline="#14100c"):
    """ikona RTP w ramce: tło (zielone / granatowe / ciemne) zalane od ramki do środka, ramka ucięta, 1 px obrys"""
    t = np.array(icon(i)).astype(np.int32)
    h, w = t.shape[:2]
    r, g, b, a = t[..., 0], t[..., 1], t[..., 2], t[..., 3]
    if kind == "green":
        bgl = (g > r + 18) & (g > b + 8)
    elif kind == "purple":
        bgl = (b > g + 25) & (r > g + 10)
    else:   # ciemne / granatowe tło
        bgl = (np.maximum(np.maximum(r, g), b) < 110) | ((b > r + 30) & (b > g + 10) & (b < 200))
    seen = np.zeros((h, w), bool)
    stack = [(y, x) for y in range(3, h - 3) for x in (3, w - 4)] + [(y, x) for x in range(3, w - 3) for y in (3, h - 4)]
    while stack:
        y, x = stack.pop()
        if y < 3 or x < 3 or y >= h - 3 or x >= w - 3 or seen[y, x] or not bgl[y, x]:
            continue
        seen[y, x] = True
        stack += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
    keep = ~seen & (a > 40)
    keep[:3, :] = False; keep[-3:, :] = False; keep[:, :3] = False; keep[:, -3:] = False
    out = np.zeros_like(t); out[keep] = t[keep]
    if outline:
        k = keep
        dil = k.copy(); dil[1:] |= k[:-1]; dil[:-1] |= k[1:]; dil[:, 1:] |= k[:, :-1]; dil[:, :-1] |= k[:, 1:]
        out[dil & ~k] = hexc(outline)
    return Image.fromarray(out.astype(np.uint8), "RGBA")


class Over:
    """rysowanie półprzezroczyste: ImageDraw na pustej warstwie, potem alpha_composite (ImageDraw na RGBA nadpisuje, nie miesza)"""
    def __init__(self, img):
        self.img = img
        self.ov = Image.new("RGBA", img.size, (0, 0, 0, 0))
    def __enter__(self):
        return ImageDraw.Draw(self.ov)
    def __exit__(self, *a):
        self.img.alpha_composite(self.ov)
