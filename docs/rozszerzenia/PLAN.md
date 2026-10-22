# Nowy teren 21 map: plan rozszerzeń dla 4 równoległych paczek

Wersja z 2026-10-21. To jest **plan**: w grze nic jeszcze nie zbudowano.
Podstawa:
- 21 map pod gołym niebem powiększonych ×2 (`tools/powieksz/stan.json`, zrzuty w `docs/powiekszenie/`).
- Lista pomysłów, które użytkownik zaakceptował w całości.

Plan ma trzy części:
1. Pakiet 0, czyli rusztowanie. Robi go koordynator przed startem paczek.
2. Kontrakt współpracy.
3. Paczki A–D z każdą rzeczą osobno.

Na końcu jest integracja, ryzyka i pytania.

**Jak sprawdzono miejsca.** Każde pole w tabelach sprawdzono dwa razy:
- Skryptem w Pythonie: kafle i flagi tilesetu, regiony 1/2, zdarzenia z ich zajętymi polami i koronami drzew, wyszukiwanie (BFS) od starej części mapy.
- Sondą w grze (port 9557, nowa gra fabularna): wszystkie zdarzenia wstawiane przez wtyczki i przejezdność według silnika.

Wyniki:
- Wszystkie miejsca są wolne. W promieniu 2 pól nie ma żadnego zdarzenia innej wtyczki.
- Miejsca „pieszo” są dostępne pieszo.
- Miejsca „tylko z orła” leżą w odciętych kawałkach terenu.
- **Jedyny wyjątek:** silnik widzi na kilkunastu polach losowe suche krzaki zbieractwa Farming (`Farming.gatherKindOf(x,y) === "bush"`). Krzak znika, gdy na polu stoi dowolne zdarzenie. Szczegóły w punkcie 2.7.

Współrzędne zapisuję jako `(x,y)` albo `x 40–44, y 49–51`. Zakresy są włącznie.

---

## Decyzje użytkownika 2026-10-21 (obowiązują wszystkie paczki)

Użytkownik zaakceptował cały plan. Odpowiedzi na pytania z punktu 10:

1. **Woda: TAK, jak w planie.** Pięć ukrytych źródełek (1–2 porcje dziennie, wysychają w upał i suszę, zamarzają przy śniegu) i studnia sąsiada na Map003 (tylko deszczówka, najwyżej 4 porcje). Żadne nie jest nagrodą za zadanie.
2. **Zatoczka na Map125: TAK** (x 15–19, y 65–67). **Płycizny przy wraku na Map165: TAK** (P1–P3). Obie zmiany robi pakiet 0.
3. **Grabarz na cmentarzu: TAK.** Należy do **paczki D** (cmentarz to jej rzecz, punkt 7.7):
   - mieszkaniec TownLife 2930 `grabarz`, `map: 8`;
   - postać PixelLab w stylu bohatera;
   - budżet D rośnie z 75 do **110** generacji, więc razem paczki mają 435, a zapas zostaje ok. 355.
4. **Szczenięta i kłusownictwo: tak jak w planie.**
   - „Zostawić szczenięta” znaczy, że wataha z nory staje się przyjazna i nic się nie zabiera.
   - Kłusownictwo kończy się grzywną. Za trzecim razem przejście w żywopłocie jest zamknięte na 7 dni. Bez szubienicy i bez końca gry.

---

## 0. Skrót

| | Paczka A „Woda i zasoby” | Paczka B „Zwierzęta i łowy” | Paczka C „Ludzie” | Paczka D „Tajemnice i zakon” |
|---|---|---|---|---|
| wtyczki (nowe pliki) | `Zasoby_Data.js`, `Zasoby.js` | `Lowy_Data.js`, `Lowy.js` | `Ludzie_Data.js`, `Ludzie.js` | `Zakon_Data.js`, `Zakon.js` |
| właściciel (`owner`), klucz stanu | `Zasoby` / `zasoby` | `Lowy` / `lowy` | `Ludzie` / `ludzie` | `Zakon` / `zakon` |
| zdarzenia `Tawerna.inject` | **2100–2299** | **2300–2499** | **2500–2699** | **2700–2899** |
| mieszkańcy TownLife (2. zakres) | 2900–2904 | 2905–2909 | 2910–2929 | 2930–2939 |
| przedmioty (`data/Items.json`) | 185–199 | 200–209 | 210–224 | 225–239 |
| ikony (IconSet, wiersz) | 464–479 (wiersz 29) | 480–495 (wiersz 30) | 496–511 (wiersz 31) | 512–527 (wiersz 32) |
| nowe mapy | – | – | 177 „Jaskinia przemytników” | 176 „Komora pod menhirami” |
| przełączniki (System.json) | 21–22 | 23–24 | 25–26 | 27–28 |
| zadania | K55–K58, D30–D31 | K59–K62, D32–D33 | K63–K66, D34–D35 | K67–K70, D36–D38 |
| test / port CDP | `tests/zasoby_test.js` / **9551** | `tests/lowy_test.js` / **9552** | `tests/ludzie_test.js` / **9553** | `tests/zakon_test.js` / **9554** |
| budżet PixelLab | 90 | 85 | 150 | 110 (z grabarzem) |
| przedrostek flag | `zas` | `low` | `lud` | `zak` |

Pozostałe przydziały:
- **Pakiet 0 (koordynator):**
  - wtyczki `Okolice_Data.js` i `Okolice.js`;
  - zdarzenia 2000–2099, ikony 458–463;
  - test `tests/okolice_szkielet_test.js`, port **9550**;
  - integracja: test `tests/okolice_integracja_test.js`, port **9555**.
- **Rezerwa:** zdarzenia 3000+, przedmioty 240–249, mapy 178–179, mieszkańcy 2940–2949, zadania K71–K74, D39–D40 i ewentualnie W14.
- **Przejście w żywopłocie Map024:**
  - kafle przestawia **pakiet 0** (raz, przy zamkniętym edytorze);
  - wszystko, co stoi przy przejściu (zdarzenie, teksty, gajowy, kłusownictwo), robi **paczka B**.

---

## 1. Co trzeba wiedzieć przed startem (ustalenia z przeglądu kodu)

### Numery zdarzeń
- Pod 1000 wolnych jest ledwie ~13 numerów: 560–569, 799, 900, 999. Pole 780–798 zajmuje tylko `tests/core_test.js`.
- Od 1000 w górę wszystko należy do Forestry (posadzone sosny, `[1000, ∞)`). Forestry nadaje numer `max(1000, $dataMap.events.length)`, więc wstawione zdarzenie 2000+ przesunęłoby sosny poza ich zakres.
- **Pakiet 0 przycina Forestry do 1000–1999** i zmienia `nextId` na „pierwszy wolny numer w 1000–1999”.
  - Stare zapisy mają sosny na 1000–~1100, więc nic się nie psuje.
  - Paczki dostają 2000–2899.

### Mieszkańcy TownLife
- Zakres 910–949 jest pełny, wolny jest tylko 949.
- **Pakiet 0 dodaje drugi zakres 2900–2949** (ten sam właściciel „TownLife”, `TownLifeExtra` z `id` z tego zakresu).
- **Map023 nie może być domem żadnego mieszkańca.** Psuje to nocne miejsce kłusownika Ryśka (TownLife: dom kontra miejsce „w środku”).

### Postacie, które już są
- **Zbych Smolarz** (drwal i węglarz, Podgrodzie, klucz `drwal`, 926) to nasz węglarz. Paczka C daje mu mielerz.
- **Babka Jagna** (zielarka, zleceniodawczyni z tablicy) to nasza zielarka. Paczka A daje jej postać na mapie.
- **Rysiek Sidło** (`$Npc_Klusownik`, Podgrodzie) to kłusownik do zadania gajowego (paczka B).
- **Szary Kieł** (list gończy, wilk, Map023) i **Czarny Ryj** (list gończy, dzik, Map021) już są w QuestBoard. Nora i błotnisko stają się ich miejscami.

### Woda
- `docs/QUESTY.md:28` mówi: „żaden quest nie daje wody ani nowego źródła wody jako nagrody”.
- Źródełka **nie są nagrodą**: można je tylko znaleźć, dają 1–2 porcje dziennie i wysychają w upał.
- Studnia sąsiada po naprawie zbiera **tylko wodę deszczową** (maks. 4 porcje).
- Na mapach z morzem (`<Water:salt>`) nic nie daje wody.
- `Farming.rationWell` nie umie zejść do zera (minimum 1 dziennie). Źródełka robimy więc wzorem czerpaka z Cysterny (`Cysterna.js` l. 354–433: własny licznik i `wellEntries()` owinięte limitem).

### Upał
- Gra nie ma temperatury. Pakiet 0 daje w `Okolice` jedną definicję:
  - `hot(d) = pora roku 1 (lato) && dni bez deszczu >= 6`;
  - `drought(d) = dni bez deszczu >= 10`.

### Losowe krzaki zbieractwa
Farming stawia na trawie losowe suche krzaki: 2% pól, liczone hashem pola. Krzak blokuje przejście. Pola na planie, gdzie silnik je pokazał:

| mapa | pola |
|---|---|
| 3 | (44,50) |
| 4 | (47,49) |
| 13 | (111,87), (98,70), (82,22), (100,38) |
| 18 | (53,45) |
| 21 | (58,12) |
| 22 | (75,36), (74,40), (74,41) |
| 23 | (68,19) |

Krzak nie rośnie na polu z jakimkolwiek zdarzeniem. Zasada: puste pole wewnątrz obiektu albo lądowiska dostaje **pusty znacznik** (zdarzenie bez obrazka, `Okolice.blank`).

### Brzeg Map125
W nowej części przystani brzeg jest szczelnie zarośnięty („ściana lasu”, warstwa 1, rodzaj 20). Pieszo nie da się dojść do wody w żadnym miejscu. Kraby, drewno z morza i wejście do jaskini potrzebują więc małej zatoczki. Wycina ją pakiet 0 (punkt 2.6; pytanie 2 do użytkownika).

### Map024
- Cała nowa część (2641 pól) jest odcięta żywopłotem: wiersz 29 i kolumna 39 to rodzaj 20.
- Główny obszar dworu łączy się z nią najkrócej przez **(7–8, 29)**:
  - nad tym miejscem: dolna ścieżka dworu (7–8, 28);
  - pod nim: łąka zwierzyńca (7–8, 30);
  - 2 pola od oranżerii i jej „tylnej furtki” (5,25).

### Map165
Łacha ma region 61, który `WrakData.FLOOD[165]` traktuje jako „sucho tylko w odpływie”. Kawałki wraku wymagają nowych płycizn: piasek plus region 61. Maluje je pakiet 0.

### Orzeł
- Lądowanie wymaga wolnego kwadratu: 4×4 dla dorosłego, 3×3 na etapie 4.
- Map120 jest w `NO_LAND`, więc gaj Milczących jest tylko pieszy.
- Po lądowaniu gra robi autozapis. Jeśli orzeł jest ranny, odleciał albo trwa burza, gracz utknąłby na odciętym skrawku. **Każde miejsce „tylko z orła” musi mieć jednokierunkowe zejście** (stare kołki i strzęp liny).
- Orzeł nosi bohatera od etapu 4 (65+ dni opieki). To treść na późną grę.

### Pozostałe ustalenia
- **Menhiry na Map018 są do rozkucia** (`Rock_Column` z `ChoppableTree mine`). Nasze nowe menhiry muszą mieć własną listę komend. Cień i tak mają, bo każdy obrazek `!$Rock_*` rzuca cień od słońca.
- **Cienie:** kierunek zależy tylko od ułamka dnia `p`, długość od pory roku. Wzór jest w punkcie 7.4.
- **Zwierzęta i ludzie (Hunting, Humans) nie są zdarzeniami.** Nie zajmują numerów i nie trafiają do zapisu. Każda paczka stawia je po `mapEnter` i trzyma własny stan.
- **QuestBoard:** nie ma haka na paczki. `QuestBoard.TEMPLATES`, `GIVERS`, `BOUNTIES` i `BEASTS` to żywe obiekty, do których można dopisywać z pliku ładowanego po `QuestBoard_Data`.
  - Miejsce zlecenia to tylko numer mapy, ale `QuestBoard.spawnBounty(id, [x,y])` przyjmuje stałe pole.
- **Humans:** jeden obóz na mapę, losowe miejsce, tylko nocą. Stałe obozy wymagają dopisku w `Humans.js` (wyjątek paczki B).
- **Pies** (`Dog.findPrey`) poluje na każdego zająca i jelenia. Jelenie przy lizawce i w zwierzyńcu potrzebują filtra (wyjątek paczki B).
- **TownQuests:** miejsca zadań mają numery 951–959 osobno na każdej mapie.
  - Na Map008 wszystkie są zajęte, więc tam zadania używają kroków `custom` i własnych zdarzeń.
  - Przydział na pozostałych mapach jest w punkcie 3.4.
- **Dziennik:**
  - nie ma zakładki odkryć; jest `Journal.addTab` (wzór „Gablotka” z Motyle.js), `Journal.addNote`, `Journal.addTrackerSource` (kompas) i `Combat.discover(id, nazwa, xp)`;
  - **F9 nie ma rejestru wierszy** (Orzeł ma miękki hak dopisany w trzech miejscach `Debug.js`).
- **Znany błąd do integracji:** `Orzel.js` l. 1981 podaje `label:` zamiast `name:`, więc nazwa „Myśliwy Czarnych Oczu” się nie wyświetla. Paczka B używa `name:`.

---

## 2. Pakiet 0: rusztowanie (koordynator, przed startem paczek)

Pakiet 0 robi wszystko, co dotyka plików wspólnych albo danych, raz i przy zamkniętym edytorze. Dzięki temu cztery paczki potem nie dotykają ani tych samych plików, ani `data/`. Wyjątek to własny blok danych przez instalator (punkt 3.3).

Jeśli koordynator nie może tego zrobić, robi to agent paczki A **przed** startem pozostałych.

### 2.1 Numery zdarzeń
- `js/plugins/TawernaCore.js`, w `reserved` dopisać:
  - Okolice 2000–2099
  - Zasoby 2100–2299
  - Lowy 2300–2499
  - Ludzie 2500–2699
  - Zakon 2700–2899
  - TownLife 2900–2949 (drugi zakres)
- Tam też: Forestry `to: 1999`.
- `js/plugins/Forestry.js`:
  - `LAST_ID = 1999`, `T.inject("*", {ids: [FIRST_ID, LAST_ID]})`;
  - `nextId(mapId)` zwraca pierwszy numer z 1000–1999 bez `$dataMap.events[id]` i bez rekordu w `treesOf(mapId)`;
  - przy braku wolnego popup „Za dużo posadzonych drzew na tej mapie.”
- `tests/core_test.js` l. 179: sprawdzenie „forestry” z `[5000,5001]` zmienić na `[1500,1501]`.
- `docs/ARCHITEKTURA.md` §6: tabela numerów od nowa (jest nieaktualna) z nowymi zakresami.

### 2.2 TownLife: drugi zakres mieszkańców
`TownLife.js` + `TownLife_Data.js`:
- `TownLifeData.EXTRA_RANGE = [2900, 2949]`.
- `mergeExtra` przyjmuje `id` z 910–949 albo z 2900–2949.
- Drugie `T.inject("*", {ids: [2900, 2949], owner: "TownLife"})` (ten sam właściciel, więc rdzeń nie widzi kolizji).
- Sprawdzenie: `town_life_test`, `podgrodzie_life_test`, `przystan_test` (mieszkańcy poza miastem).

### 2.3 Przedmioty
- `data/Items.json`: wpisy 185–249 jako **puste rezerwy** (`name: ""`, `note: "<Okolice:rezerwa>"`, ikona 0).
- Dzięki temu kolejność instalacji paczek nie ma znaczenia: każda wypełnia tylko swój blok.
- Nazwy i numery z punktu 3.2 trafiają od razu do `OkoliceData.ITEMS`. Paczka może więc używać cudzego przedmiotu po nazwie, zanim jego właściciel go zainstaluje (np. handlarz C sprzedaje bryłę soli z B).

### 2.4 IconSet
- `img/system/IconSet.png`: z 512×928 (29 wierszy, ikony do 463) na **512×1056** (33 wiersze, ikony do 527). Nowe wiersze są przezroczyste.
- Nic w grze nie zakłada stałej wysokości (`iconIndex` → x = n%16, y = ⌊n/16⌋).

### 2.5 Mapy i przełączniki
- `data/MapInfos.json`:
  - 176 „Komora pod menhirami” (rodzic 18);
  - 177 „Jaskinia przemytników” (rodzic 125).
- Do tego puste szkielety `Map176.json` i `Map177.json`: 20×14, tileset 12 (jak ręczne piętra podziemi), notatka `<Dark:on><Ambience:cave>`, bez zdarzeń. Dalej mapy są paczek D i C.
- `data/System.json`: nazwy przełączników 21–28:
  - 21 `Zas_Studnia`, 22 `Zas_rez`;
  - 23 `Low_Wylom`, 24 `Low_rez`;
  - 25 `Lud_Jaskinia`, 26 `Lud_rez`;
  - 27 `Zak_Komora`, 28 `Zak_rez`.
- Paczki wolą samoprzełączniki i strony sterowane kodem; przełącznik tylko wtedy, gdy musi go widzieć strona zdarzenia na mapie.

### 2.6 Zmiany kafli (tylko nowy teren, plus jedno pole żywopłotu)
Przez skrypt `tools/rozszerzenia/kafle.py`: staging, kopie, układ edytora, autokafle przeliczone jak w `tools/powieksz/powieksz.py` (`reshape`).

| mapa | pola | co |
|---|---|---|
| **Map024** | (7,29), (8,29) | Wyłom w żywopłocie: warstwa 1 (rodzaj 20, żywopłot) → 0. Kształty autokafli sąsiadów (6,29) i (9,29) przeliczone, region 0. Przejście łączy dolną ścieżkę dworu (7–8, 28) z łąką zwierzyńca (7–8, 30). |
| **Map125** | x 15–19, y 65–67 | „Zatoczka przemytników”: warstwa 1 (rodzaj 20) → 0; warstwa 0 w x 15–16 → piasek (ten sam rodzaj co plaża w starej części, 0–22 × 28–37). Wejście od drogi przez (20,66), które już jest przechodnie. Pola (16,64) i (17,64) zostają ścianą lasu: tu stanie wylot jaskini (paczka C). |
| **Map165** | P1 x 46–48, y 23–24; P2 x 61–63, y 18–19; P3 x 70–72, y 23–24 | Trzy płycizny: woda → piasek łachy, region 61 („sucho tylko w odpływie”, `WrakData.FLOOD[165]` już to ma). Każda dotyka łachy (wiersze 20–22), więc w odpływie da się wejść pieszo. |

### 2.7 Wspólny rdzeń `Okolice_Data.js` + `Okolice.js`
**API** (`window.Okolice`, `Tawerna.api("Okolice")`):

Miejsca i odkrycia:
- `registerSpots(pkg, [{key, map, x, y, w, h, kind, name}])` i `spots(map?)`. Rejestr wszystkich obiektów paczek. Test kolizji czyta go w każdym teście paczki i w integracji.
- `discoverable({key, pkg, map, x, y, name, icon, text, xp=25})` i `discover(key)`:
  - przy `discover` dymek na górze „Odkrycie: …”, `Combat.discover(key, name, xp)` i wpis w zakładce;
  - stan w `Tawerna.state("okolice")`.
- Zakładka dziennika **„Okolice”** (`Journal.addTab`, wzór Motyle): mapy po kolei, przy każdej odkryte miejsca, a reszta jako „???” (liczba). Szczegół: tekst, mapa, „Prowadź” (kompas).
- Kompas: `addTrackerSource` dla miejsca wybranego w zakładce.

Pogoda i słońce:
- `dryDaysAt(day)`: dni bez deszczu przed danym dniem, z `Survival.weatherPlan`.
- `rainOn(day)`, `rainedRecently(day, n)`, `hot(day)`, `drought(day)` (punkt 1).
- `shadowAt(day, hour, hPx)`: wektor cienia w pikselach (wzór z `Sky.js`, punkt 7.4).

Pomocniki:
- `blank(id, x, y, name)`: zdarzenie bez obrazka (gasi losowy krzak Farming i nie blokuje lądowania orła).
- `page(...)`, `event(...)`: budowanie danych zdarzeń do `Tawerna.inject` (jak `Homes.js` `page()`).
- `ITEMS` (nazwa → numer, punkt 3.2), `ICONS`, `IDS`, `MAPS`, `PORTS`.

F9:
- `f9.add({owner, rows: () => [...], pick(row, delta), ok(row)})`.
- **Pakiet 0 raz dopisuje do `Debug.js`** sekcję „Okolice” w zakładce „Wyspa i fabuła”, w trzech miejscach co Orzeł: wiersze, ←→, OK. Iteruje po zarejestrowanych właścicielach.
- Paczki nie dotykają `Debug.js`.

### 2.8 `js/plugins.js`
Dziesięć nowych wpisów, z gotowymi pustymi szkieletami wtyczek:
- Pliki z danymi **przed TownLife** (TownLifeExtra i TownQuestsPacks muszą być wpisane przed TownLife / TownQuests_Data):
  `… Kantor_Data, Dwor_Data, Okolice_Data, Zasoby_Data, Lowy_Data, Ludzie_Data, Zakon_Data, TownLife, TownQuests_Data …`
- Silniki **po Orzel_Lot** (po wszystkich systemach gry):
  `… Starcia, Orzel, Orzel_Lot, Okolice, Zasoby, Lowy, Ludzie, Zakon, TitleScreen, Prologue`
- `QuestBoard_Data` ładuje się wcześniej niż pliki `*_Data` paczek, więc `QuestBoard.TEMPLATES.push(...)` z nich działa.

### 2.9 Test i instalacja pakietu 0
**Test `tests/okolice_szkielet_test.js` (port 9550):**
- 10 wtyczek ładuje się bez błędów;
- rejestr numerów nie zgłasza nakładania;
- Forestry sadzi w 1000–1999 także na mapie z wstawionym zdarzeniem 2000+;
- mieszkaniec testowy z numerem 2949 wchodzi;
- przedmioty 185–249 i ikony 464–527 istnieją;
- przejście (7–8, 29) na Map024 jest przechodnie;
- zatoczka na Map125 jest dostępna od drogi;
- płycizny Map165 są suche w `Wyspa.forceTide("low")` i zalane w `"high"`;
- `Okolice.shadowAt` zgadza się z `Sky.now()` o tej samej porze;
- **test kolizji**: wszystkie `Okolice.spots()` są wolne, przechodnie (poza `wall`) i nie nachodzą na siebie.

Ten test każda paczka uruchamia też u siebie, po swoim teście.

**Instalacja:**
1. Edytor zamknięty (`tasklist` tuż przed zapisem).
2. Kopie do `backup_art_<data>/rozszerzenia/pakiet0/`.
3. Staging: `tools/rozszerzenia/staging/` + `ZMIANY.txt` z SHA.
4. `python tools/rozszerzenia/instaluj.py --pakiet0 --wykonaj`.
5. Użytkownik otwiera projekt w edytorze na nowo i raz zagląda do Menedżera wtyczek przed zapisem.

Pliki do sprawdzenia po instalacji: `town_life_test`, `podgrodzie_life_test`, `przystan_test`, `wrak_test` (płycizny), `forest`/`core_test`, `debug_menu_test`, `quest_board_test`. Tylko te dotknięte.

---

### 2.10 Stan pakietu 0: ZROBIONE 2026-10-21 (paczki A–D mogą startować)

**Zainstalowane** (edytor był zamknięty; kopie: `Tawerna_archiwum_2026-10-18/dane_przed_rozszerzeniami/pakiet0/`, kod sprzed zmian: `.../dane_przed_rozszerzeniami/kod/`):
- `data/Items.json`: puste rezerwy 185–249 (`name: ""`, `note: "<Okolice:rezerwa>"`).
- `img/system/IconSet.png`: 512×1056 (33 wiersze, ikony 464–527 przezroczyste).
- `data/MapInfos.json` + szkielety `data/Map176.json` „Komora pod menhirami” (pod 18) i `data/Map177.json` „Jaskinia przemytników” (pod 125): 20×14, tileset 12, puste.
- `data/System.json`: przełączniki 21–28 nazwane.
- `data/Map024.json` wyłom (7–8, 29), `data/Map125.json` zatoczka x 15–19 y 65–67, `data/Map165.json` płycizny P1–P3 (region 61).
- `js/plugins.js`: `Okolice_Data, Zasoby_Data, Lowy_Data, Ludzie_Data, Zakon_Data` po `Dwor_Data`; `Okolice, Zasoby, Lowy, Ludzie, Zakon` po `Orzel_Lot`.

**Kod:**
- `TawernaCore.js`: rejestr (Forestry 1000–1999, Okolice 2000–2099, paczki 2100–2899, TownLife 2900–2949).
- `Forestry.js` v1.1.0: `LAST_ID = 1999`, `nextId` = pierwszy wolny numer z 1000–1999.
- `TownLife.js` v1.6.0 + `TownLife_Data.js`: `EXTRA_RANGE = [2900, 2949]`, osobne `Tawerna.inject` dla każdego zakresu.
- `Underground.js`: sceny zakończeń chowają też mieszkańców 2900–2949.
- `Debug.js` v1.11.0: sekcje F9 paczek z `Okolice.f9` (wiersze, ←→, OK).
- `Orzel.js`: strażnicy klatki z `name:` (było `label:`).
- Testy dopasowane do zmian: `tests/core_test.js` (rejestr: Forestry 1000–1999, Zasoby 2150), `tests/debug_menu_test.js` (Forestry 1000–1999; sekcje F9 z `Okolice.f9` liczone osobno, nowa kontrola), `tests/orzel_test.js` (wyścig w kontroli „wzbił się w powietrze”: zegar napisu i dymki czyszczone przed postawieniem orła).
- `docs/ARCHITEKTURA.md` §6: tabela numerów od nowa.
- Nowe: `js/plugins/Okolice_Data.js`, `js/plugins/Okolice.js`, 8 szkieletów paczek (`Zasoby*.js`, `Lowy*.js`, `Ludzie*.js`, `Zakon*.js` – rejestrują tylko swoją nazwę), `tools/rozszerzenia/` (`wspolne.py`, `kafle.py`, `pakiet0.py`, `instaluj.py`, `staging/`), `tests/okolice_szkielet_test.js`.

**Test pakietu 0:** `CDP_PORT=9550 node tests/okolice_szkielet_test.js` – 21/21. Dotknięte (port 9550): `debug_menu_test` 63/63, `journal_test` 28/28, `forest_test` 30/30, `town_life_test` 10/10, `orzel_test` 87/87, `core_test` 49/49, `tools/newstart/run_transfer_test.py` 110/110 przejść. Każda paczka uruchamia go też u siebie **na swoim porcie** (`CDP_PORT=955x`), po swoim teście: sprawdza wtedy jej zarejestrowane miejsca (kolizje na 21 mapach).

**Od czego paczka zaczyna:**
1. Przeczytaj ten plan (decyzje użytkownika na górze, swoją sekcję 4–7, kontrakt 3).
2. Wypełnij swoje szkielety `*_Data.js` / `*.js` (nagłówki już są; numer wersji podnieś z 0.0.0).
3. Najpierw zarejestruj miejsca: `Okolice.registerSpots("A", [...])` (format i tryby jak w `OkoliceData.PLAN_SPOTS`; od tej chwili test kolizji sprawdza Twoje, nie planu) i odkrycia: `Okolice.discoverable({...})`.
4. Przedmioty i ikony instaluj instalatorem (`tools/rozszerzenia/instaluj.py --paczka X --przedmioty ... / --ikony ...`), mapy 176/177 też (`--mapa`). Edytor musi być zamknięty.

**API `Okolice` (jak zbudowane):**
- `registerSpots(pkg, list)`, `spots(map?)`, `cellsOf(spot)`, `checkMap()` → `{ problems, bushes, spots }`, `walk([x, y])` → zbiór pól „x,y” dostępnych pieszo, `bushAt(x, y)`.
- `discoverable({ key, pkg, map, x, y, name, text, icon, xp = 25, near = 1 (−1: tylko ręcznie), air, when })`, `discover(key, quiet)`, `isFound`, `hint(key)`, `revealAll()`, `discoverAll()`, `forget()`; szyna: `okoliceDiscover { key, pkg, map }`.
- Zakładka „Okolice”: OK na miejscu ustawia kompas. **Uwaga:** kompas pokazuje cel z „Okolic” tylko wtedy, gdy nie prowadzi już do zlecenia ani zadania (pierwsze źródło wygrywa).
- `dryDaysAt(d)`, `rainOn(d)`, `snowOn(d)`, `rainedRecently(d, n)`, `hot(d)`, `drought(d)`.
- `shadowAt(d, h, hPx)` → `{ p, elev, ux, uy, dx, dy, len, light }`, `underShadow(foot, cell, d, h, hPx, tol)`. Okna zagadki menhirów (Strażnik (50,42) → dół (52,43), tolerancja 0,5 pola) wyszły w teście: wiosna 17:18–20:27, lato 18:06–20:57, jesień 16:21–19:27, zima 15:42–18:27 (siła cienia ≥ 0,82). D może je zawęzić.
- `page({...})`, `event(id, name, x, y, pages, note)`, `script(js)`, `blank(id, x, y, name)`, `item(nazwa)` (z `OkoliceData.ITEMS`), `mapName(id)`.
- `f9.add({ owner, title, rows: () => [{ label, icon, desc, what, pick }], pick(row, delta) /* zmienia row.pick i row.label */, ok(row) /* { go: [nazwa, mapa, x, y, kierunek] } | { back: true } | { say, bad } */ })`.

---

## 3. Kontrakt współpracy (obowiązuje każdą paczkę)

### 3.1 Zasady ogólne
- **Po polsku:** teksty w grze, opisy wtyczek, dokumenty, raport. Kod i komentarze mogą być po angielsku jak reszta.
- **Braki** (narzędzie, materiał, siły, zła pora) zawsze jako dymek nad bohaterem: `Tawerna.popup.need(ikona, tekst)`. Nigdy okno wiadomości.
- **Każde światło to płomień:** ognisko, mielerz, latarnia handlarza, świeca w kapliczce. Ciepła poświata i migotanie, jak `<Light:…><LightFlicker:…>`.
- **Woda jest rzadka.** Żadnych nowych źródeł poza źródełkami A i studnią deszczową A. Woda w glince, w kałużach przy odpływie i w błotnisku jest „nie do picia” (dymek). Nigdy z morza.
- **Postacie** tylko z PixelLab, styl bohatera:
  - pro, `style_character_id` = `bf29bbe1-35e0-4a01-b0e8-f8b502b9f196`, 64×64, 8 kierunków, `tools/npc/build_npc.py`; nigdy RTP;
  - popiersia przez `tools/busts/kit.py` (0 generacji), wpis `SpeechBubbles.BUSTS` dopisany w pliku z danymi paczki.
- **Obiekty:**
  - w stylu Winlu, widok ~45° z góry (jak grzyby, zioła, kamienie);
  - budynki i ruiny prosto z przodu (płaski front, dach z góry);
  - drobny piksel 1×, obrys 1 px.
- **Map001 (tawerna) jest nietykalna.** Na mapach użytkownika rzeczy tylko **dodajemy**, tylko w nowym terenie i przez `Tawerna.inject`. Pliki map zmienia wyłącznie pakiet 0 (punkt 2.6). Wyjątki: własne mapy 176 (D) i 177 (C).
- **Bramki fabuły** sprawdzaj przez API: `Story.chapterEnded()` (Akt II), `Wyspa.actTwo()`, przełącznik 16 (Osada Milczących otwarta), stan orła `Orzel.state().stage`, flagi `Wyspa.flag(…)`.
- **Nie commituj.** Commit i push robi tylko użytkownik.
- **Na koniec** napisz koordynatorowi krótko: co zrobione, wyniki testów, lista łat do plików wspólnych, zużyte generacje PixelLab.

### 3.2 Numery
**Zdarzenia** (`Tawerna.inject`, numery wspólne dla całej gry):

| zakres | właściciel |
|---|---|
| 2000–2099 | Okolice (pakiet 0) |
| 2100–2299 | Zasoby (A) |
| 2300–2499 | Lowy (B) |
| 2500–2699 | Ludzie (C) |
| 2700–2899 | Zakon (D) |
| 2900–2949 | TownLife (mieszkańcy paczek: A 2900–2904, B 2905–2909, C 2910–2929, D 2930–2939, rezerwa 2940–2949) |

Wewnątrz zakresu ten sam numer może być użyty na wielu mapach. Zalecane podzakresy: po 20 numerów na mapę.

**Przedmioty** (blok paczki; nazwy wstępne, paczka może je poprawić, numery zostają):

| nr | paczka | nazwa | uwagi |
|---|---|---|---|
| 185 | A | Wosk pszczeli | dzikie ule; świece, maść |
| 186 | A | Surowy krab | psuje się po 24 h |
| 187 | A | Pieczony krab | jedzenie |
| 188 | A | Blok kamienny | `<Weight:6>` |
| 189 | A | Drewno dryfowe | rozłupane daje Drewno 61 ×2 |
| 190 | A | Arcydzięgiel | rzadkie zioło Jagny |
| 191 | A | Dziurawiec | rzadkie zioło Jagny |
| 192 | A | Kozłek lekarski | rzadkie zioło Jagny |
| 193 | A | Złom żelazny | z wysypiska; w kuźni → Żelazo |
| 194 | A | Zaśniedziała moneta | sprzedaż 5 G |
| 195 | A | Maść szczepiarska | glina + wosk; do sadu |
| 196 | A | Napar z kozłka | lepszy sen |
| 197–199 | A | rezerwa | |
| 200 | B | Bryła soli | lizawka; sprzedaje handlarz C |
| 201 | B | Poroże jelenia | trofeum |
| 202 | B | Kieł odyńca | trofeum |
| 203 | B | Pazur niedźwiedzia | trofeum |
| 204 | B | Zezwolenie na odstrzał | `[K]`, `<Pamiatka>` |
| 205 | B | Strzała z białym okiem | dowód: Czarne Oczy |
| 206 | B | Srebrna strzała | trofeum strzelnicy, `<Pamiatka>` |
| 207–209 | B | rezerwa | |
| 210 | C | Przyprawy | |
| 211 | C | Mapa okolic | `[K]` |
| 212 | C | Skrzynia przemytu | `[K]`, `<Weight:8>` |
| 213 | C | Dziennik kopacza | `[K]` |
| 214 | C | Wełniany koc | |
| 215–224 | C | rezerwa | |
| 225 | D | Klucz Strażnika | `[K]`, kamień z krukiem |
| 226 | D | Pióro Skrzydlatej Straży | `[K]`, `<Pamiatka>` |
| 227 | D | Strzemię jeźdźca | `[K]` |
| 228 | D | Szarotka skalna | ziele z półek, tylko z orła |
| 229 | D | Warzucha nadmorska | ziele z klifów, tylko z orła |
| 230 | D | Okucie z wraku | |
| 231 | D | Tabliczka z kadłuba | `[K]`, W12 |
| 232 | D | Biały kamień milczenia | `[K]` |
| 233–239 | D | rezerwa | |
| 240–249 | – | integracja / rezerwa | |

Istniejące przedmioty, z których korzystamy (nie zmieniamy ich):
- Drewno 61, Kamień 64, Miód 76, Gałęzie 77, Węgiel drzewny 79, Deski 80, Ruda żelaza 85, Gwoździe 88, Młotek 89, Noże 90/91, Lina 93
- Surowa skóra 96, Grzyby 103, Zioła 104, Wełna 111, Mleko 123, Ser 124, Łuk 126, Strzały 127, Bukłak 129, Wiadro 138
- Dzikie jabłka 139, Nożyce 142, Pióra 146, Mokra glina 164, Skóra niedźwiedzia 170, Pióro białego orła 184

**Ikony:**
- A 464–479, B 480–495, C 496–511, D 512–527, pakiet 0 458–463.
- Paczka rysuje swój wiersz jako PNG 512×32 w `tools/rozszerzenia/<A|B|C|D>/ikony.png` (ikona n w kolumnie n−początek wiersza). Wkleja instalator.

**Mapy:** 176 = D, 177 = C, rezerwa 178–179. Wolne są też 158, 164, 170, ale zostają w rezerwie Wyspy.

**Zadania (K / D):**

| | A | B | C | D | rezerwa |
|---|---|---|---|---|---|
| K | K55–K58 | K59–K62 | K63–K66 | K67–K70 | K71–K74 |
| D | D30–D31 | D32–D33 | D34–D35 | D36–D38 | D39–D40 |

Najwyższe zajęte dziś: K54, D29, W13. Nowy wątek W14 tylko na życzenie użytkownika.

**Zlecenia QuestBoard:** klucze wzorów z przedrostkiem paczki: `zas_`, `low_`, `lud_`, `zak_`. Przedrostek `b_` jest już zajęty przez listy gończe (`b_szary_kiel`, `b_czarny_ryj`, `b_trojlap`).

**Mieszkańcy TownLife:** z punktu 2.2. Klucze z przedrostkiem nie są potrzebne, ale muszą być nowe: `jagna` 2900, `gajowy` 2905, `pasterz` 2910, `handlarz` 2911, `patrol_latarnia_1` / `_2` 2912–2913, `patrol_garnizon_1` / `_2` 2914–2915, `grabarz` 2930 (paczka D, decyzja użytkownika).

### 3.3 Pliki: kto co może zmieniać

| plik | kto | zasada |
|---|---|---|
| Swoje `*_Data.js`, `*.js`, `tools/rozszerzenia/<paczka>/`, `docs/rozszerzenia/<paczka>.md`, swój test, swoje grafiki (przedrostki w punkcie 3.5) | właściciel | dowolnie |
| `Okolice_Data.js`, `Okolice.js`, `TawernaCore.js`, `Forestry.js`, `TownLife*.js`, `Debug.js` | pakiet 0 / koordynator | paczka zgłasza potrzebę w raporcie |
| `Humans.js` | **tylko B** | jeden dopisany blok „stałe obozy” (`Humans.fixedCamp`); kopia przed zmianą; `humans_test` po zmianie |
| `Dog.js` | **tylko B** | `findPrey` pomija zwierzęta z `_noDog`; `dog_test` po zmianie |
| `QuestBoard_Data.js`, `TownQuests_Data.js`, `Journal.js`, `Kruk.js`, `Pustelnia*.js`, `Orzel*.js`, `Farming*.js`, `Hunting*.js`, `Starcia.js`, `Homes.js`, `Kantor*.js`, `Garnizon*.js`, `Wrak*.js`, `Sky.js`, `Survival.js`, `SpeechBubbles.js`, `Act3*.js`, `Underground*.js` | **nikt** | tylko przez API i dopisywanie w czasie ładowania: `TEMPLATES.push`, `TownQuestsPacks`, `TownLifeExtra`, `Farming.BUILDINGS.x.recipes.push`, `Survival.defineBuff`, `SpeechBubbles.BUSTS[...]`, `Act3Data.DEFENDERS.push`, `Hunting.SPECIES.x = …` itd. |
| `data/Items.json`, `img/system/IconSet.png`, `data/Map176.json` (D), `data/Map177.json` (C) | właściciel bloku | **tylko instalatorem**, punkt 3.3.1 |
| pozostałe `data/*.json`, `js/plugins.js` | pakiet 0 | paczki nie zapisują |
| `docs/QUESTY.md`, `docs/QUESTY_STAN.md`, `docs/STORY.md`, `docs/ARCHITEKTURA.md` | integracja | paczka pisze swój blok w `docs/rozszerzenia/<paczka>.md` w gotowym formacie tabel QUESTY; integracja wkleja |
| cudze testy | nikt | wyjątek: liczby mieszkańców w `town_life_test` / `podgrodzie_life_test`, opisane w raporcie |

**Zasada edycji pliku wspólnego (dotyczy B, pakietu 0 i integracji):**
- czytaj plik tuż przed edycją;
- zmieniaj tylko swój blok, oznaczony komentarzem `// [Okolice/<paczka>] …`;
- binarnie, z zachowaniem LF/CRLF pliku;
- kopia przed zmianą.

#### 3.3.1 Instalator danych `tools/rozszerzenia/instaluj.py` (pisze pakiet 0)
```
python tools/rozszerzenia/instaluj.py --paczka A --przedmioty tools/rozszerzenia/A/przedmioty.json [--wykonaj]
python tools/rozszerzenia/instaluj.py --paczka A --ikony tools/rozszerzenia/A/ikony.png [--wykonaj]
python tools/rozszerzenia/instaluj.py --paczka C --mapa 177 tools/rozszerzenia/C/Map177.json [--wykonaj]
```
Co robi instalator:
1. Sprawdza `tasklist`: jeśli działa RPG Maker, kończy z błędem.
2. Bierze blokadę `tools/rozszerzenia/.blokada` (paczka i czas; czeka do 2 minut).
3. Czyta plik docelowy na nowo.
4. Zmienia **tylko** blok paczki (numery przedmiotów z jej zakresu, jej wiersz IconSet, jej mapa).
5. Sprawdza, że reszta pliku jest bajt w bajt taka sama.
6. Zapisuje w układzie edytora i robi kopię do `backup_art_<data>/rozszerzenia/<paczka>/`.

Bez `--wykonaj` tylko pokazuje różnicę.

**Kolejność instalacji:**
- Pakiet 0 tworzy rezerwy, więc paczki instalują **w dowolnej kolejności, każda kiedy chce**. Blokada szereguje zapisy.
- Gdy edytor jest otwarty, paczka **nie instaluje**. Testuje na nakładce `GAME_OVERLAY=tools/rozszerzenia/<paczka>/staging` (jak przy miejscach Wyspy) i zgłasza koordynatorowi.
- Integracja na końcu sprawdza wszystkie bloki jeszcze raz.

### 3.4 Miejsca zadań TownQuests (numery 951–959 na danej mapie)
Paczka używa ich tylko, gdy potrzebuje kroku `spot`. Zajęte dziś: Map013 951–953, Map020 951, Map022 951, Map024 951–954, Map120 951, Map125 951, Map008 wszystkie.

| mapa | A | B | C | D |
|---|---|---|---|---|
| 3 | 951–953 | – | 954 | – |
| 4 | – | 953–954 | 951–952 | 955 |
| 13 | 954 | 955 | 956–957 | 958 |
| 17 | 951–953 | – | – | 954 |
| 18 | – | – | 955 | 951–953 |
| 21 | – | 953–954 | 951–952 | 955 |
| 22 | – | – | 952–953 | 954–955 |
| 23 | – | 951–953 | – | 954 |
| 24 | – | 955–957 | – | – |
| 111 | 951–953 | – | – | – |
| 120 | – | – | – | 952–953 |
| 125 | 952 | – | 953–954 | 955 |
| 155 | 951 | – | – | 952–953 |
| 157 | – | – | – | 951–952 |
| 159 | – | – | 951 | – |
| 162 | 954 | 951–952 | 953 | – |
| 165 | – | – | – | 951–953 |
| 168 | 951–952 | 953 | 954 | 955 |
| 175 | – | – | – | 951–953 |
| 8 | – | – | – | kroki `custom` i własne zdarzenia z zakresu D |

### 3.5 Grafiki, nazwy plików, PixelLab
- **Przedrostki obrazków:**
  - A: `!$Zas_*`, `$Npc_Jagna`
  - B: `!$Low_*`, `$Npc_Gajowy`
  - C: `!$Lud_*`, `$Npc_Pasterz`, `$Npc_Handlarz`
  - D: `!$Zak_*`
  - popiersia: `<Klucz>_Bust`
- **Budżet PixelLab** (konto: ok. 790 generacji do 29.10):
  - A 90 (z tego Jagna ok. 35), B 85 (gajowy ok. 35), C 150 (pasterz i handlarz po ok. 35), D 110 (z tego grabarz ok. 35), pakiet 0: 0;
  - razem 435, **zapas ~355** na poprawki i inne sesje użytkownika.
  - Paczka nie przekracza budżetu bez zgody koordynatora.
- **Limit 10 zadań naraz** jest wspólny dla wszystkich sesji. Każda paczka trzyma **najwyżej 2 zadania naraz**.
- **Używamy ponownie, bez generacji:**
  - `$Animal_Sheep`, `$Animal_Cow`, `$Animal_Hen`, `$Animal_Wolf` (szczenięta: skala 0,55), `$Npc_Zolnierz`, `$Npc_Klusownik`;
  - wyglądy Humans (Bandit, Archer, Merc, Captain);
  - `!$Rock_*` (menhiry, kopce), `!$Mt_Tent`;
  - grzyby i zioła w stylu Winlu (`img/system/Gather_*` przerobione na arkusz zdarzeń);
  - arkusz kruka z Kruk.js (tylko czytamy).

### 3.6 Testy
- Test paczki uruchamiasz tak: `CDP_PORT=<port> node tests/<test>.js`. Port tylko swój.
- Serwer gry: `node tools/serve.js` (port 8765), w tle, jeśli nie odpowiada.
- **Mniej testów:** najpierw zbuduj wszystko, testuj raz na końcu. Uruchamiasz:
  - swój test;
  - `okolice_szkielet_test` (kolizje);
  - testy plików, które zmieniasz (B: `humans_test`, `dog_test`, `hunting_test`, `zwierzeta_ludzie_test`).
- Pełna seria (`tests/run.js full`) **tylko za zgodą użytkownika**.
- **Każdy test paczki sprawdza co najmniej:**
  1. wtyczki ładują się bez błędów w konsoli;
  2. każde wstawione zdarzenie stoi na polu z planu i ma numer z zakresu paczki;
  3. główna mechanika każdej rzeczy działa (po jednym sprawdzeniu na rzecz);
  4. braki dają dymek, nie okno wiadomości (`kit` łapie `pushLootPopup`);
  5. wiersze F9 teleportują na miejsce;
  6. zapis i wczytanie zachowują stan paczki.

### 3.7 Współpraca między paczkami (jedyne zależności)

| kto | od kogo | co | jak bez czekania |
|---|---|---|---|
| C (handlarz sprzedaje) | B | Bryła soli 200 | numer z `OkoliceData.ITEMS`; przedmiot istnieje od pakietu 0 jako rezerwa, nazwę daje B |
| C (handlarz skupuje) | A, B, D | 185, 190–192, 201, 203, 230 | ceny w `Ludzie_Data`; brak wpisu = nie skupuje |
| B (obóz bandytów przy mielerzu) | C | `Ludzie.mielerzBurning()` | `T.call("Ludzie","mielerzBurning")`, a gdy go brak, `false` |
| D (kapliczki, odkrycia) | – | – | samodzielne |
| A (studnia) | A | Blok kamienny 188 | własny |
| C (jaskinia) | D | skrytka „tylko z orła” na Map125 z drugą skrzynią przemytu | D zostawia zdarzenie z `T.call("Ludzie","stashFound")`, gdy go brak, zwykły łup |
| wszyscy | pakiet 0 | `Okolice.discover`, `f9.add`, `blank`, `hot` | gotowe przed startem |

Flagi tylko własne, z przedrostkiem paczki. Nowych flag wspólnych (`Wyspa.setFlag`) nie wymyślamy bez koordynatora. Wyjątki są wymienione przy rzeczach (np. `kronikaKarta*` **nie** ruszamy).

### 3.8 Indeks miejsc według map (wszystkie pola sprawdzone 2026-10-21)
Paczka nie przesuwa swojej rzeczy o więcej niż 2 pola bez wpisu w `docs/rozszerzenia/<paczka>.md`. Test kolizji i tak wyłapie nakładanie.

| mapa (nowy teren od) | rzeczy (paczka) |
|---|---|
| 3 Domek (x≥40 lub y≥30, region 9) | zagroda x 39–47 y 49–53 (A); ule (66,38) (76,48) (62,55) (A); postój handlarza x 59–62 y 9–11 (C) |
| 4 Łąka | koszar x 50–54 y 40–43, pastwisko x 43–49 y 44–49 (C); lizawka (73,51), zasiadka (70,53) (B); kapliczka x 66–67 y 6–7 (D); postój x 59–62 y 10–11 (C). Strażnik Homes 705 w (27,58), nie ruszać |
| 8 Okolice Tawerny (x≥52 lub y≥69) | pola x 5–12 y 76–79, x 5–12 y 82–85, x 31–38 y 74–78 (A); cmentarz x 80–87 y 12–17, szubienica x 93–95 y 54–56 (D) |
| 13 Góry (x≥60 lub y≥48) | źródło x 109–111 y 77–78, ściana ciosowa x 107–112 y 80–82, żyły (114–115,78) (104–105,88) (111–112,87) (A); gawra x 99–100 y 45–47 (B); obóz kopaczy x 97–104 y 70–75, szyb (105,71) (C); strażnica x 79–84 y 20–25, lądowiska x 99–102 y 38–41 i x 33–36 y 73–76 (D). Przejścia Wyspy 696–698 w (119,11–13) |
| 17 Omszała łąka | źródło x 70–72 y 54–55, kręgi grzybów (54,44) i (63,44) r=3, polanka Jagny x 65–69 y 12–14, Jagna (67,15) (A); kopiec x 50–51 y 36–37 (D); owca K64: (40,40) (60,38) (72,30) (C) |
| 18 Łąka menhirów | krąg menhirów (53,45) r=4, Strażnik (50,42), płyta (53,45), dół (52,43) (D); pastwisko x 65–71 y 29–33 (C) |
| 21 Leśna droga | źródło x 23–25 y 42–43 (A); obóz rabusiów x 58–63 y 39–43, błotnisko x 65–68 y 46–48 (B); mielerz x 48–50 y 17–19, szałas x 52–54 y 20–21, postój x 54–55 y 16–17, juk (55,12) (61,11) (67,8) (C); kapliczka x 58–59 y 12–13 (D) |
| 22 Polna droga | postój handlarza x 49–54 y 19–22 (C); kapliczka przydrożna x 72–73 y 16–17, strażnica x 71–76 y 36–41 (D) |
| 23 Skraj lasu | nora x 64–66 y 49–50 i Szary Kieł (66,51), obóz CzO x 64–69 y 18–22 (B); kopiec x 58–59 y 51–52 (D) |
| 24 Posiadłość Lorda | wyłom (7–8,29) (pakiet 0 + B); zwierzyniec: cała nowa część, leśniczówka x 59–63 y 2–4, paśnik x 59–60 y 22, sidła (20,46) (45,38) (66,12), patrol gajowego (13,40) (30,50) (53,45) (71,20) (61,5) (B) |
| 111 Podgrodzie | ogródki x 55–58 y 10–12, x 60–63 y 10–12, x 65–68 y 8–10; wysypisko x 50–55 y 23–26; glinianka x 54–58 y 36–39 (A) |
| 120 Osada Milczących | gaj x 53–61 y 51–57, krąg kamieni r=3 wokół (57,54) (D) |
| 125 Przystań | zatoczka x 15–19 y 65–67 (pakiet 0); kałuże (15,65) (15,67), drewno (17,66) (18,65) (A); wylot jaskini (16–17,64) (C); lądowiska x 97–100 y 44–47 i x 105–108 y 30–33, kołki (81,63)→(81,68) i (109,24)→(109,21) (D). Przejścia Wyspy 693–695 w (21–23,79) |
| 155 Pustelnia | źródło x 58–60 y 66–67, drewno (3,52) (3,56) (4,60) (A); kopiec x 70–71 y 40–41, kruki (68,26) (76,47) (92,66), zioła z klifu (1,54) (2,66) (73,2) (D) |
| 157 Urwisko | strażnica x 94–99 y 52–57, kruki (76,21) (78,37) (81,39), zioła z klifu (62,1) (72,5) (100,5) (D) |
| 159 Przylądek | patrol (53,45)→(70,40)→(80,53)→(60,61)→(50,70) (C) |
| 162 Garnizon | strzelnica x 73–84 y 50–54, tarcze (79,51) (81,53) (83,51) (B); patrol (60,45)→(91,45)→(95,65)→(65,70) (C); drewno (2,47) (2,50) (2,62) (A) |
| 165 Wrak | płycizny P1–P3 (pakiet 0); kawałki (47,24) (62,18) (71,24) (D) |
| 168 Spalona zagroda | źródło x 45–47 y 54–55, sad x 60–71 y 20–24 (A); zbłąkane zwierzęta x 72–95 y 18–35, start x 84–86 y 28–30 (B); groby Ługów x 88–90 y 26–27 (C); lądowisko x 51–54 y 24–27, kołki (54,24)→(54,20) (D). Krzyż Jana Ługa (34,5) należy do Homes |
| 175 Orla Grań | grzędy x 67–69 y 11–13, y 24–26, y 43–45 (D). Zejście Orła 520–522 w (19–21,59) |
| 20 Dom dziadka (podwórze) | celowo bez nowych rzeczy |

---

## 4. Paczka A: „Woda i zasoby”

Wtyczki `Zasoby_Data.js` / `Zasoby.js`, zdarzenia 2100–2299, mieszkaniec 2900 (`jagna`), przedmioty 185–199, ikony 464–479, przełączniki 21–22, zadania K55–K58, D30–D31, test `tests/zasoby_test.js` (9551).

### A1. Źródełka (5 ukrytych, każde „na kilka map”)

| klucz | mapa | obszar | samo źródło | wskazówka w terenie |
|---|---|---|---|---|
| `zrodlo_017` | Map017 Omszała łąka | x 70–72, y 54–55 | (71,54) | gęsty las na południowym wschodzie, mokry mech |
| `zrodlo_021` | Map021 Leśna droga | x 23–25, y 42–43 | (24,42) | las na południowym zachodzie, rechot żab o zmierzchu |
| `zrodlo_013` | Map013 Góry | x 109–111, y 77–78 | (110,77) | pod skałą przy południowo-wschodnich ścianach |
| `zrodlo_155` | Map155 Pustelnia | x 58–60, y 66–67 | (59,66) | sosnowy gąszcz na południu, daleko od morza |
| `zrodlo_168` | Map168 Spalona zagroda | x 45–47, y 54–55 | (46,54) | zarośla na południu, „stare źródło Ługów” |

**Działanie:**
- Zdarzenie `!$Zas_Zrodlo` (kamienna misa, cienka strużka) w trzech wyglądach: pełne, niskie, suche. Kamienie wokół jako zdarzenia bez kolizji (pola z obszaru).
- **Porcje na dzień** (stan `zasoby.springs[klucz] = {day, used}`):

| warunek | porcje |
|---|---|
| wiosna, jesień | 2 |
| lato | 1 |
| zima | 1 |
| po deszczu (dziś albo wczoraj) | +1, najwyżej 3 |
| `Okolice.hot(d)` (lato i 6+ dni bez deszczu) | 0 |
| `Okolice.drought(d)` (10+ dni bez deszczu) | 0 |
| śnieg dziś | 0 („zamarzło”) |

- Menu jak czerpak Cysterny: `wellEntries()` (napij się, bukłak, konewka, wiadro). Każda czynność zabiera jedną porcję.
- Puste źródło daje dymek `need`: „Ledwie wilgotny mech. Woda wróci po deszczu.” / „Lód. Trzeba poczekać na odwilż.”
- **Odkrycie:** pierwsze podejście (pole w promieniu 1) wywołuje `Okolice.discover("zrodlo_…")` (25 PD).
- Nie ma znacznika na minimapie przed odkryciem i nie ma zadania, które prowadzi do źródła (zasada QUESTY.md:28). Po odkryciu jest wpis w „Okolicach” i można prowadzić kompasem.
- Pies (Dog), jeśli idzie za bohaterem, raz dziennie węszy w stronę nieodkrytego źródła w promieniu 12 pól (dymek „Pies węszy w gąszczu…”). Tylko przez `Dog` API odczytu. Jeśli API nie wystarczy, pomijamy.

**Systemy:** `Farming_parts.plots.wellEntries` (wzór Cysterna), `Survival.weatherPlan`, `Okolice.hot/drought/rainOn`, `Atmosphere` (dźwięk żab: `Tawerna.audio.se`), Journal przez Okolice.

**Grafika:** `!$Zas_Zrodlo` (3 stany, ok. 6 generacji).

**Teksty:**
- pierwsze znalezienie: „Spod kamieni sączy się czysta woda. Ktoś kiedyś obłożył to miejsce kamieniami.”
- dziennik: „Źródełko (Omszała łąka): daje wodę kilka razy na dzień; w upał wysycha.”

### A2. Opuszczona zagroda sąsiada z suchą studnią (Map003, region 9)

| klucz | obszar | co |
|---|---|---|
| `zagroda_chata` | x 40–44, y 49–51 (stopa obrazka (42,51)) | ruina chaty `!$Zas_Ruina` 5×3, prosto z przodu, zawalony dach; `<Occupy:left=2,right=2,up=2>` |
| `zagroda_ogrodek` | x 44–46, y 52–53 | zdziczały ogródek (chwasty) |
| `zagroda_studnia` | (47,53) | studnia `!$Zas_Studnia` (3 stany) |
| `zagroda_plot` | x 39, y 49–52 | resztki płotu (bez kolizji) |

Losowy krzak Farming na (44,50) znika pod zdarzeniem chaty.

**Działanie:**
- **Chata:** „Przeszukaj” (raz).
  - List sąsiada Wojciecha Rzepki: „Ziemia nie rodzi, studnia wyschła, idę do miasta…”, wpis do dziennika.
  - Do tego Lina 93 ×1 i Gwoździe 88 ×4.
  - Odkrycie `zagroda`.
- **Ogródek:** „Wypiel” (motyka 66, 6 uderzeń). Daje 2–4 dzikie warzywa (71/72), a w połowie przypadków nasiona (67/68). Odrasta po 12 dniach.
- **Studnia, etapy** (wzór Homes `well()/strike()`, `Durability.use`):
  1. **Zasypana:** „Oczyść” łopatą 62, 12 uderzeń. Daje Złom 193 („zardzewiałe wiadro”).
  2. **Pusta cembrowina:** „Napraw” za 4 × Blok kamienny 188, 2 × Lina 93, 2 × Deski 80; młotek 89, 15 uderzeń.
  3. **Studnia deszczowa:**
     - zbiera tylko deszcz: +1 porcja na każde 2 godziny deszczu (`Farming.rainHoursBetween`), najwyżej 4;
     - w dni `hot` traci 1;
     - zimą przy śniegu zamarza;
     - menu jak A1.
- Brak narzędzia albo materiału: dymek `need` (np. „Potrzebna łopata.”, „Brakuje: Blok kamienny ×2.”).

**Zadanie K57 „Studnia sąsiada”**
- Daje dziadek (Map019).
- Rozmowa: „Za lasem stała zagroda Rzepków. Studnia im wyschła… może dałoby się ją wzmocnić na deszczówkę.”
- Kroki: znajdź zagrodę → oczyść studnię → przynieś bloki → napraw.
- Nagroda: 60 PD i notatka.
- **Woda nie jest nagrodą.** Studnia zbiera tylko to, co spadnie z nieba (zgodnie z zasadą suszy).

**Systemy:** Homes (wzór etapów), Farming (`rainHoursBetween`, `wellEntries`), Durability, Journal.

**Grafika:** ruina (ok. 10 generacji), studnia 3 stany (ok. 6), ogródek (przemalowanie, 0–2).

### A3. Dzikie ule (Map003)

| klucz | pole | drzewo obok |
|---|---|---|
| `ul_1` | (66,38) | sosna (67,38) |
| `ul_2` | (76,48) | sosna (75,48) |
| `ul_3` | (62,55) | sosna (61,55) |

**Działanie:**
- Zdarzenie `!$Zas_DzikiUl` (dziupla z plastrem, roj nad nią w lecie), bez kolizji z drzewem.
- **Plony** (stan `zasoby.hives[klucz] = dzień`, co 4 dni):
  - lato i jesień: Miód 76 ×1–2 + Wosk 185 ×1;
  - wiosna: Miód ×1;
  - zima: nic („Pszczoły śpią w głębi pnia.”).
- Potrzebny **nóż** (90/91); bez niego dymek `need`.
- **Bez dymu** (bez zapalonej pochodni w ręce, `Torch` API, i bez ognia w promieniu 3):
  - 70% szans na użądlenie: wytrzymałość −20 i premia-kara `uzadlenie` (2 h, `cost: 1.15`, `bad: true`);
  - zostaje tylko 1 miód.
- Z dymem: bez użądleń.
- Odkrycie `dzikie_ule` przy pierwszym.

**Zadanie K55 „Świece dla dzwonnika”**
- Daje dzwonnik (klucz `dzwonnik`, Map008).
- 4 × Wosk 185. Nagroda: 30 G, Opinia +2, 50 PD.

**Zlecenie QuestBoard `zas_dziki_miod`:** Miód 76 ×2–4, zleca `melia` (miód pitny).

**Grafika:** `!$Zas_DzikiUl` (ok. 4). Ikona Wosk 185.

### A4. Kręgi grzybów po deszczu (Map017)

| klucz | środek | promień | 8 pól kręgu |
|---|---|---|---|
| `grzyby_krag1` | (54,44) | 3 | (54,41) (56,42) (57,44) (56,46) (54,47) (52,46) (51,44) (52,42) |
| `grzyby_krag2` | (63,44) | 3 | (63,41) (65,42) (66,44) (65,46) (63,47) (61,46) (60,44) (61,42) |

**Działanie:**
- W porach 0–2, gdy padało dziś albo wczoraj (`Okolice.rainOn`), od 5:00 pojawia się krąg 8 grzybów.
- Grzyby to zdarzenia `!$Zas_Grzyb` w wariantach z istniejącej grafiki Winlu, 0 generacji. Każdy daje Grzyby 103 ×1.
- Krąg znika w dniu d+2 o 6:00 albo po zebraniu.
- **Nocą (21–4)** wejście na środek kręgu: mgła (`Mood` w zasięgu mapy), szept (SE) i odkrycie „Czarci krąg”. Jagna to komentuje (A5).
- W dniu z kręgiem pola kręgu są zajęte przez zdarzenia, więc losowe zbieractwo Farming ich nie dotyka.

**Systemy:** `Okolice.rainOn`, Farming (przedmiot), Mood (mgła, przez API efektu, bez zmian w pliku), Journal.

### A5. Ciche miejsce zielarki i Babka Jagna (Map017)

| klucz | gdzie | co |
|---|---|---|
| `ziola_jagny` | x 65–69, y 12–14 | polanka z rzadkimi ziołami: 3 kępy w (66,12), (68,13), (66,14) |
| `jagna_miejsce` | (67,15) | Jagna stoi przy polance |

**Działanie:**
- **Zioła** (zdarzenia `!$Zas_Ziolo` ×3):

| zioło | pory roku | odrasta po |
|---|---|---|
| Arcydzięgiel 190 | lato, jesień | 6 dniach |
| Dziurawiec 191 | tylko lato | 5 dniach |
| Kozłek 192 | wiosna, lato, jesień | 7 dniach |

- Przed D30 zerwanie zioła, gdy Jagna jest na mapie, daje dymek „Nie twoje, chłopcze.” i zaufanie −1. Bez niej zioło można zerwać, ale Jagna to zauważy (zaufanie −2 przy następnej rozmowie).
- **Babka Jagna** (TownLife 2900, `map: 17`):
  - plan: 5–10 przy polance (tylko w dni bez deszczu, kiedy jest rosa), potem `away`;
  - zmierzch 18–20 w dni po deszczu przy kręgu grzybów;
  - nie mieszka na Map023 (punkt 1).
  - Postać PixelLab w stylu bohatera: stara kobieta, chusta, kosz z ziołami. Popiersie `Jagna_Bust` (kit.py).
  - Rozmowa: `addTalkHook(fn, true)`.
- **Przepisy po D30** (dopisane w czasie ładowania do „Wytwórz…” / kociołka):
  - Maść szczepiarska 195 = Mokra glina 164 + Wosk 185 (ręcznie);
  - Napar z kozłka 196 = Kozłek 192 + woda 1 porcja z wiadra (kociołek). Daje premię `gleboki_sen`: pierwszy sen po wypiciu daje +20% odpoczynku. Wyliczane przez `Survival` / Needs hook, bez zmian w plikach; jeśli się nie da, zgłosić.

**Zadanie D30 „Zioła Jagny”** (daje Jagna, przy polance):
- przynieś po 1 z rzadkich ziół zebranych **poza** jej polanką;
- źródła: orle zioła D (228/229) albo jej polanka po pozwoleniu, w trzech porach;
- kroki: arcydzięgiel → dziurawiec → kozłek („z ręki, nie z ziemi”).
- Nagroda: oba przepisy, 120 PD, zgoda na zbiór z polanki (1 z każdej kępy na odrost).

**Zlecenie `zas_ziola_rzadkie`:** (giver `jagna`) 190–192 ×1–2.

**Grafika:** Jagna (ok. 35), zioła ×3 (ok. 6), ikony 190–192, 195, 196.

### A6. Podgrodzie (Map111): ogródki, wysypisko, glinianka

| klucz | obszar | co |
|---|---|---|
| `ogrodek_1` | x 55–58, y 10–12 | grządki (właścicielka: praczka) |
| `ogrodek_2` | x 60–63, y 10–12 | grządki (Franek) |
| `ogrodek_3` | x 65–68, y 8–10 | grządki (znachorka) |
| `wysypisko` | x 50–55, y 23–26 | kupa śmieci `!$Zas_Wysypisko` |
| `glinianka` | x 54–58, y 36–39 | dół z gliną `!$Zas_Glinianka` |

**Ogródki:**
- Grządki z uprawami wg pory roku: zdarzenia z obrazkami upraw z Farming, 0 generacji.
- Raz dziennie 6–12 „Pomóż przy grządkach” (motyka, 8 uderzeń) daje 2 warzywa (71/72/73 wg pory) i Opinię +1.
- **Kradzież nocą:** +3 warzywa. Jeśli ktoś z mieszkańców Podgrodzia stoi w promieniu 8 pól (TownLife `eventOf`), Opinia −5 i dymek „Ktoś cię widział!”.
- **Podlewanie nie wchodzi w grę** (oszczędzamy wodę).

**Wysypisko:**
- „Grzeb” rękami albo łopatą (łopata: +1 losowanie). Bohater może grzebać raz dziennie, wysypisko ma 4 losowania dziennie.
- Łup:

| przedmiot | szansa |
|---|---|
| Złom 193 | 30% |
| Włókno 92 | 25% |
| Gwoździe 88 | 15% |
| Deski 80 | 10% |
| Moneta 194 | 8% |
| nic („Same skorupy.”) | 12% |

- Wysypisko z dokładnością do dnia trzyma `zasoby.dump`.

**Glinianka:**
- „Kop glinę” łopatą daje Mokra glina 164 ×2, najwyżej 6 dziennie z całej glinianki.
- Po deszczu na dnie stoi woda. Próba napicia: dymek `need` „Mętna, z gliną. Tego się nie pije.”

**Zadanie D31 „Skarby wysypiska”** (daje szmaciarz, klucz `szmaciarz`, Map111):
- znajdź na wysypisku trzy rzeczy z jego listy: medalik (zdarzenie ukryte w kupie), klucz, „coś z kruczym znakiem”;
- trzecia rzecz to zwykła moneta z krukiem, czyli wątek do D (lore), a nie karta.
- Nagroda: 40 G, Opinia +3, 100 PD.

**Zadanie K56 „Ogródki Podgrodzia”** (daje znachorka): 3 dni pomocy przy grządkach w ciągu tygodnia. Nagroda: 25 G, 3 × Zioła 104, Opinia +2.

**Zlecenie na glinę:** wzór `clay` już jest, więc nie dublujemy.

**Grafika:** wysypisko (ok. 4), glinianka (ok. 4), ikony 193, 194.

### A7. Góry (Map013): kamieniołom bloków i żyły rudy

| klucz | obszar | co |
|---|---|---|
| `kamieniolom_bloki` | x 107–112, y 80–82 | „Ściana ciosowa”: 3 zdarzenia `!$Zas_ScianaCiosowa` po 2 pola |
| `zyla_1` | x 114–115, y 78 | żyła `!$Rock_Ore_Iron_Cluster` |
| `zyla_2` | x 104–105, y 88 | żyła `!$Rock_Ore_Iron_Twin` |
| `zyla_3` | x 111–112, y 87 | żyła `!$Rock_Ore_Iron_Jagged` |

Krzak Farming na (111,87) znika pod zdarzeniem.

**Ściana ciosowa:**
- 6 bloków na 7 dni (stan); przy pustej ścianie dymek „Ściana na razie wybrana. Wróć za kilka dni.”
- Jeden blok: kilof 63/116, 10 uderzeń (żelazny 6), daje Blok kamienny 188 (`<Weight:6>`).
- Odkrycie „Ściana ciosowa”.

**Żyły:**
- Własna lista komend (nie domyślne `mine`).
- Działają jak `ROCK_PROFILES` (Ruda 85 ×1–5), ale **odrastają co 7 dni**: własny reset samoprzełączników przy `Game_Map.setup`, jeśli bohatera nie ma na mapie (wzór Forestry).

**Zadanie K58 jest w A9.** Bloki potrzebne są w K57.

**Zlecenie `zas_bloki`:** Blok 188 ×2–4, zleca `kazimierz` (budowy dworu).

**Grafika:** ściana (ok. 4), ikona 188.

### A8. Wybrzeże: kraby w kałużach i drewno wyrzucone przez morze

| klucz | mapa | pola | co |
|---|---|---|---|
| `kaluza_1` | Map125 | (15,65) | kałuża pływowa w zatoczce (pakiet 0) |
| `kaluza_2` | Map125 | (15,67) | kałuża pływowa |
| `drewno_125` | Map125 | (17,66), (18,65) | miejsca na drewno dryfowe |
| `drewno_155` | Map155 | (3,52), (3,56), (4,60) | brzeg pod pustelnią |
| `drewno_162` | Map162 | (2,47), (2,50), (2,62) | brzeg pod garnizonem |

**Kraby:**
- W odpływie (`Wyspa.tide().low`) widać kałuże `!$Zas_Kaluza` i w każdej 1–2 kraby `!$Zas_Krab` (mały, 2 klatki).
- „Złap kraba”: 65% szans (+15% z perkiem `sneak`). Porażka: „Szczypie!” i wytrzymałość −5.
- Na każdą kałużę i każdy odpływ przypadają najwyżej 2 kraby.
- Surowy krab 186: psuje się po 24 h (`FoodTable.LIFE[186] = 24`), nie jest jadalny na surowo.
- Pieczony krab 187: `stamina 18, fed 20, spoil 48`. Przepis na ognisku (`BUILDINGS.campfire.recipes.push`).

**Drewno dryfowe:**
- Po każdym końcu sztormu (`stormEnd`) i raz na dobę w przypływie pojawia się 1–2 sztuki na losowych polach danej mapy.
- Ręką: Drewno dryfowe 189 (`<Weight:2>`).
- Warsztat (ręcznie) „Rozłup” daje Drewno 61 ×2. To zwykły opał: Bazyli i garnizon skupują drewno jak dotąd, bez zmian w ich wtyczkach.
- Na morzu nie ma wody do picia; nic tu nie daje wody.

**Systemy:** `Wyspa.tide/forceTide`, przełącznik 20, Storm (`stormEnd`), Farming (`BUILDINGS`, `FoodTable`), Spoilage.

**Zlecenie `zas_kraby`:** Pieczony krab 187 ×2–3, zleca `borgar`.

**Grafika:** kałuża (ok. 3), krab (ok. 6), drewno (ok. 3), ikony 186, 187, 189.

### A9. Spalony sad do odratowania (Map168)
- `sad_spalony`: obszar x 60–71, y 20–24, osiem drzew `!$Zas_SadSpalony` w polach (61,21), (64,21), (67,21), (70,21), (61,24), (64,24), (67,24), (70,24).

**Działanie.** Każde drzewo przechodzi te etapy (stan `zasoby.orchard[i]`):
1. **Przytnij spalone** nożycami 142 albo siekierą, 4 uderzenia. Daje Węgiel 79 ×1.
2. **Opatrz rany:** Maść szczepiarska 195.
3. **Podlej** w trzech różnych dniach, konewką 87, po jednej porcji z konewki. Konewkę napełnia się ze swoich źródeł wody, więc susza ma tu znaczenie.

Potem:
- po 10 dniach liście;
- następnej wiosny kwiat;
- latem i jesienią Dzikie jabłka 139 ×2–3 co 5 dni.

Owoce liczy własna logika A. Bez `fruit=` z ChoppableTree, bo jego przełącznik C nadpisuje się co godzinę. Obrazek zmienia się w 4 krokach: spalone, przycięte, z liśćmi, kwitnące/owocujące.

**Zadanie K58 „Sad Ługów”**
- Daje Marta Ługowa (TownLife `praczka`, hak rozmowy po D21).
- Odratuj 8 drzew.
- Nagroda: 40 G, 120 PD, zaufanie Marty. Od tej pory sad rodzi także dla niej (Marta czasem stoi w sadzie w dni z owocami).

**Systemy:** Homes (D21, tylko odczyt stanu), TownLife, Durability, Farming (konewka).

**Grafika:** drzewo 4 stany (ok. 8), ikona 195.

### A10. Pola mieszczan (Map008)

| klucz | obszar |
|---|---|
| `pole_1` | x 5–12, y 76–79 |
| `pole_2` | x 5–12, y 82–85 |
| `pole_3` | x 31–38, y 74–78 |

**Działanie:**
- Pola z uprawami wg pory: obrazki z Farming, zdarzenia bez kolizji w rzędach.
- **Dniówka:**
  - wiosna, dni 1–10 pory: siew;
  - jesień, dni 1–14: żniwa;
  - 6–14, w polu 20 uderzeń kosztem wytrzymałości;
  - zapłata 15 G + 2 plony (74 jęczmień / 73 kapusta / 71 ziemniaki), Opinia +1;
  - najwyżej raz dziennie.
- **Kradzież:** Opinia −4.
- Map008 nie ma wolnych numerów 951–959, więc zadań przy polach nie ma (tylko dniówka z menu zdarzenia).

**Grafika:** 0 generacji (obrazki upraw z Farming).

### A: podsumowanie
- **Odkrycia:** 5 źródeł, zagroda, dzikie ule, 2 czarcie kręgi, polanka Jagny, wysypisko, glinianka, ściana ciosowa, zatoczka, sad. Razem 14.
- **F9:**
  - teleport do każdej rzeczy;
  - „deszcz wczoraj”, „upał”, „odpływ / przypływ”;
  - „sztorm się skończył”;
  - „studnia etap N”, „sad etap N”;
  - „Jagna: D30 krok N”.

---

## 5. Paczka B: „Zwierzęta i łowy”

Wtyczki `Lowy_Data.js` / `Lowy.js`, zdarzenia 2300–2499, mieszkaniec 2905 (`gajowy`), przedmioty 200–209, ikony 480–495, przełączniki 23–24, zadania K59–K62, D32–D33, test `tests/lowy_test.js` (9552).

**Wyjątki:**
- `Humans.js`: blok `fixedCamp`;
- `Dog.js`: filtr `_noDog`.

### B1. Wilcza nora (Map023), miejsce Szarego Kła
- `nora_wilcza`: x 64–66, y 49–50. Gęsty las na południu, daleko od dróg.
- Obrazek `!$Low_Nora` (korzenie, jama), `<Occupy>` na 3×2.
- Strefa nory to promień 6 pól.

**Działanie:**
- **Za dnia** (5–20) przy norze odpoczywa wataha:
  - przewodnik „Szary Kieł”, czyli list gończy `szary_kiel` (`QuestBoard.spawnBounty("b_szary_kiel", [66,51])`, jeśli zlecenie jest aktywne; pole sprawdzone, wolne);
  - 2 dorosłe: `Hunting.spawnPack`, `_summoned`, `_noClash` za dnia.
- **Wiosną i latem** dochodzą 2–3 szczenięta:
  - nowy gatunek `Hunting.SPECIES.wolfPup` (arkusz wilka, `_qbScale 0.55`);
  - bez `aggressive` i bez wpisu w `YIELD`, więc nie da się ich oprawić.
- **Nocą** wataha poluje normalnie (Hunting).
- **Wybór** (K59), stan `lowy.den`:
  - **Rozbić watahę:** zabić przewodnika i dorosłych. Szczenięta uciekają w gąszcz i znikają („Szczenięta uciekły w gąszcz.”). Nora jest pusta przez 28 dni. Zlecenie Szarego Kła się zalicza.
  - **Zostawić szczenięta:** w trzech różnych dniach zostawić przy norze surowe mięso (tobołek Drops w promieniu 3 pól, 94/157/159/161). Potem:
    - wataha spod nory jest „oswojona”: jej wilki nie atakują bohatera na mapach 21/23 (flaga na zwierzętach, czytana przez hak w `Lowy.js` owijający wybór celu Hunting_AI przez API; jeśli API nie wystarczy, zgłosić);
    - Starcia samo każe jej krążyć wokół obozu bandytów w promieniu 26 pól;
    - raz w tygodniu przy norze leży zając („dar watahy”: `Hunting.dropCarcass`).
- Odkrycie `nora` (podejście na 8 pól, za dnia).

**Zadanie K59 „Nora pod korzeniami”**
- Daje łowczy Bogdan (QuestBoard `bogdan`, TownQuests) albo samo, gdy wejdziesz w strefę.
- Nagroda za rozbicie: 60 G, 120 PD, skóry. Za zostawienie: 150 PD, „dar watahy”.

**Grafika:** nora (ok. 4).

### B2. Gawra niedźwiedzia (Map013)

| klucz | pola | co |
|---|---|---|
| `gawra_wejscie` | x 99–100, y 45–46 | wylot gawry `!$Low_Gawra` na ścianie skały (pola nieprzechodnie) |
| `gawra_pole` | x 99–100, y 47 | przed wylotem; tu niedźwiedź ma `_home` |

Nad gawrą jest półka „tylko z orła” (D5, `orzel_013_a`).

**Działanie:**
- W porach 0–2 niedźwiedź `Hunting.spawn("bear", 99, 47)` (sam ustawia `_home`, `leash` 12) w godz. 4–22.
- Map013 ma `<Bear:0.12>`. Losowe niedźwiedzie zostają, ale B pilnuje, żeby był tylko jeden przy gawrze.
- **Zimą** śpi w środku: dźwięk chrapania w promieniu 6. „Zajrzyj” budzi go: wściekły, +20% obrażeń przez 60 s.
- Ubity daje Skórę 170 i Pazur 203. Gawra jest pusta do następnej wiosny.
- Odkrycie `gawra`.

**Zadanie D33 „Gawra pod granią”**
- Myśliwi Czarnych Oczu z obozu B5 (Map023) polują na niedźwiedzia dla skóry.
- Bohater wybiera:
  - pomóc: 80 G i informacja dla W8 (flaga `lowCzoPomoc`);
  - przegnać myśliwych i ochronić gawrę: Opinia +3, Kleofas i Bazyli komentują, niedźwiedź nie atakuje bohatera w promieniu gawry, jeśli ten nie biegnie.
- Wymaga Aktu II.

**Grafika:** gawra (ok. 4), ikona 203.

### B3. Błotnisko dzików (Map021), miejsce Czarnego Ryja
- `blotnisko`: x 65–68, y 46–48. Błoto `!$Low_Bloto`: zdarzenia płaskie, przechodnie, pod bohaterem.

**Działanie:**
- 5–9 i 17–21 przychodzą 2–3 dziki. `_goal` na błotnisko (Starcia) i `_noClash`, bo obóz bandytów B5 jest 6 pól dalej.
- Kiedy zlecenie Czarnego Ryja jest aktywne, jest on przy błotnie: `QuestBoard.spawnBounty("b_czarny_ryj", [66,47])`.
- **Wejście bohatera w błoto** daje premię `ubloceny` na 2 h: zwierzęta zauważają go 30% później (mnożnik w haku na `Hunting.noticeRate`; jeśli brak API, przez perk `sneak` dopisany na czas premii).
- Każdy dzik z błotniska z 20% szans daje Kieł 202.
- Odkrycie `blotnisko`.

**Grafika:** błoto (ok. 3), ikona 202.

### B4. Lizawka (Map004)

| klucz | pole | co |
|---|---|---|
| `lizawka` | (73,51) | pieniek z wydrążeniem `!$Low_Lizawka` |
| `zasiadka` | (70,53) | zasłona z chrustu `!$Low_Zasiadka` |

**Działanie:**
- Lizawka działa 6 dni po położeniu Bryły soli 200 (kupno u handlarza C za 12 G albo u Rocha). Stan `lowy.lick.until`.
- Gdy działa, o świcie (5–8) i zmierzchu (18–21) w promieniu 9 pól pojawia się 1–3 jeleni. Mają `_goal` na lizawkę, liżą 20–40 s, mają `_noDog`.
- Bohater stojący w zasiadce ma zauważanie ×0,5 i szybsze celowanie (`aim.speed` +20%, tylko tam).
- **Poroże 201:**
  - wiosną raz na porę roku zrzucone poroże przy lizawce (zdarzenie);
  - z jelenia ubitego przy lizawce 20%.
- Odkrycie `lizawka`.

**Zadanie K60 „Sól dla jeleni”**
- Daje łowczy Bogdan.
- Połóż sól, poczekaj o świcie w zasiadce i przynieś 1 Poroże albo mięso jelenia.
- Nagroda: 40 G, 80 PD.

**Grafika:** lizawka i zasiadka (ok. 4), ikony 200, 201.

### B5. Stałe miejsca obozów (zlecenia z tablicy)

| klucz | mapa | obszar | kto |
|---|---|---|---|
| `oboz_bandytow` | Map021 | x 58–63, y 39–43 | rabusie (bandit, knifer, 2–4 ludzi) |
| `oboz_czo` | Map023 | x 64–69, y 18–22 | Myśliwi Czarnych Oczu: archer + bandit z wyglądem Archer/Captain, `name: "Myśliwy Czarnych Oczu"` |

Losowy krzak Farming na (68,19) znika pod zdarzeniem ogniska.

**Dopisek w `Humans.js`** (tylko B): `Humans.fixedCamp(mapId, {x, y, size, kinds, tag, day: bool, when: fn})`.
- Miejsce zastępuje losowy `campSpot` na tej mapie (jeden obóz na mapę zostaje).
- `day: true` pozwala na obóz za dnia (myśliwi).
- Ognisko i światło: jak `campHere()`.

**Działanie:**
- **Rabusie:** obóz stoi w nocy z aktywnym zleceniem `low_oboz_021` albo w 1 na 4 noce. W noce, gdy `Ludzie.mielerzBurning()`, idą pod mielerz (napad na Zbycha, C1).
- **Myśliwi CzO:** obóz stoi 6–20 w Akcie II, póki D33 jest nierozstrzygnięte. Ze skrzyni wypada Strzała z białym okiem 205.
- Zlecenia: `low_oboz_021` „Rozbij obóz rabusiów przy Leśnej drodze” (zleca `wit`) i `low_czo_023` „Przegnaj obcych myśliwych” (zleca `bogdan`). Kończą się na `campCleared` / `humansDone`.
- Do `QuestBoard.BEASTS` dopisać `bandit` i `bear` (rysunek w Art: przez API; jeśli brak, zgłosić).
- **Strzała 205:**
  - pokazana rotmistrzowi: przychylność garnizonu +5;
  - pokazana Kleofasowi: wpis „Strzały z białym okiem” (już istnieje u orła, więc tylko „Widziałem je też w lesie…”).

**Starcia:**
- Obóz rabusiów jest 6 pól od błotniska: dziki tam mają `_noClash`.
- Obóz CzO stoi ok. 30 pól od nory, czyli poza promieniem 26.

**Grafika:** 0 (namioty `!$Mt_Tent`, ognisko jak w Humans), ikona 205.

### B6. Zwierzyniec Lorda (Map024) z gajowym i wyłomem w żywopłocie

| klucz | gdzie | co |
|---|---|---|
| `wylom_zywoplot` | (7,29), (8,29) | kafle robi pakiet 0. B stawia zdarzenie dekoracji `!$Low_Wylom` (połamane gałęzie, przechodnie) i przy pierwszym przejściu dymek „Za żywopłotem: zwierzyniec Lorda. Tu poluje tylko dwór.” Odkrycie `zwierzyniec`. |
| `lesniczowka` | x 59–63, y 2–4 | chatka gajowego `!$Low_Lesniczowka` 4×3, prosto z przodu, stopa (61,4) |
| `pasnik` | x 59–60, y 22 | paśnik dla zwierzyny (zimą siano) |
| zwierzyniec | cała nowa część Map024 (x 0–78, y 30–57 i x 40–78, y 0–29) | jelenie 4–6, dziki 2: `Hunting.spawn`, `_summoned`, `_noDog`, tylko na polach tego obszaru |

**Gajowy**
- TownLife 2905 `gajowy`, `map: 24` (Map024 jest już domem strażnika 936, więc to bezpieczne).
- Proponowane imię: Gniewko Bór. Postać PixelLab w stylu bohatera: zielony kaftan, łuk, róg. Popiersie `Gajowy_Bust`.
- Plan:
  - 6–20 `patrol` po punktach (13,40) → (30,50) → (53,45) → (71,20) → (61,5);
  - nocą `inside` w leśniczówce (punkty jako `SPOTS_BY_MAP[24]`).
- Widzi na 7 pól (wzór `guardSees`, Dwor.js l. 418, z `Hunting.coverBetween`).

**Kłusownictwo** (stan `lowy.poach`):
- Zabicie zwierzęcia w zwierzyńcu bez Zezwolenia 204 jest przestępstwem w dwóch przypadkach:
  - gajowy widzi bohatera;
  - gajowy w ciągu 2 h trafi na ścierwo (zwłoki Hunting w zapisie).
- Kolejne razy:
  1. Grzywna 40 G. Jeśli bohater nie ma pieniędzy, gajowy zabiera mięso i skórę. Do tego Opinia −3.
  2. Grzywna 60 G.
  3. Gajowy zarasta wyłom cierniem: zdarzenie blokujące na 7 dni, przełącznik 23. Grzywna 80 G.
- Nigdy nie ma szubienicy ani końca gry. Szubienica D7 to tylko groźba w rozmowie.
- **Pies** z `_noDog` nie poluje w zwierzyńcu.

**Zadanie D32 „Gajowy i kłusownik”**
- Gajowy wie, że ktoś zastawia sidła w zwierzyńcu. To Rysiek Sidło (`$Npc_Klusownik`, Podgrodzie).
- 3 sidła do znalezienia (zdarzenia w (20,46), (45,38), (66,12)), potem zasadzka nocą.
- Wybór:
  - wydać Ryśka: przychylność dworu (flaga `lowWydalRyska`, Opinia +2);
  - ostrzec go: Opinia w Podgrodziu +3 i Rysiek odtąd sprzedaje tanio skóry.
- Nagroda w obu przypadkach: Zezwolenie na odstrzał 204, czyli 1 jeleń w tygodniu legalnie.

**Grafika:** gajowy (ok. 35), leśniczówka (ok. 6), wyłom (ok. 2), paśnik (ok. 2), ikona 204.

### B7. Zbłąkane zwierzęta z gospodarstwa (Map168)
- `zblakane_start`: x 84–86, y 28–30. Zwierzęta krążą w obszarze x 72–95, y 18–35.
- Zwierzęta: krowa „Krasula”, owca, 2 kury. To `RoamingActor` z arkuszami `$Animal_Cow/Sheep/Hen` (bez generacji).
- **Działanie:**
  - „Załóż powróz” zużywa 1 Linę 93 i zwierzę idzie za bohaterem;
  - kury łapie się ręką (50%, potem uciekają 3 pola).
  - Zwierzęta można odprowadzić:
    - do Marty, jeśli zagroda Ługów ma etap ≥ 3 (Homes, tylko odczyt);
    - albo do własnej zagrody bohatera: `Livestock.spawn` na wybieg właściwego rodzaju, kiedy jest.
- Odkrycie `zblakane`.

**Zadanie K62 „Krasula i kury Ługów”** (daje Marta po D21): odprowadź 4 zwierzęta. Nagroda: 30 G, 100 PD, Marta co tydzień daje Mleko 123 ×2.

### B8. Strzelnica żołnierzy (Map162)
- `strzelnica`: x 73–84, y 50–54.
  - linia strzału: x 73–74;
  - 3 tarcze `!$Low_Tarcza` w (79,51) (6 pól), (81,53) (8), (83,51) (10);
  - stojak z łukami w (73,50).
- **Działanie:**
  - Mini-gra na mapie: `Hunting.addTargets` + celowanie `Hunting.aim`. Strzały ćwiczebne nie zużywają Strzał 127.
  - Runda to 5 strzałów; środek 10, pierścień 5, brzeg 2 (odległość od środka tarczy w px).
  - Wymaga łuku 126; bez niego dymek `need` „Bez łuku ani rusz.”
  - 9–12 ćwiczą 2 żołnierze: zdarzenia z zakresu B z arkuszem `$Npc_Zolnierz`, okrzyki.
  - **Zawody** w dni `d % 7 === 3`, 10:00–12:00. Trzech rywali ma 24 / 30 / 36 pkt.
    - nagrody: 25 / 40 / 60 G i `Garnizon.addFavor(+3/+5/+8)`;
    - pierwsza wygrana daje Srebrną strzałę 206 (pamiątka).

**Zadanie K61 „Zawody strzeleckie”** (daje kwatermistrz, klucz `kwatermistrz`): pokonaj najlepszego. Nagroda: 50 G, 120 PD, przychylność +5.

**Grafika:** tarcza i stojak (ok. 4), ikona 206.

### B: podsumowanie
- **Odkrycia:** nora, gawra, błotnisko, lizawka, 2 obozy, zwierzyniec, zbłąkane zwierzęta, strzelnica. Razem 9.
- **F9:**
  - teleporty;
  - „postaw watahę / szczenięta”, „obudź niedźwiedzia”;
  - „sól na lizawce”, „świt”;
  - „obóz teraz”, „kłusownictwo N”, „zawody dziś”.

---

## 6. Paczka C: „Ludzie”

Wtyczki `Ludzie_Data.js` / `Ludzie.js`, zdarzenia 2500–2699, mieszkańcy 2910–2929, przedmioty 210–224, ikony 496–511, przełączniki 25–26, mapa **177**, zadania K63–K66, D34–D35, test `tests/ludzie_test.js` (9553).

### C1. Węglarz Zbych Smolarz i mielerz (Map021, przy drodze)

| klucz | obszar | co |
|---|---|---|
| `mielerz` | x 48–50, y 17–19 | mielerz `!$Lud_Mielerz` 3×3: zimny / tlący się (dym, w nocy żar = światło ognia) / gotowy |
| `szalas_wegl` | x 52–54, y 20–21 | szałas węglarza 3×2, prosto z przodu |

**Działanie:**
- Zbych (istniejący mieszkaniec 926 `drwal`) dostaje `alt` na Map021 w „dni mielerza”: cykl 6 dni, `d % 6 ∈ {2,3}`.
  - Dopisane w `Ludzie_Data.js` do `TownLifeData.RESIDENTS` (bez zmian w pliku TownLife_Data).
  - 6–20 przy mielerzu, nocą w szałasie.
- **Usługi:**
  - Węgiel 79 po 4 G (najwyżej 10 na wypał);
  - „Daj drewno”: Drewno 61 ×12 → Węgiel ×8 po wypale (2 dni).
- `Ludzie.mielerzBurning()` = mielerz się tli (dla B5).

**Zadanie K63 „Węgiel dla kowala”**
- Kowal (910) potrzebuje 10 węgla w 5 dni.
- Zbych prosi: 12 drewna i pilnowanie nocy wypału. W tę noc rabusie z B5 albo `Humans.ambush` 2 ludzi pod mielerzem.
- Nagroda: 40 G, Opinia +3, 100 PD, u kowala −10% na stal.

**Grafika:** mielerz 3 stany (ok. 8), szałas (ok. 4).

### C2. Pasterz z owcami (Map004, czasem Map018)

| klucz | mapa | obszar | co |
|---|---|---|---|
| `koszar` | Map004 | x 50–54, y 40–43 | koszar z wikliny `!$Lud_Koszar` (płot, nocą owce w środku) |
| `pastwisko` | Map004 | x 43–49, y 44–49 | strefa wypasu (2 pola z krzakami z generatora: owce je obchodzą) |
| `pastwisko_018` | Map018 | x 65–71, y 29–33 | wypas co trzeci dzień |

Krzak Farming na (47,49): obejście albo pusty znacznik.

**Pasterz:**
- TownLife 2910 `pasterz`, `map: 4`. Proponowane imię: Wawrzyn Owczarz. Postać PixelLab: kożuch, kij pasterski. Popiersie `Pasterz_Bust`.
- Plan:
  - 6 przy koszarze;
  - 7–18 `wander` na pastwisku;
  - 18:30 zagania;
  - noc w koszarze;
  - w dni `d % 3 === 2` `alt` na Map018 (8–17).
- **Owce:** 6 sztuk, `RoamingActor` z `$Animal_Sheep` i `Hunting.path8`, chodzą po swojej strefie. Nocą w koszarze, za płotem, więc wilki ich nie dostaną.
- **Handel:**
  - sprzedaje Wełnę 111 (5 G), Ser 124 (6 G), Mleko 123 (2 G), Wełniany koc 214 (25 G: przy odpoczynku na ziemi +10, wzór drabinki odpoczynku);
  - kupuje Bryłę soli 200 za 15 G.
- **Strzyżenie** wiosną (dni 10–20 pory): z nożycami 142 „Pomóż przy strzyży” daje Wełnę 111 ×3 + 10 G.

**Zadanie K64 „Zabłąkana owca”**
- Po sztormie brakuje owcy.
- Stoi w jednym z 3 miejsc na Map017: (40,40), (60,38), (72,30). Wyprowadzić ją (idzie za bohaterem) na Map004.
- Nagroda: Ser ×3, 30 G, 80 PD, u pasterza −20%.

**Grafika:** pasterz (ok. 35), koszar (ok. 4), ikona 214.

### C3. Wędrowny handlarz (drogi; postój na Polnej drodze)

| klucz | mapa | obszar | dzień cyklu `d % 4` |
|---|---|---|---|
| `postoj_handlarza` | Map022 | x 49–54, y 19–22 (wóz 3×2, ognisko, osioł jako dekoracja) | 0 (postój główny) |
| `postoj_021` | Map021 | x 54–55, y 16–17 | 1 |
| `postoj_004` | Map004 | x 59–62, y 10–11 | 2 |
| `postoj_003` | Map003 | x 59–62, y 9–11 | 3 |

**Handlarz:**
- TownLife 2911 `handlarz`, `when` + `alt` wg cyklu. Proponowane imię: Szymon Juczny. Postać PixelLab: płaszcz podróżny, juki. Popiersie `Handlarz_Bust`.
- 8–18 handel. Nocą 20–6 śpi przy ognisku (ognisko = światło ognia), wóz zostaje.
- **Sprzedaje** (rotacja 5 z listy wg hasha dnia):
  - Przyprawy 210 (8 G);
  - Mapa okolic 211 (60 G, raz): pokazuje w „Okolicach” wszystkie nieodkryte miejsca jako „?” z kompasem (wzór Mapy z zaznaczeniami 178 i `addTrackerSource`);
  - Bryła soli 200 (12 G), Lina 93 (6 G), Gwoździe 88 (2 G), Strzały 127 (1 G), nasiona 67–70 (3 G).
- **Skupuje** o 20% drożej niż w mieście: Skóra 96/97, Wełna 111, Miód 76, Wosk 185, zioła 190–192, Poroże 201, Pazur 203, Okucie 230.
- **Plotka:** raz na wizytę wskazuje jedno nieodkryte miejsce z „Okolic” (`Okolice.discoverable`). Wpis „?” z opisem drogi.
- Ekran handlu: listy wyborów wzorem `Kantor.shopList / buy` i `Garnizon.sell`.

**Zadanie K65 „Zgubiony juk”**
- Na Leśnej drodze (Map021) z wozu spadł juk. Leży w jednym z 3 miejsc przy drodze: (55,12), (61,11), (67,8).
- Trzeba go przynieść, zanim rabusie z B5 rozbiją obóz (do 2 nocy).
- Nagroda: 25 G, u handlarza stale −10%.

**Grafika:** handlarz (ok. 35), wóz (ok. 6), ikony 210, 211.

### C4. Patrole (Map159 i Map162)
- `patrol_latarnia_1` / `_2`: TownLife 2912 i 2913 (para, drugi idzie 1 pole za pierwszym), `map: 159`, `$Npc_Zolnierz`. Pętla `patrol`: (53,45) → (70,40) → (80,53) → (60,61) → (50,70), godz. 7–19.
- `patrol_garnizon_1` / `_2`: TownLife 2914 i 2915, `map: 162`. Pętla: (60,45) → (91,45) → (95,65) → (65,70), godz. 7–19.
- Punkty jako `SPOTS_BY_MAP`. Map159 i 162 to domy latarnika i garnizonu, więc mieszkańcy z `map: 159/162` są bezpieczni.
- **Działanie:**
  - Okrzyki o rabusiach i „obcych z białym okiem”.
  - Przy przychylności garnizonu < 10 patrol przeszukuje torbę jak `patrolWanted` (przez `Garnizon` API; jeśli go brak, tylko okrzyk).
  - **Wieczorem 19–21** wracają: dalej TownLife.

**Zadanie K66 „Nocny patrol”**
- Daje rotmistrz (945).
- Idziesz z patrolem nocą 21–24 po Map159. Przy (70,40) `Humans.ambush(["bandit","bandit","knifer"])`.
- Nagroda: 30 G, przychylność +5, 100 PD.

**Grafika:** 0.

### C5. Obóz kopaczy Czarnych Oczu (Map013, wątek W8)
- `oboz_kopaczy`: x 97–104, y 70–75.
  - namioty `!$Mt_Tent` ×2, skrzynie;
  - „Szyb poszukiwawczy” `!$Lud_Szyb` na ścianie skały w (105,71) (pole ściany, nieprzechodnie; wchodzi się z (105,72)).
- Krzak Farming na (98,70) znika pod zdarzeniem.
- **Działanie:**
  - Obóz istnieje od rozdziału W8 z Markiem (warunek przez stan W8 w TownQuests, tylko odczyt) do rozstrzygnięcia D35.
  - 3–4 kopaczy: Humans `name: "Kopacz Czarnych Oczu"`, wygląd Merc, `mode: "sit"` / `"roam"`.
  - Skradanie: w nocy śpią.

**Zadanie D35 „Szyb pod Orlą Granią”** (wątek W8, daje Grum przez hak W8 albo samo przy obozie)
1. Podkradnij się i zabierz Dziennik kopacza 213 (skrzynia przy (101,73)): „Kopią ku piętru pięćdziesiątemu od góry…”
2. Wybór:
   - **zasyp szyb:** Lina 93 + piła 118, „podetnij stemple”, 6 uderzeń; kopacze odchodzą;
   - **zawiadom Gruma** (W8 dostaje flagę `ludSzyb`);
   - **powiedz rotmistrzowi:** przychylność +8, żołnierze rozbijają obóz.
- Nagroda: 150 PD i wpis.

**Grafika:** szyb (ok. 4), ikona 213.

### C6. Jaskinia przemytników Baltazara (Map125 → Map177, wątek W5)
- `jaskinia_wejscie`: (16,64) i (17,64) na zatoczce z pakietu 0. Wylot `!$Lud_Jaskinia` to skalny występ z otworem na ścianie lasu. Wchodzi się z (16,65) / (17,65).
- **Map177** „Jaskinia przemytników” (tileset 12, ok. 20×14; mapę rysuje C, instaluje instalatorem):
  - lądowanie przy wejściu, powrót na Map125 (16,65);
  - skrzynie, beczki, stół z rejestrem, nisza ze Skrzynią przemytu 212;
  - nocą Sławek: Humans albo zdarzenie wzorem Kantoru.
- **Działanie:**
  - wejście tylko w odpływie (`Wyspa.tide().low`); w przypływie dymek „Wejście zalane. Trzeba odpływu.”;
  - w środku woda morska jest „nie do picia”.
  - Dostępna od W5 rozdz. 4 (stan Kantoru, tylko odczyt).

**Zadanie D34 „Jaskinia pod zatoczką”**
- Daje celnik Sambor (klucz `celnik`, Map125) albo samo przy wejściu.
- Znajdź skład, zabierz Skrzynię przemytu 212 (ciężka, bohater idzie wolniej).
- Wybór zgodny z flagami W5:
  - celnikowi: 40 G, Opinia +3;
  - Baltazarowi: 90 G, flaga `w5BaltazarWrog` tylko się czyta;
  - otworzyć: łup i Opinia −2.
- **Druga skrzynia** leży w kryjówce „tylko z orła” (D5, `orzel_125_a`). Znalezienie obu daje komentarz Rocha.
- Nagroda: 150 PD.

**Grafika:** wylot jaskini (ok. 4), rekwizyty mapy 177 (ok. 6), ikona 212.

### C7. Stare groby rodu Ługów (Map168)
- `grob_lugow`: x 88–90, y 26–27. Trzy omszałe krzyże `!$Lud_KrzyzStary` i ławka.
- **To nie jest grób Jana Ługa**, który już jest w (34,5) i należy do Homes. To groby starszych pokoleń rodu (rodzice i dziadkowie Jana). Historii z D21 nie zmieniamy.
- **Działanie:**
  - „Oczyść groby” (ręce, 3 × 4 uderzenia, raz).
  - Marta (TownLife `praczka`, hak rozmowy) przy następnej rozmowie dziękuje: zaufanie +, linijka o przodkach.
  - W dni grobu (Homes: co 7 dni 15–18) Marta stoi czasem tu zamiast przy krzyżu Jana. Zdarzenie własne C, pokazywane funkcją. Homes zostaje bez zmian.
- Odkrycie `groby_lugow`.

**Grafika:** krzyże (ok. 2).

### C: podsumowanie
- **Odkrycia:** mielerz, koszar, postój handlarza, obóz kopaczy, jaskinia, groby Ługów. Razem 6.
- **F9:**
  - teleporty;
  - „dzień mielerza”, „dzień handlarza N”, „pasterz na 018”;
  - „noc patrolu”, „W8 gotowe”;
  - „odpływ”, „W5 rozdz. 4”.

---

## 7. Paczka D: „Tajemnice i zakon”

Wtyczki `Zakon_Data.js` / `Zakon.js`, zdarzenia 2700–2899, mieszkańcy 2930–2939 (`grabarz`), przedmioty 225–239, ikony 512–527, przełączniki 27–28, mapa **176**, zadania K67–K70, D36–D38, test `tests/zakon_test.js` (9554).

### 7.1 Fundamenty strażnic

| klucz | mapa | obszar | gdzie |
|---|---|---|---|
| `straznica_022` | Map022 Polna droga | x 71–76, y 36–41 | wzgórek nad drogą na południowym wschodzie |
| `straznica_013` | Map013 Góry | x 79–84, y 20–25 | przy drodze ku przylądkowi |
| `straznica_157` | Map157 Urwisko | x 94–99, y 52–57 | widok na morze, wschód |

**Wygląd:** kwadrat 6×6 z obmurówek `!$Zak_Fundament`. Obrazki narożników i ścian to zdarzenia płaskie, przechodnie (bohater wchodzi do środka). W środku zawalona płyta z wyrytym krukiem.

Krzaki Farming na (82,22), (75,36), (74,40), (74,41) gaszą puste znaczniki.

**Działanie:**
- „Obejrzyj płytę” daje kartę **Zapisków strażnic** (s4, s5, s6 po kolei w znalezionych strażnicach).
- To osobna seria **6 kart**: virtual items `zak_karta_1..6` w paczce TownQuests (`vitems`). Nie dotyka kart kroniki 1–6 ani flag `kronikaKarta*`.
- Odkrycie `straznica_*`.
- Za trzy strażnice kompas pokazuje krąg menhirów („strażnice patrzyły na kamienny krąg”).

### 7.2 Kapliczki z krukiem (modlitwa daje krótkie wzmocnienie)

| klucz | mapa | obszar | gdzie |
|---|---|---|---|
| `kapliczka_022` | Map022 | x 72–73, y 16–17 | **przydrożna**, przy drodze na wschód |
| `kapliczka_021` | Map021 | x 58–59, y 12–13 | przy Leśnej drodze |
| `kapliczka_004` | Map004 | x 66–67, y 6–7 | przy drodze na północnym wschodzie Łąki |

**Wygląd:** słupek z daszkiem i wyrzeźbionym krukiem `!$Zak_Kapliczka`, prosto z przodu. Nocą świeczka: światło ognia, migotanie.

Krzak Farming na (58,12) znika pod zdarzeniem.

**Działanie:**
- „Pomódl się” raz dziennie przy każdej kapliczce.
- Daje premię `blogoslawienstwo` na 4 h: `Survival.defineBuff("blogoslawienstwo", {name: "Błogosławieństwo drogi", icon: <ikona D>, desc: "Prace kosztują 10% mniej sił.", cost: 0.9})`, potem `$gameSystem.addBuff("blogoslawienstwo", 4)`.
- Zostawienie tam 1 G albo jedzenia: +1 h (najwyżej 6 h).
- Odkrycie `kapliczka_*`.

**Zadanie K67 „Trzy kruki przy drogach”**
- Daje Kleofas albo Ambroży przez hak rozmowy.
- Pomódl się przy wszystkich trzech kapliczkach.
- Nagroda: 80 PD i linijka lore: „Kruk przy drodze znaczył, że w pobliżu jest woda albo schronienie zakonu”. Wskazówka do źródełek A, bez ich pokazywania.

### 7.3 Kopce z kartami

| klucz | mapa | obszar |
|---|---|---|
| `kopiec_017` | Map017 | x 50–51, y 36–37 |
| `kopiec_023` | Map023 | x 58–59, y 51–52 |
| `kopiec_155` | Map155 | x 70–71, y 40–41 |

**Wygląd:** kopiec z kamieni `!$Rock_Cairn` z własną listą (nie do rozkucia), na szczycie kamień z krukiem.

**Działanie:**
- „Rozbierz szczyt” (ręce, 4 uderzenia, raz) daje kartę Zapisków strażnic s1, s2, s3.
- Kopiec potem się „składa” z powrotem (obrazek zostaje).

**Czytanie Zapisków:**
- Kleofas (pustelnik) czyta je przez własny hak rozmowy D (`addTalkHook`). Bez zmian w Pustelnia.js: osobna seria, bez „/6” kroniki.
- Każda karta: 2 h, 40 PD, wpis „Zapiski strażnic (N): …”.
- Treść: jak strażnice patrzyły na krąg na łące, gdzie zakopano Klucz Strażnika i o której godzinie „cień Strażnika wskazuje”.

**Zadanie K68 „Zapiski strażnic”** (daje Kleofas po pierwszej karcie): przynieś 6 kart (3 z kopców, 3 ze strażnic). Nagroda: 150 PD, wskazówka do D36.

### 7.4 Łąka menhirów (Map018): krąg i zagadka cieni, zejście do komory
- `menhiry_krag`: środek (53,45), promień 4.
- **Menhiry** (`!$Rock_Column`, własna lista „Obejrzyj”, więc nie do rozkucia; cień od słońca mają same):
  - (53,41), (56,42), (57,45), (56,48), (53,49), (50,48), (49,45);
  - **Strażnik** w (50,42): `!$Rock_Spire`, najwyższy.
- **Płyta z krukiem** w środku (53,45): `!$Zak_Plyta`, płaska. Krzak Farming na (53,45) znika pod płytą.
- **Miejsce zakopania:** (52,43).

**Wzór cienia** (`Okolice.shadowAt`, z `Sky.js` l. 113–142):
- `p = (h − wschód)/(zachód − wschód)` (`Sky.sunTimes`);
- `elev = SUN_TOP[pora]·sin(πp)`;
- `phi = (p − 0,5)·π·0,92`;
- `len = min(2,4; 0,6/tan(max(5°, elev)))`;
- wektor w px: `(L·sin phi, 0,55·L·cos phi)`, gdzie `L = len · wysokość_sylwetki` (Spire ok. 96 px, czyli 2 pola).

**Zagadka:**
- „Kop” (łopata) w (52,43) **działa tylko wtedy, gdy pole leży pod cieniem Strażnika**: odległość środka pola od odcinka cienia (od stopy obrazka) ≤ 0,5 pola, cień jest widoczny (`Sky.now().light ≥ 0,25`) i nie pada deszcz ani nie ma burzy.
- To wypada późnym popołudniem przy `p ≈ 0,8–0,9` (kierunek w prawo i lekko w dół). Godzina zegarowa zależy od pory roku:
  - lato ok. 18–19;
  - zima ok. 16–17.
- Długość cienia wystarcza we wszystkich porach, bo przy `p 0,87` cień Strażnika ma 2,7–4,8 pola, a pole leży ok. 2 pola od stopy.
- **D liczy dokładne okno ze wzoru** (z prawdziwą stopą obrazka) dla wszystkich 4 pór i sprawdza je w teście. Jeśli w którejś porze okno wypada przy `light < 0,25`, przesuwa pole o 1 w stronę Strażnika, np. (51,43), które też jest wolne.
- Tekst Zapisków s3: „Gdy słońce przejdzie cztery części swej drogi z pięciu, Strażnik wskaże ręką”.
- Kopanie w złej porze daje dymek „Ubita ziemia. Coś tu jest, ale nie teraz… Strażnik nie patrzy.”
- W dobrej porze: Klucz Strażnika 225 i odkrycie „Cień Strażnika”.

**Wejście:** Klucz 225 włożony w płytę (53,45) otwiera schody (przełącznik 27 `Zak_Komora`), czyli przejście na Map176.

**Map176 „Komora pod menhirami”** (tileset 12, ok. 18×12; rysuje D, instaluje instalatorem):
- schody (powrót na Map018 (53,46));
- kamienna misa, sarkofag strażnika, ściana z wyrytą mapą 4 strażnic;
- skrzynia: Pióro Skrzydlatej Straży 226 albo, jeśli już jest, 60 G.
- Ciemno: pochodnia (Torch).
- Bez stworów (to nie podziemia).

**Zadanie D36 „Cień Strażnika”**
- Zaczyna się od K68 albo samo przy płycie.
- Kroki: zrozum zapiski → kop o właściwej porze → otwórz komorę → obejrzyj mapę strażnic (wpis).
- Nagroda: 200 PD, notatka „Komora pod menhirami”. Ściana pokazuje cztery strażnice: trzy z 7.1 i latarnię, czyli już znaną strażnicę zakonu.

**Systemy:** Sky, Survival (pogoda), Torch, Farming (łopata), Journal, Okolice.

**Grafika:** płyta (ok. 3), rekwizyty komory (ok. 8), ikona 225.

### 7.5 Miejsca tylko dla orła (lądowanie + zejście awaryjne)

| klucz | mapa | lądowisko (wolne 4×4) | co tam jest | zejście: kołki (pole w środku → pole na dole) |
|---|---|---|---|---|
| `orzel_125_a` | Map125, gąszcz x 80–101, y 44–63 | x 97–100, y 44–47 | **skrytka przemytników** (druga Skrzynia przemytu z C6: `T.call("Ludzie","stashFound")`), Warzucha 229 | (81,63) → (81,68) |
| `orzel_125_b` | Map125, gąszcz x 100–109, y 24–44 | x 105–108, y 30–33 | stare gniazdo: Pióra 146 ×3 co 7 dni | (109,24) → (109,21) |
| `orzel_013_a` | Map013, skalna półka x 97–103, y 37–44 (nad gawrą) | x 99–102, y 38–41 | gniazdo zakonnych orłów: Pióro Straży 226 (jeśli nie z komory), Szarotka 228 | (99,37) → (97,37) |
| `orzel_013_b` | Map013, półka x 29–41, y 73–78 | x 33–36, y 73–76 | Szarotka 228, kamień z krukiem (lore) | (33,73) → (31,73) |
| `orzel_168` | Map168, skarpa x 50–55, y 24–28 | x 51–54, y 24–27 | Warzucha 229, ślady obozowiska | (54,24) → (54,20) |

Krzak Farming na (100,38) gaszą puste znaczniki. Zdarzenie bez obrazka nie przeszkadza w lądowaniu (`freeTile`).

**Zioła z klifu tylko w nurkowaniu (bez lądowania):**
- Map155: (1,54), (2,66), (73,2);
- Map157: (62,1), (72,5), (100,5).

To pola w wodzie przy klifie, obok żadnego pola dostępnego pieszo, więc z brzegu nie da się ich zerwać. Zdarzenie „półka z rośliną” `!$Zak_PolkaKlif`. Zerwanie: orzeł w niskim locie nad polem + nurkowanie (Spacja, dorosły). Daje Warzuchę 229. Odrasta po 7 dniach.

**Zasady:**
- **Każde lądowisko ma zejście:** „Stare kołki w skale” / „Strzęp liny”. Jednokierunkowe w dół, bez przedmiotu. Bohater nigdy nie utknie, nawet jeśli orzeł jest ranny, odleciał albo trwa burza.
- Odkrycia przez `orzelLand` (Okolice słucha `Tawerna.on("orzelLand")` i sprawdza pole) albo pierwsze podejście.
- W „Okolicach” te miejsca mają dopisek „tylko z powietrza”.
- Szarotka 228: najlepsze lekarstwo, `<Food:stamina=…>` albo opatrunek +50%. Ustala D z A (Jagna kupuje).

**Grafika:** półka z rośliną (ok. 3), kołki (ok. 2), gniazdo (ok. 3), ikony 228, 229.

### 7.6 Orla Grań (Map175): ruiny orlich grzęd Skrzydlatej Straży

| klucz | obszar |
|---|---|
| `orle_grzedy_1` | x 67–69, y 11–13 |
| `orle_grzedy_2` | x 67–69, y 24–26 |
| `orle_grzedy_3` | x 67–69, y 43–45 |

**Wygląd:** kamienny słup z żelazną poprzeczką i misą na deszczówkę `!$Zak_Grzeda`, prosto z przodu, 3 pola wysoki. Obok ślad jeźdźca:
- przy 1: Strzemię 227;
- przy 2: zbutwiałe siodło (lore);
- przy 3: pióro w szczelinie (Pióra 146 ×2).

**Działanie:**
- „Obejrzyj” każdą grzędę: wpis i 40 PD.
- Misy grzęd są suche. Woda w nich tylko po deszczu i „to woda orłów” (dymek; bohater nie pije).
- Gdy orzeł bohatera jest na grani, siada na grzędzie (`Orzel` API, tylko odczyt pozycji): więź +5 raz na grzędę.

**Zadanie K69 „Grzędy Straży”** (po D29, daje Bazyli albo samo)
- Obejrzyj 3 grzędy i przynieś Strzemię 227 Kleofasowi.
- Nagroda: 120 PD, wpis o jeźdźcach („jeźdźca nosił tylko orzeł, który sam go wybrał”, spójne z W13).

**Grafika:** grzęda (ok. 6), ślady (ok. 3), ikona 227.

### 7.7 Miasteczko (Map008): stary cmentarz z grobami zakonu i wzgórze z szubienicą

| klucz | obszar | co |
|---|---|---|
| `cmentarz` | x 80–87, y 12–17 | murek, furtka, 8 grobów `!$Zak_Grob` (2 warianty), 3 z nich z krukiem; nocą lampka na słupie (ogień) |
| `szubienica` | x 93–95, y 54–56 | szubienica `!$Zak_Szubienica` na kopczyku, przy wschodniej drodze |

**Cmentarz:**
- **Grabarz** (decyzja użytkownika: TAK, paczka D): TownLife 2930 `grabarz`, `map: 8`. Postać PixelLab w stylu bohatera (ok. 35 generacji, już w budżecie D 110), popiersie `Grabarz_Bust`. Plan dnia: 6–18 przy cmentarzu (miejsca `SPOTS_BY_MAP[8]` w obszarze cmentarza), noc `away`.
- „Oczyść grób” na grobach z krukiem (3 × 4 uderzenia) odsłania imiona braci zakonu (wpis).
- Trzeci grób: „Brat Wit, strażnik bramy, r. 106” (spójne z upadkiem w roku 106, karta 3–4).

**Szubienica:**
- Tylko klimat i lore („tu dwór wiesza kłusowników i przemytników”).
- Nocą 22–3 skrzypienie, mgła (Mood).
- Gajowy (B6) w rozmowie straszy szubienicą przy drugim kłusownictwie.
- Bez egzekucji i bez końca gry.

**Zadanie D37 „Groby z krukiem”**
- Kroki `custom`, bo Map008 nie ma wolnych 951–959. Daje Ambroży (dzwonnik, klucz `dzwonnik`).
- Oczyść 3 groby, przepisz imiona, zanieś Ambrożemu.
- Nagroda: 120 PD, Opinia +3, linijka o „czterech i jednym” (sygnał dzwonu, spójne z W2).

**Grafika:** grób, murek, furtka (ok. 6), szubienica (ok. 3), grabarz (ok. 35).

### 7.8 Osada Milczących (Map120): święty gaj z milczącymi kamieniami
- `gaj_milczacych`: x 53–61, y 51–57. Polana w lesie na południowym wschodzie.
- 7 kamieni `!$Zak_KamienMilczenia` (białe, płaskie) w kręgu o promieniu 3 wokół (57,54). Kamienie mają własną listę, nie do rozkucia.
- **Dostępny pieszo od Aktu II** (przełącznik 16 otwiera osadę). Map120 jest w `NO_LAND`, więc orzeł tu nie ląduje.
- **Działanie, zasada gaju:**
  - wejście bez biegu i z bronią schowaną (tryb walki wyłączony);
  - stój w środku od zmierzchu przez 1 godzinę gry bez rozmowy i bez ruchu poza 3 pola.
  - Złamanie zasady: dymek „Milczący odwracają głowy.” i od nowa następnego dnia.
  - Udało się: przy kamieniu leży Biały kamień milczenia 232 (pamiątka). Premia `spokoj` 6 h: wolniejsze zmęczenie w nocy, `cost 0.95`. Wpis z lore Milczących („wiedzieli za dużo”).
- Odkrycie `gaj`.

**Zadanie D38 „Godzina milczenia”** (daje najstarszy z Milczących przez zdarzenie Osady, tylko odczyt; inaczej samo przy gaju): nagroda 150 PD + 232.

**Grafika:** kamień (ok. 3), ikona 232.

### 7.9 Kruki na skałach (Map155, Map157)
- Głazy z generatora jako grzędy kruków (tylko do odczytu, zdarzeń nie zmieniamy):
  - Map155: Boulder (68,26), (76,47), (92,66);
  - Map157: Boulder (76,21), (78,37), Rock_Cracked (81,39).
- **Działanie:**
  - Dekoracyjne kruki: własny lekki aktor z arkusza kruka (Kruk.js tylko czytamy). Siedzą, kraczą, odlatują, gdy bohater biegnie w promieniu 5.
  - Rzucenie im jedzenia (ryba, mięso) raz dziennie przy grzędzie: kruk zostawia błyszczący drobiazg (Moneta 194 albo Pióra 146).
  - Gdy bohater ma oswojonego kruka (K51, `krukTame`), dzikie kruki na tych skałach nie uciekają.
- Odkrycie `kruki_155`, `kruki_157`.

### 7.10 Wrak (Map165): w odpływie wynurzają się kolejne kawałki
- Płycizny z pakietu 0:
  - `wrak_kawalek_1` w (47,24) na płyciźnie P1;
  - `wrak_kawalek_2` w (62,18) na P2;
  - `wrak_kawalek_3` w (71,24) na P3.
- **Działanie:**
  - Po każdym sztormie (`stormEnd`) piasek „odsłania” następny kawałek: stan `zakon.wreck`, 0 → 3.
  - Widać go tylko w odpływie (`Wyspa.tide().low`); płycizny i tak są wtedy suche (region 61).
  - „Odkop” (łopata, 6 uderzeń):
    1. Okucie z wraku 230 ×2;
    2. Tabliczka z kadłuba 231 (do W12, rozbitek Ansgar: hak rozmowy, tylko odczyt stanu Wrak);
    3. skrzynka: 40 G + Smoła 176.
- Odkrycie `wrak_kawalki`.

**Zadanie K70 „Kawałki wraku”** (daje rozbitek albo samo): odkop 3 kawałki. Nagroda: 120 PD, wpis do W12.

**Grafika:** 3 kawałki (ok. 6), ikony 230, 231.

### D: podsumowanie
- **Odkrycia:** 3 strażnice, 3 kapliczki, 3 kopce, krąg, Cień Strażnika, komora, 5 lądowisk orła, zioła z klifów, 3 grzędy, cmentarz, szubienica, gaj, 2 grupy kruków, kawałki wraku. Razem ok. 26.
- **F9:**
  - teleporty;
  - „ustaw godzinę cienia”, „daj Klucz Strażnika”;
  - „orzeł dorosły, lot”;
  - „sztorm się skończył”, „odpływ”;
  - „Akt II”, „zmierzch w gaju”.

---

## 8. Integracja (koordynator, na końcu)

1. **Kontrola danych.** Bloki Items, IconSet, Map176, Map177 zainstalowane. SHA zgodne z raportami paczek.
2. **Test kolizji** `okolice_integracja_test` (9555), wszystkie wtyczki naraz:
   - żadne dwa zdarzenia na jednym polu;
   - żadne zdarzenie paczki na polu cudzej rzeczy;
   - mieszkańcy 2900–2949 wchodzą.
3. **Dokumenty.**
   - Bloki z `docs/rozszerzenia/<paczka>.md` trafiają do:
     - `docs/QUESTY.md` (K55–K70, D30–D38, krótkie i długie tabele);
     - `docs/QUESTY_STAN.md`;
     - `docs/STORY.md` (lore: strażnice, komora, Zapiski strażnic, grzędy, gaj, groby);
     - `docs/ARCHITEKTURA.md` (wtyczki, numery, szyna).
   - W `QUESTY.md` 5.3 „Pogoda i susza” dopisek o źródełkach i studni deszczowej: znalezione, nie nagrodą.
4. **Łaty zgłoszone przez paczki** (np. brak API w Hunting_AI dla „oswojonej” watahy, noticeRate dla błota, BEASTS w QuestBoard_Art), robione po kolei, każda z testem.
5. **Poprawka błędu `Orzel.js` l. 1981:** `label` → `name`.
6. **Epilog** (`Underground.js` l. 1735–1763, lista na sztywno): po jednej linijce dla gaju, komory i zwierzyńca, jeśli użytkownik chce.
7. **Testy:** tylko dotknięte. Pełna seria tylko za zgodą użytkownika.
8. **Pamięć projektu:** wpis o paczkach i zakresach.

### 8.1 Stan integracji: ZROBIONE 2026-10-22

**Kod**
- `Okolice.js` v1.1.0:
  - `checkMap()` nie zgłasza zdarzeń paczek A–D na miejscach pakietu 0 (płycizny Map165 i kawałki wraku D 2860–2862);
  - nowe API `Okolice.track(key, { ifNone })`: bez argumentu mówi, co prowadzi; `null` kończy; prowadzi tylko do miejsca znalezionego albo podpowiedzianego; `ifNone` nie zabiera wyboru gracza;
  - paczka D (`Zakon.js`) ustawia krąg menhirów przez to API.
- `Okolice_Data.js`: `jagna_miejsce` ma `pkg: "A"`.
- Skupy między paczkami:
  - Babka Jagna (A) kupuje szarotkę 228 (20 G) i warzuchę 229 (6 G), raz dziennie w rozmowie (`ZasobyData.JAGNA_BUYS`, `Zasoby.jagnaSell`);
  - wędrowny handlarz (C) kupuje okucia 230 (`LudzieData.PEDLAR_BUYS`).
- Epilog po Sercu (`Underground.js`) pyta `Zasoby/Lowy/Ludzie/Zakon.epilogue(kind, w)`. Linijki są w `*_Data.EPILOG`, każda tylko wtedy, gdy to zrobione:
  - A: źródełka (3 i więcej), inaczej studnia sąsiada;
  - B: przyjazna wataha; zwierzyniec bez kłusownictwa albo z zezwoleniem;
  - C: groby Ługów; jaskinia (celnik, Baltazar albo otwarta);
  - D: komora i gaj.
- `TawernaCore.js`: krótsze opisy zakresów; linia „Wstawione tu” w F9 skraca ciągi numerów (wiersz „Rdzeń” był za szeroki).
- `js/plugins.js`: opisy 10 wpisów z `@plugindesc` (v1.1.0) przez `tools/rozszerzenia/opisy_wtyczek.py --wykonaj`. Kopia w archiwum `dane_przed_rozszerzeniami/integracja/`.
- Błąd `Orzel.js` l. 1981 (`label` → `name`) poprawiony już w pakiecie 0.

**Testy innych wtyczek (zmienione tylko liczby, ustawienie albo wyścig)**
- `workbench_test`: nowe przepisy `zas_split_drift` i `zas_scrap_iron`, menu ma 21 pozycji.
- `quest_board_test`: przed sprawdzeniem cyklu termin aktywnych zleceń co najmniej dzień 20 (odporny na nowe wzory).
- `town_life_test`, `podgrodzie_life_test`: 22 mieszkańców Map008 (grabarz Hieronim).
- `zwierzeta_ludzie_test`: bohater stoi 12+ pól od mięsa i watahy, ale w zasięgu Starcia (`CFG.near - 4`). Starcia bez zmian.
- `journal_test`: kolejkę podsumowania czyta w tym samym wywołaniu co sen (wyścig).
- `boar_test`: dzik w części „włócznia” patrzy na bohatera (`setDirection(4)`, jak w części 5.). Zwierzę zaczyna w losowym kierunku; co czwarty raz stało tyłem, a wtedy pchnięcie liczy się jako cios z ukrycia ×2,5 (−50 zamiast −20).
- `core_test`, `debug_menu_test`: zakresy pakietu 0.
- Nowy `tests/okolice_integracja_test.js` (9555): `track`, skup Jagny, skup handlarza, epilog, Map165 bez kolizji.

**Wyniki** (port 9555, jeden serwer):

| test | wynik |
|---|---|
| zasoby_test / lowy_test / ludzie_test / zakon_test | 60/60, 46/46, 71/71, 33/33 |
| okolice_szkielet_test / okolice_integracja_test | 21/21, 7/7 |
| workbench_test / quest_board_test / journal_test | 60/60, 57/57, 28/28 |
| town_life_test / podgrodzie_life_test / zwierzeta_ludzie_test | 10/10, 16/16, 36/36 |
| boar_test | 33/33 (4 razy z rzędu) |
| orzel_test / debug_menu_test / core_test | 87/87, 63/63, 49/49 |
| `tools/newstart/run_transfer_test.py` | 110/110 przejść, bez błędów strony |

**Zostaje**
- Pełna seria testów tylko za zgodą użytkownika.
- Przełączniki 25 `Lud_Jaskinia` i 26 `Lud_rez` są nieużywane (paczka C steruje kodem); zostają w rezerwie.
- Przejść do jaskini (Map125 ↔ 177) nie ma w `tools/newstart/layout.py`. Sprawdza je `ludzie_test`.
- Bez commita.

---

## 9. Ryzyka

- **Edytor otwarty u użytkownika** nadpisze `Items.json`, `MapInfos.json` i `plugins.js` przy zapisie. Instalacje tylko przy zamkniętym edytorze. Po każdej instalacji użytkownik otwiera projekt na nowo.
- **Forestry i TownLife** to zmiany w plikach działających systemów. Przed falą testy `town_life_test`, `podgrodzie_life_test`, `przystan_test` i test sadzenia sosny. Stare zapisy: sosny 1000–~1100 zostają.
- **Losowe krzaki Farming** na polach planu. Rozwiązanie: puste znaczniki (`Okolice.blank`). Test kolizji sprawdza `gatherKindOf`.
- **Starcia:** obóz rabusiów jest blisko błotniska (6 pól) i mielerza (ok. 22 pola). Dziki z błotniska mają `_noClash`. Napad na mielerz jest zamierzony.
- **Pies poluje na wszystko:** filtr `_noDog` w `Dog.js` (B).
- **Orzeł:** treść późna (etap 4 to 65+ dni). Utknięcie wykluczają zejścia awaryjne. Autozapis po lądowaniu jest bezpieczny.
- **Map023** nie może być domem mieszkańca, bo psuje się Rysiek. Na Map023 są tylko zdarzenia i Humans.
- **Woda:** każde nowe miejsce z wodą ma limit i jest opisane. Żadnej wody za zadanie.
- **Budżet PixelLab** jest wspólny z innymi sesjami. Paczki trzymają się limitów i max 2 zadań naraz.
- **Równoległe sesje:** porty 9550–9555 zarezerwowane. Sonda planu użyła 9557 (poza repozytorium).

---

## 10. Pytania do użytkownika (krótko)

1. **Woda.** Źródełka (1–2 porcje dziennie, ukryte, wysychają w upał) i studnia sąsiada (tylko deszczówka, maks. 4 porcje) to wyjątki od zasady suszy. Czy tak może zostać?
2. **Map125.** Brzeg w nowej części jest szczelnie zarośnięty. Proponuję wyciąć małą zatoczkę 5×3 (x 15–19, y 65–67) na kraby, drewno z morza i wylot jaskini. Alternatywa bez zmian mapy: kraby i drewno tylko na brzegach Pustelni i Garnizonu, a wejście do jaskini przy drodze.
3. **Map165.** Czy można domalować trzy płycizny (piasek i region odpływu) w nowym morzu pod kawałki wraku?
4. **Postacie.**
   - Węglarzem będzie istniejący Zbych Smolarz, a zielarką Babka Jagna z tablicy ogłoszeń, która dostanie postać.
   - Nowe postacie PixelLab: gajowy, pasterz, handlarz.
   - Czy grabarz na cmentarzu też (dodatkowe ok. 35 generacji)?
5. **Wilcza nora.** „Zostawić szczenięta” oznacza, że wataha staje się przyjazna i nic się nie zabiera. Czy tak? A kłusownictwo kończy się grzywną i zamknięciem wyłomu na 7 dni (bez szubienicy ani końca gry)?
