# -*- coding: utf-8 -*-
# Kruk (2026-10-30): PROPOZYCJA ułożenia map plenerowych w sylwetkę Kruczej Wyspy (Atlas: docs/ekran_tytulowy/tytul_08_atlas_kruczej_wyspy.png).
# Nic nie zapisuje do data/ ani js/. Wynik: docs/mapy/kruk_maska.png, kruk_propozycja_A.png / _B.png, docs/mapy/kruk_wynik.json.
# Układ liczy się sam (wyżarzanie): koszt = nakładanie map + przejścia niezgodne z położeniem + niepokryty brzeg + odległość od
# „geograficznego” miejsca z Atlasu. Przejścia liczone jak w swiat.py (wyjście i lądowanie w tym samym miejscu, <= 3.5 kratki).
#   python tools/mapy/kruk.py [A|B] [--obraz]
import os, sys, re, json, math, random, collections
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
import numpy as np
from PIL import Image, ImageDraw, ImageFont
DATA = os.path.join(ROOT, "data")
ATLAS = os.path.join(ROOT, "docs", "ekran_tytulowy", "tytul_08_atlas_kruczej_wyspy.png")
MASKA = os.path.join(ROOT, "docs", "mapy", "kruk_maska.png")
OX, OY = 110, 58                       # lewy górny róg kruka w pikselach Atlasu

OUTDOOR = [8, 24, 111, 125, 22, 20, 21, 13, 120, 175, 23, 168, 3, 4, 17, 18, 162, 165, 155, 157, 159]
PLAYER = {1, 3, 4, 8, 13, 23, 24, 25, 26, 111}
NAMES = {8: "Okolice Tawerny", 24: "Posiadłość Lorda", 111: "Podgrodzie", 125: "Przystań", 22: "Polna droga", 20: "Dom dziadka",
         21: "Leśna droga", 13: "Góry i kamieniołom", 120: "Osada Milczących", 175: "Orla Grań", 23: "Skraj lasu", 168: "Spalona zagroda",
         3: "Kruczy Jar", 4: "Łąka#1", 17: "Łąka#2", 18: "Łąka#3", 162: "Garnizon", 165: "Wrak", 155: "Pustelnia", 157: "Urwisko Kruków",
         159: "Latarnia"}


def load_maska():
    if not os.path.exists(MASKA):
        raise SystemExit("brak maski: python tools/mapy/kruk.py maska")
    return np.array(Image.open(MASKA).convert("L")) > 127


def zrob_maske():
    from collections import deque
    a = np.array(Image.open(ATLAS).convert("L"))
    H, W = a.shape
    dark = a <= 70
    seen = np.zeros_like(dark)
    for sx, sy in [(150, 200), (1000, 100), (1100, 650), (900, 620), (480, 120), (800, 120), (60, 420), (1240, 450), (640, 20)]:
        if seen[sy, sx] or dark[sy, sx]: continue
        q = deque([(sx, sy)]); seen[sy, sx] = True
        while q:
            x, y = q.popleft()
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < W and 0 <= ny < H and not seen[ny, nx] and not dark[ny, nx]:
                    seen[ny, nx] = True; q.append((nx, ny))
    rest = ~seen
    lab = np.zeros(rest.shape, int); n = 0; best = None; bs = 0
    for y0 in range(0, H, 3):
        for x0 in range(0, W, 3):
            if rest[y0, x0] and lab[y0, x0] == 0:
                n += 1; q = deque([(x0, y0)]); lab[y0, x0] = n; c = 0
                while q:
                    x, y = q.popleft(); c += 1
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < W and 0 <= ny < H and rest[ny, nx] and lab[ny, nx] == 0:
                            lab[ny, nx] = n; q.append((nx, ny))
                if c > bs: bs = c; best = n
    m = lab == best
    Image.fromarray((m * 255).astype("uint8")).save(MASKA)
    ys, xs = np.where(m)
    print("maska:", xs.min(), xs.max(), ys.min(), ys.max(), int(m.sum()))


# ------------------------------------------------------------------------------------------------ dane map i przejść
info = {m["id"]: m["name"] for m in json.load(open(os.path.join(DATA, "MapInfos.json"), encoding="utf-8")) if m}
size = {}
for mid in OUTDOOR:
    m = json.load(open(os.path.join(DATA, "Map%03d.json" % mid), encoding="utf-8"))
    size[mid] = (m["width"], m["height"])


def side_of(mid, x, y):
    w, h = size[mid]
    if x <= 0: return "W"
    if x >= w - 1: return "E"
    if y <= 0: return "N"
    if y >= h - 1: return "S"
    return None


def zbierz_przejscia():
    links = []
    for mid in OUTDOOR:
        m = json.load(open(os.path.join(DATA, "Map%03d.json" % mid), encoding="utf-8"))
        seen = set()
        for e in m["events"]:
            if not e: continue
            for p in e["pages"]:
                for c in p["list"]:
                    if c["code"] == 201 and c["parameters"][0] == 0 and c["parameters"][1] in size:
                        k = (e["x"], e["y"], c["parameters"][1])
                        if k in seen: continue
                        seen.add(k)
                        links.append((mid, (e["x"], e["y"]), c["parameters"][1], (c["parameters"][2], c["parameters"][3])))
    wy = open(os.path.join(ROOT, "js", "plugins", "Wyspa_Data.js"), encoding="utf-8").read()
    arr = r"(\[\[[^\]]*\](?:,\s*\[[^\]]*\])*\])"
    for mo in re.finditer(r"from:\s*(\d+),\s*to:\s*(\d+),[^{}]*?cells:\s*" + arr + r",\s*land:\s*" + arr, wy):
        a, b = int(mo.group(1)), int(mo.group(2))
        for c, l in zip(json.loads(mo.group(3)), json.loads(mo.group(4))): links.append((a, tuple(c), b, tuple(l)))
    for mo in re.finditer(r"from:\s*(\d+),\s*cells:\s*" + arr + r",\s*to:\s*(\d+),\s*land:\s*" + arr, wy):
        a, b = int(mo.group(1)), int(mo.group(3))
        if a in size and b in size:
            for c, l in zip(json.loads(mo.group(2)), json.loads(mo.group(4))): links.append((a, tuple(c), b, tuple(l)))
    groups = collections.defaultdict(list)
    for (a, c, b, l) in links:
        groups[(a, side_of(a, *c), b)].append((c, l))
    out = []
    for (a, s, b), lst in groups.items():
        c, l = lst[len(lst) // 2]
        out.append((a, s, b, c, l, lst))
    return sorted(out, key=lambda t: (t[0], t[2]))


GROUPS = zbierz_przejscia()     # (a, side, b, c, l, wszystkie pary)

# ------------------------------------------------------------------------------------------------ warianty
# prior: środek mapy w pikselach Atlasu (lekka podpowiedź geografii), waga w prior_w
PRIOR_COMMON = {
    175: (640, 110), 13: (640, 235), 120: (790, 185), 159: (1000, 285),
    8: (735, 395), 24: (860, 395), 20: (900, 320), 21: (960, 395), 168: (1010, 340),
    111: (560, 395), 125: (790, 490), 22: (690, 540), 23: (640, 600), 3: (560, 570), 4: (480, 500), 17: (560, 650), 18: (440, 600),
    155: (230, 290), 157: (400, 225), 162: (290, 370), 165: (170, 340),
}
# Układ ręczny (lewy górny róg w kratkach, 0,0 = lewy górny róg prostokąta kruka) - punkt wyjścia wyżarzania.
# exact: pary map, których OBECNE przejścia zostają (z tym samym przesunięciem); new: nowe przejścia (sąsiad po stronie, zakładka >= 12 kratek).
EXACT_PORT = [(8, 24), (8, 22), (8, 111), (22, 23), (23, 3), (3, 4), (3, 17), (3, 18), (21, 20), (155, 157), (162, 165)]
NEW_PORT = [(8, "E", 125, "W"), (24, "E", 21, "W"), (21, "E", 168, "W"), (111, "W", 162, "E"), (157, "E", 13, "W"), (13, "E", 120, "W"),
            (120, "E", 159, "W")]
INIT_A = {175: (376, 0), 13: (364, 70), 8: (430, 166), 24: (534, 202), 125: (534, 270), 21: (614, 210), 20: (619, 166), 168: (694, 210),
          120: (484, 94), 159: (580, 84), 22: (443, 304), 23: (443, 364), 3: (363, 364), 4: (358, 304), 17: (363, 424), 18: (283, 360),
          111: (338, 199), 162: (226, 215), 165: (146, 215), 157: (252, 94), 155: (156, 94)}
VARIANTS = {
    "A": dict(scale=0.78, exact=EXACT_PORT, new=NEW_PORT, init=INIT_A, seed=1),
    "B": dict(scale=0.98, exact=EXACT_PORT, new=NEW_PORT, init=None, seed=2),
}


def pair(a, b): return tuple(sorted((a, b)))


class Uklad:
    def __init__(self, var, extra=(), grow=None, scale=None, shift=(0, 0)):
        v = dict(VARIANTS[var])
        if scale: v['scale'] = scale
        self.grow = dict(grow or {}); self.wl = 6
        self.v = v; self.s = v["scale"]
        self.ids = list(OUTDOOR) + [e["id"] for e in extra]
        self.sz = dict(size)
        for e in extra: self.sz[e["id"]] = e["size"]
        for m, (dw, dh) in self.grow.items(): self.sz[m] = (size[m][0] + dw, size[m][1] + dh)
        self.extra = list(extra)
        ex = {pair(*p) for p in v["exact"]}
        self.keep = [g for g in GROUPS if pair(g[0], g[2]) in ex]
        self.new = list(v["new"]) + [(e["from"], e["side"], e["id"], {"N": "S", "S": "N", "E": "W", "W": "E"}[e["side"]]) for e in extra]
        self.frozen_extra = {e["id"] for e in extra}
        self.idx = {m: i for i, m in enumerate(self.ids)}
        self.W = np.array([self.sz[m][0] for m in self.ids]); self.H = np.array([self.sz[m][1] for m in self.ids])
        mask = load_maska()
        ys, xs = np.where(mask & ~np.pad(mask, 1)[1:-1, 2:] | mask & ~np.pad(mask, 1)[1:-1, :-2] |
                          mask & ~np.pad(mask, 1)[2:, 1:-1] | mask & ~np.pad(mask, 1)[:-2, 1:-1])
        sel = np.arange(0, len(xs), 2)
        self.coast_px = np.stack([xs[sel], ys[sel]], 1)
        self.shift = tuple(shift)
        self.coast = (self.coast_px - [OX, OY]) * self.s + np.array(self.shift)
        self.mask = mask
        self.pri = {self.idx[m]: ((p[0] - OX) * self.s, (p[1] - OY) * self.s) for m, p in PRIOR_COMMON.items() if m in self.idx}
        self.lk = [(self.idx[a], self.idx[b], c, l) for (a, s, b, c, l, _) in self.keep]

    def energie(self, P, det=False):
        n = len(self.ids)
        x0, y0 = P[:, 0], P[:, 1]; x1, y1 = x0 + self.W, y0 + self.H
        ix = np.minimum(x1[:, None], x1[None, :]) - np.maximum(x0[:, None], x0[None, :])
        iy = np.minimum(y1[:, None], y1[None, :]) - np.maximum(y0[:, None], y0[None, :])
        ov = np.where((ix > 0) & (iy > 0), ix * iy, 0); np.fill_diagonal(ov, 0)
        e_ov = ov.sum() / 2.0 * 2.0
        e_lk = 0.0; bad = []
        for (a, b, c, l) in self.lk:
            d = math.hypot(P[a, 0] + c[0] - P[b, 0] - l[0], P[a, 1] + c[1] - P[b, 1] - l[1])
            e_lk += self.wl * min(max(0, d - 3.5), 60)
            if d > 3.5: bad.append((a, b, d))
        e_new = 0.0
        for (a, sd, b, sd2) in self.new:
            a, b = self.idx[a], self.idx[b]
            if sd in "EW":
                gap = abs((P[b, 0] - (P[a, 0] + self.W[a])) if sd == "E" else (P[a, 0] - (P[b, 0] + self.W[b])))
                olap = min(y1[a], y1[b]) - max(y0[a], y0[b])
            else:
                gap = abs((P[b, 1] - (P[a, 1] + self.H[a])) if sd == "S" else (P[a, 1] - (P[b, 1] + self.H[b])))
                olap = min(x1[a], x1[b]) - max(x0[a], x0[b])
            e_new += self.wl * min(gap, 60) + self.wl * min(max(0, 12 - olap), 40)
        cx = self.coast[:, 0][:, None]; cy = self.coast[:, 1][:, None]
        ins = (cx >= x0 + 1) & (cx < x1 - 1) & (cy >= y0 + 1) & (cy < y1 - 1)
        cov = ins.any(1)
        e_c = 1.6 * (len(cov) - cov.sum())
        e_p = 0.0
        for i, (px, py) in self.pri.items():
            e_p += 0.15 * math.hypot(P[i, 0] + self.W[i] / 2 - px, P[i, 1] + self.H[i] / 2 - py) / max(self.s, 0.1) * 0.5
        if det: return dict(ov=ov, lk=bad, cov=cov, e=(e_ov, e_lk, e_new, e_c, e_p))
        return e_ov + e_lk + e_new + e_c + e_p

    def start(self, P0=None):
        P = np.zeros((len(self.ids), 2), int)
        for i, m in enumerate(self.ids):
            if P0 is not None and m in P0: P[i] = P0[m]; continue
            if i in self.pri: P[i] = [int(self.pri[i][0] - self.W[i] / 2), int(self.pri[i][1] - self.H[i] / 2)]
            else: P[i] = [int(self.coast[:, 0].mean()), int(self.coast[:, 1].mean())]
        return P

    def anneal(self, P, iters=120000, T0=60.0, seed=1, frozen=()):
        rnd = random.Random(seed)
        n = len(self.ids)
        cur = self.energie(P); best = cur; bestP = P.copy()
        for it in range(iters):
            T = T0 * (1 - it / iters) ** 2 + 0.05
            i = rnd.randrange(n)
            if self.ids[i] in frozen: continue
            old = P[i].copy()
            r = rnd.random()
            if r < 0.15: step = rnd.randint(-40, 40), rnd.randint(-40, 40)
            elif r < 0.6: step = rnd.randint(-8, 8), rnd.randint(-8, 8)
            else: step = rnd.randint(-2, 2), rnd.randint(-2, 2)
            P[i] += step
            e = self.energie(P)
            if e <= cur or rnd.random() < math.exp((cur - e) / T):
                cur = e
                if e < best: best = e; bestP = P.copy()
            else:
                P[i] = old
        return bestP, best



# ------------------------------------------------------------------------------------------------ polerowanie, rysunek
def poleruj(U, P, frozen=()):
    """Zejście po jednej kratce: poprawia przesunięcia przejść, nie pogarsza reszty."""
    cur = U.energie(P)
    for _ in range(6):
        ch = False
        for i in range(len(U.ids)):
            if U.ids[i] in frozen: continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (2, 0), (-2, 0), (0, 2), (0, -2), (1, 1), (-1, -1), (1, -1), (-1, 1)):
                P[i] += (dx, dy); e = U.energie(P)
                if e < cur - 1e-9: cur = e; ch = True
                else: P[i] -= (dx, dy)
        if not ch: break
    return P


def font(sz):
    for f in ("C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf"):
        if os.path.exists(f): return ImageFont.truetype(f, sz)
    return ImageFont.load_default()


def miniatura(mid, px):
    import mapylib as L
    cache = os.path.join(os.environ.get("KRUK_TMP", os.environ.get("TEMP", ".")), "kruk_th_%d_%.3f.png" % (mid, px))
    if os.path.exists(cache): return Image.open(cache).convert("RGBA")
    th = L.render(L.Mapa(mid), scale=px / 48.0)
    th.save(cache); return th


def rysuj(U, P, wyjscie, tytul, extra_info=None, FAC=1.6):
    """FAC: pikseli obrazka na piksel Atlasu."""
    s = U.s
    ppt = FAC / s                                   # pikseli obrazka na kratkę
    mask = U.mask
    ys, xs = np.where(mask)
    W0, H0 = int((mask.shape[1] - 2 * OX + 1070 - 1070) * 0 + 1075 * FAC) + 60, int(635 * FAC) + 60
    # (kratki -> obraz: x_img = 30 + x_tile * ppt - minx)
    sx, sy = U.shift
    minx = min(sx, int(P[:, 0].min())); miny = min(sy, int(P[:, 1].min()))
    maxx = max(int(1075 * s) + sx, int((P[:, 0] + U.W).max())); maxy = max(int(635 * s) + sy, int((P[:, 1] + U.H).max()))
    Wp = int((maxx - minx) * ppt) + 60; Hp = int((maxy - miny) * ppt) + 60 + 150
    img = Image.new("RGBA", (Wp, Hp), (16, 20, 28, 255))
    def T(x, y): return (30 + (x - minx) * ppt, 30 + (y - miny) * ppt)
    sil = Image.fromarray((mask[OY:OY + 635, OX:OX + 1075] * 1).astype("uint8") * 255).resize((int(1075 * FAC), int(635 * FAC)), Image.NEAREST)
    col = Image.new("RGBA", sil.size, (150, 130, 80, 255)); col.putalpha(sil.point(lambda v: 170 if v > 127 else 0))
    ox, oy = T(sx, sy); img.alpha_composite(col, (int(ox), int(oy)))
    d = ImageDraw.Draw(img, "RGBA")
    F, FS = font(15), font(14)
    for i, m in enumerate(U.ids):
        x, y = T(P[i][0], P[i][1])
        w, h = int(U.W[i] * ppt), int(U.H[i] * ppt)
        if m in size:
            th = miniatura(m, ppt).resize((w, h)); th.putalpha(215); img.alpha_composite(th, (int(x), int(y)))
            d.rectangle([x, y, x + w, y + h], outline=(255, 255, 255, 140), width=1)
        else:
            d.rectangle([x, y, x + w, y + h], fill=(200, 120, 20, 90), outline=(255, 170, 40, 255), width=3)
    for i, m in enumerate(U.ids):
        x, y = T(P[i][0], P[i][1])
        lab = ("%d %s" % (m, NAMES[m]) if m in NAMES else NAMES_NOWE.get(m, str(m)))
        if m in PLAYER: lab += " *"
        tw = d.textlength(lab, font=F)
        d.rectangle([x + 3, y + 3, x + 9 + tw, y + 8 + F.size], fill=(0, 0, 0, 205))
        d.text((x + 6, y + 4), lab, fill=(255, 235, 140, 255), font=F)
    for (txt, ax_, ay_) in (("GŁOWA", 640, 85), ("SZCZYT / BARKI", 560, 215), ("LEWE SKRZYDŁO", 270, 300), ("PRAWE SKRZYDŁO", 1000, 350), ("TUŁÓW", 665, 330), ("OGON", 640, 560)):
        x, y = T((ax_ - OX) * s + sx, (ay_ - OY) * s + sy)
        d.text((x - 40, y), txt, fill=(255, 255, 255, 70), font=font(26))
    # przejścia
    def gp(m, c): i = U.idx[m]; return T(P[i][0] + c[0] + 0.5, P[i][1] + c[1] + 0.5)
    for (a, sd, b, c, l, _) in U.keep:
        p1, p2 = gp(a, c), gp(b, l)
        dd = math.hypot(p1[0] - p2[0], p1[1] - p2[1]) / ppt
        okc = (60, 240, 110, 255) if dd <= 4.5 else (255, 60, 60, 255)
        d.line([p1, p2], fill=okc, width=3); d.ellipse([p1[0] - 4, p1[1] - 4, p1[0] + 4, p1[1] + 4], fill=okc)
    for (a, sd, b, sd2) in U.new:
        i, j = U.idx[a], U.idx[b]
        if sd in "EW":
            xe = P[i][0] + (U.W[i] if sd == "E" else 0)
            lo, hi = max(P[i][1], P[j][1]), min(P[i][1] + U.H[i], P[j][1] + U.H[j])
            p1, p2 = T(xe - 3, (lo + hi) / 2), T(xe + 3, (lo + hi) / 2)
        else:
            ye = P[i][1] + (U.H[i] if sd == "S" else 0)
            lo, hi = max(P[i][0], P[j][0]), min(P[i][0] + U.W[i], P[j][0] + U.W[j])
            p1, p2 = T((lo + hi) / 2, ye - 3), T((lo + hi) / 2, ye + 3)
        d.line([p1, p2], fill=(80, 190, 255, 255), width=6)
    # dawne przejścia do zmiany: czerwona przerywana linia między środkami map
    zost = {pair(g[0], g[2]) for g in U.keep}
    ryz = set()
    for (a, sd, b, c, l, _) in GROUPS:
        k = pair(a, b)
        if k in zost or k in ryz: continue
        ryz.add(k)
        i, j = U.idx[a], U.idx[b]
        p1 = T(P[i][0] + U.W[i] / 2, P[i][1] + U.H[i] / 2); p2 = T(P[j][0] + U.W[j] / 2, P[j][1] + U.H[j] / 2)
        n = max(2, int(math.hypot(p2[0] - p1[0], p2[1] - p1[1]) // 14))
        for q in range(n):
            if q % 2 == 0:
                d.line([(p1[0] + (p2[0] - p1[0]) * q / n, p1[1] + (p2[1] - p1[1]) * q / n), (p1[0] + (p2[0] - p1[0]) * (q + 1) / n, p1[1] + (p2[1] - p1[1]) * (q + 1) / n)], fill=(255, 60, 60, 255), width=3)
        mx, my = (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2
        d.text((mx - 20, my - 8), "%d-%d" % k, fill=(255, 150, 150, 255), font=FS)
    # brzeg
    for (px_, py_), c in zip(U.coast, U.pokryty):
        x, y = T(px_, py_)
        d.ellipse([x - 2, y - 2, x + 2, y + 2], fill=(50, 255, 90, 255) if c else (255, 40, 40, 255))
    ky = Hp - 140
    d.rectangle([0, ky, Wp, Hp], fill=(10, 12, 18, 255))
    d.text((14, ky + 8), tytul, fill=(240, 240, 240, 255), font=font(18))
    d.text((14, ky + 34), "* = mapa gracza. 1 kratka = %.2f piksela Atlasu (skala %.2f kratki na piksel)." % (1 / s, s), fill=(200, 200, 200, 255), font=FS)
    leg = [((60, 240, 110, 255), "linia brzegu kruka na mapie"), ((255, 40, 40, 255), "brzeg poza mapami"),
           ((60, 240, 110, 255), "przejście zgodne (linia)"), ((255, 60, 60, 255), "przejście do zmiany (przerywana: dawne, które znika)"), ((80, 180, 255, 255), "nowe przejście"),
           ((255, 170, 40, 255), "nowa mapa (ramka)")]
    x = 14
    for k, (c, t) in enumerate(leg):
        yy = ky + 66 + (k // 3) * 28; xx = 14 + (k % 3) * [0, 560, 1060][k % 3] if False else [14, 560, 1080][k % 3]
        d.rectangle([xx, yy + 4, xx + 28, yy + 12], fill=c); d.text((xx + 38, yy), t, fill=(220, 220, 220, 255), font=FS)
    img.convert("RGB").save(wyjscie)
    return img.size


NAMES_NOWE = {}
SHIFT = (0, 0)
POPRAWKI = {"A": {}}      # ręczne przesunięcia po wyżarzaniu (kratki)


def nazwa_okolicy(ax, ay):
    """Część kruka po położeniu na Atlasie (piksele)."""
    if ay < 160 and 560 < ax < 720: return "głowa (szczyt)"
    if ay < 330 and 440 < ax < 800: return "barki / góry"
    if ax < 450: return "lewe skrzydło" + (" (koniec)" if ax < 250 else "")
    if ax > 800: return "prawe skrzydło" + (" (koniec)" if ax > 1050 else "")
    if ay > 470: return "ogon" + (" (koniec)" if ay > 620 else "")
    return "tułów"



def policz(U, P):
    r = U.energie(P, det=True)
    U.pokryty = r["cov"]
    return r


def dodaj_nowe(U, P, ile=12, rozmiary=((60, 60), (60, 50), (60, 40), (50, 50), (40, 40), (80, 40), (80, 60), (80, 80), (100, 50), (100, 80), (120, 80)), minpkt=10, start_id=900):
    """Zachłanne dokładanie NOWYCH map tam, gdzie brzeg kruka leży poza mapami: sąsiad dotykający istniejącej mapy."""
    extra = list(U.extra)
    Pd = {m: [int(P[i][0]), int(P[i][1])] for i, m in enumerate(U.ids)}
    Sz = dict(U.sz)
    for k in range(ile):
        cov = np.zeros(len(U.coast), bool)
        for m in Pd:
            x, y = Pd[m]; w, h = Sz[m]
            cov |= (U.coast[:, 0] >= x + 1) & (U.coast[:, 0] < x + w - 1) & (U.coast[:, 1] >= y + 1) & (U.coast[:, 1] < y + h - 1)
        unc = U.coast[~cov]
        if len(unc) < minpkt: break
        best = None
        for m in list(Pd):
            x, y = Pd[m]; w, h = Sz[m]
            for (nw, nh) in rozmiary:
                for side in "NSEW":
                    rng = range(-nh + 14, h - 14, 4) if side in "EW" else range(-nw + 14, w - 14, 4)
                    for off in rng:
                        if side == "E": nx, ny = x + w, y + off
                        elif side == "W": nx, ny = x - nw, y + off
                        elif side == "S": nx, ny = x + off, y + h
                        else: nx, ny = x + off, y - nh
                        if any(min(nx + nw, Pd[o][0] + Sz[o][0]) > max(nx, Pd[o][0]) and min(ny + nh, Pd[o][1] + Sz[o][1]) > max(ny, Pd[o][1]) for o in Pd): continue
                        sc = int(((unc[:, 0] >= nx + 1) & (unc[:, 0] < nx + nw - 1) & (unc[:, 1] >= ny + 1) & (unc[:, 1] < ny + nh - 1)).sum())
                        sc = sc - 0.004 * nw * nh / 10
                        if best is None or sc > best[0]: best = (sc, m, side, nx, ny, nw, nh)
        if best is None or best[0] < minpkt * 0.3: break
        sc, m, side, nx, ny, nw, nh = best
        nid = max([start_id - 1] + [e['id'] for e in extra]) + 1
        extra.append({"id": nid, "size": (nw, nh), "from": m, "side": side})
        Pd[nid] = [nx, ny]; Sz[nid] = (nw, nh)
    return extra, Pd


def rozszerz(U, P, maks=36, minpkt=8):
    """Powiększenie istniejących map na zewnątrz (tylko E / S, bez stron z przejściami), gdzie brzeg leży poza mapami."""
    grow = dict(U.grow)
    zajete = collections.defaultdict(set)      # mapa -> strony z przejściami
    for (a, sd, b, c, l, _) in U.keep: zajete[a].add(sd)
    for (a, sd, b, sd2) in U.new: zajete[a].add(sd); zajete[b].add(sd2)
    Pd = {m: [int(P[i][0]), int(P[i][1])] for i, m in enumerate(U.ids)}
    Sz = dict(U.sz)
    for _ in range(40):
        cov = np.zeros(len(U.coast), bool)
        for m in Pd:
            x, y = Pd[m]; w, h = Sz[m]
            cov |= (U.coast[:, 0] >= x + 1) & (U.coast[:, 0] < x + w - 1) & (U.coast[:, 1] >= y + 1) & (U.coast[:, 1] < y + h - 1)
        unc = U.coast[~cov]
        if len(unc) < minpkt: break
        best = None
        for m in Pd:
            if m not in size: continue
            x, y = Pd[m]; w, h = Sz[m]
            for sd in "ES":
                if sd in zajete[m]: continue
                for g in range(4, maks + 1, 4):
                    if grow.get(m, (0, 0))[0 if sd == "E" else 1] + g > 40: break
                    nw, nh = (w + g, h) if sd == "E" else (w, h + g)
                    if any(o != m and min(x + nw, Pd[o][0] + Sz[o][0]) > max(x, Pd[o][0]) and min(y + nh, Pd[o][1] + Sz[o][1]) > max(y, Pd[o][1]) for o in Pd): break
                    sc = int(((unc[:, 0] >= x + 1) & (unc[:, 0] < x + nw - 1) & (unc[:, 1] >= y + 1) & (unc[:, 1] < y + nh - 1)).sum()) - int(((unc[:, 0] >= x + 1) & (unc[:, 0] < x + w - 1) & (unc[:, 1] >= y + 1) & (unc[:, 1] < y + h - 1)).sum())
                    val = sc / (g * (h if sd == "E" else w))
                    if sc >= minpkt and (best is None or val > best[0]): best = (val, m, sd, g, nw, nh)
        if best is None: break
        _, m, sd, g, nw, nh = best
        Sz[m] = (nw, nh); dw, dh = grow.get(m, (0, 0)); grow[m] = (dw + (g if sd == "E" else 0), dh + (g if sd == "S" else 0))
    return grow


def przytnij(U, P, minun=6):
    """Zdejmuje nowe mapy, które nie ratują prawie żadnego punktu brzegu (i nie są rodzicem innej nowej mapy)."""
    extra = list(U.extra); Pd = {m: [int(P[i][0]), int(P[i][1])] for i, m in enumerate(U.ids)}; Sz = dict(U.sz)
    def inside(m):
        x, y = Pd[m]; w, h = Sz[m]
        return (U.coast[:, 0] >= x + 1) & (U.coast[:, 0] < x + w - 1) & (U.coast[:, 1] >= y + 1) & (U.coast[:, 1] < y + h - 1)
    zm = True
    while zm:
        zm = False
        rodzice = {e["from"] for e in extra}
        for e in list(extra):
            if e["id"] in rodzice: continue
            others = np.zeros(len(U.coast), bool)
            for m in Pd:
                if m != e["id"]: others |= inside(m)
            if (inside(e["id"]) & ~others).sum() < minun:
                extra.remove(e); del Pd[e["id"]]; zm = True; break
    return extra, Pd


def zrob(var, seeds=2, iters=50000, ile=14, scale=None, init=None):
    U = Uklad(var, scale=scale, shift=SHIFT)
    P0 = U.start(init if init is not None else VARIANTS[var]["init"])
    best = None
    for sd in range(seeds):
        Pn, e = U.anneal(P0.copy(), iters=iters, T0=12.0, seed=sd + 5)
        if best is None or e < best[1]: best = (Pn, e)
    P = poleruj(U, best[0])
    grow = {}; extra = []
    for rnd in range(3):
        grow = rozszerz(Uklad(var, extra=extra, grow=grow, scale=scale, shift=SHIFT), P) if rnd == 0 or True else grow
        Ux = Uklad(var, extra=extra, grow=grow, scale=scale, shift=SHIFT)
        extra, Pd = dodaj_nowe(Ux, P, ile=ile)
        U2 = Uklad(var, extra=extra, grow=grow, scale=scale, shift=SHIFT)
        P = np.array([Pd[m] for m in U2.ids])
        P, _ = U2.anneal(P.copy(), iters=25000, T0=4.0, seed=40 + rnd)
        P = poleruj(U2, P)
        U = U2
    U.wl = 30      # na koniec: przejścia ważniejsze niż ostatnie punkty brzegu
    P, _ = U.anneal(P.copy(), iters=25000, T0=1.5, seed=77)
    P = poleruj(U, P)
    return U, P


def segmenty_brzegu(U, cov):
    """Niepokryte odcinki brzegu: skupiska punktów (odległość <= 5 kratek), długość w pikselach Atlasu."""
    idx = [i for i in range(len(cov)) if not cov[i]]
    pts = U.coast[idx]; used = set(); out = []
    for i0 in range(len(idx)):
        if i0 in used: continue
        grp = [i0]; used.add(i0); st = [i0]
        while st:
            k = st.pop()
            dd = np.hypot(pts[:, 0] - pts[k, 0], pts[:, 1] - pts[k, 1])
            for j in np.where(dd <= 5)[0]:
                if j not in used: used.add(j); grp.append(int(j)); st.append(int(j))
        g = pts[grp]
        cx, cy = (g[:, 0].mean() - U.shift[0]) / U.s + OX, (g[:, 1].mean() - U.shift[1]) / U.s + OY
        out.append(dict(punkty=len(grp), dlugosc_px_atlasu=round(len(grp) * 2.2), srodek_atlas=[round(float(cx)), round(float(cy))], czesc=nazwa_okolicy(cx, cy),
                        x=[round(float(g[:, 0].min())), round(float(g[:, 0].max()))], y=[round(float(g[:, 1].min())), round(float(g[:, 1].max()))]))
    return sorted(out, key=lambda o: -o["punkty"])


def wynik(U, P, var, sc):
    r = policz(U, P)
    pos = {m: [int(P[i][0]), int(P[i][1])] for i, m in enumerate(U.ids)}
    sz = {m: [int(U.W[i]), int(U.H[i])] for i, m in enumerate(U.ids)}
    # przejścia obecne: stan każdej pary
    stany = []
    for (a, sd, b, c, l, lst) in GROUPS:
        ia, ib = U.idx[a], U.idx[b]
        d = math.hypot(P[ia][0] + c[0] - P[ib][0] - l[0], P[ia][1] + c[1] - P[ib][1] - l[1])
        zostaje = any(g[0] == a and g[2] == b for g in U.keep) and d <= 4.5
        stany.append(dict(od=a, strona=sd, do=b, wyjscie=list(c), ladowanie=list(l), zostaje=bool(zostaje), odl=round(d, 1)))
    nowe = []
    for (a, sd, b, sd2) in U.new:
        ia, ib = U.idx[a], U.idx[b]
        if sd in "EW":
            lo, hi = max(P[ia][1], P[ib][1]), min(P[ia][1] + U.H[ia], P[ib][1] + U.H[ib]); ym = (lo + hi) // 2
            xe = P[ia][0] + (U.W[ia] if sd == "E" else 0)
            ca = [(U.W[ia] - 1) if sd == "E" else 0, int(ym - P[ia][1])]; lb = [1 if sd == "E" else int(U.W[ib] - 2), int(ym - P[ib][1])]
            gap = abs(P[ib][0] - (P[ia][0] + U.W[ia])) if sd == "E" else abs(P[ia][0] - (P[ib][0] + U.W[ib])); olap = int(hi - lo)
        else:
            lo, hi = max(P[ia][0], P[ib][0]), min(P[ia][0] + U.W[ia], P[ib][0] + U.W[ib]); xm = (lo + hi) // 2
            ca = [int(xm - P[ia][0]), (U.H[ia] - 1) if sd == "S" else 0]; lb = [int(xm - P[ib][0]), 1 if sd == "S" else int(U.H[ib] - 2)]
            gap = abs(P[ib][1] - (P[ia][1] + U.H[ia])) if sd == "S" else abs(P[ia][1] - (P[ib][1] + U.H[ib])); olap = int(hi - lo)
        nowe.append(dict(od=a, strona=sd, do=b, wyjscie=ca, ladowanie=lb, szczelina=int(gap), zakladka=olap, ok=bool(gap <= 3 and olap >= 12)))
    nm = {}
    for i, m in enumerate(U.ids):
        cx, cy = (P[i][0] + U.W[i] / 2 - U.shift[0]) / U.s + OX, (P[i][1] + U.H[i] / 2 - U.shift[1]) / U.s + OY
        nm[m] = dict(x=pos[m][0], y=pos[m][1], w=sz[m][0], h=sz[m][1], atlas=[round(cx), round(cy)], czesc=nazwa_okolicy(cx, cy), nowa=m not in size)
    seg = segmenty_brzegu(U, r["cov"])
    # nakładanie
    ov = [(U.ids[i], U.ids[j], int(r["ov"][i, j])) for i in range(len(U.ids)) for j in range(i + 1, len(U.ids)) if r["ov"][i, j] > 0]
    # pokrycie samymi obecnymi mapami w obecnych rozmiarach
    cov0 = np.zeros(len(U.coast), bool)
    for i, m in enumerate(U.ids):
        if m in size and m not in U.grow:
            x, y = P[i]; w, h = U.W[i], U.H[i]
            cov0 |= (U.coast[:, 0] >= x + 1) & (U.coast[:, 0] < x + w - 1) & (U.coast[:, 1] >= y + 1) & (U.coast[:, 1] < y + h - 1)
    covg = np.zeros(len(U.coast), bool)
    for i, m in enumerate(U.ids):
        if m in size:
            x, y = P[i]; w, h = U.W[i], U.H[i]
            covg |= (U.coast[:, 0] >= x + 1) & (U.coast[:, 0] < x + w - 1) & (U.coast[:, 1] >= y + 1) & (U.coast[:, 1] < y + h - 1)
    res = dict(wariant=var, skala=U.s, kratek_na_piksel_atlasu=U.s, pokrycie=round(float(r["cov"].mean()) * 100, 1),
               pokrycie_bez_nowych_map=round(float(covg.mean()) * 100, 1), pokrycie_obecnymi_mapami_w_obecnych_rozmiarach=round(float(cov0.mean()) * 100, 1),
               mapy=nm, powiekszone=U.grow, nowe_mapy=U.extra, przejscia_obecne=stany, przejscia_nowe=nowe, niepokryte=seg, nakladanie=ov,
               rozmiar_kruka_kratek=[round(1075 * U.s), round(635 * U.s)])
    return res


def zrobB(sc=0.85):
    """Wariant B: układ A (mapy i przejścia bez zmian) w środku, a kruk w większej skali; brzeg dopełniają nowe mapy."""
    global SHIFT
    st = json.load(open(os.path.join(os.environ.get("KRUK_TMP", "."), "stan_A.json")))
    ex_ids = {e["id"] for e in st["extra"]}
    pos = {int(m): v for m, v in st["pos"].items() if int(m) not in ex_ids}
    grow = {int(k): tuple(v) for k, v in st["grow"].items()}
    U0 = Uklad("B", grow=grow, scale=sc)
    P0 = np.array([pos[m] for m in U0.ids])
    x0, y0 = P0[:, 0], P0[:, 1]; x1, y1 = x0 + U0.W, y0 + U0.H
    base = U0.coast.copy(); best = None
    for dx in range(-300, 301, 12):
        for dy in range(-200, 201, 12):
            c = base + (dx, dy)
            ins = ((c[:, 0:1] >= x0 + 1) & (c[:, 0:1] < x1 - 1) & (c[:, 1:2] >= y0 + 1) & (c[:, 1:2] < y1 - 1)).any(1).sum()
            if best is None or ins > best[0]: best = (ins, dx, dy)
    SHIFT = (best[1], best[2])
    U = Uklad("B", grow=grow, scale=sc, shift=SHIFT)
    extra = []
    for rnd in range(6):
        Ux = Uklad("B", extra=extra, grow=grow, scale=sc, shift=SHIFT)
        P = np.array([pos[m] if m in pos else None for m in Ux.ids], dtype=object)
        Pd = {m: pos[m] for m in pos}
        for e in extra: Pd[e["id"]] = e["pos"]
        Pn = np.array([Pd[m] for m in Ux.ids])
        extra2, Pd2 = dodaj_nowe(Ux, Pn, ile=12, minpkt=6, start_id=900)
        for e in extra2:
            if "pos" not in e: e["pos"] = Pd2[e["id"]]
        if len(extra2) == len(extra): break
        extra = extra2
    U = Uklad("B", extra=extra, grow=grow, scale=sc, shift=SHIFT)
    P = np.array([Pd2[m] for m in U.ids])
    return U, P


if __name__ == "__main__":
    a = sys.argv[1:]
    if a and a[0] == "maska": zrob_maske(); sys.exit()
    var = a[0] if a else "A"
    sc = float(a[1]) if len(a) > 1 else None
    init = None
    if var == "B":      # punkt wyjścia: układ A rozciągnięty do większej skali
        pa = json.load(open(os.path.join(os.environ.get("KRUK_TMP", os.environ.get("TEMP", ".")), "poz_A_0.7.json")))
        r = sc / 0.70
        ids = pa["pos"]; ex = {e["id"]: e["size"] for e in pa["extra"]}
        cx, cy = 535 * 0.70, 317 * 0.70
        init = {}
        for k, (x, y) in ids.items():
            k = int(k)
            if k in ex: continue
            w, h = size[k]
            init[k] = (int((x + w / 2 - cx) * r + cx * r - w / 2), int((y + h / 2 - cy) * r + cy * r - h / 2))
    if var == "B" and "stan" not in a:
        U, P = zrobB(sc)
    elif len(a) > 2 and a[2] == "stan":       # tylko obraz i wynik ze zapisanego stanu
        st = json.load(open(os.path.join(os.environ.get("KRUK_TMP", "."), "stan_%s.json" % var)))
        U = Uklad(var, extra=[dict(e, size=tuple(e["size"])) for e in st["extra"]], grow={int(k): tuple(v) for k, v in st["grow"].items()}, scale=st["scale"], shift=tuple(st.get("shift", (0, 0))))
        P = np.array([st["pos"][str(m)] for m in U.ids])
        if "dopelnij" in a:       # bez wyżarzania: powiększenia E/S i dodatkowe nowe mapy tam, gdzie brzeg nadal leży poza mapami
            for m, (dx, dy) in POPRAWKI.get(var, {}).items():
                if m in U.idx: P[U.idx[m]] += (dx, dy)
            POPRAWKI[var] = {}
            ex2, Pd0 = przytnij(U, P)
            U = Uklad(var, extra=ex2, grow=U.grow, scale=U.s, shift=U.shift); P = np.array([Pd0[m] for m in U.ids])
            grow = rozszerz(U, P, minpkt=5)
            Ux = Uklad(var, extra=U.extra, grow=grow, scale=U.s)
            extra, Pd = dodaj_nowe(Ux, P, ile=10, minpkt=5, start_id=900)
            U = Uklad(var, extra=extra, grow=grow, scale=U.s, shift=U.shift)
            P = np.array([Pd[m] for m in U.ids])
    else:
        U, P = zrob(var, scale=sc, init=init)
    r = policz(U, P)
    print("energia", [round(float(x)) for x in r["e"]], "pokrycie", round(float(r["cov"].mean()), 3), "powiekszone", U.grow, "nowe", [(e["id"], e["size"], e["from"], e["side"]) for e in U.extra])
    for a_, b_, d in r["lk"]: print("  zle", U.ids[a_], U.ids[b_], round(d))
    pos = {m: [int(P[i][0]), int(P[i][1])] for i, m in enumerate(U.ids)}
    json.dump({"pos": pos, "extra": U.extra}, open(os.path.join(os.environ.get("KRUK_TMP", os.environ.get("TEMP", ".")), "poz_%s_%s.json" % (var, sc)), "w"))
    json.dump(dict(pos={m: [int(P[i][0]), int(P[i][1])] for i, m in enumerate(U.ids)}, extra=U.extra, grow=U.grow, scale=U.s, shift=list(U.shift)),
              open(os.path.join(os.environ.get("KRUK_TMP", "."), "stan_%s.json" % var), "w"))
    res = wynik(U, P, var, sc)
    json.dump(res, open(os.path.join(ROOT, "docs", "mapy", "kruk_wynik_%s.json" % var), "w", encoding="utf-8"), ensure_ascii=False, indent=1, default=lambda o: o.item() if hasattr(o, 'item') else str(o))
    tyt = "Kruk - propozycja %s: skala %.2f kratki na piksel Atlasu. Brzeg na mapach: %.1f%%." % (var, U.s, res["pokrycie"])
    print(rysuj(U, P, os.path.join(ROOT, "docs", "mapy", "kruk_propozycja_%s.png" % var), tyt))
