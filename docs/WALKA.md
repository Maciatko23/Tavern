# Walka i rozwój postaci — dokument projektowy

Ustalone z autorem 2026-09-24. Walka **taktyczna i ciężka**, na żywo na mapie (swobodny ruch w 8 kierunkach),
zbudowana na tym, co już jest: wytrzymałość, życie, rany i opatrunki, głód i pragnienie, skradanie (C),
łuk i proca (celowanie), włócznia i dzik (Hunting.js).

## 1. Oddech — waluta walki

- W walce pod paskiem wytrzymałości pojawia się krótki pasek **oddechu**. Każdy cios, przewrót i blok go
  zużywa; wraca w 2–3 s, gdy przestajesz działać.
- Pusty oddech = **zadyszka**: wolniejszy ruch, brak przewrotu.
- Zmęczenie (dzienna wytrzymałość), głód, pragnienie i rana **skracają** pasek oddechu.
- Walka nie zjada dziennej wytrzymałości na pracę; życie zabierają tylko trafienia.

## 2. Ruchy gracza

| Klawisz | Ruch |
|---|---|
| O (stuknięcie) | cios; 2–3 w rytmie = kombo, ostatni odrzuca |
| O (przytrzymanie) | ciężki cios: ładowanie, przebija blok, mocno zbija równowagę |
| Spacja | przewrót w 8 kierunkach z chwilą nietykalności (Spacja przestaje być „OK” na mapie; OK = O / Enter) |
| P (przytrzymanie) | blok tarczą (mniej obrażeń, kosztuje oddech) |
| P tuż przed trafieniem | parowanie: wróg traci równowagę, można go dobić |
| [ / ] | poprzednia / następna broń w ręku |
| Tab | tryb walki / tryb normalny (klawisze ustalone z autorem: tylko w trybie walki O = atak, P = obrona, [ ] = broń) |
| C + cios | atak z ukrycia na nieświadomego wroga (bez „!”), gdy się skradasz albo zachodzisz od tyłu: 2,5 raza większe obrażenia (strzał 2 razy) i złamana równowaga |
| łuk / proca | jak teraz (celowanie kółkiem) |

Każda broń walczy inaczej: pałka szybka i słaba, siekiera wolna z szerokim zamachem, włócznia daleka
(pchnięcia), miecz z kuźni zrównoważony. Broń się zużywa (Durability.js).

## 3. Trafienie ma wagę

- Stop-klatka przy uderzeniu, odrzut, biały błysk trafionego, iskry / krew, wstrząs ekranu przy ciężkim ciosie,
  dźwięk zależny od broni.
- **Równowaga** (pasek obok życia wroga): ciosy ją zbijają, pusta = zatacza się i jest odsłonięty.
  Gracz też może zostać przewrócony (np. łapa niedźwiedzia).

## 4. Przeciwnicy — czytelne zamiary

Każdy atak: **zamach** (poza, „!”, błysk) → **uderzenie** → **odsłonięcie**. Czytasz zamach, robisz unik albo
parujesz, karzesz w odsłonięciu.

- **Zwierzęta**: wilki (wataha 3–4, nocą; krążą, jeden atakuje, reszta zachodzi z boku; bez przewodnika
  uciekają), dzik (szarża — przeniesiony do nowego systemu), niedźwiedź (wolny, dużo równowagi, cios łapą
  i przygniecenie — **nie do sparowania**, tylko unik).
- **Ludzie**: bandyta z pałką (blokuje, markuje), nożownik (szybki, słabe pchnięcia, odskakuje), łucznik (trzyma dystans, ucieka), najemnik z tarczą
  (sam paruje: trzeba ciężkiego ciosu albo zajść od tyłu). Przy małym życiu mogą się **poddać** — oszczędzić
  czy nie (wątek frakcji Gruma).
- **Stwory z ruin (Akt II)**: pusta zbroja strażnika (tylko ciężki cios / w plecy), upiór prawdy (widoczny i
  trafialny tylko, gdy „pokazuje prawdę”; atakuje Hart ducha). Od etapu 4 (§11) osiem rodzajów - szczury, pająki, puste zbroje,
  nietoperze, topielce, kamienniki, upiory prawdy i cienie z twarzą mieszkańca - oraz bossowie pięter 20-90 i strażnik dziesiątej bramy.

## 5. Atrybuty (gracz, ludzie i stwory)

| Atrybut | Wpływa na |
|---|---|
| Siła | obrażenia wręcz, zbijanie równowagi, udźwig |
| Zręczność | szybkość ciosów i kombo, koszt/długość przewrotu, celność łuku i procy |
| Kondycja | życie, długość oddechu, odporność na rany i przewrócenie |
| Czujność | skradanie, dłuższe okno parowania, trafienia krytyczne |
| Hart ducha | odporność na strach i „prawdy” z Serca (stwory z ruin biją też w umysł) |

Start: po 5 w każdym, najwyżej 60 (od 2026-09-24; wcześniej 25). Efekt jednego punktu jest mały (np. Siła +3,5% obrażeń,
Kondycja +5 życia), więc szczyt jest mocny, ale nie absurdalny.

## 6. Poziomy, doświadczenie, punkty

- **Doświadczenie**: walka (więcej za silniejszego wroga) + cele z dziennika + odkrycia fabularne +
  pierwsze zrobienie czegoś nowego. Wartości (ustalone z autorem 2026-09-24): zając 5, jeleń 10, wilk 15,
  dzik 20 (+20% za każdy poziom zwierzęcia ponad 1; o 3 poziomy słabsze od bohatera 60%, o 5 — 25%); cel z
  dziennika 50; pierwsze wejście na nową mapę 50; odkrycie fabularne 40; pierwszy raz zdobyty przedmiot 5,
  narzędzie / broń / przedmiot kluczowy 5; pierwszy budynek danego rodzaju 5. Ptaki nie dają doświadczenia.
- **Poziom najwyżej 100** (ustalone 2026-09-24): zwykłe przejście gry kończy się ok. 60–70, setka to wyzwanie
  końcowe (ok. 3 razy więcej doświadczenia). Na poziom **3 punkty atrybutów + 1 punkt umiejętności**.
  Doświadczenie do następnego poziomu (od 2026-09-25): na poziom 2 — 500, każdy kolejny o 20% więcej,
  zaokrąglone do pełnej setki (500, 600, 700, 900, 1000, 1200 … 9→10: 2100, 19→20: 13 300, 29→30: 82 400).
  Nie da się mieć wszystkiego — 99 punktów na 189 stopni umiejętności: wybiera się styl postaci.
- Awans: komunikat i dźwięk; w HUD cienki pasek doświadczenia.

## 7. Umiejętności — drzewka dziedzin (od 2026-09-24)

Dziesięć osobnych drzewek (Skills_Data.js), każde na własnej stronie ekranu Postaci (Q / E): **Walka wręcz,
Obrona, Strzelectwo, Przetrwanie, Zbieractwo, Łowiectwo, Rolnictwo, Rzemiosło, Budownictwo, Kuchnia** —
razem 102 umiejętności i 197 stopni (od etapu 2: Zasadzka w Łowiectwie; od etapu 3: Postrach w Walce wręcz i Rozbrojenie w Obronie; od etapu 4: Spokojna głowa i Prawda nie boli w Obronie - Hart ducha). Umiejętność otwiera drogę do tych pod nią (wystarczy jedna z dróg), wiele
ma kilka stopni (każdy stopień to punkt). Rzędy wymagają poziomu postaci: 1, 4, 10, 20, 32, 48; część
umiejętności ma też progi atrybutów (np. Szeroki zamach — Siła 20).

Umiejętności działają prawie na wszystko: obrażenia, krytyki, blok, oddech, życie, przewrót; celowanie, strzały,
pociski; koszt wytrzymałości każdej pracy, głód, pragnienie, zimno, sen, leczenie, udźwig; liczba uderzeń przy
drzewach i skałach, dodatkowe sztuki z drzew, skał i zbiorów z ziemi, ruda ze zwykłych skał; skradanie, mięso,
skóry, ścięgna, sidła, ryby, pióra; wzrost roślin, plony, nasiona, konewka, podlewanie, zwierzęta gospodarskie,
naloty ptaków; czas pracy warsztatów i pieców, zwrot materiałów, podwójny wyrób, zużycie narzędzi, naprawy,
ceny w sklepie; uderzenia na placu budowy, koszt uderzenia, zwrot przy rozbiórce; wartość jedzenia, premie,
psucie się zapasów, ogień, pieczenie. Inne wtyczki pytają Combat.perk(klucz).

Umiejętności etapu 1 (Płynne kombo, Rozpęd, Kontra, Szeroki zamach, Dobicie, Twarda garda, Czujne oko, Akrobata,
Gruba skóra, Drugi oddech) są w drzewkach Walki wręcz i Obrony pod tymi samymi nazwami.

## 8. Przeciwnicy mają poziom i atrybuty

- Każdy typ ma własny rozkład (bandyta zwinny i słaby, najemnik silny i odporny, zbroja: ogromna Kondycja,
  zero Zręczności).
- Siła wrogów zależy od **miejsca**, nie od poziomu gracza — wtedy czuć, że się rośnie.
- Przy pasku życia wroga poziom w kolorze: szary (dużo słabszy), biały (podobny), pomarańczowy (silniejszy),
  czerwona czaszka (uciekaj).

## 9. Ekran postaci

Nowa zakładka **Postać** w menu P: atrybuty z „+”, drzewka umiejętności, poziom, doświadczenie i wyliczone
wartości (obrażenia, życie, oddech, udźwig).

## 10. Wyposażenie

Pałka (w ręku), miecz i topór bojowy (kuźnia), tarcza drewniana (warsztat) i okuta (kuźnia), skórzana
kurtka (garbarnia) — mniej obrażeń. Rany i opatrunki jak teraz. Tarczę i kurtkę „nosi się” tak samo: wystarczy mieć
je w torbie; obie widać w menu P → Postać (pod atrybutami: WYPOSAŻENIE, z tym, co dają, i ich zużyciem).

## 11. Etapy

1. **Rdzeń + rozwój + wilki**: oddech, kombo, ciężki cios, przewrót, blok/parowanie, odczucie trafienia,
   życie i równowaga wrogów, atrybuty, poziomy i doświadczenie, ekran Postaci, drzewka walki wręcz i obrony,
   pałka i tarcza, dzik w nowym systemie, wataha wilków, przywoływanie wrogów w F9.
   *Zrobione (2026-09-24):* całość. Pałka: przedmiot 156, warsztat (drewno + len), własny szybki zamach
   (Swing_Club, 22 klatki), 13 obrażeń, 10 oddechu. Tarcza drewniana: przedmiot 155, warsztat (2 drewna,
   2 gałęzie, 2 liny), zużywa się od przyjętych ciosów. Przewrót i upadek mają własne animacje (Swing_Roll,
   szybkie Swing_LieDown), po czystym trafieniu bohater odchyla się od ciosu, ogłuszony wróg chwieje się pod
   gwiazdkami. Ekran Postaci: menu P → Postać; w prawym dolnym rogu pasek poziomu i doświadczenia (żółte „P”,
   gdy są punkty do rozdania). Dzik z bliska (5 pól) szarżuje w prostej linii; gdy chybi, przebiega ok. 3,5
   pola dalej i stoi zziajany ~1,7 s — czas na atak. Klawisze: patrz niżej.
   Dwa tryby: Tab przełącza tryb normalny (O akcja, P menu, [ ] nic) i tryb walki (na mapie O = atak,
   P = obrona, [ ] = poprzednia / następna broń, Enter, Esc i R nic; w menu i rozmowach wszystko jak zwykle;
   u góry ekranu miga napis „Tryb walki”). Bez broni bohater bije pięściami.
2. **Zwierzęta**: niedźwiedź, ataki z ukrycia, skórzana kurtka, drzewka strzelectwa i przetrwania.
   *Zrobione (2026-10-05):*
   - **Niedźwiedź** (Hunting.js / Hunting_AI.js): wolny (chodzi 3, goni 3,5 - bohater idzie 4), 260 życia i 160 równowagi
     na poziomie 1 (+15% / +10% za poziom), cios 30 (+12% za poziom), poziom według miejsca jak inne zwierzęta. Na polu
     dziadka, łąkach, w Lesie, na Wzgórzach, w Mrocznym Lesie, na Leśnej drodze i Skraju lasu **10% na godzinę** (decyzja
     autora 2026-10-05; co pełną godzinę 4-22 i raz po wejściu na mapę, bez dopłaty o świcie i zmierzchu); jeden naraz,
     wychodzi 13+ pól od bohatera, nie wraca w dniu, w którym go zabito; notatka mapy `<Bear:0.2>` / `<Bear:off>`. F9:
     „Niedźwiedź w pobliżu”.
     Gdy bohatera zauważy, zwykle (80%) staje na tylnych łapach i ryczy (2 s, osobna animacja ryku: wstaje, zadziera łeb,
     ryczy z otwartym pyskiem, opada) - kto odejdzie dalej niż 5,5 pola, ma spokój;
     kto podejdzie na 3 pola albo go uderzy, jest jego wrogiem. Dwa ataki, oba z zamachem i „!”, oba **nie do zablokowania i
     nie do sparowania** (przy uniesionej tarczy napis „Tego nie zatrzymasz!”), tylko przewrót albo krok w bok: **łapa** (z
     bliska: 0,57 s zamachu, potem stożek przed nim, w stronę z chwili zamachu, zasięg 2,1 pola) i **przygniecenie** (z 2-4
     pól: staje dęba 0,77 s, skacze tam, gdzie stał bohater; trafiony leży ~1,2 s, obrażenia x1,35). Po ataku stoi (0,9 s
     po łapie, 1,2 s po trafionym skoku, 1,8 s po chybionym) - to chwila na ciosy. Lekkie ciosy zbijają mu tylko 30%
     równowagi i go nie odrzucają; zatacza się (1,5 s) od ciężkiego ciosu albo ataku z ukrycia. Nie goni daleko: 12 pól od
     miejsca, z którego wyszedł, albo gdy bohater jest 11 pól dalej, wraca do siebie. Gdy już walczy, **walczy do końca**
     (decyzja autora 2026-10-05: nie ucieka przy małym życiu; `BEAR_AI.flee` = 0).
     Zwłoki: 5 kawałków mięsa niedźwiedzia (nowe 168, pieczone 169 - ognisko, godzina), skóra niedźwiedzia (170, cena 60;
     garbarnia: „Wyprawiaj skórę niedźwiedzia” -> 3 wyprawione skóry) i 3 ścięgna. Doświadczenie 60 (+20% za poziom).
     Arkusze 8-kierunkowe: anim8/Bear_Walk8, _Run8, _Pounce8 (komórka 104) i _Rear8, _Roar8, _Swipe8 (komórka 128 - stojący na
     tylnych łapach jest wyższy; Roar8: 5 klatek wstawania + 9 klatek ryku); klatkę póz mówi sam niedźwiedź (`look8Col`: ile
     minęło z zamachu / stawania / ryku / skoku), a kierunek
     `face8` (zawsze w stronę bohatera, także po skosie). Do tego stare 4-kierunkowe $Animal_Bear* (zwłoki, gra bez arkuszy 8).
     PixelLab: postać „Niedzwiedz (walka)” (szablon czworonoga „bear”, 148 px, zmniejszona do 0,68 z paletą i obrysem jak
     dzik), chód / bieg / skok z szablonów, stawanie dęba i ryk z animacji v3 (ryk zaczyna się od klatki stojącego na tylnych
     łapach); zachód i skosy na zachód to odbicia wschodu. Podgląd: docs/walka/niedzwiedz_arkusze.png, niedzwiedz_ryk.gif,
     inne *.gif, zrzuty z gry docs/walka/*.png.
     Płynność (2026-10-06, „walka sztywna, animacje niepłynne”): jedna paleta dla wszystkich arkuszy (paleta chodu, tools/bear/
     build_bear.py + motions.json); nowe animacje v3: łapa na czterech łapach (Swipe8, 13 klatek: ciężar w tył, wypad, powrót),
     galop (Run8), oddech (Idle8 - stojąc oddycha, po ciosie dyszy szybciej). Cios: zamach z wygładzeniem, wypad ciała
     (`lungeOffset`), łapa trafia na swojej klatce (6 klatek po zamachu - czas trafienia jak przedtem, 34 klatki), krótkie
     zatrzymanie (2 klatki ponad 6 z Combat), ślady pazurów i kurz, powrót do postawy na klatkach łapy. Przed ciosem i skokiem
     „stawia łapy” - rozpoczęty krok kończy szybko zamiast sunąć z nieruchomą pozą. Obraca się przez kierunki pośrednie
     (`turn`). Goni ciężkim chodem: długości kroków zmierzone na arkuszach (łapa na ziemi stoi w miejscu), przy 3,5 galop
     przebierałby łapami 3,7 razy na sekundę, więc galop dopiero od 3,8. Naprawiony błąd wszystkich zwierząt LOOK8: licznik
     obrotu bez wartości dawał NaN i zwierzę, które obróciło się w miejscu, biegło potem tyłem („moonwalk”).
     Podgląd: docs/walka/niedzwiedz_walka.gif.
     Skok (przygniecenie) od nowa: zaczyna się dokładnie od ostatniej klatki stawania dęba (PixelLab v3 „bear_pin10” na klatce
     rear_v3; północ „bear_pin10_back” od tyłu) - stoi, rzuca się całym ciężarem, leci płasko, ląduje na przednich łapach i chwilę
     zostaje przyczajony (18 klatek), potem oddycha; komórka 128, klatki ułożone tak, że pochyla się zaraz po odbiciu. Stary arkusz
     (szablon z ciemną klatką i złym widokiem od tyłu): backup_art_2026-10-06/bear/. Podgląd: docs/walka/niedzwiedz_skok_nowy.gif.
     Wilk i dzik: oddech w miejscu (Wolf_Idle8, Boar_Idle8 - PixelLab v3, tools/anim8/build_pose.py: skala, linia łap i kolory z ich
     arkusza chodu) i płynne obroty wszystkich zwierząt (`turn`: wilk, pies, jeleń, zając co 2 klatki, dzik co 3).
     Próba sił (bot, bohater poz. 1, 100 życia): bez uników ginie po 3 trafieniach w 7 s; z przewrotem w porę wygrywa bez
     draśnięcia - żelazną siekierą w ~20 s (5 odsłonięć), pałką w ~31 s; pięściami po 2 min niedźwiedź ma jeszcze ponad połowę
     życia (próba z wersją, która jeszcze uciekała przy 15% życia; teraz trzeba go dobić - kilka sekund dłużej).
   - **Ataki z ukrycia** (Combat_Fight.js `SNEAK`): cios w zwierzę, które bohatera nie zauważyło (bez „!”, nie walczy, nie
     atakuje, nie ucieka), gdy się skrada (C) albo zachodzi je od tyłu: x2,5 (strzał z łuku / procy x2), a równowaga pęka
     cała (zatacza się, także niedźwiedź). Czujność +1,2% za punkt ponad 5, Zręczność +1% do strzału; nowa umiejętność
     **Zasadzka** (Łowiectwo, rząd 3, od Sidlarza, Czujność 12, 2 stopnie po +25%). Strzał w serce: dalej x3 (co najmniej).
     Nad zwierzęciem zielone „Atak z ukrycia!” (albo „Strzał w serce!”), głuchy cios, dłuższa stop-klatka.
   - **Skórzana kurtka** (przedmiot 171, ikona 435): garbarnia, „Uszyj skórzaną kurtkę” (3 wyprawione skóry, 2 ścięgna,
     lina, 3 h). Nosi się ją jak tarczę - w torbie. Każdy cios, który dojdzie (także przez blok), jest o 20% słabszy, a kurtka
     się zużywa (60 ciosów; naprawa w warsztacie: wyprawiona skóra + ścięgna; zużyta „się podarła”). Menu P -> Postać:
     WYPOSAŻENIE pod atrybutami (tarcza i kurtka, co dają, zużycie).
   - Drzewka Strzelectwa i Przetrwania były już pełne (2026-09-24) - doszła tylko Zasadzka. Dziennik: cele „Uszyj skórzaną
     kurtkę” (po garbarni) i „Przeżyj spotkanie z niedźwiedziem” (po wilkach; liczy się, gdy niedźwiedź wrócił do siebie
     albo zginął, a bohater żyje - `_tw.hunt.bears`).
   - Testy: `bear_test`, `sneak_attack_test`, `jacket_test` (port 9464).
3. **Ludzie**: bandyci, łucznik, najemnik, nocne obozy, poddawanie się.
   *Zrobione (2026-10-06):* nowe wtyczki **Humans_Data.js** (liczby, łup, okrzyki, obozy) i **Humans.js** (na końcu listy wtyczek).
   Ludzie to nie zwierzęta Hunting.js: mają własną listę i własne cele (Hunting.addTargets - ciosy, strzały i ataki z ukrycia
   trafiają ich tak jak zwierzęta), 8-kierunkowe arkusze w Hunting.LOOK8 i drogę dookoła przeszkód z Hunting_Path.js; paski,
   „odbicie” przewrotu i błysk trafienia biorą ich z nowego `Combat.foes()`.
   - **Każdy atak**: zamach („!”, poza z bronią cofniętą) -> cios -> odsłonięcie. Kierunek ciosu zamyka się na początku zamachu:
     przewrót albo krok w tył i pałka idzie w powietrze. Parowanie (P tuż przed ciosem) ogłusza na ~1,4 s, tarcza zatrzymuje
     większość. Walczą razem, ale **po jednym ciosie naraz** (reszta krąży wokół bohatera ~2,7 pola od niego), łucznik strzela
     na własną rękę. Zatacza się każdy, komu zbijesz równowagę (gwiazdki, Dobicie działa).
   - **Bandyta** (pałka; 60 życia, 34 równowagi na poz. 1): podchodzi na 1,5 pola, zamach 26 klatek (Zręczność skraca), cios 12 x
     Siła, w połowie przypadków od razu **drugi cios** (zamach tylko 12 klatek), potem stoi ~0,8 s. W 22% **markuje**: zaczyna
     zamach, cofa pałkę i uderza zaraz potem (szybki zamach, też z „!”). Gdy machasz na niego bronią, w 30% **podnosi pałkę**
     (garda ~0,6 s): lekki cios z przodu traci 75% siły („Blok -N”), a broń bohatera odskakuje (krótkie zachwianie), ciężki cios
     łamie gardę („Garda przełamana!”, zatacza się).
   - **Łucznik** (44 życia): trzyma się 3,4-6,5 pola od bohatera; podejdziesz bliżej - **cofa się** (szuka miejsca z czystą
     linią strzału, z dala od ciebie); przyparty do muru albo bez strzał (8-14 w kołczanie) **odpycha łukiem** (mały cios, mocno
     odrzuca). Strzał: napina łuk ~0,9 s pod „!”, a od łuku do bohatera biegnie **przerywana linia celowania** - jasna, póki
     łucznik wodzi za tobą, **czerwona, gdy cel stanie** (14 klatek przed strzałem) - wtedy krok w bok, przewrót (strzała zawsze
     przelatuje przez nietykalność przewrotu) albo **tarcza** (tylko z tarczą: strzały się nie paruje). Strzała leci ~18 pól/s,
     14 obrażeń (+10% za poziom), zatrzymują ją drzewa, skały i ściany. Za drzewem nie strzela - obchodzi je.
   - **Najemnik** (130 życia, 80 równowagi, poziom miejsca +1 - najsilniejszy): **tarcza z przodu** zatrzymuje lekki cios (10%
     przechodzi, „Zablokowane!”, broń odskakuje) i każdą strzałę; **ciężki cios łamie mu gardę** (zatacza się 70 klatek, 70%
     ciosu wchodzi); z boku i od tyłu tarczy nie ma, a **cios w plecy** boli x1,25 (obraca się wolno: ~1 s na pół obrotu - przewrót
     za jego plecy działa). Po 3 ciosach w tarczę w 2,5 s od razu **oddaje uderzeniem tarczy**. Gdy długo trzymasz gardę twarzą do
     niego, **obchodzi cię od tyłu** i bije z boku (tam garda nie sięga). Trzy ciosy: cięcie (19), uderzenie tarczą (8, szybkie,
     odrzuca i przewraca równowagę) i **cios z góry** (30, zamach 46 klatek, iskra na mieczu): **przełamuje gardę** bohatera -
     przewrót albo parowanie w porę.
   - **Poziom i atrybuty** według miejsca (§8): poziom = poziom mapy (`<Poziom:N>`, Combat.placeLevel) + 0-1 (najemnik +1).
     Atrybuty rosną z poziomem według typu (bandyta zwinny, łucznik zwinny i czujny, najemnik silny, odporny, z hartem ducha):
     Siła +3,5% obrażeń i równowagi, Zręczność krótszy zamach, Kondycja życie i równowaga, Czujność lepsze oko, Hart ducha
     rzadziej się poddaje. Doświadczenie: bandyta 30, łucznik 30, najemnik 60 (+20% za poziom).
   - **Poddanie się** (Opinia -2 / +1 - decyzja autora 2026-10-06: „ok”): poniżej 25% życia (łucznik 30%, najemnik 18%) człowiek może **rzucić broń i klęknąć** („Litości!
     Poddaję się!”) - bandyta w 60%, łucznik 65%, najemnik 30% (Hart ducha obniża), albo uciec. Gdy padną towarzysze, ranni
     tracą ducha szybciej. Klęczącego **nie trafisz przypadkiem** (nie jest celem): podejdź - wybór nad bohaterem: **Puść go
     wolno** (odchodzi; Opinia w miasteczku +1 raz dziennie; 45% że w podzięce powie plotkę - na górze ekranu i w notatkach
     dziennika - albo da trochę grosza), **Zabierz mu sakiewkę** (jego pieniądze i rzeczy, ucieka), **Dobij go** (cios bronią
     w ręku; leży jak zabity; *Opinia -2* raz dziennie: „dobiłeś człowieka, który błagał o litość”), **Zostaw** (czeka; zostawiony
     na dłużej ucieka). Doświadczenie jest za pokonanie - w chwili poddania, tak samo przy każdym wyborze.
   - **Bandyci nie zabijają** (decyzja autora 2026-10-06: „może być”): ich cios nigdy nie zabiera ostatniego życia - gdy dojdzie do zera,
     bohater leży, oni stają nad nim („Zabieramy, co twoje.”), ekran gaśnie, a bohater budzi się **godzinę później**: bez 40%
     pieniędzy i części jedzenia, z 15% życia i raną; napastnicy zniknęli (obóz zwinięty). Zwierzęta zabijają jak dotąd.
     Quest może dać ludziom `lethal: true`.
   - **Łup**: zabity leży (ciało jak zwłoki zwierząt: leżąca postać, plama krwi). Przycisk akcji przy nim: bohater kuca
     i zabiera to, co miał - pieniądze (bandyta 2-11 G, łucznik 3-13, najemnik 10-30), chleb, linę, piwo, strzały, opatrunek,
     wędzonkę, żelazo, czasem nóż, pałkę bandyty albo łuk łucznika. Ciało zostaje puste i znika po dobie. Wytrącona albo rzucona
     broń leży na ziemi (ikona) - też się ją podnosi akcją.
   - **Nocne obozy**: na Leśnej drodze (30% na noc), Polnej drodze (25%), Skraju lasu (35%), w Lesie (25%), na Wzgórzach (20%),
     w Mrocznym Lesie (30%) i na łąkach (12-15%) czasem nocą (21-5) płonie **ognisko** (kamienny krąg, polana, płomienie,
     dym, trzask; **światło jak każde ognisko**: ciepła poświata, migotanie, cienie): 2-4 bandytów (czasem łucznik, od dnia 8
     najemnik), 1-2 czuwa przy ogniu (przykucnięci, czasem mamroczą: „...kupiec miał pełny wóz...”), reszta śpi („z”). Obok
     **worek z łupem** (6-22 G, chleb, liny, strzały, piwo...). Śpiący słyszy tylko z bliska (jego wzrok x0,22), czuwający
     patrzy w ogień (x0,75). **Atak z ukrycia** (C) na śpiącego - x2,5 i pęknięta równowaga, zatacza się, nie woła reszty;
     ale każdy zwykły cios hałasuje (7 pól) i budzi obóz („Wstawać! Ktoś tu jest!”). Worek można **ukraść po cichu** (szelest
     2,5 pola). O świcie obóz się zwija (z workiem, jeśli ktoś przeżył). Nie w pierwsze 3 dni, nie w miasteczku, na polu dziadka
     ani przy jego domu; rozbity obóz nie wraca na tę mapę przez 2 dni; obóz stoi co najmniej 14 pól od bohatera. Stan obozów
     (kto żyje, worek) jest w zapisie, ludzie nie (wracają na swoje miejsca, czujni po walce). Notatki mapy: `<Camp:0.3>`,
     `<Camp:off>`, `<Humans:off>`; zasadzki za dnia na drodze tylko z notatką `<Ambush:0.03>` (domyślnie wyłączone).
   - **Umiejętności** (nowe, razem 100 umiejętności / 193 stopnie): **Postrach** (Walka wręcz, rząd 3, od Oszczędnego ciosu,
     Hart ducha 10, 2 stopnie: +15% szans na poddanie i +5% progu życia za stopień) i **Rozbrojenie** (Obrona, rząd 2, od
     Czujnego oka, Czujność 14, 2 stopnie po 30%: sparowany człowiek wypuszcza broń - „Rozbrojony!”, bije za 45%, broń leży
     na ziemi). Zasadzka działa też na ludzi.
   - **F9** (Zdarzenia): „Bandyta w pobliżu”, „Łucznik w pobliżu”, „Najemnik w pobliżu”, „Zasadzka (2 bandytów i łucznik)”,
     „Obóz bandytów (noc)” (w dzień zegar idzie na 22:00, obóz 9-16 pól dalej).
   - **Dla questów** (W1 rozdz. 6c - napad ludzi Feliksa na Polnej drodze, W5 - ludzie Baltazara przy wozie, W8 - Grum, najemnik
     z tarczą), `window.Humans` / `Tawerna.api("Humans")`:
     - `Humans.spawn(kind, x, y, opts)` - człowiek (`"bandit"`, `"archer"`, `"mercenary"`) na polu; opts: `level`, `tag`
       (nazwa grupy na szynie), `engaged` (od razu walczy), `mode` (`"idle"`, `"sit"`, `"sleep"`, `"roam"`), `band` (wspólna
       grupa), `name` (np. „Grum”), `look` (inny wygląd z tych samych arkuszy), `noSurrender`, `lethal`, `gold`, `loot`
       (`[[id, n]]` zamiast losowego), `say` (okrzyk na start). Ludzie stojący w pobliżu łączą się w jedną grupę.
     - `Humans.ambush(kinds, opts)` - grupa 7-10 pól od bohatera, od razu w walce, z okrzykiem („Sakiewka albo życie!”);
       opts jak wyżej + `far: [od, do]`, `shout: false`, `say`.
     - `Humans.camp(opts)` - obóz tej nocy na tej mapie (`size`, `kinds`, `far`, `near`, `tag`).
     - `Humans.list`, `Humans.band(tag)`, `Humans.clear(tag)`, `Humans.decide(id, "spare" | "rob" | "kill" | "leave")`.
     - Szyna (`Tawerna.on`): `humanSurrender` { kind, tag, level, x, y }, `humanDefeated` { kind, how: `killed` / `spared` /
       `robbed` / `fled`, begged, tag, level, x, y }, `humansDone` { tag, killed, spared, robbed, fled } (cała grupa skończona),
       `heroRobbed` { tag, gold, items } (pobity bohater), `campCleared` { mapId }; zabity człowiek to też `kill` { kind, human:
       true, name, tag, noXp } - kroki questów „kill” z `kind: "bandit"` działają same.
     - Zdarzeń mapy (id) wtyczka nie wstrzykuje: ludzie, ogniska, worki i ciała to jej własne postacie i obrazki.
   - **Grafika** (PixelLab, postacie pro w stylu bohatera, `style_character_id` = bohater bf29bbe1): „Bandyta (walka)”
     738706ce (kaptur, pałka), „Lucznik (walka)” aea5c517 (zielony kaptur, łuk, kołczan), „Najemnik (walka)” fc7fe0cf
     (kapalin, kolczuga, okrągła tarcza, miecz). Arkusze w img/characters/anim8/ (8 wierszy jak zwierzęta, zachód i skosy na
     zachód to odbicia wschodu - broń zawsze w tej samej ręce): <Look>_Walk8 (64 px; chód z szablonu, a tam, gdzie szablon gubił
     broń - pałkę, tarczę najemnika - „skeleton-v3”, który przesuwa piksele samej postaci, albo v3), _Run8 (bandyta i łucznik;
     najemnik w kolczudze nie biega), _Atk8 (96 px - broń wystaje: zamach i cios, 13 klatek, v3; łucznik: napięcie, celowanie,
     strzał), Merc_Guard8 (tarcza w górę), _Kneel8 (96 px: puszcza broń, klęka, ręce w górę - broń leży obok), _Crouch8 (96 px:
     siada po turecku przy ogniu, broń na kolanach), _Lie8 (leży na boku z bronią obok - obrót o 90° przez edit_image_pro_flash:
     śpi i zabity); do tego 4-kierunkowe $Human_*. Klatki z odpryskami i smugami v3 pominięte albo podmienione (sheets.json:
     pick), niebieski blask miecza najemnika przemalowany na stal. Klatkę pozy mówi sam człowiek (`look8Col`: ile minęło
     z zamachu / ciosu / napinania / klękania), kierunek `face8` (w stronę bohatera, garda obraca się w tempie typu).
     Narzędzia: tools/humans/ (fetch_rot.py, fetch_zip.py, build_humans.py + sheets.json, record.js + make_gif.py). Zużyto ok.
     240 generacji PixelLab. Podgląd: docs/walka/ludzie_arkusze.png, bandyta_walka.gif, najemnik_walka.gif, lucznik_strzal.gif,
     bandyta_poddaje_sie.gif, oboz_bandytow.gif, zrzuty bandyta_*.png, najemnik_*.png, lucznik_celuje.png, oboz_noc.png.
   - Testy: `humans_test` (44 sprawdzenia, port 9465; od szlifu - niżej - 52); `debug_menu_test` zna nowe wiersze F9.
4. **Stwory z ruin**: razem z mapami podziemi (Akt II), Hart ducha w użyciu.
   *Zrobione (2026-10-06):* nowe wtyczki **Creatures_Data.js** (liczby, łup, „prawdy”, pytania, bossowie) i **Creatures.js** (na końcu listy
   wtyczek, po Underground). Stwory, tak jak ludzie, nie są zdarzeniami mapy: własna lista (`Game_Creature`), cele dla ciosów i strzałów
   (Hunting.addTargets), paski i odbicie przewrotu (Combat.addFoes), 8-kierunkowe arkusze w Hunting.LOOK8, droga dookoła przeszkód z
   Hunting_Path.js. Każdy atak: **zamach** (poza, „!”, koło albo linia na ziemi) -> **cios** -> **odsłonięcie**; przewrót, blok i
   parowanie działają jak przy zwierzętach i ludziach (Combat.hitPlayer).
   - **Podziemia** (Underground.js): każdy rodzaj zarejestrowany przez `Underground.registerCreature` - na miejscu `<Stwor:rodzaj>` piętra
     Underground wstawia niewidzialny znacznik (zdarzenia 860-899, notatka `<Creature:rodzaj>`), a Creatures.js stawia tam stwora (rój:
     kilka) przy wejściu na piętro (szyna `undergroundFloor`). `dowolny` (i rodzaj spoza swoich głębokości na piętrze składanym) dostaje
     rodzaj pasujący do piętra (`FIT`, zawsze ten sam dla tego miejsca); na piętrach ręcznych - tak, jak narysowano. Najwyżej **22 stwory
     na piętrze**; nie bliżej niż 4 pola od bohatera schodzącego ze schodów. **Zabite miejsce jest puste przez 3 dni** (`RESPAWN_DAYS`),
     boss i strażnik nie wracają nigdy. Poziom według miejsca (§8): notatka mapy `<Poziom:N>` (pasma podziemi: 4 na piętrze 1 ... 49 na
     90), bez niej 4 + 1 co 2 piętra. Życie +12% za poziom (bossowie +6%), ciosy +10% i atrybuty według rodzaju (zbroja i kamiennik:
     ogromna Kondycja, zero Zręczności).
   - **Szczury** (rój 2-4, więcej głębiej; piętra 1-30): otaczają bohatera na pierścieniu i podskakują do ugryzienia - **najwyżej dwa
     naraz**, każdy z krótkim przykucnięciem i piskiem (bez „!”). Jeden cios zabija; Szeroki zamach kosi. Doświadczenie 4.
   - **Pająk** (1-50): trzyma się 3-5 pól, staje dęba i **pluje siecią** (szara grudka; przewrót albo krok w bok, tarcza zatrzymuje) -
     trafiony bohater chodzi wolniej, sieć leży na posadzce (wejście w nią też spowalnia); potem wpada, **gryzie** (rana jak trucizna) i
     odskakuje. Zostawia jedwab (Włókno). Doświadczenie 25.
   - **Pusta zbroja** (11-30 i 51-75): stoi jak posąg (`dormant`), póki bohatera nie zauważy - albo nie stanie tuż obok. **Lekki cios z
     przodu dzwoni o blachę** (15%, bez równowagi, broń odskakuje); liczy się **ciężki cios, cios w plecy, atak z ukrycia**. Obraca się
     bardzo wolno - przewrót za plecy działa. Cięcie i **cios z góry** (długi zamach, przełamuje gardę). Pokonana pierwszy raz
     **rozsypuje się** (własna animacja: hełm spada, płyty się składają w stos) i po 4 s **składa się z powrotem** (40% życia) - chyba że
     **uderzysz leżący stos** („Rozbita!”). Szczątki: gwoździe, żelazo, rzadko stal, stare monety. Doświadczenie 45.
   - **Nietoperze** (rój 4-6; 31-50): krążą wysoko nad głową - **ostrze ich nie sięga, strzał tak** (cel tylko z łukiem / procą w ręku).
     Falami (po jednym, dwóch) **nurkują**: pisk, a na posadzce czerwona linia lotu; przewrót albo krok w bok. Po nurkowaniu **wiszą
     nisko** chwilę - wtedy bij. Doświadczenie 4.
   - **Topielec** (31-50): człapie z ciemności rzeki. **Chwyta** (zamach obiema rękami; przewrót, krok w tył albo parowanie) i **wlecze
     do swojej wody**: złapany nie rusza się i nie bije, oddech mu ucieka, bez oddechu się **dławi** (obrażenia co 0,75 s). **O, Spacja
     albo P raz po raz** wyrywa z uchwytu (Siła: mniej razy), topielec się wtedy zatacza. Drugi cios: uderzenie. Ginąc osuwa się w kałużę
     mętnej wody (nie do picia - susza). Doświadczenie 35.
   - **Kamiennik** (51-75): stoi jak posąg; **z przodu kamienna płyta - nic nie przechodzi** („Kamień!”, broń odskakuje, strzała też),
     z tyłu **świecąca szczelina: x1,6**, z boku 75% (od 2026-10-06; wcześniej 60%). Obraca się najwolniej ze wszystkich. **Uderzenie w ziemię** (koło na posadzce -
     wyjdź z niego albo przewrót w porę) i **szarża** w linii prostej (czerwona linia, tupanie): w ścianę albo w przeszkodę - **stoi
     ogłuszony** („Utknął!”) i wtedy trafia się go z każdej strony (x1,3). Szczątki: kamień, ruda, czasem żelazo. Doświadczenie 70.
   - **Upiór prawdy** (76-99): zwykle **niewidoczny i nietrafialny** - zdradza go zimny oddech (mgiełka) i szept; podchodzi i **pokazuje
     się** (widać go i można trafić tylko wtedy). Mówi **„prawdę”** (dymek nad nim, „!”, koło wokół niego): **Hart ducha decyduje** -
     oparta prawda wraca do niego (zatacza się, bohater ma okno), nieoparta to **strach** (bohater stoi jak wryty, drży) albo **zamęt**
     (strzałki na odwrót, fioletowe brzegi ekranu). Prawdy nie da się uniknąć przewrotem - za to **dwa ciosy w czasie prawdy ją
     przerywają**, a z daleka (ponad 7 pól) nie sięga. Z bliska zimny dotyk (zabiera oddech). Ginąc rozwiewa się w mgłę. Doświadczenie 50.
   - **Cień** (76-99): stoi w ciemności jako **ktoś z miasteczka** (jego arkusz i imię: Borgar, Tadek, Hanka, dziadek, Melia, sołtys, Wanda)
     i mówi jego głosem („Zamykamy, synu. Idź na górę.”). Z bliska (albo trafiony) **twarz opada**: ciemność, czerwone oczy, **strach**
     (Hart ducha) - potem pazury. Trafiony dwa razy **rozpływa się w dym** i wychodzi **za plecami** bohatera (dym pokazuje miejsce
     chwilę wcześniej). Doświadczenie 50.
   - **Hart ducha** (atrybut, `Combat.mindResist` / `mindTime`): szansa oparcia się prawdzie i strachowi 15% przy 5, +3% za punkt
     (najwyżej 95%), mniej przeciw stworowi silniejszemu od bohatera; strach i zamęt krótsze o 1,5% za punkt (do 65%). Dwie nowe
     umiejętności w Obronie: **Spokojna głowa** (rząd 1, od Hartu ciała, Hart ducha 8, 3 stopnie: +8% oporu i strach / zamęt o 10%
     krótsze za stopień) i **Prawda nie boli** (rząd 3, od Spokojnej głowy, Hart ducha 18: odparta prawda zatacza upiorem o 0,75 s
     dłużej, a ukryty upiór jest widoczny jako mgiełka). Razem 102 umiejętności / 197 stopni. Ekran Postaci: przy Harcie ducha opór i
     czas strachu.
   - **Bossowie pięter ręcznych** (`<Stwor:boss_NN>` na Map146-153; nazwy i opis wyglądu - Underground_Data.js `BOSSES`, mechanika tutaj).
     Duży pasek życia i równowagi na dole ekranu, pokonany boss otwiera schody w dół (`Underground.bossDefeated(NN)`), nie wraca:
     - 20 **Przeor w zbroi** (zbroja): wokół niego **krąg rytuału jednego pytania** - każdy krok w kręgu to pytanie (I, II, III), trzecie
       dostaje **odpowiedź kosturem** (koło pod bohaterem: przewrót); ciosy spoza kręgu go nie sięgają („Krąg go chroni”); nie da się go
       przewrócić (tylko parowanie go otwiera). Przewrót nie liczy się jako krok.
     - 30 **Królowa szczurów** (szczur, duża): gryzie i **taranuje** w linii prostej - w ścianę stoi oszołomiona; przy 2/3 i 1/3 życia
       **piszczy, a z murów wylewa się rój** szczurów (3, o 6 poziomów słabszych od niej - od 2026-10-06; wcześniej dwa roje po 5; jej, bez doświadczenia).
     - 40 **Matka pająków** (pająk, duża): sieci rozsnute na posadzce, **trzy plunięcia naraz**; znika pod sklepieniem - **jej cień**
       na ziemi idzie za bohaterem i staje, potem spada (koło: przewrót), albo **nić wciąga go w górę** (O / Spacja / P raz po raz zrywa
       nić - spada z małym obrażeniem; nie zdąży - ukąszenie u góry).
     - 50 **Topielec z głębiny** (topielec, duży): kałuże dookoła; chwyta i wlecze, wciągnięty na środek kałuży - „Wciąga cię pod
       wodę!”; **gdy obrywa (co 12% życia), zanurza się** i wychodzi przy kałuży najbliżej bohatera (zmarszczki ostrzegają) od razu z
       chwytem.
     - 60 **Kamienny Odźwierny** (kamiennik, duży): śpi, dopóki bohater nie stanie na progu (3 pola); bardzo wolny; co drugie uderzenie
       w posadzkę puszcza **pierścienie odłamków** przez całą salę - przewrót przez pierścień; z przodu kamień, z tyłu szczelina.
     - 70 **Zbroja bez herbu** (zbroja): szybka i czysta - **trzy cięcia pod rząd**; **paruje lekki cios z przodu** (50%, „Sparowała!”) i od
       razu odpowiada; ciężki cios przechodzi, parowanie bohatera zatacza ją długo; bez blachy (każdy cios, który dojdzie, liczy się cały).
     - 80 **Upiór pytającego** (upiór, zawsze widoczny): **zadaje pytania głosem bohatera** (dymek nad bohaterem, koło się zaciska) -
       **odpowiedz ciosem**, zanim pytanie minie (zatacza się), inaczej pytanie uderza w umysł (Hart ducha: strach / zamęt, połowa obrażeń
       przy oparciu się); znika i **wychodzi zza pleców** (dym ostrzega).
     - 90 **Ostatni Strażnik** (cień): najpierw **twarz i głos dziadka** („Wnusiu... Chodź tu, do mnie.”), potem habit zakonu i ciemność
       (strach); przy 2/3 życia **rozpada się na trzy cienie** (każdy po trzeciej części tego, co zostało) - pokonany dopiero, gdy żaden nie
       zostanie.
   - **Strażnik dziesiątej bramy** (piętro 10, Map140): zagadka jak dotąd (`Underground.onGuardian`) - ale bohater, który przyjdzie **w
     trybie walki** (Tab) albo **uderzy** uśpioną zbroję, dostaje **walkę zamiast zagadki** („KTO DOBYWA MIECZA - TEN WALCZY”). Zbroja
     strażnika (1,25 raza większa): tylko ciężki cios albo w plecy, raz się składa. Pokonany: **brama się otwiera** (przełącznik 14,
     `gate10Opened`), jego szczątki leżą przy bramie na zawsze (zdarzenie znika). Doświadczenie 250.
   - **Szczątki**: każdy zostawia coś na ziemi (stos blach, gruz, ciało na grzbiecie, kałużę, łachmany) - przycisk akcji: bohater kuca i
     zabiera, co było (błyszczy, póki coś jest). Znikają po dobie. **Nic do picia** (susza): gwoździe, żelazo, stal, ruda, kamień, włókno,
     liny, opatrunki, miód, stare monety.
   - **F9** (Zdarzenia): „Stwór z ruin: ...” i „Boss podziemi: ...” (←→ wybór rodzaju / bossa, OK przywołuje 4-7 pól od bohatera; na
     piętrze 10 „Strażnik dziesiątej bramy” to walka przy bramie).
   - **Dla innych wtyczek** (`window.Creatures` / `Tawerna.api("Creatures")`): `Creatures.spawn(kind, x, y, { level, engaged, tag, face,
     mode, count })` (rodzaj, rój albo boss: `guardian`, `boss_20` ... `boss_90`), `Creatures.list`, `Creatures.clear(tag)`,
     `Creatures.bossBeaten(piętro)`, `Creatures.auto(false)` (testy: piętra bez stworów). Szyna: `kill { kind, creature: true, boss, ... }`
     (doświadczenie jak za zwierzę, kroki questów „kill”), `creatureBoss { kind, floor, how: "start" | "beaten" }`, `heroMind { kind: "fear" |
     "confuse", by, resisted }`. Combat.js: `KILL_XP` stworów i bossów, `mindResist(power, level)`, `mindTime(frames)`, `stunPlayer(frames,
     "fear" | "held")`, `drainBreath(n)`; Combat_UI.js: `barTop()` stwora (pasek nad dużym), drżenie bohatera w strachu i w uchwycie.
     SpeechBubbles.js: okrzyki postaci spoza zdarzeń (ludzie, stwory) są teraz widoczne.
   - **Grafika** (PixelLab; postacie „pro” w stylu bohatera, `style_character_id` bf29bbe1, tam gdzie to człekokształtne): „Zbroja (stwor)”
     073c62e0, „Topielec (stwor)” e52b017a, „Upior (stwor)” 6d413821 (jego obroty wyszły odwrócone przód-tył: `rot_map` w sheets.json),
     „Kamiennik (stwor)” 0734d421 (96 px), „Pajak (stwor)” 19c79afd i „Nietoperz (stwor)” 6352f75f (pro bez stylu), „Szczur (stwor)”
     f0c52efa (czworonóg, szablon kota), a dla bossa piętra 20 własna postać „Przeor w zbroi (boss)” 637fe9ef (zbroja w podartym habicie,
     kostur, księga na łańcuchu). Arkusze w img/characters/anim8/Cr_<Look>_Walk8 / _Atk8 / _Die8 (8 wierszy, zachód i skosy na zachód
     to odbicia wschodu), do tego 4-kierunkowe $Cr_*; cień nosi arkusze mieszkańców (Npc_*_Walk8, kopie 4-kierunkowe $Cr_Face_*). Animacje v3
     z opisu ruchu (chód, zamach i cios, rozsypanie się zbroi, osunięcie topielca, kruszenie kamiennika...), niebieski blask miecza
     przemalowany na stal. Bossowie 30-90 mają od 2026-10-06 własne postacie (szlif niżej); strażnik bramy to powiększona zbroja; kamiennik ginie
     w kodzie (jego obraz rozpada się na bloki, które spadają i zostają gruzem - animacje v3 zostawiały go stojącego), szczur i nietoperz
     przewracają się na grzbiet. Nad ciemnością pięter żarzą się: płomyk w przyłbicy zbroi, szczelina kamiennika, oczy upiora i cienia
     (każde światło to ogień). Narzędzia: tools/creatures/
     (fetch_rot.py, fetch_zip.py, build_creatures.py + sheets.json, strip.py, record.js + make_gifs.py). Zużyto ok. 300 generacji PixelLab.
   - Testy: `creatures_test` (50 sprawdzeń, od szlifu 52, port 9465): każdy rodzaj (zamach, cios, pokonanie, szczątki), zasady rodzajów, Hart ducha,
     mechaniki bossów, strażnik dziesiątej bramy, znaczniki na piętrze składanym i puste miejsce po zabiciu, wszystkie piętra 11-99 ze
     stworami bez błędu. Podgląd: docs/walka/stwory_arkusze.png (arkusze), GIF-y stwory_zbroja_cios, stwory_zbroja_rozsypuje_sie,
     stwory_kamiennik_uderzenie, stwory_pajak_siec, stwory_nietoperze, stwory_topielec_chwyt, stwory_upior_prawda, stwory_cien_twarz,
     boss_przeor_krag, boss_matka_pajakow_nic, boss_odzwierny_odlamki, boss_upior_pytajacego, boss_ostatni_straznik; zrzuty z gry
     stwory_*.png i boss_*.png (m.in. stwory_pietro1.png - szczury w ciemności piętra 1, boss_straznik_bramy.png).


5. **Szlif etapów 3 i 4** (2026-10-06, „działaj dalej”).
   - **Własna grafika bossów 30-90** (PixelLab; wcześniej zwykłe stwory powiększone i przybarwione). Rysowani 1:1 (`draw` w BOSSES - zbroja 1,2),
     bez przybarwienia (`tone`); ich wielkość w walce (`scale`: zasięg, wypad, wysokość napisów) i zasady - bez zmian. Te same narzędzia co
     stwory (tools/creatures/: fetch_rot, fetch_zip, build_creatures.py + sheets.json; nowe opcje `nowhite` - białe kłęby, które v3 dorysowuje,
     wycięte; `unpuddle` - kałuża pod stopami; `fill_force` - kierunek z cudzych klatek), zachód = odbicie wschodu, stopy na jednej linii:
     - 30 **Królowa szczurów** („Krolowa szczurow pro (boss)” 1042639b, czworonóg na szablonie kota, w stylu zwykłego szczura): ogromna,
       wyliniała, z bliznami, grzebień zżółkłych kościanych kolców jak korona, mleczne oczy. Cr_Queen_Walk8 (chód z szablonu), _Atk8 (przyczaja
       się i gryzie z otwartym pyskiem), _Run8 (taran: te klatki z dłuższym krokiem; przed taranem przyczajona na arkuszu ciosu). Ginie jak
       szczury - przewraca się na grzbiet (jej animacja śmierci v3 prawie się nie ruszała: odrzucona).
     - 40 **Matka pająków** (5d5e16d5, v3 112 px): blady odwłok obsypany jajami, długie owłosione nogi, czerwone oczy (żarzą się nad
       ciemnością). Cr_Mother_Walk8, _Atk8 (unosi przód i pluje białą nicią), _Die8 (nogi się uginają, osiada - widok z przodu na każdy kierunek).
     - 50 **Topielec z głębiny** (cdc21273, pro w stylu bohatera, 96 px): olbrzym, zgniła sieć rybacka na barkach, zardzewiałe łańcuchy w pasie,
       płetwiaste dłonie. Cr_Deep_Walk8, _Atk8 (chwyta obiema rękami i przyciąga), _Die8 (pada na kolana i osuwa się w kałużę); kałużę pod
       stopami, którą PixelLab dorysowywał w części klatek, wycina budowanie arkusza (nie miga pod nim).
     - 60 **Kamienny Odźwierny** (25e0e556, v3 128 px): golem z bloków granitu, surowa twarz posągu, żelazna kołatka w piersi. Cr_Keeper_Walk8,
       _Atk8 (obie pięści w posadzkę, przyklęka). Ginie jak kamienniki - rozpada się na bloki. Żarzą się oczy z przodu i szczelina na plecach.
       (Pierwsza próba - pro w stylu bohatera - wyszła z twarzą i nogami bohatera: odrzucona, 40 generacji.)
     - 70 **Zbroja bez herbu** (a4d8f973, pro w stylu bohatera, 80 px, rysowana 1,2): ciemna płyta, pusty szary tabard, zamknięty hełm z
       płomykiem w szczelinie, długi miecz oburęczny. Cr_Blank_Walk8 (marsz z mieczem w dół), _Atk8 (ukośne cięcie), _Die8 (rozsypuje się).
     - 90 **Ostatni Strażnik**: najpierw twarz i głos dziadka (jego arkusz, jak dotąd), twarz ciemnieje i opada w dym - wtedy **habit zakonu**
       (182648f7, pro w stylu bohatera, 80 px): wysoka postać, w kapturze ciemność i dwa żarzące się oczy, przy sznurze stary żelazny klucz,
       dół habitu rozwiewa się w dym. Cr_Last_Walk8 (sunie), _Atk8 (pazury oburącz), _Die8 (pusty habit opada na posadzkę i tam zostaje).
       Rozpada się na trzy takie postacie.
   - **Brakujące animacje**: **cień**, gdy twarz mieszkańca opadnie, staje się sobą („Cien (stwor)” 4139cf62, v3: dymna sylwetka z pazurami i
     czerwonymi oczami) - Cr_Shadow_Walk8 i **_Atk8** (przygarbia się, cofa łapę i rozdziera pazurami); **nietoperz nurkuje** na własnym arkuszu
     (Cr_Bat_Atk8: piszczy z rozłożonymi, drżącymi skrzydłami, leci ze złożonymi wzdłuż swojej linii, rozkłada je na końcu).
   - **Napisy nad głowami już się nie nakrywają** (Combat_UI.js updateFloaters, Combat_Fight.js numberAt): napisy walki (liczby, „Hart ducha”,
     „Opierasz się!”, „Odpowiedź!”, „Utknął!”...) układają się w stos - starszy zostaje, nowy, który by go zakrył, wchodzi nad niego (krótki ruch w
     górę, nigdy w dół); wysoki stos gaśnie szybciej; to samo słowo powtórzone w tym miejscu w ciągu pół sekundy tylko „podskakuje” zamiast się
     dublować; najwyżej 12 naraz; tabliczki nad bohaterem z SurvivalHUD (brak narzędzia, pogoda) zostają na miejscu, a napisy walki wchodzą nad
     nie. Liczby (każdy cios) zawsze osobno. Lista zdobyczy (prawy dół) i komunikaty u góry - bez zmian. Zrzut: docs/walka/napisy_stos.png.
   - **Nożownik** (Humans_Data `knifer`; „Nozownik (walka)” 7f9ef0a3, pro w stylu bohatera: łysa głowa w czerwonej chuście, chusta na twarzy,
     skórzany kubrak, długi nóż): 46 życia, 26 równowagi, krótszy zamach (17 klatek, kolejne 8), **do trzech pchnięć** pod rząd (75%: następne),
     każde za 7 (bandyta: dwa po 12), ale częściej rani (40%); **nie zasłania się - odskakuje** przed ciosem (35%, skok o 1-2 pola w tył);
     szybciej ucieka (poddaje się 50%, ucieka 40%). Łup: nóż kamienny (40% przy poddaniu / rozbrojeniu), czasem żelazny. Doświadczenie 30.
     Bywa w obozach od 5. dnia (30% za każdego bandytę), w zasadzkach (30%) i w napadach. F9 „Nożownik w pobliżu”. Arkusze Knife_Walk8,
     _Run8 (bieg po skosie w dół to bieg z boku - v3 przekładał nóż do drugiej ręki), _Atk8 (pchnięcie), _Kneel8, _Crouch8, _Lie8.
   - **Napad na śpiącego** (Humans.nightRaid / raidBand; mały hak w Farming_Build.sleepInTent obok wilków): kto śpi pod gołym niebem (namiot,
     legowisko) na mapie z obozami (CAMP.maps, notatka <Camp:x> albo <Raid:x>), w godzinach 23-4: 0,4% na godzinę przez pierwsze 5 dni, potem
     rośnie do 2% od 15. dnia (~10% na noc), x1,4 przy ognisku obok posłania (widać je z daleka), x2,5 gdy na tej mapie stoi obóz; nigdy w
     chacie, w tawernie, w miasteczku ani na polu dziadka. Budzi wcześniejszy z dwóch napadów (wilki / ludzie): „Obudzili cię bandyci!”, bohater
     woła „Bandyci!”, a 2-3 ludzi (czasem łucznik, nożownik) jest ~8 pól od niego (13, gdy pies zaszczekał), od razu w walce, z okrzykiem
     („Śpi jak kamień... Bierzemy wszystko!”). Pobity - obrabowany jak zawsze. F9 „Napad na śpiącego (bandyci)”, szyna `humansRaid`.
   - **Podgląd**: docs/walka/bossowie_arkusze.png (arkusze), GIF-y boss_krolowa_szczurow, boss_matka_pajakow_nic, boss_topielec_glebiny,
     boss_odzwierny_odlamki, boss_zbroja_bez_herbu, boss_ostatni_straznik, stwory_cien_twarz (cień z własnym ciosem), stwory_nietoperze
     (nurkowanie), nozownik_walka; zrzut napad_na_spiacego.png. Testy: creatures_test 52 (stos napisów, własne arkusze), humans_test 52
     (nożownik: trzy pchnięcia, odskok; napad na śpiącego na Leśnej drodze), debug_menu_test (nowe wiersze F9), unit/combat.test (nazwy API).
   - **Poprawki ludzi**: bandyta w biegu po skosie w dół nie gubi już pałki za peleryną (nowy bieg v3 z pałką trzymaną przed sobą); łucznik
     w biegu z boku nie przekłada łuku do drugiej ręki (nowy bieg v3: łuk nisko w lewej przez cały cykl). Stare arkusze:
     backup_art_2026-10-06/combat_polish/.
   - **Próba sił** (tests/combat_balance.js - nie test pass/fail; `CDP_PORT=9465 node tests/combat_balance.js [filtr|filtr] --reps 2`, wyniki
     tests/balance/): bot gra bohaterem na otwartej łące 15 x 7 (bez ścian - szarża kamiennika nie kończy się w murze): podchodzi i bije
     (kombo; ciężkie ciosy w zbroję, która paruje), obchodzi zbroję i kamień od tyłu (przewrót obok jego przodu), czyta pokazane ataki - przewrót
     z zamachu, z koła na posadzce, z linii szarży i nurkowania, z lecącej sieci i strzały - ale tylko w **75%** przypadków (gracz średni, nie
     mistrz), nie paruje, nie je i nie opatruje się: liczy się stracone życie, a gdy spadnie poniżej 30%, dostaje je z powrotem („odnowienie” =
     to, co gracz zapłaciłby jedzeniem i opatrunkami; ok. 1 odnowienie = jedna śmierć bez jedzenia). Bohater (decyzja, z tempa doświadczenia w
     Combat.js - wszystko, co da się zabić na piętrach + cele z dziennika + mapy): **piętro 5 - poziom 4** (kamienna siekiera, drewniana tarcza),
     **10 - 6**, **20 - 9**, **30 - 12**, **40 - 15**, **50 - 17**, **60 - 19**, **70 - 21**, **80 - 23**, **90 - 25** (żelazna siekiera, drewniana
     tarcza, skórzana kurtka - lepszej broni gra jeszcze nie ma); punkty atrybutów: Siła 35%, Kondycja 30%, Zręczność 15%, Czujność 10%,
     Hart ducha 10% (od piętra 80: 15%), bez umiejętności (ostrożnie: każda z drzewek tylko pomaga). Stwory mają poziom miejsca (piętro 10 - 9 ...
     piętro 90 - 49/50).
     - **Co wyszło przed zmianą**: na płytkich piętrach dobrze; od piętra 20 bossowie nie do przejścia przy tej krzywej (Przeor 15 odnowień,
       Królowa szczurów 30, Odźwierny i Zbroja bez herbu nie do pokonania w 4 min - 30-70 odnowień, Ostatni Strażnik 45), od piętra 60 także zwykły
       kamiennik (25). Przyczyna: cios stwora rósł o 10% za poziom i jeszcze 3,5% za każdy punkt Siły - na piętrze 90 ok. **13 razy** mocniej
       niż na 1., a życie bohatera do tego czasu tylko się podwaja; boss zabierał połowę życia jednym ciosem.
     - **Zmiany** (Creatures_Data.js `GROW` - nowe, dla wszystkich stworów): życie +10% za poziom (było 12%), bossowie +4% (było 6%), ciosy
       +5% za poziom (było 10%) i +1,2% za punkt Siły (było 3,5%) - cios z głębi rośnie mniej więcej jak życie bohatera (trochę szybciej:
       głębiej trudniej). Bossowie: Przeor ciosy x0,75 (było 1,2), kostur 22 (30), życie 320 (500); Królowa x2,5 (3,5), jeden rój 3 szczurów o 6
       poziomów słabszych (dwa po 5, o 3 słabszych); Matka x1,5 (2,2); Odźwierny x0,6 (1,3), życie 400 (900), obraca się wolniej (0,02),
       pierścienie odłamków co trzecie uderzenie, 8 (co drugie, 22); Zbroja bez herbu x0,65 (1,3), życie 650 (1000), kolejne cięcia z zamachem
       16 klatek (10), paruje 40% (50%), odpowiedź z zamachem 20 klatek (10) i odrzut broni bohatera 10 klatek (18 - **z 18 klatkami odrzutu
       przy 10 klatkach zamachu jej odpowiedź była nie do uniknięcia**); Upiór pytającego x1,0 (1,4), życie 550 (1000), pytanie 9 (20) i 200
       klatek na odpowiedź (160); Ostatni Strażnik x0,65 (1,4), życie 750 (1200), jego trzy cienie biją po jednym naraz i za 50% ciosu (wcześniej
       wszystkie trzy w pełni). Kamiennik: życie 130 (180), uderzenie 15 (24), szarża 16 (20),
       z boku 75% (60%), obrót 0,028 (0,032).
     - **Wyniki po zmianie** (2 walki na wiersz; czas gry; „stracone życie” w % jego życia - ponad 100% znaczy odnowienia):

     | Walka | Wróg: poz. (życie) | Bohater: poz. (Siła/Kond., życie) | Wygrane | Czas [s] | Stracone życie | Odnowienia | Przed zmianą: wygrane, czas, odnowienia |
     |---|---|---|---|---|---|---|---|
     | Rój szczurów (piętro 5) | 6 (84 życia) | 4 (11/7, 119 życia) | 2/2 | 8 | 6% | 0 | 2/2, 7.3 s, 0 |
     | Pająk (piętro 5) | 6 (87 życia) | 4 (11/7, 119 życia) | 2/2 | 13.2 | 18% | 0 | 2/2, 5.5 s, 0 |
     | Strażnik bramy (piętro 10) | 9 (464 życia) | 6 (12/9, 135 życia) | 2/2 | 72.3 | 139% | 1.5 | 2/2, 70.6 s, 2.5 |
     | Pusta zbroja (piętro 20) | 13 (348 życia) | 9 (15/12, 159 życia) | 2/2 | 45.3 | 75% | 0.5 | 2/2, 38.6 s, 1 |
     | Pająk (piętro 20) | 13 (138 życia) | 9 (15/12, 159 życia) | 2/2 | 9.1 | 11% | 0 | 2/2, 9.1 s, 0 |
     | Przeor w zbroi (boss 20) | 14 (578 życia) | 9 (15/12, 159 życia) | 2/2 | 103.2 | 191% | 2 | 2/2, 162.6 s, 15 |
     | Królowa szczurów (boss 30) | 19 (1048 życia) | 12 (19/14, 181 życia) | 2/2 | 85.9 | 228% | 2.5 | 1/2, 231.3 s, 30.5 |
     | Topielec (piętro 40) | 23 (392 życia) | 15 (21/17, 202 życia) | 2/2 | 19.4 | 39% | 0 | 2/2, 26.2 s, 1 |
     | Rój nietoperzy (piętro 40) | 22 (160 życia) | 15 (21/17, 202 życia) | 2/2 | 20.6 | 25% | 0 | 2/2, 26.4 s, 1 |
     | Matka pająków (boss 40) | 24 (1400 życia) | 15 (21/17, 205 życia) | 2/2 | 124.4 | 265% | 3 | 2/2, 146.1 s, 6 |
     | Topielec z głębiny (boss 50) | 29 (1824 życia) | 17 (24/19, 218 życia) | 2/2 | 102.5 | 131% | 1.5 | 2/2, 122.7 s, 5 |
     | Kamiennik (piętro 60) | 33 (750 życia) | 19 (25/21, 234 życia) | 2/2 | 149.4 | 275% | 3 | 1/2, 235.7 s, 24.5 |
     | Pusta zbroja (piętro 60) | 33 (684 życia) | 19 (25/21, 234 życia) | 2/2 | 66.8 | 135% | 1 | 2/2, 66 s, 3.5 |
     | Kamienny Odźwierny (boss 60) | 34 (1136 życia) | 19 (25/21, 234 życia) | 2/2 | 173.9 | 399% | 5 | 0/2, 240.1 s, 67.5 |
     | Zbroja bez herbu (boss 70) | 39 (1850 życia) | 21 (26/23, 253 życia) | 2/2 | 87.6 | 310% | 3.5 | 0/2, 240.1 s, 27 |
     | Upiór prawdy (piętro 85) | 46 (493 życia) | 24 (31/25, 269 życia) | 2/2 | 82.8 | 0% | 0 | 2/2, 78.3 s, 0 |
     | Cień (piętro 85) | 46 (460 życia) | 24 (31/25, 269 życia) | 2/2 | 33.1 | 78% | 1 | 2/2, 40 s, 3 |
     | Upiór pytającego (boss 80) | 45 (1622 życia) | 23 (31/24, 261 życia) | 2/2 | 127.4 | 210% | 2.5 | 2/2, 212.6 s, 21 |
     | Ostatni Strażnik (boss 90) | 50 (2336 życia) | 25 (33/26, 277 życia) | 2/2 | 180.3 | 788% | 10 | 0/2, 240.1 s, 46.5 |
     | Bandyta + nożownik (droga, poz. 2) | 2 (123 życia) | 3 (10/6, 141 życia) | 2/2 | 10.2 | 6% | 0 | 2/2, 17.9 s, 0 |
     | Najemnik (droga, poz. 4) | 4 (205 życia) | 5 (11/8, 130 życia) | 2/2 | 40 | 176% | 2 | 2/2, 34.5 s, 1 |

     - **Ocena** (bot 75%, bez parowania i jedzenia): zwykłe stwory 5-70 s i 0-1 odnowienia - wyjątek kamiennik (3 odnowienia, 2,5 min: bot
       słabo obchodzi go od tyłu na otwartej łące, a w podziemiach szarża w mur go ogłusza); bossowie 1,5-3 min i 2-5 odnowień, **Ostatni
       Strażnik** najtrudniejszy (4-16, średnio 10 - zależy od tego, jak trzy cienie złapią bohatera; po rozpadzie biją po jednym, za 50%
       ciosu bossa) - gracz lepszy od bota (parowanie, krok w bok zamiast przewrotu, jedzenie w przerwach) wychodzi wyraźnie lepiej. Ludzie z
       drogi przy tej krzywej: bez odnowień albo jedno-dwa (najemnik). **Ustalone 2026-10-06** (autor: „sam ustal”): krzywa bohatera jak
       wyżej, „bot 75% = gracz średni”, boss kosztuje 2-5 odnowień (Ostatni Strażnik, koniec pasma, ~10); napady bandytów na śpiącego
       w liczbach z §11.3 (rzadkie na początku, częstsze od 15. dnia, nigdy w chacie ani w miasteczku - dach chroni).

6. **Akt III — obrona tawerny** (2026-10-07; całość w `docs/AKT3.md`, kod `Act3.js` + `Act3_Data.js`, test `tests/act3_test.js`).
   - **Sojusznicy w walce** (nowe): obrońcy tawerny (Borgar, Grum, Rafał, Marek, strażnicy dworu, mieszkańcy) to postacie wtyczki
     (nie zdarzenia, jak ludzie i stwory): idą do człowieka frakcji przy swoim miejscu (Grum przy bohaterze), zamach - ciało rzucone do
     przodu - łuk broni (Grum: prawdziwe ciosy najemnika i tarcza z przodu), cios przez `Humans.hit` z `from` (garda i odrzut liczone od
     strony obrońcy). Trafiony człowiek bije się z obrońcą: `Humans.setFoe(człowiek, obrońca)` - jego podejście, obrót, zamach i cios idą
     na obrońcę (`takeHit`), bez kolejki bandy; łucznik nigdy (strzela do bohatera). Obrońca: życie i równowaga rosną z poziomem napadu
     jak u ludzi, zachwiany odskakuje, z zerem życia pada ranny (nie ginie). Zielony pasek i imię nad głową.
   - **Ludzie frakcji idą do drzwi** (`Humans.march`): kto nie walczy, wyważa drzwi tawerny albo stare drzwi przy piwnicy; `Humans.remove`
     - przeszedł przez wyważone drzwi.
   - **Dowódca kopaczy**: najemnik z własnym wyglądem (PixelLab a8bb43b1 w stylu bohatera, `anim8/Captain_*8`, narzędzia
     `tools/humans/` klucz `captain`), poziom napadu +2.
   - Pobity w napadzie bohater: obrabowany jak zawsze, a resztę rozstrzyga siła obrońców, którzy jeszcze stoją.

7. **Pochodnia jako broń** (2026-10-08, `Torch.js`; test `tests/torch_test.js`). Zapalona pochodnia (przedmiot 59) jest bronią trybu
   walki, dopóki płonie (w ręku albo wbita obok w ziemię) - na liście `[ ]` między pałką a pięściami. Własny zamach `Hero_Torch` (PixelLab,
   stan „Torch” bohatera, 17 klatek; rodzaj zamachu `torch` = 20, cios na klatkach [7, 7, 7, 9]).
   - Liczby (do potwierdzenia): **10 obrażeń** (pałka 13), równowaga 16 (pałka 26), zasięg 1,45, stożek 0,4, oddech 9 (pałka 10).
     Ogień: zwierzę **płonie 3 razy po 3** co 40 klatek (ciężki cios 5 razy), odnawiane, nie sumowane; człowiek i stwór dostają od razu
     **+4**. Kombo pochodnią to ok. 35 + do 9 ognia - tyle co pałka (ok. 46), ale słabiej zbija równowagę.
   - Strach zwierząt: trafiony **wilk odskakuje i przez 3 s trzyma 3,4 pola** (nie skacze; ciężki cios 4,2 s), **dzik ucieka** (odwrót
     2,5 s), **niedźwiedź cofa się** na ponad 1 s i dłużej czeka z kolejnym atakiem. Dopóki pochodnia płonie, wataha krąży o 0,9 pola
     dalej, a przerwa między skokami jest o ok. 1/3 dłuższa.
   - Pochodnia się wypala: 3 godziny zegara gry, **celny cios zabiera 4 minuty**; deszcz x2, śnieg x1,5, ulewa gasi po 6 minutach.
   - Bota balansu (`tests/combat_balance.js`) to nie zmienia: walczy siekierą (podziemia, ludzie), pochodnia jest słabsza od siekier.

Grafika na każdy etap: animacje postaci (przewrót, ciosy każdej broni, zamach ciężkiego ciosu, blok) i nowe
sprite'y wrogów — PixelLab, tak jak dotychczasowe arkusze zamachów (najbardziej pracochłonna część).
