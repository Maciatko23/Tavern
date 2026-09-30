# Przepisy autora tilesetu (Winlu Fantasy Exterior) - jak on buduje miasto

Spisane z jego własnych map (`tools/town/winlu_samples/`, tylko do wglądu - nie są danymi gry): Map010 (ulica miasteczka =
wzór 6.png, młyn-karczma = wzór 11.png), Map008 (brama zamku, twierdza, domy), Map015 (wioska), Map012 (chata z bali).
Dane warstwa po warstwie każdego prefabrykatu: `tools/town/prefabs/_layers.txt` (`python tools/town/prefabs.py describe`).

Oznaczenia: `A3 k60` = rodzaj autokafelka (numer rodzaju jak w nslib: 48-79 A3, 80-127 A4), `B(6,7)` = kafelek arkusza B w
kolumnie 6, rzędzie 7 (kolumny 8-15 to prawa połowa arkusza), tak samo `C(..)`, `D(..)`, `E(..)` (E = Fantasy_Roofs),
`A5(k,r)`. Wszystko na tilesecie autora = proponowany tileset 11 (`town_tileset.py`).

## 1. Co leży na której warstwie

| warstwa | co autor tam kładzie |
|---|---|
| 0 | grunt A2 (bruk `k40`, deski `k33`, trawa `k16`, ziemia `k17`/`k18`), **dachy A3**, **ściany A3/A4**, skały i schody A5 |
| 1 | nakładki A2: kamienie/mech `k23`, kwiaty `k28`, żywopłot `k20`, ciemna trawa `k46` - na brzegach, przy murach, pod wieżami |
| 2 | dolne połowy okien, rzeczy z C stojące na ziemi, części szczytów E, bluszcz na dole |
| 3 | górne połowy okien, **skrzynki kwiatów na dolnej połowie okna**, kominy, bluszcz, blanki, wieże B, szczyty E, drobiazgi C/D |
| „warstwa 5” | **zdarzenia z obrazkiem kafelka**, gdy 2 i 3 są już zajęte: priorytet 0 (pod postacią, np. skrzynka kwiatów B(7,0), ławka C(12..13,0)), 1 (stoi: słup kosza C(0,1), blanki B(8..10,0) z „through”), 2 (nad postacią: połać szczytu E(10..13,6..8)) |
| cienie | warstwa cieni: 6-14 pól na budynek - lewa połowa pola (wartość 5) na prawo od wyższej części budynku i pod okapem (15 = całe pole pod daszkiem przybudówki) |

## 2. Fasada domu (rząd po rzędzie)

- **Dach wysoki, ściana niska.** Typowy dom: 4-5 rzędów dachu A3 i tylko 2-3 rzędy ściany (dom z lukarnami: `A3 k60` x5 rzędów
  + `A3 k76` x2). U nas dachy były za niskie, a ściany za wysokie - to główna różnica „wyglądu”.
- **Piętro = dwa rodzaje ściany jeden nad drugim**, nie jedna ściana: karczma `A4 k81` (szachulec z pomarańczowym cokołem, piętro)
  nad `A4 k88` (szachulec z krzyżami, parter); dom z miksturami `A4 k80` nad `A3 k79`; kamienice `A4 k80` nad `A3 k79`.
- **Okna** zajmują 2 pola wysokości: górna połowa (np. `B(6,6)` ciemne / `B(7,6)` oświetlone) na warstwie 3, dolna (`B(6,7)` /
  `B(7,7)`) na warstwie 2 w rzędzie niżej; w domach kamiennych `B(1,0)`+`B(1,1)`, `B(2,0)`+`B(2,1)`.
- **Skrzynki kwiatów** (`B(0,1)` niebieskie, `B(7,0)` czerwone, `B(7,1)`) na warstwie 3 **na tym samym polu co dolna połowa okna**
  - wiszą pod parapetem, nie pod oknem w rzędzie niżej.
- **Kominy** z B: `B(2..4,10)` + `B(2..4,11)` (dwa pola, na warstwie 3, na dachu); dym - zdarzenie `!Fantasy_chimney`.
- **Bluszcz**: `B(5..6,12..13)`, `B(0..2,12..13)` na warstwie 3 - zwisa z dachu na ścianę (zaczyna się 1-2 rzędy nad ścianą).
- **Drzwi**: zdarzenie `!Fantasy_door1` (indeks 1-5 = kolor), `!Fantasy_door2`; bramy `!$Gate_Wood1`, `!$Gate_Cathedral1`.
- **Szyld**: `!Signs` - kierunek 6 = na wysięgniku w prawo (przy prawej krawędzi fasady, rząd nad drzwiami), kierunek 2 = płaski
  na ścianie; priorytet 1-2.
- **Latarnie na ścianie**: `!Decoration` indeks 7 (kierunek 2 z przodu, 4/6 z boku na wysięgniku), priorytet 2.
- **Rzeczy przy wejściu**: beczki `C(3..4,8..9)`, wozy `C(12..14,8..9)`, koło `C(14,8..9)`, dzbany `C(5..6,4..5)`, worki - na
  warstwach 2/3 tuż przy ścianie, zawsze w grupach po 2-4.

## 3. Dachy warstwowe

- **Krzyżowy szczyt** (dach z frontem nad drzwiami): kafelki E(8..13, rzędy 0-3 brąz / 4-8 dachówka / 8-12 łupek) na warstwach
  2 i 3, **kładzione na rzędy dachu i ściany**; trójkąt ściany pod szczytem to też E (`E(4..7,9..11)`: tynk z belkami i okienka)
  - autor nie maluje tam ściany A3/A4, na warstwie 0 zostaje bruk. Brakujące kawałki połaci (gdy warstwy 2/3 są zajęte) są
  zdarzeniami z kafelkiem E, priorytet 2.
- **Przybudówka / skrzydło cofnięte**: część budynku obok szczytu stoi rząd wyżej lub niżej, z cieniem (lewa połowa pola) wzdłuż
  krawędzi - stąd „głębia” fasad.
- **Lukarny**: zdarzenia `!Roof_Windows` (priorytet 1), w dachu 4-5 rzędowym na 2. i 4. rzędzie; dwie obok siebie albo jedna nad
  drugą; kolor lukarny dobrany do dachu (indeks 0 drewno, 1 łupek).
- **Przybudówka z desek** (daszek jednospadowy): `E(0..3,4..8)` / `C(11,6..7)` przy boku budynku.

## 4. Twierdza, mury, wieże

- **Mur**: lico `A4 k105` (2 rzędy), korona `A4 k97`; chodnik po murze to deski `A2 k33`, a na nim blanki `B(9,0)`/`B(9,1)`
  (warstwa 3); przejścia pod blankami - zdarzenia z kafelkiem `B(8..10,0)`, priorytet 1, „through”.
- **Okrągła baszta**: `B(13..14, 0..6)` na warstwie 3 (7 rzędów), nad brukiem; **hełm** baszty = zdarzenie `!$Big_Decoration`
  priorytet 2 (niebieski / łupkowy).
- **Front twierdzy / świątyni**: `A4 k106` (arkady), `A4 k98`, `A4 k105`, dach `A3 k56` (czerwony); gotyckie okna `B(7,8..9)`,
  `B(0,4..5)`; chorągwie `!Flags_banner`; posągi `!Statue` po bokach bramy `!$Gate_Cathedral1`.
- **Kosze żarowe**: słup `C(0,0..2)` (środek słupa jako zdarzenie z kafelkiem), ogień `!Decoration` indeks 0 priorytet 2,
  pochodnie `!Decoration` indeks 3 (kierunek 4/6 na ścianach).
- **Brama z mostem**: `!$Big_drawbridge_animated`; skarpa pod murem to skała A5 (rzędy 9-15).

## 5. Teren

- **Skały / tarasy**: `A5(0..3, 9..15)` na warstwie 0 - obrzeże z trawą u góry, 2 rzędy lica, zaokrąglone końce; linia skał
  schodzi stopniami i wybrzusza się (nigdy prosta przez całą mapę). Schody: `A5(4..5,7)` / `B(14..15,13..14)`.
- **Brzegi dróg**: bruk `A2 k40` wchodzi w trawę nieregularnie; przy ścianach i murach nakładka `A2 k23` (kamienie z mchem) albo
  `k46` (ciemniejsza trawa); pod drzewami cień jest w samym obrazku drzewa (`!$Big_Trees`, arkusz D z cieniem).
- **Zieleń**: kępy z D (`D(8..15,7..12)`: kwiaty, paprocie, grzyby) gęsto przy ścianach i płotach, nie równo po trawie.

## 6. Blokady

- Z flagami autora **dachy A3, ściany A3/A4 i rzeczy z B-E blokują same** (flagi 0x0F), górne części są gwiazdkami (0x10).
- Tam, gdzie flagi zostawiają przejście, a coś stoi (palenisko kuźni, przejście pod bramą), autor stawia **puste zdarzenia
  priorytetu 1** (kuźnia: 5 pól, brama zamku: 7 pól) - dokładnie to samo, co nasze „Płot zagrody”.
- Postać nie chodzi „za dachem” - dach blokuje. Obrazki drzew z D/`!$Big_Trees` rysują koronę nad postacią.

## 7. Przepis na nowy budynek z prefabrykatów

1. Wybrać prefabrykat (`tools/town/prefabs/*.json`, galeria `docs/miasteczko/prefaby.png`) i postawić go `prefabs.stamp(mp, key,
   x, y, ground=False)` tak, by **dolne rzędy fasad w jednej ulicy były w jednej linii** (`street_test.py`).
2. Budynki stykają się bokami; między pierzejami co 1-3 domy przejście 1-2 pola (bruk / deski).
3. Pod fasadą rząd „życia”: beczki, skrzynie, kwiaty, ławka - 2-4 rzeczy na dom, nigdy równo.
4. Na brzegu dachu z tyłu - cień i nakładka `k23`/`k46`; na trawie kępy D.
5. Kontrola: każde drzwi osiągalne z ulicy, blokady tylko pod widocznymi rzeczami (`street_test.py` rysuje to na dole obrazka).

## 8. Susza

Prefabrykaty z wodą (`mlyn_karczma` - kanał pod kołem, `studnia` - woda w studni) trzeba przerobić przy stawianiu: A1 (woda)
-> suche koryto (kandydaci z A2 autora: ziemia `k17`/`k18`, błoto `k26`), studnia -> nasza sucha (przemalowana woda). Koło
młyńskie stoi (bez animacji).
