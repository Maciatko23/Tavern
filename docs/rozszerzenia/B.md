# Paczka B „Zwierzęta i łowy” – opis dla integracji

Stan: 2026-10-22. Zbudowane według `docs/rozszerzenia/PLAN.md` (punkt 5) i decyzji użytkownika z 2026-10-21.

- Wtyczki: `js/plugins/Lowy_Data.js` (dane, v1.0.0) i `js/plugins/Lowy.js` (silnik, v1.0.0).
- Test: `tests/lowy_test.js`, port 9552.
- Grafiki:
  - `tools/rozszerzenia/B/art.py` (obiekty), `tools/rozszerzenia/B/ikony.py` (ikony i poroże);
  - `tools/busts/make_gajowy.py` (popiersie), `tools/npc/build_npc.py` (gajowy);
  - surowe obrazy w `tools/rozszerzenia/B/raw/`, zużycie w `tools/rozszerzenia/B/generacje.json`;
  - podgląd: `docs/rozszerzenia/B/obiekty.png`.

## Numery

| co | numery |
|---|---|
| zdarzenia (`Tawerna.inject`, właściciel `Lowy`) | Map023: 2300 nora, 2301 namiot myśliwych. Map013: 2320 gawra, 2321 wylot (niewidoczny, „Zajrzyj”). Map021: 2340 błotnisko, 2341 namiot rabusiów. Map004: 2360 lizawka, 2361 zasiadka, 2362 zrzucone poroże. Map024: 2380–2381 wyłom (gałęzie / cierń), 2382 leśniczówka, 2383 paśnik, 2384–2386 sidła, 2387 Rysiek (noc, D32). Map162: 2440–2442 tarcze (obrazek pod postaciami), 2443 stojak z łukami, 2444–2445 żołnierze (9–12), 2446–2448 niewidoczne blokady tarcz |
| mieszkaniec TownLife | 2905 `gajowy` – Gniewko Bór, Map024 (`$Npc_Gajowy`, `Gajowy_Bust`) |
| przedmioty (zainstalowane) | 200 Bryła soli, 201 Poroże jelenia, 202 Kieł odyńca, 203 Pazur niedźwiedzia, 204 Zezwolenie na odstrzał `[K]`, 205 Strzała z białym okiem `[K]`, 206 Srebrna strzała `[K]` |
| ikony (zainstalowane, wiersz 30) | 480–486 (w kolejności przedmiotów 200–206) |
| przełącznik | 23 `Low_Wylom`: wyłom zarośnięty cierniem (7 dni po trzecim kłusownictwie) |
| zadania | K59, K60, K61, K62, D32, D33 |
| zlecenia tablicy | `low_oboz_021` (Wit, garncarz), `low_czo_023` (Bogdan; tylko w Akcie II, póki D33 nierozstrzygnięte), `low_poroze` (Bogdan) |
| stan | `Tawerna.state("lowy")` |
| flagi TownQuests | `lowCzoPomoc`, `lowCzoPrzegnani`, `lowWydalRyska`, `lowOstrzegl`, `lowMlekoMarty` |

## Zadania – blok do docs/QUESTY.md

### Krótkie questy

| # | Nazwa | Kto daje | Gdzie | Co (opis i kroki) | Kiedy | Nagroda | Mechaniki gry | Co trzeba dobudować |
|---|---|---|---|---|---|---|---|---|
| K60 | Sól dla jeleni *(łowy)* | samo (wiadomość łowczego Bogdana u Borgara) – po znalezieniu lizawki | Łąka (Map004): lizawka (73,51), zasiadka (70,53) | 1) Połóż bryłę soli na lizawce (sól od handlarza paczki C albo od Rocha). Sól działa 6 dni. 2) O świcie (5–8) posiedź w zasiadce, aż jelenie przyjdą lizać sól. 3) Zdobądź poroże (wiosną leży czasem zrzucone przy lizawce; z jelenia spod lizawki 20%) albo mięso jelenia spod lizawki. | o świcie | 40 G, 80 dośw. | jelenie Hunting z `_goal` na lizawkę i `_noDog`; zasiadka: zwierzęta wyczuwają cię 2× później, łuk celuje 20% szybciej | – |
| K61 | Zawody strzeleckie *(próba)* | kwatermistrz Pafnucy Kłos (gdy Kłos zniknął po D27 – samo, po znalezieniu strzelnicy) | Garnizon (Map162): strzelnica x 73–84, y 50–54 | Na zawodach (co 7 dni, 10–12) pokonaj sierżanta Bełta: więcej niż 36 pkt na 5 strzał z łuku. Rywale: 24 / 30 / 36 pkt. | dzień `d % 7 === 3`, 10–12 | 50 G, 120 dośw., przychylność garnizonu +5; na zawodach osobno 25 / 40 / 60 G i przychylność +3 / +5 / +8, pierwsza wygrana: Srebrna strzała | prawdziwe strzały z łuku (Hunting.shoot / celowanie): punkty od środka tarczy (10 / 5 / 2), strzały ćwiczebne nie ubywają | – |

### Długie questy

| # | Nazwa | Kto daje | Gdzie | Co (opis i kroki) | Kiedy | Nagroda | Mechaniki gry | Co trzeba dobudować |
|---|---|---|---|---|---|---|---|---|
| K59 | Nora pod korzeniami *(wybór)* | samo (ogłoszenie łowczego Bogdana) – po znalezieniu nory | Skraj lasu (Map023): nora x 64–66, y 49–50 | Za dnia przy norze śpi wataha (2 dorosłe; przy zleceniu na Szarego Kła – on i jego wilki), wiosną i latem 2–3 szczenięta. Wybór: **rozbić watahę** (zabić dorosłe wilki spod nory; szczenięta uciekają w gąszcz, nora pusta 28 dni) albo **zostawić szczenięta**: w trzech różnych dniach zostawić przy norze surowe mięso (tobołek). Wtedy wataha jest przyjazna: wilki na Leśnej drodze i Skraju lasu nie atakują bohatera, krążą wokół obozu rabusiów (Starcia), a raz w tygodniu przy norze leży zając – dar watahy. Uderzony wilk albo zabite szczenię kończy przyjaźń. | za dnia (nocą wataha poluje jak zwykle) | rozbita: 60 G, 120 dośw. (+ skóry z wilków); zostawione: 150 dośw. i dar watahy | Hunting.spawnPack, gatunek `wolfPup` (skala 0,55, bez oprawiania), `_noClash`; przyjazne wilki przez otoczkę `thinkWolf` | – |
| K62 | Krasula i kury Ługów *(odprowadzanie)* | Marta Ługowa (`praczka`), po D21 | Spalona zagroda (Map168): łąki x 72–95, y 18–35 | Krowa Krasula, owca i dwie kury rozbiegły się po pożarze. Krowę i owcę prowadzisz na powrozie (Lina 93), kurę łapiesz ręką (50%, inaczej ucieka kilka pól). Odprowadź je do zagrody Ługów (przy domu, etap odbudowy ≥ 3) albo do swojej zagrody właściwego rodzaju (obora / owczarnia / kurnik) na dowolnej mapie. Prowadzone zwierzę idzie z tobą przez przejścia między mapami. | za dnia | 30 G, 100 dośw., co tydzień od Marty 2× Mleko | własne postacie (jak Livestock), stan w zapisie | – |
| D32 | Gajowy i kłusownik *(wybór moralny)* | gajowy Gniewko Bór | Zwierzyniec Lorda (Map024): sidła (20,46), (45,38), (66,12), zasadzka (46,38) | 1) Znajdź i zabierz trzy sidła. 2) Nocą (22–3) zaczaj się przy miejscu po drugich sidłach: przychodzi Rysiek Sidło. Wybór: **wydać go** (Opinia +2, flaga `lowWydalRyska`, Rysiek znika na 7 dni) albo **ostrzec** (Opinia +3, flaga `lowOstrzegl`; Rysiek odtąd sprzedaje skóry taniej). 3) Wróć do gajowego. | nocą 22–3 | 120 dośw., Zezwolenie na odstrzał (1 jeleń w tygodniu legalnie) | TownLife (gajowy), rozmowy z wyborem | – |
| D33 | Gawra pod granią *(wybór, Akt II)* | samo – po znalezieniu obozu obcych myśliwych w Akcie II | Skraj lasu (Map023): obóz x 64–69, y 18–22; Góry (Map013): gawra (99,45–47) | Myśliwi Czarnych Oczu polują na niedźwiedzia dla skóry. Przy ich ognisku rozmowa: **pomóc** (ubij niedźwiedzia spod gawry, wróć po 80 G; myśliwi zdradzają, że ich dowódca szuka w górach wejścia pod ziemię – flaga `lowCzoPomoc` dla W8) albo **przegnać** (walka z obozem; Opinia +3, flaga `lowCzoPrzegnani`, brat Kleofas i Bazyli komentują, niedźwiedź spod gawry nie atakuje bohatera w promieniu 12 pól od gawry, jeśli ten nie biegnie). Zanim nic nie postanowione, myśliwi nie atakują (chyba że ich uderzysz). | Akt II, 6–20 | 150 dośw. + jak wyżej | Humans.fixedCamp (stały obóz za dnia), otoczka myślenia ludzi Humans | – |

## Miejsca i działanie (krótko)

- **B1 Nora (Map023).**
  - Za dnia (5–20) przy norze wataha: `_summoned`, `_noClash`; wiosną i latem dochodzą szczenięta.
  - Nocą dorośli stają się zwykłymi nocnymi wilkami, a szczenięta wchodzą do nory.
  - Zlecenie na Szarego Kła stawia go na stałym polu (66,51) przez `QuestBoard.spawnBounty(notice.id, [66,51])`; przy przyjaznej watasze go tam nie ma.
- **B2 Gawra (Map013).**
  - Wiosna–jesień, 4–22: niedźwiedź przy gawrze (dom w (99,47)). Inne niedźwiedzie w promieniu 22 pól znikają, póki on żyje.
  - Zimą chrapie w środku. „Zajrzyj” go budzi: wściekły, przez 60 s jego ciosy ×1,2.
  - Ubity: skóra (Hunting) i pazur 203 przy oprawianiu; gawra pusta do następnej wiosny.
- **B3 Błotnisko (Map021).**
  - 5–9 i 17–21: 2–3 dziki z `_goal` na błoto, `_noClash`. Zlecenie na Czarnego Ryja stawia go w (66,47).
  - Bohater w błocie dostaje premię „Ubłocony” na 2 h: `Combat.perk("sneak")` +0,3.
  - Z dzika z błotniska 20% na Kieł 202 przy oprawianiu.
  - Błoto nie jest do picia (dymek).
- **B4 Lizawka (Map004).**
  - Szczegóły w K60.
  - Zasiadka: sneak +0,5 i `Combat.aimSteady` ×0,8, tylko na jej polu.
  - Wiosną raz na porę roku przy lizawce leży zrzucone poroże (po pierwszej soli).
- **B5 Obozy (Humans.fixedCamp).**
  - Rabusie: (60,41), nocą, w 1 na 4 noce, a ze zleceniem `low_oboz_021` co noc. Tag `camp`, więc wilki (Starcia) krążą wokół nich.
  - W noce, gdy `Ludzie.mielerzBurning()` (paczka C), czuwający idą pod mielerz (50,21).
  - Myśliwi Czarnych Oczu: (66,21), za dnia 6–20, Akt II, póki D33 nierozstrzygnięte. Mają nazwę i wygląd Archer, a w worku Strzałę 205.
  - Strzała 205 pokazana rotmistrzowi daje przychylność garnizonu +5. Pokazana Kleofasowi daje notatkę w dzienniku „Strzały z białym okiem (las)”.
- **B6 Zwierzyniec (Map024).**
  - 4–6 jeleni i 2 dziki (`_summoned`, `_noDog`), zawsze w granicach zwierzyńca (otoczka `isMapPassable`).
  - Przy pierwszym przejściu przez wyłom dymek „Za żywopłotem: zwierzyniec Lorda. Tu poluje tylko dwór.”
  - Kłusownictwo to zabicie zwierzęcia w zwierzyńcu (przez bohatera, psa albo orła) bez ważnego zezwolenia. Liczy się, gdy:
    - gajowy widzi bohatera albo ścierwo (7 pól, osłona skraca do 3,5);
    - albo w ciągu 2 h gry gajowy na obchodzie trafi na ścierwo.
  - Grzywny: 40 / 60 / 80 G, za każdym razem Opinia −3. Bez pieniędzy gajowy zabiera surowe mięso i skóry.
  - Za trzecim i każdym następnym razem wyłom zarasta cierniem na 7 dni (przełącznik 23). Bohatera w zwierzyńcu gajowy wyprowadza.
  - Nigdy szubienica, nigdy koniec gry.
  - Z zezwoleniem jeden jeleń w tygodniu jest legalny.
- **B7 Zbłąkane zwierzęta (Map168).** Szczegóły w K62. Zwierzęta oddane do własnej zagrody są tam dodatkowym zwierzęciem (Livestock, wstawiane przy każdej wizycie).
- **B8 Strzelnica (Map162).**
  - Runda: bohater staje na (74,53) (stąd żadna tarcza nie zasłania innej) i ma 5 strzał ćwiczebnych. Strzały z torby wracają do stanu sprzed rundy.
  - Bez łuku dymek „Bez łuku ani rusz.”
  - Żołnierze ćwiczą 9–12.

## Zmiany względem planu (do wiadomości)

- **K59 i K60 zaczynają się same,** po znalezieniu nory i lizawki. Łowczy Bogdan nie jest mieszkańcem TownLife, więc TownQuests nie może dać go jako zleceniodawcy. Teksty mówią o jego ogłoszeniu / wiadomości u Borgara. K60 kończy się samo po zdobyciu poroża albo mięsa jelenia spod lizawki, a „zapłata od Bogdana” przychodzi przez Borgara. Za przynoszenie poroża Bogdanowi jest osobne zlecenie z tablicy `low_poroze`.
- **D33 też zaczyna się samo** (Akt II + znaleziony obóz). Zleceniodawcą są sami myśliwi przy ognisku.
- **Tarcza na 10 kroków (83,51) jest przesunięta o 1 pole na (82,51).** Łuk ma zasięg 9 pól, a z linii strzału dalsza tarcza była poza zasięgiem celowania.
- **Każda tarcza to dwa zdarzenia:** obrazek pod postaciami i niewidoczna blokada na tym samym polu. Strzały Hunting zatrzymują się na zdarzeniach z obrazkiem, więc ukośna strzała uderzała w pole tarczy, zanim doleciała do jej środka.
- **Kury nie potrzebują liny:** złapana kura idzie z bohaterem.
- **Grzywna zawsze daje Opinię −3,** nie tylko za pierwszym razem.
- **„Opinia w Podgrodziu” (D32, ostrzeżenie Ryśka)** to zwykła `TownQuests.addOpinion(+3)`. Osobnej opinii Podgrodzia w grze nie ma.

## Łaty do plików wspólnych (dla koordynatora)

- **Humans.js** (tylko B, zrobione). Blok `[Okolice/B]` „Stałe obozy” na końcu pliku (`Humans.fixedCamp`, `Humans.fixedCheck`) i dwie oznaczone linie:
  - `makeCamp`: `opts.at`;
  - `campCheck`: najpierw `fixedCheck()`.
  - Kopia sprzed zmiany: `backup_art_2026-10-21/rozszerzenia/B/Humans.js.przed`.
- **Dog.js** (tylko B, zrobione). Jedna oznaczona linia w `findPrey`: `if (a._noDog) continue;`. Kopia: `backup_art_2026-10-21/rozszerzenia/B/Dog.js.przed`.
- **Hunting_AI, Combat, QuestBoard_Art: bez łat.** Wystarczyły otoczki przez API: `Game_Animal.prototype.thinkWolf / update / isMapPassable`, `Combat.perk / aimSteady / hitPlayer`, `Humans.Game_Human.prototype.think`, `QuestBoard.BEASTS.bandit/archer/bear`.
- **`tools/npc/npcs.json`:** `build_npc.py` dopisał wpis `Gajowy` (narzędzie robi to samo).
- **Integracja (punkt 8 planu):** w epilogu (`Underground.js`) można dopisać linijkę o zwierzyńcu (np. „Gajowy Gniewko Bór dalej liczy jelenie w zwierzyńcu Lorda”). Tego nie ruszałem.

## Testy (port 9552, 2026-10-22)

- `tests/lowy_test.js`: 46/46.
- `okolice_szkielet_test`: 20/21. Jedyny błąd to Map165: kawałki wraku paczki D (zdarzenia 2860–2862) stoją na płyciznach pakietu 0. Miejsca B są czyste.
- Dotknięte systemy:
  - bez błędów: `humans_test` 52/52, `dog_test` 33/33, `hunting_test` 33/33, `wolves_test` 11/11, `bear_test` 25/25;
  - `boar_test` 33/33 przy osobnym uruchomieniu (w serii 30/33: wyczucie czasu przy obciążonym serwerze; dzik na Map003, której B nie dotyka).
- **Trzy błędy dla integracji, każdy sprawdzony osobno:**
  - **`zwierzeta_ludzie_test` 35/36, „a pack 10+ tiles off … eats it”.** To geometria testu na powiększonej Map004, nie paczka B:
    - `__heroAway` stawia bohatera 13 pól od wilków, ale 27 pól od przynęty;
    - Starcia nie liczy watah dalej niż 26 pól od bohatera (`CFG.near`);
    - wataha dochodzi do mięsa i stoi.
  - **`quest_board_test` 16/18, „three days later…”.** Test zakłada, co wylosuje `QuestBoard.refresh(99)`, a wynik losowania zależy od puli wzorów:
    - nowe wzory paczek A i B zmieniają ziarno;
    - trafia się zlecenie na 3 dni i przepada przed dniem 13;
    - stąd też drugi błąd, „reading 'id'”.
    - Sprawdzone: sama pula bez A i B daje inną tablicę.
  - **`town_life_test` 9/10, „21 residents in the town”.** Miasteczko ma 22 mieszkańców przez grabarza paczki D (Map008). Gajowy B mieszka na Map024.
