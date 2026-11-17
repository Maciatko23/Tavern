# -*- coding: utf-8 -*-
"""Podgrodzie (Map218), 2026-11-13 (gracz: „czy te ogródki, które są przy krawędzi wzgórza, mogą być wyżej, za budynkami?”):
ogródki stojące tuż przy krawędzi wzgórza / skarpy / gór (płot 0-1 kratki od niej) przenosi - najchętniej ZA chatę (nad nią), inaczej
obok chaty na wysokości jej ścian, zawsze co najmniej 2 kratki od krawędzi; wszystko dalej osiągalne (jak w zagrody.py); koryto nietknięte.
Zagrody rzędu północnego (tkaczka, wodziarz, wdowa, Kuba) zostają (uzgodniony układ). Gdzie nie ma miejsca - ogródek zostaje (raport).
  python tools/nowy_swiat/ogrodki_od_krawedzi.py [--podglad=<plik>] [--wykonaj]"""
import datetime, importlib.util, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("zagrody", os.path.join(HERE, "zagrody.py"))
Z = importlib.util.module_from_spec(spec); spec.loader.exec_module(Z)
RW, rect, a2, kind = Z.RW, Z.rect, Z.a2, Z.kind

KEEP_OWNERS = {"tkaczka", "wodziarz", "wdowa", "kuba"}
A5G = {1612, 1613, 1614, 1615, 1620, 1621, 1622, 1623, 1633, 1638}


def main():
    P = Z.Map()
    at, put = P.at, P.put
    edge = lambda x, y: 0 <= x < P.W and 0 <= y < P.H and 1536 <= at(0, x, y) < 1664 and at(0, x, y) not in A5G
    def edge_dist(x, y, r=3):
        for d in range(0, r + 1):
            for yy in range(y - d, y + d + 1):
                for xx in range(x - d, x + d + 1):
                    if max(abs(xx - x), abs(yy - y)) == d and edge(xx, yy): return d
        return r + 1
    bed = set(); st = [(5, 62)]
    while st:
        x, y = st.pop()
        if (x, y) in bed or not (0 <= x < P.W and 0 <= y < P.H): continue
        t = at(0, x, y)
        if (1536 <= t < 1664 and t not in A5G) or t >= 4352: continue
        bed.add((x, y)); st += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    keep = set(bed)
    for (a, b) in Z.BRIDGE_COLS: keep |= rect(a, 52, b, 58) | rect(a, 64, b, 72)
    for (a, b) in Z.RAMP_COLS: keep |= rect(a, 53, b, 58)
    keep |= rect(*Z.SHRINE) | rect(0, 40, 79, 46) | rect(68, 42, 73, 48) | rect(7, 33, 8, 36)
    gardens = []
    for e in P.events():
        m = re.search(r"<Ogrodek:(\d+),(\d+),(\w+)", e["note"] or "")
        if not m or not e["name"].startswith("Ogródek: "): continue
        w, h, o = int(m[1]), int(m[2]), m[3]
        ring = rect(e["x"] - 1, e["y"] - 1, e["x"] + w, e["y"] + h)
        near = min(edge_dist(x, y) for (x, y) in ring)
        gardens.append((e, w, h, o, ring, near))
    doors = [e for e in P.events() if e["name"].startswith("Drzwi: ")]
    fronts = set()
    for dd in doors: fronts |= {(dd["x"], dd["y"] + 1), (dd["x"], dd["y"] + 2), (dd["x"] - 1, dd["y"] + 1), (dd["x"] + 1, dd["y"] + 1)}
    fronts |= {(4, y) for y in range(25, 36)} | {(5, 35), (6, 35)}
    log = []
    for (e, w0, h0, o, ring0, near) in gardens:
        nm = e["name"][9:]
        if o in KEEP_OWNERS or near > 1: continue
        dd = next((d for d in doors if d["name"] == "Drzwi: " + nm), None)
        if not dd: continue
        # the old garden away (for the search: its cells free again; restored if nothing better is found)
        saved = {(x, y): [at(z, x, y) for z in range(6)] for (x, y) in ring0}
        for (x, y) in ring0:
            if kind(at(1, x, y)) == Z.FENCE: put(1, x, y, 0)
            if at(5, x, y) == 7: put(5, x, y, 0)
            if kind(at(0, x, y)) == Z.EARTH: put(0, x, y, a2(Z.GRASS))
        taken_ev = {(v["x"], v["y"]) for v in P.events() if v is not e and v["name"] not in Z.GATHERABLE}
        placed = set()
        for (v, w, h, oo, rr, _) in gardens:
            if v is not e: placed |= {(x + dx, y + dy) for (x, y) in rr for dx in (-1, 0, 1) for dy in (-1, 0, 1)}
        for v in P.events():
            mm = re.search(r"<Zagroda:", v["note"] or "")
        def why(x, y):
            if not (1 <= x < P.W - 1 and 1 <= y < P.H - 1) or (x, y) in keep or (x, y) in taken_ev or (x, y) in fronts or (x, y) in placed: return 1
            t0 = at(0, x, y)
            if not (2816 <= t0 < 4352 and kind(t0) in (Z.GRASS, 27, Z.EARTH, Z.MUD, Z.VILLAGE)) and t0 not in (1633, 1638): return 1
            t1 = at(1, x, y)
            if t1 and kind(t1) not in Z.OVERLAYS: return 1
            if at(3, x, y) or (at(2, x, y) and not (512 <= at(2, x, y) < 768)): return 1
            if at(5, x, y) not in (0, 31): return 1
            if Z.FLAGS[t0] & 0x0f: return 1
            if edge_dist(x, y) < 2: return 1
            return 0
        seen, stk = set(), [(dd["x"], dd["y"] - 1)]
        while stk:
            x, y = stk.pop()
            if (x, y) in seen or not (0 <= x < P.W and 0 <= y < P.H) or at(0, x, y) < 4352: continue
            seen.add((x, y)); stk += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
        hx0, hx1 = max(min(p[0] for p in seen), dd["x"] - 3), min(max(p[0] for p in seen), dd["x"] + 3)
        hy0, hy1 = max(min(p[1] for p in seen), dd["y"] - 4), dd["y"]
        base = Z.reach(P, Z.START)
        cands = []
        for si, (w, h) in enumerate(((6, 5), (5, 5), (6, 4), (5, 4))):
            for rx in range(hx0 - w - 1, hx1 + 3):
                for ry in range(hy0 - h - 1, hy1 + 4):
                    if rx + w - 1 >= hx0 and rx <= hx1 and ry + h - 1 >= hy0 and ry <= hy1: continue
                    gap = max(max(hx0 - (rx + w - 1), rx - hx1, 0) - 1, max(hy0 - (ry + h - 1), ry - hy1, 0) - 1, 0)
                    if gap > 1: continue
                    ring = rect(rx, ry, rx + w - 1, ry + h - 1)
                    if any(why(x, y) for (x, y) in ring): continue
                    behind = ry + h - 1 < hy0
                    aligned = ry >= hy0 - 1 and ry + h - 1 <= hy1
                    below = ry > hy1
                    if not (behind or aligned): continue          # (only behind the hut or beside it at its walls' height - never lower)
                    if h < 5 and not behind: continue             # (no smaller beds just to fit)
                    score = si * 2 + gap * 3 + (-12 if behind else -5 if aligned else 6 if below else 0) + abs((rx + w / 2) - dd["x"]) * 0.2
                    cands.append((score, rx, ry, w, h, ring))
        best = None
        for (score, rx, ry, w, h, ring) in sorted(cands)[:80]:
            soil = rect(rx + 1, ry + 1, rx + w - 2, ry + h - 2)
            side = [(x, y) for (x, y) in ring - soil if not (x in (rx, rx + w - 1) and y in (ry, ry + h - 1))]
            for gate in sorted(side, key=lambda c: abs(c[0] - dd["x"]) + abs(c[1] - (dd["y"] + 1)))[:8]:
                after = Z.reach(P, Z.START, extra_block=frozenset(ring - soil - {gate}), extra_open=frozenset(soil | {gate}))
                if not soil <= after or (base - ring) - after: continue
                best = (score, rx, ry, w, h, ring, gate, soil); break
            if best: break
        if not best:
            for (x, y), vals in saved.items():
                for z in range(6): put(z, x, y, vals[z])
            log.append("  zostaje: %-22s (brak miejsca z dala od krawędzi)" % nm); continue
        _, rx, ry, w, h, ring, gate, soil = best
        P.drop(lambda v: (v["x"], v["y"]) in ring and v["name"] in Z.GATHERABLE)
        for (x, y) in ring:
            if 512 <= at(2, x, y) < 768: put(2, x, y, 0)
        for (x, y) in soil: put(0, x, y, a2(Z.EARTH)); put(1, x, y, 0); put(5, x, y, 7)
        for (x, y) in ring - soil: put(1, x, y, 0 if (x, y) == gate else a2(Z.FENCE))
        sh = h - 2
        e["x"], e["y"] = rx + 1, ry + 1
        e["note"] = "<Ogrodek:%d,%d,%s,%s>" % (w - 2, sh, o, "02" if sh == 3 else "01")
        where = "za chatą" if ry + h - 1 < hy0 else ("obok chaty" if ry >= hy0 - 1 and ry + h - 1 <= hy1 else "przy chacie")
        log.append("  przeniesiony: %-22s %s, %dx%d przy (%d,%d)" % (nm, where, w - 2, sh, rx + 1, ry + 1))
    RW.reshape(P.m, 0, RW.ring(P.changed, 1)); RW.reshape(P.m, 1, RW.ring(P.changed, 1))
    if [c for c in P.changed if c in bed]: raise SystemExit("STOP: zmiana w korycie")
    for l in log: print(l)
    print("koryto nietknięte")
    for a in sys.argv:
        if a.startswith("--podglad="): open(a.split("=", 1)[1], "wb").write(RW.json_text(P.m, P.lay)); print("  podgląd: " + a.split("=", 1)[1])
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "ogrodki_od_krawedzi_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    shutil.copy2(os.path.join(ROOT, "data", "Map218.json"), bak)
    open(os.path.join(ROOT, "data", "Map218.json"), "wb").write(RW.json_text(P.m, P.lay))
    print("Zapisano; kopia: " + bak)


if __name__ == "__main__":
    main()
