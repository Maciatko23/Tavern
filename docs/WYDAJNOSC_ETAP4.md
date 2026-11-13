# Wydajność, etap 4: plan (2026-11-12)

## Cel

Na komputerze 4x wolniejszym (tak mierzymy „średni komputer”) gra ma się mieścić w budżetach testu `tests/wydajnosc_test.js`:

| Miejsce (chodząc) | Budżet | Teraz | Październik (po etapie 2) |
|---|---|---|---|
| Kruczy Jar | 22 ms | 25–29 ms | 11,8 ms |
| Miasto | 15 ms | 23–25 ms | 9,5 ms |
| Przystań nocą | 14 ms | 21–22 ms | 10,1 ms |
| Farma | 22 ms | 27–32 ms | 16,9 ms |
| Burza na Jarze | 22 ms | 34–37 ms | 17 ms |

Od października doszły: podwojone mapy, każde drzewo jako zdarzenie, Ziemia, Łąka, pory roku, cienie budynków, nowe miasto z setkami dekoracji. Pomiary skaczą o ±20%, bo komputer ma stałe ~30% obciążenia spoza gry (Windows Audio, Rainmeter); porównujemy zawsze na przemian (A, B, A, B) w tej samej sesji.

## Na co idzie czas (spis 2026-11-12)

Każda grupa wyłączona na chwilę i włączona z powrotem, na przemian, chodząc, procesor 4x wolniejszy:

| Grupa | Kruczy Jar (klatka ~22 ms) | Miasto (klatka ~22 ms) |
|---|---|---|
| Inne zdarzenia (dekoracje, dachy, drzwi, uprawy, latarnie, wyzwalacze) | 9% (74 szt.) | **61% (546 szt.)** |
| Kamienie, krzaki, pniaki | **18% (245)** | 3% |
| Drzewa | 13% (231) | 7% (50) |
| Warstwy ziemi (Ziemia, jej cień, Łąka, kępki trawy, rzeczy na ziemi, kałuże) | **16%** | ~0% |
| Nastrój + poświata (Mood.js) | 7% | 5% |
| HUD | 2% | 3% |
| Ludzie i zwierzęta | ~0% | ~0% |

W mieście z 546 zdarzeń: 128 to niewidoczne wyzwalacze bez obrazka, 45 dachy z oknami, 44 drzwi, 44 uprawy, 34 latarnie, 33 kafle, 32 ozdoby, reszta szyldy, rekwizyty, posągi, groby; tylko 37 ma animację kroków. Wszystkie są aktualizowane w pełni w każdej klatce (blisko ekranu) albo co 4. klatkę (daleko). Dziś „usypiane” (tryb `still` w `Wydajnosc.js`) są tylko dalekie drzewa, kamienie i krzaki.

Wniosek: największy zysk nie leży w drzewach, tylko w tym, że setki nieruchomych rzeczy robią co klatkę pełną pracę, choć nic się w nich nie zmienia.

## Etapy

### Etap A: uśpienie wszystkich nieruchomych zdarzeń (największy zysk, małe ryzyko)

Rozszerzenie trybu `still` z `Wydajnosc.js` na każde zdarzenie, które się nie rusza i nie zmienia wyglądu, także blisko ekranu:

1. Zdarzenie bez obrazka (wyzwalacz): duszek nie robi nic, dopóki strona zdarzenia nie da mu obrazka.
2. Zdarzenie z nieruchomym obrazkiem (dach, drzwi, uprawa, ozdoba, szyld, posąg, kamień, pniak): pełna aktualizacja tylko przy zmianie wyglądu (strona, obrazek, kierunek, klatka, przezroczystość, pora roku, poziom grafiki); blisko ekranu przy przewijaniu tylko przestawienie położenia.
3. Nie usypiamy: animacji kroków, ruchu, zdarzeń „zajętych” (ścinanie, łamanie, płonięcie, czapka posągu) i tego, co wtyczki animują same w duszku. Przegląd wszystkich haków duszków (`Tawerna.sprite.hook`, ~16 wtyczek) i oznaczenie takich rzeczy (`_wyKeep`) to główna praca tego etapu: okna o zmierzchu (Klimat_Miasta), dym, flagi, migotanie.
4. Zegar gry jako część wyglądu: co 10 minut gry wszystkie uśpione dostają jedną pełną aktualizację (rozłożoną na klatki), żeby rzeczy zależne od pory dnia nie zastygły.

Przełącznik `Wydajnosc.opts.stillAll` (domyślnie włączony), żeby test porównał obraz z wyłączonym i włączonym (zamrożona klatka, jak dziś `opts.still`).

Szacunek: miasto 22 → ~12–13 ms, Jar 22 → ~18 ms, farma podobnie jak Jar. Czas: ~1 dzień z przeglądem haków i testami.

### Etap B: warstwy ziemi przesuwane w całości (średni zysk, małe ryzyko)

Ziemia, jej cień, Łąka i rzeczy na ziemi trzymają setki małych obrazków, przestawianych pojedynczo przy każdym kroku przewijania. Każda warstwa dostaje jeden pojemnik w układzie mapy: przy przewijaniu przesuwa się tylko pojemnik, a obrazki zmieniają się tylko wtedy, gdy wchodzą lub wychodzą z ekranu.

Szacunek: Jar −8 do −10% (z 16%). Czas: ~pół dnia.

### Etap C: drzewa (opcjonalny, po zmierzeniu A i B)

Po etapie A dalekie i spokojne drzewa i tak są uśpione. Zostaje kołysanie bliskich drzew liczone co klatkę dla każdego drzewa. Dwie drogi:
- tańsza: kołysanie liczone tylko dla drzew blisko bohatera, dalsze stoją (zmiana wyglądu, do decyzji);
- droższa: kołysanie przeniesione na kartę graficzną (shader), wygląd bez zmian.

Szacunek: Jar −5 do −8%. Czas: pół dnia (tańsza) albo 1–2 dni (droższa). Robimy tylko, jeśli po A i B Jar nadal przekracza budżet.

### Etap D: nastrój i poświata (opcjonalny)

Mood.js to 5–7%: filtr na całym ekranie. Można liczyć poświatę w połowie rozdzielczości. Do rozważenia na końcu.

## Jak sprawdzamy

- `tests/wydajnosc_test.js`: budżety czasu i porównania obrazu (zamrożona klatka z przełącznikiem wyłączonym i włączonym: ten sam obraz).
- `tools/wydajnosc/szarpniecia.js`: 9 map w dzień i w nocy, żadnych nowych szarpnięć.
- Spis kosztów (jak wyżej) przed i po każdym etapie.
- Testy wtyczek dotkniętych przeglądem haków; zdjęcia ekranów do obejrzenia przed wgraniem.

## Ryzyka

- Rzecz animowana przez wtyczkę w duszku, której przegląd nie wyłapie, zastygnie. Zabezpieczenie: pełna aktualizacja co 10 minut gry i przy każdej zmianie wyglądu; porównania obrazu w teście; przegląd zdjęć ekranów.
- Wyniki pomiarów skaczą: decyzje tylko z pomiarów na przemian w tej samej sesji.

## Wykonane (2026-11-12, wieczór)

- Etap A (`Wydajnosc.opts.stillAll`): uśpione wszystkie dalekie zdarzenia, które same się nie ruszają i nie przebierają nogami (dotąd tylko drzewa, kamienie, krzaki). W mieście usypia się 499 z 604 duszków: na przemian w jednej sesji −24% na stojąco, −17% w ruchu. Bliskich nie usypiamy: Widok.js, kołyszące się szyldy, przenikanie drzew i życie domu zmieniają je co klatkę.
- Etap B: rzeczy na ziemi (Farming_Render, warstwa leży w układzie mapy, dzieci tylko przy ekranie, widoczność liczona przy przejściu o kafel, roślina nie wysyła siatki przy zmianie poniżej 1/20 piksela): 1,56 → ~0,9 ms; cień Ziemi: widoczność liczona przy przejściu o kafel. Z warstw ziemi kosztowały naprawdę tylko te dwie (8% i 4%), reszta ~0.
- Wcześniej tego dnia: pętla pomija warstwy z samymi biernymi dziećmi (~5%), runUpdaters bez kopii listy, cienie słońca poza ekranem bez macierzy, czerwona woda poza ekranem ukryta.
- Test `wydajnosc_test.js`: 11/16, wszystkie porównania obrazu i budżet tawerny przechodzą; zostały budżety Jaru (~24 ms / 22), miasta (~19–21 / 15), przystani (~17–19 / 14), farmy (~23 / 22) i burzy (~30–31 / 22).

## Co dalej (po A i B)

Sprawdzone tego samego wieczoru i odłożone, bo nie dają mierzalnego zysku:
- Bliskie zdarzenia w mieście przy stojącym bohaterze (pełna aktualizacja co 8. klatkę, tylko duszki obsługiwane przez „statyczne” wtyczki): kwalifikuje się tylko ~28 duszków, zysku nie widać w szumie. Wycofane.
- Etap C (drzewa): pasy drzew już teraz wysyłają siatkę do karty tylko przy przesunięciu o cały piksel; reszta to liczenie kołysania, które daje wygląd.
- Etap D (poświata): poświata jest już liczona w 1/4 rozdzielczości (Mood.js BLOOM_RES); pełne zostaje tylko ostatnie przejście (barwy, winieta).
- Burza na Jarze: narzut rozkłada się na drobne pozycje (cząstki deszczu ~0,2 ms, ślady ~0,1 ms, logika zdarzeń); żadnego odświeżania mapy w kółko.

Dalszy duży zysk wymagałby przebudowy samego potoku duszków (każdy bliski obiekt przechodzi kilkanaście haków wtyczek co klatkę) - osobny, większy etap.

## Szacunek całości

Etapy A + B: Jar ~22–25 → ~15–16 ms, miasto ~22 → ~12–13 ms (4x wolniejszy procesor), czyli powrót w okolice budżetów. Etapy C i D tylko w razie potrzeby.
