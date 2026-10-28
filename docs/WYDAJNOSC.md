# Wydajność na średnim komputerze

Stan: 2026-10-24. Prośba gracza: „ma być super wydajnie na średnim kompie”. Zasada: **przyspieszamy kod, nie luzujemy progów
testów** (budżet w teście czerwony = nowa funkcja do przyspieszenia, nie próg do podniesienia).

Dwa etapy (oba 2026-10-24): **etap 1** - przyspieszenia, które nie zmieniają ani piksela; **etap 2** - po decyzji gracza („wszystkie
dalsze przyspieszenia”): rzadsze odświeżanie zdarzeń daleko poza ekranem, kępki trawy jako jedna siatka, kontur postaci bez filtra
na osobę, warstwa nocy rzadziej, filtry kolorów MZ w spoczynku wyłączone - z akceptowaną minimalną zmianą wyglądu (płynność
migotania ognia gdy nic się nie rusza, zaokrąglenie kolorów o ±1/255).

Zaczęło się od `tree_shadow_test`: cienie 335 drzew Kruczego Jaru kosztowały 1,0-1,2 ms na klatkę przy progu 1 ms. Przy okazji
cała gra została zmierzona tak, jak chodziłaby na średnim komputerze - i okazało się, że na najcięższych mapach (las, Kruczy Jar,
burza) taki komputer miał **ok. 10 klatek na sekundę, a świat gry szedł w zwolnionym tempie** (MZ robi najwyżej 2 kroki gry na
narysowaną klatkę: przy 10 kl/s gra szła z ok. 1/3 prędkości).

## Jak mierzymy

- Komputer testowy jest szybki (RTX 5070, 20 wątków). **Średni komputer udajemy, spowalniając procesor 4×** (CDP
  `Emulation.setCPUThrottlingRate`, rate 4) w przeglądarce testów (Edge bez okna, karta graficzna przez ANGLE/D3D11 - jej nie
  dławimy; mierzymy stronę procesora).
- W stronie gry: każda narysowana klatka = jej kroki gry (`SceneManager.updateMain`, średnia jednego) + rysowanie
  (`Graphics._app.render`). **„Klatka” = jeden krok gry + jedno rysowanie** (ms): przy 60 kl/s cała klatka musi się zmieścić w
  16,7 ms (z pracą przeglądarki - realnie ok. 14-15 ms). **„kl/s”** = ile klatek naprawdę narysowano w sekundzie.
- Miejsca (`tools/wydajnosc/pomiar.js`): **jar** - Kruczy Jar (Map003, nowa gra, dzień 40, południe; 335 drzew, kamienie,
  krzaki); **farma** - zapis `tests/fixtures/day40_farm` (działka z ~25 budynkami, 17:00); **miasto** - Map008 (rynek, 576
  zdarzeń, mieszkańcy); **las** - Leśna droga (Map021); **podgrodzie** - Map111; **labirynt** - podziemia, piętro 35 (80×60);
  **przystan** - Przystań (Map125) o 22:00 (latarnie, ogniska, warstwa nocy); **burza** - Kruczy Jar w szalejącej burzy (deszcz,
  liście, pioruny). Każde: **stoi** (bohater stoi) i **idzie** (chodzi w prawo i w lewo, mapa się przewija - najcięższy przypadek).
- „Przed” = pliki `js/` takie jak w gicie (HEAD z 2026-10-24 rano), podane przeglądarce zamiast obecnych (`pomiar.js --przed HEAD`);
  „po” = stan po obu etapach. Każde miejsce: „przed” i zaraz po nim „po” (na przemian, żeby obciążenie komputera było podobne),
  całość dwa razy, w każdym 3 rundy po 240 klatek - w tabeli **mediana z 6 rund**.
- Komputer był w tym czasie zajęty także innymi sesjami (pojedyncze rundy wahają się o ±10-20%, przy pomiarze dwóch przeglądarek
  naraz nawet 2×) - dlatego na przemian i mediana.

## Wyniki (CPU 4× wolniejsze)

Klatka = jeden krok gry + jedno rysowanie (ms, strona procesora); kl/s = klatki narysowane w sekundzie (przeglądarka testów bez
okna nie czeka na odświeżenie ekranu, więc lekkie mapy pokazują ponad 60; na zwykłym ekranie 60 Hz gra rysuje najwyżej 60, a przy
klatce dłuższej niż ~16 ms schodzi w stronę 30).

**Bohater stoi:**

| miejsce | przed: klatka | przed: kl/s | po: klatka | po: kl/s | klatka szybciej |
|---|---:|---:|---:|---:|---:|
| Kruczy Jar (Map003, 335 drzew) | 43,9 ms | 15 | 13,7 ms | 68 | 3,2× |
| farma (zapis day40_farm, 17:00) | 47,8 ms | 14 | 18,3 ms | 36 | 2,6× |
| miasteczko (Map008) | 18,2 ms | 32 | 11,4 ms | 75 | 1,6× |
| las - Leśna droga (Map021) | 41,9 ms | 16 | 10,4 ms | 86 | 4,0× |
| Podgrodzie (Map111) | 14,3 ms | 67 | 8,1 ms | 96 | 1,8× |
| labirynt (podziemia, piętro 35) | 7,2 ms | 99 | 5,9 ms | 100 | 1,2× |
| Przystań nocą (Map125, 22:00) | 16,4 ms | 49 | 10,4 ms | 84 | 1,6× |
| burza (Kruczy Jar, szaleje) | 45,5 ms | 15 | 15,9 ms | 60 | 2,9× |

**Bohater idzie** (w prawo i w lewo, mapa się przewija - najcięższy przypadek):

| miejsce | przed: klatka | przed: kl/s | po: klatka | po: kl/s | klatka szybciej |
|---|---:|---:|---:|---:|---:|
| Kruczy Jar | 47,2 ms | 14 | 11,8 ms | 80 | 4,0× |
| farma | 51,2 ms | 13 | 16,9 ms | 57 | 3,0× |
| miasteczko | 19,3 ms | 30 | 9,5 ms | 92 | 2,0× |
| las - Leśna droga | 46,0 ms | 15 | 9,5 ms | 93 | 4,8× |
| Podgrodzie | 15,3 ms | 63 | 7,4 ms | 99 | 2,1× |
| labirynt | 7,9 ms | 95 | 5,4 ms | 100 | 1,5× |
| Przystań nocą | 18,1 ms | 43 | 10,1 ms | 86 | 1,8× |
| burza | 47,5 ms | 14 | 17,0 ms | 56 | 2,8× |

Najważniejsze:
- **Kruczy Jar i las mają na „średnim” komputerze 60 kl/s z zapasem** (11-14 ms klatki), **burza** jest na granicy (16-17 ms:
  56-60 kl/s), **farma** (dziesiątki budynków, złota godzina z długimi cieniami) ok. 17-18 ms.
- **Gra przestała iść w zwolnionym tempie.** Przed: na Kruczym Jarze, w lesie, na farmie i w burzy ok. 25-31 kroków gry na sekundę
  zamiast 60 (MZ robi najwyżej 2 kroki na narysowaną klatkę - świat szedł o połowę wolniej) przy 13-16 kl/s. Po: pełne 60.
- Po samym etapie 1 było (te same miejsca, idąc): Kruczy Jar 18,9 ms, las 18,8, burza 21,9, farma 20,9, miasteczko 13,7, Przystań 17,1
  (wtedy 30-35 kl/s na najcięższych) - etap 2 zabrał jeszcze 4-9 ms z najcięższych map.
- Pierwszy pomiar „przed” (rano, przy innym obciążeniu komputera) dał nawet: Kruczy Jar 60 ms / 11 kl/s, burza 72 ms / 9 kl/s.

Test `tests/wydajnosc_test.js` (budżety w `docs/TESTY.md`; lepszy z 3 pomiarów, przy wyłączonych zwierzętach i ptakach): Kruczy Jar
idąc ok. 12 ms (budżet 22), miasteczko idąc ok. 8,5 ms (15), Przystań nocą ok. 9 ms (14) - powrót do „przed” (ok. 47, 19 i 16,5 ms)
jest czerwony na wszystkich trzech.

## Cienie drzew

`tree_shadow_test` (bez dławienia, ten sam widok Kruczego Jaru w południe): klatka bez cieni / z cieniami 335 drzew:

| | bez cieni | z cieniami | koszt cieni |
|---|---:|---:|---:|
| przed | 8,3 ms | 9,35 ms | **1,05 ms** (próg 1 ms - raz zielony, raz czerwony) |
| po | 3,25-3,35 ms | 3,4-3,6 ms | **0,1-0,15 ms** (raz 0,25) |

Próg testu został 1 ms. Co dało cieniom tę różnicę (Sky.js, ChoppableTree_Render.js, CharacterPolish.js):

- **cień całkiem poza ekranem nie jest rysowany** (`renderable = false`; dalej „widoczny” dla reszty gry i testów, jego macierz
  `_matrix` liczona jak zawsze) i nie pyta chmur, czy go przykrywają - na ekranie jest kilkadziesiąt z 335;
- **macierz cienia wpisana wprost** do sprite'a (było `transform.setFromMatrix`: rozkład na pozycję, skalę, skos i obrót, które PIXI
  w następnej klatce składało z powrotem sinusami - ta sama macierz okrężną drogą) i tylko dla cienia na ekranie;
- **sylwetka pamiętana na sprite'cie** (`Sun.silhouetteOf`; wcześniej co klatkę nowy napis-klucz do pamięci sylwetek dla każdej
  rzeczy) i **jeden obiekt „zasłony” na rzecz** (`Sun.occluder(..., out)`; wcześniej nowy obiekt co klatkę);
- **warstwa cieni z polem filtra = ekran** (`filterArea`; wcześniej PIXI liczył co klatkę granice wszystkich cieni tylko po to, by
  przyciąć je do ekranu);
- **chmury**: daleka chmura odrzucona od razu po kwadracie odległości (pierwiastek tylko dla tych, które mogą przykryć);
- wiatr drzewa liczony raz na klatkę (pasy i cień biorą ten sam).

Liczenie tylko przy zmianie kąta słońca okazało się niepotrzebne: koszt zjadało to, co poza ekranem, i praca PIXI, nie samo słońce.

## Etap 2 (decyzja gracza)

- **Zdarzenia daleko poza ekranem odświeżane co 4. klatkę** (Wydajnosc.js, `opts.lazy`). Tylko zwykłe zdarzenia mapy
  (`Game_Event`): nigdy bohater, jego towarzysze, zwierzęta (Hunting), pies, ludzie (Humans), stwory (Creatures), orzeł, owce, bydło -
  mają własne klasy; nigdy padające / płonące drzewo, pękający kamień, posąg z czapką (TownQuests liczy jej spadek w sprite'cie).
  Logika gry (strony zdarzeń, ruch, liczniki, AI) idzie w `Game_Map.update` i nie jest ruszana - rzadziej odświeża się tylko obrazek.
  „Daleko” = poza marginesem: za dnia 128 px + zasięg cienia słońca dla wysokości rzeczy (jego długość teraz), nocą, w ciemnym wnętrzu
  i w błysku pioruna 512 px (dalej niż sięga jakiekolwiek światło - kształty rzeczy dla cieni od ognia zostają aktualne). Miejsce
  bierze się ze zdarzenia (gdzie jest w tej klatce), więc zbliżające się zdarzenie jest odświeżane co klatkę, zanim wejdzie w kadr.
  Odświeżanie rozłożone po klatkach (każdy sprite w swojej), dwa pierwsze odświeżenia zawsze.
- **Kępki trawy, kamyczki i kwiatki (GroundDetail.js) jako jedna siatka**: wszystkie obrazki kępek i plam w jednym atlasie
  (każdy raz, 2 px odstępu), jeden czworokąt na kępkę w tej samej kolejności (plamy pod kępkami), w pikselach mapy; przy przewijaniu
  przesuwa się cała siatka o `Math.round(-ox)` - to te same całe piksele, co sprite'y w `Math.round(wx - ox)`. Mapy zapętlone mają
  dawne sprite'y. Rzeczy do zbierania (kamienie, gałęzie, kołyszące się rośliny - Farming_Render) zostały osobno: poza ekranem i tak
  nie są rysowane, a rośliny kołyszą się każda swoją siatką.
- **Kontur postaci bez filtra na osobę** (CharacterPolish.js, `opts.outline`): zwykła postać (tylko jej klatka - bez znacznika nad
  głową, zamachu, połowy w krzakach; nie skalowana, nie obrócona; nie bohater, którego arkusz ubiera się na żywo) dostaje kontur jako
  obrazek pod sobą: te same ciemne piksele, które kładł filtr (każdy piksel obok postaci z czterech stron: 0,8 × najbardziej
  kryjący z sąsiadów, w kolorze konturu), rysowany tuż przed nią (ten sam z i y) - postać go przykrywa tak, jak filtr liczył
  „kolor + kontur × (1 - jej krycie)”. Reszta zostaje przy filtrze. Test porównuje obraz: 0 różnych bajtów.
- **Warstwa nocy (Farming_Render.js) co drugą klatkę, gdy nic się nie rusza** (`opts.night`): ten sam widok, te same światła i
  rzeczy w nich, ta sama ciemność - płomienie migoczą 30 razy na sekundę zamiast 60; cokolwiek się rusza (bohater, kamera, postać w
  świetle, piorun) - rysowana co klatkę jak dawniej. Ręczne / testowe wywołanie w tej samej klatce zawsze rysuje.
- **Filtry kolorów MZ w spoczynku wyłączone** (`opts.idleFilters`): ściemnianie sceny bez ściemniania, ton ekranu zero, brak
  błysku i jasność pełna, sprite bez odcienia / tonu / koloru mieszania (np. drzewo, które kiedyś mignęło przy uderzeniu - jego filtr
  zostawał włączony na zawsze) - każdy był pełnym przejściem po tym, co przykrywa; MZ prowadzi kolor przez HSL i z powrotem, więc
  wyłączenie zmienia piksele o najwyżej 1/255 (na zrzutach: ok. 43% pikseli o 1/255, żaden więcej).
- **Kołysanie pasów drzewa**: sinusy dwóch faz drzewa liczone raz na klatkę, dla pasa wzór na różnicę kątów z jego stałymi cos/sin
  (sprawdzone na 680 000 pasach: te same całe piksele).
- **Owocowe drzewa** (ChoppableTree.js, „fruit”): godzina gry to ułamek zmieniający się co klatkę, więc pętla miała działać „raz na
  godzinę”, a działała co klatkę - pełne `refresh()` każdego owocowego drzewa (szukanie strony od nowa). Teraz tylko samoprzełącznik
  owoców trzymany w zgodzie, jak robi to `refresh()` na początku; gdy się przełączy, MZ sam odświeża zdarzenia mapy - ta sama strona.

## Co zmieniono (etap 1)

- **Pasy drzew jako siatka (ChoppableTree_Render.js).** Drzewo kołysze się w poziomych pasach po 6 wierszy (25-40 pasów).
  Każdy pas był osobnym `Sprite` (przy 139 drzewach Kruczego Jaru ok. 4500 obiektów: transformacja, granice, rysowanie co
  klatkę). Teraz pasy to dane (`_treeStrips`: x, y, skala, kadr, obrazek - te same pola, z których korzystają testy i żar), a rysuje je
  jedna-dwie `PIXI.SimpleMesh` na drzewo (do 96 wierzchołków - w tej samej paczce rysowania co sprite'y; te same rogi na ekranie i
  w obrazku = te same piksele). Narożniki wysyłane tylko, gdy pas się przesunął; stałe pasa (miejsce, zgięcie) liczone raz.
- **Drzewo poza ekranem** (z zapasem na koronę i kołysanie) nie układa pasów i nie jest rysowane (`renderable`); nowy obrazek
  (owoce, spalone) zawsze tnie się na pasy od razu; płonące i padające drzewo zawsze idą pełną drogą.
- **Cienie** - patrz wyżej (Sky.js, ChoppableTree_Render.js, CharacterPolish.js).
- **Nowa wtyczka `Wydajnosc.js`** (zaraz pod TawernaCore, docs/ARCHITEKTURA.md): obrazki bez własnej aktualizacji i bez dzieci nie
  są wołane co klatkę (`Sprite.update`, `Tilemap.update` - tysiące pustych wywołań); filtry sceny mapy (ściemnianie, ton, błysk,
  Mood) z polem filtra = ekran (bez liczenia granic całej mapy co klatkę); postać/zdarzenie całe poza ekranem (zapas 160 px + jego
  rozmiar; nigdy bohater) nie jest rysowane - aktualizuje się jak zawsze; `DataManager.isItem/isWeapon/isArmor/isSkill`: obiekt z
  bazy na swoim miejscu - od razu „tak” (MZ szukał go w całej liście przy każdym liczeniu rzeczy w torbie; Equipment.js liczy każdą
  rzecz do ubrania kilka razy na klatkę). `Wydajnosc.opts` (`leaf`, `filterArea`, `cull`) wyłącza każde z osobna - test porównuje obraz.
- **TawernaCore.js:** `Tawerna.view.rect()` / `Tawerna.view.sees(x0, y0, x1, y1)` - co z mapy widać na ekranie (we współrzędnych
  sprite'ów postaci; z lotem orła, zoomem, drżeniem); z tego korzystają wszystkie odcięcia.
- **ChoppableTree_Objects.js:** `rockConfig` od razu z pamięci (wcześniej co klatkę dla każdego zdarzenia szukał po stronach obrazka
  i kopiował ustawienia, zanim zajrzał do pamięci); klucz przełącznika „spalone” trzymany na zdarzenie.
- **CharacterPolish.js:** `<Polish:off>` czytane raz na klatkę (nie dla każdego sprite'a), „czy to osoba” z pamięci nazw obrazków
  (było wyrażenie regularne dla każdego sprite'a co klatkę), sylwetka/zasłona/cień jak u drzew.
- **TownQuests.js:** miejsca zadań po mapie i id w Mapie (było `find` po całej liście dla każdego sprite'a co klatkę), klucz
  mieszkańca (`<Town:...>`) czytany raz na zdarzenie, lista aktywnych zadań czyta stan raz.
- **GroundDetail.js:** kępki trawy (ok. 2000 na dużej łące) bez aktualizacji dzieci; przy przewijaniu tylko rzędy przy ekranie.
- **Farming_Render.js:** kamienie i rośliny do zbierania poza ekranem nierysowane; maska ciepła świateł nocą (woda/ląd) trzymana,
  póki widok ten sam.
- **Narzędzia:** `tools/wydajnosc/pomiar.js` (pomiar i profil miejsc, `--przed REF`), `tests/wydajnosc_test.js` (budżety, ten sam obraz).

Nazwa mapy „Kinowy” (CleanHUD.js) też sprawdzona: rysuje swoje bitmapy raz przy wejściu, potem tylko przesuwa i rozjaśnia
sprite'y - co klatkę nic nie kosztuje (w profilach poniżej progu).

## Wygląd

- **Etap 1 nie zmienia ani piksela**, etap 2 - tylko o tyle, ile gracz przyjął (zaokrąglenie filtrów kolorów, płynność migotania
  gdy nic się nie rusza).
- **Zrzuty drzew przed/po** (Kruczy Jar, widok `tree_shadow_test`, klatka zamrożona: bez chmur, ten sam zegar i wiatr; „przed” =
  git HEAD, „po” = oba etapy): `docs/wydajnosc/drzewa_{rano,poludnie,wieczor}_przed_po.png` (cały ekran, pół rozmiaru) i
  `..._zblizenie.png` (drzewa i cienie w pełnym rozmiarze: przed | po | mapa różnic: szary = 1/255, czerwony = 2/255 i więcej).
  W południe i wieczorem: same szare punkty (zaokrąglenie filtrów kolorów) i ok. 280 pikseli HUD/motyla; rano dochodzi mgła, która
  dryfuje (tyle samo różni się zrzut tej samej wersji zrobiony dwa razy).
- **`tests/wydajnosc_test.js`:** zamrożona klatka narysowana z przyspieszeniami włączonymi i wyłączonymi (`leaf`, `filterArea`,
  `cull` - z nim odcinanie pasów drzew i cieni -, `lazy`, `outline`): Kruczy Jar tyle samo różnych bajtów co dwa rysunki tej samej
  wersji (coś, co się porusza samo), miasteczko z ludźmi na ekranie (kontury jako obrazki) - 0 różnych bajtów; filtry kolorów
  w spoczynku: różnice tylko o 1/255.

## Jakość grafiki (Opcje)

Stan: 2026-10-24. Wiersz **Opcje -> „Jakość grafiki”** (Wydajnosc.js, zaraz pod „Wygląd”, z wierszem opisu pod spodem: co dany
poziom wyłącza; A / D poziom, O w kółko, W / S przeskakują opis). Wybór trzymany w ustawieniach (`ConfigManager.gfxQuality`: 0
Automatycznie, 1 Wysoka, 2 Średnia, 3 Niska; `gfxAuto`: poziom, na którym stanęło Automatycznie), **działa od razu, bez restartu**
(trawa układa się na nowo, warstwa nocy zmienia rozmiar, filtr nastroju gaśnie w tej samej klatce). Jeden obiekt
`Tawerna.api("Wydajnosc").gfx` (też `Wydajnosc.gfx`) mówi wtyczkom, co rysować; `gfx.version` rośnie z każdą zmianą poziomu.
**Światła ognia zostają na każdym poziomie** (ognisko, latarnie, pochodnia: dziura w ciemności, ciepło, poświata ognia i migotanie)
- zasada gry „każde światło to ogień”.

| pole `gfx` | kto czyta | Wysoka | Średnia | Niska |
|---|---|---|---|---|
| `mood` | Mood.js (barwy pory dnia, winieta - cały filtr) | tak | tak | **nie** (filtr wyłączony: zero przejść po ekranie) |
| `bloom` | Mood.js (poświata świateł: 5 małych przejść + jasne) | tak | **nie** | nie |
| `particles` | pogoda MZ (krople, płatki: moc × udział), Storm.js (lecące liście) | 1 | 0,6 | 0,3 |
| `grass` | GroundDetail.js (kępki i plamy: udział kafelków; 0 = nic) | 1 | 0,5 | 0 |
| `critters` | Birds.js (ptaki przelotu / stada na ziemi - nigdy nalotu), Motyle.js (motyle, ćmy przy ogniu) | 1 | 0,5 | 0,34 |
| `lazyEvery` | Wydajnosc.js (zdarzenie daleko poza ekranem odświeżane co n-tą klatkę) | 4 | 8 | 8 |
| `smallShadows` | ChoppableTree_Render.js (cień słońca kamieni, krzaków, pieńków; drzewa i ludzie zostają) | tak | tak | **nie** |
| `fireShadows` | Farming_Render.js (cienie rzeczy w świetle ognisk i latarni nocą; wnętrza RoomLighting bez zmian) | tak | tak | **nie** |
| `nightScale` | Farming_Render.js (warstwa nocy rysowana w 1/n ekranu; 3 płótna co klatkę przy ruchu) | 2 | 3 | 4 |
| `skyFx` | Sky.js (promienie złotej godziny, poranna mgła) | tak | tak | **nie** |

**Automatycznie** (domyślne): czas między narysowanymi klatkami liczony w `Graphics._onTick` w oknach po 60 klatek (jedna przerwa
najwyżej 50 ms - pojedyncze zacięcie, wczytanie mapy, zapis nie decyduje; przerwa ponad sekundę - okno odrzucone; pierwsze 2 okna
po wejściu na mapę się nie liczą). **4 okna z rzędu poniżej 55 kl/s -> poziom niżej** (zapisane w `gfxAuto`, więc słabszy komputer
zaczyna tam, gdzie skończył). **Nigdy wyżej na tej samej mapie**; po zmianie mapy, gdy 3 okna trzymały >= 58 kl/s i własna praca
klatki (krok + rysowanie) nie przekraczała 9 ms - **jeden** poziom wyżej, jedna próba na mapę. Poziom, na który gra weszła i z którego
musiała zejść na tej samej mapie, dostaje kreskę; po dwóch kreskach nie jest już próbowany w tej sesji - **bez skakania w tę i z
powrotem**. Opis pod wierszem mówi, jaki poziom jest teraz („Teraz: Średnia”). Dziennik zmian: `Wydajnosc.quality.auto.state().log`;
progi: `quality.auto.tune({...})` (test skraca okna).

### Pomiary poziomów

`node tools/wydajnosc/pomiar.js jar burza farma miasto przystan --idzie --rundy 3 --poziomy` (port 9692): procesor 4× wolniejszy,
bohater idzie, **trzy poziomy na przemian na tej samej mapie** (Wysoka, Średnia, Niska, Wysoka, ...), mediana z 3 rund każdego.
Komputer był w tym czasie mocno zajęty innymi sesjami (klatki ok. 2× dłuższe niż w tabelach wyżej; pojedyncze rundy ±10-20%),
dlatego tylko przeplatanie na jednej mapie daje porównanie - liczby między miejscami nie są porównywalne z resztą dokumentu.

| miejsce (idąc, CPU 4×) | Wysoka: klatka / kl/s | Średnia | Niska | Niska szybciej |
|---|---:|---:|---:|---:|
| Kruczy Jar (Map003, południe) | 25,8 ms / 24 | 25,1 ms / 24 | 23,3 ms / 26 | 10% |
| burza (Kruczy Jar, szaleje) | 33,2 ms / 18 | 33,6 ms / 18 | 30,3 ms / 20 | 9% |
| farma (day40_farm, 17:00) | 37,1 ms / 16 | 33,5 ms / 18 | 33,2 ms / 18 | 11% |
| miasteczko (Map008) | 27,3 ms / 22 | 25,4 ms / 23 | 24,6 ms / 24 | 10% |
| Przystań nocą (Map125, 22:00) | 31,8 ms / 17 | 34,9 ms / 16 (szum) | 29,6 ms / 18 | 7% |

**Po stronie procesora poziomy dają 7-11%** (Niska) i 0-10% (Średnia): to, co zjada klatkę na średnim komputerze, to krok gry
(zdarzenia, zwierzęta, ścieżki, haki sprite'ów - „Co jeszcze kosztuje” niżej), a nie efekty obrazu. Efekty obrazu obciążają za to
**kartę graficzną** (pełnoekranowe przejścia nastroju i poświaty, wysyłanie płócien nocy, wypełnianie ekranu deszczem, mgłą i
trawą) - tego dławienie procesora na komputerze z RTX 5070 nie pokazuje; patrz pomiar SwiftShader niżej.

### Co daje każdy efekt z osobna

`pomiar.js przystan jar burza --idzie --rundy 2 --efekty`: każde pole `gfx` samo, wartość Wysokiej (A) przeciw wartości Niskiej (B),
na przemian A, B, A, B na tej samej mapie; różnica median (ms klatki przy CPU 4×). Przebieg bez `--cicho` - życie gry (ćmy przy
ogniach, zwierzęta, ludzie) zmieniało obciążenie z rundy na rundę, więc **próg szumu to ok. 2-3 ms**: w tabeli tylko to, co wyszło
spójnie w obu parach rund albo wynika z kodu (0, gdy efektu na mapie nie ma).

| efekt (Wysoka -> Niska) | Przystań 22:00 | Kruczy Jar południe | burza | uwagi |
|---|---:|---:|---:|---|
| `bloom` poświata | 2,4 ms | 2,9 ms | 2,7 ms | **najpewniejszy zysk wszędzie**; w dzień prawie niewidoczna (bloom 0,25), nocą wyraźna |
| `mood` cały nastrój | 2,7 ms | 2,6 ms | 1,7 ms | (zawiera poświatę) barwy + winieta: ok. 0,5-1 ms ponad poświatę |
| `fireShadows` cienie od ognia | 3,2 ms | 0 | szum | nocą: sylwetki rzeczy w świetle każdej latarni i ogniska |
| `nightScale` 2 -> 4 | 2,0 ms | 0 | 3,3 ms | gdzie pracuje warstwa nocy (noc, burza ściemnia niebo) |
| `lazyEvery` 4 -> 8 | 3,3 ms | 1-3 ms (szum) | 1,0 ms | nocą margines „blisko” jest szeroki (512 px), więc więcej zdarzeń odświeża się co klatkę |
| `particles` 1 -> 0,3 | 0 (bez pogody) | 0 (bez pogody) | 1,8 ms | krople i liście w burzy |
| `grass` 1 -> 0 | 0,9 ms | 1,0 ms | 1,0 ms | jedna siatka: tanio po stronie CPU, koszt to wypełnianie ekranu |
| `critters`, `smallShadows`, `skyFx` | szum | szum | szum | ptaki/motyle to pojedyncze sprite'y; cienie kamieni i mgła/promienie poza swoją porą = 0 |

Stąd skład **Średniej**: bez poświaty (największy pewny zysk przy najmniejszej stracie wyglądu - ogień dalej świeci, zmienia się
tylko miękki blask wokół), noc w 1/3 ekranu, dalekie zdarzenia co 8. klatkę, połowa trawy, deszczu, ptaków i motyli (lżej dla karty
graficznej, charakter obrazu ten sam: barwy, winieta, wszystkie cienie, mgła i promienie zostają). **Niska** dokłada: bez nastroju w
ogóle, bez cieni od ognia i cieni kamieni/krzaków, bez trawy, mgły i promieni, noc w 1/4, 30% cząsteczek.

### Pomiar SwiftShader (słaba karta graficzna)

`CDP_GPU=0 node tools/wydajnosc/pomiar.js przystan burza jar farma miasto --idzie --rundy 2 --klatki 180 --dlawienie 1 --cicho
--poziomy`: przeglądarka rysuje programowo (SwiftShader, bez karty), procesor bez dławienia, życie gry wyciszone. Czas JS klatki
jest tu mały (rysowanie idzie w osobnym procesie), liczy się **ile klatek na sekundę karta nadąża narysować** - lepsza z 2 rund (w
pierwszej bywają zacięcia na kompilację shaderów):

| miejsce (idąc, SwiftShader) | Wysoka | Średnia | Niska |
|---|---:|---:|---:|
| Przystań nocą | 14,3 kl/s | 16,2 (+13%) | 18,5 (+29%) |
| burza | 17,1 | 17,9 (+5%) | 21,8 (+27%) |
| Kruczy Jar, południe | 22,3 | 22,5 (0%) | 28,9 (+30%) |
| farma 17:00 | 22,2 | 21,9 (0%) | 26,2 (+18%) |
| miasteczko | 27,9 | 28,2 (+1%) | 32,1 (+15%) |

Na słabej karcie **Niska daje 15-30% więcej klatek**, Średnia 5-13% tam, gdzie pracuje poświata i noc (noc, burza), w dzień nic (w
dzień poświata to 0,25 siły - prawie jej nie ma, więc i nie kosztuje). Pojedyncze efekty w tym trybie (Przystań: nastrój ok. +1
kl/s, reszta w szumie 2 rund) - **do dopomiaru** na spokojnym komputerze (`--efekty --rundy 3`); przebieg przerwano na prośbę gracza.

### Narzędzia i test

- `pomiar.js --jakosc wysoka|srednia|niska|auto` (poziom na czas pomiaru; domyślnie Wysoka, żeby pomiar sam nie zmieniał poziomu
  pod sobą; `auto` pokazuje, gdzie Automatycznie stanęło), `--poziomy` (trzy poziomy na przemian), `--efekty` (każde pole osobno),
  `--cicho` (bez życia gry: do porównań A/B), `CDP_GPU=0 ... --dlawienie 1` (rysowanie programowe SwiftShader).
- `tests/jakosc_grafiki_test.js` (port 9494): presety, zapis w ustawieniach, każdy poziom od razu (trawa, deszcz, nastrój, cienie,
  noc, ptaki, mgła), zamrożona klatka Wysoka -> Niska -> Wysoka = ten sam obraz, Przystań nocą (światła zostają, cieni nie ma),
  Automatycznie (schodzi przy sztucznie wolnej klatce, nie wraca na tej samej mapie, wraca po zmianie mapy, kreski), Opcje
  klawiszami. **Wszystkie testy idą na Wysokiej** (kit.js ustawia ją po starcie strony) - obraz jak dotąd.

## Co jeszcze kosztuje

Po obu etapach, Kruczy Jar, CPU 4× wolniejsze: krok gry ok. 7-9 ms + rysowanie ok. 5 ms (na spokojnym komputerze). Największe:

| co | uwagi |
|---|---|
| sprite'y zdarzeń w kadrze i blisko niego (ok. 16 wtyczek w łańcuchu `Sprite_Character.update`) | drzewa w kadrze: układ pasów, cienie; reszta to drobne haki wtyczek dla każdego zdarzenia |
| `Game_Map.update` | zdarzenia, zwierzęta, pies; w miasteczku ścieżki mieszkańców (TownLife / path8) ok. 10% klatki |
| haki mapy TawernaCore (`runUpdaters`) | kilkanaście drobnych, każdy do 0,1 ms (Combat, Storm, Motyle, Humans, TownQuests, Krawedzie...) |
| HUD | ok. 0,5-0,7 ms |
| rzeczy do zbierania (Farming_Render) | kołyszące się rośliny w kadrze: każda swoja siatka, przeliczana co klatkę |
| farma o 17:00 | długie cienie = większy margin dla zdarzeń daleko (więcej odświeżanych co klatkę), dziesiątki budynków |
| warstwa nocy przy ruchu | 3 płótna pół ekranu malowane i wysyłane na kartę co klatkę, gdy coś się rusza |

**Co dalej można:**

1. Kołyszące się rośliny do zbierania jako jedna siatka (jak kępki trawy) - kilka dziesiątych ms w kadrze pełnym roślin.
2. Jeden rozdzielacz haków sprite'ów w TawernaCore (każda wtyczka zgłasza, dla jakich zdarzeń działa) zamiast 16 owinięć
   `Sprite_Character.update` - zysk dla wszystkiego w kadrze.
3. Warstwa nocy przy ruchu: rysowana w pikselach mapy i przesuwana z kamerą między przemalowaniami - wymagałoby zgody (światło
   pochodni idącego bohatera o klatkę spóźnione).
4. Farma: budynki (Farming_Render) - przejrzeć ich aktualizację co klatkę.

## Zalecenia dla nowych funkcji

0. **Zdarzenie daleko poza ekranem odświeża się co 4. klatkę** (Wydajnosc.js). Nowy kod, który czyta stan sprite'a innego zdarzenia
   (jego x, y, klatkę, widoczność), może dostać stan sprzed 1-3 klatek, jeśli to zdarzenie jest daleko; logika gry nie powinna czytać
   sprite'ów (stan jest w `Game_Event`). Licznik animacji liczony w sprite'cie (jak czapka posągu) - wyłączyć sprite z leniwego
   odświeżania (patrz `lazyNow` w Wydajnosc.js) albo liczyć w zdarzeniu.
1. **Nic co klatkę dla tego, czego nie widać.** `Tawerna.view.sees(x0, y0, x1, y1)` (TawernaCore) - prostokąt we
   współrzędnych sprite'ów postaci (tilemapy) dotyka ekranu? Lot orła, zoom i drżenie ekranu są w nim policzone. Odcinając
   rysowanie, ustawiaj **`renderable = false`**, nie `visible`: `visible` znaczy dla reszty gry i testów „pokazane”.
   `Wydajnosc.opts.cull = false` wyłącza wszystkie takie odcięcia (porównanie obrazu w teście).
2. **Żadnych nowych obiektów ani napisów-kluczy w pętli klatki** dla każdej rzeczy na mapie (`a + "," + b` jako klucz do
   Mapy, `[mapa, id, "D"]`, `{...}`, `filter`/`map` co klatkę). Wynik trzymaj na obiekcie (`sprite._memo`, z tym, od czego zależy)
   albo w `WeakMap`; obiekt wyniku używaj ponownie (`Sun.occluder(..., out)`).
3. **Szukanie w liście co klatkę → indeks.** `list.find(...)` dla każdego zdarzenia, `$gameMap.eventsXy` w pętli,
   `$dataItems.includes` (MZ: każde `numItems`) - to setki tysięcy porównań na klatkę. Mapa / tablica zbudowana raz.
4. **Wiele małych obrazków jednej rzeczy → jedna siatka.** Drzewo to 25-40 pasów: jako osobne `Sprite` każdy miał swoją
   transformację, granice i rysowanie co klatkę; teraz to dane rysowane `PIXI.SimpleMesh` (do 100 wierzchołków siatka idzie w tej
   samej paczce co sprite'y - jedno wywołanie rysowania dla wielu drzew).
5. **Filtr na dużym kontenerze → `filterArea`** (ekran: `Graphics._app.renderer.screen`). Bez niego PIXI co klatkę liczy granice
   wszystkich dzieci tylko po to, by przyciąć je do ekranu.
6. **Bitmapę rysuj od nowa (i wysyłaj na kartę: `_baseTexture.update()`) tylko gdy coś się zmieniło** - klucz z tego, od czego
   zależy (pozycja widoku, godzina, liczba...).
7. **Haki na `Sprite_Character.update` / `updatePosition` / `updateFrame` idą dla każdego zdarzenia** (Kruczy Jar 386, miasteczko
   576, ok. 16 wtyczek w łańcuchu): najpierw tani warunek i wyjście, notatki zdarzeń czytane raz (WeakMap), żadnych wyrażeń
   regularnych co klatkę.
8. **Filtr na sprite'cie** to pełne przejście (przerwana paczka, tekstura do narysowania i odczytu) dla każdego takiego sprite'a w
   każdej klatce - lepiej obrazek przygotowany raz (jak kontur postaci) albo wyłączony filtr, gdy nic nie zmienia (`filter.enabled`).
9. **Mierz.** `node tests/run.js wydajnosc_test` (budżety na ciężkich mapach), `node tools/wydajnosc/pomiar.js jar --idzie --profil`
   (gdzie idzie czas: plik `.txt` z drzewem wywołań, `.cpuprofile` do DevTools), `--przed HEAD` - porównanie z tym, co w gicie.
