# Wyrównanie wody na łączonych krawędziach map wyspy (2026-10-30, gracz: "jak z jednej mapy przechodzi przy linii brzegowej do drugiej,
# to niech się pojawia na drugiej też przy linii brzegowej"). Rozjazdy mierzy tools/brzeg/pary_krawedzi.py.
#   157 E <-> 159 W (przes. y+14): zatoka w północno-wschodnim rogu 157, woda przy krawędzi do rzędu 18 ((111,19) = pierwszy ląd)
#   125 N <-> 155 S (przes. x+9):  woda przy południowej krawędzi 155 do x=20 (brzeg łukiem)
#   125 S <-> 162 N (przes. 0):    woda przy południowej krawędzi 125 do x=14
#   162 W <-> 165 E (przes. 0):    pasy lądu na zachodniej krawędzi 162 (rzędy 15-17, 40-45, 53-59) zalane morzem; łacha 20-22 bez zmian
# Map159 NIE jest ruszana (zachodnią krawędź przerobił gracz).
#   python tools/brzeg/popraw_krawedzie.py            podgląd (statystyki, obrazki do scratchpad)
#   python tools/brzeg/popraw_krawedzie.py --zapisz   zapis do data/ (edytor zamknięty)
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from brzeg_lib import *

SAVE = "--zapisz" in sys.argv
BAK = os.path.join(ROOT, "backup_art_2026-10-30", "brzegi")
P = {i: Plik(i) for i in (125, 155, 157, 162)}

def apply(pl, cells, keep=()):
    m = pl.m
    cells = {c for c in cells if 0 <= c[0] < m["width"] and 0 <= c[1] < m["height"]}
    carve(m, cells)
    moved = evacuate(m, cells, keep_ids=keep)
    reshape_around(m, cells, 1)
    print("Map%03d: nowa woda %d kratek, przeniesione zdarzenia: %s" % (pl.mid, len(cells), moved or "-"))

# 157: the north-east bay (the existing coast: row 5 from x=94, row 18 reaches x=108)
c157 = set()
for y in range(5, 19):
    t = (y - 5) / 13.0
    xs = 94 + 14.0 * (t ** 1.35) + (noise1(y, 3.0, 11) - 0.5) * 1.6
    xs = max(94, min(109, round(xs)))
    if y >= 17: xs = min(xs, 110)
    for x in range(xs, 112): c157.add((x, y))
apply(P[157], c157)

# 155: the south-west bay by the way in from the harbour: water to x=20 at the edge, the (4,60) driftwood spot stays dry
c155 = set()
for y in range(62, 72):
    t = (y - 61) / 10.0
    xr = 4 + 16.0 * (t ** 1.6) + (noise1(y, 2.5, 5) - 0.5) * 1.2
    xr = round(xr)
    if y >= 70: xr = max(xr, 20)
    xr = min(xr, 20)
    for x in range(0, xr + 1): c155.add((x, y))
apply(P[155], c155)

# 125: the south-west corner, the sea to x=14 at the edge (162's north edge has 15 water cells)
apply(P[125], {(12, 77), (12, 78), (13, 78), (12, 79), (13, 79), (14, 79)})

# 162: the west edge is the sea (165's east edge is the sea but for the sandbar 20-22); the sandbar's own cells are not touched
c162 = {(x, y) for y in range(15, 18) for x in range(0, 4)}
for y in list(range(40, 46)) + list(range(53, 60)):
    for x in range(0, 2): c162.add((x, y))
apply(P[162], c162, keep=(72,))

if SAVE:
    for i, pl in P.items():
        pl.zapisz(BAK)
        print("zapisano", pl.rel)
else:
    import mapylib as L
    out = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else None
    if out:
        for i, reg in ((157, (70, 0, 112, 30)), (155, (0, 40, 40, 72)), (125, (0, 55, 30, 80)), (162, (0, 0, 30, 80))):
            L.render(L.Mapa(i, raw=P[i].m), region=reg, scale=0.5).save(os.path.join(out, "popraw_%d.png" % i))
