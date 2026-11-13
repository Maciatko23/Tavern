# -*- coding: utf-8 -*-
"""Krok 3 planu poprawek map: wzgorza Map013 (Gory i kamieniolom) i latarni Map125 (Przystan). TYLKO staging (tools/poprawki_krok3/staging/data).
Gramatyka wzgorza z tools/wzgorza_popraw/popraw.py (wzgorze nr 1 gracza z Map990), rozszerzona o: wzgorza ZAMKNIETE (bez schodow - polki orla),
szerokie schody (3 kratki: 24 25 26), dwa pietra. Wszystko na warstwie 0; autokafle przeliczone; zdarzenia zdjete z obrysu/lica.
  python tools/poprawki_krok3/popraw3.py        (zapisuje staging + raport)"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "wzgorza_popraw"))
import popraw as P
L, W = P.L, P.W
STG = os.path.join(HERE, "staging", "data")
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
S = dict(P.GRASS)
D = P.DIRT
A5 = 1536

# ---- the hills: top = (x0, y0, x1, y1): the rim row y0, the lip row y1 (walkable), the face y1+1..y1+2; stairs: columns or None (closed)
HILLS = {
    13: [
        {"name": "wzgorze 3 zachod", "top": (14, 96, 27, 101), "stairs": (20, 21)},
        {"name": "wzgorze 3 wschod - polka orla b (zamkniete)", "top": (32, 96, 44, 101), "stairs": None,
         "keep": [(33, 97, 36, 100), (38, 98, 38, 98), (39, 100, 39, 100)], "outside": [(31, 97)]},
        {"name": "wzgorze 4", "top": (49, 104, 60, 109), "stairs": (54, 55)},
        {"name": "wzgorze 6", "top": (95, 93, 106, 99), "stairs": (100, 101)},
        {"name": "wzgorze 7 - polka orla a (zamkniete)", "top": (98, 60, 108, 68), "stairs": None,
         "keep": [(99, 62, 102, 65), (101, 67, 101, 67), (103, 64, 103, 64), (99, 61, 99, 61)], "outside": [(97, 61)]},
    ],
    125: [
        # (gracz 2026-11-10: „żeby te wzgórza nie były takie długie w ląd, a latarnia blisko tylnej krawędzi wyższego wzgórza”: the tower
        # stays at (92,102) - its walls take rows 99-102 - the upper rim is the row right behind it, the lower one 3 rows further back)
        # v2: the tall tower reads as standing where its BASE is (row 102): the upper rim right behind the base (row 100, the walls' upper
        # rows 99-100 hidden under the tower), a forecourt in front of the door (row 103) and the lip (104); the lower rim 2 rows behind
        # (98), so the woodshed (85-89 x 95-97) and the order's post (87,100) stay where they were
        {"name": "latarnia dolne pietro", "top": (86, 98, 97, 107), "stairs": (91, 92, 93), "tier": "L"},
        {"name": "latarnia gorne pietro", "top": (89, 100, 95, 104), "stairs": (91, 92, 93), "tier": "U",
         "keep": [(92, 103, 93, 103), (94, 103, 94, 103)]},
    ],
}
# the old hills' broken A5 pieces: boxes cleared to ground
CLEAR = {13: [(8, 70, 66, 114), (67, 94, 90, 110), (91, 90, 111, 106), (94, 58, 110, 73)], 125: [(83, 88, 99, 110)]}
IS_STAIR = lambda i: i is not None and (24 <= i <= 26 or 32 <= i <= 34)


def kind_of(t): return (t - 2048) // 48 if t >= 2048 else None
def landk(t): return t >= 2048 and 16 <= kind_of(t) < 48


def build(mid):
    path = os.path.join(ROOT, "data", "Map%03d.json" % mid)
    raw = open(path, "rb").read()
    m = json.loads(raw.decode("utf-8"))
    if W.map_text(m).encode("utf-8") != raw: raise SystemExit("Map%03d nie jest w ukladzie edytora" % mid)
    Wd, Hd, d = m["width"], m["height"], m["data"]
    n = Wd * Hd
    at = lambda z, x, y: d[z * n + y * Wd + x]
    def put(z, x, y, v): d[z * n + y * Wd + x] = v
    before = L.Mapa(mid, raw=json.loads(raw.decode("utf-8")))
    reach0 = before.flood(before.starty())
    c0, c1, rep = set(), set(), []
    hills = HILLS.get(mid, [])
    foot = lambda h: (h["top"][0], h["top"][1], h["top"][2], h["top"][3] + 2)

    # 1. old broken pieces out (layers 0 and 1), ground of the nearest land cell
    kill = set()
    for (bx0, by0, bx1, by1) in CLEAR.get(mid, []):
        for y in range(by0, by1 + 1):
            for x in range(bx0, bx1 + 1):
                for z in (0, 1):
                    i = P.a5_of(at(z, x, y))
                    if i is not None and (P.is_cliff(at(z, x, y)) or IS_STAIR(i)): kill.add((x, y))
    def fill_kind(x, y):
        for r in range(1, 16):
            best = None
            for dy in range(-r, r + 1):
                for dx in range(-r, r + 1):
                    if max(abs(dx), abs(dy)) != r: continue
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < Wd and 0 <= ny < Hd and (nx, ny) not in kill and landk(at(0, nx, ny)):
                        k = kind_of(at(0, nx, ny))
                        if best is None: best = k
            if best is not None: return best
        raise SystemExit("brak gruntu przy %d,%d" % (x, y))
    for (x, y) in sorted(kill):
        k = fill_kind(x, y)
        put(0, x, y, 2048 + k * 48)
        if at(1, x, y) and P.a5_of(at(1, x, y)) is not None: put(1, x, y, 0)
        c0.add((x, y)); c1.add((x, y))
    rep.append("  zdjete stare kafle A5: %d kratek" % len(kill))

    # 2. the hills
    def tile(h, x, y):
        x0, y0, x1, y1 = h["top"]; sx = h["stairs"]
        if y == y0: return S["rimL"] if x == x0 else S["rimR"] if x == x1 else S["rim"]
        if y < y1: return S["sideL"] if x == x0 else S["sideR"] if x == x1 else None
        if y == y1:
            if sx and x in sx: return None
            return S["lipL"] if x == x0 else S["lipR"] if x == x1 else S["lip"]
        row = y - y1
        if sx and x in sx: return S["stL"] if x == sx[0] else S["stR"] if x == sx[-1] else 25
        if row == 1:
            if x == x0: return S["f1L"]
            if x == x1: return S["f1R"]
            if sx and x == sx[0] - 1: return S["f1R"]
            if sx and x == sx[-1] + 1: return S["f1L"]
        else:
            if x == x0: return S["f2L"]
            if x == x1: return S["f2R"]
            if sx and x in (sx[0] - 1, sx[-1] + 1): return S["f2"]
        k = P.hash2(mid * 1000 + x, y0)
        edge = {x0, x1} | ({sx[0] - 1, sx[-1] + 1} if sx else set())
        if x not in edge and 0 < x - x0 < x1 - x0 and k < 0.14: return (S["v1"] if row == 1 else S["v2"])[0 if k < 0.07 else 1]
        return S["f1"] if row == 1 else S["f2"]
    for h in hills:
        x0, y0, x1, y1 = h["top"]
        for y in range(y0, y1 + 3):
            for x in range(x0, x1 + 1):
                t = tile(h, x, y)
                old = at(0, x, y)
                if t is None:
                    if not landk(old) or kind_of(old) not in (16, 17, 27): put(0, x, y, 2048 + (fill_kind(x, y) if not landk(old) else 16) * 48)
                else:
                    put(0, x, y, A5 + t)
                    if at(1, x, y): put(1, x, y, 0)
                if t is None and at(1, x, y) and mid == 13: put(1, x, y, 0)   # (the old dirt/stone patches on a top: angular, gone)
                put(4, x, y, 0)
                c0.add((x, y)); c1.add((x, y))
    # one level: the top's interior grass can hold layer-1 patches (kept); the outline's are gone (above)

    # 3. map-specific work
    ev = {e["id"]: e for e in m["events"] if e}
    movedids = set()
    def move_ev(eid, x, y):
        movedids.add(eid); e = ev[eid]; rep.append("  zdarzenie %d '%s' (%d,%d) -> (%d,%d)" % (eid, e["name"], e["x"], e["y"], x, y)); e["x"], e["y"] = x, y
    if mid == 13:
        # quarry: free wall ends capped with lip corner pieces; the stub line (53,41-43) between the two wall segments gone
        for (x, y, i) in [(59, 27, 111), (34, 39, 109), (45, 39, 111), (54, 40, 109), (59, 40, 111)]:
            put(0, x, y, A5 + i); c0.add((x, y))
        for y in (41, 42, 43):
            put(0, 53, y, 2048 + 24 * 48); c0.add((53, y))
        # the green path outline (kind 17) x55-60,y44-59 without fill: out (the ground of its surroundings)
        for y in range(44, 60):
            for x in range(54, 62):
                if kind_of(at(0, x, y)) == 17 if at(0, x, y) >= 2048 else False:
                    put(0, x, y, 2048 + (24 if y <= 52 else 16) * 48); c0.add((x, y))
        # the old gate (6,27): a short stone wall west of it (x1-4), the plateau's west side (x8) is its east flank
        gate = [(1, 25, 109), (2, 25, 110), (3, 25, 110), (4, 25, 111), (1, 26, 117), (2, 26, 118), (3, 26, 118), (4, 26, 119),
                (1, 27, 125), (2, 27, 126), (3, 27, 126), (4, 27, 127)]
        for (x, y, i) in gate:
            put(0, x, y, A5 + i); put(1, x, y, 0); put(4, x, y, 0); c0.add((x, y)); c1.add((x, y))
        for y in range(23, 30):          # the leftover bits of the grass strip (layer 1, kind 25) the wall cut through
            for x in range(0, 5):
                if at(1, x, y) >= 2048 and kind_of(at(1, x, y)) == 25: put(1, x, y, 0); c1.add((x, y))
    if mid == 125:
        # the woodshed's props (layer 2: logs 87-89 x 95-96, planks 85-87 x 97) up over the stump, off the lower tier, off the upper tier's side
        # (v2: the woodshed and the post stay; the bell at the forecourt's front right (on the lip - one row nearer it stood on the
        # tower's base), its ringing place behind it, facing down to it: TownLife takes a spot's facing from its page when it has no picture)
        move_ev(211, 94, 104); move_ev(212, 94, 103); ev[212]["pages"][0]["image"]["direction"] = 2
        for y in range(88, 92):                    # the lone cobble patch above the lighthouse
            for x in range(92, 98):
                if at(1, x, y): put(1, x, y, 0); c1.add((x, y))

    # events on a face / outline: to the nearest free cell outside the hills
    def cliffcell(x, y): return P.is_cliff(at(0, x, y)) or IS_STAIR(P.a5_of(at(0, x, y)))
    occupied = {(e["x"], e["y"]) for e in m["events"] if e}
    def in_foot(x, y, mg=1, bot=0): return any(fx0 - mg <= x <= fx1 + mg and fy0 - mg <= y <= fy1 + mg + bot for (fx0, fy0, fx1, fy1) in map(foot, hills))
    moved = set()
    for e in [e for e in m["events"] if e]:
        if e["id"] in (155, 192, 211, 212) and mid == 125: continue
        tree = e["name"].startswith(("Sosna", "Małe drzewo", "Martwe drzewo"))   # a tall sprite standing just under a face hides it
        under = tree and any(fx0 - 1 <= e["x"] <= fx1 + 1 and fy1 < e["y"] <= fy1 + 3 for (fx0, fy0, fx1, fy1) in map(foot, hills))
        if not (cliffcell(e["x"], e["y"]) or under or (mid == 13 and e["id"] == 371)): continue   # (371: a tree to chop inside the closed eagle hill)
        if not (in_foot(e["x"], e["y"], 0, 3 if tree else 0) or (mid == 13 and 1 <= e["x"] <= 4 and 25 <= e["y"] <= 27)): continue
        done = False
        for r in range(1, 12):
            for dy in range(-r, r + 1):
                for dx in range(-r, r + 1):
                    if max(abs(dx), abs(dy)) != r or done: continue
                    x, y = e["x"] + dx, e["y"] + dy
                    if 0 <= x < Wd and 0 <= y < Hd and (x, y) not in occupied and landk(at(0, x, y)) and not in_foot(x, y, 1, 3) and not cliffcell(x, y) \
                            and all((x + a, y + b) not in occupied for a in (-1, 0, 1) for b in (-1, 0)):
                        occupied.discard((e["x"], e["y"])); move_ev(e["id"], x, y); occupied.add((x, y)); done = True
            if done: break
        if not done: rep.append("  UWAGA: zdarzenie %d '%s' na licu, brak miejsca" % (e["id"], e["name"]))

    # 4. autotiles round what changed
    W.reshape(m, 0, W.ring(c0, 1))
    W.reshape(m, 1, W.ring(c1 | c0, 1))
    after = L.Mapa(mid, raw=m)
    reach1 = after.flood(after.starty())
    alltop = set()
    for h in hills: alltop |= range_top(h) | {(x, h["top"][3]) for x in range(h["top"][0], h["top"][2] + 1)}
    outer = lambda mm: [c for c in mm.starty() if c not in alltop]
    reachO = after.flood(outer(after))     # from OUTSIDE the hills only (a door landing on a top is no way up)

    # 5. checks
    ok = True
    for h in hills:
        x0, y0, x1, y1 = h["top"]; sx = h["stairs"]
        top = {(x, y) for y in range(y0 + 1, y1 + 1) for x in range(x0 + 1, x1) if after.stoi(x, y)}
        for (kx0, ky0, kx1, ky1) in h.get("keep", []):
            cells = [(x, y) for y in range(ky0, ky1 + 1) for x in range(kx0, kx1 + 1)]
            on = all(c in range_top(h) for c in cells)
            rep.append("  %s: miejsce %s na wierzchu %s" % (h["name"], (kx0, ky0, kx1, ky1), "tak" if on else "NIE"))
            ok = ok and on
            if h["stairs"]:
                bad = [c for c in cells if c not in reachO]
                rep.append("      osiagalne ze schodow: %s" % ("tak" if not bad else "NIE " + str(bad)))
                ok = ok and not bad
            else:
                got = [c for c in cells if c in reachO]
                rep.append("      polka tylko lotem (nieosiagalne piechota): %s" % ("tak" if not got else "NIE, osiagalne " + str(got[:5])))
                ok = ok and not got
        for c in h.get("outside", []):
            rep.append("      miejsce zejscia %s osiagalne na piechote z zewnatrz: %s" % (c, "tak" if c in reachO else "NIE")); ok = ok and c in reachO
        if h["stairs"]:
            test = json.loads(json.dumps(m)); mt = L.Mapa(mid, raw=test)
            for y in (y1 + 1, y1 + 2):
                for x in sx: test["data"][y * Wd + x] = A5 + S["f1"]
            r = mt.flood(outer(mt))
            # the top reachable from outside only by the stairs: with them walled up, no top cell reachable
            leak = [c for c in top if c in r]
            rep.append("  %s: wierzch bez schodow osiagalny w %d kratkach (ma byc 0)" % (h["name"], len(leak)))
            ok = ok and not leak
            rep.append("  %s: wierzch ze schodami: %d z %d kratek osiagalnych" % (h["name"], len([c for c in top if c in reachO]), len(top)))
            ok = ok and any(c in reachO for c in top)
    boxes = CLEAR.get(mid, []) + ([(1, 23, 4, 27)] if mid == 13 else []) + [(h["top"][0], h["top"][1], h["top"][2], h["top"][3] + 2) for h in hills]
    inbox = lambda c: any(b[0] - 1 <= c[0] <= b[2] + 1 and b[1] - 1 <= c[1] <= b[3] + 1 for b in boxes)
    lost = sorted(c for c in reach0 - reach1 if not inbox(c) and c not in {(e['x'], e['y']) for e in m['events'] if e and e['id'] in movedids})
    rep.append("  poza wzgorzami: osiagalnych przed %d, po %d, utracone poza wzgorzami: %d %s" % (len(reach0), len(reach1), len(lost), lost[:10]))
    ok = ok and not lost
    return m, raw, rep, ok


def range_top(h):
    x0, y0, x1, y1 = h["top"]
    return {(x, y) for y in range(y0 + 1, y1 + 1) for x in range(x0 + 1, x1)}


if __name__ == "__main__":
    os.makedirs(STG, exist_ok=True)
    allok = True
    ids = [int(a) for a in sys.argv[1:] if a.isdigit()] or [13, 125]   # (Map013 installed 2026-11-10 21:30: rebuild only 125 now)
    for mid in ids:
        m, raw, rep, ok = build(mid)
        print("Map%03d" % mid)
        for r in rep: print(r)
        out = W.map_text(m).encode("utf-8")
        assert json.loads(out.decode("utf-8")) == m
        open(os.path.join(STG, "Map%03d.json" % mid), "wb").write(out)
        print("WYNIK:", "ok" if ok else "BLAD"); allok = allok and ok
    print("RAZEM:", "ok" if allok else "BLAD")
