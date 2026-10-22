# Paczka D „Tajemnice i zakon” – co zbudowane i bloki do dokumentów

Plan: `docs/rozszerzenia/PLAN.md`, punkt 7. Kod: `js/plugins/Zakon_Data.js` (dane, teksty, zadania, grabarz) i `js/plugins/Zakon.js` (silnik).
Mapa 176: `tools/rozszerzenia/D/komora.py` → `tools/rozszerzenia/D/Map176.json` (zainstalowana `instaluj.py --mapa 176`).
Przedmioty: `tools/rozszerzenia/D/przedmioty.json` (225–232), ikony: `tools/rozszerzenia/D/ikony.png` (512–527) – zainstalowane.
Obrazki: `tools/rozszerzenia/D/grafika.py` (+ `ikony_d.py`) składa `img/characters/!$Zak_*` z obrazków PixelLab (`tools/rozszerzenia/D/surowe/`,
spis w `generacje.json`) i z kafli Winlu. Grabarz: `$Npc_Grabarz` (PixelLab, `tools/npc/build_npc.py`), popiersie `Grabarz_Bust`
(`tools/busts/make_grabarz.py`, 0 generacji). Test: `tests/zakon_test.js` (port 9554).

## Co działa w grze

| rzecz | gdzie | jak |
|---|---|---|
| 7.1 fundamenty strażnic | Map022 x 71–76 y 36–41, Map013 x 79–84 y 20–25, Map157 x 94–99 y 52–57 | obmurówki `!$Zak_Fundament` (płasko, pod bohaterem, wchodzi się do środka), zawalona płyta z krukiem: „Zajrzyj pod płytę” → karta Zapisków strażnic 4–6 (po kolei). Krzaki Farming gaszą puste znaczniki. |
| 7.2 kapliczki z krukiem | Map022 (72,17), Map021 (58,13), Map004 (66,7) | „Pomódl się” raz dziennie przy każdej: premia „Błogosławieństwo drogi” 4 h (prace −10% sił). Dar 1 G albo najtańsze jedzenie: +1 h (do 6 h), u stóp kapliczki widać dar. Nocą świeczka (światło ognia). |
| 7.3 kopce z krukiem | Map017 (50,37), Map023 (58,52), Map155 (70,41) | `!$Rock_Cairn` z własną listą (nie do rozkucia, cień od słońca) + kamień z krukiem na szczycie. „Rozbierz szczyt” rękami, 4 uderzenia → karta 1–3; kopiec złożony z powrotem, kamień z krukiem znika. |
| Zapiski strażnic | karty `zak_karta_1..6` (przedmioty zadania TownQuests, osobna seria – nie karty kroniki) | brat Kleofas (hak rozmowy, 7–19, po pierwszym spotkaniu) czyta kartę: wygaszenie, 2 h, 40 PD, notatka „Zapiski strażnic (N): …”. Karty 3 i 4 dają podpowiedź do kręgu w „Okolicach”. |
| 7.4 krąg menhirów | Map018: 7 × `!$Rock_Column`, Strażnik `!$Rock_Spire` (50,42), płyta (53,45), dół (52,43) | „Kop” łopatą (3 uderzenia) tylko gdy cień Strażnika (stopa 14 px nad dołem pola, wysokość 92 px – jak rysuje ChoppableTree) pada na dół (≤ 0,5 pola), słońce ≥ 0,25, bez deszczu i burzy. Okna: wiosna 17:21–19:48, lato 18:15–20:15, jesień 16:18–18:48, zima 15:21–17:30. W złej porze dymek „Ubita ziemia…”. Klucz Strażnika w płytę → przełącznik 27, schody na Map176. |
| komora (Map176) | 20×14, tileset 12 | schody (10,3) w górę na (53,46), sarkofag pierwszego strażnika, dwaj kamienni bracia, kolumny, urny, kamienna misa, ściana z wykutą wyspą i czterema wieżami, skrzynia: Pióro Skrzydlatej Straży 226 (albo 60 G, jeśli pióro już z gniazda). Ciemno: dymek o pochodni. |
| 7.5 miejsca tylko z orła | Map125 (97–100,44–47) i (105–108,30–33), Map013 (99–102,38–41) i (33–36,73–76), Map168 (51–54,24–27) | odkrycie po wylądowaniu (nie z powietrza). Rzeczy poza kwadratem lądowania: skrytka przemytników (`Ludzie.stashFound()`, gdy brak – 30 G, lina, smoła), stare gniazdo (pióra ×3 co 7 dni), gniazdo zakonnych orłów (Pióro Straży albo pióra ×2), szarotka / warzucha (odrasta po 7 dniach), kamień z krukiem, stare palenisko. Zejście: kołki / lina (stań, O) – jednokierunkowo w dół, na pole z planu. |
| zioła z klifu | Map155 (1,54) (2,66) (73,2), Map157 (62,1) (72,5) (100,5) | dorosły orzeł w niskim locie, Spacja nad półką (do 1,6 pola): warzucha, −10 sił orła, odkrycie „Zioła z klifów”; klawisz nie idzie wtedy do nurkowania na wroga. |
| 7.6 orle grzędy | Map175 (68,13) (68,26) (68,45) | „Obejrzyj”: wpis w dzienniku, 40 PD, odkrycie; misa sucha / po deszczu woda orłów (nie do picia). Ślady: strzemię 227, siodło (opis), pióra ×2. Orzeł bohatera przy grzędzie: więź +5 raz na grzędę. |
| 7.7 cmentarz | Map008 x 80–87 y 12–17 | niski murek (21 kawałków), przerwa na bramkę (83–84,17), lampka na słupie (ogień nocą), 8 grobów, 3 z krukiem: „Oczyść kamień” rękami 4 uderzenia → imię (Bogusław, Żelisław, Wit, r. 106), notatka; trzy → „Imiona z grobów z krukiem” do D37. |
| grabarz Hieronim | TownLife 2930 `grabarz`, Map008 | 6–18 przy grobach i bramce, 17:30 przy lampce, potem do domu (away). Popiersie `Grabarz_Bust`. Gdy D37 trwa, raz mówi, gdzie są groby z krukiem. |
| szubienica | Map008 (94,56), `<Occupy>` 93–95 | opis i lore; 22–3 skrzypienie (Door1, nisko, głośność i pan od odległości) i mgła wokół (własna warstwa). |
| 7.8 gaj Milczących | Map120 x 53–61 y 51–57, 7 białych kamieni wokół (57,54) | od zachodu słońca (Sky.sunTimes, okno 3 h): stań w środku (≤ 1 pole) → godzina gry ciszy; łamie ją wyjście dalej niż 3 pola, bieg, tryb walki, rozmowa – dymek „Milczący odwracają głowy.”, od nowa następnego dnia. Udało się: premia „Spokój Milczących” 6 h, przy pierwszym kamieniu biały kamień milczenia 232. |
| 7.9 kruki na skałach | Map155 głazy (68,26) (76,47) (92,66), Map157 (76,21) (78,37) (81,39) | ptaki rysowane z `img/system/Kruk.png` (Kruk.js tylko czytany), 1–2 na głazie, 6–20:30; kraczą, dziobią; bieg w promieniu 5 płoszy (nie gdy `krukTame`), wracają po ~45 s. O przy głazie: ryba / mięso raz dziennie na głaz → moneta 194 albo pióra 146. Rozkuty głaz = brak kruków. |
| 7.10 kawałki wraku | Map165 (47,24) (62,18) (71,24) na płyciznach P1–P3 | koniec sztormu (którego początek gra widziała) odsłania następny (`zakon.wreck` 0→3); widać je tylko w odpływie; „Odkop” łopatą 6 uderzeń: okucia 230 ×2 / tabliczka 231 / skrzynka 40 G + smoła. Ansgar raz reaguje na tabliczkę. |

Odkrycia (Okolice): 27 – strażnice (3), kapliczki (3), kopce (3), krąg, Cień Strażnika, komora, miejsca orła (5), zioła z klifów, grzędy (3),
cmentarz, szubienica, gaj, kruki (2), kawałki wraku.
F9 (zakładka „Wyspa i fabuła”, sekcja „Paczka D”): miejsca (25), godzina cienia (dziś), Klucz Strażnika, wszystkie Zapiski, orzeł dorosły
i lot, sztorm się skończył (kawałek wraku), odpływ, Akt II (dług spłacony, przełącznik 16), zmierzch w gaju.

Numery: zdarzenia Map022 2700–2702 i 2710, Map013 2700–2702 i 2720–2732, Map157 2700–2701 i 2740–2742, Map021 2710–2711, Map004 2710,
Map017/023/155 2750–2751 (Map155 też 2752–2754), Map018 2760–2769, Map176 2770–2779, Map125 2780–2784, Map168 2785–2787,
Map175 2790–2795, Map008 2800–2821 i 2830–2840, Map120 2850–2857, Map165 2860–2862; mieszkaniec 2930; przedmioty 225–232; ikony 512–527;
przełącznik 27 `Zak_Komora` (płyta otwarta), 28 nieużywany. Flagi TownQuests: `zakKapliczki`, `zakZapiski`, `zakKomora`, `zakGrzedy`,
`zakWrak`, `zakGroby`, `zakGaj`. Stan: `Tawerna.state("zakon")`. Szyna: `zakonGrove { done, why }`.

## Blok do `docs/QUESTY.md` – 2. Krótkie questy

| K67 | Trzy kruki przy drogach *(obchód)* | Ambroży Dzwonnik | kapliczki z krukiem: Polna droga, Leśna droga, Łąka | Ambroży: przy drogach stoją trzy kapliczki z krukiem; jego mistrz kazał przy każdej się pomodlić. Pomódl się przy wszystkich trzech (modlitwa daje Błogosławieństwo drogi) i wróć do Ambrożego. | od dnia 4, 7–20 | 80 dośw.; linijka: kruk przy drodze znaczył wodę albo schronienie zakonu (wskazówka do źródełek, bez ich pokazywania) | premia na czas (Survival), dar 1 G / jedzenie | kapliczka `!$Zak_Kapliczka` |
| K68 | Zapiski strażnic *(zbieranie, czytanie)* | brat Kleofas | kopce z krukiem (Omszała łąka, Skraj lasu, klif pustelni), fundamenty strażnic (Polna droga, Góry, Urwisko) → pustelnia | Dziennik braci warty z czterech wież: sześć kart, trzy w kopcach (szczyt rozbiera się rękami), trzy pod płytami strażnic. Kleofas czyta każdą (2 h): warta i kruki, krąg i przysięga „patrzę i nie pytam”, godzina cienia, kamienny klucz, komora, ostatnia warta roku 106. | po pierwszej znalezionej karcie, 7–19 | 150 dośw. (+40 za kartę); notatka; wskazówka do D36 | praca rękami (uderzenia), notatki w dzienniku, upływ czasu | kopiec + kamień z krukiem, fundamenty `!$Zak_Fundament` |
| K69 | Grzędy Straży *(obejrzyj, przynieś)* | latarnik Bazyli (albo samo na grani) | Orla Grań → pustelnia | Trzy kamienne grzędy Skrzydlatej Straży na grani. Obejrzyj je i zanieś Kleofasowi strzemię spod pierwszej. Kleofas czyta z Księgi gniazd: „jeźdźca nosił tylko orzeł, który sam go wybrał”. | po D29 (flaga `orzelJajo`), Bazyli 14–22 | 120 dośw. (+40 za grzędę); orzeł przy grzędzie: więź +5 | Orzel (odczyt pozycji), deszcz w misach | grzęda `!$Zak_Grzeda`, ślady |
| K70 | Kawałki wraku *(pływy, łopata)* | „Eryk Sowa” (albo samo) | płycizny przy wraku (Map165) | Po każdym sztormie piasek odsłania kolejny kawałek „Białej Źrenicy”. Odkop je łopatą w odpływie: okucia, deska z nazwą (BIAŁA ŹRENICA – STRAŻ PEWNOŚCI), skrzynka kapitańska. | po pierwszym sztormie, w odpływie | 120 dośw.; 2× Okucie z wraku, Tabliczka z kadłuba, 40 G + Smoła; wpis do W12 | sztorm (Storm: stormStart/stormEnd), pływy (Wyspa.tide), łopata | kawałki `!$Zak_Wrak` |

## Blok do `docs/QUESTY.md` – 3. Dłuższe questy

| D36 | Cień Strażnika *(zagadka cieni, komora)* | samo (po K68 albo przy płycie w kręgu) | krąg menhirów (Łąka menhirów) → komora pod menhirami (mapa 176) | „Gdy słońce przejdzie cztery części swej drogi z pięciu, Strażnik wskaże ręką.” 1) Zrozum zapiski (karty 3 i 4). 2) Kop łopatą tam, gdzie pada cień Strażnika – tylko o właściwej porze (latem ok. 18–20, zimą ok. 15:30–17:30), nie w deszcz. 3) Kamienny klucz w płytę z krukiem otwiera schody. 4) Obejrzyj ścianę z czterema wieżami: trzy na drogach i czwarta na przylądku – dziś latarnia. | Akt I–II | 200 dośw., Klucz Strażnika, Pióro Skrzydlatej Straży (albo 60 G), notatka „Komora pod menhirami” | słońce i cienie (Sky, Okolice.shadowAt), pogoda (Survival), pochodnia (Torch), łopata | płyta `!$Zak_Plyty`, mapa 176 |
| D37 | Groby z krukiem *(praca, imiona)* | Ambroży Dzwonnik | stary cmentarz za miasteczkiem → dzwonnica | Trzy kamienie z krukiem zarosły mchem. Oczyść je rękami (grabarz Hieronim powie, gdzie są) i zanieś Ambrożemu imiona: Bogusław, strażnik wieży; Żelisław, kronikarz; Wit, strażnik bramy, roku sto szóstego. Ambroży dzwoni „cztery i jeden” – cztery straże i piąty, który niesie słowo. | od dnia 6, 7–20 | 120 dośw., Opinia +3, notatka | praca rękami (uderzenia), TownLife (grabarz) | groby `!$Zak_Groby`, grabarz `$Npc_Grabarz` |
| D38 | Godzina milczenia *(cisza, cierpliwość)* | samo przy gaju | gaj Milczących (za Osadą Milczących) | O zmierzchu stań w środku kręgu siedmiu białych kamieni i wytrzymaj godzinę: bez biegu, z bronią schowaną, bez rozmowy, nie dalej niż trzy kroki od środka. Złamana cisza – „Milczący odwracają głowy”, od nowa następnego dnia. | Akt II (osada otwarta), od zachodu słońca | 150 dośw., Biały kamień milczenia (pamiątka), premia „Spokój Milczących” 6 h | czas (Sky.sunTimes), tryb walki, bieg | kamienie `!$Zak_Male` |

## Blok do `docs/QUESTY_STAN.md`

K67, K68, K69, K70, D36, D37, D38 – zbudowane 2026-10-22 (paczka D, `Zakon_Data.js` / `Zakon.js`), test `tests/zakon_test.js`.

## Blok do `docs/STORY.md` (lore paczki D – nic nie przeczy kronikom)

- **Strażnice zakonu**: cztery wieże na czterech drogach – przy Polnej drodze, w Górach (droga ku przylądkowi), nad morzem na Urwisku i
  czwarta na przylądku, na której dziś stoi latarnia. Z każdej widać ogień sąsiedniej; „piąte oko to kruk” – kruczarze nosili listy między
  wieżami. Z trzech wież na drogach widać krąg kamieni na Łące menhirów.
- **Krąg menhirów** jest starszy niż zakon. Bracia warty składali przy nim przysięgę „patrzę i nie pytam”. Najwyższy kamień to Strażnik;
  w jego cieniu, o godzinie „czterech części drogi słońca z pięciu”, zakopano kamienny klucz. Pod płytą z krukiem jest komora pierwszego
  strażnika warty: sarkofag, misa z okiem i ściana z wykutą wyspą i czterema wieżami.
- **Zapiski strażnic** (6 kart, osobne od „Kroniki upadku”): roku 106 wieże gasły jedna po drugiej, kruki puszczono wolno; ostatni wpis
  kończy się słowami „nie pytaj o to, czego nie chcesz wiedzieć” – tymi samymi, które Borgar powtarza jak żart.
- **Skrzydlata Straż**: kamienne grzędy z żelazną poprzeczką i misą na deszczówkę na Orlej Grani; orle siodło z pasami na piersi, strzemiona
  pod szyją ptaka; Pióro Skrzydlatej Straży w srebrnej oprawce – znak jeźdźca, „którego orzeł sam wybrał”.
- **Stary cmentarz** za miasteczkiem: trzy groby braci zakonu (Bogusław, Żelisław, Wit – strażnik bramy, zginął w roku upadku); za braci
  dzwoniło się „cztery i jeden”. Grabarz Hieronim i jego ojciec ich nie ruszają. Szubienica Lorda przy wschodniej drodze.
- **Gaj Milczących**: siedem białych kamieni, godzina ciszy o zmierzchu.

## Łaty / uwagi dla koordynatora

- **`Okolice.js` `checkMap()` (l. 158)**: płycizny pakietu 0 (`plycizna_1..3`, tryb `tide`) zgłaszają kawałki wraku paczki D (2860–2862)
  jako „obce zdarzenie”, choć plan 7.10 kładzie je właśnie na płyciznach. Przez to `okolice_szkielet_test` ma 20/21 (Map165).
  Propozycja łaty: w filtrze `foreign` dla miejsc pakietu 0 pomijać zdarzenia właścicieli paczek:
  `&& !(s.pkg === "0" && OWNERS.has(e._twOwner || ""))`.
- `tests/journal_test.js` „sleeping through midnight queues the summary” – 27/28 na 9554 (dwa razy). Sonda (nowa gra, 21:00, sen do 7:00)
  pokazuje, że podsumowanie jest w kolejce z paczką D i bez niej (`_pendingSummary.day` = dzień snu). W teście mapa zdąża je zabrać przed
  odczytem (następna kontrola „the summary scene opens on the map” przechodzi) – wyścig testu, nie błąd paczki.
- Kompas po trzech strażnicach: paczka D ustawia `Tawerna.state("okolice").track = "menhiry_krag"` (gdy nic nie jest prowadzone) – brak
  publicznego `Okolice.track(key)`; jeśli koordynator doda takie API, łatwo przełączyć.
- Szarotka 228 (20 G) i warzucha 229 (6 G): paczka A może dopisać je do skupu Jagny, paczka C okucie 230 do skupu handlarza.

- `js/plugins.js`: opisy wpisów `Zakon_Data` i `Zakon` mają jeszcze „v0.0.0 (szkielet)” (tylko opis; plik wspólny – do integracji).
- Plan 7.7 każe dać miejsca grabarza do `SPOTS_BY_MAP[8]`, ale TownLife na mapie 8 czyta tylko `TownLifeData.SPOTS` – dopisane tam
  (własne klucze `grabarz_*`, jak robią Kantor/Wrak/Dwór).
- Plan 7.4 mówi o mgle „przez Mood” – Mood nie ma takiego API; mgła przy szubienicy to własna warstwa w `Zakon.js`.
- Epilog (`Underground.js`) – linijki dla gaju i komory do dopisania w integracji, jeśli użytkownik chce.
