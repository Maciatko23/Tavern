# -*- coding: utf-8 -*-
"""Instalacja porządków w tawernie (edytor zamknięty): staging/data/Map001.json, Map025.json, staging/js/plugins/{RoomLighting,Przytulna,TavernLife}.js -> gra.
Stop, gdy działa edytor albo gdy mapa w data/ ma inną treść niż ta, z której zbudowano staging (zmiana gracza w międzyczasie). Kopie: tools/tavern/porzadki/kopie_zapasowe/<czas>.
  python tools/tavern/porzadki/instaluj.py [--wykonaj]"""
import datetime, json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
PLIKI = ["data/Map001.json", "data/Map025.json", "js/plugins/RoomLighting.js", "js/plugins/Przytulna.js", "js/plugins/TavernLife.js"]


def edytor_otwarty():
    out = subprocess.run(["tasklist"], capture_output=True, text=True, errors="replace").stdout.lower()
    return any(n in out for n in ("rpgmz", "rpg maker", "rmmz"))


def zgodna(mid):
    """to, co różni staging od data/, to tylko zapowiedziane zmiany: poza nimi warstwy i zdarzenia starej mapy są obecne (zmiana gracza by to zepsuła)"""
    a = json.load(open(os.path.join(ROOT, "data", "Map%03d.json" % mid), encoding="utf-8"))
    b = json.load(open(os.path.join(HERE, "staging", "data", "Map%03d.json" % mid), encoding="utf-8"))
    if (a["width"], a["height"], a["tilesetId"]) != (b["width"], b["height"], b["tilesetId"]): return "inny rozmiar lub zestaw"
    W, H = a["width"], a["height"]
    rozne = [i for i, (p, q) in enumerate(zip(a["data"], b["data"])) if p != q]
    ile_ev = sum(1 for e in a["events"] if e), sum(1 for e in b["events"] if e)
    print("Map%03d: kafli innych %d, zdarzeń %d -> %d" % (mid, len(rozne), ile_ev[0], ile_ev[1]))
    for e in a["events"]:
        if not e: continue
        f = b["events"][e["id"]] if e["id"] < len(b["events"]) else None
        if not f or (f["x"], f["y"], f["name"]) != (e["x"], e["y"], e["name"]): return "zdarzenie %d inne" % e["id"]
    return None


def main():
    wykonaj = "--wykonaj" in sys.argv
    if edytor_otwarty(): print("STOP: edytor otwarty"); sys.exit(1)
    for mid in (1, 25):
        z = zgodna(mid)
        if z: print("STOP Map%03d: %s" % (mid, z)); sys.exit(1)
    if not wykonaj: print("(próba: nic nie zapisano)"); return
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    for rel in PLIKI:
        g, s = os.path.join(ROOT, rel), os.path.join(HERE, "staging", rel)
        os.makedirs(os.path.dirname(os.path.join(kop, rel)), exist_ok=True)
        open(os.path.join(kop, rel), "wb").write(open(g, "rb").read())
        open(g, "wb").write(open(s, "rb").read())
        print("zainstalowano", rel)
    print("kopie:", kop)


if __name__ == "__main__":
    main()
