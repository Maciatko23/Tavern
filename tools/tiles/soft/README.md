# Miękkie grunty w stylu Winlu — generator (`make_ground.py`)

Robi **nowy grunt** (np. błoto, ściółkę, piasek) w stylu tilesetu Winlu Fantasy, którego używają mapy
(tileset 9): miękki, prawie malowany, gładkie przejścia, dużo kolorów, brzegi łagodnie przezroczyste —
nie ostry pixel art. Wynik to gotowy blok autokafla A2 RPG Maker MZ (96x144) wklejony w wybrany slot
**kopii** arkusza Winlu A2. Oryginały Winlu, `data/*.json` i wtyczki nie są ruszane.

Metoda to wynik pilota z 2026-09-27 (trzy próby S1/S2/S3 i sędzia): treść z własnych tekstur Winlu
(0 generacji) albo z zapisanych obrazów PixelLab, potem "wykończenie Winlu" (dopasowanie kontrastu w
każdej skali + ziarno pędzla Winlu) i brzegi z **masek alfa samego Winlu**, z wyrównanymi łączeniami.

## Szybki start

```
cd tools/tiles/soft
python make_ground.py --sheet test_sheet             # arkusz testowy: błoto k39+k24, ściółka k46, piasek k23
python make_ground.py recipes/bloto.json             # jeden grunt w jego sloty (do img/tilesets/Soft_Test_A2.png)
python make_ground.py --name bloto --describe "wet mud" --kind overlay --slot k39 --out img/tilesets/Soft_Moj_A2.png
python make_ground.py --name torf --describe "dark peat bog" --slot k37 --out img/tilesets/Soft_Moj_A2.png
      # nie ma recipes/torf.json -> powstaje z najbliższego szablonu (błoto / ściółka / sucha trawa / piasek), popraw i uruchom znowu
```

Opcje: `--out` arkusz wynikowy (względem projektu; domyślnie `img/tilesets/Soft_Test_A2.png`),
`--base` arkusz startowy (`green` = Winlu A2 tilesetu 9, albo ścieżka), `--fresh` zacznij od czystego
Winlu, nawet gdy `--out` istnieje (inaczej grunty się **dokładają** do istniejącego `--out`),
`--slot kNN` (można kilka) i `--kind overlay|full`, `--no-preview`, `--quiet`.
W `img/` narzędzie zapisuje tylko własne arkusze o nazwach `Soft_*.png` (literówka w `--out` nie nadpisze
obrazu gry); zapis do folderów Winlu jest zablokowany.

Każde budowanie zapisuje `work/<nazwa>/`: `tex.png` (tekstura 48x48), `block_kNN.png`, `preview_1x.png`
i `preview_x3.png` (prawdziwe okna map rysowane tabelą autokafli MZ, bez przeglądarki: Winlu z lewej,
nowe z prawej), `tiles_x4.png`, `report.json` (kontrole, drukowane też w konsoli).

## Co robi każdy krok

1. **Źródła** (`texture.sources`) — nazwane tekstury 48x48, każda zawsze okresowa (sama się łączy ze
   wszystkich stron, bo MZ powtarza tę samą komórkę 48x48 w całym wnętrzu plamy):
   - `{"winlu": 24}` — wnętrze rodzaju 24 z Winlu A2 (lista `[16, 27]` = mieszanka), `"sheet"`: `green`,
     `red`, `base`, `winter`, `dungeon`, `interior` (inne edycje Winlu z projektu) albo ścieżka;
   - `{"pixellab": "bloto/plik.png"}` — zapisany obraz z `src/`: duży (96-256 px) jest zmniejszany
     BOX do 96 i Lanczosem do 48, więc siatka pikseli PixelLab rozpływa się w gradienty (odkrycie S1);
     jeśli się nie łączy — 4-kopiowe przenikanie z zachowaniem wariancji; `"deglint": true` usuwa jasne
     odblaski, `"despeckle": 10` jasne i ciemne plamki (tworzyłyby siatkę kropek co 48 px);
   - `"rot"`, `"shift"` — obrót o 90° / przesunięcie (mieszanie dwóch źródeł bez wspólnego wzoru);
   - przebarwienie: `"hsv": [dh, s_mul, v_mul]`, `"mean": [r,g,b]`, `"std_mul"`, `"smooth"`,
     `"detail"` (oddaje ziarno po rozmyciu), `"flatten": [sigma, keep]` (tłumi duże plamy).
2. **Baza** (`texture.base`) — `[["a", 0.6], ["b", 0.4]]`: mieszanka wokół średnich, bez szarzenia.
3. **Mieszanie maską** (`texture.blend`) — drugi materiał przez miękką organiczną maskę (szum z
   zawinięciem domeny): np. poduszki mchu na ściółce, `lit`/`shade` = światło z lewej-góry na brzegach.
4. **Pociągnięcia** (`texture.strokes`) — igły, gałązki, kamyki, drobinki: rysowane 4x większe, na torusie,
   zmniejszane (wygładzone brzegi), z miękkim cieniem. `"stage": "after"` = po wykończeniu (zostają
   wyraźniejsze), `"spill": 1` = igły mogą wychodzić trochę za brzeg plamy (na trawę).
5. **Wykończenie Winlu** (`texture.finish`) — jasność rozbita na 6 pasm skali (<0,7 / 0,7-1,5 / 1,5-3 /
   3-6 / 6-12 / >12 px); każde pasmo dostaje kontrast wzorca Winlu (`ref`: `k26` wilgotna ziemia, `k24`
   ziemia, `k16` trawa, `k46/k16` ciemna trawa na trawie, `red:k16` ...) razy `boost[i]`; do najdrobniejszych
   pasm domieszane jest prawdziwe ziarno pędzla Winlu (`grain`, `grain_w`). Pasma się trochę nakładają,
   więc dopasowanie jest powtarzane aż trafi. Kolor: lekko rozmyty (`chroma_blur`), rozrzut =
   `chroma_spread` x wzorca, `chroma_flatten: [sigma, keep]` tłumi duże barwne plamy, średnia = `mean`.
   To ten krok sprawia, że grunt stoi obok trawy Winlu i nie wygląda obco.
6. **Połysk** (`texture.gloss`, dla mokrego) — z własnej rzeźby tekstury: stoki zwrócone w lewo-górę
   dostają chłodny odblask (`amount`, `relief_sigma`, `lo`, `colour`), dolne-prawe ciemnieją (`shade`);
   opcjonalnie `sheen` (szerokie odbicia), `hollows` (mokre zagłębienia), `sparkle_n` (iskierki — ostrożnie,
   powtarzają się co 48 px).
7. **Brzegi** (`edge`) — kształt z maski alfa Winlu (`mask`: 39 ścieżka, 46 ciemna trawa - szeroki,
   puszysty brzeg, 23, 31 ...), kolor z naszej tekstury:
   - `alpha_blur` (px) wygładza twarde ząbki maski Winlu, `straighten` (0-1) prostuje "koraliki" na
     prostych brzegach (każda komórka Winlu ma własny garb), `fade_widen` poszerza zanik, `alpha_gamma`;
   - `border_fade` (px): boki komórki zwrócone do innego rodzaju schodzą do 0 (Winlu zostawia tam do 60 %,
     co przy ciemniejszym gruncie daje prostą krawędź);
   - **wyrównanie łączeń**: każdy bok ćwiartki należy do linii siatki (wierzchołek - środek boku - środek
     komórki); wszystkie kawałki, które MZ może postawić obok siebie na tej linii, dostają jeden wspólny
     profil (średnia ważona: proste brzegi ważą najwięcej, narożniki się dopasowują; `depth` = jak daleko
     w głąb sięga gładka "membrana" korekty). Dzięki temu KAŻDY układ komórek łączy się bez szwu (w samym
     Winlu są małe skoki), a środek zostaje malowany jak u Winlu;
   - `wobble` — nasz okresowy szum przesuwa zanik (tylko w strefie zaniku, więc łączenia zostają dokładne);
   - obwódka: `rim_k` (siła), `rim_rgb` (kolor, np. mokra ciemna ziemia), `rim_lo`/`rim_hi` (gdzie w zaniku);
   - `edge_source` + `edge_mix` + `edge_mean`: inna tekstura wmieszana w zanik (mech przed ściółką);
   - `body_alpha` (k46 Winlu ma wnętrze tylko 92,5 % krycia), `thumbnail`: `mask` (ikona edytora jak u Winlu).
8. **Dekoracje** (`decor`) — `glints` (mokre kałużki), `pebbles`, `twigs`: tylko wewnątrz ćwiartek
   brzegów i narożników (`n_edge`), nigdy w środku plamy (`n_body: 0`) — tam wszystko powtarza się co 48 px.
9. **Sloty** (`slots`) — `{"k39": "overlay", "k24": "full"}`: nakładka (kolumny 4-7 A2, warstwa 1, na
   gruncie) albo pełny grunt (tekstura w każdym slocie, twarde brzegi jak Winlu k24).
10. **Kontrole** — patrz niżej; `soil` w przepisie = czego się spodziewamy od Farming.js (`earth`/`grass`).

## Kontrole (drukowane po każdym budowaniu)

| kontrola | próg | po co |
|---|---|---|
| pasma jasności | drobne (<3 px) ±30 % wzorca Winlu, grubsze najwyżej 1,3 x | ziarno jak u Winlu; więcej w dużych skalach = motyw widoczny co 48 px |
| powtórzenie jasności | odch. std po rozmyciu (sigma 2) <= 1,8 | Winlu ma 1,15-1,85 |
| powtórzenie koloru | to samo dla barwy <= 2,7 | Winlu: ziemia 0,6-0,7, trawa 1,8-2,2, wysoka trawa k21 2,67 |
| plamki | <= 0,5 % pikseli odstających od otoczenia | kropki układają się w siatkę |
| łączenia | na liniach ćwiartek skok jasności nie większy niż obok (<= 1,1 albo jak Winlu) + skoki alfa | brak szwów przy każdym układzie (test 256 sąsiedztw + losowy obszar tabelą MZ) |
| arkusz | zmienione tylko docelowe rodzaje | nic innego w A2 się nie zmienia |
| gleba | werdykt `soilKindOf()` z Farming.js | czy na gruncie da się kopać, czy pojawia się kursor pola i losowe patyki/kamienie/kwiaty |

Okno "ziemi" w Farming.js: odcień 38-98°, nasycenie 0,22-0,42, jasność 0,42-0,62 (trawa: 110-150°,
>= 0,30, >= 0,44), liczone ze średniej kryjących pikseli wycinka bloku. Dlatego błoto ma średnią
(110, 98, 75) a nie ciemniejszą: jest "ziemią", więc drogi zamienione w błoto dalej działają jak ziemia.
Ciemniejsze błoto wymagałoby nowej reguły w Farming.js (decyzja autora, zmiana wtyczki).

## Test w grze (bez ruszania plików danych)

```
CDP_PORT=9352 node tools/tiles/soft/shots.js Soft_Test_A2 <folder> 3:14:21:m003 4:13:8:m004 21:14:12:m021
CDP_PORT=9352 node tools/tiles/soft/shots.js Soft_Test_A2 <folder> 4:13:8:m004 --remap 39:23
```

Jeden start gry; dla każdego miejsca (mapa:x:y:nazwa) zdjęcie z Winlu, podmiana arkusza w pamięci
(`$dataTilesets[9].tilesetNames[1]`), drugie zdjęcie tej samej, zamrożonej klatki — pary różnią się tylko
gruntem. `--remap 39:23` rysuje komórki rodzaju 39 rodzajem 23 (grunt, którego żadna mapa jeszcze nie
ma). Serwer gry musi działać; jeden port CDP na agenta; nieudany start (czasem nie wczyta się biblioteka)
jest powtarzany. Obrazy do docs: `python docs_images.py blocks|pairs|zoom ...` (opis w pliku).

## Nowy grunt krok po kroku

1. Skopiuj najbliższy przepis (`bloto`, `sciolka`, `sucha_trawa`, `piasek`) albo daj `--name X --describe "..."`
   (szablon wybierany po słowach opisu: błoto/mokre, las/mech/igliwie, trawa/siano/łąka, piasek/ścieżka;
   nic nie pasuje = piasek). Przykład całej drogi: `sucha_trawa.json` (2026-09-27, zrobiona tylko z tego
   README, 0 generacji: trawa Winlu przebarwiona na słomkową, trochę zielonych kępek przez maskę szumu,
   delikatne źdźbła, brzeg `mask 46`).
2. Najpierw spróbuj **bez generacji**: źródło z Winlu (`winlu` + `hsv` + `mean`), maska, pociągnięcia.
   Wszystkie edycje Winlu z projektu (zielona, czerwona/jesienna, zimowa, lochy, wnętrza) są w `SHEETS`.
3. Jeśli Winlu nie ma podobnej faktury — PixelLab (niżej), wynik do `src/X/`, wpis w `sources`.
4. `finish.ref` = najbliższy grunt Winlu, `finish.mean` = kolor (sprawdź werdykt gleby), `boost`
   < 1 = gładszy (błoto), > 1 = bogatszy (ściółka, najwyżej ok. 1,3 w pasmach 1,5-6 px).
5. `edge`: `mask 39` ścieżka/plama o miękkim brzegu, `46` szeroki puszysty zanik; `straighten 0,25`,
   `wobble 0,3-0,45`, `alpha_blur 0,8-1`, `rim_k 0,05-0,15`.
6. Uruchom, obejrzyj `work/X/preview_*.png`, popraw, na koniec `shots.js`. Przebudowa trwa sekundy i
   jest powtarzalna bajt w bajt.

**Zasada powtarzania**: wnętrze plamy to zawsze ta sama komórka 48x48. Każdy wyraźny kształt (> 3 px,
> 15 jasności) staje się siatką. Wnętrze ma być spokojne; kałuże, kamienie, szyszki — jako zdarzenia /
nakładki gry (jest Puddles.js) albo dekoracje w slotach brzegów.

## PixelLab

```
python make_ground.py --pixellab --name X --describe "pale warm sandy path, fine sand grain, a few pebbles" --ref k24 --seed 17
```

Drukuje i zapisuje (`src/X/pixellab_request_s17.json`) gotowe wywołanie `create_image_pro_flash`:
192x192, `no_background: false`, prompt:
"Seamless top-down ground texture that fills the whole square canvas edge to edge: <opis>. Soft
painterly RPG tileset style with smooth gradients and many close colours, no outlines, no border, no
vignette, no objects standing up, low contrast, even lighting, seen straight from above.",
`style_image` = wycinek 24x24 gruntu Winlu jako **16-kolorowy PNG z paletą (ok. 600 znaków base64)**,
`usage_description` "copy its soft painted technique: low contrast, smooth blended colour transitions,
no outlines", `style_options.color_palette: false`. Większe próbki (2,7 KB i 7 KB base64) były ucinane
w transmisji ("Could not decode image") — dlatego tak mała. Koszt: 192x192 = 6 generacji, 96x96 ok. 2-3,
`create_tiles_pro` ok. 20. Pobranie: `python make_ground.py --fetch <download_url> src/X/pl_<co>_s17_192.png`.

Wniosek z pilota i z tego przebiegu: PixelLab daje głównie "treść" (smugi błota, zmarszczki piasku),
a wygląd Winlu robi wykończenie i brzegi. W błocie źródło PixelLab (`pl_mud_fine_s31_192`) wygrało z
czystym Winlu (smugi wyglądają jak mokre, rozmazane błoto); w piasku wersja z PixelLab
(`piasek_pixellab.json`) wygląda prawie jak ta bez generacji (`piasek.json`), więc domyślny piasek
jest za 0 generacji. Tak samo sucha trawa (`sucha_trawa_pixellab.json`, 6 gen.): surowy obraz miał
wyraźne zielone kępki, które po zmniejszeniu do 48 px dawały siatkę kropek co 48 px (kontrole: kolor
3-4,8, plamki 1-2,6 %) — pomogło dopiero `flatten` + słabsze nasycenie + `despeckle 20` (ostrzejszy
`despeckle 14` zrobił z kępek jedną gładką plamę) i wtedy wynik jest prawie taki sam jak bez generacji.
Historia wywołań: `src/SOURCES.md`.

## Pliki

- `make_ground.py` — komenda; `shots.js` — pary przed/po w grze; `docs_images.py` — arkusze do docs.
- `groundlib/` — `mz.py` (geometria A2, tabela autokafli MZ, rysowanie map bez przeglądarki), `tex.py`
  (filtry na torusie, szum, kolory, pasma, miary), `content.py` (źródła, przebarwienie, maski,
  pociągnięcia, wykończenie Winlu, połysk), `edges.py` (maska Winlu, wyrównanie łączeń, obwódka,
  dekoracje, ikona), `checks.py` (kontrole), `preview.py` (podglądy, czcionka z polskimi znakami),
  `paths.py`.
- `recipes/` — `bloto.json`, `sciolka.json`, `piasek.json`, `piasek_pixellab.json`, `sucha_trawa.json`,
  `sucha_trawa_pixellab.json`, `test_sheet.json`.
- `src/` — zapisane obrazy PixelLab (+ `SOURCES.md`). `work/` — wyniki i podglądy (do skasowania).
- `S1/`, `S2/`, `S3/` — skrypty trzech prób pilota (historia; nowy generator ich nie potrzebuje).

## Arkusz testowy `img/tilesets/Soft_Test_A2.png`

Kopia Winlu A2 z czterema zmienionymi rodzajami (reszta bajt w bajt ta sama):

| slot | grunt | uwagi |
|---|---|---|
| k39 (nakładka) | błoto | w teście KAŻDA ścieżka k39 na mapach staje się błotem (840 komórek) |
| k24 (pełny) | błoto (grunt) | tylko Map020 (24 komórki, pod polem) |
| k46 (nakładka) | leśna ściółka | w teście każda plama ciemnej trawy (2751 komórek) staje się ściółką |
| k23 (nakładka) | piaszczysta ścieżka | wolny slot: 0 komórek na mapach (był kamienny bruk Winlu); inne wolne nakładki: k29, k30, k37, k38, k44, k45 |

Żeby go użyć naprawdę, trzeba w edytorze ustawić A2 tilesetu 9 na ten plik — **nie zrobione** (to
decyzja autora; lepiej dać błoto i ściółkę do własnych, wolnych slotów niż zamieniać drogi i ciemną trawę).
