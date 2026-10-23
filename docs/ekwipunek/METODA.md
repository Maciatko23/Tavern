# Widoczny ubiór bohatera - próba metody (2026-10-22)

Cel: setki przedmiotów do zakładania / zdejmowania / kupna / sprzedaży, każdy założony widoczny na postaci - **bez rysowania
kombinacji**. Próba: jedna koszula w 3 materiałach, buty, słomkowy kapelusz; na chodzie (Hero_Walk, 8 kierunków) i na rąbaniu
(Hero_Axe, Hero_AxeSide). Wynik: zrzuty z gry - `proba_ubioru.png` (siatka), `proba_zblizenie.png` (x4), `proba_arkusze.png`
(całe przemalowane arkusze obok oryginału), `maska_przyklad.png` (jak wygląda maska).

**Ocena w skrócie:** metoda działa i wygląda dobrze w grze. Koszule w trzech kolorach wyglądają jak narysowane od początku
(cieniowanie, fałdy, łaty zostają), kapelusz siedzi na głowie w każdej klatce chodu i zamachu (trzonek siekiery przechodzi przed nim,
rondo rzuca cień na twarz), składanie trwa 2-4 ms na arkusz. Słabsze: buty to tylko przemalowane bose stopy (bez cholewki), a
ubranie nie zmienia **kształtu** - nowa koszula ma te same postrzępione brzegi co stara tunika.

## Jak to działa

1. **Maska części ciała** (`tools/ubior/maski.py`, raz na arkusz, poza grą). Obraz tej samej wielkości co arkusz
   (`img/system/Ubior_Maska_<arkusz>.png`), w którym każdy piksel postaci ma kolor swojej części: włosy, kontur włosów, skóra,
   stopy, kontur stóp, koszula, kontur koszuli, spodnie, pas, narzędzie, oczy/usta, kontur, inne (legenda: `maska_przyklad.png`).
   Sam kolor nie wystarcza (tabela niżej: ostrze siekiery ma szarości koszuli, trzonek - brązy spodni i najciemniejszy odcień skóry),
   więc dzielenie idzie klatka po klatce:
   - klasa koloru (HSV): kontur / ciemna szarość / szarość / cielisty / brąz / inne;
   - włosy = największa plama ciemnej szarości (+ jej kawałki przecięte trzonkiem); głowa = prostokąt włosów;
   - „rdzeń ciała” = sylwetka po otwarciu morfologicznym (znika cienki trzonek, zostaje tułów, nogi, głowa);
   - koszula = szare plamy w rdzeniu między brodą a kolanem, blisko osi tułowia; plama z białą krawędzią albo daleko w bok
     (ostrze na końcu trzonka), nad głową albo niżej kolan -> narzędzie;
   - stopy = cieliste plamy z jasnymi pikselami najniżej w klatce, bez spodni tuż pod nimi (dziury w nogawkach to nie stopy);
   - kontur dostaje część większości sąsiadów;
   - tam, gdzie reguły się mylą - **ręczna poprawka** (lista `POPRAWKI`: prostokąt w klatce, część -> część). W próbie potrzebna
     była jedna (Hero_Axe, tyłem, klatka 14: ostrze bokiem przy biodrze) na 208 klatek.
2. **Ubranie przemalowujące** = rampa 6-7 kolorów (od cienia do światła) dla jednej części. Każdy piksel tej części dostaje kolor
   rampy wg swojej dawnej jasności (luma w zakresie części: koszula 0,26-0,67, stopy 0,42-0,86) - cieniowanie zostaje, a ten sam
   stary kolor zawsze daje ten sam nowy (czysta paleta, bez mieszania). Kontur zostaje czarny jak u bohatera.
3. **Rzecz przyczepiana** = obrazek rysowany raz (`img/system/Ubior_Kapelusz.png`, rysowany kodem: `tools/ubior/kapelusz.py`;
   okrągły kapelusz wygląda tak samo z każdej strony - jedna klatka + klatka „z tyłu” z końcami wstążki). W każdej klatce arkusza
   gra szuka góry włosów w masce (pierwszy wiersz z 6+ pikselami włosów, środek z 5 wierszy niżej) i kładzie tam punkt
   zaczepienia kapelusza. Gdy góra włosów jest myląca (trzonek przecina czubek głowy), kapelusz idzie za środkiem całych włosów.
   Włosy, które kapelusz „przygniata” (nad rondem, poza kapeluszem), są usuwane; rondo przyciemnia 2 wiersze pod sobą (cień);
   piksele narzędzia zostają na wierzchu (trzonek przed kapeluszem).
4. **W grze** (`js/plugins/Ubior.js`): przy zmianie stroju gra robi kopię arkusza (canvas + getImageData), przemalowuje i
   nakłada kapelusz, wynik trzyma w pamięci (arkusz + strój, do 12 kopii). `ImageManager.loadCharacter / loadSystem` oddają
   przebraną kopię zamiast zwykłego arkusza - HeroLook.js i zamachy (ChoppableTree_Swing) nic o tym nie wiedzą i nie zostały
   zmienione; jedyny dodatkowy hak podmienia arkusz chodu w duszku bohatera, gdy strój zmieni się w marszu. Karta postaci
   (MenuRing), lot na orle i hala tawerny też biorą `Hero_Walk` przez ImageManager, więc powinny dostać przebraną kopię same
   (nie sprawdzane w próbie). Bez stroju (i ze starym Reidem)
   nic się nie zmienia. Strój jest w zapisie (`Tawerna.state("ubior")`); przy parametrze `zEkwipunku` widać też to, co założone w
   Equipment.js: skórzane buty (113) i skórzaną kurtkę (171) (test sprawdza buty: założone - widać, wyjęte z plecaka - znikają).

## Paleta: kolor -> część

27 arkuszy bohatera ma razem 2219 kolorów (nie ~94: każdy arkusz ma własną paletę PixelLab - chód 56, Axe 130, AxeSide 149, a
leżenie 374). Klasy kolorów: kontur 54 kolory, ciemna szarość 77, szarość 298, cielisty 1135, brąz 588, inne 67
(`python tools/ubior/maski.py --paleta`). Najczęstsze kolory trzech arkuszy próby i części, do których trafiły w maskach:

| kolor | pikseli | części (udział) |
|---|---:|---|
| `#040101` | 62934 | kontur 48%, kontur koszuli 20%, kontur włosów 13% |
| `#0a0908` | 19159 | kontur włosów 45%, kontur 39%, kontur koszuli 10% |
| `#999792` | 17575 | koszula 98% |
| `#7e7d79` | 11050 | koszula 72%, **narzędzie 28%** (ostrze) |
| `#242321` | 10874 | włosy 93% |
| `#181716` | 10451 | włosy 82%, kontur 9% |
| `#6b6b69` | 8448 | koszula 82%, narzędzie 18% |
| `#f7c5a1` | 8211 | skóra 77%, stopy 23% |
| `#78573b` | 7950 | spodnie 94%, narzędzie 3% |
| `#62452e` | 5528 | spodnie 81%, narzędzie 12%, pas 7% |
| `#5e5b58` | 5085 | koszula 70%, narzędzie 28% |
| `#533624` | 4927 | spodnie 91%, narzędzie 5% |
| `#363533` | 3946 | włosy 79%, koszula 9%, narzędzie 6% |
| `#a26a4f` | 3730 | skóra 52%, stopy 30%, **narzędzie 13%** (trzonek) |
| `#c17a58` | 3397 | skóra 54%, stopy 43% |
| `#464341` | 3234 | włosy 50%, koszula 21%, narzędzie 15% |
| `#f9d4b6` | 3109 | skóra 88%, stopy 12% |
| `#e5a683` / `#efb591` / `#cc8a68` / `#d19676` | 10206 | skóra ~72%, stopy ~27% |
| `#442b1d` | 2957 | spodnie 94% |
| `#51504f` | 2572 | koszula 74%, narzędzie 17%, włosy 8% |
| `#faf9f8` | 1358 | narzędzie 79% (krawędź ostrza), oczy 16%, koszula 3% |

Stąd maski zamiast tabeli kolorów: ta sama szarość to koszula albo ostrze, ten sam cielisty to twarz, dłoń albo stopa.

## Wyniki próby (tests/ubior_proba_test.js)

- 12/12 sprawdzeń, **0 błędów w konsoli**; w ruchu: zmiana stroju w marszu działa od razu, prawdziwy zamach siekierą w nowym
  stroju, po zdjęciu wszystkiego wraca zwykły arkusz.
- **Czas składania** (Edge, karta graficzna): Hero_Walk 576x512 - 1,5-2,6 ms, Hero_Axe / Hero_AxeSide 1632x384 - 2,3-4,2 ms na
  arkusz (przemalowanie + kapelusz w każdej klatce). Maski z narzędzia: ~2,4 s na trzy arkusze.
- **Kapelusz w 208 klatkach** (72 chodu + 2x68 zamachu): nie odlatuje w żadnej, nic nie ucięte krawędzią klatki, w każdej
  znaleziona głowa (zwykle ~75% kapelusza leży nad włosami, żadna klatka nie odstaje). Uwagi (nie błędy):
  - Hero_Axe lewo i prawo, klatka 7: punkt zaczepienia skacze o 4,3 px - cała głowa przesuwa się w animacji tyle samo, kapelusz
    idzie z nią;
  - Hero_Axe dół, klatka 7 i Hero_AxeSide prawo, klatka 5: trzonek przecina czubek głowy, góra włosów myląca o 2 px - kapelusz
    postawiony wg środka głowy.
- PixelLab: **0 generacji** (kapelusz narysowany kodem).

## Co wyszło dobrze

- Koszule: lniana, wełniana, skórzana różnią się kolorem i kontrastem, a zachowują całe cieniowanie, fałdy, łaty i dekolt -
  wyglądają jak oryginalny rysunek, nie jak nałożony filtr. Ostrze siekiery zostaje szare we wszystkich klatkach.
- Kapelusz z jednej klatki pasuje do 8 kierunków chodu i 4 kierunków zamachu; idzie za głową (także gdy schyla się przy
  uderzeniu), trzonek uniesionej siekiery przechodzi przed nim, rondo cieni twarz - to bardzo pomaga w „osadzeniu” go na głowie.
- Wszystko składa się w grze w kilka ms; arkusze, HeroLook i zamachy bez zmian; strój dowolnie łączony (kapelusz + kaftan + buty).

## Co wyszło źle / ograniczenia

- **Kształt się nie zmienia.** Przemalowanie zmienia tylko kolory: nowa koszula ma postrzępiony dół i łaty starej tuniki, kurta
  i kaftan mają te same krótkie rękawy. Kamizelka bez rękawów, długi płaszcz, sukmana do kolan, kaptur - tak się nie da.
- **Buty** to bose stopy w kolorze skóry: kształt palców zostaje, brak cholewki nad kostką - z daleka czytają się jak niskie
  łapcie / mokasyny, nie jak buty z cholewą.
- **Materiał** widać tylko po kolorze i kontraście (bez faktury: wełna nie jest „puchata”, skóra nie błyszczy). Faktura byłaby
  osobną regułą na przedmiot (np. wzór na jasnych tonach).
- **Mieszanie kolorów:** ~10 szarości tuniki wpada w 7 kolorów rampy - sąsiednie odcienie czasem się zlewają; cień ronda to
  mnożenie (kolory spoza palety, ale niewidoczne przy tej wielkości).
- **Głębia:** maska nie wie, co jest przed czym - narzędzie zawsze jest przed kapeluszem (źle, gdyby siekiera była za głową:
  w próbie nie wystąpiło). Trzonek na tle tułowia bywa w masce „skórą” albo „pasem” (dla koszuli bez znaczenia, dla spodni będzie).
- **Miejsce nad głową:** w klatkach chodu (64x64) włosy zaczynają się 2 px od góry klatki - wysoki kapelusz, hełm czy kaptur się
  nie zmieści (słomkowy jest niski, więc siedzi lekko „wciśnięty” we włosy).
- Maski robią się same, ale trzeba je obejrzeć: reguły mylą się tam, gdzie narzędzie zachodzi na ciało (1 ręczna poprawka na 208
  klatek w próbie; arkusze z łukiem, wędką, pochodnią mogą wymagać więcej).

## Ile pracy na nowy przedmiot

| rodzaj | co trzeba | czas |
|---|---|---|
| ubranie w innym kolorze/materiale (koszula, kaftan, spodnie, pas, rękawice = dłonie, buty) | wpis z rampą 6-7 kolorów | 5-15 min, zero rysowania |
| nowa część do przemalowania (np. rękawy osobno -> kamizelka, nogawki, cholewka) | rozszerzyć reguły maski (+ przejrzeć wszystkie arkusze) | 0,5-2 dni raz, potem jak wyżej |
| okrągła rzecz na głowę (kapelusz, czapka, misa hełmu) | 1-2 klatki obrazka + dobranie punktu zaczepienia | 30-60 min ręcznie albo 1-2 generacje PixelLab + poprawki |
| niesymetryczna rzecz na głowę / plecy (czapka z daszkiem, kaptur, plecak) | 5 kierunków (S, SW/SE, W/E, NW/NE, N - lustra) + punkt zaczepienia na plecy | 2-4 h |
| rzecz zmieniająca sylwetkę (płaszcz, długa szata, zbroja z naramiennikami) | rysunek na każdą klatkę każdego ruchu - tego metoda nie załatwia | dni na przedmiot (albo osobne arkusze) |
| nowy arkusz ruchu | `maski.py <arkusz> --podglad`, przejrzeć, ewentualne POPRAWKI, wpis w SHEETS (kolejność kierunków) | 15-45 min |

## Co trzeba do pełnego systemu

1. **Wszystkie ~27 arkuszy** (6 chodów/biegów/skradania z pochodnią i bez + 21 ruchów) z maskami; w Ubior.js wpis każdego
   (komórka, kolejność kierunków). Składać leniwie, tylko te w użyciu (2-4 ms każdy; najszersze 3168x384 pewnie ~5-8 ms).
2. **Przedmioty w data/Items.json** (ikony, ceny - sklep i sprzedaż działają jak dla każdego przedmiotu) z notatką np.
   `<Ubior:kaftan_welniany>`; **sloty** już są w Equipment.js (głowa, tors, płaszcz, rękawice, pas, nogi, stopy, plecy) -
   Equipment mówi, co założone, Ubior tylko to pokazuje (w próbie tak działa dla 113 i 171).
3. **Więcej części w masce:** rękawy osobno od tułowia (kamizelki), dłonie (rękawice), nogawki, włosy (fryzury/kolor),
   cholewka (pas nad stopą - buty z cholewą jako przemalowanie dolnej części nogawki).
4. **Miejsce nad głową** dla wysokich nakryć: albo kapelusz jako osobny duszek nad bohaterem (klatki z zapasem u góry), albo
   większe komórki chodu w HeroLook.js - decyzja przed hełmami i kapturami.
5. **Popiersia w rozmowach** (tools/busts): ta sama metoda działa na jednym obrazku - maska popiersia (ręcznie ~20-30 min na
   popiersie bohatera) + rampy te same; nakrycia głowy osobno w skali popiersia. Bez tego popiersie zostaje w szarej tunice.
6. **Rzeczy zmieniające sylwetkę** (płaszcz 112, plecak 114): płaszcz to osobne arkusze albo warstwa rysowana na ruch;
   plecak - rzecz przyczepiana do pleców (punkt zaczepienia z maski: środek koszuli + kierunek), widoczna tyłem i bokiem.
7. Wdrożenie: dopisać Ubior.js do listy wtyczek pod HeroLook i Equipment (edytor); przy eksporcie z „usuń nieużywane pliki”
   pliki `img/system/Ubior_*` trzeba zachować (gra wczytuje je z kodu).

## Pliki

- `js/plugins/Ubior.js` - wtyczka (próba, **nie ma jej w js/plugins.js**; test wkłada ją do strony).
- `tools/ubior/maski.py` - maski (`--podglad KATALOG`, `--paleta`), `tools/ubior/kapelusz.py` - kapelusz,
  `tools/ubior/zloz_proba.py` - obrazki tego katalogu z wyników testu.
- `img/system/Ubior_Maska_Hero_Walk.png`, `Ubior_Maska_Hero_Axe.png`, `Ubior_Maska_Hero_AxeSide.png`, `Ubior_Kapelusz.png`.
- `tests/ubior_proba_test.js` - test i zrzuty (`node tests/ubior_proba_test.js`, port CDP 9575; zrzuty w tests/ubior_proba/).

---

# Pełny system (2026-10-22, po przyjęciu próby)

## Maski wszystkich arkuszy (27)

`python tools/ubior/maski.py` robi maski wszystkich arkuszy bohatera (chód, bieg, skradanie - z pochodnią i bez, 21 ruchów pracy
i walki, siedzenie, leżenie, przewrót, sieć na motyle). Części: koszula, spodnie, **pas** (sznurek: wąski pasek z koszulą nad i pod
nim + zwisający węzeł), **dłonie** (koniec ręki najdalej od rękawa), stopy, **twarz i szyja**, reszta skóry (przedramiona, kolana
w dziurach), włosy, kontur, narzędzie / broń, oczy i usta, inne (iskry, grudki ziemi). Do reguł z próby doszły:

- oś ciała od głowy do tułowia - stopy i dziury w nogawkach liczone wzdłuż niej (działa też na leżąco);
- włosy domykane (czarne pasma między szarymi), z miarą głowy - kilof albo młot obok głowy już nie "rośnie" we włosy;
- arkusze z pochodnią w ręku = arkusz bazowy + pochodnia: maska bazowa, a piksele, które się różnią, to pochodnia (pięść - dłoń);
- drugi przebieg na arkusz: paleta skóry z twarzy i stóp (drewno w kolorze skóry przy dłoni = narzędzie), paleta nogawek (brąz
  obecny tylko w części klatek - głowica pałki, trzonek - to narzędzie), spodnie tylko w poziomie między stopami a pasem;
- cienkie kreski w kolorze skóry (drąg, wędzisko, żyłka) i wydłużone "dłonie" przycięte do grubej części.

Przegląd: `node tests/ubior_maski_test.js` -> `docs/ekwipunek/maski/<arkusz>.png` (każdy wiersz: oryginał / maska / A czerwony
kaftan + łapcie + kapelusz / B lniana koszula + łapcie + kapelusz / C niebieskie spodnie + skórzany pas + szare rękawice) i
`maski/PRZEGLAD.md` (tabela: klatki, ręczne poprawki, kapelusz schowany, problemy, czas). Ręczne poprawki (`POPRAWKI` w
maski.py): Hero_Axe 2, Hero_Hoe 2 (motyka i grudki ziemi wzięte za stopy), Hero_Net 8 (obręcz siatki przy stopach); pozostałe
24 arkusze bez poprawek.

Znane drobiazgi (zostawione): rękawice zachodzą czasem 1-3 px na trzonek tuż przy dłoni (wędka, siatka, siekiera z boku); drzewiec
włóczni przed pasem bywa "pasem" (skórzany pas zabarwi ten kawałek drzewca); siedząc tyłem nie widać stóp (buty / łapcie się
tam nie pokazują - tak jest dobrze).

## Nakrycie głowy: gdzie się chowa

Kapelusz (każde nakrycie głowy i plecak) siedzi na górze włosów w każdej klatce, w której głowa jest nad ciałem (odchylenie osi
głowa - tułów do 50°). Leżąc (Hero_LieDown: wiersz 0 klatki 12-20, w1 13-19, w2 13-19, w3 10-22) i w środku przewrotu (Hero_Roll
klatki 5-7) się chowa - wisiałby w powietrzu albo pod ziemią; wstając wraca. Kucanie, siedzenie, pieczenie przy ognisku,
skradanie: zostaje (głowa nad ciałem). Problemy z listy `Ubior.problems` w 2 132 klatkach: 6 "skoków" o 3-4 px (Rake w1 k2,
Spear w1/w2 k10, Club w2 k3) - na zbliżeniu kapelusz idzie z głową, i Net w0 k3-4 - siatka zasłania kapelusz (tak ma być).

## Ubior.js w pełnej wersji

- Strój z Equipment.js przez `Ubior_Data.stroj()` (notatka `<Ubior:miejsce,wzor>`, przedmioty 113 / 114 / 171), na to
  `Ubior.set(...)` (testy, sceny). Wzory: `Ubior_Data.WZORY` (rampa + nakładka po nazwie pliku), brakujące pola z własnej tabeli.
- Przemalowania: koszula (z haftem odświętnej koszuli z `akcent`), spodnie, pas (+ sprzączka z `akcent`), dłonie, stopy (łapcie).
- Nakładki: kapelusz i filcowa czapka (obrazki `Ubior_Kapelusz`, `Ubior_Czapka`; rampa przemalowuje ich tony), chusta i opaska
  (rysowane z samych włosów: góra włosów staje się płótnem, węzeł z tyłu głowy), buty z cholewką (stopy + nogawka do 4 px nad
  stopą), plecak (`Ubior_Plecak`: przód - szelki, bok - profil, tył - cały), torba przez ramię (pasek przez pierś + `Ubior_Torba`
  przy biodrze), sakiewka przy pasie (`Ubior_Sakiewka`). Obrazki: `tools/ubior/kapelusz.py`, `tools/ubior/nakladki.py`.
- Każdy arkusz ma jedną żywą kopię (Bitmap przerysowywany przy zmianie stroju) - kto trzyma arkusz (karta postaci, jeździec na
  orle), widzi zmianę; złożenia trzymane w pamięci (16). Czas: zwykle 2-6 ms arkusz 17 klatek, 5-14 ms arkusz 33 klatek, popiersie
  ~5 ms; najdłużej 21 ms (pierwsze złożenie po wczytaniu).
- Karta postaci (MenuRing, Postać -> Ekwipunek): figura przerysowywana przy zmianie stroju, szersza (rondo, torba).
- Popiersie (`img/pictures/Hero_Bust`): maska portretu i obrazki nakryć w skali popiersia (`tools/ubior/popiersie.py`), ubranie
  przemalowane płynnie (portret jest malowany), włosy pod nakryciem ścięte. ImageManager.loadPicture i zestaw rozmów
  (`Tawerna.ui.loadBust`) dają przebrane popiersie.

Zestawienia: `wzory_glowa.png`, `wzory_tors.png`, `wzory_nogi_stopy.png`, `wzory_pas_rece_plecy.png` (każdy z 37 wzorów osobno:
chód w 3 kierunkach, z pochodnią, siekiera z boku, łuk, siedzi, leży), `stroje_w_grze.png` (4 pełne stroje na mapie, zrzuty z
ekranu), `popiersia.png` (popiersie w 4 strojach + karta postaci). Test: `node tests/ubior_test.js` (12/12, bez błędów).
