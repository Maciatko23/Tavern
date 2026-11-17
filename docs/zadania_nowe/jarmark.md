# Jarmark Kruczogrodu - projekt wątku (W17)

Stan: 2026-11-11, **sam projekt** (żadnych zmian w kodzie ani danych). Siostrzany wątek: `wesele.md` (W18, „Wesele w Złotym Kuflu”) - rozdz. 9 mówi, jak się mają do siebie.

> **2026-11-16 - przeniesione do nowego Kruczogrodu (Map220); poniższy projekt opisuje stare miasto (Map008).** Gracz wybrał:
> jarmark „na łące na południowym wschodzie” i pościg „uliczkami”. Łąkę zajmuje pole jęczmienia (x 50..65, y 55..62) i wiatrak
> (45,60) - zostają, jarmark stoi wokół nich: dwa kramy przy placyku młyna, cztery pod polem frontem do dolnej drogi, scena w rogu
> (62,65) z widownią na drodze, beczki przy scenie, pochód Lorda schodzi od dworu przez wschodni mostek. Ślady: gablota w ratuszu,
> Cech (warsztat 19,58), studnia na rynku (klucz `laznia`), garbarnia i przytułek w Podgrodziu (Map218). Konkurs w mniejszej sali
> (rząd sędziów y 27). **Pościg (J10) jest biegiem po ziemi**: Szept wychodzi zza dzwonnicy i biegnie odcinkami (między domami,
> schodami do koryta, uliczkami dolnego miasta, drogą, ścieżką młyna) - odcinek, gdy bohater blisko albo po 4 s; zgubiony z oczu
> na 3 s = +15 s; w wąskim przejściu (25,33) przewraca beczki; poddaje się pod wiatrakiem. W noc zasadzki potwory z morza nie
> wchodzą do miasta (Morze.js pyta `Jarmark_Sceny.nocStrzezona`). Dane i współrzędne: `js/plugins/Jarmark_Data.js`; kratki
> układu i trasy sprawdza `python tools/jarmark/uklad_220.py [podglad.png]`; test `tests/jarmark_test.js` (52/52).

## 1. Pitch, długość, start, związek z fabułą

**Pitch.** Raz w roku, pod koniec lata, Kruczogród urządza Jarmark: kramy pod arkadami Sukiennic, kupcy z promu, beczki z browaru
„Złotego Kufla”, konkurs piwny i turniej w kości w tawernie, a wieczorami trupa wędrownych komediantów gra na rynku
„Legendę o Kruku i Wilku”. Bohater jest „rękami” sołtysa Bronisława: ustawia stragany, wozi beczki, zapala lampiony, ratuje
piwo Borgara przed Mietkiem Kwaśniakiem, wygrywa (albo przegrywa) turniej. Trzeciego dnia, w czasie przedstawienia, gaśnie
światło, a z poduszki obok sceny znika **Srebrny Kruk Założycieli** - relikwia miasta, bez której jarmark traci przywilej (Lord
zamknie go w południe ostatniego dnia). Śledztwo prowadzi przez nowe budynki (Sukiennice, Cech, Łaźnia, Garbarnia, Przytułek), a
kończy się nocnym pościgiem po dachach na dzwonnicę.

**Długość:** 7 dni gry (dni **47-53**), 9 rozdziałów, 7 scen. Dzień 49 to naturalny początek: dzień targowy (7×7) i dzień promu.

**Start:** dzień **47** (od dnia 44 ogłoszenie na tablicy w ratuszu i u Borgara). Warunki oferty: Opinia w miasteczku >= 20 („Bywalec”),
Renoma karczmy >= 40, W1 rozdz. 3 zrobiony (bohater zna sołtysa i rynek). Zaczyna się samo przy pierwszej rozmowie z sołtysem
w ratuszu 8-18 po dniu 47 (żółte „!”). Jeśli bohater go przegapi, jarmark i tak się odbywa jako tło (stragany, trupa, turniej), a
zadanie wchodzi od rozdz. 5 jako „widz”, który coś zauważył (mniej nagród).

**Związek z główną fabułą.**
- Srebrny Kruk jest odlany z odłamka starego dzwonu zakonu - rodzina dzwonu to Ambroży (W2 „Kod dzwonu”). Straż Pewności
  („Czarne Oczy”, W10 list matki: „ludzie z białym okiem pod płaszczem, którzy pytają o kruki”) pyta o kruki w całej okolicy -
  zleceniodawcą kradzieży jest kupiec sukienny z promu **Marcel Wełna**, który z nimi handluje wiadomościami. Tym samym wątek
  dokłada jeden dowód do Aktu II („Straż ma ludzi w mieście”), nie zmieniając dotychczasowych wątków.
- Hak opcjonalny, **do decyzji gracza**: w brzuchu Kruka jest wąska skrytka z kawałkiem zwrotki (W3 „Pieśń o Kruczych Skałach”,
  Melia). Domyślnie: pusta (wątek nie dotyka W3).
- Ekonomia: patrz rozdz. 6 - pewne złoto ok. 120 G, najlepsza ścieżka ok. 330 G (przy długu 2500 G to 5-13%).

## 2. Postacie (nowe i istniejące)

### Nowe (styl bohatera, PixelLab; opisy do wklejenia w rozdz. 5)
| klucz | kto | rola | plan dni 47-53 |
|---|---|---|---|
| `ofelia` | **Madame Ofelia Sroka**, impresaria | szef trupy „Sroczy Teatr”, głośna, w fioletowej chuście | od dnia 49 (prom 9:00): rynek (scena) 8-21, noc w tawernie (sala), odjazd promem 55 |
| `pimpek` | **Pimpek**, żongler | zęby jak klawisze, żongluje przy straganach i w tłumie | rynek 9-20 |
| `zar` | **Zygfryd Żar**, połykacz ognia | olbrzym o łagodnym głosie, brwi spalone | rynek 12-21, pod sceną 18-21 |
| `bonawentura` | **Bonawentura Wąs**, pierwszy aktor | próżny rycerz z przedstawienia | scena 17-21, tawerna po |
| `ania` | **Ania Szpilka**, młoda aktorka | gra Wilka, szuka rady | scena, rynek |
| `szept` | **Szept (Stefan Szeptak)**, sufler | złodziej mimo woli: dłużnik kupca | za sceną; od nocy 51 ucieka; noc 52 na dachach |
| `marcel` | **Marcel Wełna**, kupiec sukienny | kram w Sukiennicach, uprzejmy, pyta o kruki | kram 8-19, wieczorem w tawernie (sala gier) |
| `wanda` | **Wanda Ósemka**, szulerka | gra w turnieju fałszywymi kośćmi na zlecenie Marcela | tawerna (sala gier) 14-23 w dni 50-51 |
| `tlum_1..8` | tłum | 8 mieszkańców-statystów (istniejące arkusze) | rynek w czasie przedstawienia |

Wygląd w stylu bohatera: ubodzy, łatani, bosi lub w zdartych butach, ziemiste kolory - wyjątek: Ofelia i Bonawentura mają odrobinę
kostiumowego koloru (fiolet, wyblakła czerwień), ale zszargane („teatr w nędzy”). Dopisek do opisów PixelLab:
*„full body, standing, neutral pose, muted earthy medieval palette”* (zasada z `PODROZNI.md` 2).

### Istniejące (jak się z nimi łączę)
- **Sołtys Bronisław** (`soltys`, ratusz 8-18) - zleceniodawca; w dniu 51-53 przejmuje się Krukiem.
- **Borgar** - browar, konkurs piwny; zaufanie do niego rośnie. **Melia** - gra przy scenie w dzień 50 (przerwa trupy). **Grum, Ozzy,
  Bartek, Baltazar Vey (kupiec), Lucjan Kość, Wojciech woźnica** - rywale turnieju (patrz TavernDice_Data).
- **Hanka Mączna** (piekarnia, sędzia), **Ambroży** (dzwonnik, sędzia i strażnik Kruka), **Kapral Wit** (sędzia, straż jarmarku),
  **Teodor** kamerdyner (głos Lorda w jury), **Mietek Kwaśniak** (rywal piwny), **Szczepan Kołodziej** (beczki), **Leon Dłuto**
  (scena), **Dorota Igła** (kostiumy), **Tadek Młot** (hak do żaru Żara), **Ignac** (garbarnia, trop), **Ciotka Stefa** (przytułek, trop),
  **Tośka** (dziecko, świadek).
- **Lord Zaleski** otwiera i zamyka jarmark (scena otwarcia i zamknięcia; poza tym zostaje we dworze).
- **Gaspar Lis** (relikwie, W15) - nie występuje (wyjechał); Marcel mówi o nim jako o konkurencji („handlarz kościami, hm”).
- **Wątki, których NIE ruszam:** W1-W16 (stany flag nie zmieniane), K/D z kalendarza dnia 49-53 (K37 sakiewka Lorda w dniu targowym
  49 odbywa się obok - Feliks na rynku; jarmark nie blokuje go, tylko tłum go ukrywa), W6 fala 52 (patrz rozdz. 9).

## 3. Rozdziały

Dziennik: nowy wątek „Jarmark Kruczogrodu” w zakładce FABUŁA (szyna `Journal.addQuestSource("town")`). Sceny: rozdz. 4.

| # | dzień/godzina | gdzie | kto | co robi gracz (klawiatura) | jak idzie dalej | porażka/alternatywa | dziennik (sedno) |
|---|---|---|---|---|---|---|---|
| **J1 Zgłoszenie** | 47, 8-18 | ratusz → rynek | sołtys, Teodor | rozmowa (OK): „Pomogę” / „Nie teraz”; sołtys wręcza **listę prac** (3 zlecenia: stragany, beczki, lampiony) | po trzech pracach (lub po dniu 49 rano) otwarcie | „Nie teraz” - zlecenie czeka do 48 18:00, potem tylko rozdz. 5+ „jako widz” | „Jarmark za dwa dni. Sołtys liczy na ręce.” |
| **J2 Stragany** | 47-48, 6-18 | Sukiennice (x47-56 y55-62), rynek, tartak Dłuta | Leon Dłuto, Dorota Igła, sołtys | przynieś 6 desek i 4 płachty od Dłuta/Doroty (przedmioty `v:deska_kram`, `v:plachta` - noszone w torbie), potem **ustaw kramy**: 6 miejsc oznaczonych żółtym rombem; przy każdym OK = postaw (kram wchodzi jako zdarzenie 3100-3111 na Map008) | gdy 6/6, sołtys dopisuje „kupcy z promu dostaną miejsca” | desek brak: Dłuto da je za 3 kłody (z działki); spóźnienie tylko zmniejsza Opinię (-1) | „Sześć miejsc pod arkadami.” |
| **J3 Beczki** | 47-48 | browar Borgara (Map001, zaplecze), rynek, Szczepan Kołodziej, wóz | Borgar, Szczepan, Wojciech (wóz)* | zanieś **obręcze** (od kołodzieja), pomóż Borgarowi przesypać słód (OK przy kadzi), **oddaj do 5 porcji deszczówki** (opcjonalnie - mocniejsze piwo; zadanie tylko zabiera wodę, nigdy nie daje) i zawieź beczki na rynek (idź z wózkiem: ruch jak „pchanie”, strzałki; wóz = zdarzenie za bohaterem) | 4 beczki na rynku do 18:00 dnia 48 | bez wody piwo „zwykłe”; bez beczek konkurs bez Borgara (Mietek zdobywa punkt walkowerem) | „Borgar warzy na jarmark. Woda jest na wagę złota.” |
| **J4 Lampiony** | 48 wieczór (do 22:00) | rynek: 8 słupów | sołtys, kapral | obejdź 8 słupów, przy każdym OK = zawieś lampion; zapal pochodnią (Torch.js - lampa to ogień!) | gdy 8/8: scena „zapalone miasto” (krótka, bez pasów) | zgaszone lampiony = ciemniejszy rynek podczas kradzieży (łatwiej uciec złodziejowi, ale i gracz ma +1 wskazówkę - patrz J7) | „Rynek świeci jak w dzień.” |
| **J5 Otwarcie** | **49**, 10 (prom) → 15:00 | przystań → rynek | Lord, kapral, Ambroży, trupa, kupcy | **scena S1** (pochód); potem swobodnie: kupcy na ferry 49 rozkładają towar; gracz może **sprzedawać w kramach** | koniec sceny = „jarmark otwarty” (flaga `jarmarkOtwarty`) | opuszczenie sceny (P) = pomija, zyskuje wszystko | „Jarmark otwarty.” |
| **J6 Konkurs piwny** | 49, 19-21 | tawerna, sala (Map001) | Borgar, Mietek, 4 sędziów (Hanka, Ambroży, Wit, Teodor) | **scena S2**: podajesz każdemu sędziemu kufel + **jeden dodatek** z menu (miód / dym (wędzony słód) / szyszka sosnowa); preferencje sędziów poznajesz z plotek w J2-J4 (Hanka „lubi słodkie”, Ambroży „dym przypomina mu dzwon”, Wit „coś ostrego, nie jak woda”, Teodor „co lubi Lord - szyszka”) | 3 z 4 głosów = wygrana; wynik 2-2 = remis, rozstrzyga sołtys głośnym „Za Borgara!” gdy gracz dał deszczówkę | nocne psucie piwa (poniżej) | „Piwo Borgara kontra Mietka.” |
| *(opcja)* sabotaż | noc 48 → 49 | browar tawerny (Map001), 1:00-4:00 | chłopak Mietka (`mietek_chlopak`, tymczasowy) | zakradnij się (skradanie, `sneak` bohatera) i złap chłopaka, zanim wsypie mydło do kadzi; OK przy kadzi = przykryj; OK przy chłopaku = złap | Mietek dostaje karę (Opinia -1 u niego), Borgar wie | nie złapany: piwo „mydlane” → sędziowie krzywią się, przegrana konkursu (nadal grywalne) | „Ktoś kręci się przy kadzi.” |
| **J7 Turniej w kości** | 50: ćwierćfinały 17:00, półfinały 20:00; 51: finał 15:00 | tawerna, pokój gier (Map001, `dice`) | Borgar (mistrz turnieju), Grum, Ozzy, Bartek, Baltazar, Lucjan, Wojciech, Wanda | wpisowe 20 G u Borgara; 3 mecze na silniku `TavernDice` (strzałki+OK, krótka gra do 1000 pkt); przed meczem z Wandą **kontrola kości**: wybierz „Pokaż kość” (OK) - kość fałszywa ma oznaczoną ściankę; w turnieju nie zmieniasz kości | zwycięzca bierze pulę (8×20 = 160 G minus 40 podatku sołtysa = **120 G**) + **Kość Kruczogrodu** (kość specjalna: ciężar na 1 i 5, nazwa i opis `kosci.krucza_jarmark`) | przegrana odcina pulę, ale **nie** zadanie; wygrana z oszustką Wandą: Wanda odjeżdża w hańbie, a Szept (jej dłużnik) wpada w długi - to popycha go do kradzieży (patrz J8) | „Ośmiu graczy, jeden puchar.” |
| **J8 Przedstawienie** | **51**, 19:00-20:00 | rynek (scena) | cała trupa, Ambroży, sołtys, tłum | **scena S3** (sztuka) + **S4** (zgaszone światło, kradzież); wcześniej (13-18) gracz może pomóc trupie: **kostiumy** od Doroty (jej wątek: 2 sztuki), **żar** od Tadka (połykacz), **perukę** od Hanki - 3 małe dostawy, każda +trust trupy; im więcej, tym lepsze wskazówki | kradzież zawsze następuje (to oś wątku), ale pomocnik trupy dostaje od Ofelii kluczową wskazówkę | brak: nic nie pomagasz, wskazówek mniej | „Kruk zniknął w ciemności.” |
| **J9 Śledztwo** | 51 noc → **52** (cały dzień, wave 52 - prom) | Sukiennice, Cech, Łaźnia, Garbarnia, Przytułek, tawerna, ratusz | patrz niżej | **5 miejsc, 5 poszlak, 3 podejrzani** (Szept, Bonawentura, Marcel) - potrzeba **3 z 5 poszlak**; poszlaka = wstawione zdarzenie (żółty romb) lub rozmowa | z 3 poszlakami sołtys zwołuje się do akcji: noc 52 23:30 zasadzka przy dzwonnicy | mniej niż 3 poszlaki do 22:00 dnia 52: Szept i tak ucieka, ale bohater gubi trop → **pościg bez „fory”** (dłuższy odcinek) i bez dowodu na Marcela (zakończenie B) | „Pięć śladów, trzech ludzi.” |
| **J10 Pościg po dachach** | 52, 23:30 → 0:30 | dachy rynku → Cech → Łaźnia → dzwonnica | Szept, Marcel (w tle), Ambroży | **scena S5 + minigra**: strzałki = skok w kierunku, OK = przeskok szczeliny w rytmie; 5 przeskoków (patrz rozdz. 3A) | koniec: dzwonnica; Szept z Krukiem na krawędzi, rozmowa i **wybór** | upadek = zsuwasz się na płachtę kramu, tracisz 15 s, nie życie | „Dachy Kruczogrodu.” |
| **J11 Rozstrzygnięcie** | 53, rano → 12:00 | dzwonnica, ratusz, rynek | Szept, Marcel, Lord, sołtys, kapral | wybory: zdać Szepta kapralowi **albo** puścić go **albo** zatrzymać go jako świadka; Marcela: oskarżyć (dowody z J9: 3 poszlaki) / szantażować / puścić | **scena S6**: zamknięcie jarmarku w południe z Krukiem na poduszce | patrz rozdz. 6 zakończenia | „Kruk wrócił. Jarmark zamknięty.” |

*Wojciech woźnica i jego wóz: jeśli wątek „Wesele” został zagrany (rozdz. 9), Wojciech ma wóz i Dorotę i pomaga w J3 sam; jeśli
nie - Szczepan Kołodziej wozi beczki ręcznym wózkiem i bohater pcha sam (+3 min).

### 3A. Pościg po dachach - opis minigry
- Bez niewidzialnych ścian: pościg dzieje się na **osobnej małej mapie „Dachy Kruczogrodu”** (nowa Map, 40×28), której „podłoga” to
  dachy budynków widziane z góry (zasada rysunku budynków: dach z góry, frontem do widza), a przerwy to czarne uliczki z zapadkami:
  pozioma „szczelina” = zdarzenie z wykrywaniem trafienia w grupie: **wejście w szczelinę bez skoku = upadek na płachtę** (wraca na
  poprzedni dach, +15 s, zwykły ruch, bez śmierci).
- **Sterowanie:** strzałki chodzą (FreeMovement 8-kierunkowy jak zawsze), **OK = skok** przez szczelinę (animacja `two-footed-jump`/
  `running-jump` istnieje w arkuszu bohatera, nowy rząd nie jest potrzebny). Szept ucieka według wpisanej ścieżki (`TownLife.hold`
  jak w K37) z prędkością tak dobraną, by gracz mógł go dogonić dopiero na dzwonnicy; nie da się go złapać wcześniej - to scena,
  nie wyścig.
- 5 przeszkód: szczelina 1 kratki, komin (obejdź), rusztowanie (rampa), deska nad uliczką (po wąskim: strzałki ścisłe), żerdź z
  praniem (przeskok + dymek Szepta „Ej, to Doroty!”). Czas trwania ok. 90-120 s.
- Wydajność: mapa statyczna, ok. 12 zdarzeń (szczeliny, komin, Szept, 2-3 kruki z Klimat_Miasta, ewent. pies), bez skanowania
  na klatkę; wszystko stanowe.

## 4. Sceny (scenopisy)

Wszystkie używają `CleanHUD.sceneBars(true)` (pasy), `SpeechBubbles` (dymki), `Tawerna.inject` (aktorzy, numery 3100-3199 na
Map008 i Map001), `Atmosphere` (dźwięki), muzyka: istniejące utwory targowe (Atmosphere „time music”) + nowa krótka fanfara
(PixelLab `create_music` ok. 20 s - opcjonalnie; fallback: dzwony Ambrożego). Każdą można pominąć klawiszem P (krótko).

**S1 Pochód otwarcia (49, 14:30-15:00, ok. 70 s).**
1. Kamera na bramie wschodniej (Map008). Pasy. Dzwon Ambrożego: 7 uderzeń (dźwięk istniejący, kolejność jak W2 - ale bez zmiany
   jego tablicy sygnałów).
2. Wchodzą: dwóch żołnierzy kaprala z halabardą (Humans/ Garnizon sheets), Lord na koniu ze stajni (arkusz konia istnieje), Teodor
   za nim z poduszką, na której leży **Srebrny Kruk** (obiekt), dzieci z kwiatami (3 zdarzenia „tłum”), trupa z bębnem. Wszyscy
   idą po ścieżce rynkowej (TownLife.hold + ruch po `moveRoute`), prędkość 2.
3. Dymki: Lord („Niech jarmark będzie sprawiedliwy, a piwo mocne.” bez wody!), sołtys („Od dziś pięć dni…”), Ambroży.
4. Bohater idzie na końcu z **beczką od Borgara** (jeśli J3 zrobione) - gracz może zatrzymać kamerę klawiszem OK (kadr 2 s)
   i „podać beczkę” Lordowi; efekt: +1 do Opinii.
5. Lord kładzie Kruka na poduszce przy scenie w Sukiennicach (wystawa w gablocie na pierwszym kramie), kamera wraca do bohatera.
Efekty: konfetti-liście (cząsteczki jak w Klimat_Miasta), pochodnie przy wejściu.

**S2 Konkurs piwny (49, 19:00-19:50, ok. 90 s + wybory).**
1. Tawerna, sala (Map001): stół sędziowski z czterema zajętymi krzesłami (kwatery z `goscie_sali.txt`), po jednej stronie Borgar, po
   drugiej Mietek Kwaśniak z grymasem. Pasy.
2. Czterech sędziów kolejno: bohater podchodzi (strzałki) do każdego i wybiera dodatek z menu 3 pozycji. Reakcje: dymki + emotki
   (uśmiech / krzywa mina). Hanka mlaska, Ambroży „…dzwon…”, Wit kaszle (zbyt ostre), Teodor milczy i kiwa.
3. Mietek w końcu wypija własne piwo: kwaśna mina (żart), a sołtys ogłasza wynik. Melia gra krótką fanfarę na scenie (TavernLife
   stage). Wygrana - oklaski gości (siedzą - zdarzenia gości z `Tavern guests sitting`).

**S3 „Legenda o Kruku i Wilku” (51, 19:00-19:40, ok. 150 s - kilka aktów).**
- Scena: drewniana platforma z kurtyną (zdarzenia: podest + 2 kotary + 4 pochodnie/ognie). Publiczność: tłum 8 statystów + 2 ławki.
- Akt 1 (30 s): Ania-Wilk wychodzi w futrze, wyje (dźwięk wilka z `Atmosphere`); Bonawentura-Rycerz z drewnianym mieczem.
- Akt 2 (40 s): Pimpek żongluje trzema piłkami między aktami (animacja skryptem: trzy sprajty orbitujące po elipsie); Zygfryd połyka
  ogień (cząsteczki ognia jak ognisko, krótki rozbłysk, tłum „Oooo!” - emotka nad statystami).
- Akt 3 (30 s): Rycerz i Wilk walczą o Kruka - na scenie leży kruk z papieru; Ambroży w pierwszym rzędzie trzyma **prawdziwego**
  Srebrnego Kruka na poduszce (bo tak chciała Ofelia: „relikwia dla scenerii”). Dymki gry aktorskiej.

**S4 Zgaszone światło i kradzież (51, 19:40, ok. 25 s).**
1. Zygfryd dmucha wielkim płomieniem; wiatr (efekt Klimat_Pogoda) gasi pochodnie. Ekran ciemnieje (Mood.js: winieta + zgaszone
   światła); kamera zostaje na bohaterze.
2. 4 sekundy w ciemności: cień przebiega (sprajt Szepta jako sylwetka, `Tawerna.inject` + niskie światło), krzyk kobiety, brzęk.
3. Pochodnie wracają: poduszka u Ambrożego pusta. Dźwięk dzwonu (Ambroży, alarm: dopisać dla tego wątku **dwa uderzenia i cisza**
   do tablicy `SIGNALS` - tylko dane). Pasy znikają, bohater odzyskuje kontrolę. Sołtys: „Zamykam rynek. Do rana nikt nie wyjeżdża.”
Gracz ma 1 szansę zobaczyć kierunek cienia: strzałka dymka „Za sceną!” - to pierwsza poszlaka (bez niej szuka dłużej).

**S5 Pościg po dachach (52, 23:30, 90-120 s).** Patrz 3A. Kamera podąża za bohaterem, Szept ucieka po ścieżce; pochodnie na
dachach nie ma (ciemno - tylko latarnie z rynku, każde światło to ogień); kruki w tle odlatują; na końcu dzwonnica Ambrożego (Map108 zewn.),
księżyc z `Sky.js`. Dźwięk: kroki po dachówce (Atmosphere), oddech (można użyć istniejących odgłosów biegu).

**S6 Zamknięcie jarmarku (53, 12:00, ok. 60 s).** Rynek, Lord i sołtys na schodach, Kruk na poduszce, tłum klaszcze. Zakończenie zależne
od wyborów (patrz 6). Nad kramami ostatnie lampiony; Pimpek żongluje na pożegnanie; trupa pakuje wóz i odjeżdża promem 55 (3 dni).

## 5. Nowe postacie, rzeczy, rekwizyty, wnętrza

**Nowe przedmioty** (wirtualne `v:`, bez zmian w `Items.json`, bo edytor zamknięty): `v:deska_kram`, `v:plachta`, `v:obrecz`, `v:lampion`,
`v:srebrny_kruk` (kluczowy, nie do sprzedaży), `v:kosc_jarmark` (kość specjalna), `v:kostium_*` ×3 (dostawy dla trupy), `v:bilet_ferry`
(dowód z kieszeni Marcela). **Żaden** nie jest wodą ani naczyniem z wodą (reguła suszy). Deszczówka tylko jest zabierana.

**Rekwizyty na mapie (Map008, wstawiane przez `Tawerna.inject`, tylko w dniach 47-53):**
sceny (podest 6×3 kratki + kurtyny), 6-8 kramów (rysunek: te same części Winlu, ostre piksele), 8 lampionów na słupach, wystawa-gablota
Kruka w Sukiennicach, 3 ławki dla widzów, wóz trupy (z koniem - arkusz konia z `docs/konie`), bębny, drewniane schody sceny,
transparenty (sznury z chorągiewkami). Nic z tego nie może wyglądać jak przedmiot do zabrania: kramy z towarem to **obrazki w stylu
kramów istniejących**, nie sakwy i skrzynie (zasada „Decor is not items”).

**Wnętrza:** żaden nowy budynek nie dostaje wnętrza. **Dachy Kruczogrodu** (nowa mapa, ok. 40×28) - jedyna nowa mapa. Pozostałe
miejsca (Sukiennice - arkady na zewnątrz, Cech, Łaźnia, Przytułek) działają **na zewnątrz przy wejściach**: poszlaka to
wstawiane zdarzenie lub rozmowa przy drzwiach (te budynki nie mają jeszcze wnętrz; jeśli inne wątki je zrobią - jarmark dostanie
rozmowę w środku jako bonus, dane są niezależne).

**Poszlaki (J9):**
1. **Sukiennice (gablota):** cięty sznur kotary + **zielona kropla wosku** (teatralna świeca) - ktoś z trupy. Plus: gablota otwarta
   *kluczem*, nie rozbita.
2. **Cech (zamkarz / tablica rejestrów cechu):** rejestr: „dorobiony klucz do gabloty - pan w sukiennej chuście, zapłacił
   srebrnym groszem z orłem” (moneta z kontynentu) - wskazuje Marcela. (Mistrz zamkarz = osoba z wątku „Majstersztyk”, jeśli ten
   wątek ją tworzy; zapasowo pisarz cechowy.)
3. **Garbarnia (Ignac):** w kadzi z garbnikiem ktoś wyprał suflerski płaszcz (szary, wyświechtany, z białą szminką) - pachnie
   dębiną; ślad prowadzi do Szepta. Pies (Dog.js) może go „zwęszyć” z płaszcza, bez psa Ignac sam to mówi.
4. **Łaźnia (Map008):** pracownik: „O świcie mył się u nas facet z białymi śladami na twarzy i prosił o mydło do… farby”
   (szminka teatralna) - Szept był tu rano.
5. **Przytułek (Ciotka Stefa):** Szept odwiedził matkę-uchodźczynię (nowa postać: **Berta Szeptak**, statystka). Jego matka
   żyje w przytułku, a **Marcel opłaca jej dach** (rachunki w kieszeni suflera); Szept kradnie, bo ona zginie bez
   dachu. To moralny sens wyboru z J11.

**Podejrzani i ich winy:** Bonawentura (próżność, chciał wystawić się na „bohatera, który znalazł Kruka” - podstęp, wina: kłamstwo
w dymkach, nie kradzież), Marcel (zleca), Szept (wykonuje). Gracz może oskarżyć fałszywie: Bonawentura obraża się (trupa gra
przyszły wieczór słabiej, a Opinia -2).

## 6. Animacje i grafika (zestawienie)

**PixelLab (postacie, styl bohatera, 64×64, 8 kierunków; 6 generacji sztuka; chód: istniejący zestaw animacji PixelLab ~ 4-8 gen/postać):**
Ofelia, Pimpek, Zygfryd, Bonawentura, Ania, Szept, Marcel, Wanda (8 postaci, z chodem ok. 100-130 gen), tymczasowy chłopak Mietka
(wykorzystać istniejący szkielet „dziecko/chłopak”). Rekwizyty: Srebrny Kruk (obiekt, 1 kierunek, 32×32, ~5 gen), poduszka z
Krukiem (tło), 8 kramów (4 warianty × kolor - obiekty 96×64 ~ 5 gen sztuka), podest sceny (obiekt 192×96, ~6 gen), gablota (~5 gen).
Razem ok. **250-300 generacji**; z puli 3775 to ~8%.

**Rysowane skryptem / istniejące:**
- żonglerka: 3 piłki orbitują (Python → arkusz 3 kl. lub sprajty w pętli),
- ogień Żara: dynamika ognia z istniejącego Campfire (animowany płomień + dym), jeden dodatkowy „rozbłysk” (efekt),
- pochód: ruch, tłum z istniejących arkuszy mieszkańców, koń ze stajni,
- zgaszone światło: Mood.js + Sky/pochodnie,
- minigra dachów: arkusze bohatera `run8` i `two-footed-jump` (są), dachy z istniejących obrazków budynków (wycięte skryptem),
- lampiony: ogień jak w Klimat_Miasta (lampa to ogień, blask).
- opcjonalna muzyka targowa: `create_music` (instrumenty ludowe) ~ 3 utwory.

**Próbki:** `docs/zadania_nowe/jarmark_probki/szept_*.png` (Szept - sufler-złodziej).

## 7. Nagrody i konsekwencje

| źródło | pewne | najlepsza ścieżka |
|---|---|---|
| J2-J4 (wykonanie prac) | 3 × 12 G = 36 G + 50 PD | 36 G |
| J6 konkurs (wygrana) | 0 | +40 G (nagroda sołtysa), Borgar -15% na zmiany „Mistrz kufla” → +5 G/zmianę przez 14 dni (Renoma +10) |
| J7 turniej | 0 (wpisowe 20 G; niewygrana: -20 G) | **+120 G** (pula), Kość Kruczogrodu |
| sprzedaż w kramach (J5-J9) | 25 G | do **+60 G** (kupcy płacą +30% za 10 sztuk dziennie; w dzień targowy 49 razem) |
| J9-J11 odzyskanie Kruka | 60 G od sołtysa + 50 PD | +60 G; **100 G za Marcela** (albo szantaż +80 G, brudne) |
| razem | **~120 G** | **~330 G** (bez szantażu) |

Zakończenia (J11):
- **A „Pełny jarmark”:** Kruk wrócił, Marcel aresztowany (dowody: bilet + moneta + rejestr), Szept ułaskawiony (świadek). Opinia +8, Ambroży
  zaufanie +, trupa gra pożegnalny wieczór w tawernie, Melia dogaduje się z Ofelią (nowa pieśń w jej repertuarze).
- **B „Złodziej bez zleceniodawcy”:** mniej niż 3 poszlaki: Kruk wrócił, Szept w dybach, Marcel odpływa promem 55. Opinia +3, niepokój Ambrożego.
- **C „Litość”:** Szept puszczony, matka zostaje w przytułku (gracz płaci Marcelowi 40 G, by zdjął klątwę dachu) - Opinia +5, Szept zostaje
  pomocnikiem Borgara (krzesło na zapleczu), Marcel jednak na wolności.
- **D „Szantaż”:** gracz bierze od Marcela 80 G za milczenie; Straż Pewności zyskuje informację (W9: ślad „kruki w mieście” staje się
  jawniejszy - jedna linia), Opinia -3; Ambroży wie i milczy.
- **Porażka:** Kruk nieodzyskany do południa 53 → Lord odwołuje jarmark; koniec w gorzkim tonie (Opinia -5), ale Marcel zostaje czysty i wraca
  w Akcie II jako zlecenie. Rzadkie: nie można całkiem „przegrać” bez zignorowania całego wątku.
- Stałe: **przywilej kramu** (od Opinii 40): bohater ma w dniach targowych jeden kram w Sukiennicach (sprzedaż 10 sztuk dziennie z +20%).

## 8. Szkic implementacji

- **Nowe pliki:** `js/plugins/Jarmark.js` (sceny, pochód, kradzież, minigra dachów, wstawki `Tawerna.inject` 3100-3199), `Jarmark_Data.js`
  (wątek na silniku `Watki.watek`; `zadania.W17`, kroki J1-J11, rozmowy, akcje; paczka remarks/gossip/spots), `js/teksty/jarmark.txt`.
  Trupa jako **wątek w Podroznicy**: przybycie promem 49 (rekordy `obsada.trupa`) - bez zmian systemu.
- **Używane systemy:** Watki, TownQuests (kroki, nagrody, terminy), TownLife (`hold`, `setGone`, `addCondition("jarmark")`), TavernDice (turniej
  = 3 meczów wołanych z `Jarmark` z listy rywali; dopisać rywala `wanda` w `TavernDice_Data` + kość fałszywą), TavernLife (konkurs, stage Melii),
  CleanHUD.sceneBars, SpeechBubbles, Mood.js, Klimat_Miasta, Torch, Dog (opcjonalnie), Podroznicy (rezerwacja pokojów trupy 4-24).
- **Mapa:** nowa mapa „Dachy Kruczogrodu” (wymaga numeru id w MapInfos - **zrobić w edytorze albo poprosić użytkownika; mapy to jego teren**).
  Poza tym żadnych zmian w mapach (kramy i scena wstawiane).
- **F9 (Debug.js):** wiersz „Jarmark”: skok do J1, J5, J6, J7, J8 (przed kradzieżą), J9, J10, J11; „stan: przywilej kramu”.
- **Testy:** `tests/jarmark_test.js` (warunki startu, flagi, terminy, brak wody w nagrodach, poszlaki 3/5, zakończenia A-D, minigra przeszkody,
  pominięcie scen); wpis do audytu przejścia; przejście autopilotem (`tests/autopilot_fabula`) przez dni 47-53.
- **Wielkość: L** (ok. 3 sesje agenta: dane+teksty, sceny+minigra, grafika/test). **Ryzyka:** (1) Map008 jest zapchana (tłum musi być w 8
  zdarzeniach, kramy to obrazki bez kolizji z `Occupy`); (2) nałożenie z falą W6 52 (tłum uchodźców) - uniknąć podwójnych aktorów na rynku;
  (3) mapa dachów - wymaga zgody użytkownika; (4) poszlaka z Cechem zależy od tego, co zbuduje „Majstersztyk”; (5) wydajność sceny
  przedstawienia (8 statystów + 6 efektów) - pilnować budżetu `wydajnosc_test`.

## 9. Powiązanie z weselem (W18) i kolizje

Zob. `wesele.md`, rozdz. 9. W skrócie: **wesele dni 19-22 (epilog 23), jarmark 47-53 - nie nakładają się**; bohater zna już parę i Melię, a wynik wesela
daje 3 stałe skutki w jarmarku (rozmowy Doroty/Wojciecha, wóz na beczki, Melia przy scenie).

**Kolizje z innymi dniami kalendarza:** W14 „Poselstwo” (dni 37-46) kończy się dzień przed startem - Apartament Złoty pusty; K37 w dniu 49
(Feliks); K31 imieniny Lorda (33) - minęły; prom 49/52/55 (trupa przypływa 49 o 9:00 i odpływa 55); **fala W6 52** - w czasie śledztwa na rynku
jest tłum uchodźców: wyłączyć 3 z ośmiu statystów jarmarku, żeby nie dublować; dożynki 56 - po jarmarku (dzień wolny).

## 10. Pytania do użytkownika

1. Czy Srebrny Kruk ma skrytkę z kawałkiem zwrotki (hak do W3), czy zostaje „tylko relikwią”?
2. Mapa „Dachy Kruczogrodu” jako osobna mała mapa (zalecam) - czy mogę ją zaplanować, czy wolisz pościg tylko w scenie z kamerą po Map008?
3. Wygrana w konkursie i turnieju: czy ma wpływać na przyszłe dochody (Borgar +5 G/zmianę, „przywilej kramu”), czy wystarczą same nagrody i opinia?
