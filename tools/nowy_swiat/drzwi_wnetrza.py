# -*- coding: utf-8 -*-
"""Drzwi nowego świata otwarte (gracz 2026-11-15: „co się da, to ładnie przenosimy na nowe mapy”): gotowe wnętrza starego miasta,
starego Podgrodzia, Przystani i dworu dostają drzwi na nowych mapach (218-221). Dla każdej pary z tabeli PARY:
  - drzwi na nowej mapie (zdarzenie z <Town:door=klucz>) biorą polecenia starych drzwi tego wnętrza (godziny otwarcia, skrzypnięcie,
    otwieranie, przejście do środka) - swój obrazek i miejsce zostawiają; gdy stare drzwi nie miały klucza: proste przejście;
  - wyjścia wnętrza, które prowadziły na starą mapę, prowadzą na pole przed nowymi drzwiami.
Stare mapy zostają na dysku nietknięte (nic się nie kasuje), ale ich wnętrza od teraz należą do nowego świata.
  python tools/nowy_swiat/drzwi_wnetrza.py [--wykonaj]      (zapis tylko przy zamkniętym edytorze; kopie w archiwum)"""
import copy, datetime, importlib.util, json, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

OLD_OUT = {8, 111, 125, 24, 162, 3, 20, 13, 4}
# (new map, new door key) -> (interior map, old outdoor map, old door key or None)
PARY = [
    # Kruczogród
    (220, "tawerna", 1, 8, "Drzwi tawerny -> Tawerna"), (220, "ratusz", 104, 8, "ratusz"), (220, "kantor", 103, 8, "kantor"),
    (220, "piekarnia", 102, 8, "piekarnia"), (220, "kaplica", 178, 8, "kaplica"), (220, "dzwonnica", 108, 8, "dzwonnica"),
    (220, "grabarz", 179, 8, "dom_grabarza"), (220, "stajnia", 181, 8, "stajnia"), (220, "kuznia", 105, 8, None),
    (220, "dom3", 184, 8, "dom3"), (220, "dom4", 185, 8, "dom4"), (220, "dom7", 188, 8, "dom7"), (220, "dom8", 189, 8, "dom8"),
    (220, "ciesla", 187, 8, "dom6"), (220, "cech1", 215, 8, "cech"), (220, "walenty", 186, 8, "dom5"), (220, "budka", 190, 8, "dom9"),
    # Podgrodzie
    (218, "praczka", 112, 111, "praczka"), (218, "drwal", 113, 111, "drwal"), (218, "klusownik", 114, 111, "klusownik"),
    (218, "znachorka", 115, 111, "znachorka"), (218, "kramarz", 116, 111, "szmaciarz"), (218, "przytulek", 202, 111, "przytulek"),
    (218, "garncarz", 203, 111, "garncarnia"), (218, "rodzina", 204, 111, "lepianka1"), (218, "wdowa", 205, 111, "lepianka2"),
    (218, "weglarz", 206, 111, "chata3"), (218, "tkaczka", 207, 111, "chata4"), (218, "rybaczka", 208, 111, "chata5"),
    (218, "wodziarz", 209, 111, "strzecha"), (218, "mlynarz", 210, 111, "deski"), (218, "wroble", 211, 111, "szopa"),
    (218, "wiatrak", 217, 8, "wiatrak"), (218, "kuba", 107, 8, None), (218, "garbarz", 106, 8, None),
    # Słony Brzeg
    (219, "jan", 126, 125, "janek"), (219, "hanna", 127, 125, "szopa"),
    # Dwór nad Jazem
    (221, "dwor", 172, 24, None), (221, "wartownia", 180, 8, "straznica"),
]


def cmd(code, *params, indent=0): return {"code": code, "indent": indent, "parameters": list(params)}


def main():
    maps = {}
    def M(n):
        if n not in maps: maps[n] = list(RW.read_json("data/Map%03d.json" % n)) + [False]
        return maps[n][0]
    def touch(n): maps[n][2] = True
    key_of = lambda e: (re.search(r"<Town:door=([^>]+)>", e.get("note") or "") or [None, None])[1]
    done, skipped = [], []
    for (nm, nkey, inner, om, okey) in PARY:
        new = M(nm)
        d = next((e for e in new["events"] if e and key_of(e) == nkey), None)
        if not d: skipped.append("%d:%s (brak drzwi na nowej mapie)" % (nm, nkey)); continue
        if any(c["code"] == 201 for p in d["pages"] for c in p["list"]): skipped.append("%d:%s (już otwarte)" % (nm, nkey)); continue
        room = M(inner)
        exits = [e for e in room["events"] if e and any(c["code"] == 201 and c["parameters"][0] == 0 and c["parameters"][1] in OLD_OUT for p in e["pages"] for c in p["list"])]
        if not exits: skipped.append("%d:%s (wnętrze %d nie ma wyjścia na starą mapę)" % (nm, nkey, inner)); continue
        # the old door's commands
        old = M(om)
        o = next((e for e in old["events"] if e and (key_of(e) == okey or e["name"] == okey) and any(c["code"] == 201 and c["parameters"][1] == inner for p in e["pages"] for c in p["list"])), None) if okey else None
        img = copy.deepcopy(d["pages"][0]["image"])
        if o:
            pages = copy.deepcopy(o["pages"])
            for p in pages: p["image"] = copy.deepcopy(img); p["priorityType"] = d["pages"][0]["priorityType"]
            d["pages"] = pages
        else:
            # the way in: the cell above the room's (first) exit, facing up
            ex = min(exits, key=lambda e: (-e["y"], e["x"]))
            d["pages"][0]["list"] = [cmd(250, {"name": "Door1", "volume": 80, "pitch": 100, "pan": 0}), cmd(201, 0, inner, ex["x"], ex["y"] - 1, 8, 0), cmd(0)]
            d["pages"][0]["trigger"] = 1
        touch(nm)
        # the room's ways out: before the new door
        fx, fy = d["x"], d["y"] + 1
        for e in exits:
            for p in e["pages"]:
                for c in p["list"]:
                    if c["code"] == 201 and c["parameters"][0] == 0 and c["parameters"][1] in OLD_OUT:
                        c["parameters"][1:5] = [nm, fx, fy, 2]
        touch(inner)
        done.append("%d:%s -> Map%03d %s (%s), wyjść %d" % (nm, nkey, inner, room.get("displayName") or "", "polecenia starych drzwi" if o else "proste przejście", len(exits)))
    for t in done: print("  +", t)
    for t in skipped: print("  -", t)
    print("Otwartych drzwi: %d, pominiętych: %d" % (len(done), len(skipped)))
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "drzwi_wnetrza_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    n = 0
    for mid, (m, lay, changed) in maps.items():
        if not changed: continue
        rel = os.path.join(ROOT, "data", "Map%03d.json" % mid)
        shutil.copy2(rel, bak); open(rel, "wb").write(RW.json_text(m, lay)); n += 1
    sp = os.path.join(ROOT, "data", "System.json"); shutil.copy2(sp, bak)
    s = open(sp, "rb").read()
    open(sp, "wb").write(re.sub(rb'"versionId":(\d+)', lambda k: b'"versionId":' + str(int(k.group(1)) + 1).encode(), s, count=1))
    print("Zapisano %d map; kopie: %s" % (n, bak))


if __name__ == "__main__":
    main()
