# -*- coding: utf-8 -*-
"""Podgrodzie (Map218, plik gracza), 2026-11-13 - gracz zakreślił dwie brzydkie rzeczy na północnym wschodzie:
  1. ruina szopy Wróbli (pół dachu z kafli E stojące krzywo, dziurawa ściana, graty) -> porządna, opuszczona szopa z kafli autora
     (ten sam kreator chat co reszta: dach z desek nad ścianą z ciemnych desek, bez okien i bez komina, drzwi zaparte od środka -
     kryjówka dzieciaków), na tym samym miejscu (66..70 x 11..15, drzwi 68,15 - przed nimi „Miejsce: wroble_szopa”);
  2. martwe drzewo z kafli E: pod pniem doklejony drugi, osobny kawałek korzeni (E 2,8) -> usunięty, blokuje podstawa pnia.
  python tools/nowy_swiat/szopa_wroble.py [--wykonaj]   (zapis TYLKO przy zamkniętym edytorze; kopia w archiwum)"""
import datetime, importlib.util, os, shutil, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
sys.path.insert(0, HERE)
import wspolne as WS                                                     # noqa: E402
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

X, Y, WID = 66, 11, 5
BOX = (64, 9, 74, 18)                     # the ruin and its clutter
DOOR_TEXT = "Drzwi zaparte od środka. Słychać szepty i stłumiony chichot."
GRASS = 2816


def scratch(with_hut):
    tmp = tempfile.mkdtemp(prefix="szopa_")
    WS.configure(218, tmp)
    b = WS.WorldBuild(218, "tmp", "")
    b.chimney = lambda *a, **k: None                                      # (an abandoned shed: no chimney, no smoke)
    b.mp.kind(0, b.mp.all, WS.GRASS)
    if with_hut:
        b.hut(dict(k="wroble", n="Szopa Wróbli", x=X, y=Y, w=WID, roof="planks", wall="dark_boards", door=2, win=[], ch=0, cs=3, di=2))
    path, data, events, meta = b.write()
    m = __import__("json").load(open(path, encoding="utf-8"))
    shutil.rmtree(tmp, ignore_errors=True)
    return m


def main():
    blank, hut = scratch(False), scratch(True)
    m, lay = RW.read_json("data/Map218.json")
    at = lambda o, z, x, y: o["data"][(z * 80 + y) * 80 + x]
    def put(o, z, x, y, v): o["data"][(z * 80 + y) * 80 + x] = v
    x0, y0, x1, y1 = BOX
    n_clear = 0
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            if 896 <= at(m, 3, x, y) <= 935: put(m, 3, x, y, 0); n_clear += 1                 # (the half roof of E pieces)
            if at(m, 2, x, y): put(m, 2, x, y, 0); n_clear += 1                                 # (boards, beam, wheel, sticks)
            if 4352 <= at(m, 0, x, y) < 8192: put(m, 0, x, y, GRASS); n_clear += 1              # (the wall of dark boards)
            if at(m, 5, x, y) == 2: put(m, 5, x, y, 0)
    RW.reshape(m, 0, RW.ring({(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)}, 1))
    # the shed: every cell the hut changed on the blank scratch map
    n_hut = 0
    for y in range(Y - 2, Y + 7):
        for x in range(X - 2, X + WID + 2):
            for z in (0, 1, 2, 3, 5):
                if at(hut, z, x, y) != at(blank, z, x, y):
                    put(m, z, x, y, at(hut, z, x, y)); n_hut += 1
    for y in range(Y - 1, Y + 5):                                         # (the user's grass tufts in layer 1 would sit on the roof and walls)
        for x in range(X, X + WID):
            if at(hut, 0, x, y) != at(blank, 0, x, y) or at(hut, 3, x, y) != at(blank, 3, x, y): put(m, 1, x, y, 0)
    door = next(e for e in hut["events"] if e and e["name"].startswith("Drzwi"))
    # a trodden way from the door down to the earth patch below it (A2 17, as the village's paths)
    way = {(door["x"], door["y"] + 1), (door["x"], door["y"] + 2), (door["x"] - 1, door["y"] + 2)}
    for (x, y) in way: put(m, 0, x, y, 2048 + 17 * 48); put(m, 1, x, y, 0)
    RW.reshape(m, 0, RW.ring(way, 1))
    for i, e in enumerate(m["events"]):
        if e and e["name"].startswith("Drzwi: Szopa"): m["events"][i] = None
    for c in door["pages"][0]["list"]:
        if c["code"] == 355 and "Tawerna.popup(" in c["parameters"][0]:
            head, rest = c["parameters"][0].split("Tawerna.popup(", 1)
            c["parameters"][0] = head + 'Tawerna.popup("' + DOOR_TEXT + '", ' + rest.split('", ', 1)[1]
    door["name"] = "Drzwi: Szopa Wróbli"; door["note"] = "<Town:door=wroble>"
    nid = max(e["id"] for e in m["events"] if e) + 1
    while len(m["events"]) <= nid: m["events"].append(None)
    door["id"] = nid; m["events"][nid] = door
    # the dead tree: the separate root piece under the trunk (E 2,8 = 834) away; the trunk's foot blocks
    for y in range(8, 20):
        for x in range(56, 66):
            if at(m, 3, x, y) == 834 and at(m, 3, x, y - 1) == 826:
                put(m, 3, x, y, 0); put(m, 5, x, y, 0); put(m, 5, x, y - 1, 2)
                print("  martwe drzewo: korzenie spod pnia usunięte (%d,%d)" % (x, y))
    print("  ruina: wyczyszczone %d kafli; szopa: %d kafli; drzwi (%d,%d) -> zdarzenie %d" % (n_clear, n_hut, door["x"], door["y"], nid))
    for a in sys.argv:
        if a.startswith("--podglad="):                                   # (a preview copy of the map, for a render; data/ untouched)
            open(a.split("=", 1)[1], "wb").write(RW.json_text(m, lay)); print("  podgląd: " + a.split("=", 1)[1])
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "szopa_wroble_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    shutil.copy2(os.path.join(ROOT, "data", "Map218.json"), bak)
    open(os.path.join(ROOT, "data", "Map218.json"), "wb").write(RW.json_text(m, lay))
    print("Zapisano; kopia: " + bak)


if __name__ == "__main__":
    main()
