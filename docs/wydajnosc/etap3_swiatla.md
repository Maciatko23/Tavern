# Wydajność, etap 3: światła na karcie graficznej

Stan: 2026-10-30. Klucz: `Wydajnosc.opts.lightGpu` (domyślnie `true`; `false` = płótna 2D jak dotąd).

## Co zmieniono

- **RoomLighting.js** - `T.api("LightGpu")` (`window`-owy helper w tym pliku): tekstury gradientów 256 px robione raz, pule sprite'ów,
  `Target` (RenderTexture + korzeń), dwa tryby mieszania dodane do renderera PIXI (`ATOP` = „source-atop”, `DST_IN` = „destination-in”;
  PIXI 5.3.12 ich nie ma), `ERASE` jest wbudowany.
  - Ciemność wnętrza: wypełnienie + dziury jako sprite'y gradientu z `ERASE` (dawne „destination-out”) w RenderTexture połowy
    rozdzielczości; stożki (smugi okien) jako tekstury robione raz; poświaty jako sprite'y `ADD` w drugiej RenderTexture.
    Błysk płomienia ponad 1,0 (siła > 1) ma własne tekstury (24 poziomy co 0,02) - tak jak płótno obcinało każdy punkt gradientu.
  - Światło z ludźmi w zasięgu: maska cieni (`Sun.lightShadowMask`, nowa w Sky.js, jedna na światło dla dziury I poświaty - dawniej
    cień liczony dwa razy) wymazana z gradientu na warstwie roboczej, potem warstwa wymazana z ciemności / dodana do poświat. Poświata
    spoza pudełka maski (cudze światło) idzie dawną drogą po płótnie.
  - Klucz zmian bez sklejania napisów: liczby w jednej tablicy (porównanie element po elemencie; napisy tylko dla kluczy sylwetek
    przez numer). `_darkKey` jest teraz numerem malowania (`""` = wymuś).
- **Farming_Render.js** - warstwa nocy (`Sprite_NightLight.drawGpu`): ciemność, dziury (`ERASE`), ciepły pierścień (`ATOP`), warstwa
  mnożąca ciepła, poświata ognia + ciepła krawędź (`ADD`). Maska wody (`DST_IN`) to mała tekstura kafelków przeskalowana sprite'em
  (nie malowana od nowa przy ruchu kamery). Tablice liczb zamiast obiektów na światło co klatkę.
- **Sky.js** - `Sun.lightShadowMask(W, H, blockers, k, ox, oy, stands)` (to, co robiło `cutLightShadows` przed wycięciem).
  `cutLightShadows` działa jak dawniej (używa jej droga po płótnie).
- Co zostaje po stronie procesora: **same cienie ludzi w świetle** (Sky.js: pasy sylwetek na płótnie maski, `keepOffStanding`) -
  tylko jedna maska na światło, wysyłana jako tekstura.
- Pochodnie (Torch.js), `<LightFollow>`, `<LightWhen>`, HomeAmbience, poziomy jakości (`nightScale`, `fireShadows`) - bez zmian
  (korzystają z tych samych danych: `_roomHoles`, `lights()`, `groundLights`).

## Testy

`tests/lib/kit.js`: testy domyślnie ustawiają `lightGpu = false`, bo czytają piksele z płócien (`bitmap.context.getImageData`) -
płótna są dla nich wzorcem. `tests/wydajnosc_test.js` startuje z `lightGpu: true`, mierzy na karcie i porównuje zamrożoną klatkę
(`SAME(["lightGpu"])`) dla Przystani nocą i sali Tawerny o 20:00 z kluczem wyłączonym i włączonym. Dopuszczalne: żaden bajt o więcej
niż 24/255 i mniej niż 0,05% bajtów o więcej niż 8. Zmierzone (2026-10-30): Tawerna 20:00 - maks. 5/255, 0 bajtów > 8; Przystań
22:00 - maks. 11/255, 0,01% bajtów > 8 (jasne punkty przy latarniach: gradienty jako tekstury 256 px skalowane liniowo).

Zrzuty „przed | po | różnica x16”: `docs/wydajnosc/swiatla/{tawerna,przystan}_przed_po_roznica.png`; narzędzie:
`node tools/wydajnosc/swiatla.js tawerna przystan jar --zrzuty docs/wydajnosc/swiatla` (obraz) i bez `--bez-czasu` (czas na przemian
wyłączony/włączony w jednej sesji, CPU 4x wolniejsze, mediana).

## Pomiar (CPU 4x wolniejsze, naprzemiennie wyłączony / włączony, mediana z 5 rund po 150 klatek, komputer obciążony innymi sesjami)

| miejsce | płótna (wyłączony) | karta (włączony) |
|---|---:|---:|
| sala Tawerny 20:00 (z podróżnymi) | 14,4 ms | 10,2 ms |
| Przystań 22:00 | 17,1 ms | 11,2 ms |
| burza (Kruczy Jar, noc burzowa; 3 rundy po 120 klatek) | 29,9 ms | 27,2 ms |

Zrzut burzy nie nadaje się do porównania obrazu (deszcz i liście same się ruszają: dwa rysunki tej samej wersji różnią się tak samo).
Testy czytające piksele płócien bez kit.js (`storm_test`, `tree_strike_test`) same wyłączają `lightGpu`.
Poza zakresem tej zmiany zostały: sam rysunek cieni ludzi w świetle (płótno maski w Sky.js) i pochodnie w ręku (Torch.js, bez zmian).
