/*:
 * @target MZ
 * @plugindesc Walka i rozwój postaci: tryb walki (Tab) - kombo i ciężki cios (O), blok i parowanie (P), zmiana broni ([ ]), przewrót (Spacja); oddech; atrybuty, poziomy, doświadczenie, umiejętności. v1.1.0
 * @author Tawerna
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter Hunting
 * @orderAfter Survival
 * @orderAfter ChoppableTree
 * @orderAfter FreeMovement
 * @orderAfter Journal
 *
 * @param levels
 * @text Poziom wrogów na mapach
 * @type string
 * @default {"3":1,"4":2,"5":3,"6":3,"7":2,"8":2,"12":4,"15":3,"17":2,"18":3}
 * @desc Numer mapy -> poziom dzikich zwierząt i innych wrogów na niej (1 = najsłabsi). Notatka mapy <Poziom:N> ma pierwszeństwo.
 *
 * @help
 * WALKA (docs/WALKA.md) - taktyczna i ciężka, na żywo na mapie.
 *
 * Oddech: krótki pasek pod stopami postaci, widoczny w walce. Cios, przewrót i blok go zużywają,
 * wraca w 2-3 sekundy, gdy nic nie robisz. Pusty = zadyszka: dopóki nie wróci część oddechu, nie ma
 * ciosów ani przewrotu. Zmęczenie, głód, pragnienie i rana skracają pasek.
 *
 * Klawisze. Tab włącza i wyłącza tryb walki (u góry ekranu miga wtedy napis "Tryb walki").
 * W trybie walki, na mapie:
 *   O (stuknięcie)   cios bronią w ręku; kolejne O w rytmie łączą 2-3 ciosy (kombo), ostatni odrzuca.
 *   O (przytrzymanie) ciężki cios: ładowanie, potem mocne uderzenie, które mocno zbija równowagę.
 *                    Z łukiem lub procą w ręku: O przytrzymane = celowanie, puszczone = strzał.
 *   P (przytrzymanie) blok (z tarczą mniej obrażeń); P tuż przed trafieniem = parowanie: wróg się zatacza.
 *   [ / ]            poprzednia / następna broń w ręku (plakietka w prawym dolnym rogu).
 *   Enter, Esc, R    nic nie robią - akcja i menu wracają po wyjściu z trybu walki (Tab).
 * W trybie normalnym: O = akcja, P = menu, [ i ] nic nie robią.
 * W obu trybach: Spacja = przewrót w kierunku strzałek (albo tam, gdzie patrzysz) z chwilą
 * nietykalności; C = skradanie (cios w nieświadomego wroga: podwójne obrażenia). W menu i rozmowach
 * O, P, Enter, Esc i Spacja działają zawsze jak OK / anuluj.
 *
 * Bronie wręcz (mają animacje): pięści (bez broni: słabe, ale szybkie; zawsze ostatnie na liście),
 * pałka (szybka i lekka), siekiery (kamienna, żelazna), oszczep, kilofy. Łuk i proca: celowanie i strzał.
 *
 * Rozwój: atrybuty Siła, Zręczność, Kondycja, Czujność, Hart ducha (start po 5), poziomy (do 100),
 * doświadczenie za walkę, cele dziennika, odkrycia (pierwsza wizyta na mapie, polecenie "Odkrycie")
 * i pierwsze zdobycie przedmiotu / postawienie budynku. Na poziom: 3 punkty atrybutów i 1 punkt
 * umiejętności - rozdaje się je w menu P -> Postać.
 *
 * Stan w zapisie (rdzeń TawernaCore): $gameSystem._tw.hero (poziom, doświadczenie, atrybuty,
 * umiejętności; stare zapisy z $gameSystem._hero są przejmowane) i $gameSystem._tw.combat (tryb walki,
 * broń w ręku; dawne $gameSystem._combatMode / _combatHand przechodzą tam przy wczytaniu). Stare
 * nazwy dalej prowadzą do nowego miejsca.
 *
 * Szyna zdarzeń (Tawerna.on): levelUp { level } - nowy poziom; heroHit { result, damage, by, name, hp }
 * - cios wroga doszedł do bohatera (result: dodged, parried, blocked, guardbreak, hit, bump); heroDown
 * { by, name, dead } - bohater leży (przewrócony ciosem albo bez życia); attack { weapon, combo, heavy,
 * hits } - cios bohatera spadł (trafił albo nie). Doświadczenie za zwierzę: zdarzenie kill (Hunting.js),
 * za pierwszy budynek danego rodzaju: zdarzenie build z done (Farming.js).
 *
 * PLIKI (2026-09-29 podzielone): Combat.js (bohater: atrybuty, poziomy, doświadczenie, umiejętności;
 * klawisze i tryb walki; stan; API; WSZYSTKIE haki silnika - ten), Combat_Fight.js (oddech, bieg, broń
 * w ręku, ciosy, przewrót, blok i parowanie, ciosy wrogów), Combat_UI.js (liczby i iskry na mapie,
 * paski wrogów, oddech pod stopami, plakietka broni, pasek doświadczenia, napisy trybu i poziomu,
 * ekran Postaci). Kolejność na liście wtyczek: Skills_Data, Combat, Combat_Fight, Combat_UI. Dopóki
 * części nie są wpisane, ten plik wczytuje je sam.
 *
 * @command discover
 * @text Odkrycie
 * @desc Daje doświadczenie za odkrycie fabularne (raz na identyfikator).
 * @arg id
 * @text Identyfikator
 * @type string
 * @arg name
 * @text Nazwa (w komunikacie)
 * @type string
 * @arg xp
 * @text Doświadczenie
 * @type number
 * @default 60
 */
(() => {
    "use strict";

    const T = window.Tawerna;
    if (!T) throw new Error("Combat.js: brak TawernaCore.js - musi być pierwszą wtyczką na liście (the Tawerna core is missing)");
    // the family's shared bag: this file (P.core), Combat_Fight.js (P.fight), Combat_UI.js (P.ui) - read when needed
    const P = T.api("Combat_parts") || T.register("Combat_parts", {});
    const missing = file => { throw new Error("Combat.js: brak " + file + " (a part of Combat.js)"); };
    const F = () => P.fight || missing("Combat_Fight.js");
    const UI = () => P.ui || missing("Combat_UI.js");

    const params = PluginManager.parameters("Combat");
    let PLACE_LEVELS = {};
    try { PLACE_LEVELS = JSON.parse(params.levels || "{}"); } catch (e) { PLACE_LEVELS = {}; }
    // a sound from the core's safe pool (a missing file stays silent); a popup over the hero (in a menu: its help line)
    const se = (name, volume, pitch) => T.audio.se(name, { volume, pitch });
    const popup = (icon, text, color) => T.popup(text, { icon, color, menu: true });

    // ==================================================================
    // The saved state (TawernaCore): _tw.hero - the level, the experience, the attributes, the skills and the firsts (an older
    // save's $gameSystem._hero is taken over; the old name stays a hidden way there); _tw.combat - the mode (Tab) and the weapon in
    // hand (an older save's $gameSystem._combatMode / _combatHand move in on loading; those names lead there too)
    // ==================================================================
    const ATTRS = [
        { id: "str", name: "Siła", desc: "Obrażenia wręcz, zbijanie równowagi wroga, udźwig; trochę mniej uderzeń przy rąbaniu, kopaniu i kuciu skał." },
        { id: "dex", name: "Zręczność", desc: "Tańszy przewrót z dłuższą nietykalnością, więcej czasu na następny cios serii, szybsze celowanie z łuku i procy, szybsza praca (budowa, rąbanie, kopanie, kucie skał)." },
        { id: "con", name: "Kondycja", desc: "Życie, długość oddechu, odporność na rany i przewrócenie." },
        { id: "per", name: "Czujność", desc: "Dłuższe okno parowania i częstsze trafienia krytyczne." },
        { id: "wil", name: "Hart ducha", desc: "Odporność na strach i na „prawdy” z Serca (stwory z ruin, później)." }
    ];
    // level 100 is the end-game challenge (a whole ordinary playthrough ends about 60-70); 3 attribute points and 1 skill point a
    // level, an attribute goes up to 60 (the effects per point are small, so the top is strong but not absurd)
    const ATTR_START = 5, ATTR_MAX = 60, MAX_LEVEL = 100, POINTS_PER_LEVEL = 3, SKILL_POINTS_PER_LEVEL = 1;
    function newHero() {
        const h = { level: 1, xp: 0, attr: {}, points: 0, skillPoints: 0, skills: {}, firsts: {}, seen: {}, ready: false };
        for (const a of ATTRS) h.attr[a.id] = ATTR_START;
        return h;
    }
    const heroState = T.state.define("hero", newHero, { version: 1, adopt: "_hero", owner: "Combat" });
    const modes = T.state.define("combat", () => ({ mode: false, hand: "" }), { version: 1, owner: "Combat" });
    const hero = () => heroState();
    // the old names of the mode and the hand (the core's calm check, the tests): on the prototype, never saved
    const OLD_KEYS = [["_combatMode", "mode"], ["_combatHand", "hand"]];
    for (const [name, field] of OLD_KEYS) {
        Object.defineProperty(Game_System.prototype, name, { configurable: true, enumerable: false,
            get() { const m = this === window.$gameSystem ? modes() : this._tw && this._tw.combat; return m ? m[field] : undefined; },
            set(v) {
                if (this === window.$gameSystem) modes()[field] = v;
                else Object.defineProperty(this, name, { value: v, writable: true, enumerable: true, configurable: true });
            } });
    }
    T.on("load", () => {   // (a save from before: its own fields move in, the prototype's way takes over)
        const sys = $gameSystem, m = modes();
        for (const [name, field] of OLD_KEYS) {
            if (!Object.prototype.hasOwnProperty.call(sys, name)) continue;
            const v = sys[name];
            delete sys[name];
            if (v !== undefined && v !== null) m[field] = v;
        }
    }, { owner: "Combat", priority: -10 });

    // ==================================================================
    // Keys. Space is the dodge on the map; everywhere else (menus, messages, the farm menus, placing a building) it still
    // confirms, as it always did.
    // ==================================================================
    Input.keyMapper[32] = "dodge";   // Space
    // O, P, Enter, Esc, [ and ] have names of their own: what they do depends on the mode (Tab switches it, _tw.combat.mode).
    // Normal mode: O and Enter = OK, P and Esc = cancel / menu (as FreeMovement set them), [ and ] nothing. Combat mode, on the
    // map: O = "shoot" (the attack), P = "block", [ / ] = the previous / next weapon, and Enter, Esc and R (Farming's "flip")
    // nothing (user). In menus, messages and events O, P, Enter and Esc are OK and cancel again.
    Input.keyMapper[79] = "keyO";
    Input.keyMapper[80] = "keyP";
    Input.keyMapper[13] = "keyEnter";
    for (const code of [27, 45, 96]) Input.keyMapper[code] = "keyEsc";   // Esc, Insert, numpad 0 (the engine's other cancel keys)
    Input.keyMapper[219] = "keyLB";   // [
    Input.keyMapper[221] = "keyRB";   // ]
    Input.keyMapper[9] = "tab";       // Tab: the mode (the engine's own name for it; nothing else here uses it)
    delete Input.keyMapper[220];      // (the backslash and X switched the weapon and the mode before: free again)
    delete Input.keyMapper[88];
    // free play on the map: no scene change, message, event, farm menu or building being placed (the core's calm check)
    const FREE_PLAY = { only: ["onMap", "sceneChange", "message", "farmMenu", "build", "event"] };
    const mapFreePlay = () => T.isCalm(null, FREE_PLAY);
    const combatMode = () => !!($gameSystem && modes().mode);
    const combatPlay = () => combatMode() && mapFreePlay();
    for (const fn of ["isPressed", "isTriggered", "isRepeated", "isLongPressed"]) {
        const original = Input[fn];
        Input[fn] = function(keyName) {
            if (original.call(this, keyName)) return true;
            switch (keyName) {
                case "ok": return (original.call(this, "dodge") && !mapFreePlay()) || ((original.call(this, "keyO") || original.call(this, "keyEnter")) && !combatPlay());
                case "escape": return (original.call(this, "keyP") || original.call(this, "keyEsc")) && !combatPlay();   // (cancel and menu check "escape" too)
                case "shoot": return original.call(this, "keyO") && combatPlay();
                case "block": return original.call(this, "keyP") && combatPlay();
                case "weaponPrev": return original.call(this, "keyLB") && combatPlay();
                case "weaponNext": return original.call(this, "keyRB") && combatPlay();
            }
            return false;
        };
    }
    function setCombatMode(on) {
        modes().mode = !!on;
        se(on ? "Sword1" : "Equip2", 70, on ? 110 : 100);
        popup(on ? 76 : 0, on ? "Tryb walki: O - atak, P - obrona, [ ] - broń (Tab - tryb normalny)" : "Tryb normalny: O - akcja, P - menu", on ? "#ffb07f" : "#eceef0");
    }

    // ==================================================================
    // The hero: attributes, level, experience, skills
    // ==================================================================
    // the skill trees (Skills_Data.js): ten fields, each a tree of skills with ranks; a skill opens the way to the ones under it
    const SD = T.api("Skills_Data") || { TREES: [], SKILLS: [], FX: {}, ROW_LEVEL: [1] };
    const TREES = SD.TREES, SKILLS = SD.SKILLS, ROW_LEVEL = SD.ROW_LEVEL;
    const skillById = id => SKILLS.find(s => s.id === id) || null;

    const attr = id => ($gameSystem ? hero().attr[id] : ATTR_START);
    // the rank of a skill (0: not learnt; a save from stage 1 keeps `true` = rank 1)
    const skillRank = id => { if (!$gameSystem) return 0; const v = hero().skills[id]; return v === true ? 1 : Number(v) || 0; };
    const hasSkill = id => skillRank(id) > 0;
    // Combat.perk(key): what the learnt skills add up to for one effect (Skills_Data.js fx: the value per rank times the rank);
    // every plugin asks it (e.g. Farming: "crop.growth"). Worked out again only when a skill is learnt or another game is loaded.
    let perkCache = null;
    function perk(key) {
        if (!$gameSystem) return 0;
        const h = hero();
        if (!perkCache || perkCache.h !== h || perkCache.rev !== (h.rev || 0)) {
            const sum = {};
            for (const sk of SKILLS) {
                const r = skillRank(sk.id);
                if (r > 0) for (const k of Object.keys(sk.fx)) sum[k] = (sum[k] || 0) + sk.fx[k] * r;
            }
            perkCache = { h, rev: h.rev || 0, sum };
        }
        return perkCache.sum[key] || 0;
    }
    // a roll against a perk that is a chance (e.g. "crop.yield" 0.4): true that often
    const perkRoll = key => { const c = perk(key); return c > 0 && Math.random() < c; };
    // experience to go from `level` to the next: 500 for the second level, then 20% more each level, to the full hundred (the user's
    // rule, 2026-09-25): 500, 600, 700, 900, 1000, 1200 ... (9 -> 10: 2100, 19 -> 20: 13 300, 29 -> 30: 82 400)
    const XP_FIRST = 500, XP_GROWTH = 1.2;
    const xpToNext = level => Math.max(100, Math.round(XP_FIRST * Math.pow(XP_GROWTH, level - 1) / 100) * 100);

    // why a skill (its next rank) cannot be learnt now (null: it can)
    function skillBlock(id) {
        const s = skillById(id), h = hero();
        if (!s) return "Nie ma takiej umiejętności.";
        const rank = skillRank(id);
        if (rank >= s.ranks) return s.ranks > 1 ? "Masz już najwyższy stopień." : "Już ją znasz.";
        const lv = ROW_LEVEL[s.row] || 1;
        if (h.level < lv) return "Wymaga poziomu " + lv + ".";
        if (rank === 0 && s.from.length && !s.from.some(f => skillRank(f) > 0)) return "Najpierw: " + s.from.map(f => skillById(f).name).join(" albo ") + ".";
        for (const a of ATTRS) if (s.attr[a.id] && h.attr[a.id] < s.attr[a.id]) return "Wymaga: " + a.name + " " + s.attr[a.id] + ".";
        if (h.skillPoints < 1) return "Brak punktów umiejętności.";
        return null;
    }
    function learnSkill(id) {
        if (skillBlock(id)) return false;
        const h = hero(), actor = $gameParty.leader(), mhp0 = actor ? actor.mhp : 0;
        h.skills[id] = skillRank(id) + 1;
        h.skillPoints--;
        h.rev = (h.rev || 0) + 1;
        if (actor) { actor.refresh(); if (actor.mhp > mhp0) actor.gainHp(actor.mhp - mhp0); }   // (the health a skill adds comes as health too)
        return true;
    }
    // adds the given points (e.g. { str: 2, con: 1 }) from the free pool; the health gained with Kondycja comes as health too
    function spendPoints(add) {
        const h = hero(), total = Object.values(add).reduce((a, b) => a + Math.max(0, b), 0);
        if (total < 1 || total > h.points) return false;
        for (const a of ATTRS) if ((add[a.id] || 0) > 0 && h.attr[a.id] + add[a.id] > ATTR_MAX) return false;
        const actor = $gameParty.leader(), mhp0 = actor ? actor.mhp : 0;
        for (const a of ATTRS) h.attr[a.id] += Math.max(0, add[a.id] || 0);
        h.points -= total;
        if (actor) { actor.refresh(); if (actor.mhp > mhp0) actor.gainHp(actor.mhp - mhp0); }
        return true;
    }
    const unspent = () => ($gameSystem ? hero().points + hero().skillPoints : 0);

    // the text of a skill at a rank: {key} -> the value of its effect times the rank (Skills_Data.js FX says how it reads)
    const secText = frames => (frames / 60).toFixed(2).replace(".", ",") + " s";
    function fxText(key, v) {
        const f = (SD.FX && SD.FX[key]) || "n";
        if (f === "%") return Math.round(v * 100) + "%";
        if (f === "s") return secText(v);
        return String(Math.round(v * 10) / 10).replace(".", ",");
    }
    function skillText(sk, rank) {
        return sk.text.replace(/\{([^}]+)\}/g, (m, k) => fxText(k, (sk.fx[k] || 0) * Math.max(1, rank)));
    }

    // ---- experience
    let xpBatch = { amount: 0, reason: "", t: 0, n: 0 };
    // quiet: no plate in the list of gains (the caller says it itself - a journal goal at the top centre)
    function gainXp(amount, reason, quiet) {
        amount = Math.round(amount);
        if (!(amount > 0) || !$gameSystem) return 0;
        const h = hero();
        if (h.level >= MAX_LEVEL) return 0;
        h.xp += amount;
        if (!quiet) {
            xpBatch.amount += amount;
            xpBatch.n++;
            xpBatch.reason = reason || xpBatch.reason;
            xpBatch.t = 24;   // shown together with what comes within the next moment
        }
        while (h.level < MAX_LEVEL && h.xp >= xpToNext(h.level)) {
            const actor = $gameParty.leader(), m0 = actor ? actor.mhp : 0;
            h.xp -= xpToNext(h.level);
            h.level++;
            h.points += POINTS_PER_LEVEL;
            h.skillPoints += SKILL_POINTS_PER_LEVEL;
            if (actor) { actor.refresh(); if (actor.mhp > m0) actor.gainHp(actor.mhp - m0); }   // (the health a level adds comes as health too)
            levelUp(h.level);
        }
        if (h.level >= MAX_LEVEL) h.xp = 0;
        return amount;
    }
    function flushXpPopup() {
        if (xpBatch.t > 0 && --xpBatch.t > 0) return;
        if (xpBatch.amount > 0) {   // at the top centre (SurvivalHUD's notice, which adds up while it is shown - the user's, 2026-09-25)
            const text = "+" + xpBatch.amount + " dośw." + (xpBatch.n === 1 && xpBatch.reason ? "  (" + xpBatch.reason + ")" : "");
            if ($gameTemp.pushTopNotice) $gameTemp.pushTopNotice(text, "#c9a6ff", { sum: { key: "xp", amount: xpBatch.amount, n: xpBatch.n, unit: "dośw.", reason: xpBatch.reason } });
            else popup(0, text, "#c9a6ff");
            xpBatch = { amount: 0, reason: "", t: 0, n: 0 };
        }
    }
    // a new level: the fanfare, and the bus (Combat_UI.js shows "Poziom N!" across the top)
    function levelUp(level) {
        se("Up4", 85, 100);
        T.emit("levelUp", { level });
    }
    // the XP a beaten enemy gives: its kind and level; far weaker than the hero: little
    const KILL_XP = { rabbit: 5, deer: 10, boar: 20, wolf: 15 };   // (the user's values, 2026-09-24)
    function killXp(kind, level) {
        const base = KILL_XP[kind] || 10, lv = level || 1, diff = lv - hero().level;
        return Math.round(base * (1 + 0.2 * (lv - 1)) * (diff <= -5 ? 0.25 : diff <= -3 ? 0.6 : 1));
    }
    // goal: a journal goal done; map: the first visit to a map; discovery: a story discovery (the "discover" command); first...: the
    // first time an item (a tool / weapon / key item) comes to the bag, the first building of a kind (the user's values, 2026-09-24)
    const XP = { goal: 50, map: 50, discovery: 40, firstItem: 5, firstTool: 5, firstBuilding: 5 };
    function discover(id, name, xp) {
        const h = hero();
        if (h.seen["d:" + id]) return false;
        h.seen["d:" + id] = true;
        gainXp(xp || XP.discovery, "Odkrycie: " + (name || id));
        return true;
    }
    PluginManager.registerCommand("Combat", "discover", args => discover(String(args.id || ""), String(args.name || ""), Number(args.xp) || XP.discovery));

    // the level of the wild things of this place: the map note <Poziom:N>, else the plugin parameter, else 1
    function placeLevel() {
        const tag = T.mapTag("Poziom");
        if (tag && /^\d+$/.test(tag.raw)) return Math.max(1, Number(tag.raw));
        return Math.max(1, Number(PLACE_LEVELS[$gameMap.mapId()]) || 1);
    }
    // an enemy's level against the hero's: grey (far weaker), white, orange, red (far stronger)
    function levelColor(level) {
        const d = level - hero().level;
        return d <= -4 ? "#8b9097" : d <= 1 ? "#eceef0" : d <= 3 ? "#ffa64a" : "#ff4b3e";
    }

    // ---- what the attributes do
    const strMult = () => 1 + 0.035 * (attr("str") - ATTR_START);
    const poiseMult = () => 1 + 0.045 * (attr("str") - ATTR_START);
    const critChance = () => 0.03 + 0.007 * (attr("per") - ATTR_START) + perk("melee.crit");
    const rollCost = () => Math.max(10, Math.round(24 - 0.25 * (attr("dex") - ATTR_START)));
    const rollIFrames = () => Math.min(24, 13 + Math.floor(0.2 * (attr("dex") - ATTR_START))) + perk("roll.iframes");
    const parryWindow = () => Math.round((8 + 0.25 * (attr("per") - ATTR_START)) * (hasSkill("keen") ? 1.5 : 1));
    const knockdownAt = () => Math.round((60 + 1.8 * (attr("con") - ATTR_START)) * (1 + perk("knock.resist")));
    const woundChance = base => base * (hasSkill("thickskin") ? 0.5 : 1) * Math.max(0.25, 1 - 0.014 * (attr("con") - ATTR_START));
    const carryBonus = () => Math.round(0.9 * Math.max(0, attr("str") - ATTR_START)) + perk("carry");
    const gatherBonus = () => 0.005 * Math.max(0, attr("str") - ATTR_START);   // part of the blows Siła saves chopping, digging and mining (ChoppableTree)
    // how fast he works: the swing and the pause of the hammer on a site (Farming), of the axe, the shovel and the pickaxe (ChoppableTree).
    // dexWork: what Zręczność gives; workSpeed: that, halved while he is tired out (below TIRED_AT of the strength, the user's rule - he
    // also walks and runs at half the speed then, and says so once: updateTired)
    const TIRED_AT = 0.2;
    const tired = () => !!$gameSystem && typeof $gameSystem.staminaRatio === "function" && $gameSystem.staminaRatio() < TIRED_AT;
    const dexWork = () => 1 + 0.01 * Math.max(0, attr("dex") - ATTR_START);
    const workSpeed = () => dexWork() * (tired() ? 0.5 : 1);
    const comboWindow = () => Math.round(8 + 0.8 * (attr("dex") - ATTR_START));   // frames after a blow in which the attack key still goes on with the series
    const aimSteady = () => Math.max(0.3, (1 - 0.01 * (attr("dex") - ATTR_START)) * (1 - perk("aim.speed")));   // the bow's / sling's circle: part of the time it takes to close
    const baseBreath = () => Math.round(100 * (0.9 + 0.02 * attr("con")));   // (rested and fed)
    // the hero's most health: 100, +5 per Kondycja over 5, +3 per level, and what the skills add
    const heroMhp = () => 100 + 5 * (attr("con") - ATTR_START) + 3 * (hero().level - 1) + perk("hp.max");
    const _Game_Actor_paramBase = Game_Actor.prototype.paramBase;
    Game_Actor.prototype.paramBase = function(paramId) {
        const lead = $gameParty && $gameParty._actors && $gameParty._actors.length ? $gameParty._actors[0] : ($dataSystem.partyMembers || [])[0];
        if (paramId === 0 && $gameSystem && lead === this.actorId()) return heroMhp();
        return _Game_Actor_paramBase.call(this, paramId);
    };
    // he says it when the strength drops below TIRED_AT (again only after it has been above it)
    let wasTired = false;
    function updateTired() {
        const now = tired();
        if (now && !wasTired) T.call("SpeechBubbles", "say", $gamePlayer, "Zmęczyłem się...");
        wasTired = now;
    }

    // ==================================================================
    // XP sources: first items, first buildings, first visits to a map, journal goals, beaten animals
    // ==================================================================
    const _Game_Party_gainItem = Game_Party.prototype.gainItem;
    Game_Party.prototype.gainItem = function(item, amount, includeEquip) {
        _Game_Party_gainItem.call(this, item, amount, includeEquip);
        if (!item || !(amount > 0) || !$gameSystem || !DataManager.isItem(item)) return;
        const h = hero();
        if (!h.ready || h.firsts["i" + item.id]) return;
        h.firsts["i" + item.id] = true;
        if (!(SceneManager._scene instanceof Scene_Map)) return;
        gainXp(item.itypeId === 2 ? XP.firstTool : XP.firstItem, "nowe: " + item.name);
    };
    // Farming.js's buildings on every map (its saved farm, _tw.farm; none without Farming.js)
    const farmBuildings = () => { const farm = T.call("Farming", "farm"); return Object.values((farm && farm.buildings) || {}); };
    function markExisting() {   // what the hero already has / has built counts as known (an old save, a new game's start)
        const h = hero();
        for (const it of $gameParty.allItems()) if (DataManager.isItem(it)) h.firsts["i" + it.id] = true;
        for (const list of farmBuildings()) for (const b of list || []) if (!b.site) h.firsts["b" + b.type] = true;
        h.seen["m" + $gameMap.mapId()] = true;
        h.ready = true;
    }
    // the first building of a kind that stands (Farming.js's "build" with done: the last blow of the hammer, put up at once, an
    // upgrade, the F9 placer, Farming.build); a marked site is not one yet. Before the hero is ready (a new game, a save from before
    // Combat) markExisting counts what stands as known instead - no experience for it, as for what an older save already has.
    T.on("build", e => {
        if (!e.done || !$gameSystem) return;
        const h = hero();
        if (!h.ready || h.firsts["b" + e.type]) return;
        h.firsts["b" + e.type] = true;
        const def = (T.api("Farming") || {}).BUILDINGS, b = def && def[e.type];
        gainXp(XP.firstBuilding, "zbudowano: " + (b ? b.name : e.type));
    }, { owner: "Combat" });
    T.on("mapEnter", e => {
        if (!$gameSystem || !hero().ready) return;
        const h = hero(), mapId = e.mapId, name = ($dataMapInfos[mapId] || {}).name || "";
        if (h.seen["m" + mapId] || mapId === 100) return;
        h.seen["m" + mapId] = true;
        gainXp(XP.map, "odkrycie: " + ($gameMap.displayName() || name));
    }, { owner: "Combat" });
    // a goal's experience is said with the goal at the top centre (Journal.js), not in the list at the bottom right
    const J = T.api("Journal");
    if (J && J.onGoalDone) J.onGoalDone(goal => {
        const got = gainXp(XP.goal, "cel: " + goal.title, true);
        return got > 0 ? { text: "+" + got + " dośw.", color: "#c9a6ff" } : null;
    });
    // a beaten animal (Hunting.js's "kill": the hero's blow or shot, the dog's bite)
    T.on("kill", e => {
        const H = T.api("Hunting");
        gainXp(killXp(e.kind, e.level), ((H && H.SPECIES[e.kind]) || {}).name);
    }, { owner: "Combat" });

    // ==================================================================
    // The map's clock drives it (after the map, the events and the old-style hooks); a new game or a loaded one: nothing half done
    // ==================================================================
    T.onMapUpdate(scene => {
        if (!$gamePlayer || !$gameSystem) return;
        if (!hero().ready && !SceneManager.isSceneChanging()) markExisting();
        flushXpPopup();
        updateTired();
        F().update(scene);   // (the breath, the running, the roll, the guard, the combat keys - not while the world holds still)
    }, { owner: "Combat", name: "update" });
    T.on("newGame", () => {
        F().resetAct();
        const a = $gameParty.leader();
        if (a) a.recoverAll();   // (full health on the hero's own maximum)
    }, { owner: "Combat" });
    T.on("load", () => {
        F().resetAct();
        const a = $gameParty.leader();
        if (a) a.refresh();   // (a save from before: its health is fitted to the hero's own maximum)
    }, { owner: "Combat" });

    // ==================================================================
    // Engine hooks. Every one Combat has is in this file, so they keep Combat's place in the plugin list whether its parts are
    // listed or put into the page by this file at the end (the parts are functions and classes only).
    // ==================================================================
    // the hero on his feet: slower while guarding, winded or tired out; held still while rolling or stunned; no running while
    // guarding, or without breath or strength (Combat_Fight.js)
    const _Game_Player_realMoveSpeed = Game_Player.prototype.realMoveSpeed;
    Game_Player.prototype.realMoveSpeed = function() {
        const s = _Game_Player_realMoveSpeed.call(this);
        return this === $gamePlayer ? F().heroSpeed(s) : s;
    };
    const _Game_Player_canMove = Game_Player.prototype.canMove;
    Game_Player.prototype.canMove = function() {
        if (this === $gamePlayer && F().heldStill()) return false;
        return _Game_Player_canMove.call(this);
    };
    const _Game_Player_isDashing = Game_Player.prototype.isDashing;
    Game_Player.prototype.isDashing = function() {
        return F().mayRun(this) && _Game_Player_isDashing.call(this);
    };
    // the hitstop: the world holds still a moment when a blow lands (the screen effects go on)
    const _Scene_Map_updateMain = Scene_Map.prototype.updateMain;
    Scene_Map.prototype.updateMain = function() {
        if (F().holdFrame()) {
            $gameScreen.update();
            return;
        }
        _Scene_Map_updateMain.call(this);
    };
    // the look (Combat_UI.js): the combat layer in the tilemap; the weapon plate, the experience bar, the mode's label and the level
    // banner on the screen; the hero's and the animals' sprites react to the fight
    const _Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        _Spriteset_Map_createCharacters.call(this);
        UI().addCombatLayer(this);
    };
    const _Scene_Map_createSpriteset = Scene_Map.prototype.createSpriteset;
    Scene_Map.prototype.createSpriteset = function() {
        _Scene_Map_createSpriteset.call(this);
        UI().addHud(this);
    };
    const _Sprite_Character_update = Sprite_Character.prototype.update;
    Sprite_Character.prototype.update = function() {
        _Sprite_Character_update.call(this);
        UI().updateCharacter(this);
    };
    // Kupiecka żyłka: things sell dearer in any shop
    const _Scene_Shop_sellingPrice = Scene_Shop.prototype.sellingPrice;
    Scene_Shop.prototype.sellingPrice = function() {
        return Math.floor(_Scene_Shop_sellingPrice.call(this) * (1 + perk("sell")));
    };
    // the command in the P menu (MenuPanel.js gives it its label, its little drawing and the count of points to give out)
    const _addOriginalCommands = Window_MenuCommand.prototype.addOriginalCommands;
    Window_MenuCommand.prototype.addOriginalCommands = function() {
        _addOriginalCommands.call(this);
        this.addCommand("Postać", "hero", true);
    };
    const _Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
    Scene_Menu.prototype.createCommandWindow = function() {
        _Scene_Menu_createCommandWindow.call(this);
        this._commandWindow.setHandler("hero", () => SceneManager.push(UI().Scene_Hero));
    };

    // ==================================================================
    // For the parts, and window.Combat (the same as before the split: Combat.perk(key) is asked by every system)
    // ==================================================================
    P.core = { hero, modes, attr, skillRank, hasSkill, perk, skillById, skillBlock, learnSkill, spendPoints, skillText, secText, xpToNext, unspent,
        levelColor, ATTRS, ATTR_START, ATTR_MAX, MAX_LEVEL, POINTS_PER_LEVEL, SKILL_POINTS_PER_LEVEL, TREES, SKILLS, ROW_LEVEL, strMult, poiseMult,
        critChance, rollCost, rollIFrames, parryWindow, knockdownAt, woundChance, carryBonus, gatherBonus, tired, dexWork, workSpeed, comboWindow,
        aimSteady, baseBreath, heroMhp, combatMode, setCombatMode, mapFreePlay, se, popup };
    const fight = name => function() { const f = F(); return f[name].apply(f, arguments); };
    window.Combat = T.register("Combat", {
        ATTRS, SKILLS, TREES, get MELEE() { return F().MELEE; }, get SHIELDS() { return F().SHIELDS; }, MAX_LEVEL, ATTR_MAX, POINTS_PER_LEVEL, XP, KILL_XP,
        hero, attr, hasSkill, skillRank, perk, perkRoll, skillText, ROW_LEVEL, xpToNext, gainXp, killXp, skillBlock, learnSkill, spendPoints, discover, placeLevel, levelColor,
        combatMode, setCombatMode, maxBreath: fight("maxBreath"), breathNow: fight("breathNow"), spendBreath: fight("spendBreath"),
        get breath() { return F().breathNow(); }, get winded() { return F().isWinded(); }, get RUN() { return F().RUN; }, canRun: fight("canRun"),
        hand: fight("hand"), handMelee: fight("handMelee"), switchHand: fight("switchHand"), shield: fight("shield"), pressAttack: fight("pressAttack"),
        pressDodge: fight("pressDodge"), hitPlayer: fight("hitPlayer"), enemyHurtFx: fight("enemyHurtFx"), hitstop: fight("hitstop"), numberAt: fight("numberAt"),
        sparksAt: fight("sparksAt"), shovePlayer: fight("shovePlayer"),
        strMult, poiseMult, critChance, rollCost, rollIFrames, parryWindow, knockdownAt, carryBonus, gatherBonus, workSpeed, dexWork, tired, TIRED_AT, heroMhp, comboWindow, aimSteady, baseBreath, mapFreePlay,
        get act() { return F().act; }, get stopFrames() { return F().stopFrames(); }, get ROLL_KIND() { return F().ROLL_KIND; }, get KNOCK_KIND() { return F().KNOCK_KIND; },
        resetAct: fight("resetAct"), get Scene_Hero() { return UI().Scene_Hero; }, unspent
    });

    // the parts not in js/plugins.js yet: put into the page here (after every plugin - functions and classes only, every engine hook
    // is above, so nothing moves in the chain)
    for (const part of ["Combat_Fight", "Combat_UI"]) {
        if (!(window.$plugins || []).some(p => p && p.name === part && p.status)) PluginManager.loadScript(part);
    }
})();
