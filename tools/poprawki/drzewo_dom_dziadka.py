# -*- coding: utf-8 -*-
"""Map020 (Dom dziadka - Podwórze): drzewo w zagrodzie po lewej od chaty było z kafelków (korona 5x3 + pień na warstwie 3, bez
gwiazdki), więc bohater chodził po koronie zamiast za nią (gracz 2026-10-31). Zamiana na zwykłe drzewo ozdobne - zdarzenie
!$Big_Trees_green (kierunek 4, wzór 2: to samo drzewo co „Drzewo (ozdobne)” w miasteczku; ChoppableTree robi je przezroczystym,
gdy bohater stoi za nim). Kafle drzewa znikają, zdarzenie „Drzewo (z kafelków)” (blokada pnia) też.
  python tools/poprawki/drzewo_dom_dziadka.py            (podgląd: co zmieni)
  python tools/poprawki/drzewo_dom_dziadka.py --wykonaj  (edytor zamknięty; kopia w tools/poprawki/kopie_zapasowe/)"""
import os, sys, json, shutil, time, copy
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
import popraw

MAPA = os.path.join(ROOT, "data", "Map020.json")
KAFLE = {(x, y): t for y, row in enumerate([[531, 532, 533, 534, 535], [539, 540, 541, 542, 543], [547, 548, 549, 550, 551]], 1)
         for x, t in zip(range(7, 12), row)}
KAFLE[(9, 4)] = 557
KAFLE[(9, 5)] = 565
PIEN = (9, 5)


def main():
    raw = json.loads(open(MAPA, "rb").read().decode("utf-8"))
    W, H, d = raw["width"], raw["height"], raw["data"]
    z = 3
    zle = [(x, y, d[(z * H + y) * W + x], t) for (x, y), t in KAFLE.items() if d[(z * H + y) * W + x] != t]
    if zle: sys.exit("STOP: kafle drzewa nie są tam, gdzie były (mapa zmieniona w edytorze?): %s" % zle)
    stare = [e for e in raw["events"] if e and e["name"] == "Drzewo (z kafelków)" and (e["x"], e["y"]) == PIEN]
    if len(stare) != 1: sys.exit("STOP: brak zdarzenia „Drzewo (z kafelków)” w %s" % (PIEN,))
    for (x, y) in KAFLE: d[(z * H + y) * W + x] = 0
    nowe = copy.deepcopy(stare[0])
    nowe["name"] = "Drzewo (ozdobne)"
    nowe["note"] = ""
    pg = nowe["pages"][0]
    pg["image"] = {"tileId": 0, "characterName": "!$Big_Trees_green", "direction": 4, "pattern": 2, "characterIndex": 0}
    pg["directionFix"] = True; pg["priorityType"] = 1; pg["through"] = False; pg["stepAnime"] = False; pg["walkAnime"] = False
    nowe["pages"] = [pg]
    raw["events"][stare[0]["id"]] = nowe
    print("Map020: %d kafli drzewa usuniętych z warstwy 3, zdarzenie #%d -> „Drzewo (ozdobne)” !$Big_Trees_green (4, 2) w %s" % (len(KAFLE), nowe["id"], PIEN))
    if "--wykonaj" not in sys.argv:
        print("(podgląd: nic nie zapisano; --wykonaj przy zamkniętym edytorze)"); return
    kop = os.path.join(HERE, "kopie_zapasowe", time.strftime("%Y%m%d_%H%M%S"))
    os.makedirs(kop, exist_ok=True)
    shutil.copy2(MAPA, os.path.join(kop, "Map020.json"))
    with open(MAPA, "wb") as f: f.write(popraw.tekst_mapy(raw))
    print("zapisano; kopia:", kop)


if __name__ == "__main__":
    main()
