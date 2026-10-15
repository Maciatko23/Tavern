# Prolog „Ostatni prom”: scenopis

Wersja do zatwierdzenia z 2026-10-12. Na razie to tylko scenopis i klatki podglądu, w grze nic się nie zmieniło.

- **Klatki podglądu:** `prolog_01` … `prolog_08` w tym folderze. Wszystkie razem są w `zestawienie.png`.
- **Imię na klatkach:** wpisane przykładowe imię „Łukasz”. W grze w każdej kwestii stoi `\N[1]`, czyli imię wybrane przez gracza.
- **Długość:** około 3 minut 40 sekund, przy normalnym tempie czytania (bez pomijania).

## Zasady całości

- **Sam film:** gracz nic nie steruje. Prolog rusza tylko po „Nowej grze” (ekran tytułowy, TitleScreen.js). Wczytanie zapisu go nie pokazuje.
- **Pomijanie:**
  - **Następna kwestia:** O, Enter albo kliknięcie przewija dymek (jak w zwykłych rozmowach).
  - **Pominięcie sceny:** krótkie naciśnięcie P albo Esc przeskakuje do następnej sceny.
  - **Pominięcie całości:** przytrzymanie P przez około 1,2 s. W prawym górnym rogu na czarnym pasie (dół zajmują popiersia) miedziane kółko napełnia się podczas trzymania, a na pełnym gra przechodzi od razu do domu dziadka.
  - Podpowiedź „przytrzymaj: pomiń” jest przygaszona i jaśnieje, gdy gracz naciśnie dowolny klawisz.
- **Wygląd:**
  - Kinowe czarne pasy u góry i u dołu, 56 px.
  - Dymki i popiersia jak w rozmowach w grze (styl Grafit i miedź): popiersie rozmówcy z lewej, bohatera z prawej, tabliczka z imieniem, miedziane narożniki.
  - Postacie bez popiersia mówią dymkami nad głową na planszy.
- **Postacie:**
  - Na planszach wszyscy są malowani w PixelLab w stylu bohatera, bez postaci z RTP.
  - Bohater na lądzie (sceny 2–3) ma całe ubranie i buty. Od sztormu jest podarty i bosy, jak w grze.
- **Bohater:** jedynak. Ojciec zaginął na wojnie. Matka zostaje na lądzie, żeby go szukać, i obiecuje przypłynąć następnym promem. Nie przypłynie (wątek na później).
- **Wrogie wojsko:** obca armia, nie Lord Zaleski. Czarne tabardy, biały **otwarte oko** na piersi i na chorągwi. Pasuje do wojny „o pewność” (o Serce, które pokazuje prawdę). Nazwa frakcji do ustalenia.

## Technika: plansze czy silnik?

Proponuję **wszystkie sceny filmu (1–5) jako malowane plansze z ruchem**, a scenę 6 już w silniku gry (dom dziadka, Map019).

Dlaczego plansze, także dla sztormu i plaży:
- **Skala.** Sztorm z bliska (fala nad burtą, maszt, kruk, twarz chłopca) i szeroka plaża z wrakiem i klifem to ujęcia, których kamera z góry w silniku nie pokaże. Mapa sztormu wyglądałaby jak kawałek wody z deszczem.
- **Brak map.** Na wyspie nie ma mapy plaży ani kutra. Musiałyby powstać od zera, a zobaczy się je jeden raz przez 30 sekund.
- **Spójność.** Jeden styl przez cały film: ten sam co nowy ekran tytułowy (miękki malowany piksel, ciepły ogień na zimnej nocy). Wejście do gry w scenie 6 jest wtedy wyraźnym przejściem „ze snu do jawy”.
- **Te same efekty.** Plansze dostają ruch z tych samych rzeczy co gra: deszcz (jak MZ i Storm.js), błyski i grzmot opóźniony jak w Storm.js, ogień, iskry i popiół jak na ekranie tytułowym, mgła, kołysanie kamery.

Jak to zbudować: jedna wtyczka `Prologue.js` z własną sceną `Scene_Prologue`. Na planszy leżą warstwy: tło, efekty (cząstki, błysk, mgła), dymki i popiersia z SpeechBubbles, czarne pasy. Kamera to powolny przejazd lub zoom planszy (2–4%) i przejścia przez czerń.

## Ekran imienia (przed filmem)

Klatka: `prolog_01_ekran_imienia.png`.

- **Kiedy:** po „Nowa gra”, zanim ekran ściemnieje do filmu. Tło to rozmyty, przyciemniony ekran tytułowy z iskrami.
- **Wygląd:** panel Grafit z napisem „Jak masz na imię?” i podpisem „Tak będą cię wołać matka, dziadek i wszyscy na wyspie.” Pod nim pole z imieniem, miedzianą kreską i migającym kursorem oraz licznik „6 / 12”.
- **Litery:** siatka 6 × 10 z polskimi znakami (A Ą B C Ć D E Ę F G H I J K L Ł M N Ń O Ó P R S Ś T U W Y Z Ź Ż i małe). Przyciski Spacja, Cofnij, Losuj (imiona wiejskie: Jaś, Antek, Wojtek, Bartek, Staś, Kuba…) i Gotowe.
- **Sterowanie:**
  - pisanie wprost z klawiatury, także Alt+litera dla polskich znaków;
  - W/S/A/D lub strzałki: po siatce;
  - O: wpisz literę;
  - P: cofnij literę, a przy pustym polu powrót do ekranu tytułowego;
  - Enter: gotowe;
  - mysz.
- **Wołacz:** pod polem jest wiersz „Wołają cię: Łukaszu! (zmień: Tab)”.
  - Gra sama zgaduje wołacz z prostych reguł (Łukasz → Łukaszu, Jaś → Jasiu, Kuba → Kubo, Antek → Antku), a gracz może go poprawić.
  - W tekstach byłby na to osobny kod, np. `\W[1]`, a `\N[1]` zostaje dla zwykłych zdań.
  - Bez tego zwracanie się po imieniu brzmi potocznie („Trzy dni gorączki, Łukasz.”), jak na klatce z gry.
- **Zasady:**
  - imię ma 1–12 znaków;
  - pierwsza litera zamieniana jest na wielką;
  - puste pole daje „Reid” (imię z bazy);
  - imię ustawiane jest przez `$gameActors.actor(1).setName(...)`, więc działa `\N[1]` w każdej rozmowie i na karcie Postać.
- **Uwaga techniczna:** wbudowany ekran imienia RPG Makera (Scene_Name) ma japoński i angielski układ liter i nie ma pisania z klawiatury, dlatego proponuję własny ekran w stylu Grafit.

## Scenopis

| # | scena | czas | technika | muzyka / tło dźwiękowe (audio/) |
|---|---|---|---|---|
| 0 | Ekran imienia | ile gracz chce | panel Grafit | muzyka tytułowa gra dalej |
| 1 | Kronika | ~25 s | czerń, pergamin, napisy | BGS `Wind1` cicho; BGM `Theme5` (lub `Scene2`) od początku |
| 2 | Płonąca wieś i chata | ~75 s | 2 plansze | BGS `Fire2` + `People2` (tłum); SE `Fire3`, `Horse`, `Horn`; w chacie BGM `Scene4` (cicha, smutna) |
| 3 | Port | ~35 s | plansza | BGS `Sea` + `Rain1`; SE `Coin`, `Chain` |
| 4 | Sztorm | ~35 s | plansza z kołysaniem | BGS `Storm2` + `Wave2`; SE `Thunder3`/`Thunder9`, `Crow`, na końcu `Collapse4`; BGM `Ship3` albo cisza |
| 5 | Plaża o świcie | ~30 s | plansza z mgłą | BGS `Wave1` cicho, `Wind2`; SE `Crow` z daleka; BGM `Scene1` |
| 6 | Dom dziadka | rozmowa (~60 s) | silnik gry, Map019 | jak dziś w domu dziadka (ogień w palenisku, cisza) |

Gdzie BGM nie jest podany, gra BGM z poprzedniej sceny. Nazwy plików są z `audio/bgm`, `bgs`, `me` i `se`. Kolejność BGM do odsłuchu i ewentualnej podmiany.

### Scena 1: Kronika (~25 s)
Klatka: `prolog_02_kronika.png`.

- **0:00–0:03:** czerń. Z dołu ekranu wyłania się ciemna mapa Kruczej Wyspy na pergaminie (ta z Atlasu). Na dole mapy pulsuje słaba czerwona łuna, jakby palił się ląd poza kadrem.
- **Co się rusza:**
  - powoli spada popiół (szare płatki);
  - mapa przesuwa się ku górze o kilka pikseli przez całą scenę;
  - łuna oddycha.
- **Narrator:** napisy pojawiają się jedno po drugim, bez głosu, w EB Garamond:
  > **Trzeci rok wojny.**
  > Królestwa na lądzie walczą o coś, czego nikt nie widział — o pewność.
  > Za morzem leży Krucza Wyspa. Ziemia niczyja.
  > Płyną tam ci, którym nie zostało już nic.
- **Przejście:** popiół gęstnieje, napisy gasną, a mapa ciemnieje w czerń i wchodzi czerwień ognia sceny 2.

### Scena 2: Płonąca wieś (~75 s, 2 ujęcia)

**Ujęcie 2a: wieś** (`prolog_03_plonaca_wies.png`, ~20 s)
- **Co widać:**
  - ląd nocą, płoną strzechy chałup;
  - błotnista droga, na niej uciekinierzy: kobieta ciągnie wózek, starzec prowadzi dziecko, ludzie niosą tobołki na plecach;
  - między domami kolumna obcych żołnierzy w czarnych tabardach z białym okiem i czarna chorągiew z okiem.
- **Napis na górze:** „Ląd. Wieś Brzozowa Wola, noc.” (nazwa do zmiany).
- **Co się rusza:**
  - płomienie (blask migocze jak na ekranie tytułowym), iskry i popiół lecą w górę;
  - chorągiew faluje;
  - uciekinierzy idą powoli w lewo (warstwa przesuwana o 1 px co kilka klatek);
  - kamera powoli najeżdża na jedną chatę z prawej.
- **Dźwięk:** tłum, trzask ognia, z daleka róg (`Horn`) i koń (`Horse`).
- **Krzyk z tłumu** (dymek nad uciekinierem, bez popiersia): „Idą od rzeki! Do portu, póki prom stoi!”

**Ujęcie 2b: chata, matka** (`prolog_04_chata_matka.png`, ~55 s)
- **Co widać:**
  - izba z piecem i świecą, przez okno łuna;
  - matka klęczy i wiąże chłopcu tobołek;
  - na stole list z czerwoną pieczęcią i wisiorek z krukiem na rzemyku;
  - chłopiec stoi w całym ubraniu, z torbą przez ramię.
- **Co się rusza:**
  - świeca i ogień w piecu migoczą;
  - łuna w oknie pulsuje;
  - co kilka sekund na ułamek sekundy pada cień przebiegającego za oknem żołnierza;
  - z belek sypie się kurz (wstrząs, `SE Earth2` z daleka).
- **Rozmowa** (popiersia: matka z lewej, bohater z prawej):
  > **Matka:** Tobołek. Chleb, ser, koc. Nie otwieraj, dopóki nie wypłyniesz.
  > **\N[1]:** Mamo, chodź ze mną. Prom jeszcze stoi.
  > **Matka:** Nie mogę. Ktoś musi być w domu, kiedy ojciec wróci. Pójdę za wojskiem, rozpytam w obozach...
  > **Matka:** Weź ten list. Dla dziadka Stacha, na Kruczej Wyspie. Oddasz mu do rąk. On cię przyjmie.
  > **\N[1]:** Dziadka? Przecież nigdy go nie widziałem.
  > **Matka:** Ale on cię widział. Na chrzcinach. Płakał jak bóbr, choć się wypierał.
  > **Matka:** I to... wisiorek z krukiem. Był twojego ojca, a przedtem jego ojca. Nie zgub go, \N[1].
  > **\N[1]:** A ty? Kiedy przypłyniesz?
  > **Matka:** Następnym promem. Obiecuję.
  > *(cisza: matka zawiązuje tobołek, gładzi chłopca po głowie; świeca drga)*
  > **Matka:** Biegnij. Nie oglądaj się.
- **Przejście:** drzwi (`SE Door2`), ściemnienie, krótki odgłos biegu po błocie.

### Scena 3: Port (~35 s)
Klatka: `prolog_05_port_przemytnik.png`.

- **Co widać:**
  - noc w porcie, kamienne molo, a przy nim duży prom;
  - prom pilnują obcy żołnierze z pochodniami i chorągwią z okiem;
  - tłum uchodźców odpychany drzewcami;
  - z prawej, w cieniu drewnianego pomostu, stary kuter z łataną żaglą i latarnią;
  - przemytnik w kapturze z woskowanego płótna, z siwą brodą i złotym kolczykiem, wyciąga rękę, a chłopiec podaje mu monety;
  - na horyzoncie płonie miasto.
- **Co się rusza:**
  - mżawka;
  - pochodnie migoczą i ich odbicia drgają na wodzie;
  - kuter i latarnia lekko kołyszą się na fali;
  - chorągiew faluje.
- **Krzyk przy molo** (dymek nad żołnierzem): „Prom tylko dla wojska! Cofnąć się!”
- **Rozmowa** (dymki nad głowami; przemytnik nie ma jeszcze popiersia, dostanie je, gdy pojawi się na przystani wyspy):
  > **Przemytnik:** Prom jest dla wojska, chłopcze. Ale mój kuter... za tyle monet.
  > **\N[1]:** To wszystko, co mam.
  > **Przemytnik:** Wiem. Dlatego tyle kosztuje. *(SE `Coin`)* Wskakuj. I trzymaj się masztu.
  > **Przemytnik** *(do siebie)*: Krucza Wyspa... Nikt rozsądny tam teraz nie płynie. Dobrze, że nie jestem rozsądny.
- **Przejście:** kuter odbija (plansza odpływa w prawo, światła portu maleją), a w czerń wchodzi szum morza.

### Scena 4: Sztorm (~35 s)
Klatka: `prolog_06_sztorm.png`.

- **Co widać:**
  - pokład kutra nocą, wielkie fale nad burtą, ulewa;
  - postrzępiony żagiel, na szczycie masztu siedzi czarny kruk;
  - chłopiec przywiązany liną do masztu, już przemoczony i podarty, bosy;
  - przemytnik przy sterze, nad nim kołysze się latarnia.
- **Co się rusza:**
  - cała plansza kołysze się (obrót ±1,5° i przesunięcie w górę i w dół, okres około 3 s);
  - ukośny deszcz w dwóch warstwach;
  - piana na falach (nakładka);
  - latarnia się kiwa;
  - błyskawice co 4–7 s: biały błysk na 3 klatki, potem grzmot z opóźnieniem, jak w Storm.js;
  - kruk przy błysku rozkłada skrzydła i krzyczy (`SE Crow`), ale nie odlatuje.
- **Bez dialogu,** tylko krzyki w dymkach, krótko:
  > **Przemytnik:** Trzymaj się! Zaraz będzie brzeg... albo dno!
  > **\N[1]** *(myśl, dymek bez ogonka)*: Mamo...
- **Finał:** potężna fala wypełnia ekran od prawej, `SE Collapse4`, biel, czerń i cisza przez 2 sekundy. W ciszy słychać tylko krakanie z daleka.

### Scena 5: Plaża o świcie (~30 s)
Klatka: `prolog_07_plaza_swit.png`.

- **Co widać:**
  - świt, różowo-liliowe niebo;
  - szary piasek, rozbity kuter z poszarpanym żaglem, deski i lina;
  - nisko leżąca mgła;
  - ścieżka przez wydmy w górę, ku sosnom i czarnym klifom z krukami;
  - przy wodzie leży chłopiec, bosy, w podartej koszuli, bez tobołka; w dłoni ma mokry list, na szyi wisiorek.
- **Napis:** „Krucza Wyspa. Świt.”
- **Co się rusza:**
  - mgła płynie;
  - małe fale obmywają stopy chłopca (kilka klatek fali);
  - kruki krążą nad klifem;
  - słońce powoli rozjaśnia kadr.
- **Akcja** (podmiana kilku klatek postaci na planszy albo ciemność między ujęciami):
  1. Chłopiec unosi głowę i podnosi list, a atrament jest rozmyty.
  2. Myśl, dymek bez ogonka: „List... jeszcze go mam. I wisiorek.”
  3. Myśl: „Tobołek... morze go wzięło. Przemytnik?” *(rozgląda się: nikogo, tylko wrak)*
  4. Wstaje, chwiejnie idzie ścieżką w górę. Kamera powoli jedzie za nim w prawo i w górę.
  5. Myśl: „Dziadek Stach... gdzie ty mieszkasz...”
  6. Przy pierwszych sosnach pada (`SE Down1`). Obraz rozmywa się, ciemnieje i przechodzi w czerń.
- **W czerni:** głos z dymku, bez postaci: „Ej! Ej, chłopcze! Żyjesz?”, potem stłumione „Do Stacha go... to chyba jego wnuk, ma ten jego wisiorek...”. To rybak; jego imię Janek jest do zatwierdzenia.

### Scena 6: Dom dziadka (gra, Map019)
Klatka: `prolog_08_dom_dziadka.png`, prawdziwy zrzut z gry z proponowanym tekstem.

- **Przejście:** z czerni powoli wyłania się izba dziadka (rozjaśnienie przez 2 s), bohater stoi przy swoim posłaniu w alkowie, dziadek przy nim.
- **Od tej chwili gra jest grywalna.** Rozmowa startuje sama (jak dziś `Story.startIntro`), a potem gracz ma już sterowanie.
- **Ubiór bohatera:** w grze jest już podarty i bosy, czyli pasuje do sceny 5 bez zmian w grafice.

#### Nowa rozmowa z dziadkiem (propozycja zamiast obecnego `introList` w Story.js)

Wszystkie informacje z obecnej rozmowy zostają:
- dług u Lorda Zaleskiego: kwota i termin;
- pole za lasem i to, że tylko tam wolno budować;
- droga na pole;
- Borgar i „Pod Złotym Kuflem” (praca po południu i wieczorem);
- dwór Lorda obok tawerny, gdzie oddaje się spłatę;
- kapuśniak na drogę.

`DEBT`, `DEADLINE` i nazwy z gry wstawia kod, jak dziś.

> **Dziadek Stach:** No, nareszcie otworzyłeś oczy. Rybak Janek przyniósł cię z plaży. Trzy dni gorączki, \N[1]. Trzy dni.
> **\N[1]:** Dziadku...? To naprawdę ty?
> **Dziadek Stach:** A kto inny, Lord Zaleski? Leż, leż. Miałeś w garści to... *(podaje mokry list)* Ani na chwilę nie chciałeś puścić.
> *(dziadek siada na brzegu posłania, rozkłada list, czyta. Długa cisza; trzask ognia w palenisku)*
> **Dziadek Stach:** ...Moja córka. Pisze, że twój ojciec przepadł pod... A ona poszła go szukać. Że przypłynie następnym promem.
> **\N[1]:** Obiecała.
> **Dziadek Stach:** To przypłynie. Twoja matka zawsze była uparta. Po mnie.
> *(dziadek składa list i chowa go za pazuchę; patrzy w ogień)*
> **Dziadek Stach:** A ja ci tu, wnuku, mam tylko... dług.
> **\N[1]:** Dług?
> **Dziadek Stach:** Jestem winien Lordowi Zaleskiemu — temu z pięknego dworu obok tawerny — **2500** złotych monet. Termin: dzień **60**.
> **\N[1]:** Dwa i pół tysiąca?! Coś ty kupił, dziadku, krowę ze złota?
> **Dziadek Stach:** Nasiona, narzędzia, dach po burzy... i parę chudych lat. Jak nie oddam w terminie, Lord zabierze moje pole za lasem. A to wszystko, co mamy. Teraz: co *my* mamy.
> **Dziadek Stach:** Ja już za stary na siekierę, ale ty masz ręce i głowę. Pole jest twoje — stawiaj na nim, co zechcesz. Tylko tam: reszta ziemi w okolicy jest cudza.
> **Dziadek Stach:** Droga: z podwórza na południe, leśną drogą do Polnej, stamtąd na południe na skraj lasu i dalej na zachód.
> **Dziadek Stach:** A pieniądze... Borgar z tawerny „Pod Złotym Kuflem” szuka rąk do pracy, po południu i wieczorem. Z Polnej drogi ścieżką na północ. Dwór Lorda jest tuż obok — tam zanosisz spłatę.
> **\N[1]:** Czyli rano pole, wieczorem kufle. A spać kiedy?
> **Dziadek Stach:** Na starość. Jak ja. I jak się wykurujesz, a nie od razu, gorączko jedna.
> **Dziadek Stach:** Masz tu kapuśniak — z mojej kapusty. Wisiorek trzymaj przy sobie. Kruk w tej rodzinie... no, to długa historia. Opowiem ci kiedyś. No, zmykaj!

Uwagi do rozmowy:
- **„Wisiorek z krukiem”** to rodzinna pamiątka. Dziadek coś o nim wie, ale milknie, co daje haczyk pod Zakon i Kruczą Twierdzę na później. Wisiorek mógłby być nowym przedmiotem kluczowym (np. „Wisiorek z krukiem”, bez działania na start).
- **„Mokry list”:** po rozmowie trafia do dziennika (Notatki): „List od matki: przypłynie następnym promem.” To pierwszy otwarty wątek.
- **Pierwsza linia obecnej rozmowy** („No, nareszcie wstałeś!...”) znika. Reszta jest ta sama, z dopiskami w nawiasach.

## Co jest potrzebne do wdrożenia (do wyceny po zatwierdzeniu)

1. `Prologue.js` z Scene_Prologue: plansze, warstwy efektów, kamera, dymki i popiersia (SpeechBubbles), pasy, pomijanie, dźwięki.
2. Ekran imienia (część tej samej wtyczki albo osobny plik).
3. **Grafika** (część gotowa w `tools/prolog/art/`):
   - 5 plansz z PixelLab jest już zrobionych.
   - W chacie chłopiec ma już całą koszulę (poprawka PixelLab na wycinku). Buty domalowałem ręcznie i są na razie tylko szkicem, a na spodniach zostały łaty.
   - W porcie chłopiec jest jeszcze bosy i w łachmanach. Obie sceny warto przemalować przed wdrożeniem.
   - Popiersie bohatera to dzisiejsze, biedne. Na lądzie można by użyć czystszej wersji.
   - **Animowane drobiazgi:** chorągiew, kruk rozkładający skrzydła, chłopiec na plaży (leży, podnosi list, wstaje, idzie, pada), fala.
   - **Popiersie matki** w stylu popiersi w grze. Na klatce stoi tymczasowo `Ludmila_Bust`. Potrzebne nowe `Matka_Bust` (kit.py, chusta na głowie).
   - **Przemytnik:** popiersie dopiero na przystań wyspy.
   - **Wisiorek z krukiem:** ikona przedmiotu.
4. **Story.js:** nowa `introList`. Do tego `Story.startIntro` po prologu zamiast na starcie nowej gry, wisiorek do plecaka i notatka z listu do dziennika.
5. **TitleScreen.js:** „Nowa gra” prowadzi do ekranu imienia i prologu.
6. **Testy:**
   - prolog się zaczyna, da się go pominąć w całości i scenami, a imię się zapisuje;
   - po prologu stan jest taki jak dziś po starcie (`t.newGame` z `story` dalej omija prolog, tak jak omija ekran tytułowy).

## Pytania do decyzji

1. **Imię:** czy ekran imienia ma być przed filmem (moja propozycja: matka i dziadek mówią imieniem), czy po nim?
2. **Rybak:** czy ma na imię **Janek**? Czy ma się później pojawić na przystani razem z przemytnikiem?
3. **Obca armia:** czy „czarne tabardy z białym okiem” pasują? Jak się nazywają: np. „Zakon Oka”, „Wszechwidzący”, „Straż Pewności”?
4. **Wieś bohatera:** nazwa roboczo „Brzozowa Wola”. Czy w ogóle ma być pokazana z nazwy?
5. **Wisiorek:** czy ma być przedmiotem w plecaku od startu (bez działania), i czy dziadek ma rzucić tę zagadkową uwagę o kruku?
6. **Muzyka:** czy wystarczą pliki RTP z `audio/` (Theme5, Scene4, Ship3, Scene1), czy prolog ma mieć własny utwór?
7. **Wołacz:** czy ekran imienia ma mieć wiersz „Wołają cię: …” (osobny kod w tekstach), czy wystarczy imię w mianowniku, jak mówi się potocznie?
8. **Pierwsze pominięcie:** czy przy pierwszej grze pomijanie całości ma być możliwe od razu, czy dopiero po kilku sekundach (żeby nikt nie przewinął przypadkiem)?

---

## Wdrożone (2026-10-12)

**Wtyczka `js/plugins/Prologue.js`** jest wpisana w `js/plugins.js` pod TitleScreen; edytor był zamknięty, sprawdzone tasklistem. Zawiera:
- `Scene_HeroName`: ekran imienia;
- `Scene_Prologue`: film;
- podmianę „Nowej gry” na ekranie tytułowym.

Testy (`t.newGame`) i wczytane zapisy omijają prolog.

### Ekran imienia
- Kursor startuje w polu, więc od razu pisze się z klawiatury (wszystkie litery, także W/A/S/D/O/P i ą ć ę ł ń ó ś ź ż).
- ↓ albo Tab przenosi do liter na ekranie. Tam działa W/S/A/D, O wpisuje literę, P cofa.
- Litery na ekranie: 32 polskie litery i myślnik, w trzech rzędach. Przycisk „Aa” przełącza wielkość liter; po pierwszej literze sam przechodzi na małe.
- Przyciski: Spacja, Cofnij, Losuj, Gotowe.
- Enter to Gotowe. Backspace, Esc albo P cofa literę, a przy pustym polu wraca do tytułu. Działa też mysz.
- Imię trafia do aktora 1; puste pole daje „Reid”.

### Film
- **Plansze:** `img/pictures/Prolog_*.png`. Buduje je `tools/prolog/plansze.py` z grafik PixelLab w `tools/prolog/art/`.
- **Ruch:**
  - popiół i iskry;
  - migoczące ogniska, latarnie i świeca;
  - deszcz (lekki w porcie, ulewa w sztormie);
  - błyskawice z opóźnionym grzmotem i krakaniem;
  - kołysanie pokładu;
  - wielka fala (biel, potem czerń);
  - mgła płynąca nad plażą i świt rozjaśniający kadr;
  - powiewające chorągwie Straży (wieś, port) i chłopiec na plaży, który wstaje, idzie i pada (2026-10-14, niżej);
  - powolny najazd kamery w każdej scenie, zawsze w granicach planszy.
- **Rozmowa w chacie:** popiersia jak w grze: matka (`Matka_Bust`) z lewej, bohater z prawej, przygaszony, gdy nie mówi. W pozostałych scenach są dymki nad głowami i myśli.
- **Dźwięk:** według tabeli wyżej. Pod BGS gra druga pętla (tłum, deszcz, fale, wiatr) na osobnym buforze.
- **Pomijanie:** O, Enter albo klik to następna kwestia; krótko P, Esc albo prawy klik to następna scena; przytrzymanie P (72 klatki) pomija wszystko.

### Grafika
- **Chata:** chłopiec w całym ubraniu i w butach (poprawka PixelLab inpaint).
- **Port:** chłopiec w całej koszuli i w butach (też inpaint).
- **Popiersie matki:** `img/pictures/Matka_Bust.png`, robi je `tools/busts/make_matka.py`, w stylu pozostałych popiersi. Beżowa chusta, kasztanowe włosy, brązowa suknia, jak na planszach.
- **Ikona wisiorka:** pole 437 w `IconSet.png`.

### Animacje dodane 2026-10-14
**Chłopiec na plaży** to osobna warstwa nad planszą (i nad mgłą). Planszę bez chłopca zamalował PixelLab inpaint, a skrypt wyrównał odcień łaty z piaskiem wokół, więc nie widać jej brzegu.
- Arkusz `img/pictures/Prolog_Plaza_Chlopiec.png`: 30 klatek po 256 × 192, w grze powiększonych ×2 jak plansze. Klatki zrobił PixelLab `animate_with_skeleton_v3` z jednej postaci (bosy chłopiec w podartej koszuli i spodniach). Każdą pozę ustawiał szkielet: wstawanie 13 klatek, chód 8, upadek 9.
- Klatki są ułożone tak, że stojący chłopiec (biodra) wypada w każdej serii w tym samym miejscu. Dlatego przejścia nie skaczą.
- **Przebieg:**
  - leży i co jakiś czas unosi głowę; myśli lecą w dymku nad jego głową;
  - z trudem wstaje: podpiera się na łokciach, klęka na czworakach, przyklęka, prostuje się;
  - idzie chwiejnie kilka kroków w stronę ścieżki, staje i kołysze się (myśl o dziadku), idzie dalej;
  - pada: kolana, ręce, twarz w piasek. Do tego kurz i ziarnka piasku oraz `Down1`;
  - potem ściemnienie i głosy rybaka, jak wcześniej.
- Chłopiec idzie z prędkością swoich kroków: szybciej, gdy noga przechodzi, prawie stoi, gdy obie stopy są na ziemi. Kamera najeżdża tak, żeby stopy nie chowały się pod pasem kadru.

**Chorągwie Straży Pewności** są wycięte z plansz jako osobne warstwy, a ich miejsce zamalował PixelLab inpaint:
- we wsi: `Prolog_Wies_Flaga.png`, wisi na poprzeczce;
- w porcie: `Prolog_Port_Flaga.png`, na maszcie statku.

Każda leży na siatce PIXI (`SimplePlane`), która się wygina:
- przy drzewcu (poprzeczka, maszt) stoi w miejscu, a im dalej, tym mocniej się rusza;
- wiatr wzmaga się i słabnie płynnie, bez szarpnięć;
- chorągiew we wsi łapie migoczący blask ognia;
- brzegi wycięcia są wygładzone, więc nie widać krawędzi.

**Narzędzia:**
- `tools/prolog/plansze.py`: łaty, warstwy chorągwi, arkusz chłopca;
- `tools/prolog/animacje.js`: klatki z gry, liczone krok po kroku;
- `tools/prolog/gify.py`: GIF-y.

**Zrzuty i GIF-y:**
- `choragiew.gif`, `choragiew_port.gif`, `choragiew_wies.png`, `choragiew_port.png`;
- `plaza_upadek.gif`, `plaza_1_lezy.png` … `plaza_4_upadek.png`;
- `chlopiec_klatki.png`: wszystkie klatki chłopca.

### Story.js
- Nowa rozmowa dziadka: 17 kwestii, z dwiema pauzami (`C(230)`).
- Imię przez `\N[1]`. Dzielenie tekstu na linie mierzy już prawdziwe imię, a nie sam kod.
- Wisiorek (id 172) trafia do plecaka, gdy fabuła naprawdę startuje w domu dziadka.
- Notatka „List od matki” w dzienniku.

### Testy i zrzuty
- **Testy:**
  - `tests/prologue_test.js` (od 2026-10-14 sprawdza też, że chorągwie się wyginają, a chłopiec zmienia klatki i przechodzi plażę);
  - `title_test`: „Nowa gra” prowadzi teraz do ekranu imienia;
  - `story_test`: liczba kwestii nowej rozmowy.
- **Zrzuty z gry:** `w_grze_1_imie.png` … `w_grze_8_dziadek.png`, `w_grze_zestawienie.png`, `w_grze_sztorm.gif`. Robi je `tools/prolog/w_grze.js`.
