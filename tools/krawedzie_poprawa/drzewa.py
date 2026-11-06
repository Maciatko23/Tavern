# -*- coding: utf-8 -*-
"""DRZEWA Z KAFLI, PO KTÓRYCH SIĘ CHODZI (gracz 2026-10-31: „chodzi się po nim, a nie za nim”).
Drzewo z kafli D (ids 512-639) ma koronę z zielonych kafli BEZ gwiazdki (w zestawie 9 wszystkie korony D są bez gwiazdki; w 11 część) nad kratkami,
na których da się stanąć, więc bohater wchodzi NA koronę. Skrypt:
  1. znajduje składowe (8-sąsiedztwo) kafli D 512-639 na warstwach 2/3 z zieloną, niegwiazdkową koroną nad chodliwą kratką;
  2. wypisuje je (mapa, kratki, kafle) do tools/krawedzie_poprawa/drzewa_lista.txt i rysuje obrazek mapy do docs/krawedzie_poprawa/drzewa/MapNNN_przed.png;
  3. na mapach NIE-gracza zamienia na zdarzenie „Drzewo (ozdobne)” !$Big_Trees_green (kierunek 4, wzór 2, jak tools/poprawki/drzewo_dom_dziadka.py):
     kafle drzewa znikają, zdarzenie „Drzewo (z kafelków)” (blokada pnia) też; zdarzenie stoi na kratce pnia (dolny środek składowej);
     na mapach gracza (lib.GRACZ) tylko lista + obraz + propozycja (docs/krawedzie_poprawa/drzewa/gracz_propozycje.md).
Wyjście TYLKO do tools/krawedzie_poprawa/staging/data/ (stan wyjściowy: plik stagingu, a gdy go brak, data/). Idempotentne: drugi przebieg = 0 zmian.
  python tools/krawedzie_poprawa/drzewa.py [--wszystkie]   (--wszystkie: skan też map spoza świata)
  python tools/krawedzie_poprawa/drzewa.py --zrodlo PLIK_MAPY --mapa N   (próba na dowolnym pliku mapy; wynik: staging/proba_MapNNN.json)"""
import os, sys, json, copy
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import lib; L = lib.L
import numpy as np
import popraw
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

ROOT = lib.ROOT; SDATA = os.path.join(lib.STG, "data")
LISTA = os.path.join(HERE, "drzewa_lista.txt")
OBR = os.path.join(ROOT, "docs", "krawedzie_poprawa", "drzewa")
D0, D1 = 512, 640
NAZWA_ZD = "Drzewo (z kafelków)"
SZABLON = {"id": 0, "name": "Drzewo (ozdobne)", "note": "", "x": 0, "y": 0, "pages": [{
    "conditions": {"actorId": 1, "actorValid": False, "itemId": 1, "itemValid": False, "selfSwitchCh": "A", "selfSwitchValid": False, "switch1Id": 1,
                   "switch1Valid": False, "switch2Id": 1, "switch2Valid": False, "variableId": 1, "variableValid": False, "variableValue": 0},
    "directionFix": True, "image": {"tileId": 0, "characterName": "!$Big_Trees_green", "direction": 4, "pattern": 2, "characterIndex": 0},
    "list": [{"code": 0, "indent": 0, "parameters": []}], "moveFrequency": 3,
    "moveRoute": {"list": [{"code": 0, "parameters": []}], "repeat": True, "skippable": False, "wait": False}, "moveSpeed": 3, "moveType": 0,
    "priorityType": 1, "stepAnime": False, "through": False, "trigger": 0, "walkAnime": False}]}


def zielony(z, t):
    a = np.asarray(z.tile(t)).astype(float); m = a[..., 3] > 40
    if m.sum() < 400: return False
    rgb = a[..., :3][m].mean(0)
    return bool(rgb[1] > rgb[0] + 12 and rgb[1] > rgb[2] + 8)


def drzewa_w(mp):
    """[{kratki: {(x,y): [(z,t)...]}, korona: [(x,y)], pien: (x,y)}] składowe z zieloną koroną bez gwiazdki nad chodliwą kratką"""
    z = mp.zest
    kr = {}
    for l in (2, 3):
        for y in range(mp.H):
            for x in range(mp.W):
                t = mp.t(l, x, y)
                if D0 <= t < D1: kr.setdefault((x, y), []).append((l, t))
    seen = set(); out = []
    for s in kr:
        if s in seen: continue
        st = [s]; seen.add(s); comp = []
        while st:
            c = st.pop(); comp.append(c)
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    n = (c[0] + dx, c[1] + dy)
                    if n in kr and n not in seen: seen.add(n); st.append(n)
        korona = [c for c in comp if any(zielony(z, t) and not z.gwiazdka(t) for l, t in kr[c])]
        if not korona: continue

        def chodliwa(c):
            # kratka chodliwa wg samych gruntów (warstwy 0-1): to na niej bohater staje, wchodząc na koronę
            return any(mp.check_passage(c[0], c[1], L.BIT[d], layers=(1, 0), with_events=False) for d in (2, 4, 6, 8))
        if not any(chodliwa(c) for c in korona): continue
        ys = max(c[1] for c in comp); xs = sorted(c[0] for c in comp if c[1] == ys)
        out.append({"kratki": {c: kr[c] for c in comp}, "korona": korona, "pien": (xs[len(xs) // 2], ys)})
    return out


def zamien(raw, dr):
    """zmienia surowy słownik mapy: kafle drzewa precz, zdarzenie pnia -> „Drzewo (ozdobne)”"""
    W, H = raw["width"], raw["height"]
    px, py = dr["pien"]
    for (x, y), lst in dr["kratki"].items():
        for l, t in lst: raw["data"][(l * H + y) * W + x] = 0
    ev = raw["events"]
    for i, e in enumerate(ev):
        if e and e["name"] == NAZWA_ZD and (e["x"], e["y"]) in dr["kratki"]: ev[i] = None
    nowe = copy.deepcopy(SZABLON); nowe["x"], nowe["y"] = px, py
    wolne = next((i for i in range(1, len(ev)) if ev[i] is None), len(ev))
    nowe["id"] = wolne
    if wolne == len(ev): ev.append(nowe)
    else: ev[wolne] = nowe


def obraz(mp, drzewa, nazwa):
    from PIL import ImageDraw
    xs = [c[0] for d in drzewa for c in d["kratki"]]; ys = [c[1] for d in drzewa for c in d["kratki"]]
    reg = (max(0, min(xs) - 3), max(0, min(ys) - 3), min(mp.W - 1, max(xs) + 3), min(mp.H - 1, max(ys) + 3))
    im = L.render(mp, region=reg); dd = ImageDraw.Draw(im, "RGBA")
    for d in drzewa:
        for (x, y) in d["korona"]: dd.rectangle(((x - reg[0]) * 48, (y - reg[1]) * 48, (x - reg[0]) * 48 + 47, (y - reg[1]) * 48 + 47), outline=(255, 0, 0, 255), width=2)
    os.makedirs(OBR, exist_ok=True); im.save(os.path.join(OBR, nazwa))


def main():
    probe = "--zrodlo" in sys.argv
    if probe:
        ids = [int(sys.argv[sys.argv.index("--mapa") + 1])]
    else:
        ids = lib.mapy_swiata()
        if "--wszystkie" in sys.argv:
            import glob
            ids = sorted(int(os.path.basename(p)[3:6]) for p in glob.glob(os.path.join(ROOT, "data", "Map???.json")))
    linie = []; zmian = 0; przyrost = {}; propozycje = []
    for mid in ids:
        if probe: p = os.path.abspath(sys.argv[sys.argv.index("--zrodlo") + 1])
        else:
            p = os.path.join(SDATA, "Map%03d.json" % mid)
            if not os.path.exists(p): p = os.path.join(ROOT, "data", "Map%03d.json" % mid)
        bajty = open(p, "rb").read()
        raw = json.loads(bajty.decode("utf-8"))
        if raw["tilesetId"] not in (9, 11): continue
        mp = L.Mapa(mid, path=p)
        dr = drzewa_w(mp)
        if not dr: continue
        gracz = mid in lib.GRACZ
        for d in dr:
            kor = sorted(d["korona"])
            linie.append("mapa %d%s: drzewo, pień %s, korona %d kratek %s, kafle %s" % (mid, " (GRACZ: tylko lista)" if gracz else "", d["pien"], len(kor), kor,
                         sorted({t for v in d["kratki"].values() for l, t in v})))
        obraz(mp, dr, "Map%03d_przed.png" % mid)
        if gracz:
            propozycje.append("- Mapa %d: %d drzew z kafli (korona bez gwiazdki; po niej się chodzi). Propozycja: zamiana na zdarzenia „Drzewo (ozdobne)” w kratkach pni %s (obraz: Map%03d_przed.png)." % (mid, len(dr), [d["pien"] for d in dr], mid))
            continue
        n0 = len([e for e in raw["events"] if e])
        for d in dr: zamien(raw, d)
        przyrost[mid] = len([e for e in raw["events"] if e]) - n0
        nowy = popraw.tekst_mapy(raw)
        if nowy != bajty:
            zmian += 1
            if probe: open(os.path.join(lib.STG, "proba_Map%03d.json" % mid), "wb").write(nowy)
            elif "--wszystkie" not in sys.argv:
                os.makedirs(SDATA, exist_ok=True); open(os.path.join(SDATA, "Map%03d.json" % mid), "wb").write(nowy)
    if not probe and "--wszystkie" not in sys.argv:
        open(LISTA, "w", encoding="utf-8").write(("\n".join(linie) + "\n") if linie else "(brak drzew z kafli z koroną bez gwiazdki na mapach świata)\n")
        if propozycje:
            os.makedirs(OBR, exist_ok=True)
            open(os.path.join(OBR, "gracz_propozycje.md"), "w", encoding="utf-8").write("# Drzewa z kafli na mapach gracza (tylko propozycje)\n\n" + "\n".join(propozycje) + "\n")
    print("drzew:", len(linie), "map zmienionych:", zmian, "przyrost zdarzeń:", przyrost)
    for l in linie: print(" ", l)


if __name__ == "__main__":
    main()
