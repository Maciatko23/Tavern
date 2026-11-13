# -*- coding: utf-8 -*-
"""Krok 2: zaokraglenie plam gruntu na 8 mapach planszy (Map008 robi build5.py). Czyta data/, zapisuje tylko tools/poprawki_krok2/staging/data/.
   python tools/poprawki_krok2/popraw2.py [id ...]"""
import json, os, sys, time
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
os.chdir(ROOT); sys.path.insert(0, HERE)
import zaokraglij as Z
WS = Z.WS
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
OUT = os.path.join(HERE, "staging", "data"); os.makedirs(OUT, exist_ok=True)
OCHRONA = {3: [(40, 32, 79, 61)]}      # dzialka dziadka: pole, plot i margines
IDS = [162, 24, 13, 111, 4, 125, 3, 20]

def main(ids):
    for mid in ids:
        t0 = time.time()
        m = json.load(open("data/Map%03d.json" % mid, encoding="utf-8"))
        m.pop("id", None)
        r = Z.zaokraglij(m, mid, ochrona=OCHRONA.get(mid, ()), log=print if "-v" in sys.argv else None)
        open(os.path.join(OUT, "Map%03d.json" % mid), "wb").write(WS.map_text(m).encode("utf-8"))
        json.dump(r["komorki"], open(os.path.join(HERE, "staging", "zmiany_%03d.json" % mid), "w"))
        print("Map%03d: zmienione %d kratek, klastrow %d, naruszen zostalo %d (%.0fs)" % (mid, r["zmienione"], r["klastry"], r["zostalo"], time.time() - t0))

if __name__ == "__main__":
    main([int(a) for a in sys.argv[1:] if a.isdigit()] or IDS)
