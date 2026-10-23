# -*- coding: utf-8 -*-
"""ZESTAWY Z PALETY (tools/mapy/zestawy.py)

Czyta mapę-paletę zrobioną w edytorze i zapisuje gotowe zestawy (mebel z przedmiotami, kącik, stragan, dom) do
tools/mapy/zestawy.json oraz podgląd docs/mapy/zestawy_MapNNN.png. Agenci budujący mapy biorą meble z zestawów
zamiast składać je z pojedynczych kafli - wtedy wszystko leży tak, jak ułożył to użytkownik.

Paleta wnętrz (opis dla użytkownika w docs/MAPY_ZASADY.md, rozdział „Paleta wnętrz”):
  - nowa mapa w edytorze (np. „Paleta wnętrz”), zestaw kafli 8, poza światem gry (nikt na nią nie przenosi);
  - każdy zestaw obrysowany albo zamalowany regionem (zakładka R; najlepiej numer 10 lub wyższy - 1-3, 5-7 i 9 mają
    w grze swoje znaczenie, na palecie to nie przeszkadza, ale łatwo pomylić); numer regionu = kategoria (dowolna);
  - w środku zestawu albo na ramce puste zdarzenie (bez obrazka) z nazwą zestawu, np. „Stół kuchenny z chlebem”;
    w jego notatce można dopisać <Opis:...>, <PrzyScianie>, <Kategoria:kuchnia>;
  - zestawy oddzielone co najmniej jedną kratką bez regionu.
Paleta miasteczka Map101 (styl „nagłówków”): zdarzenie o nazwie „== Nazwa (SxW) ==” w lewym górnym rogu zestawu
(prostokąt z nazwy jest powiększany o przylegające kafle budynku, najwyżej o 4 kratki - w nazwach bywa za mały).
Narzędzie rozpoznaje oba sposoby na tej samej mapie.

Użycie:  python tools/mapy/zestawy.py 101            (paleta miasteczka)
         python tools/mapy/zestawy.py 178 101        (kilka palet naraz; wynik łączony w zestawy.json)
         python tools/mapy/zestawy.py --lista        (co jest w zestawy.json)
         python tools/mapy/zestawy.py 178 --dane DIR (paleta z innego folderu, np. kopia robocza)
W kodzie:  import zestawy; z = zestawy.wczytaj()["Map101:Studnia (u nas sucha)"]; zestawy.wstaw(mapa_json, z, x, y)
Nic nie zapisuje do data/ ani js/ (wstaw() zmienia słownik mapy w pamięci; zapis robi narzędzie agenta).
"""
import os, sys, re, copy, json, collections

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mapylib as L
from mapylib import T

OUT = os.path.join(L.HERE, "zestawy.json")
NAGLOWEK_RX = re.compile(r"^==\s*(.+?)\s*\((\d+)\s*[x×]\s*(\d+)\)\s*==$")


def _komponenty(mp):
    """spójne (4-sąsiedztwo) grupy kratek z regionem > 0: [(region, [(x, y)...])]"""
    seen = set()
    out = []
    for y in range(mp.H):
        for x in range(mp.W):
            r = mp.region(x, y)
            if not r or (x, y) in seen: continue
            comp, stack = [], [(x, y)]
            seen.add((x, y))
            while stack:
                a = stack.pop(); comp.append(a)
                for (dx, dy) in L.DIRS.values():
                    n = (a[0] + dx, a[1] + dy)
                    if mp.inside(*n) and n not in seen and mp.region(*n) == r:
                        seen.add(n); stack.append(n)
            out.append((r, comp))
    return out


def _tagi(note):
    out = {}
    for k, v in re.findall(r"<(\w+)(?::([^>]*))?>", note or ""):
        out[k] = v if v else True
    return out


def _tresc(mp, x, y, znaczniki=()):
    """kratka z zawartością zestawu: kafle warstw 1-3, budynek na warstwie 0 (A3/A4/A5/B-E) albo widoczne zdarzenie"""
    if mp.t(1, x, y) or mp.t(2, x, y) or mp.t(3, x, y): return True
    t = mp.t(0, x, y)
    if t and L.arkusz(t) not in ("A1", "A2"): return True
    return False


def _dopasuj_naglowki(mp, sets, znaczniki, zapas=4):
    """rozmiar w nazwie nagłówka bywa za mały (budynek wystaje o rząd-dwa): powiększ prostokąt o przylegającą treść
    (najwyżej o `zapas` kratek z każdej strony i nie na cudzy zestaw)"""
    ev_cells = {(e.x, e.y) for e in mp.zd if e.widoczne and e.id not in znaczniki}
    tresc = lambda x, y: mp.inside(x, y) and (_tresc(mp, x, y) or (x, y) in ev_cells)
    boxes = [(s["x"], s["y"], s["x"] + s["w"] - 1, s["y"] + s["h"] - 1) for s in sets]
    for i, s in enumerate(sets):
        x0, y0, x1, y1 = boxes[i]
        lim = (x0 - zapas, y0 - zapas, x1 + zapas, y1 + zapas)
        inne = [b for j, b in enumerate(boxes) if j != i]
        seen = {(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1) if tresc(x, y)}
        stack = list(seen)
        while stack:
            cx, cy = stack.pop()
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    n = (cx + dx, cy + dy)
                    if n in seen or not tresc(*n): continue
                    if not (lim[0] <= n[0] <= lim[2] and lim[1] <= n[1] <= lim[3]): continue
                    if any(b[0] <= n[0] <= b[2] and b[1] <= n[1] <= b[3] for b in inne): continue
                    seen.add(n); stack.append(n)
        if seen:
            nx0 = min(x0, min(c[0] for c in seen)); ny0 = min(y0, min(c[1] for c in seen))
            nx1 = max(x1, max(c[0] for c in seen)); ny1 = max(y1, max(c[1] for c in seen))
            if (nx0, ny0, nx1, ny1) != (x0, y0, x1, y1):
                s["rozmiar_z_nazwy"] = [s["w"], s["h"]]
                s["x"], s["y"], s["w"], s["h"] = nx0, ny0, nx1 - nx0 + 1, ny1 - ny0 + 1
                boxes[i] = (nx0, ny0, nx1, ny1)


def zestawy_mapy(mp, kat=None):
    """lista zestawów z jednej palety"""
    if kat is None:
        import kontrola as K
        kat = K.Kat(mp.tsid)
    sets = []
    znaczniki = set()
    # 1) nagłówki „== Nazwa (SxW) ==” (Map101)
    for e in mp.zd:
        m = NAGLOWEK_RX.match(e.name.strip())
        if not m: continue
        sets.append({"nazwa": m.group(1), "x": e.x, "y": e.y, "w": int(m.group(2)), "h": int(m.group(3)), "kategoria": None,
                     "sposob": "naglowek", "znacznik": e.id})
        znaczniki.add(e.id)
    _dopasuj_naglowki(mp, [s for s in sets if s["sposob"] == "naglowek"], znaczniki)
    # 2) obszary regionów z pustym zdarzeniem-nazwą
    for r, comp in _komponenty(mp):
        xs = [c[0] for c in comp]; ys = [c[1] for c in comp]
        x0, y0, x1, y1 = min(xs), min(ys), max(xs), max(ys)
        if x1 - x0 < 0 or y1 - y0 < 0: continue
        nazwa, tagi, zid = None, {}, None
        for e in mp.zd:
            if e.widoczne or e.id in znaczniki: continue
            if x0 <= e.x <= x1 and y0 <= e.y <= y1 and not e.komendy:
                nazwa, tagi, zid = e.name, _tagi(e.note), e.id
                break
        if zid: znaczniki.add(zid)
        sets.append({"nazwa": nazwa or "Zestaw %d,%d" % (x0, y0), "x": x0, "y": y0, "w": x1 - x0 + 1, "h": y1 - y0 + 1,
                     "kategoria": tagi.get("Kategoria") or r, "sposob": "region %d" % r, "znacznik": zid,
                     "opis": tagi.get("Opis"), "przy_scianie": bool(tagi.get("PrzyScianie"))})
    # zawartość
    for s in sets:
        x0, y0, w, h = s["x"], s["y"], s["w"], s["h"]
        warstwy = {}
        for z in range(4):
            grid = [[mp.t(z, x0 + dx, y0 + dy) for dx in range(w)] for dy in range(h)]
            if any(any(row) for row in grid): warstwy[str(z)] = grid
        cien = [[mp.t(4, x0 + dx, y0 + dy) for dx in range(w)] for dy in range(h)]
        if any(any(row) for row in cien): warstwy["cien"] = cien
        s["kafle"] = warstwy
        evs = []
        for e in mp.zd:
            if e.id in znaczniki: continue
            if x0 <= e.x < x0 + w and y0 <= e.y < y0 + h:
                d = copy.deepcopy(e.e)
                d["dx"], d["dy"] = e.x - x0, e.y - y0
                d.pop("x", None); d.pop("y", None); d.pop("id", None)
                evs.append(d)
        s["zdarzenia"] = evs
        # blokowane kratki i blaty (z katalogu)
        blok, blaty, obiekty = [], [], set()
        for dy in range(h):
            for dx in range(w):
                x, y = x0 + dx, y0 + dy
                if mp.teren(x, y) and not mp.kratka_wolna(x, y): blok.append([dx, dy])
                elif (x, y) in mp.ev_block(): blok.append([dx, dy])
                for z in (2, 3):
                    t = mp.t(z, x, y)
                    if not t: continue
                    o = kat.obiekt(t)
                    if o: obiekty.add(o["id"])
                    if kat.blat(t) and [dx, dy] not in blaty: blaty.append([dx, dy])
        s["blokuje"] = blok
        s["blaty"] = blaty
        s["obiekty_katalogu"] = sorted(obiekty)
        s["mapa"] = mp.id
        s["zestaw_kafli"] = mp.tsid
        s["klucz"] = "Map%03d:%s" % (mp.id, s["nazwa"])
    return sets


def podglad(mp, sets, out):
    from PIL import ImageDraw
    img = L.render(mp, grid=True)
    d = ImageDraw.Draw(img)
    f = L.font(15, True)
    cols = [(255, 214, 90), (90, 200, 255), (255, 120, 200), (130, 240, 140), (240, 150, 70)]
    for i, s in enumerate(sets):
        c = cols[i % len(cols)]
        x0, y0 = s["x"] * T, s["y"] * T
        d.rectangle([x0 + 1, y0 + 1, x0 + s["w"] * T - 2, y0 + s["h"] * T - 2], outline=c + (255,), width=3)
        lab = "%d. %s" % (i + 1, s["nazwa"])
        tw = d.textlength(lab, font=f)
        d.rectangle([x0 + 2, y0 + 2, x0 + 8 + tw, y0 + 22], fill=(0, 0, 0, 210))
        d.text((x0 + 5, y0 + 3), lab, fill=c + (255,), font=f)
    scale = min(1.0, 2400.0 / img.width)
    if scale < 1.0:
        img = img.resize((int(img.width * scale), int(img.height * scale)))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    rgb = img.convert("RGB")
    if rgb.width * rgb.height > 2_500_000:
        rgb = rgb.quantize(colors=256)
    rgb.save(out, optimize=True)


def wczytaj():
    """{klucz: zestaw} z tools/mapy/zestawy.json"""
    if not os.path.exists(OUT): return {}
    return {s["klucz"]: s for s in L.load_json(OUT)["zestawy"]}


def wstaw(mapa, zestaw, x, y, warstwy=("1", "2", "3", "cien"), zdarzenia=True):
    """wstawia zestaw do słownika mapy (format data/MapNNN.json) z lewym górnym rogiem w (x, y): kafle warstw 2-3
    (i dywany z warstwy 1, cienie), zdarzenia z nowymi numerami (od pierwszego wolnego, najwyżej 499 - zakresy 500+
    należą do wtyczek). Zwraca listę nowych numerów zdarzeń. Autokafle warstwy 1 są kopiowane tak, jak leżą na palecie
    (kształt brzegów może wymagać poprawki w edytorze)."""
    W, H = mapa["width"], mapa["height"]
    data = mapa["data"]
    for key in warstwy:
        grid = zestaw["kafle"].get(key)
        if not grid: continue
        z = 4 if key == "cien" else int(key)
        for dy, row in enumerate(grid):
            for dx, t in enumerate(row):
                if not t: continue
                xx, yy = x + dx, y + dy
                if 0 <= xx < W and 0 <= yy < H:
                    data[(z * H + yy) * W + xx] = t
    nowe = []
    if zdarzenia:
        evs = mapa["events"]
        used = {e["id"] for e in evs if e}
        for src in zestaw["zdarzenia"]:
            nid = next(i for i in range(1, 500) if i not in used)
            used.add(nid)
            e = copy.deepcopy(src)
            dx, dy = e.pop("dx"), e.pop("dy")
            e.update({"id": nid, "x": x + dx, "y": y + dy})
            while len(evs) <= nid: evs.append(None)
            evs[nid] = e
            nowe.append(nid)
    return nowe


def main(argv):
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8")
    if "--lista" in argv:
        for k, s in wczytaj().items():
            print("%-60s %dx%d  zdarzeń %d  blaty %d" % (k, s["w"], s["h"], len(s["zdarzenia"]), len(s["blaty"])))
        return
    dane = argv[argv.index("--dane") + 1] if "--dane" in argv else None
    ids = [int(re.sub(r"\D", "", a)) for a in argv if re.match(r"^(Map)?\d+$", a, re.I)]
    if not ids:
        print(__doc__); return
    import kontrola as K
    stare = {s["klucz"]: s for s in (L.load_json(OUT)["zestawy"] if os.path.exists(OUT) else [])}
    for mid in ids:
        mp = L.Mapa(mid, path=os.path.join(dane, "Map%03d.json" % mid) if dane else None)
        sets = zestawy_mapy(mp, K.Kat(mp.tsid))
        for k in [k for k in stare if k.startswith("Map%03d:" % mid)]: stare.pop(k)
        for s in sets: stare[s["klucz"]] = s
        png = L.DOCS + "zestawy_Map%03d.png" % mid
        podglad(mp, sets, png)
        print("Map%03d '%s': %d zestawów -> %s" % (mid, mp.nazwa, len(sets), png))
        for i, s in enumerate(sets):
            print("  %2d. %-55s %2dx%-2d (%d,%d) zdarzeń %d, blaty %d [%s]" % (i + 1, s["nazwa"], s["w"], s["h"], s["x"], s["y"],
                                                                         len(s["zdarzenia"]), len(s["blaty"]), s["sposob"]))
    L.save_json(OUT, {"opis": "Zestawy z palet (tools/mapy/zestawy.py). Klucz: MapNNN:nazwa.", "zestawy": list(stare.values())})
    print("zapisano", OUT)


if __name__ == "__main__":
    main(sys.argv[1:])
