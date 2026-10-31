# -*- coding: utf-8 -*-
"""STYKI ŚWIATA: buduje KOPIE map w tools/swiat/styki/staging/ (data/ i js/ nie są ruszane), żeby spełnić kontrakt krawędzi (tools/mapy/swiat_styki.py):
  1. nowe mapy w dziurach maski świata (960-964), z treścią w stylu sąsiadów (las, polany, kamienie, drzewa),
  2. zszycie styków: każda kratka krawędzi chodliwa po jednej stronie jest chodliwa po drugiej (wycięcie przesieki w lesie albo zasłonięcie lasem
     / drzewami; zawsze mapa NIE-gracza, gdy to możliwe), kratki bez mapy za krawędzią (wąskie paski) zasłonięte lasem,
  3. uszczelnienie styków zakazanych fabularnie (175 z 934, 120 i nową 962),
  4. links z prawdziwych kafli (swiat_styki.py --linki), układ świata (uklad.json), MapInfos, sumy sha256 oryginałów.
Nie rusza: Orla Grań tylko wspinaczką (175 <-> 13 bez zmian), łacha Wraku (162 <-> 165 bez zmian).
  python tools/swiat/styki/zbuduj_styki.py"""
import os, sys, json, copy, math, random, hashlib, collections
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
for p in (os.path.join(ROOT, "tools", "mapy"), os.path.join(ROOT, "tools", "rozszerzenia"), os.path.join(ROOT, "tools", "swiat", "etap2"),
          os.path.join(ROOT, "tools", "swiat", "etap1")):
    sys.path.insert(0, p)
sys.argv = sys.argv[:1] + ["--staging", os.path.join(HERE, "staging")]       # swiat_styki czyta staging
import numpy as np
import wspolne as W
import zbuduj as Z
import ogon as O
import zbuduj2b as B2
import mapylib as L
import swiat_styki as S

try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
STG = os.path.join(HERE, "staging"); DATA = os.path.join(STG, "data")
os.makedirs(DATA, exist_ok=True)
K = Z.K
PL = {1, 3, 4, 8, 13, 23, 24, 25, 26, 111}
HARD = PL | {125, 159, 155, 157, 162, 165}      # woda twarda (swiat_kratki.py): jej morza nie zamieniam w ląd                 # mapy gracza (zmieniam tylko, gdy nie da się inaczej)
OPP = {"N": "S", "S": "N", "E": "W", "W": "E"}
IN = {"N": (0, 1), "S": (0, -1), "W": (1, 0), "E": (-1, 0)}  # od krawędzi w głąb mapy
# pary uszczelniane z obu stron (kratka chodliwa po którejkolwiek stronie dostaje drzewa/las): wstęp tylko wspinaczką (Orzel.wayUp) itd.
USZCZELNIJ = {frozenset((175, 934)), frozenset((175, 120)), frozenset((175, 962)), frozenset((962, 935))}      # 962|935: inaczej z miasta da się dojść pieszo do 935 -> 931 -> 175 (obejście wspinaczki)
POMIN = {frozenset((13, 175)), frozenset((162, 165))}        # zostają jak są (wspinaczka / łacha w odpływie)

# nowe mapy: nazwa, położenie [x0, y0, szer., wys.] w kratkach świata, wzór właściwości, sąsiedzi do statystyk (gęstość zdarzeń, grunt, pula szablonów),
# styki (sąsiad, strona TEJ mapy) do ścieżek, strony z sąsiadem, miejsce zbierania, ziarno. 964: x0 = -14 (świat nie ma kratek na zachód od x 0; to morze) -
# dzięki temu mapa ma 40 kratek szerokości (ekran 1280 px = 26,7 kratki) bez przesuwania całego świata.
NOWE = {
    960: dict(nazwa="Stok nad Garnizonem", rect=[282, 216, 36, 44], wzor=157, seed=9601, rodzic=157, sasiedzi=[157, 950, 162], styki=[(157, "N"), (950, "W"), (162, "S")], sasiaduja="NWSE", miejsce="krag",
              pod="stok między urwiskiem a garnizonem", opis="Wiatr z zatoki przygina tu trawę, a z lasu słychać siekierę, której nikt nie widzi."),
    961: dict(nazwa="Przesieka pod Murami", rect=[318, 216, 102, 33], wzor=157, seed=9611, rodzic=157, sasiedzi=[157, 13, 111], styki=[(157, "N"), (13, "N"), (111, "S")], sasiaduja="NESW", miejsce="pien",
              pod="dzika ziemia przy murach miasta", opis="Przesieka, którą wydeptały owce, wilki i ci, którzy nie chcą płacić myta przy bramie."),
    962: dict(nazwa="Zachodni Stok Gór", rect=[349, 64, 55, 80], wzor=13, seed=9621, rodzic=13, sasiedzi=[13, 157, 175], styki=[(935, "N"), (13, "E"), (175, "E"), (157, "S")], sasiaduja="NES", miejsce="ruda",
              pod="skalisty cypel nad morzem", opis="Za plecami szumi morze, przed tobą stromizna, której nikt rozsądny nie próbuje."),
    963: dict(nazwa="Łąka pod Klifem", rect=[116, 225, 70, 35], wzor=950, seed=9631, rodzic=18, sasiedzi=[950, 910, 18], styki=[(910, "N"), (18, "W"), (950, "E")], sasiaduja="NWE", miejsce="jablon",
              pod="wilgotna łąka u stóp klifu", opis="Trawa po kolana i cisza, w której słychać, jak daleko jest do ludzi."),
    964: dict(nazwa="Zachodni Brzeg", rect=[-14, 225, 40, 76], wzor=18, seed=9641, rodzic=18, sasiedzi=[18, 910], styki=[(18, "E"), (918, "N")], sasiaduja="EN", miejsce="dryf",
              pod="ostatni skrawek lądu na zachodzie", opis="Dalej już tylko woda i mewy, które patrzą na ciebie tak, jakbyś był zagubiony."),
}


_ORIG = {}


def origM(mid):
    if mid not in _ORIG: _ORIG[mid] = L.Mapa(mid)
    return _ORIG[mid]


def sha(p): return hashlib.sha256(open(p, "rb").read()).hexdigest()


# ------------------------------------------------------------------------------------------------ stan
class Stan:
    def __init__(self):
        self.maps = {}
        self.sumy = {}
        self.uklad = {}
        self.zmienione = set()
        self.sz = O.szablony()
        self.raport = []
        self.zdjecia_przed = {}
        self.proby = collections.Counter()
        self.gracz_z = collections.Counter()
        self.gracz = {}      # mapy gracza: {id: {kratki zasłonięte}}

    def wczytaj(self, mid):
        if mid not in self.maps:
            p = os.path.join(ROOT, "data", "Map%03d.json" % mid)
            self.maps[mid] = Z.wczytaj(mid)
            self.sumy[str(mid)] = sha(p)
        return self.maps[mid]

    def swiat(self):
        raws = dict(self.maps)
        for mid in S.swiat_data_zywe()[0]:
            if mid not in raws and os.path.exists(os.path.join(ROOT, "data", "Map%03d.json" % mid)): raws[mid] = self.wczytaj(mid)
        sw = S.Swiat(raws=raws, uklad={k: v for k, v in self.uklad.items()})
        sw.links = []; sw.generowane = []
        return sw

    def rect_swiata(self, mid):
        if mid in self.uklad: return tuple(self.uklad[mid][:2])
        return tuple(S.swiat_data_zywe()[0][mid][:2])

    def log(self, s):
        self.raport.append(s); print(s)


def h2(x, y, seed):
    return random.Random((x * 73856093) ^ (y * 19349663) ^ (seed * 83492791)).random()


# ------------------------------------------------------------------------------------------------ nowe mapy
def nowa(st, mid, sp):
    import nowe_mapy as N
    m, dens, grunt = N.narysuj(st, mid, sp)
    st.maps[mid] = m; st.uklad[mid] = list(sp["rect"]); st.zmienione.add(mid)
    st.log("nowa mapa %d %s %dx%d (świat %d,%d), lądu %d kratek; gęstość sąsiadów na 100 kratek: %s; postawiono (kat, cel, ile): %s; miejsce zbierania %s w %s" % (
        mid, sp["nazwa"], sp["rect"][2], sp["rect"][3], sp["rect"][0], sp["rect"][1], sp["_ladu"], {k: round(v, 1) for k, v in dens.items()}, sp["_log"], sp["miejsce"], sp["_poi"]))


# ------------------------------------------------------------------------------------------------ operacje na kafelkach
def blokuje_kafel(M, t):
    return bool(t) and (M.zest.flag(t) & 0x0f) == 0x0f and not (M.zest.flag(t) & 0x10)


def zabudowa(M, x, y):
    """kratka ZABUDOWY: mur, dach, bruk, deski, plac - podszyt, krzaki ani drzewa nie mogą na niej rosnąć (reguła budowy):
    autokafel A3/A4 (kind >= 48: ściany, dachy), bruk (kind 19, 40, 41), blokujący kafel B-E/A5 na warstwie 0 (mur), dowolny kafel na warstwie 2-3
    (blanki, dachówki, ozdoby: obiekt budynku), region 2 (mur) albo zdarzenie-budynek (nie przyroda)"""
    for z in (0, 1):
        t = M.t(z, x, y)
        if t >= 2816:
            k = (t - 2048) // 48
            if k >= 48 or k in GRUNT_ZABUDOWA: return True
    if blokuje_kafel(M, M.t(0, x, y)) and not 2048 <= M.t(0, x, y) < 2816: return True
    if M.t(2, x, y) or M.t(3, x, y): return True
    if M.t(5, x, y) == 2: return True
    return False


def natura_zd(z):
    return z.natura and z.id < 458 and not z.przenosi


POWOD = []   # ostatnie przyczyny odmowy (diagnostyka)
ZAB_POMINIETE = set()        # kratki zabudowy, których nie zasłaniamy (rozwiązanie po stronie sąsiada)
IGN_LOCK = False                # wycinanie ignoruje blokady budowy (zasłonięte kratki sąsiada): mapa gracza ma pierwszeństwo przed zasłoniętym rogiem sąsiada
TYLKO_ZD = False               # wycinanie tylko zdarzeń przyrody (drzewo gracza w kratce przed murem), bez ruszania kafli
GRUNT_ZABUDOWA = {19, 40, 41}   # rodzaje autokafli A2: bruk / kostka / kamienny plac (19 = bruk placu Podgrodzia)
ZAMKN, OTWAR = set(), set()    # (mapa, x, y): kratki zasłonięte / wycięte przez budowę - nie odwracamy ich (zbieżność: drugi przebieg = 0 zmian)
WODA_TWARDA_OK = False          # (zabudowa po stronie wolnej: nawet woda twardej mapy nie-gracza przy krawędzi może stać się plażą - kilka kratek)
WODA_NA_LAD = False             # wycinanie wolno przekształcić wodę przy krawędzi mapy NIE-twardej w plażę (strona gracza ma zostać nietknięta)


def plan_wycinki(M, cells_in, mid_x=None):
    """cells_in: [(x, y, glebokosc, dx, dy)]: komórki, które ma być wolne. Zwraca listę kratek do wycięcia albo None.
    Krawędź (j = 0) musi się udać, głębsze kratki obcinają głębokość, gdy trafią na coś niewycinalnego."""
    reg = []
    blk = M.ev_block()
    for (ex, ey, d, dx, dy) in cells_in:
        for j in range(d):
            x, y = ex + dx * j, ey + dy * j
            if not (0 <= x < M.W and 0 <= y < M.H): break
            ok = True; why = ""
            if not M.teren(x, y): ok = False; why = "pustka"
            elif (M.id, x, y) in ZAMKN and not IGN_LOCK: ok = False; why = "zasłonięte przez budowę"
            elif TYLKO_ZD and (blokuje_kafel(M, M.t(0, x, y)) or M.t(2, x, y) or M.t(3, x, y) or (M.t(1, x, y) >= 2816 and blokuje_kafel(M, M.t(1, x, y)) and (M.t(1, x, y) - 2048) // 48 != 20)): ok = False; why = "kafel blokuje (mapa gracza: tylko zdarzenia przyrody i las-podszyt do usunięcia)"
            elif any(2048 <= M.t(z, x, y) < 2816 for z in (0, 1)) and not (WODA_NA_LAD and (M.id not in HARD or WODA_TWARDA_OK) and M.id not in PL): ok = False; why = "woda"
            elif blokuje_kafel(M, M.t(0, x, y)) and not (2048 <= M.t(0, x, y) < 2816 and WODA_NA_LAD and (M.id not in HARD or WODA_TWARDA_OK) and M.id not in PL): ok = False; why = "kafel podłoża blokuje (klif/mur) %d" % M.t(0, x, y)
            elif M.t(5, x, y) == 2: ok = False; why = "region 2 (mur)"
            if ok and (x, y) in blk and not all(natura_zd(z) for z in blk[(x, y)]): ok = False; why = "zdarzenie: " + ",".join("%s/%d" % (z.char or z.name, z.id) for z in blk[(x, y)])
            if not ok:
                if j == 0: POWOD.append((M.id, "wytnij", x, y, why)); return None
                break
            reg.append((x, y))
    return reg


def wytnij(st, mid, reg):
    m, M = st.maps[mid], L.Mapa(mid, raw=st.maps[mid])
    blk = M.ev_block()
    woda = [(x, y) for (x, y) in reg if any(2048 <= W.at(m, z, x, y) < 2816 for z in (0, 1))]
    for (x, y) in woda:           # woda przy krawędzi -> plaża (kind 17), łagodnie: kafle sąsiednie dostają kształty
        W.put(m, 0, x, y, K(17))
    if woda: W.reshape(m, 0, W.ring(set(woda), 1))
    for (x, y) in reg: OTWAR.add((mid, x, y))
    for (x, y) in reg:
        for z in blk.get((x, y), []):
            m["events"][z.id] = None
        for z in (1, 2, 3):
            t = W.at(m, z, x, y)
            if blokuje_kafel(M, t): W.put(m, z, x, y, 0)
        if (M.zest.flag(W.at(m, 0, x, y)) & 0x0f) == 0x0f: pass
    W.reshape(m, 1, W.ring(set(reg), 1))
    st.zmienione.add(mid)


def korytarze(M):
    """kratki przed zdarzeniami przejścia na krawędzi (bramy, ścieżki do cypla): 5 kratek w głąb, nie wolno ich zasłaniać (dojście do bramy)"""
    out = set()
    for e in M.raw["events"]:
        if not e or not any(c["code"] == 201 for p in e["pages"] for c in p["list"]): continue
        sides = [side for side, on in (("W", e["x"] == 0), ("E", e["x"] == M.W - 1), ("N", e["y"] == 0), ("S", e["y"] == M.H - 1)) if on]
        for side in sides:
            dx, dy = IN[side]
            for j in range(6 if len(sides) == 1 else 2): out.add((e["x"] + dx * j, e["y"] + dy * j))      # narożnik (dwie strony): tylko najbliższe kratki
    return out


def plan_zasloniecia(M, cells_in, sp_tryb):
    """kratki do zasłonięcia: każda chodliwa, bez niewycinalnych zdarzeń, poza korytarzami przed bramami (zdarzeniami przejścia)"""
    reg = []
    chron = korytarze(M)
    for (ex, ey, d, dx, dy) in cells_in:
        for j in range(d):
            x, y = ex + dx * j, ey + dy * j
            if not (0 <= x < M.W and 0 <= y < M.H): break
            if not M.stoi(x, y) or (M.id, x, y) in OTWAR or (x, y) in chron: continue
            if zabudowa(M, x, y): ZAB_POMINIETE.add((M.id, x, y)); continue       # reguła: nic nie rośnie na murze, dachu, bruku
            evs = [z for z in M.zd if (x, y) in z.komorki() or (z.x, z.y) == (x, y)]
            if any((not natura_zd(z)) and not (not z.widoczne and "pora dnia" in z.name) for z in evs):      # (niewidzialna kotwica „pora dnia” mieszkańca nie przeszkadza w zasłonięciu kratki)
                POWOD.append((M.id, "zasłoń (kratka pominięta)", x, y, ",".join("%s/%d" % (z.char or z.name, z.id) for z in evs)))
                continue     # zdarzenie (postać, przejście): kratka zostaje, sąsiednie zasłonięte
            reg.append((x, y))
    return reg


def zaslon(st, mid, reg, seed):
    m, M = st.maps[mid], L.Mapa(mid, raw=st.maps[mid])
    tryb_tile = blokuje_kafel(M, K(20))
    W_, H_ = M.W, M.H
    rnd = random.Random(seed)
    for c in reg: ZAMKN.add((mid, c[0], c[1]))
    if tryb_tile:
        for (x, y) in reg:
            for z in M.zd:
                if (z.x, z.y) == (x, y) and natura_zd(z): m["events"][z.id] = None
            W.put(m, 1, x, y, K(20))
        W.reshape(m, 1, W.ring(set(reg), 1))
    else:
        def pula(prefiksy):
            return [e for e in m["events"] if e and e["pages"][0]["image"]["characterName"].startswith(prefiksy) and not any(c["code"] == 201 for p in e["pages"] for c in p["list"])]
        drzewa = pula(("!$Pine_", "!$Tree_Small", "!$Big_Trees"))
        if not drzewa: drzewa = [e for e in st.wczytaj(17)["events"] if e and e["pages"][0]["image"]["characterName"].startswith(("!$Pine_", "!$Tree_Small"))]
        krzaki = pula(("!$Bush_Bare",)); kamienie = pula(("!$Rock_Flat", "!$Rock_Mossy", "!$Rock_Cracked", "!$Rock_Twin"))
        if not drzewa: return False
        for (x, y) in reg:
            dist = min(x, W_ - 1 - x, y, H_ - 1 - y)          # 0 = rząd na krawędzi: zawsze zablokowany; głębsze rzędy rzadziej (nieregularna głębokość)
            if dist > 0 and rnd.random() > (0.55, 0.3, 0.15)[min(dist, 3) - 1]: continue
            for z in M.zd:
                if (z.x, z.y) == (x, y) and natura_zd(z): m["events"][z.id] = None
            r = rnd.random()
            pt, pk = (0.46, 0.84) if dist == 0 else (0.72, 0.92)      # rząd na krawędzi: drzewa, krzaki i kamienie na przemian; głębiej głównie drzewa
            src = drzewa if r < pt else (krzaki if r < pk and krzaki else (kamienie if kamienie else drzewa))
            e = copy.deepcopy(rnd.choice(src)); e["x"], e["y"] = x, y
            try: Z.dodaj(m, e)
            except AssertionError: return False
    st.zmienione.add(mid)
    return True


def profil(n, k, x, y, seed, maxd, mid=None):
    """głębokość wycięcia/zasłonięcia w k-tej z n kratek odcinka: łagodnie od brzegów odcinka, z szumem"""
    if n <= 1: base = 2
    else: base = 1 + 2.0 * math.sin(math.pi * (k + 0.5) / n)
    return max(1, min(maxd, int(round(base + (h2(x, y, seed) - 0.5) * 1.6))))


# ------------------------------------------------------------------------------------------------ zszywanie
def odcinki(sw):
    """lista (a, b, side, [komórki]) niezgodności: komórki = kratki krawędzi a (z polami b*, wolna, bwolna) w odcinkach o tej samej niezgodności;
    b == 0: ląd bez mapy za krawędzią. Każda para raz (a < b), b == 0 z a."""
    out = []
    for a in sorted(sw.M):
        for side in "NSWE":
            cells = sw.krawedz(a, side)
            by = collections.defaultdict(list)
            for c in cells: by[c["b"]].append(c)
            for b, lst in by.items():
                if b > 0 and b < a: continue
                cur = None
                for c in lst:
                    fa = c["wolna"] and c["glowny"]
                    fb = bool(c["bwolna"]) and c["bglowny"] if b > 0 else False
                    if c["powod"] == "bespoke" or c.get("brama"): cur = None; continue
                    uszcz = frozenset((a, b)) in USZCZELNIJ and (c["wolna"] or c["bwolna"])
                    if frozenset((a, b)) in POMIN: cur = None; continue
                    if b == 0:
                        mm = fa
                    else:
                        mm = (fa != fb) or uszcz
                    if mm:
                        typ = ("U" if uszcz else "A" if fa else "B") if b > 0 else "A"
                        if cur and cur[0] == typ and cur[1][-1]["i"] == c["i"] - 1: cur[1].append(c)
                        else: cur = [typ, [c]]; out.append((a, b, side, cur))
                    else: cur = None
    return [(a, b, side, cur[0], cur[1]) for (a, b, side, cur) in out]


GRACZ = False      # ostatni przebieg: mapy gracza wolno tylko ZASŁANIAĆ (jedna warstwa drzew/lasu na wolnych kratkach krawędzi), nigdy wycinać


def modyfikowalna(mid, st, nowe, op=None):
    """mapy gracza zostają nietknięte (rysuje je gracz); w ostatnim przebiegu (GRACZ) wolno je tylko zasłaniać"""
    return mid in nowe or mid not in PL or (GRACZ and op == "zaslon")


def why_x(MX, ex):
    """dlaczego nie dało się otworzyć strony sąsiada (pierwsza kratka)"""
    x, y = ex[0]
    return "klif/woda/zdarzenie po stronie %d" % MX.id


def napraw(st, sw, nowe, seed=77):
    """jeden przebieg: dla każdego odcinka niezgodności wycina przesiekę albo zasłania. Zwraca (zmian, nierozwiązane)"""
    global IGN_LOCK, TYLKO_ZD, WODA_NA_LAD, WODA_TWARDA_OK
    zm, nier = 0, []
    for (a, b, side, typ, cells) in odcinki(sw):
        n = len(cells)
        Ma = L.Mapa(a, raw=st.maps[a])
        Mb = L.Mapa(b, raw=st.maps[b]) if b > 0 else None
        # komórki: strona A (x, y) i B (bx, by)
        ea = [(c["x"], c["y"]) for c in cells]
        eb = [(c["bx"], c["by"]) for c in cells] if b > 0 else []
        dxa, dya = IN[side]; dxb, dyb = IN[OPP[side]]
        def wejscia(es, dx, dy, mx):
            return [(x, y, profil(n, k, x, y, seed, mx), dx, dy) for k, (x, y) in enumerate(es)]
        fa_lista = [c for c in cells if c["wolna"]]
        # --- uszczelnianie: obie strony (tylko chodliwe kratki)
        if typ == "U":
            for (mid, M, es, dx, dy, cs) in ((a, Ma, ea, dxa, dya, [c["wolna"] for c in cells]), (b, Mb, eb, dxb, dyb, [c["bwolna"] for c in cells])):
                lst = [(x, y, profil(n, k, x, y, seed, 3), dx, dy) for k, ((x, y), f) in enumerate(zip(es, cs)) if f]
                if lst:
                    reg = plan_zasloniecia(M, lst, None)
                    if reg is None or not zaslon(st, mid, reg, seed + mid): nier.append((a, b, side, "uszczelnienie", mid)); continue
                    zm += len(reg)
            continue
        if b == 0:       # ląd bez mapy za krawędzią: zasłoń chodliwe kratki
            if not modyfikowalna(a, st, nowe, 'zaslon'): nier.append((a, b, side, "donikad (mapa gracza)", a)); continue
            lst = [(x, y, profil(n, k, x, y, seed, 3, a), dxa, dya) for k, ((x, y), c) in enumerate(zip(ea, cells)) if c["wolna"] and c["glowny"]]
            reg = plan_zasloniecia(Ma, lst, None)
            if reg is None or not zaslon(st, a, reg, seed + a): nier.append((a, b, side, "donikad (zasłonięcie)", a)); continue
            zm += len(reg); continue
        # --- niezgodność: wolna strona F, zablokowana X
        if typ == "A": F, X, ef, ex, MF, MX = a, b, ea, eb, Ma, Mb       # A chodliwa, B zablokowana
        else: F, X, ef, ex, MF, MX = b, a, eb, ea, Mb, Ma
        dF = (dxa, dya) if F == a else (dxb, dyb)
        dX = (dxb, dyb) if F == a else (dxa, dya)
        mF, mX = modyfikowalna(F, st, nowe, 'zaslon'), modyfikowalna(X, st, nowe, 'wytnij')
        # preferencja: zmieniaj nową mapę, potem mapę NIE-gracza; krótki odcinek (<= 2) zasłaniaj, dłuższy wycinaj
        opcje = []
        if X in nowe and F not in nowe: opcje = ["wytnij", "zaslon"]
        elif F in nowe and X not in nowe: opcje = ["zaslon", "wytnij"]
        else: opcje = ["zaslon", "wytnij"] if n <= 2 else ["wytnij", "zaslon"]
        # kratki ZABUDOWY po stronie wolnej (mur, dach, bruk, plac): nie zasłaniamy ich - otwieramy kratkę sąsiada (drzewo gracza usuwamy, nie ruszając kafli)
        zab = [k for k, (x, y) in enumerate(ef) if zabudowa(MF, x, y)]
        if zab:
            IGN_LOCK, TYLKO_ZD, WODA_NA_LAD, WODA_TWARDA_OK = True, (X in PL and X not in nowe), (X not in PL), True
            lst = [(ex[k][0], ex[k][1], 1 if X in PL and X not in nowe else profil(n, k, ex[k][0], ex[k][1], seed, 3), dX[0], dX[1]) for k in zab]
            reg = plan_wycinki(MX, lst)
            IGN_LOCK = TYLKO_ZD = WODA_NA_LAD = WODA_TWARDA_OK = False
            if reg is None: nier.append((a, b, side, "zabudowa: kratki sąsiada nie do otwarcia", F)); st.log("  UWAGA: %d kratek zabudowy mapy %d przy %d - sąsiad nie do otwarcia" % (len(zab), F, X))
            else:
                wytnij(st, X, reg); zm += len(reg)
                if X in PL and X not in nowe: st.gracz.setdefault(X, set()).update(reg); st.gracz_z[(X, F, "otwarta (drzewo gracza usunięte)")] += len(reg)
            keep = [k for k in range(len(ef)) if k not in zab]
            if not keep: continue
            ef = [ef[k] for k in keep]; ex = [ex[k] for k in keep]; cells = [cells[k] for k in keep]; n = len(cells)
        done = False
        klucz = (a, b, side, typ, cells[0]["i"] // 8)
        st.proby[klucz] += 1
        if st.proby[klucz] > 3 and not GRACZ: continue      # nic więcej nie da się zrobić bez dotykania mapy gracza: czeka na ostatni przebieg
        if st.proby[klucz] > 12: POWOD.append((a, "FLAP %s %s %s typ %s (X=%d F=%d)" % (a, b, side, typ, X, F), cells[0]["i"], n, ""))
        if st.proby[klucz] > 1 and st.proby[klucz] % 2 == 0: opcje = opcje[::-1]      # ta sama niezgodność wraca: druga metoda (np. narożnik dwóch styków)
        for op in opcje:
            if op == "wytnij" and mX:
                WODA_NA_LAD = F in PL and F not in NOWE      # sąsiad strony gracza: nawet morze przy krawędzi staje się plażą, byle nie ruszać mapy gracza
                IGN_LOCK = F in PL and F not in NOWE and X not in PL
                lst = [(x, y, profil(n, k, x, y, seed, 4), dX[0], dX[1]) for k, (x, y) in enumerate(ex)]
                reg = plan_wycinki(MX, lst)
                WODA_NA_LAD = IGN_LOCK = False
                if reg is None: continue
                wytnij(st, X, reg); zm += len(reg); done = True; break
            if op == "zaslon" and mF:
                lst = [(x, y, profil(n, k, x, y, seed, 3, F), dF[0], dF[1]) for k, (x, y) in enumerate(ef)]
                reg = plan_zasloniecia(MF, lst, None)
                if reg is None: continue
                if zaslon(st, F, reg, seed + F):
                    zm += len(reg); done = True
                    if F in PL and F not in NOWE: st.gracz.setdefault(F, set()).update(reg); st.gracz_z[(F, X, side if F == a else OPP[side])] += len(reg); POWOD.append((F, "zasłonięta mapa gracza przy %d: %s" % (X, why_x(MX, ex)), 0, 0, ""))
                    break
        if not done: nier.append((a, b, side, "brak sposobu", F))
    return zm, nier


def zapisz(st):
    for mid in sorted(st.zmienione | set(NOWE)):
        if mid not in st.maps: continue
        open(os.path.join(DATA, "Map%03d.json" % mid), "wb").write(W.json_text(st.maps[mid], "map"))
    # MapInfos
    mi, lay = W.read_json("data/MapInfos.json")
    st.sumy["MapInfos"] = sha(os.path.join(ROOT, "data", "MapInfos.json"))
    nast = max(e["order"] for e in mi if e) + 1
    for k, (mid, sp) in enumerate(sorted(NOWE.items())):
        while len(mi) <= mid: mi.append(None)
        mi[mid] = {"id": mid, "expanded": False, "name": sp["nazwa"], "order": nast + k, "parentId": sp["rodzic"], "scrollX": 0, "scrollY": 0}
    open(os.path.join(DATA, "MapInfos.json"), "wb").write(W.json_text(mi, lay))
    json.dump({"mapy": {str(k): v for k, v in st.uklad.items()}, "usun": [936], "later_usun": [930, 932]}, open(os.path.join(STG, "uklad.json"), "w", encoding="utf-8"), indent=1)
    uk = json.load(open(os.path.join(ROOT, "docs", "mapy", "swiat_uklad.json"), encoding="utf-8"))
    st.sumy["swiat_uklad"] = sha(os.path.join(ROOT, "docs", "mapy", "swiat_uklad.json"))
    for k in ("930", "932", "936"): uk["mapy"].pop(k, None)
    for mid, sp in NOWE.items():
        x0, y0, w, h = sp["rect"]
        uk["mapy"][str(mid)] = {"x0": x0, "y0": y0, "szer": w, "wys": h, "nowa": True, "nazwa": sp["nazwa"], "opis": sp["opis"], "rodzic": sp["rodzic"], "reczna": False}
    json.dump(uk, open(os.path.join(STG, "swiat_uklad.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(st.sumy, open(os.path.join(STG, "sumy.json"), "w"), indent=1)
    json.dump({"zmienione": sorted(st.zmienione), "nowe": sorted(NOWE)}, open(os.path.join(STG, "zmienione.json"), "w"))


def glowna():
    st = Stan()
    for f in os.listdir(DATA):
        if f.startswith("Map") and f.endswith(".json"): os.remove(os.path.join(DATA, f))
    for mid, sp in sorted(NOWE.items()):
        assert not os.path.exists(os.path.join(ROOT, "data", "Map%03d.json" % mid)), "data/Map%03d.json już istnieje" % mid
        nowa(st, mid, sp)
    nowe = set(NOWE)
    for p in range(30):
        sw = st.swiat()
        zm, nier = napraw(st, sw, nowe, seed=77 + p)
        st.log("przebieg %d: zmieniono %d kratek, nierozwiązane odcinki: %d" % (p + 1, zm, len(nier)))
        if not zm: break
    global GRACZ
    GRACZ = True
    st.proby.clear()
    for p in range(15):
        sw = st.swiat()
        zm, nier = napraw(st, sw, nowe, seed=177 + p)
        st.log("przebieg (mapy gracza: tylko zasłanianie) %d: zmieniono %d kratek, nierozwiązane odcinki: %d" % (p + 1, zm, len(nier)))
        if not zm: break
    # narożniki dwóch styków: kratka wolna wobec jednego sąsiada, zablokowana wobec drugiego - zasłoń ją po stronie mapy NIE-gracza (ignoruje blokady budowy)
    for _ in range(3):
        sw = st.swiat(); wyn = sw.analiza(); ile = 0
        for k in ("skok", "zamkniete_blok", "donikad"):
            for c in wyn.get(k, []):
                OTWAR.discard((c["a"], c["x"], c["y"]))
                M_ = L.Mapa(c["a"], raw=st.maps[c["a"]])
                reg = plan_zasloniecia(M_, [(c["x"], c["y"], 1, 0, 0)], None)
                if reg and zaslon(st, c["a"], reg, 9000 + c["x"]):
                    ile += len(reg)
                    if c["a"] in PL: st.gracz.setdefault(c["a"], set()).update(reg)
        st.log("narożniki: zasłonięto %d kratek" % ile)
        if not ile: break
    for (F, X, sd), n in sorted(st.gracz_z.items()): st.log("  gracz %d (krawędź %s) zasłonięta %d kratek (kumulatywnie) przy sąsiedzie %d%s" % (F, sd, n, X, " [też mapa gracza]" if X in PL else ""))
    for mid, cs in sorted(st.gracz.items()): st.log("  MAPA GRACZA %d: zasłonięte kratki krawędzi (%d): %s" % (mid, len(cs), sorted(cs)[:12]))
    # 175 od strony 13: wolne kratki południowej krawędzi Orlej Grani zasłonięte (wejście tylko wspinaczką; zejście orłem zostaje w Orzel_Data); 13 (gracz) bez zmian
    sw = st.swiat(); M175 = L.Mapa(175, raw=st.maps[175])
    lst = [(c["x"], c["y"], profil(86, k, c["x"], c["y"], 5, 2, 175), 0, -1) for k, c in enumerate(sw.krawedz(175, "S")) if c["b"] == 13 and c["wolna"]]
    reg = plan_zasloniecia(M175, lst, None)
    if reg and zaslon(st, 175, reg, 175): st.log("175: zasłonięte %d kratek południowej krawędzi (styk z 13: tylko wspinaczka)" % len(reg))
    for n in sorted(set(nier)): st.log("  NIEROZWIĄZANE: %s" % (n,))
    for q in sorted(set(POWOD)): st.log("  powód odmowy: mapa %d %s (%d,%d): %s" % q)
    # reguła zabudowy: skan wszystkich zasłoniętych kratek (poza nowymi mapami) względem ORYGINAŁU
    zle = []
    for (mid, x, y) in sorted(ZAMKN):
        if mid in NOWE: continue
        orig = origM(mid)
        if zabudowa(orig, x, y): zle.append((mid, x, y))
    st.log("SKAN ZABUDOWY: zasłonięto %d kratek, z tego na murze/dachu/bruku: %d%s" % (len(ZAMKN), len(zle), (" " + str(zle[:10])) if zle else ""))
    # zbieżność: ponowny przebieg na własnym wyniku nic nie zmienia
    sw = st.swiat(); zm2, nier2 = napraw(st, sw, nowe, seed=999)
    st.log("ZBIEŻNOŚĆ: ponowny przebieg na wyniku zmienił %d kratek (ma być 0), nierozwiązane: %d" % (zm2, len(nier2)))
    zapisz(st)
    st.log("zapisano staging: %d map (z nowymi)" % len(st.zmienione))
    open(os.path.join(STG, "raport_budowy.txt"), "w", encoding="utf-8").write("\n".join(st.raport))


if __name__ == "__main__":
    glowna()
