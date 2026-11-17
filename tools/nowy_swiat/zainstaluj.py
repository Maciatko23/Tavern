# -*- coding: utf-8 -*-
"""Wgranie 5 map nowego świata (2026-11-13) jako NOWE mapy 218-222 - jeszcze niepołączone ze światem (gracz poprawia je ręcznie w edytorze).
  python tools/nowy_swiat/zainstaluj.py             sprawdzenie, nic nie zapisuje
  python tools/nowy_swiat/zainstaluj.py --wykonaj   zapis (TYLKO przy zamkniętym edytorze)
Robi: data/Map218-222.json (kopie ze staging), wpisy w data/MapInfos.json (na końcu listy, od zachodu na wschód),
obrazki img/characters/!$Pod_Mielerz.png i !$Miasteczko_Szyld.png. Kopie zapasowe: ../Tawerna_archiwum_2026-11-08/nowy_swiat_<czas>.
Potem: python tools/drzewa/drzewa.py --mapy 218,219,220,221,222 --wykonaj (drzewa do ścinania + System.json versionId).
Mapa, która w data/ już jest i różni się od staging (ręczne poprawki gracza), NIE jest nadpisywana - skrypt staje."""
import datetime, hashlib, importlib.util, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)   # read_json, json_text, need_editor_closed

MAPS = [  # (id, folder, name in the editor's map list) - west to east
    (219, "wybrzeze", "Wybrzeże (nowy świat)"),
    (218, "podgrodzie", "Podgrodzie (nowy świat)"),
    (220, "miasteczko", "Miasteczko (nowy świat)"),
    (221, "posiadlosc", "Posiadłość Lorda (nowy świat)"),
    (222, "gory", "Góry (nowy świat)"),
]
PICTURES = [("podgrodzie", "!$Pod_Mielerz.png"), ("miasteczko", "!$Miasteczko_Szyld.png")]


def stop(msg): raise SystemExit("STOP: " + msg + " Nic nie zmieniono.")
def md5(b): return hashlib.md5(b).hexdigest()


def plan():
    out = []                                            # (target rel path, bytes)
    for (mid, folder, _) in MAPS:
        src = os.path.join(HERE, folder, "staging", "Map%03d.json" % mid)
        raw = open(src, "rb").read()
        o = __import__("json").loads(raw.decode("utf-8"))
        if RW.map_text(o).encode("utf-8") != raw: stop("staging Map%d nie jest w układzie edytora." % mid)
        if (o["width"], o["height"]) != (80, 80) or any(e and e["id"] >= 500 for e in o["events"]): stop("Map%d: rozmiar albo numery zdarzeń." % mid)
        dst = os.path.join(ROOT, "data", "Map%03d.json" % mid)
        if os.path.exists(dst):
            if md5(open(dst, "rb").read()) == md5(raw): continue
            stop("data/Map%03d.json już jest i różni się od staging (ręczne poprawki?)." % mid)
        out.append(("data/Map%03d.json" % mid, raw))
    mi, lay = RW.read_json("data/MapInfos.json")
    if lay != "db": stop("MapInfos.json w nieznanym układzie.")
    order = max(e["order"] for e in mi if e)
    changed = False
    for (mid, _, name) in MAPS:
        if len(mi) > mid and mi[mid]:
            if mi[mid]["name"] == name: continue
            stop("MapInfos: pozycja %d zajęta przez „%s”." % (mid, mi[mid]["name"]))
        while len(mi) <= mid: mi.append(None)
        order += 1
        mi[mid] = {"id": mid, "expanded": False, "name": name, "order": order, "parentId": 0, "scrollX": 1920, "scrollY": 1920}
        changed = True
    if changed: out.append(("data/MapInfos.json", RW.json_text(mi, lay)))
    for (folder, fn) in PICTURES:
        raw = open(os.path.join(HERE, folder, "staging", "characters", fn), "rb").read()
        dst = os.path.join(ROOT, "img", "characters", fn)
        if os.path.exists(dst):
            if md5(open(dst, "rb").read()) == md5(raw): continue
            stop("img/characters/%s już jest i jest inny." % fn)
        out.append(("img/characters/" + fn, raw))
    return out


def main():
    out = plan()
    for (rel, raw) in out: print("  %-40s %7d B" % (rel, len(raw)))
    if not out: print("Wszystko już wgrane."); return
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj, żeby zapisać)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "nowy_swiat_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
    os.makedirs(bak, exist_ok=True)
    for rel in ("data/MapInfos.json", "data/System.json"):
        shutil.copy2(os.path.join(ROOT, rel), os.path.join(bak, os.path.basename(rel)))
    for (rel, raw) in out:
        with open(os.path.join(ROOT, rel), "wb") as f: f.write(raw)
    print("Zapisano %d plików; kopie: %s" % (len(out), bak))


if __name__ == "__main__":
    main()
