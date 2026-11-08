# Propozycja: tawerna w środku, mały świat wokół, głębia pod ziemią

Gracz 2026-11-08: „główne wątki na mapie tawerny, na powierzchni tylko miasteczko i dosłownie kilka map na koło - tam dzieje się
cała fabuła (ewentualnie pod ziemią więcej generowanych map)”. To jest PROPOZYCJA - nic w grze nie jest zmienione.
Rysunek: `docs/mapy/rdzen_propozycja.png` (narzędzie `tools/mapy/rdzen_propozycja.py`, tylko czyta).

## W skrócie

| | dziś | po zmianie (wariant B) |
|---|---|---|
| mapy w grze | 146 | 135 |
| mapy świata (powierzchnia na wyspie) | 42 | 31 |
| granice między mapami do dopieszczenia | 86 | 50 |
| mapy, do których dojdziesz pieszo z domu dziadka | 38 | 26 |

- **Tawerna sercem**: wątki zaczynają się i wracają do tawerny (bywalcy, tablica zleceń, Borgar, plotki); ludzi z dalekich miejsc
  lepiej sprowadzać do tawerny niż gracza do nich.
- **Rdzeń** dopieszczony najbardziej; **cele wypraw** każdy jako jedno porządne miejsce, dojazd wozem (już jest: Woz.js, wybór na
  mapie wyspy), łodzią (Wyspy.js) albo orłem; **pod ziemią** generowane piętra (już 100).
- **Znika 11 map** z budowy świata (2026-10-30/31): żadna nie ma zadania, mieszkańca ani miejsca fabuły - tylko teren, drzewa i
  przejścia między sąsiadkami.
- **Na Twoich mapach** zmieniają się tylko krawędzie do znikających map: Łąka pod Gawrą (60 kratek), Skraj lasu (75), Góry (24),
  Podgrodzie (11) - zamknięte naturalnie (brzeg, skarpa, las), nigdy niewidzialną ścianą; każda pokazana przed / po.
- **Wariant A** (pełny: znika też Sady pod dworem i Przesieka pod Murami) daje 42 granice zamiast 50, ale zamyka po 80-113 kratek
  krawędzi na Posiadłości, Okolicach i Podgrodziu - dlatego polecam B.

## Rdzeń - chodzi się pieszo, bez szwów, najbardziej dopieszczone (12)

| mapa | nazwa | co na niej jest | co się zmieni |
|---|---|---|---|
| 3 | Kruczy Jar | fabuła (start, tawerna, miasto, Lord) | zostaje bez zmian |
| 4 | Łąka pod Gawrą | zadania: K64; mieszka 1 os. | północna krawędź (60 kratek do Pól pod grzbietem) zamknięta naturalnie - brzeg lasu / skarpa |
| 8 | Okolice Tawerny | zadania: D1, D10, D11, D14, D16, D17, D18, D21 …; mieszka 54 os.; fabuła (start, tawerna, miasto, Lord) | zostaje bez zmian |
| 13 | Góry i kamieniołom | zadania: D40, W8 | zachodnia krawędź (24 kratki do Zach. Stoku Gór) zamknięta naturalnie - skała |
| 20 | Dom dziadka - Podwórze | zadania: W4; fabuła (start, tawerna, miasto, Lord) | zostaje bez zmian |
| 22 | Polna droga | zadania: K3, K65; mieszka 1 os. | zostaje bez zmian |
| 23 | Skraj lasu | - | krawędź do Pól pod grzbietem (75 kratek) zamknięta naturalnie |
| 24 | Posiadłość Lorda | zadania: D17, D32, K30, K31, K32, W1, W13; mieszka 2 os.; fabuła (start, tawerna, miasto, Lord) | zostaje bez zmian |
| 111 | Podgrodzie | zadania: D20, D21, D31, K40, K41, K42, K43, K44 …; mieszka 12 os. | 11 kratek krawędzi do Stoku nad Garnizonem zamknięte (Garnizon dalej przez zachodnią bramę) |
| 125 | Przystań | zadania: D20, D25, D34, D40, K47, K48, K51, W10; mieszka 4 os. | zostaje bez zmian |
| 901 | Sady pod dworem | - | zostaje bez zmian |
| 961 | Przesieka pod Murami | - | zostaje bez zmian |

## Tereny dzikie przy rdzeniu - łowy, zbieractwo, kilka zadań (zostają) (4)

| mapa | nazwa | co na niej jest | co się zmieni |
|---|---|---|---|
| 17 | Omszała łąka | zadania: D30; mieszka 1 os. | granica z Zatoką Kłód (80 kratek) zamknięta - brzeg zatoki |
| 18 | Łąka menhirów | - | traci dojście pieszo (dziś przez Sosnowy Klif / Łąkę pod Klifem) - postój wozu albo przejście z Leśnej drogi |
| 21 | Leśna droga | - | zostaje bez zmian |
| 168 | Spalona zagroda | - | granice z Polami, Ugorami i Zatoką Kłód zamknięte - dalej od Skraju lasu |

## Cele wypraw - jedno porządne miejsce, dojazd wozem / łodzią / orłem (7)

| mapa | nazwa | co na niej jest | co się zmieni |
|---|---|---|---|
| 120 | Osada Milczących | zadania: W8 | granica z Miedzami zamknięta - dalej od Polnej drogi / Gór |
| 155 | Pustelnia na klifie | zadania: D23, D40, K50, K68, K69, W13, W4; mieszka 1 os. | granice z Sosnowym Klifem i Zboczem zamknięte - dojście od Garnizonu / Przystani (wóz, łódź) |
| 157 | Urwisko Kruków | zadania: D40 | granica ze Stokiem nad Garnizonem i Zach. Stokiem zamknięta - zostaje od Przesieki |
| 159 | Przylądek z latarnią | zadania: D22, D29, D40, K49, K69; mieszka 3 os. | granica z Polami pod grzbietem zamknięta - dojście z Łąki pod Gawrą / wozem |
| 162 | Garnizon nad zatoką | zadania: D26, D40, K52, K61, K66; mieszka 5 os. | granice ze Zboczem i Stokiem zamknięte - dalej od Podgrodzia (zachodnia brama) |
| 165 | Wrak na mieliźnie | - | granice ze Zboczem i Łąką pod Klifem zamknięte - łacha od Garnizonu jak dziś |
| 175 | Orla Grań | - | bez zmian w dojściu (wspinaczka / orzeł) |

## Wysepki (Wyspy.js) - łacha, łódka, orzeł (już tak jest) (8)

| mapa | nazwa | co na niej jest | co się zmieni |
|---|---|---|---|
| 914 | Zatoczka pod ogonem | - | zostaje bez zmian |
| 917 | Wyspa Kormoranów | - | zostaje bez zmian |
| 918 | Wysepka Samotnej Sosny | - | łacha szła z Sosnowego Klifu - łacha z Łąki menhirów albo łódka |
| 920 | Wyspa Solna | - | zostaje bez zmian |
| 922 | Wyspa Przemytników | - | zostaje bez zmian |
| 923 | Kamień Rybaków | - | zostaje bez zmian |
| 935 | Orla Iglica | - | bez zmian (tylko orzeł) |
| 951 | Skała Strażnicza | - | zostaje bez zmian |

## Do usunięcia - mapy z budowy świata, bez zadań i ludzi (11)

| mapa | nazwa | co na niej jest | co się zmieni |
|---|---|---|---|
| 900 | Pola pod grzbietem | - | znika (z listy świata, mapy wyspy, danych brzegu / łąki; plik do archiwum) |
| 910 | Sosnowy Klif | - | znika (z listy świata, mapy wyspy, danych brzegu / łąki; plik do archiwum) |
| 912 | Ugory za Spaloną Zagrodą | - | znika (z listy świata, mapy wyspy, danych brzegu / łąki; plik do archiwum) |
| 931 | Grań nad szczytem | - | znika (z listy świata, mapy wyspy, danych brzegu / łąki; plik do archiwum) |
| 933 | Zatoka Kłód | - | znika (z listy świata, mapy wyspy, danych brzegu / łąki; plik do archiwum) |
| 934 | Miedze za Osadą | - | znika (z listy świata, mapy wyspy, danych brzegu / łąki; plik do archiwum) |
| 950 | Zbocze pod Pustelnią | - | znika (z listy świata, mapy wyspy, danych brzegu / łąki; plik do archiwum) |
| 960 | Stok nad Garnizonem | - | znika (z listy świata, mapy wyspy, danych brzegu / łąki; plik do archiwum) |
| 962 | Zachodni Stok Gór | - | znika (z listy świata, mapy wyspy, danych brzegu / łąki; plik do archiwum) |
| 963 | Łąka pod Klifem | - | znika (z listy świata, mapy wyspy, danych brzegu / łąki; plik do archiwum) |
| 964 | Zachodni Brzeg | - | znika (z listy świata, mapy wyspy, danych brzegu / łąki; plik do archiwum) |

## Wnętrza w rdzeniu (zostają: 64)

Tawerna, dom dziadka, budynki miasta i Podgrodzia, dwór, kantor, domy mieszkańców (żeby nikt nie znikał - ludzie wchodzą i wychodzą
drzwiami), domy na wypadek utraty działki.

| mapa | nazwa | co na niej jest |
|---|---|---|
| 1 | TAWERNA | zadania: D13, K22, K33, W4; fabuła (start, tawerna, miasto, Lord) |
| 2 | Domek - Wnętrze | - |
| 9 | Piwnica Tawerny | - |
| 12 | Mroczny Las | - |
| 19 | Dom dziadka - Wnętrze | zadania: D24, K32, K57, W10, W13, W4, W6; fabuła (start, tawerna, miasto, Lord) |
| 25 | Pokoje gości | zadania: W6 |
| 26 | Apartamenty | - |
| 100 | Chatka - Wnętrze | - |
| 102 | Piekarnia | zadania: D4, D42, K4, K5, K6; dom: piekarka |
| 103 | Kantor | zadania: K15, K16; dom: kupiec |
| 104 | Ratusz | zadania: D17, D21, D3, K17, K19; dom: soltys |
| 105 | Dom kowala | zadania: D1, D3, D6, K1, K2, K3, K63, W1 …; dom: kowal |
| 106 | Dom garbarza | zadania: D1, D18, D3, K10, K20, K21, K22; dom: garbarz |
| 107 | Dom woziwody | zadania: K8, K9; dom: woziwoda |
| 108 | Dzwonnica | zadania: D16, D37, K13, K14, K55, K67, W2, W6; dom: dzwonnik |
| 109 | Dom mieszczan | zadania: K26; dom: bronek, zosia |
| 110 | Izba pod skałą | - |
| 112 | Chata praczki | zadania: D20, D21, K40, K46, K58, K62; dom: praczka, franek |
| 113 | Chata drwala | zadania: D20, K44, K63; dom: drwal |
| 114 | Chata kłusownika | zadania: K45; dom: klusownik |
| 115 | Izba znachorki | zadania: K41, K56; dom: znachorka |
| 116 | Kram starzyzny | zadania: D21, D31, K42; dom: szmaciarz |
| 117 | Dom uchodźców | zadania: K43; dom: uchodzca |
| 119 | Archiwum zakonu | zadania: W2 |
| 126 | Chata Janka | zadania: D20, K47, K48, W10; dom: janek |
| 127 | Szopa przy pochylni | zadania: D20, D25, K51; dom: przemytnik |
| 128 | Komora celna | zadania: D34; dom: celnik |
| 154 | Chata pod lasem | - |
| 169 | Dom Ługów | - |
| 171 | Piwnica kantoru | - |
| 172 | Dwór - Hol | - |
| 173 | Dwór - Biblioteka | - |
| 174 | Dwór - Gabinet | - |
| 178 | Kaplica | - |
| 179 | Dom grabarza | dom: grabarz |
| 180 | Strażnica Lorda | zadania: D11, D14, D3, D5, K11, K12, K38; dom: kapral |
| 181 | Stajnia z wozownią | dom: kolodziej |
| 182 | Dom 1 (przekupka Agata) | dom: przekupka |
| 183 | Dom 2 (kamienica mieszczan) | - |
| 184 | Dom 3 (szwaczka Dorota) | dom: szwaczka |
| 185 | Dom 4 (wdowa Halina z dziećmi) | dom: wdowa, kostek, jagodka |
| 186 | Dom 5 (stary dom kupca) | - |
| 187 | Dom 6 (cieśla Leon) | dom: ciesla |
| 188 | Dom 7 (para staruszków) | - |
| 189 | Dom 8 (weteran Wacław) | dom: weteran |
| 190 | Dom 9 (izba do wynajęcia) | - |
| 193 | Dom 10 (przy piekarni) | - |
| 194 | Dom 11 (kamienice przy ulicy południowej) | - |
| 195 | Dom 12 (bliźniak domu staruszków) | - |
| 196 | Dom 13 (dom z lukarnami na wschodzie) | - |
| 197 | Dom 14 (obok domu weterana) | - |
| 198 | Dom 15 (przy cmentarzu) | - |
| 201 | Szynk | dom: szynkarz |
| 202 | Przytułek | dom: opiekunka |
| 203 | Garncarnia | dom: garncarz |
| 204 | Lepianka 1 (rodzina z dzieckiem) | dom: dziecko |
| 205 | Lepianka 2 (wdowa z kozą) | - |
| 206 | Chata 3 (węglarz) | - |
| 207 | Chata 4 (tkaczka) | - |
| 208 | Chata 5 (stary rybak) | - |
| 209 | Chata pod strzechą | - |
| 210 | Chałupa z desek | - |
| 211 | Szopa | - |
| 212 | Komórka | - |

## Wnętrza celów wypraw (zostają razem ze swoim miejscem: 10)

| mapa | nazwa | należy do |
|---|---|---|
| 121 | Wspólna izba | Osada Milczących |
| 122 | Chata tkaczki | Osada Milczących |
| 123 | Chata Najstarszego | Osada Milczących |
| 124 | Chata rzeźbiarza | Osada Milczących |
| 156 | Skryptorium | Pustelnia na klifie |
| 160 | Izba latarnika | Przylądek z latarnią |
| 161 | Laterna | Przylądek z latarnią |
| 163 | Kwatera rotmistrza | Garnizon nad zatoką |
| 166 | Wrak - pod pokładem | Wrak na mieliźnie |
| 167 | Stara cysterna zakonu | Pustelnia na klifie |

## Pod ziemią (zostaje, tu może być więcej generowanych map: 30)

10 Ruiny Zamku, 11 Komnata Serca, 14 Jaskinia, 118 Dno studni, 130 Podziemia: kawałki (pasmo 1), 131 Podziemia: piętro 1, 132 Podziemia: piętro 2, 133 Podziemia: piętro 3, 134 Podziemia: piętro 4, 135 Podziemia: piętro 5, 136 Podziemia: piętro 6, 137 Podziemia: piętro 7, 138 Podziemia: piętro 8, 139 Podziemia: piętro 9, 140 Podziemia: piętro 10 (Strażnica), 141 Podziemia: kawałki (pasmo 2), 142 Podziemia: kawałki (pasmo 3), 143 Podziemia: kawałki (pasmo 4), 144 Podziemia: kawałki (pasmo 5), 145 Podziemia: piętra 11-99 (skorupa), 146 Podziemia: piętro 20 (Sala jednego pytania), 147 Podziemia: piętro 30 (Wielka cysterna), 148 Podziemia: piętro 40 (Bród Milczącej), 149 Podziemia: piętro 50 (Przekop kopaczy), 150 Podziemia: piętro 60 (Brama Pierwszych), 151 Podziemia: piętro 70 (Sala płaskorzeźb), 152 Podziemia: piętro 80 (Sala echa), 153 Podziemia: piętro 90 (Ostatnia straż), 176 Komora pod menhirami, 177 Jaskinia przemytników

## Robocze (nie w grze: 3)

101 Paleta miasteczka (do kopiowania), 990 Mapa próbna A, 991 Mapa próbna B

## Co trzeba by zrobić (po zgodzie, etapami, każdy etap przed / po)

1. Krawędzie Twoich map i map zostających przy znikających: brzeg / skarpa / las (obrazy przed / po do zgody).
2. Świat bez 11 map: `docs/mapy/swiat_uklad.json`, `Swiat_Data.js` (przejścia), mapa wyspy (`MapaWyspy_Data.js`, obrazy),
   orzeł (`Orzel_Data.js`), dane brzegu i łąki (przeliczane narzędziami), listy map we wtyczkach (Laka, Ziemia, Wzgorza,
   CzerwonaWoda, Widok); pliki map do archiwum (nie kasowane).
3. Dojazdy: postój wozu dla Łąki menhirów (albo przejście z Leśnej drogi), łacha na Wysepkę Samotnej Sosny.
4. Testy świata (styki, przejścia, mapa wyspy, orzeł, krawędzie) na nowo; pełny przebieg testów - za Twoją zgodą.
5. Dalej: treść przenosić do rdzenia i tawerny (zlecenia, rozmowy), cele wypraw dopieszczać jedno po drugim.
