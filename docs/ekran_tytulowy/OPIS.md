# Ekran tytułowy: 10 propozycji (2026-10-12)

To są makiety do wyboru. W grze nic nie zostało zmienione.

Obecny ekran to `img/titles1/Tawerna_Title.png`: tawerna przy ruinach nocą z ogniskiem, w ruchu gwiazdy, okna, iskry i dym. Podmienia go `UITheme.js` (parametr `titleImage`).

Porównanie wszystkich dziesięciu jest w `zestawienie.png`.

**Każda makieta ma:** 1280×720, napis gry, podtytuł, menu „Nowa gra / Kontynuuj / Opcje / Wyjdź” i wiersz ostatniego zapisu pod zaznaczonym „Kontynuuj”.

**Skąd tła:**
- 8 obrazów z PixelLab (Pro, 640×360, powiększone 2× bez wygładzania). Jako wzór stylu dostały wycinki z prawdziwej gry, żeby pasowały do kafelków Winlu.
- 1 tło to prawdziwy zrzut z gry: burza z Storm.js nad bramą tawerny.
- 1 ekran jest minimalistyczny, z szyldem z PixelLab.

**Czcionki:** Cinzel, Pirata One, Cormorant SC, EB Garamond i Alegreya Sans, wszystkie z Google Fonts (licencja OFL), z polskimi znakami. Menu jest wszędzie w Alegreya Sans, tak jak w Grafit i miedź.

| # | plik | pomysł | napis i menu | co by się ruszało |
|---|---|---|---|---|
| 1 | `tytul_01_tawerna_w_deszczu.png` | Tawerna przy ruinach zamku nocą w ulewie; ciepłe okna, otwarte drzwi, szyld z kuflem, kałuże. | Miedziany napis z kapitalików i podtytuł „opowieść spod ruin”; menu w lewym dole z miedzianą kreską. | Deszcz w dwóch warstwach, rozbryzgi w kałużach, migające okna, szyld kołysany wiatrem, dym z komina, czasem daleki błysk. |
| 2 | `tytul_02_kufel_przy_kominku.png` | Zbliżenie: kufel z pianą, świeca, chleb i monety na stole, za nimi kominek z kociołkiem. | Złoty gotycki napis z lewej i podtytuł „Ciepły kąt na krańcu świata”; pionowe menu z lewej. | Płomień kominka i świecy, iskry w górę, para nad kociołkiem, opadająca piana, migotanie światła na stole. |
| 3 | `tytul_03_przekroj_do_serca.png` | Przekrój ziemi: chata na górze, pod nią ruiny zamku, schody w głąb, na dole świecące Serce. Z prawej skala głębokości (Tawerna → Piętro 100). | Miedziany napis i dwa zdania („Pod tawerną jest zamek. Pod zamkiem jest coś, czego zamek strzegł.”); menu z turkusowym akcentem. | Pulsujące Serce i jego promienie, kurz w świetle, migające pochodnie, dym z komina. Przy „Nowej grze” kamera mogłaby zjechać w dół. |
| 4 | `tytul_04_chata_o_swicie.png` | Chata dziadka o świcie: słońce za świerkami, mgła nad polem ziemniaków, siekiera w pieńku, wiadro. | Złoty napis z kapitalików i podtytuł „Dług dziadka · sześćdziesiąt dni”; menu w jednym rzędzie na dole. | Płynąca mgła, promienie słońca, dym z komina, przelatujące ptaki, trawa na wietrze. Najjaśniejszy i najbardziej „nadziejny” ekran. |
| 5 | `tytul_05_ognisko_i_wilki.png` | Las nocą: bohater (biedny, bosy) z pochodnią przy ognisku, w ciemności świecą oczy wilków. | Miedziany napis i podtytuł „każde światło to ogień”; menu z prawej. | Ognisko, pochodnia, iskry, świetliki; oczy wilków mrugają, znikają i pojawiają się w innym miejscu. |
| 6 | `tytul_06_kruk_na_szyldzie.png` | Minimalistyczny: czarne tło, kuty szyld z krukiem i kufelkiem, ciepła poświata spod spodu. | Rozstrzelony miedziany napis i linia z rombem; menu w rzędzie pośrodku. | Szyld kołysze się na łańcuchach, poświata migocze jak lampka, a kruk raz na jakiś czas rusza skrzydłami. Najtańszy w wykonaniu. |
| 7 | `tytul_07_burza_nad_tawerna.png` | Prawdziwy zrzut z gry: brama tawerny w ulewie, błyskawica z Storm.js. | Srebrny napis i podtytuł „gdy grzmi, wszyscy schodzą się pod dach”; menu w rzędzie w prawym dole. | Ukośny deszcz, co kilka sekund błyskawica (rozjaśnia cały ekran) i opóźniony grzmot, jak w grze. Można wziąć gotowe efekty Storm.js. |
| 8 | `tytul_08_atlas_kruczej_wyspy.png` | Stara mapa na pergaminie: wyspa w kształcie kruka, góry, las, ruiny, miasteczko, statki, róża wiatrów. | Kartusz w lewym dole: czerwony gotycki napis, „Atlas Kruczej Wyspy”, woskowa pieczęć z krukiem; menu pisane atramentem. | Kołyszące się statki, fale na brzegach, kręcąca się róża wiatrów, lekki ruch kamery nad mapą; zaznaczona pozycja podkreśla miejsce na mapie. |
| 9 | `tytul_09_zima.png` | Zima nocą: zaśnieżona tawerna na ruinach, ciepłe okna, latarnia, ślady na śniegu, sierp księżyca. | Srebrzysto-biały napis i zdanie „Zima na Kruczej Wyspie jest długa.”; menu w panelu Grafit w prawym dole. | Padający śnieg w dwóch warstwach, dym z komina, migająca latarnia i okna, wiatr strąca śnieg z gałęzi. |
| 10 | `tytul_10_komnata_serca.png` | Podziemna sala Serca: posągi klęczących rycerzy, schody z góry, kosze z ogniem, runy wokół ołtarza. | Turkusowy metaliczny napis i podtytuł „serce twierdzy czeka”; menu w rzędzie na dole. | Serce unosi się i pulsuje, runy po kolei się zapalają, kurz w promieniach, płomienie w koszach. Najbardziej tajemniczy. |

## Moje typy
- **Najbardziej „tawernowe”:** 1 (deszcz) i 2 (kufel przy kominku).
- **Najlepiej opowiada całą grę:** 3 (przekrój do Serca).
- **Najbardziej schludny i profesjonalny:** 6 (kruk na szyldzie), który jest też najtańszy do animacji.

Przy wdrożeniu najlepiej zrobić jedną wtyczkę ekranu tytułowego z wyborem tła i warstwami animacji: deszcz, śnieg, iskry, mgła, błysk.

## Pliki robocze
Wszystko jest w `tools/ekran_tytulowy/`:
- `capture.js`: zrzuty z gry, port CDP 9470;
- `tytul.py`: napis w metalu, menu, deszcz, śnieg, mgła, iskry, promienie;
- `ekrany.py`: składa 10 makiet;
- `zestawienie.py`: zestawienie;
- `art/`: tła z PixelLab, 9 obrazów, łącznie 240 generacji;
- `zrzuty/`: zrzuty z gry.

---

## Wdrożone: nr 2 „Kufel przy kominku” (2026-10-12)

**Wtyczka:** `js/plugins/TitleScreen.js`, wpisana na końcu `js/plugins.js`, gdy edytor był zamknięty (sprawdzone tasklistem). `data/System.json` nie jest ruszany. Stary ekran z `UITheme.js` zostaje w kodzie: wraca, gdy parametr `image` wtyczki jest pusty.

- **Tło:** `img/titles1/Tawerna_Title_Kufel.png`, czyli obraz nr 2 bez napisów (zrobiony przez `tools/ekran_tytulowy/tlo_kufel.py`). Stary `Tawerna_Title.png` zostaje, a jego kopia leży w `backup_art_2026-10-12/ekran_tytulowy/`.
- **Ruch:**
  - blask kominka migocze, a jego światło faluje na ścianie i stole;
  - iskry lecą w górę paleniska;
  - płomień świecy drga i daje poświatę;
  - para unosi się nad kociołkiem i lekko nad kuflem;
  - napis i menu wyłaniają się z ciemności (po powrocie z Opcji lub listy zapisów są od razu widoczne).
- **Napis:** „Tawerna” w złotej gotyckiej czcionce Pirata One; podtytuł „Ciepły kąt na krańcu świata” w EB Garamond. Czcionki są w `fonts/` razem z licencjami OFL.
- **Menu:**
  - Nowa gra;
  - Kontynuuj: pod nim ostatni zapis, np. „Dzień 40 · lato · Pole dziadka”. Bez zapisu pozycja jest szara, pomijana i podpisana „brak zapisanej gry”. Otwiera listę zapisów z zaznaczonym najnowszym, więc starsze też są osiągalne;
  - Opcje;
  - Wyjdź: ekran gaśnie i gra się zamyka.
- **Klawisze:** W/S lub strzałki, O lub Enter, P lub Esc. Działa też mysz.
- **Test:** `tests/title_test.js`, 34/34.
- **Zrzuty:** `w_grze.png`, `w_grze_bez_zapisu.png`, `w_grze_lista_zapisow.png`, `w_grze_klatki.png` (4 klatki kominka), `w_grze_ruch.gif`, `w_grze_kominek.gif`.
