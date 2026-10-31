# -*- coding: utf-8 -*-
"""Instalacja ETAPU 4 swiata (mapa wyspy w grze): MapaWyspy_Data.js (nowy swiat) i MapaWyspy.js (obsluga ASPEKT, lab, BRZEGI, KORYTO, LAS; stare dane dzialaja).
  python tools/swiat/etap4/install.py --dry-run     (domyslnie; nic nie zapisuje, pokazuje co by zrobil)
  python tools/swiat/etap4/install.py --wykonaj     (tylko po zgodzie gracza)
Sprawdza sumy sha256 obecnych js/plugins/MapaWyspy_Data.js i MapaWyspy.js (staging/sumy.json, zapisane przy generowaniu): zmienione od tego czasu = STOP
(zbuduj kopie od nowa: python tools/mapy/swiat_mapa_wyspy.py ; python tools/swiat/etap4/patch_js.py).
Kopie zapasowe: tools/swiat/etap4/kopie_zapasowe/<czas>/js/plugins/. Zapisuje tylko te dwa pliki (kolejnosc wtyczek bez zmian: Data nad MapaWyspy)."""
import os, sys, json, hashlib, shutil, datetime, subprocess
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
STG = os.path.join(HERE, "staging", "js", "plugins")
PLIKI = ["MapaWyspy_Data.js", "MapaWyspy.js"]
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
def sha(p): return hashlib.sha256(open(p, "rb").read()).hexdigest()

def main():
    wykonaj = "--wykonaj" in sys.argv and "--dry-run" not in sys.argv
    sumy = json.load(open(os.path.join(HERE, "staging", "sumy.json")))
    zle = []
    for f in PLIKI:
        cur = os.path.join(ROOT, "js", "plugins", f); src = os.path.join(STG, f)
        if not os.path.exists(src): zle.append("brak kopii " + src); continue
        ok = sha(cur) == sumy.get(f)
        print("%s: obecny plik %s zapisanemu skrotowi; staging %d B (obecny %d B)" % (f, "ZGADZA SIE z" if ok else "ROZNI SIE od", os.path.getsize(src), os.path.getsize(cur)))
        if not ok: zle.append("js/plugins/%s zmieniony od wygenerowania kopii - wygeneruj od nowa" % f)
        r = subprocess.run(["node", "-e", "new Function(require('fs').readFileSync(process.argv[1],'utf8'))", src], capture_output=True, text=True)
        if r.returncode: zle.append("skladnia %s: %s" % (f, r.stderr.strip()[:200]))
    wt = open(os.path.join(ROOT, "js", "tawerna_wtyczki.js"), encoding="utf-8").read()
    if "MapaWyspy_Data" not in wt or wt.index("MapaWyspy_Data") > wt.index('"MapaWyspy"'): zle.append("lista wtyczek: MapaWyspy_Data musi stac nad MapaWyspy")
    if zle:
        print("\nSTOP:"); [print(" -", z) for z in zle]; sys.exit(1)
    print("\nZapisze: js/plugins/MapaWyspy_Data.js, js/plugins/MapaWyspy.js (kopie zapasowe w tools/swiat/etap4/kopie_zapasowe/)")
    if not wykonaj:
        print("(dry-run: nic nie zapisano; dodaj --wykonaj po zgodzie gracza)"); return
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S"), "js", "plugins")
    os.makedirs(kop, exist_ok=True)
    for f in PLIKI:
        shutil.copy2(os.path.join(ROOT, "js", "plugins", f), kop)
        shutil.copy2(os.path.join(STG, f), os.path.join(ROOT, "js", "plugins", f))
        print("zapisano js/plugins/" + f)
    print("kopie zapasowe:", kop)

if __name__ == "__main__":
    main()
