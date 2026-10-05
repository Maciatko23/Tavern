# The tavern's floor plans for "Plan karczmy" (TavernLife.js, Scene_TavernPlan): three parchment sheets drawn from the
# real maps (plangeo.py) - walls in sepia ink, rooms in light watercolour washes by kind (for guests / the house's work
# rooms / private), doors as gaps with their leaves, stairs with treads and an arrow, hand-lettered names (Caveat), the
# cartouche "Karczma «Pod Złotym Kuflem»" with the floor's name, a compass rose and a scale bar.
#   python tools/tavern/plan/make_plan.py          -> img/pictures/TavernPlan_0.png, _1.png, _2.png, TavernPlan_Back.png
#                                                    and the plan's data block in js/plugins/TavernLife.js (between
#                                                    "// <plan-data>" and "// </plan-data>", LF kept) + plan_data.json
#   python tools/tavern/plan/make_plan.py --check  -> geometry only (the rooms against the maps), nothing written
import os, sys, json, math, base64
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import plangeo as G
from planlib import *   # noqa: F401,F403

ROOT = G.ROOT
PICS = os.path.join(ROOT, "img", "pictures")
# the data block lives in TavernLife_Plan.js since the plugin was split (2026-09-28 refactor); an older TavernLife.js with the
# markers still works
PLUGIN = os.path.join(ROOT, "js", "plugins", "TavernLife_Plan.js")
if not os.path.exists(PLUGIN): PLUGIN = os.path.join(ROOT, "js", "plugins", "TavernLife.js")

# the scene's layout at 1280 x 720 (TavernLife.js reads the same numbers from the data block)
SHEET = (16, 46, 836, 636)            # x, y, w, h of the plan sheet on the screen
PANEL = (866, 46, 398, 636)           # the side card
AREA = (22, 80, 792, 540)             # the plan's room on the sheet (sheet-local)
BAND_Y = 10                           # the cartouche band (sheet-local, 10..68)

WASH = {   # multiply tint (0..1) and strength
    "guest": ((0.99, 0.83, 0.55), 0.62), "service": ((0.76, 0.86, 0.68), 0.62), "private": ((0.91, 0.70, 0.70), 0.58),
    "hall": ((0.99, 0.95, 0.88), 0.35), "stairs": ((0.98, 0.94, 0.86), 0.25),
}

# ------------------------------------------------------------------------------------------------ the icons' places
LIGHT_FIRE = "<Light:330,120,60,16>"      # links.json lighting.tags.fireplace (fireplaces always burn)
LIGHT_STOVE = "<Light:230,120,64,20>"
def tag_of(e):
    txt = (e.get("note") or "")
    for p in e["pages"][:1]:
        for c in p["list"]:
            if c["code"] in (108, 408): txt += "\n" + str(c["parameters"][0])
    import re
    m = re.search(r"<Tavern:\s*([A-Za-z]+)(?::([a-z]+))?([^>]*)>", txt)
    if not m: return None
    a = dict((k.lower(), (v1 or v2 or v3)) for k, v1, v2, v3 in re.findall(r"([A-Za-z_]+)\s*=\s*(?:\"([^\"]*)\"|'([^']*)'|([^\s\"'>]+))", m.group(3)))
    return m.group(1).lower(), a

def icons_for(g):
    ev = [e for e in g["events"] if e]
    out = []
    def room_at(x, y):
        r = g["owner"].get((x, y))
        if r: return r
        best = None
        for rr in g["rooms"]:
            for (cx, cy) in rr.region:
                d = abs(cx - x) + abs(cy - y)
                if best is None or d < best[0]: best = (d, rr)
        return best[1] if best else None
    def into_room(x, y):
        """a spot in a wall (a hearth in the wall face) moves down into the room below it"""
        for dy in range(0, 5):
            if (x, y + dy) in g["owner"]: return x, y + dy
        return x, y
    def add(kind, x, y, extra=None, room=None):
        rr = room or room_at(int(round(x)), int(round(y)))
        out.append([kind, round(x, 2), round(y, 2), rr.key if rr else "", extra])
    tags = [(e, tag_of(e)) for e in ev]
    tags = [(e, t) for e, t in tags if t]
    by = lambda k: [(e, t) for e, t in tags if t[0] == k]
    mid = g["map"]
    if mid == 1:
        borgar = next(e for e in ev if e["name"].startswith("Borgar"))
        add("bar", borgar["x"], borgar["y"])
        stoves = [e for e in ev if LIGHT_STOVE in (e.get("note") or "")]
        kit = next(r for r in g["rooms"] if r.key == "kuchnia")
        st = next((e for e in stoves if (e["x"], e["y"]) in kit.region or (e["x"], e["y"] + 1) in kit.region), None)
        if st:
            x, y = into_room(st["x"], st["y"]); add("kitchen", x, y + 0.5, room=kit)
        else:
            add("kitchen", sum(c[0] for c in kit.floor) / len(kit.floor), sum(c[1] for c in kit.floor) / len(kit.floor), room=kit)
        for e, t in by("board"): add("board", e["x"], e["y"] - 0.6)
        for e, t in by("dice"): add("dice", e["x"], e["y"] - 1.6)
        for e, t in by("arm"): add("arm", e["x"], e["y"] - 1.0)
        d = by("darts")
        if d: add("darts", sum(e["x"] for e, t in d) / len(d), sum(e["y"] for e, t in d) / len(d) - 1.2)
        b = by("bath")
        if b: add("bath", sum(e["x"] for e, t in b) / len(b), sum(e["y"] for e, t in b) / len(b) - 0.5)
        stage = [c for c, k in kind_cells(g, 82)]
        if stage:
            add("stage", (min(c[0] for c in stage) + max(c[0] for c in stage)) / 2, (min(c[1] for c in stage) + max(c[1] for c in stage)) / 2)
    for e, t in by("bed"):
        a = t[1]
        add("room", e["x"], e["y"], {"room": str(a.get("room", "")), "minrep": int(a.get("minrep", 0) or 0)})
    for e, t in by("gate"):
        add("gate", e["x"], e["y"] + 0.2, {"minrep": int(t[1].get("minrep", 80) or 80)})
    for e in ev:
        if LIGHT_FIRE in (e.get("note") or ""):
            x, y = into_room(e["x"], e["y"])
            add("fire", x, y - 0.3)
    for r in g["rooms"]:
        if r.kind == "stairs":   # at the far end of the flight, past the arrow's tip
            x0, x1, y0, y1, entry_top = flight_ends(g, r)
            far = (y1 - 1.25) if entry_top else (y0 + 1.25)
            add("stairs", (x0 + x1) / 2 - 0.5, far - 0.5, {"to": r.to, "up": r.up}, room=r)
    return out

def flight_ends(g, r):
    """a flight's box (x0, x1, y0, y1: cell edges) and whether he steps on it from the top (else from the bottom)"""
    xs = [c[0] for c in r.region]; ys = [c[1] for c in r.region]
    x0, x1, y0, y1 = min(xs), max(xs) + 1, min(ys), max(ys) + 1
    entry_top = any((x, y0 - 1) in g["owner"] and g["owner"][(x, y0 - 1)] is not r for x in range(x0, x1))
    return x0, x1, y0, y1, entry_top

def kind_cells(g, floor_kind):
    """the cells whose ground tile is the A4 floor kind (e.g. 82: the stage's vertical planks)"""
    m = g["data"]; W = m["width"]
    for (x, y), k in g["K"].items():
        v = m["data"][y * W + x]
        if v >= 2048 and (v - 2048) // 48 == floor_kind: yield (x, y), k

# ------------------------------------------------------------------------------------------------ solid things (furniture)
def solid_cells(g):
    """cells he cannot step on inside the rooms: tiles closed on all four sides (the top non-star tile decides) and the
    solid pictures of events (<Occupy> included) - the furniture drawn lightly on the plan, and what the way avoids"""
    m = g["data"]; W, H = m["width"], m["height"]
    ts = json.load(open(os.path.join(ROOT, "data", "Tilesets.json"), encoding="utf-8"))[m["tilesetId"]]
    flags = ts["flags"]
    d = m["data"]
    out = set()
    for y in range(H):
        for x in range(W):
            blocked = None
            for z in (3, 2, 1, 0):
                t = d[(z * H + y) * W + x]
                if not t: continue
                f = flags[t] if t < len(flags) else 0
                if f & 0x10: continue
                if (f & 0x0f) == 0: blocked = False; break
                if (f & 0x0f) == 0x0f: blocked = True; break
            if blocked: out.add((x, y))
    import re
    for e in m["events"]:
        if not e: continue
        pg = None
        for p in e["pages"]:
            c = p["conditions"]
            if not any(c.get(k) for k in ("switch1Valid", "switch2Valid", "variableValid", "selfSwitchValid", "itemValid", "actorValid")): pg = p
        if not pg or pg["through"] or pg["priorityType"] != 1: continue
        im = pg["image"]
        if not (im.get("characterName") or im.get("tileId")): continue
        if any(c["code"] == 201 for c in pg["list"]): continue     # (a door: he goes through it)
        t = tag_of(e)
        if t and t[0] in ("gate", "door"): continue                 # (the gilded gate and the room doors open)
        occ = {"left": 0, "right": 0, "up": 0, "down": 0}
        mm = re.search(r"<Occupy:([^>]*)>", e.get("note") or "")
        if mm:
            for part in mm.group(1).split(","):
                kv = [s.strip() for s in part.split("=")]
                if len(kv) == 2 and kv[0] in occ: occ[kv[0]] = int(float(kv[1]))
        for yy in range(e["y"] - occ["up"], e["y"] + occ["down"] + 1):
            for xx in range(e["x"] - occ["left"], e["x"] + occ["right"] + 1): out.add((xx, yy))
    return out

# ------------------------------------------------------------------------------------------------ drawing one floor
def draw_floor(i, fl, g, W0, H0):
    s_area = AREA
    plan_cells = set(g["gaps"])
    for r in g["rooms"]: plan_cells |= r.region
    void = {c for c, k in g["K"].items() if k == "V"}
    # a void ringed by floor (the Galeria's well over the great hall) is drawn open; the stairwells' dark is wall
    well = set()
    seen = set()
    for c in sorted(void):
        if c in seen: continue
        comp, todo = set(), [c]
        while todo:
            p = todo.pop()
            if p in seen or p not in void: continue
            seen.add(p); comp.add(p)
            todo += [(p[0] + 1, p[1]), (p[0] - 1, p[1]), (p[0], p[1] + 1), (p[0], p[1] - 1)]
        ring = {(x + dx, y + dy) for (x, y) in comp for dx in (-1, 0, 1) for dy in (-1, 0, 1)} - comp
        if ring and all(q in plan_cells for q in ring): well |= comp
    walls = set()
    for (x, y) in plan_cells | well:
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                q = (x + dx, y + dy)
                if q not in plan_cells and q not in well and 0 <= q[0] < g["W"] and 0 <= q[1] < g["H"]: walls.add(q)
    allc = plan_cells | walls | well
    bx0, by0 = min(c[0] for c in allc), min(c[1] for c in allc)
    bx1, by1 = max(c[0] for c in allc) + 1, max(c[1] for c in allc) + 1
    extra_bottom = 2.2 if fl["map"] == 1 else 0          # the entrance arrow under the ground floor
    s = min(s_area[2] / (bx1 - bx0), s_area[3] / (by1 - by0 + extra_bottom))
    ox = s_area[0] + (s_area[2] - (bx1 - bx0) * s) / 2 - bx0 * s
    oy = s_area[1] + (s_area[3] - (by1 - by0 + extra_bottom) * s) / 2 - by0 * s
    X = lambda cx: ox + cx * s
    Y = lambda cy: oy + cy * s
    tag = "plan%d" % i
    paper = parchment(W0, H0, tag)
    rng = rng_for(tag + "stain")
    paper = ring_stain(paper, W0 * 0.905, H0 * 0.86, 30, rng, 0.8)
    paper = ring_stain(paper, W0 * 0.08, H0 * 0.2, 22, rng, 0.45)
    icons = icons_for(g)
    solid = solid_cells(g)
    # ---- washes
    for kind, (tint, strength) in WASH.items():
        L = Layer(W0, H0)
        any_ = False
        for r in g["rooms"]:
            if r.kind != kind: continue
            for (x0, y0, x1, y1) in G.cover_rects(r.region):
                L.rect(X(x0), Y(y0), X(x1 + 1), Y(y1 + 1), (int(tint[0] * 255), int(tint[1] * 255), int(tint[2] * 255), 255))
                any_ = True
        if kind == "hall":
            for (x, y) in g["gaps"]:
                L.rect(X(x), Y(y), X(x + 1), Y(y + 1), (int(tint[0] * 255), int(tint[1] * 255), int(tint[2] * 255), 255))
        if not any_: continue
        a = L.reduce()
        m = a[..., 3]
        blur = np.asarray(Image.fromarray((m * 255).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(2.2)), np.float32) / 255
        edge = np.clip(m - blur, 0, 1) * 1.6                  # the pooled darker rim of a watercolour wash
        n = noise_mul(H0, W0, tag + kind, 0.72, 1.12, 26)
        a[..., 3] = np.clip(m * n * strength + edge * strength * 0.9, 0, 1) * m
        paper = multiply(paper, a)
    # ---- furniture: faint ink shapes of what stands on the floor (one outline round each piece)
    L = Layer(W0, H0)
    for (x, y) in solid:
        r = g["owner"].get((x, y))
        if r and r.kind != "stairs" and (x, y) in r.floor:
            L.rect(X(x), Y(y), X(x + 1), Y(y + 1), INK_SOFT + (255,))
    fa = L.reduce()
    fm = fa[..., 3]
    er = np.asarray(Image.fromarray((fm * 255).astype(np.uint8), "L").filter(ImageFilter.MinFilter(3)), np.float32) / 255
    ring = np.clip(fm - er, 0, 1)
    fa[..., 3] = np.clip(er * 0.11 + ring * 0.5, 0, 1)
    paper = multiply(paper, fa)
    # ---- stairs: treads across, the arrow along the way up / down
    L = Layer(W0, H0)
    for r in g["rooms"]:
        if r.kind != "stairs": continue
        x0, x1, y0, y1, top_open = flight_ends(g, r)
        for k in range(y1 - y0 + 1):
            yy = Y(y0 + k)
            L.line([(X(x0), yy), (X(x1), yy)], INK + (230,), 0.9)
        L.line([(X(x0), Y(y0)), (X(x0), Y(y1))], INK + (240,), 1.1)
        L.line([(X(x1), Y(y0)), (X(x1), Y(y1))], INK + (240,), 1.1)
        # the arrow starts at the end he steps on from the floor and stops short of the stairs' icon at the far end
        start, end = (Y(y0) + s * 0.4, Y(y1) - s * 2.6) if top_open else (Y(y1) - s * 0.4, Y(y0) + s * 2.6)
        cx = X((x0 + x1) / 2)
        L.line([(cx, start), (cx, end)], INK + (255,), 1.3)
        dirn = 1 if end > start else -1
        hw = min(4.2, (x1 - x0) * s * 0.3)
        L.poly([(cx - hw, end - dirn * hw * 1.4), (cx + hw, end - dirn * hw * 1.4), (cx, end + dirn * 1.5)], INK + (255,))
        L.ellipse(cx - 1.6, start - 1.6, cx + 1.6, start + 1.6, fill=INK + (255,))
    paper = multiply(paper, L.reduce())
    # ---- the well: an opening in the floor (crossed), its railing
    if well:
        L = Layer(W0, H0)
        wx0, wy0 = min(c[0] for c in well), min(c[1] for c in well)
        wx1, wy1 = max(c[0] for c in well) + 1, max(c[1] for c in well) + 1
        L.rect(X(wx0), Y(wy0), X(wx1), Y(wy1), (70, 50, 34, 90))
        L.line([(X(wx0), Y(wy0)), (X(wx1), Y(wy1))], INK + (200,), 0.9)
        L.line([(X(wx1), Y(wy0)), (X(wx0), Y(wy1))], INK + (200,), 0.9)
        pad = s * 0.5
        L.line([(X(wx0) - pad, Y(wy0) - pad), (X(wx1) + pad, Y(wy0) - pad), (X(wx1) + pad, Y(wy1) + pad), (X(wx0) - pad, Y(wy1) + pad), (X(wx0) - pad, Y(wy0) - pad)], INK + (255,), 1.5)
        L.line([(X(wx0), Y(wy0)), (X(wx1), Y(wy0)), (X(wx1), Y(wy1)), (X(wx0), Y(wy1)), (X(wx0), Y(wy0))], INK + (255,), 1.0)
        paper = multiply(paper, L.reduce())
    # ---- walls: solid ink, the outer walls a little heavier
    L = Layer(W0, H0)
    for (x, y) in walls:
        L.rect(X(x), Y(y), X(x + 1), Y(y + 1), INK + (255,))
    wa = L.reduce()
    m = wa[..., 3]
    outside = np.ones((H0, W0), np.float32)
    Lo = Layer(W0, H0)
    for (x, y) in allc: Lo.rect(X(x), Y(y), X(x + 1), Y(y + 1), (255, 255, 255, 255))
    inside = Lo.reduce()[..., 3]
    outside = 1 - inside
    grown = np.asarray(Image.fromarray((m * 255).astype(np.uint8), "L").filter(ImageFilter.MaxFilter(5)), np.float32) / 255
    heavy = np.clip(grown * outside, 0, 1) * 0.9
    wa[..., 3] = np.clip(np.maximum(m, heavy) * noise_mul(H0, W0, tag + "ink", 0.86, 1.0, 5), 0, 1)
    wa[..., :3] = np.array(INK, np.float32) / 255
    paper = multiply(paper, wa, 0.97)
    # ---- doors: a leaf and its swing on the room's side of a narrow gap, dashed lines over a wide opening (an arch)
    L = Layer(W0, H0)
    for run, horiz in gap_runs(g):
        draw_door(L, g, run, horiz, X, Y, s)
    paper = multiply(paper, L.reduce())
    # ---- labels (avoiding the icons TavernLife.js draws on top)
    icon_boxes = [(X(ic[1] + 0.5), Y(ic[2] + 0.5), 12.5) for ic in icons]
    labels = {}
    for r in g["rooms"]:
        if not r.label: continue
        lx, ly = label_spot(g, r, X, Y, s, icon_boxes, fl, solid)
        labels[r.key] = [round(lx, 1), round(ly, 1)]
    # rooms side by side in one band (the same top and bottom): their names on one line ("równo")
    bands = {}
    for r in g["rooms"]:
        if r.key not in labels or (g["map"], r.key) in LABEL_AT or r.kind in ("hall", "stairs"): continue
        ys = [c[1] for c in r.region]
        bands.setdefault((min(ys), max(ys), len(label_lines(r)), bool(r.sub)), []).append(r.key)
    for keys in bands.values():
        if len(keys) < 2: continue
        med = sorted(labels[k][1] for k in keys)[len(keys) // 2]
        for k in keys: labels[k][1] = med
    L = Layer(W0, H0)
    for r in g["rooms"]:
        if r.key in labels: draw_label(L, r, labels[r.key], s, g, X, Y)
    la = L.reduce()
    # a soft pale cloud behind the letters (the scribe kept the names clear of the furniture's lines)
    halo = Image.fromarray((la[..., 3] * 255).astype(np.uint8), "L").filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(2.4))
    ha = np.asarray(halo, np.float32)[..., None] / 255 * 0.5
    paper = paper * (1 - ha) + np.minimum(255, paper * 1.07 + 6) * ha
    paper = multiply(paper, la, 0.95)
    # ---- the band: cartouche, compass rose, scale bar; the entrance under the ground floor
    L = Layer(W0, H0)
    cartouche(L, W0 / 2, BAND_Y, fl)
    compass(L, W0 - 58, BAND_Y + 34, 25)
    scale_bar(L, 40, BAND_Y + 44, s)
    if fl["map"] == 1:
        ex = [ln for ln in g["links"] if ln["map"] == 8]
        if ex:
            cx = X(sum(e["x"] for e in ex) / len(ex) + 0.5)
            yb = Y(max(e["y"] for e in ex) + 1)
            L.line([(cx, yb + s * 2.0), (cx, yb + 3)], INK + (255,), 1.4)
            L.poly([(cx - 4, yb + 8), (cx + 4, yb + 8), (cx, yb + 1.5)], INK + (255,))
            L.text(cx + 9, yb + s * 1.25, "Wejście", HAND_B, 15, INK + (255,), anchor="lm")
    paper = multiply(paper, L.reduce())
    # ---- the sheet: deckled edge, alpha
    alpha = deckle_alpha(W0, H0, tag)
    rgba = np.concatenate([np.clip(paper, 0, 255), alpha[..., None] * 255], axis=2).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA"), {"s": s, "ox": ox, "oy": oy, "labels": labels, "icons": icons, "solid": solid,
                                           "bbox": [bx0, by0, bx1, by1]}

def gap_runs(g):
    """connected runs of door-gap cells along a wall: (cells, the wall is horizontal?)"""
    gaps = set(g["gaps"])
    seen, out = set(), []
    for c in sorted(gaps):
        if c in seen: continue
        x, y = c
        above, below = g["owner"].get((x, y - 1)), g["owner"].get((x, y + 1))
        horiz = (above is not None or (x, y - 1) in gaps) and (below is not None or (x, y + 1) in gaps)
        run = [c]; seen.add(c)
        step = (1, 0) if horiz else (0, 1)
        n = (x + step[0], y + step[1])
        while n in gaps and n not in seen:
            run.append(n); seen.add(n); n = (n[0] + step[0], n[1] + step[1])
        # a gap through a thick wall (several rows deep): the rest of it is the same door
        for q in list(run):
            k = 1
            while True:
                d = (q[0] + (0 if horiz else k), q[1] + (k if horiz else 0))
                if d in gaps and d not in seen: seen.add(d); k += 1
                else: break
        out.append((run, horiz))
    return out

def draw_door(L, g, run, horiz, X, Y, s):
    n = len(run)
    if any(c[0] in (0, g["W"] - 1) or c[1] in (0, g["H"] - 1) for c in run):
        return          # (the front door in the outer wall: an open doorway, the entrance arrow says the rest)
    xs = [c[0] for c in run]; ys = [c[1] for c in run]
    if horiz:
        a, b, y = min(xs), max(xs) + 1, ys[0]
        up_r, dn_r = g["owner"].get((xs[0], y - 1)), g["owner"].get((xs[0], y + 1))
        # the leaf opens into the room (not into a corridor or a hall)
        side = 1 if (dn_r and dn_r.kind not in ("hall",)) or not up_r else -1
        if up_r and up_r.kind not in ("hall",) and dn_r and dn_r.kind == "hall": side = -1
        face_y = Y(y + 1) if side > 0 else Y(y)
        w = (b - a) * s
        if n >= 3:
            for yy in (Y(y), Y(y + 1)):
                dash(L, X(a), yy, X(b), yy)
            return
        if n == 2:
            for hx, sgn in ((X(a), 1), (X(b), -1)):
                r = w / 2
                L.line([(hx, face_y), (hx, face_y + side * r)], INK + (255,), 1.0)
                arc_q(L, hx, face_y, r, sgn, side)
            return
        hx = X(a)
        L.line([(hx, face_y), (hx, face_y + side * w)], INK + (255,), 1.0)
        arc_q(L, hx, face_y, w, 1, side)
    else:
        a, b, x = min(ys), max(ys) + 1, xs[0]
        if n >= 3:
            for xx in (X(x), X(x + 1)):
                dash(L, xx, Y(a), xx, Y(b))
            return
        lf, rt = g["owner"].get((x - 1, ys[0])), g["owner"].get((x + 1, ys[0]))
        side = 1 if (rt and rt.kind != "hall") or not lf else -1
        face_x = X(x + 1) if side > 0 else X(x)
        h = (b - a) * s
        hy = Y(a)
        L.line([(face_x, hy), (face_x + side * h, hy)], INK + (255,), 1.0)
        # the swing: a quarter circle from the leaf's end down to the other jamb
        pts = [(face_x + side * h * math.cos(t), hy + h * math.sin(t)) for t in np.linspace(0, math.pi / 2, 14)]
        L.line(pts, INK + (200,), 0.7)

def arc_q(L, hx, hy, r, sgn, side):
    """the swing of a leaf hinged at (hx, hy): from the leaf (along the wall's normal) to the wall"""
    pts = [(hx + sgn * r * math.sin(t), hy + side * r * math.cos(t)) for t in np.linspace(0, math.pi / 2, 14)]
    L.line(pts, INK + (200,), 0.7)

def dash(L, x0, y0, x1, y1, on=2.6, off=2.0):
    ln = math.hypot(x1 - x0, y1 - y0)
    t = 0.0
    while t < ln:
        t1 = min(ln, t + on)
        L.line([(x0 + (x1 - x0) * t / ln, y0 + (y1 - y0) * t / ln), (x0 + (x1 - x0) * t1 / ln, y0 + (y1 - y0) * t1 / ln)], INK + (230,), 0.8)
        t = t1 + off

# ------------------------------------------------------------------------------------------------ labels
LABEL_AT = {   # hand-placed label centres (cells) where the room's middle is taken by its furniture's icon
    (1, "sala"): (50.0, 40.2), (1, "korytarz"): (50.0, 21.0), (1, "sien"): (50.0, 51.5),   # (the second build, 101 x 55)
    (25, "gal"): (48.0, 23.6), (25, "nc"): (22.0, 18.9), (25, "sc"): (22.0, 50.9), (25, "hall"): (48.0, 58.6),
    (26, "hall"): (57.0, 25.6), (26, "terrace"): (40.0, 50.9),
}
def label_lines(r):
    return [t for t in r.label.split("\n")]

def label_size(r, s, fl, box_w, box_h):
    """the biggest size (Caveat Bold) that fits the room, capped by the floor's scale"""
    lines = label_lines(r)
    big = 11.5 + s * 1.35 if r.kind != "hall" else 10 + s * 1.2
    if r.label.isdigit(): big = 9 + s * 1.9          # the room numbers
    size = min(big, 24)
    while size > 10:
        wmax = max(text_width(t, HAND_B, size) for t in lines)
        hh = len(lines) * size * 0.92 + (size * 0.55 if r.sub else 0)
        if wmax <= box_w - 6 and hh <= box_h - 4: break
        size -= 0.5
    return size

def label_spot(g, r, X, Y, s, icon_boxes, fl, solid):
    """the label's centre: inside the room, clear of the icons, over as little furniture as can be, near the middle"""
    key = (g["map"], r.key)
    rects = G.cover_rects(r.region)
    big = max(rects, key=lambda q: (q[2] - q[0] + 1) * (q[3] - q[1] + 1))
    bw, bh = (big[2] - big[0] + 1) * s, (big[3] - big[1] + 1) * s
    size = label_size(r, s, fl, bw, bh)
    r.size = size
    if key in LABEL_AT:
        cx, cy = LABEL_AT[key]
        return X(cx), Y(cy)
    lines = label_lines(r)
    w = max(text_width(t, HAND_B, size) for t in lines) + 4
    h = len(lines) * size * 0.92 + (size * 0.55 if r.sub else 0) + 2
    mx, my = (big[0] + big[2] + 1) / 2, (big[1] + big[3] + 1) / 2
    if r.label.isdigit():
        # the guest rooms: every number at the same height in its room (the beds stand at the north wall), rows line up
        return X(mx), Y(big[1] + (big[3] + 1 - big[1]) * 0.64)
    wc, hc = w / s, h / s
    ys = np.arange(big[1] + hc / 2, big[3] + 1 - hc / 2 + 1e-6, 0.25)
    xs = np.arange(big[0] + wc / 2, big[2] + 1 - wc / 2 + 1e-6, 0.25)
    if not len(ys): ys = np.array([my])
    if not len(xs): xs = np.array([mx])
    def search(xs_try):
        best = None
        for cy in ys:
            for cx in xs_try:
                x0, x1, y0, y1 = cx - wc / 2, cx + wc / 2, cy - hc / 2, cy + hc / 2
                over = 0.0
                for yy in range(int(math.floor(y0)), int(math.ceil(y1))):
                    for xx in range(int(math.floor(x0)), int(math.ceil(x1))):
                        if (xx, yy) in solid and (xx, yy) in r.floor:
                            over += (min(x1, xx + 1) - max(x0, xx)) * (min(y1, yy + 1) - max(y0, yy))
                px, py = X(cx), Y(cy)
                hit = any(abs(ix - px) < w / 2 + ir + 1 and abs(iy - py) < h / 2 + ir + 1 for (ix, iy, ir) in icon_boxes)
                # the middle is worth a lot ("równo"): a label leaves it only for a real clash
                score = over * 1.0 + (100 if hit else 0) + math.hypot((cx - mx) / max(1, big[2] - big[0] + 1), (cy - my) / max(1, big[3] - big[1] + 1)) * 18
                if best is None or score < best[0]: best = (score, px, py, hit)
        return best
    best = search([mx])                      # centred across the room first, moved only up or down
    if best[3]: best = search(xs)
    return best[1], best[2]

def draw_label(L, r, at, s, g, X, Y):
    lines = label_lines(r)
    size = r.size or 16
    cx, cy = at
    ink = INK + (240,)
    if r.kind == "hall" and len(lines) == 1 and g["map"] in (1, 25) and r.key in ("korytarz", "nc", "sc"):
        L.text(cx, cy, lines[0], HAND_B, size, ink, anchor="mm", spacing=2.2)
        return
    lh = size * 0.92
    total = len(lines) * lh + (size * 0.5 if r.sub else 0)
    y = cy - total / 2 + lh / 2
    for t in lines:
        L.text(cx, y, t, HAND_B, size, ink, anchor="mm")
        y += lh
    if r.sub:
        L.text(cx, y - lh * 0.2 + size * 0.12, r.sub, HAND_B, max(10.5, size * 0.6), INK_SOFT + (255,), anchor="mm")

# ------------------------------------------------------------------------------------------------ the band
TITLE = "KARCZMA «POD ZŁOTYM KUFLEM»"
def cartouche(L, cx, y0, fl):
    w, h = 468, 58
    x0, x1, y1 = cx - w / 2, cx + w / 2, y0 + h
    c = 9
    # an old map's cartouche: cut corners, a double ink frame, a honey wash, scrolls at the ends
    pts = [(x0 + c, y0), (x1 - c, y0), (x1, y0 + c), (x1, y1 - c), (x1 - c, y1), (x0 + c, y1), (x0, y1 - c), (x0, y0 + c)]
    L.poly(pts, (236, 204, 142, 120))
    L.line(pts + [pts[0]], INK + (255,), 1.6)
    k = 4
    inner = [(x0 + c + k * 0.4, y0 + k), (x1 - c - k * 0.4, y0 + k), (x1 - k, y0 + c + k * 0.4), (x1 - k, y1 - c - k * 0.4),
             (x1 - c - k * 0.4, y1 - k), (x0 + c + k * 0.4, y1 - k), (x0 + k, y1 - c - k * 0.4), (x0 + k, y0 + c + k * 0.4)]
    L.line(inner + [inner[0]], INK + (200,), 0.8)
    for sx in (-1, 1):   # the scrolls: a curl each side
        ex = cx + sx * (w / 2 + 3)
        my = y0 + h / 2
        L.line([(ex, my - 13), (ex + sx * 9, my - 13), (ex + sx * 15, my - 7), (ex + sx * 15, my + 2)], INK + (255,), 1.3)
        L.arc((ex + sx * 15 - 6, my - 1, ex + sx * 15 + 6, my + 11), 0 if sx > 0 else 180, 360 if sx > 0 else 540, INK + (255,), 1.2)
        L.line([(ex, my + 13), (ex + sx * 7, my + 13)], INK + (255,), 1.3)
        for dy in (-5, 5):   # little leaves on the frame's ends
            L.ellipse(cx + sx * (w / 2 - 16) - 2.2, my + dy - 1.2, cx + sx * (w / 2 - 16) + 2.2, my + dy + 1.2, fill=INK + (220,))
    L.text(cx, y0 + 20, TITLE, CAPS, 19.5, INK + (255,), anchor="mm", spacing=1.2)
    # the floor's name between two flourishes
    sub = fl["title"]
    sw = text_width(sub, HAND_B, 22)
    L.text(cx, y0 + 42, sub, HAND_B, 22, (120, 40, 26, 255), anchor="mm")
    for sx in (-1, 1):
        a = cx + sx * (sw / 2 + 10)
        b = cx + sx * (sw / 2 + 58)
        L.line([(a, y0 + 43), (b, y0 + 43)], INK + (220,), 0.9)
        L.poly([((a + b) / 2 - 3, y0 + 43), ((a + b) / 2, y0 + 40), ((a + b) / 2 + 3, y0 + 43), ((a + b) / 2, y0 + 46)], INK + (230,))

def compass(L, cx, cy, r):
    """an eight-pointed rose: the four long points half dark, half light (ink hatching of old maps), 'Pn' at the top"""
    L.ellipse(cx - r * 0.72, cy - r * 0.72, cx + r * 0.72, cy + r * 0.72, outline=INK + (230,), width=0.9)
    L.ellipse(cx - r * 0.62, cy - r * 0.62, cx + r * 0.62, cy + r * 0.62, outline=INK + (170,), width=0.6)
    for k in range(8):
        a = -math.pi / 2 + k * math.pi / 4
        ln = r if k % 2 == 0 else r * 0.55
        wd = r * 0.17 if k % 2 == 0 else r * 0.12
        tip = (cx + math.cos(a) * ln, cy + math.sin(a) * ln)
        l = (cx + math.cos(a - math.pi / 2) * wd, cy + math.sin(a - math.pi / 2) * wd)
        rr = (cx + math.cos(a + math.pi / 2) * wd, cy + math.sin(a + math.pi / 2) * wd)
        L.poly([tip, l, (cx, cy)], INK + (255,))
        L.poly([tip, rr, (cx, cy)], (250, 240, 214, 255), outline=INK + (255,), width=0.7)
    L.ellipse(cx - 1.8, cy - 1.8, cx + 1.8, cy + 1.8, fill=INK + (255,))
    L.text(cx, cy - r - 8, "Pn", CAPS, 12, (120, 40, 26, 255), anchor="mm")

def scale_bar(L, x0, y, s):
    """ten steps (one step = one cell of the map), in five black and white pieces"""
    n = 10
    for k in range(5):
        a, b = x0 + k * 2 * s, x0 + (k + 1) * 2 * s
        L.rect(a, y, b, y + 4, INK + (255,) if k % 2 == 0 else (250, 240, 214, 255))
    L.line([(x0, y), (x0 + n * s, y), (x0 + n * s, y + 4), (x0, y + 4), (x0, y)], INK + (255,), 0.8)
    L.text(x0, y - 7, "0", HAND_B, 13, INK + (255,), anchor="mm")
    L.text(x0 + 5 * s, y - 7, "5", HAND_B, 13, INK + (255,), anchor="mm")
    L.text(x0 + n * s, y - 7, "10", HAND_B, 13, INK + (255,), anchor="mm")
    L.text(x0 + n * s + 8, y + 2, "kroków", HAND, 14, INK + (255,), anchor="lm")

# ------------------------------------------------------------------------------------------------ the backdrop
def backdrop():
    """TavernPlan_Back.png: the dark oak table the plan lies on (the quest board's wood), lamp light from the upper left,
    the soft shadows of the sheet and the card, the card's parchment"""
    from qblib import wood_field, ramp_map, paste_rgb
    W1, H1 = 1280, 720
    rng = rng_for("planback")
    canvas = np.zeros((H1, W1, 3), np.float32)
    RAMP = ["#0d0907", "#120c09", "#18100c", "#1e150f", "#251a13", "#2d2017", "#35261b", "#3e2d20"]
    y = -10
    while y < H1:
        ph = int(rng.integers(86, 120))
        f = wood_field(W1, ph, rng, vertical=False, ring=0.05, warp=4.0, fiber=0.28, streak=0.35)
        rgb = ramp_map(norm01(f, 0.05, 1.05) * 0.8 + rng.uniform(-0.05, 0.05), RAMP, oy=y)
        paste_rgb(canvas, rgb, 0, y)
        canvas[max(0, y):max(0, y + 2)] = hexrgb("#060403")
        y += ph
    yy, xx = np.mgrid[0:H1, 0:W1].astype(np.float32)
    lamp = np.exp(-(((xx - 380) / 760) ** 2 + ((yy - 40) / 620) ** 2))
    vign = 1 - 0.4 * (((xx - W1 / 2) / (W1 / 2)) ** 2 + ((yy - H1 / 2) / (H1 / 2)) ** 2) ** 1.4
    light = np.clip(0.62 + 0.55 * lamp, 0, 1.25) * np.clip(vign, 0.5, 1)
    canvas *= (light[..., None] * np.stack([1.0 + 0.1 * lamp, 1.0 + 0.02 * lamp, 1.0 - 0.08 * lamp], axis=-1))
    def shadow(box, off, blur, alpha):
        m = Image.new("L", (W1, H1), 0)
        ImageDraw.Draw(m).rectangle([box[0] + off[0], box[1] + off[1], box[0] + box[2] + off[0], box[1] + box[3] + off[1]], fill=255)
        a = np.asarray(m.filter(ImageFilter.GaussianBlur(blur)), np.float32) / 255 * alpha
        return canvas * (1 - a)[..., None]
    canvas = shadow(SHEET, (8, 12), 14, 0.75)
    canvas = shadow(PANEL, (8, 12), 14, 0.75)
    # the card: a sheet of the same paper, plainer
    cw, ch = PANEL[2], PANEL[3]
    card = parchment(cw, ch, "plancard", light="#efe3c4", dark="#d9c297")
    a = deckle_alpha(cw, ch, "plancard")
    sub = canvas[PANEL[1]:PANEL[1] + ch, PANEL[0]:PANEL[0] + cw]
    canvas[PANEL[1]:PANEL[1] + ch, PANEL[0]:PANEL[0] + cw] = sub * (1 - a[..., None]) + card * a[..., None]
    return Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8), "RGB")

# ------------------------------------------------------------------------------------------------ the data for the plugin
def bits64(W, H, cells):
    b = bytearray((W * H + 7) // 8)
    for (x, y) in cells:
        if 0 <= x < W and 0 <= y < H:
            i = y * W + x
            b[i >> 3] |= 1 << (i & 7)
    return base64.b64encode(bytes(b)).decode("ascii")

def floor_data(i, fl, g, info):
    rooms = []
    for r in g["rooms"]:
        rects = [list(q) for q in G.cover_rects(r.region)]
        segs = [list(q) for q in G.boundary(r.region)]
        lab = info["labels"].get(r.key)
        xs = [c[0] for c in r.region]; ys = [c[1] for c in r.region]
        centre = [round((min(xs) + max(xs) + 1) / 2, 2), round((min(ys) + max(ys) + 1) / 2, 2)]
        # l: the label's centre in cells (what the cursor moves between), c: the middle of the room's box
        lpos = [round((lab[0] - info["ox"]) / info["s"], 2), round((lab[1] - info["oy"]) / info["s"], 2)] if lab else centre
        rooms.append({"k": r.key, "n": r.name, "t": r.kind, "g": r.group, "r": rects, "e": segs, "c": centre, "l": lpos,
                      **({"sub": r.sub} if r.sub else {}), **({"to": r.to, "up": r.up} if r.kind == "stairs" else {})})
    # the floor without the furniture, and every cell a door takes him across (its wall face included)
    walk = (set(g["walk"]) - info["solid"]) | set(g["crossing"])
    # the ways out: the stairs to the other floors and the front door (map 8) - nothing else (no secret ways on the plan)
    floor_maps = {f["map"] for f in G.FLOORS} | {8}
    exits = {}
    for ln in g["links"]:
        if ln["map"] not in floor_maps: continue
        exits.setdefault(str(ln["map"]), []).append([ln["x"], ln["y"]])
        walk.add((ln["x"], ln["y"]))
    return {"map": g["map"], "name": fl["name"], "title": fl["title"], "pic": "TavernPlan_%d" % i, "w": g["W"], "h": g["H"],
            "s": round(info["s"], 4), "ox": round(info["ox"], 2), "oy": round(info["oy"], 2), "rooms": rooms,
            "icons": info["icons"], "walk": bits64(g["W"], g["H"], walk), "exits": exits}

def arrivals(datas, geos):
    """where one lands on each floor coming from another (the stairs' transfer targets on the other maps)"""
    for d in datas:
        d["arrive"] = {}
    by = {d["map"]: d for d in datas}
    for g in geos:
        for ln in g["links"]:
            if ln["map"] in by:
                by[ln["map"]]["arrive"].setdefault(str(g["map"]), list(ln["to"]))
    return datas

def write_block(data):
    """the data block in TavernLife.js between the markers (binary: the file's LF endings stay)"""
    with open(PLUGIN, "rb") as f:
        src = f.read()
    a, b = src.find(b"// <plan-data>"), src.find(b"// </plan-data>")
    if a < 0 or b < 0:
        print("  (no plan-data markers in %s: the block is only in plan_data.json)" % os.path.basename(PLUGIN))
        return False
    line_start = src.rfind(b"\n", 0, a) + 1
    indent = src[line_start:a]
    body = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    block = b"// <plan-data> (tools/tavern/plan/make_plan.py writes this line - do not edit by hand)\n" + indent + \
        b"const PLAN_DATA = " + body.encode("utf-8") + b";\n" + indent
    new = src[:a] + block + src[b:]
    with open(PLUGIN, "wb") as f:
        f.write(new)
    return True

def main():
    check = "--check" in sys.argv
    geos = []
    for fl in G.FLOORS:
        g = G.build(fl, strict=True)
        geos.append(g)
        print("Map%03d %-13s rooms %d, stairs %d, gaps %d, door events %d" % (g["map"], fl["name"], len(g["rooms"]),
              sum(1 for r in g["rooms"] if r.kind == "stairs"), len(g["gaps"]), len(g["doors"])))
    if check: return
    W0, H0 = SHEET[2], SHEET[3]
    datas = []
    for i, (fl, g) in enumerate(zip(G.FLOORS, geos)):
        img, info = draw_floor(i, fl, g, W0, H0)
        out = os.path.join(PICS, "TavernPlan_%d.png" % i)
        img.save(out)
        print("  ->", os.path.relpath(out, ROOT), img.size, "scale %.2f px/cell" % info["s"], "icons", len(info["icons"]))
        datas.append(floor_data(i, fl, g, info))
    arrivals(datas, geos)
    back = backdrop()
    back.save(os.path.join(PICS, "TavernPlan_Back.png"))
    print("  -> img/pictures/TavernPlan_Back.png")
    data = {"sheet": list(SHEET), "panel": list(PANEL), "floors": datas}
    with open(os.path.join(HERE, "plan_data.json"), "wb") as f:
        f.write(json.dumps(data, ensure_ascii=False, indent=1).encode("utf-8"))
    if write_block(data): print("  -> js/plugins/%s (plan data block, %d bytes)" % (os.path.basename(PLUGIN), len(json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode("utf-8"))))

if __name__ == "__main__":
    main()
