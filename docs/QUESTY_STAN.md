# Questy miasteczka — stan wdrożenia

Stan: 2026-10-06 (później: W1 rozdz. 6 c jako prawdziwa walka z ludźmi Feliksa i rozdz. 7 - cysterna zakonu i dzwon „cztery i dwa”,
W9 rozdz. 6 - prawdy z Warstwy Prawdy w rozmowach, W8 rozdz. 2-6 w górach, w jaskini kopaczy i w Osadzie Milczących; wcześniej tego dnia: stali bywalcy tawerny - Melia, Ozzy i Grum - jako rozmówcy; K22, K33, D6 - turniej w tawernie, D13, W3 rozdz. 1–8,
W4 rozdz. 1–5 - klucz kasztelana otwiera kratę do podziemi, W8 rozdz. 1, K27 z Melią;
wcześniej, 2026-10-05: W1 rozdz. 3–6, W2 rozdz. 5–6, K26, K37, K39, K15 z woźnicą, pięciu nowych mieszkańców). Katalog:
`docs/QUESTY.md`. Kod: `js/plugins/TownQuests.js` (silnik) i `js/plugins/TownQuests_Data.js` (zadania, teksty, nagrody), wpisane na
końcu `js/plugins.js` za TownLife. Testy: `tests/town_quests_test.js`, `tests/w1_chapters_test.js`, `tests/w2_archive_test.js`,
`tests/town_quests2_test.js`, `tests/regulars_test.js`, `tests/regulars_quests_test.js`, `tests/act2_quests_test.js`, `tests/w8_mountains_test.js`.

## Co działa (silnik)

- **Zadania u mieszkańców.** Mieszkaniec TownLife (na mapie miasteczka, w tawernie i w swoim domu) z zadaniem do zaoferowania ma
  nad głową żółte „!”, z rzeczą do oddania — zielony ptaszek. W rozmowie mówi najpierw o zadaniu: oferta z wyborem
  („Przyniosę.” / „Nie teraz.” albo kilka wyjść), przypomnienie (czego brakuje — zawsze **dymek nad bohaterem**, nigdy okno
  wiadomości), oddanie, nagroda. Gdy ktoś nie ma nic do powiedzenia o zadaniach, wita się według Opinii i mówi swoje zwykłe
  zdanie. Jedna sprawa naraz u jednej osoby: póki jego zadanie nie jest skończone, przypomina o nim, zamiast dawać nowe.
- **Lord i dziadek Stach** (Story.js) mówią o zadaniu na początku swojej rozmowy, potem idzie ich zwykła rozmowa (spłata długu).
  Dziadek daje list bez wyboru (w rozmowach fabuły nie ma dodatkowych pytań).
- **Kroki:** przynieś (przedmioty, narzędzia do pokazania, porcje własnej deszczówki, złoto), porozmawiaj, miejsce zadania,
  czekaj, upoluj (szyna `kill`), własne (rozwożenie chleba, podpisy, nocna warta, śledzenie Kuby, dzwon...). Warunki: godziny,
  dzień, dni po innym kroku, pora roku, pogoda, dni bez deszczu, Opinia, inne zadania, flagi, dzień targowy, dzień po promie,
  fabuła. Terminy: przepada albo „spóźniłeś się” (klient się obraża, następny krok).
- **Miejsca zadań** (okienko piekarni, ściany do obwieszczeń, brama południowa, posterunek, kosz żarowy, błysk na Polnej
  drodze; od 2026-10-05 też błysk pierścionka i krata z krukiem na dnie studni - Map118, pompa i szuflada w oranżerii oraz Feliks
  i Kuba przy tylnej furtce nocą - Map024, Księga sygnałów i kroniki w Archiwum - Map119) to zdarzenia wstawiane przez
  `Tawerna.inject` (numery 951–959, na każdej mapie swoje). Są widoczne i działają tylko wtedy, gdy zadanie ich potrzebuje (żółty
  romb). Stoją na znacznikach „Miejsce: …” z `docs/miasta_miejsca_zadan.md`. Pliki map nie są zmieniane.
- **Stali bywalcy tawerny** (od 2026-10-06, `js/plugins/TavernLife_Regulars.js` - nowa część TavernLife, wpisana do `js/plugins.js` za
  TavernLife_Plan): Melia, Dziadek Ozzy i Grum (zdarzenia 2–4 na mapie tawerny; mapy nie były zmieniane) dają zadania i mają własną
  rozmowę. Najpierw mówią o zadaniach (`TownQuests.regularTalk`: oddanie, oferta, przypomnienie, uwaga po zdarzeniu), potem witają się
  i pokazują menu: „Co słychać?” (pora dnia, pogoda, susza, dług dziadka), „Jakieś plotki?” (z prawdziwego stanu gry: flagi zadań,
  targ, prom, obóz), własne tematy i „Bywaj.”. Melia: „Opowiedz o swoich pieśniach”, „Skąd znasz te ballady?” (zaufanie 35),
  „Zaśpiewasz dziś?” (wieczorem); Ozzy: „Postaw mu piwo (3 G)” - raz dziennie „wizja”: pogoda na jutro wprost z planu pogody i czasem
  jeszcze jedna prawda, „Opowiedz o piwnicy” (35); Grum: „Opowiedz o wojnie”, „Skąd jesteś?” (15), „Zagrajmy w coś” (siłowanie albo
  kości). Nocą (23–6) Ozzy śpi: tylko mruczy przez sen. Zadania dokładają swoje tematy do menu (`FX[...].topic` / `topicList`:
  K27 - Melia pod murem, W3 - miód dla Ozzy'ego). Nad nimi żółte „!” i zielony ptaszek jak nad mieszkańcami.
- **Borgar przy barze** (od 2026-10-06): zadania dokładają tematy do jego menu (Story) i do lady (`<Tavern:meal>`) - `FX[...].borgarTopic`
  / `borgarList` (D6: zapis na turniej, W4: stare kamienie, krata); nad Borgarem zielony ptaszek, kiedy ma coś do powiedzenia.
- **Zaufanie stałych bywalców** (0–100: Obcy, Znajomy 15, Kompan 35, Przyjaciel 60, Powiernik 85): pierwsza rozmowa w danym dniu +1
  (do 30), piwo dla Ozzy'ego +2 (do 50), wysłuchana pieśń Melii +1 i napiwek +1 (do 40), gra z Grumem albo Ozzym +1 i wygrana z
  Grumem +1 (do 45/50) - każde raz dziennie; resztę dają zadania (`reward.trust: { melia: 15 }`). Dziennik: Miasteczko - „Stali bywalcy
  tawerny” (zaufanie każdego i co otworzy następny próg). Zapis: stan TavernLife, pole `regulars`.
- **Miejsca, które odpowiadają** bez nowych zdarzeń: furtka ogrodu rycerzy (K33: czapka przez kratę), cokoły posągów w ogrodzie
  (W3: wyryta zwrotka) i stara krata zakonu w piwnicy tawerny (W4: klucz kasztelana) - `Game_Event.list` podmieniane tylko wtedy, gdy zadanie tego potrzebuje. Czapka to obrazek na sprajcie posągu
  (zdarzenie 43); strzał trafia ją przez kratę, kiedy jego linia przechodzi przez głowę posągu (`shot` z Hunting_Weapons), a z bliska
  (w ogrodzie) jest zwykłym celem procy (`Hunting.addTargets`). Przed furtką, twarzą do ogrodu, widok podjeżdża w górę nad mur.
- **Walka z ludźmi** (Humans.js, etap 3 - zrobiony równolegle przez inną sesję): W3 a (porwanie Melii po Nocy Kupały) to prawdziwa walka
  z dwoma bandytami (`Humans.ambush`, znacznik `w3Kupala`; `humansDone` = obroniona, `heroRobbed` = pobity, Grum ratuje Melię); bez
  Humans.js - jak dawniej opisane w dymkach.
- **Zadania, które zaczynają się same** (`autoStart`): K37 - kradzież sakiewki w dzień targowy, kiedy bohater jest obok Feliksa.
- **Uwagi mieszkańców** (`REMARKS`): po ważnym zdarzeniu (Kuba uciekł, śluza otwarta, Feliks aresztowany, sakiewka zatrzymana...)
  mieszkaniec mówi o tym raz, przy pierwszej rozmowie - przed powitaniem.
- **Nagrody:** złoto (część może iść „na dług dziadka” przez `Story.pay`), przedmioty, doświadczenie (Combat), Opinia, notatki i
  poszlaki w dzienniku, flagi na później, premie (buty: `Combat.perk`). Napis u góry: „Nowe zadanie”, „Zadanie wykonane:
  … +15 G · +50 dośw. · Opinia +2”, „Zadanie przepadło”. Szyna: `townQuestAccepted`, `townQuestDone`, `townQuestFailed`,
  `townOpinion`.
- **Dziennik:** zakładka „Miasteczko” — zadania w toku (krok, czego brakuje, termin), Opinia w miasteczku (progi, ostatnie
  zmiany), Kalendarz miasteczka (dni bez deszczu, targ, prom, święta), Sygnały dzwonu, zadania skończone. OK na zadaniu =
  śledzenie w okienku celu („MIASTECZKO”).
- **Zapis:** cały stan w `Tawerna.state("townQuests")` (wersja 1). Nic nie uruchamia się samo przy wczytaniu ani na zmianę dnia:
  sceny poza rozmową (noc u stawu, zasadzka, wynik dzwonu) to dymki nad bohaterem i mieszkańcami.
- **Zasada suszy:** żadne zadanie, wybór ani mieszkaniec nie daje bohaterowi wody. Zadania tylko **zabierają** jego deszczówkę
  (K2, D10) albo każą ją pokazać (K10). Test to sprawdza (żadna nagroda nie jest wodą ani naczyniem z wodą).

## Opinia w miasteczku (0–100, start 10)

| Próg | Nazwa | Co daje w grze |
|---|---|---|
| 0 | Obcy | powitania półsłówkami („Czego?”, „Hm?”) |
| 20 | Bywalec | „A, to ty.”; K14 (dzwonienie za Ambrożego), K38 (nocna warta), w D4 trzecie wyjście (praca dla Ludmiły) |
| 40 | Sąsiad | „Dzień dobry, sąsiedzie!”; D16 (uczeń dzwonnika) |
| 60 | Zaufany | ciepłe powitania |
| 80 | Jeden z nas | „Nasz! Siadaj, mów, co słychać.” |

Rabatów nie ma — w miasteczku nie ma sklepów (tylko sprzedaż Baltazarowi w K16). Spada za złamane słowo (−1 do −3), nocne
włóczenie się przy Kubie (−3), łapówki i nieuczciwe wyjścia.

## Kalendarz

Targ co 7 dni (napis u góry, okrzyki mieszkańców przy straganach), prom co 3 dni (dzień nowych kartek na tablicy zleceń; dzień
później Baltazar skupuje zapasy — K16), sygnały dzwonu (W2). Większe dni (prom z uchodźcami 10/24/38/52, imieniny Lorda 33,
Noc Kupały 42, dożynki 56, Wielkanoc, Wigilia) są w danych i w zakładce „Kalendarz miasteczka”; w grze dzieje się tylko K31 w
dniu 33 — reszta czeka na mapy i sceny (napisane przy dniu w dzienniku).

## Każdy quest z katalogu

zrobione = grywalne od początku do końca; częściowo = grywalne, ale bez części z katalogu; czeka = jeszcze nie w grze.

### Krótkie

| # | Nazwa | Stan | Uwagi / na co czeka |
|---|---|---|---|
| K1 | Węgiel do paleniska | zrobione | przed 9:00 Tadek naprawia najbardziej zużyte narzędzie |
| K2 | Woda do hartowania | zrobione | 2 porcje z wiadra w plecaku albo z bukłaka; 25 G albo 6 gwoździ |
| K3 | Podkowa w słońcu | zrobione | błysk na Polnej drodze 11–14 przy słońcu; rabatu w kuźni nie ma (brak sklepu) |
| K4 | Chleb przed świtem | częściowo | drewno pod okienko piekarni 3:30–5:00 dnia następnego; czeka na: mini-grę „łopata do pieca” |
| K5 | Bochenki do 9:00 | zrobione | codziennie; Ambroży, Wit, Ludmiła, sołtys; plotki w notatkach |
| K6 | Jęczmień do żaren | zrobione | lato i jesień; D2 (młyn) czeka |
| K7 | Myszy w mące | czeka | na: noszenie kota, wnyki we wnętrzu piekarni |
| K8 | Pęknięta beczka | zrobione | poszlaka W1, notatka „Beczka Kuby” |
| K9 | Kłótnia w kolejce | częściowo | rozsądzanie zrobione, ale kłótnię opowiada Kuba (sąsiadkę zastąpił Ignac); czeka na: scenę przy studni (plany dnia) |
| K10 | Smak wody | zrobione | przerobione na suszę: kadź Ignaca zamiast kubka od Kuby, Ozzy nie bierze udziału |
| K11 | Myto przy bramie | częściowo | zapłać 2 G albo przynieś 6 polan; brama nie zatrzymuje (Wit tylko woła „Myto!”) |
| K12 | Łój do latarni | zrobione | „łój” = 1× surowe mięso dzika albo jelenia (albo 2 pochodnie); poszlaka W1 |
| K13 | Sznur dzwonu | zrobione | spóźnienie = w południe dzwon milczy |
| K14 | Dzwonnik ma chore kolana | zrobione | mini-gra dzwonu (6 uderzeń), zła liczba = poszlaka W2; bez wnętrza dzwonnicy |
| K15 | Ostrożnie, kruche | zrobione | skrzynia (wolniejszy chód) dla woźnicy Wojciecha, który 21:20–22:40 czeka z wozem przed bramą południową; postaw / zajrzyj / oddaj Witowi, zapłata nazajutrz |
| K16 | Grzyby po dwakroć | zrobione | handel w dzień po promie, do 10 sztuk, podwójna cena; poszlaka W8 |
| K17 | Obwieszczenie o racjach | zrobione | 4 ściany: tawerna, piekarnia, kuźnia, kantor (zamiast obozu) |
| K18 | Kto ruszył stóg? | czeka | na: sąsiedzi (postacie), ślady przy stogach |
| K19 | Spis obozu | zrobione | trzy osoby (Ludmiła, Ela, Rafał) zamiast pięciu namiotów; Rafał prosi, żeby go nie liczyć |
| K20 | Pierwsza skóra | zrobione | +1 ścięgno przy 3 następnych skórach |
| K21 | Garbnik z lasu | zrobione | rabatu nie ma (brak sklepu) |
| K22 | Struna dla Melii | zrobione | Melia 10–17 (od dnia 2); 2× Ścięgna do Ignaca, struna po godzinie (rzecz spoza bazy: `v:struna`); Melii przed 18:00 tego samego dnia = nowa zwrotka (pierwsza zwrotka W3), Natchniony 4 h, 15 G; później - 10 G bez zwrotki (zwrotka przychodzi w W3 rozdz. 1); zaufanie Melii +15 |
| K23 | Chowany na rynku | czeka | dzieci są; na: kryjówki i sterowanie pozycją dzieci (TownLife) |
| K24 | Latawiec na dzwonnicy | czeka | na: latawiec jako cel procy |
| K25 | Proca dla Bronka | czeka | na: puszka na murze jako cel |
| K26 | Pierścionek w studni | zrobione | Zosia; zejście z boku studni po 2× Lina (zdarzenie mapy), błysk w kałuży na Map118 za dnia i nie w deszcz (dymki), zamurowany kanał z krukiem = poszlaka W1 (`w1_well`); Opinia +3 |
| K27 | Konik dla Eli | zrobione | drewno + nóż - albo (od 2026-10-06) temat u Melii 17–21:30 „Zaśpiewasz Eli kołysankę pod murem?”: tego wieczoru scena w tawernie pusta (pieśń Melii niedostępna), nazajutrz Ludmiła albo Ela kończą zadanie; zaufanie Melii +5 |
| K28 | Kocioł dla obozu | zrobione | 2 porcje kapuśniaku / gulaszu / zupy grzybowej; zimą Opinia podwójnie |
| K29 | Rana Rafała | zrobione | o świcie albo późnym wieczorem (Rafał wtedy wychodzi), nie przy kapralu |
| K30 | Koszyki dla dworu | zrobione | dzień targowy, Feliks 7–8:30, Lordowi do 9:00; 5 G + 5 G na dług |
| K31 | Imieniny Lorda | zrobione | od Feliksa (dni 26–33), w dniu 33 Lordowi; 40 G albo na dług. Łagodniejszy list z dnia 40 czeka na Story.js |
| K32 | List od dziadka | zrobione | dni 5–20; Lord pyta o kamienie z krukiem |
| K33 | Czapka Ozzy'ego | zrobione | Ozzy 17–23 (od dnia 3); czapka na głowie lewego posągu (5,9) w ogrodzie rycerzy; strzał z procy albo łuku przez kratę zamkniętej furtki z pola (5,17) na wprost posągu, przy zwężonym kółku (z innego pola - pudło); czapka spada tuż za kratę, O przy furtce = sięgasz przez pręty (z kluczem W2 wystarczy podejść); Ozzy: piwo (przedmiot 81), zaufanie +10, poszlaka `w2_ozzy` |
| K34 | Ogień w stogu | czeka | na: ogień na mapie (burza) |
| K35 | Śnieg na dachu | czeka | na: zaspy na dachu piekarni |
| K36 | Kot na dachu piekarni | czeka | na: noszenie kota |
| K37 | Sakiewka Lorda | zrobione | zaczyna się samo: dzień targowy od dnia 10, 8:30–10:30, przy Feliksie (Lord nie chodzi na targ - sakiewkę dworu nosi Feliks); pościg za Szymkiem (on 5 pól/s, bohater idzie 3,2, biegnie 7,5); złapany: oddaj (50 G na dług) / puść (zaufanie obozu) / zatrzymaj (80 G; przy świadkach Opinia −15 i straż patrzy); nie złapany = przepada |
| K38 | Nocna warta | zrobione | przerobione: posterunek przy bramie twierdzy (Kuba idzie nocą do stawu, Wit nocą siedzi w wieży); poszlaka W1 |
| K39 | Kości z targu | zrobione | Bartek w tawernie 14–21, Lucjan Kość tylko w dni targowe przy prawym straganie 9:40–14; partia w TavernDice (Lucjan zawsze gra obciążoną kością); podmianę widać od Czujności 10; zdemaskuj (Lucjan znika, Opinia +4, Bartek 5 G) / weź 10 G |
| K40 | Woda na pranie (Marta, Podgrodzie) | zrobione | 2 porcje własnej deszczówki (zabiera wodę, nie daje); 5–17, od dnia 2 |
| K41 | Zioła dla babki Jadwigi (Podgrodzie) | zrobione | 3× Krwawnik + 2× Pokrzywa → 2× Opatrunek |
| K42 | Kram Józka (Podgrodzie) | zrobione | 2× Deski + 4× Gwoździe, młotek → 2× Lina, 10 G |
| K43 | Drewno na ognisko (Darin, Podgrodzie) | zrobione | 6× Drewno, 17–22 → notatka „Opowieść Darina” (Serce pod twierdzą na wyspie) |
| K44 | Lina dla Zbycha (Podgrodzie) | zrobione | 2× Lina → 3× Węgiel drzewny |
| K45 | Włókno na pętle (Rysiek, Podgrodzie) | zrobione | 6× Włókno → 2× surowe mięso zająca, rada: sidła tylko z przynętą |
| K46 | Suchar dla Franka (Podgrodzie) | zrobione | 1× Chleb → notatka „Tajemnica Franka” (Kuba nocą z beczkami) |

### Długie

| # | Nazwa | Stan | Uwagi / na co czeka |
|---|---|---|---|
| D1 | Buty od szewca | zrobione | 3 skóry → ćwieki u Tadka → miara o 7:00 po 2 dniach → buty po 2 dniach; Buty łowcy (skradanie +20%) albo Podkute (zimno, mniejszy wysiłek). Dostajesz Skórzane buty — osobne przedmioty czekają na bazę danych |
| D2 | Mąka bez młyna | czeka | na: kierat / wnętrze młyna |
| D3 | Ręka kowala | zrobione | 3 dni: podkowy (kute u Tadka) dla Wita, gwoździe sołtysowi, nóż Ignacowi; spóźnienie = obrażony klient; 60 G albo zostaw Tadkowi (Opinia +6). Przepis na okutą tarczę czeka |
| D4 | Złodziej o świcie | zrobione | zasadzka 5:20–5:50 (C), Ela przy obozie, 3 wyjścia (trzecie od Opinii 20); rysunek Eli (W9). Ela nie biega po mapie o świcie, pies nie tropi — czeka na plan dnia |
| D5 | Wataha pod bramą | zrobione | tropy o świcie, 2 wilki na Polnej drodze nocą, przewodnik na Skraju lasu; 80 G + Opinia albo przysługa Wita |
| D6 | Siłacz z targu | zrobione | **decyzja autora 2026-10-06: siłowanie tylko w tawernie.** Tadek przy kowadle (od dnia 4); 3 treningi z Grumem w różne dni (siłowanie w tawernie), zapis u Borgara przy barze (2 G - temat w jego menu i przy ladzie), Baltazar daje 40 G za przegraną pierwszą walkę (raz, przed turniejem - także wieczorem w tawernie); turniej w najbliższy targ co najmniej 3 dni później, **wieczorem 18–22 przy stole do siłowania w tawernie** (Borgar woła walki; ten sam stół i „Siłujmy się” u Gruma): woźnica Wojciech (poz. 0), Tadek (2), Grum (4) - mini-gra siłowania TavernLife z innym rywalem (bez treningu każdy +1); mistrz: 50 G, Opinia +5, „Pas siłacza” (rzecz spoza bazy, udźwig +8 przez `Combat.carryBonus`), zaufanie Gruma +10; sprzedana walka: flagi `d6Sold`, `balthazarTrust` (W5); wzięte pieniądze i wygrana: `d6Crossed` (Baltazar pamięta); kto odejdzie w połowie turnieju, dostaje to, co wygrał do tej pory |
| D7 | Serce kowala | czeka | na: róża w ogrodzie dworu, scena wyznania, wesele |
| D8 | Wielki targ | czeka | na: mini-gra targowania, stragan gracza |
| D9 | Spis beczek | czeka | wnętrza już są (mapy 102–110), ale drzwi są otwarte 6–21, a gospodarze siedzą w domach głównie nocą; na: godziny i rzeczy do znalezienia (beczka Hanki, piwnica kantoru) |
| D10 | Gorączka Eli | zrobione | wywar ziołowy + 1 porcja własnej deszczówki, noc, rano zdrowa; skrót: lek Baltazara za 60 G (pieczęć wojska → poszlaka W6). Czuwanie przy ognisku i łaty na stroju czekają |
| D11 | Ognie na murach | zrobione | 5 wieczorów zamiast 7; zalany kosz przy bramie wschodniej, mokre ślady do kantoru; powiedz Witowi albo weź 30 G od Baltazara. Sabotażysta jako postać czeka |
| D12 | Ślady kota | czeka | na: kot z nocną trasą |
| D13 | Zakład Ozzy'ego | zrobione | Ozzy 18–23:30 (od dnia 5), tylko gdy plan pogody ma deszcz albo burzę jutro lub pojutrze - Ozzy podaje dzień i godzinę z planu; pojutrze pęka piec Hanki, za 3 dni koń kaprala gubi podkowę (rozmowa z Hanką / z Witem tego dnia, okrzyki przy przejściu); zakład u Gruma: 10 G za każdą przepowiednię widzianą na własne oczy (przegapiona = nic); na koniec Ozzy trzeźwieje i mówi prawdę o bohaterze (sakiewka co do grosza, rzecz w torbie, dni do terminu); +100 dośw., zaufanie Ozzy'ego +15 |
| D14 | Zboże na wojnę | zrobione | przy bramie wschodniej (nie na polu dziadka): oddaj (50 G odpisu z długu) / łapówka 20 G / schowaj (po 3 dniach Wit zagląda do torby: kara 40 G) |
| D15 | Dzieci nocą | czeka | na: dzieci wymykające się nocą (plan dnia), dziura w murze, ogród |
| D16 | Uczeń dzwonnika | zrobione | od Opinii 40, 4 lekcje (6, 12 albo 18), coraz szybciej; klucz do dzwonnicy jako flaga (minimapa bez zmian) |
| D17 | Petycja do Lorda | zrobione | 5 z 6 podpisów (Tadek, Hanka, Kuba, Ignac, Ambroży, Baltazar za przysługę), Wit odmawia; Lord obniża podatek |
| D18 | Płaszcze przed zimą | zrobione | jesień od dnia 70; obóz (Opinia +10, płaszcz dla ciebie) albo Feliks dla straży (90 G, Opinia −3) |
| D19 | Kość z Kruczych Skał | czeka | na: Nieznajomy przy kościach jako zleceniodawca, ogród |

### Wątki

| # | Nazwa | Stan | Uwagi / na co czeka |
|---|---|---|---|
| W1 | Woda spod Kruczych Skał | zrobione | rozdz. 1 (poszlaki: K8, K10, K12, K38, K26 — wystarczą 3), 2 (nocą za Kubą do stawu), 3 (Kuba na rynku: mówi wszystko / płaci 5 G w dni targowe / ucieka na tydzień), 4 (krata z krukiem na dnie studni + Tadek), 5 (oranżeria nocą: strażnik, Feliks przy furtce, pompa na włazie, rysunek śluzy), 6 (ujawnij z sołtysem w dzień targowy / po cichu Lordowi / szantaż Feliksa / milczenie). **6 c (2026-10-06): napad na Polnej drodze to walka z ludźmi Feliksa** (Humans.ambush, znacznik `w1Feliks`: pałka i nóż, łucznik po 40 G od Feliksa): wygrana - Feliks nie płaci, rysunek zostaje, wraca wybór rozdz. 6 bez drugiej umowy (puszczony wolno = świadek, przy ujawnieniu Opinia +3); przegrana - obrabowany (zasada Humans.js) i bez rysunku, dalej rozdz. 7; ucieczka - czekają znowu za 3 dni. **Rozdz. 7 (Akt II)**: Zasuwa główna w Wielkiej cysternie (piętro 30, szyna `undergroundSluice`), potem Ambroży 6-21: „cztery i dwa” - mini-gra dzwonu (6 uderzeń) albo dzwoni Ambroży; studnia pełna, ale pod kluczem sołtysa - bohater dalej 2 nabrania dziennie; młyn, Kuba rozwozi racje, Opinia +20, uwagi mieszkańców; koniec wątku |
| W2 | Kod dzwonu | częściowo | rozdz. 1–4 jak wcześniej, ogród rycerzy (furtka - zdarzenie 39), rozdz. 5 (siedem uderzeń z wieży w południe - mini-gra dzwonu; 12:00–12:30 w ogrodzie cienie wskazują płytę, płyta się odsuwa), rozdz. 6 (Archiwum - Map119: Księga sygnałów = wszystkie sygnały w dzienniku; kroniki: zabierz - Baltazar daje 300 G / zostaw / oddaj Ambrożemu - Opinia +3). Rozdz. 7 „Jedno pytanie” i 8 „Alarm” czekają (Noc Pytania, Akt III) |
| W3 | Pieśń o Kruczych Skałach | zrobione | zaczyna się po 6 balladach Melii i K22; rozdz. 1 sen Melii; rozdz. 2–6 sześć zwrotek w dowolnej kolejności (teksty w `TownQuests_Data.js`, notatka „Siódma ballada”): struna (K22), Ambroży (po D16, za dnia), Ludmiła (po K27 albo D10, 17–20:30), cokół lewego posągu (ogród rycerzy, za dnia), kronika rodu (Lord przy drzwiach po spłacie połowy długu albo kamerdyner - Feliks lub Teodor - za dzban miodu pitnego), Ozzy (wieczorem dzban miodu, o 2:00 przez sen, z wynajętym pokojem) - ta ostatnia opisuje drogę w dół; rozdz. 7 po północy „skąd Melia to zna” (3 sposoby); rozdz. 8: Noc Kupały (lato, dzień 14 - dzień 42) przy bramie południowej + walka o Melię / tylko dla Borgara 23–1 / spalić słowa. Skrót przez piętra 1–10 to na razie flaga `w3Shortcut` (czeka na podziemia) |
| W4 | Krew kasztelana | częściowo | **wersja zwarta (2026-10-06) - tak otwiera się krata do podziemi.** Zaczyna się po spłacie długu (rozdział 1). Rozdz. 1: Borgar przy barze („Zapytaj o stare kamienie pod tawerną”) - krata zakonu za jego beczkami, pół klucza znad baru „na szczęście”; rozdz. 2: druga połowa zakopana u stóp kamiennego kopca z krukiem na podwórzu dziadka (Map020, 8,6; Kamienna łopata, godzina kopania); rozdz. 3: Tadek łączy połówki (1× Żelazo, 2× Węgiel drzewny) - klucz nazajutrz rano: „Klucz kasztelana” (rzecz spoza bazy); rozdz. 4: klucz otwiera kratę w piwnicy (Map009 15,2 - `Underground.open()`, przełącznik 11; póki W4 trwa, zamknięta krata podpowiada klucz); rozdz. 5: Borgar słyszy o kracie i mówi zdanie swojego rodu „Nie pytam o to, czego nie chcę wiedzieć.” (hasło strażnika z piętra 10; notatka „Słowa Borgara”). Dalej czeka: Lord chce być pierwszy, konfrontacja z Borgarem i Komnata Serca (Akt III, W9) |
| W5 | Towary z kontynentu | czeka | flagi już są (K15, K16, D11); na: wnętrze kantoru z piwnicą nocą, obóz przemytników |
| W6 | Ludzie z promu | czeka | K19, K27, K28, K29, D4, D10, D18 dają już flagi zaufania obozu; na: fale uchodźców, list gończy, głosowanie |
| W7 | Dwór z kamieni twierdzy | czeka | na: decyzja autora (wariant A/B), wnętrze dworu |
| W8 | Żelazna Pięść | częściowo | rozdz. 1: po wygranej z Grumem na rękę i w kości - pytania o góry (notatka, zaufanie +10). **Rozdz. 2-6 (2026-10-06, mapy Gór Map013, Jaskini Map014 i Osady Map120)**: 2 - wyprawa o świcie (jedzenie 2, woda w bukłaku, zioła; Grum przy `grum_przewodnik_start`), kamieniołom tego samego dnia (`kamieniolom_znak`, 50 G); 3 - obóz kopaczy, Grum przy niszy Marka; 4 - list „Świadków nie zostawiać” (Grum po miodzie / dwóch piwach, ściana wynajętego pokoju 22-24, skrzynia dowódcy nocą po cichu); 5 - Akt II: Brama Milczących (przełącznik 16), Grum przy kręgu; 6 - dwie z trzech (Marek `marekSaved` z W6 - czeka, kroniki W2, siłowanie „na honor” w tawernie) = Grum sojusznik (`grumAlly`, przełącznik 15), frakcja (100 G, `w8Faction`, przełącznik 15) albo walka przy `tunel_wejscie` (Humans.js: najemnik „Grum”; pokonany - `grumGone` / zabity - `grumDead`, znika z tawerny i ze stołów do kości; bohater pobity - `w8Lost`, przełącznik 15). Rozdz. 7 (Akt III, drzwi tawerny) czeka |
| W9 | Serce Twierdzy | częściowo | **rozdz. 6 (2026-10-06)**: zaczyna się od pierwszej prawdy z Warstwy Prawdy (`Underground.truths()`, szyna `undergroundTruth`); prawdy o 18 osobach jako wybór „Powiedz prawdę.” / „Przemilcz.” / „Nie teraz.” - mieszkaniec raz dziennie przed swoją rozmową, Melia/Ozzy/Grum temat w menu, Borgar przy barze, Lord i dziadek (też prawda o Mruczku) przed rozmową fabuły; skutki: Opinia, zaufanie bywalców, flagi `truthTold_<kto>` / `truthKept_<kto>` i własne, uwagi (Ludmiła, Ela, Zosia); Feliks po W1 a/b nieobecny. Rozdz. 1-5 i 7-8 to podziemia i Komnata Serca (Underground.js); wątek zostaje otwarty, póki są prawdy do powiedzenia |

Razem: 56 zadań w grze - 49 grywalnych w całości (35 krótkich, w tym 7 z Podgrodzia - test `tests/podgrodzie_quests_test.js`; 12 długich; wątki W1 i W3), 3 krótkie częściowo (K4, K9, K11) i 4 wątki częściowo (W2 rozdz. 1–6, W4 rozdz. 1–5, W8 rozdz. 1–6, W9 rozdz. 6); reszta katalogu czeka. Test `tests/town_quests_test.js` (59 sprawdzeń, ok. 4 min) przechodzi od początku do końca K1, K2, K4, K5, K8, K10, K12, K13, K14, K16, K17, K19, K27, K28, K29, K31, K32, D1, D4, D5, D10, D16, W1 (rozdz. 1-2) i W2 (rozdz. 1-4); `tests/w1_chapters_test.js` (29 sprawdzeń) - W1 rozdz. 3-6 ze wszystkimi wyborami; `tests/w2_archive_test.js` (13) - W2 rozdz. 5-6; `tests/town_quests2_test.js` (24) - nowi mieszkańcy, K26, K15, K37, K39; `tests/regulars_test.js` (30) - rozmowy stałych bywalców, zaufanie, K22, K33, K27 z Melią, W8 rozdz. 1; `tests/regulars_quests_test.js` (34) - D13 (z przegapionymi przepowiedniami), D6 (turniej w tawernie: mistrz i sprzedana walka), W3 (wszystkie zwrotki, trzy zakończenia, walka o Melię). `tests/w4_key_test.js` (16) - W4: Borgar, kopanie, kuźnia, krata otwarta kluczem, zejście do Ruin Zamku, słowa Borgara. `tests/w1_chapters_test.js` ma od 2026-10-06 35 sprawdzeń (napad w 6 c jako walka: wygrana ze świadkiem, przegrana, ucieczka); `tests/act2_quests_test.js` (29) - W1 rozdz. 7 (zasuwa, dzwon sam / Ambroży, studnia dalej 2 nabrania), W9 rozdz. 6 (prawdy: Hanka, Kuba, dziadek i Mruczek, Lord, Melia, Borgar, Feliks nieobecny), popiersie Wieśka; `tests/w8_mountains_test.js` (34) - W8 rozdz. 2-6 na mapach gór ze wszystkimi wyjściami.

## Nowi mieszkańcy (2026-10-05, TownLife_Data.js)

| Klucz | Kto | Plan dnia | W zadaniach |
|---|---|---|---|
| `zlodziej` | Szymek, głodny chłopak z obozu pod murem | obóz → róg rynku 8:20–12 → przy straganie Hanki → schody na taras → obóz od 20:30 | K37 (złodziejaszek) |
| `gracz` | Lucjan Kość, wędrowny gracz w kości | **tylko w dni targowe** (`when: "market"`): przy prawym straganie 9:40–14, potem wyjeżdża | K39 |
| `bartek` | Bartek Kmieć, chłop spod Młynówki | róg rynku 9:30–14, tawerna 14–21 („Miejsce: gosc_6”) | K39 (daje zadanie) |
| `woznica` | Wojciech, woźnica | kantor 8–11:30, tawerna 11:30–15 („gosc_7”), wóz przed bramą południową 21:20–22:40 | K15 |
| `straznik` | strażnik dworu (Map024) | za dnia przy koszu żarowym przed dworem (15,16), nocą 21–5 obchód straz_1..4 | W1 rozdz. 5 |

TownLife v1.2.0: `when` mieszkańca i czwarte pole wpisu planu to warunki (`"market"`, `"!market"`, albo nazwa z
`TownLife.addCondition` - TownQuests dodaje `"w1Water"`: nocne wyprawy Kuby po wodę kończą się po otwarciu śluzy); `TownLife.setGone(klucz,
true | dzień | false)` - mieszkańca nie ma (na zawsze albo do dnia; zapis `Tawerna.state("townLife")`: Feliks po W1 a/b, Kuba na tydzień
po W1 3c, Lucjan po K39); `TownLife.hold(klucz, true, [x, y])` - inna wtyczka prowadzi mieszkańca (pościg K37). Dotychczasowi
mieszkańcy żyją bez zmian. Mapy nie były zmieniane (miejsca `stragan_kosci`, `woz_pld`, `straz_dzien` są domyślnymi polami w danych).

## Stali bywalcy tawerny - decyzje do potwierdzenia (2026-10-06, „rób wszystko”)

- **D6 w tawernie** (decyzja autora 2026-10-06: „siłowanie tylko tawerna”) - wieczorem w dzień targowy 18–22 przy stole do
  siłowania, zapis u Borgara; rywale: woźnica Wojciech, Tadek, Grum. Pas siłacza to
  rzecz spoza bazy przedmiotów (`v:pas`, udźwig +8) - bez zmian w `Items.json` (inne sesje go zmieniają). Popiersia rywali w scenie
  siłowania: Wojciech People2_7, Tadek Actor3_1 (RTP, jak inne popiersia).
- **D13 tylko wtedy, gdy plan pogody ma deszcz albo burzę w ciągu 2 dni** (inaczej Ozzy nie ma czego przepowiadać); zakład: Grum
  płaci 10 G za każdą przepowiednię widzianą na własne oczy, za przegapioną nic (bohater nie płaci).
- **K33**: czapka na lewym posągu; Ozzy „wie”, choć nie wychodzi z tawerny (Grum to sprawdził) - zagadka do W9.
- **W3**: zwrotka z kroniki dworu przez Lorda przy drzwiach (po spłacie połowy długu) albo przez kamerdynera za dzban miodu - bez
  wnętrza dworu; ostatnia zwrotka (droga w dół) od Ozzy'ego; ognisko Kupały na ulicy przed bramą południową od strony miasta (za bramą
  nie ma łąki na mapie) - ognisko tylko w opisie, bez grafiki; Natchniony po W3 a/b +15%, po c - 5% i 2 h krócej.
- **W8 rozdz. 1** otwierają wygrane z Grumem na rękę i w kości (bez progu Sławy 40 i dnia 20 z katalogu).
- **Zaufanie** to osobna miara dla trójki bywalców (nie Opinia w miasteczku ani Sława w tawernie).
- **W4 jako klucz do podziemi** (autor zostawił to nam): po spłacie długu; druga połowa klucza u kopca z krukiem na podwórzu
  dziadka (Map020 8,6), Tadek łączy połówki nazajutrz; krata otwiera się kluczem przez `Underground.open()` (Underground.js bez
  zmian - podmieniana jest tylko rozmowa z zamkniętą kratą, kiedy W4 trwa). Borgar na końcu mówi hasło strażnika z piętra 10.

## Rozdziały Aktu II - decyzje do potwierdzenia (2026-10-06, „działaj dalej”)

- **W1 6 c - napad**: dwóch ludzi Feliksa (pałka + nóż, jeśli Humans.js ma nożownika), trzeci - łucznik - gdy Feliks zapłacił już
  40 G („im więcej wycisnąłeś, tym więcej ludzi”); tylko na Polnej drodze, od 14. dnia po umowie. Przegrana zabiera też **rysunek śluzy**
  (bez dowodu wątek idzie od razu do rozdz. 7); wygrana przywraca wybór rozdz. 6 bez drugiej umowy; puszczony wolno = świadek (+3 Opinii
  przy ujawnieniu). Ucieczka z drogi: czekają znowu po 3 dniach.
- **W1 7 - cysterna**: Zasuwa główna nie otwiera się ręką - trzeba dzwonu (napis z Underground_Data „30b”); bohater może zadzwonić sam
  (+50 dośw.) albo poprosić Ambrożego. **Woda skromnie**: studnia na rynku pełna, ale pod kluczem sołtysa (racje dla domów), bohater
  dalej 2 nabrania dziennie (`WELL_BONUS` = 0 bez zmian); flagi `cisternOpen`, `sluiceHalf` (epilog podziemi: „Woda znów płynie pod
  rynek - mniej, niż by chcieli”), `millRuns`, `kubaHonest`. Opinia +20 jak w katalogu.
- **W9 6 - prawdy**: raz dziennie na osobę (żeby nie zasłaniać zadań), prawda o Mruczku mówi się dziadkowi; skutki małe i
  niejednoznaczne (prawdy nie rozstrzygają wielkich wątków STORY.md); przemilczenie nic nie zmienia poza zapisem. Wątek W9 zostaje
  otwarty (nie kończy się na rozdz. 6).
- **W8 2-6**: Grum „idzie” z bohaterem jako postać stojąca w miejscu zadania (bez chodzenia za nim); wyprawa = świt + kamieniołom tego samego
  dnia (bez nocy przy `nocleg` - mapa ją umożliwia, zadanie nie wymaga); list ma trzy drogi (miód / ściana pokoju / skrzynia dowódcy - tej
  ostatniej nie było w katalogu, podsunęła ją mapa); Osada otwiera się dopiero w W8 rozdz. 5 (przełącznik 16 - bez W8 zostaje zamknięta);
  siłowanie „na honor” tylko w tawernie (decyzja autora), poziom Gruma +1 (4-6), raz dziennie; Grum w walce **może się poddać** (nie
  `noSurrender`) - bohater decyduje: puścić (odpływa promem) albo dobić; wygrana walka zostawia zawał, sojusz / frakcja / przegrana go
  przebijają (przełącznik 15). Marek uratowany to flaga `marekSaved` - ustawi ją W6 rozdz. 7 (jeszcze nie ma), więc dziś „dwie z trzech” =
  kroniki + honor.
- **Rzutki**: furman Wiesiek ma popiersie RTP **People2_7** (ogorzały woźnica z goglami na czole) - nieużywane nigdzie indziej, odkąd
  woźnica w siłowaniu ma Woznica_Bust; People1_5 było twarzą sołtysa.

## Decyzje autora (2026-10-05)

- **Studnia po W1 a/b**: dalej 2 nabrania dziennie („Dalej 2 dziennie”) - rusza młyn, studnia daje mało (`WELL_BONUS = 0`).
- **Feliks znika** (W1 a/b): jego miejsce zajmuje **nowy kamerdyner Teodor** (postać w stylu bohatera) - przejmuje nocne
  spłaty długu, kwestie przy Lordzie i listy (w toku). Zlecenia Feliksa (K30, K31) i K37 nie są już wtedy dostępne.
- **K37**: zostaje z Feliksem i sakiewką dworu (Lord nie przychodzi na targ).

## Jak dopisać zadanie (TownQuests_Data.js)

Każde zadanie to jeden obiekt w tablicy `QUESTS`. Najprostsze — „przynieś komuś rzeczy”:

```js
{
    id: "K99", kind: "K", title: "Gwoździe dla Ignaca", giver: "garbarz", icon: 88,
    where: "garbarnia", when: "6:30–17", desc: "Ignacowi skończyły się gwoździe do kopyt.",
    offer: {
        cond: { hours: [6.5, 17], day: 3 },                 // kiedy daje zadanie (tu: od dnia 3, gdy jest przy garbarni)
        say: ["Skończyły mi się gwoździe. Przyniesiesz dziesięć?"],
        yes: "Przyniosę.", no: "Nie teraz.",
        accept: ["Dziesięć. Nie dziewięć."], decline: ["To poczekam."]
    },
    steps: [
        { type: "bring", to: "garbarz", need: [[88, 10]], hours: [6.5, 17],
          text: "Przynieś Ignacowi 10× Gwoździe (garbarnia).",     // to widać w dzienniku i w okienku celu
          remind: ["Gwoździe, chłopcze."], hero: ["> Masz. Dziesięć."], done: ["Dziesięć. Dziękuję."] }
    ],
    reward: { gold: 10, xp: 50, opinion: 1 }
}
```

- `giver` — klucz mieszkańca z `TownLife_Data.js` (`kowal`, `piekarka`, `woziwoda`, `kapral`, `dzwonnik`, `kupiec`, `soltys`,
  `garbarz`, `feliks`, `bronek`, `zosia`, `ludmila`, `ela`, `rafal`), stały bywalec tawerny (`melia`, `ozzy`, `grum`) albo `lord` /
  `grandpa` (wtedy `offer.auto: true` — bez wyboru).
- Linijki: zwykły tekst mówi ten, z kim rozmawiasz; `"> tekst"` — bohater; `"@kowal: tekst"` — ktoś inny (jeśli stoi obok).
- `offer.options` zamiast `yes/no`: `then: "accept" | "decline" | "refuse" | "close"`, `cost` (złoto), `need`, `reward`, `step`.
- Krok: `type` `bring` / `talk` / `spot` / `wait` / `kill` / `custom` / `pause`; warunki `hours`, `dayRel`, `dayIs`,
  `after: [krok, dni]`, `clear`, `deadline: { day, hour, late: "fail" | "next" }`; potrzeby `need`, `needAny`, `tools`,
  `toolsAny`, `water` (oddaje własną deszczówkę), `showWater` (tylko pokazuje), `gold`; po kroku `gives`, `vgives`, `reward`,
  `choice: { options: [{ label, say, reward, flag, perk }] }`.
- Rzeczy, których nie ma w bazie (list, skrzynia, koszyki): `VITEMS` i `["v:klucz", n]` w `need`.
- Nowe miejsce na mapie: wpis w `SPOTS` (mapa, numer 951–959 — na każdej mapie inny, x, y, `wall` dla ściany, `deco` — papier,
  błysk, tropy, zalany kosz) i krok `{ type: "spot", spot: "klucz", ... }`.
- Coś nietypowego (własna rozmowa, zegar, sprawdzenie): nazwa w kroku (`talk`, `tick`, `check`, `spotFx`, `fx`, `sayFx`,
  `rewardFx`) i funkcja o tej nazwie w `FX` w `TownQuests.js`.
- Od 2026-10-05: `autoStart: "nazwa"` - zadanie bez oferty, które zaczyna się samo, kiedy `FX[nazwa]()` zwraca prawdę (K37);
  `ch` w kroku - numer rozdziału wątku w dzienniku; `wet` - dymek miejsca w deszcz; w `SPOTS` `img: [arkusz, indeks, kierunek, wzór]`
  (obrazek na stronie miejsca), `solid` (blokuje jak postać), `nomark` (bez rombu); `REMARKS` - zdanie mieszkańca raz po zdarzeniu
  (`flag`, `gone`, `back`).
- Od 2026-10-06: `reward.trust: { melia: n }` - zaufanie stałego bywalca; w handlerze `topic(q, r, st, key)` / `topicList(...)` - temat
  w menu rozmowy bywalca (zamiast przejmować całą rozmowę); `t.v` w stanie zadania - własne słowa do `{...}` w tekście kroku
  (D6 `{market}`, D13 `{p1}`, W3 `{got}`, `{miss}`, `{kupala}`); w zadaniu `verses`, `hints`, `rivals` - dane W3 i D6.
- Od 2026-10-06 (później): w `SPOTS` `marker: "klucz"` (+ `dx`, `dy`) - miejsce staje na znaczniku mapy „Miejsce: klucz” (x/y to tylko zapas,
  gdy znacznika nie ma; tak stoją miejsca W8 w górach); w kroku `vars: "nazwa"` - `FX[nazwa].vars(q, r)` liczy słowa `{...}` tekstu w chwili
  wyświetlenia (W8, W9); `TownQuests.grumAway()` - Grum zniknął po W8 (TavernLife i TavernDice go nie pokazują); szyna `townTruth { who, how }`
  (W9: prawda powiedziana / przemilczana).
- **Nigdy** nie dawaj bohaterowi wody (zasada suszy) — test `town_quests_test` to sprawdza.
- Po dopisaniu: `node tests/run.js town_quests_test` (z `CDP_PORT=9433` albo swoim portem).
