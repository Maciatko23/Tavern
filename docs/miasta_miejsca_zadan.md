# Miejsca zadań miasteczka — mapy, przejścia i znaczniki

> 2026-10-05. Miejsca do wątków z `docs/QUESTY.md`: **W1** „Woda spod Kruczych Skał” (oranżeria, tylna furtka, nocny patrol),
> **W2** „Kod dzwonu” (płyta w ogrodzie rycerzy i Archiwum zakonu) i **K26** „Pierścionek w studni” (dno studni z zamurowanym
> kanałem i krukiem — to też poszlaka W1: „płynie, ale nie tutaj”).
> Tu są **tylko miejsca**: mapy, wejścia i wyjścia, obrazki i niewidoczne znaczniki. Logiki zadań nie ma — dopisze ją później
> agent questów (TownQuests, wstrzykiwane zdarzenia 951–959), korzystając ze znaczników i przełączników opisanych niżej.

Zrzuty z gry: `docs/miejsca_zadan/` (tabela na końcu). Narzędzia: `tools/quest_places/`. Test: `tests/quest_places_test.js`.

## 1. Jak czytać znaczniki

- Znacznik to puste zdarzenie o nazwie **`Miejsce: <klucz>`**: pod postacią, „przenikalne”, bez obrazka, bez poleceń.
  Nic nie robi i niczego nie zasłania — wskazuje tylko pole.
- **Kierunek obrazka strony** (2 dół, 4 lewo, 6 prawo, 8 góra) to kierunek, w którą stronę się tam patrzy (tak jak w TownLife:
  np. `krata_kruk` ma 8 — stojąc tam, patrzy się w górę, na kratę).
- Znaczniki „przed czymś” (krata, kroniki, pulpit, pompa, szuflada, drzwi) leżą na polu, **na którym stoi bohater**, z kierunkiem
  ku rzeczy. Znaczniki „na czymś” (lina, pierścionek, płyta, furtka) leżą na polu samej rzeczy — jeśli to pole jest zablokowane
  (lina), zdarzenie questu postawione tam powinno mieć priorytet „jak postacie” i wyzwalacz „przycisk akcji” (bohater podchodzi
  i naciska O, stojąc obok).
- Nazwy są unikalne na swojej mapie. Klucze nie kolidują z kluczami TownLife (`TownLife_Data.js`).

## 2. Nowe mapy

| Mapa | Nazwa (MapInfos) | Rodzic | Rozmiar | Tileset | Notatka mapy | Dźwięk |
|---|---|---|---|---|---|---|
| **Map118** | Dno studni | Map008 | 11 × 9 | 8 Wilu Fantasy Interior | `<Dust:off>` `<Dark:on>` `<DayNight:off>` `<Zoom:1.5>` `<DarkDay:150>` `<DarkNight:205>` `<Ambience:cave>` | muzyka miasta milknie (BGM pusty, autoodtwarzanie), Atmosphere.js: kapanie wody |
| **Map119** | Archiwum zakonu | Map008 | 15 × 11 | 8 Wilu Fantasy Interior | `<Dust:on>` `<Dark:on>` `<DayNight:off>` `<Zoom:1.5>` `<DarkDay:175>` `<DarkNight:175>` `<Ambience:interior>` | cisza (BGM pusty) |

Kolejność w drzewie map: 45 i 46 (po Podgrodziu i jego chatach). Żaden nowy tileset nie został dodany (tileset 10 „Wilu Fantasy
Dungeon” jest zdefiniowany, ale nie ma flag przejść — nie jest używany).

### Map118 „Dno studni”

Dno studni na rynku: szyb rozszerzony przez zakon w małą komorę z surowego kamienia (jak „Izba pod skałą”), wilgoć i mech na
ścianach, kamienie, stare wiadro. Pośrodku **płytka kałuża — obrazek** (zdarzenie pod postacią), **nie kafelek wody**: nie da się
z niej pić ani czerpać (na mapie nie ma ani jednego kafelka A1 i żadnego zdarzenia `<Studnia>`). W północnej ścianie **zamurowany
łuk kanału zakonu**: łuk z ciosów zamurowany później cegłą, w zworniku wyryty kruk, u stóp żelazna krata — za nią ciemna woda.
Światło: za dnia smuga z szybu (stożek z pyłkami) i miękka plama na kałuży, nocą słaba poświata księżyca; w kątach mrok.

| Id | Zdarzenie | Pole | Co robi |
|---|---|---|---|
| 1 | Zamurowany kanał zakonu (kruk, krata) | 5,3 | obrazek na ścianie (3 pola szerokości, cała wysokość ściany), pod postacią |
| 2–4, 8–9 | Wilgoć i mech / Wilgoć / Mech | 2,3 · 8,3 · 3,3 · 2,7 · 7,4 | obrazki na ścianie i podłodze, pod postacią |
| 5, 6, 7 | Kamienie, Kamienie, Stare wiadro | 1,6 · 9,4 · 8,7 | obrazki, blokują swoje pole |
| 10 | Płytka kałuża | 5,6 | obrazek pod postacią, bez poleceń |
| 11–13 | światło z szybu (dzień) / (plama) / księżyc w szybie | 5,1 · 5,6 · 5,6 | `<LightCone ... when=day>`, `<Light:170,60,66,80><LightSoft><LightWhen:day>`, `<Light:96,22,28,46><LightSoft><LightWhen:night>` |
| 14 | **Lina (wyjście na górę)** | 7,5 | lina z szybu; blokuje; **O** → „Wspiąć się po linie na górę?” [Wspiąć się / Zostać] → Map008 (26,34), twarzą w lewo (do studni) |
| 15–17 | znaczniki | patrz tabela 4 | |

Lądowanie po zejściu: **(7,6)**, twarzą w dół (pod liną).

### Map119 „Archiwum zakonu”

Niskie sklepienie z surowego kamienia pod ogrodem rycerzy. W lewym górnym rogu kamienne schody w łuku (pod nimi wyryty kruk
zakonu) — to wyjście do ogrodu. Wzdłuż północnej ściany nisze z księgami, czarna chorągiew z krukiem nad pulpitem i wielki regał
kronik z drabiną. Pośrodku **pulpit z Księgą sygnałów** (otwarta księga między świecami) na czele gwiaździstej mozaiki w posadzce
(znak zakonu), obok dwa kandelabry. Posadzka ze spękanych płyt, kurz (`<Dust:on>` i plamy kurzu na podłodze), pajęczyny, rozsypane
kartki, stół z pergaminami i świecami, dwie skrzynie zakonu. **Każde światło to płomień** (świece i kandelabry, `<Light:...>` bez
`<LightWhen>` — palą się zawsze; migotanie dodaje RoomLighting).

| Id | Zdarzenie | Pole | Co robi |
|---|---|---|---|
| 1 | Schody do ogrodu rycerzy | 2,3 | obrazek (schody w łuku, `!House_Town`) |
| 2 | **Schody -> Ogród rycerzy** | 2,3 | jak postacie, **dotyk** (wejście w schody od dołu) → Map008 (6,13), twarzą w dół |
| 3 | kamienna płaskorzeźba z krukiem | 2,1 | obrazek na ścianie |
| 5 | stara czarna chorągiew z krukiem | 6,2 | obrazek na ścianie |
| 6 | Drabina przy regale | 12,4 | obrazek |
| 8 | **Pulpit z Księgą sygnałów** | 6,5 | `!$Altar` (animowane świece), blokuje, `<Light:150,130,90,34>`, bez poleceń |
| 10, 11 | Kandelabr | 4,5 · 8,5 | blokują, `<Light:150,130,90,34>` |
| 12, 15 | Świece / Świeca | 11,8 · 3,9 | na stole / na posadzce, `<Light:110,120,80,30>` / `<Light:90,110,76,28>` |
| 13, 14 | Okuta skrzynia zakonu, Skrzynia z pergaminami | 1,9 · 2,9 | obrazki, blokują, bez poleceń |
| 4, 7, 9 | znaczniki | patrz tabela 4 | |

Regał kronik to kafelki (C 0..4 × 6..8, pola 8–12 × 2–4), nisze z księgami to kafelki A5 na ścianie (4, 5, 7 × 2–3).
Lądowanie po zejściu: **(2,4)**, twarzą w dół (u stóp schodów).

## 3. Zmiany na istniejących mapach

### Map008 „Okolice Tawerny” (mapa użytkownika — tylko te trzy zdarzenia, nic więcej)

| Id | Zdarzenie | Pole | Strony |
|---|---|---|---|
| **245** | **Studnia miejska: zejście** | **25,34** (wschodnie kamienie studni; zablokowane pole) | jedna strona, jak postacie, bez obrazka, przycisk akcji. Bohater stoi na **(26,34) patrząc w lewo** (albo na (25,33) patrząc w dół) i naciska O. Jeśli ma **co najmniej 2× Lina** (przedmiot 93): dymek „Zejść po linie na dno studni?” z wyborem [Zejść / Zostać] → Map118 (7,6). Jeśli nie: dymek nad bohaterem `Tawerna.popup.need(ikona Liny, "Potrzebujesz 2× Lina, żeby zejść do studni.")`, bez okna wiadomości. Liny nie są zużywane. |
| **246** | **Płyta w ścieżce (ogród rycerzy)** | **6,12** (oś ogrodu, trzy pola na południe od miecza w kamieniu, u stóp kopca — w samo południe cienie posągów padają w tę stronę) | **strona 1** (bez warunków): nic — bez obrazka, pod postacią, przenikalna, bez poleceń (zwykła ziemia ścieżki; można po niej chodzić). **strona 2** (samoprzełącznik **A**): odsunięta płyta i schody w dół (`!Quest_Places` 1/2/0), jak postacie (blokuje), przycisk akcji → dźwięk kroków, Map119 (2,4). |
| **247** | Miejsce: plyta | 6,12 | znacznik |

Zdarzenia „Studnia miejska” 241/242 (przydział wody `<Studnia:2>`) zostały bez zmian. Wyjście ze studni ląduje na (26,34) twarzą
do studni; wyjście z archiwum na (6,13) twarzą w dół (tuż przy płycie, w środku ogrodu).

### Map024 „Posiadłość Lorda” — oranżeria

W południowo-zachodniej części ogrodu, przy zachodnim żywopłocie posiadłości, stoi **oranżeria**: budynek 5 × 5 pól (x 5–9,
y 19–23) z czerwonym dachem dworu (A3 rodzaj 56, 3 rzędy) i kamiennym parterem dworu (A4 rodzaj 105, 2 rzędy), z kominem pieca
(oranżerię trzeba grzać zimą) i dymem. Front to cztery łukowe okna z ołowianymi szybkami, za którymi widać drzewka pomarańczy, oraz
drzwi w takim samym kamiennym łuku z latarenką (świeci nocą). Przed nią **taras z bruku** (x 6–9, y 24–27) i ścieżka do placu
ogrodu (y 24, x 10–15). Na tarasie: **pompa ręczna na okrągłym kamiennym włazie z wyrytym krukiem** (wylewką w stronę furtki),
**stół ogrodnika z szufladą** (doniczki, kielnia, rafia), trzy drzewka pomarańczy w skrzyniach. W żywopłocie obok — **tylna
furtka** (5,25); za nią pas lasu (x 0–4), którym da się dojechać od drogi (zachodnia krawędź mapy, y 14–16) — tam w nocy może
stanąć wóz.

Region 2 (RegionLayers, „na równi”) leży na wszystkich 25 polach budynku. Pola za budynkiem (x 10) mają cień. Z tego miejsca
zniknęły dwa drzewa ogrodu (zdarzenia 96 na 9,21 i 98 na 9,27 — teraz puste wpisy); para po stronie wschodniej została.
Nienaruszone: drzwi dworu (zdarzenie 1 na 20,12), przejścia na zachodniej krawędzi (65–67), sosny, cała reszta ogrodu.

| Id | Zdarzenie | Pole | Co robi |
|---|---|---|---|
| 110–113 | Oranżeria: okno 1–4 | 5,23 · 6,23 · 8,23 · 9,23 | obrazki okien (pod postacią) |
| **114** | **Drzwi oranżerii** | **7,23** | obrazek drzwi z latarenką, `<Light:130,90,62,24><LightWhen:night>`; przycisk akcji → `Tawerna.popup("Zamknięte.")` (agent questów może dodać stronę „otwarte”) |
| 115 | Dym z komina (oranżeria) | 8,19 | `!Fantasy_chimney`, nad postacią |
| **116** | **Pompa na włazie z krukiem** | **6,26** | obrazek, blokuje, bez poleceń |
| **117** | **Stół ogrodnika (szuflada)** | **8,26** | obrazek 2 × 2 pola, `<Occupy:right=1,up=1>` (blokuje 8–9 × 25–26), bez poleceń; szuflada od południa |
| 118–120 | Drzewko pomarańczy 1–3 | 6,24 · 8,24 · 9,27 | obrazki, blokują |
| **121** | **Tylna furtka** | **5,25** | **strona 1**: zamknięta (blokuje), przycisk akcji → `Tawerna.popup("Furtka jest zamknięta.")`; **strona 2** (samoprzełącznik **A**): otwarta — skrzydło odchylone do ogrodu, pod postacią, przenikalna (można przejść) |
| 122–130 | znaczniki | patrz tabela 4 | |

**Nocny patrol strażnika** (`straz_1` → `straz_2` → `straz_3` → `straz_4` → `straz_1`): prostokąt wokół zachodniej części ogrodu —
wzdłuż wschodniej ściany oranżerii i krawędzi tarasu (x 10), północnej ścieżki ogrodu (y 19), zachodniej krawędzi placu (x 19) i
południowego żywopłotu (y 28). Każdy odcinek to prosta linia przechodnich pól (sprawdza test), więc strażnik może iść prosto albo
dowolnym szukaniem drogi. Z pól `straz_3` i `straz_2` taras oranżerii jest daleko — to okno na zakradnięcie się (W1 rozdz. 5).

### MapInfos.json

Dopisane wpisy 118 „Dno studni” i 119 „Archiwum zakonu” (rodzic 8, kolejność 45 i 46); pozostałe wiersze bez zmian.

## 4. Wszystkie znaczniki

| Klucz | Mapa | x | y | Kierunek | Co tam jest / do czego |
|---|---|---|---|---|---|
| `lina` | 118 | 7 | 5 | 2 | na linie (pole zablokowane przez linę) — droga na górę; tu agent może np. pokazać „lina zawiązana” |
| `pierscionek` | 118 | 5 | 6 | 2 | w kałuży (pole przechodnie) — tu leży pierścionek matki Zosi (K26); obrazek błysku pierścionka jest gotowy: `!Quest_Places` 0 / kier. 2 / wzór 2 |
| `krata_kruk` | 118 | 5 | 4 | 8 | przed kratą i zamurowanym łukiem z krukiem — tu się stoi, patrząc w górę (poszlaka W1, „płynie, ale nie tutaj”) |
| `schody` | 119 | 2 | 4 | 8 | u stóp schodów (tu się ląduje po zejściu) |
| `kroniki` | 119 | 10 | 5 | 8 | przed wielkim regałem kronik (8–12 × 2–4) |
| `ksiega_sygnalow` | 119 | 6 | 6 | 8 | przed pulpitem z Księgą sygnałów (pulpit na 6,5), na mozaice zakonu |
| `plyta` | 8 | 6 | 12 | 2 | na płycie w ścieżce ogrodu rycerzy (zdarzenie 246) |
| `oranzeria_wejscie` | 24 | 7 | 24 | 8 | przed drzwiami oranżerii (7,23) |
| `pompa_oranzeria` | 24 | 7 | 26 | 4 | obok pompy na włazie z krukiem (pompa na 6,26) — patrząc w lewo |
| `szuflada_ogrodnika` | 24 | 8 | 27 | 8 | przed szufladą stołu ogrodnika (stół 8–9 × 25–26) |
| `tylna_furtka` | 24 | 5 | 25 | 4 | na polu furtki (zamknięta blokuje; otwarta — przejście). Od środka stoi się na (6,25), od zewnątrz na (4,25) |
| `woz_furtka` | 24 | 3 | 24 | 6 | za żywopłotem, w pasie lasu — gdzie nocą może stanąć wóz (wolne pola 1–4 × 24, 4 × 25–27; sosny na 3,25 i 3,28) |
| `straz_1` | 24 | 10 | 19 | 6 | patrol: róg przy oranżerii (północ) |
| `straz_2` | 24 | 19 | 19 | 2 | patrol: północna ścieżka przy placu |
| `straz_3` | 24 | 19 | 28 | 4 | patrol: południe, przy placu |
| `straz_4` | 24 | 10 | 28 | 8 | patrol: róg przy tarasie oranżerii (południe) |

## 5. Przełączniki dla agenta questów

| Mapa | Zdarzenie | Samoprzełącznik | Skutek |
|---|---|---|---|
| Map008 | 246 „Płyta w ścieżce (ogród rycerzy)” | **A** | płyta odsunięta, schody w dół; O przy niej → Archiwum (Map119) |
| Map024 | 121 „Tylna furtka” | **A** | furtka otwarta (przejście przez żywopłot) |

Ustawianie z kodu: `$gameSelfSwitches.setValue([8, 246, "A"], true)` / `([24, 121, "A"], true)`. Lepiej szukać zdarzenia po nazwie
(id mogą się zmienić, jeśli ktoś przebuduje mapę w edytorze).

## 6. Przejścia

| Skąd | Jak | Dokąd |
|---|---|---|
| Map008 (26,34) / (25,33), zdarzenie 245 | O, 2× Lina, „Zejść” | Map118 (7,6), w dół |
| Map118 lina (7,5) | O, „Wspiąć się” | Map008 (26,34), w lewo |
| Map008 płyta (6,12), zdarzenie 246, strona 2 | O | Map119 (2,4), w dół |
| Map119 schody (2,3) | wejście w schody (dotyk) | Map008 (6,13), w dół |

Rejestr `tools/newstart/layout.py` obejmuje tylko drzwi i krawędzie map „nowego startu” (dom dziadka, drogi, miasto, dwór,
Podgrodzie) — nie wnętrza miasteczka; te przejścia są warunkowe (liny, przełącznik, przycisk akcji), więc do niego nie trafiły.
Sprawdza je `tests/quest_places_test.js`.

## 7. Obrazki

- `img/characters/!Quest_Places.png` (nowy; rysowany kodem w `tools/quest_places/art.py`, klatki 144 × 144 jak `!House_Town`):
  - indeks 0 (dno studni): kier. 2 — łuk kanału (wz. 0), kałuża (1), **błysk pierścionka** (2, dla questu); kier. 4 — lina (0),
    wilgoć i mech (1, 2); kier. 6 — kamienie (0), mech na podłodze (1), stare wiadro (2)
  - indeks 1: kier. 2 wz. 0 — odsunięta płyta ze schodami
  - indeks 2 (oranżeria): kier. 2 — pompa na włazie (0), stół ogrodnika (1), drzewko pomarańczy (2); kier. 4 — furtka zamknięta (0),
    otwarta (1), drzwi oranżerii (2); kier. 6 — okno oranżerii (0), lustrzane (1)
- `img/characters/!$Altar.png` (skopiowany z Winlu Interior Remaster: pulpit z otwartą księgą i świecami).

## 8. Narzędzia

```
python tools/quest_places/art.py                # obrazki (img/characters/!Quest_Places.png, kopia !$Altar.png)
python tools/quest_places/build.py              # na sucho: buduje 118/119 w tools/quest_places/staging, mówi, co zmieni
python tools/quest_places/build.py --preview D  # do tego obrazki map (statyczny render) w katalogu D
python tools/quest_places/build.py --install    # zapis do data/ (edytor RPG Maker MZ musi być zamknięty)
```

`places.py` — wnętrza 118/119, `patches.py` — zmiany Map008 / Map024 / MapInfos. Instalacja sprawdza, czy zapis odtwarza
pliki map bajt w bajt, robi kopie w `backup_art_2026-10-05/quest_places/` i jest powtarzalna (własne zdarzenia odnajduje po
nazwie; drugi raz niczego nie dubluje). Uwaga: przebudowa Map024 skryptem `tools/manor/build_manor.py` (pierwotny dwór)
usunęłaby oranżerię — po niej trzeba znowu uruchomić `build.py --install`.

## 9. Zrzuty (`docs/miejsca_zadan/`)

| Plik | Co |
|---|---|
| `zejscie_do_studni.png` | rynek: pytanie przy studni z wyborem „Zejść / Zostać” |
| `dno_studni_dzien.png`, `dno_studni_noc.png` | dno studni w dzień (smuga z szybu) i nocą |
| `plyta_otwarta.png` | ogród rycerzy z odsuniętą płytą |
| `archiwum.png`, `archiwum_noc.png` | Archiwum zakonu |
| `oranzeria_dzien.png`, `oranzeria_noc.png` | oranżeria w ogrodzie dworu, w dzień i nocą (latarenka przy drzwiach) |

## 10. Uwagi dla agenta questów

- Zejście do studni jest **z boku** studni (od wschodu: stojąc na (26,34) twarzą w lewo albo na (25,33) twarzą w dół); od frontu
  (24–25,36, twarzą w górę) dalej działa przydział wody. Warto pokazać graczowi to miejsce (np. romb TownQuests nad (25,34)).
  Zejście nie sprawdza pory dnia ani deszczu („za dnia, nie w deszcz” z K26) i nie zużywa lin — to do logiki questu.
- Płyta w ogrodzie leży na osi ogrodu, tuż przy wejściu przez furtkę (6,13 → 6,12). Na stronie 1 nie ma jej wcale; na stronie 2
  blokuje to pole, więc idąc od furtki trzeba ją obejść bokiem (5,12 / 7,12) — schodzi się dopiero przyciskiem O.
- Drzwi oranżerii są zawsze zamknięte (dymek). Wnętrza oranżerii ani gabinetu dworu (W7) nie ma.
- Furtka zamyka tylko przejście przez żywopłot; pas lasu za nią łączy się z drogą, więc i bez furtki da się dojść pod nią z
  zewnątrz (tam czeka wóz Kuby: `woz_furtka`).

---

# Góry (W8 „Żelazna Pięść”) — Góry i kamieniołom, Jaskinia, Osada Milczących

> 2026-10-06. Miejsca do wątku **W8** (rozdz. 2–6: przewodnik w góry, kamieniołom, obóz kopaczy, Osada Milczących, wybór
> Gruma) i do **W6 rozdz. 7** (Marek). Tu są **tylko miejsca**: mapy, przejścia, obrazki, niewidoczne znaczniki i dwa
> przełączniki. Logiki zadań nie ma — dopisze ją agent questów (TownQuests), szukając znaczników po nazwie
> `Miejsce: <klucz>` (zasady jak w rozdziale 1 wyżej: pod postacią, przenikalne, bez obrazka i poleceń; kierunek obrazka strony =
> w którą stronę się tam patrzy).

Narzędzia: `tools/mountains/` (opis niżej). Zrzuty: `docs/gory/`. Test: `tests/mountain_places_test.js` (21 sprawdzeń).

## G1. Mapy

| Mapa | Nazwa (MapInfos) | Rodzic | Rozmiar | Tileset | Notatka mapy | Dźwięk |
|---|---|---|---|---|---|---|
| **Map013** | Góry i kamieniołom | — | 60 × 48 | 11 (Winlu autora — jedyny nasz z klifami i ich flagami) | `<Clouds:on>` `<Hunt:rabbit=1,deer=1,wolf=3>` `<Bear:0.12>` `<Camp:off>` `<Poziom:5>` | BGM Field1 bez autoodtwarzania (jak drogi) |
| **Map014** | Jaskinia | 13 | 40 × 30 | 10 (Winlu Dungeon, jak jaskinie podziemi) | `<Dust:on>` `<Dark:on>` `<DayNight:off>` `<DarkDay:200>` `<DarkNight:210>` `<Ambience:cave>` `<Hunt:off>` `<Build:off>` `<Farm:off>` `<Minimap:off>` `<Humans:off>` `<Poziom:6>` | BGM cisza, BGS Drips 25% |
| **Map120** | Osada Milczących | 13 | 40 × 34 | 11 | `<Clouds:on>` `<Hunt:off>` `<Bear:off>` `<Camp:off>` `<Humans:off>` `<Farm:off>` `<Build:off>` `<Poziom:6>` | BGS Wind1 18% |

Mapy 13 i 14 były pustymi szkicami z RTP (kopie w `backup_art_2026-10-06/mountains/`); Map013 w drzewie edytora nazywa się teraz
„Góry i kamieniołom”. Nowe id: tylko **120** (wolne 120–129; podziemia mają 130–153).

**Zasada map zewnętrznych** (użytkownika): każda sosna, małe drzewo, pieniek, kłoda, skała, ruda i suchy krzak to zdarzenie
jednego z rodzajów z Map003 (ścina się / kopie jak na polu dziadka). Klify, schody i grunt są z tilesetu 11 (na tilesecie 9
z Map003 nie ma klifów z flagami). Zbieractwo (kamyki, len, zioła, krwawnik, pokrzywa, czosnek, gałęzie, krzaki z jagodami,
grzyby po deszczu) działa samo na trawie i ziemi Map013 — to są „górskie rośliny”. **Woda: żadnej** — staw w kamieniołomie jest
suchy (spękany muł, ości), koryto na podgórzu suche.

### Map013 „Góry i kamieniołom”

Od dołu: **podgórze** (poziom 0: łąka, sosny, głazy, suche koryto), z zachodu wchodzi ścieżka z Leśnej drogi. Ścieżka prowadzi
na **omszałe schody** (22–23, 31–32) na **trawiastą półkę** (poziom 1; sosny, stare palenisko kamieniarzy pod ścianą). Na
wschód od niej **kamieniołom zakonu** (dno x 34–59, y 16–28): ściana z wykutym **krukiem w kręgu** (40,16–17), znaki kamieniarzy
(36,17), **siedem nacięć** (52,22), **ciosane bloki** (część z krukiem), **ruina dźwigu** (49,26), **suchy staw** (35–40, 26–28),
ruda żelaza, gruz; stopień ciosanego kamienia w ścianie (x 46–53). **Schody kamieniarzy** (56–57, 17–18) prowadzą na **wysoką
półkę** (poziom 2: skały, niskie sosny, ruda, porzucony wózek kopaczy) pod **ścianą gór** (poziom 3, lico 4 pola wysokości, falujące).
W ścianie **wejście do jaskini** (44,7) z latarnią kopaczy (46,7). W północno-zachodnim rogu **wąwóz** między dwiema skałami
(x 5–7) zamknięty **Bramą Milczących** (5–7, 3); przed wąwozem kopczyk milczenia (4,10) i słup z zaszytymi ustami (8,10).

| Id | Zdarzenie | Pole | Co robi |
|---|---|---|---|
| 1–3 | Przejście -> Leśna droga | 0, 38–40 | dotyk → Map021 (38, 8–10), w lewo |
| **4** | **Wejście do jaskini** | **44,7** | `!$Mt_Cave` (wylot sztolni w drewnianej ramie), jak postacie, **dotyk** (wejście od dołu z 44,8) → Map014 (20,27), w górę |
| 5 | Latarnia kopaczy | 46,7 | płomień (`<Light>` + migotanie) |
| **6** | **Brama Milczących** | **6,3** (zajmuje 5–7) | `<Occupy:left=1,right=1>`; **strona 1**: zamknięta (blokuje), O → dymek „Brama z pali, zamknięta od środka…”; **strona 2** (**przełącznik 16**): otwarta, pod postacią, przenikalna |
| 7, 8 | Kopczyk milczenia, Słup z zaszytymi ustami | 4,10 · 8,10 | blokują, O → dymek |
| **9–11** | **Przejście -> Osada Milczących** | **5–7, 0** | strona 1: nic; strona 2 (**przełącznik 16**): dotyk → Map120 (19–21, 31), w górę |
| 12 | Kruk wykuty w ścianie kamieniołomu | 40,17 | rysunek na licu (2 pola), O → dymek |
| 13, 14 | Znaki kamieniarzy, Siedem nacięć | 36,17 · 52,22 | rysunki na licu, O → dymek |
| 15 | Ruina dźwigu | 49,26 | `!$Mt_Crane`, `<Occupy:right=1>` |
| 16–24 | Ciosane bloki (z krukiem) | 39,21 · 43,22 · 45,20 · 36,19 · 54,27 · 46,28 · 56,24 · 41,28 · 35,23 | `!$Mt_Blocks`, blokują, O → dymek |
| 25–27 | Suche trzciny / łodygi, **Suchy staw w kamieniołomie** | 35,27 · 39,26 · 37,27 | pod postacią; staw: O → dymek |
| 55 | Porzucony wózek | 47,10 (kafle C, `<Occupy:right=1>`) | blokuje |
| 56 | Stare palenisko kamieniarzy | 20,12 | zimne palenisko, O → dymek |
| 217–229 | znaczniki | tabela G4 | |

### Map014 „Jaskinia”

Wylot od dołu (19–21, 29) z dziennym światłem (miękkie, nie ogień, tylko za dnia). Wąskie gardło prowadzi do **groty obozu**:
trzy namioty (dwa kopaczy z płótna i skóry, **namiot dowódcy** 25,11), **ognisko** (18,16) z posłaniami dookoła, wózki z rudą
i węglem, worki rudy, skrzynie, beczki, latarnie na ścianach i kosz z ogniem przy tunelu — **każde światło to płomień**. Na
zachód **przekop** (tunel x 2–9, y 12–14, obity belkami) skręca na północ i kończy się **zawałem** w ścianie (3,9). W niszy
w północno-wschodnim rogu (x 27–32, y 5–8), pod niebieskimi kryształami w skale, **Marek** stoi twarzą do ściany.

Ludzie stoją (nie chodzą, nie walczą — notatka `<Humans:off>` wyłącza też nocne obozy bandytów). Walka to sprawa questów:
`Humans.spawn("mercenary", x, y, { tag: ..., engaged: true })` na znaczniku `straz_obozu` (i schowanie zdarzenia 19, np.
`$gameMap.event(19).erase()`), Grum w W8 rozdz. 6 przy `tunel_wejscie`.

| Id | Zdarzenie | Pole | Co robi |
|---|---|---|---|
| 1–3 | Przejście -> Góry i kamieniołom | 19–21, 29 | dotyk → Map013 (44,8), w dół |
| **4** | **Zawał przekopu** | **3,9** (lico ściany; staje się na 3,10) | **strona 1**: gruz po strop (`!$Mt_Cave` kier. 4), O → dymek „Zawał…”, przejścia nie ma; **strona 2** (**przełącznik 15**): przekop przebity (wylot w belkach), **dotyk** → Map149 piętro 50 (37,9), w dół |
| 7 | Ognisko kopaczy | 18,16 | płomień, blokuje |
| 8–10 | Namiot kopaczy ×2, **Namiot dowódcy** | 13,11 · 17,11 · 25,11 | `!$Mt_Tent`, `<Occupy:left=1,right=1,up=1>`, O → dymek |
| 5, 11–14 | wózki (`!wagon`), worki rudy | 6,14 · 27,18 · 29,19 · 25,20 · 23,21 | blokują |
| 6, 15–18 | Latarnie, Kosz z ogniem | 7,11 · 11,8 · 21,8 · 29,4 · 9,15 | płomienie |
| **19** | **Strażnik obozu** | **9,13**, w prawo | `$Human_Merc` (wygląd najemnika z Humans.js), O → dwie kwestie w dymku |
| **20–22** | **Kopacz** ×3 | 2,12 (w górę) · 20,18 (w górę) · 27,17 (w prawo) | `$Npc_Kopacz` (PixelLab, styl bohatera), O → kwestie |
| **23** | **Marek** | **30,5**, twarzą do ściany (kierunek stały) | `$Npc_Marek` (PixelLab, styl bohatera), O → dymek: nie odwraca się, tylko kiwa głową |
| 24 | Światło dnia u wylotu | 20,29 | `<Light:120,150,150,140><LightSoft><LightWhen:day>` |
| 25–35 | znaczniki | tabela G4 | |

### Map120 „Osada Milczących” (Akt II)

Ukryta dolina: od północy **wysoka gładka ściana** (lico 4 pola, rzędy 4–7), na którą Milczący patrzą; po bokach skały,
od południa las i ścieżka z wąwozu. Cztery chaty (prefabrykaty autora jak na Podgrodziu; drzwi zamknięte — dymek „Drzwi
zamknięte. Za nimi cisza.”, latarnie przy dwóch), **krąg czterech kamieni** z płaskim kamieniem pośrodku (16–22, 17–21;
zwykłe obrazki — kamieni kręgu nie da się rozbić kilofem), kopczyki z białymi pasami, słupy z zaszytymi ustami, kamienie z kredowymi
kreskami, suche grządki. Białe płótno na ustach to znak Milczących (mają je wszyscy mieszkańcy).

| Id | Zdarzenie | Pole | Co robi |
|---|---|---|---|
| 1, 3, 5–6, 10 | Drzwi chaty 1–4 | 8,16 · 29,14 · 29,25 i 26,24 · 8,25 | O → dymek (zamknięte) |
| 12–16 | Kamień kręgu ×4, Płaski kamień pośrodku kręgu | 16,17 · 22,17 · 16,21 · 22,21 · 19,19 | blokują, O → dymek |
| 17–26 | kopczyki, słupy, kamienie z kreskami, suche łodygi | różne | O → dymek |
| 83–85 | Przejście -> Góry i kamieniołom | 19–21, 33 | dotyk → Map013 (5–7, 1), w dół (wąwóz za bramą) |
| **86–89** | **Milczący**: przy ścianie ×2, Najstarszy, przy grządce | 14,10 (w górę) · 17,10 (w górę) · 19,21 (w górę) · 12,16 (w dół) | `$Npc_Milczacy1`, `$Npc_Milczaca2`, `$Npc_Milczacy3`, `$Npc_Milczaca4` (PixelLab, styl bohatera, tylko stoją); O → dymek z tym, co widać (nie mówią) |
| 90–98 | znaczniki | tabela G4 | |

## G2. Zmiany na cudzych mapach

| Mapa | Zdarzenie | Pole | Co |
|---|---|---|---|
| Map021 „Leśna droga” | **112–114** Przejście -> Góry i kamieniołom | **39, 8–10** | koniec ścieżki na wschód (narysowanej przez autora) → Map013 (1, 38–40), w prawo; region 7 na tych polach |
| Map021 | 29 „Małe drzewo” | 39,8 → **38,5** | przestawione z ostatniego pola ścieżki |
| Map149 „piętro 50 (Przekop kopaczy)” | **23 Przekop: przejście do Jaskini** | **37,8** (lico północnej ściany na końcu tunelu wschodniego; staje się na 37,9) | **strona 1**: gruz (dymek „Boczny przekop, zasypany…”); **strona 2** (**przełącznik 15**): przekop przebity, dotyk → Map014 (3,10), w dół |
| MapInfos | 13, 14, 120 | — | 13 „Góry i kamieniołom” (było „Góry”), 14 „Jaskinia” (pod 13), 120 „Osada Milczących” (pod 13, kolejność 71) |
| System | przełączniki 15, 16 | — | nazwy `Gory_TunelKopaczy`, `Osada_Milczacych` |

**Uwaga do podziemi:** `tools/underground/build.py --install` nie rusza Map149, bo jej skrót w `installed.json` już się nie
zgadza (dobrze); z `--force` zdarzenie 23 by znikło — wtedy znowu `python tools/mountains/build.py --install`. Zapiski „Zawał” (50c,
zdarzenie 22 na 37,11) zostały.

## G3. Przełączniki dla agenta questów

| Przełącznik | Nazwa | Gdy włączony |
|---|---|---|
| **15** | `Gory_TunelKopaczy` | przekop kopaczy przebity: Jaskinia (Map014, 3,9) ⇄ piętro 50 (Map149, 37,8); bez niego z obu stron gruz |
| **16** | `Osada_Milczacych` | Akt II: Brama Milczących w wąwozie otwarta, przejście Map013 (5–7,0) ⇄ Map120 działa |

Ustawianie z kodu: `$gameSwitches.setValue(15, true)` (zdarzenia odświeżają się same). Nic poza tymi dwoma nie jest zamknięte:
góry, kamieniołom i jaskinia z obozem są dostępne od początku gry (obóz istnieje — rozdz. 3 decyduje, kiedy bohater tam idzie).

## G4. Wszystkie znaczniki

| Klucz | Mapa | x | y | Kierunek | Co tam jest / do czego |
|---|---|---|---|---|---|
| `gory_wejscie` | 13 | 1 | 39 | 6 | tu się przychodzi z Leśnej drogi |
| `grum_przewodnik_start` | 13 | 4 | 38 | 6 | Grum czeka o świcie (W8 rozdz. 2) — początek wyprawy |
| `gory_schody` | 13 | 22 | 34 | 8 | u stóp omszałych schodów na półkę |
| `nocleg` | 13 | 21 | 13 | 2 | przy starym palenisku kamieniarzy (20,12) — miejsce na noc z dala od domu (namiot, ognisko) |
| `kamieniolom` | 13 | 44 | 24 | 8 | środek dna kamieniołomu |
| `kamieniolom_znak` | 13 | 40 | 18 | 8 | przed krukiem wykutym w ścianie (40,16–17) — dowód: stąd kamień twierdzy i dworu |
| `blok_kruk` | 13 | 39 | 22 | 8 | przed ciosanymi blokami z krukiem (39,21) |
| `dzwig` | 13 | 49 | 27 | 8 | przed ruiną dźwigu (49,26) |
| `staw_suchy` | 13 | 37 | 25 | 2 | nad suchym stawem |
| `kamieniolom_schody` | 13 | 56 | 19 | 8 | u stóp schodów kamieniarzy na wysoką półkę |
| `punkt_widokowy` | 13 | 57 | 12 | 4 | wschodni kraniec wysokiej półki — widok na wyspę (rozmowa z Grumem) |
| `jaskinia_wejscie` | 13 | 44 | 8 | 8 | przed wejściem do jaskini |
| `osada_brama` | 13 | 6 | 4 | 8 | przed Bramą Milczących |
| `jaskinia_wyjscie` | 14 | 20 | 27 | 2 | tu się przychodzi z gór (i wychodzi w dół) |
| `oboz_kopaczy` | 14 | 18 | 18 | 8 | środek obozu, przed ogniskiem (W8 rozdz. 3) |
| `straz_obozu` | 14 | 9 | 13 | 6 | strażnik obozu (zdarzenie 19) |
| `kopacz_przodek` | 14 | 2 | 12 | 8 | kopacz przy zawale (zdarzenie 20) |
| `kopacz_ognisko` | 14 | 20 | 18 | 8 | kopacz przy ognisku (zdarzenie 21) |
| `kopacz_wozek` | 14 | 27 | 17 | 6 | kopacz przy wózkach (zdarzenie 22) |
| `marek` | 14 | 30 | 5 | 8 | **Marek** (zdarzenie 23) — W6 rozdz. 7, W8 rozdz. 3 |
| `namiot_dowodcy` | 14 | 25 | 12 | 8 | przed namiotem dowódcy |
| `list_kryjowka` | 14 | 27 | 11 | 8 | skrzynia dowódcy (kafel na 27,10) — rozkazy, list „Świadków nie zostawiać” (W8 rozdz. 4) |
| `tunel_wejscie` | 14 | 8 | 13 | 4 | wejście do przekopu — W8 rozdz. 6: walka z Grumem „przy wejściu do tuneli” (wolny plac x 10–16, y 12–17; strażnik stoi na 9,13, kosz z ogniem na 9,15) |
| `tunel_brama` | 14 | 3 | 10 | 8 | przed zawałem (przejście na piętro 50, przełącznik 15) |
| `osada_wejscie` | 120 | 20 | 31 | 8 | tu się przychodzi z wąwozu |
| `osada_krag` | 120 | 19 | 22 | 8 | przed płaskim kamieniem w kręgu |
| `osada_sciana` | 120 | 15 | 10 | 8 | pod ścianą, na którą patrzą Milczący |
| `osada_grum` | 120 | 21 | 25 | 8 | tu Grum staje i patrzy (W8 rozdz. 5) |
| `osada_starszy` | 120 | 19 | 21 | 8 | miejsce Najstarszego (zdarzenie 88) |
| `osada_dom_1` … `osada_dom_4` | 120 | 8 · 29 · 29 · 8 | 17 · 15 · 26 · 26 | 8 | przed drzwiami chat 1–4 |

## G5. Przejścia

| Skąd | Jak | Dokąd |
|---|---|---|
| Map021 (39, 8–10) | w prawo | Map013 (1, 38–40), w prawo |
| Map013 (0, 38–40) | w lewo | Map021 (38, 8–10), w lewo |
| Map013 wejście do jaskini (44,7) | w górę (dotyk) | Map014 (20,27), w górę |
| Map014 (19–21, 29) | w dół | Map013 (44,8), w dół |
| Map014 zawał (3,9), **przełącznik 15** | w górę (dotyk) | Map149 (37,9), w dół |
| Map149 przekop (37,8), **przełącznik 15** | w górę (dotyk) | Map014 (3,10), w dół |
| Map013 (5–7, 0) za bramą, **przełącznik 16** | w górę | Map120 (19–21, 31), w górę |
| Map120 (19–21, 33) | w dół | Map013 (5–7, 1), w dół |

Droga z miasta: Okolice Tawerny → Polna droga → Leśna droga (na wschód ścieżką od rozwidlenia przy starym zrębie) → Góry.

## G6. Obrazki i postacie

- **PixelLab, styl bohatera** (`style_character_id` bohatera): `$Npc_Marek` + `Npc_Marek_Walk8` i `$Npc_Kopacz` + `Npc_Kopacz_Walk8`
  (`tools/npc/build_npc.py`, wpisy w `tools/npc/npcs.json`); Milczący `$Npc_Milczacy1`, `$Npc_Milczaca2`, `$Npc_Milczacy3`,
  `$Npc_Milczaca4` — postacie stojące, bez chodu (`tools/mountains/silent_npcs.py`, `silent.json`).
- **PixelLab, rzeczy w stylu Winlu** (styl z kafli Winlu; surowe obrazki w `tools/mountains/pixellab/`): ruina dźwigu
  (`!$Mt_Crane`), ciosane bloki z krukiem i bloki rozłupane klinami (`!$Mt_Blocks`), wylot sztolni / zawał (`!$Mt_Cave`: kier. 2
  otwarte, kier. 4 zasypane — to samo na Map013, Map014 i Map149), Brama Milczących zamknięta / otwarta (`!$Mt_Gate`).
- **Rysowane kodem** (`tools/mountains/art.py`, `!Mt_Props`): kruk w kręgu wykuty w skale, znaki kamieniarzy, siedem nacięć,
  trzciny i ości suchego stawu, worek rudy, kopczyk milczenia, słup z zaszytymi ustami, kamień z kreskami; `!$Mt_Tent` — namiot gry
  (`Farm_Tent_L`) i jego płócienna wersja.

## G7. Narzędzia (`tools/mountains/`)

```
python tools/mountains/art.py              # !Mt_Props, !$Mt_Tent, !$Mt_Crane, !$Mt_Cave, !$Mt_Blocks, !$Mt_Gate
python tools/mountains/silent_npcs.py      # $Npc_Milczacy1..4 (pobiera postacie z PixelLab)
python tools/mountains/build.py            # na sucho: buduje 13/14/120 w staging, sprawdza dojścia do znaczników
python tools/mountains/build.py --preview D
python tools/mountains/build.py --install  # zapis do data/ (edytor zamknięty; kopie w backup_art_2026-10-06/mountains/)
```

`mtlib.py` — mapa na tilesecie 11 z tarasami (poziom pola, krawędzie A5 autora, lico 2 albo 4 pola, schody wycięte w licu),
sprawdzanie przejść jak w grze; `gory.py`, `jaskinia.py` (na `tools/underground/uglib.py`), `osada.py` (prefabrykaty
`tools/town/prefabs`), `props.py` (rzeczy jako zdarzenia), `patches.py` (Map021, Map149, MapInfos, System). Mapa zmieniona
w edytorze po ostatniej instalacji nie jest nadpisywana (`installed.json`), chyba że `--force`.

## G8. Uwagi dla agenta questów

- Rozdz. 2 „Przewodnik”: Grum na `grum_przewodnik_start` o świcie; „znać drogę” = trasa podgórze → schody → półka → kamieniołom
  (`kamieniolom_znak`) → schody kamieniarzy → `jaskinia_wejscie`; noc z dala od domu przy `nocleg` (namiot da się rozbić — na
  mapie nie ma `<Build:off>`).
- Rozdz. 3: obóz stoi zawsze; Marek ma własne zdarzenie 23 (wystarczy dodać stronę albo schować go po uratowaniu, np.
  samoprzełącznikiem). Kopacze i strażnik nie walczą sami — Humans.js nie ma ludzi „spokojnych”, więc do walki trzeba je
  schować i postawić `Humans.spawn` w tych samych miejscach.
- Rozdz. 4: `list_kryjowka` to skrzynia dowódcy (gdyby list miał leżeć w obozie, a nie przyjść przez Baltazara).
- Rozdz. 5: Osada jest zamknięta do przełącznika 16; Milczący nie mówią (dymki z opisem).
- Rozdz. 6: walka z Grumem przy `tunel_wejscie`; przełącznik 15 otwiera przekop do piętra 50 (stąd Marek wychodzi tunelami albo
  bohater schodzi „drugim wejściem” w głąb).

## G9. Zrzuty (`docs/gory/`)

| Plik | Co |
|---|---|
| `mapa_gory.png`, `mapa_jaskinia.png`, `mapa_osada.png` | całe mapy (render statyczny, siatka) |
| `gory_wejscie.png` | podgórze tuż po wejściu z Leśnej drogi |
| `kamieniolom.png`, `kamieniolom_znak.png` | dno kamieniołomu; kruk w ścianie (dymek po O) |
| `jaskinia_wejscie.png` | ściana gór z wejściem do jaskini i latarnią kopaczy |
| `oboz_kopaczy.png`, `marek.png` | obóz przy ognisku; Marek w niszy |
| `tunel_zawal.png`, `tunel_otwarty.png`, `pietro50_przekop.png` | koniec przekopu zasypany (dymek) / przebity (przełącznik 15); przekop na piętrze 50 |
| `brama_milczacych.png` | zamknięta Brama Milczących w wąwozie (dymek) |
| `osada.png`, `osada_krag.png` | Osada Milczących; krąg kamieni i Najstarszy |
| `milczacy_z_bohaterem.png`, `kopacze_marek_grum.png` | postacie obok bohatera |
