# Wesele w Złotym Kuflu - projekt wątku (W18)

Stan: 2026-11-11, **sam projekt** (żadnych zmian w kodzie ani danych). Siostrzany wątek: `jarmark.md` (W17) - rozdz. 9 tego dokumentu mówi, jak się mają do siebie.

## 1. Pitch, długość, start, związek z fabułą

**Pitch.** Woźnica Wojciech i szwaczka Dorota Igła biorą ślub - i chcą wesela w „Złotym Kuflu”. Borgar (który „nie lubi pytać”) nie
umie odmówić, a cały ciężar spada na bohatera: jedzenie, muzyka Melii, ozdoby sali, **plan stołów**, żeby zwaśnione rody nie wylały
sobie zupy na głowy. W dniu wesela wszystko idzie prawie dobrze - przemowy, taniec, tort Hanki - aż **pan młody znika po toaście**,
a w sali wybucha **bójka**. Reszta nocy to poszukiwanie Wojciecha po wszystkich piętrach tawerny (piwnica, browar, sala gier, piętro
gości, taras apartamentów), z gagami na każdym kroku. Wątek ma być **pogodny i śmieszny**; ciemniejsze motywy zostają po stronie jarmarku.

**Długość:** 4 dni gry (dni **19-22**; poranek 23 to epilog), 10 rozdziałów, 6 scen. Prawie wszystko w tawernie (Map001, 25, 26).

**Start:** dzień **19** (dzień promu), 9:00-18:00 przy barze u Borgara (żółte „!”). Warunki: Opinia miasteczka >= 20, Renoma karczmy >= 40,
zaufanie Melii >= 15 („Znajomy”), W1 rozdz. 3 zrobiony (bohater zna Dorotę z K40/K30 bądź sołtysa), brak aktywnego W15/W16 w
bieżącej księdze gości tak, by karczma miała wolną salę (W15 trwa od 13, ale wesele zajmuje tylko salę i scenę, nie pokoje). Jeśli
bohater nie weźmie zadania do końca dnia 20, **wesele i tak się odbywa** (skromnie, w tle - stoły ustawione przez Borgara, Wojciech
znika bez bójki, wraca rano), bez nagród i bez skutków dla jarmarku (patrz rozdz. 9).

**Związek z fabułą główną.** Wesele jest odpoczynkiem pomiędzy Aktem I a II (fala W6 dnia 25 tuż po). Pomaga zbudować zaufanie bywalców
(Melia, Grum, Ozzy), Renomę karczmy (próg 60 „Apartament Złoty”) i dwie konkretne rzeczy dla jarmarku (rozdz. 9). Nie zmienia flag W1-W16.

## 2. Postacie

### Istniejące
- **Wojciech, woźnica** (`woznica`) - **pan młody**. Dziś: kantor 8-11:30, tawerna 11:30-15, wóz przed bramą południową 21:20-22:40, bierze udział w K15 i w
  siłowaniu D6. W dniach 19-23 plan Wojciecha przejmuje wątek (`TownLife.hold` / `setGone` na czas wesela). Jego dymek: gadatliwy, lubi
  dowcipy o koniach.
- **Dorota Igła** (`szwaczka`) - **panna młoda**. Spokojna, niewzruszona do chwili, gdy plan stołów pęka.
- **Ciotka Stefa** (`opiekunka`, przytułek) - opiekunka Doroty, „generał” wesela: przychodzi z listą wrogów i swoją rodziną.
- **Borgar** (gospodarz, bar, zgoda na salę), **Melia** (muzyka, scena), **Grum** (ochrona/bójka), **Ozzy** (wizja o panu młodym).
- **Hanka Mączna** (tort, chleb), **Tadek Młot** (kowal; wrogowie: Kuba), **Kuba Woziwoda**, **Ambroży**, **Kapral Wit** (obecni na weselu; Wit
  łagodzi bójkę), **Ignac**, **Bartek Kmieć** (wygrywa pierścień w kości), **Lucjan Kość** (dzień targowy 21 - kawalerski), **Mietek Kwaśniak** (wuj-kuzyn pana młodego
  i wróg Borgara od piwa - ziarno dla jarmarku), **Agata** (przekupka; wróg Hanki), **Leon Dłuto**, **Halina** (wdowa), **Janek** (rybak, jeśli jest w tawernie).
- **Brat Kleofas** udziela ślubu (zejdzie z klifu, rzadki gość; jeśli nie może - zastępuje go sołtys Bronisław). Kapliczka na Map178 jest tło: ceremonia
  odbywa się przy kominku sali, bo „kaplica ma dziurawy dach” (żart Borgara).

### Nowe
| klucz | kto | rola |
|---|---|---|
| `rodzina_p1..p6` | krewni panny młodej (6 statystów) | szwaczki, praczka, chłopiec z ręką w misce - siedzą przy stołach, jedna waśń z grupą pana młodego |
| `rodzina_m1..m6` | krewni pana młodego (6 statystów) | woźnice, flisacy, dwóch wuj-hałaśliwych |
| `pierscien` | rekwizyt pierścień | obrazek na ziemi (nie wygląda na przedmiot do zabrania - mały „lśniący punkt” tylko w wątku) |
| `kot` | kot Borgara (istniejący: kot) | gag w beczce |

Statyści = istniejące 4 „ciała puli” z `Podroznicy` (tych samych 4 arkuszy) + ewentualnie 2 nowe PixelLab; żadnych nowych imion poza
„krewnymi”. **Wojciech i Dorota mają już arkusze mieszkańców** - dla wesela potrzebny jest tylko **strój weselny** (kurtka niedzielna,
wianek) jako druga warstwa/arkusz (PixelLab w stylu bohatera, próbka obok: `wesele_probki/wojciech_pan_mlody_*.png`).

## 3. Rozdziały

Dziennik: wątek „Wesele w Złotym Kuflu” w FABULE (szyna `town`).

| # | dzień/godzina | gdzie | kto | co robi gracz (klawiatura) | jak idzie dalej | porażka/alternatywa | dziennik |
|---|---|---|---|---|---|---|---|
| **Z1 Zlecenie** | 19, 9-18 | bar (Borgar), sala | Borgar, Wojciech, Dorota (wejdą rozmową), Ciotka Stefa | rozmowa przy barze (OK): temat „Wesele?” → „Dobra, zajmę się.” / „Nie mam czasu.” | po „zajmę się” Borgar daje **listę prac** (5 punktów: jedzenie, muzyka, ozdoby, goście, uroczystość) | odmowa: wesele skromnie bez zadania (patrz 1) | „Wesele za trzy dni. Wszystko na mojej głowie.” |
| **Z2 Jedzenie** | 19-21 | kuchnia tawerny (Map001), Hanka (piekarnia), pole/las | Borgar, Hanka | wybierz **3 dania** z listy: gulasz, kapuśniak, zupa grzybowa, pieczeń z dzika, placek jagodowy (wszystkie istnieją: potrawy 130-137); każde wymaga składników w torbie (zbierz z pola, lasu, deszczówki **własnej**); Hanka wypieka **tort** za 2 miody + 3 jagody + mąkę od niej; potrawę kładziesz na ladzie kuchni (OK), a kocioł musi być zapalony (reguła „kocioł + danie”) | wszystkie 3 dania + tort na ladzie do 22 dnia 21 | brak dania: Borgar dołoży własne gorsze (wynik -1 na uczcie); brak tortu: Hanka da „placek weselny” (-1) | „Co położymy na stole?” |
| **Z3 Muzyka** | 19-20 | scena tawerny, Melia | Melia, (Jędrek Dudarz jeśli w księdze gości) | Melia proponuje 5 pieśni; **wybierz trzy** na: toast, taniec, kołysankę (menu OK); jedna jest „smutna” - Melia ją odrzuca (komiczne: „To na pogrzeb, dziecko.”); trzeba jej **struny** (jeśli K22 niezrobione: znajdź ją u Ignaca) | po wyborze gra próbę (krótka scena: Melia przy scenie, dymki, 20 s) | Melia obrażona (zaufanie < 15) → gra tylko dwie pieśni | „Melia gra, my słuchamy.” |
| **Z4 Ozdoby** | 20-21 | sala tawerny (stoły, ściany) | Dorota, Halina | zbierz 6 **wianków polnych** (kwiaty z łąki, lato) i 4 **szarfy** od Doroty; **powieś** je na 8 miejscach sali (żółte romby przy ścianach i kominkach; OK = powiesić) + zapal **12 świec/lamp** (każde światło to ogień - pochodnia/zapalniczka) | sala „ubrana” - flaga `salaUbrana`; sala dostaje światło cieplejsze (Mood) i zapach (dźwięk) | niewielu ozdób: mniej oklasków, nic więcej | „Sala pachnie łąką.” |
| **Z5 Plan stołów** | 21 (dzień targowy), 12-20 | rynek, tawerna | Ciotka Stefa, Hanka, Agata, Tadek, Kuba | zbierz **4 plotki o wrogach** (rozmowy: „kto z kim nie siada?”); potem w tawernie **Plan stołów** (okno): 6 stołów × 4 miejsca, 18 kart gości; strzałki wybierają kartę i stół, OK = posadź, X (Esc) cofa; po „Zatwierdź” wynik ukryty do Z7 | zatwierdzony plan; sala układa się wg planu (statyści siadają na krzesłach sali) | źle: gaf = konflikt i większa bójka (patrz niżej) | „Kto z kim - nie wiadomo, ale mam listę.” |
| **Z6 Wieczór kawalerski** | 21, 20:00-23:00 | pokój gier (Map001) | Wojciech, Grum, Ozzy, Bartek, Kuba, Lucjan | bohater może dołączyć: 2 krótkie sceny: (a) żart Gruma („ostatni wieczór”) wymaga odpowiedzi z menu, (b) partia w kości o pierścień (pan młody stawia pierścień „na szczęście”): bohater gra pierwszą turę (silnik TavernDice, mały cel 500) **albo** odciąga Bartka rozmową | wygrana: pierścień zostaje; porażka lub pominięcie: **Bartek wygrywa pierścień** (flaga `pierscienPrzegrany`) | pierścień do odzyskania w Z9 (cena 30 G albo rewanż) | „Pierścień na stole. Zły pomysł.” |
| **Z7 Ślub i uczta** | **22**, 15:00-22:00 | sala tawerny | wszyscy | **S1 ślub** (scena), **S2 toasty** (wybór przemowy), podajesz **3 dania** z kuchni (OK przy ladzie → idź do stołów OK: 17:00, 18:30, 20:00), **S3 pierwszy taniec** (minigra strzałek) | sala zadowolona: nastrój 0-100 (jedzenie + muzyka + ozdoby + plan) | niski nastrój: początek bójki wcześniej (22:00 zamiast 22:15) | „Ślub w sali. Kto ma obrączkę?” |
| **Z8 Zniknięcie i bójka** | 22, 22:00-23:00 | sala | Wojciech, Dorota, Grum, Wit, Melia, Borgar | **S4**: po toaście Wojciech znika; Dorota mdleje z gniewu; wrogowie wskazują się nawzajem: **S5 bójka**; gracz **uspokaja** (wybór 1 z 4 sposobów, patrz niżej) | koniec bójki = „jest cisza”, szkody w „rachunku Borgara” | bez interwencji: bójka trwa 120 s, szkody x2, Wit przyjdzie sam | „Pan młody zniknął, a w sali wojna.” |
| **Z9 Noc poszukiwań** | 22 23:00 - 23 4:00 | cała tawerna: parter (browar, kuchnia, spiżarnia, magazyn, sala gier, palarnia, scena), piętro I (hall, korytarze), piętro II (hall, taras) | Ozzy, kot, Melia, Wit, krewni | **S6 poszukiwania**: 7 miejsc z gagami (poniżej); wskazówki: ślady pierścienia/kwiatu, wianek na stopniach, odpowiedź Ozzy'ego („tam, gdzie gwiazdy słychać”) | po odnalezieniu pana młodego: rozmowa przy tarasie | zbyt wolno (do 4:00): wiadomość od Borgara „Znaleziony sam”, bez premii | „Gdzie on jest? W całej tawernie nie ma tylu kątów.” |
| **Z10 Poranek** | 23, 6-12 | sala, taras | Wojciech, Dorota, Borgar | pojednanie (wybór: powiedzieć Dorocie prawdę / skłamać po swojemu), pierścień na palec (**S7 krótka** scena), napiwki | koniec wątku | patrz zakończenia | „Wesele się skończyło. Prawie na pewno.” |

### 3A. Plan stołów (okno, klawiatura)
- Okno w stylu księgi gości (`Podroznicy` „Księga gości”): lewa kolumna 18 kart (imię, mała ikonka: serce = „kocha”, skrzyżowane miecze = „wrogowie”),
  prawa 6 stołów po 4 krzesła. **Strzałki** przeskakują między kartą a miejscem, **OK** sadza, **Backspace/X** zdejmuje, **Q** pokazuje znane wrogów (po
  plotkach z Z5), **Enter na „Zatwierdź”** kończy. Bez myszy.
- Reguły: 8 waśni (Hanka-Agata, Tadek-Kuba, Grum-Wit, Mietek-Borgar, Ignac-Bartek (dług), Halina-Ciotka Stefa, 2 rody (szwaczki-woźnice) i
  Ambroży-wszyscy (zasypia, nie szkodzi), jedna „miłość” (Leon Dłuto - Halina: obok siebie = premia +3 nastroju). Każda waśń przy jednym stole to **iskra**; 0 iskier =
  wesele bez bójki w tle (bójka tylko przez pana młodego), 1-3 = bójka mała (3 statystów), 4+ = duża (8 statystów).

### 3B. Uspokojenie bójki (S5)
Cztery drogi (zależne od tego, co gracz zrobił wcześniej):
1. **Dzwonek Borgara** - zawsze dostępny (Borgar bije w kocioł chochlą). Kończy bójkę po 20 s, szkody średnie.
2. **Pieśń Melii** - jeśli zaufanie Melii >= 30: wszyscy milkną (muzyka kończy bójkę najładniej, szkody małe, +trust).
3. **Ryk Gruma** - jeśli zaufanie Gruma >= 25: Grum staje na stole, wszyscy zamierają (szkody średnie, Grum -> +trust).
4. **Prawda o panu młodym** - jeśli gracz wie (po odkryciu pierścienia w kościach): „Wiem, gdzie on jest!” - bójka ustaje, wszyscy idą szukać razem (najmniej szkód,
   ale połowa poszukiwań z krewnymi - hałas).
Bez interwencji: kapral Wit wchodzi po 120 s i aresztuje trzech (żart: Ambroży śpi wśród zwycięzców).

### 3C. Miejsca poszukiwań (S6)
Każde miejsce to rozmowa/zdarzenie wstawione (`Tawerna.inject`), ze śladem i gagiem. Pan młody jest w **ostatnim**, ale trop zmienia kolejność wg tego,
co bohater wie.
1. **Browar (zaplecze parteru):** wielka beczka; z niej wyskakuje kot Borgara („to nie pan młody, to mruczący wąsacz”). Ślad: wianek przy beczce.
2. **Kuchnia/spiżarnia:** Hanka z chochlą i bochenek „pan młody” (żart z ciasta w kształcie człowieka); ślad: odcisk buta w mące.
3. **Pokój gier:** pod stołem śpi **Ozzy**; mówi wizję: „On jest tam, gdzie słychać gwiazdy.” (Ozzy: wskazówka do tarasu).
4. **Palarnia:** dym, Wit i Mietek kłócą się o fajkę; w dymie ktoś w niedzielnej kurtce - to krewny, nie Wojciech.
5. **Piętro I, hall zachodni:** zamknięte drzwi pokoi gości (Księga gości - nikt nie wchodzi w czyjeś pokoje; bohater tylko puka); z jednych drzwi głos podróżnika: „Cicho, kocham spać”; ślad: wstążka.
6. **Piętro I, korytarz południowy:** pan młody ukrywał się tu chwilę (garść płatków), potem poszedł wyżej.
7. **Piętro II, taras (x29-52, y45-53):** **pan młody** na barierce, patrzy w gwiazdy; w ręce zgnieciona kartka. Rozmowa: boi się nie ślubu, tylko
   **przemowy** (jąka się przed ludźmi, więc uciekł po toaście) i że **stracił pierścień** (jeśli przegrany w kości).

Gracz może znaleźć go w dowolnej kolejności, bo wszystkie ślady są dodane zawczasu; **niewidzialnych ścian nie ma** (pokoje gości są zamknięte drzwiami, jak dotąd).

## 4. Sceny (scenopisy)

Wszystkie: `CleanHUD.sceneBars`, dymki, emotki, światło ognia, dźwięk, możliwość pominięcia (P).

**S1 Ślub (22, 15:00, ok. 60 s).** Sala. Kamera od wejścia na kominek. Kleofas (siwy, błękitny habit) stoi przed kominkiem, po jednej stronie Dorota w
wianku, po drugiej Wojciech w niedzielnej kurtce (arkusz „pan młody”). Statyści stoją w półokręgu (zdarzenia). Melia gra łagodnie. Dymki: Kleofas
(„… i niech nikt nie pyta o to, czego nie chce wiedzieć”), Wojciech zająkuje się, Dorota śmieje się. Pierścień - chwila ciszy, bohater (kamera na nim) może
zacisnąć kciuki (OK = emotka). Dźwięk: trzask kominka, dzwonek Ambrożego z zewnątrz (nowa wersja 3 uderzeń).

**S2 Toasty (22, 19:00-19:30, ok. 90 s).** Borgar wstaje z kuflem; mówi krótko. Bohater proszony o toast: **menu 3 przemów** (jedna czuła, jedna dowcipna, jedna
niezręczna). Wybór ma wpływ na nastrój i na odruch Wojciecha (przy „czułej” zająkuje się bardziej i ucieka - ironia). Gra krótkie: tłum
klaszcze, Grum ryczy „Na zdrowie!”, Ambroży dzwoni łyżką.

**S3 Pierwszy taniec (22, 20:30, ok. 60 s).** Melia gra, para wychodzi na środek (puste kratki sali), reszta robi koło. **Minigra:** na ekranie 8 strzałek po
kolei, bohater „prowadzi” Dorotę (gdy Wojciech jest zbyt sztywny): gracz naciska pokazaną strzałkę w rytm (okno 0,6 s); każdy błąd = komiczny
potknięcie (animacja `two-footed-jump`/`taking-punch` w skrypcie); ≥6/8 = „piękny taniec”. Statyści tańczą parami po elipsie (4 zdarzenia, ruch wyznaczony, nie ścieżki).

**S4 Zniknięcie pana młodego (22, 22:00, ok. 25 s).** Po toaście Wojciech blednie, mówi „wrócę”, przez salę, ledwie zauważony; drzwi trzaskają, szklanka tłucze
się. Dymki gości: „Gdzie on?”. Dorota pada na krzesło; Ciotka Stefa mierzy salę wzrokiem. Kamera obraca się na bohatera.

**S5 Bójka (22, 22:15, ok. 90 s lub krócej).** 3-8 statystów (zależnie od iskier) zrzuca ławkę, rzuca placek, jeden kuka w beczce; animacje: `taking-punch`,
`throw-object`, `cross-punch`, krzyk „Nie bij moją ciotkę!” w dymkach. **Wydajność:** statyści to zdarzenia z gotowymi `moveRoute`, bez
skanowania; efekty: kilka kropli piwa (cząsteczki jak deszcz), połamane krzesła zamieniane na obrazki zdarzeń. Dźwięki: łomot (Atmosphere,
istnieją odgłosy walki z `Combat`), brzęk. Zakończenie wg 3B.

**S6 Szukanie (22 23:00 → 23 4:00, ok. 6-8 min grywalne).** Nie scena, tylko tryb: zegar „szukamy” z paskiem wskazówek w okienku celu, pasy nie są potrzebne.

**S7 Pierścień na palec (23, rano, ok. 25 s).** Taras o świcie (Sky.js, ptaki). Wojciech wkłada pierścień, Dorota zdejmuje mu wianek z głowy. Kamera na
parze, bohater z boku, Ozzy w tle „przepowiada” („będzie deszcz” - gag, bo susza).

## 5. Nowe postacie, rzeczy, rekwizyty, wnętrza

**Przedmioty (wirtualne `v:`, bez `Items.json`):** `v:wianek_polny` ×6, `v:szarfa` ×4, `v:tort_weselny` (od Hanki), `v:lista_wrogow` (kartka z planem), `v:pierscien_slubny`,
`v:struna_melii` (jeśli K22 niezrobione), `v:kufel_weselny` (pamiątka - nie sprzedawana, w ekwipunku kluczowym). Dania: istniejące potrawy 130-137. **Żaden nie jest wodą.**

**Rekwizyty na mapie (Map001 sala, wstawiane przez `Tawerna.inject`, 19-23):** 6 stołów weselnych z obrusami (zamiast dziennych stołów gości - te z `goscie_sali`
zostają, goście weselni siadają przy dodatkowych), wianki na ścianach i kominkach (obrazki w stylu Winlu, nie przedmioty), girlandy, 12 lamp (ogień
jak w Klimat_Miasta), tort na stole, ławki do rzucenia, tablica „Plan stołów” przy wejściu, pierścień (mały błysk tylko w Z9).

**Wnętrza:** żaden nowy; używane: Map001 (sala, kuchnia, browar, spiżarnia, sala gier, palarnia, scena), Map025 (piętro I), Map026 (piętro II, taras).
**Uwaga:** Map025 i Map026 to mapy użytkownika - tylko wstawki zdarzeń.

## 6. Animacje i grafika

**PixelLab (styl bohatera, 64×64):** strój weselny Wojciecha (próbka), strój weselny Doroty (wianek, jasna suknia z łat), 2 nowe ciała statystów (jeśli
4 z `Podroznicy` to za mało), tort (obiekt 32×32), wianek (obiekt 24×24). Animacje bohatera: istnieją `taking-punch`, `cross-punch`, `two-footed-jump`,
`throw-object`, `drinking` - **brak nowych animacji bohatera** (skrypt). Dla statystów: **walk8 + taniec** (3-4 klatki `walking`, skrypt układa w parę).
Razem ok. **60-90 generacji** (z puli 3775).

**Rysowane skryptem / istniejące:** girlandy (kafelki Winlu), tort (obrazek), taniec = ruch po elipsie z `walk`, światło/zapach (Mood, Atmosphere), piwo w powietrzu
(cząsteczki), Plan stołów (okno w stylu `UITheme`: czarno-żółty), dymki.

**Próbki:** pan młody Wojciech - zlecony w PixelLab (id postaci `262bfd0b-e366-4c46-9365-6ce191a4874b`, styl bohatera), kolejka PixelLab utknęła; po zakończeniu pobrać obroty do `wesele_probki/`.

## 7. Nagrody i konsekwencje

| źródło | pewne | najlepsza |
|---|---|---|
| Borgar za organizację (po Z10) | 20 G + 40 PD | 20 G |
| Wojciech i Dorota (dar) | 30 G | 45 G (jeśli bez bójki) |
| napiwki gości (nastrój >= 70) | 0 | do 35 G |
| pierścień odzyskany w kości (Z9) | 0 (wykup 30 G, -) | wygrany (0 G koszt) |
| razem | **~50 G** | **~100 G** (przy długu 2500 G - 2-4%) |

Reszta: **Renoma +8 (próg `Apartament Złoty` 60 bliżej), Opinia +4, zaufanie Melii +10, Gruma +5, Ozzy +3**, kufel weselny (kluczowy), nastrój „Weselny”
(buff „Natchniony” 1 dzień: +10% XP, bez wody).

**Zakończenia (wynik = nastrój + iskry):**
- **A „Wesele roku”:** nastrój >= 80, 0 iskier, jeśli pierścień zachowany; Wojciech i Dorota odtąd dają bohaterowi zniżkę w wozie (przewóz -50%) i stoją w tawernie wieczorami.
- **B „Bójka, ale szczęśliwa”:** 1-3 iskry, uspokojona; szkody 20-40 G z puli Borgara (z napiwków, nie z kieszeni bohatera).
- **C „Wielka awantura”:** 4+ iskier i brak interwencji; Borgar milczy dwa dni (nie ma zmiany), szkody 60 G płaci pan młody; Dorota śmieje się mimo to; Opinia +1.
- **D „Bez ślubu”:** bohater nie znalazł Wojciecha do 4:00: Borgar go znajduje; Dorota daje mu minimalną pensję, nie ma bonusów (dalsze wątki nie
  zależą od tego).

## 8. Szkic implementacji

- **Nowe pliki:** `js/plugins/Wesele.js` (sceny S1-S7, minigra tańca, okno Planu stołów, wstawki 3200-3279), `Wesele_Data.js` (wątek `Watki.watek`: id `wesele`,
  zadanie **W18**, kroki Z1-Z10, rozmowy, akcje, remarks), `js/teksty/wesele.txt`.
- **Używane systemy:** Watki, TownQuests, TownLife (`setGone/hold/addCondition("wesele")`), TavernLife (scena Melii, stół do gry, plan pięter z `TavernLife.plan.DATA`),
  TavernDice (partia o pierścień: rywal `bartek`, cel 500), Podroznicy (4 ciała statystów, Księga gości - zajęte pokoje), Mood/Sky/Atmosphere/Klimat_Miasta,
  CleanHUD.sceneBars, SpeechBubbles, Torch (zapalenie lamp).
- **Mapy:** żadnych zmian w plikach map; wszystko `Tawerna.inject`. Plan stołów to okno (nowa scena tekstowa), nie mapa.
- **F9:** wiersz „Wesele”: skoki do Z1, Z5, Z7 (ślub), Z8 (bójka), Z9 (poszukiwania), Z10; przełączniki „iskry 0/3/6”, „pierścień wygrany/przegrany”.
- **Testy:** `tests/wesele_test.js` (start/warunki, kroki, plan stołów: liczenie iskier, bójka 3/8, 7 miejsc poszukiwań, zakończenia A-D, brak wody w nagrodach,
  tawerna wydajność z 14 statystami), wpis do audytu; autopilot na dniach 19-23.
- **Wielkość: M-L** (2 sesje agenta: dane/teksty/okna; sceny+grafika+testy). **Ryzyka:** (1) tłok w sali (23 goście + 12 statystów) - wydajność: wyłączyć 8 gości
  tła na czas wesela (flaga w `goscie_sali`), (2) Map001 sala jest „kosztowna” w `wydajnosc_test` - pilnować budżetu 15 ms, (3) plan dnia Wojciecha i Doroty w
  TownLife musi być łagodnie zawieszany i przywracany (`setGone`), (4) kolizje z K15 (Wojciech, 21:30 przy bramie południowej): K15 odsuwa się o 1 dzień, jeśli wypada na 22.

## 9. Związek z jarmarkiem (W17) - czas i postacie

**Czas:** wesele **dni 19-22** (epilog 23), jarmark **dni 47-53**. Dzieli je 24 dni - **nie ma nakładania**. W dniach wesela W15 (13-28) ma gościa Gaspara w pokoju 12 (nie zakłóca),
W16 zaczyna się 25, fala W6 25 po weselu.

**Postacie wspólne i jak się zmieniają:**
- **Wojciech i Dorota** - po weselu (zakończenia A/B/C) są małżeństwem: przy jarmarku w dniach 47-53 Wojciech wiezie beczki z browaru na rynek (J3) i ma **wóz
  dekoracyjny**, a Dorota szyje kostiumy dla trupy (J8) i ma kram z płachtami w Sukiennicach. Jeśli wesela nie było (D), Szczepan i bohater robią to ręcznie.
- **Melia** - zaufanie z wesela (+10) odblokowuje w jarmarku jej „krótką pieśń na koniec” (S6) i rozmowę z Ofelią.
- **Mietek Kwaśniak** - w weselu bywa gościem i kłóci się z Borgarem (iskra); to ziarno **konkursu piwnego** (J6). Jeśli bohater pogodził ich na weselu (opcjonalny wybór
  w S5), Mietek w jarmarku gra czysto (bez sabotażu - J6 „bez nocnego psucia”).
- **Hanka, Ambroży, Wit, Tadek** - ci sami; Hanka sędziuje piwo, Ambroży jest świadkiem kradzieży.
- **Renoma karczmy** z wesela (do 40-60) jest warunkiem startu jarmarku (>= 40); jeśli wesela nie było - jarmark wymaga poprawy Renomy innymi sposobami.
- **Ozzy** - wizja pana młodego przypomina się w jarmarku („Znów gwiazdy słychać.”, gag przy dachach).

## 10. Pytania do użytkownika

1. Para: Wojciech (woźnica) i Dorota Igła (szwaczka) - czy zgoda? Alternatywa: Tadek i Hanka (ważniejsi, ale zmieniają dotychczasowe rozmowy).
2. Ślub udziela Brat Kleofas (zejście z klifu) - czy wystarczy, czy wolisz sołtysa (łatwiej, ale mniej tajemniczo)?
3. Minigry (plan stołów, taniec strzałkami) - czy chcesz je, czy wolisz same wybory z menu bez ruchu w czasie?
