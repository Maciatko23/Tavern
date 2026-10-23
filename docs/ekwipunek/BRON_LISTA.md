# Broń, zbroje, tarcze i dodatki - lista do akceptacji

Zrobione z `js/plugins/Bron_Data.js` (`node tools/bron/lista.js` - tabela i gra mają te same liczby). Plan: `PLAN_BRON_ZBROJE.md`.
Nic z tego nie jest jeszcze w grze: przedmioty i ikony czekają w `tools/bron/staging/` na akceptację i instalację (`tools/bron/instaluj_dane.py`).

## Podsumowanie

| co | ile | numery | ikony |
|---|---|---|---|
| broń wręcz | 35 | 300-334 | od 576 |
| stalowe narzędzia (siekiera, kilof - też broń) | 2 | 407, 408 | |
| łuki i proce | 5 | 335, 336, 337, 338, 339 | |
| zbroje i części zbroi | 35 | 340-374 | |
| tarcze | 6 | 375-380 | |
| dodatki (amulety, pierścienie, talizmany) | 15 | 381-395 | |
| unikaty | 11 | 396-406 | |
| **razem** | **109** | 300-408 | 576-684 (7 nowych rzędów IconSet) |

- Obrażenia broni wręcz: **11-49** (dziś: pięści 5, pałka 13, kamienna siekiera 17, oszczep 20, żelazna siekiera 26, żelazny kilof 30); unikaty do 42. Strzał: 18-48 (dziś proca 14, łuk 30).
- Zbroja: część ciosu, którą zatrzymuje - pojedyncza część **2%-37%**, cały komplet: skóra ok. 34%, brąz ok. 41%, żelazo ok. 50%, stal ok. 56%, zakonny 59% (sufit sumy **58%**; dziś kurtka 20%). Tarcze: blok **68-87%** (dziś drewniana 75%).
- Ceny w sklepach: **15-420 G** (dług dziadka: 2500 G). W nawiasie wartość rzeczy niesprzedawanych (tyle liczy kupiec przy skupie).

## Zasady balansu

### Poziom przedmiotu - przeliczony na prawdziwe tempo gry

Plan mówi: drewno / kamień 1-10, brąz 10-25, żelazo 25-45, stal 45-70, zakonne 70-100. W grze doświadczenie do następnego poziomu rośnie o 20% na poziom (Combat.js), więc:

| poziom | doświadczenie od początku |
|---|---|
| 10 | 10 tys. |
| 15 | 30 tys. |
| 20 | 77 tys. |
| 25 | 196 tys. |
| 30 | 492 tys. |
| 45 | 7,6 mln |
| 70 | 726,8 mln |

Boss 90. piętra daje ok. 27 tys. doświadczenia, a próba sił (docs/WALKA.md) zakłada bohatera na **poziomie 25 przy 90. piętrze**. Poziom 45 to ~7,6 mln doświadczenia - w praktyce nieosiągalny, 70 i 100 tym bardziej.
Dlatego **przedziały planu przeliczyłem na tempo gry** (kolejność i proporcje te same):

| materiał | plan | w grze | skąd w podziemiach |
|---|---|---|---|
| drewno, kamień, skóra, płótno | 1-10 | 1-5 | - |
| brąz | 10-25 | 5-9 | piętra 1-10 (bohater ~1-6) |
| żelazo | 25-45 | 9-15 | piętra 11-50 (bohater ~6-17) |
| stal, kruszec Pierwszych | 45-70 | 15-22 | piętra 51-75 (bohater ~17-22) |
| stal zakonna | 70-100 | 22-27 | piętra 76-99 (bohater ~22-25) |

**Kara za za wysoki poziom** (zamiast blokady): rzecz z poziomem wyższym niż bohater działa słabiej o **3% za każdy brakujący poziom (najwyżej 45%)** - broń zadaje mniej obrażeń, słabiej chwieje i kosztuje więcej oddechu, zbroja i tarcza mniej zatrzymują, dodatek mniej daje. Na karcie i w sklepie widać: „poziom 16 - masz 10: słabiej o 18%”. Stare przedmioty (siekiery, kilofy, pałka, oszczep, łuk, proca, drewniana tarcza, kurtka) mają poziom 1 - działają jak dziś.

### Broń: rodzaj x materiał

Każda broń = liczby rodzaju (dla żelaza) x mnożnik materiału. Obrażenia: drewno x0,55, okute x0,72, kamień x0,70, brąz x0,84, żelazo x1, stal x1,15, kruszec Pierwszych x1,24, stal zakonna x1,32. Zachwianie rośnie o połowę tego. Stal: oddech -1, kryt +1%; zakonna: oddech -2, kryt +3%.

| rodzaj | zamach (klatki) | obr. | zachw. | zasięg | oddech | kryt | cecha |
|---|---|---|---|---|---|---|---|
| sztylet | pięść (18) | 16 | 11 | 1,2 | 7 | 10% | szybki i tani w oddechu, częste krytyki, mocny cios z ukrycia; krótki zasięg |
| miecz | pałka (22) | 27 | 24 | 1,55 | 11 | 5% | wszechstronny: szybki zamach, dobre obrażenia, trochę krytyków |
| tasak | pałka (22) | 30 | 30 | 1,5 | 12 | 2% | ciężkie ostrze: więcej obrażeń i zachwiania niż miecz, mało krytyków |
| szabla | pałka (22) | 25 | 22 | 1,6 | 9 | 9% | lekka i szybka: tani cios, dużo krytyków |
| długi miecz | pałka (22) | 31 | 28 | 1,75 | 14 | 5% | dłuższy zasięg i mocniejszy cios niż miecz, droższy w oddechu |
| pałka | pałka (22) | 21 | 32 | 1,45 | 10 | - | tania i szybka, mocno zbija równowagę, lepsza na pancerz |
| kostur | pałka (22) | 20 | 34 | 1,75 | 11 | - | długi drąg: zasięg i równowaga, małe obrażenia |
| kiścień | pałka (22) | 25 | 36 | 1,45 | 12 | 6% | kula na łańcuchu: nieprzewidywalny, krytyki i równowaga |
| buzdygan | pałka (22) | 25 | 40 | 1,45 | 13 | 2% | piórowa głowica: bardzo mocno zbija równowagę, +30% na pancerz |
| topór | siekiera (26) | 31 | 36 | 1,6 | 16 | 3% | szeroki zamach (z umiejętnością trafia wszystkich), mocny, wolniejszy |
| czekan | siekiera (26) | 29 | 34 | 1,55 | 15 | 7% | dziób z tyłu obucha: przebija pancerz, krytyki |
| bardysz | siekiera (26) | 34 | 40 | 1,95 | 19 | 3% | topór na drzewcu: bardzo daleki zasięg, ciężki |
| młot | kilof (34) | 37 | 56 | 1,5 | 21 | - | najcięższy: ogromne zachwianie i obrażenia, +40% na pancerz, wolny i drogi w oddechu |
| włócznia | włócznia (32) | 28 | 20 | 2,3 | 12 | 3% | najdalszy zasięg (pchnięcia na wprost), słabiej zbija równowagę |
| rohatyna | włócznia (32) | 29 | 26 | 2,2 | 13 | 3% | włócznia na grubego zwierza: +30% na zwierzęta |

Szybkość broni daje zamach: krótki zamach (pałka 22 klatki, pięść 18) = więcej ciosów na sekundę, ciężki (kilof 34) = mniej, ale mocniej. Przykład (żelazo, seria ciosów): miecz ok. 87 obrażeń na sekundę i 30 oddechu na sekundę, topór ok. 84 / 37, młot ok. 69 / 37 (na zbroje ok. 97), sztylet ok. 67 z krytykami / 23 (najtańszy w oddechu), włócznia ok. 62 / 22 (ale z 2,3 pola).
Cechy: **pancerz** - więcej obrażeń w puste zbroje, kamienniki i kolczugę najemnika (pałki +20%, buzdygany +30%, czekan +35%, młoty +40%); **na zwierzęta** - rohatyna +30%; **z ukrycia** - sztylety x1,3 do ataku z ukrycia; **krytyk** dodaje się do szansy bohatera (Czujność, umiejętności).

Porównanie z dzisiejszymi: brązowy topór (26) bije jak żelazna siekiera; żelazny miecz (27) jest szybszy od żelaznej siekiery (26, zamach 26 klatek) i tańszy w oddechu (11 zamiast 16); kamienny młot (26, ale wolny i drogi w oddechu) to mocny start z trzech kamieni. Narzędzia zostają narzędziami - ich liczby się nie zmieniają.

### Zbroja

Każda założona część zbroi zatrzymuje swoją część ciosu, który doszedł (po bloku); części się sumują, najwyżej **58%** (Niezłomny z drzewka Obrony liczy się osobno, jak dziś). Każda część zużywa się od każdego ciosu, który doszedł (jak kurtka). Udział części: tors ok. 60%, głowa 15%, nogi 10%, ręce 8%, stopy 7%. Sufit i liczby stali / stali zakonnej zmniejszone po próbie sił (niżej).
Ciężkie zbroje mają kary: **oddech** (krótszy pasek oddechu, np. kolczuga -5%, napierśnik -7%), **skradanie** (zwierzęta słyszą cię lepiej, np. łuska +20%), **chód** (łuski i napierśnik -3%). Skóra i płótno są ciche i ciepłe; buty dają szybszy chód. Zbroja zajmuje te same miejsca co ubranie (głowa, tors, ręce, nogi, stopy) - na torsie albo koszula, albo kolczuga.

### Tarcze i dodatki

Tarcza w lewej ręce: **blok** (ile ciosu zatrzymuje przy P), **oddech bloku** (ile oddechu zabiera przyjęty cios - mniej = lepiej), **parowanie** (dłuższe okno idealnego parowania), **osłona** (garda łapie też ciosy z boku). Ciężkie tarcze skracają oddech. Dodatek: jedno miejsce „Dodatek” na karcie - jeden amulet, pierścień albo talizman naraz; bonusy idą przez Combat.perk (te same klucze co umiejętności - liczą się razem).

### Ceny i skup

Cena = cena materiału (brąz 55, żelazo 110, stal 240 G za miecz) x udział rodzaju (sztylet 0,55, włócznia 0,8, miecz 1, długi miecz 1,2). Kupcy odkupują swój rodzaj za 40-45% ceny (zużyte mniej), szmaciarz wszystko za 20%; unikatów nikt nie kupuje. Naprawa u kowala / garbarza / szwaczki: 30% ceny za całe zużycie (stal zakonną i kruszec Pierwszych kowal naprawia za podwójną cenę); żelazne i stalowe naprawisz też w warsztacie (sztabka + węgiel).

## Broń wręcz (37)

obr. = obrażenia ciosu (przed Siłą i umiejętnościami), zachw. = zbijanie równowagi wroga, oddech = koszt ciosu, zasięg w polach, trw. = wytrzymałość (ciosy; włócznie: pchnięcia).

| id | nazwa | rodzaj | materiał | poz. | obr. | zachw. | oddech | zasięg | kryt | cechy | trw. | waga | cena | skąd |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 300 | Brązowy sztylet | sztylet | brąz | 5 | 13 | 10 | 7 | 1,2 | 10% | z ukrycia x1,3 | 110 | 1 | 30 G | kowal Tadek; łup: nożownicy, bandyci; podziemia 1-10; szmaciarz (używany) |
| 301 | Żelazny sztylet | sztylet | żelazo | 9 | 16 | 11 | 7 | 1,2 | 10% | z ukrycia x1,3 | 180 | 1 | 60 G | kowal Tadek; kuźnia; łup: nożownicy; podziemia 11-30 |
| 302 | Stalowy sztylet | sztylet | stal | 15 | 18 | 12 | 6 | 1,2 | 11% | z ukrycia x1,3 | 260 | 1 | 130 G | kantor; kuźnia (stal) |
| 303 | Mizerykordia zakonna | sztylet | stal zakonna | 23 | 21 | 13 | 5 | 1,2 | 16% | z ukrycia x1,5 | 340 | 1 | (285) | podziemia 76-99 |
| 304 | Brązowy miecz | miecz | brąz | 6 | 23 | 22 | 11 | 1,55 | 5% | - | 140 | 2 | 55 G | kowal Tadek; podziemia 1-10 |
| 305 | Żelazny miecz | miecz | żelazo | 10 | 27 | 24 | 11 | 1,55 | 5% | - | 220 | 2 | 110 G | kowal Tadek; kuźnia; łup: najemnicy; podziemia 11-30 |
| 306 | Tasak | tasak | żelazo | 10 | 30 | 30 | 12 | 1,5 | 2% | - | 220 | 2 | 105 G | kowal Tadek; podziemia 31-50 |
| 307 | Żelazna szabla | szabla | żelazo | 12 | 25 | 22 | 9 | 1,6 | 9% | - | 200 | 2 | 125 G | kwatermistrz Kłos; łup: najemnicy |
| 308 | Stalowy miecz | miecz | stal | 16 | 31 | 26 | 10 | 1,55 | 6% | - | 320 | 2 | 240 G | kantor; kuźnia (stal); podziemia 51-75 |
| 309 | Stalowy długi miecz | długi miecz | stal | 19 | 36 | 30 | 13 | 1,75 | 6% | - | 320 | 3 | 290 G | kantor |
| 310 | Prastary miecz | miecz | kruszec Pierwszych | 20 | 33 | 27 | 10 | 1,55 | 7% | - | 360 | 2 | (330) | podziemia 51-75 |
| 311 | Miecz zakonny | miecz | stal zakonna | 24 | 36 | 28 | 9 | 1,55 | 8% | - | 420 | 2 | (520) | podziemia 76-99 |
| 312 | Dębowy kostur | kostur | drewno | 1 | 11 | 26 | 11 | 1,75 | - | pancerz +10% | 70 | 2 | (5) | warsztat |
| 313 | Okuta pałka | pałka | drewno okute żelazem | 3 | 15 | 28 | 10 | 1,45 | - | pancerz +20% | 130 | 2 | 15 G | warsztat (pałka + gwoździe); kowal Tadek; łup: bandyci; szmaciarz (używana) |
| 314 | Brązowa maczuga | pałka | brąz | 5 | 18 | 29 | 10 | 1,45 | - | pancerz +20% | 150 | 2 | 35 G | kowal Tadek; obozy bandytów; podziemia 1-10; szmaciarz (używana) |
| 315 | Kiścień | kiścień | żelazo | 11 | 25 | 36 | 12 | 1,45 | 6% | pancerz +20% | 240 | 3 | 95 G | kowal Tadek; podziemia 31-50 |
| 316 | Brązowy buzdygan | buzdygan | brąz | 7 | 21 | 37 | 13 | 1,45 | 2% | pancerz +30% | 170 | 3 | 50 G | kowal Tadek; podziemia 1-10 |
| 317 | Żelazny buzdygan | buzdygan | żelazo | 11 | 25 | 40 | 13 | 1,45 | 2% | pancerz +30% | 260 | 3 | 100 G | kowal Tadek; kuźnia; podziemia 11-30 |
| 318 | Stalowy pernacz | buzdygan | stal | 17 | 29 | 43 | 12 | 1,45 | 3% | pancerz +30% | 380 | 3 | 215 G | kantor; podziemia 51-75 |
| 319 | Buzdygan zakonny | buzdygan | stal zakonna | 24 | 33 | 46 | 11 | 1,45 | 5% | pancerz +30% | 500 | 3 | (470) | podziemia 76-99 |
| 320 | Brązowy topór | topór | brąz | 6 | 26 | 33 | 16 | 1,6 | 3% | szeroki zamach | 140 | 3 | 50 G | kowal Tadek; podziemia 1-10 |
| 321 | Żelazny topór bojowy | topór | żelazo | 10 | 31 | 36 | 16 | 1,6 | 3% | szeroki zamach | 220 | 3 | 105 G | kowal Tadek; kuźnia; podziemia 11-30 |
| 322 | Czekan | czekan | żelazo | 12 | 29 | 34 | 15 | 1,55 | 7% | pancerz +35% | 220 | 3 | 115 G | kowal Tadek; podziemia 31-50 |
| 323 | Stalowy topór bojowy | topór | stal | 16 | 36 | 39 | 15 | 1,6 | 4% | szeroki zamach | 320 | 3 | 230 G | kantor; kuźnia (stal); podziemia 51-75 |
| 324 | Bardysz | bardysz | stal | 19 | 39 | 43 | 18 | 1,95 | 4% | szeroki zamach | 320 | 5 | 300 G | kantor |
| 325 | Topór zakonny | topór | stal zakonna | 25 | 41 | 42 | 14 | 1,6 | 6% | szeroki zamach | 420 | 3 | (495) | podziemia 76-99 |
| 326 | Kamienny młot | młot | kamień | 2 | 26 | 48 | 21 | 1,5 | - | szeroki zamach, pancerz +40% | 70 | 5 | (20) | warsztat |
| 327 | Żelazny młot bojowy | młot | żelazo | 11 | 37 | 56 | 21 | 1,5 | - | szeroki zamach, pancerz +40% | 260 | 5 | 115 G | kowal Tadek; kuźnia; podziemia 31-50 |
| 328 | Stalowy młot bojowy | młot | stal | 17 | 43 | 60 | 20 | 1,5 | 1% | szeroki zamach, pancerz +40% | 380 | 5 | 250 G | kantor; kuźnia (stal); podziemia 51-75 |
| 329 | Młot zakonny | młot | stal zakonna | 26 | 49 | 65 | 19 | 1,5 | 3% | szeroki zamach, pancerz +40% | 500 | 5 | (545) | podziemia 76-99 |
| 330 | Brązowa włócznia | włócznia | brąz | 5 | 24 | 18 | 12 | 2,3 | 3% | - | 110 | 3 | 45 G | kowal Tadek; obozy bandytów; podziemia 1-10; szmaciarz (używana) |
| 331 | Żelazna włócznia | włócznia | żelazo | 9 | 28 | 20 | 12 | 2,3 | 3% | - | 170 | 3 | 90 G | kowal Tadek; kwatermistrz Kłos; kuźnia; podziemia 11-30 |
| 332 | Rohatyna | rohatyna | żelazo | 11 | 29 | 26 | 13 | 2,2 | 3% | zwierzęta +30% | 180 | 3 | 100 G | kowal Tadek; podziemia 31-50 |
| 333 | Stalowa włócznia | włócznia | stal | 16 | 32 | 22 | 11 | 2,3 | 4% | - | 240 | 3 | 190 G | kantor |
| 334 | Włócznia zakonna | włócznia | stal zakonna | 24 | 37 | 23 | 10 | 2,3 | 6% | - | 320 | 3 | (415) | podziemia 76-99 |
| 407 | Stalowa siekiera | siekiera | stal | 15 | 30 | 32 | 15 | 1,6 | 1% | szeroki zamach | 320 | 2 | 180 G | kuźnia (stal); kantor |
| 408 | Stalowy kilof | kilof | stal | 15 | 35 | 45 | 21 | 1,45 | 1% | szeroki zamach | 260 | 2 | 200 G | kuźnia (stal); kantor |

## Łuki i proce (5)

Strzały i kamienie jak dziś; w ręku jest najlepszy posiadany łuk (gdy są strzały), inaczej najlepsza proca. celowanie = klatki, w których kółko się zwęża (mniej = szybciej), przerwa = klatki między strzałami, sił = wytrzymałość za strzał.

| id | nazwa | rodzaj | wykonanie | poz. | strzał | zasięg | celowanie | przerwa | sił | trw. | waga | cena | skąd |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 125 | Proca (jest) | proca | lina | 1 | 14 | 6 | 70 | 24 | 2 | 60 | 1 | - | warsztat |
| 126 | Łuk (jest) | łuk | leszczyna | 1 | 30 | 9 | 55 | 30 | 3 | 80 | 2 | - | warsztat |
| 335 | Łuk długi | łuk | cis | 8 | 38 | 10,5 | 64 | 34 | 4 | 110 | 2 | 120 G | kwatermistrz Kłos; łup: łucznicy |
| 336 | Łuk refleksyjny | łuk | róg i ścięgna | 14 | 44 | 10 | 46 | 28 | 3 | 140 | 1 | 280 G | kantor |
| 337 | Łuk zakonny | łuk | stal zakonna | 24 | 48 | 11 | 50 | 28 | 3 | 180 | 2 | (480) | podziemia 76-99 |
| 338 | Proca skórzana | proca | skóra | 3 | 18 | 6,5 | 64 | 22 | 2 | 80 | 1 | 15 G | warsztat; garbarz Ignac; łup: łucznicy; szmaciarz (używana) |
| 339 | Proca rzemienna | proca | rzemień | 7 | 23 | 7,5 | 58 | 22 | 2 | 110 | 1 | 40 G | garbarz Ignac |

## Zbroje i części zbroi (35)

obrona = część ciosu, którą zatrzymuje; trw. = ile ciosów przyjmie, zanim się rozpadnie (naprawa przywraca). Dziś: skórzana kurtka 171 (tors, 20%, 60 ciosów) i zielona kurta 266 - zostają bez zmian.

| id | nazwa | miejsce | materiał | poz. | obrona | ciepło | kary / bonusy | trw. | waga | cena | skąd |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 340 | Skórzany kaptur | Głowa | skóra | 2 | 4% | +12% | - | 50 | 1 | 18 G | garbarnia; garbarz Ignac; łup: bandyci; szmaciarz (używany) |
| 341 | Futrzany kaptur | Głowa | skóra | 5 | 5% | +30% | - | 60 | 1 | 45 G | garbarnia (skóra niedźwiedzia); garbarz Ignac |
| 342 | Czepiec pikowany | Głowa | płótno | 3 | 4% | +10% | - | 45 | 1 | 15 G | szwaczka Dorota; szmaciarz (używany) |
| 343 | Kaptur zwiadowcy | Głowa | płótno | 8 | 3% | +10% | zwierzęta słyszą cię o 10% słabiej | 60 | 1 | 70 G | kwatermistrz Kłos (przychylność 30) |
| 344 | Brązowy kapalin | Głowa | brąz | 6 | 6% | - | oddech -1% | 90 | 2 | 45 G | kowal Tadek; obozy bandytów; podziemia 1-10 |
| 345 | Czepiec kolczy | Głowa | żelazo | 9 | 6% | +5% | głośniej 3% | 110 | 2 | 60 G | kwatermistrz Kłos; kuźnia; łup: najemnicy, puste zbroje; podziemia 11-30 |
| 346 | Hełm z nosalem | Głowa | żelazo | 12 | 8% | - | oddech -2% | 130 | 3 | 85 G | kowal Tadek; kwatermistrz Kłos; kuźnia; łup: najemnicy; zbrojownia Lorda (W7); podziemia 11-30 |
| 347 | Stalowy szyszak | Głowa | stal | 17 | 8% | - | oddech -2% | 180 | 3 | 170 G | kantor; kuźnia (stal); podziemia 51-75 |
| 348 | Hełm zakonny | Głowa | stal zakonna | 24 | 9% | - | oddech -1% | 260 | 3 | (420) | podziemia 76-99 |
| 349 | Przeszywanica | Tors | płótno | 3 | 16% | +30% | - | 50 | 2 | 35 G | szwaczka Dorota; kwatermistrz Kłos; obozy bandytów; podziemia 1-10; szmaciarz (używana) |
| 350 | Skórznia | Tors | skóra | 5 | 23% | +10% | - | 70 | 3 | 65 G | garbarnia; garbarz Ignac |
| 351 | Ćwiekowana skórznia | Tors | skóra | 8 | 25% | - | głośniej 5% | 90 | 4 | 95 G | garbarnia (+ gwoździe); kowal Tadek |
| 352 | Brązowa łuska | Tors | brąz | 7 | 26% | - | oddech -6%, głośniej 15%, chód -3% | 110 | 7 | 120 G | kowal Tadek; podziemia 1-10 |
| 353 | Kolczuga | Tors | żelazo | 11 | 28% | - | oddech -5%, głośniej 12% | 140 | 6 | 170 G | kwatermistrz Kłos; kuźnia; łup: najemnicy; podziemia 11-30 |
| 354 | Żelazna łuska | Tors | żelazo | 13 | 30% | - | oddech -8%, głośniej 20%, chód -3% | 160 | 8 | 200 G | kowal Tadek; podziemia 31-50 |
| 355 | Brygantyna | Tors | żelazo | 15 | 30% | - | oddech -4%, głośniej 6% | 170 | 6 | 260 G | kwatermistrz Kłos (przychylność 50); kantor |
| 356 | Jedwabna przeszywanica | Tors | pajęczy jedwab | 16 | 27% | +35% | zwierzęta słyszą cię o 5% słabiej | 180 | 1 | (380) | Matka pająków (piętro 40); podziemia 31-50 (rzadko) |
| 357 | Stalowa kolczuga | Tors | stal | 17 | 31% | - | oddech -4%, głośniej 10% | 220 | 6 | 340 G | kantor; kuźnia (stal); Topielec z głębiny (piętro 50); podziemia 51-75 |
| 358 | Stalowy napierśnik | Tors | stal | 19 | 33% | - | oddech -7%, głośniej 15%, chód -3% | 260 | 7 | 420 G | kantor; kuźnia (stal) |
| 359 | Pancerz zakonny | Tors | stal zakonna | 25 | 35% | - | oddech -4%, głośniej 8% | 320 | 6 | (700) | podziemia 76-99 |
| 360 | Skórzane karwasze | Ręce | skóra | 2 | 2% | - | - | 50 | 1 | 15 G | garbarnia; garbarz Ignac; łup: łucznicy; szmaciarz (używane) |
| 361 | Brązowe karwasze | Ręce | brąz | 6 | 3% | - | - | 80 | 1 | 30 G | kowal Tadek; podziemia 1-10 |
| 362 | Żelazne karwasze | Ręce | żelazo | 10 | 4% | - | - | 120 | 2 | 50 G | kowal Tadek; kuźnia; łup: puste zbroje; podziemia 11-30 |
| 363 | Rękawice kolcze | Ręce | żelazo | 12 | 4% | - | głośniej 2%; trafienie krytyczne +2% | 130 | 1 | 60 G | kwatermistrz Kłos; podziemia 31-50 |
| 364 | Stalowe rękawice płytowe | Ręce | stal | 18 | 5% | - | oddech -1% | 200 | 2 | 130 G | kantor; kuźnia (stal); podziemia 51-75 |
| 365 | Karwasze zakonne | Ręce | stal zakonna | 24 | 5% | - | - | 260 | 1 | (260) | podziemia 76-99 |
| 366 | Skórzane nagolenniki | Nogi | skóra | 3 | 3% | +5% | - | 60 | 1 | 22 G | garbarnia; garbarz Ignac; szmaciarz (używane) |
| 367 | Brązowe nagolenniki | Nogi | brąz | 7 | 4% | - | chód -1% | 90 | 2 | 40 G | kowal Tadek; podziemia 1-10 |
| 368 | Żelazne nagolenniki | Nogi | żelazo | 11 | 5% | - | głośniej 3%, chód -1% | 130 | 3 | 65 G | kowal Tadek; kuźnia; podziemia 11-30 |
| 369 | Stalowe nagolenniki | Nogi | stal | 18 | 6% | - | głośniej 4%, chód -2% | 200 | 3 | 150 G | kantor; kuźnia (stal); podziemia 51-75 |
| 370 | Nagolenniki zakonne | Nogi | stal zakonna | 24 | 6% | - | chód -1% | 260 | 2 | (300) | podziemia 76-99 |
| 371 | Wysokie buty | Stopy | skóra | 4 | 2% | +10% | chód +8% | 70 | 2 | 40 G | garbarnia; garbarz Ignac |
| 372 | Buty okute | Stopy | żelazo | 9 | 3% | - | głośniej 8%, chód +6% | 110 | 2 | 55 G | kowal Tadek; kuźnia |
| 373 | Stalowe trzewiki | Stopy | stal | 17 | 4% | - | głośniej 10%, chód +4% | 180 | 3 | 120 G | kantor; podziemia 51-75 |
| 374 | Buty zakonne | Stopy | stal zakonna | 24 | 4% | - | chód +10% | 240 | 2 | (260) | podziemia 76-99 |

## Tarcze (6)

| id | nazwa | materiał | poz. | blok | oddech bloku | parowanie | osłona | kary | trw. | waga | cena | skąd |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 155 | Drewniana tarcza (jest) | drewno | 1 | 75% | 0,7 | - | - | - | 40 | 3 | - | warsztat |
| 375 | Okuta tarcza | drewno okute żelazem | 4 | 78% | 0,65 | - | - | - | 70 | 4 | 35 G | kuźnia (drewniana tarcza + żelazo); kowal Tadek; szmaciarz (używana) |
| 376 | Okrągła tarcza z umbem | brąz | 7 | 78% | 0,55 | +25% | - | - | 90 | 3 | 55 G | kowal Tadek; podziemia 1-10 |
| 377 | Puklerz | żelazo | 9 | 68% | 0,5 | +50% | - | - | 110 | 1 | 45 G | kowal Tadek; kwatermistrz Kłos; podziemia 11-30 |
| 378 | Migdałowa tarcza | żelazo | 12 | 82% | 0,65 | - | szersza | oddech -2% | 150 | 5 | 110 G | kwatermistrz Kłos; kuźnia; łup: najemnicy; podziemia 11-30 |
| 379 | Żelazna tarcza | stal | 16 | 86% | 0,55 | - | - | oddech -5%, chód -2% | 200 | 7 | 190 G | kuźnia (stal); kantor; podziemia 51-75 |
| 380 | Tarcza zakonna | stal zakonna | 24 | 87% | 0,45 | +25% | szersza | - | 280 | 4 | (380) | podziemia 76-99 |

## Dodatki (15)

| id | nazwa | rodzaj | poz. | co daje | cena | skąd |
|---|---|---|---|---|---|---|
| 381 | Amulet z kłem wilka | amulet | 3 | obrażenia wręcz +5% | 40 G | szmaciarz Józek |
| 382 | Bursztynowy amulet | amulet | 4 | marzniesz o 25% mniej | 45 G | szmaciarz Józek |
| 383 | Miedziany pierścień | pierscien | 1 | sprzedajesz o 6% drożej | 25 G | szmaciarz Józek; łup: bandyci |
| 384 | Pierścień z hematytem | pierscien | 8 | życie +15 | 130 G | kantor; Królowa szczurów (piętro 30) |
| 385 | Kciukowy pierścień łucznika | pierscien | 6 | celujesz o 12% szybciej, strzał +6% | 70 G | kwatermistrz Kłos; łup: łucznicy |
| 386 | Kruczy talizman | talizman | 6 | zwierzęta słyszą cię o 15% słabiej | 90 G | kantor |
| 387 | Amulet z pazurem niedźwiedzia | amulet | 5 | trudniej cię przewrócić (+25%) | (60) | warsztat (pazur niedźwiedzia) |
| 388 | Pierścień z akwamarynem | pierscien | 12 | oddech wraca o 20% szybciej | 170 G | kantor; podziemia 51-75 |
| 389 | Talizman zakonu | talizman | 10 | opór przed „prawdą” i strachem +12% | (120) | podziemia 11-50; łup: upiory, cienie |
| 390 | Paciorki strażnika | talizman | 18 | strach i zamęt trwają o 25% krócej, rany goją się o 25% szybciej | (260) | Upiór pytającego (piętro 80); podziemia 76-99 |
| 391 | Pierścień najemnika | pierscien | 10 | trafienie krytyczne +4% | 110 G | kwatermistrz Kłos (przychylność 50); łup: najemnicy |
| 392 | Muszla z przystani | amulet | 2 | pragnienie rośnie o 12% wolniej | 20 G | szmaciarz Józek |
| 393 | Krwawnikowy pierścień | pierscien | 9 | opatrunek leczy o 25% więcej, rany goją się o 20% szybciej | 95 G | kantor; podziemia 31-50 |
| 394 | Grosz strażnicy | talizman | 4 | szczęście +15% (stare monety i sprzęt w ruinach) | (60) | podziemia 1-30 (szczątki, skrzynie) |
| 395 | Amulet z kłem odyńca | amulet | 4 | zwierzęta dostają +10% | (45) | warsztat (kieł odyńca) |

## Unikaty (11)

Każdy raz w grze, z historią z fabuły (STORY.md, QUESTY.md). Nie do kupienia ani sprzedania.

| id | nazwa | co to | poz. | liczby | skąd | historia |
|---|---|---|---|---|---|---|
| 396 | Miecz Bogumiła | miecz | 12 | obr. 31, zachw. 30, oddech 10, zasięg 1,6, kryt 8%; w ręku: opór przed „prawdą” i strachem +10% | W4 Krew kasztelana: Borgar po rozmowie o rodzie | Miecz ostatniego kasztelana, Bogumiła z rodu Kowali. Na głowni wyryte: „Nie pytam”. W ręku łatwiej oprzeć się prawdzie. |
| 397 | Rękawice Żelaznej Pięści | zbroja (ręce) | 12 | obrona 5%, pięści +8 obrażeń, +14 zachwiania | W8 Żelazna Pięść: Grum (sojusz albo pojedynek) | Rękawice Gruma z żelaznymi płytkami na kostkach. Pięść w nich bije jak buzdygan. |
| 398 | Kostur przeora | kostur | 9 | obr. 24, zachw. 52, oddech 12, zasięg 1,8, kryt 3%, pancerz +30%; w ręku: opór przed „prawdą” i strachem +8% | Przeor w zbroi (piętro 20) | Okuty kostur przeora z krukiem na głowicy. Ciężki jak buzdygan, długi jak włócznia - i przypomina o jednym pytaniu. |
| 399 | Długi miecz bez herbu | długi miecz | 21 | obr. 42, zachw. 38, oddech 12, zasięg 1,8, kryt 7% | Zbroja bez herbu (piętro 70) | Miecz pustego pancerza starszego niż zakon. Ktoś wydrapał z niego herb - zostało ostrze, które pamięta wojnę, której nikt nie spisał. |
| 400 | Hełm strażnika bramy | zbroja (głowa) | 6 | obrona 8%, oddech -2%, opór przed „prawdą” i strachem +10% | Strażnik dziesiątej bramy (piętro 10) | Hełm strażnika dziesiątej bramy. W szczelinie przyłbicy jeszcze tli się żar. Kto go nosi, łatwiej znosi to, co szepczą ruiny. |
| 401 | Tarcza Skrzydlatej Straży | tarcza | 14 | blok 85%, oddech bloku 0,45, parowanie +30%, szersza osłona | W13 Skrzydlata Straż: koniec wątku | Lekka tarcza jeźdźców orłów z białym skrzydłem na polu. Szeroka garda, długie okno parowania. |
| 402 | Szabla spod Brzozowej Woli | szabla | 15 | obr. 33, zachw. 26, oddech 9, zasięg 1,6, kryt 12% | Garnizon: przychylność 80 (rotmistrz Bełza) | Szabla chorągwi brzozowskiej, którą rotmistrz Bełza przechował po bitwie. Twoja wieś, twoja szabla - lekka, szybka i bardzo ostra. |
| 403 | Krucze pióro | sztylet | 8 | obr. 19, zachw. 12, oddech 6, zasięg 1,2, kryt 15%, z ukrycia x1,6; w ręku: zwierzęta słyszą cię o 10% słabiej | D24 Oswojony kruk: dziadek Stach | Sztylet kruczarzy, posłańców zakonu, z rękojeścią jak pióro. Cichy w ręku, zabójczy z ukrycia. |
| 404 | Oko Pierwszych | talizman | 19 | widzisz ukryte upiory jako mgiełkę, opór przed „prawdą” i strachem +15%, trafienie krytyczne +3% | Kamienny Odźwierny (piętro 60) | Kryształ z czoła Odźwiernego, z tego samego kamienia co soczewka latarni. Pokazuje to, co się ukrywa. |
| 405 | Kolczuga Ostatniej Straży | zbroja (tors) | 25 | obrona 37%, oddech -3%, opór przed „prawdą” i strachem +10% | Ostatni Strażnik (piętro 90) | Kolczuga ostatniego strażnika, czarna i cicha jak noc. Nie dzwoni, nie ciąży - i trzyma prawdę z dala od głowy. |
| 406 | Łuk Białej Źrenicy | łuk | 12 | strzał 46, zasięg 10,5, celowanie 48 | W12 Rozbitek: kajuta kapitana „Białej Źrenicy” | Łuk kapitana okrętu Czarnych Oczu, z białym okiem na majdanie. Strzela daleko i mocno. |

## Skąd się biorą

### Sklepy (w rozmowach, okno sklepu jak u ubrań: kupno, sprzedaż, naprawa)

- **Kowal Tadek Młot** (miasto, kuźnia, 6-17): brąz i żelazo - Brązowy sztylet, Żelazny sztylet, Brązowy miecz, Żelazny miecz, Tasak, Okuta pałka, Brązowa maczuga, Kiścień, Brązowy buzdygan, Żelazny buzdygan, Brązowy topór, Żelazny topór bojowy, Czekan, Żelazny młot bojowy, Brązowa włócznia, Żelazna włócznia, Rohatyna, Brązowy kapalin, Hełm z nosalem, Ćwiekowana skórznia, Brązowa łuska, Żelazna łuska, Brązowe karwasze, Żelazne karwasze, Brązowe nagolenniki, Żelazne nagolenniki, Buty okute, Okuta tarcza, Okrągła tarcza z umbem, Puklerz. Pokazuje to, co ma poziom najwyżej o 6 wyższy od bohatera. Skupuje metal (40%), naprawia metal (stal zakonną i kruszec Pierwszych za podwójną cenę). Rabat stali z Ludzie.js zostaje (pod „Porozmawiaj”).
- **Kwatermistrz Kłos** (garnizon, 7-20, od przychylności 15): wojskowe - Żelazna szabla, Żelazna włócznia, Łuk długi, Kaptur zwiadowcy, Czepiec kolczy, Hełm z nosalem, Przeszywanica, Kolczuga, Brygantyna, Rękawice kolcze, Puklerz, Migdałowa tarcza, Kciukowy pierścień łucznika, Pierścień najemnika. Kaptur zwiadowcy od przychylności 30, brygantyna i pierścień najemnika od 50. Skupuje broń i zbroje (45%). Gdy Kłos popłynie (D27, wydany rotmistrzowi), jego sklep prowadzi **Kapral Jur**, zastępca kwatermistrza - żołnierz garnizonu przy beczkach i spichlerzu (ten sam wygląd co dotąd): ten sam towar i te same progi przychylności.
- **Kantor** (Baltazar 8-18, po W5 Ludmiła 9-15): stal i towar z kontynentu - Stalowy sztylet, Stalowy miecz, Stalowy długi miecz, Stalowy pernacz, Stalowy topór bojowy, Bardysz, Stalowy młot bojowy, Stalowa włócznia, Łuk refleksyjny, Stalowy szyszak, Brygantyna, Stalowa kolczuga, Stalowy napierśnik, Stalowe rękawice płytowe, Stalowe nagolenniki, Stalowe trzewiki, Żelazna tarcza, Pierścień z hematytem, Kruczy talizman, Pierścień z akwamarynem, Krwawnikowy pierścień, Stalowa siekiera, Stalowy kilof. Ceny kantoru jak jego inne towary (wróg x2, „w garści” x0,5). Skupuje wszystko (45%).
- **Garbarz Ignac** (dopisane do jego menu ubrań): Skórzany kaptur, Futrzany kaptur, Skórznia, Skórzane karwasze, Skórzane nagolenniki, Wysokie buty, Proca skórzana, Proca rzemienna. Skupuje i naprawia skórę.
- **Szwaczka Dorota** (dopisane do jej menu): Czepiec pikowany, Przeszywanica. Naprawia płótno i jedwab.
- **Szmaciarz Józek Łata** (Podgrodzie, dopisane do jego menu): co dzień 3 używane rzeczy za pół ceny, zużyte w połowie, z: Brązowy sztylet, Okuta pałka, Brązowa maczuga, Brązowa włócznia, Proca skórzana, Skórzany kaptur, Czepiec pikowany, Przeszywanica, Skórzane karwasze, Skórzane nagolenniki, Okuta tarcza; nowe błyskotki: Amulet z kłem wilka, Bursztynowy amulet, Miedziany pierścień, Muszla z przystani. Skupuje wszystko za 20%.

### Kucie i szycie (przepis widać od poziomu rzeczy - 4)

**Kuźnia** (26):

| przedmiot | materiały | godziny | wytrzymałość |
|---|---|---|---|
| Żelazny sztylet | 1x żelazo, 1x węgiel, 1x drewno | 1 | 4 |
| Żelazny miecz | 3x żelazo, 2x węgiel, 1x skóra wyprawiona | 2 | 6 |
| Żelazny buzdygan | 3x żelazo, 2x węgiel, 1x drewno | 2 | 6 |
| Żelazny topór bojowy | 3x żelazo, 2x węgiel, 1x deski | 2 | 6 |
| Żelazny młot bojowy | 5x żelazo, 3x węgiel, 1x deski | 3 | 8 |
| Żelazna włócznia | 2x żelazo, 1x węgiel, 2x drewno | 2 | 5 |
| Czepiec kolczy | 3x żelazo, 2x węgiel, 1x skóra wyprawiona | 2 | 6 |
| Hełm z nosalem | 3x żelazo, 2x węgiel | 2 | 6 |
| Kolczuga | 6x żelazo, 4x węgiel, 1x skóra wyprawiona | 4 | 10 |
| Żelazne karwasze | 2x żelazo, 1x węgiel, 1x skóra wyprawiona | 1 | 4 |
| Żelazne nagolenniki | 2x żelazo, 1x węgiel, 1x skóra wyprawiona | 1 | 4 |
| Buty okute | 1x żelazo, 1x węgiel, 2x skóra wyprawiona | 1 | 4 |
| Okuta tarcza | 1x drewniana tarcza, 2x żelazo, 4x gwoździe | 1 | 4 |
| Migdałowa tarcza | 3x żelazo, 2x węgiel, 2x deski, 1x skóra wyprawiona | 2 | 6 |
| Stalowy sztylet | 1x stal, 1x węgiel, 1x drewno | 1 | 5 |
| Stalowy miecz | 3x stal, 2x węgiel, 1x skóra wyprawiona | 3 | 7 |
| Stalowy topór bojowy | 3x stal, 2x węgiel, 1x deski | 3 | 7 |
| Stalowy młot bojowy | 4x stal, 2x żelazo, 3x węgiel, 1x deski | 3 | 9 |
| Stalowy szyszak | 3x stal, 2x węgiel | 2 | 7 |
| Stalowa kolczuga | 6x stal, 4x węgiel, 1x skóra wyprawiona | 4 | 11 |
| Stalowy napierśnik | 6x stal, 2x żelazo, 4x węgiel, 2x skóra wyprawiona | 4 | 12 |
| Stalowe rękawice płytowe | 2x stal, 1x węgiel, 1x skóra wyprawiona | 2 | 5 |
| Stalowe nagolenniki | 2x stal, 1x węgiel, 1x skóra wyprawiona | 2 | 5 |
| Żelazna tarcza | 4x żelazo, 2x stal, 3x węgiel, 1x skóra wyprawiona | 3 | 9 |
| Stalowa siekiera | 3x stal, 1x węgiel, 1x deski | 2 | 6 |
| Stalowy kilof | 3x stal, 1x węgiel, 1x deski | 2 | 6 |

**Garbarnia** (7):

| przedmiot | materiały | godziny | wytrzymałość |
|---|---|---|---|
| Skórzany kaptur | 1x skóra wyprawiona, 1x ścięgna | 1 | 3 |
| Futrzany kaptur | 1x skóra niedźwiedzia, 1x ścięgna | 2 | 3 |
| Skórznia | 4x skóra wyprawiona, 2x ścięgna, 1x lina | 3 | 5 |
| Ćwiekowana skórznia | 4x skóra wyprawiona, 2x ścięgna, 8x gwoździe | 3 | 6 |
| Skórzane karwasze | 1x skóra wyprawiona, 1x ścięgna | 1 | 2 |
| Skórzane nagolenniki | 2x skóra wyprawiona, 1x ścięgna | 1 | 3 |
| Wysokie buty | 2x skóra wyprawiona, 1x ścięgna, 1x lina | 2 | 4 |

**Warsztat** (6):

| przedmiot | materiały | godziny | wytrzymałość |
|---|---|---|---|
| Dębowy kostur | 2x drewno | 1 | 2 |
| Kamienny młot | 3x kamień, 1x drewno, 1x lina | 1 | 3 |
| Okuta pałka | 1x pałka, 4x gwoździe | 1 | 2 |
| Proca skórzana | 1x skóra wyprawiona, 2x lina | 1 | 2 |
| Amulet z pazurem niedźwiedzia | 1x pazur niedźwiedzia, 1x lina | 1 | 1 |
| Amulet z kłem odyńca | 1x kieł odyńca, 1x lina | 1 | 1 |

Brąz nie jest do kucia: na wyspie nie ma miedzi ani cyny - tylko sklep (Tadek ma stary zapas) i łupy. Stal z huty (żelazo + węgiel, szczypce), jak dziś.

### Stalowe narzędzia (2026-10-23)

Stalowa siekiera (407) i stalowy kilof (408) - kuźnia (3 stal, węgiel, deski) albo kantor (180 / 200 G). Jak żelazne zastępują kamienne, tylko lepiej: przy drzewach, krzakach, skałach i rudzie **połowa uderzeń** liczby użytkownika (żelazne: 0,65) i o jedną trzecią mniej sił za uderzenie (żelazne: o ćwierć). Przykłady: sosna Pine_A 20 uderzeń - kamienną 20, żelazną 13, stalową 10; Pine_C 12 - 12 / 8 / 6; zwykła skała 16 - 16 / 10 / 8; ruda (Ore) 26 - 26 / 17 / 13; głaz 20 - 20 / 13 / 10; gęstwina 5 - 5 / 3 / 3. Siła i umiejętności Zbieractwa tną dalej jak dotąd. W walce: stalowa siekiera jak topór ze stali (obr. 30, oddech 15, szeroki zamach), kilof jak młot (obr. 35, oddech 21). Zużycie: 320 / 260 uderzeń (żelazne 220 / 180), naprawa w warsztacie stalą i deską albo u kowala. Liczą się też tam, gdzie gra pyta o siekierę albo kilof (karczowanie zagrody, rynny cysterny).

### Łupy

- **Bandyta**: Skórzany kaptur 4%, Okuta pałka 4%, Brązowy sztylet 3%, Miedziany pierścień 3%. **Nożownik**: Brązowy sztylet 7%, Żelazny sztylet 3%, Skórzane karwasze 4%. **Łucznik**: Skórzane karwasze 6%, Proca skórzana 5%, Łuk długi 3%, Kciukowy pierścień łucznika 2%.
- **Najemnik**: Czepiec kolczy 10%, Hełm z nosalem 6%, Kolczuga 4%, Żelazny miecz 6%, Żelazna szabla 3%, Migdałowa tarcza 5%, Pierścień najemnika 3%. **Worek w obozie**: Brązowy kapalin 6%, Przeszywanica 5%, Brązowa włócznia 4%, Brązowa maczuga 3%.
- **Stwory**: pusta zbroja - Czepiec kolczy 5%, Żelazne karwasze 4%, Żelazny miecz 3%; topielec - Brązowy sztylet 4%; upiór, cień - Talizman zakonu 3%.
- **Pojemniki w podziemiach** (dodatkowy rzut przy przeszukaniu, szansa razy szczęście): skrzynia 14%, relikwiarz 30%, kosci 8%, sakwa 7%, skrzynka 4%; co - według pasma pięter:
  - pasmo 1: Brązowy sztylet, Brązowy miecz, Brązowa maczuga, Brązowy buzdygan, Brązowy topór, Brązowa włócznia, Skórzany kaptur, Czepiec pikowany, Brązowy kapalin, Przeszywanica, Skórzane karwasze, Brązowe karwasze, Skórzane nagolenniki, Brązowe nagolenniki, Okrągła tarcza z umbem, Brązowa łuska, Grosz strażnicy
  - pasmo 2: Żelazny sztylet, Żelazny miecz, Żelazny buzdygan, Żelazny topór bojowy, Żelazna włócznia, Czepiec kolczy, Hełm z nosalem, Kolczuga, Żelazne karwasze, Żelazne nagolenniki, Puklerz, Migdałowa tarcza, Talizman zakonu, Grosz strażnicy
  - pasmo 3: Tasak, Kiścień, Czekan, Żelazny młot bojowy, Rohatyna, Żelazna łuska, Rękawice kolcze, Jedwabna przeszywanica, Talizman zakonu, Krwawnikowy pierścień
  - pasmo 4: Stalowy miecz, Prastary miecz, Stalowy pernacz, Stalowy topór bojowy, Stalowy młot bojowy, Stalowy szyszak, Stalowa kolczuga, Stalowe rękawice płytowe, Stalowe nagolenniki, Stalowe trzewiki, Żelazna tarcza, Pierścień z akwamarynem
  - pasmo 5: Mizerykordia zakonna, Miecz zakonny, Buzdygan zakonny, Topór zakonny, Młot zakonny, Włócznia zakonna, Łuk zakonny, Hełm zakonny, Pancerz zakonny, Karwasze zakonne, Nagolenniki zakonne, Buty zakonne, Tarcza zakonna, Paciorki strażnika
- **Bossowie** (zawsze, w szczątkach): guardian - Hełm strażnika bramy; boss_20 - Kostur przeora; boss_30 - Pierścień z hematytem; boss_40 - Jedwabna przeszywanica; boss_50 - Stalowa kolczuga; boss_60 - Oko Pierwszych; boss_70 - Długi miecz bez herbu; boss_80 - Paciorki strażnika; boss_90 - Kolczuga Ostatniej Straży.
- **Zbrojownia Lorda** (W7, „powiem wszystko”): dochodzi Hełm z nosalem.

## Klucze wyglądu

Każdy klucz poniżej jest w `js/plugins/Ubior_Data.js` agenta grafiki (WZORY_ZBROI, WZORY_BRONI, WZORY_TARCZ, a `buty_czarne` w WZORY ubioru) - sprawdza to test `bron_dane_test`. Zbroje: `helm_<rodzaj>_<materiał>`, `zbroja_<rodzaj>_<materiał>`, `karwasze_<m>`, `nagolenniki_<m>`, `buty_okute_<m>` (notatka `<Zbroja:miejsce,wzór>`); broń: `bron_<rodzaj>_<materiał>` (notatka `<Bron:rodzaj,materiał>`, unikat - trzecie słowo notatki); tarcze: `<Tarcza:wzór>`. Wysokie buty noszą wygląd czarnych skórzanych z ubioru (`buty_czarne`). Pełna lista kluczy grafiki: `docs/ekwipunek/PLAN_BRON_ZBROJE.md`, „Klucze wyglądu”.

| id | nazwa | notatka | klucz wyglądu |
|---|---|---|---|
| 60 | Kamienna siekiera | `<Bron:siekiera,kamien>` | `bron_siekiera_kamien` |
| 63 | Kamienny kilof | `<Bron:kilof,kamien>` | `bron_kilof_kamien` |
| 115 | Żelazna siekiera | `<Bron:siekiera,zelazo>` | `bron_siekiera_zelazo` |
| 116 | Żelazny kilof | `<Bron:kilof,zelazo>` | `bron_kilof_zelazo` |
| 125 | Proca | `<Bron:proca,prosta>` | `bron_proca_prosta` |
| 126 | Łuk | `<Bron:luk,krotki>` | `bron_luk_krotki` |
| 154 | Oszczep | `<Bron:wlocznia,kamien>` | `bron_wlocznia_kamien` |
| 155 | Drewniana tarcza | `<Tarcza:tarcza_drewniana>` | `tarcza_drewniana` |
| 156 | Pałka | `<Bron:palka,drewno>` | `bron_palka_drewno` |
| 300 | Brązowy sztylet | `<Bron:sztylet,braz>` | `bron_sztylet_braz` |
| 301 | Żelazny sztylet | `<Bron:sztylet,zelazo>` | `bron_sztylet_zelazo` |
| 302 | Stalowy sztylet | `<Bron:sztylet,stal>` | `bron_sztylet_stal` |
| 303 | Mizerykordia zakonna | `<Bron:sztylet,zakon>` | `bron_sztylet_zakon` |
| 304 | Brązowy miecz | `<Bron:miecz,braz>` | `bron_miecz_braz` |
| 305 | Żelazny miecz | `<Bron:miecz,zelazo>` | `bron_miecz_zelazo` |
| 306 | Tasak | `<Bron:tasak,zelazo>` | `bron_tasak_zelazo` |
| 307 | Żelazna szabla | `<Bron:szabla,zelazo>` | `bron_szabla_zelazo` |
| 308 | Stalowy miecz | `<Bron:miecz,stal>` | `bron_miecz_stal` |
| 309 | Stalowy długi miecz | `<Bron:dlugi_miecz,stal>` | `bron_dlugi_miecz_stal` |
| 310 | Prastary miecz | `<Bron:miecz,pierwszych>` | `bron_miecz_pierwszych` |
| 311 | Miecz zakonny | `<Bron:miecz,zakon>` | `bron_miecz_zakon` |
| 312 | Dębowy kostur | `<Bron:kostur,drewno>` | `bron_kostur_drewno` |
| 313 | Okuta pałka | `<Bron:palka,okute>` | `bron_palka_okute` |
| 314 | Brązowa maczuga | `<Bron:palka,braz>` | `bron_palka_braz` |
| 315 | Kiścień | `<Bron:kiscien,zelazo>` | `bron_kiscien_zelazo` |
| 316 | Brązowy buzdygan | `<Bron:buzdygan,braz>` | `bron_buzdygan_braz` |
| 317 | Żelazny buzdygan | `<Bron:buzdygan,zelazo>` | `bron_buzdygan_zelazo` |
| 318 | Stalowy pernacz | `<Bron:buzdygan,stal>` | `bron_buzdygan_stal` |
| 319 | Buzdygan zakonny | `<Bron:buzdygan,zakon>` | `bron_buzdygan_zakon` |
| 320 | Brązowy topór | `<Bron:topor,braz>` | `bron_topor_braz` |
| 321 | Żelazny topór bojowy | `<Bron:topor,zelazo>` | `bron_topor_zelazo` |
| 322 | Czekan | `<Bron:czekan,zelazo>` | `bron_czekan_zelazo` |
| 323 | Stalowy topór bojowy | `<Bron:topor,stal>` | `bron_topor_stal` |
| 324 | Bardysz | `<Bron:bardysz,stal>` | `bron_bardysz_stal` |
| 325 | Topór zakonny | `<Bron:topor,zakon>` | `bron_topor_zakon` |
| 326 | Kamienny młot | `<Bron:mlot,kamien>` | `bron_mlot_kamien` |
| 327 | Żelazny młot bojowy | `<Bron:mlot,zelazo>` | `bron_mlot_zelazo` |
| 328 | Stalowy młot bojowy | `<Bron:mlot,stal>` | `bron_mlot_stal` |
| 329 | Młot zakonny | `<Bron:mlot,zakon>` | `bron_mlot_zakon` |
| 330 | Brązowa włócznia | `<Bron:wlocznia,braz>` | `bron_wlocznia_braz` |
| 331 | Żelazna włócznia | `<Bron:wlocznia,zelazo>` | `bron_wlocznia_zelazo` |
| 332 | Rohatyna | `<Bron:rohatyna,zelazo>` | `bron_rohatyna_zelazo` |
| 333 | Stalowa włócznia | `<Bron:wlocznia,stal>` | `bron_wlocznia_stal` |
| 334 | Włócznia zakonna | `<Bron:wlocznia,zakon>` | `bron_wlocznia_zakon` |
| 335 | Łuk długi | `<Bron:luk,dlugi>` | `bron_luk_dlugi` |
| 336 | Łuk refleksyjny | `<Bron:luk,refleksyjny>` | `bron_luk_refleksyjny` |
| 337 | Łuk zakonny | `<Bron:luk,zakon>` | `bron_luk_zakon` |
| 338 | Proca skórzana | `<Bron:proca,skorzana>` | `bron_proca_skorzana` |
| 339 | Proca rzemienna | `<Bron:proca,rzemienna>` | `bron_proca_rzemienna` |
| 340 | Skórzany kaptur | `<Zbroja:glowa,helm_kaptur_skora>` | `helm_kaptur_skora` |
| 341 | Futrzany kaptur | `<Zbroja:glowa,helm_kaptur_skora_czarna>` | `helm_kaptur_skora_czarna` |
| 342 | Czepiec pikowany | `<Zbroja:glowa,helm_czepiec_len>` | `helm_czepiec_len` |
| 343 | Kaptur zwiadowcy | `<Zbroja:glowa,helm_kaptur_welna>` | `helm_kaptur_welna` |
| 344 | Brązowy kapalin | `<Zbroja:glowa,helm_kapalin_braz>` | `helm_kapalin_braz` |
| 345 | Czepiec kolczy | `<Zbroja:glowa,helm_czepiec_zelazo>` | `helm_czepiec_zelazo` |
| 346 | Hełm z nosalem | `<Zbroja:glowa,helm_nosal_zelazo>` | `helm_nosal_zelazo` |
| 347 | Stalowy szyszak | `<Zbroja:glowa,helm_nosal_stal>` | `helm_nosal_stal` |
| 348 | Hełm zakonny | `<Zbroja:glowa,helm_zakonny_zakon>` | `helm_zakonny_zakon` |
| 349 | Przeszywanica | `<Zbroja:tors,zbroja_przeszywanica_len>` | `zbroja_przeszywanica_len` |
| 350 | Skórznia | `<Zbroja:tors,zbroja_skorznia_skora>` | `zbroja_skorznia_skora` |
| 351 | Ćwiekowana skórznia | `<Zbroja:tors,zbroja_skorznia_skora_czarna>` | `zbroja_skorznia_skora_czarna` |
| 352 | Brązowa łuska | `<Zbroja:tors,zbroja_luska_braz>` | `zbroja_luska_braz` |
| 353 | Kolczuga | `<Zbroja:tors,zbroja_kolczuga_zelazo>` | `zbroja_kolczuga_zelazo` |
| 354 | Żelazna łuska | `<Zbroja:tors,zbroja_luska_zelazo>` | `zbroja_luska_zelazo` |
| 355 | Brygantyna | `<Zbroja:tors,zbroja_przeszywanica_welna>` | `zbroja_przeszywanica_welna` |
| 356 | Jedwabna przeszywanica | `<Zbroja:tors,zbroja_przeszywanica_jedwab>` | `zbroja_przeszywanica_jedwab` |
| 357 | Stalowa kolczuga | `<Zbroja:tors,zbroja_kolczuga_stal>` | `zbroja_kolczuga_stal` |
| 358 | Stalowy napierśnik | `<Zbroja:tors,zbroja_napiersnik_stal>` | `zbroja_napiersnik_stal` |
| 359 | Pancerz zakonny | `<Zbroja:tors,zbroja_napiersnik_zakon>` | `zbroja_napiersnik_zakon` |
| 360 | Skórzane karwasze | `<Zbroja:rece,karwasze_skora>` | `karwasze_skora` |
| 361 | Brązowe karwasze | `<Zbroja:rece,karwasze_braz>` | `karwasze_braz` |
| 362 | Żelazne karwasze | `<Zbroja:rece,karwasze_zelazo>` | `karwasze_zelazo` |
| 363 | Rękawice kolcze | `<Zbroja:rece,karwasze_zelazo>` | `karwasze_zelazo` |
| 364 | Stalowe rękawice płytowe | `<Zbroja:rece,karwasze_stal>` | `karwasze_stal` |
| 365 | Karwasze zakonne | `<Zbroja:rece,karwasze_zakon>` | `karwasze_zakon` |
| 366 | Skórzane nagolenniki | `<Zbroja:nogi,nagolenniki_skora>` | `nagolenniki_skora` |
| 367 | Brązowe nagolenniki | `<Zbroja:nogi,nagolenniki_braz>` | `nagolenniki_braz` |
| 368 | Żelazne nagolenniki | `<Zbroja:nogi,nagolenniki_zelazo>` | `nagolenniki_zelazo` |
| 369 | Stalowe nagolenniki | `<Zbroja:nogi,nagolenniki_stal>` | `nagolenniki_stal` |
| 370 | Nagolenniki zakonne | `<Zbroja:nogi,nagolenniki_zakon>` | `nagolenniki_zakon` |
| 371 | Wysokie buty | `<Zbroja:stopy,buty_czarne>` | `buty_czarne` |
| 372 | Buty okute | `<Zbroja:stopy,buty_okute_zelazo>` | `buty_okute_zelazo` |
| 373 | Stalowe trzewiki | `<Zbroja:stopy,buty_okute_stal>` | `buty_okute_stal` |
| 374 | Buty zakonne | `<Zbroja:stopy,buty_okute_zakon>` | `buty_okute_zakon` |
| 375 | Okuta tarcza | `<Tarcza:tarcza_okuta>` | `tarcza_okuta` |
| 376 | Okrągła tarcza z umbem | `<Tarcza:tarcza_umbo_braz>` | `tarcza_umbo_braz` |
| 377 | Puklerz | `<Tarcza:tarcza_puklerz>` | `tarcza_puklerz` |
| 378 | Migdałowa tarcza | `<Tarcza:tarcza_migdalowa>` | `tarcza_migdalowa` |
| 379 | Żelazna tarcza | `<Tarcza:tarcza_zelazna>` | `tarcza_zelazna` |
| 380 | Tarcza zakonna | `<Tarcza:tarcza_zakonna>` | `tarcza_zakonna` |
| 396 | Miecz Bogumiła | `<Bron:miecz,zakon,bron_miecz_bogumila>` | `bron_miecz_bogumila` |
| 397 | Rękawice Żelaznej Pięści | `<Zbroja:rece,karwasze_skora_czarna>` | `karwasze_skora_czarna` |
| 398 | Kostur przeora | `<Bron:kostur,zakon,bron_kostur_przeora>` | `bron_kostur_przeora` |
| 399 | Długi miecz bez herbu | `<Bron:dlugi_miecz,pierwszych,bron_dlugi_miecz_bez_herbu>` | `bron_dlugi_miecz_bez_herbu` |
| 400 | Hełm strażnika bramy | `<Zbroja:glowa,helm_zakonny_zelazo>` | `helm_zakonny_zelazo` |
| 401 | Tarcza Skrzydlatej Straży | `<Tarcza:tarcza_skrzydlata_straz>` | `tarcza_skrzydlata_straz` |
| 402 | Szabla spod Brzozowej Woli | `<Bron:szabla,stal,bron_szabla_brzozowa>` | `bron_szabla_brzozowa` |
| 403 | Krucze pióro | `<Bron:sztylet,stal,bron_sztylet_krucze_pioro>` | `bron_sztylet_krucze_pioro` |
| 405 | Kolczuga Ostatniej Straży | `<Zbroja:tors,zbroja_kolczuga_zakon>` | `zbroja_kolczuga_zakon` |
| 406 | Łuk Białej Źrenicy | `<Bron:luk,refleksyjny,bron_luk_bialej_zrenicy>` | `bron_luk_bialej_zrenicy` |
| 407 | Stalowa siekiera | `<Bron:siekiera,stal>` | `bron_siekiera_stal` |
| 408 | Stalowy kilof | `<Bron:kilof,stal>` | `bron_kilof_stal` |

## Decyzje (użytkownik, 2026-10-23)

1. Poziomy przeliczone na tempo doświadczenia (brąz 5-9, żelazo 9-15, stal 15-22, zakonne 22-27) i **kara 3% za brakujący poziom (do 45%)** zamiast blokady - zostaje.
2. Zbroja na miejscach ubrania i **jedno miejsce „Dodatek”** - zostaje.
3. **Stalowa siekiera i kilof jako narzędzia** - dorobione (wyżej).
4. **Zastępca Kłosa** po D27 - Kapral Jur, żołnierz garnizonu przy beczkach (bez nowej grafiki).
5. Próba sił z nowym sprzętem - niżej.
6. „Nocne widzenie” z planu - pominięte (ciemność RoomLighting nie ma na to drzwi); zamiast niego szczęście (Grosz strażnicy).

## Próba sił z nowym sprzętem (2026-10-23)

Bot jak w WALKA.md (75% uników, bez parowania i jedzenia, 2 walki na wiersz; odnowienie = życie z powrotem, gdy spadnie poniżej 30%). Stary sprzęt: żelazna siekiera, drewniana tarcza, kurtka. Nowy: komplet materiału z pasma bohatera - miecz, tarcza i pięć części zbroi (poziom 6-11 brąz, 12-17 żelazo, 18-22 stal, 23+ stal zakonna). Pierwsza próba (stal x1,24, zakonne x1,5, sufit zbroi 65%) była za mocna: Ostatni Strażnik 0,5 odnowienia zamiast 6,5, Upiór pytającego w 18 s; po niej stal x1,15, kruszec Pierwszych x1,24, stal zakonna x1,32, sufit zbroi 58%, napierśnik i pancerz zakonny słabsze (tabela - po zmianie).

| Walka | Wróg (poz.) | Bohater (poz.) | Sprzęt | Stary sprzęt: wygrane, czas, stracone życie, odnowienia | Nowy sprzęt: wygrane, czas, stracone życie, odnowienia |
|---|---|---|---|---|---|
| Strażnik bramy (piętro 10) | 9 | 6 | brąz | 2/2, 57.2 s, 75%, 0.5 | 2/2, 58.3 s, 73%, 0.5 |
| Pusta zbroja (piętro 20) | 13 | 9 | brąz | 2/2, 54.8 s, 58%, 0.5 | 2/2, 56.1 s, 35%, 0 |
| Pająk (piętro 20) | 13 | 9 | brąz | 2/2, 9.1 s, 3%, 0 | 2/2, 6 s, 1%, 0 |
| Przeor w zbroi (boss 20) | 14 | 9 | brąz | 2/2, 102.5 s, 265%, 3.5 | 1/2, 170.3 s, 271%, 3 |
| Królowa szczurów (boss 30) | 19 | 12 | żelazo | 2/2, 63 s, 91%, 0.5 | 2/2, 61.8 s, 58%, 0.5 |
| Topielec (piętro 40) | 23 | 15 | żelazo | 2/2, 23.8 s, 51%, 0 | 2/2, 10.9 s, 14%, 0 |
| Rój nietoperzy (piętro 40) | 22 | 15 | żelazo | 2/2, 21.8 s, 29%, 0 | 2/2, 11 s, 7%, 0 |
| Matka pająków (boss 40) | 24 | 15 | żelazo | 2/2, 116.8 s, 219%, 2.5 | 2/2, 86.3 s, 142%, 1.5 |
| Topielec z głębiny (boss 50) | 29 | 17 | żelazo | 2/2, 151.6 s, 126%, 1 | 2/2, 78.7 s, 102%, 1 |
| Kamiennik (piętro 60) | 33 | 19 | stal | 2/2, 201.2 s, 459%, 6 | 2/2, 88.2 s, 104%, 1 |
| Pusta zbroja (piętro 60) | 33 | 19 | stal | 2/2, 56.9 s, 148%, 1.5 | 2/2, 51.6 s, 54%, 0 |
| Kamienny Odźwierny (boss 60) | 34 | 19 | stal | 1/2, 178.6 s, 498%, 6 | 2/2, 93.5 s, 113%, 1 |
| Zbroja bez herbu (boss 70) | 39 | 21 | stal | 2/2, 113.9 s, 366%, 4 | 2/2, 81.3 s, 140%, 1 |
| Upiór prawdy (piętro 85) | 46 | 24 | zakonne | 2/2, 109 s, 0%, 0 | 2/2, 38.7 s, 0%, 0 |
| Cień (piętro 85) | 46 | 24 | zakonne | 2/2, 23 s, 39%, 0 | 2/2, 9.5 s, 12%, 0 |
| Upiór pytającego (boss 80) | 45 | 23 | zakonne | 2/2, 107.9 s, 170%, 2 | 2/2, 57.2 s, 86%, 1 |
| Ostatni Strażnik (boss 90) | 50 | 25 | zakonne | 1/2, 178.6 s, 519%, 6.5 | 2/2, 59.5 s, 101%, 1 |

- Brąz (poz. 6-9) to bok, nie skok: zbroja lepsza od kurtki, miecz (23) słabszy od żelaznej siekiery (26) - wyniki jak ze starym sprzętem.
- Żelazo (12-17): bossowie 40-50 lżejsi - Matka pająków 2,5 -> 1,5 odnowienia, Topielec z głębiny w połowie czasu.
- Stal i stal zakonna (19-25): najtrudniejsze walki gry spadają z 4-6,5 odnowienia do ok. 1 - pełny komplet z kantoru, kuźni albo z najgłębszych pięter wyraźnie się opłaca, ale bossowie dalej biją (ok. 1 odnowienia, 1-1,5 min). Bossów nie ruszałem.
- Kto ma tylko część kompletu, wypada między starym a nowym wynikiem.
