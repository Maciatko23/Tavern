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


---

## Propozycje 11-16 (2026-10-30)

To są makiety do wyboru. W grze nic nie zostało zmienione. Porównanie: `zestawienie_2.png`.

**Skąd tła:** 6 obrazów z PixelLab Pro, 320×180 ze wzorem stylu z wycinków prawdziwej gry, powiększone 4× bez wygładzania (to 10 generacji na obraz zamiast 25 przy 640×360, stąd grubszy piksel niż w nr 1-10). Na nr 14 wisiorek to prawdziwa ikona z gry (`tools/prolog/art/ikona_wisiorek_kruk.png`, 6×), a na nr 15 bohater to prawdziwy sprite gry (`Hero_Walk.png`, tyłem, boso, w podartym ubraniu). Czcionki te same co przy 1-10.

| # | plik | pomysł | napis i menu | co by się ruszało |
|---|---|---|---|---|
| 11 | `tytul_11_prom_o_swicie.png` | Prom z podróżnymi płynie o świcie ku wyspie w kształcie kruka z rozpostartymi skrzydłami; rdzawy zakwit na wodzie, mewy. | Złoty napis z kapitalików Cinzel i podtytuł „ostatni prom na Kruczą Wyspę”; menu w rzędzie na dole. | Fale i odbicia słońca, prom kołyszący się na wodzie, latarnia na maszcie migocząca jak ogień, mewy, powoli dryfujące chmury, rdzawy zakwit przesuwa się po wodzie. |
| 12 | `tytul_12_latarnia_w_mgle.png` | Latarnia na trzech wzgórzach przylądka nocą, snop światła przez mgłę, czerwona woda pod klifem. | Srebrny napis Cormorant SC z ciepłym blaskiem i podtytuł „światło, które nie gaśnie”; menu w kolumnie z prawej. | Snop światła wolno obraca się i prześwieca przez mgłę, mgła płynie, laterna i okienko migoczą jak ogień, fale rozbijają się w rdzawej wodzie, drgają gwiazdy. |
| 13 | `tytul_13_susza.png` | Wyschnięta studnia na rynku w upale, spękana ziemia, puste wiadro, pył w słońcu. | Złoty napis i podtytuł „Woda jest cenniejsza niż złoto”; menu w rzędzie na dole. | Pył i kurz niesione wiatrem po ruchomych promieniach słońca, drgające od upału powietrze nad ziemią, kołyszące się suche trawy, lina studni lekko się chwieje, czasem pyłowy wir. |
| 14 | `tytul_14_wisiorek_z_krukiem.png` | Wisiorek z krukiem od matki na stole przy świecy, obok list dziadka z pękniętą pieczęcią. | Złoty gotycki napis Pirata One i podtytuł „po matce został tylko kruk”; menu w kolumnie z prawej. | Płomień świecy drga i rzuca falujący blask na blat, na srebrze wisiorka przesuwa się odblask, drobny dym znad knota, cienie lekko oddychają. |
| 15 | `tytul_15_bialy_orzel_nad_grania.png` | Biedny, bosy chłopiec na występie grani o zachodzie, nad górami leci biały orzeł zakonu. | Złoty napis i podtytuł „Orla Grań, o zachodzie”; menu w rzędzie na dole. | Orzeł krąży i powoli przelatuje przez niebo, chmury płyną, wiatr porusza włosami i koszulą chłopca, światło zachodu powoli gaśnie i rozbłyska na szczytach. |
| 16 | `tytul_16_kronika_zakonu.png` | Otwarta iluminowana kronika z krukiem w skryptorium pustelni, świeca, kałamarz, okno na morze o zmierzchu. | Złoty gotycki napis i podtytuł „Kronika zakonu kruka”; menu w rzędzie na dole. | Świece, kandelabr i latarnia migoczą jak ogień, kurz w ciepłym świetle, fale w oknie, od czasu do czasu sama przewraca się strona kroniki. |

### Moje typy
- **Najlepszy na nowy ekran:** 11 (prom o świcie). Jest prosty w animacji, opowiada początek gry (prolog, podróżni z promu, wyspa-kruk) i ma jasną, nadziejną paletę, której brakuje w obecnym nocnym ekranie.
- **Najbardziej nastrojowy:** 14 (wisiorek z krukiem). Jedna świeca i jeden przedmiot, bardzo tani w animacji, a pasuje do kufla z nr 2. Zaraz za nim 12 (latarnia) z obracającym się snopem.

Pliki robocze: `tools/ekran_tytulowy/ekrany2.py` (makiety), `zestawienie2.py`, tła w `tools/ekran_tytulowy/art/` (`prom.png`, `latarnia.png`, `susza.png`, `wisiorek_stol.png`, `grania.png`, `kronika.png`). Zużycie PixelLab: 60 generacji (6 × 10).

# Propozycje ekranu tytułowego 17-26 (2026-10-30)

To są makiety do wyboru. W grze nic nie zostało zmienione. Porównanie: `zestawienie_3a.png`.

**Metoda jak przy 11-16:** tła z PixelLab Pro, 320×180 ze wzorem stylu z wycinków prawdziwej gry (wnętrze: `styl_wnetrze.png`, plener: `styl_zewnatrz.png`), powiększone 4× bez wygładzania do 1280×720. Każda makieta ma napis „Tawerna” z podtytułem, menu „Nowa gra / Kontynuuj / Opcje / Wyjdź” w Alegreya Sans i wiersz zapisu pod „Kontynuuj”. Czcionki (OFL) te same co przy 1-16. Ludzie na tłach są w stylu gry, bez wątków romantycznych.

| # | plik | pomysł | napis i menu | co by się ruszało |
|---|---|---|---|---|
| 17 | `tytul_17_sala_tawerny_noca.png` | Szeroki kadr pełnej sali nocą: grajek z lutnią na podeście, karczmarz za ladą, goście przy stołach, kominek z ogniem. | Złoty gotycki napis (Pirata One) u góry i podtytuł „Pełna sala, ciepły kąt na krańcu świata”; menu w rzędzie na dole. | Płomień kominka i latarni migoce jak ogień, iskry z paleniska, ciepły blask faluje na podłodze, goście unoszą kufle, grajek stuka nogą. |
| 18 | `tytul_18_gra_w_kosci.png` | Zbliżenie stołu: kości w locie, monety, kufle z pianą, karty, świeca, dłonie graczy (jedna w pięści). | Złoty napis Pirata One w lewym górnym rogu, podtytuł „Dziś gramy o wszystko”; menu w kolumnie z lewej. | Kości raz na jakiś czas lecą i się toczą, płomień świecy drga i faluje blask na blacie, piana opada, moneta się kręci. |
| 19 | `tytul_19_kruki_na_ruinach.png` | Ruiny zamku o zmierzchu: wieża, popękane mury, stado kruków na blankach i w powietrzu, fioletowo-pomarańczowe niebo. | Miedziany napis z kapitalików Cinzel u góry z lewej i podtytuł „Kruki wiedzą, co strzegły mury”; menu w rzędzie na dole. | Kruki zrywają się i wracają na blanki, ich kółka na niebie, zachód powoli gaśnie, okno wieży migocze jak ogień. |
| 20 | `tytul_20_zejscie_do_podziemi.png` | Piwnica tawerny: otwarta krata, kamienne schody w ciemność, płonąca pochodnia na ścianie, beczki i worki. | Srebrny napis Cormorant SC z ciepłym blaskiem po prawej i podtytuł „Pod tawerną są schody”; menu w kolumnie z prawej. | Pochodnia migocze i faluje światło na murze, z głębi schodów wieje kurz i dym, krata lekko skrzypi, w ciemności raz błyśnie coś turkusowego (Serce). |
| 21 | `tytul_21_dzien_targowy.png` | Rynek w dzień targowy: kolorowe kramy, ludzie, kury, w środku sucha studnia, wokół domy. | Złoty napis Cormorant SC i podtytuł „Dzień targowy, a studnia sucha”; menu w rzędzie na dole. | Kury dziobią i chodzą, ludzie przechodzą między kramami, markizy na wietrze, cienie chmur suną po placu, kurz nad ziemią. |
| 22 | `tytul_22_pole_dziadka_jesienia.png` | Pole dziadka jesienią: dynie, snopy i łany zboża, strach na wróble z krukiem na ramieniu, chata z dymem w tle. | Złoty gotycki napis w lewym górnym rogu i podtytuł „Pole dziadka, jesienią”; menu w rzędzie na dole. | Spadające liście, dym z komina, kruk przestępuje i trzepocze skrzydłami, zboże faluje na wietrze, strach lekko się kołysze. |
| 23 | `tytul_23_wrak_na_mieliznie.png` | Wrak na łasze przy odpływie o zachodzie: czerwona woda, mokry piasek, połamany maszt, mewy. | Miedziany napis Cinzel i rozstrzelony podtytuł „gdzie odpływ zostawia wraki”; menu w rzędzie na dole. | Rdzawa woda się cofa i wraca, piana na brzegu, mewy krążą, zwisające liny i strzępy żagla kołyszą się, zachodzące światło. |
| 24 | `tytul_24_sztorm_z_klifu.png` | Sztorm z klifu: fale rozbijają się o skały, błyskawica nad morzem, kruki walczą z wiatrem. | Srebrny napis Cinzel i podtytuł „gdy grzmi, wszyscy schodzą się pod dach”; menu w kolumnie z lewej. | Błyskawica co kilka sekund rozjaśnia ekran i opóźniony grzmot (Storm.js), fale i piana, kruki szarpane wiatrem, trawa i krzaki gną się. |
| 25 | `tytul_25_oboz_uchodzcow.png` | Obóz uchodźców nocą: ognisko z kociołkiem przy palisadzie Podgrodzia, łatane namioty, ludzie owinięci kocami. | Złoty napis Cormorant SC i podtytuł „Ogień dla tych, którzy nie mają domu”; menu w rzędzie na dole. | Ognisko i iskry, para z kociołka, blask faluje na namiotach i twarzach, ludzie przesuwają się i dokładają drew, pranie na palisadzie. |
| 26 | `tytul_26_kuznia.png` | Kuźnia: żar w palenisku, kowadło na pniu, miech, narzędzia na ścianie, beczka z wodą, ciepłe światło. | Złoty gotycki napis po prawej i podtytuł „Żar, kowadło i uczciwa robota”; menu w rzędzie w prawym dole. | Żar w palenisku pulsuje, iskry lecą z paleniska i kowadła, miech oddycha, co jakiś czas uderzenie młota i rozbłysk, łańcuchy się kołyszą. |

## Moje typy
- **Najlepszy na nowy ekran:** 17 (sala tawerny nocą). Opowiada całą grę (tawerna, goście, grajek, ogień), ma duży kadr i tanie ruchy (kominek, lampy).
- **Najbardziej nastrojowy:** 25 (obóz uchodźców), a tuż za nim 20 (zejście do podziemi). Jedno wyraźne źródło ognia, ciemne otoczenie i mało elementów do animowania.

## Pliki
Tła (PixelLab, 10 generacji na obraz, razem 100): `tools/ekran_tytulowy/art/` (`sala_noc.png`, `kosci.png`, `kruki_ruiny.png`, `podziemia.png`, `rynek.png`, `pole_jesien.png`, `wrak.png`, `sztorm.png`, `oboz.png`, `kuznia.png`). Skrypty: `ekrany3.py` (makiety), `zestawienie3a.py` (zestawienie).

# Ekran tytułowy: propozycje 27-36 (2026-10-30)

To są makiety do wyboru. W grze nic nie zostało zmienione. Porównanie: `zestawienie_3b.png`.

**Metoda jak przy nr 11-16** (opis w `OPIS.md`): 10 teł z PixelLab Pro, 320×180 z wycinkiem prawdziwej gry jako wzorem stylu (`art/styl_zewnatrz.png` lub `styl_wnetrze.png`), powiększone 4× bez wygładzania do 1280×720. Na nr 29 dodatkowo odniesienie do atlasu z nr 8. Napis „Tawerna” z podtytułem, menu „Nowa gra / Kontynuuj / Opcje / Wyjdź” w Alegreya Sans i wiersz zapisu pod „Kontynuuj”. Czcionki napisu: Cinzel, Pirata One, Cormorant SC, EB Garamond (wszystkie OFL). Na nr 33 bohater to prawdziwy sprite gry (`Hero_Walk.png`: biedny, bosy, podarta koszula) z dorysowanym koszykiem; na nr 36 kruki są dorysowane pikselami.

| # | plik | pomysł | napis i menu | co by się ruszało |
|---|---|---|---|---|
| 27 | `tytul_27_biblioteka_w_podziemiu.png` | Niekończące się regały w podziemnej bibliotece, chłodne niebieskawe światło świec i ciepły ogień w koszach, kurz w powietrzu. | Srebrny napis z kapitalików Cinzel u góry i podtytuł „księgi, których nikt nie dokończył”; menu w rzędzie na dole. | Niebieskie i pomarańczowe płomienie migoczą jak ogień, kurz dryfuje w świetle, od czasu do czasu iskra z kosza. |
| 28 | `tytul_28_noc_kupaly.png` | Noc Kupały: wianki ze świecami płyną po rzece, ognisko na brzegu, świetliki. Święto, bez ludzi i bez romansu. | Złoty gotycki napis Pirata One z lewej i podtytuł „Noc Kupały · wianki płyną z prądem”; menu w kolumnie z lewej. | Ognisko i iskry, wianki powoli płyną z prądem, a ich świece drgają, świetliki krążą nad trawą. |
| 29 | `tytul_29_atlas_na_stole.png` | Atlas wyspy-kruka rozwinięty na stole, świeca, kałamarz z piórem, kompas. Kadr od góry z boku, inny niż nr 8. | Złoty napis z prawej i podtytuł „Atlas Kruczej Wyspy”; menu w kolumnie z prawej. | Płomień świecy i ciepły blask na pergaminie, igła kompasu się waha, delikatny dym nad knotem. |
| 30 | `tytul_30_szyld_pod_zlotym_kuflem.png` | Zbliżenie szyldu „Pod Złotym Kuflem” nad drzwiami tawerny w deszczu, latarnia, kałuże z odbiciem ognia. | Złoty napis z lewej i podtytuł „Pod Złotym Kuflem”; menu w kolumnie z lewej. | Deszcz w dwóch warstwach, szyld kołysany wiatrem, latarnia migocze jak ogień, rozbryzgi w kałużach. |
| 31 | `tytul_31_garnizon_o_swicie.png` | Brama fortu nad zatoką o świcie, chorągiew z feniksem, wartownicy na murach, pochodnie. | Złoty napis z kapitalików z lewej i podtytuł „brama nad zatoką, o świcie”; menu w kolumnie z lewej. | Mgła płynie nad wodą, chorągiew faluje, pochodnie migoczą, wartownicy zmieniają pozycję, zatoka lśni. |
| 32 | `tytul_32_pustelnia_na_klifie.png` | Kamienna pustelnia na skraju klifu nad morzem, dym z komina, mewy, mgła. | Srebrny napis Cormorant SC z lewej i podtytuł „cisza nad klifem”; menu w kolumnie z lewej. | Mgła dryfuje po klifie i nad wodą, mewy przelatują, dym wije się z komina, fale u podnóża. |
| 33 | `tytul_33_wiosna.png` | Kwitnące jabłonie i grusze, motyle, ścieżka do chaty dziadka, bohater z koszykiem kwiatów. | Złoty napis Pirata One u góry i podtytuł „Wiosna u dziadka”; menu w rzędzie na dole. | Płatki opadają z drzew, motyle latają po sadzie, trawa i kwiaty na wietrze, dym z komina, bohater oddycha. |
| 34 | `tytul_34_pies_przy_chacie.png` | Przygarnięty pies śpi przy progu chaty o zachodzie, dym z komina, długie cienie, ciepłe okna. | Złoty napis z lewej i podtytuł „psi sen przy progu”; menu w kolumnie z lewej. | Dym z komina, migoczące okna, pies unosi się przy oddechu i czasem macha uchem, cienie powoli się wydłużają. |
| 35 | `tytul_35_krag_menhirow.png` | Krąg menhirów w nocnej mgle, księżyc, cienie jak wskazówki zegara, sowa na kamieniu. | Srebrny napis z kapitalików z prawej i podtytuł „tam, gdzie cień wskazuje godzinę”; menu w kolumnie z prawej. | Mgła płynie między kamieniami, sowa obraca głowę i zrywa się do lotu, cienie bardzo wolno wędrują jak wskazówki, gwiazdy drgają. |
| 36 | `tytul_36_dwor_lorda_noca.png` | Złowrogi dwór Lorda nocą, zimne światło okien, kruki na kalenicy, żywopłot, dwie latarnie przy bramie. | Srebrny napis z lewej i podtytuł „dwór, który patrzy”; menu w kolumnie z lewej. | Latarnie migoczą jak ogień, okna gasną i zapalają się pojedynczo, kruki przeskakują po dachu i krakają, nisko pełza mgła. |

### Moje typy
- **Najlepszy na nowy ekran:** 28 (Noc Kupały). Ciepły, świąteczny, najbardziej „żywy” w animacji (ogień, wianki, świetliki), a nie powtarza nocnej tawerny z nr 1-2.
- **Najbardziej nastrojowy i tani w animacji:** 30 (szyld w deszczu). Jedna latarnia, deszcz i szyld, a od razu mówi, że to gra o tawernie. Zaraz za nim 35 (menhiry): wyraźny, inny kadr i świetny wątek „cieni jak wskazówki”.

Pliki robocze: `tools/ekran_tytulowy/ekrany3.py` (makiety), `zestawienie3b.py`, tła w `tools/ekran_tytulowy/art/` (`biblioteka.png`, `kupala.png`, `atlas_stol.png`, `szyld_deszcz.png`, `garnizon.png`, `pustelnia.png`, `wiosna.png`, `pies_chata.png`, `menhiry.png`, `dwor_noc.png`). Zużycie PixelLab: 100 generacji (10 × 10).

Wszystkie 36 makiet razem: `zestawienie_wszystkie.png`.
