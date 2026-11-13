# -*- coding: utf-8 -*-
"""Instalacja kopalni ze stagingu (tools/kopalnia/staging) do gry - DOPIERO po zatwierdzeniu obrazków i próbnego przejazdu.
  python tools/kopalnia/instaluj.py             podgląd: co zostanie wpisane, czy pliki wejściowe się nie zmieniły
  python tools/kopalnia/instaluj.py --wykonaj   zapis (edytor RPG Makera ZAMKNIĘTY; kopie zapasowe do archiwum, kopie nowych plików nie nadpisują niczego)
Zmieniane pliki: data/Map013.json, Map175.json, MapInfos.json, Tilesets.json, js/plugins/Orzel_Data.js, Orzel.js, js/tawerna_wtyczki.js
(każdy tylko, gdy od zbudowania stagingu nie zmienił się - SHA.json; zmienił się: uruchom zbuduj.py od nowa, ew. z --z <staging poprzedniego>).
Nowe pliki: data/Map213.json, js/plugins/Kopalnia.js, img/characters/!$Kopalnia_*.png, img/tilesets/Kopalnia/Kopalnia_E.png (istniejącego nie ruszam)."""
import os, sys, json, hashlib
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
STG = os.path.join(HERE, "staging")
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as W
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

CHANGED = ["data/Map013.json", "data/Map175.json", "data/MapInfos.json", "data/Tilesets.json", "js/plugins/Orzel_Data.js", "js/plugins/Orzel.js", "js/tawerna_wtyczki.js"]


def walk_new():
    out = ["data/Map213.json", "js/plugins/Kopalnia.js"]
    for base in ("img/characters", "img/tilesets/Kopalnia"):
        for f in sorted(os.listdir(os.path.join(STG, *base.split("/")))): out.append(base + "/" + f)
    return out


def main():
    wykonaj = "--wykonaj" in sys.argv
    sha = json.load(open(os.path.join(STG, "SHA.json"), encoding="utf-8"))
    stop = False
    for rel in CHANGED:
        cur = W.sha1(os.path.join(ROOT, *rel.split("/")))
        ok = cur == sha["inputs"][rel] or W.sha1(os.path.join(STG, *rel.split("/"))) == cur
        print("%-34s %s" % (rel, "ok" if ok else "ZMIENIONY od zbudowania stagingu (inna sesja?)"))
        stop |= not ok
    new = walk_new()
    for rel in new:
        dst = os.path.join(ROOT, *rel.split("/"))
        same = os.path.exists(dst) and open(dst, "rb").read() == open(os.path.join(STG, *rel.split("/")), "rb").read()
        if os.path.exists(dst) and not same and rel.startswith("img/"):
            print("STOP: %s już istnieje i jest inny - obrazy tylko nowe" % rel); stop = True
        print("%-34s %s" % (rel, "jest taki sam" if same else "nowy" if not os.path.exists(dst) else "podmiana (z kopią)"))
    if stop: sys.exit("STOP - nic nie zapisano")
    if not wykonaj: print("\npodgląd - nic nie zapisano (--wykonaj zapisuje)"); return
    W.need_editor_closed()
    W.take_lock("kopalnia")
    try:
        for rel in CHANGED + new:
            dst = os.path.join(ROOT, *rel.split("/"))
            data = open(os.path.join(STG, *rel.split("/")), "rb").read()
            if os.path.exists(dst):
                if open(dst, "rb").read() == data: continue
                W.archive(rel, "kopalnia")
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            open(dst, "wb").write(data)
            print("zapisano", rel)
    finally:
        W.drop_lock()


if __name__ == "__main__":
    main()
