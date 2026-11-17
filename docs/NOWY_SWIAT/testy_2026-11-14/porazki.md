# Testy po przejściu na nowy świat (2026-11-14)

Pełny przebieg: 242 zestawy, 140 czystych. Po ustaleniu stałego startu testów (dom dziadka) z 102 zestawów z porażkami 6 wróciło do czystych.

| zestaw | wynik | pierwsza porażka |
|---|---|---|
| act2_quests_test | 6/7 ERR | ERR TypeError: Cannot read properties of null (reading 'eventId') |
| atmosphere_test | 33/34 FAIL | FAIL next to water by day: the river bed  {"name":"Sea","volume":45} |
| bron_dane_test | 37/38 FAIL | FAIL Tadek w miasteczku  {"town":true,"tadek":0} |
| bubbles_test | 9/11 FAIL | FAIL without a bust: the bubble is by his head (above it; with no room there beside him, the tail sideways - not over the hero below), on the screen  {"open":true,"who":n |
| cat_f9_test | 8/9 FAIL | FAIL ...it jumps up and sits on the sill  {"x":8,"y":5,"spot":"sill","pose":"sleep","cur":null,"steps":["uncurl","go","face","stay","hop","face","stay"],"purr":0,"moving" |
| clean_hud_test | 93/94 FAIL | FAIL kompas: krok zadania zna osobę - kowal w miasteczku (mapa 8)  {"map":220,"x":31,"y":36,"name":"Tadek Młot"} |
| combat_feel_test | 57/59 FAIL | FAIL B6 the boar's charge: white-gold (no guard, no parry holds it - a roll aside)  {"tells":[{"kind":"zbroja","heavy":true,"on":false,"k":0.5,"n":1}],"ghosts":0,"vis":0, |
| core_fixtures_test | 31/34 FAIL | FAIL ... (porządki) its plain keys moved into Tawerna.state: day 14 in _tw.clock, 'no weather today' (the save's F9 one, then the kit's) in _tw.survival.stormForce, the m |
| cysterna_test | 40/41 FAIL | FAIL gotowe Urwisko: kanał przelewu (33,2) prowadzi na Map157 (41,16)  [167,33,3] |
| dawcy_miasto_test | 23/41 FAIL | FAIL dawca praczka jest w tawernie o 18.75 (okno 17.5–20)  null |
| debug_menu_test | 82/84 FAIL | FAIL ...the clock (switch for full stats, +1 hour, +1 day, dawn, sunset, the season), +1000 G, +200 and +10 000 experience, the texts read again; then ten places and the  |
| east_gate_test | 2/6 FAIL | FAIL the gate's four cells are free, the fire baskets' pillars and the towers beside it are not  {"gate":[true,true,true,true],"pillars":[true,true],"towers":[true,true], |
| field_loss_test | 24/25 ERR | ERR TypeError: Cannot read properties of null (reading 'eventId') |
| fruit_tree_test | 11/13 FAIL | FAIL action button on a fruiting tree picks fruit (2-4 apples), not chop: no swing happened  {"before139":0,"after139":0,"st":{"page":0,"name":"!$Tree_Apple","C":false,"A |
| garnizon_test | 33/34 ERR | ERR TypeError: Cannot read properties of null (reading 'eventId') |
| goscie_sala_test | 36/39 FAIL | FAIL zdarzenia gości nie trzymają sprite'ów ani obiektów (poza _p8: zwykły zapas drogi każdego chodzącego, liczby)  {"_ogr":"object","_konie":"number","_zakFlat":"boolean |
| hammer_test | 8/9 FAIL | FAIL a site's menu offers 'Wytwórz...' before 'Zacznij budować'  ["Wytwórz...","Wykop ziemię","Zagrab ziemię","Postaw..."] |
| heart_test | 11/11 TIMEOUT | ERR timeout: the test ran longer than 420 s and was stopped |
| hero_look_test | 18/19 FAIL | FAIL walking right: row 6 (right), the legs go through all 8 frames  {"rowR":6,"cols":[0,1,2,3,4,5,6,7]} |
| hold_build_test | 1/3 FAIL | FAIL a workbench site (30 blows) |
| hold_gather_test | 12/13 FAIL | FAIL found standing pines (Sosna średnia, 16 blows) to chop  [{"id":1,"x":48,"y":38,"hits":13},{"id":10,"x":54,"y":32,"hits":13},{"id":28,"x":47,"y":40,"hits":13}] |
| home_ambience_test | 39/42 FAIL | FAIL out in the yard (Map020): no house layer, no grade  {"fx":true,"active":true,"home":true} |
| humans_test | 51/52 FAIL | FAIL three stabs in a row when each 'again' comes up (the club: two at most)  2 |
| hut_test | 49/50 FAIL | FAIL and a new one may be built again |
| keys_test | 52/56 FAIL | FAIL D walks right  {"p0":{"x":87,"y":6,"d":8},"p1":{"x":87.5,"y":6,"d":6}} |
| kleofas_kaplica_test | 4/5 ERR | ERR TypeError: Cannot read properties of null (reading 'eventId') |
| krawedzie_test | 5/8 FAIL | FAIL mur działki: przy murze (x 3), pod wzniesieniem (y 5), przy murze na dole (y 26) i z prawej (x 36) - nie wolno  {"corner":"To już nie działka dziadka.","rise":"To ju |
| kruk_test | 43/44 ERR | ERR TypeError: Cannot read properties of null (reading 'eventId') |
| laki_przejscia_test | 2/9 FAIL | FAIL Map003 80x60: droga (rodzaj 39) przez starą lukę (9..10, 29) aż do nowej południowej krawędzi (9..10, 59)  {"south":[0,0],"south2":[39,39],"size":[120,120],"west":[3 |
| latarnia_test | 12/18 FAIL | FAIL Latarnia.js i Latarnia_Data.js działają: Bazyli (943, mapa 125 - cypel Przystani, $Npc_Latarnik), K49, D22, W11 w zadaniach  {"api":true,"data":true,"res":[943,219," |
| life_test | 48/49 FAIL | FAIL the older batch rots after 60 h: 3 meat -> 3 rotten food, the fresh 2 stay  {"meat":2,"rot":4} |
| light_shadow_test | 9/12 FAIL | FAIL in grandpa's house at night, below the hearth, the hero throws a shadow away from it (down)  {"hole":true,"blocked":false,"hero":true,"n":1,"height":22} |
| lowy_test | 7/13 FAIL | FAIL gajowy: mieszkaniec 2905 na Map024, arkusz $Npc_Gajowy, popiersie Gajowy_Bust  {"ready":true,"it":[[200,"Bryła soli",480],[201,"Poroże jelenia",481],[202,"Kieł odyńc |
| ludzie_test | 16/19 FAIL | FAIL domy TownLife: postoje handlarza (3, 4), przylądek (159), garnizon (162)  [3,4,162] |
| majster_test | 20/45 FAIL | FAIL Tadek stoi w mieście (TownLife) |
| mapa_woz_test | 26/46 FAIL | FAIL Kruczy Jar za podwórzem to „?” (od 2026-10-30 dom dziadka dotyka pola), Leśna droga, miasteczko i Przystań ukryte  {"j":"hint","m":"hidden","p":"hidden"} |
| meble_ruch_test | 2/9 FAIL | FAIL od góry dochodzi do samej krawędzi stolika (stopy w pustym brzegu jego kafla)  {"rx":2,"ry":10.75,"x":2,"y":11} |
| miasto_mieszkancy_test | 10/24 FAIL | FAIL 8 mieszkańców w TownLife z numerami, kluczami i imionami z dokumentu, na mapie 8  {"bad":[{"id":2940,"key":"kolodziej","name":"Szczepan Kołodziej","home":"stajnia"}, |
| morze_test | 6/7 ERR | ERR ENOENT: no such file or directory, open 'C:\Users\macie\OneDrive\Dokumenty\RMMZ\Tawerna\tests\tools\potwory2\overlay\js\plugins\Morze.js' |
| morze_watek_test | 10/14 FAIL | FAIL dzień 10 rano na Przystani: martwy rybak i mokre ślady (bez ataku), wątek rusza na pewno  {"rybak":0,"start":10,"marks":["track","track","track","track","track","tra |
| most_zdjecia_test | 2/3 FAIL | FAIL most: deska (y 16-19) przechodnia, attyka (y 15, 20) nie  [[91,15,true],[91,16,false],[91,19,false],[91,20,false],[95,15,true],[95,16,false],[95,19,false],[95,20,tru |
| move_test | 17/19 FAIL | FAIL walks right smoothly (px/frame ~2.5: the walk is a little slower than the engine's 3 - FreeMovement walkSlowdown 0.25)  {"pxPerFrame":1.54,"frames":41,"x":85.3125} |
| ogrodki_test | 21/23 FAIL | FAIL kradzież policzona, bez świadków bez spadku zaufania |
| okolice_szkielet_test | 19/22 FAIL | FAIL przedmioty 185-249 są (puste rezerwy <Okolice:rezerwa> albo wypełnione przez paczkę), od 250 ubiór albo jego rezerwa, od 300 broń / zbroje / tarcze / dodatki  {"last |
| place_test | 13/22 FAIL | FAIL OK far from the spot: he first walks up to it (nothing built yet, nothing taken, he may walk)  {"walk":false,"built":false,"planks":12,"move":false} |
| poczta_test | 11/12 ERR | ERR TypeError: Cannot read properties of null (reading 'eventId') |
| poczta_wydajnosc_test | 4/5 FAIL | FAIL miasto przy kruczarni, w ruchu: klatka poniżej 15 ms przy 4x wolniejszym procesorze  {"upd":10.79,"rnd":6.51,"frame":17.31,"fps":39.2,"runs":[17.31,19.98,22.42]} |
| podgrodzie_life_test | 3/6 FAIL | FAIL the 8 residents of Podgrodzie (with the beggar Gaweł) are on Map111, each with its own sheet  {"praczka":null,"franek":null,"drwal":null,"klusownik":null,"znachorka" |
| podgrodzie_mieszkancy_test | 7/12 FAIL | FAIL 4 mieszkańców w TownLife z numerami, kluczami, imionami i arkuszami z dokumentu, na mapie 111  {"bad":[{"key":"opiekunka","home":"przytulek","sheet":"$Npc_Opiekunka" |
| podgrodzie_quests_test | 4/6 FAIL | FAIL 7 errands, one from each resident of Podgrodzie, none of them hands out water  {"n":7,"givers":["praczka","znachorka","szmaciarz","uchodzca","drwal","klusownik","fra |
| pokoje_mapy_test | 3/5 FAIL | FAIL działa na każdym wnętrzu budynku  [214,217] |
| pot_test | 5/6 ERR | ERR TypeError: Cannot read properties of null (reading 'entries') |
| przystan_test | 15/16 ERR | ERR TypeError: Cannot read properties of null (reading 'eventId') |
| przytulna_test | 14/15 FAIL | FAIL goście siedzą na stołkach (własne klatki, co najmniej 6 widocznych (the screen shows ~7 of the new hall))  {"sparks":18,"mugs":0,"glow":2,"wipe":true,"seated":1,"dri |
| puddles_test | 22/23 FAIL | FAIL ...every tile of them bare natural ground: passable, no event, object or berry bush  [["3:5,4",22,17],["3:5,4",21,18],["3:5,4",22,18],["3:5,4",23,18],["3:5,4",22,19] |
| pustelnia_test | 26/27 ERR | ERR TypeError: Cannot read properties of null (reading 'eventId') |
| quest_board_test | 27/30 FAIL | FAIL the wanted wolf comes on its map at night: named, stronger, bigger, with a companion, and a notice says so  null |
| quest_places_test | 17/22 FAIL | FAIL the rope: OK -> 'Wspiąć się po linie na górę?' -> back in town beside the well (26,34)  {"q2":["Wspiąć się","Zostać"],"top":{"map":8,"x":52,"y":50}} |
| rabbit_hop_test | 6/7 FAIL | FAIL found a log, a bush, a stump, a berry bush and a standing tree with room before and behind  ["log","bush","berry","tree"] |
| red_water_test | 12/13 ERR | ERR TypeError: Cannot read properties of null (reading 'eventId') |
| regulars_quests_test | 5/6 ERR | ERR TypeError: Cannot read properties of null (reading 'eventId') |
| regulars_test | 14/15 ERR | ERR TypeError: Cannot read properties of null (reading 'eventId') |
| rozmowy_test | 16/17 FAIL | FAIL drabina przejęć mieszkańców: Latarnia > Motyle > Zakon > Ludzie > Lowy > Zasoby > Kantor/Ludmiła > Wrak > Garnizon > Kruk > Pustelnia > Przystan > Homes > zadania >  |
| site_test | 2/7 FAIL | FAIL placing the site does not crouch or swing anything  {"swinging":false,"mode":true,"can":false} |
| stage1_test | 8/10 FAIL | FAIL B0 room for a kiln on the home field  null |
| station_ready_test | 0/2 FAIL | FAIL a compost bin by the player  null |
| storm_test | 29/30 FAIL | FAIL the trees bend much further in the storm (at least 2.5 x)  {"calmBend":1.3246753246753247,"stormBend":2.445887445887446} |
| story_test | 44/48 FAIL | FAIL the intro (since the prologue, 2026-10-12: the fisherman, the mother's letter, then the debt): grandpa and the hero talk in bubbles (grandpa over 901, the hero over  |
| survival_test | 5/5 ERR | ERR TypeError: Cannot read properties of null (reading 'height') |
| swiat_etap1_test | 8/16 FAIL | FAIL Swiat_Data włączone, Map008 104 x 138  {"on":true,"size":[120,120]} |
| swiat_etap2_test | 6/12 FAIL | FAIL Swiat_Data etapu 2: mapy 20 (80x64) i 900  {"on":true,"m20":[240,240,120,120]} |
| swiat_etap2b_test | 5/14 FAIL | FAIL Swiat_Data partii 2: 168 (130x108) i 912  {"on":true} |
| swiat_etap3_test | 2/5 FAIL | FAIL 111 W -> 162 w tej samej kratce swiata (148 ~ 268)  {"start":{"map":111,"x":5,"y":148},"p":{"map":111,"x":5,"y":148}} |
| swiat_przejscia_test | 3/87 FAIL | FAIL mapa 17: przejscie #61 (39,0) -> 23 (39,58) zgodne ze swiatem  {"why":"nie na krawedzi","name":"Przejście -> Skraj lasu","side":"N"} |
| swiat_styki_test | 4/8 FAIL | FAIL nowe mapy 960-964 w świecie  [3,4,8,13,20,24,111,125,162,218,219,220,221,222] |
| sygnaly_test | 51/67 FAIL | FAIL Mlyn.js i Mlyn_Data.js działają: wątek, zadanie W19 (5 kroków), numery 2970-2999, dwaj mieszkańcy w zakresie 2960-2969  {"m":true,"d":true,"q":true,"thr":true,"inj": |
| sylwetki_test | 3/4 ERR | ERR ReferenceError: Sun is not defined |
| talk_busts_test | 32/37 FAIL | FAIL ...a yellow marker over Borgar's head on the map (above his balloon if he has one); the XP bar hidden  {"marker":null,"head":{"x":-951,"top":170,"foot":234},"balloon |
| tavern_plan_test | 38/46 FAIL | FAIL Map001: its cells [[9,49],[10,49]] are free floor (no other event), in front of it reachable from the landing, a wall behind it  {"n":1,"id":349,"at":[9,49],"cells": |
| town_life_test | 2/4 FAIL | FAIL every resident of the town (30 and the threads' own) at 10:00, each with its own sheet  {"ludmila":[31,58,"hidden","$Npc_Ludmila"],"ela":[33,57,"hidden","$Npc_Ela"], |
| town_quests2_test | 3/5 FAIL | FAIL market day 7, 10:12: Szymek, Lucjan Kość (at his dice by the right stall) and Bartek Kmieć are in the town, each with his own sheet; the carter is out on his round ( |
| town_quests_test | 6/7 ERR | ERR TypeError: Cannot read properties of null (reading 'eventId') |
| tree_see_through_test | 4/5 FAIL | FAIL behind a decorative tree in the town (!$Tree_Small) it fades too, in front it is whole  {"deco":{"id":5,"x":75,"y":38,"pic":"!$Tree_Small"},"dBehind":1,"dFront":1} |
| tree_shadow_test | 12/13 FAIL | FAIL it comes straight out of the foot of the trunk (starts a few px inside it, where the tree hides its soft start), at any hour  [[-0.1,-2.4],[-0.1,-2.4],[-0.1,-2.4]] |
| w1_chapters_test | 3/4 ERR | ERR TypeError: Cannot read properties of null (reading 'eventId') |
| w2_archive_test | 3/4 ERR | ERR TypeError: Cannot read properties of null (reading 'eventId') |
| w4_borgar_test | 6/7 ERR | ERR TypeError: Cannot read properties of null (reading 'eventId') |
| w4_key_test | 8/11 FAIL | FAIL before W4: the cellar's grate is shut, its own words ('Krata ani drgnie')  "" |
| w5_test | 16/18 FAIL | FAIL rozdz. 3: Baltazar (zaufanie - skrzynia K15 nieotwarta) najmuje bohatera do nocnej roboty: 20 G za noc, tylne drzwi od 22  {"step":"w5Najem","text":"","missing":["ni |
| w6_test | 15/17 FAIL | FAIL ch3: at 21:00 Rafał stands by the camp's fire (TownLife 'w6Fire': w6_ognisko 60,90); the fire is a prop (905, a flame)  {"rs":{"x":91,"y":98,"hidden":false,"act":"st |
| w7_test | 14/16 FAIL | FAIL plan dnia Feliksa: rynek od 6:00, hol dworu 10:30-20 (miejsce feliks_hol), noc w dworze; Teodor tak samo (kamerdyner_hol)  {"n":[106,107,143,145,169,170,191],"maps": |
| wrak_test | 8/9 ERR | ERR TypeError: Cannot read properties of null (reading 'eventId') |
| wydajnosc_test | 9/16 FAIL | FAIL ...and the picture is the same with every speed-up off and on (a frozen frame: no more bytes differ than between two drawings, at most 0.01%)  {"keys":"leaf,filterAr |
| wyspa_szkielet_test | 16/17 FAIL | FAIL pakiety same zgłaszają gotowe miejsca (Wyspa.ready 155, 157, 159, 162, 165, 167); Wyspa.EDGES puste, na przystani nie ma przejść 690-699  {"ready":[162,165,167,219], |
| zakon_test | 31/33 FAIL | FAIL grabarz: mieszkaniec 2930 na Map008, arkusz $Npc_Grabarz, popiersie Grabarz_Bust  {"ready":true,"it":[[225,"Klucz Strażnika",512],[226,"Pióro Skrzydlatej Straży",513 |
| zwierzeta_ludzie_test | 33/36 FAIL | FAIL a pack 10+ tiles off goes to the meat and eats it (the bundle gets smaller)  {"goal":true,"eat":false,"less":false,"engaged":false} |
