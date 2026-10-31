# Świat Kruczej Wyspy w kratkach: wersja „z map”

2026-10-30. **PROJEKT do oceny.** W `data/` ani `js/` nic nie zmieniłem. Maska kruka przestała obowiązywać; poprzednią wersję (kruk) zachowano w `docs/mapy/kruk_wersja/` (obrazki, `swiat.json`, `SWIAT.md`) i `tools/mapy/kruk_wersja/` (narzędzia), żeby można było porównać.

Obrazki w `docs/mapy/`: `swiat_podglad.png` (ładny podgląd), `swiat_kratki.png` (techniczny: czerwona linia = krawędź bez sąsiada z lądem, niebieska = morze), `swiat_kratki_podzial.png` (puzzle), `swiat_zblizenia.png` (zbliżenia styków z brzegiem). Dane: `swiat.json`. Narzędzia: `swiat_kratki.py`, `swiat_obrazy.py`, `swiat_opis.py`, `swiat_krawedzie.py` (sprawdza krawędzie), `uklad_beam.py` (szuka układu).

## Kształt w dwóch zdaniach

Wyspa wynika z samych map: u góry rząd wybrzeża północnego (Pustelnia, Urwisko, Latarnia) i kolumna wschodnia (Latarnia, Orla Grań, Osada), pod nią zwarty rdzeń (Góry, miasto, Posiadłość Lorda, pola z Kruczym Jarem) i południowy brzeg z Łąkami i Spaloną zagrodą, a na zachodzie Podgrodzie, Przystań i Garnizon z Wrakiem na mieliźnie. Brzeg ciągnie się tam, gdzie mapy mają własny brzeg (zachód, północ, wschód, południe), a nowe mapy brzegowe domykają luki; wnętrza lądu bez map nie ma poza zatoczkami między mapami.

## Jak działa świat

- Jedna siatka kratek; mapa to prostokątny wycinek (x0, y0, szer., wys.). Sąsiedzi dzielą krawędź co do kratki, a przejście z kratki (X, Y) prowadzi do tej samej kratki świata w sąsiedniej mapie.
- **Morze to woda w kafelkach map** (tools/brzeg dał mapom krańcowym brzeg i morze ze wszystkich stron). Nowe mapy brzegowe mają ten sam pas morza (16 kratek) od wskazanych stron, więc brzeg przechodzi przez granice bez skoku. Nic nie jest malowane maską, więc nigdzie nie ma prostokątnej wody urwanej na krawędzi mapy.
- Każda krawędź mapy jest albo wspólna z sąsiadem (woda w wodę, ląd w ląd), albo w całości leży w morzu. Sprawdza to `python tools/mapy/swiat_krawedzie.py` („ucięte krawędzie” = krawędź bez sąsiada z lądem).

## Najważniejsze liczby

- Mapy obecne: 21. Mapy powiększone: 3 (8 Okolice Tawerny: +0 w prawo, +7 w dół; 111 Podgrodzie: +10 w prawo, +0 w dół (kolumny wstawione przed murem, od x 90); 159 Przylądek z latarnią: +0 w prawo, +6 w dół). Nowe mapy: **9**.
- Nakładanie map: 0 kratek. Niepołączone mapy: brak.
- Przesunięcie przecięcia brzegu na granicach map: co najwyżej 1 kratek.
- **Ucięte krawędzie (krawędź bez sąsiada z lądem): 20 odcinków, 843 kratek.** To jest jedyny warunek, którego ten układ jeszcze nie spełnia (lista niżej); `swiat_krawedzie.py` zgłasza go jako BŁĄD, dopóki nie będzie zero.
- Kratki do poprawienia na stykach (woda po jednej, ląd po drugiej stronie): 74 (drobne poprawki brzegu, lista niżej).

## Tabela map

| mapa | x0, y0 | rozmiar | sąsiedzi (strona: mapa, kratki wspólne) |
|---|---|---|---|
| 8 Okolice Tawerny * | 162, 182 | 104 x 145 | E: 22 (53); E: 24 (60); E: 120 (32); N: 13 (104); S: 125 (104); W: 111 (112) |
| 24 Posiadłość Lorda * | 266, 214 | 80 x 60 | E: 3 (32); N: 120 (80); S: 22 (80); W: 8 (60) |
| 111 Podgrodzie * | 60, 215 | 102 x 112 | E: 8 (112); S: 125 (8); W: 904 (56); W: 905 (56) |
| 125 Przystań | 154, 327 | 112 x 80 | E: 21 (60); E: 22 (7); E: 902 (13); N: 8 (104); N: 111 (8); S: 162 (112) |
| 22 Polna droga | 266, 274 | 80 x 60 | E: 3 (28); E: 20 (32); N: 24 (80); S: 21 (80); W: 8 (53); W: 125 (7) |
| 20 Dom dziadka | 346, 302 | 60 x 44 | E: 18 (44); N: 3 (60); W: 21 (12); W: 22 (32) |
| 21 Leśna droga | 266, 334 | 80 x 60 | E: 20 (12); N: 22 (80); S: 902 (80); W: 125 (60) |
| 13 Góry i kamieniołom * | 146, 86 | 120 x 96 | E: 120 (36); E: 175 (60); N: 157 (112); N: 159 (8); S: 8 (104); W: 155 (2); W: 901 (94) |
| 120 Osada Milczących | 266, 146 | 96 x 68 | N: 175 (96); S: 24 (80); W: 8 (32); W: 13 (36) |
| 175 Orla Grań | 266, 86 | 96 x 60 | N: 159 (96); S: 120 (96); W: 13 (60) |
| 23 Skraj lasu * | 426, 242 | 80 x 60 | N: 4 (24); N: 903 (56); S: 17 (20); S: 18 (60); W: 3 (60) |
| 168 Spalona zagroda | 566, 290 | 100 x 88 | N: 906 (50); N: 907 (50); W: 17 (76) |
| 3 Kruczy Jar * | 346, 242 | 80 x 60 | E: 23 (60); N: 4 (56); S: 18 (20); S: 20 (60); W: 22 (28); W: 24 (32) |
| 4 Łąka#1 * | 370, 182 | 80 x 60 | E: 903 (60); S: 3 (56); S: 23 (24) |
| 17 Łąka#2 | 486, 302 | 80 x 76 | E: 168 (76); N: 23 (20); W: 18 (76) |
| 18 Łąka#3 | 406, 302 | 80 x 76 | E: 17 (76); N: 3 (20); N: 23 (60); W: 20 (44) |
| 162 Garnizon nad zatoką | 154, 407 | 112 x 80 | E: 902 (80); N: 125 (112); S: 908 (48); S: 909 (64); W: 165 (60) |
| 165 Wrak na mieliźnie | 74, 407 | 80 x 60 | E: 162 (60) |
| 155 Pustelnia na klifie | 50, 16 | 96 x 72 | E: 13 (2); E: 157 (70); S: 901 (96) |
| 157 Urwisko Kruków | 146, 14 | 112 x 72 | E: 159 (72); S: 13 (112); W: 155 (70) |
| 159 Przylądek z latarnią | 258, 0 | 104 x 86 | S: 13 (8); S: 175 (96); W: 157 (72) |

`*` = mapa gracza. Współrzędne w kratkach świata (lewy górny róg, y w dół).

## Nowe mapy

Nowe mapy mają pas morza 16 kratek od wskazanych stron (jak Łąki, Latarnia, Osada, Orla Grań), ląd (las i łąka, ścieżka) od strony sąsiada; rozmiar co najmniej 60 x 40.

| nr | rozmiar | x0, y0 | morze | sąsiedzi |
|---|---|---|---|---|
| 901 | 96 x 110 | 50, 88 | morze: zachód, południe | 13, 155 |
| 902 | 96 x 96 | 266, 394 | morze: południe, wschód | 21, 125, 162, 909 |
| 903 | 72 x 76 | 450, 166 | morze: północ, wschód | 23, 4 |
| 904 | 60 x 72 | 0, 199 | morze: zachód, północ | 111, 905 |
| 905 | 60 x 72 | 0, 271 | morze: zachód, południe | 111, 904 |
| 906 | 66 x 60 | 550, 230 | morze: północ, zachód | 907, 168 |
| 907 | 66 x 60 | 616, 230 | morze: północ, wschód | 168, 906 |
| 908 | 64 x 60 | 138, 487 | morze: południe, zachód | 909, 162 |
| 909 | 64 x 60 | 202, 487 | morze: południe | 902, 162, 908 |

## Mapy gracza: dokładna lista zmian

### 8 Okolice Tawerny

- Świat: x0 = 162, y0 = 182, rozmiar 104 x 145 (powiększenie: +0 kolumn, +7 rzędów).
- Sąsiedzi: wschodnia: 22 Polna droga (kratki świata 274-327); wschodnia: 24 Posiadłość Lorda (kratki świata 214-274); wschodnia: 120 Osada Milczących (kratki świata 182-214); północna: 13 Góry i kamieniołom (kratki świata 162-266); południowa: 125 Przystań (kratki świata 162-266); zachodnia: 111 Podgrodzie (kratki świata 215-327).
- Krawędź południowa, kratki x 24-26: dziś do 22 Polna droga; **po zmianie do 125 Przystań** (ta sama kratka świata).
- Krawędź wschodnia, kratki y 50-51: do 24 Posiadłość Lorda, **lądowanie przesunięte** (ten sam sasiad, ladowanie przesuniete o 4 kratek).
- Krawędź zachodnia, kratki y 50-51: **bez zmian**, nadal do 111 Podgrodzie.
- **+7 rzędów w dół** (lokalnie y 138-144, ciąg gruntu południowych obrzeży): dolna krawędź miasta wyrównuje się z dolną krawędzią Podgrodzia, a Przystań (125) leży całą szerokością pod miastem. Wyjście południowe (x 24-26) wchodzi do Przystani w tej samej kratce.

### 24 Posiadłość Lorda

- Świat: x0 = 266, y0 = 214, rozmiar 80 x 60.
- Sąsiedzi: wschodnia: 3 Kruczy Jar (kratki świata 242-274); północna: 120 Osada Milczących (kratki świata 266-346); południowa: 22 Polna droga (kratki świata 266-346); zachodnia: 8 Okolice Tawerny (kratki świata 214-274).
- Krawędź zachodnia, kratki y 14-16: do 8 Okolice Tawerny, **lądowanie przesunięte** (ten sam sasiad, ladowanie przesuniete o 4 kratek).

### 3 Kruczy Jar

- Świat: x0 = 346, y0 = 242, rozmiar 80 x 60.
- Sąsiedzi: wschodnia: 23 Skraj lasu (kratki świata 242-302); północna: 4 Łąka#1 (kratki świata 370-426); południowa: 18 Łąka#3 (kratki świata 406-426); południowa: 20 Dom dziadka (kratki świata 346-406); zachodnia: 22 Polna droga (kratki świata 274-302); zachodnia: 24 Posiadłość Lorda (kratki świata 242-274).
- Krawędź północna, kratki x 28-31: do 4 Łąka#1, **lądowanie przesunięte** (ten sam sasiad, ladowanie przesuniete o 19 kratek).
- Krawędź południowa, kratki x 8-10: dziś do 17 Łąka#2; **po zmianie do 20 Dom dziadka** (ta sama kratka świata).
- Krawędź zachodnia, kratki y 14-16: dziś do 18 Łąka#3; **po zmianie do 24 Posiadłość Lorda** (ta sama kratka świata).
- Krawędź wschodnia, kratki y 12-14: **bez zmian**, nadal do 23 Skraj lasu.

### 4 Łąka#1

- Świat: x0 = 370, y0 = 182, rozmiar 80 x 60.
- Sąsiedzi: wschodnia: 903 Nowa mapa 903 (kratki świata 182-242); południowa: 3 Kruczy Jar (kratki świata 370-426); południowa: 23 Skraj lasu (kratki świata 426-450).
- Krawędź południowa, kratki x 23-26: do 3 Kruczy Jar, **lądowanie przesunięte** (ten sam sasiad, ladowanie przesuniete o 19 kratek).

### 23 Skraj lasu

- Świat: x0 = 426, y0 = 242, rozmiar 80 x 60.
- Sąsiedzi: północna: 4 Łąka#1 (kratki świata 426-450); północna: 903 Nowa mapa 903 (kratki świata 450-506); południowa: 17 Łąka#2 (kratki świata 486-506); południowa: 18 Łąka#3 (kratki świata 426-486); zachodnia: 3 Kruczy Jar (kratki świata 242-302).
- Krawędź zachodnia, kratki y 12-14: **bez zmian**, nadal do 3 Kruczy Jar.
- Krawędź północna, kratki x 23-25: dziś do 22 Polna droga; **po zmianie do 903 Nowa mapa 903** (ta sama kratka świata).

### 13 Góry i kamieniołom

- Świat: x0 = 146, y0 = 86, rozmiar 120 x 96.
- Sąsiedzi: wschodnia: 120 Osada Milczących (kratki świata 146-182); wschodnia: 175 Orla Grań (kratki świata 86-146); północna: 157 Urwisko Kruków (kratki świata 146-258); północna: 159 Przylądek z latarnią (kratki świata 258-266); południowa: 8 Okolice Tawerny (kratki świata 162-266); zachodnia: 155 Pustelnia na klifie (kratki świata 86-88); zachodnia: 901 Nowa mapa 901 (kratki świata 88-182).
- Krawędź zachodnia, kratki y 38-40: dziś do 21 Leśna droga; **po zmianie do 901 Nowa mapa 901** (ta sama kratka świata).
- Krawędź północna, kratki x 5-7: dziś do 120 Osada Milczących; **po zmianie do 157 Urwisko Kruków** (ta sama kratka świata).
- Krawędź wschodnia, kratki y 11-13: dziś do 159 Przylądek z latarnią; **po zmianie do 175 Orla Grań** (ta sama kratka świata).
- Szlak górski: z północnej bramy miasta (8) przez wspólną krawędź 8 / 13 (13 leży bezpośrednio nad miastem) przez Góry na wspólną krawędź 13 / 175 (Orla Grań leży na wschód od Gór).

### 111 Podgrodzie

- Świat: x0 = 60, y0 = 215, rozmiar 102 x 112 (powiększenie: +10 kolumn, +0 rzędów).
- Sąsiedzi: wschodnia: 8 Okolice Tawerny (kratki świata 215-327); południowa: 125 Przystań (kratki świata 154-162); zachodnia: 904 Nowa mapa 904 (kratki świata 215-271); zachodnia: 905 Nowa mapa 905 (kratki świata 271-327).
- Krawędź wschodnia, kratki y 17-18: **bez zmian**, nadal do 8 Okolice Tawerny.
- Krawędź zachodnia, kratki y 19: dziś do 125 Przystań; **po zmianie do 904 Nowa mapa 904** (ta sama kratka świata).
- **Wariant z jednym murem: 10 kolumn wstawionych PRZED murem, od x 90.** Mapa rośnie z 92 do 102 kolumn. Nowe kolumny x 90-99 to czysty grunt i suche koryto (fosa) przed murem po stronie Podgrodzia; pas muru i bramy z x 90-91 przesuwa się o +10 na x 100-101 (nowy wschodni brzeg).
- Przesuwa się o +10 kolumn: kafle muru z x 90-91; #19 Pochodnia na baszcie (90,13) -> (100,13); #90 Brama zachodnia: skrzydło i cień (90,18) -> (100,18); #91 światło latarni (91,16) -> (101,16); #89 dach i słupy (91,19) -> (101,19); przejścia #65 (91,17) -> (101,17) i #66 (91,18) -> (101,18); zasoby na x 90: Drzewo #111 (90,84), Drzewo #254 (90,88), Suchy krzaczek #290 (90,101), każdy o +10.
- Zostaje na miejscu (x <= 89, placyk przed bramą): #18 latarnia (88,19), #20 żebrak (88,14), #67 drogowskaz (86,15), #70 brama_zach (87,18), #71 i #72 żebrak, #400 w5_lada (89,17), płot ok. x 85, wszystkie budynki i zdarzenia o x < 90.
- Fosa w x 90-99, most z placyku (x 89) do bramy (x 100), 10 kratek długości, 4 szerokości (lokalnie y 16-19). Poniżej linii murów koryto biegnie dalej w tych samych kolumnach na południe, do dolnej krawędzi mapy (sąsiad południowy: 125 Przystań, kratki x 94-101) i dalej do basenu Przystani.

## Przystań, Dom dziadka, szlak górski

- **Przystań (125) leży bezpośrednio pod Okolicami Tawerny (8)** na całej szerokości miasta (104 kratki wspólne), a Garnizon (162) pod Przystanią. Wejście od zachodu: zachodnia krawędź Przystani (woda, basen) wychodzi na morze świata; obecna woda mapy zostaje jako basen, mapy nie odbijamy.
- **Dom dziadka (20) dotyka Kruczego Jaru (3) od południa**, Posiadłość Lorda (24) dotyka pola od zachodu. Trasa Dom dziadka -> miasto: 20 -> 3 -> 24 -> 8 (2 mapy pośrednie).
- **Szlak górski**: z północnej bramy miasta (8) w górę do Gór (13) i dalej na wschód do Orlej Grani (175).

## Brzeg na wspólnych krawędziach

Kratki świata, w których linia brzegu przecina wspólną krawędź (y dla krawędzi pionowej, x dla poziomej), przejście i kierunek (kąt; 0° = w prawo, 90° = w górę) z pola lądu. Skok na granicy: różnica położenia przecięcia między ostatnią kolumną jednej mapy a pierwszą drugiej.

| krawędź | strona A | odcinek | skok | brzeg przecina w kratce (kąt) |
|---|---|---|---|---|
| 8 Okolice Tawerny <-> 125 Przystań | południowa | x 162-266 | 0 |  |
| 125 Przystań <-> 162 Garnizon nad zatoką | południowa | x 154-266 | 0 | x = 169 (93.5°) |
| 175 Orla Grań <-> 120 Osada Milczących | południowa | x 266-362 | 0 | x = 346 (91.5°) |
| 17 Łąka#2 <-> 168 Spalona zagroda | wschodnia | y 302-378 | 0 | y = 362 (178.5°) |
| 18 Łąka#3 <-> 17 Łąka#2 | wschodnia | y 302-378 | 0 | y = 362 (178.0°) |
| 162 Garnizon nad zatoką <-> 902 Nowa mapa 902 | wschodnia | y 407-487 | 0 |  |
| 165 Wrak na mieliźnie <-> 162 Garnizon nad zatoką | wschodnia | y 407-467 | 0 | y = 427 (113.5°); y = 430 (48.6°) |
| 155 Pustelnia na klifie <-> 157 Urwisko Kruków | wschodnia | y 16-86 | 1 | y = 20 (13.7°) |
| 155 Pustelnia na klifie <-> 901 Nowa mapa 901 | południowa | x 50-146 | 0 | x = 71 (53.1°) |
| 157 Urwisko Kruków <-> 159 Przylądek z latarnią | wschodnia | y 14-86 | 0 | y = 33 (2.6°) |
| 159 Przylądek z latarnią <-> 175 Orla Grań | południowa | x 266-362 | 0 | x = 346 (91.5°) |
| 904 Nowa mapa 904 <-> 905 Nowa mapa 905 | południowa | x 0-60 | 0 | x = 16 (90.0°) |
| 906 Nowa mapa 906 <-> 907 Nowa mapa 907 | wschodnia | y 230-290 | 0 | y = 246 (0.0°) |
| 908 Nowa mapa 908 <-> 909 Nowa mapa 909 | wschodnia | y 487-547 | 0 | y = 531 (0.0°) |

## Ucięte krawędzie (do domknięcia)

Krawędzie map bez sąsiada, na których jest ląd (mapa, strona, kratki lokalne od-do, liczba kratek). Do domknięcia nowymi mapami brzegowymi (przylądki z pasem morza) albo przesunięciem sąsiada; `swiat_krawedzie.py` pokazuje stan.

- 8 Okolice Tawerny, krawędź zachodnia, kratki 0-33 (33)
- 24 Posiadłość Lorda, krawędź wschodnia, kratki 0-28 (28)
- 111 Podgrodzie, krawędź północna, kratki 0-102 (102)
- 111 Podgrodzie, krawędź południowa, kratki 0-94 (94)
- 125 Przystań, krawędź zachodnia, kratki 28-31 (3)
- 20 Dom dziadka, krawędź południowa, kratki 0-60 (60)
- 21 Leśna droga, krawędź wschodnia, kratki 12-60 (48)
- 13 Góry i kamieniołom, krawędź południowa, kratki 0-16 (16)
- 120 Osada Milczących, krawędź południowa, kratki 80-96 (16)
- 120 Osada Milczących, krawędź wschodnia, kratki 63-68 (5)
- 23 Skraj lasu, krawędź wschodnia, kratki 0-60 (60)
- 168 Spalona zagroda, krawędź zachodnia, kratki 0-12 (12)
- 168 Spalona zagroda, krawędź wschodnia, kratki 0-72 (72)
- 3 Kruczy Jar, krawędź północna, kratki 0-24 (24)
- 4 Łąka#1, krawędź północna, kratki 0-80 (80)
- 4 Łąka#1, krawędź zachodnia, kratki 0-60 (60)
- 17 Łąka#2, krawędź północna, kratki 20-80 (60)
- 18 Łąka#3, krawędź zachodnia, kratki 44-60 (16)
- 162 Garnizon nad zatoką, krawędź zachodnia, kratki 67-80 (13)
- 909 Nowa mapa 909, krawędź wschodnia, kratki 3-44 (41)

## Kratki do poprawienia na styku

Woda po jednej, ląd po drugiej stronie wspólnej krawędzi (drobne dopisanie brzegu przy zmianie mapy): 8 Okolice Tawerny / 125 Przystań: 4 kratek; 111 Podgrodzie / 125 Przystań: 8 kratek; 125 Przystań / 8 Okolice Tawerny: 4 kratek; 125 Przystań / 111 Podgrodzie: 8 kratek; 155 Pustelnia na klifie / 157 Urwisko Kruków: 1 kratek; 155 Pustelnia na klifie / 901 Nowa mapa 901: 5 kratek; 157 Urwisko Kruków / 155 Pustelnia na klifie: 1 kratek; 162 Garnizon nad zatoką / 902 Nowa mapa 902: 13 kratek; 162 Garnizon nad zatoką / 165 Wrak na mieliźnie: 3 kratek; 165 Wrak na mieliźnie / 162 Garnizon nad zatoką: 3 kratek; 901 Nowa mapa 901 / 155 Pustelnia na klifie: 5 kratek; 902 Nowa mapa 902 / 162 Garnizon nad zatoką: 13 kratek; 902 Nowa mapa 902 / 909 Nowa mapa 909: 3 kratek; 909 Nowa mapa 909 / 902 Nowa mapa 902: 3 kratek.

## Etapy

Po każdym etapie `python tools/mapy/swiat_krawedzie.py` sprawdza każdą krawędź kratka po kratce (woda, ląd, brzeg, ucięte krawędzie, przejścia); etap gotowy przy `WYNIK: OK`.

1. **Tułów**: miasto (8) z +7 rzędami, Przystań (125) pod nim, Podgrodzie (111) z wstawionymi kolumnami i fosą, Góry (13), szlak górski.
2. **Prawe skrzydło / wschód**: Posiadłość Lorda, Kruczy Jar, Łąka#1, Skraj lasu, Dom dziadka, Polna droga, Leśna droga, Łąki i Spalona zagroda, nowe mapy brzegowe.
3. **Lewe skrzydło i północ**: Pustelnia, Urwisko, Latarnia (+6 rzędów), Orla Grań, Osada, Garnizon, Wrak, nowe mapy brzegowe.
4. **Mapa w menu P z tego samego świata**.

## Pytania do gracza

1. Czy ogólny układ (obrazek `swiat_podglad.png`) Ci odpowiada? Wyspa jest zwarta i kanciasta, bo kształt wynika z map.
2. Czy zgoda na zmiany map gracza (8: +7 rzędów w dół, 111: 10 kolumn przed murem, nowe cele wyjść)?
3. Niedomknięte krawędzie: czy mam dołożyć kolejne nowe mapy brzegowe (przylądki), czy wolisz przesunąć niektóre mapy (np. 4 i 23), żeby luki same się zamknęły?
