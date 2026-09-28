# Źródła z PixelLab (zapisane, żeby przebudowa nie potrzebowała nowych generacji)

Wszystkie pliki tutaj to surowe wyniki PixelLab. Przepisy (`../recipes/*.json`) wskazują je polem
`"pixellab": "<folder>/<plik>"`; `make_ground.py` sam je zmniejsza, wygładza i dopasowuje do Winlu.

| plik | skąd | wywołanie | koszt | gdzie użyty |
|---|---|---|---|---|
| `bloto/pl_mud_fine_s31_192.png` | pilot S1, 2026-09-27 | `create_image_pro_flash` 192x192, seed 31, błoto drobne i równe | ok. 6 gen. | **bloto.json** (60 % tekstury) |
| `bloto/pl_mud_glossy_s11_192.png` | pilot S1 | to samo, seed 11, błoto z połyskiem i kałużkami | ok. 6 gen. | nieużyty (haczykowate odblaski powtarzały się co 48 px) |
| `bloto/pl_mud_dark_96.png` | pilot S3 | `create_image_pro_flash` 96x96, styl = zmniejszona próbka Winlu, paleta wył. | ok. 2-3 gen. | nieużyty (większe grudy) |
| `sciolka/pl_forest_moss_needles_s21_192.png` | pilot S1 | 192x192, seed 21, mech z rdzawym igliwiem | ok. 6 gen. | nieużyty (ukośne smugi) |
| `sciolka/pl_forest_fine_s41_192.png` | pilot S1 | 192x192, seed 41, drobna zieleń z gałązkami | ok. 6 gen. | nieużyty |
| `sciolka/pl_forest_needles_96.png` | pilot S3 | 96x96 | ok. 2-3 gen. | nieużyty |
| `tiles_pro_s3/tile_0..15.png` | pilot S3 | `create_tiles_pro` w trybie stylu (kafle Winlu 48 px: ziemia, ciemna trawa), seed 31, segmentacja; warstwy 1-2 błoto, 4-7 kałuże, 8-11 ściółka, 12-15 gałązki | ok. 20 gen. | nieużyte (sprite'y gałązek i kałuż) |
| `piasek/pl_sand_ripples_s17_192.png` | ten przebieg | dokładne wywołanie w `piasek/pixellab_request_s17.json`, styl `piasek/style_ref_k24.png` | 6 gen. | **piasek_pixellab.json** (przykład drogi przez PixelLab) |
| `sucha_trawa/pl_dry_grass_s23_192.png` | weryfikacja, 2026-09-27 | dokładne wywołanie w `sucha_trawa/pixellab_request_s23.json` (z `--pixellab --ref k16 --seed 23`), styl `sucha_trawa/style_ref_k16.png` | 6 gen. | **sucha_trawa_pixellab.json** (65 %; wyraźne zielone kępki trzeba było stłumić, wynik prawie jak bez generacji) |

Prompt pilota S1 (192x192): "Seamless top-down ground texture that fills the whole square canvas edge to
edge: <materiał> ... soft painterly style with smooth gradients ... no outlines, no border, no vignette,
low contrast, even lighting"; `style_image` = wycinek gruntu Winlu (k26 dla błota, k16 dla ściółki),
`usage_description` "copy its soft painted technique: low contrast, smooth blended colour transitions,
no outlines", `style_options.color_palette = false`, `no_background = false`.

Nowy prompt i próbkę stylu robi `python make_ground.py --pixellab --name X --describe "..."` (zapisuje
je tutaj, w `X/`). Po generacji: `python make_ground.py --fetch <download_url> src/X/pl_<co>_s<seed>_<rozmiar>.png`.
