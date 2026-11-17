# -*- coding: utf-8 -*-
"""Plac Podgrodzia (gracz 2026-11-14: „środek mapy, rzeczy ucięte + niech ten środek będzie bardziej takim miejscem, gdzie się ludzie
spotykają, zrób go ładniej”), na JEGO pliku data/Map218.json:
  1. wózek był ucięty (brakowało górnego rzędu kafli) - cały wózek staje na zachodnim skraju placu, przy drodze;
  2. na zachód od kapliczki kępa trawy z rozłożystym drzewem i dwiema ławami pod nim (kłoda zdjęta);
  3. na wschód od kapliczki tablica ogłoszeń przy latarni (tam zbierają się ludzie: „Miejsce: plac”) i sucha studnia, która
     zniknęła z mapy, choć mieszkańcy dalej do niej chodzili („Miejsce: studnia_sucha” idzie za nią);
  4. kwiaty i kępki trawy wokół.
  python tools/nowy_swiat/plac_podgrodzie.py [--wykonaj]"""
import copy, datetime, importlib.util, json, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

REL = "data/Map218.json"
C = lambda c, r: 256 + (r * 8 + c if c < 8 else 128 + r * 8 + c - 8)
D = lambda c, r: 512 + (r * 8 + c if c < 8 else 128 + r * 8 + c - 8)
GRASS, EARTH = 16, 17
# the grass under the tree (an uneven clump, the old lone patch at 36,39 joins it)
PATCH = ({(x, y) for x in range(37, 43) for y in range(37, 41)} | {(36, 38), (36, 39), (36, 40), (38, 36), (39, 36), (40, 36), (41, 36)}) \
        - {(37, 37), (42, 37), (38, 36)}
TREE = (40, 39)
BENCHES = ((10, 38), (12, 41))          # (sheet column of the 2x2 bench, map x); the planks on row 40, the legs on row 41
NOTICE = (46, 40)                       # foot cell; the board one cell up
WELL = (49, 40)                         # bottom-left cell of the dry well (2 wide, blocks 2x2)
CART = (33, 40)                         # bottom-left cell of the 2x2 cart
FLOWERS = ((37, 38, 12, 9), (42, 38, 12, 10), (36, 39, 14, 11), (41, 37, 13, 10), (37, 40, 14, 11), (45, 39, 12, 9), (48, 41, 14, 11),
           (51, 40, 12, 10), (51, 38, 13, 10), (48, 38, 12, 9))


def main():
    m, lay = RW.read_json(REL)
    W, H, d = m["width"], m["height"], m["data"]
    at = lambda z, x, y: d[(z * H + y) * W + x]
    def put(z, x, y, v): d[(z * H + y) * W + x] = v
    ev_at = lambda x, y: [e for e in m["events"] if e and e["x"] == x and e["y"] == y]
    if not (at(3, 43, 40) == 226 and at(3, 44, 37) == 203): raise SystemExit("STOP: kapliczka nie stoi w (43..44, 37..40) - plac zmieniony, nic nie ruszam")
    if any("Sucha studnia" == e["name"] for e in m["events"] if e): raise SystemExit("STOP: plac już przebudowany")

    def clear(x, y):
        for z in (2, 3): put(z, x, y, 0)
    def need_free(cells, what):
        for (x, y) in cells:
            if ev_at(x, y) or at(5, x, y) in (2, 3) or RW.kind_of(at(0, x, y)) not in (GRASS, EARTH):
                raise SystemExit("STOP: %s - pole (%d,%d) zajęte" % (what, x, y))

    # 1. the cut cart and the log go
    for (x, y) in ((38, 40), (39, 40), (38, 39), (39, 39), (40, 41), (41, 41)): clear(x, y)
    need_free([(CART[0] + i, CART[1] - j) for i in (0, 1) for j in (0, 1)], "wózek")
    for j in (0, 1):
        for i in (0, 1): clear(CART[0] + i, CART[1] - 1 + j); put(2, CART[0] + i, CART[1] - 1 + j, C(10 + i, 6 + j))

    # 2. the grass clump, the tree, two benches
    for (x, y) in PATCH:
        if RW.kind_of(at(0, x, y)) in (GRASS, EARTH) and not at(1, x, y): put(0, x, y, 2048 + GRASS * 48)
    RW.reshape(m, 0, RW.ring(PATCH, 2))
    need_free([TREE], "drzewo")
    src = next(e for e in m["events"] if e and e["pages"][0]["image"]["characterName"] == "!$Big_Trees_scinane")
    tree = copy.deepcopy(src)
    tree.update(id=len(m["events"]), name="Drzewo na placu", note="<Tree:hits=17,sway=0.6,scale=0.85,dropmin=5,dropmax=7>", x=TREE[0], y=TREE[1])
    m["events"].append(tree)
    for (c0, x0) in BENCHES:
        need_free([(x0, 40), (x0 + 1, 40)], "ława")
        for i in (0, 1):
            clear(x0 + i, 40); clear(x0 + i, 41)
            put(2, x0 + i, 40, C(c0 + i, 0)); put(2, x0 + i, 41, C(c0 + i, 1))

    # 3. the notice board by the lamp, the dry well
    need_free([NOTICE], "tablica")
    clear(NOTICE[0], NOTICE[1] - 1)
    put(3, NOTICE[0], NOTICE[1] - 1, C(0, 13)); put(2, NOTICE[0], NOTICE[1], C(0, 14))
    lamp = next(e for e in m["events"] if e and e["name"] == "Latarnia przy kapliczce")
    say = lambda *lines: [{"code": 101, "indent": 0, "parameters": ["", 0, 0, 2, ""]}] + \
        [{"code": 401, "indent": 0, "parameters": [t]} for t in lines] + [{"code": 0, "indent": 0, "parameters": []}]
    def thing(name, x, y, image, note, lines, priority=1):
        e = copy.deepcopy(lamp)
        e.update(id=len(m["events"]), name=name, note=note, x=x, y=y)
        pg = e["pages"][0]
        pg["image"] = image; pg["priorityType"] = priority; pg["list"] = say(*lines)
        m["events"].append(e)
    need_free([(WELL[0] + i, WELL[1] - j) for i in (0, 1) for j in (0, 1)], "studnia")
    thing("Sucha studnia", WELL[0], WELL[1], {"tileId": 0, "characterName": "!Town_Props", "direction": 2, "pattern": 0, "characterIndex": 0},
          "<Occupy:right=1,up=1>", ["Sucha studnia. Na dnie tylko kamienie i kurz.", "Wodę nosi się z miasta, i to za opłatą."])
    thing("Tablica ogłoszeń", NOTICE[0], NOTICE[1], {"tileId": 0, "characterName": "", "direction": 2, "pattern": 0, "characterIndex": 0}, "",
          ["Tablica ogłoszeń Podgrodzia. Kartki wyblakłe od słońca.", "„Kto ma wodę na zbyciu, niech pyta o Teodora”."])
    spot = next(e for e in m["events"] if e and e["name"] == "Miejsce: studnia_sucha")
    spot["x"], spot["y"] = WELL[0], WELL[1] + 1
    spot["pages"][0]["image"]["direction"] = 8

    # 4. flowers and tufts (D sheet), only on free ground
    n = 0
    for (x, y, c, r) in FLOWERS:
        if at(2, x, y) or at(3, x, y) or ev_at(x, y) or at(5, x, y) == 2: continue
        put(2, x, y, D(c, r)); n += 1
    # nothing gathered grows among the furniture
    for (x, y) in PATCH | {(x, y) for x in range(45, 52) for y in range(38, 42)}:
        if at(5, x, y) == 0: put(5, x, y, 7)
    print("Plac: wózek cały w (%d..%d, %d..%d), drzewo %s, 2 ławy, tablica %s, sucha studnia %s, %d kęp kwiatów; zdarzeń %d"
          % (CART[0], CART[0] + 1, CART[1] - 1, CART[1], TREE, NOTICE, WELL, n, len(m["events"]) - 1))
    raw = RW.json_text(m, lay)
    if "--podglad" in sys.argv:
        open(sys.argv[sys.argv.index("--podglad") + 1], "wb").write(raw); return
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "plac_podgrodzie_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    shutil.copy2(os.path.join(ROOT, REL), bak)
    open(os.path.join(ROOT, REL), "wb").write(raw)
    # saves keep the old event layout otherwise
    sp = os.path.join(ROOT, "data", "System.json")
    s = open(sp, "rb").read()
    import re
    s2 = re.sub(rb'"versionId":(\d+)', lambda k: b'"versionId":' + str(int(k.group(1)) + 1).encode(), s, count=1)
    shutil.copy2(sp, bak); open(sp, "wb").write(s2)
    print("Zapisano; kopie: %s" % bak)


if __name__ == "__main__":
    main()
