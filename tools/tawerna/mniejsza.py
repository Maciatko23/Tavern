# -*- coding: utf-8 -*-
"""Mniejszy parter tawerny (Map001; gracz 2026-11-16: „główne wejście, schody po bokach i główna sala całkowicie zostają; tuż za
ścianą za ladą Borgara kuchnia; po prawej od sali 3 pomieszczenia - scena ze śpiewaczką, rzutki i inne ważne rzeczy; parter
wyraźnie mniejszy”; wybrał: scena + sala gier + składzik, kuchnia ok. 9 rzędów).

Z 63 x 55 robi 49 x 42. Wszystko jest wycięte z dotychczasowej mapy (nic nie rysowane od nowa):
  rzędy 0-9   x0-28   kuchnia z piecami i piece chlebowe (góra dawnej kuchni i spiżarni, otwarte na siebie rzędem 9),
              x29-48  składzik: dawny magazyn (beczki, skrzynie, półki) + 6 kolumn, w nich luźna cegła - zejście do piwnicy;
                      wejście ze spiżarni (28,7);
  rzędy 10-41 x0-28   sala główna z wejściem i schodami - bez zmian (wszystko o 13 rzędów wyżej: y - 13),
  rzędy 10-26 x29-48  scena ze śpiewaczką - bez zmian (y - 13), przejście na prawo zamknięte,
  rzędy 27-41 x29-48  sala gier: dawna sala gier (kości, karty, szachy, siłowanie, Grum) + 6 kolumn po lewej z dwiema
                      tarczami do rzutek; wejście z sali (28,30) - dawne wejście do biblioteki.
Znikają: korytarz, dół kuchni i spiżarni, stary skład, sypialnia służby, gabinet, biblioteka, sala rzutek.
Numery zdarzeń zostają (wtyczki znajdują je po numerach i znacznikach); zdarzenia z usuniętych pomieszczeń znikają.

  python tools/tawerna/mniejsza.py <podglad.png>             (tylko obraz)
  python tools/tawerna/mniejsza.py <podglad.png> --wykonaj   (zapis Map001; tylko przy zamkniętym edytorze; kopie w archiwum)"""
import copy, datetime, importlib.util, json, os, re, shutil, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy")); sys.path.insert(0, os.path.join(ROOT, "tools", "mapy", "pieczatki"))
import mapylib as L
import pieczatki as PZ
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

NW, NH, DY = 49, 42, 13


def where(x, y):
    """the new place of an old cell's event (None: its room is gone)"""
    if x <= 28 and y <= 9: return (x, y)                                   # the kitchen, the bread ovens
    if x <= 47 and 23 <= y <= 39: return (x, y - DY)                       # the hall's top, the stage room
    if x <= 28 and y >= 40: return (x, y - DY)                             # the hall's bottom
    if 49 <= x <= 61 and 11 <= y <= 20: return (x - 14, y - 11)            # the store (the old magazine)
    if 49 <= x <= 61 and 24 <= y <= 38 and y != 28: return (x - 14, y + 3 if y <= 27 else y + 2)   # the games room
    return None


# events of the rooms that go, kept in a new place: the loose brick (the way to the cellar), the darts
MOVED = {9: (31, 2), 133: (30, 29), 134: (33, 29), 174: (30, 35), 176: (33, 35), 138: (31, 36), 135: (32, 28)}


def build():
    old, lay = RW.read_json("data/Map001.json")
    W, H = old["width"], old["height"]
    src = np.array(old["data"], dtype=np.int64).reshape(6, H, W)
    new = np.zeros((6, NH, NW), dtype=np.int64)
    VOID = src[:, 0, 0].copy()

    def blit(x0, y0, x1, y1, nx, ny, layers=range(6)):
        for z in layers: new[z, ny:ny + (y1 - y0 + 1), nx:nx + (x1 - x0 + 1)] = src[z, y0:y1 + 1, x0:x1 + 1]

    new[:, :, :] = VOID[:, None, None]
    blit(0, 0, 28, 9, 0, 0)                 # the kitchen and the bread ovens
    blit(0, 23, 47, 39, 0, 10)              # the hall's top and the stage room
    blit(0, 40, 28, 54, 0, 27)              # the hall's bottom (its right wall with the way into the old library: now the games room)
    new[:, 9, 0] = VOID                     # (the kitchen's old side way at the map's edge)
    # the store: the old magazine (x49..61, rows 11..20), six plain columns before it
    blit(49, 11, 61, 20, 35, 0)
    for nx in range(29, 35): new[:, 0:10, nx] = src[:, 11:21, 54]
    new[:, 0:3, 41] = src[:, 11:14, 54]     # (the way up to the office: wall again)
    new[:, 7, 28] = src[:, 18, 54]          # the way in from the bread ovens
    blit(50, 17, 53, 18, 30, 6, layers=(2, 3))   # a second stack of barrels in the new part
    # the games room: wall rows 24..26, floor rows 27 and 29..38 (row 28 was bare), six plain columns with the darts before it
    for (oy, ny) in [(24, 27), (25, 28), (26, 29), (27, 30)] + [(y, y + 2) for y in range(29, 39)]:
        new[:, ny, 35:48] = src[:, oy, 49:62]
        for nx in range(29, 35): new[:, ny, nx] = src[:, oy if oy <= 26 else 28, 54]
    blit(43, 50, 45, 51, 30, 38, layers=(2, 3))  # the darts room's round table with its two chairs
    new[:, :, 48] = VOID[:, None]
    new[:, 41, 29:49] = VOID[:, None]
    new[:, 0, :] = VOID[:, None]
    # the shapes of the autotiles where the pieces meet
    seam = set()
    for y in range(NH):
        for x in range(NW):
            if x >= 27 or y <= 11 or (26 <= y <= 31 and x >= 27) or x == 0: seam.add((x, y))
    before = new.copy()
    for z in (0, 1): PZ.przelicz_warstwe(new[z], seam)
    changed = int((before != new).sum())

    # the events: the same numbers, the new places
    events = [None] * len(old["events"])
    gone = []
    for e in old["events"]:
        if not e: continue
        to = MOVED.get(e["id"]) or where(e["x"], e["y"])
        if e["id"] in (247,) or (e["x"], e["y"]) == (55, 13) or (e["x"], e["y"]) == (55, 12): to = None   # (doors of ways that are gone)
        if not to: gone.append((e["id"], e["name"])); continue
        c = copy.deepcopy(e); c["x"], c["y"] = to
        events[e["id"]] = c
    # the events standing on the copied round table of the darts room
    for e in old["events"]:
        if e and 43 <= e["x"] <= 45 and 50 <= e["y"] <= 51 and e["id"] not in MOVED:
            c = copy.deepcopy(e); c["x"], c["y"] = e["x"] - 13, e["y"] - 12; events[e["id"]] = c
            gone[:] = [g for g in gone if g[0] != e["id"]]
    out = copy.deepcopy(old)
    out["width"], out["height"] = NW, NH
    out["data"] = [int(v) for v in new.reshape(-1)]
    out["events"] = events
    return old, lay, out, gone, changed


def main():
    old, lay, out, gone, changed = build()
    print("nowa mapa %d x %d (było %d x %d); przeliczonych kafli na stykach: %d; zdarzeń zostaje %d, znika %d" % (
        NW, NH, old["width"], old["height"], changed, sum(1 for e in out["events"] if e), len(gone)))
    png = next((a for a in sys.argv[1:] if a.lower().endswith(".png")), None)
    if png:
        mp = L.Mapa(1, raw=out)
        L.render(mp).convert("RGB").save(png); print("podgląd:", png)
    if "--wykonaj" not in sys.argv: print("(podgląd - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "tawerna_mniejsza_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S")); os.makedirs(bak, exist_ok=True)
    rel = os.path.join(ROOT, "data", "Map001.json"); shutil.copy2(rel, bak); open(rel, "wb").write(RW.json_text(out, lay))
    print("Zapisano Map001; kopia:", bak)


if __name__ == "__main__":
    main()
