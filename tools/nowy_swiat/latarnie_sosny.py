# -*- coding: utf-8 -*-
"""Poprawki gracza na 5 mapach nowego świata (2026-11-13), na JEGO plikach w data/ (nie ze staging):
  1. LATARNIE: słup z suszarki (kafle C 8,13-15) + osobny płomień (!Decoration 7) -> jedno zdarzenie !$Latarnia_Slup jak w starym
     Podgrodziu (Map111): latarnia wisi równo pod ramieniem, blokuje tylko kratka podstawy, postać wchodzi za słup (gracz: „postać powinna
     móc wejść za niego trochę”).
  2. SOSNY: ciemne sosny z arkusza dużych drzew (!$Big_Trees_scinane: wysoka 2/2 i niższa 4/1) -> jasne !$Pine_A/B/C (gracz: „te z
     ptaszkiem tylko, w różnych wielkościach”); wielkość potem daje tools/drzewa/drzewa.py (małe / średnie / duże).
  3. Map219 (Przystań/Wybrzeże): kilka kęp sosen w prawej górnej części (gracz: „troszkę więcej drzew”).
  python tools/nowy_swiat/latarnie_sosny.py             sprawdzenie (nic nie zapisuje)
  python tools/nowy_swiat/latarnie_sosny.py --wykonaj   zapis (TYLKO przy zamkniętym edytorze; kopie w archiwum)
  potem: python tools/drzewa/drzewa.py --mapy 218,219,220,221,222 --wykonaj"""
import copy, datetime, importlib.util, json, math, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

MAPS = [218, 219, 220, 221, 222]
POLE = (488, 496, 504)                      # C 8,13 / 8,14 / 8,15: the pole's top, middle, foot
DARK_PINES = {(2, 2), (4, 1)}               # !$Big_Trees_scinane frames that are the dark pines
PINES = [("!$Pine_A", "Sosna", 0.35), ("!$Pine_B", "Sosna (średnia)", 0.40), ("!$Pine_C", "Sosna (niska)", 0.25)]
NE_219 = (46, 8, 77, 36)                    # the upper right of Map219 (x0, y0, x1, y1)
NE_CLUSTERS = [(51, 13), (60, 11), (69, 16), (74, 27), (57, 24)]
N_NEW = 14


def h01(*a):
    v = 0
    for x in a: v = (v * 1000003 + int(x) * 2654435761) & 0xFFFFFFFF
    v ^= v >> 15; v = (v * 2246822519) & 0xFFFFFFFF; v ^= v >> 13
    return v / 4294967296


def pick_pine(mid, x, y):
    r, acc = h01(mid, x, y, 7), 0
    for (img, name, w) in PINES:
        acc += w
        if r < acc: return img, name
    return PINES[-1][0], PINES[-1][1]


def lamp_template():
    m, _ = RW.read_json("data/Map111.json")
    for e in m["events"]:
        if e and e["pages"][0]["image"]["characterName"] == "!$Latarnia_Slup": return e
    raise SystemExit("STOP: brak wzoru !$Latarnia_Slup w Map111.")


def tile(m, z, x, y): return m["data"][(z * m["height"] + y) * m["width"] + x]
def set_tile(m, z, x, y, v): m["data"][(z * m["height"] + y) * m["width"] + x] = v


def add_event(m, e):
    ids = [ev["id"] for ev in m["events"] if ev]
    nid = max(ids) + 1 if ids else 1
    if nid >= 500: raise SystemExit("STOP: Map%d: numer zdarzenia %d >= 500." % (m.get("_id", 0), nid))
    while len(m["events"]) <= nid: m["events"].append(None)
    e["id"] = nid; m["events"][nid] = e
    return nid


def fix_lamps(mid, m, tmpl, log):
    W, H = m["width"], m["height"]
    def flame_near(x, y):
        return [i for i, e in enumerate(m["events"]) if e and e["x"] == x and y - 3 <= e["y"] <= y + 1
                and e["pages"][0]["image"]["characterName"] == "!Decoration" and e["pages"][0]["image"]["characterIndex"] == 7]
    # (a foot with no lantern by it is a washing line's pole - the same tiles - and stays)
    feet = [(x, y) for y in range(H) for x in range(W) if any(tile(m, z, x, y) == 504 for z in (2, 3)) and flame_near(x, y)]
    for (x, y) in feet:
        for dy in (0, 1, 2):
            if y - dy < 0: continue
            for z in (2, 3):
                if tile(m, z, x, y - dy) in POLE: set_tile(m, z, x, y - dy, 0)
        if tile(m, 5, x, y) == 2: set_tile(m, 5, x, y, 0)        # (the foot's region 2: the new event blocks by itself)
        name = "Latarnia"
        for i, e in enumerate(m["events"]):
            if e and e["x"] == x and y - 3 <= e["y"] <= y + 1 and e["pages"][0]["image"]["characterName"] == "!Decoration" \
                    and e["pages"][0]["image"]["characterIndex"] == 7:
                name = e["name"]; m["events"][i] = None
        e = copy.deepcopy(tmpl); e["name"] = name; e["x"] = x; e["y"] = y
        log.append("  latarnia %d,%d „%s” -> zdarzenie %d" % (x, y, name, add_event(m, e)))
    return len(feet)


def fix_pines(mid, m, log):
    n = 0
    for e in m["events"]:
        if not e: continue
        im = e["pages"][0]["image"]
        if im["characterName"] == "!$Big_Trees_scinane" and (im["direction"], im["pattern"]) in DARK_PINES:
            img, name = pick_pine(mid, e["x"], e["y"])
            im.update({"characterName": img, "direction": 2, "pattern": 1, "characterIndex": 0})
            e["name"] = name; n += 1
    log.append("  ciemne sosny -> jasne: %d" % n)
    return n


def free_cell(m, x, y, taken):
    W, H = m["width"], m["height"]
    if not (1 <= x < W - 1 and 1 <= y < H - 1): return False
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            t0 = tile(m, 0, x + dx, y + dy)
            if not (t0 >= 2816 and (t0 - 2816) // 48 in (0, 11)): return False          # grass all round (A2 kinds 16 / 27): no path, no earth, no edge
            if tile(m, 5, x + dx, y + dy): return False
    if any(tile(m, z, x, y) or tile(m, z, x, y - 1) for z in (2, 3)): return False      # (nothing standing on the cell or above it)
    if any(abs(ex - x) <= 1 and abs(ey - y) <= 2 for (ex, ey) in taken): return False
    return True


def more_trees_219(m, log):
    tmpl = next(e for e in m["events"] if e and e["pages"][0]["image"]["characterName"] == "!$Pine_A")
    taken = {(e["x"], e["y"]) for e in m["events"] if e}
    placed = []
    x0, y0, x1, y1 = NE_219
    cands = []
    for (cx, cy) in NE_CLUSTERS:
        for y in range(cy - 4, cy + 5):
            for x in range(cx - 5, cx + 6):
                if x0 <= x <= x1 and y0 <= y <= y1:
                    d = math.hypot((x - cx) / 1.3, y - cy)
                    if d <= 4.2: cands.append((d + h01(x, y, 3) * 2.2, x, y))
    for (_, x, y) in sorted(cands):
        if len(placed) >= N_NEW: break
        if any(math.hypot(x - a, y - b) < 2.6 for (a, b) in placed): continue
        if not free_cell(m, x, y, taken | set(placed)): continue
        img, name = pick_pine(219, x, y)
        e = copy.deepcopy(tmpl); e["name"] = name; e["x"] = x; e["y"] = y
        e["pages"][0]["image"].update({"characterName": img, "direction": 2, "pattern": 1})
        add_event(m, e); placed.append((x, y))
    log.append("  nowe sosny w prawej górnej części: %d %s" % (len(placed), placed))
    return len(placed)


def main():
    run = "--wykonaj" in sys.argv
    tmpl = lamp_template()
    out = []
    for mid in MAPS:
        rel = "data/Map%03d.json" % mid
        m, lay = RW.read_json(rel)
        if lay != "map": raise SystemExit("STOP: %s nie w układzie edytora." % rel)
        log = []
        a = fix_lamps(mid, m, tmpl, log)
        b = fix_pines(mid, m, log)
        c = more_trees_219(m, log) if mid == 219 else 0
        print("Map%d: latarnie %d, sosny %d, nowe %d" % (mid, a, b, c))
        for l in log: print(l)
        if a or b or c: out.append((rel, RW.json_text(m, lay)))
    if not run: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "latarnie_sosny_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    for (rel, raw) in out:
        shutil.copy2(os.path.join(ROOT, rel), os.path.join(bak, os.path.basename(rel)))
        open(os.path.join(ROOT, rel), "wb").write(raw)
    print("Zapisano %d map; kopie: %s" % (len(out), bak))


if __name__ == "__main__":
    main()
