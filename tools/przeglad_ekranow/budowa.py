# -*- coding: utf-8 -*-
"""Składa listę defektów: detektory.json (auto) + notatki.tsv (oko) -> lista_wycinkow.json (do wycinki.js), potem LISTA.md i lista.json.
  python -I tools/przeglad_ekranow/budowa.py wycinki     -> lista_wycinkow.json
  python -I tools/przeglad_ekranow/budowa.py raport      -> docs/przeglad_ekranow/LISTA.md + lista.json"""
import os, sys, json, collections
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
import mapylib as L
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
OUT = os.path.join(ROOT, "docs", "przeglad_ekranow")
WNETRZA = {8, 10, 12, 20}

KATEGORIE = {  # kod detektora -> (kategoria, jak naprawić)
    "O1": ("ucięty obiekt", "Dokończyć obiekt brakującymi kaflami (dół/góra/bok) albo usunąć jego resztę."),
    "G1": ("gwiazdka nad wolną kratką", "Zablokować kratkę pod obiektem (kafel blokujący/region 2) albo zdjąć gwiazdkę."),
    "G2": ("wysoki obiekt bez gwiazdki", "Dodać kafel z gwiazdką nad górną częścią obiektu."),
    "G3": ("obraz zdarzenia wystaje na wolną kratkę", "Zmienić <Occupy:...> tak, by obejmował obraz, albo przesunąć zdarzenie."),
    "G5": ("zdarzenie nad postacią nad wolną kratką", "Zmienić priorytet zdarzenia albo zablokować kratkę."),
    "Z1": ("dwa zdarzenia na jednej kratce", "Rozsunąć zdarzenia."),
    "Z3": ("zdarzenie na kaflu blokującym", "Przesunąć zdarzenie na wolną kratkę."),
    "PL1": ("luka w płocie", "Domknąć płot albo wstawić bramę ze słupkami po obu stronach luki."),
    "PL2": ("resztka / samotny płot", "Usunąć resztkę albo dokończyć ją do pełnego ogrodzenia."),
    "PL3": ("brama bez słupków", "Dostawić słupki/płot po obu stronach bramy."),
    "UP1": ("uprawa tuż pod murem/płotem", "Odsunąć grządkę o co najmniej 1-2 kratki od muru/płotu."),
    "DA1": ("ozdoba na dachu", "Zdjąć ozdobę z dachu (lub przesunąć na ścianę/ziemię)."),
    "NA1": ("obraz zachodzi na mur/dach/płot", "Przesunąć obiekt tak, by jego obraz nie wchodził na mur, dach lub płot."),
    "NA2": ("drzewo/krzak/skała na murze, dachu lub płocie", "Odsunąć drzewo/krzak/skałę o 2-3 kratki od muru/płotu."),
    "SC1": ("samotny rekwizyt na ścieżce", "Usunąć albo dołączyć do grupy rekwizytów."),
    "CI1": ("cień-bryła (stałe kafle z gwiazdkami)", "Sprawdzić, czy Cienie.js nie rzuca z nich twardego prostokąta; w razie czego <Cienie:off> lub inne kafle."),
    "CI2": ("twardy czarny prostokąt cienia (warstwa 4)", "Usunąć kratki cienia warstwy 4 (rysowane piórem cienia) - zostawić cień słońca z Cienie.js."),
    "GR1": ("dwa grunty pod jednym obiektem", "Ujednolicić grunt pod ogrodzeniem/podwórkiem."),
    "NI1": ("niewidzialna blokada (zdarzenie/kafel)", "Sprawdzić BFS: usunąć blokadę albo narysować to, co blokuje."),
    "NI2": ("region 2 (blokada) na gołym gruncie", "Usunąć region 2 albo narysować obiekt, który blokuje."),
    "ES-b": ("ucięty/pojedynczy grunt", "Wygładzić plamę gruntu."),
    "ES-c": ("drzewo z kafli bez gwiazdki", "Dodać gwiazdkę nad koroną."),
    "ES-f": ("zębata / dziurawa linia wzgórza", "Wygładzić obrys skarpy (spójne narożniki, bez dziur)."),
    "ES-g": ("drzewo za blisko wody", "Odsunąć drzewo od wody."),
    "ES-h": ("rama innego gruntu pod płotem/murem", "Ujednolicić grunt pod płotem/murem."),
    "ES-i": ("zaokrąglony koniec lica przy schodach", "Poprawić zakończenie lica."),
    "ES-j": ("kanciasta / prostokątna plama gruntu", "Zaokrąglić brzeg plamy, rozmyć, wymieszać z otoczeniem."),
}
SKIP = {"D1"}
JEDNO = {"NI1", "NI2", "ES-j", "ES-b", "ES-f", "ES-g", "ES-i", "PL1", "CI1", "CI2", "NA1", "NA2", "O1", "G3", "G1", "G2", "G5"}
INNE_WNETRZA = ("NA1", "NA2", "DA1", "ES-j", "ES-b", "ES-f", "ES-g", "ES-h", "ES-i", "ES-c", "PL1", "PL2", "PL3", "CI1", "GR1", "SC1", "UP1")


def nazwa_mapy(m):
    try: return L.map_name(m)
    except Exception: return str(m)


def skupiska(hity, r=4, cap=16):
    n = len(hity); par = list(range(n))
    def f(a):
        while par[a] != a: par[a] = par[par[a]]; a = par[a]
        return a
    for i in range(n):
        for j in range(i + 1, n):
            a, b = hity[i], hity[j]
            dx = max(a["x"] - (b["x"] + b["w"] - 1), b["x"] - (a["x"] + a["w"] - 1), 0)
            dy = max(a["y"] - (b["y"] + b["h"] - 1), b["y"] - (a["y"] + a["h"] - 1), 0)
            if max(dx, dy) <= r: par[f(i)] = f(j)
    g = collections.defaultdict(list)
    for i in range(n): g[f(i)].append(hity[i])
    out = []
    for lst in g.values():
        x0 = min(h["x"] for h in lst); y0 = min(h["y"] for h in lst); x1 = max(h["x"] + h["w"] - 1 for h in lst); y1 = max(h["y"] + h["h"] - 1 for h in lst)
        lst.sort(key=lambda h: (-h["waga"], h["y"], h["x"]))
        top = lst[0]
        if x1 - x0 + 1 > cap or y1 - y0 + 1 > cap:
            x0, y0, x1, y1 = top["x"], top["y"], top["x"] + top["w"] - 1, top["y"] + top["h"] - 1
        out.append({"x": x0, "y": y0, "w": x1 - x0 + 1, "h": y1 - y0 + 1, "n": len(lst), "opis": top["opis"], "waga": max(h["waga"] for h in lst), "kod": top["kod"]})
    return out


def auto_wiersze():
    d = json.load(open(os.path.join(HERE, "detektory.json"), encoding="utf-8"))
    odrz = set()
    p = os.path.join(HERE, "odrzucone.json")
    if os.path.exists(p):
        for o in json.load(open(p, encoding="utf-8")): odrz.add((o["mapa"], o["kod"]))
    tsid = {}
    by = collections.defaultdict(list)
    for h in d:
        if h["kod"] in SKIP: continue
        if (h["mapa"], h["kod"]) in odrz or ("*", h["kod"]) in odrz: continue
        if h["mapa"] not in tsid:
            tsid[h["mapa"]] = L.load_json(L.DATA + "Map%03d.json" % h["mapa"])["tilesetId"]
        if tsid[h["mapa"]] in WNETRZA and h["kod"] in INNE_WNETRZA and not (h["mapa"] == 213 and h["kod"] == "CI2"):
            continue
        by[(h["mapa"], h["kod"])].append(h)
    rows = []
    for (m, kod), lst in by.items():
        sk = skupiska(lst) if kod in JEDNO else [{"x": h["x"], "y": h["y"], "w": h["w"], "h": h["h"], "n": 1, "opis": h["opis"], "waga": h["waga"], "kod": kod} for h in lst]
        for s in sk:
            kat, fix = KATEGORIE.get(kod, (kod, ""))
            opis = s["opis"] + (" (+%d podobnych w pobliżu)" % (s["n"] - 1) if s["n"] > 1 else "")
            rows.append({"mapa": m, "x": s["x"], "y": s["y"], "w": s["w"], "h": s["h"], "kategoria": kat, "kod": kod, "opis": opis, "naprawa": fix, "waga": s["waga"], "zrodlo": "auto", "n": s["n"]})
    return rows


def oko_wiersze():
    rows = []
    for line in open(os.path.join(HERE, "notatki.tsv"), encoding="utf-8"):
        line = line.rstrip("\n")
        if not line.strip(): continue
        c = line.split("\t")
        if len(c) < 9: print("zła linia:", line[:60]); continue
        m, x, y, w, h = [int(v) for v in c[:5]]
        rows.append({"mapa": m, "x": x, "y": y, "w": w, "h": h, "kategoria": c[5], "kod": "", "waga": int(c[6]), "opis": c[7], "naprawa": c[8], "zrodlo": "oko", "n": 1})
    return rows


def pokrywa(a, b, m=3):
    return not (a["x"] > b["x"] + b["w"] - 1 + m or b["x"] > a["x"] + a["w"] - 1 + m or a["y"] > b["y"] + b["h"] - 1 + m or b["y"] > a["y"] + a["h"] - 1 + m)


def polacz():
    A = auto_wiersze(); O = oko_wiersze()
    rows = []
    for o in O:
        zgodne = [a for a in A if a["mapa"] == o["mapa"] and pokrywa(a, o)]
        if zgodne:
            o["zrodlo"] = "auto+oko"; o["kod"] = ",".join(sorted({a["kod"] for a in zgodne}))
            o["waga"] = max(o["waga"], max(a["waga"] for a in zgodne))
            for a in zgodne: a["scalone"] = True
        rows.append(o)
    rows += [a for a in A if not a.get("scalone")]
    rows.sort(key=lambda r: (r["mapa"], r["y"] // 12, r["x"]))
    cnt = collections.Counter()
    for r in rows:
        cnt[r["mapa"]] += 1
        r["id"] = "%02d" % cnt[r["mapa"]]
    return rows


if __name__ == "__main__":
    rows = polacz()
    if sys.argv[1] == "wycinki":
        json.dump([{"id": r["id"], "mapa": r["mapa"], "x": r["x"], "y": r["y"], "w": r["w"], "h": r["h"]} for r in rows], open(os.path.join(HERE, "lista_wycinkow.json"), "w"), indent=0)
        print(len(rows), "wierszy;", collections.Counter(r["zrodlo"] for r in rows))


# ------------------------------------------------------------------------------------------------ raport
KANON = [  # (fragment tekstu kategorii oka -> kategoria zbiorcza)
    ("kanciast", "kanciasta plama gruntu"), ("ciemna plama", "kanciasta plama gruntu"), ("szew", "kanciasta plama gruntu"),
    ("pusty nudny", "pusty nudny obszar"), ("równo rozsiane", "równo rozsiane drzewa/rzeczy"), ("długi prosty", "długi prosty odcinek"),
    ("brama bez", "brama bez słupków"), ("słupki bez", "resztka / samotny płot"), ("resztka", "resztka / samotny płot"), ("samotn", "resztka / samotny płot"),
    ("płot: resztki", "luka w płocie / niedomknięty płot"), ("płot: luki", "luka w płocie / niedomknięty płot"), ("płot: kojce", "luka w płocie / niedomknięty płot"),
    ("luka", "luka w płocie / niedomknięty płot"), ("uprawa", "uprawa tuż pod murem/płotem"),
    ("posąg", "figura wygląda jak NPC / przedmiot"), ("postać", "figura wygląda jak NPC / przedmiot"), ("skrzynia", "figura wygląda jak NPC / przedmiot"), ("przedmiot", "figura wygląda jak NPC / przedmiot"),
    ("cienia", "twardy czarny prostokąt cienia"), ("klifu", "zębata / dziurawa linia wzgórza"), ("płot na dachu", "płot / obiekt narysowany na dachu"), ("płot za dachem", "obraz zachodzi na mur/dach/płot"), ("płot nad dachami", "obraz zachodzi na mur/dach/płot"),
    ("płot na murze", "obraz zachodzi na mur/dach/płot"), ("rośliny na murze", "obraz zachodzi na mur/dach/płot"), ("drzewo na", "drzewo/krzak/skała na murze, dachu lub płocie"), ("drzewa na", "drzewo/krzak/skała na murze, dachu lub płocie"),
    ("krzak na", "drzewo/krzak/skała na murze, dachu lub płocie"), ("drzewo na płocie", "drzewo/krzak/skała na murze, dachu lub płocie"), ("dwa grunty", "dwa grunty pod jednym obiektem"), ("pusty dywan", "pusty dywan"),
    ("mur bez", "ucięty obiekt"), ("rozbity", "ucięty obiekt"), ("mur wolno", "resztka / samotny płot"), ("komin", "komin nie na dachu"), ("dziur", "ucięty obiekt"), ("pęknięcie", "ucięty obiekt"),
    ("morze", "morze wygląda jak mgła"), ("lone props", "samotny rekwizyt"), ("ozdobne", "dziwny wzór / do oceny"), ("dziwny", "dziwny wzór / do oceny"), ("obiekt przypomina", "dziwny wzór / do oceny"),
]


def kanon(r):
    k = r["kategoria"]
    if r["zrodlo"] == "auto" or k in {v[0] for v in KATEGORIE.values()}: return k
    for frag, nazwa in KANON:
        if frag in k: return nazwa
    return k


def raport():
    rows = polacz()
    for r in rows: r["kat"] = kanon(r)
    os.makedirs(OUT, exist_ok=True)
    maps = sorted({r["mapa"] for r in rows})
    cats = sorted({r["kat"] for r in rows})
    per = collections.defaultdict(collections.Counter)
    for r in rows: per[r["mapa"]][r["kat"]] += 1
    out = []
    A = out.append
    A("# Przegląd ekran po ekranie - lista defektów\n")
    A("Zrobione 2026-11-11 (tylko odczyt - żadnego pliku gry nie ruszono). Każdy ekran każdej mapy świata (27x15 kratek, zakładka 2 kratki, bohater schowany, bez pogody, dzień 40 godz. 11; wnętrza w swoim świetle) obejrzany oczami, "
      "plus detektory z danych map (`tools/przeglad_ekranow/detektory.py`). Zdjęcia ekranów: `tools/przeglad_ekranow/zrzuty/<mapa>/<x>_<y>.png`, arkusze: `zrzuty/_arkusze/`.\n")
    A("**Waga:** 3 = rzuca się w oczy od razu, 2 = widoczny, 1 = drobiazg. **Źródło:** `auto` = znalazł tylko detektor, `oko` = tylko ja na ekranie, `auto+oko` = oba. "
      "Obrazek w kolumnie ostatniej: wycinek z gry w pełnej skali, czerwona ramka = miejsce. Kratki podane jako `x,y` (szer x wys); bohater nie stoi na wycinku.\n")
    A("Uwaga o detektorach: wiersze `auto` są łączone w skupiska (kilka trafień w promieniu 4 kratek = jeden wiersz, w opisie `+N podobnych`). Detektory zostawiają trochę fałszywych alarmów (zwłaszcza `niewidzialna blokada` i `region 2`) - oznaczono je w kolumnie opisu.\n")
    A("## Podsumowanie wag\n")
    cw = collections.Counter(r["waga"] for r in rows); cz = collections.Counter(r["zrodlo"] for r in rows)
    A("Razem **%d** wierszy: waga 3 - %d, waga 2 - %d, waga 1 - %d; `auto` %d, `oko` %d, `auto+oko` %d.\n" % (len(rows), cw[3], cw[2], cw[1], cz["auto"], cz["oko"], cz["auto+oko"]))
    A("## Ile defektów na mapę\n")
    A("| mapa | nazwa | razem | waga 3 | waga 2 | waga 1 |")
    A("|---|---|---|---|---|---|")
    for m in maps:
        rr = [r for r in rows if r["mapa"] == m]
        c = collections.Counter(r["waga"] for r in rr)
        A("| %d | %s | %d | %d | %d | %d |" % (m, nazwa_mapy(m), len(rr), c[3], c[2], c[1]))
    A("\n## Ile defektów na kategorię\n")
    tot = collections.Counter(r["kat"] for r in rows)
    A("| kategoria | razem | mapy (liczba) |")
    A("|---|---|---|")
    for k, n in tot.most_common():
        ms = ", ".join("%d(%d)" % (m, per[m][k]) for m in maps if per[m][k])
        A("| %s | %d | %s |" % (k, n, ms))
    A("\n## Mapa x kategoria (tylko niepuste)\n")
    for m in maps:
        A("- **%d %s**: " % (m, nazwa_mapy(m)) + "; ".join("%s %d" % (k, n) for k, n in per[m].most_common()))
    A("\n## Najgorsze miejsca (waga 3)\n")
    A("| mapa | kratki | kategoria | opis | obrazek |")
    A("|---|---|---|---|---|")
    for r in sorted([r for r in rows if r["waga"] == 3], key=lambda r: (r["mapa"], r["y"], r["x"])):
        A("| %d | %d,%d (%dx%d) | %s | %s | [%d/%s](%d/%s.png) |" % (r["mapa"], r["x"], r["y"], r["w"], r["h"], r["kat"], r["opis"].replace("|", "/"), r["mapa"], r["id"], r["mapa"], r["id"]))
    A("\n## Pełna lista (wg map)\n")
    for m in maps:
        A("\n### Mapa %d - %s\n" % (m, nazwa_mapy(m)))
        A("| # | kratki | kategoria | co jest nie tak | jak naprawić | waga | źródło | obrazek |")
        A("|---|---|---|---|---|---|---|---|")
        for r in [r for r in rows if r["mapa"] == m]:
            A("| %s | %d,%d (%dx%d) | %s | %s | %s | %d | %s | ![](%d/%s.png) |" % (r["id"], r["x"], r["y"], r["w"], r["h"], r["kat"], r["opis"].replace("|", "/"), r["naprawa"].replace("|", "/"), r["waga"], r["zrodlo"] + (" " + r["kod"] if r["kod"] else ""), m, r["id"]))
    open(os.path.join(OUT, "LISTA.md"), "w", encoding="utf-8", newline="\n").write("\n".join(out) + "\n")
    js = [{"mapa": r["mapa"], "nazwa_mapy": nazwa_mapy(r["mapa"]), "id": r["id"], "x": r["x"], "y": r["y"], "w": r["w"], "h": r["h"], "kategoria": r["kat"], "opis": r["opis"], "naprawa": r["naprawa"],
          "waga": r["waga"], "zrodlo": r["zrodlo"], "kod_detektora": r["kod"], "obrazek": "docs/przeglad_ekranow/%d/%s.png" % (r["mapa"], r["id"])} for r in rows]
    json.dump(js, open(os.path.join(OUT, "lista.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("LISTA.md", len(rows), dict(cw), dict(cz))


if __name__ == "__main__" and sys.argv[1] == "raport":
    raport()
