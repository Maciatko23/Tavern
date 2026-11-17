# -*- coding: utf-8 -*-
"""Żywe wodospady w Kruczych Turniach (gracz 2026-11-14: „pamiętasz, jak robiliśmy animację wodospadu i wody? można ją dodać w górach
przy wodospadach?”): to samo, co było przy stawie w starym mieście (WaterFx.js + !waterfall_animation autora kafli), na każdym
wodospadzie mapy (prostokąt kafli A1 „wodospad”):
  - lśniąca krawędź na górnym rzędzie (lewa / środek / prawa), lewa z <Fall:w,h> - woda zsuwa się płynnie, nie skokami;
  - piana na wodzie pod wodospadem, lewa z <Splash:w,wave> - bryzgi, mgiełka, rozchodzące się fale;
  - niewidoczne „Nurt” w środku nurtu pod wodospadem (<Flow>): piana i błyski niesione prądem. Nigdy przy brzegu.
  python tools/nowy_swiat/wodospady.py [--mapa 222] [--wykonaj]"""
import datetime, importlib.util, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

FALL_KINDS = {5, 7, 9, 11, 13, 15}      # the A1 waterfall kinds (Tilemap.isWaterfallTile)


def page(image, priority=0, step=False):
    return {"conditions": {"actorId": 1, "actorValid": False, "itemId": 1, "itemValid": False, "selfSwitchCh": "A", "selfSwitchValid": False,
                           "switch1Id": 1, "switch1Valid": False, "switch2Id": 1, "switch2Valid": False, "variableId": 1, "variableValid": False, "variableValue": 0},
            "directionFix": True, "image": image, "list": [{"code": 0, "indent": 0, "parameters": []}],
            "moveFrequency": 5 if step else 3, "moveRoute": {"list": [{"code": 0, "parameters": []}], "repeat": True, "skippable": False, "wait": False},
            "moveSpeed": 6 if step else 3, "moveType": 0, "priorityType": priority, "stepAnime": step, "through": True, "trigger": 0, "walkAnime": False}
def pic(name, index=0, direction=2, pattern=0):
    return {"tileId": 0, "characterName": name, "direction": direction, "pattern": pattern, "characterIndex": index}


def main():
    mid = 222
    for i, a in enumerate(sys.argv):
        if a == "--mapa": mid = int(sys.argv[i + 1])
    rel = "data/Map%03d.json" % mid
    m, lay = RW.read_json(rel)
    W, H, d = m["width"], m["height"], m["data"]
    kind = lambda x, y: (d[y * W + x] - 2048) // 48 if 0 <= x < W and 0 <= y < H and 2048 <= d[y * W + x] < 2816 else None
    fall = lambda x, y: kind(x, y) in FALL_KINDS
    water = lambda x, y: kind(x, y) is not None and not fall(x, y)
    if any(e and e["name"].startswith(("Wodospad:", "Nurt:")) for e in m["events"]): raise SystemExit("STOP: wodospady tej mapy są już ożywione")
    taken = {(e["x"], e["y"]) for e in m["events"] if e}
    events = m["events"]
    def add(name, x, y, pg, note=""):
        if (x, y) in taken: raise SystemExit("STOP: na polu (%d,%d) stoi już zdarzenie" % (x, y))
        taken.add((x, y))
        events.append({"id": len(events), "name": name, "note": note, "pages": [pg], "x": x, "y": y})
    seen, n = set(), 0
    for y in range(H):
        for x in range(W):
            if not fall(x, y) or (x, y) in seen: continue
            w = 1
            while fall(x + w, y): w += 1
            h = 1
            while all(fall(x + i, y + h) for i in range(w)): h += 1
            seen |= {(x + i, y + j) for i in range(w) for j in range(h)}
            n += 1
            ends = lambda i: "single" if w == 1 else "left" if i == 0 else "right" if i == w - 1 else "mid"
            LIP = {"left": (4, 2), "mid": (4, 4), "right": (5, 2), "single": (5, 4)}
            FOAM = {"left": (0, 2), "mid": (1, 2), "right": (0, 4), "single": (1, 4)}
            for i in range(w):
                k = ends(i)
                add("Wodospad: krawędź", x + i, y, page(pic("!waterfall_animation", LIP[k][0], LIP[k][1], 1), step=True),
                    "<Fall:w=%d,h=%d,speed=1.3>" % (w, h) if i == 0 else "")
            fy = y + h
            if all(water(x + i, fy) for i in range(w)):
                for i in range(w):
                    k = ends(i)
                    add("Wodospad: piana", x + i, fy, page(pic("!waterfall_animation", FOAM[k][0], FOAM[k][1], 1), step=True),
                        "<Splash:w=%d,wave=110>" % w if i == 0 else "")
            # the current below the fall: the stretch of water straight under it (as wide as the fall), up to 9 rows, from mid-water
            rows = 0
            while rows < 9 and all(water(x + i, fy + 1 + rows) for i in range(w)): rows += 1
            # ... a pool wider than the fall (the spring's): the foam drifts out over it instead
            x0, x1 = x, x + w - 1
            while water(x0 - 1, fy + 2) and x - x0 < 6: x0 -= 1
            while water(x1 + 1, fy + 2) and x1 - (x + w - 1) < 6: x1 += 1
            if rows >= 3:
                # (mid-water, on a free cell: a bridge's or another event may stand in the middle)
                cx, cy = next(((cx, cy) for cy in sorted(range(fy + 2, fy + rows), key=lambda r: abs(r - (fy + 1 + rows // 2)))
                               for cx in ((x + w // 2, x + w // 2 - 1) if w > 2 else (x + w // 2,)) if (cx, cy) not in taken), (None, None))
                if cx is None: raise SystemExit("STOP: brak wolnego pola w nurcie pod wodospadem (%d,%d)" % (x, y))
                pool = (x1 - x0 + 1) > w + 2
                if pool:
                    note = ("<Flow:dx=%.2f,dy=0.5,w=%d,h=%d,ox=%d,oy=%d,speed=0.35,count=%d,sx=%.2f,sy=%.2f,src=0.6,spread=1.1,glint=0.35>"
                            % (-0.6 if (x - x0) > (x1 - x - w + 1) else 0.6, x1 - x0 + 1, rows, x0 - cx, fy + 1 - cy, 3 * (x1 - x0 + 1),
                               x + w / 2 - cx - 0.5, fy - cy + 0.15))
                else:
                    note = ("<Flow:dx=0,dy=1,w=%d,h=%d,ox=%d,oy=%d,speed=1.1,count=%d,sx=%.2f,sy=%.2f,src=0.5,spread=%.1f,glint=0.4>"
                            % (w, rows, x - cx, fy + 1 - cy, 3 * rows, w / 2 - (cx - x) - 0.5, fy - cy + 0.15, w / 2))
                add("Nurt: pod wodospadem", cx, cy, page(pic("")), note)
            print("  wodospad %d: (%d..%d, %d..%d), piana w rzędzie %d, nurt %d rzędów%s" % (n, x, x + w - 1, y, y + h - 1, fy, rows, " (rozlewisko)" if rows >= 3 and pool else ""))
    print("Map%d: %d wodospadów, zdarzeń teraz %d" % (mid, n, len(events) - 1))
    if not n: return
    raw = RW.json_text(m, lay)
    if "--podglad" in sys.argv:
        open(sys.argv[sys.argv.index("--podglad") + 1], "wb").write(raw); return
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "wodospady_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    sp = os.path.join(ROOT, "data", "System.json")
    shutil.copy2(os.path.join(ROOT, rel), bak); shutil.copy2(sp, bak)
    open(os.path.join(ROOT, rel), "wb").write(raw)
    s = open(sp, "rb").read()
    open(sp, "wb").write(re.sub(rb'"versionId":(\d+)', lambda k: b'"versionId":' + str(int(k.group(1)) + 1).encode(), s, count=1))
    print("Zapisano; kopie: %s" % bak)


if __name__ == "__main__":
    main()
