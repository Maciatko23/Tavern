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
# ---- tryby pracy: układ i maska są STAŁE (swiat_uklad.json, swiat_maska.png); liczy się od nowa tylko z --przelicz-uklad.
# --staging-b: mapy z tools/swiat/etap2/staging_b/data podmieniają obecne z data/ (sprawdzenie przed instalacją partii b).
# --zapisz: nadpisuje swiat.json (domyślnie tylko sprawdzamy, nic nie zapisujemy).
STAGING_B = "--staging-b" in sys.argv
STYKI = "--styki" in sys.argv         # tools/swiat/styki/staging: nowe mapy 960-964, układ bez 930/932/936 (swiat_styki.py)
STAGING_C = "--staging-c" in sys.argv     # etap 3: mapy z tools/swiat/etap3/staging/data (przed staging_b)
if STAGING_B or STAGING_C or STYKI:
    import tempfile
    os.environ["KRUK_TMP"] = tempfile.mkdtemp(prefix="kruk_stg_")   # swiezy cache wody
PRZELICZ = "--przelicz-uklad" in sys.argv
NZ = "--przelicz-niezainstalowane" in sys.argv   # liczy od nowa maskę i nowe mapy tylko poza mapami zainstalowanymi (Swiat_Data.js: maps)
ZAPISZ = "--zapisz" in sys.argv or PRZELICZ
UKLAD = os.path.join(ROOT, "tools", "swiat", "styki", "staging", "swiat_uklad.json") if STYKI else os.path.join(DOCS, "swiat_uklad.json")
MASKA_SWIATA = os.path.join(DOCS, "swiat_maska.png")
ZAMROZONY = (not PRZELICZ) and (not NZ) and os.path.exists(UKLAD)


def zainstalowane():
    """mapy etapów 1-2 zainstalowane w grze (klucze maps w js/plugins/Swiat_Data.js): ich położenie i brzeg w masce są nietykalne"""
    txt = open(os.path.join(ROOT, "js", "plugins", "Swiat_Data.js"), encoding="utf-8").read()
    mt = re.search(r"maps: (\{.*?\}),\s*links:", txt, re.S)
    return {int(k) for k in json.loads(mt.group(1))}


def plik_mapy(mid):
    ds = ([os.path.join(ROOT, "tools", "swiat", "styki", "staging", "data")] if STYKI else []) + ([os.path.join(ROOT, "tools", "swiat", "etap3", "staging", "data")] if STAGING_C else []) + ([os.path.join(ROOT, "tools", "swiat", "etap2", "staging_b", "data")] if STAGING_B else []) + [DATA]
    for d in ds:
        p = os.path.join(d, "Map%03d.json" % mid)
        if os.path.exists(p): return p
    return None
PLAYER = {1, 3, 4, 8, 13, 23, 24, 25, 26, 111}
# woda NA PEWNO morzem (twarda): mapy gracza i basen Przystani (zatoka od zachodu, zaplanowana). W pozostałych mapach decyduje maska świata, a woda mapy
# jest tylko wskazówką (rozmyta, zaokrąglona); mapa zostanie w etapach budowy przemalowana do maski
HARD = PLAYER | {125, 159, 155, 157, 162, 165}      # 155-165: z definicji nad morzem (klify, urwisko, zatoka, mielizna): ich morze zostaje, ląd świata się dopasowuje
# ląd tych map jest wskazówką lądu maski (Wrak: ląd z wrakiem i plażą łączy się cyplem z Garnizonem)
LAD_MAPY = set()      # (165 ma teraz twardą wodę: jej własny ląd i cypel do Garnizonu wynikają z mapy)
# cypel (mielizna z plażą) łączący ląd Wraku z Garnizonem: odcinki świata (x0, y0, x1, y1, połowa szerokości)
CYPLE = []      # pas lądu (cypel) od lądowej kreski mapy 165 do lądu 162: bez styku z wodą 162 (jej woda kończy się w y 66 lokalnie)
# mapa, której kształt lądu (poza wodą) jest nietykalny (gracz przyciął cypel, wzgórze z latarnią wystaje w morze)
LAD_NIETYKALNY = {159}
# lądowe wielokąty (świat): zasypują płaski brzeg biegnący wzdłuż dolnej krawędzi Łąki#3 w łagodne zbocze ku Garnizonowi
WIELOKATY_LADU = []
# przedłużenia pomostów, które mapa urywa na krawędzi (świat: x0, y1, x1, y1 -> prostokąt kratek [x0, x1) x [y0, y1)): pomost dochodzi do końca w morzu zatoki
POMOSTY_DLUZ = [(410, 382, 421, 385)]
# okna szerszego, falującego pasa lądu (świat: x0, y0, x1, y1): głowa (Orla Grań) i prawy koniec (Spalona zagroda); mapy etapu 1 poza nimi
OKNA_FALE = [(340, 0, 560, 130), (700, 150, 939, 400)]
# numery nowych map z poprzedniej wersji (etap 1 buduje na swiat.json): mapa o tym samym położeniu i rozmiarze zachowuje swój numer
NOWE_STALE = {910: [66, 145, 120, 80], 911: [284, 64, 120, 80], 912: [764, 148, 120, 60], 913: [380, 0, 120, 60], 914: [360, 434, 80, 80], 915: [184, 104, 100, 40], 916: [536, 84, 80, 40], 917: [298, 361, 120, 60], 918: [6, 185, 60, 40], 919: [136, 265, 60, 40], 920: [540, 434, 60, 40], 921: [796, 306, 60, 40], 922: [552, 394, 60, 40], 923: [624, 376, 60, 40]}
# przesunięcia map jeszcze niezainstalowanych (--przelicz-niezainstalowane): 165 Wrak o 60 w lewo, między nią a Garnizonem (162) powstaje mapa brzegowa
# (twarda woda obu map nie może schodzić się na jednej krawędzi: ląd 162 przy morzu 165)
POZYCJE = {165: (126, 260), 18: (26, 225)}      # 165: rzędy 20-21 jej wschodniej krawędzi na wysokości świata łachy 162 (y 280-281); 18 o 20 w lewo, żeby zrobić miejsce
ROZMIARY = {155: (96, 72)}                       # 155 bez dołożonego pasa (+42): jej południe obsługuje nowa mapa brzegowa
DODAJ_NOWE = [dict(id=950, x0=186, y0=218, szer=96, wys=42, nazwa="Zbocze pod Pustelnią", opis="zbocze i skraj lasu pod Pustelnią, ścieżka od Pustelni w dół do puszczy; od zachodu lądowe przejście do lewego skrzydła", rodzic=155)]
# nowe mapy jeszcze niezainstalowane, które --przelicz-niezainstalowane liczy od nowa (pozostałe zachowują położenie, rozmiar i numer)
REGENERUJ = {919, 940}
# wyjątek: łacha Garnizon/Wrak (162 <-> 165). Łacha to kafle morza w 162 (rzędy 20-21, x 0-11), które w odpływie są mokrym piaskiem; na wspólnej krawędzi rzędy 20-22
# (po stronie 162 woda, po stronie 165 piasek wraku) są zgodne z założenia: nie liczą się jako ucięcie. Klucz: (mapa, krawędź) -> indeksy kratek wzdłuż krawędzi.
WYJATKI_UCIETE = {(162, "W"): range(20, 23), (165, "E"): range(20, 23), (962, "W"): range(49, 55)}   # 962: cypel, brzeg maski dotyka krawedzi na 6 kratkach (kafle tam: woda, swiat_styki.py: donikad 0)
# okna wygładzania brzegu (świat): wschód Spalonej zagrody: zasyp wąskiej zatoczki i cienkiego cypla
OKNA_ZAOKR = [(752, 262, 900, 340, 8, 5), (700, 360, 939, 440, 3, 6), (150, 100, 270, 230, 3, 5)]
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
ROAD_CELE = {"Trakt zachodni": (162, r"miejsce: brzeg"), "Szlak latarni": (159, r"latarni"), "Droga ku Spalonej": (168, r"stodo"), "Droga pola dziadka": (20, r"drzwi chaty"),
             "Trakt portowy": (125, r"nabrzeze")}

ROADS = {
    "Trakt portowy (brama południowa miasta -> nabrzeże Przystani)": [(374, 286), (372, 296), (365, 303), (361, 306)],   # (2026-10-30) w Przystani x 24-26 zajmuje chata: brama S miasta na x 453-455 świata
    "Droga leśna (nabrzeże -> Leśna droga)": [(361, 306), (362, 340), (368, 372), (380, 392), (400, 404)],
    "Droga do dworu i do pola (brama wschodnia -> dwór -> Kruczy Jar -> Skraj lasu)": [(436, 206), (480, 206), (524, 207), (604, 205), (650, 208)],
    "Droga pola dziadka (Kruczy Jar -> Dom dziadka)": [(533, 215), (533, 252), (538, 258)],
    "Droga Kruczego Jaru (Łąka#1 -> Kruczy Jar)": [(553, 160), (553, 192), (553, 215)],
    "Droga polna (miasto -> Polna droga -> Osada)": [(436, 174), (480, 172), (490, 150), (490, 100)],
    "Droga ku Spalonej zagrodzie (Łąka#1 -> pola -> zagroda)": [(570, 170), (609, 168), (650, 172), (684, 176), (720, 185)],
    "Trakt zachodni (miasto -> most nad korytem -> Podgrodzie -> Garnizon -> Wrak)": [(350, 206), (339, 206), (326, 208), (300, 222), (238, 234), (190, 232), (160, 226), (143, 222)],
    "Szlak Pustelni (Góry -> Urwisko -> Pustelnia)": [(332, 99), (270, 110), (202, 120), (150, 130), (126, 130), (124, 148), (120, 156), (116, 162), (106, 164), (92, 166)],
    "Szlak latarni (Góry -> Osada -> Latarnia)": [(436, 72), (490, 90), (540, 92), (590, 100), (620, 110)],
    "Droga łąk (Skraj lasu -> Łąka#2)": [(644, 228), (644, 252), (642, 290)],
    "Szlak górski (północna brama miasta -> Góry -> Orla Grań)": [(365, 164), (368, 140), (376, 112), (385, 88), (386, 70), (382, 40), (379, 12)],   # (2026-10-30) brama N miasta na x 444-446 świata (pod x 469-471 stoi tawerna)
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
        d = json.load(open(plik_mapy(m), encoding="utf-8"))
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
    d = json.load(open(plik_mapy(mid), encoding="utf-8"))
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
                mp_ = L_.Mapa(mid, path=plik_mapy(mid))
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
        self.new = {}
        self.zamrozony = ZAMROZONY
        self.Z = None; self.Lold = None
        if ZAMROZONY or NZ:
            # układ STAŁY z swiat_uklad.json: rozmiar docelowy bezwzględny, wzrost = cel - obecny rozmiar (nigdy ujemny, nigdy podwójny)
            uk = json.load(open(UKLAD, encoding="utf-8"))["mapy"]
            for k, v in uk.items():
                m = int(k)
                self.rects[m] = [v["x0"], v["y0"], v["szer"], v["wys"]]
                if self.rects[m][0] < 0: self.rects[m][2] += self.rects[m][0]; self.rects[m][0] = 0      # (styki: mapa 964 sięga morzem na x < 0 świata; maska i rastry kończą się na x 0)
                if v.get("nowa"):
                    self.new[m] = dict(z=v.get("rodzic"), strona="-", nazwa=v["nazwa"], opis=v["opis"], reczna=bool(v.get("reczna")), zamrozona=True)
            if NZ:
                inst = zainstalowane()
                self.inst = inst
                for m in list(self.new):
                    if m in REGENERUJ and m not in inst: del self.new[m]; del self.rects[m]          # nowe mapy jeszcze nie zainstalowane liczymy od nowa
                for m_, (x_, y_) in POZYCJE.items():
                    if m_ not in inst and m_ in self.rects: self.rects[m_][0] = x_; self.rects[m_][1] = y_
                for m_, (w_, h_) in ROZMIARY.items():
                    if m_ not in inst and m_ in self.rects: self.rects[m_][2] = w_; self.rects[m_][3] = h_
                for e_ in DODAJ_NOWE:
                    self.rects[e_["id"]] = [e_["x0"], e_["y0"], e_["szer"], e_["wys"]]
                    self.new[e_["id"]] = dict(z=e_["rodzic"], strona="-", nazwa=e_["nazwa"], opis=e_["opis"], reczna=True, zamrozona=True)
                self.Lold = np.array(Image.open(MASKA_SWIATA).convert("L")) > 127
                self.Z = np.zeros((WH, WW), bool)
                for m in inst:
                    if m in self.rects: x_, y_, w_, h_ = self.rects[m]; self.Z[y_:y_ + h_, x_:x_ + w_] = True
            self.ostrzezenia = []
            for m in OUTDOOR:
                if m not in self.rects: raise SystemExit("BRAK mapy %d w swiat_uklad.json" % m)
                w, h = self.size[m]; r = self.rects[m]
                dw, dh = r[2] - w, r[3] - h
                if dw < 0 or dh < 0: self.ostrzezenia.append("mapa %d: obecny rozmiar %dx%d jest większy niż projektowy %dx%d (wzrost ujemny, pomijam)" % (m, w, h, r[2], r[3]))
                if dw > 0 or dh > 0: self.grow[m] = (max(0, dw), max(0, dh))
            for m in self.new:                              # nowa mapa, która już istnieje (data/ albo staging_b): rozmiar pliku ma się zgadzać z układem
                pp = plik_mapy(m)
                if pp:
                    j = json.load(open(pp, encoding="utf-8")); r = self.rects[m]
                    self.new[m]["istnieje"] = True
                    if (j["width"], j["height"]) != (r[2], r[3]): self.ostrzezenia.append("mapa %d: plik %dx%d, układ %dx%d" % (m, j["width"], j["height"], r[2], r[3]))
        else:
            for m, (x, y) in CORE.items():
                w, h = self.size[m]
                dw, dh = GROW.get(m, (0, 0))
                self.rects[m] = [x + OFF[0], y + OFF[1], w + dw, h + dh]
                if dw or dh: self.grow[m] = (dw, dh)
            for e in MANUAL:
                self.rects[e["id"]] = [e["x"] + OFF[0], e["y"] + OFF[1], e["w"], e["h"]]
                self.new[e["id"]] = dict(z=e["z"], strona="?", nazwa=e["nazwa"], opis=e["opis"], reczna=True)
        self.L_raven = self.wytnij_zatoke(ziemia_gladka())
        # woda w mapach staje się częścią morza świata (nie „wodą poza maską”): kratki wody nieprzechodniej każdej mapy + przedłużenie wody w ląd sąsiada
        # (6 kratek za krawędzią mapy), żeby woda nigdzie nie urywała się na krawędzi
        soft = np.zeros((WH, WW), bool); self.A = np.zeros((WH, WW), bool)
        self.Wm = np.zeros((WH, WW), bool); self.Wpier = np.zeros((WH, WW), bool); self.Wext = np.zeros((WH, WW), bool)
        for m in OUTDOOR:
            x, y, w_, h_ = self.rects[m]
            blk, pas = woda_blk(m)
            if m in POPRAWKI_WODY:
                blk = blk.copy(); (px0, py0, px1, py1) = POPRAWKI_WODY[m]; blk[py0:py1, px0:px1] = False
            oh, ow = blk.shape
            self.A[y:y + oh, x:x + ow] |= ~blk          # ląd obecnej mapy (woda nieprzechodnia po poprawkach nie jest lądem): nigdy nie pod morzem
            if not blk.any() and not pas.any(): continue
            one = np.zeros((WH, WW), bool); one[y:y + oh, x:x + ow] = blk
            self.Wpier[y:y + oh, x:x + ow] |= pas
            if m not in HARD:
                soft |= one
                continue
            self.Wm |= one
            # przedłużenie wody za krawędź mapy tylko wzdłuż normalnej (6 kratek), bez rozlewania na boki
            em = np.zeros((WH, WW), bool)
            for k in range(1, 9):
                if y - k >= 0: em[y - k, x:x + ow] |= blk[0, :]
                if y + oh - 1 + k < WH: em[y + oh - 1 + k, x:x + ow] |= blk[oh - 1, :]
                if x - k >= 0: em[y:y + oh, x - k] |= blk[:, 0]
                if x + ow - 1 + k < WW: em[y:y + oh, x + ow - 1 + k] |= blk[:, ow - 1]
            rm = np.zeros((WH, WW), bool); rm[y:y + h_, x:x + w_] = True
            em = gladka_bool(em | one, 2.4) & ~rm          # zaokrąglone przedłużenie (lejek), nie prostokąt
            self.Wext |= em
        ladh = np.zeros((WH, WW), bool)
        for m in LAD_MAPY:
            x, y, w_, h_ = self.rects[m]; ow_, oh_ = self.size[m]
            ladh[y:y + oh_, x:x + ow_] = ~woda_blk(m)[0]
        for (cx0, cy0, cx1, cy1, hw) in CYPLE:
            yy, xx = np.mgrid[0:WH, 0:WW]
            for t in np.linspace(0, 1, 40):
                ladh |= (yy - (cy0 + (cy1 - cy0) * t)) ** 2 + (xx - (cx0 + (cx1 - cx0) * t)) ** 2 <= hw * hw
        for poly in WIELOKATY_LADU:
            im_ = Image.new("L", (WW, WH), 0); ImageDraw.Draw(im_).polygon(poly, fill=255)
            ladh |= np.array(im_) > 0
        for (px0, py0, px1, py1) in POMOSTY_DLUZ: self.A[py0:py1, px0:px1] = True
        self.cypel = ladh.copy()
        self.Wsoft = soft
        sea_hint = gladka_bool(soft, 3.5); self.sea_hint = sea_hint
        self.L_raven = ((self.L_raven | ladh) & ~(self.Wm | self.Wext)) & ~(sea_hint & ~ladh)
        self.cele_drog()
        # treść i wybrzuszenia
        self.tresc = {m: [(i, n, x0 + self.rects[m][0], y0 + self.rects[m][1], x1 + self.rects[m][0], y1 + self.rects[m][1]) for (i, n, x0, y0, x1, y1) in tresc_mapy(m)] for m in OUTDOOR}
        P = np.zeros((WH, WW), bool)
        for m, lst in self.tresc.items():
            for (i, n, x0, y0, x1, y1) in lst:
                P[max(0, y0 - 2):y1 + 3, max(0, x0 - 2):x1 + 3] = True
        for m in LAD_NIETYKALNY:
            x, y, w_, h_ = self.rects[m]; ow_, oh_ = self.size[m]
            P[y:y + oh_, x:x + ow_] |= ~woda_blk(m)[0]
        P |= (self.cypel & ~self.Wm) if CYPLE else False
        P |= self.Wpier
        self.P = P
        sea0 = ~self.L_raven
        self.w_pasie = {m: [t for t in lst if sea0[t[3]:t[5] + 1, t[2]:t[4] + 1].any()] for m, lst in self.tresc.items()}   # treść, która wpada w morze surowej sylwetki
        if self.zamrozony:
            dP = dilate(P, 1); self.dP = dP
            self.L = np.array(Image.open(MASKA_SWIATA).convert("L")) > 127           # maska STAŁA (budowniczowie czytają ten sam plik)
            self.bulge = int((self.L & ~self.L_raven).sum())
            self.finish_masks()
            soft_ = np.array(Image.fromarray((self.L * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(1.6))).astype(float) / 255.0
            self.gy, self.gx = np.gradient(soft_)
            return
        extra = self.obwiednie()
        extra = self.mostki(extra | dilate(P, 2))
        dP = dilate(P, 1); self.dP = dP
        # morze zaczyna się dopiero za obecnymi mapami: ląd obecnych map + pas 10 kratek lądu na zewnątrz (zaokrąglony); woda mapy nie-gracza (zatoki) zostaje
        rng_ = np.random.RandomState(11)
        N = np.array(Image.fromarray((rng_.rand(WH // 26 + 3, WW // 26 + 3) * 255).astype("uint8")).resize((WW, WH), Image.BICUBIC).filter(ImageFilter.GaussianBlur(6))).astype(float)
        N = (N - N.min()) / (N.max() - N.min())
        ext = np.zeros((WH, WW), bool)
        for r_, th_ in ((8, 0.0), (12, 0.3), (16, 0.5), (20, 0.68), (25, 0.82)):      # pas lądu na zewnątrz map o falującej szerokości 8-25 kratek (nie prosta ramka)
            ext |= dilate(self.A, r_) & (N >= th_)
        # głowa wyspy i prawy koniec: szerszy, bardziej falujący pas lądu (cypelki, łagodne zatoczki, nierówne łuki)
        rng2 = np.random.RandomState(23)
        N2 = np.array(Image.fromarray((rng2.rand(WH // 17 + 3, WW // 17 + 3) * 255).astype("uint8")).resize((WW, WH), Image.BICUBIC).filter(ImageFilter.GaussianBlur(4))).astype(float)
        N2 = (N2 - N2.min()) / (N2.max() - N2.min())
        REG = np.zeros((WH, WW), np.uint8)
        for (rx0, ry0, rx1, ry1) in OKNA_FALE: REG[ry0:ry1, rx0:rx1] = 255
        REG = np.array(Image.fromarray(REG).filter(ImageFilter.GaussianBlur(14))).astype(float) / 255.0
        REG = np.clip(REG * 1.6, 0, 1)
        for r_, th_ in ((14, 0.15), (20, 0.35), (27, 0.52), (34, 0.66), (40, 0.78)):
            ext |= dilate(self.A, r_) & (N2 * REG >= th_ * 0.9) & (REG > 0.2)
        ext = gladka_bool(ext & ~(self.sea_hint & ~self.A), 3.2)
        L0 = self.L_raven | gladka_bool(dilate(extra, 2), 3.2) | ext
        self.L = self.skladaj(self.polacz_morza(self.skladaj(L0, dP), dP), dP)
        self.bulge = int((self.L & ~self.L_raven).sum())
        for _ in range(8):                  # brzeg nie może biec wzdłuż krawędzi mapy ani urywać wody na krawędzi
            L1, zmiana = self.popraw_krawedzie(self.L, dP)
            self.L = self.skladaj(L1, dP)
            if not zmiana: break
        self.twarda_poprawka(dP)
        self.finish_masks()
        soft = np.array(Image.fromarray((self.L * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(1.6))).astype(float) / 255.0
        self.gy, self.gx = np.gradient(soft)

    def skladaj(self, L0, dP):
        """wygładzenie maski, ale: woda mapy zawsze morze, jej przedłużenie w ląd sąsiada morze (poza treścią), treść i pomosty zawsze ląd"""
        forced_sea = self.Wm | (self.Wext & ~dP & ~self.A) | (self.basen & ~dilate(self.A, 5))
        L = (L0 & ~forced_sea) | (dP & ~self.Wm) | self.Wpier | self.A
        L2 = gladka_bool(L, 1.3)
        res = (L2 & ~forced_sea) | (dP & ~self.Wm) | self.Wpier | self.A
        return np.where(self.Z, self.Lold, res) if self.Z is not None else res

    def stale_numery(self):
        """numery nowych map: ten sam prostokąt co w poprzedniej wersji = ten sam numer; pozostałe dostają nowe numery od 930"""
        odw = {tuple(r): m for m, r in NOWE_STALE.items()}
        stare = [m for m in self.new if m >= 910]
        mapa = {}
        for m in stare:
            k = tuple(int(v) for v in self.rects[m])
            if k in odw: mapa[m] = odw[k]
        nid = 930
        for m in stare:
            if m not in mapa:
                mapa[m] = nid; nid += 1
        rects = {m: r for m, r in self.rects.items() if m not in stare}
        new = {m: v for m, v in self.new.items() if m not in stare}
        for m in stare:
            rects[mapa[m]] = self.rects[m]; new[mapa[m]] = self.new[m]
        for v in new.values():
            if v.get('z') in mapa: v['z'] = mapa[v['z']]
        self.rects = rects; self.new = new

    def usun_wysepki(self, minn=900):
        """małe wysepki lądu bez ląd-mapy i bez treści (resztki wygładzania) znikają"""
        L = self.L; H, W = L.shape; seen = np.zeros_like(L)
        for y0 in range(H):
            for x0 in range(W):
                if L[y0, x0] and not seen[y0, x0]:
                    st = [(x0, y0)]; seen[y0, x0] = True; c = []
                    while st:
                        x, y = st.pop(); c.append((x, y))
                        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                            u, v = x + dx, y + dy
                            if 0 <= u < W and 0 <= v < H and L[v, u] and not seen[v, u]: seen[v, u] = True; st.append((u, v))
                    if len(c) < minn:
                        ys = np.array([q[1] for q in c]); xs = np.array([q[0] for q in c])
                        if not (self.A[ys, xs].any() or self.dP[ys, xs].any() or self.Wpier[ys, xs].any()): L[ys, xs] = False
        self.przypnij()

    def zaokraglij_okna(self):
        """w oknach (świat: x0, y0, x1, y1) zasypuje wąskie zatoczki (zamknięcie) i ścina cienkie cyple (otwarcie); treść i woda twarda bez zmian"""
        for (x0, y0, x1, y1, rc, ro) in OKNA_ZAOKR:
            n = erode(dilate(self.L, rc), rc)
            n = dilate(erode(n, ro), ro)
            n = ((n | self.dP | self.A) & ~self.Wm) | self.Wpier
            self.L[y0:y1, x0:x1] = n[y0:y1, x0:x1]
        # zamknięte oczka morza (poza twardą wodą) znikają
        H, W = self.L.shape
        sea = ~self.L; seen = np.zeros_like(sea); st = [(0, 0)]; seen[0, 0] = True
        while st:
            x, y = st.pop()
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                u, v = x + dx, y + dy
                if 0 <= u < W and 0 <= v < H and sea[v, u] and not seen[v, u]: seen[v, u] = True; st.append((u, v))
        for (x0, y0, x1, y1, rc, ro) in OKNA_ZAOKR:
            w_ = sea & ~seen & ~self.Wm
            self.L[y0:y1, x0:x1] |= w_[y0:y1, x0:x1]

    def pary_krawedzi(self):
        """(maska w środku, maska za krawędzią, kratki świata za krawędzią) dla każdej krawędzi każdej mapy"""
        for m, (x, y, w, h) in self.rects.items():
            yield m, "N", (y, x, 0, 1, w), (y - 1, x, 0, 1, w)
            yield m, "S", (y + h - 1, x, 0, 1, w), (y + h, x, 0, 1, w)
            yield m, "W", (y, x, 1, 0, h), (y, x - 1, 1, 0, h)
            yield m, "E", (y, x + w - 1, 1, 0, h), (y, x + w, 1, 0, h)

    def popraw_krawedzie(self, L, dP):
        """tam, gdzie na krawędzi mapy ląd graniczy z morzem (brzeg wzdłuż krawędzi) przesuwa brzeg: ląd dochodzi za krawędź albo morze wchodzi w ląd sąsiada"""
        add_land = np.zeros((WH, WW), bool); add_sea = np.zeros((WH, WW), bool)
        for m, side, a, b in self.pary_krawedzi():
            (y0, x0, dy, dx, n) = a; (y1, x1, _, _, _) = b
            idx = [(y0 + dy * i, x0 + dx * i, y1 + dy * i, x1 + dx * i) for i in range(n)]
            ri = [(i, L[iy, ix], L[oy, ox]) for i, (iy, ix, oy, ox) in enumerate(idx)]
            i = 0
            while i < n:
                if ri[i][1] != ri[i][2]:
                    j = i
                    while j < n and ri[j][1] != ri[j][2]: j += 1
                    if j - i >= 3:
                        for k in range(i, j):
                            iy, ix, oy, ox = idx[k]
                            if L[iy, ix] and not L[oy, ox]:
                                if (self.Wm[oy, ox] or (self.Wext[oy, ox] and not dP[oy, ox])) and not dP[iy, ix]:
                                    add_sea[max(0, iy - 4):iy + 5, max(0, ix - 4):ix + 5] = True      # za krawędzią woda sąsiada: brzeg cofa się w tej mapie
                                else: add_land[max(0, oy - 4):oy + 5, max(0, ox - 4):ox + 5] = True
                            elif not L[iy, ix] and L[oy, ox]: add_sea[max(0, oy - 4):oy + 5, max(0, ox - 4):ox + 5] = True
                    i = j
                else: i += 1
        zmiana = bool(add_land.any() or add_sea.any())
        L1 = (L | (add_land & ~self.Wm & ~(self.Wext & ~dP))) & ~(add_sea & ~dP & ~self.Wpier & ~self.A)
        return L1, zmiana

    def polacz_morza(self, L, dP):
        """Woda mapy, która nie łączy się z morzem świata (prostokątne kałuże i zatoczki zamknięte lądem sąsiada), dostaje lejkowaty kanał do morza:
        przesmyk poszerzający się ku morzu (promień 4 -> 10 kratek), omijający treść. Małe oczka wody wewnątrz mapy (staw) zostają, najmniejsze znikają."""
        import heapq
        H, W = L.shape
        sea = ~L
        lab = np.zeros((H, W), np.int32); n = 0; sizes_ = {}
        comps = {}
        for y0 in range(H):
            for x0 in range(W):
                if sea[y0, x0] and not lab[y0, x0]:
                    n += 1; lab[y0, x0] = n; st = [(x0, y0)]; cells = []
                    while st:
                        x, y = st.pop(); cells.append((x, y))
                        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                            u, v = x + dx, y + dy
                            if 0 <= u < W and 0 <= v < H and sea[v, u] and not lab[v, u]: lab[v, u] = n; st.append((u, v))
                    comps[n] = cells
        main = lab[0, 0]
        edge = np.zeros((H, W), bool)
        for m, (x, y, w, h) in self.rects.items():
            edge[y, x:x + w] = True; edge[y + h - 1, x:x + w] = True; edge[y:y + h, x] = True; edge[y:y + h, x + w - 1] = True
        out = L.copy()
        for k, cells in comps.items():
            if k == main: continue
            xs = np.array([c[0] for c in cells]); ys = np.array([c[1] for c in cells])
            touches = bool(edge[ys, xs].any())
            if not self.Wm[ys, xs].any():
                out[ys, xs] = True; continue            # woda z mapy nie-gracza bez połączenia z morzem (staw, szczelina) znika: ląd
            if not touches and len(cells) < 400: continue            # staw w środku mapy
            # Dijkstra od oczka do morza głównego, omijając treść
            dist = {}; prev = {}
            hp = []
            for (x, y) in cells: dist[(x, y)] = 0; heapq.heappush(hp, (0, x, y))
            goal = None
            while hp:
                d, x, y = heapq.heappop(hp)
                if d > dist.get((x, y), 1e18): continue
                if lab[y, x] == main: goal = (x, y); break
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
                    u, v = x + dx, y + dy
                    if not (0 <= u < W and 0 <= v < H): continue
                    c = (1.4 if dx and dy else 1.0) * (60.0 if dP[v, u] else 1.0)
                    nd = d + c
                    if nd < dist.get((u, v), 1e18): dist[(u, v)] = nd; prev[(u, v)] = (x, y); heapq.heappush(hp, (nd, u, v))
            if goal is None: continue
            path = [goal]
            while path[-1] in prev: path.append(prev[path[-1]])
            path.reverse()
            tot = max(1, len(path) - 1)
            yy, xx = np.mgrid[0:H, 0:W]
            for i, (x, y) in enumerate(path):
                r = 4.0 + 6.0 * (i / tot)
                y0, y1, x0, x1 = max(0, int(y - r) - 1), min(H, int(y + r) + 2), max(0, int(x - r) - 1), min(W, int(x + r) + 2)
                disc = (yy[y0:y1, x0:x1] - y) ** 2 + (xx[y0:y1, x0:x1] - x) ** 2 <= r * r
                out[y0:y1, x0:x1] &= ~(disc & ~dP[y0:y1, x0:x1] & ~self.Wpier[y0:y1, x0:x1] & ~self.A[y0:y1, x0:x1])
        return np.where(self.Z, self.Lold, out) if self.Z is not None else out

    def twarda_poprawka(self, dP):
        """ostatnie, drobne rozbieżności na krawędziach (kilka kratek): kratki za krawędzią przyjmują stan kratek przy krawędzi (głębokość 4, malejąco),
        z wyjątkiem wody mapy, jej przedłużenia i treści"""
        forced_sea = self.Wm | (self.Wext & ~dP & ~self.A) | (self.basen & ~dilate(self.A, 5))
        for _ in range(3):
            zm = False
            for m, side, a, b in self.pary_krawedzi():
                (y0, x0, dy, dx, n) = a; (y1, x1, _, _, _) = b
                nrm = {"N": (-1, 0), "S": (1, 0), "W": (0, -1), "E": (0, 1)}[side]
                for i in range(n):
                    iy, ix, oy, ox = y0 + dy * i, x0 + dx * i, y1 + dy * i, x1 + dx * i
                    if self.L[iy, ix] != self.L[oy, ox] and not forced_sea[oy, ox] and not (dP[oy, ox] and not self.L[iy, ix]):
                        # sprawdź, czy to odcinek >= 3 (brzeg wzdłuż krawędzi)
                        run = 0
                        for k in (-2, -1, 1, 2):
                            jy, jx = iy + dy * k, ix + dx * k; qy, qx = oy + dy * k, ox + dx * k
                            if 0 <= jy < WH and 0 <= jx < WW and 0 <= qy < WH and 0 <= qx < WW and self.L[jy, jx] != self.L[qy, qx]: run += 1
                        if run >= 2:
                            for d_ in range(0, 4):
                                qy, qx = oy + nrm[0] * d_, ox + nrm[1] * d_
                                if 0 <= qy < WH and 0 <= qx < WW and not forced_sea[qy, qx] and not (dP[qy, qx] and not self.L[iy, ix]) and not (self.A[qy, qx] and not self.L[iy, ix]):
                                    self.L[qy, qx] = self.L[iy, ix]; zm = True
            if not zm: break
        self.przypnij()

    def przypnij(self):
        """mapy zainstalowane: ich kratki maski zostają co do kratki"""
        if self.Z is not None: self.L[self.Z] = self.Lold[self.Z]

    def ucięte(self):
        """UCIĘTE KRAWĘDZIE: (a) woda mapy, której za krawędzią jest ląd; (b) brzeg biegnący wzdłuż krawędzi (ląd po jednej, morze po drugiej stronie, >= 3 kratki);
        (c) ląd na krawędzi mapy, za którą nie ma żadnej mapy (a jest morze). Lista odcinków (mapa, strona, rodzaj, kratki)"""
        O = np.full((WH, WW), -1, np.int16)
        for m, (x, y, w, h) in self.rects.items(): O[y:y + h, x:x + w] = m
        out = []
        for m, side, a, b in self.pary_krawedzi():
            (y0, x0, dy, dx, n) = a; (y1, x1, _, _, _) = b
            runs = {"a": [], "b": [], "c": []}
            kind = []
            for i in range(n):
                iy, ix, oy, ox = y0 + dy * i, x0 + dx * i, y1 + dy * i, x1 + dx * i
                li, lo = self.L[iy, ix], self.L[oy, ox]
                k = None
                if i in WYJATKI_UCIETE.get((m, side), ()): kind.append(None); continue
                if self.Wm[iy, ix] and lo: k = "a"
                elif li != lo: k = "b"
                elif li and O[oy, ox] < 0: k = "c"      # ląd na krawędzi, za którą nie ma mapy: morze ALBO ląd maski bez mapy (dziura) - oba to błąd
                kind.append(k)
            i = 0
            while i < n:
                if kind[i]:
                    j = i
                    while j < n and kind[j] == kind[i]: j += 1
                    if j - i >= 3 or kind[i] == "a": out.append(dict(mapa=m, strona=side, rodzaj=kind[i], od=i, do=j, kratek=j - i, swiat_od=(x0 + dx * i, y0 + dy * i)))
                    i = j
                else: i += 1
        return out

    def cele_drog(self):
        """koniec każdej drogi z ROAD_CELE ustawiany na zdarzenie docelowe (kratki maski): droga kończy się przy celu, nie w morzu"""
        for key, (mid, rx) in ROAD_CELE.items():
            d = json.load(open(plik_mapy(mid), encoding="utf-8"))
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
        mp = L_.Mapa(125, path=plik_mapy(125))
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
        sizes_ = [(120, 80), (100, 80), (80, 80), (120, 60), (100, 60), (80, 60), (60, 60), (100, 40), (80, 40), (60, 40)]
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
                            if NZ and not (nx + nw <= 420 and ny + nh <= 420): continue          # nowe mapy tylko w lewym skrzydle i głowie
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
    d = json.load(open(plik_mapy(mid), encoding="utf-8"))
    w, h = d["width"], d["height"]
    a = np.array(d["data"]).reshape(-1, h, w)
    wm = np.zeros((h, w), bool)
    for z in (0, 1):
        wm |= (a[z] >= 2048) & (a[z] < 2816)
    return wm


# woda mapy zasypana na styku z mapą gracza z treścią (mapa: (x0, y0, x1, y1) lokalnie): narożnik NW basenu Przystani przy południowej krawędzi miasta
POPRAWKI_WODY = {125: (0, 0, 14, 10), 155: (95, 3, 96, 4)}      # 155: 1 kratka wody na styku z 157 (157 ma tam ląd) -> piasek
_WODA_CACHE = {}


def woda_blk(mid):
    """(woda nieprzechodnia, woda przechodnia): woda nieprzechodnia to morze świata, pomosty i brody (woda przechodnia) zostają lądem"""
    if mid in _WODA_CACHE: return _WODA_CACHE[mid]
    st_ = os.stat(plik_mapy(mid))
    cache = os.path.join(os.environ.get("KRUK_TMP", os.environ.get("TEMP", ".")), "woda_blk_%d_%d_%d.npz" % (mid, st_.st_mtime_ns // 1000, st_.st_size))
    wm = woda_mapy(mid)
    if not wm.any():
        r = (wm, wm.copy())
    elif os.path.exists(cache):
        z = np.load(cache); r = (z["a"], z["b"])
    else:
        import mapylib as L_
        mp = L_.Mapa(mid, path=plik_mapy(mid))
        blk = np.zeros_like(wm); pas = np.zeros_like(wm)
        for yy, xx in zip(*np.where(wm)):
            if mp.check_passage(int(xx), int(yy), 0x0f): pas[yy, xx] = True
            else: blk[yy, xx] = True
        np.savez(cache, a=blk, b=pas); r = (blk, pas)
    _WODA_CACHE[mid] = r
    return r


def policz_niezgodnosc(sw):
    out = {}
    for m in OUTDOOR:
        x, y, w, h = sw.rects[m]
        ow, oh = sw.size[m]
        wm = woda_mapy(m)
        L = sw.L[y:y + oh, x:x + ow]
        morze = (~L) & (~wm)
        ladu = L & woda_blk(m)[0]
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


def uruchom_nz(verbose=True):
    """liczy od nowa maskę i nowe mapy poza mapami zainstalowanymi; kratki maski w mapach zainstalowanych i wszystko na wschód od x 600 zostają jak były"""
    sw = Swiat()
    stare_nowe = {m: [int(v) for v in uk_] for m, uk_ in ((int(k), [v["x0"], v["y0"], v["szer"], v["wys"]]) for k, v in json.load(open(UKLAD, encoding="utf-8"))["mapy"].items() if v.get("nowa"))}
    sw.finish_masks()
    for mz in (60, 40, 25):
        sw.dopelnij(minz=mz, id0=1000)
        sw.finish_masks()
    sw.L = sw.skladaj(sw.polacz_morza(sw.L, sw.dP), sw.dP)
    sw.zaokraglij_okna()
    sw.usun_wysepki()
    for _ in range(6):
        L1, zmiana = sw.popraw_krawedzie(sw.L, sw.dP)
        sw.L = sw.skladaj(L1, sw.dP)
        sw.twarda_poprawka(sw.dP)
        if not zmiana: break
    yy, xx = np.mgrid[0:WH, 0:WW]
    Rok = (xx < 420) & ~sw.Z
    sw.L = np.where(Rok, sw.L, sw.Lold)
    sw.finish_masks()
    # numery nowych map: ten sam prostokąt co w poprzednim układzie = ten sam numer; pozostałe dostają numery od max+1
    odw = {tuple(r): m for m, r in stare_nowe.items()}
    nid = max(list(stare_nowe) + [k for k in sw.rects if k < 1000] + [939]) + 1
    mapa = {}
    for m in sorted(k for k in sw.new if k >= 1000):
        k = tuple(int(v) for v in sw.rects[m])
        if k in odw and odw[k] not in sw.rects: mapa[m] = odw[k]
        else: mapa[m] = nid; nid += 1
    rects = {m: r for m, r in sw.rects.items() if m < 1000}; new = {m: v for m, v in sw.new.items() if m < 1000}
    for m, n in mapa.items():
        rects[n] = sw.rects[m]; new[n] = sw.new[m]
    for v in new.values():
        if v.get("z") in mapa: v["z"] = mapa[v["z"]]
    sw.rects = rects; sw.new = new
    nazwij_nowe(sw)
    if verbose: print("przeliczono niezainstalowane: map %d, nowych %d" % (len(sw.rects), len(sw.new)))
    return sw


def uruchom(verbose=True):
    if NZ: return uruchom_nz(verbose)
    sw = Swiat()
    if sw.zamrozony:
        if verbose:
            cov = sw.occ() >= 0
            print("układ STAŁY (swiat_uklad.json): %d map, w tym nowych %d; maska stała (swiat_maska.png); pokrycie linii brzegu: %.2f%%%s" % (len(sw.rects), len(sw.new), float((sw.coast & cov).sum() / sw.coast.sum()) * 100, " [staging_b]" if STAGING_B else ""))
            for o in sw.ostrzezenia: print("UWAGA:", o)
        nazwij_nowe(sw)
        return sw
    cov0 = (sw.occ() >= 0)
    sw.rozszerz()
    for mz in (60, 40, 25):
        sw.dopelnij(minz=mz)
    sw.L = sw.skladaj(sw.polacz_morza(sw.L, sw.dP), sw.dP)
    sw.zaokraglij_okna()
    sw.usun_wysepki()
    sw.stale_numery()
    for _ in range(4):                      # po powiększeniach i nowych mapach: brzeg nie biegnie wzdłuż żadnej krawędzi
        L1, zmiana = sw.popraw_krawedzie(sw.L, sw.dP)
        sw.L = sw.skladaj(L1, sw.dP)
        sw.twarda_poprawka(sw.dP)
        if not zmiana: break
    sw.finish_masks()
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
        if info.get("zamrozona"):
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
        if sd is None:   # wyjscie nie lezy na krawedzi mapy (np. zdarzenie w srodku po rozszerzeniu): BLAD, nie wywracaj skryptu
            out.append(dict(od=a, strona=None, do=b, wyjscie=list(c), ladowanie=list(l), wynik="BLAD: wyjscie nie lezy na krawedzi mapy", kod="blad")); continue
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
    if ZAPISZ:
        json.dump(J, open(os.path.join(DOCS, "swiat.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1, default=lambda o: o.item() if hasattr(o, "item") else str(o))
        if not sw.zamrozony: Image.fromarray((sw.L * 255).astype("uint8")).save(MASKA_SWIATA)
    if (PRZELICZ or NZ) and ZAPISZ:
        uk = {}
        for m in sorted(sw.rects):
            x, y, w, h = sw.rects[m]; v = dict(x0=int(x), y0=int(y), szer=int(w), wys=int(h))
            if m in sw.new: v.update(nowa=True, nazwa=sw.new[m]["nazwa"], opis=sw.new[m]["opis"], rodzic=sw.new[m].get("z"), reczna=bool(sw.new[m].get("reczna")))
            uk[str(m)] = v
        json.dump(dict(opis="STAŁY układ map świata (przeliczony z --przelicz-uklad).", mapy=uk), open(UKLAD, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
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
