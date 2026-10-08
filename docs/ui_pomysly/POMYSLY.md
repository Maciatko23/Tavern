# Pięć pomysłów na nowy wygląd interfejsu

Makiety do wyboru (2026-10-07). Nic w grze nie jest zmienione, to tylko obrazki.

- **Tło:** prawdziwe zrzuty z gry (zapis `day40_farm`: pole dziadka, dzień 40, lato, 11:05).
- **Dane na makietach:** z tego zapisu, czyli prawdziwy plecak, cele z dziennika, poziom 6 i dług 1250/2500.
- **Ikony:** z `img/system/IconSet.png`. Serce i kondycja straciły granatową ramkę RTP, a ikony menu w pomyśle 4 zielone tło.
- **Popiersie:** `img/pictures/Hero_Bust.png`.
- **Rozmiar:** każda makieta ma 1280x720, jak ekran gry.

Porównanie wszystkich pięciu obok obecnego wyglądu jest w `zestawienie.png`.

| # | nazwa | HUD na mapie | okno |
|---|---|---|---|
| 1 | Kronika (pergamin i atrament) | `pomysl_1_kronika_hud.png` | dziennik jako otwarta księga: `pomysl_1_kronika_okno.png` |
| 2 | Kuźnia (kute żelazo i żar) | `pomysl_2_kuznia_hud.png` | plecak jako siatka przegródek: `pomysl_2_kuznia_okno.png` |
| 3 | Zakon (kamień, runy, kruk) | `pomysl_3_zakon_hud.png` | menu P (Postać) jako kamienna tablica: `pomysl_3_zakon_okno.png` |
| 4 | Czysty widok (nic nie zasłania) | `pomysl_4_czysty_hud.png` | menu P jako pierścień wokół bohatera: `pomysl_4_czysty_okno.png` |
| 5 | Torba wędrowca (skóra, len, szwy) | `pomysl_5_torba_hud.png` | plecak jako otwarta torba: `pomysl_5_torba_okno.png` |

**O czcionkach:** we wrześniu zostawiłeś Alegreya Sans („czcionka musi być ta co poprzednio”). Każdy pomysł może ją zachować w zwykłym tekście. Czcionka z makiety pokazuje tylko charakter pomysłu, najmocniej w nagłówkach. Wszystkie nowe czcionki pochodzą z Google Fonts (licencja OFL) i mają polskie znaki. Ich pliki są w `tools/ui_pomysly/fonts/`.

---

## 1. Kronika: pergamin i atrament

**Idea.** HUD to notatki na skrawkach pergaminu z przypalonymi brzegami:

- Zegar to atramentowa tarcza 24-godzinna ze słońcem; noc jest zakreskowana.
- Paski to ramki kreślone piórem, wypełnione kolorowym atramentem.
- Cel jest przypięty czerwoną woskową pieczęcią.
- Mapa jest narysowana sepią z różą wiatrów.

Dziennik to otwarta księga: zakładki-wstążki, czerwone nagłówki, iluminowany inicjał, odhaczanie piórem.

- **Paleta:** pergamin `#efdeb4` / `#c9aa74`, atrament `#2e2014`, czerwień `#9b2a1e`, błękit inicjału `#2d4a7a`, złoto `#c99a2e`.
- **Czcionka:** Pirata One (nagłówki, gotyk) + Alegreya (szeryfowa).
- **Ramki:** poszarpany pergamin z ciemnym brzegiem 1 px, woskowe pieczęcie, mosiężne narożniki księgi.
- **Wskaźniki:** kreskowane paski z podziałką co 25%; brak wody sygnalizuje czerwony wykrzyknik.

**Plusy:**
- Najbardziej „średniowieczny” i opowieściowy; świetnie pasuje do gry, w której dziennik, cele i notatki są ważne.
- Dziennik jako księga od razu wygląda jak przedmiot ze świata gry.

**Minusy:**
- Jasne panele mocno odcinają się od ciemnych nocy i wnętrz; na śniegu zlewają się z tłem.
- Odwracają kolory tekstu w całej grze: dziś jasny tekst na ciemnym tle, potem ciemny na jasnym. Kolory komunikatów (zielony, czerwony, niebieski) trzeba dobrać od nowa.
- Gotyk w nagłówkach jest mniej czytelny.

**Koszt:** duży, około 3–4 dni pracy agenta.
- Nowa skórka okien: poszarpane brzegi jako 9-slice.
- `UIStyle` w `UITheme.js` z odwróconą paletą, a za nim wszystkie wtyczki rysujące tekst (SurvivalHUD, Needs, Journal, Minimap, MenuPanel, Survival, Dog, TavernLife_Render).
- Nowy układ dziennika na dwie strony (`Journal.js` i `MenuPanel.js`).
- Zegar 24-godzinny.
- Pergamin częściowo już jest (tablica zleceń, `TawernaUI.js`).

---

## 2. Kuźnia: kute żelazo i żar

**Idea.** Rozwinięcie obecnego stylu czarno-żółtego, który wybrałeś we wrześniu, tyle że zamiast „nowoczesnego” jest kuty:

- Panele to czarne kute płyty: faza 1 px, nity, gorące żółto-pomarańczowe narożniki.
- Paski świecą jak rozgrzany metal, w barwach nalotowych stali: czerwień, słoma, brąz i błękit hartowania. Podzielone są na ogniwa, a wypełnienie ma rozżarzony koniec.
- Zegar dalej jest analogowy, ale w żelaznym pierścieniu.
- Nazwa miejsca wisi na szyldzie na łańcuchach.

Plecak to siatka przegródek: ilość w rogu, kropka świeżości, opis z boku.

- **Paleta:** żelazo `#16181b` / `#30343a`, nity `#7d838d`, żółć `#ffd23f`, żar `#ff8a1f`, tekst `#ece4d4`.
- **Czcionka:** Jersey 10 (pikselowa, ostra w rozmiarach 20, 30 i 40). Można zostać przy Alegreya Sans.
- **Ramki:** fazowane płyty z nitami i gorącymi narożnikami (dziś są to żółte narożniki).
- **Wskaźniki:** pasma w trzech tonach z podziałką co 10 px; brakująca woda ma czerwoną obwódkę.

**Plusy:**
- Najbliżej tego, co już działa i co wybrałeś: ciemno, czytelnie, żółte akcenty.
- Najmniej pracy i najmniejsze ryzyko.
- Wygląda jak pikselowa grafika z gry (1 px, obrys).
- Siatka w plecaku lepiej mieści dużo rzeczy niż dzisiejsza lista.

**Minusy:**
- Najmniej „nowy”, bo to raczej ewolucja niż zmiana klimatu.
- Czcionka pikselowa nie pasuje do wygładzonego tekstu dymków i popiersi (dlatego jest opcjonalna).
- Siatka pokazuje mniej nazw naraz: nazwę widać tylko przy zaznaczonej rzeczy.

**Koszt:** mały do średniego, około 1–2 dni.
- `Window.png`, `ButtonSet.png` i `Clock.png`.
- Rysowanie `UIStyle.panel` / `bar` / `chip` w `UITheme.js`: jedno źródło, a z niego korzysta 8 wtyczek.
- Nowy układ `Scene_Item` w `MenuPanel.js`: siatka zamiast listy.
- Czcionka pikselowa to jeden parametr UITheme plus sprawdzenie szerokości napisów.
- Testy położenia HUD (`hud_fade`, `gain_feed`, `menu_panel`, `needs`) prawie bez zmian.

---

## 3. Zakon: kamień Twierdzy, runy i kruk

**Idea.** Interfejs wygląda jak wykuty przez zakon, który strzegł Serca:

- Panele są z szarego kamienia z rytą bordiurą.
- Akcent to turkusowy blask Serca.
- Zegar to kamienna tarcza z runami: w środku świeci Serce, a po pierścieniu wędruje słońce (24 h, niebo dzień i noc).
- Minimapa jest okrągła, w kamiennym pierścieniu z kierunkami.
- Doświadczenie to rząd run, które zapalają się kolejno; poziom pisany rzymsko w sześciokątnym kamieniu.

Menu P to tablica z godłem kruka: bohater w ostrołukowym oknie, paski jak rynny z płynem, narzędzia w kamiennych gniazdach.

- **Paleta:** kamień `#3c4148` / `#1d1f23`, turkus `#45d3c2` / `#a8fff2`, kość `#e8e4d8`, karmin `#d23a3a`.
- **Czcionka:** Cinzel (ryte kapitaliki w nagłówkach) + Alegreya Sans (tekst).
- **Ramki:** kamienne płyty z fazą i rytą linią, pęknięcia, godło kruka z Sercem (PixelLab, 2 generacje, `tools/ui_pomysly/art/`).
- **Wskaźniki:** rynny z płynem i połyskiem; runy XP.

**Plusy:**
- Najmocniej związany z fabułą: Serce Twierdzy, zakon, kruk, podziemia.
- Wyróżnia grę.
- Okrągła minimapa wokół bohatera i tarcza dnia są czytelne.
- Turkus nie gryzie się z zielenią map.

**Minusy:**
- Chłodny, „rycerski” klimat słabiej pasuje do biednego chłopa na początku gry.
- Kamień jest ciężki wizualnie, więc panele muszą być małe.
- Runy w poleceniach menu trzeba się nauczyć (dlatego obok jest napis).

**Koszt:** średni, około 2–3 dni.
- Kamienna skórka i `UIStyle`.
- Tarcza z Sercem (SurvivalHUD).
- Okrągła minimapa w `Minimap.js`: maska koła i wycinek wokół bohatera zamiast całej mapy.
- Pasek XP z run (`Combat_UI.js`).
- Nowa karta postaci w `MenuPanel.js`: łuk, gniazda.
- Godło już jest.
- Ciekawostka: dziś menu P pokazuje stare anime-popiersie „Reid” z RTP zamiast `Hero_Bust`. Ten pomysł używa `Hero_Bust`.

---

## 4. Czysty widok: nic nie zasłania

**Idea.** Bez paneli: sam tekst z ciemnym obrysem i lekkie przyciemnienie przy górnej i dolnej krawędzi ekranu.

- **Lewy górny róg:** godzina, mały łuk słońca i aktualny cel w jednej linijce.
- **Góra ekranu:** kompas ze znacznikiem celu („Tawerna · 140 kroków”) zamiast minimapy, którą pokazuje się klawiszem M. Pod kompasem nazwa miejsca, która gaśnie po wejściu.
- **Potrzeby:** cienkie paski w lewym dolnym rogu. Łuk pod stopami bohatera pojawia się tylko wtedy, gdy coś spada, a myśl („Chce ci się pić…”) jest bez dymka.
- **Zdobycze:** sam tekst, starsze bledną.
- **Doświadczenie:** kreska przy dolnej krawędzi ekranu.

Menu P to pierścień 6 ikon wokół bohatera; mapa zostaje widoczna. Po lewej „kim jestem” (paski z liczbami, dług), po prawej podgląd zawartości plecaka.

- **Paleta:** biel `#f6f2ea` z czarnym obrysem; akcent `#ffd23f`; paski `#ff6b5e`, `#8fe06a`, `#ffb84a`, `#5ab8ff`.
- **Czcionka:** Alegreya Sans, czyli obecna, bez zmian.
- **Ramki:** brak; tylko kółka przycisków w pierścieniu.
- **Wskaźniki:** cienkie paski 5 px, łuk przy stopach, kompas.

**Plusy:**
- Widać najwięcej mapy, a gra jest przecież ładna.
- Najbardziej nowoczesny i „filmowy”.
- Kompas z celem odpowiada na częste pytanie „gdzie mam iść”.
- Pierścień menu nie zasłania świata.
- Czcionka zostaje.

**Minusy:**
- Na jasnych miejscach (śnieg, piasek, burza z błyskami) tekst bez panelu jest mniej czytelny. Obrys i przyciemnienie krawędzi pomagają, ale nie zawsze.
- Mniej informacji naraz.
- Kompas wymaga nowych danych: cele dziennika nie znają dziś swojego miejsca na mapie.
- Plecak i dziennik dalej potrzebują zwykłych okien (pierścień zastępuje tylko menu P).

**Koszt:** średni, około 2–3 dni, ale więcej logiki niż grafiki.
- Kompas i kierunek do celu: tablica cel → mapa i pole, plus znaczniki zleceń.
- Łuk pod bohaterem (nowy sprite w spritesecie).
- Pokazywanie i chowanie HUD „gdy potrzeba”.
- Nowa scena menu-pierścienia zamiast panelu P.
- Minimapa domyślnie ukryta.
- Zmienią się testy położeń (`hud_fade`, `minimap`, `menu_panel`).

---

## 5. Torba wędrowca: skóra, len i szwy

**Idea.** Bieda i przetrwanie: wszystko jest uszyte z tego, co bohater ma.

- **Materiały:** łatana skóra z jasnym ściegiem, surowy len, mosiężne nity, łata z wyblakłego granatu.
- **Paski:** pasy płótna farbowane roślinami (marzanna, rezeda, szafran, urzet), przyszyte ściegiem; koniec jest postrzępiony.
- **Zegar:** okienko z niebem w mosiężnym pierścieniu (słońce na łuku, chmura, wzgórza ze świerkami).
- **Na sznurkach:** nazwa miejsca i zdobycze to lniane metki.
- **Cel:** przypięty szpilką.
- **Doświadczenie:** rzemień ze sprzączką przeszyty nicią do 72%.

Plecak to otwarta torba: klapa ze sprzączką, lniana podszewka z listą, igła z czerwoną nitką wskazuje wybraną rzecz, a obok przyszyta metka z opisem.

- **Paleta:** skóra `#4f3320` / `#86603f`, len `#c4b593`, marzanna `#a8443a`, rezeda `#6e7e3c`, urzet `#45608a`, mosiądz `#c09a42`.
- **Czcionka:** Kalam (odręczna, czytelna); w liczbach i strzałkach Alegreya Sans.
- **Ramki:** skóra z przeszyciem, len z postrzępionym brzegiem, metki z oczkiem.
- **Wskaźniki:** pasy płótna; brak wody jest najkrótszym pasem (można dodać mruganie ściegu).

**Plusy:**
- Najlepiej opowiada historię biednego chłopa, który wszystko robi sam.
- Ciepły i swojski; pasuje do bielonej chaty, rzemiosła i garbarni.
- Wyraźnie inny od obecnego.
- Okienko nieba mówi o porze dnia i pogodzie bez czytania.

**Minusy:**
- Najwięcej grafiki do zrobienia i utrzymania. Okienko nieba potrzebuje wersji noc, deszcz, śnieg, burza i pór roku.
- Pismo odręczne męczy w długich listach i przy liczbach.
- Brązy blisko drewna budynków i ziemi; trzeba pilnować kontrastu.

**Koszt:** duży, około 3–4 dni.
- Tekstury skóry i lnu jako 9-slice.
- Metki, sprzączki, szwy.
- `UIStyle` (panel, bar, chip).
- Okienko nieba w wielu wersjach.
- Nowy układ plecaka w `MenuPanel.js`.
- Strzałki i liczby osobną czcionką.

---

## Rekomendacja

**Polecam pomysł 2, „Kuźnię”, jako podstawę:**
- Zostaje to, co już wybrałeś i co działa (ciemno, czytelnie, żółte akcenty, Alegreya Sans w tekście), a interfejs zyskuje średniowieczny, rzemieślniczy charakter: kute żelazo, nity, paski jak rozgrzany metal.
- Kosztuje najmniej i najmniej ryzykuje.
- Siatka w plecaku przyda się, bo rzeczy w grze jest coraz więcej.

Do tej podstawy dobrze pasują trzy pojedyncze elementy z innych pomysłów, bo nie zmieniają całego stylu:
- **dziennik jako księga** z pomysłu 1, czyli przedmiot ze świata gry;
- **okrągła minimapa wokół bohatera** z pomysłu 3;
- **kompas z kierunkiem do celu** z pomysłu 4.

Jeśli chcesz wyraźnej zmiany klimatu, wybierz **5, „Torbę wędrowcy”**. Najlepiej pasuje do opowieści o biedzie i przetrwaniu, ale to najwięcej pracy.

## Pliki

- `tools/ui_pomysly/`:
  - `capture.js` robi zrzuty z gry przez zestaw testowy, port CDP 9482: `CDP_PORT=9482 node tools/ui_pomysly/capture.js`.
  - `uikit.py` to wspólne narzędzia: tła, ikony, wycinanie ramek RTP, tekstury, maski, `Over` do półprzezroczystości.
  - `pomysl1_kronika.py` … `pomysl5_torba.py` i `zestawienie.py` (uruchamiane z tego folderu, `python pomyslN_….py`).
- `tools/ui_pomysly/zrzuty/`: tła (`mapa_hud.png`, `mapa_bez_hud.png`, `menu_p.png`, `plecak.png`, `dziennik.png`) i dane zapisu.
- `tools/ui_pomysly/fonts/`: pobrane czcionki Google Fonts (OFL) i `probka.png` z polskimi znakami.
- `tools/ui_pomysly/art/`: `kruk_godlo.png` (godło 64x64) i `kruk_bok.png` (kruk z boku 48x48, nieużyty), oba z PixelLab, w sumie 2 generacje.
