# Nazwa mapy przy wejściu – pomysły (2026-10-23)

Gracz: „jak się wchodzi na mapę i jest wyświetlona nazwa mapy, to można tę nazwę jakoś ładnie zaprezentować, upiększyć?”

Dziś (CleanHUD.js, `updateName`): rozstrzelone wersaliki, cienkie miedziane kreski po bokach, pod spodem „M: pokaż mapę”, znika razem
ze starym oknem nazwy. Makiety na prawdziwych zrzutach z gry: `wszystkie.png` (5 wariantów × 3 miejsca), pojedyncze `<n>_<wariant>_<miejsce>.png`.
Generator: `tools/ui_nazwa_mapy/makiety.py` (czcionki z `fonts/` gry).

| # | Wariant | Wygląd | Ruch (w grze) |
|---|---|---|---|
| 1 | **Wstęga** | pergaminowa wstęga z ogonami, nazwa ciemnym atramentem, pod nią odręczny podpis (Caveat) | wstęga rozwija się od środka, napis wyłania się; na koniec zwija się |
| 2 | **Kronika** | duży złoty napis (Alegreya SC), ornament: kreska z rombem, podpis wersalikami, pod nim jedno zdanie o miejscu | litery pojawiają się po kolei, złota kreska rysuje się od rombu na boki, raz przebiega po napisie błysk |
| 3 | **Kinowy** | czarne pasy u góry i u dołu, HUD się chowa, nazwa duża w lewym dolnym rogu, nad nią rejon, pod nią zdanie | pasy wjeżdżają, nazwa wsuwa się z lewej, kreska się wydłuża; ok. 4 s, tylko przy pierwszej wizycie |
| 4 | **Szyld** | drewniana tablica na linkach z wypalonym napisem (Pirata One), pod nią podpis | tablica opada na linkach i chwilę się kołysze, potem odjeżdża w górę |
| 5 | **Pieczęć** | czerwona pieczęć lakowa ze znakiem miejsca (dom, sosna, kotwica…), obok nazwa, „ODKRYTO · +25 dośw.”, podpis | pieczęć „przybija się” (uderzenie, mały pył), nazwa wysuwa się zza niej |

Wspólne pomysły (do każdego wariantu):
- **Pierwsza wizyta** – pełna prezentacja + jedno zdanie o miejscu (napiszę dla każdej mapy) + odkrycie (+25 dośw.) w tym samym napisie
  zamiast osobnego powiadomienia. **Kolejne wizyty** – krótko i mniej: sama nazwa.
- **Wnętrza** – mała wersja (np. sama nazwa, bez ozdób), żeby nie zasłaniać pokoju.
- **Podziemia** – „Piętro 35” + nazwa pasma („Jaskinie i podziemna rzeka”), przy piętrach z bossem groźniejszy kolor.
- **Pora dnia** – nocą napis cieplejszy (blask ognia), w deszczu lekko przygaszony.
- **Dźwięk** – cichy akord / bęben przy pierwszej wizycie (bez dźwięku przy kolejnych).
- Można łączyć: np. Kinowy przy pierwszej wizycie, a Kronika (mała) przy kolejnych.

## Wybrano: 2 „Kronika” – zrobione w grze (2026-10-23)

`js/plugins/CleanHUD.js` (`Sprite_CleanChronicle`, czysty widok; klasyczny wygląd ma stare okno nazwy jak dotąd), teksty
`js/teksty/miejsca.txt` (`mapa.<id>.pod`, `mapa.<id>.opis`, `pasmo.<n>.opis`; sprawdzanie: `node tools/teksty.js sprawdz miejsca`).

| kiedy | co widać | czas |
|---|---|---|
| pierwsza wizyta | litery po kolei z uniesieniem (0,8 s), kreska od rombu (0,4 s), podpis i zdanie, raz błysk po literach | do 4,4 s, znika 0,6 s – razem 5 s |
| kolejne wizyty | nazwa, ornament, podpis, bez zdania, szybsze wejście | 3 s |
| wnętrza (profil Atmosphere: zestaw kafli / `<Ambience>`; `<NazwaMapy:wnetrze｜miejsce｜off>`) | mniejsza nazwa (30 px) z podpisem | 2,5 s |
| podziemia | piętra składane: „Piętro N” + nazwa pasma (zdanie pasma przy pierwszym zejściu w pasmo); ręczne: nazwa sali + „piętro N · pasmo”; co 10. piętro złoto przechodzi w czerwień; „najgłębiej: piętro N”, gdy był głębiej (osobny komunikat Underground.js w czystym widoku już się nie pokazuje) | jak wyżej |
| nocą na dworze | cieplejsze złoto z poświatą ognia | – |

Wizyty: `Tawerna.state("nazwaMapy")`; stary zapis bierze odwiedzone mapy z tego, co gra już pamięta (odkrycia map w Combat,
piętra podziemi, miejsca kruka, mapa, na której stoi). Przejście na inną mapę gasi napis od razu; wiadomość albo wyłączona nazwa
mapy – napis gaśnie wcześniej (jak stare okno). Nazwa za długa na miejsce między rogami HUD rysuje się mniejsza.
Zrzuty: `gra_*.png` (Podgrodzie: wejście, kreska, błysk, pełny, druga wizyta; las; wnętrze Szynku; piętra 12 i 20; noc w Przystani),
`gra_wejscie.gif` i `gra_wejscie_klatki.png` (wejście Podgrodzia klatka po klatce), `test_*.png` (z `tests/clean_hud_test.js`).
