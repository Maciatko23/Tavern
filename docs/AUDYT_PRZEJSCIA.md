# Audyt przejścia gry (2026-10-24)

Czy grę da się przejść od początku do końca po ostatnich dużych zmianach (nowe miasto i Podgrodzie, ubiór, bronie i zbroje,
usługa rozmów, teksty w plikach, labirynt podziemi, kinowa nazwa mapy, Wydajnosc.js). Trzy kroki: statyczny przegląd danych
(bez przeglądarki), ekonomia długu z liczb w kodzie, przejście automatem (istniejące testy wątków i maraton).

Narzędzia (zostają, do powtórek po każdej większej zmianie treści):

```
node tools/audyt/przejscie.js          każde zadanie: dawca i osoby kroków, godziny vs plany dnia, przedmioty i ich źródła, rzeczy
                                       spoza bazy, miejsca (SPOTS) i znaczniki, haki FX, flagi, pętle `done`, tekst kroku;
                                       mieszkańcy: miejsca planów, warunki, wnętrza; tablica zleceń. Wynik: tools/audyt/wynik.md / .json
node tools/audyt/przejscia_map.js      każde „Przenieś gracza” w zdarzeniach map: mapa docelowa istnieje, cel w granicach; graf map
node tools/teksty.js sprawdz           pliki tekstów (klucze, cudzysłowy, długie słowa)
```

---

## 1. Wątki - czy przechodnie

| wątek | zakres | test od początku do końca | wynik 2026-10-24 | uwagi |
|---|---|---|---|---|
| Prolog „Ostatni prom” | nowa gra, imię, 7 scen, pominięcie | `prologue_test` | **OK** 37/37 | |
| Rozdział 1: dług (Story) | dziadek, działka, Borgar, Lord, spłata / strata działki | `story_test`, `field_loss_test`, `smoke/story` | **OK** 64/64, 54/54, 9/9 | |
| W1 Woda spod Kruczych Skał | rozdz. 1-7 | `town_quests_test` (1-2), `w1_chapters_test` (3-6), `act2_quests_test` (7) | **OK** 60/60, 36/36, 29/29 | |
| W2 Kod dzwonu | rozdz. 1-7 | `town_quests_test`, `w2_archive_test`, `pustelnia_test` (7) | **OK** 13/13, 38/38 | |
| W3 Pieśń o Kruczych Skałach | 6 zwrotek, Noc Kupały | `regulars_quests_test` | **OK** 34/34 | |
| W4 Krew kasztelana | klucz (1-5), ród i konfrontacja (6-8) | `w4_key_test`, `w4_borgar_test` | **OK** 16/16, 30/30 | |
| W5 Towary z kontynentu | rozdz. 1-7 | `w5_test` | **OK** 54/54 | |
| W6 Ludzie z promu | rozdz. 1-7 | `w6_test` | **OK** 50/50 | |
| W7 Dwór z kamieni twierdzy | rozdz. 1-7 | `w7_test` | **OK** 66/66 | |
| W8 Żelazna Pięść | góry, jaskinia, Osada | `w8_mountains_test`, `regulars_quests_test` (1) | **OK** 34/34 | |
| W9 Rywal w ruinach + prawdy | rozdz. 3, 6 | `w9_rywal_test`, `underground_test` | **OK** 56/56, 61/61 | |
| W10 List do matki | listy, prom, kuter | `przystan_test` | **OK** 60/60, 36/36, 29/290 | |
| W11 Soczewka, K49, D22 | latarnia | `latarnia_test` | **OK** 60/60, 36/36, 29/291 | |
| W12 Rozbitek, D25 | wrak | `wrak_test` | **OK** 60/60, 36/36, 29/292 | |
| W13 + D29 orzeł | Orla Grań | `orzel_test` | **OK** 60/60, 36/36, 29/293 | |
| Akt II: wejście pod tawernę, Osada, Marek | `act2_quests_test`, `w8_mountains_test` | `act2_quests_test` | **OK** 29/29 | |
| Podziemia 1-99, labirynt, windy | `underground_test` | `underground_test` | **OK** 61/61 | |
| Akt III: napad na tawernę | `act3_test` | `act3_test` | **OK** 47/47 | |
| Komnata Serca, 4 zakończenia, epilog | `heart_test` | `heart_test` | **OK** 25/25 | |
| Zadania K/D miasta i Podgrodzia | 61 + paczki | `town_quests_test`, `town_quests2_test`, `podgrodzie_quests_test`, `quest_places_test` | **OK** 60/60, 23/24 (1 - wóz, patrz niżej), 8/8, 22/22 | |
| Paczki wyspy: pustelnia, kruk, garnizon, cysterna, zakon, zasoby, łowy, ludzie | K47-K70, D20-D38 | `pustelnia_test`, `kruk_test`, `garnizon_test`, `cysterna_test`, `zakon_test`, `zasoby_test`, `lowy_test`, `ludzie_test` | **OK** 38, 60, 45, 41, 33, 60, 46, 71 - wszystkie komplet | |
| Maraton autopilota (nowa gra, dni 1-N) | przetrwanie, budowa, walka, zapis / wczytanie | `tests/marathon_test.js` | **OK** 6 dni, 0 problemów, 2 zapisy / wczytania, 11 budynków, poziom 3 | |
| **Cała gra jednym ciągiem** | prolog → rozdział 1 → W4 i krata → strażnik 10 → piętro 50 → Akt III → W2 Księga → Komnata Serca → zakończenie | `przejscie_ciagiem_test` (nowy, poza smoke / full) | WYNIK_CIAG | skróty czasu między bramkami, bramki prawdziwe |

Od 2026-10-24 jest też test **jednym ciągiem** (`tests/przejscie_ciagiem_test.js`, decyzja gracza): zaczyna od tytułu i prologu,
rozdział 1 gra naprawdę (intro, działka, najem, trzy zmiany, spłata u Lorda), potem każda bramka między aktami jest prawdziwa
(klucz kasztelana i krata, hasło strażnika, piętro 50 → act3Armed → oblężenie z czterema falami → Act3.outcome, Księga sygnałów w
Archiwum, dwa zamki z trzech, wybór przy Sercu, epilog i powrót do tawerny), a między bramkami są skróty czasu (`Underground.go`,
`setDay`, złoto za pozostałe zmiany, `TownQuests.start('W2', 8)`). Poza smoke i full: `node tests/run.js przejscie_ciagiem_test
--port 9684 --timeout 1500`. Osobne wątki dalej mają własne testy od swojego początku, a bramki sprawdzają też `act2_quests_test`,
`act3_test`, `heart_test`.

---

## 2. Statyczny przegląd danych (tools/audyt/przejscie.js)

106 zadań (62 K, 31 D, 13 W; z paczek, D21 z Homes, kroki W4 6-9 z Kasztelan_Data i W9 rozdz. 3 z Rywal_Data), 60 mieszkańców
(TownLife + paczki), 126 map, 332 znaczniki „Miejsce:”. Sprawdzone dla każdego kroku: osoba istnieje i jest osiągalna w godzinach
kroku (plan dnia: na dworze, w tawernie jako gość albo we własnym wnętrzu ze znacznikiem `<klucz>_wnetrze`; `away` = poza mapą),
przedmioty istnieją w bazie i mają źródło (receptury Farming / Bron, uprawy, zbiór z ziemi, ścinanie i kopanie, oprawianie, kałuże,
wędkowanie, sklepy Bron / Ubior / zdarzeń map / paczek, łup, nagrody zadań), rzeczy spoza bazy (`v:`) są w VITEMS i ktoś je daje,
miejsca zadań stoją na istniejącej mapie (znacznik albo własne współrzędne w granicach), haki FX istnieją w kodzie, flagi warunków
startu są ustawiane, `done` wskazuje istniejące zadania bez pętli, krok ma tekst do dziennika.

**Wynik: 0 blokad.** Znalezione i naprawione / do wiedzy:

| waga | gdzie | co | stan |
|---|---|---|---|
| kosmetyka | D33 „obóz obcych myśliwych” (Lowy_Data), krok 2 | `vars: "lowD33"` wskazywał hak, którego nie ma (jest `lowD33Koniec`) - w dzienniku tekst kroku pokazywał dosłownie `{co}` | **naprawione** (Lowy_Data.js) |
| kosmetyka | plotki K5 Ambrożego z paczek Cysterna i Zakon | TownQuests_Data odrzucało plotki paczek, gdy mieszkaniec już miał swoje („the gossip of dzwonnik is taken”) - dwie linijki Ambrożego (cysterna, kapliczki z krukiem) nigdy się nie pokazywały; ostrzeżenie w konsoli przy każdym starcie | **naprawione**: linijki paczek dopisywane po słowach miasta (po wczytaniu tekstów) |
| uciążliwość (zamierzone) | K19 „Spis obozu” | Rafał wychodzi tylko o świcie i późnym wieczorem (ok. 8% doby) - tekst zadania o tym mówi | bez zmian |
| uciążliwość (zamierzone) | D21 „Spalona zagroda” | krok wymaga 350 G (kupno ziemi) | bez zmian |
| info | 11 mieszkańców bez wnętrza (Bartek, Ela, Feliks, Lucjan, Teodor, Ludmiła, Marek, Rafał, Wojciech, Gaweł, Szymek) | gdy plan mówi „inside”, są nieosiągalni (namioty, brama, wieża) - żaden krok zadania nie wypada w całości w takich godzinach | bez zmian |
| info | Babka Jagna (D30, K56-58) | na polance 5-10 tylko w dni bez deszczu (`zasRosa`), przy kręgu 18-20 po deszczu; w deszczowy dzień rano jej nie ma | bez zmian (zamierzone) |
| info | Lucjan Kość (K39) | tylko w dni targowe (co 7 dni) | zamierzone |
| kosmetyka (nie moje pliki) | `js/teksty/mapa_wyspy.txt` (agent „mapa wyspy”) | linie 16 i 30: `nieznane` i `karta.wnetrza` są tekstami, więc `nieznane.opis` / `karta.wnetrza.wiecej` nie mogą być pod nimi - Watki wypisuje błąd w konsoli przy każdym starcie, testy z `errorCheck` to zobaczą | **do poprawy u agenta mapy wyspy** (zmienić klucz na np. `nieznane.nazwa` + `nieznane.opis`) |
| kosmetyka | `node tools/teksty.js sprawdz` | 20 kluczy, których kod nie czyta (wrak 5, zakon 9, zasoby 3, ...), 1 prosty cudzysłów (zakon kod.rows.12), para „” w zasoby farm.letter | bez zmian (nic nie blokuje) |

Przejścia między mapami (`tools/audyt/przejscia_map.js`): 335 poleceń „Przenieś gracza” w zdarzeniach, **0 błędnych celów**. Z domu
dziadka samymi zdarzeniami map osiągalnych jest 77 map; pozostałe 49 (podziemia, sześć miejsc wyspy, dwór, piwnica kantoru, Orla
Grań, chatka) dostają wejścia z wtyczek (Wyspa.js, Krawedzie.js, Underground.js, Dwor.js, Kantor.js) - to sprawdzają ich testy.

---

## 3. Ekonomia długu: 2500 G do dnia 60

Liczby z kodu (Story.js, TavernShift.js, QuestBoard.js, Garnizon_Data.js, Przystan.js, Bron_Data.js, Items.json). Bohater zaczyna z 0 G.

### Dochody

| źródło | ile | skąd liczby |
|---|---|---|
| **Zmiana u Borgara** (16-21, raz dziennie, 4 h, 30 wytrzymałości) | dniówka 15 + 3 × poziom (poziom = liczba zmian, do 5) → 15-30 G; premia do 40 G × wynik (4 części: 8+8+8+16); +5 przy „Mistrzu kufla”; napiwki ok. 10-25 G; potrącenia 1-3 G za błąd. Przeciętnie **50-60 G** w pierwszym tygodniu, **65-80 G** od szóstej zmiany | `TavernShift.js` BASE_WAGE, PART_DEFS, gradeOf, TavernShift_Parts tips |
| Zadania K/D miasta, Podgrodzia i wyspy (do dnia 60) | złoto pewne **883 G** (90 zadań), najlepsze opcje **+213 G**, na dług / odpisy **105 G** (K30 5, K37 50, D14 50); do tego przedmioty (ser, wędzone ryby, miód...) | `tools/audyt/wynik.json` → `ekonomia` |
| Wątki (wybory) | W1 b: **200 G odpisu**; W5: 2 noce × 20 G + 30 G / tydzień (wspólnik) albo 50 G (szantaż); W7: **250 G odpisu** po prawdzie o Feliksie (ale zaproszenie dopiero po 1250 G spłaty); W6: 120 G za wydanie Rafała | TownQuests.js, Kantor_Data PAY, Dwor_Data PAY |
| Tablica zleceń (co 3 dni 4-6 kartek, 3 naraz) | zapłata = wartość pracy × (1 + 0,1 × próg) + 4-10, w widełkach progu: 10-25 G (dni 1-3), 15-40 (od dnia 4, Sława 20), 30-55 (od 10, Sława 40), 45-80 (od 18, Sława 60), 60-100 (od 28, Sława 80); listy gończe 90-120 G. Realnie ~1 zlecenie dziennie × ~35 G = **~700 G** w 20 dni roboczych | `QuestBoard.js` TIERS, makeNotice |
| Skup wojskowy (po K52, od dnia 5) | **od 2026-10-24 (decyzja gracza): najwyżej 10 sztuk każdego towaru dziennie** (księga dnia; Kłos mówi „dość na dziś”, popup nad bohaterem o reszcie jutro, wiersz „Drewno ×10 z 23 - 3 G/szt. (dziennie po 10)”); drewno **3 G** (było 6), węgiel **5 G** (było 8), reszta bez zmian: jęczmień 6, ziemniak 7, marchew 6, kapusta 13, wędzone mięso 24, wędzona ryba 21, skóra 9, wyprawiona 22, strzały 3; ×1,5 przez tydzień po każdej fali (dni 10, 24, 38, 52), ×1,2 gdy Kłos milczy (D27). Dzień pełnego skupu wszystkich 11 towarów = **ok. 1 180 G** (po fali 1 770), ale drewno i węgiel to już tylko 80 G - resztę trzeba upolować, uprawiać, uwędzić | `Garnizon_Data.js` BUY, BUY_LIMIT, BUY_WAVE; `Garnizon.js` skupToday / sell() |
| Borgar „Sprzedaj towar” | wszystko za **połowę ceny bazowej** (sklep silnika, kupuje tylko pochodnie 30 G) | Map001 zdarzenie 1 (302), RMMZ |
| Janek (przystań) | śledź 4, dorsz 7, ryba 3 | `Przystan.js` SELL |
| Baltazar K16 (dzień po promie) | do 10 sztuk po **podwójnej** cenie (grzyby, jagody, zioła...) | TownQuests k16Trade |
| Bazyli (latarnia) | drewno 2, węgiel 4, tran 6 - do 10 sztuk dziennie | `Latarnia_Data` FUEL |
| Kości | Grum 10-25 G (3 partie), Ozzy 5-10, kupiec 25-50 (Sława 40), Lucjan 5 w dni targowe; oczekiwana wygrana ok. 0 | `TavernDice_Data` |
| Rzemiosło na sprzedaż | żelazny miecz (3 żelaza + 2 węgle + skóra) → 110 G u Baltazara / Ludmiły (skup 0,45 → 50 G) albo 55 G u Borgara; stal 40 → 20 G | `Bron_Data` PRZEPISY, SKLEPY skup |

### Wydatki

Narzędzia robi się samemu (0 G), jedzenie i woda z działki, lasu i deszczu (0 G; posiłek w tawernie 10-30 G to wybór). Nasiona: handlarz
3 G, dzikie ziemniaki i marchew z ziemi. Nowe bronie i zbroje: pałka 0 (warsztat), kostur 5, proca 15, skórzany kaptur 18,
przeszywanica 35, skórznia 65, żelazny miecz 110, kolczuga 170, stal zakonna 400-700; naprawa 30% ceny. Rozsądny zestaw na dzień 30
(przeszywanica, kaptur, karwasze, nagolenniki, okuta pałka, puklerz) to ok. **150 G**. Myto 2 G, list promem 3 G, piwo dla Ozzy'ego 3 G.

### Wniosek

- Dług to **42 G dziennie**. Sama codzienna zmiana u Borgara daje od drugiego tygodnia 65-80 G, czyli **spłata w 36-40 zmianach** -
  kto pracuje co wieczór, kończy około dnia 40-45 i jeszcze kupuje zbroję. Kto robi zmianę co drugi dzień i do tego zadania miasta
  (ok. 600-900 G w praktyce) plus kilka zleceń tablicy, też zdąży - z zapasem rzędu 300-500 G. Bez zmian w tawernie zostaje tylko
  mielenie (zlecenia + skup), więc **przy normalnej grze dług da się spłacić bez nudy, a zmiana pozostaje kręgosłupem** - tak jak
  założono w docs/QUESTY.md 6.2.
- **Dziura zamknięta (2026-10-24, decyzja gracza):** skup wojskowy płacił 6 G za drewno bez limitu (drzewo = 40-70 G za 8 ciosów,
  dług = ok. 60 drzew). Teraz **po 10 sztuk każdego towaru dziennie**, drewno 3 G, węgiel 5 G (×1,5 po fali zostaje): z lasu wyjdzie
  najwyżej 30 + 50 = 80 G dziennie, a dług wraca do zmian, zadań i prawdziwej produkcji. Wybrałem limit „po 10 sztuk towaru”, nie
  „120 G dziennie”: widać go w wierszu menu („×10 z 23”), nie karze za uczciwą sprzedaż 5 wędzonych mięs i nie wymaga liczenia
  w głowie. Teksty w `js/teksty/garnizon.txt` (`klosLimit`, `kod.sell.3-4`, `kod.skupBranch.2`).
- Borgar skupuje za 50% bazy (standard silnika) - uczciwe; ale Baltazar K16 płaci 200% za 10 sztuk - drobne, ograniczone, zostaje.
- Zadania miasta: 883 G pewnych + 213 G z opcji + 105 G odpisów - zgodne z celem „pieniądze ciekawe, nie konieczne” (ok. 1/3 długu,
  gdyby zrobić wszystko; realnie 1/4).
- Nowe ceny broni i zbroi (15-700 G) nie zagrażają spłacie: podstawowy zestaw to 150 G, stal zakonna to cel na Akt II.
- Odpisy z wątków (W1 b 200, W7 250) są nagrodą za fabułę, nie planem spłaty - W7 wymaga 1250 G wcześniej; w porządku.

---

## 4. Przejście automatem

Partie po jednym porcie (9681-9684), 36 testów w przeglądarce + maraton, łącznie ok. 75 min; pełnego zestawu nie puszczałem.

| partia | testy | wynik |
|---|---|---|
| A (9681) | prologue, smoke/story, story, field_loss, w1_chapters, w5 | 6/6 zielone (w1_chapters 36/36 i w5 54/54 - rano padały 1/3 i 4/6 przez `ReferenceError: gfx is not defined` w Wydajnosc.js:174; agent grafiki już to naprawił) |
| B (9682) | w2_archive, w4_key, w4_borgar, w6, w7, w8_mountains, w9_rywal | 7/7 zielone |
| C (9683) | town_quests, town_quests2, regulars_quests, podgrodzie_quests, quest_places, act2_quests, act3, heart, underground | 8/9 zielone; **town_quests2_test 23/24**: „dzień targowy 7, 10:12: woźnica w mieście” - Wojciech jest `hidden`, bo jego plan ma już warunek `wozMiasto` z nowego **Woz.js** (agent „mapa wyspy + wóz”, TownLife_Data.js w toku): o 10:12 wóz jest w drodze. Nie moje pliki - test trzeba dostosować do rozkładu wozu (albo rozkład ma trzymać wóz w mieście w godzinach targu) |
| D (9681) | pustelnia, kruk, latarnia, garnizon, wrak, cysterna, zakon, zasoby, lowy, ludzie, orzel, przystan, watki, rozmowy | 13/14 zielone; **wrak_test 30/31**: Eryk siadł na stołku 62,35, a test liczył na 61,33 z danych Wraku - gracz dodał do przebudowanej tawerny własne znaczniki „Miejsce: gosc_1..8” i znacznik mapy słusznie wygrywa z danymi. Gra działa dobrze; **poprawiłem test** (stołek z `TownLife.spot`), ponowny bieg 31/31 |
| E (9682) | lowy_test, town_quests_test po moich poprawkach | lowy_test 46/46, town_quests_test 60/60 (K5: plotki Ambrożego z paczek doklejone, bez ostrzeżenia w konsoli) |
| maraton (9684) | `node tests/marathon_test.js 6 4` | dzień 1 → 7, 0 problemów (żadnego zastoju bohatera, psa, zwierząt; głód / pragnienie w porządku), 2 zapisy i wczytania w biegu, 11 budynków, poziom 3 |

Nic nie utknęło. Jednostkowe: 25/26 zestawów - `unit/choppable_tree.test` 16/17 pada od wcześniej (zmiana ChoppableTree_Objects.js z
dziś: drzewo poza małym daje też gałęzie - test oczekuje w drugim łupie szyszek; do poprawy przy tej zmianie, nie moja).

Pierwsza wizyta na mapie chowa HUD na ok. 5 s (kinowa nazwa „Kronika”): istniejące testy przechodzą bez zmian (czytają stan, nie
HUD); nowe testy czytające okienko celu / minimapę powinny poczekać albo ustawić `Tawerna.state("nazwaMapy").odw[id] = 1`.

---

## 5. Naprawy

| plik | co | test |
|---|---|---|
| `js/plugins/Lowy_Data.js` | D33 krok 2: `vars: "lowD33Koniec"` (było `"lowD33"` - hak nie istniał, dziennik pokazywał `{co}`) | `lowy_test` |
| `js/plugins/TownQuests_Data.js` | plotki paczek dla mieszkańca, który już ma plotki (Ambroży: Cysterna, Zakon), dopisywane po jego własnych po wczytaniu tekstów (`Watki.poTekstach`) zamiast odrzucane; znika ostrzeżenie „the gossip of dzwonnik is taken” z konsoli przy każdym starcie | `town_quests_test` (K5) |
| `js/plugins/Garnizon_Data.js`, `js/plugins/Garnizon.js`, `js/teksty/garnizon.txt` | skup wojskowy: limit 10 sztuk każdego towaru dziennie (`garnizon.skup` w zapisie - księga dnia), drewno 3 G, węgiel 5 G; wiersz menu z resztą dnia, Kłos „dość na dziś”, popupy nad bohaterem; `Garnizon.skupLeft(id)`, `Garnizon.BUY_LIMIT` | `garnizon_test` (3 nowe sprawdzenia) - **48/48** (było 45) |
| `tests/przejscie_ciagiem_test.js` (nowy), `tests/run.js` SKIP_FULL, `docs/TESTY.md` | przejście gry jednym ciągiem (rozdz. 4), poza smoke i full | WYNIK_CIAG_KROTKO |
| `tools/audyt/przejscie.js`, `tools/audyt/przejscia_map.js` | nowe narzędzia przeglądu (opis na górze) | - |

Nie ruszałem: Wydajnosc.js, MenuRing.js, Mood / GroundDetail / Sky (agent grafiki), TownLife / Tawerna.talk woźnicy i nowej wtyczki
mapy wyspy (agent mapy), Map001, map gracza, data/*.json.

---

## 6. Decyzje dla gracza

1. ~~Skup wojskowy~~ - **zrobione** wg decyzji: 10 sztuk każdego towaru dziennie, drewno 3 G, węgiel 5 G (rozdz. 3 i 5).
2. **Zmiana u Borgara co wieczór** jako główna droga do 2500 G - zostawić (tak zaprojektowano), czy podnieść widełki tablicy zleceń
   o ~20%, żeby gracz, który woli zlecenia, nie musiał pracować w tawernie codziennie? Moja rada: zostawić; tablica i zadania dają
   dziś łącznie ok. 1/2 długu, zmiana resztę.
3. `js/teksty/mapa_wyspy.txt` (agent mapy wyspy) - dwa klucze do poprawy (rozdz. 2), inaczej błąd w konsoli przy każdym starcie.
4. `unit/choppable_tree.test` 16/17 od wcześniej (ChoppableTree_Objects.js zmieniony dziś, nie przeze mnie): „a grown pine felled:
   6-8 wood and 1-3 cones” dostaje 7 gałęzi zamiast szyszek - do sprawdzenia u tego, kto zmieniał ChoppableTree.
5. ~~Test „jednym ciągiem”~~ - **zrobione**: `tests/przejscie_ciagiem_test.js` (rozdz. 4), tylko na życzenie.
