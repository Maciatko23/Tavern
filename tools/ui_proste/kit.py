# Wspólne narzędzia makiet „Proste menu P” (docs/ui_proste): tło z gry, czcionki gry, ikony z IconSet, ubrany bohater, prawdziwe dane.
# Dane i zrzuty: tools/ui_proste/capture_obecne.js (nowa gra + rzeczy z pierwszych dni), capture_bohater.js (ubrany Hero_Walk i popiersie).
# Ekran gry 1280 x 720 (data/System.json). Czcionka gry: Alegreya Sans (fonts/).
import os
import sys
import json
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
RAW = os.path.join(HERE, "zrzuty")
OUT = os.path.join(ROOT, "docs", "ui_proste")
sys.path.insert(0, os.path.join(ROOT, "tools", "ui_pomysly"))
import uikit as U   # noqa: E402  (icon_key / icon_bare: ikony RTP bez ramki)

W, H = 1280, 720
D = json.load(open(os.path.join(RAW, "dane.json"), encoding="utf8"))

# ------------------------------------------------------------------ kolory (ciemne propozycje 1-3)
TEXT = (242, 236, 226)
MUTED = (166, 160, 150)
DIM = (110, 106, 100)
PANEL = (22, 23, 27, 238)
PANEL2 = (34, 36, 41, 255)
LINE = (58, 60, 67)
ACC = (214, 142, 88)        # miedź gry (#d08a5a, trochę jaśniej)
ACC_DIM = (92, 66, 50)      # zaznaczenie „tu jestem”, gdy kursor jest w widoku obok
SEL_TEXT = (26, 20, 15)
NEED = {"health": (216, 96, 90), "stamina": (148, 191, 110), "food": (221, 166, 80), "water": (98, 166, 220)}
GREEN = (150, 205, 130)

# ------------------------------------------------------------------ czcionki
FONTS = {"b": "AlegreyaSans-Bold.ttf", "m": "AlegreyaSans-Medium.ttf", "r": "AlegreyaSans-Regular.ttf", "sc": "AlegreyaSansSC-Medium.ttf"}
_fc = {}


def font(kind, size):
    k = (kind, size)
    if k not in _fc:
        _fc[k] = ImageFont.truetype(os.path.join(ROOT, "fonts", FONTS[kind]), size)
    return _fc[k]


def tw(s, f):
    return f.getlength(s)


def text(img, xy, s, f, fill, anchor="la"):
    """tekst nieprzezroczystym kolorem (na nieprzezroczystym tle PIL miesza brzegi poprawnie)"""
    fill = tuple(fill[:3]) + (255,)
    ImageDraw.Draw(img).text(xy, s, font=f, fill=fill, anchor=anchor)


def wrap(s, f, width):
    out, cur = [], ""
    for w_ in s.split():
        t = (cur + " " + w_).strip()
        if tw(t, f) <= width:
            cur = t
        else:
            out.append(cur)
            cur = w_
    if cur:
        out.append(cur)
    return out


def para(img, x, y, s, f, fill, width, lh=None):
    lh = lh or int(f.size * 1.32)
    for ln in wrap(s, f, width):
        text(img, (x, y), ln, f, fill)
        y += lh
    return y


# ------------------------------------------------------------------ kształty (półprzezroczyste: na osobnej warstwie)
def rrect(img, box, r=10, fill=None, outline=None, width=1):
    x0, y0, x1, y1 = [int(v) for v in box]
    lay = Image.new("RGBA", (x1 - x0 + 1, y1 - y0 + 1), (0, 0, 0, 0))
    ImageDraw.Draw(lay).rounded_rectangle((0, 0, x1 - x0, y1 - y0), r, fill=fill, outline=outline, width=width)
    img.alpha_composite(lay, (x0, y0))


def rect(img, box, fill):
    rrect(img, box, 0, fill)


def shadow(img, box, r=12, off=6, blur=10, a=120):
    x0, y0, x1, y1 = [int(v) for v in box]
    pad = blur * 2
    lay = Image.new("RGBA", (x1 - x0 + pad * 2, y1 - y0 + pad * 2), (0, 0, 0, 0))
    ImageDraw.Draw(lay).rounded_rectangle((pad, pad, pad + x1 - x0, pad + y1 - y0), r, fill=(0, 0, 0, a))
    lay = lay.filter(ImageFilter.GaussianBlur(blur))
    img.alpha_composite(lay, (x0 - pad, y0 - pad + off))


def hline(img, x0, x1, y, col=LINE):
    ImageDraw.Draw(img).line((x0, y, x1, y), fill=tuple(col[:3]) + (255,), width=1)


def vline(img, x, y0, y1, col=LINE):
    ImageDraw.Draw(img).line((x, y0, x, y1), fill=tuple(col[:3]) + (255,), width=1)


def meter(img, x, y, w, h, ratio, col, track=(52, 54, 60)):
    rrect(img, (x, y, x + w, y + h), h // 2, tuple(track[:3]) + (255,))
    if ratio > 0:
        rrect(img, (x, y, x + max(h, int(w * ratio)), y + h), h // 2, tuple(col[:3]) + (255,))


# ------------------------------------------------------------------ obrazy z gry
_img = {}


def load(path):
    if path not in _img:
        _img[path] = Image.open(path).convert("RGBA")
    return _img[path].copy()


def background(dim=0.30, blur=0.0, sat=1.0):
    im = load(os.path.join(RAW, "tlo_mapa.png"))
    if blur:
        im = im.filter(ImageFilter.GaussianBlur(blur))
    if sat != 1.0:
        im = ImageEnhance.Color(im).enhance(sat)
    return ImageEnhance.Brightness(im).enhance(dim).convert("RGBA")


def icon(i, scale=1):
    return U.icon(i, scale)


def fade(im, a):
    im = im.copy()
    im.putalpha(im.getchannel("A").point(lambda v: int(v * a)))
    return im


def put(img, im, x, y, alpha=1.0):
    img.alpha_composite(fade(im, alpha) if alpha < 1 else im, (int(x), int(y)))


def put_c(img, im, cx, cy):
    img.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))


def hero_frame():
    return load(os.path.join(RAW, "hero_walk_ubrany.png")).crop((0, 0, 64, 64))


def hero_figure(scale=4):
    f = hero_frame()
    bb = f.getbbox()
    f = f.crop(bb)
    return f.resize((f.width * scale, f.height * scale), Image.NEAREST)


def hero_head(scale=2):
    """głowa i ramiona ubranego bohatera, 32 x 32 (ikona „Postać”)"""
    f = hero_frame()
    bb = f.getbbox()
    cx = (bb[0] + bb[2]) // 2
    t = f.crop((cx - 16, bb[1], cx + 16, bb[1] + 32))
    return t.resize((32 * scale, 32 * scale), Image.NEAREST)


def bust(h):
    b = load(os.path.join(RAW, "hero_bust_ubrany.png"))
    return b.resize((int(b.width * h / b.height), h), Image.LANCZOS)


# ------------------------------------------------------------------ menu: 7 pozycji, ikony z gry
MENU = [
    ("postac", "Postać", "Statystyki i ekwipunek"),
    ("umiejetnosci", "Umiejętności", "10 dziedzin, punkty"),
    ("plecak", "Plecak", "Rzeczy, jedzenie, narzędzia"),
    ("dziennik", "Dziennik", "Cele i notatki"),
    ("opcje", "Opcje", "Obraz, dźwięk, sterowanie"),
    ("zapisz", "Zapisz grę", "Pliki zapisu"),
    ("wyjdz", "Wyjdź", "Do ekranu tytułowego"),
]


def menu_icon(key, scale=2):
    if key == "postac":
        return hero_head(scale)
    if key == "umiejetnosci":
        im = U.icon_key(89, "dark")
    elif key == "plecak":
        im = icon(370)
    elif key == "ekwipunek":   # (Lista v2: skórzana kurtka)
        im = icon(435)
    elif key == "dziennik":
        im = icon(499)
    elif key == "opcje":
        im = U.icon_key(83, "dark")
    elif key == "zapisz":
        im = icon(455)
    else:
        im = U.icon_key(197, "green")
    return im.resize((32 * scale, 32 * scale), Image.NEAREST)


def need_icon(key, scale=1):
    if key == "health":
        im = U.icon_key(84, "dark")
    elif key == "stamina":
        im = U.icon_bare(82)
    elif key == "food":
        im = icon(390)
    else:
        im = icon(391)
    return im.resize((32 * scale, 32 * scale), Image.NEAREST) if scale != 1 else im


# ------------------------------------------------------------------ prawdziwe dane (nowa gra, dzień 1)
ITEMS = {it["id"]: it for it in D["items"]}
NEEDS = [("health", "Życie", "100%", 1.0), ("stamina", "Kondycja", "84", 0.84),
         ("food", "Sytość", "72", 0.72), ("water", "Nawodnienie", "58", 0.58)]
HERO = dict(name=D["name"], level=D["hero"]["level"], xp=D["hero"]["xp"], next=500, gold=D["gold"],
            debt_left=D["debt"]["left"], debt_days=D["debt"]["days"], day=D["day"], season="wiosna", time="10:07",
            place=D["map"], load=tuple(D["weight"]))
ATTRS = [("Siła", 5), ("Zręczność", 5), ("Kondycja", 5), ("Czujność", 5), ("Hart ducha", 5)]
# grupy plecaka jak w grze (MenuRing: Narzędzia i broń / Jedzenie / Picie / Materiały / Pamiątki); ubiór przy narzędziach
BAG = [
    ("Narzędzia i ubiór", [60, 90, 260, 270, 275, 277]),
    ("Jedzenie", [131, 102, 139, 103]),
    ("Picie", [129]),
    ("Materiały", [64, 77, 61, 92, 149]),
    ("Pamiątki", [172]),
]
WORN = {60: "w ręce", 260: "na sobie", 270: "na sobie", 275: "na sobie", 277: "na sobie"}
SHORT = {260: "Lniana koszula", 270: "Płócienne spodnie", 275: "Łapcie z łyka", 277: "Skórzany pas", 60: "Kamienna siekiera"}
# miejsca ekwipunku (Equipment.js + ubiór Ubior_Data: głowa, tors, nogi, stopy, pas, rękawice, plecy)
SLOTS = [("head", "Głowa", 0), ("cloak", "Płaszcz", 0), ("torso", "Tors", 260), ("hands", "Rękawice", 0), ("belt", "Pas", 277),
         ("legs", "Nogi", 270), ("feet", "Stopy", 275), ("back", "Plecy", 0), ("right", "Prawa ręka", 60), ("left", "Lewa ręka", 0),
         ("extra", "Dodatek", 0)]
GOALS = [(g["label"], g["icon"], g["mark"]) for g in D["goals"]]
TRACKED_TEXT = ("Z podwórza na południe, leśną drogą do Polnej, stamtąd na południe na skraj lasu i dalej na zachód, do Kruczego Jaru. "
                "Budować wolno ci tylko na działce - w obrębie muru.")
TREES = [("Walka wręcz", 19), ("Obrona", 25), ("Strzelectwo", 19), ("Przetrwanie", 25), ("Zbieractwo", 22), ("Łowiectwo", 21),
         ("Rolnictwo", 21), ("Rzemiosło", 17), ("Budownictwo", 12), ("Kuchnia", 16)]


def item_name(i):
    return ITEMS[i]["name"]


def item_icon(i, scale=1):
    return icon(ITEMS[i]["icon"], scale)


def count(i):
    return ITEMS[i]["n"]


# ------------------------------------------------------------------ pasek klawiszy na dole (stały, czytelny)
def keycap(img, x, cy, label, f=None, fill=(236, 230, 218), ink=SEL_TEXT, h=34):
    f = f or font("b", 22)
    w = max(h, int(tw(label, f)) + 18)
    rrect(img, (x, cy - h // 2, x + w, cy + h // 2), 7, tuple(fill) + (255,) if len(fill) == 3 else fill)
    text(img, (x + w / 2, cy + 1), label, f, ink, anchor="mm")
    return w


def keybar(img, pairs, y=None, strip=(10, 10, 12, 230), line=LINE, lab=TEXT, cap=(236, 230, 218), ink=SEL_TEXT, h=56):
    """pairs: [("O", "wybierz"), ("P", "wróć")] - na środku dołu ekranu"""
    y = H - h if y is None else y
    if strip:
        rect(img, (0, y, W - 1, y + h - 1), strip)
        if line:
            hline(img, 0, W - 1, y, line)
    fl = font("m", 23)
    widths = []
    for k, t in pairs:
        widths.append(max(34, int(tw(k, font("b", 22))) + 18) + 10 + int(tw(t, fl)))
    gap = 44
    x = (W - (sum(widths) + gap * (len(pairs) - 1))) / 2
    cy = y + h // 2
    for (k, t), wd in zip(pairs, widths):
        kw = keycap(img, x, cy, k, fill=cap, ink=ink)
        text(img, (x + kw + 10, cy + 1), t, fl, lab, anchor="lm")
        x += wd + gap


def save(img, name):
    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, name)
    img.convert("RGB").save(p, optimize=True)
    print("zapisano", p)
    return p
