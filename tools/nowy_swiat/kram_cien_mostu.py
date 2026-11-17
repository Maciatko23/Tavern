# -*- coding: utf-8 -*-
"""Podgrodzie i Miasteczko, 2026-11-13 (gracz: „zobacz, co jest jeszcze nieładne i nierówne, i popraw; mosty”):
  1. Map218: kram starzyzny - zamiast gołej markizy z kafli E (płaski beżowy prostokąt na słupkach, 66..67 x 35..38) prawdziwy stragan
     z garnkami (rekwizyt „stall_purple” jak na rynkach, z napisem), w tym samym miejscu przed chatą kramarza;
  2. mosty nad suchym korytem (Map218 x2, Map220 x1): cień mostu na dnie koryta po wschodniej stronie pomostu (warstwa cieni, lewa
     połowa kratki) - pomost wygląda na zawieszony nad korytem, nie położony na nim.
  python tools/nowy_swiat/kram_cien_mostu.py [--wykonaj] [--podglad=<plik Map218>]"""
import datetime, importlib.util, json, os, shutil, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
sys.path.insert(0, HERE)
import wspolne as WS                                                     # noqa: E402
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

STALL = ("stall_purple", 66, 38, "Kram starzyzny", ["Garnki, stare narzędzia, coś z wraku. Kramarz nie pyta, skąd.", "Na razie nikogo przy kramie."])
SHADOW = {}   # (2026-11-13: the hard tile shadow was replaced by Mosty.js's soft one under the bridge picture - not added any more)


def scratch(with_stall):
    tmp = tempfile.mkdtemp(prefix="kram_")
    WS.configure(218, tmp)
    b = WS.WorldBuild(218, "tmp", "")
    b.mp.kind(0, b.mp.all, WS.GRASS)
    if with_stall:
        name, x, y, label, lines = STALL
        cmds = [{"code": 101, "indent": 0, "parameters": ["", 0, 0, 2, ""]}] + [{"code": 401, "indent": 0, "parameters": [l]} for l in lines]
        b.prop(name, x, y, label=label, cmds=cmds)
    path = b.write()[0]
    m = json.load(open(path, encoding="utf-8"))
    shutil.rmtree(tmp, ignore_errors=True)
    return m


def main():
    out = []
    at = lambda o, z, x, y: o["data"][(z * o["height"] + y) * o["width"] + x]
    def put(o, z, x, y, v): o["data"][(z * o["height"] + y) * o["width"] + x] = v
    p, lp = RW.read_json("data/Map218.json")
    # 1. the stall
    n = 0
    for y in range(35, 39):
        for x in (66, 67):
            for z in (2, 3):
                if 812 <= at(p, z, x, y) <= 837: put(p, z, x, y, 0); n += 1
    blank, st = scratch(False), scratch(True)
    k = 0
    for y in range(30, 42):
        for x in range(60, 72):
            for z in (1, 2, 3, 5):
                if at(st, z, x, y) != at(blank, z, x, y): put(p, z, x, y, at(st, z, x, y)); k += 1
    have = {e["name"] for e in p["events"] if e}
    for e in st["events"]:
        if not e or e["name"] in have: continue
        nid = max(v["id"] for v in p["events"] if v) + 1
        while len(p["events"]) <= nid: p["events"].append(None)
        e["id"] = nid; p["events"][nid] = e
        print("  stragan: zdarzenie %d „%s” (%d,%d)" % (nid, e["name"], e["x"], e["y"]))
    print("  Map218: markiza zdjęta (%d kafli), stragan %d kafli" % (n, k))
    # 2. the bridges' shadows
    maps = {218: (p, lp)}
    t, lt = RW.read_json("data/Map220.json"); maps[220] = (t, lt)
    for mid, cols in SHADOW.items():
        o = maps[mid][0]
        for (x, y0, y1) in cols:
            for y in range(y0, y1 + 1): put(o, 4, x, y, at(o, 4, x, y) | 5)
        print("  Map%d: cień mostu %s" % (mid, cols))
    for a in sys.argv:
        if a.startswith("--podglad="): open(a.split("=", 1)[1], "wb").write(RW.json_text(p, lp)); print("  podgląd: " + a.split("=", 1)[1])
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "kram_cien_mostu_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    for mid, (o, lay) in maps.items():
        rel = "data/Map%03d.json" % mid
        shutil.copy2(os.path.join(ROOT, rel), bak)
        open(os.path.join(ROOT, rel), "wb").write(RW.json_text(o, lay))
    print("Zapisano; kopie: " + bak)


if __name__ == "__main__":
    main()
