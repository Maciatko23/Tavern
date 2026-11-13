# -*- coding: utf-8 -*-
"""Krok porządków planszy: bez niewidzialnych ścian (gracz 2026-11-08: „wszędzie da się dojść, a nie że kratka przed płotkiem blokuje
dojście do płotka”). Region 2 („tu nie wolno”) na kratce, która WYGLĄDA na zwykły grunt (trawa / ziemia / bruk, nic nad nią, żadnego
obrazka zdarzenia):
  - zostaje, gdy obok stoi zdarzenie z obrazkiem (końce straganów, kosze z żarem, mosty - blokada pod obrazkiem), na suchej fosie
    (A2 36 / 41) i w miejscach z listy ZOSTAJE (wylot jaskini Przystani - test okolice_szkielet; zamknięta kaplica w mieście);
  - wąska szpara (kratka zamknięta z dwóch przeciwnych stron, np. między ścianą domu a płotem): zamknięta WIDOCZNIE - krzak albo beczka
    z tej samej mapy (kopia jej zdarzenia), region 2 zdjęty;
  - reszta: region 2 zdjęty - da się tam wejść, jak wygląda.
  python tools/plansza/dostep.py   (po drogi.py, przed swiat.py; staging/dostep.txt - spis)"""
import json, os, re
from plansza import N, BOARD, STG, W, ROOT
OUT = os.path.join(STG, "data")
TS = json.load(open(os.path.join(ROOT, "data", "Tilesets.json"), encoding="utf-8"))
ZOSTAJE = {125: {(16, 64), (17, 64)}, 8: {(x, y) for x in range(14, 17) for y in range(14, 17)}}
WZOR = re.compile(r"^!\$(Bush_Bare_A|Bush_Bare_B|Bush_Bare_Wide)$|^!?\$?[Bb]arrel|Beczk", re.I)
log = []
for mid in BOARD:
    p = os.path.join(OUT, "Map%03d.json" % mid)
    m = json.load(open(p, encoding="utf-8")); t, n = m["data"], N * N
    fl = TS[m["tilesetId"]]["flags"]; f = lambda v: fl[v] if v < len(fl) else 0
    pics = {}
    for e in m["events"]:
        if e and (e["pages"][0]["image"]["characterName"] or e["pages"][0]["image"]["tileId"]): pics[(e["x"], e["y"])] = e
    blk_ev = {(e["x"], e["y"]) for e in m["events"] if e and e["pages"][0].get("priorityType") == 1 and not e["pages"][0].get("through")}
    def plain(x, y):
        i = y * N + x
        v0, v1, v2, v3 = (t[z * n + i] for z in range(4))
        return 2816 <= v0 < 4352 and not v2 and not v3 and (not v1 or 2816 <= v1 < 4352) and (x, y) not in pics
    def free(x, y):   # (the hero may stand there: not a blocking tile, not a blocking event, not region 2)
        if not (0 <= x < N and 0 <= y < N): return False
        i = y * N + x
        if t[5 * n + i] == 2 or (x, y) in blk_ev or 2048 <= t[i] < 2816: return False
        for z in (3, 2, 1, 0):
            v = t[z * n + i]
            if not v: continue
            if f(v) & 0x10: continue
            return (f(v) & 0x0f) != 0x0f
        return True
    # the decoration to close a slot: a bush (meadow / suburb) or a barrel (town) from this map
    src_ev = next((e for e in m["events"] if e and WZOR.search(e["pages"][0]["image"]["characterName"] or "")), None)
    tmpl = None
    if src_ev:   # (only its picture: one page, no commands, standing like a thing - a plain decoration)
        pg = json.loads(json.dumps(src_ev["pages"][0]))
        pg["list"] = [{"code": 0, "indent": 0, "parameters": []}]; pg["trigger"] = 0; pg["priorityType"] = 1; pg["through"] = False
        for k in ("switch1Valid", "switch2Valid", "variableValid", "selfSwitchValid", "itemValid", "actorValid"): pg["conditions"][k] = False
        tmpl = {"id": 0, "name": "Ozdoba: " + (src_ev["name"] or "krzak"), "note": "", "pages": [pg], "x": 0, "y": 0}
    used = {e["id"] for e in m["events"] if e}
    free_ids = [i for i in range(1, 500) if i not in used]
    cut = closed = kept = 0
    cells = [(x, y) for y in range(N) for x in range(N) if t[5 * n + y * N + x] == 2 and plain(x, y)]
    orig_pics = set(pics)
    rest = []
    for (x, y) in cells:
        k0 = W.kind_of(t[y * N + x])
        if (x, y) in ZOSTAJE.get(mid, ()) or k0 in (36, 41) or any((x + dx, y + dy) in orig_pics for dx in (-1, 0, 1) for dy in (-1, 0, 1) if dx or dy):
            kept += 1
        else:
            rest.append((x, y))
    # (the rest in pieces: a piece of 1-2 cells shut on two opposite sides is a slot - closed with a thing you can see; a longer strip is a
    # lane - it opens: the hero walks along the fence as it looks he may)
    rs, comps = set(rest), []
    while rs:
        st = [rs.pop()]; comp = []
        while st:
            c = st.pop(); comp.append(c)
            for d in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                q = (c[0] + d[0], c[1] + d[1])
                if q in rs: rs.remove(q); st.append(q)
        comps.append(comp)
    for comp in comps:
        for (x, y) in comp: t[5 * n + y * N + x] = 0
        cs = set(comp)
        narrow = len(comp) <= 5 and all((not free(x - 1, y) and not free(x + 1, y)) or (not free(x, y - 1) and not free(x, y + 1)) for (x, y) in comp)
        # (the cells of the piece that open onto free ground outside it: one = a dead end - shut at its mouth; two or more = a way through)
        mouths = [(x, y) for (x, y) in comp if any(free(x + dx, y + dy) and (x + dx, y + dy) not in cs for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))]
        if narrow and len(mouths) == 1 and tmpl and free_ids:
            for (x, y) in mouths:
                e = json.loads(json.dumps(tmpl)); e["id"] = free_ids.pop(0); e["x"], e["y"] = x, y
                while len(m["events"]) <= e["id"]: m["events"].append(None)
                m["events"][e["id"]] = e; blk_ev.add((x, y)); closed += 1
        else:
            cut += len(comp)
    open(p, "wb").write(W.map_text(m).encode("utf-8"))
    log.append("Map%03d: niewidzialnych ścian zdjętych %d, szpar zamkniętych widocznie (%s) %d, zostaje pod obrazkami / fosa / celowe %d" % (
        mid, cut, (tmpl["pages"][0]["image"]["characterName"] if tmpl else "-"), closed, kept))
open(os.path.join(STG, "dostep.txt"), "w", encoding="utf-8").write("\n".join(log) + "\n")
print("\n".join(log))
