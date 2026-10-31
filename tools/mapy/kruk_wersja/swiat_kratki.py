# -*- coding: utf-8 -*-
# Świat w kratkach (2026-10-30, PROJEKT; nic nie zapisuje do data/ ani js/).
# Jeden wielki świat w kratkach: sylwetka kruka z Atlasu (docs/mapy/kruk_maska.png), skala 0,70 kratki na piksel Atlasu, wygładzona
# (łuki, zatoki, cyple). Mapy plenerowe to prostokątne wycinki świata ułożone jak puzzle: sąsiedzi dzielą krawędź co do kratki.
# Brzeg omija treść: budynki, zdarzenia z akcją, miejsca zadań, obozy, studnie itp. nie idą pod morze (linia brzegu wybrzusza się wokół nich).
# Wyjście: docs/mapy/swiat.json, swiat_maska.png; obrazki robi swiat_obrazy.py, opis swiat_opis.py, sprawdzanie krawędzi swiat_krawedzie.py.
#   python tools/mapy/swiat_kratki.py
import os, sys, json, math, collections, re
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

S = 0.70                      # kratki na piksel Atlasu
OFF = (80, 60)                # kratka świata = kratka maski + OFF
WW, WH = 940, 600
DOCS = os.path.join(ROOT, "docs", "mapy")
ATLAS = os.path.join(ROOT, "docs", "ekran_tytulowy", "tytul_08_atlas_kruczej_wyspy.png")
MASKA = os.path.join(DOCS, "kruk_maska.png")
DATA = os.path.join(ROOT, "data")
PLAYER = {1, 3, 4, 8, 13, 23, 24, 25, 26, 111}
NAMES = {8: "Okolice Tawerny", 24: "Posiadłość Lorda", 111: "Podgrodzie", 125: "Przystań", 22: "Polna droga", 20: "Dom dziadka",
         21: "Leśna droga", 13: "Góry i kamieniołom", 120: "Osada Milczących", 175: "Orla Grań", 23: "Skraj lasu", 168: "Spalona zagroda",
         3: "Kruczy Jar", 4: "Łąka#1", 17: "Łąka#2", 18: "Łąka#3", 162: "Garnizon nad zatoką", 165: "Wrak na mieliźnie", 155: "Pustelnia na klifie",
         157: "Urwisko Kruków", 159: "Przylądek z latarnią"}
OUTDOOR = list(NAMES)

# ---- układ ręczny (kratki maski, lewy górny róg). Dom dziadka (20) dotyka Kruczego Jaru (3) od południa; 24 dotyka 3 od zachodu.
CORE = {
    175: (324, 0), 13: (324, 60), 8: (340, 156), 125: (340, 294), 111: (238, 189), 21: (360, 374),
    18: (-34, 165), 165: (46, 245), 162: (126, 200), 155: (106, 86), 157: (202, 84),
    120: (444, 64), 22: (444, 132), 4: (529, 132), 24: (444, 192), 3: (524, 192), 23: (604, 192), 20: (524, 252), 17: (604, 252),
    159: (540, 52), 168: (684, 148),
}
# powiększenia na zewnątrz (w prawo, w dół): 111 +10 w prawo = pas na suche koryto tuż za murem miasta (nowe kolumny za murem, treść bez zmian)
GROW = {155: (0, 42), 22: (5, 0), 20: (20, 0), 111: (10, 0), 157: (10, 0)}
# nowe mapy ręczne (porządne, nie mikro): id, x, y, szer., wys., rodzic, nazwa, opis
MANUAL = [
    dict(id=900, x=609, y=132, w=75, h=60, z=4, nazwa="Pola pod grzbietem", opis="pola i łąka za Łąką#1, droga do Spalonej zagrody, widok na wzgórza"),
    dict(id=901, x=444, y=252, w=80, h=42, z=24, nazwa="Sady pod dworem", opis="sady i ogrody Lorda, ścieżka nad zatokę"),
]
# droga kończy się przy celu (zdarzenie o takiej nazwie w danej mapie), nie w morzu: klucz = początek nazwy drogi
ROAD_CELE = {"Trakt zachodni": (165, r"wrak|kuter"), "Szlak latarni": (159, r"latarni"), "Droga ku Spalonej": (168, r"stodo"), "Droga pola dziadka": (20, r"drzwi chaty"),
             "Trakt portowy": (125, r"nabrzeze")}

ROADS = {
    "Trakt portowy (brama południowa miasta -> nabrzeże Przystani)": [(365, 286), (364, 298), (361, 306)],
    "Droga leśna (nabrzeże -> Leśna droga)": [(361, 306), (362, 340), (368, 372), (380, 392), (400, 404)],
    "Droga do dworu i do pola (brama wschodnia -> dwór -> Kruczy Jar -> Skraj lasu)": [(436, 206), (480, 206), (524, 207), (604, 205), (650, 208)],
    "Droga pola dziadka (Kruczy Jar -> Dom dziadka)": [(533, 215), (533, 252), (538, 258)],
    "Droga Kruczego Jaru (Łąka#1 -> Kruczy Jar)": [(553, 160), (553, 192), (553, 215)],
    "Droga polna (miasto -> Polna droga -> Osada)": [(436, 174), (480, 172), (490, 150), (490, 100)],
    "Droga ku Spalonej zagrodzie (Łąka#1 -> pola -> zagroda)": [(570, 170), (609, 168), (650, 172), (684, 176), (720, 185)],
    "Trakt zachodni (miasto -> most nad korytem -> Podgrodzie -> Garnizon -> Wrak)": [(350, 206), (339, 206), (326, 208), (300, 222), (238, 234), (180, 252), (126, 264), (80, 266), (60, 266)],
    "Szlak Pustelni (Góry -> Urwisko -> Pustelnia)": [(332, 99), (270, 110), (202, 120), (150, 130), (106, 130), (92, 128)],
    "Szlak latarni (Góry -> Osada -> Latarnia)": [(436, 72), (490, 90), (540, 92), (590, 100), (620, 110)],
    "Droga łąk (Skraj lasu -> Łąka#2)": [(644, 228), (644, 252), (642, 290)],
    "Szlak górski (północna brama miasta -> Góry -> Orla Grań)": [(390, 164), (391, 130), (387, 100), (385, 70), (382, 40), (379, 12)],
}
# suche koryto rzeki (bez wody): rzeka znika pod wzgórzem zamkowym (wlot w Górach) i wypływa suchym jarem tuż za zachodnim murem miasta (pas w Podgrodziu),
# kończąc się w basenie Przystani (dawne ujście rzeki)
KORYTO = [
    [(372, 18), (376, 50), (384, 90), (392, 122), (394, 148)],
    [(333, 193), (333, 215), (333, 245), (334, 275), (338, 292), (345, 299), (352, 300)],
]
WLOT = (394, 148)
WYLOT = (333, 193)
RIVER = KORYTO[1]


def W(p): return (p[0] + OFF[0], p[1] + OFF[1])


def chaikin(pts, n=3):
    for _ in range(n):
        out = [pts[0]]
        for a, b in zip(pts, pts[1:]):
            out += [(a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25), (a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75)]
        out.append(pts[-1]); pts = out
    return pts


def sizes():
    out = {}
    for m in OUTDOOR:
        d = json.load(open(os.path.join(DATA, "Map%03d.json" % m), encoding="utf-8"))
        out[m] = (d["width"], d["height"])
    return out


def font(sz, bold=True):
    for f in (("C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf") if bold else ("C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf")):
        if os.path.exists(f): return ImageFont.truetype(f, sz)
    return ImageFont.load_default()


# ------------------------------------------------------------------------------------------------ maska lądu (gładka)
K = 4
def dilate(a, r):
    out = a.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            if dx * dx + dy * dy <= r * r: out |= np.roll(np.roll(a, dy, 0), dx, 1)
    return out


def gladka_bool(a, sigma):
    big = Image.fromarray((a * 255).astype("uint8")).resize((WW * K, WH * K), Image.NEAREST).filter(ImageFilter.GaussianBlur(sigma * K))
    return np.array(big.resize((WW, WH), Image.BOX)) > 127


def erode(a, r):
    return ~dilate(~a, r)


def ziemia_gladka(extra=None, sigma=2.6):
    """sylwetka kruka z Atlasu, UPROSZCZONA (gracz: kształt tylko z grubsza): zamknięcie (r=11) wypełnia wąskie wcięcia i zatoczki, otwarcie (r=6) usuwa pióra
    i palce lądu, potem łagodne wygładzenie: spokojny brzeg z łagodnymi łukami. extra = kratki, które mają być lądem (wybrzuszenia wokół treści)"""
    m = Image.open(MASKA).convert("L").crop((110, 58, 110 + 1075, 58 + 635))
    t = np.array(m.resize((int(1075 * S), int(635 * S)), Image.BOX)) > 127
    a = np.zeros((WH, WW), bool)
    a[OFF[1]:OFF[1] + t.shape[0], OFF[0]:OFF[0] + t.shape[1]] = t
    a = erode(dilate(a, 11), 11)
    a = dilate(erode(a, 6), 6)
    if extra is not None: a = a | extra
    big = Image.fromarray((a * 255).astype("uint8")).resize((WW * K, WH * K), Image.NEAREST).filter(ImageFilter.GaussianBlur(sigma * K))
    return np.array(big.resize((WW, WH), Image.BOX)) > 127


# ------------------------------------------------------------------------------------------------ treść map
CONTENT_TAGS = {"Town", "Garnizon", "Wyspa", "Wrak", "Latarnia", "Studnia", "Zagroda", "BustName", "Light", "Occupy"}
CONTENT_NAME = re.compile(r"chat|dom |dom$|drzwi|studni|stodo|krzy|obóz|obozu|nora|norę|źródł|ognisk|namiot|kuter|brama|wież|ruin|kapliczk|posąg|\bule\b|gniazd|menhir|kopczyk|"
                          r"stragan|stołek|beczk|taczk|kura|owca|chorąg|kosz|lukarn|dym z|ozdoba|blokad|palisad|płot|most|pomost|słup|grób|ołtarz|latarn|wrak|tablic|ławk|stół|wóz|piec|kurnik|chlewik|"
                          r"cysterna|miejsce|^EV\d+|miejsc|zagrod|ogrodzie|kocioł|furtk|mur", re.I)
OCC = re.compile(r"<Occupy:([^>]*)>")


def tresc_mapy(mid):
    """zdarzenia z treścią (budynki, miejsca, obozy, studnie...): lista (id, nazwa, x0, y0, x1, y1) w kratkach mapy (bez przejść i zasobów)"""
    d = json.load(open(os.path.join(DATA, "Map%03d.json" % mid), encoding="utf-8"))
    w, h = d["width"], d["height"]
    out = []
    wm_ = woda_mapy(mid)
    blk = None
    for e in d["events"]:
        if not e: continue
        name = e["name"] or ""; note = e.get("note", "") or ""
        if wm_[e["y"], e["x"]]:
            if blk is None:
                import mapylib as L_
                mp_ = L_.Mapa(mid)
                blk = np.array([[not mp_.check_passage(x, y, 0x0f) for x in range(w)] for y in range(h)])
            if blk[e["y"], e["x"]]: continue      # łódź, prom, wrak na wodzie: pływa, nie potrzebuje lądu
        if name.startswith("Przejście") or name.startswith("Przej"): continue
        tag = re.findall(r"<(\w+)", note)
        tag = tag[0] if tag else ""
        tag_all = set(re.findall(r"<(\w+)", note))
        if (tag_all & CONTENT_TAGS) or (CONTENT_NAME.search(name) and tag not in ("Tree", "Log", "Stump", "Rock")) or ("Occupy" in tag_all):
            x0 = x1 = e["x"]; y0 = y1 = e["y"]
            mo = OCC.search(note)
            if mo:
                kv = dict(p.split("=") for p in mo.group(1).split(",") if "=" in p)
                x1 += int(kv.get("right", 0)); x0 -= int(kv.get("left", 0)); y0 -= int(kv.get("up", 0)); y1 += int(kv.get("down", 0))
            out.append((e["id"], name, max(0, x0), max(0, y0), min(w - 1, x1), min(h - 1, y1)))
    return out


class Swiat:
    def __init__(self):
        self.size = sizes()
        self.cele = {}
        self.rects = {}
        self.grow = {}
        for m, (x, y) in CORE.items():
            w, h = self.size[m]
            dw, dh = GROW.get(m, (0, 0))
            self.rects[m] = [x + OFF[0], y + OFF[1], w + dw, h + dh]
            if dw or dh: self.grow[m] = (dw, dh)
        self.new = {}
        for e in MANUAL:
            self.rects[e["id"]] = [e["x"] + OFF[0], e["y"] + OFF[1], e["w"], e["h"]]
            self.new[e["id"]] = dict(z=e["z"], strona="?", nazwa=e["nazwa"], opis=e["opis"], reczna=True)
        self.L_raven = self.wytnij_zatoke(ziemia_gladka())
        self.cele_drog()
        # treść i wybrzuszenia
        self.tresc = {m: [(i, n, x0 + self.rects[m][0], y0 + self.rects[m][1], x1 + self.rects[m][0], y1 + self.rects[m][1]) for (i, n, x0, y0, x1, y1) in tresc_mapy(m)] for m in OUTDOOR}
        P = np.zeros((WH, WW), bool)
        for m, lst in self.tresc.items():
            for (i, n, x0, y0, x1, y1) in lst:
                P[max(0, y0 - 2):y1 + 3, max(0, x0 - 2):x1 + 3] = True
        self.P = P
        sea0 = ~self.L_raven
        self.w_pasie = {m: [t for t in lst if sea0[t[3]:t[5] + 1, t[2]:t[4] + 1].any()] for m, lst in self.tresc.items()}   # treść, która wpada w morze surowej sylwetki
        extra = self.obwiednie()
        extra = self.mostki(extra | dilate(P, 2))
        self.L = self.L_raven | gladka_bool(dilate(extra, 2), 3.2) | dilate(P, 1)
        self.bulge = int((self.L & ~self.L_raven).sum())
        self.finish_masks()
        soft = np.array(Image.fromarray((self.L * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(1.6))).astype(float) / 255.0
        self.gy, self.gx = np.gradient(soft)

    def cele_drog(self):
        """koniec każdej drogi z ROAD_CELE ustawiany na zdarzenie docelowe (kratki maski): droga kończy się przy celu, nie w morzu"""
        for key, (mid, rx) in ROAD_CELE.items():
            d = json.load(open(os.path.join(DATA, "Map%03d.json" % mid), encoding="utf-8"))
            cand = [e for e in d["events"] if e and re.search(rx, (e["name"] or "").lower().replace("ł", "l").replace("ż", "z").replace("ó", "o")) ]
            if not cand: continue
            e = cand[0]
            tx, ty = e["x"] + self.rects[mid][0] - OFF[0], e["y"] + self.rects[mid][1] - OFF[1]
            for name in list(ROADS):
                if name.startswith(key):
                    pts = list(ROADS[name]); pts[-1] = (tx, ty + 1); ROADS[name] = pts
                    self.cele[name] = (mid, e["name"], tx, ty)

    def wytnij_zatoke(self, L):
        """Zatoka w kącie między lewym skrzydłem a ogonem: statki płyną wzdłuż lewego boku ogona do basenu Przystani (125, zachodnia część mapy).
        Basen mapy (woda zablokowana w kafelkach) staje się morzem z maski, a zatoka łączy go z morzem od zachodu / południowego zachodu."""
        x0, y0 = self.rects[125][0], self.rects[125][1]
        poly = [(x0, y0 + 7), (x0 - 24, y0 + 10), (x0 - 50, y0 + 12), (x0 - 80, y0 + 2), (x0 - 92, y0 + 46), (x0 - 90, y0 + 86), (x0 - 76, y0 + 124),
                (x0 - 48, y0 + 128), (x0 - 20, y0 + 104), (x0, y0 + 82)]
        im = Image.new("L", (WW, WH), 0)
        ImageDraw.Draw(im).polygon(poly, fill=255)
        sea = gladka_bool(np.array(im) > 0, 2.5)
        # basen mapy 125: woda, której nie da się przejść (pomosty zostają lądem)
        import mapylib as L_
        mp = L_.Mapa(125)
        wm = woda_mapy(125)
        for yy in range(wm.shape[0]):
            for xx in range(wm.shape[1]):
                if wm[yy, xx] and not mp.check_passage(xx, yy, 0x0f):
                    if 0 <= x0 + xx < WW and 0 <= y0 + yy < WH: sea[y0 + yy, x0 + xx] = True
        self.basen = sea.copy()
        return L & ~sea

    def obwiednie(self):
        """wybrzuszenie wokół treści jako wypukła obwiednia (gładki cypel), nie cienkie macki: dla każdej mapy obwiednia kratek treści z morza surowej sylwetki
        razem z pobliskim lądem (kotwica)"""
        out = np.zeros((WH, WW), bool)
        for m, lst in self.w_pasie.items():
            if not lst: continue
            C = np.zeros((WH, WW), bool)
            for (i, n, x0, y0, x1, y1) in lst: C[max(0, y0 - 2):y1 + 3, max(0, x0 - 2):x1 + 3] = True
            A = C | (dilate(C, 9) & self.L_raven)
            ys, xs = np.where(A)
            pts = sorted(set(zip(xs.tolist(), ys.tolist())))
            if len(pts) < 3: out |= A; continue
            def cross(o, a, b): return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
            lo = []
            for p_ in pts:
                while len(lo) >= 2 and cross(lo[-2], lo[-1], p_) <= 0: lo.pop()
                lo.append(p_)
            up = []
            for p_ in reversed(pts):
                while len(up) >= 2 and cross(up[-2], up[-1], p_) <= 0: up.pop()
                up.append(p_)
            hull = lo[:-1] + up[:-1]
            im = Image.new("L", (WW, WH), 0)
            ImageDraw.Draw(im).polygon(hull, fill=255)
            out |= (np.array(im) > 0) | A
        return dilate(out, 2)

    def kat_pola(self, x, y):
        """kierunek brzegu w kratce (x, y) z pola maski (gradient wygładzonej maski): ta sama wartość dla obu map; 0 = w prawo, 90 = w górę"""
        gx, gy = self.gx[int(y), int(x)], self.gy[int(y), int(x)]
        if abs(gx) + abs(gy) < 1e-4: return None
        return round(math.degrees(math.atan2(-gx, -gy)) % 180, 1)

    def mostki(self, extra):
        """wyspy lądu powstałe wokół treści łączy z lądem pasem (żeby nie było wysepek): najkrótsza droga przez morze, szerokość 7"""
        land = self.L_raven | extra
        lab = np.zeros(land.shape, int); n = 0
        ys, xs = np.where(land)
        sizes_ = {}
        for y0, x0 in zip(ys, xs):
            if lab[y0, x0]: continue
            n += 1; st = [(x0, y0)]; lab[y0, x0] = n; c = 0
            while st:
                x, y = st.pop(); c += 1
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    u, v = x + dx, y + dy
                    if 0 <= u < WW and 0 <= v < WH and land[v, u] and not lab[v, u]: lab[v, u] = n; st.append((u, v))
            sizes_[n] = c
        main = max(sizes_, key=sizes_.get)
        out = extra.copy()
        for k in sizes_:
            if k == main: continue
            # BFS od wyspy do lądu głównego przez morze
            src = [(x, y) for y, x in zip(*np.where(lab == k))]
            prev = {p: None for p in src}; q = collections.deque(src); hit = None
            while q and hit is None:
                x, y = q.popleft()
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    u, v = x + dx, y + dy
                    if 0 <= u < WW and 0 <= v < WH and (u, v) not in prev:
                        prev[(u, v)] = (x, y)
                        if lab[v, u] == main: hit = (u, v); break
                        q.append((u, v))
            if hit:
                cur = hit
                while cur is not None:
                    x, y = cur
                    out[max(0, y - 3):y + 4, max(0, x - 3):x + 4] = True
                    cur = prev[cur]
        return out

    def finish_masks(self):
        sea = ~self.L
        near = dilate(sea, 8)
        self.T = self.L & near
        self.coast = self.L & (np.roll(sea, 1, 0) | np.roll(sea, -1, 0) | np.roll(sea, 1, 1) | np.roll(sea, -1, 1))

    def occ(self):
        o = np.full((WH, WW), -1, int)
        for m, (x, y, w, h) in self.rects.items():
            sl = o[max(0, y):y + h, max(0, x):x + w]
            if (sl >= 0).any(): print("NAKŁADANIE", m, "z", set(np.unique(sl[sl >= 0])))
            o[max(0, y):y + h, max(0, x):x + w] = m
        return o

    def rozszerz(self, maks=60, minz=70):
        """zamiast nowej mapy: powiększenie obecnej mapy spoza listy gracza w prawo lub w dół (na zewnątrz), gdzie brzeg leży poza mapami"""
        for _ in range(30):
            o = self.occ(); cov = o >= 0
            gap = self.T & ~cov
            best = None
            for m, (x, y, w, h) in list(self.rects.items()):
                if m in PLAYER or m not in self.size: continue
                dw0, dh0 = self.grow.get(m, (0, 0))
                for side in "ES":
                    for g in range(10, maks + 1, 10):
                        if (side == "E" and dw0 + g > maks) or (side == "S" and dh0 + g > maks): break
                        if side == "E": nx, ny, nw, nh = x + w, y, g, h
                        else: nx, ny, nw, nh = x, y + h, w, g
                        if nx + nw > WW or ny + nh > WH: break
                        if (o[ny:ny + nh, nx:nx + nw] >= 0).any(): break
                        gn = int(gap[ny:ny + nh, nx:nx + nw].sum())
                        sc = gn / float(nw * nh) if gn >= minz else 0
                        if sc > 0.12 and (best is None or sc > best[0]): best = (sc, m, side, g)
            if best is None: break
            _, m, side, g = best
            x, y, w, h = self.rects[m]
            dw0, dh0 = self.grow.get(m, (0, 0))
            if side == "E": self.rects[m][2] += g; self.grow[m] = (dw0 + g, dh0)
            else: self.rects[m][3] += g; self.grow[m] = (dw0, dh0 + g)
        return self

    def dopelnij(self, minz=25, maks=40, id0=910):
        sizes_ = [(120, 80), (100, 80), (80, 80), (120, 60), (100, 60), (80, 60), (60, 60)]
        while len(self.new) < maks:
            o = self.occ(); cov = o >= 0
            gap = self.T & ~cov
            I = np.pad(gap.astype(int).cumsum(0).cumsum(1), ((1, 0), (1, 0)))

            def suma(x, y, w, h):
                x0, y0, x1, y1 = max(0, x), max(0, y), min(WW, x + w), min(WH, y + h)
                if x1 <= x0 or y1 <= y0: return 0
                return I[y1, x1] - I[y0, x1] - I[y1, x0] + I[y0, x0]
            best = None
            for m, (x, y, w, h) in list(self.rects.items()):
                for (nw, nh) in sizes_:
                    for side in "NSEW":
                        rng = range(-nh + 12, h - 12, 4) if side in "EW" else range(-nw + 12, w - 12, 4)
                        for off in rng:
                            if side == "E": nx, ny = x + w, y + off
                            elif side == "W": nx, ny = x - nw, y + off
                            elif side == "S": nx, ny = x + off, y + h
                            else: nx, ny = x + off, y - nh
                            if nx < 0 or ny < 0 or nx + nw > WW or ny + nh > WH: continue
                            if (o[ny:ny + nh, nx:nx + nw] >= 0).any(): continue
                            g = suma(nx, ny, nw, nh)
                            al = (nx == x or nx + nw == x + w) if side in "NS" else (ny == y or ny + nh == y + h)
                            sc = g - 0.0012 * nw * nh + (6 if al else 0)
                            if g >= minz and (best is None or sc > best[0]): best = (sc, m, side, nx, ny, nw, nh)
            if best is None: break
            _, m, side, nx, ny, nw, nh = best
            nid = max([id0 - 1] + [k for k in self.new]) + 1
            self.rects[nid] = [nx, ny, nw, nh]
            self.new[nid] = dict(z=m, strona=side)
        return self

    # ---- krawędzie
    def sasiedzi(self):
        out = []
        ids = list(self.rects)
        for a in ids:
            ax, ay, aw, ah = self.rects[a]
            for b in ids:
                if a == b: continue
                bx, by, bw, bh = self.rects[b]
                if ax + aw == bx:
                    lo, hi = max(ay, by), min(ay + ah, by + bh)
                    if hi > lo: out.append((a, "E", b, "W", lo, hi))
                if ay + ah == by:
                    lo, hi = max(ax, bx), min(ax + aw, bx + bw)
                    if hi > lo: out.append((a, "S", b, "N", lo, hi))
        return out

    def przejscia(self, sas):
        pas = []
        for (a, sa, b, sb, lo, hi) in sas:
            ax, ay, aw, ah = self.rects[a]
            X = (ax + aw) if sa == "E" else None
            Y = (ay + ah) if sa == "S" else None
            for name, pts in ROADS.items():
                pw = chaikin([W(p) for p in pts])
                for p, q in zip(pw, pw[1:]):
                    if sa == "E" and min(p[0], q[0]) <= X <= max(p[0], q[0]) and p[0] != q[0]:
                        y = p[1] + (q[1] - p[1]) * (X - p[0]) / (q[0] - p[0])
                        if lo <= y < hi: pas.append(dict(a=a, b=b, strona=sa, pos=int(round(y)), droga=name))
                    if sa == "S" and min(p[1], q[1]) <= Y <= max(p[1], q[1]) and p[1] != q[1]:
                        x = p[0] + (q[0] - p[0]) * (Y - p[1]) / (q[1] - p[1])
                        if lo <= x < hi: pas.append(dict(a=a, b=b, strona=sa, pos=int(round(x)), droga=name))
        uniq = []
        for p in pas:
            if not any(u["a"] == p["a"] and u["b"] == p["b"] and abs(u["pos"] - p["pos"]) <= 2 and u["droga"] == p["droga"] for u in uniq): uniq.append(p)
        pas = uniq
        for (a, sa, b, sb, lo, hi) in sas:
            for n, p in ((a, b), (b, a)):
                if n in self.new and self.new[n]["z"] == p and not any((q["a"] == a and q["b"] == b) for q in pas):
                    pas.append(dict(a=a, b=b, strona=sa, pos=(lo + hi) // 2, droga="Ścieżka brzegowa"))
        return pas

    def polaczone(self, pas):
        g = collections.defaultdict(set)
        for p in pas: g[p["a"]].add(p["b"]); g[p["b"]].add(p["a"])
        seen = {8}; st = [8]
        while st:
            k = st.pop()
            for n in g[k]:
                if n not in seen: seen.add(n); st.append(n)
        return [m for m in self.rects if m not in seen]

    def trasa(self, pas, a, b):
        g = collections.defaultdict(set)
        for p in pas: g[p["a"]].add(p["b"]); g[p["b"]].add(p["a"])
        prev = {a: None}; q = collections.deque([a])
        while q:
            k = q.popleft()
            for n in g[k]:
                if n not in prev: prev[n] = k; q.append(n)
        if b not in prev: return None
        out = [b]
        while prev[out[-1]] is not None: out.append(prev[out[-1]])
        return out[::-1]


# ------------------------------------------------------------------------------------------------ brzeg na krawędziach
def kat_brzegu(L, cx, cy, xs, ys, r=12):
    """kąt (0-180, 0 = w prawo, w kierunku osi x) linii brzegu wokół punktu (cx, cy), tylko z kratek w granicach mapy (xs, ys = zakresy)"""
    pts = []
    for y in range(max(ys[0], int(cy) - r), min(ys[1], int(cy) + r + 1)):
        for x in range(max(xs[0], int(cx) - r), min(xs[1], int(cx) + r + 1)):
            if not L[y, x]: continue
            nb = [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
            if any(xs[0] <= u < xs[1] and ys[0] <= v < ys[1] and not L[v, u] for u, v in nb): pts.append((x + .5, y + .5))
    if len(pts) < 8: return None
    a = np.array(pts); a -= a.mean(0)
    u, s, vt = np.linalg.svd(a, full_matrices=False)
    d = vt[0]
    return round(math.degrees(math.atan2(-d[1], d[0])) % 180, 1)


def _przeciecia(col, lo):
    return [lo + i for i in range(1, len(col)) if col[i] != col[i - 1]]


def brzeg_na_krawedziach(sw, sas):
    """dla każdej wspólnej krawędzi: kratki świata, w których brzeg przecina krawędź, i jego kierunek (kąt liczony osobno z każdej strony);
    skok = przesunięcie przecięcia między ostatnią kolumną jednej mapy a pierwszą drugiej (kratki), ma być <= 1 przy łagodnym brzegu"""
    out = []
    L = sw.L
    for (a, sa, b, sb, lo, hi) in sas:
        ax, ay, aw, ah = sw.rects[a]; bx, by, bw, bh = sw.rects[b]
        if sa == "E":
            XA, XB = ax + aw - 1, bx
            colA = L[lo:hi, XA]; colB = L[lo:hi, XB]
        else:
            YA, YB = ay + ah - 1, by
            colA = L[YA, lo:hi]; colB = L[YB, lo:hi]
        pa = _przeciecia(colA, lo); pb = _przeciecia(colB, lo)
        if not pa and not pb and bool(colA[0]) == bool(colB[0]): continue
        skok = 0
        for pos in pa:
            qb = min(pb, key=lambda v: abs(v - pos)) if pb else None
            if qb is not None and abs(qb - pos) <= 3: skok = max(skok, abs(qb - pos))
        cross = []
        rng_a = ((ax, ax + aw), (ay, ay + ah)); rng_b = ((bx, bx + bw), (by, by + bh))
        for pos in pa:
            if sa == "E":
                ka = kat_brzegu(L, XA + .5, pos, rng_a[0], rng_a[1]); kb = kat_brzegu(L, XB + .5, pos, rng_b[0], rng_b[1])
            else:
                ka = kat_brzegu(L, pos, YA + .5, rng_a[0], rng_a[1]); kb = kat_brzegu(L, pos, YB + .5, rng_b[0], rng_b[1])
            kp = sw.kat_pola(XA + 1 if sa == "E" else pos, pos if sa == "E" else YA + 1)
            cross.append(dict(pos=int(pos), przejscie=("lad->morze" if colA[pos - lo - 1] else "morze->lad"), kat=kp, kat_a=ka, kat_b=kb,
                              roznica_kata=(None if ka is None or kb is None else round(min(abs(ka - kb), 180 - abs(ka - kb)), 1))))
        out.append(dict(a=a, b=b, strona=sa, od=int(lo), do=int(hi), skok_kratek=int(skok), przeciecia=cross))
    return out


# ------------------------------------------------------------------------------------------------ niezgodność z maską
def woda_mapy(mid):
    d = json.load(open(os.path.join(DATA, "Map%03d.json" % mid), encoding="utf-8"))
    w, h = d["width"], d["height"]
    a = np.array(d["data"]).reshape(-1, h, w)
    wm = np.zeros((h, w), bool)
    for z in (0, 1):
        wm |= (a[z] >= 2048) & (a[z] < 2816)
    return wm


def policz_niezgodnosc(sw):
    out = {}
    for m in OUTDOOR:
        x, y, w, h = sw.rects[m]
        ow, oh = sw.size[m]
        wm = woda_mapy(m)
        L = sw.L[y:y + oh, x:x + ow]
        morze = (~L) & (~wm)
        ladu = L & wm
        nowa_czesc = int(w * h - ow * oh)
        full = sw.L[y:y + h, x:x + w]
        morze_nowa = int((~full).sum() - (~L).sum()) if nowa_czesc else 0
        # treść w morzu (po wybrzuszeniu ma być zero) i treść, którą wybrzuszenie uratowało
        w_morzu = [t for t in sw.tresc[m] if (~sw.L[t[3]:t[5] + 1, t[2]:t[4] + 1]).any()]
        out[m] = dict(morze=int(morze.sum()), morze_proc=round(float(morze.sum()) / (ow * oh) * 100, 1), woda_w_lad=int(ladu.sum()),
                      woda_proc=round(float(ladu.sum()) / (ow * oh) * 100, 1), nowa_czesc=nowa_czesc, nowa_czesc_morza=morze_nowa,
                      tresc_razem=len(sw.tresc[m]), tresc_w_pasie=[dict(id=t[0], nazwa=t[1], x=t[2] - sw.rects[m][0], y=t[3] - sw.rects[m][1]) for t in sw.w_pasie[m]],
                      tresc_w_morzu=[dict(id=t[0], nazwa=t[1]) for t in w_morzu], _morze=morze, _lad=ladu)
    return out


def uruchom(verbose=True):
    sw = Swiat()
    cov0 = (sw.occ() >= 0)
    sw.rozszerz()
    for mz in (60, 40, 25):
        sw.dopelnij(minz=mz)
    cov = sw.occ() >= 0
    if verbose:
        print("mapy rdzenia: %d, nowe: %d, wybrzuszenia: %d kratek, pokrycie linii brzegu: %.2f%%" % (len(CORE), len(sw.new), sw.bulge, float((sw.coast & cov).sum() / sw.coast.sum()) * 100))
    nazwij_nowe(sw)
    return sw


NAZWY_NOWYCH = {("ogon", "południowy"): "Cypel ogona", ("ogon", "zachodni"): "Zatoczka pod ogonem", ("ogon", "wschodni"): "Wschodni brzeg ogona",
                ("lewe skrzydło", "zachodni"): "Zachodnie klify", ("lewe skrzydło", "południowy"): "Mielizny lewego skrzydła",
                ("lewe skrzydło", "północny"): "Północny klif lewego skrzydła", ("prawe skrzydło", "południowy"): "Mielizny prawego skrzydła",
                ("prawe skrzydło", "wschodni"): "Koniec prawego skrzydła", ("prawe skrzydło", "północny"): "Północny brzeg pól",
                ("tułów", "południowy"): "Brzeg pod miastem", ("głowa", "północny"): "Grań nad szczytem"}


def czesc_kruka(ax, ay):
    if ay < 200 and 520 < ax < 780: return "głowa"
    if ay < 330 and 520 < ax < 780: return "barki / góry"
    if ay >= 480: return "ogon"
    if ax < 560: return "lewe skrzydło"
    if ax > 780: return "prawe skrzydło"
    return "tułów"


def nazwij_nowe(sw):
    cnt = {}
    for n, info in sw.new.items():
        x, y, w, h = sw.rects[n]
        cx, cy = x + w // 2, y + h // 2
        ax, ay = (cx - OFF[0]) / S + 110, (cy - OFF[1]) / S + 58
        info["ax"], info["ay"] = int(round(ax)), int(round(ay))
        info["czesc"] = czesc_kruka(ax, ay)
        if info.get("reczna"):
            info["kierunek"] = "-"
            continue
        sea = ~sw.L[max(0, cy - 40):cy + 40, max(0, cx - 40):cx + 40]
        yy, xx = np.where(sea)
        if len(yy):
            dy, dx = yy.mean() - min(40, cy), xx.mean() - min(40, cx)
            k = ("północny" if dy < -abs(dx) * .6 else "południowy" if dy > abs(dx) * .6 else ("zachodni" if dx < 0 else "wschodni"))
        else: k = "wewnętrzny"
        base = NAZWY_NOWYCH.get((info["czesc"], k), "%s, brzeg %s" % (info["czesc"], k))
        cnt[base] = cnt.get(base, 0) + 1
        info["kierunek"] = k
        info["nazwa"] = base + ("" if cnt[base] == 1 else " " + ["", "", "II", "III", "IV", "V"][min(cnt[base], 5)])
        info["opis"] = ("klif z widokiem na morze albo plaża do chodzenia; ścieżka od rodzica, kilka drzew i skał" if w * h >= 4000
                        else "przesmyk brzegu: ścieżka między sąsiadami, skały i widok na morze")


# ------------------------------------------------------------------------------------------------ krawędzie, JSON
def typ_krawedzi(sw, sas):
    R = sw.rects
    ed = {m: {k: [] for k in "NESW"} for m in R}
    for (a, sa, b, sb, lo, hi) in sas:
        ed[a][sa].append(dict(od=lo, do=hi, typ="sasiad", sasiad=b))
        ed[b][sb].append(dict(od=lo, do=hi, typ="sasiad", sasiad=a))
    for m, (x, y, w, h) in R.items():
        for sd in "NESW":
            lo, hi = (y, y + h) if sd in "EW" else (x, x + w)
            tak = sorted(ed[m][sd], key=lambda s_: s_["od"])
            res = []; pos = lo

            def luka(c0, c1, sd=sd, x=x, y=y, w=w, h=h):
                runs = []; cur = None
                for c in range(c0, c1):
                    if sd == "E": X, Y = x + w, c
                    elif sd == "W": X, Y = x - 1, c
                    elif sd == "S": X, Y = c, y + h
                    else: X, Y = c, y - 1
                    t = "morze" if (0 <= X < WW and 0 <= Y < WH and not sw.L[Y, X]) else "sciana"
                    if cur and cur[2] == t and cur[1] == c: cur[1] = c + 1
                    else:
                        if cur: runs.append(cur)
                        cur = [c, c + 1, t]
                if cur: runs.append(cur)
                return [dict(od=a_, do=b_, typ=t, sasiad=None) for a_, b_, t in runs]
            for sg in tak:
                if sg["od"] > pos: res += luka(pos, sg["od"])
                res.append(sg); pos = max(pos, sg["do"])
            if pos < hi: res += luka(pos, hi)
            ed[m][sd] = res
    return ed


def rzeka_przejscia(sw, sas):
    out = []
    pws = [chaikin([W(p) for p in part]) for part in KORYTO]
    for (a, sa, b, sb, lo, hi) in sas:
      for pw in pws:
        ax, ay, aw, ah = sw.rects[a]
        for p, q in zip(pw, pw[1:]):
            if sa == "E":
                X = ax + aw
                if min(p[0], q[0]) <= X <= max(p[0], q[0]) and p[0] != q[0]:
                    y = p[1] + (q[1] - p[1]) * (X - p[0]) / (q[0] - p[0])
                    if lo <= y < hi: out.append(dict(a=a, b=b, strona="E", pos=int(round(y))))
            else:
                Y = ay + ah
                if min(p[1], q[1]) <= Y <= max(p[1], q[1]) and p[1] != q[1]:
                    x = p[0] + (q[0] - p[0]) * (Y - p[1]) / (q[1] - p[1])
                    if lo <= x < hi: out.append(dict(a=a, b=b, strona="S", pos=int(round(x))))
    uniq = []
    for r in out:
        if not any(u["a"] == r["a"] and u["b"] == r["b"] and abs(u["pos"] - r["pos"]) <= 2 for u in uniq): uniq.append(r)
    return uniq


def _na_krawedzi(lst, m, sd, sasiad, od, do):
    inv = {"N": "S", "W": "E"}
    out = []
    for p in lst:
        if sd in "ES" and p["a"] == m and p["b"] == sasiad and p["strona"] == sd and od <= p["pos"] < do: out.append(p)
        if sd in "NW" and p["b"] == m and p["a"] == sasiad and p["strona"] == inv[sd] and od <= p["pos"] < do: out.append(p)
    return out


def porownaj_stare(sw, sas):
    """każde obecne wyjście (kruk.py GROUPS: kratki lokalne całej grupy): zostaje / zmienia cel / zamyka się"""
    import kruk
    R = sw.rects
    out = []
    for (a, sd, b, c, l, lst) in kruk.GROUPS:
        if a not in R: continue
        ax, ay, aw, ah = R[a]
        cells = [(cc, ll) for (cc, ll) in lst]
        coord = (c[1] + ay) if sd in "EW" else (c[0] + ax)
        st = dict(od=a, strona=sd, do=b, wyjscie=list(c), ladowanie=list(l), swiat=coord,
                  kratki_lokalne=[list(cc) for cc, _ in cells], kratki_swiata=[(cc[1] + ay) if sd in "EW" else (cc[0] + ax) for cc, _ in cells])
        nb = None
        for (a2, sa, b2, sb, lo, hi) in sas:
            if a2 == a and sa == sd and lo <= coord < hi: nb = b2
            if b2 == a and sb == sd and lo <= coord < hi: nb = a2
        if nb is None:
            X, Y = (ax + aw, coord) if sd == "E" else (ax - 1, coord) if sd == "W" else (coord, ay + ah) if sd == "S" else (coord, ay - 1)
            morze = not (0 <= X < WW and 0 <= Y < WH and sw.L[Y, X])
            st["wynik"] = "zamyka sie (%s)" % ("morze" if morze else "sciana"); st["kod"] = "zamyka"
        elif nb == b:
            if b in R:
                bx, by, bw, bh = R[b]
                lc = (l[1] + by) if sd in "EW" else (l[0] + bx)
                dl = abs(lc - coord)
                if dl <= 2: st["wynik"] = "zostaje (ta sama kratka)"; st["kod"] = "zostaje"
                else: st["wynik"] = "ten sam sasiad, ladowanie przesuniete o %d kratek" % dl; st["kod"] = "przesuniete"
            else: st["wynik"] = "zostaje"; st["kod"] = "zostaje"
        else:
            st["wynik"] = "ta sama krawedz, nowy cel: %d" % nb; st["kod"] = "nowy_cel"; st["nowy_cel"] = nb
            bx, by, bw, bh = R[nb]
            st["nowe_ladowanie_lokalne"] = [[(kc - bx) if sd in "NS" else (1 if sd == "E" else bw - 2), (kc - by) if sd in "EW" else (1 if sd == "S" else bh - 2)] for kc in st["kratki_swiata"]]
        out.append(st)
    return out


def zapisz_json(sw, sas, pas, nies, ed, stare, bk):
    rz = rzeka_przejscia(sw, sas)
    maps = {}
    for m, (x, y, w, h) in sw.rects.items():
        e = dict(id=m, nazwa=NAMES.get(m) or sw.new[m]["nazwa"], nowa=m not in sw.size, gracz=m in PLAYER, x0=x, y0=y, szer=w, wys=h, x0_maski=x - OFF[0], y0_maski=y - OFF[1])
        if m in sw.size:
            ow, oh = sw.size[m]
            n = nies[m]
            e.update(rozmiar_obecny=[ow, oh], rosnie=list(sw.grow.get(m, (0, 0))), morze_do_domalowania=dict(kratek=n["morze"], proc=n["morze_proc"]),
                     woda_poza_maska=dict(kratek=n["woda_w_lad"], proc=n["woda_proc"]), nowa_czesc_kratek=n["nowa_czesc"], nowa_czesc_morza=n["nowa_czesc_morza"],
                     tresc=dict(razem=n["tresc_razem"], w_pasie_surowej_sylwetki=n["tresc_w_pasie"], w_morzu_po_wybrzuszeniu=n["tresc_w_morzu"]))
        else:
            e.update(opis=sw.new[m]["opis"], rodzic=sw.new[m]["z"], czesc=sw.new[m]["czesc"], atlas=[sw.new[m]["ax"], sw.new[m]["ay"]])
        kr = {}
        for sd in "NESW":
            segs = []
            for sg in ed[m][sd]:
                z = dict(od=sg["od"], do=sg["do"], typ=sg["typ"])
                if sg["typ"] == "sasiad":
                    z["sasiad"] = sg["sasiad"]
                    z["przejscia"] = [dict(pos=p["pos"], droga=p["droga"]) for p in _na_krawedzi(pas, m, sd, sg["sasiad"], sg["od"], sg["do"])]
                    z["rzeka"] = [r["pos"] for r in _na_krawedzi(rz, m, sd, sg["sasiad"], sg["od"], sg["do"])]
                    if not z["przejscia"]: z["uwaga"] = "wspolna krawedz bez przejscia: sciana (klif / geste drzewa / gory)"
                segs.append(z)
            kr[sd] = segs
        e["krawedzie"] = kr
        maps[str(m)] = e
    cov = sw.occ() >= 0
    J = dict(opis="Swiat Kruczej Wyspy w kratkach (PROJEKT). Kratka swiata = kratka maski + przesuniecie. Mapa = prostokat [x0, y0, szer, wys] w kratkach swiata; sasiedzi dziela krawedz co do kratki. Morze i brzeg z jednej maski (swiat_maska.png).",
             skala_kratek_na_piksel_atlasu=S, przesuniecie_swiata=list(OFF), rozmiar_swiata=[WW, WH], maska="docs/mapy/swiat_maska.png (jedna kratka = jeden piksel, bialy = lad, w ukladzie swiata; to maska PO wybrzuszeniach wokol tresci)",
             mapy=maps, drogi={k: [list(map(float, p)) for p in chaikin([W(p) for p in v])] for k, v in ROADS.items()},
             suche_koryto=[[list(map(float, p)) for p in chaikin([W(p) for p in part])] for part in KORYTO], suche_koryto_wlot=list(W(WLOT)), suche_koryto_wylot=list(W(WYLOT)),
             opis_koryta="Suche koryto rzeki, bez wody: popękane błoto, otoczaki, suche trzciny przy skarpach. Rzeka znika pod wzgorzem zamkowym (wlot w Gorach) i wyplywa suchym jarem tuz za zachodnim murem miasta (pas w Podgrodziu), konczac sie w basenie Przystani. Droge przecina most.",
             drogi_cele={k: dict(mapa=v[0], zdarzenie=v[1], x=v[2] + OFF[0], y=v[3] + OFF[1]) for k, v in sw.cele.items()},
             przejscia=pas, suche_koryto_przejscia=rz, obecne_wyjscia=stare, brzeg_na_krawedziach=bk,
             pokrycie=dict(linia_brzegu_proc=round(float((sw.coast & cov).sum() / sw.coast.sum()) * 100, 2)),
             wybrzuszenia_wokol_tresci_kratek=sw.bulge)
    json.dump(J, open(os.path.join(DOCS, "swiat.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1, default=lambda o: o.item() if hasattr(o, "item") else str(o))
    Image.fromarray((sw.L * 255).astype("uint8")).save(os.path.join(DOCS, "swiat_maska.png"))
    return J


def wszystko(verbose=True):
    sw = uruchom(verbose)
    sas = sw.sasiedzi(); pas = sw.przejscia(sas)
    nies = policz_niezgodnosc(sw)
    ed = typ_krawedzi(sw, sas)
    stare = porownaj_stare(sw, sas)
    bk = brzeg_na_krawedziach(sw, sas)
    J = zapisz_json(sw, sas, pas, nies, ed, stare, bk)
    return sw, sas, pas, nies, ed, stare, bk, J


if __name__ == "__main__":
    sw, sas, pas, nies, ed, stare, bk, J = wszystko()
    print("niepolaczone:", sw.polaczone(pas))
    print("trasa 20 -> 8:", sw.trasa(pas, 20, 8))
    for m in OUTDOOR:
        n = nies[m]
        print(m, NAMES[m], "morze", n["morze"], "(%.1f%%)" % n["morze_proc"], "tresc", n["tresc_razem"], "w pasie", len(n["tresc_w_pasie"]), "w morzu", len(n["tresc_w_morzu"]))
    print("krawedzie z brzegiem:", len(bk), "skoki:", sum(b["skok_kratek"] for b in bk))
