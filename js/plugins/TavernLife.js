//=============================================================================
// TavernLife.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Życie w tawernie „Pod Złotym Kuflem”: posiłki u Borgara, pokoje na noc, łaźnia, pieśni Melii, siłowanie na rękę z Grumem i rzutki, plan karczmy. v1.1.0
 * @author Claude
 * @orderAfter Survival
 * @orderAfter Needs
 * @orderAfter Combat
 * @orderAfter SpeechBubbles
 * @orderAfter Journal
 * @orderAfter UITheme
 * @orderAfter TavernShift
 * @orderAfter Story
 * @orderAfter QuestBoard
 *
 * @param priceGulasz
 * @text Cena: gulasz (G)
 * @type number
 * @min 0
 * @default 16
 *
 * @param priceKapusniak
 * @text Cena: kapuśniak (G)
 * @type number
 * @min 0
 * @default 12
 *
 * @param pricePieczen
 * @text Cena: pieczeń z kaszą (G)
 * @type number
 * @min 0
 * @default 18
 *
 * @param pricePlacek
 * @text Cena: placek z serem (G)
 * @type number
 * @min 0
 * @default 9
 *
 * @param priceChleb
 * @text Cena: chleb ze smalcem (G)
 * @type number
 * @min 0
 * @default 5
 *
 * @param pricePiwo
 * @text Cena: kufel piwa (G)
 * @type number
 * @min 0
 * @default 4
 *
 * @param priceMiod
 * @text Cena: miód pitny (G)
 * @type number
 * @min 0
 * @default 8
 *
 * @param dayDiscount
 * @text Danie dnia: zniżka (%)
 * @desc Każdego dnia jedno danie (nie napój) jest tańsze o tyle procent.
 * @type number
 * @min 0
 * @max 90
 * @default 30
 *
 * @param hostedNeeds
 * @text Ugoszczony: głód i pragnienie wolniej o (%)
 * @type number
 * @min 0
 * @max 90
 * @default 30
 *
 * @param roomPrices
 * @text Ceny pokoi 1, 2, 3 (G)
 * @desc Gdy łóżko <Tavern:bed> nie podaje ceny (price=...).
 * @default 8,15,20
 *
 * @param roomMaps
 * @text Mapy z pokojami gości
 * @desc Numery map z łóżkami <Tavern:bed>, drzwiami i kratą Apartamentów, czytane przy starcie gry (po przecinku).
 * @default 25,26
 *
 * @param repDiscounts
 * @text Sława: zniżki u Borgara (%)
 * @desc Dla progów sławy (QuestBoard.js) Swój chłop, Pewna ręka, Chluba tawerny - na jedzenie, pokoje i łaźnię.
 * @default 5,10,15
 *
 * @param checkoutHour
 * @text Pokój do godziny (rano)
 * @desc Wynajęty pokój jest twój do tej godziny następnego ranka.
 * @type number
 * @min 7
 * @max 14
 * @default 10
 *
 * @param bathPrice
 * @text Łaźnia: cena (G)
 * @type number
 * @min 0
 * @default 6
 *
 * @param cleanHours
 * @text Czysty: godziny
 * @type number
 * @min 1
 * @default 6
 *
 * @param cleanCost
 * @text Czysty: prace tańsze o (%)
 * @type number
 * @min 0
 * @max 50
 * @default 10
 *
 * @param songTip
 * @text Pieśń Melii: napiwek (G)
 * @type number
 * @min 0
 * @default 2
 *
 * @param songFrom
 * @text Pieśń Melii: od godziny
 * @type number
 * @min 0
 * @max 23
 * @default 18
 *
 * @param songBgm
 * @text Pieśń Melii: melodia
 * @desc Muzyka pod słowami ballady (po niej wraca muzyka sali). Na początek krótki motyw Musical1.
 * @type file
 * @dir audio/bgm
 * @default Scene2
 *
 * @param inspiredHours
 * @text Natchniony: godziny (bez napiwku)
 * @desc Z napiwkiem dwie godziny dłużej.
 * @type number
 * @min 1
 * @default 4
 *
 * @param inspiredXp
 * @text Natchniony: więcej doświadczenia (%)
 * @type number
 * @min 0
 * @max 100
 * @default 10
 *
 * @param armStakes
 * @text Siłowanie: stawki (G)
 * @default 5,10,20
 *
 * @param dartsStakes
 * @text Rzutki: stawki (G)
 * @default 5,10,15
 *
 * @help
 * ============================================================================
 * TavernLife.js - życie w tawernie „Pod Złotym Kuflem”
 * ============================================================================
 * Usługi i zabawy w tawernie. Miejsca na mapach to zdarzenia z komentarzem
 * na pierwszej stronie (albo w notatce):
 *
 *   <Tavern:meal>        lada przed Borgarem: „Zjedz coś” / „Wynajmij pokój”
 *   <Tavern:mealtable>   miejsce przy stole (krzesło). Opcje: dir=8 (w którą
 *                        stronę siedzi), plate=0,-1 (gdzie stanie talerz, w
 *                        kratkach od krzesła), lift=12 (o ile px wyżej siedzi)
 *   <Tavern:bath>        balia w łaźni. Opcja: lift=34 (o ile px wyżej siedzi
 *                        kąpiący się - tak, by głowa wychodziła z wody balii)
 *   <Tavern:stage>       miejsce do słuchania przed sceną Melii
 *   <Tavern:arm>         stół do siłowania na rękę (Grum)
 *   <Tavern:darts>       linia rzutu przed tarczą
 *   <Tavern:bed room=N price=P name="...">   łóżko w pokoju gości
 *   <Tavern:door room=N> drzwi pokoju (na obu stronach zdarzenia). Strona 2
 *                        z warunkiem „przełącznik własny A” = otwarte drzwi.
 *                        Wtyczka włącza A, gdy pokój jest wynajęty na tę noc,
 *                        i wyłącza rano (kiedy bohatera nie ma w pokoju).
 *   <Tavern:candle room=N>  (opcja) świeca w pokoju - płonie, gdy wynajęty
 *   Łóżko z minrep=60 (np. room=komnata) - tylko dla gości o takiej sławie
 *   (QuestBoard.js); <Tavern:gate minrep=80> - złocona krata Apartamentów,
 *   otwiera się na dobre (przełącznik własny A), gdy sława do tego dorośnie.
 *
 * SŁAWA W TAWERNIE (QuestBoard.js, bez niej sława = 0): Swój chłop -5%,
 * Pewna ręka -10% (i Komnata z kominkiem), Chluba tawerny -15% (i Apartament
 * Złoty) u Borgara: jedzenie, pokoje, łaźnia. Noc w komnacie / apartamencie
 * daje premię Wypoczęty (odpoczynek daje więcej sił).
 *
 * POSIŁEK: karta dań u Borgara (7 potraw i napojów z cenami i opisem), danie
 * dnia tańsze. Bohater płaci, siada przy wolnym stole, talerz staje na stole,
 * mija ok. 30 minut gry, potem działa jedzenie (tabela FoodTable) i premia
 * Ugoszczony (głód i pragnienie rosną wolniej).
 * POKÓJ: wynajem na tę noc (pokoje 1-3). Drzwi otwarte do rana, w pokoju
 * pali się świeca. Łóżko: pełny, bezpieczny sen (bez wilków), rano śniadanie.
 * ŁAŹNIA: kąpiel za opłatą, godzina gry, premia Czysty (prace tańsze).
 * PIEŚŃ MELII: wieczorem, raz na wieczór, z napiwkiem albo bez. Sześć
 * ballad na zmianę; każda kryje okruch prawdy o Kruczych Skałach. Potem
 * premia Natchniony (więcej doświadczenia).
 * SIŁOWANIE NA RĘKĘ z Grumem i RZUTKI (z Dziadkiem Ozzym albo z furmanem):
 * osobne mini-gry o drobne stawki. Siła poszerza zielone pole u Gruma,
 * Zręczność i Czujność uspokajają celownik rzutek.
 * PLAN KARCZMY: sztaluga z planem w sieni (mapa 1) i mniejsze przy
 * schodach pięter (mapy 25 i 26) - wtyczka sama je stawia (zdarzenie 950,
 * znacznik <Tavern:plan>). O przed planem (albo „Plan karczmy” w menu P,
 * gdy bohater jest w karczmie): trzy piętra na pergaminie, „Tu jesteś”,
 * usługi jasne, gdy czynne, i przygaszone, gdy zamknięte; strzałki - pokój
 * i opis (co tu jest, kto i kiedy, ceny), Q/E - piętro, O - droga, P - wyjście.
 * Obrazy: img/pictures/TavernPlan_*.png, img/characters/!$Tavern_Plan*.png
 * (tools/tavern/plan/make_plan.py i make_board.py).
 *
 * W grze z fabułą (Story.js) menu Borgara dostaje „Zjedz coś” i „Wynajmij
 * pokój”. Stare mapy bez znaczników: nic się nie psuje - posiłek zjesz przy
 * ladzie, a pokoi po prostu nie ma.
 *
 * Dla innych wtyczek i testów: window.TavernLife = { meal(id), rentRoom(n),
 * bath(), song(tip), sleep(), armWrestle({ stake, seed, turbo, onEnd }),
 * darts({ stake, seed, turbo, onEnd, opponent }), buffs, stats(),
 * plan: { open({ floor }), state(), info(floor, key), icons(floor), ... } }.
 * ============================================================================
 */

(() => {
    "use strict";

    const PLUGIN = "TavernLife";
    const params = PluginManager.parameters(PLUGIN);
    const num = (v, d) => (v === undefined || v === null || v === "" || isNaN(Number(v)) ? d : Number(v));
    const nums = (v, d) => { const a = String(v || d).split(",").map(s => Number(s.trim())).filter(n => n > 0); return a.length ? a : String(d).split(",").map(Number); };

    const DAY_DISCOUNT = num(params.dayDiscount, 30) / 100;
    const HOSTED_NEEDS = num(params.hostedNeeds, 30) / 100;
    const ROOM_PRICES = nums(params.roomPrices, "8,15,20");
    const ROOM_MAPS = nums(params.roomMaps, "25,26");
    const CHECKOUT = num(params.checkoutHour, 10);
    const BATH_PRICE = num(params.bathPrice, 6);
    const CLEAN_HOURS = num(params.cleanHours, 6), CLEAN_COST = num(params.cleanCost, 10) / 100;
    const SONG_TIP = num(params.songTip, 2), SONG_FROM = num(params.songFrom, 18);
    const INSPIRED_HOURS = num(params.inspiredHours, 4), INSPIRED_TIP_HOURS = 2, INSPIRED_XP = num(params.inspiredXp, 10) / 100;
    const ARM_STAKES = nums(params.armStakes, "5,10,20"), DARTS_STAKES = nums(params.dartsStakes, "5,10,15");
    const ARM = { minutes: 15, stamina: 6, xpWin: 15, xpLose: 4, needStamina: 15 };
    const DARTS = { minutes: 30, stamina: 3, xpWin: 10, xpLose: 3 };
    const BATH_HOURS = 1;
    const BATH_LIFT = 34;   // px the bather sits higher than his feet would stand on the tub's tile (the tag: <Tavern:bath lift=N>)
    const GOLD_ICON = 313, BREAD = 83, MILK = 123, CHEESE = 124;
    const DISH_SHEET = "Tav_Dishes", ARMS_PICTURE = "Tav_Arms";

    // ------------------------------------------------------------------
    // Small helpers
    // ------------------------------------------------------------------
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
    const U = () => window.UIStyle || { fill: "rgba(11,12,15,0.9)", solid: "#0b0c0f", line: "#3a3e46", accent: "#ffd23f", accentDim: "#c9a12a",
        text: "#eceef0", muted: "#8a9099", trough: "#16181c", panel: null, bar: null };
    const GOOD = "#9ff0a8", BAD = "#ff9f8f", WARM = "#ffe27a";
    function makeRng(seed) {   // mulberry32
        let a = (seed >>> 0) || 1;
        return () => {
            a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    function hash(a, b) {
        let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263);
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }
    const seLast = {};   // (one sound of a name at most every few frames: a fast game - the tests' turbo - would pile them up)
    function se(name, volume, pitch, pan) {
        if (!name || (seLast[name] !== undefined && Graphics.frameCount - seLast[name] < 4 && Graphics.frameCount >= seLast[name])) return;
        seLast[name] = Graphics.frameCount;
        AudioManager.playSe({ name, volume: volume === undefined ? 80 : volume, pitch: pitch || 100, pan: pan || 0 });
    }
    function me(name, volume) {
        if (name) AudioManager.playMe({ name, volume: volume === undefined ? 80 : volume, pitch: 100, pan: 0 });
    }
    // the game's clock (DayNightCycle.js)
    const hasClock = () => !!window.$gameSystem && typeof $gameSystem.dayNightDay === "function";
    const day = () => (hasClock() ? $gameSystem.dayNightDay() : 1);
    const hour = () => (hasClock() ? $gameSystem.dayNightHour() : 12);
    const nowH = () => day() * 24 + hour();
    function pass(hours) {
        if (hours > 0 && $gameSystem && typeof $gameSystem.advanceDayNight === "function") $gameSystem.advanceDayNight(hours);
    }
    const wakeHour = () => (window.Farming && Farming.wakeHour ? Farming.wakeHour() : num(PluginManager.parameters("SurvivalHUD").wakeHour, 7));
    const perk = key => (window.Combat && Combat.perk ? Combat.perk(key) : 0);
    const attr = id => (window.Combat && Combat.attr ? Combat.attr(id) : 5);
    const gold = () => $gameParty.gold();
    const item = id => ($dataItems && $dataItems[id]) || null;
    const hoursText = h => { const r = Math.round(h * 10) / 10; return String(r).replace(".", ",") + " godz."; };
    function popup(icon, text, colour) {
        if ($gameTemp && $gameTemp.pushLootPopup) $gameTemp.pushLootPopup(icon || 0, text, colour || "#eceef0");
    }
    // what is missing floats over the player (the user's rule), never in the message window
    function needGold(price) {
        popup(GOLD_ICON, "Brakuje ci " + Math.max(1, price - gold()) + " G", BAD);
        SoundManager.playBuzzer();
    }
    function notice(text, sub) {
        if ($gameTemp && $gameTemp.pushTopNotice) $gameTemp.pushTopNotice(text, U().accent, sub ? { sub } : undefined);
    }
    function note(title, text) {
        if (window.Journal && Journal.addNote) Journal.addNote(title, text);
    }
    // a short cry over someone's head (SpeechBubbles.js), the game goes on
    function bark(ch, text, frames) {
        if (ch && text && window.SpeechBubbles && SpeechBubbles.say) SpeechBubbles.say(ch, text, frames);
    }
    function xp(amount, reason) {
        if (window.Combat && Combat.gainXp && amount > 0) Combat.gainXp(amount, reason);
    }

    // ------------------------------------------------------------------
    // State: $gameSystem._tavernLife (plain data, saved with the game)
    // ------------------------------------------------------------------
    function newState() {
        return { v: 1, firsts: {}, meals: 0, dishes: {}, spent: 0, rooms: 0, nights: 0, baths: 0, songs: 0, songDay: -1, heard: [], tips: 0,
            arm: { played: 0, won: 0, lost: 0, net: 0, level: 0, streak: 0 }, darts: { played: 0, won: 0, lost: 0, net: 0, best: 0, bulls: 0 }, rent: null };
    }
    function S() {
        if (!$gameSystem._tavernLife) $gameSystem._tavernLife = newState();
        return $gameSystem._tavernLife;
    }
    // the first time of something: true once (and the day is kept)
    function first(key) {
        const f = S().firsts;
        if (f[key]) return false;
        f[key] = day();
        return true;
    }
    const spend = n => { S().spent += n; };

    // ------------------------------------------------------------------
    // The premia (Survival.js): Czysty after the bath, Natchniony after Melia's song, Ugoszczony after a meal at the tavern
    // ------------------------------------------------------------------
    const BUFFS = {
        clean: { name: "Czysty", icon: 67, desc: "prace kosztują " + Math.round(CLEAN_COST * 100) + "% mniej sił (po kąpieli)", cost: 1 - CLEAN_COST },
        inspired: { name: "Natchniony", icon: 80, desc: "+" + Math.round(INSPIRED_XP * 100) + "% doświadczenia (po pieśni Melii)" },
        hosted: { name: "Ugoszczony", icon: 337, desc: "głód i pragnienie rosną o " + Math.round(HOSTED_NEEDS * 100) + "% wolniej (po posiłku w tawernie)" },
        rested: { name: "Wypoczęty", icon: 8, desc: "odpoczynek daje 25% więcej sił (po nocy w komnacie albo w apartamencie)" }
    };
    const SV = window.Survival;
    if (SV && SV.defineBuff) for (const k of Object.keys(BUFFS)) SV.defineBuff(k, BUFFS[k]);
    else if (SV && SV.BUFFS) Object.assign(SV.BUFFS, BUFFS);   // (an older Survival.js: no cost factor there - see the wrapper below)
    const hasBuff = k => !!($gameSystem && $gameSystem.hasBuff && $gameSystem.hasBuff(k));
    function addBuff(k, hours) {
        if ($gameSystem && $gameSystem.addBuff) $gameSystem.addBuff(k, hours);
    }
    if (SV && !SV.defineBuff) {   // (only without defineBuff: Survival's costFactor applies `cost` itself)
        const _try = Game_System.prototype.trySpendStamina;
        Game_System.prototype.trySpendStamina = function(cost) {
            return _try.call(this, cost > 0 && hasBuff("clean") ? cost * BUFFS.clean.cost : cost);
        };
    }
    // Ugoszczony: what hunger and thirst (Needs.js) lose by the clock, by work and in sleep, part of it comes back at once
    function keepNeeds(sys, fn) {
        const N = window.Needs;
        if (!N || !N.enabled || !N.enabled() || !sys.hasBuff || !sys.hasBuff("hosted")) return fn();
        const n = N.state(), f0 = n.food, w0 = n.water;
        const r = fn();
        if (n.food < f0) n.food = Math.min(100, n.food + (f0 - n.food) * HOSTED_NEEDS);
        if (n.water < w0) n.water = Math.min(100, n.water + (w0 - n.water) * HOSTED_NEEDS);
        return r;
    }
    for (const fn of ["advanceDayNight", "sleepUntilHour", "trySpendStamina"]) {
        const original = Game_System.prototype[fn];
        if (typeof original !== "function") continue;
        Game_System.prototype[fn] = function() {
            const args = arguments;
            return keepNeeds(this, () => original.apply(this, args));
        };
    }
    // Wypoczęty: a rest (sitting on the grass, a bench, by the fire) gives 25% more - through the perk the rests already ask
    if (window.Combat && typeof Combat.perk === "function") {
        const _perk = Combat.perk;
        Combat.perk = function(key) {
            const v = _perk.apply(this, arguments);
            return key === "sleep.rest" && hasBuff("rested") ? v + 0.25 : v;
        };
    }
    // Natchniony: every experience gained while it lasts brings INSPIRED_XP more. Combat.js gives experience from many places inside
    // itself (kills, discoveries, maps, goals), so the gain is watched rather than one entry point: what came since the last frame
    // (levels included), and a tenth of it is given on top (the fractions wait in acc)
    let xpSeen = null;
    function xpTotalSince(seen, h) {
        const C = window.Combat;
        if (h.level === seen.level) return h.xp - seen.xp;
        if (h.level < seen.level) return 0;
        let d = C.xpToNext(seen.level) - seen.xp;
        for (let l = seen.level + 1; l < h.level; l++) d += C.xpToNext(l);
        return d + h.xp;
    }
    function xpWatch() {
        const C = window.Combat;
        if (!C || !C.hero || !C.xpToNext || !$gameSystem) return;
        const h = C.hero();
        if (!xpSeen || xpSeen.sys !== $gameSystem || xpSeen.h !== h) { xpSeen = { sys: $gameSystem, h, level: h.level, xp: h.xp, acc: 0 }; return; }
        const d = xpTotalSince(xpSeen, h);
        xpSeen.level = h.level;
        xpSeen.xp = h.xp;
        if (!(d > 0) || !hasBuff("inspired")) return;
        xpSeen.acc += d * INSPIRED_XP;
        const whole = Math.floor(xpSeen.acc + 1e-6);
        if (whole < 1) return;
        xpSeen.acc -= whole;
        C.gainXp(whole, "natchnienie");
        xpSeen.level = h.level;
        xpSeen.xp = h.xp;
    }

    // the HUD's symbols for the three premia (UITheme.js's UIStyle.glyph knows only its own): a soap bubble, a note, a mug with foam
    function installGlyphs() {
        const S0 = window.UIStyle;
        if (!S0 || !S0.glyph || S0._tavernGlyphs) return;
        const base = S0.glyph;
        S0._tavernGlyphs = true;
        S0.glyph = function(ctx, kind, x, y, size, fill, bare) {
            if (kind !== "clean" && kind !== "inspired" && kind !== "hosted" && kind !== "rested") return base.apply(this, arguments);
            const col = fill || S0.accent, dark = bare ? "rgba(0,0,0,0)" : "rgba(8,9,11,0.92)";
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(size / 20, size / 20);
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            const solid = p => { ctx.lineWidth = 3; ctx.strokeStyle = dark; ctx.stroke(p); ctx.fillStyle = col; ctx.fill(p); };
            const line = (p, w) => { ctx.strokeStyle = dark; ctx.lineWidth = w + 3; ctx.stroke(p); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(p); };
            if (kind === "clean") {   // soap bubbles
                const big = new Path2D(), small = new Path2D(), tiny = new Path2D();
                big.arc(8.2, 11.6, 5.6, 0, Math.PI * 2);
                small.arc(15, 6, 3.2, 0, Math.PI * 2);
                tiny.arc(15.6, 14.8, 2, 0, Math.PI * 2);
                line(big, 1.8); line(small, 1.6); line(tiny, 1.4);
                const shine = new Path2D();
                shine.arc(8.2, 11.6, 3.4, Math.PI * 1.05, Math.PI * 1.55);
                ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 1.3; ctx.stroke(shine);
            } else if (kind === "rested") {   // a crescent moon and a star
                const moon = new Path2D();
                moon.arc(9, 11, 7.2, 0, Math.PI * 2);
                moon.moveTo(15.5, 8.2);
                moon.arc(12, 8.2, 5.8, 0, Math.PI * 2, true);
                ctx.lineWidth = 3; ctx.strokeStyle = dark; ctx.stroke(moon);
                ctx.fillStyle = col; ctx.fill(moon, "evenodd");
                const star = new Path2D();
                star.moveTo(16.2, 12.6); star.lineTo(17, 14.6); star.lineTo(19, 15.4); star.lineTo(17, 16.2); star.lineTo(16.2, 18.2); star.lineTo(15.4, 16.2); star.lineTo(13.4, 15.4); star.lineTo(15.4, 14.6); star.closePath();
                solid(star);
            } else if (kind === "inspired") {   // a note
                const head = new Path2D();
                head.ellipse(7.2, 15.2, 3.7, 2.8, -0.45, 0, Math.PI * 2);
                solid(head);
                const stem = new Path2D();
                stem.moveTo(10.4, 14.4); stem.lineTo(10.4, 2.6); stem.quadraticCurveTo(12.5, 6.5, 16.2, 7.4);
                line(stem, 2);
            } else {   // a mug with foam
                const body = new Path2D();
                body.moveTo(4, 7.5); body.lineTo(13.4, 7.5); body.lineTo(13, 17.6); body.lineTo(4.4, 17.6); body.closePath();
                const handle = new Path2D();
                handle.moveTo(13.2, 9.4); handle.bezierCurveTo(18.6, 9.4, 18.6, 15.2, 13.1, 15.2);
                line(handle, 2);
                solid(body);
                const foam = new Path2D();
                foam.arc(5.6, 6.6, 2.4, Math.PI, 0); foam.arc(9, 5.4, 2.6, Math.PI, 0); foam.arc(12.2, 6.6, 2.2, Math.PI, 0);
                foam.lineTo(14.2, 8.4); foam.lineTo(3.4, 8.4); foam.closePath();
                ctx.lineWidth = 3; ctx.strokeStyle = dark; ctx.stroke(foam);
                ctx.fillStyle = "#fff6dc"; ctx.fill(foam);
            }
            ctx.restore();
        };
    }
    installGlyphs();

    // ------------------------------------------------------------------
    // Places: events tagged <Tavern:kind key=value key="value"> in a comment of a page (or in the note)
    // ------------------------------------------------------------------
    const TAG_RE = /<Tavern:\s*([A-Za-z]+)([^>]*)>/i;
    function parseTag(text) {
        const m = TAG_RE.exec(String(text || ""));
        if (!m) return null;
        const a = {}, re = /([A-Za-z_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
        let r;
        while ((r = re.exec(m[2]))) a[r[1].toLowerCase()] = r[2] !== undefined ? r[2] : r[3] !== undefined ? r[3] : r[4];
        return { kind: m[1].toLowerCase(), a };
    }
    const pageCache = new WeakMap();   // (the pages are the map data's own objects: read once)
    function pageTag(page) {
        if (!page) return null;
        if (pageCache.has(page)) return pageCache.get(page);
        let t = null;
        for (const c of page.list || []) {
            if ((c.code === 108 || c.code === 408) && typeof c.parameters[0] === "string") {
                t = parseTag(c.parameters[0]);
                if (t) break;
            }
        }
        pageCache.set(page, t);
        return t;
    }
    const tagCache = new WeakMap();
    function dataTag(data) {
        if (!data) return null;
        if (tagCache.has(data)) return tagCache.get(data);
        let t = null;
        for (const p of data.pages || []) { t = pageTag(p); if (t) break; }
        if (!t && data.note) t = parseTag(data.note);
        tagCache.set(data, t);
        return t;
    }
    const evTag = ev => (ev && ev.event ? dataTag(ev.event()) : null);
    function spots(kind) {
        const out = [];
        if (!$gameMap) return out;
        for (const ev of $gameMap.events()) {
            const t = evTag(ev);
            if (t && t.kind === kind) out.push({ ev, a: t.a });
        }
        return out;
    }
    // the tagged places the action button talks to: a short list that calls back here (the page's own commands stay for doors)
    const USE_KINDS = new Set(["meal", "mealtable", "bath", "stage", "arm", "darts", "bed", "plan"]);
    const C = (code, parameters, indent) => ({ code, indent: indent || 0, parameters });
    const STUB = [C(355, ["TavernLife.use(this)"]), C(0, [])];
    const _Game_Event_list = Game_Event.prototype.list;
    Game_Event.prototype.list = function() {
        const t = pageTag(this.page());
        if (t && USE_KINDS.has(t.kind)) return STUB;
        if (t && (t.kind === "door" || t.kind === "gate") && $gameSystem && repLocked(this, t)) return STUB;   // (below the reputation it needs)
        return _Game_Event_list.call(this);
    };

    // the people of the tavern (found by name or by look, as Story.js finds Borgar; the "Atmosfera - ..." parallel events are skipped)
    const NPCS = {
        borgar: { re: /^Borgar\b/i, sheet: "People3_Tall", index: 4, face: ["People3", 4], name: "Borgar", bust: "People3_5" },
        melia: { re: /^Melia\b/i, sheet: "People2_Tall", index: 7, face: ["People2", 7], name: "Melia", bust: "People2_8" },
        grum: { re: /^Grum\b/i, sheet: "Actor2_Tall", index: 4, face: ["Actor2", 4], name: "Grum", bust: "Actor2_5" },
        ozzy: { re: /Ozzy/i, sheet: "People2_Tall", index: 0, face: ["People2", 0], name: "Dziadek Ozzy", bust: "People2_1" }
    };
    function npc(role) {
        const n = NPCS[role];
        if (!n || !$gameMap) return null;
        for (const ev of $gameMap.events()) {
            const d = ev.event(), p = d && d.pages && d.pages[0];
            if (!p || p.trigger > 2 || /^Atmosfera/i.test(d.name || "")) continue;
            if (n.re.test(d.name || "") || (p.image && p.image.characterName === n.sheet && p.image.characterIndex === n.index)) return ev;
        }
        return null;
    }
    function bustOf(role) {
        const ev = npc(role), SB = window.SpeechBubbles;
        return (ev && SB && SB.bustOf && SB.bustOf(ev)) || NPCS[role].bust;
    }
    const heroBust = () => (window.SpeechBubbles && SpeechBubbles.heroBust && SpeechBubbles.heroBust()) || "Hero_Bust";

    // ------------------------------------------------------------------
    // Talks: lists of ordinary event commands (messages in the speech bubbles and busts of SpeechBubbles.js, choices, script
    // calls back into this plugin), run as a child of the interpreter that talks - the same way Story.js does it
    // ------------------------------------------------------------------
    const WRAP_W = 540, PAGE_LINES = 3;
    let probe = null;
    function wrap(text) {
        if (!probe) probe = new Bitmap(8, 8);
        probe.fontFace = $gameSystem.mainFontFace();
        probe.fontSize = $gameSystem.mainFontSize();
        const lines = [];
        for (const para of String(text).replace(/(\d) G\b/g, "$1 G").split("\n")) {   // (a sum keeps its "G" on its line)
            let line = "";
            for (const word of para.split(" ")) {
                const trial = line ? line + " " + word : word;
                if (line && probe.measureTextWidth(trial) > WRAP_W) { lines.push(line); line = word; } else line = trial;
            }
            lines.push(line);
        }
        return lines;
    }
    // who: 0 the hero, an event id, -1 the plain window (then with a name plate); face: [name, index] for the plain window
    function say(out, who, text, face, name, indent) {
        const lines = wrap(text);
        for (let i = 0; i < lines.length; i += PAGE_LINES) {
            out.push(C(101, [face ? face[0] : "", face ? face[1] : 0, 0, 2, who < 0 ? name || "" : ""], indent));
            lines.slice(i, i + PAGE_LINES).forEach((l, j) => out.push(C(401, [(j === 0 ? "\\SPK[" + who + "]" : "") + l], indent)));
        }
        return out;
    }
    // lines kept as they are (the verses of a song): one bubble, no re-wrapping
    function sayLines(out, who, lines, face, name) {
        out.push(C(101, [face ? face[0] : "", face ? face[1] : 0, 0, 2, who < 0 ? name || "" : ""]));
        lines.forEach((l, j) => out.push(C(401, [(j === 0 ? "\\SPK[" + who + "]" : "") + l])));
        return out;
    }
    function sayAs(out, role, text) {
        const ev = npc(role), n = NPCS[role];
        return say(out, ev ? ev.eventId() : -1, text, n.face, n.name);
    }
    const heroSay = (out, text) => say(out, 0, text, null);
    const script = (out, js, indent) => (out.push(C(355, [js], indent)), out);
    // options: [{ label, js }] - each branch calls back into the plugin; cancel: the option Esc picks (the last by default)
    function choose(out, options, cancel) {
        out.push(C(102, [options.map(o => o.label), cancel === undefined ? options.length - 1 : cancel, 0, 2, 0]));
        options.forEach((o, i) => {
            out.push(C(402, [i, o.label]));
            for (const js of [].concat(o.js || [])) out.push(C(355, [js], 1));
            out.push(C(0, [], 1));
        });
        out.push(C(404, []));
        return out;
    }
    const end = out => (out.push(C(0, [])), out);
    function run(interp, list) {
        if (interp && list && list.length) interp.setupChild(end(list), interp.eventId());
    }
    // a list for the map's own interpreter (the API, outside any talk): it keeps the event running while a sequence plays
    function runOnMap(list) {
        if (!$gameMap || $gameMap.isEventRunning()) return false;
        $gameMap._interpreter.setup(end(list), 0);
        return true;
    }
    const q = s => JSON.stringify(String(s));

    // ------------------------------------------------------------------
    // Sequences: what happens over many frames (sitting down to eat, a bath, a night in bed) is a generator that yields a number
    // of frames or a condition to wait for. It runs every map frame; the talk that started it waits (wait mode "tavernLife").
    // ------------------------------------------------------------------
    let seq = null;
    const TL = { waitScale: 1 };   // (tests make the waits shorter)
    const W = n => Math.max(1, Math.round(n * TL.waitScale));
    function begin(gen, cleanup) {
        if (seq) finishSeq();
        seq = { gen, wait: 0, cleanup: cleanup || null };
    }
    function finishSeq() {
        const s = seq;
        seq = null;
        if (s && s.cleanup) { try { s.cleanup(); } catch (e) { console.error(e); } }
    }
    function stepSeq() {
        if (!seq) return;
        const s = seq;
        if (typeof s.wait === "number" && s.wait > 0) { s.wait--; return; }
        if (typeof s.wait === "function") {
            let ok = false;
            try { ok = s.wait(); } catch (e) { console.error(e); ok = true; }
            if (!ok) return;
        }
        let r;
        try { r = s.gen.next(); } catch (e) { console.error(e); finishSeq(); return; }
        if (seq !== s) return;
        if (r.done) { finishSeq(); return; }
        s.wait = r.value === undefined ? 0 : r.value;
    }
    const busy = () => !!seq || !!card;
    const _updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function() {
        if (this._waitMode === "tavernLife") {
            if (busy()) return true;
            this._waitMode = "";
            return false;
        }
        return _updateWaitMode.call(this);
    };
    function hold(interp) {
        if (interp && busy()) interp.setWaitMode("tavernLife");
    }
    // a short dip to black: `mid` runs in the dark
    function* dip(mid, frames) {
        const f = W(frames || 14);
        $gameScreen.startFadeOut(f);
        yield f + 1;
        if (mid) mid();
        $gameScreen.startFadeIn(f);
        yield Math.max(1, f - 4);
    }
    // frames a swing takes to settle into its held pose
    const swingWaiting = () => !!($gamePlayer._toolSwing && $gamePlayer._toolSwing._waiting);

    // ==================================================================
    // Effects on the map: plates on the tables, steam, the room's candle, music notes, drops of water, ripples in the tub. Map-space
    // sprites in the tilemap (they sort with the characters by y); nothing of it is saved.
    // ==================================================================
    const fx = [];   // { kind, x, y (map tiles, real), z, t, life, ... }
    function addFx(o) {
        o.t = 0;
        fx.push(o);
        return o;
    }
    const dropFx = o => { o.gone = true; };
    const tilemap = () => { const s = SceneManager._scene; return s instanceof Scene_Map && s._spriteset ? s._spriteset._tilemap : null; };
    const tw = () => $gameMap.tileWidth(), th = () => $gameMap.tileHeight();
    const mapPx = (x, y) => ({ x: Math.round(($gameMap.adjustX(x) + 0.5) * tw()), y: Math.round(($gameMap.adjustY(y) + 0.5) * th()) });
    const bitmaps = {};
    function cached(key, make) {
        return bitmaps[key] || (bitmaps[key] = make());
    }
    function dirty(b) { if (b && b._baseTexture) b._baseTexture.update(); }
    // a soft white puff (steam)
    const puffBitmap = () => cached("puff", () => {
        const b = new Bitmap(32, 32), ctx = b.context, g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        g.addColorStop(0, "rgba(255,255,255,0.55)"); g.addColorStop(0.5, "rgba(245,245,250,0.28)"); g.addColorStop(1, "rgba(240,240,250,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, 32, 32);
        dirty(b);
        return b;
    });
    // a warm glow (the candle), drawn with additive blending
    const glowBitmap = () => cached("glow", () => {
        const b = new Bitmap(128, 128), ctx = b.context, g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        g.addColorStop(0, "rgba(255,196,110,0.55)"); g.addColorStop(0.35, "rgba(255,160,70,0.22)"); g.addColorStop(1, "rgba(255,140,60,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
        dirty(b);
        return b;
    });
    // the candle on its iron stand (no flame: the flame is its own sprite)
    const candleBitmap = () => cached("candle", () => {
        const b = new Bitmap(16, 30), ctx = b.context;
        ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.beginPath(); ctx.ellipse(8, 28, 6, 2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#1c1612"; ctx.fillRect(7, 16, 2, 11); ctx.fillRect(3, 26, 10, 2); ctx.fillRect(4, 15, 8, 2);   // the stand
        ctx.fillStyle = "#6b5a44"; ctx.fillRect(4, 15, 8, 1);
        ctx.fillStyle = "#1c1612"; ctx.fillRect(5, 6, 6, 10);   // the candle's outline
        ctx.fillStyle = "#efe6cf"; ctx.fillRect(6, 7, 4, 8);
        ctx.fillStyle = "#fffaf0"; ctx.fillRect(6, 7, 1, 8);
        ctx.fillStyle = "#d8ccae"; ctx.fillRect(9, 8, 1, 7);
        ctx.fillStyle = "#3a2e22"; ctx.fillRect(7, 5, 1, 2);   // the wick
        dirty(b);
        return b;
    });
    const flameBitmap = () => cached("flame", () => {
        const b = new Bitmap(10, 16), ctx = b.context, g = ctx.createRadialGradient(5, 11, 0, 5, 10, 7);
        g.addColorStop(0, "rgba(255,255,230,1)"); g.addColorStop(0.35, "rgba(255,226,120,1)"); g.addColorStop(0.75, "rgba(255,150,40,0.85)"); g.addColorStop(1, "rgba(255,120,30,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(5, 0.5); ctx.quadraticCurveTo(9.5, 8, 8.5, 12); ctx.quadraticCurveTo(5, 16.5, 1.5, 12); ctx.quadraticCurveTo(0.5, 8, 5, 0.5); ctx.fill();
        dirty(b);
        return b;
    });
    // a music note (Melia sings)
    const noteBitmap = k => cached("note" + k, () => {
        const b = new Bitmap(20, 24), ctx = b.context;
        ctx.lineJoin = "round"; ctx.lineCap = "round";
        const head = (x, y) => { ctx.beginPath(); ctx.ellipse(x, y, 3.6, 2.7, -0.45, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); };
        ctx.fillStyle = k ? "#ffe27a" : "#fff6dc";
        ctx.strokeStyle = "rgba(20,16,10,0.85)";
        ctx.lineWidth = 1.4;
        if (k) {   // two notes joined
            head(5, 19); head(15, 16);
            ctx.lineWidth = 4.2; ctx.beginPath(); ctx.moveTo(8, 18.6); ctx.lineTo(8, 5); ctx.lineTo(18, 2.5); ctx.lineTo(18, 15.6); ctx.stroke();
            ctx.lineWidth = 1.8; ctx.strokeStyle = "#ffe27a"; ctx.beginPath(); ctx.moveTo(8, 18.6); ctx.lineTo(8, 5); ctx.lineTo(18, 2.5); ctx.lineTo(18, 15.6); ctx.stroke();
        } else {
            head(7, 19);
            ctx.lineWidth = 4.2; ctx.beginPath(); ctx.moveTo(10.2, 18.4); ctx.lineTo(10.2, 3); ctx.quadraticCurveTo(12.5, 8, 16.5, 8.5); ctx.stroke();
            ctx.lineWidth = 1.8; ctx.strokeStyle = "#fff6dc"; ctx.beginPath(); ctx.moveTo(10.2, 18.4); ctx.lineTo(10.2, 3); ctx.quadraticCurveTo(12.5, 8, 16.5, 8.5); ctx.stroke();
        }
        dirty(b);
        return b;
    });
    const dropBitmap = () => cached("drop", () => {
        const b = new Bitmap(4, 6), ctx = b.context;
        ctx.fillStyle = "rgba(170,215,255,0.95)"; ctx.fillRect(1, 0, 2, 5); ctx.fillRect(0, 2, 4, 3);
        ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.fillRect(1, 1, 1, 2);
        dirty(b);
        return b;
    });
    // the water in the tub around the bather: a flat surface with light ripples (redrawn as it moves)
    function paintWater(b, t) {
        const ctx = b.context, w = b.width, h = b.height;
        b.clear();
        ctx.save();
        ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w / 2 - 1, h / 2 - 1, 0, 0, Math.PI * 2); ctx.clip();
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "rgba(160,198,212,0.78)"); g.addColorStop(1, "rgba(112,150,168,0.7)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const k = ((t / 50 + i / 3) % 1), rx = 6 + k * (w / 2 - 6), ry = 2 + k * (h / 2 - 2);
            ctx.globalAlpha = 0.7 * (1 - k);
            ctx.beginPath(); ctx.ellipse(w / 2, h / 2 - 1, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.restore();
        ctx.strokeStyle = "rgba(40,30,22,0.55)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w / 2 - 1, h / 2 - 1, 0, 0, Math.PI * 2); ctx.stroke();
        dirty(b);
    }

    // the plate of a dish on the table: the dish's icon on a plate, bitten more and more; at the end an empty plate (or mug)
    function iconInto(b, dish, x, y, size) {
        if (dish.sheet !== undefined) {
            const sheet = ImageManager.loadSystem(DISH_SHEET);
            if (sheet.isReady()) b.blt(sheet, dish.sheet * 32, 0, 32, 32, x, y, size, size);
        } else {
            const set = ImageManager.loadSystem("IconSet"), i = dish.icon;
            if (set.isReady()) b.blt(set, (i % 16) * 32, Math.floor(i / 16) * 32, 32, 32, x, y, size, size);
        }
    }
    function paintPlate(b, dish, eaten) {
        const ctx = b.context, w = b.width, h = b.height;
        b.clear();
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(w / 2, h - 5, 16, 4, 0, 0, Math.PI * 2); ctx.fill();
        const done = eaten >= 0.98;
        if (!dish.drink) {   // the plate under it (the bowls of soup stand on a small wooden board)
            ctx.fillStyle = dish.bowl ? "#5a3d24" : "#20170f";
            ctx.beginPath(); ctx.ellipse(w / 2, h - 8, 17, 6, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = dish.bowl ? "#8a6038" : "#e9e2d0";
            ctx.beginPath(); ctx.ellipse(w / 2, h - 9, 15.5, 5, 0, 0, Math.PI * 2); ctx.fill();
            if (!dish.bowl) { ctx.fillStyle = "#cfc5ad"; ctx.beginPath(); ctx.ellipse(w / 2, h - 9, 11, 3.2, 0, 0, Math.PI * 2); ctx.fill(); }
        }
        if (done) {
            if (dish.drink) {   // the empty mug, lying there
                ctx.globalAlpha = 0.9; iconInto(b, dish, w / 2 - 12, h - 28, 24); ctx.globalAlpha = 1;
                ctx.globalCompositeOperation = "source-atop"; ctx.fillStyle = "rgba(60,40,24,0.45)"; ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = "source-over";
            } else {   // crumbs and a spoon
                ctx.fillStyle = "#8c6a45";
                for (let i = 0; i < 6; i++) ctx.fillRect(Math.round(w / 2 - 8 + hash(i, 3) * 16), Math.round(h - 12 + hash(i, 5) * 5), 2, 1);
                ctx.fillStyle = "#b8b8b0"; ctx.fillRect(Math.round(w / 2 + 3), h - 12, 8, 1); ctx.fillRect(Math.round(w / 2 + 1), h - 13, 3, 2);
            }
        } else {
            iconInto(b, dish, w / 2 - 13, h - 30, 26);
            const bites = Math.floor(eaten * 7);
            if (bites > 0 && !dish.drink) {   // bites out of the top of the food
                ctx.globalCompositeOperation = "destination-out";
                for (let i = 0; i < bites; i++) {
                    const bx = w / 2 - 10 + hash(i, 7) * 20, by = h - 30 + hash(i, 9) * 10, r = 3 + hash(i, 11) * 3;
                    ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill();
                }
                ctx.globalCompositeOperation = "source-over";
            } else if (dish.drink && eaten > 0.02) {   // the drink goes down
                ctx.globalCompositeOperation = "destination-out";
                ctx.fillStyle = "rgba(0,0,0," + (0.55 * eaten).toFixed(2) + ")";
                ctx.fillRect(0, 0, w, Math.round(h - 30 + 10 * eaten));
                ctx.globalCompositeOperation = "source-over";
            }
        }
        dirty(b);
    }

    function makeFxSprite(o) {
        const s = new Sprite();
        s.anchor.set(0.5, 1);
        switch (o.kind) {
            case "plate": s.bitmap = new Bitmap(44, 36); s._eaten = -1; break;
            case "steam": s.bitmap = puffBitmap(); s.anchor.set(0.5, 0.5); s.z = 5; break;
            case "note": s.bitmap = noteBitmap(o.k || 0); s.anchor.set(0.5, 0.5); s.z = 5; break;
            case "drop": s.bitmap = dropBitmap(); s.z = 5; break;
            case "water": s.bitmap = new Bitmap(46, 16); s.anchor.set(0.5, 0.5); break;
            case "tray": s.bitmap = trayBitmap(); s.anchor.set(0.5, 0.5); break;
            case "bubble": s.bitmap = cached("bubble", () => { const b = new Bitmap(6, 6), c = b.context; c.strokeStyle = "rgba(255,255,255,0.85)"; c.lineWidth = 1; c.beginPath(); c.arc(3, 3, 2, 0, Math.PI * 2); c.stroke(); dirty(b); return b; }); s.anchor.set(0.5, 0.5); s.z = 5; break;
        }
        if (s.z === undefined) s.z = 3;
        return s;
    }
    // every map frame: move what moves, draw what changed, take away what is over
    function updateFx() {
        const tm = tilemap();
        for (let i = fx.length - 1; i >= 0; i--) {
            const o = fx[i];
            o.t++;
            if (o.gone || (o.life && o.t >= o.life) || !tm) {
                if (o.spr && o.spr.parent) o.spr.parent.removeChild(o.spr);
                fx.splice(i, 1);
                continue;
            }
            if (!o.spr || o.tm !== tm) { o.spr = makeFxSprite(o); o.tm = tm; tm.addChild(o.spr); }
            const s = o.spr, p = mapPx(o.x, o.y);
            const k = o.life ? o.t / o.life : 0;
            switch (o.kind) {
                case "plate":
                    if (s._eaten !== o.eaten) { s._eaten = o.eaten; paintPlate(s.bitmap, o.dish, o.eaten); }
                    s.x = p.x + (o.px || 0);
                    s.y = p.y + (o.py || 0) + 12 - Math.round(10 * Math.max(0, 1 - o.t / 8) * Math.max(0, 1 - o.t / 8));   // (it is put down: drops in)
                    s.z = 3;
                    if (o.hot && o.eaten < 0.9 && o.t % 16 === 0) addFx({ kind: "steam", x: o.x + (o.px || 0) / tw(), y: o.y + (o.py || 0) / th() - 0.35, life: 70, vx: (hash(o.t, 3) - 0.5) * 0.2, size: 0.5 });
                    break;
                case "steam":
                    s.x = p.x + Math.sin((o.t + o.x * 40) / 14) * 3 + (o.vx || 0) * o.t;
                    s.y = p.y - o.t * (o.rise || 0.45);
                    s.scale.set((o.size || 1) * (0.5 + k * 1.1));
                    s.opacity = Math.round(255 * Math.min(1, o.t / 10) * (1 - k));
                    break;
                case "note":
                    s.x = p.x + Math.sin(o.t / 11 + (o.ph || 0)) * 7 + (o.vx || 0) * o.t;
                    s.y = p.y - 30 - o.t * 0.55;
                    s.opacity = Math.round(255 * Math.min(1, o.t / 12) * (1 - k * k));
                    s.rotation = Math.sin(o.t / 9 + (o.ph || 0)) * 0.25;
                    break;
                case "drop":
                    s.x = p.x + (o.px || 0);
                    s.y = p.y + (o.py || 0) + o.t * o.t * 0.035;
                    s.opacity = Math.round(255 * (1 - k));
                    break;
                case "water":
                    s.x = p.x; s.y = p.y + (o.py || 0); s.z = 3;
                    if (o.t % 3 === 0) paintWater(s.bitmap, o.t);
                    s._sortY = s.y + (o.after || 0);   // (over the bather)
                    break;
                case "tray":
                    s.x = p.x; s.y = p.y - 6; s.z = 3;
                    s._sortY = s.y + 40;   // (on the blanket: over the bed)
                    s.opacity = Math.round(255 * Math.min(1, o.t / 20, (o.life - o.t) / 40));
                    break;
                case "bubble":
                    s.x = p.x + (o.px || 0) + Math.sin(o.t / 5) * 1.5;
                    s.y = p.y + (o.py || 0) - o.t * 0.25;
                    s.opacity = Math.round(255 * (1 - k));
                    break;
            }
        }
        updateCandles(tm);
    }
    // the tilemap sorts its children by z, then by y: the water over the bather must come after him, whatever his y
    const _Tilemap_compare = Tilemap.prototype._compareChildOrder;
    Tilemap.prototype._compareChildOrder = function(a, b) {
        const ay = a._sortY !== undefined ? a._sortY + 1 : null, by = b._sortY !== undefined ? b._sortY + 1 : null;
        if ((ay !== null || by !== null) && a.z === b.z) {
            const va = ay !== null ? ay : a.y, vb = by !== null ? by : b.y;
            if (va !== vb) return va - vb;
        }
        return _Tilemap_compare.call(this, a, b);
    };

    // ------------------------------------------------------------------
    // The room's candle: lit while the room is rented for the night - on a <Tavern:candle room=N> event, else on its stand by the
    // pillow. It also opens a hole in RoomLighting's darkness (the same way that plugin's own lights do).
    // ------------------------------------------------------------------
    const candles = [];   // { room, x, y, px, py, stand, spr, flame, glow, hole, tm }
    function candleSpots() {
        const out = [];
        for (const c of spots("candle")) out.push({ room: roomKey(c.a.room), x: c.ev.x, y: c.ev.y, px: 0, py: 0, stand: false });
        for (const b of spots("bed")) {
            const room = roomKey(b.a.room);
            if (!room || out.some(c => c.room === room)) continue;
            // (no candle of its own: a candle on its stand on the floor beside the pillow - left of the bed, right of it (a bed two
            // tiles wide: <Occupy:right=1>), else at its foot; wherever the floor is free)
            if (b.a.candle) { const [dx, dy] = String(b.a.candle).split(",").map(Number); out.push({ room, x: b.ev.x + (dx || 0), y: b.ev.y + (dy || 0), px: 0, py: 10, stand: true }); continue; }
            const occ = /<Occupy:([^>]*)>/i.exec((b.ev.event() && b.ev.event().note) || ""), size = { right: 0, down: 0 };
            if (occ) for (const part of occ[1].split(",")) { const [k, v] = part.split("=").map(t => t.trim()); if (k in size) size[k] = Number(v) || 0; }
            const x = b.ev.x, y = b.ev.y, floor = (tx, ty) => $gameMap.isValid(tx, ty) && $gameMap.checkPassage(tx, ty, 0x0f) && !blockedByEvent(tx, ty);
            const at = floor(x - 1, y) ? { x: x - 0.72, y: y - 0.1 } : floor(x + size.right + 1, y) ? { x: x + size.right + 0.72, y: y - 0.1 }
                : floor(x - 1, y + size.down) ? { x: x - 0.72, y: y + size.down - 0.1 } : { x: x + 0.5 * size.right, y: y + size.down + 0.8 };
            out.push({ room, x: at.x, y: at.y, px: 0, py: 10, stand: true });
        }
        return out;
    }
    let candleMap = 0, candleList = [];
    function updateCandles(tm) {
        if (!tm) return;
        const mapId = $gameMap.mapId();
        if (candleMap !== mapId || Graphics.frameCount % 120 === 0) {   // (the places, found again now and then: the events may come later)
            candleMap = mapId;
            const want = candleSpots();
            for (const c of candleList) if (!want.some(w => w.room === c.room && w.x === c.x && w.y === c.y)) removeCandle(c);
            candleList = want.map(w => candleList.find(c => c.room === w.room && c.x === w.x && c.y === w.y) || w);
        }
        const set = SceneManager._scene._spriteset;
        for (const c of candleList) {
            const lit = isRented(c.room);
            if (c.tm !== tm) { c.spr = c.flame = c.glow = c.hole = null; c.tm = tm; }
            if (!lit) { removeCandle(c, true); continue; }
            const p = mapPx(c.x, c.y);
            if (!c.spr) {
                c.spr = new Sprite(c.stand ? candleBitmap() : new Bitmap(1, 1));
                c.spr.anchor.set(0.5, 1);
                c.spr.z = 3;
                c.flame = new Sprite(flameBitmap());
                c.flame.anchor.set(0.5, 1);
                c.flame.z = 3;
                tm.addChild(c.spr);
                tm.addChild(c.flame);
                c.glow = new Sprite(glowBitmap());
                c.glow.anchor.set(0.5, 0.5);
                c.glow.blendMode = PIXI.BLEND_MODES.ADD;
                const box = set && set._roomLightingContainer;
                (box || tm).addChild(c.glow);
                if (!box) c.glow.z = 5;
                if (set && Array.isArray(set._roomHoles)) { c.hole = { shape: "circle", sprite: c.glow, radius: 78 }; set._roomHoles.push(c.hole); }
            }
            const flick = 0.85 + 0.15 * Math.sin(Graphics.frameCount / 5 + c.x) * Math.sin(Graphics.frameCount / 13 + c.y);
            c.spr.x = p.x + c.px; c.spr.y = p.y + c.py;
            c.flame.x = c.spr.x; c.flame.y = c.spr.y - (c.stand ? 23 : 8); c.flame.scale.set(0.9 + 0.12 * flick, 0.8 + 0.3 * flick);
            c.flame._sortY = c.spr.y;
            const inBox = c.glow.parent !== tm;
            c.glow.x = inBox ? Math.round($gameMap.adjustX(c.x + 0.5) * tw() + c.px) : c.flame.x;
            c.glow.y = inBox ? Math.round($gameMap.adjustY(c.y + 0.5) * th() + c.py - (c.stand ? 26 : 10)) : c.flame.y - 4;
            c.glow.scale.set(0.95 + 0.08 * flick);
            c.glow.opacity = Math.round(200 * flick);
        }
    }
    function removeCandle(c, keep) {
        for (const k of ["spr", "flame", "glow"]) if (c[k] && c[k].parent) c[k].parent.removeChild(c[k]);
        const set = SceneManager._scene && SceneManager._scene._spriteset;
        if (c.hole && set && Array.isArray(set._roomHoles)) { const i = set._roomHoles.indexOf(c.hole); if (i >= 0) set._roomHoles.splice(i, 1); }
        c.spr = c.flame = c.glow = c.hole = null;
        if (!keep) c.tm = null;
    }

    // ------------------------------------------------------------------
    // Coins: the money flies from the hand that pays to the one that takes it (screen space, over the map, under the windows)
    // ------------------------------------------------------------------
    const coinFx = [];
    function screenPointOf(target) {
        const s = SceneManager._scene;
        if (!(s instanceof Scene_Map) || !s._spriteset) return null;
        if (target && typeof target.screenX === "function") {
            const spr = s._spriteset._characterSprites.find(c => c._character === target);
            if (spr && spr.parent) {
                const h = typeof spr.patternHeight === "function" ? spr.patternHeight() : 48;
                const g = spr.toGlobal(new Point(0, -h * 0.55));
                return { x: g.x, y: g.y };
            }
        } else if (target && target.x !== undefined) {
            const tm = s._spriteset._tilemap, p = mapPx(target.x, target.y), g = tm.toGlobal(new Point(p.x, p.y - 12));
            return { x: g.x, y: g.y };
        }
        return null;
    }
    function coins(amount, from, to) {
        const a = screenPointOf(from), b = screenPointOf(to);
        if (!a || !b || !(amount > 0)) return;
        const n = clamp(Math.round(amount / 3), 1, 8);
        for (let i = 0; i < n; i++) coinFx.push({ a, b, t: -i * 5, life: 34, last: i === n - 1, first: i === 0, arc: 46 + hash(i, amount) * 30, spr: null });
    }
    function updateCoins(scene) {
        if (!scene._tavernCoins) return;
        const box = scene._tavernCoins;
        for (let i = coinFx.length - 1; i >= 0; i--) {
            const c = coinFx[i];
            c.t++;
            if (c.t < 0) continue;
            if (!c.spr || c.spr.parent !== box) {
                c.spr = new Sprite(ImageManager.loadSystem("IconSet"));
                c.spr.setFrame((GOLD_ICON % 16) * 32, Math.floor(GOLD_ICON / 16) * 32, 32, 32);
                c.spr.anchor.set(0.5, 0.5);
                c.spr.scale.set(0.7);
                box.addChild(c.spr);
                if (c.first) se("Coin", 55, 110);
            }
            const k = ease(c.t / c.life), x = lerp(c.a.x, c.b.x, k), y = lerp(c.a.y, c.b.y, k) - Math.sin(Math.PI * k) * c.arc;
            c.spr.x = x; c.spr.y = y;
            c.spr.scale.set(0.7 * (1 - 0.25 * Math.sin(Math.PI * k)), 0.7);
            if (c.t >= c.life) {
                if (c.last) se("Coin", 75, 95);
                box.removeChild(c.spr);
                coinFx.splice(i, 1);
            }
        }
    }
    // pays: the gold goes, the coins fly to `to` (an event or a place); false (and the popup over the player) when it is not enough
    function pay(price, to) {
        if (gold() < price) { needGold(price); return false; }
        if (price > 0) {
            $gameParty.loseGold(price);
            spend(price);
            coins(price, $gamePlayer, to || null);
            popup(GOLD_ICON, "−" + price + " G", WARM);
        }
        return true;
    }

    // ------------------------------------------------------------------
    // Walking about by himself (to the table, to the tub): a path over the tiles (4 ways, free of blocking events), walked tile by
    // tile with the engine's glide (FreeMovement glides the same way)
    // ------------------------------------------------------------------
    const DIRS = [[0, 1, 2], [-1, 0, 4], [1, 0, 6], [0, -1, 8]];
    function blockedByEvent(x, y) {
        return $gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && !e.isThrough());
    }
    // tiles from (x0,y0) to a tile next to (tx,ty) (the target itself may be a chair or a tub, not walkable): [{x, y, d}] or null
    function pathTo(tx, ty, maxLen) {
        const x0 = $gamePlayer.x, y0 = $gamePlayer.y, key = (x, y) => x + "," + y, prev = new Map([[key(x0, y0), null]]);
        const goal = (x, y) => Math.abs(x - tx) + Math.abs(y - ty) === 1;
        if (goal(x0, y0)) return [];
        let front = [[x0, y0]], found = null;
        for (let depth = 0; depth < (maxLen || 30) && front.length && !found; depth++) {
            const next = [];
            for (const [x, y] of front) {
                for (const [dx, dy, d] of DIRS) {
                    const nx = x + dx, ny = y + dy, k = key(nx, ny);
                    if (prev.has(k) || !$gameMap.isValid(nx, ny) || !$gameMap.isPassable(x, y, d) || !$gameMap.isPassable(nx, ny, 10 - d) || blockedByEvent(nx, ny)) continue;
                    prev.set(k, { x, y, d, nx, ny });
                    if (goal(nx, ny)) { found = k; break; }
                    next.push([nx, ny]);
                }
                if (found) break;
            }
            front = next;
        }
        if (!found) return null;
        const out = [];
        for (let k = found; prev.get(k); ) { const p = prev.get(k); out.unshift({ x: p.nx, y: p.ny, d: p.d }); k = key(p.x, p.y); }
        return out;
    }
    function glideTo(ch, x, y) {
        ch._x = x;
        ch._y = y;
        if (ch.isFreeMoving && ch.isFreeMoving()) ch._gridGlide = true;
    }
    const arrived = ch => () => ch._realX === ch._x && ch._realY === ch._y;
    const dirTo = (ax, ay, bx, by) => (Math.abs(bx - ax) > Math.abs(by - ay) ? (bx > ax ? 6 : 4) : (by > ay ? 2 : 8));
    // walks up to (tx,ty) and onto it; too far or no way: a short dip to black and he is there
    function* walkOnto(tx, ty, faceDir) {
        const p = $gamePlayer, path = TL.walk === false ? null : pathTo(tx, ty, 24);
        if (!path) {
            yield* dip(() => { p.locate(tx, ty); p.setDirection(faceDir); }, 12);
            return;
        }
        for (const step of path) {
            p.setDirection(step.d);
            glideTo(p, step.x, step.y);
            yield arrived(p);
        }
        p.setDirection(dirTo(p.x, p.y, tx, ty));
        glideTo(p, tx, ty);
        yield arrived(p);
        p.setDirection(faceDir);
    }
    // off a chair or out of the tub: onto the nearest free tile around (the way he came first)
    function* stepOff(x, y, prefer) {
        const p = $gamePlayer, order = DIRS.slice().sort((a, b) => (b[2] === prefer) - (a[2] === prefer));
        for (const [dx, dy, d] of order) {
            const nx = x + dx, ny = y + dy;
            if (!$gameMap.isValid(nx, ny) || !$gameMap.isPassable(nx, ny, 10 - d) || blockedByEvent(nx, ny)) continue;
            p.setDirection(d);
            glideTo(p, nx, ny);
            yield arrived(p);
            return;
        }
    }

    // ==================================================================
    // The card: a menu over the map in the game's black and yellow - the list on the left, what the chosen line is on the right
    // (the dishes at Borgar's, the rooms). The talk waits for it; the choice is read by the next step of the talk.
    // ==================================================================
    const CARD = { w: 836, h: 580, listW: 390, row: 56, rows: 7, head: 96, foot: 58 };   // (between the busts of the talk: they stay beside it)
    let card = null;   // { spec, pick, back, panel, win }
    function cardFont(b, size, colour, bold) {
        b.fontSize = size;
        b.textColor = colour || U().text;
        b.fontBold = !!bold;
        b.outlineWidth = 0;
    }
    function cardText(b, s, x, y, w, size, colour, bold, align) {
        cardFont(b, size, colour, bold);
        b.drawText(String(s), x, y, w, Math.round(size * 1.4), align || "left");
        b.fontBold = false;
    }
    function wrapText(b, s, w, size) {
        cardFont(b, size);
        const out = [];
        for (const para of String(s).split("\n")) {
            let line = "";
            for (const word of para.split(" ")) {
                const t = line ? line + " " + word : word;
                if (line && b.measureTextWidth(t) > w) { out.push(line); line = word; } else line = t;
            }
            out.push(line);
        }
        return out;
    }
    function panelInto(b, x, y, w, h, opts) {
        const S0 = U();
        if (S0.panel) S0.panel(b.context, x, y, w, h, opts);
        else { b.fillRect(x, y, w, h, (opts && opts.fill) || S0.fill); }
        dirty(b);
    }
    function keyCapInto(b, label, x, y) {
        cardFont(b, 15, U().text, true);
        const w = Math.max(24, Math.ceil(b.measureTextWidth(label)) + 12);
        panelInto(b, x, y, w, 24, { cut: 3, fill: "#1b1e24", accent: false });
        cardText(b, label, x, y + 1, w, 15, U().text, true, "center");
        return w;
    }
    function keyHintsInto(b, hints, x, y) {
        for (const [k, what] of hints) {
            x += keyCapInto(b, k, x, y) + 7;
            cardFont(b, 17, U().muted);
            const w = Math.ceil(b.measureTextWidth(what));
            cardText(b, what, x, y + 1, w + 4, 17, U().muted);
            x += w + 22;
        }
        return x;
    }

    function Window_TavernList() {
        this.initialize(...arguments);
    }
    Window_TavernList.prototype = Object.create(Window_Selectable.prototype);
    Window_TavernList.prototype.constructor = Window_TavernList;
    Window_TavernList.prototype.initialize = function(rect, spec) {
        this._spec = spec;
        Window_Selectable.prototype.initialize.call(this, rect);
        this.opacity = 0;
        this.refresh();
    };
    Window_TavernList.prototype.maxItems = function() { return this._spec.entries.length; };
    Window_TavernList.prototype.itemHeight = function() { return CARD.row; };
    Window_TavernList.prototype.entry = function() { return this._spec.entries[this.index()] || null; };
    Window_TavernList.prototype.isCurrentItemEnabled = function() { const e = this.entry(); return !!e && e.enabled !== false; };
    Window_TavernList.prototype.drawItem = function(i) {
        const e = this._spec.entries[i], r = this.itemLineRect(i), b = this.contents, S0 = U();
        this.changePaintOpacity(e.enabled !== false);
        const iy = r.y + Math.round((CARD.row - 8 - 32) / 2);
        drawEntryIcon(b, e, r.x + 2, iy, 32);
        const x = r.x + 44, right = r.x + r.width;
        // the price on the right (the day's dish: the old one crossed out above it)
        cardFont(b, 22, S0.accent, true);
        const price = e.right || "", pw = Math.ceil(b.measureTextWidth(price));
        cardText(b, price, right - pw - 2, r.y + 8, pw + 4, 22, e.enabled === false ? BAD : S0.accent, true);
        if (e.oldRight) {
            cardFont(b, 14, S0.muted);
            const ow = Math.ceil(b.measureTextWidth(e.oldRight));
            cardText(b, e.oldRight, right - ow - 2, r.y - 4, ow + 4, 14, S0.muted);
            b.fillRect(right - ow - 3, r.y + 6, ow + 3, 1, S0.muted);
        }
        cardText(b, e.name, x, r.y + 1, right - x - pw - 12, 21, S0.text, false);
        if (e.badge) {
            cardFont(b, 12, "#15171b", true);
            const bw = Math.ceil(b.measureTextWidth(e.badge)) + 12;
            b.fillRect(x, r.y + 30, bw, 17, S0.accent);
            cardText(b, e.badge, x, r.y + 29, bw, 12, "#15171b", true, "center");
            cardText(b, e.sub || "", x + bw + 8, r.y + 27, right - x - bw - 20, 15, S0.accent);
        } else cardText(b, e.sub || "", x, r.y + 27, right - x - 10, 15, S0.muted);
        this.changePaintOpacity(true);
    };
    Window_TavernList.prototype.select = function(index) {
        Window_Selectable.prototype.select.call(this, index);
        if (this._onSelect) this._onSelect(index);
    };
    Window_TavernList.prototype.processOk = function() {
        if (this.isCurrentItemEnabled()) { Window_Selectable.prototype.processOk.call(this); return; }
        this.playBuzzerSound();
        const e = this.entry();
        if (e && e.why) e.why();
    };

    function drawEntryIcon(b, e, x, y, size) {
        if (e.dish) iconInto(b, e.dish, x, y, size);
        else if (e.icon) {
            const set = ImageManager.loadSystem("IconSet");
            if (set.isReady()) b.blt(set, (e.icon % 16) * 32, Math.floor(e.icon / 16) * 32, 32, 32, x, y, size, size);
        } else if (e.room) paintRoomIcon(b, e.room, x, y, size);
    }

    function Sprite_TavernCard() {
        this.initialize(...arguments);
    }
    Sprite_TavernCard.prototype = Object.create(Sprite.prototype);
    Sprite_TavernCard.prototype.constructor = Sprite_TavernCard;
    Sprite_TavernCard.prototype.initialize = function(spec) {
        Sprite.prototype.initialize.call(this, new Bitmap(CARD.w, CARD.h));
        this._spec = spec;
        this._index = -1;
        this._t = 0;
        this.x = Math.round((Graphics.width - CARD.w) / 2);
        this.y = Math.round((Graphics.height - CARD.h) / 2);
        this.opacity = 0;
    };
    Sprite_TavernCard.prototype.show = function(index) {
        this._index = index;
        this.redraw();
    };
    Sprite_TavernCard.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this._t++;
        this.opacity = Math.min(255, this.opacity + 32);
        if (this._t % 20 === 0 && !this._ready && ImageManager.loadSystem("IconSet").isReady() && ImageManager.loadSystem(DISH_SHEET).isReady()) { this._ready = true; this.redraw(); if (card && card.win) card.win.refresh(); }
    };
    Sprite_TavernCard.prototype.redraw = function() {
        const b = this.bitmap, spec = this._spec, S0 = U(), W0 = CARD.w, H0 = CARD.h;
        b.clear();
        panelInto(b, 0, 0, W0, H0, { cut: 10 });
        cardText(b, spec.kicker, 30, 18, 600, 15, S0.muted, true);
        cardText(b, spec.title, 30, 38, 600, 36, S0.accent, true);
        // the purse
        cardText(b, "SAKIEWKA", W0 - 230, 22, 200, 13, S0.muted, true, "right");
        cardFont(b, 26, S0.accent, true);
        const g = gold() + " G", gw = Math.ceil(b.measureTextWidth(g));
        cardText(b, g, W0 - 30 - gw - 4, 40, gw + 6, 26, S0.accent, true);
        const set = ImageManager.loadSystem("IconSet");
        if (set.isReady()) b.blt(set, (GOLD_ICON % 16) * 32, Math.floor(GOLD_ICON / 16) * 32, 32, 32, W0 - 30 - gw - 38, 42, 30, 30);
        b.fillRect(24, CARD.head - 6, W0 - 48, 1, S0.line);
        b.fillRect(24, CARD.head - 6, 64, 2, S0.accent);
        // the detail of the chosen line
        const dx = CARD.listW + 44, dw = W0 - dx - 30, dy = CARD.head + 8, dh = H0 - CARD.head - CARD.foot - 16;
        b.fillRect(dx - 18, dy + 4, 1, dh - 8, S0.line);
        const e = spec.entries[this._index];
        if (e && spec.detail) spec.detail(b, e, dx, dy, dw, dh);
        // the foot: keys and a word
        const fy = H0 - CARD.foot + 14;
        b.fillRect(24, H0 - CARD.foot, W0 - 48, 1, S0.line);
        keyHintsInto(b, [["↑↓", "wybór"], ["O", spec.okWord || "wybierz"], ["P", "wróć"]], 30, fy);
        if (spec.foot) cardText(b, spec.foot, W0 - 430, fy, 400, 16, S0.muted, false, "right");
        dirty(b);
    };

    function openCard(spec) {
        const scene = SceneManager._scene;
        if (!(scene instanceof Scene_Map) || card) return false;
        const back = new Sprite(new Bitmap(4, 4));
        back.bitmap.fillAll("#000000");
        back.scale.set(Graphics.width / 4, Graphics.height / 4);
        back.opacity = 0;
        const panel = new Sprite_TavernCard(spec);
        const at = scene.getChildIndex(scene._windowLayer);
        scene.addChildAt(back, at);
        scene.addChildAt(panel, at + 1);
        const layer = scene._windowLayer, lx = layer ? layer.x : 0, ly = layer ? layer.y : 0;
        const rect = new Rectangle(panel.x + 14 - lx, panel.y + CARD.head + 2 - ly, CARD.listW + 12, CARD.row * CARD.rows + 24);
        const win = new Window_TavernList(rect, spec);
        win._onSelect = i => panel.show(i);
        win.setHandler("ok", () => closeCard(win.entry()));
        win.setHandler("cancel", () => closeCard(null));
        scene.addWindow(win);
        card = { spec, pick: undefined, back, panel, win, t: 0 };
        win.select(clamp(spec.index || 0, 0, Math.max(0, spec.entries.length - 1)));
        win.activate();
        se("Book1", 55, 110);
        return true;
    }
    function closeCard(pick) {
        if (!card) return;
        const c = card;
        c.pick = pick;
        for (const s of [c.back, c.panel]) if (s.parent) s.parent.removeChild(s);
        if (c.win.parent) c.win.parent.removeChild(c.win);
        c.win.deactivate();
        lastPick = { key: c.spec.key, pick };
        card = null;
        Input.clear();
        TouchInput.clear();
    }
    let lastPick = null;
    function takePick(key) {
        const p = lastPick && lastPick.key === key ? lastPick.pick : null;
        lastPick = null;
        return p;
    }
    // the dim backdrop fades in with the card
    function updateCard() {
        if (!card) return;
        card.t++;
        card.back.opacity = Math.min(120, card.t * 12);
        const talk = window.SpeechBubbles && SpeechBubbles.talk ? SpeechBubbles.talk() : null;   // Borgar and the hero stay beside the card
        if (talk && talk.on) talk.idle = 0;
    }

    // ==================================================================
    // MEAL: Borgar's card of dishes, the dish of the day, a seat at a free table, the plate, the time it takes, the food and "Ugoszczony"
    // ==================================================================
    const DISHES = [
        { id: "gulasz", item: 130, name: "Gulasz", price: num(params.priceGulasz, 16), bowl: true, hot: true, minutes: 30, hosted: 6,
            sub: "gorący · syci na długo · rozgrzewa",
            desc: "Gęsty gulasz z wołowiny, marchwi i kapusty, od rana pyrkający w żeliwnym garze. Łyżka w nim stoi.",
            order: "Gulasz! Siadaj, już nakładam - z samego dna, tam najlepszy.", bite: "Łyżka naprawdę w nim stoi... Borgar, ty stary czarodzieju." },
        { id: "kapusniak", item: 131, name: "Kapuśniak", price: num(params.priceKapusniak, 12), bowl: true, hot: true, minutes: 30, hosted: 6,
            sub: "gorący · kwaśny · rozgrzewa",
            desc: "Kwaśny kapuśniak na wędzonce, z ziemniakami i koperkiem. Rozgrzewa aż po palce u stóp.",
            order: "Kapuśniak, jak u matki. No, prawie - matka sypała więcej pieprzu. Siadaj!", bite: "Kwaśny, gorący... jak u dziadka Stacha. Tylko bez gderania." },
        { id: "pieczen", sheet: 0, popupIcon: 423, name: "Pieczeń z kaszą", price: num(params.pricePieczen, 18), hot: true, minutes: 30, hosted: 7,
            food: { stamina: 70, buff: "sated", hours: 8, fed: 70, water: 4 }, sub: "najbardziej sycące danie karczmy",
            desc: "Pieczeń wieprzowa z chrupiącą skórką, kasza gryczana i sos prosto z brytfanny. Po tym człowiek nie myśli o jedzeniu do wieczora.",
            order: "Pieczeń z kaszą? Ha, dziś świętujesz! Siadaj, zaraz podam.", bite: "Skórka chrupie, kasza pachnie... mogę tu zamieszkać?" },
        { id: "placek", sheet: 1, popupIcon: 398, name: "Placek z serem", price: num(params.pricePlacek, 9), minutes: 20, hosted: 4,
            food: { stamina: 36, buff: "sated", hours: 3, fed: 32, water: 4 }, sub: "słodki · na ząb",
            desc: "Ciepły placek drożdżowy z twarogiem i łyżką miodu z pasieki za młynem. Kruszy się na brodę.",
            order: "Placek z serem, na słodko! Siadaj, zaraz przyniosę.", bite: "Słodki jak... no, jak placek z serem. I tyle mi trzeba." },
        { id: "chleb", sheet: 2, popupIcon: 339, name: "Chleb ze smalcem", price: num(params.priceChleb, 5), minutes: 15, hosted: 3,
            food: { stamina: 26, buff: "sated", hours: 2, fed: 28, water: 0 }, sub: "tanio · szybko · klasyka",
            desc: "Gruba pajda razowca, smalec ze skwarkami i ogórek kiszony. Klasyka za grosze.",
            order: "Chleb ze smalcem - jedzenie królów. Biednych królów. Siadaj!", bite: "Skwarki! Ogórek! Nic więcej do szczęścia." },
        { id: "piwo", item: 81, name: "Kufel piwa", price: num(params.pricePiwo, 4), drink: true, minutes: 15, hosted: 2,
            sub: "zimne · z beczki Borgara",
            desc: "Złociste, z własnej beczki Borgara. Piana na dwa palce, chłód prosto z piwnicy.",
            order: "Kufel już się napełnia. Siadaj, bo po piwie lepiej siedzieć.", bite: "Ach... piana na wąsach, spokój w duszy." },
        { id: "miod", item: 137, name: "Miód pitny", price: num(params.priceMiod, 8), drink: true, minutes: 15, hosted: 3,
            sub: "słodki · mocny · rozgrzewa",
            desc: "Trójniak z pasieki za młynem. Słodki, mocny i zdradliwy - wchodzi jak woda, wychodzi nogami.",
            order: "Miód pitny? Tylko ostrożnie - wchodzi jak woda, wychodzi nogami.", bite: "Słodki... i zdradliwy. Już go czuję w kolanach." }
    ];
    const dishById = id => DISHES.find(d => d.id === id) || null;
    for (const d of DISHES) Object.defineProperty(d, "icon", { get() { return this.item && item(this.item) ? item(this.item).iconIndex : this.popupIcon || 0; } });
    const MAINS = DISHES.filter(d => !d.drink);
    function dishOfDay(d) {
        return MAINS[Math.floor(hash(d === undefined ? day() : d, 91) * MAINS.length) % MAINS.length];
    }
    function priceOf(dish, d) {
        const day0 = dishOfDay(d) === dish ? 1 - DAY_DISCOUNT : 1, k = day0 * (1 - repDiscount());
        return k < 1 ? Math.max(1, Math.round(dish.price * k)) : dish.price;
    }
    function foodOf(dish) {
        return dish.food || (window.FoodTable && dish.item ? FoodTable.eatInfo(dish.item) : null) || { stamina: 20 };
    }
    // eats it: the food's own effect (the one food table, FoodTable - or the tavern's own values) and "Ugoszczony" on top
    function eatDish(dish) {
        const food = foodOf(dish), parts = [], before = $gameSystem.stamina();
        if (food.stamina) $gameSystem.changeStamina(food.stamina * (1 + perk("food.value")));
        const gained = Math.round($gameSystem.stamina() - before);
        if (gained > 0) parts.push("+" + gained + " wytrzymałości");
        for (const [b, h] of [[food.buff, food.hours], [food.buff2, food.hours2]]) {
            if (!b || !(h > 0) || !SV || !SV.BUFFS || !SV.BUFFS[b]) continue;
            const hh = Math.round(h * (1 + perk("food.buff")) * 10) / 10;
            addBuff(b, hh);
            parts.push(SV.BUFFS[b].name + " (" + hoursText(hh) + ")");
        }
        if (window.Needs && Needs.eat) { const extra = Needs.eat(dish.item ? item(dish.item) : null, food); if (extra) parts.push(extra); }
        addBuff("hosted", dish.hosted);
        parts.push("Ugoszczony (" + hoursText(dish.hosted) + ")");
        popup(dish.icon, (dish.drink ? "Wypiłeś: " : "Zjadłeś: ") + dish.name + ". " + parts.join(", ") + ".", GOOD);
        const s = S();
        s.meals++;
        s.dishes[dish.id] = (s.dishes[dish.id] || 0) + 1;
        if (first("meal")) {
            note("Karczma Borgara", "U Borgara zjesz gorący posiłek za parę monet: przy ladzie wybierasz z karty, siadasz przy wolnym stole, a on podaje. Codziennie inne danie dnia jest tańsze.\n" +
                "Po posiłku w tawernie jestem Ugoszczony: przez kilka godzin głód i pragnienie rosną o " + Math.round(HOSTED_NEEDS * 100) + "% wolniej.");
            xp(10, "pierwszy posiłek w tawernie");
        }
    }
    // the facts of a dish, as the card lists them: [glyph, text, colour]
    function dishFacts(dish) {
        const food = foodOf(dish), out = [];
        if (food.stamina) out.push(["stamina", "Wytrzymałość +" + food.stamina]);
        if (window.Needs && Needs.enabled && Needs.enabled()) {
            if (food.fed) out.push(["food", "Sytość +" + food.fed]);
            if (food.water) out.push(["water", "Nawodnienie +" + food.water]);
        }
        for (const [b, h] of [[food.buff, food.hours], [food.buff2, food.hours2]]) if (b && h > 0 && SV && SV.BUFFS && SV.BUFFS[b]) out.push([b, SV.BUFFS[b].name + " · " + hoursText(h)]);
        out.push(["hosted", "Ugoszczony · " + hoursText(dish.hosted), U().accent]);
        return out;
    }
    function detailIllustration(b, x, y, w, h, paint) {
        panelInto(b, x, y, w, h, { cut: 6, fill: "#15110d", line: "#3b3026", accent: false });
        const ctx = b.context;
        ctx.save();
        ctx.beginPath(); ctx.rect(x + 1, y + 1, w - 2, h - 2); ctx.clip();
        const g = ctx.createRadialGradient(x + w / 2, y + h * 0.55, 10, x + w / 2, y + h * 0.55, w * 0.62);
        g.addColorStop(0, "rgba(255,190,110,0.22)"); g.addColorStop(1, "rgba(0,0,0,0)");
        // the table's boards
        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = i % 2 ? "#3a2716" : "#402b18";
            ctx.fillRect(x, y + i * (h / 6), w, Math.ceil(h / 6));
            ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(x, y + (i + 1) * (h / 6) - 1, w, 1);
        }
        ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
        paint(ctx);
        ctx.restore();
        dirty(b);
    }
    function detailDish(b, e, x, y, w, h) {
        const dish = e.dish, S0 = U(), ih = 176;
        detailIllustration(b, x, y, w, ih, ctx => {
            const cx = x + w / 2, cy = y + ih / 2 + 10;
            ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.beginPath(); ctx.ellipse(cx, cy + 34, 92, 22, 0, 0, Math.PI * 2); ctx.fill();
            if (!dish.drink) {
                ctx.fillStyle = dish.bowl ? "#5a3d24" : "#1e1710"; ctx.beginPath(); ctx.ellipse(cx, cy + 26, 88, 26, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = dish.bowl ? "#8a6038" : "#ece5d3"; ctx.beginPath(); ctx.ellipse(cx, cy + 23, 83, 22, 0, 0, Math.PI * 2); ctx.fill();
                if (!dish.bowl) { ctx.fillStyle = "#d6ccb4"; ctx.beginPath(); ctx.ellipse(cx, cy + 23, 58, 14, 0, 0, Math.PI * 2); ctx.fill(); }
            }
            ctx.imageSmoothingEnabled = false;
            iconInto(b, dish, cx - 56, cy - 70, 112);
            if (dish.hot) {   // steam
                ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 3; ctx.lineCap = "round";
                for (const k of [-26, 0, 26]) {
                    ctx.beginPath(); ctx.moveTo(cx + k, cy - 70); ctx.bezierCurveTo(cx + k - 12, cy - 86, cx + k + 12, cy - 98, cx + k, cy - 114); ctx.stroke();
                }
            }
        });
        let ty = y + ih + 12;
        cardText(b, dish.name, x, ty, w - 110, 26, S0.accent, true);
        cardText(b, e.right, x + w - 110, ty + 2, 110, 24, e.enabled === false ? BAD : S0.accent, true, "right");
        ty += 38;
        for (const l of wrapText(b, dish.desc, w, 18).slice(0, 3)) { cardText(b, l, x, ty, w, 18, "#d8dde3"); ty += 25; }
        ty += 8;
        const facts = dishFacts(dish), colW = Math.floor((w - 12) / 2);
        facts.forEach((f, i) => {
            const fx = x + (i % 2) * (colW + 12), fy = ty + Math.floor(i / 2) * 28;
            if (S0.chip) S0.chip(b.context, f[0], fx, fy + 2, 20, f[0] === "hosted" ? S0.accent : undefined);
            cardText(b, f[1], fx + 28, fy, colW - 30, 17, f[2] || S0.text);
        });
        dirty(b);
    }
    function mealCardSpec() {
        const dd = dishOfDay();
        const entries = DISHES.map(d => {
            const price = priceOf(d), can = gold() >= price;
            return { dish: d, name: d.name, right: price + " G", oldRight: price !== d.price ? d.price + " G" : "", badge: d === dd ? "DANIE DNIA" : "",
                sub: d === dd ? "−" + Math.round(DAY_DISCOUNT * 100) + "% · " + d.sub : d.sub, enabled: can, why: () => needGold(price) };
        });
        return { key: "meal", kicker: "KARCZMA „POD ZŁOTYM KUFLEM” · KUCHNIA BORGARA", title: "Karta dań", entries, detail: detailDish, okWord: "zamów",
            foot: repFoot() || "Posiłek przy stole: 15-30 minut", index: Math.max(0, DISHES.indexOf(dd)) };
    }
    // a free seat at a table: the nearest <Tavern:mealtable> nobody sits at
    function freeSeat() {
        const all = spots("mealtable").filter(s => !$gameMap.eventsXyNt(s.ev.x, s.ev.y).some(e => e !== s.ev && e.isNormalPriority() && !e.isThrough()));
        all.sort((a, b) => Math.hypot(a.ev.x - $gamePlayer.x, a.ev.y - $gamePlayer.y) - Math.hypot(b.ev.x - $gamePlayer.x, b.ev.y - $gamePlayer.y));
        const s = all[0];
        if (!s) return null;
        const x = s.ev.x, y = s.ev.y;
        let dir = Number(s.a.dir) || 0;
        if (![2, 4, 6, 8].includes(dir)) {   // facing the table: the side that is not a floor
            dir = 8;
            for (const d of [8, 4, 6, 2]) { const [dx, dy] = d === 8 ? [0, -1] : d === 2 ? [0, 1] : d === 4 ? [-1, 0] : [1, 0]; if (!$gameMap.isPassable(x + dx, y + dy, 10 - d)) { dir = d; break; } }
        }
        let plate;
        if (s.a.plate) { const [dx, dy] = String(s.a.plate).split(",").map(Number); plate = { x: x + (dx || 0), y: y + (dy || 0) }; }
        else plate = { x: x + (dir === 6 ? 1 : dir === 4 ? -1 : 0), y: y + (dir === 2 ? 1 : dir === 8 ? -1 : 0) };
        plate.py = dir === 8 ? 14 : dir === 2 ? -8 : 4;
        return { x, y, dir, lift: num(s.a.lift, 12), plate };
    }
    function counterPlate() {
        const c = spots("meal")[0];
        const p = $gamePlayer, d = p.direction();
        if (c) return { x: c.ev.x, y: c.ev.y, py: -4 };
        return { x: p.x + (d === 6 ? 1 : d === 4 ? -1 : 0), y: p.y + (d === 2 ? 1 : d === 8 ? -1 : 0), py: -4 };
    }
    const SIT_KIND = 11;
    function* mealSeq(dish) {
        const p = $gamePlayer, seat = freeSeat();
        let done = false, sat = false;
        const from = { x: p.x, y: p.y };
        if (seat) {
            yield* walkOnto(seat.x, seat.y, seat.dir);
            sat = !!(p.startToolSwing && p.startToolSwing(SIT_KIND, () => {}, null, { keepOnMove: true, still: false, wobble: 30, lift: seat.lift, holdWhile: () => !done }));
            if (sat) yield () => swingWaiting() || !p.isToolSwinging();
        } else {
            bark($gamePlayer, "Stoły zajęte? Zjem przy ladzie.", 110);
        }
        yield W(18);
        const at = seat ? seat.plate : counterPlate();
        const plate = addFx({ kind: "plate", dish, x: at.x, y: at.y, py: at.py || 0, eaten: 0, hot: !!dish.hot });
        se(dish.drink ? "Equip2" : "Equip1", 55, 115);
        yield W(24);
        const frames = W(90 + dish.minutes * 5);
        for (let i = 1; i <= frames; i++) {
            pass(dish.minutes / 60 / frames);
            plate.eaten = i / frames;
            if (i === Math.round(frames * 0.4)) bark(p, dish.bite, 150);
            if (i % 55 === 30) se(dish.drink ? "Water1" : "Equip1", 22, dish.drink ? 150 : 145);
            yield 1;
        }
        plate.eaten = 1;
        eatDish(dish);
        done = true;
        if (sat) yield () => !p.isToolSwinging();
        if (seat) yield* stepOff(seat.x, seat.y, dirTo(seat.x, seat.y, from.x, from.y));
        plate.life = plate.t + W(900);   // (the empty plate stays a while)
    }
    function startMeal(dish, interp) {
        begin(mealSeq(dish), () => { if ($gamePlayer._toolSwing && $gamePlayer._toolSwing._swingKind === SIT_KIND) $gamePlayer._toolSwing.opts.holdWhile = () => false; });
        if (interp) hold(interp);
    }
    // the talk at the counter: the greeting (the dish of the day), the card, then the order
    function mealTalk() {
        const o = [], dd = dishOfDay(), h = hour();
        repLine(o);
        const greet = h < 11 ? "Śniadanko? Kuchnia już grzeje." : h < 17 ? "Głodny? U mnie nikt nie wychodzi głodny. Najwyżej biedniejszy." : h < 22 ? "Wieczór bez kolacji to wieczór stracony. Co podać?" : "O tej porze? Kuchnia prawie zgaszona, ale dla ciebie coś się znajdzie.";
        sayAs(o, "borgar", greet + " Dziś danie dnia: " + dd.name.toLowerCase() + " - " + priceOf(dd) + " G zamiast " + dd.price + ".");
        if (!S().firsts.meal) sayAs(o, "borgar", "Wybierasz z karty, płacisz, siadasz przy wolnym stole - a ja podaję. Kto zje u mnie, ten przez parę godzin jest ugoszczony: głód i pragnienie mniej mu dokuczają.");
        script(o, "TavernLife.card(this, 'meal')");
        script(o, "TavernLife.step(this, 'meal')");
        return o;
    }

    // ==================================================================
    // THE TAVERN'S REPUTATION ("Sława w tawernie", QuestBoard.js): Borgar's discounts, the big chamber, the Apartamenty. Without
    // QuestBoard.js the reputation is 0: no discounts, the chamber and the Apartamenty stay shut.
    // ==================================================================
    const REP_DISCOUNT = [0, 0].concat(nums(params.repDiscounts, "5,10,15").slice(0, 3).map(n => n / 100));   // by tier: 0 Nowy w okolicy .. 4 Chluba tawerny
    const REP_NAMES = ["Nowy w okolicy", "Znajoma twarz", "Swój chłop", "Pewna ręka", "Chluba tawerny"];
    const REP_AT = [0, 20, 40, 60, 80];
    const QB = () => window.QuestBoard || null;
    function reputation() {
        const Q = QB();
        return Q && typeof Q.reputation === "function" ? Number(Q.reputation()) || 0 : 0;
    }
    function repTierOf(rep) {
        const Q = QB(), tiers = Q && Q.TIERS ? Q.TIERS.map(t => t.rep) : REP_AT;
        let t = 0;
        tiers.forEach((at, i) => { if (rep >= at) t = i; });
        return t;
    }
    const repTier = () => repTierOf(reputation());
    function tierName(t) {
        const Q = QB();
        return (Q && Q.TIERS && Q.TIERS[t] && Q.TIERS[t].name) || REP_NAMES[t] || REP_NAMES[0];
    }
    const repDiscount = () => REP_DISCOUNT[repTier()] || 0;
    const repPrice = base => { const d = repDiscount(); return d > 0 && base > 0 ? Math.max(1, Math.round(base * (1 - d))) : base; };
    const pct = d => Math.round(d * 100) + "%";
    // Borgar says it once for each tier that brings a discount (the first talk with him about food or a room after it comes)
    const REP_LINES = {
        2: "Słyszę, co robisz dla ludzi z tablicy. Swój chłop z ciebie! Od dziś liczę ci wszystko " + pct(REP_DISCOUNT[2]) + " taniej - jedzenie, pokój i łaźnię.",
        3: "Pewna ręka - tak o tobie mówią w całej okolicy. Takim gościom liczę " + pct(REP_DISCOUNT[3]) + " mniej. I komnata z kominkiem na górze stoi dla ciebie otworem.",
        4: "Chluba tawerny we własnej osobie! " + pct(REP_DISCOUNT[4]) + " taniej, najlepszy kufel z beczki, a na piętrze złocona krata otworzy się przed tobą. Apartamenty czekają."
    };
    function repLine(o) {
        const t = repTier(), s = S();
        if (t >= 2 && REP_DISCOUNT[t] > 0 && (s.repSaid || 0) < t) {
            s.repSaid = t;
            sayAs(o, "borgar", REP_LINES[t]);
        }
    }
    const repFoot = () => (repDiscount() > 0 ? "Sława: " + tierName(repTier()) + " · u Borgara −" + pct(repDiscount()) : "");

    // ==================================================================
    // ROOMS: a bed for the night upstairs (<Tavern:bed room=N price=P name="..." minrep=R>), its door open till the morning
    // (<Tavern:door room=N>: self switch A = open), the candle lit, a full and safe sleep, breakfast. The rooms are keyed by the tags'
    // `room` (1, 2, 3, "komnata", "zloty"); minrep: the reputation a room needs (the big chamber 60, the Apartament Złoty 80)
    // ==================================================================
    const roomKey = v => String(v === undefined || v === null ? "" : v).trim().toLowerCase();
    const ROOM_NAMES = { 1: "Izdebka przy schodach", 2: "Pokój z oknem na dziedziniec", 3: "Pokój narożny", komnata: "Komnata z kominkiem", zloty: "Apartament Złoty" };
    const ROOM_DESCS = {
        1: "Wąskie łóżko, gruby koc z owczej wełny i okienko na podwórze. Ciasno, ale czysto. Chrapanie zza ściany gratis.",
        2: "Szerokie łóżko z pierzyną, dzbanek wody i okno na dziedziniec. Rano budzą cię kosy, a nie Grum.",
        3: "Narożny pokój z dwoma oknami, dębowe łóżko i miednica z ciepłą wodą o poranku. Cicho jak w klasztorze.",
        komnata: "Łoże z baldachimem, ogień w kominku i skóra niedźwiedzia przy łóżku. Borgar mówi, że spał tu sam Lord. Borgar dużo mówi.",
        zloty: "Złocone łoże, jedwabna pościel, kotary z adamaszku. Rano pokojówka wnosi śniadanie do łóżka - na srebrnej tacy."
    };
    const GIFTS = { 1: [[BREAD, 1]], 2: [[BREAD, 1], [MILK, 1]], 3: [[BREAD, 1], [CHEESE, 1]], komnata: [[BREAD, 1], [CHEESE, 1]], zloty: [] };
    const GIFT_TEXT = { 1: "pajdę chleba", 2: "pajdę chleba i kubek mleka", 3: "pajdę chleba i kawałek sera", komnata: "pajdę chleba i kawałek sera" };   // (whom: "zostawił ci ...")
    const GIFT_NAME = { 1: "pajda chleba", 2: "pajda chleba i kubek mleka", 3: "pajda chleba i kawałek sera", komnata: "pajda chleba i kawałek sera",
        zloty: "do łóżka, na srebrnej tacy" };   // (what: "Śniadanie: ...")
    const RESTED = { komnata: 8, zloty: 12 };   // the hours of "Wypoczęty" a night there gives
    const RESTED_BONUS = 0.25;
    const BREAKFAST_IN_BED = { zloty: { fed: 45, water: 25, hosted: 6 } };
    const giftsOf = room => GIFTS[roomKey(room)] || GIFTS[1];
    const giftText = room => GIFT_TEXT[roomKey(room)] || GIFT_TEXT[1];
    const giftName = room => GIFT_NAME[roomKey(room)] || GIFT_NAME[1];
    const isNumbered = room => Number(roomKey(room)) > 0;
    const roomLabel = r => (isNumbered(r.room) && !namedAsRoom(r) ? "Pokój nr " + r.room : r.name);
    // a bed named like its room already ("Pokój nr 1", the builders' maps): its number is not said twice
    const namedAsRoom = r => /^pok[oó]j/i.test(String(r.name || ""));
    const roomData = {}, doorData = {}, gateData = {};   // mapId -> beds / doors / gates read from the room maps (roomMaps) at the start
    function readTags(data, mapId, kind) {
        const out = [];
        for (const e of (data && data.events) || []) {
            const t = e ? dataTag(e) : null;
            if (!t || t.kind !== kind) continue;
            if (kind === "gate") { out.push({ mapId, eventId: e.id, minrep: num(t.a.minrep, 80) }); continue; }
            const room = roomKey(t.a.room);
            if (!room) continue;
            if (kind === "door") { out.push({ room, mapId, eventId: e.id }); continue; }
            const n = Number(room);
            out.push({ room, mapId, eventId: e.id, x: e.x, y: e.y, minrep: num(t.a.minrep, 0),
                price: num(t.a.price, n > 0 ? ROOM_PRICES[n - 1] || ROOM_PRICES[ROOM_PRICES.length - 1] : 30),
                name: t.a.name || ROOM_NAMES[room] || (n > 0 ? "Pokój " + n : room), desc: t.a.desc || ROOM_DESCS[room] || ROOM_DESCS[1] });
        }
        return out;
    }
    function prefetchRooms() {
        for (const id of ROOM_MAPS) {
            if (roomData[id] !== undefined || !window.$dataMapInfos) continue;
            roomData[id] = [];
            doorData[id] = [];
            gateData[id] = [];
            if (!$dataMapInfos[id]) continue;
            const xhr = new XMLHttpRequest();
            xhr.open("GET", "data/Map" + String(id).padStart(3, "0") + ".json");
            xhr.overrideMimeType("application/json");
            xhr.onload = () => {
                if (xhr.status >= 400) return;
                try {
                    const d = JSON.parse(xhr.responseText);
                    roomData[id] = readTags(d, id, "bed");
                    doorData[id] = readTags(d, id, "door");
                    gateData[id] = readTags(d, id, "gate");
                    syncDoors();
                } catch (e) { /* (a broken file: no rooms) */ }
            };
            xhr.onerror = () => {};
            xhr.send();
        }
    }
    // all rooms: the room maps' beds, and the beds of the map he is on (the truth for that map); the numbered ones first
    function rooms() {
        const byRoom = new Map();
        for (const id of Object.keys(roomData)) for (const r of roomData[id] || []) byRoom.set(r.room, r);
        if ($dataMap && $gameMap) for (const r of readTags($dataMap, $gameMap.mapId(), "bed")) byRoom.set(r.room, r);
        const rank = r => (isNumbered(r.room) ? Number(r.room) : 1000 + r.minrep + r.price / 1000);
        return [...byRoom.values()].sort((a, b) => rank(a) - rank(b));
    }
    const roomOf = n => rooms().find(r => r.room === roomKey(n)) || null;
    const roomPrice = r => repPrice(r.price);
    const canRent = r => reputation() >= (r.minrep || 0);
    const onlyFor = r => (roomKey(r.room) === "zloty" ? "tylko dla dostojnych gości" : "tylko dla stałych, zaufanych gości") + " (sława „" + tierName(repTierOf(r.minrep)) + "”)";
    // rented tonight: the room is his till CHECKOUT the next morning (after midnight, before dawn: till this morning's CHECKOUT)
    const rentUntil = () => (hour() < 6 ? day() : day() + 1) * 24 + CHECKOUT;
    function rentedRoom() {
        const r = S().rent;
        if (r && nowH() >= r.until) { S().rent = null; return null; }
        return r || null;
    }
    const isRented = room => { const r = rentedRoom(); return !!r && roomKey(r.room) === roomKey(room); };
    function rentRoom(n, to) {
        const room = roomOf(n);
        if (!room || rentedRoom()) return false;
        if (!canRent(room)) { popup(0, room.name + ": " + onlyFor(room) + ".", BAD); SoundManager.playBuzzer(); return false; }
        const price = roomPrice(room);
        if (!pay(price, to)) return false;
        const s = S();
        s.rent = { room: room.room, name: room.name, price, day: day(), until: rentUntil(), slept: false };
        s.rooms++;
        syncDoors();
        if (first("room")) {
            note("Pokój w karczmie", "Borgar wynajmuje pokoje na piętrze na jedną noc (" + rooms().filter(r => !r.minrep).map(r => r.name + ": " + r.price + " G").join(", ") + "). Drzwi pokoju są otwarte do " + CHECKOUT + ":00 rano.\n" +
                "W łóżku w karczmie śpi się bezpiecznie (żadne wilki tu nie zajrzą) i budzi się w pełni sił. Rano przy łóżku czeka śniadanie od Borgara.");
        }
        if (RESTED[room.room] && first("room_" + room.room)) {
            note(room.name, room.room === "zloty" ? "Apartament Złoty na piętrze Apartamentów wynajmuje się tylko Chlubie tawerny. Po nocy w nim śniadanie podają do łóżka, a przez " + RESTED.zloty + " godz. jestem Wypoczęty: odpoczynek daje " + pct(RESTED_BONUS) + " więcej sił."
                : "Komnatę z kominkiem Borgar wynajmuje tylko stałym, zaufanym gościom. Po nocy w niej przez " + RESTED.komnata + " godz. jestem Wypoczęty: odpoczynek daje " + pct(RESTED_BONUS) + " więcej sił.");
        }
        return true;
    }

    // the doors: self switch A (the map's page 2: open) while the room is rented; shut again once the rent is over - but never with
    // him inside (he would be locked in: the map's own locked page shows the same words from both sides). Doors of rooms without a
    // bed (the suites: words only) are left to the map
    const roomTiles = {}, ROOM_TILES_MAX = 120;   // "map:room" -> Set of "x,y" (the floor of the room, found from its bed) or null
    function floorOf(room) {
        const mapId = $gameMap.mapId(), key = mapId + ":" + room;
        if (roomTiles[key] !== undefined) return roomTiles[key];
        const bed = spots("bed").find(b => roomKey(b.a.room) === room);
        if (!bed) return (roomTiles[key] = null);
        const doors = new Set(spots("door").map(d => d.ev.x + "," + d.ev.y));
        const seen = new Set(), todo = [];
        for (const [dx, dy] of [[0, 0], [0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [0, 2]]) todo.push([bed.ev.x + dx, bed.ev.y + dy]);
        while (todo.length && seen.size < ROOM_TILES_MAX) {
            const [x, y] = todo.pop(), k = x + "," + y;
            if (seen.has(k) || doors.has(k) || !$gameMap.isValid(x, y)) continue;
            seen.add(k);
            for (const [dx, dy, d] of DIRS) if ($gameMap.isPassable(x, y, d)) todo.push([x + dx, y + dy]);
        }
        return (roomTiles[key] = seen.size < ROOM_TILES_MAX ? seen : null);   // (no walls all round - a hall, not a guest room: unknown)
    }
    function playerInside(room) {
        const floor = floorOf(room);
        if (!floor) return spots("bed").some(b => roomKey(b.a.room) === room && Math.hypot(b.ev.x - $gamePlayer.x, b.ev.y - $gamePlayer.y) < 7);
        return floor.has($gamePlayer.x + "," + $gamePlayer.y);
    }
    function syncDoors() {
        if (!window.$gameSelfSwitches || !$gameSystem) return;
        const here = $gameMap ? $gameMap.mapId() : 0, known = new Set(rooms().map(r => r.room));
        for (const id of Object.keys(doorData)) {
            if (Number(id) === here) continue;
            for (const d of doorData[id]) {
                if (!known.has(d.room)) continue;
                const key = [Number(id), d.eventId, "A"], want = isRented(d.room);
                if (!!$gameSelfSwitches.value(key) !== want) $gameSelfSwitches.setValue(key, want);
            }
        }
        syncGates(here);
        if (!$gameMap) return;
        for (const d of spots("door")) {
            const room = roomKey(d.a.room);
            if (!known.has(room)) continue;   // (the suites: words only)
            const key = [here, d.ev.eventId(), "A"], on = !!$gameSelfSwitches.value(key), want = isRented(room);
            if (want && !on) $gameSelfSwitches.setValue(key, true);
            else if (!want && on && !playerInside(room)) $gameSelfSwitches.setValue(key, false);
        }
    }
    // the gilded gate of the Apartamenty (<Tavern:gate minrep=80>): opens for good once the reputation is there (self switch A), with a
    // welcome the first time he is by it
    const gateKey = (mapId, id) => mapId + ":" + id;
    function syncGates(here) {
        const s = S(), rep = reputation();
        if (!s.gates) s.gates = {};
        for (const id of Object.keys(gateData)) {
            if (Number(id) === here) continue;
            for (const g of gateData[id]) {
                const k = gateKey(id, g.eventId);
                if (!s.gates[k] && rep >= g.minrep) s.gates[k] = "new";
                if (s.gates[k] && !$gameSelfSwitches.value([Number(id), g.eventId, "A"])) $gameSelfSwitches.setValue([Number(id), g.eventId, "A"], true);
            }
        }
        if (!$gameMap) return;
        for (const g of spots("gate")) {
            const k = gateKey(here, g.ev.eventId()), key = [here, g.ev.eventId(), "A"];
            if (!s.gates[k] && rep >= num(g.a.minrep, 80)) s.gates[k] = "new";
            if (!s.gates[k]) continue;
            if (!$gameSelfSwitches.value(key)) $gameSelfSwitches.setValue(key, true);
            if (s.gates[k] === "new") { s.gates[k] = true; welcomeGate(g.ev); }
        }
    }
    function welcomeGate(ev) {
        se("Bell3", 70, 110);
        bark(ev, "Dzyń, dzyń! Witamy w Apartamentach, szanowny gościu!", 240);
        notice("Apartamenty stoją przed tobą otworem", "Sława: " + tierName(4) + " - złocona krata na piętrze jest otwarta");
        if (first("apartamenty")) note("Apartamenty", "Złocona krata na piętrze otworzyła się przede mną: sława „" + tierName(4) + "”. Za nią Apartament Złoty - Borgar wynajmuje go na noc. Śniadanie podają tam do łóżka.");
    }
    // below the reputation a room or the gate needs, the plugin tells why (its own words; the map's pages come back after)
    function repLocked(ev, t) {
        if (t.kind === "gate") { const g = S().gates; return !(g && g[gateKey($gameMap.mapId(), ev.eventId())]) && reputation() < num(t.a.minrep, 80); }
        if (t.kind === "door") { const r = roomOf(t.a.room); return !!r && (r.minrep || 0) > reputation() && !isRented(r.room); }
        return false;
    }
    function lockedTalk(t) {
        const o = [];
        if (t.kind === "gate") {
            se("Bell1", 45, 130);
            heroSay(o, "Złocona krata, a przy niej mosiężny dzwonek. Na tabliczce: „Apartamenty tylko dla dostojnych gości.”");
            heroSay(o, "Dzwonię... cisza. Trzeba by być chlubą tej tawerny, żeby mi tu otworzyli.");
            return o;
        }
        const r = roomOf(t.a.room);
        se("Knock", 50, 105);
        heroSay(o, r && r.room === "zloty" ? "Na drzwiach złota tabliczka: „Apartament Złoty. Wstęp tylko dla dostojnych gości.”"
            : "Na drzwiach mosiężna tabliczka: „" + (r && r.room === "komnata" ? "Komnatę" : "Ten pokój") + " wynajmujemy tylko stałym, zaufanym gościom.”");
        return o;
    }

    // the room on the card: a little picture of it (drawn in pixels, blown up), what it is, the breakfast
    const ROOM_LOOK = {
        1: { blanket: "#7c5d3c", dark: "#5b4129", light: "#9a7a52" },
        2: { blanket: "#4d6a3b", dark: "#36502a", light: "#6d8c55", window: true },
        3: { blanket: "#3f5a78", dark: "#2c4058", light: "#5b7898", window: true },
        komnata: { blanket: "#7e2632", dark: "#5a1822", light: "#a4404c", trim: "#d4a83a", fire: true, skin: true },
        zloty: { blanket: "#243a78", dark: "#172652", light: "#3d5aa8", trim: "#e8c04a", window: true, canopy: true, gold: true }
    };
    const lookOf = room => ROOM_LOOK[roomKey(room)] || ROOM_LOOK[1 + ((Number(room) - 1) % 3 + 3) % 3] || ROOM_LOOK[1];
    function paintRoomPixels(ctx, room) {   // 96 x 44
        const L = lookOf(room), px = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
        px(L.gold ? "#3a2c24" : "#3a2a1c", 0, 0, 96, 27);
        for (let x = 0; x < 96; x += 9) px(L.gold ? "#46362a" : "#312317", x, 0, 1, 27);
        if (L.gold) for (let x = 4; x < 96; x += 9) px("#6a5430", x, 4, 2, 2);   // (gilded studs on the panelling)
        px("#241910", 0, 26, 96, 1);
        px("#5a3f28", 0, 27, 96, 17);
        for (let y = 30; y < 44; y += 4) px("#4b3421", 0, y, 96, 1);
        if (L.gold) { px("#6e1f2c", 20, 34, 56, 9); px("#8a2c3a", 21, 35, 54, 7); px("#d4a83a", 21, 35, 54, 1); px("#d4a83a", 21, 41, 54, 1); }   // a rug
        if (L.window) {   // a window with the moon
            px("#20150d", 64, 3, 20, 17); px("#22304a", 65, 4, 18, 15); px("#34496b", 66, 5, 7, 6); px("#34496b", 75, 5, 7, 6); px("#2b3c5a", 66, 12, 7, 6); px("#2b3c5a", 75, 12, 7, 6);
            px("#f0ecd0", 77, 6, 3, 3); px("#20150d", 73, 4, 2, 15); px("#20150d", 65, 11, 18, 1);
            if (L.canopy) { px("#6e1f2c", 61, 2, 4, 20); px("#6e1f2c", 83, 2, 4, 20); px("#e8c04a", 60, 1, 28, 2); }   // curtains
        }
        if (L.fire) {   // the fireplace
            px("#4a4540", 2, 8, 20, 19); px("#5e5852", 3, 9, 18, 3); px("#171210", 6, 14, 12, 13);
            px("#ff9a3a", 8, 21, 8, 5); px("#ffd66a", 10, 22, 4, 4); px("#c24a1e", 7, 25, 10, 2);
        }
        const bx = L.fire ? 26 : 16, wood = L.gold ? "#8a6a2c" : "#5e4128", woodD = L.gold ? "#4a3614" : "#3a2716", woodL = L.gold ? "#e8c04a" : "#7c5a38";
        // the bed seen from the side: a tall headboard on the left, a low footboard, the mattress, the pillow, the blanket over the edge
        if (L.canopy) { px(woodD, bx, 1, 3, 10); px(woodD, bx + 44, 1, 3, 22); px("#6e1f2c", bx - 1, 1, 49, 4); px(L.trim, bx - 1, 4, 49, 1); px("#8a2c3a", bx + 1, 5, 3, 16); }   // the canopy
        px(woodD, bx - 1, 10, 6, 31); px(wood, bx, 11, 4, 29); px(woodL, bx, 11, 1, 29);
        if (L.trim) px(L.trim, bx, 13, 4, 1);
        px(woodD, bx + 43, 22, 5, 19); px(wood, bx + 44, 23, 3, 17); px(woodL, bx + 44, 23, 1, 17);
        px(woodD, bx + 4, 30, 40, 5); px(wood, bx + 4, 31, 40, 3);
        px("#ece4d2", bx + 4, 25, 40, 5); px("#d6cbb3", bx + 4, 29, 40, 1);
        px("#1e140c", bx + 5, 20, 12, 6); px("#fbf6ea", bx + 6, 21, 10, 4); px("#ffffff", bx + 7, 21, 4, 1); px("#d8cdb6", bx + 6, 24, 10, 1);
        px(L.dark, bx + 16, 22, 28, 1); px(L.blanket, bx + 16, 23, 28, 9); px(L.light, bx + 17, 23, 26, 1);
        px(L.dark, bx + 16, 31, 28, 2);
        for (let i = 0; i < 4; i++) px(L.dark, bx + 20 + i * 6, 26 + (i % 2) * 2, 2, 1);
        if (L.trim) { px(L.trim, bx + 16, 24, 28, 1); px(L.trim, bx + 16, 30, 28, 1); }
        px(woodD, bx, 40, 3, 3); px(woodD, bx + 44, 40, 3, 3);
        if (L.gold) {   // the breakfast tray on the blanket
            px("#9aa0a8", bx + 24, 19, 16, 4); px("#e2e5ea", bx + 25, 19, 14, 2); px("#fff6c8", bx + 27, 17, 4, 2); px("#c98a3a", bx + 33, 17, 4, 2);
        }
        // the candle on a stool, lit
        const cx = bx + 52;
        px("#4a3322", cx, 29, 9, 2); px("#3a2819", cx + 1, 31, 2, 8); px("#3a2819", cx + 6, 31, 2, 8);
        px(L.gold ? "#e8c04a" : "#efe6cf", cx + 3, 22, 3, 7); px("#fffaf0", cx + 3, 22, 1, 7);
        px("#ffd66a", cx + 3, 18, 3, 4); px("#fff4c0", cx + 4, 19, 1, 2); px("#ff9a3a", cx + 3, 17, 2, 1);
        if (roomKey(room) === "1") { px("#6d6f73", 70, 30, 12, 7); px("#8a8c90", 71, 30, 10, 2); }   // a wash bowl on the floor
        if (L.skin) { px("#8a6a4a", 30, 38, 26, 5); px("#a4845e", 32, 39, 22, 2); }   // the bear's skin
    }
    const roomPixels = room => cached("room" + roomKey(room), () => {
        const c = document.createElement("canvas");
        c.width = 96; c.height = 44;
        paintRoomPixels(c.getContext("2d"), room);
        return c;
    });
    function paintRoomIcon(b, room, x, y, size) {
        const ctx = b.context, L = lookOf(room);
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        const k = size / 32, r = (c, a, bb, w, h) => { ctx.fillStyle = c; ctx.fillRect(x + a * k, y + bb * k, w * k, h * k); };
        if (L.canopy) { r("#6e1f2c", 2, 3, 28, 3); r(L.trim, 2, 5, 28, 1); }
        r("#20150d", 2, 8, 5, 20); r(L.gold ? "#8a6a2c" : "#6b4a2c", 3, 9, 3, 18);
        r("#20150d", 26, 15, 4, 13); r(L.gold ? "#8a6a2c" : "#6b4a2c", 27, 16, 2, 11);
        r("#20150d", 6, 21, 21, 5); r("#ece4d2", 6, 18, 21, 3);
        r("#fbf6ea", 7, 14, 7, 4);
        r(L.blanket, 13, 15, 14, 7); r(L.light, 13, 15, 14, 1); r(L.dark, 13, 21, 14, 1);
        if (L.trim) r(L.trim, 13, 17, 14, 1);
        ctx.restore();
        dirty(b);
    }
    function detailRoom(b, e, x, y, w, h) {
        const r = e.data, S0 = U(), ih = 176;
        detailIllustration(b, x, y, w, ih, ctx => {
            ctx.imageSmoothingEnabled = false;
            const iw = Math.min(384, Math.floor((w - 8) / 96) * 96 || 288), ihh = Math.round(iw * 44 / 96);
            ctx.drawImage(roomPixels(r.room), x + Math.round((w - iw) / 2), y + Math.round((176 - ihh) / 2), iw, ihh);
            const g = ctx.createRadialGradient(x + w / 2 + 70, y + 90, 4, x + w / 2 + 70, y + 90, 120);
            g.addColorStop(0, "rgba(255,190,100,0.28)"); g.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = g; ctx.fillRect(x, y, w, ih);
        });
        let ty = y + ih + 12;
        const title = isNumbered(r.room) && !namedAsRoom(r) ? "Pokój " + r.room + " · " + r.name : r.name;
        cardText(b, title, x, ty, w - 90, title.length > 26 ? 21 : 25, S0.accent, true);
        cardText(b, e.right, x + w - 110, ty + 2, 110, 24, e.enabled === false ? BAD : S0.accent, true, "right");
        ty += 38;
        for (const l of wrapText(b, r.desc, w, 18).slice(0, 3)) { cardText(b, l, x, ty, w, 18, "#d8dde3"); ty += 25; }
        ty += 8;
        const facts = [["stamina", "Pełny wypoczynek, bezpieczny sen"], ["sated", "Śniadanie: " + giftName(r.room)]];
        if (RESTED[r.room]) facts.push(["rested", "Rano: Wypoczęty · " + hoursText(RESTED[r.room]) + " (odpoczynek +" + pct(RESTED_BONUS) + ")", S0.accent]);
        else facts.push(["warm", "Świeca i ciepła pościel"]);
        facts.push(!canRent(r) ? ["weight", onlyFor(r).replace(/^./, c => c.toUpperCase()), BAD] : ["weight", "Pokój twój do " + CHECKOUT + ":00 rano"]);
        facts.forEach((f, i) => {
            const fy = ty + i * 28;
            if (S0.chip) S0.chip(b.context, f[0], x, fy + 2, 20, f[0] === "rested" ? S0.accent : undefined);
            cardText(b, f[1], x + 28, fy, w - 30, 17, f[2] || S0.text);
        });
        dirty(b);
    }
    function roomCardSpec() {
        const entries = rooms().map(r => {
            const price = roomPrice(r), ok = canRent(r);
            return { room: r.room, data: r, name: r.name, right: price + " G", oldRight: price !== r.price ? r.price + " G" : "",
                sub: ok ? (isNumbered(r.room) && !namedAsRoom(r) ? "pokój nr " + r.room + " · " : "") + "śniadanie: " + giftName(r.room) : "sława „" + tierName(repTierOf(r.minrep)) + "” - " + (r.room === "zloty" ? "dla dostojnych gości" : "dla stałych gości"),
                enabled: ok && gold() >= price, why: () => (ok ? needGold(price) : popup(0, r.name + ": " + onlyFor(r) + ".", BAD)) };
        });
        return { key: "room", kicker: "PIĘTRO „ZŁOTEGO KUFLA” · POKOJE GOŚCI", title: "Pokoje na noc", entries, detail: detailRoom, okWord: "wynajmij",
            foot: repFoot() || "Płacisz za jedną noc · pobudka o " + wakeHour() + ":00" };
    }
    function roomTalk() {
        const o = [], list = rooms(), r = rentedRoom(), h = hour();
        if (r) { sayAs(o, "borgar", "Masz już pokój na tę noc: " + (isNumbered(r.room) && !namedAsRoom(r) ? "nr " + r.room + ", " + r.name.toLowerCase() : roomLabel(r).replace(/^Pokój/, "pokój")) + ". Schody na górę, drzwi otwarte - śpij smacznie!"); return o; }
        if (!list.length) { sayAs(o, "borgar", "Pokoje na górze jeszcze w remoncie - cieśle obiecali skończyć w tym tygodniu. Który to już tydzień..."); return o; }
        repLine(o);
        sayAs(o, "borgar", h >= 6 && h < 15 ? "Pokój na noc? O tej porze? Proszę bardzo - płacisz za noc, a wylegiwać się możesz od zaraz."
            : "Pokoje na piętrze. Pościel świeża, pluskwy wyprowadziły się w zeszłym miesiącu. Chyba.");
        if (!S().firsts.room) sayAs(o, "borgar", "Płacisz za jedną noc: drzwi pokoju otwarte do " + CHECKOUT + ":00 rano, śpisz bezpiecznie jak u mamy, a rano przy łóżku czeka śniadanie.");
        script(o, "TavernLife.card(this, 'room')");
        script(o, "TavernLife.step(this, 'room')");
        return o;
    }
    // Borgar's word after the rent
    function rentLine(r) {
        if (r.room === "komnata") return "Komnata z kominkiem twoja do rana. Kazałem napalić w kominku i wytrzepać niedźwiedzia. Śniadanie będzie przy łóżku.";
        if (r.room === "zloty") return "Apartament Złoty! Pościel taka sama jak u Lorda - no, prawie. Rano pokojówka poda śniadanie do łóżka, na srebrnej tacy.";
        return roomLabel(r) + " " + (isNumbered(r.room) ? "twój" : "twoja") + " do rana. Schody na górę - drzwi już otwarte, świeca się pali. Śniadanie zostawię przy łóżku.";
    }

    // the bed: "Położyć się spać?" - only in the room rented tonight, once a night
    function bedTalk(a) {
        const room = roomKey(a.room), r = rentedRoom(), o = [];
        if (!isRented(room)) { popup(0, r ? "To nie twój pokój - twój to " + (isNumbered(r.room) ? "numer " + r.room : r.name) + "." : "To łóżko gościa. Pokój wynajmiesz u Borgara.", BAD); return null; }
        if (r.slept) { popup(0, "Już się wyspałeś. Pokój jest twój do " + CHECKOUT + ":00.", BAD); return null; }
        heroSay(o, hour() >= 6 && hour() < 18 ? "Za dnia? Ale łóżko kusi... Położyć się spać do rana?" : "Położyć się spać?");
        choose(o, [{ label: "Śpij do rana", js: ["TavernLife.step(this, 'sleep', " + q(room) + ")"] }, { label: "Jeszcze nie", js: [] }]);
        return o;
    }
    // breakfast in bed (the Apartament Złoty): eaten at once - hunger and thirst away, "Ugoszczony" - and the tray stays on the blanket
    function trayBitmap() {
        if (bitmaps.tray) return bitmaps.tray;
        const b = new Bitmap(48, 30), ctx = b.context;
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(24, 25, 21, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#7d828a"; ctx.beginPath(); ctx.ellipse(24, 21, 22, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#d9dce2"; ctx.beginPath(); ctx.ellipse(24, 20, 20, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f4f5f8"; ctx.beginPath(); ctx.ellipse(21, 19, 12, 3, 0, 0, Math.PI * 2); ctx.fill();
        const set = ImageManager.loadSystem("IconSet");
        if (set.isReady()) for (const [i, x] of [[363, 5], [339, 17], [383, 29]]) b.blt(set, (i % 16) * 32, Math.floor(i / 16) * 32, 32, 32, x, 4, 16, 16);
        ctx.fillStyle = "#fffbe8"; ctx.fillRect(38, 16, 7, 5); ctx.fillStyle = "#b8303a"; ctx.fillRect(40, 18, 2, 2);   // the note with a seal
        dirty(b);
        if (set.isReady()) bitmaps.tray = b;   // (kept once the dishes on it could be drawn)
        return b;
    }
    function breakfastInBed(room) {
        const bf = BREAKFAST_IN_BED[room];
        if (!bf) return;
        if (window.Needs && Needs.enabled && Needs.enabled()) { const n = Needs.state(); n.food = Math.min(100, n.food + bf.fed); n.water = Math.min(100, n.water + bf.water); }
        addBuff("hosted", bf.hosted);
        const bed = spots("bed").find(b => roomKey(b.a.room) === room);
        if (bed) addFx({ kind: "tray", x: bed.ev.x, y: bed.ev.y + 0.75, life: 3600 });
    }
    function* sleepSeq(room) {
        const r = S().rent;
        room = roomKey(room);
        $gameScreen.startFadeOut(W(30));
        yield W(34);
        me(PluginManager.parameters("SurvivalHUD").sleepMe || "Inn1", 90);
        // (no wolves: a tavern bed is never a night outdoors - Hunting.nightRaid is not asked)
        $gameSystem.sleepUntilHour(wakeHour());
        if (typeof $gameSystem.setStamina === "function") $gameSystem.setStamina($gameSystem.maxStamina());
        for (const m of $gameParty.members()) m.recoverAll();
        if (r) r.slept = true;
        const s = S();
        s.nights++;
        yield W(40);
        for (const [id, n] of giftsOf(room)) if (item(id)) $gameParty.gainItem(item(id), n);
        if (RESTED[room]) addBuff("rested", RESTED[room]);
        breakfastInBed(room);
        $gameScreen.startFadeIn(W(40));
        yield W(40);
        let morning;
        // (the day's plate is one line - and Story.js adds the debt to it: short words here, the rest in the popups)
        if (room === "zloty") morning = "Śniadanie do łóżka, na srebrnej tacy. Liścik: „Na koszt domu. Borgar”.";
        else if (room === "komnata") morning = "Wstajesz jak nowo narodzony. Przy kominku czeka pajda chleba i ser.";
        else morning = ["Wyspałeś się jak król.", "Spałeś jak kamień, bez jednego snu.", "Pierzyna, cisza, zero wilków - wyspałeś się jak nigdy."][s.nights % 3] + " Borgar zostawił ci " + giftText(room) + ".";
        if (typeof $gameTemp.queueDayBanner === "function") $gameTemp.queueDayBanner(morning);
        else popup(0, morning, GOOD);
        if (BREAKFAST_IN_BED[room]) popup(363, "Śniadanie do łóżka: jajecznica, świeży chleb, kubek mleka. Ugoszczony (" + hoursText(BREAKFAST_IN_BED[room].hosted) + ")", GOOD);
        if (RESTED[room]) popup(BUFFS.rested.icon, "Wypoczęty (" + hoursText(RESTED[room]) + "): odpoczynek daje " + pct(RESTED_BONUS) + " więcej sił", GOOD);
        if (first("night")) xp(10, "noc w karczmie");
    }
    function sleepNow(room) {
        const r = rentedRoom();
        if (!r || (room !== undefined && roomKey(r.room) !== roomKey(room)) || r.slept) return false;
        begin(sleepSeq(r.room));
        return true;
    }

    // ==================================================================
    // BATH: a hot tub for a few coins - the hero in the water up to his shoulders, steam, an hour of game time, then "Czysty"
    // ==================================================================
    let bathing = null;   // { cut, lift } while he sits in the tub: only the top of him shows, a little higher, in front of the tub
    const _Sprite_Character_updateFrame = Sprite_Character.prototype.updateFrame;
    Sprite_Character.prototype.updateFrame = function() {
        _Sprite_Character_updateFrame.call(this);
        if (bathing && this._character === $gamePlayer && this._frame) {
            const f = this._frame;
            this.setFrame(f.x, f.y, f.width, Math.max(8, Math.round(f.height * (1 - bathing.cut))));
        }
    };
    const _Sprite_Character_updatePosition = Sprite_Character.prototype.updatePosition;
    Sprite_Character.prototype.updatePosition = function() {
        _Sprite_Character_updatePosition.call(this);
        if (this._character !== $gamePlayer) return;
        if (bathing) { this.y -= bathing.lift; this._sortY = this.y + bathing.lift + 8; }   // (sorted after the tub he sits in)
        else if (this._sortY !== undefined) delete this._sortY;
    };
    function attendant() {
        const t = spots("attendant")[0];
        if (t) return t.ev;
        return ($gameMap ? $gameMap.events() : []).find(e => /Łaziebn|Wanda/i.test(((e.event() || {}).name) || "")) || null;
    }
    function attSay(out, text) {
        const ev = attendant();
        return say(out, ev ? ev.eventId() : -1, text, null, "Łaziebna Wanda");
    }
    const BATH_LINES = [
        "No, teraz przynajmniej konie się nie płoszą, jak przechodzisz.",
        "Woda była gorąca, a teraz jest... brązowa. Ale ty lśnisz!",
        "Takiego brudu nie widziałam od czasu, jak kąpał się tu Grum. A Grum kąpie się raz do roku. W porywach.",
        "Pachniesz jak łąka po deszczu. No, jak łąka. Z tym deszczem to może przesadziłam.",
        "Uważaj, żebyś się nie zakochał we własnym odbiciu w kuflu."
    ];
    const bathPrice = () => repPrice(BATH_PRICE);
    function bathTalk() {
        const o = [], price = bathPrice();
        attSay(o, hasBuff("clean") ? "Przecież dopiero co się kąpałeś! Jeszcze raz i zetrzesz sobie skórę do kości. No, ale płacisz - twoja wola."
            : "Kąpiel? Gorąca woda, szare mydło i szorstki ręcznik - " + price + " G" + (price < BATH_PRICE ? ", Borgar kazał ci liczyć taniej" : "") + ". Szorowanie pleców gratis, ale tylko po znajomości.");
        if (!S().firsts.bath) attSay(o, "Po kąpieli człowiek lżejszy - każda robota idzie o " + Math.round(CLEAN_COST * 100) + "% łatwiej, póki znowu się nie ubabrzesz. Czyli parę godzin.");
        choose(o, [{ label: "Wykąp się (" + price + " G" + (price < BATH_PRICE ? " zamiast " + BATH_PRICE + " G" : "") + ")", js: "TavernLife.step(this, 'bath')" }, { label: "Nie teraz", js: [] }]);
        return o;
    }
    function* bathSeq(tub) {
        const p = $gamePlayer, from = { x: p.x, y: p.y, d: p.direction() };
        let water = null;
        yield* dip(() => {
            p.locate(tub.x, tub.y);
            p.setDirection(2);
            bathing = { cut: 0.54, lift: tub.lift };   // (lifted till the cut is at the tub's own water: only head and shoulders show)
            water = addFx({ kind: "water", x: tub.x, y: tub.y, py: 20 - bathing.lift, after: bathing.lift + 9 });   // (the ripple over the cut, at his shoulders)
        }, 16);
        se("Water1", 70, 90);
        se("Dive", 30, 140);
        const frames = W(260);
        for (let i = 1; i <= frames; i++) {
            pass(BATH_HOURS / frames);
            if (i % 7 === 0) addFx({ kind: "steam", x: tub.x + (hash(i, 1) - 0.5) * 0.9, y: tub.y - 0.25, life: 80, rise: 0.5, size: 1.1 + hash(i, 2) * 0.5 });
            if (i % 19 === 0) addFx({ kind: "bubble", x: tub.x, y: tub.y, px: (hash(i, 4) - 0.5) * 30, py: 22, life: 26 });
            if (i === Math.round(frames * 0.22)) bark(p, "Aaach... gorąca woda. Jak w niebie.", 150);
            if (i === Math.round(frames * 0.66)) bark(p, "Tylko nie zasnąć...", 120);
            if (i % 70 === 35) se("Water2", 28, 125);
            yield 1;
        }
        yield* dip(() => {
            bathing = null;
            if (water) water.gone = true;
            p.locate(from.x, from.y);
            p.setDirection(from.d);
        }, 16);
        se("Water1", 55, 130);
        for (let i = 0; i < 14; i++) addFx({ kind: "drop", x: p.x, y: p.y, px: (hash(i, 8) - 0.5) * 22, py: -22 - hash(i, 9) * 22, life: 26 + i * 5 });
        addBuff("clean", CLEAN_HOURS);
        popup(BUFFS.clean.icon, "Czysty (" + hoursText(CLEAN_HOURS) + "): prace kosztują " + Math.round(CLEAN_COST * 100) + "% mniej sił", GOOD);
        const s = S();
        s.baths++;
        if (first("bath")) {
            note("Łaźnia", "W łaźni karczmy gorąca kąpiel kosztuje " + BATH_PRICE + " G i trwa godzinę. Potem jestem Czysty: przez " + CLEAN_HOURS + " godz. każda praca kosztuje " + Math.round(CLEAN_COST * 100) + "% mniej sił.");
            xp(10, "pierwsza kąpiel");
        }
    }
    function startBath(tub, interp) {
        begin(bathSeq(tub), () => { bathing = null; });
        if (interp) hold(interp);
    }

    // ==================================================================
    // MELIA'S SONG: evenings, once an evening, at the listening spot before her stage; a tip is welcome. Six ballads in turn, each
    // with a crumb of the truth about Krucze Skały (docs/STORY.md: she does not know where she knows them from).
    // ==================================================================
    const SONGS = [
        { id: "kruk", title: "Czarny kruku", intro: "Dziś „Czarny kruku”. Najstarsza, jaką znam - stara jak kamienie pod tą podłogą.",
            verses: [["Hej, kruku, czarny kruku,", "co krążysz nad naszym dachem?"], ["— Pamiętam mury ze skały", "i straż, co nie znała strachu."],
                ["Nie złota strzegli ni ziemi,", "ni króla, ani korony —"], ["lecz tego, co w sercu skały", "śpi dotąd, niezbudzone."]],
            after: "Skąd ją znam? Nie wiem. Czasem słowa przychodzą same, jak natchnienie... albo jak wspomnienie." },
        { id: "pytanie", title: "Jedno pytanie", intro: "„Jedno pytanie”. Niby kołysanka. Tylko komu by się przy niej dobrze zasypiało?",
            verses: [["Raz do roku, w zimną noc,", "strażnik schodził, gdzie śpi moc."], ["Jedno pytanie w dłoni niósł —", "więcej żaden by nie zniósł."],
                ["Wracał blady, cichy, siwy,", "choć był młody, choć był żywy."], ["Prawda, synku, to nie miód:", "raz do roku — i to cud."]],
            after: "Jedno pytanie na rok... Ciekawe, o co ty byś zapytał. Ja chyba wolę nie wiedzieć." },
        { id: "straznik", title: "Strażnik, co pytał za wiele", intro: "„Strażnik, co pytał za wiele”. Smutna. A ludzie i tak proszą o nią najczęściej.",
            verses: [["Był strażnik, co kochał żonę", "i bał się — jak każdy z nas."], ["Zszedł w dół, choć nie był to jego", "ni rok, ani dzień, ni czas."],
                ["Pytał o żonę, o brata,", "o mury — czy przetrwają wiek?"], ["A Skała mu odpowiedziała.", "I nie wrócił ten sam człek."]],
            after: "Brr. Po tej zawsze ktoś stawia kolejkę. Chyba żeby o niej nie myśleć." },
        { id: "drzwi", title: "Drzwi pod skałą", intro: "„Drzwi pod skałą”. Melodia wesoła, a słowa... sam posłuchaj.",
            verses: [["Pod kuflem deska, pod deską próg,", "pod progiem schody — kto by to mógł?"], ["A na dole drzwi z kamienia,", "zamknięte na klucz milczenia."],
                ["Kto tam zapuka, ten usłyszy", "to, czego nie chciał — w wielkiej ciszy."], ["Więc pij, wędrowcze, śpiewaj z nami", "i nie pytaj, co pod kamieniami."]],
            after: "Borgar nie lubi tej piosenki. Mówi, że goście potem zaglądają pod stoły." },
        { id: "kasztelan", title: "Ostatni kasztelan", intro: "„Ostatni kasztelan”. O Kruczych Skałach i o kimś, kto bardzo nie chciał, żeby je pamiętano.",
            verses: [["Gdy mury legły w pył i w proch,", "ostatni kasztelan zamknął loch."], ["Klucz zakopał, zatarł ślad", "i puścił plotkę w cały świat:"],
                ["„Przeklęte gruzy, zły to gród —", "nie kop, bo zginiesz ty i twój ród!”"], ["Wieki minęły. Kto dziś wie,", "na czym ten Złoty Kufel śpi?"]],
            after: "Kasztelan... Ciekawe, czy miał dzieci. I czy one wiedziały, co tatko zakopał." },
        { id: "chlopiec", title: "O chłopcu z piwnicy", intro: "A teraz coś wesołego! „O chłopcu z piwnicy”. Ozzy, nie patrz tak na mnie.",
            verses: [["Był raz chłopiec, psotnik mały,", "co wpadł w piwnicę pod Kruczą Skałą."], ["Wrócił nad ranem, brudny, chudy,", "i gadał rzeczy — same cudy!"],
                ["Wiedział, kto kłamie, kto kradnie z sadu,", "i dzień, gdy spadnie deszcz pełen gradu."], ["Dziś pije piwo, gada do ściany —", "a wszyscy myślą, że jest pijany."]],
            after: "Ozzy zawsze przy niej płacze. Mówi, że ze śmiechu. Ja myślę, że nie tylko." }
    ];
    const songById = id => SONGS.find(s => s.id === id) || null;
    const inSongHours = () => hour() >= SONG_FROM && hour() < 24;
    // the next ballad: first the ones not heard yet, in order; then by the day
    function nextSong() {
        const heard = S().heard;
        return SONGS.find(s => !heard.includes(s.id)) || SONGS[Math.floor(hash(day(), 17) * SONGS.length) % SONGS.length];
    }
    let singing = null;   // { ev, t, bgm } while she sings
    let musicBack = null;   // { t, bgm, bgs }: the room's music, after the song
    function songTalk() {
        const o = [], s = S(), h = hour();
        if (!npc("melia")) { popup(80, "Scena pusta. Melia dziś nie śpiewa.", BAD); return null; }
        if (!inSongHours()) {
            sayAs(o, "melia", h >= 6 && h < SONG_FROM ? "Śpiewam wieczorami, od " + SONG_FROM + ":00. Teraz stroję lutnię... i nerwy." : "O tej porze? Gardło mi śpi, a lutnia chrapie. Przyjdź wieczorem, od " + SONG_FROM + ":00.");
            return o;
        }
        if (s.songDay === day()) { sayAs(o, "melia", "Dziś już śpiewałam - gardło mam jedno, a ballad sto. Przyjdź jutro wieczorem!"); return o; }
        const song = nextSong();
        sayAs(o, "melia", (s.songs ? "Znowu ty? Miło! " : "Posłuchasz? Wieczór bez pieśni jest jak kufel bez piany. ") + song.intro);
        choose(o, [{ label: "Wrzuć " + SONG_TIP + " G do kapelusza", js: "TavernLife.step(this, 'song', 1)" }, { label: "Posłuchaj za darmo", js: "TavernLife.step(this, 'song', 0)" },
            { label: "Innym razem", js: [] }]);
        return o;
    }
    function songList(song, tipped) {
        const o = [], m = npc("melia"), id = m ? m.eventId() : -1;
        if (tipped) sayAs(o, "melia", "Dziękuję, złotko! Za to dostaniesz jeszcze refren.");
        script(o, "TavernLife.step(this, 'songStart', " + q(song.id) + ")");
        song.verses.forEach(v => sayLines(o, id, ["♪ " + v[0], "   " + v[1]], NPCS.melia.face, "Melia"));
        if (tipped) sayLines(o, id, ["♪ " + song.verses[0][0], "   " + song.verses[0][1]], NPCS.melia.face, "Melia");
        script(o, "TavernLife.step(this, 'songEnd', " + q(song.id) + ", " + (tipped ? 1 : 0) + ")");
        sayAs(o, "melia", song.after);
        return o;
    }
    // the music: the tavern's tune fades, a lute tune plays under the words (the BGM of the room comes back after)
    const SONG_MUSIC = { name: params.songBgm === undefined ? "Scene2" : String(params.songBgm), volume: 60, pitch: 100, pan: 0 };
    function songStart(id) {
        const m = npc("melia");
        singing = { ev: m, t: 0, bgm: AudioManager.saveBgm(), bgs: AudioManager.saveBgs() };
        AudioManager.fadeOutBgs(1);
        me("Musical1", 70);
        if (SONG_MUSIC.name) AudioManager.playBgm(SONG_MUSIC);
        if (m) m.setDirection(2);
    }
    function songEnd(id, tipped) {
        const song = songById(id), s = S();
        if (singing) {
            AudioManager.fadeOutBgm(1);
            musicBack = { t: 54, bgm: singing.bgm, bgs: singing.bgs };   // (the room's own tune comes back once hers has faded)
            singing = null;
        }
        se("Applause1", 55);
        const hours = INSPIRED_HOURS + (tipped ? INSPIRED_TIP_HOURS : 0);
        addBuff("inspired", hours);
        popup(BUFFS.inspired.icon, "Natchniony (" + hoursText(hours) + "): +" + Math.round(INSPIRED_XP * 100) + "% doświadczenia", GOOD);
        s.songs++;
        s.songDay = day();
        if (tipped) s.tips += SONG_TIP;
        if (song && !s.heard.includes(song.id)) s.heard.push(song.id);
        if (!song) return;
        const lyric = "„" + song.title + "”\n" + song.verses.map(v => v.join("\n")).join("\n") + "\n";
        const J = window.Journal, d = J && J.data ? J.data() : null, old = d && d.notes ? d.notes.find(n => n.title === "Pieśni Melii") : null;
        if (!old) note("Pieśni Melii", "Melia Srebrogłosa śpiewa wieczorami (od " + SONG_FROM + ":00), raz na wieczór. Po jej pieśni jestem Natchniony: więcej doświadczenia. Sama nie wie, skąd zna te ballady...\n\n" + lyric);
        else if (old.text.indexOf("„" + song.title + "”") < 0) { old.text += "\n" + lyric; popup(80, "Dziennik: nowa pieśń w notatce „Pieśni Melii”", "#eceef0"); }
        if (s.heard.length === SONGS.length && first("allSongs")) xp(40, "wszystkie ballady Melii");
    }
    function updateSinging() {
        if (musicBack && --musicBack.t <= 0) {
            const b = musicBack;
            musicBack = null;
            if (b.bgm && b.bgm.name) AudioManager.replayBgm(b.bgm); else AudioManager.stopBgm();
            if (b.bgs && b.bgs.name) AudioManager.replayBgs(b.bgs);
        }
        if (!singing) return;
        singing.t++;
        const m = singing.ev;
        if (m && singing.t % 38 === 1) addFx({ kind: "note", x: m.x + (hash(singing.t, 3) - 0.5) * 0.8, y: m.y - 0.4, life: 110, ph: hash(singing.t, 5) * 6, vx: (hash(singing.t, 7) - 0.5) * 0.3, k: singing.t % 76 === 1 ? 1 : 0 });
    }

    // ==================================================================
    // THE MINI-GAMES: scenes of their own over a blurred picture of the tavern (the map's snapshot), driven like TavernShift's:
    // key states per logic tick, `turbo` ticks a frame and a seed for tests, GAME.onTick for bots, onEnd after the map is back
    // ==================================================================
    const GAME = { pending: null, running: null, end: null, onTick: null, lastResult: null };
    const W1 = 1280, H1 = 720;
    function bubbleBitmap(text, side) {   // a speech bubble with the tail towards the speaker's bust (side: "left" / "right")
        const probeB = new Bitmap(8, 8);
        cardFont(probeB, 21);
        const lines = wrapText(probeB, text, 300, 21), w = Math.min(340, Math.max(...lines.map(l => Math.ceil(probeB.measureTextWidth(l)))) + 32), h = lines.length * 28 + 20;
        const b = new Bitmap(w + 14, h + 16), ctx = b.context, S0 = U(), ox = side === "left" ? 14 : 0;
        ctx.save();
        ctx.fillStyle = "rgba(11,12,15,0.9)";
        ctx.strokeStyle = S0.line;
        ctx.beginPath();
        const x0 = ox + 0.5, y0 = 0.5, x1 = ox + w - 0.5, y1 = h - 0.5, c = 5;
        ctx.moveTo(x0 + c, y0); ctx.lineTo(x1 - c, y0); ctx.lineTo(x1, y0 + c); ctx.lineTo(x1, y1 - c); ctx.lineTo(x1 - c, y1);
        if (side === "right") { ctx.lineTo(x1 - 26, y1); ctx.lineTo(x1 - 6, y1 + 14); ctx.lineTo(x1 - 44, y1); }
        else { ctx.lineTo(x0 + 44, y1); ctx.lineTo(x0 + 6, y1 + 14); ctx.lineTo(x0 + 26, y1); }
        ctx.lineTo(x0 + c, y1); ctx.lineTo(x0, y1 - c); ctx.lineTo(x0, y0 + c); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.strokeStyle = S0.accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x0 + 1, y0 + 14); ctx.lineTo(x0 + 1, y0 + c); ctx.lineTo(x0 + c, y0 + 1); ctx.lineTo(x0 + 14, y0 + 1); ctx.stroke();
        ctx.restore();
        lines.forEach((l, i) => cardText(b, l, ox + 16, 9 + i * 28, w - 30, 21, S0.text));
        dirty(b);
        return b;
    }
    // the cards of the mini-games: before (the rules; later a short word) and after (the result)
    function drawGameCard(b, spec) {
        const S0 = U();
        b.clear();
        b.fillRect(0, 0, b.width, b.height, "rgba(0,0,0,0.6)");
        const pw = 960, ph = spec.h || 520, px = Math.round((b.width - pw) / 2), py = Math.round((b.height - ph) / 2);
        panelInto(b, px, py, pw, ph, { cut: 10 });
        const bust = spec.bust ? ImageManager.loadPicture(spec.bust) : null;
        if (bust && bust.isReady() && bust.width) {
            const bw = 250, bh = Math.round(bust.height * bw / bust.width);
            b.context.imageSmoothingEnabled = true;
            b.blt(bust, 0, 0, bust.width, bust.height, px + 18, py + ph - bh - 60, bw, bh);
            b.fillRect(px + 18, py + ph - 60, bw, 2, S0.accent);
        }
        cardText(b, spec.who || "", px + 18, py + ph - 52, 250, 20, S0.accent, true, "center");
        cardText(b, spec.whoSub || "", px + 18, py + ph - 28, 250, 15, S0.muted, false, "center");
        const x = px + 296, w = pw - 296 - 30;
        let y = py + 24;
        cardText(b, spec.kicker || "", x, y, w, 16, S0.muted, true);
        y += 24;
        cardText(b, spec.title || "", x, y, w, 40, spec.titleColor || S0.accent, true);
        y += 54;
        if (spec.sub) { cardText(b, spec.sub, x, y, w, 21, spec.subColor || S0.text); y += 36; }
        if (spec.say) {
            const qs = wrapText(b, "„" + spec.say + "”", w - 20, 20);
            b.fillRect(x, y + 2, 3, qs.length * 27 - 2, S0.accentDim);
            for (const l of qs) { cardText(b, l, x + 14, y, w - 20, 20, "#d8dde3"); y += 27; }
            y += 12;
        }
        for (const line of spec.lines || []) {
            const colour = Array.isArray(line) ? line[1] : null, text = Array.isArray(line) ? line[0] : line;
            b.fillRect(x + 3, y + 10, 6, 6, colour || S0.accent);
            for (const l of wrapText(b, text, w - 26, 19)) { cardText(b, l, x + 20, y, w - 26, 19, colour || S0.text); y += 25; }
            y += 3;
        }
        const ky = py + ph - 96;
        b.fillRect(x, ky - 12, w, 1, S0.line);
        if (spec.keys) keyHintsInto(b, spec.keys, x, ky);
        cardText(b, spec.foot || "O - zaczynamy", x, py + ph - 48, w, 22, S0.accent, true, "right");
        dirty(b);
    }

    class Scene_TavernGame extends Scene_Base {
        initialize() {
            super.initialize();
            this.opts = (GAME.pending && GAME.pending.opts) || {};
            GAME.pending = null;
        }
        create() {
            super.create();
            this.rng = makeRng(this.opts.seed !== undefined ? Number(this.opts.seed) : (Date.now() ^ 0x5bd1e995) >>> 0);
            this.turbo = clamp(Math.floor(this.opts.turbo || 1), 1, 40);
            this.stake = Math.max(0, Math.floor(this.opts.stake || 0));
            this.createBack();
            this.root = new Sprite();
            this.addChild(this.root);
            this.createGame();
            this.hud = new Sprite(new Bitmap(W1, H1));
            this.addChild(this.hud);
            this.overlay = new Sprite(new Bitmap(W1, H1));
            this.overlay.visible = false;
            this.addChild(this.overlay);
            ImageManager.loadSystem("IconSet");
        }
        createBack() {
            // the tavern behind, blurred once into a picture of its own (a filter would blur it again every frame)
            const snap = SceneManager.backgroundBitmap();
            let pic = null;
            if (snap && snap.canvas) {
                pic = new Bitmap(W1, H1);
                const c = pic.context;
                c.filter = "blur(5px)";
                c.drawImage(snap.canvas, -8, -8, W1 + 16, H1 + 16);
                c.filter = "none";
                dirty(pic);
            }
            this.back = new Sprite(pic);
            this.addChild(this.back);
            const shade = new Bitmap(W1, H1), ctx = shade.context, g = ctx.createRadialGradient(W1 / 2, H1 * 0.46, 120, W1 / 2, H1 / 2, 760);
            g.addColorStop(0, "rgba(8,6,4,0.55)"); g.addColorStop(1, "rgba(4,3,2,0.9)");
            ctx.fillStyle = g; ctx.fillRect(0, 0, W1, H1);
            dirty(shade);
            this.addChild(new Sprite(shade));
        }
        start() {
            super.start();
            GAME.running = this;
            this.keys = {}; this.prev = {}; this.trig = {};
            this.phase = "none"; this.phaseT = 0; this.t = 0;
            this.startFadeIn(this.fadeSpeed(), false);
            this.begin();
        }
        update() {
            super.update();
            if (this.phase === "left") return;
            for (let i = 0; i < this.turbo; i++) {
                if (typeof GAME.onTick === "function") { try { GAME.onTick(this); } catch (e) { console.error(e); GAME.onTick = null; } }
                this.readKeys();
                this.t++;
                this.phaseT++;
                this.tick();
                if (this.phase === "leaving") break;
            }
            this.frame();
            if (this.phase === "leaving" && !this.isFading() && !this._popped) {
                this._popped = true;
                this.phase = "left";
                SceneManager.pop();
            }
        }
        readKeys() {
            const now = { ok: Input.isPressed("ok") || TouchInput.isPressed(), cancel: Input.isPressed("cancel"),
                up: Input.isPressed("up"), down: Input.isPressed("down"), left: Input.isPressed("left"), right: Input.isPressed("right") };
            for (const k in now) { this.trig[k] = now[k] && !this.prev[k]; this.prev[k] = now[k]; }
            this.keys = now;
        }
        setPhase(p) { this.phase = p; this.phaseT = 0; }
        showCard(spec) { drawGameCard(this.overlay.bitmap, spec); this.overlay.visible = true; }
        hideCard() { this.overlay.visible = false; }
        // the end: the result goes to the map (the money is paid there, where it can be seen), then onEnd
        leave() {
            const res = this.result;
            const toMap = SceneManager._stack.length && SceneManager._stack[SceneManager._stack.length - 1] === Scene_Map;
            if (toMap) GAME.end = { result: res, onEnd: this.opts.onEnd };
            else { applyGameResult(res); if (typeof this.opts.onEnd === "function") { try { this.opts.onEnd(res); } catch (e) { console.error(e); } } }
            GAME.lastResult = res;
            this.setPhase("leaving");
            this.startFadeOut(this.fadeSpeed(), false);
        }
        terminate() {
            super.terminate();
            Input.clear();
            TouchInput.clear();
            if (GAME.running === this) GAME.running = null;
        }
        // a pause (P): go on, or give up (the stake is lost)
        tickPause() {
            const kt = this.trig;
            if (kt.up || kt.down) { this.pauseSel = 1 - this.pauseSel; se("Cursor1", 55); this.drawPause(); }
            else if (kt.cancel || (kt.ok && this.pauseSel === 0)) { this.paused = false; this.hideCard(); se("Cancel1", 55); }
            else if (kt.ok && this.pauseSel === 1) { this.paused = false; se("Decision1", 60); this.giveUp(); }
        }
        drawPause() {
            const b = this.overlay.bitmap, S0 = U();
            this.overlay.visible = true;
            b.clear();
            b.fillRect(0, 0, W1, H1, "rgba(0,0,0,0.55)");
            const pw = 460, ph = 250, px = (W1 - pw) / 2, py = (H1 - ph) / 2;
            panelInto(b, px, py, pw, ph, { cut: 10 });
            cardText(b, "Pauza", px + 26, py + 18, pw - 52, 30, S0.accent, true);
            ["Gramy dalej", "Poddaję się (" + (this.stake ? "tracisz " + this.stake + " G" : "przegrana") + ")"].forEach((o, i) => {
                const y = py + 82 + i * 52, sel = i === this.pauseSel;
                if (sel) { b.fillRect(px + 20, y, pw - 40, 42, "rgba(255,210,63,0.16)"); b.fillRect(px + 20, y, 4, 42, S0.accent); }
                cardText(b, o, px + 40, y + 7, pw - 70, 21, sel ? S0.accent : S0.text, sel);
            });
            cardText(b, "O - wybierz · P - wróć", px, py + ph - 40, pw - 26, 17, S0.muted, false, "right");
        }
        // the lines said over the busts
        sayOver(key, text, frames) {
            const s = this[key];
            if (!s || !text) return;
            s.bitmap = bubbleBitmap(text, s._side);
            s._life = frames || 150;
            s._t = 0;
        }
        updateBubbles() {
            for (const key of ["bubbleL", "bubbleR"]) {
                const s = this[key];
                if (!s || !s._life) continue;
                s._t++;
                s.opacity = Math.round(255 * Math.min(1, s._t / 8, (s._life - s._t) / 14));
                s.y = s._y - Math.round(4 * (1 - Math.min(1, s._t / 8)));
                if (s._t >= s._life) { s._life = 0; s.opacity = 0; }
            }
        }
        makeBubbles(lx, ly, rx, ry) {
            for (const [key, side, x, y] of [["bubbleL", "left", lx, ly], ["bubbleR", "right", rx, ry]]) {
                const s = new Sprite();
                s._side = side;
                s.anchor.set(side === "left" ? 0 : 1, 1);
                s.x = x; s._y = s.y = y;
                s.opacity = 0;
                this[key] = s;
                this.addChild(s);
            }
        }
    }

    // what a game's end does: the stake paid or won, the time, the strength, the numbers, the experience
    function applyGameResult(res) {
        if (!res || res.applied) return;
        res.applied = true;
        if (res.won && res.stake > 0) $gameParty.gainGold(res.stake);
        else if (!res.won && res.stake > 0) { const n = Math.min(gold(), res.stake); $gameParty.loseGold(n); spend(n); }
        pass(res.minutes / 60);
        if (res.stamina > 0 && typeof $gameSystem.changeStamina === "function") $gameSystem.changeStamina(-res.stamina);
        const st = S()[res.game];
        st.played++;
        if (res.won) { st.won++; st.net += res.stake; } else { st.lost++; st.net -= res.stake; }
        if (res.game === "arm") {
            st.streak = res.won ? Math.max(1, st.streak + 1) : Math.min(-1, st.streak - 1);
            if (res.won) st.level = Math.min(6, st.level + 1);   // (Grum takes it harder after each loss of his)
        } else {
            st.best = Math.max(st.best || 0, res.score || 0);
            st.bulls = (st.bulls || 0) + (res.bulls || 0);
        }
        xp(res.won ? (res.game === "arm" ? ARM.xpWin : DARTS.xpWin) : (res.game === "arm" ? ARM.xpLose : DARTS.xpLose), res.game === "arm" ? "siłowanie z Grumem" : "rzutki");
        if (first(res.game)) {
            if (res.game === "arm") note("Siłowanie z Grumem", "Grum Żelazna Pięść siłuje się na rękę o stawkę (" + ARM_STAKES.join(", ") + " G) przy stole w sali. Trzy rundy: wskazówka siły ma zostać w zielonym polu (przytrzymaj albo stukaj O), a Grum co chwila szarpie. Siła poszerza zielone pole. Po każdej jego przegranej Grum bierze się mocniej do roboty.");
            else note("Rzutki", "Przy tarczy w karczmie gra się w rzutki o stawkę (" + DARTS_STAKES.join(", ") + " G): trzy rundy po trzy lotki, strzałki przesuwają cel, O rzuca. Środek (byk) 50, pierścień przy nim 25, reszta tarczy tyle, ile liczba wycinka. Zręczność i Czujność uspokajają rękę.");
        }
    }
    const _Scene_Map_start = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function() {
        _Scene_Map_start.call(this);
        const e = GAME.end;
        if (!e) return;
        GAME.end = null;
        applyGameResult(e.result);
        if (typeof e.onEnd === "function") { try { e.onEnd(e.result); } catch (err) { console.error(err); } }
    };

    // ------------------------------------------------------------------
    // ARM WRESTLING with Grum: keep the needle of strength in the green field (hold or tap O) while Grum jerks now and then; in the
    // field your arm wins ground, out of it his does. Three rounds (two won ends it). Siła widens the field, Kondycja softens his jerks.
    // ------------------------------------------------------------------
    const AW = {
        pivot: { x: 640, y: 655 }, scale: 1.55, maxTilt: 0.46, slamTilt: 0.95,
        dial: { x: 640, y: 196, r: 118, a0: Math.PI + 0.3, a1: Math.PI * 2 - 0.3 },
        hold: 0.0024, tap: 0.012, gravity: 0.0014, damp: 0.93,
        gain: 0.0036, loss: 0.0022, roundTicks: 2400
    };
    const grumLines = {
        hello: ["Siłujesz się? Ha! Ostatni, co próbował, do dziś je lewą ręką.", "Znowu ty? Dobra, dziś bez taryfy ulgowej.", "Wróciłeś? Uparty jesteś. Lubię upartych - łatwiej ich łamać.",
            "Ha! Słyszałem, że mnie pokonałeś. Nie słyszałem, że dwa razy.", "Ty i ja, łokieć w łokieć. Tym razem rozgrzałem się przed śniadaniem.", "Dobra. Od dziś siłuję się na serio.", "Chłopcze... ty mnie wykończysz. Siadaj."],
        round: ["Gotów? Bo ja się dopiero rozgrzewam.", "Trzymaj mocno, chłopcze.", "Łokieć na stół. I nie płacz potem."],
        burst: ["Hrrraaah!", "Hyyy!", "Nnngh!", "A masz!", "Hop!"],
        winning: ["To wszystko?", "Łaskoczesz mnie?", "Mój miecz waży więcej niż ty!", "Ziewam..."],
        losing: ["Co ty... jadłeś?!", "Nngh... nieźle...", "Kto cię... tego nauczył?!", "Ej... ej!"],
        roundHe: ["I po zabawie!", "Następna runda - jeśli jeszcze czujesz rękę.", "Ha! Stół się ucieszył."],
        roundYou: ["Szczęście! Czyste szczęście!", "Dobra... teraz na serio.", "Rozgrzewka. To była rozgrzewka."],
        won: ["Ha! Wracaj, jak podrośniesz.", "Nie martw się, mało kto ze mną wygrywa. Właściwie nikt.", "Stawka moja. Postawię ci z niej piwo... kiedyś."],
        lost: ["Masz krzepę, przyznaję. Stawka twoja.", "Na brodę mojej matki... wygrałeś uczciwie.", "Dobra, dobra. Ale następnym razem nie jadłem obiadu."]
    };
    const pick = (list, rng) => list[Math.floor((rng ? rng() : Math.random()) * list.length) % list.length];
    function armTableBitmaps() {
        return cached("armTable", () => {
            const top = new Bitmap(W1, 70), front = new Bitmap(W1, 130), t = top.context, f = front.context;
            t.imageSmoothingEnabled = false;
            const g = t.createLinearGradient(0, 0, 0, 70);
            g.addColorStop(0, "#6b4a2c"); g.addColorStop(1, "#4a321d");
            t.fillStyle = g; t.fillRect(0, 0, W1, 70);
            for (let x = 0; x < W1; x += 160) { t.fillStyle = "rgba(0,0,0,0.3)"; t.fillRect(x, 0, 2, 70); }
            for (let i = 0; i < 90; i++) { t.fillStyle = "rgba(30,18,8," + (0.15 + hash(i, 1) * 0.2).toFixed(2) + ")"; t.fillRect(Math.floor(hash(i, 2) * W1), Math.floor(hash(i, 3) * 66) + 2, 20 + Math.floor(hash(i, 4) * 60), 2); }
            t.fillStyle = "rgba(255,220,160,0.18)"; t.fillRect(0, 0, W1, 3);
            const g2 = f.createLinearGradient(0, 0, 0, 130);
            g2.addColorStop(0, "#3a2616"); g2.addColorStop(1, "#1d130b");
            f.fillStyle = g2; f.fillRect(0, 0, W1, 130);
            f.fillStyle = "#7a5634"; f.fillRect(0, 0, W1, 6);
            f.fillStyle = "#2a1a0e"; f.fillRect(0, 6, W1, 3);
            for (let x = 40; x < W1; x += 200) { f.fillStyle = "rgba(0,0,0,0.35)"; f.fillRect(x, 10, 3, 120); f.fillStyle = "#8a6a45"; f.fillRect(x - 1, 30, 5, 5); f.fillRect(x - 1, 96, 5, 5); }
            dirty(top); dirty(front);
            return { top, front };
        });
    }
    function dialBackBitmap() {
        return cached("dialBack", () => {
            const d = AW.dial, b = new Bitmap(360, 200), ctx = b.context, cx = 180, cy = 166, S0 = U();
            ctx.save();
            ctx.fillStyle = "rgba(11,12,15,0.9)";
            ctx.beginPath(); ctx.arc(cx, cy, d.r + 34, Math.PI, Math.PI * 2); ctx.lineTo(cx + d.r + 34, cy + 22); ctx.lineTo(cx - d.r - 34, cy + 22); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = S0.line; ctx.lineWidth = 1; ctx.stroke();
            ctx.lineCap = "butt";
            ctx.strokeStyle = "#1c1f25"; ctx.lineWidth = 22;
            ctx.beginPath(); ctx.arc(cx, cy, d.r, d.a0, d.a1); ctx.stroke();
            ctx.strokeStyle = "#2b2f37"; ctx.lineWidth = 1;
            for (let i = 0; i <= 20; i++) {
                const a = d.a0 + (d.a1 - d.a0) * i / 20, r0 = d.r + (i % 5 === 0 ? 14 : 12), r1 = d.r + 20;
                ctx.strokeStyle = i % 5 === 0 ? "#6d737d" : "#3d424b"; ctx.lineWidth = i % 5 === 0 ? 2 : 1;
                ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke();
            }
            ctx.restore();
            cardText(b, "słabo", cx - d.r - 32, cy - 2, 80, 14, S0.muted);
            cardText(b, "za mocno", cx + d.r - 46, cy - 2, 80, 14, S0.muted, false, "right");
            cardText(b, "SIŁA", cx - 60, cy + 14, 120, 13, S0.muted, true, "center");
            dirty(b);
            return b;
        });
    }

    class Scene_ArmWrestle extends Scene_TavernGame {
        createGame() {
            this.level = clamp(this.opts.level !== undefined ? Number(this.opts.level) : S().arm.level, 0, 6);
            this.str = attr("str");
            this.con = attr("con");
            this.zoneW = clamp(0.17 + 0.0035 * (this.str - 5), 0.17, 0.34) * (1 - 0.03 * this.level);
            this.first = !S().firsts.arm;
            const tb = armTableBitmaps();
            this.hero = new Sprite(ImageManager.loadPicture(heroBust()));
            this.hero.anchor.set(0.5, 1);
            this.hero.scale.set(-1.16, 1.16);
            this.hero.x = 300; this.hero.y = 628;
            this.grum = new Sprite(ImageManager.loadPicture(bustOf("grum")));
            this.grum.anchor.set(0.5, 1);
            this.grum.scale.set(1.16, 1.16);
            this.grum.x = 990; this.grum.y = 628;
            this.top = new Sprite(tb.top); this.top.y = 560;
            this.arms = new Sprite(ImageManager.loadPicture(ARMS_PICTURE));
            this.arms.anchor.set(0.5, 244 / 256);
            this.arms.scale.set(AW.scale, AW.scale);
            this.arms.x = AW.pivot.x; this.arms.y = AW.pivot.y;
            this.front = new Sprite(tb.front); this.front.y = 616;
            this.dialBack = new Sprite(dialBackBitmap());
            this.dialBack.x = AW.dial.x - 180; this.dialBack.y = AW.dial.y - 166;
            this.dial = new Sprite(new Bitmap(360, 240));
            this.dial.x = this.dialBack.x; this.dial.y = this.dialBack.y;
            this.drops = [];
            for (const s of [this.hero, this.grum, this.arms, this.top, this.front, this.dialBack, this.dial]) this.root.addChild(s);
            this.makeBubbles(60, 250, 1220, 250);
            // the state
            this.round = 0; this.youWon = 0; this.heWon = 0; this.rounds = [];
            this.n = 0.12; this.v = 0; this.b = 0; this.zc = 0.5; this.zt = 0.5; this.zNext = 0; this.burstAt = 0; this.shake = 0;
            this.tilt = 0; this.inZone = false; this.ticks = 0; this.zoneTicks = 0;
        }
        begin() {
            const hello = grumLines.hello[Math.min(this.level, grumLines.hello.length - 1)];
            const card = { bust: bustOf("grum"), who: "Grum", whoSub: "Żelazna Pięść, najemnik", kicker: "SIŁOWANIE NA RĘKĘ" + (this.level ? " · GRUM PODKRĘCA: " + this.level : ""),
                title: this.stake ? "Stawka: " + this.stake + " G" : "Siłowanie na rękę", say: hello,
                lines: this.first ? ["Trzymaj wskazówkę SIŁY w zielonym polu: przytrzymaj O, żeby ją podnieść, puść, żeby opadła - albo stukaj O.",
                    "W zielonym polu twoja ręka zyskuje, poza nim zyskuje Grum. Co chwila Grum szarpie - wtedy wskazówka leci w dół, a pole skacze.",
                    "Trzy rundy: kto pierwszy wygra dwie, bierze stawkę. Siła poszerza zielone pole, Kondycja łagodzi szarpnięcia."]
                    : ["Wskazówka w zielonym polu: przytrzymaj albo stukaj O.", "Dwie wygrane rundy biorą stawkę."],
                keys: [["O", "siła (trzymaj / stukaj)"], ["P", "pauza"]], foot: "O - łokieć na stół" };
            this.showCard(card);
            this.setPhase("card");
        }
        tick() {
            switch (this.phase) {
                case "card":
                    if (this.phaseT > 16 && this.trig.ok) { se("Decision1", 60); this.hideCard(); this.nextRound(); }
                    break;
                case "ready":
                    if (this.phaseT === 1) this.sayOver("bubbleR", pick(grumLines.round, this.rng), 110);
                    if ([20, 50, 80].includes(this.phaseT)) se("Cursor2", 60, 90 + this.phaseT / 4);
                    if (this.phaseT >= 110) { se("Blow1", 70, 80); this.setPhase("pull"); }
                    break;
                case "pull":
                    if (this.paused) { this.tickPause(); break; }
                    if (this.trig.cancel) { this.paused = true; this.pauseSel = 0; se("Cancel1", 60); this.drawPause(); break; }
                    this.pull();
                    break;
                case "slam":
                    if (this.phaseT >= 70) {
                        if (this.youWon >= 2 || this.heWon >= 2 || this.round >= 3) this.finish(false);
                        else this.nextRound();
                    }
                    break;
                case "summary":
                    if (this.phaseT > 30 && this.trig.ok) { se("Decision1", 60); this.leave(); }
                    break;
            }
        }
        nextRound() {
            this.round++;
            this.n = 0.1; this.v = 0; this.b = 0; this.tilt = 0; this.ticks = 0;
            this.zc = 0.35 + this.rng() * 0.3; this.zt = this.zc; this.zNext = 60; this.burstAt = this.nextBurst();
            this.setPhase("ready");
        }
        nextBurst() { return Math.round((150 - 14 * this.level) + this.rng() * 90); }
        pull() {
            const k = this.keys, kt = this.trig, lo = () => this.zc - this.zoneW / 2, hi = () => this.zc + this.zoneW / 2;
            this.ticks++;
            // the needle: holding lifts it, a tap kicks it up, it sinks by itself
            if (k.ok) this.v += AW.hold;
            if (kt.ok) this.v += AW.tap;
            this.v -= AW.gravity;
            this.v *= AW.damp;
            this.n += this.v;
            if (this.n < 0) { this.n = 0; this.v = Math.max(0, this.v); }
            if (this.n > 1) { this.n = 1; this.v = Math.min(0, this.v); }
            // the field wanders; Grum's jerks knock the needle down and throw the field aside
            if (--this.zNext <= 0) { this.zt = this.zoneW / 2 + 0.06 + this.rng() * (1 - this.zoneW - 0.12); this.zNext = 70 + Math.floor(this.rng() * 90); }
            const speed = 0.004 + 0.0009 * this.level;
            this.zc += clamp(this.zt - this.zc, -speed, speed);
            if (--this.burstAt <= 0) {
                this.burstAt = this.nextBurst();
                this.v -= (0.05 + 0.008 * this.level) * clamp(1 - 0.01 * (this.con - 5), 0.6, 1);
                this.zt = clamp(this.zc + (this.rng() < 0.5 ? -1 : 1) * (0.12 + this.rng() * 0.08), this.zoneW / 2 + 0.04, 1 - this.zoneW / 2 - 0.04);
                this.shake = 14;
                this.sayOver("bubbleR", pick(grumLines.burst, this.rng), 60);
                se("Blow1", 55, 70);
            }
            // who gains ground
            this.inZone = this.n >= lo() && this.n <= hi();
            if (this.inZone) { this.b += AW.gain * (1 + 0.004 * (this.str - 5)); this.zoneTicks++; }
            else { const dist = this.n < lo() ? lo() - this.n : this.n - hi(); this.b -= (AW.loss + 0.0005 * this.level) * (1 + dist * 4); }
            this.b = clamp(this.b, -1, 1);
            if (this.ticks % 150 === 75) {
                if (this.b < -0.45) this.sayOver("bubbleR", pick(grumLines.winning, this.rng), 100);
                else if (this.b > 0.45) this.sayOver("bubbleR", pick(grumLines.losing, this.rng), 100);
                else if (this.inZone && this.rng() < 0.4) this.sayOver("bubbleL", pick(["Nnngh!", "Jeszcze... trochę...", "Trzymaj się, ręko..."], this.rng), 80);
            }
            if (this.b >= 1 || this.b <= -1 || this.ticks >= AW.roundTicks) this.endRound(this.b > 0 || (this.b === 0 && this.zoneTicks > this.ticks / 2));
        }
        endRound(you) {
            if (you) this.youWon++; else this.heWon++;
            this.rounds.push(you ? "you" : "grum");
            this.slamTo = you ? 1 : -1;
            se("Blow3", 85, you ? 100 : 80);
            se("Damage1", 45, 120);
            this.shake = 20;
            const last = this.youWon >= 2 || this.heWon >= 2 || this.round >= 3;
            if (!last) this.sayOver("bubbleR", pick(you ? grumLines.roundYou : grumLines.roundHe, this.rng), 110);
            this.setPhase("slam");
        }
        giveUp() {
            this.heWon = Math.max(this.heWon, 2);
            this.finish(true);
        }
        finish(gaveUp) {
            const won = !gaveUp && this.youWon > this.heWon;
            this.result = { game: "arm", won, stake: this.stake, rounds: this.rounds.slice(), you: this.youWon, grum: this.heWon, gaveUp: !!gaveUp,
                level: this.level, minutes: ARM.minutes, stamina: ARM.stamina };
            const line = pick(won ? grumLines.lost : grumLines.won, this.rng);
            this.result.line = line;
            if (won) se("Applause1", 55);
            this.showCard({ bust: bustOf("grum"), who: "Grum", whoSub: "Żelazna Pięść, najemnik", kicker: "SIŁOWANIE NA RĘKĘ · KONIEC", title: won ? "Wygrana!" : gaveUp ? "Poddałeś się" : "Przegrana",
                titleColor: won ? U().accent : BAD, sub: "Rundy: " + this.youWon + " : " + this.heWon + (this.stake ? "   ·   " + (won ? "+" : "−") + this.stake + " G" : ""), subColor: won ? GOOD : BAD,
                say: line, lines: [["Czas: " + ARM.minutes + " minut gry   ·   wytrzymałość −" + ARM.stamina, U().muted], [won ? "Grum następnym razem przyłoży się mocniej." : "Grum się nie zmienia - ty możesz: Siła poszerza zielone pole.", U().muted]],
                foot: "O - wracam do sali", h: 440 });
            this.setPhase("summary");
        }
        frame() {
            this.updateBubbles();
            // the arms: the balance tilts them (towards Grum when you win), a jerk shakes them, the end of a round slams them down
            let want = this.b * AW.maxTilt;
            if (this.phase === "slam") want = this.slamTo * AW.slamTilt * ease(this.phaseT / 10);
            if (this.phase === "ready" || this.phase === "card") want = 0;
            this.tilt += (want - this.tilt) * (this.phase === "slam" ? 0.5 : 0.18);
            const jitter = this.phase === "pull" ? (this.inZone ? 1.2 : 0.6) : 0;
            if (this.shake > 0) this.shake--;
            const sh = this.shake > 0 ? (this.shake % 2 ? 1 : -1) * this.shake * 0.35 : 0;
            this.arms.rotation = this.tilt + (Math.random() - 0.5) * 0.004 * jitter * 4;
            this.arms.x = AW.pivot.x + sh + (Math.random() - 0.5) * jitter;
            this.arms.y = AW.pivot.y + Math.abs(this.tilt) * 18;
            // the busts strain: the one losing leans in
            const strain = this.phase === "pull" ? 1 : 0;
            this.hero.x = 300 + (this.b < 0 ? this.b * 10 : this.b * 4) * strain + (strain ? (Math.random() - 0.5) * 1.5 : 0);
            this.grum.x = 990 + (this.b > 0 ? this.b * 10 : this.b * 4) * strain - sh;
            this.hero.setColorTone([Math.round(Math.max(0, -this.b) * 40 * strain), 0, 0, 0]);
            this.grum.setColorTone([Math.round(Math.max(0, this.b) * 40 * strain), 0, 0, 0]);
            if (strain && this.t % 40 === 0) this.addDrop(this.b < 0.3 ? 300 : 990);
            this.updateDrops();
            if (!this._grumFaded && this.grum.bitmap && this.grum.bitmap.isReady()) this.fadeGrum();
            this.drawDial();
            this.drawHud();
        }
        // the RTP bust ends at the picture's left edge (his raised fist is cut there): that edge fades into the dark
        fadeGrum() {
            const src = this.grum.bitmap, w = src.width, h = src.height, b = new Bitmap(w, h), ctx = b.context;
            b.blt(src, 0, 0, w, h, 0, 0);
            const g = ctx.createLinearGradient(0, 0, 70, 0);
            g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)");
            ctx.globalCompositeOperation = "destination-out";
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 70, h);
            ctx.globalCompositeOperation = "source-over";
            dirty(b);
            this.grum.bitmap = b;
            this._grumFaded = true;
        }
        addDrop(x) {
            const s = new Sprite(dropBitmap());
            s.scale.set(2, 2);
            s.x = x + (Math.random() - 0.5) * 60; s.y = 330 + Math.random() * 40;
            s._vy = 0.5;
            this.root.addChild(s);
            this.drops.push(s);
        }
        updateDrops() {
            for (let i = this.drops.length - 1; i >= 0; i--) {
                const s = this.drops[i];
                s._vy += 0.12; s.y += s._vy; s.opacity -= 6;
                if (s.opacity <= 0) { this.root.removeChild(s); this.drops.splice(i, 1); }
            }
        }
        drawDial() {
            const d = AW.dial, b = this.dial.bitmap, ctx = b.context, cx = 180, cy = 166, S0 = U(), ang = v => d.a0 + (d.a1 - d.a0) * clamp(v, 0, 1);
            b.clear();
            if (this.phase === "card" || this.phase === "summary") { dirty(b); return; }
            ctx.save();
            ctx.lineCap = "butt";
            const lo = this.zc - this.zoneW / 2, hi = this.zc + this.zoneW / 2, hot = this.inZone && this.phase === "pull";
            if (hot) { ctx.strokeStyle = "rgba(120,240,130,0.25)"; ctx.lineWidth = 34; ctx.beginPath(); ctx.arc(cx, cy, d.r, ang(lo), ang(hi)); ctx.stroke(); }
            ctx.strokeStyle = hot ? "#8ef08a" : "#3f9a49"; ctx.lineWidth = 20;
            ctx.beginPath(); ctx.arc(cx, cy, d.r, ang(lo), ang(hi)); ctx.stroke();
            ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(cx, cy, d.r + 9, ang(lo), ang(hi)); ctx.stroke();
            // the needle
            const a = ang(this.n), tipR = d.r + 16;
            ctx.lineCap = "round";
            ctx.strokeStyle = "rgba(8,9,11,0.9)"; ctx.lineWidth = 8;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * tipR, cy + Math.sin(a) * tipR); ctx.stroke();
            ctx.strokeStyle = S0.accent; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * tipR, cy + Math.sin(a) * tipR); ctx.stroke();
            ctx.fillStyle = "#15171b"; ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = S0.accent; ctx.lineWidth = 2; ctx.stroke();
            // the ground: a bar under the dial - your side yellow, Grum's red
            const bw = 300, bx = cx - bw / 2, by = cy + 40;
            ctx.fillStyle = S0.line; ctx.fillRect(bx - 1, by - 1, bw + 2, 12);
            ctx.fillStyle = "#16181c"; ctx.fillRect(bx, by, bw, 10);
            const mid = bx + bw / 2, to = mid + this.b * bw / 2;
            ctx.fillStyle = this.b >= 0 ? S0.accent : "#e5484d";
            ctx.fillRect(Math.min(mid, to), by, Math.abs(to - mid), 10);
            ctx.fillStyle = "#eceef0"; ctx.fillRect(mid - 1, by - 3, 2, 16);
            ctx.restore();
            const lead = this.b > 0.05 ? "przewaga: ty" : this.b < -0.05 ? "przewaga: Grum" : "remis";
            cardText(b, lead, cx - 150, by + 14, 300, 15, this.b > 0.05 ? S0.accent : this.b < -0.05 ? BAD : S0.muted, true, "center");
            if (this.phase === "ready") {
                const n = 3 - Math.floor(this.phaseT / 30);
                cardText(b, n > 0 ? String(n) : "Ciągnij!", cx - 150, cy - 96, 300, n > 0 ? 44 : 34, S0.accent, true, "center");
            }
            dirty(b);
        }
        drawHud() {
            const key = [this.round, this.youWon, this.heWon, this.phase === "pull" || this.phase === "ready" || this.phase === "slam"].join("|");
            if (key === this._hudKey) return;
            this._hudKey = key;
            const b = this.hud.bitmap, S0 = U();
            b.clear();
            if (this.phase === "card" || this.phase === "summary") return;
            panelInto(b, 20, 16, 380, 70, { cut: 6 });
            cardText(b, "SIŁOWANIE NA RĘKĘ", 36, 22, 340, 15, S0.muted, true);
            cardText(b, "z Grumem" + (this.stake ? "  ·  stawka " + this.stake + " G" : ""), 36, 42, 340, 22, S0.accent, true);
            panelInto(b, W1 - 300, 16, 280, 70, { cut: 6 });
            cardText(b, "RUNDA " + Math.max(1, this.round) + " Z 3", W1 - 284, 22, 250, 15, S0.muted, true);
            const pips = (x, y, n, colour, label) => {
                cardText(b, label, x, y - 2, 70, 18, S0.text);
                for (let i = 0; i < 2; i++) { b.fillRect(x + 64 + i * 22, y + 4, 14, 14, i < n ? colour : "#2a2e35"); }
            };
            pips(W1 - 284, 46, this.youWon, S0.accent, "Ty");
            pips(W1 - 150, 46, this.heWon, "#e5484d", "Grum");
            panelInto(b, 330, 666, 620, 38, { cut: 5, accent: false });
            keyHintsInto(b, [["O", "trzymaj lub stukaj: wskazówka SIŁY w zielonym polu"], ["P", "pauza"]], 348, 673);
        }
        state() {
            return { phase: this.phase, round: this.round, you: this.youWon, grum: this.heWon, n: this.n, lo: this.zc - this.zoneW / 2, hi: this.zc + this.zoneW / 2,
                zone: this.zoneW, b: this.b, inZone: this.inZone, level: this.level, paused: !!this.paused, result: this.result || null };
        }
    }
    window.Scene_ArmWrestle = Scene_ArmWrestle;

    // ------------------------------------------------------------------
    // DARTS: a painted board, a swaying sight (the arrows move the aim, O throws), three darts a round, three rounds against Ozzy or
    // the carter Wiesiek. Bull 50, the ring round it 25, the rest of the board the number of its wedge. Zręczność and Czujność
    // steady the hand.
    // ------------------------------------------------------------------
    const DB = { cx: 540, cy: 356, rs: 176, bull: 12, outer: 28, frame: 212 };
    const ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
    function dartScore(dx, dy) {
        const r = Math.hypot(dx, dy);
        if (r <= DB.bull) return 50;
        if (r <= DB.outer) return 25;
        if (r > DB.rs) return 0;
        const deg = ((Math.atan2(dx, -dy) * 180 / Math.PI) + 360 + 9) % 360;
        return ORDER[Math.floor(deg / 18) % 20];
    }
    const OPPONENTS = {
        ozzy: { name: "Dziadek Ozzy", short: "Ozzy", role: "ozzy", sway: 50, scatter: 15, lucky: 0.16, aim: "bull",
            hello: "*czkawka* Rzutki? Kiedyś trafiałem muchę w locie. Dziś trafiam tarczę. Zazwyczaj.",
            throwLines: ["Hop!", "*czkawka*", "Ups...", "Celuję w środkową z trzech tarcz..."], good: ["Byk! Widziałeś? Nikt nie widział...", "Hehe, stara ręka!"],
            won: "Hehe! Stary Ozzy jeszcze umie! Postawisz mi piwo z tej stawki? Nie? No trudno.", lost: "Trzy tarcze to jednak za dużo dla jednego oka... Wygrałeś, synu. Uczciwie." },
        wiesiek: { name: "Furman Wiesiek", short: "Wiesiek", role: null, bust: "People1_5", face: ["People1", 4], sway: 38, scatter: 10, lucky: 0.05, aim: "twenty",
            hello: "Rzucamy? Ja furman: oko mam jak jastrząb - od patrzenia na drogę między końskimi uszami.",
            throwLines: ["Rzut furmański!", "Prosto jak droga do młyna.", "Wiooo!"], good: ["Dwadzieścia! Wiedziałem.", "I kto tu jest jastrząb?"],
            won: "Ha! Nie ma to jak oko furmana. Stawka moja - dziękuję uprzejmie.", lost: "Eee, wiatr zawiał od drzwi. Ale wygrałeś, nie ma co gadać." }
    };
    function dartBoardBitmap() {
        return cached("dartBoard", () => {
            const size = 460, c = size / 2, b = new Bitmap(size, size), ctx = b.context, S0 = U();
            ctx.save();
            ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.beginPath(); ctx.arc(c + 8, c + 12, DB.frame + 6, 0, Math.PI * 2); ctx.fill();   // its shadow on the wall
            const wood = ctx.createRadialGradient(c - 40, c - 50, 20, c, c, DB.frame);
            wood.addColorStop(0, "#7a5230"); wood.addColorStop(1, "#4a2e18");
            ctx.fillStyle = wood; ctx.beginPath(); ctx.arc(c, c, DB.frame, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = "#2a190c"; ctx.lineWidth = 3; ctx.stroke();
            for (let i = 0; i < 40; i++) {   // the grain of the wooden rim
                const a = hash(i, 21) * Math.PI * 2, r = DB.rs + 6 + hash(i, 22) * (DB.frame - DB.rs - 10);
                ctx.strokeStyle = "rgba(30,18,8,0.35)"; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(c, c, r, a, a + 0.3 + hash(i, 23) * 0.5); ctx.stroke();
            }
            // the wedges
            for (let i = 0; i < 20; i++) {
                const a0 = (i * 18 - 9 - 90) * Math.PI / 180, a1 = a0 + 18 * Math.PI / 180;
                ctx.fillStyle = i % 2 ? "#e6d9ba" : "#221d19";
                ctx.beginPath(); ctx.moveTo(c, c); ctx.arc(c, c, DB.rs, a0, a1); ctx.closePath(); ctx.fill();
            }
            // the sisal: fine speckles
            for (let i = 0; i < 1400; i++) {
                const a = hash(i, 31) * Math.PI * 2, r = Math.sqrt(hash(i, 32)) * DB.rs;
                ctx.fillStyle = "rgba(" + (hash(i, 33) < 0.5 ? "0,0,0,0.14" : "255,255,255,0.08") + ")";
                ctx.fillRect(Math.round(c + Math.cos(a) * r), Math.round(c + Math.sin(a) * r), 1, 1);
            }
            // the bull
            ctx.fillStyle = "#2f7d3c"; ctx.beginPath(); ctx.arc(c, c, DB.outer, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#b8252c"; ctx.beginPath(); ctx.arc(c, c, DB.bull, 0, Math.PI * 2); ctx.fill();
            // the wires
            ctx.strokeStyle = "rgba(200,200,205,0.75)"; ctx.lineWidth = 1;
            for (let i = 0; i < 20; i++) {
                const a = (i * 18 - 9 - 90) * Math.PI / 180;
                ctx.beginPath(); ctx.moveTo(c + Math.cos(a) * DB.outer, c + Math.sin(a) * DB.outer); ctx.lineTo(c + Math.cos(a) * DB.rs, c + Math.sin(a) * DB.rs); ctx.stroke();
            }
            for (const r of [DB.bull, DB.outer, DB.rs]) { ctx.beginPath(); ctx.arc(c, c, r, 0, Math.PI * 2); ctx.stroke(); }
            // a thin painted ring and the numbers on the rim
            ctx.strokeStyle = "#b8923a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(c, c, DB.rs + 3, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
            for (let i = 0; i < 20; i++) {
                const a = (i * 18 - 90) * Math.PI / 180, r = (DB.rs + DB.frame) / 2 + 1;
                cardText(b, String(ORDER[i]), Math.round(c + Math.cos(a) * r) - 20, Math.round(c + Math.sin(a) * r) - 13, 40, 19, "#f3e3bb", true, "center");
            }
            dirty(b);
            void S0;
            return b;
        });
    }
    function dartWallBitmap() {
        return cached("dartWall", () => {
            const b = new Bitmap(W1, H1), ctx = b.context;
            for (let i = 0; i < 12; i++) {   // the planks
                const x = i * 112;
                ctx.fillStyle = i % 2 ? "#3b2818" : "#412c1a"; ctx.fillRect(x, 0, 112, H1);
                ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(x, 0, 2, H1);
                for (let k = 0; k < 7; k++) { ctx.fillStyle = "rgba(20,12,6,0.25)"; ctx.fillRect(x + 10 + hash(i, k) * 90, hash(k, i) * H1, 2, 40 + hash(i + k, 3) * 120); }
            }
            const g = ctx.createRadialGradient(DB.cx, DB.cy - 60, 60, DB.cx, DB.cy, 900);   // the lamp above the board
            g.addColorStop(0, "rgba(255,200,120,0.22)"); g.addColorStop(0.5, "rgba(0,0,0,0.25)"); g.addColorStop(1, "rgba(0,0,0,0.75)");
            ctx.fillStyle = g; ctx.fillRect(0, 0, W1, H1);
            dirty(b);
            return b;
        });
    }
    function dartBitmap(colour) {
        return cached("dart" + colour, () => {
            const b = new Bitmap(16, 64), ctx = b.context;   // pointing up: the tip at the top (8, 0)
            ctx.fillStyle = "#c9ccd2"; ctx.fillRect(7, 0, 2, 12);                       // the steel tip
            ctx.fillStyle = "#7a5a2c"; ctx.fillRect(6, 12, 4, 16); ctx.fillStyle = "#d4a83a"; ctx.fillRect(6, 13, 1, 14);   // the brass barrel
            ctx.fillStyle = "#3a2a1a"; ctx.fillRect(7, 28, 2, 14);                     // the shaft
            ctx.fillStyle = colour; ctx.beginPath(); ctx.moveTo(8, 38); ctx.lineTo(1, 60); ctx.lineTo(8, 55); ctx.lineTo(15, 60); ctx.closePath(); ctx.fill();   // the flights
            ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.lineWidth = 1; ctx.stroke();
            dirty(b);
            return b;
        });
    }
    function sightBitmap(colour) {
        return cached("sight" + colour, () => {
            const b = new Bitmap(48, 48), ctx = b.context;
            ctx.strokeStyle = "rgba(0,0,0,0.75)"; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(24, 24, 12, 0, Math.PI * 2); ctx.stroke();
            for (const [x0, y0, x1, y1] of [[24, 2, 24, 14], [24, 34, 24, 46], [2, 24, 14, 24], [34, 24, 46, 24]]) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
            ctx.strokeStyle = colour; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(24, 24, 12, 0, Math.PI * 2); ctx.stroke();
            for (const [x0, y0, x1, y1] of [[24, 2, 24, 14], [24, 34, 24, 46], [2, 24, 14, 24], [34, 24, 46, 24]]) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
            ctx.fillStyle = colour; ctx.fillRect(23, 23, 2, 2);
            dirty(b);
            return b;
        });
    }
    class Scene_Darts extends Scene_TavernGame {
        createBack() {
            this.addChild(new Sprite(dartWallBitmap()));
        }
        createGame() {
            this.opp = OPPONENTS[this.opts.opponent] || OPPONENTS.ozzy;
            this.dex = attr("dex"); this.per = attr("per");
            this.amp = Math.max(16, 58 * (1 - 0.011 * (this.dex - 5)) * (1 - 0.005 * (this.per - 5)));
            this.first = !S().firsts.darts;
            this.board = new Sprite(dartBoardBitmap());
            this.board.anchor.set(0.5, 0.5);
            this.board.x = DB.cx; this.board.y = DB.cy;
            this.root.addChild(this.board);
            this.stuck = new Sprite();   // the darts in the board
            this.root.addChild(this.stuck);
            this.sight = new Sprite(sightBitmap("#ffd23f"));
            this.sight.anchor.set(0.5, 0.5);
            this.sight.visible = false;
            this.root.addChild(this.sight);
            this.flyer = new Sprite(dartBitmap("#d8b43a"));
            this.flyer.anchor.set(0.5, 0);
            this.flyer.visible = false;
            this.root.addChild(this.flyer);
            this.slate = new Sprite(new Bitmap(360, 470));
            this.slate.x = 880; this.slate.y = 110;
            this.root.addChild(this.slate);
            this.youBust = new Sprite(ImageManager.loadPicture(heroBust()));
            this.youBust.anchor.set(0.5, 1); this.youBust.scale.set(-0.5, 0.5); this.youBust.x = 960; this.youBust.y = 704;
            this.oppBust = new Sprite(ImageManager.loadPicture(this.opp.role ? bustOf(this.opp.role) : this.opp.bust));
            this.oppBust.anchor.set(0.5, 1); this.oppBust.scale.set(0.5, 0.5); this.oppBust.x = 1160; this.oppBust.y = 704;
            this.root.addChild(this.youBust);
            this.root.addChild(this.oppBust);
            this.makeBubbles(900, 540, 1250, 540);
            this.popups = [];
            this.scores = { you: [[], [], []], opp: [[], [], []] };
            this.round = 0; this.turn = "you"; this.dartNo = 0; this.bulls = 0;
            this.aim = { x: DB.cx, y: DB.cy }; this.cross = { x: DB.cx, y: DB.cy };
            this.ph = [this.rng() * 6, this.rng() * 6, this.rng() * 6, this.rng() * 6];
        }
        begin() {
            this.showCard({ bust: this.opp.role ? bustOf(this.opp.role) : this.opp.bust, who: this.opp.name, whoSub: this.opp.role ? "stały bywalec" : "gość karczmy",
                kicker: "RZUTKI" + (this.stake ? " · STAWKA " + this.stake + " G" : ""), title: "Rzutki z " + (this.opp.role ? "Ozzym" : "Wieśkiem"), say: this.opp.hello,
                lines: this.first ? ["Celownik chwieje się sam - strzałkami przesuwasz cel, O rzuca lotkę.", "Środek (byk) 50, zielony pierścień 25, reszta tarczy tyle, ile liczba wycinka. Poza tarczą: pudło.",
                    "Trzy rundy po trzy lotki na zmianę; wygrywa większa suma. Zręczność i Czujność uspokajają rękę."]
                    : ["Strzałki - cel, O - rzut. Trzy rundy po trzy lotki."],
                keys: [["strzałki", "cel"], ["O", "rzut"], ["P", "pauza"]], foot: "O - do tarczy" });
            this.setPhase("card");
        }
        tick() {
            switch (this.phase) {
                case "card": if (this.phaseT > 16 && this.trig.ok) { se("Decision1", 60); this.hideCard(); this.nextTurn(); } break;
                case "banner": if (this.phaseT >= 70) this.setPhase(this.turn === "you" ? "aim" : "oppAim"); break;
                case "aim":
                    if (this.paused) { this.tickPause(); break; }
                    if (this.trig.cancel) { this.paused = true; this.pauseSel = 0; se("Cancel1", 60); this.drawPause(); break; }
                    this.moveAim();
                    if (this.trig.ok && this.phaseT > 10) this.throwDart("you");
                    break;
                case "oppAim": this.oppAim(); break;
                case "flight": this.flight(); break;
                case "stuck": if (this.phaseT >= 34) this.afterDart(); break;
                case "pull": if (this.phaseT >= 40) { this.clearDarts(); this.nextTurn(); } break;
                case "summary": if (this.phaseT > 30 && this.trig.ok) { se("Decision1", 60); this.leave(); } break;
            }
            this.swayTick();
        }
        swayTick() {
            const t = this.t, a = this.phase === "oppAim" ? this.opp.sway : this.amp, p = this.ph;
            this.cross.x = this.aim.x + a * (0.72 * Math.sin(t * 0.031 + p[0]) + 0.33 * Math.sin(t * 0.077 + p[1]));
            this.cross.y = this.aim.y + a * (0.72 * Math.sin(t * 0.043 + p[2]) + 0.3 * Math.sin(t * 0.091 + p[3]));
        }
        moveAim() {
            const k = this.keys, sp = 3.2;
            if (k.left) this.aim.x -= sp; if (k.right) this.aim.x += sp;
            if (k.up) this.aim.y -= sp; if (k.down) this.aim.y += sp;
            const dx = this.aim.x - DB.cx, dy = this.aim.y - DB.cy, r = Math.hypot(dx, dy), max = DB.frame + 30;
            if (r > max) { this.aim.x = DB.cx + dx / r * max; this.aim.y = DB.cy + dy / r * max; }
        }
        gauss() { const u = Math.max(1e-6, this.rng()), v = this.rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
        nextTurn() {
            if (this.turn === "opp" || this.round === 0) {
                if (this.round >= 3) return this.decide();
                this.round++;
                this.turn = "you";
            } else this.turn = "opp";
            this.dartNo = 0;
            this.aim = { x: DB.cx, y: DB.cy };
            if (this.turn === "opp") {
                const target = this.opp.aim === "twenty" && this.rng() < 0.6 ? { x: DB.cx, y: DB.cy - DB.rs * 0.7 } : { x: DB.cx, y: DB.cy };
                this.oppTarget = target;
                this.aim = { x: DB.cx + (this.rng() - 0.5) * 120, y: DB.cy + (this.rng() - 0.5) * 120 };
            }
            this.banner = this.turn === "you" ? "Runda " + this.round + " z 3 · twój rzut" : "Runda " + this.round + " z 3 · rzuca " + this.opp.short;
            this.setPhase("banner");
        }
        oppAim() {
            if (this.phaseT === 1) { this.oppWait = 50 + Math.floor(this.rng() * 60); if (this.rng() < 0.45) this.sayOver("bubbleR", pick(this.opp.throwLines, this.rng), 70); }
            const t = this.oppTarget;
            this.aim.x += (t.x - this.aim.x) * 0.06;
            this.aim.y += (t.y - this.aim.y) * 0.06;
            if (this.phaseT >= this.oppWait) this.throwDart("opp");
        }
        throwDart(who) {
            let x = this.cross.x, y = this.cross.y;
            if (who === "you") { const s = 3 + this.amp * 0.07; x += this.gauss() * s; y += this.gauss() * s; }
            else if (this.rng() < this.opp.lucky) { x = DB.cx + this.gauss() * 7; y = DB.cy + this.gauss() * 7; }
            else { x += this.gauss() * this.opp.scatter; y += this.gauss() * this.opp.scatter; }
            this.shot = { who, x, y, from: { x: lerp(DB.cx, x, 0.3) + (who === "you" ? -120 : 140), y: H1 + 60 }, t: 0, life: 24 };
            this.flyer.bitmap = dartBitmap(who === "you" ? "#d8b43a" : "#b8303a");
            this.flyer.visible = true;
            se("Wind1", 45, 150);
            this.setPhase("flight");
        }
        flight() {
            const s = this.shot, k = ++s.t / s.life;
            const x = lerp(s.from.x, s.x, k), y = lerp(s.from.y, s.y, k) - Math.sin(Math.PI * k) * 150;
            const nx = lerp(s.from.x, s.x, k + 0.05), ny = lerp(s.from.y, s.y, k + 0.05) - Math.sin(Math.PI * Math.min(1, k + 0.05)) * 150;
            this.flyer.x = x; this.flyer.y = y;
            this.flyer.rotation = Math.atan2(nx - x, -(ny - y)) * 0.6;
            this.flyer.scale.set(lerp(2.2, 1, k));
            if (s.t >= s.life) this.land();
        }
        land() {
            const s = this.shot, score = dartScore(s.x - DB.cx, s.y - DB.cy), onBoard = Math.hypot(s.x - DB.cx, s.y - DB.cy) <= DB.frame;
            this.flyer.visible = false;
            const d = new Sprite(dartBitmap(s.who === "you" ? "#d8b43a" : "#b8303a"));
            d.anchor.set(0.5, 0.04);
            d.x = s.x; d.y = s.y;
            d.scale.set(0.9, 0.5);   // (seen nearly from behind: short)
            d.rotation = -0.5 + (s.x - DB.cx) / 700;
            d._wob = onBoard ? 1 : 0; d._t = 0; d._rot = d.rotation;
            if (!onBoard) d.opacity = 0;
            this.stuck.addChild(d);
            (s.who === "you" ? this.scores.you : this.scores.opp)[this.round - 1].push(score);
            if (s.who === "you" && score === 50) this.bulls++;
            se(onBoard ? "Blow1" : "Miss", onBoard ? 70 : 60, onBoard ? 150 : 100);
            if (score >= 25) se("Chime2", 40, score === 50 ? 120 : 100);
            this.board.x = DB.cx + (onBoard ? 2 : 0);
            this.popup(score === 50 ? "BYK! 50" : score === 25 ? "25" : score > 0 ? "+" + score : onBoard ? "W ramę!" : "Pudło!", s.x, s.y, score >= 25 ? U().accent : score > 0 ? "#eceef0" : BAD);
            if (s.who === "opp" && score >= 25 && this.rng() < 0.7) this.sayOver("bubbleR", pick(this.opp.good, this.rng), 80);
            this.setPhase("stuck");
        }
        afterDart() {
            this.board.x = DB.cx;
            this.dartNo++;
            if (this.dartNo < 3) { this.setPhase(this.turn === "you" ? "aim" : "oppAim"); if (this.turn === "opp") this.aim = { x: this.aim.x + (this.rng() - 0.5) * 60, y: this.aim.y + (this.rng() - 0.5) * 60 }; }
            else this.setPhase("pull");
        }
        clearDarts() {
            for (const d of this.stuck.children.slice()) this.stuck.removeChild(d);
            se("Equip2", 40, 120);
        }
        sum(who) { return this.scores[who].reduce((a, r) => a + r.reduce((x, y) => x + y, 0), 0); }
        decide() {
            const you = this.sum("you"), opp = this.sum("opp");
            if (you === opp && !this.extra) {   // a tie: one more dart each, the nearer to the bull wins
                this.extra = true;
                const dYou = Math.hypot(this.gauss() * (4 + this.amp * 0.4), this.gauss() * (4 + this.amp * 0.4)), dOpp = Math.hypot(this.gauss() * this.opp.scatter * 1.6, this.gauss() * this.opp.scatter * 1.6);
                this.tieBreak = dYou <= dOpp ? "you" : "opp";
            }
            this.finish(false);
        }
        giveUp() { this.finish(true); }
        finish(gaveUp) {
            const you = this.sum("you"), opp = this.sum("opp");
            const won = !gaveUp && (you > opp || (you === opp && this.tieBreak === "you"));
            this.result = { game: "darts", won, stake: this.stake, score: you, opp: opp, opponent: this.opp.role || "wiesiek", bulls: this.bulls, gaveUp: !!gaveUp,
                tie: you === opp, minutes: DARTS.minutes, stamina: DARTS.stamina, rounds: this.scores };
            const line = won ? this.opp.lost : this.opp.won;
            this.result.line = line;
            if (won) se("Applause1", 55);
            this.sight.visible = false;
            this.showCard({ bust: this.opp.role ? bustOf(this.opp.role) : this.opp.bust, who: this.opp.name, whoSub: "rzutki", kicker: "RZUTKI · KONIEC",
                title: won ? "Wygrana!" : gaveUp ? "Poddałeś się" : "Przegrana", titleColor: won ? U().accent : BAD,
                sub: "Ty " + you + " : " + opp + " " + this.opp.short + (you === opp && !gaveUp ? " (dogrywka: " + (won ? "twoja lotka bliżej środka" : "jego lotka bliżej środka") + ")" : "") + (this.stake ? "   ·   " + (won ? "+" : "−") + this.stake + " G" : ""),
                subColor: won ? GOOD : BAD, say: line,
                lines: [["Czas: " + DARTS.minutes + " minut gry" + (this.bulls ? "   ·   byki: " + this.bulls : ""), U().muted]], foot: "O - wracam do sali", h: 440 });
            this.setPhase("summary");
        }
        popup(text, x, y, colour) {
            const b = new Bitmap(220, 44);
            cardText(b, text, 2, 6, 220, 28, "rgba(0,0,0,0.85)", true, "center");   // (a shadow: it reads on the board)
            cardText(b, text, 0, 4, 220, 28, colour, true, "center");
            const s = new Sprite(b);
            s.anchor.set(0.5, 1);
            s.x = x; s.y = y - 12;
            s._t = 0;
            this.root.addChild(s);
            this.popups.push(s);
        }
        frame() {
            this.updateBubbles();
            this.sight.visible = this.phase === "aim" || this.phase === "oppAim";
            if (this.sight.visible) {
                this.sight.bitmap = sightBitmap(this.phase === "aim" ? "#ffd23f" : "#ff6a5a");
                this.sight.x = this.cross.x; this.sight.y = this.cross.y;
            }
            for (const d of this.stuck.children) {   // a dart just in the board wobbles a moment
                if (!d._wob) continue;
                d._t++;
                d.rotation = d._rot + Math.sin(d._t * 0.9) * 0.22 * Math.exp(-d._t / 9);
                if (d._t > 40) d._wob = 0;
            }
            for (let i = this.popups.length - 1; i >= 0; i--) {
                const s = this.popups[i];
                s._t++;
                s.y -= 0.7;
                s.opacity = Math.round(255 * Math.min(1, (70 - s._t) / 20));
                if (s._t >= 70) { this.root.removeChild(s); this.popups.splice(i, 1); }
            }
            this.drawSlate();
            this.drawHud();
        }
        drawSlate() {
            const key = JSON.stringify(this.scores) + this.round + this.turn + this.phase;
            if (key === this._slateKey) return;
            this._slateKey = key;
            const b = this.slate.bitmap, ctx = b.context, S0 = U();
            b.clear();
            ctx.fillStyle = "#5a3a1e"; ctx.fillRect(0, 0, 360, 330);
            ctx.fillStyle = "#1f2623"; ctx.fillRect(10, 10, 340, 310);
            ctx.fillStyle = "rgba(255,255,255,0.03)"; for (let i = 0; i < 30; i++) ctx.fillRect(10 + hash(i, 41) * 320, 10 + hash(i, 42) * 290, 20 + hash(i, 43) * 60, 1);
            const chalk = "rgba(236,236,228,0.92)", dim = "rgba(236,236,228,0.45)";
            cardText(b, "TY", 130, 22, 100, 22, chalk, true, "center");
            cardText(b, this.opp.short.toUpperCase(), 240, 22, 100, 22, chalk, true, "center");
            ctx.fillStyle = dim; ctx.fillRect(24, 56, 312, 1); ctx.fillRect(126, 24, 1, 270); ctx.fillRect(236, 24, 1, 270);
            for (let r = 0; r < 3; r++) {
                const y = 70 + r * 66, cur = this.round === r + 1;
                cardText(b, "Runda " + (r + 1), 24, y + 10, 100, 19, cur ? S0.accent : chalk, cur);
                for (const [who, x] of [["you", 130], ["opp", 240]]) {
                    const list = this.scores[who][r], sum = list.reduce((a, v) => a + v, 0);
                    cardText(b, list.length ? String(sum) : "-", x, y, 100, 26, chalk, true, "center");
                    cardText(b, list.map(v => v || "0").join(" · "), x, y + 30, 100, 15, dim, false, "center");
                }
            }
            ctx.fillStyle = chalk; ctx.fillRect(24, 272, 312, 2);
            cardText(b, "Razem", 24, 282, 100, 20, chalk, true);
            cardText(b, String(this.sum("you")), 130, 278, 100, 28, S0.accent, true, "center");
            cardText(b, String(this.sum("opp")), 240, 278, 100, 28, "#ff9f8f", true, "center");
            dirty(b);
        }
        drawHud() {
            const key = [this.phase, this.round, this.turn, this.dartNo, this.banner].join("|");
            if (key === this._hudKey) return;
            this._hudKey = key;
            const b = this.hud.bitmap, S0 = U();
            b.clear();
            if (this.phase === "card" || this.phase === "summary") return;
            panelInto(b, 20, 16, 420, 70, { cut: 6 });
            cardText(b, "RZUTKI" + (this.stake ? "  ·  STAWKA " + this.stake + " G" : ""), 36, 22, 380, 15, S0.muted, true);
            cardText(b, (this.turn === "you" ? "Twój rzut" : "Rzuca " + this.opp.short) + "  ·  runda " + this.round + " z 3", 36, 42, 380, 22, this.turn === "you" ? S0.accent : "#ff9f8f", true);
            // the darts left
            for (let i = 0; i < 3; i++) {
                const left = i >= this.dartNo || this.phase === "banner";
                b.context.globalAlpha = left ? 1 : 0.25;
                b.blt(dartBitmap(this.turn === "you" ? "#d8b43a" : "#b8303a"), 0, 0, 16, 64, 30 + i * 26, 100, 16, 64);
                b.context.globalAlpha = 1;
            }
            if (this.phase === "banner") {
                panelInto(b, DB.cx - 230, DB.cy - 36, 460, 72, { cut: 8 });
                cardText(b, this.banner, DB.cx - 220, DB.cy - 20, 440, 28, this.turn === "you" ? S0.accent : "#ff9f8f", true, "center");
            }
            panelInto(b, 150, 666, 560, 38, { cut: 5, accent: false });
            keyHintsInto(b, [["strzałki", "cel"], ["O", "rzut"], ["P", "pauza"]], 168, 673);
            dirty(b);
        }
        state() {
            return { phase: this.phase, round: this.round, turn: this.turn, dart: this.dartNo, aim: Object.assign({}, this.aim), cross: Object.assign({}, this.cross),
                you: this.sum("you"), opp: this.sum("opp"), amp: this.amp, paused: !!this.paused, result: this.result || null, centre: { x: DB.cx, y: DB.cy } };
        }
    }
    window.Scene_Darts = Scene_Darts;
    function startGame(Scene, opts) {
        if (GAME.running || SceneManager.isSceneChanging()) return false;
        GAME.pending = { opts: Object.assign({ turbo: TL.gameTurbo || 1 }, opts || {}) };   // (TL.gameTurbo: tests speed up the games a talk starts)
        if ($gameTemp && $gameTemp.clearDestination) $gameTemp.clearDestination();
        SceneManager.push(Scene);
        return true;
    }

    // ==================================================================
    // The talks at the arm-wrestling table and at the darts line
    // ==================================================================
    let gameAfter = null;   // { game, stake } while a game started by a talk is played (the talk's next step reads it)
    function armTalk() {
        const o = [];
        if (!npc("grum")) { popup(0, "Nie ma z kim się siłować - Grum gdzieś wyszedł.", BAD); return null; }
        if (typeof $gameSystem.stamina === "function" && $gameSystem.stamina() < ARM.needStamina) {
            sayAs(o, "grum", "Ledwo stoisz na nogach. Najpierw odpocznij, bo mi się jeszcze rozsypiesz na stole.");
            return o;
        }
        const st = S().arm;
        sayAs(o, "grum", st.played === 0 ? "Siłujesz się? Ha! Ostatni, co próbował, do dziś je lewą ręką. Ile stawiasz?"
            : st.won > st.lost ? "Ty znowu? Dobra, ale dziś bez taryfy ulgowej. Ile stawiasz?" : "Rewanż? Lubię upartych. Ile stawiasz?");
        choose(o, ARM_STAKES.map(n => ({ label: "Stawka " + n + " G", js: ["TavernLife.step(this, 'arm', " + n + ")", "TavernLife.step(this, 'gameAfter')"] }))
            .concat([{ label: "Nie teraz", js: [] }]));
        return o;
    }
    function oppSay(out, key, text) {
        const o = OPPONENTS[key];
        if (o.role) return sayAs(out, o.role, text);
        return say(out, -1, text, o.face || ["People1", 4], o.name);
    }
    function dartsTalk() {
        const o = [], ozzy = !!npc("ozzy"), options = [];
        heroSay(o, "Rzutki... Z kim by tu zagrać?");
        if (ozzy) options.push({ label: "Z Dziadkiem Ozzym", js: "TavernLife.step(this, 'dartsWho', 'ozzy')" });
        options.push({ label: "Z furmanem Wieśkiem", js: "TavernLife.step(this, 'dartsWho', 'wiesiek')" });
        options.push({ label: "Nie teraz", js: [] });
        choose(o, options);
        return o;
    }
    function dartsStakes(key) {
        const o = [];
        oppSay(o, key, OPPONENTS[key].hello + " Ile stawiasz?");
        choose(o, DARTS_STAKES.map(n => ({ label: "Stawka " + n + " G", js: ["TavernLife.step(this, 'darts', " + n + ", " + q(key) + ")", "TavernLife.step(this, 'gameAfter')"] }))
            .concat([{ label: "Nie teraz", js: [] }]));
        return o;
    }
    // back from a game: the coins go the right way, a word from the other player
    function afterGame() {
        const g = gameAfter;
        gameAfter = null;
        const r = GAME.lastResult;
        if (!g || !r || r.game !== g.game) return;
        const who = g.game === "arm" ? npc("grum") : g.opponent === "ozzy" ? npc("ozzy") : spots("darts")[0] ? spots("darts")[0].ev : null;
        if (r.stake > 0) { if (r.won) coins(r.stake, who, $gamePlayer); else coins(r.stake, $gamePlayer, who); }
        if (g.game === "arm") bark(who, r.won ? pick(["Masz. Zasłużyłeś.", "Bierz, zanim się rozmyślę.", "Jutro rewanż!"]) : pick(["Dzięki za datek!", "Następnym razem może ci się uda. Może."]), 120);
        else if (who && g.opponent === "ozzy") bark(who, r.won ? "Trzy tarcze to jednak za dużo..." : "Hehe! Stary Ozzy jeszcze umie!", 120);
    }

    // ==================================================================
    // What the tagged places do, and the steps the talks call back
    // ==================================================================
    function counterTalk() {
        const o = [], h = hour();
        sayAs(o, "borgar", h < 11 ? "Dzień dobry! Czym mogę służyć?" : h < 18 ? "Czym mogę służyć? Kuchnia grzeje, pokoje wietrzą się na górze." : "Dobry wieczór! Coś na ząb? Pokój na noc?");
        choose(o, [{ label: "Zjedz coś", js: "TavernLife.talk(this, 'meal')" }, { label: "Wynajmij pokój", js: "TavernLife.talk(this, 'room')" }, { label: "Nic, dzięki", js: [] }]);
        return o;
    }
    function use(interp) {
        const ev = interp && $gameMap.event(interp.eventId()), t = ev ? pageTag(ev.page()) : null;
        if (!t) return;
        let list = null;
        switch (t.kind) {
            case "meal": list = counterTalk(); break;
            case "mealtable": popup(0, "Tu podają jedzenie - zamów u Borgara przy ladzie.", "#eceef0"); break;
            case "bath": list = bathTalk(); break;
            case "stage": list = songTalk(); break;
            case "arm": list = armTalk(); break;
            case "darts": list = dartsTalk(); break;
            case "plan": openPlan(); break;
            case "bed": list = bedTalk(t.a); break;
            case "door": case "gate": list = repLocked(ev, t) ? lockedTalk(t) : null; break;
        }
        if (list) run(interp, list);
    }
    function talk(interp, what) {
        if (what === "meal") run(interp, mealTalk());
        else if (what === "room") run(interp, roomTalk());
    }
    function openCardFor(interp, key) {
        const spec = key === "meal" ? mealCardSpec() : key === "room" ? roomCardSpec() : null;
        if (spec && spec.entries.length && openCard(spec)) hold(interp);
    }
    function step(interp, what, arg, arg2) {
        const ev = interp ? $gameMap.event(interp.eventId()) : null;
        switch (what) {
            case "meal": {
                const e = takePick("meal");
                if (!e) { run(interp, sayAs([], "borgar", pick(["Nie jesteś głodny? To może później.", "Rozmyśliłeś się? Kuchnia nie ucieknie."]))); return; }
                const dish = e.dish, price = priceOf(dish);
                if (!pay(price, npc("borgar") || ev)) return;
                const o = [];
                sayAs(o, "borgar", freeSeat() ? dish.order : "Stoły zajęte - zjesz przy ladzie, jak za dawnych czasów.");
                script(o, "TavernLife.go(this, 'meal', " + q(dish.id) + ")");
                run(interp, o);
                return;
            }
            case "room": {
                const e = takePick("room");
                if (!e) return;
                if (!rentRoom(e.room, npc("borgar") || ev)) return;
                const o = [];
                sayAs(o, "borgar", rentLine(e.data));
                run(interp, o);
                return;
            }
            case "bath": {
                const tub = ev;
                if (!tub) return;
                if (!pay(bathPrice(), attendant() || tub)) { bark(attendant(), "Na krechę wody nie grzeję.", 100); return; }
                const o = [];
                script(o, "TavernLife.go(this, 'bath', " + tub.eventId() + ")");
                attSay(o, BATH_LINES[S().baths % BATH_LINES.length]);
                run(interp, o);
                return;
            }
            case "sleep":
                if (sleepNow(arg)) hold(interp);
                return;
            case "song": {
                if (S().songDay === day() || !inSongHours()) return;
                let tipped = false;
                if (arg && SONG_TIP > 0) tipped = pay(SONG_TIP, npc("melia"));
                const o = [];
                if (arg && !tipped) sayAs(o, "melia", "Pusta sakiewka? Nie szkodzi - zaśpiewam i tak.");
                run(interp, o.concat(songList(nextSong(), tipped)));
                return;
            }
            case "songStart": songStart(arg); return;
            case "songEnd": songEnd(arg, !!arg2); return;
            case "arm": {
                const stake = Number(arg) || 0;
                if (gold() < stake) { needGold(stake); bark(npc("grum"), "Bez monet nie ma zabawy, chudzielcu.", 100); return; }
                if (startGame(Scene_ArmWrestle, { stake })) gameAfter = { game: "arm", stake };
                return;
            }
            case "dartsWho": run(interp, dartsStakes(OPPONENTS[arg] ? arg : "wiesiek")); return;
            case "darts": {
                const stake = Number(arg) || 0, who = OPPONENTS[arg2] ? arg2 : "wiesiek";
                if (gold() < stake) { needGold(stake); return; }
                if (startGame(Scene_Darts, { stake, opponent: who })) gameAfter = { game: "darts", stake, opponent: who };
                return;
            }
            case "gameAfter": afterGame(); return;
        }
    }
    // the sequences started from a talk (or the API): the talk waits for them
    function go(interp, what, arg) {
        if (what === "meal") { const dish = dishById(arg); if (dish) startMeal(dish, interp); }
        else if (what === "bath") {
            const tub = $gameMap.event(Number(arg)) || (spots("bath")[0] || {}).ev, t = tub ? evTag(tub) : null;
            if (tub) startBath({ x: tub.x, y: tub.y, lift: num(t && t.a.lift, BATH_LIFT) }, interp);
        }
        else if (what === "sleep") { if (sleepNow(arg)) hold(interp); }
    }
    // Story.js's Borgar: two more lines in his menu
    function borgarOptions() {
        return [{ label: "Zjedz coś", js: "TavernLife.talk(this, \"meal\")" }, { label: "Wynajmij pokój", js: "TavernLife.talk(this, \"room\")" }];
    }

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
        1: { x: 54, y: 78, w: 101, h: 84, sheet: "!$Tavern_Plan", dir: 2, note: "<Occupy:left=1,right=1>", cells: [[53, 78], [54, 78], [55, 78]] },
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
    // the easel goes into a map's data as it loads - only into the map it was made for (its size) and onto free cells
    function injectPlanBoard(data, mapId) {
        const b = PLAN_BOARDS[mapId];
        if (!b || !data || !Array.isArray(data.events) || data.width !== b.w || data.height !== b.h) return;
        if (data.events.some(e => e && e.id !== PLAN_EVENT && b.cells.some(c => c[0] === e.x && c[1] === e.y))) return;
        for (let i = data.events.length; i < PLAN_EVENT; i++) data.events[i] = null;   // (no holes: other code checks for null)
        data.events[PLAN_EVENT] = planBoardData(b);
    }
    let planLoadingMap = 0;
    const _DataManager_loadMapData = DataManager.loadMapData;
    DataManager.loadMapData = function(mapId) {
        planLoadingMap = mapId;
        _DataManager_loadMapData.call(this, mapId);
    };
    const _DataManager_onLoad = DataManager.onLoad;
    DataManager.onLoad = function(object) {
        _DataManager_onLoad.call(this, object);
        if (object === $dataMap && planLoadingMap > 0) injectPlanBoard(object, planLoadingMap);
    };
    // a game saved on these maps before the easels came keeps the saved events: the easel is added (or taken away again,
    // should the map have changed under it)
    const _Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
    Scene_Map.prototype.onMapLoaded = function() {
        if (!this._transfer && $gameMap && $dataMap && Array.isArray($dataMap.events)) {
            const has = !!$dataMap.events[PLAN_EVENT], ev = $gameMap._events[PLAN_EVENT];
            if (has && !ev) $gameMap._events[PLAN_EVENT] = new Game_Event($gameMap.mapId(), PLAN_EVENT);
            else if (!has && ev) delete $gameMap._events[PLAN_EVENT];
        }
        _Scene_Map_onMapLoaded.call(this);
    };

    // the hand and the small capitals of the parchment (QuestBoard.js loads the same families; here too, should it be off)
    const PLAN_FONTS = { "QB Hand": "Caveat-Regular.ttf", "QB Hand Bold": "Caveat-Bold.ttf", "QB Caps": "AlegreyaSC-Bold.ttf" };
    function ensurePlanFonts() {
        for (const fam of Object.keys(PLAN_FONTS)) if (!FontManager._states || !FontManager._states[fam]) FontManager.load(fam, PLAN_FONTS[fam]);
    }
    const _Scene_Boot_loadGameFonts = Scene_Boot.prototype.loadGameFonts;
    Scene_Boot.prototype.loadGameFonts = function() {
        _Scene_Boot_loadGameFonts.call(this);
        ensurePlanFonts();
    };
    const PF = {
        hand: s => s + 'px "QB Hand", ' + ($gameSystem ? $gameSystem.mainFontFace() : "serif"),
        handB: s => s + 'px "QB Hand Bold", ' + ($gameSystem ? $gameSystem.mainFontFace() : "serif"),
        caps: s => s + 'px "QB Caps", ' + ($gameSystem ? $gameSystem.mainFontFace() : "serif")
    };
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
    const hasStory = () => !!(window.Story && Story.active && Story.active());
    const TD = () => window.TavernDice || null;
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
            ensurePlanFonts();
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
            const b = this.hints.bitmap;
            b.clear();
            keyHintsInto(b, [["↑↓←→", "pokój"], ["Q/E", "piętro"], ["O", "pokaż drogę"], ["P", "wyjdź"]], PS[0] + 4, 5);
            const S0 = U();
            cardText(b, (hasClock() ? "Dzień " + day() + " · " : "") + "godz. " + clockText(), PP[0], 5, PP[2] - 6, 17, S0.muted, false, "right");
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

    // the P menu: "Plan karczmy" while he is on one of the tavern's floors (MenuPanel.js draws the commands; the little drawing here)
    const planOnMap = () => !!$gameMap && planFloorOf($gameMap.mapId()) >= 0;
    const _Window_MenuCommand_addOriginalCommands = Window_MenuCommand.prototype.addOriginalCommands;
    Window_MenuCommand.prototype.addOriginalCommands = function() {
        _Window_MenuCommand_addOriginalCommands.call(this);
        if (planOnMap()) this.addCommand("Plan karczmy", "tavernPlan", true);
    };
    const _Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
    Scene_Menu.prototype.createCommandWindow = function() {
        _Scene_Menu_createCommandWindow.call(this);
        this._commandWindow.setHandler("tavernPlan", () => { PLAN.pending = {}; SceneManager.push(Scene_TavernPlan); });
    };
    const _Window_MenuCommand_drawItem = Window_MenuCommand.prototype.drawItem;
    Window_MenuCommand.prototype.drawItem = function(index) {
        _Window_MenuCommand_drawItem.call(this, index);
        if (this.commandSymbol(index) !== "tavernPlan" || !window.MenuPanel) return;
        const r = this.itemLineRect(index), S0 = U();
        planGlyph(this.contents.context, "map", r.x + 5, r.y + Math.round((r.height - 20) / 2), 20, this.isCommandEnabled(index) ? S0.accent : S0.muted, "#000");
        dirty(this.contents);
    };

    // ==================================================================
    // The map scene drives it all; a new map, a new game or a loaded one start clean
    // ==================================================================
    const _Scene_Map_createDisplayObjects = Scene_Map.prototype.createDisplayObjects;
    Scene_Map.prototype.createDisplayObjects = function() {
        _Scene_Map_createDisplayObjects.call(this);
        this._tavernCoins = new Sprite();
        this.addChildAt(this._tavernCoins, this.getChildIndex(this._windowLayer));
        ImageManager.loadSystem(DISH_SHEET);
        prefetchRooms();
    };
    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        if (this !== SceneManager._scene || !$gameMap) return;
        stepSeq();
        updateCard();
        updateFx();
        updateCoins(this);
        updateSinging();
        xpWatch();
        if (Graphics.frameCount % 30 === 0) syncDoors();
    };
    const _Scene_Map_terminate = Scene_Map.prototype.terminate;
    Scene_Map.prototype.terminate = function() {
        if (card) closeCard(null);
        coinFx.length = 0;
        _Scene_Map_terminate.call(this);
    };
    const _Game_Map_setupEvents = Game_Map.prototype.setupEvents;
    Game_Map.prototype.setupEvents = function() {
        _Game_Map_setupEvents.call(this);
        fx.length = 0;
        candleList = [];
        candleMap = 0;
        if ($gameSystem && $gameSystem._tavernLife) syncDoors();
    };
    function resetTransient() {
        seq = null; card = null; bathing = null; singing = null; musicBack = null; gameAfter = null; lastPick = null;
        fx.length = 0; coinFx.length = 0; candleList = []; xpSeen = null;
    }
    const _DataManager_setupNewGame = DataManager.setupNewGame;
    DataManager.setupNewGame = function() {
        _DataManager_setupNewGame.call(this);
        resetTransient();
    };
    const _DataManager_extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function(contents) {
        _DataManager_extractSaveContents.call(this, contents);
        resetTransient();
    };

    // ==================================================================
    // API (other plugins, the debug menu, tests)
    // ==================================================================
    const idle = () => !!$gameMap && !$gameMap.isEventRunning() && !busy() && SceneManager._scene instanceof Scene_Map && !SceneManager.isSceneChanging();
    window.TavernLife = {
        DISHES, SONGS, OPPONENTS, ROOM_NAMES, BUFFS, buffs: BUFFS, GAME, ARM, DARTS, AW, DB, TL,
        use, talk, card: openCardFor, step, go, hold, borgarOptions, plan: planApi,
        // a meal: with a dish id at once (pays, sits down, eats); without one, Borgar's talk with the card
        meal(id) {
            if (!idle()) return false;
            if (id === undefined) return runOnMap(mealTalk());
            const dish = dishById(id);
            if (!dish || !pay(priceOf(dish), npc("borgar"))) return false;
            return runOnMap([C(355, ["TavernLife.go(this, 'meal', " + q(dish.id) + ")"])]);
        },
        rentRoom: n => rentRoom(n, npc("borgar")),
        bath() {
            const tub = spots("bath")[0];
            if (!idle() || !tub || !pay(bathPrice(), attendant() || tub.ev)) return false;
            return runOnMap([C(355, ["TavernLife.go(this, 'bath', " + tub.ev.eventId() + ")"])]);
        },
        song(tip) {
            if (!idle() || !inSongHours() || S().songDay === day()) return false;
            const tipped = !!tip && pay(SONG_TIP, npc("melia"));
            return runOnMap(songList(nextSong(), tipped));
        },
        sleep(room) {
            const r = rentedRoom();
            if (!idle() || !r || r.slept || (room !== undefined && roomKey(r.room) !== roomKey(room))) return false;
            return runOnMap([C(355, ["TavernLife.go(this, 'sleep', " + q(r.room) + ")"])]);
        },
        armWrestle: opts => startGame(Scene_ArmWrestle, opts),
        darts: opts => startGame(Scene_Darts, opts),
        dishOfDay, priceOf, rooms, rentedRoom, isRented, syncDoors, nextSong, dartScore, npc,
        reputation, repTier, repDiscount, tierName, bathPrice: () => bathPrice(), roomPrice: n => { const r = roomOf(n); return r ? roomPrice(r) : null; },
        gates: () => Object.assign({}, S().gates || {}),
        spots: kind => spots(kind).map(s => ({ id: s.ev.eventId(), x: s.ev.x, y: s.ev.y, a: s.a })),
        stats: () => JSON.parse(JSON.stringify(S())),
        state: () => S(),
        busy,
        get openCard() { return card ? { key: card.spec.key, index: card.win.index(), foot: card.spec.foot, entries: card.spec.entries.map(e => ({ name: e.name, right: e.right, oldRight: e.oldRight || "", sub: e.sub || "", enabled: e.enabled !== false })) } : null; },
        // tests: the card's line i chosen as if by the keys (null: closed with P)
        cardChoose(i) {
            if (!card) return false;
            if (i === null) { closeCard(null); return true; }
            card.win.select(i);
            if (!card.win.isCurrentItemEnabled()) { card.win.processOk(); return false; }
            closeCard(card.win.entry());
            return true;
        },
        gameState: () => (GAME.running && GAME.running.state ? GAME.running.state() : null),
        get onTick() { return GAME.onTick; },
        set onTick(fn) { GAME.onTick = fn; },
        get lastResult() { return GAME.lastResult; },
        get fx() { return fx; },
        get bathing() { return bathing; },
        litCandles: () => candleList.filter(c => c.spr && c.spr.parent).map(c => c.room),
        get singing() { return !!singing; },
        xpWatch
    };
})();
