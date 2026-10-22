# Instalator rozszerzeń nowego terenu (docs/rozszerzenia/PLAN.md 3.3.1). Zawsze: edytor RPG Maker MZ zamknięty (tasklist), blokada
# tools/rozszerzenia/.blokada (zapisy po kolei), plik czytany tuż przed zmianą, kopia do Tawerna_archiwum_2026-10-18/
# dane_przed_rozszerzeniami/<kto>/, zapis w układzie edytora. Bez --wykonaj tylko pokazuje, co by zrobił.
#
#   python tools/rozszerzenia/instaluj.py --pakiet0 [--wykonaj]
#       staging pakietu 0 (tools/rozszerzenia/pakiet0.py) -> data/, js/plugins.js, img/system/IconSet.png; każdy plik musi być taki,
#       jak w chwili przygotowania stagingu (SHA.txt) - inaczej STOP i trzeba przygotować staging na nowo
#   python tools/rozszerzenia/instaluj.py --paczka A --przedmioty tools/rozszerzenia/A/przedmioty.json [--wykonaj]
#       przedmioty paczki: JSON [{ "id": 185, "name": ..., "iconIndex": ..., "description": ..., "note": ..., "price": ..., "itypeId": ...,
#       "consumable": ..., "occasion": ..., "scope": ... }, ...] - tylko numery z bloku paczki; reszta Items.json bez zmian (sprawdzane)
#   python tools/rozszerzenia/instaluj.py --paczka A --ikony tools/rozszerzenia/A/ikony.png [--wykonaj]
#       wiersz ikon paczki: PNG 512x32 (16 ikon) -> jej wiersz IconSet (A 29, B 30, C 31, D 32); reszta IconSet bez zmian (sprawdzane)
#   python tools/rozszerzenia/instaluj.py --paczka C --mapa 177 tools/rozszerzenia/C/Map177.json [--wykonaj]
#       własna mapa paczki (C: 177, D: 176), plik w układzie edytora
import os, sys, json, argparse, shutil
from wspolne import (ROOT, STAGING, read_json, json_text, sha1, sha1_bytes, need_editor_closed, take_lock, drop_lock, archive)

PKG = {"A": {"items": (185, 199), "row": 29, "maps": []}, "B": {"items": (200, 209), "row": 30, "maps": []},
       "C": {"items": (210, 224), "row": 31, "maps": [177]}, "D": {"items": (225, 239), "row": 32, "maps": [176]}}
ITEM_FIELDS = {"name", "iconIndex", "description", "note", "price", "itypeId", "consumable", "occasion", "scope", "animationId", "hitType",
               "speed", "successRate", "repeats", "tpGain", "damage", "effects"}


def write(rel, data, who, do):
    cur = os.path.join(ROOT, *rel.split("/"))
    if os.path.exists(cur) and open(cur, "rb").read() == data:
        print("już jest   " + rel); return False
    print(("instaluję  " if do else "zmieniłby  ") + rel)
    if not do: return False
    bak = archive(rel, who)
    if bak: print("   kopia: " + bak)
    os.makedirs(os.path.dirname(cur), exist_ok=True)
    open(cur, "wb").write(data)
    if open(cur, "rb").read() != data: raise SystemExit("STOP: zapis %s nie zgadza się" % rel)
    return True


def pakiet0(do):
    shafile = os.path.join(STAGING, "SHA.txt")
    if not os.path.exists(shafile): raise SystemExit("STOP: brak stagingu - najpierw python tools/rozszerzenia/pakiet0.py")
    rows = [l.rstrip("\n").split("\t") for l in open(shafile, encoding="utf-8") if l.strip() and not l.startswith("#")]
    bad, todo = [], []
    for rel, new, old in rows:
        cur, stg = os.path.join(ROOT, *rel.split("/")), os.path.join(STAGING, *rel.split("/"))
        if sha1(stg) != new: bad.append("%s: plik w stagingu uszkodzony" % rel)
        elif sha1(cur) == new: print("już jest   " + rel)
        elif sha1(cur) != old: bad.append("%s: zmienił się od przygotowania stagingu" % rel)
        else: todo.append(rel)
    if bad:
        for b in bad: print("STOP: " + b)
        raise SystemExit("Nic nie zainstalowano - przygotuj staging na nowo (python tools/rozszerzenia/pakiet0.py).")
    n = 0
    for rel in todo:
        if write(rel, open(os.path.join(STAGING, *rel.split("/")), "rb").read(), "pakiet0", do): n += 1
    return n


def items(pkg, path, do):
    lo, hi = PKG[pkg]["items"]
    arr, lay = read_json("data/Items.json")
    if len(arr) - 1 < hi: raise SystemExit("STOP: Items.json nie ma rezerw do %d - najpierw pakiet 0" % hi)
    before = [json.dumps(e, sort_keys=True) for i, e in enumerate(arr) if not (lo <= i <= hi)]
    new = json.load(open(path, encoding="utf-8"))
    for e in new:
        i = int(e.get("id", 0))
        if not (lo <= i <= hi): raise SystemExit("STOP: przedmiot %s poza blokiem paczki %s (%d-%d)" % (i, pkg, lo, hi))
        extra = set(e) - ITEM_FIELDS - {"id"}
        if extra: raise SystemExit("STOP: przedmiot %d ma nieznane pola: %s" % (i, sorted(extra)))
        if not e.get("name"): raise SystemExit("STOP: przedmiot %d bez nazwy" % i)
        arr[i].update({k: v for k, v in e.items() if k != "id"})
    after = [json.dumps(e, sort_keys=True) for i, e in enumerate(arr) if not (lo <= i <= hi)]
    if before != after: raise SystemExit("STOP: zmiana poza blokiem paczki - przerwano")
    return write("data/Items.json", json_text(arr, lay), "paczka_" + pkg, do)


def icons(pkg, path, do):
    from PIL import Image
    import io
    row = PKG[pkg]["row"]
    p = os.path.join(ROOT, "img", "system", "IconSet.png")
    im = Image.open(p).convert("RGBA")
    if im.size != (512, 1056): raise SystemExit("STOP: IconSet ma %s - najpierw pakiet 0 (512x1056)" % (im.size,))
    strip = Image.open(path).convert("RGBA")
    if strip.size != (512, 32): raise SystemExit("STOP: wiersz ikon ma %s, ma być 512x32" % (strip.size,))
    out = im.copy()
    out.paste(Image.new("RGBA", (512, 32), (0, 0, 0, 0)), (0, row * 32))
    out.paste(strip, (0, row * 32))
    a, b = list(im.getdata()), list(out.getdata())
    for i, (pa, pb) in enumerate(zip(a, b)):
        if pa != pb and not (row * 32 <= i // 512 < row * 32 + 32): raise SystemExit("STOP: zmiana poza wierszem paczki")
    buf = io.BytesIO()
    out.save(buf, format="PNG", optimize=True)
    return write("img/system/IconSet.png", buf.getvalue(), "paczka_" + pkg, do)


def mapfile(pkg, mid, path, do):
    if mid not in PKG[pkg]["maps"]: raise SystemExit("STOP: mapa %d nie należy do paczki %s" % (mid, pkg))
    raw = open(path, "rb").read()
    m = json.loads(raw.decode("utf-8"))
    from wspolne import map_text
    if map_text(m).encode("utf-8") != raw: raise SystemExit("STOP: %s nie jest w układzie edytora (wspolne.map_text)" % path)
    infos, _ = read_json("data/MapInfos.json")
    if mid >= len(infos) or not infos[mid]: raise SystemExit("STOP: MapInfos bez mapy %d - najpierw pakiet 0" % mid)
    return write("data/Map%03d.json" % mid, raw, "paczka_" + pkg, do)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pakiet0", action="store_true")
    ap.add_argument("--paczka", choices=sorted(PKG))
    ap.add_argument("--przedmioty")
    ap.add_argument("--ikony")
    ap.add_argument("--mapa", nargs=2, metavar=("NR", "PLIK"))
    ap.add_argument("--wykonaj", action="store_true")
    a = ap.parse_args()
    need_editor_closed()
    who = "pakiet0" if a.pakiet0 else "paczka_" + str(a.paczka)
    if a.wykonaj: take_lock(who)
    try:
        if a.pakiet0: n = pakiet0(a.wykonaj)
        elif a.paczka and a.przedmioty: n = items(a.paczka, a.przedmioty, a.wykonaj)
        elif a.paczka and a.ikony: n = icons(a.paczka, a.ikony, a.wykonaj)
        elif a.paczka and a.mapa: n = mapfile(a.paczka, int(a.mapa[0]), a.mapa[1], a.wykonaj)
        else: raise SystemExit("Użycie: --pakiet0 | --paczka X (--przedmioty PLIK | --ikony PNG | --mapa NR PLIK) [--wykonaj]")
    finally:
        if a.wykonaj: drop_lock()
    if not a.wykonaj: print("(podgląd - nic nie zmieniono; dodaj --wykonaj)")
    else: print("Gotowe. Otwórz projekt w RPG Maker MZ na nowo, zanim cokolwiek w nim zapiszesz.")


if __name__ == "__main__":
    main()
