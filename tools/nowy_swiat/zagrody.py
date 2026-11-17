# -*- coding: utf-8 -*-
"""Podgrodzie (Map218, plik gracza): równe zagrody mieszkańców (gracz 2026-11-13, szkic docs/NOWY_SWIAT/zagrody_propozycja.png -
„tak, pasuje”; „koryto rzeki ma być nietknięte”).
  1. rząd północny przy drodze: 4 jednakowe zagrody (tkaczka, wodziarz, wdowa, Kuba) - chata z drzwiami do drogi, ogródek w płotku obok,
     zagroda ze zwierzętami za chatą, podwórko z ziemi przed nią; między 1. i 2. ścieżka do furtki działki dziadka, między 2. i 3.
     ścieżka na łąkę (kapliczka zostaje), między 3. i 4. ścieżka na północny wschód;
  2. rodzina z dzieckiem na północnym wschodzie, przy szopie Wróbli: chata, ogródek, kury;
  3. kramarz przy zachodnim wjeździe (od Wybrzeża): chata, kram obok, mały ogródek przed chatą;
  4. reszta chat zostaje na miejscu i dostaje ogródek tuż przy domu (szukanie miejsca jak w ogrodki.py);
  5. dawne ogródki (namalowane), zagroda kozy, ogródek pod wiatrakiem - zdjęte.
  Nie rusza: koryta (z brzegami), mostów i dojść do nich, schodów na dno, drogi głównej, działki i domu dziadka, wiatraka i pola.
  Ogródki: zdarzenie <Ogrodek:w,h,właściciel,rzędy> (js/plugins/Ogrodki.js). Zwierzęta: zdarzenia chodzące losowo za płotem.
  python tools/nowy_swiat/zagrody.py [--podglad=<plik>] [--wykonaj]"""
import collections, copy, datetime, importlib.util, json, os, re, shutil, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
sys.path.insert(0, HERE)
import wspolne as WS                                                     # noqa: E402
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)
spec2 = importlib.util.spec_from_file_location("pod_build", os.path.join(HERE, "podgrodzie", "build.py"))
PB = importlib.util.module_from_spec(spec2); spec2.loader.exec_module(PB)
HUTS = {d["k"]: d for d in PB.HUTS}
FLAGS = RW.read_json("data/Tilesets.json")[0][11]["flags"]

GRASS, EARTH, VILLAGE, MUD, FENCE = 16, 24, 17, 26, 22
OVERLAYS = {21, 29, 31, 39, 47, 12, 13}
# the north row: module x0, the resident, mirrored (garden left of the hut), the animals
NORTH = [(21, "tkaczka", True, [("$Animal_Sheep", "Owca tkaczki"), ("$Animal_Sheep", "Owca tkaczki")]),
         (35, "wodziarz", False, [("$Animal_Hen", "Kura"), ("$Animal_Hen", "Kura")]),
         (50, "wdowa", False, [("$Animal_Sheep", "Koza wdowy")]),
         (64, "kuba", False, [("$Animal_Hen", "Kura"), ("$Animal_Hen", "Kura")])]
ROW_PEN, ROW_HUT, ROW_YARD = 27, 31, 36            # pen ring rows 27-30, hut rows 31-35 (door row 35), yard rows 36-38
NORTH_ZONE = (20, 26, 76, 39)
SHRINE = (42, 36, 45, 41)                           # (kept as it is)
OLD_GARDENS = [(66, 24, 71, 28), (8, 36, 13, 40)]   # rodzina's painted one, the one under the windmill
RODZINA = dict(hut=(64, 19), garden=(71, 19, 76, 23), pen=(57, 19, 62, 23), animals=[("$Animal_Hen", "Kura")] * 3, zone=(56, 17, 76, 25))
KRAMARZ = dict(hut=(3, 48), garden=(2, 54, 7, 57), gate=(5, 54), stall=(10, 52), zone=(1, 47, 11, 57))
MOVED = ["tkaczka", "wodziarz", "wdowa", "kuba", "rodzina", "kramarz"]
STAY_GARDEN = ["praczka", "rybaczka", "garncarz", "drwal", "znachorka", "weglarz", "klusownik", "garbarz", "mlynarz"]
STAY_NAMES = {"przytulek": "Przytułek"}
# kept open: bridge approaches, the ramps (stairs) into the bed, the main road
BRIDGE_COLS = [(12, 16), (38, 42)]
RAMP_COLS = [(21, 24), (32, 35)]
START = (40, 43)                                   # (the main road: everything must stay reachable from here)
GATHERABLE = ("Pieniek", "Kolczaste pnącza", "Suchy krzaczek", "Płaski kamień", "Omszały kamień", "Sterta kamieni", "Ostry odłamek", "Kopiec kamieni",
              "Głaz", "Gęste chaszcze", "Martwe drzewo", "Drzewo (ozdobne)", "Sosna (niska)")


def a2(k): return 2048 + k * 48
def kind(t): return (t - 2048) // 48 if 2048 <= t < 8192 else -1
def rect(x0, y0, x1, y1): return {(x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)}


class Map:
    def __init__(self):
        self.m, self.lay = RW.read_json("data/Map218.json")
        self.W, self.H = self.m["width"], self.m["height"]
        self.changed = set()
    def at(self, z, x, y): return self.m["data"][(z * self.H + y) * self.W + x]
    def put(self, z, x, y, v):
        self.m["data"][(z * self.H + y) * self.W + x] = v; self.changed.add((x, y))
    def events(self): return [e for e in self.m["events"] if e]
    def add(self, e):
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


def scratch(defs):
    """a blank grass map with these huts stamped (WS.hut: walls, roof, windows, chimney + smoke, door placeholder, its spot)"""
    tmp = tempfile.mkdtemp(prefix="zagrody_")
    WS.configure(218, tmp)
    b = WS.WorldBuild(218, "tmp", "")
    b.mp.kind(0, b.mp.all, WS.GRASS)
    for d in defs: b.hut(d)
    path = b.write()[0]
    m = json.load(open(path, encoding="utf-8"))
    shutil.rmtree(tmp, ignore_errors=True)
    return m


def plain_event(P, name, x, y, note, image="", priority=0, through=True, move=None):
    tmpl = next(e for e in P.events() if e["name"].startswith("Drzwi"))
    e = copy.deepcopy(tmpl)
    e.update({"name": name, "x": x, "y": y, "note": note})
    e["pages"] = [e["pages"][0]]
    pg = e["pages"][0]
    pg["image"] = {"tileId": 0, "characterName": image, "direction": 2, "pattern": 1, "characterIndex": 0}
    pg["priorityType"], pg["through"], pg["trigger"], pg["list"] = priority, through, 0, [{"code": 0, "indent": 0, "parameters": []}]
    pg["directionFix"], pg["stepAnime"], pg["walkAnime"] = (False, False, True) if move else (True, False, False)
    pg["moveType"] = 1 if move else 0
    pg["moveSpeed"], pg["moveFrequency"] = (2, 2) if move else (3, 3)
    return e


BIT = {2: 1, 4: 2, 6: 4, 8: 8}
STEP = {2: (0, 1), 4: (-1, 0), 6: (1, 0), 8: (0, -1)}
REV = {2: 8, 8: 2, 4: 6, 6: 4}


def reach(P, start, extra_block=frozenset(), extra_open=frozenset()):
    """the cells the hero can walk to from start (4 ways, the engine's directional passability)"""
    blockers = {(e["x"], e["y"]) for e in P.events() if e["pages"][0].get("priorityType", 0) == 1 and not e["pages"][0].get("through")}
    def ok(x, y, d):
        if (x, y) in extra_block: return False
        if (x, y) in extra_open: return True
        r = P.at(5, x, y)
        if d in (2, 8) and r != 4 and 0 <= y + STEP[d][1] < P.H and P.at(5, x, y + STEP[d][1]) == 4: return True   # (Mosty.js: the bank's rim at a deck's end)
        if r == 2: return False
        if r in (1, 4): return True
        for z in (3, 2, 1, 0):
            t = P.at(z, x, y)
            if not t: continue
            f = FLAGS[t] if t < len(FLAGS) else 0
            if f & 0x10: continue
            return (f & BIT[d]) == 0
        return False
    seen, q = {start}, collections.deque([start])
    while q:
        x, y = q.popleft()
        for d, (dx, dy) in STEP.items():
            nx, ny = x + dx, y + dy
            if not (0 <= nx < P.W and 0 <= ny < P.H) or (nx, ny) in seen or (nx, ny) in blockers: continue
            if ok(x, y, d) and ok(nx, ny, REV[d]): seen.add((nx, ny)); q.append((nx, ny))
    return seen


def main():
    log = []
    P = Map()
    at, put = P.at, P.put
    bed = set()   # the riverbed with its banks: everything reachable from the bed without crossing an A5 edge, a building
    A5G = {1612, 1613, 1614, 1615, 1620, 1621, 1622, 1623, 1633, 1638}
    st = [(5, 62)]
    while st:
        x, y = st.pop()
        if (x, y) in bed or not (0 <= x < P.W and 0 <= y < P.H): continue
        t = at(0, x, y)
        if (1536 <= t < 1664 and t not in A5G) or t >= 4352: continue
        bed.add((x, y)); st += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    keep = set(bed)
    for (a, b) in BRIDGE_COLS: keep |= rect(a, 52, b, 58) | rect(a, 64, b, 72)
    for (a, b) in RAMP_COLS: keep |= rect(a, 53, b, 58)
    keep |= rect(*SHRINE) | rect(0, 40, 79, 46) | rect(68, 42, 73, 48)      # (the road band; the east stairs)
    # ---- 1. the moved huts away (their exact cells: stamped on a blank map at the old place), their events
    old = scratch([HUTS[k] for k in MOVED]); blank = scratch([])
    oat = lambda o, z, x, y: o["data"][(z * 80 + y) * 80 + x]
    gone = 0
    for y in range(P.H):
        for x in range(P.W):
            if any(oat(old, z, x, y) != oat(blank, z, x, y) for z in (0, 1, 2, 3, 5)):
                put(0, x, y, a2(GRASS)); put(1, x, y, 0); put(2, x, y, 0); put(3, x, y, 0); put(5, x, y, 0); put(4, x, y, 0); gone += 1
    names = {HUTS[k]["n"] for k in MOVED}
    P.drop(lambda e: e["name"] in {"Drzwi: " + n for n in names} or e["name"] in {"Miejsce: %s_drzwi" % k for k in MOVED})
    for k in MOVED:
        d = HUTS[k]
        P.drop(lambda e, d=d: e["name"] == "Dym z komina" and (e["x"], e["y"]) == (d["x"] + d["ch"], d["y"]))
    log.append("  stare chaty zdjęte: %s (%d kratek)" % (", ".join(MOVED), gone))
    # ---- 2. the zones cleared (props, fences, old gardens, the goat pen, the stall), the shrine kept
    zones = [NORTH_ZONE, RODZINA["zone"], KRAMARZ["zone"]] + OLD_GARDENS
    for (x0, y0, x1, y1) in zones:
        for (x, y) in rect(x0, y0, x1, y1):
            if (x, y) in keep and (x, y) not in rect(*SHRINE): continue
            if (x, y) in rect(*SHRINE): continue
            if kind(at(1, x, y)) == FENCE or (at(1, x, y) and kind(at(1, x, y)) not in OVERLAYS): put(1, x, y, 0)
            if at(2, x, y): put(2, x, y, 0)
            if at(3, x, y): put(3, x, y, 0)
            if at(5, x, y) in (2, 7): put(5, x, y, 0)
            if kind(at(0, x, y)) in (EARTH, MUD) and (x, y) not in keep: put(0, x, y, a2(GRASS))
        P.drop(lambda e, z=(x0, y0, x1, y1): z[0] <= e["x"] <= z[2] and z[1] <= e["y"] <= z[3] and not (SHRINE[0] <= e["x"] <= SHRINE[2] and SHRINE[1] <= e["y"] <= SHRINE[3])
               and (e["name"] in GATHERABLE or e["name"] in ("barrel_water", "barrel_water_b", "Koza wdowy", "Kram starzyzny", "Sosna (niska)")))
    # (the old gardens' and the goat pen's fences reached the road's edge: away there too - a fence is never road)
    for (x0, y0, x1, y1) in OLD_GARDENS + [NORTH_ZONE[:2] + (NORTH_ZONE[2], 41)]:
        for (x, y) in rect(x0, y0, x1, y1):
            if (x, y) in rect(*SHRINE) or (x, y) in bed: continue
            if kind(at(1, x, y)) == FENCE: put(1, x, y, 0)
            if (x, y) in rect(*OLD_GARDENS[1]) and kind(at(0, x, y)) in (EARTH, MUD): put(0, x, y, a2(GRASS))
    stall_tmpl = None
    for e in json.load(open(os.path.join(ROOT, "data", "Map218.json"), encoding="utf-8"))["events"]:
        if e and e["name"] == "Kram starzyzny": stall_tmpl = e
    # ---- 3. the new huts (stamped on a blank map at the new place; their cells and events copied over)
    newdefs, homes = [], []
    for (x0, k, mirror, animals) in NORTH:
        d = dict(HUTS[k]); hx = x0 + 7 if mirror else x0
        d["x"], d["y"] = hx, ROW_HUT; d.pop("lean", None); d.pop("fill", None)
        newdefs.append(d)
        gx0 = x0 if mirror else x0 + 7
        homes.append(dict(k=k, n=d["n"], hut=(hx, ROW_HUT, hx + 5, ROW_HUT + 4), door=(hx + d["door"], ROW_HUT + 4),
                          garden=(gx0, ROW_HUT, gx0 + 5, ROW_HUT + 4), gate=(gx0 + (3 if mirror else 2), ROW_HUT + 4),
                          pen=(hx, ROW_PEN, hx + 5, ROW_PEN + 3), animals=animals, yard=(x0, ROW_YARD, x0 + 12, ROW_YARD + 2)))
    d = dict(HUTS["rodzina"]); d["x"], d["y"] = RODZINA["hut"]; d.pop("lean", None); newdefs.append(d)
    homes.append(dict(k="rodzina", n=d["n"], hut=(d["x"], d["y"], d["x"] + 5, d["y"] + 4), door=(d["x"] + d["door"], d["y"] + 4),
                      garden=RODZINA["garden"], gate=(RODZINA["garden"][0] + 2, RODZINA["garden"][3]), pen=RODZINA["pen"],
                      animals=RODZINA["animals"], yard=(57, 24, 76, 25)))
    d = dict(HUTS["kramarz"]); d["x"], d["y"] = KRAMARZ["hut"]; d.pop("lean", None); d.pop("fill", None); newdefs.append(d)
    homes.append(dict(k="kramarz", n=d["n"], hut=(d["x"], d["y"], d["x"] + 5, d["y"] + 4), door=(d["x"] + d["door"], d["y"] + 4),
                      garden=KRAMARZ["garden"], gate=KRAMARZ["gate"], pen=None, animals=[], yard=(2, 53, 9, 53)))
    new = scratch(newdefs)
    copied = 0
    for y in range(P.H):
        for x in range(P.W):
            if any(oat(new, z, x, y) != oat(blank, z, x, y) for z in (0, 1, 2, 3, 5)):
                if (x, y) in keep: raise SystemExit("STOP: nowa chata wchodzi na chronione pole %s" % ((x, y),))
                for z in (0, 1, 2, 3, 4, 5): put(z, x, y, oat(new, z, x, y))
                copied += 1
    have = {(e["name"], e["x"], e["y"]) for e in P.events()}
    for e in new["events"]:
        if e and (e["name"], e["x"], e["y"]) not in have:
            e = copy.deepcopy(e); P.add(e)
    log.append("  nowe chaty: %d kratek" % copied)
    # ---- 4. yards, gardens, pens, animals
    for h in homes:
        x0, y0, x1, y1 = h["yard"]
        for (x, y) in rect(x0, y0, x1, y1):
            if (x, y) in keep or at(0, x, y) >= 4352: continue
            put(0, x, y, a2(VILLAGE))
            if at(1, x, y) and kind(at(1, x, y)) not in OVERLAYS: put(1, x, y, 0)
        gx0, gy0, gx1, gy1 = h["garden"]
        ring = rect(gx0, gy0, gx1, gy1); soil = rect(gx0 + 1, gy0 + 1, gx1 - 1, gy1 - 1)
        for (x, y) in soil: put(0, x, y, a2(EARTH)); put(1, x, y, 0); put(2, x, y, 0); put(3, x, y, 0); put(5, x, y, 7)
        for (x, y) in ring - soil: put(1, x, y, 0 if (x, y) == h["gate"] else a2(FENCE)); put(2, x, y, 0); put(3, x, y, 0)
        sw, sh = gx1 - gx0 - 1, gy1 - gy0 - 1
        P.add(plain_event(P, "Ogródek: " + h["n"], gx0 + 1, gy0 + 1, "<Ogrodek:%d,%d,%s,%s>" % (sw, sh, h["k"], "02" if sh == 3 else "01")))
        if h["pen"]:
            px0, py0, px1, py1 = h["pen"]
            pring = rect(px0, py0, px1, py1); inner = rect(px0 + 1, py0 + 1, px1 - 1, py1 - 1)
            for (x, y) in inner: put(0, x, y, a2(MUD)); put(1, x, y, 0); put(2, x, y, 0); put(3, x, y, 0); put(5, x, y, 0)
            for (x, y) in pring - inner: put(1, x, y, a2(FENCE)); put(2, x, y, 0); put(3, x, y, 0)
            cells = sorted(inner)
            for i, (img, nm) in enumerate(h["animals"]):
                x, y = cells[(i * 5 + 1) % len(cells)]
                P.add(plain_event(P, nm, x, y, "<Zagroda:%s>" % h["k"], image=img, priority=1, through=False, move=True))
        log.append("  zagroda: %-24s chata %s, ogródek %s%s" % (h["n"], h["hut"][:2], h["garden"][:2], ", zwierzęta %d" % len(h["animals"]) if h["animals"] else ""))
    if stall_tmpl:
        s = copy.deepcopy(stall_tmpl); s["x"], s["y"] = KRAMARZ["stall"]; P.add(s)
        log.append("  kram kramarza przy chacie: %s" % (KRAMARZ["stall"],))
    # ---- 5. gardens by the huts that stay (as ogrodki.py: right by the house, never on kept cells)
    doors = [e for e in P.events() if e["name"].startswith("Drzwi: ")]
    taken_ev = {(e["x"], e["y"]) for e in P.events() if e["name"] not in GATHERABLE}
    fronts = set()
    for dd in doors:
        fronts |= {(dd["x"], dd["y"] + 1), (dd["x"], dd["y"] + 2), (dd["x"] - 1, dd["y"] + 1), (dd["x"] + 1, dd["y"] + 1)}
    fronts |= {(4, y) for y in range(25, 36)} | {(5, 35), (6, 35)}      # (the miller's path)
    placed = set()
    for h in homes:
        placed |= rect(h["garden"][0] - 1, h["garden"][1] - 1, h["garden"][2] + 1, h["garden"][3] + 1)
        if h["pen"]: placed |= rect(h["pen"][0] - 1, h["pen"][1] - 1, h["pen"][2] + 1, h["pen"][3] + 1)
    def why(x, y):
        if not (1 <= x < P.W - 1 and 1 <= y < P.H - 1): return "brzeg"
        if (x, y) in keep: return "chronione"
        if (x, y) in taken_ev: return "zdarzenie"
        if (x, y) in fronts: return "przed drzwiami"
        if (x, y) in placed: return "inny ogródek"
        t0 = at(0, x, y)
        if not (2816 <= t0 < 4352 and kind(t0) in (GRASS, 27, EARTH, MUD, VILLAGE)) and t0 not in (1633, 1638): return "grunt"
        t1 = at(1, x, y)
        if t1 and kind(t1) not in OVERLAYS: return "warstwa1"
        if at(3, x, y) or (at(2, x, y) and not (512 <= at(2, x, y) < 768)): return "rzecz"
        if at(5, x, y) not in (0, 31): return "region"
        if FLAGS[t0] & 0x0f: return "blokuje"
        return None
    for k in STAY_GARDEN + list(STAY_NAMES):
        nm = HUTS[k]["n"] if k in HUTS else STAY_NAMES[k]
        dd = next((e for e in doors if e["name"] == "Drzwi: " + nm), None)
        if not dd: log.append("  BEZ: %s (brak drzwi)" % nm); continue
        # the hut: its building cells by the door
        seen, stk = set(), [(dd["x"], dd["y"] - 1)]
        while stk:
            x, y = stk.pop()
            if (x, y) in seen or not (0 <= x < P.W and 0 <= y < P.H) or at(0, x, y) < 4352: continue
            seen.add((x, y)); stk += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
        if not seen: log.append("  BEZ: %s (brak chaty)" % nm); continue
        hx0, hx1 = max(min(p[0] for p in seen), dd["x"] - 3 if k not in STAY_NAMES else 0), min(max(p[0] for p in seen), dd["x"] + 3 if k not in STAY_NAMES else 99)
        hy0, hy1 = max(min(p[1] for p in seen), dd["y"] - (4 if k not in STAY_NAMES else 9)), dd["y"]
        cands = []
        base_reach = reach(P, START)
        for si, (w, h) in enumerate(((6, 5), (5, 5), (6, 4), (5, 4))):
            for rx in range(hx0 - w - 1, hx1 + 3):
                for ry in range(hy0 - h - 1, hy1 + 4):
                    if rx + w - 1 >= hx0 and rx <= hx1 and ry + h - 1 >= hy0 and ry <= hy1: continue
                    gap = max(max(hx0 - (rx + w - 1), rx - hx1, 0) - 1, max(hy0 - (ry + h - 1), ry - hy1, 0) - 1, 0)
                    if gap > 1: continue
                    ring = rect(rx, ry, rx + w - 1, ry + h - 1)
                    if any(why(x, y) for (x, y) in ring): continue
                    cy, gcx = ry + (h - 1) / 2, rx + w / 2
                    score = si * 3 + gap * 4 + (8 if ry + h - 1 < hy0 else 0) + abs(cy - (hy1 - 1)) * 0.6 + abs(gcx - dd["x"]) * 0.15
                    own = abs(gcx - dd["x"]) + abs(cy - dd["y"])
                    if any(abs(gcx - o["x"]) + abs(cy - o["y"]) < own - 0.5 for o in doors if o is not dd): score += 9
                    cands.append((score, rx, ry, w, h, ring))
        best = None
        for (score, rx, ry, w, h, ring) in sorted(cands)[:60]:
            soil = rect(rx + 1, ry + 1, rx + w - 2, ry + h - 2)
            side = [(x, y) for (x, y) in ring - soil if not (x in (rx, rx + w - 1) and y in (ry, ry + h - 1))]
            for gate in sorted(side, key=lambda c: abs(c[0] - dd["x"]) + abs(c[1] - (dd["y"] + 1)) + (0.5 if c[1] == ry else 0))[:6]:
                after = reach(P, START, extra_block=frozenset(ring - soil - {gate}), extra_open=frozenset(soil | {gate}))
                if not soil <= after: continue
                if (base_reach - ring) - after: continue          # (nothing else cut off)
                best = (score, rx, ry, w, h, ring, gate); break
            if best: break
        if not best: log.append("  BEZ ogródka: %s (brak miejsca przy chacie)" % nm); continue
        _, rx, ry, w, h, ring, gate = best
        soil = rect(rx + 1, ry + 1, rx + w - 2, ry + h - 2)
        P.drop(lambda e: (e["x"], e["y"]) in ring and e["name"] in GATHERABLE)
        for (x, y) in ring:
            if 512 <= at(2, x, y) < 768: put(2, x, y, 0)
        for (x, y) in soil: put(0, x, y, a2(EARTH)); put(1, x, y, 0); put(5, x, y, 7)
        for (x, y) in ring - soil: put(1, x, y, 0 if (x, y) == gate else a2(FENCE))
        placed |= rect(rx - 1, ry - 1, rx + w, ry + h)
        sh = h - 2
        P.add(plain_event(P, "Ogródek: " + nm, rx + 1, ry + 1, "<Ogrodek:%d,%d,%s,%s>" % (w - 2, sh, k, "02" if sh == 3 else "01")))
        log.append("  ogródek przy chacie: %-22s %dx%d przy (%d,%d)" % (nm, w - 2, sh, rx + 1, ry + 1))
    # ---- the autotile shapes round everything changed
    RW.reshape(P.m, 0, RW.ring(P.changed, 1)); RW.reshape(P.m, 1, RW.ring(P.changed, 1))
    bad = [c for c in P.changed if c in bed]
    if bad: raise SystemExit("STOP: zmiana w korycie: %s" % bad[:8])
    for l in log: print(l)
    print("koryto: %d kratek, nietknięte" % len(bed))
    for a in sys.argv:
        if a.startswith("--podglad="): open(a.split("=", 1)[1], "wb").write(RW.json_text(P.m, P.lay)); print("  podgląd: " + a.split("=", 1)[1])
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "zagrody_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    shutil.copy2(os.path.join(ROOT, "data", "Map218.json"), bak)
    open(os.path.join(ROOT, "data", "Map218.json"), "wb").write(RW.json_text(P.m, P.lay))
    print("Zapisano; kopia: " + bak)


if __name__ == "__main__":
    main()
