# -*- coding: utf-8 -*-
"""Podgrodzie (Map218), 2026-11-13 (gracz: „do ogródków musi dać się wejść - jak jest krzaczek na wejściu albo coś, to usuń; ogrodzenia
ze zwierzętami też mają mieć wejście - mieszkańcy będą wchodzić i karmić zwierzęta, zbierać jajka, wełnę”):
  1. zagrody: furtka w płocie (z boku, od strony przejścia między chatą a ogródkiem - osiągalna z drogi), zwierzęta dostają w notatce
     swój wybieg <Zagroda:właściciel,x0,y0,x1,y1> - Ogrodki.js nie wypuszcza ich za płot, ludzie przechodzą;
  2. furtki ogródków i zagród: na furtce i przed nią region 7 (zakaz pola: nic tam nie wyrośnie ani nie leży - krzaki z jagodami,
     kamyki, gałęzie), zdarzenia-rzeczy stamtąd usunięte;
  3. punkty dla mieszkańców: „Miejsce: <właściciel>_zagroda” i „Miejsce: <właściciel>_ogrodek” przed furtkami.
  python tools/nowy_swiat/furtki.py [--wykonaj]"""
import copy, datetime, importlib.util, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("zagrody", os.path.join(HERE, "zagrody.py"))
Z = importlib.util.module_from_spec(spec); spec.loader.exec_module(Z)
RW, rect, kind = Z.RW, Z.rect, Z.kind
STEP4 = ((1, 0), (-1, 0), (0, 1), (0, -1))


def main():
    P = Z.Map()
    at, put = P.at, P.put
    fence = lambda x, y: kind(at(1, x, y)) == Z.FENCE
    log = []
    clear_cells = set()
    spots = []
    # ---- 1. the pens
    pens = {}
    for e in P.events():
        m = re.search(r"<Zagroda:(\w+)", e["note"] or "")
        if m: pens.setdefault(m[1], []).append(e)
    for owner, animals in pens.items():
        a = animals[0]
        inner, st = set(), [(a["x"], a["y"])]
        while st:
            x, y = st.pop()
            if (x, y) in inner or fence(x, y) or len(inner) > 60: continue
            inner.add((x, y)); st += [(x + dx, y + dy) for dx, dy in STEP4]
        xs, ys = [p[0] for p in inner], [p[1] for p in inner]
        ix0, iy0, ix1, iy1 = min(xs), min(ys), max(xs), max(ys)
        rx0, ry0, rx1, ry1 = ix0 - 1, iy0 - 1, ix1 + 1, iy1 + 1
        base = Z.reach(P, Z.START)
        side = [(rx0, y) for y in range(iy0, iy1 + 1)] + [(rx1, y) for y in range(iy0, iy1 + 1)] + [(x, ry0) for x in range(ix0, ix1 + 1)] + [(x, ry1) for x in range(ix0, ix1 + 1)]
        def outside(g):
            gx, gy = g
            return (gx - 1, gy) if gx == rx0 else (gx + 1, gy) if gx == rx1 else (gx, gy - 1) if gy == ry0 else (gx, gy + 1)
        side = [g for g in side if fence(*g) and outside(g) in base]
        side.sort(key=lambda g: (0 if g[0] in (rx0, rx1) else 1, abs(g[1] - (iy0 + iy1) / 2)))
        if not side: log.append("  BEZ furtki: zagroda %s (nic osiągalnego obok)" % owner); continue
        g = side[0]; o = outside(g)
        put(1, g[0], g[1], 0)
        clear_cells |= {g, o}
        for e in animals: e["note"] = "<Zagroda:%s,%d,%d,%d,%d>" % (owner, ix0, iy0, ix1, iy1)
        spots.append(("%s_zagroda" % owner, o))
        log.append("  zagroda %-9s furtka %s, wybieg %d..%d x %d..%d" % (owner, g, ix0, ix1, iy0, iy1))
    # ---- 2. the gardens' gates
    for e in P.events():
        m = re.search(r"<Ogrodek:(\d+),(\d+),(\w+)", e["note"] or "")
        if not m or not e["name"].startswith("Ogródek: "): continue
        w, h, owner = int(m[1]), int(m[2]), m[3]
        x0, y0, x1, y1 = e["x"] - 1, e["y"] - 1, e["x"] + w, e["y"] + h
        gates = [(x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1) if (x in (x0, x1) or y in (y0, y1)) and not fence(x, y)]
        for g in gates:
            o = (g[0] - 1, g[1]) if g[0] == x0 else (g[0] + 1, g[1]) if g[0] == x1 else (g[0], g[1] - 1) if g[1] == y0 else (g[0], g[1] + 1)
            clear_cells |= {g, o}
            spots.append(("%s_ogrodek" % owner, o))
        log.append("  ogródek %-9s furtka %s" % (owner, gates))
    # ---- the gates and the cells before them: no growth, no things
    for (x, y) in clear_cells:
        if at(5, x, y) in (0, 31): put(5, x, y, 7)
        if 512 <= at(2, x, y) < 768: put(2, x, y, 0)
    n = P.drop(lambda e: (e["x"], e["y"]) in clear_cells and e["name"] in Z.GATHERABLE + ("Krzak", "Jagody"))
    log.append("  furtki i przedpola: %d kratek bez roślin i rzeczy (usunięte zdarzenia: %d)" % (len(clear_cells), n))
    # ---- 3. the spots
    tmpl = next(e for e in P.events() if e["name"].startswith("Miejsce: "))
    have = {e["name"] for e in P.events()}
    for (key, (x, y)) in spots:
        nm = "Miejsce: " + key
        if nm in have: continue
        s = copy.deepcopy(tmpl); s["name"], s["x"], s["y"] = nm, x, y
        P.add(s); have.add(nm)
    RW.reshape(P.m, 1, RW.ring(P.changed, 1))
    for l in log: print(l)
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "furtki_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    shutil.copy2(os.path.join(ROOT, "data", "Map218.json"), bak)
    open(os.path.join(ROOT, "data", "Map218.json"), "wb").write(RW.json_text(P.m, P.lay))
    print("Zapisano; kopia: " + bak)


if __name__ == "__main__":
    main()
