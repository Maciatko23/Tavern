# -*- coding: utf-8 -*-
"""Instalacja SZWÓW ŚWIATA (runda 2): kopiuje zmienione mapy ze stagingu (tools/swiat/szwy2/staging/data) do data/.
  python tools/swiat/szwy2/install.py --dry-run        (domyślnie; nic nie zapisuje)
  python tools/swiat/szwy2/install.py --wykonaj        (tylko po zgodzie gracza i przy ZAMKNIĘTYM edytorze RPG Makera)
  --bez-gracza                                        (pomija mapy gracza: 1, 3, 4, 8, 13, 23, 24, 25, 26, 111)
Sprawdza sha256 obecnych plików (staging/sumy.json): zmienione od zbudowania kopii = STOP (zbuduj od nowa: python tools/swiat/szwy2/zbuduj.py).
Kopie zapasowe: tools/swiat/szwy2/kopie_zapasowe/<czas>/data/. Zapisuje tylko data/Map*.json (kontrakt krawędzi, Swiat_Data i Krawedzie.js bez zmian)."""
import os, sys, json, hashlib, shutil, datetime
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
STG = os.path.join(HERE, "staging")
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
PL = {1, 3, 4, 8, 13, 23, 24, 25, 26, 111}
def sha(p): return hashlib.sha256(open(p, "rb").read()).hexdigest()

def main():
    wykonaj = "--wykonaj" in sys.argv and "--dry-run" not in sys.argv
    bez = "--bez-gracza" in sys.argv
    zm = json.load(open(os.path.join(STG, "zmienione.json")))
    sumy = json.load(open(os.path.join(STG, "sumy.json")))
    mapy = [m for m in zm["zmienione"] if not (bez and m in PL)]
    pliki = [("data/Map%03d.json" % m, os.path.join(STG, "data", "Map%03d.json" % m)) for m in mapy]
    zle = []
    for rel, src in pliki:
        cur = os.path.join(ROOT, rel)
        if not os.path.exists(src): zle.append("brak kopii " + src); continue
        if not os.path.exists(cur): zle.append(rel + " nie istnieje (szwy nie tworzą map)"); continue
        ok = sha(cur) == sumy.get(str(int(rel[8:11])))
        print("ZMIEN %-22s obecny plik %s zapisanemu skrótowi" % (rel, "ZGADZA SIĘ z" if ok else "RÓŻNI SIĘ od"))
        if not ok: zle.append("%s zmieniony od zbudowania kopii (gracz w edytorze?) - zbuduj kopię od nowa" % rel)
    if zle:
        print("\nSTOP:"); [print(" -", z) for z in zle]; sys.exit(1)
    print("\nZapisze %d plików%s." % (len(pliki), " (bez map gracza)" if bez else ""))
    if not wykonaj: print("(dry-run: nic nie zapisano; --wykonaj po zgodzie gracza, z zamkniętym edytorem)"); return
    import wspolne as W
    W.need_editor_closed()
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    for rel, src in pliki:
        os.makedirs(os.path.dirname(os.path.join(kop, rel)), exist_ok=True); shutil.copy2(os.path.join(ROOT, rel), os.path.join(kop, rel))
    for rel, src in pliki: shutil.copyfile(src, os.path.join(ROOT, rel))
    print("zainstalowano; kopie zapasowe:", kop)

main()
