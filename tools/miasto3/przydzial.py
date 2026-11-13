# -*- coding: utf-8 -*-
"""Wstępny przydział kawałków zestawu 13 do adresów (drzwi zostają na swoich kratkach; plan.py BUDYNKI): prostokąt zajmowany przez budynek i kolizje.
Zapis: tools/miasto3/przydzial.json.  status: 'zbudowany' (faza 1), 'wstępny' (faza 2: sprawdzić drzwi i dojście), 'dopisać' (kawałka brak w kit.py)."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
UK = json.load(open(HERE + "/uklad.json", encoding="utf-8"))
A = [  # (adres, drzwi x, y, kawałek, status, uwaga)
    ("Tawerna", 51, 16, "gildia", "zbudowany", "+ 2 x kamienica jako skrzydła"),
    ("Stajnia i wozownia (przeniesiona)", 74, 7, "stajnia", "zbudowany", "+ wozownia, siano; wnętrze Map181"),
    ("Kaplica", 8, 16, "kosciol", "wstępny", "wnętrze Map178; cmentarz obok"),
    ("Dom grabarza", 20, 12, "chata_a", "wstępny", ""),
    ("Dom 1 (Agata)", 85, 12, "dom_kwiaty", "wstępny", "droga biegnie tuż pod drzwiami (y13-15)"),
    ("Kamienica (Dom 2)", 96, 28, "dom_pietrowy", "wstępny", ""),
    ("Dzwonnica", 86, 31, "dzwonnica", "wstępny", "drzwi ev236 (86,31), znacznik (85,31)"),
    ("Dom mieszczan", 36, 38, "dom_waski", "wstępny", "pod murem zamku - plac wybrukować dopiero od y39"),
    ("Izba pod skałą", 39, 37, "dom_wieza", "wstępny", "KOLIZJA z murem zamku y29-32: niższy kawałek (chata_c) albo przyległa do muru"),
    ("Dom 15", 21, 33, "chata_b", "wstępny", ""),
    ("Kantor (front)", 18, 46, "sklep", "wstępny", "dwoje drzwi: front tu, tylne (14,47) osobna przybudówka chata_e"),
    ("Kantor (tylne)", 14, 47, "chata_e", "wstępny", "ciche, od uliczki"),
    ("Szwaczka", 7, 48, "dom_waski", "wstępny", ""),
    ("Kowal", 13, 60, "chata_bale", "wstępny", "kowadło (8,63) na zewnątrz - dopisać kawałek kuźni (City_TileB 8-15,0-8) w fazie 2"),
    ("Ratusz (kancelaria)", 85, 47, "ratusz", "dopisać", "City_TileC 1-7,9-15; dwoje drzwi (85,47) i (91,47)"),
    ("Strażnica Lorda", 98, 47, "dom_wieza", "wstępny", "kamienna; chorągwie jako zdarzenia"),
    ("Dom 4 (Halina)", 84, 63, "chata_c", "wstępny", ""),
    ("Dom 5 (dom kupca)", 95, 62, "chata_d", "wstępny", ""),
    ("Piekarnia", 38, 72, "sklep", "wstępny", "okienko (38,73): sklep ma kram w oknie"),
    ("Dom 10", 31, 73, "chata_e", "wstępny", ""),
    ("Dom 11", 45, 73, "dom_szachulec", "wstępny", ""),
    ("Dom woziwody", 59, 73, "chata_bale2", "wstępny", ""),
    ("Dom 13", 79, 74, "chata_a", "wstępny", ""),
    ("Cieśla (Dom 6)", 33, 86, "chata_bale", "wstępny", ""),
    ("Dom staruszków (Dom 7)", 42, 87, "chata_c", "wstępny", ""),
    ("Dom 12", 45, 87, "dom_kwiaty", "wstępny", ""),
    ("Szopa woźniców (dawna stajnia)", 61, 87, "wozownia", "wstępny", "bez wnętrza, bez drzwi"),
    ("Dom 14", 78, 88, "chata_b", "wstępny", ""),
    ("Weteran (Dom 8)", 84, 88, "dom_szachulec", "wstępny", ""),
    ("Izba do wynajęcia (Dom 9)", 95, 88, "chata_d", "wstępny", ""),
    ("Garbarz", 6, 88, "chata_bale2", "wstępny", ""),
]
out, boxes = [], []
for nm, dx, dy, key, st, note in A:
    u = UK.get(key)
    if not u: out.append({"adres": nm, "drzwi": [dx, dy], "kawalek": key, "status": st, "uwaga": note}); continue
    ddx, ddy = u["drzwi"] if u["drzwi"] else (0, u["h"] - 1)
    x0, y0 = dx - ddx, dy - ddy
    box = [x0, y0, x0 + u["w"] - 1, y0 + u["h"] - 1]
    prob = []
    if y0 < 4: prob.append("nachodzi na mur północny (y<4)")
    for (n2, b2) in boxes:
        if not (box[2] < b2[0] or b2[2] < box[0] or box[3] < b2[1] or b2[3] < box[1]): prob.append("kolizja z: " + n2)
    boxes.append((nm, box))
    out.append({"adres": nm, "drzwi": [dx, dy], "kawalek": key, "arkusz": u["arkusz"], "prostokat": box, "status": st, "uwaga": note, "problemy": prob})
json.dump(out, open(HERE + "/przydzial.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(sum(1 for o in out if o.get("problemy")), "adresów z problemami:", [(o["adres"], o["problemy"]) for o in out if o.get("problemy")])
