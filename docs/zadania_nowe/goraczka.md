# Gorączka w przytułku - projekt długiego wątku (tylko projekt, 2026-11-11)

Roboczy znacznik: **W-Gorączka** (numer W17+ do nadania przy wdrożeniu, żeby nie zderzyć się z innymi nowymi wątkami).
Dokument projektowy: żadnego kodu ani danych gry nie ruszano.

## 1. Pitch, długość, start, związek z fabułą

Po drugiej fali uchodźców (dzień 25) i głosowaniu w ratuszu (dzień 26) w obozie, a potem w przytułku zaczyna się gorączka. Miasto
zamyka ulicę, dzwon bije powoli, wieczorem wychodzi nocny patrol. Siostra Stefa nie nadąża, a brata Kleofasa i babki Jadwigi nie
stać na tyle naparów. Bohater biega po zioła, nosi czystą wodę (swoją deszczówkę - wody w mieście nie ma na zbyciu) i odkrywa, że
chorują tylko ci, którzy piją z **Czerpalni wschodniej** - starej cysterny przy wschodnim murze, z której Kuba rozwozi beczki dla
biednych (przytułek, obóz), bo rynkowa studnia jest dla mieszczan na przydział. Obok cysterny, w nowej Garbarni przy stodole,
robi skóry **Wawrzyn Płowy** - garbarz z drugiej fali, któremu miasto oddało budynek, żeby uchodźca „zarabiał na chleb”. Ścieki z kadzi
(wapno, garbnik, ałun) idą do starego rowu murarskiego, który przesiąka do cysterny. Pierwszy podejrzany jest jednak **Ignac**, bo
jego garbarnię wszyscy znają i bo w K10 bohater sam czuł jego kadź. Na końcu wybór: **ukarać** Wawrzyna czy **pomóc mu przenieść
warsztat**.

- **Długość:** 5 rozdziałów, ok. 8-9 dni gry (od dnia 30 do ok. 38). Rozdział 1 w jednym dniu, 2-3 po dniu, 4-5 po dwa.
- **Start:** dzień >= 30 **i** W6 po głosowaniu (`campInside` albo `campOutside` - jedna z flag; jeśli głosowania jeszcze nie ma,
  wątek czeka) **i** bohater był choć raz w obozie lub u Stefy. Pierwszy kontakt: Stefa albo Ludmiła przy rynkowej beczce, ok. 8:00.
- **Nie koliduje z istniejącym:** D39 „Gorączka z promu” (prom 7, medyk Konstanty Mak, flisak Gerwazy) i K74 „Obchód”
  (powrót Maka z falą 4, dni 52-58) to inne, późniejsze lub wcześniejsze zdarzenia. K74 zostaje; jeśli W-Gorączka jest skończona,
  Mak mówi „Słyszałem o waszym rowie. Dobrze, że ktoś sprawdza wodę, zanim zacznie kroić chorych” (jedna kwestia, flaga
  `gorBylo`), a obchód z trzema namiotami zostaje bez zmian. D10 „Gorączka Eli” daje przepis na **Wywar ziołowy** i jest w tym
  wątku wiedzą z dziennika (kto go nie zrobił, dostaje przepis od Stefy w rozdz. 1).

### Decyzja: kto jest winny - Ignac czy właściciel nowej Garbarni

Wybieram **nowego garbarza Wawrzyna Płowego** (wschodnia Garbarnia, x112-116 y79-88), a Ignac zostaje **fałszywie podejrzanym i
ekspertem**. Uzasadnienie:

1. **Charakter Ignaca** (K10, K20, K21, D1, D18, D3): rzemieślnik surowy i uczciwy, uczy bohatera, szyje płaszcze dla obozu.
   Zrobienie z niego truciciela zepsułoby pięć zadań i jego rabaty; jako podejrzany z nosem fachowca daje scenę, w której bohater go
   broni (tłum pod jego drzwiami), i jest naturalnym świadkiem - po zapachu poznaje „wapno i ałun z cudzej kadzi” (w K10 czuł
   „róża i żelazo”: tamto to ślad W1, ten to nowy).
2. **Wschodnia Garbarnia jest nowa i bez właściciela** (drzwi „Skóry moczą się w kadziach - zamknięte”), a dane domu mówią o
   „garbarni z suszarnią skór” dla garnizonu. Brak jej w planach dnia (TownLife) - nie wchodzimy nikomu w drogę.
3. **Związek z W6:** Wawrzyn przypływa z drugą falą (dzień 25), więc jest uchodźcą. To czyni wybór końcowy prawdziwym dylematem
   (kara dla biedaka z obozu kontra zdrowie miasta) i pasuje do wyniku głosowania: przy `campInside` mieszka w obozie pod murem
   i obóz go broni; przy `campOutside` mieszka na Podgrodziu, a do Garbarni chodzi przez bramę z przepustką od Wita.
4. **Susza:** garbarz moczy skóry w wodzie z przydziału, więc nie wylewa jej „na zbyciu”; ścieki z kadzi (kilka wiader dziennie)
   idą do rowu, bo nie ma gdzie ich wylać, a nikt nie dał mu osadnika. Winna jest bieda i brak wody, nie złość.

### Stan W6 a ten wątek

| Stan W6 | Gdzie leżą chorzy | Gdzie stoi obóz | Jak zamyka się ulicę |
|---|---|---|---|
| `campInside` | nowy **Przytułek w mieście** (nowe wnętrze) + namioty pod murem | x77-91 y97-100 | ulica południowa między Cechem a Przytułkiem (x90-99 y89-96) |
| `campOutside` | **Przytułek na Podgrodziu (Map202, istnieje)**, Stefa tam jest | Podgrodzie | brama zachodnia + dojście od Garbarni do bramy; miasto „pilnuje bramy” |

Wspólne wszędzie: źródło zarazy (Czerpalnia wschodnia), Wawrzyn, Ignac, rów, wybór końcowy. Stefa (`opiekunka`, Map111) w wariancie
`campInside` jest na czas wątku przesunięta do miejskiego Przytułku (`TownLife.hold`), a Podgrodzie zostaje z babką Jadwigą (`znachorka`).

## 2. Rozdziały

Skróty: **O** = akcja/OK, wybory strzałkami + O (dymki SpeechBubbles). Wszystko klawiaturą.

### Rozdz. 1 „Pierwsi chorzy” (dzień 30, 8:00-17:00)

- **Gdzie/kto:** rynek przy studni (Kuba Woziwoda 7-14) -> Przytułek (miejski albo Map202) -> obóz. Stefa, Ludmiła, Szymek, Ela.
- **Co robi gracz:**
  1. Ludmiła (albo Stefa przy beczce) woła bohatera: „Szymek leży od rana, dwoje dzieci Haliny też. Stefa sama nie da rady.”
     Dymek, dziennik: „Gorączka w obozie”.
  2. W Przytułku Stefa pokazuje pierwszych trzech chorych: Szymek (K37 - ten sam chłopak), Staś (syn Haliny), stary Gaweł (żebrak).
     Rozmowa wybiera, co zrobić najpierw (kolejność nie wpływa na wynik, tylko na teksty).
  3. Zadanie: **Wywar ziołowy** (przepis z D10: 2x Krwawnik, 2x Pokrzywa, 1x Dziki czosnek, 1x Miód). Kto go nie ma - Stefa podaje
     przepis. Zioła zbierane w lesie i na łące (istniejące zbieractwo), gotowane w kociołku Stefy albo na własnym ognisku.
  4. Brak wody: Stefa nie ma jej do naparu. Bohater dolewa **2 porcje własnej deszczówki** (z bukłaka/wiadra; brak = popup
     `Tawerna.popup.need`, nie okienko). Pierwszy wywar daje ulgę tylko Szymkowi - reszta słabnie.
  5. Wieczorem sołtys Bronisław z Witem ogłaszają: **ulica zamknięta, godzina policyjna od 20** (scena S1).
- **Awansuje:** wywar podany trzem chorym (flaga `gorWywar1`) i scena S1 obejrzana albo przespana (scena odgrywa się tak czy tak).
- **Porażka/alternatywa:** brak wody - wątek czeka, nic nie przepada; spóźnienie po 20 - patrol zawraca bohatera spod ulicy (popup),
  dalej przez bramę/inną trasę albo z przepustką (patrz rozdz. 2).
- **Dziennik:** „W obozie zaczęła się gorączka. Szymek i dzieci Haliny leżą w przytułku. Stefa potrzebuje ziół i czystej wody. Miasto
  zamknęło ulicę.”

### Rozdz. 2 „Zioła i dzwon” (dzień 31-32)

- **Gdzie/kto:** las i łąka (zioła), Podgrodzie - babka Jadwiga (`znachorka`), Kaplica (Map178) - brat Kleofas, tawerna - Wanda
  (łaziebna), Borgar. Wit przy zamkniętej ulicy.
- **Co robi gracz:**
  1. **Przepustka:** żeby przejść przez zamkniętą ulicę z lekami, bohater potrzebuje glejtu od Wita (kapral: „Masz Opinię 20+ albo
     pracujesz dla Stefy? Idź”). Opinia < 20 - Wit żąda 10 G albo przepustkę wystawia Stefa po rozdz. 1. (Przepustka = przedmiot
     „Przepustka kwarantanny”, znika po wątku.)
  2. **Trzy zbiórki:** Jadwiga prosi o dziurawiec i kozłek (łąka Omszała / Skraj lasu - istniejące punkty zbieractwa), Kleofas o
     świeczki i czysty len na okłady (zdobyte u szwaczki Doroty albo z lnu własnej uprawy), Wanda o gorący wrzątek - pożycza
     kocioł z łaźni tawerny. Dowolna kolejność, razem potrzebne dwie z trzech.
  3. **Rozniesienie:** wywar i okłady do trzech namiotów/łóżek (O przy każdym, ok. 20 sekund).
  4. **Gaweł umiera** (noc 31->32), jeśli bohater nie przyniósł mu wywaru przed 20:00 dnia 31 (wtedy zostaje, ale blady). Scena
     S2 „Dzwon dla Gawła” - tylko gdy zmarł. Bez „karania” gracza dłużej niż Opinią -2 i smutnym tonem.
  5. Ostatnia rozmowa dnia: Stefa mówi, że chorują **tylko ci, którzy piją z beczek Kuby**, nie ci, którzy kupują na rynku.
     Hint, nie rozwiązanie.
- **Awansuje:** wręczone dwie z trzech zbiórek (`gorZiola`) i trzy rozniesienia.
- **Porażka/alternatywa:** za mało ziół - Stefa gotuje rozcieńczony wywar, chorzy dłużej leżą (mniej wsparcia na koniec, patrz 6).
- **Dziennik:** „Zioła od Jadwigi, okłady od Kleofasa. Stefa zauważyła, że chorują ci, którzy piją wodę z beczek. Skąd te beczki?”

### Rozdz. 3 „Kto pije, ten choruje” (dzień 32-33)

- **Gdzie/kto:** rynek (Kuba, wóz z beczką), Czerpalnia wschodnia (x~115 y~70, przy „Wózku z beczką”), dom Ignaca (west, 6,89),
  Garbarnia Ignaca (15,85), Ignac, sołtys Bronisław, tłum.
- **Co robi gracz:**
  1. **Lista chorych:** w dzienniku/zakładce wątku przybywa notatka: kto choruje (obóz, przytułek, dwie rodziny z sąsiedztwa
     przytułku, Staś), kto nie (tawerna, mieszczanie z rynkowej studni, Stefa pije z własnego kubka). Bohater stwierdza to,
     pytając trzech ludzi (rozmowy, jak K10/K9 - zwykłe „porozmawiaj”).
  2. **Kuba i beczki:** Kuba (7-14 przy studni) mówi: dla biednych nalewa „na wschodzie, ze starej cysterny, bo na rynku racje się
     kończą”. Kuba nie wie, że woda się zmieniła; od trzech dni „pachnie jakoś kwaśno”.
  3. **Zapach i smak:** bohater nabiera wiadrem z beczki (O przy beczce, istniejące „nabieranie”), **wącha** (O): „wapno i coś
     gorzkiego”. Picie nie jest potrzebne (nie karzemy gracza chorobą - patrz ryzyka).
  4. **Podejrzenie Ignaca:** o 17:00 sołtys z dwunastką mieszczan idzie pod garbarnię Ignaca (scena S3 „Pod garbarnią”). Bohater
     wybiera: **Stań za Ignacem** (Opinia 20+ albo dowód: lista chorych z kroku 1 - sołtys ustępuje) / **Pozwól im sprawdzić**
     (Ignac pokazuje swoją kadź, przy okazji mówi „to nie moje, to z cudzej kadzi: wapno i ałun”; Opinia 0) / **Nic**
     (tłum wybija szyby, Ignac zamyka garbarnię na 3 dni i traci Opinię; pozostałe rozdziały działają, tylko bez jego świadectwa -
     jest wtedy mniej dowodów w rozdz. 5, patrz porażka).
  5. Ignac, ocalony albo nie, mówi bohaterowi, żeby szukał „wapna, które nie ma prawa tam być - tam, gdzie woda wchodzi do cysterny”.
- **Awansuje:** zrobiona lista (`gorLista`) + zapach beczki (`gorZapach`) + scena S3 rozstrzygnięta w którąkolwiek stronę.
- **Porażka/alternatywa:** jw. - brak Ignaca jako świadka zmniejsza liczbę dowodów w rozdz. 5, ale wątek nie blokuje się.
- **Dziennik:** „Chorują ci, którzy piją wodę ze wschodniej cysterny. Woda pachnie wapnem. Ignac mówi, że to nie jego kadź.”

### Rozdz. 4 „Rów” (dzień 33-34)

- **Gdzie/kto:** Czerpalnia wschodnia, rów murarski między cysterną a nową Garbarnią (x108-118 y70-90, nowe pola „płyta rowu” i
  „studzienka”), tył Garbarni Wawrzyna. Wawrzyn Płowy, Ignac (jeśli sojusznik), Szymek (jeśli wyzdrowiał - szpieguje).
- **Co robi gracz:**
  1. **Szukanie wlotu:** bohater idzie wzdłuż rowu od cysterny; trzy punkty z dymkiem „Biały osad na kamieniach” (O). Dowód 1:
     biały osad w rowie (wapno).
  2. **Łopata:** płyta rowu za Garbarnią jest zasypana; kopanie **łopatą** (istniejące narzędzie, popup potrzebny: „Potrzebujesz
     łopaty”). Dowód 2: zbity osad i rura z kadzi (widok: ściek Wawrzyna).
  3. **Wawrzyn:** zjawia się przy kadziach (6:30-19, plan dnia). Rozmowa w dymkach, trzy podejścia: **zapytaj spokojnie** (przyznaje:
     „Nie miałem gdzie wylać. Dostałem budynek bez zbiornika i dwa dni na pierwszą dostawę dla wojska.”), **przyciśnij** (rzuca
     skórą i ucieka na 1 dzień - wraca z kapralem Witem, scena napięcia), **poproś Ignaca** (Ignac przychodzi, wącha, mówi
     fachowo: „Kadź z wapnem i ałunem. Robi się skórę szybko, ale robi się ją tu, gdzie woda nie ma gdzie iść.”).
  4. Dowód 3 do wyboru: słoik osadu (zbieranie, O przy rowie) do pokazania Kleofasowi/Stefie - jedna wzmianka w dzienniku.
- **Awansuje:** dwa z trzech dowodów + rozmowa z Wawrzynem (`gorDowod`, `gorWawrzyn`).
- **Porażka/alternatywa:** bohater nie ma łopaty - popup, wraca z narzędziem (warsztat robi kamienną łopatę); złapany nocą
  przy płycie przez patrol (dla kar po 20:00) - dostaje pouczenie i Opinię -1 (bez kary więzienia).
- **Dziennik:** „Wapno i ałun z Garbarni Wawrzyna idą rowem do cysterny. Wawrzyn nie chciał nikogo truć - nie miał gdzie wylać ścieków.”

### Rozdz. 5 „Sąd i wybór” (dzień 35-38)

- **Gdzie/kto:** Ratusz (Map104) lub plac przed ratuszem (ratusz_przed 83,48), Stefa, Ludmiła, Wawrzyn, Ignac, Wit, sołtys, Baltazar
  (dostawca skór dla wojska, jeśli W5 sprawdzone - 1 kwestia).
- **Scena S4 „Zebranie”** (dzień 35, 15:00): sołtys zwołuje mieszkańców, bohater mówi (dymki z wyborami).
- **Wybór:**
  - **A. Ukarz** (donieś Witowi/sołtysowi): Wawrzyn w dybach na rynku jeden dzień, Garbarnia zamknięta na 7 dni, grzywna 20 G
    (Wit). Miasto spokojne: Opinia +4. Obóz (i Ludmiła) milczy; `campInside` - obóz chłodny do końca W6 (Ludmiła: „To było konieczne,
    ale nie dziękuję”); `campOutside` - Darin cię odprowadza wzrokiem. Garnizon mniej skór: przychylność -3.
  - **B. Pomóż przenieść:** bohater i Wawrzyn przenoszą kadzie w głąb wschodniego skraju, poza rów, i budują **osadnik**
    (2 dni: 12x Deski, 8x Kamień, 6x Gwoździe, 2x Lina; pomoc: Tadek pożycza gwoździe, Leon deski - jedna wymiana) i zasypują rów
    wapnem. Wawrzyn przyznaje się publicznie, miasto wymierza mu 10 G pokuty, Opinia +6, obóz (Ludmiła, Ela) ufa bohaterowi,
    Wawrzyn uczy bohatera przepisu **„Garbowanie bez wapna”** (patrz 6). Garnizon: skóry płyną dalej, przychylność +2.
  - **C. (porażka obojętności):** bohater milczy (albo nie przyszedł na zebranie): sołtys bierze za winnego Ignaca (jeśli nie ma
    dowodów 2/3), garbarnia Ignaca zamknięta na 7 dni, K20/K21/D1/D18 niedostępne w tym czasie; po 4 dniach rów sam wysycha
    (susza), gorączka cofa się bez zasługi bohatera, Wawrzyn zostaje; Opinia -5, brak nagród z A/B.
- **Zakończenie:** rano po wyborze Stefa liczy chorych: kto przeżył, kto wstał (patrz 6, zależne od jakości zbiórek z rozdz. 2).
  Dzwon bije raz, wolno (scena S5 „Cisza”), ulica otwarta, patrol schodzi.
- **Dziennik:** zapisane zakończenie (A/B/C) i liczba uratowanych.

## 3. Sceny (storyboardy)

**S1 „Zamknięcie ulicy” (rozdz. 1, wieczór dnia 30, 18:30-20:00, ok. 40 s gry).** Pasy sceny (CleanHUD.sceneBars), muzyka miasta
cichnie (Atmosphere: wiatr + odległy dzwon). Kamera na ulicy południowej (x92 y92). Wit i dwóch strażników wystawiają dwa wozy
jako zaporę (rekwizyty-zdarzenia, 2 sztuki, bez niewidzialnych ścian - same wozy blokują), sołtys czyta ogłoszenie z kartki
(dymek), Ambroży zaczyna bić dzwon powoli (jedno uderzenie na ćwierć godziny - **nie** schemat W2 „cztery i dwa”). Mieszkańcy
wchodzą do domów drzwiami (zasada „nikt nie znika”): Hanka, Kuba. Dym z komina Przytułku, okna zapalają się. Dźwięk: kroki,
trzask zaworów, dzwon. Dymki: sołtys „Do rana nikt nie wchodzi i nie wychodzi.”, Wit „Ktoś pyta - mów, że kapral kazał.”

**S2 „Dzwon dla Gawła” (rozdz. 2, rano dnia 32, 7:00, ok. 25 s).** Gaweł leży na legowisku pod okapem Przytułku; Stefa przykrywa
go kocem; Kleofas czyta krótką modlitwę (dymek); dzwon bije raz, długo. Na ulicy pusto: tylko wrony Klimat_Miasta. Brak muzyki, tylko
wiatr. Kamera zostaje na Stefie. Kolejny dzień miasto wygląda spokojniej.

**S3 „Pod garbarnią” (rozdz. 3, 17:00-17:30, ok. 40 s).** Sołtys, Kuba i kilkoro mieszczan (te same postaci z TownLife, zatrzymane
`hold`, dochodzą do (14,86)) stoją przed garbarnią Ignaca, który wychodzi z fartuchem i pęsetą. Dymki: Ignac „Ja? Moja woda
jest z przydziału jak wasza.”, sołtys „A smród kto ma?” Kamera przechodzi od tłumu do twarzy Ignaca i do bohatera, gdy pojawia się wybór.
Pochodnie w dłoniach dwóch mieszczan (lekkie światło - „każde światło to ogień”). Trwa 40 s, przerywalne wyborem.

**S4 „Zebranie” (rozdz. 5, dzień 35, 15:00, ok. 60 s).** Plac przed ratuszem, rząd 8 mieszkańców stoi (istniejące postacie z
TownLife w trybie `stand`) półkolem. Wawrzyn z opuszczoną głową, obok Ludmiła z Elą. Sołtys prowadzi, bohater wybiera
przedstawiony wyżej. Kamera krąży wolno po twarzach (przesunięcia kamery w ruchach zdarzeń), muzyka ledwie słyszalna.

**S5 „Cisza” (rozdz. 5, rano po wyborze, ok. 25 s).** Wit zdejmuje wozy z zapory (ruch wozów), Ambroży bije raz; Stefa wychodzi
z Przytułku i otwiera okna; kilkoro dzieci wychodzi na próg w kocu. Światło pierwsze słońce, dym z komina Przytułku.

**Nocny patrol (stałe tło rozdz. 1-5, wieczór 20-5).** Dwóch strażników (istniejący model `straznik` z TownLife) obchodzi
trasę ulica południowa - brama - plac z pochodniami i wraca; bohater może iść z nimi (w dniu 33) - jedno zadanie opcjonalne:
„Obejdź ulicę” (O przy trzech punktach patrolu, nagroda: Opinia +1, wzmianka Wita „jak chcesz pilnować, zgłoś się rano”).

## 4. Nowe postacie, przedmioty, rekwizyty, wnętrza

### Postacie (styl bohatera: biedny wieśniak, podarte ubranie, bose stopy; popiersia - zestaw RTP jak u reszty)

| Kto | Rola | Wygląd (PL) | Plan dnia |
|---|---|---|---|
| **Wawrzyn Płowy** | garbarz z drugiej fali, nowa Garbarnia (x112-116) | chudy ok. 40 lat, skórzany fartuch, podwinięte rękawy z wapiennymi plamami, boso, zawiniątko surowych skór | 4:30 obóz (wzgl. Podgrodzie), 6:30-19 przy kadziach Garbarni (`garbarnia_przed` 114,89), 12-13 posiłek w obozie, wieczór obóz |
| **Staś** | syn Haliny (W6), pierwszy chory | dziecko ok. 6 lat, szara koszula | leży w Przytułku (wątek), potem w obozie |
| **Gaweł** | stary żebrak (istnieje jako opisana postać Stefy: „miska dla starego Gawła”), tu pierwszy ciężko chory | jak `zebrak` | w Przytułku od rozdz. 1 |

Pozostali **już istnieją i dostają tylko linie/miejsca wątku**: Stefa (`opiekunka`), babka Jadwiga (`znachorka`), Wanda (łaziebna w
tawernie), Kleofas (kaplica), Ignac (`garbarz`), Kuba (`woziwoda`), sołtys (`soltys`), kapral Wit (`kapral`), Ambroży (`dzwonnik`),
Ludmiła, Ela, Szymek (`zlodziej`), Halina, Darin, Hanka, Borgar, strażnicy.

### Przedmioty
- **Przepustka kwarantanny** (znika po wątku, ikona zwój, 0 G, nie sprzedawalna).
- **Słoik osadu z rowu** (przedmiot-dowód, rozdz. 4, znika po rozdz. 5).
- **Wywar ziołowy** i **okłady** - istniejące/proste (D10); okład z lnu = Len + woda (można użyć istniejącego opatrunku z lnu,
  jeśli jest - sprawdzić).
- Opcjonalnie nagroda: **Przepis „Garbowanie bez wapna”** (szybsze, tańsze oprawianie skór w garbarni gracza: -1 Ścięgno w przepisie
  skórznia; do zweryfikowania w `Bron_Data.PRZEPISY.tannery`).

### Rekwizyty map
- Dwa **wozy-zapory** (zdarzenia z obrazkiem, `Occupy`, tylko gdy zapora aktywna; to nie „rzeczy do wzięcia”).
- **Pasy białego płótna** na drzwiach domów chorych (3 domy; zwykła dekoracja).
- **Kocioł z parą** (wrzątek) przed Przytułkiem - istnieje jako kocioł Stefy; para = efekt Klimat.
- **Płyta rowu** i **studzienka** przy rowie (2 małe zdarzenia, nie wyglądają na przedmioty).
- **Biały osad** na rowie (nakładka 1 kafel, 3 punkty).
- **Legowiska** w Przytułku (słoma jak w Map202).

### Wnętrza
- **Nowy Przytułek miejski (nowa mapa ok. 22x14, kopia stylu Map202):** 8 łóżek w dwóch rzędach, kocioł, półka z ziołami, stół
  siostry, okna ze słońcem, światło świec. Używany w `campInside`. Wejście: drzwi (97,104), dziś zamknięte.
- **`campOutside`:** Map202 (Przytułek Podgrodzia) + 3 dodatkowe łóżka wstrzyknięte zdarzeniami przez wątek.
- **Garbarnia wschodnia:** bez wnętrza (rozdz. 4 dzieją się z tyłu i na ulicy) - drzwi zostają zamknięte.
- **Łaźnia (x94-99 y70-73):** bez wnętrza; w rozdz. 2 stoi przed nią kocioł z wrzątkiem (wizualnie para), Wanda daje wrzątek tam
  albo w tawernie.

## 5. Animacje i grafika

| Co | Czym | Status |
|---|---|---|
| Postać Wawrzyna: 4 kierunki + krok (arkusz `$Npc_Wawrzyn`) | PixelLab (próbka w `goraczka_probki`), potem przeskalowanie do formatu postaci gry | próbka zrobiona |
| Popiersie Wawrzyna | RTP-podobne, jak reszta | do zrobienia (narzędzia popiersi) |
| Staś, Gaweł | istniejące arkusze (`$Npc_Dziecko`, `$Npc_Zebrak`) | istnieją |
| Wozy-zapory | PixelLab obiekt albo przeróbka „Wóz z sianem” (nowy wóz bez siana) | do zrobienia |
| Płótna na drzwiach, osad na rowie | skrypt (kafelki, nakładka 1 kafel) | skrypt |
| Para z kotła, dym z komina Przytułku | Klimat_Miasta (istnieje: dym) | istnieje |
| Dzwon (powolne uderzenia) | istniejący dźwięk dzwonu (W2, Atmosphere) | istnieje |
| Wnętrze Przytułku (kafle + rekwizyty) | skrypt budujący mapę wnętrz (`tools/wnetrza`) + istniejące kafle Winlu | skrypt |
| Wykrywanie chorych: znacznik „gorączka” nad głową (kropla potu) | animacja 3 klatki, skrypt | skrypt |

## 6. Nagrody i konsekwencje

Ekonomia (długu 2500 G do dnia 60, `docs/AUDYT_PRZEJSCIA.md` sekcja 3): cały wątek daje **ok. 120-160 G** + dośw. 260, tyle co
średni długi wątek (W5, 2 noce po 20 G). Nie przekracza budżetu.

| Źródło | Nagroda |
|---|---|
| Rozdz. 1 | 10 G od Stefy, dośw. 40 |
| Rozdz. 2 | do 20 G (zależnie od zbiórek), Opinia +2, dośw. 50 |
| Rozdz. 3 | Opinia +2 (broniony Ignac: +1 zaufania i **rabat 5% u Ignaca**, już istniejący wzorzec K40), dośw. 50 |
| Rozdz. 4 | dośw. 60, przedmiot-dowód |
| Rozdz. 5 A | 20 G od sołtysa, Opinia +4, przychylność garnizonu -3 |
| Rozdz. 5 B | 40 G od Wawrzyna/miasta, Opinia +6, przepis „Garbowanie bez wapna”, nowa Garbarnia jako **działający sklep skóry** (Wawrzyn sprzedaje wyprawioną skórę 24 G, kupuje surową po 9 G jak skup - bez wpływu na ekonomię), Ludmiła i Ela cieplejsze, dośw. 100 |
| Rozdz. 5 C | Opinia -5, brak nagród; Ignac zamknięty 7 dni |

**Jakość zbiórek (z rozdz. 2) -> liczba uratowanych:** przy pełnych zbiórkach wszyscy chorzy (6) wstają; przy połowie - 5;
przy braku - 4 i Gaweł zawsze umiera. Wpływa na tekst Stefy i **Opinię +1/-1** (nie ma „game over”).

**Wpływ na W6 (Ludzie z promu):** `campInside` + A -> flaga `gorKaraObozu`, Ludmiła przy Wigilii (dzień 96) chłodniejsza (tylko tekst),
Opinia obozu nie zmienia głosowania, które już było. `campOutside` + B -> dodatkowa 1 kwestia Darina o „wapnie i dobrym sąsiedztwie”.
Rafał/Marek/wydawanie - bez zmian; w W6 `Szymek` pozostaje, jeśli był w K37.

## 7. Implementacja

- **Wtyczki/dane:** `Goraczka.js` + `Goraczka_Data.js` (**wątek na silniku Watki.js**, jak W4/W5: kroki `cond/step/act` w danych,
  teksty w `js/teksty/goraczka.txt` z formatem z `docs/WATKI_DANE.md` 3.1). Rekwizyty przez SPOTS i `show: "nazwa"` w TownQuests
  (zakres id zdarzeń wolny do wskazania - proponuję sprawdzić i przydzielić np. 780-799 w Map008, id 3200+ w Przytułku).
  Plany dnia: dopisać `gorWawrzyn` i `gorChorzy` w `TownLife_Data.js` (warunki `when: "gorOn"`), `TownLife.hold` dla Stefy,
  strażników (patrol), sołtysa i tłumu w S3/S4.
- **Mapy:** nowe wnętrze Przytułku miejskiego (budowane skryptem jak `tools/wnetrza`), markery „Miejsce:” w Map008: `czerpalnia_wsch`,
  `row_1..3`, `plyta_rowu`, `zapora_a`, `zapora_b`; dla Map202: `chory_1..3`. Zapora zamyka ulicę zdarzeniami-wozami (żadnych niewidzialnych ścian).
- **F9 („Wyspa i fabuła”):** wiersze `Gorączka: rozdz. 1..5`, `Gorączka: wynik A/B/C`, `Gorączka: skok dnia`, `Gorączka: wyzeruj`.
- **Testy:** `tests/goraczka_test.js` (po wzorcu `w4_borgar_test`): start od dnia 30 przy `campInside` i przy `campOutside` (dwa
  przebiegi), rozdz. 1-5, wybór A, B i C, dowody z rowu, Gaweł (umiera/nie), zachowanie przepustki, brak kolizji z K74/D39/D10 i z
  W2 (dzwon), sprawdzenie wydajności sceny S1 (liczba aktywnych zdarzeń).
- **Wydajność:** zero skanów na klatkę - stan chorych to licznik w stanie wątku; zapory to 2-4 zdarzenia; tłum S3/S4 = istniejące
  postacie z `hold`, nie nowe zdarzenia; Para z kotła z Klimat_Miasta (efekt istniejący).
- **Rozmiar:** **M-L** (wnętrze + 2 postacie + 5 scen + dwa warianty W6).
- **Ryzyka:** (1) dzwon: kolizja z W2 (schemat „cztery i dwa”) - użyć innego odstępu i **nie** wołać `Dzwonnica` jako sygnału W2;
  (2) wariant `campOutside` wymaga drogi bohatera przez bramę - sprawdzić przejścia po zamknięciu; (3) wnętrze Przytułku miejskiego jest
  nowym kosztownym elementem (można zrobić tylko Map202 i w `campInside` zlecić chorych tam - wtedy S nie wchodzi do miasta, ale
  scena z ulicą zostaje); (4) „bohater nie choruje” - decyzja otwarta, tu nie ma choroby bohatera; (5) czystość wody (nie pić z
  beczki) - system potrzeb zna „wodę z przydziału”, trzeba pilnować, żeby pitny stan beczek nie zmienił się trwale po wątku.

## 8. Pytania do gracza
1. Czy Wawrzyn (nowy garbarz, uchodźca) jako winny, a Ignac jako fałszywie podejrzany - zgoda? (Alternatywa: winny Ignac - wtedy trzeba przepisać jego charakter.)
2. Czy zrobić nowe wnętrze miejskiego Przytułku (L), czy chorzy zawsze na Podgrodziu w Map202 (S)?
3. Czy Gaweł może umrzeć (smutna scena S2)? Czy bohater może sam zachorować (osłabienie na 1 dzień)?
4. Wybór końcowy: wystarczą A i B (z C jako brakiem wyboru), czy dodać trzeci, „szemrany” (Wawrzyn płaci 40 G za milczenie)?
