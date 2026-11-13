# -*- coding: utf-8 -*-
"""Instalator Tawerny 2 (przebudowa wnetrza karczmy). Zamknij edytor RPG Maker MZ. Bez --wykonaj tylko pokazuje, co by zrobil.
  python tools/tawerna2/zainstaluj.py [--wykonaj]
Kolejnosc przygotowania stagingu:  python tools/tawerna2/zbuduj.py   (mapy + przepiecia wtyczek + plan)
Warunki wstepne: pliki gry musza byc takie, jak w chwili budowy (data/Map001|008|009|025|026.json = migawka tools/tawerna2/old/, wtyczki/teksty = SHA w
staging/SHA_przepiecia.json); inaczej STOP (ktos zmienil plik - zbuduj staging od nowa). Kopia wszystkiego, co nadpisze:
../Tawerna_archiwum_2026-11-08/tawerna2_<czas>/ (te same sciezki + spis.json). Blokada zapisow tools/rozszerzenia/.blokada."""
import os, sys, json, shutil, datetime, hashlib
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as W
DO = "--wykonaj" in sys.argv
STG = os.path.join(HERE, "staging")
def sha(p): return hashlib.sha1(open(p, "rb").read()).hexdigest() if os.path.exists(p) else "-"

pairs = []
for base in ("data", "js", "img", "tests"):
    for d, _, fs in os.walk(os.path.join(STG, base)):
        for f in sorted(fs):
            src = os.path.join(d, f)
            pairs.append((src, os.path.relpath(src, STG).replace(os.sep, "/")))
if not pairs: raise SystemExit("STOP: pusty staging - najpierw python tools/tawerna2/zbuduj.py")
W.need_editor_closed()
bad = []
shad = json.load(open(os.path.join(STG, "SHA_data.json"), encoding="utf-8")) if os.path.exists(os.path.join(STG, "SHA_data.json")) else {}
shaw = json.load(open(os.path.join(STG, "SHA_przepiecia.json"), encoding="utf-8")) if os.path.exists(os.path.join(STG, "SHA_przepiecia.json")) else {}
for src, rel in pairs:
    cur = os.path.join(ROOT, *rel.split("/"))
    if rel in shad:
        if sha(cur) != shad[rel]: bad.append(rel + ": zmienil sie od zbudowania stagingu (nowe miasto / edytor?) - uruchom zbuduj.py od nowa")
    elif rel.startswith("data/Map"):
        snap = os.path.join(HERE, "old", os.path.basename(rel))
        if os.path.exists(snap) and os.path.exists(cur) and sha(cur) != sha(snap): bad.append(rel + ": zmienil sie od migawki tools/tawerna2/old (edytor?)")
    elif rel in shaw and sha(cur) != shaw[rel]: bad.append(rel + ": zmienil sie od zbudowania stagingu")
if bad:
    for b in bad: print("STOP:", b)
    raise SystemExit("Nic nie zainstalowano.")
change = [(s, r) for s, r in pairs if sha(s) != sha(os.path.join(ROOT, *r.split("/")))]
for s, r in pairs: print(("instaluje  " if DO else "zmienilby  " if (s, r) in change else "juz jest   ") + r)
if not DO: raise SystemExit("(proba - nic nie zapisano; --wykonaj instaluje %d plikow)" % len(change))
W.take_lock("tawerna2")
try:
    arch = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-11-08", "tawerna2_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    byly, nowe = [], []
    for s, r in change:
        cur = os.path.join(ROOT, *r.split("/"))
        if os.path.exists(cur):
            b = os.path.join(arch, *r.split("/")); os.makedirs(os.path.dirname(b), exist_ok=True); shutil.copy2(cur, b); byly.append(r)
        else: nowe.append(r)
    os.makedirs(arch, exist_ok=True)
    json.dump({"byly": byly, "nowe": nowe}, open(os.path.join(arch, "spis.json"), "w"), indent=1)
    for s, r in change:
        cur = os.path.join(ROOT, *r.split("/")); os.makedirs(os.path.dirname(cur), exist_ok=True)
        shutil.copy2(s, cur)
        if sha(cur) != sha(s): raise SystemExit("STOP: zapis %s nie zgadza sie" % r)
    print("zainstalowano %d plikow; kopia: %s" % (len(change), arch))
finally:
    W.drop_lock()
