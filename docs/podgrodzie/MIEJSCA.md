# Podgrodzie - miejsca, drzwi, brama

Podgrodzie (mapa 111, 46x36, tileset 11 „Miasteczko”) to biedna dzielnica za zachodnim murem miasta. Wejście: brama zachodnia na mapie 8 „Okolice Tawerny” przy kuźni (pola 0-1, rzędy 50-51; wyjścia na x 0) <-> wschodnia krawędź Podgrodzia (pola 44-45, rzędy 17-18; wyjścia na x 45). Wychodząc z miasta staje się na (44, 17/18) twarzą w lewo, wracając - na mapie 8 na (1, 50/51) twarzą w prawo.

Woda: Podgrodzie nie ma własnej wody - studnia na placu jest wyschnięta, wodę nosi się z miasta (w mieście i w tawernie woda jest).

Miejsca to niewidoczne zdarzenia o nazwie `Miejsce: <klucz>` (pod postacią, przenikalne, bez komend; kierunek obrazka strony = kierunek, w który patrzy mieszkaniec). TownLife.js czyta je sam (`spotsFrom`), więc przesunięcie zdarzenia w edytorze przesuwa miejsce. Uwaga: TownLife.spotsFrom (v1.1.0) bierze kierunek z obrazka tylko wtedy, gdy strona ma grafikę - dla miejsc na dworze (bez grafiki) kierunek bierze z SPOTS_BY_MAP[111] (domyślnie w dół); kolumna „patrzy” niżej to kierunek zamierzony (zapisany w obrazku strony). We wnętrzach (eventSpot) kierunek z obrazka działa zawsze.

## Miejsca na mapie 111 (Podgrodzie)

| klucz | x | y | patrzy | co to za miejsce |
|---|---|---|---|---|
| `brama_zach` | 41 | 18 | w prawo | tuż za bramą zachodnią, po stronie Podgrodzia |
| `zebrak` | 43 | 16 | w dół | gdzie siedzi żebrak za dnia - pod basztą przy bramie |
| `zebrak_noc` | 43 | 14 | w dół | gdzie żebrak śpi - na posłaniu pod daszkiem przy murze (na północ od bramy) |
| `namioty` | 38 | 9 | w prawo | przy ognisku uchodźców (kąt pod murem: namioty, daszki, posłania) |
| `uchodzcy_drzwi` | 32 | 9 | w górę | przed drzwiami Domu uchodźców |
| `kram` | 26 | 15 | w dół | przed straganem Józka (płócienny daszek, stół, starzyzna) |
| `szmaciarz_drzwi` | 21 | 14 | w górę | przed drzwiami Kramu starzyzny |
| `plac` | 26 | 18 | w lewo | środek placu (błotnisty plac przy suchej studni) |
| `studnia_sucha` | 23 | 18 | w górę | przy suchej studni na placu |
| `zabawa` | 20 | 18 | w dół | gdzie bawią się dzieci (zachodnia część placu) |
| `drwal_drzwi` | 7 | 9 | w górę | przed drzwiami Chaty drwala |
| `drewutnia` | 10 | 11 | w prawo | przy pieńku z siekierą (podwórko drwala, polana i drewno) |
| `skraj_lasu` | 0 | 19 | w lewo | koniec ścieżki na zachodniej krawędzi mapy - tu kłusownik znika w lesie |
| `klusownik_drzwi` | 4 | 28 | w górę | przed drzwiami Chaty kłusownika |
| `znachorka_drzwi` | 15 | 27 | w górę | przed drzwiami Izby znachorki |
| `ziola` | 20 | 27 | w górę | przy furtce ogródka ziół znachorki (suchy zagonek, rama do suszenia) |
| `kapliczka` | 26 | 24 | w górę | przed przydrożnym krzyżem (pod uschniętym drzewem) |
| `praczka_drzwi` | 33 | 27 | w górę | przed drzwiami Chaty praczki |
| `pranie` | 32 | 30 | w górę | pod sznurami z praniem przed chatą praczki |

## Domy z wnętrzami (drzwi na mapie 111)

| klucz | zdarzenie drzwi | id | drzwi (x,y) | przed drzwiami | wnętrze | lądowanie we wnętrzu | otwarte |
|---|---|---|---|---|---|---|---|
| `drwal` | Drzwi: Chata drwala | 3 | 7,8 | 7,9 | 113 „Chata drwala” | 6,8 | 6:00-21:00 (noc: „Zamknięte.”) |
| `szmaciarz` | Drzwi: Kram starzyzny | 6 | 21,13 | 21,14 | 116 „Kram starzyzny” | 7,8 | 6:00-21:00 (noc: „Zamknięte.”) |
| `uchodzcy` | Drzwi: Dom uchodźców | 8 | 32,8 | 32,9 | 117 „Dom uchodźców” | 8,9 | zawsze |
| `klusownik` | Drzwi: Chata kłusownika | 11 | 4,27 | 4,28 | 114 „Chata kłusownika” | 6,8 | 6:00-21:00 (noc: „Zamknięte.”) |
| `znachorka` | Drzwi: Izba znachorki | 14 | 15,26 | 15,27 | 115 „Izba znachorki” | 6,8 | 6:00-21:00 (noc: „Zamknięte.”) |
| `praczka` | Drzwi: Chata praczki | 16 | 33,26 | 33,27 | 112 „Chata praczki” | 6,8 | 6:00-21:00 (noc: „Zamknięte.”) |

Godziny jak przy domach miasta (tools/interiors/install.py: 6-21). Dom uchodźców jest otwarty o każdej porze - ludzie z promu nie mają dokąd pójść, drzwi tylko się przymyka.

## Miejsca we wnętrzach (gdzie mieszkaniec stoi w domu)

| mapa | wnętrze | klucz | x | y | patrzy |
|---|---|---|---|---|---|
| 112 | Chata praczki | `praczka_wnetrze` | 8 | 6 | w lewo |
| 112 | Chata praczki | `franek_wnetrze` | 10 | 5 | w dół |
| 113 | Chata drwala | `drwal_wnetrze` | 4 | 6 | w prawo |
| 114 | Chata kłusownika | `klusownik_wnetrze` | 2 | 5 | w lewo |
| 115 | Izba znachorki | `znachorka_wnetrze` | 7 | 6 | w górę |
| 116 | Kram starzyzny | `szmaciarz_wnetrze` | 5 | 4 | w dół |
| 117 | Dom uchodźców | `uchodzca_wnetrze` | 7 | 7 | w dół |

## Domy bez wnętrz

- Chata pod strzechą - drzwi 15,9 (zamknięte: dymek nad bohaterem)
- Chałupa z desek - drzwi 13,17 (zamknięte: dymek nad bohaterem)
- Szopa - drzwi 9,27 (zamknięte: dymek nad bohaterem)
- Komórka - drzwi 39,25 (zamknięte: dymek nad bohaterem)

## Światła nocą (tylko płomień)

- Latarnia przy bramie - 42,19 `<Light:150,90,62,24><LightWhen:night>`
- Pochodnia na baszcie - 44,15 `<Light:140,110,60,20><LightWhen:night><LightFlicker:0.15>`
- Ognisko uchodźców - 39,9 `<Light:200,120,60,16><LightFlicker:0.15>`

## Jak przebudować

```
python tools/town/west_gate.py            (raz: brama zachodnia na mapie 8; odmawia, gdy już otwarta)
python tools/podgrodzie/build_podgrodzie.py   -> staging/Map111.json
python tools/podgrodzie/check_podgrodzie.py   (przejścia, woda, drzwi, miejsca, kieszenie)
python tools/podgrodzie/build_wnetrza.py      -> staging/Map112..117.json
python tools/podgrodzie/check_wnetrza.py --png
python tools/podgrodzie/install.py            (edytor RPG Maker MZ ZAMKNIĘTY; kopie w backup_art_2026-10-05/podgrodzie/)
python tools/podgrodzie/render_podgrodzie.py --brama ; python tools/podgrodzie/make_docs.py
CDP_PORT=9461 node tests/podgrodzie_test.js
```
