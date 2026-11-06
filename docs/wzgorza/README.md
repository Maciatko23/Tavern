# Zaokrąglone wzgórza (próba, 2026-11-01)

Wtyczka `Wzgorza.js` (staging: `tools/wzgorza/staging/js/plugins/`), pilot na Map990 i Map013. Mapy bez zmian.

- `przed_*.png` / `po_*.png` - te same miejsca z gry bez nakładki i z nakładką (`tests/wzgorza_zrzuty.js`, `tools/wzgorza/zrzuty.sh`).
- `pary/para_*.png` - lewa połowa przed, prawa po (`python tools/wzgorza/porownaj.py nazwa [x0 y0 x1 y1 [skala]]`).
- `ukrycie_bez_*.png` / `ukrycie_z_*.png` - bohater za tylną krawędzią, z boku, na szczycie i przed licem (`tests/wzgorza_ukrycie.js`).
- Instalacja dopiero po decyzji gracza: `python tools/wzgorza/install.py --dry-run`, potem `--wykonaj`.

## Runda 2 (2026-11-01): `runda2/`

- `runda2/przed_*.png` = wersja zainstalowana (runda 1), `runda2/po_*.png` = nowa wtyczka ze stagingu; `runda2/pary/para_*.png` (lewa przed, prawa po),
  `runda2/orig_*.png` = kafle bez nakładki. Miejsca: stopień w górnej krawędzi (`A_stopien`), lewy bok (`A_lewy_bok`, `A_h1_lewy`), mapa B (`B_*`).
- `runda2/ukrycie_bez_*` / `ukrycie_z_*`: bohater za tylną krawędzią, z boku (góra i dół boku), na szczycie, przed licem, na schodach
  (`tests/wzgorza_ukrycie.js`); zestawienia w `runda2/pary/ukrycie_*.png`.

## Runda 3 (2026-11-01): `runda3/`

- `runda3/pary/para_*.png`: lewa połowa runda 2 (zainstalowana), prawa nowa; bohater w pozycjach wzdłuż krawędzi (`tests/wzgorza_galeria.js`).
- `runda3/laczenia/pary/para_*.png`: zbliżenia (4x) łączeń łuku z prostym obrzeżem przed/po.
- `runda3/obiekty/`: przegląd innych obiektów, za którymi postać może stanąć (tylko zrzuty, nic nie zmieniono): `arkusz_<mapa>.png`, `obiekty.json`.
- Narzędzia: `tools/wzgorza/audyt.js` (resztki obrzeża, łączenia), `tools/wzgorza/obwiednia.js` (przejście wzdłuż krawędzi, kadr z bohaterem i bez),
  `tools/wzgorza/pozycje.js`, `tools/wzgorza/pos.js`.

## Runda 4 (2026-11-01): `runda4/`

- Regiony gracza (warstwa 5 mapy): wzgórze z regionem 3 w pobliżu ma tryb regionów. **Korytarz** = skrzynka wszystkich kratek regionu 3 tego wzgórza: wewnątrz
  rysowanej krawędzi, na całej tylnej krawędzi, jej zaokrąglonych rogach i górnych częściach boków, pas o STAŁEJ głębokości 32 px (wejście z boku, wyjście
  z boku lub z tyłu). Poza korytarzem bok to ściana dokładnie na linii; szczyt tylko schodami (reguła „ostatnie słowo” w `freeBlocker`: nikt z dołu nie
  wchodzi głębiej niż pas poza kolumną schodów).
- Przyczyna „zmian grafiki rogów w ruchu”: kawałki zasłaniające były kopiowane z tilemapy, której początek (origin) w chwili aktualizacji spriteów jest klatkę
  za przewinięciem (Spriteset_Map.update odświeża sprite’y PRZED ustawieniem origin). Kopia robiona jest teraz z origin ustawionym na bieżące przewinięcie.
  Cienie zasłoniętej postaci są ukrywane po aktualizacji spritesetu. Zostaje 1 animowane źdźbło trawy w kopii (do ok. 14 px, test dopuszcza 70/próbkę).
- Testy: `tests/wzgorza_ruch_test.js` (przejście z lewej na prawą i z powrotem, w tym korytarzem z boku; w każdej próbce: bez postoju, warstwa w kroku z
  tilemapą, piksele zgodne ze światem; `SZER=1920 WYS=1080`), `tests/lib/wzgorza_wejscia.js` + `tools/wzgorza/wejscia.js` (brute force: z każdej kratki
  w promieniu 3, 8 kierunków po 60 klatek, ani razu na szczycie poza schodami; ze szczytu nie schodzi), `tests/wzgorza_pora_test.js` (`FRAC=0.37`, ułamkowe przewinięcie).
- `runda4/para_*.png`, `para_wejscie_*.png` (przed/po), `przejscie_korytarz.gif` + `przejscie_klatka_*.png` (1920x1080, wejście z lewego boku, po łukach, wyjście
  z prawej). `tools/wzgorza/mapa_lim.js`: mapa ASCII stanu krawędzi; `probuje.js`, `gif_korytarz.js`.
- Niezrobione: cienkie kreski łuku na dole lica w wklęsłych rogach (audyt tego typu daje zbyt wiele fałszywych trafień).

### Runda 4, zasady gracza z 2026-11-01 wieczorem (zastępują "korytarz wzdłuż boków")
- Zasłanianie TYLKO za tylnymi krawędziami (odcinki zwrócone na północ, także niższe przy stopniach i pozioma część łuków), w kratkach z regionem 3; głębokość = jedna pełna
  kratka (48 px), wszystko albo nic. Boki: nigdy nie zasłaniają i nie wpuszczają, postać staje na linii. Wejście do pasa od tyłu (z północy) albo na końcu pasa przy rogu.
- Reguła "ostatnie słowo" w `freeBlocker`: nikt z dołu na szczycie poza kolumną schodów; miejsce w pasie, w którym ciała nie da się zasłonić, nie wpuszcza (tylko wyjście).
- Testy: `tests/wzgorza_ruch_test.js` (trasy: górna krawędź w obie strony, niższa krawędź stopnia, wejście od tyłu, trzy boki), brute force `tests/lib/wzgorza_wejscia.js`
  (z dołu: nigdy na szczycie, nigdy w pasie bez możliwości zasłonięcia). Zrzuty `runda4/para_bok_*.png`, GIF-y `przejscie_lewa_prawa.gif`, `przejscie_prawa_lewa.gif`,
  `przejscie_stopien_prawa_lewa.gif` (+ klatki). Skrypty `tools/wzgorza/probuje.js`, `gif_przejscie.js`.

### Runda 4, korytarz przez łuki (2026-11-01 wieczór, ostatnia zasada gracza)
- Korytarz (pełna kratka, widać głowę) obejmuje KAŻDY zaokrąglony łuk wzgórza z regionem 3, aż do prostego pionowego boku (łuki w wierszach do jednego pod najniższą kratką regionu 3;
  łuki zwrócone w dół, czyli stopa lica, nie). Proste boki nie zasłaniają i nie wpuszczają. Interior kratki bez własnej krawędzi (wewnętrzny róg stopnia): odległość do pudełka
  najbliższej kratki terenu, pas idzie dalej (`edgeState`). Ślizg w pasie podąża za łukiem w górę i w dół. `bodyBad` liczy ciało 64 px wysokie (z włosami).
- `tests/wzgorza_ruch_test.js`: "ciąg" z lewej na prawą i z powrotem przez wszystkie łuki (klawisze jak gracz: kierunek, w pasie w prawo także "w dół"), w każdej próbce: w pasie, zasłonięta,
  bez postoju, nigdy na szczycie, piksele zgodne; 1920x1080 też. GIF-y `runda4/przejscie_lewa_prawa.gif`, `przejscie_prawa_lewa.gif`, klatki na łukach `runda4/luk_*.png`.

### Runda 4, sterowanie samym kierunkiem i stała głowa (2026-11-03)
- W pasie sam "w prawo" / "w lewo" prowadzi po łukach: ruch, który wyniósłby postać ponad linię, podąża za linią w dół; ślizg idzie wzdłuż stycznej łuku; w pasie bohater jest dociągany do pełnej głębokości (bez "w górę");
  z "w górę" wolno wyjść do tyłu. Głębokość na łuku mierzona pionowo (lim = 48 * |ny|, min 0,82), limit trzyma środek dolnej krawędzi stóp, reszta stóp ma 14 px luzu.
- Głowa: zasłonięta postać zawsze pokazuje górne 20 px swojego obrazka (druga sprite'a ponad warstwą, z 4.2); kopie świata odnawiane co ~0,6 s gry i przy zmianie pogody (cienie drzew pełzną).
- Test pikseli w ruchu liczy różnice > 60 (kołysanie źdźbeł trawy, `Sprite_GrassDetail`, którego statyczna kopia nie nadąży, zostaje poniżej).
