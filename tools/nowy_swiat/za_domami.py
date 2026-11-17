# -*- coding: utf-8 -*-
"""Za domami (gracz 2026-11-13: „jeśli chodzi o domki, to gracz powinien móc iść za nimi dwie kratki od góry”): na mapach nowego świata
dwa górne rzędy każdego dachu (A3, dach - nie ściana) dostają region 3 (RegionLayers.js: „nad graczem” - dach rysuje się nad bohaterem,
a pole jest przechodnie). Bohater przechodzi za chatą górnymi dwoma rzędami dachu, dach go zasłania; dolny rząd dachu i ściany dalej
blokują. Tylko kolumny, w których dach ma co najmniej 3 rzędy (przybudówki i daszki zostają); regionów innych niż 0 / 2 / 31 nie rusza (2 = dach zablokowany przez kreator chat).
  python tools/nowy_swiat/za_domami.py [--mapy 218,220] [--wykonaj]"""
import datetime, importlib.util, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

A3, A4 = 4352, 5888
# the roof kinds: the A3 roof rows (48-55, 64-71) and the ones the hut stamps use as roofs from the other rows (plib ROOF: thatch 59,
# slate 60; the manor's roof 56); never the wall kinds (plib WALL: 57, 72-75)
ROOF_KINDS = (set(range(48, 56)) | set(range(64, 72)) | {56, 59, 60}) - {57, 72, 73, 74, 75}
def roof(t): return A3 <= t < A4 and (t - 2048) // 48 in ROOF_KINDS


def main():
    mids = [218, 219, 220, 221, 222]
    for i, a in enumerate(sys.argv):
        if a == "--mapy": mids = [int(v) for v in sys.argv[i + 1].split(",")]
    out = []
    for mid in mids:
        rel = "data/Map%03d.json" % mid
        m, lay = RW.read_json(rel)
        W, H = m["width"], m["height"]
        at = lambda z, x, y: m["data"][(z * H + y) * W + x]
        n = 0
        for x in range(W):
            y = 0
            while y < H:
                if not roof(at(0, x, y)): y += 1; continue
                y0 = y
                while y < H and roof(at(0, x, y)): y += 1
                if y - y0 >= 3:
                    for yy in (y0, y0 + 1):
                        if at(5, x, yy) in (0, 2, 31): m["data"][(5 * H + yy) * W + x] = 3; n += 1
        print("Map%d: %d pól dachu przechodnich (za domami)" % (mid, n))
        if n: out.append((rel, RW.json_text(m, lay)))
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "za_domami_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    for (rel, raw) in out:
        shutil.copy2(os.path.join(ROOT, rel), bak)
        open(os.path.join(ROOT, rel), "wb").write(raw)
    print("Zapisano %d map; kopie: %s" % (len(out), bak))


if __name__ == "__main__":
    main()
