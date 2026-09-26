/*:
 * @target MZ
 * @plugindesc Walka i rozwój postaci: tryb walki (Tab) - kombo i ciężki cios (O), blok i parowanie (P), zmiana broni ([ ]), przewrót (Spacja); oddech; atrybuty, poziomy, doświadczenie, umiejętności. v1.0.0
 * @author Tawerna
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
 * Rozwój: atrybuty Siła, Zręczność, Kondycja, Czujność, Hart ducha (start po 5), poziomy (do 30),
 * doświadczenie za walkę, cele dziennika, odkrycia (pierwsza wizyta na mapie, polecenie "Odkrycie")
 * i pierwsze zdobycie przedmiotu / postawienie budynku. Na poziom: 3 punkty atrybutów i 1 punkt
 * umiejętności - rozdaje się je w menu P -> Postać (MenuPanel.js).
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

    const params = PluginManager.parameters("Combat");
    let PLACE_LEVELS = {};
    try { PLACE_LEVELS = JSON.parse(params.levels || "{}"); } catch (e) { PLACE_LEVELS = {}; }

    // ==================================================================
    // Keys. Space is the dodge on the map; everywhere else (menus, messages, the farm menus, placing a building) it still
    // confirms, as it always did.
    // ==================================================================
    Input.keyMapper[32] = "dodge";   // Space
    // O, P, Enter, Esc, [ and ] have names of their own: what they do depends on the mode (Tab switches it,
    // $gameSystem._combatMode). Normal mode: O and Enter = OK, P and Esc = cancel / menu (as FreeMovement set them), [ and ]
    // nothing. Combat mode, on the map: O = "shoot" (the attack), P = "block", [ / ] = the previous / next weapon, and Enter,
    // Esc and R (Farming's "flip") nothing (user). In menus, messages and events O, P, Enter and Esc are OK and cancel again.
    Input.keyMapper[79] = "keyO";
    Input.keyMapper[80] = "keyP";
    Input.keyMapper[13] = "keyEnter";
    for (const code of [27, 45, 96]) Input.keyMapper[code] = "keyEsc";   // Esc, Insert, numpad 0 (the engine's other cancel keys)
    Input.keyMapper[219] = "keyLB";   // [
    Input.keyMapper[221] = "keyRB";   // ]
    Input.keyMapper[9] = "tab";       // Tab: the mode (the engine's own name for it; nothing else here uses it)
    delete Input.keyMapper[220];      // (the backslash and X switched the weapon and the mode before: free again)
    delete Input.keyMapper[88];
    function mapFreePlay() {
        const s = SceneManager._scene;
        return s instanceof Scene_Map && !SceneManager.isSceneChanging() && !!$gameMessage && !$gameMessage.isBusy() &&
            !$gameTemp._farmMenuOpen && !$gameTemp._buildMode && !$gameMap.isEventRunning();
    }
    const combatMode = () => !!($gameSystem && $gameSystem._combatMode);
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
        $gameSystem._combatMode = !!on;
        AudioManager.playSe({ name: on ? "Sword1" : "Equip2", volume: 70, pitch: on ? 110 : 100, pan: 0 });
        popup(on ? 76 : 0, on ? "Tryb walki: O - atak, P - obrona, [ ] - broń (Tab - tryb normalny)" : "Tryb normalny: O - akcja, P - menu", on ? "#ffb07f" : "#eceef0");
    }

    // ==================================================================
    // The hero: attributes, level, experience, skills ($gameSystem._hero)
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
    // the skill trees (Skills_Data.js): ten fields, each a tree of skills with ranks; a skill opens the way to the ones under it
    const SD = window.SkillData || { TREES: [], SKILLS: [], FX: {}, ROW_LEVEL: [1] };
    const TREES = SD.TREES, SKILLS = SD.SKILLS, ROW_LEVEL = SD.ROW_LEVEL;
    const skillById = id => SKILLS.find(s => s.id === id) || null;

    function hero() {
        const s = $gameSystem;
        if (!s._hero) {
            s._hero = { level: 1, xp: 0, attr: {}, points: 0, skillPoints: 0, skills: {}, firsts: {}, seen: {}, ready: false };
            for (const a of ATTRS) s._hero.attr[a.id] = ATTR_START;
        }
        return s._hero;
    }
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
        if (xpBatch.amount > 0) {   // at the top centre (SurvivalHUD's notice), adding up while it is shown (the user's, 2026-09-25)
            const text = "+" + xpBatch.amount + " dośw." + (xpBatch.n === 1 && xpBatch.reason ? "  (" + xpBatch.reason + ")" : "");
            if ($gameTemp.pushTopNotice) $gameTemp.pushTopNotice(text, "#c9a6ff", { sum: { key: "xp", amount: xpBatch.amount, n: xpBatch.n, unit: "dośw.", reason: xpBatch.reason } });
            else popup(0, text, "#c9a6ff");
            xpBatch = { amount: 0, reason: "", t: 0, n: 0 };
        }
    }
    let levelBanner = null;   // { level, t }
    function levelUp(level) {
        levelBanner = { level, t: 0 };
        AudioManager.playSe({ name: "Up4", volume: 85, pitch: 100, pan: 0 });
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
        const tag = /<Poziom:\s*(\d+)\s*>/i.exec(($dataMap && $dataMap.note) || "");
        if (tag) return Math.max(1, Number(tag[1]));
        return Math.max(1, Number(PLACE_LEVELS[$gameMap.mapId()]) || 1);
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

    // ==================================================================
    // Breath: the short combat bar (not saved: it fills in seconds)
    // ==================================================================
    let breath = -1, breathSpent = 0, winded = false;
    function maxBreath() {
        let m = 100 * (0.9 + 0.02 * attr("con"));
        const st = typeof $gameSystem.staminaRatio === "function" ? $gameSystem.staminaRatio() : 1;
        m *= 0.65 + 0.35 * st;   // tired: shorter breath
        if (window.Needs && Needs.enabled && Needs.enabled()) {
            const n = Needs.state();
            if (n.food < 25) m *= 0.85;
            if (n.water < 25) m *= 0.85;
        }
        if (typeof $gameSystem.isWounded === "function" && $gameSystem.isWounded()) m *= 0.85;
        return Math.max(30, Math.round(m));
    }
    function breathNow() {
        const m = maxBreath();
        if (breath < 0 || breath > m) breath = m;
        return breath;
    }
    const BREATH = { delay: 40, full: 110, windedUntil: 0.35 };
    // pays `cost`; false (nothing paid) when out of breath
    function spendBreath(cost) {
        if (winded || breathNow() < 1) { noBreath(); return false; }
        breath = Math.max(0, breathNow() - cost);
        breathSpent = 0;
        if (breath <= 0) winded = true;
        return true;
    }
    let noBreathT = 0;
    function noBreath() {
        if (noBreathT > 0) return;
        noBreathT = 60;
        popup(82, "Brak tchu!", "#ff9f8f");
        AudioManager.playSe({ name: "Buzzer1", volume: 45, pitch: 120, pan: 0 });
    }
    // ---- running (user): it takes breath while you run (a full breath of 100 lasts ~7 s, and nothing comes back meanwhile) and,
    // slowly, strength (1 stamina for every RUN.staminaEvery frames of running, which also makes you hungry and thirsty: Needs.js);
    // out of breath (winded: "Brak tchu!", slower for a moment) or of strength you only walk
    const RUN = { breath: 0.25, staminaEvery: 180 };
    let runT = 0, runWished = false;
    const tooTiredToRun = () => typeof $gameSystem.stamina === "function" && $gameSystem.stamina() < 1;
    function canRun() {
        return !winded && breathNow() >= 1 && !tooTiredToRun();
    }
    function updateRun() {
        const p = $gamePlayer, moving = p.isMoving() && !p.isInVehicle();
        const wish = moving && p.isDashButtonPressed();
        if (wish && !runWished && tooTiredToRun()) popup(82, "Jesteś zbyt zmęczony, żeby biec", "#ff9f8f");
        runWished = wish;
        if (!moving || !p.isDashing()) return;
        breath = breathNow() - RUN.breath * (1 - perk("run.breath"));
        breathSpent = 0;
        if (breath < 1) { breath = 0; winded = true; noBreath(); }   // (the last crumb of breath is gone too: winded)
        if (++runT >= RUN.staminaEvery) {
            runT = 0;
            if (typeof $gameSystem.trySpendStamina === "function") $gameSystem.trySpendStamina(1);
        }
    }
    function updateBreath() {
        const m = maxBreath();
        if (breath < 0 || breath > m) breath = Math.min(m, breath < 0 ? m : breath);
        if (noBreathT > 0) noBreathT--;
        breathSpent++;
        if (act.mode === "block" || act.mode === "roll") return;   // (no breather while guarding or rolling)
        if (breathSpent > BREATH.delay && breath < m) breath = Math.min(m, breath + m / BREATH.full * (1 + perk("breath.regen")));
        if (winded && breath >= m * BREATH.windedUntil) winded = false;
    }

    // ==================================================================
    // Weapons: the melee ones of stage 1 are the tools that have their swing sheets (ChoppableTree.js kinds)
    // ==================================================================
    // dmg / poise: per hit before the attributes; reach: tiles from the hero's centre (+ half the target's size); cone: the cosine
    // a target must be within (1 = straight ahead); cost: breath per hit; combo: the swing kind of each hit; heavy: the swing of a
    // charged blow; hold: the frame of that swing held while charging; se: the sound of a hit
    const CLUB = window.ChoppableTree && ChoppableTree.swingKindOf && ChoppableTree.swingKindOf("Swing_Club") >= 0 ? ChoppableTree.swingKindOf("Swing_Club") : 3;   // (its own quick swing)
    const PUNCH = window.ChoppableTree && ChoppableTree.swingKindOf ? ChoppableTree.swingKindOf("Swing_Punch") : -1;   // (-1: no sheet, the blow lands at once)
    const FIST_ICON = 419;
    const MELEE = {
        0: { name: "Pięści", dmg: 5, poise: 12, reach: 1.15, cone: 0.5, cost: 7, combo: [PUNCH, PUNCH, PUNCH], heavy: PUNCH, hold: 5, se: "Blow1", sweep: false },   // (no weapon)
        156: { name: "Pałka", dmg: 13, poise: 26, reach: 1.45, cone: 0.45, cost: 10, combo: [CLUB, CLUB, CLUB], heavy: CLUB, hold: 7, se: "Blow1", sweep: false },
        115: { name: "Żelazna siekiera", dmg: 26, poise: 30, reach: 1.6, cone: 0.35, cost: 16, combo: [3, 3, 0], heavy: 0, hold: 10, se: "Slash2", sweep: true },
        60: { name: "Kamienna siekiera", dmg: 17, poise: 24, reach: 1.55, cone: 0.35, cost: 16, combo: [3, 3, 0], heavy: 0, hold: 10, se: "Blow2", sweep: true },
        154: { name: "Oszczep", dmg: 20, poise: 16, reach: 2.25, cone: 0.75, cost: 12, combo: [15, 15, 15], heavy: 15, hold: 9, se: "Slash4", sweep: false },
        116: { name: "Żelazny kilof", dmg: 30, poise: 42, reach: 1.45, cone: 0.45, cost: 22, combo: [1, 1], heavy: 1, hold: 14, se: "Blow6", sweep: true },
        63: { name: "Kamienny kilof", dmg: 22, poise: 36, reach: 1.45, cone: 0.45, cost: 22, combo: [1, 1], heavy: 1, hold: 14, se: "Blow6", sweep: true }
    };
    const MELEE_ORDER = [115, 154, 60, 116, 63, 156];
    const COMBO_MULT = [1, 1.1, 1.45, 1.6];
    const HEAVY = { min: 18, max: 60, mult: 2.2, full: 2.7, poise: 2.5, cost: 0.8 };
    const SHIELDS = { 155: { name: "Drewniana tarcza", reduce: 0.75, breath: 0.7 } };
    const NO_SHIELD = { reduce: 0.45, breath: 1 };
    const has = id => !!$dataItems[id] && $gameParty.numItems($dataItems[id]) > 0;
    const meleeOwned = () => MELEE_ORDER.filter(has);
    const hasRanged = () => (has(126) && has(127)) || (has(125) && has(64));
    function shield() {
        for (const id of Object.keys(SHIELDS)) if (has(Number(id))) return Object.assign({ id: Number(id) }, SHIELDS[id]);
        return null;
    }
    // the weapon in hand: "m<itemId>" (melee) or "ranged" (the bow / the sling, as Hunting.js picks); the stored choice when still
    // owned, else the best melee weapon, else the ranged one
    function handChoices() {
        const out = meleeOwned().map(id => "m" + id);
        if (hasRanged() || has(125) || has(126)) out.push("ranged");
        out.push("m0");   // the bare fists: the last choice, the only one with nothing else
        return out;
    }
    const handIcon = h => h === "m0" ? FIST_ICON : $dataItems[h[0] === "m" ? Number(h.slice(1)) : (has(126) ? 126 : 125)].iconIndex;
    function hand() {
        const list = handChoices(), stored = $gameSystem._combatHand;
        if (stored && list.includes(stored)) return stored;
        return list[0] || null;
    }
    const handMelee = () => { const h = hand(); return h && h[0] === "m" ? Number(h.slice(1)) : 0; };
    function switchHand(dir) {   // dir: 1 the next weapon (]), -1 the previous one ([)
        const list = handChoices();
        if (list.length < 2) { popup(FIST_ICON, "Nie masz broni - walczysz pięściami", "#ff9f8f"); return; }
        const i = list.indexOf(hand());
        $gameSystem._combatHand = list[(i + (dir < 0 ? -1 : 1) + list.length) % list.length];
        const h = hand();
        popup(handIcon(h), "W ręku: " + (h[0] === "m" ? MELEE[Number(h.slice(1))].name : "łuk / proca"), "#f3e0a0");
        SoundManager.playEquip();
    }

    // ==================================================================
    // The hero's actions
    // ==================================================================
    const act = { mode: "idle", combo: 0, queued: false, charge: 0, rollT: 0, rollLen: 0, rollDir: [0, 1], rollDist: 0, iframes: 0, blockT: 0,
        stun: 0, stunKind: "", flinchT: 0, flinchLen: 1, hitFrom: [0, 1], comboCd: 0, comboGrace: 0, rollCd: 0, rolls: 0, riposteT: 0, secondWind: false, combatT: 0, hurtT: 0, weapon: 0 };
    const ROLL = { frames: 22, dist: 2.4, cd: 10, chain: 26 };
    const px = () => $gamePlayer._realX + 0.5, py = () => $gamePlayer._realY + 0.5;
    const facingVec = () => ({ 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] }[$gamePlayer.direction()] || [0, 1]);
    function faceToward(x, y) {
        const dx = x - px(), dy = y - py();
        if (Math.abs(dx) >= Math.abs(dy)) $gamePlayer.setDirection(dx < 0 ? 4 : 6); else $gamePlayer.setDirection(dy < 0 ? 8 : 2);
    }
    function canAct() {
        return mapFreePlay() && !$gamePlayer.isTransferring() && !($gamePlayer.isJumping && $gamePlayer.isJumping());
    }
    function endSwing() {
        if ($gamePlayer._toolSwing) {
            if ($gamePlayer._swingEvent === $gamePlayer._toolSwing) $gamePlayer._swingEvent = null;
            $gamePlayer._toolSwing = null;
        }
        if (window.Hunting && Hunting.aim) Hunting.endAim();
    }
    function swingPastImpact() {
        const s = $gamePlayer._toolSwing;
        if (!s) return true;
        const def = window.ChoppableTree && ChoppableTree.swingKind ? ChoppableTree.swingKind(s._swingKind) : null;
        return !def || s._swingT >= def.impact;
    }
    // the nearest hostile thing in front (tiles), to turn to when the blow starts: up to 1.5 tiles past the reach, within 100 degrees
    function autoFace(w) {
        if (!window.Hunting) return;
        const d8 = Input.dir8, v = d8 ? ({ 1: [-1, 1], 2: [0, 1], 3: [1, 1], 4: [-1, 0], 6: [1, 0], 7: [-1, -1], 8: [0, -1], 9: [1, -1] }[d8]) : facingVec();
        let best = null, bestScore = Infinity;
        for (const t of Hunting.allTargets()) {
            const dx = t.x - px(), dy = t.y - py(), d = Math.hypot(dx, dy);
            if (d < 0.05 || d > w.reach + 1.5) continue;
            const cos = (dx * v[0] + dy * v[1]) / (d * Math.hypot(v[0], v[1]));
            if (cos < -0.2) continue;
            const score = d + (1 - cos) * 2;
            if (score < bestScore) { bestScore = score; best = t; }
        }
        if (best) faceToward(best.x, best.y);
        else if (d8) $gamePlayer.setDirection(Math.abs(v[0]) >= Math.abs(v[1]) ? (v[0] < 0 ? 4 : 6) : (v[1] < 0 ? 8 : 2));
    }

    // the attack key pressed
    function pressAttack() {
        const h = hand();
        if (h === "ranged" || (!h && window.Hunting)) {
            if (window.Hunting) return Hunting.startAim();   // (its own popup when there is nothing to shoot with)
            return false;
        }
        const id = handMelee(), w = MELEE[id];
        if (!w) return false;
        if (act.mode === "attack") {   // the next blow of the combo, once this one has landed
            if (swingPastImpact() && act.combo + 1 < maxCombo(w)) act.queued = true;
            return true;
        }
        if (act.mode !== "idle" || act.stun > 0 || act.comboCd > 0) return false;
        if (act.comboGrace > 0 && act.weapon === id && act.combo + 1 < maxCombo(w)) { act.comboGrace = 0; return startAttack(id, act.combo + 1); }   // (just after a blow: the series goes on)
        return startAttack(id, 0);
    }
    const maxCombo = w => w.combo.length + (hasSkill("combo4") ? 1 : 0);
    function startAttack(id, i) {
        const w = MELEE[id];
        if (!spendBreath(w.cost * (1 - perk("melee.breath")))) { act.mode = "idle"; return false; }
        autoFace(w);
        act.mode = "attack";
        act.combo = i;
        act.queued = false;
        act.charge = 0;
        act.weapon = id;
        act.combatT = 600;
        const kind = w.combo[Math.min(i, w.combo.length - 1)];
        const heavyStart = i === 0;   // (holding the key at the first blow charges it)
        const chargeRate = hasSkill("charge") ? 1.4 : 1;
        const opts = heavyStart ? {
            holdAt: w.hold, keepOnMove: true, still: true, wobble: 6,
            holdWhile: () => Input.isPressed("shoot") && act.charge < HEAVY.max,
            onWait: () => { act.charge = Math.min(HEAVY.max, act.charge + chargeRate); }
        } : null;
        const started = $gamePlayer.startToolSwing(kind, () => strike(id, i), () => afterBlow(id), opts);
        if (!started) { strike(id, i); afterBlow(id); }
        AudioManager.playSe({ name: "Wind7", volume: 55, pitch: 120 + i * 8, pan: 0 });
        return true;
    }
    function afterBlow(id) {
        const w = MELEE[id];
        if (act.mode !== "attack") return;
        if (act.queued && act.combo + 1 < maxCombo(w) && !winded) { startAttack(id, act.combo + 1); return; }
        act.mode = "idle";
        const last = act.combo + 1 >= maxCombo(w);
        act.comboCd = last ? 16 : 0;
        act.comboGrace = last ? 0 : comboWindow();
    }
    // the blow lands: everything in reach and in front takes it (the nearest only, unless the weapon sweeps and the hero has the skill)
    function strike(id, i) {
        const w = MELEE[id];
        const heavy = i === 0 && act.charge >= HEAVY.min;
        if (heavy) { breath = Math.max(0, breathNow() - w.cost * HEAVY.cost); if (breath <= 0) winded = true; }
        const full = heavy && act.charge >= HEAVY.max - 1;
        let mult = heavy ? (full ? HEAVY.full : HEAVY.mult) : COMBO_MULT[Math.min(i, COMBO_MULT.length - 1)];
        const last = i + 1 >= maxCombo(w);
        const poise = w.poise * poiseMult() * (1 + perk("melee.poise")) * (heavy ? HEAVY.poise : last ? 1.5 : 1);
        const [fx, fy] = facingVec(), reachBonus = heavy ? 0.3 : 0;
        const hits = [];
        for (const t of (window.Hunting ? Hunting.allTargets() : [])) {
            const dx = t.x - px(), dy = t.y - py(), d = Math.hypot(dx, dy);
            if (d > w.reach + reachBonus + (t.radius || 0.5) * 0.5) continue;
            if (d > 0.35 && (dx * fx + dy * fy) / d < w.cone - (heavy ? 0.15 : 0)) continue;
            hits.push({ t, d });
        }
        hits.sort((a, b) => a.d - b.d);
        const targets = w.sweep && hasSkill("sweep") ? hits : hits.slice(0, 1);
        if (window.Durability && targets.length) Durability.use(id);
        if (targets.length === 0) {
            if (window.Hunting) Hunting.makeNoise(px(), py(), 3);
            act.charge = 0;
            return;
        }
        let stop = heavy ? 7 : 4;
        for (const { t } of targets) {
            const a = t.ref && t.ref.isAnimal ? t.ref : null;
            let m = mult * strMult() * (1 + perk("melee.dmg")), tag = heavy ? "heavy" : "";
            const unaware = a && a._aware < 0.3 && !a._engaged && Hunting.sneaking();
            if (unaware) { m *= 2; tag = "sneak"; }
            if (a && a._stun > 0 && hasSkill("execute")) { m *= 2.5; tag = "execute"; }
            const crit = act.riposteT > 0 || Math.random() < critChance();
            if (crit) { m *= 1.6; act.riposteT = 0; tag = tag || "crit"; }
            const dmg = Math.max(1, Math.round(w.dmg * m));
            t.hit(dmg, "melee", { poise: Math.round(poise), knock: heavy || last, crit, heavy, tag, weapon: id });
            if (!a) numberAt(t.x, t.y - 0.6, String(dmg), crit ? "#ffe066" : "#ffffff");
            if (heavy || crit) stop = 8;
        }
        AudioManager.playSe({ name: w.se, volume: 85, pitch: heavy ? 80 : 100 + i * 6, pan: 0 });
        if (heavy) $gameScreen.startShake(4, 8, 12);
        hitstop(stop);
        act.charge = 0;
        act.combatT = 600;
    }

    // Space pressed: a roll toward the held arrows (or where he faces); during a blow once it has landed, it cuts the recovery short
    function pressDodge() {
        if (act.stun > 0 || act.mode === "roll") {
            if (act.mode === "roll" && hasSkill("acrobat") && act.rolls === 1 && act.rollT < act.rollLen * 0.55) { act.queuedRoll = true; }
            return false;
        }
        if (act.mode === "attack" && !swingPastImpact()) return false;
        if (act.rollCd > 0 && !(hasSkill("acrobat") && act.rolls === 1)) return false;
        return startRoll();
    }
    function startRoll() {
        const second = hasSkill("acrobat") && act.rolls === 1 && act.rollCd > 0;
        const cost = rollCost() * (second ? 0.6 : 1);
        if (!spendBreath(cost)) return false;
        endSwing();
        const d8 = Input.dir8, v = d8 ? ({ 1: [-1, 1], 2: [0, 1], 3: [1, 1], 4: [-1, 0], 6: [1, 0], 7: [-1, -1], 8: [0, -1], 9: [1, -1] }[d8]) : facingVec();
        const len = Math.hypot(v[0], v[1]);
        act.rollDir = [v[0] / len, v[1] / len];
        if (d8) $gamePlayer.setDirection(Math.abs(v[0]) >= Math.abs(v[1]) ? (v[0] < 0 ? 4 : 6) : (v[1] < 0 ? 8 : 2));
        const slow = tired() ? 2 : 1;   // tired out (below TIRED_AT): the roll takes twice as long, as far (the user's, 2026-09-25)
        act.mode = "roll";
        act.rollT = 0;
        act.rollLen = ROLL.frames * slow;
        act.rollDist = 0;
        act.iframes = rollIFrames();
        act.rolls = second ? 2 : 1;
        act.queuedRoll = false;
        act.combatT = Math.max(act.combatT, 300);
        if (ROLL_KIND >= 0) $gamePlayer.startToolSwing(ROLL_KIND, null, null, slow > 1 ? { rate: 1 / slow } : undefined);
        AudioManager.playSe({ name: "Evasion1", volume: 70, pitch: 110, pan: 0 });
        return true;
    }
    const easeOut = x => 1 - (1 - x) * (1 - x);
    // ROLL_INTO: how straight at a body the roll must head to hit it (cosine); BUMP: the part of an animal's attack its body deals,
    // how far he bounces back (tiles), how long he stays shaken (frames)
    const ROLL_INTO = 0.5, BUMP = { part: 0.4, back: 0.8, stun: 18 };
    // true when the roll heads at the point (x, y) (tiles) - rolling into it, not out of its way
    function rollingInto(x, y) {
        if (act.mode !== "roll") return false;
        const dx = x - px(), dy = y - py(), d = Math.hypot(dx, dy) || 1;
        return (dx * act.rollDir[0] + dy * act.rollDir[1]) / d > ROLL_INTO;
    }
    // the roll runs into an animal's body: it stops, he bounces off (and a boar's or a wolf's body hurts)
    function rollBump() {
        if (!window.Hunting) return false;
        for (const a of Hunting.animals) {
            if (a._dead || a.isJumping()) continue;
            const sp = Hunting.SPECIES[a.kind()] || {}, reach = (sp.radius || 0.5) + 0.35;
            if (Math.hypot(a.centerX() - px(), a.centerY() - py()) > reach || !rollingInto(a.centerX(), a.centerY())) continue;
            if (a._mode === "charge" && Hunting.gore) { Hunting.gore(a); return true; }   // (into a charging boar: its whole charge, see hitPlayer)
            act.mode = "idle";
            act.iframes = 0;
            endSwing();
            shovePlayer(-act.rollDir[0] * BUMP.back, -act.rollDir[1] * BUMP.back);
            act.hitFrom = [-act.rollDir[0], -act.rollDir[1]];
            sparksAt((px() + a.centerX()) / 2, (py() + a.centerY()) / 2 - 0.3, "#e8e8e8", 6);
            const actor = $gameParty.leader();
            if (sp.aggressive && actor && Hunting.atkOf) {
                applyDamage(actor, Math.max(1, Math.round(Hunting.atkOf(a) * BUMP.part)));
                AudioManager.playSe({ name: "Damage3", volume: 80, pitch: 110, pan: 0 });
                $gameScreen.startShake(3, 8, 10);
                stunPlayer(BUMP.stun, "stagger");
                numberAt(px(), py() - 1.35, "Odbity!", "#ffb07f", 0.8);
            } else {
                AudioManager.playSe({ name: "Blow1", volume: 60, pitch: 120, pan: 0 });
                act.flinchT = 10; act.flinchLen = 10;
            }
            hitstop(4);
            act.rollCd = ROLL.chain;
            return true;
        }
        return false;
    }
    function updateRoll() {
        act.rollT++;
        const tw = $gameMap.tileWidth();
        const want = ROLL.dist * easeOut(Math.min(1, act.rollT / act.rollLen));
        const step = want - act.rollDist;
        act.rollDist = want;
        if (rollBump()) return;
        shovePlayer(act.rollDir[0] * step, act.rollDir[1] * step);
        if (act.iframes > 0) act.iframes--;
        if (act.rollT >= act.rollLen) {
            endSwing();
            act.mode = "idle";
            act.rollCd = ROLL.chain;
            if (act.queuedRoll) { act.queuedRoll = false; startRoll(); }
        }
        void tw;
    }
    // the hero pushed by (dx, dy) tiles through FreeMovement's collision (a roll, a knock back); tile mode: a jump
    function shovePlayer(dx, dy) {
        const p = $gamePlayer;
        if (!p.isFreeMoving || !p.isFreeMoving() || typeof p.freeAxis !== "function") return;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        p._shoveAccX = (p._shoveAccX || 0) + dx * tw;
        p._shoveAccY = (p._shoveAccY || 0) + dy * th;
        const sx = Math.trunc(p._shoveAccX), sy = Math.trunc(p._shoveAccY);
        p._shoveAccX -= sx;
        p._shoveAccY -= sy;
        const s = { fx: Math.round(p._realX * tw), fy: Math.round(p._realY * th), moved: false, bump: null };
        if (sx) p.freeAxis(s, sx, 0, false);
        if (sy) p.freeAxis(s, 0, sy, false);
        if (!s.moved) return;
        p._realX = s.fx / tw;
        p._realY = s.fy / th;
        const x = $gameMap.roundX(Math.floor((s.fx + tw / 2) / tw)), y = $gameMap.roundY(Math.floor((s.fy + th / 2) / th));
        if (x !== p._x || y !== p._y) { p._x = x; p._y = y; p.freeEnteredTile(); }
    }

    // The combat keys are read as "pressed now, not a frame before" rather than with Input.isTriggered, which only knows the one
    // key pressed last: Space pressed in the same frame as an arrow (rolling that way) would be lost.
    const keyWas = {};
    function pressedNow(name) {
        const now = Input.isPressed(name), was = !!keyWas[name];
        keyWas[name] = now;
        return now && !was;
    }
    // the block key held: guarding (slower walk); a hit taken within parryWindow() frames of raising the guard is parried
    function updateBlock() {
        const held = Input.isPressed("block"), fresh = pressedNow("block");
        if (act.mode === "block") {
            if (!held || act.stun > 0) { act.mode = "idle"; return; }
            act.blockT++;
            act.combatT = Math.max(act.combatT, 120);
            return;
        }
        if (held && act.mode === "idle" && act.stun === 0 && canAct()) {
            act.mode = "block";
            act.blockT = fresh ? 0 : 99;   // (a guard kept up from before is no parry)
        }
    }
    const _Game_Player_realMoveSpeed = Game_Player.prototype.realMoveSpeed;
    Game_Player.prototype.realMoveSpeed = function() {
        let s = _Game_Player_realMoveSpeed.call(this);
        if (this === $gamePlayer && tired()) s -= 1;   // (tired out: half the speed, walking and running - the speed is a power of two)
        if (this === $gamePlayer && (act.mode === "block" || winded)) return Math.max(2, s - 1);
        return s;
    };
    // he says it when the strength drops below TIRED_AT (again only after it has been above it)
    let wasTired = false;
    function updateTired() {
        const now = tired();
        if (now && !wasTired && window.SpeechBubbles) SpeechBubbles.say($gamePlayer, "Zmęczyłem się...");
        wasTired = now;
    }
    const _Game_Player_canMove = Game_Player.prototype.canMove;
    Game_Player.prototype.canMove = function() {
        if (this === $gamePlayer && (act.mode === "roll" || act.stun > 0)) return false;
        return _Game_Player_canMove.call(this);
    };
    // the running shoes stay off while guarding, and without breath or strength (updateRun)
    const _Game_Player_isDashing = Game_Player.prototype.isDashing;
    Game_Player.prototype.isDashing = function() {
        return act.mode !== "block" && (this !== $gamePlayer || canRun()) && _Game_Player_isDashing.call(this);
    };

    // ==================================================================
    // Taking a hit: what an enemy's attack does to the hero. opts: { damage, poise, from: { x, y } (tiles), attacker (the animal),
    // name, unblockable, unparryable, wound (0..1), knock (tiles) } -> "dodged" | "parried" | "blocked" | "guardbreak" | "hit"
    // ==================================================================
    function hitPlayer(opts) {
        const actor = $gameParty.leader();
        if (!actor || actor.isDead()) return "hit";
        act.combatT = 600;
        const from = opts.from || { x: px(), y: py() + 1 };
        let into = false;   // rolled straight at the attacker: no safety, the blow lands in full and throws him back harder
        if (act.iframes > 0) {
            if (!rollingInto(from.x, from.y)) {
                numberAt(px(), py() - 1.1, "Unik", "#bfe3ff", 0.8);
                AudioManager.playSe({ name: "Evasion2", volume: 60, pitch: 120, pan: 0 });
                return "dodged";
            }
            into = true;
            act.iframes = 0;
            act.mode = "idle";
            act.rollCd = ROLL.chain;
            numberAt(px(), py() - 1.35, "Odbity!", "#ffb07f", 0.8);
        }
        const ax = from.x - px(), ay = from.y - py(), ad = Math.hypot(ax, ay) || 1, [fx, fy] = facingVec();
        const frontal = (ax * fx + ay * fy) / ad > 0.25;
        let damage = opts.damage || 0, poise = opts.poise || 0;
        if (act.mode === "block" && frontal) {
            if (!opts.unparryable && act.blockT <= parryWindow()) {
                AudioManager.playSe({ name: "Parry", volume: 90, pitch: 100, pan: 0 });
                sparksAt((px() + from.x) / 2, (py() + from.y) / 2 - 0.4, "#fff2b0", 14);
                numberAt(px(), py() - 1.2, "Parowanie!", "#fff2b0", 0.9);
                if (opts.attacker && typeof opts.attacker.onParried === "function") opts.attacker.onParried();
                if (hasSkill("riposte")) act.riposteT = 120;
                hitstop(9);
                return "parried";
            }
            if (!opts.unblockable) {
                const sh = shield() || NO_SHIELD;
                damage = Math.round(damage * (1 - Math.min(0.9, sh.reduce + perk("block.reduce"))));
                if (sh.id && window.Durability) Durability.use(sh.id);   // (every blow taken on it wears the shield; a parry does not)
                breath = Math.max(0, breathNow() - poise * sh.breath * (hasSkill("guard") ? 0.6 : 1));
                breathSpent = 0;
                AudioManager.playSe({ name: "Blow3", volume: 80, pitch: 110, pan: 0 });
                sparksAt((px() + from.x) / 2, (py() + from.y) / 2 - 0.4, "#e8e8e8", 8);
                shovePlayer(-ax / ad * 0.35, -ay / ad * 0.35);
                if (breath <= 0) {
                    winded = true;
                    numberAt(px(), py() - 1.2, "Garda przełamana!", "#ff9f8f", 0.85);
                    stunPlayer(40, "guard");
                    applyDamage(actor, damage);
                    return "guardbreak";
                }
                if (damage > 0) applyDamage(actor, damage);
                hitstop(4);
                return "blocked";
            }
        }
        // a clean hit
        endSwing();
        if (act.mode === "attack" || act.mode === "block") act.mode = "idle";
        applyDamage(actor, damage);
        AudioManager.playSe({ name: "Damage3", volume: 90, pitch: 95, pan: 0 });
        $gameScreen.startShake(Math.min(9, 3 + damage / 10), 8, 14);
        $gameScreen.startFlash([255, 40, 30, 110], 12);
        const knock = (opts.knock !== undefined ? opts.knock : 0.5) + (into ? 0.7 : 0);
        if (knock > 0) shovePlayer(-ax / ad * knock, -ay / ad * knock);
        act.hitFrom = [-ax / ad, -ay / ad];   // (the way the blow pushes him: his flinch leans that way)
        if (poise >= knockdownAt()) stunPlayer(50, "down");
        else if (poise > 10) stunPlayer(18, "stagger");
        else { act.flinchT = 10; act.flinchLen = 10; }   // (a light hit: only the flinch, he keeps control)
        if (opts.wound && Math.random() < woundChance(opts.wound) && typeof $gameSystem.injure === "function") {
            $gameSystem.injure(0);
            const bandage = $dataItems[152];
            popup(bandage ? bandage.iconIndex : 0, "Jesteś ranny" + (opts.name ? " (" + opts.name + ")" : "") + " - opatrunek zatamuje krew", "#ff8f7f");
        }
        if (!act.secondWind && hasSkill("secondwind") && actor.hp > 0 && actor.hp < actor.mhp * 0.3) {
            act.secondWind = true;
            breath = maxBreath();
            winded = false;
            numberAt(px(), py() - 1.4, "Drugi oddech!", "#9ff0a8", 0.9);
            AudioManager.playSe({ name: "Heal2", volume: 70, pitch: 110, pan: 0 });
        }
        hitstop(6);
        return "hit";
    }
    function applyDamage(actor, damage) {
        if (!(damage > 0)) return;
        damage = Math.max(1, Math.round(damage * (1 - Math.min(0.6, perk("hurt")))));   // (Niezłomny)
        actor.gainHp(-damage);
        numberAt(px(), py() - 1.0, "-" + damage, "#ff6b5e");
        act.hurtT = 18;
    }
    function stunPlayer(frames, kind) {
        endSwing();
        act.mode = "idle";
        act.stun = Math.max(act.stun, frames);
        act.stunKind = kind;
        if (kind === "stagger") { act.flinchT = frames; act.flinchLen = frames; }
        if (kind === "down" && KNOCK_KIND >= 0) $gamePlayer.startToolSwing(KNOCK_KIND, null, null);   // (he falls, lies a moment, gets up)
    }

    // ==================================================================
    // Feedback: hitstop, damage numbers, sparks, the enemies' bars
    // ==================================================================
    let stopFrames = 0;
    function hitstop(n) { stopFrames = Math.max(stopFrames, n); }
    const _Scene_Map_updateMain = Scene_Map.prototype.updateMain;
    Scene_Map.prototype.updateMain = function() {
        if (stopFrames > 0) {   // the world holds still a moment when a blow lands (the screen effects go on)
            stopFrames--;
            $gameScreen.update();
            return;
        }
        _Scene_Map_updateMain.call(this);
    };

    function popup(icon, text, color) {
        if (window.Survival && Survival.feedback) Survival.feedback(icon, text, color);
        else $gameTemp.pushLootPopup(icon, text, color);
    }
    // a floating number / word at a map point (tiles)
    const floaters = [];
    function numberAt(x, y, text, color, scale) {
        floaters.push({ x, y, text: String(text), color: color || "#ffffff", t: 0, scale: scale || 1, sprite: null });
    }
    const sparks = [];
    function sparksAt(x, y, color, n) {
        for (let i = 0; i < (n || 8); i++) {
            const a = Math.random() * Math.PI * 2, v = 0.02 + Math.random() * 0.05;
            sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.02, t: 0, life: 14 + Math.floor(Math.random() * 10), color: color || "#ffffff", sprite: null });
        }
    }

    // ---- what the enemies' hits look like when they land on an enemy (Hunting.js calls it from hit())
    function enemyHurtFx(animal, damage, how, extra) {
        const x = animal.centerX(), y = animal.centerY();
        extra = extra || {};
        const color = extra.tag === "sneak" ? "#9ff0a8" : extra.tag === "execute" ? "#ff9f40" : extra.crit ? "#ffe066" : extra.heavy ? "#ffc080" : "#ffffff";
        const label = extra.tag === "sneak" ? " z ukrycia!" : extra.tag === "execute" ? " dobicie!" : extra.crit ? "!" : "";
        numberAt(x, y - 0.9, damage + label, color, extra.heavy || extra.crit ? 1.2 : 1);
        sparksAt(x, y - 0.3, "#b8322a", extra.heavy ? 12 : 7);
        animal._flashT = 8;
    }

    // ==================================================================
    // Sprites: on the tilemap (the numbers, sparks, the bars of the enemies, the breath under the hero, the shield) and on the screen
    // (the weapon in hand, the level banner)
    // ==================================================================
    function textBitmap(text, color, size) {
        const w = Math.max(24, Math.ceil(text.length * size * 0.62) + 12), bmp = new Bitmap(w, size + 12);
        bmp.fontSize = size;
        bmp.fontBold = true;
        bmp.outlineColor = "rgba(0,0,0,0.95)";
        bmp.outlineWidth = 5;
        bmp.textColor = color;
        bmp.drawText(text, 0, 0, w, size + 12, "center");
        return bmp;
    }
    const ENEMY_BAR_W = 42;
    function levelColor(level) {
        const d = level - hero().level;
        return d <= -4 ? "#8b9097" : d <= 1 ? "#eceef0" : d <= 3 ? "#ffa64a" : "#ff4b3e";
    }
    function drawEnemyBar(bmp, a) {
        const U = window.UIStyle || {};
        bmp.clear();
        const ctx = bmp.context, hp = Math.max(0, a._hp / (a._maxHp || 1)), po = a._maxPoise ? Math.max(0, a._poise / a._maxPoise) : 0;
        const x = 18, w = ENEMY_BAR_W;
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.fillRect(x - 1, 1, w + 2, 9);
        ctx.fillStyle = "#3a1614";
        ctx.fillRect(x, 2, w, 4);
        ctx.fillStyle = a._stun > 0 ? "#ff9f40" : "#e5484d";
        ctx.fillRect(x, 2, Math.round(w * hp), 4);
        ctx.fillStyle = "#2c2a18";
        ctx.fillRect(x, 7, w, 2);
        ctx.fillStyle = U.accent || "#ffd23f";
        ctx.fillRect(x, 7, Math.round(w * po), 2);
        if (a._level) {   // the level, coloured by how it compares with the hero's
            const lv = a._level, c = levelColor(lv), strong = lv - hero().level >= 4;
            ctx.fillStyle = "rgba(0,0,0,0.8)";
            ctx.fillRect(0, 0, 16, 11);
            bmp.fontSize = 11;
            bmp.fontBold = true;
            bmp.outlineWidth = 0;
            bmp.textColor = c;
            bmp.drawText(strong ? "☠" : String(lv), 0, -1, 16, 13, "center");
        }
        bmp._baseTexture.update();
    }
    // a hostile or hurt animal shows its bars (a calm deer grazing does not)
    function showsBar(a) {
        if (a._dead || !a._maxHp) return false;
        if (a._hp < a._maxHp || a._stun > 0) return true;
        return !!a._engaged && Math.hypot(a.centerX() - px(), a.centerY() - py()) < 12;
    }

    function Sprite_CombatLayer() {
        this.initialize(...arguments);
    }
    Sprite_CombatLayer.prototype = Object.create(Sprite.prototype);
    Sprite_CombatLayer.prototype.constructor = Sprite_CombatLayer;
    Sprite_CombatLayer.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.z = 8;
        this._breath = new Sprite(new Bitmap(46, 8));
        this._breath.anchor.set(0.5, 0);
        this._breath.opacity = 0;
        this.addChild(this._breath);
        this._breathKey = "";
        this._shield = new Sprite();
        this._shield.anchor.set(0.5, 0.5);
        this._shield.visible = false;
        this.addChild(this._shield);
        this._bars = new Map();
    };
    const toScreenX = x => Math.round($gameMap.adjustX(x - 0.5) * $gameMap.tileWidth() + $gameMap.tileWidth() / 2);
    const toScreenY = y => Math.round($gameMap.adjustY(y - 0.5) * $gameMap.tileHeight() + $gameMap.tileHeight() / 2);
    Sprite_CombatLayer.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this.updateTrails();
        this.updateFloaters();
        this.updateSparks();
        this.updateBreath();
        this.updateShield();
        this.updateBars();
    };
    // an animal rushing flat out (a boar on its locked line): TRAIL.n fading afterimages of its own sprite a few frames behind it
    // (under the characters), and dust from the hooves; when it stops they fade away
    const TRAIL = { n: 4, gap: 2, alpha: [160, 120, 80, 45], dust: 4 };
    Sprite_CombatLayer.prototype.updateTrails = function() {
        if (!this._trails) this._trails = new Map();
        const map = this.parent, tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const ox = $gameMap.displayX() * tw, oy = $gameMap.displayY() * th;
        const animals = window.Hunting ? Hunting.animals : [];
        for (const a of animals) {
            const sp = a._sprite, rushing = typeof a.isRushing === "function" && a.isRushing() && sp && sp.parent === map;
            let tr = this._trails.get(a);
            if (!tr && !rushing) continue;
            if (!tr) { tr = { hist: [], ghosts: [], t: 0 }; this._trails.set(a, tr); }
            if (rushing) {
                tr.hist.unshift({ x: sp.x + ox, y: sp.y + oy, frame: sp._frame.clone(), bitmap: sp.bitmap, sx: sp.scale.x, sy: sp.scale.y });
                if (++tr.t % TRAIL.dust === 0 && !a.isJumping()) sparksAt(a.centerX(), a.centerY() + 0.4, "#9c8260", 3);   // (no dust in the air: a leaping wolf)
            } else tr.hist.unshift(null);   // (it stopped: the trail runs out)
            tr.hist.length = Math.min(tr.hist.length, TRAIL.n * TRAIL.gap + 1);
            for (let i = 0; i < TRAIL.n; i++) {
                let g = tr.ghosts[i];
                if (!g) {
                    g = new Sprite();
                    g.anchor.set(0.5, 1);
                    g.setBlendColor([255, 248, 230, 45]);
                    map.addChild(g);
                    tr.ghosts[i] = g;
                }
                const h = tr.hist[(i + 1) * TRAIL.gap];
                g.visible = !!h && !!sp;
                if (!g.visible) continue;
                if (g.bitmap !== h.bitmap) g.bitmap = h.bitmap;
                g.setFrame(h.frame.x, h.frame.y, h.frame.width, h.frame.height);
                g.x = Math.round(h.x - ox);
                g.y = Math.round(h.y - oy);
                g.scale.set(h.sx, h.sy);
                g.opacity = TRAIL.alpha[i];
                g.z = sp.z - 0.1;   // (under every character: an afterimage never covers the boar or the hero)
                g.spriteId = sp.spriteId - 1 - i;
            }
            if (tr.hist.every(h => !h) || !animals.includes(a)) this.dropTrail(a, tr);
        }
        for (const [a, tr] of this._trails) if (!animals.includes(a) || a._dead) this.dropTrail(a, tr);
    };
    Sprite_CombatLayer.prototype.dropTrail = function(a, tr) {
        for (const g of tr.ghosts) { if (g.parent) g.parent.removeChild(g); g.destroy(); }
        this._trails.delete(a);
    };
    Sprite_CombatLayer.prototype.updateFloaters = function() {
        for (const f of floaters) {
            if (!f.sprite) {
                f.sprite = new Sprite(textBitmap(f.text, f.color, Math.round(20 * f.scale)));
                f.sprite.anchor.set(0.5, 1);
                this.addChild(f.sprite);
            }
            f.t++;
            const k = f.t / 50;
            f.sprite.x = toScreenX(f.x);
            f.sprite.y = toScreenY(f.y) - Math.round(26 * easeOut(Math.min(1, k * 1.6)));
            f.sprite.opacity = k < 0.6 ? 255 : Math.round(255 * (1 - (k - 0.6) / 0.4));
            const pop = f.t < 6 ? 1 + (6 - f.t) * 0.08 : 1;
            f.sprite.scale.set(pop, pop);
        }
        for (const f of floaters.filter(f => f.t >= 50)) { this.removeChild(f.sprite); f.sprite.destroy(); }
        floaters.splice(0, floaters.length, ...floaters.filter(f => f.t < 50));
    };
    Sprite_CombatLayer.prototype.updateSparks = function() {
        for (const s of sparks) {
            if (!s.sprite) {
                const bmp = new Bitmap(3, 3);
                bmp.fillRect(0, 0, 3, 3, s.color);
                s.sprite = new Sprite(bmp);
                s.sprite.anchor.set(0.5, 0.5);
                this.addChild(s.sprite);
            }
            s.t++;
            s.x += s.vx;
            s.y += s.vy;
            s.vy += 0.004;
            s.sprite.x = toScreenX(s.x);
            s.sprite.y = toScreenY(s.y);
            s.sprite.opacity = Math.round(255 * (1 - s.t / s.life));
        }
        for (const s of sparks.filter(s => s.t >= s.life)) { this.removeChild(s.sprite); s.sprite.destroy(); }
        sparks.splice(0, sparks.length, ...sparks.filter(s => s.t < s.life));
    };
    // the breath: a thin bar under the hero's feet, only in a fight or while it is not full
    Sprite_CombatLayer.prototype.updateBreath = function() {
        const m = maxBreath(), b = breathNow(), show = act.combatT > 0 || b < m - 0.5;
        const s = this._breath;
        s.opacity = show ? Math.min(255, s.opacity + 25) : Math.max(0, s.opacity - 12);
        if (s.opacity <= 0) return;
        s.x = toScreenX(px());
        s.y = toScreenY(py()) + Math.round($gameMap.tileHeight() * 0.5) + 2;
        const flash = winded && Math.floor(Graphics.frameCount / 8) % 2 === 0;
        const key = Math.round(b) + ":" + m + ":" + (winded ? (flash ? "a" : "b") : "-");
        if (key === this._breathKey) return;
        this._breathKey = key;
        const bmp = s.bitmap, ctx = bmp.context, w = 42;
        bmp.clear();
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(1, 1, w + 2, 6);
        ctx.fillStyle = "#16303a";
        ctx.fillRect(2, 2, w, 4);
        ctx.fillStyle = winded ? (flash ? "#ff6b5e" : "#a0443a") : "#8fe3ff";
        ctx.fillRect(2, 2, Math.round(w * b / m), 4);
        bmp._baseTexture.update();
    };
    // the shield (its icon) in front of the hero while he guards
    Sprite_CombatLayer.prototype.updateShield = function() {
        const s = this._shield, on = act.mode === "block";
        s.visible = on && $gamePlayer.direction() !== 8;
        if (!s.visible) return;
        const sh = shield(), icon = sh ? $dataItems[sh.id].iconIndex : 0;
        if (s._icon !== icon) {
            s._icon = icon;
            const bmp = new Bitmap(32, 32);
            if (icon) {
                const set = ImageManager.loadSystem("IconSet");
                const draw = () => { bmp.blt(set, (icon % 16) * 32, Math.floor(icon / 16) * 32, 32, 32, 0, 0); };
                if (set.isReady()) draw(); else set.addLoadListener(draw);
            } else {   // guarding with the weapon: a pale arc
                const ctx = bmp.context;
                ctx.strokeStyle = "rgba(230,240,255,0.8)";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(16, 22, 13, Math.PI * 1.15, Math.PI * 1.85);
                ctx.stroke();
                bmp._baseTexture.update();
            }
            s.bitmap = bmp;
        }
        const d = $gamePlayer.direction(), off = { 2: [0, -18], 4: [-15, -24], 6: [15, -24] }[d] || [0, -18];
        s.x = toScreenX(px()) + off[0];
        s.y = toScreenY(py()) + off[1];
        s.scale.set(d === 2 ? 0.8 : 0.55, 0.8);
        s.opacity = act.blockT <= parryWindow() ? 255 : 215;
    };
    Sprite_CombatLayer.prototype.updateBars = function() {
        const animals = window.Hunting ? Hunting.animals : [];
        const seen = new Set();
        for (const a of animals) {
            if (!showsBar(a)) continue;
            seen.add(a);
            let e = this._bars.get(a);
            if (!e) {
                e = { sprite: new Sprite(new Bitmap(ENEMY_BAR_W + 22, 12)), key: "" };
                e.sprite.anchor.set(0.5, 1);
                this.addChild(e.sprite);
                this._bars.set(a, e);
            }
            const key = Math.round(a._hp) + ":" + Math.round(a._poise || 0) + ":" + (a._stun > 0 ? 1 : 0) + ":" + a._level + ":" + hero().level;
            if (key !== e.key) { e.key = key; drawEnemyBar(e.sprite.bitmap, a); }
            const sprite = a._sprite, top = sprite && sprite.bitmap && sprite.bitmap.isReady() ? sprite.patternHeight() : 48;
            e.sprite.x = toScreenX(a.centerX()) - 9;
            e.sprite.y = toScreenY(a.centerY()) + Math.round($gameMap.tileHeight() / 2) - Math.min(top, 70) - 6 - (a.jumpHeight ? a.jumpHeight() : 0);
        }
        for (const [a, e] of this._bars) {
            if (seen.has(a)) continue;
            this.removeChild(e.sprite);
            e.sprite.destroy();
            this._bars.delete(a);
        }
    };

    // the weapon in hand, a small plate in the bottom right corner ([ and ] switch) - shown only in the combat mode (user)
    function Sprite_WeaponPlate() {
        this.initialize(...arguments);
    }
    Sprite_WeaponPlate.prototype = Object.create(Sprite.prototype);
    Sprite_WeaponPlate.prototype.constructor = Sprite_WeaponPlate;
    Sprite_WeaponPlate.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this, new Bitmap(230, 38));
        this.anchor.set(1, 1);
        this._key = null;
    };
    Sprite_WeaponPlate.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this.x = Graphics.width - 14;
        this.y = Graphics.height - 14;
        const h = $gameSystem ? hand() : null;
        this.visible = !!h && combatMode() && !$gameMessage.isBusy() && !$gameTemp._farmMenuOpen;   // (only in the combat mode)
        if (!h || h === this._key) return;
        const set = ImageManager.loadSystem("IconSet");
        if (!set.isReady()) return;
        this._key = h;
        const bmp = this.bitmap, ctx = bmp.context, U = window.UIStyle;
        bmp.clear();
        if (U) U.panel(ctx, 0, 0, bmp.width, bmp.height, { cut: 4 });
        else { ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(0, 0, bmp.width, bmp.height); }
        const id = h[0] === "m" ? Number(h.slice(1)) : (has(126) ? 126 : 125), icon = handIcon(h);
        bmp.blt(set, (icon % 16) * 32, Math.floor(icon / 16) * 32, 32, 32, 4, 3);
        bmp.fontSize = 17;
        bmp.textColor = (U && U.text) || "#eceef0";
        bmp.outlineColor = "rgba(0,0,0,0.9)";
        bmp.outlineWidth = 3;
        bmp.drawText(h[0] === "m" ? MELEE[id].name : "Łuk / proca", 40, 0, 150, 38, "left");
        bmp.textColor = (U && U.muted) || "#9aa0a8";
        bmp.drawText("[ ]", bmp.width - 40, 0, 32, 38, "center");
    };
    // the level and the experience: a slim plate over the weapon plate (in its place when there is no weapon); it lights up when
    // experience comes, and shows a yellow "P" while there are points to give out (menu P -> Postać)
    const XP_W = 230, XP_H = 24;
    function Sprite_XpBar() {
        this.initialize(...arguments);
    }
    Sprite_XpBar.prototype = Object.create(Sprite.prototype);
    Sprite_XpBar.prototype.constructor = Sprite_XpBar;
    Sprite_XpBar.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this, new Bitmap(XP_W, XP_H));
        this.anchor.set(1, 1);
        this._key = "";
        this._glow = 0;
        this._lastXp = -1;
    };
    Sprite_XpBar.prototype.update = function() {
        Sprite.prototype.update.call(this);
        if (!$gameSystem) return;
        const h = hero(), plate = SceneManager._scene && SceneManager._scene._weaponPlate;
        this.visible = !$gameMessage.isBusy() && !$gameTemp._farmMenuOpen;
        this.x = Graphics.width - 14;
        this.y = Graphics.height - 14 - (plate && plate.visible ? plate.height + 6 : 0);
        const total = h.level * 100000 + h.xp;
        if (this._lastXp >= 0 && total > this._lastXp) this._glow = 40;
        this._lastXp = total;
        if (this._glow > 0) this._glow--;
        const key = h.level + ":" + h.xp + ":" + unspent() + ":" + Math.ceil(this._glow / 4);
        if (key !== this._key) { this._key = key; this.redraw(); }
    };
    Sprite_XpBar.prototype.redraw = function() {
        const bmp = this.bitmap, ctx = bmp.context, U = window.UIStyle, h = hero(), top = h.level >= MAX_LEVEL;
        bmp.clear();
        if (U) U.panel(ctx, 0, 0, XP_W, XP_H, { cut: 3, accent: false });
        else { ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(0, 0, XP_W, XP_H); }
        bmp.fontSize = 15;
        bmp.outlineColor = "rgba(0,0,0,0.9)";
        bmp.outlineWidth = 3;
        bmp.textColor = (U && U.text) || "#eceef0";
        bmp.drawText("Poz. " + h.level, 7, 0, 60, XP_H, "left");
        const points = unspent(), bx = 62, bw = XP_W - bx - (points > 0 ? 30 : 10), ratio = top ? 1 : h.xp / xpToNext(h.level);
        const glow = this._glow / 40;
        const fill = glow > 0 ? "rgb(" + Math.round(170 + 85 * glow) + "," + Math.round(130 + 110 * glow) + ",255)" : "#a97cf0";
        if (U) U.bar(ctx, bx, 9, bw, 6, ratio, fill);
        else { ctx.fillStyle = "#16181c"; ctx.fillRect(bx, 9, bw, 6); ctx.fillStyle = fill; ctx.fillRect(bx, 9, Math.round(bw * ratio), 6); }
        if (points > 0) {   // points to give out: a small yellow "P" (the menu key)
            const ax = XP_W - 24;
            ctx.fillStyle = (U && U.accent) || "#ffd23f";
            ctx.fillRect(ax, 4, 17, 16);
            bmp.fontSize = 14;
            bmp.outlineWidth = 0;
            bmp.textColor = "#101216";
            bmp.drawText("P", ax, 1, 17, 22, "center");
        }
        bmp._baseTexture.update();
    };
    // "Tryb walki" at the top centre of the screen while the combat mode is on, pulsing slowly (MODE_PULSE frames a beat)
    function Sprite_ModeBadge() {
        this.initialize(...arguments);
    }
    Sprite_ModeBadge.prototype = Object.create(Sprite.prototype);
    Sprite_ModeBadge.prototype.constructor = Sprite_ModeBadge;
    Sprite_ModeBadge.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this, new Bitmap(170, 30));
        const bmp = this.bitmap, U = window.UIStyle;
        if (U) U.panel(bmp.context, 0, 0, 170, 30, { cut: 4 });
        bmp.fontSize = 17;
        bmp.textColor = "#ffb07f";
        bmp.outlineColor = "rgba(0,0,0,0.9)";
        bmp.outlineWidth = 3;
        bmp.drawText("Tryb walki", 0, 0, 170, 30, "center");
        this.anchor.set(0.5, 0);
        this.visible = false;
    };
    const MODE_PULSE = 84;
    Sprite_ModeBadge.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this.visible = combatMode() && !$gameMessage.isBusy();
        this.x = Graphics.width / 2;
        this.y = 14;
        this.opacity = Math.round(165 + 90 * Math.cos(Graphics.frameCount * 2 * Math.PI / MODE_PULSE));   // (75..255)
    };
    // "Poziom N!" across the top of the screen for a few seconds
    function Sprite_LevelBanner() {
        this.initialize(...arguments);
    }
    Sprite_LevelBanner.prototype = Object.create(Sprite.prototype);
    Sprite_LevelBanner.prototype.constructor = Sprite_LevelBanner;
    Sprite_LevelBanner.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this, new Bitmap(560, 86));
        this.anchor.set(0.5, 0);
        this.opacity = 0;
        this._shown = 0;
    };
    Sprite_LevelBanner.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this.x = Graphics.width / 2;
        this.y = 70;
        if (!levelBanner) { this.opacity = 0; return; }
        if (this._shown !== levelBanner.level) {
            this._shown = levelBanner.level;
            const bmp = this.bitmap, ctx = bmp.context, U = window.UIStyle;
            bmp.clear();
            if (U) U.panel(ctx, 0, 0, bmp.width, bmp.height, { cut: 8, fill: "rgba(12,13,17,0.94)" });
            bmp.fontSize = 34;
            bmp.textColor = (U && U.accent) || "#ffd23f";
            bmp.outlineColor = "rgba(0,0,0,0.9)";
            bmp.outlineWidth = 4;
            bmp.drawText("Poziom " + levelBanner.level + "!", 0, 6, bmp.width, 44, "center");
            bmp.fontSize = 18;
            bmp.textColor = (U && U.text) || "#eceef0";
            bmp.drawText("+" + POINTS_PER_LEVEL + " punkty atrybutów, +" + SKILL_POINTS_PER_LEVEL + " punkt umiejętności  ·  menu P → Postać", 0, 48, bmp.width, 28, "center");
        }
        levelBanner.t++;
        const t = levelBanner.t;
        this.opacity = t < 20 ? t * 13 : t < 220 ? 255 : Math.max(0, 255 - (t - 220) * 8);
        if (t > 260) levelBanner = null;
    };

    const _Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        _Spriteset_Map_createCharacters.call(this);
        this._combatLayer = new Sprite_CombatLayer();
        this._tilemap.addChild(this._combatLayer);
        for (const f of floaters) f.sprite = null;
        for (const s of sparks) s.sprite = null;
    };
    const _Scene_Map_createSpriteset = Scene_Map.prototype.createSpriteset;
    Scene_Map.prototype.createSpriteset = function() {
        _Scene_Map_createSpriteset.call(this);
        this._weaponPlate = new Sprite_WeaponPlate();
        this.addChild(this._weaponPlate);
        this._xpBar = new Sprite_XpBar();
        this.addChild(this._xpBar);
        this._modeBadge = new Sprite_ModeBadge();
        this.addChild(this._modeBadge);
        this._levelBanner = new Sprite_LevelBanner();
        this.addChild(this._levelBanner);
    };

    // the hero's sprite: a white flash when hurt; without a roll sheet the roll turns the figure over
    const _Sprite_Character_update = Sprite_Character.prototype.update;
    Sprite_Character.prototype.update = function() {
        _Sprite_Character_update.call(this);
        if (this._character === $gamePlayer) {
            const tint = act.hurtT > 0 ? [255, 60, 50, Math.round(act.hurtT * 9)] : act.stun > 0 && act.stunKind === "down" && KNOCK_KIND < 0 ? [40, 40, 60, 90] : null;
            if (tint) { this.setBlendColor(tint); this._combatTint = true; } else if (this._combatTint) { this.setBlendColor([0, 0, 0, 0]); this._combatTint = false; }
            if (act.flinchT > 0 && !$gamePlayer._toolSwing) {   // hit: he leans away from the blow on his feet, sinks a little, straightens up
                const e = Math.sin((1 - act.flinchT / act.flinchLen) * Math.PI), [hx, hy] = act.hitFrom || [0, 1];
                this.rotation = (Math.abs(hx) > 0.3 ? Math.sign(hx) : ($gamePlayer.direction() === 4 ? -1 : 1) * 0.5) * 0.3 * e;
                this.x += Math.round(hx * 5 * e);
                this.y += Math.round(hy * 3 * e);
                this.scale.y = 1 - 0.1 * e;
                this._flinching = true;
            } else if (this._flinching) {
                this._flinching = false;
                this.rotation = 0;
                this.scale.y = 1;
            }
            if (act.mode === "roll" && ROLL_KIND < 0) {   // (no sheet: the figure spins over once)
                const k = act.rollT / act.rollLen, side = act.rollDir[0] < 0 ? -1 : 1;
                this.rotation = side * Math.PI * 2 * easeOut(k);
                this.anchor.y = 0.72;
                this.y -= Math.round(this.patternHeight() * 0.28);
            } else if (this.rotation !== 0 && !this._flinching && this._character === $gamePlayer) {
                this.rotation = 0;
                this.anchor.y = 1;
            }
        } else if (this._character && this._character.isAnimal) {
            const f = this._character._flashT || 0;
            if (f > 0) { this.setBlendColor([255, 255, 255, Math.round(f * 25)]); this._combatTint = true; }
            else if (this._combatTint) { this.setBlendColor([0, 0, 0, 0]); this._combatTint = false; }
            // flat out: a little longer along the run, a little lower
            const rush = typeof this._character.isRushing === "function" && this._character.isRushing();
            if (rush || this._rushScale) {
                const d = this._character.direction(), side = d === 4 || d === 6, sx = Math.sign(this.scale.x) || 1;
                this.scale.x = sx * (rush && side ? 1.1 : 1);
                this.scale.y = rush ? (side ? 0.94 : 1.08) : 1;
                this._rushScale = rush;
            }
            // reeling (its balance broken): it sways, and little stars turn over its head
            const st = this._character._stun || 0;
            if (st > 0 && !this._character._dead) {
                this.x += Math.floor(st / 3) % 2 ? 1 : -1;
                if (!this._stunStars) { this._stunStars = new Sprite(stunStarsBitmap()); this._stunStars.anchor.set(0.5, 0.5); this.addChild(this._stunStars); }
                this._stunStars.visible = true;
                this._stunStars.y = -Math.round(this.patternHeight() * 0.82);
                this._stunStars.scale.x = Math.cos(Graphics.frameCount / 7);
            } else if (this._stunStars) this._stunStars.visible = false;
        }
    };

    // ==================================================================
    // The roll sheet (ChoppableTree.js swing kinds): registered only when the picture is in the game
    // ==================================================================
    let ROLL_KIND = -1, KNOCK_KIND = -1;
    if (window.ChoppableTree && ChoppableTree.swingKindOf) { ROLL_KIND = ChoppableTree.swingKindOf("Swing_Roll"); KNOCK_KIND = ChoppableTree.swingKindOf("knockdown"); }
    // three little yellow stars in a row (turned by scale.x: they seem to circle)
    let starsBmp = null;
    function stunStarsBitmap() {
        if (starsBmp) return starsBmp;
        starsBmp = new Bitmap(34, 14);
        const ctx = starsBmp.context;
        for (const [x, y] of [[5, 8], [17, 4], [29, 8]]) {
            ctx.fillStyle = "rgba(0,0,0,0.55)";
            ctx.fillRect(x - 3, y - 1, 7, 3); ctx.fillRect(x - 1, y - 3, 3, 7);
            ctx.fillStyle = "#ffe066";
            ctx.fillRect(x - 2, y, 5, 1); ctx.fillRect(x, y - 2, 1, 5);
            ctx.fillStyle = "#fff8d0";
            ctx.fillRect(x, y, 1, 1);
        }
        starsBmp._baseTexture.update();
        return starsBmp;
    }

    // ==================================================================
    // XP sources that need watching: first items, first buildings, first visits to a map
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
    function markExisting() {   // what the hero already has / has built counts as known (an old save, a new game's start)
        const h = hero();
        for (const it of $gameParty.allItems()) if (DataManager.isItem(it)) h.firsts["i" + it.id] = true;
        const farm = $gameSystem._farm;
        for (const list of Object.values((farm && farm.buildings) || {})) for (const b of list || []) if (!b.site) h.firsts["b" + b.type] = true;
        h.seen["m" + $gameMap.mapId()] = true;
        h.ready = true;
    }
    let buildWatch = 0;
    function watchBuildings() {
        if (--buildWatch > 0) return;
        buildWatch = 90;
        const h = hero(), farm = $gameSystem._farm;
        if (!farm || !window.Farming) return;
        for (const list of Object.values(farm.buildings || {})) {
            for (const b of list || []) {
                if (b.site || h.firsts["b" + b.type]) continue;
                h.firsts["b" + b.type] = true;
                const def = Farming.BUILDINGS[b.type];
                gainXp(XP.firstBuilding, "zbudowano: " + (def ? def.name : b.type));
            }
        }
    }
    const _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function(mapId) {
        _Game_Map_setup.call(this, mapId);
        if (!$gameSystem || !$gameSystem._hero || !$gameSystem._hero.ready) return;
        const h = hero(), name = ($dataMapInfos[mapId] || {}).name || "";
        if (h.seen["m" + mapId] || mapId === 100) return;
        h.seen["m" + mapId] = true;
        gainXp(XP.map, "odkrycie: " + ($gameMap.displayName() || name));
    };
    // a goal's experience is said with the goal at the top centre (Journal.js), not in the list at the bottom right
    if (window.Journal && Journal.onGoalDone) Journal.onGoalDone(goal => {
        const got = gainXp(XP.goal, "cel: " + goal.title, true);
        return got > 0 ? { text: "+" + got + " dośw.", color: "#c9a6ff" } : null;
    });
    if (window.Hunting && Hunting.onKill) Hunting.onKill(animal => gainXp(killXp(animal.kind(), animal._level), (Hunting.SPECIES[animal.kind()] || {}).name));

    // ==================================================================
    // The map scene drives it
    // ==================================================================
    const _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
        _Scene_Map_update.call(this);
        if (!$gamePlayer || !$gameSystem) return;
        if (!hero().ready && !SceneManager.isSceneChanging()) markExisting();
        flushXpPopup();
        watchBuildings();
        updateTired();
        if (stopFrames > 0) return;
        updateBreath();
        updateRun();
        if (act.combatT > 0) act.combatT--;
        if (act.comboCd > 0) act.comboCd--;
        if (act.comboGrace > 0) act.comboGrace--;
        if (act.rollCd > 0) act.rollCd--; else act.rolls = 0;
        if (act.riposteT > 0) act.riposteT--;
        if (act.hurtT > 0) act.hurtT--;
        if (act.flinchT > 0) act.flinchT--;
        if (act.stun > 0 && --act.stun === 0) act.stunKind = "";
        if (act.mode === "roll") { updateRoll(); if (pressedNow("dodge")) pressDodge(); return; }
        if (act.mode === "attack" && !$gamePlayer._toolSwing) act.mode = "idle";   // (the swing was taken away: a scene change...)
        if (pressedNow("tab") && mapFreePlay()) setCombatMode(!combatMode());
        const dodge = pressedNow("dodge"), blow = pressedNow("shoot"), weapon = pressedNow("weaponNext") ? 1 : pressedNow("weaponPrev") ? -1 : 0;
        if (!canAct()) { if (act.mode === "block") act.mode = "idle"; keyWas.block = Input.isPressed("block"); return; }
        updateBlock();
        if (weapon && act.mode === "idle" && !(window.Hunting && Hunting.aim)) switchHand(weapon);
        if (dodge) pressDodge();
        if (act.mode === "attack" && blow) pressAttack();   // (the next blow of the combo: Hunting.js does not see the key while the hero swings)
        if (!act.secondWind || act.combatT > 0) return;
        act.secondWind = false;   // (a new fight: "Drugi oddech" works again)
    };
    // leaving the map / loading: nothing half done
    function resetAct() {
        Object.assign(act, { mode: "idle", combo: 0, queued: false, charge: 0, rollT: 0, iframes: 0, blockT: 0, stun: 0, stunKind: "", comboCd: 0, comboGrace: 0, rollCd: 0, rolls: 0, riposteT: 0, combatT: 0, hurtT: 0, flinchT: 0 });
        breath = -1;
        winded = false;
        stopFrames = 0;
        floaters.length = 0;
        sparks.length = 0;
    }
    const _extractSaveContents = DataManager.extractSaveContents;
    DataManager.extractSaveContents = function(contents) {
        _extractSaveContents.call(this, contents);
        resetAct();
        const a = $gameParty.leader();
        if (a) a.refresh();   // (a save from before: its health is fitted to the hero's own maximum)
    };
    const _setupNewGame = DataManager.setupNewGame;
    DataManager.setupNewGame = function() {
        _setupNewGame.call(this);
        resetAct();
        const a = $gameParty.leader();
        if (a) a.recoverAll();   // (full health on the hero's own maximum)
    };

    // ==================================================================
    // P -> Postać: the level, the attributes (the free points given out) and the skills. MenuPanel.js's panel goes round it
    // when that plugin is there. Atrybuty: ←/→ put points on the chosen attribute (only planned until Enter confirms);
    // Umiejętności: Enter learns the chosen skill. Both ask first - nothing given out can be taken back.
    // ==================================================================
    const secText = frames => (frames / 60).toFixed(2).replace(".", ",") + " s";
    const num2 = n => (Math.round(n * 100) / 100).toFixed(2).replace(".", ",");
    // what each attribute does now: [label, value] (the preview evaluates it with the planned points)
    const ATTR_EFFECTS = {
        str: () => [["Obrażenia wręcz", "×" + num2(strMult())], ["Zbijanie równowagi wroga", "×" + num2(poiseMult())], ["Udźwig", "+" + carryBonus()],
            ["Rąbanie, kopanie, kucie", gatherBonus() > 0 ? "o " + (Math.round(gatherBonus() * 1000) / 10).toString().replace(".", ",") + "% mniej uderzeń" : "zwykłe"]],
        dex: () => [["Koszt przewrotu", rollCost() + " oddechu"], ["Nietykalność w przewrocie", secText(rollIFrames())],
            ["Czas na następny cios serii", secText(comboWindow())], ["Celowanie (łuk, proca)", aimSteady() > 0.999 ? "zwykłe" : "o " + Math.round((1 / aimSteady() - 1) * 100) + "% szybciej"],
            ["Praca (budowa, rąbanie, kucie)", dexWork() > 1.001 ? "o " + Math.round((dexWork() - 1) * 100) + "% szybciej" : "zwykła"]],
        con: () => [["Życie", String(heroMhp())], ["Oddech (wypoczęty)", String(baseBreath())], ["Przewraca cię cios o sile", String(knockdownAt())],
            ["Szansa na ranę", Math.round(woundChance(1) * 100) + "% zwykłej"]],
        per: () => [["Okno parowania", secText(parryWindow())], ["Trafienie krytyczne", Math.round(critChance() * 100) + "%"]],
        wil: () => [["Na razie bez działania", "przyda się przeciw stworom z ruin"]]
    };
    // runs fn with the planned points added to the attributes
    function withAttrs(add, fn) {
        const h = hero(), keep = h.attr;
        h.attr = Object.assign({}, keep);
        for (const a of ATTRS) h.attr[a.id] += add[a.id] || 0;
        try { return fn(); } finally { h.attr = keep; }
    }
    function wrapText(win, text, width) {
        const out = [];
        for (const para of String(text).split("\n")) {
            let line = "";
            for (const word of para.split(" ")) {
                const next = line ? line + " " + word : word;
                if (line && win.textWidth(next) > width) { out.push(line); line = word; } else line = next;
            }
            out.push(line);
        }
        return out;
    }
    const HERO_TABS = ["Atrybuty", "Umiejętności"];
    // from the panel's left: where the attribute list ends (Atrybuty); where the list of fields ends and where the tree ends (Umiejętności)
    const HERO_SPLIT = 430, DOMAIN_SPLIT = 235, TREE_SPLIT = 795;
    const uic = () => window.UIStyle || { accent: "#ffd23f", text: "#eceef0", muted: "#8a9099", line: "#3a3e46", panel() {}, bar() {} };

    // the text of a skill at a rank: {key} -> the value of its effect times the rank (Skills_Data.js FX says how it reads)
    function fxText(key, v) {
        const f = (window.SkillData && SkillData.FX[key]) || "n";
        if (f === "%") return Math.round(v * 100) + "%";
        if (f === "s") return secText(v);
        return String(Math.round(v * 10) / 10).replace(".", ",");
    }
    function skillText(sk, rank) {
        return sk.text.replace(/\{([^}]+)\}/g, (m, k) => fxText(k, (sk.fx[k] || 0) * Math.max(1, rank)));
    }
    const treeSkills = treeId => SKILLS.filter(s => s.tree === treeId);

    // the list on the left of the Atrybuty page: the five attributes
    function Window_HeroList() { this.initialize(...arguments); }
    Window_HeroList.prototype = Object.create(Window_Selectable.prototype);
    Window_HeroList.prototype.constructor = Window_HeroList;
    Window_HeroList.prototype.initialize = function(rect, scene) {
        this._scene = scene;
        Window_Selectable.prototype.initialize.call(this, rect);
    };
    Window_HeroList.prototype.maxItems = function() { return ATTRS.length; };
    Window_HeroList.prototype.itemHeight = function() { return 66; };
    Window_HeroList.prototype.cursorRight = function() { this._scene.plan(ATTRS[this.index()].id, 1); };
    Window_HeroList.prototype.cursorLeft = function() { this._scene.plan(ATTRS[this.index()].id, -1); };
    Window_HeroList.prototype.select = function(index) {
        Window_Selectable.prototype.select.call(this, index);
        if (this._scene && this._scene._list === this) this._scene.refreshDetail();
    };
    Window_HeroList.prototype.drawItem = function(index) {
        const U = uic(), ctx = this.contents.context, h = hero(), sc = this._scene;
        this.resetFontSettings();
        const a = ATTRS[index], add = sc._plan[a.id] || 0, v = h.attr[a.id], R = this.itemRectWithPadding(index), ty = R.y - 4;
        this.contents.fontSize = 22;
        this.changeTextColor(U.text);
        this.drawText(a.name, R.x + 4, ty, R.width - 90);
        this.contents.fontSize = 26;
        this.changeTextColor(add > 0 ? U.accent : U.text);
        this.drawText(String(v + add), R.x, ty, R.width - 6, "right");
        if (add > 0) {
            this.contents.fontSize = 18;
            this.drawText("+" + add, R.x, ty + 2, R.width - 44, "right");
        }
        const bw = R.width - 12, bx = R.x + 4, by = R.y + R.height - 14;
        U.bar(ctx, bx, by, bw, 5, (v + add) / ATTR_MAX, add > 0 ? U.accent : "#8fa4c8");
        if (add > 0) { ctx.fillStyle = "#8fa4c8"; ctx.fillRect(bx, by, Math.round(bw * v / ATTR_MAX), 5); }
        this.resetFontSettings();
    };

    // ------------------------------------------------------------------
    // One skill tree: the field's name on top, the level each row needs on the left, the skills as
    // boxes on a 5 x 6 grid joined by lines from the skills that open them. A box: gold = learnt (filled when at the top rank),
    // white frame = can be learnt now (or as soon as there is a point), grey = still closed; the small bars are its ranks.
    // The arrows walk to the nearest box that way; ← with nothing more to the left goes back to the list of fields.
    // ------------------------------------------------------------------
    const TREE = { strip: 40, labelW: 48, rows: 6, cols: 5, nodeH: 50, padX: 12 };
    function Window_SkillTree() { this.initialize(...arguments); }
    Window_SkillTree.prototype = Object.create(Window_Selectable.prototype);
    Window_SkillTree.prototype.constructor = Window_SkillTree;
    Window_SkillTree.prototype.initialize = function(rect, scene) {
        this._scene = scene;
        this._nodes = [];
        this._treeId = TREES.length ? TREES[0].id : "";
        Window_Selectable.prototype.initialize.call(this, rect);
    };
    Window_SkillTree.prototype.setTree = function(treeId) {
        this._treeId = treeId;
        this._nodes = treeSkills(treeId);
        this.refresh();
    };
    Window_SkillTree.prototype.maxItems = function() { return this._nodes.length; };
    Window_SkillTree.prototype.ensureCursorVisible = function() {};   // (the whole tree fits: no scrolling)
    Window_SkillTree.prototype.processWheelScroll = function() {};
    Window_SkillTree.prototype.overallHeight = function() { return this.innerHeight; };
    Window_SkillTree.prototype.cell = function(row, col) {
        const W = this.innerWidth - TREE.labelW, pitchX = W / TREE.cols, pitchY = (this.innerHeight - TREE.strip) / TREE.rows;
        const w = Math.round(pitchX - TREE.padX), h = Math.min(TREE.nodeH, Math.round(pitchY - 16));
        return new Rectangle(Math.round(TREE.labelW + col * pitchX + (pitchX - w) / 2), Math.round(TREE.strip + row * pitchY + (pitchY - h) / 2), w, h);
    };
    Window_SkillTree.prototype.itemRect = function(index) {
        const s = this._nodes[index];
        return s ? this.cell(s.row, s.col) : new Rectangle(0, 0, 0, 0);
    };
    Window_SkillTree.prototype.moveTo = function(dx, dy) {
        const cur = this._nodes[this.index()];
        if (!cur) return;
        let best = -1, bestD = Infinity;
        this._nodes.forEach((s, i) => {
            const ddx = s.col - cur.col, ddy = s.row - cur.row;
            if (i === this.index() || (dx && Math.sign(ddx) !== dx) || (dy && Math.sign(ddy) !== dy)) return;
            const d = dx ? Math.abs(ddx) + Math.abs(ddy) * 3 : Math.abs(ddy) * 3 + Math.abs(ddx);   // (the nearest row / column first)
            if (d < bestD) { bestD = d; best = i; }
        });
        if (best >= 0) this.select(best);
    };
    // the key that brought the focus into the tree (→ / Enter on the list) must not act in it as well in the same frame
    Window_SkillTree.prototype.processCursorMove = function() { if (!(this._inputLock > 0)) Window_Selectable.prototype.processCursorMove.call(this); };
    Window_SkillTree.prototype.processHandling = function() { if (!(this._inputLock > 0)) Window_Selectable.prototype.processHandling.call(this); };
    Window_SkillTree.prototype.update = function() {
        Window_Selectable.prototype.update.call(this);
        if (this._inputLock > 0) this._inputLock--;
    };
    Window_SkillTree.prototype.cursorDown = function() { this.moveTo(0, 1); };
    Window_SkillTree.prototype.cursorUp = function() { this.moveTo(0, -1); };
    Window_SkillTree.prototype.cursorRight = function() { this.moveTo(1, 0); };
    Window_SkillTree.prototype.cursorLeft = function() {
        const i = this.index();
        this.moveTo(-1, 0);
        if (this.index() === i && this._scene && this._scene.focusDomains) this._scene.focusDomains();
    };
    Window_SkillTree.prototype.select = function(index) {
        Window_Selectable.prototype.select.call(this, index);
        if (this._scene && this._scene._tree === this) this._scene.refreshDetail();
    };
    Window_SkillTree.prototype.drawAllItems = function() {
        this.drawStrip();
        this.drawLinks();
        for (let i = 0; i < this.maxItems(); i++) this.drawItem(i);
    };
    Window_SkillTree.prototype.drawStrip = function() {
        const U = uic(), c = this.contents, W = this.innerWidth, t = TREES.find(x => x.id === this._treeId);
        if (!t) return;
        const list = treeSkills(t.id), spent = list.reduce((a, s) => a + skillRank(s.id), 0), total = list.reduce((a, s) => a + s.ranks, 0);
        c.fontSize = 22;
        this.changeTextColor(U.accent);
        c.drawText(t.name, 0, 2, W, 30, "center");
        c.fontSize = 16;
        this.changeTextColor(U.muted);
        c.drawText("stopni " + spent + " / " + total, W - 214, 6, 210, 24, "right");
        // the level each row needs
        const h = hero();
        for (let r = 0; r < TREE.rows; r++) {
            const cell = this.cell(r, 0), lv = ROW_LEVEL[r] || 1;
            c.fontSize = 13;
            this.changeTextColor(h.level >= lv ? U.muted : "#8a5a52");
            c.drawText("poz.", 0, cell.y + cell.height / 2 - 16, TREE.labelW - 8, 16, "right");
            c.fontSize = 17;
            this.changeTextColor(h.level >= lv ? U.text : "#c47a6e");
            c.drawText(String(lv), 0, cell.y + cell.height / 2 - 1, TREE.labelW - 8, 18, "right");
        }
        this.resetFontSettings();
    };
    Window_SkillTree.prototype.drawLinks = function() {
        const ctx = this.contents.context, U = uic(), r0 = this.cell(0, 0), r1 = this.cell(1, 0);
        const halfGap = Math.max(3, Math.round((r1.y - (r0.y + r0.height)) / 2));   // the turn is just above the skill it leads to
        ctx.save();
        ctx.lineWidth = 2;
        for (const s of this._nodes) {
            for (const f of s.from) {
                const p = this._nodes.find(n => n.id === f);
                if (!p) continue;
                const a = this.cell(p.row, p.col), b = this.cell(s.row, s.col), open = skillRank(f) > 0;
                ctx.strokeStyle = open && skillRank(s.id) > 0 ? U.accent : open ? "rgba(236,238,240,0.6)" : "rgba(90,95,105,0.7)";
                const x1 = Math.round(a.x + a.width / 2) + 0.5, y1 = a.y + a.height, x2 = Math.round(b.x + b.width / 2) + 0.5, y2 = b.y;
                const midY = b.y - halfGap + 0.5;   // (right angles, like a family tree; a way over two rows turns only above its skill)
                ctx.beginPath();
                ctx.moveTo(x1, y1); ctx.lineTo(x1, midY); ctx.lineTo(x2, midY); ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        }
        ctx.restore();
        this.contents._baseTexture.update();
    };
    // what state a skill's box shows: "full" (top rank), "part" (learnt, more ranks to go), "open" (can be learnt), "locked"
    function skillState(s) {
        const rank = skillRank(s.id), block = skillBlock(s.id);
        if (rank >= s.ranks) return "full";
        if (rank > 0) return "part";
        return !block || block === "Brak punktów umiejętności." ? "open" : "locked";
    }
    Window_SkillTree.prototype.drawItem = function(index) {
        const s = this._nodes[index], r = this.itemRect(index), U = uic(), c = this.contents, ctx = c.context;
        const rank = skillRank(s.id), st = skillState(s);
        const line = st === "locked" ? U.line : st === "open" ? "#c9ccd2" : U.accent;
        const fill = st === "full" ? "rgba(96,78,16,0.95)" : st === "part" ? "rgba(52,44,14,0.95)" : "rgba(16,17,21,0.95)";
        U.panel(ctx, r.x, r.y, r.width, r.height, { cut: 4, fill, line, accent: st === "full" || st === "part" });
        c.fontSize = 15;
        this.changeTextColor(st === "locked" ? U.muted : st === "open" ? U.text : st === "full" ? "#fff4c2" : U.accent);
        const lines = wrapText(this, s.name, r.width - 8).slice(0, 2), lh = 16, top = r.y + (lines.length > 1 ? 4 : 11);
        lines.forEach((ln, k) => c.drawText(ln, r.x + 4, top + k * lh, r.width - 8, lh, "center"));
        const pw = 8, gap = 3, total = s.ranks * pw + (s.ranks - 1) * gap, x0 = r.x + Math.round((r.width - total) / 2), y0 = r.y + r.height - 8;
        for (let k = 0; k < s.ranks; k++) {
            ctx.fillStyle = k < rank ? U.accent : st === "locked" ? "#2a2d33" : "#4a4e57";
            ctx.fillRect(x0 + k * (pw + gap), y0, pw, 4);
        }
        c._baseTexture.update();
        this.resetFontSettings();
    };

    // the band beside the tabs: the free points
    function drawHeroPoints(win, plan) {
        const U = uic(), h = hero(), planned = Object.values(plan).reduce((a, b) => a + b, 0), W = win.innerWidth;
        win.contents.clear();
        win.resetFontSettings();
        let x = W;
        const part = (label, n) => {
            win.contents.fontSize = 24;
            const nw = Math.ceil(win.textWidth(String(n))) + 4;
            win.changeTextColor(n > 0 ? U.accent : U.muted);
            win.drawText(String(n), x - nw, 0, nw, "right");
            x -= nw + 8;
            win.contents.fontSize = 18;
            const lw = Math.ceil(win.textWidth(label)) + 4;
            win.changeTextColor(U.muted);
            win.drawText(label, x - lw, 2, lw, "right");
            x -= lw + 26;
        };
        part("Punkty umiejętności", h.skillPoints);
        part("Punkty atrybutów", h.points - planned);
        win.resetFontSettings();
    }

    // the fields on the left of the Umiejętności tab: ↑↓ choose one (its tree shows beside it at once), → or Enter go into it.
    // Each line: the name (gold once a point is in it), the ranks taken of all, and a dot when something can be learnt there now.
    function Window_SkillDomains() { this.initialize(...arguments); }
    Window_SkillDomains.prototype = Object.create(Window_Selectable.prototype);
    Window_SkillDomains.prototype.constructor = Window_SkillDomains;
    Window_SkillDomains.prototype.initialize = function(rect, scene) {
        this._scene = scene;
        Window_Selectable.prototype.initialize.call(this, rect);
    };
    Window_SkillDomains.prototype.maxItems = function() { return TREES.length; };
    Window_SkillDomains.prototype.itemHeight = function() { return Math.max(30, Math.floor(this.innerHeight / Math.max(1, TREES.length))); };
    Window_SkillDomains.prototype.cursorRight = function() { this._scene.enterTree(); };
    Window_SkillDomains.prototype.select = function(index) {
        Window_Selectable.prototype.select.call(this, index);
        if (this._scene && this._scene._domains === this && index >= 0) this._scene.showDomain(index);
    };
    Window_SkillDomains.prototype.drawItem = function(index) {
        const t = TREES[index], r = this.itemLineRect(index), U = uic(), list = treeSkills(t.id);
        const spent = list.reduce((a, s) => a + skillRank(s.id), 0), total = list.reduce((a, s) => a + s.ranks, 0);
        const ready = hero().skillPoints > 0 && list.some(s => { const st = skillState(s); return (st === "open" || st === "part") && !skillBlock(s.id); });
        this.resetFontSettings();
        this.contents.fontSize = 19;
        this.changeTextColor(spent > 0 ? U.accent : U.text);
        this.drawText(t.name, r.x + 2, r.y, r.width - 58);
        this.contents.fontSize = 15;
        this.changeTextColor(U.muted);
        this.drawText(spent + "/" + total, r.x, r.y + 1, r.width - (ready ? 16 : 2), "right");
        if (ready) {
            this.contents.fontSize = 18;
            this.changeTextColor(U.accent);
            this.drawText("•", r.x, r.y, r.width - 2, "right");
        }
        this.resetFontSettings();
    };

    // two tabs (Q / E): Atrybuty, Umiejętności (the fields on the left, the chosen field's tree in the middle)
    function Scene_Hero() { this.initialize(...arguments); }
    Scene_Hero.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_Hero.prototype.constructor = Scene_Hero;
    Scene_Hero.prototype.prepare = function(tab) { this._startTab = tab || 0; };
    // a panel a little bigger than the usual wide one: the fields, a tree and its description side by side
    Scene_Hero.prototype.heroRect = function() {
        const w = Math.min(Graphics.boxWidth - 40, 1180), h = Math.min(Graphics.boxHeight - 40, 640);
        return new Rectangle(Math.round((Graphics.boxWidth - w) / 2), Math.round((Graphics.boxHeight - h) / 2), w, h);
    };
    Scene_Hero.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
        const MP = window.MenuPanel, r = this.heroRect(), HEAD = MP ? MP.HEAD : 58, TABS = MP ? MP.TABS : 60, FOOT = MP ? MP.FOOT : 42;
        const top = r.y + HEAD + TABS, h = r.height - HEAD - TABS - FOOT;
        this._rect = r;
        this._bodyTop = top;
        this._bodyH = h;
        this._tab = this._startTab ? 1 : 0;
        this._focus = "domains";   // on Umiejętności: "domains" (the list of fields) or "tree"
        this._plan = {};
        this._tabs = new Window_Command(new Rectangle(r.x + 14, r.y + HEAD - 4, 400, 68));
        this._tabs.maxCols = () => HERO_TABS.length;
        this._tabs.makeCommandList = function() { HERO_TABS.forEach(t => this.addCommand(t, "tab")); };
        this._tabs.itemTextAlign = () => "center";
        this._tabs.refresh();
        this._tabs.deactivate();
        this.addWindow(this._tabs);
        this._points = new Window_Base(new Rectangle(r.x + 420, r.y + HEAD + 2, r.width - 440, 56));
        this.addWindow(this._points);
        this._detail = new Window_Base(new Rectangle(r.x + HERO_SPLIT + 8, top + 6, r.width - HERO_SPLIT - 18, h - 12));
        this.addWindow(this._detail);
        this._list = new Window_HeroList(new Rectangle(r.x + 10, top + 6, HERO_SPLIT - 18, h - 12), this);
        this._domains = new Window_SkillDomains(new Rectangle(r.x + 10, top + 6, DOMAIN_SPLIT - 16, h - 12), this);
        this._tree = new Window_SkillTree(new Rectangle(r.x + DOMAIN_SPLIT + 4, top + 4, TREE_SPLIT - DOMAIN_SPLIT - 8, h - 8), this);
        this._list.setHandler("ok", this.onOk.bind(this));
        this._list.setHandler("cancel", this.onCancel.bind(this));
        this._domains.setHandler("ok", () => this.enterTree());
        this._domains.setHandler("cancel", this.onCancel.bind(this));
        this._tree.setHandler("ok", this.onOk.bind(this));
        this._tree.setHandler("cancel", () => this.focusDomains());
        for (const w of [this._list, this._domains, this._tree]) {
            w.setHandler("pagedown", () => this.changeTab(1));
            w.setHandler("pageup", () => this.changeTab(-1));
            this.addWindow(w);
        }
        // the question before anything is given out (a small window over the rest)
        const cw = 520, ch = 214;
        this._confirm = new Window_Command(new Rectangle(r.x + Math.round((r.width - cw) / 2), r.y + Math.round((r.height - ch) / 2), cw, ch));
        this._confirm._lines = [];
        this._confirm.makeCommandList = function() { this.addCommand("Tak", "yes"); this.addCommand("Nie", "no"); };
        this._confirm.maxCols = () => 2;
        this._confirm.itemTextAlign = () => "center";
        const cf = this._confirm;
        cf.itemRect = function(index) {
            const rr = Window_Command.prototype.itemRect.call(this, index);
            rr.y = this.innerHeight - rr.height;
            return rr;
        };
        cf.drawAllItems = function() {
            const U = uic();
            this._lines.forEach((line, i) => {
                this.contents.fontSize = i === 0 ? 24 : 19;
                this.changeTextColor(i === 0 ? U.accent : U.text);
                this.drawText(line, 4, i === 0 ? 0 : 8 + i * 30, this.innerWidth - 8, "left");
            });
            this.resetFontSettings();
            Window_Command.prototype.drawAllItems.call(this);
        };
        cf.setHandler("yes", this.onConfirm.bind(this));
        cf.setHandler("no", this.onConfirmNo.bind(this));
        cf.setHandler("cancel", this.onConfirmNo.bind(this));
        cf.hide();
        cf.deactivate();
        this.addWindow(cf);
        if (MP && MP.Sprite_MenuPanel) {
            for (const w of [this._tabs, this._points, this._detail, this._list, this._domains, this._tree]) { w.opacity = 0; w.frameVisible = false; }
            this._menuPanel = new MP.Sprite_MenuPanel({ rect: r, title: "Postać", subtitle: this.subtitle(), tabs: true, splits: [HERO_SPLIT], hints: this.hints() });
            const i = this.children.indexOf(this._windowLayer);
            this.addChildAt(this._menuPanel, i >= 0 ? i : this.children.length);
        }
        this._domains.select(0);
        this.showTab();
    };
    Scene_Hero.prototype.subtitle = function() {
        const h = hero();
        return "Poziom " + h.level + (h.level >= MAX_LEVEL ? "  ·  najwyższy" : "  ·  " + h.xp + " / " + xpToNext(h.level) + " dośw. do następnego");
    };
    Scene_Hero.prototype.hints = function() {
        if (this._tab === 0) return [["↑↓", "wybierz"], ["←→", "rozdaj punkty"], ["Enter", "zatwierdź"], ["Q E", "zakładka"], ["Esc", "cofnij / wróć"]];
        if (this._focus === "tree") return [["strzałki", "wybierz"], ["Enter", "naucz się"], ["← Esc", "dziedziny"], ["Q E", "zakładka"]];
        return [["↑↓", "dziedzina"], ["→ Enter", "drzewko"], ["Q E", "zakładka"], ["Esc", "wróć"]];
    };
    // the window the keys go to now
    Scene_Hero.prototype.pageWindow = function() { return this._tab === 0 ? this._list : this._focus === "tree" ? this._tree : this._domains; };
    Scene_Hero.prototype.showTab = function() {
        const r = this._rect, attrs = this._tab === 0, split = attrs ? HERO_SPLIT : TREE_SPLIT;
        this._tabs.select(this._tab);
        this._detail.move(r.x + split + 8, this._bodyTop + 6, r.width - split - 18, this._bodyH - 12);
        this._detail.createContents();
        for (const w of [this._list, this._domains, this._tree]) w.deactivate();
        if (attrs) {
            this._domains.hide();
            this._tree.hide();
            this._list.show();
            this._list.refresh();
            this._list.select(Math.min(Math.max(0, this._list.index()), this._list.maxItems() - 1));
            this._list.activate();
        } else {
            this._list.hide();
            this._domains.show();
            this._tree.show();
            this._focus = "domains";
            this._tree.select(-1);
            this._domains.refresh();
            this._domains.activate();
            this.showDomain(Math.max(0, this._domains.index()));
        }
        if (this._menuPanel) this._menuPanel.set({ splits: attrs ? [HERO_SPLIT] : [DOMAIN_SPLIT, TREE_SPLIT] });
        this.refreshAll();
    };
    Scene_Hero.prototype.refreshAll = function() {
        if (this._tab === 0) this._list.refresh();
        else { this._domains.refresh(); this._tree.refresh(); }
        drawHeroPoints(this._points, this._plan);
        this.refreshDetail();
        if (this._menuPanel) this._menuPanel.set({ subtitle: this.subtitle(), hints: this.hints() });
    };
    Scene_Hero.prototype.changeTab = function(dir) {
        if (this._tab === 0 && Object.keys(this._plan).length) this._plan = {};   // (planned points are dropped when leaving the tab)
        this._tab = (this._tab + dir + HERO_TABS.length) % HERO_TABS.length;
        SoundManager.playCursor();
        this.showTab();
    };
    // the list of fields: the chosen field's tree shows beside it (not entered yet)
    Scene_Hero.prototype.showDomain = function(index) {
        const t = TREES[index];
        if (!t) return;
        if (this._tree._treeId !== t.id || !this._tree._nodes.length) { this._tree.setTree(t.id); this._treeLast = 0; }
        if (this._focus === "domains") this._tree.select(-1);
        this.refreshDetail();
    };
    // into the tree (→ / Enter on a field) and back out (← at its left edge, Esc)
    Scene_Hero.prototype.enterTree = function() {
        if (!this._tree._nodes.length) return;
        this._focus = "tree";
        this._domains.deactivate();
        this._tree._inputLock = 1;
        this._tree.activate();
        this._tree.select(Math.min(this._treeLast || 0, this._tree.maxItems() - 1));
        SoundManager.playCursor();
        if (this._menuPanel) this._menuPanel.set({ hints: this.hints() });
    };
    Scene_Hero.prototype.focusDomains = function() {
        this._treeLast = Math.max(0, this._tree.index());
        this._focus = "domains";
        this._tree.deactivate();
        this._tree.select(-1);
        this._domains.activate();
        SoundManager.playCursor();
        this.refreshDetail();
        if (this._menuPanel) this._menuPanel.set({ hints: this.hints() });
    };
    // ←/→ on an attribute: plan a point on it or take a planned one back
    Scene_Hero.prototype.plan = function(id, dir) {
        const h = hero(), planned = Object.values(this._plan).reduce((a, b) => a + b, 0), cur = this._plan[id] || 0;
        if (dir > 0 && (planned >= h.points || h.attr[id] + cur >= ATTR_MAX)) { SoundManager.playBuzzer(); return; }
        if (dir < 0 && cur <= 0) { SoundManager.playBuzzer(); return; }
        this._plan[id] = cur + dir;
        if (!this._plan[id]) delete this._plan[id];
        SoundManager.playCursor();
        this.refreshAll();
    };
    Scene_Hero.prototype.currentSkill = function() { return this._tab === 1 && this._focus === "tree" ? this._tree._nodes[this._tree.index()] || null : null; };
    Scene_Hero.prototype.onOk = function() {
        const h = hero();
        if (this._tab === 0) {
            const parts = ATTRS.filter(a => this._plan[a.id]).map(a => a.name + " " + h.attr[a.id] + " → " + (h.attr[a.id] + this._plan[a.id]));
            if (!parts.length) { SoundManager.playBuzzer(); this._list.activate(); return; }
            this.ask(["Rozdać punkty?", parts.join(",  "), "Tego nie da się cofnąć."]);
            return;
        }
        const sk = this.currentSkill(), block = sk && skillBlock(sk.id);
        if (!sk || block) { SoundManager.playBuzzer(); this._tree.activate(); return; }
        const rank = skillRank(sk.id);
        this.ask([(rank ? "Następny stopień: " : "Nauczyć się: ") + sk.name + (sk.ranks > 1 ? " (" + (rank + 1) + "/" + sk.ranks + ")" : "") + "?",
            "Kosztuje 1 punkt umiejętności.", "Tego nie da się cofnąć."]);
    };
    Scene_Hero.prototype.ask = function(lines) {
        const cf = this._confirm;
        cf._lines = lines;
        cf.refresh();
        cf.select(0);
        cf.show();
        cf.activate();
        this.pageWindow().deactivate();
    };
    Scene_Hero.prototype.closeAsk = function() {
        this._confirm.hide();
        this._confirm.deactivate();
        this.pageWindow().activate();
    };
    Scene_Hero.prototype.onConfirm = function() {
        let ok = false;
        if (this._tab === 0) { ok = spendPoints(this._plan); if (ok) this._plan = {}; }
        else { const sk = this.currentSkill(); ok = !!sk && learnSkill(sk.id); }
        AudioManager.playSe({ name: ok ? "Up4" : "Buzzer1", volume: 70, pitch: ok ? 115 : 100, pan: 0 });
        this.closeAsk();
        this.refreshAll();
    };
    Scene_Hero.prototype.onConfirmNo = function() {
        this.closeAsk();
    };
    Scene_Hero.prototype.onCancel = function() {
        if (this._tab === 0 && Object.keys(this._plan).length) {   // Esc first drops the planned points
            this._plan = {};
            this.refreshAll();
            this._list.activate();
            return;
        }
        this.popScene();
    };
    Scene_Hero.prototype.refreshDetail = function() {
        const w = this._detail, U = uic(), ctx = w.contents.context, W = w.innerWidth, h = hero();
        w.contents.clear();
        w.resetFontSettings();
        const title = (text, right) => {
            w.contents.fontSize = 26;
            w.changeTextColor(U.accent);
            w.drawText(text, 0, 0, W - (right ? 120 : 0));
            if (right) { w.contents.fontSize = 18; w.changeTextColor(U.muted); w.drawText(right, 0, 6, W, "right"); }
            ctx.fillStyle = U.line;
            ctx.fillRect(0, 44, W, 1);
        };
        const para = (text, y, colour, size) => {
            w.contents.fontSize = size || 20;
            w.changeTextColor(colour || U.text);
            for (const line of wrapText(w, text, W - 4)) { w.drawText(line, 0, y, W); y += (size || 20) + 8; }
            return y;
        };
        const label = (text, y) => {
            w.contents.fontSize = 16;
            w.changeTextColor(U.muted);
            w.drawText(text.toUpperCase(), 0, y, W);
            return y + 26;
        };
        if (this._tab === 0) {
            const a = ATTRS[Math.max(0, this._list.index())], add = this._plan[a.id] || 0;
            title(a.name, add ? h.attr[a.id] + " → " + (h.attr[a.id] + add) : String(h.attr[a.id]) + " / " + ATTR_MAX);
            let y = para(a.desc, 56) + 10;
            y = label("Co daje teraz" + (Object.keys(this._plan).length ? "  →  po rozdaniu" : ""), y);
            const now = ATTR_EFFECTS[a.id](), next = withAttrs(this._plan, ATTR_EFFECTS[a.id]);
            // two columns sized by what is in them: the values now (right-aligned) and, with points planned, what they become (the
            // arrows one under another); a name too long for its line puts the values under it (the user's, 2026-09-25: "o 1,5% mniej
            // uderzeń" ran over "zwykłe")
            w.contents.fontSize = 20;
            const rows = now.map(([name, v], k) => ({ name, v, after: next[k][1] !== v ? "→ " + next[k][1] : "" }));
            const nw = Math.max(0, ...rows.map(r => (r.after ? Math.ceil(w.textWidth(r.after)) : 0))), gap = nw ? 18 : 0;
            for (const r of rows) {
                const under = Math.ceil(w.textWidth(r.name)) + 24 + Math.ceil(w.textWidth(r.v)) + gap + nw > W;
                w.changeTextColor(U.muted);
                w.drawText(r.name, 0, y, W);
                if (under) y += 28;
                w.changeTextColor(U.text);
                w.drawText(r.v, 0, y, W - nw - gap, "right");
                if (r.after) { w.changeTextColor(U.accent); w.drawText(r.after, W - nw, y, nw + 4); }
                y += 32;
            }
            y += 10;
            if (h.points === 0) para("Punkty atrybutów przychodzą z poziomem: " + POINTS_PER_LEVEL + " na każdy. Doświadczenie dają walka, cele z dziennika i odkrycia.", y, U.muted, 18);
            else para("Najwyżej " + ATTR_MAX + " w jednym atrybucie. ←/→ rozdziela punkty, Enter zatwierdza, Esc je cofa.", y, U.muted, 18);
            w.resetFontSettings();
            return;
        }
        const sk = this.currentSkill();
        if (!sk) {   // a field chosen on the list: what it is about and what is learnt in it
            const t = TREES[Math.max(0, this._domains.index())];
            if (!t) { w.resetFontSettings(); return; }
            const list = treeSkills(t.id), spent = list.reduce((a, s) => a + skillRank(s.id), 0), total = list.reduce((a, s) => a + s.ranks, 0);
            title(t.name, "stopni " + spent + " / " + total);
            let y = para(t.desc, 56) + 10;
            y = label("Umiesz", y);
            const known = list.filter(s => skillRank(s.id) > 0);
            if (!known.length) y = para("Jeszcze nic z tej dziedziny.", y, U.muted, 18);
            for (const s of known) {
                w.contents.fontSize = 18;
                w.changeTextColor(U.accent);
                w.drawText(s.name, 0, y, W - 60);
                w.changeTextColor(U.muted);
                w.drawText(s.ranks > 1 ? skillRank(s.id) + "/" + s.ranks : "✓", 0, y, W, "right");
                y += 26;
            }
            y += 10;
            const open = list.filter(s => !skillBlock(s.id)).length;
            para(open ? "Możesz się teraz nauczyć: " + open + ". → albo Enter: wejdź w drzewko." : "→ albo Enter: wejdź w drzewko i zobacz, czego wymagają umiejętności.", y, open ? U.accent : U.muted, 18);
            w.resetFontSettings();
            return;
        }
        const rank = skillRank(sk.id), full = rank >= sk.ranks, lv = ROW_LEVEL[sk.row] || 1;
        title(sk.name, sk.ranks > 1 ? "stopień " + rank + " / " + sk.ranks : rank ? "znana" : "");
        let y = 56;
        if (sk.ranks > 1 && rank === 0) y = label("Pierwszy stopień", y);
        else if (sk.ranks > 1) y = label("Teraz", y);
        y = para(skillText(sk, Math.max(1, rank)), y) + 4;
        if (rank > 0 && !full) { y = label("Następny stopień", y); y = para(skillText(sk, rank + 1), y, U.accent) + 4; }
        y = label("Wymagania", y + 4);
        const rows = [];
        if (lv > 1) rows.push([h.level >= lv, "Poziom postaci " + lv + "  (masz " + h.level + ")"]);
        if (sk.from.length) rows.push([sk.from.some(f => skillRank(f) > 0), "Najpierw: " + sk.from.map(f => skillById(f).name).join(" albo ")]);
        for (const a of ATTRS) if (sk.attr[a.id]) rows.push([h.attr[a.id] >= sk.attr[a.id], a.name + " " + sk.attr[a.id] + "  (masz " + h.attr[a.id] + ")"]);
        if (!full) rows.push([h.skillPoints >= 1, "1 punkt umiejętności  (masz " + h.skillPoints + ")"]);
        if (!rows.length) rows.push([true, "brak"]);
        for (const [ok, text] of rows) {
            w.contents.fontSize = 18;
            w.changeTextColor(ok ? "#62c66a" : "#ff8f7f");
            w.drawText(ok ? "✓" : "×", 0, y, 22, "center");
            w.changeTextColor(ok ? U.text : U.muted);
            for (const line of wrapText(w, text, W - 30)) { w.drawText(line, 28, y, W - 28); y += 26; }
        }
        y += 8;
        const block = skillBlock(sk.id);
        para(full ? (sk.ranks > 1 ? "Masz najwyższy stopień - działa zawsze." : "Znasz tę umiejętność - działa zawsze, bez żadnego klawisza.")
            : block ? block : "Enter: " + (rank ? "następny stopień." : "naucz się jej teraz."), y, full || !block ? U.accent : U.muted, 18);
        w.resetFontSettings();
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
        this._commandWindow.setHandler("hero", () => SceneManager.push(Scene_Hero));
    };
    const unspent = () => ($gameSystem ? hero().points + hero().skillPoints : 0);

    window.Combat = {
        ATTRS, SKILLS, TREES, MELEE, SHIELDS, MAX_LEVEL, ATTR_MAX, POINTS_PER_LEVEL, XP, KILL_XP,
        hero, attr, hasSkill, skillRank, perk, perkRoll, skillText, ROW_LEVEL, xpToNext, gainXp, killXp, skillBlock, learnSkill, spendPoints, discover, placeLevel, levelColor,
        combatMode, setCombatMode, maxBreath, breathNow, spendBreath, get breath() { return breathNow(); }, get winded() { return winded; }, RUN, canRun,
        hand, handMelee, switchHand, shield, pressAttack, pressDodge, hitPlayer, enemyHurtFx, hitstop, numberAt, sparksAt, shovePlayer,
        strMult, poiseMult, critChance, rollCost, rollIFrames, parryWindow, knockdownAt, carryBonus, gatherBonus, workSpeed, dexWork, tired, TIRED_AT, heroMhp, comboWindow, aimSteady, baseBreath, mapFreePlay,
        get act() { return act; }, get stopFrames() { return stopFrames; }, get ROLL_KIND() { return ROLL_KIND; }, get KNOCK_KIND() { return KNOCK_KIND; }, resetAct, Scene_Hero, unspent
    };
})();
