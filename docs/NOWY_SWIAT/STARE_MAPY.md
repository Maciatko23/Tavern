# Stare mapy: co usunąć, co zostawić, co najpierw przenieść (2026-11-17)

Gracz 2026-11-17: „stare mapy możesz całkowicie wywalić”. To jest spis decyzji dla każdej mapy z folderu 223
„STARY ŚWIAT (archiwum)” (81 map) i dla map spoza folderu, do których nie prowadzi żadne zdarzenie. **Nic jeszcze nie
usunięto.** Usuwa skrypt `tools/mapy/usun_stare.py` (opis na końcu), a decyzje czyta z `tools/mapy/stare_mapy.json` -
tam można zmienić werdykt przed uruchomieniem.

## Skrót

| Werdykt | Ile | Mapy |
|---|---|---|
| **USUŃ** | 74 | 2, 4, 8, 12, 13, 17, 18, 20, 21, 22, 23, 24, 27, 101, 109, 110, 111, 117, 120-125 (bez 119), 128, 155, 156, 157, 159, 162, 163, 165, 168, 169, 175, 176, 177, 182, 183, 193-198, 212, 213, 216, 900, 901, 910, 912, 914, 917, 918, 920, 922, 923, 931, 933, 934, 935, 950, 951, 960-964, 990-994 |
| **ZOSTAW** | 3 | 100 (wnętrze własnej chaty gracza), 160 i 161 (latarnia na Słonym Brzegu) - przepiąć w drzewku pod 218 / 219 |
| **PRZENIEŚ** | 4 | 3 Kruczy Jar, 14 Jaskinia, 19 stary dom dziadka, 119 Archiwum zakonu - zostają, aż ich treść przejdzie do nowego świata |

Razem do usunięcia ok. 17 MB plików map. Folder 223 zostaje, dopóki są w nim mapy PRZENIEŚ (potem znika sam).

Dziś (próba skryptu) usunięcie blokują 3 rzeczy - wszystkie do zrobienia przed `--wykonaj`:
1. **Tunel z piętra 50**: zdarzenie 23 na Map149 (Przekop kopaczy) prowadzi na Map014, gdy włączony jest przełącznik 15
   „Gory_TunelKopaczy”; z Map014 wyjście prowadzi na Map013. Po usunięciu Map013 byłby to błąd „Failed to load”.
   Trzeba przestawić tunel (np. na Map225 Sztolnię) albo go wyłączyć - to i tak część przenosin Map014.
2. **wolves_test** (szybki zestaw testów) gra na Map004 - przestawić na mapę nowego świata.
3. **quest_board_test** (szybki zestaw) w kroku `t.go(22, 20, 15, 2)` idzie na Map022 - przestawić.

## Jak to sprawdzono

- **Przejścia w danych**: wszystkie polecenia „Przenieś gracza” (kod 201) we wszystkich 169 mapach, w zdarzeniach
  wspólnych i oddziałach. Od map nowego świata (218-222, 224, 225, 029, 030, startowa 025) da się dojść zdarzeniami do 57 map;
  żadna z nich nie leży w folderze 223. Jedyne przejście z żywego świata do starego: Map149 zdarzenie 23 -> Map014 (wyżej).
- **Szwy świata**: `Swiat_Data.js` (stara plansza 3x3: 162, 24, 13, 111, 8, 4, 125, 3, 20 na współrzędnych y 0-360) i
  `Swiat_Data_Nowy.js` (218-222 na y 1000-1080). Obie części nie stykają się - z nowej mapy nie da się wyjść krawędzią
  (Krawedzie.js) ani przelecieć orłem (Orzel_Lot.js, `OrzelData.NAD` tylko 222/029/030) na starą.
- **Przejścia z wtyczek**: każde `reserveTransfer` w 28 wtyczkach i każde polecenie 201 robione w kodzie (Underground,
  Orzel, Wyspa, Dwor_Data, Homes, Kantor, Cysterna). Opis każdego niżej w „Ryzyka”.
- **Wtyczki, które same czytają pliki map** (XHR): CleanHUD_Compass, Cysterna, Garnizon, Kruk, Latarnia, MenuRing_Rysunki,
  Pustelnia, TavernLife, Wrak - wszystkie znoszą brak pliku (mapa „niezbudowana” / pominięta), a CleanHUD_Compass i
  TavernLife czytają tylko mapy z wpisem w MapInfos.json. Wszystkie użycia `$dataMapInfos[...]` sprawdzają pusty wpis.
- **Lista wtyczek**: `js/tawerna_wtyczki.js` - 235 włączonych, wyłączona tylko Wzgorza.
- **Zapisy**: `save/file0.rmmzsave` stoi na Map126 (nowy świat) - bezpieczny. Zapisy testowe `tests/fixtures`:
  day40_farm na Map003, home_decor_v0 i new_story_day1 na Map019 (obie mapy zostają jako PRZENIEŚ).
- **Decyzje wątków**: `docs/NOWY_SWIAT/SPIS_WATKI.md` (np. Osada Milczących L12, Spalona zagroda S15, Mapa wyspy S13 = ARCHIWUM).

## Mapy z folderu 223

Kolumna „testy”: ile plików testów idzie na tę mapę (`t.go`, `reserveTransfer`, `newGame({map})`) - „zwykłych” = w pełnym
przebiegu, „starego świata” = z `tests/stary_swiat.txt` (już poza zwykłym przebiegiem), „innych skryptów” = zrzuty, pomiary.

| id | nazwa | werdykt | powód / dowód (plik:wiersz) | testy |
|---|---|---|---|---|
| 2 | Domek - Wnętrze | USUŃ | Wnętrze domku na starym Kruczym Jarze; jedyne wyjście prowadzi na Map003. Wtyczki: tylko spis nazw MapaWyspy_Data.js:44 (Jarmark_Sceny.js jej nie używa - sprawdzone). | 1 zwykłych |
| 3 | Kruczy Jar | PRZENIEŚ | Nowy świat tu nie prowadzi, ALE: Farming_Build.js:849 (wyjście z własnej chaty, gdy chaty już nie ma) przenosi na Map003 (48,41); to też plac testowy ~110 zwykłych testów i 3 testów szybkiego zestawu (smoke) oraz zapis testowy day40_farm. Najpierw: poprawić Farming_Build.js:849 na działkę świata (Homes land().out / Map218) i przestawić testy. | 105 zwykłych (smoke: combat_test, journal_test, menu_panel_test, needs_test, smoke/farm, smoke/fixtures, smoke/story); 14 starego świata; 2 innych skryptów |
| 4 | Łąka pod Gawrą | USUŃ | Stara plansza 3x3 (Swiat_Data.js:25). Martwe dane: Osada.js:26 (drzwi do 121-124), Ludzie_Data.js:55, Lowy_Data, Zasoby.js:291, TownQuests_Data.js:210/213 (W8 rozdz. 5 - osada), parametr Hunting. UWAGA: wolves_test (szybki zestaw) gra na tej mapie - skrypt zablokuje, dopóki testu nie przestawisz (albo --mimo-testow). | 20 zwykłych (smoke: wolves_test); 5 starego świata; 2 innych skryptów |
| 8 | Kruczogród | USUŃ | Stary Kruczogród (plansza 3x3, Swiat_Data.js:25); nowe miasto to Map220. Martwe dane: TownLife_Data.js:1320 (MAP 8), TownQuests.js:89 (TOWN=8), Konie.js:40, Cysterna_Data.js:39 (rynny K53), Poselstwo_Data.js:50 (W14), Kruk.js:76, Woz.js:64, Zasoby.js:385. | 30 zwykłych; 23 starego świata; 9 innych skryptów |
| 12 | Mroczny Las | USUŃ | Mroczny Las: żadne przejście (zdarzenie ani wtyczka) tu nie prowadzi, także ze starych map. Tylko listy: Mood.js:411, parametr Hunting. | - |
| 13 | Góry i kamieniołom | USUŃ | Stare góry (plansza 3x3); nowe to Map222/225/029/030. Martwe dane: Orzel_Data.js:38 (GORY=13, ścieżka już nieużywana - orzeł na Map030), Zasoby.js:294, Ludzie_Data.js:55, Zakon_Data.js:66. UWAGA: skrypt zablokuje jej usunięcie, dopóki tunel z Map149 prowadzi na Map014 (wyjście Map014 -> Map013) - najpierw odciąć/przestawić tunel. | 6 zwykłych; 4 starego świata |
| 14 | Jaskinia | PRZENIEŚ | Jaskinia kopaczy: wątek W6 rozdz. 7 (TownQuests.js:2098 CAVE=14) szuka zdarzeń "Marek" i "Strażnik obozu" w TYM pliku mapy; W8 rozdz. 6 - pojedynek przy tunelu (znacznik "tunel_wejscie", TownQuests.js:3480). Map149 (piętro 50, w nowym świecie) ma zdarzenie 23 -> Map014 przy przełączniku 15. Najpierw przenieść to do Map225 (Sztolnia; W8 już ma tam w8_cave/w8_crate) i przestawić tunel z Map149. | 3 zwykłych; 1 starego świata |
| 17 | Omszała łąka | USUŃ | Stara łąka (sąsiad starej planszy); wejścia tylko ze starych map 23 i 933. Martwe dane: Okolice_Data.js:174/183/209. | 1 zwykłych; 1 starego świata |
| 18 | Łąka menhirów | USUŃ | Stara łąka menhirów; wejście tylko z Map910 (stara). Martwe dane: Okolice_Data.js:186/208, Ludzie_Data.js:55. | 1 starego świata |
| 19 | Dom dziadka - Wnętrze | PRZENIEŚ | Stary dom dziadka. Nowy dom to Map224, ale tu nadal żyją: HomeLife.js:90 (MAP=19: dzień dziadka, kot Mruczek), HomeDecor (parametr mapId 19, HomeDecor.js:107), HomeAmbience (parametr maps "19"), Orzel.js:261 (dziadek karmi pisklę tylko na 19), Debug.js:843 (F9 "kot": przeniesienie na 19 BEZ sprawdzenia). Zapisy testowe home_decor_v0 i new_story_day1 stoją na tej mapie (smoke). Najpierw przenieść to na Map224. | 15 zwykłych (smoke: home_decor_test, smoke/fixtures, smoke/story); 5 starego świata |
| 20 | Dom dziadka - Podwórze | USUŃ | Stare podwórze dziadka; Story.js:169 (świat "stary": yard 20) - tylko gry/zapisy starego świata. Nowy świat używa Map218. | 1 zwykłych; 3 starego świata |
| 21 | Leśna droga | USUŃ | Stara Leśna droga; nic tu nie prowadzi (mapa poza planszą). Martwe dane: Okolice_Data.js:155-210, Ludzie_Data.js:73, QuestBoard_Data.js:92. | 1 zwykłych; 1 starego świata |
| 22 | Polna droga | USUŃ | Stara Polna droga; nic tu nie prowadzi. Martwe dane: Okolice_Data.js:170-180, Ludzie_Data.js:75, QuestBoard_Data.js:93. UWAGA: quest_board_test (szybki zestaw) idzie tu w kroku 206 - skrypt zablokuje, dopóki testu nie przestawisz. | 1 starego świata |
| 23 | Skraj lasu | USUŃ | Stary Skraj lasu; wejście tylko z Map017 (stara). Martwe dane: Okolice_Data.js:153-204, QuestBoard_Data.js:91. | 1 starego świata |
| 24 | Posiadłość Lorda | USUŃ | Stara posiadłość Lorda (plansza 3x3); nowa to Map221. Story.js:187 (MANORS.stary) - tylko świat "stary"; Okolice_Data.js:95; TownLife_Data.js:559. | 3 zwykłych; 7 starego świata |
| 27 | Mapa testowa: budynki | USUŃ | Mapa testowa budynków (próba), prowadzi na starą Map008. Nic w grze. | - |
| 100 | Chatka - Wnętrze | ZOSTAW | Wnętrze WŁASNEJ chaty gracza: Farming.js:720 HUT_MAP=100, Farming_Build.js:838 (wejście do chaty zbudowanej na działce Map218), Homes.js:132, CleanHUD_Compass.js:229, Dwor_Data.js:41. Przepiąć w drzewku pod Map218. | 3 zwykłych |
| 101 | Paleta miasteczka (do kopiowania) | USUŃ | Paleta miasteczka do kopiowania (narzędzie edytora); nic w grze tu nie prowadzi. | - |
| 109 | Dom mieszczan | USUŃ | Wnętrze starego miasta (wejście tylko z Map008). Wtyczki: tylko spis nazw MapaWyspy_Data.js:47. | - |
| 110 | Izba pod skałą | USUŃ | Wnętrze starego miasta (wejście tylko z Map008). Wtyczki: tylko spis nazw MapaWyspy_Data.js:47. | - |
| 111 | Podgrodzie | USUŃ | Stare Podgrodzie (plansza 3x3); nowe to Map218. Martwe dane: TownLife_Data (mieszkańcy 111), Homes.js:125 (świat "stary"), Woz.js:65, Zasoby.js:359, Wyspa_Data.js:36. | 4 zwykłych; 9 starego świata |
| 117 | Dom uchodźców | USUŃ | Dom uchodźców starego Podgrodzia (wejście z Map111); W6 gra już na Map218. Tylko MapaWyspy_Data.js:49. | - |
| 119 | Archiwum zakonu | PRZENIEŚ | Archiwum zakonu: używane przez wątki nowego świata - W2 (TownQuests_Data.js:200-201 księga sygnałów, kroniki), W19 (Mlyn_Data.js:43 archiwum 119, Mlyn.js:830 "Zakurzony tom"), Pustelnia.js:63/481 (karta kroniki). W nowym świecie NIE MA do niego wejścia (jedyne drzwi na starej Map008). Zostawić plik, dać mu drzwi w nowym świecie (np. Map220 albo piwnica Map009) i przepiąć. | 3 starego świata; 1 innych skryptów |
| 120 | Osada Milczących | USUŃ | Osada Milczących - ARCHIWUM (SPIS_WATKI.md L12). Wejście tylko z gór Map013 (bramą Osada.js). Martwe: TownQuests_Data.js:210/213 (W8 rozdz. 5 - trzeba go przerobić). | - |
| 121 | Wspólna izba | USUŃ | Chata Osady (ARCHIWUM, L12); drzwi z Map004 (Osada.js:26-28). | - |
| 122 | Chata tkaczki | USUŃ | Chata Osady (ARCHIWUM, L12); drzwi z Map004 (Osada.js:26-28). | - |
| 123 | Chata Najstarszego | USUŃ | Chata Osady (ARCHIWUM, L12); drzwi z Map004. Pustelnia.js:63 ELDER=123 (karta 3 kroniki) - martwe. | 1 starego świata |
| 124 | Chata rzeźbiarza | USUŃ | Chata Osady (ARCHIWUM, L12); drzwi z Map004 (Osada.js:26-28). | - |
| 125 | Przystań | USUŃ | Stara Przystań (plansza 3x3); molo i prom są już na Map219 (Przystan.js:78 MAP=219). Martwe: Wrak.js:69 (HARBOUR), Wyspy.js:45, Woz.js:67, Ludzie_Data.js:55, Zakon_Data.js:67, Kruk_Data.js:34, Intrygi_Data.js:40, Poselstwo_Data.js:50, Zasoby.js:317. | 9 zwykłych; 8 starego świata; 13 innych skryptów |
| 128 | Komora celna | USUŃ | Komora celna starej Przystani; Przystan.js:78 CUSTOMS = MAP (219) - nieużywana. | - |
| 155 | Pustelnia na klifie | USUŃ | Pustelnia - wyłączona (Wyspa_Data.js:128 HERMITAGE_OPEN=false); Kleofas jest już w kaplicy Map178. Martwe: Pustelnia_Data.js:34, Zasoby.js:315. | 2 zwykłych; 3 starego świata |
| 156 | Skryptorium | USUŃ | Skryptorium pustelni (wyłączone, Wyspa_Data.js:128). Pustelnia_Data.js:34 INNER - martwe. | 1 starego świata |
| 157 | Urwisko Kruków | USUŃ | Urwisko Kruków - wyłączone (Wyspa_Data.js:128). Cysterna.js:399 (krata z Map167) przenosi tu tylko gdy Wyspa.isReady(157) - zamknięte, a bez pliku Kruk.js:1546 i tak nie zgłosi gotowości. Martwe: Kruk_Data.js:34, Cysterna_Data.js:39 (rynny K53). | 3 starego świata |
| 159 | Przylądek z latarnią | USUŃ | Stary przylądek z latarnią; latarnia stoi już na Map219 (Latarnia_Data.js:38). Tylko listy (Okolice_Data.js:86). | 1 starego świata |
| 160 | Izba latarnika | ZOSTAW | Izba latarnika: Latarnia_Data.js:38 IZBA=160, MAP=219 - drzwi wieży na Map219 (Latarnia.door -> izbaDoor, Latarnia.js:461-466); wyjście prowadzi na Map219. Przepiąć pod Map219. | 1 zwykłych |
| 161 | Laterna | ZOSTAW | Laterna: Latarnia_Data.js:38 LATERNA=161 - schody na górę, gdy latarnik wpuści (Latarnia.js:458-461); wyjście na Map219. Przepiąć pod Map219. | 1 zwykłych |
| 162 | Garnizon nad zatoką | USUŃ | Stary garnizon (plansza 3x3); straż jest na Map221/180 (Garnizon_Data.js:46). Garnizon.bar (-> wrak 165) wołają tylko zdarzenia tej mapy. Martwe: Wyspy.js:45, Zasoby.js:316. | 4 zwykłych; 1 starego świata |
| 163 | Kwatera rotmistrza | USUŃ | Kwatera rotmistrza starego garnizonu; QUARTERS to teraz 180 (Garnizon_Data.js:46). | 1 starego świata |
| 165 | Wrak na mieliźnie | USUŃ | Wrak na mieliźnie - poza światem (W12 gra na Map219/166). Garnizon.js:667 i Wrak.js:523 przenoszą tu tylko z map 162/125; bez pliku Wrak.js:117 uzna wrak za niezbudowany. Martwe: Wrak_Data.js:43, Garnizon.js:73, Zakon_Data.js:237. | 1 zwykłych; 1 starego świata |
| 168 | Spalona zagroda | USUŃ | Spalona zagroda - ARCHIWUM (S15, D21). Homes.js:132 ZAGRODA=168 tylko w świecie "stary" (LANDS.nowy.zagroda=false). Martwe: Zasoby.js:323, Ludzie_Data, Zakon_Data. | 1 zwykłych; 3 starego świata |
| 169 | Dom Ługów | USUŃ | Dom Ługów (ARCHIWUM, D21); Homes.js:153 inside=169 - wejście tylko na Map168. | 1 starego świata |
| 175 | Orla Grań | USUŃ | Stara Orla Grań; orzeł jest już na Map030 (Orzel_Data.js:37). Martwe: Zakon_Data.js:67 (gran 175), Debug.js:274. | 2 zwykłych |
| 176 | Komora pod menhirami | USUŃ | Komora pod menhirami (Zakon, paczka D) - schody tylko ze zdarzeń Zakonu na starych mapach (Zakon.js:520). Martwe: Zakon_Data.js:67/164. | 1 starego świata |
| 177 | Jaskinia przemytników | USUŃ | Jaskinia przemytników (Ludzie, paczka C) - wejście tylko ze starej Przystani (Ludzie.js:1068). Martwe: Ludzie_Data.js:55. | 1 starego świata |
| 182 | Dom 1 (przekupka Agata) | USUŃ | Dom starego miasta (wejście z Map008). Tylko MapaWyspy_Data.js:53. | - |
| 183 | Dom 2 (kamienica mieszczan) | USUŃ | Dom starego miasta (wejście z Map008). Tylko MapaWyspy_Data.js:54. | - |
| 193 | Dom 10 (przy piekarni) | USUŃ | Dom starego miasta (wejście z Map008). Tylko MapaWyspy_Data.js:55. | - |
| 194 | Dom 11 (kamienice przy ulicy południowej) | USUŃ | Dom starego miasta (wejście z Map008). Tylko MapaWyspy_Data.js:56. | - |
| 195 | Dom 12 (bliźniak domu staruszków) | USUŃ | Dom starego miasta (wejście z Map008). Tylko MapaWyspy_Data.js:56. | - |
| 196 | Dom 13 (dom z lukarnami na wschodzie) | USUŃ | Dom starego miasta (wejście z Map008). Tylko MapaWyspy_Data.js:56. | - |
| 197 | Dom 14 (obok domu weterana) | USUŃ | Dom starego miasta (wejście z Map008). Tylko MapaWyspy_Data.js:56. | - |
| 198 | Dom 15 (przy cmentarzu) | USUŃ | Dom starego miasta (wejście z Map008). Tylko MapaWyspy_Data.js:56. | - |
| 212 | Komórka | USUŃ | Komórka starego Podgrodzia (wejście z Map111). Nic w nowym świecie. | - |
| 213 | Kopalnia pod Orlą Granią | USUŃ | Stara kopalnia (wejście z Map013); kopalnia nowego świata to Map225 (Kopalnia.js:57 MAPS [213, 225] - ta sama wtyczka działa na 225). | 1 zwykłych |
| 216 | Przytułek | USUŃ | Stary przytułek; W21 Gorączka gra w Map202 (Goraczka_Data.js:46). 216 jest już tylko w komentarzu Goraczka.js:17. | - |
| 900 | Pola pod grzbietem | USUŃ | Boczna mapa starej planszy (wejście z Map023). Nic w nowym świecie. | - |
| 901 | Sady pod dworem | USUŃ | Sady pod starym dworem (pod Map024). Nic tu nie prowadzi. | - |
| 910 | Sosnowy Klif | USUŃ | Sosnowy Klif (stary, wejścia z 18/918/950). Nic w nowym świecie. | - |
| 912 | Ugory za Spaloną Zagrodą | USUŃ | Ugory za Spaloną Zagrodą (stare). Nic tu nie prowadzi. | - |
| 914 | Zatoczka pod ogonem | USUŃ | Zatoczka (stara wyspa/morze); Wyspy.js:73 - łodzie tylko ze starej Przystani 125 / garnizonu 162. | 1 zwykłych; 1 starego świata |
| 917 | Wyspa Kormoranów | USUŃ | Wyspa Kormoranów; Wyspy.js:54-57 - łodzie tylko z 125/162 (ARCHIWUM S13). | 1 zwykłych |
| 918 | Wysepka Samotnej Sosny | USUŃ | Wysepka Samotnej Sosny; wejście z 910 (stara) i Wyspy.js:72. | 1 zwykłych |
| 920 | Wyspa Solna | USUŃ | Wyspa Solna; Wyspy.js:58-61 - łódź tylko z 125. | - |
| 922 | Wyspa Przemytników | USUŃ | Wyspa Przemytników; Wyspy.js:62-64 - łódź tylko z 125. | - |
| 923 | Kamień Rybaków | USUŃ | Kamień Rybaków; Wyspy.js:65-67 - łódź tylko z 125; jej przejście prowadzi na starą Map020. | 1 zwykłych |
| 931 | Grań nad szczytem | USUŃ | Grań nad szczytem (stara Orla Grań). Nic w nowym świecie. | - |
| 933 | Zatoka Kłód | USUŃ | Zatoka Kłód (stara). Wejście z 17 (stara). | - |
| 934 | Miedze za Osadą | USUŃ | Miedze za Osadą (stara, ARCHIWUM). Nic tu nie prowadzi. | - |
| 935 | Orla Iglica | USUŃ | Orla Iglica (stara); Wyspy.js:68-69 gniazdo - martwe. | 1 zwykłych |
| 950 | Zbocze pod Pustelnią | USUŃ | Zbocze pod Pustelnią (stare, wejście z 910). | - |
| 951 | Skała Strażnicza | USUŃ | Skała Strażnicza (stara); Wyspy.js:70 - łódź tylko z garnizonu 162. | 1 zwykłych |
| 960 | Stok nad Garnizonem | USUŃ | Stok nad Garnizonem (stary). Nic tu nie prowadzi. | - |
| 961 | Przesieka pod Murami | USUŃ | Przesieka pod Murami (stara). Nic tu nie prowadzi. | - |
| 962 | Zachodni Stok Gór | USUŃ | Zachodni Stok Gór (stary). Nic tu nie prowadzi. | - |
| 963 | Łąka pod Klifem | USUŃ | Łąka pod Klifem (stara). Nic tu nie prowadzi. | - |
| 964 | Zachodni Brzeg | USUŃ | Zachodni Brzeg (stary). Nic tu nie prowadzi. | - |
| 990 | Mapa próbna A | USUŃ | Mapa próbna A (wzór stylu). W grze: tylko parametr Laka (maps) - martwe; testy wzgorza_* są poza pełnym przebiegiem (Wzgorza wyłączona). | 1 zwykłych; 5 innych skryptów |
| 991 | Mapa próbna B | USUŃ | Mapa próbna B (wzór stylu). Nic w grze. | - |
| 992 | Chata własna A (glina, bielone ściany) | USUŃ | Próbna chata własna A (prowadzi na starą Map111). Nic w grze. | - |
| 993 | Chata własna B (deski, bale) | USUŃ | Próbna chata własna B (prowadzi na starą Map111). Nic w grze. | - |
| 994 | Chata drwala na naszym zestawie (próba) | USUŃ | Próbna chata drwala (prowadzi na starą Map111). Nic w grze. | - |

## Mapy spoza folderu, do których nie prowadzi żadne zdarzenie - wszystkie ZOSTAW

Do nich prowadzi kod wtyczek (sprawdzone):

| id | nazwa | jak gracz tam trafia |
|---|---|---|
| 11 | Komnata Serca | Underground.js - schody z piętra 90 (Underground_Data.js:80 `100: { map: 11 }`), finał |
| 130-144 | Podziemia: piętra 1-10, kawałki pasm | Underground.go (zdarzenia na Map010), piętra 1-9 = 130+N; mapy kawałków 130, 141-144 wczytywane przy starcie (Underground.js:151) |
| 145 | Podziemia: skorupa 11-99 | wspólny plik wszystkich pięter 11-99 (Underground_Data.js:44 `shell: 145`) |
| 146-153 | Podziemia: piętra 20-90 | Underground_Data.js:72-79 (schody, winda) |
| 154 | Chata pod lasem | Homes.js:150 `inside: 154` - dom do kupienia na Map219 (`LANDS.nowy.chata.land = 219`), drzwi robione w Homes.js:404 |
| 167 | Stara cysterna zakonu | Cysterna.js:200 - zasuwa na piętrze 30 (Map147) dostaje przejście na 167 |
| 171 | Piwnica kantoru | Kantor.js:519 - klapa w kantorze (Map103) |
| 174 | Dwór - Gabinet | Dwor_Data.js:201 - klapa z biblioteki (W7) |
| 214 | Kruczarnia | Poczta.js:688 (`D.MAP.kruczarnia`), drzwi na Map029 |

## Ryzyka: co wskazuje na stare mapy i co się stanie, gdy plików nie będzie

### Prawdziwe (mogą dać „Failed to load: data/MapNNN.json”)

1. **Tunel z piętra 50** - Map149 zdarzenie 23 -> Map014 (przełącznik 15), a z Map014 wyjścia na Map013. Przełącznik 15
   włącza tylko W8 rozdz. 6 (TownQuests.js:3286, 3463, 3466) - w nowym świecie W8 utyka wcześniej, na rozdz. 5 (osada na
   starej Map004, TownQuests_Data.js:210/213) - więc dziś tylko F9 albo test. Skrypt blokuje usunięcie Map013, dopóki tunel
   prowadzi na Map014.
2. **Farming_Build.js:849** - wyjście z własnej chaty (Map100), gdy chaty już nie ma (np. zabita deskami albo działka
   przeszła na Lorda, gdy bohater był w środku), przenosi na Map003 (48,41). Dziś: ląduje w starym świecie; po usunięciu Map003:
   błąd. Dlatego Map003 = PRZENIEŚ. Poprawka: przenosić na działkę świata (Homes `land().out`, w nowym świecie Map218 (27,26)).
3. **Debug.js:843** - wiersz F9 „kot: do domu dziadka” przenosi na `HomeLife.MAP` (19) bez sprawdzenia. Tylko F9. Map019 =
   PRZENIEŚ, więc dziś nic; przy przenosinach HomeLife na 224 to zniknie samo.
4. **Stare zapisy starego świata** - gra zaczęta na starych mapach (Story.js:169 `WORLDS.stary`: dom 19, podwórze 20;
   Story.js:187 pole 3, dwór 24; Homes.js:123 `LANDS.stary`; Swiat_Data.js:114 przesunięcia map 162/24/13/111) po usunięciu
   się nie wczyta albo wyrzuci błąd przy pierwszym przejściu. Dziś jedyny zapis gracza stoi w nowym świecie (Map126), kopia do
   grania w AppData\Local\TawernaTest jest osobna i nie zmieni się.
5. **Testy** - 116 plików testów idzie na mapy do usunięcia (lista w próbie skryptu). Szybki zestaw: wolves_test (Map004) i
   quest_board_test (Map022) - skrypt ich pilnuje. Mapy PRZENIEŚ są też placem testów: Map003 (~110 zwykłych testów, smoke/farm,
   smoke/story, combat_test, needs_test, journal_test, menu_panel_test, zapis day40_farm) i Map019 (home_decor_test,
   smoke/story, zapisy home_decor_v0 i new_story_day1). `tests/lib/kit.js` już domyślnie zaczyna na 218 / 224 - starsze testy
   mają Map003 wpisane wprost (`reserveTransfer(3, 22, 14, ...)`).

### Nieszkodliwe (martwe dane - w nowym świecie nikt ich nie czyta albo czyta bez błędu)

- Cysterna.js:399 krata z Map167 na Urwisko (157): działa tylko gdy `Wyspa.isReady(157)` - pustelnia i urwisko są zamknięte
  (Wyspa_Data.js:128 `HERMITAGE_OPEN = false`), a bez pliku Kruk.js:1546 i tak nie zgłosi gotowości. Gracz zobaczy dymek
  „krata zablokowana”.
- Garnizon.js:667 (łacha -> wrak 165) i Wrak.js:523/532 (łódź Janka -> 165 / -> 125): wołają je tylko zdarzenia starych map
  162/125/165; bez pliku Wrak.js:117 uzna wrak za niezbudowany.
- Ludzie.js:1068/1071 (jaskinia przemytników 177 / Przystań 125), Zakon.js:520/545/583 (komora 176, krąg, orle zejścia),
  Woz.js:242 (wozy tylko na 8/111/3/125, Woz.js:64-67), Wyspy.js:253 (łodzie tylko z 125/162, Wyspy.js:45-73): ich zdarzenia
  wstawiane są tylko na stare mapy.
- Wiersze F9 paczek (Okolice, Zasoby, Łowy, Ludzie, Zakon) i wątków przenoszą przez Debug.js:862/874 - tam jest sprawdzenie
  `$dataMapInfos[...]`: po usunięciu pokażą dymek zamiast błędu.
- Swiat_Data.js (stara plansza): pozycje usuniętych map zostają w `SwiatData.maps`, ale czytane są tylko, gdy bohater stoi na
  mapie z planszy. Do posprzątania później (razem z `extra: [121, ..., 213]`).
- Listy map w parametrach i tabelach: Laka (parametr maps), Hunting (parametr maps: 3, 4, 8, 12), HomeAmbience/HomeDecor (19),
  CzerwonaWoda.js:282, Laka_Woda, CzerwonaWoda_Brzegi, Mood.js:411, MapaWyspy_Data.js:23-71 (spis nazw), rejestr numerów
  zdarzeń w TawernaCore.js:611-690 (sam opis).
- Edytor: pusty wpis (null) w MapInfos.json to zwykły stan po usunięciu mapy - edytor tak samo zapisuje usunięte mapy.

## Co trzeba przenieść najpierw (mapy PRZENIEŚ)

1. **Map019 -> Map224 (dom dziadka)**: HomeLife.js:90 `MAP = 19` (dzień dziadka: kocioł, fotel, łóżko; kot Mruczek 960-979),
   HomeDecor (parametr `mapId: 19`, ozdoby 980-998 - współrzędne ze starej izby 19x13, nowa ma 8x9), HomeAmbience (parametr
   `maps: "19"` - na 224 dopisać albo notatkę `<HomeAmbience>`), Orzel.js:261 (dziadek karmi pisklę tylko gdy `s.map === 19`),
   Debug.js:843 (F9 „kot”). Potem: zapisy testowe home_decor_v0 i new_story_day1 od nowa na 224 (tests/fixtures/make_*.js),
   testy home_life / home_decor / home_ambience / smoke/story na 224.
2. **Map014 -> Map225 (Sztolnia)**: W6 rozdz. 7 - TownQuests.js:2098 `CAVE = 14`, zdarzenia „Marek” i „Strażnik obozu” są w
   pliku Map014 (TownQuests.js:1833-1836), W8 rozdz. 6 - pojedynek przy „tunel_wejscie” (TownQuests.js:3476-3480); W8 ma już
   w8_cave / w8_crate na 225 (TownQuests_Data.js:211-212). Tunel z Map149 (zdarzenie 23) przestawić na 225 albo zamknąć.
   Wtedy 13 i 14 mogą odejść razem.
3. **Map119 Archiwum zakonu - dać wejście w nowym świecie**: plik zostaje (wnętrze jest potrzebne), ale dziś jedyne drzwi
   są na starej Map008 (a schody z archiwum prowadzą na Map008 (2,3)). Używają go: W2 (TownQuests_Data.js:200-201 księga
   sygnałów i kroniki), W19 (Mlyn_Data.js:43 `archiwum: 119`, Mlyn.js:830 tom na pulpicie), Pustelnia.js:63/481 (karta 1
   kroniki). Dodać drzwi (np. z Map220, z kaplicy Map178 albo z piwnicy Map009 - SPIS_WATKI.md W2: „dobra pierwsza komora
   lochów pod tawerną”), przestawić wyjście, przepiąć w drzewku pod nowego rodzica (w stare_mapy.json pole „rodzic”, werdykt ZOSTAW).
4. **Map003 Kruczy Jar - plac testowy i jedna linia kodu**: poprawić Farming_Build.js:849 (ryzyko 2); przestawić testy z
   `reserveTransfer(3, ...)` / `newGame({ map: 3 })` na 218 (Podgrodzie, działka dziadka) i zrobić od nowa zapis day40_farm.
   Przy okazji: Farming_Build.js:139 `WALLED_FIELD_MAP = 3` (odstęp budowania od płotu liczony tylko na starej działce),
   CleanHUD_Compass.js:229 `FIELD = 3` (domyślna działka kompasu), Dog.js:45 `HOME_MAP = 3` (dziki pies pojawia się tylko na
   starej Map003 - w nowym świecie psa nie da się oswoić).

## Przenosiny zrobione 2026-11-17 (druga tura)

- **Map019 -> Map224**: HomeLife.js (MAP = 224, tabela HOUSES: krzątanie przy kołkach pod oknem i przy skrzyni z kąta nad nią,
  kocioł z miejsca przed fotelem, kot przy ogniu 6,4; chata ma jedno łóżko - wnuka, więc dziadek nocą drzemie w fotelu przy ogniu:
  „Zzz”, chrapanie, rozmowa „Chrrr... Hm?”), HomeDecor (mapId 224, układ LAYOUTS[224]: 14 ozdób - poroże i kieł nad posłaniem,
  półka z kuflem nad kołkami, skóra wilka przy posłaniu, wycinanka pod oknem, pokwitowanie i ogłoszenie na kamiennej ścianie przy
  kominie, zioła / wieniec obok ognia, dzbanek i koszyk na skrzyni, dynie i snop pod ścianą obok skrzyni, chodnik przy drzwiach),
  HomeAmbience (maps 224), Orzel.js (dziadek karmi pisklę w domu HomeLife.MAP), Debug.js F9 „kot” (do chaty 5,6, ze sprawdzeniem).
- **Map014 -> Map225**: obóz kopaczy w komorze z ogniskiem Sztolni (tools/nowy_swiat/jaskinia_225.py: Marek 33,57, strażnik 23,56,
  trzej kopacze, znaczniki), TownQuests CAVE = 225; wyjście z Markiem = stary chodnik na północ (znacznik jaskinia_wyjscie 57,7),
  Marek wychodzi przejściem, nie znika w miejscu. Wyjścia Map014 prowadzą na Map222 (57,13). Werdykt Map014: USUN.
- **Map119**: drzwi w Ruinach Zamku pod tawerną (Map010 9,6, tools/nowy_swiat/archiwum_drzwi.py), schody archiwum wracają przed nie
  (9,7); w drzewku pod Map010. Werdykt: ZOSTAW.
- **Map003**: Farming_Build (wyjście z chaty, gdy chaty już nie ma - przed jej drzwi albo za bramę działki Map218), CleanHUD_Compass
  (FIELD = 218), Dog.js (dziki pies na łące pod skałami Map218 x 42-60, y 7-17; przychodzi i odchodzi poza wzrokiem bohatera).
  Map003 zostaje jako PRZENIES: gra na niej ~100 testów pełnego przebiegu i stary zapis day40_farm.
- Zapisy testowe nowego świata: nowy_dzien1 (chata 224), nowy_dzien40 (działka 218). Stare (new_story_day1, home_decor_v0 na Map019,
  day40_farm na Map003) to zapisy sprzed rdzenia - na nich stoją testy zgodności starych kluczy (core_fixtures*, tavern_life_save...);
  usun_stare.py wstrzymuje usunięcie Map019, dopóki one tam stoją (albo --mimo-testow; smoke/fixtures pomija zapis, którego mapy już nie ma).

## Dane we wtyczkach, które nadal celują w stare mapy (nie blokują usuwania)

To rzeczy z wątków i systemów, które w nowym świecie dziś i tak nie działają; usunięcie map niczego tu nie pogarsza, ale to
lista do przenosin (decyzje w SPIS_WATKI.md):

- Konie.js:40 `MAP = 8` (konie przy stajni starego miasta), TownQuests.js:89 `TOWN = 8, ROAD = 3` (część zadań K),
  TownLife_Data.js:1320 `MAP: 8` + mieszkańcy map 8/111/125/24, Kruk.js:76 `TOWN = 8, KRUCZY_JAR = 3`, Kruk_Data.js:34
  (`MAP = 157` - oswajanie kruka na Urwisku, L8 PRZENIEŚĆ), Cysterna_Data.js:39 (rynny K53 na 157 / 8), Orzel_Data.js:38
  `GORY = 13`, Kopalnia.js:57 `MAP = 213` (nieużywane - wtyczka działa na 225).
- Paczki terenu na starych mapach: Okolice_Data.js (miejsca A-D), Zasoby.js:291-385, Lowy_Data, Ludzie_Data.js:55,
  Zakon_Data.js:66 (L1, L13-L15: PRZENIEŚĆ / PRZEROBIĆ), QuestBoard_Data.js:91-93 (bestie z listów gończych na 21/22/23).
- W8 rozdz. 5 (osada, Map004/120 - ARCHIWUM L12) - W8 trzeba przerobić bez osady; W14 Poselstwo (Poselstwo_Data.js:50:
  miasto 8, przystań 125); Intrygi_Data.js:40 `przystan: 125` (nieużywane w Intrygi.js).
- Świat „stary” w Story.js:169-187 i Homes.js:123-125 - po usunięciu map i tak martwy; do wycięcia później.
- Przy okazji (nie dotyczy usuwania): Przystan.js:743 - wiersz F9 „W10” przenosi na Map219 (110,19), a ta mapa ma 80x80.

## Skrypt: tools/mapy/usun_stare.py

```
python tools/mapy/usun_stare.py                 próba: co by zrobił, blokady, uwagi (nic nie zmienia)
python tools/mapy/usun_stare.py --wykonaj       usunięcie (edytor RPGMZ.exe musi być zamknięty)
python tools/mapy/usun_stare.py --cofnij "<folder kopii>"     przywrócenie z kopii
dopisz --mimo-testow, żeby usunąć mimo testu szybkiego zestawu / zapisu testowego na usuwanej mapie
```

Co robi przy `--wykonaj` (kolejno, a przy każdej blokadzie staje i nic nie zmienia):
1. Czyta decyzje z `tools/mapy/stare_mapy.json` (usuwa tylko USUN; mapa z folderu, której tam nie ma, zostaje).
2. Sprawdza na żywych plikach: mapa leży w folderze 223 i nie jest startowa; nic, do czego gracz nowego świata może dojść
   (zdarzenia 201 + szwy świata), nie prowadzi na nią; żadna włączona wtyczka nie przenosi na nią wprost
   (`reserveTransfer(N, ...)`, polecenie 201 z numerem) ani przez stałą z listy `ZNANE` (19, 100, 160, 161); żaden zapis gracza
   na niej nie stoi; test szybkiego zestawu i zapis testowy jej nie używa.
3. Kopiuje usuwane `data/MapNNN.json`, `data/MapInfos.json` i `data/System.json` do
   `..\Tawerna_archiwum_2026-11-08\stare_mapy_<czas>\data\` (sha1 kopii sprawdzone) + `spis.json`.
4. Zapisuje MapInfos.json w układzie edytora (jeden wpis w wierszu): usunięte wpisy = null (numer mapy = miejsce w tablicy
   zostaje), mapy, które zostają pod usuniętym rodzicem, idą pod rodzica ze stare_mapy.json albo pod najbliższego
   zachowanego przodka; folder 223 znika z plikiem Map223.json, gdy jest pusty. Przed zapisem nowy tekst jest wczytany z
   powrotem i porównany wiersz po wierszu ze starym - zmienić się mogą tylko zmienione wpisy.
5. Usuwa pliki map i daje nową wersję projektu (System.json `versionId`, jak tools/drzewa/drzewa.py).

Po `--wykonaj`: otworzyć projekt w edytorze na nowo, zanim cokolwiek się w nim zapisze. Testy ze `tests/stary_swiat.txt`
(i inne, które wypisze próba) przenieść do `tests/archiwum` albo przepisać na nowy świat.

Sprawdzone na kopii projektu w schowku (nie w grze): `--wykonaj --mimo-testow` po przestawieniu tunelu usunął 74 mapy,
zmienił dokładnie 80 wierszy MapInfos.json (74 null + 6 przepiętych), MapInfos i System zostały w układzie edytora;
`--cofnij` przywrócił wszystkie pliki bajt w bajt (System.json różni się tylko versionId). Przy złych decyzjach (Map003
albo Map160 na USUN) skrypt staje z blokadą.
