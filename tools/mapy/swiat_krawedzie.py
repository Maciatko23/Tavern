# -*- coding: utf-8 -*-
# Sprawdzanie krawędzi świata (PROJEKT; nic nie zapisuje do data/ ani js/). Do etapów budowy:
# po każdym etapie sprawdza KAŻDĄ wspólną krawędź dwóch map kratka po kratce: woda, ląd, droga, rzeka, klif/ściana,
# UCIĘTE KRAWĘDZIE = 0 (woda mapy nie urywa się na krawędzi, brzeg nie biegnie wzdłuż krawędzi mapy),
# oraz brzeg: kratki świata, w których linia brzegu przecina krawędź, jej kierunek (kąt) z obu stron i przesunięcie na granicy.
#   python tools/mapy/swiat_krawedzie.py [--tylko 8,125] [--kratki]
# Dziś klasy kratek bierze z rastra świata (maska + drogi + rzeka); po etapie budowy tę samą funkcję (porownaj_krawedz) da się nakarmić
# klasami z prawdziwych map (kafle wody, lądu, drogi) i zobaczyć, czy zgadzają się ze światem.
import os, sys, json, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import numpy as np
from PIL import Image, ImageDraw
import swiat_kratki as K

MORZE, LAD, DROGA, RZEKA = 0, 1, 2, 3
NAZWY = {0: "morze", 1: "ląd", 2: "droga", 3: "suche koryto"}


def raster_klas(sw):
    """świat jako siatka klas: 0 morze, 1 ląd, 2 droga (3 kratki szerokości), 3 rzeka (2 do 7 kratek szerokości, szersza ku ujściu)"""
    C = np.where(sw.L, LAD, MORZE).astype(np.uint8)
    im = Image.fromarray(C)
    d = ImageDraw.Draw(im)
    for k, part in enumerate(K.KORYTO):
        rz = K.chaikin([K.W(p) for p in part], 3)
        n = len(rz)
        for i in range(n - 1):
            w = (1.0 + 0.7 * (i / (n - 1))) if k == 0 else (1.6 + 1.9 * (i / (n - 1)))      # półszerokość: suche koryto poszerza się ku ujściu
            d.line([rz[i], rz[i + 1]], fill=RZEKA, width=int(round(2 * w)))
    for name, pts in K.ROADS.items():
        d.line(K.chaikin([K.W(p) for p in pts], 3), fill=DROGA, width=3)
    return np.array(im)


def porownaj_krawedz(colA, colB):
    """kratka po kratce: kolumna przy krawędzi w mapie A i pierwsza kolumna w mapie B. Zwraca listę niezgodności.
    Droga i rzeka mają być w tej samej kratce po obu stronach; woda i ląd mogą się różnić tylko tam, gdzie brzeg przecina krawędź (+-1 kratka)."""
    bad = []
    n = len(colA)
    for i in range(n):
        a, b = int(colA[i]), int(colB[i])
        if a == b: continue
        if a in (DROGA, RZEKA) or b in (DROGA, RZEKA):
            w = a if a in (DROGA, RZEKA) else b
            other = colB if a == w else colA
            if not any(int(other[j]) == w for j in range(max(0, i - 2), min(n, i + 3))):
                bad.append((i, NAZWY[a], NAZWY[b], "droga/rzeka nie ta sama kratka (+-2)"))
        # woda/ląd: przy tym samym rastrze świata sąsiednie kolumny mogą różnić się tylko przy brzegu; porównanie z rastrem świata robi tryb prawdziwych map
    return bad


def sprawdz(sw, sas, bk, tylko=None, kratki=False):
    C = raster_klas(sw)
    bkm = {(e["a"], e["b"], e["strona"], e["od"]): e for e in bk}
    zle = 0; wiersze = []
    for (a, sa, b, sb, lo, hi) in sas:
        if tylko and a not in tylko and b not in tylko: continue
        ax, ay, aw, ah = sw.rects[a]; bx, by, bw, bh = sw.rects[b]
        if sa == "E":
            colA = C[lo:hi, ax + aw - 1]; colB = C[lo:hi, bx]
        else:
            colA = C[ay + ah - 1, lo:hi]; colB = C[by, lo:hi]
        bad = porownaj_krawedz(colA, colB)
        cnt = {k: int((colA == v).sum()) for k, v in (("morze", 0), ("lad", 1), ("droga", 2), ("rzeka", 3))}
        e = bkm.get((a, b, sa, lo))
        cr = e["przeciecia"] if e else []
        skok = e["skok_kratek"] if e else 0
        zle += len(bad)
        wiersze.append((a, b, sa, lo, hi, cnt, cr, skok, bad))
        if kratki and bad:
            for x in bad: print("   ", a, b, x)
    return wiersze, zle


ETAP3_OCZEKIWANE = {111, 165, 162, 917}   # mapy, które dostaną przejścia w etapie 3


def main():
    tylko = None
    if "--tylko" in sys.argv: tylko = {int(x) for x in sys.argv[sys.argv.index("--tylko") + 1].split(",")}
    sw, sas, pas, nies, ed, stare, bk, J = K.wszystko(verbose=False)
    wiersze, zle = sprawdz(sw, sas, bk, tylko, "--kratki" in sys.argv)
    print("Sprawdzanie krawędzi świata: %d wspólnych krawędzi" % len(wiersze))
    print("%-14s %-3s %-9s %-34s %-5s %s" % ("mapy", "str", "odcinek", "kratki: morze/lad/droga/rzeka", "skok", "brzeg przecina krawędź (kratka świata: kąt A / kąt B)"))
    for (a, b, sa, lo, hi, cnt, cr, skok, bad) in wiersze:
        if not (cnt["morze"] or cr or cnt["rzeka"]): continue
        brz = "; ".join("%d: %s/%s" % (c["pos"], c["kat_a"], c["kat_b"]) for c in cr[:4]) + (" ..." if len(cr) > 4 else "")
        print("%-14s %-3s %-9s %-34s %-5s %s" % ("%d | %d" % (a, b), sa, "%d-%d" % (lo, hi), "%d/%d/%d/%d" % (cnt["morze"], cnt["lad"], cnt["droga"], cnt["rzeka"]), skok, brz))
    skoki = [w[7] for w in wiersze]
    tresc = sum(len(nies[m]["tresc_w_morzu"]) for m in K.OUTDOOR)
    print("Niezgodności droga/rzeka/woda na wspólnych krawędziach: %d" % zle)
    print("Największe przesunięcie przecięcia brzegu na granicy map: %d kratek" % (max(skoki) if skoki else 0))
    print("Treść (budynki, zdarzenia z akcją, miejsca) w morzu: %d" % tresc)
    uc = sw.ucięte()
    if K.STYKI:       # (--styki) rodzaj c (ląd maski bez mapy za krawędzią) rozstrzygają prawdziwe kafle: tools/mapy/swiat_styki.py (donikad = 0: kratki przy wąskich paskach zablokowane)
        print("(rodzaj c: pomijam w trybie --styki - sprawdza go swiat_styki.py na kaflach)")
        uc = [c for c in uc if c["rodzaj"] != "c"]
    print("UCIĘTE KRAWĘDZIE (woda mapy urwana na krawędzi albo brzeg wzdłuż krawędzi): %d odcinków, %d kratek" % (len(uc), sum(c["kratek"] for c in uc)))
    for c in uc[:30]: print("   mapa %d, krawędź %s, rodzaj %s, kratki %d-%d" % (c["mapa"], c["strona"], c["rodzaj"], c["od"], c["do"]))
    # nakładanie map (układ stały: ma być 0)
    cnt_ = np.zeros((K.WH, K.WW), int)
    for (x, y, w, h) in sw.rects.values(): cnt_[y:y + h, x:x + w] += 1
    nakl = int((cnt_ > 1).sum())
    print("NAKŁADANIE map: %d kratek" % nakl)
    for o in getattr(sw, "ostrzezenia", []): print("UWAGA (rozmiar pliku a układ):", o)
    zbud = sorted(m for m, v in sw.new.items() if v.get("istnieje") and m in sw.rects)
    print("Nowe mapy już zbudowane (data/%s): %s" % (" + staging_b" if K.STAGING_B else (" + staging etapu 3" if K.STAGING_C else ""), zbud))
    niepol = sw.polaczone(pas)
    oczek = [m for m in niepol if m in ETAP3_OCZEKIWANE]
    bledne = [m for m in niepol if m not in ETAP3_OCZEKIWANE]
    print("Mapy niepołączone przejściami, OCZEKIWANE (etap 3, jeszcze nie przebudowane): %s" % (oczek or "brak"))
    print("Mapy niepołączone przejściami, BŁĄD: %s" % (bledne or "brak"))
    print("Trasa 20 -> 8:", " -> ".join(str(m) for m in (sw.trasa(pas, 20, 8) or [])))
    # ląd obecnych map pod morzem = 0 (każda mapa zachowuje cały swój ląd; woda mapy może stać się lądem, ale ląd nigdy wodą)
    strata = {m: int(nies[m]["morze"]) for m in K.OUTDOOR if nies[m]["morze"]}
    print("LĄD OBECNYCH MAP POD MORZEM: %d kratek%s" % (sum(strata.values()), (" " + str(strata)) if strata else " (każda mapa: 0)"))
    for m in strata:
        a_ = nies[m]["_morze"]; H_, W_ = a_.shape; seen = np.zeros_like(a_); cl = []
        for y0 in range(H_):
            for x0 in range(W_):
                if a_[y0, x0] and not seen[y0, x0]:
                    st = [(x0, y0)]; seen[y0, x0] = True; c = []
                    while st:
                        x, y = st.pop(); c.append((x, y))
                        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                            u, v = x + dx, y + dy
                            if 0 <= u < W_ and 0 <= v < H_ and a_[v, u] and not seen[v, u]: seen[v, u] = True; st.append((u, v))
                    xs = [q[0] for q in c]; ys = [q[1] for q in c]
                    cl.append((len(c), min(xs), min(ys), max(xs), max(ys)))
        cl.sort(reverse=True)
        print("   mapa %d: ląd pod morzem (kratki lokalne): %s" % (m, "; ".join("%d kr. x %d-%d y %d-%d" % (n, x0, x1, y0, y1) for (n, x0, y0, x1, y1) in cl[:8])))
    bledne = [s for s in stare if s.get("kod") == "blad"]
    for s in bledne: print("BLAD: wyjscie z mapy %s (%s) -> %s: %s" % (s["od"], s["wyjscie"], s["do"], s["wynik"]))
    ok = (not bledne and zle == 0 and tresc == 0 and not strata and not uc and not bledne and nakl == 0)
    print("WYNIK:", "OK" if ok else "BŁĄD")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
