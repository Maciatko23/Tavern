# Ubiór bohatera - plan pełnego systemu (2026-10-22)

Po udanej próbie (`docs/ekwipunek/proba_ubioru.png`, `METODA.md`): każdy założony przedmiot widać na postaci, bez generowania
kombinacji. Ubrania = przemalowanie części postaci (koszula, spodnie, pas, dłonie, stopy), nakrycia głowy i rzeczy na plecach =
nakładki przyklejane do punktów w każdej klatce. Wszystko podpięte pod istniejący ekwipunek (`Equipment.js`, menu P -> Postać).

## 1. Miejsca na ciele i jak je widać

| miejsce (Equipment.js) | jak widać | uwagi |
|---|---|---|
| Głowa | nakładka | tylko niskie nakrycia (kapelusze, czapki, chusty, opaski): w klatkach chodu nad włosami są 2 px; hełmy i kaptury później (większe klatki) |
| Tors | przemalowanie koszuli | kształt zostaje (krótkie rękawy, postrzępiony dół) - różnią się materiał i kolor |
| Pas | przemalowanie paska | sznurek -> skórzany pas -> pas z sakiewką |
| Rękawice | przemalowanie dłoni | jak buty: kształt dłoni zostaje |
| Nogi | przemalowanie spodni | |
| Stopy | przemalowanie (łapcie) albo nakładka (buty z cholewką) | |
| Plecy | nakładka | plecak (już jest w grze, 114), torba przez ramię |
| Płaszcz | - | zmienia sylwetkę: osobny etap później (po odnowieniu PixelLab 29.10) |
| Prawa / lewa ręka | bez zmian | broń, tarcza i pochodnia mają już własne arkusze |

## 2. Przedmioty (propozycja - ok. 45 rzeczy)

| miejsce | przedmiot | warianty (kolor / materiał) | cena | co daje | gdzie kupić |
|---|---|---|---|---|---|
| Głowa | Słomkowy kapelusz | naturalny, ciemny | 12 G | w upał i suszę wolniej rośnie pragnienie | przekupka Agata (plac) |
| Głowa | Lniana chusta | biała, czerwona, niebieska | 6 G | - (tani, ładny) | szmaciarz Józek (Podgrodzie) |
| Głowa | Filcowa czapka | brązowa, szara, zielona | 18 G | zimą trochę mniej marzniesz | szwaczka Dorota |
| Głowa | Skórzana opaska | brązowa, czarna | 10 G | pot nie zalewa oczu: odrobinę mniej zmęczenia przy pracy | garbarz Ignac |
| Tors | Łachman (start) | szary | - | - | (strój startowy) |
| Tors | Lniana koszula | biała, żółta, niebieska (farbowana) | 8-14 G | schludność: +opinia w mieście | szwaczka Dorota |
| Tors | Wełniany kaftan | czerwony, brązowy, granatowy | 25 G | zimą mniej marzniesz | szwaczka Dorota |
| Tors | Skórzana kurta | zielona, brązowa (= kurtka 171 z walki) | 40 G | cios o 20% słabszy (jak dziś) | garbarz Ignac |
| Tors | Odświętna koszula z haftem | biała z czerwonym | 60 G | duża schludność: lepsze ceny i rozmowy w mieście | kantor (towar z kontynentu) |
| Nogi | Płócienne spodnie | szare, niebieskie, brązowe | 10 G | - | szwaczka Dorota |
| Nogi | Wełniane spodnie | brązowe, zielone | 20 G | zimą mniej marzniesz | szwaczka Dorota |
| Nogi | Skórzane spodnie | czarne, brązowe | 35 G | krzaki i pnącza mniej kaleczą | garbarz Ignac |
| Stopy | Łapcie z łyka | naturalne | 4 G | trochę szybszy chód | szmaciarz Józek / sam (warsztat) |
| Stopy | Skórzane buty (113) | brązowe, czarne - nakładka z cholewką | 30 G | szybszy chód (jak dziś) | garbarz Ignac |
| Pas | Skórzany pas | brązowy, czarny | 12 G | +udźwig | garbarz Ignac |
| Pas | Pas z sakiewką | brązowy | 25 G | +udźwig, mniej ginie przy rabunku | garbarz Ignac |
| Rękawice | Skórzane rękawice | brązowe, szare | 15 G | mniej zmęczenia przy rąbaniu i kopaniu | garbarz Ignac |
| Plecy | Plecak (114) | jak dziś - nakładka | (jest) | większe stosy, udźwig (jak dziś) | (jest) |
| Plecy | Torba przez ramię | płócienna, skórzana | 15 / 30 G | mniejszy plecak: trochę udźwigu | szwaczka / garbarz |

Ceny i bonusy to propozycja do Twojej poprawki. Bonusy są małe, żeby ubiór był głównie wyglądem i drobną przewagą.

## 3. Kupno, sprzedaż, zużycie

- Sklepy w rozmowach mieszkańców (jak handlarz i kantor): szwaczka Dorota (nowe miasto, dom 3), garbarz-szewc Ignac,
  przekupka Agata (stragan na placu), szmaciarz Józek (Podgrodzie: tanio, używane; skupuje stare ubrania).
- Sprzedaż: każdy z nich odkupuje swój rodzaj za ok. 40% ceny; szmaciarz kupuje wszystko, ale tanio.
- Zużycie jak przy narzędziach (`Durability`): ubranie niszczy się powoli przy pracy i w walce; naprawa u szwaczki (tkanina) albo
  garbarza (skóra), za grosze; zniszczone ubranie spada z bohatera.
- Farbowanie u szwaczki: lniana koszula na inny kolor za kilka groszy (ten sam przedmiot, inny wariant).
- Zakładanie i zdejmowanie: menu P -> Postać (już jest); karta postaci pokazuje bohatera w stroju.

## 4. Technika (etapy)

1. **Maski wszystkich arkuszy bohatera** (~27 arkuszy: chód, bieg, praca, walka, siedzenie, leżenie, przewrót, pochodnia, jazda
   na orle) - automatycznie, z ręcznymi poprawkami nielicznych klatek. *W toku.*
2. **Ubior.js w grze**: podpięty pod Equipment.js; przebiera wszystkie arkusze bohatera, kartę postaci w menu i popiersie w
   rozmowach (ta sama metoda na portrecie).
3. **Przedmioty**: nowe numery przedmiotów 250-299 (Items.json - przy zamkniętym edytorze), ikony (nowy rząd IconSet, warianty
   kolorów robione przemalowaniem jednej ikony), notatki `<Ubior:...>` z miejscem, rampą kolorów i bonusem.
4. **Nakładki do narysowania** (ręcznie, bez PixelLab): filcowa czapka, chusta, opaska, buty z cholewką, plecak, torba.
5. **Sklepy, sprzedaż, zużycie, farbowanie** w rozmowach mieszkańców.
6. **Później (po 29.10)**: płaszcz i rzeczy zmieniające sylwetkę, hełmy i kaptury (większe klatki).

Koszt PixelLab etapów 1-5: 0 generacji.

## 5. Wspólne klucze (umowa między grafiką a danymi)

Przedmiot ubioru ma w notatce `<Ubior:miejsce,wzor>`; `miejsce` = glowa | tors | nogi | stopy | pas | rece | plecy;
`wzor` = klucz z tabeli `WZORY` w `js/plugins/Ubior_Data.js` (rampa kolorów albo nakładka). Klucze:

- glowa: kapelusz_slomkowy, kapelusz_slomkowy_ciemny, chusta_biala, chusta_czerwona, chusta_niebieska, czapka_filc_braz,
  czapka_filc_szara, czapka_filc_zielona, opaska_braz, opaska_czarna
- tors: koszula_lniana_biala, koszula_lniana_zolta, koszula_lniana_niebieska, kaftan_czerwony, kaftan_brazowy, kaftan_granatowy,
  kurta_zielona, kurta_brazowa (= przedmiot 171 Skórzana kurtka), koszula_odswietna
- nogi: spodnie_plocienne_szare, spodnie_plocienne_niebieskie, spodnie_plocienne_brazowe, spodnie_welniane_brazowe,
  spodnie_welniane_zielone, spodnie_skorzane_czarne, spodnie_skorzane_brazowe
- stopy: lapcie, buty_brazowe (= przedmiot 113 Skórzane buty, nakładka z cholewką), buty_czarne
- pas: pas_skorzany_braz, pas_skorzany_czarny, pas_sakiewka
- rece: rekawice_brazowe, rekawice_szare
- plecy: plecak (= przedmiot 114), torba_plocienna, torba_skorzana

Nowe przedmioty: numery 250-299 (Items.json), ikony od 528 (nowe rzędy IconSet). Pliki: `js/plugins/Ubior.js` (wygląd: maski,
przemalowanie, nakładki, karta postaci, popiersia) i `js/plugins/Ubior_Data.js` (WZORY, przedmioty, sklepy, ceny, bonusy) -
do js/plugins.js dopisuje koordynator przy zamkniętym edytorze.
