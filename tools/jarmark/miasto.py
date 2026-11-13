# -*- coding: utf-8 -*-
"""Kamienice jarmarku na Map008 (W17): dwa nowe, przylegające do siebie domy z kafli Winlu - kopie istniejących domów miasta
(Dom 14 x51-54 i Dom weterana x56-60 bez jednej kolumny okna), na wolnej łące nad dzwonnicą. Dachy tych domów, dach dużego domu
na zachodzie i dach dzwonnicy tworzą trasę nocnego pościgu (tryb dachów: Jarmark.js). Funkcja patch() pracuje na bieżącej mapie
(kotwice: puste pola łąki, dom wzorcowy, drzewa 217/283), idempotentna, STOP gdy kotwicy brak."""
import copy, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as W

# (źródło: kolumny x, rząd y0..y1) -> cel
H1 = dict(name="Kamienica 1", cols=[51, 52, 53, 54], src_y=(101, 105), dst_x=42, dst_y=94, door_col=52)
H2 = dict(name="Kamienica 2", cols=[56, 58, 59, 60], src_y=(101, 105), dst_x=46, dst_y=94, door_col=58)
HOUSES = [H1, H2]
# komórki dachów, po których biegnie pościg: (x0, y0, x1, y1) włącznie
ROOFS = {"duzy": (35, 97, 41, 99), "k1": (42, 94, 45, 96), "k2": (46, 94, 49, 96), "dzwonnica": (45, 100, 48, 103)}
KOMIN = [(43, 94), (43, 95)]           # komin na dachu Kamienicy 1 (nie do przejścia, obchodzi się dołem)
DRZEWA = [217, 283]                    # ozdobne drzewa na łące (zasłaniałyby dachy)
DOOR_SRC = 254                         # wzorzec zdarzenia drzwi (Drzwi: Dom 14)
MARK = "Wejście: Kamienica"

def stop(msg): raise SystemExit("STOP: " + msg)

def patch(m):
    """zmienia mapę w miejscu; zwraca listę komunikatów"""
    ev = m["events"]
    if any(e and e["name"].startswith(MARK) for e in ev):
        return ["Map008: kamienice już są"]
    if m["width"] != 120 or m["height"] != 120: stop("Map008 ma inny rozmiar niż 120x120")
    out = []
    # 1) kotwice: łąka pod domami wolna, wzorce domów na miejscu
    for h in HOUSES:
        for dx in range(4):
            for dy in range(5):
                x, y = h["dst_x"] + dx, h["dst_y"] + dy
                if W.at(m, 0, x, y) not in (2816, 2832, 2824, 2836, 2840): stop("Map008: pole (%d,%d) pod kamienicę nie jest łąką (%d)" % (x, y, W.at(m, 0, x, y)))
                if any(W.at(m, z, x, y) for z in (1, 2, 3)): stop("Map008: pole (%d,%d) pod kamienicę ma coś na wyższej warstwie" % (x, y))
    if W.at(m, 0, 51, 101) != 4931 or W.at(m, 0, 56, 101) != 4931: stop("Map008: domy wzorcowe (Dom 14 / Dom weterana) wyglądają inaczej niż przy projekcie")
    # 2) drzewa ozdobne na łące
    for i in DRZEWA:
        e = ev[i] if i < len(ev) else None
        if e and e["name"].startswith("Drzewo (ozdobne)"):
            ev[i] = None; out.append("zdarzenie %d (drzewo) usunięte" % i)
        elif e: stop("Map008: zdarzenie %d to już nie drzewo ozdobne" % i)
    # 3) kafle: wszystkie warstwy 0-5
    for h in HOUSES:
        for ci, sx in enumerate(h["cols"]):
            for dy in range(5):
                for z in range(6):
                    W.put(m, z, h["dst_x"] + ci, h["dst_y"] + dy, W.at(m, z, sx, h["src_y"][0] + dy))
    # 3b) bluszcz z krawędzi Domu weterana (kafle 95 / 103 ciągną się u wzorca także nad i pod skopiowanym prostokątem: tu byłyby rozcięte) - bez niego
    for dy in range(5):
        for z in (2, 3):
            if W.at(m, z, 49, 94 + dy) in (95, 103): W.put(m, z, 49, 94 + dy, 0)
    # 4) drzwi (zamknięte) - kopia zdarzenia drzwi Domu 14, bez przejścia (domy bez wnętrza, jak inne domy na wprost)
    src = ev[DOOR_SRC]
    if not src or src["name"] != "Drzwi: Dom 14": stop("Map008: zdarzenie 254 to nie „Drzwi: Dom 14”")
    for h in HOUSES:
        e = copy.deepcopy(src)
        free = next((i for i in range(1, len(ev)) if ev[i] is None and i not in DRZEWA), None)
        i = free if free is not None else len(ev)
        e["id"] = i; e["name"] = "%s %s" % (MARK, h["name"][-1]); e["note"] = ""
        e["x"] = h["dst_x"] + h["cols"].index(h["door_col"]); e["y"] = h["dst_y"] + 4
        e["pages"][0]["list"] = [
            {"code": 355, "indent": 0, "parameters": ["const t = $gameTemp, k = this.eventId(); t._townDoorPop = t._townDoorPop || {}; if (!(t._townDoorPop[k] > Graphics.frameCount - 60)) { t._townDoorPop[k] = Graphics.frameCount; Tawerna.popup(\"Zamknięte.\", { color: \"info\" }); }"]},
            {"code": 0, "indent": 0, "parameters": []}]
        e["pages"][0]["trigger"] = 0
        if i == len(ev): ev.append(e)
        else: ev[i] = e
        out.append("drzwi %s (%d,%d) id %d" % (h["name"], e["x"], e["y"], i))
    for i, e in enumerate(ev):
        if e is not None and e["id"] != i: stop("Map008: zdarzenie %d pod indeksem %d" % (e["id"], i))
    return out
