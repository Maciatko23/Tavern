# Osada Milczących - wnętrza czterech chat (Map121-124)

Dolina Milczących (Map120, Akt II) miała cztery chaty z zamkniętymi drzwiami. Teraz drzwi frontowe prowadzą do środka.
Milczący to ludzie, którzy „wiedzieli za dużo” (dotknęli skały / prawdy) i przestali mówić - ich chaty mówią za nich.

| Mapa | Chata | Drzwi na Map120 | Wyjście (przed drzwiami) | Lądowanie w środku | Mieszkaniec |
|---|---|---|---|---|---|
| 121 | Wspólna izba | „Drzwi chaty 1” (8,16) | (8,17) w dół | (7,9) w górę | Milcząca ogrodniczka (`$Npc_Milczaca4`) |
| 122 | Chata tkaczki | „Drzwi chaty 2” (29,14) | (29,15) w dół | (6,8) w górę | Milcząca tkaczka (`$Npc_Milczaca2`) |
| 123 | Chata Najstarszego | „Drzwi chaty 3” (29,25) | (29,26) w dół | (7,9) w górę | Najstarszy z Milczących (`$Npc_Milczacy3`) |
| 124 | Chata rzeźbiarza | „Drzwi chaty 4” (8,25) | (8,26) w dół | (6,8) w górę | Milczący rzeźbiarz (`$Npc_Milczacy1`) |

Boczne drzwi chaty 3 (komórka, 26,24) zostają zamknięte (dymek „zaparte kołkiem od środka”).

## Co jest w środku

- **121 Wspólna izba** - wspólne palenisko z kotłem, długi stół z miską dla każdego (jedna „dnem do góry”), worki i szafka
  z nasionami ze znakami wyciętymi nożem zamiast napisów, pusta beczka na wodę (susza - żadnej wody), kreski kredą (porcje),
  posłanie ogrodniczki.
- **122 Chata tkaczki** - krosno z białym lnem (z niego są pasy na usta Milczących), stojak z białymi pasami (jedno miejsce
  puste), tkanina z krukiem w kręgu, kołowrotek, skrzynia płótna.
- **123 Chata Najstarszego** (chata z bali) - resztki straży zakonu: czarna chorągiew z krukiem, płaskorzeźba „STRAŻ”, miecz
  zakonu, okuta skrzynia z ciemnoniebieską szatą, regał ksiąg, pulpit z „Rejestrem straży” (notatka w dzienniku), miska
  białych kamyków, kreski kredą (lata dni).
- **124 Chata rzeźbiarza** (dawny żołnierz z kontynentu) - warsztat z niedokończonym krukiem, deski pocięte setki razy
  słowami NIE PYTAJ (notatka w dzienniku - to samo powiedzenie co Borgara), półka drewnianych kruków, tarcza z herbem
  zamalowanym na biało, miecz powieszony wysoko, ciosany kamień z krukiem z kamieniołomu, palenisko w kręgu kamieni.

Każda rzecz do obejrzenia: przycisk akcji -> dymki nad bohaterem (`Tawerna.popup`), nigdy okno wiadomości. Dwie notatki
w dzienniku (`Journal.addNote`, raz - samoprzełącznik B): „Rejestr straży”, „Deski rzeźbiarza”.

Światła: tylko ogień - paleniska (`<Light>` + `<LightFlicker>`), świece i kandelabr nocą, okna to smugi słońca tylko w dzień.
Notatka map: `<Dark:on><DayNight:off><Zoom:1.5><DarkDay:85><DarkNight:185><HomeAmbience>` (iskry, widok nieba w oknach,
trzask ognia).

## Godziny Milczących

`tools/osada/osada_data.py` RESIDENTS - poza tymi godzinami mieszkaniec jest w swojej chacie:

| Mieszkaniec | Na zewnątrz (Map120) |
|---|---|
| Milczący rzeźbiarz („Milczący przy ścianie”) | 6-12 |
| Milcząca tkaczka („Milcząca przy ścianie”) | 14-19 |
| Najstarszy z Milczących (przy kręgu) | 6-21 |
| Milcząca ogrodniczka („Milcząca przy grządce”) | 6-10 i 16-20 |

Działa to zdarzeniem równoległym „Milczący: pora dnia” na Map120 i w każdej chacie: raz na sekundę ustawia samoprzełącznik A
zdarzenia mieszkańca = „jest teraz w domu” (na Map120 strona 2 = nikogo, w chacie strona 2 = postać). Nikt poza tym tego nie
czyta. Znaczniki zadań w chatach (na miejscu mieszkańca): „Miejsce: osada_ogrodniczka_wnetrze” (121),
„osada_tkaczka_wnetrze” (122), „osada_starszy_wnetrze” (123), „osada_rzezbiarz_wnetrze” (124).

## Narzędzia i kolejność

- `python tools/osada/props.py` - `img/characters/!Osada_Props.png` (krosno, stojak z pasami, warsztat rzeźbiarza, tkanina
  z krukiem, deski ze znakami, półka z krukami, miska kamyków; PixelLab, ok. 40 generacji, `tools/osada/props/SOURCES.txt`).
- `python tools/osada/build.py` - buduje Map120 (z `tools/mountains/osada.py`) i Map121-124 do `tools/osada/staging/`,
  sprawdza (rozstawienie i przejścia jak w innych wnętrzach, zasięg doliny). Nic nie pisze w `data/`.
  - `--preview` - obrazki do `docs/osada/` (`wnetrze_*.png`, `*_przejscia.png`, `osada_chaty.png`)
  - `--overlay` - `tools/osada/staging/overlay/data/` do testów przed instalacją (`GAME_OVERLAY=tools/osada/staging/overlay`)
  - `--install` - zapisuje `data/Map120-124.json` i wpisy 121-124 w `MapInfos.json` (dzieci 120); odmawia, gdy działa
    edytor RPG Maker MZ; kopie zapasowe w `backup_art_2026-10-07/osada/`; mapę zmienioną w edytorze od ostatniej instalacji
    pomija (`--force` nadpisuje). Zapisuje też skrót Map120 w `tools/mountains/installed.json`.
- `tools/mountains/build.py` buduje Map120 tym samym `osada.py` - przebudowa gór nie zamyka drzwi. Gdy chat jeszcze nie ma
  w `data/`, po niej uruchom `tools/osada/build.py --install`.
- Test: `CDP_PORT=9461 node tests/run.js osada_huts_test` (przed instalacją z `GAME_OVERLAY=tools/osada/staging/overlay`).
  Zrzuty z gry: `docs/osada/gra_<id>.png` (13:00), `noc_<id>.png` (23:00), `gra_osada_chata3.png`.
