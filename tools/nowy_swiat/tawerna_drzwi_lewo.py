# -*- coding: utf-8 -*-
"""Wejście do tawerny na mapie Kruczogrodu (Map220) po lewej stronie budynku (gracz 2026-11-16: „wejście do tawerny musi być po
lewej stronie, żeby pasowało do wnętrza” - w środku sala z wejściem jest w lewej części parteru). Dwa pięciokratkowe odcinki
frontu zamieniają się miejscami: ganek z drzwiami i latarniami (x46..50) idzie na x41..45, a szyld z okiennicami (x41..45) na
x46..50 (rzędy 33..35: kafle warstw 1-3, regiony, zdarzenia). Drzwi (48,34) -> (43,34); wyjścia z tawerny (Map001) przed nowe
drzwi (43,35).
  python tools/nowy_swiat/tawerna_drzwi_lewo.py [--wykonaj]      (zapis tylko przy zamkniętym edytorze; kopie w archiwum)"""
import datetime, importlib.util, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

A0, B0, N, ROWS = 41, 46, 5, (33, 34, 35)


def main():
    m, lay = RW.read_json("data/Map220.json"); room, rl = RW.read_json("data/Map001.json")
    W, H = m["width"], m["height"]
    at = lambda z, x, y: (z * H + y) * W + x
    door = next(e for e in m["events"] if e and e["name"] == "Drzwi: Tawerna")
    if door["x"] != 48: print("drzwi już przesunięte (x=%d)" % door["x"]); return
    for y in ROWS:
        for z in (1, 2, 3, 4, 5):
            for i in range(N):
                a, b = at(z, A0 + i, y), at(z, B0 + i, y)
                m["data"][a], m["data"][b] = m["data"][b], m["data"][a]
    moved = []
    for e in m["events"]:
        if not e: continue
        if (e["y"] in ROWS and A0 <= e["x"] < B0 + N) or (e["y"] == 36 and e["x"] == 48 and e["name"].startswith("Miejsce: tawerna_podworze")):
            e["x"] += N if e["x"] < B0 else -N; moved.append((e["id"], e["name"], e["x"], e["y"]))
    k = 0
    for e in room["events"]:
        if not e: continue
        for p in e["pages"]:
            for c in p["list"]:
                if c["code"] == 201 and c["parameters"][1] == 220 and c["parameters"][2] == 48: c["parameters"][2] = 43; k += 1
    print("przesuniętych zdarzeń: %d, wyjść tawerny: %d" % (len(moved), k))
    for t in moved: print("  ", t)
    if "--wykonaj" not in sys.argv: print("(sprawdzenie - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "tawerna_drzwi_lewo_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S")); os.makedirs(bak, exist_ok=True)
    for name, mm, ll in (("Map220.json", m, lay), ("Map001.json", room, rl)):
        rel = os.path.join(ROOT, "data", name); shutil.copy2(rel, bak); open(rel, "wb").write(RW.json_text(mm, ll))
    sp = os.path.join(ROOT, "data", "System.json"); shutil.copy2(sp, bak)
    s = open(sp, "rb").read()
    open(sp, "wb").write(re.sub(rb'"versionId":(\d+)', lambda k: b'"versionId":' + str(int(k.group(1)) + 1).encode(), s, count=1))
    print("Zapisano; kopie:", bak)


if __name__ == "__main__":
    main()
