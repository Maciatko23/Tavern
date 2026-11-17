# -*- coding: utf-8 -*-
"""Mniejsze piętro II tawerny (Map026 „Apartamenty”; gracz 2026-11-16: piętra 1 i 2 tej samej wielkości co parter; na piętrze 2
pokoje trochę większe i ładniejsze). Z 63 x 55 robi 49 x 42 - ten sam szkielet co piętro I: pas północny, korytarz, pas środkowy,
hol schodowy. Schody w dół stoją nad biegami „w górę” piętra I (x5-7 i x29-31, rzędy 33-39).

Wszystko wycięte z dotychczasowej mapy; pokoje są ZWĘŻANE i SKRACANE: zostają wybrane kolumny i rzędy podłogi, reszta wypada
w całości - mebel nigdy nie jest cięty (kolumny / rzędy połączone jednym meblem idą razem).
  rzędy 0-12   Apartament Lorda (sypialnia + salon) | Biblioteka | Apartament Błękitny | Komnata z kominkiem (ze starego piętra I)
  rzędy 13-19  galeria (korytarz)
  rzędy 20-32  Apartament Zielony | hol | Apartament Złoty (salonik + sypialnia) | Wielki salon
  rzędy 32-41  hol schodowy (x0-33) i mały balkon (x34-47, wyjście z Wielkiego salonu)
Numery zdarzeń zostają; zdarzenia Komnaty dostają nowe numery. Zapisuje tablicę „stare pole -> nowe pole”.

  python tools/tawerna/pietro2.py <podglad.png>             (tylko obraz)
  python tools/tawerna/pietro2.py <podglad.png> --wykonaj   (zapis Map026 + tools/tawerna/pietro2_pola.json; edytor zamknięty)
NIE uruchamiać ponownie po ręcznych poprawkach gracza na Map026."""
import copy, datetime, glob, importlib.util, json, os, re, shutil, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy")); sys.path.insert(0, os.path.join(ROOT, "tools", "mapy", "pieczatki"))
import mapylib as L
import pieczatki as PZ
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

NW, NH = 49, 42
FLOOR = 8                                   # rows of floor in a room
# a room: source map ("A" this floor, "K" the old floor 1 with the Komnata), segments (first col, last col, new first col, new width;
# the wall column between two segments stays), the fixed rows {old: new}, the floor rows (first, last) and the new first floor row
N_FIX = {1: 1, 2: 2, 3: 3, 18: 12, 19: 13, 20: 14, 21: 15}
M_FIX = {26: 20, 27: 21, 28: 22, 29: 23, 45: 32}
ROOMS = [
    ("lord", "A", [(1, 11, 1, 9), (13, 28, 11, 9)], N_FIX, (4, 17), 4),
    ("lib", "A", [(30, 40, 21, 7)], N_FIX, (4, 17), 4),
    ("blue", "A", [(52, 61, 29, 9)], N_FIX, (4, 17), 4),
    ("komnata", "K", [(35, 50, 39, 9)], {33: 1, 34: 2, 35: 3, 45: 12, 46: 13, 47: 14, 48: 15}, (36, 44), 4),
    ("green", "A", [(1, 9, 1, 9)], M_FIX, (30, 44), 24),
    ("hall", "A", [(11, 17, 11, 7)], M_FIX, (30, 44), 24),
    ("zloty", "A", [(19, 28, 19, 8), (30, 40, 28, 9)], M_FIX, (30, 44), 24),
    ("salon", "A", [(42, 61, 38, 10)], M_FIX, (30, 44), 24),
]
MUST_NAME = re.compile(r"^(Łóżko|Łoże|Drzwi|Wejście|Wyjście|Kufer|Złoty kufer|Kominek|Szpinet)")
KEEP_COLS = {}                              # (room, segment index) -> columns chosen by hand
KEEP_ROWS = {}                              # room -> floor rows chosen by hand


def old_floor1():
    d = sorted(glob.glob(os.path.join(ARCH, "tawerna_pietro1_2*")))[0]
    return json.load(open(os.path.join(d, "Map025.json"), encoding="utf-8"))


def build():
    old, lay = RW.read_json("data/Map026.json")
    W, H = old["width"], old["height"]
    if (W, H) != (63, 55): raise SystemExit("Map026 ma już %d x %d - piętro II jest przebudowane, nie uruchamiaj ponownie." % (W, H))
    SRC = {"A": old, "K": old_floor1()}
    T = {k: np.array(m["data"], dtype=np.int64).reshape(6, m["height"], m["width"]) for k, m in SRC.items()}
    AT = {}
    for k, m in SRC.items():
        AT[k] = {}
        for e in m["events"]:
            if e: AT[k].setdefault((e["x"], e["y"]), []).append(e)
    src = T["A"]
    new = np.zeros((6, NH, NW), dtype=np.int64)
    VOID = src[:, 0, 0].copy()
    new[:, :, :] = VOID[:, None, None]
    cell = {"A": {}, "K": {}}

    def put(k, ox, oy, nx, ny, soft=False):
        new[:, ny, nx] = T[k][:, oy, ox]
        if soft: cell[k].setdefault((ox, oy), (nx, ny))
        else: cell[k][(ox, oy)] = (nx, ny)

    def groups_of(items, linked):
        link = {i: i for i in items}
        def find(a):
            while link[a] != a: a = link[a]
            return a
        for a, b in linked:
            if a in link and b in link: link[find(b)] = find(a)
        g = {}
        for i in items: g.setdefault(find(i), []).append(i)
        return list(g.values())

    def pick(items, linked, must, score, n, what):
        gs = groups_of(items, linked)
        keep = set()
        for g in gs:
            if set(g) & must: keep |= set(g)
        if len(keep) > n: raise SystemExit("%s: %d nie do ruszenia, a miejsca %d: %s" % (what, len(keep), n, sorted(keep)))
        for g in sorted((g for g in gs if not (set(g) & keep)), key=lambda g: -sum(score[i] for i in g) / len(g)):
            if len(keep) + len(g) <= n and sum(score[i] for i in g) / len(g) > 0.6: keep |= set(g)
        for g in sorted((g for g in gs if not (set(g) & keep)), key=lambda g: sum(score[i] for i in g)):
            if len(keep) + len(g) <= n: keep |= set(g)
        if len(keep) != n: raise SystemExit("%s: wybrano %d z %d" % (what, len(keep), n))
        return sorted(keep)

    report = {}
    for key, k, segs, fix, (f0, f1), nf0 in ROOMS:
        t, at = T[k], AT[k]
        allrows = sorted(fix) + list(range(f0, f1 + 1))
        allcols = [x for (a, b, _, _) in segs for x in range(a, b + 1)] + [segs[i][1] + 1 for i in range(len(segs) - 1)]
        void0 = int(t[0, f0, segs[0][0] - 1])                      # (the wall beside the room)
        # ---- the floor rows, one choice for the whole suite
        frows = list(range(f0, f1 + 1))
        linked, must, score = [], set(), {y: 0.0 for y in frows}
        for y in range(f0 - 1, f1 + 1):
            for x in allcols:
                for z in (2, 3):
                    a, b = int(t[z, y, x]), int(t[z, y + 1, x])
                    if a and b == a + 8:
                        if y < f0: must.add(y + 1)
                        elif y + 1 > f1: must.add(y)
                        else: linked.append((y, y + 1))
        for y in frows:
            for x in allcols:
                for e in at.get((x, y), []):
                    o = PZ._occ(e.get("note"))
                    for dy in range(-o["up"], o["down"] + 1): linked.append((y, y + dy))
                    if MUST_NAME.match(e["name"]): must.add(y)
                    score[y] += 3 if e["name"] != "wypelnienie" else 0.2
                for z in (2, 3):
                    if t[z, y, x]: score[y] += 1
            for i in range(len(segs) - 1):                          # (the way through the wall inside a suite)
                if int(t[0, y, segs[i][1] + 1]) not in (void0,) and not (3232 <= int(t[0, y, segs[i][1] + 1]) <= 3295): must.add(y)
        must |= {f0, f1}                                            # (the row under the wall and the row at the door)
        rows = KEEP_ROWS.get(key) or pick(frows, linked, must, score, FLOOR, key + " rzędy")
        ymap = dict(fix); ymap.update({y: nf0 + i for i, y in enumerate(rows)})
        report[key] = {"rzędy": rows, "kolumny": []}
        # ---- the columns of each segment
        for si, (x0, x1, nx0, width) in enumerate(segs):
            cols = list(range(x0, x1 + 1))
            linked, must, score = [], set(), {x: 0.0 for x in cols}
            for y in ymap:
                for x in cols:
                    if x < x1:
                        for z in (2, 3):
                            a, b = int(t[z, y, x]), int(t[z, y, x + 1])
                            if a and b == a + 1 and a % 8 != 7: linked.append((x, x + 1))
                        if t[1, y, x] and t[1, y, x + 1] and y in fix and y not in (1, 2, 3, 33, 34, 35, 27, 28, 29): linked.append((x, x + 1))   # (a doormat two cells wide)
                    for e in at.get((x, y), []):
                        o = PZ._occ(e.get("note"))
                        for dx in range(-o["left"], o["right"] + 1): linked.append((x, x + dx))
                        if MUST_NAME.match(e["name"]): must.add(x)
                        score[x] += 3 if e["name"] != "wypelnienie" else 0.2
                    for z in (2, 3):
                        if t[z, y, x]: score[x] += 1
                    if y in fix and t[1, y, x]: must.add(x)         # (a doormat: the way in)
            got = KEEP_COLS.get((key, si)) or pick(cols, linked, must, score, width, "%s kolumny %d" % (key, si))
            report[key]["kolumny"].append(got)
            for i, ox in enumerate(got):
                for oy, ny in ymap.items():
                    if oy in (19, 20, 21, 46, 47, 48) and k == "A" and oy >= 46: continue
                    put(k, ox, oy, nx0 + i, ny)
            if si < len(segs) - 1:
                for oy, ny in ymap.items(): put(k, x1 + 1, oy, nx0 + width, ny)
    # ---- the walls between the rooms of the north band, the corridor's plain wall under them
    for nx in (0, 10, 20, 28, 38, 48):
        if nx != 10: new[:, 0:13, nx] = VOID[:, None]                # (x10: the wall inside the Lord's suite, with its way through)
        for y in (13, 14, 15): new[:, y, nx] = src[:, y + 6, 2]
    new[:, 13:16, 0] = src[:, 19:22, 0]; new[:, 13:16, 48] = src[:, 19:22, 62]
    for y in (13, 14, 15):                                          # (the Komnata's corridor wall was another floor's: this floor's paper)
        for nx in range(39, 48):
            door = bool(new[2, y, nx] or new[3, y, nx]) or any(re.match(r"^Drzwi", e["name"]) for e in AT["K"].get(next((o for o, n in cell["K"].items() if n == (nx, y)), (0, 0)), []))
            new[0, y, nx] = src[0, y + 6, 2]
    # ---- the gallery's floor (rows 22..25 -> 16..19), its right end moved in
    for y in range(22, 26):
        for nx in range(0, 47): put("A", nx, y, nx, y - 6, soft=True)
        put("A", 61, y, 47, y - 6, soft=True); put("A", 62, y, 48, y - 6, soft=True)
    for nx in (0, 10, 18, 37, 48): new[:, 21:32, nx] = VOID[:, None]
    new[1, 9:11, 29:38] = 0                                         # (the Blue room: two rugs would grow into one)
    # ---- the Blue room's door: the salonik's door column grafted onto a free column
    busy = {v for kk, v in cell["A"].items() if AT["A"].get(kk)}
    free = [nx for nx in range(30, 37) if not new[2, 11, nx] and not new[3, 11, nx] and (nx, 11) not in busy]
    bx = min(free, key=lambda nx: abs(nx - 33))
    for oy, ny in ((18, 12), (19, 13), (20, 14), (21, 15)): put("A", 46, oy, bx, ny)
    cell["A"][(46, 17)] = (bx, 11)
    # ---- the south part: rows 45..54 -> 32..41
    PLAIN = 8
    def south(ox, nx, soft=True):
        for oy in range(46, 55):
            put("A", ox, oy, nx, oy - 13, soft=soft)
            if ox == PLAIN and nx != PLAIN: new[1:4, oy - 13, nx] = 0; cell["A"].pop((ox, oy), None) if cell["A"].get((ox, oy)) == (nx, oy - 13) else None
    for nx in range(0, 24): south(nx if nx == 0 or nx >= 9 else PLAIN, nx)
    for nx in range(24, 33): south(PLAIN, nx)
    for i in range(3):
        south(1 + i, 5 + i, soft=False); south(25 + i, 29 + i, soft=False)
    south(28, 33)
    new[2:4, 33:36, 23] = 0                                         # (the curtain of the old flight)
    new[1:4, 33:41, 8] = 0                                          # (half a bench, a sliver of a rug beside the new flight)
    for nx in range(11, 18): put("A", nx, 45, nx, 32)               # the hall's way down into the stair hall
    # the balcony: fourteen columns of the terrace, its door from the Wielki salon
    cols = list(range(29, 62))
    linked, score = [], {x: 0.0 for x in cols}
    for y in range(45, 55):
        for x in cols:
            for z in (2, 3):
                a, b = int(src[z, y, x]), int(src[z, y, x + 1]) if x < 61 else 0
                if a and b == a + 1 and a % 8 != 7 and not (164 <= a <= 190): linked.append((x, x + 1))
                if a and not (164 <= a <= 190): score[x] += 1
            for e in AT["A"].get((x, y), []): score[x] += 3
    tc = pick(cols, linked, {29, 61, 50, 51}, score, 14, "balkon")
    report["balkon"] = {"kolumny": [tc]}
    for i, ox in enumerate(tc):
        for oy in range(45, 55): put("A", ox, oy, 34 + i, oy - 13)
    put("A", 62, 45, 48, 32)
    new[:, 41, :] = src[:, 54, 5][:, None]; new[:, 41, 0] = src[:, 54, 0]; new[:, 41, 48] = src[:, 54, 62]
    new[:, 0, :] = VOID[:, None]
    for z in (0, 1): PZ.przelicz_warstwe(new[z], {(x, y) for y in range(NH) for x in range(NW)})

    # ---- the events
    events = [None] * len(old["events"])
    lost = []
    for e in old["events"]:
        if not e: continue
        to = cell["A"].get((e["x"], e["y"]))
        if e["id"] in (159, 160, 161): to = (5 + e["id"] - 159, 34)
        elif e["id"] in (162, 163, 164): to = (29 + e["id"] - 162, 34)
        elif e["name"] == "Napis nad schodami": to = (6, 33) if e["x"] < 20 else (30, 33)
        elif 46 <= e["y"] <= 53 and (e["x"] <= 8 or 24 <= e["x"] <= 28): to = None
        elif e["id"] in (9, 10): to = (bx, 15 if e["id"] == 9 else 12)
        elif e["id"] in (25, 26, 27, 28): to = ((10, 20, 28, 38)[e["id"] - 25], 15)       # the pilasters: under the walls between the rooms
        elif 19 <= e["y"] <= 21 and re.match(r"^(Pilaster|Obraz|Chorągiew)", e["name"]): to = None
        if not to: lost.append((e["id"], e["name"], e["x"], e["y"])); continue
        c = copy.deepcopy(e); c["x"], c["y"] = to; events[e["id"]] = c
    knew = {}
    for e in SRC["K"]["events"]:
        if not e: continue
        to = cell["K"].get((e["x"], e["y"]))
        if not to or e["name"] in ("Obraz", "Wazon z kwiatami"): continue
        c = copy.deepcopy(e); c["id"] = len(events); c["x"], c["y"] = to; events.append(c); knew[e["id"]] = c["id"]
    # the doors: into a room (x, floor's last / first row), out of it (x, the gallery's first / last row)
    for e in events:
        if not e: continue
        for p in e["pages"]:
            for cm in p["list"]:
                if cm["code"] != 201 or cm["parameters"][1] not in (25, 26) or not re.match(r"^(Drzwi|Wejście|Wyjście)", e["name"]): continue
                y = e["y"]
                cm["parameters"][1:4] = [26, e["x"], {15: 11, 12: 16, 20: 24, 23: 19}.get(y, y)]
    # the balustrades of the two flights down
    def page(name):
        return {"conditions": {"actorId": 1, "actorValid": False, "itemId": 1, "itemValid": False, "selfSwitchCh": "A", "selfSwitchValid": False, "switch1Id": 1, "switch1Valid": False,
                               "switch2Id": 1, "switch2Valid": False, "variableId": 1, "variableValid": False, "variableValue": 0},
                "directionFix": True, "image": {"tileId": 0, "characterName": name, "direction": 2, "pattern": 1, "characterIndex": 0}, "list": [{"code": 0, "indent": 0, "parameters": []}],
                "moveFrequency": 3, "moveRoute": {"list": [{"code": 0, "parameters": []}], "repeat": True, "skippable": False, "wait": False}, "moveSpeed": 3, "moveType": 0,
                "priorityType": 1, "stepAnime": False, "through": False, "trigger": 0, "walkAnime": False}
    for x, pic in ((4, "!$1_Balustrada_Lewa"), (8, "!$1_Balustrada_Prawa"), (28, "!$1_Balustrada_Lewa"), (32, "!$1_Balustrada_Prawa")):
        events.append({"id": len(events), "name": "Balustrada schodów", "note": "<Occupy:up=6>", "pages": [page(pic)], "x": x, "y": 39})
    out = copy.deepcopy(old)
    out["width"], out["height"] = NW, NH
    out["data"] = [int(v) for v in new.reshape(-1)]
    out["events"] = events
    return old, lay, out, cell, report, lost, knew, bx


def main():
    old, lay, out, cell, report, lost, knew, bx = build()
    print("nowa mapa %d x %d (było %d x %d); zdarzeń %d, znika %d; drzwi Błękitnego x=%d; Komnata: %s" % (
        NW, NH, old["width"], old["height"], sum(1 for e in out["events"] if e), len(lost), bx, knew))
    for k, r in report.items(): print("  %-8s %s" % (k, r))
    print("  znikają:", sorted({"%s (%d,%d)" % (n, x, y) for _, n, x, y in lost if not n.startswith(("wypelnienie", "Na stole"))}))
    png = next((a for a in sys.argv[1:] if a.lower().endswith(".png")), None)
    if png:
        L.render(L.Mapa(26, raw=out), grid=True).convert("RGB").save(png); print("podgląd:", png)
    if "--wykonaj" not in sys.argv: print("(podgląd - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "tawerna_pietro2_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S")); os.makedirs(bak, exist_ok=True)
    rel = os.path.join(ROOT, "data", "Map026.json"); shutil.copy2(rel, bak); open(rel, "wb").write(RW.json_text(out, lay))
    json.dump({"A": [[k[0], k[1], v[0], v[1]] for k, v in sorted(cell["A"].items())], "K": [[k[0], k[1], v[0], v[1]] for k, v in sorted(cell["K"].items())], "komnata_id": knew},
              open(os.path.join(HERE, "pietro2_pola.json"), "w"))
    print("Zapisano Map026; kopia:", bak)


if __name__ == "__main__":
    main()
