# Kości — gra przy stole w sali gier

Karczemna gra w kości o pieniądze, jak w Kingdom Come. Osobna mała minigra
(własny ekran), uruchamiana przy stole do kości w tawernie „Pod Złotym
Kuflem”. Wtyczka: `js/plugins/TavernDice.js` (jeszcze niezarejestrowana
w `js/plugins.js` — patrz „Dla twórcy” na dole).

![Stół: kto siedzi przy stole](kosci_start.png)

## Zasady

- Każdy gracz ma **sześć kości** i rzuca wszystkimi naraz.
- Po każdym rzucie trzeba **odłożyć co najmniej jedną punktującą kość**.
  Potem albo **zapisujesz punkty tury**, albo **rzucasz dalej** pozostałymi
  kośćmi.
- Rzut, w którym nic nie punktuje, to **„Pudło!”** — punkty z tej tury
  przepadają, kości przechodzą do rywala.
- Odłożone wszystkie sześć = **„Gorące kości!”** — rzucasz znowu całą
  szóstką, a punkty tury zostają.
- Liczą się tylko odłożone kości, a układy tylko w obrębie jednego rzutu
  (trzy jedynki z dwóch różnych rzutów to nie „trzy jedynki”).
- Wygrywa, kto pierwszy dojdzie do **2000** punktów (przy małej stawce, do
  10 G, **szybka partia do 1500**). Zwycięzca bierze całą pulę.
- Kto zaczyna, rozstrzyga rzut jedną kością (wyższe oczko; remis — jeszcze
  raz).

| Układ | Punkty |
|---|---|
| jedynka | 100 |
| piątka | 50 |
| trzy jedynki | 1000 |
| trzy takie same (2–6) | oczko × 100 (np. trzy czwórki = 400) |
| cztery takie same | × 2 (cztery czwórki = 800, cztery jedynki = 2000) |
| pięć takich samych | × 4 |
| sześć takich samych | × 8 (sześć jedynek = 8000) |
| mały strit 1-2-3-4-5 | 500 |
| duży strit 2-3-4-5-6 | 750 |
| pełny strit 1-2-3-4-5-6 | 1500 |

Karta z zasadami pokazuje się sama przy pierwszym podejściu do stołu, a potem
zawsze pod przyciskiem „Zasady”.

![Zasady](kosci_zasady.png)

## Sterowanie

- **strzałki / WSAD** — wybór kości na stole i przycisków pod stołem,
- **O** — odłóż kość (albo ją cofnij) / wciśnij przycisk („Rzuć kośćmi”,
  „Rzuć dalej”, „Zapisz 450”),
- **P** — wstecz; w trakcie partii pyta, czy odejść od stołu (**stawka wtedy
  przepada**),
- **mysz** — klik na kość albo przycisk; najechanie przesuwa wybór,
- **przytrzymanie O w turze rywala** przyspiesza jego ruchy (× 3).

Pod stołem stale widać, co dają wybrane kości („Trzy czwórki + jedynka ·
500”), a na czerwono — gdy wybrana kość nic nie daje.

## Jak to wygląda

- Stół z góry: ciemne drewno, mosiężne narożniki, zielone sukno, świece na
  krawędziach z migoczącym światłem, pula monet na środku w złotym kręgu.
- Kości z kości słoniowej z wyżłobionymi oczkami i miękkim cieniem. Skórzany
  kubek wjeżdża od strony gracza, grzechocze, przechyla się i kości wypadają,
  koziołkują, odbijają się i obracają, aż spoczną.
- Wybrane kości unoszą się i świecą na żółto, odłożone jadą do kolumny
  gracza; układ „wyskakuje” nad stołem z liczbą punktów.
- Popiersia: bohater po lewej (Hero_Bust, odbity), rywal po prawej; ten,
  kto nie rzuca, jest przyciemniony. Rywal komentuje w dymku nad popiersiem.
- Banery „Pudło!” (czerwony, z drżeniem), „Gorące kości!” (pomarańczowy, iskry),
  „Wygrana!” / „Przegrana”; na koniec monety lecą z puli do zwycięzcy.

![Rzut: kubek przechyla się, kości koziołkują](kosci_rzut.png)
![Wybór kości klawiaturą: odłożone świecą, pod stołem „Pełny strit · 1500”](kosci_wybor.png)
![Pudło](kosci_pudlo.png)
![Gorące kości](kosci_gorace.png)
![Monety z puli lecą do zwycięzcy](kosci_pula.png)
![Wygrana](kosci_wygrana.png)
![Przegrana](kosci_przegrana.png)
![Odejście od stołu w trakcie partii](kosci_wyjscie.png)

## Rywale

Kto siedzi przy stole, zależy od godziny. W nocy (0:00–10:00) stoły są puste:
„Stoły puste. Wróć wieczorem.”

| Rywal | Kiedy | Stawka | Styl gry | Jego kość specjalna |
|---|---|---|---|---|
| **Grum Żelazna Pięść** (najemnik) | 17:00–24:00 | 10 / 15 / 20 / 25 G | ryzykant: zapisuje dopiero duże tury, czasem gra „jeszcze raz” na przekór | Kość szczęściarza — gra nią w co drugiej partii, oddaje po **4 wygranych** z nim |
| **Dziadek Ozzy** (stały bywalec) | 10:00–23:00 | 5 / 10 G | ostrożny: zapisuje wcześnie; gaduła, opowiada historyjki | Kość wdowy — gra nią czasem, oddaje po **3 wygranych** |
| **Kupiec Wawrzyniec** (bogaty gość z miasta) | 18:00–23:00, **tylko w niektóre dni** (ok. co czwarty), **od sławy „Swój chłop”** | 25 / 35 / 50 G | wyrachowany: liczy szanse | gra czasem Kością z Kruczych Skał (kupił od kopacza), **nie oddaje jej** |
| **Bartek Kmieć** (chłop spod Młynówki) | 14:00–21:00 | 5 G | nowicjusz: bierze wszystko, co punktuje, czasem przeoczy strit | Kość z gruszy (sam wystrugał) — oddaje po **2 wygranych** |
| **Nieznajomy w kapturze** (gość bez imienia) | 21:00–24:00, **od sławy „Chluba tawerny”** | **100 G, gra do 3000** | zagadka: mocny, spokojny gracz | ciężka Kość z Kruczych Skał (w co drugiej partii) — oddaje przy **pierwszej wygranej**; gdy już ją masz: **sakiewka 100 G** |

- Każdy rywal ma swoje kwestie: powitanie, reakcje na swoje i twoje pudła,
  gorące kości, duże układy, zapisywanie, wygraną i przegraną. Grum czasem
  się zaśmieje z twojego pudła; Ozzy opowiada o dawnych czasach (i czasem
  bełkocze o piwnicach tawerny).
- **Przeczucie Ozzy'ego** (parametr, domyślnie włączone): raz na jakiś czas,
  gdy trzęsiesz kubkiem, Ozzy mamrocze, co wypadnie — i ma rację („Trzy
  czwórki... hyk... tak mi się widzi.” → „Mówiłem.”). Kości są już wtedy
  rzucone, więc on naprawdę „widzi” wynik. Za pierwszym razem trafia to do
  dziennika jako notatka. To nawiązanie do STORY.md (Ozzy mówi rzeczy,
  których nie mógłby wiedzieć).

![Przeczucie Ozzy'ego: „Mówiłem.”](kosci_ozzy.png)

- Rywal gra z tobą najwyżej kilka partii dziennie: po 3 przegranych (Grum,
  Ozzy), 2 (kupiec, Bartek), 1 (nieznajomy) mówi „Dość na dziś” i wraca
  następnego dnia.
- Siła rywali (policzona na 300 partiach na rywala przeciw rozsądnemu
  graczowi-botowi): bohater wygrywa ok. 48–55 % — gra jest uczciwa, a lepszy
  gracz wygra częściej.

## Sława w tawernie (tablica ogłoszeń)

Jeśli w grze jest tablica ogłoszeń (`QuestBoard.js`), jej **sława** (0–100)
otwiera lepsze gry:

| Sława | Co przy stole |
|---|---|
| 0 Nowy w okolicy, 20 Znajoma twarz | kupiec siedzi przy oknie, ale **nie gra z bohaterem**. Na stole widać podpowiedź: „Przy oknie siedzi bogaty kupiec z miasta, ale gra tylko z ludźmi, których zna.” — a Grum, Ozzy albo Bartek mówią to przy grze |
| **40 Swój chłop** | kupiec siada do gry (25–50 G) |
| 60 Pewna ręka | wieczorem na stole: „W kącie ktoś w kapturze przygląda się stołom. Podobno gra tylko z chlubą tawerny.” |
| **80 Chluba tawerny** | **wielka gra**: Nieznajomy w kapturze, 21:00–24:00, stawka 100 G, gra do 3000. Mówi mało i zagadkowo („Kości nie kłamią. Ludzie kłamią.”, „Każdy kiedyś sięga o jeden rzut za daleko.”). Pierwsza wygrana z nim daje **Kość z Kruczych Skał**, a jeśli bohater już ją ma (np. z tablicy ogłoszeń) — **sakiewkę 100 G** |

Bez tablicy ogłoszeń wszystko działa jak wcześniej: kupiec gra w swoje dni,
nieznajomego nie ma.

![Sława: kupiec gra tylko z ludźmi, których zna](kosci_slawa.png)
![Nieznajomy w kapturze](kosci_nieznajomy.png)
![Pierwsza wygrana z nieznajomym: Kość z Kruczych Skał](kosci_nieznajomy_wygrana.png)

## Stawki i pula

- Przed partią wybierasz rywala i stawkę (strzałki). Stawki większe niż
  zawartość sakiewki są niedostępne; bez złota na najmniejszą stawkę stół
  odmawia („Za mało złota na grę (najmniej 5 G).”).
- Obaj kładą stawkę do puli (monety lecą na środek stołu). Wygrany bierze
  całą pulę: **+stawka na czysto**, przegrany traci stawkę.
- Odejście od stołu w trakcie partii = stawka przepada.
- Partia trwa w czasie gry: **10 minut + 2 minuty za każdą turę** (zwykle
  20–40 minut), więc przy dłuższym posiedzeniu robi się późno i rywale
  odchodzą.

## Kości specjalne

Bohater zawsze ma sześć zwykłych kości. Kości specjalne (trzymane w stanie
gry, **nie** jako przedmioty bazy danych) wkłada się do swojej szóstki przy
stole: wiersz „Twoje kości”, strzałki + O zmienia kość.

| Kość | Wygląd | Działanie (z 60 000 rzutów) |
|---|---|---|
| Zwykła kość | kość słoniowa, ciemne oczka | każde oczko 1/6 |
| Kość szczęściarza | złocista, czerwone oczko jedynki | jedynka ok. 26 % (zamiast 17 %) |
| Kość wdowy | czarna (heban), srebrne oczka | piątka ok. 28 % |
| Kość z Kruczych Skał | ciemny kamień z drobinami, zamiast jedynki wyryty kruk | jedynka ok. 25 %, piątka ok. 19 %, trójka rzadziej (12 %) |
| Kość z gruszy | jasne drewno z usłojeniem | jedynka ok. 20 %, piątka ok. 18 % — skromny talizman |

Skąd: Grum (4 wygrane), Ozzy (3), Bartek (2), Nieznajomy (pierwsza wygrana)
— i z tablicy ogłoszeń, która nagradza kośćmi pod tymi samymi kluczami
(`szczesciarz`, `wdowa`, `grusza`, `krucze`) przez `TavernDice.giveDie`.

Rywale też grają swoimi kośćmi specjalnymi (widać je na stole i w ich
panelu), dopóki nie oddadzą ich bohaterowi.

![Kości specjalne](kosci_specjalne.png)

## Nagrody i statystyki

- Wygrana: pula + trochę doświadczenia: **10 + 1 za każde 5 G stawki**
  (Bartek/Ozzy 5 G: 11, Grum 15 G: 13, Grum 25 G: 15, kupiec 50 G: 20,
  nieznajomy 100 G: 30),
  z podpisem „wygrana w kości”.
- Pierwsza wygrana: notatka w dzienniku („Pierwsza wygrana w kości”).
- Duża wygrana (pula od 40 G): napis u góry ekranu po powrocie na mapę.
- Nowa kość specjalna: napis u góry + notatka w dzienniku.
- Statystyki w `$gameSystem._dice`: partie, wygrane, przegrane, odejścia,
  bilans złota, największa wygrana pula, najlepszy rzut (układ i punkty),
  wyniki z każdym rywalem, posiadane kości i wybrana szóstka.

## Dla twórcy

- **Stół na mapie:** zdarzenie z komentarzem `<Tavern:dice>` na pierwszej
  stronie (albo na stronie aktywnej), wyzwalacz „przycisk akcji”. Gracz
  podchodzi i naciska O. `<Tavern:dice:grum>` — przy tym stole siedzi tylko
  Grum (w jego godzinach). Lista poleceń zdarzenia się nie wykonuje — stół
  otwiera grę.
- **Skrypt:** `TavernDice.start({ opponent: "grum", stake: 15, onEnd: w => {...} })`
  (bez `opponent`/`stake` — stół z wyborem; zwraca `false`, gdy nie stać
  bohatera na stawkę). Wynik `onEnd` (po powrocie na mapę): `{ played, won,
  lost, left, net, games, last }`.
  Dalej: `TavernDice.score([1,1,1,5])`, `TavernDice.giveDie("wdowa")`,
  `TavernDice.dice()`, `TavernDice.stats()`, `TavernDice.isRunning()`,
  `TavernDice.present(godzina, dzień)`.
- **Polecenia wtyczki:** „Stół do gry”, „Zagraj z...” (rywal, stawka),
  „Daj kość specjalną” (np. nagroda za zadanie).
- **Sława:** z `QuestBoard.reputation()` (gdy jest `window.QuestBoard`);
  `TavernDice.fame()`, `TavernDice.locked(godzina, dzień)` — kto jest na
  sali, ale jeszcze nie gra z bohaterem.
- **Parametry:** cel gry (2000), szybka gra (1500) i jej próg (10 G),
  doświadczenie (10 + 20 % stawki), czas partii (10 min + 2 min/turę), próg
  dużej wygranej (40 G), przeczucia Ozzy'ego (tak), zmienna z wynikiem.
- **Rejestracja:** dopisać `TavernDice` w Menedżerze wtyczek (na końcu, po
  TavernShift/Story) — do tego czasu test wczytuje plik sam.
- **Test:** `CDP_PORT=9380 node tests/tavern_dice_test.js` — 55 sprawdzeń
  (punktacja z każdym rzutem 1–6 kości, model, 300 partii na rywala, pełne
  partie w scenie zgodne z symulacją, klawisze i mysz, złoto, sława, kości
  specjalne); zrzuty ekranu `docs/tawerna_zycie/kosci_*.png`.
- **Dźwięki (RTP)** grają z kilku wczytanych raz odtwarzaczy na plik: plik,
  który się nie wczyta, po prostu milczy (zwykłe `AudioManager.playSe`
  zatrzymałoby całą grę komunikatem „Failed to load”). Grzechot kubka i stuk
  kości to krótkie Switch1/Knock w losowej wysokości przy każdym odbiciu,
  monety Coin/Shop1, zapisanie Item1, pudło Miss, gorące kości Fire1 + Flash1,
  duży układ Chime2, przeczucie Ozzy'ego Stare, śmiech Gruma Laugh, wygrana ME
  Item, przegrana Disappointment.