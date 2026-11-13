# Potwory z morza (nocne lądowania) - projekt do zatwierdzenia

Stan: 2026-11-11, **etap 1: sam projekt i próbki grafik** (żadnego kodu ani danych gry jeszcze nie ruszono). Próbki: `docs/potwory_z_morza/probki.png`
(arkusz ze skalą: bohater i wilk obok) oraz pojedyncze pliki w `docs/potwory_z_morza/probki/`.

Pomysł gracza (2026-11-11): co noc z morza mogą wyjść potwory; szansa rośnie z numerem dnia (dzień 1 = 1%, dzień 2 = 2% ... do 30%);
gracz może ją **lokalnie** obniżać; zawsze w nocy; ma być jasne, że przyszły **z morza**; wszystkie cztery grupy potworów; wszędzie, także w
mieście (strażnicy walczą); wątek fabularny łączący to z Sercem pod zamkiem, w większości w tawernie i mieście.

## 0. Zmiana 2026-11-12 (decyzja gracza) - utopieni żołnierze, szkielety

Zasada szansy, mnożniki, noc, świt, straż w mieście, limit 3 naraz, pierwszy znak w dniu 10 i kraken zostają. Zmienił się skład i wygląd (rozdz. 4 i 8 niżej opisują wersję pierwotną):

| Dni | Skład |
|---|---|
| 1-19 | szkielet z pałką (para, szybkie i słabe), szkielet z mieczem (kombinacja do 3 cięć) |
| 20-39 | + szkielet z włócznią (długi zasięg, trzyma dystans), szkielet z młotem (wolny, łamie gardę, powala), krab olbrzym |
| 40+ | + rzadki (~8% lądowań) **krab-kolos** (dwa razy większy, skala 2, więcej życia, wolniejszy, mocniejszy chwyt) |
| 60+ | kraken na przystani (Map125) z **dużymi mackami** (strefa uderzenia 3,6 pola zamiast 2, życie 160, arkusz Morze_Macka_Duza) |

Usunięte z tabeli i z kodu: topielec morski, rybołaki, mglak, morska wiedźma (pieśń). Rozdz. 5 wątku to teraz **Chorągiew utopionych**: kapitan szkieletów z chorągwią (jedna noc po dniu 40, zmusza go wątek) - brat Kleofas poznaje chorągiew, Melia gra żałobną pieśń, nagroda Znak chorągwi. Pierwszy znak w dniu 10: kości i zardzewiały miecz na plaży przystani. Łup: Zardzewiałe ostrze (413), Grot włóczni (414), Znak chorągwi (415) - te same numery co dawne Łuska rybołaka, Perła mgły i Muszla śpiewająca; kości nie są przedmiotem (nic z nich nie wychodzi w rzemiośle). Szkielety boją się ognia jak dawni topielcy. Instalator: tools/potwory2/zainstaluj.py.

## 1. Zasada szansy

**Szansa bazowa na noc:** `p(dzień) = min(0,30 ; 0,01 x dzień)` - dzień 1 = 1%, dzień 10 = 10%, od dnia 30 stałe 30%. (Numer dnia: `Tawerna.time`
/ zegar gry, ten sam co w `Hunting.raidChance`.) Przy dniu 30+ rośnie już tylko **siła** (rozdz. 3 - poziom stwora i nowe rodzaje), nie szansa.

**Szansa na danej mapie w danej nocy:** `P = p x m_latarnia x m_garnizon x m_ogniska x m_dzwon` (mnożniki z punktu 2), z dolną granicą
`P >= 0,15 x p` (zawsze coś ryzykujesz: przy dniu 30 minimum 4,5%). Do tego ewentualne podwyżki: czerwona woda (`CzerwonaWoda`) x1,5; zgaszona
latarnia x1,2. Górny sufit po podwyżkach: 45%.

**Gdzie:** tylko mapy z otwartym morzem - u nas pierścień ośmiu map planszy 3x3 (Garnizon 162, Posiadłość 24, Góry 13, Podgrodzie 111,
Łąka 4, Przystań 125, Kruczy Jar 3, Dom dziadka 20) plus wyspy/wrak (165) przez tag wody słonej. **Kruczogród (Map008) leży w środku** - tam
potwory dochodzą z sąsiedniego wybrzeża (rozdz. 6). Podziemia i wnętrza: nigdy.

**Kiedy i ile razy się losuje (wydajność: jedno losowanie na noc i mapę, nic w każdej klatce):**
1. **O zmierzchu** (ten sam `Latarnia.dusk()` / `Sky.sunTimes`), jeśli bohater jest na mapie z morzem: **jedno** losowanie, wynik zapisany.
2. **Przy wejściu na taką mapę w nocy** (zmierzch+0,5 h do świtu-0,5 h), jeśli dla pary (noc, mapa) jeszcze nie losowano: jedno losowanie.
3. Wynik jest **deterministyczny** (ziarno = hash(noc, mapa), jak `hash2`): wyjście i powrót na mapę niczego nie przelosowuje, więc nie da się
   „reroll-ować” szansy. W zapisie: `_tw.morze.noce["N:mapa"] = { ladowanie, rodzaj, ile, godzina }`.
4. **Godzina lądowania** losowana z okna nocy (z tego samego ziarna). Jeden licznik porównywany raz na godzinę gry (zdarzenie `hourChange`), nie w
   klatce. Jeśli bohater wszedł po tej godzinie, potwór wychodzi z wody ~3 s po wejściu, 12-20 pól od niego.
5. Mapy, na których bohatera nie ma: **bez symulacji**. Rano, wchodząc na mapę z morzem, gra na podstawie tego samego ziarna rozkłada
   **ślady** (mokre plamy, wyrzucone wodorosty) tam, gdzie „by wylądowało” - wieści i ślady działają, a nic nie kosztowało.

## 2. Jak obniżać szansę (mnożniki; razem nie niżej niż x0,15)

| Sposób | Efekt | Uwagi |
|---|---|---|
| **Płonąca latarnia** (`Latarnia.lit()`, tran, K49) | Przystań x0,3; reszta wyspy x0,5 | Zgaszona (`latarniaZgasla`): x1,2 wszędzie. Bazyli to komentuje. |
| **Patrole garnizonu** (Garnizon, przychylność) | Garnizon 162 x0,4; sąsiednie mapy x0,8 | Od ustalonego progu przychylności (wspólna liczba z `GarnizonData`). |
| **Ogniska na brzegu** (kosze ogniowe, pochodnie na palu, ognisko, każde światło to ogień) | każdy z ~6 punktów brzegu mapy osłonięty ogniem (do 8 pól) obniża szansę: `x(1 - 0,5 x ułamek osłoniętych)` | Punkty brzegu liczone **raz** przy pierwszym użyciu mapy (6 punktów, ~1 ms) i trzymane w pamięci. Pochodnia w ręku bohatera działa tylko lokalnie (pkt 6). |
| **Dzwon o zmierzchu** (Ambroży, rozdz. 2 wątku) | wyspa x0,85 | Wymaga liny/oleju co ~10 dni (`K13`); nie dzwoni w burzę. |
| **Pieczęć** (zakończenie Serca) | patrz pkt 9 | Trwała zmiana. |

Przykład, dzień 30 (p = 30%), Przystań ze wszystkim: 0,3 (latarnia) x 0,7 (połowa brzegu w ogniskach) x 0,85 (dzwon) = 0,18 -> **5,4%**.
Ta sama noc bez niczego: **30%**. Przy niepalącej latarni: 36%.

**Lokalne środki (nie zmieniają szansy, tylko to, co się dzieje):** *sól* (Bryła soli, id 200) - linia soli na progu/płocie: topielec i rybołak jej nie
przekraczają, krab omija; trwa do deszczu albo świtu. *Pochodnia w ręku* (Torch.js): mglak i topielec cofają się ze strachem, mglak dostaje x2.
*Pies* (Dog.js): szczeka ~20 s przed lądowaniem. *Dzwon*: mglak ucieka od uderzeń dzwonu. *Zatyczki ze smoły i szmaty* (smoła 176, warsztat): odporność
na pieśń wiedźmy.

## 3. Jak wygląda lądowanie

1. **Znaki ostrzegawcze (5-10 s):** pies szczeka, fala dudni o brzeg (dźwięk), plusk, na wodzie kręgi, ciemna plama przy brzegu. Na mapie z morzem w
   zasięgu wzroku: wyraźny „szum” w pasku powiadomień nie jest potrzebny - wystarczy świat.
2. **Z linii wody**: potwór wychodzi z kratki wody słonej na najbliższy brzeg (jeden z 6 punktów; punkt osłonięty ogniem odpada). Mokre ślady
   (ciemne odciski na piasku/trawie, ~10 sztuk, ciągnące się od wody do miejsca, gdzie stoi) zostają do południa następnego dnia; z deszczem znikają.
   Kolor skóry stwora: mokry, kapie (kropla co kilka klatek, ślad za nim).
3. **Pierwszy raz w życiu gracza**: krótka scena (~6 s, `CleanHUD.sceneBars`): kamera na linię wody, kręgi, wyłania się topielec, dymek bohatera
   „Co to… wyszło z morza?”, notatka w dzienniku „Coś z głębin” (zaczyna wątek). Kolejne razy: tylko znaki (pkt 1) i mała wzmianka w kolumnie zdobyczy
   („Z morza wyszedł Topielec”).
4. **Potem** potwór idzie za bohaterem (ścieżki `path8` + wykrywacz utknięć, jak dziki; reszta w pkt 4-5).
5. **Świt**: patrz pkt 7. **Rano**: strażnicy i mieszkańcy komentują (plotki), ślady są widoczne.

Sygnał „z morza” ma być czytelny wszędzie: kropla wody, wodorosty na stworze, mokre ślady **od wody**, dźwięk fali przy pojawieniu się, plotki
i dymki (Roch Szkwał: „wyszedł prosto z fali”).

## 4. Potwory (cztery grupy, sześć rodzajów)

Odniesienia: wilk 50 życia / cios 12; podziemny topielec 90 / chwyt 6, cios 12, prędkość 2,9; pająk 50; kamiennik 130; bossowie pięter 300-800;
bohater idzie 4 (prędkość MZ). Wszystkie liczby jako punkt wyjścia do strojenia (`Morze_Data.js`, jak `Creatures_Data.js`); poziom stwora = `lv`
= `floor(dzień/20)` (wzrost życia ~+10% na poziom, jak `GROW`).

**Grupa 1 - słabsze, od pierwszych dni (dzień 1+)**

- **Topielec morski.** Wygląd: nabrzmiały, blady, zielonkawo-szary, mokre włosy z wodorostami zasłaniają twarz, skorupiaki na barkach (próbka
  `topielec.png`; w grze gotowy arkusz `$Cr_Drowned*` z przetoną: wilgoć, błękit, wodorosty - jak istniejący podziemny topielec). Życie 70, chwyt 5
  (trzyma i dusi: wyrwać się szarpnięciem klawiszy jak u podziemnego) i uderzenie 10, prędkość 2,6 (wolny - ucieczka biegiem pewna), pole 0,5. Zachowanie:
  powoli, prosto na bohatera, nie rozumie przeszkód (obchodzi wolno), boi się ognia i soli, nie wchodzi w światło pochodni bliżej niż 2 pola. Łup:
  lina 25%, bandaż 15%, mokra sakiewka (3-14 zł, 55%), **wodorost** (rzadko; nic do picia - susza zostaje).
- **Krab olbrzym.** Wygląd: pancerz rdzawy z pąklami, dwa duże kleszcze (próbka `krab.png`). Życie 110, odporność na zachwianie wysoka (140),
  przód pancerza blokuje 60% (jak kamiennik: z boku i z tyłu x1,4), kleszcze 10 + zacisk (przytrzymanie krótkie), prędkość 2,0 (najwolniejszy),
  chodzi bokiem. Zachowanie: nie goni daleko (sight 5), broni „swojego” skrawka brzegu; po 20 s bez bohatera wraca do wody. Łup: **mięso kraba** (jedzenie;
  w kotle: zupa krabowa), **pancerz kraba** (do tarczy/napierśnika), szczypce.

**Grupa 2 - średnie, od ok. dnia 20**

- **Rybołaki** (po 2 lub 3). Wygląd: łuski cyrkonowo-zielone, płetwy na głowie i przedramionach, żółte oczy, kościany trójząb, sieć na biodrach
  (`rybolak.png`). Życie 60 (każdy), trójząb: zasięg 1,9, 9 obrażeń, szybkie pchnięcie; prędkość 3,4 (prawie jak bohater). Zachowanie jak bandyci
  (`Humans`: okrążają, jeden atakuje - drugi czeka, jeden wabi, `circle`/`feint`), ale **gubią odwagę** przy świetle: w promieniu ~3 pól od ognia/pochodni
  wahają się; po śmierci jednego pozostali cofają się ku wodzie (rzadko uciekają całkiem). Łup: **łuska rybołaka**, trójząb (broń drzewcowa), śledź/ryba, sieć.
- **Mglak** (tylko w **mglistą noc**: `Latarnia.fogTonight()`; jeden na noc). Wygląd: wysoka, chuda postać z mgły, bez twarzy, dwoje bladych
  oczu, strzępy mgły zamiast nóg (`mglak.png`). Życie 45, ale **można go uderzyć tylko gdy się „zagęszcza”** (jak upiór: ukryty/pokazany co kilka
  sekund); dotyk zimny: 8 obrażeń + zabiera oddech. Prędkość 3,0, pierwszy atak z zaskoczenia z mgły (ostrzeżenie: szept i chłód). Zachowanie: wnika w
  gęstą mgłę, **światło go rozprasza**: pochodnia w ręku w promieniu 3 pól = x2 obrażeń i cofanie; dzwon ucieka. Łup: **perła mgły** (świeci słabo;
  do latarni/soczewki, rozdz. 3 wątku).

**Grupa 3 - silna, od ok. dnia 40**

- **Morska wiedźma.** Wygląd: wysoka, blada, błękitna skóra, mokre morskie włosy, sukienka z wodorostów i sieci, laska z muszlą i świecącą kulą
  (`morska_wiedzma.png`). Życie 160, zachwianie 80, prędkość 2,8. **Pieśń** (zasięg 10 pól, w polu widzenia): bohater zaczyna iść ku niej samoczynnie
  (~0,6 pola/s), pasek „Hart ducha” (jak „prawda” upiora: test WIL) pozwala się oprzeć; **przerwać**: uderzyć ją, zasłonić widok, odejść poza zasięg
  albo mieć zatyczki. Pocisk wodny 14 obrażeń co ~3 s (wolny, da się uniknąć przewrotem). Przychodzi z 1-2 topielcami. Nie częściej niż raz na ~3
  noce. Łup: **muszla śpiewająca** (klucz fabularny, rozdz. 5; i do zatyczek/ochrony), perła morska (towar), laska (broń magiczna, opcjonalnie).

**Grupa 4 - boss, bardzo rzadko po dniu 60**

- **Macki krakena.** **Nigdy nie wychodzą na ląd**: atakują z wody tylko w **Przystani** i przy **nabrzeżach** (kratki wody w ≤2 polach od brzegu/pomostu).
  Osobne losowanie (nie „lądowanie”): 4% na noc po dniu 60 (mnożniki jak w pkt 2, ale tylko latarnia i ogniska na nabrzeżu), nigdy dwie noce z rzędu.
  2-3 macki, każda: życie 120, zachwianie bardzo wysokie; **kręgi na wodzie 2 s przed uderzeniem**; uderzenie 18 (strefa 2 pola) i **chwyt z wciągnięciem do
  wody** (do 3 s: bohater wyrywa się klawiszami, tonie = obrażenia i utrata przedmiotu ze skraju). Poza 3 polami od wody - bezpiecznie. Ucinane macki (cała trójka)
  = kraken się cofa, do świtu cisza. Prom nie kursuje w taką noc. Łup: **atrament krakena** (rzadki; do `K50` „Atrament dla pustelnika” - niespodziewany
  kierunek zadania), przyssawka (rzadka), mięso (jedzenie).

**Tabela losowania rodzaju (po wygranym losowaniu lądowania):**

| Dni | Skład | Liczba |
|---|---|---|
| 1-19 | topielec 60%, krab 40% | 1 (od dnia 10: 1-2) |
| 20-39 | topielec 25%, krab 20%, rybołaki 45% (pary), mglak 10% - tylko mglista noc (wtedy 40%) | 1-3 |
| 40+ | jak wyżej + wiedźma 12% (z 1-2 topielcami) | 1-3, wiedźma max co 3. noc |
| 60+ | + osobne losowanie macek na nabrzeżach (4%) | - |

Maks. **5 potworów** z morza jednocześnie na mapie (limit dla wydajności).

## 5. Gdzie są i jak działają (silnik)

- Nowa wtyczka `Morze.js` + `Morze_Data.js` (dane w stylu `Creatures_Data.js`, teksty w `js/teksty/morze.txt`), **na wierzchu** `Creatures` i `Humans`,
  pod `Debug`/`MenuPanel`. Potwory to instancje istniejącego silnika stworów (`Creatures`: ciosy, zachwianie, łup, zwłoki - dla topielca i kraba nowy
  rodzaj „morski”; dla rybołaków czyni to `Humans`-podobny pakiet z okrążaniem; wiedźma i mglak to `upior`-podobny model ukrywania i pieśni).
- Ruch: ścieżki `Hunting_Path` (`path8`) i wykrywacz utknięć; poziom `lv` = `floor(dzień/20)`.
- **Nocne zagrożenie dla śpiącego** (pamięć `project_night_danger`): `restDanger()` uwzględnia potwory z morza w 8 polach (nie zaśniesz); w
  namiocie/pod gołym niebem na mapie z morzem `Hunting.nightRaid`-owy napad: z szansą lądowania z pkt 1 x0,5 przy ognisku w 6 polach budzi bohatera
  1-2 topielców lub rybołaki ~9 pól od niego (pies: szczeka 20 s wcześniej); **w chatce i we wnętrzach nigdy**.
- **Świt** (pkt 7), zapis stanu w `_tw.morze` (noce, tabele zobaczonych rodzajów, pierwsze lądowanie, wynik wątku).

## 6. Miasto i tawerna

Kruczogród jest w centrum planszy, więc **dochodzą** tam z wybrzeża: jeśli bohater jest w mieście (Map008) w nocy, przy zmierzchu losuje się
`P_miasto = 0,5 x P` (liczone z mnożnikami Przystani, jeśli lądowanie szło od zachodu/południa) - potwór wchodzi przez bramę od strony
Przystani/Podgrodzia (wcześniej mijał pole z mokrymi śladami przy bramie, Ambroży bije dzwonem 3+1 jak w Akcie III dla większych sił).

- **Strażnicy** (`straznik`, `straznik_przystan`, żołnierze garnizonu na nocnej warcie): walczą jak w `Starcia.js` (bestia kontra ludzie): dwóch strażników
  zabija topielca w ~8 s, krab to ~12 s i mogą ranni zostać; rybołaki dostają łomot od czterech; **wiedźmę pieśń podporządkowuje** - strażnicy idą ku niej
  jak bohater i trzeba ją przerwać samemu. Ranny strażnik nie znika (zgodnie z `feedback_nobody_vanishes`): idzie do wartowni.
- **Mieszkańcy:** w noc z lądowaniem zamykają drzwi (`TownLife.hold`), nikt nie wychodzi z domu; rano plotki (Hanka, Kuba, Tadek) i ślady na rynku.
- **Tawerna (Map001):** wnętrze to osobna mapa - potwór **nie wchodzi** (drzwi, okiennice, sól na progu, tłum gości). Walka toczy się **przed drzwiami**
  (Map008 przed wejściem), bohater może się schować, pomóc strażnikom albo patrzeć przez okno. Wyjątek **fabularny jeden raz**: rozdz. 5 (pieśń
  wiedźmy dociera do wnętrza: goście wstają i patrzą na drzwi). Borgar ryglem zamyka drzwi, gdy dzwonią (3+1).
- W mieście działa `Dwor`/`Garnizon` jak zawsze; nie ma w nocy handlu, kantor zamknięty.

## 7. Świt

O wschodzie słońca (`Sky.sunTimes`): potwory, które żyją, **cofają się do najbliższej wody** (nie ginąc od słońca - nie są nieumarłymi): topielec i
krab wchodzą do wody (plusk, kręgi); rybołaki i macki zanurzają się; mglak **rozwiewa się** z pierwszym światłem; wiedźma wchodzi w morze,
jeśli blisko, a daleko od wody **rozpływa się w pianę** (z „muszlą” na ziemi tylko jeśli ją zabito). Uciekają popup „Świta - potwory wracają do morza”.
Zabite leżą jako zwłoki (jak wilki, `remains: "drowned"`), obdzierane nożem; wyschną po 1 dobie do plamy soli (`Puddles` - plama soli i wodorosty).
Cofające się potwory nie atakują (jak wilki po świcie: `_dawn`, flee, off screen).

## 8. Wątek „Coś z głębin” (W14) - 7 rozdziałów

Na silniku wątków (`Watki.watek`, plik `W14_Data.js`, zadanie `W14`, kroki z hakami `morze*` w `Morze.js`; numer W14 jest wolny - W12 „Rozbitek”,
W13 „Skrzydlata Straż” zajęte). Wszystko zaczyna się samo przy pierwszym lądowaniu **albo w dniu 10** (gwarancja: w dniu 10 rano na Przystani leżą
mokre ślady i martwy rybak z mokrym płaszczem - bez ataku; wtedy wątek startuje, zanim kolejne wylądują).

1. **Mokre ślady** *(tawerna, Przystań)*: plotka przy barze (Ozzy: „wyszło z wody”, Melia: stara pieśń o „słuchających”), Roch Szkwał pokazuje ślady na
   plaży, bohater porównuje ślady na 3 brzegach (mapa/ślady, dziennik). Wniosek: coś przychodzi **w kierunku zamku**. *Nagroda:* wskazówka „sól i ogień”.
2. **Dzwon o zmierzchu** *(miasto, dzwonnica Ambrożego)*: w kronice Zakonu zapisano, że dzwon o zmierzchu „odsuwał głęboką wodę” (ten sam dzwon, co W2 „Kod dzwonu”).
   Zadanie: naprawić/oliwić dzwon (lina, olej), zadzwonić 7 razy. *Efekt:* mnożnik x0,85 (pkt 2). Scena w tawernie: goście spierają się, czy to zabobon.
3. **Księga mgieł** *(Przylądek z latarnią, latarnik Bazyli Krzesiwo)*: Bazyli prowadzi od lat dziennik: im głębiej bohater schodzi (piętra), tym częściej
   gaśnie jego „oko” i częściej schodzą na brzeg. Zadanie: dostarczyć tran (`K49`), wydobyć perłę mgły z mglaka (opcjonalnie wzmacnia soczewkę `W11`).
   *Efekt:* latarnia bardziej skuteczna (x0,3 na Przystani także w mgłę).
4. **Kronika brata Kleofasa** *(kaplica Zakonu pod tawerną / w tawernie)*: pustelnia jest teraz poza mapą (decyzja 11-11), więc Kleofas schodzi do tawerny
   na święto i czyta z kronik (`D23`): Serce „ciągnie” z coraz większą siłą te, które kiedyś zadały zbyt wiele pytań - w tym **utopionych**. Zadanie: przynieść mu
   atrament (`K50`; sensacja: atrament krakena, jeśli się trafi) i 3 kartki. Odkrycie: potwory to **zatopieni ludzie z wojny** (Rozbitek `W12` - jego
   okręt) - ich pamięć woła do Serca.
5. **Pieśń** *(tawerna i rynek, dzień ~40, pierwsza wiedźma)*: noc, w której pieśń dociera do wnętrza tawerny: goście wstają, idą ku drzwiom. Melia gra przeciw
   pieśni (jej lutnia - `K22` - to jedyne, co ją zagłusza); bohater wychodzi, przerywa wiedźmę (bije ją, albo przekonuje - w rozmowie ujawnia imię z W12).
   *Nagroda:* muszla śpiewająca, zaufanie Melii, plotka o „dziewczynie, która zeszła do morza za ojcem”.
6. **Zapisy Zakonu** *(Archiwum pod ogrodem Posiadłości, Map024; W2)*: kroniki mówią wprost: Zakon trzymał Serce ułomnie „zamknięte” **wartą na brzegu** - latarnią,
   dzwonem i solą; po upadku Twierdzy warta zgasła; Serce słabiej śpi z każdym dniem. Zadanie: zebrać 3 zapisy (garnizon: lista, Lord: pieczęć, pustelnia/kronika).
   Odpowiedź na „dlaczego rośnie”: **ciąg Serca** = liczba dni od otwarcia piwnicy + piętra, na które bohater zszedł.
7. **Kraken u kei** *(Przystań, noc po dniu 60)*: kulminacja - macki atakują nabrzeże. Bohater, strażnicy, Bazyli (latarnia), Ambroży (dzwon), Melia (pieśń):
   wszyscy **jednocześnie** na obrzeżu. Wybór: (a) **odsunąć** (przywrócić wartę: dzwon+latarnia+sól codziennie - mnożnik x0,6 trwale, ale koszty), (b) **odciąć** (zabić
   macki - atrament, ale kraken wraca), (c) „zostawić Sercu” (nic nie robić - zwrot w pkt 9).

**Związek z Sercem i zakończeniami (pkt 9):** po dojściu do Serca (piętro 100, `Underground.world()`) wynik wątku ustawia mnożnik końcowy.

## 9. Zakończenia a morze

| Zakończenie Serca | Skutek dla lądowań |
|---|---|
| **Zniszczyć** | Ostatnia noc: wszystkie potwory naraz (finał na obrzeżu), potem **nigdy więcej** (p = 0). |
| **Zająć miejsce strażnika** | p stałe 5%; potwory „kłaniają się” bohaterowi (nie atakują); samotność. |
| **Uwolnić prawdę** | p x2, sufit 60%; mieszkańcy znają prawdę o utopionych, część wychodzi na brzeg „do nich”. |
| **Zapieczętować z zasadami** | p x0,25, warta (latarnia, dzwon, sól) **obowiązkowa** co noc - zaniedbanie podwyższa szansę. |
| (przed Sercem) | wątek W14 dodaje ewentualne rozdziały; brak Serca = p zostaje 30% sufit. |

## 10. Testy (F9, `Debug.js`, tabela ROUTE)

Wiersze w zakładce „Zdarzenia” (sekcja „Potwory z morza”, właściciel `Morze`): **Pokaż szansę dziś** (p, mnożniki, wynik); **Wylądują teraz** (wymusza
lądowanie na tej mapie, wybór rodzaju: topielec / krab / rybołaki / mglak / wiedźma / macki); **Ustaw dzień 1 / 20 / 40 / 60**; **Mglista noc dziś**;
**Zapal/zgaś latarnię**; **Wyczyść stan lądowań**; **Wątek W14: następny rozdział**. Testy automatyczne `tests/morze_test.js`: statystyka losowań na 10 000
nocy (zgodna ze wzorem, mnożniki, dolna granica), ziarno (to samo wyjście przy ponownym wejściu), noc/świt, topielec grabi i kończy, strażnicy
walczą w mieście, nie wchodzą do tawerny, sen z potworem w 8 polach zablokowany, pomiar budżetu klatki (patrz niżej). Zgodnie z regułą „mało testów na zmianę”:
zbuduj całość, przetestuj raz.

## 11. Grafika i dźwięk do zrobienia

**Arkusze** (format gry: `anim8/Cr_<nazwa>_Walk8`, `_Atk8`, `_Die8` dla stworów; 3 klatki x kierunki): topielec (przeton `$Cr_Drowned*`), krab (chód
boczny 8 kierunków, atak kleszczami, śmierć), rybołak (chód, pchnięcie, śmierć), mglak (płynięcie, pokazanie, rozwianie), wiedźma (chód, pieśń, pocisk, śmierć),
**macka** (obiekt wodny: wynurzenie, uderzenie, chwyt, zanurzenie - ok. 4 stany x 1 kierunek, kręgi na wodzie osobno). Dodatki: mokre ślady (4 odciski),
piana brzegu, plama soli/linia soli, kropla (FX), nuty pieśni, kręgi na wodzie. Próbki humanoidów (topielec, rybołak, mglak, wiedźma) są w proporcjach „chibi” jak bohater (pierwsze, bardziej realistyczne wersje leżą w
`probki/_pierwsze_wersje/` - odrzucone jako niepasujące do gry); krab i macka (obiekty) są nieco szczegółowsze niż bohater - do ujednolicenia przy
arkuszach końcowych. Topielec w grze: najlepiej przetona istniejącego `$Cr_Drowned`, próbka to tylko wskazówka koloru i wodorostów.
**Dźwięk** (PixelLab `create_sound_effect`): fala przy lądowaniu, mokre kroki, jęk topielca, stukot kraba, bulgot rybołaka, szept mglaka, pieśń wiedźmy
(pętla ok. 20 s), dudnienie krakena, plusk-uderzenie macki, mewy o świcie. Atmosphere.js ma gotowe łóżka fal.

## 12. Wydajność (zasada pierwsza)

- **Jedno losowanie na noc i mapę** (ziarno), zero przeszukiwań co klatkę; stan jako małe liczby w `_tw.morze` (nie rośnie: stare noce czyszczone po 3 dniach).
- Punkty brzegu: 6 na mapę, liczone **raz** przy pierwszym użyciu (skan siatki ~1 ms), potem w pamięci; światła obok brzegu liczone z istniejącej listy świateł.
- Potwory: maks. 5 naraz; AI daleko poza ekranem co 4. klatka (jak reszta stworów); ścieżki z cache `path8`; brak nowych filtrów PIXI (mgła mglaka =
  sprite z gotowego obrazka, nie filtr).
- Ślady: do 12 prostych duszków na lądowanie (w jednym kontenerze, znikają rano). Zbliżony budżet do istniejących nocnych obozów (`Humans.camp`).
- Mierzymy na „średnim komputerze” (CPU 4x wolniej, `tools/wydajnosc/pomiar.js`): nowe miejsca **przystan_noc_lądowanie** i **miasto_noc_lądowanie**; progów nie luzujemy.

## 13. Pytania otwarte

1. Gwarancja wątku w dniu 10 (martwy rybak i ślady): zgoda, czy ma wystartować dopiero od pierwszego prawdziwego lądowania?
2. Kleofas: mapa pustelni jest teraz poza grą - czy ma schodzić do tawerny (jak zaproponowano), czy czekamy z rozdz. 4 na wrócenie pustelni?
3. Czy utopieni w mieście mają zabijać mieszkańców (rzadko, rano w plotce), czy ranni strażnicy i zamknięte drzwi wystarczą? (Domyślnie: nikt nie ginie.)
4. Sufit 30% i dolna granica x0,15: tak, czy pozwolić zejść do 0 przy komplecie środków?
5. Czerwona woda x1,5 i burza x1,3 jako podwyżki - brać, czy zostawić samą zasadę gracza?
6. Macki tylko w Przystani/nabrzeżach - dołożyć też miasteczko przy studni na rynku w finale (rozdz. 7)?
