# Paczka A „Woda i zasoby” — co zbudowano (2026-10-22)

Plan: `docs/rozszerzenia/PLAN.md`, punkt 4. Wtyczki `js/plugins/Zasoby_Data.js` (dane, teksty, zadania, Jagna) i
`js/plugins/Zasoby.js` (silnik). Test `tests/zasoby_test.js` (port 9551). Grafika `tools/rozszerzenia/A/build_art.py`
(podgląd `docs/rozszerzenia/A/obiekty.png`, zrzuty z gry `docs/rozszerzenia/A/*_w_grze.png`).

## Numery i pliki

| co | zakres / plik |
|---|---|
| zdarzenia (`Tawerna.inject`, właściciel `Zasoby`) | Map017 2100–2129, Map021 2130–2139, Map013 2140–2154, Map155 2155–2164, Map168 2165–2184, Map003 2185–2204, Map111 2205–2224, Map125 2225–2229, Map162 2230–2234, Map008 2235–2299 (pola: 52 zdarzenia 2235–2286); puste znaczniki (`Okolice.blank`) na polach z losowym krzakiem Farming z wolnych numerów mapy |
| mieszkanka TownLife | 2900 `jagna` (Babka Jagna, Map017) |
| przedmioty (zainstalowane) | 185 Wosk pszczeli, 186 Surowy krab, 187 Pieczony krab, 188 Blok kamienny (`<Weight:6>`), 189 Drewno dryfowe, 190 Arcydzięgiel, 191 Dziurawiec, 192 Kozłek lekarski, 193 Złom żelazny, 194 Zaśniedziała moneta, 195 Maść szczepiarska, 196 Napar z kozłka; 197–199 wolne |
| ikony (zainstalowane) | 464–475 (wiersz 29), 476–479 wolne |
| przełączniki | 21 `Zas_Studnia` = studnia sąsiada naprawiona (ustawia silnik); 22 nieużywany |
| zadania | K55, K56, K57, K58, D30, D31 (paczka TownQuests właściciela `Zasoby`) |
| ogłoszenia tablicy | `zas_dziki_miod` (Melia), `zas_ziola_rzadkie` (Jagna), `zas_bloki` (Kazimierz), `zas_kraby` (Borgar) |
| grafiki | `img/characters/!$Zas_Zrodlo`, `_Kamienie`, `_Ziolo`, `_Grzyb`, `_Ruina`, `_Ogrodek`, `_Studnia`, `_Plot`, `_DzikiUl`, `_Wysypisko`, `_Glinianka`, `_ScianaCiosowa`, `_Kaluza`, `_Drewno`, `_SadSpalony`, `!Zas_Uprawy`; `$Npc_Jagna`, `Npc_Jagna_Walk8`; `img/pictures/Jagna_Bust` (`tools/busts/make_jagna.py`) |
| stan w zapisie | `Tawerna.state("zasoby")` (wersja 1) |

Miejsca na mapach: jak w planie (punkt 3.8). Zmiany wobec planu: brak przesunięć. Dziko rosnące rzadkie zioła stoją
w obszarach trzech źródełek (Map021 arcydzięgiel (23,43), Map168 dziurawiec (45,55), Map017 kozłek (70,55)) —
to źródła ziół „spoza polanki” do D30. `jagna_miejsce` zarejestrowane jako `zone` (Jagna chodzi, nic tam nie stoi;
w `OkoliceData.PLAN_SPOTS` miejsce ma omyłkowo paczkę C).

## Bloki do `docs/QUESTY.md` (krótkie)

| # | Nazwa | Kto daje | Gdzie | Co (opis i kroki) | Kiedy | Nagroda | Mechaniki gry | Co trzeba dobudować |
|---|---|---|---|---|---|---|---|---|
| K55 | Świece dla dzwonnika *(dostawa)* | Ambroży | dzwonnica → dzikie ule w sosnach za polem dziadka (Map003) | Ambrożemu kończą się świece, a w dzwonnicy po ciemku łatwo skręcić kark. Przynieś 4× Wosk pszczeli. Wosk daje dziki ul (nóż; z dymem - zapalona pochodnia w ręce albo ognisko obok - plaster wychodzi czysto, bez dymu pszczoły żądlą i zostaje sam miód). | 8–18, od dnia 3 | 30 G, 50 dośw., Opinia +2 | dzikie ule (Zasoby.js), pochodnia (Torch), ognisko | - |
| K56 | Ogródki Podgrodzia *(praca)* | Babka Jadwiga | Podgrodzie, ogródki na północy (Map111) | Ogródki pod murem schną, a ręce do pracy stare. Pomagaj przy grządkach trzy dni w ciągu tygodnia (rano 6–12, motyka, 8 uderzeń; każda pomoc to 2 warzywa i Opinia +1). Podlewać nie trzeba - wody i tak nie ma. | 6–18, od dnia 4; termin tydzień | 25 G, 3× Zioła, 60 dośw., Opinia +2 (spóźnione: Opinia −1) | ogródki (Zasoby.js), motyka, wytrzymałość | - |
| K57 | Studnia sąsiada *(praca, wyprawa)* | dziadek Stach | pole dziadka → zagroda Rzepków na południu (Map003) → kamieniołom w Górach | Za lasem stała zagroda Rzepków; studnia im wyschła i poszli do miasta. 1) Znajdź zagrodę (w ruinie chaty list Wojciecha Rzepki, lina i gwoździe). 2) Oczyść zasypaną studnię łopatą (12 uderzeń; na dnie zardzewiałe wiadro - Złom żelazny). 3) Zdobądź 4× Blok kamienny (ściana ciosowa w Górach), 2× Linę, 2× Deski. 4) Napraw studnię młotkiem (15 uderzeń). **Woda nie jest nagrodą:** studnia zbiera tylko deszcz (1 porcja na 2 godziny deszczu, najwyżej 4), w upał traci porcję dziennie, przy śniegu zamarza. | od dnia 3, gra fabularna | 60 dośw., notatka „Studnia Rzepków” | deszcz (Survival.weatherPlan, Farming.rainHoursBetween), menu studni (Farming), Durability | - |
| K58 | Sad Ługów *(praca)* | Marta Ługowa | Podgrodzie → Spalona zagroda, sad (Map168) | Osiem jabłonek Jana Ługa spaliło się razem z domem. Każde drzewo: 1) przytnij nożycami albo siekierą (4 uderzenia, +Węgiel), 2) opatrz Maścią szczepiarską (przepis Jagny z D30), 3) podlej konewką w trzech różnych dniach (konewkę napełnisz tylko swoją wodą). Po 10 dniach liście, następnej wiosny kwiat, latem i jesienią Dzikie jabłka co 5 dni. Na koniec powiedz Marcie. | 5–17, po D21 (odbudowa zagrody) | 40 G, 120 dośw., `zasSadMarta` - Marta przychodzi do sadu w dni z owocami (10–13) | sad (Zasoby.js), konewka (Farming), D21 (Homes) | - |

## Bloki do `docs/QUESTY.md` (długie)

| # | Nazwa | Kto daje | Gdzie | Co (opis i kroki) | Kiedy | Nagroda | Mechaniki gry | Co trzeba dobudować |
|---|---|---|---|---|---|---|---|---|
| D30 | Zioła Jagny *(zbieractwo, pory roku)* | Babka Jagna | Omszała łąka (Map017), polanka Jagny; dzikie zioła przy ukrytych źródełkach | Jagna nauczy maści do drzew i naparu na sen, jeśli przyniesiesz trzy rzadkie zioła - „z ręki, nie z mojej ziemi”. 1) Arcydzięgiel (lato, jesień; dziko przy źródełku w lesie, Map021). 2) Dziurawiec (tylko lato; przy starym źródle Ługów, Map168). 3) Kozłek lekarski (wiosna-jesień; przy źródełku w mchu, Map017). Zioło zerwane z jej polanki przy niej: dymek „Nie twoje, chłopcze.” i zaufanie −1; pod jej nieobecność: przy następnej rozmowie Jagna je zabiera, zaufanie −2. Z ujemnym zaufaniem nie daje zadania. | rano przy polance (5–10, w dni bez deszczu); wszystkie trzy zioła rosną latem | 120 dośw., `zasD30`; przepisy: Maść szczepiarska (Mokra glina + Wosk, ręcznie), Napar z kozłka (Kozłek + 1 porcja wody z wiadra, kociołek: pierwszy sen +20% sił); zgoda na zbiór z polanki | TownLife (Jagna 2900), pory roku, przepisy Farming, premia Survival, sen (`wake`) | - |
| D31 | Skarby wysypiska *(szukanie)* | Józek Łata | Podgrodzie, wysypisko za chatami (Map111) | Józek szuka trzech rzeczy: medalika ze świętym Krzysztofem, starego klucza z kółkiem i „czegoś z kruczym znakiem”. Grzebanie raz dziennie (łopatą dwa losowania; wysypisko daje 4 na dzień); przy D31 każde losowanie ma 40% szans na następną rzecz z listy. Trzecia to moneta z krukiem - wątek dla paczki D (lore), nie karta kroniki. | 7–20, od dnia 3 | 40 G, 100 dośw., Opinia +3, `zasMonetaKruk` (uwaga Kleofasa o „groszu strażnicy”) | wysypisko (Zasoby.js), łopata | - |

## Do `docs/QUESTY.md` 5.3 „Pogoda i susza” (dopisek)

- **Źródełka i studnia sąsiada (paczka A).** Pięć ukrytych źródełek (Omszała łąka, Leśna droga, Góry, Pustelnia, Spalona
  zagroda) daje 2 porcje wiosną i jesienią, 1 latem i zimą, +1 dzień po deszczu (najwyżej 3); w upał (lato i 6+ dni bez
  deszczu) i w suszę (10+ dni) wysychają, przy śniegu zamarzają. Studnia Rzepków po naprawie (K57) zbiera tylko deszczówkę,
  najwyżej 4 porcje. Oba znajduje się samemu - żadne zadanie nie daje wody. Kałuże pływowe, glinianka i morze: „nie do picia”.

## Do `docs/QUESTY_STAN.md`

K55–K58, D30–D31: zbudowane 2026-10-22 (paczka A, `Zasoby_Data.js` / `Zasoby.js`), test `tests/zasoby_test.js` 60/60.

## Do `docs/STORY.md` (lore)

- Zagroda Rzepków za lasem na południe od pola dziadka: Wojciech Rzepka z rodziną odszedł do miasta, kiedy studnia wyschła
  (list w ruinie chaty).
- Babka Jagna, zielarka z Omszałej łąki: ma swoją polankę z arcydzięglem, dziurawcem i kozłkiem; po deszczu wychodzą
  obok czarcie kręgi grzybów - nocą w środku siada mgła i coś szepcze („grzybnia oddycha”).
- Moneta z krukiem z wysypiska Podgrodzia: „grosz strażnicy”, którym płacono przewoźnikom zakonu (Kleofas).

## Do `docs/ARCHITEKTURA.md`

- Szyna: paczka słucha `chop` (żyły rudy Map013 odrastają po 7 dniach - reset samoprzełącznika A przy `mapLeave` do Map013),
  `stormEnd` i `dayStart` (drewno dryfowe), `wake` (głęboki sen), `townQuestAccepted` / `townQuestDone` (K56, D30),
  `okoliceDiscover` (myśl przy znalezieniu źródełka).
- `Game_Event.prototype.setupPageSettings` owinięte: wygląd (kierunek/wzór) zdarzeń paczki wraca po odświeżeniu strony.

## Łaty dla integracji (pliki nie paczki A)

1. `tests/workbench_test.js`: trzy sprawdzenia list przepisów warsztatu i kuźni widzą nowe przepisy paczki
   (`zas_split_drift` „Rozłup drewno dryfowe” w warsztacie, `zas_scrap_iron` „Przetop złom” w kuźni) - dopisać je do list
   (plan: „Warsztat (ręcznie) Rozłup”, „Złom: w kuźni → Żelazo”).
2. `OkoliceData.PLAN_SPOTS`: `jagna_miejsce` ma `pkg: "C"` (powinno być A; paczka A rejestruje je jako `zone`).
3. (nie paczka A) `town_life_test` / `podgrodzie_life_test`: na Map008 jest 22. mieszkaniec - `grabarz` paczki D;
   `quest_board_test` „three days later...”: psują go ogłoszenia `low_` paczki B (bez nich 57/57; bez `zas_` dalej źle);
   `okolice_szkielet_test`: płycizny P1–P3 Map165 zajęte przez zdarzenia paczki D 2860–2862 (Kawałki wraku).
4. Jagna kupuje zioła D (228/229)? - plan wspomina („Ustala D z A”); niezbudowane, do ustalenia.
