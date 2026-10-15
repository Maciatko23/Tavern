# Makieta: 4 paski stanu jako ŁUKI wokół zegara w lewym górnym rogu (szkic użytkownika 2026-10-08), styl „Grafit i miedź”.
#  A - wiernie wg szkicu: duży zegar, szeroko rozstawione łuki od dołu w prawo, ikony z IconSet pionowo pod zegarem.
#  B - dopracowany: łuki zwarte (pół-pierścień po prawej stronie tarczy), małe znaczki przy początkach, wartości przy końcach.
# Zasada użytkownika: KAŻDY łuk ma tę samą grubość i równe odstępy (także 5. łuk oddechu w trybie walki).
# Tło: świeże zrzuty obecnej gry (zrzuty/luki_hud.png z HUD Grafit, luki_bez_hud.png bez) - kompas, nazwa miejsca i zdobycze
# zostają z gry, lewy górny i lewy dolny róg są wyczyszczone.
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from common2 import *

COL = {"health": "#d8605a", "stamina": "#94bf6e", "food": "#dda650", "water": "#62a6dc", "breath": "#8fe3ff"}
LOWC = "#ff6f5e"
CU, CU2, TXT, MUT = "#d08a5a", "#8a5a3a", "#ece6da", "#b4aea2"
FM = lambda s: font("AlegreyaSans-Medium.ttf", s)
FB = lambda s: font("AlegreyaSans-Bold.ttf", s)
FSC = lambda s: font("AlegreyaSansSC-Medium.ttf", s)
SS = 4   # nadpróbkowanie łuków i tarczy (gładkie krawędzie)

NORMAL = {"health": 0.78, "stamina": 0.70, "food": 0.64, "water": 0.41}
LOW = {"health": 0.78, "stamina": 0.70, "food": 0.64, "water": 0.12}
ORDER = ["health", "stamina", "food", "water"]


def base_bg():
    hud = load(os.path.join(SHOTS2, "luki_hud.png"))
    raw = load(os.path.join(SHOTS2, "luki_bez_hud.png"))
    for box in ((0, 0, 470, 260), (0, 470, 340, 720), (590, 220, 790, 256)):
        hud.paste(raw.crop(box), box[:2])
    return hud


def compass_pt(cx, cy, r, deg):
    a = math.radians(deg)
    return cx + math.sin(a) * r, cy - math.cos(a) * r


class Layer:
    """warstwa nadpróbkowana: rysunek w skali SS, na koniec zmniejszenie do 1x"""
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.im = Image.new("RGBA", (w * SS, h * SS), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.im)

    def arc(self, cx, cy, r, a0, a1, width, color, caps=True):
        """łuk po okręgu: kąty kompasowe (0 = góra, rośnie zgodnie z zegarem), rysowany od a0 do a1"""
        if abs(a1 - a0) < 0.01:
            return
        n = max(8, int(abs(a1 - a0) * 1.5))
        pts = [compass_pt(cx * SS, cy * SS, r * SS, a0 + (a1 - a0) * k / n) for k in range(n + 1)]
        self.d.line(pts, fill=hexc(color) if isinstance(color, str) else color, width=int(width * SS), joint="curve")
        if caps:
            rr = width * SS / 2
            for p in (pts[0], pts[-1]):
                self.d.ellipse((p[0] - rr, p[1] - rr, p[0] + rr, p[1] + rr), fill=hexc(color) if isinstance(color, str) else color)

    def circle(self, cx, cy, r, fill=None, outline=None, width=1):
        s = SS
        self.d.ellipse((cx * s - r * s, cy * s - r * s, cx * s + r * s, cy * s + r * s), fill=fill, outline=outline, width=int(width * s))

    def line(self, p0, p1, color, width):
        s = SS
        self.d.line((p0[0] * s, p0[1] * s, p1[0] * s, p1[1] * s), fill=hexc(color) if isinstance(color, str) else color, width=int(width * s))
        r = width * s / 2
        for p in (p0, p1):
            self.d.ellipse((p[0] * s - r, p[1] * s - r, p[0] * s + r, p[1] * s + r), fill=hexc(color) if isinstance(color, str) else color)

    def done(self, img, xy=(0, 0)):
        small = self.im.resize((self.w, self.h), Image.LANCZOS)
        img.alpha_composite(small, xy)


def gauge_arc(L, cx, cy, r, a0, a1, width, ratio, color, glow=False):
    """tor (ciemny, z obrysem) + wypełnienie od a0 w stronę a1"""
    L.arc(cx, cy, r, a0, a1, width + 2, (8, 9, 11, 200))
    L.arc(cx, cy, r, a0, a1, width, (40, 42, 47, 225))
    if ratio > 0:
        a = a0 + (a1 - a0) * ratio
        if glow:
            L.arc(cx, cy, r, a0, a, width + 5, hexc(color, 90))
        L.arc(cx, cy, r, a0, a, width, color)


def dial(L, cx, cy, r, hour, breath_ring=None):
    L.circle(cx, cy, r + 1, fill=(8, 9, 11, 170))
    L.circle(cx, cy, r, fill=(30, 32, 36, 240), outline=(64, 66, 72, 255), width=1)
    L.circle(cx, cy, r - 4, outline=hexc(CU2), width=1)
    for k in range(12):
        p = compass_pt(cx, cy, r - 8, k * 30)
        if k % 3 == 0:
            L.circle(p[0], p[1], 1.4, fill=hexc(TXT))
        else:
            L.circle(p[0], p[1], 0.8, fill=hexc("#8a857c"))
    # pora dnia: słońce na tarczy 24 h (południe u góry), w środku tarczy
    sp = compass_pt(cx, cy, r * 0.5, ((hour - 12) % 24) * 15)
    L.circle(sp[0], sp[1], max(2.5, r * 0.11), fill=hexc("#f2c25a"))
    hh = compass_pt(cx, cy, r * 0.48, (hour % 12) * 30)
    mm = compass_pt(cx, cy, r * 0.74, (hour % 1) * 360)
    L.line((cx, cy), hh, TXT, 3)
    L.line((cx, cy), mm, CU, 2)
    L.circle(cx, cy, 2.6, fill=hexc(CU))


def goal_block(img, x, y, combat=False):
    spaced(img, (x, y), "cel", FSC(13), CU, sp=2)
    put(img, icon(337), (x - 2, y + 16))
    text(img, (x + 34, y + 32), "Znajdź pracę w tawernie", FM(20), TXT, anchor="lm", stroke=2, sfill=(0, 0, 0, 150))
    text(img, (x + 34, y + 56), "Południe · dzień 40 · lato", FM(15), MUT, anchor="lm", stroke=2, sfill=(0, 0, 0, 150))
    if combat:
        rpanel(img, (x + 34, y + 70, x + 34 + 112, y + 94), (30, 32, 36, 220), hexc("#e8806a"), r=12, shadow=0)
        text(img, (x + 90, y + 82), "Tryb walki", FM(15), "#f0b0a0", anchor="mm")


# ------------------------------------------------------------------ znaczki 7x6 (wariant B)
GLYPH = {
    "health": [".##.##.", "#######", "#######", ".#####.", "..###..", "...#..."],
    "stamina": [".###...", ".###...", ".###...", ".####..", ".######", ".######"],
    "food": ["..###..", ".#####.", ".#####.", "..###..", "...#...", "..#.#.."],
    "water": ["...#...", "..###..", ".#####.", ".#####.", ".#####.", "..###.."],
    "breath": ["#####..", ".....#.", "######.", ".......", "####...", "....#.."],
}


def glyph(img, key, cx, cy, color, scale=1):
    g = GLYPH[key]
    h, w = len(g), len(g[0])
    im = Image.new("RGBA", (w + 2, h + 2), (0, 0, 0, 0))
    a = np.zeros((h + 2, w + 2, 4), np.uint8)
    on = np.array([[ch == "#" for ch in row] for row in g])
    m = np.zeros((h + 2, w + 2), bool); m[1:-1, 1:-1] = on
    dil = m.copy(); dil[1:] |= m[:-1]; dil[:-1] |= m[1:]; dil[:, 1:] |= m[:, :-1]; dil[:, :-1] |= m[:, 1:]
    a[dil] = (10, 10, 12, 230); a[m] = hexc(color)
    im = Image.fromarray(a, "RGBA")
    if scale != 1:
        im = im.resize((im.width * scale, im.height * scale), Image.NEAREST)
    img.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))


# =====================================================================================================================
# A: wiernie wg szkicu
A = dict(cx=64, cy=58, r=40, R0=54, step=26, width=7, start=180, top_margin=8)


def cluster_A(img, vals, combat=False, blink=False):
    cx, cy, r = A["cx"], A["cy"], A["r"]
    keys = ORDER + (["breath"] if combat else [])
    vals = dict(vals); vals["breath"] = 0.55
    L = Layer(W, H)
    for i, k in enumerate(keys):
        R = A["R0"] + A["step"] * i
        # koniec łuku tam, gdzie łuk dochodzi do górnej krawędzi (jak na szkicu: zewnętrzne krótsze u góry)
        lim = (cy - A["top_margin"] - A["width"] / 2) / (R + A["width"] / 2)
        end = max(28.0, math.degrees(math.acos(min(1.0, lim))))
        low = blink and k == "water"
        gauge_arc(L, cx, cy, R, A["start"], end, A["width"], vals[k], LOWC if low else COL[k], glow=low)
    dial(L, cx, cy, r, G["hour"])
    L.done(img)
    for i, k in enumerate(keys):
        R = A["R0"] + A["step"] * i
        ix, iy = cx - 24, cy + R
        if k == "breath":
            glyph(img, "breath", ix, iy, COL["breath"], scale=3)
        else:
            put(img, need_icon(k), (ix - 16, iy - 16))
        if blink and k == "water":
            text(img, (ix + 14, iy - 12), "!", FB(18), LOWC, anchor="mm", stroke=2, sfill=(0, 0, 0, 200))
    goal_block(img, 206, 10, combat)


# =====================================================================================================================
# B: dopracowany - pół-pierścień po prawej stronie tarczy
B = dict(cx=44, cy=92, r=34, R0=44, step=10, width=7, start=180, end=0)


def cluster_B(img, vals, combat=False, blink=False):
    cx, cy, r = B["cx"], B["cy"], B["r"]
    keys = ORDER + (["breath"] if combat else [])
    vals = dict(vals); vals["breath"] = 0.55
    L = Layer(W, H)
    for i, k in enumerate(keys):
        R = B["R0"] + B["step"] * i
        low = blink and k == "water"
        gauge_arc(L, cx, cy, R, B["start"], B["end"], B["width"], vals[k], LOWC if low else COL[k], glow=low)
    dial(L, cx, cy, r, G["hour"])
    L.done(img)
    f = FM(13)
    for i, k in enumerate(keys):
        R = B["R0"] + B["step"] * i
        low = blink and k == "water"
        glyph(img, k, cx - 9, cy + R, LOWC if low else COL[k])          # przy początku łuku (dół)
        v = int(round(vals[k] * 100))
        text(img, (cx - 5, cy - R), (str(v) + ("%" if k == "health" else "")) if k != "breath" else "", f,
             LOWC if low else TXT, anchor="rm", stroke=2, sfill=(0, 0, 0, 200))   # wartość przy końcu (góra)
    goal_block(img, 142 if not combat else 152, 14, combat)


# =====================================================================================================================
def full(variant):
    img = base_bg()
    (cluster_A if variant == "A" else cluster_B)(img, NORMAL)
    return img


def zoom(variant):
    crop = (0, 0, 470, 240) if variant == "A" else (0, 0, 470, 196)
    states = [("Zwykły stan", NORMAL, False, False), ("Niskie nawodnienie (łuk wody krótki, miga)", LOW, False, True),
              ("Tryb walki: oddech jako 5. łuk", NORMAL, True, False)]
    cw, ch = (crop[2] - crop[0]) * 2, (crop[3] - crop[1]) * 2
    out = Image.new("RGBA", (cw * 3 + 40, ch + 56), hexc("#121316"))
    for i, (lab, vals, combat, blink) in enumerate(states):
        img = base_bg()
        (cluster_A if variant == "A" else cluster_B)(img, vals, combat, blink)
        z = img.crop(crop).resize((cw, ch), Image.NEAREST)
        x = 10 + i * (cw + 10)
        out.alpha_composite(z, (x, 46))
        text(out, (x, 12), lab, FM(22), "#ece6da" if i == 0 else ("#ff9a8a" if blink else "#8fe3ff"))
    return out


if __name__ == "__main__":
    for v in "AB":
        print(save2(full(v), f"luki_zegar_{v}.png"))
        print(save2(zoom(v), f"luki_zegar_{v}_zblizenie.png"))
