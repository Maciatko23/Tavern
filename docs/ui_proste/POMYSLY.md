# Menu P – proste propozycje (2026-10-22)

Prośba: „trzeba przebudować UI menu, ma być prosty i przyciski O jako wejście i P jako wyjście, zrób kilka prostych przykładów”.
Wybrana „Lista v2” jest już w grze (sekcja „W grze” na końcu); pozostałe propozycje to tylko makiety.

**Zestawienie wszystkiego:** `wszystkie.png` (obecne menu + 4 propozycje w miniaturach).

## Wspólne zasady (wszystkie 4)

- **O** = wejdź / wybierz / użyj, **P** = wyjdź / wróć poziom wyżej (z głównego ekranu P zamyka menu).
- Najwyżej **2 poziomy**: ekran główny (7 pozycji) → widok. Nie ma podzakładek ani warstw z miedzianą obwódką.
  Zaznaczenie to zawsze **wypełniony pasek / kafel** (miedź), a nie ramka.
- Ruch: strzałki albo **W/S**; **A/D** tylko tam, gdzie jest siatka (kafelki, pasek, figura z miejscami, siatka plecaka).
- Na dole każdego ekranu stały pasek klawiszy: `O wybierz   P wróć` + 1–2 klawisze danego widoku (np. `X wyrzuć`).
- 7 pozycji: **Postać, Umiejętności, Plecak, Dziennik, Opcje, Zapisz grę, Wyjdź**.
  - Postać = statystyki **i** ekwipunek na jednym ekranie (figura z 11 miejscami: głowa, tors, rękawice, pas, nogi, stopy
    po lewej; płaszcz, plecy, prawa ręka, lewa ręka, dodatek po prawej). O na miejscu pokazuje obok listę rzeczy do założenia
    (O załóż, P z powrotem do figury), X zdejmuje.
  - Umiejętności wychodzą z Postaci na wierzch (dziś są jej trzecią podzakładką).
  - Plecak bez osobnego paska kategorii: jedna lista z nagłówkami grup (jak dziś), Tab dalej zmienia porządek.
  - Dziennik ma 10 działów (Cele, Surowce, Budynki…): w widoku dział zmienia się A/D (nagłówek „‹ Cele ›”), W/S po wpisach.
    To samo w Umiejętnościach: A/D = dziedzina (10), W/S po umiejętnościach, O = naucz się.
- Duże napisy: Alegreya Sans (czcionka gry), pozycje menu 32–40 px, tekst 21–24 px. Ikony z `img/system/IconSet.png`,
  bohater ubrany tak, jak go rysuje gra (Ubior.js: koszula, spodnie, łapcie, pas), ekran 1280 × 720.
- Dane prawdziwe: nowa gra (dzień 1, Dom dziadka), do której test dodał rzeczy z pierwszych dni (kamienie, gałęzie, jedzenie,
  siekiera, nóż, ubranie, 14 G) – żeby plecak i figura nie były puste. Zrzuty obecnego menu są z tej samej gry.

## Teraz – obecne menu (dla porównania)

`obecne_postac_poziom1.png`, `obecne_postac.png`, `obecne_postac_ekwipunek.png`, `obecne_postac_umiejetnosci.png`,
`obecne_plecak.png`, `obecne_dziennik.png`, `obecne_opcje.png`, `obecne_zapisz.png`, `obecne_zakoncz.png`
(+ `_poziom1` = pasek zakładek). Trzy poziomy: zakładki (A/D) → podzakładki (Statystyki / Ekwipunek / Umiejętności,
kategorie plecaka, działy dziennika) → zawartość; aktywna warstwa ma miedzianą obwódkę, reszta jest przygaszona.

---

## 1. Lista – `propozycja_1_lista_glowne.png`, `propozycja_1_lista_widok.png`

**Jak:** po lewej pionowa lista 7 pozycji (ikona 64 px + duży napis), po prawej podgląd zaznaczonej
(np. Postać: popiersie, poziom, 4 potrzeby, co ma na sobie, sakiewka, dług). W/S po liście, **O** – podgląd staje się
widokiem na całym prawym polu (lista zostaje, przygaszona, z zaznaczoną pozycją), **P** – z powrotem na listę, drugie P – do gry.

**Dla kogo:** dla każdego – najłatwiej się nauczyć; zawsze widać, gdzie się jest (lewa strona = poziom 1, prawa = poziom 2).

- \+ Najprostsza: jedna kolumna, jeden kierunek (W/S), widać oba poziomy naraz.
- \+ Podgląd bez wchodzenia (stan postaci, cel, obciążenie plecaka) – często wystarczy rzut oka.
- \+ Najbliżej obecnego kodu: widoki już mieszczą się w panelu, prawe pole (800 px) jest tylko węższe od dzisiejszego (1088).
- − Widok ma mniej miejsca (lista zabiera 380 px) – plecak jako lista z nazwami (czytelna, ale przewija się), nie wielka siatka.
- − Najmniej „efektowna”.

**Praca:** ~1,5 dnia + testy.

## 2. Kafelki – `propozycja_2_kafelki_glowne.png`, `propozycja_2_kafelki_widok.png`

**Jak:** 7 dużych kafli na środku (4 u góry, 3 pod spodem), na każdym ikona 96 px, nazwa i jedna linijka
(„17 rzeczy · 9 / 130”, „8 / 77 celów”). W/S/A/D po kaflach, **O** otwiera pełny ekran, **P** wraca do kafli.

**Dla kogo:** dla grających na padzie / jak w grach konsolowych; dla tych, którzy wolą duże cele do trafienia.

- \+ Bardzo czytelne, duże; każdy widok dostaje cały ekran (Postać: figura i statystyki obok siebie bez ścisku).
- \+ Kafel może podpowiadać (punkty do rozdania, cel, obciążenie).
- − Po wejściu nie widać menu – trzeba pamiętać, że P wraca do kafli.
- − Dwa wymiary ruchu (W/S/A/D) zamiast jednego.

**Praca:** ~1,5–2 dni + testy (widoki w pełnym oknie to prawie dzisiejszy panel 1088 × 560 – przenoszą się niemal 1:1).

## 3. Pasek – `propozycja_3_pasek_glowne.png`, `propozycja_3_pasek_widok.png`

**Jak:** gra zostaje widoczna (lekko przyciemniona), na dole pasek 7 ikon z podpisami; nad zaznaczoną dymek z nazwą
i jedną linijką. A/D (albo W/S) po pasku, **O** otwiera panel nad paskiem (pasek zostaje, pozycja przygaszona), **P** zamyka panel,
drugie P – menu.

**Dla kogo:** dla tych, którzy chcą szybko coś zjeść / zmienić i wrócić do gry, nie tracąc z oczu mapy.

- \+ Najlżejsze – gra cały czas widoczna, menu „w grze”, nie „zamiast gry”.
- \+ Plecak jako siatka dużych ikon z liczbami – szybki.
- − Panel ma tylko ~1060 × 460 px: Postać i Dziennik trzeba ułożyć ciaśniej (opis rzeczy idzie pod siatkę).
- − Mniej miejsca na napisy przy ikonach paska (podpisy 19 px).
- − Gra pod spodem musi być narysowana (dziś menu bierze nieruchome tło mapy – zostanie, tylko jaśniejsze).

**Praca:** ~2–2,5 dnia + testy (nowe, zwarte układy Postaci, Dziennika i Umiejętności).

## 4. Księga – `propozycja_4_ksiega_glowne.png`, `propozycja_4_ksiega_widok.png`

**Jak:** rozłożona księga (pergamin, atrament, czerwień rubryk – bez ozdobników). Po lewej spis 7 rozdziałów
(I–VII), po prawej strona zaznaczonego (np. Dziennik: przypięty cel i inne cele). W/S po spisie, **O** otwiera rozdział
na obu stronach (Postać: figura po lewej, statystyki po prawej), **P** wraca do spisu, drugie P – do gry.

**Dla kogo:** dla tych, którzy chcą klimatu – pasuje do dziennika, dziadka, wyspy; spokojna i czytelna.

- \+ Najbardziej „nasza” – wygląda jak część świata, nie jak nakładka.
- \+ Ma ten sam układ co Lista (spis po lewej, strona po prawej) – nauka ta sama.
- − Jasne strony: każdy przeniesiony widok trzeba przemalować na atrament (dziś teksty mają kolory na ciemne tło).
- − Najwięcej pracy; jasny ekran w nocy może razić (można przyciemnić papier wieczorem).

**Praca:** ~3 dni + testy (ta sama logika co w Liście + skórka „papier” dla list plecaka, dziennika, opcji, zapisu).

---

## Co z obecnego menu da się zostawić (wszystkie propozycje)

Zostaje (przenosi się do nowych widoków, MenuRing.js):
- **Plecak:** lista / siatka z nagłówkami grup, porządek (Tab: Grupy / Nazwa / Ilość / Najnowsze), karta rzeczy
  (świeżość, „po zjedzeniu”), użycie na O, wyrzucanie X z pytaniem o ilość i tobołek na ziemi (Drops.js), pamiątki.
- **Dziennik:** działy z `Journal.TAB_DEFS`, lista i opis (Window_JournalList / Window_JournalDetail), przypinanie celu, klawisz J.
- **Opcje:** okno OptionEx z całą listą (Wygląd, efekty Mood.js, głośności…).
- **Zapis:** `Window_SavefileList` i karta pliku `drawSaveCard()` (popiersie, dzień, miejsce, czas gry).
- **Wyjdź:** dzisiejsze pytanie (do ekranu tytułowego / wyjdź z gry / anuluj).
- **Ekwipunek:** dane z Equipment.js (`slots()`, `choices()`, `equip()` / `unequip()`), figura z ubiorem (Ubior.js),
  lista wyboru po prawej; **Statystyki:** `Combat.fightInfo()`, `defenseInfo()`, `attrInfo()`; **Umiejętności:** okna Combat_UI.

Do zmiany:
- nawigacja Scene_Menu: 3 poziomy (`_level`, pasek zakładek, pasek podzakładek, `outlineWhenActive`, `View.look`) → 2 poziomy;
- pasek zakładek → lista / kafle / pasek / spis (zależnie od wyboru);
- Postać: StatsView + EquipView w jeden ekran, SkillsView jako osobna pozycja;
- Plecak: bez okna kategorii (`Window_ItemCategory`), tylko nagłówki grup;
- pasek klawiszy: stały wzór „O … P …” zamiast `levelKeys()` dla trzech poziomów;
- testy: `menu_grafit_test` (106 sprawdzeń, przepisać na 2 poziomy), `equipment_test`, `drop_test`, `keys_test`, `journal_test` (J).
- Wygląd „Klasyczny” (Opcje → Wygląd) może zostać bez zmian.

## Rekomendacja

**1. Lista.** Jest najprostsza do nauczenia (jeden kierunek, zawsze widać oba poziomy), najbliżej obecnego kodu (najmniej pracy
i ryzyka) i od razu spełnia „O wchodzi, P wychodzi”. Ponieważ Księga ma dokładnie ten sam układ (spis po lewej, strona po prawej),
**Księgę można dołożyć później jako drugi wygląd tej samej Listy** (Opcje → Wygląd), gdyby zabrakło klimatu.

## Skrypty

`tools/ui_proste/`: `capture_obecne.js` (zrzuty obecnego menu + dane, CDP 9578), `capture_bohater.js` (ubrany Hero_Walk
i popiersie z gry), `kit.py` + `widoki.py` (wspólne), `p1_lista.py` … `p4_ksiega.py`, `zestawienie.py`.

---

## Lista v2 (wybrana, 2026-10-22)

Użytkownik: „ta lista jest nawet ok, ale nie powinno być w postaci na sobie, tylko oddzielnie okno ekwipunku, ładnie całego”.

- `lista_v2_glowne.png`: lista ma 8 pozycji (Postać, **Ekwipunek**, Umiejętności, Plecak, Dziennik, Opcje, Zapisz grę, Wyjdź).
  Ikona Ekwipunku to skórzana kurtka z IconSet (435). Postać nie ma już rzędu „na sobie”. Są: popiersie, imię, poziom,
  4 paski, sakiewka, dług dziadka, Opinia w miasteczku (10 · Obcy), atrybuty i walka. W środku Postaci W/S chodzi
  po atrybutach, a O dodaje punkt, gdy są punkty do rozdania.
- `lista_v2_ekwipunek.png`: Ekwipunek to osobne okno na całym prawym polu (lista po lewej przygaszona).
  - Na środku stoi postać w obecnym stroju: arkusz z gry przez Ubior.js, przód, x4.
  - Dookoła 11 miejsc w dwóch siatkach 2 × 3, bez figury pośrodku. „Ubiór”: Głowa, Tors, Rękawice, Pas, Nogi, Stopy.
    „Okrycie i ręce”: Płaszcz, Plecy, Prawa ręka, Lewa ręka, Dodatek.
  - Pod spodem karta zaznaczonego miejsca: rzecz, co daje, zużycie (pasek), waga.
  - Na dole pasek RAZEM: zbroja, ciepło, udźwig, schludność, chód.
  - Klawisze: W/S/A/D po miejscach (to siatka), O wybierz, X zdejmij, **Tab obraca postać** (4 kropki: przód, bok, tył, bok;
    A/D jest zajęte przez miejsca). Postać może też obracać się sama do zaznaczonego miejsca (Plecy: widok z tyłu).
- `lista_v2_ekwipunek_wybor.png`: po O na miejscu (Głowa) pod postacią otwiera się lista rzeczy z torby, które tam pasują,
  oraz „Nic”. Przy każdej jest to, co daje, i waga. Postać od razu pokazuje podgląd (słomkowy kapelusz narysowany przez grę),
  a w komórce widać półprzezroczystą ikonę. W/S rzecz, O załóż, P z powrotem do miejsc.
- `lista_v2_dziennik.png`: dział zmienia się A/D (nagłówek `A ‹ Cele › D`, „dział 1 z 10”), W/S po celach, O przypina.
  Umiejętności działają tak samo: A/D dziedzina, W/S umiejętność, O naucz się.

Dane: ta sama nowa gra co wyżej. Do makiety wyboru test dodał do torby słomkowy kapelusz i filcową czapkę (bohater zdjął
kapelusz, więc głowa jest pusta); zrzut z kapeluszem jest z gry (`tools/ui_proste/capture_kapelusz.js`). Skrypt: `tools/ui_proste/lista_v2.py`.

---

## Poprawki (2026-10-23): `MenuRing.js` v4.1.0 – zakładki u góry

Użytkownik: „ogólnie ten widok, gdzie opcje główne były na górze, był ok … trzeba połączyć jakoś z bieżącym”, „tylko żeby nie było
podzakładek”, „jak się wybiera atrybut, to popup … co dokładnie daje; w ekwipunku też popup”, „opinię – wystarczy napis Obcy”,
„umiejętności bym zrobił drzewko jak w oryginalnym podejściu”.

- Rama: lewej listy już nie ma. U góry rząd 8 zakładek z ikonami (jak stare menu, bez drugiego rzędu), nad nim po prawej dzień,
  pora roku, godzina i miejsce; pod nim jeden panel 1200 px z widokami Listy v2. A/D (←/→) po zakładkach, O wchodzi, P wraca,
  P na zakładkach zamyka. W nagłówku panelu: słowo widoku (np. POSTAĆ) albo jego własny wiersz (działy Dziennika, dziedziny Umiejętności).
- Postać: walka w prawym górnym rogu, pod spodem ATRYBUTY i ODPORNOŚCI. W środku dymek przy wybranym atrybucie: co daje teraz
  i z punktem więcej (Combat.attrInfo). Opinia: samo słowo stopnia („Obcy”, „Bywalec”…).
- Ekwipunek: postać ×5, bez dolnej karty. Dymek obok zaznaczonej komórki (między siatką a postacią; nazwa, opis z gry, co daje,
  zużycie, waga; puste: skąd wziąć). Na liście wyboru dymek wybranej rzeczy nad drugą siatką, ze strzałką do listy. RAZEM na dole.
- Umiejętności: wiersz dziedzin (A/D) → O drzewko dziedziny (węzły według poziomu „poz. 1 / 4 / 10…”, linie zależności,
  znana = miedziana, do nauki = miedziana obwódka, zamknięta = przygaszona) → W/S/A/D po węzłach, O „Nauczyć się? Tak / Nie”,
  P do dziedzin, P do zakładek. Po prawej opis dziedziny albo węzła.
- Nowe zrzuty: `gra_postac_dymek.png`, `gra_ekwipunek_dymek.png`, `gra_umiejetnosci_drzewko.png` (pozostałe `gra_*.png` nadpisane).

## Dziennik: jedna zakładka „Zadania” (2026-10-23)

Użytkownik: „zakładka Cele powinna mieć główne zadania fabuły oraz poboczne, więc tab Miasteczko chyba można wywalić”.

- „Cele” (Journal.js) i „Miasteczko” (TownQuests.js) to teraz jedna, pierwsza zakładka **Zadania** z grupami jak w Plecaku:
  **FABUŁA** (cele Story.js - dług, odkup, schronienie… - i dwa cele „Tajemnic Tawerny”, `main: true`; wątki miasteczka W),
  **POBOCZNE** (przyjęte zadania K i D), **ROZWÓJ** (pozostałe otwarte cele), **MIASTECZKO** (opinia, kalendarz, sygnały dzwonu,
  stali bywalcy - dawne wiersze informacyjne Miasteczka), **UKOŃCZONE** (cele i zadania zakończone, najnowsze u góry, przygaszone).
  Pod listą „w toku N · wykonane M”. Opis po prawej: cel - jak dotąd, zadanie - kroki, nagroda, gdzie i kiedy (TownQuests).
- Jedno śledzenie: O przypina cel albo zadanie (też wątek W), przypięcie jednego odpina resztę - cel dziennika, zadanie
  miasteczka, zlecenie z tablicy i kompas „Okolic” (`Journal.unpinOthers`). Przypięty wpis ma romb. Przypięty cel ma pierwszeństwo
  w okienku celu; nowe zadanie śledzi się samo tylko, gdy nic nie jest przypięte.
- Działy w menu P: Zadania, Zlecenia, Surowce, Notatki, Okolice, Gablotka (Budynki, Receptury, Zapasy dalej ukryte). J otwiera Zadania.
  Wygląd Klasyczny (MenuPanel + ekran Journal.js) też ma Zadania z nagłówkami (pozostałe działy w kolejności Journal.TABS).
- API: `Journal.addQuestSource({ name, items, detail, canPin, pinned, pin })` (TownQuests zgłasza źródło zamiast addTab),
  `Journal.addTrackerSource(fn, { owner, pinned, unpin })`, `Journal.pinnedNow()`, `Journal.pinTask(row)`.
- Zrzuty: `gra_dziennik.png` (Zadania z grupami), `gra_dziennik_zadanie.png` (zaznaczony wątek W1 z opisem).

## HUD: cel pod kompasem ze składnikami (2026-10-23)

Użytkownik: „jak się je przypnie, to można na ekranie gry widzieć nie tylko nazwę zadania, ale też potrzebne i aktualne
składniki? … I czy Cel można dać na prawo pod kompasem? Udźwig można usunąć z ekranu na razie”.

- Okienko celu (CleanHUD.js, `Sprite_CleanGoal`; od układu niżej w lewym górnym rogu) na grafitowej tabliczce: etykieta (CEL / WĄTEK / MIASTECZKO / ZLECENIE / OKOLICE), ikona i tytuł, bieżący krok, potem do 5 wierszy „ikona,
  nazwa, mam/potrzeba” (spełniony zielony z ptaszkiem, brakujący żółty), „+N więcej”, „Gdzie: …” i pasek dla celu z licznikiem
  (dług, odkup). Liczby odświeżają się kilka razy na sekundę. Blednie pod bohaterem jak reszta HUD.
- Dane: `Journal.tracked()` - cel: `Journal.goalNeeds` (przepis z Farming: składniki, narzędzie przepisu, młotek przy budowie,
  miejsce; `count()` celu - Story.js: dług i odkup), zadanie miasteczka: `needRows` kroku, zlecenie: jego wymagania.
  Źródło śledzenia może zwrócić `sub` i `needs: [{ icon, name, have, need }]`.
- Pod zegarem zostaje sama linia pory dnia i plakietki. Udźwig na ekranie ukryty: `SHOW_LOAD = false` w CleanHUD.js
  (true przywraca); mechanika i Plecak bez zmian. Wygląd Klasyczny: stare okienko celu bez zmian.
- Zrzuty: `hud_cel_skladniki.png` (przypięty „Zrób młotek”), `hud_cel_zadanie.png` (K1 z krokiem „Przynieś…”).

## HUD: nowy układ rogów (2026-10-23)

Użytkownik: „okno z celem w lewo u góry w kącie, ładnie; zegar tuż przy kompasie po prawej stronie (niech obydwa są tej samej
wielkości), a okno z paskami stanu gracza pod oknem celu”.

- Lewy górny róg (margines 12 px, jak kompas): okienko celu, pod nim okno pasków (życie, kondycja, sytość, nawodnienie, w walce
  oddech) tej samej szerokości, pod nim plakietki „Tryb walki” i premii. Bez celu paski stoją w samym rogu. Cała kolumna blednie
  pod bohaterem jako jedno.
- Prawy górny róg: zegar (promień 44, jak kompas) tuż z lewej kompasu, w jednej linii; podpis kompasu pod kompasem; pora dnia
  („Poranek · dzień 1 · wiosna”) pod nimi, wyrównana do prawej - pod podpisem kompasu, gdy ten jest. Niżej pochodnia i minimapa (M).
- Wygląd Klasyczny bez zmian (stary panel zegara i pasków w lewym górnym rogu, okienko celu pod minimapą po prawej).
- Zrzuty: `hud_uklad.png` (przypięty cel ze składnikami), `hud_uklad_bez_celu.png`.

## W grze (2026-10-22): `js/plugins/MenuRing.js` v4.0.0 (Lista; rama zmieniona 2026-10-23, wyżej)

Użytkownik: „jest ok, przebuduj w grze”. Menu P w wyglądzie Grafit to teraz Lista v2 (ta sama wtyczka, lista wtyczek bez zmian).
Zrzuty z gry: `gra_postac.png`, `gra_postac_atrybuty.png`, `gra_ekwipunek.png`, `gra_ekwipunek_wybor.png`, `gra_umiejetnosci.png`,
`gra_plecak.png`, `gra_plecak_wyrzuc.png`, `gra_dziennik.png`, `gra_opcje.png`, `gra_zapis.png`, `gra_zapis_pytanie.png`, `gra_wyjdz.png`;
obok makiet: **`gra_vs_makieta.png`** (`tools/ui_proste/gra_vs_makieta.py`). Test: `tests/menu_lista_test.js` (CDP 9579).

- Lista 8 pozycji, po prawej podgląd; W/S po liście, O wchodzi (lista przygaszona, pozycja brązowa), P wraca, P na liście zamyka.
  Inne wtyczki (MenuPanel.addCommand, np. „Plan karczmy”) dopisują się pod listą i otwierają swój ekran. Przy Postaci i
  Umiejętnościach miedziane kółko z liczbą punktów do rozdania. Na dole zawsze pasek klawiszy. Mysz: klik w pozycję = wybór i wejście.
- Postać: jak makieta; w środku W/S po atrybutach, O dodaje punkt (gdy są), „+” przy atrybutach.
- Ekwipunek: jak makieta. Postać to cała klatka przebranego arkusza z gry (×4), Tab obraca (przód, bok, tył, bok); na liście wyboru
  postać od razu nosi wybraną rzecz (`Ubior.tryOn`, nowe w Ubior.js), przy Plecach pokazuje się od tyłu. RAZEM z prawdziwych bonusów
  (Combat.armor, płaszcz i Ubior_Sklepy.bonus("cold"), Ubior_Sklepy.udzwig + plecak, schludność, chód łapci / butów).
  X zdejmuje, prawa ręka = broń trybu walki (bez „Nic”, są pięści), lewa = tarcza / pochodnia. Mysz: najechanie wybiera miejsce, klik otwiera listę.
- Umiejętności: A/D dziedzina („‹ nazwa ›”, „dziedzina 1 z 10”), W/S umiejętności (kółko: znana / w części / do nauki / zamknięta),
  po prawej opis, wymagania (✓ / ×); O pyta „Tak / Nie” i uczy (Combat.learnSkill).
- Plecak: jedna lista z nagłówkami grup (pierwsza „Narzędzia i ubiór”), karta rzeczy jak w makiecie (Masz, Waga, Świeżość, Zużycie,
  opis, „Po zjedzeniu”, „O Zjedz”); O użyj, X wyrzuć (ile, potem Tak / Nie - tobołek, jak dotąd), Tab porządek; „▾ jeszcze N niżej”.
- Dziennik: jak makieta; lista i opis to okna Journal.js (opis w jego wyglądzie Grafit, Shift + W/S przewija). Przypięty cel ma romb.
- Opcje: lista OptionEx (W/S, A/D). Zapisz grę: pliki + karta; O na pustym pliku zapisuje od razu, na zapisanym pyta „Nadpisać?”
  (domyślnie Nie). Wyjdź: Do ekranu tytułowego / Wyjdź z gry / Wróć (+ ostatni zapis pod spodem).
- Usunięte: pasek zakładek, podzakładki (Statystyki / Ekwipunek / Umiejętności, kategorie plecaka, pasek działów dziennika), 3 poziomy,
  miedziane obwódki, siatka kafelków plecaka, figura z liniami do miejsc, panele Obrażenia / Odporności / Opis zaznaczonego, pasek
  Cel / Sakiewka / Dług pod Postacią. Wygląd „Klasyczny” (Opcje → Wygląd) został bez zmian jako zapasowy.
