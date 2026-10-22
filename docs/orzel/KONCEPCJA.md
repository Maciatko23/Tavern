# Biały orzeł: koncepcja (etap 1)

Stan: 2026-10-18. To jest wyłącznie koncepcja z podglądami do akceptacji: w grze nic się nie zmieniło (żadnych zmian w `data/`,
`js/plugins.js` ani `js/plugins/`). Skrypty podglądów są w `tools/orzel/`, surowe grafiki z PixelLab w `tools/orzel/raw/`.

**W skrócie:** w Akcie II, rankiem po burzy, bohater znajduje na grani w Górach rozbite gniazdo. Leży w nim ostatnie jajo
białego orła, a matkę zabili myśliwi Czarnych Oczu. Bohater wysiaduje jajo w cieple, a potem przez około 200 dni gry
wychowuje orła przez pięć etapów: pisklę, młody, podrostek, prawie dorosły i dorosły. Dorosły orzeł jest wielki (ok. 3×3 pola),
chodzi po ziemi, walczy szponami i dziobem, nurkuje z powietrza i nosi bohatera. Po starcie kamera oddala mapę do x0,5 i lata
się swobodnie nad drzewami i dachami. Przy krawędzi mapy orzeł przelatuje na sąsiednią mapę, a ląduje tylko na otwartej
przestrzeni. Zaniedbany orzeł nie umiera: odlatuje w góry i wraca, gdy go zawołać.

## Podglądy

| Plik | Co pokazuje |
|---|---|
| [etapy_porownanie.png](etapy_porownanie.png) | jajo i 5 etapów orła, każdy obok bohatera w skali gry (siatka = pola); dla porównania Chatka 5×3 |
| [jajo_gniazdo.png](jajo_gniazdo.png) | jajo w gnieździe obok bohatera (x4) |
| [dorosly_ziemia_lot.png](dorosly_ziemia_lot.png) | dorosły na ziemi, w locie i w locie z bohaterem na grzbiecie (x2) |
| [makieta_lotu.png](makieta_lotu.png) | **makieta ekranu lotu**: prawdziwa gra (miasteczko, Map008) oddalona do x0,5, HUD gry, orzeł z bohaterem, cień, chmury, znacznik lądowania, panel lotu (1920×1080 jak pełny ekran) |
| [lot_zoom_porownanie.png](lot_zoom_porownanie.png) | ten sam widok pieszo (x1) i z orła (x0,5), oraz pole dziadka przy x0,5 (mapa mniejsza niż widok) |
| [ryzyko_noc_deszcz.png](ryzyko_noc_deszcz.png) | noc i deszcz przy x0,5 bez poprawek: ciemność i krople kryją tylko ćwierć widoku |

Mapy na makiecie i porównaniach to **prawdziwe zrzuty z gry**. Oddalenie zrobiłem prototypem w samej stronie (`tools/orzel/lot_zrzut.js`,
CDP 9542), bez ruszania plików gry. Prototyp potwierdza, że technika z punktu 5.2 działa w tym silniku i z tymi wtyczkami.

---

## 1. Skąd jajo i kiedy

### Lore: Skrzydlata Straż

- Zakon miał na Kruczych Skałach dwa rodzaje ptaków. **Kruki** nosiły listy, a **wielkie białe orły**, czyli **Skrzydlata Straż**,
  były oczami twierdzy: krążyły nad wybrzeżem i wypatrywały okrętów. Ich gniazdownia (orlarnia) była na **Orlej Grani** nad
  kamieniołomem. Moja propozycja (pytanie 5) jest taka, że orły wychowywali ci sami **kruczarze** z Urwiska, czyli ród dziadka Stacha.
  Wtedy wątek orła zostaje w rodzinie bohatera, tak jak wisiorek z krukiem.
- Po upadku twierdzy orlarnia opustoszała, a orły zdziczały w górach. Dziś na wyspie mówi się, że wymarły („biały orzeł to bajka
  dla dzieci, jak Serce”). Ostatnia para gnieździła się na grani do tego lata.
- **Czarne Oczy** szukają znaków zakonu: kamieni z krukiem, a teraz i białego orła jako żywego znaku. Ich myśliwi (ludzie
  z obozu kopaczy w Jaskini, Map014) zastrzelili orlicę strzałami z lotkami z białym okiem. Zabrali jej lotki jako trofeum,
  a gniazdo rozbili w burzy. Jedno jajo przetrwało w szczelinie.

### Kiedy i jak

- **Kiedy:** w Akcie II, czyli po `Story.chapterEnded()` (spłata albo strata pola), **pierwszego ranka po burzy** z planu pogody
  (Survival / Storm.js). Dzięki temu jajo nie zjawia się w rozdziale 1, kiedy trzeba spłacać dług.
- **Zaczepka:** latarnik Bazyli w nocy burzy widział z laterny w błyskach „białe skrzydła i pochodnie na grani nad kamieniołomem”
  i mówi o tym przy pierwszej wizycie po burzy. To zadanie D29. Druga droga: kruk na zwiadzie w Górach przynosi wieść o „ludziach
  z łukami na grani” (raport jak w Kruk.js). Pasuje też linijka Ansgara (W12 sojusznik): „Moi szukali białego ptaka. Znak zakonu.”
- **Gdzie:** nowa mała mapa **„Orla Grań”** (propozycja: Map175, ok. 40×30, tileset 11 jak Góry), wejście z Map013 ścieżką
  wspinaczkową z północnej ściany kamieniołomu. Przejście dokłada w czasie gry Wyspa.js albo własny injector, tak jak przy wyspie,
  więc mapa użytkownika Map013 zostaje nietknięta. Na grani są: rozbite gniazdo (wielkie, z gałęzi), szczątki orlicy ze strzałami
  z białym okiem, zimne ognisko myśliwych, porzucona sieć i stara kamienna misa na deszczówkę z czasów zakonu. Pod skalnym
  nawisem leży kamień z wyrytym orłem nad krukiem (znak Skrzydlatej Straży).
- **Jajo** to przedmiot kluczowy „Orle jajo”. Nie przepada: można je nieść w torbie (waży 3), ale stygnie (punkt 3.1).
  Przy dziadku (jeśli jest ród kruczarzy) pada zdanie: „Dziad mówił, że kruczarze mieli kiedyś i orły… Myślałem, że zmyśla.”

## 2. Sześć etapów

Dni to **dni opieki**, nie dni kalendarza (punkt 3.6). Przy dobrej opiece orzeł jest dorosły ok. 200 dni gry po znalezieniu jaja (decyzja autora 2026-10-18: każdy kolejny etap trwa 3 razy dłużej niż poprzedni - 5, 15, 45 i 135 dni).
Rozmiary są w polach gry (1 pole = 48 px), w tej samej skali co bohater (wzrost postaci ok. 60 px). Tak pokazuje to
[etapy_porownanie.png](etapy_porownanie.png).

| Etap | Dni opieki | Wzrost na ziemi | Wygląd | Co umie |
|---|---|---|---|---|
| **Jajo** | 3 dni w cieple (36 godzin ciepła) | jajo 0,4 pola, gniazdo 1,3 | kremowe, szaroniebieskie plamki | nic: trzeba je grzać; trzeciego dnia puka, potem scena wyklucia |
| **1. Pisklę** | dni 1–5 | 0,5 pola (24 px) | biały puch, wielka głowa, duże łapy | siedzi w koszu przy ognisku albo w izbie; piszczy, kiedy jest głodne; za bohaterem dreptać umie tylko po jednej mapie |
| **2. Młody** | dni 6–20 | 0,9 pola (43 px) | gruby puch, pierwsze szare pióra na skrzydłach | chodzi za bohaterem po mapach (podskakuje), macha skrzydłami, łapie owady, bawi się z psem; nocuje w gnieździe |
| **3. Podrostek** | dni 21–65 | 1,2 pola (56 px) | szarobrązowe pióra młodzieńcze, resztki puchu | pierwsze podloty (3–6 pól), sam łapie myszy, dziobie w walce (słabo), odciąga wilka; siada na **Rękawicy sokolnika** |
| **4. Prawie dorosły** | dni 66–200 | 2 pola (98 px) | prawie biały, szare cętki | lata swobodnie nad mapą, sam poluje na zające, walczy szponami i dziobem, przewraca wilki; uniesie bohatera (decyzja autora 2026-10-18: krótszy lot - mniej siły skrzydeł, bez nurkowania z jeźdźcem) |
| **5. Dorosły** | od dnia 201 | ok. 3×3 pola (149 px wzrostu, rozpiętość w locie 4,3 pola) | śnieżnobiały, srebrne końce lotek, złoty dziób i łapy | **nosi bohatera** (lot), nurkuje, broni, poluje, płoszy niedźwiedzia, krąży nad polem; w Akcie III broni tawerny |

Uwagi do grafiki:
- Pióra młodzieńcze są szarobrązowe i bieleją z wiekiem (jak u prawdziwych bielików). Dzięki temu po samej sylwetce widać, który
  to etap (pytanie 2).
- Dorosły ma 149 px wzrostu, czyli jest trochę niższy od Chatki 5×3 (203 px). Jeśli ma być naprawdę „jak mały dom”, potrzebna jest
  wersja ok. 4×4 pola (pytanie 1).
- Sprite w locie ([dorosly_lot256.png](../../tools/orzel/raw/dorosly_lot256.png), rozpiętość 205 px, tułów 135 px) pasuje
  wielkością do stojącego orła. Pierwsza próba 192 px była za mała i jest odrzucona.

## 3. Opieka i jej liczby

Mechanika opieki jest jak u psa (Dog.js) i kruka (Kruk.js): potrzeby liczone wg zegara gry (sen i odpoczynek też się liczą),
miska przy gnieździe, menu przy orle.

### 3.1 Ciepło (jajo i pisklę)

- Jajo potrzebuje **36 godzin ciepła**. Ciepło jest wtedy, gdy kosz z jajem stoi do 2 pól od płonącego ogniska, pieca albo
  paleniska w domu (chata dziadka Map019, Chatka Map100, Chata pod lasem, odbudowana zagroda Ługów), albo gdy bohater śpi
  z jajem w torbie.
- Po 12 godzinach zimna z rzędu jajo **stygnie**: postęp staje, pojawia się dymek nad bohaterem („Jajo jest zimne…”). Jajo nie przepada.
- Pisklę w nocy (20–6) musi być w cieple tak samo jak jajo. Inaczej zmarznie: tego dnia nie rośnie, a więź spada o 5.

### 3.2 Jedzenie

| Etap | Kawałki surowego mięsa albo ryby dziennie | Sam łowi | Uwagi |
|---|---|---|---|
| Pisklę | 1 (podzielone na 3 karmienia z ręki) | 0% | karmienie z ręki +3 więzi |
| Młody | 2 | 0% | może jeść z miski |
| Podrostek | 2 | ok. 25% (myszy, owady) | — |
| Prawie dorosły | 3 | ok. 40% (zające) | — |
| Dorosły | 4 | ok. 60% (zające, ryby z morza*, czasem jeleń) | z gracza zostaje ok. 1–2 kawałków dziennie |

- Głód 0–100, spada co godzinę: pisklę −4, młody −3, podrostek −2,5, dalej −2. Wartość jedzenia: surowe mięso 40, ryba 35,
  pieczone 25 (woli surowe), cały zając 100. Orzeł nie je owoców ani chleba.
- *Ryby z morza orzeł łowi sam i zjada sam. Bohater nic z tego nie dostaje.
- Łowy orła są abstrakcyjne (poza ekranem). Za dzień łowów na mapie gniazda rodzi się o jednego zająca mniej (Hunting),
  żeby orzeł nie był darmowym źródłem mięsa i nie wyjadał gry psu.

### 3.3 Woda (susza!)

- Orzeł **pije**. Pisklę i młody tylko z miski: 1 porcja wody dziennie (garnek, wiadro, bukłak), czyli jak miska psa.
- Od podrostka orzeł **sam odlatuje na wodę** raz dziennie, do starych kamiennych mis zakonu na Orlej Grani i do kałuż po deszczu.
  W dzień deszczowy albo po deszczu pokrywa tak 100% potrzeb, w suszy 50%. Resztę (½ porcji dziennie) pije z miski.
- Orzeł **nigdy nie przynosi wody bohaterowi** i nie jest źródłem wody (zasada suszy). Nie pije też z garnków na deszczówkę
  bez pozwolenia: miska jest jego jedynym naczyniem na polu.

### 3.4 Gniazdo (budowla na ziemi gracza)

- **Kosz z sianem** (etapy 1–2): przedmiot do postawienia jak wiadro („Postaw…”), także w izbie. Koszt: włókno 6, siano/trawa 4.
  Mieści jajo albo pisklę, ma miskę.
- **Orle gniazdo** (etapy 3–4): budowla Farming 3×3 na własnej ziemi (pole dziadka, działka pod lasem, zagroda Ługów).
  Koszt: drewno 10, gałęzie 20, włókno 10, kamień 6. Na wysokim słupie z platformą, z miską na jedzenie i wodę jak buda psa.
- **Orla grzęda** (etap 5): ulepszenie gniazda do 4×4, z martwego pnia z poprzeczką i daszkiem. Koszt: bale 6, deski 10, lina 4,
  skóra 2. Jedna na grę, tak jak Chatka. Na grzędzie orzeł śpi, je, leczy się i odpoczywa.
- Grafika: budynki „straight-on” w stylu F z drobnym pikselem (zasada spójności), wzorem jest grzęda kruka.

### 3.5 Więź i głaskanie

- Więź ma skalę 0–100 i startuje od 30 przy wykluciu (orzeł widzi bohatera pierwszego: „wpatruje się w ciebie jak w matkę”).
- Za co rośnie: **Pogłaszcz** raz dziennie +5, karmienie z ręki +3, wspólny lot +5 (raz dziennie), wspólna walka +2, rozmowa
  przy gnieździe wieczorem +1.
- Za co spada: dzień głodu (głód 0 przez 6 h) −10, dzień bez wody −5, dzień bez odwiedzin u gniazda −3, zmarznięcie −5.
- Co daje więź:
  - od 30 słucha poleceń „Chodź / Zostań”;
  - od 60 można na nim latać (etap 5);
  - od 80 nurkuje na polecenie i broni bohatera sam, bez wołania;
  - poniżej 15 ryzyko odlotu (punkt 3.6).

### 3.6 Wzrost i zaniedbanie

- **Dzień opieki** liczy się do wzrostu, gdy w ciągu doby średni głód był powyżej 20, woda powyżej 20, a (dla jaja i pisklęcia)
  było ciepło. Dzień zaniedbany nie liczy się, więc wzrost się przesuwa.
- **Etapy 1–2:** orzeł nie umie odlecieć. Słabnie i piszczy, a dziadek albo pies „pilnują”: jeśli pisklę jest w chacie dziadka,
  dziadek dokarmia je raz dziennie rybą („To twój ptak, nie mój…”). Nie umiera.
- **Od etapu 3:** gdy więź spadnie poniżej 15 albo przez 2 dni z rzędu jest głodny lub spragniony, orzeł **odlatuje na Orlą Grań**
  (scena: krąży nad polem, krzyczy, odlatuje; wpis w dzienniku). Przez **3 dni** nie da się go zawołać. Potem:
  - wołanie (klawisz orła) na dowolnej otwartej mapie: przylatuje, więź = 25;
  - albo wyprawa na grań z mięsem: przylatuje do ręki, więź = 40, notatka „Wrócił”.
- Orzeł **nigdy nie umiera**: ani z głodu, ani w walce.

## 4. Walka

### 4.1 Liczby (porównanie: wilk 50 HP / atak 12, dzik 110 / 30, niedźwiedź 260 / 30; pies gryzie 8 co 26 klatek)

| Etap | HP | Ataki | Siła skrzydeł | Zachowanie |
|---|---|---|---|---|
| Pisklę, młody | 15 / 25 | brak | — | ucieka do bohatera; wilki go nie celują (zawsze bohater albo pies) |
| Podrostek | 40 | dziób 8 co 40 klatek | 40 | skupia uwagę: wilk w 30% atakuje jego zamiast bohatera; przy 50% HP ucieka do bohatera |
| Prawie dorosły | 90 | szpony 16 / dziób 10 co 34 klatki; przewraca wilka w 20% | 60 | walczy przy bohaterze do 30% HP |
| **Dorosły** | 220 | **szpony 23** (wilk przewrócony 50%, człowiek 30%), **dziób 16**, **nurkowanie z powietrza 39** (wilk zawsze przewrócony, dzik zatrzymany w szarży, niedźwiedź ogłuszony na 1 s), **krzyk** raz na walkę (płoszy zające i ptaki, wilkom −20 poise) | 100 | walczy obok, krąży i nurkuje; niedźwiedź po 2 nurkowaniach albo przy < 50% HP **ucieka** |

(Decyzja autora 2026-10-18: obrażenia +30% - były 6 / 12 i 8 / 18 i 12 / nurkowanie 30 - i dwa razy więcej ciosów do zmęczenia: siła za cios 2 / 2,5 / 3 zamiast 4 / 5 / 6.)

- **Siła skrzydeł** (pasek jak siła psa) ogranicza orła, żeby nie walczył za gracza: atak szponami kosztuje 6, nurkowanie 25,
  krzyk 15. W spokoju wraca 8 na sekundę, w walce 2. Przy 0 orzeł jest **zmęczony**: siada na ziemi na 20 s, nie atakuje
  i trzeba go osłaniać (wilki mogą go wtedy kąsać). Dodatkowo między nurkowaniami musi minąć **8 s**.
- **Rany:** przy 0 HP orzeł odlatuje na grzędę (albo na grań, jeśli grzędy nie ma) i leczy się **1 dzień**, tak jak pies w budzie.
- **Ludzie:** orzeł atakuje tylko ludzi, którzy walczą z bohaterem (heroAlarm jak w Starcia.js). **Nie zabija ludzi:** przy 1 HP
  człowiek ucieka albo klęczy (zasada „okradziony, nie zabity” działa w obie strony). Ludzie zadań są chronieni tak jak w Starcia.js.
- **Łucznicy** strzelają do orła: 8 obrażeń, w niskim locie trafiają w 50%, w wysokim wcale. Nurkowanie na obóz łuczników jest ryzykowne.
- **Kogo nigdy nie atakuje:** psa, kruka, zwierząt z zagród (kury, owce, krowy), kota, zwierząt w pułapkach, Milczących, dzieci,
  ludzi w miasteczku. Kury i owce uciekają w popłochu, gdy orzeł ląduje obok (tylko scenka).
- **Doświadczenie:** zabicia orła liczą się bohaterowi jak zabicia psa (`by: "eagle"`, Hunting_Weapons.kill), tak jak przy psie.
- **Combat_Feel:** walka orła nie włącza sama trybu walki, chyba że wróg idzie na bohatera. Cel orła to miękki cel bohatera (F),
  a polecenie „Atakuj” (menu orła albo klawisz orła w trybie walki) wysyła go na ten cel.
- **Podziemia:** orzeł się nie mieści, więc czeka na grzędzie (albo przy wejściu do tawerny, jeśli przyleciał z bohaterem).

### 4.2 Akt III

Gdy w nocy napadu orzeł jest dorosły i ma więź ≥ 60, broni tawerny z powietrza:
- w każdej fali, która idzie od zewnątrz, jest **o jednego napastnika mniej** (nurkowania przed drzwiami);
- **zwiadowcę** frakcji orzeł wykrywa wcześniej i Ambroży dostaje ostrzeżenie;
- dowódca ma łucznika, który strzela do orła, więc orzeł nie wygrywa bitwy sam.

Wynik zapisuje się w echach Aktu III (Act3.js) i w epilogu.

## 5. Lot

### 5.1 Jak to wygląda dla gracza

- **Wsiadanie:** etap 5, więź ≥ 60, siła skrzydeł ≥ 30%. Przy orle menu „Leć” albo klawisz orła **L**. Orzeł kuca, bohater
  wsiada, start z machaniem skrzydeł, a kamera **płynnie oddala się do x0,5** w ok. 45 klatek. Wtedy widać 53×30 pól, czyli
  całe miasteczko wszerz ([lot_zoom_porownanie.png](lot_zoom_porownanie.png)).
- **Sterowanie** (panel lotu na dole, jak na makiecie):
  - WASD / strzałki: lot w 8 kierunkach z bezwładnością (lekki zakręt, nie skok);
  - Shift: szybciej (więcej siły);
  - **Q: wyżej / niżej**. Wysoko to x0,5: szybki przelot, bez ataku. Nisko to x1: orzeł nad koronami drzew w zwykłej skali,
    stąd się nurkuje i ląduje;
  - **Spacja: nurkuj** (atak, punkt 5.8);
  - **L: ląduj**, gdy znacznik pod orłem jest zielony.
- **Prędkość:** nisko 7 px/klatkę, wysoko 9, z Shiftem 12. Bohater biegnie 6, więc mapę 40×30 przelatuje się w 3–5 s.
- **Siła skrzydeł w locie:** 1 na 2 s lotu, Shift 3 na s, deszcz ×1,5. Pełny pasek wystarcza na ok. 3 minuty prawdziwego lotu.
  Poniżej 20% pojawia się ostrzeżenie, przy 0 orzeł sam ląduje w najbliższym dozwolonym miejscu.
- **Noc:** można latać, jest ciemniej, widać ogniska i snop latarni. **Burza:** orzeł nie wystartuje („Nie w taką pogodę.”),
  a jeśli burza złapie go w powietrzu, ląduje.
- **Pies i kruk:** punkt 6.

### 5.2 Zoom out w RPG Maker MZ: technika (sprawdzona prototypem)

Prototyp w `tools/orzel/lot_zrzut.js` robi to, czego potrzeba, i zrzuty pokazują, że działa:

1. **Wirtualny ekran 1/s razy większy.** `Game_Map.prototype.screenTileX/Y` zwracają wartość podzieloną przez s. Od tego zależy
   wszystko w silniku: środek kamery (`Game_Player.centerX/Y`), przewijanie i jego granice, `setDisplayPos`, a także
   `isNearTheScreen`, czyli które zdarzenia się ruszają.
2. **Tilemapa szersza:** `spriteset._tilemap.width/height = Graphics.width/s, Graphics.height/s`. Silnik rysuje tylko ten obszar
   (`Tilemap._addAllSpots`), więc bez tego połowa ekranu byłaby pusta.
3. **Skala całego Spriteset_Map = s** przez zoom ekranu silnika: `$gameScreen._zoomScale = s`, `_zoomX = _zoomY = 0` (od punktu
   0,0). `Spriteset_Base.updatePosition` sam to stosuje.
4. **Ostrość:** przy s = 0,5 i filtrowaniu liniowym (wewnętrzne tekstury 2048² tilemapy `rpgtilemap` i bitmapy postaci) każdy
   piksel ekranu to dokładna średnia 2×2 pikseli grafiki. Obraz jest równy i nie migocze w ruchu. Przy x0,67 piksele są
   nierówne (nearest) albo rozmyte (linear), dlatego **zalecam tylko x0,5 i x1**.
5. **Płynne przejście:** s animowane 1 → 0,5 (i z powrotem), a co klatkę aktualizowane są punkty 1–3 i środek kamery.
6. **MapZoom.js:** w locie wyłączyć `followPlayerWithZoom` i przywracanie zoomu z notatki, a po powrocie z menu (silnik czyści zoom
   przy wyjściu ze sceny mapy) przywrócić s w `Scene_Map.start`.
7. **HUD, dymki, panele** są na scenie, nie w spritesecie, więc się nie skalują. Na makiecie dymek „Woda tylko na przydział
   sołtysa!” stoi poprawnie nad sołtysem (SpeechBubbles liczy zoom). W locie wysokim zalecam ukryć zwykłe dymki dalej niż 12 pól
   od orła, bo z wysoka miasto „gada” za dużo.

**Co trzeba poprawić** (widać to na [ryzyko_noc_deszcz.png](ryzyko_noc_deszcz.png)). Warstwy, które mają rozmiar ekranu
`Graphics.width × Graphics.height` i leżą w spritesecie, przy s = 0,5 kryją tylko lewą górną ćwiartkę widoku:
- **noc** (Farming_Render: `Sprite_NightLight` i płótno światła, wiersze ~591, 667, 852; obcinanie widoczności ~490, 694, 1015)
  to warunek konieczny lotu nocą;
- **deszcz i śnieg** (`Weather` silnika w Spriteset_Map): w locie przenieść go na warstwę sceny, żeby krople miały zwykłą
  wielkość i kryły cały ekran;
- Sky.js (promienie, ~646–669, 787, 812), Storm.js (deszcz burzy, błyski, ~172, 348–375, 521, 544, 629), CloudShadows (obcinanie
  i liczba chmur, 242, 256), Birds (190–367), Motyle (304, 666, 682, 813), DustMotes, Minimap (prostokąt widoku), Hunting (3 miejsca),
  Torch, WaterFx, TownLife, Kruk.

Rozwiązanie: w TawernaCore jedna funkcja `Tawerna.view()` → `{ w, h, s }` (wirtualny ekran w px i skala). W tych miejscach zamiast
`Graphics.width/height` używa się `view().w/h`. To ok. 40 miejsc w ok. 12 wtyczkach, mechanicznie, a test `orzel_lot_test`
sprawdza ciemność nocy i krople w czterech rogach widoku.

### 5.3 Rysowanie większego obszaru i wydajność

- Przy x0,5 na ekranie jest 4× więcej pól i postaci. Tilemapa MZ to jeden przebieg na warstwę z kafelkami w paczkach (53×30×4
  warstwy to ok. 6 tys. czworokątów), więc to bezpieczne.
- Najwięcej kosztują **cienie słońca** drzew i postaci (ChoppableTree_Render, jedna warstwa z AlphaFilter). Zmierzone dawniej:
  61 cieni to +0,05–0,1 ms. W gęstym lesie przy x0,5 może być ich ok. 250, czyli ok. +0,4 ms. Jeśli pomiar w etapie 2 przekroczy
  budżet, w locie wysokim zostawić tylko cienie drzew (bez postaci).
- **Noc** przy x0,5 to płótno światła 4× większe (półrozdzielczość daje 1280×720). To akceptowalne. Zdarzenia blisko ekranu
  ruszają się na większym obszarze, ale to ok. 1,5–2× więcej zdarzeń na typowej mapie.
- Budżet etapu 2: lot wysoki nad Map008 i nad lasem Map013 ma się mieścić w **+2 ms na klatkę** względem chodzenia
  (pomiar jak w tree_shadow_test).

### 5.4 Lot bez kolizji

- W locie bohater jest „w powietrzu”: `through` = prawda, FreeMovement nie sprawdza kolizji, a **wyzwalacze dotykowe są wyłączone**
  (żadnych przejść przez drzwi, pułapek, kałuż, picia przy wodzie, wejść do budynków). Przycisk akcji w locie służy tylko orłu.
- Nie działają też: tryb walki bohatera, budowanie (Q), jedzenie (E), bukłak (G) i narzędzia.
- Granica mapy jest twarda: orzeł nie wylatuje poza mapę, chyba że jest tam przelot (punkt 5.6).

### 5.5 Cień orła na ziemi i chmury

- **Cień** to sylwetka klatki orła w skali świata (przy x0,5 dwa razy mniejsza), rozmyta i przesunięta zgodnie ze słońcem (Sun API
  z ChoppableTree_Render: kierunek rano w lewo, w południe w dół, wieczorem w prawo). Im wyżej orzeł, tym dalej cień i tym bardziej
  rozmyty. Pod chmurą (CloudShadows) cień słabnie, a nocą znika (zostaje tylko przy ognisku, jak cienie od ognia).
- **Orzeł i jeździec** są rysowani w skali 1 (ostre piksele) nad światem w skali 0,5. Na tle zmniejszonego świata wyglądają na
  wysoko lecących (tak jest na makiecie). Na niskim pułapie (x1) skala jest wspólna.
- **Chmury:** w locie wysokim 2–4 miękkie białe chmury dryfują z wiatrem (te same co cienie chmur z CloudShadows, więc chmura
  i jej cień są w jednym miejscu). Część chmur jest pod orłem, jedna czasem nad nim. Przy krawędzi mapy chmury gęstnieją
  w **ścianę mgły**, która zasłania czarne pasy (punkt 5.6). Deszcz to szare chmury, a w zimie lecą płatki śniegu.
- **Mood.js:** w locie wysokim lekko chłodniejsze barwy, mniej poświaty i delikatna winieta „wysokości”.

### 5.6 Krawędzie mapy i przelot na sąsiednią mapę

- **Sąsiedzi** pochodzą z `tools/newstart/layout.py` (EDGES + ISLAND_EDGES) i z przejść krawędziowych innych map. W etapie 2
  skrypt `tools/orzel/krawedzie.py` przejrzy wszystkie mapy i wypisze, które **boki** mają przejście i dokąd prowadzą, do
  `Orzel_Data.js`. Teraz tak jest:

| Mapa | Bok → sąsiad |
|---|---|
| Dom dziadka – podwórze (20) | S → Leśna droga (21) |
| Leśna droga (21) | N → 20, W → Polna droga (22), E → Góry (13) |
| Polna droga (22) | E → 21, S → Skraj lasu (23), N → Okolice Tawerny (8) |
| Skraj lasu (23) | N → 22, W → Pole dziadka (3) |
| Okolice Tawerny (8) | S → 22, E → Posiadłość Lorda (24), W → Podgrodzie (111) |
| Podgrodzie (111) | E → 8, W → Przystań (125) |
| Przystań (125) | E → 111, N → Pustelnia (155), S → Garnizon (162) |
| Pustelnia (155) → Urwisko (157) → Przylądek (159) | E kolejno; Przylądek S → Góry (13, bok E) |
| Garnizon (162) | W → Wrak (165), tylko w odpływie pieszo; **w locie zawsze** |
| poza layout.py | Łąki 4/17/18, Spalona zagroda 168, Osada 120 (przejścia z innych skryptów, do zebrania w krawedzie.py) |

- **Przelot:** gdy orzeł dotknie boku z sąsiadem, pozycja wzdłuż boku przechodzi proporcjonalnie na cały odpowiedni bok
  sąsiada (nie tylko na wąską ścieżkę pieszą), 2 pola w głąb, nadal w locie. Przejście nie zaczernia ekranu, tylko robi **biały
  przelot przez chmurę** (mgła 20 klatek, zmiana mapy, mgła znika). Bohater widzi wtedy ciągły lot.
- **Bok bez sąsiada:** ściana mgły albo morze, orzeł zawraca i raz pokazuje dymek: „Dalej tylko morze.” albo „Za gęsta mgła.”
- **Mapy mniejsze niż widok** (40×30 przy x0,5 ma 13 kolumn czarnych pasów, zrzut 3 w lot_zoom_porownanie.png): za krawędzią
  rysuje się **teren zastępczy** z kafli danego tilesetu (las, łąka, skały, morze; rodzaj w notatce mapy `<OrzelTlo:N=las,E=morze>`),
  przykryty gęstą mgłą i chmurami. Prawdziwe sąsiednie mapy nie leżą geometrycznie równo (przejścia to wąskie ścieżki),
  więc „sklejanie” świata z sąsiadów odradzam: dużo pracy i łatwo o błędy.
- **Lot daleki (propozycja, pytanie 7):** w locie wysokim klawisz M otwiera mapę wyspy z **lądowiskami** odwiedzonymi wcześniej
  na grzbiecie orła (miejsca, gdzie już się wylądowało). Wybór miejsca to 3 s przelotu nad chmurami i lądowanie. Kosztuje 40 siły
  skrzydeł, nie działa nocą w burzy. To skrót zamiast przelatywania mapa po mapie.

### 5.7 Lądowanie

- Znacznik pod orłem (owal 3×3 pola) jest **zielony**, gdy wolno lądować, a czerwony, gdy nie wolno. Na makiecie: „L: tu wylądujesz”.
- **Wolno:** na mapie otwartej (`Survival.isOutdoors()`), bez notatki `<Orzel:off>`, gdy wszystkie 9 pól pod orłem jest
  przechodnich pieszo, bez zdarzeń z grafiką (drzewa, skały, budynki, skrzynie, ludzie), bez wody, bez upraw i budynków Farming.
- **W miastach:** tylko na wyznaczonych placach (region **31 „lądowisko”** malowany na mapie albo prostokąty w notatce). Na
  Map008 to rynek przy studni i plac przed bramą tawerny, na Podgrodziu łąka przy chacie pod lasem, na Przystani plaża.
- **Nie wolno:** we wnętrzach, pod ziemią, w Jaskini, na dachach (z definicji nieprzechodnie), na polu dziadka na zasianej ziemi.
- Lądowanie odwraca start: zniżanie, zoom 0,5 → 1, orzeł siada, bohater zsiada na wolne pole obok. Przy grzędzie można
  wylądować **na grzędzie** (orzeł zostaje, bohater schodzi z drabinki).

### 5.8 Atak z powietrza

- **Tak, ale tylko nurkowaniem orła.** Bohater w locie nie używa broni, bo tak jest prościej i czytelniej (pytanie 8).
- Spacja w locie niskim: orzeł nurkuje na cel pod znacznikiem (miękki cel w 2 polach od owalu), uderza (39 obrażeń, przewraca
  wilka, zatrzymuje dzika, ogłusza niedźwiedzia) i wznosi się z powrotem. Kosztuje 25 siły, a następne nurkowanie jest po 8 s.
  W locie wysokim Spacja najpierw sprowadza orła nisko.
- Wrogowie nie sięgają orła w powietrzu, poza łucznikami (punkt 4.1). Niedźwiedź po dwóch nurkowaniach ucieka.
- Polowanie z powietrza: nurkowanie na zająca albo jelenia zabija go, a tusza zostaje na ziemi do oprawienia (jak u psa). Wilki
  nocą czują tuszę (Starcia: padlina).

## 6. Zapis gry, kruk, pies i inne systemy

- **Stan:** `Tawerna.state("orzel", …)` z wersją. Zawiera: etap, dni opieki, godziny ciepła jaja, głód, wodę, więź, HP,
  siłę skrzydeł, imię, gniazdo (mapa, x, y, rodzaj), tryb (gniazdo / za mną / zostań / odleciał do [dnia]), pozycję orła i stan lotu
  `{ on, level, map, x, y, lastLand }`.
- **Zapis w locie:** ręczny zapis w powietrzu jest wyłączony („Najpierw wyląduj.”). **Autozapis przy zmianie mapy** w czasie
  przelotu też jest wstrzymany (`Scene_Map.shouldAutosave` zwraca fałsz w locie), a po lądowaniu następuje autozapis. Gdyby
  mimo to wczytano zapis z lotem (stary plik, awaria), lot wraca z tego, co jest zapisane. Gdy bohater stoi na nieprzechodnim polu
  bez lotu, przenosi się na `lastLand`.
- **Kruk** (Kruk.js): orzeł nigdy go nie atakuje i nie płoszy (jest wyjątkiem w `Birds.scare`). W trybie „Leć ze mną” kruk
  nie leci obok orła, bo jest za wolny i przy zoomie byłby kropką: czeka i dolatuje po lądowaniu, jak przy wnętrzach.
  Raport zwiadu kruka może wspominać orła („Biały krąży nad graniami”). Obie grzędy mogą stać na jednym polu.
- **Pies** (Dog.js): orzeł nigdy nie atakuje psa, a pies orła. Gdy bohater startuje, pies w trybie „Chodź za mną” wraca do budy
  (hak `performTransfer` psa nie może iść za przelotem). Scenka: na etapie 1–2 pies śpi przy koszu z pisklęciem i warczy na lisy.
  W walce pies i orzeł mają wspólny cel (miękki cel bohatera). Zabicia psa i orła liczą się tak samo.
- **Ptaki** (Birds.js): orzeł płoszy stada w promieniu 5 pól (nurkując 8). Dorosły na grzędzie pilnuje upraw w promieniu 4,
  tak jak strach na wróble. Kruk pilnuje dalej po swojemu.
- **Zagrody** (Livestock): kury, owce i krowy nietykalne; uciekają w popłochu tylko przy lądowaniu obok.
- **Hunting / Starcia:** wilki mogą kąsać podrostka i zmęczonego orła na ziemi (Game_Eagle ma `takeHit`/`isDown`, jak Game_Dog
  w Starcia.js), więc trzeba go bronić. Bandyci nie strzelają do orła, dopóki on ich nie zaatakuje, z wyjątkiem łuczników
  Czarnych Oczu w zadaniach.
- **Combat_Feel / Torch / Sneak:** w locie nic z tego nie działa. Skradanie z orłem przy boku jest niemożliwe („Orzeł jest za duży,
  żeby się skradać”), więc orzeł czeka.
- **Wnętrza i podziemia:** orzeł czeka na zewnątrz (na dachu tawerny albo przy drzwiach) i wraca na grzędę na noc.
- **F9:** zakładka „Orzeł”: daj jajo, ustaw etap, więź na 100, start lotu, teleport na Orlą Grań, wywołaj odlot i powrót.

## 7. Powiązania z zadaniami (numery do potwierdzenia: wolne są W13 i D29 i dalej)

- **D29 „Jajo z grani”** (Akt II, po burzy): wieść od Bazylego, od kruka albo od Ansgara → Orla Grań (Map175) → gniazdo,
  szczątki orlicy, strzały z białym okiem, jajo. 100 dośw., notatka „Strzały z białym okiem”, flaga `orzelJajo`.
- **W13 „Skrzydlata Straż”** (wątek orła):
  1. **Wyklucie:** 36 godzin ciepła, scena wyklucia, ekran imienia (jak u kruka, domyślnie „Śnieżny”), wpis dziadka o kruczarzach.
  2. **Kleofas:** z piórem orła (wypada przy pierzeniu w etapie 3) brat Kleofas rozpoznaje Skrzydlatą Straż z kroniki
     („Księga gniazd”, karta w orlarni na grani) i zdradza sekret misy deszczowej: „orły zakonu piły z kamienia”. Odblokowuje Orlą
     grzędę (etap 5).
  3. **Pierwszy podlot:** Rękawica sokolnika z garbarni (skóra 2, ścięgno 1). Orzeł siada na ręce, a bohater dostaje dziennik
     „Jak uczyć orła”.
  4. **Czarne Oczy:** obcy pytają w tawernie o „białego ptaka” (Feliks pisze o tym w listach, jeśli jeszcze jest we dworze;
     Ansgar-sojusznik ostrzega). Jedna noc to **próba kradzieży** z gniazda siecią: pies szczeka, kruk kracze, walka z 2–3 ludźmi.
     Jeśli się uda, pościg do obozu myśliwych w Górach (Humans, obóz z ogniskiem) i odbicie orła. Orła nie da się stracić na zawsze.
  5. **Lord:** zobaczy orła (lądowanie w mieście albo plotka) i zechce go jako **znak rodu Zaleskich** (propozycja: orzeł w herbie
     nad krukiem z kamieni dworu). Wybory: odmówić (Lord chłodniejszy), **przelot nad dworem w dzień jego uczty** (Lord
     przychylny, Opinia +5). Sprzedaży nie proponuję (pytanie 9).
  6. **Pierwszy lot:** scena o zachodzie nad wyspą; z wysoka widać latarnię, port i dym z komina dziadka. Po wizji „statek bez
     bandery” (D22) na horyzoncie mignie okręt, co zapowiada Akt III.
  7. **Akt III:** obrona tawerny z powietrza (punkt 4.2).
  8. **Epilog:** linijka zależna od więzi i zakończenia, np. „Biały orzeł krąży nad tawerną o świcie”; po zniszczeniu Serca
     „Śnieżny odlatuje na grań i wraca co wiosnę”; przy zapieczętowaniu z zasadami „W Noc Pytania siada na dzwonnicy”.
- **Przy Sercu:** orzeł się nie mieści, więc nie bierze udziału bezpośrednio. Propozycja: w Warstwie Prawdy jedna z prawd mówi,
  **kto zastrzelił orlicę** (strażnik kopaczy z Jaskini, a jeśli Grum przeszedł do frakcji, to Grum ich prowadził). To wybór
  „powiedz / przemilcz” jak przy innych prawdach.
- **W8 / W6:** obóz myśliwych w Górach to ten sam ruch co kopacze, a Marek widział, jak przynieśli białe lotki.

## 8. Technika: pliki, numery, grafika, testy

- **Wtyczki:** `Orzel_Data.js` (liczby, teksty, sąsiedzi krawędzi), `Orzel.js` (stan, opieka, wzrost, gniazdo, AI na ziemi,
  walka, menu, zadania D29/W13 przez TownQuests.FX), `Orzel_Lot.js` (kamera, `Tawerna.view()`, lot, przeloty, lądowanie,
  nurkowanie, cień, chmury). Na liście po Dog / Kruk / Starcia, a Orzel_Lot po MapZoom i Farming_Render.
- **Poprawki innych wtyczek:** `Tawerna.view()` w ok. 12 wtyczkach (punkt 5.2), `Dog.performTransfer` w locie,
  `Birds.scare` (wyjątek kruka, orzeł jako straszak), Act3 (obrońca), Underground_Data EPILOGUE (linijka), Journal (cele).
- **Numery:** zdarzenia proponuję 760–779 (właściciel „Orzel”, wolne w rejestrze TawernaCore), mapa Map175 „Orla Grań”,
  przedmioty od 182 (Orle jajo, Kosz z sianem, Rękawica sokolnika, Pióro białego orła), region 31 jako lądowisko,
  klawisz **L** (keyMapper 76, wolny).
- **Grafika (etap 2),** arkusze jak LOOK8 zwierząt (8 rzędów kierunków, zachód jako lustro wschodu):
  - pisklę: stoi, drepcze, je, śpi;
  - młody: dodatkowo macha skrzydłami;
  - podrostek: dodatkowo podlot i dziobanie;
  - prawie dorosły: dodatkowo lot i atak;
  - dorosły: chodzi, oddycha, szpony, dziób, start i lądowanie, machanie, szybowanie, nurkowanie, odpoczynek, otrząsanie;
  - lot od góry (grzbiet) w 8 kierunkach;
  - **jeździec**: bohater okrakiem w 5 kierunkach, warstwa nakładana na klatkę orła z punktem siodła na każdą klatkę;
  - wyklucie (animacja jaja), Kosz, Orle gniazdo, Orla grzęda, ikony, rekwizyty Orlej Grani.
- **Testy:** `tests/orzel_test.js` (opieka i wzrost wg dni, zimne jajo, odlot i powrót, gniazdo, liczby walki, nietykalni pies,
  kruk i zagrody, ludzie nie giną) oraz `tests/orzel_lot_test.js` (zoom i jego cofnięcie po menu, brak wyzwalaczy w locie,
  przelot krawędzią, zakazane lądowanie, zapis i wczytanie, noc i deszcz w czterech rogach, budżet czasu klatki). Porty CDP
  z wolnej puli. Zgodnie z zasadą „mniej testów”: najpierw całość, potem testy własne i dotknięte.

## 9. Ryzyka techniczne

1. **Warstwy wielkości ekranu** (noc, deszcz, burza, promienie, motyle, ptaki). Udowodnione zrzutem. Rozwiązanie to `Tawerna.view()`
   w ok. 40 miejscach. To największa część pracy w locie, a pominięte miejsce widać od razu (ćwiartka nocy).
2. **Wydajność przy x0,5** w gęstym lesie i w nocy (cienie słońca, płótno światła 4×). Trzeba zmierzyć, a w razie potrzeby
   uprościć cienie w locie wysokim.
3. **Ostrość:** tylko x0,5 i x1. Pośrednie skale wyglądają gorzej. Animacja zoomu przez pośrednie skale trwa 45 klatek
   i to akceptowalne.
4. **Przeloty krawędziami:** sąsiedzi nie leżą geometrycznie równo, a niektóre przejścia powstają w czasie gry (Wyspa.js,
   przypływ). Tabela z narzędzia i proporcjonalne mapowanie boku wystarczą, a sklejanie świata odradzam.
5. **Zgodność z edytorem:** nowa mapa (175) i wejście na Map013 robione wstrzyknięciem (jak Wyspa.js), bez edycji mapy
   użytkownika. Po dodaniu wtyczek trzeba otworzyć Menedżer wtyczek (edytor gubi nieznane wpisy).
6. **Wielkość sprite'ów:** dorosły ma 192–256 px, a v3 PixelLab przy takich płótnach daje mniej klatek i czasem rozmyte
   lotki („smugi”). Lekcje z niedźwiedzia: jedna paleta, klatki wybierane ręcznie, płynność przez wygładzone ruchy w kodzie.
7. **Jeździec na 8 kierunków:** punkt siodła musi iść za klatką skrzydeł. Bez tego bohater „pływa” po grzbiecie. Potrzebna
   tabela przesunięć na klatkę (jak tabela warstw pochodni w Torch.js).
8. **Ekonomia:** orzeł nie może być darmowym mięsem ani wodą (zasady suszy). Łowy abstrakcyjne zmniejszają zwierzynę.

## 10. Szacunek pracy i generacji PixelLab

**Zużyte w etapie 1: 52 generacje.** Wzór stylu za każdym razem: kruk, bohater albo niedźwiedź z gry.
- dorosły 6;
- jajo 5;
- pisklę 5;
- młody 5 + 5 (pierwsza próba za mała, 29 px wzrostu, powtórzona);
- podrostek 5;
- prawie dorosły 6;
- lot 6 + 9 (pierwszy lot był mniejszy niż stojący orzeł, powtórzony w 256 px).

Wyszło ponad ok. 30–40 z polecenia przez dwie poprawki skali.

**Etap 2 (szacunek):**

| Część | Generacje |
|---|---|
| Dorosły: 8 kierunków (11) + animacje v3 na 5 unikalnych kierunkach (chód, oddech, szpony, dziób, start/lądowanie, machanie, nurkowanie, odpoczynek) | ok. 120 |
| Lot od góry 8 kierunków + machanie | ok. 25 |
| Jeździec (bohater okrakiem, 5 kierunków, edit + poprawki) | ok. 25 |
| Prawie dorosły | ok. 65 |
| Podrostek | ok. 45 |
| Młody | ok. 30 |
| Pisklę | ok. 25 |
| Wyklucie, kosz, gniazdo, grzęda, ikony | ok. 30 |
| Orla Grań: rekwizyty (gniazdo rozbite, szczątki, strzały, misa, kamień z orłem) | ok. 30 |
| **Razem** | **ok. 380–400** (zostało 1194 do 29.10) |

**Praca (agent):**
- opieka, wzrost i AI na ziemi: ok. 1 dzień;
- lot z poprawkami warstw: ok. 1,5 dnia;
- zadania D29/W13 i Orla Grań: ok. 1 dzień;
- grafika: ok. 1–1,5 dnia, przy generacjach w tle;
- testy: ok. 0,5 dnia.

Kolejność: najpierw dorosły i lot (to sedno), potem młodsze etapy.

## 11. Pytania do użytkownika (z rekomendacjami)

1. **Wielkość dorosłego:** ok. 3×3 pola, jak na podglądzie (149 px, trochę niżej niż Chatka), czy ok. 4×4 („jak mały dom”,
   wyższy niż Chatka)? *Rekomendacja: 3×3 na ziemi.* Łatwiej ląduje i mieści się na placach, a w locie i tak ma 4–5 pól rozpiętości.
2. **Kolory młodych:** puch biały → pióra szarobrązowe → biel (jak na podglądzie), czy biały od początku do końca?
   *Rekomendacja: jak na podglądzie.* Po samej sylwetce widać etap, a „bielenie” daje nagrodę dorastania.
3. **Czas wzrostu:** 3 dni jaja + 36 dni opieki (dorosły ok. 40 dni od jaja), szybciej (ok. 25) czy wolniej (ok. 60)?
   *Rekomendacja: ok. 40,* a dni zaniedbane się nie liczą.
4. **Jajo:** Akt II, rano po burzy, na nowej małej mapie „Orla Grań” nad Map013 (wejście wstrzykiwane w czasie gry)?
   Czy na samej Map013 albo wcześniej, np. od dnia 30? *Rekomendacja: Akt II + nowa mapa,* bo Map013 to mapa użytkownika.
5. **Lore:** orły zakonu wychowywali kruczarze, czyli ród dziadka, czy osobny oddział zakonu bez związku z rodziną?
   *Rekomendacja: kruczarze.* Wtedy wątek łączy się z wisiorkiem i z dziadkiem, a nie dokłada „szóstej straży” do kronik.
6. **Kamera:** dwa pułapy (wysoko x0,5 do przelotów, nisko x1 do nurkowania i lądowania, przełączane Q) czy jeden x0,5?
   *Rekomendacja: dwa pułapy, start wysoko.* Obie skale są ostre.
7. **Krawędzie i lot daleki:** przelot na sąsiednią mapę przez bok + mgła tam, gdzie nie ma sąsiada. Dodatkowo „lot daleki”
   z mapy wyspy do odwiedzonych lądowisk? *Rekomendacja: tak,* lot daleki jako ostatni krok etapu 2.
8. **Walka w powietrzu:** tylko nurkowanie orła (Spacja), bohater bez broni w locie? *Rekomendacja: tak.*
9. **Lord chce orła:** tylko odmowa albo przelot nad dworem, bez sprzedaży? *Rekomendacja: bez sprzedaży,* żeby nie dało się
   stracić orła na zawsze.
10. **Czarne Oczy:** jedna próba kradzieży młodego orła z gniazda (i odbicie w górach)? *Rekomendacja: tak, raz, w etapie 3–4.*
11. **Akt III:** orzeł jako obrońca: o jednego napastnika mniej na falę z zewnątrz + wcześniej wykryty zwiadowca?
    *Rekomendacja: tak.*
12. **Pogoda:** lot nocą tak, w burzę nie? *Rekomendacja: tak.*
13. **Własne łowy orła** zmniejszają zwierzynę na mapie gniazda (o jednego zająca na dzień)? *Rekomendacja: tak,* to ekonomia
    i uczciwość wobec psa.
14. **Imię:** gracz nadaje je jak krukowi? Domyślne „Śnieżny” czy inne? *Rekomendacja: ekran imienia, domyślnie „Śnieżny”.*
15. **Klawisz:** L (menu orła, wołanie, start i lądowanie)? *Rekomendacja: L.*
16. **Skala w locie:** orzeł w skali 1 nad światem w skali 0,5, czyli „większy” względem domów w locie, jak na makiecie?
    *Rekomendacja: tak.* Jest czytelny, a świat z wysoka „maleje”.
17. **Budżet PixelLab etapu 2:** ok. 380–400 generacji, najpierw dorosły i lot? *Rekomendacja: tak, w tej kolejności.*
