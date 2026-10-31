# -*- coding: utf-8 -*-
"""Mala instalacja poprawki po etapie 3: przejscia wstawiane w czasie gry zgodne ze swiatem (patche_fix.py: Wyspa_Data.LINKS, Homes.js, teksty).
  python tools/swiat/etap3/install_fix.py --dry-run   (domyslnie)      python tools/swiat/etap3/install_fix.py --wykonaj  (po zgodzie)
Sprawdza, ze zamiany pasuja do OBECNYCH plikow (stan 'brak' = STOP, 'juz' = pominiete), robi kopie zapasowe w kopie_zapasowe_fix/<czas>/."""
import os, sys, shutil, datetime, json, hashlib
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, HERE)
import patche_fix as P
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

MAPY = [13, 21, 22, 120, 157, 159]
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()

def main():
    wykonaj = "--wykonaj" in sys.argv and "--dry-run" not in sys.argv
    zle = []
    sumy = json.load(open(os.path.join(HERE, 'staging_fix', 'sumy.json')))
    for m in MAPY:
        cur = os.path.join(ROOT, 'data', 'Map%03d.json' % m)
        ok = sha(cur) == sumy[str(m)]
        print('Map%03d: obecny plik %s zapisanemu skrotowi' % (m, 'ZGADZA SIE z' if ok else 'ROZNI SIE od'))
        if not ok: zle.append('data/Map%03d.json zmieniony od zbudowania kopii - zbuduj od nowa: python tools/swiat/etap3/zbuduj_fix.py' % m)
    for (rel, old, new) in P.PATCHE:
        _, t = P.czytaj(rel)
        st = P.zastosuj(P.lf(t), old, new)[1]
        print("patch %s: %s (%s)" % (rel, st, old[:44].strip()))
        if st == "brak": zle.append("%s: nie ma tekstu do zamiany: %s" % (rel, old[:60]))
    if zle:
        print("\nSTOP:"); [print(" -", z) for z in zle]; sys.exit(1)
    pliki = sorted({p[0] for p in P.PATCHE})
    print("\nZapisze: " + ", ".join("data/Map%03d.json" % m for m in MAPY) + ", " + ", ".join(pliki))
    if not wykonaj: print("(dry-run: nic nie zapisano)"); return
    kop = os.path.join(HERE, "kopie_zapasowe_fix", datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(os.path.join(kop, 'data'), exist_ok=True)
    for m in MAPY:
        shutil.copy2(os.path.join(ROOT, 'data', 'Map%03d.json' % m), os.path.join(kop, 'data'))
        shutil.copyfile(os.path.join(HERE, 'staging_fix', 'data', 'Map%03d.json' % m), os.path.join(ROOT, 'data', 'Map%03d.json' % m))
    for rel in pliki:
        os.makedirs(os.path.join(kop, os.path.dirname(rel)), exist_ok=True); shutil.copy2(os.path.join(ROOT, rel), os.path.join(kop, rel))
        raw, t = P.czytaj(rel); t = P.lf(t)
        for (f, old, new) in P.PATCHE:
            if f == rel: t = P.zastosuj(t, old, new)[0]
        open(os.path.join(ROOT, rel), "wb").write((P.crlf(t) if P.ma_crlf(raw) else t).encode("utf-8"))
    print("zainstalowano; kopie zapasowe:", kop)
main()
