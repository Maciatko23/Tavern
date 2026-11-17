# -*- coding: utf-8 -*-
"""Suche koryto na Posiadłości + mostki Miasteczka (2026-11-13). Gracz przebudował Miasteczko (Map220): suche koryto, krawędź skarpy
(A5 1625) w wierszu 53 na całej szerokości, dół gór 73..75 = 1625/1641/1649 (porządna półka zamiast pasków), i wybrał
„Wysusz całe koryto 221”:
  - Posiadłość (Map221): woda w korycie (wiersze 50-51, x 0..50, do jazu) -> ubita ziemia koryta (A2 24); staw za jazem i rów
    z niego zostają (woda Lorda); w wierszu 53 krawędź skarpy jak w Miasteczku (bez przerwy na zejście z mostka x 28..30);
  - Posiadłość i Góry (Map221, Map222): dół gór 73..75 jak w Miasteczku (1625 / 1641 / 1649) - szwy się zgadzają;
  - Miasteczko (Map220): oba mostki znów przepuszczają na południe - malowanie krawędzi w wierszu 53 zdjęło deski mostków
    z warstwy 1: deski wracają w wiersz 53 (zachodni x 13..15 pod obrazkiem mostu, wschodni x 71..73), a resztka wody pod
    wschodnim mostkiem (x 71..73, wiersze 50-51) -> ziemia koryta.
  python tools/nowy_swiat/koryto_suche.py [--podglad=<katalog>] [--wykonaj]"""
import datetime, importlib.util, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

W = H = 80
BED, DECK, RIM = 2048 + 24 * 48, 2048 + 33 * 48, 1625
LEDGE = {73: (1657, 1625), 74: (1649, 1641), 75: (1625, 1649)}     # row: (old, new) - the town's foot of the mountains
def kind(t): return (t - 2048) // 48 if t >= 2048 else None
def water(t): return 2048 <= t < 2048 + 2 * 48                     # A1 kinds 0-1 (water, deep water)
def ground(t): return kind(t) in (16, 17, 27)                       # grass, earth, dark grass


def main():
    maps = {mid: RW.read_json("data/Map%d.json" % mid) for mid in (220, 221, 222)}
    at = lambda m, z, x, y: m["data"][(z * H + y) * W + x]
    def put(m, z, x, y, v): m["data"][(z * H + y) * W + x] = v
    log = []
    # ---- Posiadłość: the river west of the weir dries up
    P = maps[221][0]
    dry = [(x, y) for y in range(44, 57) for x in range(0, 51) if water(at(P, 0, x, y))]
    for (x, y) in dry: put(P, 0, x, y, BED)
    RW.reshape(P, 0, RW.ring(dry, 1))
    rim = [(x, 53) for x in range(0, 50) if not (28 <= x <= 30) and ground(at(P, 0, x, 53))]
    for (x, y) in rim:
        put(P, 0, x, y, RIM)
        if kind(at(P, 1, x, y)) in (21, 47, 39): put(P, 1, x, y, 0)   # tufts / pebbles off the ledge's edge
    RW.reshape(P, 0, RW.ring(rim, 1))
    log.append("Posiadłość: %d kratek wody -> ziemia koryta, krawędź skarpy w wierszu 53: %d kratek" % (len(dry), len(rim)))
    # ---- the foot of the mountains on 221 and 222 like the town's
    for mid in (221, 222):
        m, n = maps[mid][0], 0
        for y, (old, new) in LEDGE.items():
            for x in range(W):
                if at(m, 0, x, y) == old: put(m, 0, x, y, new); n += 1
        log.append("Map%d: dół gór 73..75 jak w Miasteczku - %d kratek" % (mid, n))
    # ---- Miasteczko: both bridges reach the south bank again
    T = maps[220][0]
    wet = [(x, y) for y in (50, 51) for x in (71, 72, 73) if water(at(T, 0, x, y))]
    for (x, y) in wet: put(T, 0, x, y, BED)
    RW.reshape(T, 0, RW.ring(wet, 1))
    deck = []
    for xs in ((13, 14, 15), (71, 72, 73)):
        if not all(kind(at(T, 1, x, 52)) == 33 for x in xs): raise SystemExit("STOP: Map220 - nie ma desek mostka w wierszu 52 przy x %s" % (xs,))
        for x in xs:
            if at(T, 1, x, 53) == 0: put(T, 1, x, 53, DECK); deck.append((x, 53))
    RW.reshape(T, 1, [c for c in RW.ring(deck, 1) if kind(at(T, 1, *c)) == 33])
    log.append("Miasteczko: woda pod wschodnim mostkiem -> koryto (%d), deski mostków w wierszu 53: %d" % (len(wet), len(deck)))
    for l in log: print(l)
    for a in sys.argv:
        if a.startswith("--podglad="):
            d = a.split("=", 1)[1]
            for mid, (m, lay) in maps.items(): open(os.path.join(d, "Map%d.json" % mid), "wb").write(RW.json_text(m, lay))
            print("  podgląd: " + d)
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "koryto_suche_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    for mid, (m, lay) in maps.items():
        rel = "data/Map%d.json" % mid
        shutil.copy2(os.path.join(ROOT, rel), bak)
        open(os.path.join(ROOT, rel), "wb").write(RW.json_text(m, lay))
    print("Zapisano; kopie: " + bak)


if __name__ == "__main__":
    main()
