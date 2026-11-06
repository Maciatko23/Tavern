# -*- coding: utf-8 -*-
"""„Za wzgórzem” na wszystkich mapach (gracz 2026-11-03: „zastosować to do wszystkich tyłów wzgórz, tylko jedna kratka”): region 3 na każdej
kratce TYLNEJ krawędzi wzgórza - kafel A5 zamknięty od góry (zestaw 11: 88-90 trawa, 93-95 ziemia), w zestawie 9 te same kafle są murem
(BACK_RIM niżej, RegionLayers.js backRims) - tam, gdzie nie ma innego regionu (regiony zadań, farmy, kołysania zostają). Tylko warstwa
regionów („data”, piąta płaszczyzna), reszta pliku bajt w bajt ta sama.
Sprawdza, czy przejście za wzgórzem nie łączy miejsc dotąd rozdzielonych (kratki bez zdarzeń blokujących, ruch jak silnik: obie strony
krawędzi) ani niczego nie rozcina; takie wzgórza wypisuje i ich NIE maluje.
  python tools/za_wzgorzem/maluj.py --dry-run    (domyślnie: raport + obrazki docs/za_wzgorzem/mapy/MapNNN.png)
  python tools/za_wzgorzem/maluj.py --wykonaj    (edytor zamknięty! kopie zapasowe: tools/za_wzgorzem/kopie_zapasowe/<czas>_mapy)"""
import os, sys, datetime, hashlib
from collections import deque

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
import mapylib as ml
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

BACK_RIM = {88: 0xA, 89: 0x8, 90: 0xC, 93: 0xA, 94: 0x8, 95: 0xC}   # kafel A5 (numer w arkuszu) -> jego strony od zewnątrz, gdy w zestawie jest murem
POMIN = {101}   # paleta miasteczka (do kopiowania, nie do grania)
# zdarzenia dokładane przez wtyczki w grze (nie ma ich w pliku mapy) na tylnej krawędzi: Zakon.js, orle miejsca - „Stare kołki w skale”,
# jednokierunkowe zejście, na które staje się ze szczytu (sprawdzone w grze 2026-11-03: $gameMap.events() na kratkach planu)
# + orle miejsca (Zakon_Data.js EAGLE: tylko z orła, nie pieszo - zakon_test, Okolice.checkMap): całe ich prostokąty z rzędem kołków
_ORLE = [(99, 37, 102, 41), (33, 73, 36, 76)]
POMIN_KRATKI = {13: {(99, 37), (33, 73)} | {(x, y) for (x0, y0, x1, y1) in _ORLE for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)}}
# orle skarpy (tools/orle_skarpy, 2026-11-03): górny rząd krawędzi to samo orle miejsce - nie „za wzgórzem”
for _m, (_x0, _y0, _x1, _y1) in ((168, (50, 24, 55, 28)), (125, (104, 29, 109, 34)), (125, (96, 44, 101, 49))):
    POMIN_KRATKI.setdefault(_m, set()).update((x, y) for x in range(_x0, _x1 + 1) for y in range(_y0, _y1 + 1))
SIDE = {1: (0, 1), 2: (-1, 0), 4: (1, 0), 8: (0, -1)}
OPP = {1: 8, 2: 4, 4: 2, 8: 1}
DIRS = {2: 1, 4: 2, 6: 4, 8: 8}   # kierunek -> bit strony
MIN_CZESC = 4   # części mniejsze nie liczą się do połączeń (pojedyncze kratki krawędzi, zakamarki)
OBRAZKI = os.path.join(ROOT, "docs", "za_wzgorzem", "mapy")


def tylne(mp):
    """{(x, y): strony od zewnątrz} - kratki tylnej krawędzi; (nowe, już z 3, z innym regionem albo ze zdarzeniem)
    (zdarzenie na krawędzi - słup, płyta, kamień przy latarni - stoi NA wzgórzu: z regionem 3 byłoby „za nim” i ucięte)"""
    fl = mp.zest.flags
    nowe, juz, inne = {}, {}, {}
    zd = {(e.x, e.y) for e in mp.zd} | POMIN_KRATKI.get(mp.id, set())
    for y in range(mp.H):
        for x in range(mp.W):
            t = mp.t(0, x, y)
            if not (1536 <= t < 1664): continue
            f = fl[t] & 0x0F
            if (f & 0x08) and f != 0x0F: shut = f
            elif f == 0x0F and (t - 1536) in BACK_RIM: shut = BACK_RIM[t - 1536]
            else: continue
            r = mp.t(5, x, y)
            if r != 3 and (x, y) in zd: inne[(x, y)] = "zdarzenie"; continue
            # (region 2 na krawędzi-murze nic nie zmieniał - kafel i tak blokuje; region 9, łąka wokół działki dziadka na Map003: nie buduje się tam
            # i tak - mur działki (Farming_Build walledField), a na kratce za wzgórzem nic (RegionLayers.isBack) - zamiana na 3)
            if r in (2, 9) and f == 0x0F: r = 0
            (juz if r == 3 else inne if r else nowe)[(x, y)] = shut if not r or r == 3 else r
    return nowe, juz, inne


class Ruch:
    """przejścia jak w grze (RegionLayers.js z kratkami za wzgórzem albo bez nich), ruch jak silnik (obie strony krawędzi)"""
    def __init__(self, mp, back):
        self.mp, self.back = mp, back
        self.blok = set(mp.ev_block().keys())

    def bok(self, x, y, s):
        if self.back[(x, y)] & s: return True
        dx, dy = SIDE[s]
        return (x + dx, y + dy) in self.back

    def przejscie(self, x, y, bit):
        mp = self.mp
        r = mp.t(5, x, y)
        if r == 2 and (x, y) not in self.back: return False
        if r == 1: return True
        if (x, y) in self.back:
            if not self.bok(x, y, bit): return False
            for t in mp.tile_events().get((x, y), []):
                f = mp.zest.flags[t]
                if not (f & 0x10) and (f & bit) == bit: return False
            return True
        dx, dy = SIDE[bit]
        if (x + dx, y + dy) in self.back and not self.bok(x + dx, y + dy, OPP[bit]): return False
        return mp.check_passage(x, y, bit)

    def krok(self, x, y, d):
        dx, dy = SIDE[DIRS[d]]
        nx, ny = x + dx, y + dy
        if not self.mp.inside(nx, ny) or (nx, ny) in self.blok: return None
        if self.przejscie(x, y, DIRS[d]) and self.przejscie(nx, ny, DIRS[10 - d]): return (nx, ny)
        return None

    def czesci(self):
        """{kratka: numer części}, {numer: rozmiar}"""
        nr, roz, k = {}, {}, 0
        for y in range(self.mp.H):
            for x in range(self.mp.W):
                if (x, y) in nr or (x, y) in self.blok: continue
                if not any(self.przejscie(x, y, b) for b in (1, 2, 4, 8)): continue
                k += 1; nr[(x, y)] = k; q = deque([(x, y)]); n = 0
                while q:
                    c = q.popleft(); n += 1
                    for d in (2, 4, 6, 8):
                        s = self.krok(c[0], c[1], d)
                        if s and s not in nr: nr[s] = k; q.append(s)
                roz[k] = n
        return nr, roz


def wzgorza(cells):
    """kratki krawędzi pogrupowane w ciągi (sąsiednie w 8 kierunkach) - jedno wzgórze może mieć kilka ciągów (schodki)"""
    left, grupy = set(cells), []
    while left:
        c = left.pop(); g = [c]; q = [c]
        while q:
            x, y = q.pop()
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    n = (x + dx, y + dy)
                    if n in left: left.remove(n); g.append(n); q.append(n)
        grupy.append(sorted(g, key=lambda p: (p[1], p[0])))
    return grupy


def sprawdz(mp, nowe, juz):
    """które ciągi nowych kratek łączą albo rozcinają części mapy - te zostają bez regionu (sprawdzane ciąg po ciągu, po kolei)"""
    przed = Ruch(mp, dict(juz))   # (region 2 na krawędziach-murach zostaje tu jak w pliku: blokuje, jak ich kafel)
    nr0, roz0 = przed.czesci()
    zle, dobre = [], dict(juz)
    for g in wzgorza(nowe):
        proba = dict(dobre); proba.update({c: nowe[c] for c in g})
        po = Ruch(mp, proba)
        nr1, roz1 = po.czesci()
        malowane = set(proba)
        laczy, rozcina = [], []
        grupy1 = {}
        for c, k in nr0.items():
            if c in malowane or roz0[k] < MIN_CZESC: continue
            k1 = nr1.get(c)
            if k1 is None: continue
            grupy1.setdefault(k1, set()).add(k)
        for k1, ks in grupy1.items():
            if len(ks) > 1: laczy.append(sorted(ks))
        dzieli = {}
        for c, k in nr0.items():
            if c in malowane or roz0[k] < MIN_CZESC or c not in nr1: continue
            dzieli.setdefault(k, set()).add(nr1[c])
        for k, k1s in dzieli.items():
            if len(k1s) > 1:
                duze = [k1 for k1 in k1s if sum(1 for c in nr0 if nr0[c] == k and nr1.get(c) == k1 and c not in malowane) >= MIN_CZESC]
                if len(duze) > 1: rozcina.append(k)
        # (za krawędzią musi być ziemia, na którą da się wejść: nad morzem, pod ścianą region 3 tylko zabrałby szczytowi skraj urwiska)
        za = {nr1[c] for c in g if c in nr1}
        dojscie = any(sum(1 for c, k in nr1.items() if k == k1 and c not in malowane) >= MIN_CZESC for k1 in za)
        # (przy brzegu mapy to granica - rząd krawędzi przez całą mapę nad jej ostatnim rzędem, Map003 - nie wzgórze: tam też bez zmian)
        brzeg = any(x <= 0 or x >= mp.W - 1 or y <= 0 or y >= mp.H - 2 for (x, y) in g)
        if laczy or rozcina or not dojscie or brzeg: zle.append((g, laczy, "przy brzegu mapy" if brzeg else rozcina if dojscie else "nic za nią (morze, ściana)"))
        else: dobre.update({c: nowe[c] for c in g})
    return {c: v for c, v in dobre.items() if c in nowe}, zle


def obrazek(mp, ok, zle, juz, plik):
    pts = list(ok) + [c for g, _, _ in zle for c in g] + list(juz)
    if not pts: return
    x0 = max(0, min(p[0] for p in pts) - 6); x1 = min(mp.W - 1, max(p[0] for p in pts) + 6)
    y0 = max(0, min(p[1] for p in pts) - 5); y1 = min(mp.H - 1, max(p[1] for p in pts) + 5)
    marks = [(x, y, (60, 140, 255), "3") for (x, y) in ok] + [(x, y, (120, 200, 255), "") for (x, y) in juz]
    marks += [(x, y, (255, 70, 60), "X") for g, _, _ in zle for (x, y) in g]
    big = max(x1 - x0 + 1, y1 - y0 + 1)
    im = ml.render(mp, region=(x0, y0, x1, y1), marks=marks, scale=0.5 if big > 40 else 1.0)
    os.makedirs(os.path.dirname(plik), exist_ok=True)
    im.convert("RGB").save(plik)


def zapisz_regiony(path, mp, cells):
    """tylko liczby piątej płaszczyzny w tablicy "data" - reszta pliku bez zmian"""
    b = open(path, "rb").read()
    i = b.find(b'"data":[') + 8
    j = b.find(b"]", i)
    vals = b[i:j].split(b",")
    W, H = mp.W, mp.H
    assert len(vals) == 6 * W * H, "data: %d != %d" % (len(vals), 6 * W * H)
    for (x, y) in cells:
        k = (5 * H + y) * W + x
        assert vals[k] in (b"0", b"2", b"9"), (x, y, vals[k])
        vals[k] = b"3"
    return b[:i] + b",".join(vals) + b[j:]


def main():
    wykonaj = "--wykonaj" in sys.argv and "--dry-run" not in sys.argv
    plan = {}
    for mid in ml.all_map_ids():
        if mid in POMIN: continue
        mp = ml.Mapa(mid)
        if mp.wnetrze: continue
        nowe, juz, inne = tylne(mp)
        if not (nowe or juz or inne): continue
        ok, zle = sprawdz(mp, nowe, juz) if nowe else ({}, [])
        plan[mid] = (mp, ok, zle, juz, inne)
        print("Map%03d %-28s zestaw %2d: tylnych krawędzi %3d -> region 3 na %3d, już było %2d, inny region %d%s" % (
            mid, mp.nazwa[:28], mp.tsid, len(nowe) + len(juz) + len(inne), len(ok), len(juz), len(inne),
            ("  (inne: %s)" % sorted(set(map(str, inne.values())))) if inne else ""))
        for g, laczy, rozcina in zle:
            print("    BEZ ZMIAN ciąg %s..%s (%d kratek): %s%s" % (g[0], g[-1], len(g), ("łączy części %s " % laczy) if laczy else "", (rozcina if isinstance(rozcina, str) else "rozcina część %s" % rozcina) if rozcina else ""))
        obrazek(mp, ok, zle, juz, os.path.join(OBRAZKI, "Map%03d.png" % mid))
    razem = sum(len(p[1]) for p in plan.values())
    print("\nrazem: %d kratek na %d mapach; obrazki: %s (niebieskie 3 - nowe, jasne - już były, czerwone X - zostają bez zmian)" % (razem, sum(1 for p in plan.values() if p[1]), OBRAZKI))
    if not wykonaj:
        print("(dry-run: nic nie zapisano; przy zamkniętym edytorze: python tools/za_wzgorzem/maluj.py --wykonaj)")
        return
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S") + "_mapy")
    os.makedirs(kop, exist_ok=True)
    for mid, (mp, ok, zle, juz, inne) in plan.items():
        if not ok: continue
        stary = open(mp.path, "rb").read()
        nowy = zapisz_regiony(mp.path, mp, ok)
        open(os.path.join(kop, os.path.basename(mp.path)), "wb").write(stary)
        open(mp.path, "wb").write(nowy)
        print("Map%03d: +%d kratek regionu 3  sha256 %s -> %s" % (mid, len(ok), hashlib.sha256(stary).hexdigest()[:16], hashlib.sha256(nowy).hexdigest()[:16]))
    print("zapisano; kopie zapasowe:", kop)


if __name__ == "__main__":
    main()
