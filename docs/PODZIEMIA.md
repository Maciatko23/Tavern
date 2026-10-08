# Podziemia - sto pięter pod tawerną

Stan: 2026-10-07 (Lord przy Sercu i zakończenia jako sceny - Underground.js v2.1). Wtyczki `js/plugins/Underground_Data.js` (dane i teksty) i `js/plugins/Underground.js` (generator i gra),
narzędzia `tools/underground/`, testy `tests/underground_test.js` i `tests/unit/underground.test.js`.
Zgodnie z planem ze `STORY.md` („Podziemia - 100 pięter w dół”) i `QUESTY.md` (W9, W3, W4, W2): pasma pięter, co 10. piętro
zrobione ręcznie (fabuła, boss, przystanek windy), piętra pomiędzy **składane automatycznie z kawałków pokoi narysowanych jako
mapa**, każdy zapis ma swoje stałe **ziarno** - piętro wygląda tak samo po powrocie. Na dole Komnata Serca i wybór z Aktu III.

## Pasma

| Piętra | Pasmo | Wygląd | Kawałki | Ręcznie | Stwory (kontrakt) |
|---|---|---|---|---|---|
| 1-10 | Piwnice zamku | magazyny, piwnice win, krypty, cele; tileset 10 | Map130 (11) | 10 Strażnica (Map140) | szczur, pająk |
| 11-30 | Kwatery i kaplica zakonu | cele strażników, refektarz, dormitorium, kaplica, sala pytania, skryptorium, kuchnia, zbrojownia, suchy zbiornik, krypta braci, cela pokutna; **tileset 12** (Dungeon + meble z zestawu Interior) | Map141 (11) | 20 Sala jednego pytania (Map146), 30 Wielka cysterna (Map147) | szczur, pająk, zbroja |
| 31-50 | Jaskinie i podziemna rzeka | groty, rzeka Milcząca z wodospadami i mostem z lin, jezioro, grzyby do zebrania, ruda w skałach, kryształy, stary kamieniołom, obóz zwiadowców, pajęcze gniazdo, rozpadlina, przekop kopaczy; tileset 10 | Map142 (10) | 40 Bród Milczącej (Map148), 50 Przekop kopaczy (Map149) | pająk, nietoperz, topielec |
| 51-75 | Ruiny starsze niż zakon | gotyckie mury, płaskorzeźby z zatartymi twarzami, kamienne kręgi, filary z twarzami, ołtarz bez boga, siedzące kości, zamurowana brama, studnia Pierwszych; tileset 10 | Map143 (10) | 60 Brama Pierwszych (Map150), 70 Sala płaskorzeźb (Map151) | zbroja, kamiennik |
| 76-99 | Warstwa Prawdy | blady kamień, lód, fioletowa mgła, **niebieskie płomienie**, szepty, zjawy, prawdy o mieszkańcach; tileset 10 | Map144 (10) | 80 Sala echa (Map152), 90 Ostatnia straż (Map153) | upiór, cień |
| 100 | Serce Twierdzy | drzwi trzech zamków, Serce, wybór i zakończenia | - | Komnata Serca (Map011) | - |

Ciemność rośnie z głębią (`<DarkDay/DarkNight>` 215 → 222 → 228 → 234 → 240, piętro 100: 236); poziom miejsca dla walki
(`<Poziom:N>`) 4 na piętrze 1, +1 co 2 piętra: 13 na 20., 23 na 40., 33 na 60., 44 na 80., 54 na 100. Każde światło to płomień
(migocze): pochodnie, kosze z ogniem, świece; w Warstwie Prawdy płomienie są niebieskie (wciąż płomienie, nic elektrycznego).
Dźwięk: kapanie jaskini (Atmosphere `<Ambience:cave>`), na piętrach z wodą w paśmie 3 szum rzeki (`River`), w paśmie 4 cichy
wiatr, w paśmie 5 ciemny pomruk (`Darkness`).


> **Uwaga (2026-10-06):** Map149 (piętro 50, Przekop kopaczy) ma też zdarzenie 23 „Przekop: przejście do Jaskini” wstawione przez
> tools/mountains/build.py (przejście do Map014 Jaskinia, przełącznik 15). `tools/underground/build.py --install` pomija Map149, bo jej
> skrót się zmienił - tak ma być. Po `--force` trzeba uruchomić jeszcze raz `python tools/mountains/build.py --install`.

## Droga w dół

| Mapa | Nazwa | Co tam jest |
|---|---|---|
| Map009 | Piwnica Tawerny | piwnica Borgara i za nią najstarszy mur twierdzy ze **starą kratą zakonu** (15,2) - wejście w głąb. |
| Map010 | Ruiny Zamku | sala bramna: wąskie schody do piwnicy (3,6), **wielkie schody w dół** (13-15,6) na piętro 1, kruk z napisem, **szyb windy** (24,7). |
| Map131-139 | Podziemia - piętro 1-9 | puste „skorupy” pasma 1 - piętro powstaje przy wczytaniu mapy. Nic na nich nie rysuj. |
| Map140 | piętro 10 (Strażnica) | strażnik dziesiątej bramy, winda, **schody na piętro 11** (16,2). |
| Map130, Map141-144 | Podziemia: kawałki (pasmo 1-5) | **biblioteki kawałków pokoi**. W grze nikt tam nie wchodzi. |
| Map145 | Podziemia: piętra 11-99 (skorupa) | jedyny plik pięter 11-99 (patrz niżej). Nic na nim nie rysuj. |
| Map146-153 | piętra 20, 30 ... 90 | piętra zrobione ręcznie (tabela niżej). |
| Map011 | Komnata Serca | piętro 100 (przebudowana na tilesecie 10; stary pusty szkic RTP jest w `backup_art_2026-10-06/underground_deep/Map011.json`). |

Wszystkie mapy podziemi są w drzewie edytora pod „Ruiny Zamku” (Map011 przeniesiona tam spod Tawerny).

### Piętra 11-99 bez własnych plików

Pasmo 1 ma dziewięć pustych map (131-139). Dla 81 pięter 11-99 to byłoby 81 plików - zamiast tego **piętro N ma numer mapy
1000 + N** (1011-1099), którego nie ma w edytorze: `Underground.js` podmienia przy wczytaniu plik na wspólną skorupę Map145
(`DataManager.loadDataFile`), a rdzeń i wszystkie wtyczki widzą zwykłą mapę 1000+N - z własnymi samoprzełącznikami (przeszukane
skrzynie, wykopana ruda), własnym „odkryciem mapy” (Combat), własnymi zwłokami i pułapkami. Nazwy tych map są dopisane w pamięci
do `$dataMapInfos` („Podziemia - piętro N”). Zapis i wczytanie na takim piętrze działa jak na każdym innym (test: piętro 57).
Nowe pasmo = wpis w `BANDS` (`virtual: true`), mapa kawałków, piętra ręczne - bez nowych skorup.

### Zejście jest zamknięte do Aktu II

W nowej grze **krata w piwnicy (Map009 15,2) jest zamknięta**. Otwiera ją **przełącznik 11 `Podziemia_Zejscie`** - od
2026-10-06 robi to W4 „Krew kasztelana” (TownQuests.js, klucz kasztelana po spłacie długu); F9 → „Podziemia: zejście z piwnicy”
przełącza kratę na próbę; w kodzie `Tawerna.call("Underground", "open")`.

## Przełączniki i stan zapisu

| Przełącznik | Nazwa | Kto włącza |
|---|---|---|
| 11 | Podziemia_Zejscie | W4 (klucz kasztelana) - krata w piwnicy otwarta |
| 12 | Podziemia_Winda | pierwszy poruszony kołowrót windy (dowolny przystanek) - w szybie Ruin Zamku wisi klatka |
| 13 | Podziemia_Skrot | pieśń Melii (W3, „trzeci schodek pusty”) - komenda *Skrót z pieśni znany* albo `Underground.shortcut(true)` |
| 14 | Podziemia_Brama10 | strażnik na piętrze 10 przepuścił bohatera (zagadka albo walka - Creatures.js) |

Stan wtyczki: `Tawerna.state("underground")`: `seed` (ziarno zapisu), `deepest` (najgłębsze piętro), `visited`, `notes`
(przeczytane zapiski), `lib` (podpisy bibliotek kawałków), `gold` / `found`, **`lifts`** (przystanki windy: `{10: true, 20: true}`),
**`bosses`** (pokonani bossowie pięter), **`locks`** (otwarte zamki Komnaty Serca), `forceLocks` (F9 / testy), **`truths`**
(poznane prawdy Warstwy Prawdy: `{ "85": { who: "kowal", floor: 85 } }`), **`ending`** (`{ kind, guardian, locks, day, lord, world }` po
wyborze z Aktu III - `world` to stan świata, z którego zrobiono sceny), **`lord`** (`{ stance, choice, told, day }` - Lord przy Sercu),
`forceWorld` / `forceLord` (F9 i testy: świat i Lord „na próbę”). Przeszukane skrzynie to samoprzełączniki A zdarzeń pięter (na piętrach 11-99 - na mapach 1000+N).

## Jak powstaje piętro (Underground.js)

Mapa piętra wczytuje się jak zwykle, a `Tawerna.onMapData` podmienia jej dane na piętro zrobione z ziarna zapisu i numeru
piętra (ten sam wynik za każdym razem - także po wczytaniu zapisu):

1. **Plan**: siatka 3x2 / 3x3 / 4x3 pól, w niej tyle pokoi, ile mówi pasmo (pasmo 1: lista 4-8; pasma 2-5: `{ min, max }`,
   rośnie z głębią: 6-9, 6-9, 7-10, 7-10), połączonych drzewem korytarzy plus do dwóch pętli. Schody w górę w pokoju startowym, w
   dół w pokoju najdalszym od niego.
2. **Kawałki**: każdy pokój to kawałek z biblioteki pasma (losowany według wagi, bez powtórek, póki są inne), przesunięty losowo w
   swoim polu.
3. **Korytarze**: pędzel 2x2 po drodze w kształcie L / Z od drzwi do drzwi; tnie tylko skałę. Nad korytarzem lico ściany na 2
   rzędy - rodzaj ściany i podłogi korytarza ma każde pasmo swój (cegła zakonu, ziemia i głazy jaskini, gotyk ruin, blady kamień).
4. **Kształty**: każde zmienione pole i jego sąsiedzi dostają kształt autokafla tak, jak liczy go edytor (wodospady A1 - swoje
   4 kształty); skała różnych rodzajów łączy się bez szwu. Cień ściany jak w edytorze.
5. **Zdarzenia**: zdarzenia kawałków z ich znacznikami (niżej), schody, pochodnie w korytarzach (w paśmie 5 niebieskie), zapiski
   piętra (w paśmie 5 - prawda).
6. **Sprawdzenie**: droga z pola przed schodami w górę do pola przed schodami w dół - `Underground.verify(piętro)`; testy
   sprawdzają ją na wielu ziarnach wszystkich pasm.

Wejście na piętro: napis u góry „Piętro N” (na ręcznych: „Piętro 20 - Sala jednego pytania”) z pasmem i najgłębszym piętrem;
przy pierwszym wejściu na wybrane piętra zdanie bohatera w dymku (coraz mroczniejsze); doświadczenie za odkrycie mapy (Combat).

### Ziarno

Losowane raz na zapis (`seed`). To samo ziarno + to samo piętro = to samo piętro. Jeśli autor zmieni bibliotekę kawałków pasma
(albo generator - `GEN_VERSION`), stary zapis dostaje piętra tego pasma na nowo: ich przeszukane skrzynie są zapomniane, a bohater
stojący na takim piętrze trafia przed jego schody w górę.

## Kawałki - format i jak narysować nowy

Kawałek to prostokąt mapy kawałków (Map130 dla pasma 1, Map141-144 dla pasm 2-5). **W lewym górnym rogu** stoi zdarzenie
`Kawałek: <nazwa>` z notatką `<Kawalek:w=14,h=11,waga=3,pietra=11-29>` (`w`, `h` - rozmiar z ramką skały, `waga` - jak często,
`pietra` - na których piętrach). Wszystko w prostokącie (każda warstwa kafli, cienie, regiony, zdarzenia) to kawałek. Zasady:

- rząd 0 - skała, rzędy 1-2 - lico północnej ściany, **podłoga od rzędu 3**, dookoła ramka skały (jaskinie mogą mieć
  nieregularny kształt - lico rysuje się nad każdą podłogą, nad którą jest skała);
- **drzwi** `<Drzwi:N|S|E|W>` na polu podłogi przy krawędzi, pole obok też podłogą (korytarze mają 2 pola). **Co najmniej
  jedne z każdej strony**, nigdy po drugiej stronie wody;
- `<Schody>` - miejsce na schody: dolny rząd lica, podłoga pod nim wolna; co najmniej jedno na kawałek;
- `<Pochodnia>`, `<Lup:skrzynia|skrzynka|beczka|worek|dzban|monety|kosci|grzyby|wozek|sakwa|relikwiarz>` (grzyby po zebraniu
  znikają; wózek kopaczy daje rudę), `<Stwor:rodzaj>` (rodzaje z kontraktu niżej), `<Pulapka:kolce>`, `<Zapiski>`, `<Losowo:50>`;
- **nowe od pasma 2**: woda (kafle A1 na podłodze, np. rzeka wpadająca spod ściany - wodospad A1 na licu; patrz „Woda”),
  `<Szept>` - stąd dochodzą szepty Warstwy Prawdy, `<Zjawa>` - tu na chwilę pokazuje się ktoś z góry (oba niewidzialne);
  zdarzenie z obrazkiem `!$Rock_...` to skała do rozbicia kilofem (ChoppableTree: kamień, `!$Rock_Ore_Iron...` - ruda żelaza),
  zwykle z `<Losowo:50-75>`.

Zdarzenia bez znaczników kopiują się tak, jak są.

**Nowy kawałek w edytorze** (edytor sam liczy autokafle i cienie): otwórz mapę kawałków pasma, skopiuj podobny kawałek albo
narysuj nowy (ściany A4: góra + lico na 2 rzędy, podłoga A2, rekwizyty B-E), postaw zdarzenie `Kawałek: <nazwa>` w lewym górnym
rogu z notatką `<Kawalek:...>` i znaczniki, zapisz i sprawdź: `node tools/underground/check_chunks.js data/Map141.json`, potem
`node tests/unit/underground.test.js`. Pasmo 2 używa **tilesetu 12 „Podziemia: kwatery zakonu”**: zestaw Dungeon, ale arkusz B to
meble z zestawu Interior (łóżka, stoły, ławy, regały) - arkusze C, D, E jak w tilesecie 10.

Rekwizyty, których flagi poprawiłem (stopa blokuje, góra nad bohaterem), są w `tools/underground/uglib.py PIECES` (tileset 10)
i `PIECES_IN` (meble pasma 2) - nowy rekwizyt o złych flagach dopisz tam i uruchom `python tools/underground/build.py --install`
(przy zamkniętym edytorze), albo ustaw jego przejście w bazie danych → Tilesety.

`build.py --install` buduje wszystkie mapy podziemi, ale mapy **zmienionej w edytorze** od ostatniej instalacji nie rusza
(`tools/underground/installed.json`); `--force` zastępuje także je (kopie zostają w `backup_art_2026-10-06/underground/`).

## Piętro 10 - Strażnica dziesiątej bramy (Map140)

- Schody z piętra 9 kończą się w przedsionku (5,13). Zapiski: Reguła straży, Dziennik wartownika, Napis nad windą, Ostatni wpis.
- **Strażnik**: pusta zbroja; zagadka „KTO SCHODZI, TEN PYTA...” - dobre słowa to powiedzenie Borgara „Nie pytam o to, czego nie
  chcę wiedzieć.” (przełącznik 14). Creatures.js może zamiast zagadki dać walkę (`Underground.onGuardian`).
- **Winda kasztelana**: kołowrót i klatka (pierwszy przystanek windy - niżej).
- **Schody na piętro 11** (16,2) prowadzą do pasma 2; wracający z piętra 11 staje przed nimi (16,3).
- Skrzynia straży (2 opatrunki, 2 pochodnie, 25 G).

## Piętra zrobione ręcznie (20-90)

Każde ma schody w górę (przyjście: pole pod nimi), schody w dół, **przystanek windy** (kołowrót + klatka), **miejsce bossa**
`<Stwor:boss_NN>`, zapiski zakonu (klucze „20a”... w `NOTES`) i skrzynię ze stałą zawartością.

| Piętro | Mapa | Nazwa | Co tam jest |
|---|---|---|---|
| 20 | Map146 | Sala jednego pytania | przedsionek; wielka sala rytuału z wykutym kręgiem, krzesłem pytającego, kamiennymi braćmi plecami do światła, **Księgą pytań** na pulpicie (20a: imię i pytanie rok po roku, trzy wpisy brata Dobiesza z jednego roku, wyrwane strony), Reguła rytuału (20b); cela przeora z listem do kasztelana Bogumiła (20c) i skrzynią; boss: Przeor w zbroi |
| 30 | Map147 | Wielka cysterna | chodnik wokół zapadniętej, **suchej** niecki (tylko kałuża stęchłej wody na dnie); **Zasuwa główna** z krukiem i napisem „CZTERY I DWA” (30b, hak W1 rozdz. 7 / W2 - niżej); dziennik cysterny (30a); gniazdo z kości na dnie (30c); boss: Królowa szczurów |
| 40 | Map148 | Bród Milczącej | wielka grota przecięta rzeką z wodospadem, most z lin; obóz zwiadowców (kosz z ogniem, posłania, 40a); pajęczyny na wschodnim brzegu; winda zwiadowców (40b); boss: Matka pająków |
| 50 | Map149 | Przekop kopaczy | miejsce, gdzie przekop kopaczy (W8) przebił się do jaskiń: obóz z posłaniami, wózkami, latarnią (50a), tunel na wschód zakończony **zawałem** (50c - „kiedyś znów się otworzy”), rzeka na południu; **Źródło pod skałą** - jedyna woda do picia pod twierdzą (50b); boss: Topielec z głębiny |
| 60 | Map150 | Brama Pierwszych | sala uczonych (60a), dziedziniec przed otwartą bramą starszą niż zakon, kamienne postacie zwrócone do środka, napis z dwoma odczytami (60b); za bramą sala z płaskorzeźbami i schodami; boss: Kamienny Odźwierny |
| 70 | Map151 | Sala płaskorzeźb | galeria siedmiu płaskorzeźb Pierwszych, klęczące szkielety, kosze z ogniem płonące bez drewna (70a, 70b - Wincenty o zatartych twarzach); boss: Zbroja bez herbu |
| 80 | Map152 | Sala echa | blada sala z mgłą, krąg ośmiu zjaw, szepty ze ścian, pulpit z niebieskim płomieniem (80a), ostatni zapis brata Radosta (80b); boss: Upiór pytającego |
| 90 | Map153 | Ostatnia straż | ostatni posterunek zakonu: posłania, wygasły kosz, księga warty (90a), list ostatniego przeora (90b), płyta z imionami tych, co zeszli, i pustym miejscem na jeszcze jedno (90c); **najniższy przystanek windy**; boss: Ostatni Strażnik |

**Schody w dół ręcznego piętra czekają na bossa** tylko wtedy, gdy jakaś wtyczka zarejestrowała dla niego twórcę
(`registerCreature("boss_NN", ...)`) - wtedy do `Underground.bossDefeated(NN)` schody mówią „Najpierw <boss>. Tędy nie przejdę.”
(dymek nad bohaterem). Bez stworów schody są wolne.

## Winda kasztelana

Klatka wisi na każdym ręcznym piętrze 10-90 i w szybie Ruin Zamku. Przystanek działa, gdy na tym piętrze poruszy się
**kołowrót** (`Underground.windlass(this)`: „Zakręcić kołowrotem?” → przystanek na zawsze, przełącznik 12, doświadczenie). Klatka
(`Underground.cage(this)`) pyta „Dokąd jechać?” i pokazuje Ruiny Zamku oraz wszystkie działające przystanki poza obecnym
(„Piętro 40 - Bród Milczącej”). Do Komnaty Serca winda nie zjeżdża: od piętra 90 dziewięć pięter trzeba przejść pieszo.

## Woda w podziemiach (susza zostaje)

Woda jest widoczna (rzeka Milcząca w paśmie 3, kałuża w suchej cysternie, jeziora), ale **nie do picia**: przycisk akcji przed
wodą pod ziemią mówi tylko „Mętna, lodowata woda. Pachnie żelazem i kamieniem - tego nie będę pić.” (menu wody z Farming.js się
nie otwiera). **Jedyny wyjątek, celowo bardzo głęboko: Źródło pod skałą na piętrze 50** (`<Studnia:3>` - trzy czerpania na dzień,
`Farming.rationWell`). Wielka cysterna (piętro 30) jest sucha; jej zasuwa to hak dla questów (niżej).

## Warstwa Prawdy (piętra 76-99)

- **Szepty**: co 20-40 s głos z ciemności - z najbliższego miejsca `<Szept>` (do 9 pól), inaczej nad bohaterem
  (`WHISPERS` w danych: „Wiesz już. Zawsze wiedziałeś.”, „Za tobą ktoś idzie. To ty.”...). Szyna `undergroundWhisper`.
- **Zjawy**: podchodząc na 6 pól do miejsca `<Zjawa>` (raz na wizytę) bohater widzi kogoś z góry - postać mieszkańca
  (`$Npc_Borgar`, Melia, Ozzy, dziadek Stach, Hanka, Ambroży, Grum, Feliks, Lord, Tadek, Ludmiła, Kuba) wyłania się z ciemności,
  patrzy na niego, mówi jedno zdanie („Wracaj na górę. Zawsze wracaj na górę.”) i znika. Szyna `undergroundVision`.
- **Chwile**: co 40-80 s (i przy każdej zjawie) ekran na moment zimnieje i drga, kolory się przekręcają (tint + lekki wstrząs +
  filtr koloru na mapie).
- **Prawdy**: zapiski pięter 76-99 to kartki „zapisane twoim pismem, choć nic nie pisałeś” - małe prawdy o mieszkańcach
  (Borgar co noc staje przed kratą, Hanka piecze o jeden bochenek za dużo, Feliks liczy, ile beczki wody kosztowały miasto,
  dziadek Stach bał się, że po spłacie nikt nie zapuka...). Pisane celowo o drobiazgach albo dwuznacznie - wielkich faktów,
  które `STORY.md` zostawia otwarte, nie rozstrzygają. Przeczytana prawda trafia do dziennika („Warstwa Prawdy: ...”) i do
  stanu: `Underground.truths()` → `{ klucz: { who, floor } }`, szyna `undergroundTruth { key, who, name, floor, text }` -
  **hak dla questów miasta (W9 rozdz. 6)**: przy powrocie bohater może powiedzieć prawdę tej osobie albo przemilczeć (tego
  jeszcze nie ma - to rozmowy w TownQuests). Klucze `who`: `Underground_Data.TRUTH_WHO`.

## Piętro 100 - Komnata Serca (Map011)

- Schody z piętra 99 → przedsionek pod ostatnim murem. **Drzwi Komnaty Serca** mają trzy zamki (W9 rozdz. 7):
  - **Zamek z krukiem** - klucz kasztelana (W4: `TownQuests.vcount("klucz_kasztelana") > 0` albo W4 skończony);
  - **Kamienny dzwon** - sygnał „pytanie”, siedem uderzeń (W2: Księga sygnałów - flaga `signalBook` - albo rozdz. 5 W2 za
    płytą w ogrodzie, albo W2 skończony);
  - **Kamień pieśni** - pieśń o Kruczych Skałach (W3: flaga `w3Shortcut`, W3 skończony albo przełącznik 13).
  Zamek otwiera się dopiero, gdy bohater tę rzecz zna - bez questów nie ma czego zgadywać. **Wystarczą dowolne dwa**
  (propozycja z `QUESTY.md` W9), trzeci daje lepszy epilog. Napis nad drzwiami (100a): „KTO MA DWA, TEN WEJDZIE. KTO MA TRZY,
  TEN WYJDZIE.” Szyna `undergroundLock { lock, open, door }`; `Underground.locks()`.
- **Serce Twierdzy** na niskim postumencie w wykutym kręgu: światło bez kształtu (`!$Ug_Heart`) - `STORY.md` nie rozstrzyga, czy
  to klejnot, zwierciadło, studnia czy coś żywego, więc w grze „nie da się powiedzieć, czym jest”. Gdy autor zdecyduje -
  wystarczy podmienić obrazek zdarzenia „Serce Twierdzy (blask)”.
- **Wybór z Aktu III**: *Zniszczyć Serce* / *Zostać strażnikiem* (bohater, albo Borgar - po W4 „Słowa Borgara”, flaga
  `borgarSaying` - albo Ambroży - po oddaniu mu kronik, `ambrozyChronicles`) / *Uwolnić prawdę dla wszystkich* / *Zapieczętować
  je - z zasadami* / *Jeszcze nie*. Potwierdzenie „Tego nie da się cofnąć.” → **zakończenie jako sceny** (niżej), epilog, „KONIEC -
  <tytuł>” i wybór: *Wrócić do gry* (bohater stoi przy barze w tawernie, następny dzień) albo *Do ekranu tytułowego*.
- Po zakończeniu komnata pamięta wybór: odłamki (zniszczone), pusty cokół (uwolnione), kamienna pieczęć (zapieczętowane) albo
  Serce wciąż świeci nad strażnikiem - Borgar albo Ambroży siedzi na kamiennej ławie (12,9) i ma dla bohatera jedno zdanie.
  Szyna `undergroundEnding { kind, guardian, locks, day, lord }`.

### Świat, który czytają zakończenia (`Underground.world()`)

Każda wtyczka pytana ostrożnie (może jej nie być): **Story** (gra fabularna, dług spłacony), **TownQuests** (Opinia; flagi W1-W9),
**TownLife** (kto odszedł: Feliks), **W6** (`TownQuests.w6()` albo flagi), **Akt III** (`Act3.outcome()`, a bez niego flagi).

| Pole | Skąd | Wartości |
|---|---|---|
| `story`, `debtPaid` | `Story.state()` | gra fabularna; spłacone (`paid >= debt` albo `done`) |
| `opinion` | `TownQuests.opinion()` | 0-100 albo `null` |
| `locks` | `Underground.locks().open` | 2-3 |
| `borgar` / `ambrozy` / `book` | flagi `borgarSaying` / `ambrozyChronicles` / `signalBook` | kto schodzi z bohaterem do komnaty; Księga sygnałów |
| `melia` | `w3Sung` / `w3Borgar` / `w3Burned` | `public` / `borgar` / `burned` / `null` |
| `grum` | `Act3.outcome().grum` (`neutral` = jak bez W8), inaczej `grumDead` / `grumGone` / `grumAlly` / `w8Faction`, `w8Lost` | `ally` `enemy` `gone` `dead` `faction` `null` |
| `rafal` | `Act3.outcome().rafal`, `TownQuests.w6().rafal`, inaczej `rafalAlly` / `rafalGiven`, `rafalEnemy` / `rafalSmuggled` / `rafalTaken` | `ally` `enemy` `gone` `taken` `dead` `null` |
| `marek` | `w6().marekSaved` albo flaga `marekSaved` | tak / nie |
| `camp` | `w6().camp` albo `campInside` / `campOutside` | `inside` / `outside` (scena w Podgrodziu, Map111) / `null` |
| `water` | `sluiceHalf` (W1) | woda pod rynkiem |
| `feliks`, `butler` | `w1Revealed` / `lordAlly` / `feliksPays` / `TownLife.gone("feliks")` | kto stoi przy Lordzie: Feliks albo Teodor |
| `siege` | `Act3.outcome()` → `{ result: held / costly / fallen, defenders, lost, grum, ... }`, inaczej flagi `act3Held` / `act3Costly` / `act3Fallen`; `null` = oblężenia jeszcze nie było | imiona obrońców i rannych po polsku („Borgar, Grum i Tadek”) |
| `lord` | `state().lord` albo `lordStance(w)` | `{ stance, choice, told }` |

### Lord przy Sercu (W7 rozdz. 7)

**Postawa Lorda** (`Underground.lordStance`): bez fabuły albo przed spłatą długu - *nieobecny*; W1 b (po cichu do Lorda, `lordAlly`)
albo powiedziana mu prawda z Warstwy Prawdy (`lordTruth`) - *sojusznik*; W1 a (wstyd na rynku, `w1Revealed` / `lordCold`) - *rywal*;
w każdym innym razie *nieobecny* (Lord nic nie wie, zna tylko bajkę). Przy pierwszej rozmowie z Sercem, zanim padnie wybór z Aktu III:

- **sojusznik** schodzi sam za bohaterem („Szedłem za tobą od dziewięćdziesiątego piętra”), **rywal** ze strażnikiem dworu („Mówiłem:
  najpierw do mnie.”). Obaj chcą zadać jedno pytanie: *czy mój syn, Kazimierz, zginął na wojnie przeze mnie?* (Lord w swoim stylu
  bohatera, `$Npc_Lord`, z popiersiem w rozmowie).
- Wybór: **Pozwól mu zapytać** - „Tak. I nie.”: raz, przy stole, nazwał syna tchórzem; Kazimierz popłynął, żeby pokazać ojcu, że nim nie
  jest, i zginął, osłaniając odwrót innych. Serce mówi dalej, niż pytał - bohater odciąga go od światła. / **Odmów** - sojusznik
  przyjmuje to („Wolę pamiętać go takim, jakim był”); rywal każe strażnikowi odsunąć bohatera, ale strażnik widzi w świetle swoją
  zmarłą matkę i nie podejdzie; Lord sam się cofa: „Nie pytam o to, czego nie chcę wiedzieć.” (powiedzenie Borgara). / **Zapytam za
  ciebie** - bohater zna odpowiedź i decyduje: *powiedzieć całą prawdę* / *„Nie przez ciebie.”* (połowa prawdy) / *nic nie mówić*.
- Lord odchodzi; stan `lord { stance, choice, told }`, szyna `undergroundLord`. Drugi raz już nie przychodzi. Wybór wraca w scenie
  przed dworem (jabłoń dla Kazimierza, listy, których nie wysyła, zamknięte wrota, „Nie przez ciebie” powtarzane co rano...).

### Zakończenia jako sceny

Teksty i ustawienie scen są w `Underground_Data.js HEART` (aktorzy, miejsca, Lord, komnata, sceny na górze - kroki: kwestie, ruch,
światło Serca, napisy, karty), `Underground.js` robi z nich polecenia zdarzeń. W czasie scen: czarne pasy u góry i u dołu, schowany
HUD, **bez autozapisu** (silnik zapisuje po każdym przejściu - zapis w połowie sceny wczytałby się w jej środek).

1. **Komnata**: kto zszedł z bohaterem (Borgar - `borgarSaying`, Ambroży - `ambrozyChronicles`) wchodzi drzwiami; potem samo
   zakończenie: *zniszczyć* - szepty, zamach, pęknięcie, „przez jedną chwilę wiesz wszystko” (prawdy Warstwy Prawdy jedna po drugiej),
   ciemność i cisza; *strażnik* - bohater siada na ławie, „Mija rok”, pierwszy pytający (Lord, jeśli mu odmówiono; Ludmiła, jeśli Marek
   nie wrócił; Melia po spalonych słowach; inaczej Ozzy); Borgar („Masz. Klucz od tawerny. Zmiana co trzy dni”) albo Ambroży biorą
   wartę; *uwolnić* - światło idzie w górę, napisy „Piętro 90... 50... 10... Piwnica tawerny”; *zapieczętować* - kamienna pieczęć,
   zasady wycięte w kamieniu, trzy zamki = trzech strażników zasad.
2. **Czarna karta**: słowa zakończenia (`ENDINGS`), potem „Wracasz na górę” (albo - strażnik - „Serce pokazuje strażnikowi miasto”).
   Bohater śpi do 11:00 (następny ranek; dzień w dzienniku, autozapis po powrocie do gry).
3. **Na górze** (prawdziwe mapy, mieszkańcy zastąpieni na czas sceny aktorami 805-827): **dwór** (Map024 - Lord według postawy i wyboru,
   Feliks albo Teodor; tylko w grze fabularnej), **rynek** (Map008 - sołtys, Hanka, Kuba, Ambroży: woda, Opinia, oblężenie), **obóz**
   (Map008 pod murem albo Podgrodzie Map111 - Ludmiła, Ela, Marek, Rafał), **dom dziadka** (Map019 - „ktoś puka”; gra fabularna),
   **tawerna** (Map001 - Borgar, Ozzy, Melia, Grum według W8 / Aktu III, imiona obrońców na belce, odbudowa po upadku; na końcu bohater
   przy barze).
4. **Epilog**: trzy zamki, Opinia, woda, Księga sygnałów; „KONIEC - <tytuł>”.

**Strażnik Borgar / Ambroży a dalsza gra** (decyzja, do potwierdzenia): warta jak za zakonu - zmiana co trzy dni (zapiski 90a), więc
Borgar dalej stoi za barem, a Ambroży dzwoni; w komnacie siedzą na ławie przed Sercem.

Mapy Map011 i inne **nie są zmieniane** - aktorzy (800-804 w komnacie, 805-827 w scenach) wchodzą przez `Tawerna.inject`, a podczas
sceny na górze mieszkańcy tej mapy (TownLife 900-949, miejsca zadań 951-959, bywalcy 1-4 w tawernie) są na chwilę zdjęci (wracają po
przejściu na następną mapę).

## F9 (Podziemia + Serce)

Zakładka „Zdarzenia” (wiersze dodaje sam Underground.js - Debug.js nie jest zmieniany): „Serce: zakończenie „...”” (←→ sześć: zniszczyć,
strażnik ja / Borgar / Ambroży, uwolnić, zapieczętować; OK - na piętro 100 i scena od razu), „Serce: świat - ...” (jak w grze / dobry /
zły / mieszany - gotowe zestawy w `HEART.DEBUG.worlds`) i „Serce: Lord przy Sercu - ...” (jak w grze / sojusznik / rywal / nieobecny).
Skok zeruje zakończenie i Lorda, włącza zamki na próbę (2 albo 3 otwarte według świata).

## Hak dla W1 / W2: Zasuwa główna (piętro 30)

Zasuwa wykuta w północnej ścianie wielkiej cysterny: „ZASUWA GŁÓWNA. CZTERY I DWA. Otwiera ją sygnał wody z dzwonu na górze,
nie ręka.” Przycisk akcji czyta napis (30b) i wysyła na szynę `undergroundSluice { floor: 30 }`. Samo otwarcie (studnia na rynku
się napełnia, sołtys wydziela racje - W1 rozdz. 7) należy do TownQuests - Underground tylko pokazuje miejsce.

## Stwory - kontrakt

Dla wtyczki stworów (etap 4 walki, Creatures.js). Rodzaje miejsc `<Stwor:rodzaj>` w kawałkach i na mapach ręcznych:

| Rodzaj | Co | Pasma |
|---|---|---|
| `szczur` | rój szczurów | 1-2 |
| `pajak` | wielki pająk | 1-3 |
| `zbroja` | pusta zbroja-strażnik | 2 i 4 |
| `nietoperz` | rój nietoperzy | 3 |
| `topielec` | topielec z rzeki (stoi przy wodzie) | 3 |
| `kamiennik` | kamienny wartownik | 4 |
| `upior` | upiór prawdy | 5 |
| `cien` | cień z twarzą mieszkańca | 5 |
| `boss_20` ... `boss_90` | boss ręcznego piętra (jeden znacznik na piętrze) | - |
| `zbroja_straznik` | strażnik dziesiątej bramy (Map140, z zagadką; `onGuardian`) | 1 |

Opisy bossów (wygląd i sposób walki) są w `Underground_Data.js BOSSES` (np. 30: „Olbrzymia, łysiejąca szczurzyca z gniazdem z
kości i słomy na dnie suchej cysterny; gryzie i taranuje, a gdy traci siły, piszczy i woła roje szczurów”). Pasmo 1 ma od
2026-10-06 tylko szczury i pająki (dawne `upior` / `zbroja` w kawałkach pasma 1 zamienione według kontraktu).

- `Underground.registerCreature(rodzaj, (spawn, ctx) => daneZdarzenia)` - przy budowie **każdej mapy podziemi** (generowanej i
  ręcznej) dla każdego miejsca tego rodzaju gra wstawia zdarzenie stwora: numery **860-899** (rezerwacja w rdzeniu);
  `spawn = { x, y, kind, floor, room }`, `ctx = { floor, mapId, seed, rng }`; `"*"` obsługuje miejsca `dowolny`;
  `registerCreature(rodzaj, null)` wyrejestrowuje. Po zamknięciu menu / wczytaniu zapisu zdarzenia mapy idą za jej danymi.
- `Underground.spawns()` - miejsca na obecnej mapie; szyna `undergroundFloor { floor, mapId, spawns, first }`.
- **Bossowie**: `Underground.bossDefeated(NN)` po zwycięstwie (otwiera schody w dół, napis u góry, szyna `undergroundBoss`);
  `Underground.bossCleared(NN)`, `Underground.bosses()`.
- `Underground.onGuardian(fn)` - walka zamiast zagadki na piętrze 10 (`fn(eventId)` → true, gdy przejmuje strażnika).
- Znaczniki bez zarejestrowanego rodzaju są nieszkodliwe (niewidzialne, przechodnie).
- Testy podziemi wyłączają automatyczne stwory (`Creatures.auto(false)`) - stwory mają własny test.

## Skrót z pieśni (W3)

Z przełącznikiem 13 wielkie schody w Ruinach Zamku pytają: *Zejść schodami (piętro 1)* / *Trzeci stopień... (skrót na
dziesiąte piętro)* / *Zostać*. Ta sama pieśń otwiera Kamień pieśni na piętrze 100.

## Zapiski zakonu (Underground_Data.js NOTES)

Po jednych na każdym piętrze 1-99 (oprócz ręcznych, które mają po 2-3 swoje), w kolejności zejścia - fabuła idzie z głębokością:

- **1-10** piwnice: codzienność straży, napis „NIE PYTAJ...”, kasztelan Kowal, liczenie stopni, straż dziesiątej bramy.
- **11-30** kwatery: rozpiska cel (pusta cela Dobiesza), kuchnia (woda święta, bo jej mało), losowanie pytającego, pytania
  odrzucone, dzwon - siedem razy (W2), sygnał wody 4+2 (W1/W2), lista kasztelanów (Bogumił z rodu Kowali - W2/W4), Dobiesz,
  rozkaz zamknięcia dolnej kaplicy („nie odpowiadaj, gdy będzie pytał” - wers pieśni W3).
- **31-50** jaskinie: zwiadowcy zakonu („idźcie przy lewej ścianie”), rzeka Milcząca, grzyby (fioletowych nie jeść), ruda (żelazo
  z dołu cięższe niż powinno - jak klucz kasztelana), kopacze z gór („szukajcie drzwi pod skałą”, kopacz, który przestał mówić -
  W6/W8, bez rozstrzygania, kim jest).
- **51-75** ruiny: uczeni zakonu, Wincenty i Radost, trzy możliwości (świątynia / straż jak zakon / trzecia - zamazana węglem),
  zatarte twarze, kości twarzą w dół, słowo „Pierwszy” albo „Ostatni” - **kto pierwszy znalazł Serce zostaje otwarte**.
- **76-99** Warstwa Prawdy: prawdy o mieszkańcach i o bohaterze (`who`).

Przeczytane trafiają do dziennika i dają trochę doświadczenia (prawdy więcej).

## Łupy

Przydatne, ale nie psujące gry: stare monety (więcej z głębią - mnożnik pasma 1.3-2.4), pochodnie, liny, gwoździe, deski,
węgiel, opatrunki, strzały, żelazo, stal (relikwiarze, rzadko), miód w dzbanach, **grzyby** (pasmo 3, zbierane raz), **ruda**
(wózki kopaczy i skały z rudą - kilof). Ręczne piętra mają skrzynie ze stałą zawartością. Bez wody do picia (poza źródłem na 50).

## API (Tawerna.api("Underground") = window.Underground)

Mapy: `floorOf(mapId)`, `mapOf(piętro)`, `bandOf(piętro)`, `handmadeOf(piętro)`, `isGenerated`, `isVirtual`, `isUnderground`,
`info()`, `spawns()`, `deepest()`, `seed()`, `setSeed(n)`, `go(piętro 0-100)`, `stairs("up"|"down")`, `landing(...)`,
`verify(piętro)`, `generate`, `parseLibrary`, `checkChunk`, `reachable(mapa, pole, flagi)`, `roomsOf`.
Krata / winda / skrót: `isOpen()`, `open()`, `close()`, `lift(b)`, `liftOn(piętro)`, `liftStops()`, `liftMenu(interp)`,
`windlass(interp)`, `cage(interp)`, `shortcut(b)`.
Stwory: `registerCreature`, `hasCreature`, `bossDefeated(NN)`, `bossCleared(NN)`, `bosses()`, `onGuardian(fn)`.
Komnata Serca: `locks()`, `lockKnown(nazwa)`, `lock(nazwa, interp)`, `openLock(nazwa)`, `forceLock(nazwa|"all", b)` (F9/testy),
`door(interp)`, `doorOpen()`, `heart(interp)`, `ending(rodzaj, strażnik, interp)`, `afterEnding()`, `epilogueLines(...)`,
`world()`, `lordStance(świat)`, `forceWorld(świat|null)`, `forceLord("ally"|"rival"|"absent"|null)`, `debugEnding(rodzaj, strażnik, świat, lord)`,
`shotsOf(rodzaj, strażnik)`, `filmLog()`, `film` (`setSpeed(v)` - testy, `start()` / `end()`, `cinema`), `heartFx(tryb)`.
Warstwa Prawdy: `truths()`, `whisper(tekst?)`, `startMoment(klatki)`, `showVision(idZdarzenia, nrZjawy?)`. Inne: `waterAt(x, y)`,
`read(klucz)`, `search(id)`, `hurt(...)`.
Szyna: `undergroundFloor`, `undergroundDeeper`, `undergroundLoot`, `undergroundNote`, `undergroundTruth`, `undergroundGate`,
`undergroundLift`, `undergroundBoss`, `undergroundLock`, `undergroundEnding`, `undergroundLord`, `undergroundWhisper`, `undergroundVision`,
`undergroundSluice`. Komendy wtyczki: Otwórz zejście, Zamknij zejście, Idź na piętro (0-100), Skrót z pieśni znany.

## F9 (Debug.js, zakładka Zdarzenia)

- „Podziemia: piętro N (nazwa)” - ←→ wybiera 0-100 (z Shiftem o 10), OK przenosi przed schody w górę tego piętra;
- „Podziemia: zejście z piwnicy otwarte/zamknięte” - przełącznik 11;
- „Podziemia: zamki Serca na próbę” - klucz, dzwon i pieśń znane bez questów (do sprawdzania piętra 100);
- „Podziemia: wszystkie przystanki windy” - kołowroty 10-90 poruszone.

## Narzędzia (tools/underground/)

| Plik | Co robi |
|---|---|
| `build.py` | `python tools/underground/build.py [--preview DIR] [--seed N] [--install] [--force]` - buduje wszystkie mapy podziemi (9, 10, 11, 130-153), flagi tilesetu 10, tileset 12, wpisy MapInfos, nazwy przełączników; sprawdza kawałki i piętra ręczne; `--install` pisze do `data/` (odmawia przy otwartym edytorze; kopie w `backup_art_2026-10-06/underground/`) |
| `chunks.py` | kawałki pasma 1 (klasa `Chunk`) |
| `chunks_deep.py` | `XChunk` (woda, wodospady, szepty, zjawy, świece, skały) i budowa biblioteki pasma |
| `chunks_b2.py` ... `chunks_b5.py` | kawałki pasm 2-5 |
| `places.py` | piwnica, Ruiny Zamku, piętro 10, skorupy pięter 1-9 |
| `places_deep.py` | skorupa pięter 11-99, piętra 20-90, Komnata Serca |
| `uglib.py` | mapa podziemi (tileset 10 albo 12), katalogi rekwizytów `PIECES` / `PIECES_IN`, rysowanie obrazków map |
| `flags10.py` | flagi przejść tilesetów 10 i 12 |
| `make_props.py` | `!Underground_Props`, `!$Ug_Guardian`, `!Ug_Reliefs`, `!$Ug_Bell`, `!$Ug_SongStone`, `!$Ug_Lock`, `!$Ug_Heart`; kopiuje `!Decoration2_blue`, `!wagon` |
| `check_chunks.js` | sprawdzenie kawałków biblioteki (to samo co w grze) |
| `check_places.js` | sprawdzenie pięter ręcznych: droga od schodów w górę do schodów w dół, windy, zapisków; Serce tylko za drzwiami |
| `preview.js` | piętra jednego ziarna z generatora gry (Node) do obrazków, dowolne pasmo |
| `heart_gif.py` | GIF zniszczenia Serca (`docs/podziemia/serce_zniszczenie.gif`) z klatek, które zostawia `tests/heart_test.js` |
| `dev_band.py`, `dev_floor.py` | podgląd przy rysowaniu: biblioteka pasma / piętro ręczne do `staging/` |

## Grafika

- Z zestawów Winlu (posiadane): tileset 10 (Dungeon), meble Interior C w tilesecie 12, postacie lochu w `img/characters/`
  (od teraz także `!Decoration2_blue` - niebieskie płomienie - i `!wagon` - wózki kopaczy).
- **PixelLab** (styl Winlu, 6 obrazków, ok. 30 generacji): trzy płaskorzeźby Pierwszych (`!Ug_Reliefs`: dwie postacie klęczące
  przed światłem; leżąca i nalewająca wodę do misy; jedna stojąca z nietkniętą twarzą wśród zatartych), kamienny dzwon z siedmioma
  nacięciami (`!$Ug_Bell`), kamień pustych wersów z krukiem (`!$Ug_SongStone`), tabliczka z krukiem i dziurką od klucza na
  postumencie (`!$Ug_Lock`). Źródła w `tools/underground/art/`.
- Serce (`!$Ug_Heart`) - narysowane w kodzie (`make_props.py heart()`): oddychające światło, bez kształtu.

## Testy

- `node tests/unit/underground.test.js` (36 sprawdzeń) - biblioteki pięciu pasm (kawałki, ich sprawdzenie, rodzaje stworów z
  kontraktu), ziarno, piętra wszystkich pasm wielu ziaren (droga schody-schody, liczba pokoi, zapiski, poprawne autokafle,
  wodospady, bez dziur, < 860 zdarzeń), Warstwa Prawdy (szepty, zjawy, niebieskie płomienie), szum rzeki, mapy pięter ⇄ numery,
  zapiski 11-99 i opisy bossów, piętra ręczne 10-100 (drogi, bossowie, zamki, Serce tylko za drzwiami).
- `CDP_PORT=9466 node tests/run.js underground_test` (59 sprawdzeń) - w grze: wszystko pasma 1 jak dotąd oraz: piętro 10 ⇄ 11
  (mapa 1011 ze skorupy, tileset 12), to samo piętro po powrocie, droga na wszystkich piętrach 11-99 dwóch ziaren (162), piętro
  19 → 20, boss trzyma schody (i puszcza po `bossDefeated`), nowy przystanek windy (20) ⇄ Ruiny Zamku, piętra 30-90 osiągalne,
  woda na 40. nie do picia, źródło na 50., zapis/wczytanie na 57., Warstwa Prawdy na 85. (szept, chwila, zjawa Borgara, prawda w
  dzienniku), piętro 100 (zamki bez questów zamknięte; klucz W4 i Księga sygnałów W2 ze stanu TownQuests otwierają dwa zamki →
  drzwi; Serce i wybór; „Zapieczętować” → epilog → tawerna; potem pieczęć w komnacie), twórca stworów na piętrze ręcznym, F9.

- `CDP_PORT=9466 node tests/run.js heart_test` - świat (flagi questów, Akt III i jego zapas z flag, postawa Lorda), Lord nieobecny /
  sojusznik (pozwolić) / rywal (odmówić) / zapytać za niego (połowa prawdy), cztery zakończenia w różnych światach (zniszczyć - dobry,
  strażnik Borgar - zły, uwolnić - mieszany, strażnik ja - z F9), co zostaje w komnacie, wiersze F9, brak autozapisu w scenie; zrzuty
  `serce_*.png` i klatki GIF-a (`python tools/underground/heart_gif.py` → `serce_zniszczenie.gif`).

## Zrzuty (docs/podziemia/)

- Biblioteki: `kawalki_pasmo1.png` (+ `_siatka`), `kawalki_pasmo2..5.png`.
- Piętra ręczne: `pietro10_straznica_map140.png`, `pietro20_map146.png` ... `pietro90_map153.png`, `pietro100_map011.png`.
- Piętra składane jednego ziarna (20261006): `pietro1..9_ziarno20261006.png` oraz po pięć z każdego pasma - 11, 15, 19, 25, 29 /
  31, 35, 39, 45, 49 / 51, 57, 65, 71, 75 / 76, 79, 85, 95, 99.
- Z gry: `gra_piwnica_krata.png`, `gra_ruiny_zamku.png`, `gra_pietro1.png`, `gra_pietro10.png`, `gra_straznik.png`,
  `gra_ruiny_winda.png`, `gra_pietro11.png`, `gra_pietro20.png` ... `gra_pietro90.png`, `gra_pietro57.png`,
  `gra_pietro85_zjawa.png`, `gra_pietro100.png`, `gra_komnata_drzwi.png`, `gra_serce_wybor.png`, `gra_serce_zapieczetowane.png`.
- Lord i zakończenia (tests/heart_test.js): `serce_lord_sojusznik.png`, `serce_lord_odpowiedz.png`, `serce_lord_rywal.png`,
  `serce_lord_straznik.png`, `serce_zniszczone_cisza.png`, `serce_koniec_*.png` (dwór, obóz, dom, tawerna, rynek, Podgrodzie...),
  `serce_straznik_borgar.png`, `serce_borgar_na_lawie.png`, `serce_uwolnione.png`, `serce_straznik_ja.png`, `serce_rok_pozniej.png`,
  `serce_f9.png`, `serce_zniszczenie.gif`.

## Decyzje do potwierdzenia (2026-10-06)

- Piętra 11-99 jako mapy 1000+N bez plików (jedna skorupa) - zamiast 81 pustych map w edytorze.
- Map011 (Komnata Serca) przebudowana i przeniesiona pod Ruiny Zamku; Serce bez określonego kształtu (światło).
- Zamki: dowolne dwa z trzech otwierają drzwi, trzy dają dopisek w epilogu; zamek otwiera się tylko, gdy quest dał wiedzę. **Decyzja autora 2026-10-06: „dwa zamki wystarczą”.**
- Jedyna woda pitna pod ziemią: źródło na piętrze 50 (3 czerpania dziennie); rzeka i cysterna nie do picia.
- Strażnikiem w zakończeniu może zostać też Borgar (po „Słowach Borgara”) albo Ambroży (po oddaniu mu kronik). **Autor 2026-10-06: „obojętnie” - zostaje tak.**
- Po zakończeniu gra toczy się dalej (tawerna), komnata pamięta wybór. **Decyzja autora 2026-10-06: gra toczy się dalej.**
- (2026-10-07, do potwierdzenia) Lord przy Sercu: postawa z W1 (b - sojusznik, a - rywal) i z powiedzianej mu prawdy (W9 rozdz. 6);
  jego pytanie o syna **Kazimierza** i odpowiedź Serca („Tak. I nie.” - nazwał go raz tchórzem) to nowy kanon (QUESTY.md W7 rozdz. 7 to
  propozycja); W7 wariant A/B (czy Lord stoi za frakcją) dalej nierozstrzygnięty - sceny go nie dotykają.
- (2026-10-07) Strażnik Borgar / Ambroży: warta co trzy dni (jak w zapiskach 90a), więc dalej są w tawernie / na dzwonnicy.
- (2026-10-07) Po zakończeniu bohater śpi do 11:00 następnego dnia (sceny na górze w dzień; poza godzinami K37 na targu).
- Pasmo 1: rodzaje stworów zgodne z kontraktem (szczur, pająk); winda na każdym ręcznym piętrze; bossowie blokują schody tylko,
  gdy wtyczka stworów ich zarejestrowała.

## Czego jeszcze nie ma

- prawdy jako wybór w rozmowach (W9 rozdz. 6: powiedzieć prawdę mieszkańcowi czy przemilczeć) - dane i szyna są, rozmowy nie;
- otwarcie Zasuwy głównej sygnałem wody (W1 rozdz. 7 / W2) - jest miejsce i szyna `undergroundSluice`, skutek należy do questów;
- połączenie z kopalnią / obozem kopaczy w górach (W8) i Marek (W6 rozdz. 7) - tunel na piętrze 50 jest zawalony;
- rywal z zewnątrz w podziemiach (W9 rozdz. 3); alarm dzwonu i obrona tawerny (W2 rozdz. 8 / Akt III - osobna wtyczka Act3, sceny
  zakończeń czytają tylko jej wynik);
- ilustracje zakończeń (obrazki) - sceny grają na prawdziwych mapach; strażnik-bohater w dalszej grze to dalej „raz w roku” (jak było);
- mapa odkrywana w czasie chodzenia (minimapa z mgłą) - w podziemiach nie ma minimapy.
