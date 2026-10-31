# -*- coding: utf-8 -*-
"""ETAP 2 swiata „Prawe skrzydlo”, PARTIA 1: 20 Dom dziadka (+20/+20), 3 Kruczy Jar, 24 Posiadlosc Lorda, 23 Skraj lasu, 4 Lake#1, 22 Polna droga,
17 Lake#2 (tylko wyjscia N), nowe 900 Pola pod grzbietem i 901 Sady pod dworem. Wszystko na kopiach: staging/data/ (data/ nie jest ruszane).
Baza: data/ po instalacji etapu 1. Uzywa narzedzi etapu 1 (tools/swiat/etap1: zbuduj.py, ogon.py).
  python tools/swiat/etap2/zbuduj2.py"""
import os, sys, json, copy, hashlib
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
E1 = os.path.join(ROOT, "tools", "swiat", "etap1")
sys.path.insert(0, E1); sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia")); sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
import zbuduj as Z
import ogon as O
import ogon_buduj as OB
W = Z.W
K = Z.K
STG = os.path.join(HERE, "staging"); DATA = os.path.join(STG, "data")
os.makedirs(DATA, exist_ok=True)
sumy = {}
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass


def wczytaj(mid):
    sumy[mid] = Z.sha(mid)
    return Z.wczytaj(mid)


def usun_przejscia(m, ids):
    for i in ids:
        if i < len(m["events"]): m["events"][i] = None


def przekieruj(m, ids, cel, xs, ys, dir_):
    for k, i in enumerate(ids):
        c = m["events"][i]["pages"][0]["list"][0]; assert c["code"] == 201, (i, c)
        c["parameters"] = [0, cel, xs[k] if isinstance(xs, list) else xs, ys[k] if isinstance(ys, list) else ys, dir_, 0]


def wyczysc_las(m, cells):
    """usuwa gestwine (warstwy 1-3: las kind 20, drzewa z kafli) w kratkach cells i zasoby-zdarzenia na nich"""
    for (x, y) in cells:
        for z in (1, 2, 3): Z.kafel(m, z, x, y, 0)
        Z.kafel(m, 5, x, y, 0)
    OB.usun_zasoby_w(m, set(cells))


def sciezka(m, ox, oy, pts, wolne=None):
    cells = O.droga(m, pts, ox, oy, wolne=wolne)
    W.reshape(m, 0, W.ring(cells, 1)); W.reshape(m, 1, W.ring(cells, 1))   # brzegi ziemi (autokafle), zeby nie bylo prostokatow
    return cells


def kontrola_wolne(m, mid, cells):
    mp = O.M.Mapa(mid, raw=m) if hasattr(O, "M") else None


import sciezki as SC


def sc(m, mid, start, goal, seed, **kw):
    m["_id"] = mid
    r = SC.maluj(m, start, goal, seed, **kw)
    del m["_id"]
    if r is None: print("UWAGA: brak sciezki %d %s -> %s" % (mid, start, goal))
    return r


# ================================================================================================ 20 Dom dziadka
def mapa20():
    m = wczytaj(20)
    ox, oy = 604, 312
    W0, H0 = m["width"], m["height"]
    OB.rozszerz(m, 80, 64)
    m["note"] = m["note"].rstrip("\n") + "\n<Water:salt>"
    m["bgs"] = {"name": "Sea", "pan": 0, "pitch": 100, "volume": 40}
    reg = {(x, y) for x in range(80) for y in range(64) if x >= W0 or y >= H0}
    wolne = set()
    sz = O.szablony()
    O.teren(m, ox, oy, reg, 20, wolne=wolne, gestosc=0.5)
    usun_przejscia(m, (77, 78, 79))     # dawne wyjscie S do Lesnej drogi (21 nie sasiaduje z 20 w swiecie)
    # wyjscie N na x 8-10 = to samo pole swiata co wyjscie S pola (istniejaca sciezka Kruczego Jaru konczy sie tam); sciezka do drzwi chaty
    m["_id"] = 20
    cel = SC.najblizsza(m, (15, 9)); del m["_id"]
    wolne |= sc(m, 20, (9, 0), cel, 2001) or set()
    for i in range(3): Z.zdarzenie_przejscia(m, 8 + i, 0, 3, 8 + i, 58, 8, "Przejście -> Kruczy Jar (pole dziadka)")
    O.zasoby(m, ox, oy, reg, 2011, wolne, sz, 55)
    W.reshape(m, 0, W.ring(reg, 1)); W.reshape(m, 1, W.ring(reg, 1))
    return m


# ================================================================================================ 3 Kruczy Jar (mapa gracza): tylko przekierowanie istniejacych wyjsc
def mapa3():
    m = wczytaj(3)
    przekieruj(m, (148, 149, 150), 20, [8, 9, 10], 1, 2)     # S: istniejaca kreta sciezka konczy sie w przerwie lasu x 8-10: tu wejscie na Dom dziadka
    przekieruj(m, (151, 152, 153), 24, 78, [14, 15, 16], 4)  # W: istniejaca droga (y 16) wiedzie do dworu
    return m


# ================================================================================================ 24 Posiadlosc Lorda (mapa gracza)
def mapa24():
    m = wczytaj(24)
    # E: w pasie lasu na krawedzi (x 79, warstwa 1 kind 20) wycinamy tylko 3 kratki; sciezka z dziedzinca dworu, omijajaca zywoplot i kwiaty
    for y in (14, 15, 16):
        Z.kafel(m, 1, 79, y, 0); Z.kafel(m, 5, 79, y, 0)
    W.reshape(m, 1, [(78, y) for y in range(12, 19)])
    sc(m, 24, (36, 25), (79, 15), 2401)
    for i in range(3): Z.zdarzenie_przejscia(m, 79, 14 + i, 3, 1, 14 + i, 6, "Przejście -> Kruczy Jar (droga do pola)")
    # S: wyjscie na Sady pod dworem (901): 3 kratki pasa lasu na dolnej krawedzi (x 39-41)
    for x in (39, 40, 41):
        Z.kafel(m, 1, x, 59, 0); Z.kafel(m, 5, x, 59, 0)
    W.reshape(m, 1, [(x, 58) for x in range(37, 44)])
    return m


# ================================================================================================ 23 Skraj lasu (mapa gracza)
def mapa23():
    m = wczytaj(23)
    przekieruj(m, (95, 96, 97), 900, [18, 19, 20], 58, 8)    # N: istniejaca droga konczy sie na x 23-25 - wejscie na Pola pod grzbietem
    # S: nowa sciezka od istniejacej drogi (zakret przy (20,12)) do dolnej krawedzi, x 39-41
    m["_id"] = 23
    st = SC.najblizsza(m, (30, 59)); del m["_id"]
    sc(m, 23, st, (40, 59), 2301)
    for i in range(3): Z.zdarzenie_przejscia(m, 39 + i, 59, 17, 39 + i, 1, 2, "Przejście -> Łąka#2")
    return m


# ================================================================================================ 17 Lake#2 (nie gracza): wyjscia N
def mapa17():
    m = wczytaj(17)
    usun_przejscia(m, (61, 62, 63))
    m["_id"] = 17
    cel = SC.najblizsza(m, (40, 14)); del m["_id"]
    sc(m, 17, (40, 0), cel, 1701)
    for i in range(3): Z.zdarzenie_przejscia(m, 39 + i, 0, 23, 39 + i, 58, 8, "Przejście -> Skraj lasu")
    return m


# ================================================================================================ 18 Lake#3 (tymczasowo przez Sady pod dworem 901)
def mapa18():
    m = wczytaj(18)
    przekieruj(m, (72, 73, 74), 901, 1, [18, 19, 20], 6)
    return m


# ================================================================================================ 22 Polna droga
def mapa22():
    m = wczytaj(22)
    usun_przejscia(m, (62, 63, 64))
    return m


# ================================================================================================ 4 Lake#1: bez zmian (krawedz E otwarta, przejscie 4-900 w Swiat_Data.links)
def mapa4():
    return wczytaj(4)


# ================================================================================================ 21 Lesna droga: wyjscie N do 20 (jednokierunkowe po etapie 2) usuniete
def mapa21():
    m = wczytaj(21)
    usun_przejscia(m, (106, 107, 108))
    return m


# ================================================================================================ nowe 900, 901
def nowa(mid, props, sz, linki, stub):
    m, x0, y0, w, h = O.nowa_mapa(mid, props)
    reg = {(x, y) for x in range(w) for y in range(h)}
    wolne = set()
    O.teren(m, x0, y0, reg, mid, wolne=wolne, gestosc=0.28)
    for (st, cel, seed) in stub:
        wolne |= sc(m, mid, st, cel, seed) or set()
    O.zasoby(m, x0, y0, reg, mid + 7, wolne, sz, max(6, w * h // 90))
    W.reshape(m, 0, reg); W.reshape(m, 1, reg)
    return m


def glowna():
    maps = {20: mapa20(), 3: mapa3(), 24: mapa24(), 23: mapa23(), 17: mapa17(), 18: mapa18(), 22: mapa22(), 21: mapa21()}
    sz = O.szablony()
    props = {k: v for k, v in Z.wczytaj(4).items() if k not in ("data", "events", "width", "height")}
    linki = []
    pl = O.przejscie_ladowe
    cand = [(3, 20, 613), (24, 3, 267), (23, 17, 724), (23, 900, 708), (4, 900, 229), (24, 901, 564), (20, 923, 654)]
    por = {}
    for (a, b, ch) in cand:
        p = pl(a, b, ch)
        if p: por[(a, b)] = p; linki.append(dict(a=a, b=b, side=p[0], **{"from": p[1], "to": p[2]}))
        else: print("UWAGA: %d <-> %d: brak 3 kratek ladu po obu stronach wspolnej krawedzi - bez przejscia" % (a, b))
    stubs = {900: [((19, 59), (19, 40), 9001), ((0, 37), (18, 37), 9002)], 901: [((40, 0), (40, 16), 9011), ((0, 19), (16, 19), 9012)]}
    for mid in (900, 901):
        maps[mid] = nowa(mid, props, sz, [], stubs[mid])
        n_l = sum(1 for x in range(maps[mid]["width"]) for y in range(maps[mid]["height"]) if O.lad(O.prost(mid)[0] + x, O.prost(mid)[1] + y))
        print("nowa mapa %d %s %dx%d: ladu %d%%" % (mid, O.nazwa_mapy(mid), maps[mid]["width"], maps[mid]["height"], 100 * n_l // (maps[mid]["width"] * maps[mid]["height"])))
    # 901 <-> 18 (tymczasowo do etapu 3): wyjscie W 901 (x 0, y 18-20) do Lake#3
    for i in range(3): Z.zdarzenie_przejscia(maps[901], 0, 18 + i, 18, 78, 14 + i, 4, "Przejście -> Łąka#3 (tymczasowe do etapu 3)")
    # MapInfos
    mi, lay = W.read_json("data/MapInfos.json")
    sumy["MapInfos"] = hashlib.sha256(open(os.path.join(ROOT, "data", "MapInfos.json"), "rb").read()).hexdigest()
    ids = {e["id"] for e in mi if e}
    nast = max(e["order"] for e in mi if e) + 1
    for k, (mid, par) in enumerate(((900, 4), (901, 24))):
        assert mid not in ids
        while len(mi) <= mid: mi.append(None)
        mi[mid] = {"id": mid, "expanded": False, "name": O.nazwa_mapy(mid), "order": nast + k, "parentId": par, "scrollX": 0, "scrollY": 0}
    open(os.path.join(DATA, "MapInfos.json"), "wb").write(W.json_text(mi, lay))
    for mid, m in sorted(maps.items()):
        open(os.path.join(DATA, "Map%03d.json" % mid), "wb").write(W.json_text(m, "map")); print("zapisano Map%03d" % mid)
    sumy.update(Z.sumy)
    json.dump(sumy, open(os.path.join(STG, "sumy.json"), "w"), indent=1)
    json.dump({"nowe_mapy": [900, 901], "linki": linki}, open(os.path.join(STG, "ogon2.json"), "w"), indent=1)


if __name__ == "__main__":
    glowna()
