# Spis systemów: wtyczki w nowym świecie

Stan: 2026-11-13. Spis tylko do czytania (nic w grze nie zmieniono). Opiera się na `docs/NOWY_SWIAT/PLAN.md`, `ROZGRYWKA.md`, `QUESTY.md`, `MIESZKANCY.md`. Zależności od starego świata wyszukane grepem (numery map, tabele z numerami zdarzeń, nazwy miejsc i postaci); to spis do akceptacji, decyzje są propozycją.

## Sumy

Wtyczek razem: **228** (225 z listy gry `js/tawerna_wtyczki.js`, w tym 3 obce z `js/plugins.js`: ActorPictures, OptionEx, HDLayout; plus ładowacz TawernaLoader, plus 2 standardowe pliki spoza listy: ButtonPicture, TextPicture).

| Decyzja | Ile | Znaczenie |
|---|---|---|
| ZOSTAJE | 84 | nie zna starego świata (działa na tagach map i danych), bez zmian |
| DOPASOWAĆ | 115 | silnik zostaje, ale trzeba podmienić numery map, współrzędne, tabele danych lub treść |
| ARCHIWUM | 29 | związane ze starymi miejscami lub treścią; wyłączone na czas nowego świata (nic nie kasujemy) |

Według obszarów:

| Obszar | ZOSTAJE | DOPASOWAĆ | ARCHIWUM | Razem |
|---|---|---|---|---|
| Rdzeń | 11 | 0 | 0 | 11 |
| Wydajność | 2 | 0 | 0 | 2 |
| Mapa i ruch | 5 | 4 | 0 | 9 |
| Przetrwanie | 5 | 3 | 0 | 8 |
| Farma i zbieranie | 14 | 12 | 0 | 26 |
| Walka | 10 | 5 | 2 | 17 |
| Stwory i podziemia | 1 | 10 | 0 | 11 |
| Tawerna | 10 | 11 | 1 | 22 |
| Miasto i mieszkańcy | 2 | 17 | 3 | 22 |
| Fabuła i wątki | 2 | 34 | 8 | 44 |
| Świat i mapy | 0 | 6 | 13 | 19 |
| Grafika i nastrój | 14 | 10 | 2 | 26 |
| UI/HUD | 8 | 2 | 0 | 10 |
| Narzędzia i F9 | 0 | 1 | 0 | 1 |
| **Razem** | 84 | 115 | 29 | 228 |

Uwaga o liczeniu: plik silnika i jego plik `_Data` liczą się osobno. Wzorzec projektu: **silniki (rdzeń, ruch, przetrwanie, farma, walka, UI) są prawie wszystkie świat-obojętne** (czytają tagi w notatce mapy: `<Clouds>`, `<Hunt>`, `<Poziom>`, `<Ambience>`, `<Minimap>`, `<Zoom>`, `<Water:salt>`...), a **cała zależność od starych map siedzi w wątkach, paczkach treści, mieszkańcach, tawernie i w danych wizualnych (obrazki upieczone per mapa).**

## Jak czytać tabele

- **Co robi**: pierwsze zdanie opisu wtyczki z listy gry.
- **Zależności ze starego świata / co zmienić**: wynik grepa i uwaga; w nawiasie kwadratowym `[kod: ...]` numery starych map znalezione automatycznie w kodzie (wzorce `mapId() === N`, `MAP = N`, `map: N`, `maps: [...]`, `MapNNN`), które są w `data/MapInfos.json` - mogą zawierać pojedyncze fałszywe trafienia przy małych numerach.
- Kolejność wtyczek w obrębie obszaru = kolejność na liście gry (`js/tawerna_wtyczki.js`). Ładowacz `TawernaLoader` startuje z `index.html` i czyta tę listę; w `js/plugins.js` są tylko on i trzy obce wtyczki.
- Tylko 1 wtyczka na liście ma status `false`: **Wzgorza** (już wyłączona).
- Obszary „Narzędzia i F9” i „Inne” są małe: F9 to jedna wtyczka (Debug), a rzeczy typu ekran tytułowy i prolog są policzone w UI/HUD i Fabule.

## Rdzeń (11)

| Wtyczka | Co robi | Zależności ze starego świata / co zmienić | Decyzja |
|---|---|---|---|
| TawernaLoader | Ładowacz wtyczek gry: wczytuje wszystkie wtyczki z listy gry js/tawerna_wtyczki.js, w jej kolejności i z jej parametrami. Nie wyłączaj. | Ładowacz listy js/tawerna_wtyczki.js; nie zależy od świata. | ZOSTAJE |
| TawernaCore | Rdzeń gry (window.Tawerna): stan w zapisie z wersjami, szyna zdarzeń, wstawianie zdarzeń do map, jeden zegar aktualizacji ze „spokojem”, tagi, kalendarz, bezpieczne dźwięki, dymki. | Rdzeń: stan, szyna zdarzeń, wstawianie zdarzeń do map (Tawerna.inject), tagi. Świat-obojętny. Jedyne ślady starego świata: rejestr bloków id zdarzeń (tablica reserved, komentarze z numerami map 8/9/11/22/23/24/103/140/171/172-174/175) - id są globalne, więc wpisy zarchiwizowanych wtyczek można zostawić (nic nie szkodzą), nowe wtyczki biorą wolne bloki. [kod: 1, 4, 8, 9, 11, 13, 22, 23, 24, 25, 26, 103, 119, 125 +3] | ZOSTAJE |
| ActorPictures | Manages actor pictures. | Obca wtyczka silnika (obrazki postaci); parametry z edytora. | ZOSTAJE |
| AltMenuScreen | Alternative menu screen layout. | Obca wtyczka silnika; nieszkodliwa. | ZOSTAJE |
| AltSaveScreen | Alternative save/load screen layout. | Obca wtyczka silnika (ekran zapisu). | ZOSTAJE |
| OptionEx | Extends the option scene. | Obca wtyczka silnika (opcje); Wydajnosc dokłada do niej Jakość grafiki. | ZOSTAJE |
| HDLayout | Optimizes screen layout for 1280x720. Adjusts the placement of various windows and gauges. | Obca wtyczka silnika (układ 1280x720). | ZOSTAJE |
| TawernaUI | Zestaw interfejsu (Tawerna.ui): baza mini-gier Scene_MiniGame (O/P/strzałki/WASD/mysz, pauza z pomocą, pytanie przed wyjściem, turbo i ziarno dla testów, wynik onEnd) i elementy w stylu... | Zestaw UI i baza mini-gier (Scene_MiniGame). Bez map. | ZOSTAJE |
| Skills_Data | Dane drzewek umiejętności (10 dziedzin, ~90 umiejętności): nazwy, opisy, stopnie, wymagania i działanie.js. | Dane drzewek umiejętności (10 dziedzin). Bez map. | ZOSTAJE |
| ButtonPicture | Standardowa wtyczka RPG Makera: przyciski-obrazki. Poza listą gry. | Standardowa wtyczka RPG Makera; nie ma jej na liście gry (plik leży w js/plugins), nieużywana. | ZOSTAJE |
| TextPicture | Standardowa wtyczka RPG Makera: tekst jako obrazek. Poza listą gry. | Jak wyżej: standardowa, poza listą gry, nieużywana. | ZOSTAJE |

## Wydajność (2)

| Wtyczka | Co robi | Zależności ze starego świata / co zmienić | Decyzja |
|---|---|---|---|
| Wydajnosc | Wydajność mapy: mniej pustej pracy silnika co klatkę (puste aktualizacje, granice filtrów, postacie poza ekranem); Opcje - Jakość grafiki (Automatycznie / Wysoka / Średnia / Niska). | Nie zna konkretnych map (czyta bieżącą mapę ogólnie). Dla nowych map 80x80 sprawdzić budżety. | ZOSTAJE |
| Fullscreen | Gra zawsze startuje w pełnym ekranie, obraz jest dopasowany do ekranu i ostry (bez rozmycia), F4 lub Alt+Enter przełącza okno. | Pełny ekran; bez zależności. | ZOSTAJE |

## Mapa i ruch (9)

| Wtyczka | Co robi | Zależności ze starego świata / co zmienić | Decyzja |
|---|---|---|---|
| MapZoom | Automatyczny zoom ekranu po wejściu na wybraną mapę (przez tag w notatce mapy). | Zoom z tagu notatki mapy; nowe mapy dostają własny tag. | ZOSTAJE |
| FreeMovement | Swobodny ruch gracza co do piksela, w 8 kierunkach (także po skosie), zgodny z uprawami, narzędziami, drzwiami i dużymi obiektami. | Ruch co do piksela, 8 kierunków. Jedyna wzmianka o Map990 to komentarz o mapie próbnej. [kod: 990] | ZOSTAJE |
| RegionLayers | Warstwy z regionów: 1 = pod graczem, 2 = na równi (blokuje), 3 = nad graczem. | Warstwy z regionów 1/2/3; komentarz o malowaniu miasta (Map008) przez tools/town/paint_layers.py - same dane są w mapach. [kod: 8] | ZOSTAJE |
| Pokoje | Zasięg widzenia we wnętrzach budynków: widać to, co bohater może zobaczyć; to, co za ścianami i daleko, jest czarne. | Zasięg widzenia we wnętrzach wg zestawu kafli i notatki mapy; nowe drewniane wnętrza zadziałają po tagach. | ZOSTAJE |
| Widok | Widok na dworze: drzewa, budynki i skały zasłaniają, w nocy widać blisko (dalej z pochodnią i przy ogniu), mgła tam, gdzie jeszcze nie byłeś. | Widok na dworze wg znacznika <Clouds> mapy i zestawu kafli (nie wg numerów). Czyta budynki gracza z Farming. | ZOSTAJE |
| Woz | Wóz Wojciecha: szybka podróż wozem między postojami (miasto, Podgrodzie, Kruczy Jar, Leśna droga, Przystań) za opłatą, z upływem czasu. | Szybka podróż wozem; postoje na sztywno: miasto 8, Podgrodzie 111, Kruczy Jar 3, Leśna droga 21, Przystań 125. Nowa lista postojów = 5 map; ceny i czas przeliczyć na ok. 43 s marszu przez mapę. [kod: 3, 8, 111, 125] | DOPASOWAĆ |
| Orzel_Lot | Lot na białym orle: oddalona kamera (x0,5 / x1), lot nad wszystkim, przeloty krawędziami map, lądowanie, nurkowanie. | Lot na orle nad światem, przeloty krawędziami (zależne od Swiat_Data i Krawedzie). Zostaje tylko jeśli orzeł wraca (patrz Orzel). [kod: 8] | DOPASOWAĆ |
| Swiat_Data | Świat w kratkach: położenia map (x0, y0, szer., wys.) i przejścia danych; czyta je Krawedzie.js. Wyłączone, dopóki dane map nie są zainstalowane. | GENEROWANE (tools/plansza/swiat.py): plansza 3x3 (162/24/13/111/8/4/125...) i lista extra. Przepisać generator na linię 5 map po 80x80 (przejścia, kompas); stare dane do archiwum. | DOPASOWAĆ |
| Krawedzie | Przejścia na całej krawędzi mapy: dojście do brzegu w dowolnym miejscu przenosi na sąsiednią mapę (gdy ta strona ma przejście). | Przejścia całą krawędzią mapy wg Swiat_Data. Logika zostaje; potrzebne nowe dane dla 5 map w linii (szwy W-E). | DOPASOWAĆ |

## Przetrwanie (8)

| Wtyczka | Co robi | Zależności ze starego świata / co zmienić | Decyzja |
|---|---|---|---|
| SurvivalHUD | Zegar analogowy, pora dnia i pasek wytrzymałości na mapie. Spanie w łóżku odnawia siły. Łupy pokazują się jako unosząca się ikona. | Zegar, stamina, łupy w HUD; bez map. | ZOSTAJE |
| Survival | Przetrwanie: jedzenie z premiami, oprawianie zwierzyny, buty / plecak / płaszcz, deszcz i śnieg oraz zimno. | Jedzenie z premiami, buty/plecak/płaszcz, deszcz, śnieg, zimno; pogoda z tagów map. | ZOSTAJE |
| Atmosphere | Klimat: dźwięki otoczenia (wiatr, deszcz, świerszcze, ptaki, żaby), kroki zależne od podłoża, muzyka zmieniająca się z porą dnia, autozapis po spaniu. | Dźwięki otoczenia, kroki, muzyka wg pory. Parametr tavernMaps="1" (stara tawerna) i wykrywanie wnętrz po nazwie mapy /Wewn/Inside/Interior/. Wpisać nową mapę tawerny i tagi <Ambience>. | DOPASOWAĆ |
| Durability | Zużywanie się narzędzi: każde uderzenie, rzut i cięcie zużywa narzędzie, na końcu się łamie. Naprawa w warsztacie. Stan widać na liście przedmiotów. | Zużycie narzędzi i naprawa; bez map. | ZOSTAJE |
| Spoilage | Psucie się jedzenia: świeże mięso, ryby i potrawy z czasem się psują. Spiżarnia (Farming.js) spowalnia psucie. Zepsute jedzenie idzie do kompostownika. | Psucie jedzenia. Dodać sól jako konserwację (wolniej psują się solone mięso i ryby); kod bez map. | DOPASOWAĆ |
| Needs | Głód i pragnienie: dwa paski pod wytrzymałością. Kto jest głodny albo spragniony, traci więcej sił przy pracy, a jego wytrzymałość ma niższy sufit. Woda ze stawu, studni, deszczu i bukłaka. | Głód i pragnienie. Silnik zostaje, ale cała ekonomia wody (limit, studnia, deszczówka, destylarka, sól, kubek 35 pkt) wymaga nowych źródeł i przeliczenia waterRate. Brak twardych map. | DOPASOWAĆ |
| Torch | Pochodnia jak narzędzie i broń: zapalona jest w ręku bohatera (żywy płomień, iskry), przy pracy wbita obok w ziemię, w trybie walki bije i podpala, zwierzęta boją się ognia; deszcz ją... | Pochodnia jako narzędzie i broń; bez map. | ZOSTAJE |
| Drops | Tobołki: rzeczy wyrzucone z plecaka (menu P, Plecak, X) leżą na ziemi; O na tobołku zabiera je z powrotem. | Tobołki rzuconych rzeczy; bez map. | ZOSTAJE |

## Farma i zbieranie (26)

| Wtyczka | Co robi | Zależności ze starego świata / co zmienić | Decyzja |
|---|---|---|---|
| ChoppableTree | Zbieractwo: ścinanie drzew siekierą, kopanie pieńków łopatą, rozbijanie kamieni kilofem, rąbanie kłód, prawdziwa animacja postaci przy machaniu narzędziem, odłamki przy uderzeniu, duże... | Ścinanie, kopanie, kamienie, kłody; liczby uderzeń z parametrów. Bez numerów map (zdarzenia drzew na nowych mapach generować narzędziem tools/drzewa). | ZOSTAJE |
| ChoppableTree_Objects | Rzeczy do zbierania (część ChoppableTree.js): drzewa i owoce, krzaki, kamienie, ruda, pieńki, kłody - uderzenia, łup, upadek i rozbicie.js. | Rzeczy do zbierania (część ChoppableTree). | ZOSTAJE |
| ChoppableTree_Swing | Zamachy bohatera (część ChoppableTree.js): arkusze Hero_* (HeroLook.js), narzędzie bez arkusza, trzymane O.js. | Zamachy bohatera (część ChoppableTree). | ZOSTAJE |
| ChoppableTree_Render | Wygląd rzeczy do zbierania (część ChoppableTree.js): kołysanie drzew, odrzut, upadek, spalone drzewo i żar, błysk trafienia, odłamki i kamienie.js. | Rysowanie zbieractwa (część ChoppableTree). | ZOSTAJE |
| Farming_Data | Dane: uprawy (CROPS), budowle z recepturami (BUILDINGS) i receptury bez budynku (HAND_RECIPES) dla Farming.js. | Tabele upraw, budowli, receptur. Dodać destylarkę, beczki na deszczówkę, kubki, sól; zmiany po stronie danych, nie map. [kod: 100] | DOPASOWAĆ |
| Farming | Uprawa i budowanie: ziemia po kłodach, pieńkach i kamieniach -> grabie -> motyka -> nasiona -> wzrost -> zbiór, plus budowa płotu, ławki, ogniska, kurnika, ula, skrzyń, pieca ziemnego,... | Uprawa i budowanie. HUT_MAP=100 (wnętrze chatki 5x2) i Przystań 125 (ryby morskie śledź/dorsz). Chatka gracza: zdecydować, czy zostaje. [kod: 100, 125] | DOPASOWAĆ |
| Farming_Plots | Ziemia i uprawy (część Farming.js): które kratki są ziemią, pola, zbieractwo, woda, wiadra i garnki na deszczówkę, wzrost roślin, grabienie, orka, siew, zbiór, podlewanie, kopanie, glina... | Ziemia, pola, woda, wiadra, glina; wzmianka 125 (łowienie morskie). Tu dopisać zasady wody z PLAN §2. [kod: 125] | DOPASOWAĆ |
| Farming_Build | Budowanie (część Farming.js): gdzie wolno stawiać, plac budowy i młotek, rzeczy stawiane od razu, rozbudowa, rozbiórka, zbiory z budynków, pułapki, chatka, stawianie z podejściem na... | Gdzie wolno stawiać: WALLED_FIELD_MAP=3 (działka dziadka z płotem) i region 9. Zmienić na nową mapę Podgrodzia (większa działka). [kod: 3] | DOPASOWAĆ |
| Farming_Stations | Stanowiska i skrzynie (część Farming.js): praca w tle i kolejka, ogień i paliwo, przepisy, pieczenie przy ognisku, praca ręczna, skrzynie i ich ekran.js. | Stanowiska, ogień, paliwo, skrzynie; destylarka to nowe stanowisko w danych. | ZOSTAJE |
| Farming_UI | Menu gospodarstwa (część Farming.js): co przycisk akcji proponuje na kratce, menu budowy (Q) i jedzenia (E), okno listy z tytułem i dymkiem opisu.js. | Menu budowy (Q) i jedzenia (E); bez map. | ZOSTAJE |
| Farming_Render | Rysowanie dla Farming.js: tekstury ziemi i płotu, warstwa upraw i zbieractwa, widmo stawianego budynku, poświata ogniska, warstwa nocy i sprite'y budynków. | Rysowanie ziemi, płotu, ognisk, sprite'ów budynków; bez numerów map. | ZOSTAJE |
| Hunting | Polowanie: zające i jelenie płoszą się przed graczem, dzik szarżuje. Proca (kamienie), łuk (strzały) albo oszczep z bliska - klawisz F. | Polowanie i dzikie zwierzęta. Parametr maps = tabela zwierząt na starych mapach 3-18, NEW_START_MAPS 20-23, BEAR_SPAWN dla 3,4,5,6,12,17,18,21,23. Zastąpić tagami <Hunt> i <Bear> w nowych mapach (Góry, las Lorda). [kod: 1, 3, 4, 12, 17, 18, 21, 23] | DOPASOWAĆ |
| Hunting_Path | Droga w 8 kierunkach (część Hunting.js): zwierzęta i pies obchodzą drzewa, krzaki, budynki i ściany, nie utykają.js. | Droga 8-kierunkowa zwierząt i psa; bez map. | ZOSTAJE |
| Hunting_AI | Dzikie zwierzęta (część Hunting.js): zając, jeleń, dzik i wilki - pasienie, ucieczka, przynęta w pułapce, szarża dzika, wataha wilków.js. | Zając, jeleń, dzik, wilki; bez map. | ZOSTAJE |
| Hunting_Weapons | Broń i łup (część Hunting.js): proca, łuk, celowanie, oszczep, pociski, trafienie i zabicie, zwłoki i oprawianie nożem.js. | Proca, łuk, oszczep, oprawianie; jedna wzmianka o Map003 w komentarzu. | ZOSTAJE |
| Birds | Ptaki: wrony, wróble, gołębie i kuropatwy przelatują, siadają na ziemi i dziobią, a w dzień naloty wyjadają zasiane pola. Można je upolować z procy. | Ptaki i naloty na pola; stan wg mapId, bez twardych numerów. | ZOSTAJE |
| Motyle_Data | Dane motyli i ciem: gatunki, mapy, kafelki kwiatów, zapylanie, siatka, gablotka, zadanie K54 „Motyl z oczkami”. | Gatunki motyli, mapy i kafle kwiatów, K54. Wpisać nowe mapy łąk. | DOPASOWAĆ |
| Motyle | Motyle za dnia i ćmy nocą przy ogniu, siatka na motyle, gablotka w Dzienniku, zapylanie, bielinki na kapuście, K54. | Silnik motyli i ciem; mapy siedzą w _Data. | ZOSTAJE |
| Forestry | Leśnictwo: sosny sadzone z nasion (z szyszek) rosną przez kilka dni w prawdziwe drzewa, które ścinasz jak każde inne. | Sosny z szyszek; bez map. (Las należy do Lorda - kara za ścinanie to nowa reguła, nie ta wtyczka.) | ZOSTAJE |
| Livestock | Zwierzęta na wybiegach: krowy w oborze, owce w owczarni i kury w kurniku chodzą za płotem, a na noc chowają się w szopie. | Zwierzęta na wybiegach; bez map. | ZOSTAJE |
| Dog | Pies: dziki pies z lasu, oswojony mięsem, zbiera, poluje i znosi wszystko na składowisko, nocą śpi w budzie. | Pies; HOME_MAP=3 (Kruczy Jar: dziki pies wychodzi tylko tam). Zmienić na Podgrodzie. [kod: 3] | DOPASOWAĆ |
| Zasoby_Data | [paczka A] Dane: Woda i zasoby - źródełka, zagroda sąsiada ze studnią deszczową, dzikie ule, kręgi grzybów, Babka Jagna i jej zioła, ogródki, wysypisko i glinianka, kamieniołom bloków i... | Paczka A - dane: źródełka, studnia deszczowa sąsiada, ule, grzyby, Babka Jagna, kamieniołom, kraby i drewno z morza (mapy 3,4,8,13,17,111,125,155,168). Przepisać na Wybrzeże i Góry; pasuje do planu (drewno z morza, kraby, sól, kamieniołom). [kod: 3, 4, 8, 13, 17, 23, 111, 125, 155, 168] | DOPASOWAĆ |
| Lowy_Data | [paczka B] Dane: Zwierzęta i łowy - wilcza nora, gawra, błotnisko dzików, lizawka, stałe obozy, zwierzyniec Lorda z gajowym, zbłąkane zwierzęta, strzelnica. | Paczka B - dane: wilcza nora, gawra, błotnisko, lizawka, zwierzyniec Lorda z gajowym (mapy 4,13,21,23,24,162,168). Zwierzyniec do Posiadłości, nora do Gór. [kod: 3, 4, 13, 21, 23, 24, 162, 168] | DOPASOWAĆ |
| Homes | Ziemia: działka dziadka po stracie (ludzie Lorda, znak, dni na wyniesienie dobytku, straż), Chata pod lasem u sołtysa i Spalona zagroda Ługów do odbudowy (zadanie D21). | Utrata działki po długu (ludzie Lorda, znak, wyniesienie dobytku) oraz zakup Chaty pod lasem (154) i Spalonej zagrody (168/169). Scena utraty pola pasuje do działki w Podgrodziu (FIELD=3, EDGE/PODGRODZIE=111, MEADOW=4); zakupy chat i zagrody wyrzucić lub dać nowym lokacjom. Id 700-729. [kod: 3, 4, 23, 100, 111, 154, 168, 169] | DOPASOWAĆ |
| Zasoby | [paczka A] Woda i zasoby: źródełka, zagroda sąsiada ze studnią deszczową, dzikie ule, kręgi grzybów, Babka Jagna i jej zioła, ogródki, wysypisko i glinianka, kamieniołom bloków i żyły... | Silnik paczki A (id 2100-2299); komórki pola FIELD_CELLS i mapy 3,8,13,17,111,125,155,162,168 w kodzie. Wybrać, co zostaje (sól, kraby, kamieniołom, zioła). [kod: 3, 8, 13, 17, 111, 125, 155, 162, 168] | DOPASOWAĆ |
| Lowy | [paczka B] Zwierzęta i łowy: wilcza nora, gawra, błotnisko dzików, lizawka, stałe obozy, zwierzyniec Lorda z gajowym, zbłąkane zwierzęta, strzelnica. | Silnik paczki B (id 2300-2499); mapy 4,13,21,23,24,162,168. [kod: 4, 13, 21, 23, 24, 162, 168] | DOPASOWAĆ |

## Walka (17)

| Wtyczka | Co robi | Zależności ze starego świata / co zmienić | Decyzja |
|---|---|---|---|
| Combat | Walka i rozwój postaci: oddech, kombo i ciężki cios (F), przewrót (Spacja), blok i parowanie (V), zmiana broni (X); atrybuty, poziomy, doświadczenie, umiejętności. | Walka i rozwój. PLACE_LEVELS z parametru levels (mapy 3-18) - zastąpić tagiem <Poziom> w nowych mapach; wzmianki o Map100 w wyjątkach. [kod: 100] | DOPASOWAĆ |
| Combat_Fight | Walka (część Combat.js): oddech i bieg, broń w ręku, ciosy i kombo, ciężki cios, przewrót, blok i parowanie, ciosy wrogów w bohatera.js. | Walka wręcz (część Combat); bez map. | ZOSTAJE |
| Combat_UI | Wygląd walki (część Combat.js): liczby i iskry, paski wrogów, oddech pod stopami, plakietka broni, pasek doświadczenia, napisy trybu i poziomu.js. | Liczby, paski wrogów, plakietka broni; bez map. | ZOSTAJE |
| Combat_Feel | Walka (część Combat.js): automatyczny tryb walki, miękkie namierzanie (F), zapowiedzi ataków, idealne parowanie, strzałki przy krawędzi ekranu, szybkie leczenie (H), manekin treningowy,... | Auto tryb walki, namierzanie, parowanie, manekin treningowy; tag <AutoWalka>; bez map. | ZOSTAJE |
| HeroLook | Postać bohatera (wieśniak w szarej tunice, boso): płynne chodzenie, bieg i skradanie w 8 kierunkach oraz animacje pracy i walki (16 klatek). | Wygląd i animacje bohatera; bez map. | ZOSTAJE |
| Orzel_Data | Dane białego orła: etapy wzrostu, opieka, walka, lot, arkusze, teksty, zadania D29 „Jajo z grani” i W13 „Skrzydlata Straż”. | Biały orzeł: jajo z Orlej Grani (Map175), Map013, kopalnia 213, D29/W13. Kieszeń Orla Grań idzie do archiwum; towarzysz może wrócić później w Górach. [kod: 13, 175, 213] | ARCHIWUM |
| Humans_Data | Dane ludzi-wrogów (etap 3 walki): bandyta, łucznik, najemnik - życie, atrybuty, ciosy, łup; nocne obozy; okrzyki.js. | Bandyci, łucznicy, najemnicy i nocne obozy; tabela obozów po starych mapach (2,3,4,12,17,18,21,22,23,25). Nowe obozy w lesie Lorda i Górach. [kod: 2, 3, 4, 12, 17, 18, 21, 22, 23, 25] | DOPASOWAĆ |
| Humans | Ludzie-wrogowie (etap 3 walki): bandyta, łucznik, najemnik z tarczą, nocne obozy, poddawanie się (oszczędź / obrabuj / dobij). Bandyci nie zabijają - pobity bohater zostaje obrabowany. | Silnik wrogów-ludzi (poddawanie się, obrabowanie); w kodzie mapy 21 i 23 (Leśna droga, Skraj lasu). Tagi <Humans>/<Camp> w nowych mapach. [kod: 21, 23] | DOPASOWAĆ |
| Equipment | Ekwipunek: części ciała (głowa, tors, płaszcz, ręce...), działa tylko to, co założone; zapis w grze. | Ekwipunek (części ciała); bez map. | ZOSTAJE |
| Ubior_Data | Ubiór - dane: wzory (rampy kolorów, nakładki), przedmioty 250-299 i stare 113/114/171, ceny, bonusy, sklepy, farbowanie, naprawa. | Dane ubioru (przedmioty 250-299). Bez map. | ZOSTAJE |
| Bron_Data | Broń, zbroje, tarcze, dodatki - dane: materiały, rodzaje broni, przedmioty 300-406 i stare bronie, ceny, sklepy, przepisy, łupy, unikaty. | Dane ~100 przedmiotów bojowych; bez map. | ZOSTAJE |
| Ubior | Ubiór na bohaterze: wszystko, co założone (głowa, tors, nogi, stopy, pas, rękawice, plecy), widać na postaci we wszystkich arkuszach, na karcie postaci i na popiersiu. | Ubiór widoczny na bohaterze; bez map. | ZOSTAJE |
| Ubior_Bron | Ubiór - broń i tarcze na bohaterze: nowe rodzaje broni na zamachach (miecz, topór, młot, włócznia...), materiały broni, tarcza w gardzie. | Broń i tarcze na bohaterze; bez map. | ZOSTAJE |
| Starcia | Starcia: wilki napadają ludzi i obozy, ludzie odpędzają je ogniem, dzik taranuje każdego na swojej linii, niedźwiedź atakuje każdego, kto podejdzie, łucznicy przy obozie polują, mięso na... | Wilki vs ludzie, dzik, niedźwiedź; tagi <Camp> i <Ambush>; bez numerów map. | ZOSTAJE |
| Orzel | Biały orzeł: jajo z Orlej Grani, pięć etapów wzrostu, opieka, gniazdo, walka szponami i dziobem, zadania D29 i W13. | Silnik orła (127 KB); związany z Orlą Granią (175) i Map013. Do archiwum razem z Orzel_Data. [kod: 13, 175] | ARCHIWUM |
| Ubior_Sklepy | Ubiór - handel i działanie: sklepy szwaczki, garbarza, przekupki i szmaciarza w rozmowach (okno sklepu), sprzedaż, naprawa, farbowanie, bonusy ubrań, zużycie. | Sklepy szwaczki, garbarza, przekupki i szmaciarza po NPC z rozmów - przepiąć na nowych mieszkańców (MIESZKANCY.md). | DOPASOWAĆ |
| Bron | Broń, zbroje, tarcze, dodatki - działanie: sklepy (kowal, kwatermistrz, kantor, garbarz, szwaczka, szmaciarz), kuźnia, łupy, unikaty, bonusy, zużycie, łuki. | Sklepy (kowal, kwatermistrz, kantor, garbarz, szwaczka, szmaciarz), kuźnia. Kwatermistrz to Garnizon (archiwum). Przepiąć na nowych kupców, kowal Tadek zostaje. | DOPASOWAĆ |

## Stwory i podziemia (11)

| Wtyczka | Co robi | Zależności ze starego świata / co zmienić | Decyzja |
|---|---|---|---|
| Morze_Data | [W23] Dane „Coś z głębin”: utopieni żołnierze z morza (szkielety z pałką, mieczem, włócznią i młotem, kraby, kolos, kapitan), szansa nocy, tabela rodzajów i wątek W23 w siedmiu rozdziałach. | W23 Coś z głębin: tabela rodzajów, szansa nocy, 7 rozdziałów (mapy 8, 125). PLAN: potwory z morza na Wybrzeże. [kod: 8, 125] | DOPASOWAĆ |
| Underground_Gen | Generator pięter podziemi (część Underground.js): liczby losowe z ziarna zapisu, biblioteki kawałków pokoi, składanie piętra, labirynt, kontrola mapy - czyste funkcje, bez gry. | Generator pięter (czyste funkcje): labirynt, biblioteki kawałków (Map130, 141-144 w edytorze). Zostaje. [kod: 1, 2, 3, 100, 130, 141] | ZOSTAJE |
| Underground_Data | Dane podziemi (Underground.js): mapy, przełączniki, pasma pięter, łupy i teksty (po polsku).js. | Mapy podziemi: 9 (piwnica), 10 (ruiny), 11 (Komnata Serca), 130-153, 140 (10. piętro), 19, 24; pasma pięter, łupy, teksty. Przepiąć wejście na piwnicę nowej tawerny, zdecydować o liczbie pięter. [kod: 1, 3, 8, 9, 10, 11, 19, 24, 140, 145, 146, 147, 148, 149 +4] | DOPASOWAĆ |
| Underground | Podziemia pod tawerną: piętra 1-9 składane z kawałków pokoi (stałe ziarno zapisu), co 10. piętro ręcznie, schody, pochodnie, łupy, pułapki, zapiski zakonu, winda, zejście zamknięte do... | Podziemia pod tawerną (Głębie); wejście z piwnicy 9, ruiny 10, Serce 11, kawałki 130/141. Wejście = nowa piwnica tawerny, Serce = Góry (PLAN). Zejście zamknięte do Aktu II. [kod: 9, 10, 11, 130, 140, 141, 145, 146] | DOPASOWAĆ |
| Creatures_Data | Dane stworów z ruin (etap 4 walki): szczury, pająki, puste zbroje, nietoperze, topielce, kamienniki, upiory, cienie, bossowie pięter - życie, atrybuty, ciosy, łup, „prawdy”.js. | Stwory ruin (szczury, pająki, puste zbroje, bossowie pięter 20-90); Map140 (10. piętro). Zostają jako stwory Głębi, bossów przeliczyć na nową liczbę pięter. [kod: 140] | DOPASOWAĆ |
| Creatures | Stwory z ruin (etap 4 walki): szczury, pająki, puste zbroje, nietoperze, topielce, kamienniki, upiory prawdy, cienie z twarzą mieszkańca; bossowie pięter 20-90 i strażnik dziesiątej... | Silnik stworów ruin; w kodzie Map140 (strażnik 10. bramy). Zależne od decyzji o 100 piętrach. [kod: 140] | DOPASOWAĆ |
| Rywal_Data | [W9 rozdz. 3] Dane „Rywal w ruinach”: kto schodzi po Serce przed bohaterem (Grum, ludzie Lorda, ludzie Baltazara, kopacze Czarnych Oczu), ślady na piętrach 1-10, spotkanie. | W9: rywal schodzący po Serce przed bohaterem; ślady na piętrach 1-10, mapy 10/11/140. Pasuje do Głębi. [kod: 10, 11, 140] | DOPASOWAĆ |
| Rywal | [W9 rozdz. 3] „Rywal w ruinach”: ktoś z zewnątrz schodzi po Serce przed bohaterem - ślady na piętrach 1-10, pułapki, puste skrzynie, wyrwane zapiski, spotkanie (rozmowa albo walka),... | Silnik W9; Map011 (Komnata Serca) i piętra. [kod: 11] | DOPASOWAĆ |
| Morze_Potwory | [W23] Potwory z morza: szkielety (pałka, miecz, włócznia, młot, kapitan z chorągwią), kraby i krab-kolos, duże macki krakena, ślady i kości, odwrót do wody o świcie, straż w mieście. | Szkielety, kraby, krab-kolos, macki; jedno odwołanie do Map008. Zostają jako stwory. [kod: 8] | DOPASOWAĆ |
| Morze | [W23] Potwory z morza - silnik: szansa nocy, losowanie z ziarna, lądowanie utopionych żołnierzy (szkielety, kraby), świt, ślady, miasto, macki, wątek W23 „Coś z głębin”, wiersze F9. | Silnik W23 (lądowanie utopionych); Map008 i Przystań 125 (straż w mieście, ślady). Zamienić na Wybrzeże i Miasteczko. [kod: 8, 125] | DOPASOWAĆ |
| Kopalnia | Kopalnia pod Orlą Granią: wagoniki po torach (jazda bezpłatna, zwrotnica z dźwignią, ślepa odnoga z rudą), Esc hamuje na stacji. | Wagoniki po torach pod Orlą Granią (Map213, 175, 13). Pasuje do kopalni w Górach (drugie podziemie): nowa mapa i tory. [kod: 13, 175, 213] | DOPASOWAĆ |

## Tawerna (22)

| Wtyczka | Co robi | Zależności ze starego świata / co zmienić | Decyzja |
|---|---|---|---|
| TavernShift | Praca w tawernie „Pod Złotym Kuflem”: zmiana jako mini-gra w czterech częściach (sprzątanie i drewno, nalewanie piwa, kuchnia w rytm, obsługa sali). | Praca w tawernie (mini-gra 4 części); wejście z Map001. Przypiąć do nowej tawerny. [kod: 1] | DOPASOWAĆ |
| TavernShift_Hall | Sala tawerny dla zmiany (TavernShift.js): kafle tawerny, postacie, efekty, sala ze stołami, barem i kominkiem, beczka i kufel. | Sala tawerny dla zmiany; Map001 (2 odwołania), kafle starej sali. Przerysować pod nowe wnętrze. [kod: 1] | DOPASOWAĆ |
| TavernShift_Parts | Cztery części zmiany w tawernie (TavernShift.js): sprzątanie i drewno, nalewanie piwa, kuchnia w rytm, obsługa sali. | Cztery części zmiany: sprzątanie, piwo, kuchnia, obsługa. Bez map. | ZOSTAJE |
| QuestBoard_Data | Dane tablicy zleceń (QuestBoard.js): wzory ogłoszeń, zleceniodawcy, zwierzęta i listy gończe, wartość towarów, słowa Borgara. | Dane tablicy zleceń: zleceniodawcy i miejsca (mapy 4,21,22,23). Nowe miejsca = 5 map. [kod: 4, 21, 22, 23] | DOPASOWAĆ |
| QuestBoard | Tablica zleceń w tawernie „Pod Złotym Kuflem”: prawdziwe zlecenia od ludzi z okolicy (dostawy, wyroby, zbieractwo, polowania, POSZUKIWANY), sława w tawernie, zapłata w złocie i... | Tablica zleceń w tawernie; zdarzenie na Map001. Cele zleceń odwołują się do starych map. | DOPASOWAĆ |
| QuestBoard_Art | Rysunki tablicy zleceń (QuestBoard.js): kartki na pergaminie, pinezki i pieczęcie, pieczątki, wstążka PILNE, zwierzęta tuszem, duża kartka ze szczegółami. | Rysunki kartek; bez map. | ZOSTAJE |
| QuestBoard_Scene | Scena tablicy zleceń (QuestBoard.js): tablica z kartkami, szczegóły, łupek ze sławą, klawisze i mysz, przyjmowanie i oddawanie zleceń z animacją, pierwsze słowa Borgara. | Scena tablicy; bez map. | ZOSTAJE |
| TavernDice_Data | Dane gry w kości (TavernDice.js): kości specjalne, rywale (godziny, stawki, sposób gry, wszystko, co mówią), słowa bohatera. | Dane gry w kości; bez map. | ZOSTAJE |
| TavernDice | Gra w kości o pieniądze przy stole w sali gier tawerny „Pod Złotym Kuflem”: sześć kości, odkładanie, pudła, gorące kości, rywale z charakterem, pula na stole i kości specjalne. | Gra w kości przy stole; stół to zdarzenie w tawernie (przypiąć do nowej mapy). | ZOSTAJE |
| TavernDice_Art | Rysunki gry w kości (TavernDice.js): kości, kubek, monety, stół z suknem, świece, dymki, pasek i panele stołu (lobby, zasady, koniec partii). | Rysunki kości; bez map. | ZOSTAJE |
| TavernDice_Scene | Scena stołu do kości (TavernDice.js): lobby, partia (kubek, rzuty, odkładanie, pudła, gorące kości, rywal i jego gadanie), odejście od stołu, koniec partii. | Scena kości; bez map. | ZOSTAJE |
| TavernLife | Życie w tawernie „Pod Złotym Kuflem”: posiłki u Borgara, pokoje na noc, łaźnia, pieśni Melii, siłowanie na rękę z Grumem i rzutki. | Posiłki, pokoje na noc, łaźnia, siłowanie, rzutki. roomMaps=25,26 (Pokoje gości, Apartamenty), 19 odwołań do Borgara i Złotego Kufla. Karczmarz jest teraz bezimiennym przyjacielem dziadka; ceny i nazwy do podmiany, pokoje - nowe piętra. | DOPASOWAĆ |
| TavernLife_Render | Rysunki życia w tawernie (część TavernLife.js): karta dań i pokoi, talerze, para, nuty, świece w pokojach, monety, kąpiel, znaczki premii w HUD. | Rysunki życia tawerny; bez map. | ZOSTAJE |
| TavernLife_ArmWrestle | Siłowanie na rękę z Grumem (część TavernLife.js): rozmowa o stawkę, mini-gra ze wskazówką siły, wynik. Stawki ustawiasz w TavernLife. | Siłowanie z Grumem; bez map. | ZOSTAJE |
| TavernLife_Darts | Rzutki z Dziadkiem Ozzym albo z furmanem Wieśkiem (część TavernLife.js): rozmowa, mini-gra z chwiejnym celownikiem, punkty. Stawki ustawiasz w TavernLife. | Rzutki z Ozzym lub furmanem; bez map. | ZOSTAJE |
| TavernLife_Plan | Plan karczmy (część TavernLife.js): sztalugi z planem w sieni i przy schodach, scena planu trzech pięter z usługami, „Tu jesteś” i drogą. | Plan karczmy: sztalugi na Map001, 25, 26 (PLAN_BOARDS, floors po numerach map). Przerysować plan pięter nowej tawerny. [kod: 1, 25, 26] | DOPASOWAĆ |
| TavernLife_Regulars | Stali bywalcy tawerny (część TavernLife.js): Melia, Dziadek Ozzy i Grum jako rozmówcy - powitania, co słychać, plotki, własne tematy, zaufanie. | Melia, Ozzy, Grum jako rozmówcy; Map001. Postaci zostają (MIESZKANCY.md: „jest”), kotwice do nowej tawerny. [kod: 1] | DOPASOWAĆ |
| Przytulna | Próba „Przytulna sala”: sala tawerny jak z makiety - światło od ognia, iskry, kufle gości, grajek z lutnią i Borgar przy ladzie. Domyślnie wyłączona. | Próba sali tawerny jak z makiety, domyślnie wyłączona; na sztywno Map001 (6 odwołań). Nowa tawerna ma własne wnętrze. [kod: 1] | ARCHIWUM |
| Goscie_Data | [tawerna] Dane wątku „goscie”: zadania stałych gości - Melia, Ozzy, Grum (K22, K33, D13, D6). | Zadania stałych gości (K22,K33,D13,D6). Rozmowy zostają, miejsca zmienić. | DOPASOWAĆ |
| Goscie_Sala | Goście w sali tawerny: wieczorem przychodzą, siadają na krzesłach, jedzą, piją, chodzą po sali, można z każdym porozmawiać. Działa razem z „Przytulną salą”. | Goście na krzesłach; MAP=1, id 400-422 (23 miejsca przy okrągłych krzesłach starej sali). Nowe krzesła i stoły. [kod: 1] | DOPASOWAĆ |
| Act3_Data | Dane Aktu III (napad frakcji na tawernę): kiedy, ostrzeżenia, dzwon, fale, obrońcy, wyniki, teksty.js. | Dane Aktu III (napad na tawernę): mapy 1, 8, 9. PLAN §5: „do przejrzenia” (oblężenie tawerny). [kod: 1, 8, 9] | DOPASOWAĆ |
| Act3 | Akt III: frakcja uderza na tawernę - ostrzeżenia, alarm dzwonu (3 + 1), fale ludzi frakcji pod drzwiami i w środku, obrońcy według twoich wyborów, wynik: obroniona / drogo / padła. | Silnik napadu frakcji na tawernę (fale, dzwon, obrońcy). Mapy 1 i 8; wymaga nowej tawerny i rynku. [kod: 1, 8] | DOPASOWAĆ |

## Miasto i mieszkańcy (22)

| Wtyczka | Co robi | Zależności ze starego świata / co zmienić | Decyzja |
|---|---|---|---|
| HomeAmbience | Dom dziadka żyje: migoczący ogień z iskrami i parą, kurz w smugach słońca, widok za oknami, ciepły nastrój, dźwięki. | Dom dziadka żyje (ogień, kurz, widok z okien). Parametr maps=19 (stare wnętrze). Podmienić na nowe wnętrze w Podgrodziu. | DOPASOWAĆ |
| HomeDecor | Dom dziadka zmienia się z historią i porami roku: pamiątki bohatera (pokwitowanie od Lorda, trofea, kufel, kości, ogłoszenie), ozdoby na każdą porę roku, Wigilia, wycinanki, ręcznik,... | Dekoracje domu dziadka wg historii i pór roku. Parametr mapId=19, id 980-998. Nowe wnętrze i nowe pamiątki. [kod: 19] | DOPASOWAĆ |
| HomeLife | Życie w domu dziadka: dzień dziadka Stacha (kocioł, maselnica, kołowrotek, fotel bujany, fajka, łóżko), kot Mruczek i codzienny kapuśniak z kotła. | Dzień dziadka Stacha, kot Mruczek, kapuśniak. MAP=19, id 960-979. Przepiąć na nowy dom. [kod: 19] | DOPASOWAĆ |
| TownLife_Data | Dane mieszkańców miasteczka: plany dnia, okrzyki, rozmowy (dla TownLife.js). | Plany dnia mieszkańców (id 910-949, 2900-2959, 3020-3049, 4600-4609): mapy 8 (8x), 111 (18x), 125, 23, 24, 1, 128, 181, 201. Całe dane od nowa pod MIESZKANCY.md (ok. 50 postaci, część „jest” - arkusze zostają). [kod: 1, 8, 23, 24, 111, 125, 128, 181, 201] | DOPASOWAĆ |
| Podroznicy_Data | Podróżni z promu - dane: obsada (okna przybycia, pobyt, pokoje), pula losowa, pokoje 4-24, plany dnia, Renoma, scena przybycia; mieszkańcy TownLife 3020-3049. | Podróżni z promu - dane: obsada, pokoje 4-24, plany dnia (mapy 1,8,13,25,108,125,155,157,162). PLAN: wracają jako rozbitkowie i statki; pokoje w nowej tawernie. [kod: 1, 8, 13, 25, 108, 125, 155, 157, 162] | DOPASOWAĆ |
| Podroznicy5_Data | [etap 5] Dane spraw podróżnych: D44 „Podatek wojenny” (Erazm), D47 „Wolna Kompania” (I7), D48 „Mapa Wyspy Kruka” (Teofil, wizyta 2). | Sprawy D44, D47, D48 (mapa Wyspy Kruka); mapa 8. [kod: 8] | DOPASOWAĆ |
| Historyjki_Data | [etap 7] Dane historyjek podróżnych: H1 Olszynka, H2 Pod Brzozową Wolą, H3 Biblioteka w Lipnicy, H5 Pieczęć (plansze, ujęcia, wyzwalacze). | Historyjki podróżnych (plansze); bez map. | ZOSTAJE |
| Intrygi_Data | Podróżni z promu - etap 3, dane intryg: D45 „Gość spod trójki”, D46 „Skradziona szkatułka”, K73 „Nocne kroki”, drzwi zajętych pokoi, przeszukanie, nocne kroki, listy pod drzwiami. | Intrygi gości (D45,D46,K73): pokoje 25/26. [kod: 25, 26] | DOPASOWAĆ |
| Rynek_Data | [miasteczko] Dane wątku „rynek”: zadania rzemieślników i targu z kodem (K1, K5, K9, K13, K14, D16, K15, K16, K17, K20, D3). | Wątek „rynek” (K1,K5,K9,K13-17,K20,D16,D3): rzemieślnicy i targ; pasuje do rynku Miasteczka. Zmienić miejsca. | DOPASOWAĆ |
| Straz_Data | [miasteczko] Dane wątku „straz”: zadania straży i sołtysa z kodem, kradzież Feliksa, kości Bartka (K38, D11, D14, D17, K37, K39). | Wątek „straż”: straż i sołtys, kradzież Feliksa, kości Bartka (K38,D11,D14,D17,K37,K39). | DOPASOWAĆ |
| Oboz_Data | [miasteczko] Dane wątku „oboz”: zadania obozu uchodźców z kodem - rozdz. 1-2 W6 (K19, K27, K28, K29, D4, D10, D18). | Wątek „obóz”: uchodźcy W6 rozdz. 1-2 (K19,K27-29,D4,D10,D18); pasują do rozbitków z wraku (PLAN §3). Obóz przenieść na Wybrzeże lub do Podgrodzia. | DOPASOWAĆ |
| TownLife | Miasteczko żyje według zegara: mieszkańcy chodzą, pracują, wchodzą do domów i tawerny, wołają, rozmawiają; dzwon wybija godziny. | Silnik życia miasta (chodzą, wchodzą do domów, dzwon); MAP z danych (Map008) i drzwi domów. Silnik zostaje, domy i trasy per mapa w danych. [kod: 1, 8, 103, 111] | DOPASOWAĆ |
| TownQuests_Data | Dane questów miasteczka: zadania, rozmowy, nagrody, Opinia w miasteczku, dzień targowy, kalendarz, sygnały dzwonu (dla TownQuests.js). | Dane questów miasteczka (zadania K, dzień targowy, Opinia): mapy 3,4,8,13,14,19,20,22,24,25,108,111,118-120,125. Przejrzeć zadania pod nowe miejsca (QUESTY.md). [kod: 3, 4, 8, 13, 14, 19, 20, 22, 24, 25, 108, 111, 118, 119 +2] | DOPASOWAĆ |
| TownQuests | Questy miasteczka: zadania od mieszkańców (oferta, kroki, nagrody), Opinia w miasteczku, dzień targowy, kalendarz, sygnały dzwonu, mini-gra dzwonu, zakładka „Miasteczko” w dzienniku. | Silnik questów miasteczka (311 KB, 49 odwołań do Kruczogrodu i Borgara): SPOT_MAPS i PROP_MAPS po starych mapach, W6 Marek FIELD=3 PODGRODZIE=111. Największy silnik do dopasowania. [kod: 1, 3, 8, 9, 13, 14, 22, 24, 25, 119, 120] | DOPASOWAĆ |
| Podroznicy | Podróżni z promu - silnik: planowanie promu, księga pokoi, Renoma karczmy, plany dnia, odpływy i powroty, scena przybycia na przystani, rozmowy, F9. | Silnik podróżnych (przybycie na przystani, księga pokoi, Renoma). Scena przybycia na Wybrzeżu zamiast Przystani 125. [kod: 1, 8, 25, 125] | DOPASOWAĆ |
| Podroznicy_Sprawy | Podróżni z promu - etap 2: sprawy pierwszej szóstki (K71, K72, D39-D43), podsłuch przez ścianę (I2), Antek i Zenon w garnizonie. | Sprawy pierwszej szóstki (K71,K72,D39-D43); 2 odwołania do garnizonu (162). [kod: 162] | DOPASOWAĆ |
| Intrygi | Podróżni z promu - etap 3, silnik intryg: zamknięte drzwi zajętych pokoi, przeszukanie, nocne kroki ze świecą, listy pod drzwiami, D45 „Gość spod trójki”, D46 „Skradziona szkatułka”, K73. | Silnik intryg: zamknięte drzwi pokoi, nocne kroki; mapy 1,25,26,125. [kod: 1, 25, 26, 125] | DOPASOWAĆ |
| Podroznicy5 | [etap 5] Sprawy podróżnych - silnik: D44 „Podatek wojenny” (noc u poborcy, raport), D47 „Wolna Kompania” (burdy, siłowanie, kości, bójka, Wit, najęcie, Grum), D48 „Mapa Wyspy Kruka”,... | Silnik D44/D47/D48; Map008. [kod: 8] | DOPASOWAĆ |
| Historyjki | [etap 7] Historyjki podróżnych: odtwarzacz (plansze z ruchem kamery, mgła, deszcz, iskry, napisy kroniki) i zakładka Dziennika „Wspomnienia”. | Odtwarzacz historyjek i zakładka Wspomnienia; bez map. | ZOSTAJE |
| Stajnia | Stajnia zajazdu w Kruczogrodzie: rozmowa Szczepana Kołodzieja (list od dziadka), stryszek z sianem (nocleg), zasady zmiany w stajni, zaufanie i darmowy wóz. | Stajnia zajazdu (Map181), Szczepan Kołodziej, darmowy wóz; w nowych 5 mapach nie ma stajni. [kod: 181] | ARCHIWUM |
| Stajnia_Zmiana | Zmiana w stajni (Stajnia.js): mini-gra w czterech częściach - obrządek, karmienie i pojenie, gnój i słoma, konie podróżnych. | Mini-gra zmiany w stajni (97 KB); razem ze Stajnią. Mechanika może wrócić, gdy powstanie stajnia. | ARCHIWUM |
| Konie | Konie na wybiegu stajni w Kruczogrodzie (Map008) i wodopój: chodzą, skubią trawę, piją, na noc idą do stajni. | Konie na wybiegu stajni Map008 (id 3260-3279, kafle wodopoju). [kod: 8] | ARCHIWUM |

## Fabuła i wątki (44)

| Wtyczka | Co robi | Zależności ze starego świata / co zmienić | Decyzja |
|---|---|---|---|
| Journal | Dziennik: cele, księga rzemiosła (surowce, budynki, receptury), notatki i podsumowanie dnia. | Dziennik: 39 celów zależnych od stanu fabuły + księga rzemiosła; cele odwołują się do starych zadań (mapy 1, 125, 126). Przepisać cele pod nowy łańcuch. [kod: 1] | DOPASOWAĆ |
| Watki | Silnik wątków i zadań: wątek jako dane (rozdziały, warunki, akcje, rozmowy, skoki F9), teksty z plików js/teksty/*.txt czytane przy starcie gry, jeden budowniczy rozmów. | Silnik wątków i zadań (dane + teksty js/teksty/*.txt). Tylko 2 wzmianki o miejscach w kodzie; reszta w plikach _Data. | ZOSTAJE |
| Story | Fabuła nowej gry: dom dziadka, dług u Lorda (spłata do terminu), praca u Borgara, rozdział 1 w dzienniku. | Fabuła „nowej gry” (dług u Lorda 2500 w 60 dni, praca u Borgara, rozdział 1). MAP={dom 19, pole 3, tawerna 1, dwór 24, piwnica 9}, 15 odwołań do Borgara i Kruczogrodu, pozycje na sztywno. Przepisać na wątek z PLAN §3 (Akt I w Podgrodziu). [kod: 19, 23] | DOPASOWAĆ |
| Kantor_Data | [W5] Dane wątku „Towary z kontynentu”: Baltazar Vey, tylne drzwi kantoru, piwnica (mapa 171), obóz przemytników, noc promu. | W5 Towary z kontynentu: kantor 103, piwnica 171, obóz przemytników 23, prom 22. Kantor w Miasteczku, piwnica własna. [kod: 3, 4, 8, 22, 23, 103, 111, 125, 171] | DOPASOWAĆ |
| Dwor_Data | [W7] Dane wątku „Dwór z kamieni twierdzy” (wariant A: Lord nic nie wie, Feliks sprzedaje frakcji): hol, biblioteka, gabinet (mapy 172-174). | W7 Dwór: mapy 24 i 172-174. Nowa Posiadłość z dworem, wnętrza od nowa. [kod: 24] | DOPASOWAĆ |
| Ludzie_Data | [paczka C] Dane: Ludzie - Zbych Smolarz i mielerz, pasterz z owcami, wędrowny handlarz, patrole, obóz kopaczy (W8), jaskinia przemytników (W5, mapa 177), stare groby Ługów. | Paczka C: Zbych Smolarz, pasterz, handlarz, patrole, obóz kopaczy W8, jaskinia przemytników 177 (mapy 3,4,13,21,22,125,168,177...). Zbyt zależna od starych map; wybrane postacie mogą wrócić. [kod: 1, 3, 4, 13, 17, 18, 21, 22, 113, 125, 159, 162, 168, 177] | ARCHIWUM |
| Zakon_Data | [paczka D] Dane: Tajemnice i zakon - strażnice, kapliczki, kopce z Zapiskami strażnic, krąg menhirów i komora (mapa 176), miejsca tylko dla orła, orle grzędy, cmentarz z grabarzem i... | Paczka D - dane: strażnice, kapliczki, kopce z zapiskami, menhiry (Map176), gaj Milczących; mapy 3,4,8,13,17,18,21,22,23,120,125,146,155,157,162,165,168,175,176. Oś „zakon i Serce” zostaje: znaki zakonu przenieść do Posiadłości, Gór i lochów. [kod: 3, 4, 8, 13, 17, 18, 21, 22, 23, 120, 125, 146, 155, 157 +5] | DOPASOWAĆ |
| SwieteKosci_Data | [W15] Dane łańcucha „Święte kości”: Gaspar Lis (handlarz relikwii), brat Augustyn z Lipnicy, kurier Baltazara, skrzynka, kamień z krukiem, spis z Lipnicy. | W15 Święte kości: Gaspar Lis, brat Augustyn, kurier; piętro tawerny (25). [kod: 25] | DOPASOWAĆ |
| Dezerter_Data | [W16] Dane łańcucha „Dezerter”: Tomek (Tymon Wrzos), Szczerba - łowczyni nagród, rotmistrz Bełza, przemyt, kryjówki, noc pod pokojem 5. | W16 Dezerter: Tomek, Szczerba, rotmistrz Bełza, garnizon; mapa 8. [kod: 8] | ARCHIWUM |
| Jarmark_Data | [W17] Dane wątku „Jarmark Kruczogrodu”: dni 47-53, kramy, konkurs piwny, turniej w kości, sztuka na rynku, kradzież, śledztwo, pościg po dachach. | W17 Jarmark: rynek 8, sala tawerny 1; dni 47-53. [kod: 1, 8] | DOPASOWAĆ |
| Wesele_Data | [W18] Dane wątku „Wesele w Złotym Kuflu”: Wojciech i Dorota, przygotowania, plan stołów, ślub, bójka, noc poszukiwań, poranek. | W18 Wesele w Złotym Kuflu: sala tawerny Map001. [kod: 1] | DOPASOWAĆ |
| Poczta_Data | [W20] Dane wątku „Kruczy listonosz”: listy, Gawron, Wicek, Cyryl, kruczarnia (mapa 214), rozdziały, rozmowy, F9. | W20 Kruczy listonosz: kruczarnia 214, Map008; listy z kruków (6:30, 17:30). PLAN: pasuje wprost. [kod: 8, 214] | DOPASOWAĆ |
| Majster_Data | [W22] Dane wątku „Majstersztyk”: Cech (Map215), Ostap, Ludwik, Jaś, rangi, sztuki próbne, egzamin na rynku, F9. | W22 Majstersztyk: Cech Map215, rynek Map008. [kod: 8, 215] | DOPASOWAĆ |
| Mlyn_Data | [W19] Dane wątku „Sygnały z młyna”: Walenty i Jasiek (TownLife), cztery pozy skrzydeł, kod, wnętrze młyna (Map217), noc w zatoczce, F9. | W19 Sygnały z młyna: wnętrze Map217, noc w zatoczce, mapy 8 i 125. Młyn jest w planie (nowy młynarz = szpieg wojny). [kod: 1, 8, 119, 125, 217] | DOPASOWAĆ |
| Goraczka_Data | [W21] Dane wątku „Gorączka w przytułku”: chorzy, Wawrzyn, Stefa w mieście, rozdziały, rozmowy, F9. | W21 Gorączka w przytułku: przytułek 202/216, miasto 8. Znachorka jest w Podgrodziu. [kod: 8, 202, 216] | DOPASOWAĆ |
| Poselstwo_Data | [W14] Dane łańcucha „Poselstwo”: Albin (pątnik - zwiadowca), poseł Korony i gwardzista Ostap w Apartamencie Złotym, kolacja „w służbie”, narada, Noc Kupały, śledztwo, list. | W14 Poselstwo: Apartament Złoty i Wielki salon (mapy 25/26), Noc Kupały, molo. Mocno związane ze starą tawerną - do przejrzenia po nowej. [kod: 25, 26] | ARCHIWUM |
| W1_Data | [W1] Dane wątku na silniku wątków (Watki.js): zadanie W1, jego kroki i haki. | W1 (poszlaki, Kuba, ogród Lorda - Map024). Pasuje do Posiadłości, wymaga nowych miejsc (PLAN: „do przejrzenia”). | DOPASOWAĆ |
| W2_Data | [W2] Dane wątku na silniku wątków (Watki.js): zadanie W2, jego kroki i haki. | W2 (dzwonnik, uczeń, Archiwum zakonu Map119, Noc Pytania w Pustelni). Pustelnia i Archiwum idą do archiwum; wątek zakonu wróci w nowej formie. [kod: 119] | ARCHIWUM |
| W3_Data | [W3] Dane wątku na silniku wątków (Watki.js): zadanie W3, jego kroki i haki. | W3 (sen, zwrotki, pochodzenie; miód). Brak map w danych, ale postaci i miejsca z nazw - krótki przegląd. | DOPASOWAĆ |
| W6_Data | [W6] Dane wątku na silniku wątków (Watki.js): zadanie W6, jego kroki i haki. | W6 uchodźcy i Marek (rozdz. 3-7). Rozbitkowie z wraku zastępują uchodźców. | DOPASOWAĆ |
| W8_Data | [W8] Dane wątku na silniku wątków (Watki.js): zadanie W8, jego kroki i haki. | W8 Góry i kamieniołom (mapy 13, 14, 120). Wprost do Gór. [kod: 13, 14, 120] | DOPASOWAĆ |
| Przystan_Data | Przystań (mapa 125) - dane wątku: zadania Janka i Rocha (K47, K48, D20, W10), rozmowy, stan. | Przystań (Map125): rozmowy Janka i Rocha, K47,K48,D20,W10 (listy do matki). PLAN: W10 pasuje. [kod: 125] | DOPASOWAĆ |
| W4_Data | [W4] Dane wątku na silniku wątków (Watki.js): zadanie W4 rozdz. 1-5 (rozdz. 6-8: Kasztelan_Data.js). | W4 Krew kasztelana rozdz. 1-5. Borgar = karczmarz, zdecydować o imieniu; piwnica 9, Map140. | DOPASOWAĆ |
| W9_Data | [W9] Dane wątku na silniku wątków (Watki.js): zadanie W9 rozdz. 6 - prawdy z Warstwy Prawdy (rozdz. 3: Rywal.js). | W9 prawdy z Warstwy Prawdy. Podziemia zostają. | DOPASOWAĆ |
| Przystan | Przystań (mapa 125): Janek i chusta matki, Roch Szkwał i jego kuter, celnik Lorda, prom w dni promu, skup ryb, list do matki. | Silnik Przystani: Janek (chusta matki), Roch (kuter), celnik Lorda, prom w dni promu, skup ryb, list do matki; MAP=125, CUSTOMS=128. Przenieść na Wybrzeże (rybak Jan). [kod: 125] | DOPASOWAĆ |
| Kantor | [W5] Wątek „Towary z kontynentu”: trzy stuknięcia, obóz przemytników, nocny tragarz, rejestr Baltazara, noc promu, kantor w Akcie II. | Silnik W5 (id 730-759); mapy 8, 22, 23, 103, 171. Baltazar zostaje (MIESZKANCY.md). [kod: 8, 22, 23, 103, 171] | DOPASOWAĆ |
| Dwor | [W7] Wątek „Dwór z kamieni twierdzy” (wariant A): zaproszenie, hol z krukami, kronika rodu, dwa życia Feliksa, gabinet nocą, prawda dla Lorda, Akt II. | Silnik W7 (id 570-599); Map024 + wnętrza 172-174. PLAN §5: W7 do Posiadłości. [kod: 24, 172, 173, 174] | DOPASOWAĆ |
| Kasztelan_Data | [W4] Dane wątku „Krew kasztelana” rozdz. 6-8 dla silnika wątków (Watki.js): rozdziały, rozmowy, akcje, skoki F9. Teksty: js/teksty/kasztelan.txt. | W4 rozdz. 6-8; 7 odwołań do Borgara. | DOPASOWAĆ |
| Kasztelan | [W4] Wątek „Krew kasztelana” rozdz. 6-8: ród Kowali (poszlaki), konfrontacja z Borgarem po zamknięciu, zamknięta tawerna, noc w piwnicy, Borgar idzie w dół albo pilnuje piwnicy, Komnata... | Silnik W4 rozdz. 6-8: MAP={tawerna 1, miasto 8, piwnica 9, ruiny 10, piętro 140, dom 19, kopiec 20}; 46 odwołań do Borgara. Wiąże się wprost z karczmarzem i piwnicami. [kod: 1, 8, 9, 140] | DOPASOWAĆ |
| SwieteKosci | [W15] Łańcuch „Święte kości” - silnik: kazanie Gaspara na rynku, fałszywe kości, kurier Baltazara nocą na piętrze, skrzynka, kamień z krukiem i spis z Lipnicy, echo w Akcie III. | Silnik W15; kazanie na rynku, kurier na piętrze (25). [kod: 25] | DOPASOWAĆ |
| Dezerter | [W16] Łańcuch „Dezerter” - silnik: Tomek z pokoju 5, Szczerba i jej noc pod piątką, rotmistrz Bełza, przemyt, kryjówki, Tymon w garnizonie albo w obozie, echa w Akcie III. | Silnik W16; garnizon (archiwum) i pokój 5 (25). [kod: 1, 25] | ARCHIWUM |
| Jarmark | [W17] Wątek „Jarmark Kruczogrodu” - silnik: kramy, beczki, lampiony, konkurs piwny, turniej w kości, pomoc trupie, poszlaki, zakończenia. | Silnik W17 (id 4800-4999); Map008, Map001. Rynek Miasteczka. [kod: 1, 8] | DOPASOWAĆ |
| Jarmark_Sceny | [W17] Jarmark - sceny (pochód, sztuka i kradzież, zasadzka, zamknięcie) i pościg po dachach (tryb dachów tylko w pościgu). | Sceny jarmarku i pościg po dachach (Map008). [kod: 8] | DOPASOWAĆ |
| Wesele | [W18] Wesele w Złotym Kuflu - silnik: zdarzenia w tawernie, dzień wesela (ślub, toasty, taniec, zniknięcie pana młodego, bójka), noc poszukiwań, poranek, zakończenia A-D. | Silnik W18; Map026 (Apartamenty) i tawerna; 15 odwołań do Złotego Kufla. Nowa sala i pokoje. [kod: 26] | DOPASOWAĆ |
| Wesele_Gry | [W18] Mini-gry wesela: plan stołów (18 kart, 4 stoły) i pierwszy taniec (8 strzałek w rytm), na Scene_MiniGame. | Mini-gry wesela (plan stołów, taniec) na Scene_MiniGame; bez map. | ZOSTAJE |
| Poczta | [W20] Kruczy listonosz - silnik: listy z kruków (6:30 i 17:30), torba (B), doręczenia, okno listu, kruczarnia (mapa 214), sceny S1-S8, nocna warta, pułapka, finał. | Silnik W20; kruczarnia Map214 i miasto 8. Kruczarnia w Miasteczku (wieża). [kod: 8, 214] | DOPASOWAĆ |
| Majster | [W22] Wątek „Majstersztyk” - silnik: Cech (Map215), rangi, półka próbna, sabotaż, egzamin na rynku, mini-gra szlifów, Młotek majstra. | Silnik W22; Cech 215 i rynek 8. Do Miasteczka (cech, piwowar). [kod: 8, 215] | DOPASOWAĆ |
| Mlyn | [W19] Wątek „Sygnały z młyna” - silnik: pozy skrzydeł, kod, obserwacja, wypatrywacz, wnętrze młyna (Map217), ustawianie skrzydeł, noc w zatoczce, mini-gry. | Silnik W19; młyn 217, miasto 8, Przystań 125. [kod: 8, 119, 125, 217] | DOPASOWAĆ |
| Goraczka | [W21] Gorączka w przytułku - silnik: chorzy w łóżkach (mapa 216 / 202), zapora na ulicy, zbiórki, beczka i rów, sceny S1-S5, wybór A/B/C. | Silnik W21; przytułki 202/216. Przenieść do Podgrodzia. [kod: 202, 216] | DOPASOWAĆ |
| Poselstwo | [W14] Łańcuch „Poselstwo” - silnik: kolacja do Złotego „w służbie”, narada w Wielkim salonie, Noc Kupały i kradzież listu, ślady, molo, list (poseł / Lord / kopia), echa w Akcie III. | Silnik W14; Map026 i apartamenty. [kod: 26] | ARCHIWUM |
| Ludzie | [paczka C] Ludzie: Zbych Smolarz i mielerz, pasterz z owcami, wędrowny handlarz, patrole, obóz kopaczy (W8), jaskinia przemytników (W5, mapa 177), stare groby Ługów. | Silnik paczki C (id 2500-2699); mapy 13, 18, 21, 125, 168, 177. [kod: 13, 18, 21, 125, 168, 177] | ARCHIWUM |
| Zakon | [paczka D] Tajemnice i zakon: strażnice, kapliczki, kopce z Zapiskami strażnic, krąg menhirów z zagadką cieni i komora (mapa 176), miejsca tylko dla orła, orle grzędy, cmentarz z... | Silnik paczki D (id 2700-2899); mapy 155, 157, 175, 176. [kod: 155, 157, 175, 176] | DOPASOWAĆ |
| Osada | Osada Milczących na wschodniej łące pod Gawrą (Map004): drzwi chat, mieszkańcy, kamienie kręgu, palisada i brama wstawiane przy wczytaniu mapy. | Osada Milczących na Map004/120/121 (kieszeń); id 5300-5399. PLAN §5: kieszenie do archiwum. [kod: 4, 120, 121] | ARCHIWUM |
| Prologue | Prolog „Ostatni prom”: ekran imienia (polskie litery) i film przed pierwszym dniem (wieś, matka, port, sztorm, plaża). | Prolog „Ostatni prom” (wieś, matka, port, sztorm, plaża). Pasuje do nowego prologu (matka wysyła syna, sztorm, rozbicie); dociągnąć scenę końcową do przebudzenia. Przejście do domu dziadka = Map019. [kod: 19] | DOPASOWAĆ |

## Świat i mapy (19)

| Wtyczka | Co robi | Zależności ze starego świata / co zmienić | Decyzja |
|---|---|---|---|
| Wyspa_Data | Wyspa - wspólne dane sześciu nowych miejsc (mapy 155-167, numery zdarzeń 600-699, mieszkańcy 943-948, zadania, flagi, przejścia, pływy). | Wyspa - wspólne dane sześciu miejsc (mapy 155-167, pływy, przejścia). [kod: 13, 125, 147, 155, 156, 157, 159, 160, 161, 162, 163, 165, 166, 167] | ARCHIWUM |
| Pustelnia_Data | [pakiet A] Dane: pustelnia na klifie i skryptorium (mapy 155, 156), brat Kleofas, karty kroniki, K50, D23. | Pakiet A: pustelnia 155/156, brat Kleofas, D23, K50. Pustelnik jest w planie Gór - mapy od nowa. [kod: 8, 155, 156, 178] | ARCHIWUM |
| Kruk_Data | [pakiet B] Dane: Urwisko Kruków (mapa 157) i oswojony kruk: K51, D24, listy, cudze listy, błyskotki, zwiad. | Pakiet B: Urwisko Kruków (157), oswojony kruk. [kod: 157] | ARCHIWUM |
| Latarnia_Data | [pakiet C] Dane: przylądek z latarnią (mapy 159-161), latarnik Bazyli, mgła morska, soczewka i wizje, K49, D22, W11. | Pakiet C: latarnia 159-161. [kod: 125, 159, 160, 161] | ARCHIWUM |
| Garnizon_Data | [pakiet D] Dane: Garnizon nad zatoką (mapy 162, 163) - rotmistrz, kwatermistrz, werbownik, żołnierze, skup wojskowy, przychylność, zadania K52, D26, D27. | Pakiet D: garnizon 162/163, skup wojskowy. [kod: 8, 111, 162, 163] | ARCHIWUM |
| Wrak_Data | [pakiet E] Dane: Wrak na mieliźnie (mapy 165, 166), rozbitek Eryk Sowa (948), zadania D25 „Mapa z wraku” i W12 „Rozbitek”. | Pakiet E: wrak na mieliźnie (165/166), rozbitek Eryk Sowa. Wrak statku jest na planie Wybrzeża; przenieść. [kod: 1, 8, 13, 20, 24, 25, 125, 155, 157, 165, 178, 190] | DOPASOWAĆ |
| Cysterna_Data | [pakiet F] Dane: Stara cysterna zakonu (mapa 167) - zapas wody, czerpak raz dziennie, zasuwy, krata, D28 „Zapas zakonu”, K53 „Rynny zakonu”. | Pakiet F: stara cysterna zakonu (167): zapas wody, czerpak raz dziennie. PLAN: legenda o cysternie pod tawerną. [kod: 167] | DOPASOWAĆ |
| Okolice_Data | [pakiet 0] Dane rozszerzeń nowego terenu: numery paczek A-D, przedmioty, ikony, mapy, miejsca z planu, progi pogody. | Pakiet 0 rozszerzeń: numery paczek A-D, miejsca z planu; ok. 20 starych map. [kod: 3, 4, 8, 13, 17, 18, 21, 22, 23, 24, 111, 125, 155, 157 +6] | ARCHIWUM |
| Wyspa | Wyspa - wspólny rdzeń sześciu nowych miejsc: przejścia z map użytkownika (dopiero gdy miejsce gotowe), pływy, flagi między pakietami. | Rdzeń sześciu miejsc wyspy (id 690-699): przejścia, pływy, flagi. [kod: 13, 125] | ARCHIWUM |
| Pustelnia | [pakiet A] Pustelnia na klifie i Skryptorium (mapy 155, 156): brat Kleofas, zaszyfrowane kroniki (D23), atrament (K50), Noc Pytania (W2 rozdz. 7). | Pakiet A (id 600-609); Map155/156 + Archiwum 119 + Starszy 123. [kod: 8, 119, 123, 125, 146, 155, 156, 178] | ARCHIWUM |
| Kruk | [pakiet B] Urwisko Kruków (mapa 157) i oswojony kruk: kruczarnia, K51, D24, grzęda, listy, zwiad, błyskotki, pilnowanie pola. | Pakiet B (id 610-629); Map157. Poczta (W20) przejmuje listy. [kod: 8, 125, 155, 157] | ARCHIWUM |
| Latarnia | [pakiet C] Przylądek z latarnią (mapy 159-161): ogień latarni, mgła morska, latarnik Bazyli, wizje w soczewce (D22), tran (K49), Soczewka (W11). | Pakiet C (id 630-639); mapy 159-161. [kod: 13, 157, 159, 160, 161] | ARCHIWUM |
| Garnizon | [pakiet D] Garnizon nad zatoką (mapy 162, 163): żołnierze, przychylność garnizonu, skup wojskowy, pobór, zboże z rekwizycji, łacha do wraku w odpływie. | Pakiet D (id 640-669); mapy 162, 163, 165. [kod: 8, 162, 163, 165] | ARCHIWUM |
| Wrak | [pakiet E] Wrak na mieliźnie (mapy 165, 166): pływy na łasze i w ładowni, łódź Janka, żołnierze garnizonu, mapa z zaznaczeniami; rozbitek Eryk Sowa (W12). | Pakiet E (id 670-679): pływy w ładowni, łódź Janka, mapa z zaznaczeniami, RAID_MAPS=[3,4,8,13,17,18,20,22,23,111,125]. Wrak na Wybrzeżu jako start Aktu I. [kod: 165, 166] | DOPASOWAĆ |
| Wyspy | Wyspy: drogi na wyspy (mielizny w odpływie, łódki z przystani i garnizonu, stara łódź rybaków, orzeł) i to, co na nich jest: gniazda kormoranów, sól, skrytka przemytników, krzyż rybaków,... | Drogi na małe wyspy i ich zawartość (mielizny, gniazda kormoranów, skrytka); powiązane z Przystanią 125 i Garnizonem 162. [kod: 125, 162] | ARCHIWUM |
| Cysterna | [pakiet F] Stara cysterna zakonu (mapa 167): zapas wody, czerpak raz dziennie, słup miary, zasuwy, krata na Urwisku, D28 i K53. | Pakiet F (id 680-689); mapa 167, piętro 30 (147). Woda to oś nowego świata. [kod: 8, 147, 167] | DOPASOWAĆ |
| MapaWyspy_Data | Dane mapy wyspy: miejsca na zewnątrz i ich położenie na schemacie, drogi między nimi, wnętrza przypisane do miejsc. | Dane mapy wyspy: miejsca i drogi na schemacie. Nowy schemat 5 map w linii. [kod: 4] | DOPASOWAĆ |
| MapaWyspy | Mapa wyspy: schemat odkrytych miejsc z drogami, bohaterem i celem; zakładka „Mapa” w menu P (O: karta miejsca) i wybór miejsca na schemacie. | Zakładka „Mapa” w menu P: schemat odkrytych miejsc. Silnik zostaje, dane nowe. | DOPASOWAĆ |
| Okolice | [pakiet 0] Rdzeń rozszerzeń nowego terenu: odkrycia i zakładka dziennika „Okolice”, kompas, wiersze F9 paczek, upał i susza, cień słońca, test kolizji miejsc. | Rdzeń paczek A-D: odkrycia, zakładka dziennika Okolice, kompas, wiersze F9 (id 2000-2099). Jeśli zakładka odkryć ma zostać - przepisać dane. [kod: 165] | ARCHIWUM |

## Grafika i nastrój (26)

| Wtyczka | Co robi | Zależności ze starego świata / co zmienić | Decyzja |
|---|---|---|---|
| DustMotes | Unoszące się w powietrzu drobinki kurzu dla klimatu wnętrz. | Kurz w powietrzu wnętrz; bez map. | ZOSTAJE |
| RoomLighting | Przyciemnia pokój i dodaje ciepłą poświatę światła (np. z okna). | Ciemność i światło wnętrz wg tagu <Dark>; bez map. | ZOSTAJE |
| DayNightCycle | Cykl dnia i nocy: upływ czasu, numer dnia, pory dnia i zabarwienie ekranu. | Zegar dnia i nocy; bez map. | ZOSTAJE |
| CloudShadows | Cienie przelatujących chmur, przypięte do mapy (nie do ekranu), unoszą się nad mapą zewnętrzną. | Cienie chmur na mapach zewnętrznych; bez map. | ZOSTAJE |
| SwayingFoliage | Subtelnie kołysząca się roślinność (krzaki/trawa/drzewa) na wietrze. | Kołysanie roślin (region 5); bez map. | ZOSTAJE |
| Sky | Niebo i słońce: kolor świtu i zachodu, cienie od słońca, ognia i lamp, światło z boku, promienie słońca, poranna mgła. | Niebo, słońce, cienie od ognia i lamp. Bez map (liczby w grepie to kolory). | ZOSTAJE |
| Mood | Klimat obrazu: poświata świateł, barwy zależne od pory dnia, pogody i miejsca, winieta (tylko świat, nie interfejs). | Bloom, winieta, barwy wg pory/pogody/miejsca. Jedyny twardy punkt: DARK_FOREST_MAPS=[12] (Mroczny Las) i nazwa /mroczny las/ - zamienić na tag mapy. | DOPASOWAĆ |
| TerenKit | Wspólne narzędzia malowania gruntu (szum, rozmycie, pole odległości, piksele kafli mapy, atlasy) dla CzerwonaWoda i Ziemia. | Wspólne narzędzia malowania gruntu (Ziemia, CzerwonaWoda). | ZOSTAJE |
| Ziemia | Próba „ładniejszej mapy” na Kruczym Jarze: miękkie granice gruntu, cień przy ziemi, mocniejsze barwy (Mood). Każda część osobno do wyłączenia. | Miękkie granice gruntu, cień przy ziemi, mocniejsze barwy. Parametr maps = 44 numery starych map (wzorzec: Map003). Wpisać 5 nowych map. [kod: 3] | DOPASOWAĆ |
| Wzgorza | Próba „zaokrąglone wzgórza”: rogi górnej krawędzi wzgórz i półek oraz dół lica skalnej ściany zaokrąglone łukiem (nakładka rysowana raz przy wejściu na mapę); na mapach próbnych także... | JUŻ WYŁĄCZONA (status false): zaokrąglone wzgórza na mapach próbnych 990/991 i Map013. Nowe Góry mogą ją odświeżyć później. [kod: 13, 990, 991] | ARCHIWUM (wyłączona) |
| CharacterPolish | Szlif grafiki: cień i kontur postaci. | Cień i kontur postaci; bez map. | ZOSTAJE |
| GroundDetail | Szlif grafiki: drobne kępki trawy, kamyki i kwiatki na łąkach. | Kępki trawy, kamyki, kwiatki na łąkach; bez map. | ZOSTAJE |
| Laka_Woda | Dane łąki: woda sąsiednich map za krawędziami (sucha trawa przy brzegu płynnie przez granice map). | Dane: woda sąsiednich map za krawędziami (klucze = numery starych map). Przeliczyć dla linii 5 map (morze na zachodnim krańcu Wybrzeża, rzeka Góry-Posiadłość). | DOPASOWAĆ |
| Laka | Łąka: odcienie trawy, sucho przy brzegu i bujnie w głębi lądu, rzadkie kwietne łany, igliwie i wysoka trawa przy drzewach; woda sąsiednich map też liczy się do suchego brzegu. | Odcienie trawy, sucho przy brzegu, bujnie w głębi, kwiaty. Parametr maps (44 numery) i noFlowers=8,111 (miasto, Podgrodzie). Wpisać nowe mapy. [kod: 990] | DOPASOWAĆ |
| WaterFx | Żywa woda: plusk i mgiełka pod wodospadem, kręgi na stawie, smugi płynącego nurtu (tagi w notatkach eventów). | Plusk, kręgi, nurt wg tagów zdarzeń w notatkach; bez map. | ZOSTAJE |
| Storm | Burza: ciemniejące niebo, błyskawice, grzmoty z opóźnieniem, wicher gnący drzewa, ukośna ulewa i lecące liście. | Burza (błyskawice, wiatr, ulewa); działa na mapie bieżącej i drzewach. | ZOSTAJE |
| Puddles | Kałuże po deszczu: w zagłębieniach nad gliną zbiera się woda - rośnie w deszczu, powoli wysycha. | Kałuże po deszczu w zagłębieniach nad gliną; z map tylko stan per mapId. | ZOSTAJE |
| Cienie | Cienie od słońca: budynki z kafli (jak bryły), budynki gracza i stojące rzeczy (latarnie, posągi, palisady, tablice) rzucają cień jak drzewa. | Cienie od słońca z budynków z kafli i postawionych rzeczy; kod bez numerów map. Sprawdzić bryły nowych drewnianych budynków. | ZOSTAJE |
| CzerwonaWoda_Brzegi | Dane czerwonej wody i pasa brzegu: woda i ląd sąsiednich map za krawędziami (płynnie przez granice map), zanik pasa przy lądzie bez pasa. | Dane pasa brzegu i wody za krawędziami wg numerów starych map; przegenerować dla nowych 5. | DOPASOWAĆ |
| CzerwonaWoda | Czerwona woda: w suszę morze przy wyspie zakwita (rdzawy odcień, piana, śnięte ryby), nie da się go pić ani przegotować; po deszczu szare i słone. Mapy z <Water:salt>; odcień i pas... | Czerwona woda w suszę na morzu (<Water:salt>). Lista BRZEG_MAPS (ok. 40 starych map) i Przystań 125. Dopasować do Wybrzeża i szwów; pasuje do tematu słonego morza. [kod: 125] | DOPASOWAĆ |
| Ziemia_Ozdoby | Ozdoby Kruczego Jaru (próba ładniejszej mapy): grupy przedmiotów przy murze, ścieżce i skraju lasu, jako zdarzenia. | Ozdoby Kruczego Jaru jako zdarzenia (id 3100-3139, Map003) - związane z jedną starą mapą. [kod: 3] | ARCHIWUM |
| Klimat_Miasta | Klimat miasta: dym z kominów (gęstszy rano i wieczorem, z wiatrem), okna zapalają się o zmierzchu dom po domu, kruki na dachach i murach, krążą nad kruczarnią, na noc do wieży. | Dym z kominów, okna o zmierzchu, kruki. Tabela MAPS ma tylko Map008 z ramkami w kratkach (tawerna/zamek, kruczarnia). Nowa tabela dla Miasteczka i Podgrodzia. | DOPASOWAĆ |
| Klimat_Ziemia | Klimat podłoża i murów Kruczogrodu: zużyty bruk, błoto, cień przy ścianach i rzeczach, koleiny, słoma, zacieki, sadza, bluszcz, liście jesienią (gotowe obrazki). | Gotowe obrazki podłoża i murów Kruczogrodu (img/klimat/Map008/z_*.png, CHUNKS[8]); wypiec tools/klimat/ziemia_miasta.py dla nowych map. [kod: 8] | DOPASOWAĆ |
| Klimat_Pogoda | Pogoda na ziemi: mokry bruk w deszczu i po nim (nocą odbicia świateł), śnieg zimą (dachy, czapy, sople, wydeptane ulice), ślady stóp i kopyt w błocie i śniegu. | Mokry bruk, śnieg, ślady: gotowe obrazki per mapa (img/klimat/pogoda/MapNNN, tablica BAKED). Wypiec dla nowych map. | DOPASOWAĆ |
| Klimat_Detale | Detale klimatu: szyldy kołyszą się na wietrze, błyski i kręgi deszczu na wodzie w beczkach i korytach, para z dachów w słońcu po deszczu, pyłki w porannych promieniach. | Szyldy, kręgi deszczu w beczkach, para z dachów; MOTE_BOXES wg numeru mapy. Nowe pudełka pyłków. | DOPASOWAĆ |
| PoryRoku | Pory roku widać: trawa, krzaki i korony drzew wiosną świeże, jesienią złote i rdzawe, zimą blade i ze śniegiem na liściach; jesienią spadają liście. | Sezonowe arkusze kafli i drzew (tools/klimat/pory_roku.py); działa na każdej mapie zewnętrznej. Przebudować arkusze, jeśli nowe mapy dostaną nowy zestaw kafli. | ZOSTAJE |

## UI/HUD (10)

| Wtyczka | Co robi | Zależności ze starego świata / co zmienić | Decyzja |
|---|---|---|---|
| UITheme | Jeden wygląd interfejsu: paleta (czarne panele, jasnożółty akcent, jasny tekst, szare linie), czcionka, wspólne panele, paski i symbole, porządek w menu, listach i ekranie tytułowym. | Jeden wygląd interfejsu (czarne panele, żółty akcent); liczby w grepie to kolory. | ZOSTAJE |
| Minimap | Minimapa w prawym górnym rogu (teren, drzewa, skały, budynki, gracz, wyjścia); pod nią okienko z celem z dziennika. | Minimapa wg znacznika <Minimap>; bez numerów map. | ZOSTAJE |
| SpeechBubbles | Rozmowy w dymkach: tekst wiadomości pojawia się w dymku nad postacią, która mówi, z ogonkiem do niej. Krótkie okrzyki postaci (np. przed burzą). | Rozmowy w dymkach; 6 wzmianek o Borgarze w przykładach (komentarze). | ZOSTAJE |
| MenuPanel | Menu P - części wspólne: polecenia innych wtyczek w menu (addCommand), bez przycisków dotykowych, karta przedmiotu Plecaka (dane), pamiątki i rzeczy do zadań. Samo menu rysuje MenuRing.js. | Menu P - wspólne części; bez map. | ZOSTAJE |
| CleanHUD | HUD na mapie w jednym wyglądzie gry (paleta UITheme.js): zegar, poziome paski potrzeb, cel, okrągły kompas, nazwa miejsca, zdobycze. | HUD na mapie (zegar, paski, cel, nazwa miejsca). Nazwy map = gotowe obrazki img/nazwy_map wg numeru i js/teksty/miejsca.txt; zrobić obrazki dla 5 map i wnętrz (tools/nazwa_mapy/obrazki.js). | DOPASOWAĆ |
| CleanHUD_Compass | Czysty widok: okrągły kompas celu w prawym górnym rogu (kierunek do celu z dziennika lub zadania, także przez przejścia między mapami). | Kompas celu; FIELD=3, HUT_MAP=100 i wzmianki 1/8. Cele przez przejścia dzięki Swiat_Data. [kod: 1, 8, 100] | DOPASOWAĆ |
| MenuRing_Rysunki | Menu P - wspólne części (część MenuRing.js): obraz mapy pod menu, dane stron, rysowanie paneli, pasków i klawiszy, podstawa strony. | Menu P - rysowanie; 2 wzmianki o Kruczogrodzie w tekstach. | ZOSTAJE |
| MenuRing_Strony | Menu P - strony Postać, Ekwipunek, Umiejętności i Plecak (część MenuRing.js). | Menu P - strony Postać/Ekwipunek/Umiejętności/Plecak; bez map. | ZOSTAJE |
| MenuRing | Menu P - zakładki u góry (Postać, Ekwipunek, Umiejętności, Plecak, Dziennik, Mapa, Opcje, Zapisz grę, Wyjdź), pod nimi widok; A/D zakładka, O wejdź, P wróć; ekrany plików i opcji z... | Menu P z zakładkami; zakładka Mapa korzysta z MapaWyspy. | ZOSTAJE |
| TitleScreen | Ekran tytułowy „Kufel przy kominku”: żywy ogień, iskry, świeca i para; napis i menu w złocie obrazu. | Ekran tytułowy „Kufel przy kominku”, napis „Ciepły kąt na krańcu świata”. Opcja Szybka gra -> nowy start. | ZOSTAJE |

## Narzędzia i F9 (1)

| Wtyczka | Co robi | Zależności ze starego świata / co zmienić | Decyzja |
|---|---|---|---|
| Debug | Menu deweloperskie (F9) w sześciu zakładkach: zdarzenia (czas, pogoda, ptaki, dzik), budowanie (każda budowla za darmo), przedmioty (dowolna ilość; narzędzia i broń / surowce /... | Menu F9 (6 zakładek) z tabelą ROUTE i teleportami: mapy 1,3,4,8,13,20,24,111,125,154,160-163,171-174. Nowa lista teleportów na 5 map + wnętrza. [kod: 1, 3, 4, 8, 13, 20, 24, 111, 125, 154, 160, 161, 162, 163 +4] | DOPASOWAĆ |

## Twarde numery starych map: gdzie są w kodzie

Automatyczny grep wtyczek (`js/plugins/*.js`) po wzorcach numerów map; liczba w nawiasie = liczba trafień w pliku. To lista do przełączenia świata: każdy numer, który znika z gry, wymaga przejrzenia wymienionych plików. Nie wszystkie wystąpienia są logiką (część to komentarze).

| Nr | Stara mapa | Wtyczki, które ją wymieniają |
|---|---|---|
| 1 | TAWERNA | Hunting (9), Przytulna (6), Act3_Data (6), Podroznicy (5), Podroznicy_Data (4), Wrak_Data (3), Wesele_Data (3), TownLife (3), Kasztelan (3), TavernShift_Hall (2), Goscie_Sala (2), TownQuests (2), TawernaCore (1), Journal (1), Debug (1), TavernShift (1), TavernLife_Plan (1), TavernLife_Regulars (1), TownLife_Data (1), Ludzie_Data (1), Jarmark_Data (1), Mlyn_Data (1), Underground_Gen (1), Underground_Data (1), Act3 (1), Intrygi (1), Dezerter (1), Jarmark (1), CleanHUD_Compass (1) |
| 2 | Domek - Wnętrze | Humans_Data (1), Underground_Gen (1) |
| 3 | Kruczy Jar | Zasoby_Data (13), Okolice_Data (12), Lowy_Data (8), Zakon_Data (8), Zasoby (7), TownQuests_Data (5), Kantor_Data (3), Farming_Build (2), Hunting (2), Ludzie_Data (2), Humans_Data (2), Ziemia (1), Dog (1), Debug (1), TownQuests (1), Homes (1), Underground_Gen (1), Underground_Data (1), Woz (1), Ziemia_Ozdoby (1) |
| 4 | Łąka pod Gawrą | Ludzie_Data (13), Zakon_Data (12), Lowy_Data (11), Okolice_Data (8), Osada (4), TownQuests_Data (3), Lowy (2), TawernaCore (1), Hunting (1), Debug (1), QuestBoard_Data (1), Kantor_Data (1), Zasoby_Data (1), Homes (1), Humans_Data (1), MapaWyspy_Data (1) |
| 8 | Kruczogród | TownQuests_Data (15), Act3_Data (13), Zakon_Data (12), TownLife_Data (8), Garnizon_Data (6), Okolice_Data (5), TownQuests (5), Kantor (5), Woz (5), Konie (5), TawernaCore (4), Podroznicy_Data (4), Jarmark_Data (4), Poczta_Data (4), Mlyn_Data (4), Goraczka_Data (4), Pustelnia_Data (3), Wrak_Data (3), Majster_Data (3), TownLife (3), Majster (3), Mlyn (3), Debug (2), Kantor_Data (2), Dezerter_Data (2), Podroznicy5_Data (2), Garnizon (2), Kasztelan (2), Poczta (2), Zasoby (2), RegionLayers (1), Zasoby_Data (1), Morze_Data (1), Underground_Data (1), Act3 (1), Pustelnia (1), Kruk (1), Cysterna (1), Podroznicy (1), Jarmark (1), Jarmark_Sceny (1), Morze_Potwory (1), Morze (1), Podroznicy5 (1), CleanHUD_Compass (1), Orzel_Lot (1), Klimat_Ziemia (1) |
| 9 | Piwnica Tawerny | Underground_Data (2), Underground (2), Kasztelan (2), TawernaCore (1), TownQuests (1), Act3_Data (1) |
| 10 | Ruiny Zamku | Underground_Data (3), Underground (1), Rywal_Data (1) |
| 11 | Komnata Serca | Underground (6), Underground_Data (3), TawernaCore (1), Rywal_Data (1), Rywal (1) |
| 12 | Mroczny Las | Humans_Data (3), Hunting (1) |
| 13 | Góry i kamieniołom | Okolice_Data (16), Zakon_Data (8), Lowy_Data (6), TownQuests (5), Orzel_Data (4), Zasoby_Data (4), Ludzie_Data (4), Zasoby (4), TownQuests_Data (3), Orzel (3), W8_Data (2), Latarnia (2), Kopalnia (2), Lowy (2), Ludzie (2), TawernaCore (1), Wzgorza (1), Debug (1), Wyspa_Data (1), Wrak_Data (1), Podroznicy_Data (1), Wyspa (1) |
| 14 | Jaskinia | TownQuests (8), W8_Data (3), TownQuests_Data (3) |
| 17 | Omszała łąka | Zasoby_Data (6), Okolice_Data (4), Zakon_Data (2), Zasoby (2), Hunting (1), Ludzie_Data (1), Humans_Data (1) |
| 18 | Łąka menhirów | Zakon_Data (3), Okolice_Data (2), Hunting (1), Ludzie_Data (1), Humans_Data (1), Ludzie (1) |
| 19 | Dom dziadka - Wnętrze | TownQuests_Data (2), Story (1), HomeDecor (1), HomeLife (1), Underground_Data (1), Prologue (1) |
| 20 | Dom dziadka - Podwórze | TownQuests_Data (2), Debug (1), Wrak_Data (1) |
| 21 | Leśna droga | Okolice_Data (8), Ludzie_Data (7), Lowy_Data (5), Lowy (4), QuestBoard_Data (2), Zakon_Data (2), Hunting (1), Humans_Data (1), Humans (1), Ludzie (1) |
| 22 | Polna droga | Zakon_Data (4), Kantor_Data (3), Okolice_Data (3), QuestBoard_Data (2), Ludzie_Data (2), Kantor (2), TawernaCore (1), TownQuests_Data (1), TownQuests (1), Humans_Data (1) |
| 23 | Skraj lasu | Kantor_Data (4), Okolice_Data (4), Lowy_Data (3), Lowy (3), QuestBoard_Data (2), TownLife_Data (2), Zakon_Data (2), Kantor (2), TawernaCore (1), Hunting (1), Story (1), Zasoby_Data (1), Homes (1), Humans_Data (1), Humans (1) |
| 24 | Posiadłość Lorda | Lowy_Data (14), Okolice_Data (6), TownQuests_Data (6), Dwor (4), TownLife_Data (3), Dwor_Data (2), Lowy (2), TawernaCore (1), Debug (1), Wrak_Data (1), TownQuests (1), Underground_Data (1) |
| 25 | Pokoje gości | Wrak_Data (3), Intrygi (3), TawernaCore (2), Podroznicy_Data (2), SwieteKosci_Data (2), Intrygi_Data (2), TownQuests_Data (2), TownQuests (2), Humans_Data (2), SwieteKosci (2), Dezerter (2), TavernLife_Plan (1), Poselstwo_Data (1), Podroznicy (1) |
| 26 | Apartamenty | Poselstwo_Data (3), Intrygi (2), TawernaCore (1), TavernLife_Plan (1), Intrygi_Data (1), Wesele (1), Poselstwo (1) |
| 100 | Chatka - Wnętrze | Farming (2), Homes (2), Farming_Data (1), Combat (1), Underground_Gen (1), CleanHUD_Compass (1) |
| 103 | Kantor | Kantor (7), Kantor_Data (6), TawernaCore (1), TownLife (1) |
| 108 | Dzwonnica | Podroznicy_Data (2), TownQuests_Data (2) |
| 111 | Podgrodzie | TownLife_Data (18), TownQuests_Data (6), Okolice_Data (5), Zasoby_Data (5), Homes (4), Garnizon_Data (2), Zasoby (2), Debug (1), Kantor_Data (1), TownLife (1), Woz (1) |
| 113 | Chata drwala | Ludzie_Data (1) |
| 118 | Dno studni | TownQuests_Data (4) |
| 119 | Archiwum zakonu | TownQuests_Data (3), Pustelnia (3), Mlyn (2), TawernaCore (1), Mlyn_Data (1), W2_Data (1), TownQuests (1) |
| 120 | Osada Milczących | TownQuests (3), Zakon_Data (1), W8_Data (1), TownQuests_Data (1), Osada (1) |
| 121 | Wspólna izba | Osada (1) |
| 123 | Chata Najstarszego | Pustelnia (3) |
| 125 | Przystań | Okolice_Data (12), TownLife_Data (5), Ludzie_Data (5), Zakon_Data (5), Zasoby_Data (4), Przystan (4), Wyspa_Data (3), Podroznicy_Data (3), Mlyn_Data (3), TownQuests_Data (3), Mlyn (3), Kantor_Data (2), Przystan_Data (2), CzerwonaWoda (2), Morze (2), Zasoby (2), TawernaCore (1), Farming (1), Farming_Plots (1), Debug (1), Latarnia_Data (1), Wrak_Data (1), Morze_Data (1), Wyspa (1), Pustelnia (1), Kruk (1), Wyspy (1), Podroznicy (1), Intrygi (1), Woz (1), Ludzie (1) |
| 128 | Komora celna | TownLife_Data (1) |
| 130 | Podziemia: kawałki (pasmo 1) | Underground_Gen (1), Underground (1) |
| 140 | Podziemia: piętro 10 (Strażnica) | Underground_Data (4), Kasztelan (3), Underground (2), TawernaCore (1), Creatures_Data (1), Creatures (1), Rywal_Data (1) |
| 141 | Podziemia: kawałki (pasmo 2) | Underground_Gen (1), Underground (1) |
| 145 | Podziemia: piętra 11-99 (skorupa) | Underground_Data (1), Underground (1) |
| 146 | Podziemia: piętro 20 (Sala jednego pytania) | Pustelnia (3), Zakon_Data (1), Underground_Data (1), Underground (1) |
| 147 | Podziemia: piętro 30 (Wielka cysterna) | Wyspa_Data (1), Underground_Data (1), Cysterna (1) |
| 148 | Podziemia: piętro 40 (Bród Milczącej) | Underground_Data (1) |
| 149 | Podziemia: piętro 50 (Przekop kopaczy) | Underground_Data (1) |
| 150 | Podziemia: piętro 60 (Brama Pierwszych) | Underground_Data (1) |
| 151 | Podziemia: piętro 70 (Sala płaskorzeźb) | Underground_Data (1) |
| 152 | Podziemia: piętro 80 (Sala echa) | Underground_Data (1) |
| 153 | Podziemia: piętro 90 (Ostatnia straż) | Underground_Data (1) |
| 154 | Chata pod lasem | Debug (1), Homes (1) |
| 155 | Pustelnia na klifie | Zakon_Data (10), Okolice_Data (6), Pustelnia_Data (3), Wyspa_Data (2), Pustelnia (2), Zakon (2), Wrak_Data (1), Zasoby_Data (1), Podroznicy_Data (1), Kruk (1), Zasoby (1) |
| 156 | Skryptorium | Pustelnia_Data (2), Pustelnia (2), Wyspa_Data (1) |
| 157 | Urwisko Kruków | Zakon_Data (11), Kruk (5), Wyspa_Data (2), Kruk_Data (2), Okolice_Data (2), Wrak_Data (1), Podroznicy_Data (1), Latarnia (1), Zakon (1) |
| 159 | Przylądek z latarnią | Latarnia (6), Latarnia_Data (3), Wyspa_Data (1), Ludzie_Data (1) |
| 160 | Izba latarnika | Latarnia_Data (2), Debug (1), Wyspa_Data (1), Latarnia (1) |
| 161 | Laterna | Latarnia_Data (2), Debug (1), Wyspa_Data (1), Latarnia (1) |
| 162 | Garnizon nad zatoką | Garnizon_Data (7), Okolice_Data (6), Lowy_Data (5), Garnizon (4), Podroznicy_Data (3), Wyspa_Data (2), Ludzie_Data (2), Podroznicy_Sprawy (2), Lowy (2), Debug (1), Zakon_Data (1), Wyspy (1), Zasoby (1) |
| 163 | Kwatera rotmistrza | Garnizon_Data (2), Garnizon (2), Debug (1), Wyspa_Data (1) |
| 165 | Wrak na mieliźnie | Okolice_Data (6), Zakon_Data (5), Wyspa_Data (2), Garnizon (2), Wrak_Data (1), Wrak (1), Okolice (1) |
| 166 | Wrak - pod pokładem | Wyspa_Data (1), Wrak (1) |
| 167 | Stara cysterna zakonu | Cysterna (3), Cysterna_Data (2), Wyspa_Data (1) |
| 168 | Spalona zagroda | Okolice_Data (7), Zasoby_Data (4), Lowy_Data (4), Ludzie_Data (3), Zakon_Data (3), Homes (2), Zasoby (2), Lowy (2), Ludzie (1) |
| 169 | Dom Ługów | Homes (1) |
| 171 | Piwnica kantoru | Kantor_Data (3), Kantor (2), TawernaCore (1), Debug (1) |
| 172 | Dwór - Hol | Debug (1), Dwor (1) |
| 173 | Dwór - Biblioteka | Debug (1), Dwor (1) |
| 174 | Dwór - Gabinet | Debug (1), Dwor (1) |
| 175 | Orla Grań | Zakon_Data (8), Okolice_Data (3), Orzel_Data (2), Orzel (2), TawernaCore (1), Kopalnia (1), Zakon (1) |
| 176 | Komora pod menhirami | Zakon_Data (4), Okolice_Data (1), Zakon (1) |
| 177 | Jaskinia przemytników | Ludzie_Data (2), Ludzie (2), Okolice_Data (1) |
| 178 | Kaplica | Pustelnia_Data (1), Wrak_Data (1), Pustelnia (1) |
| 181 | Stajnia z wozownią | Stajnia (6), TownLife_Data (1) |
| 190 | Dom 9 (izba do wynajęcia) | Wrak_Data (1) |
| 201 | Szynk | TownLife_Data (1) |
| 202 | Przytułek | Goraczka_Data (2), Goraczka (1) |
| 213 | Kopalnia pod Orlą Granią | Kopalnia (4), Orzel_Data (2) |
| 214 | Kruczarnia | Poczta_Data (2), Poczta (1) |
| 215 | Cech | Majster_Data (4), Majster (4) |
| 216 | Przytułek | Goraczka_Data (2), Goraczka (1) |
| 217 | Młyn | Mlyn_Data (3), Mlyn (3) |
| 990 | Mapa próbna A | Wzgorza (1), Laka (1), FreeMovement (1) |
| 991 | Mapa próbna B | Wzgorza (1) |

### Numery map, które najczęściej wracają

| Nr | Mapa | Ile wtyczek |
|---|---|---|
| 8 | Kruczogród | 47 |
| 125 | Przystań | 31 |
| 1 | TAWERNA | 29 |
| 13 | Góry i kamieniołom | 22 |
| 3 | Kruczy Jar | 20 |
| 4 | Łąka pod Gawrą | 16 |
| 23 | Skraj lasu | 15 |
| 25 | Pokoje gości | 14 |
| 162 | Garnizon nad zatoką | 13 |
| 24 | Posiadłość Lorda | 12 |
| 111 | Podgrodzie | 11 |
| 155 | Pustelnia na klifie | 11 |

### Inne miejsca z numerami map poza kodem wtyczek

- `data/System.json`: `startMapId` = 19 (wnętrze domu dziadka), start 2,5. Nowy start = dom dziadka w Podgrodziu (nowa mapa).
- `js/tawerna_wtyczki.js` (parametry): `Ziemia.maps` i `Laka.maps` (44 numery), `Wzgorza.maps/walkMaps/shoreMaps`, `Hunting.maps` (zwierzęta per mapa 3-18), `Combat.levels` (poziomy miejsc 3-18), `Atmosphere.tavernMaps="1"`, `TavernLife.roomMaps="25,26"`, `HomeAmbience.maps="19"`, `HomeDecor.mapId="19"`.
- `data/MapNNN.json` (notatki map) niosą tagi czytane przez wtyczki; nowe mapy muszą dostać te same: `<Clouds>`, `<Weather>`, `<Minimap>`, `<Zoom>`, `<Hunt>`, `<Bear>`, `<Poziom>`, `<Ambience>`, `<NazwaMapy>`, `<Water:salt>`, `<Dark>`, `<Mood>`. `Pokoje`, `Widok`, `Cienie` czytają też zestaw kafli (tileset) mapy.
- Obrazki upieczone per mapa: `img/klimat/MapNNN/` (Klimat_Ziemia, Klimat_Pogoda), `img/nazwy_map` (CleanHUD; `tools/nazwa_mapy/obrazki.js` po zmianie tekstów), arkusze pór roku (`tools/klimat/pory_roku.py`).
- Generatory i narzędzia z numerami map: `tools/plansza/swiat.py` (Swiat_Data), `tools/drzewa` (zdarzenia drzew; `--wykonaj` podbija `versionId` w `System.json`), `tools/mapy` (katalog, kontrola.py), `tools/wnetrza/build.py`, `tools/town/paint_layers.py`, `tools/klimat/*`. Po instalacji nowych map podbić `versionId` (zapisy trzymają stare układy zdarzeń).
- Teksty zadań: `js/teksty/*.txt` czytane przez Watki.js (kasztelan.txt, cysterna.txt, miejsca.txt...) - nazwy miejsc i postaci starego świata.
- `data/CommonEvents.json` nie zawiera przeniesień (kod 201), więc przejścia siedzą w zdarzeniach map i we wtyczkach.

## Bloki numerów zdarzeń (rejestr w TawernaCore)

Numer zdarzenia jest globalny: jeden blok = jeden właściciel na wszystkich mapach. Wtyczki wstawiają swoje zdarzenia do map przy ładowaniu (`Tawerna.inject`), więc bloki zarchiwizowanych wtyczek zostają zajęte, a nowe wtyczki biorą wolne. Bloki: Jarmark 4800-4999, Osada 5300-5399, Goraczka 4610-4699, TownLife 910-949 / 2900-2959 / 3020-3049 / 4600-4609, Pustelnia 600-609, Kruk 610-629, Latarnia 630-639, Garnizon 640-669, Wrak 670-679, Cysterna 680-689, Wyspa 690-699, Homes 700-729, Kantor 730-759, Dwor 570-599, Kasztelan 540-559, Orzel 500-539, Rywal 828-839, Story 901-902 / 3240-3249, TownQuests 951-959, HomeLife 960-979, HomeDecor 980-998, Forestry 1000-1999, Okolice 2000-2099, Zasoby 2100-2299, Lowy 2300-2499, Ludzie 2500-2699, Zakon 2700-2899, Podroznicy 3002-3019, Ziemia 3100-3139, Mlyn 2970-2999, Konie 3260-3279, Stajnia 3250-3259, Poselstwo 3070-3089, Lancuchy 3050-3069, Goscie_Sala 400-422. Zdarzenia z edytora leżą poniżej (największa stara mapa kończy się na 354).

## Testy (`tests/*.js`, 274 pliki + `tests/unit/`)

Klasyfikacja tylko grepem (nic nie uruchamiano): `newGame({ map: N })`, `mapId`/`map:`/`reserveTransfer`/`MapNNN` w pliku. Domyślny start testów (`tests/lib/kit.js`, `newGame` bez `map`): **Map003** (Kruczy Jar, 22,14), a przy `story:true` dom dziadka Map019 (2,5). Zmiana tych dwóch stałych w kicie przeniesie sporo testów na nową mapę próbną.

| Klasa | Ile | Co to znaczy |
|---|---|---|
| A. Świat-obojętne | 7 | bez map i bez nowej gry (narzędzia, dane, ubiór, ładowacz, menu) |
| A1. Domyślny start | 23 | `newGame()` bez mapy (ląduje na Map003) albo skrypty do zdjęć i szwów; po zmianie startu w kicie działają |
| B. Mechanika na „placu zabaw” | 136 | testują system (uprawa, walka, polowanie, głód...) na starej mapie 1/3/4/8/100; wystarczy przestawić mapę próbną lub kit; te na Map001 (tawerna) i Map008 (miasto) zależą już od zawartości |
| C. Związane z treścią starych map | 108 | zależą od konkretnych miejsc, zdarzeń, wątków i wnętrz (numery map powyżej 10) - do archiwum albo przepisania razem z wtyczką |

**A. Świat-obojętne:** cdp, core_fixtures_b2_test, droga_test, drop_test, equipment_test, ladowacz_test, notify

**A1. Domyślny start (Map003 przez kit):** cat_f9_test, krawedzie_zrzuty, latarnie_zdjecia_test, mapa_probna_wydajnosc, mapa_probna_zblizenia, menu_lista_test, nazwy_map_test, swiat_przejscia_test, swiat_styki_test, swiat_styki_zrzuty, swiat_szwy_zrzuty, title_test, ubior_bron_test, ubior_dane_test, ubior_maski_test, ubior_pl_test, ubior_proba_test, ubior_test, watki_test, wzgorza_galeria, wzgorza_obiekty, wzgorza_ukrycie, wzgorza_zrzuty

**B. Mechanika na „placu zabaw” (w nawiasie użyte stare mapy):** atmosphere_test(3), bear_test(4), birds_test(3), boar_flee_test(3), boar_test(3), bough_test(3), bramy_zdjecia_test(8), bron_dane_test(3), bubbles_test(1), bucket_test(3), buildings_contract_test(3), carcass_test(4), cauldron_pit_test(3), character_shadow_test(3), clay_pot_test(3), combat_balance(4), combat_mode_test(4), combat_test(3), core_test(3,4), craft_test(3), creatures_test(4), dawcy_miasto_test(1,8), debug_menu_test(3,8), dishes_test(3), dog_test(3), fire_fuel_test(3), fire_shadow_test(3), fire_test(3), flip_test(3), forest_fight_test(3), forest_test(3), fruit_tree_test(3), gain_feed_test(3), hammer_test(3), hero_look_test(3), hero_menu_test(3), historyjki_test(8), hold_build_test(3), hold_gather_test(3), hud_fade_test(3), hunting_test(3), hut_test(3,100), huta_test(3), iron_craft_test(3), iron_only_test(3), iron_test(3), jacket_test(3), jakosc_grafiki_test(3), jarmark_perf(8), jarmark_test(8), journal_test(3), keys_test(3,100), knights_garden_test(8), konie_test(8), laka_test(1), laki_przejscia_test(3), lancuchy_test(8), lie_down_test(3), life_test(3), lock_test(3), majster_perf(8), mapa_woz_test(8), marathon_test(3), menu_height_test(3), menu_panel_test(3), menu_test(3), minimap_test(1,3,100), morze_zdjecia2(4), move_test(3), needs_test(3), ore_test(3), pantry_fresh_test(3), pick_test(3), place_test(3), poczta_test(8), poczta_warianty_test(8), poczta_wydajnosc_test(8), podroznicy_sprawy_test(8), pokoje_mapy_test(1), pokoje_test(1), poselstwo_test(8), pot_test(3), przytulna_test(1), puddles_test(3), rabbit_hop_test(3), region_layers_test(1,8), regulars_quests_test(1,8), regulars_test(1), rock_shadow_test(3), run(3), run_test(3), save_notice_test(3), shadows_test(3), shelter_test(3), shoot_anim_test(3), sit_test(3), site_test(3), skills_test(3), sky_fx_test(3), sky_test(3), sleep_danger_test(3), snare_lure_test(3), sneak_attack_test(4), stage1_test(3,4,100), station_ready_test(3), storm_test(2,3), summary_test(3), sunrays_test(3), survival_test(3), swing_test(3), sygnaly_perf(8), sygnaly_zdjecia(8), sylwetki_test(8), tavern_dice_test(1), tavern_shift_test(1), tent_test(3), tired_test(3), torch_test(4), town_interiors_test(8), town_quests_test(3,4,8), town_well_test(8), tree_frames_test(3), tree_see_through_test(3,8), tree_shadow_test(3), tree_strike_test(3), w9_rywal_test(9), waterfall_test(8), wesele_test(1), widok_test(4), wild_veg_test(3), wolves_test(4), workbench_test(2,3), world_test(3), yard_site_test(3), yard_test(3,4), zwierzeta_ludzie_test(4)

**C. Związane ze starymi miejscami i wątkami:** act2_quests_test, act3_test, autopilot_fabula_test, cienie_test, clean_hud_test, combat_feel_test, core_fixtures_test, cysterna_test, east_gate_test, field_loss_test, garnizon_test, goraczka_perf, goraczka_test, goscie_sala_test, heart_test, home_ambience_test, home_decor_test, home_life_test, humans_test, intrygi_test, kleofas_kaplica_test, kopalnia_test, krawedzie_test, kruk_test, latarnia_test, light_shadow_test, lowy_test, ludzie_test, majster_smoke, majster_test, manor_test, mapa_probna_zrzuty, meble_ruch_test, miasto_mieszkancy_test, mood_test, morze_dbg, morze_galeria, morze_profil, morze_profil2, morze_profil3, morze_profil4, morze_smoke, morze_test, morze_watek_test, morze_wydajnosc, morze_zdjecia, most_zdjecia_test, motyle_test, mountain_places_test, okolice_integracja_test, okolice_szkielet_test, orzel_test, osada_huts_test, osada_laka_test, poczta_swiatlo_test, podgrodzie_life_test, podgrodzie_mieszkancy_test, podgrodzie_quests_test, podgrodzie_test, podroznicy_test, prologue_test, przedmioty_px_test, przejscie_ciagiem_test, przystan_test, pustelnia_test, quest_board_test, quest_places_test, questy_mapa_test, questy_pustelnia_test, red_water_test, rozmowy_test, se_cache_test, stajnia_test, story_test, swiat_etap1_test, swiat_etap2_test, swiat_etap2b_test, swiat_etap3_test, sygnaly_dbg_tmp, sygnaly_swiatlo, sygnaly_test, talk_busts_test, tavern_interior_test, tavern_life_save_test, tavern_life_test, tavern_plan_test, town_life_test, town_quests2_test, underground_test, w1_chapters_test, w2_archive_test, w4_borgar_test, w4_key_test, w5_test, w6_test, w7_test, w8_mountains_test, wezwanie_test, wrak_test, wydajnosc_test, wyspa_szkielet_test, wyspy_test, wzgorza_pora_test, wzgorza_ruch_test, wzgorza_test, za_wzgorzem_test, zakon_test, zasoby_test

### Testy jednostkowe `tests/unit/*.test.js` (bez przeglądarki)

Prawie wszystkie świat-obojętne (logika danych i wzorów): bron_data, combat, combat_formulas, combat_gear, core, durability, equipment, farming_data, map_flags, needs, path8, quest_board, skills_data, sky, spoilage, talk, tavern_dice, tavern_life, ubior_data, watki. Z numerami starych map: choppable_tree (3), core_map (3,4), foes_data (5,6,8,21), mapa (5), mood (1,3), podroznicy (1), underground (11,130,140,141,146). Podziemia i podróżni zależą od decyzji o Głębiach i tawernie.

Pozostałe katalogi testów: `tests/autopilot`, `tests/autopilot_fabula` (przejście fabuły starego świata - do archiwum razem z wątkami), `tests/fixtures` (zapisy gry ze starym układem - po przełączeniu przestarzałe), `tests/lib/mapa.js` (kontrola map; zasady `docs/MAPY_ZASADY.md` zostają).
