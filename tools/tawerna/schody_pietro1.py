# -*- coding: utf-8 -*-
"""Klatki schodowe piętra I (Map025), poprawki gracza 2026-11-16: „schody muszą wyglądać tak, że wiadomo, które idą w dół, a które
w górę; pomiędzy schodami jakieś barierki ładne; złota brama tylko na szerokość schodów, nie wchodzi na ściany”.
Edycja NA MIEJSCU (gracz poprawia mapę ręcznie - niczego poza klatkami nie rusza):
  - bieg w dół (x1-3, x25-27): u góry ciemność (czarny rząd) i trzy rzędy stopni w cieniu - schodzi w mrok;
  - bieg w górę (x5-7, x29-31): stopnie jasne aż do góry, bez czerni;
  - między biegami (x4, x28) zamiast kawałka ściany: ciemna szczelina z drewnianą poręczą po obu stronach (kafle B 172/174/180/182);
    za biegiem w górę (x8, x32) poręcz od strony schodów, dalej ściana i podłoga korytarza;
  - złota krata: obrazek !$Tavern_Props_Upper_Gate3 (3 kratki szerokości), <Occupy:left=1,right=1>.
  python tools/tawerna/schody_pietro1.py [--wykonaj]      (zapis tylko przy zamkniętym edytorze; kopia w archiwum)"""
import datetime, importlib.util, os, re, shutil, sys
import numpy as np
from PIL import Image

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

BLACK, STEP = 1536, 1553
POST = 26                                     # the gate's golden post in the old picture (px)
RAIL_L, RAIL_R, TOP_L, TOP_R = 180, 182, 172, 174
WELLS = [(1, 4, 5, 8), (25, 28, 29, 32)]      # down flight's first x, the gap, up flight's first x, the cell after it


def gate_picture():
    """the gate three cells wide: every frame of the sheet (3 x 4 of 240 x 192) made 144 wide"""
    src = Image.open(os.path.join(ROOT, "img", "characters", "!$Tavern_Props_Upper_Gate.png")).convert("RGBA")
    fw, fh = src.width // 3, src.height // 4
    nw = 144; nh = int(round(fh * nw / (fw - 2 * POST) / 4.0)) * 4
    out = Image.new("RGBA", (nw * 3, nh * 4), (0, 0, 0, 0))
    for r in range(4):
        for c in range(3):
            # (the user: "bez tych złotych słupków z kulką na górze" - only the leaves: the two outer posts, 26 px each, cut off)
            f = src.crop((c * fw + POST, r * fh, (c + 1) * fw - POST, (r + 1) * fh)).resize((nw, nh), Image.LANCZOS)
            a = f.split()[3].point(lambda v: 255 if v >= 128 else 0)
            f.putalpha(a)
            out.paste(f, (c * nw, r * nh))
    return out


def main():
    m, lay = RW.read_json("data/Map025.json"); W, H = m["width"], m["height"]
    d = np.array(m["data"], dtype=np.int64).reshape(6, H, W)
    for (dn, gap, up, end) in WELLS:
        for x in range(dn, dn + 3):                       # down: into the dark
            d[0, 33, x] = BLACK
            for y in range(34, 40): d[0, y, x] = STEP
            for y in (34, 35, 36): d[4, y, x] = 15
            for y in (37, 38, 39): d[4, y, x] = 0
        for x in range(up, up + 3):                       # up: light all the way
            for y in range(33, 40): d[0, y, x] = STEP; d[4, y, x] = 0
        for y in range(33, 40):                           # the gap with a handrail on each side
            d[0, y, gap] = BLACK; d[1, y, gap] = 0
            d[2, y, gap] = TOP_L if y == 33 else 188 if y == 39 else RAIL_L      # (row 39: the balustrade's end facing the corridor -
            d[3, y, gap] = TOP_R if y == 33 else 190 if y == 39 else RAIL_R      #  its two posts and the balusters between them)
            d[4, y, gap] = 0
        for y in range(33, 40):                                          # after the up flight: the hall's wall and floor again,
            d[:, y, end] = d[:, y, end + 1]                              # the flight's balustrade along its whole side on it
            d[2, y, end] = 188 if y == 39 else RAIL_L; d[3, y, end] = 0
        # the outer side of the down flight (the user: "boczna krawędź schodów niech też ma taką balustradę"): west - on the map's
        # border; east - the old wall stub between the hall and the flight becomes a gap with a rail on each side, like the middle one
        side = dn - 1
        for y in range(33, 40):
            if side == 0:
                d[3, y, side] = 0 if y == 33 else RAIL_R
            else:
                d[0, y, side] = BLACK; d[1, y, side] = 0; d[4, y, side] = 0
                d[2, y, side] = TOP_L if y == 33 else 188 if y == 39 else RAIL_L
                d[3, y, side] = TOP_R if y == 33 else 190 if y == 39 else RAIL_R
    ring = {(x, y) for y in range(31, 42) for x in list(range(0, 11)) + list(range(23, 35)) if 0 <= x < W}
    for z in (0, 1): PZ.przelicz_warstwe(d[z], ring)
    m["data"] = [int(v) for v in d.reshape(-1)]
    gates = [e for e in m["events"] if e and "Złota krata" in e["name"]]
    for e in gates:
        e["note"] = re.sub(r"<Occupy:[^>]*>", "<Occupy:left=1,right=1>", e["note"])
        for p in e["pages"]:
            if p["image"]["characterName"].startswith("!$Tavern_Props_Upper_Gate"): p["image"]["characterName"] = "!$Tavern_Props_Upper_Gate3"
    print("klatek: %d, krat: %d %s" % (len(WELLS), len(gates), [(e["x"], e["y"]) for e in gates]))
    png = next((a for a in sys.argv[1:] if a.lower().endswith(".png")), None)
    pic = gate_picture()
    if png:
        img = L.render(L.Mapa(25, raw=m), region=(0, 31, 34, 41)).convert("RGBA")
        g = pic.crop((0, 0, 144, pic.height // 4))
        for e in gates: img.alpha_composite(g, ((e["x"] - 1) * 48, (e["y"] + 1 - 31) * 48 - g.height))
        img.convert("RGB").save(png); print("podgląd:", png)
    if "--wykonaj" not in sys.argv: print("(podgląd - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "tawerna_schody_pietro1_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S")); os.makedirs(bak, exist_ok=True)
    rel = os.path.join(ROOT, "data", "Map025.json"); shutil.copy2(rel, bak); open(rel, "wb").write(RW.json_text(m, lay))
    pic.save(os.path.join(ROOT, "img", "characters", "!$Tavern_Props_Upper_Gate3.png"))
    sp = os.path.join(ROOT, "data", "System.json"); shutil.copy2(sp, bak); s = open(sp, "rb").read()
    open(sp, "wb").write(re.sub(rb'"versionId":(\d+)', lambda k: b'"versionId":' + str(int(k.group(1)) + 1).encode(), s, count=1))
    print("Zapisano; kopia:", bak)


if __name__ == "__main__":
    main()
