# -*- coding: utf-8 -*-
"""Ogródki mieszkańców i pole bez płotu (gracz 2026-11-13: „czy tam każdy domek ma swój ogródek? i pojawiają się na tych polach zbieralne
warzywa?” -> „każda chata z ogródkiem”, „rosną, ale są cudze”; „pole ze zbożem niech nie ma płotka naokoło i będzie trochę większe”;
„ogródki mieszkańców przy domkach ich mają być”):
  Map218 (Podgrodzie, plik gracza):
    1. pole młynarza bez płotu i większe: ziemia x 9..16, y 28..33 (8 x 6, region 7), zdarzenie „Pole młynarza” <Pole:8,6>;
    2. ogródek pod wiatrakiem (już nie przy żadnym domu) -> trawa;
    3. ogródki rodziny i wodziarza: namalowane warzywa (kafle C) -> żywe (zdarzenie <Ogrodek:...>, js/plugins/Ogrodki.js);
    4. każda chata bez ogródka dostaje mały ogródek w płotku TUŻ PRZY SWOIM DOMU (z boku domu albo przed nim, obok ścieżki do drzwi):
       grządki 4 x 3 (rząd warzyw, ścieżka, rząd warzyw), furtka od dołu; tylko na wolnym gruncie (trawa / ziemia, bez dróg, zdarzeń,
       rzeczy, regionów, nie przed drzwiami), inaczej chata zostaje bez ogródka (raport).
  Map220 (Miasteczko): namalowane warzywa w ogródkach -> żywe, w tych samych miejscach.
  python tools/nowy_swiat/ogrodki.py [--podglad=<katalog>] [--wykonaj]"""
import copy, datetime, importlib.util, json, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
sys.path.insert(0, os.path.join(ROOT, "tools", "newstart"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
from nslib import C                                                     # noqa: E402
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)
FLAGS = RW.read_json("data/Tilesets.json")[0][11]["flags"]

CROP_TILES = {C(c, r) for c in (5, 6, 7) for r in (2, 3)}
GRASS, EARTH, PATH, FENCE = 16, 24, 17, 22
OVERLAYS = {21, 29, 31, 39, 47, 12, 13}             # (A2 patches lying on the ground: tufts, flowers, pebbles - a garden may go over them)
NO_GARDEN = {"Wiatrak", "Szopa Wróbli", "Dom dziadka"}
FIELD = (9, 28, 16, 33)
ROAD = (39, 47)
MILL_PATH = [(4, y) for y in range(25, 36)] + [(5, 35), (6, 35)]   # (the miller's path to the windmill: kept)                                      # (the rows of the main road west - east: no garden on it)
WINDMILL_GARDEN = (8, 36, 13, 40)                    # (its ring)
GATHERABLE = ("Pieniek", "Kolczaste pnącza", "Suchy krzaczek", "Płaski kamień", "Omszały kamień", "Sterta kamieni", "Ostry odłamek", "Kopiec kamieni",
              "Głaz", "Gęste chaszcze", "Martwe drzewo")


def a2(k): return 2048 + k * 48
def kind(t): return (t - 2048) // 48 if 2048 <= t < 8192 else -1


class Map:
    def __init__(self, mid):
        self.mid = mid; self.rel = "data/Map%03d.json" % mid
        self.m, self.lay = RW.read_json(self.rel)
        self.W, self.H = self.m["width"], self.m["height"]
    def at(self, z, x, y): return self.m["data"][(z * self.H + y) * self.W + x]
    def put(self, z, x, y, v): self.m["data"][(z * self.H + y) * self.W + x] = v
    def events(self): return [e for e in self.m["events"] if e]
    def add_event(self, e):
        nid = max(v["id"] for v in self.events()) + 1
        if nid >= 500: raise SystemExit("STOP: numer zdarzenia >= 500")
        while len(self.m["events"]) <= nid: self.m["events"].append(None)
        e["id"] = nid; self.m["events"][nid] = e
        return nid
    def drop(self, pred):
        n = 0
        for i, e in enumerate(self.m["events"]):
            if e and pred(e): self.m["events"][i] = None; n += 1
        return n


def plain_event(M, name, x, y, note):
    tmpl = next(e for e in M.events() if e["name"].startswith("Drzwi"))
    e = copy.deepcopy(tmpl)
    e.update({"name": name, "x": x, "y": y, "note": note})
    e["pages"] = [e["pages"][0]]
    pg = e["pages"][0]
    pg["image"] = {"tileId": 0, "characterName": "", "direction": 2, "pattern": 0, "characterIndex": 0}
    pg["priorityType"], pg["through"], pg["trigger"], pg["list"] = 0, True, 0, [{"code": 0, "indent": 0, "parameters": []}]
    return e


def crop_rows_of(M, x0, y0, x1, y1):
    """the rows of a painted garden that hold crop tiles (relative to y0) -> "02" / "01" ..."""
    return "".join(str(y - y0) for y in range(y0, y1 + 1) if any(M.at(2, x, y) in CROP_TILES for x in range(x0, x1 + 1)))


def living(M, x0, y0, x1, y1, owner, name, log):
    """the painted crops of a garden away; soil + region 7; the garden's event"""
    rows = crop_rows_of(M, x0, y0, x1, y1)
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if M.at(2, x, y) in CROP_TILES: M.put(2, x, y, 0)
            M.put(5, x, y, 7)
    M.add_event(plain_event(M, "Ogródek: " + name, x0, y0, "<Ogrodek:%d,%d,%s,%s>" % (x1 - x0 + 1, y1 - y0 + 1, owner, rows or "02")))
    log.append("  żywy ogródek: %s (%d,%d %dx%d, rzędy %s)" % (name, x0, y0, x1 - x0 + 1, y1 - y0 + 1, rows))


def painted_gardens(M):
    cells = {(x, y) for y in range(M.H) for x in range(M.W) if M.at(2, x, y) in CROP_TILES}
    seen, out = set(), []
    for c in sorted(cells):
        if c in seen: continue
        st, g = [c], []
        seen.add(c)
        while st:
            a = st.pop(); g.append(a)
            for dx in (-1, 0, 1):
                for dy in (-2, -1, 0, 1, 2):
                    n = (a[0] + dx, a[1] + dy)
                    if n in cells and n not in seen: seen.add(n); st.append(n)
        xs, ys = [p[0] for p in g], [p[1] for p in g]
        out.append((min(xs), min(ys), max(xs), max(ys)))
    return out


def hut_rect(M, dx, dy):
    """the hut's own cells: the building tiles (A3 / A4 / B-E walls) connected to the cell of its door"""
    def bld(x, y):
        if not (0 <= x < M.W and 0 <= y < M.H): return False
        t = M.at(0, x, y)
        return t >= 4352
    seen, st = set(), [(dx, dy)]
    while st:
        x, y = st.pop()
        if (x, y) in seen or not bld(x, y): continue
        seen.add((x, y)); st += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    if not seen: return None
    xs, ys = [p[0] for p in seen], [p[1] for p in seen]
    return (min(xs), min(ys), max(xs), max(dy, max(ys)))


def main():
    log = []
    P = Map(218)
    # ---- 1. the grain field: no fence, bigger
    fx0, fy0, fx1, fy1 = FIELD
    old_ring = {(x, y) for x in range(9, 18) for y in range(28, 35)} - {(x, y) for x in range(10, 17) for y in range(29, 34)}
    for (x, y) in old_ring:
        if kind(P.at(1, x, y)) == FENCE: P.put(1, x, y, 0)
        if P.at(5, x, y) == 7: P.put(5, x, y, 0)
    soil = {(x, y) for x in range(fx0, fx1 + 1) for y in range(fy0, fy1 + 1)}
    P.drop(lambda e: (e["x"], e["y"]) in soil and e["name"] in GATHERABLE)
    for (x, y) in soil:
        P.put(0, x, y, a2(EARTH)); P.put(5, x, y, 7)
        for z in (1, 2, 3): P.put(z, x, y, 0)
    rest = old_ring - soil
    for (x, y) in rest:
        if P.at(0, x, y) < 4352 and kind(P.at(0, x, y)) in (EARTH,): P.put(0, x, y, a2(GRASS))
    for e in P.events():
        if e["name"] == "Pole młynarza": e["x"], e["y"], e["note"] = fx0, fy0, "<Pole:%d,%d>" % (fx1 - fx0 + 1, fy1 - fy0 + 1)
    log.append("  pole młynarza bez płotu: %dx%d przy (%d,%d)" % (fx1 - fx0 + 1, fy1 - fy0 + 1, fx0, fy0))
    if "--tylko-pole" in sys.argv:
        for l in log: print(l)
        RW.reshape(P.m, 0, RW.ring(soil | old_ring, 1)); RW.reshape(P.m, 1, RW.ring(old_ring, 1))
        if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
        RW.need_editor_closed()
        bak = os.path.join(ARCH, "pole_bez_plotu_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
        os.makedirs(bak, exist_ok=True)
        shutil.copy2(os.path.join(ROOT, P.rel), bak)
        open(os.path.join(ROOT, P.rel), "wb").write(RW.json_text(P.m, P.lay))
        print("Zapisano (tylko pole); kopia: " + bak)
        return
    # ---- 2. the garden under the windmill -> grass
    gx0, gy0, gx1, gy1 = WINDMILL_GARDEN
    for y in range(gy0, gy1 + 1):
        for x in range(gx0, gx1 + 1):
            if kind(P.at(1, x, y)) == FENCE: P.put(1, x, y, 0)
            if P.at(2, x, y) in CROP_TILES: P.put(2, x, y, 0)
            if kind(P.at(0, x, y)) == EARTH: P.put(0, x, y, a2(GRASS))
    log.append("  ogródek pod wiatrakiem -> trawa")
    # ---- 3. the painted gardens left (rodzina, wodziarz) -> living
    doors = [e for e in P.events() if e["name"].startswith("Drzwi: ")]
    def owner_of(x, y):
        d = min(doors, key=lambda e: abs(e["x"] - x) + abs(e["y"] - y))
        import re
        k = re.search(r"<Town:door=([\w-]+)>", d["note"])
        return (k.group(1) if k else "?"), d["name"][7:]
    have = set()
    for (x0, y0, x1, y1) in painted_gardens(P):
        ow, nm = owner_of((x0 + x1) / 2 + 0.6, y0)   # (a tie goes to the hut on the right: the bed lies left of its door path)
        living(P, x0, y0, x1, y1, ow, nm, log); have.add(nm)
    # ---- 4. a garden by every other hut
    taken_ev = {(e["x"], e["y"]) for e in P.events()}
    fronts = set(MILL_PATH)
    for d in doors:
        for k in (1, 2): fronts.add((d["x"], d["y"] + k))
        fronts.add((d["x"] - 1, d["y"] + 1)); fronts.add((d["x"] + 1, d["y"] + 1))
    placed_rings = set()
    clutter_ev = {(e["x"], e["y"]) for e in P.events() if e["name"] in GATHERABLE}
    def why(x, y):
        if not (1 <= x < P.W - 1 and 1 <= y < P.H - 1): return "brzeg"
        if (x, y) in taken_ev and (x, y) not in clutter_ev: return "zdarzenie"
        if (x, y) in fronts: return "przed drzwiami"
        if (x, y) in placed_rings: return "inny ogródek"
        t0 = P.at(0, x, y)
        if not (2816 <= t0 < 4352 and kind(t0) in (GRASS, 27, EARTH, 26, PATH)) and t0 not in (1633, 1638): return "grunt %d" % t0
        if ROAD[0] <= y <= ROAD[1]: return "droga"
        t1 = P.at(1, x, y)
        if t1 and kind(t1) not in OVERLAYS: return "warstwa1 %d" % t1
        if P.at(3, x, y): return "warstwa3"
        if P.at(2, x, y) and not (512 <= P.at(2, x, y) < 768): return "warstwa2 %d" % P.at(2, x, y)
        if P.at(5, x, y) not in (0, 31): return "region %d" % P.at(5, x, y)
        if FLAGS[t0] & 0x0f: return "blokuje"
        return None
    def free(x, y):
        return why(x, y) is None
    def _unused(x, y):
        if not (1 <= x < P.W - 1 and 1 <= y < P.H - 1) or (x, y) in taken_ev or (x, y) in fronts or (x, y) in placed_rings: return False
        t0 = P.at(0, x, y)
        if not (2816 <= t0 < 4352 and kind(t0) in (GRASS, 27, EARTH, 26, PATH)) and t0 not in (1633, 1638): return False
        if ROAD[0] <= y <= ROAD[1]: return False                                    # (the main road's band)
        t1 = P.at(1, x, y)
        if t1 and kind(t1) not in OVERLAYS: return False
        if P.at(2, x, y) or P.at(3, x, y) or P.at(5, x, y) not in (0, 31): return False
        if FLAGS[t0] & 0x0f: return False
        return True
    for d in doors:
        nm = d["name"][7:]
        if nm in NO_GARDEN or nm in have: continue
        hr = hut_rect(P, d["x"], d["y"] - 1)
        if not hr: log.append("  BEZ: %s (nie znalazłem chaty)" % nm); continue
        if "-v" in sys.argv: print("   chata", nm, hr)
        hx0, hy0, hx1, hy1 = hr
        hx0, hx1 = max(hx0, d["x"] - 3), min(hx1, d["x"] + 3)      # (two huts wall to wall: only the one of this door)
        hy0, hy1 = max(hy0, d["y"] - 4), min(hy1, d["y"])
        # every ring position next to the hut (a gap of 0-1 cell from its walls, not on it), three sizes (ring w x h: soil inside);
        # the best: beside the hut, low (by its front), near the door, the biggest size
        best = None
        for si, (w, h) in enumerate(((6, 5), (5, 5), (6, 4), (5, 4))):
            for rx in range(hx0 - w - 1, hx1 + 3):
                for ry in range(hy0 - h - 1, hy1 + 4):
                    if rx + w - 1 >= hx0 and rx <= hx1 and ry + h - 1 >= hy0 and ry <= hy1: continue      # (on the hut)
                    gapx = max(hx0 - (rx + w - 1), rx - hx1, 0) - 1
                    gapy = max(hy0 - (ry + h - 1), ry - hy1, 0) - 1
                    gap = max(gapx, gapy, 0)
                    if gap > 1: continue
                    ring = {(x, y) for x in range(rx, rx + w) for y in range(ry, ry + h)}
                    if not all(free(x, y) for (x, y) in ring): continue
                    behind = ry + h - 1 < hy0
                    cy = ry + (h - 1) / 2
                    score = si * 3 + gap * 4 + (8 if behind else 0) + abs(cy - (hy1 - 1)) * 0.6 + abs((rx + w / 2) - d["x"]) * 0.15
                    gcx = rx + w / 2
                    own = abs(gcx - d["x"]) + abs(cy - d["y"])
                    if any(abs(gcx - o["x"]) + abs(cy - o["y"]) < own - 0.5 for o in doors if o is not d): score += 9   # (nearer to a neighbour's door: his, not ours)
                    if best is None or score < best[0]: best = (score, rx, ry, w, h, ring)
        if not best:
            log.append("  BEZ: %s (brak miejsca przy chacie)" % nm)
            continue
        _, rx, ry, w, h, ring = best
        soil = {(x, y) for x in range(rx + 1, rx + w - 1) for y in range(ry + 1, ry + h - 1)}
        # the gate: the ring's side cell (not a corner) nearest the door's front
        side = [(x, y) for (x, y) in ring - soil if not ((x in (rx, rx + w - 1)) and (y in (ry, ry + h - 1)))]
        fx, fy = d["x"], d["y"] + 1
        gate = min(side, key=lambda c: abs(c[0] - fx) + abs(c[1] - fy) + (0.5 if c[1] == ry else 0))
        P.drop(lambda e: (e["x"], e["y"]) in ring and e["name"] in GATHERABLE)
        for (x, y) in ring:
            if 512 <= P.at(2, x, y) < 768: P.put(2, x, y, 0)          # (ferns, flowers: away under the garden)
        for (x, y) in soil:
            P.put(0, x, y, a2(EARTH)); P.put(1, x, y, 0); P.put(5, x, y, 7)
        for (x, y) in ring - soil - {gate}:
            P.put(1, x, y, a2(FENCE))
        for (x, y) in {gate}: P.put(1, x, y, 0)
        RW.reshape(P.m, 0, RW.ring(soil, 1)); RW.reshape(P.m, 1, RW.ring(ring, 1))
        placed_rings |= {(x, y) for x in range(rx - 1, rx + w + 1) for y in range(ry - 1, ry + h + 1)}
        rows = "02" if h - 2 == 3 else "01"
        where = "%dx%d przy (%d,%d), furtka %s" % (w - 2, h - 2, rx + 1, ry + 1, gate)
        import re
        k = re.search(r"<Town:door=([\w-]+)>", d["note"])
        P.add_event(plain_event(P, "Ogródek: " + nm, rx + 1, ry + 1, "<Ogrodek:%d,%d,%s,%s>" % (w - 2, h - 2, (k.group(1) if k else "?"), rows)))
        log.append("  nowy ogródek: %-24s %s" % (nm, where))
    RW.reshape(P.m, 0, RW.ring(soil | old_ring | {(x, y) for x in range(gx0, gx1 + 1) for y in range(gy0, gy1 + 1)}, 1))
    RW.reshape(P.m, 1, RW.ring(old_ring | {(x, y) for x in range(gx0, gx1 + 1) for y in range(gy0, gy1 + 1)}, 1))
    # ---- Map220: painted gardens -> living
    T = Map(220)
    tdoors = [e for e in T.events() if e["name"].startswith("Drzwi: ")]
    for (x0, y0, x1, y1) in painted_gardens(T):
        d = min(tdoors, key=lambda e: abs(e["x"] - (x0 + x1) / 2) + abs(e["y"] - y0))
        import re
        k = re.search(r"<Town:door=([\w-]+)>", d["note"])
        living(T, x0, y0, x1, y1, k.group(1) if k else "?", d["name"][7:], log)
    for l in log: print(l)
    for a in sys.argv:
        if a.startswith("--podglad="):
            out = a.split("=", 1)[1]
            for M in (P, T): open(os.path.join(out, "Map%03d.json" % M.mid), "wb").write(RW.json_text(M.m, M.lay))
            print("  podgląd: " + out)
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "ogrodki_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    for M in (P, T):
        shutil.copy2(os.path.join(ROOT, M.rel), bak)
        open(os.path.join(ROOT, M.rel), "wb").write(RW.json_text(M.m, M.lay))
    print("Zapisano; kopie: " + bak)


if __name__ == "__main__":
    main()
