# -*- coding: utf-8 -*-
"""Przepięcia współrzędnych Kruczogrodu v2 w KOPIACH wtyczek (tools/miasto4/staging/js/plugins; js/plugins nietknięte) + spis tools/miasto4/przepiecia.json.
Każda zmiana ma warunek starej wartości (dokładnie jedno trafienie); instalator uruchamia ten skrypt na obecnych js/plugins tuż przed kopiowaniem.   python tools/miasto4/przepnij4.py"""
import os, sys, json, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
OUT = HERE.replace("\\", "/") + "/staging/js/plugins/"
NW = json.load(open(HERE + "/nowe.json", encoding="utf-8"))
D, SP = NW["drzwi"], NW["sp"]
WX, WY = NW["studnia"]
bf = (D["kantor"][0][0], D["kantor"][0][1] + 1)          # przed tylnymi drzwiami kantoru
ff = (D["kantor"][1][0], D["kantor"][1][1] + 1)          # przed frontowymi
kuf = (D["kuznia"][0][0], D["kuznia"][0][1] + 1)
pif = (D["piekarnia"][0][0], D["piekarnia"][0][1] + 1)
dz = D["dzwonnica"][0]
kow = SP["kowadlo"]
R = [
    ("Wrak_Data.js", "rozbitek_rynek: [56, 51, 2],", "rozbitek_rynek: [65, 60, 2],", "rynek: plac przesunięty o (+9,+10)"),
    ("Wrak_Data.js", "rozbitek_studnia: [52, 50, 4]", "rozbitek_studnia: [%d, %d, 4]" % (WX + 2, WY + 3), "studnia w środku placu: kratka obok zdarzenia wody"),
    ("Underground_Data.js", 'key: "rynek", map: 8, cam: [53, 55],', 'key: "rynek", map: 8, cam: [62, 62],', "epilog: rynek"),
    ("Underground_Data.js", '["soltys", 53, 52, 4], ["hanka", 47, 49, 6], ["kuba", 51, 52, 8], ["ambrozy", 47, 52, 6]', '["soltys", 62, 61, 4], ["hanka", 56, 60, 6], ["kuba", 60, 61, 8], ["ambrozy", 57, 61, 6]', "epilog: aktorzy na rynku"),
    ("Dezerter_Data.js", 'krok: "w16Tomek", godzina: 6.2, idz: [MAP.miasto, 50, 53, 8]', 'krok: "w16Tomek", godzina: 6.2, idz: [MAP.miasto, 61, 62, 8]', "W16: rynek"),
    ("SwieteKosci_Data.js", 'krok: "w15Kram", godzina: 10, idz: [MAP.miasto, 46, 49, 8]', 'krok: "w15Kram", godzina: 10, idz: [MAP.miasto, 58, 61, 8]', "W15: rynek przy studni"),
    ("SwieteKosci_Data.js", 'krok: "w15Falsz", godzina: 10, idz: [MAP.miasto, 46, 49, 8]', 'krok: "w15Falsz", godzina: 10, idz: [MAP.miasto, 58, 61, 8]', "W15: rynek przy studni"),
    ("SwieteKosci_Data.js", 'krok: "w15Skrzynka", godzina: 10, idz: [MAP.miasto, 46, 49, 8]', 'krok: "w15Skrzynka", godzina: 10, idz: [MAP.miasto, 58, 61, 8]', "W15: rynek przy studni"),
    ("SwieteKosci_Data.js", 'krok: "w15Komu", godzina: 10, idz: [MAP.miasto, 46, 49, 8]', 'krok: "w15Komu", godzina: 10, idz: [MAP.miasto, 58, 61, 8]', "W15: rynek przy studni"),
    ("Kantor_Data.js", "backDoor: [14, 47], backFront: [14, 48, 8], frontDoor: [18, 46],", "backDoor: [%d, %d], backFront: [%d, %d, 8], frontDoor: [%d, %d]," % (D["kantor"][0][0], D["kantor"][0][1], bf[0], bf[1], D["kantor"][1][0], D["kantor"][1][1]), "kantor: drzwi tylne i frontowe"),
    ("Kantor_Data.js", 'krok: "w5Poszlaki", godzina: 10, idz: [MAP.town, 16, 49, 8]', 'krok: "w5Poszlaki", godzina: 10, idz: [MAP.town, %d, %d, 8]' % (bf[0] + 2, bf[1] + 1), "W5: przy tylnych drzwiach"),
    ("Kantor_Data.js", 'krok: "w5Stuk", godzina: 23.85, idz: [MAP.town, 10, 49, 2]', 'krok: "w5Stuk", godzina: 23.85, idz: [MAP.town, %d, %d, 2]' % (bf[0] - 4, bf[1] + 1), "W5"),
    ("Kantor_Data.js", 'krok: "w5Najem", godzina: 10, idz: [MAP.town, 16, 49, 8]', 'krok: "w5Najem", godzina: 10, idz: [MAP.town, %d, %d, 8]' % (bf[0] + 2, bf[1] + 1), "W5"),
    ("Kantor_Data.js", 'krok: "w5Rejestr", godzina: 22.05, idz: [MAP.town, 14, 49, 8]', 'krok: "w5Rejestr", godzina: 22.05, idz: [MAP.town, %d, %d, 8]' % (bf[0] + 1, bf[1] + 1), "W5"),
    ("Kantor_Data.js", 'krok: "w5Komu", godzina: 10, idz: [MAP.town, 16, 49, 8]', 'krok: "w5Komu", godzina: 10, idz: [MAP.town, %d, %d, 8]' % (bf[0] + 2, bf[1] + 1), "W5"),
    ("Kantor_Data.js", 'krok: "w5Akt2", godzina: 10, idz: [MAP.town, 16, 49, 8]', 'krok: "w5Akt2", godzina: 10, idz: [MAP.town, %d, %d, 8]' % (bf[0] + 2, bf[1] + 1), "W5"),
    ("Kantor_Data.js", "{ w5_piwnica: [14, 48, 8], w5_lada: [18, 47, 8] }", "{ w5_piwnica: [%d, %d, 8], w5_lada: [%d, %d, 8] }" % (bf[0], bf[1], ff[0], ff[1]), "W5: spoty"),
    ("Garnizon_Data.js", "klos: { id: 659, x: 13, y: 48, d: 6 }", "klos: { id: 659, x: %d, y: %d, d: 6 }" % (bf[0] - 1, bf[1]), "Kłos przy tylnych drzwiach kantoru"),
    ("Garnizon_Data.js", "const add = { garnizon_werbownik: [24, 46, 2] };", "const add = { garnizon_werbownik: [32, 50, 2] };", "werbownik na ulicy głównej (izba stoi w starym miejscu)"),
    ("Kasztelan_Data.js", "krok: 2, godzina: 10, idz: [MAP.town, 9, 64, 4]", "krok: 2, godzina: 10, idz: [MAP.town, %d, %d, 4]" % (kow[0], kow[1]), "W4: kowadło"),
    ("TownQuests_Data.js", "bakery_window: { map: 8, id: 951, x: 38, y: 73,", "bakery_window: { map: 8, id: 951, x: %d, y: %d," % pif, "okienko piekarni"),
    ("TownQuests_Data.js", "notice_bakery: { map: 8, id: 953, x: 39, y: 73,", "notice_bakery: { map: 8, id: 953, x: %d, y: %d," % (pif[0] + 1, pif[1]), "kartka na piekarni"),
    ("TownQuests_Data.js", "notice_smithy: { map: 8, id: 954, x: 9, y: 62,", "notice_smithy: { map: 8, id: 954, x: %d, y: %d," % (kuf[0] - 2, kuf[1]), "kartka na kuźni"),
    ("TownQuests_Data.js", "notice_kantor: { map: 8, id: 955, x: 19, y: 47,", "notice_kantor: { map: 8, id: 955, x: %d, y: %d," % (ff[0] + 1, ff[1]), "kartka na kantorze"),
    ("Act3_Data.js", "bell: [85, 30], bellStand: [85, 31],", "bell: [%d, %d], bellStand: [%d, %d]," % (dz[0] - 1, dz[1] - 1, dz[0] - 1, dz[1]), "dzwonnica: lina i miejsce dzwonnika"),
    ("Okolice_Data.js", "8: [54, 50], 13: [29, 49]", "8: [63, 61], 13: [29, 49]", "wejście testowe: plac"),
    ("Orzel_Data.js", "[30, 37, 73, 63]", "[45, 50, 79, 70]", "lądowisko orła: nowy plac (region 31)"),
]


def main():
    os.makedirs(OUT, exist_ok=True)
    rep, bad = [], []
    for f in {r[0] for r in R}: shutil.copyfile(ROOT + "js/plugins/" + f, OUT + f)      # zawsze od świeżej kopii
    for f, old, new, why in R:
        p = OUT + f
        b = open(p, "rb").read()
        o, n = old.encode("utf-8"), new.encode("utf-8")
        cnt = b.count(o)
        if cnt == 1:
            line = b[:b.index(o)].count(b"\n") + 1
            open(p, "wb").write(b.replace(o, n))
            rep.append({"plik": "js/plugins/" + f, "linia": line, "stara": old, "nowa": new, "po_co": why})
        elif b.count(n) == 1: rep.append({"plik": "js/plugins/" + f, "linia": None, "stara": old, "nowa": new, "po_co": why + " (już przepięte)"})
        else: bad.append((f, old, cnt))
    json.dump({"opis": "Przepięcia Kruczogrodu v2 (miasto4): zastosowane w kopiach tools/miasto4/staging/js/plugins; warunek = dokładnie jedno trafienie starej wartości",
               "zmiany": rep, "znaczniki_mapy": "Map008: wszystkie znaczniki 'Miejsce:' i drzwi mają nowe kratki w staging/data/Map008.json (zob. tools/miasto4/nowe.json); wyjścia wnętrz w staging/data/Map1xx.json",
               "pominiete_domy": [d for d in NW["pominiete"]]},
              open(HERE + "/przepiecia.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("zmian:", len(rep), "pominięte:", bad)
    return bad


if __name__ == "__main__":
    sys.exit(1 if main() else 0)
