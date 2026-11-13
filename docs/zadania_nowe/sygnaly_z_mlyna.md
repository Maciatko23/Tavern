# Sygnały z młyna (wątek W17 - projekt)

Stan: 2026-11-11, TYLKO PROJEKT (żadnego kodu ani danych gry nie zmieniono). Próbki: `docs/zadania_nowe/sygnaly_z_mlyna_probki/`
(`mlynarz_Walenty_poludnie.png` - postać z PixelLab, `skrzydla_pozy_kodu.png` - cztery pozy skrzydeł z istniejących arkuszy).

## 1. Pitch, długość, start

Młynarz Walenty Mączka mieli ziarno w nowym wiatraku (Map008, x95-99, y83-87) i od kilku nocy nie poznaje własnego młyna: rano skrzydła
stoją inaczej, niż je zostawił, a po drodze za miastem błyskają przysłonięte latarnie. Prawda: **przemytnicy używają skrzydeł jak
semafora**. Wiatrak stoi na najwyższym pagórku, widać go z lasu na północnym skraju Kruczego Jaru; pomocnik młynarza, schwytany w długu,
przestawia skrzydła na zmierzchu, wypatrywacz czyta pozę lunetą i niesie wieść na cypel przy Przystani, gdzie latarnią rozmawia z łodzią.
Bohater odczytuje kod, **ustawia skrzydła na fałszywy sygnał** i nocą w porcie odpowiada łodzi tak, żeby przypłynęła tam, gdzie czeka
zasadzka.

- Długość: **5 rozdziałów, 8-10 dni gry** (rozdz. 1-3 to trzy zmierzchy i noce obserwacji, rozdz. 4 przygotowanie, rozdz. 5 jedna noc).
- Start: **autoStart od dnia 14** (po dniu 10, żeby nie zderzyć się z W5 rozdz. 1-2), gdy bohater mija wiatrak między 17:00 a 21:00 albo
  siedzi w tawernie wieczorem (Walenty bywa tam 19-22 i sam podchodzi - „!” nad nim). Niezależny od W5, ale **czyta jego stan** (pkt 6).
- Z główną fabułą: to tło dla Baltazara (W5, towary z kontynentu), Rocha (D20), Sambora (D34), kodu dzwonu (W2 - Księga sygnałów) i suszy
  (przemytnicy wywożą zboże, kiedy w mieście brakuje chleba).

## 2. Zasada kodu (to, co gracz odkrywa)

Cztery pozy skrzydeł (pkt 5 mówi, jak je zrobić), każda to jedno słowo; wiadomość to **dwie pozy po sobie** (o 19:30 i o 20:15, każda
trzyma się kwadrans) plus **poza kontrolna o świcie** (05:00 - wiatrak wraca do pozy A, żeby młynarz niczego nie zauważył):

| poza | słowo |
|---|---|
| A „plus” | „cisza” - nic nie wiozą / straż patroluje |
| B „iks” | „towar gotowy” - zboże i skrzynie czekają |
| C „lewy skos” | „zatoczka” - lądowanie w zatoczce pod Przystanią |
| D „prawy skos” | „pochylnia” - lądowanie przy pochylni (szopa Rocha) |

Przykład: **B potem C** = „towar gotowy, zatoczka”. **A potem cokolwiek** = „dziś nie”. Noc zależy od pływu (jaskinia przemytników -
Map177 - jest dostępna tylko w odpływie, a łódź podchodzi do zatoczki w przypływie, więc kod ma sens tylko w noce, kiedy w zatoczce jest
`Wyspa.tide()` wysoki około 2:00; gracz poznaje to z tablicy pływów u Janka, rozdz. 3).

Odpowiedź z morza i od brzegu to **latarnia z przesłoną**: łódź pyta wzorem krótkich i długich błysków (K = krótki, D = długi), brzeg odpowiada
wzorem „hasła nocy”. Hasło nocy = wzór błysków wynikający z pozy (np. B-C = K-D-K). Gracz zna wzory z notatek rozdz. 3.

## 3. Rozdziały

### Rozdz. 1 „Skrzydła bez rąk” (dzień 14+, wieczór i noc)
- **Gdzie/kto:** tawerna (Walenty przy stole, wieczór) → wiatrak (przed budynkiem, pagórek).
- **Co robi gracz:** Walenty prosi: „Zostań ze mną na noc przed młynem, nie wierzę własnym oczom.” Wybór: „Zostanę.” / „Nie teraz.”
  (nie przepada, Walenty prosi następnego wieczoru). O 22:00 gracz staje przy Walentym na pagórku (miejsce zadania `wiatrak_przed`), czeka
  (klawisz OK = „czekaj godzinę” jak w nocnej warcie K38). Scena S1: skrzydła zmieniają pozę same, trzy razy do północy.
- **Dalej:** młyn jest zamknięty od środka, klucz ma tylko Walenty i jego pomocnik. Walenty: „Jasiek Worek śpi w izbie nad stajnią.”
  Notatka: „Skrzydła zmieniają pozę po zmroku. Ktoś ma klucz do młyna.”
- **Alternatywa:** gracz nie ma ochoty czekać - Walenty daje klucz zapasowy (przedmiot), bohater wchodzi sam do pustego młyna o 23:00
  (wnętrze, pkt 4); widzi dźwignię hamulca i woskowe krople pod oknem poddasza.
- **Dziennik:** „Młynarz traci spokój. Skrzydła wiatraka ktoś przestawia po zmroku.”

### Rozdz. 2 „Światła na drodze” (następne 1-2 noce, 20:00-1:00)
- **Gdzie:** wiatrak → północny skraj lasu w Kruczym Jarze (Map003, tuż pod granicą z miastem; miejsce do wyznaczenia po obejrzeniu mapy
  - warunek: czysta linia widoku do wiatraka, sprawdzana istniejącym `Widok.js`); obóz z W5 (Map003, 96,52) zostaje jako zaplecze.
- **Co robi gracz:** po zmierzchu na skraju lasu błyska przysłonięta latarnia (efekt światła: ogień, bo „każde światło to ogień”).
  Gracz skrada się (kucanie jak w Hunting, ptaki i psy płoszą - zasada czujności jak u kuriera W5) i **podsłuchuje Łasicę**, wypatrywacza
  z lunetą, i dwóch jego ludzi: słyszy „B i C - trzeba potwierdzić latarnią z cypla”. Nie wie jeszcze, co to znaczy.
- **Alternatywa walką:** Humans.ambush (Łasica + 2 bandytów); wtedy łódź zostaje ostrzeżona i rozdz. 4 jest trudniejszy (pkt 6).
- **Dziennik:** „Ktoś czyta skrzydła wiatraka lunetą i niesie wieść w stronę morza.”

### Rozdz. 3 „Księga skrzydeł” (dni 2-4 po starcie; zmierzchy, ranki)
- **Gdzie:** wiatrak (zmierzch), Archiwum (Map119, Księga sygnałów z W2), przystań (Janek, Roch), tablica pływów u Janka.
- **Co robi gracz:** odczytuje kod z trzech źródeł, każde daje dwa wiersze tabeli z pkt 2:
  1. **Obserwacja**: trzy zmierzchy przed wiatrakiem (20 minut gry każdy; poza zapisuje się sama w dzienniku: „Dziś B, C”) + co przypłynęło
     tej nocy (rano ślady na plaży Przystani: dziennik pokazuje „ślady kilu w zatoczce” albo „nic”). Z trzech zmierzchów wynika
     korelacja poza→łódź. Brak OK = brak postępu, żadnej kary.
  2. **Księga sygnałów** (Archiwum): w starej księdze Zakonu jest strona „Skrzydła Kruczarni”: dawny kod poczty kruczej (cztery pozy z
     opisem). Czytelnik dowiaduje się, że przemytnicy **dostali go od kogoś, kto miał dostęp do kronik**: jeśli gracz w W2 sprzedał
     kroniki Baltazarowi (300 G), Księga jest wyrwana (tylko obserwacja działa, zadanie dłuższe o jedną noc).
  3. **Roch** (po D20 albo `rochMet`): „Stary kod, jeszcze mój dziad go znał” - mówi wzory latarni (K/D) za 10 G albo za przysługę (naprawa
     sieci). Bez niego gracz podsłuchuje wzór w rozdz. 5 (wtedy ma 1 szansę zamiast 2).
- **Dziennik:** karta „Kod skrzydeł” (tabela A-D + hasło nocy), uzupełniana na bieżąco; OK na zadaniu = śledzenie.

### Rozdz. 4 „Fałszywy sygnał” (jeden dzień + zmierzch)
- **Gdzie:** wiatrak (wnętrze: parter i komora osi), tawerna (zaproszenie sojuszników), przystań (Sambor, Wit).
- **Co robi gracz (krok po kroku):**
  1. Przekonać **Walentego** (rozmowa; ma lęk przed przemytnikami; zgadza się, jeśli Opinia ≥ 20 albo dostanie 15 G za „kłopot”).
  2. **Jasiek Worek**, pomocnik: w rozmowie przyznaje się (zadłużony u ludzi Baltazara). Wybór: „Pomóż mi” (wtedy sam oddaje klucz i uczy
     obsługi dźwigni; zyskuje ochronę) / „Odsyłam cię na wieś” (Walenty wypłaca mu odprawę, 20 G z kieszeni gracza) / zignorować (gracz
     włamuje się kluczem zapasowym; Jasiek potem plotkuje i Łasica robi ostrożny - rozdz. 5 trudniejszy).
  3. **Zasadzka**: gracz zwołuje sojuszników w tawernie (rozmowa z Borgarem, potem z kapralem Witem przy barze w wieczór, kiedy Wit jest;
     Sambor jest na przystani) - jedna z trzech opcji: **celnik Sambor Kwit** (legalnie, konfiskata, 60 G nagrody od Lorda), **Wit z dwoma
     ludźmi** (`w5WitAlly`: tańsza, bez nagrody pieniężnej, Opinia +4), **sam z Rochem i Grumem** (walka, najlepszy łup).
  4. Wybór dnia: noc z wysokim pływem o 2:00 i bez wiatru (**Ozzy**: „Postaw mu piwo” daje prognozę pogody; skrzydła i tak stoją
     przy hamulcu, ale wiatr szarpie latarnię i łódź zwleka - przy wietrze łódź nie podejdzie). Gdy nie ma noc spełniającej oba
     warunki w najbliższych 3 dniach, Ozzy mówi wprost „Odłóż.”.
  5. O zmierzchu (19:30) w **komorze osi** gracz ustawia pozy: strzałki **← →** wybierają pozę A-D (podgląd na obrazku w oknie; na dźwięk
     skrzypienia zmienia się strzałka), **OK** zatwierdza. Po 15 minutach (zegar gry) drugi wybór. Poprawne: **B potem C** (towar gotowy,
     zatoczka) albo **B potem D**, jeśli zasadzka czeka przy pochylni. Zła kolejność: Łasica widzi „coś nie tak” i nie sygnalizuje; zadanie
     nie przepada, kolejny zmierzch to następna próba (do trzech, potem Łasica wymienia klucze młyna - rozdz. 4 od nowa).
  6. Opcja głośna: wypatrywacz Łasica **nie czyta skrzydeł** (np. został ogłuszony w rozdz. 2) - wtedy gracz sam dźwiga rolę wypatrywacza
     (rozdz. 5: dwie latarnie).
- **Dziennik:** „Ustawiłem skrzydła na kłamstwo. Teraz trzeba w nocy odpowiedzieć łodzi.”

### Rozdz. 5 „Noc w zatoczce” (noc 23:30-4:00, Przystań Map125)
- **Gdzie:** przystań: cypel nad zatoczką (x15-19, y65-67; z paczki 0), wylot jaskini (16-17, 64), molo; w tle pochylnia i szopa Rocha.
- **Co robi gracz:**
  1. 0:00 - zajmuje miejsce Łasicy na cyplu (Łasica przywiązany w lesie, albo w kajdanach u Sambora, albo - gdy czyta Walenty - po prostu
     tam siedzi jako figurant w rozmowie).
  2. 1:30 - scena S3: w morzu błyska latarnia, wzór z pkt 2. **Mini-gra**: ekran pokazuje wzór pytania (K D K); gracz ma 8 sekund na wpisanie
     odpowiedzi strzałkami (← = krótki, → = długi, OK = wyślij; ↓ = od nowa). Poprawna odpowiedź = hasło nocy. Pomyłka: łódź kręci
     się, pyta jeszcze raz (druga szansa). Druga pomyłka: łódź odpływa, a noc przepada (kolejna noc: gracz musi wrócić do rozdz. 4 pkt 5).
  3. 2:00 - łódź przybija do zatoczki (przypływ). Wysiada szyper Ostoja Rafa i trzech marynarzy, pomocnik Baltazara (jeśli Baltazar nie jest
     w garści gracza). Nieśli puste worki - mają odebrać **zboże**, które wcześniej wywieziono z miejskiego spichlerza do jaskini (patrz pkt 6).
  4. 2:10 - zasadzka: sojusznicy wychodzą z lasu; **walka** (Humans.js: szyper, marynarz-nożownik, dwóch bandytów) albo **zatrzymanie bez walki**,
     jeśli gracz ma Sambora i Wita (ci krzyczą „W imieniu Lorda!”, przemytnicy rzucają worki i uciekają łodzią - łódź odpływa, ale szyper
     zostaje w kajdanach).
  5. Jaskinia: skrzynie z zbożem (z pieczęcią dworu: poszlaka do W5), **dziennik łodzi** (notatka: „kupiec z miasta czeka na zboże w
     zimie, kiedy cena podwoi”), klucz do skrytki, **Pieczęć Czarnych Oczu** na jednej z beczek (tylko po W9 rozdz. 3: ślad, że Baltazar
     współpracował z kopaczami).
- **Wyjścia:**
  - **Sambor** konfiskuje i wypłaca 60 G, zboże wraca do spichlerza (Opinia +6, miasto dostaje chleb: wpis dnia „chleb po dawnej cenie”).
  - **Sam** (z Rochem): zboże do spichlerza (Opinia +6), zmniejszenie łupu do 25 G, Roch zyskuje zaufanie (+10), ale Sambor się obraża.
  - **Targ**: gracz bierze od szypra 90 G za milczenie i wypuszcza go (Opinia −4, `mlynZdrada`: Walenty nie będzie z nim rozmawiał;
    Baltazar wie o graczu: ceny x1,25 w W5 wrogu itd. - flaga do odczytu).
- **Dziennik:** „Przemytnicy złapani w zatoczce. Skrzydła wiatraka znów należą do młynarza.”

## 4. Sceny (storyboardy)

**S1 „Skrzydła same” (rozdz. 1, ok. 25 s, belki CleanHUD.sceneBars).** Noc, księżyc (Sky). Gracz i Walenty stoją przed młynem. Kamera
trzyma bohatera; po zmianie dnia 23:10 (zegar gry skacze) kamera podjeżdża w górę na skrzydła. Z młyna dobiega skrzypienie drewna (SE
„Wiatrak_skrzyp”, 2 s); skrzydła obracają się o ćwierć w trzech kolejnych klatkach (7,5° co 7 tików, razem ok. 1,3 s), stają. Dymek
Walentego (SpeechBubbles): „Trzeci raz! A drzwi zamknięte.” Gracz odpowiada dymkiem „Zapisuję.” Cięcie: z komina ani śladu dymu; w oknie
poddasza gaśnie żółty punkt. Pauza 1 s, kamera wraca.

**S2 „Lunetą” (rozdz. 2, 15 s).** Gracz ukryty w krzakach (kucanie), kamera pokazuje: Łasica z lunetą patrzy w górę na wiatrak (sylwetka +
lunetka-sprite), na wiatraku zmienia się poza, Łasica zapala przysłoniętą latarnię i błyska K-D-K (efekt światła mrugający 3 razy, z
dźwiękiem brzęku przesłony). Dymki podsłuchu (do notatki). Gracz ma sekundę na schowanie się, kiedy Łasica odwraca się.

**S3 „Rozmowa światłami” (rozdz. 5, 40 s).** Belki. Kamera na bohaterze na cyplu; w tle czarne morze z jedną żółtą kropką. Kropka mruga
K-D-K. Pasek ekranu: wzór (ikony kropka/kreska). Mini-gra odpowiedzi (8 s). Przy dobrej odpowiedzi kropka mruga raz długo (łódź
potwierdza), potem pojawia się zarys łodzi (obrazek, fala od dzioba z dźwiękiem wiosła). Dymek szypra: „Dobry znak, ciągnij.” Nad molem
dym z koksownika, w tle niebo (Sky). Łódź zbliża się 12 s, dokuje.

**S4 „Zasadzka” (rozdz. 5, 30 s).** Zbliżenie na grupę rozładowującą worki, kamera zawiera dwa kierunki światła (latarnia łodzi i
pochodnia Wita). Wit: „Stać! Straż Lorda!”, Sambor: „Worki na ziemię!” Szyper rzuca latarnią o kamienie (efekt ognia na piachu 6 s), potem
walka (Humans) albo ucieczka łodzi (animacja odpływu, 8 s).

**S5 „Ranek w młynie” (epilog, 12 s).** Walenty o świcie z dymem z komina; skrzydła obracają się w wietrze (12 klatek, normalny ruch).
Walenty: „Mielimy za darmo, kto przyniesie chleb dla Przytułku.” (otwiera D2 „Mąka bez młyna” - patrz pkt 8).

## 5. Postacie, przedmioty, rekwizyty, wnętrza

### Nowe postacie (wygląd w stylu bohatera: biedny chłop, PixelLab pro 64x64, `style_character_id` = bohater bf29bbe1…)
| klucz | imię | rola, plan dnia |
|---|---|---|
| `mlynarz` | **Walenty Mączka** (próbka gotowa) | młynarz: 5:30-17:30 przy wiatraku (`wiatrak_przed`, w pracy „work”), 19-22 tawerna, 22:30 śpi w pokoju za młynem. |
| `pomocnik` | **Jasiek Worek**, 16 lat | pomocnik młynarza; 6-17 pracuje przy wiatraku, o zmierzchu (18:30-20:30) „idzie po wodę” (w rzeczywistości ustawia skrzydła), nocą śpi w izbie nad stajnią. |
| `wypatrywacz` | **Łasica** | chudy, kaptur; stoi na skraju lasu 18-24 z lunetą (stoi tylko, gdy zadanie tego potrzebuje - jak obóz W5), poza tym nie występuje. |
| `szyper` | **Ostoja Rafa** | szyper łodzi z kontynentu, pojawia się tylko w rozdz. 5. |
Sztuczki z TownLife: Walenty i Jasiek jako mieszkańcy z planami (spoty `wiatrak_przed` + nowe `wiatrak_okno`); Łasica i szyper tylko w
zdarzeniach zadania (jak postacie W5).
Wygląd: Walenty - zaokrąglona sylwetka, mączny kitel, szare pasma we włosach (próbka). Jasiek - chuderlak w za dużej koszuli. Łasica -
kaptur i szary płaszcz (wspólna rodzina wyglądu z kurierem W5 - ten sam zawód). Szyper - płaszcz od deszczu, czapka rybacka.
**Popiersia (Bust):** Walenty i Łasica (skrypt tools/busts, 0 generacji; reszta bez popiersi, bo ich rozmowy są krótkie).

### Przedmioty (rzeczy spoza bazy, jak `v:struna`)
- **Klucz do młyna** (zapasowy, od Walentego).
- **Luneta** (narzędzie, `T.api`: klawisz „przyjrzyj się” przy skraju ekranu przybliża widok na 3 s; używana w rozdz. 2 i opcjonalnie później).
- **Latarnia z przesłoną** (narzędzie; lampa-ogień z przysłoną; jest też w rozdz. 5).
- Dziennik: karta „Kod skrzydeł”.

### Rekwizyty na mapie
- Przy Map008: bez nowych kafli (wiatrak już stoi, zdarzenia „Czapa wiatraka”, „Skrzydła wiatraka”, „Drzwi: Wiatrak”). Drzwi dostają
  zdarzenie wejścia do wnętrza, gdy zadanie jest aktywne albo po jego zakończeniu (D2).
- Skraj lasu Kruczego Jaru: zdarzenie wypatrywacza (+ zdarzenie „śladów stóp”, które widać tylko po zmierzchu, jako żółty romb).
- Przystań: zdarzenie łodzi (zdarzenie z grafiką, ruch po trasie), 2 pochodnie, worki na ziemi (widoczne tylko w tej nocy).

### Nowe wnętrza
1. **Wiatrak - parter** (nowa mapa, ok. 14x12, tileset wnętrz Winlu): dwa kamienie młyńskie (obrazy + animacja obrotu: obracają się, gdy
   wiatrak mieli), worki, kosz, schody na górę.
2. **Wiatrak - komora osi** (ok. 10x8): oś, koło zębate, **dźwignia hamulca** (zdarzenie, OK = menu ustawiania pozy), okno na drogę (zdarzenie,
   „wygląd z okna” - krótka scena z przeniesieniem kamery na zewnątrz).
Obie mapy w stylu „wnętrza równe i bez dziur” (zasada gracza).

## 6. Animacje i grafika

### Skrzydła: pozy nieruchome (kod)
Skrzydła istnieją: `img/characters/!$Wiatrak_Skrzydla.png`, `_2`, `_3` (864x1152, każdy arkusz 3 kolumny x 4 wiersze po 288x288 px);
**12 klatek obrotu co 7,5°** (klatka f = f/4 -> arkusz, f%4 -> wiersz: dół, lewo, prawo, góra; środkowa kolumna = wzór 1; kąt klatki f =
22,5° + 7,5° x f; skrzydła są symetryczne co 90°, więc klatka 12 = klatka 0). Zdarzenie „Skrzydła wiatraka” (Map008, 97,86) obraca je trasą
ruchu: zmień grafikę, obróć, czekaj 7. **Jak zrobić pozę nieruchomą (bez nowej grafiki, 0 generacji):**
1. Pozy (obraz `skrzydla_pozy_kodu.png`): **A „plus” = klatka 9** (90°, arkusz `_3`, wiersz 2 - kierunek „lewo”), **B „iks” = klatka 3** (45°, arkusz `Skrzydla` (1),
   wiersz 4 „góra”), **C „lewy skos” = klatka 0** (22,5°, arkusz 1, wiersz 1 „dół”), **D „prawy skos” = klatka 6** (67,5°, arkusz 2, wiersz 3 „prawo”).
   Po zmianie wzoru (plus/iks) rozróżnialność jest wyraźna nawet przy pomniejszeniu; C i D to lustra, dlatego dodatkowy sygnał (nie tylko poza):
   przy C/D latarnia obok wiatraka zaświeca się w innym kolorze (pomarańcz/zieleń), jeśli gracz ma lunetę.
2. W wtyczce (nowy `Mlyn.js`): `Game_Event` „Skrzydła wiatraka” szukane **po nazwie, nie po numerze** (gracz edytuje mapę); metoda
   `sailPose(poza)`: ustawia `setImage(arkusz, 0)`, `setDirection(kierunek)`, `setPattern(1)`, czyści `moveRoute`, `moveType = 0` i
   `setDirectionFix(true)`. Przełączanie pozy nie wymaga skanu klatek: tylko zmiana pól zdarzenia w chwili zmiany.
3. **Przejście między pozami (żeby nie „skakały”)**: licznik animacji przez 7 tików na klatkę, od klatki bieżącej do docelowej (po krótszej
   drodze modulo 12; skrzypienie SE); po dojściu stoi. Timer żyje tylko w czasie przejścia, więc w spoczynku koszt = 0.
4. Powrót do „zwykłego” obrotu: ponowne wgranie trasy ruchu z build5.py (kopia listy w `Mlyn.js`, żeby nie zależeć od scenariusza mapy).
5. Czas: poza zapisana w stanie wątku; po wczytaniu gry skrzydła wracają do zapisanej pozy (gdy zadanie aktywne), inaczej kręcą się.
Dodatkowe pozy (jeśli gracz zechce więcej niż cztery): klatki 1, 2, 4, 5, 7, 8, 10, 11 są dostępne, ale różnią się tylko o 7,5°
(niewidoczne z odległości) - nie używać ich jako słów.

### Latarnie
- Błysk: efekt światła (system „każde światło to ogień”) z maską przysłony: 3 stany (zgaszone, błysk krótki 0,25 s, długi 0,7 s) w
  skrypcie, bez klatek rysowanych. Sprite lunetki (3 klatki, 16x16): rysowany skryptem.
- Światło łodzi: ten sam efekt, na wodzie odbicie (istniejące światła przy molo).

### Lista grafiki
| co | jak | status |
|---|---|---|
| skrzydła (12 klatek, 3 arkusze) | skrypt `tools/miasto5/wiatrak_skrzydla.py` | **istnieje** |
| czapa wiatraka, wiatrak | PixelLab + skrypt | **istnieją** |
| Walenty, Jasiek, Łasica, szyper (8 kierunków + chód 8) | PixelLab pro 64x64 (styl bohatera) | Walenty: próbka (10 gen); reszta do zrobienia (~3x30 gen razem z chodem) |
| popiersia | skrypt tools/busts | do zrobienia (0 gen) |
| łódź przemytników (obraz 3x2 kratki, 1 klatka, bez animacji + fala skryptem) | PixelLab (map object / pro flash) | do zrobienia (~10 gen) |
| wnętrza młyna (2 mapy) | skrypt jak tools/wnetrza/build.py | do zrobienia |
| lunetka, ikony K/D (ekran mini-gry) | skrypt | do zrobienia |
| SE: skrzypienie skrzydeł, brzęk przesłony, plusk wiosła | PixelLab `create_sound_effect` albo istniejące z Atmosphere | do zrobienia (3 efekty) |

## 7. Nagrody i konsekwencje

- **Sambor**: 60 G (raz), **Walenty**: 40 G + 2 worki mąki (dwa razy dziennie mąka dla piekarni, `D2`) + dożywotni „stół” w młynie (dla
  piekarki Hanki; D2 „Mąka bez młyna” po tym zadaniu staje się grywalne - wnętrze młyna istnieje), **Roch**: +10 zaufania.
  Razem **pewne złoto ok. 100 G** (zgodnie z audytem: w sumie 90 zadań dawało 883 G, ten wątek jest długi - 5 rozdziałów), opcje do +40 G (łup z walki).
- Opinia +6 (zboże wraca), 150 dośw. (Combat), luneta + latarnia z przesłoną jako narzędzia na stałe.
- **Konsekwencje:** przemytnicy tracą kanał na miesiąc (żadna łódź nie przypływa do zatoczki przez 10 dni); Baltazar (jeśli nie w garści) po
  W5 ma kłopot - flaga `mlynBaltazar` do odczytu przez W5/W9; zboże w spichlerzu → przez 3 dni w Przytułku chleb (wpis kalendarza).
- **Koniec zdrady** (`mlynZdrada`): zaufanie Walentego znika, Baltazar płaci 90 G, w Akcie II łódź wraca (przemytnicy nie giną w W9).

### Stan W5 wpływa na role (kto stoi za przemytem)
| stan | kto stoi za przemytem | różnica w zadaniu |
|---|---|---|
| W5 nie zaczęte (przed dniem 10) / niewiadome | „ludzie od Baltazara” bez nazwisk | rozdz. 5 daje poszlakę W5 (zboże z pieczęcią) |
| `w5Zamkniety` / `w5Soltys` (kantor zamknięty) | **Baltazar wrócił na przystań** z najemnikami (`w5BaltazarWrocil`): skrzydła to jego nowy kanał po utracie tylnych drzwi | szyper to jego człowiek; w jaskini lista najemników; zasadzka trudniejsza (+1 bandyta) |
| `w5Podwojna` (wspólnik) | to **kanał Baltazara za plecami bohatera** albo test lojalności | Baltazar prosi bohatera o ustawianie skrzydeł (30 G tygodniowo) - to trzeci wybór w rozdz. 4: wspólnik = bohater „obsługuje” sygnały, nie ma zasadzki |
| `w5BaltazarWrog` | wróg wie, że gracz węszy | Łasica ma obstawę (+2 bandytów), a kod zmienia się po rozdz. 3 (hasło nocy trzeba podsłuchać na nowo) |

### Roch i D20
- Jeśli bohater naprawił kuter (D20, `d20Wydany` = 0), Roch pływa nocą - i to **jego kuter może być w noc zasadzki w zatoczce przypadkiem**:
  zadanie sprawdza dzień Rocha w planie (Przystan.js); jeśli się zbiega, Roch jest ostrzeżony przez bohatera (rozmowa) albo nie (wtedy w
  zasadzce wpada **Roch** - kolejny dylemat: wypuścić, oskarżyć, wziąć odpowiedzialność).

## 8. Implementacja

- **Silnik i dane:** nowa para `Mlyn.js` + `Mlyn_Data.js` według zasady „dane w Watki” (wątek `mlyn`, teksty `js/teksty/mlyn.txt`);
  wzór: `Kantor.js/Kantor_Data.js`. Wątek startowy: `autoStart` jak K37; zadania TownQuests (K/D numeracja: **W17**, od dnia 14).
- **Moduł wątku:** rozdz. 1-5 jako szyny zadania z krokami własnymi (czekaj noc, podsłuchaj, ustaw skrzydła, odpowiedz latarnią).
  Wykorzystane istniejące: `Tawerna.inject` (miejsca zadań 951-959 na Map008, nowe zdarzenia wnętrza), `Humans.ambush` (walka),
  `TownLife` (Walenty i Jasiek), `SpeechBubbles`, `CleanHUD.sceneBars`, `Sky` (pora), `Wyspa.tide()` (pływ), `Hunting` (kucanie, czujność),
  `Widok.js` (linia widoku), `Atmosphere` (dźwięki).
- **Nowe mini-gry (klawiatura):** (a) wybór pozy skrzydeł (← → OK), (b) odpowiedź latarnią (← → OK, ↓ od nowa).
- **Mapy:** dwie nowe (parter i komora osi wiatraka) w następnych wolnych numerach (po 212), tileset wnętrz; przy `Map008` tylko zdarzenia
  przez `inject`, bez zmiany pliku (gracz edytuje mapy).
- **F9 (nowy wiersz „Sygnały z młyna”):** skocz do rozdziału N, ustaw pozę skrzydeł (A-D), „zmierzch teraz”, „łódź przypływa teraz”, „pokaż kod”,
  „wyłącz łódź”.
- **Testy:** `tests/mlyn_test.js` (autoStart tylko po dniu 14; pozy skrzydeł = zapisana poza po wczytaniu; kod: B+C = zatoczka; mini-gra
  latarni: dobra odpowiedź w 8 s i dwie szanse; pływ + wiatr; trzy wyjścia z rozdz. 5 z flagami i wypłatami; macierz stanów W5;
  skrzydła obracają się po zakończeniu), plus test wydajności (zero kosztu w spoczynku).
- **Rozmiar:** **L** (silnik M: dwa mini-gry i pozy; dane M; dwa wnętrza S; grafika: 4 postacie + łódź).
- **Ryzyka:** (1) zdarzenie skrzydeł jest ręcznie edytowalne na mapie (szukać po nazwie); (2) linia widoku wypatrywacz→wiatrak zależy od układu
  Kruczego Jaru - sprawdzić przy rozmieszczaniu; (3) pływ i wiatr zawężają okna czasu - Ozzy i dziennik muszą jasno mówić, kiedy; (4) zbieg z
  W5 rozdz. 2 (obóz przemytników nocą): wypatrywacz stoi tylko od tego momentu; (5) konflikt z K51/D24 dziś zmienianymi (Kruczarnia):
  ten wątek ich nie dotyka.

## 9. Pytania do użytkownika
1. Cztery pozy skrzydeł jako „słowa” wystarczą (A plus, B iks, C/D skosy), czy chcesz osiem (pozy 45°/22,5° plus pozy w trakcie obrotu)?
2. Dwa małe wnętrza młyna (parter + komora z dźwignią), czy jedno z drabiną?
3. Czy przy Baltazarze-wspólniku wolisz, żeby bohater mógł **zarabiać na kodzie** (30 G tygodniowo), czy zawsze musi zasadzić?
4. Ma być łódź w zatoczce (przypływ) czy przy molu (prościej, ale mniej „przemytniczo”)?
