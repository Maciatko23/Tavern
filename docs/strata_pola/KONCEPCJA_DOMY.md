# Domy po stracie pola — koncepcja i stan (2026-10-15)

**Zainstalowane 2026-10-15** (po „wszystko ok” użytkownika, z poprawkami: większa ziemia, grafika zgliszcz i etapów z PixelLab,
chatę sprzedaje sołtys, obie drogi D21 po 350 G, konik Franka i Marta przy grobie). Generatory: `tools/domy/podgrodzie_zagroda.py`,
`tools/domy/ruina.py`, `tools/domy/build.py`, instalacja `tools/domy/install.py`, grafika `tools/domy/art/` (dom5.png, dom0.png z PixelLab,
`compose_etapy.py` składa `img/characters/!$Zagroda_Dom.png`). Zrzuty z gry: `chata_pod_lasem.png`, `chata_wnetrze.png`,
`zagroda_przed.png`, `zagroda_po.png`, `zagroda_etap_0..5.png`, `dom_lugow_wnetrze.png`, `marta_przy_grobie.png`, `zagroda_wejscie.png`.

Dla porównania jest **chata pod lasem** na Podgrodziu (B): tania, z dachem od razu i z działką widoczną obok.
Do tego dochodzi **spalona zagroda** za Skrajem lasu (C): duża ziemia, kupiona przez zadanie i odbudowana własnymi rękami.
Domu w miasteczku nie będzie.

## A. Co znika (przy instalacji, przy zamkniętym edytorze, z kopią)

- **Dom z podwórzem w miasteczku:**
  - drzwi dokładane w podcieniu na Map008 (47,45);
  - mapy 169 (wnętrze) i 170 (podwórze);
  - ich wpisy w MapInfos.
- **Ogródek za chałupą (obecna mapa 168).** Zwolnione numery 168 i 169 dostaje zagroda: 168 to zagroda z zewnątrz, 169 wnętrze
  odbudowanego domu. Numer 170 zostaje wolny.
- **„Chałupa z desek” (Map111, 13,17)** wraca do bycia zamkniętą, jak przed zmianą. Jej izba (Map154) przechodzi do
  chaty pod lasem.

## B. Chata pod lasem (Podgrodzie) — 600 G

![przed / po](podgrodzie_przed_po.png)
![chata i działka](podgrodzie_zagroda.png)

- **Powiększenie Map111:** 20 rzędów **na dole** (46×36 → 46×56), więc nic istniejącego się nie przesuwa:
  - brama zachodnia, przejście na przystań (0,19), miejsca mieszkańców i zadań, drzwi — wszystko zostaje na swoich
    współrzędnych;
  - generator najpierw sprawdza, że odczyt mapy daje dokładnie te same dane (0 różnic na 9936 polach);
  - ze starych kafelków zmieniają się tylko ścieżka przez południowy pas lasu (x 11–12, rzędy 29–35) i kształty kafelków
    na styku z nowymi rzędami (41 pól).
- **Polana pod lasem:**
  - chata z bali pod strzechą, „Chata pod lasem”, z kominem i drewutnią z boku; drzwi (6,40) prowadzą do izby Map154
    (łóżko, skrzynia, palenisko, bez bocznych drzwi);
  - obok ogrodzona działka **20×12 = 240 pól**; furtka od strony ścieżki (14,43);
  - ścieżka z południowej drogi (rząd 28) między dwoma pniami.
- **Gdzie wolno budować:** nowa notatka mapy `<BuildRegion:8>` i region 8 na działce.
  - Tylko tam, i tylko właściciel, może budować, kopać i siać.
  - Reszta Podgrodzia zostaje bez zmian (dalej `<Farm:off>`).
  - Region 8 nie koliduje z warstwami (RegionLayers używa 1–3) ani z rolnictwem (6 i 7).
- **Przy kupnie** działka jest oczyszczona: bez dzikich krzaków, grzybów i kałuż na start, potem wszystko rośnie jak
  wszędzie.
- **Sprzedaje sołtys:** w zwykłej rozmowie jest pozycja „Domy na sprzedaż” (to jest już zrobione, punkt E). Może też
  sprzedawać ktoś z Podgrodzia — patrz pytania.
- **Przy instalacji poprawię:**
  - `run_transfer_test` — rozmiar 111 to teraz 46×56 (i przejście Skraj lasu ↔ zagroda);
  - `podgrodzie_test`, `przystan_test` i `field_loss_test`;
  - blokadę w `tools/podgrodzie/install.py`, bo ponowna instalacja starego Podgrodzia zjadłaby powiększenie (tak samo jak
    dziś zjada drewnianą bramę i przejście na przystań).

## C. Spalona zagroda — ruina z zadaniem

![mapa zagrody](ruina_mapa.png)
![cała mapa](ruina_cala.png)
![etapy odbudowy](ruina_etapy.png)
![wejście](ruina_wejscie_skraj_lasu.png)

- **Mapa 168 „Spalona zagroda”** ma 50×36 pól, kafelki miasteczka (zestaw 11), a mury i płoty zamykają się same.
- **Wejście:** zachodnia krawędź Skraju lasu (Map023, pola 0,6–8, otwarta trawa nad drogą na pole dziadka).
  - Przejście i drogowskaz to zdarzenia dokładane w grze, kafelki Map023 zostają bez zmian.
  - Powrót: wschodnia krawędź zagrody (49,11–13).
- **Na mapie:**
  - zgliszcza domu (obrazek 252×216, zajmuje 5×3 pola) — to obrazek-zdarzenie, którego klatka to etap odbudowy (PixelLab: gotowy dom i spalony,
    etapy pośrednie wycięte z gotowego, więc wszystkie stoją w tym samym miejscu);
  - resztki stodoły (słupy, deski, zgniła sterta siana);
  - zasypana studnia;
  - połamany płot;
  - krzyż na skraju (grób Jana Ługa);
  - zarośnięte pole (chwasty i suche placki), a na nim krzaki, wysokie pnie, martwe drzewa i kamienie do usunięcia (zdarzenia
    jak na polu dziadka) i dwie dzikie jabłonie starego sadu.
- **Ziemia do budowania:** region 8, **779 pól** (pole i podwórze, bez domu, stodoły i studni). Oczyszczona przy kupnie,
  jak wyżej.

### Zadanie D21 „Spalona zagroda” (dziś ostatnie D to D20)

**Historia** (zgodna z tym, co Marta mówi już w grze: „Mój Janek zmarł zimą, został mi Franek. Ma osiem lat”). Sześć lat
temu, po suchym roku, Jan Ług pożyczył od starego Zaleskiego (ojca Leopolda) na ziarno. Nie oddał w terminie i ludzie dworu
zmierzyli ziemię — to bliźniacza historia do pola dziadka. Tej samej nocy dom spłonął. Jan mówił, że to ludzie dworu; dwór
mówił, że Jan sam podpalił ze złości. Nikt niczego nie dowiódł. Ługowie przenieśli się na Podgrodzie z dwuletnim Frankiem.
Jan najmował się do roboty i zmarł zeszłej zimy. **Marta Ługowa** pierze dziś cudze rzeczy, także pościel z dworu. Ziemia
jest zapisana na dwór i leży odłogiem, bo „popiół nie rodzi”.

**Kroki zadania:**

1. **Start, dla każdego gracza.** Wejście do zagrody i obejrzenie zgliszcz albo krzyża daje notatkę „Czyja to zagroda?”.
   Po stracie pola podsuwa to też dziadek: „Za skrajem lasu stoi zagroda Ługów. Lord wziął ją za długi, jak nasze pole…”.
2. **„Kto tu mieszkał?”** Józek Łata (handlarz starzyzną, 7–20) opowiada historię: Ługowie, a Marta pierze na Podgrodziu.
3. **Marta** (6–21) opowiada. Nie chce tam wracać („tam jest tylko popiół i grób”), ale „chciałabym, żeby ktoś tam znowu
   palił ogień”.
4. **Wybór.** Sołtys zna stare prawo wyspy: ziemia zabrana za długi i leżąca odłogiem ponad pięć lat wraca do rodu, jeśli
   ród się o nią upomni i zapłaci wpis do księgi.
   - **a) Kupić od Lorda: 350 G.** Lord: „Popiół? Bierz. Tylko nie rozpowiadaj, że dwór handluje popiołem.” Marta nic nie
     dostaje, Opinia −2 („Lord znowu zarobił na Ługach”).
   - **b) Przez Martę: 100 G wpisu u sołtysa i 250 G dla Marty** (sołtys jej zanosi). Razem też 350 G, ale pieniądze idą do
     biednej rodziny. Marta zrzeka się ziemi na bohatera, Opinia +5.

   Obie drogi dają akt własności.
5. **Odbudowa domu.** Każdy etap działa jak plac budowy: uderzenia młotkiem i zwykła siła za uderzenie, a menu zgliszcz
   pokazuje brakujące materiały dymkiem nad bohaterem.

   | etap | praca | materiały | uderzeń | zostaje z gruzu |
   |---|---|---|---|---|
   | 0 → 1 | Uprzątnij zgliszcza | — (łopata albo siekiera) | 30 | Kamień ×12, Drewno ×6, Gwoździe ×6 i pamiątka „Osmalony konik” (zabawka Franka: oddana Marcie, Opinia +2) |
   | 1 → 2 | Podmurówka | Kamień ×30, Mokra glina ×8 | 30 | — |
   | 2 → 3 | Ściany z bali | Drewno ×30, Gwoździe ×30 | 50 | — |
   | 3 → 4 | Dach (strzecha na krokwiach) | Deski ×20, Włókno ×25, Gwoździe ×20 | 40 | — |
   | 4 → 5 | Drzwi, okiennice, palenisko | Deski ×12, Żelazo ×4, Cegła ×12 | 30 | — |

   - Razem: Kamień 30, Glina 8, Drewno 30, Deski 32, Gwoździe 50, Włókno 25, Żelazo 4, Cegła 12 i 180 uderzeń.
   - Dla porównania chatka gracza kosztuje 50 desek, 60 gwoździ, 40 kamieni, 10 żelaza i 80 uderzeń.
6. **Po etapie 5** z komina idzie dym, a drzwi prowadzą do wnętrza (mapa 169, nowa izba z bali). W środku stałe meble:
   palenisko, łóżko, duża skrzynia i kredens.
7. **Studnia:** „Odkop studnię” (łopata, 15 uderzeń). Na dnie jest sucho, zostaje tylko notatka. Zasada suszy: żadnej wody.

Zadanie trafi do Dziennika (zakładka „Miasteczko”) i do `docs/QUESTY.md` / `QUESTY_STAN.md` jako D21.

## D. Strata pola — dziadek i list

Dziadek w pierwszej rozmowie po stracie, notatka „Pole przepadło” i list Lorda mówią o obu możliwościach zamiast o domu w
miasteczku:

- chata pod lasem na Podgrodziu (sołtys, 600 G);
- spalona zagroda Ługów za Skrajem lasu (do odbudowy).

## E. Sołtys — zrobione od razu

Sołtys rozmawia jak dawniej (zadania, powitanie, zwykłe słowa). Na końcu rozmowy pojawia się wybór „Domy na sprzedaż” /
„Do widzenia” — tylko gdy bohater już słyszał o domach, w godzinach 8–16 i gdy coś jest na sprzedaż. Test
`field_loss_test`: 40/40.

## Odpowiedzi użytkownika (2026-10-15)

1. Chatę pod lasem sprzedaje **sołtys**; Józek Łata tylko opowiada (krok 2 zadania D21).
2. D21: obie drogi po **350 G** (wybór moralny).
3. Tak: osmalony konik wraca do Franka przez Martę, a Marta czasem (co 7 dni, 15–18) przychodzi na grób męża w zagrodzie.
4. Rozmiary: działka przy chacie 20×12, ziemia zagrody ok. 780 pól (mapa 50×36).
