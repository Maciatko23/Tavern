# -*- coding: utf-8 -*-
"""Po instalacji mniejszego piętra II (tools/tawerna/pietro2.py): przejścia z innych map NA Map026 dostają nowe pola
(schody z piętra I: przed biegi w dół x5-7 i x29-31, rząd 40; reszta z tablicy pietro2_pola.json).
  python tools/tawerna/pietro2_wejscia.py      (edytor zamknięty; kopie w archiwum)"""
import datetime, glob, importlib.util, json, os, re, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

def main():
    RW.need_editor_closed()
    cell = {(a, b): (c, d) for a, b, c, d in json.load(open(os.path.join(HERE, "pietro2_pola.json")))["A"]}
    bak = os.path.join(ARCH, "tawerna_pietro2_wejscia_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S")); os.makedirs(bak, exist_ok=True)
    bad = []
    for f in sorted(glob.glob(os.path.join(ROOT, "data", "Map[0-9][0-9][0-9].json"))):
        n = int(os.path.basename(f)[3:6])
        if n == 26 or b'"code":201' not in open(f, "rb").read(): continue
        m, lay = RW.read_json("data/" + os.path.basename(f)); k = 0
        for e in m["events"]:
            if not e: continue
            for pg in e["pages"]:
                for c in pg["list"]:
                    if not (c["code"] == 201 and c["parameters"][0] == 0 and c["parameters"][1] == 26): continue
                    x, y = c["parameters"][2], c["parameters"][3]
                    if y == 53 and (1 <= x <= 3 or 25 <= x <= 27): to = (x + 4, 40)
                    else: to = cell.get((x, y))
                    if not to: bad.append((n, e["id"], e["name"], x, y)); continue
                    c["parameters"][2:4] = list(to); k += 1
        if k: shutil.copy2(f, bak); open(f, "wb").write(RW.json_text(m, lay)); print("Map%03d: %d" % (n, k))
    print("bez nowego miejsca:", bad)
    sp = os.path.join(ROOT, "data", "System.json"); shutil.copy2(sp, bak); s = open(sp, "rb").read()
    open(sp, "wb").write(re.sub(rb'"versionId":(\d+)', lambda k: b'"versionId":' + str(int(k.group(1)) + 1).encode(), s, count=1))

if __name__ == "__main__": main()
