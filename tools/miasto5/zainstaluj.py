# -*- coding: utf-8 -*-
"""Instalacja nowego Kruczogrodu (tools/miasto5/staging) do gry: edytor zamknięty, kopia zapasowa zastępowanych plików do
../Tawerna_archiwum_2026-11-08/miasto5_<czas>/ (z spis.json), potem kopiowanie staging/data, staging/js, staging/tests.
  python tools/miasto5/zainstaluj.py [--wykonaj]      python tools/miasto5/zainstaluj.py --przywroc <folder kopii>"""
import datetime, json, os, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as WS
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
STG = os.path.join(HERE, "staging")
if "--przywroc" in sys.argv:
    src = sys.argv[sys.argv.index("--przywroc") + 1]; spis = json.load(open(os.path.join(src, "spis.json"), encoding="utf-8"))
    WS.need_editor_closed()
    for rel in spis["byly"]: shutil.copy2(os.path.join(src, *rel.split("/")), os.path.join(ROOT, *rel.split("/")))
    for rel in spis["nowe"]: os.remove(os.path.join(ROOT, *rel.split("/")))
    print("przywrócone %d plików, usunięte %d" % (len(spis["byly"]), len(spis["nowe"]))); raise SystemExit(0)
files = []
for top in ("data", "js", "tests"):
    for dp, dn, fn in os.walk(os.path.join(STG, top)):
        for f in fn: files.append(os.path.relpath(os.path.join(dp, f), STG).replace("\\", "/"))
files.sort()
same = [r for r in files if os.path.exists(os.path.join(ROOT, r)) and open(os.path.join(ROOT, r), "rb").read() == open(os.path.join(STG, r), "rb").read()]
todo = [r for r in files if r not in same]
for r in todo: print("instaluje" if os.path.exists(os.path.join(ROOT, r)) else "NOWY     ", r)
print("%d plików do zmiany (%d już takich samych)" % (len(todo), len(same)))
if "--wykonaj" not in sys.argv: print("(próba - nic nie zapisano)"); raise SystemExit(0)
WS.need_editor_closed(); WS.take_lock("miasto5 instalacja")
try:
    bak = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-11-08", "miasto5_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    byly, nowe = [], []
    for r in todo:
        cur = os.path.join(ROOT, *r.split("/"))
        if os.path.exists(cur):
            dst = os.path.join(bak, *r.split("/")); os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy2(cur, dst); byly.append(r)
        else: nowe.append(r)
    os.makedirs(bak, exist_ok=True)
    json.dump({"czas": datetime.datetime.now().isoformat(timespec="seconds"), "byly": byly, "nowe": nowe}, open(os.path.join(bak, "spis.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    for r in todo:
        dst = os.path.join(ROOT, *r.split("/")); os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy2(os.path.join(STG, *r.split("/")), dst)
    print("zainstalowano %d plików; kopia: %s" % (len(todo), bak))
finally:
    WS.drop_lock()
