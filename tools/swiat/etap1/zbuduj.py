# -*- coding: utf-8 -*-
"""ETAP 1 swiata: buduje KOPIE map w tools/swiat/etap1/staging/data/ (data/ nie jest ruszane).
  python tools/swiat/etap1/zbuduj.py
Mapy: 8 (brama polnocna + wyjscie S do Przystani), 13 (3 zdarzenia wyjscia S), 111 (10 kolumn, suche koryto, most, przesuniecie muru),
125 (+20 kolumn, wyjscie N do miasta, rog NW woda -> suche dno, pomost). Sumy sha256 oryginalow: staging/sumy.json (czyta je install.py)."""
import os, sys, json, copy, hashlib, math, random
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia")); sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
import wspolne as W
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
STG = os.path.join(HERE, "staging")
DATA = os.path.join(STG, "data")
os.makedirs(DATA, exist_ok=True)
random.seed(20261030)


def wczytaj(mid):
    m, lay = W.read_json("data/Map%03d.json" % mid)
    assert lay == "map"
    return m


def sha(mid): return hashlib.sha256(open(os.path.join(ROOT, "data", "Map%03d.json" % mid), "rb").read()).hexdigest()
NOWE_MAPY = set()   # id() nowych map (zdarzenia od 1)
BULK0 = 5000   # zasoby (drzewa, krzaki, kamienie) klonowane w nowych kratkach: id >= 5000, poza zakresami wtyczek (np. Orzel 500-539, TownLife, Zasoby 2000-3139)


def dodaj(m, e, bulk=False):
    """wstawia zdarzenie pod najnizszym wolnym id < 458 (dziury listy, potem koniec listy do 457): zakresy wtyczek (Tawerna.inject: 458, 500-3139...)
    zaczynaja sie wyzej, a TABLICA ZDARZEN MA BYC KROTKA - petle gry (Game_Map.events, isEventRunning...) chodza po calej tablicy (id 5000+ trzykrotnie
    spowolnilo Lesna droge). Nowe mapy: kolejne id od 1."""
    ev = m["events"]
    if id(m) in NOWE_MAPY: i = len(ev)
    else:
        i = next((k for k in range(1, min(458, len(ev))) if ev[k] is None), None)
        if i is None and len(ev) < 458: i = len(ev)
        assert i is not None and i < 458, "brak wolnych id < 458 w mapie"
    while len(ev) <= i: ev.append(None)
    e["id"] = i; ev[i] = e
    return e


def zdarzenie_przejscia(m, x, y, cel, cx, cy, dir_, nazwa):
    e = copy.deepcopy(next(v for v in wczytaj(8)["events"] if v and v["id"] == 237))
    e["name"] = nazwa; e["note"] = ""; e["x"] = x; e["y"] = y
    e["pages"][0]["list"][0]["parameters"] = [0, cel, cx, cy, dir_, 0]
    dodaj(m, e)
    return e


def kafel(m, z, x, y, v): W.put(m, z, x, y, v)
def K(k): return 2048 + 48 * k


CRACK, MUD, COBBLE, STONE = 19, 26, 40, 41
sumy = {}


# ============================================================================================ Mapa 8
def mapa8():
    m = wczytaj(8); sumy[8] = sha(8)
    # brama polnocna: ulica x 24-26 konczy sie w murze (y 0-4); pod x 49-51 stoi tawerna (dach przy murze), wiec brama jest tu
    for x in (24, 25, 26):
        for y in range(0, 5):
            kafel(m, 0, x, y, W.at(m, 0, x, 6))
            for z in (1, 2, 3, 4, 5): kafel(m, z, x, y, 0)
    W.reshape(m, 0, [(x, y) for x in (23, 24, 26, 27) for y in range(0, 7)])
    for i, x in enumerate((24, 25, 26)):
        zdarzenie_przejscia(m, x, 0, 13, 40 + i, 94, 8, "Przejście -> Góry (brama północna)")
    e = copy.deepcopy(next(e for e in m["events"] if e and e["id"] == 243))
    e["name"] = "Brama północna: łuk, przyczółki i skrzydła"; e["x"] = 25; e["y"] = 5
    e["pages"][0]["image"].update({"characterName": "!$North_Gate_B", "direction": 2, "pattern": 1})
    e["pages"][0]["priorityType"] = 2
    dodaj(m, e)
    for lx in (23, 27):   # latarnie z ogniem na przyczolkach (obraz bramy): swiatlo jak #91 / pochodnie, z migotaniem
        l = copy.deepcopy(next(v for v in m["events"] if v and v["id"] == 239)); l["name"] = "Brama północna: latarnia (ogień)"
        l["note"] = "<Light:190,255,160,90><LightWhen:night><LightFlicker:0.13,255,130,55><LightHeight:0>"; l["x"], l["y"] = lx, 2
        dodaj(m, l)
    for ev in m["events"]:
        if ev and ev["id"] in (1, 2, 3):
            c = ev["pages"][0]["list"][0]; assert c["code"] == 201
            ev["x"] = 33 + (ev["id"] - 1)   # x 24-26 w Przystani zajmuje chata (x 22-28, y 0-5): wyjscie S miasta przesuniete na x 33-35
            c["parameters"] = [0, 125, ev["x"], 1, 2, 0]; ev["name"] = "Przejście -> Przystań"
    # zachodnie wyjscia do Podgrodzia: brama Podgrodzia stoi teraz na x 100-101 (10 kolumn fosy przed murem)
    for ev in m["events"]:
        if ev and ev["id"] in (237, 238):
            ev["pages"][0]["list"][0]["parameters"] = [0, 111, 100, 17 if ev["id"] == 237 else 18, 4, 0]
    return m


# ============================================================================================ Mapa 13
def mapa13():
    m = wczytaj(13); sumy[13] = sha(13)
    for i, x in enumerate((40, 41, 42)):
        zdarzenie_przejscia(m, x, 95, 8, 24 + i, 4, 2, "Przejście -> Okolice Tawerny (brama północna)")
    return m


# ============================================================================================ Mapa 111
def wstaw_kolumny(m, x_at, n, fill=0):
    Wd, H = m["width"], m["height"]
    new = []
    for z in range(6):
        for y in range(H):
            row = m["data"][(z * H + y) * Wd:(z * H + y + 1) * Wd]
            new += row[:x_at] + [fill] * n + row[x_at:]
    m["data"] = new; m["width"] = Wd + n


def linia(pts, step=0.25):
    out = []
    for (a, b) in zip(pts, pts[1:]):
        d = math.hypot(b[0] - a[0], b[1] - a[1]); k = max(1, int(d / step))
        for i in range(k): out.append((a[0] + (b[0] - a[0]) * i / k, a[1] + (b[1] - a[1]) * i / k))
    out.append(pts[-1])
    return out


def koryto111():
    # os suchego koryta w kratkach lokalnych Podgrodzia (swiat.json, czesc B: x 413 -> 95), z zakretem ku murowi na dole
    pts = [(95, 4), (95, 30), (95, 100), (95.4, 103.5), (96.6, 106.4), (99, 108), (102, 108), (106, 108)]
    hw = lambda y: 3.0 if y <= 80 else 3.0 - 0.8 * min(1, (y - 80) / 20)
    dno, brzeg = set(), set()
    for (px, py) in linia(pts):
        r = hw(py)
        for dy in range(-6, 7):
            for dx in range(-6, 7):
                x, y = int(round(px)) + dx, int(round(py)) + dy
                d = math.hypot(x - px, y - py)
                if d <= r: dno.add((x, y))
                elif d <= r + 1.15: brzeg.add((x, y))
    return dno, brzeg - dno


def mapa111():
    m = wczytaj(111); sumy[111] = sha(111)
    H = m["height"]
    wstaw_kolumny(m, 90, 10, 0)
    for y in range(H):
        for x in range(90, 100): kafel(m, 0, x, y, K(16))
    for e in m["events"]:
        if e and e["x"] >= 90: e["x"] += 10
    dno, brzeg = koryto111()
    def ok(x, y): return 90 <= x <= 99 or (x in (100, 101) and 100 <= y <= 111)
    dno = {c for c in dno if ok(*c) and c[1] >= 4}
    brzeg = {c for c in brzeg if ok(*c) and c[1] >= 3}
    for (x, y) in brzeg: kafel(m, 0, x, y, K(MUD))
    for (x, y) in dno:
        kafel(m, 0, x, y, K(CRACK))
    for (x, y) in set(dno) | set(brzeg):
        if x in (100, 101):
            for z in (1, 2, 3, 4, 5): kafel(m, z, x, y, 0)
    # most kamienny 10 x 4 (y 16-19, x 90-99): deska z kafli (bruk) + obraz mostu (tools/swiat/etap1/most.py, wariant z staging/most_wariant.txt):
    # attyka (balustrada) y 15 i y 20 nieprzechodnia (region 2), słupy-przyczółki na rogach, latarenki z ogniem na czterech słupach
    for y in range(16, 20):
        for x in range(90, 100): kafel(m, 0, x, y, K(COBBLE))
    for x in range(91, 100):
        for y in (15, 20):
            if 92 <= x <= 98: kafel(m, 0, x, y, K(STONE))
            kafel(m, 5, x, y, 2)
    # murowane skarpy fosy przy moście: brzegi z kamienia (y 6-31)
    for (x, y) in brzeg:
        if 6 <= y <= 31 and x <= 99: kafel(m, 0, x, y, K(STONE))
    W.reshape(m, 0, [(x, y) for x in range(88, 102) for y in range(H)])
    wp = os.path.join(STG, "most_wariant.txt")
    war = open(wp).read().strip() if os.path.exists(wp) else "A"
    szablon = next(e for e in m["events"] if e and e["id"] == 91)    # niewidoczne zdarzenie ze światłem bramy
    ob = copy.deepcopy(szablon); ob["name"] = "Most kamienny: obraz (wariant %s)" % war; ob["note"] = ""
    ob["x"], ob["y"] = 94, 22
    ob["pages"][0]["image"] = {"tileId": 0, "characterName": "!$Most_" + war, "direction": 2, "pattern": 1, "characterIndex": 0}
    ob["pages"][0]["priorityType"] = 0
    dodaj(m, ob)
    for (lx, ly) in ((91, 14), (99, 14), (91, 19), (99, 19)):
        l = copy.deepcopy(szablon); l["name"] = "Most: latarenka (ogień)"
        l["note"] = "<Light:300,255,190,110><LightWhen:night><LightFlicker:0.14,255,140,60><LightHeight:40>"; l["x"], l["y"] = lx, ly
        dodaj(m, l)
    # drobne szczegoly na dnie fosy: zdarzenia z obrazami ziemi (te same, co w grze: suche krzaczki, kamienie, sterta, martwy pien),
    # rzadko i nieregularnie; nie na moscie (y 14-21) i nie przy brzegu
    zrodlo = wczytaj(125)["events"]
    wzor = {}
    for e in zrodlo:
        if e and e["pages"][0]["image"]["characterName"] in ("!$Bush_Bare_A", "!$Bush_Bare_B", "!$Rock_Flat", "!$Rock_Cracked", "!$Rock_Pile", "!$Trunk_Dead", "!$Bush_Bare_Wide"):
            wzor.setdefault(e["pages"][0]["image"]["characterName"], e)
    rndd = random.Random(7)
    wolne = sorted((x, y) for (x, y) in dno if 90 <= x <= 99 and 6 <= y <= 98 and not (12 <= y <= 24)
                   and all((x + dx, y) in dno for dx in (-1, 1)))
    zajete = []
    wybor = [("!$Bush_Bare_A", 0.34), ("!$Rock_Flat", 0.2), ("!$Rock_Cracked", 0.12), ("!$Bush_Bare_B", 0.12), ("!$Rock_Pile", 0.1), ("!$Bush_Bare_Wide", 0.07), ("!$Trunk_Dead", 0.05)]
    for _ in range(300):
        if len(zajete) >= 15: break
        x, y = rndd.choice(wolne)
        if any(abs(x - a) + abs(y - b) < 5 for (a, b) in zajete): continue
        r = rndd.random(); acc = 0; g = wybor[-1][0]
        for (name, w) in wybor:
            acc += w
            if r <= acc: g = name; break
        if g not in wzor: continue
        c = copy.deepcopy(wzor[g]); c["x"] = x; c["y"] = y
        dodaj(m, c, bulk=True); zajete.append((x, y))
    return m


# ============================================================================================ Mapa 125
def mapa125():
    m = wczytaj(125); sumy[125] = sha(125)
    Wd0, H = m["width"], m["height"]
    ORAZ = (98, 14, 111, 46)   # kieszen "Stare gniazdo" orla (Okolice_Data orzel_125_b: 105-108 x 30-33; kieszen x 100-109, y 24-44 i zejscie linowe (109,21), dostepna tylko z orla) - zostaje taka, jaka byla
    orig = [[W.at(m, z, x, y) for x in range(ORAZ[0], ORAZ[2] + 1)] for z in range(6) for y in range(ORAZ[1], ORAZ[3] + 1)]
    # +20 kolumn w prawo. Wschodni pas x 104-111 (dawny skraj mapy, jasny pas) i nowe x 112-131 dostaja las z x 60-87 (przesuniecie o 44),
    # zeby nie bylo lustra ani pasa na szwie; zasoby (drzewa, krzaki, kamienie) z tych kolumn przenosza sie razem z nimi
    new = []
    for z in range(6):
        for y in range(H):
            row = m["data"][(z * H + y) * Wd0:(z * H + y + 1) * Wd0]
            row = row[:104] + [0] * 28
            new += row
    m["data"] = new; m["width"] = Wd0 + 20
    for z in range(6):
        for y in range(H):
            for x in range(104, 132): kafel(m, z, x, y, W.at(m, z, x - 44, y))
    k = 0
    for z in range(6):
        for y in range(ORAZ[1], ORAZ[3] + 1):
            for j, x in enumerate(range(ORAZ[0], ORAZ[2] + 1)): kafel(m, z, x, y, orig[k][j])
            k += 1
    seam = [(x, y) for x in range(98, 132) for y in range(H)]
    W.reshape(m, 0, seam); W.reshape(m, 1, seam)
    for i, e in enumerate(m["events"]):
        if e and e["x"] >= 104 and e["pages"][0]["image"]["characterName"] and e["pages"][0]["list"][0]["code"] != 201 and not (ORAZ[0] <= e["x"] <= ORAZ[2] and ORAZ[1] <= e["y"] <= ORAZ[3]): m["events"][i] = None
    klony = []
    for e in list(m["events"]):
        if e and 60 <= e["x"] <= 87 and e["pages"][0]["image"]["characterName"] and e["pages"][0]["list"][0]["code"] != 201 and e["y"] >= 0:
            c = copy.deepcopy(e); c["x"] = e["x"] + 44
            if ORAZ[0] <= c["x"] <= ORAZ[2] and ORAZ[1] <= c["y"] <= ORAZ[3]: continue   # gniazdo orla zostaje czyste
            klony.append(c)
    for c in klony: dodaj(m, c, bulk=True)
    m["events"][92] = None   # dawne wyjscie E (111,19) -> 111: teraz w srodku mapy
    # rog NW basenu: woda nie dochodzi do gornej krawedzi (nad nia jest ląd miasta, Map008): pas ladu 2-3 kratki z lagodnym lukiem
    # (plaza z piasku nad woda, wyzej trawa), suche koryto z Podgrodzia wpada w basen od zachodu (zatoczka z piasku i dna)
    land = []
    for x in range(0, 14):
        bx = 2 + round(1.2 * math.sin(math.pi * (x + 0.5) / 14))
        for y in range(0, bx + 1):
            if W.kind_of(W.at(m, 0, x, y)) == 6: land.append((x, y, y == bx))
    for (x, y, shore) in land:
        for z in (1, 2, 3, 4): kafel(m, z, x, y, 0)
        kafel(m, 0, x, y, K(17) if shore else K(16))
    # ujscie koryta: dno (kind 19) pasem szer. ~4 od krawedzi x 0 ku wodzie (os (0,2.5)-(5,3.2)-(8,4.3)), konczy sie w plazy
    for (px, py) in linia([(0, 2.4), (4, 2.9), (7, 3.6), (9, 4.0)]):
        for dy in range(-3, 4):
            for dx in range(-3, 4):
                x, y = int(round(px)) + dx, int(round(py)) + dy
                if 0 <= x < 14 and 0 <= y < 8 and math.hypot(x - px, y - py) <= 1.9 and W.kind_of(W.at(m, 0, x, y)) in (16, 17, 6):
                    if W.kind_of(W.at(m, 0, x, y)) == 6 and not any((x, y) == (lx, ly) for (lx, ly, _) in land): continue
                    kafel(m, 0, x, y, K(CRACK))
    W.reshape(m, 0, [(x, y) for x in range(0, 17) for y in range(0, 10)])
    W.reshape(m, 1, [(x, y) for x in range(0, 17) for y in range(0, 10)])
    for (x, y) in [(34, 0), (35, 0)]: kafel(m, 1, x, y, 0)   # skraj lasu (warstwa 1) przy wyjsciu N: droga 3 kratki
    W.reshape(m, 1, [(x, y) for x in range(31, 39) for y in range(0, 3)])
    for x in (33, 34, 35):
        zdarzenie_przejscia(m, x, 0, 8, x, 136, 8, "Przejście -> Okolice Tawerny (południe)")
    return m


def zapisz(m, mid):
    p = os.path.join(DATA, "Map%03d.json" % mid)
    open(p, "wb").write(W.json_text(m, "map")); print("zapisano", p)


def wolna_kratka(m125, x0, y0):
    import mapylib as M
    mp = M.Mapa(125, raw=m125)
    dost = mp.flood([(34, 8)])   # osiagalne pieszo od drogi przy nabrzezu
    best = min(((abs(x - x0) + abs(y - y0), x, y) for x in range(x0 - 12, x0 + 13) for y in range(y0 - 12, y0 + 13)
                if (x, y) in dost and all(mp.stoi(x + dx, y + dy) for dx in (-1, 0, 1) for dy in (-1, 1))), default=None)
    return best[1], best[2]


def glowna():
    m8, m13, m125, m111 = mapa8(), mapa13(), mapa125(), mapa111()
    lx, ly = wolna_kratka(m125, 110, 19)   # zachodnie wyjscie Podgrodzia -> Przystan: dawne (110,19) zarosl las
    for e in m111["events"]:
        if e and e["id"] == 92: e["pages"][0]["list"][0]["parameters"] = [0, 125, lx, ly, 4, 0]; print("Podgrodzie W -> Przystan (%d,%d)" % (lx, ly))
    import ogon_buduj, latarnie
    maps, linki = ogon_buduj.buduj({8: m8, 13: m13, 111: m111, 125: m125})
    for mid in (155, 162):
        maps[mid] = wczytaj(mid); sumy[mid] = sha(mid)
    for mid in (111, 125, 155, 162): print("latarnie na slupie: mapa %d: %d" % (mid, latarnie.napraw(maps[mid], mid)))
    import zbuduj as _z
    sumy.update(_z.sumy)
    for mid, m in sorted(maps.items()): zapisz(m, mid)
    # MapInfos: nowe mapy (id z swiat.json, ktorych nie ma w data/MapInfos.json), pod rodzicem
    mi, lay = W.read_json("data/MapInfos.json")
    sumy["MapInfos"] = hashlib.sha256(open(os.path.join(ROOT, "data", "MapInfos.json"), "rb").read()).hexdigest()
    ids = {e["id"] for e in mi if e}
    rodzic = {914: 125, 917: 111, 920: 21, 922: 125, 923: 125}
    import ogon
    nast = max(e["order"] for e in mi if e) + 1
    for k, mid in enumerate((914, 917, 920, 922, 923)):
        assert mid not in ids, "id %d zajete w MapInfos" % mid
        while len(mi) <= mid: mi.append(None)
        mi[mid] = {"id": mid, "expanded": False, "name": ogon.nazwa_mapy(mid), "order": nast + k, "parentId": rodzic[mid], "scrollX": 0, "scrollY": 0}
    open(os.path.join(DATA, "MapInfos.json"), "wb").write(W.json_text(mi, lay))
    json.dump(sumy, open(os.path.join(STG, "sumy.json"), "w"), indent=1)
    json.dump({"nowe_mapy": [914, 917, 920, 922, 923], "linki": linki}, open(os.path.join(STG, "ogon.json"), "w"), indent=1)


if __name__ == "__main__":
    sys.path.insert(0, HERE)
    glowna()
