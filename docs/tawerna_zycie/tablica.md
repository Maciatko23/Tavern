# Tablica zleceń w tawernie „Pod Złotym Kuflem”

Wtyczka: `js/plugins/QuestBoard.js` (v1.0.0). Drugi, obok zmian u Borgara, sposób na zarobek
i spłatę długu dziadka: ludzie z okolicy wieszają na tablicy w sieni tawerny swoje prośby,
a bohater bierze je, wykonuje i oddaje przy tablicy za złoto, doświadczenie i sławę.

![Tablica](tablica_plansza.png)

## Gdzie wisi

- Na mapie tawerny stoi rekwizyt tablicy (stawia go budowniczy wnętrza). Wystarczy, że jego
  zdarzenie ma na **pierwszej stronie komentarz `<Tavern:board>`** (albo ten tag w notatce
  zdarzenia) – przycisk akcji przed nim otwiera tablicę. Treść strony nie ma znaczenia.
- Nad tablicą na mapie podskakuje mały znacznik: żółty „!”, gdy wiszą kartki, których jeszcze
  nie widziałeś, zielony ptaszek, gdy któreś zlecenie możesz już oddać.
- Z innego zdarzenia: polecenie wtyczki **„Otwórz tablicę zleceń”**, w skrypcie
  `QuestBoard.open()`.

## Jak to działa

1. Na tablicy wisi **4–6 kartek**. **Co 3 dni** (dni 1, 4, 7, …) Borgar wiesza nowe;
   stare, niewzięte kartki znikają, **przyjęte zostają**.
2. Kartkę otwierasz (O albo klik), a potem **„Przyjmij zlecenie”**. Na kartkę spada pieczątka
   **PRZYJĘTE**. Najwyżej **3 zlecenia naraz**.
3. Każde zlecenie ma **termin w dniach od przyjęcia** („do dnia 14”). Dzień przed końcem
   pojawia się ostrzeżenie; gdy termin minie – **PO TERMINIE**, sława −6 (pilne −8).
4. Gotowe zlecenie **oddajesz przy tablicy**: towar znika z plecaka, przedmioty „wlatują” w
   kartkę, spada pieczątka **WYKONANE**, monety lecą do sakiewki na tablicy kredowej, gwiazdki
   sławy się napełniają. Kartka wisi jako wykonana do następnej zmiany kartek.
5. Zlecenie można **porzucić** (sława −3, pilne −5) – kartka zostaje zerwana z tablicy.
6. Na mapie gra sama mówi (napis u góry ekranu): „Masz wszystko do zlecenia: …”, „Zlecenie
   gotowe: …” (po ostatnim upolowanym zwierzęciu), postęp polowania („Wilki upolowane 2/3”),
   „Dziś mija termin…”, „Zlecenie przepadło…” i „Na tablicy wiszą nowe ogłoszenia”.

Za pierwszym razem Borgar tłumaczy tablicę (dwie plansze z jego popiersiem). Później zasady
są na małej karteczce **„Zasady tablicy”** wiszącej na sznurku pod szyldem – tam też próg
następnej sławy i statystyki (wykonane, po terminie, porzucone, zarobione).

## Rodzaje zleceń

| Rodzaj | Co trzeba | Przykłady |
|---|---|---|
| **Dostawa** | przynieść towar z plecaka | skóry dla kuśnierza, mięso zająca dla Borgara, jajka, miód, mleko, wełna, pióra, jelenina dla dworu |
| **Zamówienie** | wyroby z budynków | deski, cegły, węgiel, żelazo, gwoździe, liny, strzały, gliniane garnki, chleb, piwo, ser, wędzonka, gulasz, miód pitny, opatrunki |
| **Zbieractwo** | to, co rośnie i leży | kamienie, chrust, szyszki, drewno, len, zioła, pokrzywa, krwawnik, czosnek, grzyby, jagody, dzikie jabłka, glina z kałuży, ruda |
| **Polowanie** | upolować zwierzęta (liczy się każde zabicie po przyjęciu) | wilki pod wsią, wataha na wskazanej mapie, zające w kapuście, dzik w ogrodach, jelenie w zbożu, „Wilcze futra” (wilki **i** ich skóry) |
| **POSZUKIWANY** | jedno nazwane, groźne zwierzę | Szary Kieł, Czarny Ryj, Trójłap (niżej) |
| **Ogłoszenie** | jednorazowe, fabularne | Borgar i piwnica, Ozzy i grzyby (niżej) |

Na tablicy nie pojawi się nic, czego nie da się zdobyć w tym momencie gry:

- rośliny i zioła tylko w swojej porze roku (jagody i len wiosna–jesień, zioła i czosnek
  wiosna–lato, krwawnik i jabłka lato–jesień, kapusta od jesieni, jęczmień latem),
- wyroby wymagające dalszych budynków dopiero od odpowiedniej sławy i dnia (chleb, piwo,
  mąka i placek od ok. 36–38 dnia, gdy jęczmień może już urosnąć; jajka od 10., mleko od 14.,
  wełna od 20.),
- **ryb nie ma wcale** – w świecie celowo nie ma wody (susza), więc nie da się ich złowić.

„Skóry wilka”: w grze wszystkie zwierzęta dają tę samą „Surową skórę”, dlatego zlecenie na
wilcze futra liczy **upolowane wilki** i dopiero wtedy przyjmuje tyle samo skór.

### POSZUKIWANY

List gończy z portretem zwierzęcia (rycina w brązowym tuszu). Po przyjęciu zwierzę pojawia
się **na swojej mapie, w swoich godzinach**, 11–16 kratek od bohatera, z napisem u góry
„W pobliżu grasuje …”. Jest większe, silniejsze (więcej życia, wyższy poziom), inaczej
zabarwione i ma **imię nad głową**. Liczy się tylko ono – nie inne wilki z watahy. Jeśli
ucieknie albo zejdziesz z mapy, wróci przy następnej okazji.

| Zwierzę | Gdzie, kiedy | Siła | Od progu | Nagroda |
|---|---|---|---|---|
| **Trójłap** (wilk, z kompanem) | Polna droga, nocą | życie ×1,8, +2 poziomy | Swój chłop | 90–105 G, 200–220 dośw., sława +10/+11, „Kość z gruszy” |
| **Czarny Ryj** (dzik) | Leśna droga, o świcie i o zmierzchu | życie ×2,2, +3 poziomy | Pewna ręka | 105–120 G, 220–240 dośw., sława +11/+12, „Kość wdowy” |
| **Szary Kieł** (wilk, przewodnik watahy) | Skraj lasu, nocą | życie ×2,4, +3 poziomy | Pewna ręka | 105–120 G, 220–240 dośw., sława +11/+12, „Kość szczęściarza” (Gruma) |

Kości to kości specjalne z wtyczki kości (`TavernDice.giveDie`); bez tej wtyczki nagroda jest
bez kości. Najwyższy próg sławy czasem (15%) daje też rzadką „Kość z Kruczych Skał”.

### Ogłoszenia fabularne

- **Feliks, kamerdyner dworu Zaleskich** (zamówienia z pieczęcią dworu: deski na stajnię –
  „Dworowi potrzeba desek”, 16–26 sztuk –, cegły na oranżerię, dziczyzna, pióra do ksiąg,
  miód pitny na imieniny, ser, polowanie na jelenia). Dopóki dług dziadka nie jest spłacony,
  Feliks może **zaliczyć zapłatę od razu na poczet długu** – przy oddawaniu jest wtedy
  przycisk „Oddaj na dług” (monety lecą do linijki „Dług dziadka” na tablicy kredowej).
- **„Deski do piwnicy”** (Borgar, jednorazowe, od 12. dnia): od kilku nocy w starej piwnicy
  „coś stuka – pewnie szczury”; Borgar chce „porządnie zabić jeden kąt”. Po wykonaniu – notatka
  w dzienniku. Tylko nastrój i sugestia – żadnej nowej wiedzy o twierdzy.
- **„Grzyby za opowieść”** (Ozzy, jednorazowe, od 8. dnia): za miskę grzybów Ozzy bełkocze,
  że „pod tawerną jest więcej piwnicy niż tawerny” i że „kamienie tam na dole pamiętają”.
  Zgodne z `docs/STORY.md` (reszta twierdzy pod tawerną, Ozzy mówi prawdę po pijanemu).

## Sława w tawernie

Liczba 0–100 (na tablicy kredowej: 5 gwiazdek, po 20 punktów każda). Próg zleceń to
**niższy z dwóch**: próg sławy i próg dnia – żeby nie dało się przeskoczyć gry.

| Próg | Sława | Od dnia | Zapłata | Doświadczenie | Sława za zlecenie | Termin |
|---|---|---|---|---|---|---|
| Nowy w okolicy | 0 | 1 | 10–25 G | 20–35 | +4 | 3–4 dni |
| Znajoma twarz | 20 | 4 | 15–40 G | 35–55 | +5 | 4–5 dni |
| Swój chłop | 40 | 10 | 30–55 G | 55–80 | +6 | 4–6 dni |
| Pewna ręka | 60 | 18 | 45–80 G | 80–110 | +7 | 5–7 dni |
| Chluba tawerny | 80 | 28 | 60–100 G | 110–150 | +8 | 6–8 dni |

- Na tablicy są zlecenia z bieżącego progu i do dwóch progów niżej (pierwsza kartka zwykle z
  bieżącego).
- **PILNE** (czerwona wstążka, najwyżej jedna na tablicy, ok. 18% szans): termin 2–3 dni,
  zapłata +25% (do ok. 125 G), sława +2 więcej. Po terminie −8, porzucone −5.
- **POSZUKIWANY**: 7 dni, 90–120 G, 200–240 dośw., sława +10 do +12.
- Kara: po terminie −6, porzucone −3.
- Czasem (35%, od drugiego progu) zleceniodawca dorzuca coś od siebie: Borgar piwo albo chleb,
  Jagna opatrunki albo wywar, Wit gliniany garnek (przydatny w suszy!), sołtys nasiona kapusty
  albo jęczmienia, Zdzisław gwoździe albo żelazo, Bogdan strzały, Marianna jajka albo nasiona…

Zapłata rośnie z wartością roboty: każdy przedmiot ma swoją „wartość wysiłku” (kamień 1,2,
deska 4,5, skóra 6, żelazo 12, miód pitny 18, zając upolowany 6, wilk 12, dzik 22 …), razy
1 + 0,1 × próg, plus stała za rodzaj pracy, zaokrąglone do 5 G i przycięte do widełek progu.
Średnio (test, 300 losowych kartek na próg): **15 / 21 / 34 / 52 / 70 G**.

### Ile to jest wobec długu

- Dług: **2500 G do dnia 60**. Zmiana u Borgara: ok. 80–140 G za wieczór (4 godziny + mini-gra).
- Zlecenie z pierwszego progu to 10–25 G (kilka kamieni, chrust, zioła) – drobny dodatek.
  Najlepsze zlecenia (60–100 G) i listy gończe (do 120 G) są warte mniej więcej jednej
  zmiany, ale wymagają dnia pracy albo niebezpiecznego polowania.
- Tablica daje najwyżej 4–6 kartek na 3 dni, a naraz można mieć 3. Szacunek dla gracza, który
  bierze zlecenie mniej więcej co drugi dzień: **ok. 1200–1700 G w 60 dni**, czyli mniej więcej
  czwarta część tego, co zarobi się w tym czasie na zmianach; bardzo pracowity gracz (jedno
  zlecenie dziennie) zbliży się do 2500–3000 G, ale kosztem własnego pola i zmian.
- Zlecenia dają przy tym doświadczenie (T4: ok. 1/4 poziomu), przedmioty, kości i notatki
  fabularne – nie tylko złoto.
- Wszystko stroi się parametrami wtyczki (widełki zapłaty każdego progu, mnożnik zapłaty i
  doświadczenia, szansa na pilne, kary, liczba kartek, co ile dni).

## Zleceniodawcy

| Kto | Kim jest | Co zleca |
|---|---|---|
| Borgar Kowal | karczmarz – „Płaci uczciwie. Jak na karczmarza.” | kuchnia, kominek, piwnica |
| Feliks | kamerdyner dworu Zaleskich – „Zapisuje wszystko. Nawet to, czego nie powiedziałeś.” | zamówienia dworu (pieczęć z „Z”) |
| Melia Srebrogłosa | bardka – „Ma pieśń na każdą okazję i okazję na każdą pieśń.” | miód na gardło, pióra, jabłka dla muzy |
| Grum Żelazna Pięść | najemnik – „Mówi mało, bije mocno, płaci od ręki.” | prowiant, wędzonka, trening, Szary Kieł |
| Dziadek Ozzy | stały bywalec – „Pamięta czasy, których nie było.” | jagody na nalewkę, piwo, opowieść |
| Babka Jagna | zielarka – „Na każdą dolegliwość ma ziółko, a na resztę – gorsze ziółko.” | zioła, pokrzywa, krwawnik, czosnek, opatrunki |
| Tadeusz Skórka | kuśnierz – „Od futra się zaczyna i na futrze kończy.” | skóry, wilcze futra, wyprawione skóry |
| Halina | piekarzowa – „Rano chleb, wieczorem plotki. Jedno i drugie świeże.” | jajka, mąka, placek na wesele |
| Bartłomiej | sołtys – „Wie wszystko najlepiej, zwłaszcza to, czego nie wie.” | kamienie, liny, cegły, wilki, gulasz |
| Wit | garncarz – „Lepi garnki, a przy okazji i historie.” | glina, gliniane garnki |
| Zdzisław | kowal ze wsi – „Ręce jak kowadła, serce jak miech.” | węgiel, ruda, żelazo |
| Bogdan | łowczy – „Tropi wszystko, co ma cztery nogi. Trzy też.” | ścięgna, strzały, wilczyna, watahy, jelenie, Trójłap |
| Wdowa Marianna | gospodyni – „Liczy każdy grosz. Dwa razy.” | zające, dzik, mleko, len, wełna, kapusta, Czarny Ryj |
| Kazimierz | cieśla – „Mierzy dwa razy, tnie raz, narzeka trzy razy.” | deski, gwoździe, drewno |
| Mały Józek | chłopak na posyłki – „Biega szybciej niż plotki. Prawie.” | marchew dla kucyka, chrust, szyszki na wojnę |

Razem 65 wzorów kartek (każdy z jedną–dwiema wersjami tytułu i tekstu), 15 osób.

## Wygląd

![Szczegóły](tablica_szczegoly.png)

- Rzeźbiona tablica na ścianie z ciemnych desek: rama z karbowanym pasem i rozetami w
  narożnikach, daszek z gontów z ażurową deską okapową, szyld „ZLECENIA” ze złoconymi
  literami, stare dziury po gwoździach, wypłowiałe ślady po dawnych kartkach, strzępy starych
  ogłoszeń pod gwoździami, wydrapane kreski i mały kruk.
- Kartki z pergaminu w czterech odcieniach, różnej wielkości, lekko przekrzywione, z
  postrzępionym brzegiem, przybite gwoździem, pinezką albo pieczęcią lakową (karczma – kufel,
  dwór – „Z” pod koroną, zielarka – liść); jedna ma oderwany róg, niektóre są zgięte. Pismo
  odręczne (Caveat), nagłówki kapitalikami (Alegreya SC).
- Wybrana kartka unosi się, prostuje i rzuca większy cień; otaczają ją żółte narożniki
  (kursor interfejsu). Obok duża kartka ze szczegółami: kto, co, ile masz („3 / 5”),
  nagroda, termin i podpis.
- Z prawej na dole tablica kredowa: sława (gwiazdki, pasek), zlecenia w toku, sakiewka i dług.

## Sterowanie

- Strzałki / WSAD – wybór kartki (także karteczki z zasadami), myszka – najechanie.
- **O** (albo klik) – otwiera przyciski kartki; strzałki wybierają, **O** potwierdza.
- **P** (albo prawy przycisk myszy) – wraca / zamyka tablicę.
- Podczas nagrody **O** przyspiesza animację.

## Dziennik i okienko celu

![Dziennik](tablica_dziennik.png)

- W dzienniku (J) jest zakładka **„Zlecenia”**: zlecenia w toku (romb = gotowe do oddania,
  żółty romb = śledzone), a pod nimi historia (wykonane, przepadłe, porzucone).
- Strona zlecenia pokazuje zleceniodawcę, termin, tekst, **co trzeba (mam / trzeba)** ze
  wskazówką, skąd to wziąć, nagrodę.
- **OK** na zleceniu (albo przycisk „Śledź” na tablicy) – okienko celu w prawym górnym rogu
  pokazuje to zlecenie („ZLECENIE”, czego brakuje i ile dni zostało) zamiast celu z dziennika.
  Drugie OK – z powrotem cel.
- Każde wykonane zlecenie zostawia notatkę w zakładce „Notatki”.

![Okienko celu](tablica_okienko_celu.png)

Nagroda przy tablicy: ![Nagroda](tablica_nagroda.png)

## Dla twórcy

**Pliki:**
- `js/plugins/QuestBoard.js` – cała wtyczka (dane, losowanie, stan, polowania, scena).
- `img/system/QuestBoard_Back.png` (tło: ściana, tablica, daszek, szyld, tablica kredowa),
  `QuestBoard_Paper.png` (4 odcienie pergaminu 512×512), `QuestBoard_Parts.png` (gwóźdź,
  pinezki, 3 pieczęcie lakowe, monety, maska tuszu pieczątek, sznurek) – generator:
  `python tools/questboard/make_art.py` (numpy + PIL, ziarniste, powtarzalne).
- `fonts/Caveat-Regular.ttf`, `Caveat-Bold.ttf` (z wariantowego Caveat, SIL OFL –
  `fonts/Caveat-OFL.txt`), `fonts/AlegreyaSC-Bold.ttf` (SIL OFL – `fonts/AlegreyaSC-OFL.txt`).
  Wtyczka ładuje je sama przy starcie gry.
- Portret Borgara w samouczku: `img/pictures/People3_5.png` (to samo popiersie co w rozmowach).
- `tests/quest_board_test.js` – test (CDP_PORT=9382), zrzuty `docs/tawerna_zycie/tablica_*.png`.

**Rejestracja:** w `js/plugins.js` po Journal, Farming, Hunting, Combat i Story (np. na końcu).
Do tego czasu test wczytuje wtyczkę sam.

**Zmiana w Journal.js** (kopia przed zmianą: `backup_art_2026-09-26/Journal_before_questboard.js`):
`Journal.addTab(def)` – zakładka innej wtyczki, `Journal.addTrackerSource(fn)` – inna wtyczka
może pokazać swoją linijkę w okienku celu; OK na wierszu zakładki innej wtyczki; przy
przypinaniu celu opis po prawej od razu się odświeża (wcześniej pokazywał pierwszy cel).

**Stan** – `$gameSystem._quests` (zwykłe dane, zapisywane z grą): `rep`, `cycle`, `seed`,
`board` (kartki: `open` / `active` / `done` / `failed`, wymagania, nagroda, wygląd), `history`,
`stats`, `track`, `tutorial`, `once`.

**API:** `QuestBoard.open()`, `active()`, `board()`, `accept(id)`, `turnIn(id, { debt })`,
`abandon(id)`, `reputation()`, `tier()`, `tierNow()`, `addRep(n)`, `refresh(seed)`,
`post(szablon, próg, seed)` (przypina wybraną kartkę), `track(id)`, `isReady(id)`,
`progress(id)`, `onComplete(fn)`, `generate(seed, opcje)`, `spawnBounty(id)`, `state()`.
Polecenia wtyczki: „Otwórz tablicę zleceń”, „Zmień sławę w tawernie”.

## Do decyzji

- Czy liczby są dobre wobec długu (szacunek wyżej: zlecenia ok. 1/4 zarobków; mnożnik
  zapłaty w parametrach)?
- Ryb nie ma w zleceniach (brak wody) – zostaje tak?
- Feliks może brać zapłatę od razu na poczet długu – zostawić?
- Czy „sława w tawernie” ma coś dawać poza lepszymi zleceniami (np. zniżki u Borgara, lepsze
  napiwki na zmianie) – na razie nic więcej nie zmienia.
- Ogłoszenia fabularne: piwnica i Ozzy są tylko sugestią – można dopisać kolejne, gdy fabuła
  rozdziału 2 będzie ustalona.
