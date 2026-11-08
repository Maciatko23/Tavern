# -*- coding: utf-8 -*-
"""Napisy mapy wyspy jak w atlasie (gracz 2026-11-07: „Atlas z odnośnikami”, „byle było czytelnie i przejrzyście”): każde miejsce
ma swój napis; najpierw przy punkcie, a gdzie ciasno - dalej, na morzu, z cienką kreską do punktu. Liczone RAZ tutaj (gra tylko
rysuje): napisy nie zachodzą na siebie ani na punkty, kreski się nie krzyżują i nie idą przez inne napisy; krótkie kreski lepsze
od długich, napis przy punkcie najlepszy. Szerokości nazw z czcionki gry: tools/mapy/mapa_wyspy_szerokosci.json
(node tools/mapy/mapa_wyspy_szerokosci.js).
Wynik w danych miejsca: at: [x, y, wyrównanie, kreska] - x, y w ułamkach pudełka wyspy (mogą wyjść poza 0..1: na morze z boków),
wyrównanie "l" (napis zaczyna się w x), "r" (kończy się w x), "c" (środek w x); y - środek napisu; kreska 1/0.
Pole w zakładce Mapa (MapaWyspy.js, menuView): 1132 x 432 px pod napisy, pudełko wyspy 648 x 432 na środku (po 242 px morza z boków)."""
import json, math, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
BW, BH, SIDE = 648.0, 432.0, 242.0       # (the island's box and the sea beside it, px - MapaWyspy.js ATLAS)
BIG, SMALL = 15, 13                       # (the names' sizes: a place, a small edge place)
R_BIG, R_SMALL = 6, 4                     # (the points)


def place(src, roads, scale=1, key="at", side=None, bw=None, bh=None):
    """scale: the box that many times bigger; bw, bh: its own size, px (the real map x6: the world's true proportions - no sea beside it,
    the names only inside the box); key: the field written"""
    BW_, BH_ = (bw, bh) if bw else (BW * scale, BH * scale)
    SIDE_ = SIDE if side is None else side
    W = json.load(open(os.path.join(HERE, "mapa_wyspy_szerokosci.json"), encoding="utf-8"))
    ent = []
    for m in re.finditer(r'\{ id: (\d+|"podziemia"), nazwa: "([^"]*)", x: ([\d.]+), y: ([\d.]+)([^}]*)\}', src):
        k_ = m.group(1).strip('"'); small = "maly: true" in m.group(5)
        size = SMALL if small else BIG
        w = max(W[m.group(2)][str(size)], W[m.group(2)]["b" + str(size)]) + 6   # (bold under the cursor; the halo)
        ent.append(dict(key=k_, name=m.group(2), x=float(m.group(3)) * BW_, y=float(m.group(4)) * BH_, small=small, w=w, h=size * 1.35,
                        r=(R_SMALL if small else R_BIG) + (1 if k_ == "podziemia" else 0)))
    P = {e["key"]: e for e in ent}
    segs = [((P[a]["x"], P[a]["y"]), (P[b]["x"], P[b]["y"])) for a, b in roads if a in P and b in P]
    pts = [(e["x"], e["y"], e["r"] + 3, e["key"]) for e in ent]

    def box_of(e, ax, ay, al):
        x0 = ax if al == "l" else ax - e["w"] if al == "r" else ax - e["w"] / 2
        return (x0, ay - e["h"] / 2, x0 + e["w"], ay + e["h"] / 2)

    def near_point(bx, px, py):   # (the leader's end: the label's box point nearest the place)
        return (min(max(px, bx[0]), bx[2]), min(max(py, bx[1]), bx[3]))

    def cands(e):
        x, y, r = e["x"], e["y"], e["r"]
        out = [((x + r + 5, y, "l"), 0), ((x - r - 5, y, "r"), 0), ((x, y - r - 3 - e["h"] / 2, "c"), 0), ((x, y + r + 3 + e["h"] / 2, "c"), 0),
               ((x + r + 2, y - r - e["h"] / 2 + 3, "l"), 0), ((x - r - 2, y - r - e["h"] / 2 + 3, "r"), 0),
               ((x + r + 2, y + r + e["h"] / 2 - 3, "l"), 0), ((x - r - 2, y + r + e["h"] / 2 - 3, "r"), 0)]
        for d in (26, 40, 58, 80, 108, 140, 180, 230, 290):
            for k in range(16):
                t = k * math.pi / 8
                ax, ay = x + d * math.cos(t), y + d * math.sin(t)
                al = "l" if math.cos(t) > 0.35 else "r" if math.cos(t) < -0.35 else "c"
                out.append(((ax, ay, al), 1))
        for yy in range(int(y - 90), int(y + 91), 9):   # (the margins' columns)
            out.append(((-12, yy, "r"), 1)); out.append(((BW_ + 12, yy, "l"), 1))
        return out

    def inter(p1, p2, p3, p4):
        d = lambda a, b, c: (c[0] - a[0]) * (b[1] - a[1]) - (b[0] - a[0]) * (c[1] - a[1])
        d1, d2, d3, d4 = d(p3, p4, p1), d(p3, p4, p2), d(p1, p2, p3), d(p1, p2, p4)
        return ((d1 > 0) != (d2 > 0)) and ((d3 > 0) != (d4 > 0))

    def seg_box(a, b, bx):
        if any(bx[0] <= a[0] + (b[0] - a[0]) * k / 12 <= bx[2] and bx[1] <= a[1] + (b[1] - a[1]) * k / 12 <= bx[3] for k in range(1, 12)): return True
        return False

    def ov(a, b): return max(0, min(a[2], b[2]) - max(a[0], b[0])) * max(0, min(a[3], b[3]) - max(a[1], b[1]))

    placed = {}   # key -> (bx, lead_segment or None, (ax, ay, al), lead)

    def cost(e, c, lead):
        ax, ay, al = c
        bx = box_of(e, ax, ay, al)
        if bx[0] < -SIDE_ + 4 or bx[2] > BW_ + SIDE_ - 4 or bx[1] < 2 or bx[3] > BH_ - 2: return None
        cst = 0.0
        for k, (obx, oseg, _, _) in placed.items():
            o = ov(bx, obx)
            if o > 0: cst += 4000 + o * 40
        for (px, py, pr, k) in pts:
            if k == e["key"]: continue
            if px + pr > bx[0] and px - pr < bx[2] and py + pr > bx[1] and py - pr < bx[3]: cst += 3000
        seg = None
        if lead:
            end = near_point(bx, e["x"], e["y"])
            L = math.hypot(end[0] - e["x"], end[1] - e["y"])
            if L < 14: return None   # (a leader too short to see: then it is a near label)
            seg = ((e["x"], e["y"]), end)
            cst += 60 + L * 1.6
            for k, (obx, oseg, _, _) in placed.items():
                if oseg and inter(seg[0], seg[1], oseg[0], oseg[1]): cst += 2500
                if seg_box(seg[0], seg[1], obx): cst += 2500
            for (px, py, pr, k) in pts:
                if k == e["key"]: continue
                # (the leader through another place's point)
                vx, vy = seg[1][0] - seg[0][0], seg[1][1] - seg[0][1]
                tt = max(0, min(1, ((px - seg[0][0]) * vx + (py - seg[0][1]) * vy) / (vx * vx + vy * vy + 1e-9)))
                if math.hypot(seg[0][0] + vx * tt - px, seg[0][1] + vy * tt - py) < pr + 2: cst += 2000
        for k, (obx, oseg, _, _) in placed.items():   # (a placed leader through this label)
            if oseg and seg_box(oseg[0], oseg[1], bx): cst += 2500
        cst += sum(25 for s in segs if seg_box(s[0], s[1], bx))   # (over a road: the halo keeps it legible, a little worse)
        if not lead: cst += {"l": 0, "r": 4, "c": 6}[al]
        return cst, bx, seg

    def best_for(e):
        best = None
        for c, lead in cands(e):
            r = cost(e, c, lead)
            if r is None: continue
            if best is None or r[0] < best[0]: best = (r[0], r[1], r[2], c, lead)
        return best

    crowd = lambda e: -sum(1 for o in ent if abs(o["x"] - e["x"]) < 90 and abs(o["y"] - e["y"]) < 50)
    order = sorted(ent, key=crowd)
    for e in order:
        b = best_for(e)
        placed[e["key"]] = (b[1], b[2], b[3], b[4])
    for _ in range(4):   # (each again with the others where they are)
        for e in order:
            del placed[e["key"]]
            b = best_for(e)
            placed[e["key"]] = (b[1], b[2], b[3], b[4])
    bad = []
    for e in ent:
        bx = placed[e["key"]][0]
        for k, (obx, _, _, _) in placed.items():
            if k != e["key"] and ov(bx, obx) > 0: bad.append((e["name"], k))
    # into the data
    for e in ent:
        (ax, ay, al), lead = placed[e["key"]][2], placed[e["key"]][3]
        at = '%s: [%.3f, %.3f, "%s", %d]' % (key, ax / BW_, ay / BH_, al, lead)
        kq = '"podziemia"' if e["key"] == "podziemia" else e["key"]
        pat = re.compile(r'(\{ id: %s, nazwa: "[^"]*", x: [\d.]+, y: [\d.]+)' % re.escape(kq))
        if len(pat.findall(src)) != 1: raise SystemExit("napis: %s" % kq)
        src = pat.sub(lambda m: m.group(1) + ", " + at, src)
    n_lead = sum(1 for v in placed.values() if v[3])
    return src, len(ent), n_lead, bad
