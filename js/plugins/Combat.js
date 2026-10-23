/*:
 * @target MZ
 * @plugindesc Walka i rozwój postaci: tryb walki (Tab, sam się włącza) - kombo i ciężki cios (O), blok i parowanie (P), zmiana broni ([ ]), przewrót (Spacja), cel (F), leczenie (H); oddech; atrybuty, poziomy, doświadczenie, umiejętności. v1.2.0
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
 *   F                następny cel miękkiego namierzania (miedziany krąg pod wrogiem; ciosy, garda i przewrót
 *                    liczą się względem celu) - Combat_Feel.js.
 *   H                szybkie leczenie: opatrunek (rana / mało życia) albo najlepsze jedzenie; ok. 0,6 s
 *                    bez obrony, kosztuje oddech - Combat_Feel.js.
 *   Enter, Esc, R    nic nie robią - akcja i menu wracają po wyjściu z trybu walki (Tab).
 * Tryb walki włącza się sam, gdy wróg zaczyna atak (i wyłącza po ok. 5 s spokoju) - Opcje: „Automatyczny
 * tryb walki”. Opcje: „Trudność walki” (Łatwy / Normalny / Trudny). Klawisz wciśnięty chwilę za wcześnie
 * (cios, przewrót, blok) czeka ok. 10 klatek i wykonuje się zaraz, gdy można.
 * W trybie normalnym: O = akcja, P = menu, [ i ] nic nie robią.
 * W obu trybach: Spacja = przewrót w kierunku strzałek (bez strzałek: odskok od celu albo najbliższego
 * wroga, a bez nich w tył) z chwilą nietykalności; po trafieniu ciosu przerywa jego końcówkę; C = skradanie. W menu i rozmowach O, P, Enter, Esc i Spacja działają zawsze jak OK / anuluj.
 *
 * Atak z ukrycia: cios w zwierzę, które cię jeszcze nie zauważyło (nie ma nad nim "!", nie walczy z tobą),
 * gdy się skradasz (C) albo podchodzisz od tyłu: 2,5 raza większe obrażenia (strzał z łuku i procy 2 razy)
 * i mocno zbita równowaga - liczy się jak ciężki cios, więc zatacza się nawet niedźwiedź. Więcej daje
 * Czujność (i Zręczność przy strzale) oraz umiejętność Zasadzka (Łowiectwo). Nad zwierzęciem: "Atak z ukrycia!".
 *
 * Zbroja: skórzana kurtka (garbarnia) - wystarczy mieć ją w torbie: każdy cios, który do ciebie dojdzie, jest
 * o 20% słabszy; kurtka się przy tym zużywa (naprawa w warsztacie). Widać ją w menu P -> Postać.
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
 * za pierwszy budynek danego rodzaju: zdarzenie build z done (Farming.js). Ludzie (etap 3, Humans.js):
 * doświadczenie przy poddaniu się albo śmierci (kill z noXp, gdy już było), wrogowie na mapie dla pasków
 * i przewrotu: Combat.foes() (zwierzęta Hunting.js + to, co dodaje Combat.addFoes); ciosy ludzi: hitPlayer
 * z projectile (strzała), guardBreak (łamie gardę), nonLethal + onBeaten (nie zabija - rabunek).
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
        { id: "wil", name: "Hart ducha", desc: "Odporność na strach i na „prawdy” z Serca: upiory i cienie z ruin biją w umysł - z Hartem ducha częściej się opierasz (a odparta prawda zatacza upiorem), a strach i zamęt trwają krócej." }
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
    Input.keyMapper[70] = "target";   // F: the next foe for the soft target (Combat_Feel.js, 2026-10-14) - only in the combat mode on the map
    Input.keyMapper[72] = "heal";     // H: the quick heal - a bandage or the best food (Combat_Feel.js) - only in the combat mode on the map
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
    // auto: switched by the game itself (Combat_Feel.js: a foe starts an attack - on; a calm moment after - off, only when it came on by
    // itself); the hero's own Tab is not auto. The bus "combatMode" { on, auto } says it.
    const COMBAT_KEYS = "Tryb walki: O atak, P obrona, Spacja przewrót, F cel, H leczenie, [ ] broń (Tab - wyjście)";
    function setCombatMode(on, auto) {
        const m = modes();
        m.mode = !!on;
        m.auto = !!on && !!auto;
        if (on || !auto) {
            se(on ? "Sword1" : "Equip2", 70, on ? 110 : 100);
            popup(on ? 76 : 0, on ? COMBAT_KEYS : "Tryb normalny: O - akcja, P - menu", on ? "#ffb07f" : "#eceef0");
        } else se("Equip2", 55, 90);   // (put away by itself: only the sound of the weapon going back)
        T.emit("combatMode", { on: !!on, auto: !!auto });
    }

    // ==================================================================
    // The hero: attributes, level, experience, skills
    // ==================================================================
    // the skill trees (Skills_Data.js): ten fields, each a tree of skills with ranks; a skill opens the way to the ones under it
    const SD = T.api("Skills_Data") || { TREES: [], SKILLS: [], FX: {}, ROW_LEVEL: [1] };
    const TREES = SD.TREES, SKILLS = SD.SKILLS, ROW_LEVEL = SD.ROW_LEVEL;
    const skillById = id => SKILLS.find(s => s.id === id) || null;

    // (attrInfo below works the effects out for a value the hero does not have yet - the next point: `attrOver` stands in for it)
    let attrOver = null;
    const attr = id => (attrOver && attrOver.id === id ? attrOver.v : $gameSystem ? hero().attr[id] : ATTR_START);
    // the rank of a skill (0: not learnt; a save from stage 1 keeps `true` = rank 1)
    const skillRank = id => { if (!$gameSystem) return 0; const v = hero().skills[id]; return v === true ? 1 : Number(v) || 0; };
    const hasSkill = id => skillRank(id) > 0;
    // Combat.perk(key): what the learnt skills add up to for one effect (Skills_Data.js fx: the value per rank times the rank);
    // every plugin asks it (e.g. Farming: "crop.growth"). Worked out again only when a skill is learnt or another game is loaded.
    let perkCache = null;
    // (2026-10-23) other sources of the same effects: Bron.js - the weapon in hand, the armour and the trinket worn
    // (Combat.addPerkSource(fn(key) -> number)); they count in every perk asked, the fight's own too
    const perkSources = [];
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
        let v = perkCache.sum[key] || 0;
        for (let i = 0; i < perkSources.length; i++) { try { v += perkSources[i](key) || 0; } catch (e) { /* (a source that failed this time) */ } }
        return v;
    }
    const addPerkSource = fn => { if (typeof fn === "function" && !perkSources.includes(fn)) perkSources.push(fn); };
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
    // (the user's values, 2026-09-24; the bear, stage 2: three boars' worth; the men of stage 3 (Humans.js): a bandit and an archer a bit more
    // than a boar - they think -, the mercenary three boars; the knife bandit as the one with the club)
    // the creatures of the ruins (stage 4, Creatures.js): a rat or a bat of a swarm little, the armour two boars, the stone sentinel more
    // than a bear; the bosses of the underground floors their own (the guardian of the tenth gate, then floors 20 ... 90)
    const KILL_XP = { rabbit: 5, deer: 10, boar: 20, wolf: 15, bear: 60, bandit: 30, knifer: 30, archer: 30, mercenary: 60,
        szczur: 4, nietoperz: 4, pajak: 25, topielec: 35, zbroja: 45, upior: 50, cien: 50, kamiennik: 70,
        guardian: 250, boss_20: 300, boss_30: 600, boss_40: 900, boss_50: 1200, boss_60: 1500, boss_70: 1800, boss_80: 2000, boss_90: 2500 };
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

    // ---- the foes on the map: Hunting.js's animals and what other plugins add (Humans.js: the men) - Combat.addFoes(fn -> [foe]); a foe
    // is a character with centerX/centerY, kind(), _hp/_maxHp, _poise/_maxPoise, _stun, _level, _engaged, _sprite (the bars, the roll's bump)
    const foeSources = [];
    function foes() {
        const Hn = T.api("Hunting"), out = Hn ? Hn.animals.slice() : [];
        for (const fn of foeSources) { try { out.push(...(fn() || [])); } catch (e) { /* a source that failed this frame */ } }
        return out;
    }

    // ---- what the attributes do
    const strMult = () => 1 + 0.035 * (attr("str") - ATTR_START);
    const poiseMult = () => 1 + 0.045 * (attr("str") - ATTR_START);
    const critChance = () => 0.03 + 0.007 * (attr("per") - ATTR_START) + perk("melee.crit");
    const rollCost = () => Math.max(10, Math.round(24 - 0.25 * (attr("dex") - ATTR_START)));
    const rollIFrames = () => Math.min(24, 13 + Math.floor(0.2 * (attr("dex") - ATTR_START))) + perk("roll.iframes");
    // (the difficulty of the fight - Combat_Feel.js, Opcje: Łatwy x1.5, Trudny x0.75)
    // (2026-10-23, Bron_Data.js: a light shield - the buckler, the round one - lengthens it: its `parry`)
    const shieldParry = () => { const f = P.fight, s = f && f.shield ? f.shield() : null; return s && s.parry > 0 ? s.parry : 0; };
    const parryWindow = () => Math.round((8 + 0.25 * (attr("per") - ATTR_START)) * (hasSkill("keen") ? 1.5 : 1) * (P.feel && P.feel.diff ? P.feel.diff().parry : 1) * (1 + shieldParry()));
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
    // Hart ducha (stage 4, Creatures.js): the chance to resist what hits the mind - a wraith's "truth", a shadow's fright. power: the
    // source's own strength (0..0.5); one of a higher level than the hero is harder to resist. 15% at 5, +3% a point, the skills on top
    function mindResist(power, level) {
        const over = level ? Math.max(-10, Math.min(10, level - hero().level)) : 0;
        return Math.max(0.05, Math.min(0.95, 0.15 + 0.03 * (attr("wil") - ATTR_START) + perk("mind.resist") - (power || 0) - 0.02 * over));
    }
    // how long fear or confusion holds him (frames): shorter with Hart ducha (1.5% a point, at most 65% off) and Spokojna głowa
    const mindTime = frames => Math.max(1, Math.round(frames * Math.max(0.35, 1 - 0.015 * (attr("wil") - ATTR_START)) * (1 - Math.min(0.5, perk("mind.short")))));
    // the hero's most health: 100, +5 per Kondycja over 5, +3 per level, and what the skills add
    const heroMhp = () => 100 + 5 * (attr("con") - ATTR_START) + 3 * (hero().level - 1) + perk("hp.max");
    const _Game_Actor_paramBase = Game_Actor.prototype.paramBase;
    Game_Actor.prototype.paramBase = function(paramId) {
        const lead = $gameParty && $gameParty._actors && $gameParty._actors.length ? $gameParty._actors[0] : ($dataSystem.partyMembers || [])[0];
        if (paramId === 0 && $gameSystem && lead === this.actorId()) return heroMhp();
        return _Game_Actor_paramBase.call(this, paramId);
    };
    // What an attribute does, in numbers - now and with one point more (the card's bubble, MenuRing.js): the same functions as above
    // (and Combat_Fight's breath and blow from hiding), worked out with the value put in for a moment.
    // -> { id, name, desc, value, max, rows: [{ label, now, next }] } (next "" at the top)
    const num = (v, d) => { let t = (Math.round(v * Math.pow(10, d || 0)) / Math.pow(10, d || 0)).toFixed(d || 0); if (t.includes(".")) t = t.replace(/0+$/, "").replace(/\.$/, ""); return t.replace(".", ","); };
    const pct = (v, d) => num(v, d) + "%";
    const sec = f => (f / 60).toFixed(2).replace(".", ",") + " s";
    const signed = (v, d) => (v >= 0 ? "+" : "") + pct(v, d);
    const mult = v => "×" + v.toFixed(2).replace(".", ",");
    const ATTR_FX = {
        str: [["Obrażenia wręcz", () => signed((strMult() - 1) * 100, 1)], ["Zbijanie równowagi wroga", () => signed((poiseMult() - 1) * 100, 1)],
            ["Udźwig", () => "+" + carryBonus()], ["Mniej uderzeń przy zbieraniu", () => "-" + pct(gatherBonus() * 100, 1)]],
        dex: [["Przewrót: koszt oddechu", () => String(rollCost())], ["Przewrót: nietykalność", () => sec(rollIFrames())],
            ["Czas na kolejny cios serii", () => sec(comboWindow())], ["Czas celowania (łuk, proca)", () => pct(aimSteady() * 100)],
            ["Szybkość pracy", () => signed((dexWork() - 1) * 100)]],
        con: [["Życie (najwięcej)", () => String(heroMhp())], ["Oddech (wypoczęty, syty)", () => String(baseBreath())],
            ["Próg przewrócenia", () => String(knockdownAt())], ["Szansa na ranę (od zwykłej)", () => pct(woundChance(1) * 100, 1)]],
        per: [["Okno parowania", () => sec(parryWindow())], ["Trafienie krytyczne", () => pct(critChance() * 100, 1)],
            ["Cios z ukrycia", () => { const f = F(); return f && f.sneakMult ? mult(f.sneakMult(false)) : "-"; }]],
        wil: [["Opór: strach i „prawdy”", () => pct(mindResist(0, 0) * 100)], ["Strach i zamęt trwają", () => pct(mindTime(1000) / 10)]]
    };
    function withAttr(id, v, fn) {
        const was = attrOver;
        attrOver = { id, v };
        try { return fn(); } finally { attrOver = was; }
    }
    function attrInfo(id) {
        const a = ATTRS.find(x => x.id === id);
        if (!a) return null;
        const v = attr(id), top = v >= ATTR_MAX;
        const rows = (ATTR_FX[id] || []).map(([label, fn]) => ({ label, now: withAttr(id, v, fn), next: top ? "" : withAttr(id, v + 1, fn) }));
        return { id, name: a.name, desc: a.desc, value: v, max: ATTR_MAX, rows };
    }

    // What the hero's blows do, in numbers (the Postać tab's "Obrażenia", MenuRing.js): the weapon in his right hand (Combat_Fight's
    // hand(): the one of the combat mode) - the same multipliers as a blow that lands (strike): the series, the charged blow, the crit,
    // the knock to the balance, the breath; the bow / the sling (Hunting_Weapons.js): the shot. The fists beside it.
    // -> { hand, ranged, weapon: { id, name, hit, series[], heavy, heavyFull, crit, poise, poiseLast, poiseHeavy, breath, reach, fire },
    //      fists, critChance, critMul }
    function meleeInfo(id) {
        const f = F(), w = (f.weaponNow ? f.weaponNow(id) : null) || f.MELEE[id] || f.MELEE[0], s = strMult() * (1 + perk("melee.dmg")), pz = poiseMult() * (1 + perk("melee.poise")), cm = f.COMBO_MULT;
        const n = f.maxCombo ? f.maxCombo(w) : w.combo.length, hit = m => Math.max(1, Math.round(w.dmg * m * s));
        return { id, name: w.name, hit: hit(1), series: Array.from({ length: n }, (_, i) => hit(cm[Math.min(i, cm.length - 1)])), heavy: hit(f.HEAVY.mult),
            heavyFull: hit(f.HEAVY.full), crit: hit(1.6), poise: Math.round(w.poise * pz), poiseLast: Math.round(w.poise * pz * 1.5), poiseHeavy: Math.round(w.poise * pz * f.HEAVY.poise),
            breath: Math.round(w.cost * (1 - perk("melee.breath"))), reach: w.reach, fire: !!w.fire, fireBonus: w.fireBonus || 0, sweep: !!w.sweep && hasSkill("sweep"),
            critBonus: w.crit || 0, lack: w.lack || 0, poziom: w.poziom || 1 };
    }
    function fightInfo() {
        const f = F(), h = f.hand ? f.hand() || "m0" : "m0", out = { hand: h, ranged: h === "ranged", critChance: critChance(), critMul: 1.6, fists: meleeInfo(0) };
        if (h !== "ranged") { out.weapon = meleeInfo(Number(h.slice(1)) || 0); return out; }
        const HW = (T.api("Hunting_parts") || {}).weapons, has = id => !!$dataItems[id] && $gameParty.numItems($dataItems[id]) > 0;
        // (2026-10-23: the bow or the sling in hand - the best one owned, Bron.js's variants too)
        const item = f.rangedItem ? f.rangedItem() : has(126) && has(127) ? 126 : 125, key = f.rangedKind ? f.rangedKind(item) : item === 126 ? "bow" : "sling";
        const def = HW && HW.defOf ? HW.defOf(key) : HW && HW.WEAPONS ? HW.WEAPONS[key] : null;
        const dmg = def ? Math.round(def.damage * (1 + 0.02 * (attr("dex") - ATTR_START)) * (1 + perk("ranged.dmg"))) : 0;
        out.weapon = { id: item, name: $dataItems[item] ? $dataItems[item].name : key, shot: dmg, range: def ? def.range : 0, ammo: def ? def.ammo : 0,
            ammoLeft: def && $dataItems[def.ammo] ? $gameParty.numItems($dataItems[def.ammo]) : 0, aim: aimSteady(), breath: def ? def.stamina : 0 };
        return out;
    }
    // What keeps him whole (the Postać tab's "Odporności"): the most health, the breath, the armour and the shield worn (Equipment.js:
    // only what is worn), the wound, the fall, the cold, the mind, the parry and the roll
    function defenseInfo() {
        const f = F(), ar = f.armor ? f.armor() : null, sh = f.shield ? f.shield() : null, E = T.api("Equipment");
        const cloak = E && E.worn ? E.worn(112) : !!$dataItems[112] && $gameParty.numItems($dataItems[112]) > 0;
        return { mhp: heroMhp(), breath: baseBreath(), armor: ar ? { id: ar.id, name: ar.name, reduce: ar.reduce } : null, shield: sh ? { id: sh.id, name: sh.name, reduce: sh.reduce, breath: sh.breath } : null,
            bare: f.NO_SHIELD ? f.NO_SHIELD.reduce : 0.45, blockPerk: perk("block.reduce"), wound: woundChance(1), knock: knockdownAt(), cloak, cold: perk("cold"), mind: mindResist(0, 0),
            parry: parryWindow(), rollCost: rollCost(), rollIFrames: rollIFrames(), hurt: Math.min(0.6, perk("hurt")) };
    }

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
    // (noXp: a man already paid for when he gave up - Humans.js; 2026-10-17, Starcia.js: another's kill - a wolf's, a bandit's arrow, the
    // boar's charge - gives him nothing: only his own and his dog's)
    T.on("kill", e => {
        if (e.noXp || (e.by && e.by !== "hero" && e.by !== "dog" && e.by !== "eagle")) return;   // (2026-10-18: the white eagle's too - Orzel.js)
        const H = T.api("Hunting");
        gainXp(killXp(e.kind, e.level), e.name || ((H && H.SPECIES[e.kind]) || {}).name);
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
        if (P.feel) P.feel.update(scene);   // (the automatic combat mode, the soft target, the attacks' warnings - Combat_Feel.js)
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
        if (P.feel) P.feel.addLayer(this);   // (the soft target's ring, the attacks' outlines - Combat_Feel.js)
    };
    const _Scene_Map_createSpriteset = Scene_Map.prototype.createSpriteset;
    Scene_Map.prototype.createSpriteset = function() {
        _Scene_Map_createSpriteset.call(this);
        UI().addHud(this);
        if (P.feel) P.feel.addHud(this);   // (the arrows at the screen's edge - Combat_Feel.js)
    };
    const _Sprite_Character_update = Sprite_Character.prototype.update;
    Sprite_Character.prototype.update = function() {
        _Sprite_Character_update.call(this);
        UI().updateCharacter(this);
    };
    // ---- the fight's options (2026-10-14, Combat_Feel.js reads them), kept in the config file like the volumes: "Automatyczny tryb walki"
    // (Wł / Wył, on by default) and "Trudność walki" (Łatwy / Normalny / Trudny, Normalny by default). Rows after the game's switches
    // (OptionEx.js: always run, remember the command...), in both looks (Window_Options draws the Grafit one too - MenuRing.js)
    const OPTS = { auto: "combatAuto", diff: "combatDifficulty" };
    const OPT_DEFAULTS = { [OPTS.auto]: true, [OPTS.diff]: 1 };
    const DIFF_NAMES = ["Łatwy", "Normalny", "Trudny"];
    const OPT_ROWS = [["Automatyczny tryb walki", OPTS.auto], ["Trudność walki", OPTS.diff]];
    for (const k in OPT_DEFAULTS) if (ConfigManager[k] === undefined) ConfigManager[k] = OPT_DEFAULTS[k];
    const _Config_makeData = ConfigManager.makeData;
    ConfigManager.makeData = function() {
        const config = _Config_makeData.call(this);
        for (const k in OPT_DEFAULTS) config[k] = this[k] === undefined ? OPT_DEFAULTS[k] : this[k];
        return config;
    };
    const _Config_applyData = ConfigManager.applyData;
    ConfigManager.applyData = function(config) {
        _Config_applyData.call(this, config);
        const v = config ? config[OPTS.auto] : undefined, d = config ? Number(config[OPTS.diff]) : NaN;
        this[OPTS.auto] = v === undefined ? OPT_DEFAULTS[OPTS.auto] : !!v;
        this[OPTS.diff] = d >= 0 && d <= 2 ? Math.round(d) : OPT_DEFAULTS[OPTS.diff];
    };
    const _Options_addGeneral = Window_Options.prototype.addGeneralOptions;
    Window_Options.prototype.addGeneralOptions = function() {
        _Options_addGeneral.call(this);
        const SWITCHES = ["alwaysDash", "commandRemember", "touchUI", "switchABButtons", "fastMessage"];
        let at = -1;
        this._list.forEach((c, i) => { if (SWITCHES.includes(c.symbol)) at = i; });
        const rows = OPT_ROWS.map(([name, symbol]) => ({ name, symbol, enabled: true, ext: null }));
        this._list.splice(at >= 0 ? at + 1 : this._list.length, 0, ...rows);
    };
    const _Options_isBoolean = Window_Options.prototype.isBooleanSymbol;
    Window_Options.prototype.isBooleanSymbol = function(symbol) {
        return symbol === OPTS.auto || (!!_Options_isBoolean && _Options_isBoolean.call(this, symbol));
    };
    const _Options_isNumeric = Window_Options.prototype.isNumericSymbol;
    Window_Options.prototype.isNumericSymbol = function(symbol) {
        return symbol === OPTS.diff || (!!_Options_isNumeric && _Options_isNumeric.call(this, symbol));
    };
    const _Options_statusText = Window_Options.prototype.statusText;
    Window_Options.prototype.statusText = function(index) {
        const symbol = this.commandSymbol(index);
        if (symbol === OPTS.auto) return this.getConfigValue(symbol) ? "Wł" : "Wył";
        if (symbol === OPTS.diff) return DIFF_NAMES[this.getConfigValue(symbol)] || DIFF_NAMES[1];
        return _Options_statusText.call(this, index);
    };
    // the difficulty: one step at a time, round (Łatwy -> Normalny -> Trudny -> Łatwy with O; A / D no further than the ends)
    const _Options_changeNumber = Window_Options.prototype.changeNumberBySymbol;
    Window_Options.prototype.changeNumberBySymbol = function(symbol, forward, skip, wrap, offsetValue) {
        if (symbol !== OPTS.diff) return _Options_changeNumber.apply(this, arguments);
        const v = Number(this.getConfigValue(symbol)) || 0, next = v + (forward ? 1 : -1);
        this.changeValue(symbol, next > 2 ? (wrap ? 0 : 2) : next < 0 ? (wrap ? 2 : 0) : next);
    };
    if (!_Options_changeNumber) {   // (without OptionEx.js: the engine's own keys)
        const _ok = Window_Options.prototype.processOk, _right = Window_Options.prototype.cursorRight, _left = Window_Options.prototype.cursorLeft;
        const step = (w, f, wrap) => { const v = Number(w.getConfigValue(OPTS.diff)) || 0, n = v + (f ? 1 : -1); w.changeValue(OPTS.diff, n > 2 ? (wrap ? 0 : 2) : n < 0 ? (wrap ? 2 : 0) : n); };
        Window_Options.prototype.processOk = function() { if (this.commandSymbol(this.index()) === OPTS.diff) step(this, true, true); else _ok.call(this); };
        Window_Options.prototype.cursorRight = function() { if (this.commandSymbol(this.index()) === OPTS.diff) step(this, true, false); else _right.apply(this, arguments); };
        Window_Options.prototype.cursorLeft = function() { if (this.commandSymbol(this.index()) === OPTS.diff) step(this, false, false); else _left.apply(this, arguments); };
    }
    const _Options_restore = Window_Options.prototype.restoreDefaultValues;
    if (_Options_restore) {
        Window_Options.prototype.restoreDefaultValues = function() {
            _Options_restore.call(this);
            for (const k in OPT_DEFAULTS) ConfigManager[k] = OPT_DEFAULTS[k];
        };
    }
    // the graphite look (MenuRing.js) writes "Tak" / "Nie" for a switch: this one says "Wł" / "Wył" there too, in the same style (put round
    // the row drawing once every plugin is in, so it is the outer one - as Mood.js does)
    let optDrawWrapped = false;
    function wrapOptionDraw() {
        if (optDrawWrapped) return;
        optDrawWrapped = true;
        const _drawItem = Window_Options.prototype.drawItem;
        Window_Options.prototype.drawItem = function(index) {
            const symbol = this.commandSymbol(index), CH = T.api("CleanHUD");
            if (symbol === OPTS.auto && T.api("MenuRing") && CH && CH.isClean && CH.isClean() && CH.textOut && this.itemLineRect) {
                const r = this.itemLineRect(index, false), s = this.itemLineRect(index, true), c = this.contents, C = CH.C, on = !!this.getConfigValue(symbol);
                CH.textOut(c, this.commandName(index), r.x, r.y, r.width, r.height, "left", { size: 18, color: C.text, plain: true });
                CH.textOut(c, on ? "Wł" : "Wył", s.x, s.y, s.width - 4, s.height, "right", { size: 17, color: on ? C.accent : C.muted, plain: true });
                return;
            }
            _drawItem.call(this, index);
        };
    }
    if (window.SceneManager && SceneManager._scene && !(SceneManager._scene instanceof Scene_Boot)) wrapOptionDraw();
    else {
        const _bootStart = Scene_Boot.prototype.start;
        Scene_Boot.prototype.start = function() {
            wrapOptionDraw();
            _bootStart.call(this);
        };
    }
    const option = key => (ConfigManager[OPTS[key]] === undefined ? OPT_DEFAULTS[OPTS[key]] : ConfigManager[OPTS[key]]);

    // a map event about to start: an automatic combat mode goes off before a talk or a riddle (Combat_Feel.js beforeEvent) - the core's one
    // start hook (2026-10-23), "before": told only when no other system took the start (a hidden character, the dice table), never takes it
    T.onEventStart(ev => {
        if (P.feel && P.feel.beforeEvent) { try { P.feel.beforeEvent(ev); } catch (e) { /* never stop the event */ } }
        return false;
    }, { owner: "Combat", priority: "before" });
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
        aimSteady, baseBreath, heroMhp, combatMode, setCombatMode, mapFreePlay, se, popup, foes, mindResist, mindTime, attrInfo, fightInfo, defenseInfo,
        option, OPTS, DIFF_NAMES, COMBAT_KEYS };
    const fight = name => function() { const f = F(); return f[name].apply(f, arguments); };
    window.Combat = T.register("Combat", {
        ATTRS, SKILLS, TREES, get MELEE() { return F().MELEE; }, get SHIELDS() { return F().SHIELDS; }, get ARMORS() { return F().ARMORS; }, armor: fight("armor"),
        get SNEAK() { return F().SNEAK; }, sneakAttack: fight("sneakAttack"), sneakMult: fight("sneakMult"), MAX_LEVEL, ATTR_MAX, POINTS_PER_LEVEL, XP, KILL_XP,
        hero, attr, hasSkill, skillRank, perk, perkRoll, addPerkSource, skillText, ROW_LEVEL, xpToNext, gainXp, killXp, skillBlock, learnSkill, spendPoints, discover, placeLevel, levelColor,
        combatMode, setCombatMode, maxBreath: fight("maxBreath"), breathNow: fight("breathNow"), spendBreath: fight("spendBreath"),
        get breath() { return F().breathNow(); }, get winded() { return F().isWinded(); }, get RUN() { return F().RUN; }, canRun: fight("canRun"),
        hand: fight("hand"), handMelee: fight("handMelee"), switchHand: fight("switchHand"), setHand: fight("setHand"), handChoices: fight("handChoices"), attrInfo, fightInfo, defenseInfo, meleeInfo, woundChance,
        shield: fight("shield"), pressAttack: fight("pressAttack"), rangedItem: fight("rangedItem"), weaponNow: fight("weaponNow"), refreshGear: fight("refreshGear"),
        pressDodge: fight("pressDodge"), hitPlayer: fight("hitPlayer"), enemyHurtFx: fight("enemyHurtFx"), hitstop: fight("hitstop"), numberAt: fight("numberAt"),
        sparksAt: fight("sparksAt"), shovePlayer: fight("shovePlayer"), recoil: fight("recoil"), downPlayer: fight("downPlayer"), foes, addFoes: fn => { foeSources.push(fn); },
        stunPlayer: fight("stunPlayer"), drainBreath: fight("drainBreath"), mindResist, mindTime,
        strMult, poiseMult, critChance, rollCost, rollIFrames, parryWindow, knockdownAt, carryBonus, gatherBonus, workSpeed, dexWork, tired, TIRED_AT, heroMhp, comboWindow, aimSteady, baseBreath, mapFreePlay,
        get act() { return F().act; }, get stopFrames() { return F().stopFrames(); }, get ROLL_KIND() { return F().ROLL_KIND; }, get KNOCK_KIND() { return F().KNOCK_KIND; },
        resetAct: fight("resetAct"), get Scene_Hero() { return UI().Scene_Hero; }, unspent,
        get feel() { return P.feel || null; }   // (Combat_Feel.js: the automatic combat mode, the soft target, the warnings, the quick heal, the dummy, the difficulty)
    });

    // the parts not in js/plugins.js yet: put into the page here (after every plugin - functions and classes only, every engine hook
    // is above, so nothing moves in the chain)
    for (const part of ["Combat_Fight", "Combat_UI", "Combat_Feel"]) {
        if (!(window.$plugins || []).some(p => p && p.name === part && p.status)) PluginManager.loadScript(part);
    }
})();
