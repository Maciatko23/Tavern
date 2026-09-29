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
        combatMode, setCombatMode, mapFreePlay, se, popup } = P.core;
    const H = () => T.api("Hunting");

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
    // the roll and the fall (ChoppableTree.js swing kinds): -1 when the picture is not in the game (Combat_UI.js turns the figure then)
    const ROLL_KIND = swingKindOf("Swing_Roll"), KNOCK_KIND = swingKindOf("knockdown");
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
        const list = handChoices(), stored = modes().hand;
        if (stored && list.includes(stored)) return stored;
        return list[0] || null;
    }
    const handMelee = () => { const h = hand(); return h && h[0] === "m" ? Number(h.slice(1)) : 0; };
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
        stun: 0, stunKind: "", flinchT: 0, flinchLen: 1, hitFrom: [0, 1], comboCd: 0, comboGrace: 0, rollCd: 0, rolls: 0, riposteT: 0, secondWind: false, combatT: 0, hurtT: 0, weapon: 0 };
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
    // the nearest hostile thing in front (tiles), to turn to when the blow starts: up to 1.5 tiles past the reach, within 100 degrees
    function autoFace(w) {
        const Hn = H();
        if (!Hn) return;
        const d8 = arrowsDir8(), v = d8 ? DIR8_VEC[d8] : facingVec();
        let best = null, bestScore = Infinity;
        act.aim = null;
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

    // the attack key pressed
    function pressAttack() {
        const h = hand(), Hn = H();
        if (h === "ranged" || (!h && Hn)) {
            if (Hn) return Hn.startAim();   // (its own popup when there is nothing to shoot with)
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
    // the blow lands: everything in reach and in front takes it (the nearest only, unless the weapon sweeps and the hero has the skill)
    function strike(id, i) {
        const w = MELEE[id], Hn = H();
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
        let stop = heavy ? 7 : 4;
        for (const { t } of targets) {
            const a = t.ref && t.ref.isAnimal ? t.ref : null;
            let m = mult * strMult() * (1 + perk("melee.dmg")), tag = heavy ? "heavy" : "";
            const unaware = a && a._aware < 0.3 && !a._engaged && Hn.sneaking();
            if (unaware) { m *= 2; tag = "sneak"; }
            if (a && a._stun > 0 && hasSkill("execute")) { m *= 2.5; tag = "execute"; }
            const crit = act.riposteT > 0 || Math.random() < critChance();
            if (crit) { m *= 1.6; act.riposteT = 0; tag = tag || "crit"; }
            const dmg = Math.max(1, Math.round(w.dmg * m));
            t.hit(dmg, "melee", { poise: Math.round(poise), knock: heavy || last, crit, heavy, tag, weapon: id });
            if (!a) numberAt(t.x, t.y - 0.6, String(dmg), crit ? "#ffe066" : "#ffffff");
            if (heavy || crit) stop = 8;
        }
        se(w.se, 85, heavy ? 80 : 100 + i * 6);
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
        const d8 = arrowsDir8(), v = d8 ? DIR8_VEC[d8] : facingVec();
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
    // the roll runs into an animal's body: it stops, he bounces off (and a boar's or a wolf's body hurts)
    function rollBump() {
        const Hn = H();
        if (!Hn) return false;
        for (const a of Hn.animals) {
            if (a._dead || a.isJumping()) continue;
            const sp = Hn.SPECIES[a.kind()] || {}, reach = (sp.radius || 0.5) + 0.35;
            if (Math.hypot(a.centerX() - px(), a.centerY() - py()) > reach || !rollingInto(a.centerX(), a.centerY())) continue;
            if (a._mode === "charge" && Hn.gore) { Hn.gore(a); return true; }   // (into a charging boar: its whole charge, see hitPlayer)
            act.mode = "idle";
            act.iframes = 0;
            endSwing();
            shovePlayer(-act.rollDir[0] * BUMP.back, -act.rollDir[1] * BUMP.back);
            act.hitFrom = [-act.rollDir[0], -act.rollDir[1]];
            sparksAt((px() + a.centerX()) / 2, (py() + a.centerY()) / 2 - 0.3, "#e8e8e8", 6);
            const actor = $gameParty.leader();
            if (sp.aggressive && actor && Hn.atkOf) {
                const lost = applyDamage(actor, Math.max(1, Math.round(Hn.atkOf(a) * BUMP.part)));
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
            if (act.queuedRoll) { act.queuedRoll = false; startRoll(); }
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

    // ==================================================================
    // Taking a hit: what an enemy's attack does to the hero. opts: { damage, poise, from: { x, y } (tiles), attacker (the animal),
    // name, unblockable, unparryable, wound (0..1), knock (tiles) } -> "dodged" | "parried" | "blocked" | "guardbreak" | "hit"
    // ==================================================================
    function hitPlayer(opts) {
        const actor = $gameParty.leader();
        if (!actor || actor.isDead()) return "hit";
        act.combatT = 600;
        const src = { kind: opts.attacker && typeof opts.attacker.kind === "function" ? opts.attacker.kind() : "", name: opts.name || "" };
        const from = opts.from || { x: px(), y: py() + 1 };
        let into = false;   // rolled straight at the attacker: no safety, the blow lands in full and throws him back harder
        if (act.iframes > 0) {
            if (!rollingInto(from.x, from.y)) {
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
        const frontal = (ax * fx + ay * fy) / ad > 0.25;
        let damage = opts.damage || 0, poise = opts.poise || 0;
        if (act.mode === "block" && frontal) {
            if (!opts.unparryable && act.blockT <= parryWindow()) {
                se("Parry", 90, 100);
                sparksAt((px() + from.x) / 2, (py() + from.y) / 2 - 0.4, "#fff2b0", 14);
                numberAt(px(), py() - 1.2, "Parowanie!", "#fff2b0", 0.9);
                if (opts.attacker && typeof opts.attacker.onParried === "function") opts.attacker.onParried();
                if (hasSkill("riposte")) act.riposteT = 120;
                hitstop(9);
                return tell("parried", 0, src);
            }
            if (!opts.unblockable) {
                const sh = shield() || NO_SHIELD;
                damage = Math.round(damage * (1 - Math.min(0.9, sh.reduce + perk("block.reduce"))));
                if (sh.id) T.call("Durability", "use", sh.id);   // (every blow taken on it wears the shield; a parry does not)
                breath = Math.max(0, breathNow() - poise * sh.breath * (hasSkill("guard") ? 0.6 : 1));
                breathSpent = 0;
                se("Blow3", 80, 110);
                sparksAt((px() + from.x) / 2, (py() + from.y) / 2 - 0.4, "#e8e8e8", 8);
                shovePlayer(-ax / ad * 0.35, -ay / ad * 0.35);
                if (breath <= 0) {
                    winded = true;
                    numberAt(px(), py() - 1.2, "Garda przełamana!", "#ff9f8f", 0.85);
                    stunPlayer(40, "guard");
                    return tell("guardbreak", applyDamage(actor, damage), src);
                }
                const lost = damage > 0 ? applyDamage(actor, damage) : 0;
                hitstop(4);
                return tell("blocked", lost, src);
            }
        }
        // a clean hit
        endSwing();
        if (act.mode === "attack" || act.mode === "block") act.mode = "idle";
        const lost = applyDamage(actor, damage);
        se("Damage3", 90, 95);
        $gameScreen.startShake(Math.min(9, 3 + damage / 10), 8, 14);
        $gameScreen.startFlash([255, 40, 30, 110], 12);
        const knock = (opts.knock !== undefined ? opts.knock : 0.5) + (into ? 0.7 : 0);
        if (knock > 0) shovePlayer(-ax / ad * knock, -ay / ad * knock);
        act.hitFrom = [-ax / ad, -ay / ad];   // (the way the blow pushes him: his flinch leans that way)
        const down = poise >= knockdownAt();
        if (down) stunPlayer(50, "down");
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
        return tell("hit", lost, src, down);
    }
    // the health the blow takes (Niezłomny takes some of it off); what was lost
    function applyDamage(actor, damage) {
        if (!(damage > 0)) return 0;
        damage = Math.max(1, Math.round(damage * (1 - Math.min(0.6, perk("hurt")))));   // (Niezłomny)
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
    // (Scene_Map.updateMain asks it every frame: true while the world holds still)
    function holdFrame() {
        if (stopFrames <= 0) return false;
        stopFrames--;
        return true;
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
    // ---- what the hero's hits look like when they land on an enemy (Hunting.js calls it from hit())
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
    // A map frame (Combat.js's clock): the breath, the running, the timers, the roll, the guard, the combat keys
    // ==================================================================
    function update() {
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
        const Hn = H();
        if (weapon && act.mode === "idle" && !(Hn && Hn.aim)) switchHand(weapon);
        if (dodge) pressDodge();
        if (act.mode === "attack" && blow) pressAttack();   // (the next blow of the combo: Hunting.js does not see the key while the hero swings)
        if (!act.secondWind || act.combatT > 0) return;
        act.secondWind = false;   // (a new fight: "Drugi oddech" works again)
    }
    // leaving the map / loading: nothing half done
    function resetAct() {
        Object.assign(act, { mode: "idle", combo: 0, queued: false, charge: 0, rollT: 0, iframes: 0, blockT: 0, stun: 0, stunKind: "", comboCd: 0, comboGrace: 0, rollCd: 0, rolls: 0, riposteT: 0, combatT: 0, hurtT: 0, flinchT: 0 });
        breath = -1;
        winded = false;
        stopFrames = 0;
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

    P.fight = { act, ROLL, MELEE, MELEE_ORDER, SHIELDS, RUN, ROLL_KIND, KNOCK_KIND, FIST_ICON, px, py, easeOut, has, hand, handMelee, handIcon, switchHand,
        shield, maxBreath, breathNow, spendBreath, isWinded: () => winded, canRun, pressAttack, pressDodge, hitPlayer, enemyHurtFx, hitstop, numberAt,
        sparksAt, shovePlayer, floaters, sparks, stopFrames: () => stopFrames, holdFrame, update, resetAct, heroSpeed, heldStill, mayRun };
})();
