# Runda 2 makiet UI (docs/ui_pomysly2): wspólne dane i układ według zasad użytkownika (2026-10-08):
#  - 4 paski (życie, kondycja, sytość, nawodnienie) zawsze w LEWYM DOLNYM rogu, w każdym pomyśle inaczej ułożone;
#  - okrągły kompas w PRAWYM GÓRNYM rogu (N E S W, strzałka do celu, pod nim „Tawerna · 151 kroków” i obciążenie);
#  - w lewym górnym rogu mały ZEGAR ZE WSKAZÓWKAMI (zamiast cyfr) przy tytule celu (bez opisu).
import os, sys, math
HERE2 = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE2, "..", "ui_pomysly"))
from uikit import *   # noqa: F401,F403  (tła, ikony, czcionki, maski, tekstury, Over)
import uikit

SHOTS2 = os.path.join(HERE2, "zrzuty")
OUT2 = os.path.join(ROOT, "docs", "ui_pomysly2")
ART2 = os.path.join(HERE2, "art")

# stan gry na zrzutach (zapis day40_farm, godz. 11:01, CleanHUD/CleanCompass z gry)
G = dict(
    hour=11 + 1 / 60, phase="Południe", day=40, season="lato",
    goal="Znajdź pracę w tawernie", goal_icon=337,
    compass=dict(cx=1218, cy=56, r=44, angle=104, label="Tawerna · 151 kroków"),
    load="41 / 120", map="Pole dziadka",
    needs=[("health", "Życie", 0.78, 84), ("stamina", "Kondycja", 0.70, 82), ("food", "Sytość", 0.64, 390), ("water", "Nawodnienie", 0.41, 391)],
    gains=[(381, "+6 Drewno"), (319, "+4 Kamień"), (332, "+8 Gałęzie")],
    popup="Chce ci się pić", hero=(680, 345),
)


def bg2(night=False):
    return load(os.path.join(SHOTS2, "mapa_bez_hud_noc.png" if night else "mapa_bez_hud.png"))


def bg_menu2(dim=0.55, blur=2.0, tint=(0, 0, 0)):
    from PIL import ImageFilter
    im = bg2().filter(ImageFilter.GaussianBlur(blur))
    im.alpha_composite(Image.new("RGBA", im.size, tint + (int(255 * dim),)))
    return im


def need_icon(key):
    """prawdziwe ikony z IconSet (jak w CleanHUD): serce i but bez ramki RTP"""
    return {"health": icon_key(84, "dark"), "stamina": icon_bare(82), "food": icon(390), "water": icon(391)}[key]


def hand_pts(cx, cy, hour, lh, lm):
    ah = math.radians((hour % 12) * 30)
    am = math.radians((hour % 1) * 360)
    return ((cx + math.sin(ah) * lh, cy - math.cos(ah) * lh), (cx + math.sin(am) * lm, cy - math.cos(am) * lm))


def compass_dir(cx, cy, r, deg):
    a = math.radians(deg)
    return cx + math.sin(a) * r, cy - math.cos(a) * r


def save2(img, name):
    os.makedirs(OUT2, exist_ok=True)
    p = os.path.join(OUT2, name)
    img.convert("RGB").save(p, optimize=True)
    return p


def wrapf(s, f, w):
    return uikit.wrap(s, f, w)


# ------------------------------------------------------------------ czyste elementy (pomysły minimalistyczne)
from PIL import ImageDraw as _ID


def rpanel(img, box, fill, line=None, r=8, lw=1, shadow=40):
    """zaokrąglony panel półprzezroczysty (fill może mieć alfę), cienka linia"""
    x0, y0, x1, y1 = box
    if shadow:
        with Over(img) as o:
            o.rounded_rectangle((x0 + 1, y0 + 3, x1 + 1, y1 + 4), radius=r, fill=(0, 0, 0, shadow))
    with Over(img) as o:
        o.rounded_rectangle(box, radius=r, fill=fill, outline=line, width=lw)


def spaced(img, xy, s, f, fill, sp=2, anchor="l", stroke=0, sfill=(0, 0, 0, 200)):
    """tekst z rozstrzeleniem (kapitaliki z oddechem); anchor l / m / r"""
    ws = [tw(ch, f) if ch != " " else tw("n", f) for ch in s]
    total = sum(ws) + sp * (len(s) - 1)
    x, y = xy
    if anchor == "m":
        x -= total / 2
    elif anchor == "r":
        x -= total
    for ch, w_ in zip(s, ws):
        if ch != " ":
            text(img, (x, y), ch, f, fill, stroke=stroke, sfill=sfill)
        x += w_ + sp
    return total


def ring_gauge(img, cx, cy, r, ratio, col, track, width=4, start=-90):
    with Over(img) as o:
        o.arc((cx - r, cy - r, cx + r, cy + r), 0, 360, fill=track, width=width)
        if ratio > 0:
            o.arc((cx - r, cy - r, cx + r, cy + r), start, start + 360 * ratio, fill=col, width=width)


def keycaps(img, x, y, pairs, f, cap_line, cap_fill, txt, lab, h=24, r=5):
    for k, l in pairs:
        kw = max(h, tw(k, f) + 14)
        with Over(img) as o:
            o.rounded_rectangle((x, y, x + kw, y + h), radius=r, fill=cap_fill, outline=cap_line)
        text(img, (x + kw / 2, y + h / 2), k, f, txt, anchor="mm")
        text(img, (x + kw + 7, y + h / 2), l, f, lab, anchor="lm")
        x += kw + tw(l, f) + 26
    return x


def icon_fill(i_img, ratio, dim=(40, 48, 70), dim_a=1.0):
    """ikona napełniona do poziomu: poniżej w kolorze, powyżej przyciemniony cień w kolorze `dim`"""
    a = np.array(i_img).astype(np.float32)
    h = a.shape[0]
    rows = np.nonzero(a[..., 3].max(axis=1) > 40)[0]
    top, bot = (rows[0], rows[-1]) if len(rows) else (0, h - 1)
    level = bot + 1 - (bot + 1 - top) * ratio
    yy = np.arange(h)[:, None]
    up = (yy < level) & (a[..., 3] > 0)
    lum = a[..., :3].mean(axis=2, keepdims=True) / 255
    sh = np.array(dim, np.float32)[None, None, :] * (0.6 + 0.8 * lum)
    a[..., :3] = np.where(up[..., None], sh, a[..., :3])
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGBA")
