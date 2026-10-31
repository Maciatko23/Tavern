# -*- coding: utf-8 -*-
"""ETAP 3 swiata, PARTIA 1 (lewe skrzydlo): 111 (W -> 162), 162 (+20 w dol), 165, 18 (+10), 157 (+10), 155 (+42), 13 (tylko W -> 157),
21 (bez wyjscia E do Gor), 901 (bez tymczasowego W do 18), nowe 910, 918, 919, 930, 932 (935 i 931 glowa: partia 2). Wszystko na kopiach: staging/data.
Baza: data/ po instalacji etapu 2. Polozenia, rozmiary i numery TYLKO z docs/mapy/swiat_uklad.json, maska TYLKO z swiat_maska.png (niczego nie przeliczam).
  python tools/swiat/etap3/zbuduj3.py"""
import os, sys, json, copy, hashlib
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
E1 = os.path.join(ROOT, "tools", "swiat", "etap1"); E2 = os.path.join(ROOT, "tools", "swiat", "etap2")
for p in (E1, E2, HERE, os.path.join(ROOT, "tools", "rozszerzenia"), os.path.join(ROOT, "tools", "mapy")): sys.path.insert(0, p)
import zbuduj as Z
import ogon as O
import ogon_buduj as OB
import sciezki as SC
import zbuduj2b as B2
W = Z.W
K = Z.K
STG = os.path.join(HERE, "staging"); DATA = os.path.join(STG, "data")
os.makedirs(DATA, exist_ok=True)
sumy = {}
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
OPP = OB.OPP
B2.sumy = sumy   # wczytaj() z zbuduj2b zapisuje skroty tutaj


def wczytaj(mid):
    sumy[mid] = Z.sha(mid)
    return Z.wczytaj(mid)


def wtop_pas(m, x0, x1, y0, y1, seed):
    """roztapia szew: ciemne podloze lasu (warstwa 1 kind 20) zostaje plamami, podloze (kind 17/27) w pasie od nowa tym samym szumem"""
    B2.wtop(m, x0, x1, y0, y1, seed)
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if W.kind_of(W.at(m, 0, x, y)) in (17, 27): Z.kafel(m, 0, x, y, K(16))
    B2.laty_podloza(m, {(x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)}, seed + 1)


def rozszerz(m, mid, nw, nh, seed, sz, ile):
    reg = B2.rozszerz_teren(m, mid, nw, nh, seed, sz, ile)
    return reg


def zasyp_wode(m, mid, seed, sz):
    """woda mapy (kind 6), na ktorej maska ma lad -> teren z maski (jak w 120)"""
    ox, oy, w, h = O.prost(mid)
    wodne = {(x, y) for x in range(min(w, m["width"])) for y in range(min(h, m["height"])) if W.kind_of(W.at(m, 0, x, y)) == 6 and O.lad(ox + x, oy + y)}
    if wodne:
        O.teren(m, ox, oy, wodne, seed, gestosc=0.45)
        O.zasoby(m, ox, oy, wodne, seed + 5, set(), sz, max(0, len(wodne) // 70))
        W.reshape(m, 0, W.ring(wodne, 1)); W.reshape(m, 1, W.ring(wodne, 1))
    print("%d: woda -> lad: %d kratek" % (mid, len(wodne)))
    return wodne


def usun(m, ids):
    for i in ids:
        if i < len(m["events"]): m["events"][i] = None


def glowna():
    sz = O.szablony()
    maps = {}
    linki = []
    # ---------------- istniejace mapy
    maps[111] = wczytaj(111)
    for e in maps[111]["events"]:    # W: dawna lesna sciezka do Przystani -> Garnizon w TEJ SAMEJ kratce swiata ((318,268) -> 162 (111,8))
        if e and e["id"] == 92: e["pages"][0]["list"][0]["parameters"] = [0, 162, 110, 8, 4, 0]; e["name"] = "Przejście -> Garnizon nad zatoką"
    maps[162] = wczytaj(162)
    # woda TWARDA (162, 165, 155, 157): morze pod klifami zostaje, nowe kratki wg maski
    rozszerz(maps[162], 162, 112, 100, 162, sz, 40)
    wtop_pas(maps[162], 0, 111, 74, 99, 1622)
    B2.otworz(maps[162], [(x, y) for x in range(1, 4) for y in (19, 20, 21, 22)])   # laduje tu lacha z Wraku (165): bez lasu
    W.reshape(maps[162], 1, W.ring({(x, y) for x in range(1, 4) for y in (19, 20, 21, 22)}, 2))
    usun(maps[162], (138, 139, 140))                      # dawne N do Przystani: 125 nie sasiaduje z 162
    # E: otwarta krawedz do Podgrodzia (swiat y 267-269 = lokalnie 7-9), sciezka od istniejacej drogi
    m162 = maps[162]
    p = O.przejscie_ladowe(162, 111, 268)
    if p:
        cells = [B2.lokalne(162, "E", pos) for pos in range(p[1], p[2] + 1)]
        B2.otworz(m162, [(x - k, y) for (x, y) in cells for k in range(0, 5)])
        W.reshape(m162, 1, W.ring(set(cells) | {(x - 5, y) for (x, y) in cells}, 2))
        m162["_id"] = 162; cel = SC.najblizsza(m162, (96, cells[1][1])); del m162["_id"]
        B2.sc(m162, 162, cells[1], cel or (96, cells[1][1]), 1621)
        linki.append(dict(a=111, b=162, side="W", **{"from": p[1], "to": p[2]}))
        print("111 W <-> 162 E: swiat y %d-%d" % (p[1], p[2]))
    maps[165] = wczytaj(165)   # bez zmian (lacha jak dzis); Swiat_Data: polozenie (126, 260)
    maps[18] = wczytaj(18)
    zasyp_wode(maps[18], 18, 180, sz)
    rozszerz(maps[18], 18, 90, 76, 18, sz, 12)
    wtop_pas(maps[18], 72, 84, 0, 75, 1800)
    usun(maps[18], (72, 73, 74))                          # tymczasowe E do 901 (Sady): koniec
    maps[901] = wczytaj(901)
    usun(maps[901], (38, 39, 40))                         # tymczasowe W do 18
    maps[157] = wczytaj(157)
    rozszerz(maps[157], 157, 122, 72, 157, sz, 15)
    wtop_pas(maps[157], 104, 118, 0, 71, 1571)
    maps[155] = wczytaj(155)
    Z.kafel(maps[155], 0, 95, 3, K(17)); W.reshape(maps[155], 0, W.ring({(95, 3)}, 1))   # POPRAWKI_WODY: 1 kratka piasku na styku 155/157
    usun(maps[155], (49, 50, 51))                         # dawne S do Przystani
    maps[13] = wczytaj(13)
    # ---------------- PARTIA 2: Orla Gran (175, +60 w prawo), glowa (931, 935, 936), 13 N <-> 175
    maps[175] = wczytaj(175)
    O.KIND.update(trawa=24, plaza=25, las=0)   # glowa: podloze skalne jak w 175 (kind 24 / 25), bez lasu
    zasyp_wode(maps[175], 175, 1750, sz)
    rozszerz(maps[175], 175, 156, 60, 175, sz, 25)
    O.KIND.update(trawa=16, plaza=17, las=20)
    wtop_pas(maps[175], 80, 100, 0, 59, 1751)
    maps[21] = wczytaj(21)
    maps[120] = wczytaj(120)
    # 120 W <-> 13 E (szlak latarni, swiat y 134-136 = 120 lokalnie 10-12): otwarty brzeg w lesie Osady i sciezka od istniejacej drogi
    c120 = [B2.lokalne(120, "W", pos) for pos in range(134, 137)]
    B2.otworz(maps[120], [(x + k, y) for (x, y) in c120 for k in range(0, 8)])
    for (x, y) in [(x + k, y) for (x, y) in c120 for k in range(0, 8)]:
        if W.at(maps[120], 0, x, y) < 2048: Z.kafel(maps[120], 0, x, y, K(16))   # nie-autokafel na warstwie 0 (B-E) blokowal
    W.reshape(maps[120], 0, W.ring(set(c120) | {(x + 8, y) for (x, y) in c120}, 2))
    W.reshape(maps[120], 1, W.ring(set(c120) | {(x + 8, y) for (x, y) in c120}, 2))
    maps[120]["_id"] = 120; cel = SC.najblizsza(maps[120], (14, c120[1][1])); del maps[120]["_id"]
    B2.sc(maps[120], 120, c120[1], cel or (14, c120[1][1]), 1201)
    usun(maps[21], (112, 113, 114))                       # E (99, 8-10) do Gor: 21 sasiaduje z 920, nie z 13
    # ---------------- nowe mapy brzegowe lewego skrzydla
    # nowe mapy lewego skrzydla: tileset 11 jak 155/157/162 (nie 9 z Map004), notatka morska; glowa (931, 935, 936) jak 175
    def props_z(mid, note):
        pr = {k: v for k, v in Z.wczytaj(mid).items() if k not in ("data", "events", "width", "height")}
        pr["note"] = note; pr["encounterList"] = []
        return pr
    props_lewe = props_z(157, "<Clouds:on>\n<Farm:off>\n<Water:salt>")
    props_glowa = props_z(175, "<Clouds:on>\n<Hunt:off>\n<Bear:off>\n<Camp:off>\n<Farm:off>\n<Build:off>\n<Water:salt>")
    nowe = []
    for mid in (910, 918, 950, 951, 931, 935, 936):   # 930 i 932: bez ladowego styku z 157 wg maski (tylko 1 wspolna kratka ladu) - pomijam
        x0, y0, w, h = O.prost(mid)
        n_l = sum(1 for x in range(w) for y in range(h) if O.lad(x0 + x, y0 + y))
        print("mapa %d %dx%d: ladu %d%%" % (mid, w, h, 100 * n_l // (w * h)))
        if n_l < 0.02 * w * h: print("  pomijam (prawie sam morze)"); continue
        if mid in (931, 935, 936): O.KIND.update(trawa=24, plaza=25, las=0)
        m, x0, y0, w, h = O.nowa_mapa(mid, props_glowa if mid in (931, 935, 936) else props_lewe)
        reg = {(x, y) for x in range(w) for y in range(h)}
        wolne = set()
        O.teren(m, x0, y0, reg, mid, wolne=wolne, gestosc=0.4)
        O.zasoby(m, x0, y0, reg, mid + 5, wolne, sz, max(4, w * h // 110))
        W.reshape(m, 0, reg); W.reshape(m, 1, reg)
        maps[mid] = m; nowe.append(mid)
        O.KIND.update(trawa=16, plaza=17, las=20)
    # ---------------- przejscia (zdarzenia po obu stronach, sciezki od krawedzi; mapy gracza: 13 tylko zdarzenia)
    spis = [(931, 175, 456, "Przejście -> Orla Grań", "Przejście -> Grań nad szczytem"),
            (935, 931, 42, "Przejście -> Grań nad szczytem", "Przejście -> ścieżka brzegowa"),
            (159, 936, 130, "Przejście -> Północny brzeg pól III", "Przejście -> Przylądek z latarnią"),
(157, 13, 160, "Przejście -> Góry i kamieniołom", "Przejście -> Urwisko Kruków"),
            (155, 157, 180, "Przejście -> Urwisko Kruków", "Przejście -> Pustelnia na klifie"),
            (155, 950, 199, "Przejście -> Zbocze pod Pustelnią", "Przejście -> Pustelnia na klifie"),
            (910, 950, 224, "Przejście -> Zbocze pod Pustelnią", "Przejście -> Północny klif"),
            (918, 910, 205, "Przejście -> Północny klif", "Przejście -> ścieżka brzegowa"),
            (910, 18, 91, "Przejście -> Łąka#3", "Przejście -> Północny klif"),
            (951, 162, 340, "Przejście -> Garnizon nad zatoką", "Przejście -> Zachodnie klify"),
            ]
    for (a, b, ch, na, nb) in spis:
        if a not in maps or b not in maps: print("POMINIETE (brak mapy): %d <-> %d" % (a, b)); continue
        if a in (931, 935, 936, 175) or b in (931, 935, 936): O.KIND.update(trawa=24, plaza=25, las=0)
        else: O.KIND.update(trawa=16, plaza=17, las=20)
        p = O.przejscie_ladowe(a, b, ch)
        if not p: print("UWAGA: %d <-> %d: brak 3 kratek ladu po obu stronach" % (a, b)); continue
        if 13 in (a, b):
            # mapa gracza 13: tylko 3 zdarzenia przejscia na istniejacej sciezce (kafli nie ruszam); 157 dostaje otwarty brzeg i sciezke
            side, lo, hi = p
            for (mid, sd, dst) in ((157, side if a == 157 else OPP[side], 13), (13, OPP[side] if a == 157 else side, 157)):
                m = maps[mid]
                cells = [B2.lokalne(mid, sd, pos) for pos in range(lo, hi + 1)]
                other = OPP[sd]
                for k, pos in enumerate(range(lo, hi + 1)):
                    lx, ly = B2.lokalne(dst, other, pos)
                    ix, iy = B2.wewn(other)
                    if mid == 13:
                        for ev in m["events"]:
                            if ev and ev["x"] == cells[k][0] and ev["y"] == cells[k][1] and ev["id"] in (1, 2, 3): ev["pages"][0]["list"][0]["parameters"] = [0, dst, lx + ix, ly + iy, B2.DIRN[sd], 0]; ev["name"] = "Przejście -> Urwisko Kruków"
                    else:
                        Z.zdarzenie_przejscia(m, cells[k][0], cells[k][1], dst, lx + ix, ly + iy, B2.DIRN[sd], nb if mid == a else na)
                if mid == 157:
                    cx, cy = B2.wewn(sd)
                    B2.otworz(m, cells + [(x + cx * k, y + cy * k) for (x, y) in cells for k in (1, 2, 3, 4)])
                    W.reshape(m, 1, W.ring(set(cells) | {(x + cx * 5, y + cy * 5) for (x, y) in cells}, 2))
                    m["_id"] = 157; cel = SC.najblizsza(m, (cells[1][0] + cx * 14, cells[1][1] + cy * 14)); del m["_id"]
                    B2.sc(m, 157, cells[1], cel or (cells[1][0] + cx * 14, cells[1][1] + cy * 14), 15700)
            linki.append(dict(a=a, b=b, side=p[0], **{"from": p[1], "to": p[2]}))
        else:
            B2.wyjscie(maps, a, b, p, na, nb, linki, 100 * a + b)
        print("przejscie %d -> %d: %s swiat %d-%d" % (a, b, p[0], p[1], p[2]))
    # 13 N <-> 175: BEZ przejscia pieszo - na Orla Gran wchodzi sie tylko wspinaczka (Orzel.wayUp ma blokade: akt II / orzel / D29 / jajo); WAY_DOWN zostaje
    linki.append(dict(a=13, b=120, side="E", **{"from": 134, "to": 136}))   # szlak latarni: oba brzegi juz przechodnie, wystarczy link w Swiat_Data
    # 155 -> 157 / 157 -> 155 maja dawne zdarzenia (57, 58 w 157 na (0,19-20)): world link wystarczy; te zostaja jako zdarzenia wlasne
    # ---------------- MapInfos
    mi, lay = W.read_json("data/MapInfos.json")
    sumy["MapInfos"] = hashlib.sha256(open(os.path.join(ROOT, "data", "MapInfos.json"), "rb").read()).hexdigest()
    ids = {e["id"] for e in mi if e}
    nast = max(e["order"] for e in mi if e) + 1
    uk = json.load(open(os.path.join(ROOT, "docs", "mapy", "swiat_uklad.json"), encoding="utf-8"))["mapy"]
    for k, mid in enumerate(nowe):
        assert mid not in ids
        while len(mi) <= mid: mi.append(None)
        mi[mid] = {"id": mid, "expanded": False, "name": O.nazwa_mapy(mid), "order": nast + k, "parentId": uk[str(mid)]["rodzic"], "scrollX": 0, "scrollY": 0}
    open(os.path.join(DATA, "MapInfos.json"), "wb").write(W.json_text(mi, lay))
    for mid, m in sorted(maps.items()):
        open(os.path.join(DATA, "Map%03d.json" % mid), "wb").write(W.json_text(m, "map"))
    print("zapisano mapy:", sorted(maps), "nowe:", nowe)
    import zbuduj as _z
    sumy.update(_z.sumy)
    json.dump(sumy, open(os.path.join(STG, "sumy.json"), "w"), indent=1)
    json.dump({"nowe_mapy": nowe, "linki": linki}, open(os.path.join(STG, "ogon3.json"), "w"), indent=1)


if __name__ == "__main__":
    glowna()
