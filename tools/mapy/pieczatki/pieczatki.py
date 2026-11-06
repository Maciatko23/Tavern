# -*- coding: utf-8 -*-
"""PIECZĄTKI MAP (tools/mapy/pieczatki): gotowe, zakończone kawałki terenu wycięte z map wzorcowych gracza
(Map013, Map159, Map008, Map003) i narzędzie do wstawiania ich w nową mapę.

Pieczątka = JSON w tools/mapy/pieczatki/dane/<nazwa>.json + podgląd PNG w dane/<nazwa>.png:
  w, h, tsid (zestaw kafli), tlo (rodzaj gruntu, w który pieczątka ma być wstawiona), zrodlo (mapa i okno wycięcia),
  warstwy[0..3] (kafle, w*h), cienie, regiony, maska (1 = kratka należy do pieczątki), zdarzenia [{dx, dy, ev}],
  opis. Pieczątka jest KOMPLETNA: maska nie dotyka brzegu okna, a ostatni pierścień kratek to czyste tło.

Plotno (płótno mapy) składa pieczątki: wstaw() kładzie kratki maski (wszystkie warstwy), zdarzenia (z zajętością kratek jak
w grze: ChoppableTree SOLID_GRAPHICS + <Occupy:...>) i PRZELICZA kształty autokafli (A1/A2/A4-góry: 47 kształtów, A3/A4-ściany:
16 kształtów) w pierścieniu +1 wokół maski, więc styk z otoczeniem jest zawsze zamknięty. Poza mapą liczy się jak „to samo”.
Zapis map: format edytora (tools/mapy/popraw.py tekst_mapy), bajty z LF."""
import os, sys, json, copy, re, math, random
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, os.path.join(HERE, ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "newstart"))
import nslib as N            # floor_shape, wall_shape, is_wall_kind, EXTRA (zajętość obrazków)
import mapylib as L
import popraw

DANE = os.path.join(HERE, "dane")
T = 48


# ------------------------------------------------------------------------------------------------ kafle
def rodzaj(t):
    """rodzaj autokafla (A1-A4) albo None"""
    return (t - 2048) // 48 if t >= 2048 else None


def kind_floor(k):
    """czy rodzaj autokafla ma 47 kształtów (podłoga) - A1: wszystkie, A2, dachy A3, góry A4"""
    if k is None: return False
    if k < 16: return k < 4 or k % 2 == 0
    if k < 48: return True
    if k < 80: return not N.is_wall_kind(k)
    return ((k - 80) // 8) % 2 == 0


def kształt(plan, x, y, t):
    """kształt autokafla t w kratce (x, y) warstwy plan (H, W) - wg kształtów edytora; poza mapą = to samo"""
    k = rodzaj(t)
    H, W = plan.shape

    def same(dx, dy):
        nx, ny = x + dx, y + dy
        if nx < 0 or ny < 0 or nx >= W or ny >= H: return True
        return rodzaj(int(plan[ny, nx])) == k and plan[ny, nx] >= 2048
    if N.is_wall_kind(k) and k >= 48: return N.wall_shape(same)
    return N.floor_shape(same)


def przelicz_warstwe(plan, kratki):
    for (x, y) in kratki:
        if not (0 <= x < plan.shape[1] and 0 <= y < plan.shape[0]): continue
        t = int(plan[y, x])
        if t < 2048 or t >= 2048 + 48 * 128: continue
        k = rodzaj(t)
        if k < 16 and not kind_floor(k): continue          # wodospady A1 zostają
        plan[y, x] = 2048 + k * 48 + kształt(plan, x, y, t)


def pierscien(kratki, r=1):
    out = set()
    for (x, y) in kratki:
        for dy in range(-r, r + 1):
            for dx in range(-r, r + 1): out.add((x + dx, y + dy))
    return out


# ------------------------------------------------------------------------------------------------ zdarzenia
DOZWOLONE = re.compile(r"^!\$(Pine|Tree|Bush|Rock|Boulder|Trunk|Stump|Big_Trees|Logs)")


def _occ(note):
    m = re.search(r"<Occupy:([^>]*)>", note or "")
    o = {"left": 0, "right": 0, "up": 0, "down": 0}
    if m:
        for kv in m.group(1).split(","):
            if "=" in kv:
                a, b = kv.split("=")
                if a.strip() in o: o[a.strip()] = int(b)
    return o


def stopa(ev):
    """kratki zajęte przez zdarzenie względem jego położenia: [(dx, dy)] razem z (0,0)"""
    pg = ev["pages"][0]
    gr = pg["image"]["characterName"]
    out = {(0, 0)}
    for d in N.EXTRA.get(gr, []): out.add(tuple(d))
    o = _occ(ev.get("note"))
    for dy in range(-o["up"], o["down"] + 1):
        for dx in range(-o["left"], o["right"] + 1): out.add((dx, dy))
    return out


def zdarzenie_ozdobne(ev):
    """czy zdarzenie nadaje się do pieczątki: drzewa, krzaki, kamienie, pnie, kłody (bez zadań, przejść, świateł)"""
    pg = ev["pages"][0]
    gr = pg["image"]["characterName"]
    if DOZWOLONE.match(gr): return True
    if not gr and re.search(r"<(Stump|Log)\b", ev.get("note") or "") and pg["priorityType"] == 1: return True
    return False


# ------------------------------------------------------------------------------------------------ wycinanie
def wczytaj(mid, katalog=None):
    p = (katalog or (ROOT + "data")) + "/Map%03d.json" % mid
    return json.loads(open(p, "rb").read().decode("utf-8"))


def warstwy_np(raw):
    W, H = raw["width"], raw["height"]
    return np.array(raw["data"], dtype=np.int32).reshape(6, H, W)


DEKOR = (21, 46, 28, 29, 31)          # ozdobniki trawy na warstwie 1: część gruntu, nie obiekt


def _tlo_set(tlo): return (tlo,) if isinstance(tlo, int) else tuple(tlo)


def tlo_kratki(a, x, y, tlo):
    """czy kratka (x,y) to czyste tło: grunt tlo na warstwie 0, na 1 najwyżej ozdobniki trawy, nic na 2-3, region 0/7/9"""
    if rodzaj(int(a[0, y, x])) not in _tlo_set(tlo): return False
    t = int(a[1, y, x])
    if t and rodzaj(t) not in DEKOR: return False
    if a[2, y, x] or a[3, y, x]: return False
    return int(a[5, y, x]) in (0, 7, 9)


def obiekt_kratki(a, x, y, tlo, bez_gornych=False, grunt_jako_obiekt=False):
    """kratka OBIEKTU (nie gruntu): półka/skarpa A2-47, ściana, kafel B-E na warstwie 1, cokolwiek na 2-3, region 1-6, 8;
    z grunt_jako_obiekt także każdy grunt inny niż tło (cypel w morzu)"""
    t1 = int(a[1, y, x])
    k1 = rodzaj(t1)
    if t1 and (k1 is None or k1 == 47 or k1 >= 48): return True
    if not bez_gornych and (a[2, y, x] or a[3, y, x]): return True
    if int(a[5, y, x]) in (1, 2, 3, 4, 5, 6, 8): return True
    if grunt_jako_obiekt and not tlo_kratki(a, x, y, tlo): return True
    return False


def _skladowe(kr):
    kr = set(kr); out = []
    while kr:
        s0 = kr.pop(); st = [s0]; c = {s0}
        while st:
            cx, cy = st.pop()
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    n = (cx + dx, cy + dy)
                    if n in kr: kr.discard(n); c.add(n); st.append(n)
        out.append(c)
    return out


def _zdarzenia_okna(raw, x0, y0, w, h, zdarzenia, wewn, filtr_ozdobne=True):
    out = []
    for e in raw["events"]:
        if not e or not wewn(e["x"], e["y"]): continue
        if zdarzenia == "brak": continue
        if zdarzenia == "ozdobne" and filtr_ozdobne and not zdarzenie_ozdobne(e): continue
        out.append(e)
    return out


def wytnij(raw, x0, y0, w, h, nazwa, opis, tlo=16, zrodlo=None, zdarzenia="ozdobne", bez_regionow=(7, 9), kontrola=True,
           bez_gornych=False, grunt_jako_obiekt=False, elipsa=False, rzadzenie=0.0, bez_gruntu=False, seed=1, obetnij_zdarzenia=False, miekki_brzeg=(0, 0.0), otwarte=(), zakoncz_grunt=0, pelny=False, **_ignoruj):
    """pieczątka z okna (x0,y0,w,h) mapy raw.
    Maska = obiekty (półki, ściany, kafle B-E, zdarzenia ozdobne z ich zajętością) + grunt inny niż tło (plamy ziemi, skalny rumosz),
    przy czym plamy gruntu, które dotykają brzegu okna, są POMIJANE w całości (nie ma uciętych plam). Obiekt dotykający brzegu
    okna = wyjątek (okno za małe). elipsa: tylko elipsa wpisana w okno (zdarzenia poza nią odpadają, tylko zdarzenia), rzadzenie:
    odsetek zdarzeń wyrzucanych przy obrzeżu elipsy (miękki skraj kępy/lasu)."""
    a = warstwy_np(raw)
    H, W = raw["height"], raw["width"]
    assert 0 <= x0 and 0 <= y0 and x0 + w <= W and y0 + h <= H, "okno poza mapą"
    rnd = random.Random(seed)
    cx0, cy0 = x0 + (w - 1) / 2.0, y0 + (h - 1) / 2.0

    def w_elipsie(x, y, r=1.0):
        return ((x - cx0) / (w / 2.0)) ** 2 + ((y - cy0) / (h / 2.0)) ** 2 <= r
    wewn = lambda x, y: (x0 <= x < x0 + w and y0 <= y < y0 + h) and (not elipsa or w_elipsie(x, y))
    ev = []
    sz, pr = miekki_brzeg
    for e in _zdarzenia_okna(raw, x0, y0, w, h, zdarzenia, wewn):
        if elipsa and rzadzenie and not w_elipsie(e["x"], e["y"], 0.55) and rnd.random() < rzadzenie: continue
        if obetnij_zdarzenia:
            if any(not (x0 + 1 <= e["x"] + dx < x0 + w - 1 and y0 + 1 <= e["y"] + dy < y0 + h - 1) for (dx, dy) in stopa(e)): continue
            d = min(e["x"] - x0, x0 + w - 1 - e["x"], e["y"] - y0, y0 + h - 1 - e["y"])
            if sz and d < sz and rnd.random() < pr * (1 - d / float(sz)): continue
        ev.append(e)
    obj, grunt = set(), set()
    if not elipsa:
        for y in range(y0, y0 + h):
            for x in range(x0, x0 + w):
                if obiekt_kratki(a, x, y, tlo, bez_gornych, grunt_jako_obiekt): obj.add((x, y))
                elif not tlo_kratki(a, x, y, tlo) and not bez_gruntu: grunt.add((x, y))
    brzeg = lambda c: (c[0] == x0 and 'W' not in otwarte) or (c[0] == x0 + w - 1 and 'E' not in otwarte) or (c[1] == y0 and 'N' not in otwarte) or (c[1] == y0 + h - 1 and 'S' not in otwarte)
    odrzucone = 0
    # obiekty z kafli dotykające brzegu okna: odpadają w całości (stamp nigdy nie ma uciętego obiektu)
    for comp in _skladowe(obj):
        if any(brzeg(c) for c in comp): obj -= comp; odrzucone += len(comp)
    ev2 = []
    for e in ev:
        st = stopa(e)
        if any(brzeg((e["x"] + dx, e["y"] + dy)) or not (x0 <= e["x"] + dx < x0 + w and y0 <= e["y"] + dy < y0 + h) for (dx, dy) in st) and not obetnij_zdarzenia:
            if kontrola: odrzucone += 1; continue
        ev2.append(e)
    ev = ev2
    for e in ev:
        for (dx, dy) in stopa(e): obj.add((e["x"] + dx, e["y"] + dy))
    keep = set(obj)
    if zakoncz_grunt:
        # grunt (ścieżka) przecięty brzegiem okna: obcinamy pas przy brzegu i zaokrąglamy końce (ścieżka kończy się łagodnie w środku okna)
        n = zakoncz_grunt
        grunt = {c for c in grunt if x0 + n <= c[0] < x0 + w - n and y0 + n <= c[1] < y0 + h - n}
        for _ in range(3):
            grunt = {c for c in grunt if sum(((c[0] + dx, c[1] + dy) in grunt) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))) >= 2}
    for comp in _skladowe(grunt):
        if any(brzeg(c) for c in comp): continue        # plama dotykająca brzegu: pomijamy w całości
        keep |= comp
    if pelny:
        keep = {(x, y) for y in range(y0, y0 + h) for x in range(x0, x0 + w)}
        ev = [e for e in _zdarzenia_okna(raw, x0, y0, w, h, zdarzenia, lambda x, y: True) if x0 <= e['x'] < x0 + w and y0 <= e['y'] < y0 + h]
    maska = {c for c in keep if x0 <= c[0] < x0 + w and y0 <= c[1] < y0 + h}
    p = {"nazwa": nazwa, "opis": opis, "w": w, "h": h, "tsid": raw["tilesetId"], "tlo": _tlo_set(tlo)[0], "tlo_zbior": list(_tlo_set(tlo)),
         "zrodlo": zrodlo or {"x0": x0, "y0": y0}, "odrzucone": odrzucone, "warstwy": [], "cienie": [], "regiony": [], "maska": [], "zdarzenia": []}
    for z in range(4):
        wz = []
        for j in range(h):
            for i in range(w):
                c = (x0 + i, y0 + j)
                v = int(a[z, c[1], c[0]]) if c in maska else 0
                if z >= 2 and bez_gornych: v = 0
                wz.append(v)
        p["warstwy"].append(wz)
    p["cienie"] = [int(a[4, y0 + j, x0 + i]) if (x0 + i, y0 + j) in maska else 0 for j in range(h) for i in range(w)]
    p["regiony"] = [(int(a[5, y0 + j, x0 + i]) if int(a[5, y0 + j, x0 + i]) not in bez_regionow else 0) if (x0 + i, y0 + j) in maska else 0
                    for j in range(h) for i in range(w)]
    p["maska"] = [1 if (x0 + i, y0 + j) in maska else 0 for j in range(h) for i in range(w)]
    for e in sorted(ev, key=lambda e: (e["y"], e["x"])):
        dd = {k: v for k, v in e.items() if k not in ("id", "x", "y")}
        p["zdarzenia"].append({"dx": e["x"] - x0, "dy": e["y"] - y0, "ev": dd})
    return p


def _boki_obiektu(raw, x0, y0, w, h, kw):
    a = warstwy_np(raw)
    tlo = kw.get("tlo", 16)
    obj = set()
    if not kw.get("elipsa"):
        for y in range(y0, y0 + h):
            for x in range(x0, x0 + w):
                if obiekt_kratki(a, x, y, tlo, kw.get("bez_gornych", False), kw.get("grunt_jako_obiekt", False)): obj.add((x, y))
    ot = kw.get("otwarte", ())
    return (any(c[0] <= x0 for c in obj) and 'W' not in ot, any(c[0] >= x0 + w - 1 for c in obj) and 'E' not in ot,
            any(c[1] <= y0 for c in obj) and 'N' not in ot, any(c[1] >= y0 + h - 1 for c in obj) and 'S' not in ot)


def wytnij_auto(raw, x0, y0, w, h, nazwa, opis, max_rozszerz=5, **kw):
    """jak wytnij, ale gdy obiekt dotyka brzegu okna, okno rośnie w tę stronę o 1 kratkę (do max_rozszerz razy)"""
    W, H = raw["width"], raw["height"]
    for _ in range(max_rozszerz):
        l, r, u, d = _boki_obiektu(raw, x0, y0, w, h, kw)
        if not (l or r or u or d): break
        if l and x0 > 0: x0 -= 1; w += 1
        if r and x0 + w < W: w += 1
        if u and y0 > 0: y0 -= 1; h += 1
        if d and y0 + h < H: h += 1
    return wytnij(raw, x0, y0, w, h, nazwa, opis, **kw)


def zapisz(p, katalog=None):
    d = katalog or DANE
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, p["nazwa"] + ".json"), "wb") as f:
        f.write(json.dumps(p, ensure_ascii=False, separators=(",", ":")).encode("utf-8"))


def wczytaj_pieczatke(nazwa, katalog=None):
    return json.loads(open(os.path.join(katalog or DANE, nazwa + ".json"), "rb").read().decode("utf-8"))


def wszystkie_pieczatki(katalog=None):
    d = katalog or DANE
    return sorted(f[:-5] for f in os.listdir(d) if f.endswith(".json")) if os.path.isdir(d) else []


# ------------------------------------------------------------------------------------------------ płótno
class Plotno:
    """płótno mapy w pamięci: 6 warstw (0-3 kafle, 4 cienie, 5 regiony) i lista zdarzeń"""

    def __init__(self, w, h, tsid, tlo=16):
        self.W, self.H, self.tsid = w, h, tsid
        self.a = np.zeros((6, h, w), dtype=np.int32)
        self.a[0, :, :] = 2048 + 48 * tlo
        self.ev = []          # {"x","y","ev"}
        self.zajete = {}      # (x,y) -> indeks zdarzenia
        self.klucz = {}

    # ---- kafle
    def rodzaj(self, z, kratki, k):
        for (x, y) in kratki:
            if 0 <= x < self.W and 0 <= y < self.H: self.a[z, y, x] = 2048 + 48 * k
        self.przelicz(kratki)

    def przelicz(self, kratki, r=1, warstwy=(0, 1)):
        rc = pierscien(kratki, r)
        for z in warstwy: przelicz_warstwe(self.a[z], rc)

    # ---- zdarzenia
    def wolne(self, ev, x, y):
        for (dx, dy) in stopa(ev):
            cx, cy = x + dx, y + dy
            if not (0 <= cx < self.W and 0 <= cy < self.H): return False
            if (cx, cy) in self.zajete: return False
        return True

    def dodaj(self, ev, x, y, sila=False):
        if not sila and not self.wolne(ev, x, y): return False
        i = len(self.ev)
        self.ev.append({"x": x, "y": y, "ev": copy.deepcopy(ev)})
        for (dx, dy) in stopa(ev): self.zajete[(x + dx, y + dy)] = i
        return True

    def usun_zdarzenia_w(self, kratki):
        zk = {self.zajete[c] for c in kratki if c in self.zajete}
        if not zk: return 0
        self.ev = [e for i, e in enumerate(self.ev) if i not in zk]
        self.zajete = {}
        for i, e in enumerate(self.ev):
            for (dx, dy) in stopa(e["ev"]): self.zajete[(e["x"] + dx, e["y"] + dy)] = i
        return len(zk)

    # ---- pieczątka
    def wstaw(self, p, x, y, przelicz=True, zdarzenia=True, nadpisz_zdarzenia=True, bez_cieni=False):
        """kładzie pieczątkę lewym górnym rogiem okna w (x, y); zwraca zbiór kratek maski (w układzie mapy)"""
        w, h = p["w"], p["h"]
        kr = set()
        for j in range(h):
            for i in range(w):
                if p["maska"][j * w + i]:
                    cx, cy = x + i, y + j
                    if 0 <= cx < self.W and 0 <= cy < self.H: kr.add((cx, cy))
        if nadpisz_zdarzenia: self.usun_zdarzenia_w(kr)
        for (cx, cy) in kr:
            i, j = cx - x, cy - y
            for z in range(4):
                v = p["warstwy"][z][j * w + i]
                if z == 0 and v == 0 and p.get("zachowaj_grunt"): continue      # pas obiektu bez własnego gruntu: grunt docelowy zostaje
                self.a[z, cy, cx] = v
            self.a[4, cy, cx] = 0 if bez_cieni else p["cienie"][j * w + i]
            self.a[5, cy, cx] = p["regiony"][j * w + i]
        # warstwa 0 w kratkach maski bez kafla (np. tylko ozdobnik na warstwie 1) zostaje tłem
        for (cx, cy) in kr:
            if self.a[0, cy, cx] == 0: self.a[0, cy, cx] = 2048 + 48 * p["tlo"]
        if zdarzenia:
            for d in p["zdarzenia"]:
                self.dodaj(d["ev"], x + d["dx"], y + d["dy"])
        if przelicz:
            # tylko pas styku: kratki pierścienia +1 i kratki maski przy jej brzegu (wnętrze zostaje takie, jak w mapie źródłowej)
            band = {c for c in pierscien(kr) if any((c[0] + dx, c[1] + dy) not in kr for dx in (-1, 0, 1) for dy in (-1, 0, 1))}
            for z in (0, 1): przelicz_warstwe(self.a[z], band)
        return kr

    # ---- zapis
    def do_raw(self, props, id_od=1):
        """słownik mapy w układzie edytora; zdarzenia numerowane od id_od (nowe: 1-499), posortowane po (y, x)"""
        raw = dict(props)
        raw["width"], raw["height"], raw["tilesetId"] = self.W, self.H, self.tsid
        raw["data"] = [int(v) for v in self.a.reshape(-1)]
        evs = [None]
        for i, e in enumerate(sorted(self.ev, key=lambda e: (e["y"], e["x"])), id_od):
            d = copy.deepcopy(e["ev"])
            ne = {"id": i, "name": d.get("name", ""), "note": d.get("note", ""), "pages": d["pages"], "x": e["x"], "y": e["y"]}
            evs.append(ne)
        raw["events"] = evs
        return raw


def zapisz_mape(raw, sciezka):
    os.makedirs(os.path.dirname(sciezka), exist_ok=True)
    with open(sciezka, "wb") as f:
        f.write(popraw.tekst_mapy(raw))


def maska_obrazek(p, skala=1.0, siatka=True):
    """podgląd pieczątki: pieczątka położona na płótnie tła (maska zaznaczona obrysem) wyrenderowana jak w grze"""
    pl = Plotno(p["w"] + 4, p["h"] + 4, p["tsid"], p["tlo"])
    pl.wstaw(p, 2, 2)
    raw = pl.do_raw(dict(L_PROPS_PUSTE))
    mp = L.Mapa(990, raw=raw)
    return L.render(mp, grid=siatka, scale=skala).convert("RGB")


L_PROPS_PUSTE = {"autoplayBgm": False, "bgm": {"name": "", "pan": 0, "pitch": 100, "volume": 90}, "autoplayBgs": False,
                 "bgs": {"name": "", "pan": 0, "pitch": 100, "volume": 90}, "disableDashing": False, "displayName": "", "encounterList": [],
                 "encounterStep": 30, "note": "", "parallaxLoopX": False, "parallaxLoopY": False, "parallaxName": "", "parallaxShow": True,
                 "parallaxSx": 0, "parallaxSy": 0, "scrollType": 0, "specifyBattleback": False}


# ------------------------------------------------------------------------------------------------ kontrola kształtów źródła
def zgodnosc_ksztaltow(raw, okno=None):
    """ile autokafli warstw 0-1 w oknie ma kształt różny od liczonego (czy przeliczanie jest bezpieczne dla tej mapy)"""
    a = warstwy_np(raw)
    H, W = raw["height"], raw["width"]
    x0, y0, x1, y1 = okno or (0, 0, W - 1, H - 1)
    zle = 0; razem = 0
    for z in (0, 1):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                t = int(a[z, y, x])
                if t < 2048 or t >= 2048 + 48 * 128: continue
                k = rodzaj(t)
                if k < 16 and not kind_floor(k): continue
                razem += 1
                if 2048 + k * 48 + kształt(a[z], x, y, t) != t: zle += 1
    return zle, razem
