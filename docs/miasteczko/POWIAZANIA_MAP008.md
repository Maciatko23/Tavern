# Powiązania mapy 8 (stan 2026-10-22, przed przebudową)

Spis wszystkiego, co jest przypięte do współrzędnych / numerów zdarzeń Map008 (104x138, tileset 11, 352 zdarzenia, max id 498).
Regiony: tylko 2 (1623 pola) i 3 (125 pól), wszystkie w starej części x 0-51, y 0-68; regionów 31/5/6/7 brak; brak wody A1.
Ścieżki względne do katalogu projektu. Spis zrobił agent (tylko odczyt); przy przepinaniu sprawdzaj w pliku, czy linia się zgadza.

## (A) Wtyczki

### A1. TownLife - mieszkańcy, miejsca, domy
| Plik:linia | Co | Współrzędne / ID |
|---|---|---|
| TownLife_Data.js:35-48 | SPOTS - 35 miejsc na Map008 | tawerna 24,17,8 · przed_tawerna 31,19 · brama_twierdzy 24,21 · ogrod_zakonu 6,17 · staw 39,10 (stawu nie ma) · stragan1 21,31 · stragan2 27,30 · studnia_rynek 23,34 · rynek_srodek 26,36 · rynek_lawka 19,35 · piekarnia_drzwi 6,39 · kantor_drzwi 14,39 · kantor_przed 12,40 · kantor_rog 16,40 · ratusz_drzwi 41,40 · ratusz_przed 39,40 · dzwonnica 47,30 · schody_rzem 24,44 · ulica_rzem 12,50 · kowadlo 7,49 · kuznia_dom 12,47 · garbarnia 16,45 · garbarz_dom 37,50 · woziwoda_dom 29,47 · brama_wsch 48,51 · brama_pld 25,53 · dom_mieszczan 9,31 · pod_murem 31,51 · stodola 21,51 · rynek_rog 30,38 · ratusz_obok 40,40 · stragan1_obok 19,31 · stragan_kosci 30,31 · woz_pld 27,51 · w6_ognisko 33,51 |
| TownLife_Data.js:49 | PATROL kaprala | brama_wsch -> ulica_rzem -> schody_rzem -> rynek_srodek -> brama_twierdzy -> przed_tawerna -> ... -> brama_pld |
| TownLife_Data.js:53-611 | plany dnia (inside = dojście do drzwi i zniknięcie) | kowal, piekarka, woziwoda (staw nocą - w1Water), kapral, dzwonnik, kupiec, soltys, garbarz, feliks, bronek, zosia, ludmila/ela/rafal/marek (alt -> Map111), zlodziej, gracz, bartek, woznica, kamerdyner |
| TownLife_Data.js:722 | MAP 8, FIRST_ID 910, EXTRA_RANGE 2900-2949 | 910-949, 2900-2949 wstrzykiwane |
| TownLife.js:70,105-111,148-161 | SPOTS domyślne; zdarzenie „Miejsce: <klucz>” na mapie nadpisuje | mechanizm do przenosin |
| Garnizon_Data.js:140 | garnizon_werbownik | 22,37,2 |
| Garnizon_Data.js:104-106 | werbownik (alt na mapie 8, garnizonRynek) | brama_pld -> garnizon_werbownik |
| Zakon_Data.js:495-500 | SPOTS_TOWN grabarza | groby 82,14 · groby_2 85,14 · kopie 85,16 · furtka 84,18 · przerwa 86,14 · lampa 84,13 · chata 84,20 |
| Zakon_Data.js:463 | Hieronim 2930, map 8 | - |
| Wrak_Data.js:52-57 | miejsca Eryka (948) | rozbitek_noc 24,17 · rozbitek_rynek 28,35 · rozbitek_mury 3,19 · rozbitek_studnia 25,34 |
| Kantor_Data.js:346,351 | W5 | w5_piwnica 10,40,8 · w5_lada 14,39,8 |
| Dwor_Data.js:328 | SPOTS.dwor = brama_wsch | 48,51,4 |

### A2. TownQuests
| Plik:linia | Co | Współrzędne / ID |
|---|---|---|
| TownQuests_Data.js:171-178 | miejsca zadań (951-958) | bakery_window 6,39 · notice_tavern 25,16 · notice_bakery 7,39 · notice_smithy 8,48 · notice_kantor 15,39 · south_gate 26,54 · watch_post 26,20 · east_brazier 49,49 |
| TownQuests_Data.js:200 | w3_kupala (959) | 24,51 |
| TownQuests_Data.js:217-224 | obóz W6 | namiot 903 31,53 · namiot 904 19,51 · ognisko 905 32,51 · Bogdan 906 23,51 · Halina 907 29,52 |
| TownQuests.js:88,111 | TOWN = 8, onTown() | - |
| TownQuests.js:1412-1416 | slabId(): po nazwie „Płyta w ścieżce”, zapas 246 | - |
| TownQuests.js:1531 | CAP (K33) posąg, głowa, czapka | 5,9 · 5.5,7.15 · 5.6,16.3 |
| TownQuests.js:1534-1538 | furtka po nazwie „Furtka ogrodu rycerzy”, gateOpen [8,id,'A'] | - |
| TownQuests.js:1552 | strefa strzału w czapkę | sy >= 15.5, x 1.5-10.5, y >= 6.5 |
| TownQuests.js:1583-1587 | capStatueId(): zdarzenie DOKŁADNIE na (5,9) z !Statue (ev 43) | 5,9 |
| TownQuests.js:1619 | podglądanie ogrodu | x 4-8, y 16-19 |
| TownQuests.js:1629-1637 | furtka (po nazwie), cokoły W3 = każde !Statue z y === 9 | ev 43, 44 |
| TownQuests.js:1885-1887 | K38 nocna warta | watch_post <= 6 |
| TownQuests.js:2031 | D4 zasadzka | stragan1 < 7 |
| TownQuests.js:2150-2154 | w2Garden wejście do ogrodu | x 2-10, y 4-13 |
| TownQuests.js:2242 | wyrzucenie z ogrodu dworu na mapę 8 | 50,51 kier. 4 |
| TownQuests.js:2438-2440 | cienie o 12:00 otwierają płytę | x 2-10, y 4-13 |
| TownQuests.js:2495 | K37 ucieczka złodzieja | schody_rzem -> woziwoda_dom -> pod_murem |
| TownQuests.js:3577 | w6Wave kłótnie przy studni | studnia_rynek <= 9 |
| TownQuests.js:4343 | dzień targowy | rynek_srodek <= 14 |
| TownQuests.js:~4365 | myto u kaprala | brama_wsch <= 2.5 |
| TownQuests.js:4670 | wellBonus(mapId) mapa 8 | - |
| TownQuests.js:1097-1099 | rezydent po notatce <Town:key> | - |

### A3. Akt III (oblężenie)
| Plik:linia | Co | Współrzędne |
|---|---|---|
| Act3_Data.js:34 | TRIGGER.maps [1,8,9], siegeMaps [1,8] | - |
| Act3_Data.js:41-48 | SPOTS[8] | door 24,17 · doorTile 24,16 · doorName „Drzwi tawerny” · gate 24,23 25,23 24,22 25,22 23,22 26,21 23,21 24,24 25,24 · guard 21,18 27,18 19,19 29,19 22,20 26,20 17,18 31,18 · from 24,24 25,24 24,23 25,23 · bell 47,29 · bellStand 47,30 · fires 21,15 27,15 18,16 30,16 24,14 |
| Act3_Data.js:71,77,123 | fale w1, w2 (from: gate), DOORS[8] | - |
| Act3_Data.js:157-186 | obrońcy maps:[8] from:"gate" | gate i guard |
| Act3.js:1286-1296 | lina dzwonu, zdarzenie 859 | na bell 47,29 |
| Act3.js:290 | Ambroży na bellStand | 47,30 |
| Act3.js:1340 | F9 start oblężenia | door + 2 = 24,19 |
| Act3.js:1117-1197 | ognie, pasek drzwi, lina | z SPOTS[8] |

### A4. Kantor (W5), Kasztelan (W4), Dwór (W7)
| Plik:linia | Co | Współrzędne / ID |
|---|---|---|
| Kantor_Data.js:37 | MAP.town 8 | - |
| Kantor_Data.js:67-68 | PLACES | backDoor 10,39 (ev 94) · backFront 10,40,8 · frontDoor 14,38 (ev 95) · gateIn 25,66 · gateOut 25,67 · east 50,50 · tavern 24,18 |
| Kantor.js:250-252 | kurier 733 (gateIn), gość 734 (east) | - |
| Kantor.js:446-449 | backDoorEv: zdarzenie DOKŁADNIE na 10,39 z <Town:door=kantor> | 10,39 |
| Kantor.js:543-552 | podmiana listy drzwi ev 94/95 | 94, 95 |
| Kantor.js:452-455 | Kłos przy tylnych drzwiach (659) <= 6 | - |
| Kantor.js:1255 | wyjście z piwnicy 171 | backFront 10,40 |
| Kantor.js:1286-1292 | skoki F9 W5 | 12,41,8 · 8,37,2 · 12,41,8 · 10,41,8 · 12,41,8 · 12,41,8 |
| Kasztelan.js:71,624,634,670 | drzwi tawerny po nazwie „Drzwi tawerny” | - |
| Kasztelan.js:891 | F9 rozdz. 3 | 8,50,4 |
| Dwor_Data.js:37,53-55 | MAP.town, manor.out, town.gate (myto <= 3), town.f9 | out 8,50,51,4 · gate 48,51 · f9 24,33,8 |
| Dwor.js:441,750,923,980 | Feliks na targu, myto, wyrzucenie, F9 | jak wyżej |

### A5. Garnizon, Zakon, Zasoby, Okolice
| Plik:linia | Co | Współrzędne / ID |
|---|---|---|
| Garnizon_Data.js:39 | TOWN 8 | - |
| Garnizon_Data.js:284 | TOWN_EVENTS | lista 656 20,37 · szukający 657 32,50 · 658 20,50 · Kłos 659 9,40 kier. 6 |
| Garnizon.js:536-550,1033-1074 | wstrzykiwanie / pokazywanie | - |
| Zakon_Data.js:196-209 | CEMETERY prostokąt x 80-87, y 12-17 | furtka 83,17 84,17 · lampka 2821 84,12 · groby 2830-2837: 81,13 82,13(kruk1) 85,13 86,13(kruk2) 81,15 82,15 85,15(kruk3) 86,15 · mur 2800-2820 z prostokąta |
| Zakon_Data.js:209 | GALLOWS 93-95 x 54-56 | szubienica 2840 94,56 |
| Zakon_Data.js:241-242 | miejsca do Okolice | cmentarz 80,12 8x6 · szubienica 93,54 3x3 |
| Zakon_Data.js:299-302 | odkrycia | cmentarz 84,16 (<=3) · szubienica 94,57 (<=2) |
| Zakon.js:287-303,359,755,1097 | cmentarz, szubienica, self B grobów [8,2831..,'B'], mgła | - |
| Zakon.js:1304 | F9 | cmentarz 8,84,16 · szubienica 8,94,58 |
| Zasoby_Data.js:63 | IDS[8] = 2235-2299 | - |
| Zasoby_Data.js:206-209 | FIELDS | pole_1 5,76 8x4 · pole_2 5,82 8x4 · pole_3 31,74 8x5 |
| Zasoby.js:410-422 | 52 zdarzenia upraw (2235-2286) + „Znacznik (Zasoby)” | - |
| Zasoby.js:1420 | F9 Pola mieszczan | 8,9,80 |
| Okolice_Data.js:85 | OLD[8] = [52,69] | - |
| Okolice_Data.js:88 | ENTRY[8] = [27,34] (musi być przechodnie) | 27,34 |
| Okolice_Data.js:143-145,189-190 | PLAN_SPOTS mapy 8 | pole_1-3, cmentarz, szubienica |
| Okolice.js:145-152 | kolizja: miejsce w starej części (x<52 i y<69) = błąd | - |

### A6. Orzeł, krawędzie, regiony
| Plik:linia | Co | Współrzędne |
|---|---|---|
| Orzel_Data.js:125-130 | LAND_REGION 31 (niepomalowany), TOWN_SQUARES[8] | ulica przed tawerną 0,18-51,21 · rynek 12,29-37,40 · plac płd. 4,47-34,51 |
| Orzel_Data.js:138 | SIDES[8] | S -> 22, E -> 24, W -> 111 |
| Orzel_Lot.js:367-370 | miasto = mapa 8 z <Farm:off>, lądowanie na placach | - |
| Krawedzie.js | wyjście z krawędzi wg przejść na brzegu | ev 1-3, 221-222, 237-238 |
| RegionLayers.js | 1 pod / 2 blokuje / 3 nad | Map008: do przemalowania |

### A7. Pozostałe
| Plik:linia | Co | Współrzędne |
|---|---|---|
| Underground_Data.js:697-699 | epilog „rynek” | kamera 24,37 · sołtys 26,36,4 · Hanka 21,33,6 · Kuba 24,36,8 · Ambroży 20,36,6 |
| Underground_Data.js:728-731 | epilog „oboz” | kamera 30,50 · Ludmiła 30,51 · Ela 31,52 · Marek 32,51 · Rafał 28,51 |
| Wrak.js:998-1004 | wellWatch porównuje Eryka DOKŁADNIE z danymi rozbitek_studnia (nie widzi „Miejsce:”) | 25,34 |
| Wrak_Data.js:154 | znak mapy „Wzgórze tawerny” | 8: 24,18 |
| Farming_Plots.js:551-555 | przydział studni <Studnia:2>, klucz w zapisie = „8:” + nazwa („Studnia miejska”) | ev 241/242 |
| CleanHUD_Compass.js:47 | przykład w dokumentacji (Staw 39,10) | tylko przykład |
| TawernaCore.js:311-345 | rejestr zakresów; przy kolizji wygrywa zdarzenie z edytora | - |
| Forestry.js:142 | posadzone sosny (1000-1999) w zapisie | - |
Bez wiązań: Story.js, Homes.js, Rywal, TavernShift*, TavernLife*, Debug.js, Lowy, Ludzie (miasto: 8 nieużywany), Cysterna, Latarnia, Pustelnia, Kruk, Minimap.
Notatki czytane przez kod: <Town:door=kantor> (Kantor.js), <Studnia:2> (Farming_Plots), <Occupy:...>, <Light...> (light_shadow_test: pierwszy <Light: bez LightWhen = kosz 226), <Rock>/<Stump>/<Tree>/<Log>.

## (B) Przeniesienia z innych map na mapę 8
| Mapa | Zdarzenie (pozycja) | Cel na mapie 8 |
|---|---|---|
| Map001 Tawerna | ev10/11/12 (49/50/51,54) | 23,17 / 24,17 / 25,17 kier. 2 |
| Map022 Polna droga | ev65/66/67 (11/12/13,0) | 24,136 / 25,136 / 26,136 kier. 8 |
| Map024 Posiadłość Lorda | ev65 (0,14) ev66 (0,15) ev67 (0,16) | 102,50 / 102,51 / 102,51 kier. 4 |
| Map102 Piekarnia | ev11 (8,11) | 6,39 |
| Map103 Kantor | ev7 (12,11) · ev13 tylne (3,11) | 14,39 · 10,40 |
| Map104 Ratusz | ev12 (7,12) · ev15 kancelaria (17,12) | 41,40 · 47,40 |
| Map105 Dom kowala | ev8 (7,10) | 12,47 |
| Map106 Dom garbarza | ev13 (8,10) | 37,50 |
| Map107 Dom woziwody | ev9 (7,9) | 29,47 |
| Map108 Dzwonnica | ev13 (5,12) | 48,31 |
| Map109 Dom mieszczan | ev14 (8,10) | 9,31 |
| Map110 Izba pod skałą | ev3 (6,9) | 12,30 |
| Map111 Podgrodzie | ev65 (91,17) · ev66 (91,18) | 1,50 · 1,51 kier. 6 |
| Map118 Dno studni | ev14 Lina (7,5) | 26,34 kier. 4 |
| Map119 Archiwum zakonu | ev2 Schody (2,3) | 6,13 kier. 2 |
Z wtyczek: TownQuests.js:2242 i Dwor_Data.js:54 -> 50,51; Kantor.js:1255 -> 10,40; Act3.js:1340 -> 24,19; F9: Kantor 12,41/8,37/10,41, Kasztelan 8,50, Dwór 24,33, Zakon 84,16/94,58, Zasoby 9,80; epilogi Underground 24,37 i 30,50.
CommonEvents: brak. System.json: start Map003 (11,19). MapInfos: dzieci mapy 8 = 24, 101, 102-111, 118, 119.

## (C) Testy i narzędzia
Testy z pozycjami mapy 8: knights_garden (6,17; ev39 furtka 5-7,16; region 3 na 5-7,14; ogród x2-10 y<=13; locate 6,12), east_gate (46,50; brama 50-51 x 50-51; kosze 49,49/49,53; wieże 50,49/50,53; wyjścia [[51,50],[51,51]] już nieaktualne), region_layers (19,18; fasada 19,15, arkada 20,9 region 2; ev22 24,16; 20,15), tavern_interior (24,17; ev22 -> Map001 50,53; Map001 10-12 -> 23..25,17), story (Map022 12,1 w górę; drzwi po nazwie x===24; 24,17), town_life (24,37; 910-917; 21,33/21,32), town_quests (8,50; 29,48 6,40 24,37 26,55 25,33 13,51 48,51 20,34; go 46,51 22,31), town_quests2 (26,36; ev245; 26,34; 30,33), quest_places (26,34; studnia 25,34; płyta 6,12; 6,13; 8,12), town_well (24,36; 2x Studnia miejska <Studnia:2>), town_interiors (tools/interiors/staging - brak; ALWAYS_OPEN 236), cysterna (24,36; ev241), podgrodzie (5,50; brama zach.; 4,51 2,50; powrót 1,51), podgrodzie_life (24,37; 22 rezydentów), orzel_test:546-549 (25,19 lądowanie; 29,25 zakaz), act3 (24,19 x4; 10,19), act2_quests (24,37), w1_chapters (24,37; ev245; 26,34; 8,50 36,40 23,36; 8,20), w2_archive (40,32; [8,39,'A']; 6,15 6,10 6,13; 20,37 10,40), w4_borgar (24,17; ev22.start), w4_key (8,50,4), w5 (12,41; 8,40 16,40 8,37 12,41 10,40 48,50 14,39 30,40; 22,40 13,40 7,40), w6 (31,49; 22,49 30,49 20,33 12,42; 33,49 26,49), w7 (24,36 47,51 22,33; 24,44), garnizon (24,38/31,50/10,42; 659 przy tylnych drzwiach kantoru), zakon (84,19; 2930 2800 2810 2820 2821; [8,2831,'B']; 94,59; near 82,13), zasoby (9,81), wrak (30,34), regulars (16,46 6,18 31,52; 5,17 6,17), regulars_quests (8,50; 22,33 12,41 20,36 24,53; 46,51 46,41), light_shadow (46,50 nocą; kosz 226), talk_busts (20,30), tree_see_through (24,18), waterfall (39,11), kruk/latarnia/motyle/pustelnia (30,30/26,30/30,40), ludzie/field_loss (8,50 38,42), okolice_szkielet/integracja (PLAN_SPOTS, ENTRY 27,34).
Narzędzia: newstart/layout.py (DOORS 24 -> 8,102,51,4; EDGES 22<->8 24-26,137; 8 103,50-51 <-> 24; 8 0,50-51 <-> 111), newstart/tavern_layout.py (GATE 24,16; EXITS; BASE_SHA256; KEPT_TRANSFERS nieaktualne), run_transfer_test.py, transfer_test.js, tavern/links.json (strona Map001), quest_places/places.py + patches.py (WELL_DOWN_AT 25,34 · WELL_OUT 26,34,4 · SLAB_AT 6,12 · SLAB_OUT 6,13,2; po nazwach), interiors/build_interiors.py (DOORS {88: 6,39 · 94: 10,40 · 95: 14,39 · 114: 41,40 · 4: 47,40 · 121: 9,31 · 124: 12,30 · 134: 12,47 · 137: 29,47 · 141: 37,50 · 236: 48,31}), interiors/install.py (BELL_DOOR 236), interiors/ilib.py (exit_to), podgrodzie/build_podgrodzie.py (wschodni brzeg Map111 = kopia zachodniego muru Map008), stare generatory tools/town/* (NIE uruchamiać po przebudowie), powieksz/stan.json + przerzedz.py + miejsca_okolic.json, pomiar_czasu, ekran_tytulowy/capture.js (24,19 kamera 24,13), act3/record.js, motyle/capture.js, orzel/lot_zrzut.js, town/shot_town.js.

## (D) Ważne zdarzenia Map008
| ID | Nazwa | x,y | Co robi |
|---|---|---|---|
| 1,2,3 | Przejście -> Polna droga | 24/25/26,137 | -> Map022 11/12/13,1 |
| 221,222 | Przejście -> Posiadłość Lorda | 103,50 · 103,51 | -> Map024 1,14/1,15 kier. 6 |
| 237,238 | Przejście -> Podgrodzie | 0,50 · 0,51 | -> Map111 90,17/90,18 kier. 4 |
| 22 | Drzwi tawerny -> Tawerna | 24,16 | Door1 -> Map001 50,53; po nazwie (Kasztelan, story_test); ID w testach |
| 4 | Drzwi: Ratusz (kancelaria) <Town:door=ratusz> | 47,39 | 8-18 -> Map104 17,11 |
| 114 | Drzwi: Ratusz | 41,39 | 8-18 -> Map104 7,11 |
| 88 | Drzwi: Piekarnia | 6,38 | 6-21 -> Map102 8,10 |
| 94 | Drzwi: Kantor (tylne) <Town:door=kantor> | 10,39 | 8-21 -> Map103 3,10 (Kantor.js szuka dokładnych współrzędnych) |
| 95 | Drzwi: Kantor (front) | 14,38 | 8-21 -> Map103 12,10 |
| 121 | Drzwi: Dom mieszczan | 9,30 | 6-21 -> Map109 8,9 |
| 124 | EV124 (drzwi) | 12,29 | -> Map110 6,8 |
| 134 | EV134 (drzwi kuźni) | 12,46 | -> Map105 7,9 |
| 137 | EV137 (drzwi woziwody) | 29,46 | -> Map107 7,8 |
| 141 | EV141 (drzwi garbarza) | 37,49 | -> Map106 8,9 |
| 236 | Drzwi: Dzwonnica | 48,30 | zawsze -> Map108 5,11 |
| 39 | Furtka ogrodu rycerzy <Occupy:left=1,right=1,up=1> | 6,16 | klucz (gardenKey) -> self A; po nazwie |
| 246 | Płyta w ścieżce (ogród rycerzy) | 6,12 | self A -> Map119 2,4 |
| 247 | Miejsce: plyta | 6,12 | znacznik |
| 241,242 | Studnia miejska <Studnia:2> | 24,35 · 25,35 | Farming.rationWell; klucz po nazwie |
| 245 | Studnia miejska: zejście | 25,34 | lina -> Map118 7,6 |
| 229 | Drogowskaz | 47,52 | tekst |
| 240 | Drogowskaz (brama zachodnia) | 2,49 | tekst |
| 243,244 | Brama zachodnia: dach i słupy / skrzydło i cień | 1,52 · 1,51 | !$West_Gate |
| 239 | Latarnia na baszcie <Light><LightWhen:night> | 1,49 | |
| 130 | Latarnia | 5,40 | |
| 225/226, 227/228 | Kosze żarowe (słup/ogień) <LightFlicker> | 49,49/49,48 · 49,53/49,52 | 49,49 = east_brazier (958) |
| 223,224 | Chorągiew Lorda Zaleskiego | 50,49 · 51,49 | east_gate_test liczy dwie |
| 181,189,190,192,193,196,198,200 | Mury miejskie (blokady <Occupy>) | różne | do przebudowy |
| 43,44 | posągi !Statue | 5,9 · 7,9 | 43 = posąg z czapką K33 (dokładnie 5,9); cokoły W3: !Statue z y = 9 |
| 45 | miecz w kamieniu !Weapon | 6,9 | fabuła W2 |
| 20,21 | posągi przed tawerną | 20,17 · 28,17 | dekoracja (y != 9!) |
| 142 | kowal !$Smith | 6,48 | animacja przy kowadle (kowadlo 7,49) |
| 173 | Kantor „Towary z kontynentu” | 16,37 | etykieta |
| 89,115 | Szyld: Piekarnia / Ratusz | 7,37 · 43,37 | |
| 297-303, 305-498 | zasoby ChoppableTree (skały, krzaki, pnie, jabłonie...) | nowy teren | self A/B w zapisach |
Wstrzykiwane (nie ma ich w pliku): 656-659 Garnizon, 733-734 Kantor, 859 Act3, 903-907 W6, 910-949 i 2900-2949 TownLife (948 Eryk, 2930 grabarz), 951-959 TownQuests, 1000-1999 Forestry, 2235-2299 Zasoby, 2800-2840 Zakon.

## Ryzyka (ciche awarie)
1. Dokładne współrzędne w kodzie: Kantor backDoorEv (10,39), TownQuests capStatueId (5,9) i cokoły (!Statue z y === 9 - posągi 20/21 przed tawerną NIE mogą trafić na y z posągami ogrodu w sposób łamiący to!), Wrak wellWatch (dane rozbitek_studnia), Kłos 659 obok tylnych drzwi.
2. Strefy na sztywno w TownQuests.js (ogród x2-10 y4-13, podglądanie, strzał w czapkę, wyrzucenie 50,51 - też Dwor_Data manor.out).
3. Act3_Data SPOTS[8] - wszystko od drzwi tawerny.
4. Pary: front drzwi (wyjścia z Map102-110) = miejsca TownLife *_drzwi/*_dom; Map001 ev10-12 = Act3 door = TownLife tawerna = Wrak rozbitek_noc; Map118 (26,34) / Map119 (6,13) = studnia / płyta.
5. Nazwy: „Drzwi tawerny”, „Furtka ogrodu rycerzy”, „Płyta w ścieżce”, „Studnia miejska”, „Posiadłość Lorda”, „Chorągiew Lorda”.
6. ID i zapisy: self A [8,39], [8,246], zasoby; Zakon [8,2831-2836,'B']; testy: 22, 39, 241, 245, 236; nowe zdarzenia < 500.
7. Krawędzie: rzędy bram 50-51 na x 0 i x 103, wyjście 24-26 na rzędzie 137.
8. Do zaktualizowania: Orzel TOWN_SQUARES[8] / region 31, Okolice ENTRY[8] i OLD[8], PLAN_SPOTS, Zasoby FIELDS, Zakon CEMETERY/GALLOWS, regiony 2/3, mury <Occupy>.
9. Już nieaktualne: miejsce staw (39,10), east_gate_test (wyjścia x 51), town_interiors_test (staging), KEPT_TRANSFERS.
