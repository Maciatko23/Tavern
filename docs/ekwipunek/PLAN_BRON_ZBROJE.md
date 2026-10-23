# Bronie, zbroje, tarcze, dodatki - plan (2026-10-23)

Zlecenie użytkownika: „czy jesteś w stanie dorobić nowe przedmioty do ekwipunku, w tym bronie itd., w dużej ilości i
różnorodności, i sile, i cenie”. Decyzje: nowe rodzaje broni rysowane na istniejących zamachach (bez PixelLab); ok. 100
przedmiotów na start; hełmy i kaptury od razu (więcej miejsca nad głową). Wzór techniczny: ubiór (docs/ekwipunek/PLAN.md,
METODA.md, js/plugins/Ubior.js + Ubior_Data.js, maski img/system/Ubior_Maska_*.png z częścią „narzędzie/broń”).

## 1. Co jest dziś

- Broń wręcz (Combat_Fight.js MELEE): pięści, pałka 156, pochodnia 59, oszczep 154, kamienna/żelazna siekiera 60/115,
  kamienny/żelazny kilof 63/116; dystans (Hunting): proca, łuk. Tarcza: drewniana 155 (SHIELDS). Zbroja: skórzana kurtka 171 (ARMORS).
- Zamachy bohatera (arkusze): Club, Axe/AxeSide, Pick, Spear, Torch, Punch, Sling, Bow (+ blok, przewrót).

## 2. Rodzaje (klucze) i na jakim zamachu

| rodzaj (klucz) | zamach | uwagi |
|---|---|---|
| palka (pałka, maczuga) | Club | warianty materiału |
| buzdygan | Club | nowa głowica rysowana na osi pałki |
| mlot (młot bojowy) | Pick / Club | ciężki, wolny, duże zachwianie |
| miecz | Club (cięcie) | nowe ostrze na osi; jednoręczny |
| sztylet / noz | Punch / Club | szybki, krótki zasięg, krytyk |
| topor (topór bojowy) | Axe | ostrze bojowe zamiast drwalskiego |
| siekiera, kilof | Axe, Pick | narzędzia - warianty materiału (zostają narzędziami) |
| wlocznia (włócznia, oszczep) | Spear | zasięg |
| luk, proca | Bow, Sling | warianty (krótki, długi, refleksyjny; proca skórzana, z rzemieniem) |

Materiały (poziom postaci, przybliżenie siły): drewno / kamień 1-10, brąz 10-25, żelazo 25-45, stal 45-70, rzadkie / zakonne
70-100 (z podziemi). Wygląd materiału = rampa kolorów części „broń” maski (jak ubiór), kształt rodzaju = rysunek broni na osi.

## 3. Zbroje i reszta (klucze miejsc jak w Equipment: glowa, tors, rece, nogi, stopy, plecy, lewa (tarcza), dodatek)

- Głowa: kaptur, czepiec, kapalin, hełm otwarty, hełm z nosalem, hełm zakonny - nad włosami potrzeba miejsca (patrz 5).
- Tors: przeszywanica (pikowana), skórznia, kolczuga, łuska, napierśnik (blacha) - faktura przycięta do części „koszula”.
- Ręce: karwasze skórzane / żelazne; nogi: nagolenniki; stopy: buty okute.
- Tarcze (lewa ręka): drewniana (jest), okuta, okrągła, migdałowa, żelazna, zakonna.
- Dodatki (bez widoku): amulety, pierścienie, talizmany zakonu (bonusy: odporność, oddech, szczęście, nocne widzenie...).
- Unikaty (ok. 10): z nazwą i historią (np. miecz kasztelana, młot Grumów...), z łupów i zadań.

## 4. Liczby i źródła

Ok. 100 rzeczy: ~40 broni, ~35 zbroi i części, 6 tarcz, ~15 dodatków, ~10 unikatów. Każda rzecz: obrażenia, zachwianie,
koszt oddechu / szybkość, zasięg, krytyk, trwałość, waga, cena (lub obrona, ciepło, kara do skradania/oddechu dla ciężkich).
Skąd: kowal Tadek (miasto), kwatermistrz garnizonu, kantor (towar z kontynentu), kucie w kuźni z rudy i sztabek, łupy
(bandyci, najemnicy, bossowie podziemi, skrzynie pięter), nagrody zadań. Numery przedmiotów: od 300 (Items.json), ikony od 576.
Dane: nowe pliki js/plugins/Bron_Data.js (+ logika w Bron.js, jeśli trzeba) - notatki przedmiotów <Bron:rodzaj,material> /
<Zbroja:miejsce,wzor> czytane przez Combat_Fight (MELEE/ARMORS/SHIELDS budowane z danych zamiast list na sztywno).

## 5. Hełmy: miejsce nad głową

Użytkownik wybrał „teraz, z większymi klatkami”. Cel: hełmy, kaptury, kapaliny widać w całości we wszystkich ruchach (chód,
bieg, praca, walka, siedzenie, leżenie, przewrót, jazda na orle, karta postaci, popiersie). Sposób wybiera agent grafiki:
(a) powiększone klatki wszystkich arkuszy bohatera (HeroLook, kotwice stóp bez zmian) albo (b) osobna warstwa nakrycia głowy
nad postacią, nieograniczona klatką - byle efekt był ten sam i nic się nie psuło.

## 6. Kolejność prac

1. Grafika (Ubior.js / nowa część): hełmy (miejsce nad głową), broń na osi zamachu (rodzaje), materiały broni (rampy), faktury
   zbroi, tarcze. Zrzuty z gry każdego rodzaju i materiału.
2. Dane i balans: tabela ~100 rzeczy (docs/ekwipunek/BRON_LISTA.md - do akceptacji użytkownika przed instalacją), statystyki,
   ceny, źródła, przepisy kuźni, łupy, ikony; staging + skrypt instalacji (Items.json, IconSet) przy zamkniętym edytorze.
3. Instalacja koordynatora, testy dotknięte, kopia gry.

## 7. Grafika - zrobione (2026-10-23)

**Hełmy: decyzja.** Wybrany sposób (b) w pewniejszej odmianie: klatki arkuszy, kotwice stóp i wszystkie wtyczki zostają bez zmian.
Hełm składa się w klatce jak kapelusz (Ubior.js: obraz w punkcie zaczepienia na górze włosów, włosy spod niego zdjęte, trzonek broni
przed nim, cień na twarzy), a to, co wystaje nad górną krawędź klatki, trafia do **paska nad głową** arkusza (12 wierszy nad każdą
klatką + 4 górne wiersze klatki, osobny żywy Bitmap). Każdy duszek, który pokazuje przebrany arkusz (bohater w chodzie, ciało zamachu
`_swingBody`, jeździec na orle, kelner w hali), dostaje sam dziecko `Sprite_UbiorHead`, które tuż przed rysowaniem bierze ramkę
rodzica i rysuje nad nią swój kawałek paska. Dziecko sortuje się z rodzicem (drzewa, dachy, warstwy regionów), ma jego
przezroczystość, filtr konturu i lustro; cień słońca liczony z ramki (jak dotąd - korona hełmu w cieniu się nie pojawia, cień i tak
był z pamięci podręcznej po adresie arkusza). Powiększone klatki (a) wymagałyby zmian w HeroLook, ChoppableTree_Swing (komórka 96,
stopy 48/80), tabelach płomienia Torch.js, Orzel_Lot, hali i karcie - odrzucone. Leżąc i w przewrocie hełm obraca się z głową (oś
ciało - głowa, ćwiartki dokładnie, kąt widoku z twarzy); kapelusze i plecak dalej się chowają. Karta postaci (MenuRing.js: figura
o 60 px wyższa w górę, rysuje `Ubior.cellWithHead`), popiersie: osobne obrazki `Ubior_Bust_Helm_*`.

**Pliki.** `js/plugins/Ubior.js` 1.1 (hełmy, zbroje, pasek nad głową, warstwy), `js/plugins/Ubior_Bron.js` (broń i tarcze - NOWY,
**nie ma go w js/plugins.js**: ma stać zaraz pod `Ubior` i pod `Bron_Data`, przed `Bron`), `js/plugins/Ubior_Data.js` (tabele
`RAMPY_ZBROI`, `WZORY_ZBROI`, `WZORY_BRONI`, `WZORY_TARCZ`; `WZORY` ubrań bez zmian), `js/plugins/MenuRing.js` (figura karty).
Narzędzia: `tools/ubior/helmy.py` (hełmy, gra + popiersie), `tools/ubior/bron.py` (osie, arkusze bez broni, szablony broni),
`tools/ubior/tarcze.py`, `tools/ubior/zloz_bron.py` (zestawienia). Obrazki (eksport gry: zachować `img/system/Ubior_*`):
`Ubior_Helm_<Rodzaj>` (6), `Ubior_Bust_Helm_<Rodzaj>` (6), `Ubior_BezBroni_Hero_<Arkusz>` + `Ubior_Maska_BezBroni_Hero_<Arkusz>`
(Club, Axe, AxeSide, Pick, Spear), `Ubior_Bron_<Arkusz>_<Rodzaj>` (24 szablony), `Ubior_Tarcza_<Rodzaj>` (8).

**Broń na osi zamachu.** `tools/ubior/bron.py`: w każdej klatce oś starej broni z maski (piksele narzędzia na wspólnej prostej, czubek
= koniec z metalem albo dalej od dłoni, chwyt = dłoń przy broni), klatki niepewne z sąsiadów; stara broń wymazana (w środku sylwetki
dopełniona ciałem z boku, głowa odmalowana ze wzoru głowy tego wiersza, poza sylwetką - przezroczyste); nowy rodzaj narysowany
profilem wzdłuż osi, ze skrótem perspektywy i z widocznością starej broni (za głową i za ciałem tam, gdzie stara była schowana;
dłoń zawsze przed bronią). Szablon: szarość = metal, zielonkawy = drzewce, czerwonawy = owijka; gra koloruje rampami materiału.
Sztylet: też w pięści (zamach `punch`, oś z przedramienia). Łuk i proca: przemalowanie drewna / rzemienia na zwykłym arkuszu.
Własna broń arkusza we własnym materiale (pałka drewniana, żelazna siekiera i kilof, oszczep = `wlocznia_kamien`, krótki łuk, prosta
proca) = zwykły arkusz bez zmian. Która broń: w trybie walki ta w ręku (`Combat.hand`); poza walką na zamachach pracy (siekiera, kilof)
najlepsze posiadane narzędzie tego rodzaju (stal > żelazo > kamień), na pozostałych - broń w ręku.

## Klucze wyglądu

Notatki przedmiotów (Bron_Data.js wpisuje je sam): `<Zbroja:miejsce,wzor>` (Ubior.js czyta jak `<Ubior:...>`), `<Bron:rodzaj,material>`
(klucz `bron_<rodzaj>_<material>`; unikat: `<Bron:rodzaj,material,klucz>`), `<Tarcza:wzor>`. Każda para rodzaj x materiał broni działa,
także spoza listy (Ubior_Bron.js rozbiera klucz); lista poniżej = to, co jest w `Ubior_Data.js`.

- **Głowa** (`helm_<rodzaj>_<materiał>`, obrazki `Ubior_Helm_*`): kaptur: len, welna, skora, skora_czarna; czepiec: len, skora (pikowany),
  zelazo, stal, zakon (kolczy - faktura kółek); kapalin: zelazo, stal, braz, zakon; otwarty: skora, braz, zelazo, stal; nosal: braz, zelazo,
  stal, zakon; zakonny: zelazo, stal, zakon.
- **Tors** (`zbroja_<rodzaj>_<materiał>`, faktura na koszuli): przeszywanica (pikowana): len, welna, skora, jedwab; skorznia (szwy, nity):
  skora, skora_czarna; kolczuga (kółka): zelazo, stal, zakon; luska (łuski): braz, zelazo, stal, zakon; napiersnik (blacha, grzbiet,
  połysk): braz, zelazo, stal, zakon.
- **Ręce** `karwasze_<m>`: skora, skora_czarna, braz, zelazo, stal, zakon (metalowe: dłonie w skórzanych rękawicach).
  **Nogi** `nagolenniki_<m>`: skora, braz, zelazo, stal, zakon. **Stopy** `buty_okute_<m>`: zelazo, stal, zakon (+ ubiór: `buty_brazowe`,
  `buty_czarne`).
- **Broń** `bron_<rodzaj>_<materiał>` - rodzaj (zamach, na którym jest rysowany): sztylet (punch, club), miecz, dlugi_miecz, tasak,
  szabla, palka, kostur, kiscien, buzdygan (club), mlot (pick, club), topor, czekan, bardysz, siekiera (axe), kilof (pick), wlocznia,
  rohatyna, sulica (spear), luk (bow), proca (sling). Materiały broni: drewno, okute (drewno z żelaznymi ćwiekami), kamien, braz,
  zelazo, stal, pierwszych, zakon; łuki: krotki, dlugi, refleksyjny, zakon; proce: prosta, skorzana, rzemienna. W `WZORY_BRONI`:
  sztylet braz/zelazo/stal/zakon; miecz braz/zelazo/stal/pierwszych/zakon; dlugi_miecz stal/pierwszych/zakon; tasak, szabla, kiscien,
  czekan, bardysz, rohatyna, sulica: zelazo/stal; palka drewno/okute/braz; kostur drewno/zakon; buzdygan, topor: braz/zelazo/stal/zakon;
  mlot kamien/zelazo/stal/zakon; wlocznia kamien/braz/zelazo/stal/zakon; siekiera, kilof: kamien/zelazo/stal; luk krotki/dlugi/
  refleksyjny/zakon; proca prosta/skorzana/rzemienna. Unikaty (własne kolory): bron_miecz_bogumila, bron_kostur_przeora,
  bron_dlugi_miecz_bez_herbu, bron_szabla_brzozowa, bron_sztylet_krucze_pioro, bron_luk_bialej_zrenicy.
- **Tarcze** `tarcza_<rodzaj>[_<materiał>]` (obrazki `Ubior_Tarcza_*`, w gardzie zamiast ikony): tarcza_drewniana, tarcza_okuta,
  tarcza_umbo_braz, tarcza_puklerz, tarcza_migdalowa, tarcza_zelazna, tarcza_zakonna, tarcza_skrzydlata_straz; materiał na końcu
  zmienia metal (np. `tarcza_okuta_stal`).

Zgodność z `BRON_LISTA.md`: wszystkie klucze z listy są (dorobione: karwasze_braz, nagolenniki_braz, siekiera/kilof stal); nowe po
stronie grafiki do wykorzystania: `zbroja_przeszywanica_jedwab` (dla 356 Jedwabnej przeszywanicy), `buty_okute_zakon` (dla 374 Butów
zakonnych), `bron_*_sulica` (lekka włócznia). Brygantyna (355) nosi `zbroja_przeszywanica_welna` (osobnej faktury nitów nie ma).

**Test i zrzuty.** `node tests/ubior_bron_test.js` (port CDP 9585; wkłada Ubior_Bron.js do strony): każdy klucz broni na swoim
zamachu (6 kluczowych klatek), każdy hełm w 15 ujęciach + na orle, każda zbroja w 7 ujęciach, tarcze, zrzuty z mapy, popiersie,
karta postaci, czas składania (najdłużej ~35-45 ms pierwsze złożenie, zwykle 4-10 ms). Zestawienia: `docs/ekwipunek/bron_wrecz.png`,
`bron_topory.png`, `bron_drzewcowe.png`, `bron_dystans.png`, `helmy_1.png`, `helmy_2.png`, `helmy_w_grze.png`, `helmy_popiersie.png`,
`helmy_karta.png`, `zbroje_tors.png`, `zbroje_rece_nogi.png`, `zbroje_tarcze.png`, `zbroje_tarcze_w_grze.png`.

**Znane ograniczenia.** Zbroja nie zmienia kształtu (postrzępiony dół tuniki, krótkie rękawy - jak cały ubiór); faktury na 1 px są
delikatne. Wymazanie starej broni jest automatyczne: w kilku klatkach (głównie tyłem i przy głowie) zostają drobne ślady starej
pałki / siekiery - poprawki ręczne w `tools/ubior/bron.py` (`POPRAWKI`: `zmaz`, `z_klatki`). Tarcza widoczna tylko w gardzie (jak
dotąd ikona); w marszu tarczy na ręce / plecach nie ma. Ikona „Postać” w menu (32 px, głowa i ramiona) nie pokazuje korony hełmu.
Cień słońca bohatera nie ma korony hełmu (cień liczony z ramki klatki).
