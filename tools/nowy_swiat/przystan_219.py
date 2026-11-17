# -*- coding: utf-8 -*-
"""Przystań na Słonym Brzegu (Map219), 2026-11-16: rekwizyty wątku Przystani przy molo - prom (stoi po południowej stronie mola
w dni promu) i trzy stany kutra Rocha (wrak na plaży na północ od „Pomyślności”, na brzegu przy wodzie, na wodzie w zatoce).
Zdarzenia skopiowane ze starej przystani (Map125), mapa edytowana na miejscu (tylko dopisane zdarzenia).
  python tools/nowy_swiat/przystan_219.py      (edytor zamknięty)"""
import copy, datetime, importlib.util, os, re, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)
WHERE = {"Prom": (23, 51), "Kuter: wrak na plaży": (12, 32), "Kuter: na pochylni": (20, 30), "Kuter: na wodzie": (12, 27)}

def main():
    RW.need_editor_closed()
    old, _ = RW.read_json("data/Map125.json"); m, lay = RW.read_json("data/Map219.json")
    bak = os.path.join(ARCH, "przystan_219_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S")); os.makedirs(bak, exist_ok=True)
    shutil.copy2(os.path.join(ROOT, "data", "Map219.json"), bak)
    n = 0
    for name, (x, y) in WHERE.items():
        if any(e and e["name"] == name for e in m["events"]): continue
        src = next(e for e in old["events"] if e and e["name"] == name)
        c = copy.deepcopy(src); c["id"] = len(m["events"]); c["x"], c["y"] = x, y; m["events"].append(c); n += 1
    open(os.path.join(ROOT, "data", "Map219.json"), "wb").write(RW.json_text(m, lay))
    sp = os.path.join(ROOT, "data", "System.json"); shutil.copy2(sp, bak); s = open(sp, "rb").read()
    open(sp, "wb").write(re.sub(rb'"versionId":(\d+)', lambda k: b'"versionId":' + str(int(k.group(1)) + 1).encode(), s, count=1))
    print("Map219: dopisane zdarzenia: %d; kopia: %s" % (n, bak))

if __name__ == "__main__": main()
