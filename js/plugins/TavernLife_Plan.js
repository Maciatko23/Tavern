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
    const TK = Watki.teksty("plan_karczmy");   // (the words of this file: js/teksty/plan_karczmy.txt, kod.*)

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
    const PLAN_DATA = {"sheet":[16,46,836,636],"panel":[866,46,398,636],"floors":[{"map":1,"name":"Parter","title":"Parter","pic":"TavernPlan_0","w":49,"h":42,"s":12.2172,"ox":118.68,"oy":80.0,"rooms":[{"k":"sala","n":"Sala","t":"guest","g":"sala","r":[[1,11,27,31],[28,15,28,22]],"e":[[1,32,28,32],[1,11,28,11],[28,23,29,23],[28,15,29,15],[28,11,28,15],[28,23,28,32],[29,15,29,23],[1,11,1,32]],"c":[15.0,21.5],"l":[14.5,21.49]},{"k":"scena","n":"Scena","t":"guest","g":"scena","r":[[29,11,47,25]],"e":[[29,11,48,11],[29,26,48,26],[48,11,48,26],[29,11,29,26]],"c":[38.5,18.5],"l":[38.5,18.48]},{"k":"gry","n":"Pokój gier","t":"guest","g":"gry","r":[[29,27,47,40],[28,30,28,30]],"e":[[29,41,48,41],[28,30,29,30],[28,31,29,31],[29,27,48,27],[29,27,29,30],[29,31,29,41],[28,30,28,31],[48,27,48,41]],"c":[38.0,34.0],"l":[38.5,34.98]},{"k":"sien","n":"Sień","t":"hall","g":"sien","r":[[12,32,16,40],[5,33,11,40],[17,33,23,40],[4,37,4,40],[24,37,24,40],[1,40,3,40],[25,40,27,40]],"e":[[1,40,4,40],[25,40,28,40],[1,41,28,41],[12,32,17,32],[5,33,12,33],[17,33,24,33],[4,37,5,37],[24,37,25,37],[25,37,25,40],[5,33,5,37],[17,32,17,33],[12,32,12,33],[4,37,4,40],[1,40,1,41],[24,33,24,37],[28,40,28,41]],"c":[14.5,36.5],"l":[8.5,38.23]},{"k":"kuchnia","n":"Kuchnia","t":"service","g":"kuchnia","r":[[1,1,17,9],[18,6,18,9]],"e":[[1,10,19,10],[1,1,18,1],[18,6,19,6],[19,6,19,10],[18,1,18,6],[1,1,1,10]],"c":[10.0,5.5],"l":[9.5,5.48]},{"k":"piekarnia","n":"Piekarnia","t":"service","g":"piekarnia","r":[[19,1,27,9]],"e":[[19,10,28,10],[19,1,28,1],[28,1,28,10],[19,1,19,10]],"c":[23.5,5.5],"l":[23.5,5.48]},{"k":"skladzik","n":"Składzik","t":"private","g":"skladzik","r":[[29,1,47,9],[28,7,28,7]],"e":[[29,1,48,1],[29,10,48,10],[28,7,29,7],[28,8,29,8],[48,1,48,10],[29,1,29,7],[29,8,29,10],[28,7,28,8]],"c":[38.0,5.5],"l":[38.5,5.48]},{"k":"schody_zach","n":"Schody na piętro (zachodnie)","t":"stairs","g":"schody_zach","r":[[1,34,3,39]],"e":[[1,34,4,34],[1,40,4,40],[1,34,1,40],[4,34,4,40]],"c":[2.5,37.0],"l":[2.5,37.0],"to":25,"up":true},{"k":"schody_wsch","n":"Schody na piętro (wschodnie)","t":"stairs","g":"schody_wsch","r":[[25,34,27,39]],"e":[[25,40,28,40],[25,34,28,34],[25,34,25,40],[28,34,28,40]],"c":[26.5,37.0],"l":[26.5,37.0],"to":25,"up":true}],"icons":[["bar",16,15,"sala",null],["kitchen",9.09,6.52,"kuchnia",null],["board",7,35.4,"sien",null],["dice",36,31.4,"gry",null],["dice",42,31.4,"gry",null],["arm",44,33.0,"gry",null],["darts",31.5,33.8,"gry",null],["stage",38.0,15.5,"scena",null],["fire",21,35.7,"sien",null],["fire",4,13.7,"sala",null],["fire",24,13.7,"sala",null],["stairs",2.0,34.75,"schody_zach",{"to":25,"up":true}],["stairs",26.0,34.75,"schody_wsch",{"to":25,"up":true}]],"walk":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAD94AG4CAP7/zwN4//3/H/d3/vv/Je7v/B+GAxzH+ef///z//8///wEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfEPD5/z9ifzfy/3/++uvvr/7sBdD7//+J///j//9z93/3//9nxH/E9//NiP+Ix/+REf8R/zk//3f/9/9//v//b+fcBPAHEPwfCMAPIAAA8P//fwAAIIA/gAAAQAB/AAEAgP+7///5D///////fwDwAeCf5wDgA8AfhjnAB7j/v3MAB3D//+eA/+j+/8/9/9/99577/7/bxzj3/38X+39+5szvx/wAwAEAAAAA","exits":{"25":[[1,34],[2,34],[3,34],[25,34],[26,34],[27,34]]},"arrive":{"25":[26,35]}},{"map":25,"name":"Pokoje gości","title":"Piętro I · Pokoje gości","pic":"TavernPlan_1","w":49,"h":42,"s":12.8571,"ox":103.0,"oy":80.0,"rooms":[{"k":"r3","n":"Pokój 3","t":"guest","g":"r3","r":[[1,1,5,11],[4,12,5,14]],"e":[[4,13,6,13],[1,1,6,1],[1,12,4,12],[6,1,6,13],[4,12,4,13],[1,1,1,12]],"c":[3.5,7.0],"l":[3.5,8.04],"sub":"1-os."},{"k":"r1","n":"Pokój 1","t":"guest","g":"r1","r":[[7,1,11,11],[9,12,10,14]],"e":[[9,13,11,13],[7,12,9,12],[11,12,12,12],[7,1,12,1],[12,1,12,12],[11,12,11,13],[7,1,7,12],[9,12,9,13]],"c":[9.5,7.0],"l":[9.5,8.04],"sub":"1-os."},{"k":"r2","n":"Pokój 2","t":"guest","g":"r2","r":[[13,1,17,11],[15,12,15,14]],"e":[[13,1,18,1],[13,12,15,12],[16,12,18,12],[15,13,16,13],[18,1,18,12],[13,1,13,12],[15,12,15,13],[16,12,16,13]],"c":[15.5,7.0],"l":[15.5,8.04],"sub":"1-os."},{"k":"r4","n":"Pokój 4","t":"private","g":"r4","r":[[19,1,23,11],[22,12,22,14]],"e":[[19,12,22,12],[23,12,24,12],[19,1,24,1],[22,13,23,13],[24,1,24,12],[19,1,19,12],[22,12,22,13],[23,12,23,13]],"c":[21.5,7.0],"l":[21.5,8.04],"sub":"1-os."},{"k":"r5","n":"Pokój 5","t":"private","g":"r5","r":[[25,1,29,11],[27,12,27,14]],"e":[[25,1,30,1],[25,12,27,12],[28,12,30,12],[27,13,28,13],[25,1,25,12],[30,1,30,12],[27,12,27,13],[28,12,28,13]],"c":[27.5,7.0],"l":[27.5,8.04],"sub":"1-os."},{"k":"r12","n":"Pokój 12","t":"private","g":"r12","r":[[31,1,35,11],[34,12,34,14]],"e":[[31,12,34,12],[35,12,36,12],[31,1,36,1],[34,13,35,13],[31,1,31,12],[36,1,36,12],[34,12,34,13],[35,12,35,13]],"c":[33.5,7.0],"l":[33.5,8.04],"sub":"1-os."},{"k":"r8","n":"Pokój 8","t":"private","g":"r8","r":[[37,1,41,11],[39,12,39,47]],"e":[[39,13,40,13],[37,1,42,1],[37,12,39,12],[40,12,42,12],[39,12,39,13],[40,12,40,13],[37,1,37,12],[42,1,42,12]],"c":[39.5,7.0],"l":[39.5,8.04],"sub":"1-os."},{"k":"r11","n":"Pokój 11","t":"private","g":"r11","r":[[43,1,47,11],[46,12,46,47]],"e":[[43,1,48,1],[43,12,46,12],[47,12,48,12],[46,13,47,13],[48,1,48,12],[43,1,43,12],[46,12,46,13],[47,12,47,13]],"c":[45.5,7.0],"l":[45.5,8.04],"sub":"1-os."},{"k":"r6","n":"Pokój 6","t":"private","g":"r6","r":[[1,21,9,31]],"e":[[1,32,10,32],[1,21,10,21],[1,21,1,32],[10,21,10,32]],"c":[5.5,26.5],"l":[5.5,28.04],"sub":"2-os."},{"k":"r10","n":"Pokój Borgara","t":"service","g":"r10","r":[[19,21,27,31]],"e":[[19,21,28,21],[19,32,28,32],[28,21,28,32],[19,21,19,32]],"c":[23.5,26.5],"l":[23.5,28.04],"sub":"karczmarz"},{"k":"r9","n":"Izba służby","t":"service","g":"r9","r":[[43,21,47,31]],"e":[[43,32,48,32],[43,21,48,21],[43,21,43,32],[48,21,48,32]],"c":[45.5,26.5],"l":[45.5,26.93]},{"k":"bath","n":"Łaźnia gości","t":"guest","g":"bath","r":[[29,21,41,31]],"e":[[29,32,42,32],[29,21,42,21],[29,21,29,32],[42,21,42,32]],"c":[35.5,26.5],"l":[35.5,26.93]},{"k":"hall1","n":"Hall","t":"hall","g":"hall1","r":[[11,20,17,31],[12,32,15,35]],"e":[[11,20,18,20],[12,36,16,36],[11,32,12,32],[16,32,18,32],[18,20,18,32],[12,32,12,36],[11,20,11,32],[16,32,16,36]],"c":[14.5,28.0],"l":[14.5,25.94]},{"k":"nc","n":"Korytarz północny","t":"hall","g":"nc","r":[[1,16,47,19]],"e":[[1,13,48,13],[1,20,48,20],[48,13,48,20],[1,13,1,20]],"c":[24.5,16.5],"l":[24.5,16.43]},{"k":"sc","n":"Korytarz południowy","t":"hall","g":"sc","r":[[9,36,23,40],[33,36,47,40],[1,40,8,40],[24,40,32,40]],"e":[[1,41,48,41],[8,37,9,37],[32,37,33,37],[9,33,12,33],[16,33,24,33],[33,33,48,33],[1,40,8,40],[24,40,32,40],[12,36,16,36],[33,33,33,37],[32,37,32,40],[1,40,1,41],[24,33,24,40],[9,33,9,37],[8,37,8,40],[16,33,16,36],[48,33,48,41],[12,33,12,36]],"c":[24.5,37.0],"l":[40.5,36.94]},{"k":"schody_zach","n":"Schody w dół (zachodnie)","t":"stairs","g":"schody_zach","r":[[1,34,3,39]],"e":[[1,34,4,34],[1,40,4,40],[1,34,1,40],[4,34,4,40]],"c":[2.5,37.0],"l":[2.5,37.0],"to":1,"up":false},{"k":"schody_zach","n":"Schody na górę (zachodnie)","t":"stairs","g":"schody_zach","r":[[5,34,7,39]],"e":[[5,40,8,40],[5,34,8,34],[5,34,5,40],[8,34,8,40]],"c":[6.5,37.0],"l":[6.5,37.0],"to":26,"up":true},{"k":"schody_zach","n":"Schody w dół (zachodnie)","t":"stairs","g":"schody_zach","r":[[25,34,27,39]],"e":[[25,40,28,40],[25,34,28,34],[25,34,25,40],[28,34,28,40]],"c":[26.5,37.0],"l":[26.5,37.0],"to":1,"up":false},{"k":"schody_zach","n":"Schody na górę (zachodnie)","t":"stairs","g":"schody_zach","r":[[29,34,31,39]],"e":[[29,34,32,34],[29,40,32,40],[32,34,32,40],[29,34,29,40]],"c":[30.5,37.0],"l":[30.5,37.0],"to":26,"up":true}],"icons":[["bath",35.0,27.5,"bath",null],["room",3,4,"r3",{"room":"3","minrep":0}],["room",9,4,"r1",{"room":"1","minrep":0}],["room",14,4,"r2",{"room":"2","minrep":0}],["gate",5,37.2,"schody_zach",{"minrep":80}],["gate",29,37.2,"schody_zach",{"minrep":80}],["stairs",2.0,34.75,"schody_zach",{"to":1,"up":false}],["stairs",6.0,34.75,"schody_zach",{"to":26,"up":true}],["stairs",26.0,34.75,"schody_zach",{"to":1,"up":false}],["stairs",30.0,34.75,"schody_zach",{"to":26,"up":true}]],"walk":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEoiIBICwLRVR3Vtg2mrjuraFtz3cd/3fb7v+77v+3ze93nd9/m4ZnMy7/N9n/d9VAZjCIRACARCEAiBEAiEIBACIRAIQSAEQiD+///////4///////4///////z//////9HgD8BgACIAH8CAAEQAf4EAAIgAvwJAARAjvkbxLyBXPd33v83ue7vvP9v8t/ff//f57+/84akSX9/w/E/k7z+yvJ/Av/9/ff/fQDwAQAAAADgAwAAALjDB7gDAHCHD3AHAODu/+/u/8/N/9/N/4+7/7+7/x93/393/3/+//////8AAAAAAAAA","exits":{"1":[[25,34],[26,34],[27,34],[1,34],[2,34],[3,34]],"26":[[5,34],[6,34],[7,34],[29,34],[30,34],[31,34]]},"arrive":{"1":[26,35],"26":[6,35]}},{"map":26,"name":"Apartamenty","title":"Piętro II · Apartamenty","pic":"TavernPlan_2","w":49,"h":42,"s":12.8571,"ox":103.0,"oy":80.0,"rooms":[{"k":"lordb","n":"Apartament Lorda","t":"private","g":"lord","r":[[1,1,9,11],[3,12,3,14]],"e":[[1,1,10,1],[1,12,3,12],[4,12,10,12],[3,13,4,13],[10,1,10,12],[1,1,1,12],[3,12,3,13],[4,12,4,13]],"c":[5.5,7.0],"l":[5.5,9.45],"sub":"sypialnia"},{"k":"lorda","n":"Apartament Lorda","t":"private","g":"lord","r":[[11,1,19,11],[17,12,18,14]],"e":[[11,1,20,1],[17,13,19,13],[11,12,17,12],[19,12,20,12],[17,12,17,13],[20,1,20,12],[11,1,11,12],[19,12,19,13]],"c":[15.5,7.0],"l":[15.5,9.45],"sub":"salon"},{"k":"lib","n":"Biblioteka","t":"private","g":"lib","r":[[21,1,27,11],[26,12,26,14]],"e":[[21,1,28,1],[21,12,26,12],[27,12,28,12],[26,13,27,13],[28,1,28,12],[21,1,21,12],[26,12,26,13],[27,12,27,13]],"c":[24.5,7.0],"l":[24.5,7.93]},{"k":"s2a","n":"Apartament Błękitny","t":"private","g":"s2","r":[[29,1,37,11],[33,12,33,14]],"e":[[29,1,38,1],[29,12,33,12],[34,12,38,12],[33,13,34,13],[38,1,38,12],[29,1,29,12],[33,12,33,13],[34,12,34,13]],"c":[33.5,7.0],"l":[33.5,7.93]},{"k":"chamber","n":"Komnata z kominkiem","t":"guest","g":"chamber","r":[[39,1,47,11],[44,12,44,14]],"e":[[39,1,48,1],[39,12,44,12],[45,12,48,12],[44,13,45,13],[48,1,48,12],[39,1,39,12],[44,12,44,13],[45,12,45,13]],"c":[43.5,7.0],"l":[43.5,7.93]},{"k":"s3a","n":"Apartament Zielony","t":"private","g":"s3","r":[[1,21,9,31]],"e":[[1,32,10,32],[1,21,10,21],[1,21,1,32],[10,21,10,32]],"c":[5.5,26.5],"l":[5.5,27.94]},{"k":"s4a","n":"Apartament Złoty","t":"guest","g":"s4","r":[[19,21,26,31]],"e":[[19,21,27,21],[19,32,27,32],[27,21,27,32],[19,21,19,32]],"c":[23.0,26.5],"l":[23.0,27.45],"sub":"salonik"},{"k":"s4b","n":"Apartament Złoty","t":"guest","g":"s4","r":[[28,21,36,31]],"e":[[28,21,37,21],[28,32,37,32],[37,21,37,32],[28,21,28,32]],"c":[32.5,26.5],"l":[32.5,27.45],"sub":"sypialnia"},{"k":"salon","n":"Wielki salon","t":"private","g":"salon","r":[[38,21,47,31]],"e":[[38,32,48,32],[38,21,48,21],[38,21,38,32],[48,21,48,32]],"c":[43.0,26.5],"l":[43.0,27.94]},{"k":"terrace_b","n":"Balkon","t":"hall","g":"terrace","r":[[44,32,44,40],[34,33,43,40],[45,33,47,40]],"e":[[34,41,48,41],[34,33,44,33],[45,33,48,33],[44,32,45,32],[34,33,34,41],[48,33,48,41],[44,32,44,33],[45,32,45,33]],"c":[41.0,36.5],"l":[39.0,36.94]},{"k":"hall","n":"Hall","t":"hall","g":"hall","r":[[11,20,17,31],[12,32,16,40],[1,33,3,40],[9,33,11,40],[17,33,27,40],[4,37,4,40],[8,37,8,40],[28,37,28,40],[32,37,32,40],[5,40,7,40],[29,40,31,40]],"e":[[4,37,5,37],[8,37,9,37],[28,37,29,37],[32,37,33,37],[11,20,18,20],[1,33,4,33],[9,33,12,33],[17,33,28,33],[1,41,33,41],[5,40,8,40],[29,40,32,40],[11,32,12,32],[17,32,18,32],[32,37,32,40],[33,37,33,41],[1,33,1,41],[18,20,18,32],[11,20,11,32],[5,37,5,40],[9,33,9,37],[28,33,28,37],[8,37,8,40],[4,33,4,37],[29,37,29,40],[17,32,17,33],[12,32,12,33]],"c":[17.0,30.5],"l":[22.5,36.94]},{"k":"nc","n":"Galeria apartamentów","t":"hall","g":"nc","r":[[1,16,47,19]],"e":[[1,13,48,13],[1,20,48,20],[48,13,48,20],[1,13,1,20]],"c":[24.5,16.5],"l":[24.5,16.43]},{"k":"schody_zach","n":"Schody w dół (zachodnie)","t":"stairs","g":"schody_zach","r":[[5,34,7,39]],"e":[[5,40,8,40],[5,34,8,34],[5,34,5,40],[8,34,8,40]],"c":[6.5,37.0],"l":[6.5,37.0],"to":25,"up":false},{"k":"schody_wsch","n":"Schody w dół (wschodnie)","t":"stairs","g":"schody_wsch","r":[[29,34,31,39]],"e":[[29,34,32,34],[29,40,32,40],[32,34,32,40],[29,34,29,40]],"c":[30.5,37.0],"l":[30.5,37.0],"to":25,"up":false}],"icons":[["room",32,24,"s4b",{"room":"zloty","minrep":80}],["room",44,4,"chamber",{"room":"komnata","minrep":60}],["fire",4,23.7,"s3a",null],["fire",22,23.7,"s4a",null],["fire",17,3.7,"lorda",null],["fire",42,23.7,"salon",null],["fire",42,3.7,"chamber",null],["stairs",6.0,34.75,"schody_zach",{"to":25,"up":false}],["stairs",30.0,34.75,"schody_wsch",{"to":25,"up":false}]],"walk":"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwDDe/gghyHP/+T33mf8eO3PmM/49dvbffn77r+e//3z+X8dz/+m/v7vD9PPff3/+/IcAYEAgAAEBQIBAAAICgACBAAQEAAECAQj+///////4///////4///////z//////9HgD9AAAiBAH+AABACAf4AASAEAvwBAkAIzvorR4h4/Pf377n3Oe/vnzNrMtrf///so7+////9T19//57Lkf7+/h32J/79+fPnfwDwAQAAEADgAwD4/4HDB4Dz+gOHDwDn/Obu///O/8/d//+d/5+7//87/z93//93uk/+/8//AQAAAAAAAAAA","exits":{"25":[[5,34],[6,34],[7,34],[29,34],[30,34],[31,34]]},"arrive":{"25":[6,35]}}]};
    // </plan-data>
    const PLAN_EVENT = 950;   // the easels' event id on the three maps (the builders' ids end far below)
    const PLAN_BOARDS = {     // map -> the easel: the map's size (an edited map gets none), its cells, its picture
        1: { x: 9, y: 49, w: 63, h: 55, sheet: "!$Tavern_Plan", dir: 2, note: "<Occupy:right=1>", cells: [[9, 49], [10, 49]] },   // (right beside the quest board)
        25: { x: 9, y: 36, w: 49, h: 42, sheet: "!$Tavern_Plan_Small", dir: 2, note: "", cells: [[9, 36]] },
        26: { x: 9, y: 36, w: 49, h: 42, sheet: "!$Tavern_Plan_Small", dir: 2, note: "", cells: [[9, 36]] }
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
    const KIND_WORD = { };
    Watki.scal(KIND_WORD, "plan_karczmy", "rodzaje");   // (its words: js/teksty/plan_karczmy.txt, rodzaje)
    const KIND_TINT = { guest: "#e7b467", service: "#a9bd8e", private: "#d49b97", hall: "#e6d6b4", stairs: "#d8c6a2" };
    const FLOOR_TAB = [];
    Watki.scal(FLOOR_TAB, "plan_karczmy", "pietra");   // (its words: js/teksty/plan_karczmy.txt, pietra)

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
        const say = k => { const o = D.OPPONENTS[k]; return o.short + " " + o.hours[0] + "–" + o.hours[1] + (o.minRep && QB() ? Watki.wstaw(TK.kod.say[1], { minRep: o.minRep, "2": o.rare ? TK.kod.say[0] : "" }) : o.rare ? TK.kod.say[2] : ""); };
        const regular = ["ozzy", "bartek", "grum"].filter(k => D.OPPONENTS[k]), fame = ["kupiec", "nieznajomy"].filter(k => D.OPPONENTS[k] && (QB() || !D.OPPONENTS[k].needsRep));
        const out = [];
        if (regular.length) out.push({ text: Watki.wstaw(TK.kod.diceRivals[0], { "1": regular.map(say).join(" · ") }), on: regular.some(k => now.has(k)) });
        if (fame.length) out.push({ text: Watki.wstaw(TK.kod.diceRivals[1], { "1": fame.map(say).join(" · ") }), on: fame.some(k => now.has(k)) });
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
    const ICON_WORD = { };
    Watki.scal(ICON_WORD, "plan_karczmy", "ikony");   // (its words: js/teksty/plan_karczmy.txt, ikony)

    // what the panel says about a room: { kicker, title, status: { tone, text }, sections: [{ head, lines: [{ icon, text, tone }] }] }
    const L_ = (icon, text, tone) => ({ icon, text, tone });
    function planInfo(it) {
        const f = PLAN_DATA.floors[it.floor], key = f.map + ":" + it.key, r0 = it.rooms[0];
        const out = { kicker: (KIND_WORD[it.kind] || "") + " · " + FLOOR_TAB[it.floor], title: it.name, status: null, sections: [] };
        const what = [], who = [], price = [];
        const sec = () => {
            if (what.length) out.sections.push({ head: TK.kod.sec[0], lines: what });
            if (who.length) out.sections.push({ head: TK.kod.sec[1], lines: who });
            if (price.length) out.sections.push({ head: "Ceny", lines: price });
            return out;
        };
        const open = (text) => { out.status = { tone: "open", text }; };
        const shut = (text) => { out.status = { tone: "closed", text }; };
        const info = (text) => { out.status = { tone: "info", text }; };
        const d = (PLAN_DESC[f.map] || {})[it.key];
        if (d) what.push(L_(null, d));
        const h = hour();
        switch (key) {
            case "1:sala": {
                who.push(L_("bar", TK.kod.planInfo[0]));
                if (hasStory()) { const [a, b] = storyShift(); who.push(L_("bar", Watki.wstaw(TK.kod.planInfo[1], { "1": hhmm(a), "2": hhmm(b) }), between(h, a, b) ? "good" : null)); }
                const dd = dishOfDay(), prices = DISHES.map(x => priceOf(x));
                price.push(L_("kitchen", Watki.wstaw(TK.kod.planInfo[2], { "1": Math.min(...prices), "2": Math.max(...prices) })));
                price.push(L_("kitchen", Watki.wstaw(TK.kod.planInfo[3], { name: dd.name, "2": priceOf(dd), "3": Math.round(DAY_DISCOUNT * 100) }), "good"));
                const rs = rooms().filter(x => !x.minrep);
                if (rs.length) price.push(L_("room", Watki.wstaw(TK.kod.planInfo[4], { "1": Math.min(...rs.map(x => roomPrice(x))) })));
                if (repDiscount() > 0) price.push(L_(null, Watki.wstaw(TK.kod.planInfo[5], { "1": pct(repDiscount()) }), "good"));
                open(TK.kod.planInfo[6]);
                break;
            }
            case "1:kuchnia":
                who.push(L_("kitchen", TK.kod.planInfo[7]));
                price.push(L_("bar", TK.kod.planInfo[8]));
                open(TK.kod.planInfo[9]);
                break;
            case "1:scena": {
                const m = Watki.wstaw(TK.kod.planInfo[10], { "1": hhmm(SONG_FROM) });
                who.push(L_("stage", m, songOpen() ? "good" : null));
                price.push(L_(null, Watki.wstaw(TK.kod.planInfo[11], { SONG_TIP: SONG_TIP })));
                price.push(L_(null, Watki.wstaw(TK.kod.planInfo[12], { "1": Math.round(INSPIRED_XP * 100), "2": hoursText(INSPIRED_HOURS) })));
                if (songOpen()) open(TK.kod.planInfo[13]);
                else if (inSongHours()) shut(Watki.wstaw(TK.kod.planInfo[14], { "1": hhmm(SONG_FROM) }));
                else shut(Watki.wstaw(TK.kod.planInfo[15], { "1": hhmm(SONG_FROM) }));
                break;
            }
            case "1:gry": {
                who.push(L_("arm", TK.kod.planInfo[16]));
                who.push(L_("darts", TK.kod.planInfo[22]));   // (2026-11-16: the darts are in the games room now)
                price.push(L_("darts", Watki.wstaw(TK.kod.planInfo[23], { "1": DARTS_STAKES.join(" / ") })));
                for (const l of diceRivals()) who.push(L_("dice", l.text, l.on ? "good" : null));
                price.push(L_("arm", Watki.wstaw(TK.kod.planInfo[17], { "1": ARM_STAKES.join(" / ") })));
                if (TD()) price.push(L_("dice", Watki.wstaw(TK.kod.planInfo[18], { "1": Math.min(...Object.values(TD().OPPONENTS).map(o => o.stakes[0])) })));
                const dn = diceNow();
                if (dn && dn.length) open(Watki.wstaw(TK.kod.planInfo[19], { "1": dn.map(p => p.name).join(", ") }));
                else if (TD()) open(Watki.wstaw(TK.kod.planInfo[20], { "1": hhmm(10) }));
                else open(TK.kod.planInfo[21]);
                break;
            }
            case "1:rzutki":
                who.push(L_("darts", TK.kod.planInfo[22]));
                price.push(L_("darts", Watki.wstaw(TK.kod.planInfo[23], { "1": DARTS_STAKES.join(" / ") })));
                open(TK.kod.planInfo[24]);
                break;
            case "25:bath":
                who.push(L_("bath", TK.kod.planInfo[25]));
                price.push(L_("bath", Watki.wstaw(TK.kod.planInfo[27], { "1": bathPrice(), "2": bathPrice() < BATH_PRICE ? Watki.wstaw(TK.kod.planInfo[26], { BATH_PRICE: BATH_PRICE }) : "" })));
                price.push(L_(null, Watki.wstaw(TK.kod.planInfo[28], { "1": Math.round(CLEAN_COST * 100), "2": hoursText(CLEAN_HOURS) })));
                open(TK.kod.planInfo[29]);
                break;
            case "1:mysliwski":
                who.push(L_("fire", TK.kod.planInfo[30]));
                break;
            case "1:jadalnia":
                who.push(L_("bar", TK.kod.planInfo[31]));
                break;
            case "1:sien": {
                const Q = QB();
                who.push(L_("board", Q ? Watki.wstaw(TK.kod.planInfo[32], { "1": Q.REFRESH_DAYS || 3 }) : TK.kod.planInfo[33]));
                if (Q) {
                    const b = Q.board ? Q.board().filter(n => n && !n.taken && !n.done).length : 0;
                    if (b) who.push(L_("board", Watki.wstaw(TK.kod.planInfo[37], { b: b, "2": b === 1 ? TK.kod.planInfo[34] : b < 5 ? TK.kod.planInfo[35] : TK.kod.planInfo[36] }), "good"));
                    price.push(L_(null, Watki.wstaw(TK.kod.planInfo[38], { "1": tierName(repTier()), "2": reputation() })));
                }
                who.push(L_("stairs", TK.kod.planInfo[39]));
                open(TK.kod.planInfo[40]);
                break;
            }
            case "25:chamber": case "26:s4": case "25:r1": case "25:r2": case "25:r3": {
                const id = { "25:chamber": "komnata", "26:s4": "zloty" }[key] || key.slice(4);
                const st = rentState(id);
                if (!st) { info(TK.kod.planInfo[41]); break; }
                what.unshift(L_(null, st.r.desc));
                price.push(L_("room", Watki.wstaw(TK.kod.planInfo[43], { price: st.price, "2": st.price !== st.r.price ? Watki.wstaw(TK.kod.planInfo[42], { price: st.r.price }) : "", CHECKOUT: CHECKOUT })));
                price.push(L_(null, Watki.wstaw(TK.kod.planInfo[45], { "1": giftName(st.r.room), "2": RESTED[st.r.room] ? Watki.wstaw(TK.kod.planInfo[44], { "1": hoursText(RESTED[st.r.room]) }) : "" })));
                // (the tavern's fame is QuestBoard.js's: without it no word of fame, the room stays shut)
                if (st.need && QB()) price.push(L_("gate", Watki.wstaw(TK.kod.planInfo[46], { "1": tierName(repTierOf(st.need)), need: st.need }), st.ok ? "good" : "bad"));
                who.push(L_("bar", TK.kod.planInfo[47]));
                if (st.mine) open(Watki.wstaw(TK.kod.planInfo[48], { CHECKOUT: CHECKOUT }));
                else if (!st.ok) shut(QB() ? Watki.wstaw(TK.kod.planInfo[49], { need: st.need }) : TK.kod.planInfo[50]);
                else if (st.taken) info(TK.kod.planInfo[51]);
                else open(TK.kod.planInfo[52]);
                break;
            }
            case "25:schody_gora": {
                const g = (f.icons.find(ic => ic[0] === "gate") || [])[4] || { minrep: 80 };
                const on = iconLit(["gate", 0, 0, "", g]);
                who.push(L_("gate", Watki.wstaw(TK.kod.planInfo[55], { "1": QB() ? Watki.wstaw(TK.kod.planInfo[53], { "1": tierName(repTierOf(g.minrep)), minrep: g.minrep }) : TK.kod.planInfo[54] }), on ? "good" : "bad"));
                if (on) open(TK.kod.planInfo[56]); else shut(Watki.wstaw(TK.kod.planInfo[58], { "1": QB() ? Watki.wstaw(TK.kod.planInfo[57], { minrep: g.minrep }) : "" }));
                break;
            }
            case "26:lord":
                who.push(L_(null, TK.kod.planInfo[59]));
                shut(TK.kod.planInfo[60]);
                break;
        }
        if (/^25:r\d+$/.test(key) && !["25:r1", "25:r2", "25:r3"].includes(key)) {
            what.push(L_(null, Watki.wstaw(TK.kod.planInfo[61], { "1": r0.sub ? " — " + (r0.sub === "rodzinny" ? "rodzinny" : r0.sub.replace("1-os.", "jednoosobowy").replace("2-os.", "dwuosobowy")) : "" })));
            who.push(L_(null, TK.kod.planInfo[62]));
            shut(TK.kod.planInfo[63]);
        }
        if (it.kind === "stairs" && r0.to) {
            const to = planFloorOf(r0.to);
            if (!what.length) what.push(L_(null, (r0.up ? TK.kod.planInfo[64] : TK.kod.planInfo[65]) + (to >= 0 ? FLOOR_TAB[to] : "") + "."));
            if (!out.status) open(Watki.wstaw(TK.kod.planInfo[67], { "1": to >= 0 ? FLOOR_TAB[to] : TK.kod.planInfo[66] }));
        }
        if (!what.length) what.push(L_(null, PLAN_KIND_DESC[it.kind] || ""));
        // (2026-10-29) other plugins' lines (Podroznicy: who lives here, till when): fn(floor, key) -> [{ icon, text, tone }] | null
        for (const f of PLAN_INFO) { try { for (const l of f(it.floor, it.key) || []) who.push(L_(l.icon || null, l.text, l.tone || null)); } catch (e) { console.error("[TavernLife_Plan] addInfo", e); } }
        if (!out.status) {
            if (it.kind === "private") shut(key.startsWith("26:") ? TK.kod.planInfo[68] : TK.kod.planInfo[69]);
            else if (it.kind === "service") info(TK.kod.planInfo[70]);
            else if (it.kind === "hall") info(TK.kod.planInfo[71]);
            else open("Otwarte");
        }
        return sec();
    }
    // (for other plugins and the tests)
    const PLAN_INFO = [];
    const planApi = {
        addInfo: fn => { if (typeof fn === "function") PLAN_INFO.push(fn); },
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
    const PLAN_KIND_DESC = { };
    Watki.scal(PLAN_KIND_DESC, "plan_karczmy", "opisyRodzajow");   // (its words: js/teksty/plan_karczmy.txt, opisyRodzajow)
    const PLAN_DESC = {};   // map -> room (its key on the plan, a suite's group) -> what is there: opisy.1.sala ... in the file
    Watki.scal(PLAN_DESC, "plan_karczmy", "opisy");   // (its words: js/teksty/plan_karczmy.txt, opisy)

    // ------------------------------------------------------------------ the way (O): along the plan's walkable cells, floor by floor
    function planBfs(fi, from, goal) {
        const f = PLAN_DATA.floors[fi], W0 = f.w, H0 = f.h, walk = planWalk(fi);
        const sx = clamp(Math.floor(from[0]), 0, W0 - 1), sy = clamp(Math.floor(from[1]), 0, H0 - 1);
        // (the search: Tawerna.grid.bfs - 2026-11-07, one for all)
        const r = T.grid.bfs({ w: W0, h: H0, sx, sy, dirs: [[0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0]], goal, can: (x, y, nx, ny) => !!walk[ny * W0 + nx] });
        return r && r.cells.map(c => [c % W0, Math.floor(c / W0)]);
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
            const w = Math.ceil(probe.measureText(TK.kod.makeMarker[0]).width) + 14, h = 21;
            tag.bitmap = new Bitmap(w + 2, h + 2);
            c = tag.bitmap.context;
            c.fillStyle = "rgba(252,243,220,0.94)"; c.strokeStyle = "rgba(142,36,23,0.95)"; c.lineWidth = 1.2;
            c.beginPath(); c.rect(1, 1, w, h); c.fill(); c.stroke();
            c.font = PF.handB(18); c.textAlign = "center"; c.textBaseline = "alphabetic"; c.fillStyle = "#8e2417";
            c.fillText(TK.kod.makeMarker[0], 1 + w / 2, 17);
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
            ui.keyHints(b, [["↑↓←→", TK.kod.drawHints[0]], ["Q/E", TK.kod.drawHints[1]], ["O", TK.kod.drawHints[2]], ["P", TK.kod.drawHints[3]]], PS[0] + 4, 5, 24, 17);
            ui.text(b, Watki.wstaw(TK.kod.drawHints[5], { "1": hasClock() ? Watki.wstaw(TK.kod.drawHints[4], { "1": day() }) : "", "2": clockText() }), PP[0], 5, PP[2] - 6, { size: 17, color: S0.muted, align: "right", lh: Math.round(17 * 1.4) });
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
                const txt = !this.wayPath && same ? TK.kod.drawPanel[0] : same ? Watki.wstaw(TK.kod.drawPanel[2], { "1": this.here !== tf ? TK.kod.drawPanel[1] : "." })
                    : Watki.wstaw(TK.kod.drawPanel[3], { "1": tIt ? tIt.name : "", "2": FLOOR_TAB[tf] });
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
            inkLine(ctx, TK.kod.drawLegend[0], x + 22, y + 7, PF.hand(17), INKC.ink);
            for (const k of kinds) {
                [x, y] = cell();
                ctx.save(); ctx.translate(x + 9, y + 1); ctx.scale(0.74, 0.74); planMedallion(ctx, k, 0, 0, true, null); ctx.restore();
                inkLine(ctx, ICON_WORD[k] || k, x + 22, y + 7, PF.hand(17), INKC.ink);
            }
            const ly = top + 36 + Math.ceil(i / cols) * 23 + 2;
            inkLine(ctx, TK.kod.drawLegend[1], pad, ly, PF.hand(16), INKC.soft);
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
    // 20 px map glyph in MenuPanel's 22 px box). The label is a getter: registered while the plugins load, read when the menu is
    // made - the words of js/teksty come in between
    const planOnMap = () => !!$gameMap && planFloorOf($gameMap.mapId()) >= 0;
    const planFromMenu = () => { PLAN.pending = {}; SceneManager.push(Scene_TavernPlan); };
    const MP = T.api("MenuPanel");
    if (MP && MP.addCommand) {
        MP.addCommand({ symbol: "tavernPlan", get label() { return TK.kod.label[0]; }, owner: "TavernLife_Plan", when: planOnMap, ok: planFromMenu,
            glyph: (ctx, x, y, size, colour) => planGlyph(ctx, "map", x + 1, y + 1, size - 2, colour, "#000") });
    } else {   // (without MenuPanel.js: a plain command)
        const _Window_MenuCommand_addOriginalCommands = Window_MenuCommand.prototype.addOriginalCommands;
        Window_MenuCommand.prototype.addOriginalCommands = function() {
            _Window_MenuCommand_addOriginalCommands.call(this);
            if (planOnMap()) this.addCommand(TK.kod.addOriginalCommands[0], "tavernPlan", true);
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
