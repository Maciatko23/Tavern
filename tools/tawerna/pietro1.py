# -*- coding: utf-8 -*-
"""Mniejsze piętro I tawerny (Map025 „Pokoje gości”; gracz 2026-11-16: „taką samą wielkość jak parter muszą mieć piętra 1 i 2;
pokoje mogą być mniejsze i ich więcej, szczególnie na piętrze 1”). Z 63 x 55 robi 49 x 42 - jak parter (Map001), schody nad
schodami parteru (x1-3 i x25-27, rzędy 33-39).

Wszystko wycięte z dotychczasowej mapy. Pokoje są ZWĘŻANE: z pokoju zostają wybrane kolumny (łóżko, drzwi, kufer, co ważniejsze
meble), reszta kolumn wypada w całości - mebel nigdy nie jest cięty (kolumny połączone jednym meblem idą razem).
  rzędy 0-12   8 pokoi po 5 kratek: 3, 1, 2, 4, 5, 12, 8, 11 (drzwi na dół, na korytarz)
  rzędy 13-19  korytarz
  rzędy 20-32  pokój 6 | hol | pokój 10 | łaźnia | pokój 9 (drzwi do góry, z korytarza)
  rzędy 32-41  hol schodowy (x0-28, jak było) i koniec korytarza południowego (x29-47)
Znikają: pokój 7 i Komnata z kominkiem (ta idzie na piętro II), drzwi dolnych pokoi w korytarzu południowym.
Numery zdarzeń zostają. Zwraca też tablicę „stare pole -> nowe pole” (przejścia, miejsca we wtyczkach).

  python tools/tawerna/pietro1.py <podglad.png>             (tylko obraz)
  python tools/tawerna/pietro1.py <podglad.png> --wykonaj   (zapis Map025 + tools/tawerna/pietro1_pola.json; edytor zamknięty)"""
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

NW, NH = 49, 42
# the rooms of the old map: interior columns x0..x1; "n": door below (rows 1..15 with the corridor's wall under it),
# "m": door above (rows 20..32), "s": door below onto the south corridor (rows 33..48 - its floor a row shorter here)
ROOMS = {"r3": (1, 13, "n"), "r1": (15, 22, "n"), "r2": (24, 30, "n"), "r4": (32, 43, "n"), "r5": (45, 53, "n"), "r12": (55, 61, "n"),
         "r8": (1, 9, "s"), "r11": (52, 61, "s"), "r10": (19, 28, "m"), "bath": (35, 49, "m"), "r9": (51, 61, "m")}
# the slots of the new map: room -> (first column, width)
NORTH = [("r3", 1, 5), ("r1", 7, 5), ("r2", 13, 5), ("r4", 19, 5), ("r5", 25, 5), ("r12", 31, 5), ("r8", 37, 5), ("r11", 43, 5)]
MID = [("r10", 19, 9), ("bath", 29, 13), ("r9", 43, 5)]
# columns chosen by hand where the automatic choice was not good (room -> the old columns kept)
KEEP = {}


def build():
    old, lay = RW.read_json("data/Map025.json")
    W, H = old["width"], old["height"]
    src = np.array(old["data"], dtype=np.int64).reshape(6, H, W)
    new = np.zeros((6, NH, NW), dtype=np.int64)
    VOID = src[:, 0, 0].copy()
    new[:, :, :] = VOID[:, None, None]
    evs = [e for e in old["events"] if e]
    at = {}
    for e in evs: at.setdefault((e["x"], e["y"]), []).append(e)
    cell = {}                                  # old (x, y) -> new (x, y)

    def put(ox, oy, nx, ny, layers=range(6), soft=False):
        for z in layers: new[z, ny, nx] = src[z, oy, ox]
        if soft: cell.setdefault((ox, oy), (nx, ny))        # (a cell a moved room took first keeps that place for its events)
        else: cell[(ox, oy)] = (nx, ny)

    def rows_of(kind):
        if kind == "n": return list(range(1, 16)), 0
        if kind == "m": return list(range(20, 33)), 0
        return [33, 34, 35] + list(range(36, 44)) + [45, 46, 47, 48], -32      # ("s": the floor row 44 is bare in both - dropped)

    def choose(key, width):
        x0, x1, kind = ROOMS[key]
        if key in KEEP: return KEEP[key]
        rows, _ = rows_of(kind)
        cols = list(range(x0, x1 + 1))
        link = {x: x for x in cols}            # columns one piece of furniture joins
        def find(a):
            while link[a] != a: a = link[a]
            return a
        for y in rows:
            for x in cols[:-1]:
                for z in (2, 3):
                    a, b = int(src[z, y, x]), int(src[z, y, x + 1])
                    if a and b == a + 1 and a % 8 != 7: link[find(x + 1)] = find(x)
            for x in cols:
                for e in at.get((x, y), []):
                    o = PZ._occ(e.get("note"))
                    for dx in range(-o["left"], o["right"] + 1):
                        if x0 <= x + dx <= x1: link[find(x + dx)] = find(x)
        score = {x: 0.0 for x in cols}
        must = set()
        for y in rows:
            for x in cols:
                for e in at.get((x, y), []):
                    n = e["name"]
                    if re.match(r"^(Łóżko|Łoże|Drzwi|Wejście|Wyjście|Kufer)", n): must.add(x)
                    score[x] += 3 if n != "wypelnienie" else 0.2
                for z in (2, 3):
                    if src[z, y, x]: score[x] += 1
                if src[1, y, x]: score[x] += 0.15
        # the doormat under a door is two cells wide: both columns stay
        for y in rows:
            for x in cols[:-1]:
                if src[1, y, x] and src[1, y, x + 1] and (x in must or x + 1 in must) and y in (12, 20, 45): must |= {x, x + 1}
        groups = {}
        for x in cols: groups.setdefault(find(x), []).append(x)
        keep = set()
        for g in groups.values():
            if any(x in must for x in g): keep |= set(g)
        rest = sorted((g for g in groups.values() if not (set(g) & keep)), key=lambda g: -sum(score[x] for x in g) / len(g))
        for g in rest:
            if len(keep) + len(g) <= width: keep |= set(g)
        if len(keep) > width: raise SystemExit("%s: %d kolumn nie do ruszenia, a miejsca %d: %s" % (key, len(keep), width, sorted(keep)))
        for x in cols:                          # (still room: the barest columns back, nearest the kept ones)
            if len(keep) >= width: break
            if x not in keep and len(groups[find(x)]) == 1: keep.add(x)
        return sorted(keep)

    report = {}
    def room(key, nx0, width):
        x0, x1, kind = ROOMS[key]
        cols = choose(key, width)
        report[key] = cols
        rows, dy = rows_of(kind)
        ys = {}
        if kind == "s":                        # into the north band: its wall rows 33..35 -> 1..3, floor 36..43 -> 4..11, 45..48 -> 12..15
            for i, y in enumerate(rows): ys[y] = 1 + i
        else:
            for y in rows: ys[y] = y
        for i, ox in enumerate(cols):
            for y in rows:
                if kind == "s" and y >= 46 and not any(re.match(r"^(Drzwi|Wejście)", e["name"]) for yy in (46, 47, 48) for e in at.get((ox, yy), [])):
                    continue                    # (the stair hall's wall there: stairs, a curtain - not this room's)
                put(ox, y, nx0 + i, ys[y])

    # ---- the north band and the corridor's wall under it
    PLAIN_WALL = 2                                              # (a column of the corridor's wall with nothing on it)
    for nx in range(0, NW):
        for y in (13, 14, 15): new[:, y, nx] = src[:, y, PLAIN_WALL]
    for key, nx0, width in NORTH: room(key, nx0, width)
    for nx in (0, 6, 12, 18, 24, 30, 36, 42, 48):               # the walls between the rooms: void above, the corridor's wall below
        new[:, 0:13, nx] = VOID[:, None]
    new[:, 13:16, 0] = src[:, 13:16, 0]; new[:, 13:16, 48] = src[:, 13:16, 62]
    # ---- the corridor's floor (rows 16..19): the old one, its right end moved in
    for y in range(16, 20):
        for nx in range(0, 47): put(nx, y, nx, y)
        put(61, y, 47, y); put(62, y, 48, y)
    # ---- the middle band
    for y in range(20, 33):
        for nx in range(0, 19): put(nx, y, nx, y)               # room 6 and the hall, as they were
    for key, nx0, width in MID: room(key, nx0, width)
    for nx in (28, 42, 48): new[:, 20:33, nx] = VOID[:, None]
    # ---- the south part: rows 45..54 -> 32..41
    for oy in range(46, 55):
        for nx in range(0, 47): put(nx, oy, nx, oy - 13, soft=True)
        put(61, oy, 47, oy - 13, soft=True); put(62, oy, 48, oy - 13, soft=True)
    for nx in range(30, 34):
        new[:, 33:36, nx] = src[:, 46:49, 34]   # (the east hall's way down is gone: wall)
        new[0, 36:41, nx] = src[0, 49:54, 34]   # (...and its own floor at the corridor's edge: the corridor's boards)
    for nx in range(11, 18): put(nx, 45, nx, 32)                # the hall's way down into the stair hall
    # ---- the stairwells (the user 2026-11-16: "schody podzielone na góra/dół, części koło siebie, jak w klatce schodowej"): beside each
    # flight down (x1-3 over the ground floor's west flight, x25-27 over its east one) a second flight up to the Apartamenty with the
    # gilded gate - x5-7 and x29-31 (a copy of the old west flight, its rail after it)
    for (fx, rail) in ((5, 8), (29, 32)):
        for oy in range(45, 53):
            for i in range(3): new[:, oy - 13, fx + i] = src[:, oy, 1 + i]
            new[:, oy - 13, rail] = src[:, oy, 4]
    new[1, 36:41, 28] = 0                                       # (a sliver of the east corridor's carpet between the two flights)
    new[:, 41, :] = VOID[:, None]; new[:, 0, :] = VOID[:, None]

    # ---- the events
    gone_names = re.compile(r"^(Drzwi|Wejście|Wyjście) .*(Pokój 7|Pokój 8|Pokój 11|Komnat)")
    events = [None] * len(old["events"])
    kept, lost = 0, []
    north_keys = {k for k, _, _ in NORTH}
    for e in evs:
        to = cell.get((e["x"], e["y"]))
        # the south corridor's doors of the rooms that moved or went: gone with their rooms' old places
        if to and 46 <= e["y"] <= 48 and re.match(r"^(Drzwi|Wejście)", e["name"]) and e["x"] in (23, 42): to = None   # (room 7, the chamber: gone)
        if to and 30 <= e["x"] <= 33 and 45 <= e["y"] <= 48: to = None
        if not to: lost.append((e["id"], e["name"], e["x"], e["y"])); continue
        c = copy.deepcopy(e); c["x"], c["y"] = to
        events[e["id"]] = c; kept += 1
    # the stairwells' events: the old west flight's (up, with the gate) go to x5-7; a second set at x29-31; the west flight x1-3 leads
    # down to the ground floor like the east one
    def clone(e, x, y):
        c = copy.deepcopy(e); c["id"] = len(events); c["x"], c["y"] = x, y; events.append(c); return c
    by = {e["id"]: e for e in evs}
    for k, i in enumerate((293, 294, 295)):
        events[i]["x"], events[i]["y"] = 5 + k, 34
        c = clone(events[i], 29 + k, 34)
        for p in c["pages"]:
            for cm in p["list"]:
                if cm["code"] == 201: cm["parameters"][2] = 25 + k          # (Map026 as it stands: its east flight; fixed again when that floor is rebuilt)
    events[298]["x"], events[298]["y"] = 6, 36
    clone(events[298], 30, 36)
    for k, i in enumerate((288, 289, 290)):
        c = clone(by[i], 1 + k, 34)
        for p in c["pages"]:
            for cm in p["list"]:
                if cm["code"] == 201: cm["parameters"][1:5] = [1, 1 + k, 40, 2]
    for i in (227, 228):                                                    # (the picture and the vase on the wall between the east flights)
        if events[i]: lost.append((i, events[i]["name"], 0, 0)); events[i] = None
    for e in list(events):                                                  # (what stood where the new flights are)
        if e and e["id"] not in (293, 294, 295, 298) and e["id"] < len(old["events"]) and 33 <= e["y"] <= 39 and (5 <= e["x"] <= 8 or 29 <= e["x"] <= 32):
            lost.append((e["id"], e["name"], e["x"], e["y"])); events[e["id"]] = None
    # the autotiles afresh (walls, rugs, the carpet)
    allc = {(x, y) for y in range(NH) for x in range(NW)}
    for z in (0, 1): PZ.przelicz_warstwe(new[z], allc)
    out = copy.deepcopy(old)
    out["width"], out["height"] = NW, NH
    out["data"] = [int(v) for v in new.reshape(-1)]
    out["events"] = events
    return old, lay, out, cell, report, lost, kept


def _in_moved(e, cell, report):
    """a south-corridor door that belongs to a room moved into the north band (rooms 8 and 11: their own columns carry it)"""
    for key in ("r8", "r11"):
        if e["x"] in report.get(key, []): return True
    return False


def main():
    old, lay, out, cell, report, lost, kept = build()
    print("nowa mapa %d x %d (było %d x %d); zdarzeń zostaje %d, znika %d" % (NW, NH, old["width"], old["height"], kept, len(lost)))
    for k, cols in report.items(): print("  %-5s kolumny %s" % (k, cols))
    print("  znikają:", sorted({n for _, n, _, _ in lost if not n.startswith(("wypelnienie", "Na stole"))}))
    png = next((a for a in sys.argv[1:] if a.lower().endswith(".png")), None)
    if png:
        L.render(L.Mapa(25, raw=out)).convert("RGB").save(png); print("podgląd:", png)
    if "--wykonaj" not in sys.argv: print("(podgląd - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "tawerna_pietro1_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S")); os.makedirs(bak, exist_ok=True)
    rel = os.path.join(ROOT, "data", "Map025.json"); shutil.copy2(rel, bak); open(rel, "wb").write(RW.json_text(out, lay))
    json.dump([[k[0], k[1], v[0], v[1]] for k, v in sorted(cell.items())], open(os.path.join(HERE, "pietro1_pola.json"), "w"))
    print("Zapisano Map025; kopia:", bak)


if __name__ == "__main__":
    main()
