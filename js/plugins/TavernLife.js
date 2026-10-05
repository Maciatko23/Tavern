//=============================================================================
// TavernLife.js
//=============================================================================
// The services core of the tavern: Borgar's dishes and rooms, the bath, Melia's song, the reputation at Borgar's, the premia, the
// shared helpers and the window.TavernLife API. Its parts are plugins of their own, right under it in this order:
//   TavernLife_Render.js      what is drawn: the card of dishes / rooms, the plates, steam, candles, the coins, the premia's symbols
//   TavernLife_ArmWrestle.js  arm-wrestling with Grum (Tawerna.ui.Scene_MiniGame)
//   TavernLife_Darts.js       darts with Ozzy or Wiesiek (Tawerna.ui.Scene_MiniGame)
//   TavernLife_Plan.js        the tavern's plan: the easels (event 950) and the plan scene
// They read their parameters here (TavernLife.lib.param). Without them the services still work - only less is drawn, and the
// mini-games and the plan are not there. docs/ARCHITEKTURA.md describes the core (TawernaCore.js) and the UI kit (TawernaUI.js).

/*:
 * @target MZ
 * @plugindesc Życie w tawernie „Pod Złotym Kuflem”: posiłki u Borgara, pokoje na noc, łaźnia, pieśni Melii, sława (rdzeń usług). Siłowanie, rzutki i plan karczmy w TavernLife_*.js pod nią. v1.2.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter TawernaUI
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
 * TavernLife.js - życie w tawernie „Pod Złotym Kuflem” (rdzeń usług)
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
 *   <Tavern:arm>         stół do siłowania na rękę (Grum) - TavernLife_ArmWrestle
 *   <Tavern:darts>       linia rzutu przed tarczą - TavernLife_Darts
 *   <Tavern:plan>        plan karczmy - TavernLife_Plan
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
 *
 * CZĘŚCI - osobne wtyczki, zaraz pod tą, w tej kolejności (parametry
 * ustawiasz tutaj, one je czytają):
 *   TavernLife_Render      - rysunki: karta dań i pokoi, talerze, para,
 *                            świece, monety, znaczki premii w HUD
 *   TavernLife_ArmWrestle  - siłowanie na rękę z Grumem (mini-gra)
 *   TavernLife_Darts       - rzutki z Ozzym albo z furmanem (mini-gra)
 *   TavernLife_Plan        - plan karczmy (sztalugi i scena planu)
 * Bez nich usługi dalej działają (mniej widać), a mini-gier i planu nie ma.
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
    const T = window.Tawerna;
    if (!T) throw new Error("TavernLife.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    // "something happened", told on the Tawerna bus (docs/ARCHITEKTURA.md 5 lists the events and their data)
    const emit = (name, data) => T.emit(name, data);
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
    const BATH_HOURS = 1;
    const BATH_LIFT = 34;   // px the bather sits higher than his feet would stand on the tub's tile (the tag: <Tavern:bath lift=N>)
    const GOLD_ICON = 313, BREAD = 83, MILK = 123, CHEESE = 124;

    // ------------------------------------------------------------------
    // Small helpers (the parts get them through TavernLife.lib)
    // ------------------------------------------------------------------
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
    const U = () => T.api("UITheme") || { fill: "rgba(11,12,15,0.9)", solid: "#0b0c0f", line: "#3a3e46", accent: "#ffd23f", accentDim: "#c9a12a",
        text: "#eceef0", muted: "#8a9099", trough: "#16181c", panel: null, bar: null };
    const GOOD = "#9ff0a8", BAD = "#ff9f8f", WARM = "#ffe27a";
    function hash(a, b) {
        let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263);
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    }
    const pick = (list, rng) => list[Math.floor((rng ? rng() : Math.random()) * list.length) % list.length];
    const seLast = {};   // (one sound of a name at most every few frames: a fast game - the tests' turbo - would pile them up)
    // a sound through the core's safe pool (a missing file stays silent, never "Failed to load")
    function se(name, volume, pitch, pan) {
        if (!name || (seLast[name] !== undefined && Graphics.frameCount - seLast[name] < 4 && Graphics.frameCount >= seLast[name])) return;
        seLast[name] = Graphics.frameCount;
        T.audio.se(name, { volume: volume === undefined ? 80 : volume, pitch: pitch || 100, pan: pan || 0 });
    }
    function me(name, volume) {
        if (name) AudioManager.playMe({ name, volume: volume === undefined ? 80 : volume, pitch: 100, pan: 0 });
    }
    // the game's clock (DayNightCycle.js, through Tawerna.time)
    const hasClock = () => !!window.$gameSystem && typeof $gameSystem.dayNightDay === "function";
    const day = () => T.time.day();
    const hour = () => T.time.hour();
    const nowH = () => day() * 24 + hour();
    function pass(hours) {
        if (hours > 0 && $gameSystem && typeof $gameSystem.advanceDayNight === "function") $gameSystem.advanceDayNight(hours);
    }
    const orElse = (v, d) => (v === undefined ? d : v);
    const wakeHour = () => orElse(T.call("Farming", "wakeHour"), num(PluginManager.parameters("SurvivalHUD").wakeHour, 7));
    const perk = key => orElse(T.call("Combat", "perk", key), 0);
    const attr = id => orElse(T.call("Combat", "attr", id), 5);
    const gold = () => $gameParty.gold();
    const item = id => ($dataItems && $dataItems[id]) || null;
    const hoursText = h => { const r = Math.round(h * 10) / 10; return String(r).replace(".", ",") + " godz."; };
    const pct = d => Math.round(d * 100) + "%";
    // a popup over the player (Tawerna.popup: SurvivalHUD's loot popups)
    const popup = (icon, text, colour) => T.popup(text, { icon: icon || 0, color: colour || "#eceef0" });
    // what is missing floats over the player (the user's rule), never in the message window
    function needGold(price) {
        T.popup.need(GOLD_ICON, "Brakuje ci " + Math.max(1, price - gold()) + " G");
        SoundManager.playBuzzer();
    }
    const notice = (text, sub) => T.popup(text, { top: true, color: U().accent, sub });
    const note = (title, text) => T.call("Journal", "addNote", title, text);
    // a short cry over someone's head (SpeechBubbles.js), the game goes on
    function bark(ch, text, frames) {
        if (ch && text) T.call("SpeechBubbles", "say", ch, text, frames);
    }
    function xp(amount, reason) {
        if (amount > 0) T.call("Combat", "gainXp", amount, reason);
    }
    // bitmaps drawn once (the parts' pictures too)
    const bitmaps = {};
    function cached(key, make) {
        return bitmaps[key] || (bitmaps[key] = make());
    }
    function dirty(b) { if (b && b._baseTexture) b._baseTexture.update(); }
    // a drop of water (the bath, the sweat of arm-wrestling)
    const dropBitmap = () => cached("drop", () => {
        const b = new Bitmap(4, 6), ctx = b.context;
        ctx.fillStyle = "rgba(170,215,255,0.95)"; ctx.fillRect(1, 0, 2, 5); ctx.fillRect(0, 2, 4, 3);
        ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.fillRect(1, 1, 1, 2);
        dirty(b);
        return b;
    });

    // ------------------------------------------------------------------
    // State: Tawerna.state "tavernLife" ($gameSystem._tw.tavernLife; an older save's $gameSystem._tavernLife is adopted and the old
    // key stays a hidden alias). Plain data, saved with the game.
    // ------------------------------------------------------------------
    function newState() {
        return { v: 1, firsts: {}, meals: 0, dishes: {}, spent: 0, rooms: 0, nights: 0, baths: 0, songs: 0, songDay: -1, heard: [], tips: 0,
            arm: { played: 0, won: 0, lost: 0, net: 0, level: 0, streak: 0 }, darts: { played: 0, won: 0, lost: 0, net: 0, best: 0, bulls: 0 }, rent: null };
    }
    const store = T.state.define("tavernLife", newState, { version: 1, adopt: "_tavernLife", owner: PLUGIN });
    const S = () => store();
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
    const SV = T.api("Survival");
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
        const N = T.api("Needs");
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
    const CB = T.api("Combat");
    if (CB && typeof CB.perk === "function") {
        const _perk = CB.perk;
        CB.perk = function(key) {
            const v = _perk.apply(this, arguments);
            return key === "sleep.rest" && hasBuff("rested") ? v + 0.25 : v;
        };
    }
    // Natchniony: every experience gained while it lasts brings INSPIRED_XP more. Combat.js gives experience from many places inside
    // itself (kills, discoveries, maps, goals), so the gain is watched rather than one entry point: what came since the last frame
    // (levels included), and a tenth of it is given on top (the fractions wait in acc)
    let xpSeen = null;
    function xpTotalSince(seen, h) {
        const C = T.api("Combat");
        if (h.level === seen.level) return h.xp - seen.xp;
        if (h.level < seen.level) return 0;
        let d = C.xpToNext(seen.level) - seen.xp;
        for (let l = seen.level + 1; l < h.level; l++) d += C.xpToNext(l);
        return d + h.xp;
    }
    function xpWatch() {
        const C = T.api("Combat");
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

    // ------------------------------------------------------------------
    // Places: events tagged <Tavern:kind key=value key="value"> in a comment of a page (or in the note). The tag is found by the core
    // (Tawerna.tag); its key=value pairs are read here from its text, as they always were - a value keeps its commas (plate=0,-2)
    // ------------------------------------------------------------------
    const ATTR_RE = /([A-Za-z_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
    function attrsOf(raw) {
        const a = {};
        let r;
        ATTR_RE.lastIndex = 0;
        while ((r = ATTR_RE.exec(raw))) a[r[1].toLowerCase()] = r[2] !== undefined ? r[2] : r[3] !== undefined ? r[3] : r[4];
        return a;
    }
    const tagCache = new WeakMap();   // (the core's args of a tag are kept per page / event data: read once)
    function tagOf(src) {
        const args = src ? T.tag(src, "Tavern") : null;
        if (!args || !args.pos.length) return null;
        let t = tagCache.get(args);
        if (!t) {
            t = { kind: String(args.pos[0]).toLowerCase(), a: attrsOf(args.raw) };
            tagCache.set(args, t);
        }
        return t;
    }
    const pageTag = page => tagOf(page);       // one page: its comments
    const dataTag = data => tagOf(data);       // event data: its note and every page's comments
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
    // the tagged places the action button talks to: a short list that calls back here (the page's own commands stay for doors).
    // The parts add their kinds (addKind: arm, darts, plan)
    const C = (code, parameters, indent) => ({ code, indent: indent || 0, parameters });
    const STUB = [C(355, ["TavernLife.use(this)"]), C(0, [])];
    const CORE_KINDS = new Set(["meal", "mealtable", "bath", "stage", "bed"]);
    const kinds = Object.create(null);   // kind -> fn(tag, event, interpreter): a talk (a list of commands) or null
    const _Game_Event_list = Game_Event.prototype.list;
    Game_Event.prototype.list = function() {
        const t = pageTag(this.page());
        if (t && (CORE_KINDS.has(t.kind) || kinds[t.kind])) return STUB;
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
        const ev = npc(role);
        return (ev && T.call("SpeechBubbles", "bustOf", ev)) || NPCS[role].bust;
    }

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
    const busy = () => !!seq || cardOpen();
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

    // ------------------------------------------------------------------
    // Effects on the map (plates, steam, music notes, drops, the water in the tub, the breakfast tray): kept here as plain records,
    // drawn by TavernLife_Render.js (map-space sprites in the tilemap); nothing of it is saved
    // ------------------------------------------------------------------
    const fx = [];   // { kind, x, y (map tiles, real), z, t, life, ... }
    function addFx(o) {
        o.t = 0;
        fx.push(o);
        return o;
    }
    // (without TavernLife_Render.js nothing is drawn, but the effects still end)
    function ageFx() {
        for (let i = fx.length - 1; i >= 0; i--) {
            const o = fx[i];
            o.t++;
            if (o.gone || (o.life && o.t >= o.life)) fx.splice(i, 1);
        }
    }
    const R = () => lib.render;   // the drawing part (TavernLife_Render.js), or null
    const cardOpen = () => !!(R() && R().isCardOpen());
    // the money flies from the hand that pays to the one that takes it (TavernLife_Render.js: Tawerna.ui's coins)
    function coins(amount, from, to) {
        const r = R();
        if (r) r.coins(amount, from, to);
    }
    // pays: the gold goes, the coins fly to `to` (an event or a place); false (and the popup over the player) when it is not enough.
    // service ("meal", "room", "bath", "song"): once paid, told on the bus as "served" { service, price, ...extra }
    function pay(price, to, service, extra) {
        if (gold() < price) { needGold(price); return false; }
        if (price > 0) {
            $gameParty.loseGold(price);
            spend(price);
            coins(price, $gamePlayer, to || null);
            popup(GOLD_ICON, "−" + price + " G", WARM);
        }
        if (service) emit("served", Object.assign({ service, price }, extra));
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
    // The card: a menu over the map - the list on the left, what the chosen line is on the right (the dishes at Borgar's, the rooms).
    // TavernLife_Render.js shows it; the talk waits for it; the choice is read by the next step of the talk.
    // ==================================================================
    let lastPick = null;
    const setPick = (key, pick) => { lastPick = { key, pick }; };
    function takePick(key) {
        const p = lastPick && lastPick.key === key ? lastPick.pick : null;
        lastPick = null;
        return p;
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
        return dish.food || (dish.item ? T.call("FoodTable", "eatInfo", dish.item) : null) || { stamina: 20 };
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
        const N = T.api("Needs");
        if (N && N.eat) { const extra = N.eat(dish.item ? item(dish.item) : null, food); if (extra) parts.push(extra); }
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
    function mealCardSpec() {
        const dd = dishOfDay();
        const entries = DISHES.map(d => {
            const price = priceOf(d), can = gold() >= price;
            return { dish: d, name: d.name, right: price + " G", oldRight: price !== d.price ? d.price + " G" : "", badge: d === dd ? "DANIE DNIA" : "",
                sub: d === dd ? "−" + Math.round(DAY_DISCOUNT * 100) + "% · " + d.sub : d.sub, enabled: can, why: () => needGold(price) };
        });
        return { key: "meal", kicker: "KARCZMA „POD ZŁOTYM KUFLEM” · KUCHNIA BORGARA", title: "Karta dań", entries, okWord: "zamów",
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
    const QB = () => T.api("QuestBoard");
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
        if (!pay(price, to, "room", { room: room.room })) return false;
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


    function roomCardSpec() {
        const entries = rooms().map(r => {
            const price = roomPrice(r), ok = canRent(r);
            return { room: r.room, data: r, name: r.name, right: price + " G", oldRight: price !== r.price ? r.price + " G" : "",
                sub: ok ? (isNumbered(r.room) && !namedAsRoom(r) ? "pokój nr " + r.room + " · " : "") + "śniadanie: " + giftName(r.room) : "sława „" + tierName(repTierOf(r.minrep)) + "” - " + (r.room === "zloty" ? "dla dostojnych gości" : "dla stałych gości"),
                enabled: ok && gold() >= price, why: () => (ok ? needGold(price) : popup(0, r.name + ": " + onlyFor(r) + ".", BAD)) };
        });
        return { key: "room", kicker: "PIĘTRO „ZŁOTEGO KUFLA” · POKOJE GOŚCI", title: "Pokoje na noc", entries, okWord: "wynajmij",
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
    function breakfastInBed(room) {
        const bf = BREAKFAST_IN_BED[room];
        if (!bf) return;
        const N = T.api("Needs");
        if (N && N.enabled && N.enabled()) { const n = N.state(); n.food = Math.min(100, n.food + bf.fed); n.water = Math.min(100, n.water + bf.water); }
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
    let bathing = null;   // { cut, lift } while he sits in the tub: TavernLife_Render.js shows only the top of him, a little higher
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
        const J = T.api("Journal"), d = J && J.data ? J.data() : null, old = d && d.notes ? d.notes.find(n => n.title === "Pieśni Melii") : null;
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
    // THE MINI-GAMES (TavernLife_ArmWrestle.js, TavernLife_Darts.js): scenes on Tawerna.ui.Scene_MiniGame (TawernaUI.js) - the tavern
    // blurred behind, the rules and result cards, the pause (P), the key hints, a seed and turbo for the tests. Shared here: the base
    // scene, the start, what a game's end does back on the map (the stake, the time, the numbers) and the word after it
    // ==================================================================
    const GAME = { pending: null, running: null, end: null, onTick: null, lastResult: null };   // (TavernLife.onTick: the tests' bots)
    const games = Object.create(null);   // "arm" / "darts" -> { xpWin, xpLose, reason, apply(stats, res), note(), who(g), after(res, g, who) }
    let GameScene = null;
    function gameScene() {
        if (GameScene) return GameScene;
        const ui = T.ui;
        if (!ui || !ui.Scene_MiniGame) throw new Error("TavernLife.js: brak TawernaUI.js (Tawerna.ui.Scene_MiniGame) - musi być wyżej na liście wtyczek");
        GameScene = class Scene_TavernGame extends ui.Scene_MiniGame {
            initialize() {
                super.initialize();
                this.touchOk = true;   // (a press anywhere is O, as it always was)
                this.stake = Math.max(0, Math.floor(this.opts.stake || 0));
                this.pics = [];
            }
            get root() { return this.stage; }
            create() {
                super.create();
                this.panels = new Sprite(new Bitmap(Graphics.width, Graphics.height));   // the game's own panels (round, score), under the key hints
                this.hud.addChildAt(this.panels, 0);
            }
            // a picture the scene shows (the busts, the arms): outside ImageManager - a missing file never stops the game; the scene waits for it
            pic(name) {
                const b = ui.loadBust(name);
                this.pics.push(b);
                return b;
            }
            isReady() { return super.isReady() && this.pics.every(b => b.isReady() || b.isError()); }
            start() {
                GAME.running = this;
                super.start();
            }
            terminate() {
                super.terminate();
                if (GAME.running === this) GAME.running = null;
            }
            // TavernLife.onTick (the tests' bots) before every logic step - the kit's hook for a game of its own
            testHook() { return typeof GAME.onTick === "function" ? GAME.onTick : super.testHook(); }
            dropTestHook() { if (typeof GAME.onTick === "function") GAME.onTick = null; else super.dropTestHook(); }
            // P pauses only while playing (canPause); "Poddaję się" gives up - the result card first, as before
            canPause() { return false; }
            onBack() {
                if (!this.canPause()) return false;
                this.pause();
                return true;
            }
            quitLabel() { return "Poddaję się (" + (this.stake ? "tracisz " + this.stake + " G" : "przegrana") + ")"; }
            quit() { this.giveUp(); }
            giveUp() {}
            get paused() { return !!(this.card && this.card.kind === "choice"); }
            // a card waits `wait` ticks before O closes it (O held or tapped in the game does not skip the result)
            updateCard() {
                const c = this.card, wait = c && c.kind === "info" ? c.spec.wait || 0 : 0;
                if (c && c.t + 1 <= wait) { c.t++; return; }
                super.updateCard();
            }
            sayOver(key, text, frames) { if (text && this[key]) this[key].say(text, frames); }
            // the game's own HUD (the key hints, its panels) only while it is played: hidden, not only cleared, under the cards
            showHud(on, rows) {
                this.setHints(on ? rows : []);
                this.hints.visible = on;
                this.panels.visible = on;
            }
            // the end: the result goes to the map (the stake is paid there, where it can be seen); the result card stays while it fades
            leave() { this.end(this.result); }
            end(result) {
                const shown = this.overlay.visible;
                GAME.lastResult = result;
                super.end(result);
                if (shown) this.overlay.visible = true;
            }
        };
        return GameScene;
    }
    function startGame(Scene, opts) {
        if (GAME.running) return false;
        const o = Object.assign({ turbo: TL.gameTurbo || 1 }, opts || {}), onEnd = o.onEnd;   // (TL.gameTurbo: tests speed up the games a talk starts)
        o.onEnd = res => {
            applyGameResult(res);
            if (typeof onEnd === "function") { try { onEnd(res); } catch (e) { console.error(e); } }
        };
        return T.ui.open(Scene, o);
    }
    // what a game's end does (on the map): the stake paid or won, the time, the strength, the numbers, the experience, a note the first time
    function applyGameResult(res) {
        if (!res || res.applied) return;
        res.applied = true;
        const def = games[res.game] || {};
        if (res.won && res.stake > 0) $gameParty.gainGold(res.stake);
        else if (!res.won && res.stake > 0) { const n = Math.min(gold(), res.stake); $gameParty.loseGold(n); spend(n); }
        pass(res.minutes / 60);
        if (res.stamina > 0 && typeof $gameSystem.changeStamina === "function") $gameSystem.changeStamina(-res.stamina);
        const st = S()[res.game];
        st.played++;
        if (res.won) { st.won++; st.net += res.stake; } else { st.lost++; st.net -= res.stake; }
        if (def.apply) def.apply(st, res);
        xp(res.won ? def.xpWin : def.xpLose, def.reason);
        if (first(res.game) && def.note) note.apply(null, def.note());
    }
    // back from a game a talk started: the coins go the right way, a word from the other player
    let gameAfter = null;   // { game, stake, opponent } while it is played (the talk's next step reads it)
    function afterGame() {
        const g = gameAfter, r = GAME.lastResult, def = g ? games[g.game] : null;
        gameAfter = null;
        if (!g || !r || r.game !== g.game || !def) return;
        const who = def.who ? def.who(g) : null;
        if (r.stake > 0) { if (r.won) coins(r.stake, who, $gamePlayer); else coins(r.stake, $gamePlayer, who); }
        if (def.after) def.after(r, g, who);
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
            case "bed": list = bedTalk(t.a); break;
            case "door": case "gate": list = repLocked(ev, t) ? lockedTalk(t) : null; break;
            default: if (kinds[t.kind]) list = kinds[t.kind](t, ev, interp); break;
        }
        if (list) run(interp, list);
    }
    function talk(interp, what) {
        if (what === "meal") run(interp, mealTalk());
        else if (what === "room") run(interp, roomTalk());
    }
    function openCardFor(interp, key) {
        const spec = key === "meal" ? mealCardSpec() : key === "room" ? roomCardSpec() : null, r = R();
        if (spec && spec.entries.length && r && r.openCard(spec)) hold(interp);
    }
    const steps = Object.create(null);   // the parts' steps: name -> fn(interp, event, arg, arg2)
    function step(interp, what, arg, arg2) {
        const ev = interp ? $gameMap.event(interp.eventId()) : null;
        switch (what) {
            case "meal": {
                const e = takePick("meal");
                if (!e) { run(interp, sayAs([], "borgar", pick(["Nie jesteś głodny? To może później.", "Rozmyśliłeś się? Kuchnia nie ucieknie."]))); return; }
                const dish = e.dish, price = priceOf(dish);
                if (!pay(price, npc("borgar") || ev, "meal", { dish: dish.id })) return;
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
                if (!pay(bathPrice(), attendant() || tub, "bath")) { bark(attendant(), "Na krechę wody nie grzeję.", 100); return; }
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
                if (arg && SONG_TIP > 0) tipped = pay(SONG_TIP, npc("melia"), "song");
                const o = [];
                if (arg && !tipped) sayAs(o, "melia", "Pusta sakiewka? Nie szkodzi - zaśpiewam i tak.");
                run(interp, o.concat(songList(nextSong(), tipped)));
                return;
            }
            case "songStart": songStart(arg); return;
            case "songEnd": songEnd(arg, !!arg2); return;
            case "gameAfter": afterGame(); return;
            default: if (steps[what]) steps[what](interp, ev, arg, arg2); return;
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
    // The map drives it all (the core's frame, after the map and its events); a new map, a new game or a loaded one start clean
    // ==================================================================
    T.onMapUpdate(scene => {
        if (scene !== SceneManager._scene || !$gameMap) return;
        stepSeq();
        const r = R();
        if (r) { r.updateCard(); r.updateFx(); } else ageFx();
        updateSinging();
        xpWatch();
        if (Graphics.frameCount % 30 === 0) syncDoors();
    }, { owner: PLUGIN, name: "update" });
    T.on("mapReady", () => prefetchRooms(), { owner: PLUGIN });
    T.on("mapEnter", () => {
        fx.length = 0;
        const r = R();
        if (r) r.mapEnter();
        syncDoors();
    }, { owner: PLUGIN });
    function resetTransient() {
        seq = null; bathing = null; singing = null; musicBack = null; gameAfter = null; lastPick = null;
        fx.length = 0; xpSeen = null;
        const r = R();
        if (r) r.reset();
    }
    T.on("newGame", resetTransient, { owner: PLUGIN });
    T.on("load", resetTransient, { owner: PLUGIN });

    // ==================================================================
    // API (other plugins, the debug menu, tests) and TavernLife.lib (for its parts, TavernLife_*.js)
    // ==================================================================
    const IDLE = { only: ["onMap", "sceneChange", "event"] };
    const idle = () => !!$gameMap && !busy() && T.isCalm(null, IDLE);
    const lib = {
        T, PLUGIN, params, param: (name, d) => (params[name] === undefined || params[name] === "" ? d : params[name]), num, nums,
        config: { DAY_DISCOUNT, HOSTED_NEEDS, CHECKOUT, BATH_PRICE, BATH_HOURS, CLEAN_HOURS, CLEAN_COST, SONG_TIP, SONG_FROM, INSPIRED_HOURS, INSPIRED_XP,
            ARM_STAKES, DARTS_STAKES, RESTED_BONUS },
        clamp, lerp, ease, hash, pick, U, GOOD, BAD, WARM, GOLD_ICON, C, q, se, me, hasClock, day, hour, nowH, pass, wakeHour, perk, attr, gold, item,
        hoursText, pct, popup, needGold, notice, note, bark, xp, cached, dirty, dropBitmap, S, first, spend,
        tagOf, pageTag, dataTag, evTag, spots, npc, bustOf, NPCS, say, sayLines, sayAs, heroSay, script, choose, run, runOnMap, busy, hold, W, TL,
        fx, addFx, get bathing() { return bathing; }, blockedByEvent, DIRS, DISHES, dishOfDay, priceOf, foodOf, SV, BUFFS, hasBuff,
        reputation, repTier, repTierOf, tierName, repDiscount, repPrice, QB, rooms, roomOf, roomKey, roomPrice, canRent, onlyFor, rentedRoom, isRented,
        isNumbered, namedAsRoom, giftName, RESTED, inSongHours, bathPrice, setPick,
        GAME, gameScene, startGame, applyGameResult,
        defineGame: (key, def) => { games[key] = def; },
        setGameAfter: g => { gameAfter = g; },
        addKind: (kind, fn) => { kinds[String(kind).toLowerCase()] = fn; },
        addStep: (name, fn) => { steps[name] = fn; },
        render: null
    };
    const TavernLife = {
        DISHES, SONGS, ROOM_NAMES, BUFFS, buffs: BUFFS, GAME, TL, lib, modules: { TavernLife: true },
        use, talk, card: openCardFor, step, go, hold, borgarOptions,
        // a meal: with a dish id at once (pays, sits down, eats); without one, Borgar's talk with the card
        meal(id) {
            if (!idle()) return false;
            if (id === undefined) return runOnMap(mealTalk());
            const dish = dishById(id);
            if (!dish || !pay(priceOf(dish), npc("borgar"), "meal", { dish: dish.id })) return false;
            return runOnMap([C(355, ["TavernLife.go(this, 'meal', " + q(dish.id) + ")"])]);
        },
        rentRoom: n => rentRoom(n, npc("borgar")),
        bath() {
            const tub = spots("bath")[0];
            if (!idle() || !tub || !pay(bathPrice(), attendant() || tub.ev, "bath")) return false;
            return runOnMap([C(355, ["TavernLife.go(this, 'bath', " + tub.ev.eventId() + ")"])]);
        },
        song(tip) {
            if (!idle() || !inSongHours() || S().songDay === day()) return false;
            const tipped = !!tip && pay(SONG_TIP, npc("melia"), "song");
            return runOnMap(songList(nextSong(), tipped));
        },
        sleep(room) {
            const r = rentedRoom();
            if (!idle() || !r || r.slept || (room !== undefined && roomKey(r.room) !== roomKey(room))) return false;
            return runOnMap([C(355, ["TavernLife.go(this, 'sleep', " + q(r.room) + ")"])]);
        },
        dishOfDay, priceOf, rooms, rentedRoom, isRented, syncDoors, nextSong, npc,
        reputation, repTier, repDiscount, tierName, bathPrice: () => bathPrice(), roomPrice: n => { const r = roomOf(n); return r ? roomPrice(r) : null; },
        gates: () => Object.assign({}, S().gates || {}),
        spots: kind => spots(kind).map(s => ({ id: s.ev.eventId(), x: s.ev.x, y: s.ev.y, a: s.a })),
        stats: () => JSON.parse(JSON.stringify(S())),
        state: () => S(),
        busy,
        get openCard() { return R() ? R().cardInfo() : null; },
        // tests: the card's line i chosen as if by the keys (null: closed with P)
        cardChoose: i => (R() ? R().cardChoose(i) : false),
        gameState: () => (GAME.running && GAME.running.state ? GAME.running.state() : null),
        get onTick() { return GAME.onTick; },
        set onTick(fn) { GAME.onTick = fn; },
        get lastResult() { return GAME.lastResult; },
        get fx() { return fx; },
        get bathing() { return bathing; },
        litCandles: () => (R() ? R().litCandles() : []),
        get singing() { return !!singing; },
        xpWatch
    };
    window.TavernLife = T.register(PLUGIN, TavernLife);

    // ------------------------------------------------------------------
    // The rebuilt ground floor (2026-10-05, tools/tavern/v2: 101x84 -> 101x55, every room rebuilt): a game saved inside the tavern
    // before it lands at the entrance (the old coordinates are other rooms now, or past the map's bottom); the map is set up anew
    // ------------------------------------------------------------------
    const TAVERN_LAYOUT = 2, ENTRANCE = [50, 53, 8];
    const _DataManager_setupNewGame = DataManager.setupNewGame;
    DataManager.setupNewGame = function() {
        _DataManager_setupNewGame.call(this);
        $gameSystem._tavernLayout = TAVERN_LAYOUT;
    };
    const _Game_System_onAfterLoad = Game_System.prototype.onAfterLoad;
    Game_System.prototype.onAfterLoad = function() {
        _Game_System_onAfterLoad.call(this);
        if (this._tavernLayout === TAVERN_LAYOUT) return;
        this._tavernLayout = TAVERN_LAYOUT;
        if ($gameMap.mapId() !== 1 || $gamePlayer.isTransferring()) return;
        $gamePlayer.setPosition(ENTRANCE[0], ENTRANCE[1]);   // (no map maths yet: the saved map is set up again by the transfer)
        $gamePlayer.reserveTransfer(1, ENTRANCE[0], ENTRANCE[1], ENTRANCE[2], 0);
        $gamePlayer.requestMapReload();
    };
})();
