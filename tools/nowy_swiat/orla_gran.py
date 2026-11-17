# -*- coding: utf-8 -*-
"""Orla Grań (Map030) - najwyższe piętro gór, gniazdo białego orła (gracz 2026-11-16: „potem się zrobi nową mapę Orla Grań”,
„mapa Orla Grań z orłem ma być wysoko w górach”). 80 x 80, zestaw kafli gór (11). Z gotowych kawałków:
  - rdzeń: zachodnia część starej Orlej Grani (Map175, kolumny 0..79 - skalne tarasy z gniazdem, miską, płytą, obozowiskiem
    łowców i klatką; jej „Miejsce: orzel_*” idą razem, wątek orła znajduje je po nazwach);
  - skalna ściana od północy: pas z Kruczych Turni (Map222); od południa i z boków lita skała - grań jest wyspą skały.
Wejście TYLKO wspinaczką z Kruczej Grani (Map029, lina na północnej ścianie przy 66,7 - zdarzenia wątku orła, Orzel_Data.WAY_UP);
zejście skalnym kominem (dawny szyb, 19..21,40) z powrotem pod linę. Poprawia też dwa otwarte skrawki przy krawędziach Map029.
  python tools/nowy_swiat/orla_gran.py <podglad.png>             (tylko obraz)
  python tools/nowy_swiat/orla_gran.py <podglad.png> --wykonaj   (Map030, MapInfos, łatka Map029; edytor zamknięty)"""
import copy, datetime, importlib.util, json, os, random, re, shutil, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
import mapylib as L
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

ID, NW, NH, DY = 30, 80, 80, 10             # the old ridge's rows go 10 rows lower (under the north wall)
ROCK = [1608, 1609, 1610, 1616, 1617, 1618]
WATER = range(1630, 1640)                    # the old ridge's sea tiles (A5) - no water this high


def build():
    stara, lay = RW.read_json("data/Map175.json"); gory, _ = RW.read_json("data/Map222.json")
    assert stara["tilesetId"] == gory["tilesetId"] == 11
    s = np.array(stara["data"], dtype=np.int64).reshape(6, stara["height"], stara["width"])
    g = np.array(gory["data"], dtype=np.int64).reshape(6, gory["height"], gory["width"])
    rnd = random.Random(3011)
    new = np.zeros((6, NH, NW), dtype=np.int64)
    for y in range(NH):
        for x in range(NW): new[0, y, x] = rnd.choice(ROCK)
    new[:, DY:DY + 60, :] = s[:, 0:60, 0:NW]
    new[:, 0:DY, :] = g[:, 2:12, 0:NW]
    for y in range(0, DY):                                          # (the mountains' pond and waterfall came with the wall: plain wall instead)
        for x in range(56, NW): new[:, y, x] = new[:, y, x - 44]
    new[:, 3:8, 0:9] = 0                                            # (the mountains' western bay in the wall: rock)
    for y in range(3, 8):
        for x in range(0, 9): new[0, y, x] = rnd.choice(ROCK)
    new[:, 8:DY, :] = 0                                             # (the wall's grassy foot: rock here - the ridge has no meadow)
    for y in range(8, DY):
        for x in range(NW): new[0, y, x] = rnd.choice(ROCK)
    for y in range(DY, DY + 60):                                    # no sea up here; the sides shut with rock
        for x in range(NW):
            if int(new[0, y, x]) in WATER or x < 2 or x >= NW - 2:
                new[:, y, x] = 0; new[0, y, x] = rnd.choice(ROCK)
    events = [None]
    for e in stara["events"]:
        if not e or e["x"] >= NW - 2 or e["x"] < 2 or "<Zapora:krawedz>" in (e.get("note") or ""): continue
        c = copy.deepcopy(e); c["id"] = len(events); c["y"] = e["y"] + DY
        if c["name"] == "Szyb do kopalni": c["name"] = "Skalny komin (zejście na Kruczą Grań)"
        events.append(c)
    out = copy.deepcopy(stara)
    out.update({"width": NW, "height": NH, "displayName": "Orla Grań", "data": [int(v) for v in new.reshape(-1)], "events": events,
                "autoplayBgs": True, "bgs": {"name": "Wind1", "pan": 0, "pitch": 100, "volume": 45},
                "note": "<Clouds:on>\n<Hunt:off>\n<Bear:off>\n<Camp:off>\n<Farm:off>\n<Build:off>\n<Poziom:6>\n<Orzel:gran>"})
    return out, lay


def main():
    out, lay = build()
    png = next((a for a in sys.argv[1:] if a.lower().endswith(".png")), None)
    if png: L.render(L.Mapa(ID, raw=out)).convert("RGB").save(png); print("podgląd:", png, "zdarzeń:", len(out["events"]) - 1)
    places = {e["name"]: (e["x"], e["y"]) for e in out["events"] if e and e["name"].startswith(("Miejsce:", "Skalny"))}
    print(places)
    if "--wykonaj" not in sys.argv: print("(podgląd - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    dst = os.path.join(ROOT, "data", "Map%03d.json" % ID)
    if os.path.exists(dst): raise SystemExit("Map%03d już jest - nie nadpisuję (gracz mógł ją poprawiać)." % ID)
    bak = os.path.join(ARCH, "orla_gran_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S")); os.makedirs(bak, exist_ok=True)
    open(dst, "wb").write(RW.json_text(out, lay))
    # Krucza Grań: the two strips of grass at the wall's foot that ran to the map's edges - rock
    m29, l29 = RW.read_json("data/Map029.json"); shutil.copy2(os.path.join(ROOT, "data", "Map029.json"), bak)
    W, H = m29["width"], m29["height"]; rnd = random.Random(29)
    for y in (8, 9):
        for x in (0, 1, 2, W - 3, W - 2, W - 1):
            for z in range(6): m29["data"][z * W * H + y * W + x] = 0
            m29["data"][y * W + x] = rnd.choice(ROCK)
    open(os.path.join(ROOT, "data", "Map029.json"), "wb").write(RW.json_text(m29, l29))
    mi, mlay = RW.read_json("data/MapInfos.json"); shutil.copy2(os.path.join(ROOT, "data", "MapInfos.json"), bak)
    order = next(m["order"] for m in mi if m and m["id"] == 29) + 1
    for m in mi:
        if m and m["order"] >= order: m["order"] += 1
    while len(mi) <= ID: mi.append(None)
    mi[ID] = {"id": ID, "expanded": False, "name": "Orla Grań", "order": order, "parentId": 29, "scrollX": 0, "scrollY": 0}
    open(os.path.join(ROOT, "data", "MapInfos.json"), "wb").write(RW.json_text(mi, mlay))
    sp = os.path.join(ROOT, "data", "System.json"); shutil.copy2(sp, bak); s = open(sp, "rb").read()
    open(sp, "wb").write(re.sub(rb'"versionId":(\d+)', lambda k: b'"versionId":' + str(int(k.group(1)) + 1).encode(), s, count=1))
    print("Zapisano Map%03d; kopia: %s" % (ID, bak))


if __name__ == "__main__":
    main()
