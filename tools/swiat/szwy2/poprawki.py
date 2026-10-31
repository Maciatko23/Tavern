# -*- coding: utf-8 -*-
"""Poprawki szwów rundy 2: poprawki_szwow po przeglądzie obrazów. przed_szwami (suche koryto 901) wyłączone: to zatoka morza."""
import copy
import wspolne as W

RZEKA = 901                       # mapa nie-gracza; woda rzeki zamieniona na suche koryto (decyzja gracza: ślad po rzece, bez wody)
DNO, SKARPA = 17, 17              # jedno brązowe podłoże dla brzegu i dna (dwa rodzaje dawały zielony rant w środku koryta)
OTOCZAKI = 5                      # liczba kamyków (kopie zdarzenia "Płaski kamień" tej mapy)


def _woda(M, x, y): return 2048 <= M.t(0, x, y) < 2816 or 2048 <= M.t(1, x, y) < 2816


def _partner_wolny(maps, MM, x, y):
    if 125 not in MM: return False
    ax, ay = maps[RZEKA][:2]; bx, by = maps[125][:2]
    cx, cy = x + ax - bx, (ay + y + 1) - by
    return MM[125].inside(cx, cy) and MM[125].stoi(cx, cy)


def przed_szwami(maps, MM, work, dirty, st):
    return        # WYŁĄCZONE: woda na dole 901 to zatoka morza (pod 901 dla x >= 552 nie ma mapy), nie rzeka - zostaje z data/
    """woda rzeki 901 -> suche koryto. Kratki wody, których sąsiad w 125 jest wodą (ujście do basenu), zostają wodą."""
    if RZEKA not in MM: return
    M, m = MM[RZEKA], work[RZEKA]
    ax, ay = maps[RZEKA][0], maps[RZEKA][1]
    woda = {(x, y) for y in range(M.H) for x in range(M.W) if _woda(M, x, y)}
    if not woda: return
    ujscie = set()
    if 125 in MM:
        bx, by = maps[125][0], maps[125][1]
        for (x, y) in woda:
            if y == M.H - 1:
                cx, cy = x + ax - bx, 0 + (ay + y) - by
                if MM[125].inside(cx, cy) and _woda(MM[125], cx, cy): ujscie.add((x, y))
    koryto = woda - ujscie
    for (x, y) in koryto:
        brzeg = any((x + dx, y + dy) not in koryto and (x + dx, y + dy) not in ujscie for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)) if M.inside(x + dx, y + dy))
        # brzeg przy krawędzi mapy (sąsiad poza mapą) liczy się jako dno: koryto idzie dalej w 125
        W.put(m, 0, x, y, 2048 + (SKARPA if brzeg else DNO) * 48); W.put(m, 1, x, y, 0)
        dirty[RZEKA].add((x, y)); st.kr(RZEKA)
        if y == M.H - 1 and not _partner_wolny(maps, MM, x, y):
            W.put(m, 5, x, y, 2)          # dolny brzeg koryta bez mapy (albo bez chodliwej kratki) za krawędzią: nie do przejścia (region 2 = zawsze blokuje)
    # otoczaki: kopie zdarzenia kamienia tej mapy na dnie (z dala od krawędzi mapy)
    wzor = next((e for e in m["events"] if e and e["pages"][0]["image"]["characterName"].startswith("!$Rock_") and not any(c["code"] == 201 for p in e["pages"] for c in p["list"])), None)
    if wzor:
        import zbuduj_szwy as Z
        dno = sorted((x, y) for (x, y) in koryto if y < M.H - 1 and all((x + dx, y + dy) in koryto for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))))
        dod = 0
        for i in range(len(dno)):
            if dod >= OTOCZAKI: break
            x, y = dno[int(Z.h2(i, 3, 901) * len(dno))]
            if any(e and abs(e["x"] - x) + abs(e["y"] - y) < 6 for e in m["events"]): continue
            if Z.dodaj_zd(m, wzor, x, y): dod += 1
        M.zd = type(M.zd)(__import__("mapylib").Zdarzenie(e, M) for e in m["events"] if e); M._ev_block = None; M._tile_ev = None


PL = {1, 3, 4, 8, 13, 23, 24, 25, 26, 111}
POMIN = {13, 120}
DRZEWA = ("!$Pine_", "!$Tree_", "!$Big_Trees")


def _scieta(M, z, maps, x0, y0):
    """strona (N/S/W/E), po której korona drzewa jest ucięta krawędzią mapy mającą sąsiada w świecie, i jaka to część obrazka"""
    import numpy as np
    sp = z.sprite(M.zest)
    if not sp: return None
    im, sx, sy = sp
    a = np.array(im)[:, :, 3] > 40
    tot = a.sum()
    if not tot: return None
    ys, xs = np.where(a)
    px, py = xs + sx, ys + sy
    ma = lambda wx, wy: any(a_ <= wx < a_ + w_ and b_ <= wy < b_ + h_ for (a_, b_, w_, h_) in maps.values())
    for nm, cut, ok in (("N", (py < 0).sum(), ma(x0 + z.x, y0 - 1)), ("S", (py >= M.H * 48).sum(), ma(x0 + z.x, y0 + M.H)),
                        ("W", (px < 0).sum(), ma(x0 - 1, y0 + z.y)), ("E", (px >= M.W * 48).sum(), ma(x0 + M.W, y0 + z.y))):
        if ok and cut / tot > 0.3: return nm, cut / tot
    return None


def poprawki_szwow(maps, MM, work, orig, dirty, st):
    """drzewa z koroną ucięta krawędzią mapy (pień przy samej krawędzi): usuwane, gdy kratka po zdjęciu drzewa nie robi dziury na styku (sąsiad chodliwy)"""
    import mapylib as L
    for mid, M in MM.items():
        if mid in PL or mid in POMIN: continue
        m = work[mid]; x0, y0 = maps[mid][:2]
        for z in list(M.zd):
            if not z.natura or not z.char.startswith(DRZEWA) or z.przenosi or not m["events"][z.id]: continue
            r = _scieta(M, z, maps, x0, y0)
            if not r: continue
            side, frac = r
            d = {"N": z.y, "S": M.H - 1 - z.y, "W": z.x, "E": M.W - 1 - z.x}[side]
            if d > 0: continue
            if d == 0:
                # kratka pnia leży na krawędzi: sąsiad po drugiej stronie styku musi mieć kratkę chodliwą (inaczej zdjęcie drzewa otwiera ścianę)
                wx, wy = x0 + z.x + {"W": -1, "E": 1}.get(side, 0), y0 + z.y + {"N": -1, "S": 1}.get(side, 0)
                ok = False
                for b, (bx, by, bw, bh) in maps.items():
                    if b != mid and bx <= wx < bx + bw and by <= wy < by + bh and MM[b].stoi(wx - bx, wy - by): ok = True
                if not ok: continue
            m["events"][z.id] = None
            st.kr(mid, 0)
    for mid, M in MM.items():
        pass
