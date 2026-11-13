# -*- coding: utf-8 -*-
"""Pisze docs/zadania_nowe/dawcy_w_miescie.md (liczby z tabela.py). Uzycie: python tools/dawcy_miasto/dokument.py"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
sys.stdout.reconfigure(encoding="utf-8")
import tabela as TB
a, b = TB.a, TB.b

ZMIANY = [
 ("K40", "Woda na pranie", "Marta Ługowa (praczka)", "Podgrodzie, sznury z praniem 5-17 -> tamże", "oferta i oddanie w tawernie, kącik przy tablicy zleceń, 17:30-20 (pranie tawerny); woda jak dotąd z bukłaka", "Marta pierze też dla tawerny i rozlicza się z Borgarem wieczorem"),
 ("K41", "Zioła dla babki Jadwigi", "Babka Jadwiga (znachorka)", "Podgrodzie, ogródek 6-18 -> tamże", "oferta i oddanie w tawernie, stolik przy tablicy, 18-21; zioła zbierane na łąkach jak dotąd", "znachorka leczy gości i zbiera zamówienia wieczorem"),
 ("K43", "Drewno na ognisko", "Darin z Kontynentu", "Podgrodzie, obóz 17-22 -> tamże", "oferta i oddanie w tawernie, przy kominku w sieni, 17:30-21:30 (drewno zaniesie do obozu)", "uchodźca spędza wieczór w cieple tawerny i stamtąd prosi o opał"),
 ("K44", "Lina dla Zbycha", "Zbych Smolarz (drwal)", "Podgrodzie, drewutnia 15-21:30 -> tamże", "oferta i oddanie w tawernie, przy kominku w sieni, 17:30-21:30 (poza dniami wypału na Łące)", "po robocie drwal siada u Borgara; węgiel i tak idzie do miasta"),
 ("K45", "Włókno na pętle", "Rysiek Sidło (kłusownik)", "Podgrodzie 13-20 -> tamże", "oferta i oddanie w tawernie, ciemny kąt przy kominku, 19:30-22:30; noc w lesie jak dotąd", "kłusownik sprzedaje zające karczmarzowi i omawia sprawy po cichu, nie na ulicy"),
 ("K46", "Suchar dla Franka", "Franek (syn Marty)", "Podgrodzie 7-19 -> tamże", "oferta i oddanie w tawernie, przy mamie, 17:30-19:30", "chłopiec chodzi z matką do tawerny nosić kosz z praniem"),
 ("K47", "Pierwszy połów", "Janek (rybak)", "Przystań, pomost 8-20 -> tamże", "oferta i oddanie w tawernie wieczorem 19-22:30 (siedzi przy stole); śledzie łowione w morzu jak dotąd", "Janek już przesiaduje w tawernie wieczorami; zadanie to wieczorne rozliczenie połowu"),
 ("K48", "Sieci po sztormie", "Janek", "Przystań 9-20 -> tamże", "oferta i oddanie w tawernie 19-22:30", "jak K47"),
 ("W10", "List do matki", "Janek", "Przystań (oferta); listy: prom albo kuter Rocha", "oferta w tawernie 19-22:30; wysyłka i odbiór listów na przystani (prom, kuter) i pokazanie listu dziadkowi bez zmian", "rozmowa o liście to sprawa wieczoru; sam prom jest miejscem"),
 ("K49", "Tran dla latarni", "Bazyli Krzesiwo (latarnik)", "przylądek 25+ -> tamże", "oferta i oddanie w tawernie 14-17:30 (Bazyli schodzi po tran, piwo i wieści, wozi na przylądek)", "latarnik schodzi w południe do miasta po zaopatrzenie i wraca przed zmierzchem do światła"),
 ("D22", "Księga mgieł", "Bazyli", "laterna, mgła; oferta i rozmowa końcowa przy latarni", "oferta i rozmowa końcowa w tawernie 14-17:30; wizje w soczewce nocą na wieży jak dotąd", "praca zostaje na wieży, ale zapowiedź mgły i rozliczenie wizji to rozmowa w mieście"),
 ("D29", "Jajo z grani", "Bazyli", "przylądek 14-22 -> Góry, Orla Grań", "oferta w tawernie 14-17:30; reszta (Góry, Orla Grań, orzeł) jak dotąd", "orzeł i grań zostają na miejscu, ale zlecenie pada w mieście"),
 ("K69", "Grzędy Straży", "Bazyli", "przylądek 14-22 -> Orla Grań -> pustelnia", "oferta w tawernie 14-17:30; grań i oddanie u Kleofasa jak dotąd", "j.w.; oddanie u Kleofasa należy do agenta od pustelni"),
 ("K52", "Drewno dla garnizonu", "Kwatermistrz Kłos", "garnizon, kuchnia 8-18 -> tamże", "oferta i oddanie w tawernie 17-19:30 (Kłos kupuje opał w mieście, wozem do garnizonu)", "kwatermistrz sam skupuje zaopatrzenie; po służbie zachodzi do Borgara"),
 ("D34", "Jaskinia pod zatoczką", "Sambor Kwit (celnik)", "przystań 8-18 -> tamże", "oferta i oddanie skrzyni w tawernie 19:30-21:30 (Sambor po służbie) albo u Baltazara w kantorze; jaskinia w odpływie jak dotąd", "celnik po służbie przesiaduje w tawernie; takie sprawy załatwia się nie na nabrzeżu"),
 ("K56", "Ogródki Podgrodzia", "Babka Jadwiga", "Podgrodzie 6-18; praca rano", "oferta w tawernie 18-21; praca w ogródkach rano 6-12 jak dotąd (brak oddania)", "j.w. K41"),
 ("K58", "Sad Ługów", "Marta Ługowa", "Podgrodzie 5-17 -> tamże", "oferta i meldunek w tawernie 17:30-20; sad na Spalonej zagrodzie bez zmian", "j.w. K40"),
 ("K62", "Krasula i kury Ługów", "Marta Ługowa", "Podgrodzie 6-19; praca na łąkach", "oferta w tawernie 17:30-20; praca na łąkach jak dotąd (brak oddania)", "j.w. K40"),
 ("D31", "Skarby wysypiska", "Józek Łata", "Podgrodzie 7-20 -> kram", "oferta i oddanie w tawernie 19-22; szukanie na wysypisku jak dotąd", "handlarz starzyzną wieczorem kupuje od gości; wysypisko to tylko praca"),
 ("D21", "Spalona zagroda", "Józek, Marta, sołtys", "Podgrodzie (Józek, Marta), ratusz", "rozmowy z Józkiem (19-22) i Martą (17:30-20, także oddanie konika) w tawernie; sołtys w ratuszu; zgliszcza i odbudowa na zagrodzie", "dwoje świadków wieczorem w jednym miejscu; sołtys już w mieście"),
 ("D20", "Kuter na pochylni", "Roch (przemytnik)", "Przystań, Podgrodzie", "ofertę i finał zostawiam na przystani; pośrednie rozmowy w tawernie: Janek (19-22:30), Zbych (17:30-21:30), Marta (17:30-20)", "Roch pozostaje na przystani (jego wizytę w tawernie zakłada agent od K51)"),
]
ZOSTAJA = [
 ("K42", "zbijanie daszka młotkiem przy samym kramie na Podgrodziu: zadanie o miejscu (sam Józek jest wieczorem w tawernie, ale daszek jest na Podgrodziu)"),
 ("K63, D5, D14, D37, K55, K67", "oferta i oddanie już są w mieście; praca (mielerz, Kruczy Jar, ule, kapliczki, cmentarz) poza murami - zgodne z zasadą"),
 ("D30", "Zioła Jagny: dawczyni mieszka na polanie, poranna rosa i źródełka to miejsce; Jagna ma w tawernie swoje ogłoszenia na tablicy (zioła)"),
 ("K64, K65", "Zabłąkana owca i Zgubiony juk: pasterz i wędrowny handlarz mieszkają na drodze, a zguba idzie za bohaterem po mapach; nowe ogłoszenie Wawrzyna (wełna) wisi na tablicy w tawernie"),
 ("D32", "Gajowy i kłusownik: gajowy trzyma park Lorda (sidła, nocna zasadzka): zadanie o miejscu"),
 ("K61", "Zawody strzeleckie: strzelnica garnizonu to miejsce konkursu, nagroda wpada przy strzelnicy"),
 ("K66", "Nocny patrol: obchód przylądka nocą, rotmistrz nie opuszcza garnizonu"),
 ("D25", "Mapa z wraku: wrak i kajuta to miejsce; Roch zostaje na przystani"),
 ("K59, K60, D33, D35, D36, D38, D28", "odkrycia miejsc (nora, lizawka, obóz łowców, szyb, menhiry, gaj Milczących, cysterna): nie mają dawcy, zaczynają się same na miejscu"),
 ("W13", "Skrzydlata Straż: dom, Orla Grań, kaplica, dwór - wątek orła"),
 ("K32, K57", "list od dziadka i studnia Rzepków: dziadek mieszka na działce, sprawy rodzinne"),
 ("K50, D23, K51, D24, K53, D40, K68", "przenosi je osobny agent (pustelnia) - nie dotykam"),
 ("W4, W5, W8, W9, W11, D26, D27, D43, K70", "wątki zaczynające się w mieście i kończące w terenie albo odwrotnie; ich miejsca terenowe (kopalnia, Osada, podziemia, garnizon, wrak) zostają"),
]
VIS = [("Marta Ługowa (praczka)", "17:30-20", "6,50 (kącik przy tablicy zleceń)", "stoi"), ("Franek", "17:30-19:30", "5,50 (przy mamie)", "stoi"),
       ("Zbych Smolarz", "17:30-21:30 (poza dniami wypału)", "23,50 (hol, kominek)", "stoi"), ("Darin", "17:30-21:30", "22,51 (hol, kominek)", "stoi"),
       ("Babka Jadwiga", "18-21", "8,50 (przy planie karczmy)", "stoi"), ("Józek Łata", "19-22", "20,51 (hol, kominek)", "stoi"),
       ("Rysiek Sidło", "19:30-22:30", "23,52 (hol, ciemny kąt)", "stoi"), ("Janek (już bywał)", "19-22:30", "gosc_8 (stół, jak dotąd)", "siedzi (ma arkusz)"),
       ("Sambor Kwit (celnik)", "19:30-21:30", "9,31 (przy ladzie)", "stoi"), ("Bazyli Krzesiwo", "14-17:30", "17,31 (przy ladzie)", "stoi"),
       ("Kwatermistrz Kłos", "17-19:30", "19,31 (przy ladzie)", "stoi")]
BOARD = [("Janek (przystań)", "herring_janek", "Śledź (173)", "4"), ("Bazyli (latarnia)", "tran_bazyli", "Tran (177)", "12"), ("Kłos (garnizon)", "wood_klos", "Drewno (61)", "8"),
         ("Wawrzyn (pastwisko)", "wool_wawrzyn", "Wełna (111), wiosna-jesień", "10"), ("Zbych (mielerz)", "kiln_zbych", "Drewno (61)", "1")]

def doc():
    L = []; w = L.append
    w("# Dawcy zadań w tawernie i w mieście\n")
    w("Zasada: **praca może zostać na zewnątrz, ale zlecenie i oddanie dzieją się w tawernie (Map001) albo w mieście (Map008 i jego wnętrza)**, tam gdzie to wiarygodne.")
    w("Dawca odwiedza tawernę o stałych godzinach wieczora (okno wizyty), a oferta i oddanie są dostępne tylko w tym oknie (godziny oferty i kroków = godziny wizyty).")
    w("Ludzie, którzy nie mogą zejść do miasta (latarnia, pastwisko, garnizon, kuźnia węglarza), wieszają zlecenie na **tablicy zleceń w tawernie**, w formacie QuestBoard.\n")
    w("## Liczby (122 zadania)\n")
    w("| | przed | po |\n|---|---|---|")
    w("| oferta **i** oddanie w tawernie / mieście (praca może być poza) | %d | **%d** |" % (len(a[0]), len(b[0])))
    w("| oferta w tawernie / mieście (dowolne oddanie) | %d | **%d** |" % (len(a[3]), len(b[3])))
    w("| mieszane (jeden koniec w mieście, drugi w terenie) | %d | %d |" % (len(a[1]), len(b[1])))
    w("| w całości poza miastem i tawerną | %d | %d |" % (len(a[2]), len(b[2])))
    w("\nKlasyfikacja ręczna: oferta = gdzie dawca daje zadanie; oddanie = gdzie zgłasza się ostatni krok z rozmową (brak oddania = praca na miejscu kończy zadanie). Zadania bez dawcy (odkrycia, wątki) liczone wg miejsca początku i końca. Z %d zadań w całości poza miastem moje są %d; kolejne 6 (K50, D23, K51, D24, K53, K68) przenosi drugi agent, więc po jego pracy liczba spadnie jeszcze o tyle.\n" % (len(a[2]), len(a[2]) - len(b[2])))
    w("## Zadania zmienione (%d)\n" % len(ZMIANY))
    w("| Zadanie | Dawca | Dziś (oferta -> oddanie) | Po zmianie | Powód |\n|---|---|---|---|---|")
    for i, tt, g, d, p, r in ZMIANY: w("| **%s** %s | %s | %s | %s | %s |" % (i, tt, g, d, p, r))
    w("\n## Nowe ogłoszenia na tablicy zleceń (tawerna, Map001)\n")
    w("Format QuestBoard (`QuestBoard_Data.js`: szablon + zleceniodawca, teksty w `js/teksty/tablica.txt`); zlecenie przyjmuje się i oddaje na tablicy w tawernie. Pięciu nowych zleceniodawców z zewnątrz:\n")
    w("| Zleceniodawca | Szablon | Co zbierasz | Od dnia |\n|---|---|---|---|")
    for r in BOARD: w("| %s | `%s` | %s | %s |" % r)
    w("\n## Okna wizyt w tawernie\n")
    w("| Postać | Okno | Miejsce w sali (Map001) | Siedzi? |\n|---|---|---|---|")
    for r in VIS: w("| %s | %s | %s | %s |" % r)
    w("\nNowi goście **stoją** (przy tablicy zleceń, przy kominku w holu, przy ladzie), bo siedzące arkusze (`Przytulna_Siedzi_<Klucz>.png`, ok. 3 generacji PixelLab na postać) ma tylko Janek i dawni goście; posadzenie reszty to osobna praca graficzna.\n")
    w("## Zostają, jak są\n")
    w("| Zadania | Dlaczego |\n|---|---|")
    for i, r in ZOSTAJA: w("| %s | %s |" % (i, r))
    w("\n## Zdjęcia z gry\n")
    for f, d in [("1a_sien_19_10_Marta_Franek_Jadwiga_Jozek_Zbych_Darin.png", "sień tawerny o 19:10: kącik przy tablicy zleceń (Franek, Marta, Jadwiga) i kominek (Józek, Zbych, Darin), wykrzykniki = oferta"),
                 ("1b_sien_20_10_Jadwiga_Jozek_Zbych_Darin_Rysiek.png", "o 20:10: Marta i Franek już poszli, dochodzi Rysiek"),
                 ("2a_lada_18_25_Klos.png", "przy ladzie o 18:25: kwatermistrz Kłos"),
                 ("2b_lada_20_25_Sambor.png", "przy ladzie o 20:25: Sambor Kwit (celnik)"),
                 ("3_lada_popoludnie_Bazyli.png", "przy ladzie po południu: latarnik Bazyli"),
                 ("4_Janek_siedzi_przy_stole_za_nim_stoly_gosci.png", "prawe stoły: Janek siedzi na swoim miejscu (gosc_8) wśród stołowych gości"),
                 ("5_tablica_zlecen_nowe_ogloszenia.png", "tablica zleceń z nowymi ogłoszeniami Kłosa, Bazylego, Zbycha, Wawrzyna i Janka")]:
        w("- `docs/zadania_nowe/dawcy_w_miescie/%s`: %s" % (f, d))
    w("\n## Testy (przed -> po, pass/fail)\n")
    w("Nowy `tests/dawcy_miasto_test.js` (staging/tests): **163/163**: dla każdego zmienionego zadania dawca stoi w tawernie w oknie wizyty na swoim miejscu, poza oknem go nie ma, oferta jest tylko w oknie, rozmowa pokazuje i przyjmuje ofertę, oddanie działa w tawernie; dawni goście (Kowal, Woziwoda, Kupiec, Sołtys, Garbarz, Bartek, Janek, Eryk Sowa) siedzą na swoich numerowanych miejscach; ogłoszenia na tablicy; brak błędów w konsoli.")
    w("\nIstniejące testy (z nakładką; część z błędami już przed zmianą, ich nie ruszam; nic nowego nie padło):\n")
    w("| Test | przed | po |\n|---|---|---|")
    for r in [("quest_board", "27/2", "27/2"), ("przystan", "33/1", "33/1 (kopia testu: K47 teraz wieczorem w tawernie)"), ("garnizon", "34/13", "34/13 (kopia: K52 w tawernie)"), ("latarnia", "13/4", "13/4"),
              ("tavern_life", "28/11", "28/11"), ("goscie_sala", "56/0", "56/0"), ("ludzie", "66/5", "66/5 (kopia: D34 u Sambora w tawernie)"), ("lowy", "38/8", "39/7"), ("zasoby", "60/0", "60/0"),
              ("wrak", "30/1", "30/1 (z łatką Wrak.js; bez niej 21/2: Eryk Sowa traci miejsce)"), ("podroznicy", "24/0", "24/0"), ("podroznicy_sprawy", "22/0", "22/0"), ("town_life", "8/2", "8/2"),
              ("podgrodzie_life", "16/1", "16/1"), ("podgrodzie_mieszkancy", "23/0", "23/0"), ("podgrodzie_quests", "8/0", "9/0 (kopia: K46 wieczorem w tawernie, K42 na Podgrodziu)"),
              ("miasto_mieszkancy", "16/9", "16/9 (losowe okrzyki)"), ("regulars_quests", "34/0", "34/0"), ("town_quests", "55/5", "55/5"), ("town_quests2", "23/1", "23/1")]:
        w("| %s | %s | %s |" % r)
    w("\nTesty jednostkowe (kopia gry z nakładką): quest_board 15/15, tavern_life 17/17, watki 40/40, talk 19/19, core 22/22; `node tools/teksty.js sprawdz` bez nowych błędów (tablica +30 kluczy, żaden klucz nie zniknął).")
    w("Skopiowane i poprawione testy leżą w `tools/dawcy_miasto/staging/tests/` (przystan, garnizon, ludzie, podgrodzie_quests): przy instalacji zastępują oryginały w `tests/`.")
    w("\n## Jak to działa (do instalacji)\n")
    w("- `TownLife.js`: resident z `indoor.tawerna = \"gosc_<klucz>\"` ma własne miejsce w sali i nie zajmuje numeru `gosc_N` (numery Janka, Eryka Sowy itd. bez zmian); jego miejsce wygrywa z numerem.")
    w("- `TownLife_Data.js`: wpisy planów `inside tawerna` (wieczorem), `SPOTS_BY_MAP[1]` (miejsca gości w sali), `SPOTS_BY_MAP[111/162].tawerna` (bramy). **Żadna mapa się nie zmienia** (nie dodaję znaczników `Miejsce:`; `data/` w staging zostaje puste).")
    w("- Zadania (`TownQuests_Data.js`, `Zasoby_Data.js`, `Lowy_Data.js`, `Homes.js`, `Przystan_Data.js`, `Latarnia_Data.js`, `Garnizon_Data.js`, `Ludzie_Data.js`, `Orzel_Data.js`, `Zakon_Data.js`): godziny oferty i kroków = okno wizyty; teksty `where/when/steps` w `js/teksty/*.txt` (zmienione tylko miejsca i godziny, żaden klucz nie skasowany).")
    w("- `QuestBoard_Data.js` + `tablica.txt`: 5 zleceniodawców i 5 szablonów; `EV` dla śledzia i tranu.")
    w("- Konflikt przy instalacji: `tools/questy_mapa/staging/js/plugins/` zawiera inne wersje części tych samych plików (TownLife_Data, Ludzie_Data, Zasoby_Data, Lowy_Data...). `popraw.py` robi dokładne zamiany łańcuchów z `js/`, więc po zainstalowaniu tamtego etapu trzeba go uruchomić jeszcze raz (STOP pokaże, co się przesunęło).")
    w("- Ryzyko: wizyta Rocha w tawernie (K51/D25) jest u agenta od pustelni; ten plan jej nie dotyka. Zbych jest w tawernie poza dniami wypału (co 6 dni dwa dni siedzi na Łące).")
    return "\n".join(L) + "\n"

if __name__ == "__main__":
    out = os.path.join(ROOT, "docs", "zadania_nowe", "dawcy_w_miescie.md")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, "wb").write(doc().encode("utf-8"))
    print("zapisano", out)
