# Kruczogród (Map008) - czego potrzebują fabuła, wtyczki i gracz (stan 2026-11-08, PRZED przebudową "miasto3")

Spis AKTUALNY (odczytany z `data/Map008.json`, `data/Map1xx.json`, `js/plugins/*.js`, `tests/*.js`, `docs/*`), przygotowany przed przebudową
miasta od zera w nowym stylu (Fantastic Buildings: Medieval) z bardziej naturalnym układem. Poprzedni spis (`docs/miasteczko/POWIAZANIA_MAP008.md`,
2026-10-22) opisuje mapę 104 x 138 przed przebudową - NIE jego liczby, tylko rodzaje powiązań są użyteczne. Tu są wartości bieżące.
Spis zrobił agent (tylko odczyt, nic poza tym plikiem nie zmieniono). Ścieżki względem katalogu projektu; `plik:linia` = stan z dnia spisu.

## 0. Stan mapy w skrócie

- Map008 "Kruczogród": **120 x 120**, tileset 11, 399 zdarzeń (maks. id 499), notatka mapy `<Clouds:on> <Farm:off>` (budowanie/uprawy wyłączone; Orzel_Lot
  rozpoznaje miasto po `<Farm:off>`), BGM Town1. Środek planszy 3x3 (`js/plugins/Swiat_Data.js`: Map008 = świat [120,120,120,120]).
- Treść miasta zajmuje x 0-103, y 0-97 (mur południowy w rzędach 93-97), reszta to teren dołożony przy planszy 3x3 (x 104-119, y 98-119) i pola.
  18 pustych rzędów południa ucięto (138 -> 120; `tools/plansza/plansza.py`: `8: (1,1,0,0)`), mapa NIE była przesuwana (dx=dy=0).
- Zdarzenia: 81 znaczników "Miejsce: <klucz>", 33 zdarzenia z transferem (201: 31 drzwi + studnia + płyta), 62 drzewa/skały/pnie (ChoppableTree), 40 świateł
  (`<Light...>`), 2 studnie `<Studnia:2>`, 10 `<Occupy>`; reszta to dekoracje (dachy, szyldy, stragany, latarnie).
- Regiony (warstwa 5): `2` = blokada (2999 pól), `3` = rysowane nad bohaterem (165 pól; m.in. wierzch muru furtki ogrodu 32-34,14; rzędy murów 93, 80-81, 91...),
  `31` = lądowisko orła (1006 pól: plac 30,37-73,63 + 72-73,43-44). Regionu 1 brak. Zasady warstw: `js/plugins/RegionLayers.js` (1 pod / 2 blokuje / 3 nad).
- Zakresy id zdarzeń wstrzykiwanych przez wtyczki na Map008 (rejestr `js/plugins/TawernaCore.js:605-660`): 903-907 (obóz W6), 910-949 + 2900-2949 + 3020-3049
  (TownLife), 656-659 (Garnizon), 733-734 (Kantor), 859 (lina dzwonu Act3), 951-959 (TownQuests), 1000-1999 (Forestry), 2235-2299 (Zasoby: uprawy pól),
  2800-2840 (Zakon: cmentarz). Zdarzenia z edytora mają numery 1-499 (nie wolno wchodzić w zakresy wtyczek).

---

## 1. Budynki z wnętrzami

Konwencja: zdarzenie drzwi stoi NA kratce drzwi (x, y); wyjście z wnętrza ląduje w (x, y+1) kierunek 2 (patrz kolumna "wyjście"). "Godz." = kiedy drzwi
są otwarte (`$gameSystem.dayNightHour`, poza tym "Zamknięte." + popup). Mieszkańcy = klucze `TownLifeData.RESIDENTS` (`js/plugins/TownLife_Data.js`); imiona z
`js/teksty/mieszkancy.txt`. "Dom" = miejsce, gdzie postać znika (`inside`) po dojściu do kratki `<budynek>_drzwi`.

### 1.1 Budynki z rolą dla gracza / fabuły

| Budynek | Wnętrze (mapa) | Drzwi na Map008: id (x,y), godz. | Wyjście z wnętrza (kratka w mieście) | Mieszka / pracuje | Rola dla gracza | Rola w fabule |
|---|---|---|---|---|---|---|
| Tawerna Borgara | Map001 TAWERNA | ev22 "Drzwi tawerny -> Tawerna" (51,16), zawsze; ląduje w Map001 (50,53) | Map001 ev10/11/12 (49/50/51,54) -> (50/51/52,17) kier. 2 | Borgar, stali bywalcy, goście promu (obsada Podroznicy 3020-3049, spot `tawerna` = `podr_sala` = `podr_pokoj` = `rozbitek_noc` 51,17) | praca na zmianie (TavernShift), tablica zleceń, nocleg (pokoje Map025/026), kości, rzutki, siłowanie, stali bywalcy | oś całej gry: Akt III (oblężenie drzwi), W4 Borgar/Kasztelan (po NAZWIE "Drzwi tawerny" - Kasztelan.js:301), W9, D6 turniej, W14/W15/W16 podróżni, cysterna zamkowa za piwnicą (decyzja 2026-11-08) |
| Piekarnia | Map102 | ev88 (38,72), 6-21 | Map102 ev11 -> (38,73) | Hanka Mączna `piekarka` (dom `piekarnia_drzwi`) | okienko `bakery_window` (38,73), kartka `notice_bakery` (39,73); stragan rano | K4, K5, K30, kalendarz (Wielkanoc: pisanki), ceny chleba; W15 (Hanka przy kazaniu Gaspara) |
| Kantor "Towary z kontynentu" tylne drzwi | Map103 | ev94 (14,47), 8-21, `<Town:door=kantor>` | Map103 ev13 -> (14,48) | Baltazar Vey `kupiec` (dom `kantor_drzwi`), po W5 Ludmiła | sklep (GOODS + Bron/Ubior `kantor`, 8-18, skupuje wszystko), W5 nocna zmiana | W5 (goście tylnych drzwi 23-1, piwnica Map171 wychodzi na `backFront`), W2 (Baltazar kupuje kroniki), W15, Kłos (659) przy tylnych drzwiach |
| Kantor front | Map103 | ev95 (18,46), 8-21 | Map103 ev7 -> (18,47) | jw. | jw. | spot `w5_lada` (18,47): Ludmiła wchodzi |
| Ratusz | Map104 | ev114 (85,47), 8-18 | Map104 ev12 -> (85,48) | Sołtys Bronisław `soltys` (`ratusz_drzwi`) | przydział wody, zadania sołtysa, obwieszczenia | K17-K19, D9, D17, W1 rozdz. 6, W6 głosowanie, Kantor_Data `MAP.ratusz` 104 |
| Ratusz kancelaria | Map104 | ev4 (91,47), 8-18, `<Town:door=ratusz>` | Map104 ev15 -> (91,48) | jw. | jw. | jw. |
| Dom kowala / Kuźnia | Map105 | ev134 "EV134" (13,60), 6-21 | Map105 ev8 -> (13,61) | Tadek Młot `kowal` (`kuznia_dom`, praca `kowadlo` 8,63) | sklep (broń/zbroja, skup metali, naprawa metalu, 6-17), tablica `notice_smithy` (9,62) | K1-K3, D3, D6, W4 rozdz. 3 (F9 9,64); animacja kowadła: ev142 `!$Smith` (7,62) |
| Dom garbarza | Map106 | ev141 "EV141" (6,88), 6-21 | Map106 ev13 -> (6,89) | Ignac `garbarz` (`garbarz_dom`, praca `garbarnia` 15,85) | sklep skóry (6.5-19), naprawa skóry, skup skór | K20-K22, D1 |
| Dom woziwody | Map107 | ev137 "EV137" (59,73), 6-21 | Map107 ev9 -> (59,74) | Kuba Woziwoda `woziwoda` (`woziwoda_dom`; praca `staw` 66,10 - przy ogródku piwnym; stoi `studnia_rynek`) | przydział wody przy studni | K8-K10, W1 (sprzedaje wodę dworu nocą), W6 |
| Dzwonnica | Map108 | ev236 (86,31), ZAWSZE otwarte | Map108 ev13 -> (86,32) | Ambroży `dzwonnik` (`dzwonnica` 85,31) | mini-gra dzwonu, dzwony 6/12/18, sygnały | W2 (kod dzwonu), W3 (rytm), Akt III (lina alarmu), W6 kryjówka Rafała (Map108 8,5), W16 `dzwonnica` |
| Dom mieszczan | Map109 | ev121 (36,38), 6-21, `<Town:door=dom_mieszczan>` | Map109 ev14 -> (36,39) | Bronek `bronek`, Zosia `zosia` | - | K23-K26 |
| Izba pod skałą | Map110 | ev124 "EV124" (39,37), 6-21 | Map110 ev3 -> (39,38) | nikt (brak rezydenta) | - | tylko wnętrze; drzwi wbudowane w skałę/mur tarasu |
| Kaplica | Map178 | ev50 (8,16), 6-21, `<Town:door=kaplica>` | Map178 ev25 -> (8,17) | opiekuje się Hieronim; ławka `kaplica_lawka` (14,22); Wrak_Data `ITEM_MAP` 178 to ID przedmiotu, nie mapa | Księga parafialna (Map178 ev21), ławka | Zakon (grabarz Hieronim, cmentarz), W15 (Augustyn, spot 15,24), podróżni (wizytator, pielgrzym) |
| Dom grabarza | Map179 | ev57 (20,12), 6-21 | Map179 ev13 -> (20,13) | Hieronim `grabarz` (2930; `grabarz_chata` 20,13) | - | Zakon: D37 kruki na grobach |
| Strażnica Lorda | Map180 | ev152 (98,47), ZAWSZE | Map180 ev25 -> (98,48) | Wit `kapral` + straż tła | - | Rywal_Data (Map180), wartownia przy bramie wsch.; stojaki z bronią (96,38), (99,38), kukła (97,40) |
| Stajnia z wozownią | Map181 | ev209 (61,87), ZAWSZE | Map181 ev38/ev39 (11/12,12) -> (61,88) | Szczepan Kołodziej `kolodziej` (2940; `stajnia_drzwi`, praca `stajnia_woz` 69,86) | nocleg na stryszku (free/5 G), zmiana w stajni (mini-gra 4-częściowa), wóz za darmo przy pełnym zaufaniu | START FABUŁY po "Wezwaniu króla" (list dziadka -> Szczepan), konie podróżnych, Stajnia.js (stryszek 3250, tablica zmian 3251) |
| Dom 1 (przekupka Agata) | Map182 | ev63 (85,12), 6-21 | Map182 ev11 -> (85,13) | Agata `przekupka` (2941) | sklep (kapelusze słomkowe, chusty, łapcie; skup słomy; 6-18.5) | - |
| Dom 2 (kamienica) | Map183 | ev84 (96,28), 6-21 | Map183 ev16 -> (96,29) | nikt | - | - |
| Dom 3 (szwaczka) | Map184 | ev129 (7,48), 6-21 | Map184 ev13 -> (7,49) | Dorota Igła `szwaczka` (2942) | sklep ubrań (7-20), naprawa, farbowanie, skup lnu/płótna/wełny/filcu | Ubior (sklepy) |
| Dom 4 (wdowa) | Map185 | ev180 (84,63), 6-21 | Map185 ev19 -> (84,64) | Halina `wdowa`, Kostek, Jagódka (2943-2945) | - | życie miasta (dzieci na placu) |
| Dom 5 (stary dom kupca) | Map186 | ev197 (95,62), 6-21 | Map186 ev14 -> (95,63) | nikt | - | - |
| Dom 6 (cieśla) | Map187 | ev204 (33,86), 6-21 | Map187 ev20 -> (33,87) | Leon Dłuto `ciesla` (2946; `ciesla_warsztat` 33,89) | - | - |
| Dom 7 (staruszkowie) | Map188 | ev80 (42,87), 6-21 | Map188 ev16 -> (42,88) | nikt | - | - |
| Dom 8 (weteran) | Map189 | ev216 (84,88), 6-21 | Map189 ev13 -> (84,89) | Wacław Siwy `weteran` (2947) | - | opowieści o wojnie |
| Dom 9 (izba do wynajęcia) | Map190 | ev218 (95,88), 6-21 | Map190 ev8 -> (95,89) | nikt | - | - |
| Dom 10 (czeladnik piekarza) | Map193 | ev231 (31,73), 6-21 | Map193 ev8 -> (31,74) | nikt | - | - |
| Dom 11 (kamienica ze sklepikiem) | Map194 | ev235 (45,73), 6-21 | Map194 ev11 -> (45,74) | nikt | - | - |
| Dom 12 (rybak) | Map195 | ev250 (45,87), 6-21 | Map195 ev12 -> (45,88) | nikt | - | - |
| Dom 13 (balwierz) | Map196 | ev253 (79,74), 6-21 | Map196 ev13 -> (79,75) | nikt | - | - |
| Dom 14 (skryba) | Map197 | ev254 (78,88), 6-21 | Map197 ev9 -> (78,89) | nikt | - | - |
| Dom 15 (kamieniarz, przy cmentarzu) | Map198 | ev259 (21,33), 6-21 | Map198 ev19 -> (21,34) | nikt | - | - |

Uwagi:
- Domy 10-15 (Map193-198) i Dom 2, 5, 7, 9, Izba pod skałą (Map110) nie mają mieszkańców ani wątków - tylko drzwi + znacznik `<dom>_drzwi`. To najtańsze do zmiany
  (można je przestawić, o ile wyjście wnętrza (`Map1xx` ev "Wyjście/Drzwi -> Kruczogród") dostanie nowe współrzędne; mapa wnętrza się nie zmienia).
- Drzwi domowe są zdarzeniami z warunkiem godziny (skrypt kod 111 typu 12 + popup "Zamknięte."). Zawsze otwarte: ev22 tawerna, ev152 strażnica, ev209 stajnia, ev236 dzwonnica
  (testy: `tests/town_interiors_test.js` `ALWAYS_OPEN = {236}`), a także ev245 (zejście do studni) i ev246 (płyta).
- Jeden budynek bywa wejściem dwoma drzwiami (Kantor: ev94 + ev95; Ratusz: ev4 + ev114; Stajnia: dwa wyjścia ev38/ev39 -> jedna kratka (61,88)).
- Nazwy drzwi zaczynają się od "Drzwi: " (test town_interiors rozpoznaje po `^Drzwi: `); stare edytorowe drzwi mają nazwy "EV124/EV134/EV137/EV141" (test czyta je po tym, co ROBIĄ - transfer do map 102-110).
- Notatki `<Town:door=...>` czyta Kantor.js (`kantor`), reszta to znacznik dla narzędzi.

### 1.2 Wnętrza spoza listy budynków, wchodzące z Map008

| Wnętrze | Wejście na Map008 | Wyjście | Po co |
|---|---|---|---|
| Map118 "Dno studni" | ev245 "Studnia miejska: zejście" (52,49), lina | Map118 ev14 -> (53,50) kier. 4 | K26 (pierścionek w kałuży 5,6), W1 krata z krukiem (5,4); `Cysterna` (poziom wody) |
| Map119 "Archiwum zakonu" | ev246 "Płyta w ścieżce (ogród rycerzy)" (33,12), self switch A po otwarciu (W2: cienie o 12:00) | Map119 ev2 -> (33,13) kier. 2 | W2 rozdz. 5-6: Księga sygnałów (6,6), Kroniki zakonu (10,5) |
| Map001 -> Map008 | patrz tawerna | | |
| Map025/026 (pokoje/apartamenty) | przez tawernę | | W6 kryjówka Rafała, W14/15/16 |

---

## 2. Miejsca ("klucze") - współrzędne bieżące i kto ich potrzebuje

Mechanizm: `TownLife.js` czyta domyślne `TownLifeData.SPOTS` (TownLife_Data.js:35-47) i **nadpisuje je zdarzeniami "Miejsce: <klucz>" z mapy** (edytor wygrywa; klucze bez wpisu
w SPOTS też działają). Wtyczki dokładają klucze przez `TownLifeData.SPOTS[...] = ...` (tylko gdy klucza jeszcze nie ma) - te klucze **nie mają znaczników na mapie**
i żyją tylko w danych wtyczek (tabela 2.2). Kierunek (3. liczba) = w którą stronę stoi postać.

### 2.1 Znaczniki "Miejsce:" na Map008 (81) - id zdarzenia, kratka, kto/po co

Różnice między znacznikiem a SPOTS: `studnia_rynek` znacznik (50,49) vs dane (50,50); `rynek_srodek` znacznik (53,51) vs dane (53,52). Resztę zgadza się 1:1.

| Klucz (id) | Kratka | Kto / po co |
|---|---|---|
| tawerna (262) | 51,17 | dom kowala/woziwody/kupca/sołtysa/garbarza/Bartka/Wojciecha ("inside" wieczorem do tawerny); Act3 `door`; Wrak `rozbitek_noc`; podróżni (`podr_*`) |
| przed_tawerna (265) | 58,19 | patrol kaprala; goniec podróżny; "ławka przed tawerną" |
| brama_twierdzy (267) | 51,29 | patrol kaprala; podróżni (kartograf, żołnierz); Act3 wejście wroga |
| ogrod_zakonu (269) | 33,17 | dzwonnik stoi wieczorem; podróżni (wizytator, pielgrzym); tuż przed furtką ogrodu rycerzy (33,16) |
| staw (275) | 66,10 | praca woziwody ("work:staw") - dziś obok ogródka piwnego (stawu NIE MA); `CleanHUD_Compass` przykład |
| stragan1 (276) | 33,59 | piekarka/kowal/feliks/ludmila/ela/zlodziej wędrują; TownQuests: D4 zasadzka (`<7`), K-wypiek 5:20-6 (`stragan1`, TownQuests.js:4270) |
| stragan2 (281) | 33,45 | kupiec, feliks; podróżny "zboże" |
| studnia_rynek (284) | 50,49 | woziwoda, sołtys; TownQuests: kłótnie przy studni W6 fala 2 (TownQuests.js:3638, `<=9`), K9; Wrak/podróżni |
| rynek_srodek (287) | 53,51 | patrol; sołtys, bronek, zosia; **dzień targowy** (TownQuests.js:2302, `<=14`), K37 |
| rynek_lawka (288) | 50,46 | piekarka, dzwonnik, zosia siadają; podróżni |
| piekarnia_drzwi (289) | 38,73 | piekarka "dom"; = wyjście Map102 |
| kantor_drzwi (292) | 18,47 | kupiec "dom"; = wyjście frontowe Map103; w5_lada |
| kantor_przed (296) | 16,48 | kupiec stoi; podróżni; Kantor W5 `idz` (16,49) w pobliżu |
| kantor_rog (304) | 20,48 | kupiec stoi; podróżny "zboże" |
| dom11_drzwi (299), dom12_drzwi (315), dom13_drzwi (320), dom14_drzwi (340), dom15_drzwi (349), dom10_drzwi (482) | 45,74 / 45,88 / 79,75 / 78,89 / 21,34 / 31,74 | (brak użytkowników; tylko znacznik) |
| ratusz_drzwi (306) | 85,48 | sołtys "dom" |
| ratusz_przed (307) | 83,48 | sołtys stoi; ludmila/ela; podróżni (goniec); W6 |
| ratusz_obok (338) | 84,48 | feliks/kamerdyner stoją |
| dzwonnica (308) | 85,31 | dzwonnik "dom" + dzwonienie (`bell`) |
| schody_rzem (310) | 51,65 | patrol; K37 ucieczka złodzieja (`ROUTE`, TownQuests.js:3985); zlodziej |
| ulica_rzem (312) | 12,64 | patrol; kowal, garbarz, rafal |
| kowadlo (313) | 8,63 | praca kowala |
| kuznia_dom (314) | 13,61 | kowal "dom" |
| garbarnia (317) | 15,85 | praca garbarza |
| garbarz_dom (321) | 6,89 | garbarz "dom" |
| woziwoda_dom (322) | 59,74 | woziwoda "dom"; K37 `ROUTE`; |
| brama_wsch (323) | 100,51 | patrol kaprala (start); kapral/feliks/kamerdyner "dom" (znikają tu); TownQuests myto K11 (TownQuests.js:2323 `<=2.5`); Dwor.js myto (`P.town.gate`); podróżny `podr_dwor` |
| brama_pld (324) | 52,92 | patrol; gracz/bartek/wojciech "dom"; Garnizon werbownik (alt); `podr_droga`/`podr_przystan` |
| dom_mieszczan (326) | 36,39 | bronek, zosia "dom"; podróżni |
| pod_murem (332) | 58,90 | zlodziej, ludmila, ela, marek "dom"; podróżni |
| stodola (334) | 48,90 | rafal "dom"; podróżni |
| rynek_rog (335) | 71,47 | bronek, bartek, ludmila, ela, zlodziej wędrują |
| stragan1_obok (339) | 31,58 | ludmila, zlodziej |
| stragan_kosci (341) | 35,45 | Lucjan "gracz" (kości, K39) w dzień targowy |
| woz_pld (343) | 54,90 | woźnica Wojciech stoi (też Woz.js `POSTOJE.miasto.woznica`) |
| w6_ognisko (344) | 60,90 | rafal, marek (obóz W6) |
| plac_studnia (345), plac_tablica (346) | 50,51 / 57,39 | przekupka, wdowa, dzieci, weteran, goniec, urszula, kartograf |
| plac_1 ... plac_12 (348,355,356,360,373,375,376,379,383,384,387,388) | 38,47 · 64,47 · 38,55 · 64,55 · 45,47 · 58,47 · 45,54 · 58,54 · 40,41 · 63,41 · 40,61 · 63,61 | miejsca na placu: nowi mieszkańcy (kolodziej, przekupka, szwaczka, wdowa, kostek, jagodka, ciesla, weteran), podróżni (plac_3,5,6,7,8,9,11,12) |
| stragan_1 ... stragan_6 (392,393,396,397,401,406) | 38,45 · 65,45 · 70,45 · 38,59 · 65,59 · 70,59 | przekupka (1), kolodziej (2), ciesla (3), szwaczka (4), podróżny (2, 5) |
| skwer (411) | 70,71 | wdowa, dzieci; podróżni |
| brama_pd (412) | 52,91 | kolodziej "away"; (wnętrze bramy południowej) |
| stajnia_woz (415) | 69,86 | praca Szczepana; Kostek |
| straznica_warta (418) | 99,50 | szwaczka, weteran |
| kaplica_lawka (419) | 14,22 | ciesla; podróżni (wizytator, pielgrzym) |
| ciesla_warsztat (421) | 33,89 | praca cieśli |
| plyta (247) | 33,12 | podróżny "pielgrzym"; znacznik płyty W2 |
| kaplica_drzwi (426) 8,17 · dom_grabarza_drzwi (427) 20,13 · dom1_drzwi (430) 85,13 · dom7_drzwi (433) 42,88 · dom2_drzwi (434) 96,29 · dom3_drzwi (438) 7,49 · straznica_drzwi (441) 98,48 · dom4_drzwi (442) 84,64 · dom5_drzwi (444) 95,63 · dom6_drzwi (445) 33,87 · stajnia_drzwi (446) 61,88 · dom8_drzwi (451) 84,89 · dom9_drzwi (452) 95,89 | | "dom" nowych mieszkańców (= kratka przed drzwiami = wyjście wnętrza) |

Zasada pary: **kratka `<budynek>_drzwi` / `*_dom` == kratka wyjścia z wnętrza** (drzwi.y + 1). Przy przestawieniu budynku trzeba zmienić oba (wnętrze `Wyjście -> Kruczogród` ev + znacznik).

### 2.2 Miejsca dokładane przez wtyczki (BEZ znaczników - tylko w danych)

| Klucz | Współrzędne | Plik:linia | Kto/po co |
|---|---|---|---|
| grabarz_groby / groby_2 / kopie / furtka / przerwa / lampa / chata | 7,25 · 10,25 · 10,27 · 9,29 · 11,25 · 9,24 · 20,13 | `Zakon_Data.js:385-388` | Hieronim (cmentarz); chata = drzwi Domu grabarza |
| rozbitek_noc / rynek / mury / studnia | 51,17 · 56,51 · 30,19 · 52,50 | `Wrak_Data.js:54-59` | Eryk (rozbitek, id 948), W12; **`Wrak.js` wellWatch porównuje DOKŁADNIE z danymi `rozbitek_studnia`** |
| w5_piwnica, w5_lada | 14,48 · 18,47 | `Kantor_Data.js:297` | W5 (tylne i frontowe drzwi kantoru) |
| garnizon_werbownik | 24,46 | `Garnizon_Data.js:~103-110` (`add`) | werbownik Bęben alt na rynku |
| podr_sala, podr_pokoj, podr_medyk, podr_grajek | 51,17 | `Podroznicy_Data.js:203` | podróżni "w tawernie" |
| podr_droga, podr_przystan | 52,92 | `Podroznicy_Data.js:204` | podróżni "w drodze" (znikają przy bramie południowej) |
| podr_dwor | 100,51 | `Podroznicy_Data.js:204` | podróżny poborca "u dworu" (znika przy bramie wschodniej) |

### 2.3 Miejsca questów miasta (TownQuests, wstrzykiwane zdarzenia) - `js/plugins/TownQuests_Data.js:169-178, 199, 217-224`

| Klucz | id | Kratka | Po co |
|---|---|---|---|
| bakery_window | 951 | 38,73 | okienko Hanki (K-chleb) |
| notice_tavern | 952 | 52,16 | kartka na ścianie tawerny (`wall`) |
| notice_bakery | 953 | 39,73 | kartka na ścianie piekarni |
| notice_smithy | 954 | 9,62 | kartka na ścianie kuźni |
| notice_kantor | 955 | 19,47 | kartka na ścianie kantoru |
| south_gate | 956 | 53,93 | ślady pod bramą południową (tracks) |
| watch_post | 957 | 53,28 | K38 nocna warta przy bramie twierdzy (`Straz_Data.js:45`, `TownQuests.js:4002` `<=6`) |
| east_brazier | 958 | 101,49 | zgaszony kosz żarowy (`Straz_Data.js:92`) - = zdarzenie 225/226 kosza |
| w3_kupala | 959 | 51,90 | Melia przy ognisku Kupały PRZED bramą południową (tylko ta noc) |
| w6_tent1 / w6_fire | 903 / 905 | 58,92 / 59,90 | namiot i ognisko obozu uchodźców (fala 1) |
| w6_tent2 / w6_bogdan / w6_halina | 904 / 906 / 907 | 46,90 / 50,90 / 56,91 | fala 2 (Podgrodzie `_o` wersje na Map111) |

### 2.4 Akt III - oblężenie (`js/plugins/Act3_Data.js:41-52`, `Act3.js`)

Wszystko liczone od drzwi tawerny. `SPOTS[8]`: door (51,17), doorTile (51,16), gate [(51,31),(52,31),(51,30),(52,30),(50,30),(53,29),(50,29),(51,32),(52,32)] (brama twierdzy
= wejście wroga), guard [(48,18),(54,18),(46,19),(56,19),(49,28),(53,28),(44,18),(58,18)] (obrońcy), from [(51,32),(52,32),(51,31),(52,31)] (skąd idą fale),
bell (85,30) + bellStand (85,31) (lina alarmu = ev859 na (85,30); Ambroży stoi na bellStand), fires [(48,15),(54,15),(45,16),(57,16),(51,14)] (płomienie na fasadzie).
Fale w1, w2 `map: 8, from: "gate"` (Act3_Data.js:73,78); obrońcy Garnizonu `maps:[8], from:"gate"` (Garnizon.js:801,803). Po oblężeniu F9 skacze do (51,19) (Act3.js:1330).
Wymaga: wolnego pola 12 kratek między bramą (y29-32) a drzwiami (y17) na osi x ~44-58; wolnych miejsc strażników; widocznej fasady tawerny; drogi od tawerny do dzwonnicy (34 kratki).

### 2.5 Inne punkty, o które wtyczki "stukają" współrzędnymi (ani w SPOTS, ani w znacznikach)

| Co | Współrzędne | Plik:linia |
|---|---|---|
| Wizyty Kantora W5: kurier (733) wchodzi `gateIn`, wychodzi `gateOut`; gość (734) `east`; tylne drzwi `backDoor`/`backFront`; front | gateIn 52,104 · gateOut 52,105 · east 101,50 · backDoor 14,47 · backFront 14,48 · frontDoor 18,46 · tavern 51,18 | `Kantor_Data.js:71` |
| Kantor: `idz` rozdziałów W5 | (16,49) x4, (10,49), (14,49) | `Kantor_Data.js:281-287` |
| Garnizon: lista na rynku 656, szukający 657/658, Kłos 659 | (25,47) · (59,89) · (47,89) · (13,48 kier. 6) | `Garnizon_Data.js:276` |
| Dwór: wyrzucenie z ogrodu/koniec nocy | `manor.out` = [8, 102, 51, 4]; `town.gate` (100,51); `town.f9` (50,46,8) | `Dwor_Data.js:58-59` |
| TownQuests: wyrzucenie z ogrodu dworu | `pendingOut` = (102,51) kier. 4 | `TownQuests.js:2682` |
| Wóz/woźnica (Woz.js): przystanek "miasto" | woz (56,90) · woznica (54,90,2) · land (52,90,6) | `Woz.js:64` |
| Pola mieszczan (praca dniówkowa A10) | pole_1 (6,104) 8x4 · pole_2 (32,118) 8x4 [wychodzi poza mapę!] · pole_3 (62,104) 8x5 | `Zasoby_Data.js:197-200`; `Okolice_Data.js:144-146`; F9 `Zasoby.js:1376` (10,108) |
| Cmentarz: prostokąt, mur (2800-2820), furtka, lampka, 8 grobów (kruki) | rect (5,23) 8x6; furtka (8,28),(9,28); lampka 2821 (9,23); groby 2830-2837: (6,24)(7,24 kruk1)(10,24)(11,24 kruk2)(6,26)(7,26)(10,26 kruk3)(11,26) | `Zakon_Data.js:203-214`, `Okolice_Data.js:190`, discovery `Zakon_Data.js:287` (9,27 `near 3`), F9 `Zakon.js:1214` (9,27) |
| Szubienica Lorda | rect (87,121) 3x3, id 2840, at (88,123), discovery (88,124), F9 (88,125) - **WSZYSTKO POZA MAPĄ 120x120 (y >= 120)** | `Zakon_Data.js:214,249,288`; `Zakon.js:1214`; `Okolice_Data.js:191` |
| Okolice (rdzeń nowego terenu): "stara część" x<104, y<103; wejście testowe (musi być przechodnie) | OLD[8] = [104,103] · ENTRY[8] = [54,50] | `Okolice_Data.js:85,88` |
| Orzeł: lądowiska miasta | TOWN_SQUARES[8] = [29,17,76,27] (dziedziniec tawerny) · [30,37,73,63] (plac, = region 31) · [2,89,101,92] (ulica pod murem południowym); `LAND_REGION` 31 | `Orzel_Data.js:133-137` |
| Podróżni: D47 awantura na dziedzińcu | podworze (51,24), zasięg 9 | `Podroznicy5_Data.js:53` |
| Epilogi Serca (Underground): scena "rynek" kamera (53,55), aktorzy sołtys (53,52) Hanka (47,49) Kuba (51,52) Ambroży (47,52); scena "obóz" kamera (57,89), Ludmiła (57,90) Ela (58,91) Marek (59,90) Rafał (55,90) | | `Underground_Data.js:586-587, 617-621` |
| W16 Dezerter: obóz (57,89,2); `idz` (50,53,8) (51,31,8) (16,50,8); Dezerter.js bęben tylko na Map008 | | `Dezerter_Data.js:57,216-222` |
| W14 Poselstwo: `idz` (33,19,8) | | `Poselstwo_Data.js:196` |
| W15 Święte kości: `idz` (46,49,8) x4 [rynek przy studni], (15,24,8) x2 [przy cmentarzu/kaplicy]; kazanie Gaspara na rynku w dzień targowy | | `SwieteKosci_Data.js:220-226`, `SwieteKosci.js:123` |
| W4 Kasztelan rozdz. 3: `idz` (9,64,4) [kuźnia/rzemieślnicy] | | `Kasztelan_Data.js:182` |
| Znak mapy "Wzgórze tawerny" (Wrak) | 8: 24,18 w starej wersji - SPRAWDZIĆ (`Wrak_Data.js:~154`, nie zaktualizowano) | `Wrak_Data.js` |
| CleanHUD_Compass: cele z `TownLife.spot(key)` i `TownQuestsData.SPOTS` | po kluczach (patrz 2.1/2.3) | `CleanHUD_Compass.js:179-199` |
| Mapa wyspy (P): Kruczogród w środku planszy | (0.500, 0.500) | `MapaWyspy_Data.js:27` |

---

## 3. Co się zepsuje przy przesunięciu - lista do przepięcia (file:line, wartość)

### 3.1 Sztywne ID / NAZWY zdarzeń (przeniesienie bez zmiany id/nazwy = bezpieczne; zmiana = cicha awaria)

| Co | Gdzie | Szczegół |
|---|---|---|
| ev22 "Drzwi tawerny ->" na (51,16), transfer do Map001 (50,53) | `Kasztelan.js:301` (regex `^Drzwi tawerny`), `Act3_Data.js:44` (doorName), `tests/tavern_interior_test.js`, `tests/w4_borgar_test.js:115` (`event(22)` + locate 51,17), `tests/region_layers_test.js:4,35` | nazwa MUSI zaczynać się od "Drzwi tawerny"; Map001 ev10-12 muszą lądować w 50-52,17 (czyli kratka przed drzwiami) |
| ev39 "Furtka ogrodu rycerzy" `<Occupy:left=1,right=1,up=1>` (33,16), `!$SF_Gate3`, self switch A = otwarta (klucz `gardenKey`) | `TownQuests.js:1525,1625,1527` (po NAZWIE, `^Furtka ogrodu rycerzy`); save: `[8,39,"A"]`; `tests/knights_garden_test.js:12,37` (`event(39)`) | stub wizji K33 przez kraty; furtka musi mieć 3 kratki szerokości i region 3 nad sobą (32-34,14) |
| ev246 "Płyta w ścieżce (ogród rycerzy)" (33,12) + ev247 "Miejsce: plyta" | `TownQuests.js:1403` (`^Płyta w ścieżce`), save `[8,246,"A"]`; `tests/w2_archive_test.js:53` (`sl.id === 246`); `tests/quest_places_test.js:126` (go 33,13) | po otwarciu W2: transfer Map119 (2,4); powrót Map119 ev2 -> (33,13) |
| ev43/ev44 posągi `!Statue` (32,9) i (34,9) + ev45 miecz `!Weapon` (33,9) | `TownQuests.js:1520` `CAP.statue [32,9]`, head (32.5,7.15), ground (32.6,16.3); `:1574` (capStatueId: zdarzenie DOKŁADNIE na (32,9) z `!Statue`); `:1626` (cokoły W3 = KAŻDY `!Statue` z y === 9) | dekoracyjne posągi (ev20 (47,17), ev21 (55,17) i "Posąg przed kaplicą" ev47 (5,17), ev49 (11,17)) NIE MOGĄ stać w rzędzie y = 9; |
| strefy ogrodu rycerzy na sztywno | `TownQuests.js:1541` (strzał w czapkę: `sy >= 15.5`, x 28.5-37.5, y >= 6.5), `:1608` (podglądanie: x 31-35, y 16-19 kier. 8), `:2972` i `:2999` (wejście do ogrodu / cienie 12:00: x 29-37, y 4-13), `tests/knights_garden_test.js:1` (stare "x2-10, y4-13" - nieaktualny opis) | ogród rycerzy MUSI zostać w x 29-37, y 4-13 (albo zmienić 4 miejsca) |
| ev241/ev242 "Studnia miejska" `<Studnia:2>` (51,50),(52,50) + ev245 "Studnia miejska: zejście" (52,49) | `Farming_Plots.js:574-594` (racje po `<Studnia:N>`; klucz w zapisie = "8:" + NAZWA "Studnia miejska"), `tests/cysterna_test.js:256-264` (`event(241)`), `tests/w1_chapters_test.js:71` (`event(245)`), `tests/town_well_test.js` | nazwa bez zmian; id 241/245 w testach; blok studni to ~(50-53, 47-52) |
| ev236 "Drzwi: Dzwonnica" | `tests/town_interiors_test.js` `ALWAYS_OPEN`; Act3: dzwon (85,30) | zawsze otwarte |
| ev94 "Drzwi: Kantor" (14,47) z `<Town:door=kantor>` | `Kantor.js:388` (`backDoorEv`: zdarzenie DOKŁADNIE na `backDoor` (14,47) z tą notatką) | przy przestawieniu zmienić `Kantor_Data.js:71` backDoor/backFront/frontDoor; Kłos 659 (13,48) przy tylnych drzwiach |
| ev4/ev114 ratusz, ev95 kantor front | `Kantor_Data.js:71`, `tools/miasto2/budynki.json` | |
| ev225-228 kosze żarowe przy bramie wsch. | `TownQuests_Data.js:178` (east_brazier 958 na (101,49)); `Straz_Data.js:92`; `tests/light_shadow_test.js:88` (`event(88)` - NIEAKTUALNE: 88 to teraz Drzwi Piekarni) | |
| "Chorągiew Lorda Zaleskiego" ev223/224 (102,49),(103,49) | `tests/east_gate_test.js` (liczy 2; test w całości NIEAKTUALNY - oczekuje wyjść "Posiadłość Lorda" (103,50-51), których już nie ma) | |
| ev859 lina dzwonu (wstrzykiwana) | `Act3.js:1292-1296`, `tests/act3_test.js:91-92` | stoi na `bell` (85,30) |
| Zdarzenia ChoppableTree/skały/krzaki (62) | zapisy: self switch A/B per `[8, id, ...]`, `tools/drzewa` (spis; przy nowej mapie uruchomić ponownie) | nowe id = stary zapis traci stan ścięć |
| Zapisy Zakon: groby kruków self B | `[8, 2831/2833/2836, "B"]` (`Zakon.js` ~287-303,359,755,1097) | id 2800-2840 wstrzykiwane - stałe |

### 3.2 Współrzędne w wtyczkach (poza listami z rozdziału 2)

| Plik:linia | Wartość |
|---|---|
| `TownLife_Data.js:35-47` | domyślne SPOTS (35 kluczy) - patrz 2.1 (znaczniki je nadpisują; PO przebudowie wystarczy postawić znaczniki, dane zostają jako zapas) |
| `TownLife_Data.js:1020` | `MAP: 8, FIRST_ID: 910, EXTRA_RANGES [[2900,2949],[2950,2959],[3020,3049]]` |
| `TownQuests.js:89,112` | `TOWN = 8`, `onTown()` |
| `TownQuests.js:1520,1541,1574,1608,1626,2972,2999,2682` | patrz 3.1 |
| `TownQuests.js:2302,2323,2327,3638,3985,4002,4270` | spoty `rynek_srodek` (targ), `brama_wsch` (myto K11 `<=2.5`), kapral, `studnia_rynek` (`<=9`), ROUTE K37 (`schody_rzem`->`woziwoda_dom`->`pod_murem`), `watch_post` (`<=6`), `stragan1` |
| `TownQuests.js:4696` | `wellBonus(mapId)` dla mapy 8 (Cysterna `wellLow`) |
| `Act3.js:295,1125,1164,1202,1292,1330`; `Act3_Data.js:35,40-52,73,78,122,157-186` | patrz 2.4 |
| `Kantor.js:223,388,1103`; `Kantor_Data.js:40,71,281-287,297` | patrz 2.5 |
| `Garnizon_Data.js:41,276`; `Garnizon.js:399-404,848-852,801,803` | TOWN = 8; zdarzenia 656-659; obrona `maps:[8]` |
| `Dwor_Data.js:41,58-59`; `Dwor.js:379,653` | `town.gate` (100,51) `<=3`; targ 6-10.5 (Feliks); `manor.out` |
| `Zakon_Data.js:203-214,248-249,287-288,385-390`; `Zakon.js:1214` | cmentarz, szubienica, Hieronim |
| `Wrak_Data.js:54-59`; `Wrak.js` (wellWatch) | Eryk |
| `Zasoby_Data.js:64-66,197-200`; `Zasoby.js:1376` | `IDS[8] = [2235,2299]`; pola |
| `Okolice_Data.js:85,88,144-146,190-191` | OLD, ENTRY, PLAN_SPOTS (kolizja: miejsce w "starej części" = błąd, `Okolice.js:145-152`) |
| `Orzel_Data.js:133-137,LAND_REGION 31`; `Orzel_Lot.js:389-392` | lądowisko |
| `Woz.js:64` | przystanek miasta |
| `Podroznicy_Data.js:171-203`; `Podroznicy5_Data.js:53`; `Podroznicy5.js:246` | podróżni |
| `Underground_Data.js:586-587,617-621` | epilogi |
| `Dezerter_Data.js:48,57,216-222`; `Dezerter.js:143`; `SwieteKosci_Data.js:220-226`; `SwieteKosci.js:123`; `Poselstwo_Data.js:50,196`; `Kasztelan_Data.js:34,182` | wątki podróżnych i W4 |
| `TawernaCore.js:605-660` | rejestr zakresów id (przy kolizji wygrywa zdarzenie z edytora) |
| `Swiat_Data.js:20,50-105` | krawędzie (rozdz. 4); `SHIFT` migracji zapisów (Map008 bez przesunięcia) |

### 3.3 Miejsca JUŻ DZIŚ nieaktualne po ucięciu mapy / zmianie planszy (do naprawy przy okazji, niezależnie od miasta)

- **Szubienica** y 121-125 (Zakon_Data.js:214,249,288; Zakon.js:1214; Okolice_Data.js:191) i **pole_2** (32,118) 8x4 -> y 118-121 (Zasoby_Data.js:199; Okolice_Data.js:145) wychodzą poza 120 rzędów.
- **Brama wschodnia (100-103, 50-51) nie prowadzi już do dworu**: na planszy 3x3 dwór (Map024) leży na PÓŁNOC od miasta. Wschodnie wyjścia (y 44-119 i 7-27) wiodą na Map004
  (Łąka pod Gawrą). Dotyczy to: `Dwor_Data.js:58` (`manor.out` [8,102,51,4]), `Dwor.js:653` (myto), `TownQuests.js:2682` (pendingOut), `Podroznicy_Data.js:204` (`podr_dwor`),
  TownLife: kapral/feliks/kamerdyner "inside: brama_wsch" znikają przy tej bramie, `brama_wsch` jako start patrolu. Dojście do dworu = Brama północna (25,5) -> droga dworu.
- Zdarzenia na Map022 "Przejście -> Kruczogród (brama wschodnia)" (0,41-43) -> (102,17-19) (Map022 zaparkowana; martwe).
- `tests/east_gate_test.js`, `tests/knights_garden_test.js` (opis x2-10), `tests/region_layers_test.js` (24,16), `tests/light_shadow_test.js` (event 88) - oparte na starych współrzędnych.
- `Wrak_Data.js` ~154 znak mapy "Wzgórze tawerny" - sprawdzić.

### 3.4 Testy ze sztywnymi kratkami Map008 (po przebudowie miasta uruchomić i poprawić; `t.go(8, x, y, dir)` = `tests/<plik>:linia`)

| Test:linia | Kratka | | Test:linia | Kratka |
|---|---|---|---|---|
| act2_quests:94 | 53,55 | | pustelnia:180,226 | 71,49 |
| act3:62,89,199,232 / :215 | 51,19 / 37,19 | | quest_places:126 | 33,13 |
| bron_dane:197 | 40,40 | | region_layers:39 | 46,17 |
| cysterna:254 | 51,52 | | regulars_quests:42,83,145,189 | 34,61 · 16,49 · 51,47 · 51,92 |
| field_loss:164,253 | 82,50 | | regulars:71,93,127,137 | 15,86 · 33,18 · 58,91 |
| garnizon:220,265,289,337 | 26,47 · 58,89 · 14,50 | | stajnia:288 | 52,90 |
| jakosc_grafiki:163,182; wydajnosc:119 | 50,53 | | town_interiors:57,111,117 | `d.town` = (drzwi.x, drzwi.y+1) czytane z mapy |
| kruk:346 | 57,46 | | town_quests2:128 | 35,47 |
| laka:17 | 13,27 | | town_quests:287,370 | 98,51 · 34,59 |
| lancuchy:72,85,269 | 46,49 · 27,51 | | tree_see_through:27 | 51,18 |
| latarnia:232,245,276; motyle:364 | 53,46 | | ubior_dane:203 | 30,30 |
| ludzie:137; przejscie_ciagiem:107; w1_chapters:83; w4_key:57 | 9,64 | | w1_chapters:135,189,216,225 / :240 | 80,48 / 50,52 |
| mapa_woz:86 | 50,90 | | w2_archive:77,88 | 51,48 · 14,48 |
| orzel:562 | 52,19 | | w4_borgar:112 | 51,17 |
| podgrodzie_life:57; podroznicy:88 | 53,55 | | w5:84-463 | 12,49 · 20,48 · 10,49 · 16,49 · 14,48 · 100,50 · 18,47 · 74,48 |
| poselstwo:248 | 51,27 | | w6:65,91,189,207,234,306 | 49,89 · 57,89 · 47,49 · 16,50 |
| przejscie_ciagiem:148 | 51,19 | | w7:133,142,324,372,409 | 51,52 · 99,51 · 34,61 |
| widok:43 | 52,70 | | wrak:200; zakon:246; zasoby:387 | 57,50 · 9,30 · 10,109 |

Narzędzia, które znają współrzędne: `tools/miasto2/{budynki.json,mapowanie.json,build.py,przepnij.py}` (poprzednia przebudowa), `tools/plansza/*` (plansza 3x3; `wszystko.py`
odmawia po instalacji), `tools/drzewa` (spis ścinanych drzew - uruchomić po budowie), `tools/mapy/kontrola.py` (linter map: blaty, dostępność, obiekty
rozcięte), `tools/nazwa_mapy/obrazki.js` (grafika nazwy "Kruczogród"), `tools/audyt/przejscie.js`, `tools/interiors/*` (Wyjścia wnętrz: `ilib.py exit_to`).

### 3.5 Jak działało przepięcie 2026-10-22 (do ponownego użycia)

1. **Budowa w kopii roboczej**: `tools/miasto2/build.py` składa nową mapę z bloków starej mapy (przeniesionych z przesunięciem dx,dy: `taras_tawerna`, `mur_zamku`,
   `studnia`, `kantor`...) + nowe budynki z prefabrykatów (`tools/town/prefabs`) -> `tools/miasto2/staging/Map008.json`. Plan i lista bloków: `plan.py` (`BLOKI`) + obraz
   `docs/miasteczko/plan_nowe_miasto.png`. Nic nie ruszało `data/`.
2. **Mapowanie** w `tools/miasto2/mapowanie.json`: (a) `a_bloki` - stary prostokąt -> dx,dy + lista id zdarzeń, które jadą z blokiem (id ZOSTAJĄ, zmienia się x,y);
   (b) zdarzenia stare -> nowe (usunięte/nowe); (c) miejsca: klucze SPOTS i punkty wtyczek; (d) strefy. `budynki.json`: klucz, prostokąt, id i kratka drzwi, kratka
   przed drzwiami, wnętrze, prefabrykat.
3. **`tools/miasto2/przepnij.py`** = jeden skrypt instalacji (próba bez `--wykonaj` zapisuje raport `przepnij_raport.md`): (1) instaluje mapy (Map008 z staging
   tylko gdy suma SHA zgadza się z `sha_przed.txt`, wnętrza 178-190, 13 wpisów MapInfos); (2) przeniesienia (kod 201) z innych map na Map008; (3) współrzędne w
   `js/plugins/*`; (4) testy i narzędzia; (5) ostrzeżenia w starych generatorach. **Każda zmiana ma warunek starej wartości** (tekst/parametry muszą pasować; inaczej
   "pominięta" i zgłoszona; jeśli stoi już nowa wartość - "już przepięta"), pliki zapisywane binarnie z zachowaniem LF/CRLF, kopie zapasowe do archiwum obok projektu.
   Wynik 2026-10-22: 443 zmiany, 0 pominiętych.
4. **Wnioski dla "miasto3"**: (i) zachować id zdarzeń i NAZWY (rozdz. 3.1), (ii) przestawiać bloki z listą id (jak `a_bloki`), (iii) znaczniki "Miejsce:" przenosić razem z blokami,
   a dane (rozdz. 2.2, 2.3, 2.5) przepiąć skryptem z warunkiem starej wartości, (iv) skrypt `przepnij.py` jest NIEAKTUALNY (jego "stare" wartości to układ 104-szerokiego miasta) -
   trzeba nowego `mapowanie.json` ze "starymi" wartościami z TEGO dokumentu, (v) drugi wzór: `tools/plansza/wtyczki_kratki.py` (spis liczb z drzewa składni JS ->
   `decyzje.json` -> kopie wtyczek/testów w staging, instalacja `zainstaluj.py` z kopią zapasową i `--przywroc`).
5. Zasady z `docs/miasteczko/NOWE_MIASTO.md`: id zdarzeń mapy 1-499, instalacja przy ZAMKNIĘTYM edytorze, test poprzedzony `tools/mapy/kontrola.py`/`kontrola.bramka()`,
   przejścia min. 2 kratki szerokie, każde drzwi od ulicy, woda rzadka, każde światło to ogień, postacie w stylu bohatera.

---

## 4. Krawędzie mapy (4 szwy planszy 3x3)

Źródło: `js/plugins/Swiat_Data.js:20,50-105` (kratki świata = początek mapy + kratka lokalna; Map008 zaczyna się w (120,120)). Poniżej przeliczone na kratki LOKALNE Map008
(x dla N/S, y dla W/E). Tylko te przedziały są otwartymi przejściami (`Krawedzie.js` przenosi bohatera); pozostałe kratki krawędzi są zamknięte (mur/woda/zapora).

| Krawędź | Sąsiad | Otwarte kratki lokalne | Zamknięte | Drogi / bramy dochodzące |
|---|---|---|---|---|
| **N** (y=0) | Map024 Posiadłość Lorda (jej S) | x 0-12, 15-61, 63-76, 79-90, 93-101, 104-119 | 13-14, 62, 77-78, 91-92, 102-103 | **Brama północna** ev325 "łuk, przyczółki i skrzydła" `!$North_Gate_B` (25,5), latarnie-ognie ev327/329 (23,2),(27,2); droga "brama północna miasta -> droga dworu" (`tools/plansza/drogi.py`, start na planszy (146,119) = lokalnie x~26); Map024 dochodzi tu swoją południową krawędzią |
| **W** (x=0) | Map111 Podgrodzie (jego E; przesunięcie 111 = (18,33)) | y 0-1, 50-51, 103-119 | 2-49, 52-102 | **Brama zachodnia**: ev243/244 `!$West_Gate` (1,52)/(1,51), latarnia na baszcie ev239 (1,49), drogowskaz ev240 (3,63); wschodni mur Map111 jest KOPIĄ zachodniego muru Map008 (`tools/podgrodzie/build_podgrodzie.py`) - zmiana muru/bramy zachodniej wymaga poprawki Map111 (rzędy Map111 17-18 = Map008 50-51) |
| **E** (x=119) | Map004 Łąka pod Gawrą (jej W) | y 0-4, 7-27, 29-31, 33-42, 44-119 | 5-6, 28, 32, 43 | **Brama wschodnia (NE)**: ev330 `!$East_Gate` dach i słupy (102,20), ev333 skrzydło (102,18), światło ev336 (103,17); droga "brama wschodnia miasta -> Łąka pod Gawrą" (start planszy (224,137) = lokalnie (104,17)). **Brama Lorda (E, środek)**: bramka 100-103 x 50-51, kosze ev225-228 (101,48-53), chorągwie ev223/224 (102-103,49), drogowskaz ev229 (99,52), spot `brama_wsch` (100,51), `straznica_warta` (99,50), Strażnica Lorda (89-100 x 37-47). Dziś prowadzi na Łąkę (nie do dworu) |
| **S** (y=119) | Map003 Kruczy Jar (jego N) | x 0-39, 41-42, 44-49, 51-58, 60-71, 74-119 | 40, 43, 50, 59, 72-73 | **Brama południowa** w murze (rzędy ~92-97): spot `brama_pld`/`brama_pd` (52,91-92), `south_gate` (53,93), dwie bramki dekoracyjne ev143/144 `!$Big_Decoration` (50,94),(55,94); za bramą pola mieszczan, droga "droga za murem miasta (południe) -> Kruczy Jar" (start planszy (154,236) = lokalnie (34,116)); Kantor W5: gateIn (52,104)/gateOut (52,105) |

Uwagi do krawędzi:
- Zasada użytkownika (`feedback_seams_real_world`): teren ciągły przez szew, mury/bariery razem po obu stronach. Krawędź zamknięta muru musi pasować do sąsiada (Map024 S, Map111 E, Map004 W, Map003 N).
- Pas y 98-119 (południe) i x 104-119 (wschód) to nowy teren przy planszy 3x3 (nie miasto) - wolny do przebudowy; mur południowy i bramy leżą w rzędach 92-97.
- Przejścia z/do miasta poza szwami: tylko transfery z wnętrz (rozdz. 1) i stare martwe zdarzenia z zaparkowanych map (3.3). Zdarzeń "Przejście -> ..." na samej Map008 NIE MA (krawędzie obsługuje Krawedzie.js po `Swiat_Data.links`).
- `Orzel_Data.js:140` `SIDES[8]` (S->125, N->13, E->24, W->111) to stary graf, "nic go nie czyta" (komentarz). Lot orła przechodzi przez `links` jak pieszo.

---

## 5. Co gracz może robić w mieście dziś

| Czynność | Gdzie | Szczegóły / źródło |
|---|---|---|
| Wejść do tawerny i tam: zmiana (praca), tablica zleceń, nocleg w pokojach, kości (Lucjan/Bartek), rzutki, siłowanie (D6 turniej w dzień targowy 18-22), stali bywalcy | ev22 (51,16) | Map001 / Map025 / Map026 (TavernShift*, TavernLife*, QuestBoard*) |
| Kupować/sprzedawać broń i zbroję, naprawiać metal | Tadek Młot, kuźnia 3-14 x 56-63, 6-17 | `Bron_Data.js:494` SKLEPY.kowal; rozmowa wszędzie, gdzie stoi (kowadło 8,63) |
| Kupować wszystko, sprzedawać wszystko (skup 0.45); towary Kantora | Baltazar Vey, Kantor 8-18 (po W5 Ludmiła 9-15) | `Bron_Data.js:524,532`, `Kantor_Data.js:100` GOODS |
| Kupować ubrania, naprawiać, farbować; sprzedawać len/płótno/wełnę/filc | Dorota Igła, dom 3, 7-20 | `Ubior_Data.js:247` |
| Skóra: ubrania i zbroja skórzana, naprawa, skup skór | Ignac, 6.5-19 | `Ubior_Data.js:~259`, Bron (naprawa "garbarz") |
| Kapelusze słomkowe, chusty, łapcie; skup słomy | Agata (przekupka), 6-18.5, stragan 1/stragan1 | `Ubior_Data.js:~270` |
| Starzyzna (używane rzeczy) | Józek Łata - w PODGRODZIU (nie w mieście) | |
| Woda: 2 nabrania dziennie ze studni (rację przydziela sołtys; w suszy mniej) | studnia (50-53, 47-52), ev241/242 | `Farming_Plots.js:574`; `Cysterna` wpływa (`wellLow`); zejście liną ev245 (52,49) -> Map118 |
| Zadania mieszkańców (K1...K61, D*, W1-W16) | rozmowy z mieszkańcami po całym mieście + miejsca z 2.3 | `TownQuests*`, `Rynek_Data`, `Straz_Data`, ... |
| Dzień targowy co 7 dni, 6-14: stragany wędrownych kupców, Lucjan z kośćmi (K39), turniej siłowania wieczorem, kazanie Gaspara (W15), złodziejaszek (K37, 8.5-10.4) | plac (30-73 x 37-63), `rynek_srodek`, `stragan_*`, `stragan_kosci` | `TownQuests_Data.js:92` MARKET |
| Dzwonić w dzwon (mini-gra dzwonu), sygnały | dzwonnica Map108 (ev236) | W2/W3; Akt III alarm = lina ev859 |
| Praca w stajni (mini-gra 4-częściowa), nocleg na stryszku (5 G lub za darmo po zmianie), wóz za darmo przy pełnym zaufaniu | stajnia ev209 (61,87) | `Stajnia.js`, `Stajnia_Zmiana.js` |
| Jazda wozem między przystankami (miasto <-> przystań, dwór, Kruczy Jar) | woźnica Wojciech przy (54,90)/(56,90), 7:00-19:30 | `Woz.js:64` |
| Praca dniówkowa na polach mieszczan (siew wiosną dni 1-10, żniwa jesienią 1-14) | pola pod murem południowym | `Zasoby_Data.js:195-200` (A10) |
| Cmentarz: oczyścić groby (4 uderzenia), kruki na grobach (D37), odkrycie "Stary cmentarz" | prostokąt (5,23) 8x6 | `Zakon_Data.js:203` |
| Ogród rycerzy: wejście kluczem Ambrożego, strzał w czapkę K33, płyta W2 o 12:00 -> archiwum zakonu | x 29-37, y 4-13 | `TownQuests.js` |
| Obóz uchodźców pod murem południowym (W6), pomoc, głosowanie | namioty 46-60 x 90-92 | `TownQuests_Data.js:217-224` |
| Odpoczynek siedząc (ławki: `rynek_lawka`, `kaplica_lawka`, `plac_*`), deszcz, kałuże | plac | Needs/Survival (rest ladder) |
| Zasadzka/walka: bandyci i najemnicy w mieście przy oblężeniu (Akt III), awantura D47 na dziedzińcu (51,24), wilki vs bandyci (Starcia) poza murami | dziedziniec tawerny + brama twierdzy | Act3, Podroznicy5, Humans |
| Nocna warta K38 przy bramie twierdzy, noc w mieście bezpieczna (brak wilków; nocleg w mieście bez nalotów) | `watch_post` (53,28) | `Straz_Data.js` |
| NIE ma: budowania i upraw w mieście (`<Farm:off>`), polowania, wody w stawie/wodospadzie (usunięte 2026-10-12), kuźni/stołu rzemieślniczego jako stacji gracza (kuźnia to NPC + animacja) | | |

---

## 6. Potrzeby fabularne dla nowego układu

Twarde (łamią grę lub test, jeśli zniknie / przesunie się bez przepięcia):

1. **Tawerna na tarasie zamkowym NAD placem**, drzwi tawerny z widokiem na dziedziniec; dwie linie: (a) stała nazwa drzwi "Drzwi tawerny ->..." (ev22); (b) wolny dziedziniec
   ~x 29-76, y 17-27 (orzeł: TOWN_SQUARES; Akt III strażnicy 44-58 x 18-19; awantura D47 (51,24); żłób/poręcz konna ev148). Za piwnicą tawerny GÓRNA CZĘŚĆ cysterny zamkowej
   (decyzja 2026-11-08: Borgar napełnia zimą, lord chce ją przejąć; ludzie przychodzą do tawerny po wodę) - tawerna ma być "sercem wyspy" także z zewnątrz.
2. **Brama twierdzy (wąska brama w murze zamkowym) pod dziedzińcem, na osi tawerny**, ~12 kratek od drzwi (Act3 `gate`/`from` x 50-53, y 29-32; `brama_twierdzy`; `watch_post`). Oblężenie
   idzie bramą -> dziedziniec -> drzwi; potrzebne szerokie schody/rampa z placu na taras (nie schodki 1-kratkowe: tłumy walczą).
3. **Studnia miejska w środku placu** (blok ~50-53 x 47-52): dwa zdarzenia `<Studnia:2>` + zejście (liną) obok; `studnia_rynek`, `plac_studnia`; wokół wolne kratki dla kolejki
   (K9 kłótnia, W6 fala 2, epilogi z aktorami 47-53 x 49-52). Plac handlowy ~44 x 27 (region 31 = lądowisko orła) z 6 straganami, ławkami, tablicą ogłoszeń (57,38).
4. **Ogród rycerzy** obok tawerny (po lewej, tuż nad schodami), osłonięty murem, z **furtką z kratą 3 kratki** (przez kraty widać czapkę na posągu K33; podglądanie z dołu na kier. 8),
   **dwoma posągami w jednym rzędzie** (czapka na lewym) i **mieczem w kamieniu** między nimi, **płytą w ścieżce ~3 kratki poniżej linii posągów**, wszystko w jednym prostokącie
   (dziś x 29-37, y 4-13), z widokiem na ścieżkę od bramy; światło z góry (cienie o 12:00 mają się zejść na płycie - patrz Cienie.js / Sky.js).
5. **Dzwonnica** (3x3 kratki, własne wnętrze Map108) w widoku z placu, z drzwiami od ulicy; **blisko tawerny i placu** (dziś 34 kratki od tawerny) - dzwon 6/12/18 słychać wszędzie,
   lina alarmu (`bell`) osiągalna w trakcie oblężenia.
6. **Kaplica i cmentarz**: kaplica (Map178) jako budynek z dzwonkiem + ławka; **cmentarz** 8x6 z niskim murem, **furtka od dołu** (Zakon wstrzykuje mur 2800-2820, 8 grobów, lampkę), blisko domu
   grabarza (dziś chata (17-23,5-12), cmentarz 5-12 x 23-28 - oddalone o ~12 kratek). Hieronim chodzi tam 6-18. Poza miastem "za miasteczkiem, przy wschodniej drodze" szubienica (do zlokalizowania w mapie, 3x3 + przejście).
7. **Strażnica Lorda przy bramie wschodniej** (Wit, myto K11, stojaki z bronią, kukła, chorągwie, kosze żarowe), **droga do dworu** od bramy północnej. Trzeba rozstrzygnąć: gdzie jest "brama Lorda"
   (dziś wschód -> Łąka; dwór leży na północy). Fabuła (W1, W7, K11, K12, K38) mówi o "bramie wschodniej / drodze do dworu" - albo przestawić `brama_wsch`, `podr_dwor`,
   `manor.out`, `pendingOut` na bramę północną, albo zachować dwie bramy.
8. **Mur miejski z bramami** na 4 szwach (rozdz. 4); brama zachodnia w rzędach 50-51 i 0-1 (Podgrodzie), południowa na osi placu (x ~52), wschodnia (NE y17-20 i środkowa y50-51), północna (25,5);
   mur południowy rzędy 92-97 (obóz W6 pod murem, w pasie y 89-92 ulica wzdłuż muru: `pod_murem`, `stodola`, `woz_pld`, `w6_ognisko`, TOWN_SQUARES [2,89,101,92]).
9. **Piekarnia, kuźnia, garbarnia, dom woziwody, dom mieszczan, kantor** z drzwiami od ulicy i kratką przed drzwiami przechodnią (spoty `*_drzwi`); kuźnia ma kowadło na zewnątrz (8,63), garbarnia
   plac pracy osobno od domu (15,85 vs 6,89); piekarnia ma okienko od ulicy (38,73); **kantor ma DWOJE drzwi (frontowe i tylne) na różnych ulicach/podwórkach** - tylne ciche, osłonięte
   (nocne wizyty 23-1, kurier od południa x~52, gość od wschodu). Ratusz z kancelarią (dwoje drzwi). Szyldy: piekarnia, ratusz, szwaczka, stajnia.
10. **Stajnia z wozownią** przy bramie (dziś pod murem południowym, przy `woz_pld`/`brama_pld`) - miejsce startu fabuły po "Wezwaniu króla" (bohater trafia tu w dniu 3); wozy, koryto,
    stóg; dwa wyjścia z jednej bramy; przystanek wozu `miasto` (56,90) obok. Dorzucony kierunek: zawsze otwarta.
11. **Ogródek piwny** na tarasie (dziś 66-75 x 5-14, stoły, beczki, latarnie; spot `staw` (66,10) = praca woziwody) i **dziedziniec/poręcz konna**.
12. **Obóz uchodźców W6** (do 2 namiotów + ognisko + Bogdan, Halina) pod murem w pasie ~46-60 x 90-92 (a gdy miasto zamknie bramę: Podgrodzie); wolne ~16 x 3 kratek bez budynków.
13. **Droga dworu**: Feliks dochodzi do rynku (targ 6-10.5), Lord w mieście 10-12 w dzień targowy (K37), Wit wypuszcza Kubę o 2:00 - potrzebne wolne przejście "brama -> rynek" bez przeszkód.
14. **Rynek (targ) co 7 dni**: stragany 1-6, `stragan_kosci`, `plac_1..12` (miejsca rozstawione po całym placu, nie za budynkami, min. 1 kratka wolna wokół), skwer (70,71) dla dzieci.
15. **Widoczność / dostęp**: zasady `docs/MAPY_ZASADY.md` (linter `tools/mapy/kontrola.py`: dostępność, blaty, gwiazdki, obiekty rozcięte), warstwy regionów (1 pod / 2 blokada / 3 nad), przejścia
    min. 2 kratki, każde drzwi osiągalne, bez niewidzialnych ścian; trawa/ścieżki ciągłe przez szwy; zdarzenia 1-499; drzewa wszystkie ścinalne (`tools/drzewa`).
16. **Miejsca do zachowania lub świadomie przestawienia** (każde to klucz 2.1): plac_1..12 (12), stragan_1..6 (6), skwer, brama_pd, stajnia_woz, straznica_warta, kaplica_lawka, ciesla_warsztat,
    plus 10 `*_drzwi` nowych domów, plus stare 35 (rozdz. 2.1).
17. **Dane/liczby do przeliczenia po przebudowie**: Okolice OLD/ENTRY/PLAN_SPOTS, Orzel TOWN_SQUARES + region 31, Zasoby FIELDS, Zakon CEMETERY/GALLOWS, Act3 SPOTS[8],
    Kantor PLACES, TownQuests CAP / strefy ogrodu, Woz POSTOJE, Dwor town/manor, Underground epilogi, W-wątki `idz`.
18. **Nowy styl (Fantastic Buildings: Medieval)**: nowy tileset => zmieni się `tilesetId` Map008; zachować: `<Clouds:on> <Farm:off>`, BGM, nazwę wyświetlaną "Kruczogród" (obrazek `img/nazwy_map`),
    zdarzenia świetlne `<Light...><LightWhen:night>` (40 świateł; "każde światło to ogień"), cienie budynków (`Cienie.js` liczy bryły z obrazków zdarzeń `!`), Widok.js (outdoor).
