# Miasteczko wokół tawerny

Stan: **nic nie jest zainstalowane.** `data/`, `js/`, `img/` i `System.json` są nietknięte - wszystko leży w
`tools/town/staging/` i tutaj. Instalacja dopiero po akceptacji obrazka (i przy zamkniętym edytorze).

## Wybrane: koncepcja C z prefabrykatów autora + mury dookoła (29.09, późny wieczór)

Obrazki: **`miasteczko_C.png`** (cała mapa z podpisami), `miasteczko_C_czysta.png` (bez podpisów), `miasteczko_C_blokady.png`
(co zamyka drogę), zrzuty z gry w dzień 1280x720: `miasteczko_C_gra_1.png` (brama twierdzy i schody), `_gra_2` (rynek),
`_gra_3` (dziedziniec z tawerną), `_gra_4` (taras rzemieślników).

**Twoje decyzje, które są już w mapie:**
1. Układ C „Tarasy na wzgórzu twierdzy”, rozmiar 52 x 59 pól (4,3 razy dzisiejsza mapa).
2. Wszystkie budynki to **prefabrykaty autora** (kafelek po kafelku z jego map), na **tilesecie 11** (= tileset autora).
3. **Mury miejskie dookoła** przy każdej krawędzi: mury z blankami i chodnikiem, okrągłe baszty w narożnikach i wzdłuż murów,
   **brama miejska** na południu (wyjście na Polną drogę, między dwiema basztami) i **brama wschodnia** w murze (wyjście do
   dworu Lorda, też między basztami). Krawędź mapy jest zamknięta wszędzie poza bramami (sprawdzone).
4. **Stary młyn** stoi na dolnym tarasie nad **wyschniętym korytem** (koło stoi), ma drzwi - wnętrze w etapie wnętrz.
5. **Posterunek straży Lorda** w barwach Lorda: czerwona chorągiew z czarnym koniem (czerwień jak dachy i tarcza nad bramą
   dworu). Stare chorągwie zakonu (ciemne z czerwonym kręgiem) wiszą na świątyni.
6. **Wodziarz tylko rozmawia** - wody nie sprzedaje (susza zostaje); siedzi przy suchej studni z pustymi beczkami.
7. **Drzewa w mieście ozdobne** (nie do ścięcia, blokują pole pnia). Poza murami tej mapy nie ma już zielonych brzegów, więc
   ścinalnych drzew tu nie ma - są na łąkach i drogach obok.

**Co jest gdzie (od góry):**
- **Dziedziniec twierdzy** (za murem północnym): Świątynia (dawna kaplica zakonu, posągi strażników), **Tawerna** (bez zmian,
  drzwi -> Map001), zaplecze tawerny (drewutnia, beczki, wózek), Kamienice w murach, wieża z niebieskim hełmem, groby strażników
  zakonu, Chata grabarza, ogródek piwny; **obóz uchodźców** pod murem twierdzy przy świątyni (namioty, ognisko z kociołkiem,
  pranie).
- **Brama twierdzy**: dwie baszty (niebieski i łupkowy hełm), posągi strażników, cztery kosze żarowe, schody w dół przez skałę.
- **Rynek** (środkowy taras): sucha studnia, stragany (warzywa, starzyzna, sukno), ławka, drzewo, latarnie, tablica sołtysa;
  w jednej linii fasad: Piekarnia, Dom z lukarnami, Kantor „Towary z kontynentu”, Szewc i krawiec; po wschodniej stronie Ratusz
  i Dom przy bramie; brama wschodnia do dworu Lorda.
- **Skalna krawędź wzgórza** (skała autora, nie jedna prosta linia) z dwojgiem schodów.
- **Taras rzemieślników** (dolny): Zielarnia (chata z bali), Stary młyn nad suchym korytem, ulica do bramy miejskiej, Posterunek
  straży Lorda, Kuźnia (otwarte palenisko; wejście za paleniskiem), Dom kupiecki.

**Budynki (15), z wnętrzem (9 + tawerna):** Tawerna, Świątynia, Piekarnia, Kantor, Szewc i krawiec, Ratusz, Zielarnia, Stary
młyn, Posterunek straży Lorda, Kuźnia. Bez wnętrza: Kamienice w murach, Chata grabarza, Dom z lukarnami, Dom przy bramie, Dom
kupiecki. Każdy ma zdarzenie drzwi (z wnętrzem: „Wnętrze powstanie w następnym etapie”).

**Kontrola** (`tools/town/check_miasteczko.py`, 0 błędów): nic, co wygląda na mur, dach, szczyt, skałę czy basztę, nie jest
osiągalne pieszo; każda niewidoczna blokada leży pod czymś widocznym; wszystkie drzwi, stragany, studnia i 15 miejsc postaci są
osiągalne od bramy miejskiej; brama wschodnia i drzwi tawerny też; brak wody; brak postaci RTP; krawędź mapy zamknięta poza
bramami. Zrzuty z gry: 7/7, bez błędów konsoli.

**Przejścia po instalacji (C):**

| mapa | zdarzenia | dziś -> Map008 | po instalacji |
|---|---|---|---|
| Map001 Tawerna (wyjście 49-51,83) | 10, 11, 12 | 13-15, 10 | 18-20, 14 |
| Map022 Polna droga (11-13,0) | 65, 66, 67 | 13-15, 22 | 24-26, 57 |
| Map024 Posiadłość Lorda (0,14-16) | 65, 66, 67 | 28, 10-12 | 50, 30-32 |

Na Map008: wyjścia na Polną drogę (id 1-3) na 24-26, 58; do dworu (id 4-6) na 51, 30-32; drzwi tawerny (id 7) na 19, 13 -
polecenia bez zmian. Do poprawienia przy instalacji: `tools/newstart/layout.py`, `tavern_layout.py`, `run_transfer_test.py`,
testy `story_test.js` i `tavern_interior_test.js` (współrzędne Map008 na sztywno).

**Instalacja (po akceptacji, przy zamkniętym edytorze):** `data/Map008.json` <- `tools/town/staging/Map008_C2.json`;
`data/Tilesets.json` <- `tools/town/staging/Tilesets_town.json` (dochodzi tylko tileset 11); do `img/characters/` skopiować:
`!$Smith`, `!$Big_Decoration`, `!$Gate_Cathedral1`, `!Flags_banner`, `!Fantasy_door2`, `!$Waterwheel` (paczka Winlu),
`!$Big_Trees_green` (wersja zielona), `!Town_Props` (`tools/town/staging/characters/` - stragany, namioty, sucha studnia);
potem cele przejść z tabeli i test przejść.

**Otwarte pytania:** (1) czy przy bramach mają stać zdarzenia-strażnicy od razu, czy dopiero z postaciami PixelLab;
(2) targ „w piątki” to na razie napis - mechanika później; (3) czy obóz uchodźców ma rosnąć z falami wojny (więcej namiotów
w kolejnych dniach).

---

Poniżej - historia: pierwsze trzy układy (A/B/C z budynkami z generatora), test wierności i prefabrykaty.

## Zmiana kierunku (29.09 wieczorem): budynki z prefabrykatów autora

Mapy A/B/C poniżej zostają jako **pomysły na układ** (gdzie rynek, ulice, tawerna, brama). Ich budynki były składane przez generator
i nie wyglądały jak na Twoich obrazkach - więc teraz budynki będą brane **wprost z map autora tilesetu**.

- **Mapy autora** (darmowe demo „Winlu Master Sample_maps”, w `tools/town/winlu_samples/` - tylko do wglądu) narysowane naszym
  rysownikiem: `winlu_probki/Map001..016.png`.
- **Test wierności** (`wiernosc_N.png`: Twój obrazek | nasz rysunek tej samej sceny):
  - **6.png (ulica miasteczka) = mapa autora Map010: 95% pikseli zgodnych** (różnią się tylko klatki animacji: dym, ogień, latarnie);
  - **11.png (młyn-karczma) = też Map010: 63%** - ta sama scena w trochę innej wersji mapy (autor ją później poprawiał);
  - 7, 8, 9, 10, 13 - tych scen nie ma w mapach demo (to zrzuty z innych map autora); obok każdej najbliższa mapa demo
    (7, 9 -> Map012; 8 -> Map008; 10 -> Map015; 13 -> Map016).
- **Przepisy autora** (jak buduje fasady, dachy, szczyty, mury, skały, co na której warstwie): `tools/town/RECIPES.md`.
  Najważniejsze: dach wysoki (4-5 rzędów), ściana niska (2-3); piętro = dwa różne rodzaje ściany jeden nad drugim; krzyżowe
  szczyty i przybudówki z arkusza Fantasy_Roofs; skrzynki kwiatów na dolnej połowie okna; zdarzenia z kafelkiem jako „piąta
  warstwa”; cienie z warstwy cieni.
- **22 prefabrykaty** (`tools/town/prefabs/*.json`, galeria `prefaby.png`): karczma szachulcowa, domy z lukarnami, sklep z wagą,
  kuźnie (otwarta, pod szczytem, na tarasie), kamienice, front twierdzy (świątynia/ratusz), brama zamkowa z basztami, mury z basztą,
  wieża z hełmem, mur z przejściem i posągami, młyn-karczma, spichlerz, chaty (strzecha, bale), kamienny dom z chorągwią
  (posterunek), kosze żarowe, studnia, wóz z sianem. Każdy skopiowany kafelek po kafelku (4 warstwy, cienie, zdarzenia).
- **Próba** (`proba_ulicy.png`): jedna ulica złożona tylko z prefabrykatów, fronty w jednej linii - wygląda jak u autora,
  wszystkie drzwi osiągalne, blokuje tylko to, co widać (flagi autora + jego puste zdarzenia pod paleniskiem itp.).
- **Tileset**: proponuję **nowy tileset 11 „Wilu Fantasy Town (Exterior)”** = dokładnie tileset autora (jego A2, arkusze C
  i Fantasy_Roofs, jego flagi przejścia) - tylko dla Okolic Tawerny. Tileset 9 zostaje bez zmian, bo jego A2 (A2_2_green) różni
  się od A2 autora w rodzajach 20, 28, 29, 31, 39, 46, 47, a nasze mapy ich używają (pole, łąki, drogi, podwórze, dwór) -
  zmiana tilesetu 9 zmieniłaby ich wygląd. Plik: `tools/town/staging/Tilesets_town.json` (instalacja przy zamkniętym edytorze).
  Ten pomysł zastępuje wcześniejszy (dołożenie C/E do tilesetu 9 - `staging/Tilesets.json`, użyty jeszcze w obrazkach A/B/C).
- **Drzewa w mieście - ustalone**: ozdobne (nie do ścięcia), blokują pole pnia, korona nad bohaterem; na zielonych brzegach mapy
  zdarzenia z Map003 (ścinalne), jak na łąkach.
- **Następny krok** (po Twojej decyzji): wybierasz układ (A, B, C albo mieszankę), a miasteczko jest składane z prefabrykatów -
  ciasno, fronty równo wzdłuż ulic, tarasy terenu, bez wielkich pustych trawników.

Grafiki z paczki Winlu, których prefabrykaty potrzebują, a których nie ma jeszcze w `img/characters` (skopiować przy instalacji):
`!$Smith` (kuźnie), `!$Big_Decoration` (hełmy wież), `!$Big_drawbridge_animated` (most bramy), `!$Gate_Cathedral1`,
`!Flags_banner`, `!Fantasy_door2`; do zieleni `!$Big_Trees`, `!$Big_Trees_green`, `!Decoration_vegetation`.

## Obrazki

| plik | co pokazuje |
|---|---|
| `porownanie_ABC.png` | trzy mapy obok siebie w tej samej skali |
| `koncepcja_A.png`, `_B`, `_C` | cała mapa 1:1 z podpisami: budynki (złote = z wnętrzem, drzwi w złotej ramce), miejsca postaci (niebieskie kółka z numerem), przejścia (czerwone ramki), legenda po prawej |
| `koncepcja_X_blokady.png` | co zamyka drogę: czerwone = niewidoczna blokada pod murem/dachem/płotem/skałą, pomarańczowe = obraz, który blokuje (rzecz, latarnia, drzewo, drzwi), fioletowe = kafelek zamknięty flagami tilesetu, zielone kropki = gdzie da się dojść pieszo od wyjścia na południe. Błędy (różowe: widać mur, a da się przejść; turkusowe: blokada nad niczym) - **zero w każdej koncepcji** |
| `koncepcja_X_czysta.png` | sama mapa, bez podpisów |
| `koncepcja_X_gra_1..4.png` | zrzuty z prawdziwej gry w dzień (koncepcja podana grze zamiast `data/`, bez instalowania) |
| `winlu_probki/MapNNN.png` | mapy autora tilesetu narysowane naszym rysownikiem |
| `wiernosc_6.png` ... `wiernosc_13.png` | test wierności: Twój obrazek obok naszego rysunku tej samej sceny (albo najbliższej mapy autora) |
| `prefaby.png` | 22 prefabrykaty: wzór u autora / sam prefabrykat / co blokuje |
| `proba_ulicy.png` | ulica złożona tylko z prefabrykatów + kontrola blokad i dojść |

## Wspólne dla wszystkich koncepcji

- **Okolice Tawerny (Map008)** rosną z 30 x 24 pól do 56 x 47 (A), 64 x 43 (B) albo 52 x 56 (C) - ok. 3,7-4 razy więcej.
- **Tawerna zostaje taka sama**: fasada z kafelków, drzwi (zdarzenie 7 -> Tawerna Map001 50,82, polecenia bez zmian), szyld z kuflem,
  latarnie na ścianie, lukarny, kominy, ławy i tablica ogłoszeń przed drzwiami, ogródek piwny, zaplecze (drewutnia, pniak, beczki,
  wózek), drogowskaz, palik do koni i siano - przeniesione w całości (zmienia się tylko położenie).
- **Usunięte z dzisiejszej mapy**: 3 sosny tuż za dachem (ścinalne, a drzewa w mieście mają być ozdobne) i 6 latarni na słupach
  (miasteczko ma swoje). Drzewa, krzaki i kamienie z brzegów dzisiejszej mapy zastępuje nowa zieleń.
- **Poprawka niewidzialnej ściany**: blokada „Tawerna” (zdarzenie 15) ma dziś `<Occupy:right=16,up=8>` - zamyka też rząd trawy za
  dachem. Na brzegu mapy tego nie widać, w miasteczku byłaby to niewidzialna ściana; w koncepcjach jest `up=7`.
- **Susza zostaje**: nigdzie nie ma wody. Na rynku stoi **sucha studnia** (studnia z paczki Winlu, woda przemalowana na spękany muł),
  wodę sprzedaje wodziarz z beczek. W A przez miasto biegnie **wyschnięty kanał młyński** z nieruchomym kołem młyna.
- **Budynki z kafelków Winlu**, w stylu tawerny: dachy (A3), ściany (A3/A4), okna ze skrzynkami kwiatów i kominy (B), krzyżowe
  szczyty dachów nad drzwiami (arkusz Fantasy_Roofs), lukarny ze skrzynkami kwiatów, wiszące szyldy (kowadło, waga, chleb,
  nożyczki, podkowa, mikstury, zbroja, miecz, zwój), latarnie na ścianach, bluszcz, beczki/skrzynie/worki/wozy (Fantasy_Outside_C),
  kosze żarowe, posągi strażników zakonu, chorągwie. Resztki **murów i baszt Twierdzy Kruczych Skał** w każdej koncepcji.
- **Tileset 9 dostaje dwa brakujące arkusze tej samej paczki** (tylko w pustych miejscach, więc żadna istniejąca mapa się nie
  zmienia - sprawdzone: żadna mapa na tilesecie 9 nie używa kafelków C ani E):
  - C = `Fantasy_Outside_C` (beczki, skrzynie, wozy, ławy, stoły, stojaki z bronią, kukły, siano, drewutnie...),
  - E = `Fantasy_Roofs` (szczyty dachów, markizy).
  - Flagi przejścia dla nich (tablica flag wydłużona z 2816 do 8192): rzeczy z C zamknięte, ich górne części i wszystko z E jako
    gwiazdka (rysowane nad postacią), płaskie rzeczy (grządki, plamy) przechodnie. Plik gotowy: `tools/town/staging/Tilesets.json`.
- **Blokady - zasada „co widać, to blokuje, niewidocznego nic nie blokuje”**:
  - ściany, dachy, mury, baszty, płoty i skalne krawędzie: niewidoczne zdarzenia z `<Occupy:...>` dokładnie pod nimi (jak „Płot
    zagrody” na Map020) - generator stawia je sam, prostokątami, tylko tam, gdzie jest twardy kafelek;
  - rzeczy-obrazki (stragany, namioty, posągi, latarnie, drzewa, drzwi, kuźnia): własne pole + `<Occupy>` na całą widoczną podstawę;
  - rzeczy z arkusza C: flagi tilesetu;
  - `tools/town/check_town.py` sprawdza to na każdej mapie (0 błędów) - obrazki `_blokady.png` są dowodem.
- **Drzewa w mieście są ozdobne** (Twoja decyzja): bez `<Tree>`, nie da się ich ściąć, blokują pole pnia, korona rysuje się nad
  bohaterem, gdy przechodzi za drzewem. Ozdobne krzaki i kamienie w mieście tak samo (bez `<Bush>`/`<Rock>`). **Na zielonych
  brzegach mapy** są zdarzenia z Map003 (ścinalne sosny, krzaki, kamienie) - jak na łąkach.
- **Drzwi**: każdy budynek ma zdarzenie drzwi. Budynki z wnętrzem (złote) mówią na razie „Wnętrze powstanie w następnym etapie”,
  domy bez wnętrza - „Drzwi zamknięte. Ktoś tu mieszka.” Później drzwi z wnętrzem dostaną przejście.
- **Wnętrza (8 + tawerna) - te same w każdej koncepcji**: Świątynia, Ratusz, Kuźnia, Kantor „Towary z kontynentu”, Piekarnia,
  Zielarnia, Szewc i krawiec, Posterunek garnizonu.
- **Postacie**: na razie tylko miejsca (niebieskie kółka), bez zdarzeń. Każda postać to później postać PixelLab w stylu bohatera.
- **Tablice**: tablica ogłoszeń tawerny zostaje przy drzwiach; do tego tablica sołtysa (zarządzenia, zlecenia, listy gończe).
- Targ „w każdy piątek” - na razie tylko stragany i napisy; sam dzień targowy to mechanika na później.

## Postacie (ta sama obsada, miejsca zależą od koncepcji)

| # | postać | rola | haczyk w fabule |
|---|---|---|---|
| 1 | Ojciec Hilary | kapłan, świątynia | Strzeże kronik o Kruczych Skałach; jednej księgi nie pokaże nikomu - „nie pytaj o to, czego nie chcesz wiedzieć”. |
| 2 | Sołtys Bogumił Wrona | sołtys, ratusz, zlecenia | Między garnizonem, dworem Lorda a uchodźcami - każdy chce od niego czegoś innego; w ratuszu trzyma księgę z planem dawnej twierdzy. |
| 3 | Pisarz Onufry | pisarz gminny przy tablicy sołtysa | Przybija zlecenia i listy gończe; za drobną opłatą „zapomina”, kto o co pytał. |
| 4 | Kowal Mirosław Żar | kuźnia | Garnizon zamawia u niego groty; w murze kuźni ma zawias ze starej bramy twierdzy, którego nie da się przetopić. |
| 5 | Kupiec Anzelm Morski | kantor „Towary z kontynentu” | Towar przypływa promem, ceny rosną z każdą bitwą; wie, kto płaci złotem z której strony wojny. |
| 6 | Piekarka Dorota | piekarnia | Wojsko rekwiruje zboże, chleb drożeje; u niej zbierają się plotki całego rynku. |
| 7 | Zielarka Jagna | zielarnia | Uczennica szeptuchy z bagien; leczy uchodźców za darmo i wypytuje Ozzy'ego o jego „widzenia”. |
| 8 | Szewc Tadeusz Dratwa | szewc i krawiec | Szyje buty żołnierzom i łata łachy uchodźców - słyszy obie strony wojny. |
| 9 | Wodziarz Maciek | wodziarz bez wody, przy suchej studni z pustymi beczkami (**tylko rozmowa** - ustalone) | Kiedyś nosił wodę ze studni; teraz tylko opowiada - starzy mówią, że „woda śpi pod wzgórzem” (cysterna zakonu). |
| 10 | Przekupka Hanka | stragan z warzywami (targ) | Kupuje plony od bohatera w dzień targowy - konkurencja dla Borgara. |
| 11 | Handlarz starzyzną Albin | stragan ze starociami | Sprzedaje „kamienie z twierdzy” i fałszywe odłamki Serca; jeden z nich okazuje się prawdziwym tropem. |
| 12 | Kapral Wit Sokołowski | posterunek straży Lorda (barwy Lorda - ustalone) | Liczy worki zboża i młodych mężczyzn; szuka dezertera, który ukrywa się między uchodźcami. |
| 13 | Strażnik bramy | żołnierz przy drodze / bramie | Sprawdza przybyszów z promu; za kufel u Borgara przymknie oko. |
| 14 | Ilona, uchodźczyni | obóz uchodźców | Szuka męża-dezertera; w zamian za pomoc zdradzi, co widziała na promie. |
| 15 | Bruno „Cichy” | obóz uchodźców | Dezerter pod fałszywym imieniem - kapral go szuka; może być sojusznikiem albo zdrajcą. |

(Borgar zostaje w tawernie, bez zmian.)

## Koncepcja A - Rynek pod tawerną (56 x 47)

**Pomysł.** Rynek zaczyna się tuż pod drzwiami tawerny: ogródek piwny wychodzi na plac, na środku sucha studnia, wokół stragany
targu i ławy. Pod rynkiem biegnie wyschnięty kanał młyński (stary młyn z nieruchomym kołem), przez niego drewniane mostki. Z rynku
ulice: na wschód do dworu Lorda, na południe do Polnej drogi, na zachód do świątyni; za tawerną mur twierdzy z dwiema basztami -
tawerna stoi tam, gdzie stała wieża główna.

**Budynki (18)**: 1 Tawerna, 2 **Świątynia** (kamień twierdzy, gotyckie okna, pochodnie, posągi strażników i kosze żarowe przed
wejściem, dzwonnica obok), 3 **Ratusz** (piętrowy, krzyżowy szczyt, chorągwie), 4 Stary młyn (bez wnętrza - do decyzji),
5 **Zielarnia**, 6 **Szewc i krawiec**, 7 **Kuźnia** (z otwartym paleniskiem, kowadło, szlifierka, stojak z bronią), 8 Dom,
9 Dom z kamieni twierdzy, 10 Dom, 11 **Piekarnia**, 12 **Kantor**, 13-15 Domy, 16 **Posterunek garnizonu** (z placem ćwiczeń
i namiotem żołnierzy), 17-18 Domy. Obóz uchodźców w rogu płd.-zach. pod resztką muru.

**Miejsca postaci**: kapłan (9,12), sołtys (46,14), pisarz (44,18), kowal (50,28), kupiec (36,38), piekarka (23,39),
zielarka (11,28), szewc (17,28), wodziarz (32,22), przekupka (19,22), starzyzna (22,22), kapral (36,46), strażnik (26,43),
Ilona (10,44), Bruno (14,45).

**Plusy**: tawerna jest naprawdę sercem miasta - wychodzisz z drzwi prosto na targ; najkrótsze drogi (tawerna - rynek - kuźnia -
kantor w kilku krokach); suchy kanał i stojący młyn opowiadają suszę bez słów. **Minusy**: dużo ruchu pod drzwiami (wieczorne
sceny przed tawerną dzielą miejsce z targiem); mur i baszty za tawerną są tylko tłem (mało „twierdzy” w samym mieście).

## Koncepcja B - Główna ulica (64 x 43)

**Pomysł.** Jedna długa ulica od południowej bramy (dawna brama twierdzy: dwie baszty i posągi strażników) do dworu Lorda na
wschodzie. W połowie, po północnej stronie, cofnięta tawerna - ulica rozszerza się przed nią w plac ze suchą studnią i targiem.
Wzdłuż ulicy zwarte pierzeje domów, za nimi zaułki; uchodźcy koczują w cieniu muru tuż za bramą. Mur za tawerną rozebrany na kamień.

**Budynki (20)**: 1 Tawerna, 2 **Świątynia**, 3 Dom, 4 **Ratusz**, 5-9 Domy za tawerną (w tym Dom z kamieni twierdzy),
10 **Posterunek garnizonu** (tuż przy bramie), 11 **Piekarnia**, 12 **Zielarnia**, 13 **Szewc i krawiec**, 14 **Kantor**,
15 **Kuźnia** (palenisko od ulicy), 16-20 Domy; plac ćwiczeń garnizonu w drugim rzędzie.

**Miejsca postaci**: kapłan (4,25), sołtys (58,25), pisarz (60,25), kowal (55,35), kupiec (46,34), piekarka (25,35),
zielarka (32,34), szewc (39,35), wodziarz (38,24), przekupka (31,22), starzyzna (42,22), kapral (21,34), strażnik (12,34),
Ilona (5,31), Bruno (8,33).

**Plusy**: najczytelniejsza droga dla gracza (wchodzisz bramą, idziesz jedną ulicą, po drodze wszystkie sklepy, na końcu dwór
Lorda); brama z basztami to mocny „próg” miasta i naturalne miejsce dla straży i uchodźców; najwięcej domów (20). **Minusy**:
najszersza mapa (dużo chodzenia w poprzek); rzemieślnicy po południowej stronie stoją „plecami” do ulicy (drzwi od zaułka).

## Koncepcja C - Tarasy na wzgórzu twierdzy (52 x 56)

**Pomysł.** Tawerna stoi na szczycie wzgórza, na dziedzińcu dawnej twierdzy, otoczona jej murami i basztami (za murami Urwisko
Kruków). Szerokie schody między dwiema basztami bramnymi (posągi strażników, kosze żarowe, chorągwie z krukiem) prowadzą w dół na
środkowy taras z rynkiem, suchą studnią i ratuszem - tu też droga do dworu Lorda. Niżej, za naturalną skalną krawędzią wzgórza
(nieregularną, z wybrzuszeniami jak w paczce - nie jedna prosta linia), dolny taras: rzemieślnicy, kuźnia, posterunek, obóz
uchodźców i droga na Polną drogę.

**Budynki (18)**: 1 Tawerna, 2 **Świątynia (dawna kaplica zakonu)** z posągami, 3 Dom w murach twierdzy (dawna kordegarda) i groby
strażników, 4 **Ratusz**, 5 **Piekarnia**, 6 Dom, 7 **Kantor**, 8 Dom, 9 **Zielarnia**, 10 **Szewc i krawiec**, 11 **Kuźnia**,
12-13 Domy, 14 **Posterunek garnizonu** (dolna droga, plac ćwiczeń), 15-18 Domy.

**Miejsca postaci**: kapłan (5,14), sołtys (42,31), pisarz (41,35), kowal (35,48), kupiec (7,36), piekarka (4,29),
zielarka (3,48), szewc (11,48), wodziarz (29,29), przekupka (16,26), starzyzna (20,26), kapral (21,55), strażnik (23,49),
Ilona (9,52), Bruno (4,52).

**Plusy**: najwięcej twierdzy - tawerna naprawdę stoi „na fundamentach”, a gracz codziennie przechodzi przez jej bramę; wyraźna
hierarchia (twierdza - rynek - rzemieślnicy - uchodźcy na dole); skała i schody dają głębię. **Minusy**: najwyższa mapa, schody
to wąskie gardła (dwa zejścia na dolny taras); droga do dworu Lorda wychodzi ze środkowego tarasu (inaczej niż dziś).

## Przejścia - co się zmieni po instalacji

Na samej Map008 przejścia zostają tymi samymi zdarzeniami (id 1-6, te same polecenia), tylko na nowych brzegach; drzwi tawerny
(id 7) - te same polecenia, nowe miejsce. Zmienić trzeba cele przejść **na innych mapach** (wszystkie przejścia do Map008 w grze -
sprawdzone, innych nie ma):

| mapa | zdarzenia | dziś prowadzą do Map008 | A | B | C |
|---|---|---|---|---|---|
| Map001 Tawerna | 10, 11, 12 (wyjście 49-51,83) | 13-15, 10 (w dół) | 27-29, 14 | 33-35, 19 | 24-26, 14 |
| Map022 Polna droga | 65, 66, 67 (11-13,0) | 13-15, 22 (w górę) | 27-29, 45 | 13-15, 41 | 24-26, 54 |
| Map024 Posiadłość Lorda | 65, 66, 67 (0,14-16) | 28, 10-12 (w lewo) | 54, 14-16 | 62, 25-27 | 50, 31-33 |

| Map008 | dziś | A | B | C |
|---|---|---|---|---|
| wyjście na Polną drogę (id 1-3) | 13-15, 23 | 27-29, 46 | 13-15, 42 | 24-26, 55 |
| wyjście do dworu Lorda (id 4-6) | 29, 10-12 | 55, 14-16 | 63, 25-27 | 51, 31-33 |
| drzwi tawerny (id 7) | 14, 9 | 28, 13 | 34, 18 | 25, 13 |

Do poprawienia razem z instalacją (współrzędne Map008 zapisane na sztywno):
- `tools/newstart/layout.py` (EDGES: krawędzie 8<->22 i 8<->24), `tools/newstart/tavern_layout.py` (GATE, GATE_TILES, EXITS,
  KEPT_TRANSFERS, BASE_SHA256), `tools/newstart/run_transfer_test.py` (rozmiar Map008);
- testy: `tests/story_test.js` (bohater stawiany na 14,10 przed drzwiami, drzwi na x 14), `tests/tavern_interior_test.js`
  (nowa gra na Map008 14,10; wyjście z tawerny na 13..15,10).

## Instalacja (po wyborze, przy zamkniętym edytorze)

1. `data/Map008.json` <- `tools/town/staging/Map008_<X>.json`.
2. `data/Tilesets.json` <- `tools/town/staging/Tilesets_town.json` (nowy tileset 11 = tileset autora; reszta pliku bez zmian), Map008 na tilesecie 11. (Stary wariant: `staging/Tilesets.json` = tileset 9 + C/E - już nie proponowany.)
3. Do `img/characters/` skopiować: `!Town_Props.png` (z `tools/town/staging/characters/`), `!$Gate_Cathedral1.png`, `!$Smith.png`,
   `!Flags_banner.png`, `!$Waterwheel.png` (tylko A) z paczki Winlu Exterior oraz `!$Big_Trees_green.png` z wersji zielonej.
4. Cele przejść na Map001 / Map022 / Map024 (tabela wyżej) i narzędzia/testy z listy.
5. Test przejść (`tools/newstart/run_transfer_test.py` po poprawce) i `node tests/run.js tavern_interior_test story_test`.

## Grafiki PixelLab, które by były potrzebne

Budynki: **żadnych** - wszystkie są z kafelków Winlu (w tym szczyty, lukarny, szyldy, mury, baszty, bramy). Potrzebne są głównie
postacie; rzeczy tylko tam, gdzie paczka nie ma odpowiednika.

| co | A | B | C | uwagi |
|---|---|---|---|---|
| 15 postaci z tabeli (postać w 8 kierunkach + chód, w stylu bohatera) | 15 | 15 | 15 | ok. 2-3 generacje na postać = 30-45 |
| postacie tła: 2 żołnierzy, 2 mieszczan, dziecko uchodźców | 5 | 5 | 5 | ok. 10-15 generacji |
| szyld piekarni z bochenkiem (paczka ma tylko okrągły „pieniądz”, dziś udaje chleb) | 1 | 1 | 1 | 1-2 generacje |
| chorągiew garnizonu we własnych barwach (dziś wilk z paczki) | 1 | 1 | 1 | 1-2 |
| chorągiew zakonu z krukiem (dziś orzeł z paczki) | - | - | 1 | 1-2 |
| wóz wodziarza z pustymi beczkami | 1 | 1 | 1 | 1-2 |
| kruki na murach (animowane, Urwisko Kruków) | - | - | 1 | 2-3 |
| ok. razem | **45-65** | **45-65** | **50-70** | głównie postacie |

(Popiersia do rozmów - jeśli postacie miasta mają je mieć jak Stach i bohater - to osobna pozycja, ok. 1-2 generacje na postać.)

## Pytania do Ciebie

1. Która koncepcja (A / B / C) - albo mieszanka (np. rynek z A + brama z basztami z B)?
2. Rozmiar: koncepcje wyszły 3,7-4 razy większe od dzisiejszej mapy (gęsta zabudowa potrzebuje miejsca). Zostawić czy ścisnąć do ~3x?
3. Tileset: czy Okolice Tawerny mogą dostać nowy tileset 11 (= tileset autora, z jego A2 i flagami), a tileset 9 zostaje bez zmian?
4. Stary młyn w A: dać mu wnętrze (9. wnętrze) czy zostawić jako tło?
5. Czy wodziarz ma naprawdę sprzedawać wodę (nowe wczesne źródło wody za pieniądze) - czy tylko rozmawiać? (Susza jest zamierzona,
   więc proponuję drogo i mało - do decyzji.)
6. Garnizon: czyje barwy (która strona wojny)? Na razie wilk z paczki.

## Narzędzia

`python tools/town/make_docs.py` - jedna komenda: mapy autora (`winlu.py`), test wierności (`fidelity.py`), prefabrykaty
(`prefabs.py`), tileset 11 (`town_tileset.py`), próba ulicy (`street_test.py`), a potem koncepcje A/B/C: rzeczy (`build_town_props.py`), tileset (`build_tileset.py`), mapy
(`build_town.py`), kontrola (`check_town.py`, przerywa przy błędzie), obrazki (`render_town.py` - rysowane w Pythonie, przy
powtórzeniu identyczne co do bajtu), nakładki dla gry (`make_overlay.py`). Z `--game` robi też zrzuty z gry (`shot_town.js`,
port CDP 9412). Nic z tego nie zapisuje `data/`, `js/` ani `img/`.
