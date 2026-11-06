# -*- coding: utf-8 -*-
"""POPRAWA KRAWĘDZI ŚWIATA (gracz 2026-10-31): „gęste liście na trawę”, ładne zakończenia, widoczne zapory. Nic nie pisze do data/ ani js/:
buduje kopie map w tools/krawedzie_poprawa/staging/data/ (punkt wyjścia: zainstalowane data/). Powtarzalne: drugi przebieg na wyniku = 0 zmian
(python tools/krawedzie_poprawa/zbuduj.py --powtorz).
Przebiegi (kolejno):
  1. LIŚCIE: zestaw 11: A2 rodzaj 20 (gęste liście blokują) znika ze WSZYSTKICH map (warstwa 1), pod spodem zostaje grunt mapy; zestaw 9: rodzaj 20 nie
     blokuje, znikają tylko pasy/plamy przy krawędzi (składowa cienka: głębokość <= 7, albo kratki dodane dziś w pasie 6 kratek). Pod liśćmi bywa
     A4 118/119 (ściana liści): zamieniana na trawę sąsiedztwa, kształty autokafli w pierścieniu +1 liczy editor-owy floor_shape.
  2+. (patrz niżej: analiza osiągalności, zapory, końce murów, drzewa z kafli.)
  python tools/krawedzie_poprawa/zbuduj.py [--powtorz]"""
import os, sys, json, copy, glob
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
import numpy as np
import lib
L = lib.L
import popraw, wspolne as WS
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

STG = os.path.join(HERE, "staging"); SDATA = os.path.join(STG, "data")
POWTORZ = "--powtorz" in sys.argv
LISC = 20                        # A2: gęste liście
SCIANA_LISCI = (118, 119)        # A4: ściana z liści (pod pasami liści w zestawie 9)
GLEB = 6                         # pas przy krawędzi (kratki)
CIENKA = 7                       # składowa liści z głębokością <= 7 to pas/plama przy krawędzi


def zrodlo(mid):
    p = os.path.join(SDATA, "Map%03d.json" % mid)
    if not (POWTORZ and os.path.exists(p)): p = os.path.join(ROOT, "data", "Map%03d.json" % mid)
    return json.loads(open(p, "rb").read().decode("utf-8"))


def kafel(raw, z, x, y): return raw["data"][(z * raw["height"] + y) * raw["width"] + x]
def ustaw(raw, z, x, y, v): raw["data"][(z * raw["height"] + y) * raw["width"] + x] = v
def rodzaj(t): return (t - 2048) // 48 if t >= 2048 else None


def maska_lisci(raw):
    W, H = raw["width"], raw["height"]
    a = np.zeros((H, W), bool)
    for y in range(H):
        for x in range(W):
            if rodzaj(kafel(raw, 1, x, y)) == LISC: a[y, x] = True
    return a


def trawa_obok(raw, x, y, wyjete):
    """rodzaj trawy: najczęstszy rodzaj A2 16/27 wśród sąsiadów (r=2) na warstwie 0, nie z wyjętych; domyślnie 16"""
    import collections
    c = collections.Counter(); W, H = raw["width"], raw["height"]
    for dy in range(-2, 3):
        for dx in range(-2, 3):
            u, v = x + dx, y + dy
            if (u, v) in wyjete or not (0 <= u < W and 0 <= v < H): continue
            k = rodzaj(kafel(raw, 0, u, v))
            if k in (16, 27): c[k] += 1
    return c.most_common(1)[0][0] if c else 16


def pas_lisci(raw, tsid, mid):
    """zbiór kratek liści do usunięcia"""
    W, H = raw["width"], raw["height"]; a = maska_lisci(raw)
    if not a.any(): return set()
    if tsid != 9: return {(x, y) for y in range(H) for x in range(W) if a[y, x]}
    out = set()
    for c in lib.skladowe(a):
        if max(lib.gleb(W, H, x, y) for x, y in c) <= CIENKA: out |= set(c)
        # (gruba składowa, czyli prawdziwy las w głębi: zostaje cała; przycinanie jej przy krawędzi dawałoby ucięcie prostą linią i erozję przy powtórce)
    return out


def usun_lisc(raw, kratki):
    """liście z warstwy 1; pod spodem ściana liści A4 118/119 -> trawa sąsiedztwa; kształty w pierścieniu +1"""
    zmienione = set()
    W, H = raw["width"], raw["height"]
    if raw["tilesetId"] == 11:      # ściana liści A4 118/119 na warstwie 0 (w zestawie 11 blokuje) też znika, także bez liści nad nią
        for y in range(H):
            for x in range(W):
                if rodzaj(kafel(raw, 0, x, y)) in SCIANA_LISCI and (x, y) not in kratki: kratki = set(kratki) | {(x, y)}
    for (x, y) in kratki:
        ustaw(raw, 1, x, y, 0)
        k0 = rodzaj(kafel(raw, 0, x, y))
        if k0 in SCIANA_LISCI:
            ustaw(raw, 0, x, y, 2048 + trawa_obok(raw, x, y, kratki) * 48)
            zmienione.add((x, y))
    if zmienione: WS.reshape(raw, 0, WS.ring(zmienione))
    return len(kratki)


# ------------------------------------------------------------------ zapory (widoczne, naturalne): zdarzenia ozdobne jak „Drzewo (ozdobne)” w miasteczku
OBRAZY = {}      # characterName -> image z istniejącego zdarzenia przyrody (ten sam wzór/kierunek co w grze)
BLOKADA_FABULY = {175: {13, 934, 120, 962}, 935: {962}, 962: {935, 175}, 165: {162}, 934: {175}}   # mapa -> sąsiedzi, do których MA być zamknięte (widocznie)


def zbierz_obrazy():
    for mid in (125, 8, 3, 111, 13, 168, 24, 162, 175, 950, 910):
        for e in zrodlo(mid)["events"]:
            if e and e["pages"] and e["pages"][0].get("image") and e["pages"][0]["image"].get("characterName"):
                n = e["pages"][0]["image"]["characterName"]
                if n.startswith("!$") and n not in OBRAZY and e["pages"][0]["priorityType"] == 1: OBRAZY[n] = dict(e["pages"][0]["image"])
    OBRAZY["!$Big_Trees_green"] = {"tileId": 0, "characterName": "!$Big_Trees_green", "direction": 4, "pattern": 2, "characterIndex": 0}


# kępy: grupy wyglądu zapór (jedna kępa = 1-4 sąsiednie kratki tej samej grupy; różne grupy na zmianę, żeby nie było równego rzędu sosen)
GRUPY = {"las": [("Sosna (ozdobna)", "!$Pine_A"), ("Sosna (ozdobna)", "!$Pine_B"), ("Sosna (ozdobna)", "!$Pine_C"), ("Drzewo (ozdobne)", "!$Tree_Small"),
                 ("Drzewo (ozdobne)", "!$Big_Trees_green")],
         "skaly": [("Kamień (ozdobny)", "!$Rock_Mossy"), ("Kamień (ozdobny)", "!$Rock_Flat"), ("Kamień (ozdobny)", "!$Rock_Cracked"), ("Skała (ozdobna)", "!$Boulder_A"),
                   ("Kamień (ozdobny)", "!$Rock_Jagged"), ("Kamień (ozdobny)", "!$Rock_Mound")],
         "krzaki": [("Krzak (ozdobny)", "!$Bush_Bare_A"), ("Krzak (ozdobny)", "!$Bush_Bare_Wide"), ("Krzak (ozdobny)", "!$Bush_Bare_Tall"), ("Martwe drzewo (ozdobne)", "!$Trunk_Dead")]}
NIE_RUSZAJ = ("Palisad", "Latarn", "Blokad", "Bramk", "Brama", "ogrodzie Lorda", "Wrak", "Kadłub", "Rybak", "Łódź")


def nowe_id(raw):
    zajete = {e["id"] for e in raw["events"] if e}
    i = 1
    while i in zajete: i += 1
    return i


def dodaj_zapore(raw, mid, x, y, grupa=None):
    """widoczne zdarzenie ozdobne na kratce (x, y); wariant z hasha kratki. Zwraca False, gdy na kratce jest już jakiekolwiek zdarzenie"""
    for e in raw["events"]:
        if e and (e["x"], e["y"]) == (x, y):       # (niewidzialne zdarzenie bez obrazka i bez przejścia, np. równoległe „pora dnia”, nie przeszkadza)
            if any(not (pg["image"]["characterName"] == "" and pg["image"]["tileId"] == 0) or any(c["code"] == 201 for c in pg["list"]) for pg in e["pages"]): return False
    h = (mid * 73856093) ^ (x * 19349663) ^ (y * 83492791)
    lst = [q for q in GRUPY[grupa or "las"] if q[1] in OBRAZY] or GRUPY["las"]
    nazwa, gr = lst[(h >> 3) % len(lst)]
    tmpl = None
    for e in raw["events"]:
        if e and e["name"] == "Drzewo (ozdobne)": tmpl = e; break
    pg = copy.deepcopy(tmpl["pages"][0]) if tmpl else json.loads(open(os.path.join(HERE, "szablon_zdarzenia.json"), encoding="utf-8").read())
    pg["image"] = dict(OBRAZY[gr]); pg["priorityType"] = 1; pg["through"] = False; pg["trigger"] = 0
    pg["directionFix"] = True; pg["stepAnime"] = False; pg["walkAnime"] = False; pg["list"] = [{"code": 0, "indent": 0, "parameters": []}]
    ev = {"id": nowe_id(raw), "name": nazwa, "note": "<Zapora:krawedz>", "pages": [pg], "x": x, "y": y}
    while len(raw["events"]) <= ev["id"]: raw["events"].append(None)
    raw["events"][ev["id"]] = ev
    return True


_STARE = {}
# fragmenty baszt/murów skopiowane przy krawędzi bez zakończenia: (x0, y0, x1, y1) wraca do stanu sprzed dzisiejszych zmian (obejrzane: docs/krawedzie_poprawa/estetyka_b/d_*.png)
ODCINKI = {}
TRAWA_ODCINKI = {22: [(0, 57, 1, 59)]}      # Map022: druga baszta przy SW rogu urwana na krawędzi S (pierwsza, y 44-53, ma oba zakończenia)


def stary_raw(mid):
    """mapa sprzed dzisiejszych zmian świata (commit 8d297f0); None, gdy mapy wtedy nie było"""
    if mid not in _STARE:
        import subprocess
        r = subprocess.run(["git", "show", "8d297f0:data/Map%03d.json" % mid], capture_output=True, cwd=ROOT)
        _STARE[mid] = json.loads(r.stdout.decode("utf-8")) if r.returncode == 0 else None
    return _STARE[mid]


def porzadek(raws):
    """(pkt 2 gracza) pojedyncze kratki i paski jednej kratki gruntu zostawione przez szwy: wracają do gruntu otoczenia (tylko tam, gdzie kratka różni się od
    stanu sprzed dzisiejszych zmian); plamy gruntu ucięte prostą linią przy dzisiejszych zmianach: spójny obszar zmienionego gruntu wraca do stanu sprzed zmian.
    Zwraca {mapa: (poprawionych pojedynczych, cofniętych kratek)}"""
    import estetyka as E
    wyn = {}
    for mid, raw in raws.items():
        old = stary_raw(mid)
        W, H = raw["width"], raw["height"]
        nowa = old is None or (old["width"], old["height"]) != (W, H)       # mapa zbudowana dziś (900-964): cała „nasza”, brak stanu do cofnięcia
        nas = (lambda x, y: True) if nowa else (lambda x, y: any(old["data"][z * W * H + y * W + x] != raw["data"][z * W * H + y * W + x] for z in (0, 1)))
        K = np.full((H, W), -1, np.int32)
        for y in range(H):
            for x in range(W):
                k = rodzaj(kafel(raw, 0, x, y))
                if k in E.NATURA: K[y, x] = k
        zm = set(); n1 = 0
        for k in sorted(E.NATURA):
            for c in lib.skladowe(K == k, osiem=False):
                xs = [q[0] for q in c]; ys = [q[1] for q in c]
                if not (len(c) == 1 or (min(max(xs) - min(xs), max(ys) - min(ys)) == 0 and 2 <= len(c) <= 12)): continue
                cs = set(c); pier = {(x + dx, y + dy) for x, y in c for dx in (-1, 0, 1) for dy in (-1, 0, 1)} - cs
                pier = {q for q in pier if 0 <= q[0] < W and 0 <= q[1] < H}
                inne = {int(K[v, u]) for u, v in pier if K[v, u] >= 0}
                if len(inne) != 1 or sum(1 for u, v in pier if K[v, u] >= 0) < 0.6 * len(pier) or not any(nas(x, y) for x, y in c): continue
                for (x, y) in c: ustaw(raw, 0, x, y, 2048 + inne.copy().pop() * 48); zm.add((x, y)); n1 += 1
        if zm: WS.reshape(raw, 0, WS.ring(zm))
        # pojedyncze kratki gruntu na warstwie 1 (nakładka bez sąsiadów tego rodzaju): znikają
        K1 = np.full((H, W), -1, np.int32)
        for y in range(H):
            for x in range(W):
                k = rodzaj(kafel(raw, 1, x, y))
                if k in E.GRUNT_W1: K1[y, x] = k
        zm1 = set()
        for k in sorted(E.GRUNT_W1):
            for c in lib.skladowe(K1 == k, osiem=False):
                if len(c) != 1: continue
                x, y = c[0]
                pier = {(x + dx, y + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1)} - {(x, y)}
                if all(0 <= u < W and 0 <= v < H and K1[v, u] != k for u, v in pier) and nas(x, y):
                    ustaw(raw, 1, x, y, 0); zm1.add((x, y)); n1 += 1
        if zm1: WS.reshape(raw, 1, WS.ring(zm1))
        for (x0, y0, x1, y1) in TRAWA_ODCINKI.get(mid, []):       # urwany fragment baszty (bez zakończenia) znika: trawa
            for yy in range(y0, y1 + 1):
                for xx in range(x0, x1 + 1):
                    ustaw(raw, 0, xx, yy, 2048 + 16 * 48)
                    for z in (1, 2, 3): ustaw(raw, z, xx, yy, 0)
            WS.reshape(raw, 0, WS.ring({(xx, yy) for yy in range(y0, y1 + 1) for xx in range(x0, x1 + 1)}))
        for (x0, y0, x1, y1) in ODCINKI.get(mid, []) if not nowa else []:      # fragment muru/baszty bez zakończenia: wraca do stanu sprzed zmian (wszystkie warstwy)
            for yy in range(y0, y1 + 1):
                for xx in range(x0, x1 + 1):
                    for z in range(4): ustaw(raw, z, xx, yy, old["data"][z * W * H + yy * W + xx])
            for z in (0, 1): WS.reshape(raw, z, WS.ring({(xx, yy) for yy in range(y0, y1 + 1) for xx in range(x0, x1 + 1)}))
        # plamy ucięte prostą linią
        cof = 0; zm2 = set()
        for (x, y, opis) in ([] if nowa else E.sprawdz_b(L.Mapa(mid, raw=raw))):
            if not opis.startswith("plama"): continue
            if not any(nas(x + dx, y + dy) for dx in range(-3, 4) for dy in range(-3, 4) if 0 <= x + dx < W and 0 <= y + dy < H): continue
            zmien = np.zeros((H, W), bool)
            for yy in range(H):
                for xx in range(W):
                    for z in (0, 1):
                        o, n = old["data"][z * W * H + yy * W + xx], raw["data"][z * W * H + yy * W + xx]
                        if o != n and rodzaj(o) != rodzaj(n) and rodzaj(o) not in (LISC,) + SCIANA_LISCI and rodzaj(n) in E.NATURA | {None} and (rodzaj(o) in E.NATURA | {None}): zmien[yy, xx] = True
            for C in lib.skladowe(zmien):
                if any(abs(q[0] - x) <= 3 and abs(q[1] - y) <= 3 for q in C):
                    for (xx, yy) in C:
                        for z in (0, 1):
                            o, n = old["data"][z * W * H + yy * W + xx], raw["data"][z * W * H + yy * W + xx]
                            if rodzaj(o) != rodzaj(n) and rodzaj(o) not in (LISC,) + SCIANA_LISCI: ustaw(raw, z, xx, yy, o)
                        zm2.add((xx, yy)); cof += 1
        if zm2:
            WS.reshape(raw, 0, WS.ring(zm2)); WS.reshape(raw, 1, WS.ring(zm2))
        if n1 or cof: wyn[mid] = (n1, cof)
    return wyn


TRESC = {101, 102, 103, 104, 111, 117, 121, 122, 123, 201, 202, 241, 250, 355, 356, 357}


def ma_tresc(e):
    """zdarzenie z treścią (przejście, rozmowa, wybór, polecenie wtyczki inne niż uderzanie w przyrodę); nie zapora przyrodnicza"""
    if not e or e.get("note", "").startswith("<Zapora"): return False
    for pg in e["pages"]:
        for c in pg["list"]:
            if c["code"] in TRESC and not (c["code"] == 357 and c["parameters"] and c["parameters"][0] == "ChoppableTree"): return True
    return False


def zamkniecia(raws, usuniete):
    """Liście, które zamykały coś z treścią (bramę, dziedziniec, palisadę, kieszeń z przejściem): obszar B nieosiągalny pieszo PRZED (poza wejściami mapy)
    i z treścią w środku nie może się otworzyć. Kratki usuniętych liści przy B dostają widoczne zapory (drzewa/kamienie), w razie potrzeby kolejnymi
    pierścieniami, aż B znów jest zamknięte. Zwraca {mapa: [(składowa B: liczba kratek, zapór)]}"""
    import analiza
    wyn = {}
    for mid, raw in raws.items():
        if mid not in usuniete or not usuniete[mid]: continue
        przed = L.Mapa(mid, raw=json.loads(open(os.path.join(ROOT, "data", "Map%03d.json" % mid), "rb").read().decode("utf-8")))
        st = list(set(przed.starty()) | set(analiza.krawedz_wolne(przed)))
        R0 = analiza.osiagalne(przed, st)
        if len(R0) < 500: R0 = set(analiza.najwiekszy(przed)) | R0
        seen = set(R0); komp = []
        for y in range(przed.H):
            for x in range(przed.W):
                if (x, y) in seen or not przed.stoi(x, y): continue
                c = przed.flood([(x, y)]); seen |= c
                komp.append(c)
        tresc = [(e["x"], e["y"]) for e in raw["events"] if ma_tresc(e)]
        for B in komp:
            blisko = [t for t in tresc if any((t[0] + dx, t[1] + dy) in B for dx in (-1, 0, 1) for dy in (-1, 0, 1))]
            if not blisko: continue
            usun = usuniete[mid]; zapor = 0
            for ring in range(4):
                po = L.Mapa(mid, raw=raw)
                R1 = analiza.osiagalne(po, list(R0))
                if not (R1 & B): break
                granica = set(B) if ring == 0 else granica | nowe_z
                nowe_z = {(x + dx, y + dy) for (x, y) in granica for dx in (-1, 0, 1) for dy in (-1, 0, 1)} & usun
                nowe_z -= {c for c in nowe_z if any(e and (e["x"], e["y"]) == c for e in raw["events"])}
                for (x, y) in sorted(nowe_z):
                    if dodaj_zapore(raw, mid, x, y): zapor += 1
            wyn.setdefault(mid, []).append((len(B), zapor, sorted(blisko)[:3]))
    return wyn


def zywoploty(raws, usuniete):
    """Kratki liści (linie grubości <= 2), które w środku mapy rozdzielały dwa różne obszary chodliwe (>= 40 kratek każdy): żywopłot dziedzińca,
    ogrodzenie ogrodu itp. Zostają jako widoczne zapory (zdarzenia ozdobne), nie jako pas liści. Zwraca {mapa: [kratki]}"""
    wyn = {}
    for mid, raw in raws.items():
        k = usuniete.get(mid)
        if not k: continue
        przed = L.Mapa(mid, raw=json.loads(open(os.path.join(ROOT, "data", "Map%03d.json" % mid), "rb").read().decode("utf-8")))
        etyk = {}; n = 0
        for y in range(przed.H):
            for x in range(przed.W):
                if (x, y) in etyk or not przed.stoi(x, y): continue
                c = przed.flood([(x, y)]); n += 1
                for q in c: etyk[q] = (n, len(c))
        for (x, y) in sorted(k):
            if lib.gleb(przed.W, przed.H, x, y) < 2: continue      # pas przy krawędzi nie jest żywopłotem (idzie na trawę)
            def szukaj(dx, dy):
                for r in (1, 2):
                    q = (x + dx * r, y + dy * r)
                    if q in etyk and etyk[q][1] >= 40: return etyk[q][0]
                    if q not in k: return None
                return None
            dziel = False
            for dx, dy in ((1, 0), (0, 1)):
                u, v = szukaj(dx, dy), szukaj(-dx, -dy)
                if u and v and u != v: dziel = True
            if dziel and dodaj_zapore(raw, mid, x, y): wyn.setdefault(mid, []).append((x, y))
    return wyn


def mozna_usunac(zd, raw):
    """zdarzenie czystej przyrody bez treści (drzewo, krzak, kamień, pniak), które wolno zdjąć z kratki krawędzi"""
    e = raw["events"][zd.id]
    if not e or (e.get("note") or "").startswith("<Zapora") or ma_tresc(e): return False
    if any(n in e["name"] for n in NIE_RUSZAJ): return False
    pg = e["pages"][0]
    return bool(pg.get("image") and pg["image"].get("characterName", "").startswith("!$")) and e["pages"][0]["priorityType"] == 1


def kepy(raws, a, kratki):
    """rozmieszcza zapory kępami: kratki posortowane wzdłuż krawędzi, kępa 1-4 kratek jednej grupy; drzewa w kępie dostają czasem dodatkowe drzewo o kratkę w głąb"""
    import random
    kr = sorted(kratki); i = 0; n = 0
    while i < len(kr):
        rng = random.Random(a * 100003 + kr[i][0] * 131 + kr[i][1])
        d = rng.randint(1, 4); g = rng.choices(["las", "skaly", "krzaki"], [55, 25, 20])[0]
        # kępa = kolejne kratki sąsiadujące ze sobą
        grupa = [kr[i]]
        while len(grupa) < d and i + len(grupa) < len(kr) and abs(kr[i + len(grupa)][0] - grupa[-1][0]) + abs(kr[i + len(grupa)][1] - grupa[-1][1]) <= 1: grupa.append(kr[i + len(grupa)])
        for (x, y) in grupa:
            if dodaj_zapore(raws[a], a, x, y, g): n += 1
        i += len(grupa)
    return n


def zapory(raws):
    """pętla: kontrakt krawędzi na pamięci. (1) tam, gdzie po drugiej stronie stoi tylko przyroda (drzewo, krzak, kamień) - ZDEJMUJE ją i otwiera styk;
    (2) gdzie po drugiej stronie jest coś, czego nie wolno ruszyć (mur, woda, klif, zdarzenie z treścią), albo styk donikąd / zamknięty fabularnie,
    stawia zapory w kępach (nie w równym rzędzie). Powtarza do zera. Zwraca ({mapa: zapór}, {mapa: zdjętych zdarzeń przyrody})"""
    sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
    import swiat_styki as S
    S.STAGING = STG
    dod = {}; zdjete = {}; nieudane = []; proby = set()
    for tura in range(8):
        sw = S.Swiat(raws=raws)
        sw.links = [l for l in sw.links if l not in sw.generowane]; sw.generowane = []; sw._ev = {}
        lk = sw.linki_z_kafli(); sw.generowane = lk
        klucze = {(l["a"], l["b"], l["side"]) for l in lk}
        sw.links = [l for l in sw.links if (l["a"], l["b"], l["side"]) not in klucze] + lk
        wyn = sw.analiza()
        cel = {}; otw = 0
        for k in ("skok", "zamkniete_blok", "donikad"):
            for c in wyn.get(k, []):
                if k != "donikad" and c["b"] > 0 and c.get("bx") is not None and (c["b"], c["bx"], c["by"]) not in proby:
                    proby.add((c["b"], c["bx"], c["by"]))
                    mb = sw.M[c["b"]]; ev = mb.ev_block().get((c["bx"], c["by"]), [])
                    if ev and all(mozna_usunac(z, raws[c["b"]] if c["b"] in raws else raws.setdefault(c["b"], zrodlo(c["b"]))) for z in ev):
                        for z in ev: raws[c["b"]]["events"][z.id] = None
                        zdjete[c["b"]] = zdjete.get(c["b"], 0) + len(ev); otw += len(ev); continue
                cel[(c["a"], c["x"], c["y"])] = k
        for a in sw.M:                                                  # kieszenie chodliwe < 40 kratek na krawędzi bez przejścia (test w grze liczy każdą chodliwą kratkę)
            for side in "NSWE":
                for c in sw.krawedz(a, side):
                    if c["wolna"] and not c["glowny"] and not c["brama"] and c["powod"] != "bespoke" and not c["otw"] and (a, c["x"], c["y"]) not in cel                             and (a, c["b"]) not in S.WYJATKI and not (c["b"] > 0 and c["bwolna"] and c["otw"]):
                        cel[(a, c["x"], c["y"])] = "kieszen"
        for a, sasiedzi in BLOKADA_FABULY.items():                      # fabularne zamknięcia: wszystkie chodliwe kratki krawędzi ku sąsiadowi
            for side in "NSWE":
                for c in sw.krawedz(a, side):
                    if c["b"] in sasiedzi and c["wolna"] and not c["brama"] and c["powod"] != "bespoke": cel[(a, c["x"], c["y"])] = "fabula"
        nowych = 0; po_mapach = {}
        for (a, x, y), k in cel.items():
            if a in lib.GRACZ and k == "fabula": continue
            if a not in raws: raws[a] = zrodlo(a)
            po_mapach.setdefault(a, []).append((x, y))
        for a, kr in po_mapach.items():
            n = kepy(raws, a, kr); dod[a] = dod.get(a, 0) + n; nowych += n
            if n < len(kr): nieudane += [(a, q) for q in kr]
        print("   tura %d: zdjęto przyrody %d, zapór %d (kontrakt: %s)" % (tura, otw, nowych, {k: len(v) for k, v in wyn.items() if v and not k.startswith("wyjatek")}))
        if not nowych and not otw: break
    if nieudane: print("   BEZ zapory (kratka zajęta przez zdarzenie):", sorted(set(nieudane))[:10])
    return dod, zdjete


def main():
    raws = {}; zm = {}
    ids = sorted(int(os.path.basename(p)[3:6]) for p in glob.glob(os.path.join(ROOT, "data", "Map???.json")))
    nowe = 0
    for mid in ids:
        raw = zrodlo(mid)
        if raw["tilesetId"] not in (9, 11): continue
        raws[mid] = raw
    log = {}
    pas_lisci_zapamietane = {}
    for mid, raw in raws.items():
        k = pas_lisci(raw, raw["tilesetId"], mid)
        if k:
            usun_lisc(raw, k); log[mid] = len(k); pas_lisci_zapamietane[mid] = k
    print("1. liście usunięte (mapa: kratek):", log)
    zbierz_obrazy()
    por = porzadek(raws)
    print("1a. porządek gruntu (mapa: (pojedynczych kratek, cofniętych kratek plam)):", por)
    uns = {mid: pas_lisci_zapamietane[mid] for mid in pas_lisci_zapamietane}
    zam = zamkniecia(raws, uns)
    print("1b. zamknięcia (liście zamykające treść; mapa: [(kratek obszaru, zapór, zdarzenia)]):", zam)
    zyw = zywoploty(raws, uns)
    print("1c. żywopłoty (kratki liści rozdzielające dwa obszary >= 40 kratek; mapa: zapór):", {m: len(v) for m, v in zyw.items()}, zyw.get(24, [])[:3])
    dod, zdj = zapory(raws)
    print("2a. zdjęta przyroda przy otwartych stykach (zdarzeń na mapę):", zdj, "razem", sum(zdj.values()))
    print("2. zapory (zdarzeń na mapę):", dod, "razem", sum(dod.values()))
    os.makedirs(SDATA, exist_ok=True)
    zapis = 0; zmienione = []; sumy = {}
    import hashlib
    sha = lambda b: hashlib.sha256(b).hexdigest()
    for mid, raw in raws.items():
        orig = open(os.path.join(ROOT, "data", "Map%03d.json" % mid), "rb").read()
        nowy = popraw.tekst_mapy(raw)
        if POWTORZ:
            prev = open(os.path.join(SDATA, "Map%03d.json" % mid), "rb").read() if os.path.exists(os.path.join(SDATA, "Map%03d.json" % mid)) else orig
            if nowy != prev: print("POWTÓRKA: zmiana w", mid); zapis += 1
            continue
        if nowy != orig:
            open(os.path.join(SDATA, "Map%03d.json" % mid), "wb").write(nowy); zapis += 1; zmienione.append(mid); sumy[str(mid)] = sha(orig)
    print("zapisano map:", zapis)
    if not POWTORZ:
        sumy["Swiat_Data.js"] = sha(open(os.path.join(ROOT, "js", "plugins", "Swiat_Data.js"), "rb").read())
        json.dump({"zmienione": sorted(zmienione)}, open(os.path.join(STG, "zmienione.json"), "w"))
        json.dump(sumy, open(os.path.join(STG, "sumy.json"), "w"))


if __name__ == "__main__":
    main()
