# Nowy świat: spis postaci i grafik do wykorzystania (2026-11-13)

Spis tego, co już jest w grze i da się wziąć do nowego świata (5 map po 80x80, wiejski styl z drewna). Nic nie zmieniano w grze; to tylko inwentarz. Źródła: `MIESZKANCY.md` i `PLAN.md` w tym folderze, `js/plugins/*_Data.js`, `js/teksty/*.txt`, `img/characters`, `img/pictures`, `data/Tilesets.json`.

## Wynik na samej górze

Tabele MIESZKANCY.md mają **56 wierszy** (dokument mówi „ok. 57”, bo liczy dwóch górników osobno). Jeden wiersz bywa kilkoma osobami: cech to 3 osoby, para staruszków 2, dwóch górników 2, „Wróble” to banda.

| Stan | Ile wierszy | Co to znaczy |
|---|---|---|
| Jest w pełni (ta sama postać) | **29** | arkusz mapy + chód w 8 kierunkach (Walk8) + popiersie do rozmów |
| Zastępca w podobnej roli | **7** | inna istniejąca, w pełni gotowa postać o podobnym zawodzie (zmiana imienia/płci) |
| Postać zbiorcza (tło) | **1** | anonimowa „Pula” gości tawerny: działa technicznie, bez osobowości |
| Jest arkusz, brakuje popiersia (lub Walk8) | **4** | wystarczy dorysować popiersie (`tools/busts`) |
| **Brak: nowa grafika** | **15** | nowa postać w stylu bohatera (biedny chłop, PixelLab); 16 postaci, jeśli drugi górnik ma wyglądać inaczej niż Kopacz |

Gotowych od razu (arkusz + Walk8 + popiersie): **37 z 56**. Po dorysowaniu popiersia: 41. Nowej grafiki wymaga **15** wierszy.

### Planowani mieszkańcy bez żadnej istniejącej postaci (nowa grafika)

- Miasteczko (3): **Nowy młynarz** (szpieg), **Piwowar / mistrz cechu**, **Para staruszków** (dwie postacie).
- Podgrodzie (5): **Wodziarz**, **Węglarz** (w grze Zbych to „drwal i węglarz”, więc zawody są sklejone; osobny węglarz wymaga nowej), **Tkaczka**, **Wdowa z kozą**, **Rybaczka**.
- Wybrzeże (1): **Hanna** (córka rybaka, warzy sól).
- Posiadłość Lorda (4): **Matka Lorda**, **Ogrodnik**, **Kucharka dworska**, **Pokojówka**.
- Góry (2): **Sztygar**, **Kamieniarz**. (Dwóch górników: jest jeden Kopacz bez popiersia; drugi, inny górnik to przemalowanie.)

## Jak czytać oznaczenia

- **arkusz** = postać na mapie, `img/characters/$Npc_X.png` (3 klatki x 4 kierunki).
- **Walk8** = `img/characters/Npc_X_Walk8.png`, chód w 8 kierunkach.
- **popiersie** = portret do rozmów, `img/pictures/X_Bust.png` (330 x 350). Przypisanie arkusz -> popiersie: tablica BUSTS w `js/plugins/SpeechBubbles.js`. Dziadek ma popiersie `Stach_Bust`.
- „W+B” = jest Walk8 i popiersie; „W” = tylko Walk8.
- Imiona i zawody: `js/teksty/mieszkancy.txt` (pola `name` w `TownLife_Data.js` to puste klucze).
- „Dziś”: Miasteczko = Map008 (Kruczogród), Podgrodzie = Map111, Posiadłość = Map024, Przystań = Map125, Tawerna = Map001.

## 1. Postacie z gry i przydział do planowanych mieszkańców

### 1a. Miasteczko (24 wiersze)

| Planowany | Istniejąca postać | Arkusz (W/B) | Dziś | Stan |
|---|---|---|---|---|
| Karczmarz | **Borgar**, karczmarz tawerny | `$Npc_Borgar` (W+B) | Tawerna; wątek Kasztelana | pełny (imię: Borgar) |
| Melia | Melia, pieśniarka | `$Npc_Melia` (W+B) | Tawerna | pełny |
| Ozzy | Dziadek Ozzy | `$Npc_Ozzy` (W+B) | Tawerna | pełny |
| Grum | Grum, najemnik | `$Npc_Grum` (W+B) | Tawerna; Akt III obrońca | pełny |
| Kucharka tawerny | Wanda, łaziebna z tawerny | `$Npc_Wanda` (W+B) | Tawerna (łaźnia) | zastępca |
| Franek | Franek, syn praczki | `$Npc_Franek` (W+B) | Podgrodzie, bywa w tawernie | pełny |
| Rządca Lorda | Feliks, kamerdyner Lorda (alternatywa: Teodor `$Npc_Kamerdyner`) | `$Npc_Feliks` (W+B) | dwór Map024 | zastępca |
| Studzienny | Pula M (gość tawerny, bez imienia) | `$Npc_Pula_M` (W+B) | Tawerna (tło) | zbiorcza |
| Ksiądz Kleofas | Brat Kleofas, pustelnik i kronikarz zakonu | `$Npc_Pustelnik` (W+B) | wyspa | pełny |
| Grabarz | Grabarz (Hieronim w zadaniach Zakonu) | `$Npc_Grabarz` (W+B) | cmentarz | pełny |
| Kowal Tadek | Tadek Młot | `$Npc_Kowal` (W+B) | kuźnia Map008 | pełny |
| Piekarz | Hanka Mączna, piekarka | `$Npc_Piekarka` (W+B) | piekarnia Map008 | zastępca (kobieta) |
| Baltazar | Baltazar Vey, kupiec / kantor | `$Npc_Kupiec` (W+B) | Kantor (W5) | pełny |
| Nowy młynarz | brak | | | **NOWA GRAFIKA** |
| Walenty | Walenty Mączka, młynarz | `$Npc_Walenty` (W, bez popiersia) | młyn (W19) | częściowy |
| Piwowar, mistrz cechu | brak (Ostap to starszy cechu, inna rola) | | | **NOWA GRAFIKA** |
| Cieśla Leon | Leon Dłuto | `$Npc_Ciesla` (W+B) | warsztat | pełny |
| Szwaczka Dorota | Dorota Igła | `$Npc_Szwaczka` (W+B) | dom 3 | pełny |
| Przekupka Agata | Agata | `$Npc_Przekupka` (W+B) | stragan | pełny |
| Weteran Wacław | Wacław Siwy | `$Npc_Weteran` (W+B) | dom 8, ławka na placu | pełny |
| Wdowa z dziećmi | Halina (wdowa) + Kostek + Jagódka | `$Npc_Wdowa`, `$Npc_Kostek`, `$Npc_Jagodka` (W+B) | dom 4 | pełny |
| Para staruszków | brak | | | **NOWA GRAFIKA** (2 osoby) |
| Pisarz miejski | Cyryl Atrament, pisarz Ratusza (W20) | `$Npc_Cyryl` (tylko arkusz) | Ratusz | częściowy: Walk8 + popiersie |
| Cech: Ostap, Ludwik, Jaś | Ostap Lemiesz, Ludwik Zaręba, Jaś | `$Npc_Ostap`, `$Npc_Ludwik`, `$Npc_Jas` (W, bez popiersi) | warsztaty (W22) | częściowy: 3 popiersia |

### 1b. Podgrodzie (18 wierszy)

| Planowany | Istniejąca postać | Arkusz (W/B) | Dziś | Stan |
|---|---|---|---|---|
| Dziadek Stach | Dziadek | `$Npc_Dziadek` (W, plus `Npc_Dziadek_Home`; popiersie `Stach_Bust`) | dom i działka | pełny |
| Praczka | Marta Ługowa | `$Npc_Praczka` (W+B) | chata Map112 | pełny |
| Znachorka | Babka Jadwiga | `$Npc_Znachorka` (W+B) | izba Map115 | pełny |
| Wodziarz | brak | | | **NOWA GRAFIKA** |
| Woziwoda Kuba | Kuba Woziwoda | `$Npc_Woziwoda` (W+B) | woda z rynku | pełny |
| Drwal | Zbych Smolarz | `$Npc_Drwal` (W+B) | chata Map113 | pełny |
| Kłusownik | Rysiek Sidło | `$Npc_Klusownik` (W+B) | chata Map114 | pełny |
| Garbarz Ignac | Ignac, garbarz i szewc | `$Npc_Garbarz` (W+B) | garbarnia | pełny |
| Garncarz | Wit Zduń | `$Npc_Garncarz` (W+B) | garncarnia Map203 | pełny |
| Węglarz | brak osobnego (Zbych = drwal i węglarz) | | | **NOWA GRAFIKA** |
| Tkaczka | brak | | | **NOWA GRAFIKA** |
| Rodzina z dzieckiem | Tośka (dziecko biedoty); do rodziny też Ludmiła + Marek + Ela (uchodźcy W6) | `$Npc_Dziecko`, `$Npc_Ludmila`, `$Npc_Marek`, `$Npc_Ela` (W+B) | lepianka Map204 | pełny |
| Wdowa z kozą | brak | | | **NOWA GRAFIKA** |
| Siostra Klara | Ciotka Stefa, opiekunka przytułku | `$Npc_Opiekunka` (W+B) | przytułek Map202 | zastępca |
| Gaweł | Stary Gaweł, żebrak | `$Npc_Zebrak` (W+B) | pod murem | pełny |
| Kramarz starzyzny | Józek Łata, szmaciarz | `$Npc_Szmaciarz` (W+B) | kram Map116 | pełny |
| „Wróble” | Bronek, Zosia, Kostek, Jagódka, Franek, Tośka | `$Npc_Bronek`, `$Npc_Zosia`, `$Npc_Kostek`, `$Npc_Jagodka`, `$Npc_Franek`, `$Npc_Dziecko` (W+B) | biegają po miasteczku | pełny |
| Rybaczka | brak | | | **NOWA GRAFIKA** |

### 1c. Wybrzeże (2), Posiadłość Lorda (8), Góry (4)

| Planowany | Istniejąca postać | Arkusz (W/B) | Dziś | Stan |
|---|---|---|---|---|
| Rybak Jan | Janek, rybak | `$Npc_Janek` (W+B) | Przystań Map125 | pełny |
| Hanna | brak | | | **NOWA GRAFIKA** |
| Młody Lord | Lord (Zaleski) | `$Npc_Lord` (W+B) | dwór Map024 | pełny (sprawdzić, czy wygląda na młodego) |
| Matka Lorda | brak (`Matka_Bust` to matka bohatera z prologu, bez arkusza) | | | **NOWA GRAFIKA** |
| Ogrodnik | brak (Gajowy Gniewko Bór to leśnik, inna rola) | | | **NOWA GRAFIKA** |
| Kucharka dworska | brak | | | **NOWA GRAFIKA** |
| Stajenny | Wojciech, woźnica (alternatywa: Szczepan Kołodziej `$Npc_Kolodziej`) | `$Npc_Woznica` (W+B) | miasteczko | zastępca |
| Pokojówka | brak | | | **NOWA GRAFIKA** |
| Strażnik jazu | Strażnik dworu | `$Npc_Straznik` (W+B) | dwór Map024 | zastępca |
| Kapitan straży dworu | Kapral Wit Czerwień (alternatywa: Rotmistrz) | `$Npc_Kapral`, `$Npc_Rotmistrz` (W+B) | miasteczko / garnizon | zastępca |
| Sztygar | brak | | | **NOWA GRAFIKA** |
| Dwóch górników | Kopacz (jeden arkusz) | `$Npc_Kopacz` (W, bez popiersia) | podziemia | częściowy |
| Kamieniarz | brak | | | **NOWA GRAFIKA** |
| Brat Ambroży | Ambroży, dzwonnik (w grze pustelnik to Kleofas, a Ambroży to dzwonnik; role można zamienić) | `$Npc_Dzwonnik` (W+B) | kaplica | pełny |

### Rozliczenie (z tabel 1a-1c)

- pełny 29: Miasteczko 14 (Borgar, Melia, Ozzy, Grum, Franek, Kleofas, Grabarz, Tadek, Baltazar, Leon, Dorota, Agata, Wacław, wdowa), Podgrodzie 12 (Dziadek, praczka, znachorka, Kuba, drwal, kłusownik, Ignac, garncarz, rodzina z dzieckiem, Gaweł, kramarz, Wróble), Wybrzeże 1 (Jan), Posiadłość 1 (Lord), Góry 1 (Ambroży).
- zastępca 7: Wanda, Feliks, Hanka, Klara, Wojciech, strażnik, kapral.
- zbiorcza 1: studzienny (Pula M).
- częściowy 4: Walenty, Cyryl, cech, górnicy.
- nowa grafika 15 (lista wyżej). Razem 56.

### 1d. Przybysze z czasem (z MIESZKANCY.md)

| Przybysz | Istniejąca postać | Arkusz |
|---|---|---|
| Rafał i Marek (W6) | Rafał, Marek | `$Npc_Rafal`, `$Npc_Marek` (W+B) |
| Matka z dwójką dzieci | Ludmiła + Ela | `$Npc_Ludmila`, `$Npc_Ela` (W+B) |
| Kupiec bez towaru | Gaspar Lis (handlarz relikwii) lub Baltazar | `$Npc_Relikwie` (W+B) |
| Uczony z kontynentu | Teofil Cyrkiel, kartograf | `$Npc_Kartograf` (W+B) |
| Lekarz wojskowy | Konstanty Mak, medyk | `$Npc_Medyk` (W+B) |
| Dezerter z jednej strony | Tomek / Tymon Wrzos | `$Npc_Dezerter` (W+B) |
| Dezerter z drugiej strony | brak; przemalować Dezertera lub Żołnierza B | `$Npc_Zolnierz_B` (W+B) |
| Łowca nagród | Szczerba, łowczyni | `$Npc_Lowczyni` (W+B) |
| Wysłannicy wojny | Adam Wierzbięta, poseł; Erazm Łaska, poborca | `$Npc_Posel`, `$Npc_Poborca` (W+B) |

### 1e. Inne nazwane postacie w grze (poza planem)

- **Podróżnicy z promu** (`Podroznicy_Data.js`, imiona w `teksty/podroznicy.txt`), W+B: Tobiasz Goniec, Jędrek Dudarz (`$Npc_Grajek`), Zenon Sita (`$Npc_Zboze`), Urszula z Olszynki, Albin (`$Npc_Pielgrzym`), brat Augustyn (`$Npc_Wizytator`), Ostap-gwardzista (`$Npc_Gwardzista`), Jagna (`$Npc_Jagna`). Tylko popiersie lub arkusz: Ksenia, Trójka, Kompania 1-4.
- **Garnizon i wybrzeże wyspy**, W+B: Rotmistrz, Kwatermistrz Kłos, Werbownik, Bazyli Krzesiwo (latarnik), Ansgar (`$Npc_Rozbitek`), Sambor Kwit (celnik), Roch (`$Npc_Przemytnik`), Żołnierz i Żołnierz B, Gajowy Gniewko Bór. Szyper Ostoja Rafa i Łasica: bez popiersia.
- **Wieś**: Pasterz Wawrzyn Owczarz i handlarz Szymon Juczny (W+B); Sołtys Bronisław, Bartek Kmieć, Lucjan Kość (gracz w kości), Szymek (złodziej), Mietek Kwaśniak (szynkarz), Szczepan Kołodziej, Darin z Kontynentu (`$Npc_Uchodzca`) - wszyscy W+B.
- **Poczta (W20)**: Mistrz Gawron (`$Npc_Gawron`), Wicek (`$Npc_Wicek`): tylko arkusze. **Bogdan, Halina** (`$Npc_Bogdan`, `$Npc_Halina`): tylko arkusze (rekwizyty drugiej fali W6). **Wawrzyn Płowy** (`$Npc_Wawrzyn`, nowy garbarz): tylko Walk8.
- **Jarmark**: 8 arkuszy `$Npc_Jarmark_*` (Ania, Bonawentura, Marcel, Ofelia, Pimpek, Szept, Wanda, Zar), bez Walk8 i popiersi. **Milczący z Osady**: `$Npc_Milczacy1/3`, `$Npc_Milczaca2/4`, tylko arkusze. **Wesele**: `$Npc_PannaMloda`, `$Npc_PanMlody`, tylko arkusze.
- **Pula gości tawerny**: Pula_K, K2, K3, M, M2, M3, S, S2, Z, Z2: popiersia wszystkie, Walk8 tylko K, M, S, Z; plus arkusze „siedzi” (`Przytulna_Siedzi_*`).
- **Bohater**: `Hero_Walk`, `Hero_Run`, `Hero_Sneak`, `Hero_Torch*`, `Hero_Bust`, `Hero_Bust_Lad`. Wzór stylu nowych postaci: biedny chłop, podarte ubranie, boso.
- Stare RTP: `Actor1-2`, `People1-4` (+`_Tall`) z popiersiami `Actor*_N`, `People*_N`.

## 2. Zwierzęta, potwory i stworzenia (wszystko w `img/characters`, działa w grze)

- **Zwierzęta**: `$Animal_Bear` (+Pounce, Rear, Roar, Run, Swipe), `$Animal_Boar` (+Run), `$Animal_Cat`, `$Animal_Cat_Sleep`, `$Animal_Cow`, `$Animal_Deer`, `$Animal_Dog` (+Run, Stalk), `$Animal_Hen`, `$Animal_Rabbit`, `$Animal_Sheep`, `$Animal_Wolf` (+Bark, Run, Stalk).
- **Konie**: `$Kon_Gniady`, `$Kon_Kary`, `$Kon_Kasztan`, `$Kon_Siwy`, `$Kon_Srokaty` (każdy też `_Pasie`, `_Pije`).
- **Inne żywe**: pies (Dog.js), orzeł (`$Orzel_*`, Orzel.js), ptaki (Birds.js), motyle (Motyle.js), kruk `$Przytulna_Kruk`, `Morze_Macka`, `Morze_Macka_Duza`.
- **Ludzie bojowi** (Humans.js): `$Human_Archer`, `_Bandit`, `_Captain`, `_Dwor`, `_Knife`, `_Merc`; każdy z atakiem, przykucnięciem, klęczeniem, leżeniem.
- **Stworzenia ruin** (Creatures.js, z atakiem i śmiercią): `$Cr_Armor`, `_Bat`, `_Blank`, `_Deep`, `_Drowned`, `_Keeper`, `_Last`, `_Mother`, `_Prior`, `_Queen`, `_Rat`, `_Shadow`, `_Spider`, `_Stone`, `_Wraith`, szkielety `_SkCaptain/Club/Hammer/Spear/Sword`.
- **Stwory morza**: `$Cr_SeaCrab`, `_SeaDrowned`, `_SeaFog`, `_SeaFolk`, `_SeaWitch`.
- Chorzy leżący (gorączka W21): `$Chory_*`.

## 3. Grafiki budynków i rekwizytów pod drewnianą wieś

### 3a. Zestawy kafli (`data/Tilesets.json`)

| Id | Nazwa | Zawartość | Przydatność |
|---|---|---|---|
| 8 | Winlu Fantasy Interior | wnętrza Winlu (A2-A5, B, C, D, Shops) | wnętrza tawerny i domów |
| 9 | Winlu Fantasy Exterior | zewnętrze Winlu, zielona edycja | trawa, drogi, płoty; Kruczy Jar, dom dziadka |
| 10 | Winlu Fantasy Dungeon | loch | piwnice, lochy |
| 11 | Miasteczko (Winlu autora) | zewnętrze Winlu (A1 town, A2-A5, B, C, D) + Fantasy_Roofs | **baza dzisiejszych map: Map008, Map111 Podgrodzie, Map024 dwór, Map125, Map013 góry**; drewniane domy Podgrodzia są z niego |
| 12 | Podziemia: kwatery zakonu | loch + Inside_C | podziemia zakonu |
| 13 | Kruczogród (średniowiecze) | A1 town, A2, `Styl_FB/A3`, `A4`, A5, `Kruczogrod/Miasto2_B-E` | murowane miasto, NIE do drewnianej wsi |
| 14, 15, 16 | Mury Kruczogrodu (na 11 i 9; 16 dla Podgrodzia) | to samo + `Miasto_E` lub `Mury_Podgrodzie` | mury i bramy; `Mury_Podgrodzie` = palisada |
| 17 | Próba: Winlu + Fantastic Buildings | `Styl_FB` A3/A4/B/C/E + `Proba_D` | próbny |
| 18 | Winlu (nowy styl) - budowanie | `Styl_FB` A3, A4, B, C, D, E | część drewnianych ścian i dachów |
| 19 | Paczka Fantastic Buildings | `Kruczogrod/Miasto_B-E` | kamienice, miejskie |
| 20 | Kopalnia: Dungeon z torami | loch + `Kopalnia/Kopalnia_E` | kopalnia w Górach |
| 21 | Chata własna (próba PixelLab) | `Wlasne/Chata_A3`, `Chata_A4`, `Chata_E` + wnętrza Winlu | **własne kafle drewnianej chaty** |
| 2, 3 | stare RTP | `Outside_*`, `Inside_*`, `Tawerna_A2/A4/D` | pierwsza tawerna, nieużywane |

Pliki w `img/tilesets`: foldery `Winlu Fantasy Tileset - Exterior` (+ `Exterior Winter` na zimę), `- Interior`, `- Dungeon`, `Styl_B` (zielona edycja), `Styl_FB` (6 arkuszy 768 px), `Kruczogrod` (Miasto_B-E, Miasto2_B-E, Mury_Podgrodzie, Proba_D, 768x768), `Kopalnia`, `Wlasne` (Chata_A3 768x384, Chata_A4 768x720, Chata_E 768x768).

### 3b. Drewniane domy Podgrodzia (Map111) - `docs/podgrodzie/NOWE_PODGRODZIE.md`

Szynk (Map201, szyld z kuflem), przytułek (Map202, długi dom z desek), garncarnia (Map203), lepianki 1-2 (Map204-205, glina i strzecha), chaty 3-5 (Map206-208: bale, deski, strzecha), chata pod strzechą (209), chałupa z desek (210), szopa (211), komórka (212), chata drwala (113), kłusownika (114), izba znachorki (115), kram starzyzny (116), dom uchodźców (117), chata praczki (112). Wymiary i plan: `tools/podgrodzie2/budynki.json`, `docs/podgrodzie/plan_nowe_podgrodzie.png`.

### 3c. Gotowe obrazki budynków i rekwizytów (`img/characters/!$...`, jako zdarzenia)

- **Budynki prosto z przodu (PixelLab)**: `!$Bud_Karczma` (1008x1152), `!$Bud_Rybak` (1008x960, **chata rybaka, pasuje na Wybrzeże**), `!$Bud_Ciesla`, `_Kuznia`, `_Mieszczanin`, `_Kamienica`, `_Spichlerz`, `_Wieza`, `!$Bud5_Browar` (1584x1728), `_Handlarz`, `_Kruczarnia`, `_Podkuwacz`; każdy ma bliźniaka `_Drzwi`. Podgląd: `docs/budynki/`, `docs/budynki5/`. Uwaga: decyzja „budynki miasta z kafli, nie z kompozytów PixelLab” (notatka projektu).
- **Wieś i zagroda**: `!$Zagroda_Dom` (756x864), `!$Pod_Chlewik`, `!$Pod_Kurnik`, `!$Pod_Kociol`, `!$Pod_Piec`, `!$Piec_gliniany`, `!$Stajnia_A_Bud` + `Stajnia_A_Drzwi`, `!$Stajnia_Duza_A/B/C`.
- **Młyn**: `!$Wiatrak_Czapa`, `!$Wiatrak_Skrzydla` (+2, +3), `!$Mlyn_Kamien`, `!$Mlyn_Os`, `!$Mlyn_Dzwignia`, `!$Waterwheel`.
- **Woda**: `!$Zas_Studnia`, `!$Wodopoj`, `!$Wodopoj_Kregi`, `!$Cysterna_Slup`, `!$Cysterna_Czerpak`, `!Cysterna_Rzeczy`, `!$Zi_Wiadro`.
- **Wybrzeże**: wrak `!$1_Wrak_Dziob/Rufa/Srodek_Duzy` (+Cien, +Grunt), `!$Wrak_Szkielet`, `!$Wrak_Bandera`, łodzie `!$Lodz_*_z_gory`, `!$Przystan_*`, latarnia `!$Latarnia_*`, `!$Wys_Sol`.
- **Góry**: `!$Kopalnia_Wejscie/Szyb/Tor/Wagonik`, `!$Mt_*`, `!Mt_Props`, skały `!$Rock_*` (z rudą `!$Rock_Ore_Iron*`), `!$Boulder_A`.
- **Obozy i wieś**: `!$Lud_Szalas/Koszar/Stol/Lawka/Skrzynia/Woz/Szyb/Mielerz`, dym `!$Dym_Mielerz`, `!$Dym_Komin`, `!$Zas_Plot`, `!$Zas_Ogrodek`, `!$Zas_Glinianka`, `!Zas_Uprawy`, `!$Osad_Rynny`, `!$Drogowskaz`, `!wagon`.
- **Dwór i bramy**: `!$W7_Dwor`/`!W7_Dwor`, `!$Lord_Sign`, `!$West_Gate`, `!$East_Gate`, `!$North_Gate_A/B`, `!$Gate_Wood1`, `!Garnizon_Palisada` (+`_Bok`), `!$Garnizon_Brama_Slup`.
- **Dekoracje domów**: `!House_Props`, `!House_Decor`, `!$House_Churn` (maselnica), `!$House_Quilt`, `!$House_Wheel` (kołowrotek), `!Tavern_Props*`, `!Town_Props(_FB)`, `!Signs(_FB)`, `!Table_Decoration`, `!lamp`, `!Fireplace*`, `!$Fireplace_kitchen`, `!Miasto2_Wnetrza`, `!Podgrodzie2_Wnetrza`, `!Osada_Props`.
- **Przyroda** (4 pory roku: `_wiosna`, `_jesien1-3`, `_zima`): `!$Big_Trees_green`, `!$Big_Trees_scinane`, `!$Pine_A/B/C`, `!$Tree_Apple/Pear/Small/FruitBare`, krzewy `!$Bush_*`, pnie, zioła `!$Zi_*`.

### 3d. Wnioski dla drewnianej wsi

1. Kafle: zestaw **11** jako baza, dodać `Wlasne/Chata_*` (zestaw 21) i palisadę `Mury_Podgrodzie` (zestaw 16). Zestawy 13, 14, 15, 19 są miejskie i kamienne.
2. Wnętrza: zestaw **8** (już w tawernie i domach) + `Wlasne/Chata_E`.
3. Obrazki pasujące do drewnianej wsi: chata rybaka, zagroda, chlewik, kurnik, młyn i wiatrak, stajnia, spichlerz.
4. Nowych 15 postaci: PixelLab w stylu bohatera; potrzebne arkusz 3x4, Walk8 i popiersie 330x350 (narzędzia w `tools/busts`).
