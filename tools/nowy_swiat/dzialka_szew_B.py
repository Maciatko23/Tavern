# -*- coding: utf-8 -*-
"""Po ręcznych poprawkach Podgrodzia (Map218), 2026-11-13 (gracz: „na działce dziadka niech będzie sporo drzew i kamieni, trochę gałęzi,
krzaczków; dostosuj resztę”):
  1. Map218: działka dziadka (płot 21..40 x 10..24) - dużo drzew (jasne sosny, małe drzewka), kamienie, kilka krzaków i zwalonych pni;
     gałęzie leżą same (zbieractwo na Map218). Wszystko z działających wzorów zdarzeń; bramy i ich przedpole wolne.
  2. Map218: 2 sosny wyrastające ze skalnej ściany na południu (47,75 i 69,75) - usunięte (jak na Przystani).
  3. Map220 (Miasteczko, gracz go nie poprawiał): wiersze gór 0-6 i 73-79 w kolumnach 0..9 jak wschodnia krawędź Podgrodzia (szew B).
  4. Map219 (Przystań): wiersze 66-69 w kolumnach 76..79 ziemią jak zachodni brzeg Podgrodzia (szew A, brzeg koryta).
  python tools/nowy_swiat/dzialka_szew_B.py [--wykonaj]   (zapis TYLKO przy zamkniętym edytorze; kopie w archiwum)
  potem: drzewa.py --mapy 218,219,220 --wykonaj ; swiat.py"""
import copy, datetime, importlib.util, json, math, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)
FLAGS = RW.read_json("data/Tilesets.json")[0][11]["flags"]

PLOT = (21, 10, 40, 24)                   # inside the fence (region 8; the fence: A2 kind 22 in layer 1 round it)
WANT = [  # (picture, name, how many, min spacing)
    ("!$Pine_A", "Sosna", 3, 2.6), ("!$Pine_B", "Sosna (średnia)", 4, 2.6), ("!$Pine_C", "Sosna (niska)", 3, 2.4),
    ("!$Tree_Small", "Małe drzewo", 2, 2.4),
    ("!$Rock_Mound", "Kopiec kamieni", 2, 2.0), ("!$Boulder_A", "Głaz", 2, 2.2),
    ("!$Rock_Flat", "Płaski kamień", 3, 1.6), ("!$Rock_Mossy", "Omszały kamień", 3, 1.6), ("!$Rock_Pile", "Sterta kamieni", 2, 1.6),
    ("!$Rock_Chunk", "Ostry odłamek", 2, 1.6),
    ("!$Bush_Bare_A", "Suchy krzaczek", 3, 1.6), ("!$Bush_Bare_Wide", "Gęste chaszcze", 2, 1.8),
    ("!$Trunk_Dead", "Martwe drzewo", 2, 2.4),
]


def h01(*a):
    v = 0
    for x in a: v = (v * 1000003 + int(x) * 2654435761) & 0xFFFFFFFF
    v ^= v >> 15; v = (v * 2246822519) & 0xFFFFFFFF; v ^= v >> 13
    return v / 4294967296


def at(m, z, x, y): return m["data"][(z * m["height"] + y) * m["width"] + x]


def add_event(m, e):
    nid = max(ev["id"] for ev in m["events"] if ev) + 1
    if nid >= 500: raise SystemExit("STOP: numer zdarzenia >= 500")
    while len(m["events"]) <= nid: m["events"].append(None)
    e["id"] = nid; m["events"][nid] = e
    return nid


def templates():
    out = {}
    for mid in (218, 219, 222, 221):
        m, _ = RW.read_json("data/Map%03d.json" % mid)
        for e in m["events"]:
            if e:
                cn = e["pages"][0]["image"]["characterName"]
                if cn not in out and any(cn == w[0] for w in WANT): out[cn] = e
    miss = [w[0] for w in WANT if w[0] not in out]
    if miss: raise SystemExit("STOP: brak wzorów zdarzeń: " + ", ".join(miss))
    return out


def plot_fill(m, log):
    tm = templates()
    x0, y0, x1, y1 = PLOT
    taken = {(e["x"], e["y"]) for e in m["events"] if e}
    trees = set()
    def free(x, y, tree):
        if (x, y) in taken: return False
        if tree and any((x + dx, y + dy) in taken for dx in (-1, 0, 1) for dy in (-1, 0, 1)): return False
        if not tree and any((x + dx, y + dy) in trees for (dx, dy) in ((1, 0), (-1, 0), (0, 1), (0, -1), (0, -2))): return False
        if at(m, 5, x, y) != 8: return False                                        # (the plot's own cells)
        if any(at(m, z, x, y) for z in (2, 3)): return False
        t = at(m, 0, x, y)
        if t < 2816 or (FLAGS[t] & 0x0f): return False
        for (gx, gy) in GATES:
            if abs(gx - x) <= 1 and abs(gy - y) <= 2: return False                  # (the gates and the ground in front of them stay open)
        return True
    cells = sorted(((h01(x, y, 11), x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)))
    placed = []
    for (img, name, n, gap) in WANT:
        got = 0
        for (_, x, y) in cells:
            if got >= n: break
            tree = img.startswith("!$Pine") or img == "!$Tree_Small"
            if not free(x, y, tree) or any(math.hypot(x - a, y - b) < gap for (a, b, i2) in placed if (i2.startswith("!$Pine") or i2 == "!$Tree_Small") == tree or tree): continue
            e = copy.deepcopy(tm[img]); e["name"] = name; e["x"] = x; e["y"] = y
            add_event(m, e); taken.add((x, y)); placed.append((x, y, img)); got += 1
            if tree: trees.add((x, y))
        log.append("  działka: %-16s %d/%d" % (img, got, n))
    return len(placed)


GATES = []


def find_gates(m):
    """the gaps in the plot's fence (the fence: the B/C fence tiles on its ring rows / columns)"""
    x0, y0, x1, y1 = PLOT
    ring = [(x, y0 - 1) for x in range(x0 - 1, x1 + 2)] + [(x, y1 + 1) for x in range(x0 - 1, x1 + 2)] + \
           [(x0 - 1, y) for y in range(y0, y1 + 1)] + [(x1 + 1, y) for y in range(y0, y1 + 1)]
    return [(x, y) for (x, y) in ring if not any(at(m, z, x, y) for z in (1, 2, 3))]


def main():
    log = []
    p, lp = RW.read_json("data/Map218.json")
    w, lw = RW.read_json("data/Map219.json")
    t, lt = RW.read_json("data/Map220.json")
    GATES.extend(find_gates(p))
    log.append("  bramy działki: %s" % GATES)
    for i, e in enumerate(p["events"]):
        if e and (e["x"], e["y"]) in ((47, 75), (69, 75)) and e["pages"][0]["image"]["characterName"].startswith("!$Pine"):
            p["events"][i] = None; log.append("  Map218: usunięta sosna ze skały (%d,%d)" % (e["x"], e["y"]))
    n = plot_fill(p, log)
    # seam B: Miasteczko's mountain rows like Podgrodzie's east edge (cells with nothing standing on them only)
    k = 0
    for x in range(0, 10):
        for y in list(range(0, 7)) + list(range(73, 80)):
            if any(e and e["x"] == x and e["y"] == y for e in t["events"]): continue
            for z in range(6):
                v = at(p, z, 79, y)
                if at(t, z, x, y) != v: t["data"][(z * 80 + y) * 80 + x] = v; k += 1
    log.append("  Map220: kafli gór przy szwie B: %d" % k)
    # seam A: the coast's bank rows 66-69 as Podgrodzie's (earth) near the edge
    cells = [(x, y) for x in range(76, 80) for y in range(66, 70) if 2816 <= at(w, 0, x, y) and not any(at(w, z, x, y) for z in (2, 3))]
    for (x, y) in cells: w["data"][y * 80 + x] = 2048 + 24 * 48
    RW.reshape(w, 0, RW.ring(cells, 1))
    log.append("  Map219: brzeg przy szwie A ziemią: %d kratek" % len(cells))
    for l in log: print(l)
    print("Map218: na działce %d nowych rzeczy" % n)
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "dzialka_szew_B_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    for rel, o, lay in (("data/Map218.json", p, lp), ("data/Map219.json", w, lw), ("data/Map220.json", t, lt)):
        shutil.copy2(os.path.join(ROOT, rel), os.path.join(bak, os.path.basename(rel)))
        open(os.path.join(ROOT, rel), "wb").write(RW.json_text(o, lay))
    print("Zapisano; kopie: " + bak)


if __name__ == "__main__":
    main()
