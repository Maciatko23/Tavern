# -*- coding: utf-8 -*-
"""Łowy w dolinie, etap 1 (gracz 2026-11-13: „Łowy po całej dolinie”, plan docs/NOWY_SWIAT/lowy/): zwierzyna każdej mapy w notatce mapy
(Hunting.js: <Hunt:rabbit=..,deer=..,boar=..,wolf=..> = ile najwyżej naraz; <Bear:p> = szansa niedźwiedzia na godzinę). Krucze Turnie
i Dwór nad Jazem miały już notatki z budowy map - tu podniesione do planu (nic nie maleje), Podgrodzie i Słony Brzeg dostają swoje.
  python tools/nowy_swiat/lowy_zwierzeta.py [--wykonaj]"""
import datetime, importlib.util, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

PLAN = {222: ({"rabbit": 3, "deer": 2, "boar": 2, "wolf": 4}, 0.15),
        221: ({"rabbit": 3, "deer": 3, "boar": 1}, None),
        218: ({"rabbit": 4, "wolf": 2}, None),
        219: ({"rabbit": 2}, None)}
ORDER = ("rabbit", "deer", "boar", "wolf")


def main():
    out = []
    for mid, (want, bear) in PLAN.items():
        rel = "data/Map%d.json" % mid
        m, lay = RW.read_json(rel)
        note = m["note"] or ""
        old = re.search(r"<Hunt:([^>]*)>", note)
        have = dict((k.strip(), int(v)) for k, v in (p.split("=") for p in old.group(1).split(",") if "=" in p)) if old else {}
        new = {k: max(have.get(k, 0), want.get(k, 0)) for k in ORDER if max(have.get(k, 0), want.get(k, 0)) > 0}
        tag = "<Hunt:%s>" % ",".join("%s=%d" % (k, new[k]) for k in ORDER if k in new)
        note2 = note.replace(old.group(0), tag) if old else note.rstrip("\n") + "\n" + tag
        if bear is not None:
            ob = re.search(r"<Bear:([^>]*)>", note2)
            if not ob: note2 += "\n<Bear:%g>" % bear
        print("  Map%d: %s -> %s%s" % (mid, old.group(0) if old else "(brak)", tag, "" if bear is None else "  " + re.search(r"<Bear:[^>]*>", note2).group(0)))
        if note2 != note:
            m["note"] = note2; out.append((rel, m, lay))
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "lowy_zwierzeta_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    for rel, m, lay in out:
        shutil.copy2(os.path.join(ROOT, rel), bak)
        open(os.path.join(ROOT, rel), "wb").write(RW.json_text(m, lay))
    print("Zapisano %d map; kopie: %s" % (len(out), bak))


if __name__ == "__main__":
    main()
