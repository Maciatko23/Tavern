//=============================================================================
// Combat_Fight.js
//=============================================================================
// The fight itself (split out of Combat.js, 2026-09-29): the breath and running, the weapon in hand, the blows (the combo, the
// charged blow), the roll, the guard and the parry, an enemy's blow on the hero, the hitstop and the floating numbers and sparks
// (their data - Combat_UI.js draws them). Functions only: Combat.js holds every engine hook and calls these.

/*:
 * @target MZ
 * @plugindesc Walka (część Combat.js): oddech i bieg, broń w ręku, ciosy i kombo, ciężki cios, przewrót, blok i parowanie, ciosy wrogów w bohatera. Sama nic nie robi - parametry i haki ma Combat.js. v1.0.0
 * @author Tawerna
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base Combat
 * @orderAfter Combat
 *
 * @help
 * ============================================================================
 * Combat_Fight.js - walka
 * ============================================================================
 * Część Combat.js (wydzielona z niego): jak bohater walczy - oddech, bieg,
 * broń w ręku, ciosy, przewrót, blok, parowanie i co robi z nim cios wroga.
 * Sama nic nie robi: woła ją Combat.js (klawisze, haki silnika, zegar mapy).
 * Parametry ma Combat.js.
 *
 * KOLEJNOŚĆ: Skills_Data, Combat, Combat_Fight, Combat_UI. Dopóki nie jest
 * wpisana na listę wtyczek, Combat.js wczytuje ją sam.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Combat_Fight.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const P = T.api("Combat_parts") || T.register("Combat_parts", {});
    if (P.fight) return;   // (put into the page twice: kept as it was)
    if (!P.core) throw new Error("Combat_Fight.js: musi być pod Combat.js na liście wtyczek (Combat.js is missing or below)");
    const { modes, attr, perk, hasSkill, tired, strMult, poiseMult, critChance, rollCost, rollIFrames, parryWindow, knockdownAt, woundChance, comboWindow,
        combatMode, setCombatMode, mapFreePlay, se, popup, foes } = P.core;
    const H = () => T.api("Hunting");
    const FE = () => P.feel || null;   // (Combat_Feel.js, put in after this part: the soft target, the threats, the difficulty)

    // ==================================================================
    // Breath: the short combat bar (not saved: it fills in seconds)
    // ==================================================================
    let breath = -1, breathSpent = 0, winded = false;
    function maxBreath() {
        let m = 100 * (0.9 + 0.02 * attr("con"));
        const st = typeof $gameSystem.staminaRatio === "function" ? $gameSystem.staminaRatio() : 1;
        m *= 0.65 + 0.35 * st;   // tired: shorter breath
        const N = T.api("Needs");
        if (N && N.enabled && N.enabled()) {
            const n = N.state();
            if (n.food < 25) m *= 0.85;
            if (n.water < 25) m *= 0.85;
        }
        if (typeof $gameSystem.isWounded === "function" && $gameSystem.isWounded()) m *= 0.85;
        m *= 1 - gearBreathCut();   // (2026-10-23: heavy armour and shields - Bron_Data.js `kara.oddech`)
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
    // breath taken from outside, without a word (stage 4, Creatures.js: a drowned one's grip, a wraith's cold touch, fear); what is left
    function drainBreath(amount) {
        breath = Math.max(0, breathNow() - Math.max(0, amount || 0));
        breathSpent = 0;
        if (breath <= 0) winded = true;
        return breath;
    }
    let noBreathT = 0;
    function noBreath() {
        if (noBreathT > 0) return;
        noBreathT = 60;
        popup(82, "Brak tchu!", "#ff9f8f");
        se("Buzzer1", 45, 120);
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
    const CT = T.api("ChoppableTree");
    const swingKindOf = key => (CT && CT.swingKindOf ? CT.swingKindOf(key) : -1);
    const CLUB = swingKindOf("Swing_Club") >= 0 ? swingKindOf("Swing_Club") : 3;   // (its own quick swing)
    const PUNCH = swingKindOf("Swing_Punch");   // (-1: no sheet, the blow lands at once)
    const TORCH_SWING = swingKindOf("torch") >= 0 ? swingKindOf("torch") : CLUB;   // (Torch.js: the burning torch's own sweep)
    // the roll and the fall (ChoppableTree.js swing kinds): -1 when the picture is not in the game (Combat_UI.js turns the figure then)
    const ROLL_KIND = swingKindOf("Swing_Roll"), KNOCK_KIND = swingKindOf("knockdown");
    const FIST_ICON = 419;
    const MELEE = {
        0: { name: "Pięści", dmg: 5, poise: 12, reach: 1.15, cone: 0.5, cost: 7, combo: [PUNCH, PUNCH, PUNCH], heavy: PUNCH, hold: 5, se: "Blow1", sweep: false },   // (no weapon)
        156: { name: "Pałka", dmg: 13, poise: 26, reach: 1.45, cone: 0.45, cost: 10, combo: [CLUB, CLUB, CLUB], heavy: CLUB, hold: 7, se: "Blow1", sweep: false },
        // the burning torch (Torch.js; a weapon only while it burns - in hand or stuck in the ground beside him): lighter than the club,
        // a wider sweep; fire: an animal burns a moment (Torch.FIRE) and fears it (Torch.FEAR), a man or a creature takes fireBonus more
        59: { name: "Pochodnia", dmg: 10, poise: 16, reach: 1.45, cone: 0.4, cost: 9, combo: [TORCH_SWING, TORCH_SWING, TORCH_SWING], heavy: TORCH_SWING, hold: 6, se: "Fire1", sweep: false, fire: true, fireBonus: 4 },
        115: { name: "Żelazna siekiera", dmg: 26, poise: 30, reach: 1.6, cone: 0.35, cost: 16, combo: [3, 3, 0], heavy: 0, hold: 10, se: "Slash2", sweep: true },
        60: { name: "Kamienna siekiera", dmg: 17, poise: 24, reach: 1.55, cone: 0.35, cost: 16, combo: [3, 3, 0], heavy: 0, hold: 10, se: "Blow2", sweep: true },
        154: { name: "Oszczep", dmg: 20, poise: 16, reach: 2.25, cone: 0.75, cost: 12, combo: [15, 15, 15], heavy: 15, hold: 9, se: "Slash4", sweep: false },
        116: { name: "Żelazny kilof", dmg: 30, poise: 42, reach: 1.45, cone: 0.45, cost: 22, combo: [1, 1], heavy: 1, hold: 14, se: "Blow6", sweep: true },
        63: { name: "Kamienny kilof", dmg: 22, poise: 36, reach: 1.45, cone: 0.45, cost: 22, combo: [1, 1], heavy: 1, hold: 14, se: "Blow6", sweep: true }
    };
    const MELEE_ORDER = [115, 154, 60, 116, 63, 156, 59];
    const TORCH_ITEM = 59;
    const torchLit = () => !!T.call("Torch", "inHand");
    const COMBO_MULT = [1, 1.1, 1.45, 1.6];
    const HEAVY = { min: 18, max: 60, mult: 2.2, full: 2.7, poise: 2.5, cost: 0.8 };
    const SHIELDS = { 155: { name: "Drewniana tarcza", reduce: 0.75, breath: 0.7 } };
    const NO_SHIELD = { reduce: 0.45, breath: 1 };
    // Armour (stage 2, 2026-10-05): reduce: the part of every blow it takes off (after the guard; Niezłomny comes on top); each blow that
    // still hurts wears it (Durability.js "block": its blows). The shield and the armour work only worn (Equipment.js, 2026-10-08: the
    // shield in the left hand - not while the burning torch is there -, the jacket on the torso); without Equipment.js: owned is worn.
    const ARMORS = { 171: { name: "Skórzana kurtka", reduce: 0.2 } };
    const has = id => !!$dataItems[id] && $gameParty.numItems($dataItems[id]) > 0;
    const meleeOwned = () => { refreshGear(); return MELEE_ORDER.filter(id => (id === TORCH_ITEM ? torchLit() : has(id))); };   // (the torch: while it burns)

    // ==================================================================
    // The gear from the items' notes (2026-10-23, docs/ekwipunek/PLAN_BRON_ZBROJE.md - the list: BRON_LISTA.md): <Bron:rodzaj,material>
    // -> MELEE, <Tarcza:wzor> -> SHIELDS, <Zbroja:miejsce,wzor> -> ARMORS, with the numbers of Bron_Data.js (an item it does not list: its
    // kind x its material). Read again when the database changes; until the notes are there the old weapons above stay as they are (their
    // notes bring the same numbers). The bows and the slings with notes are Bron.js's ranged variants (Hunting_Weapons.defOf).
    // A thing of a level above the hero's works weaker (Bron_Data.brak: 3% a level, at most 45%): weaponNow, shield, armor.
    // ==================================================================
    const BD = () => T.api("Bron_Data");
    const SWING = { club: () => ({ combo: [CLUB, CLUB, CLUB], heavy: CLUB, hold: 7 }), punch: () => ({ combo: [PUNCH, PUNCH, PUNCH], heavy: PUNCH, hold: 5 }),
        axe: () => ({ combo: [3, 3, 0], heavy: 0, hold: 10 }), pick: () => ({ combo: [1, 1], heavy: 1, hold: 14 }), spear: () => ({ combo: [15, 15, 15], heavy: 15, hold: 9 }),
        // (2026-10-23) the sword's own wide slash (Hero_Sword: miecz, tasak, szabla, dlugi_miecz); without the sheet: the club
        sword: () => { const k = swingKindOf("sword"); return k >= 0 ? { combo: [k, k, k], heavy: k, hold: 8 } : SWING.club(); } };
    const OLD_ORDER = MELEE_ORDER.slice();
    const NOTE = { bron: /<Bron:\s*([a-z_]+)\s*,\s*([a-z_]+)\s*(?:,\s*[A-Za-z0-9_]+\s*)?>/, tarcza: /<Tarcza:\s*[A-Za-z0-9_]+\s*>/, zbroja: /<Zbroja:\s*([a-z]+)\s*,/ };
    let gearOf = null, gearLen = 0;
    function refreshGear(force) {
        const d = BD();
        if (!d || !window.$dataItems || (!force && gearOf === $dataItems && gearLen === $dataItems.length)) return false;
        gearOf = $dataItems;
        gearLen = $dataItems.length;
        const fresh = [];
        for (const it of $dataItems) {
            if (!it || !it.name || !it.note || it.id === TORCH_ITEM) continue;
            const m = NOTE.bron.exec(it.note);
            if (m) {
                const known = d.przedmiot(it.id), M = d.MATERIALY[m[2]];
                const p = known || { id: it.id, rodzaj: m[1], material: m[2], poziom: M && M.poziom ? M.poziom[0] : 1 }, s = d.staty(p);
                if (s && !s.dystans && SWING[s.zamach]) {
                    MELEE[it.id] = Object.assign({ name: it.name, dmg: s.dmg, poise: s.poise, reach: s.reach, cone: s.cone, cost: s.cost, se: s.se || "Blow1", sweep: !!s.sweep,
                        crit: s.crit || 0, pancerz: s.pancerz || 1, zwierz: s.zwierz || 1, ukrycie: s.ukrycie || 1, klasa: s.klasa || "blunt", poziom: p.poziom || 1 }, SWING[s.zamach]());
                    if (!OLD_ORDER.includes(it.id)) fresh.push(it.id);
                }
                continue;
            }
            const p = d.przedmiot(it.id);
            if (!p) continue;
            if (p.typ === "tarcza" && NOTE.tarcza.test(it.note))
                SHIELDS[it.id] = { name: it.name, reduce: p.blok, breath: p.oddechBloku, parry: p.parowanie || 0, cover: p.oslona || 0, kara: p.kara || {}, poziom: p.poziom || 1 };
            else if (p.typ === "zbroja" && NOTE.zbroja.test(it.note))
                ARMORS[it.id] = { name: it.name, reduce: p.obrona, miejsce: p.miejsce, kara: p.kara || {}, piesci: p.piesci || null, poziom: p.poziom || 1 };
        }
        // the order of [ ] (and the weapon taken when none was chosen): the new ones - the best first (the level, then the blow) - then the old ones
        fresh.sort((a, b) => (MELEE[b].poziom - MELEE[a].poziom) || (MELEE[b].dmg - MELEE[a].dmg) || a - b);
        MELEE_ORDER.length = 0;
        MELEE_ORDER.push(...fresh, ...OLD_ORDER);
        gearAt = -1;
        return true;
    }
    const heroLevel = () => { const c = P.core; try { return c && c.hero && window.$gameSystem ? c.hero().level || 1 : 1; } catch (e) { return 1; } };
    const lackOf = poziom => { const d = BD(); return poziom > 1 && d && d.brak ? d.brak(poziom, heroLevel()) : 0; };
    // the weapon as it strikes now: its level's lack (weaker, dearer in breath) and, for the fists, the gauntlets (armour with `piesci`)
    function weaponNow(id) {
        refreshGear();
        const w = MELEE[id];
        if (!w) return null;
        const lack = lackOf(w.poziom), ar = id === 0 ? armor() : null, fist = ar && ar.piesci ? ar.piesci : null;
        if (!lack && !fist) return w;
        const o = Object.assign({}, w);
        if (fist) { o.dmg += fist.dmg || 0; o.poise += fist.poise || 0; }
        if (lack) { o.dmg = Math.max(1, Math.round(o.dmg * (1 - lack))); o.poise = Math.round(o.poise * (1 - lack)); o.cost = Math.round(o.cost * (1 + lack)); o.lack = lack; }
        return o;
    }
    function shield() {
        refreshGear();
        const E = T.api("Equipment");
        const ids = E && E.current ? [E.current("left")] : Object.keys(SHIELDS).map(Number).filter(has);
        for (const id of ids) {
            if (!id || !SHIELDS[id]) continue;
            const s = SHIELDS[id], lack = lackOf(s.poziom), o = Object.assign({ id: Number(id) }, s);
            if (lack) { o.reduce = s.reduce * (1 - lack); o.parry = (s.parry || 0) * (1 - lack); o.lack = lack; }
            return o;
        }
        return null;
    }
    // the armour worn, all its pieces together: { id (the torso's piece, else the first), name, reduce (their sum, at most
    // Bron_Data.ZBROJA_MAX), pieces: [{ id, name, reduce }], kara: { oddech, skradanie, chod } (summed), piesci }
    const ARMOR_PARTS = ["torso", "head", "hands", "legs", "feet"];
    function armor() {
        refreshGear();
        const E = T.api("Equipment"), ids = [];
        if (E && E.current) { for (const part of ARMOR_PARTS) { const id = E.current(part); if (id && ARMORS[id] && !ids.includes(id)) ids.push(id); } }
        else for (const id of Object.keys(ARMORS).map(Number)) if (has(id)) ids.push(id);
        if (!ids.length) return null;
        const pieces = [], kara = { oddech: 0, skradanie: 0, chod: 0 };
        let reduce = 0, piesci = null;
        for (const id of ids) {
            const a = ARMORS[id], lack = lackOf(a.poziom), r = a.reduce * (1 - lack);
            reduce += r;
            pieces.push({ id, name: a.name, reduce: r, lack });
            const k = a.kara || {};
            kara.oddech += k.oddech || 0;
            kara.skradanie += k.skradanie || 0;
            kara.chod += k.chod || 0;
            if (a.piesci) piesci = { dmg: Math.round((a.piesci.dmg || 0) * (1 - lack)), poise: Math.round((a.piesci.poise || 0) * (1 - lack)) };
        }
        const max = BD() && BD().ZBROJA_MAX ? BD().ZBROJA_MAX : 0.65, main = pieces[0];
        return { id: main.id, name: main.name, reduce: pieces.length > 1 ? Math.min(max, reduce) : reduce, pieces, kara, piesci };
    }
    // the breath the heavy gear takes off (the armour's and the shield's `oddech`, at most a third) - worked out once a frame
    let gearAt = -1, gearBreath = 0;
    function gearBreathCut() {
        if (gearAt !== Graphics.frameCount) {
            gearAt = Graphics.frameCount;
            const ar = armor(), sh = shield();
            gearBreath = Math.min(0.33, (ar ? ar.kara.oddech : 0) + (sh && sh.kara ? sh.kara.oddech || 0 : 0));
        }
        return gearBreath;
    }
    // the bow / the sling in hand (2026-10-23): the best one owned - Bron.js's variants too - else the old 126 / 125
    const BR = () => T.api("Bron");
    function rangedItem() {
        const b = BR(), id = b && b.rangedItem ? b.rangedItem() : 0;
        return id || (has(126) && has(127) ? 126 : has(125) ? 125 : has(126) ? 126 : 0);
    }
    const rangedKind = id => { const b = BR(); return b && b.rangedKind ? b.rangedKind(id) : id === 126 ? "bow" : "sling"; };
    const hasRanged = () => { const b = BR(); return b && b.hasRanged ? b.hasRanged() : (has(126) && has(127)) || (has(125) && has(64)); };
    const anyRanged = () => { const b = BR(); return b && b.anyRanged ? b.anyRanged() : has(125) || has(126); };

    // ==================================================================
    // A blow from hiding (stage 2, 2026-10-05; docs/WALKA.md: "C + cios"). An animal that has not noticed the hero yet - no "!" over it
    // (its awareness under SNEAK.aware), not fighting him, not attacking, not running - is "unaware"; when he also sneaks (C) or comes
    // at it from behind (behind the way it faces), the blow is "hidden": SNEAK.melee times the damage (a shot SNEAK.ranged,
    // Hunting_Weapons.js) and SNEAK.poise times the knock to its balance, at least all the balance it has: it counts as a heavy blow and
    // the animal reels - even the bear (an opening the hunter makes for himself).
    // Czujność adds SNEAK.per a point over 5 (both), Zręczność SNEAK.dex to a shot, the skill Zasadzka (Łowiectwo) its own part.
    // ==================================================================
    const SNEAK = { melee: 2.5, ranged: 2, poise: 3, aware: 0.7, behind: -0.2, per: 0.012, dex: 0.01 };
    const BUSY = { charge: true, overshoot: true, windup: true, lunge: true, close: true, swipeWind: true, swipe: true, pinWind: true, warn: true, flee: true, retreat: true };
    function sneakAttack(a) {
        if (!a || !a.isAnimal || a._dead) return null;
        if (a._engaged || (a._aware || 0) >= SNEAK.aware || a._fleeing || BUSY[a._mode] || a._stun > 0) return null;
        const Hn = H();
        if (Hn && Hn.sneaking && Hn.sneaking()) return "hidden";
        // from behind: he stands behind the way it faces (its drawn 8-way facing when it has one, else the 4-way one)
        const d8 = (a._sprite && a._sprite._l8dir) || a.direction(), v = DIR8_VEC[d8] || [0, 1], len = Math.hypot(v[0], v[1]);
        const dx = px() - a.centerX(), dy = py() - a.centerY(), d = Math.hypot(dx, dy) || 1;
        return (dx * v[0] + dy * v[1]) / (d * len) < SNEAK.behind ? "hidden" : "unaware";
    }
    const sneakMult = ranged => (ranged ? SNEAK.ranged : SNEAK.melee) * (1 + SNEAK.per * (attr("per") - 5) + (ranged ? SNEAK.dex * (attr("dex") - 5) : 0)) * (1 + perk("sneak.dmg"));
    // the weapon in hand: "m<itemId>" (melee) or "ranged" (the bow / the sling, as Hunting.js picks); the stored choice when still
    // owned, else the best melee weapon, else the ranged one
    function handChoices() {
        const out = meleeOwned().map(id => "m" + id);
        if (hasRanged() || anyRanged()) out.push("ranged");
        out.push("m0");   // the bare fists: the last choice, the only one with nothing else
        return out;
    }
    const handIcon = h => h === "m0" ? FIST_ICON : $dataItems[h[0] === "m" ? Number(h.slice(1)) : rangedItem() || 125].iconIndex;
    function hand() {
        const list = handChoices(), stored = modes().hand;
        if (stored && list.includes(stored)) return stored;
        return list[0] || null;
    }
    const handMelee = () => { const h = hand(); return h && h[0] === "m" ? Number(h.slice(1)) : 0; };
    // the weapon put in hand by name (the card's right hand, Equipment.js): only one of handChoices()
    function setHand(h) {
        if (!handChoices().includes(h)) return false;
        modes().hand = h;
        return true;
    }
    function switchHand(dir) {   // dir: 1 the next weapon (]), -1 the previous one ([)
        const list = handChoices();
        if (list.length < 2) { popup(FIST_ICON, "Nie masz broni - walczysz pięściami", "#ff9f8f"); return; }
        const i = list.indexOf(hand());
        modes().hand = list[(i + (dir < 0 ? -1 : 1) + list.length) % list.length];
        const h = hand();
        popup(handIcon(h), "W ręku: " + (h[0] === "m" ? MELEE[Number(h.slice(1))].name : "łuk / proca"), "#f3e0a0");
        SoundManager.playEquip();
    }

    // ==================================================================
    // The hero's actions
    // ==================================================================
    const act = { mode: "idle", combo: 0, queued: false, charge: 0, rollT: 0, rollLen: 0, rollDir: [0, 1], rollDist: 0, iframes: 0, blockT: 0,
        stun: 0, stunKind: "", flinchT: 0, flinchLen: 1, hitFrom: [0, 1], comboCd: 0, comboGrace: 0, rollCd: 0, rolls: 0, riposteT: 0, secondWind: false, combatT: 0, hurtT: 0, weapon: 0,
        counterT: 0, counterMult: 1, blockTap: 0, pressFrame: -1, rollLook: null, rollBack: false };
    const ROLL = { frames: 22, dist: 2.4, cd: 10, chain: 26 };
    const px = () => $gamePlayer._realX + 0.5, py = () => $gamePlayer._realY + 0.5;
    // where he faces - on the slant too (Hunting.js reads HeroLook's 8-way facing): the blow, the block and the roll go that way
    const DIR8_VEC = { 1: [-1, 1], 2: [0, 1], 3: [1, 1], 4: [-1, 0], 6: [1, 0], 7: [-1, -1], 8: [0, -1], 9: [1, -1] };
    // the way the arrows point: Input.dir8 is read at the start of the frame, so an arrow pressed together with Space (or the attack)
    // in the same frame is not in it yet - the roll went the way he faced, sometimes right into the wolf (2026-09-26); then the arrows
    // held right now count
    function arrowsDir8() {
        if (Input.dir8) return Input.dir8;
        const s = Input._currentState || {}, x = (s.right ? 1 : 0) - (s.left ? 1 : 0), y = (s.down ? 1 : 0) - (s.up ? 1 : 0);
        return { "-1,-1": 7, "0,-1": 8, "1,-1": 9, "-1,0": 4, "1,0": 6, "-1,1": 1, "0,1": 2, "1,1": 3 }[x + "," + y] || 0;
    }
    const facingVec = () => { const Hn = H(); return Hn && Hn.facingVector ? Hn.facingVector() : ({ 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] }[$gamePlayer.direction()] || [0, 1]); };
    function faceToward(x, y) {
        const dx = x - px(), dy = y - py(), Hn = H();
        if (Hn && Hn.faceSlant) { Hn.faceSlant(dx, dy); return; }
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
        const Hn = H();
        if (Hn && Hn.aim) Hn.endAim();
    }
    function swingPastImpact() {
        const s = $gamePlayer._toolSwing;
        if (!s) return true;
        const def = CT && CT.swingKind ? CT.swingKind(s._swingKind) : null;
        return !def || s._swingT >= def.impact;
    }
    // the soft target (Combat_Feel.js, 2026-10-14): { ref, x, y } of the foe under the copper ring, or null
    const softTarget = () => { const f = FE(); return f && f.target ? f.target() : null; };
    // what the guard turns to: the foe whose blow comes next (its warning - Combat_Feel.js), else the soft target
    const guardTarget = () => { const f = FE(), a = f && f.nextBlow ? f.nextBlow(4) : null; return a || softTarget(); };
    // the nearest hostile thing in front (tiles), to turn to when the blow starts: up to 1.5 tiles past the reach, within 100 degrees.
    // With a soft target within its reach + TARGET_REACH he turns to it whichever way he faced (on the slant too) - unless the arrows
    // he holds point away from it
    const TARGET_REACH = 1.5;
    function autoFace(w) {
        const Hn = H();
        if (!Hn) return;
        const d8 = arrowsDir8(), v = d8 ? DIR8_VEC[d8] : facingVec();
        let best = null, bestScore = Infinity;
        act.aim = null;
        const tg = softTarget();
        if (tg) {
            const dx = tg.x - px(), dy = tg.y - py(), d = Math.hypot(dx, dy), cos = d > 0.05 ? (dx * v[0] + dy * v[1]) / (d * Math.hypot(v[0], v[1])) : 1;
            if (d <= w.reach + TARGET_REACH && (!d8 || cos > -0.2)) { faceToward(tg.x, tg.y); act.aim = { ref: tg.ref, x: tg.x, y: tg.y }; return; }
        }
        for (const t of Hn.allTargets()) {
            const dx = t.x - px(), dy = t.y - py(), d = Math.hypot(dx, dy);
            if (d < 0.05 || d > w.reach + 1.5) continue;
            const cos = (dx * v[0] + dy * v[1]) / (d * Math.hypot(v[0], v[1]));
            if (cos < -0.2) continue;
            const score = d + (1 - cos) * 2;
            if (score < bestScore) { bestScore = score; best = t; }
        }
        if (best) { faceToward(best.x, best.y); act.aim = { ref: best.ref || null, x: best.x, y: best.y }; }   // (the blow goes at it - on the slant too)
        else if (d8) faceToward(px() + v[0], py() + v[1]);
    }
    // the way the blow goes: at the one it was aimed at (where it is now, while it is still roughly in front), else where he faces
    function blowVec() {
        const [fx, fy] = facingVec();
        const a = act.aim, Hn = H();
        if (!a) return [fx, fy];
        const now = a.ref && Hn ? Hn.allTargets().find(t => t.ref === a.ref) : null;
        const tx = now ? now.x : a.x, ty = now ? now.y : a.y, dx = tx - px(), dy = ty - py(), d = Math.hypot(dx, dy);
        return d > 0.05 && (dx * fx + dy * fy) / d > 0.3 ? [dx / d, dy / d] : [fx, fy];
    }

    // the attack key pressed: true when it did something (a blow started, the next one of the series queued, the bow raised) - false
    // when he is busy (the swing before its blow, a roll, a stagger...): the press then waits in the buffer (update)
    function pressAttack() {
        const done = pressAttackNow();
        if (done) act.pressFrame = Graphics.frameCount;   // (this frame's press is spent: the buffer does not take it again)
        return done;
    }
    function pressAttackNow() {
        const h = hand(), Hn = H();
        if (h === "ranged" || (!h && Hn)) {
            if (!Hn || act.mode !== "idle" || act.stun > 0) return false;
            const tg = softTarget();
            if (tg && !arrowsDir8()) faceToward(tg.x, tg.y);   // (the circle goes on the soft target)
            return Hn.startAim();   // (its own popup when there is nothing to shoot with)
        }
        const id = handMelee(), w = MELEE[id];
        if (!w) return false;
        if (act.mode === "attack") {   // the next blow of the combo, once this one has landed
            if (act.queued) return true;
            if (swingPastImpact() && act.combo + 1 < maxCombo(w)) { act.queued = true; return true; }
            return false;
        }
        if (act.mode !== "idle" || act.stun > 0 || act.comboCd > 0) return false;
        if (act.comboGrace > 0 && act.weapon === id && act.combo + 1 < maxCombo(w)) { act.comboGrace = 0; return startAttack(id, act.combo + 1); }   // (just after a blow: the series goes on)
        return startAttack(id, 0);
    }
    const maxCombo = w => w.combo.length + (hasSkill("combo4") ? 1 : 0);
    function startAttack(id, i) {
        const w = weaponNow(id) || MELEE[id];
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
        se("Wind7", 55, 120 + i * 8);
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
    // The counter after a parry (2026-10-14, for everyone): the next blow within COUNTER.frames takes COUNTER.mult more ("Kontratak!").
    // The skill Kontra (riposte) does more: a longer moment (riposteT 120) and a critical blow (x1.6).
    const COUNTER = { frames: 60, mult: 1.3, riposte: 120 };
    // The sound of a blow that landed (2026-10-14): what the weapon is (the fists, a club, the torch, an edge, a point, a pick) and what it
    // struck - an animal's flesh, a man (the mercenary's mail), an empty armour's iron, a stone sentinel, a wraith's nothing, a shield or a
    // raised club that threw the weapon back (Humans.js: Combat.recoil), the dummy's straw. The game's own sounds (audio/se).
    const WEAPON_CLASS = { 0: "fist", 156: "blunt", 59: "fire", 60: "edge", 115: "edge", 154: "point", 63: "pick", 116: "pick" };
    const SURFACE_KINDS = { armor: ["zbroja", "guardian", "boss_20", "boss_70"], stone: ["kamiennik", "boss_60"], spirit: ["upior", "cien", "boss_80", "boss_90"] };
    const HIT_SE = {
        fist:  { flesh: ["Blow1", 105], man: ["Blow1", 92], mail: ["Blow3", 125], armor: ["Blow3", 135], stone: ["Blow3", 120], spirit: ["Wind1", 150], shield: ["Blow3", 110], straw: ["Blow1", 130] },
        blunt: { flesh: ["Blow2", 100], man: ["Blow4", 100], mail: ["Blow3", 100], armor: ["Blow3", 90], stone: ["Blow3", 80], spirit: ["Wind1", 130], shield: ["Blow3", 95], straw: ["Blow1", 115] },
        fire:  { flesh: ["Blow1", 100], man: ["Blow4", 105], mail: ["Blow3", 105], armor: ["Blow3", 95], stone: ["Blow3", 85], spirit: ["Fire2", 120], shield: ["Blow3", 100], straw: ["Blow1", 115] },
        edge:  { flesh: ["Slash2", 100], man: ["Slash3", 100], mail: ["Sword4", 110], armor: ["Sword4", 90], stone: ["Blow6", 110], spirit: ["Slash10", 130], shield: ["Blow3", 85], straw: ["Slash1", 115] },
        point: { flesh: ["Slash4", 100], man: ["Slash4", 110], mail: ["Sword2", 115], armor: ["Sword2", 100], stone: ["Blow6", 130], spirit: ["Wind1", 140], shield: ["Blow3", 105], straw: ["Slash4", 125] },
        pick:  { flesh: ["Blow6", 110], man: ["Blow6", 100], mail: ["Sword4", 95], armor: ["Sword4", 80], stone: ["Blow6", 80], spirit: ["Wind1", 120], shield: ["Blow3", 80], straw: ["Blow2", 120] }
    };
    function surfaceOf(ref) {
        if (!ref) return "flesh";
        if (ref._dummy) return "straw";
        const kind = typeof ref.kind === "function" ? ref.kind() : "", base = ref._base || kind, cls = ref.constructor ? ref.constructor.name : "";
        for (const s of Object.keys(SURFACE_KINDS)) if (SURFACE_KINDS[s].includes(kind) || SURFACE_KINDS[s].includes(base)) return s;
        if (cls === "Game_Human") return kind === "mercenary" ? "mail" : "man";
        return "flesh";
    }
    function hitSound(id, ref, heavy, i, recoiled) {
        const own = surfaceOf(ref), cls = WEAPON_CLASS[id] || (MELEE[id] && MELEE[id].klasa) || "blunt", w = MELEE[id];
        const surf = recoiled && own !== "armor" && own !== "stone" ? "shield" : own;   // (thrown back by a shield or a club; by iron or stone: their clank)
        const [name, pitch] = (HIT_SE[cls] || HIT_SE.blunt)[surf] || [w.se, 100];
        se(name, 85, Math.round((heavy ? pitch - 18 : pitch + i * 5) * (0.97 + Math.random() * 0.06)));
        if (cls === "fire" && surf !== "shield") se("Fire1", 55, 115);   // (the flame's hiss with it)
        act.lastHitSe = name + ":" + surf;   // (the tests)
    }
    // the blow lands: everything in reach and in front takes it (the nearest only, unless the weapon sweeps and the hero has the skill)
    function strike(id, i) {
        const w = weaponNow(id) || MELEE[id], Hn = H();
        const heavy = i === 0 && act.charge >= HEAVY.min;
        if (heavy) { breath = Math.max(0, breathNow() - w.cost * HEAVY.cost); if (breath <= 0) winded = true; }
        const full = heavy && act.charge >= HEAVY.max - 1;
        let mult = heavy ? (full ? HEAVY.full : HEAVY.mult) : COMBO_MULT[Math.min(i, COMBO_MULT.length - 1)];
        const last = i + 1 >= maxCombo(w);
        const poise = w.poise * poiseMult() * (1 + perk("melee.poise")) * (heavy ? HEAVY.poise : last ? 1.5 : 1);
        const [fx, fy] = blowVec(), reachBonus = heavy ? 0.3 : 0;
        const hits = [];
        for (const t of (Hn ? Hn.allTargets() : [])) {
            const dx = t.x - px(), dy = t.y - py(), d = Math.hypot(dx, dy);
            if (d > w.reach + reachBonus + (t.radius || 0.5) * 0.5) continue;
            if (d > 0.35 && (dx * fx + dy * fy) / d < w.cone - (heavy ? 0.15 : 0)) continue;
            hits.push({ t, d });
        }
        hits.sort((a, b) => a.d - b.d);
        const targets = w.sweep && hasSkill("sweep") ? hits : hits.slice(0, 1);
        if (targets.length) T.call("Durability", "use", id);
        T.emit("attack", { weapon: id, combo: i, heavy, hits: targets.length });
        if (targets.length === 0) {
            if (Hn) Hn.makeNoise(px(), py(), 3);
            act.charge = 0;
            return;
        }
        let stop = heavy ? 7 : 4, counter = false;
        const recoil0 = act.recoilN || 0;
        for (const { t } of targets) {
            const a = t.ref && t.ref.isAnimal ? t.ref : null;
            let m = mult * strMult() * (1 + perk("melee.dmg")), tag = heavy ? "heavy" : "", pz = poise;
            const hidden = sneakAttack(a) === "hidden";   // (a blow from hiding: see SNEAK)
            if (hidden) { m *= sneakMult(false) * (w.ukrycie || 1); tag = "sneak"; pz = Math.max(pz * SNEAK.poise, (a._poise || 0) + 1); }   // (it breaks its balance whole: it reels)
            // (2026-10-23, Bron_Data.js) the weapon against what it strikes: blunt ones on armour, stone and mail (pancerz), the boar spear on animals
            if (w.pancerz > 1) { const surf = surfaceOf(t.ref); if (surf === "armor" || surf === "stone" || surf === "mail") m *= w.pancerz; }
            if (w.zwierz > 1 && a) m *= w.zwierz;
            if (a && a._stun > 0 && hasSkill("execute")) { m *= 2.5; tag = "execute"; }
            const crit = act.riposteT > 0 || Math.random() < critChance() + (w.crit || 0);
            if (crit) { m *= 1.6; act.riposteT = 0; act.counterT = 0; tag = tag || "crit"; }
            else if (act.counterT > 0) { m *= act.counterMult || COUNTER.mult; act.counterT = 0; counter = true; }   // (the counter after a parry: see COUNTER)
            const dmg = Math.max(1, Math.round(w.dmg * m)) + (w.fire && !a ? w.fireBonus || 0 : 0);   // (fire: a man or a creature burns at once; an animal - Torch.struck)
            t.hit(dmg, "melee", { poise: Math.round(pz), knock: heavy || last || hidden, crit, heavy: heavy || hidden, tag, weapon: id, fire: !!w.fire });
            if (!a) numberAt(t.x, t.y - 0.6, String(dmg), crit ? "#ffe066" : "#ffffff");
            if (heavy || crit) stop = 8;
            if (hidden) stop = 10;   // (the word "Atak z ukrycia!" and its thud: enemyHurtFx)
        }
        if (counter) numberAt(px(), py() - 1.45, "Kontratak!", "#ffc96b", 0.85);
        hitSound(id, targets[0].t.ref, heavy, i, (act.recoilN || 0) > recoil0);   // (what it hit, with what: the flesh, a man, the iron, the stone, a shield)
        if (w.fire) T.call("Torch", "struck", targets.map(x => x.t), { heavy, last });   // (the fire: burning, fear, the torch burns down)
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
    // Space without the arrows (2026-10-14): a spring back - away from the soft target, else from the nearest foe near him, else simply
    // backwards; he looks at it (or the way he looked) again once he is up. With the arrows: that way, as always.
    const AWAY = { near: 5 };
    function rollWay() {
        const d8 = arrowsDir8();
        if (d8) return { v: DIR8_VEC[d8], back: false };
        const f = FE(), from = softTarget() || (f && f.nearestThreat ? f.nearestThreat(AWAY.near) : null), face = facingVec();
        if (from) {
            const dx = px() - from.x, dy = py() - from.y;
            if (Math.hypot(dx, dy) > 0.05) return { v: [dx, dy], back: true, look: [-dx, -dy] };
        }
        return { v: [-face[0], -face[1]], back: true, look: face };
    }
    // he turns back to the soft target (or the way he looked before springing back) once the roll is over - the next blow and the guard
    // are frontal again
    function faceAfterRoll() {
        if (arrowsDir8()) return;
        const tg = softTarget();
        if (tg) { faceToward(tg.x, tg.y); return; }
        if (act.rollLook) faceToward(px() + act.rollLook[0], py() + act.rollLook[1]);
    }
    function startRoll() {
        const second = hasSkill("acrobat") && act.rolls === 1 && act.rollCd > 0;
        const cost = rollCost() * (second ? 0.6 : 1);
        if (!spendBreath(cost)) return false;
        endSwing();
        const way = rollWay(), v = way.v;
        const len = Math.hypot(v[0], v[1]);
        act.rollDir = [v[0] / len, v[1] / len];
        act.rollLook = way.back ? way.look : null;
        act.rollBack = way.back;
        $gamePlayer.setDirection(Math.abs(v[0]) >= Math.abs(v[1]) ? (v[0] < 0 ? 4 : 6) : (v[1] < 0 ? 8 : 2));   // (the roll's picture goes the way he rolls)
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
        se("Evasion1", 70, 110);
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
    // the roll runs into a body (an animal's, a man's - Combat.foes()): it stops, he bounces off (and a boar's, a wolf's or a fighting man's
    // body hurts: a.bumpAtk() says how much, for the ones that are not Hunting.js's animals)
    function rollBump() {
        const Hn = H();
        if (!Hn) return false;
        for (const a of foes()) {
            if (a._dead || a.isJumping()) continue;
            const sp = Hn.SPECIES[a.kind()] || {}, reach = (sp.radius || (a._def && a._def.radius) || 0.5) + 0.35;
            if (Math.hypot(a.centerX() - px(), a.centerY() - py()) > reach || !rollingInto(a.centerX(), a.centerY())) continue;
            if (a._mode === "charge" && Hn.gore) { Hn.gore(a); return true; }   // (into a charging boar: its whole charge, see hitPlayer)
            act.mode = "idle";
            act.iframes = 0;
            endSwing();
            shovePlayer(-act.rollDir[0] * BUMP.back, -act.rollDir[1] * BUMP.back);
            act.hitFrom = [-act.rollDir[0], -act.rollDir[1]];
            sparksAt((px() + a.centerX()) / 2, (py() + a.centerY()) / 2 - 0.3, "#e8e8e8", 6);
            const actor = $gameParty.leader(), own = typeof a.bumpAtk === "function" ? a.bumpAtk() : 0;
            if (actor && (own > 0 || (sp.aggressive && Hn.atkOf))) {
                const lost = applyDamage(actor, Math.max(1, own > 0 ? own : Math.round(Hn.atkOf(a) * BUMP.part)), typeof a.mercy === "function" && a.mercy());
                se("Damage3", 80, 110);
                $gameScreen.startShake(3, 8, 10);
                stunPlayer(BUMP.stun, "stagger");
                numberAt(px(), py() - 1.35, "Odbity!", "#ffb07f", 0.8);
                tell("bump", lost, { kind: a.kind(), name: sp.name || "" });
            } else {
                se("Blow1", 60, 120);
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
            if (act.queuedRoll) { act.queuedRoll = false; if (startRoll()) return; }
            faceAfterRoll();
        }
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
    // The presses kept a moment (the input buffer, 2026-10-14): a blow, a roll or the guard pressed while he is still busy - the swing
    // before its blow, the roll, a stagger, the pause after a series, the world's hitstop or slowed frame - waits BUF.life frames and is
    // done the moment he is free (a roll the moment a blow has landed: it cuts the swing's end short). Pressed earlier than that, it is
    // gone: no queue of presses, no spamming through a swing.
    const BUF = { life: 10 };
    const buf = { shoot: 0, dodge: 0, block: 0 };
    // the block key held: guarding (slower walk); a hit taken within parryWindow() frames of raising the guard is parried. A press kept in
    // the buffer raises it fresh (a parry) even when the key was let go meanwhile - for the parry window at least (blockTap)
    function updateBlock() {
        const held = Input.isPressed("block");
        if (act.mode === "block") {
            if (act.blockTap > 0) act.blockTap--;
            if ((!held && !(act.blockTap > 0)) || act.stun > 0) { act.mode = "idle"; act.blockTap = 0; return; }
            act.blockT++;
            act.combatT = Math.max(act.combatT, 120);
            const tg = guardTarget();   // (the guard faces the foe whose blow comes - else the soft target - while no arrow is held)
            if (tg && !arrowsDir8() && Math.hypot(tg.x - px(), tg.y - py()) < 4) faceToward(tg.x, tg.y);
            return;
        }
        if ((held || buf.block > 0) && act.mode === "idle" && act.stun === 0 && canAct()) {
            const fresh = buf.block > 0;
            act.mode = "block";
            act.blockT = fresh ? 0 : 99;   // (a guard kept up from before is no parry)
            act.blockTap = fresh && !held ? parryWindow() + 2 : 0;
            buf.block = 0;
            const tg = guardTarget();
            if (tg && !arrowsDir8() && Math.hypot(tg.x - px(), tg.y - py()) < 4) faceToward(tg.x, tg.y);
        }
    }

    // ==================================================================
    // Taking a hit: what an enemy's attack does to the hero. opts: { damage, poise, from: { x, y } (tiles), attacker (the animal),
    // name, unblockable, unparryable, wound (0..1), knock (tiles) } -> "dodged" | "parried" | "blocked" | "guardbreak" | "hit"
    // Stage 3 (Humans.js): projectile (an arrow: the roll's safety always lets it through, even rolling at the archer), guardBreak (a
    // blow that breaks the guard when it is blocked - the mercenary's overhead blow), nonLethal + onBeaten (a man's blow never takes the
    // last life: he is left at 1 and onBeaten() runs - they rob him)
    // ==================================================================
    function hitPlayer(opts) {
        const actor = $gameParty.leader();
        if (!actor || actor.isDead()) return "hit";
        act.combatT = 600;
        const src = { kind: opts.attacker && typeof opts.attacker.kind === "function" ? opts.attacker.kind() : "", name: opts.name || "" };
        const from = opts.from || { x: px(), y: py() + 1 };
        let into = false;   // rolled straight at the attacker: no safety, the blow lands in full and throws him back harder
        if (act.iframes > 0) {
            if (opts.projectile || !rollingInto(from.x, from.y)) {
                numberAt(px(), py() - 1.1, "Unik", "#bfe3ff", 0.8);
                se("Evasion2", 60, 120);
                return tell("dodged", 0, src);
            }
            into = true;
            act.iframes = 0;
            act.mode = "idle";
            act.rollCd = ROLL.chain;
            numberAt(px(), py() - 1.35, "Odbity!", "#ffb07f", 0.8);
        }
        const ax = from.x - px(), ay = from.y - py(), ad = Math.hypot(ax, ay) || 1, [fx, fy] = facingVec();
        const guardSh = act.mode === "block" ? shield() : null;   // (a wide shield covers more to the side: its `cover`)
        const frontal = (ax * fx + ay * fy) / ad > 0.25 - (guardSh && guardSh.cover ? guardSh.cover : 0);
        let damage = opts.damage || 0, poise = opts.poise || 0;
        // (a blow no shield and no parry holds - the bear's paw and its pin: the guard is up for nothing, and he sees why)
        if (act.mode === "block" && frontal && opts.unblockable && opts.unparryable) numberAt(px(), py() - 1.55, "Tego nie zatrzymasz!", "#ff9f8f", 0.8);
        if (act.mode === "block" && frontal) {
            if (!opts.unparryable && act.blockT <= parryWindow()) {
                // the perfect parry (2026-10-14, for everyone): the ring of steel, a shower of sparks, the world slowed a quarter of a second,
                // the foe off balance (onParried: it reels) and a moment for a counter (COUNTER; Kontra: longer and critical)
                se("Parry", 90, 100);
                se("Sword4", 65, 130);
                const mx = (px() + from.x) / 2, my = (py() + from.y) / 2 - 0.4;
                sparksAt(mx, my, "#fff2b0", 16);
                sparksAt(mx, my, "#ffc96b", 8);
                numberAt(px(), py() - 1.2, "Idealne parowanie!", "#fff2b0", 0.9);
                if (opts.attacker && typeof opts.attacker.onParried === "function") opts.attacker.onParried();
                if (hasSkill("riposte")) act.riposteT = COUNTER.riposte;
                else { act.counterT = COUNTER.frames; act.counterMult = COUNTER.mult; }
                hitstop(6);
                slowMotion(SLOW.parry, 2);
                act.parries = (act.parries || 0) + 1;
                return tell("parried", 0, src);
            }
            if (!opts.unblockable) {
                const sh = guardSh || NO_SHIELD;
                damage = Math.round(damage * (1 - Math.min(0.9, sh.reduce + perk("block.reduce"))));
                if (sh.id) T.call("Durability", "use", sh.id);   // (every blow taken on it wears the shield; a parry does not)
                breath = Math.max(0, breathNow() - poise * sh.breath * (hasSkill("guard") ? 0.6 : 1));
                if (opts.guardBreak) breath = 0;   // (a blow that breaks any guard)
                breathSpent = 0;
                se("Blow3", 80, 110);
                sparksAt((px() + from.x) / 2, (py() + from.y) / 2 - 0.4, "#e8e8e8", 8);
                shovePlayer(-ax / ad * 0.35, -ay / ad * 0.35);
                if (breath <= 0) {
                    winded = true;
                    numberAt(px(), py() - 1.2, "Garda przełamana!", "#ff9f8f", 0.85);
                    stunPlayer(40, "guard");
                    return tell("guardbreak", beaten(actor, applyDamage(actor, damage, opts.nonLethal), opts), src);
                }
                const lost = damage > 0 ? beaten(actor, applyDamage(actor, damage, opts.nonLethal), opts) : 0;
                hitstop(4);
                return tell("blocked", lost, src);
            }
        }
        // a clean hit
        endSwing();
        if (act.mode === "attack" || act.mode === "block" || act.mode === "heal") act.mode = "idle";   // (a quick heal cut short: Combat_Feel.js)
        const lost = applyDamage(actor, damage, opts.nonLethal);
        se("Damage3", 90, 95);
        $gameScreen.startShake(Math.min(9, 3 + damage / 10), 8, 14);
        $gameScreen.startFlash([255, 40, 30, 110], 12);
        const knock = (opts.knock !== undefined ? opts.knock : 0.5) + (into ? 0.7 : 0);
        if (knock > 0) shovePlayer(-ax / ad * knock, -ay / ad * knock);
        act.hitFrom = [-ax / ad, -ay / ad];   // (the way the blow pushes him: his flinch leans that way)
        const down = poise >= knockdownAt();
        if (down) stunPlayer(Math.max(50, opts.down || 0), "down");   // (opts.down: frames he stays down - the bear's pin holds him longer)
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
            se("Heal2", 70, 110);
        }
        hitstop(6);
        beaten(actor, lost, opts);
        return tell("hit", lost, src, down);
    }
    // a blow that may not kill brought him down to his last life: the attacker's onBeaten (Humans.js: the robbery)
    function beaten(actor, lost, opts) {
        if (opts.nonLethal && actor.hp <= 1 && typeof opts.onBeaten === "function") opts.onBeaten();
        return lost;
    }
    // the health the blow takes (the armour and Niezłomny take some of it off; the armour wears for it); what was lost. nonLethal: never the
    // last life (a man's blow - Humans.js)
    function applyDamage(actor, damage, nonLethal) {
        if (!(damage > 0)) return 0;
        const ar = armor();
        if (ar) for (const piece of ar.pieces || [ar]) T.call("Durability", "use", piece.id);   // (every blow that gets through wears the jacket - every piece worn)
        const dk = FE() && FE().diff ? FE().diff().dmg : 1;   // (the difficulty of the fight: Łatwy 0.7, Trudny 1.3 - Combat_Feel.js)
        damage = Math.max(1, Math.round(damage * dk * (1 - (ar ? ar.reduce : 0)) * (1 - Math.min(0.6, perk("hurt")))));   // (the jacket, Niezłomny)
        if (nonLethal) damage = Math.max(0, Math.min(damage, actor.hp - 1));
        if (!(damage > 0)) return 0;
        actor.gainHp(-damage);
        numberAt(px(), py() - 1.0, "-" + damage, "#ff6b5e");
        act.hurtT = 18;
        return damage;
    }
    // the bus: heroHit (whatever came of an enemy's blow), heroDown (he lies: knocked down, or no health left); gives back the result
    function tell(result, damage, src, down) {
        const actor = $gameParty.leader(), hp = actor ? actor.hp : 0;
        T.emit("heroHit", { result, damage, by: src.kind, name: src.name, hp });
        if (down || (damage > 0 && hp <= 0)) T.emit("heroDown", { by: src.kind, name: src.name, dead: hp <= 0 });
        return result;
    }
    // the hero's blow bounced off a shield or a raised club (Humans.js): his arms jar - a short stagger, the swing cut
    function recoil(frames) {
        if (act.mode === "roll") return;
        act.recoilN = (act.recoilN || 0) + 1;   // (strike: the blow's sound is the shield's then)
        endSwing();
        act.mode = "idle";
        act.comboGrace = 0;
        act.stun = Math.max(act.stun, frames || 12);
        act.stunKind = "stagger";
        act.flinchT = frames || 12;
        act.flinchLen = frames || 12;
        const [fx, fy] = facingVec();
        act.hitFrom = [-fx, -fy];
    }
    // knocked down and kept down a while (Humans.js: beaten by men, he lies while they rob him)
    function downPlayer(frames) { stunPlayer(frames || 120, "down"); }
    // stunPlayer(frames, kind): held where he stands - "stagger", "down" (he falls), "guard"; stage 4 (Creatures.js): "fear" (frozen by a
    // wraith's truth: he trembles), "held" (in a drowned one's grip)
    function stunPlayer(frames, kind) {
        endSwing();
        act.mode = "idle";
        act.stun = Math.max(act.stun, frames);
        act.stunKind = kind;
        if (kind === "stagger") { act.flinchT = frames; act.flinchLen = frames; }
        if (kind === "down" && KNOCK_KIND >= 0) $gamePlayer.startToolSwing(KNOCK_KIND, null, null);   // (he falls, lies a moment, gets up)
    }

    // ==================================================================
    // Feedback: hitstop, floating numbers and sparks (Combat_UI.js draws them), an enemy's hurt
    // ==================================================================
    let stopFrames = 0;
    function hitstop(n) { stopFrames = Math.max(stopFrames, n); }
    // the slowed moment (2026-10-14: a perfect parry, the last blow of a fight): for `frames` frames the world moves only every
    // `every`-th frame (2: at half speed) - the hero, the foes, the swings alike; the screen (its zoom, shake, flash) at full speed
    let slowT = 0, slowEvery = 2, heldNow = false;
    const SLOW = { parry: 15, finale: 24 };   // (frames of the slowed moment: a perfect parry ~0.25 s, the last blow of a fight ~0.4 s)
    function slowMotion(frames, every) { if (frames > slowT) { slowT = frames; slowEvery = Math.max(2, every || 2); } }
    // (Scene_Map.updateMain asks it every frame: true while the world holds still - a hitstop frame, or a skipped frame of a slowed moment)
    function holdFrame() {
        heldNow = false;
        if (stopFrames > 0) { stopFrames--; heldNow = true; return true; }
        if (slowT > 0) { slowT--; if (slowT % slowEvery !== 0) { heldNow = true; return true; } }
        return false;
    }
    // a floating number / word at a map point (tiles). Combat_UI.js stacks the ones that would cover each other (the newer above the
    // older); a word said again at the same place while it still shows ("Utknął!", "Kamień!") only pops again instead of a second copy;
    // at most FLOAT_MAX at once (the oldest go first)
    const floaters = [];
    const FLOAT_MAX = 12;
    let floatSeq = 0;
    function numberAt(x, y, text, color, scale) {
        text = String(text);
        if (!/^[-+]?\d/.test(text)) {   // (numbers are separate blows - each one shows)
            const same = floaters.find(f => f.text === text && f.t < 30 && Math.abs(f.x - x) < 1.2 && Math.abs(f.y - y) < 1.0);
            if (same) { same.t = Math.min(same.t, 2); same.x = x; same.y = y; return; }
        }
        floaters.push({ x, y, text, color: color || "#ffffff", t: 0, scale: scale || 1, sprite: null, seq: ++floatSeq });
        while (floaters.length > FLOAT_MAX) { const f = floaters.shift(); if (f.sprite && f.sprite.parent) { f.sprite.parent.removeChild(f.sprite); f.sprite.destroy(); } }
    }
    const sparks = [];
    function sparksAt(x, y, color, n) {
        for (let i = 0; i < (n || 8); i++) {
            const a = Math.random() * Math.PI * 2, v = 0.02 + Math.random() * 0.05;
            sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.02, t: 0, life: 14 + Math.floor(Math.random() * 10), color: color || "#ffffff", sprite: null });
        }
    }
    // ---- what the hero's hits look like when they land on an enemy (Hunting.js calls it from hit())
    function enemyHurtFx(animal, damage, how, extra) {
        const x = animal.centerX(), y = animal.centerY();
        extra = extra || {};
        const hidden = extra.tag === "sneak" || extra.tag === "heart";
        const color = hidden ? "#9ff0a8" : extra.tag === "execute" ? "#ff9f40" : extra.crit ? "#ffe066" : extra.heavy ? "#ffc080" : "#ffffff";
        const label = hidden ? "!" : extra.tag === "execute" ? " dobicie!" : extra.crit ? "!" : "";
        numberAt(x, y - 0.9, damage + label, color, extra.heavy || extra.crit ? 1.2 : 1);
        sparksAt(x, y - 0.3, "#b8322a", extra.heavy ? 12 : 7);
        if (extra.fire) sparksAt(x, y - 0.4, "#ffb43a", extra.heavy ? 12 : 8);   // (the torch: embers off the flame)
        animal._flashT = 8;
        animal._flashAt = Graphics.frameCount;   // (Combat_UI.js: pure white for its first frames)
        // a blow or a shot from hiding (SNEAK): its word over the animal, in the green of the number, and a dull thud
        if (hidden) {
            numberAt(x, y - 1.5, extra.tag === "heart" ? "Strzał w serce!" : "Atak z ukrycia!", "#9ff0a8", 0.85);
            se("Blow4", 80, 75);
            act.sneakT = 90;   // (for the tests and the look: a blow from hiding a moment ago)
            act.sneaks = (act.sneaks || 0) + 1;
        }
    }

    // ==================================================================
    // A map frame (Combat.js's clock): the breath, the running, the timers, the roll, the guard, the combat keys
    // ==================================================================
    function update() {
        // the keys are read every frame - the world held still too (a hitstop, a slowed frame): what is pressed then waits in the buffer
        for (const k in buf) if (buf[k] > 0) buf[k]--;
        const now = Graphics.frameCount, fresh = { dodge: pressedNow("dodge"), shoot: pressedNow("shoot"), block: pressedNow("block") };
        const tab = pressedNow("tab"), weapon = pressedNow("weaponNext") ? 1 : pressedNow("weaponPrev") ? -1 : 0;
        if (fresh.shoot && act.pressFrame !== now) buf.shoot = BUF.life;   // (not one Hunting.js already started a blow with this frame)
        if (fresh.dodge) buf.dodge = BUF.life;
        if (fresh.block) { buf.block = BUF.life; act.blockPressAt = now; }
        if (tab && mapFreePlay()) setCombatMode(!combatMode());
        if (heldNow) return;
        updateBreath();
        updateRun();
        if (act.combatT > 0) act.combatT--;
        if (act.comboCd > 0) act.comboCd--;
        if (act.comboGrace > 0) act.comboGrace--;
        if (act.rollCd > 0) act.rollCd--; else act.rolls = 0;
        if (act.riposteT > 0) act.riposteT--;
        if (act.counterT > 0) act.counterT--;
        if (act.hurtT > 0) act.hurtT--;
        if (act.flinchT > 0) act.flinchT--;
        if (act.sneakT > 0) act.sneakT--;
        if (act.stun > 0 && --act.stun === 0) act.stunKind = "";
        if (act.mode === "roll") {
            updateRoll();
            if (act.mode === "roll") { if (fresh.dodge) pressDodge(); return; }   // (the acrobat's second roll; else the press waits for the roll's end)
        }
        if (act.mode === "attack" && !$gamePlayer._toolSwing) act.mode = "idle";   // (the swing was taken away: a scene change...)
        if (!canAct()) { if (act.mode === "block") act.mode = "idle"; return; }
        if (FE() && FE().busy && FE().busy()) return;   // (Combat_Feel.js: binding a wound, a bite of food - he is open, nothing else)
        updateBlock();
        const Hn = H();
        if (weapon && act.mode === "idle" && !(Hn && Hn.aim)) switchHand(weapon);
        // the presses in the buffer, the moment they can be done (a roll the moment a blow has landed - it cuts the swing's end short;
        // the next blow of a series once this one has landed; anything once a roll, a stagger, the pause after a series is over)
        if (buf.dodge > 0 && pressDodge()) buf.dodge = 0;
        if (buf.shoot > 0 && (act.mode === "attack" || act.mode === "idle") && pressAttack()) buf.shoot = 0;
        if (!act.secondWind || act.combatT > 0) return;
        act.secondWind = false;   // (a new fight: "Drugi oddech" works again)
    }
    // leaving the map / loading: nothing half done
    function resetAct() {
        Object.assign(act, { mode: "idle", combo: 0, queued: false, charge: 0, rollT: 0, iframes: 0, blockT: 0, stun: 0, stunKind: "", comboCd: 0, comboGrace: 0, rollCd: 0, rolls: 0, riposteT: 0, combatT: 0, hurtT: 0, flinchT: 0, sneakT: 0,
            counterT: 0, counterMult: 1, blockTap: 0, pressFrame: -1, rollLook: null, rollBack: false });
        for (const k in buf) buf[k] = 0;
        slowT = 0;
        heldNow = false;
        breath = -1;
        winded = false;
        stopFrames = 0;
        for (const f of floaters.concat(sparks)) if (f.sprite && f.sprite.parent) { f.sprite.parent.removeChild(f.sprite); f.sprite.destroy(); }   // (not left on the map, stuck)
        floaters.length = 0;
        sparks.length = 0;
    }
    // for Combat.js's hooks: the hero's speed (tired out: half, the speed is a power of two; guarding or winded: slower still), held
    // still (rolling, stunned), allowed to run (not while guarding; the hero only with breath and strength)
    function heroSpeed(s) {
        if (tired()) s -= 1;
        return act.mode === "block" || winded ? Math.max(2, s - 1) : s;
    }
    const heldStill = () => act.mode === "roll" || act.stun > 0;
    const mayRun = player => act.mode !== "block" && (player !== $gamePlayer || canRun());

    P.fight = { act, ROLL, MELEE, MELEE_ORDER, SHIELDS, ARMORS, NO_SHIELD, COMBO_MULT, HEAVY, maxCombo, SNEAK, RUN, ROLL_KIND, KNOCK_KIND, FIST_ICON, px, py, easeOut, has, hand, handMelee, handIcon, switchHand,
        setHand, handChoices, shield, armor, weaponNow, refreshGear, gearChanged: () => { gearAt = -1; }, rangedItem, rangedKind, hasRanged, anyRanged, lackOf, sneakAttack, sneakMult, maxBreath, breathNow, spendBreath, isWinded: () => winded, canRun, pressAttack, pressDodge, hitPlayer, enemyHurtFx, hitstop, numberAt,
        sparksAt, shovePlayer, floaters, sparks, stopFrames: () => stopFrames, holdFrame, update, resetAct, heroSpeed, heldStill, mayRun, recoil, downPlayer,
        stunPlayer, drainBreath, slowMotion, SLOW, COUNTER, HIT_SE, surfaceOf, faceToward, facingVec, arrowsDir8, swingPastImpact, endSwing, buf, BUF, DIR8_VEC, isHeld: () => heldNow, slowNow: () => slowT };
})();
