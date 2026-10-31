# -*- coding: utf-8 -*-
# Świat w kratkach, wersja „z map” (2026-10-30, PROJEKT; nic nie zapisuje do data/ ani js/).
# Kształt wyspy wynika z samych map: ląd to obecne mapy z ich treścią i brzegiem (woda w kafelkach to morze świata), a nowe mapy brzegowe
# domykają to, czego brakuje. Maski kruka nie ma (poprzednią wersję zachowano w docs/mapy/kruk_wersja/ i tools/mapy/kruk_wersja/).
# Zasady: mapy dotykają się krawędziami co do kratki; na wspólnej krawędzi woda idzie w wodę, a ląd w ląd; krawędź bez sąsiada jest w całości morzem
# (zero „uciętych krawędzi”: lądu urwanego prosto na krawędzi mapy ani brzegu biegnącego wzdłuż krawędzi).
# Położenia: tools/mapy/swiat_uklad.json (wynik wyżarzania tools/mapy/uklad_szukaj.py i ręcznych poprawek).
#   python tools/mapy/swiat_kratki.py
import os, sys, json, math, collections, re
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import uklad_szukaj as U

DOCS = os.path.join(ROOT, "docs", "mapy")
DATA = os.path.join(ROOT, "data")
UKLAD = os.path.join(HERE, "swiat_uklad.json")
OFF = (40, 40)
PLAYER = {1, 3, 4, 8, 13, 23, 24, 25, 26, 111}
NAMES = {8: "Okolice Tawerny", 24: "Posiadłość Lorda", 111: "Podgrodzie", 125: "Przystań", 22: "Polna droga", 20: "Dom dziadka",
         21: "Leśna droga", 13: "Góry i kamieniołom", 120: "Osada Milczących", 175: "Orla Grań", 23: "Skraj lasu", 168: "Spalona zagroda",
         3: "Kruczy Jar", 4: "Łąka#1", 17: "Łąka#2", 18: "Łąka#3", 162: "Garnizon nad zatoką", 165: "Wrak na mieliźnie", 155: "Pustelnia na klifie",
         157: "Urwisko Kruków", 159: "Przylądek z latarnią"}
OUTDOOR = list(U.P.MAPY)
WM, SZ = U.WM, U.SZ      # (te same słowniki; uzupełnia je czytaj_uklad)


def font(sz, bold=True):
    for f in (("C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf") if bold else ("C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf")):
        if os.path.exists(f): return ImageFont.truetype(f, sz)
    return ImageFont.load_default()


def nazwa(m, sw=None):
    if m in NAMES: return NAMES[m]
    return (sw.nazwy.get(m) if sw else None) or "Nowa mapa %d" % m


WZROST = {159: (0, 6)}      # Przylądek z latarnią +6 rzędów w dół (te same kolumny; wyrównanie dolnej krawędzi z Urwiskiem Kruków)


def czytaj_uklad():
    d = json.load(open(UKLAD, encoding="utf-8"))
    for k, v in d.get("wypelniacze", {}).items():
        fid = int(k); t, w, h = v
        U.FILL[fid] = (t, w, h); U.SZ[fid] = (w, h); U.WM[fid] = U.band(t, w, h)
    for m, (dw, dh) in WZROST.items():
        if U.SZ[m][1] == 80:
            a = U.WM[m]; U.WM[m] = np.vstack([a] + [a[-1:, :]] * dh); U.SZ[m] = (a.shape[1], a.shape[0] + dh)
    U.IDS = list(U.P.MAPY) + sorted(int(k) for k in d.get("wypelniacze", {}))
    return {int(k): tuple(v) for k, v in d["pozycje"].items()}, d.get("nazwy", {}), d.get("opisy", {})


class Swiat:
    def __init__(self):
        pos, nazwy, opisy = czytaj_uklad()
        self.nazwy = {int(k): v for k, v in nazwy.items()}
        self.opisy = {int(k): v for k, v in opisy.items()}
        self.ids = [m for m in U.IDS if m in pos]
        mx = min(pos[m][0] for m in self.ids); my = min(pos[m][1] for m in self.ids)
        self.WWd = max(pos[m][0] + SZ[m][0] for m in self.ids) - mx + 2 * OFF[0] + 20
        self.HHd = max(pos[m][1] + SZ[m][1] for m in self.ids) - my + 2 * OFF[1] + 20
        self.rects = {m: [pos[m][0] - mx + OFF[0], pos[m][1] - my + OFF[1], SZ[m][0], SZ[m][1]] for m in self.ids}
        self.new = [m for m in self.ids if m in U.FILL]
        self.O = np.full((self.HHd, self.WWd), -1, np.int16)
        self.Wr = np.ones((self.HHd, self.WWd), bool)        # poza mapami: morze
        self.naklad = 0
        for m in self.ids:
            x, y, w, h = self.rects[m]
            sl = (slice(y, y + h), slice(x, x + w))
            self.naklad += int((self.O[sl] >= 0).sum())
            self.O[sl] = m; self.Wr[sl] = WM[m]
        self.L = (self.O >= 0) & ~self.Wr
        if not any(m in U.FILL for m in self.ids):
            self.kapy()
            self.L = (self.O >= 0) & ~self.Wr

    # ---- przylądki: nowe mapy brzegowe domykające krawędzie z lądem
    def kapy(self, D=15):
        """Każda krawędź mapy bez sąsiada, na której jest ląd, dostaje przylądek: ląd ciągnie się dalej łagodnym łukiem (głębokość 8-15 kratek, falująca),
        który przy końcach schodzi do zera, gdzie krawędź jest morzem. Przylądki pokrywają nowe mapy (>= 60 x 40, <= 120 x 100); ich raster (woda/ląd)
        zgadza się co do kratki z krawędziami sąsiadów (3 pierwsze kratki za krawędzią kopiują stan krawędzi)."""
        H, W = self.HHd, self.WWd
        E = np.zeros((H, W), bool); Wed = np.zeros((H, W), bool)
        forced_land = np.zeros((H, W), bool); forced_water = np.zeros((H, W), bool)
        for m in self.ids:
            for side in "NSWE":
                cells, own, ww, (ox, oy, dx, dy) = self.brzeg_kolumny(m, side)
                nx, ny = {"N": (0, -1), "S": (0, 1), "W": (-1, 0), "E": (1, 0)}[side]
                ex, ey = {"N": (0, 1), "S": (0, -1), "W": (1, 0), "E": (-1, 0)}[side]
                for i in range(len(cells)):
                    if own[i] >= 0: continue
                    X, Y = ox + dx * i, oy + dy * i                      # kratka tuż za krawędzią
                    bx, by = X + ex, Y + ey                              # kratka krawędzi mapy
                    for k in range(3):
                        tx, ty = X + nx * k, Y + ny * k
                        if 0 <= tx < W and 0 <= ty < H:
                            if not cells[i]: forced_water[ty, tx] = False; forced_land[ty, tx] = True
                            else: forced_water[ty, tx] = True
                    if not cells[i]: E[by, bx] = True
                    else: Wed[by, bx] = True
        free = self.O < 0

        def cham(src, maxit=26):
            INF = 9999
            Dm = np.where(src, 0, INF).astype(np.int32)
            for _ in range(maxit):
                prev = Dm
                n = Dm.copy()
                for dx_, dy_, w_ in ((1, 0, 3), (-1, 0, 3), (0, 1, 3), (0, -1, 3), (1, 1, 4), (1, -1, 4), (-1, 1, 4), (-1, -1, 4)):
                    sh = np.roll(np.roll(Dm, dy_, 0), dx_, 1) + w_
                    n = np.minimum(n, sh)
                Dm = n
                if (Dm == prev).all(): break
            return Dm / 3.0
        dE = cham(E); dW = cham(Wed)
        yy, xx = np.mgrid[0:H, 0:W]
        noise = 0.5 + 0.28 * np.sin(xx / 11.0 + 1.3) * np.cos(yy / 13.0) + 0.22 * np.sin((xx + yy) / 7.0 + 0.4) + 0.12 * np.sin(xx / 4.7 - yy / 5.3)
        f = np.clip((dW - 3.0) / 11.0, 0, 1); f = f * f * (3 - 2 * f)
        thr = D * (0.55 + 0.45 * np.clip(noise, 0, 1)) * f
        T = (dE < thr) & free
        T |= forced_land & free
        T &= ~(forced_water)
        # wygładzenie: łuki zamiast schodków
        Tg = np.array(Image.fromarray((T * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(2.0))) > 127
        Tg = (Tg | forced_land) & free & ~forced_water
        # pokrycie: nowe mapy wokół przylądków (z 3 kratkami morza zapasu)
        U_ = np.zeros((H, W), bool)
        ys, xs = np.where(Tg)
        for y0, x0 in zip(ys, xs): U_[max(0, y0 - 3):y0 + 4, max(0, x0 - 3):x0 + 4] = True
        U_ &= free
        cover = np.zeros((H, W), bool); rects = []
        occ = ~free
        while True:
            need = U_ & ~cover
            if not need.any(): break
            yy2, xx2 = np.where(need); cx, cy = int(xx2[0]), int(yy2[0])
            best = None
            for w in (60, 80, 100, 120):
                for h in (40, 60, 80, 100):
                    for sx in range(cx - w + 1, cx + 1, 10):
                        for sy in range(cy - h + 1, cy + 1, 10):
                            if sx < 1 or sy < 1 or sx + w >= W - 1 or sy + h >= H - 1: continue
                            if occ[sy:sy + h, sx:sx + w].any() or cover[sy:sy + h, sx:sx + w].any(): continue
                            g = int((need[sy:sy + h, sx:sx + w]).sum())
                            sc = g - 0.01 * w * h
                            if best is None or sc > best[0]: best = (sc, sx, sy, w, h)
            if best is None:
                cover[cy, cx] = True; self.nieobjete = getattr(self, "nieobjete", 0) + 1; continue
            _, sx, sy, w, h = best
            rects.append((sx, sy, w, h)); cover[sy:sy + h, sx:sx + w] = True
        base = max(U.FILL) + 1 if U.FILL else 901
        for k, (sx, sy, w, h) in enumerate(rects):
            fid = 901 + k
            sub = ~Tg[sy:sy + h, sx:sx + w]
            U.FILL[fid] = ("kapa", w, h); U.SZ[fid] = (w, h); U.WM[fid] = sub.copy()
            self.rects[fid] = [sx, sy, w, h]; self.ids.append(fid); self.new.append(fid)
            self.O[sy:sy + h, sx:sx + w] = fid; self.Wr[sy:sy + h, sx:sx + w] = sub
        self.kapy_ile = len(rects)

    # ---- krawędzie
    def brzeg_kolumny(self, m, side):
        x, y, w, h = self.rects[m]
        a = WM[m]
        if side == "N": return a[0, :], self.O[y - 1, x:x + w], self.Wr[y - 1, x:x + w], (x, y - 1, 1, 0)
        if side == "S": return a[h - 1, :], self.O[y + h, x:x + w], self.Wr[y + h, x:x + w], (x, y + h, 1, 0)
        if side == "W": return a[:, 0], self.O[y:y + h, x - 1], self.Wr[y:y + h, x - 1], (x - 1, y, 0, 1)
        return a[:, w - 1], self.O[y:y + h, x + w], self.Wr[y:y + h, x + w], (x + w, y, 0, 1)

    def ucięte(self):
        """krawędzie bez sąsiada, na których jest ląd (a nie morze): (mapa, strona, początek, koniec, liczba kratek)"""
        out = []
        for m in self.ids:
            for side in "NSWE":
                cells, own, ww, (ox, oy, dx, dy) = self.brzeg_kolumny(m, side)
                bad = (own < 0) & ~cells
                i = 0; n = len(bad)
                while i < n:
                    if bad[i]:
                        j = i
                        while j < n and bad[j]: j += 1
                        out.append(dict(mapa=m, strona=side, od=i, do=j, kratek=j - i, swiat_od=(ox + dx * i, oy + dy * i)))
                        i = j
                    else: i += 1
        return out

    def niezgodne(self):
        """wspólne krawędzie: kratki, gdzie woda po jednej stronie, a ląd po drugiej (do poprawienia na styku)"""
        out = []
        for m in self.ids:
            for side in "NSWE":
                cells, own, ww, (ox, oy, dx, dy) = self.brzeg_kolumny(m, side)
                bad = (own >= 0) & (ww != cells)
                for i in np.where(bad)[0]:
                    out.append(dict(mapa=m, strona=side, poz=int(i), sasiad=int(own[i]), swiat=(ox + dx * int(i), oy + dy * int(i)), woda_a=bool(cells[i])))
        return out

    def sasiedzi(self):
        out = []
        for a in self.ids:
            ax, ay, aw, ah = self.rects[a]
            for b in self.ids:
                if a == b: continue
                bx, by, bw, bh = self.rects[b]
                if ax + aw == bx:
                    lo, hi = max(ay, by), min(ay + ah, by + bh)
                    if hi > lo: out.append((a, "E", b, "W", lo, hi))
                if ay + ah == by:
                    lo, hi = max(ax, bx), min(ax + aw, bx + bw)
                    if hi > lo: out.append((a, "S", b, "N", lo, hi))
        return out

    def kat_pola(self, x, y):
        gy, gx = self.gy, self.gx
        g1, g2 = gx[int(y), int(x)], gy[int(y), int(x)]
        if abs(g1) + abs(g2) < 1e-4: return None
        return round(math.degrees(math.atan2(-g1, -g2)) % 180, 1)

    def brzeg_na_krawedziach(self, sas):
        """kratki świata, w których linia brzegu przecina wspólną krawędź (zmiana woda/ląd wzdłuż krawędzi), kierunek z pola ziemi; skok = różnica
        położenia przecięcia między ostatnią kolumną jednej mapy a pierwszą drugiej"""
        soft = np.array(Image.fromarray((self.L * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(1.6))).astype(float) / 255.0
        self.gy, self.gx = np.gradient(soft)
        out = []
        for (a, sa, b, sb, lo, hi) in sas:
            ax, ay, aw, ah = self.rects[a]; bx, by, bw, bh = self.rects[b]
            if sa == "E": ca = self.L[lo:hi, ax + aw - 1]; cb = self.L[lo:hi, bx]
            else: ca = self.L[ay + ah - 1, lo:hi]; cb = self.L[by, lo:hi]
            pa = [lo + i for i in range(1, len(ca)) if ca[i] != ca[i - 1]]
            pb = [lo + i for i in range(1, len(cb)) if cb[i] != cb[i - 1]]
            if not pa and not pb: continue
            skok = 0
            for p in pa:
                q = min(pb, key=lambda v: abs(v - p)) if pb else None
                if q is not None and abs(q - p) <= 3: skok = max(skok, abs(q - p))
            cross = []
            for p in pa:
                if sa == "E": kat = self.kat_pola(ax + aw, p)
                else: kat = self.kat_pola(p, ay + ah)
                cross.append(dict(pos=int(p), przejscie=("lad->morze" if ca[p - lo - 1] else "morze->lad"), kat=kat))
            out.append(dict(a=a, b=b, strona=sa, od=int(lo), do=int(hi), skok_kratek=int(skok), przeciecia=cross))
        return out

    def polaczone(self, sas):
        g = collections.defaultdict(set)
        for (a, sa, b, sb, lo, hi) in sas: g[a].add(b); g[b].add(a)
        seen = {8}; st = [8]
        while st:
            k = st.pop()
            for n in g[k]:
                if n not in seen: seen.add(n); st.append(n)
        return [m for m in self.ids if m not in seen]


def porownaj_stare(sw, sas):
    """każde obecne wyjście (kruk.GROUPS): czy mapy nadal sąsiadują w tej kratce świata"""
    import kruk
    R = sw.rects
    out = []
    for (a, sd, b, c, l, lst) in kruk.GROUPS:
        if a not in R: continue
        ax, ay, aw, ah = R[a]
        coord = (c[1] + ay) if sd in "EW" else (c[0] + ax)
        st = dict(od=a, strona=sd, do=b, wyjscie=list(c), ladowanie=list(l), swiat=coord, kratki_lokalne=[list(cc) for cc, _ in lst],
                  kratki_swiata=[(cc[1] + ay) if sd in "EW" else (cc[0] + ax) for cc, _ in lst])
        nb = None
        for (a2, sa, b2, sb, lo, hi) in sas:
            if a2 == a and sa == sd and lo <= coord < hi: nb = b2
            if b2 == a and sb == sd and lo <= coord < hi: nb = a2
        if nb is None:
            st["wynik"] = "zamyka sie"; st["kod"] = "zamyka"
        elif nb == b and b in R:
            bx, by, bw, bh = R[b]
            lc = (l[1] + by) if sd in "EW" else (l[0] + bx)
            dl = abs(lc - coord)
            if dl <= 2: st["wynik"] = "zostaje (ta sama kratka)"; st["kod"] = "zostaje"
            else: st["wynik"] = "ten sam sasiad, ladowanie przesuniete o %d kratek" % dl; st["kod"] = "przesuniete"
        else:
            st["wynik"] = "ta sama krawedz, nowy cel: %d" % (nb if nb is not None else -1); st["kod"] = "nowy_cel"; st["nowy_cel"] = nb
        out.append(st)
    return out


def wszystko():
    sw = Swiat()
    sas = sw.sasiedzi()
    return sw, sas


if __name__ == "__main__":
    sw, sas = wszystko()
    ct = sw.ucięte(); nz = sw.niezgodne()
    print("mapy: %d (nowe %d), nakladanie %d kratek, ucięte krawędzie: %d odcinków (%d kratek), niezgodne kratki na stykach: %d, niepolaczone: %s" % (
        len(sw.ids), len(sw.new), sw.naklad, len(ct), sum(c["kratek"] for c in ct), len(nz), sw.polaczone(sas)))
    for c in ct[:30]: print("  ucięte", c["mapa"], c["strona"], c["od"], c["do"], c["kratek"])
