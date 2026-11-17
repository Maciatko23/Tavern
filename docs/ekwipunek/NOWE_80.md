# Nowe rzeczy do zrobienia (80) i przepisy na stare - lista do akceptacji

Umowa z 2026-11-17: ok. 80 nowych rzeczy do noszenia i do walki - **pełne komplety zbroi dla każdego materiału** (płótno, skóra, brąz, żelazo, stal, stal zakonna), **brakujące rodzaje broni** w materiałach z tabeli `BRON_LISTA.md`, więcej **ubrań i dodatków** (pierścienie, amulety, talizmany, płaszcze, pasy). **Każdą nową rzecz da się zrobić samemu**: w kuźni, garbarni, warsztacie albo w nowym **krośnie** (niżej); sklep i łup to druga droga. Na końcu: stare rzeczy, których dziś nie da się zrobić, z przepisem dla każdej.

**Zaakceptowane i zainstalowane 2026-11-17** (odpowiedzi na pytania 1-3: tak, tak, tak): przedmioty w `data/Items.json` (`tools/ekwipunek_nowy/zrob_staging.js` + `instaluj.py`), dane w `Bron_Data.js` (przedmioty, przepisy, sklepy, łupy, surowce), `Ubior_Data.js` (ubrania 284-299, wzory), `Farming_Data.js` (krosno, kołowrotek, przetop monet), test `tests/krosno_test.js`. Do zrobienia: ikony (teraz zastępcze - `tools/ekwipunek_nowy/staging/ikony_plan.json`), obrazek krosna (teraz garbarni), nowe wzory na postaci. Łapcie z łyka (275) miały już przepis w warsztacie - nie dublowany. Format i zasady jak w `BRON_LISTA.md`; liczby broni z tej samej formuły co dziś (rodzaj x materiał, `js/plugins/Bron_Data.js`).

## Zasady (te same co dziś)

- **Poziomy materiałów**: płótno i skóra 1-8, brąz 5-9, żelazo 9-15, stal 15-22, stal zakonna 22-27. Rzecz powyżej poziomu bohatera działa słabiej o 3% za każdy brakujący poziom (najwyżej 45%).
- **Zbroja** (część ciosu, którą zatrzymuje): tors 16-37%, głowa 3-9%, ręce 2-5%, nogi 3-6%, stopy 2-4%; suma najwyżej 58%. **Tarcze**: blok 68-87%. **Broń wręcz**: obrażenia 11-49.
- **Przepis widać od poziomu przedmiotu minus 4** - w kuźni, garbarni, warsztacie i w krośnie. Ubrania, płaszcze i pasy nie mają poziomu: przepis widać od razu.
- **Stal zakonna** - kuje się ją tylko z **Młotkiem majstra** (409, nagroda W22 „Majstersztyk”, ranga IV; narzędzie, nie zużywa się, i tak skraca pracę w kuźni o 15%) i tylko ze **sztabek stali zakonnej** (piętra 76-99 i dwaj bossowie - niżej). Bez młotka zakonne rzeczy są dalej tylko łupem.
- **Brąz** - na wyspie nie ma miedzi ani cyny, więc brąz bierze się z **przetopu zaśniedziałych monet** i ze **starych sztabek** u Tadka i w kantorze (niżej).
- **Ceny** jak dotąd: miecz z brązu 55, z żelaza 110, ze stali 240 G razy udział rodzaju; rzeczy zakonnych nikt nie sprzedaje (w nawiasie ich wartość przy skupie).

### Komplety po zmianie

Pogrubione = nowe. Każdy komplet da się zrobić w całości (stare części - przepisy w ostatnim rozdziale).

| materiał | poziomy | głowa | tors | ręce | nogi | stopy | tarcza | najlepszy komplet |
|---|---|---|---|---|---|---|---|---|
| płótno, sukno | 2-8 | 342, 343, **419** | 349, **427** | **435** | **438** | **442** | **445** (wiklina) | 31% (dziś nie ma kompletu) |
| skóra | 2-8 | 340, 341, **420** | 350, 351, **428** | 360, **436** | 366, **439** | 371, **443** | **446** | 39% (dziś 34%) |
| brąz | 5-9 | 344, **421** | 352, **429** | 361 | 367 | **444** | 376, **447** | 44% (dziś ok. 41%, bez własnych butów) |
| żelazo | 9-15 | 345, 346, **422** | 353, 354, 355, **430** | 362, 363 | 368, **440** | 372 | 375, 377, 378, **449** | 50% (bez zmian) |
| stal | 15-22 | 347, **423**, **424**, **425** | 357, 358, **431**, **432** | 364, **437** | 369, **441** | 373 | 379, **450**, **451** | 57% (dziś 56%) |
| stal zakonna | 22-27 | 348, **426** | 359, **433**, **434** | 365 | 370 | 374 | 380 | 58% - sufit (bez zmian) |

Między brązem a żelazem stoi jeszcze **Tarcza z pancerza kraba** (448, poziom 8).

## Nowe stanowisko: Krosno

Garbarnia robi skórę, kuźnia metal - płótnem i suknem nie zajmuje się dziś nic. Krosno to warsztat tkacki: z lnu tka **płótno**, z wełny **sukno**, a przy nim szyje się ubrania, pikowane zbroje i płaszcze.

| | |
|---|---|
| koszt budowy | 6x Deski, 2x Drewno, 4x Lina, 4x Gwoździe (10 sił, 30 uderzeń młotka) |
| wielkość i miejsce | 3 x 2 pola; jak każda budowla tylko na polu dziadka, może stać też w chatce (jak warsztat) |
| ulepszenie (opcja) | „Dobuduj kołowrotek”: 2x Deski, 1x Lina, 2x Gwoździe - płótno z 4 włókien zamiast 6, tkanie o godzinę krótsze (jak trójnóg przy ognisku) |
| słowa w menu | „Utkaj” (płótno, sukno), „Uszyj” (reszta) |
| narzędzie | szycie wymaga **Nożyc** (142) w plecaku - nie zużywają się (te same, którymi strzyże się owce) |
| opis | „Rama z nawiniętą osnową i ławka tkacza. Z lnu tkasz płótno, z wełny sukno, a z nich szyjesz koszule, kaftany, przeszywanice i płaszcze.” |

| przepis | składniki | wynik | godziny | siły | uwagi |
|---|---|---|---|---|---|
| Utkaj płótno | 6x Włókno | 1x Płótno | 3 | 3 | praca idzie sama (jak wyprawianie skóry); z kołowrotkiem 4x Włókno, 2 h |
| Utkaj sukno | 2x Wełna | 1x Sukno | 4 | 3 | praca idzie sama; z kołowrotkiem 3 h |
| Uszyj ... | listy niżej | | | | ręczna praca przy krośnie: 14 nowych rzeczy i 25 starych (21 ubrań, 4 zbroje z płótna) |

**Barwniki - bez nowych surowców**: krwawnik - żółty, jagody - niebieski i granat, dziurawiec - czerwony, pokrzywa - zielony, szyszki - brązowy, węgiel drzewny - czarny (skóra). Szwaczka Dorota dalej farbuje za grosze, jak dziś.

## Nowe surowce

Potrzebne do nowych rzeczy (4) i - do wyboru - do sześciu starych (5, pytanie 3 na końcu). W przepisach niżej skróty: **Skóra** = Skóra wyprawiona (97), **Węgiel** = Węgiel drzewny (79), **Stal zakonna** = Sztabka stali zakonnej (486).

| id | nazwa | skąd | cena | do czego |
|---|---|---|---|---|
| 483 | Płótno | krosno: 6x Włókno, 3 h; szwaczka Dorota | 10 G | koszule, spodnie, chusty, przeszywanice, pikowane części, peleryna |
| 484 | Sukno | krosno: 2x Wełna, 4 h; szwaczka Dorota | 25 G | kaftany, kaptury, żupan, płaszcze, brygantyny |
| 485 | Sztabka brązu | kuźnia, „Przetop monety”: 4x Zaśniedziała moneta (194) + 1x Węgiel, 4 h (praca idzie sama); kowal Tadek (stary zapas, 2 dziennie); kantor; podziemia 1-10 (szczątki, skrzynie) | 15 G | 8 nowych i 12 starych rzeczy z brązu |
| 486 | Sztabka stali zakonnej | podziemia 76-99: relikwiarz 25%, skrzynia 10%, kości 4%; Zbroja bez herbu (boss 70) 1 szt., Ostatni Strażnik (boss 90) 3 szt. | (60) | 8 nowych i 13 starych zakonnych rzeczy (tylko z Młotkiem majstra) |
| 487 | Kieł wilka *(opcja)* | oprawianie wilka nożem: 50% | 8 G | 381 Amulet z kłem wilka |
| 488 | Bursztyn *(opcja)* | plaża Wybrzeża po burzy: 1-2 bryłki | 15 G | 382 Bursztynowy amulet |
| 489 | Szlachetny kamień *(opcja)* | podziemia 31-75: kamienniki 4%, żyły rudy 2% | 40 G | 388 Pierścień z akwamarynem, 393 Krwawnikowy pierścień |
| 490 | Nić pajęcza *(opcja)* | pająki pięter 31-50: 15%; Matka pająków 6 szt. | (12) | 356 Jedwabna przeszywanica |
| 491 | Okruch kruszcu Pierwszych *(opcja)* | kamienniki pięter 51-75: 5% | (50) | 310 Prastary miecz |

Surowce, które już są w grze (id): Drewno 61, Kamień 64, Jęczmień 74, Gałęzie 77, Węgiel drzewny 79, Deski 80, Ruda żelaza 85, Żelazo 86, Gwoździe 88, Włókno 92, Lina 93, Skóra wyprawiona 97, Jagody 102, Zioła 104, Wełna 111, Stal 143, Pióra 146, Szyszki 147, Pokrzywa 149, Krwawnik 150, Drewniana tarcza 155, Ścięgna 163, Skóra niedźwiedzia 170, Smoła 176, Wosk pszczeli 185, Surowy krab 186, Dziurawiec 191, Zaśniedziała moneta 194, Poroże jelenia 201, Dębowy kostur 312, Talizman zakonu 389, Pancerz kraba 412. Narzędzia (nie zużywają się): Nożyce 142, Młotek majstra 409.

## Zbroje (26) i płaszcze, pasy (7)

trw. = ile ciosów przyjmie (płaszcze i pasy: dni pracy, jak ubrania); przepis: stanowisko, składniki, godziny i siły · od którego poziomu bohatera przepis widać.

### Głowa (8)

| id | nazwa | materiał | poz. | obrona | ciepło, kary, bonusy | trw. | waga | cena | przepis | skąd jeszcze | opis |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 419 | Sukienny kaptur | sukno | 5 | 4% | ciepło +20% | 55 | 1 | 30 G | Krosno: 2x Sukno, 1x Lina; 2 h, 3 sił · od poz. 1 · Nożyce | szwaczka Dorota; szmaciarz (używany) | Gruby kaptur z sukna z pelerynką na ramiona: ciepły i cichy. |
| 420 | Skórzany hełm | skóra | 7 | 5% | ciepło +5% | 70 | 1 | 40 G | Garbarnia: 2x Skóra, 1x Wosk pszczeli, 1x Ścięgna; 2 h, 4 sił · od 3 | garbarz Ignac; łup: bandyci | Skóra gotowana w wosku: twarda jak deska, lekka jak czapka. |
| 421 | Brązowy hełm z nosalem | brąz | 8 | 7% | oddech -2% | 100 | 2 | 60 G | Kuźnia: 3x Sztabka brązu, 2x Węgiel; 2 h, 6 sił · od 4 | kowal Tadek; podziemia 1-10 | Stożkowy hełm z brązu z nosalem. Mocniejszy od kapalina, trochę męczy. |
| 422 | Żelazny kapalin | żelazo | 10 | 7% | oddech -1% | 120 | 2 | 70 G | Kuźnia: 2x Żelazo, 1x Węgiel, 1x Skóra; 2 h, 5 sił · od 6 | kowal Tadek; kwatermistrz Kłos; łup: najemnicy; podziemia 11-30 | Żelazny kapelusz z szerokim rondem. Lżejszy od hełmu z nosalem. |
| 423 | Stalowy czepiec kolczy | stal | 15 | 7% | ciepło +5%, głośniej 3% | 170 | 2 | 120 G | Kuźnia: 3x Stal, 2x Węgiel, 1x Skóra; 2 h, 7 sił · od 11 | kantor; podziemia 51-75 | Kaptur z drobnych stalowych kółek. Lżejszy i mocniejszy od żelaznego. |
| 424 | Stalowy kapalin | stal | 16 | 7% | - | 170 | 2 | 140 G | Kuźnia: 2x Stal, 1x Węgiel, 1x Skóra; 2 h, 6 sił · od 12 | kantor | Stalowy kapalin z kontynentu: nie męczy i nie dzwoni. |
| 425 | Stalowy hełm garnczkowy | stal | 21 | 9% | oddech -3% | 220 | 4 | 230 G | Kuźnia: 4x Stal, 1x Żelazo, 3x Węgiel, 1x Skóra; 3 h, 9 sił · od 17 | kantor | Zamknięty stalowy garnek z wizjerem. Najmocniejszy hełm z kuźni, ale duszno w nim. |
| 426 | Zakonny czepiec kolczy | stal zakonna | 22 | 8% | ciepło +5% | 240 | 2 | (330) | Kuźnia: 2x Stal zakonna, 1x Stal, 2x Węgiel, 1x Skóra; 3 h, 8 sił · od 18 · Młotek majstra | podziemia 76-99 | Czepiec braci warty z czarnych kółek. Nie dzwoni i nie ciąży. |

### Tors (8)

| id | nazwa | materiał | poz. | obrona | ciepło, kary, bonusy | trw. | waga | cena | przepis | skąd jeszcze | opis |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 427 | Sukienna przeszywanica | sukno | 7 | 20% | ciepło +40% | 70 | 2 | 60 G | Krosno: 3x Sukno, 2x Płótno, 1x Lina; 4 h, 5 sił · od 3 · Nożyce | szwaczka Dorota; kwatermistrz Kłos | Gruby kaftan z sukna pikowany w romby. Najcieplejsza zbroja, cicha jak każda tkanina. |
| 428 | Futrzana skórznia | skóra | 7 | 24% | ciepło +35% | 80 | 4 | 85 G | Garbarnia: 1x Skóra niedźwiedzia, 3x Skóra, 2x Ścięgna; 3 h, 6 sił · od 3 | garbarz Ignac | Skórznia podbita niedźwiedzim futrem. Na zimę i na wilki. |
| 429 | Brązowy napierśnik | brąz | 9 | 27% | oddech -6%, głośniej 12%, chód -2% | 120 | 6 | 140 G | Kuźnia: 5x Sztabka brązu, 3x Węgiel, 2x Skóra; 4 h, 10 sił · od 5 | kowal Tadek; podziemia 1-10 (rzadko) | Wyklepana płyta z brązu na pierś i plecy. Najmocniejszy brąz - i najcięższy. |
| 430 | Żelazny napierśnik | żelazo | 14 | 30% | oddech -7%, głośniej 15%, chód -3% | 170 | 7 | 190 G | Kuźnia: 6x Żelazo, 4x Węgiel, 2x Skóra; 4 h, 12 sił · od 10 | kowal Tadek; podziemia 31-50 | Płyta z kutego żelaza na pasach. Trzyma jak łuska, a dzwoni mniej. |
| 431 | Stalowa łuska | stal | 20 | 33% | oddech -6%, głośniej 20%, chód -2% | 250 | 8 | 380 G | Kuźnia: 6x Stal, 2x Żelazo, 4x Węgiel, 2x Skóra; 5 h, 12 sił · od 16 | kantor; podziemia 51-75 | Stalowe łuski na skórzanym kaftanie. Mniej dusi niż napierśnik, ale słychać ją z daleka. |
| 432 | Stalowa brygantyna | stal | 21 | 33% | oddech -4%, głośniej 6% | 260 | 6 | 440 G | Kuźnia: 5x Stal, 3x Węgiel, 2x Sukno, 10x Gwoździe; 4 h, 11 sił · od 17 | kwatermistrz Kłos (przychylność 70); kantor | Stalowe płytki pod suknem, nabite nitami. Zbroja rotmistrza: mocna i cicha. |
| 433 | Zakonna kolczuga | stal zakonna | 22 | 33% | oddech -3%, głośniej 8% | 300 | 5 | (560) | Kuźnia: 6x Stal zakonna, 4x Węgiel, 1x Skóra; 5 h, 12 sił · od 18 · Młotek majstra | podziemia 76-99 | Kolczuga z czarnych zakonnych kółek. Lekka jak przeszywanica. |
| 434 | Zakonna łuska | stal zakonna | 24 | 34% | oddech -6%, głośniej 14%, chód -2% | 320 | 7 | (620) | Kuźnia: 7x Stal zakonna, 1x Stal, 4x Węgiel, 2x Skóra; 5 h, 13 sił · od 20 · Młotek majstra | podziemia 76-99 | Łuski w kształcie kruczych piór. Prawie jak pancerz zakonny, o poziom wcześniej. |

### Ręce (3), nogi (4), stopy (3)

| id | nazwa | miejsce | materiał | poz. | obrona | ciepło, kary, bonusy | trw. | waga | cena | przepis | skąd jeszcze | opis |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 435 | Pikowane rękawice | ręce | płótno | 2 | 2% | ciepło +5% | 40 | 1 | 12 G | Krosno: 1x Płótno, 1x Wełna; 1 h, 2 sił · od 1 · Nożyce | szwaczka Dorota; szmaciarz (używane) | Rękawice z pikowanego lnu. Trochę chronią, trochę grzeją. |
| 436 | Ćwiekowane karwasze | ręce | skóra | 6 | 3% | głośniej 2% | 70 | 1 | 30 G | Garbarnia: 2x Skóra, 1x Ścięgna, 4x Gwoździe; 1 h, 3 sił · od 2 | garbarz Ignac; łup: bandyci | Skórzane karwasze nabite ćwiekami. Ostrze ześlizguje się po główkach. |
| 437 | Stalowe rękawice kolcze | ręce | stal | 16 | 4% | głośniej 2%; trafienie krytyczne +2% | 190 | 1 | 110 G | Kuźnia: 2x Stal, 1x Węgiel, 1x Skóra; 2 h, 5 sił · od 12 | kantor; podziemia 51-75 | Rękawice z drobnej stalowej kolczugi. Pewny chwyt, częstsze krytyki. |
| 438 | Pikowane nogawice | nogi | płótno | 3 | 3% | ciepło +10% | 45 | 1 | 18 G | Krosno: 2x Płótno, 1x Wełna; 2 h, 3 sił · od 1 · Nożyce | szwaczka Dorota; szmaciarz (używane) | Pikowane nogawice do kolan. Ciepłe i ciche. |
| 439 | Ćwiekowane nagolenniki | nogi | skóra | 7 | 4% | głośniej 3% | 80 | 2 | 38 G | Garbarnia: 2x Skóra, 1x Ścięgna, 6x Gwoździe; 2 h, 4 sił · od 3 | garbarz Ignac; kowal Tadek | Utwardzona skóra z ćwiekami, od kolana do kostki. |
| 440 | Kolcze nogawice | nogi | żelazo | 13 | 5% | głośniej 5% | 140 | 2 | 75 G | Kuźnia: 3x Żelazo, 2x Węgiel, 1x Skóra; 2 h, 6 sił · od 9 | kwatermistrz Kłos; łup: najemnicy; podziemia 31-50 | Nogawice z żelaznych kółek. Chronią jak nagolenniki, a nie spowalniają. |
| 441 | Stalowe nogawice kolcze | nogi | stal | 16 | 5% | głośniej 4% | 190 | 2 | 120 G | Kuźnia: 3x Stal, 2x Węgiel, 1x Skóra; 2 h, 6 sił · od 12 | kantor | Stalowe kółka od biodra do kostki. Lekkie, nie męczą w marszu. |
| 442 | Filcowe buty | stopy | filc (wełna) | 3 | 2% | ciepło +20%, chód +4% | 50 | 1 | 20 G | Krosno: 3x Wełna, 1x Skóra; 2 h, 3 sił · od 1 | szwaczka Dorota | Buty z ubitej wełny na skórzanej podeszwie. Zimą stopy nie marzną. |
| 443 | Buty łowcy | stopy | skóra | 6 | 2% | chód +8%; zwierzęta słyszą cię o 5% słabiej | 80 | 1 | 55 G | Garbarnia: 2x Skóra, 1x Ścięgna, 1x Wełna; 2 h, 4 sił · od 2 | garbarz Ignac | Miękkie buty z wełnianą wyściółką. Szybki i cichy krok. |
| 444 | Brązowe trzewiki | stopy | brąz | 6 | 3% | chód +4%, głośniej 6% | 90 | 2 | 45 G | Kuźnia: 1x Sztabka brązu, 1x Węgiel, 2x Skóra; 1 h, 4 sił · od 2 | kowal Tadek; podziemia 1-10 | Skórzane buty z brązowymi okuciami na palcach. |

### Płaszcze (4) i pasy (3)

Płaszcz ma już swoje miejsce na karcie („Płaszcz” - dziś tylko 112). Na postaci płaszczy jeszcze nie widać (zmieniają sylwetkę - osobny etap grafiki); do tego czasu działają jak dodatki, bez widoku. Pasy - jak pasy z ubioru (przemalowanie paska).

| id | nazwa | miejsce | materiał | co daje | trw. (dni) | waga | cena | przepis | skąd jeszcze | opis |
|---|---|---|---|---|---|---|---|---|---|---|
| 293 | Lniana peleryna | płaszcz | płótno | w upał i suszę pragnienie rośnie o 15% wolniej; marzniesz o 10% mniej | 30 | 1 | 15 G | Krosno: 3x Płótno, 1x Lina; 2 h, 2 sił · Nożyce | szwaczka Dorota; przekupka Agata | Lekka lniana peleryna z kapturem: własny cień w skwarze. |
| 294 | Płaszcz zwiadowcy | płaszcz | sukno | zwierzęta słyszą cię o 10% słabiej; marzniesz o 50% mniej | 60 | 2 | 80 G | Krosno: 3x Sukno, 1x Skóra, 2x Pokrzywa; 3 h, 4 sił · Nożyce | kwatermistrz Kłos (przychylność 30) | Szarozielony płaszcz z sukna. W lesie znikasz w nim jak w mchu. |
| 295 | Futrzany płaszcz | płaszcz | skóra | nie marzniesz (jak Płaszcz 112); trudniej cię przewrócić (+10%) | 90 | 3 | 95 G | Garbarnia: 1x Skóra niedźwiedzia, 2x Skóra, 2x Ścięgna; 3 h, 5 sił | garbarz Ignac | Niedźwiedzie futro na ramionach. Ciężkie, ciepłe - i stoi się w nim pewniej. |
| 296 | Płaszcz zakonny | płaszcz | sukno | opór przed „prawdą” i strachem +10%; marzniesz o 50% mniej | 120 | 2 | (200) | Krosno: 4x Sukno, 1x Talizman zakonu; 4 h, 4 sił · Nożyce | podziemia 51-75 (rzadko) | Czarny płaszcz braci warty, spięty brązowym okiem. |
| 297 | Pas z ładownicą | pas | skóra | udźwig +10; opatrunek leczy o 10% więcej | 80 | 1 | 30 G | Garbarnia: 2x Skóra, 1x Ścięgna, 2x Gwoździe; 2 h, 3 sił | garbarz Ignac; kwatermistrz Kłos | Pas z sakwami na opatrunki i zioła - wszystko pod ręką. |
| 298 | Szeroki pas tragarza | pas | skóra | udźwig +25 | 80 | 2 | 40 G | Garbarnia: 3x Skóra, 2x Gwoździe, 1x Lina; 2 h, 3 sił | garbarz Ignac | Szeroki pas, który trzyma krzyż. Uniesiesz więcej. |
| 299 | Pas z brązowymi okuciami | pas | skóra i brąz | udźwig +10; schludność (Opinia w miasteczku rośnie szybciej) | 80 | 1 | 45 G | Garbarnia: 1x Skóra, 1x Sztabka brązu, 2x Gwoździe; 2 h, 3 sił | kowal Tadek; garbarz Ignac | Pas z brązowymi okuciami - od razu widać, że to ktoś. |

## Tarcze (7)

| id | nazwa | materiał | poz. | blok | oddech bloku | parowanie, osłona, kary | trw. | waga | cena | przepis | skąd jeszcze | opis |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 445 | Plecionka | wiklina | 2 | 72% | 0,65 | parowanie +20% | 35 | 2 | 8 G | Warsztat: 8x Gałęzie, 2x Lina; 1 h, 3 sił · od 1 | szmaciarz (używana) | Tarcza upleciona z wikliny. Lekka, łatwo nią parować, ale słabo trzyma. |
| 446 | Tarcza obciągnięta skórą | skóra | 3 | 77% | 0,6 | parowanie +10% | 60 | 3 | 25 G | Garbarnia: 1x Drewniana tarcza, 2x Skóra, 1x Ścięgna; 2 h, 3 sił · od 1 | garbarz Ignac | Drewniana tarcza obciągnięta mokrą skórą, która wyschła twarda jak bęben. |
| 447 | Brązowy puklerz | brąz | 5 | 68% | 0,55 | parowanie +40% | 80 | 1 | 30 G | Kuźnia: 1x Sztabka brązu, 1x Węgiel, 1x Skóra; 1 h, 4 sił · od 1 | kowal Tadek; podziemia 1-10 | Mała brązowa tarcza na pięść. Do parowania, nie do zasłaniania. |
| 448 | Tarcza z pancerza kraba | pancerz kraba | 8 | 80% | 0,6 | - | 120 | 3 | 60 G | Warsztat: 3x Pancerz kraba, 1x Deski, 2x Lina; 2 h, 4 sił · od 4 | tylko z warsztatu (pancerze z krabów olbrzymów) | Trzy pancerze kraba olbrzyma na desce. Twarda jak żelazo, lekka jak drewno. |
| 449 | Pawęż | żelazo | 14 | 85% | 0,6 | szersza osłona; oddech -6%, chód -3% | 190 | 8 | 160 G | Kuźnia: 3x Żelazo, 2x Węgiel, 4x Deski, 1x Skóra; 3 h, 8 sił · od 10 | kwatermistrz Kłos; zbrojownia Lorda (W7) | Wielka tarcza piechoty okuta żelazem. Chowasz się za nią cały - i ledwo ją dźwigasz. |
| 450 | Stalowy puklerz | stal | 16 | 70% | 0,45 | parowanie +60% | 180 | 1 | 120 G | Kuźnia: 2x Stal, 1x Węgiel, 1x Skóra; 2 h, 5 sił · od 12 | kantor | Stalowy puklerz z kontynentu. Najdłuższe okno parowania ze wszystkich tarcz. |
| 451 | Stalowa migdałowa tarcza | stal | 18 | 85% | 0,55 | szersza osłona; oddech -2% | 230 | 5 | 260 G | Kuźnia: 3x Stal, 1x Żelazo, 2x Węgiel, 2x Deski, 1x Skóra; 3 h, 8 sił · od 14 | kantor; podziemia 51-75 | Migdałowa tarcza ze stalowym brzegiem. Lżejsza od żelaznej, zasłania szerzej. |

## Bronie (21)

Liczby z formuły gry (rodzaj dla żelaza x materiał: kamień 0,70, okute 0,72, brąz 0,84, żelazo 1, stal 1,15, stal zakonna 1,32). W kolumnie liczby: **obrażenia / zachwianie / oddech / zasięg / krytyk**.

**Nowy rodzaj: sulica** (rysunek broni już jest w grafice: `bron_*_sulica`; trzeba dopisać tylko jej liczby):

| rodzaj | zamach | obr. | zachw. | zasięg | oddech | kryt | trw. / waga / cena | cecha |
|---|---|---|---|---|---|---|---|---|
| sulica | włócznia (32) | 24 | 18 | 2,0 | 9 | 5% | x0,7 / 2 / x0,7 | lekka włócznia: krótsza od włóczni, ale tańsza w oddechu i częściej trafia krytycznie |

### Sztylety, tasaki, szable, długie miecze (7)

| id | nazwa | rodzaj | materiał | poz. | liczby | cechy | trw. | waga | cena | przepis | skąd jeszcze | opis |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 452 | Krzemienny sztylet | sztylet | kamień | 2 | 11 / 9 / 7 / 1,2 / 10% | z ukrycia x1,3 | 50 | 1 | 10 G | Warsztat: 2x Kamień, 1x Drewno, 1x Lina; 1 h, 2 sił · od 1 | szmaciarz (używany) | Łupany krzemień na krótkiej rękojeści. Szybki, ale szybko się tępi. |
| 455 | Brązowy tasak | tasak | brąz | 6 | 25 / 28 / 12 / 1,5 / 2% | - | 140 | 2 | 50 G | Kuźnia: 3x Sztabka brązu, 2x Węgiel, 1x Drewno; 2 h, 6 sił · od 2 | kowal Tadek; podziemia 1-10 | Szerokie brązowe ostrze. Rąbie mocniej niż brązowy miecz. |
| 459 | Żelazny długi miecz | długi miecz | żelazo | 13 | 31 / 28 / 14 / 1,75 / 5% | - | 220 | 3 | 130 G | Kuźnia: 4x Żelazo, 2x Węgiel, 1x Skóra; 3 h, 8 sił · od 9 | kowal Tadek; łup: najemnicy; podziemia 31-50 | Długa żelazna głownia na półtorej ręki. Sięga dalej niż miecz. |
| 462 | Stalowy tasak | tasak | stal | 16 | 35 / 32 / 11 / 1,5 / 3% | - | 320 | 2 | 230 G | Kuźnia: 3x Stal, 2x Węgiel, 1x Drewno; 3 h, 7 sił · od 12 | kantor; podziemia 51-75 | Ciężki stalowy tasak. Mocniejszy cios niż stalowy miecz. |
| 463 | Stalowa szabla | szabla | stal | 17 | 29 / 24 / 8 / 1,6 / 10% | - | 290 | 2 | 275 G | Kuźnia: 3x Stal, 2x Węgiel, 1x Skóra; 3 h, 7 sił · od 13 | kantor; kwatermistrz Kłos (przychylność 50) | Szabla z hartowanej stali. Tani cios i dużo krytyków. |
| 467 | Tasak zakonny | tasak | stal zakonna | 23 | 40 / 35 / 10 / 1,5 / 5% | - | 420 | 2 | (495) | Kuźnia: 3x Stal zakonna, 2x Węgiel, 1x Drewno; 4 h, 8 sił · od 19 · Młotek majstra | podziemia 76-99 | Tasak kwatermistrzów zakonu. Czarne ostrze nie zna tępienia. |
| 469 | Długi miecz zakonny | długi miecz | stal zakonna | 26 | 41 / 32 / 12 / 1,75 / 8% | - | 420 | 3 | (625) | Kuźnia: 4x Stal zakonna, 2x Węgiel, 1x Skóra; 5 h, 9 sił · od 22 · Młotek majstra | podziemia 76-99 | Miecz komtura zakonu. Najdłuższe i najmocniejsze ostrze z kuźni. |

### Obuchowe: kostur, cep, maczuga, młot, kiścień (5)

| id | nazwa | rodzaj | materiał | poz. | liczby | cechy | trw. | waga | cena | przepis | skąd jeszcze | opis |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 453 | Okuty kostur | kostur | drewno okute | 4 | 14 / 29 / 11 / 1,75 / - | pancerz +10% | 120 | 2 | 15 G | Warsztat: 1x Dębowy kostur, 6x Gwoździe; 1 h, 2 sił · od 1 | kowal Tadek; szmaciarz (używany) | Dębowy kostur okuty żelazem na obu końcach. |
| 454 | Cep bojowy | kiścień | drewno okute | 4 | 18 / 31 / 12 / 1,45 / 6% | pancerz +20% | 130 | 3 | 20 G | Warsztat: 2x Drewno, 1x Skóra, 6x Gwoździe; 1 h, 3 sił · od 1 | obozy bandytów; szmaciarz (używany) | Chłopski cep, bijak okuty gwoździami. Wieś broniła się nim od zawsze. |
| 456 | Brązowy młot bojowy | młot | brąz | 8 | 31 / 52 / 21 / 1,5 / - | szeroki zamach, pancerz +40% | 170 | 5 | 60 G | Kuźnia: 4x Sztabka brązu, 2x Węgiel, 1x Deski; 3 h, 8 sił · od 4 | kowal Tadek; podziemia 1-10 | Brązowy obuch na długim stylisku - między kamiennym a żelaznym młotem. |
| 457 | Żelazna maczuga | pałka | żelazo | 9 | 21 / 32 / 10 / 1,45 / - | pancerz +20% | 240 | 2 | 65 G | Kuźnia: 2x Żelazo, 1x Węgiel, 1x Drewno; 1 h, 4 sił · od 5 | kowal Tadek; łup: bandyci; podziemia 11-30 | Maczuga z żelazną głowicą. Szybka, tania w oddechu, dobra na pancerz. |
| 464 | Stalowy kiścień | kiścień | stal | 17 | 29 / 39 / 11 / 1,45 / 7% | pancerz +20% | 350 | 3 | 205 G | Kuźnia: 4x Stal, 2x Węgiel, 1x Drewno; 3 h, 8 sił · od 13 | kantor; podziemia 51-75 | Stalowa kula z kolcami na krótkim łańcuchu. |

### Czekany i bardysze (4)

| id | nazwa | rodzaj | materiał | poz. | liczby | cechy | trw. | waga | cena | przepis | skąd jeszcze | opis |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 460 | Żelazny bardysz | bardysz | żelazo | 14 | 34 / 40 / 19 / 1,95 / 3% | szeroki zamach | 220 | 5 | 140 G | Kuźnia: 4x Żelazo, 2x Węgiel, 2x Deski; 3 h, 8 sił · od 10 | kwatermistrz Kłos; zbrojownia Lorda (W7); podziemia 31-50 | Żelazny półksiężyc na drzewcu. Daleki zasięg, ciężki zamach. |
| 465 | Stalowy czekan | czekan | stal | 18 | 33 / 37 / 14 / 1,55 / 8% | pancerz +35% | 320 | 3 | 250 G | Kuźnia: 3x Stal, 2x Węgiel, 1x Deski; 3 h, 7 sił · od 14 | kantor; podziemia 51-75 | Stalowy dziób przebija każdą blachę. |
| 468 | Czekan zakonny | czekan | stal zakonna | 24 | 38 / 39 / 13 / 1,55 / 10% | pancerz +35% | 420 | 3 | (545) | Kuźnia: 3x Stal zakonna, 2x Węgiel, 1x Deski; 4 h, 8 sił · od 20 · Młotek majstra | podziemia 76-99 | Czekan straży bramy z kruczym dziobem. Na puste zbroje nie ma lepszego. |
| 470 | Bardysz zakonny | bardysz | stal zakonna | 26 | 45 / 46 / 17 / 1,95 / 6% | szeroki zamach | 420 | 5 | (650) | Kuźnia: 4x Stal zakonna, 1x Stal, 2x Węgiel, 2x Deski; 5 h, 10 sił · od 22 · Młotek majstra | podziemia 76-99 | Bardysz wart zakonu. Sięga prawie jak włócznia i tnie najmocniej z drzewcowych. |

### Drzewcowe: sulice i rohatyna (3)

| id | nazwa | rodzaj | materiał | poz. | liczby | cechy | trw. | waga | cena | przepis | skąd jeszcze | opis |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 458 | Żelazna sulica | sulica | żelazo | 10 | 24 / 18 / 9 / 2,0 / 5% | - | 150 | 2 | 75 G | Kuźnia: 1x Żelazo, 1x Węgiel, 2x Drewno; 1 h, 4 sił · od 6 | kwatermistrz Kłos; kowal Tadek; podziemia 11-30 | Lekka włócznia z wąskim grotem. Krótsza od włóczni, ale męczy mniej. |
| 461 | Stalowa sulica | sulica | stal | 16 | 28 / 19 / 8 / 2,0 / 6% | - | 220 | 2 | 170 G | Kuźnia: 1x Stal, 1x Węgiel, 2x Drewno; 2 h, 5 sił · od 12 | kantor | Sulica ze stalowym grotem. Szybkie pchnięcia, częste krytyki. |
| 466 | Stalowa rohatyna | rohatyna | stal | 18 | 33 / 28 / 12 / 2,2 / 4% | zwierzęta +30% | 260 | 3 | 215 G | Kuźnia: 3x Stal, 1x Węgiel, 2x Drewno; 2 h, 6 sił · od 14 | kantor | Rohatyna na niedźwiedzia, ze stalowym grotem i poprzeczką. |

### Łuki (2)

liczby: **strzał / zasięg / celowanie / przerwa / sił za strzał** (jak w `BRON_LISTA.md`).

| id | nazwa | wykonanie | poz. | liczby | trw. | waga | cena | przepis | skąd jeszcze | opis |
|---|---|---|---|---|---|---|---|---|---|---|
| 471 | Łuk myśliwski | jesion i ścięgna | 4 | 34 / 9,5 / 58 / 30 / 3 | 90 | 2 | 45 G | Warsztat: 2x Drewno, 3x Ścięgna, 1x Lina, 1x Skóra; 2 h, 4 sił · od 1 | kwatermistrz Kłos; łup: łucznicy | Mocniejszy od pierwszego łuku - krok przed łukiem długim. |
| 472 | Łuk wojenny | drewno, róg i ścięgna | 18 | 45 / 11 / 56 / 32 / 4 | 160 | 2 | 330 G | Warsztat: 3x Drewno, 3x Poroże jelenia, 5x Ścięgna, 1x Smoła, 1x Lina; 4 h, 7 sił · od 14 | kantor | Klejony łuk z drewna, rogu i ścięgien. Strzela daleko i mocno, ciężko się go napina. |

## Ubrania (9)

Jak ubrania z `PLAN.md`: widać je na postaci (przemalowanie części albo nakładka), bez poziomu, małe bonusy. Tors ubrania i zbroi to to samo miejsce (albo kożuszek, albo kolczuga).

| id | nazwa | miejsce | materiał | co daje | trw. (dni) | waga | cena | przepis | skąd jeszcze | opis |
|---|---|---|---|---|---|---|---|---|---|---|
| 284 | Kożuszek | tors | skóra i wełna | zimą i w śniegu marzniesz o 45% mniej | 60 | 2 | 45 G | Garbarnia: 2x Skóra, 3x Wełna, 1x Ścięgna; 3 h, 4 sił | garbarz Ignac | Kamizelka z owczej skóry, wełną do środka. |
| 285 | Fartuch kowalski | tors | skóra | praca męczy o 5% mniej | 80 | 2 | 22 G | Garbarnia: 2x Skóra, 1x Lina; 1 h, 2 sił | garbarz Ignac; kowal Tadek | Ciężki skórzany fartuch. Iskry i drzazgi się go nie imają. |
| 286 | Sukienny żupan | tors | sukno | duża schludność (lepsze ceny u kramarzy, Opinia rośnie szybciej); marzniesz o 15% mniej | 45 | 2 | 75 G | Krosno: 4x Sukno, 1x Płótno, 1x Dziurawiec; 4 h, 4 sił · Nożyce | szwaczka Dorota | Długi żupan z sukna z czerwoną podszewką. Strój na rynek i do dworu. |
| 287 | Przewiewna lniana koszula | tors | len | w upał i suszę pragnienie rośnie o 10% wolniej; schludność | 30 | 1 | 16 G | Krosno: 2x Płótno; 2 h, 2 sił · Nożyce | szwaczka Dorota; przekupka Agata | Luźna koszula z cienkiego lnu. W skwarze chłodzi. |
| 288 | Łatane portki robocze | nogi | płótno i skóra | krzaki i ciernie mniej kaleczą (-15% wysiłku); praca męczy o 3% mniej | 50 | 1 | 18 G | Krosno: 2x Płótno, 1x Skóra; 2 h, 2 sił · Nożyce | szwaczka Dorota; szmaciarz (używane) | Płócienne portki ze skórzanymi łatami na kolanach. |
| 289 | Wełniane rękawiczki | rękawice | wełna | zimą marzniesz o 10% mniej | 30 | 0 | 10 G | Krosno: 2x Wełna; 1 h, 1 siła | szwaczka Dorota | Dziane rękawiczki z jednym palcem. |
| 290 | Filcowy kapelusz | głowa | filc | marzniesz o 10% mniej; w upał pragnienie rośnie o 10% wolniej | 45 | 1 | 22 G | Krosno: 3x Wełna; 2 h, 2 sił | szwaczka Dorota; przekupka Agata | Kapelusz z ubitej wełny - na każdą pogodę. |
| 291 | Chodaki | stopy | drewno i skóra | chodzisz o 6% szybciej | 50 | 1 | 8 G | Warsztat: 1x Deski, 1x Skóra; 1 h, 2 sił | szmaciarz Józek | Drewniane podeszwy ze skórzanym wierzchem. Trwalsze od łapci - i stukają. |
| 292 | Wiklinowy kosz na plecy | plecy | wiklina | udźwig +25 | nie zużywa się | 1 | 10 G | Warsztat: 10x Gałęzie, 2x Lina; 2 h, 3 sił | przekupka Agata | Kosz pleciony z wikliny, na szelkach z liny. |

## Dodatki (10)

Jedno miejsce „Dodatek”, jak dziś; bonusy przez Combat.perk (te same klucze co umiejętności).

| id | nazwa | rodzaj | poz. | co daje | cena | przepis | skąd jeszcze | opis |
|---|---|---|---|---|---|---|---|---|
| 473 | Amulet z piór | amulet | 2 | celujesz o 6% szybciej, strzał +3% | 15 G | Warsztat: 6x Pióra, 1x Lina; 1 h, 1 siła · od 1 | szmaciarz Józek | Pęk lotek na lnianym sznurku. Ręka sama wie, gdzie celować. |
| 474 | Woreczek z ziołami | talizman | 3 | opatrunek leczy o 15% więcej | 20 G | Krosno: 1x Płótno, 2x Krwawnik, 2x Zioła; 1 h, 1 siła · od 1 | szmaciarz Józek | Lniany woreczek z suszonym krwawnikiem. Pachnie jak chata znachorki. |
| 475 | Podkowa na rzemieniu | talizman | 3 | szczęście +10% (stare monety i sprzęt w ruinach) | 20 G | Kuźnia: 1x Żelazo, 1x Węgiel, 1x Skóra; 1 h, 3 sił · od 1 | kowal Tadek | Mała podkowa ramionami do góry - żeby szczęście się nie wysypało. |
| 476 | Amulet z poroża | amulet | 4 | oddech wraca o 8% szybciej | 35 G | Warsztat: 1x Poroże jelenia, 1x Lina; 1 h, 2 sił · od 1 | szmaciarz Józek | Krążek z poroża jelenia. Biegnie się w nim lżej. |
| 477 | Obrączka z modlitwą | pierścień | 6 | strach i zamęt trwają o 10% krócej | 45 G | Kuźnia: 1x Sztabka brązu, 1x Węgiel; 1 h, 2 sił · od 2 | kowal Tadek; podziemia 1-10 | Brązowa obrączka z wyrytą modlitwą przewoźników. |
| 478 | Rzemień tropiciela | talizman | 5 | zwierzęta słyszą cię o 8% słabiej | 30 G | Garbarnia: 1x Skóra, 1x Ścięgna, 2x Pióra; 1 h, 2 sił · od 1 | garbarz Ignac; łup: łucznicy | Rzemień z piórami sowy na nadgarstku. Krok staje się cichszy. |
| 479 | Żelazny sygnet | pierścień | 11 | obrażenia wręcz +7% | 90 G | Kuźnia: 2x Żelazo, 1x Węgiel; 2 h, 4 sił · od 7 | kowal Tadek; łup: najemnicy | Ciężki żelazny sygnet. Cios z nim w pięści waży więcej. |
| 480 | Stalowy pierścień łucznika | pierścień | 15 | celujesz o 15% szybciej, strzał +8% | 150 G | Kuźnia: 1x Stal, 1x Węgiel, 1x Poroże jelenia; 2 h, 4 sił · od 11 | kantor | Pierścień na kciuk ze stali i rogu. Cięciwa schodzi równo. |
| 481 | Stalowy sygnet | pierścień | 17 | życie +25 | 200 G | Kuźnia: 2x Stal, 1x Ruda żelaza, 1x Węgiel; 2 h, 5 sił · od 13 | kantor; podziemia 51-75 | Stalowy sygnet z oczkiem z hematytu (to ruda żelaza). Wytrzymujesz dużo więcej. |
| 482 | Pierścień z okiem zakonu | pierścień | 22 | opór przed „prawdą” i strachem +15%; strach i zamęt trwają o 10% krócej | (320) | Kuźnia: 1x Stal zakonna, 1x Stal, 1x Węgiel; 3 h, 6 sił · od 18 · Młotek majstra | podziemia 76-99 | Pierścień brata warty z wyrytym okiem. Szepty ruin milkną. |

## Istniejące przedmioty bez przepisu (93)

Dziś nie da się zrobić: 26 broni, 17 części zbroi, 3 tarcz, 13 dodatków i wszystkich 34 ubrań (250-283). Poniżej przepis dla każdej. **Unikaty 396-406 zostają celowo bez przepisu** (każdy raz w grze, z historią). Przepisy w tej samej skali co dzisiejsze (miecz 3 sztabki, kolczuga 6, karwasze 2). „od” = poziom, od którego przepis widać.

### Kuźnia (44)

| id | nazwa | proponowany przepis | uwaga |
|---|---|---|---|
| 300 | Brązowy sztylet | 1x Sztabka brązu, 1x Węgiel, 1x Drewno; 1 h, 4 sił · od 1 | |
| 303 | Mizerykordia zakonna | 1x Stal zakonna, 1x Stal, 1x Węgiel, 1x Drewno; 2 h, 6 sił · od 19 · Młotek majstra | |
| 304 | Brązowy miecz | 3x Sztabka brązu, 2x Węgiel, 1x Skóra; 2 h, 6 sił · od 2 | |
| 306 | Tasak | 3x Żelazo, 2x Węgiel, 1x Drewno; 2 h, 6 sił · od 6 | |
| 307 | Żelazna szabla | 3x Żelazo, 2x Węgiel, 1x Skóra; 3 h, 7 sił · od 8 | |
| 309 | Stalowy długi miecz | 4x Stal, 2x Węgiel, 1x Skóra; 3 h, 8 sił · od 15 | |
| 310 | Prastary miecz | 3x Okruch kruszcu Pierwszych, 2x Węgiel, 1x Skóra; 4 h, 8 sił · od 16 · Młotek majstra | nowy surowiec (opcja); radzę zostawić znaleziskiem |
| 311 | Miecz zakonny | 3x Stal zakonna, 2x Węgiel, 1x Skóra; 4 h, 8 sił · od 20 · Młotek majstra | |
| 314 | Brązowa maczuga | 2x Sztabka brązu, 1x Węgiel, 1x Drewno; 1 h, 4 sił · od 1 | |
| 315 | Kiścień | 4x Żelazo, 2x Węgiel, 1x Drewno; 2 h, 6 sił · od 7 | |
| 316 | Brązowy buzdygan | 3x Sztabka brązu, 2x Węgiel, 1x Drewno; 2 h, 6 sił · od 3 | |
| 318 | Stalowy pernacz | 3x Stal, 2x Węgiel, 1x Drewno; 3 h, 7 sił · od 13 | |
| 319 | Buzdygan zakonny | 3x Stal zakonna, 2x Węgiel, 1x Drewno; 4 h, 8 sił · od 20 · Młotek majstra | |
| 320 | Brązowy topór | 3x Sztabka brązu, 2x Węgiel, 1x Deski; 2 h, 6 sił · od 2 | |
| 322 | Czekan | 3x Żelazo, 2x Węgiel, 1x Deski; 2 h, 6 sił · od 8 | |
| 324 | Bardysz | 4x Stal, 2x Węgiel, 2x Deski; 3 h, 8 sił · od 15 | |
| 325 | Topór zakonny | 3x Stal zakonna, 2x Węgiel, 1x Deski; 4 h, 8 sił · od 21 · Młotek majstra | |
| 329 | Młot zakonny | 4x Stal zakonna, 2x Stal, 3x Węgiel, 1x Deski; 4 h, 10 sił · od 22 · Młotek majstra | |
| 330 | Brązowa włócznia | 2x Sztabka brązu, 1x Węgiel, 2x Drewno; 2 h, 5 sił · od 1 | |
| 332 | Rohatyna | 3x Żelazo, 1x Węgiel, 2x Drewno; 2 h, 5 sił · od 7 | |
| 333 | Stalowa włócznia | 2x Stal, 1x Węgiel, 2x Drewno; 2 h, 5 sił · od 12 | |
| 334 | Włócznia zakonna | 2x Stal zakonna, 1x Węgiel, 2x Drewno; 3 h, 6 sił · od 20 · Młotek majstra | |
| 344 | Brązowy kapalin | 2x Sztabka brązu, 1x Węgiel, 1x Skóra; 2 h, 5 sił · od 2 | |
| 348 | Hełm zakonny | 3x Stal zakonna, 2x Węgiel; 3 h, 8 sił · od 20 · Młotek majstra | |
| 352 | Brązowa łuska | 4x Sztabka brązu, 3x Węgiel, 2x Skóra; 4 h, 10 sił · od 3 | |
| 354 | Żelazna łuska | 6x Żelazo, 4x Węgiel, 2x Skóra; 4 h, 11 sił · od 9 | |
| 355 | Brygantyna | 4x Żelazo, 2x Węgiel, 2x Sukno, 10x Gwoździe; 4 h, 10 sił · od 11 | dziś tylko u Kłosa od przychylności 50 - przepis mógłby wymagać tej samej przychylności |
| 359 | Pancerz zakonny | 6x Stal zakonna, 2x Stal, 4x Węgiel, 2x Skóra; 5 h, 13 sił · od 21 · Młotek majstra | |
| 361 | Brązowe karwasze | 1x Sztabka brązu, 1x Węgiel, 1x Skóra; 1 h, 4 sił · od 2 | |
| 363 | Rękawice kolcze | 2x Żelazo, 1x Węgiel, 1x Skóra; 2 h, 5 sił · od 8 | |
| 365 | Karwasze zakonne | 1x Stal zakonna, 1x Stal, 1x Węgiel, 1x Skóra; 2 h, 6 sił · od 20 · Młotek majstra | |
| 367 | Brązowe nagolenniki | 2x Sztabka brązu, 1x Węgiel, 1x Skóra; 1 h, 4 sił · od 3 | |
| 370 | Nagolenniki zakonne | 2x Stal zakonna, 1x Węgiel, 1x Skóra; 2 h, 6 sił · od 20 · Młotek majstra | |
| 373 | Stalowe trzewiki | 1x Stal, 1x Węgiel, 2x Skóra; 2 h, 5 sił · od 13 | |
| 374 | Buty zakonne | 1x Stal zakonna, 1x Węgiel, 2x Skóra; 2 h, 5 sił · od 20 · Młotek majstra | |
| 376 | Okrągła tarcza z umbem | 1x Drewniana tarcza, 1x Sztabka brązu, 2x Gwoździe; 1 h, 4 sił · od 3 | |
| 377 | Puklerz | 2x Żelazo, 1x Węgiel, 1x Skóra; 2 h, 5 sił · od 5 | |
| 380 | Tarcza zakonna | 3x Stal zakonna, 1x Stal, 2x Węgiel, 2x Deski, 1x Skóra; 4 h, 9 sił · od 20 · Młotek majstra | |
| 383 | Miedziany pierścień | 2x Zaśniedziała moneta, 1x Węgiel; 1 h, 2 sił · od 1 | moneta jest miedziana |
| 384 | Pierścień z hematytem | 1x Żelazo, 2x Ruda żelaza, 1x Węgiel; 2 h, 4 sił · od 4 | hematyt to ruda żelaza |
| 388 | Pierścień z akwamarynem | 1x Stal, 1x Szlachetny kamień, 1x Węgiel; 2 h, 4 sił · od 8 | nowy surowiec (opcja) |
| 389 | Talizman zakonu | 1x Sztabka brązu, 1x Węgiel, 1x Lina; 2 h, 3 sił · od 6 | odlew brązowego kręgu z okiem |
| 391 | Pierścień najemnika | 2x Żelazo, 1x Stal, 1x Węgiel; 2 h, 4 sił · od 6 | dziś u Kłosa od przychylności 50 |
| 393 | Krwawnikowy pierścień | 1x Żelazo, 1x Szlachetny kamień, 1x Węgiel; 2 h, 4 sił · od 5 | nowy surowiec (opcja) |

### Garbarnia (13)

| id | nazwa | proponowany przepis | uwaga |
|---|---|---|---|
| 339 | Proca rzemienna | 2x Skóra, 2x Ścięgna; 1 h, 2 sił · od 3 | |
| 258 | Brązowa skórzana opaska | 1x Skóra; 1 h, 1 siła | |
| 259 | Czarna skórzana opaska | 1x Skóra, 1x Węgiel; 1 h, 1 siła | węgiel czerni skórę |
| 266 | Zielona skórzana kurta | 3x Skóra, 2x Ścięgna, 1x Lina, 2x Pokrzywa; 3 h, 5 sił | jak kurtka 171 + barwnik |
| 273 | Czarne skórzane spodnie | 2x Skóra, 1x Ścięgna, 1x Węgiel; 2 h, 3 sił | |
| 274 | Brązowe skórzane spodnie | 2x Skóra, 1x Ścięgna; 2 h, 3 sił | |
| 276 | Czarne skórzane buty | 2x Skóra, 1x Lina, 1x Węgiel; 2 h, 4 sił | jak buty 113 + czerń |
| 277 | Brązowy skórzany pas | 1x Skóra, 2x Gwoździe; 1 h, 1 siła | gwoździe na sprzączkę |
| 278 | Czarny skórzany pas | 1x Skóra, 2x Gwoździe, 1x Węgiel; 1 h, 1 siła | |
| 279 | Pas z sakiewką | 2x Skóra, 1x Ścięgna, 2x Gwoździe; 2 h, 2 sił | |
| 280 | Brązowe skórzane rękawice | 1x Skóra, 1x Ścięgna; 1 h, 2 sił | |
| 281 | Szare skórzane rękawice | 1x Skóra, 1x Ścięgna, 1x Wosk pszczeli; 1 h, 2 sił | wosk rozjaśnia skórę |
| 283 | Skórzana torba przez ramię | 3x Skóra, 1x Ścięgna, 1x Lina; 2 h, 3 sił | |

### Warsztat (11)

| id | nazwa | proponowany przepis | uwaga |
|---|---|---|---|
| 335 | Łuk długi | 3x Drewno, 3x Ścięgna, 1x Lina, 1x Skóra; 2 h, 5 sił · od 4 | |
| 336 | Łuk refleksyjny | 2x Drewno, 2x Poroże jelenia, 4x Ścięgna, 1x Lina; 3 h, 6 sił · od 10 | róg z poroża |
| 337 | Łuk zakonny | 3x Drewno, 1x Stal zakonna, 4x Ścięgna, 1x Poroże jelenia; 4 h, 7 sił · od 20 · Młotek majstra | sztabka na okucia |
| 381 | Amulet z kłem wilka | 1x Kieł wilka, 1x Lina; 1 h, 1 siła · od 1 | nowy surowiec (opcja) |
| 382 | Bursztynowy amulet | 1x Bursztyn, 1x Lina; 1 h, 1 siła · od 1 | nowy surowiec (opcja) |
| 385 | Kciukowy pierścień łucznika | 1x Poroże jelenia; 1 h, 1 siła · od 2 | rogowy pierścień |
| 386 | Kruczy talizman | 1x Kamień, 2x Pióra, 1x Lina; 1 h, 1 siła · od 2 | kamyk z wyrytym krukiem |
| 390 | Paciorki strażnika | 1x Talizman zakonu, 6x Kamień, 1x Lina; 4 h, 3 sił · od 14 | radzę zostawić tylko z Upiora pytającego (piętro 80) |
| 392 | Muszla z przystani | 1x Surowy krab, 1x Lina; 1 h, 1 siła · od 1 | skorupka zamiast muszli |
| 394 | Grosz strażnicy | 3x Zaśniedziała moneta, 1x Skóra; 1 h, 1 siła · od 1 | z trzech monet jedna ma kruka |
| 275 | Łapcie z łyka | 4x Gałęzie, 2x Włókno; 1 h, 1 siła | łyko z kory gałęzi |

### Krosno (25)

| id | nazwa | proponowany przepis | uwaga |
|---|---|---|---|
| 342 | Czepiec pikowany | 1x Płótno, 2x Włókno; 1 h, 2 sił · od 1 · Nożyce | |
| 343 | Kaptur zwiadowcy | 2x Sukno, 2x Pokrzywa; 2 h, 3 sił · od 4 · Nożyce | dziś u Kłosa od przychylności 30 |
| 349 | Przeszywanica | 3x Płótno, 1x Wełna, 1x Lina; 3 h, 4 sił · od 1 · Nożyce | |
| 356 | Jedwabna przeszywanica | 6x Nić pajęcza, 1x Płótno; 5 h, 5 sił · od 12 · Nożyce | nowy surowiec (opcja); radzę zostawić nagrodą Matki pająków |
| 250 | Słomkowy kapelusz | 4x Jęczmień, 1x Włókno; 1 h, 1 siła | słoma z jęczmienia |
| 251 | Ciemny słomkowy kapelusz | 4x Jęczmień, 1x Włókno, 1x Węgiel; 1 h, 1 siła | okopcony nad żarem |
| 252 | Biała lniana chusta | 1x Płótno; 1 h, 1 siła · Nożyce | |
| 253 | Czerwona lniana chusta | 1x Płótno, 1x Dziurawiec; 1 h, 1 siła · Nożyce | |
| 254 | Niebieska lniana chusta | 1x Płótno, 3x Jagody; 1 h, 1 siła · Nożyce | |
| 255 | Brązowa filcowa czapka | 2x Wełna, 2x Szyszki; 1 h, 1 siła | |
| 256 | Szara filcowa czapka | 2x Wełna; 1 h, 1 siła | |
| 257 | Zielona filcowa czapka | 2x Wełna, 2x Pokrzywa; 1 h, 1 siła | |
| 260 | Biała lniana koszula | 2x Płótno; 2 h, 2 sił · Nożyce | |
| 261 | Żółta lniana koszula | 2x Płótno, 2x Krwawnik; 2 h, 2 sił · Nożyce | |
| 262 | Niebieska lniana koszula | 2x Płótno, 3x Jagody; 2 h, 2 sił · Nożyce | |
| 263 | Czerwony wełniany kaftan | 2x Sukno, 1x Dziurawiec; 3 h, 3 sił · Nożyce | |
| 264 | Brązowy wełniany kaftan | 2x Sukno, 2x Szyszki; 3 h, 3 sił · Nożyce | |
| 265 | Granatowy wełniany kaftan | 2x Sukno, 4x Jagody; 3 h, 3 sił · Nożyce | |
| 267 | Odświętna koszula z haftem | 3x Płótno, 2x Dziurawiec; 4 h, 3 sił · Nożyce | czerwony haft; dziś tylko w kantorze |
| 268 | Szare płócienne spodnie | 2x Płótno; 2 h, 2 sił · Nożyce | |
| 269 | Niebieskie płócienne spodnie | 2x Płótno, 3x Jagody; 2 h, 2 sił · Nożyce | |
| 270 | Brązowe płócienne spodnie | 2x Płótno, 2x Szyszki; 2 h, 2 sił · Nożyce | |
| 271 | Brązowe wełniane spodnie | 2x Sukno, 2x Szyszki; 3 h, 3 sił · Nożyce | |
| 272 | Zielone wełniane spodnie | 2x Sukno, 2x Pokrzywa; 3 h, 3 sił · Nożyce | |
| 282 | Płócienna torba przez ramię | 3x Płótno, 1x Lina; 2 h, 2 sił · Nożyce | |

## Co trzeba będzie dorobić (po akceptacji)

- **Dane** (przy zamkniętym edytorze): `data/Items.json` 284-299, 419-486 (opcjonalnie 487-491). Ikony: 284-297 na wolne pola 562-575, 298-299 na 685-686, 419-491 w nowych rzędach IconSet od 688 (formuła `ikonaOf` dla id od 419 przesunięta).
- **`Bron_Data.js`**: 64 nowe rzeczy, rodzaj `sulica` w RODZAJE, łuki `mysliwski` i `wojenny` w MATERIALY, nowa lista przepisów `loom` (krosno) + przepisy dla starych rzeczy, sklepy (nowe numery u Tadka, Kłosa, kantoru, Ignaca, Doroty, Józka), łupy (pasma podziemi, najemnicy, bandyci), sztabka stali zakonnej w pojemnikach pięter 76-99 i u bossów 70 i 90.
- **`Farming_Data.js`**: budynek „Krosno” (koszt, tkanie płótna i sukna, ulepszenie „kołowrotek”), w kuźni „Przetop monety” (sztabka brązu).
- **`Ubior_Data.js` + `Equipment.js`**: 16 rzeczy 284-299; miejsce `plaszcz` -> część „Płaszcz”; nowe klucze bonusów ubrań (opatrunek, skradanie, opór umysłu, przewrócenie) przez Combat.perk; rampy kolorów nowych ubrań.
- **Grafika**: rampy kolorów dla par, które już mają rysunek (sulica, tasak, długi miecz, bardysz, czekan w nowych materiałach, karwasze i nagolenniki z płótna, `buty_okute_braz`, puklerz z brązu i stali, migdałowa ze stali) - bez PixelLab. Nowe rysunki: 3 tarcze (plecionka, krab, pawęż) i budynek krosna (prosto z przodu, jak inne budowle). Płaszcze na postaci - osobny etap.

## Podsumowanie

| kategoria | ile | numery | stanowiska |
|---|---|---|---|
| Zbroje: głowa 8, tors 8, ręce 3, nogi 4, stopy 3 | 26 | 419-444 | kuźnia 16, garbarnia 5, krosno 5 |
| Płaszcze 4 i pasy 3 | 7 | 293-299 | krosno 3, garbarnia 4 |
| Tarcze | 7 | 445-451 | kuźnia 4, garbarnia 1, warsztat 2 |
| Bronie: wręcz 19 (w tym nowy rodzaj sulica), łuki 2 | 21 | 452-472 | kuźnia 16, warsztat 5 |
| Ubrania | 9 | 284-292 | krosno 5, garbarnia 2, warsztat 2 |
| Dodatki: 5 pierścieni, 2 amulety, 3 talizmany | 10 | 473-482 | kuźnia 6, warsztat 2, garbarnia 1, krosno 1 |
| **razem nowych** | **80** | 284-299, 419-482 | kuźnia 42, garbarnia 13, warsztat 11, krosno 14 |
| nowe surowce | 4 (+5 do wyboru) | 483-486 (487-491) | krosno, kuźnia, podziemia |
| przepisy dla starych rzeczy | 93 | 250-283, 300-395 | kuźnia 44, garbarnia 13, warsztat 11, krosno 25 |

Najlepszy komplet po zmianie: płótno 31%, skóra 39%, brąz 44%, żelazo 50%, stal 57%, stal zakonna 58% (sufit). Nowe bronie trzymają się krzywej 11-45; zakonne bronie, zbroje i dodatki da się wykuć dopiero z Młotkiem majstra.

## Pytania do Ciebie

1. **Brąz w kuźni**: dziś „brąz nie jest do kucia” (na wyspie nie ma miedzi ani cyny). Proponuję sztabki brązu z przetopu zaśniedziałych monet i ze starego zapasu u Tadka i w kantorze. Zgoda - czy brąz ma zostać tylko w sklepie i łupach (wtedy 8 nowych brązowych rzeczy nie będzie do zrobienia)?
2. **Stal zakonna**: kucie tylko z Młotkiem majstra (W22) i ze sztabek z pięter 76-99 - czy tak, czy zakonne rzeczy mają zostać wyłącznie łupem (wtedy 8 nowych zakonnych rzeczy tylko z podziemi)?
3. **Pięć nowych surowców tylko dla starych rzeczy** (kieł wilka, bursztyn, szlachetny kamień, nić pajęcza, okruch kruszcu Pierwszych): dodać je, czy zostawić te 6 rzeczy (381, 382, 388, 393, 356, 310) jako znaleziska i towar ze sklepu?
