# Życie w tawernie „Pod Złotym Kuflem” — usługi i zabawy

Wtyczka: `js/plugins/TavernLife.js` (v1.1.0). Usługi Borgara, łaźnia, pieśni Melii, siłowanie na rękę
z Grumem, rzutki i plan karczmy. Ceny, godziny i premie są w parametrach wtyczki.

Zrzuty ekranu (z testu `tests/tavern_life_test.js`, na starej sali Map001 z miejscami dodanymi na czas testu):
`uslugi_1_karta_dan.png`, `uslugi_2_posilek_przy_stole.png`, `uslugi_3_pokoje.png`, `uslugi_4_pokoj_swieca.png`,
`uslugi_5_laznia.png`, `uslugi_6_piesn_melii.png`, `uslugi_7_silowanie.png`, `uslugi_8_silowanie_wygrana.png`,
`uslugi_9_rzutki.png`, `uslugi_10_rzutki_wynik.png`, `uslugi_11_pokoje_slawa.png`, `uslugi_12_apartament_sniadanie.png`.

---

## Premie (nowe, w HUD-zie pod paskami, z własnymi ikonkami)

| Premia | Skąd | Na ile | Co daje |
|---|---|---|---|
| **Czysty** | kąpiel w łaźni | 6 godz. | każda praca kosztuje **10% mniej sił** |
| **Natchniony** | pieśń Melii | 4 godz. (z napiwkiem 6) | **+10% doświadczenia** z każdego źródła |
| **Ugoszczony** | posiłek lub napój w karczmie | 2–7 godz. (zależnie od dania) | **głód i pragnienie rosną o 30% wolniej** |
| **Wypoczęty** | noc w Komnacie z kominkiem / w Apartamencie Złotym | 8 / 12 godz. | **odpoczynek daje 25% więcej sił** (na trawie, ławce, przy ogniu) |

Premie działają obok jedzenia (Najedzony, Rozgrzany) i widać je w HUD-zie, w menu (P) i w opisach na karcie dań.

---

## 1. Posiłek u Borgara

Przy ladzie (albo w menu Borgara w grze z fabułą) — **„Zjedz coś”** otwiera **Kartę dań**: lista po lewej,
po prawej obrazek dania na talerzu, opis i to, co daje. Za drogie pozycje są przygaszone.

| Danie | Cena | Wytrzymałość | Sytość | Nawodnienie | Premie | Czas |
|---|---|---|---|---|---|---|
| Gulasz | 16 G | +65 | +62 | +14 | Najedzony 7 h, Rozgrzany 4 h, Ugoszczony 6 h | 30 min |
| Kapuśniak | 12 G | +50 | +48 | +26 | Najedzony 5 h, Rozgrzany 3 h, Ugoszczony 6 h | 30 min |
| Pieczeń z kaszą | 18 G | +70 | +70 | +4 | Najedzony 8 h, Ugoszczony 7 h | 30 min |
| Placek z serem | 9 G | +36 | +32 | +4 | Najedzony 3 h, Ugoszczony 4 h | 20 min |
| Chleb ze smalcem | 5 G | +26 | +28 | 0 | Najedzony 2 h, Ugoszczony 3 h | 15 min |
| Kufel piwa | 4 G | +12 | +5 | +10 | Rozgrzany 2 h, Ugoszczony 2 h | 15 min |
| Miód pitny | 8 G | +16 | +6 | +18 | Rozgrzany 4 h, Ugoszczony 3 h | 15 min |

Gulasz, kapuśniak, piwo i miód biorą wartości z jednej tabeli jedzenia gry (`FoodTable`); pieczeń, placek
i chleb ze smalcem są tylko w karczmie (ikonki: `img/system/Tav_Dishes.png`).

**Danie dnia**: każdego dnia jedno z dań (nie napój) jest **o 30% tańsze** — Borgar mówi o nim na powitanie,
na karcie ma żółtą plakietkę i przekreśloną starą cenę.

Jak to wygląda: płacisz (monety lecą do Borgara), bohater sam podchodzi do **wolnego stołu** i siada,
talerz staje na stole (gorące dania parują), mija pół godziny gry, jedzenie ubywa z talerza, bohater
rzuca coś w dymku („Łyżka naprawdę w nim stoi…”), potem wstaje. Gdy stoły są zajęte albo mapa ich nie
ma — zje przy ladzie. Za pierwszym razem: notatka „Karczma Borgara” w dzienniku i +10 dośw.

## 2. Pokój na noc

**„Wynajmij pokój”** otwiera kartę pokoi (obrazek pokoju, opis, śniadanie). Pokoje i ceny biorą się ze
znaczników łóżek na mapach pięter (domyślnie: 1 — 8 G, 2 — 15 G, 3 — 20 G; Komnata z kominkiem — 30 G od
sławy „Pewna ręka”; Apartament Złoty — 50 G od sławy „Chluba tawerny”, patrz niżej).

- Płacisz za **jedną noc**: pokój jest twój do **10:00 następnego ranka** (wynajęty po północy — do 10:00 tego ranka).
- **Drzwi pokoju** otwierają się (przełącznik własny A drzwi), w pokoju **pali się świeca**.
- **Łóżko**: „Położyć się spać?” → sen do 7:00, **pełna wytrzymałość i zdrowie**, **bezpiecznie** (żadnych
  wilków, bez względu na noc), dzień się podsumowuje i gra się zapisuje jak po każdym śnie.
- **Śniadanie** przy łóżku: pokój 1 — pajda chleba, pokój 2 — pajda chleba i kubek mleka, pokój 3 — pajda
  chleba i kawałek sera („Borgar zostawił ci pajdę chleba”).
- Raz na noc. Cudze łóżko: „To nie twój pokój”. Rano, po 10:00, drzwi zamykają się same — ale nigdy
  z bohaterem w środku (czekają, aż wyjdzie).

## Sława w tawernie (QuestBoard.js)

Sława z tablicy zleceń („Sława w tawernie”, 0–100) daje przywileje u Borgara. Bez QuestBoard.js sława wynosi 0
(żadnych przywilejów, wszystko inne działa).

| Próg | Sława | U Borgara (jedzenie, pokoje, łaźnia — nie zmiana w pracy) | Do tego |
|---|---|---|---|
| Nowy w okolicy | 0 | — | — |
| Znajoma twarz | 20 | — | — |
| Swój chłop | 40 | **−5%** | — |
| Pewna ręka | 60 | **−10%** | **Komnata z kominkiem** do wynajęcia (30 G) |
| Chluba tawerny | 80 | **−15%** | **złocona krata Apartamentów** otwiera się na dobre, **Apartament Złoty** (50 G) |

- Na kartach (dania, pokoje) stara cena jest przekreślona, obok nowa; stopka mówi, skąd zniżka.
  Łaźnia: „Wykąp się (5 G zamiast 6 G)”. Zniżka dnia i zniżka za sławę mnożą się ze sobą.
- Borgar mówi o zniżce raz dla każdego progu, przy najbliższej rozmowie o jedzeniu albo pokoju
  („Swój chłop z ciebie! Od dziś liczę ci wszystko 5% taniej…”).
- **Komnata z kominkiem** (`<Tavern:bed room=komnata price=30 minrep=60 ...>`, drzwi `<Tavern:door room=komnata>`):
  poniżej progu na drzwiach tabliczka „Komnatę wynajmujemy tylko stałym, zaufanym gościom.”, a na karcie
  pokoi jest przygaszona z wymaganym progiem. Noc w niej: pełny sen, chleb i ser, rano **Wypoczęty 8 godz.**
- **Apartamenty** (piętro, Map026): złocona krata z dzwonkiem (`<Tavern:gate minrep=80>`). Poniżej progu:
  „Apartamenty tylko dla dostojnych gości.” Po osiągnięciu progu krata otwiera się sama (przełącznik
  własny A) i zostaje otwarta; za pierwszym razem dzwonek, „Dzyń, dzyń! Witamy w Apartamentach,
  szanowny gościu!”, napis u góry ekranu i notatka w dzienniku.
- **Apartament Złoty** (`<Tavern:bed room=zloty price=50 minrep=80 ...>`, drzwi `<Tavern:door room=zloty>`):
  rano **śniadanie do łóżka** — pokojówka wnosi srebrną tacę (jajecznica, świeży chleb, kubek mleka; taca
  leży na kołdrze), sytość +45, nawodnienie +25, Ugoszczony 6 godz., liścik „Dla Chluby tawerny - na koszt
  domu. Borgar”, i **Wypoczęty 12 godz.**

## 3. Łaźnia

Przy balii łaziebna (Wanda) proponuje kąpiel: **6 G**. Ekran na chwilę gaśnie, bohater siedzi w wodzie po
ramiona, para bucha, bąbelki, plusk; mija **godzina** gry. Potem wychodzi ociekając wodą i jest **Czysty**
(6 godz., prace o 10% tańsze). Łaziebna rzuca coś zabawnego, np.:

- „No, teraz przynajmniej konie się nie płoszą, jak przechodzisz.”
- „Woda była gorąca, a teraz jest... brązowa. Ale ty lśnisz!”
- „Takiego brudu nie widziałam od czasu, jak kąpał się tu Grum. A Grum kąpie się raz do roku. W porywach.”

## 4. Pieśń Melii

Wieczorem (**od 18:00 do północy**), **raz na wieczór**, przed sceną. Wybór: wrzucić **2 G** do kapelusza
(Natchniony 6 h i dodatkowy refren), posłuchać za darmo (4 h) albo odejść. Na początek krótki motyw
(ME „Musical1”), pod słowami gra spokojna melodia (BGM „Scene2” — parametr „Pieśń Melii: melodia”), nad
Melią unoszą się nuty; na koniec oklaski i powrót muzyki sali. Bez pieniędzy na napiwek Melia i tak zaśpiewa. Słowa każdej nowej
ballady trafiają do notatki „Pieśni Melii” w dzienniku. Sześć ballad po kolei (najpierw te niesłyszane),
każda z okruchem prawdy o Kruczych Skałach — Melia sama nie wie, skąd je zna:

**Czarny kruku**
> Hej, kruku, czarny kruku, / co krążysz nad naszym dachem? /
> — Pamiętam mury ze skały / i straż, co nie znała strachu. /
> Nie złota strzegli ni ziemi, / ni króla, ani korony — /
> lecz tego, co w sercu skały / śpi dotąd, niezbudzone.

**Jedno pytanie**
> Raz do roku, w zimną noc, / strażnik schodził, gdzie śpi moc. /
> Jedno pytanie w dłoni niósł — / więcej żaden by nie zniósł. /
> Wracał blady, cichy, siwy, / choć był młody, choć był żywy. /
> Prawda, synku, to nie miód: / raz do roku — i to cud.

**Strażnik, co pytał za wiele**
> Był strażnik, co kochał żonę / i bał się — jak każdy z nas. /
> Zszedł w dół, choć nie był to jego / ni rok, ani dzień, ni czas. /
> Pytał o żonę, o brata, / o mury — czy przetrwają wiek? /
> A Skała mu odpowiedziała. / I nie wrócił ten sam człek.

**Drzwi pod skałą**
> Pod kuflem deska, pod deską próg, / pod progiem schody — kto by to mógł? /
> A na dole drzwi z kamienia, / zamknięte na klucz milczenia. /
> Kto tam zapuka, ten usłyszy / to, czego nie chciał — w wielkiej ciszy. /
> Więc pij, wędrowcze, śpiewaj z nami / i nie pytaj, co pod kamieniami.

**Ostatni kasztelan**
> Gdy mury legły w pył i w proch, / ostatni kasztelan zamknął loch. /
> Klucz zakopał, zatarł ślad / i puścił plotkę w cały świat: /
> „Przeklęte gruzy, zły to gród — / nie kop, bo zginiesz ty i twój ród!” /
> Wieki minęły. Kto dziś wie, / na czym ten Złoty Kufel śpi?

**O chłopcu z piwnicy**
> Był raz chłopiec, psotnik mały, / co wpadł w piwnicę pod Kruczą Skałą. /
> Wrócił nad ranem, brudny, chudy, / i gadał rzeczy — same cudy! /
> Wiedział, kto kłamie, kto kradnie z sadu, / i dzień, gdy spadnie deszcz pełen gradu. /
> Dziś pije piwo, gada do ściany — / a wszyscy myślą, że jest pijany.

Tropy (bez nowego kanonu, zgodnie z `docs/STORY.md`): twierdza strzegła czegoś w „sercu skały”, zakon
dawał jedno pytanie na rok, strażnik, który pytał za wiele, drzwi pod tawerną, ostatni kasztelan (przodek
Borgara) i rozpuszczona plotka o przeklętych ruinach, chłopiec z piwnicy (Ozzy). Po wszystkich sześciu: +40 dośw.

## 5. Siłowanie na rękę z Grumem

Przy stole do siłowania Grum pyta o stawkę: **5, 10 albo 20 G**. Osobny ekran: bohater i Grum nad stołem,
duże splecione przedramiona, u góry **tarcza SIŁY**.

- Wskazówkę trzeba trzymać w **zielonym polu**: **przytrzymaj O**, żeby rosła, puść, żeby opadała — albo **stukaj O**.
- W zielonym polu twoja ręka zyskuje (ramiona przechylają się na stronę Gruma), poza nim — Grum.
- Pole wędruje, a Grum co chwilę **szarpie** („Hrrraaah!”): wskazówka leci w dół, pole skacze w bok.
- **Trzy rundy**, kto pierwszy wygra dwie — bierze stawkę. Ręka przegranego uderza w stół.
- **Siła** poszerza zielone pole, **Kondycja** łagodzi szarpnięcia.
- Po każdej swojej przegranej **Grum przykłada się mocniej** (szybsze pole, silniejsze szarpnięcia; 6 stopni).
- Koszt: 15 minut gry, −6 wytrzymałości. Wygrana +15 dośw., przegrana +4. Poniżej 15 wytrzymałości Grum odmawia.
- P — pauza (można się poddać: stawka przepada). Grum dogaduje przez całą walkę (drwiny, szacunek).

## 6. Rzutki

Przy linii rzutu: wybór przeciwnika (**Dziadek Ozzy** — gdy jest w sali — albo **furman Wiesiek**) i stawki
**5, 10 albo 15 G**. Osobny ekran: malowana tarcza na deskach ściany, kredowa tablica wyników.

- Celownik **sam się chwieje**; **strzałki** przesuwają cel, **O** rzuca. Lotka leci łukiem, wbija się
  z głuchym stuknięciem i drga.
- Punkty: **byk (środek) 50**, zielony pierścień **25**, reszta tarczy — **liczba wycinka (1–20)**; poza tarczą: pudło.
- **Trzy rundy po trzy lotki** na zmianę; wygrywa większa suma (remis: rozstrzyga lotka bliżej środka).
- **Zręczność** i **Czujność** zmniejszają chwianie celownika.
- Ozzy: rozchwiany, ale czasem ma szczęście („Byk! Widziałeś? Nikt nie widział...”); Wiesiek: pewniejsza ręka, celuje w 20.
- Koszt: 30 minut gry. Wygrana +10 dośw., przegrana +3.

---

## 7. Plan karczmy

„Gdzie jest jaki pokój”: przy wejściu stoi **sztaluga z oprawionym planem** i czerwonym szyldem „PLAN KARCZMY”
(w sieni Map001, pod latarnią i obrazem, na prawo od wejścia — lustrzane miejsce tablicy zleceń zajmuje kominek).
Mniejsze sztalugi „PLAN” stoją przy schodach pięter: w hallu Map025 (naprzeciw księgi gości) i na szczycie schodów
Map026. **O przed sztalugą** — albo **„Plan karczmy” w menu P**, gdy bohater jest w karczmie — otwiera plan.

Plan to trzy arkusze pergaminu narysowane z prawdziwych map (ściany tuszem, pokoje podmalowane: **miodowe — dla
gości**, **szałwiowe — zaplecze**, **różowe — prywatne**, drzwi z łukiem skrzydła, schody ze strzałką, meble
bladym tuszem, kartusz „Karczma «Pod Złotym Kuflem»”, róża wiatrów, podziałka w krokach).

- **Tu jesteś** — pulsująca czerwona kropka tam, gdzie stoi bohater; zakładka jego piętra ma czerwoną kropkę.
- **Usługi na planie** (medaliony): bar (Borgar), kuchnia, tablica zleceń, kości, siłowanie, rzutki, łaźnia, scena
  Melii, schody, kominki, pokoje na noc (klucz — do wynajęcia, kłódka — potrzebna sława), złocona krata.
  **Jasne = czynne teraz, przygaszone = zamknięte** — według prawdziwych godzin z wtyczek: scena 18–24 (i nie po
  dzisiejszej pieśni), kości wtedy, gdy ktoś siedzi przy stole (Ozzy 10–23, Bartek 14–21, Grum 17–24, kupiec i
  Nieznajomy według sławy), komnata od sławy 60, krata i Apartament Złoty od 80.
- **Strzałki** — kursor po pokojach (apartament = salonik + sypialnia razem); obok karta pokoju: co tu jest,
  kto i kiedy (np. „Melia Srebrogłosa — śpiewa 18:00–24:00”, „Zmiany u Borgara 16:00–21:00”, gracze w kości),
  ceny (danie dnia, pokoje, łaźnia, stawki) i czy **teraz** jest otwarte. Na dole legenda ikon.
- **Q / E** (albo strzałka w górę na zakładki i **← →**) — piętra: Parter, Pokoje gości, Apartamenty.
- **O** — **droga**: czerwone kropki od „Tu jesteś” do wybranego pokoju; pokój na innym piętrze — droga do schodów,
  a na kolejnych piętrach od podestu schodów (Q/E pokazuje dalszy ciąg). O jeszcze raz — bez drogi.
- **P** — wyjście (z menu P wraca do menu). Mysz: najechanie wybiera pokój, klik w zakładkę zmienia piętro.
- Bez QuestBoard.js plan nie mówi o sławie (komnata i Apartamenty zamknięte), bez fabuły nie ma zmian u Borgara.
- **Tajemnice zostają tajemnicami**: stara izba za składem to na planie zwykła „Komórka”, nie ma na nim luźnej cegły
  ani przejścia do piwnicy (dane planu nie znają tego wyjścia).

Obrazy: `img/pictures/TavernPlan_0.png` (parter), `_1` (pokoje gości), `_2` (apartamenty), `TavernPlan_Back.png`
(stół i karta), `img/characters/!$Tavern_Plan.png` (sztaluga 2×2 kratki), `!$Tavern_Plan_Small.png` (1×2; kierunek 2
— piętro I, 4 — piętro II). Generatory: `python tools/tavern/plan/make_plan.py` (plany z map + blok danych planu w
TavernLife.js między `// <plan-data>` a `// </plan-data>`), potem `python tools/tavern/plan/make_board.py` (sztalugi
z miniaturami planów). Po zmianie map w edytorze: oba polecenia jeszcze raz — pokoje i ściany biorą się z map
(nazwy z tabel budowniczych `parter_layout.py` / `upperlib.py`, sprawdzane z podłogą map).

Sztalugi to zdarzenie **950** dopisywane do danych map przy wczytaniu (bez zmian w `data/`), tylko gdy mapa ma
swój rozmiar i komórki są wolne; w starym zapisie na tych mapach sztaluga pojawia się sama.

Zrzuty: `docs/tawerna_nowa/plan_karczmy_tablica.png` (sztaluga w sieni, zoom 1.5),
`plan_karczmy_tablica_pietro1.png`, `plan_karczmy_tablica_pietro2.png`, `plan_karczmy_parter.png`,
`plan_karczmy_pokoje_goscie.png`, `plan_karczmy_apartamenty.png` (droga do Apartamentu Złotego),
`plan_karczmy_pokoj_gier.png`, `plan_karczmy_droga.png`, `plan_karczmy_scena_w_poludnie.png`, `plan_karczmy_menu.png`.
Test: `CDP_PORT=9386 node tests/tavern_plan_test.js`.

## 8. Stali bywalcy - rozmowy (2026-10-06, `TavernLife_Regulars.js`)

Melia, Dziadek Ozzy i Grum rozmawiają jak ludzie, nie jednym zdaniem. **O przy nich**: najpierw sprawy zadań z miasteczka
(oferta z „!”, oddanie z ptaszkiem, przypomnienie, uwaga po tym, co się stało), potem powitanie (inne rano, inne nocą,
inne dla obcego i dla przyjaciela) i menu:

| Kto | Tematy |
|---|---|
| Melia | Co słychać? · Jakieś plotki? · Opowiedz o swoich pieśniach (ile słyszałeś, czego brakuje) · Skąd znasz te ballady? (zaufanie 35; przy 60 opowie sen) · Zaśpiewasz dziś? (wieczorem, prowadzi do pieśni) · Bywaj |
| Dziadek Ozzy | Co słychać, dziadku? · Jakieś plotki? · Postaw mu piwo (3 G) - raz dziennie „wizja”: pogoda na jutro wprost z planu pogody, czasem jeszcze jedna prawda · Opowiedz o piwnicy (35) · Bywaj. Nocą (23–6) śpi na ławie i tylko mruczy |
| Grum | Co słychać? · Jakieś plotki? · Opowiedz o wojnie · Skąd jesteś? (15) · Zagrajmy w coś (siłowanie albo kości) · Bywaj |

„Co słychać?” zależy od pory dnia, deszczu, burzy, śniegu, suszy (6+ dni) i długu dziadka; „Plotki” biorą się z tego, co się
naprawdę dzieje (Kuba i jego woda, młyn, Feliks, targ jutro, prom, namioty pod murem, wilki pod bramą, sława z tablicy),
każda raz - potem stare opowieści po kolei. Kiedy bohater przechodzi obok, rzucają słowo (Melia nuci, Ozzy czka, Grum mruczy).

**Zaufanie** (0–100: Obcy, Znajomy 15, Kompan 35, Przyjaciel 60, Powiernik 85): pierwsza rozmowa w danym dniu, piwo dla
Ozzy'ego, wysłuchana pieśń i napiwek dla Melii, gra z Grumem albo Ozzym - każde raz dziennie i tylko do pewnej granicy
(30-50); resztę dają zadania. Dziennik: Miasteczko - „Stali bywalcy tawerny”.

Zadania od nich (szczegóły: `docs/QUESTY_STAN.md`): **Struna dla Melii** (K22), **Czapka Ozzy'ego** (K33), **Zakład Ozzy'ego**
(D13), wątek **Pieśń o Kruczych Skałach** (W3 - siódma ballada) i pierwszy rozdział **Żelaznej Pięści** (W8, po wygranej z
Grumem na rękę i w kości). Melia może też zaśpiewać Eli pod murem (K27) - tego wieczoru scena jest pusta. Turniej siłowania (D6) jest wieczorem w dzień targowy przy tym samym stole (decyzja autora: siłowanie tylko w tawernie) - zapis
u Borgara; ta sama mini-gra z innymi rywalami (`rival` w `armWrestle`). Przy barze Borgar ma tematy od zadań (zapis na turniej, stare
kamienie pod tawerną - W4).

Zrzuty: `docs/tawerna_zycie/k33_czapka_na_posagu.png`, `w3_noc_kupaly.png`. Testy: `tests/regulars_test.js`,
`tests/regulars_quests_test.js` (port 9463).

---

## Znaczniki na mapach (dla budujących mapy)

Komentarz na stronie zdarzenia (albo w notatce):

| Znacznik | Gdzie |
|---|---|
| `<Tavern:meal>` | lada przed Borgarem (Zjedz coś / Wynajmij pokój) |
| `<Tavern:mealtable>` | miejsce przy stole (krzesło); opcje: `dir=8` (w którą stronę siedzi), `plate=0,-1` (gdzie talerz, w kratkach), `lift=12` (o ile px wyżej siedzi) |
| `<Tavern:bath>` | balia; opcja `lift=34` (o ile px wyżej siedzi kąpiący się — głowa i ramiona nad wodą balii) |
| `<Tavern:stage>` | miejsce słuchania przed sceną Melii |
| `<Tavern:arm>` | stół do siłowania |
| `<Tavern:darts>` | linia rzutu |
| `<Tavern:bed room=N price=P name="...">` | łóżko (na poduszce) + notatka `<Occupy:down=1>`; opcjonalnie `desc="..."`, `candle=dx,dy`, `minrep=60` (sława potrzebna do wynajęcia); `room` może być liczbą albo słowem (`komnata`, `zloty`) |
| `<Tavern:door room=N>` | drzwi pokoju, **na obu stronach**; strona 2 z warunkiem „przełącznik własny A” = otwarte |
| `<Tavern:door room=suite>` | drzwi bez łóżka do wynajęcia — tylko własny tekst strony, wtyczka ich nie rusza |
| `<Tavern:gate minrep=80>` | złocona krata Apartamentów, na obu stronach; strona 2 („przełącznik własny A”) = otwarta |
| `<Tavern:candle room=N>` | (opcja) świeca w pokoju — bez niej świeca stoi na lichtarzu przy poduszce |
| `<Tavern:attendant>` | (opcja) łaziebna — bez niej mówi w zwykłym oknie z imieniem „Łaziebna Wanda” |
| `<Tavern:plan>` | plan karczmy (O otwiera plan); sztalugi na mapach 1, 25 i 26 wtyczka stawia sama |

Pokoje, drzwi i kratę czyta się z map z parametru „Mapy z pokojami gości” (domyślnie 25 i 26) przy starcie gry.

## Dla wtyczek i testów

`window.TavernLife`: `meal(id)`, `rentRoom(n)`, `bath()`, `song(napiwek)`, `sleep()`,
`armWrestle({ stake, seed, turbo, onEnd, level, rival })`, `darts({ stake, seed, turbo, onEnd, opponent })`,
`stats()` (to samo, co `$gameSystem._tavernLife`), `dishOfDay()`, `priceOf(danie)`, `rooms()`, `isRented(n)`,
`reputation()`, `repTier()`, `repDiscount()`, `roomPrice(pokój)`, `bathPrice()`, `gates()`,
`BUFFS`, `DISHES`, `SONGS`, `onTick` (boty mini-gier), `gameState()`,
stali bywalcy: `regular(interp)`, `regularOf(ev)`, `trust(rola)`, `addTrust(rola, n, powód)`, `trustTier(rola)`, `regularsInfo()`, `REGULARS`,
szyna: `tavernGame { game, won, stake, rival }` (koniec mini-gry), `songHeard { id, tipped }`, `regularTrust`,
`plan` = { `open({ floor })`, `state()`, `items(piętro)`, `info(piętro, pokój)`, `icons(piętro)`, `roomAt(piętro, x, y)`,
`point(piętro, x, y)`, `way(...)`, `select(pokój)`, `floor(i)`, `DATA`, `BOARDS`, `EVENT` }.

Test: `CDP_PORT=9384 node tests/tavern_life_test.js`.
