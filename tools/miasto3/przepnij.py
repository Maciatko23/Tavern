# -*- coding: utf-8 -*-
"""Przepięcia współrzędnych Kruczogrodu w KOPIACH wtyczek (tools/miasto3/staging/js/plugins; js/plugins nietknięte) + spis tools/miasto3/przepiecia.json
(plik:linia, stara -> nowa wartość). Każda zmiana ma warunek starej wartości (dokładnie jedno trafienie w podanej linii-wzorcu).   python tools/miasto3/przepnij.py"""
import os, sys, json, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
OUT = HERE.replace("\\", "/") + "/staging/js/plugins/"
# (plik, stara wartość, nowa wartość, po co); stara wartość musi trafić dokładnie raz w pliku
R = [
    ("TownLife_Data.js", "brama_wsch: [100, 51, 4], brama_pld: [52, 92, 2]", "brama_wsch: [116, 49, 4], brama_pld: [31, 114, 2]", "bramy: wschodnia (y48-50) i południowa (x30-33)"),
    ("TownLife_Data.js", "pod_murem: [58, 90, 2], stodola: [48, 90, 2]", "pod_murem: [48, 112, 2], stodola: [38, 112, 2]", "ulica pod murem południowym: x-10, y+22"),
    ("TownLife_Data.js", "woz_pld: [54, 90, 2]", "woz_pld: [44, 112, 2]", "postój woźnicy"),
    ("TownLife_Data.js", "w6_ognisko: [60, 90, 4]", "w6_ognisko: [50, 112, 4]", "ognisko obozu W6"),
    ("Podroznicy_Data.js", "podr_droga: [52, 92, 2], podr_przystan: [52, 92, 2], podr_dwor: [100, 51, 6]", "podr_droga: [31, 114, 2], podr_przystan: [31, 114, 2], podr_dwor: [116, 49, 6]", "podróżni w drodze / u dworu"),
    ("Dwor_Data.js", "out: [8, 102, 51, 4]", "out: [8, 117, 49, 4]", "wyrzucenie z ogrodu dworu: tuż za bramą wschodnią"),
    ("Dwor_Data.js", "town: { gate: [100, 51], f9: [50, 46, 8] }", "town: { gate: [116, 49], f9: [50, 46, 8] }", "myto przy bramie wschodniej"),
    ("Dwor_Data.js", "TLD.SPOTS.brama_wsch || [100, 51, 4]", "TLD.SPOTS.brama_wsch || [116, 49, 4]", "zapasowa wartość miejsca dwor"),
    ("TownQuests.js", "map: TOWN, x: 102, y: 51, dir: 4", "map: TOWN, x: 117, y: 49, dir: 4", "pendingOut po wyrzuceniu z ogrodu dworu"),
    ("TownQuests_Data.js", "south_gate: { map: 8, id: 956, x: 53, y: 93,", "south_gate: { map: 8, id: 956, x: 31, y: 117,", "ślady pod bramą południową"),
    ("TownQuests_Data.js", "east_brazier: { map: 8, id: 958, x: 101, y: 49,", "east_brazier: { map: 8, id: 958, x: 117, y: 47,", "kosz żarowy przy bramie wschodniej"),
    ("TownQuests_Data.js", "w6_tent1: { map: 8, id: 903, x: 58, y: 92,", "w6_tent1: { map: 8, id: 903, x: 48, y: 114,", "obóz W6 (x-10, y+22)"),
    ("TownQuests_Data.js", "w6_fire: { map: 8, id: 905, x: 59, y: 90,", "w6_fire: { map: 8, id: 905, x: 49, y: 112,", "obóz W6"),
    ("TownQuests_Data.js", "w6_tent2: { map: 8, id: 904, x: 46, y: 90,", "w6_tent2: { map: 8, id: 904, x: 36, y: 112,", "obóz W6"),
    ("TownQuests_Data.js", "w6_bogdan: { map: 8, id: 906, x: 50, y: 90,", "w6_bogdan: { map: 8, id: 906, x: 40, y: 112,", "obóz W6"),
    ("TownQuests_Data.js", "w6_halina: { map: 8, id: 907, x: 56, y: 91,", "w6_halina: { map: 8, id: 907, x: 46, y: 113,", "obóz W6"),
    ("Kantor_Data.js", "gateIn: [52, 104], gateOut: [52, 105], east: [101, 50]", "gateIn: [31, 118], gateOut: [32, 118], east: [117, 49]", "kurier od bramy południowej, gość od wschodniej"),
    ("Woz.js", "miasto: { map: 8, woz: [56, 90], woznica: [54, 90, 2], land: [52, 90, 6] }", "miasto: { map: 8, woz: [46, 112], woznica: [44, 112, 2], land: [42, 112, 6] }", "przystanek wozu przy bramie południowej"),
    ("Underground_Data.js", "{ ludmila: [57, 90, 6], ela: [58, 91, 8], marek: [59, 90, 4], rafal: [55, 90, 6] }", "{ ludmila: [47, 112, 6], ela: [48, 113, 8], marek: [49, 112, 4], rafal: [45, 112, 6] }", "epilog: obóz"),
    ("Dezerter_Data.js", "oboz: [MAP.miasto, 57, 89, 2]", "oboz: [MAP.miasto, 47, 111, 2]", "W16 obóz"),
    ("Garnizon_Data.js", "search: [{ id: 657, x: 59, y: 89 }, { id: 658, x: 47, y: 89 }]", "search: [{ id: 657, x: 49, y: 111 }, { id: 658, x: 37, y: 111 }]", "werbownicy przy obozie"),
    ("TownLife_Data.js", "staw: [66, 10, 6],", "staw: [58, 28, 6],", "praca woziwody: ogródek piwny (staw nie istnieje)"),
    # faza 2: szubienica wraca do mapy (wzgórze 87,108), pola mieszczan pod południowym murem, lądowiska orła
    ("Zakon_Data.js", "const GALLOWS = { map: 8, x: 87, y: 121, w: 3, h: 3, id: 2840, at: [88, 123], creak: [22, 3] };", "const GALLOWS = { map: 8, x: 87, y: 108, w: 3, h: 3, id: 2840, at: [88, 110], creak: [22, 3] };", "szubienica wewnątrz mapy 120x120"),
    ("Zakon_Data.js", '{ key: "szubienica", map: 8, x: 88, y: 124, near: 2,', '{ key: "szubienica", map: 8, x: 88, y: 111, near: 2,', "odkrycie szubienicy"),
    ("Zakon.js", "[TK.f9.szubienica, 8, 88, 125]", "[TK.f9.szubienica, 8, 88, 112]", "F9 do szubienicy"),
    ("Okolice_Data.js", 'key: "szubienica", pkg: "D", map: 8, kind: "gallows", name: "Wzgórze z szubienicą", mode: "reach", x: 87, y: 121,', 'key: "szubienica", pkg: "D", map: 8, kind: "gallows", name: "Wzgórze z szubienicą", mode: "reach", x: 87, y: 108,', "plan miejsc Okolic"),
    ("Okolice_Data.js", 'key: "pole_1", pkg: "A", map: 8, kind: "field", name: "Pole mieszczan", mode: "reach", x: 6, y: 104,', 'key: "pole_1", pkg: "A", map: 8, kind: "field", name: "Pole mieszczan", mode: "reach", x: 6, y: 108,', "pole 1 pod południowym murem"),
    ("Okolice_Data.js", 'key: "pole_2", pkg: "A", map: 8, kind: "field", name: "Pole mieszczan", mode: "reach", x: 32, y: 118,', 'key: "pole_2", pkg: "A", map: 8, kind: "field", name: "Pole mieszczan", mode: "reach", x: 74, y: 108,', "pole 2 wewnątrz mapy"),
    ("Okolice_Data.js", 'key: "pole_3", pkg: "A", map: 8, kind: "field", name: "Pole mieszczan", mode: "reach", x: 62, y: 104,', 'key: "pole_3", pkg: "A", map: 8, kind: "field", name: "Pole mieszczan", mode: "reach", x: 62, y: 108,', "pole 3"),
    ("Zasoby_Data.js", '{ key: "pole_1", x: 6, y: 104, w: 8, h: 4,', '{ key: "pole_1", x: 6, y: 108, w: 8, h: 4,', "dniówka na polu 1"),
    ("Zasoby_Data.js", '{ key: "pole_2", x: 32, y: 118, w: 8, h: 4,', '{ key: "pole_2", x: 74, y: 108, w: 8, h: 4,', "dniówka na polu 2"),
    ("Zasoby_Data.js", '{ key: "pole_3", x: 62, y: 104, w: 8, h: 5,', '{ key: "pole_3", x: 62, y: 108, w: 8, h: 5,', "dniówka na polu 3"),
    ("Orzel_Data.js", "8: [[29, 17, 76, 27], [30, 37, 73, 63], [2, 89, 101, 92]],", "8: [[29, 17, 60, 28], [30, 37, 73, 63], [2, 111, 116, 114]],", "lądowiska orła: dziedziniec bez zajazdu, ulica pod południowym murem"),
]


def main():
    os.makedirs(OUT, exist_ok=True)
    rep, bad = [], []
    for f, old, new, why in R:
        p = OUT + f
        if not os.path.exists(p): shutil.copyfile(ROOT + "js/plugins/" + f, p)
        b = open(p, "rb").read()
        o, n = old.encode("utf-8"), new.encode("utf-8")
        cnt = b.count(o)
        if cnt == 1:
            line = b[:b.index(o)].count(b"\n") + 1
            open(p, "wb").write(b.replace(o, n))
            rep.append({"plik": "js/plugins/" + f, "linia": line, "stara": old, "nowa": new, "po_co": why})
        elif b.count(n) == 1: rep.append({"plik": "js/plugins/" + f, "linia": None, "stara": old, "nowa": new, "po_co": why + " (już przepięte)"})
        else: bad.append((f, old, cnt))
    json.dump({"opis": "Przepięcia fazy 1 (bramy + obóz pod murem + stajnia): zastosowane w kopiach tools/miasto3/staging/js/plugins", "zmiany": rep,
               "znaczniki_mapy": "Map008: brama_wsch 323 (100,51)->(116,49); brama_pld 324 (52,92)->(31,114); brama_pd 412 (52,91)->(32,114); pod_murem 332, stodola 334, woz_pld 343, w6_ognisko 344: x-10,y+22; stajnia_drzwi 446 (61,88)->(74,8); stajnia_woz 415 (69,86)->(72,12); drzwi stajni ev209 (61,87)->(74,7); Map181: wyjscia ev38/ev39 -> (74,8)"},
              open(HERE + "/przepiecia.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("zmian:", len(rep), "pominięte:", bad)


if __name__ == "__main__":
    main()
