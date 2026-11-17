# -*- coding: utf-8 -*-
"""Przybudówki i beczki (gracz 2026-11-14: „postać źle widoczna i ukryta” - żebrak Gaweł stał w przybudówce przytułku, beczka i słupki
rysowały się nad nim): na mapach nowego świata
  1. wysoka beczka (C 324 nad 332, warstwa 2) dostaje region 2 na obu polach - nikt na nią nie wchodzi, a RegionLayers.js rysuje jej
     górę na równi z ludźmi (nie nad głową tego, kto stoi przed nią);
  2. pola przybudówki nad taką beczką (B 203/211/219/227 w warstwie 3: rama pod daszkiem) dostają region 2 (ta sama rama bez beczki
     to słup kapliczki - za nim się chodzi, zostaje);
  3. punkt mieszkańca („Miejsce: ...”), który stał na takim polu, przechodzi na wolne pole tuż przed przybudówką, obok słupka.
Regionów innych niż 0 / 31 nie rusza.
  python tools/nowy_swiat/przybudowki.py [--mapy 218,220] [--wykonaj]"""
import datetime, importlib.util, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

BARREL_TOP, BARREL_FOOT = 324, 332
LEAN_FRAME = {203, 211, 219, 227}


def main():
    mids = [218, 219, 220, 221, 222]
    for i, a in enumerate(sys.argv):
        if a == "--mapy": mids = [int(v) for v in sys.argv[i + 1].split(",")]
    flags_all = RW.read_json("data/Tilesets.json")[0]
    out = []
    for mid in mids:
        rel = "data/Map%03d.json" % mid
        m, lay = RW.read_json(rel)
        W, H = m["width"], m["height"]
        flags = flags_all[m["tilesetId"]]["flags"]
        at = lambda z, x, y: m["data"][(z * H + y) * W + x]
        cells = set()
        for y in range(H):
            for x in range(W):
                if not (at(2, x, y) == BARREL_TOP and y + 1 < H and at(2, x, y + 1) == BARREL_FOOT): continue
                cells |= {(x, y), (x, y + 1)}
                # the frame alone is also the shrine's tall post (walked behind): only the frame column over a barrel is a lean-to
                yy = y - 1
                while yy >= 0 and at(3, x, yy) in LEAN_FRAME and at(3, x, y) in LEAN_FRAME: cells.add((x, yy)); yy -= 1
        new = sorted(c for c in cells if at(5, c[0], c[1]) in (0, 31))
        for (x, y) in new: m["data"][(5 * H + y) * W + x] = 2
        blocked = {c for c in cells if at(5, c[0], c[1]) == 2}
        taken = {(e["x"], e["y"]) for e in m["events"] if e}

        def free(x, y):
            if not (0 <= x < W and 0 <= y < H) or (x, y) in taken or at(5, x, y) in (2, 3): return False
            if any(at(z, x, y) for z in (1, 2, 3)): return False
            return (flags[at(0, x, y)] & 0x0f) == 0 and not any(at(z, x, y - 1) for z in (2, 3))   # open ground, nothing over the head
        moved = []
        for e in m["events"]:
            if not e or not e["name"].startswith("Miejsce:") or (e["x"], e["y"]) not in blocked: continue
            x, y = e["x"], e["y"]
            while (x, y) in blocked: y += 1                       # the first row before the lean-to
            spot = next((c for c in ((x + 1, y), (x - 1, y), (x, y), (x + 1, y + 1), (x - 1, y + 1), (x, y + 1)) if free(*c)), None)
            if not spot: raise SystemExit("STOP: Map%d %s (%d,%d) - brak wolnego pola przed przybudówką" % (mid, e["name"], e["x"], e["y"]))
            moved.append("%s (%d,%d) -> (%d,%d)" % (e["name"], e["x"], e["y"], spot[0], spot[1]))
            taken.discard((e["x"], e["y"])); taken.add(spot)
            e["x"], e["y"] = spot
        print("Map%d: region 2 na %d polach %s; przeniesione punkty: %s" % (mid, len(new), new, moved or "-"))
        if new or moved: out.append((rel, RW.json_text(m, lay)))
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "przybudowki_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    for (rel, raw) in out:
        shutil.copy2(os.path.join(ROOT, rel), bak)
        open(os.path.join(ROOT, rel), "wb").write(raw)
    print("Zapisano %d map; kopie: %s" % (len(out), bak))


if __name__ == "__main__":
    main()
