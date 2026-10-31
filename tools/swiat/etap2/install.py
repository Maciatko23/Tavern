# -*- coding: utf-8 -*-
"""Instalacja ETAPU 2 swiata (prawe skrzydlo), partia 1: kopiuje mapy ze stagingu do data/ i wlacza Swiat_Data.
  python tools/swiat/etap2/install.py --dry-run     (domyslnie; nic nie zapisuje, pokazuje co by zrobil)
  python tools/swiat/etap2/install.py --wykonaj     (tylko po zgodzie gracza i przy ZAMKNIETYM edytorze RPG Makera)
Sprawdza sumy sha256 obecnych plikow data/ (zapisane przy budowie kopii: staging/sumy.json) - zmienione przez gracza = STOP.
Kopie zapasowe: tools/swiat/etap2/kopie_zapasowe/<czas>/ (data/*.json, js/plugins/Swiat_Data.js).
Zapisuje: data/Map008, 013, 021, 022, 111, 125 .json; NOWE data/Map914, 917, 920, 922, 923 .json + data/MapInfos.json (5 wpisow); js/plugins/Swiat_Data.js
(enabled=true); zmiany w Orzel_Data.js i MapaWyspy_Data.js (patche.py: dosłowne zamiany tekstu); wpis Swiat_Data na liscie
wtyczek (js/tawerna_wtyczki.js) jest juz dodany. Obraz img/characters/!$North_Gate_A.png jest nowym plikiem (juz w img/)."""
import os, sys, json, hashlib, shutil, datetime
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
STG = os.path.join(HERE, "staging")
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia")); sys.path.insert(0, HERE); sys.path.insert(1, os.path.join(ROOT, "tools", "swiat", "etap1"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

MAPY = [3, 17, 18, 20, 21, 22, 23, 24]          # istniejace mapy (sha sprawdzane)
NOWE = [900, 901]            # nowe mapy (plik nie moze jeszcze istniec) + wpisy w MapInfos.json
def sha(p): return hashlib.sha256(open(p, "rb").read()).hexdigest()

def main():
    wykonaj = "--wykonaj" in sys.argv and "--dry-run" not in sys.argv
    sumy = json.load(open(os.path.join(STG, "sumy.json")))
    zle = []
    for m in MAPY:
        cur = os.path.join(ROOT, "data", "Map%03d.json" % m)
        src = os.path.join(STG, "data", "Map%03d.json" % m)
        if not os.path.exists(src): zle.append("brak kopii %s" % src); continue
        ok = sha(cur) == sumy[str(m)]
        print("Map%03d: obecny plik %s zapisanemu skrotowi; kopia %d B" % (m, "ZGADZA SIE z" if ok else "ROZNI SIE od", os.path.getsize(src)))
        if not ok: zle.append("data/Map%03d.json zmieniony od zbudowania kopii (gracz?) - zbuduj kopie od nowa: python tools/swiat/etap1/zbuduj.py" % m)
    cur = os.path.join(ROOT, "data", "MapInfos.json")
    ok = sha(cur) == sumy["MapInfos"]
    print("MapInfos: obecny plik %s zapisanemu skrotowi" % ("ZGADZA SIE z" if ok else "ROZNI SIE od"))
    if not ok: zle.append("data/MapInfos.json zmieniony od zbudowania kopii - zbuduj kopie od nowa")
    for m in NOWE:
        if os.path.exists(os.path.join(ROOT, "data", "Map%03d.json" % m)): zle.append("data/Map%03d.json juz istnieje (nowa mapa nie moze nadpisac)" % m)
        if not os.path.exists(os.path.join(STG, "data", "Map%03d.json" % m)): zle.append("brak kopii nowej mapy %d" % m)
    import patche2 as patche
    for (rel, old, new) in patche.PATCHE:
        _, t = patche.czytaj(rel)
        st = patche.zastosuj(patche.lf(t), old, new)[1]
        print("patch %s: %s (%s)" % (rel, st, old[:40]))
        if st == "brak": zle.append("%s: nie ma tekstu do zamiany: %s" % (rel, old[:60]))
    plug = os.path.join(STG, "js", "plugins", "Swiat_Data.js")
    if not os.path.exists(plug) or b"enabled: true" not in open(plug, "rb").read(): zle.append("staging/js/plugins/Swiat_Data.js bez enabled: true (python tools/mapy/swiat_do_gry.py --wlacz --out ...)")
    if zle:
        print("\nSTOP:"); [print(" -", z) for z in zle]; sys.exit(1)
    print("\nZapisze: " + ", ".join("data/Map%03d.json" % m for m in MAPY + NOWE) + ", data/MapInfos.json, js/plugins/Swiat_Data.js (enabled: true), " + ", ".join(sorted({p[0] for p in patche.PATCHE})))
    if not wykonaj:
        print("(dry-run: nic nie zapisano; dodaj --wykonaj po zgodzie gracza, z zamknietym edytorem)"); return
    import wspolne as W
    W.need_editor_closed()
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(os.path.join(kop, "data"), exist_ok=True); os.makedirs(os.path.join(kop, "js"), exist_ok=True)
    for m in MAPY: shutil.copy2(os.path.join(ROOT, "data", "Map%03d.json" % m), os.path.join(kop, "data"))
    shutil.copy2(cur, os.path.join(kop, "data"))
    shutil.copy2(os.path.join(ROOT, "js", "plugins", "Swiat_Data.js"), os.path.join(kop, "js"))
    for rel in sorted({p[0] for p in patche.PATCHE}):
        os.makedirs(os.path.join(kop, os.path.dirname(rel)), exist_ok=True); shutil.copy2(os.path.join(ROOT, rel), os.path.join(kop, rel))
    for m in MAPY + NOWE: shutil.copyfile(os.path.join(STG, "data", "Map%03d.json" % m), os.path.join(ROOT, "data", "Map%03d.json" % m))
    shutil.copyfile(os.path.join(STG, "data", "MapInfos.json"), cur)
    for rel in sorted({p[0] for p in patche.PATCHE}):
        raw, t = patche.czytaj(rel); crlf = patche.ma_crlf(raw); t = patche.lf(t)
        for (f, old, new) in patche.PATCHE:
            if f == rel: t = patche.zastosuj(t, old, new)[0]
        open(os.path.join(ROOT, rel), "wb").write((patche.crlf(t) if crlf else t).encode("utf-8"))
    shutil.copyfile(plug, os.path.join(ROOT, "js", "plugins", "Swiat_Data.js"))
    print("zainstalowano; kopie zapasowe:", kop)

main()
