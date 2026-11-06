# Runda 3 map próbnych A (990) i B (991)

Metoda: całe obiekty z map gracza bez generowania kształtów + miękkie granice gruntu z Ziemia.js (edges, shade, mood; ozdoby tylko na Map003).
A = mapa gracza (Map990, wersja sha256 dc61145d…, jego wzgórze 1:1) plus dodatki w wolnych miejscach; B = wzgórze gracza jako pieczątka (A5 jest ten sam w zestawie 9), całe wzgórze z Map003, całe plamy z Map013, płoty na gruncie otoczenia.
- `ziemia/pary_a.png`, `ziemia/pary_b.png`: te same miejsca BEZ Ziemi / Z Ziemią (po 3 na mapę: ścieżka, plama, wzgórze ze schodami / ścieżka przez szew, wzgórze gracza, plama).
- `przed_po_wzorzec_a.png`, `przed_po_wzorzec_b.png`: 5 miejsc gracza: stan zainstalowany (runda 1) / runda 3 / wzorzec 013-003-159.
- `gra/`: siatka 3x4 ekranów obu map z gry + przejście A->B->A; `zblizenia/`: pojedyncze zbliżenia.
