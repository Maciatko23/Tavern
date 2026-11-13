# Tawerna 2 - potrzeby strony fabularnej (slice B)

Research read-only, 2026-11-08. Zakres: Act3, Kasztelan, Podroznicy(+5,+Sprawy), Poselstwo, Dezerter (W16), SwieteKosci (W15),
Wrak, TownQuests, Intrygi, Story, Journal, Underground, Rywal + data/*.json poza Map001/025/026 + docs/STORY.md.
Nie istnieje plik `Lancuchy*` - "Lancuchy" to tylko nazwa wlasciciela id (Dezerter/SwieteKosci). Dwor, Zakon, Kantor, Starcia, Orzel,
Prologue, Historyjki: brak zaleznosci od map 1/9/25/26 (tylko miasto/Map008 lub inne mapy) - patrz sekcja 9.

Legenda "Naprawa": **re-pin** = zmienic stala wspolrzednych/numeru; **keep id** = zachowac id zdarzenia; **keep name** = zachowac nazwe
zdarzenia (regex); **keep tag** = zachowac tag `<Tavern:...>`/note; **none** = nic.

## !!! ZALEZNOSCI OD POMIESZCZEN USUNIETYCH (Rozany, Blekitny, Zielony, biblioteka, wielki salon, jadalnia)

| # | Gdzie | Co zalezy | Skutek | Proponowana naprawa |
|---|-------|-----------|--------|---------------------|
| D1 | `Podroznicy_Data.js:275` (`PODSLUCH`, `d42Narada`) + `js/teksty/podroznicy.txt:1251,1267,1280,1281,1359` | D42 "Zboze w susze": narada Zenona z Klosem **za drzwiami Jadalni prywatnej** na Map001 (klucz planu `jadalnia`, dzien 12, 20-22:30). Hero slucha stojac przy jednokomorkowej scianie (prog Czujnosc 6) | brak klucza `jadalnia` w `PLAN_DATA` => podsluch nigdy sie nie zlapie; quest D42 krok 0 (poszlaki 2 z 2) traci jedno zrodlo | Przeniesc rozmowe do pomieszczenia nowej karczmy z sciana podsluchowa (np. gabinet Borgara / maly pokoj Borgara albo kat kuchni): zmienic `pokoj:` + tekst "Jadalnia prywatna" w 5 liniach txt |
| D2 | `Poselstwo_Data.js:44-49,54-57` `AKTORZY.lord/feliks`, `NARADA`, `Poselstwo.js:11-12,406-415,475` | W14 rozdz. 3 **Narada w Wielkim salonie** (Map026): Lord (3070 @32,40) i Feliks (3071 @30,43) widoczni 21:00-22:30 w dniu narady, posel "trzymany" (`TownLife.hold`) na `NARADA.posel [28,40]`; podsluch `w14Narada` mapa 26, `pokoj: "salon"` (klucz planu `salon`) | brak `salon` w planie 26 => podsluch martwy; Lord/Feliks/posel stoja w nieistniejacym miejscu (poza mapa lub w scianie); krok "w14Narada" (`idz [26,41,40,4]`) skacze w pustke | Przeniesc narade do **Apartamentu Lorda** (zostaje) lub saloniku Zlotego: re-pin 3070/3071, `NARADA.posel`, `pokoj:` podsluchu na klucz planu Lorda (`lorda`/`lordb`), F9 `idz`; zmiana tekstow "Wielki salon"/"Jadalnia" w `poselstwo.txt:9,15,121,277` |
| D3 | `poselstwo.txt:9,15,121,277` + `Poselstwo_Data.js:9` | flavor/opisy zadania: "Jadalnia, Wielki salon", "podsluch z Jadalni" | tylko tekst widoczny w dzienniku | edycja tekstu |
| D4 | `Intrygi.js:145` `map = [1,25,26][floor]`, `planInfo` | indeks pietra planu 0/1/2 = mapy 1/25/26; klucz `s4` => "zloty". Ladowanie zalezy od **PLAN_DATA.floors** zachowujacego kolejnosc 1,25,26 | jesli Map026 zostanie jedynym "poddaszem" bez kluczy `s4a/s4b` -> info "kto mieszka" zniknie dla Zlotego | zachowac w planie 26 klucze `s4a`,`s4b` (Apartament Zloty) |
| D5 | `Podroznicy_Data.js:86,111,121-139` (ODSLONA) pokoje 4-24 | **21 numerow pokoi**; nowe pietro ma 12 pokoi (1,2,3 + 7 Eryka + 8 podroznych), wiec **13 numerow 4-24 przestaje istniec** | patrz sekcja 2 | patrz sekcja 2 |

Nie znalazlem w kodzie fabuly zaleznosci od Rozanego / Blekitnego / Zielonego / biblioteki Map026 (jedyne "biblioteki" w kodzie to Map173 dworu
Lorda - Dwor.js, i Lipnica - tylko tekst). Apartament Zloty i Lorda zostaja, wiec W14 i Dwor (Map172-174) sa bezpieczne poza D2.

## 1. Zloty apartament / Map026 (zostaje: Zloty + Lorda)

| Plik:linia | Czego potrzebuje | Co sie psuje | Naprawa |
|------------|------------------|--------------|---------|
| `Poselstwo_Data.js:46` `MAP.apartamenty=26` | numer mapy | - | none (ID mapy zostaje 26) |
| `Poselstwo_Data.js:48` `AKTORZY.albin` id 3072 Map026 (65,29) dir 2 | Albin przed drzwiami Zlotego w Noc Kupaly | stoi w losowym miejscu | re-pin do nowych drzwi Zlotego |
| `Poselstwo_Data.js:62` `MIEJSCA posel_wnetrze [65,40,4]`, `gwardzista_wnetrze [66,30,2]` | miejsca posla (kominek Zlotego) i Ostapa (drzwi) -> `TownLifeData.SPOTS_BY_MAP[26]` | NPC chodzi po scianach | re-pin (albo znaczniki "Miejsce: posel_wnetrze" w mapie) |
| `Poselstwo_Data.js:197-202` F9/skoki zadania: `[26,41,40,4]` (narada), `[26,62,28,6]` (kradziez), `[26,64,29,2]` (list) | debug i kompas "idz" | skok w pustke/sciane | re-pin |
| `Poselstwo.js:360` `T.inject([26,25], ids 3070-3071...)` | wstrzykniecie zdarzen 3070-3074 | - | none (keep id zakres 3070-3079) |
| `Intrygi.js:476-477` | **szuka na Map026 zdarzenia z note `<Tavern:bed room=zloty>`** i kladzie list o 1 kratke pod lozkiem (`zlotyList`) | brak lozka Zlotego => list bez miejsca | **keep tag** `<Tavern:bed room=zloty>` w nowej Map026 |
| `Intrygi_Data.js:70` `LIST_GDZIE.komnata [25,67,12]` | list w "Komnacie z kominkiem" Map025 (pokoj hero z rabatem) | jesli komnata znika - list nie spada | re-pin albo wyciac klucz `komnata` |
| `TavernLife.js:195,1094-1116` (poza slice) `<Tavern:gate minrep=80>` Zlota krata + `GATE_PASSES` (W14 kolacja "w sluzbie") | zdarzenie "Zlota krata (schody do Apartamentow)" na Map025 | kolacja do Zlotego nie otworzy bramy | **keep tag** gate, zostawic krate przy schodach |
| `Podroznicy_Data.js:19-21` `POKOJE_BOHATERA.zloty="furtka"`, OBSADA `posel` `pokoje:["zloty","zloty"]` | pokoj "zloty" nie jest w `POKOJE` - obsluga wylacznie w `pokojDla` | - | none; **keep** klucz planu `s4a`/`s4b` => `Intrygi.js:145` |
| `Poselstwo.js:482` Albin `krok` na Map025: `start [41,24,8]`, `trasa [[41,22],[44,19],[70,18],[88,18],[92,17]]` | nocna trasa Albina z pokoju 15 do schodow (Map025) | trasa przez sciany | re-pin pod nowa galerie/schody |
| `Poselstwo_Data.js:50` `AKTORZY.wosk` id 3073 (45,25), `krata` id 3074 (91,17) Map025 | slady sledztwa na galerii przy pokoju 15 i przy zlotej bramie | slad w scianie | re-pin (galeria przy pokoju 15 + przy zlotej bramie) |
| `Poselstwo_Data.js:201` (krok 5) `[25,45,27,8]` | skok do wosku | jw. | re-pin |
| `Poselstwo.js:426` lista map `[1,25,26]` (mysl Kupaly) | mapy 1/25/26 | - | none |

## 2. Pietro goscinne Map025 - pokoje, numery, drzwi, miejsca

### 2a. Kontrakty nazewnicze (keep name)
- Drzwi pokoi: regex `/^(?:Drzwi|Wejście) -> Pokój (\d+)$/` (`Intrygi_Data.js:46`, `Intrygi.js:157`) - zamkniete drzwi zajetych pokoi, "Zapukaj", sprzatanie 9-11, klucz Borgara. W obecnej Map025 uzywane: `Drzwi -> Pokój N` (1-7, 20-24), `Wejście -> Pokój N` (15-19). **Nowe drzwi musza nosic dokladnie te nazwy**. Inne drzwi ("Drzwi -> Komnata", Lazienka, Bieliznik, Pokoj pokojowki) NIE sa objete regexem (poprawnie).
- Skrzynie do przeszukania: nazwa zdarzenia `/^Kufer/` lub `/^Torba/` (`Intrygi_Data.js:49`), polozone **wewnatrz prostokata pokoju `r<N>` z PLAN_DATA** (`Intrygi.js:224` `numerPokoju`). Obecnie "Kufer podróżny" x20, "Torba podróżna" x9, "Kufer" x6.
- Klucze planu pietra: `r<N>` dla pokoi (`Podroznicy_Sprawy.js:267` `roomKey`, `Intrygi.js:95`), pietro w `TavernLife_Plan.js:59 PLAN_DATA` (mapa 25 -> prostokaty). Podsluch wymaga **sciany jednokomorkowej** miedzy dwoma prostokatami planu (`miejsceSluchu`, `Podroznicy_Sprawy.js:272-283`) - geometria pokoi musi to zachowac.
- `Miejsce: pokoj_<n>` / `pokoj_<n>_2` (opcjonalne, nadpisuja `POKOJE[n].miejsce`) - `Podroznicy_Data.js:537-538`.
- Znacznik `Podroznicy.js:569-602`: Map001 `Miejsce: podrozny_1..6`, `kompania_1..4`, `grajek`, `medyk` - **nie ma ich w obecnej Map001** (tylko `gosc_1..8`), wiec podrozni siedza w pokojach. Opcjonalnie dodac w nowej sali. (`MIEJSCA_W_SALI=6`, `Podroznicy_Data.js:76`.)

### 2b. Stala tablica pokoi - `Podroznicy_Data.js:57-80`
`POKOJE` 4..24 (bez 7) z `typ` (1-os. 8 G / 2-os. 15 G / rodzinny 20 G) i `miejsce [x,y,dir]` na Map025. Wspolrzedne sa i tak niezgodne z mapa 97x71 (24:[106,70], 13:[11,89]) - sa stare. `POKOJE_BOHATERA {1,2: true; 3,"zloty": "furtka"}`, `POKOJ_ERYKA=7`, `POKOJ_RAFALA=1`, `LIMIT {rozdzial 4, renoma 5, akt2 5}`. **Naprawa:** zredukowac `POKOJE` do 8 pokoi podroznych (zachowac mieszanke typow: >=3 x "2-os.", 2 x "rodzinny", >=2 x "1-os."), przeliczyc `miejsce`. `pokojDla` (`Podroznicy.js:119-126`) jest odporne: gdy zadany numer nie istnieje, bierze **najblizszy wolny o tym samym typie**, wiec cast nie padnie, ale powiazane stale ponizej tak.
Wspolbieznosc: limit 5 podroznych naraz (grupa = 1) + kompania zajmuje 2 pokoje + posel (zloty, poza pula) => 6 pokoi z 8 wystarcza.

### 2c. Pokoje przypisane w OBSADA (`Podroznicy_Data.js:121-139`)
tobiasz 23, medyk 11, zboze 20, relikwie 12, kartograf 22, ksenia 18, wizytator 16, urszula 21, dezerter 5, lowczyni 6, kompania [9,9,10,10] (2 pokoje), grajek 17, poborca 4, pielgrzym 15, posel zloty, trojka 3 (hero room, wymaga "furtka"). Pula losowa wybiera z `Object.keys(POKOJE)` (`Podroznicy.js:216`). Nieistniejace numery zostana automatycznie przeniesione (fallback powyzej) - **nic nie pada**, ale ponizsze twarde powiazania numerow tak.

### 2d. Twarde powiazania numer pokoju -> fabula (re-pin lub przenumerowanie)
| Numer | Plik:linia | Zaleznosc | Co sie psuje | Naprawa |
|-------|-----------|-----------|--------------|---------|
| 1 | `TownQuests_Data.js:230` `w6_hide_tavern` (Map025, id 951, **x40 y38**, "Rafał", `$Npc_Rafal`) + `Podroznicy_Data.js:78` `POKOJ_RAFALA=1` + `Podroznicy.js:956` (wiersz w ksiedze) + `TownQuests.js:3595` (50 G dla Borgara) | W6 ch.4: ukrycie Rafala w pokoju 1 hero; porownanie z `where==="tavern"` | Rafal poza pokojem | re-pin x,y do wnetrza nowego pokoju 1 (event 951 jest wstrzykniety - **keep id 951 na Map025**) |
| 1,2,3 | `Intrygi_Data.js:70` `LIST_GDZIE 1:[25,38,44] 2:[25,58,44] 3:[25,28,44]` | list pod drzwiami hero (rano po nocy w pokoju) | list w scianie | re-pin |
| 1,3 | `Intrygi_Data.js:79` `D45.podsluch [1,3]`, `Intrygi.js:692` `d45Liczby pokoj "3"`; `Intrygi.js:157-166` dziurka/notes przy drzwiach pokoju 3 | D45 "Gosc spod trojki": **sciana pokoju 1 sasiaduje z pokojem 3**; dziurka od klucza w drzwiach pokoju 3; trojka mieszka w pokoju 3 (wymaga furtki) | brak adjacency 1-3 => podsluch martwy | zachowac **pokoje 1 i 3 przy wspolnej scianie jednokomorkowej** i drzwi `Drzwi -> Pokój 3` |
| 3 | `Intrygi_Data.js:79` `D45.sadza [25,29,49]` | rekwizyt "sadza" (event 3011) przed drzwiami pokoju 3 | w scianie | re-pin |
| 3 | `Intrygi_Data.js:79` `D45.sznur [9,4,10]` | sznur w piwnicy (Map009) nad beczkami | none (Map009 zostaje) | none |
| 2,4 | `Podroznicy5.js:7,37,305`, `Podroznicy5_Data.js:50` D44 "Podatek wojenny" | podsluch przez sciane pokoju **4 z pokoju 2**; Feliks (id 3080 @68,49 dir 8) przed drzwiami pokoju 4 (68,48) 22:40-23:20; skoki F9 `[25,61,40,6]`, `[25,67,41,8]` | pokoje 2 i 4 nie sasiaduja / Feliks w scianie | zachowac sasiedztwo 2-4 + drzwi 4 od korytarza; re-pin 3080 i skoki; **keep id 3080** |
| 4 | `Podroznicy_Data.js:132` poborca pokoj 4 | - | jw. | patrz wyzej |
| 5 | `Dezerter_Data.js:50` `DRZWI {pokoj "5", przed [16,49,8]}` (drzwi 16,48); `Dezerter.js:316-326,418` podsluch `w16Sen` (0-4) i noc Szczerby; F9 `Dezerter_Data.js:218-219` `[25,14,40,8]`,`[25,18,51,4]`; `Intrygi_Data.js:55-62` trasy nocnych kroczacych (Ozzy start [20,49,6], Tymon start [16,49,6]) | W16 (Tomek/Tymon w pokoju 5, Szczerba pod drzwiami 23-2, rozmowa o polnocy w pokoju) | Szczerba/Tymon w scianie; rozmowa `mapa:25` | wybrac nowy numer "dezertera" **albo** zachowac numer 5 i re-pin `przed`, skoki, starty kroczacych |
| 9,10 | `Podroznicy_Data.js:111` kompania pokoje [9,9,10,10]; `Podroznicy5_Data.js:171` skok `[25,32,60,4]` | D47 "Wolna Kompania" halas do 1:00, 4 najemnikow w 2 pokojach | - | przeniesc na dwa dowolne z 8 pokoi (dwa sasiednie) |
| 12 | `SwieteKosci.js:305` podsluch `w15Kurier` (pokoj "12", 22-24); `SwieteKosci_Data.js:52` `KURIER` id 3050 Map025 **(81,52)** dir 2 przed drzwiami (81,53); `SwieteKosci_Data.js:223` skok `[25,74,50,6]`; `Intrygi_Data.js:67` przeszukanie `w15Skrzynka` (pokoj 12) | W15 "Swiete kosci": Gaspar (relikwie) w pokoju 12 | kurier w scianie, podsluch martwy | przypisac Gasparowi pokoj, przeliczyc: podsluch `pokoj`, `KURIER`, skok; **keep id 3050**; skrzynia "Kufer/Torba" w jego pokoju |
| 15 | `Poselstwo.js:473,497,499` podsluch `w14Okno` (pokoj "15", 23-24), przeszukanie torba/kufer; `Poselstwo.js:482` trasa Albina; `Poselstwo_Data.js:200` | W14 Albin (pielgrzym) w pokoju 15; **drzwi sa `Wejście -> Pokój 15`**; galeria przed pokojem 15 (wosk @45,25) | brak pokoju 15 => 4 mechaniki | zachowac dla pielgrzyma pokoj o numerze 15 **lub** podmienic string "15" w 4 miejscach (`Poselstwo.js:473,497,499`) |
| 18 | `Intrygi_Data.js:68` przeszukanie `d46Pokoj` (pokoj 18, Ksenia), `Intrygi.js:164` `d46.zamek` | D46 "Skradziona szkatulka": zamek w drzwiach Ksenii | przeszukanie szuka po `kto` (zapis w ksiedze), wiec **przezyje zmiane numeru**; `d46Pokoj` ma fallback na wpis ksiegi | none (dopiero `skrzynia` w jej pokoju) |
| 20 | `Intrygi_Data.js:66` `d42Umowa` (pokoj 20, Zenon) | D42 szukanie umowy | jw. (po `kto`) | none poza skrzynia w pokoju |
| 22 | `Podroznicy5.js:312` `d48Tuba` (pokoj 22, kartograf) | D48 tuba Teofila; `Podroznicy5_Data.js:172` skok `[25,13,9,8]` | skok w pustke | re-pin skoku; szukanie po `kto` |
| Komnata | `Intrygi_Data.js:70`, `Intrygi.js:130` `room==="komnata"` (cena 0 raz w tyg. przy renomie 90) | pokoj hero "komnata" | - | jesli komnata wypada: usunac `komnata` z `RENOMA.komnata` lub zostawic klucz planu `chamber` |
| 7 | `Wrak_Data.js:61` `SPOT_ROOMS [6,38,4]` (`rozbitek_wnetrze` -> SPOTS_BY_MAP[25]); `Podroznicy.js:114,954` (ksiega: "pokoj 7"), `Podroznicy_Data.js:77` `POKOJ_ERYKA=7` | Eryk Sowa (W12 rozbitek) spi w pokoju 7 przy waskim lozku | spi w scianie | re-pin `SPOT_ROOMS` do nowego pokoju 7 |
| 16,17,21,23,11,6 | `Podroznicy_Data.js:121-139` | tylko przypisanie "ulubionego" pokoju | fallback najblizszy wolny | none po przycieciu `POKOJE` |

### 2e. Kroczacy po pietrze (`Intrygi_Data.js:55-62`, `IDS.kroczacy=3002` Map025)
Ozzy (start [20,49,6]) i Tymon (start [16,49,6]) ida trasa `[[44,50],[48,56],[48,62]]` do schodow na parter (Map025 -> Map001 schody ~ (48,62)). **re-pin** start/trase do korytarza nowego pietra; `K73 "Nocne kroki"` (Ozzy lunatykuje, W3). Wymaga drogi z korytarza do schodow.

### 2f. Przejscia Map001 <-> Map025
- `data/Map001.json` ev 13-18 "Schody -> Pokoje gości" (6 zdarzen, x37-39 i x61-63, y47) -> Map025 `(48,62,8)`; Map025 "Schody -> Tawerna (parter)" x5 -> Map001 (nie sprawdzano docelowych wspolrzednych, slice A). Fabula nie zalezy od nich bezposrednio, ale `Podroznicy`/`TownLife` biora z nich punkt wejscia.

## 3. Parter Map001 - zdarzenia po ID/nazwie i wspolrzedne (CZERWONE: ID zdarzen!)

**Twarde ID zdarzen Map001 w kodzie fabuly:**
| ID | Nazwa (data) | Uzycie | Plik:linia | Naprawa |
|----|--------------|--------|-----------|---------|
| 1 | `Borgar Kowal` | `$gameMap.event(1)` = Borgar (Act3 obrona drzwi, mowa "startInside"; `hideEvent:1`) | `Act3.js:219,277,634`; `Act3_Data.js:149` `hideEvent: 1`; `Przytulna.js:303` | **keep id 1** na Borgarze |
| 2 | `Melia Srebrogłosa` | `event(2)` melia | `Act3.js:960` | **keep id 2** |
| 3 | `Grum Żelazna Pięść` | `event(3)`; `hideEvent:3`, wrog Grum chowany | `Act3.js:956,960`; `Act3_Data.js:152` | **keep id 3** |
| 4 | `Dziadek Ozzy` | `event(4)` ozzy | `Act3.js:960` | **keep id 4** |
| 9 | `Luźna cegła` @9,4 | wejscie do piwnicy: komunikat, SelfSwitch A, wybor "Zejść na dół" -> `201 [0,9,10,8,8]` (Map009 @10,8 dir 8) | data/Map001.json ev9 | **keep name/mechanika**; przeniesc cegle do spizarni; transfer na Map009 (10,8) zostaje |
| 206 | `Mysia dziura` @11,4 | tylko wizualny element przy cegle | data | opcjonalnie |
| 209 | `Stare drzwi` @9,13 | obraz drzwi `!Fantasy_door1`; Act3 opisuje je jako "old door to the cellar" (`door [9,14]`, `doorTile [9,13]`) - **obiekt fizyczny dla pasków HP drzwi** | `Act3_Data.js:38,52` | brak w kodzie lookup po nazwie (uzywa tylko wspolrzednych) - re-pin `SPOTS[1].door/doorTile` na nowa spizarnie/przejscie |

**Nazwy/Tagi Map001 uzywane przez fabule (keep name / keep tag):**
- Borgar: `Story.js:488` `roleOf`: nazwa `/^Borgar\b/i` (strona 0, trigger <=2) lub grafika `People3_Tall` index 4 -> rola "borgar"; "Atmosfera - Borgar" jest ignorowany (rownolegle). Uzywane przez `Kasztelan.js:309-312` (zamkniety bar), `Dezerter.js:163` (`TavernLife.npc("borgar")`), `TownQuests.js:352-358` (`REGULAR`: `TavernLife.npc` po nazwach Melia/Ozzy/Grum).
- Lada (counter) = zdarzenie z `<Tavern:meal` w tresci/note (`Kasztelan.js:293-297` `counterTag`) - **keep tag** `<Tavern:meal ...>`; "Tavern:meal (zamówienie posiłku)" ev 38 i "Lada - rozmowa z Borgarem" ev 52 w obecnej mapie.
- Tablica zlecen: `QuestBoard.js:690-698` `isBoardEvent` = tag `<Tavern:board>` w note/pierwszej stronie; TownQuests W6 "plakat" (`TownQuests.js:1817-1840,3525`) nadpisuje liste tego zdarzenia -> **keep tag** `<Tavern:board>` (obecnie ev 19/21 "tablica zleceń"@43,49).
- `Story.js:1123` wejscie na Map001 -> krok "tavern"; `Story.js:1124` Map009 -> krok "cellar" (flags.cellar); `Story.js:249` cel dziennika `gdzie {map:1}`; `Story.js:458` `borgarEvent`.
- Drzwi do Map008 z miasta: `data/Map008.json` ev22 "Drzwi tawerny -> Tawerna" @51,16 -> **Map001 (50,53,8)**; `Kasztelan.js:301` `doorOf` regex `/^Drzwi tawerny/` na Map008. Wejscie Map001 (50,53) = takze `TavernLife.js:1739 ENTRANCE`, `Goscie_Sala.js:40` (poza slice). Exit Map001 ev10-12 -> Map008 (50..52,17) - nowa mapa musi miec wyjscie pod to samo miejsce w miescie lub zmienic transfer w Map008 ev22 i Map001 ev10-12.

**Stale wspolrzedne Map001 (re-pin):**
| Plik:linia | Stala | Znaczenie | Naprawa |
|-----------|-------|-----------|---------|
| `Act3_Data.js:48-57` `SPOTS[1]`: `door [9,14]`, `doorTile [9,13]`, `kitchen [[45,11],[47,11],[43,12],[49,12],[45,13],[41,12]]`, `front [[50,51],[49,51],[51,51],[50,50],[48,50],[52,50]]`, `guard [[10,16],[8,16],[11,17],[7,17]]`, `hall [[50,30],[47,31],[53,31]]`, `borgar [52,31]`, `entry [50,53]` | oblezenie fala 3 (z kuchni) i 4 (frontem), stare drzwi do piwnicy (**tu zlamane drzwi = zejscie do piwnicy**), obroncy | **re-pin wszystkie** do nowej tawerny 46x32: kuchnia (wejscie bandytow tylnymi drzwiami), front, spizarnia/cegla (stare drzwi), strefa Borgara |
| `Act3_Data.js:35,161` `TRIGGER.maps [1,8,9]`, `siegeMaps [1,8]`, `DOORS {1:...}` | siege rozpoczynane na mapach 1/8/9 | none (ID zostaja) | none |
| `Act3.js:1164` | ogien na tawernie przy `SPOTS[1].doorTile` | re-pin z doorTile | jw. |
| `Kasztelan_Data.js:35` `AT_BAR [1,52,31,8]` + uzycia `:180,185,187` (skoki F9 W4 rozdz 1,5,7) | skok "przy barze" | re-pin | re-pin |
| `Underground.js:1367` `reserveTransfer(1, 52, 31, 8, 0)` | powrot po zakonczeniu (hero przy barze) | zly punkt -> hero w scianie | **re-pin** |
| `Underground_Data.js:668-727` epilog `tawerna`: `cam [52,31]`, aktorzy `borgar [52,28,2]`, `ozzy [49,30,6]`, `melia [55,30,4]`, `grum [58,31,4]`, `hero [52,31,8]`, `heroIn [52,31,8]` | finalowa scena w tawernie (Borgar za lada, Ozzy/Melia/Grum) | aktorzy w scianach | **re-pin** 4 pozycje + kamera; wymaga miejsca za/przed lada dla 4 postaci |
| `Poselstwo_Data.js:197` skok `[1,52,33,8]` | kolacja na tacy u Borgara | re-pin | re-pin |
| `Wrak_Data.js:60` `SPOT_TAVERN [61,33,4]` (gosc_9) + `Wrak.js:624-632` (`TLD.SPOTS_BY_MAP[1]` `gosc_9`; sprawdza numer rozbitka w kolejnosci gosci) | stolek rozbitka (tawerna) | jesli `Miejsce: gosc_N` sie przenumerowuje -> inny numer | re-pin lub `Miejsce: gosc_9` w nowej mapie |
| `Podroznicy_Data.js:75-76,87,111` + `Podroznicy.js:569-602` | `Miejsce: podrozny_1..6`, `kompania_1..4`, `grajek`, `medyk` w sali (opcjonalne) | none, fallback pokoj | dodaj w nowej sali jesli chcesz |
| `Dezerter.js:157-170` scena wejscia Szczerby (Map001 18-22, dystans 12 od niej); kolejnosc Melia/Ozzy/Grum jako reakcje | Szczerba wchodzi do sali | none (po `TavernLife.npc`) | none |
| `Intrygi_Data.js:79` | none dla Map001; D45 `dziurka` w pokoju 3 | - | - |
| `Podroznicy_Data.js:203-204` miasto (51,17) | bramy karczmy w miescie (Map008) | none | none |

## 4. Piwnica Map009 (zostaje) - zaleznosci od Map001

| Plik:linia | Czego potrzebuje | Naprawa |
|-----------|-----------------|---------|
| `data/Map009.json` ev1 "Wejście do piwnicy" @9,8 (strona 1: powrot `201 [0,1,9,5,2]`) i ev2 "Schody do tawerny" @9,7 -> `201 [0,1,9,5,2]` | **powrot na Map001 (9,5) dir 2** - tuz pod cegla (9,4) | **re-pin** oba transfery na nowe wyjscie ze spizarni |
| `Journal.js:287` `done: $gameSelfSwitches.value([9,1,"A"])` | cel dziennika "Znajdz przejscie do piwnic": self-switch A zdarzenia **Map009 id 1** (ustawia je strona 0 przy pierwszym wejsciu) | **keep id 1 Map009** (zostaje); tekst celu "przyjrzyj sie scianom tawerny" ok |
| `Journal.js:138`/`Story.js:249` | cele: `where {map:1, name:"Tawerna"}` kompas | none |
| `Underground.js:288-300`, `Underground_Data.js:57` | `cellarGate [15,3,8]`, `Map009 (10,8)` jako fallback zapisu | none (Map009 niezmieniona) |
| `Kasztelan.js:82-85,233-245`; `Kasztelan_Data.js:184,189` | zdarzenia 540-541 w piwnicy @ (16,3), (14,3), skoki `[9,15,3,8]`,`[9,14,4,6]` | none |
| `TownQuests.js:1628,1680` nazwa `/^Stara krata zakonu/` (Map009 ev7 "Stara krata zakonu (zejście)" @15,2) | **keep name** (Map009 bez zmian) | none |
| `Intrygi_Data.js:79` `D45.sznur [9,4,10]` | rekwizyt id 3017 w piwnicy | none |
| `Rywal.js:933,938`, `Rywal_Data.js:47` `MAP {tavern:1, cellar:9, ruins:10}` | tylko numery map | none |
| `Act3.js:496-501`, `Act3_Data.js:55,106-108` | zlamane stare drzwi => najemnicy "schodza do piwnicy"; `Kasztelan` flaga `borgarPilnuje` zmniejsza obrazenia | patrz sekcja 3 (re-pin stare drzwi) |
| `Map010 ev1` "Wąskie schody do piwnicy" -> `201 [0,9,15,3,2]` | zejscie z ruin na Map009 | none |

**Luzna cegla w spizarni** - mechanika jest w samym evencie `Luźna cegła` (RM commands, SelfSwitch A). Przeniesc event (i opcjonalnie `Mysia dziura`) do spizarni; `STORY.md:50,254` opisuja to jako "dzwignia w regale/kominku" lub "luzna cegla w murze" - brak kodu zalezacego od polozenia.

## 5. Dwor, Kantor, Zakon, Rywal, Starcia, Orzel, Prologue - przeglad

Brak zaleznosci od wspolrzednych/pokoi Map001/025/026 poza: `Rywal`/`Kasztelan`/`Act3` (tylko mapy 1,9 - patrz wyzej). `Kantor_Data.js:71` `tavern:[51,18]` = brama w miescie (Map008). `Orzel_Data.js:149` `NO_LAND [1,14,120]` - orzel nie laduje na Map001 (nowa mala mapa tez pasuje). `Zakon_Data.js` i `Orzel_Data.js` `[7,25,8]` itp. to inne mapy. `Prologue.js:219` ma `cam:[1,640,372]` - to plansza prologu (indeks 1, NIE mapa).

## 6. Dane (data/*.json) poza Map001/025/026

| Plik | Co | Naprawa |
|------|----|---------|
| `Map008.json` ev22 "Drzwi tawerny -> Tawerna" @51,16 | `201 [0,1,50,53,8]` -> Map001 (50,53) | re-pin jesli wejscie nowej Map001 jest gdzie indziej |
| `Map009.json` ev1 (strona 1), ev2 | `201 [0,1,9,5,2]` -> Map001 (9,5) | **re-pin** (sekcja 4) |
| `Map010.json` ev1 | `201 [0,9,15,3,2]` -> Map009 | none |
| `CommonEvents.json`, `Troops.json` | brak transferow do map 1/9/25/26 | none |
| `System.json` | `startMapId 8, (72,16)` - start w miescie (nie w tawernie) | none |
| `MapInfos.json` | id 9 "Piwnica Tawerny", 25 "Pokoje gości", 26 "Apartamenty" - rodzic 1 "TAWERNA" | none (zachowac ID i nazwy; uzywaja ich nazwa-obrazki `img/nazwy_map/spis.json` i `MapaWyspy_Data.js:44-45`) |
| `Map025.json` ev3050/951/3011... | wstrzykiwane w locie (`Tawerna.inject`), nie ma ich w pliku | nic w pliku, ale `inject` pracuje na wsp. z kodu |

## 7. Dokumenty

`docs/STORY.md:9,50,131,233-234,246,254,287,293-294,421` - "piwnice tawerny", "dzwignia w regale/kominku lub luzna cegla w murze" (254), "pokoje jako scena: podsluch przez sciane, list, gosc, ktory nie placi, zamiana kluczy" (287), mapy "Map001 + Map025 Pokoje gości + Map026 Apartamenty" (293), "Piwnica tawerny i luzna cegla (Map009)" (294). Zmieniac tylko jesli mapy zmieniaja role; `docs/PODROZNI.md` (nie w slice) zawiera tablice pokoi 4-24.

## 8. Podsumowanie "co MUSI zostac / co przeliczyc"

**Zostaje bez zmian (kontrakty):** ID zdarzen Map001 1,2,3,4 (Borgar/Melia/Grum/Ozzy); nazwa Borgara `Borgar...`; tag `<Tavern:meal>` (lada), `<Tavern:board>`, `<Tavern:gate minrep=80>`, `<Tavern:bed room=zloty|1|2|3|komnata>`; nazwy drzwi `Drzwi|Wejście -> Pokój N`; `Kufer*`/`Torba*` wewnatrz prostokatow `r<N>`; Map009 ev1/ev2/ev7 + switch 11; ID map 1,9,25,26; ID zdarzen wstrzykiwanych 951 (Map025), 3002-3017, 3050, 3070-3074, 3080.
**Do re-pinu (suma):** `Act3_Data SPOTS[1]`; `AT_BAR` (Kasztelan_Data); `Underground.js:1367` + `Underground_Data:668-727`; `Map009` ev1/ev2 powrot (9,5); `Poselstwo` x13; `Podroznicy5` D44/D47/D48; `Dezerter` pokoj 5; `SwieteKosci` pokoj 12; `Intrygi` LIST_GDZIE, D45, kroczacy; `TownQuests_Data:230`; `Wrak_Data` 2 miejsca; `POKOJE` (13 numerow wypada).
**Decyzje do podjecia (design):** (1) gdzie narada D42 (zamiast Jadalni) i gdzie narada W14 (zamiast Wielkiego salonu - sugestia: Apartament Lorda); (2) ktore 8 numerow pokoi podroznych (sugestia: zachowac 4,5,9,10,12,15,18,20 - mniej zmian: story-pokoje to 4,5,12,15 + kompania 9,10 + ksenia 18 + zboze 20; kartograf 22 -> fallback; D48 tuba/22 do przypisania); (3) czy "komnata" (rabat 90 renomy) zostaje; (4) sasiedztwa scian: 1-3 (D45), 2-4 (D44).
