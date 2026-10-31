# -*- coding: utf-8 -*-
"""Instalacja palisady Osady Milczących i przeniesienia bramy: kopiuje ze stagingu (tools/osada/staging, zbudowanego przez brama.py)
do data/, js/ i docs/.
  python tools/osada/install.py --dry-run        (domyślnie; nic nie zapisuje)
  python tools/osada/install.py --wykonaj        (tylko po zgodzie gracza i przy ZAMKNIĘTYM edytorze RPG Makera: Map013 to mapa gracza)
Sprawdza sha256 obecnych plików (staging/sumy.json): zmienione od zbudowania kopii = STOP (zbuduj od nowa: python tools/osada/brama.py).
Kopie zapasowe: tools/osada/kopie_zapasowe/<czas>/. Po zapisie odświeża skrót Map120 w tools/osada/installed.json."""
import os, sys, json, hashlib, shutil, datetime
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
STG = os.path.join(HERE, "staging")
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass


def sha(p): return hashlib.sha256(open(p, "rb").read()).hexdigest()


def main():
    wykonaj = "--wykonaj" in sys.argv and "--dry-run" not in sys.argv
    sumy = json.load(open(os.path.join(STG, "sumy.json")))
    zle = []
    for rel, h in sumy.items():
        src, cur = os.path.join(STG, rel), os.path.join(ROOT, rel)
        if not os.path.exists(src): zle.append("brak kopii " + src); continue
        ok = os.path.exists(cur) and sha(cur) == h
        print("ZMIEN %-34s obecny plik %s zapisanemu skrótowi  (%d B -> %d B)" % (rel, "ZGADZA SIĘ z" if ok else "RÓŻNI SIĘ od", os.path.getsize(cur), os.path.getsize(src)))
        if not ok: zle.append("%s zmieniony od zbudowania kopii (gracz w edytorze? inny agent?) - zbuduj kopię od nowa" % rel)
    if zle:
        print("\nSTOP:"); [print(" -", z) for z in zle]; sys.exit(1)
    print("\nZapisze %d plików." % len(sumy))
    if not wykonaj: print("(dry-run: nic nie zapisano; --wykonaj po zgodzie gracza, z zamkniętym edytorem)"); return
    sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
    import wspolne as W
    W.need_editor_closed()
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    for rel in sumy:
        os.makedirs(os.path.dirname(os.path.join(kop, rel)), exist_ok=True); shutil.copy2(os.path.join(ROOT, rel), os.path.join(kop, rel))
    for rel in sumy: shutil.copyfile(os.path.join(STG, rel), os.path.join(ROOT, rel))
    ip = os.path.join(HERE, "installed.json")
    raw = open(ip, "rb").read(); ins = json.loads(raw.decode("utf-8")); ins["Map120.json"] = sha(os.path.join(ROOT, "data", "Map120.json"))
    open(ip, "wb").write((json.dumps(ins, indent=1, ensure_ascii=False) + ("\n" if raw.endswith(b"\n") else "")).replace("\n", "\r\n" if b"\r\n" in raw else "\n").encode("utf-8"))
    print("zainstalowano; kopie zapasowe:", kop)


main()
