# Sześć miejsc: lista łat na etap integracji

Zebrane z raportów pakietów (fala 1: A Pustelnia, D Garnizon, E Wrak). Uzupełniać po fali 2 (B, C, F).

## Zainstalowane mapy
- A: Map155, Map156 (pustelnia_test 37/37)
- D: Map162, Map163 (garnizon_test 45/45)
- E: Map165, Map166 (wrak_test 31/31)

## Testy do poprawienia
- `tests/wyspa_szkielet_test.js`: sprawdzenie `packs.length === 2` i „przystań bez gotowych miejsc” nie pasują po wypełnieniu pakietów.
- `tests/podgrodzie_life_test.js`: liczba mieszkańców miasteczka 21 zamiast 20 (doszedł Eryk Sowa / rozbitek 948).
- `tools/newstart/layout.py` + `run_transfer_test`: krawędzie nowych map (przystań ↔ pustelnia, przystań ↔ garnizon, garnizon ↔ wrak, pustelnia ↔ urwisko, urwisko ↔ przylądek, przylądek ↔ góry, cysterna ↔ urwisko).

## Cudze pliki (łaty)
- `js/plugins.js`: opisy wtyczek pakietów mają jeszcze dopisek „(szkielet)”.
- `TownQuests.js`: kalendarz Wigilii — „O północy Ambroży bije siedem razy” → teraz bije dzwon w wieży skryptorium na klifie (A, W2 rozdz. 7).
- `SpeechBubbles.js`: popiersia Pustelnik (A), Rotmistrz/Kwatermistrz/Werbownik/Żołnierz (D), Rozbitek (E) są dopisywane do BUSTS w kodzie przy ładowaniu — opcjonalnie przenieść do stałej tabeli.
- `TownLifeData.SPOTS`: miejsce `garnizon_werbownik` (22,37) dopisywane w kodzie (D) — opcjonalnie do danych.
- `Underground_Data.js`: epilog garnizonu (D); świat Serca czyta flagi pakietów.
- `Act3`: `ansgarAlly` (E) ma osłabić falę od kuchni; `Garnizon` przychylność 80 = dwóch żołnierzy w obronie (D już przez `Act3Data.DEFENDERS`).
- W5 Baltazar (gdy powstanie): flagi `wrakKamienieBaltazar` (E), karta 1 kronik odkupiona od Baltazara (A, na razie 40 G za dnia).
- `TavernLife_Regulars.js`: „Melia przestaje żartować” po W12 (E) — na razie jednorazowa uwaga, zrobić stałą.
- Ikony przedmiotów: 177 Tran, 178 Mapa z zaznaczeniami (E: `tools/wrak/art/icons/mapa_178.png` → pole 439), 179 Obrączka z krukiem — teraz zastępcze z RTP.
- Dokumenty: `docs/QUESTY.md`, `docs/QUESTY_STAN.md`, `docs/STORY.md` — K50, D23, W2 rozdz. 7 (A); K52, D26, D27 (D); D25, W12 (E); oraz zadania B, C, F.

## Decyzje koordynatora (drobne, za zgodą „lecimy ze wszystkim”)
- A: świec woskowych nie dodajemy; „Kleofas ci ufa” nie blokuje Nocy Pytania; karta od Baltazara tymczasowo 40 G; lore Dobiesza i pradziada kruczarza przyjęte; popiersie Kleofasa zostaje.
- E: kadłub przełamany na pół zostaje; łódź Janka działa także po D25 (do zmiany w Wrak.js przy integracji, jeśli dziś kończy się z D25); kara 20 G / napad 35% zostają.
- D: przychylność bez osobnej zakładki (popupy + rozmowa); patrol bierze 5 G / zapisuje wisiorek; Rafał poza listą poboru.

## Fala 2
- F Cysterna: Map167 zainstalowana (cysterna_test 41/41; 40/41 tylko przez chwilowy błąd w Kruk.js pakietu B w trakcie budowy). Łaty z `tools/miejsca_wyspy/staging_F/ZMIANY.txt`:
  1. `Underground.lordStance`: zamknięta gałąź dworska (`galazDworskaZamknieta` / `lordCold`) ma działać — dziś `lordAlly` ma pierwszeństwo. DECYZJA koordynatora: zamknięcie gałęzi ZAWSZE daje `lordCold` (nie tylko gdy był sojusznikiem) — zmienić w Cysterna.js.
  2. Studnia poniżej 15: zamiast opakowania `Farming.rationWell` — ujemny `wellBonus` (Farming_Plots.rationOf obcina go dziś do zera).
  3. Epilog cysterny w `Underground_Data.js`.
  4. D28, K53 w QUESTY / QUESTY_STAN.
  5. Pakiet B: krata strona 2 na przełączniku 17 → 167 (33,3); znaczniki `rynna_1..4` na polach dostępnych z sąsiedniego pola.
  6. Pakiet A: „karta 6 czyta się łatwiej” — niezrobione (opcjonalne).
- Decyzje F (koordynator): zapas od pierwszej wizyty — zostaje; liczby zimowe — zostają; czerpak po całym D28 — zostaje; konewka jako naczynie — zostaje; Opinia −2 przy <15 — zostaje.

- C Latarnia: Map159-161 zainstalowane (latarnia_test 45/45). Łaty: ikona Tranu `tools/latarnia/art/icons/tran_177.png` → IconSet 438; epilog `LatarniaData.EPILOG` → Underground_Data; flagi `latarniaWizja1`, `latarniaZgasla`, `soczewkaRozbita/Sprzedana` dla Aktu III i Serca. Snopy latarni nocą wyglądają żółtozielono — mają być ciepłe jak ogień (pomarańczowo-złote).
- Decyzje C (koordynator): nacisk opału zostaje; Janek sprzedaje tran NA STAŁE (nie tylko w czasie K49); wizja na Akt III — później; laterna jako kamienna izdebka zostaje.

- B Urwisko + kruk: Map157 zainstalowana (kruk_test 52/52; raz 51/52 „kruk spłoszony odlatuje” — niestabilne, sprawdzić). Łaty (staging_B/ZMIANY.txt): ikona obrączki `tools/kruk/art/icons/obraczka_179.png` → IconSet 440 i Items 179 iconIndex 440 (K51/D24 mają teraz ikonę 437); opisy Kruk_Data/Kruk w plugins.js „(szkielet)”; `tests/pustelnia_test.js` — sprawdzenie „Urwisko niegotowe” odwrócić; `wyspa_szkielet_test` — paczka „Kruk”; `Birds.guarded` pyta `Kruk.guards(mapId,x,y)`; klawisz K w ściągawce/podpowiedziach klawiszy; epilog kruka w Underground_Data; K51, D24 w QUESTY/QUESTY_STAN/STORY; krawędzie 155↔157↔159 w layout.py / run_transfer_test.
- Decyzje B (koordynator): klawisz K zostaje; Grzęda kruka UKRYTA w liście budowy do oswojenia kruka (zmiana w Farming); kroki `kruk: true` — oznaczyć 2–3 sensowne kroki zadań z listami/wiadomościami; obóz kopaczy i rozmiar kruka zostają.

## NOWA ZAKŁADKA F9 „Wyspa i fabuła” (decyzja użytkownika)
- Przenieś mnie do: Przystań, Pustelnia, Urwisko Kruków, Przylądek z latarnią, Garnizon nad zatoką, Wrak (w odpływie), Stara cysterna, Chata pod lasem, Spalona zagroda (+ ewentualnie wnętrza).
- Pogoda/morze: odpływ / przypływ (przełącznik 20 i Wyspa.tide), mglista noc z wizją w latarni (przełącznik 19), woda czerwona / szara.
- Fabuła: przeskok do świtu dnia 61 bez spłaty (strata pola), spłać dług, +1000 G, odtwórz prolog.
- Postacie i wątki: oswojony kruk od razu (z imieniem), przychylność garnizonu ±20, otwarcie cysterny (W1 rozdz. 7 / cisternOpen).

## Znane, poza pakietami
- Nocą zewnętrzny krąg światła ognia nad wodą wygląda chłodno (warstwa nocy) — przystań, garnizon.

## Stan integracji (pakiet 7, 2026-10-16) - odhaczone
Pliki gry pisane wprost (edytor zamknięty, `tasklist` przed każdym zapisem do `data/` i `js/plugins.js`); kopie w
`backup_art_2026-10-16/miejsca_wyspy/INT/`. Nic nie czeka na instalację.
- [x] `js/plugins.js`: prawdziwe opisy 12 wtyczek pakietów (bez „(szkielet)”), Wyspa v1.1.0, Debug v1.7.0, CzerwonaWoda v1.1.0.
- [x] `TownQuests.js`: Wigilia w kalendarzu - dzwon w wieży skryptorium na klifie (po zawieszeniu serca: Noc Pytania u Kleofasa).
- [x] `SpeechBubbles.js`: popiersia Pustelnik, Latarnik, Rotmistrz, Kwatermistrz, Werbownik, Zolnierz (+ Zolnierz_B), Rozbitek w stałej
      tabeli BUSTS; dopisywanie w czasie ładowania usunięte z Pustelnia/Latarnia/Garnizon/Wrak.
- [ ] `TownLifeData.SPOTS` `garnizon_werbownik` - zostaje w Garnizon_Data.js (opcjonalne, działa).
- [x] `Underground_Data.js` EPILOGUE.island + `Underground.world().island`: linijka epilogu dla pustelni, kruka (z imieniem; strażnik:
      „siada na kracie w piwnicy”), latarni (soczewka rozbita / sprzedana / zgasła albo wg zakończenia - zdania z LatarniaData.EPILOG),
      garnizonu (Kłos wydany / 80+ / poniżej 10), wraku (sojusznik / wydany / uciekł), cysterny (gałąź / rynny / otwarta).
- [x] `Underground.lordStance`: `lordFlags.branch` (galazDworskaZamknieta) - sojusznik przestaje nim być (rywal), chyba że poznał prawdę.
      `Cysterna.js`: zamknięcie gałęzi ZAWSZE daje `lordCold`.
- [x] Studnia poniżej 15: `Cysterna.wellLow()` → `TownQuests.wellBonus` −1 → `Farming_Plots.rationOf` (min. 1 nabranie, popup „Studnia
      prawie sucha”); opakowanie `Farming.rationWell` usunięte.
- [x] Akt III (`Act3_Data.js` / `Act3.js`): `ansgarAlly` - fala kuchenna o jednego mniej + napis „Kuchnia zaryglowana”; `soczewkaSprzedana` -
      dodatkowy nożownik Czarnych Oczu z dowódcą; `latarniaWizja1` - notatka i napis „Statek bez bandery” na początku ostrzeżeń;
      garnizon 80 = dwóch żołnierzy (Garnizon.js przez DEFENDERS, bez zmian).
- [x] W5 Baltazar (2026-10-17, `Kantor.js`): `wrakKamienieBaltazar`, `soczewkaSprzedana`, `krukBaltazarWie`, `wrakMapaSprzedana` jako linijki rejestru;
      karta 1 leży w szkatule w piwnicy kantoru (W5 rozdz. 4), odkup za dnia dopiero po tym rozdziale (Pustelnia.js pyta `Kantor.cardInBox`,
      cena `Kantor.priceMul`), odkup soczewki u wroga x2 (Latarnia.js), Kłos przy tylnych drzwiach = poszlaka W5 (zdarzenie 659 Garnizonu).
- [x] `TavernLife_Regulars.js`: Melia po wydaniu Ansgara (`ansgarGiven`) przestaje żartować NA STAŁE (powitania, nowiny, pożegnania).
- [x] Janek sprzedaje tran na stałe (od K49 albo po poznaniu Bazylego) - `Latarnia.js`.
- [x] Łódź Janka na wrak także po D25 - `Wrak.js`.
- [x] Snopy latarni nocą ciepłe jak ogień (pomarańczowo-złote, dwie warstwy: ciepły odcień + światło) - `Latarnia.js`;
      zrzut `latarnia_snopy_ogien.png`.
- [x] Grzęda kruka ukryta w liście budowy do oswojenia (`needFlag: "krukTame"` w Farming_Data, filtr w Farming_UI).
- [x] `kruk: true`: K32 „List od dziadka” (list do Lorda) i D17 „Petycja do Lorda” (kruk może je zanieść).
- [x] `Birds.guarded` pyta `Kruk.guards` (nie wtedy, gdy kruk jest na tej mapie na żywo - wtedy sam przegania stadka).
- [x] Klawisz K w pomocy klawiszy (Farming.js „KLAWISZE NA MAPIE”) i w keys_test.
- [x] IconSet 438 Tran, 439 Mapa z zaznaczeniami, 440 Obrączka z krukiem (pola były wolne); Items.json 177-179 iconIndex 438-440;
      K51 / D24 z ikoną obrączki (440).
- [x] Dokumenty: QUESTY.md, QUESTY_STAN.md, STORY.md (K49-K53, D22-D28, W11, W12, W2 rozdz. 7).
- [x] Krawędzie: `tools/newstart/layout.py` ISLAND_EDGES / ISLAND_DOORS (poza EDGES - skrypty apply ich nie piszą) + run_transfer_test
      (odpływ przed łachą, krata Urwiska przyciskiem akcji).
- [x] Podwójna przychylność za wydanie Ansgara (+20 Wrak + 10 Garnizon) - zostaje +20 (Garnizon_Data `ansgar: 0`).
- [ ] Pakiet A „karta 6 czyta się łatwiej” po D28 - niezrobione (opcjonalne).
- [ ] Chłodny zewnętrzny krąg ognia nad wodą nocą (warstwa nocy) - poza pakietami, nie ruszane.
- [x] Testy: wyspa_szkielet_test (paczki pakietów, gotowe miejsca), podgrodzie_life_test (21), pustelnia_test (Urwisko gotowe),
      kruk_test (spłoszony kruk: czeka, aż kruk jest i aż odleci; grzęda w liście dopiero po oswojeniu), cysterna_test (studnia), debug_menu_test.
- [x] NOWA ZAKŁADKA F9 „Wyspa i fabuła” (Debug.js; zrzut `f9_wyspa.png`): Przenieś mnie do (9 miejsc + wnętrza), Morze i pogoda (odpływ,
      przypływ, mglista noc z wizją, woda czerwona / szara), Fabuła (świt dnia 61 bez spłaty, spłać dług / odkup pole, +1000 G, odtwórz
      prolog), Postacie (kruk od razu, przychylność garnizonu ±20, otwarcie cysterny). Nowe API: `Wyspa.forceTide`, `CzerwonaWoda.force`,
      `Prologue.replay`.
- [x] Przy testach wyszło i poprawione: `TownQuests.talkFor` padał w rozmowie fabularnej z dziadkiem na zadaniu bez oferty (D24 -
      `q.offer.auto`), `latarnia_test` (Urwisko gotowe: lewa krawędź prowadzi na 157), `keys_test` (grzęda w liście Q dopiero po oswojeniu).
- Testy po integracji (CDP 9507, bez nakładek): wyspa_szkielet 18/18, pustelnia 37/37, kruk 53/53 (dwa razy), latarnia 45/45,
  garnizon 45/45, wrak 31/31, cysterna 41/41, podgrodzie_life 14/14, keys 56/56, town_life 10/10, town_quests 59/59, talk_busts 39/39,
  przystan 34/34, red_water 15/15, field_loss 54/54, town_well 8/8, buildings_contract 1/1, birds 25/25, prologue 36/36, act3 47/47,
  debug_menu 62/62, underground 59/59, needs 56/56, heart 25/25, run_transfer_test 87/87 przejść.
