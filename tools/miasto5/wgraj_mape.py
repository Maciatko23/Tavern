# -*- coding: utf-8 -*-
"""Tylko mapa miasta z kopii roboczej (tools/miasto5/staging/data/Map008.json) do gry - po poprawkach samej mapy (2026-11-09: kominy,
beczki). Edytor zamknięty; mapa w grze może się różnić od kopii tylko zdarzeniami drzew (tools/drzewa) - inaczej STOP (ktoś ją zmienił
w edytorze). Kopia do ../Tawerna_archiwum_2026-11-08/miasto5_mapa_<czas>/, potem drzewa na nowo: tools/drzewa/drzewa.py --mapy 8.
  python tools/miasto5/wgraj_mape.py [--wykonaj]"""
import datetime, json, os, shutil, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as WS
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
GAME, STG = os.path.join(ROOT, "data", "Map008.json"), os.path.join(HERE, "staging", "data", "Map008.json")
OLD_STG = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-11-08", "przenosiny_20261109_181801", "data", "Map008.json")
g, s = json.load(open(GAME, encoding="utf-8")), json.load(open(STG, encoding="utf-8"))
# what we installed last time: the map just before tools/drzewa turned its trees choppable (tools/drzewa/kopie_zapasowe/<newest>);
# the game's map may differ from it only in the trees' events - anything else = an edit in the editor: STOP
import glob
refs = sorted(glob.glob(os.path.join(ROOT, "tools", "drzewa", "kopie_zapasowe", "*", "Map008.json")))
ref = json.load(open(refs[-1], encoding="utf-8")) if refs else s
same_tiles = g["data"] == ref["data"]
evd = [i for i in range(max(len(g["events"]), len(ref["events"]))) if (g["events"][i] if i < len(g["events"]) else None) != (ref["events"][i] if i < len(ref["events"]) else None)]
odd = [i for i in evd if not (i < len(g["events"]) and g["events"][i] and "<Tree" in (g["events"][i].get("note") or ""))]
print("od ostatniego wgrania (%s): kafle %s, zdarzenia inne niż drzewa: %s" % (os.path.basename(os.path.dirname(refs[-1])) if refs else "-", "bez zmian" if same_tiles else "ZMIENIONE", odd[:10] or "brak"))
print("nowa kopia robocza: %d różnic kafli" % sum(1 for a, c in zip(g["data"], s["data"]) if a != c))
if not same_tiles or odd: raise SystemExit("STOP: mapę zmieniono w edytorze od ostatniego wgrania - najpierw przenieść zmiany do build5.py")
if "--wykonaj" not in sys.argv: print("(próba)"); raise SystemExit(0)
WS.need_editor_closed(); WS.take_lock("miasto5 mapa")
try:
    bak = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-11-08", "miasto5_mapa_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True); shutil.copy2(GAME, bak); shutil.copy2(STG, GAME)
    print("wgrane (kopia: %s)" % bak)
finally:
    WS.drop_lock()
r = subprocess.run([sys.executable, os.path.join(ROOT, "tools", "drzewa", "drzewa.py"), "--mapy", "8", "--wykonaj"], capture_output=True, text=True, encoding="utf-8")
print("\n".join(l for l in r.stdout.splitlines() if "map do zmiany" in l or "zapisane" in l))
