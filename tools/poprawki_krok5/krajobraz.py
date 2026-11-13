# -*- coding: utf-8 -*-
"""Krok 5 planu poprawek map: KRAJOBRAZ na pustych laka (pilot: Map004 'Laka pod Gawra'). Biblioteka wielokrotnego uzytku -
plan konkretnej mapy to osobny plik (plan_004.py).  Zapis TYLKO do tools/poprawki_krok5/staging/data (nic w data/).

  K = Krajobraz(4)                       # mapa z data/MapNNN.json (musi byc w ukladzie edytora)
  K.droga(punkty, szer)                  # sciezka (A2 rodzaj 17, warstwa 0) po gladkiej krzywej, miekkie brzegi
  K.plama(maska, rodzaj, warstwa)        # plama gruntu o organicznym obrysie (maska z K.blob / K.droga_maska)
  K.plot(x0, y0, x1, y1, bramy=[...])    # zamkniety plot (A2 rodzaj 22, warstwa 1) z bramami (przerwy)
  K.zdarzenie_z(typ, x, y)               # nowe zdarzenie ze wzoru istniejacego (tylko typy Map003/Map004)
  K.przenies(id, x, y) / K.usun(id)
  K.kafel(x, y, id, z=2)                 # ozdobne kafle D (kwiaty, paprocie, kamyki) - przechodnie, bez zdarzen
  K.zapisz()                             # autokafle przeliczone, test okrazenia pliku, zapis do staging

Wszystko deterministyczne (ziarno), nic na siatce: obrysy z szumu wartosciowego, rozmieszczenie z odstepem Poissona."""
import os, sys, json, copy, math, random
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
for p in ("tools/rozszerzenia", "tools/mapy", "tools/newstart", "tools/poprawki_krok2"):
    sys.path.insert(0, os.path.join(ROOT, p))
import wspolne as W
import mapylib as L
import zaokraglij as Z
STG = os.path.join(HERE, "staging", "data")
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

# typy zdarzen (Map003 / Map004): klucz -> nazwa grafiki (do wzoru z istniejacych zdarzen mapy)
TYP_GRAFIKA = {
    "sosnaA": "!$Pine_A", "sosnaB": "!$Pine_B", "sosnaC": "!$Pine_C", "male": "!$Tree_Small", "jablon": "!$Tree_Apple", "grusza": "!$Tree_Pear",
    "martwe": "!$Trunk_Dead", "pieniekW": "!$Stump_Tall",
}
KRZAKI = ["!$Bush_Bare_A", "!$Bush_Bare_B", "!$Bush_Bare_Big", "!$Bush_Bare_Hedge", "!$Bush_Bare_Tall", "!$Bush_Bare_Thicket", "!$Bush_Bare_Vines", "!$Bush_Bare_Wide"]
RZECZY_DRZEWNE = {"sosnaA", "sosnaB", "sosnaC", "male", "jablon", "grusza", "martwe"}


def klasa(e):
    """typ zdarzenia (klucz) albo None"""
    im = e["pages"][0]["image"]; nm = im["characterName"]
    for k, v in TYP_GRAFIKA.items():
        if nm == v: return k
    if nm in KRZAKI: return "krzak"
    if "Ore" in nm: return "ruda"
    if nm.startswith("!$Rock") or nm == "!$Boulder_A": return "skala"
    if nm == "" and im["tileId"] == 516: return "pieniek"
    if nm == "" and im["tileId"] == 678: return "kloda"
    return None


class Krajobraz:
    def __init__(self, mid, plik=None):
        self.mid = mid
        path = plik or os.path.join(ROOT, "data", "Map%03d.json" % mid)
        raw = open(path, "rb").read()
        self.m = json.loads(raw.decode("utf-8"))
        if W.map_text(self.m).encode("utf-8") != raw: raise SystemExit("Map%03d nie jest w ukladzie edytora" % mid)
        self.orig = json.loads(raw.decode("utf-8"))
        self.W, self.H, self.d = self.m["width"], self.m["height"], self.m["data"]
        self.n = self.W * self.H
        self.ev = self.m["events"]
        self.c0, self.c1 = set(), set()
        self.rng = random.Random(404)
        self.wzory = {}
        for e in self.orig["events"]:           # (wzory: pierwsze zdarzenie danego rodzaju grafiki)
            if not e: continue
            im = e["pages"][0]["image"]
            key = (im["characterName"], im["tileId"], e["name"])
            self.wzory.setdefault(key, e)
        self.log = []

    # ---------------------------------------------------------------- kafle
    def g(self, z, x, y): return self.d[z * self.n + y * self.W + x]
    def s(self, z, x, y, v): self.d[z * self.n + y * self.W + x] = v
    def in_(self, x, y): return 0 <= x < self.W and 0 <= y < self.H
    def kind(self, z, x, y):
        t = self.g(z, x, y)
        return (t - 2048) // 48 if t >= 2048 else None
    def ground(self, x, y, k):
        self.s(0, x, y, 2048 + k * 48); self.c0.add((x, y))
    def over(self, x, y, k):
        self.s(1, x, y, 0 if not k else 2048 + k * 48); self.c1.add((x, y))
    def kafel(self, x, y, tid, z=2):
        self.s(z, x, y, tid)
    def noise(self, x, y, seed, scale):
        return float(Z.vnoise(np.array(x, float), np.array(y, float), seed, scale))
    def fbm(self, x, y, seed, scale):
        return 0.65 * self.noise(x, y, seed, scale) + 0.35 * self.noise(x, y, seed + 7, scale / 2.3)

    # ---------------------------------------------------------------- maski (zbiory kratek)
    def blob(self, cx, cy, rx, ry, seed, rough=0.42, scale=2.7, kat=None):
        """plama o organicznym obrysie (elipsa z szumem)"""
        out = set()
        if kat is None: kat = (seed * 2.399) % math.pi
        ca, sa = math.cos(kat), math.sin(kat)
        R = int(max(rx, ry) * (1 + rough) + 2)
        for y in range(int(cy) - R, int(cy) + R + 1):
            for x in range(int(cx) - R, int(cx) + R + 1):
                dx, dy = x - cx, y - cy
                u, v = (dx * ca + dy * sa) / rx, (-dx * sa + dy * ca) / ry
                lim = 1 + rough * (self.fbm(x, y, seed, scale) - 0.5) * 2
                if u * u + v * v < lim * lim * 1.0 and self.in_(x, y): out.add((x, y))
        return self.lam(self.okraglij(self.gladko(out), 0.8))

    def krzywa(self, pts, krok=0.5):
        """gladka krzywa (Catmull-Rom) przez punkty -> lista (x, y) float"""
        P = [pts[0]] + list(pts) + [pts[-1]]
        out = []
        for i in range(1, len(P) - 2):
            p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
            L_ = max(1, int(math.dist(p1, p2) / krok))
            for k in range(L_):
                t = k / L_
                out.append(tuple(0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t * t
                                       + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t ** 3) for j in (0, 1)))
        out.append(tuple(pts[-1]))
        return out

    def droga_maska(self, pts, szer, seed=1, szum=0.35, zwez_koniec=0.0, lamac=True):
        """maska sciezki o srednicy szer wzdluz gladkiej krzywej; zwez_koniec: na koncu zwezenie (0..1 dlugosci), by sciezka rozmywala sie w trawie"""
        c = self.krzywa(pts)
        N = len(c); out = set()
        for i, (px, py) in enumerate(c):
            w = szer / 2.0 + (self.fbm(px, py, seed, 4.0) - 0.5) * 2 * szum * szer / 2.0
            if zwez_koniec and i > N * (1 - zwez_koniec):
                w *= max(0.25, 1 - (i - N * (1 - zwez_koniec)) / (N * zwez_koniec) * 0.8)
            r = int(math.ceil(w))
            for y in range(int(py) - r, int(py) + r + 2):
                for x in range(int(px) - r, int(px) + r + 2):
                    if (x + 0.5 - px) ** 2 + (y + 0.5 - py) ** 2 <= w * w and self.in_(x, y): out.add((x, y))
        return self.okraglij(out, 0.9)

    def gladko(self, S, przebiegi=1):
        """usuwa wyrostki i dziury o jednej kratce: kratka zostaje, gdy >= 5 z 9 kratek jej otoczenia (z nia sama) nalezy do plamy"""
        S = set(S)
        for _ in range(przebiegi):
            cand = {(x + a, y + b) for (x, y) in S for a in (-1, 0, 1) for b in (-1, 0, 1)}
            S = {(x, y) for (x, y) in cand if sum((x + a, y + b) in S for a in (-1, 0, 1) for b in (-1, 0, 1)) >= 5}
        return S

    def okraglij(self, S, sigma=1.1, prog=0.5, margines=4):
        """zaokragla maske (zbior kratek): rozmycie gaussa wskaznika i prog - brak katow prostych, zakretow o 90 stopni i prostych odcinkow"""
        import cv2
        if not S: return set()
        xs = [c[0] for c in S]; ys = [c[1] for c in S]
        x0, y0 = min(xs) - margines, min(ys) - margines
        w, h = max(xs) - x0 + margines + 1, max(ys) - y0 + margines + 1
        a = np.zeros((h, w), np.float32)
        for (x, y) in S: a[y - y0, x - x0] = 1.0
        k = int(sigma * 6) | 1
        b = cv2.GaussianBlur(a, (k, k), sigma, borderType=cv2.BORDER_CONSTANT)
        out = {(x0 + i, y0 + j) for j in range(h) for i in range(w) if b[j, i] >= prog}
        return {c for c in out if self.in_(*c)}

    def lam(self, S, maks=4, szer_min=2):
        """lamie proste odcinki obrysu dluzsze niz maks: druga polowa odcinka cofnieta o kratke (zamiast prostej linii - skos / ząbek)"""
        S = set(S)
        for _ in range(8):
            zmiana = False
            for (dx, dy) in ((0, -1), (0, 1), (-1, 0), (1, 0)):
                brz = {(x, y) for (x, y) in S if (x + dx, y + dy) not in S}
                # biegi wzdluz osi prostopadlej do (dx, dy)
                wzdl = (1, 0) if dy else (0, 1)
                for c in sorted(brz):
                    if (c[0] - wzdl[0], c[1] - wzdl[1]) in brz: continue
                    bieg = [c]
                    while (bieg[-1][0] + wzdl[0], bieg[-1][1] + wzdl[1]) in brz: bieg.append((bieg[-1][0] + wzdl[0], bieg[-1][1] + wzdl[1]))
                    if len(bieg) > maks:
                        k = len(bieg) // 2 + (1 if (bieg[0][0] * 7 + bieg[0][1] * 3) % 2 else 0)
                        for cc in bieg[k:]:
                            # nie zdejmuj, gdy zostalby cienki grzbiet
                            if (cc[0] - dx, cc[1] - dy) in S and (cc[0] - 2 * dx, cc[1] - 2 * dy) in S: S.discard(cc); zmiana = True
            if not zmiana: break
        return self.gladko(S, 1)

    # ---------------------------------------------------------------- grunt
    def droga(self, pts, szer, seed=1, szum=0.35, zwez_koniec=0.0, rodzaj=17, wyczysc1=True):
        M = self.droga_maska(pts, szer, seed, szum, zwez_koniec)
        for (x, y) in M:
            self.ground(x, y, rodzaj)
            if wyczysc1 and self.g(1, x, y): self.over(x, y, 0)
        return M

    def plama(self, M, rodzaj, warstwa=0, tylko_na=None):
        for (x, y) in M:
            if tylko_na is not None:
                k = self.kind(0, x, y)
                if k not in tylko_na: continue
            if warstwa == 0: self.ground(x, y, rodzaj)
            else: self.over(x, y, rodzaj)

    def plot(self, x0, y0, x1, y1, bramy=(), rodzaj=22):
        """zamkniety obrys plotu na warstwie 1 (A2 22), przerwy w kratkach bramy: [(x, y), ...]"""
        cells = []
        for x in range(x0, x1 + 1): cells += [(x, y0), (x, y1)]
        for y in range(y0 + 1, y1): cells += [(x0, y), (x1, y)]
        for (x, y) in cells:
            if (x, y) in set(bramy): self.over(x, y, 0); continue
            self.ground(x, y, 16)
            self.over(x, y, rodzaj)
        return cells

    # ---------------------------------------------------------------- zdarzenia
    def eventy(self):
        return [e for e in self.ev if e]
    def liczba(self): return len(self.eventy())
    def w_polu(self, x0, y0, x1, y1, typy=None):
        return [e for e in self.eventy() if x0 <= e["x"] <= x1 and y0 <= e["y"] <= y1 and (typy is None or klasa(e) in typy)]
    def znajdz(self, eid): return self.ev[eid]
    def przenies(self, eid, x, y):
        e = self.ev[eid]; self.log.append("przenies %d %s (%d,%d)->(%d,%d)" % (eid, e["name"], e["x"], e["y"], x, y)); e["x"], e["y"] = x, y
    def usun(self, eid):
        e = self.ev[eid]; self.log.append("usun %d %s (%d,%d)" % (eid, e["name"], e["x"], e["y"])); self.ev[eid] = None
    def wzor(self, grafika=None, tile=0, nazwa=None):
        for (g, t, n), e in self.wzory.items():
            if g == (grafika or "") and t == tile and (nazwa is None or n == nazwa): return e
        raise KeyError((grafika, tile, nazwa))
    def zdarzenie_z(self, wzor_event, x, y):
        e = copy.deepcopy(wzor_event)
        slot = next((i for i, v in enumerate(self.ev) if v is None and i > 0), None)
        if slot is None: slot = len(self.ev); self.ev.append(None)
        e["id"] = slot; e["x"], e["y"] = x, y
        self.ev[slot] = e
        self.log.append("nowe %d %s (%d,%d)" % (slot, e["name"], x, y))
        return e

    # ---------------------------------------------------------------- zapis
    def zapisz(self, nazwa=None):
        W.reshape(self.m, 0, W.ring(self.c0, 1))
        W.reshape(self.m, 1, W.ring(self.c1 | self.c0, 1))
        for i, e in enumerate(self.ev):
            assert e is None or e["id"] == i, (i, e and e["id"])
        out = W.map_text(self.m).encode("utf-8")
        assert json.loads(out.decode("utf-8")) == self.m
        os.makedirs(STG, exist_ok=True)
        p = os.path.join(STG, nazwa or "Map%03d.json" % self.mid)
        with open(p, "wb") as f: f.write(out)
        assert b"\r" not in out
        return p


# ---------------------------------------------------------------- rozstawianie (wspolne dla planow)
def stopa(e):
    """kratki zajete przez zdarzenie (SOLID_GRAPHICS / <Occupy>) - jak w grze"""
    return L.Zdarzenie(e, None).komorki()


def _mixin():
    def zajete(self, pomin=()):
        occ = {}
        for e in self.eventy():
            if e["id"] in pomin: continue
            for c in stopa(e): occ[c] = e["id"]
        return occ
    def wolne_pod_drzewo(self, x, y, occ, odstep=1):
        """kratka dla zdarzenia: trawa/ziemia (nie woda, mur, plot), bez zdarzen w odstepie"""
        if not self.in_(x, y) or x < 3 or y < 3 or x > self.W - 4 or y > self.H - 4: return False
        k = self.kind(0, x, y)
        if k not in (16, 17, 27, 24): return False
        if self.kind(1, x, y) in (22, 30, 38): return False
        for a in range(-odstep, odstep + 1):
            for b in range(-odstep, odstep + 1):
                if (x + a, y + b) in occ: return False
        return True
    def rozstaw(self, ids_lub_wzory, centrum, promien, seed, occ=None, min_d=2.3, zakazane=(), kol_dy=3, ksztalt=None, probuj=400):
        """rozmieszcza (przenosi istniejace / tworzy nowe) zdarzenia w okregu/elipsie wokol centrum, odstep Poissona; zwraca liste zdarzen.
        ids_lub_wzory: id istniejacego zdarzenia (przenies) albo zdarzenie-wzor (nowe)."""
        rng = random.Random(seed)
        occ = occ if occ is not None else self.zajete()
        res = []
        placed = []
        cx, cy = centrum
        rx, ry = promien if isinstance(promien, (tuple, list)) else (promien, promien)
        for it in ids_lub_wzory:
            ok = False
            for _ in range(probuj):
                a = rng.random() * 2 * math.pi; r = math.sqrt(rng.random())
                x = int(round(cx + math.cos(a) * rx * r)); y = int(round(cy + math.sin(a) * ry * r))
                if ksztalt and not ksztalt(x, y): continue
                if (x, y) in zakazane or not self.wolne_pod_drzewo(x, y, occ, 0): continue
                if any(math.hypot(x - px, y - py) < min_d or (x == px and 0 < abs(y - py) <= kol_dy) for (px, py) in placed): continue
                ok = True; break
            if not ok:
                self.log.append("BRAK MIEJSCA dla %s wokol %s" % (it if isinstance(it, int) else it["name"], centrum)); continue
            if isinstance(it, int):
                e = self.ev[it]
                for c in stopa(e): occ.pop(c, None)
                self.przenies(it, x, y)
            else:
                e = self.zdarzenie_z(it, x, y)
            for c in stopa(e): occ[c] = e["id"]
            placed.append((x, y)); res.append(e)
        return res
    for f in (zajete, wolne_pod_drzewo, rozstaw): setattr(Krajobraz, f.__name__, f)
_mixin()


# ---------------------------------------------------------------- gestosc, kepy, dekor z kafli D
KWIATY = {"czerwone": [696, 704], "niebieskie": [705, 706, 707], "pomaranczowe": [710, 711], "biale": [716, 724], "zolte": [734, 735], "zielonobiale": [708, 709]}
PAPROCIE = [725, 725, 725, 732, 733]      # (732/740 i 733/741 to dwukafelkowe paprocie: dol 740/741 kladziemy sami pod 732/733)
KAMYKI = [677, 683]


def _mixin2():
    def gestosc(self, cx, cy, rx, ry, seed, rough=0.32, scale=4.5, polana=None, spadek=1.0):
        """pole gestosci 0..1 (maleje ku brzegowi, nieregularny obrys); polana=(px, py, prx, pry) - w srodku pusto"""
        def f(x, y):
            dx, dy = (x - cx) / rx, (y - cy) / ry
            r = math.hypot(dx, dy) * (1 + rough * (self.fbm(x, y, seed, scale) - 0.5) * 2)
            v = max(0.0, 1 - r) ** spadek
            if polana:
                px, py, prx, pry = polana
                q = math.hypot((x - px) / prx, (y - py) / pry) * (1 + 0.25 * (self.fbm(x, y, seed + 5, 2.5) - 0.5) * 2)
                if q < 1: return 0.0
                v *= min(1.0, (q - 1) * 1.6 + 0.25)
            return v
        return f
    def sadz(self, items, f, seed, min_d=2.2, occ=None, zakazane=(), kol_dy=3, bbox=None, probuj=3000, prog=0.0):
        """rozstawia zdarzenia (id istniejacego albo wzor) wg gestosci f: dart-throwing z odstepem; zwraca zdarzenia"""
        rng = random.Random(seed); occ = occ if occ is not None else self.zajete()
        x0, y0, x1, y1 = bbox
        placed = [(e["x"], e["y"]) for e in self.eventy() if klasa(e) in RZECZY_DRZEWNE and x0 - 3 <= e["x"] <= x1 + 3 and y0 - 3 <= e["y"] <= y1 + 3
                  and e["id"] not in [i for i in items if isinstance(i, int)]]
        res = []
        for it in items:
            ok = False
            for _ in range(probuj):
                x, y = rng.randint(x0, x1), rng.randint(y0, y1)
                if rng.random() > f(x, y) or f(x, y) <= prog: continue
                if (x, y) in zakazane or not self.wolne_pod_drzewo(x, y, occ, 0): continue
                if any(math.hypot(x - px, y - py) < min_d or (x == px and 0 < abs(y - py) <= kol_dy) for (px, py) in placed): continue
                ok = True; break
            if not ok:
                self.log.append("BRAK MIEJSCA dla %s" % (it if isinstance(it, int) else it["name"])); continue
            if isinstance(it, int):
                e = self.ev[it]
                for c in stopa(e): occ.pop(c, None)
                self.przenies(it, x, y)
            else: e = self.zdarzenie_z(it, x, y)
            for c in stopa(e): occ[c] = e["id"]
            placed.append((x, y)); res.append(e)
        return res
    def grunt_wg(self, f, prog, seed, rodzaj=46, warstwa=1, bbox=None, zdejmij=True):
        """ciemniejszy grunt (A2 46 na warstwie 1 = grunt lasu) tam, gdzie gestosc > prog (szum + wygladzenie)"""
        x0, y0, x1, y1 = bbox; M = set()
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if f(x, y) + (self.fbm(x, y, seed, 3.0) - 0.5) * 0.28 > prog: M.add((x, y))
        M = self.lam(self.okraglij(self.gladko(M), 1.4))
        for (x, y) in M:
            if self.kind(0, x, y) in (16, 27) and self.kind(1, x, y) not in (22, 39, 28): self.over(x, y, rodzaj)
        return M
    def wolna_deko(self, x, y, occ, zajete_kafle):
        if not self.in_(x, y) or x < 3 or y < 3 or x > self.W - 4 or y > self.H - 4: return False
        if self.kind(0, x, y) not in (16, 27): return False
        if self.kind(1, x, y) in (22, 30, 38, 39, 17, 28): return False
        if self.g(2, x, y) or self.g(3, x, y) or (x, y) in occ or (x, y) in zajete_kafle: return False
        return True
    def dekor(self, f, rodziny, n, seed, bbox, occ=None, zakazane=(), ile=(3, 4), promien=1.7, odstep=3.0):
        """grupy kafli D (kwiaty po 3-4 jednego koloru, paprocie, kamyki) wg gestosci f; kafle przechodnie, warstwa 2; zwraca liczbe kafli"""
        rng = random.Random(seed); occ = occ if occ is not None else self.zajete()
        if not hasattr(self, "_deko"): self._deko = set()
        centra = []; total = 0; x0, y0, x1, y1 = bbox
        for _ in range(n):
            for _ in range(600):
                cx, cy = rng.randint(x0, x1), rng.randint(y0, y1)
                if rng.random() > f(cx, cy) or (cx, cy) in zakazane: continue
                if any(math.hypot(cx - a, cy - b) < odstep for (a, b) in centra): continue
                if not self.wolna_deko(cx, cy, occ, self._deko): continue
                break
            else: continue
            centra.append((cx, cy))
            tiles = rodziny(rng) if callable(rodziny) else rng.choice(rodziny)
            k = rng.randint(*ile); cnt = 0
            for _ in range(40):
                if cnt >= k: break
                a = rng.random() * 2 * math.pi; r = math.sqrt(rng.random()) * promien
                x, y = int(round(cx + math.cos(a) * r)), int(round(cy + math.sin(a) * r))
                if (x, y) in zakazane or not self.wolna_deko(x, y, occ, self._deko): continue
                if all(t in PAPROCIE or t in KAMYKI for t in tiles) and any((x + a_, y + b_) in self._deko for a_ in (-1, 0, 1) for b_ in (-1, 0, 1)): continue
                t_ = rng.choice(tiles)
                if t_ in (732, 733):
                    if (x, y + 1) in zakazane or not self.wolna_deko(x, y + 1, occ, self._deko) or any((x + a_, y + 1 + b_) in self._deko for a_ in (-1, 0, 1) for b_ in (0, 1)): continue
                    self.kafel(x, y + 1, t_ + 8, 2); self._deko.add((x, y + 1))
                self.kafel(x, y, t_, 2); self._deko.add((x, y)); cnt += 1; total += 1
        return total
    def zejdz_z(self, maska, zakres=2):
        """zdarzenia stojace na kratkach maski (droga, plot) przesuniete na najblizsza wolna kratke poza maska"""
        occ = self.zajete()
        szer = {(x + a, y + b) for (x, y) in maska for a in (-1, 0, 1) for b in (-1, 0, 1)}
        for e in list(self.eventy()):
            if not any(c in (szer if klasa(e) in RZECZY_DRZEWNE else maska) for c in stopa(e)): continue
            for c in stopa(e): occ.pop(c, None)
            best = None
            for r in range(1, 7):
                for dy in range(-r, r + 1):
                    for dx in range(-r, r + 1):
                        if max(abs(dx), abs(dy)) != r: continue
                        x, y = e["x"] + dx, e["y"] + dy
                        ee = dict(e); ee["x"], ee["y"] = x, y
                        cells = stopa(ee)
                        if any(c in maska or c in occ or not self.in_(*c) or self.kind(0, *c) not in (16, 27) or self.kind(1, *c) in (22, 39) for c in cells): continue
                        if any((x + a, y + b) in maska for a in (-1, 0, 1) for b in (-1, 0, 1)): continue
                        best = (x, y); break
                    if best: break
                if best: break
            if best: self.przenies(e["id"], *best)
            else: self.log.append("nie zszedl z drogi: %d %s" % (e["id"], e["name"]))
            for c in stopa(self.ev[e["id"]]): occ[c] = e["id"]
    for f_ in (gestosc, sadz, grunt_wg, wolna_deko, dekor, zejdz_z): setattr(Krajobraz, f_.__name__, f_)
_mixin2()
