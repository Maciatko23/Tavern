# -*- coding: utf-8 -*-
"""Obóz kopaczy w Sztolni Kruczych Turni (Map225), 2026-11-17: W6 rozdz. 7 (Marek) i W8 (obóz, skrzynia dowódcy, pojedynek przy tunelu)
przechodzą ze starej Jaskini (Map014, stary świat) do komory z ogniskiem kopaczy w Sztolni (x 17-33, y 56-65, wejście chodnikiem
x 20-22 od północy, za rumowiskiem 20-22,43). Z Map014 kopiowane są: Marek (twarzą do skały w niszy za stosem desek, NE),
strażnik obozu (u wylotu chodnika), trzech kopaczy (przy ścianie, przy ognisku, przy workach) i znaczniki „Miejsce: …” (kierunek
obrazka znacznika = kierunek postaci: TownQuests markerAt().d). Wyjście z Markiem = stary chodnik na północ do Kruczych Turni
(znacznik jaskinia_wyjscie przy 57,7 - tam też ląduje tunel z piętra 50, Map149 zdarzenie 23). Przy okazji: wyjścia Map014 (prowadziły
na usuniętą Map013) prowadzą teraz do Kruczych Turni (Map222, 57,13 - tam, gdzie wychodzi stary chodnik Sztolni).
Mapy edytowane na miejscu (tylko dopisane zdarzenia / przestawione przejścia), kopia w ..\\Tawerna_archiwum_2026-11-08\\jaskinia_225_<czas>,
nowa wersja projektu (System.json versionId).
  python tools/nowy_swiat/jaskinia_225.py             próba (nic nie zapisuje)
  python tools/nowy_swiat/jaskinia_225.py --wykonaj   zapis (edytor zamknięty)"""
import copy, datetime, importlib.util, json, os, random, re, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

# Map014 event name (+ which one of the same name) -> (x, y, facing) on Map225
PEOPLE = [
    ("Marek", 0, (33, 57, 6)),             # (his niche: the NE corner behind the heap of planks, facing the rock of the east wall)
    ("Strażnik obozu", 0, (23, 56, 4)),    # (by the mouth of the way in, looking at it)
    ("Kopacz", 0, (17, 62, 4)),            # (at the west wall - the face they dig)
    ("Kopacz", 1, (26, 60, 4)),            # (by the fire)
    ("Kopacz", 2, (19, 58, 8)),            # (at the sacks by the way in)
]
MARKERS = {   # "Miejsce: <name>" -> (x, y, facing)
    "marek": (33, 57, 6), "straz_obozu": (23, 56, 4), "oboz_kopaczy": (25, 59, 8),   # (at night the guard sits by the fire facing the way out)
    "kopacz_przodek": (17, 62, 4), "kopacz_ognisko": (26, 60, 4), "kopacz_wozek": (19, 58, 8),
    "list_kryjowka": (18, 60, 2),          # (the commander's crate: the covered crate west of the fire)
    "jaskinia_wyjscie": (57, 7, 8),        # (out with Marek: the old adit north to Krucze Turnie)
    "tunel_wejscie": (57, 8, 2), "tunel_brama": (57, 6, 2),   # (W8 rozdz. 6: where the diggers' tunnel from floor 50 comes out)
}
CAVE_EXIT_TO = (222, 57, 13, 2)   # Map014's exits: to Krucze Turnie, where the Sztolnia's old adit comes out


def main():
    do = "--wykonaj" in sys.argv
    if do: RW.need_editor_closed()
    cave, lay14 = RW.read_json("data/Map014.json")
    m, lay = RW.read_json("data/Map225.json")
    names = [e["name"] for e in m["events"] if e]
    if "Marek" in names or any(n == "Miejsce: marek" for n in names):
        print("Map225 ma już obóz kopaczy (Marek / znacznik) - nic do zrobienia."); return
    added = []
    def put(src, x, y, d):
        c = copy.deepcopy(src); c["id"] = len(m["events"]); c["x"], c["y"] = x, y
        for p in c["pages"]: p["image"]["direction"] = d
        m["events"].append(c); added.append((c["id"], c["name"], x, y, d))
    for name, k, (x, y, d) in PEOPLE:
        src = [e for e in cave["events"] if e and e["name"] == name][k]
        put(src, x, y, d)
    for name, (x, y, d) in MARKERS.items():
        src = next(e for e in cave["events"] if e and e["name"] == "Miejsce: " + name)
        put(src, x, y, d)
    # Map014's own exits (to the removed Map013): to Krucze Turnie
    moved = 0
    for e in cave["events"]:
        if not e: continue
        here = 0
        for p in e["pages"]:
            for c in p["list"]:
                if c["code"] == 201 and c["parameters"][0] == 0 and c["parameters"][1] == 13:
                    c["parameters"][1:5] = list(CAVE_EXIT_TO); here += 1
        if here and e["name"].startswith("Przejście -> "): e["name"] = "Przejście -> Krucze Turnie"
        moved += here
    for a in added: print("  Map225 +%d %-22s (%d,%d) kier. %d" % a)
    print("  Map014: przejścia na Map013 -> Map%03d (%d,%d): %d" % (CAVE_EXIT_TO[0], CAVE_EXIT_TO[1], CAVE_EXIT_TO[2], moved))
    t225, t14 = RW.json_text(m, lay), RW.json_text(cave, lay14)
    json.loads(t225.decode("utf-8")); json.loads(t14.decode("utf-8"))   # (read back before anything is written)
    if not do: print("(próba - dopisz --wykonaj)"); return
    bak = os.path.join(ARCH, "jaskinia_225_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S")); os.makedirs(bak, exist_ok=True)
    for f in ("Map225.json", "Map014.json", "System.json"): shutil.copy2(os.path.join(ROOT, "data", f), bak)
    with open(os.path.join(ROOT, "data", "Map225.json"), "wb") as fh: fh.write(t225)
    with open(os.path.join(ROOT, "data", "Map014.json"), "wb") as fh: fh.write(t14)
    sp = os.path.join(ROOT, "data", "System.json"); s = open(sp, "rb").read()
    s2 = re.sub(rb'"versionId":(\d+)', lambda k: b'"versionId":' + str(random.randint(10000000, 99999999)).encode(), s, count=1)
    json.loads(s2.decode("utf-8"))
    with open(sp, "wb") as fh: fh.write(s2)
    print("Zapisane. Kopia: %s" % bak)


if __name__ == "__main__": main()
