//=============================================================================
// TavernLife_Plan.js
//=============================================================================
// The tavern's plan: the easels in the vestibule and at the stairs (event 950, put into the maps' data by the core: Tawerna.inject)
// and the plan scene - three floors on parchment, "Tu jesteś", the services lit while open, the cursor over the rooms with what is
// there, who and when and for how much, the way there. Also "Plan karczmy" in the P menu inside the tavern. It reads the services'
// state through TavernLife.lib; its key hints and parchment fonts are the UI kit's (TawernaUI.js).

/*:
 * @target MZ
 * @plugindesc Plan karczmy (część TavernLife.js): sztalugi z planem w sieni i przy schodach, scena planu trzech pięter z usługami, „Tu jesteś” i drogą. v1.0.0
 * @author Claude
 * @base TavernLife
 * @orderAfter TavernLife
 * @orderAfter MenuPanel
 *
 * @help
 * ============================================================================
 * TavernLife_Plan.js - plan karczmy
 * ============================================================================
 * Część TavernLife.js. Sztaluga z planem w sieni (mapa 1) i mniejsze przy
 * schodach pięter (mapy 25 i 26) - wtyczka sama je stawia (zdarzenie 950,
 * znacznik <Tavern:plan>; plan postawiony w edytorze z tym znacznikiem
 * zostaje zamiast sztalugi). O przed planem (albo „Plan karczmy” w menu P,
 * gdy bohater jest w karczmie): trzy piętra na pergaminie, „Tu jesteś”,
 * usługi jasne, gdy czynne, i przygaszone, gdy zamknięte; strzałki - pokój
 * i opis (co tu jest, kto i kiedy, ceny), Q/E - piętro, O - droga,
 * P - wyjście.
 * Obrazy: img/pictures/TavernPlan_*.png, img/characters/!$Tavern_Plan*.png
 * (tools/tavern/plan/make_plan.py i make_board.py).
 *
 * KOLEJNOŚĆ: pod TavernLife.js.
 * Dla testów: TavernLife.plan = { open({ floor }), state(), info(floor, key),
 * icons(floor), items(floor), way(...), select(key), floor(i), ... }.
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna;
    if (!T) throw new Error("TavernLife_Plan.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const TL = T.api("TavernLife");
    if (!TL || !TL.lib) throw new Error("TavernLife_Plan.js: brak TavernLife.js - musi być nad tą wtyczką na liście (TavernLife is missing)");
    const lib = TL.lib, ui = T.ui;
    const { num, clamp, ease, se, dirty, U, C, S, day, hour, hasClock, hoursText, pct, tagOf, QB, reputation, repTier, repTierOf, tierName, repDiscount,
        rooms, roomOf, roomPrice, rentedRoom, isRented, canRent, giftName, RESTED, DISHES, dishOfDay, priceOf, inSongHours, bathPrice } = lib;
    const { DAY_DISCOUNT, CHECKOUT, BATH_PRICE, CLEAN_COST, CLEAN_HOURS, SONG_FROM, SONG_TIP, INSPIRED_XP, INSPIRED_HOURS, ARM_STAKES, DARTS_STAKES } = lib.config;

    // ==================================================================
    // PLAN KARCZMY: an easel with the framed plan in the vestibule (Map001) and smaller ones at the stairs of Map025 and Map026
    // (events put into the maps' data as they load, as Story.js puts its people); O before one opens the plan of the three
    // floors: parchment sheets drawn from the real maps (tools/tavern/plan/make_plan.py, which also writes PLAN_DATA below),
    // the services on them lit while they are open, "Tu jesteś", a cursor over the rooms with what is there, who and when and
    // for how much; O draws the way there. The cellar and the old stones' secret stay off the plan.
    // ==================================================================
    // <plan-data> (tools/tavern/plan/make_plan.py writes this line - do not edit by hand)
    const PLAN_DATA = {"sheet":[16,46,836,636],"panel":[866,46,398,636],"floors":[{"map":1,"name":"Parter","title":"Parter","pic":"TavernPlan_0","w":101,"h":84,"s":6.2645,"ox":101.64,"oy":80.0,"rooms":[{"k":"komorka","n":"Komórka","t":"service","g":"komorka","r":[[1,1,10,18]],"e":[[1,19,11,19],[1,1,11,1],[11,1,11,19],[1,1,1,19]],"c":[6.0,10.0],"l":[6.0,9.88]},{"k":"sklad","n":"Skład","t":"service","g":"sklad","r":[[12,1,25,18]],"e":[[12,19,26,19],[12,1,26,1],[12,1,12,19],[26,1,26,19]],"c":[19.0,10.0],"l":[19.01,9.88]},{"k":"browar","n":"Browar","t":"service","g":"browar","r":[[27,1,44,18]],"e":[[27,1,45,1],[27,19,45,19],[27,1,27,19],[45,1,45,19]],"c":[36.0,10.0],"l":[36.01,9.88]},{"k":"sluzba","n":"Pokój służby","t":"private","g":"sluzba","r":[[46,1,55,18]],"e":[[46,19,56,19],[46,1,56,1],[56,1,56,19],[46,1,46,19]],"c":[51.0,10.0],"l":[50.99,10.09]},{"k":"gabinet","n":"Gabinet Borgara","t":"private","g":"gabinet","r":[[57,1,68,18]],"e":[[57,1,69,1],[57,19,69,19],[57,1,57,19],[69,1,69,19]],"c":[63.0,10.0],"l":[63.0,10.09]},{"k":"magazyn","n":"Magazyn","t":"service","g":"magazyn","r":[[70,1,84,18]],"e":[[70,19,85,19],[70,1,85,1],[70,1,70,19],[85,1,85,19]],"c":[77.5,10.0],"l":[77.49,9.88]},{"k":"wedzarnia","n":"Wędzarnia","t":"service","g":"wedzarnia","r":[[86,1,99,18]],"e":[[86,1,100,1],[86,19,100,19],[100,1,100,19],[86,1,86,19]],"c":[93.0,10.0],"l":[92.99,9.88]},{"k":"korytarz","n":"Korytarz","t":"hall","g":"korytarz","r":[[1,20,99,25]],"e":[[1,20,100,20],[1,26,100,26],[1,20,1,26],[100,20,100,26]],"c":[50.5,23.0],"l":[50.01,23.99]},{"k":"spizarnia","n":"Spiżarnia","t":"service","g":"spizarnia","r":[[38,27,62,37]],"e":[[38,38,63,38],[38,27,63,27],[63,27,63,38],[38,27,38,38]],"c":[50.5,32.5],"l":[50.5,32.63]},{"k":"kuchnia","n":"Kuchnia","t":"service","g":"kuchnia","r":[[38,39,49,57]],"e":[[38,39,50,39],[38,58,50,58],[38,39,38,58],[50,39,50,58]],"c":[44.0,48.5],"l":[44.0,50.62]},{"k":"piekarnia","n":"Piekarnia","t":"service","g":"piekarnia","r":[[51,39,62,57]],"e":[[51,58,63,58],[51,39,63,39],[63,39,63,58],[51,39,51,58]],"c":[57.0,48.5],"l":[57.0,50.62]},{"k":"mysliwski","n":"Pokój myśliwski","t":"guest","g":"mysliwski","r":[[1,27,15,48]],"e":[[1,49,16,49],[1,27,16,27],[16,27,16,49],[1,27,1,49]],"c":[8.5,38.0],"l":[8.5,41.84]},{"k":"biesiadna","n":"Sala biesiadna","t":"guest","g":"biesiadna","r":[[17,27,36,48]],"e":[[17,49,37,49],[17,27,37,27],[37,27,37,49],[17,27,17,49]],"c":[27.0,38.0],"l":[27.0,41.84]},{"k":"scena","n":"Sala ze sceną","t":"guest","g":"scena","r":[[64,27,83,48]],"e":[[64,27,84,27],[64,49,84,49],[64,27,64,49],[84,27,84,49]],"c":[74.0,38.0],"l":[74.0,41.84]},{"k":"gry","n":"Pokój gier","t":"guest","g":"gry","r":[[85,27,99,48]],"e":[[85,49,100,49],[85,27,100,27],[85,27,85,49],[100,27,100,49]],"c":[92.5,38.0],"l":[92.5,41.84]},{"k":"laznia","n":"Łaźnia","t":"guest","g":"laznia","r":[[1,50,15,69]],"e":[[1,70,16,70],[1,50,16,50],[1,50,1,70],[16,50,16,70]],"c":[8.5,60.0],"l":[8.5,55.63]},{"k":"rzutki","n":"Sala rzutek","t":"guest","g":"rzutki","r":[[85,50,99,69]],"e":[[85,50,100,50],[85,70,100,70],[85,50,85,70],[100,50,100,70]],"c":[92.5,60.0],"l":[92.5,61.59]},{"k":"sala","n":"Wielka sala","t":"guest","g":"sala","r":[[17,50,36,69],[64,50,83,69],[37,59,63,69],[38,70,62,73]],"e":[[38,74,63,74],[17,50,37,50],[64,50,84,50],[37,59,64,59],[17,70,38,70],[63,70,84,70],[37,50,37,59],[17,50,17,70],[63,70,63,74],[38,70,38,74],[84,50,84,70],[64,50,64,59]],"c":[50.5,62.0],"l":[50.01,71.9]},{"k":"jadalnia","n":"Jadalnia prywatna","t":"guest","g":"jadalnia","r":[[19,71,35,82]],"e":[[19,71,36,71],[19,83,36,83],[19,71,19,83],[36,71,36,83]],"c":[27.5,77.0],"l":[27.5,74.83]},{"k":"palarnia","n":"Palarnia i czytelnia","t":"guest","g":"palarnia","r":[[65,71,81,82]],"e":[[65,83,82,83],[65,71,82,71],[82,71,82,83],[65,71,65,83]],"c":[73.5,77.0],"l":[73.5,74.83]},{"k":"sien","n":"Sień","t":"hall","g":"sien","r":[[41,75,59,82],[37,82,40,82],[60,82,63,82]],"e":[[41,75,60,75],[37,83,64,83],[37,82,41,82],[60,82,64,82],[60,75,60,82],[37,82,37,83],[41,75,41,82],[64,82,64,83]],"c":[50.5,79.0],"l":[50.01,80.5]},{"k":"schody_zach","n":"Schody na piętro (zachodnie)","t":"stairs","g":"schody_zach","r":[[37,76,39,81]],"e":[[37,82,40,82],[37,76,40,76],[40,76,40,82],[37,76,37,82]],"c":[38.5,79.0],"l":[38.5,79.0],"to":25,"up":true},{"k":"schody_wsch","n":"Schody na piętro (wschodnie)","t":"stairs","g":"schody_wsch","r":[[61,76,63,81]],"e":[[61,82,64,82],[61,76,64,76],[61,76,61,82],[64,76,64,82]],"c":[62.5,79.0],"l":[62.5,79.0],"to":25,"up":true}],"icons":[["bar",48,64,"sala",null],["kitchen",40,42.5,"kuchnia",null],["board",43,77.4,"sien",null],["dice",87,33.4,"gry",null],["dice",97,33.4,"gry",null],["arm",92,36.0,"gry",null],["darts",92.0,55.8,"rzutki",null],["bath",8.0,60.5,"laznia",null],["stage",73.5,31.5,"scena",null],["fire",57,77.7,"sien",null],["fire",26,51.7,"sala",null],["fire",73,51.7,"sala",null],["fire",8,29.7,"mysliwski",null],["fire",62,3.7,"gabinet",null],["stairs",38.0,76.75,"schody_zach",{"to":25,"up":true}],["stairs",62.0,76.75,"schody_wsch",{"to":25,"up":true}]],"walk":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAPwEA+B/gATsEAOWf/O//58cffvy//7//n//9/xyI45//9//n//G//5//f/73//7//D/69r/z/8//vt//nv/H/wJA/v/53+MLAPL/cM7/z/8/z3t8/3/+H8/7/4kx5nD97f/P/+P//z////jn//3/+X/8/3/3/7///b//vZ+f/wUA/v/3v+8XAPT/U7b/X8Tw/ud4/v/8P873//v/38z+3//fg89//n/3v5NJ//q/SzDhR/4I/gP/+3/BQ/8/AAAGAAwABmAAMAAYAADAAIABwAAMAAYAAwAAGAAwABiAAcAAYAAAAAMABgADMAAYAAzw/2//3/7///Z/+/9//v//////////////z////////////////wGAATAAADgAAAAAAwAAMAAGAAAHAAAAYAAAAAbAAADgAAAAAAwAAMAAGAAAHAAAAIABgLc9f/sDgAPA///7//P/9////v//u7V2/3/+//7/3///f//97//PV9////v//+9//82f+f8bAGD///8NGLDwIf99AwDsyD+y//+3/+b/bwCA3f/39////v7w/w0AMHgefv7/3w+fV/3//wcGAMbdu///84D////AAMAYMeL/fx7w//8fGAAY/////8+r3gAAAwMA4///zZ/5/xsAYPPsY/z/v/Ah/38DAMz/+J///7f/5v9vAID5P/9z9+7+/uQ//f8//+d/RozY/5//v///503+3///+//z/+f/f7zJwPP/P4Yh+r/+/9/2G3j//+//DwCAB+D5/v/PA/AYAAAA8AA83///eQAeAwAAAB6A5xv/Pw/AYwAAAMAD8Oi//uABeAwAfPD9vb//d/j+3t//n/+////3/w7f///z//H399f+jkf/+Vt//3/+//7/3+D7H///7/+P+Mj///tn/+////3/+f/7/38DABz8/7//P/9/439sAICD8T/2/+f/fzyPDQBwMJ7H///kP4/DsQEADsbh+N6b///xPz4AP/74H48x8v83/sf/78cf/2P/f/7/xv/4//z/43/s/4/4yHge/7//fzyPve/5/xuH4wDw3Y/DseM4/3///x8AHvH///f/5//v//9X9f////+QE8if/P/////////f/x8AAAAH8P//H8ABAAAAAADgAP7//wM4AAAAAAAAHMD//38ABwAAAAAAgAP4//8P4AAAAAAAIP8nAHwAgN0AAAAAAPz/B4APAP//AQAAAID//w7wAe7/PwAAAABwVd0BPsD9/wcAAAAABgA7+D+4e+8AAAAAQABA9/9/N/4YAAAAALiq7v7/7/7/AwAAAAD//93//93zeQAAAADg/78f/vBjNgMAAAAAAAAAAAcAAAAAAAA=","exits":{"8":[[49,83],[50,83],[51,83]],"25":[[37,76],[38,76],[39,76],[61,76],[62,76],[63,76]]},"arrive":{"25":[61,82]}},{"map":25,"name":"Pokoje gości","title":"Piętro I · Pokoje gości","pic":"TavernPlan_1","w":97,"h":71,"s":7.7143,"ox":43.86,"oy":80.0,"rooms":[{"k":"nc","n":"Korytarz północny","t":"hall","g":"nc","r":[[1,14,89,20],[95,14,95,20],[90,17,94,20]],"e":[[1,14,90,14],[95,14,96,14],[1,21,96,21],[90,17,95,17],[90,14,90,17],[1,14,1,21],[96,14,96,21],[95,14,95,17]],"c":[48.5,17.5],"l":[22.0,18.9]},{"k":"sc","n":"Korytarz południowy","t":"hall","g":"sc","r":[[1,46,42,52],[54,46,95,52],[43,49,53,52]],"e":[[1,46,43,46],[54,46,96,46],[1,53,96,53],[43,49,54,49],[54,46,54,49],[1,46,1,53],[96,46,96,53],[43,46,43,49]],"c":[48.5,49.5],"l":[22.0,50.91]},{"k":"gal","n":"Galeria","t":"hall","g":"gal","r":[[43,21,53,28],[43,29,45,48],[51,29,53,48],[46,39,50,48]],"e":[[43,21,54,21],[43,49,54,49],[46,29,51,29],[46,39,51,39],[54,21,54,49],[46,29,46,39],[43,21,43,49],[51,29,51,39]],"c":[48.5,35.0],"l":[47.99,23.61]},{"k":"hall","n":"Hall schodowy","t":"hall","g":"hall","r":[[40,54,56,62]],"e":[[40,63,57,63],[40,54,57,54],[40,54,40,63],[57,54,57,63]],"c":[48.5,58.5],"l":[47.99,58.61]},{"k":"r23","n":"Pokój 23","t":"private","g":"r23","r":[[1,3,7,12]],"e":[[1,13,8,13],[1,3,8,3],[1,3,1,13],[8,3,8,13]],"c":[4.5,8.0],"l":[4.5,9.4],"sub":"1-os."},{"k":"r22","n":"Pokój 22","t":"private","g":"r22","r":[[9,1,17,12]],"e":[[9,1,18,1],[9,13,18,13],[9,1,9,13],[18,1,18,13]],"c":[13.5,7.0],"l":[13.5,8.69],"sub":"2-os."},{"k":"r21","n":"Pokój 21","t":"private","g":"r21","r":[[19,3,25,12]],"e":[[19,3,26,3],[19,13,26,13],[19,3,19,13],[26,3,26,13]],"c":[22.5,8.0],"l":[22.5,9.4],"sub":"1-os."},{"k":"r20","n":"Pokój 20","t":"private","g":"r20","r":[[27,1,37,12]],"e":[[27,1,38,1],[27,13,38,13],[27,1,27,13],[38,1,38,13]],"c":[32.5,7.0],"l":[32.5,8.69],"sub":"rodzinny"},{"k":"lounge","n":"Salonik gości","t":"guest","g":"lounge","r":[[39,1,57,12]],"e":[[39,1,58,1],[39,13,58,13],[58,1,58,13],[39,1,39,13]],"c":[48.5,7.0],"l":[48.5,8.74]},{"k":"chamber","n":"Komnata z kominkiem","t":"guest","g":"chamber","r":[[59,1,76,12]],"e":[[59,1,77,1],[59,13,77,13],[59,1,59,13],[77,1,77,13]],"c":[68.0,7.0],"l":[68.0,7.69]},{"k":"r24","n":"Pokój 24","t":"private","g":"r24","r":[[78,1,87,12]],"e":[[78,1,88,1],[78,13,88,13],[88,1,88,13],[78,1,78,13]],"c":[83.0,7.0],"l":[82.99,8.69],"sub":"2-os."},{"k":"bath","n":"Łazienka","t":"guest","g":"bath","r":[[1,22,17,32]],"e":[[1,22,18,22],[1,33,18,33],[1,22,1,33],[18,22,18,33]],"c":[9.5,27.5],"l":[9.49,27.44]},{"k":"linen","n":"Bieliźniarka","t":"service","g":"linen","r":[[19,22,25,32]],"e":[[19,33,26,33],[19,22,26,22],[26,22,26,33],[19,22,19,33]],"c":[22.5,27.5],"l":[22.5,28.57]},{"k":"maid","n":"Pokój pokojówki","t":"private","g":"maid","r":[[27,22,33,32]],"e":[[27,33,34,33],[27,22,34,22],[34,22,34,33],[27,22,27,33]],"c":[30.5,27.5],"l":[30.49,28.57]},{"k":"r15","n":"Pokój 15","t":"private","g":"r15","r":[[35,22,41,32]],"e":[[35,33,42,33],[35,22,42,22],[42,22,42,33],[35,22,35,33]],"c":[38.5,27.5],"l":[38.51,29.04],"sub":"1-os."},{"k":"r16","n":"Pokój 16","t":"private","g":"r16","r":[[55,22,61,32]],"e":[[55,22,62,22],[55,33,62,33],[62,22,62,33],[55,22,55,33]],"c":[58.5,27.5],"l":[58.49,29.04],"sub":"1-os."},{"k":"r17","n":"Pokój 17","t":"private","g":"r17","r":[[63,22,71,32]],"e":[[63,33,72,33],[63,22,72,22],[72,22,72,33],[63,22,63,33]],"c":[67.5,27.5],"l":[67.5,29.04],"sub":"2-os."},{"k":"r18","n":"Pokój 18","t":"private","g":"r18","r":[[73,22,83,32]],"e":[[73,33,84,33],[73,22,84,22],[73,22,73,33],[84,22,84,33]],"c":[78.5,27.5],"l":[78.5,29.04],"sub":"rodzinny"},{"k":"r19","n":"Pokój 19","t":"private","g":"r19","r":[[85,22,95,32]],"e":[[85,22,96,22],[85,33,96,33],[96,22,96,33],[85,22,85,33]],"c":[90.5,27.5],"l":[90.5,29.04],"sub":"rodzinny"},{"k":"r7","n":"Pokój 7","t":"private","g":"r7","r":[[1,34,9,44]],"e":[[1,34,10,34],[1,45,10,45],[10,34,10,45],[1,34,1,45]],"c":[5.5,39.5],"l":[5.5,41.04],"sub":"1-os."},{"k":"r5","n":"Pokój 5","t":"private","g":"r5","r":[[11,34,20,44]],"e":[[11,45,21,45],[11,34,21,34],[11,34,11,45],[21,34,21,45]],"c":[16.0,39.5],"l":[16.0,41.04],"sub":"2-os."},{"k":"r3","n":"Pokój 3","t":"guest","g":"r3","r":[[22,34,33,44]],"e":[[22,34,34,34],[22,45,34,45],[34,34,34,45],[22,34,22,45]],"c":[28.0,39.5],"l":[28.01,41.04],"sub":"rodzinny"},{"k":"r1","n":"Pokój 1","t":"guest","g":"r1","r":[[35,34,41,44]],"e":[[35,45,42,45],[35,34,42,34],[42,34,42,45],[35,34,35,45]],"c":[38.5,39.5],"l":[38.51,41.04],"sub":"1-os."},{"k":"r2","n":"Pokój 2","t":"guest","g":"r2","r":[[55,34,61,44]],"e":[[55,34,62,34],[55,45,62,45],[62,34,62,45],[55,34,55,45]],"c":[58.5,39.5],"l":[58.49,41.04],"sub":"2-os."},{"k":"r4","n":"Pokój 4","t":"private","g":"r4","r":[[63,34,74,44]],"e":[[63,34,75,34],[63,45,75,45],[75,34,75,45],[63,34,63,45]],"c":[69.0,39.5],"l":[68.99,41.04],"sub":"rodzinny"},{"k":"r6","n":"Pokój 6","t":"private","g":"r6","r":[[76,34,85,44]],"e":[[76,45,86,45],[76,34,86,34],[86,34,86,45],[76,34,76,45]],"c":[81.0,39.5],"l":[81.0,41.04],"sub":"2-os."},{"k":"r8","n":"Pokój 8","t":"private","g":"r8","r":[[87,34,95,44]],"e":[[87,45,96,45],[87,34,96,34],[96,34,96,45],[87,34,87,45]],"c":[91.5,39.5],"l":[91.5,41.04],"sub":"1-os."},{"k":"r13","n":"Pokój 13","t":"private","g":"r13","r":[[1,54,12,67]],"e":[[1,54,13,54],[1,68,13,68],[1,54,1,68],[13,54,13,68]],"c":[7.0,61.0],"l":[7.01,62.96],"sub":"rodzinny"},{"k":"r11","n":"Pokój 11","t":"private","g":"r11","r":[[14,54,25,65]],"e":[[14,66,26,66],[14,54,26,54],[14,54,14,66],[26,54,26,66]],"c":[20.0,60.0],"l":[19.99,61.68],"sub":"rodzinny"},{"k":"r9","n":"Pokój 9","t":"private","g":"r9","r":[[27,54,38,65]],"e":[[27,66,39,66],[27,54,39,54],[27,54,27,66],[39,54,39,66]],"c":[33.0,60.0],"l":[33.0,61.68],"sub":"2-os."},{"k":"r10","n":"Pokój 10","t":"private","g":"r10","r":[[58,54,69,65]],"e":[[58,66,70,66],[58,54,70,54],[58,54,58,66],[70,54,70,66]],"c":[64.0,60.0],"l":[64.0,61.68],"sub":"2-os."},{"k":"r12","n":"Pokój 12","t":"private","g":"r12","r":[[71,54,82,65]],"e":[[71,66,83,66],[71,54,83,54],[71,54,71,66],[83,54,83,66]],"c":[77.0,60.0],"l":[77.01,61.68],"sub":"2-os."},{"k":"r14","n":"Pokój 14","t":"private","g":"r14","r":[[84,54,95,67]],"e":[[84,54,96,54],[84,68,96,68],[84,54,84,68],[96,54,96,68]],"c":[90.0,61.0],"l":[89.99,62.96],"sub":"rodzinny"},{"k":"schody_dol","n":"Schody w dół","t":"stairs","g":"schody_dol","r":[[46,63,50,68]],"e":[[46,69,51,69],[46,63,51,63],[46,63,46,69],[51,63,51,69]],"c":[48.5,66.0],"l":[48.5,66.0],"to":1,"up":false},{"k":"schody_gora","n":"Schody na górę","t":"stairs","g":"schody_gora","r":[[90,5,94,16]],"e":[[90,17,95,17],[90,5,95,5],[95,5,95,17],[90,5,90,17]],"c":[92.5,11.0],"l":[92.5,11.0],"to":26,"up":true}],"icons":[["room",27,37,"r3",{"room":"3","minrep":0}],["room",38,37,"r1",{"room":"1","minrep":0}],["room",57,37,"r2",{"room":"2","minrep":0}],["room",67,4,"chamber",{"room":"komnata","minrep":60}],["gate",92,16.2,"schody_gora",{"minrep":80}],["fire",32,36.7,"r3",null],["fire",73,36.7,"r4",null],["fire",11,56.7,"r13",null],["fire",24,56.7,"r11",null],["fire",48,3.7,"lounge",null],["fire",62,3.7,"chamber",null],["stairs",48.0,67.25,"schody_dol",{"to":1,"up":false}],["stairs",92.0,5.75,"schody_gora",{"to":26,"up":true}]],"walk":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAYAILxKB46XBAGAMB1AFf3/3///Huej5HrRO7uv//++fc8H3f/3f3fX/2t/+9/Pu7+u/u////7/93/fPz99/d/93/3/7Hn+ejrr2/fxn/s/3+H85GVV1a85f+T/t+a5ePvv79/y32n///9zwcCBAggAPgAAAEAgQ8ECBBAAPABAAIAAh8IECCAAOADAAQABD4QIEAAAcAHAAgACHz89u3v/77vvf/u/v/x///////////////x///////////////n/ee/f/7/f/79//4PQAAICED/FyCAAAAIgAAQEID+L0AAAQAQAAEgIAD5T4AAAgAgAAJAQAD6vwABBABAuL+DwCH2fyPHHAzB+f/vr++uv+6uu7qr8//f399df91dd3d35/+/v7+/g/v77//+z+Rkd39/B/f33//9H/4//vr6Dq6vv33bP/7/ZOVkGUxWXvEWf/7/+/v7M5i///7v/wAAAAAAYDAAAAAAAAAAAAAAwGAAAAAAAAAAAAAAwMEBAAAAAAAAAAAAgIMDAAAAAIAxhGEYIgc3wjAIc4z3nvf57g5u7fM97z3vPe/z3fXX2ud73nv++x//+OuvP/7xv//897//9/d/f//vf//pr3/3ru//+u5d//qTV77GXdb/ZY27fOXlv//9u7//+/t3//sPBCAAAgj/hwACIAABCEAABBD+DwEEQAACEIAACCD8HwIIgAAEIAABEED4PwQQAAEI/Nt///v////+99/++f//////////////4///////////////48//v//Pfef/+//njwAQAAAE+AABAEAACAEgAAAI8AECAIAAEAJAAAAQ4AMEAAABIASAAAAgwAcIAAACQDyMh8Hw2t96KAyP4fl8n+/z/f/3+T7f5/P5Pt/n8//n832+z4d/8I//5//P//t//MP/+3//z/6f//f//p//9/k+3/9/n+/z/T//7+E9POADHt7D+38+X+fqXMAHdK7O9fk8vP/3/4AP+H//7+HpXAAAAAAfAAAAQOfy/wAAAAA+AAAAgP8HAAAAAAB8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA","exits":{"1":[[46,65],[47,65],[48,65],[49,65],[50,65]],"26":[[90,6],[91,6],[92,6],[93,6],[94,6]]},"arrive":{"1":[48,62],"26":[90,17]}},{"map":26,"name":"Apartamenty","title":"Piętro II · Apartamenty","pic":"TavernPlan_2","w":81,"h":57,"s":9.7778,"ox":22.0,"oy":81.11,"rooms":[{"k":"hall","n":"Wielka galeria","t":"hall","g":"hall","r":[[9,17,71,23],[9,24,37,30],[43,24,71,30]],"e":[[38,24,43,24],[9,31,38,31],[43,31,72,31],[9,17,72,17],[72,17,72,31],[38,24,38,31],[9,17,9,31],[43,24,43,31]],"c":[40.5,24.0],"l":[57.0,25.6]},{"k":"serv","n":"Kącik służby","t":"service","g":"serv","r":[[1,17,7,30]],"e":[[1,17,8,17],[1,31,8,31],[8,17,8,31],[1,17,1,31]],"c":[4.5,24.0],"l":[4.5,20.61]},{"k":"bathlux","n":"Łazienka","t":"guest","g":"bathlux","r":[[73,17,79,30]],"e":[[73,17,80,17],[73,31,80,31],[80,17,80,31],[73,17,73,31]],"c":[76.5,24.0],"l":[76.5,25.05]},{"k":"s1b","n":"Apartament Różany","t":"private","g":"s1","r":[[1,1,10,15]],"e":[[1,16,11,16],[1,1,11,1],[11,1,11,16],[1,1,1,16]],"c":[6.0,8.5],"l":[6.0,8.91],"sub":"sypialnia"},{"k":"s1a","n":"Apartament Różany","t":"private","g":"s1","r":[[12,1,20,15]],"e":[[12,1,21,1],[12,16,21,16],[12,1,12,16],[21,1,21,16]],"c":[16.5,8.5],"l":[16.5,8.91],"sub":"salonik"},{"k":"lordb","n":"Apartament Lorda","t":"private","g":"lord","r":[[22,1,31,15]],"e":[[22,1,32,1],[22,16,32,16],[32,1,32,16],[22,1,22,16]],"c":[27.0,8.5],"l":[27.0,8.91],"sub":"sypialnia"},{"k":"lorda","n":"Apartament Lorda","t":"private","g":"lord","r":[[33,1,47,15]],"e":[[33,1,48,1],[33,16,48,16],[48,1,48,16],[33,1,33,16]],"c":[40.5,8.5],"l":[40.5,8.91],"sub":"salon"},{"k":"lib","n":"Biblioteka","t":"guest","g":"lib","r":[[49,1,58,15]],"e":[[49,1,59,1],[49,16,59,16],[59,1,59,16],[49,1,49,16]],"c":[54.0,8.5],"l":[54.0,5.74]},{"k":"s2a","n":"Apartament Błękitny","t":"private","g":"s2","r":[[60,1,68,15]],"e":[[60,16,69,16],[60,1,69,1],[60,1,60,16],[69,1,69,16]],"c":[64.5,8.5],"l":[64.5,8.91],"sub":"salonik"},{"k":"s2b","n":"Apartament Błękitny","t":"private","g":"s2","r":[[70,1,79,15]],"e":[[70,16,80,16],[70,1,80,1],[70,1,70,16],[80,1,80,16]],"c":[75.0,8.5],"l":[75.0,8.91],"sub":"sypialnia"},{"k":"s3b","n":"Apartament Zielony","t":"private","g":"s3","r":[[1,32,10,46]],"e":[[1,47,11,47],[1,32,11,32],[11,32,11,47],[1,32,1,47]],"c":[6.0,39.5],"l":[6.0,41.91],"sub":"sypialnia"},{"k":"s3a","n":"Apartament Zielony","t":"private","g":"s3","r":[[12,32,19,46]],"e":[[12,47,20,47],[12,32,20,32],[20,32,20,47],[12,32,12,47]],"c":[16.0,39.5],"l":[16.0,41.91],"sub":"salonik"},{"k":"salon","n":"Wielki salon","t":"guest","g":"salon","r":[[21,32,39,46]],"e":[[21,47,40,47],[21,32,40,32],[40,32,40,47],[21,32,21,47]],"c":[30.5,39.5],"l":[30.5,37.98]},{"k":"dining","n":"Jadalnia","t":"guest","g":"dining","r":[[41,32,59,46]],"e":[[41,47,60,47],[41,32,60,32],[41,32,41,47],[60,32,60,47]],"c":[50.5,39.5],"l":[50.5,37.98]},{"k":"s4a","n":"Apartament Złoty","t":"guest","g":"s4","r":[[61,32,68,46]],"e":[[61,47,69,47],[61,32,69,32],[69,32,69,47],[61,32,61,47]],"c":[65.0,39.5],"l":[65.0,41.91],"sub":"salonik"},{"k":"s4b","n":"Apartament Złoty","t":"guest","g":"s4","r":[[70,32,79,46]],"e":[[70,32,80,32],[70,47,80,47],[80,32,80,47],[70,32,70,47]],"c":[75.0,39.5],"l":[75.0,41.91],"sub":"sypialnia"},{"k":"terrace","n":"Taras","t":"guest","g":"terrace","r":[[30,47,30,53],[50,47,50,53],[21,48,29,53],[31,48,49,53],[51,48,59,53]],"e":[[21,54,60,54],[21,48,30,48],[31,48,50,48],[51,48,60,48],[30,47,31,47],[50,47,51,47],[60,48,60,54],[21,48,21,54],[50,47,50,48],[51,47,51,48],[30,47,30,48],[31,47,31,48]],"c":[40.5,50.5],"l":[40.0,50.9]},{"k":"schody_dol","n":"Schody w dół","t":"stairs","g":"schody_dol","r":[[38,24,42,29]],"e":[[38,30,43,30],[38,24,43,24],[38,24,38,30],[43,24,43,30]],"c":[40.5,27.0],"l":[40.5,27.0],"to":25,"up":false}],"icons":[["room",74,35,"s4b",{"room":"zloty","minrep":80}],["fire",16,3.7,"s1a",null],["fire",64,3.7,"s2a",null],["fire",15,34.7,"s3a",null],["fire",64,34.7,"s4a",null],["fire",40,3.7,"lorda",null],["fire",30,34.7,"salon",null],["stairs",40.0,28.25,"schody_dol",{"to":25,"up":false}]],"walk":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAwqxmO7+N/qxHG8/573v+ff/57Huf897y/v//95xz/e+9/X33Pe+9//nfc//7/nnfc//zvv/999T3vv//533//++D733//87z//PfB16//nudw/f3uqy9P/R3O//v6+P/f//r+n//31//+r/f1/z/+8e9//3//888/AAABAQABAAEBAAAAAgIAAgACAgAAAAQEAAQABAQAAAAICAAIAAgIAIDr/////////6/LX////3f////Xn7//////////vz9j/////////39Dxv7//9/3/////tz9//+/7/////35////f9//////g/////++/////+fv/+7+ff/u/u9P3/+N/fv+jf3fn6////8H/P//Px8AEAABBBBAAAQAACAAAggggAAIAABAAAQQQAABEAAAgAAIIIAAAiAAQJhTPuWD/w/lCON5//7/77///j2Pc/79/99///1zjv+d+++/f/w79z//GzbbZv/4N+x//v9v/s/+8e////z/n9/9/OPf//953r////vHv3/Pc7h+39/333/9Dud/vR4frL+/ev3P//rt/9n///X7H//4+/+////z5x8AAAAgAAACAAAAAADg/////w8AAAAAwHf/v/cfAAAAAIDH/z/+PwAAAAAA/////38AAAAAAPad/3PfAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=","exits":{"25":[[38,26],[39,26],[40,26],[41,26],[42,26]]},"arrive":{"25":[38,23]}}]};
    // </plan-data>
    const PLAN_EVENT = 950;   // the easels' event id on the three maps (the builders' ids end far below)
    const PLAN_BOARDS = {     // map -> the easel: the map's size (an edited map gets none), its cells, its picture
        1: { x: 46, y: 78, w: 101, h: 84, sheet: "!$Tavern_Plan", dir: 2, note: "<Occupy:left=1,right=1>", cells: [[45, 78], [46, 78], [47, 78]] },   // (right beside the quest board)
        25: { x: 53, y: 61, w: 97, h: 71, sheet: "!$Tavern_Plan_Small", dir: 2, note: "", cells: [[53, 61]] },
        26: { x: 44, y: 23, w: 81, h: 57, sheet: "!$Tavern_Plan_Small", dir: 4, note: "", cells: [[44, 23]] }
    };
    const PLAN = { pending: null, scene: null };
    const BLANK_COND = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1,
        switch1Valid: false, switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    function planBoardData(b) {
        return { id: PLAN_EVENT, name: "Plan karczmy", note: b.note, x: b.x, y: b.y, pages: [{
            conditions: Object.assign({}, BLANK_COND), directionFix: true,
            image: { tileId: 0, characterName: b.sheet, direction: b.dir, pattern: 1, characterIndex: 0 },
            list: [C(108, ["<Tavern:plan>"]), C(0, [])], moveFrequency: 3, moveRoute: { list: [C(0, [])], repeat: true, skippable: false, wait: false },
            moveSpeed: 3, moveType: 0, priorityType: 1, stepAnime: false, through: false, trigger: 0, walkAnime: false }] };
    }
    // an event the map maker placed with <Tavern:plan> (in its note or a comment on any page)
    const isPlan = e => { const t = tagOf(e); return !!t && t.kind === "plan"; };
    // the easel goes into a map's data as it loads (the core's injection: its saved events follow too) - only into the map it was made
    // for (its size), onto free cells, and not where the map maker placed a plan of his own
    T.inject(Object.keys(PLAN_BOARDS).map(Number), { ids: [PLAN_EVENT, PLAN_EVENT], owner: "TavernLife",
        build(data, mapId) {
            const b = PLAN_BOARDS[mapId];
            if (!b || !data || !Array.isArray(data.events) || data.width !== b.w || data.height !== b.h) return [];
            if (data.events.some(e => e && e.id !== PLAN_EVENT && b.cells.some(c => c[0] === e.x && c[1] === e.y))) return [];
            if (data.events.some(e => e && e.id !== PLAN_EVENT && isPlan(e))) return [];
            return [planBoardData(b)];
        } });

    // the hand and the small capitals of the parchment (the UI kit's fonts: QB Hand, QB Caps)
    const PF = { hand: ui.inkFont.hand, handB: ui.inkFont.handBold, caps: ui.inkFont.caps };
    const INKC = { ink: "#2c1c10", soft: "#5b4128", red: "#8e2417", green: "#2f5e22" };
    const KIND_WORD = { guest: "dla gości", service: "zaplecze", private: "prywatne", hall: "przejście", stairs: "schody" };
    const KIND_TINT = { guest: "#e7b467", service: "#a9bd8e", private: "#d49b97", hall: "#e6d6b4", stairs: "#d8c6a2" };
    const FLOOR_TAB = ["Parter", "Pokoje gości", "Apartamenty"];

    // ------------------------------------------------------------------ the plan's data
    const PS = PLAN_DATA.sheet, PP = PLAN_DATA.panel;   // [x, y, w, h] on the screen
    const planFloorOf = mapId => PLAN_DATA.floors.findIndex(f => f.map === mapId);
    const walkBits = {};
    function planWalk(fi) {
        if (walkBits[fi]) return walkBits[fi];
        const f = PLAN_DATA.floors[fi], raw = atob(f.walk), out = new Uint8Array(f.w * f.h);
        for (let i = 0; i < out.length; i++) out[i] = (raw.charCodeAt(i >> 3) >> (i & 7)) & 1;
        return (walkBits[fi] = out);
    }
    const inRects = (rects, x, y) => rects.some(r => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]);
    const rectDist = (r, x, y) => Math.hypot(Math.max(r[0] - x, 0, x - r[2] - 1), Math.max(r[1] - y, 0, y - r[3] - 1));
    // the room of a map cell (a doorway: the nearest room)
    function planRoomAt(fi, x, y) {
        const f = PLAN_DATA.floors[fi];
        if (!f) return null;
        const cx = Math.floor(x), cy = Math.floor(y);
        let best = null;
        for (const r of f.rooms) {
            if (inRects(r.r, cx, cy)) return r;
            const d = Math.min(...r.r.map(q => rectDist(q, x, y)));
            if (!best || d < best.d) best = { d, r };
        }
        return best ? best.r : null;
    }
    // what the cursor moves between: the rooms, a suite's two rooms as one
    function planItems(fi) {
        const f = PLAN_DATA.floors[fi];
        if (f._items) return f._items;
        const by = new Map();
        for (const r of f.rooms) {
            const k = r.g || r.k;
            if (!by.has(k)) by.set(k, { key: k, floor: fi, rooms: [], name: r.n, kind: r.t });
            by.get(k).rooms.push(r);
        }
        for (const it of by.values()) {
            const pts = it.rooms.map(r => r.l || r.c);
            it.cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
            it.cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
        }
        return (f._items = [...by.values()]);
    }
    const planItem = (fi, key) => planItems(fi).find(it => it.key === key) || null;
    const itemOfRoom = (fi, r) => (r ? planItem(fi, r.g || r.k) : null);
    // a map cell -> a point on the screen (the plan sheet's pixels)
    function planPoint(fi, x, y) {
        const f = PLAN_DATA.floors[fi];
        return { x: PS[0] + f.ox + (x + 0.5) * f.s, y: PS[1] + f.oy + (y + 0.5) * f.s };
    }

    // ------------------------------------------------------------------ who is there and when (the real hours of the plugins)
    const hhmm = h => (h >= 24 ? "24" : String(h).padStart(2, "0")) + ":00";
    const clockText = () => { const h = hour(), hh = Math.floor(h) % 24, mm = Math.floor((h - Math.floor(h)) * 60); return String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0"); };
    const between = (h, a, b) => (b > 24 ? h >= a || h < b - 24 : h >= a && h < b);
    const storyShift = () => { const p = PluginManager.parameters("Story"); return [num(p.shiftFrom, 16), num(p.shiftTo, 21)]; };
    const hasStory = () => !!T.call("Story", "active");
    const TD = () => T.api("TavernDice");
    function diceNow() {
        const D = TD();
        if (!D || !D.present) return null;
        return D.present(hour(), day()).map(p => ({ key: p.key, name: D.OPPONENTS[p.key].short, tired: p.tired }));
    }
    // the dice players by their hours (TavernDice.js): the regulars on one line, the guests who need the tavern's fame on another
    function diceRivals() {
        const D = TD();
        if (!D || !D.OPPONENTS) return [];
        const h = hour(), now = new Set((D.present(h, day()) || []).map(p => p.key));
        const say = k => { const o = D.OPPONENTS[k]; return o.short + " " + o.hours[0] + "–" + o.hours[1] + (o.minRep && QB() ? " (sława " + o.minRep + (o.rare ? ", nie co dzień" : "") + ")" : o.rare ? " (nie co dzień)" : ""); };
        const regular = ["ozzy", "bartek", "grum"].filter(k => D.OPPONENTS[k]), fame = ["kupiec", "nieznajomy"].filter(k => D.OPPONENTS[k] && (QB() || !D.OPPONENTS[k].needsRep));
        const out = [];
        if (regular.length) out.push({ text: "Kości: " + regular.map(say).join(" · "), on: regular.some(k => now.has(k)) });
        if (fame.length) out.push({ text: "Goście od kości: " + fame.map(say).join(" · "), on: fame.some(k => now.has(k)) });
        return out;
    }
    const songDone = () => S().songDay === day();
    const songOpen = () => inSongHours() && !songDone();
    // a room for the night on the plan: its bed's data (TavernLife's rooms), what it costs, whether it is to be had
    function rentState(roomKeyName) {
        const r = roomOf(roomKeyName);
        if (!r) return null;
        const mine = isRented(r.room), other = rentedRoom();
        return { r, price: roomPrice(r), mine, taken: !mine && !!other, ok: canRent(r), need: r.minrep || 0 };
    }
    // is an icon's service open now (lit) or not (dimmed)
    function iconLit(ic) {
        const [kind, , , , extra] = ic;
        switch (kind) {
            case "stage": return songOpen();
            case "dice": { const d = diceNow(); return !!d && d.some(p => !p.tired); }
            case "room": { const st = rentState(extra && extra.room); return !!st && st.ok && (st.mine || !st.taken); }
            case "gate": return reputation() >= ((extra && extra.minrep) || 80) || !!Object.keys(S().gates || {}).length;
            default: return true;   // the bar, the kitchen, Grum, the bath, the darts, the board, the stairs, the fires: all day
        }
    }
    const ICON_WORD = { bar: "Bar · Borgar", kitchen: "Kuchnia", board: "Tablica zleceń", dice: "Kości", arm: "Siłowanie", darts: "Rzutki",
        bath: "Łaźnia", stage: "Scena · Melia", stairs: "Schody", room: "Pokój na noc", gate: "Złocona krata", fire: "Kominek" };

    // what the panel says about a room: { kicker, title, status: { tone, text }, sections: [{ head, lines: [{ icon, text, tone }] }] }
    const L_ = (icon, text, tone) => ({ icon, text, tone });
    function planInfo(it) {
        const f = PLAN_DATA.floors[it.floor], key = f.map + ":" + it.key, r0 = it.rooms[0];
        const out = { kicker: (KIND_WORD[it.kind] || "") + " · " + FLOOR_TAB[it.floor], title: it.name, status: null, sections: [] };
        const what = [], who = [], price = [];
        const sec = () => {
            if (what.length) out.sections.push({ head: "Co tu jest", lines: what });
            if (who.length) out.sections.push({ head: "Kto i kiedy", lines: who });
            if (price.length) out.sections.push({ head: "Ceny", lines: price });
            return out;
        };
        const open = (text) => { out.status = { tone: "open", text }; };
        const shut = (text) => { out.status = { tone: "closed", text }; };
        const info = (text) => { out.status = { tone: "info", text }; };
        const d = PLAN_DESC[key];
        if (d) what.push(L_(null, d));
        const h = hour();
        switch (key) {
            case "1:sala": {
                who.push(L_("bar", "Borgar — za ladą, o każdej porze"));
                if (hasStory()) { const [a, b] = storyShift(); who.push(L_("bar", "Zmiany u Borgara " + hhmm(a) + "–" + hhmm(b) + ", jedna dziennie", between(h, a, b) ? "good" : null)); }
                const dd = dishOfDay(), prices = DISHES.map(x => priceOf(x));
                price.push(L_("kitchen", "Jedzenie i napitki: " + Math.min(...prices) + "–" + Math.max(...prices) + " G"));
                price.push(L_("kitchen", "Danie dnia: " + dd.name + " — " + priceOf(dd) + " G (−" + Math.round(DAY_DISCOUNT * 100) + "%)", "good"));
                const rs = rooms().filter(x => !x.minrep);
                if (rs.length) price.push(L_("room", "Pokój na noc: od " + Math.min(...rs.map(x => roomPrice(x))) + " G (u Borgara)"));
                if (repDiscount() > 0) price.push(L_(null, "Twoja sława: u Borgara −" + pct(repDiscount()), "good"));
                open("Otwarte — Borgar podaje o każdej porze");
                break;
            }
            case "1:kuchnia":
                who.push(L_("kitchen", "Kucharze Borgara — od świtu do nocy"));
                price.push(L_("bar", "Zamawiasz u Borgara przy ladzie; posiłek podadzą do stołu"));
                open("Kuchnia wydaje o każdej porze");
                break;
            case "1:scena": {
                const m = "Melia Srebrogłosa — śpiewa " + hhmm(SONG_FROM) + "–24:00, raz na wieczór";
                who.push(L_("stage", m, songOpen() ? "good" : null));
                price.push(L_(null, "Napiwek do kapelusza: " + SONG_TIP + " G (nieobowiązkowy)"));
                price.push(L_(null, "Po pieśni: Natchniony, +" + Math.round(INSPIRED_XP * 100) + "% doświadczenia na " + hoursText(INSPIRED_HOURS)));
                if (songOpen()) open("Teraz: Melia śpiewa — podejdź pod scenę");
                else if (inSongHours()) shut("Dziś już śpiewała — jutro od " + hhmm(SONG_FROM));
                else shut("Teraz cisza — śpiewa od " + hhmm(SONG_FROM));
                break;
            }
            case "1:gry": {
                who.push(L_("arm", "Grum Żelazna Pięść — siłowanie na rękę, cały dzień"));
                for (const l of diceRivals()) who.push(L_("dice", l.text, l.on ? "good" : null));
                price.push(L_("arm", "Siłowanie: stawki " + ARM_STAKES.join(" / ") + " G"));
                if (TD()) price.push(L_("dice", "Kości: stawka rywala, od " + Math.min(...Object.values(TD().OPPONENTS).map(o => o.stakes[0])) + " G"));
                const dn = diceNow();
                if (dn && dn.length) open("Przy kościach: " + dn.map(p => p.name).join(", "));
                else if (TD()) open("Grum czeka przy stole · kości od " + hhmm(10));
                else open("Grum czeka przy stole");
                break;
            }
            case "1:rzutki":
                who.push(L_("darts", "Dziadek Ozzy albo furman Wiesiek — o każdej porze"));
                price.push(L_("darts", "Stawki " + DARTS_STAKES.join(" / ") + " G · trzy rundy po trzy lotki"));
                open("Tarcze wolne — zawsze ktoś chętny");
                break;
            case "1:laznia":
                who.push(L_("bath", "Łaziebna Wanda — grzeje wodę o każdej porze"));
                price.push(L_("bath", "Kąpiel: " + bathPrice() + " G" + (bathPrice() < BATH_PRICE ? " (zamiast " + BATH_PRICE + " G)" : "") + " · godzina"));
                price.push(L_(null, "Po kąpieli: Czysty — prace o " + Math.round(CLEAN_COST * 100) + "% lżejsze przez " + hoursText(CLEAN_HOURS)));
                open("Otwarte — woda gorąca");
                break;
            case "1:mysliwski":
                who.push(L_("fire", "Dziadek Ozzy — przy kominku, zwykle od rana do nocy"));
                break;
            case "1:jadalnia":
                price.push(L_("kitchen", "Tu też podają posiłki — zamówisz u Borgara"));
                break;
            case "1:sien": {
                const Q = QB();
                who.push(L_("board", Q ? "Tablica zleceń — nowe ogłoszenia co " + (Q.REFRESH_DAYS || 3) + " dni" : "Tablica zleceń — ogłoszenia z okolicy"));
                if (Q) {
                    const b = Q.board ? Q.board().filter(n => n && !n.taken && !n.done).length : 0;
                    if (b) who.push(L_("board", "Na tablicy wisi teraz " + b + " " + (b === 1 ? "ogłoszenie" : b < 5 ? "ogłoszenia" : "ogłoszeń"), "good"));
                    price.push(L_(null, "Twoja sława: " + tierName(repTier()) + " (" + reputation() + "/100)"));
                }
                who.push(L_("stairs", "Schody po obu stronach — na piętro, do pokoi gości"));
                open("Wejście otwarte dzień i noc");
                break;
            }
            case "25:chamber": case "26:s4": case "25:r1": case "25:r2": case "25:r3": {
                const id = { "25:chamber": "komnata", "26:s4": "zloty" }[key] || key.slice(4);
                const st = rentState(id);
                if (!st) { info("Pokój gościnny"); break; }
                what.unshift(L_(null, st.r.desc));
                price.push(L_("room", "Noc: " + st.price + " G" + (st.price !== st.r.price ? " (zamiast " + st.r.price + " G)" : "") + " · do " + CHECKOUT + ":00 rano"));
                price.push(L_(null, "Rano: " + giftName(st.r.room) + (RESTED[st.r.room] ? " · Wypoczęty " + hoursText(RESTED[st.r.room]) : "")));
                // (the tavern's fame is QuestBoard.js's: without it no word of fame, the room stays shut)
                if (st.need && QB()) price.push(L_("gate", "Dla gości o sławie „" + tierName(repTierOf(st.need)) + "” (" + st.need + ")", st.ok ? "good" : "bad"));
                who.push(L_("bar", "Wynajmiesz u Borgara, przy ladzie na parterze"));
                if (st.mine) open("Twój pokój do " + CHECKOUT + ":00 — drzwi otwarte");
                else if (!st.ok) shut(QB() ? "Zamknięte — potrzebna sława " + st.need : "Zamknięte — tylko dla stałych gości");
                else if (st.taken) info("Masz już pokój na tę noc");
                else open("Wolny na tę noc");
                break;
            }
            case "25:schody_gora": {
                const g = (f.icons.find(ic => ic[0] === "gate") || [])[4] || { minrep: 80 };
                const on = iconLit(["gate", 0, 0, "", g]);
                who.push(L_("gate", "Złocona krata z dzwonkiem" + (QB() ? " — dla gości o sławie „" + tierName(repTierOf(g.minrep)) + "” (" + g.minrep + ")" : " — dla dostojnych gości"), on ? "good" : "bad"));
                if (on) open("Krata otwarta — Apartamenty czekają"); else shut("Krata zamknięta" + (QB() ? " — potrzebna sława " + g.minrep : ""));
                break;
            }
            case "26:lord":
                who.push(L_(null, "Zarezerwowany dla gości Lorda Zaleskiego"));
                shut("Zamknięte — tylko dla gości Lorda");
                break;
        }
        if (/^25:r\d+$/.test(key) && !["25:r1", "25:r2", "25:r3"].includes(key)) {
            what.push(L_(null, "Pokój gościnny" + (r0.sub ? " — " + (r0.sub === "rodzinny" ? "rodzinny" : r0.sub.replace("1-os.", "jednoosobowy").replace("2-os.", "dwuosobowy")) : "") + "."));
            who.push(L_(null, "Wynajęty przez innych gości — drzwi zamknięte"));
            shut("Zajęty");
        }
        if (it.kind === "stairs" && r0.to) {
            const to = planFloorOf(r0.to);
            if (!what.length) what.push(L_(null, (r0.up ? "Schody w górę: " : "Schody w dół: ") + (to >= 0 ? FLOOR_TAB[to] : "") + "."));
            if (!out.status) open("Q/E — zobacz " + (to >= 0 ? FLOOR_TAB[to] : "piętro"));
        }
        if (!what.length) what.push(L_(null, PLAN_KIND_DESC[it.kind] || ""));
        if (!out.status) {
            if (it.kind === "private") shut(key.startsWith("26:") ? "Zajęty przez gości" : "Prywatne — tylko dla domowników");
            else if (it.kind === "service") info("Zaplecze karczmy");
            else if (it.kind === "hall") info("Przejście — otwarte dzień i noc");
            else open("Otwarte");
        }
        return sec();
    }
    // (for other plugins and the tests)
    const planApi = {
        open: opts => openPlan(opts),
        get scene() { return PLAN.scene; },
        state: () => (PLAN.scene ? PLAN.scene.state() : null),
        items: fi => planItems(fi).map(it => ({ key: it.key, name: it.name, kind: it.kind, cx: it.cx, cy: it.cy })),
        roomAt: (fi, x, y) => { const r = planRoomAt(fi, x, y); return r ? r.g || r.k : null; },
        point: (fi, x, y) => planPoint(fi, x, y),
        info: (fi, key) => { const it = planItem(fi, key); return it ? planInfo(it) : null; },
        icons: fi => PLAN_DATA.floors[fi].icons.map(ic => ({ kind: ic[0], x: ic[1], y: ic[2], room: ic[3], lit: iconLit(ic) })),
        way: (fi, target, here, at) => planWay(fi, target, here === undefined ? -1 : here, at),
        select: key => { const s = PLAN.scene, it = s && planItem(s.floor, key); if (it) s.select(it); return !!it; },
        floor: fi => { const s = PLAN.scene; if (s) s.showFloor(clamp(fi, 0, PLAN_DATA.floors.length - 1)); return !!s; },
        DATA: PLAN_DATA, BOARDS: PLAN_BOARDS, EVENT: PLAN_EVENT
    };
    const PLAN_KIND_DESC = { guest: "Dla gości karczmy.", service: "Zaplecze karczmy.", private: "Prywatne.", hall: "Przejście.", stairs: "Schody." };
    const PLAN_DESC = {
        "1:komorka": "Ciasna komórka za składem: stare beczki, połamane stołki i rupiecie, których Borgar nie ma serca wyrzucić.",
        "1:sklad": "Worki z mąką i kaszą, skrzynie, sól i przyprawy. Stąd kuchnia bierze, co trzeba.",
        "1:browar": "Kadzie, miedziany kocioł i beczki, w których dojrzewa piwo „Złotego Kufla”. Pachnie chmielem.",
        "1:sluzba": "Łóżka i skrzynie ludzi Borgara. Tu odpoczywają między zmianami.",
        "1:gabinet": "Biurko z księgą rachunków, szkatuła i klucze do pokoi. Tu Borgar liczy utarg.",
        "1:magazyn": "Beczki piwa, skrzynie wina i zapasy na zimę.",
        "1:wedzarnia": "Szynki i kiełbasy w dymie z olchy. Zapach niesie się aż na korytarz.",
        "1:korytarz": "Korytarz zaplecza: z sal do składów, browaru, spiżarni i gabinetu.",
        "1:spizarnia": "Półki z serami, słojami i chlebem — między kuchnią a piekarnią.",
        "1:kuchnia": "Piec, kotły i stół do krojenia. Stąd wychodzą gulasz, kapuśniak i pieczeń.",
        "1:piekarnia": "Piec chlebowy i dzieże z ciastem. Chleb i placki idą przez okienko prosto do sali.",
        "1:mysliwski": "Kamienny kominek, poroża i łby dzików na ścianach, długi stół myśliwych.",
        "1:biesiadna": "Dwa długie stoły na wesela i biesiady, chorągwie i zbroje w kątach.",
        "1:scena": "Scena z czerwonymi kotarami, stoliki przy świecach, kapelusz na napiwki.",
        "1:gry": "Stoły do kości, stół do siłowania na rękę, karty, warcaby i kredowa tablica wyników.",
        "1:rzutki": "Tarcze do rzutek na ścianie i linia rzutu.",
        "1:laznia": "Cztery balie z gorącą wodą za parawanami, szare mydło i szorstkie ręczniki.",
        "1:sala": "Serce karczmy: lada w kształcie L, dwa kamienne kominki i długie stoły z ławami.",
        "1:jadalnia": "Stół bankietowy dla gości, którzy wolą zjeść w spokoju.",
        "1:palarnia": "Fotele, fajki i regały z książkami. Cicho jak w klasztorze.",
        "1:sien": "Wejście do karczmy: tablica zleceń, ten plan, wieszaki na płaszcze i dwoje schodów na piętro.",
        "1:schody_zach": "Schody na piętro, do pokoi gości.", "1:schody_wsch": "Schody na piętro, do pokoi gości.",
        "25:nc": "Korytarz z drzwiami pokoi gości; boazeria, latarnie i obrazy.", "25:sc": "Korytarz z drzwiami pokoi gości; boazeria, latarnie i obrazy.",
        "25:gal": "Galeria nad wielką salą: przez balustradę widać żyrandol i gości w dole.",
        "25:hall": "Hall przy schodach z sali: księga gości, zegar stojący, żyrandol.",
        "25:lounge": "Kominek z kamienia, fotele, sofa i biblioteczka — dla wszystkich gości piętra.",
        "25:bath": "Balie za parawanami i umywalki dla gości piętra.",
        "25:linen": "Półki z pościelą, ręcznikami i świecami na zapas.",
        "25:maid": "Pokój pokojówki: łóżko, szafa i wózek z pościelą.",
        "25:schody_dol": "Schody w dół, do wielkiej sali.", "25:schody_gora": "Schody na górę, do Apartamentów.",
        "26:hall": "Marmur, kolumny i kandelabry. Na osi drzwi apartamentu Lorda z herbem Zaleskich.",
        "26:serv": "Kącik służby: srebra, pościel i łóżko służącego.",
        "26:bathlux": "Miedziana wanna i toaletka z lustrem.",
        "26:lib": "Ściana regałów, pulpit z atlasem, fotele przy kominku.",
        "26:salon": "Wielki salon: kominek, sofy, harfa i szpinet.",
        "26:dining": "Długi stół na czternaście osób, srebra i kandelabry.",
        "26:terrace": "Taras nad dziedzińcem: balustrada i donice z kwiatami.",
        "26:s1": "Salonik z kominkiem i sypialnia z łożem z baldachimem. Zajęty przez gości.",
        "26:s2": "Salonik z kominkiem i sypialnia z łożem z baldachimem. Zajęty przez gości.",
        "26:s3": "Salonik z kominkiem i sypialnia z łożem z baldachimem. Zajęty przez gości.",
        "26:lord": "Salon z herbem Zaleskich i chorągwiami, sypialnia z łożem Lorda.",
        "26:schody": "Schody w dół, do pokoi gości."
    };

    // ------------------------------------------------------------------ the way (O): along the plan's walkable cells, floor by floor
    function planBfs(fi, from, goal) {
        const f = PLAN_DATA.floors[fi], W0 = f.w, H0 = f.h, walk = planWalk(fi);
        const idx = (x, y) => y * W0 + x, prev = new Int32Array(W0 * H0).fill(-1);
        const sx = clamp(Math.floor(from[0]), 0, W0 - 1), sy = clamp(Math.floor(from[1]), 0, H0 - 1), start = idx(sx, sy);
        const q = [start];
        prev[start] = start;
        for (let h = 0; h < q.length; h++) {
            const c = q[h], x = c % W0, y = (c - x) / W0;
            if (goal(x, y)) {
                const path = [];
                for (let k = c; ; k = prev[k]) { path.push([k % W0, Math.floor(k / W0)]); if (k === start) break; }
                return path.reverse();
            }
            for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= W0 || ny >= H0) continue;
                const n = idx(nx, ny);
                if (prev[n] >= 0 || !walk[n]) continue;
                prev[n] = c;
                q.push(n);
            }
        }
        return null;
    }
    // the part of the way to `target` ({ floor, key }) that lies on floor fi: from him (or from where the stairs bring him) to the
    // room (or to the stairs that lead on)
    function planWay(fi, target, here, heroAt) {
        if (!target) return null;
        const hf = here >= 0 ? here : 0, tf = target.floor;
        if (fi < Math.min(hf, tf) || fi > Math.max(hf, tf)) return null;
        const f = PLAN_DATA.floors[fi], step = tf > hf ? 1 : -1;
        let from;
        if (fi === hf && here >= 0 && heroAt) from = heroAt;
        else if (fi === hf) from = f.arrive && f.arrive["8"] || [Math.floor(f.w / 2), f.h - 2];
        else from = f.arrive[String(PLAN_DATA.floors[fi - step].map)];
        if (!from) return null;
        let goal;
        if (fi === tf) {
            const it = planItem(fi, target.key);
            if (!it) return null;
            goal = (x, y) => it.rooms.some(r => inRects(r.r, x, y));
        } else {
            const cells = (f.exits[String(PLAN_DATA.floors[fi + step].map)] || []);
            goal = (x, y) => cells.some(c => c[0] === x && c[1] === y);
        }
        return planBfs(fi, from, goal);
    }

    // ------------------------------------------------------------------ drawing: the icons, the marker, the panel
    // an icon's little drawing in a 20 x 20 box, in one colour (bg: the colour of what is cut out of it)
    function planGlyph(ctx, kind, x, y, size, col, bg) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(size / 20, size / 20);
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.8; ctx.lineJoin = "round"; ctx.lineCap = "round";
        const fill = f => { ctx.beginPath(); f(); ctx.fill(); };
        const line = (f, w) => { ctx.beginPath(); f(); if (w) ctx.lineWidth = w; ctx.stroke(); };
        const cut = f => { ctx.save(); ctx.fillStyle = bg; ctx.beginPath(); f(); ctx.fill(); ctx.restore(); };
        switch (kind) {
            case "bar":       // a tankard with foam
                fill(() => { ctx.moveTo(4.6, 7.6); ctx.lineTo(13.4, 7.6); ctx.lineTo(12.9, 17.5); ctx.lineTo(5.1, 17.5); ctx.closePath(); });
                line(() => { ctx.moveTo(13.2, 9.4); ctx.bezierCurveTo(18.2, 9.4, 18.2, 15.4, 13, 15.4); }, 2.1);
                fill(() => { ctx.arc(6.1, 6.9, 2.1, Math.PI, 0); ctx.arc(9.2, 5.7, 2.4, Math.PI, 0); ctx.arc(12.2, 6.9, 2, Math.PI, 0); ctx.lineTo(14.2, 8.2); ctx.lineTo(4, 8.2); ctx.closePath(); });
                cut(() => { ctx.rect(7, 10, 1.3, 5.6); ctx.rect(10, 10, 1.3, 5.6); });
                break;
            case "kitchen":   // a cauldron on its legs, steam over it
                fill(() => { ctx.moveTo(3.5, 10); ctx.lineTo(16.5, 10); ctx.quadraticCurveTo(16.5, 17.5, 10, 17.5); ctx.quadraticCurveTo(3.5, 17.5, 3.5, 10); });
                line(() => { ctx.moveTo(2.5, 10); ctx.lineTo(17.5, 10); }, 2);
                line(() => { ctx.moveTo(6, 17); ctx.lineTo(5, 19); ctx.moveTo(14, 17); ctx.lineTo(15, 19); }, 1.6);
                line(() => { ctx.moveTo(7.5, 7.5); ctx.quadraticCurveTo(6, 5.5, 7.5, 3.5); ctx.quadraticCurveTo(9, 1.8, 7.8, 0.6); ctx.moveTo(12, 7.5); ctx.quadraticCurveTo(10.5, 5.5, 12, 3.5); ctx.quadraticCurveTo(13.5, 1.8, 12.3, 0.6); }, 1.4);
                break;
            case "dice": {    // two dice, one tilted
                const die = (cx, cy, a, pips) => {
                    ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
                    fill(() => { ctx.rect(-4.6, -4.6, 9.2, 9.2); });
                    for (const [px, py] of pips) cut(() => { ctx.arc(px, py, 1.15, 0, Math.PI * 2); });
                    ctx.restore();
                };
                die(6.6, 12.6, -0.18, [[-2.3, -2.3], [0, 0], [2.3, 2.3]]);
                die(13.8, 7.2, 0.28, [[-2.2, -2.2], [2.2, -2.2], [-2.2, 2.2], [2.2, 2.2]]);
                break;
            }
            case "darts":     // a target with a dart in it
                line(() => { ctx.arc(9, 11, 7.2, 0, Math.PI * 2); }, 1.7);
                line(() => { ctx.arc(9, 11, 3.8, 0, Math.PI * 2); }, 1.5);
                fill(() => { ctx.arc(9, 11, 1.5, 0, Math.PI * 2); });
                line(() => { ctx.moveTo(9.6, 10.4); ctx.lineTo(17.5, 2.5); }, 1.8);
                fill(() => { ctx.moveTo(17.5, 2.5); ctx.lineTo(19.4, 1.2); ctx.lineTo(18.9, 4.6); ctx.closePath(); ctx.moveTo(17.5, 2.5); ctx.lineTo(14.5, 1.4); ctx.lineTo(16.2, 3.8); ctx.closePath(); });
                break;
            case "arm":       // two forearms locked, elbows on the table
                line(() => { ctx.moveTo(2.5, 17.5); ctx.lineTo(8.6, 8.2); }, 3.4);
                line(() => { ctx.moveTo(17.5, 17.5); ctx.lineTo(11.4, 8.2); }, 3.4);
                fill(() => { ctx.arc(10, 6.8, 3.6, 0, Math.PI * 2); });
                line(() => { ctx.moveTo(1.5, 18.6); ctx.lineTo(18.5, 18.6); }, 1.4);
                break;
            case "bath":      // a tub on feet, steam
                fill(() => { ctx.moveTo(2.5, 10.5); ctx.lineTo(17.5, 10.5); ctx.lineTo(16.2, 15.6); ctx.quadraticCurveTo(10, 17.4, 3.8, 15.6); ctx.closePath(); });
                line(() => { ctx.moveTo(1.6, 10.5); ctx.lineTo(18.4, 10.5); }, 1.8);
                line(() => { ctx.moveTo(5, 16); ctx.lineTo(4.4, 18.4); ctx.moveTo(15, 16); ctx.lineTo(15.6, 18.4); }, 1.6);
                line(() => { ctx.moveTo(7, 8); ctx.quadraticCurveTo(5.6, 6, 7, 4.2); ctx.quadraticCurveTo(8.4, 2.6, 7.2, 1.2); ctx.moveTo(12.4, 8); ctx.quadraticCurveTo(11, 6, 12.4, 4.2); ctx.quadraticCurveTo(13.8, 2.6, 12.6, 1.2); }, 1.3);
                break;
            case "stage": {   // a lute
                ctx.save(); ctx.translate(8, 12.5); ctx.rotate(-0.72);
                fill(() => { ctx.ellipse(0, 0, 5.2, 4.3, 0, 0, Math.PI * 2); });
                cut(() => { ctx.arc(0.4, 0, 1.35, 0, Math.PI * 2); });
                ctx.restore();
                line(() => { ctx.moveTo(10.6, 9.6); ctx.lineTo(16.6, 3.4); }, 2.2);
                fill(() => { ctx.moveTo(15.4, 2.2); ctx.lineTo(19, 1.2); ctx.lineTo(18.2, 4.8); ctx.lineTo(16.9, 4.9); ctx.closePath(); });
                break;
            }
            case "board":     // a notice board on its posts
                line(() => { ctx.rect(3, 3.5, 14, 10.5); }, 1.8);
                line(() => { ctx.moveTo(5, 14); ctx.lineTo(5, 19); ctx.moveTo(15, 14); ctx.lineTo(15, 19); }, 1.8);
                fill(() => { ctx.rect(5.2, 5.6, 4.2, 5.2); ctx.rect(10.6, 5.6, 4.2, 3.4); });
                break;
            case "stairs":    // steps rising
                fill(() => { ctx.moveTo(2.5, 17.5); ctx.lineTo(2.5, 13.5); ctx.lineTo(6.5, 13.5); ctx.lineTo(6.5, 9.5); ctx.lineTo(10.5, 9.5); ctx.lineTo(10.5, 5.5); ctx.lineTo(14.5, 5.5); ctx.lineTo(14.5, 1.8); ctx.lineTo(17.5, 1.8); ctx.lineTo(17.5, 17.5); ctx.closePath(); });
                break;
            case "room":      // a bed: headboard, pillow, blanket
                fill(() => { ctx.rect(2.5, 5, 2.6, 12.5); ctx.rect(15.4, 10.5, 2.2, 7); });
                fill(() => { ctx.rect(5, 11, 10.6, 4); });
                fill(() => { ctx.ellipse(7.8, 9.3, 2.6, 1.6, 0, 0, Math.PI * 2); });
                fill(() => { ctx.moveTo(10, 9.4); ctx.lineTo(15.4, 9.4); ctx.lineTo(15.4, 11); ctx.lineTo(10, 11); ctx.closePath(); });
                break;
            case "gate": case "lock":   // a padlock
                line(() => { ctx.moveTo(6.2, 9.5); ctx.lineTo(6.2, 6.8); ctx.arc(10, 6.8, 3.8, Math.PI, 0); ctx.lineTo(13.8, 9.5); }, 2.2);
                fill(() => { ctx.rect(3.6, 9.2, 12.8, 9); });
                cut(() => { ctx.arc(10, 12.8, 1.5, 0, Math.PI * 2); ctx.rect(9.4, 13, 1.2, 3); });
                break;
            case "key":       // a key
                line(() => { ctx.arc(5.6, 10, 3.6, 0, Math.PI * 2); }, 2.1);
                line(() => { ctx.moveTo(9.2, 10); ctx.lineTo(18.2, 10); ctx.moveTo(15.4, 10); ctx.lineTo(15.4, 13.4); ctx.moveTo(18, 10); ctx.lineTo(18, 13); }, 2.1);
                break;
            case "fire":      // a flame
                fill(() => { ctx.moveTo(10, 1.5); ctx.bezierCurveTo(14.5, 6.5, 17.5, 9.5, 16, 14); ctx.bezierCurveTo(15, 17.6, 12.4, 18.8, 10, 18.8); ctx.bezierCurveTo(7.6, 18.8, 5, 17.6, 4, 14); ctx.bezierCurveTo(3.2, 10.6, 5.6, 9.4, 6.6, 6.6); ctx.bezierCurveTo(7.6, 8.6, 8.4, 9.2, 9, 9.4); ctx.bezierCurveTo(8.8, 6.6, 9, 4, 10, 1.5); });
                cut(() => { ctx.moveTo(10, 10); ctx.bezierCurveTo(12.4, 12.4, 13.2, 14.2, 12.6, 15.8); ctx.bezierCurveTo(12, 17.2, 11, 17.6, 10, 17.6); ctx.bezierCurveTo(9, 17.6, 7.8, 17.1, 7.4, 15.8); ctx.bezierCurveTo(7, 14, 8.6, 12.4, 10, 10); });
                break;
            case "map":       // a folded plan (the P menu)
                line(() => { ctx.moveTo(2.5, 5); ctx.lineTo(7.5, 3); ctx.lineTo(12.5, 5); ctx.lineTo(17.5, 3); ctx.lineTo(17.5, 16); ctx.lineTo(12.5, 18); ctx.lineTo(7.5, 16); ctx.lineTo(2.5, 18); ctx.closePath(); }, 1.6);
                line(() => { ctx.moveTo(7.5, 3); ctx.lineTo(7.5, 16); ctx.moveTo(12.5, 5); ctx.lineTo(12.5, 18); }, 1.2);
                fill(() => { ctx.arc(10, 10.2, 1.7, 0, Math.PI * 2); });
                break;
        }
        ctx.restore();
    }
    // a service on the plan: a small ink medallion; lit (open now): dark ink, a gold ring and glyph, a warm glow; dimmed: faded
    const MEDAL_R = { stairs: 9, fire: 9 };   // (the landmarks a little smaller than the services)
    function planMedallion(ctx, kind, cx, cy, lit, badge) {
        const r = MEDAL_R[kind] || 11, gs = r * 1.27;
        ctx.save();
        if (lit) {
            const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, r + 9);
            g.addColorStop(0, "rgba(255,206,110,0.55)"); g.addColorStop(1, "rgba(255,196,90,0)");
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r + 9, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = lit ? 1 : 0.62;
        ctx.fillStyle = lit ? "#3a2415" : "#b8a482";
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = 1.6; ctx.strokeStyle = lit ? "#e2b44e" : "#7d6a50";
        ctx.beginPath(); ctx.arc(cx, cy, r - 0.8, 0, Math.PI * 2); ctx.stroke();
        planGlyph(ctx, kind, cx - gs / 2, cy - gs / 2, gs, lit ? "#f6d57e" : "#5d4c38", lit ? "#3a2415" : "#b8a482");
        if (badge) {   // a key (to be had) or a padlock (not yet) on a room for the night
            const bx = cx + 8, by = cy + 8;
            ctx.globalAlpha = 1;
            ctx.fillStyle = badge === "key" ? "#2f5e22" : "#8e2417";
            ctx.beginPath(); ctx.arc(bx, by, 6.2, 0, Math.PI * 2); ctx.fill();
            ctx.lineWidth = 1.2; ctx.strokeStyle = "#f1e2bd"; ctx.beginPath(); ctx.arc(bx, by, 5.6, 0, Math.PI * 2); ctx.stroke();
            planGlyph(ctx, badge, bx - 4.4, by - 4.4, 8.8, "#fbf0d2", badge === "key" ? "#2f5e22" : "#8e2417");
        }
        ctx.restore();
    }
    function wrapCtx(ctx, text, maxW) {
        const out = [];
        for (const para of String(text).split("\n")) {
            let line = "";
            for (const word of para.split(" ")) {
                const t = line ? line + " " + word : word;
                if (line && ctx.measureText(t).width > maxW) { out.push(line); line = word; } else line = t;
            }
            out.push(line);
        }
        return out;
    }
    function inkLine(ctx, text, x, y, font, colour, align) {
        ctx.font = font; ctx.fillStyle = colour; ctx.textAlign = align || "left"; ctx.textBaseline = "alphabetic";
        ctx.fillText(text, x, y);
    }
    // letters spaced out (the small capitals of the heads)
    function spacedCaps(ctx, text, x, y, size, colour, sp) {
        ctx.font = PF.caps(size); ctx.fillStyle = colour; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
        let cx = x;
        for (const ch of text) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + sp; }
        return cx - x;
    }

    // ------------------------------------------------------------------ the scene
    class Scene_TavernPlan extends Scene_Base {
        initialize() {
            super.initialize();
            this.opts = PLAN.pending || {};
            PLAN.pending = null;
        }
        create() {
            super.create();
            ui.ensureFonts();
            this.addChild(new Sprite(ImageManager.loadPicture("TavernPlan_Back")));
            this.pics = PLAN_DATA.floors.map(f => ImageManager.loadPicture(f.pic));
            this.sheetOld = new Sprite();
            this.sheet = new Sprite();
            for (const s of [this.sheetOld, this.sheet]) { s.x = PS[0]; s.y = PS[1]; this.addChild(s); }
            this.layer = {};
            for (const k of ["hi", "way", "icons"]) {
                const s = new Sprite(new Bitmap(PS[2], PS[3]));
                s.x = PS[0]; s.y = PS[1];
                this.addChild(s);
                this.layer[k] = s;
            }
            this.marker = this.makeMarker();
            this.addChild(this.marker);
            this.tabs = new Sprite(new Bitmap(Graphics.width, PS[1] + 2));
            this.addChild(this.tabs);
            this.panel = new Sprite(new Bitmap(PP[2], PP[3]));
            this.panel.x = PP[0]; this.panel.y = PP[1];
            this.addChild(this.panel);
            this.hints = new Sprite(new Bitmap(Graphics.width, 34));
            this.hints.y = PS[1] + PS[3] + 4;
            this.addChild(this.hints);
        }
        start() {
            super.start();
            PLAN.scene = this;
            this.here = $gameMap && $gamePlayer ? planFloorOf($gameMap.mapId()) : -1;
            this.heroAt = this.here >= 0 ? [$gamePlayer._realX, $gamePlayer._realY] : null;
            this.floor = this.opts.floor !== undefined ? clamp(Math.floor(this.opts.floor), 0, PLAN_DATA.floors.length - 1) : Math.max(0, this.here);
            this.focus = "rooms";
            this.target = null;          // the way: { floor, key }
            this.picked = {};            // floor -> the last item chosen there
            this.t = 0;
            this.fadeT = 99;
            this.showFloor(this.floor, true);
            this.drawHints();
            this.startFadeIn(this.fadeSpeed(), false);
            se("Book1", 55, 95);
        }
        terminate() {
            super.terminate();
            if (PLAN.scene === this) PLAN.scene = null;
            Input.clear();
            TouchInput.clear();
        }
        // ---- the floor, the selection
        showFloor(fi, first) {
            if (!first && fi !== this.floor) {
                this.sheetOld.bitmap = this.pics[this.floor];
                this.sheetOld.opacity = 255;
                this.fadeT = 0;
                se("Book2", 45, 110);
            }
            this.floor = fi;
            this.sheet.bitmap = this.pics[fi];
            const items = planItems(fi);
            let it = this.picked[fi] ? planItem(fi, this.picked[fi]) : null;
            if (!it && fi === this.here && this.heroAt) it = itemOfRoom(fi, planRoomAt(fi, this.heroAt[0], this.heroAt[1]));
            if (!it && this.target && this.target.floor === fi) it = planItem(fi, this.target.key);
            if (!it) {   // where the stairs bring him, else the middle of the floor
                const f = PLAN_DATA.floors[fi], from = this.here >= 0 && f.arrive ? f.arrive[String(PLAN_DATA.floors[this.here].map)] : null;
                it = from ? itemOfRoom(fi, planRoomAt(fi, from[0], from[1])) : items[0];
            }
            this.select(it, true);
            this.drawIcons();
            this.drawWay();
            this.drawTabs();
            this.placeMarker();
        }
        select(it, quiet) {
            if (!it) return;
            if (!quiet && this.sel && this.sel.key === it.key) return;
            this.sel = it;
            this.picked[this.floor] = it.key;
            if (!quiet) se("Cursor1", 45, 105);
            this.drawHighlight();
            this.drawPanel();
        }
        // ---- input
        update() {
            super.update();
            this.t++;
            if (this._leaving) {
                if (!this.isFading() && !this._popped) { this._popped = true; SceneManager.pop(); }
            } else if (!this.isFading()) this.updateInput();
            this.animate();
        }
        updateInput() {
            if (Input.isTriggered("pageup")) return this.changeFloor(-1, true);
            if (Input.isTriggered("pagedown")) return this.changeFloor(1, true);
            if (Input.isTriggered("cancel") || TouchInput.isCancelled()) return this.close();
            if (Input.isTriggered("ok")) return this.ok();
            for (const [k, d] of [["up", 8], ["down", 2], ["left", 4], ["right", 6]]) if (Input.isRepeated(k)) return this.move(d);
            this.updateMouse();
        }
        updateMouse() {
            const mx = TouchInput.x, my = TouchInput.y;
            if (TouchInput.isTriggered()) {
                const tab = this.tabAt(mx, my);
                if (tab >= 0) { this.focus = "rooms"; if (tab !== this.floor) this.showFloor(tab); else this.drawTabs(); return; }
            }
            if (!(TouchInput.isHovered() || TouchInput.isTriggered())) return;
            const f = PLAN_DATA.floors[this.floor];
            const cx = (mx - PS[0] - f.ox) / f.s, cy = (my - PS[1] - f.oy) / f.s;
            if (cx < 0 || cy < 0 || cx >= f.w || cy >= f.h) return;
            const r = f.rooms.find(q => inRects(q.r, Math.floor(cx), Math.floor(cy)));
            if (!r) return;
            if (this.focus !== "rooms") { this.focus = "rooms"; this.drawTabs(); }
            this.select(itemOfRoom(this.floor, r));
            if (TouchInput.isTriggered()) this.ok();
        }
        tabAt(x, y) {
            for (let i = 0; i < PLAN_DATA.floors.length; i++) { const b = this.tabBox(i); if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) return i; }
            return -1;
        }
        changeFloor(d, sound) {
            const n = PLAN_DATA.floors.length, fi = clamp(this.floor + d, 0, n - 1);
            if (fi === this.floor) { if (sound) SoundManager.playBuzzer(); return; }
            this.showFloor(fi);
        }
        move(d) {
            if (this.focus === "tabs") {
                if (d === 4) this.changeFloor(-1, true);
                else if (d === 6) this.changeFloor(1, true);
                else if (d === 2) { this.focus = "rooms"; this.drawTabs(); se("Cursor1", 45, 100); }
                return;
            }
            const next = this.neighbour(this.sel, d);
            if (next) this.select(next);
            else if (d === 8) { this.focus = "tabs"; this.drawTabs(); se("Cursor1", 45, 115); }
        }
        // the nearest item that way: along the arrow counts once, sideways twice and a half
        neighbour(it, d) {
            const v = { 2: [0, 1], 8: [0, -1], 4: [-1, 0], 6: [1, 0] }[d];
            let best = null;
            for (const o of planItems(this.floor)) {
                if (o === it) continue;
                const dx = o.cx - it.cx, dy = o.cy - it.cy, along = dx * v[0] + dy * v[1], side = Math.abs(dx * v[1] - dy * v[0]);
                if (along < 0.6 || side > along * 2.2 + 6) continue;
                const score = along + side * 2.5;
                if (!best || score < best.score) best = { o, score };
            }
            return best ? best.o : null;
        }
        ok() {
            if (this.focus === "tabs") { this.focus = "rooms"; this.drawTabs(); se("Decision1", 50); return; }
            const it = this.sel;
            if (!it) return;
            if (this.target && this.target.floor === this.floor && this.target.key === it.key) { this.target = null; se("Cancel1", 50); }
            else { this.target = { floor: this.floor, key: it.key }; se("Decision2", 55, 105); }
            this.drawWay();
            this.drawPanel();
        }
        close() {
            this._leaving = true;
            se("Book1", 45, 80);
            this.startFadeOut(this.fadeSpeed(), false);
        }
        // ---- drawing
        drawIcons() {
            const b = this.layer.icons.bitmap, ctx = b.context, f = PLAN_DATA.floors[this.floor];
            b.clear();
            this.iconState = [];
            for (const ic of f.icons) {
                const [kind, x, y, room, extra] = ic, lit = iconLit(ic);
                let badge = null;
                if (kind === "room") { const st = rentState(extra && extra.room); badge = st && st.ok ? "key" : "lock"; }
                const px = f.ox + (x + 0.5) * f.s, py = f.oy + (y + 0.5) * f.s;
                planMedallion(ctx, kind, px, py, lit, badge);
                this.iconState.push({ kind, room, lit, x: px + PS[0], y: py + PS[1], badge });
            }
            dirty(b);
        }
        drawHighlight() {
            const b = this.layer.hi.bitmap, ctx = b.context, f = PLAN_DATA.floors[this.floor], it = this.sel;
            b.clear();
            if (!it) return;
            ctx.save();
            ctx.fillStyle = "rgba(255,226,140,0.30)";
            for (const r of it.rooms) for (const q of r.r) ctx.fillRect(f.ox + q[0] * f.s, f.oy + q[1] * f.s, (q[2] - q[0] + 1) * f.s, (q[3] - q[1] + 1) * f.s);
            ctx.lineCap = "round";
            for (const [w, col] of [[5, "rgba(255,236,170,0.55)"], [2.2, "#a3261a"]]) {
                ctx.lineWidth = w; ctx.strokeStyle = col;
                ctx.beginPath();
                for (const r of it.rooms) for (const e of r.e) { ctx.moveTo(f.ox + e[0] * f.s, f.oy + e[1] * f.s); ctx.lineTo(f.ox + e[2] * f.s, f.oy + e[3] * f.s); }
                ctx.stroke();
            }
            ctx.restore();
            dirty(b);
        }
        drawWay() {
            const b = this.layer.way.bitmap, ctx = b.context, f = PLAN_DATA.floors[this.floor];
            b.clear();
            this.wayPath = planWay(this.floor, this.target, this.here, this.heroAt);
            if (!this.wayPath || this.wayPath.length < 2) return;
            ctx.save();
            const pts = this.wayPath.map(([x, y]) => [f.ox + (x + 0.5) * f.s, f.oy + (y + 0.5) * f.s]);
            const step = Math.max(5, f.s * 0.9);
            let acc = step;
            for (let i = 1; i < pts.length; i++) {
                const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], len = Math.hypot(x1 - x0, y1 - y0);
                for (let t = acc; t <= len; t += step) {
                    const x = x0 + (x1 - x0) * t / len, y = y0 + (y1 - y0) * t / len;
                    ctx.fillStyle = "rgba(255,244,214,0.9)"; ctx.beginPath(); ctx.arc(x, y, 2.9, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = "#b3261a"; ctx.beginPath(); ctx.arc(x, y, 1.9, 0, Math.PI * 2); ctx.fill();
                }
                acc = step - ((len - acc) % step);
                if (acc > step) acc -= step;
            }
            const [ex, ey] = pts[pts.length - 1];   // the end: a small cross in a ring
            ctx.lineWidth = 2; ctx.strokeStyle = "#b3261a";
            ctx.beginPath(); ctx.arc(ex, ey, 5.5, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(ex - 3, ey - 3); ctx.lineTo(ex + 3, ey + 3); ctx.moveTo(ex + 3, ey - 3); ctx.lineTo(ex - 3, ey + 3); ctx.stroke();
            ctx.restore();
            dirty(b);
        }
        // "Tu jesteś": a red dot with a spreading ring, its words on a small pale ribbon beside it
        makeMarker() {
            const m = new Sprite(), ring = new Sprite(new Bitmap(48, 48)), dot = new Sprite(new Bitmap(24, 24)), tag = new Sprite();
            let c = ring.bitmap.context;
            c.lineWidth = 2.6; c.strokeStyle = "rgba(200,40,24,1)"; c.beginPath(); c.arc(24, 24, 20, 0, Math.PI * 2); c.stroke();
            dirty(ring.bitmap);
            ring.anchor.set(0.5, 0.5);
            c = dot.bitmap.context;
            c.fillStyle = "rgba(0,0,0,0.25)"; c.beginPath(); c.ellipse(13.5, 14.5, 7, 4, 0, 0, Math.PI * 2); c.fill();
            c.fillStyle = "#fff4dc"; c.beginPath(); c.arc(12, 12, 7.4, 0, Math.PI * 2); c.fill();
            c.fillStyle = "#c8281a"; c.beginPath(); c.arc(12, 12, 5.4, 0, Math.PI * 2); c.fill();
            c.fillStyle = "#ffd9c8"; c.beginPath(); c.arc(10.4, 10.2, 1.6, 0, Math.PI * 2); c.fill();
            dirty(dot.bitmap);
            dot.anchor.set(0.5, 0.5);
            const probe = new Bitmap(8, 8).context;
            probe.font = PF.handB(18);
            const w = Math.ceil(probe.measureText("Tu jesteś").width) + 14, h = 21;
            tag.bitmap = new Bitmap(w + 2, h + 2);
            c = tag.bitmap.context;
            c.fillStyle = "rgba(252,243,220,0.94)"; c.strokeStyle = "rgba(142,36,23,0.95)"; c.lineWidth = 1.2;
            c.beginPath(); c.rect(1, 1, w, h); c.fill(); c.stroke();
            c.font = PF.handB(18); c.textAlign = "center"; c.textBaseline = "alphabetic"; c.fillStyle = "#8e2417";
            c.fillText("Tu jesteś", 1 + w / 2, 17);
            dirty(tag.bitmap);
            tag.anchor.set(0.5, 0.5);
            m.addChild(ring); m.addChild(tag); m.addChild(dot);
            m.ring = ring; m.dot = dot; m.tag = tag; m.tagW = w + 2; m.tagH = h + 2;
            return m;
        }
        // the ribbon goes where it covers the fewest names and icons: above, below, right or left of the dot
        placeMarker() {
            const on = this.floor === this.here && !!this.heroAt;
            this.marker.visible = on;
            if (!on) return;
            const f = PLAN_DATA.floors[this.floor], p = planPoint(this.floor, this.heroAt[0], this.heroAt[1]), m = this.marker;
            m.x = Math.round(p.x); m.y = Math.round(p.y);
            const boxes = [];
            for (const r of f.rooms) {
                if (!r.l || r.t === "stairs") continue;
                const q = planPoint(this.floor, r.l[0] - 0.5, r.l[1] - 0.5), wide = Math.min(r.n.length * 7.5, 90);
                boxes.push([q.x - wide / 2, q.y - 12, q.x + wide / 2, q.y + 12]);
            }
            for (const ic of this.iconState || []) boxes.push([ic.x - 12, ic.y - 12, ic.x + 12, ic.y + 12]);
            for (const c of (f.exits && f.exits["8"]) || []) {   // the word "Wejście" under the front door
                const q = planPoint(this.floor, c[0], c[1] + 1);
                boxes.push([q.x - 8, q.y - 4, q.x + 70, q.y + 16]);
            }
            const tw = m.tagW, th = m.tagH, gap = 17;
            const sides = [[0, -gap - th / 2 + 4], [0, gap + th / 2 - 4], [gap + tw / 2 - 6, 0], [-gap - tw / 2 + 6, 0]];
            let best = null;
            sides.forEach(([dx, dy], i) => {
                const x0 = m.x + dx - tw / 2, y0 = m.y + dy - th / 2, x1 = x0 + tw, y1 = y0 + th;
                let over = 0;
                for (const b of boxes) over += Math.max(0, Math.min(x1, b[2]) - Math.max(x0, b[0])) * Math.max(0, Math.min(y1, b[3]) - Math.max(y0, b[1]));
                const out = x0 < PS[0] + 6 || x1 > PS[0] + PS[2] - 6 || y0 < PS[1] + 6 || y1 > PS[1] + PS[3] - 6 ? 1e6 : 0;
                const score = over + out + i * 40;
                if (!best || score < best.score) best = { score, dx, dy };
            });
            m.tag.x = best.dx; m.tag.y = best.dy;
            this.markerAt = p;
        }
        animate() {
            let k = 1;
            if (this.fadeT < 12) {   // the floors cross-fade, the new sheet slides in a little
                this.fadeT++;
                k = ease(this.fadeT / 12);
                this.sheetOld.opacity = Math.round(255 * (1 - k));
                for (const s of [this.sheet, this.layer.hi, this.layer.way, this.layer.icons]) { s.opacity = Math.round(255 * k); s.x = PS[0] + Math.round((1 - k) * 14); }
            } else if (this.sheetOld.opacity) {
                this.sheetOld.opacity = 0;
                for (const s of [this.sheet, this.layer.hi, this.layer.way, this.layer.icons]) { s.opacity = 255; s.x = PS[0]; }
            }
            this.layer.hi.opacity = Math.round(k * (205 + 50 * Math.sin(this.t / 16)));   // the chosen room breathes softly
            if (this.marker.visible) {   // "Tu jesteś": the ring spreads and fades, the dot beats
                const k = (this.t % 60) / 60;
                this.marker.ring.scale.set(0.3 + k * 0.9);
                this.marker.ring.opacity = Math.round(255 * (1 - k));
                this.marker.dot.scale.set(1 + 0.08 * Math.sin(this.t / 5));
            }
        }
        tabBox(i) {
            const w = 196, gap = 8;
            return { x: PS[0] + 22 + i * (w + gap), y: 8, w, h: PS[1] - 8 + 2 };
        }
        drawTabs() {
            const b = this.tabs.bitmap, ctx = b.context;
            b.clear();
            for (let i = 0; i < PLAN_DATA.floors.length; i++) {
                const t = this.tabBox(i), on = i === this.floor, y0 = on ? t.y : t.y + 5;
                ctx.save();
                // a parchment tab with a rounded top; the chosen one lighter and joined to the sheet
                ctx.fillStyle = on ? "#eadbb6" : "#a88e66";
                ctx.strokeStyle = on ? "rgba(70,48,28,0.9)" : "rgba(40,28,18,0.9)";
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.moveTo(t.x, t.y + t.h); ctx.lineTo(t.x + 4, y0 + 10); ctx.quadraticCurveTo(t.x + 6, y0, t.x + 18, y0);
                ctx.lineTo(t.x + t.w - 18, y0); ctx.quadraticCurveTo(t.x + t.w - 6, y0, t.x + t.w - 4, y0 + 10); ctx.lineTo(t.x + t.w, t.y + t.h);
                ctx.closePath(); ctx.fill(); ctx.stroke();
                if (on && this.focus === "tabs") {   // the tabs have the keys: a gold edge
                    ctx.strokeStyle = "#ffd23f"; ctx.lineWidth = 2.4;
                    ctx.beginPath(); ctx.moveTo(t.x + 6, t.y + t.h - 2); ctx.lineTo(t.x + 6, y0 + 10); ctx.quadraticCurveTo(t.x + 8, y0 + 2, t.x + 18, y0 + 2);
                    ctx.lineTo(t.x + t.w - 18, y0 + 2); ctx.quadraticCurveTo(t.x + t.w - 8, y0 + 2, t.x + t.w - 6, y0 + 10); ctx.lineTo(t.x + t.w - 6, t.y + t.h - 2); ctx.stroke();
                }
                const label = FLOOR_TAB[i].toUpperCase();
                ctx.font = PF.caps(16);
                const lw = ctx.measureText(label).width;
                const here = i === this.here;
                const lx = t.x + t.w / 2 - lw / 2 + (here ? 8 : 0);
                inkLine(ctx, label, lx, y0 + 24, PF.caps(16), on ? INKC.ink : "rgba(44,28,16,0.8)");
                if (here) {   // his floor: the red dot of "Tu jesteś"
                    ctx.fillStyle = "#c8281a"; ctx.beginPath(); ctx.arc(lx - 11, y0 + 18.5, 4.2, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = "#fff4dc"; ctx.lineWidth = 1.2; ctx.stroke();
                }
                ctx.restore();
            }
            dirty(b);
        }
        drawHints() {
            const b = this.hints.bitmap, S0 = U();
            b.clear();
            ui.keyHints(b, [["↑↓←→", "pokój"], ["Q/E", "piętro"], ["O", "pokaż drogę"], ["P", "wyjdź"]], PS[0] + 4, 5, 24, 17);
            ui.text(b, (hasClock() ? "Dzień " + day() + " · " : "") + "godz. " + clockText(), PP[0], 5, PP[2] - 6, { size: 17, color: S0.muted, align: "right", lh: Math.round(17 * 1.4) });
            dirty(b);
        }
        drawPanel() {
            const b = this.panel.bitmap, ctx = b.context, it = this.sel, W0 = PP[2], pad = 26;
            b.clear();
            if (!it) return;
            const info = planInfo(it);
            ctx.save();
            let y = 38;
            // the kind: a swatch of the room's wash (a small diamond for the halls and stairs), the words in small capitals
            if (it.kind === "hall" || it.kind === "stairs") {
                ctx.fillStyle = INKC.soft; ctx.beginPath(); ctx.moveTo(pad + 6, y - 11); ctx.lineTo(pad + 11, y - 5.5); ctx.lineTo(pad + 6, y); ctx.lineTo(pad + 1, y - 5.5); ctx.fill();
            } else {
                ctx.fillStyle = KIND_TINT[it.kind] || "#e6d6b4"; ctx.fillRect(pad, y - 11, 12, 12);
                ctx.strokeStyle = "rgba(44,28,16,0.7)"; ctx.lineWidth = 1; ctx.strokeRect(pad + 0.5, y - 10.5, 11, 11);
            }
            spacedCaps(ctx, info.kicker.toUpperCase(), pad + 20, y, 13, INKC.soft, 1.2);
            y += 38;
            ctx.font = PF.handB(34);
            const tl = wrapCtx(ctx, info.title, W0 - pad * 2);
            for (const l of tl.slice(0, 2)) { inkLine(ctx, l, pad, y, PF.handB(tl.length > 1 ? 30 : 34), INKC.ink); y += tl.length > 1 ? 30 : 34; }
            y += 2;
            // open now or not
            if (info.status) {
                const col = info.status.tone === "open" ? INKC.green : info.status.tone === "closed" ? INKC.red : INKC.soft;
                ctx.fillStyle = col; ctx.beginPath(); ctx.arc(pad + 6, y - 6, 5, 0, Math.PI * 2); ctx.fill();
                ctx.font = PF.handB(20);
                const sl = wrapCtx(ctx, info.status.text, W0 - pad * 2 - 18);
                for (const l of sl.slice(0, 2)) { inkLine(ctx, l, pad + 18, y, PF.handB(20), col); y += 22; }
            }
            // a flourish
            y += 6;
            ctx.strokeStyle = "rgba(60,40,24,0.55)"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W0 / 2 - 8, y); ctx.moveTo(W0 / 2 + 8, y); ctx.lineTo(W0 - pad, y); ctx.stroke();
            ctx.fillStyle = "rgba(60,40,24,0.7)"; ctx.beginPath(); ctx.moveTo(W0 / 2, y - 3.5); ctx.lineTo(W0 / 2 + 3.5, y); ctx.lineTo(W0 / 2, y + 3.5); ctx.lineTo(W0 / 2 - 3.5, y); ctx.fill();
            y += 24;
            const legendTop = PP[3] - this.legendHeight() - 14;
            let full = false;   // (a line that would not fit whole is left out, and all after it: nothing is cut in half)
            for (const s of info.sections) {
                if (full || y > legendTop - 44) break;
                spacedCaps(ctx, s.head.toUpperCase(), pad, y, 13, INKC.red, 1.4);
                y += 22;
                for (const l of s.lines) {
                    const x = pad + (l.icon ? 24 : 0), col = l.tone === "good" ? INKC.green : l.tone === "bad" ? INKC.red : INKC.ink;
                    ctx.font = PF.hand(20);
                    const lines = wrapCtx(ctx, l.text, W0 - pad - x);
                    if (y + (lines.length - 1) * 21 > legendTop - 10) { full = true; break; }
                    if (l.icon) planGlyph(ctx, l.icon, pad, y - 15, 17, l.tone === "good" ? INKC.green : INKC.soft, "#efe3c4");
                    for (const ln of lines) { inkLine(ctx, ln, x, y, PF.hand(20), col); y += 21; }
                    y += 3;
                }
                y += 8;
            }
            // the way, when asked for
            if (this.target && y < legendTop - 20) {
                const tf = this.target.floor, same = tf === this.floor, tIt = planItem(tf, this.target.key);
                const txt = !this.wayPath && same ? "Droga: nie znalazłem przejścia." : same ? "Droga zaznaczona na planie" + (this.here !== tf ? " (od schodów)." : ".")
                    : "Droga do: " + (tIt ? tIt.name : "") + " (" + FLOOR_TAB[tf] + ") — Q/E, by iść dalej.";
                ctx.font = PF.handB(18);
                for (const ln of wrapCtx(ctx, txt, W0 - pad * 2)) { inkLine(ctx, ln, pad, y, PF.handB(18), "#9a2a1c"); y += 20; }
            }
            this.drawLegend(ctx, legendTop);
            ctx.restore();
            dirty(b);
            this.panelInfo = info;
        }
        legendKinds() {
            const f = PLAN_DATA.floors[this.floor], kinds = [];
            for (const ic of f.icons) if (!kinds.includes(ic[0])) kinds.push(ic[0]);
            return kinds;
        }
        // the legend: the icons of this floor in three columns ("Tu jesteś" first), a line on lit and dimmed
        legendHeight() { return 32 + Math.ceil((this.legendKinds().length + 1) / 3) * 23 + 24; }
        drawLegend(ctx, top) {
            const W0 = PP[2], pad = 26, kinds = this.legendKinds(), cols = 3;
            ctx.strokeStyle = "rgba(60,40,24,0.45)"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(pad, top); ctx.lineTo(W0 - pad, top); ctx.stroke();
            spacedCaps(ctx, "LEGENDA", pad, top + 22, 13, INKC.red, 1.4);
            const colW = (W0 - pad * 2) / cols;
            let i = 0;
            const cell = () => { const c = i % cols, r = Math.floor(i / cols); i++; return [pad + c * colW, top + 36 + r * 23]; };
            let [x, y] = cell();
            ctx.fillStyle = "#c8281a"; ctx.beginPath(); ctx.arc(x + 9, y + 1, 5, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = "#fff4dc"; ctx.lineWidth = 1.4; ctx.stroke();
            inkLine(ctx, "Tu jesteś", x + 22, y + 7, PF.hand(17), INKC.ink);
            for (const k of kinds) {
                [x, y] = cell();
                ctx.save(); ctx.translate(x + 9, y + 1); ctx.scale(0.74, 0.74); planMedallion(ctx, k, 0, 0, true, null); ctx.restore();
                inkLine(ctx, ICON_WORD[k] || k, x + 22, y + 7, PF.hand(17), INKC.ink);
            }
            const ly = top + 36 + Math.ceil(i / cols) * 23 + 2;
            inkLine(ctx, "Jasne — czynne teraz · przygaszone — zamknięte", pad, ly, PF.hand(16), INKC.soft);
        }
        // (tests) the scene's state
        state() {
            const it = this.sel;
            return { floor: this.floor, map: PLAN_DATA.floors[this.floor].map, focus: this.focus, sel: it ? it.key : null, selName: it ? it.name : null,
                here: this.here, marker: this.marker.visible ? { x: this.marker.x, y: this.marker.y } : null, target: this.target ? Object.assign({}, this.target) : null,
                way: this.wayPath ? this.wayPath.length : 0, icons: (this.iconState || []).map(o => Object.assign({}, o)), panel: this.panelInfo ? JSON.parse(JSON.stringify(this.panelInfo)) : null };
        }
    }
    window.Scene_TavernPlan = Scene_TavernPlan;
    function openPlan(opts) {
        if (SceneManager.isSceneChanging() || SceneManager._scene instanceof Scene_TavernPlan) return false;
        PLAN.pending = Object.assign({}, opts || {});
        if ($gameTemp && $gameTemp.clearDestination) $gameTemp.clearDestination();
        SceneManager.push(Scene_TavernPlan);
        return true;
    }

    // the P menu: "Plan karczmy" while he is on one of the tavern's floors (MenuPanel.addCommand; its little drawing: the plan's
    // 20 px map glyph in MenuPanel's 22 px box)
    const planOnMap = () => !!$gameMap && planFloorOf($gameMap.mapId()) >= 0;
    const planFromMenu = () => { PLAN.pending = {}; SceneManager.push(Scene_TavernPlan); };
    const MP = T.api("MenuPanel");
    if (MP && MP.addCommand) {
        MP.addCommand({ symbol: "tavernPlan", label: "Plan karczmy", owner: "TavernLife_Plan", when: planOnMap, ok: planFromMenu,
            glyph: (ctx, x, y, size, colour) => planGlyph(ctx, "map", x + 1, y + 1, size - 2, colour, "#000") });
    } else {   // (without MenuPanel.js: a plain command)
        const _Window_MenuCommand_addOriginalCommands = Window_MenuCommand.prototype.addOriginalCommands;
        Window_MenuCommand.prototype.addOriginalCommands = function() {
            _Window_MenuCommand_addOriginalCommands.call(this);
            if (planOnMap()) this.addCommand("Plan karczmy", "tavernPlan", true);
        };
        const _Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
        Scene_Menu.prototype.createCommandWindow = function() {
            _Scene_Menu_createCommandWindow.call(this);
            this._commandWindow.setHandler("tavernPlan", planFromMenu);
        };
    }

    lib.addKind("plan", () => { openPlan(); return null; });
    TL.plan = planApi;
    TL.modules.TavernLife_Plan = true;
})();
