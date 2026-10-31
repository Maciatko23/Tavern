# -*- coding: utf-8 -*-
"""ETAP 2 swiata, PARTIA 2 (prawe skrzydlo): 120 Osada (woda -> lad wg maski), 159 Przylad (tylko przejscia), 168 Spalona zagroda (+30/+20),
17 Lake#2 (+0/+20), 22 (N do 120), 20 (S do 923), nowe 912, 932, 934, 936; drogi 900 -> 168, 168 <-> 912/932, 120 <-> 934/159, 22 <-> 120.
Baza: data/ po instalacji partii 1 (osobny staging: tools/swiat/etap2/staging_b/). Mapy gracza (3, 4, 23, 24) nie sa ruszane.
  python tools/swiat/etap2/zbuduj2b.py"""
import os, sys, json, copy, hashlib
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
E1 = os.path.join(ROOT, "tools", "swiat", "etap1")
for p in (E1, HERE, os.path.join(ROOT, "tools", "rozszerzenia"), os.path.join(ROOT, "tools", "mapy")): sys.path.insert(0, p)
import zbuduj as Z
import ogon as O
import ogon_buduj as OB
import sciezki as SC
W = Z.W
K = Z.K
STG = os.path.join(HERE, "staging_b"); DATA = os.path.join(STG, "data")
os.makedirs(DATA, exist_ok=True)
sumy = {}
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
OPP = OB.OPP
DIRN = {"N": 8, "S": 2, "E": 6, "W": 4}


def wczytaj(mid):
    sumy[mid] = Z.sha(mid)
    return Z.wczytaj(mid)


def sc(m, mid, start, goal, seed, **kw):
    m["_id"] = mid
    try: r = SC.maluj(m, start, goal, seed, **kw)
    finally: del m["_id"]
    if r is None: print("UWAGA: brak sciezki %d %s -> %s" % (mid, start, goal))
    return r or set()


def lokalne(mid, side, pos):
    """kratka lokalna na krawedzi mapy mid (strona side) dla kratki swiata pos wzdluz krawedzi"""
    x0, y0, w, h = O.prost(mid)
    if side == "N": return (pos - x0, 0)
    if side == "S": return (pos - x0, h - 1)
    if side == "W": return (0, pos - y0)
    return (w - 1, pos - y0)


def otworz(m, cells):
    """3 kratki na krawedzi (i jedna do srodka): bez gestwiny i bez regionu blokujacego (tylko mapy nie gracza)"""
    for (x, y) in cells:
        for z in (1, 2, 3): Z.kafel(m, z, x, y, 0)
        Z.kafel(m, 5, x, y, 0)
    OB.usun_zasoby_w(m, set(cells))


def wewn(side):  # krok do srodka od krawedzi
    return {"N": (0, 1), "S": (0, -1), "W": (1, 0), "E": (-1, 0)}[side]


def wyjscie(maps, a, b, p, nazwa_a, nazwa_b, linki, seed, glebia=16):
    """przejscie a -> b (a: strona side, kratki swiata lo..hi): zdarzenia po obu stronach, krawedz otwarta, scieżki w glab; dane do Swiat_Data.links"""
    side, lo, hi = p
    ma, mb = maps[a], maps[b]
    for (m, mid, sd, dst, nm) in ((ma, a, side, b, nazwa_a), (mb, b, OPP[side], a, nazwa_b)):
        cells = [lokalne(mid, sd, pos) for pos in range(lo, hi + 1)]
        w, h = m["width"], m["height"]
        cx, cy = wewn(sd)
        otworz(m, cells + [(x + cx * k, y + cy * k) for (x, y) in cells for k in (1, 2, 3, 4)])
        W.reshape(m, 1, W.ring(set(cells) | {(x + cx * 5, y + cy * 5) for (x, y) in cells}, 2))
        # cel w drugiej mapie: ta sama kratka swiata
        other_side = OPP[sd]
        for k, pos in enumerate(range(lo, hi + 1)):
            lx, ly = lokalne(dst, other_side, pos)
            ix, iy = wewn(other_side)
            Z.zdarzenie_przejscia(m, cells[k][0], cells[k][1], dst, lx + ix, ly + iy, DIRN[sd], nm)
        mid_c = cells[1]
        goal = (min(max(mid_c[0] + cx * glebia, 0), w - 1), min(max(mid_c[1] + cy * glebia, 0), h - 1))
        m["_id"] = mid
        near = SC.najblizsza(m, goal) if SC.najblizsza(m, goal) else None
        del m["_id"]
        if near and abs(near[0] - mid_c[0]) + abs(near[1] - mid_c[1]) < 40: goal = near
        sc(m, mid, mid_c, goal, seed + mid)
    linki.append(dict(a=a, b=b, side=side, **{"from": lo, "to": hi}))


def rozszerz_teren(m, mid, nw, nh, seed, sz, ile):
    ox, oy, _, _ = O.prost(mid)
    W0, H0 = m["width"], m["height"]
    OB.rozszerz(m, nw, nh)
    if "<Water:salt>" not in m["note"]: m["note"] = m["note"].rstrip(chr(10)) + chr(10) + "<Water:salt>"
    m["bgs"] = {"name": "Sea", "pan": 0, "pitch": 100, "volume": 40}
    reg = {(x, y) for x in range(nw) for y in range(nh) if x >= W0 or y >= H0}
    wolne = set()
    O.teren(m, ox, oy, reg, seed, wolne=wolne, gestosc=0.45)
    O.zasoby(m, ox, oy, reg, seed + 5, wolne, sz, ile)
    W.reshape(m, 0, W.ring(reg, 1)); W.reshape(m, 1, W.ring(reg, 1))
    return reg


def laty_podloza(m, region, seed, p27=0.46, p17=0.74):
    """plamy podloza jak w starej czesci (kind 27 ciemniejsza trawa, kind 17 ziemia) w nowych kratkach trawy (kind 16), z wolnego szumu"""
    import random
    rnd = random.Random(seed)
    g = [[rnd.random() for _ in range(80)] for _ in range(80)]
    def noise(x, y, sc):
        fx, fy = x / sc, y / sc; ix, iy = int(fx) % 78, int(fy) % 78; ax, ay = fx - int(fx), fy - int(fy)
        ax = ax * ax * (3 - 2 * ax); ay = ay * ay * (3 - 2 * ay)
        a = g[iy][ix] * (1 - ax) + g[iy][ix + 1] * ax; b = g[iy + 1][ix] * (1 - ax) + g[iy + 1][ix + 1] * ax
        return a * (1 - ay) + b * ay
    out = set()
    for (x, y) in region:
        if W.kind_of(W.at(m, 0, x, y)) != 16: continue
        n = 0.65 * noise(x, y, 7.0) + 0.35 * noise(x, y, 3.0)
        if n > p17: Z.kafel(m, 0, x, y, K(17)); out.add((x, y))
        elif n > p27: Z.kafel(m, 0, x, y, K(27)); out.add((x, y))
    W.reshape(m, 0, W.ring(out, 1))


def wtop(m, x0, x1, y0, y1, seed):
    """roztapia szew starej i nowej czesci: pas x0..x1 (y0..y1) - ciemne podloze lasu (warstwa 1, kind 20) zostaje tylko plamami z wolnego szumu,
    reszta wraca do trawy; ta sama zasada po obu stronach, wiec granica jest nieregularna"""
    import random, math
    rnd = random.Random(seed)
    g = [[rnd.random() for _ in range(40)] for _ in range(40)]
    def noise(x, y):
        fx, fy = x / 4.0, y / 4.0; ix, iy = int(fx) % 38, int(fy) % 38; ax, ay = fx - int(fx), fy - int(fy)
        a = g[iy][ix] * (1 - ax) + g[iy][ix + 1] * ax; b = g[iy + 1][ix] * (1 - ax) + g[iy + 1][ix + 1] * ax
        return a * (1 - ay) + b * ay
    cells = set()
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if W.kind_of(W.at(m, 1, x, y)) == 20:
                cells.add((x, y))
                if noise(x, y) > 0.42: Z.kafel(m, 1, x, y, 0)
    W.reshape(m, 1, W.ring(cells, 1))


def glowna():
    sz = O.szablony()
    maps = {}
    # ---------------- istniejace mapy
    maps[120] = wczytaj(120)
    # 120: woda -> lad wg maski (woda mapy, ktora maska ma ladem)
    m = maps[120]; ox, oy, w, h = O.prost(120)
    wodne = {(x, y) for x in range(w) for y in range(h) if W.kind_of(W.at(m, 0, x, y)) == 6 and O.lad(ox + x, oy + y)}
    print("120: woda -> lad: %d kratek" % len(wodne))
    O.teren(m, ox, oy, wodne, 120, gestosc=0.45)
    O.zasoby(m, ox, oy, wodne, 125, set(), sz, max(0, len(wodne) // 60))
    W.reshape(m, 0, W.ring(wodne, 1)); W.reshape(m, 1, W.ring(wodne, 1))
    maps[159] = wczytaj(159)
    maps[168] = wczytaj(168)
    rozszerz_teren(maps[168], 168, 130, 108, 168, sz, 90)
    wtop(maps[168], 94, 108, 0, 107, 1680)
    for y in range(88):   # pas starej czesci przy szwie: podloze od nowa tym samym szumem co nowa czesc
        for x in range(92, 100):
            if W.kind_of(W.at(maps[168], 0, x, y)) in (17, 27): Z.kafel(maps[168], 0, x, y, K(16))
    laty_podloza(maps[168], {(x, y) for x in range(92, 130) for y in range(108)}, 1681)
    maps[17] = wczytaj(17)
    # ucieta krawedz 125 N / 901 S (swiat x 549): maska ma tam lad (y 352-353), a mapy wode: kratki zamieniam na plaze (125 (129,0), 901 (25,40-41))
    maps[125] = wczytaj(125); maps[901] = wczytaj(901)
    for (mm, cells) in ((maps[125], []), (maps[901], [])):   # (z przywrocona maska ucietej krawedzi 125 N nie ma: bez zmian)
        for (x, y) in cells: Z.kafel(mm, 0, x, y, K(17)); [Z.kafel(mm, z, x, y, 0) for z in (1, 2, 3)]
        W.reshape(mm, 0, W.ring(set(cells), 1))
    rozszerz_teren(maps[17], 17, 80, 96, 17, sz, 30)
    maps[22] = wczytaj(22)
    maps[20] = wczytaj(20)
    maps[900] = wczytaj(900)
    # ---------------- nowe mapy brzegowe
    props = {k: v for k, v in Z.wczytaj(4).items() if k not in ("data", "events", "width", "height")}
    for mid in (912, 933, 934):   # 936 (0% ladu) pomijam; 933 ma ladowe dojscie z 17 (wspolna krawedz E, swiat y 349-351)
        m, x0, y0, w, h = O.nowa_mapa(mid, props)
        reg = {(x, y) for x in range(w) for y in range(h)}
        wolne = set()
        O.teren(m, x0, y0, reg, mid, wolne=wolne, gestosc=0.4)
        O.zasoby(m, x0, y0, reg, mid + 5, wolne, sz, max(4, w * h // 110))
        W.reshape(m, 0, reg); W.reshape(m, 1, reg)
        maps[mid] = m
        n_l = sum(1 for (x, y) in reg if O.lad(x0 + x, y0 + y))
        print("nowa mapa %d %s %dx%d: ladu %d%%" % (mid, O.nazwa_mapy(mid), w, h, 100 * n_l // (w * h)))
    # dawne wyjscie 168 -> 23 na x 99 (zdarzenia 56-58) stoi po rozszerzeniu w srodku mapy: usuwam; w swiecie 23 lezy na ZACHOD od 168 (wspolna
    # krawedz 23 E / 168 W, kratki swiata y 279-281): przejscie robi Swiat_Data (bez zdarzen), po stronie 168 otwarty brzeg i sciezka
    for i in (56, 57, 58): maps[168]["events"][i] = None
    maps["_23link"] = None
    # 923 istnieje (etap 1): dokladamy tylko wyjscie z 20
    if '923' in O.SWIAT['mapy']: maps[923] = wczytaj(923)
    # ---------------- przejscia
    linki = []
    del maps["_23link"]
    p23 = O.przejscie_ladowe(168, 23, 280)
    m168 = maps[168]
    cells = [lokalne(168, "W", pos) for pos in range(p23[1], p23[2] + 1)]
    otworz(m168, [(x + k, y) for (x, y) in cells for k in range(0, 5)])
    W.reshape(m168, 1, W.ring(set(cells) | {(x + 5, y) for (x, y) in cells}, 2))
    m168["_id"] = 168; cel = SC.najblizsza(m168, (16, cells[1][1])); del m168["_id"]
    sc(m168, 168, cells[1], cel or (16, cells[1][1]), 1683)
    linki.append(dict(a=168, b=23, side="W", **{"from": p23[1], "to": p23[2]}))
    print("168 W <-> 23 E: swiat y %d-%d" % (p23[1], p23[2]))
    spis = [(22, 120, 570, "Przejście -> Osada Milczących", "Przejście -> Polna droga"),
            (120, 934, 590, "Przejście -> Północny brzeg pól (ścieżka brzegowa)", "Przejście -> Osada Milczących"),
            (120, 159, 153, "Przejście -> Przylądek z latarnią (szlak latarni)", "Przejście -> Osada Milczących (szlak latarni)"),
            (900, 168, 233, "Przejście -> Spalona zagroda (droga)", "Przejście -> Pola pod grzbietem (droga)"),
            (168, 912, 824, "Przejście -> Północny brzeg pól II", "Przejście -> Spalona zagroda"),
            (17, 933, 350, "Przejście -> Wschodni brzeg ogona (ścieżka brzegowa)", "Przejście -> Łąka#2"),
            (20, 923, 676, "Przejście -> Cypel ogona II", "Przejście -> Dom dziadka")]
    for (a, b, ch, na, nb) in spis:
        if str(a) not in O.SWIAT['mapy'] or str(b) not in O.SWIAT['mapy']: print('POMINIETE (mapy nie ma w swiat.json): %d <-> %d' % (a, b)); continue
        p = O.przejscie_ladowe(a, b, ch)
        if not p: print("UWAGA: %d <-> %d: brak 3 kratek ladu po obu stronach" % (a, b)); continue
        wyjscie(maps, a, b, p, na, nb, linki, 100 * a + b)
        print("przejscie %d -> %d: %s swiat %d-%d" % (a, b, p[0], p[1], p[2]))
    # 159 <-> 936: sprawdz, czy jest lad po obu stronach (inaczej morze)
    # ---------------- MapInfos
    mi, lay = W.read_json("data/MapInfos.json")
    sumy["MapInfos"] = hashlib.sha256(open(os.path.join(ROOT, "data", "MapInfos.json"), "rb").read()).hexdigest()
    ids = {e["id"] for e in mi if e}
    nast = max(e["order"] for e in mi if e) + 1
    rodzic = {912: 168, 933: 168, 934: 120}
    for k, mid in enumerate((912, 933, 934)):
        assert mid not in ids
        while len(mi) <= mid: mi.append(None)
        mi[mid] = {"id": mid, "expanded": False, "name": O.nazwa_mapy(mid), "order": nast + k, "parentId": rodzic[mid], "scrollX": 0, "scrollY": 0}
    open(os.path.join(DATA, "MapInfos.json"), "wb").write(W.json_text(mi, lay))
    for mid, m in sorted(maps.items()):
        open(os.path.join(DATA, "Map%03d.json" % mid), "wb").write(W.json_text(m, "map"))
    print("zapisano mapy:", sorted(maps))
    import zbuduj as _z
    sumy.update(_z.sumy)
    json.dump(sumy, open(os.path.join(STG, "sumy.json"), "w"), indent=1)
    json.dump({"nowe_mapy": [912, 933, 934], "linki": linki}, open(os.path.join(STG, "ogon2b.json"), "w"), indent=1)


if __name__ == "__main__":
    glowna()
