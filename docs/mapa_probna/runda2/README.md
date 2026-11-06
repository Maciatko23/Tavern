# Runda 2 map próbnych A (990) i B (991): uwagi gracza z 2026-11-01

Zasady: `docs/MAPY_ZASADY.md`, rozdz. 12. Budowa: `tools/mapa_probna/zbuduj.py` (generatory o wygładzonych obrysach + zdarzenia z pieczątek), kontrola
`tools/mapa_probna/kontrole.py` (estetyka a-j) i `tools/mapy/kontrola.py`. Instalacja nadpisuje zainstalowane 990/991: `python tools/mapa_probna/install.py --dry-run` / `--wykonaj`.

- `przed_po_a.png`, `przed_po_b.png`: zbliżenia dokładnie tych 5 miejsc ze zrzutów gracza (lewa kolumna: stan zainstalowany w rundzie 1, prawa: nowy):
  1 dół wzgórza, 2 brzeg i drzewa, 3 płot, 4 schody, 5 plamy ziemi (i ścieżka). Pojedyncze: `przed_*.png`, `po_*.png`.
- `gra/`: siatka 3x4 ekranów każdej mapy z gry (`ekran_<mapa>_<y>_<x>.png`) i przejście A->B->A (`styk_*.png`).
- `mapa_990_calosc.png`, `mapa_991_calosc.png`: przegląd całych map.
