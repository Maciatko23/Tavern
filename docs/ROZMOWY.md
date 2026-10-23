# Rozmowy z postaciami - spis i jedna obsługa

Stan: 2026-10-23, etap refaktoru „jedna obsługa rozmów z postaciami” (zasady: `docs/ARCHITEKTURA.md`, rozdz. 16; test:
`tests/rozmowy_test.js`).

Przed tym etapem każda wtyczka podpinała się pod rozmowy po swojemu: 17 haków `TownLife.addTalkHook(fn, first)` („first” =
wstaw na początek listy, więc wtyczka wczytana *później* mówiła *wcześniej*), trzy osobne `addMenu(fn)` (Garnizon, Kantor, Ludzie)
i czwarte w Ubior_Sklepy, przez które Bron dopisywał linijkę sklepu, TownQuests owijał `Story.talk`, TavernLife dopisywał wiersze
Borgara przez `T.call("TavernLife", "borgarOptions")`, 8 wtyczek owijało `Game_Event.prototype.start`, a 10 -
`Game_Event.prototype.list`. O tym, kto mówi, decydowała kolejność listy wtyczek i chwila rejestracji (Latarnia i Motyle
dopisywały się przy pierwszej gotowej mapie - na samą górę, Act3 w pierwszej klatce mapy - na sam dół). Skutek, który był
powodem tego etapu: sklep Bron (zarejestrowany później, więc wyżej) przejął całą rozmowę kwatermistrza Kłosa i zniknęły jego
kwestie (skup, „Przyjdź po zmroku”).

Teraz jest jedna usługa w rdzeniu (`TawernaCore.js`):

- **`Tawerna.talk.run(interp, kto, { ev, base, skip })`** - rozmowa z postacią: najpierw **przejęcia** (`Tawerna.talk.takeover`)
  od najwyższego priorytetu, pierwsze z poleceniami ma rozmowę; bez nich - **własne kwestie** postaci (`base`: linijka pory dnia
  TownLife, rozmowa dziadka w Story...). `skip` - właściciel pominięty tym razem („Porozmawiaj”, „Nie, w innej sprawie”).
- **`Tawerna.talk.option(...)`** - **opcja** w menu postaci (Kłosa, Tadka, sklepikarzy, Borgara); menu = własne wiersze postaci +
  opcje innych systemów, ułożone po `order`; **pożegnanie zawsze ostatnie** (`Tawerna.talk.menu`).
- **`Tawerna.onEventStart`** i **`Tawerna.onEventList`** - jeden hak startu zdarzenia i jeden hak jego poleceń, z priorytetami.
- Przy równym priorytecie / order: nazwa właściciela, potem kolejność jego własnych wywołań - **nigdy kolejność listy wtyczek**.

Polecenia rozmów to dalej zwykłe polecenia silnika (101/401 z `\SPK[n]`, wybór 102/402/404), więc SpeechBubbles pokazuje je jak
dotąd: dymki nad mówiącym, popiersia, wybór w dymku; O - wybór, P - ostatni wiersz (pożegnanie).

---

## 1. Rozmowy mieszkańców (TownLife) - drabina przejęć

Mieszkaniec (zdarzenia 910-949, 2900-2959, wstawiane przez TownLife) ma w zdarzeniu jedno polecenie: `TownLife.talk(this)`.
`TownLife.talk` woła `Tawerna.talk.run(interp, klucz_mieszkańca, { base: jego linijka })`. Ukryty mieszkaniec (w domu, nieobecny)
w ogóle nie startuje (`Tawerna.onEventStart`, rozdz. 4).

Kolejność przejęć poniżej to kolejność, w jakiej gra pytała haki przed zmianą (zmierzona z kodu: chwile rejestracji i kolejność
wtyczek z `js/plugins.js`), zapisana nazwanymi priorytetami (`Tawerna.talk.PRIORITY`) - **z jedną świadomą zmianą (decyzja
2026-10-23, „sklep to dodatkowa linijka w menu postaci i nigdy nie zabiera jej kwestii”): sklepy zeszły pod zadania.** Sklepy Bron,
Ubior_Sklepy i sklep Baltazara po W5 (Kantor) stoją na poziomie `shop` (450): pod zadaniami i każdym innym systemem, nad powitaniem
dnia, które TownQuests mówi teraz osobnym przejęciem (`greet`, 400). Sklep otwiera się sam tylko wtedy, gdy nikt wyżej nie ma nic do
powiedzenia; tam, gdzie postać ma własne menu (Kłos, Tadek z rabatem, Ludmiła, Baltazar po W5), sklep jest jego wierszem (rozdz. 2).
Wyjątki wpisane w sklepach (`questFirst`, `YIELD` w Bron i Ubior_Sklepy) zniknęły - kolejność robi usługa.

| # | priorytet | wtyczka | kto (klucze) | kiedy bierze rozmowę | co widzi gracz |
|---|---|---|---|---|---|
| 1 | `errand+20` (920) | Latarnia | `latarnik`, `janek` | Bazyli - zawsze (pierwsze spotkanie, sprawy zadań przez `questWants`, menu: opał, pogoda, zapas, księga, „Co słychać?”, „Bywaj.”); Janek - przystań, 6-20, K49 albo poznany Bazyli, < 4 dzbanki tranu, nie na morzu, bez zadania u Janka, < 4 kupione dziś | Bazyli: rozmowa i menu; Janek: „Kupię dzbanek tranu (6 G)” / „Nie, w innej sprawie.” (to drugie = ta sama rozmowa bez Latarni przez 10 s) |
| 2 | `errand+10` (910) | Motyle | `pustelnik` | flaga `kleofasCzyta` i nowe złapane motyle w gablotce | Kleofas wpisuje motyle do kroniki (nagroda za komplet) |
| 3 | `owner+60` (760) | Zakon | `pustelnik`, `grabarz`, `rozbitek` | Kleofas: zna karty, 8-20 (godziny czytania), karta Zapisków w torbie, bez gotowego oddania zadania; Hieronim: D37, groby nie wszystkie; Eryk: tabliczka „Białej Źrenicy” w torbie | Kleofas: „Przeczytaj mi Zapiski strażnic (n)” / „Nie, w innej sprawie.” (= ta sama rozmowa bez Zakonu); pozostali: jednorazowe kwestie |
| 4 | `owner+50` (750) | Ludzie | `patrol_*`, `celnik`, `kupiec`, `handlarz`, `pasterz`, `drwal`, `kowal` | patrol: rewizja tylko, gdy wywołał ją podchodzący patrol (przychylność garnizonu < 10); celnik / Baltazar: skrzynia z D34 w torbie (bez pytania o zadania); handlarz, pasterz, Zbych, Tadek (z `ludKowalRabat`): gdy zadania nic nie mają (uwaga, gotowe oddanie, oferta) | rewizja; wybór „komu skrzynia”; menu handlarza / pasterza / Zbycha / Tadka (stal, opcje innych - Bron, „Co słychać?”, „Bywaj.”) |
| 5 | `owner+40` (740) | Lowy | `gajowy`, `rotmistrz`, `pustelnik`, `klusownik`, `praczka` | gajowy: grzywna, gdy bohater poszukiwany (przed zadaniami!); reszta po zadaniach: strzała białookiego pokazana rotmistrzowi / Kleofasowi (raz), skóry Ryśka (po ostrzeżeniu), mleko Marty (co kilka dni) | grzywna; jednorazowe kwestie; mały wybór „Pokaż skóry” |
| 6 | `owner+30` (730) | Zasoby | `jagna` | zawsze (pierwsze spotkanie, zabrane zioła, pierścień, skup ziół z klifu raz dziennie) | kwestie Jagny, wybór ziół do sprzedania |
| 7 | `owner+20` (720) | Kantor („ludmila”) | `ludmila` | uczciwy kantor (`honest = ludmila`), Map103, bez oddania zadania (`talkFor(..., true)`) | lada Ludmiły: „Pokaż towar”, opcje innych (Bron), „Obóz”, „Bywaj” |
| 8 | `owner+10` (710) | Wrak | `janek`, `rozbitek`, `szmaciarz` | Janek: przystań, godziny łodzi, łódź możliwa, nie na morzu, poznany, bez zadania; Eryk: zadania przez `questWants`, potem jego menu; Józek: jednorazowa poszlaka | „Zawieź mnie na wrak.” / „Nie, w innej sprawie.” (= ta sama rozmowa bez Wraku); rozmowa Eryka; poszlaka Józka |
| 9 | `owner` (700) | Garnizon | `rotmistrz`, `kwatermistrz`, `werbownik` | zawsze (pierwsze spotkania, sprawy zadań przez `questWants`, potem menu) | menu rotmistrza (przychylność, glejt, lista zaginionych...), **menu Kłosa** (rozdz. 2), werbownika |
| 10 | `handBack` (650) | Kruk | `kupiec` i właściciele cudzych listów (`kowal`, `kapral`, `janek`, `dzwonnik`, `soltys`, `znachorka`, `zosia`, `kupiec`) | list w torbie (bez gotowego oddania zadania); Baltazar odkupuje cudze listy raz dziennie | oddanie listu, wybór listów na sprzedaż |
| 11 | `meet+10` (610) | Pustelnia | `pustelnik`, `dzwonnik`, `kupiec` | Kleofas: zawsze (spotkanie, noc pytań, zadania przez `questWants`, menu: karta, kroniki, miód, wisiorek, kroniki, „Co słychać?”); Ambroży / Baltazar: luźna karta kronik (D23) | rozmowa i menu Kleofasa; oddanie / odkupienie karty |
| 12 | `meet` (600) | Przystań | `janek`, `przemytnik`, `celnik` | Janek, Roch: zawsze (spotkanie, zdrada, zadania przez `questWants`, listy W10, menu); celnik: pierwsze spotkanie, D20 w komorze celnej | menu Janka (ryby, wędzona ryba, czerwona woda...), Rocha, wydanie Rocha |
| 13 | `wrap` (550) | Homes | `soltys` | usłyszał o chacie, coś na sprzedaż, godziny ratusza | najpierw zwykła rozmowa sołtysa (ta sama rozmowa bez Homes: zadania, powitanie, linijka), potem „Domy na sprzedaż” / „Do widzenia” |
| 14 | `quest` (500) | TownQuests | każdy mieszkaniec | **co zadania mają do powiedzenia**, po kolei: pieniądze Kuby w dzień targowy, uwaga po zdarzeniu (raz), gotowe oddanie / przypomnienie własnego zadania / oferta / rozmowa kroku w toku (np. „Jeszcze schnie” K22, łapówka D6), chłód W6 | sprawy zadań |
| 15 | `shop+20` (470) | Kantor („baltazar”) | `kupiec` | po W5: cotygodniowa działka (podwójny kantor), sklep w godzinach pracy (wróg / w garści) | działka; „Pokaż towar”, opcje innych (Bron), „Bywaj” |
| 16 | `shop+10` (460) | Bron | `kowal`, `kupiec` | sklep otwarty (godziny, towar) - i nikt wyżej nic nie ma (zadania, menu Ludzi z rabatem, sklep Kantoru po W5, listy kruka, karta Pustelni, skrzynia D34) | menu sklepu: „Pokaż broń i zbroje” / „Sprzedaj...” / „Napraw...” / „Porozmawiaj” (= ta sama rozmowa bez Bron) / „Nic, dziękuję” |
| 17 | `shop` (450) | Ubior_Sklepy | `szwaczka`, `garbarz`, `przekupka`, `szmaciarz` (sklep z godzinami w `Ubior_Data.SKLEPY`) | sklep otwarty - i nikt wyżej nic nie ma (zadania, poszlaka Wraku u Józka) | powitanie dnia (kopia powitania TownQuests) + słowa sklepikarza, menu zakładek, opcje innych (Bron), „Porozmawiaj”, „Nic, dziękuję” |
| 18 | `greet` (400) | TownQuests („greeting”) | każdy mieszkaniec | raz dziennie, gdy nic wyżej | **powitanie dnia** (wg Opinii, z linijką mieszkańca) |
| 19 | `after` (300) | Act3 | `dzwonnik` | oblężenie uzbrojone albo trwa | słowa Ambrożego o dzwonie |
| - | `base` | TownLife | każdy | nic wyżej | linijka pory dnia / pogody / miejsca (po kolei) |

Stara furtka `TownLife.addTalkHook(fn, first)` zostaje dla kodu spoza gry (żadna wtyczka gry jej już nie używa): to przejęcie
mieszkańca na poziomie `owner` („first”) albo `after` (bez), z ostrzeżeniem w konsoli raz.

## 2. Menu z opcjami innych systemów

| postać (kto) | menu buduje | własne wiersze (kolejność) | opcje innych | koniec |
|---|---|---|---|---|
| `kwatermistrz` (Kłos) | Garnizon | [D27: „Nikomu nie powiem o nocnym zbożu.”], „Sprzedam coś wojsku.”, [D27: „Sprzedasz cztery worki zboża?”] | Bron: „Pokaż zbrojownię” (przychylność 15, godziny, Kłos nie wydany) | „Co słychać?” (`ORDER.chat`), „Bywaj.” |
| `zolnierz:<rola>` (żołnierze garnizonu, Map162) | Garnizon | - (słowa żołnierza) | Bron: `zolnierz:beczki` - zastępca Kłosa po D27 („Pokaż zbrojownię”, z `say`: jego powitanie przed wyborem) | „Bywaj.” (wybór tylko, gdy jest opcja) |
| `kowal` (Tadek z rabatem Ludzi) | Ludzie | „Stal (...)” | Bron: „Pokaż broń i zbroje” | „Co słychać?”, „Bywaj.” |
| `ludmila` | Kantor | „Pokaż towar” | Bron: „Broń z kontynentu” | „Obóz” (`ORDER.chat`), „Bywaj” |
| `kupiec` (Baltazar po W5) | Kantor | „Pokaż towar” | Bron: „Broń z kontynentu” | „Bywaj” |
| `szwaczka`, `garbarz`, `przekupka`, `szmaciarz` | Ubior_Sklepy | zakładki (Pokaż / Sprzedaj / Napraw / Ufarbuj) | Bron: skórzane zbroje, przeszywanice, stara broń (garbarz, szwaczka, szmaciarz) | „Porozmawiaj”, „Nic, dziękuję” |
| `borgar` (Story) | Story | „Weź zmianę” (w godzinach), „Sprzedaj towar” | TavernLife: „Zjedz coś”, „Wynajmij pokój” + tematy zadań przy barze (TownQuests przez TavernLife) | „Pogadaj”, „Nie teraz” |

`addMenu` w Garnizon, Kantor, Ludzie i Ubior_Sklepy - **usunięte**; jedynym użytkownikiem był Bron, który rejestruje teraz opcje
(`Tawerna.talk.option`, po jednej na postać, `rows`: lista zmienna - towar, przychylność, godziny). `Bron.menuRows(klucz, ev)` zostaje
jako odczyt (testy).

## 3. Rozmowy postaci spoza TownLife (jeden właściciel)

| postać / miejsce | wejście (polecenie zdarzenia) | właściciel | inni dopisują? |
|---|---|---|---|
| dziadek (901, Map019), Lord (902), drzwi dworu, Borgar (Map001), strażnik dworu | `Story.talk(this, rola)` → `Tawerna.talk.run(interp, rola)` (rola = `grandpa`, `lord`, `door`, `borgar`, `watch`) | Story | TownQuests: przejęcie `quest` dla `lord`, `grandpa` - linie zadania, potem rozmowa Story (`TownQuests.storyTalk` = ta sama rozmowa bez TownQuests); TavernLife: opcje Borgara |
| Melia, Ozzy, Grum (Map001) | `TavernLife.regular(this)` | TavernLife_Regulars | TownQuests: `regularTalk` (sprawy zadań przed powitaniem) i `regularTopics` (tematy w menu) - wołane wprost, kolejność zapisana w kodzie |
| miejsca tawerny (`<Tavern:meal/bath/stage/bed...>`, części: rzutki, siłowanie, plan) | `TavernLife.use(this)` | TavernLife | części przez `TavernLife.addKind` |
| tablica zleceń | `QuestBoard.open()` | QuestBoard | - |
| kocioł dziadka, kot | `HomeLife.cauldron(this)`, `HomeLife.pet` | HomeLife | - |
| żołnierze 640-647, rekruci, patrol, poszukiwacze, Kłos przy kantorze | `Garnizon.talk(this)` | Garnizon | Bron: opcja `zolnierz:beczki` (rozdz. 2) |
| przewoźnik, ludzie z promu | `Przystan.talk(this, "ferry" / "refugee")` | Przystań | - |
| Janek przy łodzi, żołnierze na wraku | `Wrak.talk(this, kto)` | Wrak | - |
| kantor nocą, piwnica, goście tylnych drzwi | `Kantor.act` / `Kantor.door` | Kantor | - |
| dwór Lorda (hol, biblioteka, gabinet, właz) | `Dwor.act` / `door` / `hatch` | Dwor | - |
| Borgar w piwnicy, krata, zamknięty bar | `Kasztelan.act` / `closed` / `grate` / `door` | Kasztelan | - |
| rywal w ruinach, zakon, pustelnia, latarnia, cysterna, paczki nowego terenu | `Rywal.act`, `Zakon.act`, `Pustelnia.act`, `Latarnia.act`, `Cysterna.act`, `Ludzie.act`, `Lowy.act`, `Zasoby.use` | każda swoje | - |
| miejsca zadań miasteczka (951-959), furtka K33, cokoły W3, krata W4, tablica W6 | `TownQuests.spotTalk`, `TownQuests.place` | TownQuests | - |
| pies, kruk, orzeł (buda, grzęda, gniazdo) | menu budynku (`Farming.addMenuHook`) | Dog, Kruk, Orzel | to nie rozmowy - menu budynków |

## 4. Start zdarzenia i jego polecenia (rdzeń, jeden hak)

`Tawerna.onEventStart(fn(ev) → true: przejęte, nie startuje, { owner, priority })` - od najwyższego:

| priorytet | wtyczka | co |
|---|---|---|
| `hidden` (900) | Garnizon, Ludzie, Przystan, TownLife, Wrak | ukryta postać / rzecz nie startuje (każda sprawdza swoje pole: `_garn`, `_ludHidden`, `_przystan`, `_town`, `_wrak`) |
| `instead` (500) | HomeLife | kot na posłaniu nie zabiera startu łóżku („spać?”) |
| `instead` (500) | TavernDice | stół z `<Tavern:dice>` otwiera grę zamiast strony |
| `before` (100) | Combat | automatyczny tryb walki wyłączany przed rozmową (Combat_Feel `beforeEvent`); nigdy nie przejmuje |

`Tawerna.onEventList(fn(ev) → lista poleceń zamiast strony | null, { owner, priority })` - od najwyższego:

| priorytet | wtyczka | co podmienia |
|---|---|---|
| `closed` (900) | Kasztelan | zamknięty bar (Borgar, lada), drzwi tawerny, krata w piwnicy (ostrzeżenie W4) |
| `scene+30` (830) | Dwor | drzwi dworu w W7 (nad rozmową drzwi Story), właz |
| `scene+20` (820) | Kantor | drzwi kantoru (zamknięty, nocna zmiana W5) |
| `scene+10` (810) | Homes | drzwi chaty na sprzedaż (Podgrodzie) |
| `scene` (800) | TownQuests | furtka (K33), cokoły (W3), krata (W4), tablica / Marek / straż obozu (W6) |
| `own+30` (530) | HomeLife | kocioł dziadka |
| `own+20` (520) | TavernLife_Regulars | Melia, Ozzy, Grum |
| `own+10` (510) | TavernLife | miejsca tawerny z `<Tavern:...>`, drzwi poniżej reputacji |
| `own` (500) | QuestBoard | tablica zleceń |
| `person` (300) | Story | Borgar, drzwi dworu (rozmowy fabuły) |

`Tawerna.onEventList.own(ev)` - własne polecenia strony z pominięciem haków (Story: rozmowa postaci po końcu fabuły).
Poza rdzeniem zostaje hak ChoppableTree (kamienie i krzaki z pustą stroną dostają swoje polecenia) - plik poza tym etapem;
nie gryzie się z resztą, bo działa tylko dla stron bez poleceń (każda podmiana ma ich dwa).

## 5. Konflikty i miejsca, gdzie decydowała kolejność wtyczek

Znalezione przy spisie. **Zachowanie zostało takie samo** (zapisane priorytetami), chyba że napisano inaczej.

1. **Cała kolejność haków TownLife** zależała od listy wtyczek i od chwili rejestracji („first” = na początek: późniejsza wtyczka
   przed wcześniejszą; Latarnia i Motyle przy pierwszej mapie, Act3 w pierwszej klatce, Bron i Ubior_Sklepy przy wczytaniu i potem
   jeszcze raz przy nowej grze / wczytaniu). Przestawienie listy (rejestracja wtyczek właśnie się zmienia) przestawiłoby rozmowy -
   teraz kolejność jest w priorytetach (rozdz. 1).
2. **Kłos i sklep** (powód etapu): przejęcie Bron nad Garnizonem zabierało jego kwestie. Od 2026-10-23 rano łatane `addMenu`;
   teraz opcja - menu Kłosa zawsze jego (test `rozmowy_test`).
3. **Ambroży w oblężeniu (Act3)** stoi niżej niż TownQuests: pierwsza rozmowa dnia daje **powitanie dnia** TownQuests, a słowa o
   dzwonie dopiero druga. Zachowane - do decyzji (wystarczy podnieść Act3 do `scene`).
4. **Baltazar po W5 (Kantor)** stał niżej niż TownQuests razem z powitaniem dnia: pierwsza rozmowa dnia - powitanie, sklep dopiero
   za drugim razem; a Bron (wyżej) ustępował mu ręcznym `YIELD.kupiec`. **Poprawione** razem z punktem 16: sklep Kantoru (`shop+20`)
   stoi pod zadaniami i nad sklepem Bron i powitaniem.
5. **Tadek: Bron nad Ludźmi** - Bron ustępował, gdy `Ludzie.addMenu` istniało (sprawdzenie API zamiast „Ludzie biorą Tadka”), a
   Baltazarowi - gdy istniało `Kantor.addMenu`. **Poprawione**: sklep Bron stoi pod Ludźmi i Kantorem, `YIELD` zniknęło.
6. **Józek: Ubior_Sklepy nad Wrakiem** - sklep był wyżej, więc Ubior_Sklepy miał ręczne `YIELD.szmaciarz` (zaglądał w stan Wraku),
   żeby jednorazowa poszlaka nie przepadła. **Poprawione**: sklep stoi pod Wrakiem, `YIELD` zniknęło.
7. **Listy kruka** (Kruk, `handBack`) były niżej niż sklep Bron: u Tadka w godzinach kuźni list czekał na „Porozmawiaj”.
   **Poprawione** (sklep pod listami). Pod menu właścicieli zostają (u Tadka z rabatem - pod menu Ludzi; u Janka - pod Latarnią i
   Wrakiem). Zachowane.
8. **Skrzynia z D34 (Ludzie)** u celnika i Baltazara nie pyta o zadania (wyżej niż TownQuests i Przystań) - wybór „komu skrzynia”
   wyprzedza oddanie zadania. Zachowane.
9. **Grzywna gajowego (Lowy)** wyprzedza zadania (świadomie: najpierw pieniądze). Zachowane.
10. **Powitanie dnia**: Ubior_Sklepy mówi kopię powitania TownQuests przed swoim menu, Bron (Tadek, Baltazar) nie - u nich powitanie
    przepada do „Porozmawiaj” (powitanie stoi pod sklepami). Zachowane (niespójność do decyzji).
11. **TownQuests owijał `Story.talk`** (podmiana funkcji innej wtyczki - działała tylko, gdy TownQuests stał niżej na liście) -
    teraz przejęcie `quest` dla `lord` i `grandpa`.
12. **„Nie, w innej sprawie” / „Porozmawiaj”** działały przez flagi modułów (`passKleofas` w Zakonie, `passJanek` we Wraku,
    `skipTalk` w Bron, `skipOnce` w Homes). Gdy w ponownej rozmowie odpowiedział ktoś wyżej, flaga zostawała i **następna**
    rozmowa gubiła część tej wtyczki. Teraz `skip` jednej rozmowy - nic nie zostaje (poprawione; w zwykłej grze niewidoczne).
13. **Polecenia zdarzeń**: Kasztelan nad Story i TavernLife (zamknięty bar), Kasztelan nad TownQuests (krata - obie wtyczki
    podmieniały to samo zdarzenie), Dwor nad Story (drzwi dworu), bywalcy nad TavernLife - wszystko z kolejności listy; teraz
    priorytety (rozdz. 4).
14. **Stół kości przed trybem walki**: TavernDice przejmuje start, zanim Combat zdąży wyłączyć automatyczny tryb walki - przy
    otwarciu gry w kości tryb zostaje. Zachowane (`before` działa tylko, gdy nikt nie przejął startu).
15. TavernLife dopisywał wiersze Borgara przez `T.call("TavernLife", "borgarOptions")` wołane przez Story - teraz opcja
    (`borgarOptions` zostaje jako odczyt).
16. **Sklepy Bron i Ubior_Sklepy (od 2026-10-23) nad krokami zadań w toku**: stały nad TownQuests, a ich `questFirst` ustępował
    tylko uwadze, *gotowemu* oddaniu, ofercie (i znacznikom w Bron) - `TownQuests.talkFor(klucz, true)` to tryb „fabularny”, bez
    przypomnień i rozmów kroku w toku. Skutek: `regulars_test` (K22 - u Ignaca menu garbarza zamiast „Jeszcze schnie...”),
    `regulars_quests_test` (D6 - w godzinach kantoru sklep Bron zamiast łapówki Baltazara, dalsze kroki się sypały), `pustelnia_test`
    (odkupienie karty kronik u Baltazara); to samo dla listów kruka na sprzedaż. **Poprawione 2026-10-23 (decyzja: „sklep to
    dodatkowa linijka w menu postaci i nigdy nie zabiera jej kwestii”)** priorytetem w usłudze, bez wyjątków we wtyczkach: sklepy na
    poziomie `shop` (450) pod zadaniami (`quest` 500) i wszystkim wyżej, powitanie dnia TownQuests osobno (`greet` 400) pod sklepami;
    `questFirst` i `YIELD` usunięte z Bron i Ubior_Sklepy. Sklep jako wiersz w menu postaci (Kłos, Tadek z rabatem, Ludmiła, Baltazar
    po W5, sklepikarze ubrań) - bez zmian. Skutek uboczny: póki zadanie ma coś do powiedzenia sklepikarzowi bez własnego menu (np.
    przypomnienie jego własnego zadania), jego sklep sam się nie otwiera.

## 6. Czego nie przeniesiono (i dlaczego)

- **Hak `Game_Event.list` w ChoppableTree** - plik poza tym etapem (pracuje nad nim kto inny); nie gryzie się z resztą (rozdz. 4).
- **Bywalcy tawerny (TavernLife_Regulars)** - zadania pytane wprost (`TownQuests.regularTalk`, `regularTopics`), kolejność zapisana
  w kodzie, nie w liście wtyczek; rozmowa nie idzie przez `Tawerna.talk.run`. Przeniesienie = przebudowa ich menu na opcje.
- **Rozmowy jednego właściciela** (żołnierze garnizonu, przewoźnik, Wrak, Kantor nocą, dwór, Kasztelan, Rywal, Zakon, Pustelnia,
  Latarnia, Cysterna, paczki nowego terenu) - nikt inny w nie nie wchodzi; nie idą przez `Tawerna.talk.run` (wyjątek: menu żołnierza
  garnizonu bierze opcje). Gdy ktoś zechce coś do nich dopisać - wystarczy jak w TownLife: `run` + `rows`.
- **„Czy zadanie ma coś do powiedzenia” we własnych menu postaci** (`questFirst` w Ludziach; `questWants` w Garnizonie, Latarni,
  Przystani, Pustelni, Wraku, Lowach) - każdy właściciel postaci pyta TownQuests po swojemu, bo jego menu stoi nad zadaniami
  (poziom `owner` / `meet`); ujednolicenie zmieniłoby drobne różnice między nimi. U sklepów (Bron, Ubior_Sklepy) tego już nie ma -
  robi to priorytet (rozdz. 5, punkt 16).
- **Pomocnicy tekstu** (`linesTo`, `sayTo`, `wrap`, `choiceTo` w każdej wtyczce) - zostają: łamanie linii musi być co do znaku takie
  jak było. Wspólne są tylko `Tawerna.talk.choice` / `menu` tam, gdzie wchodzą opcje.
- **Menu budynków** (`Farming.addMenuHook`: pies, kruk, orzeł, chaty) i **menu P** (`MenuPanel.addCommand`) - to nie rozmowy.
- **`TownLife.addTalkHook`** - zostaje jako stara furtka (przez usługę), dla kodu spoza gry.

Stan rozmów w zapisie (flagi zadań, `met`, `greeted`, `said`, zaufanie bywalców) - bez zmian; usługa nic nie zapisuje.
