# Stan na 2026-11-13 w nocy (najpierw to)

WGRANE 2026-11-12 po południu i wieczorem (wszystko w kopii do grania; NIC nie jest w commicie - ostatni commit b86f3c6 z 11-08, lokalny):
- Potwory z morza, fala 2 (tools/potwory2): szkielety z pałką/mieczem (od 1. dnia), włócznią/młotem (od 20.), kraby (od 20.),
  rzadki krab-kolos x2 (od 40.), kraken z dużymi mackami; kapitan z chorągwią w rozdz. 5 W23; poprawiona broń w klatkach chodu.
- Wydajność (docs/WYDAJNOSC_ETAP4.md - plan, spis kosztów, wyniki): łowca szarpnięć tools/wydajnosc/szarpniecia.js; konie w mieście
  nocą bez zacięć 60-230 ms (Konie.js yardGrid); siatka dróg zwierząt liczona po kawałku (Hunting_Path); pamięć dźwięków SE
  (Atmosphere.js); obrysy/sylwetki z jednego odczytu arkusza (Sky.sheetPixels); HUD wierszami; uśpione dalekie nieruchome
  zdarzenia (Wydajnosc opts.stillAll: miasto -17..-24%); warstwy bierne bez pętli (opts.plainSkip); rzeczy na ziemi w układzie mapy.
  Przy 4x wolniejszym procesorze: miasto ~25 -> ~19-21 ms, Jar ~27 -> ~24, przystań ~22 -> ~17-19, tawerna mieści się (~14).
- Prawdziwe błędy naprawione przy okazji: czarny koń (błąd w każdej klatce), ~33 zbieralne „widma” wiosną (PoryRoku).
- Testy: ~20 nieaktualnych testów naprawionych (kompas, pies, Akt III, atmosfera, minimapa, rzemiosło, świat, podziemia, konie,
  cienie, motyle, sygnały, nocne zagrożenie); wydajnosc_test 11/16 (zostały budżety czasu Jar/miasto/przystań/farma/burza).

ZROBIONE 2026-11-13 rano: obrona tawerny w Akcie III (gracz: „niech Rafał ma więcej HP”) - Act3_Data DEFENDERS hp: Rafał 85 -> 250,
Ignac 85 -> 130, Kuba 80 -> 120, uchodźcy 70 -> 105; „utrzymana” w ~90% prób, act3_test 47/47 (4 przebiegi); kopia do grania odświeżona.
DALEJ (wydajność): kolejny duży zysk tylko z przebudowy potoku duszków bliskich obiektów (kilkanaście haków co klatkę) - osobny etap.

# Stan na 2026-11-12 przed południem (najpierw to)

Dalej 2026-11-12 (do 11:40): WGRANE Osada Milczących na Łące pod Gawrą (Map004, wsch. łąka; brama na Górach usunięta),
życie tawerny (miejsca do jedzenia na stołkach, taca śniadania w Apartamencie), palisada Podgrodzia (region 2 przywrócony),
rdzeń: zdarzenie bez danych nie wywraca gry, garnizon: bez łachy, gdy wraku nie ma w świecie. Stare testy naprawione
(cienie, potrzeby, wątki, wnętrza, F9, pies, polowanie, mieszkańcy, rozmowy, góry, przystań, garnizon, dwór, latarnia, kruk,
Podgrodzie, orzeł, życie tawerny, rdzeń). W BUDOWIE: W19 Sygnały, W21 Gorączka (wydajność + regresja), W17 Jarmark
zbudowany - do dokończenia: pełny test, pomiar przedstawienia (było +15,4%), regresja (tools/jarmark, polecenia w raporcie).

WGRANE rano 2026-11-12: W20 Kruczy listonosz (Kruczarnia Map214), W23 Coś z głębin (potwory z morza, najwyżej 3 naraz),
W18 Wesele w Złotym Kuflu; rdzeń: tablica zdarzeń mapy od razu w pełnej długości (tawerna 33,5 -> 3,8 µs na events());
F9: wątki po numerach, potwory w zakładce walki; poprawione stare testy (cienie, potrzeby, wątki, wnętrza miasta, F9).
CZEKA NA GRACZA: Osada Milczących na południowej łące podwórza dziadka (Map020) + usunięta brama na Górach
(tools/osada_laka, zdjęcia docs/osada_laka/zestawienie_gra.png, laka_przed_po.png) - mapa gracza, więc najpierw pokazać.
W BUDOWIE: fala 2 - W19 Sygnały z młyna, W21 Gorączka w przytułku, W17 Jarmark (nowe kamienice + pościg po dachach);
przegląd życia tawerny (wynajem pokoi, schody, łaźnia) na przebudowanej tawernie (tools/tawerna_zycie).

# Stan na 2026-11-11 w nocy (najpierw to)

WGRANE wieczorem 2026-11-11:
- Dawcy zadań w tawernie (21 zadań, 5 ogłoszeń), ostatnia paczka usterek map (9 map + 4 chaty), poprawki ze zdjęć gracza
  (słupki przy płotach, stóg u dziadka, krąg menhirów na polanę pod laskiem Łąki (80,88)), napisy ozdób w domu dziadka USUNIĘTE,
  krzaki z obrazkiem pory roku nie rysują się już jako 12 krzaków, kufel nie fruwa nad gośćmi stojącymi tyłem.
- Mapa wyspy (menu P -> Mapa -> E): nowe zdjęcia 9 map planszy + kafel morza z wody Przystani (bez ramki).
- W22 Majstersztyk (cech Map215, Ostap/Ludwik/Jaś, Młotek majstra 409).
- TEMPO ŚWIATA (gracz): bohater boso chód 2,75 / bieg 3,5 (szybkość silnika); wszyscy inni przeliczeni tą samą skalą
  (FreeMovement worldSpeed) - zwierzęta, pies, mieszkańcy, goście, wrogowie.

W TOKU (agenci, nic z tego nie jest w grze):
- Osada Milczących: brama na Górach (6,27) do usunięcia; Osada ma stanąć na łące planszy, ale NIE w Kruczym Jarze
  (gracz); zdarzenia wstrzykiwane w grze (własny zakres numerów), w plikach map numery < 500. tools/osada_laka.
- W18 Wesele: wydajność sali +12% (cel <= 10%) - scalanie ozdób w jeden obrazek. tools/wesele.
- W23 Potwory z morza: zbudowane (morze_test 54/54), czeka na pomiar wydajności na spokojnej maszynie. tools/potwory.
- W20 Kruczy listonosz: w budowie. tools/listonosz.
- Fala 2 (W19 Sygnały, W21 Gorączka, W17 Jarmark z dachami) - jeszcze nie ruszona.

Stare błędy testów do naprawy (padają też bez dzisiejszych zmian): tavern_life_test 28/40 (oczekuje karczmy 101x55 itd.),
town_life_test 8/10 i miasto_mieszkancy_test 16/25 (liczby mieszkańców, teksty rozmów), dog_test 7/9 (miejsce na budę),
hunting_test 31/33, needs_test 43/45 (menu stawu), rock_shadow_test 9/10 (koronkowy cień krzaka), watki_test 10/11,
town_interiors_test 53/54 (Dzwonnica), w8_mountains 34/36, mountain_places 6/22.

# Stan na 2026-11-10 wieczorem (najpierw to)

## Poprawki map planszy po przeglądzie (docs/audyt_map/RAPORT.md) - kroki 1-4 WGRANE do gry
1. Miasto + ślady po przeniesieniu działki i domu dziadka, niewidzialne ściany (Map008, 003, 020, 024).
2. Zaokrąglenie kanciastych łat gruntu na 9 mapach (drogi zamrożone, nie ruszane).
3. Góry: 5 zamkniętych wzgórz, półki orła tylko z powietrza; latarnia w Przystani: dwa piętra, latarnia przy tylnej krawędzi.
4. Garnizon, Przystań, Podgrodzie, dwór: bramy, dom z kafli, płoty, fosa, łodzie z góry, ruina, sad, rabaty; ostre cienie z edytora usunięte.
Kopie zapasowe: ..\Tawerna_archiwum_2026-11-08\poprawki_krok1..4_*. Kopia do grania odświeżona po kroku 4.

## Krok 5 - krajobraz zamiast pustych łąk (WSZYSTKO WGRANE 2026-11-11)
- Próba na Łące pod Gawrą (Map004): kopia robocza tools/poprawki_krok5/staging/data/Map004.json,
  skrypt `python tools/poprawki_krok5/plan_004_b.py` (biblioteka tools/poprawki_krok5/krajobraz.py),
  zdjęcia z gry docs/audyt_map/poprawki/krok5/ (zestawienie_gra.png, przeglad_cala_mapa.png).
- Poprawki po pierwszej wersji zrobione 2026-11-11 (ścieżki, polanka, słupki bramy, rzadsza kępa 13,3 ms, mniej samotnych sosen,
  drzewa zdjęte z płotu i spod pni). Gracz zaakceptował, wgrane, kopia w ..\Tawerna_archiwum_2026-11-08\poprawki_krok5_*.
- Następnie: pokazać graczowi przed/po -> wgrać (edytor zamknięty, kopia do archiwum, potem
  `python tools/drzewa/drzewa.py --mapy 4 --wykonaj`, odświeżyć kopię do grania) -> jeśli się spodoba,
  to samo na pustych łąkach: Podgrodzie (północ, południe), dwór (równina, trawnik), Garnizon (wschód,
  zachód, południe), Przystań (łąka), Kruczy Jar (południe).

- Pozostałe puste łąki (2026-11-11): Kruczy Jar, dwór, Podgrodzie, Garnizon, Przystań zrobione w kopiach roboczych
  tools/poprawki_krok5/mapy/<NNN>/staging/data (plany plan_NNN.py), zdjęcia docs/audyt_map/poprawki/krok5/<NNN>/, plus stogi w mieście
  (build5.py, tools/miasto5/staging). Płynność sprawdzona. CZEKA na „wgraj”: kopie do archiwum, drzewa --mapy 3,24,111,125,162,
  miasto przez wgraj_mape.py + oba wypieki klimatu, odświeżyć kopię do grania. WGRANE 2026-11-11 9:22 (kopie poprawki_krok5b_*).

## 2026-11-11 po południu
- WGRANE: 6 nowych budynków w mieście (wiatrak, cech, łaźnia, przytułek, garbarnia, sukiennice), menu F9 v2, zapisy usunięte (archiwum zapisy_*),
  wersja projektu podbijana przy każdym wgraniu (tools/drzewa).
- CZEKA na „ok” gracza: plan dostosowania zadań do planszy + kopalnia z wagonikiem na Orlą Grań (docs/questy_mapa/PLAN.md, plan.json);
  propozycje do kopalni: dwa wagoniki, rozjazd z rudą, za darmo, bez szczurów.

## 2026-11-11 wieczorem
- WGRANE: zadania na planszy + kopalnia z wagonikami (Orla Grań), poprawki z 5 zdjęć gracza; Pustelnia znowu poza światem (gracz: „na razie bez pustelni”).
- W TOKU: poprawki pełnej listy usterek docs/przeglad_ekranow/LISTA.md (586 wierszy, 109 poważnych) - 4 agenci mapami
  (miasto; Podgrodzie+Garnizon; Góry+Przystań; reszta) + brat Kleofas w kaplicy miasta zamiast Pustelni (W2 rozdz. 7, W13 rozdz. 3).
  Kopie robocze: tools/usterki/<folder>/staging, miasto przez tools/miasto5/staging. Po każdej mapie: obejrzeć KAŻDY ekran, potem wgrać.
- 19:05-19:26 WGRANE: 7 zadań z Pustelni przeniesione (Kleofas w kaplicy, kruki w Kruczarni); dawcy zadań w tawernie
  (docs/zadania_nowe/dawcy_w_miescie.md: 21 zadań, 5 nowych ogłoszeń na tablicy); ostatnia paczka usterek (9 map + 4 chaty,
  docs/usterki/reszta/). Cała lista usterek przerobiona. versionId 23326098.
- W TOKU: nowe długie wątki, fala 1 (W20 Kruczy listonosz, W22 Majstersztyk, W18 Wesele, W23 Coś z głębin - potwory z morza);
  potem fala 2 (W19 Sygnały z młyna, W21 Gorączka, W17 Jarmark z pościgiem po dachach nowych kamienic). docs/zadania_nowe/README.md.

## Dalej (lista zadań z 2026-11-10)
- Reszta uwag z przeglądu dla Łąki, Kruczego Jaru, domu dziadka, miasta.
- Naprawić stare testy: Góry 6/22, latarnia (losowo 7/12 lub 13/18), Przystań 33/35, Garnizon 34/47,
  dwór 3/5, Podgrodzie (zawiesza się) - pisane pod dawne mapy.
- Test wydajności przy spokojnym komputerze; obrazki map w zakładce „Mapa” dla zmienionych map.
- Pełny przebieg testów i zapis w gicie (ostatni commit b86f3c6) - tylko na słowo gracza.
- Odłożone: targ zwierząt, nowe budynki w mieście, 7 pomysłów na klimat miasta.

---

# Plan działań na jutro (ustalony 2026-11-08 wieczorem)

## 0. Najpierw – przy zamkniętym edytorze
1. **Tawerna** (parter + 2 piętra 63×55, schody w tych samych miejscach) – gotowa i przetestowana w kopii roboczej.
   `python tools/tawerna2/zainstaluj.py --wykonaj` (jeśli w międzyczasie zapisano w edytorze Map001/025/026/008/009 – najpierw
   `python tools/tawerna2/zbuduj.py`). Potem poprawić w `docs/tawerna2/NIE_RUSZAC.md` numery schodów (piętro: 288-290 w dół,
   293-295 w górę, krata 298; poddasze 159-164).
2. **Nowe budynki na mapie testowej** (duża stajnia A v3 + kamienica, kuźnia, spichlerz, dom rybaka, zajazd, wieża, warsztat cieśli,
   dom mieszczanina) – kopia robocza `tools/budynki/staging/data/Map027.json` (`tools/budynki/ustaw.py` na bieżącej Map027);
   instalator do napisania.

## 1. Kruczogród: wracamy do starej mapy Winlu + Nowe Miasto (decyzja gracza)
- **Wielkość jak teraz: 120×120**, zewnętrzny mur i bramy na krawędziach (jak teraz – pasują do sąsiednich map: N x22-25 → dwór,
  W y50-51 i y104-107 → Podgrodzie, E y10-12 i y48-50 → Łąka, S x30-32 → Kruczy Jar).
- **Stare Miasto = stara mapa Winlu** (kopia: `..\Tawerna_archiwum_2026-11-08\kruczogrod_miasto_20261108_154456\data\Map008.json`,
  przed paczką): tawerna na tarasie zamkowym, ogród rycerzy, kościół z cmentarzem, rynek ze studnią, kwartały domów; **stary mur
  zostaje jako mur wewnętrzny** (brama wschodnia i południowa w nim).
- **Przywrócić razem z przepięciami** (odwrotnie: `tools/miasto4/przepiecia.json`, potem `tools/miasto3/przepiecia.json`) – wnętrza,
  mieszkańcy, studnia, rynek, zadania. Tawerna (drzwi 51,16) i konie zostają.
- **Stajnia i konie MUSZĄ zostać jak teraz**: podwórze stajni (płot x61-79, y4-26), **nowa duża stajnia A v3** (obrazek
  `!$Stajnia_Duza_A`) jako budynek stajni z wejściem do wnętrza (Map181, stryszek, zmiana w stajni), 5 koni z całym zachowaniem
  (Konie.js: prostokąt x63-77 y9-24, drzwi stajni czytane ze zdarzenia 209), dwa wodopoje x62 y17-19 i y21-23.
- **Większość miasta wypełniona budynkami**; budynki bez wnętrz na razie z zamkniętymi drzwiami (gracz się zgodził).
- **Nowe Miasto** (pusta przestrzeń między starym a zewnętrznym murem):
  - **wschód** (przy bramie na Łąkę): podwórze zajazdu dla podróżnych, targ koński, **targ zwierząt**, kuźnia podkuwacza,
    garbarnia z suszarnią skór;
  - **południe** (przy bramie do Kruczego Jaru): pola z rzędami zboża, wiatrak na pagórku, spichlerz, stodoła z oborą, sad,
    pasieka, pastwisko; obóz uchodźców i wzgórze z szubienicą (już w fabule).

## 2. Nowe budynki (styl Winlu, pasujące do gry) – do czego służą
| Budynek | Do czego |
|---|---|
| Wiatrak (obracające się skrzydła) | mąka z ziarna, praca „worki na wóz”, mąka dla piekarni; młynarz widzi, kto nocą chodzi drogą (plotki) |
| Spichlerz miejski | zapasy na suszę, zadanie o kradzieży zboża, praca przy noszeniu |
| Stodoła z oborą | krowy i owce, praca parobka (dojenie, siano) |
| Kruczarnia (wieża z gołębnikiem dla kruków) | poczta krukami: listy od dziadka z wojny, listy do mieszkańców (wisiorek z krukiem, „kruczy strażnicy”) |
| Browar i słodownia przy tawernie | piwo dla Borgara, praca przy warzeniu, lepsze piwo na zmianie |
| Sukiennice (kramy pod arkadami przy rynku) | tkaniny i rzadkie towary, kupcy z promu, serce dnia targowego |
| Cech (dom cechowy) | tablica zleceń rzemieślników, stopnie w cechu |
| Łaźnia miejska | odpoczynek, siły, plotki |
| Przytułek / szpital | leczenie za opłatą, chorzy uchodźcy (W6) |
| Kuźnia podkuwacza przy stajni | podkuwanie koni (brakująca część zmiany w stajni), naprawa podków i narzędzi |
| Garbarnia z suszarnią | skóry z polowań na sprzedaż i do namiotu |
| **Targ zwierząt** (zagrody, szopa handlarza, klatki z drobiem) | kupno zwierząt domowych – patrz punkt 3 |
| 6-8 nowych domów (kamienica z podcieniem, dom z ogródkiem, chata z bali, dom szachulcowy...) | zapełniają kwartały; z mieszkańcami – do wejścia, reszta zamknięta na razie |
Sposób: jak duża stajnia – części Winlu + panele PixelLab na wzór Winlu, ostre piksele, kolory jak w grze; budynki jako
obrazki-zdarzenia z `<Occupy:...>` (za budynkiem da się przejść, postać częściowo zakryta), drzwi z animacją otwierania.
Partiami po 3-4, każdą partię pokazać przed wstawieniem.

## 3. Targ zwierząt (nowa mechanika)
- Handlarz: kupiec bydła z miasteczka (już w fabule – `js/teksty/domy.txt` kod.glowna.7, skupuje zwierzęta przy stracie działki).
- Na sprzedaż: kury (w wiklinowej klatce, niesione), owce, kozy, krowy, świnie (jeśli jest chlewik); ceny wg wartości; w dzień
  targowy taniej i większy wybór.
- **Prowadzenie na linie**: kupione zwierzę idzie za bohaterem na sznurze (widać linę od ręki do szyi), wolniej, przez przejścia
  map; czasem przystaje i trzeba je pociągnąć; drób w klatce w rękach.
- **Wprowadzenie do budynku**: przy furtce obory / owczarni / kurnika „Wprowadź krowę do obory” → zwierzę mieszka w tej zagrodzie
  (Livestock.js: chodzi po wybiegu, na noc do szopy).
- **Liczba zwierząt = produkcja** (mleko / wełna / jajka), pojemność zagrody; pusta zagroda nic nie daje.
- **Stare zapisy**: zagrody, które już stoją, zachowują swoje dotychczasowe zwierzęta (obora 2 krowy, owczarnia 3 owce, kurnik 3 kury).
- Dziś: `js/plugins/Livestock.js` (zwierzęta to dekoracja, stała liczba), `Farming_Data.js` BUILDINGS yard {animal, count}.

## 4. Kolejność pracy
1. Przywrócić starą mapę Winlu z przepięciami (kopia robocza; stajnia A + konie + wodopoje na swoim miejscu).
2. Szkic układu Nowego Miasta jako obrazek → akceptacja gracza.
3. Grafiki budynków partiami (pokazywać).
4. Budowa dzielnic, Targ zwierząt + mechanika, test w grze, zdjęcia przed/po, instalacja przy zamkniętym edytorze.

## Zasady (gracz)
Równo, profesjonalnie, bez pustych połaci i bez czarnych dziur we wnętrzach, nic uciętego, wszędzie da się dojść; mapy gracza –
pokazywać przed/po; wydajność najpierw; testy pełne i commit tylko na jego słowo; najpierw zbudować wszystko, testować raz na końcu.

## Pozostałe (z wcześniej)
- Drzwi nowych budynków – do których wnętrz.
- Narzędzie do przenoszenia map na inny zestaw kafli – tak/nie (zestawy do budowania: 18 „Winlu (nowy styl)”, 19 „Paczka”).
- Konie: łaty srokacza przy chodzie w lewo/prawo (lustro).
- Testy ze starymi miejscami w mieście/tawernie, `tools/drzewa` dla miasta, pełny przebieg testów i commit – na słowo gracza.
- Fabuła na później: osadnicy w pustych domach, listy od dziadka (→ kruczarnia), D24 i kryjówka u dziadka (W6), odstawione wątki
  planszy (W4/W13 Pustelnia, W8 Osada, Orzeł, wrak, cysterna Borgara).
