# -*- coding: utf-8 -*-
"""Instalacja razem: poprawki miasta i sąsiadów (tools/miasto5/staging) + działka i dom dziadka na środku z płotkami
(tools/przenosiny/staging, wygrywa przy tych samych plikach) + usunięcie starych zapisów (gracz 2026-11-09: „usuń stare zapisy”):
pliki zapisów gry (save/file*.rmmzsave, global.rmmzsave; config zostaje) i zapisy kopii do grania (IndexedDB przeglądarki dla
127.0.0.1:8770) PRZENIESIONE do archiwum, nie skasowane. Warunki: edytor zamknięty, mapy w data/ takie jak przy budowie kopii
(stan.json), przeglądarka kopii do grania zamknięta.
  python tools/przenosiny/zainstaluj.py [--wykonaj]        python tools/przenosiny/zainstaluj.py --zapisz-stan   (po przebudowie kopii)
Potem: python tools/drzewa/drzewa.py --mapy 3,4,8,20,24,111 --wykonaj; obrazki mapy wyspy; kopia do grania."""
import datetime, hashlib, json, os, shutil, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as WS
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
STAGES = [os.path.join(ROOT, "tools", "miasto5", "staging"), os.path.join(HERE, "staging")]     # (later wins)
WATCH = ["data/Map%03d.json" % i for i in (2, 3, 4, 8, 19, 20, 24, 111)]
STAN = os.path.join(HERE, "stan.json")
sha = lambda p: hashlib.sha1(open(os.path.join(ROOT, p), "rb").read()).hexdigest()
if "--zapisz-stan" in sys.argv:
    json.dump({p: sha(p) for p in WATCH}, open(STAN, "w"), indent=1); print("stan zapisany"); raise SystemExit(0)
files = {}
for st in STAGES:
    for top in ("data", "js", "tests"):
        for dp, dn, fn in os.walk(os.path.join(st, top)):
            for f in fn:
                rel = os.path.relpath(os.path.join(dp, f), st).replace("\\", "/"); files[rel] = os.path.join(dp, f)
todo = sorted(r for r, src in files.items() if not os.path.exists(os.path.join(ROOT, r)) or open(os.path.join(ROOT, r), "rb").read() != open(src, "rb").read())
stan = json.load(open(STAN))
changed = [p for p in WATCH if sha(p) != stan[p]]
SAVE = os.path.join(ROOT, "save")
saves = [f for f in (os.listdir(SAVE) if os.path.isdir(SAVE) else []) if f.endswith(".rmmzsave") and f != "config.rmmzsave"]
IDB = os.path.join(os.path.expanduser("~"), "AppData", "Local", "TawernaTest", "edge_profile", "Default", "IndexedDB", "http_127.0.0.1_8770.indexeddb.leveldb")
for r in todo: print("instaluje", r)
print("%d plików; zapisy gry do archiwum: %s; zapisy kopii do grania: %s" % (len(todo), saves, os.path.isdir(IDB)))
if changed: print("STOP: od budowy kopii zmieniono w edytorze: %s - przebuduj kopie na tej wersji" % changed)
if "--wykonaj" not in sys.argv or changed: print("(nic nie zapisano)"); raise SystemExit(0 if not changed else 1)
WS.need_editor_closed()
edge = subprocess.run(["powershell", "-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='msedge.exe'\" | Where-Object { $_.CommandLine -match 'TawernaTest' } | Measure-Object | Select-Object -ExpandProperty Count"], capture_output=True, text=True).stdout.strip()
if edge not in ("", "0"): raise SystemExit("STOP: kopia do grania (Edge) jest otwarta - zamknij ją. Nic nie zmieniono.")
WS.take_lock("przenosiny instalacja")
try:
    bak = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-11-08", "przenosiny_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    byly, nowe = [], []
    for r in todo:
        cur = os.path.join(ROOT, *r.split("/"))
        if os.path.exists(cur):
            d = os.path.join(bak, *r.split("/")); os.makedirs(os.path.dirname(d), exist_ok=True); shutil.copy2(cur, d); byly.append(r)
        else: nowe.append(r)
    for r in todo:
        d = os.path.join(ROOT, *r.split("/")); os.makedirs(os.path.dirname(d), exist_ok=True); shutil.copy2(files[r], d)
    zap = os.path.join(bak, "_zapisy_gry"); os.makedirs(zap, exist_ok=True)
    for f in saves: shutil.move(os.path.join(SAVE, f), os.path.join(zap, f))
    if os.path.isdir(IDB): shutil.move(IDB, os.path.join(bak, "_zapisy_kopii_do_grania_" + os.path.basename(IDB)))
    json.dump({"czas": datetime.datetime.now().isoformat(timespec="seconds"), "byly": byly, "nowe": nowe, "zapisy": saves},
              open(os.path.join(bak, "spis.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    print("zainstalowano %d plików, zapisy przeniesione; kopia: %s" % (len(todo), bak))
finally:
    WS.drop_lock()
