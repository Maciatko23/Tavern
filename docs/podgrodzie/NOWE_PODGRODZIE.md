# Nowe Podgrodzie (Map111) - przebudowa 2026-10-22

Wspólny dokument dla agentów tej przebudowy. Plan zaakceptowany przez użytkownika („pasuje”):
`docs/podgrodzie/plan_nowe_podgrodzie.png` (rysuje go `tools/podgrodzie2/plan.py`, lista `BLOKI` = współrzędne kratek,
`PAL` = palisada). Wzór całej roboty: przebudowa miasta Map008 tego samego dnia (`docs/miasteczko/NOWE_MIASTO.md`,
`tools/miasto2/` - build.py, budynki.json, mapowanie.json, przepnij.py, wnetrza/build.py).

## Decyzje użytkownika

- „Podgrodzie też przebuduj podobnie jak mapę z tawerną”: mapa 92x112 (po powiększeniu), osada rozproszona na nowym terenie.
- Niski płot z wikliny i drewniana palisada wokół osady (x 3-85, y 3-64), bramy w palisadzie: zachodnia na drodze (rzędy 18-20)
  i południowa w stronę lasu (kolumny 40-42).
- Mur miasta z drewnianą bramą na WSCHODNIM brzegu (x 88-91) - tam naprawdę jest miasto (po powiększeniu mur stał w połowie
  mapy, x 44-45). Przejście do miasta zostaje: zdarzenia 65/66 na (91,17)/(91,18) -> Map008 (1,50)/(1,51). Mur ma wyglądać jak
  zachodni mur nowego Map008 (kopiuj jego kolumny, brama rzędów 50-51 Map008 = rzędy 17-18 tutaj); drewniana brama: zdarzenia
  89/90/91 (obrazki `!$West_Gate`, tools/town/west_gate_doors.py - NIE uruchamiać, tylko przenieść zdarzenia).
- Droga przez całą osadę: brama miasta -> brama zachodnia w palisadzie -> przejście do Przystani (zdarzenie 92 na (0,19)).
- Placyk na środku (x 36-54, y 26-40): sucha studnia, kapliczka, kram starzyzny, ławki z kłód, miejsce zabaw dzieci.
- Zostają (przeniesione, z wnętrzami): Chata drwala (ev3, Map113), Kram starzyzny (ev6, Map116), Dom uchodźców (ev8, Map117)
  z namiotami, Chata kłusownika (ev11, Map114), Izba znachorki (ev14, Map115), Chata praczki (ev16, Map112).
- Chata pod lasem gracza (ev94, dom z Homes.js) z kupioną działką (region 8, `<BuildRegion:8>`) - za palisadą, przy lesie.
- Glinianka i wysypisko (paczka A, Okolice_Data) - za palisadą; ogródki 1-3 (praczka, Franek, znachorka) - w osadzie.
- Nowe budynki, wszystkie z wnętrzami: szynk, przytułek, garncarnia, domy biedoty (lepianki 1-2, chaty 3-5). Dotąd zamknięte
  (ev4 Chata pod strzechą, ev9 Chałupa z desek, ev12 Szopa, ev17 Komórka) też dostają wnętrza.
- 4 nowych mieszkańców w stylu bohatera (PixelLab): garncarz, szynkarz, opiekunka przytułku, dziecko biedoty.

## Budynki z nowymi wnętrzami

| klucz | budynek | działka na planie | wnętrze | kto | wygląd (biednie, drewno/strzecha/glina) |
|---|---|---|---|---|---|
| szynk | Szynk | 76,4-85,14 | Map201 | szynkarz (nowy) | drewniany, szyld z kuflem, ławy przed wejściem |
| przytulek | Przytułek | 48,5-60,14 | Map202 | opiekunka (nowa), chorzy, uchodźcy | długi dom z desek, kocioł z zupą przed wejściem |
| garncarnia | Garncarnia | 45,45-55,55 | Map203 | garncarz (nowy) | chata z piecem do wypalania, ławy z dzbanami |
| lepianka1 | Lepianka 1 | 5,40-11,46 | Map204 | dziecko biedoty (nowe) z rodziną | glina i strzecha |
| lepianka2 | Lepianka 2 | 14,40-20,46 | Map205 | - | glina i strzecha |
| chata3 | Chata 3 | 24,42-31,49 | Map206 | - | chata z bali |
| chata4 | Chata 4 | 5,49-11,55 | Map207 | - | chata z desek |
| chata5 | Chata 5 | 14,49-20,55 | Map208 | - | chata pod strzechą |
| strzecha | Chata pod strzechą (ev4) | 17,6-23,12 | Map209 | - | jak teraz |
| deski | Chałupa z desek (ev9) | 15,24-22,31 | Map210 | - | jak teraz |
| szopa | Szopa (ev12) | 69,24-74,29 | Map211 | - | narzędzia, rupiecie |
| komorka | Komórka (ev17) | 77,24-82,29 | Map212 | - | spiżarka / skład |

Mapy 199 i 200 są zarezerwowane (Okolice MAPS.spare), 178-198 to wnętrza nowego miasta - nie używać. Wygląd to propozycja:
budowniczy wpisuje końcowy wybór do `tools/podgrodzie2/budynki.json` (jak `tools/miasto2/budynki.json`).

## Nowi mieszkańcy

| klucz | kto | dom | arkusz | id | imię | we wnętrzu |
|---|---|---|---|---|---|---|
| szynkarz | szynkarz | szynk | `$Npc_Szynkarz` | 2950 | Mietek Kwaśniak | Map201 `szynkarz_wnetrze` (za szynkwasem) |
| opiekunka | opiekunka przytułku | przytulek | `$Npc_Opiekunka` | 2951 | Ciotka Stefa | Map202 `opiekunka_wnetrze` (przy chorych) |
| garncarz | garncarz | garncarnia | `$Npc_Garncarz` | 2952 | Wit Zduń | Map203 `garncarz_wnetrze` (przy kole) |
| dziecko | dziecko biedoty (~7 lat, mniejsza skala) | lepianka1 | `$Npc_Dziecko` | 2953 | Tośka | Map204 `dziecko_wnetrze` |

Numery zdarzeń: 910-949 i 2900-2949 były rozdane (2948-2949 to rezerwa testu Okolic), więc TownLife dostał TRZECI zakres
2950-2959 (TawernaCore `reserved`, `TownLifeData.EXTRA_RANGES = [[2900, 2949], [2950, 2959]]`, TownLife.js v1.7.0 - jedno
`Tawerna.inject` na każdy zakres). Dane: blok „NOWE PODGRODZIE” w js/plugins/TownLife_Data.js; dopóki Map111 nie ma
„Miejsce: <dom>_drzwi” mieszkańca, ten jest nieobecny (stara mapa). Miejsca używane w planach dnia: `szynk_drzwi`,
`przytulek_drzwi`, `garncarnia_drzwi`, `lepianka1_drzwi`, `szynk_lawy`, `przytulek_kociol`, `garncarnia_lawy`, `glinianka`,
`wybieg`, `placyk_1`, `placyk_3`, `placyk_5` oraz przeniesione `brama_zach` (brama miasta), `namioty`, `ziola`, `zebrak`, `zabawa`.
Tośka biega z Frankiem (zabawa 8-10 i 16-18.30, brama_zach 14-16); szynkarz i opiekunka chodzą do miasta przez `brama_zach`
(wtedy ich nie ma - „away”). Test: tests/podgrodzie_mieszkancy_test.js (CDP 9582).

## Miejsca („Miejsce: <klucz>” na mapie)

Wszystkie obecne „Miejsce:” Map111 (brama_zach, zebrak, zebrak_noc, namioty, plac, studnia_sucha, zabawa, drewutnia, skraj_lasu,
kram, ziola, kapliczka, pranie, <dom>_drzwi) przenoszą się w sensowne nowe miejsca. Nowe: `<klucz>_drzwi` dla każdego budynku
z tabeli, `placyk_1` ... `placyk_6`, `szynk_lawy` (ławy przed szynkiem), `przytulek_kociol`, `garncarnia_lawy` (dzbany schną),
`glinianka`, `brama_pal_zach`, `brama_pal_pd`, `wybieg`. Wewnątrz: `<klucz>_wnetrze` dla mieszkańców.

## Zasady

Jak w docs/miasteczko/NOWE_MIASTO.md: polski wszędzie; NIC do data/*.json, js/plugins.js, IconSet (instaluje koordynator przy
zamkniętym edytorze); zdarzenia mapy 1-499, numery istniejących zdarzeń zostają; kontrola map (tools/mapy/kontrola.py,
docs/MAPY_ZASADY.md, bramka()); woda rzadka (studnia SUCHA), każde światło to ogień, popupy nad bohaterem, postacie w stylu
bohatera; porty CDP: budowa 9580, wnętrza 9581, mieszkańcy 9582, przepięcia 9583 (8765 serwer gry, 8770 kopia użytkownika -
nie ruszać, nie zatrzymywać cudzych procesów); pełny przebieg testów tylko za zgodą użytkownika; nie commitujemy.
