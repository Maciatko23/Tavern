# -*- coding: utf-8 -*-
"""PRZEGLĄD MAP (tools/mapy/przeglad.py): kontrola (kontrola.py) wszystkich map zrobionych przez agentów i zbiorczy raport
docs/mapy/PRZEGLAD.md z obrazkami docs/mapy/kontrola_MapNNN.png.

Użycie:  python tools/mapy/przeglad.py            (albo: python tools/mapy/kontrola.py --przeglad)
Mapy: wnętrza agentów (102-117, 121-128, 156, 160, 161, 163, 166, 169, 171-177, Map019) i nowe części map powiększonych
2026-10-19 (tools/powieksz/stan.json). Dla porównania te same liczby dla map wzorcowych (bez obrazków).
Nic nie zapisuje do data/ ani js/.
"""
import os, sys, collections, datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mapylib as L
import kontrola as K

WNETRZA = [19] + [m for m in range(102, 118) if m != 111] + [121, 122, 123, 124, 126, 127, 128, 156, 160, 161, 163, 166, 169,
                                         171, 172, 173, 174, 176, 177]
POWIEKSZONE = [3, 4, 17, 18, 20, 21, 22, 23, 13, 8, 24, 111, 120, 125, 155, 157, 159, 162, 165, 168, 175]
TLO = [1, 25, 26]          # mapy wzorcowe wnętrz: ile „problemów” znajduje kontrola w dobrych mapach (szum)
MAX_LINII = 30


def licz(probs, waga=None):
    c = collections.Counter()
    for p in probs:
        if p.get("ukryj"): continue
        if waga and p["waga"] != waga: continue
        c[p["kod"]] += 1
    return c


def zrob():
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8")
    K.katalog()
    wyniki = []
    for mid in WNETRZA + POWIEKSZONE:
        if not os.path.exists(L.DATA + "Map%03d.json" % mid): continue
        r = K.kontroluj(mid, nowe=mid in POWIEKSZONE, obrazek_tak=True, quiet=True)
        r["grupa"] = "nowa część powiększonej mapy" if mid in POWIEKSZONE else "wnętrze"
        wyniki.append(r)
        print("Map%03d %-32s %s" % (mid, r["nazwa"][:32], dict(licz(r["problemy"]))))
    tlo = []
    for mid in TLO:
        r = K.kontroluj(mid, obrazek_tak=False, quiet=True)
        tlo.append(r)
    uzytk = []
    for mid in UZYTKOWNIKA:
        if not os.path.exists(L.DATA + "Map%03d.json" % mid): continue
        r = K.kontroluj(mid, obrazek_tak=False, quiet=True)
        if any(p["waga"] != "info" and not p.get("ukryj") for p in r["problemy"]):
            mp = L.Mapa(mid)
            r["png"] = K.obrazek(mp, [p for p in r["problemy"] if p["waga"] != "info"],
                                 os.path.join(L.DOCS, "uzytkownik_Map%03d.png" % mid), max_px=None if mp.wnetrze else 1800)
        uzytk.append(r)
    md = tekst(wyniki, tlo) + etap2(uzytk)
    L.save_text(L.DOCS + "PRZEGLAD.md", md)
    print("zapisano", L.DOCS + "PRZEGLAD.md")
    return wyniki


def tekst(wyniki, tlo):
    dzis = datetime.date.today().isoformat()
    out = []
    w = out.append
    w("# Przegląd map zrobionych przez agentów (etap 1)")
    w("")
    w("Data: %s. Narzędzie: `python tools/mapy/przeglad.py` (kontrola jednej mapy: `python tools/mapy/kontrola.py 105`)." % dzis)
    w("Stan map w chwili przeglądu (etap 1: lista problemów; etap 2: poprawki map agentów - sekcja „Po etapie 2” na końcu, "
      "tam też „Do poprawy przez użytkownika”).")
    w("")
    w("Sprawdzone: %d wnętrz (102-117, 121-128 bez 125, 156, 160, 161, 163, 166, 169, 171-177 bez 175, Map019) i nowe części "
      "%d powiększonych map (2026-10-19: wszystko na prawo od starej szerokości i pod starą wysokością; stara część na obrazkach "
      "jest przyciemniona)." % (sum(1 for r in wyniki if r["grupa"] == "wnętrze"), sum(1 for r in wyniki if r["grupa"] != "wnętrze")))
    w("Wiedza o kaflach (blaty, obiekty, gwiazdki, wyjątki) pochodzi z map wzorcowych: %s (`tools/mapy/katalog.json`)." %
      ", ".join("Map%03d" % m for m in L.WZORCE))
    w("")
    w("## Kody problemów")
    w("")
    w("| kod | co znaczy | waga |")
    w("|---|---|---|")
    for kod in sorted(K.OPISY):
        w("| %s | %s | %s |" % (kod, K.OPISY[kod], K.WAGA[kod]))
    w("")
    w("Waga: **błąd** psuje grę (nie da się wejść, wyjść, bohater wchodzi na mebel), **uwaga** psuje wygląd albo dostęp do "
      "rzeczy, **info** do decyzji (np. drzewo do ścięcia stoi w gęstym lesie, pokój za drzwiami, które może otwiera fabuła).")
    w("")
    # ---- najczęstsze
    tot = collections.Counter()
    tot_info = collections.Counter()
    maps_with = collections.Counter()
    tot_w = collections.Counter()
    for r in wyniki:
        c = licz(r["problemy"])
        ci = licz(r["problemy"], "info")
        tot += c - ci
        tot_info += ci
        for kod in c - ci: maps_with[kod] += 1
        for p in r["problemy"]:
            if not p.get("ukryj"): tot_w[p["waga"]] += 1
    w("## Najczęstsze problemy")
    w("")
    w("Razem: **%d błędów, %d uwag, %d informacji** w %d mapach (%d map bez żadnej uwagi ani błędu)." % (
        tot_w["błąd"], tot_w["uwaga"], tot_w["info"], len(wyniki),
        sum(1 for r in wyniki if not any(p["waga"] != "info" for p in r["problemy"]))))
    w("")
    w("| kod | co | błędy + uwagi | w ilu mapach | do tego info |")
    w("|---|---|---|---|---|")
    for kod in sorted(set(tot) | set(tot_info), key=lambda k: (-tot[k], -tot_info[k])):
        w("| %s | %s | %d | %d | %d |" % (kod, K.OPISY[kod], tot[kod], maps_with[kod], tot_info[kod]))
    w("")
    w("Dla porównania kontrola map wzorcowych (szum narzędzia: tyle znajduje w mapach uznanych za dobre):")
    w("")
    w("| mapa | znalezione |")
    w("|---|---|")
    for r in tlo:
        c = licz(r["problemy"])
        w("| Map%03d %s | %s |" % (r["mapa"], r["nazwa"], ", ".join("%s %d" % kv for kv in sorted(c.items())) or "nic"))
    w("")
    w("Uwaga do map wzorcowych: Map001 ma pokoje dostępne tylko przez przeniesienia i drzwi obsługiwane przez wtyczki, "
      "więc tam D1 to głównie zaplecze; P2 w tawernie to talerze i świece na przedniej krawędzi stołów - tak wygląda "
      "granica, od której kontrola zaczyna zgłaszać.")
    w("")
    # ---- tabela map
    w("## Mapy")
    w("")
    w("| mapa | nazwa | rodzaj | błędy | uwagi | info | kody | obrazek |")
    w("|---|---|---|---|---|---|---|---|")
    for r in wyniki:
        b = sum(licz(r["problemy"], "błąd").values())
        u = sum(licz(r["problemy"], "uwaga").values())
        i = sum(licz(r["problemy"], "info").values())
        kody = ", ".join("%s %d" % kv for kv in sorted(licz(r["problemy"]).items()))
        w("| Map%03d | %s | %s | %d | %d | %d | %s | [obraz](kontrola_Map%03d.png) |" % (
            r["mapa"], r["nazwa"], r["grupa"], b, u, i, kody or "-", r["mapa"]))
    w("")
    # ---- szczegóły
    w("## Szczegóły")
    w("")
    for r in wyniki:
        probs = [p for p in r["problemy"] if not p.get("ukryj")]
        w("### Map%03d %s" % (r["mapa"], r["nazwa"]))
        w("")
        info = "%dx%d, zestaw %d" % (r["w"], r["h"], r["zestaw"])
        if r["obszar"]: info += "; sprawdzona " + r["obszar"]
        w(info + ".")
        w("")
        w("![Map%03d](kontrola_Map%03d.png)" % (r["mapa"], r["mapa"]))
        w("")
        if not probs:
            w("Brak problemów.")
            w("")
            continue
        main = [p for p in probs if p["waga"] != "info"]
        inf = [p for p in probs if p["waga"] == "info"]
        for p in main[:MAX_LINII]:
            w("- **%s** (%s) %s" % (p["kod"], p["waga"], p["opis"]))
        if len(main) > MAX_LINII:
            rest = collections.Counter(p["kod"] for p in main[MAX_LINII:])
            w("- ... i jeszcze %s (pełna lista: `python tools/mapy/kontrola.py %d%s`)" % (
                ", ".join("%s %d" % kv for kv in sorted(rest.items())), r["mapa"], " --nowe" if r["obszar"] else ""))
        if inf:
            c = collections.Counter(p["kod"] for p in inf)
            przyklady = "; ".join(p["opis"] for p in inf[:3])
            w("- informacje: %s (np. %s)" % (", ".join("%s %d" % kv for kv in sorted(c.items())), przyklady))
        if r.get("drobne_kieszenie"):
            w("- pominięto %d drobnych zamkniętych kieszeni (< 4 kratki, bez zdarzeń)." % r["drobne_kieszenie"])
        w("")
    return "\n".join(out)


# mapy i części map użytkownika (etap 2: nie poprawiane, tylko wypisane): Map001 tawerna, wnętrza z jego pracą pod spodem
# (102, 103, 104, 117 - tools/wnetrza/base), plenery, które edytował (stare części; ich nowe części są w przeglądzie wyżej)
UZYTKOWNIKA = [1, 102, 103, 104, 117, 3, 4, 8, 13, 23, 24, 111]
POPRAWKI_ZRZUTY = [173, 172, 115, 109, 110, 166]


def etap2(uzytk):
    import glob
    out = []
    w = out.append
    w("")
    w("## Po etapie 2 (poprawki map agentów, %s)" % datetime.date.today().isoformat())
    w("")
    w("Narzędzie: `python tools/mapy/popraw.py plan` (plan + kopia robocza `tools/mapy/staging/`), `obrazy` (zrzuty przed / po), "
      "`instaluj` (zapis do `data/` tylko przy zamkniętym edytorze; operacje nakładane na plik z dysku w chwili zapisu, każda "
      "sprawdza starą wartość - zmiana z edytora zatrzymuje mapę). Kopie map sprzed poprawek: "
      "`Tawerna_archiwum_2026-10-18/dane_przed_poprawkami_map/`. Każda mapa sprawdzona kontrolą przed i po: po poprawce żadnych "
      "nowych problemów (wyjątek: martwa kratka za meblem, do 2 kratek, bez zdarzeń). Test dymny w grze (port 9564): każda "
      "poprawiona mapa wczytuje się bez błędów konsoli, przesunięte zdarzenia stoją na nowych miejscach (30/30).")
    w("")
    plany = []
    for f in sorted(glob.glob(os.path.join(L.HERE, "poprawki", "Map*.json"))):
        plany.append(L.load_json(f))
    rodzaje = collections.Counter()
    for pl in plany:
        if not pl.get("zainstalowano"): continue
        for l in pl["log"]: rodzaje[l["kod"]] += 1
    przed = sum(len(pl["przed"]) for pl in plany)
    po = sum(len(pl["po"]) for pl in plany)
    zainst = [pl for pl in plany if pl.get("zainstalowano")]
    w("Razem: **%d map poprawionych**, uwagi na mapach agentów %d -> %d. Poprawki: %s." % (
        len(zainst), przed, po, ", ".join("%s %d" % kv for kv in sorted(rodzaje.items()))))
    w("")
    w("| mapa | nazwa | uwagi przed | po | operacji | zrzut |")
    w("|---|---|---|---|---|---|")
    for pl in plany:
        png = "poprawki_Map%03d.png" % pl["mapa"]
        w("| Map%03d | %s | %d | %d | %d | %s |" % (pl["mapa"], pl["nazwa"], len(pl["przed"]), len(pl["po"]), len(pl["ops"]),
                                                    "[przed / po](%s)" % png if os.path.exists(os.path.join(L.DOCS, png)) else "-"))
    w("")
    w("### Zrzuty przed / po (mapy z największą liczbą uwag)")
    w("")
    for mid in POPRAWKI_ZRZUTY:
        w("![Map%03d przed i po](poprawki_Map%03d.png)" % (mid, mid))
        w("")
    w("### Co zrobiono na każdej mapie")
    w("")
    for pl in plany:
        if not pl["log"] and not pl["pominiete"]: continue
        w("**Map%03d %s**%s" % (pl["mapa"], pl["nazwa"], "" if pl.get("zainstalowano") else " (bez zmian)"))
        w("")
        for l in pl["log"]:
            gdzie = "" if l["x"] < 0 else " (%d,%d)" % (l["x"], l["y"])
            w("- %s%s: %s" % (l["kod"], gdzie, l["poprawka"]))
        for pm in pl["pominiete"]:
            w("- zostaje %s (%d,%d): %s" % (pm["kod"], pm["x"], pm["y"], pm["dlaczego"][:220]))
        w("")
    w("### Zostawione do decyzji użytkownika (mapy agentów)")
    w("")
    w("- **Map104 Ratusz** (mapa użytkownika, świeca dodana przez agenta): świeca (zdarzenie 18) na przedniej krawędzi biurka; "
      "obok są globus i zwój - nie ma wolnego miejsca na blacie. Przesunąć coś na biurku albo usunąć świecę.")
    w("- **Map108 Dzwonnica**: świeca na podłodze przed małym biurkiem z księgą (1,7) - na biurku nie ma miejsca.")
    w("- **Map109 Dom mieszczan**: koszyk (kafel D(4,10)) za tylną krawędzią stołu i świeca na brzegu - stół pełny talerzy; "
      "rzecz na łóżku (13,5).")
    w("- **Map126 Chata Janka**: świeca na przedniej krawędzi stołu (9,8) - na górze stołu miska i dzban.")
    w("- **Map177 Jaskinia przemytników**: stół (zdarzenie 3) ma `<LudOff:24,0>`, ale Ludzie.js przesuwa obraz tylko zdarzeniom "
      "2500-2699 - w grze stół jest narysowany o pół kratki w lewo i wchodzi na wolną kratkę (8,5). Do poprawy w Ludzie.js "
      "(nie ruszałem js/).")
    w("- **Map176 Komora pod menhirami**: urny E(6,13) bez dolnej części niszy - same na posadzce wyglądają dobrze, zostawione.")
    w("- **Map169, Map171, Map115**: pojedyncze martwe kratki za meblami (bez zdarzeń) - nie przeszkadzają.")
    w("- **Plenery (nowe części)**: polany zamknięte gęstym lasem (Map125 11 miejsc, Map168, Map013, Map111, Map024) - "
      "przecięcie ścieżki zmienia projekt mapy, więc do decyzji; miejsca tylko z orła (Okolice_Data.js) są celowo nieosiągalne; "
      "drzewa do zbierania w gęstym lesie zostają (informacja).")
    w("- Staging pakietów rozszerzeń (`tools/rozszerzenia/C/Map177.json`, `D/Map176.json`) ma układ sprzed poprawek - instalator "
      "pakietów zatrzyma go teraz kontrolą map (nowe uwagi względem data/).")
    w("")
    w("## Do poprawy przez użytkownika (jego mapy - nie ruszane)")
    w("")
    w("Map001 i mapy / części map robione przez użytkownika. Wypisane tylko błędy i uwagi (bez informacji).")
    w("")
    for r in uzytk:
        probs = [p for p in r["problemy"] if p["waga"] != "info" and not p.get("ukryj")]
        w("### Map%03d %s" % (r["mapa"], r["nazwa"]))
        w("")
        if not probs:
            w("Brak uwag.")
            w("")
            continue
        if r.get("png"): w("![Map%03d](%s)" % (r["mapa"], os.path.basename(r["png"])))
        w("")
        c = collections.Counter(p["kod"] for p in probs)
        w("Razem: %s." % ", ".join("%s %d" % kv for kv in sorted(c.items())))
        w("")
        for p in probs[:25]:
            w("- **%s** %s" % (p["kod"], p["opis"]))
        if len(probs) > 25: w("- ... i jeszcze %d (`python tools/mapy/kontrola.py %d`)" % (len(probs) - 25, r["mapa"]))
        w("")
    return "\n".join(out)


if __name__ == "__main__":
    zrob()
