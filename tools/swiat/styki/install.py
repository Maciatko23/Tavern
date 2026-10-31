# -*- coding: utf-8 -*-
"""Instalacja STYKÓW ŚWIATA: kopiuje ze stagingu do data/ i js/ (nowe mapy 960-964, zszyte krawędzie, links z kafli, Krawedzie.js z indeksem).
  python tools/swiat/styki/install.py --dry-run        (domyślnie; nic nie zapisuje)
  python tools/swiat/styki/install.py --wykonaj        (tylko po zgodzie gracza i przy ZAMKNIĘTYM edytorze RPG Makera)
  --bez-skal-13                                        (pomija PROPOZYCJĘ skał na północnej krawędzi Map013 - wiersz skał y 0-2 przy podnóżu gór; domyślnie wchodzi)
  --bez-gracza                                         (pomija pliki map gracza: 3, 4, 8, 13, 23, 24, 111 - mają tylko zasłonięte kratki krawędzi)
Sprawdza sha256 obecnych plików (staging/sumy.json, sumy_js.json): zmienione od zbudowania kopii = STOP (zbuduj od nowa: python tools/swiat/styki/zbuduj_styki.py).
Kopie zapasowe: tools/swiat/styki/kopie_zapasowe/<czas>/. Zapisuje: data/Map*.json (zmienione i nowe), data/MapInfos.json, docs/mapy/swiat_uklad.json,
js/plugins/Swiat_Data.js, js/plugins/Krawedzie.js, js/teksty/miejsca.txt."""
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
    sumy = json.load(open(os.path.join(STG, "sumy.json"))); sumy.update(json.load(open(os.path.join(STG, "sumy_js.json"))))
    nowe = set(zm["nowe"]); mapy = [m for m in zm["zmienione"] if not (bez and m in PL and m not in nowe)]
    pliki = [("data/Map%03d.json" % m, os.path.join(STG, "data", "Map%03d.json" % m), m in nowe) for m in mapy]
    if "--bez-skal-13" not in sys.argv and any(r == "data/Map013.json" for r, _, _ in pliki):
        pliki = [(r, os.path.join(STG, "skaly13", "Map013.json") if r == "data/Map013.json" else src, n) for r, src, n in pliki]
        print("(Map013: z propozycją skał na N krawędzi; --bez-skal-13 pomija)")
    pliki += [("data/MapInfos.json", os.path.join(STG, "data", "MapInfos.json"), False), ("docs/mapy/swiat_uklad.json", os.path.join(STG, "swiat_uklad.json"), False),
              ("js/plugins/Swiat_Data.js", os.path.join(STG, "js", "plugins", "Swiat_Data.js"), False), ("js/plugins/Krawedzie.js", os.path.join(STG, "js", "plugins", "Krawedzie.js"), False), ("js/plugins/CzerwonaWoda.js", os.path.join(STG, "js", "plugins", "CzerwonaWoda.js"), False),
              ("js/teksty/miejsca.txt", os.path.join(STG, "js", "teksty", "miejsca.txt"), False)]
    zle = []
    for rel, src, jest_nowa in pliki:
        cur = os.path.join(ROOT, rel)
        if not os.path.exists(src): zle.append("brak kopii " + src); continue
        if jest_nowa:
            if os.path.exists(cur): zle.append(rel + " już istnieje (nowa mapa nie może nadpisać)")
            print("NOWY  %-28s %d B" % (rel, os.path.getsize(src))); continue
        key = rel[len("data/Map"):-5] if rel.startswith("data/Map0") or rel.startswith("data/Map1") or rel.startswith("data/Map9") else rel
        key = str(int(key)) if key.isdigit() else ("MapInfos" if rel.endswith("MapInfos.json") else ("swiat_uklad" if rel.endswith("swiat_uklad.json") else rel))
        ok = sha(cur) == sumy.get(key)
        print("%-4s %-28s obecny plik %s zapisanemu skrótowi" % ("ZMIEN", rel, "ZGADZA SIĘ z" if ok else "RÓŻNI SIĘ od"))
        if not ok: zle.append("%s zmieniony od zbudowania kopii (gracz w edytorze?) - zbuduj kopię od nowa" % rel)
    if zle:
        print("\nSTOP:"); [print(" -", z) for z in zle]; sys.exit(1)
    print("\nZapisze %d plików%s." % (len(pliki), " (bez map gracza)" if bez else ""))
    if not wykonaj: print("(dry-run: nic nie zapisano; --wykonaj po zgodzie gracza, z zamkniętym edytorem)"); return
    import wspolne as W
    W.need_editor_closed()
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    for rel, src, jest_nowa in pliki:
        cur = os.path.join(ROOT, rel)
        if os.path.exists(cur):
            os.makedirs(os.path.dirname(os.path.join(kop, rel)), exist_ok=True); shutil.copy2(cur, os.path.join(kop, rel))
    for rel, src, _ in pliki: shutil.copyfile(src, os.path.join(ROOT, rel))
    print("zainstalowano; kopie zapasowe:", kop)

main()
