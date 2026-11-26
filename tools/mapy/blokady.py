# -*- coding: utf-8 -*-
"""NIEWIDZIALNE BLOKADY I POSTACIE NA JEDNYM POLU (tools/mapy/blokady.py, 2026-11-18)

Gracz: "sprawdź na mapach, czy są jakieś niewidzialne blokady, że nie da się przejść, + czy postacie nie stoją na tym samym polu".
Mapy nowego świata: od chaty dziadka (224) i map świata przez wszystkie przejścia (polecenie 201) - bez starych map.

Kody:
  N1 region 2 (RegionLayers: zawsze blokuje) na polu, które bez niego byłoby wolne, a nic go nie zasłania (kafel, obraz zdarzenia)
  N2 kafel blokujący bez obrazka (przezroczysty), nic innego na polu
  N3 zdarzenie bez obrazka, które blokuje (priorytet "jak postacie", nie "przenika") na polu, które bez niego byłoby wolne
  P1 dwie postacie (zdarzenia z grafiką postaci, ta sama strona widoczna w nowej grze) na jednym polu
Liczą się tylko pola przy polach, na które da się wejść (sąsiad wolny) - środek muru nikomu nie przeszkadza.

Użycie: python tools/mapy/blokady.py [numery map] [--json] - nic nie zapisuje do data/.
"""
import os, sys, json, re
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mapylib as L
from mapylib import T
import kontrola as K

ZIARNA = [224, 218, 219, 220, 221, 222, 225, 29, 30, 1, 25, 26, 180, 181]
# what the game draws there but this tool's picture does not (sprawdzone w grze 2026-11-18): the windmills (!$1_Wiatrak_Wieza, a big
# sprite; region 2 is its footprint), the wreck "Pomyślność" (!$1_Wrak_Caly), the doorman's barrier at the tavern's stairs (the doorman
# stands there and says why), the ravenry's perches (Kruk.js draws Kruk_Grzeda_Stara on zerdz_1 / zerdz_2 of Map029)
WIDOCZNE_W_GRZE = re.compile(r"^(Wiatrak|Wrak|Zapora odźwiernego|Zerdz kruczarni|Miejsce: zerdz_)")
OBSZAR_OBRAZU = 3   # (pola wokół takiego zdarzenia, które jego obraz zakrywa)
POMIN = set(range(130, 154))
# (2026-11-26) the mountains of Gory.js: the bands at the north and south edges (region 2) are covered by mountain pictures the game draws
# (js/plugins/Gory_Data.js: each column's band n / s, the passes); this tool's picture does not have them
def _gory():
    try:
        txt = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "js", "plugins", "Gory_Data.js"), encoding="utf-8").read()
        return json.loads(txt[txt.index("window.GoryData = ") + len("window.GoryData = "):].rstrip().rstrip(";"))["maps"]
    except Exception:
        return {}
GORY = _gory()   # (podziemia: piętra robi generator przy wejściu - kontrola Underground_Gen)


def mapy_swiata():
    ids = set(L.all_map_ids())
    seen, todo = set(), [m for m in ZIARNA if m in ids]
    while todo:
        m = todo.pop()
        if m in seen or m not in ids:
            continue
        seen.add(m)
        try:
            d = L.load_json(L.DATA + "Map%03d.json" % m)
        except Exception:
            continue
        for e in d["events"]:
            if not e:
                continue
            for p in e["pages"]:
                for c in p["list"]:
                    if c["code"] == 201 and c["parameters"] and c["parameters"][0] == 0:
                        t = c["parameters"][1]
                        if t not in seen and t not in POMIN:
                            todo.append(t)
    return sorted(seen - POMIN)


def widac_cos(mp, x, y, maski):
    """na polu widać przeszkodę: woda / ściana / dach / klif (A1, A3, A4), obiekt B-E z obrazkiem, kafel A5 nieprzechodni (ściana
    wnętrza), albo obraz zdarzenia (choć 1/4 pola); inaczej pole wygląda jak zwykła ziemia czy podłoga"""
    fl = mp.zest.flags
    for z in (3, 2, 1, 0):
        t = mp.t(z, x, y)
        if not t:
            continue
        if t >= 2048:
            k = (t - 2048) // 48
            if k < 16 or k >= 48:          # A1 woda, A3 dach, A4 ściana / klif
                return True
            continue                        # A2: grunt
        if 1536 <= t < 2048:               # A5: podłoga, chyba że nieprzechodni (ściana)
            if (fl[t] & 0xF) == 0xF:
                return True
            continue
        if not mp.zest.pusty(t):           # B-E z obrazkiem
            return True
    if maski is not None:
        cell = maski[y * T:(y + 1) * T, x * T:(x + 1) * T]
        if cell.size and cell.mean() > 0.25:
            return True
    return False


def maski_zdarzen(mp):
    """jedna maska (piksele mapy) obrazów wszystkich widocznych zdarzeń"""
    m = np.zeros((mp.H * T, mp.W * T), bool)
    for e in mp.zd:
        if not e.widoczne:
            continue
        r = e.maska(mp.zest)
        if not r:
            continue
        a, x0, y0 = r
        h, w = a.shape
        xa, ya, xb, yb = max(0, x0), max(0, y0), min(mp.W * T, x0 + w), min(mp.H * T, y0 + h)
        if xa >= xb or ya >= yb:
            continue
        m[ya:yb, xa:xb] |= a[ya - y0:yb - y0, xa - x0:xb - x0]
    return m


def wolna_bez(mp, x, y, bez_regionu=False):
    """pole wolne wg kafli (opcjonalnie bez regionu 2)"""
    if not mp.inside(x, y):
        return False
    if bez_regionu:
        return any(mp.check_passage(x, y, L.BIT[d], (3, 2, 1, 0), True) if mp.rl(x, y) != "rowno" else
                   _bez_rl(mp, x, y, L.BIT[d]) for d in (2, 4, 6, 8))
    return mp.kratka_wolna(x, y)


def _bez_rl(mp, x, y, bit):
    tiles = (mp.tile_events().get((x, y), [])) + [mp.t(z, x, y) for z in (3, 2, 1, 0)]
    fl = mp.zest.flags
    for t in tiles:
        f = fl[t] if 0 <= t < 8192 else 0
        if f & 0x10:
            continue
        if (f & bit) == 0:
            return True
        if (f & bit) == bit:
            return False
    return False


def kontrola(mid):
    mp = L.Mapa(mid)
    maski = maski_zdarzen(mp)
    evb = mp.ev_block()
    wolne = {(x, y) for y in range(mp.H) for x in range(mp.W) if mp.kratka_wolna(x, y) and (x, y) not in evb}
    # (only where the player can get: the flood from the map's entries - its arrivals, the open edges, its exits - as kontrola.py)
    st = mp.starty() or K.Kontrola.wejscia_zastepcze(type("K", (), {"mp": mp, "WYJSCIE_RX": K.Kontrola.WYJSCIE_RX, "zrodlo_wejsc": ""})())
    zasieg = mp.flood(st)
    przy = lambda x, y: any((x + dx, y + dy) in zasieg for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
    out = []
    duze = [e for e in mp.zd if WIDOCZNE_W_GRZE.match(e.name)]
    promien = lambda e: 8 if e.name.startswith("Wrak") else OBSZAR_OBRAZU   # (the wreck: a whole ship - 13 x 3 cells)
    gm = GORY.get(str(mid))
    w_gorach = lambda x, y: bool(gm) and (y < gm["n"][x] or y >= gm["s"][x])   # (under the mountains of Gory.js)
    w_grze = lambda x, y: any(abs(e.x - x) <= promien(e) and abs(e.y - y) <= promien(e) for e in duze) or w_gorach(x, y)
    for y in range(mp.H):
        for x in range(mp.W):
            if (x, y) in wolne or not przy(x, y) or w_grze(x, y):
                continue
            if mp.rl(x, y) == "rowno":
                if not widac_cos(mp, x, y, maski):
                    kraw = x in (0, mp.W - 1) or y in (0, mp.H - 1)
                    out.append({"kod": "N1", "x": x, "y": y, "co": "region 2" + (" (krawędź mapy)" if kraw else "")})
                continue
            if not mp.kratka_wolna(x, y):
                # the tile that decides: the first one from the top that is not a star
                dec = None
                for t in (mp.tile_events().get((x, y), [])) + [mp.t(z, x, y) for z in (3, 2, 1, 0)]:
                    f = mp.zest.flags[t] if 0 <= t < 8192 else 0
                    if f & 0x10:
                        continue
                    if (f & 0xF) != 0xF and (f & 0xF) != 0:
                        dec = t
                        break
                    if f & 0xF:
                        dec = t
                        break
                    break
                if dec and dec < 1536 and mp.teren(x, y) and mp.zest.pusty(dec) and not widac_cos(mp, x, y, maski):
                    out.append({"kod": "N2", "x": x, "y": y, "co": "kafel %d" % dec})
                continue
            for e in evb.get((x, y), []):
                if not e.widoczne and mp.kratka_wolna(x, y) and not widac_cos(mp, x, y, maski):
                    out.append({"kod": "N3", "x": x, "y": y, "co": "zdarzenie %d „%s”" % (e.id, e.name)})
    # P1: two characters on one cell
    pola = {}
    for e in mp.zd:
        if e.page and e.postac:
            pola.setdefault((e.x, e.y), []).append(e)
    for (x, y), es in pola.items():
        if len(es) > 1:
            out.append({"kod": "P1", "x": x, "y": y, "co": ", ".join("%d „%s” (%s)" % (e.id, e.name, e.char) for e in es)})
    return mp, out


def main(argv):
    ids = [int(a.replace("Map", "")) for a in argv if a.replace("Map", "").isdigit()] or mapy_swiata()
    raport, razem = {}, 0
    for mid in ids:
        try:
            mp, out = kontrola(mid)
        except Exception as ex:
            print("Map%03d: błąd %s" % (mid, ex))
            continue
        raport[mid] = out
        razem += len(out)
        kody = {}
        for o in out:
            kody[o["kod"]] = kody.get(o["kod"], 0) + 1
        print("Map%03d %-28s %s" % (mid, mp.nazwa[:28], " ".join("%s:%d" % kv for kv in sorted(kody.items())) or "ok"))
        for o in out:
            print("    %s (%d,%d) %s" % (o["kod"], o["x"], o["y"], o["co"]))
    print("razem:", razem, "na", len(ids), "mapach")
    if "--json" in argv:
        with open(L.ROOT + "docs/mapy/blokady.json", "w", encoding="utf-8") as f:
            json.dump(raport, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main(sys.argv[1:])
