# -*- coding: utf-8 -*-
"""Instalacja POPRAWY KRAWĘDZI (liście -> trawa, zapory): kopiuje zmienione mapy ze stagingu (tools/krawedzie_poprawa/staging/data) do data/ oraz
staging/js/plugins/Swiat_Data.js do js/plugins/ (links po otwarciu kratek).
  python tools/krawedzie_poprawa/install.py --dry-run        (domyślnie; nic nie zapisuje)
  python tools/krawedzie_poprawa/install.py --wykonaj        (tylko po zgodzie gracza i przy ZAMKNIĘTYM edytorze RPG Makera)
Sprawdza sha256 obecnych plików (staging/sumy.json): zmienione od zbudowania kopii = STOP (zbuduj od nowa: zbuduj.py + linki, patrz docs).
Kopie zapasowe: tools/krawedzie_poprawa/kopie_zapasowe/<czas>/. NIE rusza js/plugins.js, tilesetów ani IconSet."""
import os, sys, json, hashlib, shutil, datetime
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
STG = os.path.join(HERE, "staging")
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
def sha(p): return hashlib.sha256(open(p, "rb").read()).hexdigest()

def main():
    wykonaj = "--wykonaj" in sys.argv and "--dry-run" not in sys.argv
    mapy = json.load(open(os.path.join(STG, "zmienione.json")))["zmienione"]
    sumy = json.load(open(os.path.join(STG, "sumy.json")))
    pliki = [("data/Map%03d.json" % m, os.path.join(STG, "data", "Map%03d.json" % m), str(m)) for m in mapy]
    pliki.append(("js/plugins/Swiat_Data.js", os.path.join(STG, "js", "plugins", "Swiat_Data.js"), "Swiat_Data.js"))
    zle = []
    for rel, src, klucz in pliki:
        cur = os.path.join(ROOT, rel)
        if not os.path.exists(src): zle.append("brak kopii " + src); continue
        if not os.path.exists(cur): zle.append(rel + " nie istnieje"); continue
        ok = sha(cur) == sumy.get(klucz)
        print("ZMIEN %-28s obecny plik %s zapisanemu skrótowi" % (rel, "ZGADZA SIĘ z" if ok else "RÓŻNI SIĘ od"))
        if not ok: zle.append("%s zmieniony od zbudowania kopii (gracz w edytorze?) - zbuduj od nowa" % rel)
    if zle:
        print("\nSTOP:"); [print(" -", z) for z in zle]; sys.exit(1)
    print("\nZapisze %d plików (w tym Swiat_Data.js)." % len(pliki))
    if not wykonaj: print("(dry-run: nic nie zapisano; --wykonaj po zgodzie gracza, z zamkniętym edytorem)"); return
    import wspolne as W
    W.need_editor_closed()
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    for rel, src, k in pliki:
        os.makedirs(os.path.dirname(os.path.join(kop, rel)), exist_ok=True); shutil.copy2(os.path.join(ROOT, rel), os.path.join(kop, rel))
    for rel, src, k in pliki: shutil.copyfile(src, os.path.join(ROOT, rel))
    print("zainstalowano; kopie zapasowe:", kop)

main()
