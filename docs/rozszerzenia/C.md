# Paczka C „Ludzie” – co zbudowane i bloki do dokumentów

Plan: `docs/rozszerzenia/PLAN.md`, punkt 6. Kod: `js/plugins/Ludzie_Data.js` (dane, teksty, zadania) i `js/plugins/Ludzie.js` (silnik).
Mapa 177: `tools/rozszerzenia/C/build_map177.py` → `tools/rozszerzenia/C/Map177.json` (instaluje `instaluj.py --mapa 177`).
Przedmioty: `tools/rozszerzenia/C/przedmioty.json` (210–214), ikony: `tools/rozszerzenia/C/ikony.png` (496–500).
Test: `tests/ludzie_test.js` (port 9553).

## Co działa w grze

| rzecz | gdzie | jak |
|---|---|---|
| C1 mielerz | Map021 x 48–50 y 17–19, szałas x 52–54 y 20–21 | cykl 6 dni: dni 2–3 tli się (dym `!Fantasy_chimney`, nocą żar = światło ognia), dzień 4 gotowy, reszta zimny. Zbych Smolarz (TownLife `drwal`) dostaje `alt` na Map021 w dni 2–3 (od 5:00), śpi w szałasie. Węgiel 4 G (10 na wypał), „Dam drewno na wypał” (12 → 8 po 2 dniach). `Ludzie.mielerzBurning()` dla paczki B. |
| C2 pasterz | Map004: koszar x 50–54 y 40–43, pastwisko x 43–49 y 44–49; Map018 x 65–71 y 29–33 | Wawrzyn Owczarz (2910). 6 owiec (własne postacie `Game_LudSheep`, `$Animal_Sheep`, `Hunting.path8`): za dnia na pastwisku, 18:30 do koszaru (płot = niewidzialne zdarzenia, furtka (52,43)). Co trzeci dzień (d % 3 = 2, 7:30–17:30) stado i pasterz przy menhirach. Handel: wełna 5, ser 6, mleko 2, koc 25 G; kupuje bryłę soli (15 G). Strzyża wiosną (dni 10–20 pory, nożyce): wełna ×3 + 10 G. Koc w torbie: odpoczynek na ziemi +50%. |
| C3 handlarz | Map022 x 49–54 y 19–22 (wóz, osioł, ognisko), Map021 x 54–55 y 16–17, Map004 x 59–62 y 10–11, Map003 x 59–62 y 9–11 | Szymon Juczny (2911). Postój wg d % 4 (dzień od 6:00); jego `alt` to getter (mapa dnia), pozostałe postoje w `TownLife.HOMES`. 8–18 handel, wieczorem przy ognisku, nocą pod plandeką. Towar dnia: mapa okolic (60 G, raz – `Okolice.revealAll`) + 5 z listy (hash dnia). Woda z beczki: łyk raz na dzień 12 G (upał 20, susza 30). Skup o 20% drożej niż w mieście. Plotka raz na dzień (`Okolice.hint`). |
| C4 patrole | Map159 obchód (53,45)→(70,40)→(80,53)→(60,61)→(50,70); Map162 (60,45)→(91,45)→(95,65)→(65,70) | 2912–2913 i 2914–2915 (`$Npc_Zolnierz`, `$Npc_Zolnierz_B`), 7–19, drugi idzie krok za pierwszym (`TownLife.hold`). Okrzyki o rabusiach i „białym oku”. Przychylność garnizonu < 10: przeszukanie torby raz na dzień (reguła i teksty Garnizonu, wspólny `patrolDay`). |
| C5 obóz kopaczy | Map013 x 97–104 y 70–75, szyb (105,71) | od W8 rozdz. 3 do końca D35. Namioty `!$Mt_Tent`, ognisko, skrzynia dowódcy (101,73). 4 kopaczy (Humans, tag `ludKopacze`, nazwa „Kopacz Czarnych Oczu”, wygląd Merc), nocą śpią; pobici wracają po 2 dniach. |
| C6 jaskinia | Map125 wylot (16–17,64) → Map177 | wejście od W5 rozdz. 4, tylko w odpływie (dymki: zawalony / zalane). Mapa 177: skład (worki, beczki, skrzynie), stół z rejestrem i świecą, nisza ze skrzynią, zalewisko morskie (`<Water:salt>`). Nocą (22–4) Sławek (Humans, tag `ludJaskinia`), póki skrzynia w niszy. `Ludzie.stashFound()` dla skrytki orła paczki D. |
| C7 groby Ługów | Map168 x 88–90 y 26–27 | trzy omszałe krzyże i ławka; „oczyść” rękami 3 × 4 uderzenia (raz): flaga `ludGroby`, Opinia +2, 30 PD; Marta dziękuje (uwaga TownQuests). W co drugi dzień grobu (Homes: `martaAway`) Marta stoi tu zamiast przy krzyżu Jana (zdarzenie Homes 712 ukryte w czasie gry; Homes bez zmian). |

Odkrycia (Okolice, 25 PD): `lud_mielerz`, `lud_koszar`, `lud_postoj`, `lud_oboz` (tylko gdy obóz stoi), `lud_jaskinia`, `lud_groby`.
F9 (zakładka „Wyspa i fabuła”, sekcja „Paczka C”): miejsca (17), dzień mielerza, dzień handlarza ←→, pasterz przy menhirach, noc patrolu K66,
W8 gotowe (obóz), odpływ, W5 rozdz. 4 (jaskinia), burza wczoraj (K64).

Numery: zdarzenia Map021 2500–2505, Map022 2520–2522, Map004 2540–2556, Map003 2570–2572, Map013 2590–2597, Map125 2610, Map168 2650–2654;
mieszkańcy 2910–2915; przedmioty 210–214; ikony 496–500; przełączniki 25–26 nieużywane (wszystko sterowane kodem i samoprzełącznikami).
Flagi TownQuests: `ludKowalRabat`, `ludOwcaRabat`, `ludJukRabat`, `ludPatrolDone`, `ludSkrzyniaCelnik` / `ludSkrzyniaBaltazar` /
`ludSkrzyniaOtwarta`, `ludObieSkrzynie`, `ludSzyb` (dla W8), `ludSzybRotmistrz`, `ludGroby`. Stan: `Tawerna.state("ludzie")`.

## Blok do `docs/QUESTY.md` – 2. Krótkie questy

| # | Nazwa | Kto daje | Gdzie | Co (opis i kroki) | Kiedy | Nagroda | Mechaniki gry | Co trzeba dobudować |
|---|---|---|---|---|---|---|---|---|
| K63 | Węgiel dla kowala *(dostawa, warta)* | kowal Tadek Młot | kuźnia (Map008) → Zbych (Podgrodzie albo mielerz na Leśnej drodze) | Kowal potrzebuje 10 worków węgla w 5 dni. 1) Zanieś Zbychowi 12× Drewno (6–20) – rozpala mielerz tego wieczora. 2) Noc wypału (22–2): pilnuj kopca – przychodzi dwóch rabusiów (Humans). Bez warty (albo po ucieczce) rabusie rozkopują kopiec: Zbych da tylko 5 worków (po pobiciu 6). 3) Dwa dni później odbierz węgiel. 4) Zanieś kowalowi 10× Węgiel. | od dnia 4, 7–18; 5 dni (do 21:00) | 40 G, Opinia +3, 100 dośw.; kowal sprzedaje potem stal za 50 G raz na dzień (`ludKowalRabat`) | mielerz (Ludzie.js), Humans.ambush, węgiel | - |
| K64 | Zabłąkana owca *(prowadzenie)* | pasterz Wawrzyn Owczarz | Łąka (koszar) → Omszała łąka | Po burzy w stadzie pięć owiec: Siwa uciekła przed grzmotem. Stoi w jednym z trzech miejsc na Omszałej łące (pasterz podpowiada). Przycisk akcji przy owcy – idzie za bohaterem przez kolejne mapy. Doprowadź ją na pastwisko pod koszarem i powiedz pasterzowi. | dzień po burzy (do 2 dni), 7–19 | 3× Ser, 30 G, 80 dośw.; u pasterza −20% (`ludOwcaRabat`) | owce (Game_LudSheep, path8), przejścia map | - |
| K65 | Zgubiony juk *(szukanie)* | wędrowny handlarz Szymon Juczny | Leśna droga (na wschód od mielerza) | Z wozu spadł juk z przyprawami. Leży w jednym z trzech miejsc przy drodze. Znajdź go przed drugą nocą (do 5:00 drugiego dnia) – inaczej rabusie z lasu znajdą go pierwsi – i oddaj handlarzowi na jego dzisiejszym postoju. | od dnia 3, 8–18 | 25 G, 60 dośw.; u handlarza stale −10% (`ludJukRabat`) | postoje handlarza (d % 4), rzecz v:juk | - |
| K66 | Nocny patrol *(walka)* | rotmistrz Bełza | przylądek z latarnią (Map159) → kwatera rotmistrza | Patrol dwóch żółtodziobów wraca o zmroku, a wtedy napadają rabusie. Tej nocy (21–24) idź z patrolem po przylądku. Przy ścieżce koło (70,40) zasadzka: dwóch bandytów i nożownik. Potem zamelduj rotmistrzowi. | od dnia 6, 8–20, po pierwszym spotkaniu z rotmistrzem; tylko tej nocy | 30 G, 100 dośw., przychylność garnizonu +5 | patrole (TownLife), Humans.ambush, latarnia patrolu (światło ognia) | - |

## Blok do `docs/QUESTY.md` – 3. Długie questy

| # | Nazwa | Kto daje | Gdzie | Co (opis i kroki) | Kiedy | Nagroda | Mechaniki gry | Co trzeba dobudować |
|---|---|---|---|---|---|---|---|---|
| D34 | Jaskinia pod zatoczką *(skradanie, wybór)* | celnik Sambor Kwit albo samo w jaskini | Przystań: zatoczka przemytników → Jaskinia przemytników (Map177) | Przemytnicy Baltazara mają skład w jaskini pod zatoczką; wejście tylko w odpływie. 1) Znajdź skład i weź Skrzynię przemytu z niszy (ciężka, 8). Nocą (22–4) pilnuje Sławek. 2) Komu ją oddać: celnikowi (40 G, Opinia +3, `ludSkrzyniaCelnik`), Baltazarowi (90 G, tylko gdy nie jest wrogiem – flaga `w5BaltazarWrog` tylko czytana; `ludSkrzyniaBaltazar`) albo wyłamać wieko na miejscu (przyprawy, gwoździe, 35 G, Opinia −2, `ludSkrzyniaOtwarta`). Druga skrzynia leży w skrytce „tylko z orła” (paczka D, `orzel_125_a`) – obie: komentarz Rocha (`ludObieSkrzynie`), za drugą celnik +20 G, Baltazar +40 G. | od W5 rozdz. 4, w odpływie | 150 dośw. i to, co wyżej | pływy (Wyspa.tide), Humans (Sławek), waga | - |
| D35 | Szyb pod Orlą Granią *(skradanie, wybór)* | samo się zaczyna przy obozie kopaczy | Góry i kamieniołom (Map013), obóz kopaczy na wschodzie → tawerna (Grum) / garnizon (rotmistrz) | Kopacze Czarnych Oczu drążą szyb w skale. 1) Zabierz po cichu Dziennik kopacza ze skrzyni dowódcy (nocą śpią): „Kopią ku piętru pięćdziesiątemu od góry…”. 2) Zasyp szyb (lina + piła, 6 uderzeń przy szybie), powiedz Grumowi (W8 dostaje flagę `ludSzyb`) albo rotmistrzowi (przychylność +8, żołnierze rozbijają obóz, `ludSzybRotmistrz`). Po każdym wyborze obóz znika, szyb zostaje zasypany. | W8 od rozdz. 3 | 150 dośw., notatka z dziennika | Humans (kopacze), uderzenia, W8 (flaga) | - |

## Blok do `docs/QUESTY_STAN.md`

| # | stan | gdzie w kodzie | test |
|---|---|---|---|
| K63 | zrobione | Ludzie_Data.js (K63), Ludzie.js (FX ludK63*, k63Tick) | ludzie_test |
| K64 | zrobione | Ludzie_Data.js (K64), Ludzie.js (owce, FX ludOwca*) | ludzie_test |
| K65 | zrobione | Ludzie_Data.js (K65), Ludzie.js (FX ludJuk*) | ludzie_test |
| K66 | zrobione | Ludzie_Data.js (K66), Ludzie.js (patrolNightTick) | ludzie_test |
| D34 | zrobione | Ludzie_Data.js (D34), Ludzie.js (niche, giveCrate, stashFound), mapa 177 | ludzie_test |
| D35 | zrobione | Ludzie_Data.js (D35), Ludzie.js (obóz, shaftChoice) | ludzie_test |

## Lore do `docs/STORY.md`
- **Stare groby Ługów** (Map168): rodzice i dziadkowie Jana Ługa; „stary Ług przyszedł tu z kontynentu, kiedy zagroda była jeszcze lasem”.
  Krzyż Jana przy drodze (Homes) bez zmian.
- **Jaskinia przemytników** pod zatoczką przystani: skład Baltazara (worki, beczki z solą i rybą, rejestr jego pismem, pusta przegródka po
  kamieniu z krukiem). Wejście tylko w odpływie.
- **Szyb kopaczy** w górach: Czarne Oczy kopią „ku piętru pięćdziesiątemu od góry” (dziennik dowódcy) – inna droga niż tunel w Jaskini (Map014).
- **Wawrzyn Owczarz** (pasterz, Łąka), **Szymon Juczny** (wędrowny handlarz, cztery drogi), patrole garnizonu na przylądku i wybrzeżu.

## Dla integracji (łaty do plików wspólnych – nie zrobione przez paczkę)
- Brak potrzebnych łat w plikach wspólnych. Wszystko przez API: `TownLifeExtra`, `TownLifeData.RESIDENTS` (alt Zbycha),
  `TownLifeData.SPOTS_BY_MAP`, `TownLife.HOMES.add` (postoje handlarza), `TownLife.addCondition` / `addTalkHook` / `hold`,
  `TownQuestsPacks`, `TownQuests.FX`, `SpeechBubbles.BUSTS`, Humans, Okolice.
- `OkoliceData.PLAN_SPOTS` ma `jagna_miejsce` z `pkg: "C"` – to miejsce paczki A (Jagna, A5); po rejestracji paczki C wypada z testu kolizji,
  dopóki A go nie zarejestruje. Do poprawy w `Okolice_Data.js` przez koordynatora (`pkg: "A"`); paczka C tego pliku nie zmienia.
- Przełączniki 25 `Lud_Jaskinia` i 26 `Lud_rez` (System.json) są nieużywane: wejście do jaskini, nisza i wszystkie strony są sterowane
  kodem (stan `Tawerna.state("ludzie")`, flagi TownQuests). Można je zostawić w rezerwie albo oddać.
- Homes: Marta przy starych grobach ukrywa w czasie gry zdarzenie Homes 712 (bez zmian w pliku Homes.js).
- Wyniki testów 2026-10-22 (port 9553): `ludzie_test` 70/70 (potem dopisana kontrola wyjścia z jaskini: część `jaskinia` 9/9),
  `humans_test` 52/52, `w5_test` 54/54, `tools/newstart/run_transfer_test.py` 110/110 przejść.
  Porażki spoza paczki C:
  - `okolice_szkielet_test` 20/21: Map165 – kawałki wraku paczki D (2860–2862) stoją na płyciznach pakietu 0;
  - `town_life_test` 9/10 i `podgrodzie_life_test` 15/16: grabarz paczki D na Map008 (22 mieszkańców zamiast 21);
  - `quest_board_test` 16/18 („three days later”): pula wzorów zleceń paczek A/B.
  Paczka C nie dodaje mieszkańców na Map008 ani wzorów QuestBoard.
- Przejścia do jaskini (Map125 → 177 → 125) są w skryptach (`Ludzie.act`): przypływ, wątek W5. Nie ma ich w `tools/newstart/layout.py`,
  więc `run_transfer_test.py` ich nie chodzi. Sprawdza je `ludzie_test` (wejście w odpływie, wyjście (3,12) → (16,65)).
- Epilog (Underground.js): ewentualnie linijka o grobach Ługów / jaskini – do decyzji użytkownika.
