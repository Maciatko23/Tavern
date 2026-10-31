# -*- coding: utf-8 -*-
"""Budowa ogona (czesc 4) i wyjsc: wywoluje zbuduj.glowna(). Patrz ogon.py (narzedzia)."""
import copy
from ogon import *


def rozszerz(m, nw, nh):
    """mapa wieksza w prawo i w dol (nowe kratki puste); stara zawartosc zostaje na miejscu"""
    W0, H0 = m["width"], m["height"]
    new = []
    for z in range(6):
        for y in range(nh):
            if y < H0: new += m["data"][(z * H0 + y) * W0:(z * H0 + y + 1) * W0] + [0] * (nw - W0)
            else: new += [0] * nw
    m["data"] = new; m["width"], m["height"] = nw, nh


def usun_zasoby_w(m, cells):
    for i, e in enumerate(m["events"]):
        if e and (e["x"], e["y"]) in cells and e["pages"][0]["image"]["characterName"].startswith("!$") and e["pages"][0]["list"][0]["code"] != 201:
            m["events"][i] = None


OPP = {"N": "S", "S": "N", "E": "W", "W": "E"}


def szlak13(m13):
    """Szlak gorski w Gorach (13): sciezka od bramy N miasta (S krawedz x 40-42) do stopy wspinaczki orla (53,7), po istniejacych przejsciach pieszych
    (A* po przechodnich kratkach), przemalowana na ziemie (kind 17, szerokosc do 3 tam, gdzie kratki sa wolne). Nie laczy sie z 175: wspinaczka zostaje."""
    import heapq, mapylib
    mp = mapylib.Mapa(13, raw=m13)
    D = {6: (1, 0), 4: (-1, 0), 2: (0, 1), 8: (0, -1)}
    s0, g = (41, 94), (53, 7)
    pq = [(0, s0)]; d = {s0: 0}; pr = {}
    while pq:
        _, u = heapq.heappop(pq)
        if u == g: break
        for k, (dx, dy) in D.items():
            v = (u[0] + dx, u[1] + dy)
            if not mp.mozna_wejsc(u[0], u[1], k): continue
            n = d[u] + 1
            if n < d.get(v, 1e9): d[v] = n; pr[v] = u; heapq.heappush(pq, (n + abs(v[0] - g[0]) + abs(v[1] - g[1]), v))
    if g not in d: print("UWAGA: szlak w Gorach: brak drogi pieszej do stopy wspinaczki"); return
    path = [g]
    while path[-1] != s0: path.append(pr[path[-1]])
    n = 0
    for (x, y) in path:
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                cx, cy = x + dx, y + dy
                if not mp.inside(cx, cy) or not mp.stoi(cx, cy): continue
                if W.at(m13, 1, cx, cy) or W.at(m13, 2, cx, cy) or W.at(m13, 3, cx, cy): continue
                if W.kind_of(W.at(m13, 0, cx, cy)) in (16, 17, 24, 26, 36, 37, 39):
                    if W.kind_of(W.at(m13, 0, cx, cy)) != 17: n += 1
                    Z.kafel(m13, 0, cx, cy, K(17))
    W.reshape(m13, 0, W.ring(set(path), 2))
    print("szlak w Gorach: %d kratek sciezki, %d kratek przemalowanych na ziemie" % (len(path), n))


def buduj(maps):
    """maps: {8, 13, 111, 125} z zbuduj.py; zwraca (wszystkie mapy, linki danych)"""
    szlak13(maps[13])
    sz = szablony()
    linki = []   # {a, b, side, from, to}: a -> b, strona z a, kratki swiata wzdluz krawedzi
    out = dict(maps)
    # ---------------------------------------------------------------- 125: morze w nowej czesci (maska), wyjscie S do 21
    m125 = out[125]; ox, oy = 420, 354
    reg = {(x, y) for x in range(104, 132) for y in range(m125["height"])}
    morze = {c for c in reg if not lad(ox + c[0], oy + c[1])}
    for (x, y) in morze:
        Z.kafel(m125, 0, x, y, K(6))
        for z in (1, 2, 3, 4): Z.kafel(m125, z, x, y, 0)
    for (x, y) in reg - morze:
        if any((x + dx, y + dy) in morze for dx in (-2, -1, 0, 1, 2) for dy in (-2, -1, 0, 1, 2) if abs(dx) + abs(dy) <= 3) and W.kind_of(W.at(m125, 0, x, y)) in (16, 17):
            Z.kafel(m125, 0, x, y, K(17)); Z.kafel(m125, 1, x, y, 0)
    usun_zasoby_w(m125, morze | {(x + dx, y + dy) for (x, y) in morze for dx in (-1, 0, 1) for dy in (-1, 0, 1)})
    W.reshape(m125, 0, W.ring(reg, 1)); W.reshape(m125, 1, W.ring(reg, 1))
    pl = przejscie_ladowe(125, 21, 451)
    wolne125 = set()
    if pl:
        side, a, b = pl
        lx = a - ox
        droga(m125, [(23, 56), (25, 64), (lx - 2, 72), (lx + 1, 78), (lx + 1, 79)], ox, oy, wolne=wolne125)
        for i in range(3):
            Z.zdarzenie_przejscia(m125, lx + i, 79, 21, (a - 440) + i, 1, 2, "Przejście -> Leśna droga")
        linki.append(dict(a=125, b=21, side="S", **{"from": a, "to": b}))
        print("125 S -> 21: swiat x %d-%d (125 x %d-%d)" % (a, b, lx, lx + 2))
    else: print("UWAGA: 125 S -> 21 bez ladu")
    # ---------------------------------------------------------------- 21: +20/+20, morze, droga, wyjscia
    m21 = Z.wczytaj(21); Z.sumy[21] = Z.sha(21)
    ox21, oy21 = 440, 434
    W0, H0 = m21["width"], m21["height"]
    rozszerz(m21, 100, 80)
    m21["note"] = m21["note"].rstrip("\n") + "\n<Water:salt>"
    m21["bgs"] = {"name": "Sea", "pan": 0, "pitch": 100, "volume": 40}
    reg21 = {(x, y) for x in range(100) for y in range(80) if x >= W0 or y >= H0}
    wolne21 = set()
    for e in m21["events"]:
        if e and e["id"] in (112, 113, 114): e["x"] = 99   # wyjscia E do Gor: na nowy wschodni brzeg
    teren(m21, ox21, oy21, reg21, 21, wolne=wolne21, gestosc=0.5)
    droga(m21, [(78, 9), (99, 9)], ox21, oy21, wolne=wolne21)
    if pl:
        a = pl[1] - ox21
        wolne21 |= droga(m21, [(a + 1, 0), (a + 1, 5), (a + 5, 14), (22, 22), (30, 27), (38, 29), (40, 30)], ox21, oy21)
        for i in range(3):
            Z.zdarzenie_przejscia(m21, a + i, 0, 125, (pl[1] - 420) + i, 78, 8, "Przejście -> Przystań")
    zasoby(m21, ox21, oy21, reg21, 211, wolne21, sz, 60)
    W.reshape(m21, 0, W.ring(reg21, 1)); W.reshape(m21, 1, W.ring(reg21, 1))
    out[21] = m21
    # ---------------------------------------------------------------- nowe mapy
    props = {k: v for k, v in Z.wczytaj(125).items() if k not in ("data", "events", "width", "height")}
    for mid in (914, 917, 920, 922, 923):
        m, x0, y0, w, h = nowa_mapa(mid, props)
        reg_n = {(x, y) for x in range(w) for y in range(h)}
        wolne = set()
        sciezki = []
        for (a, b, ch) in ((125, 922, 414), (111, 917, 368), (21, 920, 454), (914, 21, 474)):
            if mid in (a, b):
                pr = przejscie_ladowe(a, b, ch)
                if pr: sciezki.append((a, b, pr))
                else: print("UWAGA: %d <-> %d: wspolna krawedz bez trzech kratek ladu po obu stronach - bez przejscia" % (a, b))
        teren(m, x0, y0, reg_n, mid, wolne=wolne, gestosc=0.45)
        for (a, b, (side, lo, hi)) in sciezki:
            mside = side if mid == a else OPP[side]
            sciezka_od_krawedzi(m, 0, 0, x0, y0, mside, (lo + hi) // 2, wolne)
            linki.append(dict(a=a, b=b, side=side, **{"from": lo, "to": hi}))
        zasoby(m, x0, y0, reg_n, mid + 5, wolne, sz, max(4, w * h // 110))
        W.reshape(m, 0, reg_n); W.reshape(m, 1, reg_n)
        out[mid] = m
        n_l = sum(1 for (x, y) in reg_n if lad(x0 + x, y0 + y))
        print("nowa mapa %d %s %dx%d: ladu %d%%" % (mid, nazwa_mapy(mid), w, h, 100 * n_l // (w * h)))
    # sciezki w istniejacych mapach strony a/b (125, 111, 21) do nowych sasiadow
    NOWE = (914, 917, 920, 922, 923)
    for l in list(linki):
        for (mine, other) in ((l["a"], l["b"]), (l["b"], l["a"])):
            if mine in out and mine not in NOWE and other in NOWE:
                mx, my, _, _ = prost(mine)
                side = l["side"] if mine == l["a"] else OPP[l["side"]]
                sciezka_od_krawedzi(out[mine], 0, 0, mx, my, side, (l["from"] + l["to"]) // 2, set())

    # ---------------------------------------------------------------- 22: +5 w prawo, wyjscie W do miasta (brama E)
    m22 = Z.wczytaj(22); Z.sumy[22] = Z.sha(22)
    rozszerz(m22, 85, 60)
    reg22 = {(x, y) for x in range(80, 85) for y in range(60)}
    teren(m22, 524, 192, reg22, 22, gestosc=0.5)
    W.reshape(m22, 0, W.ring(reg22, 1)); W.reshape(m22, 1, W.ring(reg22, 1))
    for e in m22["events"]:
        if e and e["id"] in (59, 60, 61): e["x"] = 84
    for i in (65, 66, 67): m22["events"][i] = None   # dawne N do miasta (S bramy miasta): zastapione wyjsciem W
    droga(m22, [(0, 42), (10, 42)], 524, 192)
    for i in range(3):
        Z.zdarzenie_przejscia(m22, 0, 41 + i, 8, 102, 17 + i, 4, "Przejście -> Okolice Tawerny (brama wschodnia)")
    out[22] = m22
    for e in m21["events"]:
        if e and e["id"] in (109, 110, 111):
            c = e["pages"][0]["list"][0]; c["parameters"] = [0, 22, 83, c["parameters"][3], 4, 0]
    linki.append(dict(a=8, b=22, side="E", **{"from": 233, "to": 235}))
    # ---------------------------------------------------------------- 8: brama wschodnia y 17-19 -> 22
    m8 = out[8]
    for y in (17, 18, 19):
        for x, src in ((102, 100), (103, 101)):
            Z.kafel(m8, 0, x, y, W.at(m8, 0, src, y))
            for zz in (3, 4, 5): Z.kafel(m8, zz, x, y, 0)
    szab = {e["id"]: e for e in m8["events"] if e}
    # brama wschodnia na wzor zachodniej (!$West_Gate odbita lustrzanie, tools/swiat/etap1/brama_obrazy.py): dach i slupy nad bohaterem, skrzydlo i cien pod nim
    roof = copy.deepcopy(szab[243]); roof["name"] = "Brama wschodnia: dach i słupy"; roof["x"], roof["y"] = 102, 20
    roof["pages"][0]["image"].update({"characterName": "!$East_Gate", "direction": 2, "pattern": 1}); roof["pages"][0]["priorityType"] = 2
    leaf = copy.deepcopy(szab[244]); leaf["name"] = "Brama wschodnia: skrzydło i cień"; leaf["x"], leaf["y"] = 102, 18
    leaf["pages"][0]["image"].update({"characterName": "!$East_Gate", "direction": 4, "pattern": 1}); leaf["pages"][0]["priorityType"] = 0
    lamp = copy.deepcopy(szab[239]); lamp["name"] = "Brama wschodnia: światło latarni"; lamp["x"], lamp["y"] = 103, 17
    lamp["note"] = "<Light:190,255,160,90><LightWhen:night><LightFlicker:0.13,255,130,55><LightHeight:0>"
    for ev in (roof, leaf, lamp): Z.dodaj(m8, ev)
    for i in range(3):
        Z.zdarzenie_przejscia(m8, 103, 17 + i, 22, 1, 41 + i, 6, "Przejście -> Polna droga (brama wschodnia)")
    return out, linki
