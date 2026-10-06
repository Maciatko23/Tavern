//=============================================================================
// Creatures.js
//=============================================================================
// The creatures of the ruins - combat stage 4 (docs/WALKA.md 4, 5, 8, 11.4): the eight kinds the underground (Underground.js) puts on
// its floors - rat swarms, giant spiders, empty armours, bat swarms, the drowned, stone sentinels, the wraiths of truth and the
// shadows that wear a resident's face -, the bosses of the hand-made floors (20, 30 ... 90) and the guardian of the tenth gate as a real
// fight. Each attack is shown first (a pose, a "!", a ring or a line on the floor), then lands, then leaves an opening; the hero's roll,
// guard and parry work as against the animals and the men (Combat.js hitPlayer). Hart ducha (Willpower) is used here: the wraiths'
// "truths" and the shadows' fright hit the mind - resisted, they turn on the creature. Data: Creatures_Data.js.
// Like the men (Humans.js), the creatures are not map events: their own list, their own targets (Hunting.addTargets), the 8-way looks of
// Hunting.LOOK8 and the way round what is in the way (Hunting_Path.js); Combat.addFoes gives them bars and the roll's bump.

/*:
 * @target MZ
 * @plugindesc Stwory z ruin (etap 4 walki): szczury, pająki, puste zbroje, nietoperze, topielce, kamienniki, upiory prawdy, cienie z twarzą mieszkańca; bossowie pięter 20-90 i strażnik dziesiątej bramy. Hart ducha chroni przed „prawdami” i strachem. Bossowie 30-90 i cień z własną grafiką. v1.1.0
 * @author Tawerna
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base Hunting
 * @orderAfter Hunting
 * @base Combat
 * @orderAfter Combat
 * @orderAfter Combat_UI
 * @base Creatures_Data
 * @orderAfter Creatures_Data
 * @orderAfter Underground
 *
 * @help
 * ============================================================================
 * STWORY Z RUIN - etap 4 walki (docs/WALKA.md)
 * ============================================================================
 * Stwory mieszkają w podziemiach (Underground.js stawia ich miejsca na
 * piętrach: znaczniki <Stwor:rodzaj>). Każdy atak najpierw widać (poza, "!",
 * koło albo linia na ziemi), potem spada, potem stwór jest odsłonięty.
 *
 * SZCZURY (rój): otaczają i podskakują do ugryzienia - najwyżej dwa naraz.
 * PAJĄK: pluje siecią (lepka: wolniejszy krok), potem wpada i gryzie (rana).
 * PUSTA ZBROJA: lekki cios z przodu dzwoni o blachę - liczy się ciężki cios,
 *   cios w plecy, atak z ukrycia. Obraca się wolno. Raz się rozsypuje i
 *   składa z powrotem - chyba że rozbijesz leżący stos.
 * NIETOPERZE (rój): krążą wysoko (sięga je tylko strzał), nurkują falami -
 *   cień na ziemi pokazuje linię; po nurkowaniu wiszą nisko: wtedy bij.
 * TOPIELEC: łapie i wlecze do wody; złapany dławisz się - O, Spacja albo P
 *   raz po raz wyrywa z uchwytu.
 * KAMIENNIK: z przodu kamienna płyta - nic nie przejdzie; z tyłu świecąca
 *   szczelina. Uderzenie w ziemię (koło) i szarża - w ścianę i stoi ogłuszony.
 * UPIÓR PRAWDY: zwykle niewidoczny; widać go i można trafić, gdy "pokazuje
 *   prawdę". Hart ducha: oprzesz się - prawda wraca do niego i się zatacza;
 *   nie - strach (stoisz jak wryty) albo zamęt (strzałki na odwrót).
 *   Ciosy w czasie "prawdy" ją przerywają.
 * CIEŃ: stoi w ciemności jako ktoś z miasteczka i mówi jego głosem; z bliska
 *   twarz opada - strach (Hart ducha), pazury; trafiony rozpływa się i wychodzi
 *   za tobą (dym pokazuje gdzie).
 * BOSSOWIE pięter ręcznych (każdy z jedną własną sztuczką):
 *   20 Przeor w zbroi - krąg rytuału: trzeci krok w kręgu dostaje odpowiedź
 *      kosturem; spoza kręgu ciosy go nie sięgają.
 *   30 Królowa szczurów - taranuje (w ścianę: oszołomiona), woła roje.
 *   40 Matka pająków - sieci na posadzce, spada spod sklepienia albo
 *      wciąga nicią w górę (O / Spacja / P raz po raz zrywa nić).
 *   50 Topielec z głębiny - kałuże; ranny zanurza się, wychodzi przy tobie.
 *   60 Kamienny Odźwierny - pierścienie odłamków przez całą salę.
 *   70 Zbroja bez herbu - trzy cięcia pod rząd, paruje lekkie ciosy.
 *   80 Upiór pytającego - pytania twoim głosem: odpowiedz ciosem.
 *   90 Ostatni Strażnik - twarz dziadka, potem habit zakonu i trzy cienie.
 *   (Bossowie 30-90 mają własne postacie i arkusze - Cr_Queen, Cr_Mother,
 *   Cr_Deep, Cr_Keeper, Cr_Blank, Cr_Last; cień po odsłonięciu twarzy to
 *   Cr_Shadow z własnym ciosem; nietoperz nurkuje na Cr_Bat_Atk.)
 * STRAŻNIK DZIESIĄTEJ BRAMY (piętro 10): przyjdź w trybie walki albo uderz
 *   go, a zamiast zagadki będzie walka; pokonany otwiera bramę.
 *
 * Poziom stwora zależy od piętra (notatka mapy <Poziom:N>). Pokonany stwór
 * zostawia szczątki - przeszukasz je przyciskiem akcji. Zabite miejsce jest
 * puste przez 3 dni; bossowie nie wracają.
 *
 * F9 (Zdarzenia): "Stwór z ruin: ..." i "Boss podziemi: ..." (←→ wybór).
 *
 * DLA INNYCH WTYCZEK (window.Creatures, Tawerna.api("Creatures")):
 *   Creatures.spawn(kind, x, y, opts) - stwór (albo rój) na polu; kind: szczur,
 *     pajak, zbroja, nietoperz, topielec, kamiennik, upior, cien albo boss
 *     (guardian, boss_20 ... boss_90); opts: { level, engaged, tag, face }
 *   Creatures.list, Creatures.clear(tag), Creatures.bossBeaten(floor)
 * SZYNA: kill { kind, creature: true, boss, ... } (doświadczenie jak za
 *   zwierzę), creatureBoss { kind, floor, how: "start" | "beaten" },
 *   heroMind { kind: "fear" | "confuse", by, resisted }.
 * Zdarzenia mapy: Underground.registerCreature wstawia znaczniki 860-899
 * (niewidzialne); same stwory to postacie tej wtyczki, nie zdarzenia.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Creatures.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const D = window.CreaturesData;
    if (!D) throw new Error("Creatures.js: brak Creatures_Data.js - musi stać nad Creatures.js na liście wtyczek");
    const PLUGIN = "Creatures";
    const KINDS = D.KINDS, BOSSES = D.BOSSES, MIND = D.MIND;

    const H = () => T.api("Hunting");
    const HP = () => { const p = T.api("Hunting_parts"); return p && p.path; };   // the way round what is in the way (Hunting_Path.js)
    const C = () => T.api("Combat");
    const UG = () => T.api("Underground");
    const FX = () => (T.api("Combat_parts") || {}).fight;   // floating words, sparks
    const se = (name, volume, pitch, pan) => T.audio.se(name, { volume, pitch, pan: pan || 0 });
    const popup = (icon, text, color) => T.popup(text, { icon, color, menu: true });
    const say = (ch, text, frames) => T.call("SpeechBubbles", "say", ch, text, frames);
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const perk = key => T.call("Combat", "perk", key) || 0;
    const day = () => T.time.day();
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const STEP = { 1: [-1, 1], 2: [0, 1], 3: [1, 1], 4: [-1, 0], 6: [1, 0], 7: [-1, -1], 8: [0, -1], 9: [1, -1] };
    const OCT = { 0: 6, 1: 3, 2: 2, 3: 1, 4: 4, "-4": 4, "-3": 7, "-2": 8, "-1": 9 };   // octant of (dx, dy) (y down) -> numpad
    const octOf = (dx, dy) => OCT[Math.round(Math.atan2(dy, dx) / (Math.PI / 4))] || 2;
    const DIR4 = (dx, dy) => (Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 4 : 6) : (dy < 0 ? 8 : 2));
    const heroX = () => $gamePlayer._realX + 0.5, heroY = () => $gamePlayer._realY + 0.5;
    const panOf = x => Math.max(-80, Math.min(80, Math.round((x - heroX()) * 12)));
    const numberAt = (x, y, text, color, scale) => { const F = FX(); if (F) F.numberAt(x, y, text, color, scale); };
    const sparksAt = (x, y, color, n) => { const F = FX(); if (F) F.sparksAt(x, y, color, n); };
    const tw = () => $gameMap.tileWidth(), th = () => $gameMap.tileHeight();
    const toSX = x => Math.round($gameMap.adjustX(x - 0.5) * tw() + tw() / 2);
    const toSY = y => Math.round($gameMap.adjustY(y - 0.5) * th() + th() / 2);
    // the hero faces it (within the cosine `cos` of his facing - HeroLook's 8-way one)
    function heroFaces(c, cos) {
        const Hn = H(), [fx, fy] = Hn && Hn.facingVector ? Hn.facingVector() : [0, 1], dx = c.centerX() - heroX(), dy = c.centerY() - heroY(), d = Math.hypot(dx, dy) || 1;
        return (dx * fx + dy * fy) / d > cos;
    }
    // a tile one can stand on (the tiles' passage of the four sides, no event in the way)
    const standable = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && !$gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && !e.isThrough());
    const flyable = (x, y) => { const tx = Math.floor(x), ty = Math.floor(y); return $gameMap.isValid(tx, ty) && $gameMap.checkPassage(tx, ty, 0x0f); };

    // ------------------------------------------------------------------
    // Saved state (TawernaCore): _tw.creatures - the markers emptied (mapId:x,y -> the day), the bosses beaten, the guardian, the drops
    // (remains with what is still to take, per map, gone after a day), the tallies
    // ------------------------------------------------------------------
    const state = T.state.define("creatures", () => ({ killed: {}, bosses: {}, guardian: false, drops: {}, slain: {}, truths: 0, resisted: 0, beatenBosses: 0 }),
        { version: 1, owner: PLUGIN });
    const S = () => state();
    const dropsOf = mapId => { const s = S(), id = mapId || $gameMap.mapId(); return s.drops[id] || (s.drops[id] = []); };
    const clockNow = () => day() * 24 + T.time.hour();

    // ------------------------------------------------------------------
    // The looks (Hunting.js LOOK8): anim8/Cr_<Look>_Walk8 walking (the standing figure in column 0, then the cycle), _Atk8 the blows
    // (pose frames: raise - drawn back, hit - the frame it lands on), _Die8 its end (a pile, rubble); a 4-way $Cr_<Look>* sheet each
    // for a game with the 8-way looks off. A shadow walks in a resident's own sheet (TownLife's Npc_*_Walk8); "Twój cień" in the hero's.
    // ------------------------------------------------------------------
    const LOOKS = {
        Rat: { cell: 68, stride: 0.9, turn: 2, atk: { cell: 68, raise: 4, hit: 6 } },
        Spider: { cell: 80, stride: 1.2, turn: 2, atk: { cell: 96, raise: 4, hit: 7 }, die: { cell: 80 } },
        Armor: { cell: 96, stride: 1.5, turn: 3, atk: { cell: 128, raise: 5, hit: 8 }, die: { cell: 96 } },
        Bat: { cell: 64, stride: 1.4, turn: 1, idle: 4 },
        Drowned: { cell: 96, stride: 1.4, turn: 3, atk: { cell: 128, raise: 4, hit: 7 }, die: { cell: 96 } },
        Stone: { cell: 128, stride: 1.6, turn: 4, atk: { cell: 128, raise: 4, hit: 7 } },   // (its end: it shatters - shards below, rubble left)
        Wraith: { cell: 96, stride: 1.6, turn: 2, idle: 6, atk: { cell: 96, raise: 4, hit: 8 } },
        Prior: { cell: 96, stride: 1.5, turn: 3, atk: { cell: 128, raise: 5, hit: 9 }, die: { cell: 96 } },   // (the boss of floor 20: the prior's armour in his habit)
        // the bosses' own looks (2026-10-06; drawn at their own size, no longer a common creature made big and tinted - BOSSES.look / draw);
        // top: the figure's height over its feet (px) for the bar and the mark; run: a run sheet (_Run8) for the rush (the rat queen's ram)
        Queen: { cell: 128, stride: 1.7, turn: 2, top: 80, atk: { cell: 144, raise: 4, hit: 7 }, run: { cell: 128, stride: 2.6 } },   // (her end: she rolls onto her back, as the rats do)
        Mother: { cell: 160, stride: 1.9, turn: 3, top: 104, atk: { cell: 176, raise: 5, hit: 7 }, die: { cell: 160 } },
        Deep: { cell: 128, stride: 1.6, turn: 3, top: 88, atk: { cell: 160, raise: 5, hit: 8 }, die: { cell: 128 } },
        Keeper: { cell: 176, stride: 2.0, turn: 4, top: 122, atk: { cell: 192, raise: 4, hit: 7 } },   // (its end: it shatters, as the stone sentinels do)
        Blank: { cell: 112, stride: 1.6, turn: 2, top: 66, atk: { cell: 144, raise: 6, hit: 8 }, die: { cell: 112 } },
        Last: { cell: 112, stride: 1.7, turn: 2, top: 70, atk: { cell: 128, raise: 4, hit: 7 }, die: { cell: 112 } },
        Shadow: { cell: 96, stride: 1.5, turn: 2, top: 62, atk: { cell: 112, raise: 4, hit: 8 } }   // (a shadow once the face it wore drops)
    };
    // the bat's dive (its Atk sheet): the screech (wings spread, shaking - up to `raise`), the swoop (wings tucked - the cells after it)
    LOOKS.Bat.atk = { cell: 64, raise: 3, hit: 5, dive: true };
    const sheetName = (look, part) => "$Cr_" + (LOOKS[look] ? look : "Wraith") + (part ? "_" + part : "");   // (never a sheet that is not there: a missing one halts the game)
    const faceName = f => "$Cr_Face_" + f.sheet.replace(/^Npc_|_Walk8$/g, "");   // (its 4-way copy of the resident's $Npc_ sheet)
    function registerLooks() {
        const L = H() && H().LOOK8;
        if (!L || L[sheetName("Rat")]) return;
        for (const [look, d] of Object.entries(LOOKS)) {
            const walk = d.walk || "anim8/Cr_" + look + "_Walk8";
            L[sheetName(look)] = Object.assign({ sheet: walk, cell: d.cell, stride: d.stride, turn: d.turn },
                d.idle ? { idle: { sheet: walk, cell: d.cell, rate: d.idle, turn: d.turn } } : {});
            if (d.run) L[sheetName(look, "Run")] = { sheet: "anim8/Cr_" + look + "_Run8", cell: d.run.cell, stride: d.run.stride, turn: d.turn };
            if (d.atk) L[sheetName(look, "Atk")] = { sheet: d.atk.sheet || "anim8/Cr_" + look + "_Atk8", cell: d.atk.cell, pose: true };
            if (d.die) L[sheetName(look, "Die")] = { sheet: "anim8/Cr_" + look + "_Die8", cell: d.die.cell, pose: true };
        }
        for (const f of D.FACES) L[faceName(f)] = { sheet: f.sheet, cell: 64, stride: 1.4, turn: 2 };
    }
    registerLooks();

    // ==================================================================
    // Game_Creature: a character that thinks for itself (not an event: its own list, like the animals and the men)
    // ==================================================================
    let creatures = [];   // the live ones on this map (and the props of the bosses' rooms)
    let seq = 0;
    function Game_Creature() {
        this.initialize(...arguments);
    }
    Game_Creature.prototype = Object.create(Game_Character.prototype);
    Game_Creature.prototype.constructor = Game_Creature;

    Game_Creature.prototype.initialize = function(kind, x, y, opts) {
        Game_Character.prototype.initialize.call(this);
        opts = opts || {};
        const boss = BOSSES[kind] || null, baseKind = boss ? boss.base : kind, k = KINDS[baseKind];
        this._kind = kind;
        this._base = baseKind;
        this._boss = boss;
        this._def = k;
        this._cid = ++seq;
        this._look = opts.look || (boss && boss.look) || k.look;
        this._face = opts.face || null;
        this._tag = opts.tag || "";
        const Cb = C(), place = opts.level || (Cb && Cb.placeLevel ? placeLevelHere() : 1);
        const lv = Math.max(1, Math.round(opts.level || place + (k.lv || 0) + (boss ? boss.lv || 0 : 0) + (!boss && Math.random() < 0.25 ? 1 : 0)));
        this._level = lv;
        this._attr = {};
        for (const a of ["str", "dex", "con", "per", "wil"]) this._attr[a] = Math.round(k.attr.base[a] + k.attr.grow[a] * (lv - 1));
        const hp0 = boss ? (boss.hp || 0) : k.hp, po0 = boss ? boss.poise : k.poise;
        const G = D.GROW || { hp: 0.12, bossHp: 0.06, poise: 0.08 };
        this._maxHp = Math.round(hp0 * (1 + (boss ? G.bossHp : G.hp) * (lv - 1)) + 4 * (this._attr.con - 5)) * (opts.hpMult || 1);
        this._maxHp = Math.max(4, Math.round(this._maxHp));
        this._hp = this._maxHp;
        this._maxPoise = Math.round(po0 * (1 + G.poise * (lv - 1)) + 2 * (this._attr.con - 5));
        this._poise = this._maxPoise;
        this._poiseT = 0;
        this._stun = 0;
        this._flashT = 0;
        this._engaged = false;
        this._aware = 0;
        this._alarm = 0;
        this._gapT = rnd(20, 60);
        this._dead = false;
        this._dying = 0;
        this._home = { x, y };
        this._faceAng = Math.PI / 2;
        this._poseT = 0;
        this._settle = 0;
        this._alt = 0;
        this._tone = boss ? boss.tone : null;
        this._scale = (boss ? boss.scale : 1) * (k.scale || 1) * (opts.scale || 1);   // (its size in the fight: reach, lunge, words over it)
        this._drawScale = boss && boss.draw ? boss.draw * (opts.scale || 1) : null;   // (a boss with its own art: drawn at the art's size)
        this._radius = (boss && boss.radius) || k.radius * (opts.scale || 1);
        this._hitsTaken = 0;
        this._cd = {};
        this._ai = AI[baseKind];
        this.setImage(this._face ? faceName(this._face) : sheetName(this._look), 0);
        this.setPosition(x, y);
        this.setDirection(2);
        this.setMoveSpeed(k.speed);
        this.setMoveFrequency(5);
        this.setWalkAnime(true);
        this.setStepAnime(false);
        this.setThrough(false);
        this.setPriorityType(1);
        this.setMode(opts.mode || "idle");
        if (this._ai.init) this._ai.init(this, opts);
    };
    // the duck type the fight asks (Combat.js, Hunting_Weapons.js: a living target with life, balance and awareness - the blow from hiding,
    // the white flash, the stars of a reeling one)
    Game_Creature.prototype.isAnimal = function() { return true; };
    Game_Creature.prototype.isCreature = function() { return true; };
    Game_Creature.prototype.kind = function() { return this._kind; };
    Game_Creature.prototype.centerX = function() { return this._realX + 0.5; };
    Game_Creature.prototype.centerY = function() { return this._realY + 0.5; };
    Game_Creature.prototype.playerDistance = function() { return Math.hypot(this.centerX() - heroX(), this.centerY() - heroY()); };
    Game_Creature.prototype.name = function() { return this._boss ? this._boss.name : this._revealed === false && this._face ? this._face.name : this._def.name; };
    Game_Creature.prototype.mercy = function() { return false; };
    // keeps out of buildings (as the animals do)
    Game_Creature.prototype.isMapPassable = function(x, y, d) {
        const F = T.api("Farming");
        if (F && F.buildingAt($gameMap.roundXWithDirection(x, d), $gameMap.roundYWithDirection(y, d))) return false;
        return Game_Character.prototype.isMapPassable.call(this, x, y, d);
    };
    // flying: drawn higher (its shadow stays on the floor - the layer)
    Game_Creature.prototype.screenY = function() { return Game_Character.prototype.screenY.call(this) - Math.round(this._alt || 0); };
    Game_Creature.prototype.screenZ = function() { return this._alt > 14 ? 5 : Game_Character.prototype.screenZ.call(this); };
    // what an attribute gives: Siła the blows, Zręczność the wind-ups (shorter), Czujność the eyes
    Game_Creature.prototype.strK = function() { const G = D.GROW || { dmg: 0.1, str: 0.035 }; return (1 + G.str * (this._attr.str - 5)) * (1 + G.dmg * (this._level - 1)); };
    Game_Creature.prototype.dexK = function() { return Math.max(0.75, 1 - 0.01 * (this._attr.dex - 5)); };
    Game_Creature.prototype.sight = function() { return this._def.sight * (1 + 0.03 * (this._attr.per - 5)); };
    // a target now (the hero's blows and shots - Hunting.addTargets): not a hidden wraith, not a bat high up (only a shot reaches it), not one dying
    Game_Creature.prototype.targetable = function(ranged) {
        if (this._dead || this._dying || this._gone) return false;
        if (this._hidden) return false;
        if (this._def.flying && this._alt > 16 && !ranged) return false;
        return true;
    };
    // what its body does to the hero who rolls into it (Combat.js rollBump)
    Game_Creature.prototype.bumpAtk = function() {
        if (!this._engaged || this._dead || this._stun > 0 || this._hidden) return 0;
        const m = this.moveDef(Object.keys(this._def.moves)[0]);
        return m && m.dmg ? Math.round(m.dmg * this.strK() * 0.4) : 0;
    };
    // the bar's place over its head (Combat_UI.js): a big one is drawn higher
    Game_Creature.prototype.barTop = function() {
        const L = LOOKS[this._look] || {}, cell = L.cell || 64;
        if (L.top && !this._face) return Math.round((L.top + 4) * (this._drawScale || this._scale || 1) + (this._alt || 0));
        return Math.round(Math.min(cell, 70) * Math.max(1, this._scale) * 0.9 + (this._alt || 0));
    };
    Game_Creature.prototype.moveDef = function(name) { return this._def.moves[name || this._move] || null; };
    // the hero in front of it (cos of its facing)
    Game_Creature.prototype.heroInFront = function(cos) {
        const dx = heroX() - this.centerX(), dy = heroY() - this.centerY(), d = Math.hypot(dx, dy) || 1;
        return (dx * Math.cos(this._faceAng) + dy * Math.sin(this._faceAng)) / d > (cos === undefined ? 0.3 : cos);
    };
    Game_Creature.prototype.frontDot = function() {
        const dx = heroX() - this.centerX(), dy = heroY() - this.centerY(), d = Math.hypot(dx, dy) || 1;
        return (dx * Math.cos(this._faceAng) + dy * Math.sin(this._faceAng)) / d;
    };

    // ---- the modes and the picture. idle (where it sits), dormant (a statue - the armour, the stone), lure (the shadow), chase, circle,
    // windup -> strike -> recover, and each kind's own (keep, hop, web, hover, dive, climb, hidden, show, truth, melt, collapsed, rise, sink...)
    Game_Creature.prototype.setMode = function(mode, frames) {
        const k = this._def;
        this._mode = mode;
        this._modeT = frames || 0;
        this._modeLen = this._modeT;
        const fast = mode === "chase" || mode === "flee" || mode === "keep" || mode === "charge";
        this.setMoveSpeed(mode === "charge" ? 5.4 : fast ? k.chase : k.speed);
        if (mode === "windup" || mode === "truth" || mode === "spit") this.setMoveSpeed(5);   // (the step it is in finished at once, not glided on)
        this.updateSheet();
    };
    Game_Creature.prototype.sheetPart = function() {
        const m = this._mode, L = LOOKS[this._look] || {};
        if (this._face) return "";   // (a shadow wearing a face: the resident's own walking sheet only)
        if (this._dying && L.die) return "Die";
        if ((m === "collapsed" || m === "rise") && L.die) return "Die";
        if (!L.atk) return "";
        if (m === "dive") return "Atk";   // (the bat: the screech, the swoop)
        if (m === "ram" && this._modeT > 0) return "Atk";   // (the rat queen crouched for her rush)
        if (m === "ram" && this._running && L.run) return "Run";   // (and the rush itself)
        if (m === "windup" || m === "strike" || m === "spit" || m === "truth" || m === "slamUp") return "Atk";
        if (m === "recover" && this._settle > 0) return "Atk";
        return "";
    };
    Game_Creature.prototype.updateSheet = function() {
        const part = this.sheetPart();
        const name = this._face ? faceName(this._face) : sheetName(this._look, part);
        if (this.characterName() !== name) { this.setImage(name, 0); this._poseT = 0; }
    };
    // the frame of a pose sheet (Hunting.js LOOK8 asks it; cells: how many it has)
    const SETTLE = 14;
    Game_Creature.prototype.look8Col = function(cells, look) {
        const last = cells - 1, L = LOOKS[this._look] || {}, A = L.atk || { raise: 3, hit: 5 };
        const raise = Math.min(last, A.raise), hit = Math.min(last, A.hit), after = Math.min(last, hit + 2);
        const len = Math.max(1, this._modeLen || 1), el = len - Math.max(0, this._modeT), gone = Math.min(1, el / len), part = this.sheetPart();
        if (part === "Die") {
            if (this._dying) return Math.min(last, Math.floor((this._dyingT || 0) / 4));
            if (this._mode === "collapsed") return Math.min(last, Math.floor(this._poseT / 4));
            if (this._mode === "rise") return Math.max(0, last - Math.floor(el / Math.max(1, len / cells)));
            return last;
        }
        const m = this.moveDef();
        switch (this._mode) {
            case "dive": {   // the screech: up to `raise`, shaking; the swoop: the tucked cells as it goes along its line
                if (this._modeT > 0) return Math.min(raise, Math.round(easeInOut(gone) * raise)) - (raise > 1 && Math.floor(el / 4) % 2 ? 1 : 0);
                const D2 = this._diveTo, k = D2 && D2.len ? Math.min(1, D2.gone / D2.len) : 0;
                return Math.min(last, raise + 1 + Math.round(k * (last - raise - 1)));
            }
            case "ram": return Math.round(easeInOut(gone) * raise);   // (crouched, then the rush on the run sheet)
            case "windup": case "spit": case "slamUp": return Math.round(easeInOut(gone) * raise);
            case "truth": return el < 20 ? Math.round((el / 20) * raise) : raise - ((Math.floor(el / 10) % 2) ? 1 : 0);   // (arms up, trembling)
            case "strike": {
                const at = Math.max(1, m && m.hitAt ? m.hitAt : 3);
                if (el <= at) return raise + Math.round((el / at) * (hit - raise));
                return hit + Math.round(Math.min(1, (el - at) / Math.max(1, len - at)) * (after - hit));
            }
            case "recover": return after + Math.round((1 - this._settle / SETTLE) * (last - after));
        }
        return 0;
    };
    // the 8-way facing a pose (and one standing at bay) shows: towards the hero, at its pace; a blow's way is locked
    Game_Creature.prototype.face8 = function() {
        if (this._mode === "dormant" || this._mode === "idle") return this._idleF8 || 0;
        if (this._engaged || this.sheetPart() || this._mode === "lure") {
            const a = this._lockAng !== null && this._lockAng !== undefined ? this._lockAng : this._faceAng;
            return octOf(Math.cos(a), Math.sin(a));
        }
        return 0;
    };
    // the body thrown into the blow (the sprite pushed the locked way, back again after it)
    Game_Creature.prototype.lungeOffset = function() {
        if (!this._lock || (this._mode !== "strike" && this._mode !== "windup")) return null;
        const len = Math.max(1, this._modeLen || 1), el = len - Math.max(0, this._modeT), m = this.moveDef(), at = Math.max(1, m && m.hitAt ? m.hitAt : 3);
        const far = Math.round(((m && m.lunge) || 0.25) * 24 * Math.max(1, this._scale * 0.8));
        let k = 0;
        if (this._mode === "windup") k = -3 * easeInOut(el / len);
        else k = el <= at ? -3 + (far + 3) * easeInOut(el / at) : far * (1 - easeInOut(Math.min(1, (el - at) / Math.max(1, len - at))));
        return [Math.round(this._lock[0] * k), Math.round(this._lock[1] * k * 0.7)];
    };
    // flat out (Combat_UI.js draws its trail): a charge, a ram
    Game_Creature.prototype.isRushing = function() { return !!this._running; };
    // a hovering one breathes on its own sheet (Hunting.js LOOK8 idle)
    Game_Creature.prototype.breathRate = function() { return this._mode === "dive" ? 2 : 1; };

    // ---- moving: a step of the 8 ways (not onto another creature), a walk round what is in the way (Hunting_Path.js)
    Game_Creature.prototype.stepTo = function(d) {
        if (!d) return false;
        if (this._x % 1 || this._y % 1) this.settle();   // (after a free move - a drag, a slide: on a whole tile first)
        const [ox, oy] = STEP[d], nx = this._x + ox, ny = this._y + oy;
        if (creatures.some(o => o !== this && !o._dead && !o._def.flying && o._x === nx && o._y === ny)) return false;
        return HP().takeStep(this, d);
    };
    Game_Creature.prototype.walkTo = function(tx, ty, key, near) {
        // (a drowned one that dragged the hero stands between tiles: the way is searched from a whole one - a fraction of a tile as the
        // start sent Hunting_Path's search round in circles, 2026-10-06)
        if (this._x % 1 || this._y % 1) this.settle();
        const P = HP(), r = P.path8(this, Math.round(tx), Math.round(ty), { animal: true, key, near: near || 0 });
        const went = this.stepTo(r.dir);
        if (P.stalled(this, key, Math.hypot(this._x - tx, this._y - ty), (near || 0) + 0.5, tx, ty)) P.unstall(this);
        return went;
    };
    Game_Creature.prototype.faceHero = function() {
        const dx = heroX() - this.centerX(), dy = heroY() - this.centerY();
        this.setDirection(DIR4(dx, dy));
    };
    // a straight run at the hero (nothing in the way)
    Game_Creature.prototype.clearRun = function() {
        return HP().clearLine(HP().pathGrid(), this._x, this._y, $gamePlayer.x, $gamePlayer.y, true);
    };
    // a step away from the hero (the best of the 8 ways)
    Game_Creature.prototype.stepAway = function() {
        const best = [2, 4, 6, 8, 1, 3, 7, 9].map(d => ({ d, s: Math.hypot(this._x + STEP[d][0] - $gamePlayer._realX, this._y + STEP[d][1] - $gamePlayer._realY) }))
            .filter(o => RoamingActor.canStep(this, this._x, this._y, o.d)).sort((a, b) => b.s - a.s)[0];
        return best ? this.stepTo(best.d) : false;
    };
    // a free move by (dx, dy) tiles (a flyer, a slide): to where it can be (flyers over any floor, walkers on a tile they can stand on)
    Game_Creature.prototype.glide = function(dx, dy, flying) {
        const nx = this._realX + dx, ny = this._realY + dy;
        const ok = flying ? flyable(nx + 0.5, ny + 0.5) : standable(Math.round(nx), Math.round(ny)) || (Math.round(nx) === this._x && Math.round(ny) === this._y);
        if (!ok) return false;
        this._realX = this._x = nx;
        this._realY = this._y = ny;
        return true;
    };
    // back on a whole tile after a free move (the engine walks it there)
    Game_Creature.prototype.settle = function() {
        const x = Math.round(this._realX), y = Math.round(this._realY);
        if (this._x === x && this._y === y && this._realX === x && this._realY === y) return;
        this._x = standable(x, y) || this._def.flying ? x : Math.round(this._home.x);
        this._y = standable(x, y) || this._def.flying ? y : Math.round(this._home.y);
        if (!standable(this._x, this._y) && !this._def.flying) { this._x = x; this._y = y; }
    };
    // turned where it stands: towards the hero, at the kind's pace (a slow one is got behind); a blow's way is locked
    Game_Creature.prototype.turnFront = function() {
        if (!this._engaged || this._mode === "windup" || this._mode === "strike" || this._mode === "charge" || this._mode === "dive") return;
        const want = Math.atan2(heroY() - this.centerY(), heroX() - this.centerX());
        let d = want - this._faceAng;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        const step = ((this._boss && this._boss.turn) || this._def.turn) * (this._stun > 0 ? 0 : 1);
        this._faceAng += Math.max(-step, Math.min(step, d));
        if (!this.isMoving()) this.setDirection(DIR4(Math.cos(this._faceAng), Math.sin(this._faceAng)));
    };

    // ==================================================================
    // A frame
    // ==================================================================
    Game_Creature.prototype.update = function() {
        Game_Character.prototype.update.call(this);
        this._poseT++;
        if (this._flashT > 0) this._flashT--;
        if (this._alarm > 0) this._alarm--;
        if (this._dying) { this.updateDying(); return; }
        if (this._dead) return;
        if (++this._poiseT > 150 && this._poise < this._maxPoise) this._poise = Math.min(this._maxPoise, this._poise + this._maxPoise / 100);
        for (const key of Object.keys(this._cd)) if (this._cd[key] > 0) this._cd[key]--;
        this.updateSenses();
        this.updateMarks();
        if (this._frozen) return;
        if (this._hitStop > 0) { this._hitStop--; return; }
        if (this._stun > 0) {
            this._lockAng = null;
            if (this._mode === "windup" || this._mode === "strike" || this._mode === "truth" || this._mode === "spit") this.setMode("chase");
            if (this._ai.stunned) this._ai.stunned(this);
            if (--this._stun === 0) this.afterStun();
            return;
        }
        if (this._modeT > 0) this._modeT--;
        if (this._gapT > 0) this._gapT--;
        if (this._settle > 0) this._settle--;
        this.turnFront();
        this.think();
        // a boss's own mechanic - once it has started (engaged: bossStart ran its start); a boss spawned with the map waits for that
        if (this._boss && this._bossStarted && BOSS_AI[this._kind] && BOSS_AI[this._kind].tick && !this._dead && !this._dying) BOSS_AI[this._kind].tick(this);
        this.updateSheet();
    };
    // its eyes and ears: the awareness meter of the animals (Hunting.noticeRate - cover, sneaking, the dark)
    Game_Creature.prototype.updateSenses = function() {
        if (this._engaged) return;
        const Hn = H();
        if (!Hn || !Hn.updateAwareness) return;
        const k = this._mode === "dormant" ? 0.55 : 1;
        Hn.updateAwareness(this, this.centerX(), this.centerY(), this.sight() * k);
        if (this._alarm > 0) this._aware = Math.max(this._aware, 0.5);
    };
    // "?" / "!" over its head (Hunting.updateMark), "!" while it winds up; none for the small swarm ones (only their crouch)
    Game_Creature.prototype.updateMarks = function() {
        const sp = this._sprite, Hn = H();
        if (!sp || !sp.bitmap || !sp.bitmap.isReady() || !Hn) return;
        const m = this._mode, tele = m === "windup" || m === "truth" || m === "spit" || m === "slamUp" || (m === "charge" && this._modeT > 0 && !this._running);
        const calm = m === "idle" || m === "dormant" || m === "lure" || m === "alert";
        const small = !!this._def.swarm && !this._boss;
        const hidden = this._hidden || (this._opacity !== undefined && this._opacity < 80);
        const L = LOOKS[this._look] || {}, cell = L.cell || 64, top = L.top && !this._face ? -L.top - 10 : -Math.round(Math.min(cell, 96) * 0.82) - 4;
        // (on a holder beside its sprite, not on the sprite: a boss's size and a shadow's black tone would take the mark with them)
        let holder = this._markHolder;
        if (!holder || holder.parent !== sp.parent) {
            if (holder && holder.parent) holder.parent.removeChild(holder);
            holder = this._markHolder = new Sprite();
            holder.z = 7;
            if (sp.parent) sp.parent.addChild(holder);
            this._markSprite = null;
        }
        Hn.updateMark(this, holder, Math.round(top * Math.max(1, Math.abs(sp.scale.y) || 1)), this._stun > 0 || hidden || (small && !tele) ? 0 : tele ? (small ? 0 : 1) : calm ? this._aware : 0);
    };
    Game_Creature.prototype.think = function() {
        const m = this._mode;
        if (m === "idle" || m === "dormant" || m === "lure") return this.thinkCalm();
        if (m === "wake") { if (this._modeT <= 0) this.engage(); return; }
        if (m === "return") return this.thinkReturn();
        if (BOSS_MODES[m]) return;   // (a boss's own moment - BOSS_AI's tick drives it)
        if (m === "crashed") { if (this._modeT <= 0) { this._stoneStunned = false; this._running = false; this.setMode("chase"); this._gapT = 30; } return; }   // (a charge into a wall)
        if (this.thinkMove()) return;
        // too far from the hero, or from home: back (only while it hunts him - not lying in pieces, not with him in its grip)
        if (!this._boss && LEASH_MODES[m] && (this.playerDistance() > 16 || Math.hypot(this._x - this._home.x, this._y - this._home.y) > 22) && !this._grabbing) { this.disengage(); return; }
        return this._ai.think(this);
    };
    const BOSS_MODES = { climb: true, above: true, pull: true, sinkAway: true, underwater: true, answer: true, ram: true, waitParts: true };
    const LEASH_MODES = { chase: true, circle: true, keep: true, hover: true, drift: true };
    Game_Creature.prototype.thinkCalm = function() {
        const B = this._boss ? BOSS_AI[this._kind] : null;
        if (B && B.calm && B.calm(this)) return;
        if (this._ai.calm && this._ai.calm(this)) return;
        if (this._mode === "dormant" && this.playerDistance() < 2.2) {   // (right beside a statue: it feels him, seen or not - slowly when he sneaks)
            const Hn = H();
            this._aware = Math.min(1, this._aware + (Hn && Hn.sneaking && Hn.sneaking() ? 0.012 : 0.05));
        }
        if (this._aware >= 1 || this._alarm > 0 && this._aware > 0.6) { this.wakeUp(); return; }
        if (this._mode === "idle" && !this._def.flying && !this.isMoving() && Math.random() < 0.01) {
            const dirs = [2, 4, 6, 8].filter(d => RoamingActor.canStep(this, this._x, this._y, d) && Math.hypot(this._x + STEP[d][0] - this._home.x, this._y + STEP[d][1] - this._home.y) <= 2);
            if (dirs.length) this.stepTo(pick(dirs));
        }
    };
    Game_Creature.prototype.wakeUp = function() {
        if (this._engaged) return;
        const slow = this._mode === "dormant";
        if (slow) {   // a statue comes alive: a moment (the flame in the helm, the eyes in the stone)
            this.setMode("wake", 40);
            se(this._base === "kamiennik" ? "Earth2" : "Equip3", 70, 70, panOf(this.centerX()));
            return;
        }
        this.engage();
    };
    Game_Creature.prototype.engage = function() {
        if (this._engaged || this._dead) return;
        this._engaged = true;
        this._aware = 1;
        this._faceAng = Math.atan2(heroY() - this.centerY(), heroX() - this.centerX());
        if (this._ai.engage) this._ai.engage(this);
        else this.setMode("chase");
        if (this._swarm) for (const o of this._swarm.members) if (o !== this && !o._engaged && !o._dead) { o._aware = 1; o.engage(); }
        if (this._boss && !this._bossStarted) bossStart(this);
    };
    Game_Creature.prototype.disengage = function() {
        this._engaged = false;
        this._aware = 0.4;
        this._lockAng = null;
        this.setMode("return");
    };
    Game_Creature.prototype.thinkReturn = function() {
        if (this._aware >= 1) { this.engage(); return; }
        const h = this._home;
        if (this._def.flying) {
            const dx = h.x - this._realX, dy = h.y - this._realY, d = Math.hypot(dx, dy);
            if (d < 0.3) { this.setMode("idle"); return; }
            this.glide(dx / d * 0.06, dy / d * 0.06, true);
            return;
        }
        if (Math.hypot(this._x - h.x, this._y - h.y) <= 0.5 || (this._returnT = (this._returnT || 0) + 1) > 900) {
            this._returnT = 0;
            this.setMode(this._def.reassemble || this._def.stone ? "dormant" : "idle");
            return;
        }
        if (!this.isMoving()) this.walkTo(h.x, h.y, "back", 0);
    };
    Game_Creature.prototype.afterStun = function() {
        this._poise = this._maxPoise;
        if (this._dead) return;
        if (this._ai.afterStun) { this._ai.afterStun(this); return; }
        if (!this._engaged) this.engage();
        else { this.setMode("chase"); this._gapT = Math.max(this._gapT, 14); }
    };

    // ==================================================================
    // Moves: the wind-up (the "!", the pose; the way to the hero locked) -> the strike (lands on its frame) -> the opening
    // ==================================================================
    // the creatures' turns: at most two big ones wind up at once (the swarms have their own count)
    const attacking = () => creatures.filter(c => !c._dead && !c._def.swarm && (c._mode === "windup" || c._mode === "strike" || c._mode === "truth")).length;
    Game_Creature.prototype.mayAttack = function() {
        if (this._gapT > 0) return false;
        if (this._swarm) return this._swarm.members.filter(o => !o._dead && (o._mode === "windup" || o._mode === "strike" || o._mode === "dive")).length < (this._def.attackers || this._def.divers || 2);
        if (this._partOf) return attacking() < 1;   // (the last guard's shadows: one blow of the three at a time - readable, 2026-10-06)
        return this._boss || attacking() < 2;
    };
    Game_Creature.prototype.startMove = function(name, opts) {
        opts = opts || {};
        const m = this.moveDef(name), dx = heroX() - this.centerX(), dy = heroY() - this.centerY(), d = Math.hypot(dx, dy) || 1;
        this._move = name;
        this._lock = [dx / d, dy / d];
        this._lockAng = Math.atan2(dy, dx);
        this._faceAng = this._lockAng;
        this._parried = false;
        this._struck = false;
        this._breaks = 0;
        this.setDirection(DIR4(dx, dy));
        this.setMode("windup", Math.max(8, Math.round((opts.windup || m.windup) * this.dexK())));
        if (m.guardBreak || m.ring) { se("Equip1", 75, 60, panOf(this.centerX())); sparksAt(this.centerX() + this._lock[0] * 0.2, this.centerY() - 1.1 * this._scale, "#fff2b0", 6); }
        // (a blow on the floor: its ring shows where, all through the wind-up)
        if (m.ring) rings.push({ x: this.centerX() + this._lock[0] * (m.ahead || 0), y: this.centerY() + this._lock[1] * (m.ahead || 0), r: m.radius, t: 0, life: this._modeT + 2, kind: "warn", c: this });
        else if (this._def.swarm) se("Cat", 30, 160 + rnd(0, 30), panOf(this.centerX()));
        else se("Equip2", 45, 110, panOf(this.centerX()));
        if (this._base === "szczur" || this._base === "pajak") se("Monster1", 25, 150, panOf(this.centerX()));
    };
    // a move under way: true while it lasts
    Game_Creature.prototype.thinkMove = function() {
        const mode = this._mode, m = this.moveDef();
        if (mode === "windup") {
            if (this._modeT <= 0) {
                this.setMode("strike", (m && m.strike) || 12);
                this._struck = false;
                se(m && m.guardBreak ? "Wind7" : "Wind7", 70, m && m.guardBreak ? 70 : 105 + rnd(0, 12), panOf(this.centerX()));
                if (m && m.lunge && !this._def.swarm) this._lungeGo = m.lunge;
            }
            return true;
        }
        if (mode === "strike") {
            if (!this._struck && this._modeLen - this._modeT >= ((m && m.hitAt) || 3)) {
                this._struck = true;
                this.land(m);
                if (this._mode !== "strike") return true;
            }
            if (this._modeT <= 0) {
                this._lockAng = null;
                this.setMode("recover", (m && m.recover) || 30);
                this._settle = SETTLE;
                this._gapT = Math.max(this._gapT, rnd(10, 40));
                if (this._ai.afterMove) this._ai.afterMove(this, m);
                const B = this._boss ? BOSS_AI[this._kind] : null;
                if (B && B.afterMove) B.afterMove(this, m);
            }
            return true;
        }
        if (mode === "recover") {
            if (this._modeT <= 0) { this.setMode("chase"); this._gapT = Math.max(this._gapT, rnd(8, 26)); }
            return true;
        }
        return false;
    };
    // the blow lands (its frame): the hero within its reach and in its cone (the locked way), or in its ring - his roll, guard or parry decide
    Game_Creature.prototype.land = function(m) {
        if (!m) return null;
        if (this._ai.land && this._ai.land(this, m) !== undefined) return null;
        const Cb = C(), dx = heroX() - this.centerX(), dy = heroY() - this.centerY(), d = Math.hypot(dx, dy), [lx, ly] = this._lock || [0, 1];
        if (m.ring) {
            const cx = this.centerX() + lx * (m.ahead || 0), cy = this.centerY() + ly * (m.ahead || 0);
            this.ringFx(cx, cy, m.radius);
            if (Math.hypot(heroX() - cx, heroY() - cy) > m.radius) return null;
        } else if (d > m.reach * Math.max(1, this._scale * 0.85) || (d > 0.3 && (dx * lx + dy * ly) / d < m.cone)) return null;   // (out of reach, or beside it)
        if (!Cb || !Cb.hitPlayer) return null;
        const B = this._boss ? BOSS_AI[this._kind] : null;
        const part = this._partOf && this._partOf._boss ? this._partOf._boss.partDmg || 1 : 1;   // (a shadow of the last guard: a part of its blow)
        const dmg = B && B.damage ? B.damage(this) : m.dmg * this.strK() * ((this._boss && this._boss.dmg) || 1) * part;
        const res = Cb.hitPlayer({ damage: Math.max(1, Math.round(dmg)), poise: Math.round(m.poise * (1 + 0.03 * (this._attr.str - 5))),
            from: { x: this.centerX(), y: this.centerY() }, attacker: this, name: this.name().toLowerCase(), wound: m.wound, knock: m.knock,
            guardBreak: !!m.guardBreak || !!this._heavy, unblockable: !!m.ring, unparryable: !!m.ring || !!m.unparryable, down: m.down });
        this._heavy = false;
        if (res === "hit") { this._hitStop = 2; se(m.guardBreak || m.ring ? "Blow3" : "Blow1", 80, 90, panOf(this.centerX())); }
        if (res === "hit" && m.breath) T.call("Combat", "drainBreath", 100 * m.breath);
        if (this._ai.landed) this._ai.landed(this, m, res);
        const BL = this._boss ? BOSS_AI[this._kind] : null;
        if (BL && BL.landed) BL.landed(this, m, res);
        return res;
    };
    // a shockwave on the floor: dust in a ring
    Game_Creature.prototype.ringFx = function(cx, cy, r) {
        for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; sparksAt(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.6, "#9c8a70", 2); }
        $gameScreen.startShake(5, 8, 14);
        se("Blow6", 85, 60, panOf(cx));
        rings.push({ x: cx, y: cy, r, t: 0, life: 20, kind: "wave" });
    };
    // the hero parried the blow (Combat.js): it reels a long moment
    Game_Creature.prototype.onParried = function() {
        this._parried = true;
        this._stun = Math.max(this._stun, this._def.stun + 30);
        this._poise = 0;
        this._lockAng = null;
        if (this._ai.parried) this._ai.parried(this);
        if (this._boss && BOSS_AI[this._kind] && BOSS_AI[this._kind].parried) BOSS_AI[this._kind].parried(this);
        knockBack(this);
    };

    // ==================================================================
    // A hit on a creature: what its kind lets through (the armour's plate, the stone's front), then the hurt, the balance, the reeling;
    // its end (a fall to pieces it gets up from, its death)
    // ==================================================================
    function hitCreature(c, damage, how, extra) {
        if (c._dead || c._dying || !c.targetable(how === "shot")) return;
        extra = extra || {};
        const k = c._def, heavy = !!extra.heavy, hidden = extra.tag === "sneak" || extra.tag === "heart";
        let poise = extra.poise !== undefined ? extra.poise : Math.round(damage * 0.8);
        // a boss's own guard first (the prior's ring, the parry of the armour without arms)
        const BG = c._boss ? BOSS_AI[c._kind] : null;
        if (BG && BG.guard && BG.guard(c, damage, how, extra)) return;
        // the armour lying in pieces: one blow and it stays down for good
        if (c._mode === "collapsed" && k.reassemble) {
            numberAt(c.centerX(), c.centerY() - 1.0, MIND.broken, "#ffd27f", 0.9);
            se("Crash", 80, 110, panOf(c.centerX()));
            sparksAt(c.centerX(), c.centerY() - 0.3, "#c9c2b0", 12);
            c._hp = 0;
            die(c, how, true);
            return;
        }
        // the plate: a light blow from the front only rings
        const plate = k.plate && !(c._boss && c._boss.noPlate);
        if (plate && !hidden && !heavy && how !== "shot" && c.frontDot() > k.plate.back) {
            damage = Math.max(1, Math.round(damage * k.plate.light));
            poise = 0;
            numberAt(c.centerX(), c.centerY() - 1.35 * c._scale, MIND.plate, "#cfd6de", 0.75);
            sparksAt(c.centerX() - (c.centerX() - heroX()) * 0.3, c.centerY() - 0.6, "#f0f0e0", 8);
            se("Sword4", 75, 125, panOf(c.centerX()));
            T.call("Combat", "recoil", 8);
        } else if (plate && !hidden && how !== "shot" && c.frontDot() <= k.plate.back) {
            numberAt(c.centerX(), c.centerY() - 1.55 * c._scale, "Cios w plecy!", "#ffd27f", 0.75);
        }
        // the stone: nothing through its front; its back's crack hurts it most
        if (k.stone && !hidden && !c._stoneStunned) {
            const f = c.frontDot();
            if (f > k.stone.front) {
                numberAt(c.centerX(), c.centerY() - 1.6 * c._scale, MIND.stone, "#cfd6de", 0.8);
                sparksAt(c.centerX() - (c.centerX() - heroX()) * 0.35, c.centerY() - 0.7, "#e8e0c8", 10);
                se("Sword4", 85, 80, panOf(c.centerX()));
                if (how !== "shot") T.call("Combat", "recoil", 14);
                if (!c._engaged) c.engage();
                return;
            }
            if (f < k.stone.back) { damage = Math.round(damage * k.stone.backMult); numberAt(c.centerX(), c.centerY() - 1.75 * c._scale, MIND.crack, "#ffb070", 0.85); }
            else damage = Math.round(damage * k.stone.side);
        }
        if (k.stone && c._stoneStunned) damage = Math.round(damage * k.stone.stunned);
        hurt(c, damage, poise, how, extra);
    }
    function hurt(c, damage, poise, how, extra) {
        const Cb = C();
        c._hp -= damage;
        c._poiseT = 0;
        c._hitsTaken++;
        if (Cb && Cb.enemyHurtFx && damage > 0) Cb.enemyHurtFx(c, damage, how, extra);
        se(c._base === "kamiennik" || c._base === "zbroja" ? "Blow3" : "Damage1", 60, 105, panOf(c.centerX()));
        const Hn = H();
        if (Hn && Hn.makeNoise) Hn.makeNoise(c.centerX(), c.centerY(), extra.tag === "sneak" ? 3 : 7);
        if (c._ai.hurt) c._ai.hurt(c, damage, how, extra);
        if (c._boss && BOSS_AI[c._kind] && BOSS_AI[c._kind].hurt) BOSS_AI[c._kind].hurt(c, damage, how, extra);
        if (c._hp <= 0) { fall(c, how); return; }
        if (c._dead || c._dying || c._hidden) return;
        if (!c._engaged && !(extra.tag === "sneak" && poise >= c._poise)) c.engage();
        c._poise -= poise;
        if (c._poise <= 0) stagger(c, !!extra.knock);
        else if (extra.knock && !c._boss && c._base !== "kamiennik" && c._base !== "zbroja") knockBack(c);
    }
    function stagger(c, knock) {
        c._stun = c._def.stun;
        c._poise = 0;
        c._lockAng = null;
        if (c._mode === "windup" || c._mode === "strike" || c._mode === "truth" || c._mode === "spit") c.setMode("chase");
        if (knock && !c._boss) knockBack(c);
        if (c._ai.staggered) c._ai.staggered(c);
    }
    // thrown one tile away from the hero (a jump), when there is room
    function knockBack(c) {
        if (c.isJumping() || c._def.flying || c._boss) return;
        const ax = c._x - $gamePlayer.x, ay = c._y - $gamePlayer.y;
        const bx = Math.abs(ax) >= Math.abs(ay) ? Math.sign(ax) : 0, by = Math.abs(ax) >= Math.abs(ay) ? 0 : Math.sign(ay);
        const d = bx > 0 ? 6 : bx < 0 ? 4 : by > 0 ? 2 : 8;
        if ((bx || by) && c.canPass(c._x, c._y, d) && !creatures.some(o => o !== c && !o._def.flying && o._x === c._x + bx && o._y === c._y + by)) c.jump(bx, by); else c.jump(0, 0);
    }
    // its life gone: the armour falls to pieces (and may rise), a boss may have one more phase, the rest die
    function fall(c, how) {
        if (c._fakeOf) { fakeBurst(c); return; }
        if (c._boss && BOSS_AI[c._kind] && BOSS_AI[c._kind].fall && BOSS_AI[c._kind].fall(c, how)) return;
        const r = c._def.reassemble;
        if (r && !c._reassembled && (r.once || c._boss)) { collapse(c); return; }
        die(c, how);
    }
    // a false image of the prior's wraith hit: it bursts - and its truth hits the hero's mind
    function fakeBurst(c) {
        numberAt(c.centerX(), c.centerY() - 1.5 * c._scale, "Odbicie!", "#e0d8ff", 0.9);
        for (let i = 0; i < 14; i++) wisps.push({ x: c.centerX() + (Math.random() - 0.5) * 0.9, y: c.centerY() - Math.random() * 1.4, vy: -0.03, t: 0, life: 36, color: "#e0e6f0" });
        se("Darkness2", 70, 140, panOf(c.centerX()));
        const real = c._fakeOf;
        if (real) mindHit(real, Math.random() < 0.5 ? "fear" : "confuse", 0.1, null, real._def.moves.truth);
        removeCreature(c);
    }
    // the armour falls apart: lies in pieces (a blow on the pile ends it), then puts itself together again with part of its life
    function collapse(c) {
        const r = c._def.reassemble;
        c._reassembled = true;
        c._hp = 0;
        c._stun = 0;
        c._lockAng = null;
        c._engaged = true;
        c.setMode("collapsed", (r.lie || 240) + (c._boss ? 60 : 0));
        se("Crash", 85, 80, panOf(c.centerX()));
        sparksAt(c.centerX(), c.centerY() - 0.4, "#c9c2b0", 14);
        $gameScreen.startShake(3, 8, 10);
    }
    function rise(c) {
        const r = c._def.reassemble;
        c.setMode("rise", 50);
        c._hp = Math.max(1, Math.round(c._maxHp * (r.hp || 0.4)));
        c._poise = c._maxPoise;
        numberAt(c.centerX(), c.centerY() - 1.4 * c._scale, MIND.rises, "#ffb07f", 0.85);
        se("Equip3", 80, 60, panOf(c.centerX()));
    }
    // dead: the kill on the bus (Combat.js gives the experience), its last moments (its own end), then its remains with what it had
    function die(c, how, broken) {
        if (c._dead || c._dying) return;
        c._dying = true;
        c._dyingT = 0;
        c._engaged = false;
        c._lockAng = null;
        c._hp = 0;
        c._stun = 0;
        if (grab && grab.c === c) releaseGrab(false);
        const s = S();
        s.slain[c._base] = (s.slain[c._base] || 0) + 1;
        if (c._swarm) c._swarm.left = c._swarm.members.filter(o => !o._dead && !o._dying).length;
        const e = { kind: c._kind, by: "hero", how: how || "", mapId: $gameMap.mapId(), x: c.centerX(), y: c.centerY(), level: c._level, animal: c, creature: true,
            boss: !!c._boss, name: c.name(), tag: c._tag, noXp: !!c._ownerBoss };
        T.emit("kill", e);
        se(c._base === "zbroja" ? "Crash" : c._base === "kamiennik" ? "Earth3" : c._base === "upior" || c._base === "cien" ? "Darkness3" : "Collapse1", 70, c._def.swarm ? 140 : 90, panOf(c.centerX()));
        if (c._base === "kamiennik") $gameScreen.startShake(4, 8, 16);
        if (c._marker) markerDone(c);
        if (c._boss) bossBeaten(c);
        if (c._partOf) partGone(c);
        c._broken = !!broken;
    }
    // the stone sentinel's end: the picture of it as it stands now cut into blocks that burst out a little and tumble to the floor
    let shards = [];
    function shatter(c) {
        const sp = c._sprite;
        if (!sp || !sp.bitmap || !sp._frame) return;
        const f = sp._frame, B = 12, sc = Math.abs(sp.scale.y) || 1, tws = tw();
        for (let y = 0; y < f.height; y += B) for (let x = 0; x < f.width; x += B) {
            const ox = (x + B / 2 - f.width * sp.anchor.x) * sc, oy = (y + B / 2 - f.height * sp.anchor.y) * sc;   // (from the feet, px)
            shards.push({ bmp: sp.bitmap, fx: f.x + x, fy: f.y + y, w: B, h: B, mx: c._realX + 0.5 + ox / tws, my: c._realY + 1, lift: -oy, sc,
                vx: ox / tws * 0.03 + (Math.random() - 0.5) * 0.02, vlift: 1 + Math.random() * 2, rot: (Math.random() - 0.5) * 0.3, t: 0, life: 70 + rnd(0, 20) });
        }
        c._opacity = 0;
        $gameScreen.startShake(5, 9, 18);
    }
    // the last frames of each kind: the pile / the rubble (its Die sheet, or it is already lying), the wraith dissolving, the shadow
    // going to smoke, a rat or a bat dropping, the drowned sinking into its puddle - then the remains stay
    const DYING = { szczur: 30, nietoperz: 40, pajak: 48, zbroja: 56, topielec: 60, kamiennik: 60, upior: 80, cien: 60 };
    Game_Creature.prototype.updateDying = function() {
        this._dyingT++;
        const len = DYING[this._base] || 50, t = this._dyingT, k = Math.min(1, t / len);
        if (this._base === "kamiennik" && t === 1) shatter(this);   // (the stone breaks into blocks that tumble down)
        if (this._base === "upior" || this._base === "cien") {   // dissolving: thinner, lighter, rising wisps (one with an end of its own - the
            // last guard's habit falling empty - stays to lie there)
            if (!(LOOKS[this._look] || {}).die) this._opacity = Math.round(255 * (1 - k));
            if (t % 3 === 0) wisps.push({ x: this.centerX() + (Math.random() - 0.5) * 0.7, y: this.centerY() - Math.random() * 0.9 * this._scale, vy: -0.02 - Math.random() * 0.02,
                t: 0, life: 40, color: this._base === "upior" ? "#d8e2ea" : "#14101c" });
        } else if (this._def.flying) {
            this._alt = Math.max(0, (this._alt || 0) - 1.5);
        }
        if (t >= len) {
            this._dead = true;
            leaveRemains(this);
            removeCreature(this);
        }
    };

    // ==================================================================
    // The kinds' minds
    // ==================================================================
    // the ring round the hero a waiting one keeps to (its slot by its place in the swarm / among the others)
    function ringSpot(c, radius) {
        const group = c._swarm ? c._swarm.members.filter(o => !o._dead && !o._dying) : creatures.filter(o => !o._dead && o._engaged && !o._def.flying);
        const i = Math.max(0, group.indexOf(c)), n = Math.max(1, group.length), turn = (c._swarm ? c._swarm.angle : 0) + (c._ringOff || 0);
        const G = HP().pathGrid();
        for (let k = 0; k < 8; k++) {
            const a = turn + (i / n) * Math.PI * 2 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * Math.PI / 6;
            const x = Math.round($gamePlayer._realX + Math.cos(a) * radius), y = Math.round($gamePlayer._realY + Math.sin(a) * radius * 0.85);
            if (HP().gridOpen(G, x, y, true) && !creatures.some(o => o !== c && !o._dead && !o._def.flying && o._x === x && o._y === y)) return { x, y };
        }
        return null;
    }
    // waiting for its turn: its place on the ring, a step along it now and then
    function circle(c, radius) {
        if (c._mode !== "circle") c.setMode("circle");
        if (c.isMoving()) return;
        const spot = ringSpot(c, radius);
        if (!spot) { c.faceHero(); return; }
        if (c.playerDistance() < radius * 0.6 && c.stepAway()) return;
        if (Math.hypot(spot.x - c._x, spot.y - c._y) > 0.6) { if (!c.walkTo(spot.x, spot.y, "ring", 0)) c.faceHero(); }
        else {
            c.faceHero();
            if ((c._still = (c._still || 0) + 1) > rnd(40, 100)) { c._still = 0; c._ringOff = (c._ringOff || 0) + (Math.random() < 0.5 ? -0.45 : 0.45); }
        }
    }
    // in to blow range when it may, else on the ring
    function melee(c, name, ring) {
        const m = c.moveDef(name), dist = c.playerDistance(), at = m.at * Math.max(1, c._scale * 0.85);
        if (c.mayAttack() && dist <= at && c.clearRun()) { c.startMove(name); return true; }
        if (c.isMoving()) return false;
        if (c.mayAttack()) {
            if (c._mode !== "chase") c.setMode("chase");
            if (dist <= 1.1) { c.faceHero(); return false; }
            if (!c.walkTo($gamePlayer.x, $gamePlayer.y, "in", 1)) c.faceHero();
            return false;
        }
        circle(c, ring || 2.6);
        return false;
    }

    const AI = {};
    // ---- RATS: the swarm on its ring; in to bite when its turn comes, then away
    AI.szczur = {
        think(c) {
            melee(c, "bite", c._def.ring);
        },
        afterMove(c) { c._backT = 1; c._gapT = rnd(30, 80); },
        calm(c) {   // nibbling where they sit
            if (c._mode === "idle" && Math.random() < 0.004 && c.playerDistance() < 8) se("Cat", 15, 190, panOf(c.centerX()));
            return false;
        }
    };

    // ---- SPIDER: keeps its distance, spits a web, rushes in to bite, springs back
    AI.pajak = {
        think(c) {
            const m = c._def.moves, dist = c.playerDistance(), keep = c._def.keep;
            if (c._mode === "spit") {
                if (c._modeT <= 0) {
                    if (c._boss && BOSS_AI[c._kind] && BOSS_AI[c._kind].spit) BOSS_AI[c._kind].spit(c); else spitWeb(c);
                    c.setMode("recover", m.web.recover); c._settle = SETTLE; c._cd.web = m.web.cd;
                }
                return;
            }
            if (c.isMoving()) return;
            if (!c._cd.web && dist >= 2.4 && dist <= m.web.range && c.clearRun() && c.mayAttack() && !webbed()) {
                const dx = heroX() - c.centerX(), dy = heroY() - c.centerY(), d = Math.hypot(dx, dy) || 1;
                c._lock = [dx / d, dy / d]; c._lockAng = Math.atan2(dy, dx); c._faceAng = c._lockAng; c._move = "web";
                c.setMode("spit", Math.round(m.web.windup * c.dexK()));
                se("Monster1", 40, 130, panOf(c.centerX()));
                return;
            }
            // in to bite: right after the web stuck, or when it has the hero close anyway
            if ((webbed() || dist < keep[0] || c._cd.web > m.web.cd * 0.4) && c.mayAttack()) { if (melee(c, "bite")) return; return; }
            if (dist > keep[1]) { if (c._mode !== "chase") c.setMode("chase"); c.walkTo($gamePlayer.x, $gamePlayer.y, "in", 3); return; }
            if (dist < keep[0] - 0.4) { c.setMode("keep"); c.stepAway(); return; }
            c.faceHero();
            if (Math.random() < 0.02) { const dirs = [1, 3, 7, 9].filter(d => RoamingActor.canStep(c, c._x, c._y, d)); if (dirs.length) c.stepTo(pick(dirs)); }
        },
        afterMove(c, m) {   // a spring back after the bite
            if (!m || !m.hop) return;
            const ax = Math.sign(c._x - $gamePlayer.x), ay = Math.sign(c._y - $gamePlayer.y);
            for (const n of [m.hop, 1]) {
                const bx = ax * n, by = ay * n;
                if ((bx || by) && standable(c._x + bx, c._y + by) && standable(c._x + Math.sign(bx), c._y + Math.sign(by))) { c.jump(bx, by); se("Jump1", 50, 140, panOf(c.centerX())); break; }
            }
        }
    };

    // ---- EMPTY ARMOUR: a statue until it notices him; slow, heavy blows; lies in pieces once and rises (collapse / rise in think)
    AI.zbroja = {
        init(c, opts) { if (!opts.mode) c.setMode("dormant"); c._idleF8 = 2; },
        think(c) {
            if (c._mode === "collapsed") { if (c._modeT <= 0) rise(c); return; }
            if (c._mode === "rise") { if (c._modeT <= 0) { c.setMode("chase"); c._gapT = 30; } return; }
            const m = c._def.moves, dist = c.playerDistance();
            const name = Math.random() < (m.over.chance || 0.3) ? "over" : "cut";
            melee(c, dist <= m.over.at && c.mayAttack() ? name : "cut");
        }
    };

    // ---- BATS: high over the hero, circling; in waves one dives along a line (shown on the floor), hangs low a moment, climbs back
    AI.nietoperz = {
        init(c) { c._alt = c._def.flying.high; c._fx = c._realX; c._fy = c._realY; c._orbit = Math.random() * Math.PI * 2; c.setThrough(true); },
        calm(c) {   // hanging under the vault, a twitch now and then
            c._alt = c._def.flying.high + Math.sin(c._poseT / 20 + c._cid) * 3;
            return false;
        },
        engage(c) { c.setMode("hover"); c._gapT = rnd(40, 120); },
        think(c) {
            const F = c._def.flying, m = c._def.moves.dive;
            if (c._mode === "dive") return batDive(c, m);
            if (c._mode === "low") {
                c._alt = Math.max(F.low, c._alt - 1);
                if (c._modeT <= 0) c.setMode("hover");
                return;
            }
            // hovering: round the hero, high
            c._alt += (F.high + Math.sin(c._poseT / 14 + c._cid) * 4 - c._alt) * 0.08;
            c._orbit += 0.025 * (c._cid % 2 ? 1 : -1);
            const r = 2.2 + (c._cid % 3) * 0.4, tx = heroX() + Math.cos(c._orbit) * r - 0.5, ty = heroY() + Math.sin(c._orbit) * r * 0.7 - 0.5;
            const dx = tx - c._realX, dy = ty - c._realY, d = Math.hypot(dx, dy), v = Math.min(d, 0.075);
            if (d > 0.01 && !c.glide(dx / d * v, dy / d * v, true)) c._orbit += 0.3;
            c.setDirection(DIR4(dx, dy));
            if (c.mayAttack() && c.playerDistance() < 5 && c._swarm && (c._swarm.gapT || 0) <= 0) {
                c._swarm.gapT = rnd(m.gap[0], m.gap[1]);
                startDive(c, m);
            }
        }
    };
    function startDive(c, m) {
        const sx = c.centerX(), sy = c.centerY(), dx = heroX() - sx, dy = heroY() - sy, d = Math.hypot(dx, dy) || 1;
        c._lock = [dx / d, dy / d];
        c._lockAng = Math.atan2(dy, dx);
        c._diveTo = { x: heroX() + dx / d * m.past, y: heroY() + dy / d * m.past, len: d + m.past, gone: 0, hit: false };
        c._move = "dive";
        c.setMode("dive", Math.round(m.windup * c.dexK()));
        c._diveWind = c._modeT;
        se("Monster1", 35, 190, panOf(sx));
        lines.push({ c, t: 0 });
    }
    function batDive(c, m) {
        const D2 = c._diveTo;
        if (c._modeT > 0) {   // the screech: it drops a little and shakes
            c._alt = Math.max(c._def.flying.high - 10, c._alt - 0.4);
            return;
        }
        // the swoop along the locked line
        const step = m.speed;
        const ok = c.glide(c._lock[0] * step, c._lock[1] * step, true);
        D2.gone += step;
        c._alt = Math.max(4, c._alt - 2.4);
        if (!D2.hit && Math.hypot(c.centerX() - heroX(), c.centerY() - heroY()) < 0.6 && c._alt < 16) {
            D2.hit = true;
            const Cb = C();
            if (Cb && Cb.hitPlayer) {
                const res = Cb.hitPlayer({ damage: Math.max(1, Math.round(m.dmg * c.strK())), poise: m.poise, from: { x: c.centerX() - c._lock[0], y: c.centerY() - c._lock[1] },
                    attacker: c, name: "nietoperz", wound: m.wound, knock: m.knock, unparryable: true });
                if (res === "hit") se("Damage1", 60, 150);
            }
        }
        if (!ok || D2.gone >= D2.len) { c._lockAng = null; c.setMode("low", m.low); }
    }

    // ---- THE DROWNED: shuffles in, grabs and drags to its water, or slams
    AI.topielec = {
        think(c) {
            const m = c._def.moves, dist = c.playerDistance();
            if (c._mode === "drag") return;   // (grab's update drives it)
            if (c._mode === "sinkAway") return;
            melee(c, dist <= m.slam.at && Math.random() < m.slam.chance ? "slam" : "grab");
        },
        landed(c, m, res) {
            if (c._move === "grab" && res === "hit") startGrab(c, m);
        }
    };

    // ---- STONE SENTINEL: a statue until it notices him; turns very slowly; the slam (a ring) and the charge (a straight line)
    AI.kamiennik = {
        init(c, opts) { if (!opts.mode) c.setMode("dormant"); c._idleF8 = 2; },
        think(c) {
            const m = c._def.moves, dist = c.playerDistance();
            if (c._mode === "charge") return stoneCharge(c, m.charge);
            if (!c._boss && !c._cd.charge && dist >= m.charge.from && dist <= m.charge.to && c.mayAttack() && c.clearRun() && Math.random() < 0.04) { startCharge(c, m.charge); return; }
            if (c.mayAttack() && dist <= m.slam.at) { c.startMove("slam"); return; }
            if (c.isMoving()) return;
            if (c._mode !== "chase") c.setMode("chase");
            if (dist > 1.6 && !c.walkTo($gamePlayer.x, $gamePlayer.y, "in", 1)) c.faceHero();
        },
        stunned(c) { if (c._mode === "charge") { c._running = false; c.setMode("chase"); } }
    };
    function startCharge(c, m) {
        const dx = heroX() - c.centerX(), dy = heroY() - c.centerY(), d = Math.hypot(dx, dy) || 1;
        c._lock = [dx / d, dy / d];
        c._lockAng = Math.atan2(dy, dx);
        c._faceAng = c._lockAng;
        c._chargeDir = octOf(dx, dy);
        c._chargeGone = 0;
        c._chargeDef = m;
        c._chargeHit = false;
        c._running = false;
        c._move = "charge";
        c.setMode("charge", Math.round(m.windup * c.dexK()));
        se("Earth2", 70, 70, panOf(c.centerX()));
        c._cd.charge = m.cd;
        lines.push({ c, t: 0, charge: true });
    }
    function stoneCharge(c, m) {
        if (c._modeT > 0) { if (c._modeT % 10 === 0) sparksAt(c.centerX(), c.centerY() + 0.4, "#9c8260", 4); return; }   // (stamping)
        c._running = true;
        // the hero in its way: hit once, hard
        if (!c._chargeHit && c.playerDistance() < 0.6 + c._radius) {
            c._chargeHit = true;
            const Cb = C();
            if (Cb && Cb.hitPlayer) Cb.hitPlayer({ damage: Math.round(m.dmg * c.strK()), poise: m.poise, from: { x: c.centerX(), y: c.centerY() }, attacker: c,
                name: c.name().toLowerCase(), knock: m.knock, unparryable: true, guardBreak: true });
        }
        if (c.isMoving()) return;
        const [ox, oy] = STEP[c._chargeDir];
        if (c._chargeGone >= m.far) { c._running = false; c._lockAng = null; c.setMode("recover", m.recover); c._settle = 0; return; }
        if (RoamingActor.canStep(c, c._x, c._y, c._chargeDir) && !creatures.some(o => o !== c && !o._dead && !o._def.flying && o._x === c._x + ox && o._y === c._y + oy)) {
            HP().takeStep(c, c._chargeDir);
            c._chargeGone++;
            if (c._chargeGone % 2 === 0) { se("Earth1", 45, 80, panOf(c.centerX())); $gameScreen.startShake(1, 6, 6); }
        } else {   // into the wall: it stands stunned, open from every side
            c._running = false;
            c._lockAng = null;
            c._stoneStunned = true;
            c._stun = 0;
            c.setMode("crashed", m.stun);
            numberAt(c.centerX(), c.centerY() - 1.7 * c._scale, c._base === "szczur" ? MIND.dazed : MIND.stuck, "#ffd27f", 0.9);
            sparksAt(c.centerX() + ox * 0.5, c.centerY() + oy * 0.5 - 0.6, "#c9c2b0", 16);
            se("Earth3", 90, 70, panOf(c.centerX()));
            $gameScreen.startShake(6, 9, 18);
        }
    }

    // ---- WRAITH OF TRUTH: hidden (a cold breath, a whisper), it comes near unseen and shows itself; then a "truth" or its touch
    AI.upior = {
        init(c, opts) { c._hidden = !opts.shown; c._opacity = c._hidden ? 0 : 255; c._alt = c._def.hover || 0; c.setThrough(true); if (!opts.mode) c.setMode("idle"); },
        calm(c) {
            c._alt = (c._def.hover || 0) + Math.sin(c._poseT / 24) * 2;
            if (c._hidden && c._poseT % 40 === 0 && c.playerDistance() < 8) wisps.push({ x: c.centerX() + (Math.random() - 0.5) * 0.5, y: c.centerY() - 0.6, vy: -0.012, t: 0, life: 50, color: "#cfd8e0" });
            return false;
        },
        engage(c) { c.setMode("drift", rnd(60, 140)); },
        think(c) {
            const Hd = c._def.hidden, m = c._def.moves, dist = c.playerDistance();
            c._alt = (c._def.hover || 0) + Math.sin(c._poseT / 24) * 2;
            if (c._mode === "drift") {   // unseen: round to a place near the hero
                if (c._poseT % 30 === 0 && dist < 9) wisps.push({ x: c.centerX() + (Math.random() - 0.5) * 0.5, y: c.centerY() - 0.6, vy: -0.012, t: 0, life: 50, color: "#cfd8e0" });
                if (c._poseT % 200 === 0 && dist < 8) se("Wind2", 25, 150, panOf(c.centerX()));
                const want = Hd.near[0] + (c._cid % 3) * 0.6;
                if (!c.isMoving()) {
                    if (dist > want + 0.6) c.walkTo($gamePlayer.x, $gamePlayer.y, "near", Math.round(want));
                    else if (dist < Hd.near[0] - 0.8) c.stepAway();
                }
                if (c._modeT <= 0 && dist <= Hd.near[1] + 1) wraithShow(c);
                return;
            }
            if (c._mode === "show") {   // showing itself: fading in
                c._opacity = Math.min(255, (c._opacity || 0) + Math.ceil(255 / Hd.fade));
                if (c._opacity >= 255) { c._hidden = false; c._gapT = 0; c.setMode("shown", Hd.show); }
                return;
            }
            if (c._mode === "truth") return wraithTruth(c, m.truth);
            if (c._mode === "under") { if (c._modeT <= 0) shadowIn(c); return; }
            if (c._mode === "fadeOut") {
                c._opacity = Math.max(0, (c._opacity || 0) - Math.ceil(255 / Hd.fade));
                if (c._opacity <= 0) { c._hidden = true; c.setMode("drift", rnd(Hd.hide[0], Hd.hide[1])); }
                return;
            }
            // shown: its touch when the hero is right there, else a truth; it does not stay long
            if (c._modeT <= 0) { c.setMode("fadeOut"); return; }
            if (dist <= m.touch.at && c.mayAttack() && Math.random() < 0.5) { c.startMove("touch"); return; }
            if (!c._cd.truth && c.mayAttack() && dist <= m.truth.reach) { startTruth(c, m.truth); return; }
            c.faceHero();
        },
        afterMove(c) { c._modeT = 0; c.setMode("recover", 30); c._afterFade = true; },
        afterStun(c) { if (!c._engaged) c.engage(); else { c.setMode("fadeOut"); } },
        hurt(c) {   // hit during its truth: twice and it breaks off
            if (c._mode === "truth" && ++c._breaks >= c._def.moves.truth.breaks) {
                numberAt(c.centerX(), c.centerY() - 1.6 * c._scale, "Przerwana!", "#9ff0a8", 0.85);
                c._stun = Math.max(c._stun, 50);
                c._lockAng = null;
                c.setMode("chase");
            }
        }
    };
    function wraithShow(c) {
        if (c._boss && BOSS_AI[c._kind] && BOSS_AI[c._kind].show && BOSS_AI[c._kind].show(c)) return;
        c.setMode("show", c._def.hidden.fade);
        se("Darkness1", 45, 130, panOf(c.centerX()));
    }
    function startTruth(c, m) {
        c._move = "truth";
        c._breaks = 0;
        c._faceAng = Math.atan2(heroY() - c.centerY(), heroX() - c.centerX());
        c._lockAng = c._faceAng;
        c.setMode("truth", Math.round(m.windup * c.dexK()));
        c._truthText = pick(D.TRUTHS);
        say(c, c._truthText, m.windup + 90);
        se("Darkness2", 60, 120, panOf(c.centerX()));
        rings.push({ x: c.centerX(), y: c.centerY(), r: 0.7, t: 0, life: m.windup, kind: "truth", c });
        c._cd.truth = 200;
    }
    function wraithTruth(c, m) {
        if (c._modeT > 0) { if (c._modeT % 15 === 0) se("Wind2", 30, 80 + rnd(0, 30), panOf(c.centerX())); return; }
        c._lockAng = null;
        const near = c.playerDistance() <= m.reach;
        if (near) {
            S().truths++;
            const hit = mindHit(c, Math.random() < 0.5 ? "fear" : "confuse", (m.power || 0) + (c._boss ? 0.08 : 0), null, m);
            if (!hit) {   // the truth turned on it
                S().resisted++;
                c._stun = Math.max(c._stun, m.back + perk("mind.back"));
                c._poise = 0;
                c.setMode("chase");
                return;
            }
        }
        c.setMode("recover", m.recover);
        c._afterFade = true;
    }

    // ---- SHADOW: stands as someone from the town, says their line; up close the face drops, fear, claws; hit twice it melts and comes
    // out behind the hero
    AI.cien = {
        init(c, opts) {
            if (c._boss && c._boss.face) c._face = D.FACES.find(f => f.name === c._boss.face) || D.FACES[0];
            if (!c._face) c._face = opts.face || pick(D.FACES);
            c._revealed = false;
            c._lureTone = c._tone;
            c._tone = null;
            c.setImage(faceName(c._face), 0);
            if (!opts.mode) c.setMode("lure");
            c._idleF8 = 2;
        },
        engage(c) { if (!c._revealed) shadowReveal(c); else c.setMode("chase"); },
        calm(c) {
            if (c._mode !== "lure") return false;
            const dist = c.playerDistance();
            if (dist < 7) c._faceAng = Math.atan2(heroY() - c.centerY(), heroX() - c.centerX());
            if (!c._spoke && dist < c._def.reveal + 2.2) { c._spoke = true; say(c, pick(c._face.lines), 200); }
            if (dist < c._def.reveal || c._alarm > 0) shadowReveal(c);
            return true;
        },
        think(c) {
            const dist = c.playerDistance(), Ml = c._def.melt;
            if (c._mode === "reveal") {
                const k = 1 - c._modeT / c._modeLen, to = c._lureTone || [-200, -200, -170, 255];
                c._tone = [to[0] * k, to[1] * k, to[2] * k, to[3] * k];
                if (c._modeT <= 0) {
                    c._tone = c._lureTone || [-200, -200, -170, 255];
                    if (c._boss && BOSS_AI[c._kind] && BOSS_AI[c._kind].reveal) BOSS_AI[c._kind].reveal(c);
                    else if (!c._boss) {   // (the face it wore goes dark and falls away: the shadow itself - smoke, claws, the red eyes)
                        c._face = null;
                        c._look = "Shadow";
                        c._tone = null;
                        c.setImage(sheetName("Shadow"), 0);
                        for (let i = 0; i < 10; i++) wisps.push({ x: c.centerX() + (Math.random() - 0.5) * 0.8, y: c.centerY() - Math.random() * 1.1, vy: -0.022, t: 0, life: 36, color: "#141018" });
                    }
                    mindHit(c, "fear", c._def.moves.fright.power + (c._boss ? 0.1 : 0), c._def.moves.fright.fear);
                    c.setMode("chase");
                    c._gapT = 20;
                }
                return;
            }
            if (c._mode === "melt") {
                c._opacity = Math.max(0, Math.round(255 * c._modeT / c._modeLen));
                if (c._modeT <= 0) shadowOut(c);
                return;
            }
            if (c._mode === "under") {   // gone into the dark: the puff behind the hero shows where it comes out
                if (c._modeT <= 0) shadowIn(c);
                return;
            }
            if (c._hitsTaken >= (c._meltAt || Ml.hits) && !c._boss && c.mayAttack()) { c._meltAt = c._hitsTaken + Ml.hits; c.setMode("melt", 20); numberAt(c.centerX(), c.centerY() - 1.3, MIND.melt, "#b8b0c8", 0.75); se("Darkness1", 50, 150, panOf(c.centerX())); return; }
            melee(c, "claw");
        }
    };
    function shadowReveal(c) {
        if (c._revealed && c._mode !== "lure") return;
        c._revealed = true;
        c._engaged = true;
        c._aware = 1;
        c.setMode("reveal", 34);
        if (c._boss && !c._bossStarted) bossStart(c);
        say(c, "...", 60);
        se("Darkness3", 55, 110, panOf(c.centerX()));
    }
    function shadowOut(c) {
        const Ml = c._def.melt || KINDS.cien.melt, Hn = H(), [fx, fy] = Hn && Hn.facingVector ? Hn.facingVector() : [0, 1];   // (the asking wraith comes out the same way)
        const tx = Math.round(heroX() - 0.5 - fx * Ml.behind), ty = Math.round(heroY() - 0.5 - fy * Ml.behind);
        const spot = standable(tx, ty) ? { x: tx, y: ty } : openNear(Math.round(heroX() - 0.5), Math.round(heroY() - 0.5), 1, 2.5)[0];
        c._hidden = true;
        c._opacity = 0;
        c._outAt = spot || { x: c._x, y: c._y };
        puffs.push({ x: c._outAt.x + 0.5, y: c._outAt.y + 0.5, t: 0, life: Ml.warn + 20 });
        c.setMode("under", Ml.warn);
    }
    function shadowIn(c) {
        c.locate(c._outAt.x, c._outAt.y);
        c._hidden = false;
        c._opacity = 255;
        se("Darkness1", 55, 120, panOf(c.centerX()));
        c.setMode("chase");
        c._gapT = 0;
        const name = c._def.moves.claw ? "claw" : "touch";
        if (c._base === "upior") c.setMode("shown", c._def.hidden.show);
        if (c.mayAttack() && c.playerDistance() <= c._def.moves[name].at + 0.8) c.startMove(name, { windup: 16 });
    }

    // ==================================================================
    // What hits the mind (Hart ducha): a wraith's truth, a shadow's fright. Resisted - said over the hero; not - fear (he stands frozen:
    // Combat's stun) or confusion (the arrows turned round: Input below). Combat.mindResist / mindTime: the attribute and the skills
    // ==================================================================
    const mind = { confuseT: 0, confuseLen: 1, fearT: 0 };
    function mindHit(src, kind, power, frames, m) {
        const Cb = C();
        const resist = Cb && Cb.mindResist ? Cb.mindResist(power || 0, src._level) : 0.15;
        if (Math.random() < resist) {
            numberAt(heroX(), heroY() - 1.45, MIND.resist, "#c9e6ff", 0.9);
            numberAt(heroX(), heroY() - 1.9, MIND.resistSub, "#9fb8d8", 0.7);
            se("Saint1", 50, 130);
            T.emit("heroMind", { kind, by: src._kind, resisted: true });
            return false;
        }
        const base = frames || (m ? (kind === "fear" ? m.fear : m.confuse) : 60) || 60;
        const t = Cb && Cb.mindTime ? Cb.mindTime(base) : base;
        if (kind === "fear") {
            mind.fearT = t;
            if (Cb && Cb.stunPlayer) Cb.stunPlayer(t, "fear");
            numberAt(heroX(), heroY() - 1.45, MIND.fear, "#b0b8ff", 0.95);
            T.call("Combat", "drainBreath", 30);
        } else {
            mind.confuseT = t;
            mind.confuseLen = t;
            numberAt(heroX(), heroY() - 1.45, MIND.confuse, "#d8a8ff", 0.95);
        }
        se("Darkness4", 60, 100);
        $gameScreen.startFlash([120, 110, 170, 90], 18);
        T.emit("heroMind", { kind, by: src._kind, resisted: false, frames: t });
        return true;
    }
    const confused = () => mind.confuseT > 0;

    // ==================================================================
    // The drowned's grip: held (no moves, no blows), dragged to its water, the breath going; O / Space / P again and again tear him free
    // ==================================================================
    let grab = null;   // { c, t, need, presses, m }
    function startGrab(c, m) {
        if (grab) return;
        const Cb = C(), str = Cb && Cb.attr ? Cb.attr("str") : 5;
        grab = { c, t: 0, need: Math.max(3, m.presses - Math.floor((str - 5) / 6)), presses: 0, m, chokeT: 0 };
        c._grabbing = true;
        c.setMode("drag");
        numberAt(heroX(), heroY() - 1.45, MIND.grabbed, "#9fd8c8", 0.95);
        se("Water1", 70, 70, panOf(c.centerX()));
    }
    function releaseGrab(free) {
        const g = grab;
        if (!g) return;
        grab = null;
        const c = g.c, Cb = C();
        c._grabbing = false;
        if (!c._dead && !c._dying && !c._def.flying) c.settle();   // (the drag left it between tiles)
        if (Cb && Cb.act) Cb.act.stun = Math.min(Cb.act.stun, 2);
        if (c._dead || c._dying) return;
        if (free) {
            numberAt(heroX(), heroY() - 1.45, MIND.free, "#9ff0a8", 0.9);
            c._stun = Math.max(c._stun, 50);
            c._poise = 0;
            const dx = heroX() - c.centerX(), dy = heroY() - c.centerY(), d = Math.hypot(dx, dy) || 1;
            T.call("Combat", "shovePlayer", dx / d * 0.7, dy / d * 0.7);
            se("Blow1", 70, 110);
        } else c.setMode("recover", 30);
    }
    function updateGrab() {
        const g = grab;
        if (!g) return;
        const c = g.c, Cb = C();
        if (c._dead || c._dying || c._stun > 0 || !Cb) { releaseGrab(false); return; }
        g.t++;
        if (Cb.act) { Cb.act.stun = Math.max(Cb.act.stun, 3); Cb.act.stunKind = "held"; }
        // the presses (any of the action keys) shake him free
        if (["keyO", "keyP", "dodge", "keyEnter"].some(k => Input.isTriggered(k))) {
            g.presses++;
            sparksAt(heroX(), heroY() - 0.4, "#cfe8ff", 3);
            se("Blow1", 40, 140 + g.presses * 6);
            if (g.presses >= g.need) { releaseGrab(true); return; }
        }
        // dragged: it walks back towards its water (home, or the boss's pool), he is held an arm's length in front of it
        const to = c._pool || c._home, dx = to.x - c._realX, dy = to.y - c._realY, dd = Math.hypot(dx, dy);
        if (dd > 0.3) c.glide(dx / dd * g.m.drag, dy / dd * g.m.drag, false);
        const hx = c.centerX() + Math.cos(c._faceAng) * 0.85, hy = c.centerY() + Math.sin(c._faceAng) * 0.85;
        const sx = hx - heroX(), sy = hy - heroY();
        if (Math.hypot(sx, sy) > 0.05) T.call("Combat", "shovePlayer", sx * 0.25, sy * 0.25);
        // the breath goes; out of breath, he chokes
        T.call("Combat", "drainBreath", g.m.breath);
        const Bn = Cb.breath;
        if (Bn !== undefined && Bn < 1 && ++g.chokeT >= g.m.choke) {
            g.chokeT = 0;
            const a = $gameParty.leader();
            if (a && a.hp > 0) { a.gainHp(-Math.max(1, Math.round(g.m.chokeDmg * c.strK()))); numberAt(heroX(), heroY() - 1.2, MIND.choke, "#9fd8c8", 0.8); se("Water2", 60, 70); }
        }
        if (c._boss && BOSS_AI[c._kind] && BOSS_AI[c._kind].dragging) BOSS_AI[c._kind].dragging(c, g);
        if (g.t >= g.m.hold) { const a = $gameParty.leader(); if (a) a.gainHp(-Math.round(g.m.dmg * c.strK())); releaseGrab(false); T.call("Combat", "shovePlayer", -Math.cos(c._faceAng) * -0.6, -Math.sin(c._faceAng) * -0.6); }
    }

    // ==================================================================
    // The spider's web: a lump in flight (a roll lets it through, a shield stops it); stuck - he walks slowly; it lies on the floor a while
    // ==================================================================
    let webs = [], patches = [], rings = [], lines = [], wisps = [], puffs = [];
    let webT = 0;
    const webbed = () => webT > 0 || patches.some(p => Math.hypot(p.x - heroX(), p.y - heroY()) < 0.55);
    function spitWeb(c, ang) {
        const m = c._def.moves.web, sx = c.centerX(), sy = c.centerY() - 0.25;
        const a = ang !== undefined ? ang : Math.atan2(heroY() - sy, heroX() - sx);
        webs.push({ x: sx, y: sy, vx: Math.cos(a), vy: Math.sin(a), from: c, speed: m.speed, gone: 0, range: m.range, done: false, m });
        se("Water1", 50, 160, panOf(sx));
    }
    function updateWebs() {
        const Cb = C();
        for (const w of webs) {
            if (w.done) continue;
            for (let i = 0; i < 2 && !w.done; i++) {
                w.x += w.vx * w.speed / 2;
                w.y += w.vy * w.speed / 2;
                w.gone += w.speed / 2;
                if (!w.passed && Math.hypot(w.x - heroX(), w.y - (heroY() - 0.2)) < 0.5 && Cb && Cb.hitPlayer) {
                    const res = Cb.hitPlayer({ damage: Math.max(1, Math.round(w.m.dmg * w.from.strK())), poise: w.m.poise, from: { x: w.x - w.vx, y: w.y - w.vy }, attacker: w.from,
                        name: "sieć", knock: 0.1, unparryable: true, unblockable: !(Cb.shield && Cb.shield()), projectile: true });
                    if (res === "dodged") { w.passed = true; continue; }
                    w.done = true;
                    if (res === "hit") {
                        webT = Math.max(webT, w.m.slow);
                        numberAt(heroX(), heroY() - 1.45, MIND.webbed, "#e8e8e8", 0.9);
                        patches.push({ x: heroX(), y: heroY(), t: 0, life: w.m.patch });
                    }
                    break;
                }
                if (w.gone >= w.range || !flyable(w.x, w.y)) { w.done = true; patches.push({ x: w.x, y: w.y, t: 0, life: w.m.patch }); }
            }
        }
        webs = webs.filter(w => !w.done);
        for (const p of patches) p.t++;
        patches = patches.filter(p => p.t < p.life);
        if (webT > 0) webT--;
    }

    // ==================================================================
    // Remains and what they had (the action button by them: the hero crouches and takes it); saved per map, gone after a day
    // ==================================================================
    let dropSeq = 0;
    const DROP_LIFE = 24;
    function rollLoot(def) {
        const out = [];
        for (const [id, p, n] of def.loot || []) if (Math.random() < p) out.push([id, rnd(1, n || 1)]);
        return out;
    }
    function leaveRemains(c) {
        if (c._noLoot) return;
        const k = c._def, b = c._boss;
        let gold = 0, items = [];
        if (b) { gold = rnd(b.gold[0], b.gold[1]); items = b.loot.map(([id, p, n]) => [id, n]); }
        else {
            items = rollLoot(k);
            if (k.gold && k.gold[2] && Math.random() < k.gold[2]) gold = rnd(k.gold[0], k.gold[1]) + Math.floor(c._level / 3);
        }
        const list = dropsOf();
        list.push({ id: Date.now() + "-" + (dropSeq++), kind: k.remains, look: c._look, x: c.centerX(), y: c.centerY(), right: c.centerX() >= heroX(),
            gold, items, until: clockNow() + DROP_LIFE, scale: c._drawScale || c._scale, tone: c._tone, boss: !!b, face: c._face ? c._face.sheet : null, empty: !gold && !items.length });
        while (list.length > 30) list.shift();
    }
    function dropAhead() {
        const px = heroX(), py = heroY(), d = $gamePlayer.direction();
        const fx = d === 4 ? -1 : d === 6 ? 1 : 0, fy = d === 8 ? -1 : d === 2 ? 1 : 0;
        let best = null, bestD = 99;
        for (const c of dropsOf()) {
            if (!(c.gold > 0) && !(c.items || []).length) continue;
            const dx = c.x - px, dy = c.y - py, dist = Math.hypot(dx, dy);
            if (dist > 1.45 || (dist > 0.6 && (dx * fx + dy * fy) / dist < 0.3)) continue;
            if (dist < bestD) { bestD = dist; best = c; }
        }
        return best;
    }
    function searchDrop(c) {
        if ($gamePlayer.isToolSwinging && $gamePlayer.isToolSwinging()) return true;
        const dx = c.x - heroX(), dy = c.y - heroY();
        if (Math.hypot(dx, dy) > 0.3) $gamePlayer.setDirection(DIR4(dx, dy));
        const take = () => {
            if (!dropsOf().includes(c)) return;
            if (c.gold > 0) { $gameParty.gainGold(c.gold); T.popup("Stare monety: " + c.gold + " G", { icon: 313, gain: true }); }
            for (const [id, n] of c.items || []) if ($dataItems[id]) { $gameParty.gainItem($dataItems[id], n); T.popup($dataItems[id].name + (n > 1 ? " ×" + n : ""), { icon: $dataItems[id].iconIndex, gain: true }); }
            c.gold = 0;
            c.items = [];
            c.empty = true;
            se("Equip1", 50, 100);
        };
        const CT = T.api("ChoppableTree"), crouch = CT && CT.swingKindOf ? CT.swingKindOf("Swing_Crouch") : -1;
        if (crouch < 0 || !$gamePlayer.startToolSwing(crouch, take, null)) take();
        return true;
    }
    function rotDrops() {
        const now = clockNow();
        const list = dropsOf();
        for (let i = list.length - 1; i >= 0; i--) if (list[i].until <= now) list.splice(i, 1);
    }

    // ==================================================================
    // Bosses: the big bar, one mechanic each (BOSS_AI: start, tick, and what they want to say about a blow - guard, hurt, fall)
    // ==================================================================
    let bossNow = null;
    function bossStart(c) {
        c._bossStarted = true;
        bossNow = c;
        T.popup(c.name(), { top: true, color: "#ffb07f", sub: "Podziemia - piętro " + (c._boss.floor || "?") });
        se("Darkness3", 80, 70);
        if (BOSS_AI[c._kind] && BOSS_AI[c._kind].start) BOSS_AI[c._kind].start(c);
        T.emit("creatureBoss", { kind: c._kind, floor: c._boss.floor, how: "start" });
    }
    function bossBeaten(c) {
        const s = S();
        if (c._marker) s.bosses[c._marker.key] = true;   // (its place on its floor: it does not come back - an F9 one leaves nothing behind)
        s.beatenBosses++;
        if (c._guardianEvent) guardianBeaten(c);
        for (const o of creatures.slice()) if (o._ownerBoss === c && !o._dead && !o._dying) die(o, "boss");
        // a hand-made floor's boss: the underground lets the hero down its stairs (and says so); F9's elsewhere: said here
        const ug = UG(), f = c._boss.floor;
        const floorHere = ug && ug.floorOf ? ug.floorOf($gameMap.mapId()) : 0;
        if (c._kind !== "guardian" && ug && ug.bossDefeated && floorHere === f) ug.bossDefeated(f);
        else T.popup(c.name() + " pokonany", { top: true, color: "#ffe9a8", sub: "Podziemia - piętro " + (f || "?") });
        T.emit("creatureBoss", { kind: c._kind, floor: f, how: "beaten" });
        if (bossNow === c) bossNow = null;
        rings = rings.filter(r => r.c !== c);
    }
    const bossBeatenAt = floor => { const ug = UG(), m = ug && ug.mapOf ? ug.mapOf(Number(floor)) : 0; return !!(ug && ug.bosses && ug.bosses()[floor]) || Object.keys(S().bosses).some(k => k.split(":")[0] === String(m)); };
    // open tiles lo..hi from (cx, cy)
    function openNear(cx, cy, lo, hi) {
        const out = [];
        for (let y = Math.floor(cy - hi); y <= Math.ceil(cy + hi); y++) for (let x = Math.floor(cx - hi); x <= Math.ceil(cx + hi); x++) {
            const d = Math.hypot(x - cx, y - cy);
            if (d < lo || d > hi || !standable(x, y) || creatures.some(o => !o._dead && o._x === x && o._y === y) || ($gamePlayer.x === x && $gamePlayer.y === y)) continue;
            out.push({ x, y, d });
        }
        return out.sort(() => Math.random() - 0.5);
    }
    // a boss's helpers (the rats of the queen, the shadows of the last guard): they fight at once and belong to it (no experience of their own)
    function minion(boss, kind, x, y, opts) {
        const c = spawnOne(kind, x, y, Object.assign({ level: Math.max(1, boss._level - 3), tag: "boss" }, opts || {}));
        if (!c) return null;
        c._ownerBoss = boss;
        c._noLoot = true;
        c._aware = 1;
        c.engage();
        return c;
    }
    // the hero pulled up by the spider's thread (Game_Player.screenY below)
    let heroLift = 0;

    const BOSS_AI = {};
    // the guardian of the tenth gate: the armour's mind, bigger; rises once - beaten, the gate opens (guardianBeaten)
    BOSS_AI.guardian = {};

    // ---- the prior in armour: the ring of the rite round him; a step of the hero inside it is a question, the third gets its answer
    BOSS_AI.boss_20 = {
        setup(c) {
            const R = c._boss.ring;
            c._circle = { x: c._home.x + 0.5, y: c._home.y + 0.5, r: R.r };
            c._questions = 0;
            c._heroTile = null;
            rings.push({ x: c._circle.x, y: c._circle.y, r: R.r, t: 0, life: 1e9, kind: "rite", c });
        },
        inRing(c) { return !!c._circle && Math.hypot(heroX() - c._circle.x, heroY() - c._circle.y) <= c._circle.r; },
        tick(c) {
            const R = c._boss.ring, Cb = C();
            if (!c._circle) return;
            // he does not leave his ring
            if (Math.hypot(c.centerX() - c._circle.x, c.centerY() - c._circle.y) > R.keep && !c.isMoving() && (c._mode === "chase" || c._mode === "circle")) c.walkTo(c._home.x, c._home.y, "rite", 0);
            // the hero's steps in the ring: questions
            const tile = $gamePlayer.x + "," + $gamePlayer.y, rolling = Cb && Cb.act && Cb.act.mode === "roll";
            if (this.inRing(c)) {
                if (c._heroTile && tile !== c._heroTile && !rolling && c._mode !== "answer") {
                    c._questions++;
                    numberAt(heroX(), heroY() - 1.5, ["I", "II", "III", "IV"][Math.min(3, c._questions - 1)], "#e0d0ff", 0.9);
                    se("Bell1", 35, 140 + c._questions * 20);
                }
                if (c._questions >= R.steps && c._mode !== "answer" && c._stun <= 0 && !c._dying) {
                    c._questions = 0;
                    c._answerAt = { x: heroX(), y: heroY() };
                    c._lockAng = Math.atan2(heroY() - c.centerY(), heroX() - c.centerX());
                    c._faceAng = c._lockAng;
                    c._move = "over";
                    c.setMode("answer", R.staff.windup);
                    numberAt(c.centerX(), c.centerY() - 2.2, MIND.answer, "#e0d0ff", 1);
                    se("Darkness2", 70, 80, panOf(c.centerX()));
                    rings.push({ x: c._answerAt.x, y: c._answerAt.y, r: R.staff.radius, t: 0, life: R.staff.windup, kind: "warn", c });
                }
            } else c._questions = 0;
            c._heroTile = tile;
            if (c._mode === "answer" && c._modeT <= 0) {   // the staff comes down where he stood
                const A = c._answerAt, S2 = R.staff;
                c.ringFx(A.x, A.y, S2.radius);
                if (Math.hypot(heroX() - A.x, heroY() - A.y) <= S2.radius && Cb && Cb.hitPlayer) Cb.hitPlayer({ damage: Math.round(S2.dmg * c.strK() * c._boss.dmg), poise: S2.poise,
                    from: { x: c.centerX(), y: c.centerY() }, attacker: c, name: c.name().toLowerCase(), unblockable: true, unparryable: true, knock: 0.8, wound: 0.3 });
                c._lockAng = null;
                c.setMode("recover", S2.recover);
                c._settle = SETTLE;
            }
        },
        // blows from outside the ring do not reach him
        guard(c, damage, how) {
            if (this.inRing(c)) return false;
            numberAt(c.centerX(), c.centerY() - 2.0, MIND.ringSafe, "#e0d0ff", 0.8);
            sparksAt(c.centerX(), c.centerY() - 0.8, "#e0d0ff", 8);
            se("Saint1", 50, 120, panOf(c.centerX()));
            if (how !== "shot") T.call("Combat", "recoil", 10);
            return true;
        }
    };

    // ---- the rat queen: rams in a line (into a wall: dazed), bites; at two thirds and a third of her life the rats pour out of the walls
    BOSS_AI.boss_30 = {
        start(c) { c._calls = c._boss.calls.slice(); c._cd.ram = 200; },
        tick(c) {
            const B = c._boss, dist = c.playerDistance();
            if (!c._calls) this.start(c);
            if (c._mode === "ram") { stoneCharge(c, B.ram); return; }
            if (c._calls.length && c._hp <= c._maxHp * c._calls[0]) {
                c._calls.shift();
                se("Monster2", 85, 140, panOf(c.centerX()));
                numberAt(c.centerX(), c.centerY() - 2.4, "Piszczy!", "#ffb07f", 1);
                for (let k = 0; k < (B.groups || 2); k++) {
                    const s = openNear(c._x, c._y, 4, 7)[0];
                    if (!s) continue;
                    const lead = spawn("szczur", s.x, s.y, { count: B.swarm, level: Math.max(1, c._level - (B.minionLv || 3)), tag: "boss" });
                    for (const r of lead && lead._swarm ? lead._swarm.members : []) { r._ownerBoss = c; r._noLoot = true; r._aware = 1; r.engage(); }
                }
            }
            if (!c._cd.ram && dist >= B.ram.from && dist <= B.ram.to && (c._mode === "chase" || c._mode === "circle") && c.clearRun() && Math.random() < 0.2) {
                startCharge(c, B.ram);
                c._cd.ram = B.ram.cd;
                c.setMode("ram", Math.round(B.ram.windup * c.dexK()));
            }
        }
    };

    // ---- the mother of spiders: webs on the floor, three webs at once; up under the vault - down on the hero, or a thread pulls him up
    BOSS_AI.boss_40 = {
        setup(c) {
            for (const s of openNear(c._x, c._y, 2, 6).slice(0, c._boss.webs)) patches.push({ x: s.x + 0.5, y: s.y + 0.5, t: 0, life: 1e9, c });
            c._upT = rnd(c._boss.drop.every[0], c._boss.drop.every[1]) - 300;
        },
        spit(c) { const a = Math.atan2(heroY() - c.centerY(), heroX() - c.centerX()); for (const o of [-0.35, 0, 0.35]) spitWeb(c, a + o); },
        tick(c) {
            const B = c._boss, Dp = B.drop;
            if (c._mode === "climb") {   // up into the dark
                c._alt += 5;
                c._opacity = Math.max(0, (c._opacity === undefined ? 255 : c._opacity) - 12);
                if (c._modeT <= 0) {
                    c._hidden = true;
                    c._pulling = Math.random() < 0.5 && !grab;
                    c.setMode("above", Dp.follow + Dp.lock);
                    rings.push({ x: heroX(), y: heroY(), r: c._pulling ? 0.7 : Dp.radius, t: 0, life: Dp.follow + Dp.lock, kind: c._pulling ? "thread" : "shadow", c });
                }
                return;
            }
            if (c._mode === "above") {   // its shadow (or its thread) follows the hero, then stops
                const r = rings.find(o => o.c === c && (o.kind === "shadow" || o.kind === "thread"));
                if (r && c._modeT > Dp.lock) { r.x += (heroX() - r.x) * 0.08; r.y += (heroY() - r.y) * 0.08; }
                if (c._modeT > 0 || !r) return;
                r.t = r.life;
                const near = Math.hypot(heroX() - r.x, heroY() - r.y) <= r.r, Cb = C();
                if (c._pulling) {
                    if (near && !(Cb && Cb.act && Cb.act.iframes > 0)) { startPull(c); return; }
                    numberAt(r.x, r.y - 1, "Nić chybia", "#e8e8e8", 0.8);
                    this.land(c, r.x, r.y, false);
                    return;
                }
                if (near && Cb && Cb.hitPlayer) Cb.hitPlayer({ damage: Math.round(Dp.dmg * c.strK()), poise: 200, from: { x: r.x, y: r.y - 0.1 }, attacker: c, name: c.name().toLowerCase(),
                    unblockable: true, unparryable: true, knock: 0.6, down: 60 });
                this.land(c, r.x, r.y, true);
                return;
            }
            if (c._mode === "pull") return;   // (updatePull drives it)
            if (--c._upT <= 0 && (c._mode === "chase" || c._mode === "circle" || c._mode === "keep")) {
                c._upT = rnd(Dp.every[0], Dp.every[1]);
                c.setMode("climb", 26);
                se("Monster1", 60, 70, panOf(c.centerX()));
            }
        },
        // down on the floor again (where its shadow was): a thud, it lies stunned a moment
        land(c, x, y, thud) {
            const tx = Math.round(x - 0.5), ty = Math.round(y - 0.5), spot = standable(tx, ty) ? { x: tx, y: ty } : openNear(tx, ty, 0, 2)[0] || { x: c._x, y: c._y };
            c.locate(spot.x, spot.y);
            c._hidden = false;
            c._opacity = 255;
            c._alt = 0;
            if (thud) c.ringFx(x, y, c._boss.drop.radius);
            c._stun = thud ? 90 : 40;
            c._poise = 0;
            c.setMode("chase");
        }
    };
    // the thread: the hero lifted, held; O / Space / P again and again tear it (he falls a little); not torn in time - she bites him up there
    let pull = null;
    function startPull(c) {
        const P2 = c._boss.pull, Cb = C(), str = Cb && Cb.attr ? Cb.attr("str") : 5;
        pull = { c, t: 0, need: Math.max(3, P2.presses - Math.floor((str - 5) / 6)), presses: 0 };
        c.setMode("pull", P2.hold);
        numberAt(heroX(), heroY() - 1.5, MIND.pulled, "#e8e8e8", 0.95);
        se("Monster1", 70, 60);
    }
    function updatePull() {
        const p = pull;
        if (!p) return;
        const c = p.c, Cb = C(), P2 = c._boss.pull;
        if (c._dead || c._dying) { endPull(false); return; }
        p.t++;
        heroLift = Math.min(64, heroLift + 0.8);
        if (Cb && Cb.act) { Cb.act.stun = Math.max(Cb.act.stun, 3); Cb.act.stunKind = "held"; }
        if (["keyO", "keyP", "dodge", "keyEnter"].some(k => Input.isTriggered(k))) {
            p.presses++;
            sparksAt(heroX(), heroY() - 0.4 - heroLift / 48, "#e8e8e8", 3);
            se("Blow1", 40, 140 + p.presses * 6);
            if (p.presses >= p.need) { endPull(true); return; }
        }
        if (p.t >= P2.hold) {   // up at her: the bite
            const a = $gameParty.leader();
            if (a && a.hp > 0) a.gainHp(-Math.round(P2.bite * c.strK()));
            numberAt(heroX(), heroY() - 1.6, "Ukąszenie!", "#ff8f7f", 0.95);
            se("Damage3", 90, 80);
            $gameScreen.startFlash([255, 40, 30, 110], 12);
            if (typeof $gameSystem.injure === "function" && Math.random() < 0.6) $gameSystem.injure(0);
            endPull(false);
        }
    }
    function endPull(torn) {
        const p = pull;
        if (!p) return;
        pull = null;
        const c = p.c, Cb = C();
        if (Cb && Cb.act) Cb.act.stun = Math.min(Cb.act.stun, 2);
        if (torn) {
            numberAt(heroX(), heroY() - 1.4, "Nić pękła!", "#9ff0a8", 0.9);
            const a = $gameParty.leader();
            if (a && a.hp > 1) a.gainHp(-Math.min(a.hp - 1, c._boss ? c._boss.pull.fall : 5));
        }
        fallT = 1;
        if (!c._dead && !c._dying) BOSS_AI.boss_40.land(c, heroX() + 1.2, heroY() + 0.4, false);
    }
    let fallT = 0;
    function updateLift() {
        if (pull) return;
        if (heroLift > 0) { heroLift = Math.max(0, heroLift - 6); if (heroLift === 0 && fallT) { fallT = 0; $gameScreen.startShake(3, 8, 8); se("Blow3", 70, 80); } }
    }

    // ---- the drowned one of the deep: pools; it goes under when hurt by a part of its life and comes up by the hero's nearest pool
    BOSS_AI.boss_50 = {
        setup(c) {
            c._pools = openNear(c._x, c._y, 3, 6).slice(0, c._boss.pools).map(s => ({ x: s.x + 0.5, y: s.y + 0.5 }));
            c._pools.push({ x: c._home.x + 0.5, y: c._home.y + 0.5 });
            for (const p of c._pools) pools.push(Object.assign({ c, t: 0 }, p));
            c._pool = { x: c._home.x, y: c._home.y };
            c._diveMark = c._hp;
        },
        hurt(c) {
            if (c._mode === "sinkAway" || c._mode === "underwater" || c._hp <= 0) return;
            if (c._diveMark - c._hp >= c._maxHp * c._boss.dive) {   // hurt enough: under the water
                c._diveMark = c._hp;
                c._lockAng = null;
                if (grab && grab.c === c) releaseGrab(false);
                c.setMode("sinkAway", 30);
                se("Water2", 80, 70, panOf(c.centerX()));
            }
        },
        tick(c) {
            if (c._mode === "sinkAway") {
                c._sink = Math.min(1, (c._sink || 0) + 0.04);
                if (c._modeT <= 0) {
                    c._hidden = true;
                    const p = c._pools.slice().sort((a, b) => Math.hypot(a.x - heroX(), a.y - heroY()) - Math.hypot(b.x - heroX(), b.y - heroY()))[0];
                    c._outPool = p;
                    rings.push({ x: p.x, y: p.y, r: 0.8, t: 0, life: c._boss.under, kind: "ripple" });
                    se("Water2", 70, 60, panOf(p.x));
                    c.setMode("underwater", c._boss.under);
                }
                return;
            }
            if (c._mode === "underwater") {
                if (c._modeT > 0) return;
                const p = c._outPool;
                c.locate(Math.floor(p.x), Math.floor(p.y));
                c._pool = { x: Math.floor(p.x), y: Math.floor(p.y) };
                c._hidden = false;
                c._sink = 0;
                se("Water1", 85, 60, panOf(p.x));
                c.setMode("chase");
                c._gapT = 0;
                if (c.playerDistance() <= 2.8) c.startMove("grab", { windup: 14 });
            }
        },
        dragging(c, g) {   // dragged into a pool's middle: pulled under
            const p = c._pool || c._home;
            if (Math.hypot(heroX() - (p.x + 0.5), heroY() - (p.y + 0.5)) < 0.9 && g.t > 30) {
                const a = $gameParty.leader();
                if (a) a.gainHp(-Math.round(22 * c.strK()));
                numberAt(heroX(), heroY() - 1.5, "Wciąga cię pod wodę!", "#9fd8c8", 0.9);
                se("Water2", 90, 60);
                $gameScreen.startFlash([40, 80, 120, 120], 20);
                releaseGrab(false);
            }
        }
    };

    // ---- the stone doorkeeper: asleep until the hero is at its threshold; every second slam sends rings of shards across the room
    BOSS_AI.boss_60 = {
        start(c) { c._slams = 0; },
        calm(c) {   // (before start: it sleeps until one comes near)
            if (c.playerDistance() <= c._boss.wake) { c._aware = 1; c.wakeUp(); }
            return true;
        },
        landed(c, m) {
            if (c._move !== "slam") return;
            const W = c._boss.waves;
            c._slams = (c._slams || 0) + 1;
            if (c._slams % W.every) return;
            for (let i = 0; i < W.n; i++) waves.push({ x: c.centerX(), y: c.centerY(), r: 0.6, delay: i * W.gap, speed: W.speed, far: W.far, dmg: Math.round(W.dmg * c.strK()), width: W.width, c, hit: false });
            se("Earth3", 90, 70, panOf(c.centerX()));
        }
    };
    // the rings of shards: they grow from the slam; the hero inside the ring's edge as it passes is hit (a roll goes through it)
    let waves = [];
    function updateWaves() {
        const Cb = C();
        for (const w of waves) {
            if (w.delay > 0) { w.delay--; continue; }
            w.r += w.speed;
            if (w.r > w.far) { w.done = true; continue; }
            if (!w.hit && Math.abs(Math.hypot(heroX() - w.x, (heroY() - w.y) / 0.8) - w.r) < w.width && Cb && Cb.hitPlayer) {
                w.hit = true;
                const a = Math.atan2(heroY() - w.y, heroX() - w.x);
                const res = Cb.hitPlayer({ damage: w.dmg, poise: 60, from: { x: heroX() - Math.cos(a), y: heroY() - Math.sin(a) }, attacker: w.c, name: "odłamki", unblockable: false, unparryable: true, knock: 0.6, wound: 0.2 });
                if (res === "dodged") w.hit = true;
            }
            if (Graphics.frameCount % 3 === 0) for (let i = 0; i < 3; i++) { const a = Math.random() * Math.PI * 2; sparksAt(w.x + Math.cos(a) * w.r, w.y + Math.sin(a) * w.r * 0.8, "#b8ad98", 1); }
        }
        waves = waves.filter(w => !w.done);
    }

    // ---- the armour without arms: three quick cuts in a row; it parries a light blow from the front and answers at once
    BOSS_AI.boss_70 = {
        start(c) { c._chain = 0; },
        afterMove(c) {   // the next cut of the three, quick
            c._chain = (c._chain || 0) + 1;
            if (c._chain < c._boss.combo && c.playerDistance() <= 2.4 && !c._parried) { c.startMove("cut", { windup: c._boss.chainWindup || 10 }); return true; }
            c._chain = 0;
            return false;
        },
        guard(c, damage, how, extra) {
            const P2 = c._boss.parry;
            if (how === "shot" || extra.heavy || extra.tag === "sneak" || c._stun > 0 || c._mode === "windup" || c._mode === "strike" || c._mode === "collapsed" || c._mode === "rise") return false;
            if (c.frontDot() < 0.3 || c.playerDistance() > P2.reach || Math.random() >= P2.chance) return false;
            numberAt(c.centerX(), c.centerY() - 2.1, MIND.parried, "#ffd27f", 0.9);
            sparksAt((c.centerX() + heroX()) / 2, (c.centerY() + heroY()) / 2 - 0.6, "#fff2b0", 12);
            se("Parry", 85, 110, panOf(c.centerX()));
            // (the hero's arms jar for less than its answer takes to land: the riposte can be rolled away or parried - with 18 frames of
            // jarring against a 10-frame wind-up it never could, 2026-10-06 balance check)
            T.call("Combat", "recoil", P2.recoil || 10);
            c._chain = 0;
            c.startMove("cut", { windup: P2.riposte });
            return true;
        },
        parried(c) { c._stun = Math.max(c._stun, c._boss.parry.stun); c._chain = 0; }
    };

    // ---- the wraith of the one who asked: questions in the hero's own voice; a blow while one hangs answers it; out from behind him
    BOSS_AI.boss_80 = {
        start(c) { c._hidden = false; c._opacity = 255; c._askT = 160; },
        tick(c) {
            const A = c._boss.ask;
            if (c._mode === "drift" && c._hidden && c._askT > 60) c._askT = 60;
            if (c._asking) {
                c._asking.t++;
                if (c._asking.answered) { c._asking = null; return; }
                if (c._asking.t >= A.window) {   // not answered: the question hits
                    c._asking = null;
                    const hit = mindHit(c, Math.random() < 0.5 ? "fear" : "confuse", 0.08, null, c._def.moves.truth);
                    const a = $gameParty.leader(), dmg = Math.round(A.dmg * c.strK() * (hit ? 1 : 0.5));
                    if (a && a.hp > 0) { a.gainHp(-Math.min(a.hp, dmg)); numberAt(heroX(), heroY() - 1.0, "-" + dmg, "#ff6b5e"); }
                    $gameScreen.startShake(4, 8, 12);
                    se("Darkness4", 75, 80);
                }
                return;
            }
            if (--c._askT <= 0 && !c._hidden && c._stun <= 0 && c._mode !== "truth" && c._mode !== "windup" && c._mode !== "strike") {
                c._askT = rnd(A.every[0], A.every[1]);
                const q = pick(D.QUESTIONS);
                c._asking = { t: 0, q, answered: false };
                say($gamePlayer, q, A.window);
                rings.push({ x: heroX(), y: heroY(), r: 0.9, t: 0, life: A.window, kind: "ask", c, follow: true });
                se("Darkness1", 60, 150);
                if (c._mode === "fadeOut" || c._mode === "drift") { c._hidden = false; c._opacity = 255; c.setMode("shown", A.window + 30); }
                else if (c._mode === "shown") c._modeT = Math.max(c._modeT, A.window + 30);
            }
        },
        hurt(c) {   // a blow while the question hangs: answered - it reels (and the question goes from over the hero's head)
            if (!c._asking) return;
            const SB = T.api("SpeechBubbles"), q = c._asking.q;
            if (SB && SB.barks) for (const bk of SB.barks) if (bk.ch === $gamePlayer && bk.text === q) bk.t = Math.max(bk.t, bk.life - 12);
            c._asking = null;
            numberAt(c.centerX(), c.centerY() - 2.0, MIND.answer, "#9ff0a8", 1);
            c._stun = Math.max(c._stun, c._boss.ask.stun);
            c._poise = 0;
            for (const r of rings) if (r.c === c && r.kind === "ask") r.t = r.life;
            se("Saint1", 70, 110, panOf(c.centerX()));
        },
        // out from behind the hero (the shadow's way): instead of fading in where it is
        show(c) { shadowOut(c); c._showBehind = true; return true; }
    };

    // ---- the last guard: grandpa's face and voice; then the habit; at two thirds of its life three shadows (a third of its life each)
    BOSS_AI.boss_90 = {
        start(c) { c._parts = null; },
        reveal(c) {   // the face drops: the order's habit - the hooded keeper with the ember eyes (its own art, untinted)
            const B = c._boss;
            c._face = null;
            c._look = B.habit;
            if (B.habitDraw) { c._drawScale = B.habitDraw; c._tone = c._lureTone = null; }
            c.setImage(sheetName(c._look), 0);
            for (let i = 0; i < 14; i++) wisps.push({ x: c.centerX() + (Math.random() - 0.5) * 0.9, y: c.centerY() - Math.random() * 1.3, vy: -0.025, t: 0, life: 40, color: "#141018" });
        },
        tick(c) {
            const B = c._boss;
            if (!c._parts && c._revealed && c._mode !== "reveal" && c._hp <= c._maxHp * B.split) {
                c._parts = [c];
                const each = Math.max(1, Math.round(c._hp / B.parts));
                c._hp = each;
                for (const s of openNear(c._x, c._y, 2, 4).slice(0, B.parts - 1)) {
                    const p = minion(c, "cien", s.x, s.y, { level: c._level, face: c._face, look: B.habit });
                    if (!p) continue;
                    p._revealed = true;
                    p._face = null;
                    p._look = B.habit;
                    p.setImage(sheetName(B.habit), 0);
                    p._tone = p._lureTone = c._tone;
                    p.setMode("chase");   // (out of the dark at once: no face to drop)
                    p._scale = c._scale;
                    p._drawScale = c._drawScale;
                    p._maxHp = c._maxHp;
                    p._hp = each;
                    p._partOf = c;
                    c._parts.push(p);
                    for (let i = 0; i < 10; i++) wisps.push({ x: p.centerX() + (Math.random() - 0.5), y: p.centerY() - Math.random(), vy: -0.02, t: 0, life: 40, color: "#141018" });
                }
                numberAt(c.centerX(), c.centerY() - 2.2, "Rozpada się na trzy cienie!", "#c9b8ff", 0.95);
                se("Darkness3", 85, 120, panOf(c.centerX()));
            }
        },
        // its own fall: the boss is beaten only when none of its shadows is left
        fall(c, how) {
            const others = (c._parts || []).filter(p => p !== c && !p._dead && !p._dying);
            if (!others.length) return false;
            c._hp = 0;
            c._hidden = true;
            c._waitParts = true;
            for (let i = 0; i < 12; i++) wisps.push({ x: c.centerX() + (Math.random() - 0.5), y: c.centerY() - Math.random() * 1.2, vy: -0.03, t: 0, life: 40, color: "#141018" });
            c.setMode("waitParts");
            return true;
        },
        // the boss bar: all the shadows' life together
        hp(c) { return (c._parts || [c]).reduce((s, p) => s + Math.max(0, p._dead || p._dying ? 0 : p._hp), 0); }
    };
    // a shadow part of the last guard gone: the last one takes the guard with it
    function partGone(p) {
        const b = p._partOf;
        if (!b || b._dead || b._dying) return;
        if ((b._parts || []).some(o => o !== b && !o._dead && !o._dying)) return;
        if (b._waitParts) die(b, "melee");
    }

    // ==================================================================
    // Spawning: one creature, a swarm (rats, bats: a few round the place), on the floors' markers
    // ==================================================================
    function placeLevelHere() {
        const tag = T.mapTag("Poziom");
        if (tag && /^\d+$/.test(tag.raw)) return Math.max(1, Number(tag.raw));
        const f = UG() && UG().floorOf ? UG().floorOf($gameMap.mapId()) : 0;
        if (f) return D.LEVEL.base + Math.floor((f - 1) / D.LEVEL.perFloors);
        const Cb = C();
        return Cb && Cb.placeLevel ? Cb.placeLevel() : 1;
    }
    function spawnOne(kind, x, y, opts) {
        if ((!KINDS[kind] && !BOSSES[kind]) || !$gameMap || !$gameMap.isValid(x, y)) return null;
        const c = new Game_Creature(kind, x, y, opts || {});
        creatures.push(c);
        RoamingActor.addSprite(c);
        if (c._boss && BOSS_AI[kind] && BOSS_AI[kind].setup) BOSS_AI[kind].setup(c);
        return c;
    }
    // a creature (or a swarm) at (x, y); opts: level, engaged, tag, face, mode
    function spawn(kind, x, y, opts) {
        opts = opts || {};
        const k = KINDS[kind];
        if (k && k.swarm && !opts.single) {
            const f = UG() && UG().floorOf ? UG().floorOf($gameMap.mapId()) : 0;
            const n = Math.min(opts.max || 99, opts.count || clamp(rnd(k.swarm[0], k.swarm[1]) + Math.floor(f / (k.swarmPer || 99)), 1, 8));
            const swarm = { members: [], angle: Math.random() * Math.PI * 2, gapT: 60, kind };
            const spots = [{ x, y }].concat(openNear(x, y, 1, 2.5));
            for (let i = 0; i < n && i < spots.length; i++) {
                const c = spawnOne(kind, spots[i].x, spots[i].y, opts);
                if (!c) continue;
                c._swarm = swarm;
                swarm.members.push(c);
            }
            swarms.push(swarm);
            if (opts.engaged) for (const c of swarm.members) c.engage();
            return swarm.members[0] || null;
        }
        const c = spawnOne(kind, x, y, opts);
        if (c && opts.engaged) { c._aware = 1; if (c._mode === "dormant") c.setMode("wake", 20); else c.engage(); }
        return c;
    }
    let swarms = [];
    function updateSwarms() {
        for (const s of swarms) { s.angle += 0.004; if (s.gapT > 0) s.gapT--; }
        swarms = swarms.filter(s => s.members.some(m => !m._dead));
    }
    // the kind a marker of a generated floor gets when its own lives elsewhere (FIT), "dowolny" too; a hand-made floor's markers as drawn
    function kindFor(kind, floor, handmade, sp) {
        if (BOSSES[kind]) return kind;
        const k = KINDS[kind];
        if (k && (handmade || !floor)) return kind;
        const inRange = k && (k.floors.length === 2 ? floor >= k.floors[0] && floor <= k.floors[1] : (floor >= k.floors[0] && floor <= k.floors[1]) || (floor >= k.floors[2] && floor <= k.floors[3]));
        if (inRange) return kind;
        const band = D.FIT.find(([a, b]) => floor >= a && floor <= b);
        const i = sp ? ((sp.x * 7 + sp.y * 13 + floor * 3) % band[2].length) : Math.floor(Math.random() * (band ? band[2].length : 1));   // (the same kind every visit)
        return band ? band[2][i] : (k ? kind : null);
    }
    const markerKey = (mapId, sp) => mapId + ":" + sp.x + "," + sp.y;
    // the floor's markers -> creatures (not one emptied in the last RESPAWN_DAYS days; a boss once)
    function populate(info) {
        const ug = UG(), mapId = $gameMap.mapId();
        if (!ug || !info) return;
        const f = info.floor || ug.floorOf(mapId), handmade = !ug.isGenerated(mapId), s = S();
        let count = 0;
        for (const sp of info.spawns || []) {
            if (sp.kind === "zbroja_straznik") continue;   // (the guardian of the tenth gate: his own event - onGuardian)
            const room = D.MAX_PER_FLOOR - count;
            if (room <= 0 && !BOSSES[sp.kind]) continue;   // (enough on one floor: the rest of the places stay empty this visit)
            const kind = kindFor(String(sp.kind), f, handmade, sp);
            if (!kind) continue;
            const key = markerKey(mapId, sp);
            if (BOSSES[kind] && (s.bosses[key] || (ug.bosses && ug.bosses()[f]))) continue;   // (beaten: its floor's stairs are open)
            if (s.killed[key] !== undefined && day() - s.killed[key] < D.RESPAWN_DAYS) continue;
            if (Math.hypot(sp.x - $gamePlayer.x, sp.y - $gamePlayer.y) < 4) continue;   // (not on the hero's head as he comes down the stairs)
            const lead = spawn(kind, sp.x, sp.y, { tag: "floor", max: Math.max(1, room) });
            if (!lead) continue;
            const group = lead._swarm ? lead._swarm.members : [lead];
            count += group.length;
            const marker = { key, members: group };
            for (const c of group) c._marker = marker;
        }
    }
    // a marker whose creatures are all dead: empty for some days
    function markerDone(c) {
        const mk = c._marker;
        if (!mk || mk.members.some(o => o !== c && !o._dead && !o._dying)) return;
        S().killed[mk.key] = day();
    }
    function removeCreature(c) {
        c._dead = true;
        c._gone = true;
        if (c._markSprite && c._markSprite.parent) c._markSprite.parent.removeChild(c._markSprite);
        if (c._markHolder && c._markHolder.parent) c._markHolder.parent.removeChild(c._markHolder);
        RoamingActor.dropSprite(c);
        creatures = creatures.filter(o => o !== c);
        if (bossNow === c) bossNow = null;
    }
    function clearAll() {
        for (const c of creatures) RoamingActor.dropSprite(c);
        creatures = [];
        swarms = [];
        webs = []; patches = []; rings = []; lines = []; wisps = []; puffs = []; pools = []; shards = [];
        grab = null;
        pull = null;
        heroLift = 0;
        waves = [];
        webT = 0;
        mind.confuseT = 0;
        mind.fearT = 0;
        bossNow = null;
        populated = 0;
    }

    // ---- Underground.js: every kind registered (a marker event for each place of a generated floor - ids 860-899: invisible, it only
    // holds the place; the creatures are this plugin's own), the guardian's fight, the floors filled as they are entered
    const MARKER_PAGE = () => ({ conditions: { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1,
        switch1Valid: false, switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 }, directionFix: true,
        image: { tileId: 0, characterName: "", characterIndex: 0, direction: 2, pattern: 0 }, list: [{ code: 0, indent: 0, parameters: [] }], moveFrequency: 3,
        moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0, priorityType: 0,
        stepAnime: false, through: true, trigger: 0, walkAnime: false });
    let registered = false;
    function registerWithUnderground() {
        const ug = UG();
        if (registered || !ug || !ug.registerCreature) return;
        registered = true;
        const make = kind => (sp, ctx) => ({ name: "Stwór: " + (KINDS[kind] ? KINDS[kind].name : (BOSSES[kind] || {}).name || kind), note: "<Creature:" + kind + ">",
            pages: [MARKER_PAGE()], x: sp.x, y: sp.y });
        for (const kind of Object.keys(KINDS).concat(Object.keys(BOSSES).filter(k => k !== "guardian"))) ug.registerCreature(kind, make(kind));
        ug.registerCreature("*", (sp, ctx) => make(kindFor("dowolny", ctx.floor, false, sp) || "szczur")(sp, ctx));
        if (ug.onGuardian) ug.onGuardian(guardianHook);
    }
    let populated = 0;
    T.on("undergroundFloor", e => {
        if (!auto || populated === e.mapId) return;
        populated = e.mapId;
        populate({ floor: e.floor, spawns: e.spawns });
        guardianCheck();
    }, { owner: PLUGIN });

    // ---- floor 10's guardian (Map140, the event with <Stwor:zbroja_straznik>): the riddle as Underground.js has it - but the hero who comes
    // in the combat mode (Tab), or strikes the dormant armour, gets the fight instead; beaten: the tenth gate opens (switch 14), the
    // armour lies in pieces there from then on
    function guardianEvent() {
        return $gameMap.events().find(e => e.event() && /<Stwor:zbroja_straznik>/.test(e.event().note || "")) || null;
    }
    function guardianHook(eventId) {
        const Cb = C();
        if (S().guardian) return true;   // (beaten: nothing to say any more)
        if (!(Cb && Cb.combatMode && Cb.combatMode()) && !guardianFightWanted) return false;
        guardianFightWanted = false;
        startGuardianFight($gameMap.event(eventId));
        return true;
    }
    let guardianFightWanted = false;
    function startGuardianFight(ev) {
        if (!ev || creatures.some(c => c._kind === "guardian" && !c._dead)) return null;
        const c = spawnOne("guardian", ev.x, ev.y, { level: placeLevelHere(), mode: "wake" });
        if (!c) return null;
        c._guardianEvent = ev.eventId();
        c._faceAng = Math.PI / 2;
        c._engaged = false;
        c._aware = 1;
        c.setMode("wake", 50);
        ev.erase();
        say(c, "KTO SCHODZI, TEN PYTA. KTO DOBYWA MIECZA - TEN WALCZY.", 220);
        se("Darkness3", 85, 70);
        return c;
    }
    function guardianBeaten(c) {
        S().guardian = true;
        const ug = UG();
        if (window.Underground_Data) $gameSwitches.setValue(Underground_Data.SWITCHES.gate10, true);
        if (ug && ug.gate10Opened) ug.gate10Opened();
        T.popup("Dziesiąta brama stoi otworem", { top: true, color: "#ffe9a8", sub: "Strażnik pokonany" });
    }
    // on the floor again: the beaten guardian's event gone (his pieces lie there - the drop); a dormant one is a target
    function guardianCheck() {
        const ev = guardianEvent();
        if (!ev) return;
        if (S().guardian) ev.erase();
    }
    function guardianTarget() {
        if (S().guardian || !$gameMap) return [];
        const ev = guardianEvent();
        if (!ev || ev._erased || ($gameSwitches && window.Underground_Data && $gameSwitches.value(Underground_Data.SWITCHES.gate10))) return [];
        return [{ x: ev.x + 0.5, y: ev.y + 0.4, radius: 0.5, ref: null, hit: () => { guardianFightWanted = true; numberAt(ev.x + 0.5, ev.y - 0.6, MIND.plate, "#cfd6de", 0.8); se("Sword4", 80, 110); startGuardianFight(ev); } }];
    }

    // ==================================================================
    // The pictures of the layer: remains, webs (in flight and on the floor), rings on the floor (a slam, a falling stone, a drop's shadow,
    // a truth's pull, a ripple), the dive lines, bats' shadows, wisps, smoke, pools; and the boss bar on the screen
    // ==================================================================
    let pools = [];
    const bmpCache = {};
    function cached(key, make) { return bmpCache[key] || (bmpCache[key] = make()); }
    function ellipseBmp(key, w, h, fill) {
        return cached(key, () => { const b = new Bitmap(w, h), c = b.context; c.fillStyle = fill; c.beginPath(); c.ellipse(w / 2, h / 2, w / 2 - 1, h / 2 - 1, 0, 0, Math.PI * 2); c.fill(); b._baseTexture.update(); return b; });
    }
    function webBitmap() {
        return cached("web", () => {
            const b = new Bitmap(40, 26), c = b.context;
            c.strokeStyle = "rgba(235,235,225,0.75)";
            c.lineWidth = 1;
            for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; c.beginPath(); c.moveTo(20, 13); c.lineTo(20 + Math.cos(a) * 18, 13 + Math.sin(a) * 11); c.stroke(); }
            for (const r of [5, 10, 15]) { c.beginPath(); c.ellipse(20, 13, r, r * 0.6, 0, 0, Math.PI * 2); c.stroke(); }
            b._baseTexture.update();
            return b;
        });
    }
    function lumpBitmap() {
        return cached("lump", () => {
            const b = new Bitmap(12, 10), c = b.context;
            c.fillStyle = "#2a2622"; c.fillRect(1, 2, 10, 6); c.fillRect(2, 1, 8, 8);
            c.fillStyle = "#e8e6dc"; c.fillRect(2, 2, 8, 5); c.fillRect(3, 1, 6, 7);
            c.fillStyle = "#ffffff"; c.fillRect(4, 2, 3, 2);
            b._baseTexture.update();
            return b;
        });
    }
    function ringBitmap(kind) {
        return cached("ring:" + kind, () => {
            const b = new Bitmap(96, 60), c = b.context;
            const col = { wave: "rgba(220,200,160,0.9)", warn: "rgba(255,90,70,0.85)", rock: "rgba(255,120,80,0.85)", truth: "rgba(200,190,255,0.8)", shadow: "rgba(0,0,0,0.55)",
                ripple: "rgba(170,210,230,0.8)", rite: "rgba(205,180,255,0.55)", thread: "rgba(240,240,232,0.85)", ask: "rgba(210,200,255,0.85)" }[kind];
            if (kind === "shadow") { c.fillStyle = col; c.beginPath(); c.ellipse(48, 30, 46, 28, 0, 0, Math.PI * 2); c.fill(); }
            else if (kind === "rite") {   // the rite's ring: a double line with marks round it
                c.strokeStyle = col; c.lineWidth = 2;
                c.beginPath(); c.ellipse(48, 30, 45, 27, 0, 0, Math.PI * 2); c.stroke();
                c.beginPath(); c.ellipse(48, 30, 41, 24, 0, 0, Math.PI * 2); c.stroke();
                for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.fillStyle = col; c.fillRect(48 + Math.cos(a) * 43 - 1, 30 + Math.sin(a) * 25.5 - 1, 3, 3); }
            }
            else { c.strokeStyle = col; c.lineWidth = kind === "wave" ? 3 : 2; c.beginPath(); c.ellipse(48, 30, 45, 27, 0, 0, Math.PI * 2); c.stroke(); }
            if (kind === "warn" || kind === "rock") { c.fillStyle = kind === "rock" ? "rgba(255,120,80,0.18)" : "rgba(255,90,70,0.14)"; c.beginPath(); c.ellipse(48, 30, 44, 26, 0, 0, Math.PI * 2); c.fill(); }
            b._baseTexture.update();
            return b;
        });
    }
    function puddleBitmap() {
        return cached("puddle", () => {
            const b = new Bitmap(56, 24), c = b.context;
            c.fillStyle = "rgba(20,32,36,0.8)"; c.beginPath(); c.ellipse(28, 12, 26, 10, 0, 0, Math.PI * 2); c.fill();
            c.fillStyle = "rgba(60,90,96,0.6)"; c.beginPath(); c.ellipse(24, 10, 14, 5, 0, 0, Math.PI * 2); c.fill();
            c.fillStyle = "#3d5a2a"; for (const [x, y] of [[10, 12], [40, 14], [30, 6]]) c.fillRect(x, y, 6, 2);
            b._baseTexture.update();
            return b;
        });
    }
    function rubbleBitmap() {
        return cached("rubble", () => {
            const b = new Bitmap(56, 30), c = b.context;
            const stone = (x, y, w, h, col) => { c.fillStyle = "#1d1b18"; c.fillRect(x - 1, y - 1, w + 2, h + 2); c.fillStyle = col; c.fillRect(x, y, w, h); c.fillStyle = "rgba(255,255,255,0.18)"; c.fillRect(x, y, w, 2); };
            stone(6, 14, 14, 10, "#7d7a70"); stone(22, 10, 16, 14, "#8e8a7e"); stone(36, 16, 12, 9, "#6f6c63"); stone(16, 20, 8, 6, "#858176"); stone(30, 6, 8, 6, "#7a776d");
            c.fillStyle = "#3d5a2a"; c.fillRect(24, 10, 6, 2);
            b._baseTexture.update();
            return b;
        });
    }
    function puffBitmap() { return ellipseBmp("puff", 12, 12, "rgba(20,16,30,0.75)"); }
    function wispBitmap(color) { return ellipseBmp("wisp" + color, 6, 6, color); }

    function Sprite_CreaturesLayer() {
        this.initialize(...arguments);
    }
    Sprite_CreaturesLayer.prototype = Object.create(Sprite.prototype);
    Sprite_CreaturesLayer.prototype.constructor = Sprite_CreaturesLayer;
    Sprite_CreaturesLayer.prototype.initialize = function(tilemap) {
        Sprite.prototype.initialize.call(this);
        this._tilemap = tilemap;
        this._map = new Map();   // a thing -> its sprite
        this._age = 0;
    };
    Sprite_CreaturesLayer.prototype.add = function(s, z) { s.z = z; this._tilemap.addChild(s); return s; };
    Sprite_CreaturesLayer.prototype.drop = function(s) { if (s && s.parent) s.parent.removeChild(s); };
    // a sprite kept for a thing while it is in `list` this frame
    Sprite_CreaturesLayer.prototype.keep = function(seen, key, make, z) {
        seen.add(key);
        let s = this._map.get(key);
        if (!s) { s = this.add(make(), z); this._map.set(key, s); }
        return s;
    };
    Sprite_CreaturesLayer.prototype.update = function() {
        Sprite.prototype.update.call(this);
        if (!$gameMap) return;
        this._age++;
        const seen = new Set();
        // the remains
        for (const d of dropsOf()) {
            const s = this.keep(seen, d, () => remainsSprite(d), 1.9);
            s.x = toSX(d.x); s.y = toSY(d.y);
            if (s._glint) s._glint.visible = !d.empty && Math.floor((this._age + (s._seed || 0)) / 30) % 4 === 0;
        }
        // the pools of the river's lord
        for (const p of pools) {
            const s = this.keep(seen, p, () => { const s = new Sprite(puddleBitmap()); s.anchor.set(0.5, 0.5); s.scale.set(1.5, 1.6); return s; }, 1.6);
            s.x = toSX(p.x); s.y = toSY(p.y);
        }
        // webs on the floor, webs in flight
        for (const p of patches) {
            const s = this.keep(seen, p, () => { const s = new Sprite(webBitmap()); s.anchor.set(0.5, 0.5); return s; }, 1.7);
            s.x = toSX(p.x); s.y = toSY(p.y);
            s.opacity = p.t > p.life - 60 ? Math.round(255 * (p.life - p.t) / 60) : 230;
        }
        for (const w of webs) {
            const s = this.keep(seen, w, () => { const s = new Sprite(lumpBitmap()); s.anchor.set(0.5, 0.5); s.scale.set(1.6, 1.6); return s; }, 5);
            s.x = toSX(w.x); s.y = toSY(w.y) - 10;
            s.rotation += 0.3;
        }
        // rings on the floor (a slam's wave, a warning, a falling stone, a drop's shadow, a ripple, a truth's pull)
        for (const r of rings) {
            const s = this.keep(seen, r, () => { const s = new Sprite(ringBitmap(r.kind)); s.anchor.set(0.5, 0.5); return s; }, r.kind === "shadow" ? 1.65 : 1.75);
            s.x = toSX(r.x); s.y = toSY(r.y);
            const k = r.t / r.life;
            let sc = r.r / 1.5;
            if (r.kind === "wave") { sc *= 0.6 + 0.6 * k; s.opacity = Math.round(255 * (1 - k)); }
            else if (r.kind === "shadow") { sc *= 0.3 + 0.7 * Math.min(1, k * 1.2); s.opacity = 140 + Math.round(100 * k); }
            else if (r.kind === "ripple") { sc *= 0.4 + 0.8 * ((r.t % 20) / 20); s.opacity = Math.round(220 * (1 - (r.t % 20) / 20)); }
            else if (r.kind === "rite") { s.opacity = 150 + Math.round(60 * Math.sin(this._age / 20)); }
            else if (r.kind === "ask") { r.x = heroX(); r.y = heroY(); sc *= 1 - 0.6 * k; s.opacity = 230; }
            else if (r.kind === "thread") { sc *= 0.6 + 0.4 * Math.abs(Math.sin(r.t / 6)); s.opacity = 220; }
            else if (r.kind === "truth") { sc *= 0.8 + 0.5 * Math.abs(Math.sin(r.t / 8)); s.opacity = 200; if (r.c) { r.x = r.c.centerX(); r.y = r.c.centerY(); } if (r.c && r.c._mode !== "truth") r.t = r.life; }
            else s.opacity = 140 + Math.round(110 * Math.abs(Math.sin(r.t / 5)));
            s.scale.set(sc, sc);
        }
        // the thread of the mother of spiders: a white line down from the dark
        for (const r of rings) {
            if (r.kind !== "thread") continue;
            const g = this.keep(seen, "th" + r.t + (r.c ? r.c._cid : 0), () => new PIXI.Graphics(), 6.5);
            const x = toSX(r.x), y = toSY(r.y);
            g.clear();
            g.lineStyle(1, 0xf0f0e8, 0.8);
            g.moveTo(x, y - 2 - 240); g.lineTo(x, y - 6);
        }
        if (pull) {
            const g = this.keep(seen, "pullLine", () => new PIXI.Graphics(), 6.5);
            const x = toSX(heroX()), y = toSY(heroY()) - 40 - heroLift;
            g.clear();
            g.lineStyle(1, 0xf0f0e8, 0.85);
            g.moveTo(x, y - 260); g.lineTo(x, y);
        }
        // the rings of shards from the doorkeeper's fists
        for (const w of waves) {
            if (w.delay > 0) continue;
            const g = this.keep(seen, w, () => new PIXI.Graphics(), 1.76);
            g.clear();
            g.lineStyle(3, 0xc9b89a, 0.85);
            g.drawEllipse(toSX(w.x), toSY(w.y), w.r * tw(), w.r * th() * 0.8);
            g.lineStyle(1, 0xffe0b0, 0.6);
            g.drawEllipse(toSX(w.x), toSY(w.y), (w.r - 0.15) * tw(), (w.r - 0.15) * th() * 0.8);
        }
        // the dive / charge lines: from the creature to past the hero, while it winds up
        for (const l of lines) {
            l.t++;
            const c = l.c, live = c && !c._dead && ((c._mode === "dive" && c._modeT > 0) || ((c._mode === "charge" || c._mode === "ram") && c._modeT > 0));
            if (!live) { l.done = true; continue; }
            const g = this.keep(seen, l, () => new PIXI.Graphics(), 1.75);
            const x0 = toSX(c.centerX()), y0 = toSY(c.centerY()) + 6, len = (l.charge ? (c._chargeDef || {}).far || 6 : c._diveTo.len) * tw();
            const x1 = x0 + c._lock[0] * len, y1 = y0 + c._lock[1] * len;
            g.clear();
            const k = 1 - c._modeT / Math.max(1, c._modeLen);
            g.lineStyle(l.charge ? 6 : 3, 0xff4b3e, 0.2 + 0.5 * k);
            g.moveTo(x0, y0); g.lineTo(x1, y1);
        }
        lines = lines.filter(l => !l.done);
        // the bats' shadows on the floor, the shadow creature's eyes, the wraiths' smoke, the helms and the egg sacs
        for (const c of creatures) {
            if (c._def.flying && !c._dead) {
                const s = this.keep(seen, "sh" + c._cid, () => { const s = new Sprite(ellipseBmp("batsh", 18, 8, "rgba(0,0,0,0.45)")); s.anchor.set(0.5, 0.5); return s; }, 1.8);
                s.x = toSX(c.centerX()); s.y = toSY(c.centerY()) + 10;
                const k = clamp(1 - (c._alt || 0) / 50, 0.35, 1);
                s.scale.set(k, k);
            }
        }
        // the stone's shards: up a little, then down to the floor, bouncing once, fading at the end
        for (const p of shards) {
            p.t++;
            p.mx += p.vx;
            p.vlift -= 0.35;
            p.lift += p.vlift;
            if (p.lift < 0) { p.lift = 0; p.vlift = Math.abs(p.vlift) > 1.2 ? -p.vlift * 0.3 : 0; p.vx *= 0.6; }
            const s = this.keep(seen, p, () => { const s = new Sprite(p.bmp); s.setFrame(p.fx, p.fy, p.w, p.h); s.anchor.set(0.5, 0.5); s.scale.set(p.sc, p.sc); return s; }, 3);
            s.x = toSX(p.mx); s.y = toSY(p.my) - 8 - p.lift;
            s.rotation += p.rot * (p.lift > 0 ? 1 : 0.1);
            s.opacity = p.t > p.life - 20 ? Math.round(255 * (p.life - p.t) / 20) : 255;
        }
        shards = shards.filter(p => p.t < p.life);
        // the wisps (a wraith's cold breath, a dissolving body), the smoke where a shadow comes out
        for (const w of wisps) {
            w.t++; w.y += w.vy; w.x += Math.sin((w.t + w.x * 10) / 8) * 0.006;
            const s = this.keep(seen, w, () => { const s = new Sprite(wispBitmap(w.color)); s.anchor.set(0.5, 0.5); return s; }, 6);
            s.x = toSX(w.x); s.y = toSY(w.y) - 8;
            s.opacity = Math.round(200 * (1 - w.t / w.life));
            s.scale.set(1 + w.t / 30, 1 + w.t / 30);
        }
        wisps = wisps.filter(w => w.t < w.life);
        for (const p of puffs) {
            p.t++;
            if (p.t % 4 === 0) wisps.push({ x: p.x + (Math.random() - 0.5) * 0.8, y: p.y - Math.random() * 0.4, vy: -0.015, t: 0, life: 36, color: "#141018" });
            const s = this.keep(seen, p, () => { const s = new Sprite(puffBitmap()); s.anchor.set(0.5, 0.5); return s; }, 5.5);
            s.x = toSX(p.x); s.y = toSY(p.y);
            const k = p.t / p.life;
            s.scale.set(1.5 + 2.5 * k, 1 + 1.5 * k);
            s.opacity = Math.round(220 * (k < 0.8 ? 1 : (1 - k) / 0.2));
        }
        puffs = puffs.filter(p => p.t < p.life);
        for (const [key, s] of this._map) if (!seen.has(key)) { this.drop(s); this._map.delete(key); }
    };
    // the remains of each kind: the last frame of its end (a pile of armour, rubble), a body on its back, a puddle, rags
    function remainsSprite(d) {
        const root = new Sprite();
        root._seed = rnd(0, 90);
        const look = LOOKS[d.look] || {};
        const add = (bmp, ax, ay) => { const s = new Sprite(bmp); s.anchor.set(ax, ay); root.addChild(s); return s; };
        if (d.kind === "drowned") add(puddleBitmap(), 0.5, 0.5);
        if (d.kind === "stone" && !look.die) add(rubbleBitmap(), 0.5, 0.7);
        if (look.die && d.kind !== "wraith" && (d.kind !== "shadow" || look.top)) {   // (its end's last frame: a pile, a body - the rat queen's too, the last guard's empty habit)
            const cell = look.die.cell, s = add(ImageManager.loadCharacter("anim8/Cr_" + d.look + "_Die8"), 0.5, 1);
            const bmp = s.bitmap, row = d.right ? 6 : 2;
            const setF = () => { const n = Math.max(1, Math.round(bmp.width / cell)); s.setFrame((n - 1) * cell, row * cell, cell, cell); };
            if (bmp.isReady()) setF(); else bmp.addLoadListener(setF);
            s.y = Math.round(cell * 0.18);
            s.scale.set(d.scale || 1, d.scale || 1);
            if (d.tone) s.setColorTone(d.tone);
        } else if (d.kind === "rat" || d.kind === "bat" || d.kind === "spider") {   // on its back, legs up
            const cell = look.cell || 64, s = add(ImageManager.loadCharacter("anim8/Cr_" + d.look + "_Walk8"), 0.5, 0.5);
            s.setFrame(0, 6 * cell, cell, cell);
            s.scale.set((d.scale || 1) * (d.right ? 1 : -1), -(d.scale || 1));
            s.y = -4;
            s.setBlendColor([40, 20, 20, 90]);
            if (d.tone) s.setColorTone(d.tone);
        } else if (d.kind === "wraith") {
            const g = add(cached("rags", () => { const b = new Bitmap(36, 14), c = b.context; c.fillStyle = "rgba(200,206,212,0.55)"; c.beginPath(); c.ellipse(18, 8, 16, 5, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = "rgba(150,156,164,0.6)"; c.fillRect(8, 6, 6, 3); c.fillRect(22, 8, 8, 2); b._baseTexture.update(); return b; }), 0.5, 0.5);
            g.y = 2;
        }
        // a glint over what is still to take
        const gl = new Sprite(cached("glint", () => { const b = new Bitmap(7, 7); b.fillRect(3, 0, 1, 7, "#fff6c8"); b.fillRect(0, 3, 7, 1, "#fff6c8"); b.fillRect(2, 2, 3, 3, "#ffffff"); return b; }));
        gl.anchor.set(0.5, 0.5);
        gl.y = -14;
        root.addChild(gl);
        root._glint = gl;
        return root;
    }
    // the rings on the floor go on in the game's time (a falling stone lands on its frame)
    function updateRings() {
        for (const r of rings) { r.t++; if (r.kind === "rock" && r.t === r.life) rockLands(r); }
        rings = rings.filter(r => r.t <= r.life);
    }
    // a stone from the vault lands (the ancient sentinel's room)
    function rockLands(r) {
        sparksAt(r.x, r.y - 0.2, "#9c8a70", 10);
        se("Earth1", 70, 100, panOf(r.x));
        if (Math.hypot(heroX() - r.x, heroY() - r.y) <= r.r) {
            const Cb = C();
            if (Cb && Cb.hitPlayer) Cb.hitPlayer({ damage: r.dmg || 20, poise: 40, from: { x: r.x, y: r.y - 0.2 }, attacker: r.c, name: "kamień", unblockable: false, unparryable: true, knock: 0.3 });
        }
    }

    // ---- what glows on them, over the dark of the floors (RoomLighting's darkness covers the map; every light is a flame): the pale fire in
    // an armour's visor, the ember crack on a stone sentinel's back, a wraith's eyes, a shadow's red eyes - drawn over the dark, additive
    const GLOW = {
        zbroja: { color: [255, 226, 160], r: 7, y: 49, side: 3, ways: [1, 2, 3, 4, 6], dormant: 0.35 },
        kamiennik: { color: [255, 132, 50], r: 13, y: 46, side: 0, ways: [7, 8, 9], dormant: 0.6 },
        upior: { color: [210, 236, 255], r: 5, y: 56, side: 2, ways: [1, 2, 3], eyes: 3 },
        cien: { color: [255, 70, 40], r: 5, y: 46, side: 3, ways: [1, 2, 3, 4, 6], eyes: 3 }
    };
    // the bosses' and the shadow's own art: their own glow (y: px over the feet, eyes: half the gap between two eyes, side: px to the
    // side it faces; a list: more than one glow) - the armour's visor flame, the stone doorkeeper's eyes and the crack in its back, the last
    // guard's and the shadow's embers, the mother's eyes
    const GLOW_LOOK = {
        Shadow: { color: [255, 70, 40], r: 5, y: 49, side: 3, ways: [1, 2, 3, 4, 6], eyes: 2.5 },
        Last: { color: [255, 80, 40], r: 5, y: 52, side: 2, ways: [1, 2, 3], eyes: 2.5 },
        Blank: { color: [255, 226, 160], r: 7, y: 51, side: 4, ways: [1, 2, 3, 4, 6] },
        Keeper: [{ color: [255, 150, 60], r: 8, y: 99, side: 6, ways: [1, 2, 3, 4, 6], eyes: 5.5, dormant: 0.35 },   // (its eyes; and the ember crack of its
            { color: [255, 132, 50], r: 15, y: 72, side: 0, ways: [7, 8, 9], dormant: 0.6 }],                     // back, as the stone sentinels have)
        Mother: { color: [255, 60, 40], r: 5, y: 43, side: 8, ways: [1, 2, 3], eyes: 5 }
    };
    function glowBitmap(rgb, r) {
        return cached("glow" + rgb.join() + r, () => {
            const size = r * 4, b = new Bitmap(size, size), c = b.context, g = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
            g.addColorStop(0, "rgba(" + rgb.join() + ",0.95)");
            g.addColorStop(0.18, "rgba(" + rgb.join() + ",0.7)");
            g.addColorStop(0.5, "rgba(" + rgb.join() + ",0.22)");
            g.addColorStop(1, "rgba(" + rgb.join() + ",0)");
            c.fillStyle = g;
            c.fillRect(0, 0, size, size);
            b._baseTexture.update();
            return b;
        });
    }
    function Sprite_CreatureGlow() {
        this.initialize(...arguments);
    }
    Sprite_CreatureGlow.prototype = Object.create(Sprite.prototype);
    Sprite_CreatureGlow.prototype.constructor = Sprite_CreatureGlow;
    Sprite_CreatureGlow.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this._glows = new Map();
        this._age = 0;
    };
    Sprite_CreatureGlow.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this._age++;
        const seen = new Set();
        for (const c of creatures) {
            const own = GLOW_LOOK[c._look] && !c._face, sp = c._sprite;
            const list = own ? [].concat(GLOW_LOOK[c._look]) : GLOW[c._base] ? [GLOW[c._base]] : [];
            if (!list.length || !sp || !sp.parent || c._dead || c._hidden) continue;
            if (c._base === "cien" && !c._revealed) continue;
            if (!own && c._look !== KINDS[c._base].look && c._base !== "cien" && c._look !== "Prior") continue;   // (a boss in another look: its own - the prior has a visor too)
            const f8 = sp._l8dir || 2;
            const out = c._dying || c._mode === "collapsed" || c._mode === "rise";
            if (out) continue;
            list.forEach((G, gi) => {
                if (!G.ways.includes(f8)) return;
                for (let k = 0; k < (G.eyes ? 2 : 1); k++) {
                    const key = c._cid + ":" + gi + ":" + k;
                    seen.add(key);
                    let s = this._glows.get(key);
                    if (!s) { s = new Sprite(glowBitmap(G.color, G.r)); s.anchor.set(0.5, 0.5); s.blendMode = 1; this.addChild(s); this._glows.set(key, s); }
                    const sc = Math.abs(sp.scale.y) || 1, sideX = f8 === 4 || f8 === 1 || f8 === 7 ? -G.side : f8 === 6 || f8 === 3 || f8 === 9 ? G.side : 0;
                    const spread = G.eyes ? (k ? 1 : -1) * G.eyes * (f8 === 2 || f8 === 8 ? 1 : 0.5) : 0;
                    s.x = sp.x + (sideX + spread) * sc;
                    s.y = sp.y - G.y * sc;
                    const flick = 0.82 + 0.12 * Math.sin(this._age * 0.31 + c._cid) + 0.06 * Math.sin(this._age * 0.77 + c._cid * 3);
                    const dim = c._mode === "dormant" ? G.dormant || 0.4 : c._mode === "wake" ? 0.4 + 0.6 * (1 - c._modeT / Math.max(1, c._modeLen)) : 1;
                    s.alpha = flick * dim * ((c._opacity === undefined ? 255 : c._opacity) / 255) * (c._base === "kamiennik" && c._stoneStunned ? 1.4 : 1);
                    s.scale.set(sc * (G.eyes ? 0.7 : 1), sc * (G.eyes ? 0.7 : 1));
                }
            });
        }
        for (const [key, s] of this._glows) if (!seen.has(key)) { this.removeChild(s); this._glows.delete(key); }
    };

    // ---- the boss's bar: across the top of the screen, its name over it
    function Sprite_BossBar() {
        this.initialize(...arguments);
    }
    Sprite_BossBar.prototype = Object.create(Sprite.prototype);
    Sprite_BossBar.prototype.constructor = Sprite_BossBar;
    Sprite_BossBar.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this, new Bitmap(520, 46));
        this.anchor.set(0.5, 0);
        this.x = Math.round(Graphics.width / 2);
        this.y = Graphics.height - 118;   // (at the bottom centre: the top has the mode's label and the notices)
        this.opacity = 0;
        this._key = "";
    };
    Sprite_BossBar.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const b = bossNow && !bossNow._dead && !bossNow._gone ? bossNow : null;
        this.opacity = b ? Math.min(255, this.opacity + 20) : Math.max(0, this.opacity - 12);
        if (!b) return;
        const B = BOSS_AI[b._kind], hp = B && B.hp ? B.hp(b) : b._hp;   // (the last guard: all its shadows together)
        const key = Math.round(hp) + ":" + Math.round(b._poise) + ":" + b._stun;
        if (key === this._key) return;
        this._key = key;
        const bmp = this.bitmap, ctx = bmp.context, w = 480, x = 20, U = T.api("UITheme") || {};
        bmp.clear();
        bmp.fontSize = 20;
        bmp.fontBold = true;
        bmp.outlineColor = "rgba(0,0,0,0.95)";
        bmp.outlineWidth = 5;
        bmp.textColor = "#ffe9c8";
        bmp.drawText(b._boss.name + "   poz. " + b._level, 0, 0, 520, 24, "center");
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(x - 2, 26, w + 4, 16);
        ctx.fillStyle = "#3a1614";
        ctx.fillRect(x, 28, w, 8);
        ctx.fillStyle = b._stun > 0 ? "#ff9f40" : "#e5484d";
        ctx.fillRect(x, 28, Math.round(w * clamp(hp / b._maxHp, 0, 1)), 8);
        ctx.fillStyle = "#2c2a18";
        ctx.fillRect(x, 38, w, 3);
        ctx.fillStyle = U.accent || "#ffd23f";
        ctx.fillRect(x, 38, Math.round(w * clamp(b._poise / b._maxPoise, 0, 1)), 3);
        bmp._baseTexture.update();
    };
    // ---- the mind on the screen: confusion - a slow purple shimmer at the edges while it lasts
    function Sprite_MindVeil() {
        this.initialize(...arguments);
    }
    Sprite_MindVeil.prototype = Object.create(Sprite.prototype);
    Sprite_MindVeil.prototype.constructor = Sprite_MindVeil;
    Sprite_MindVeil.prototype.initialize = function() {
        const w = Graphics.width, h = Graphics.height, b = new Bitmap(w, h), c = b.context, g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.65);
        g.addColorStop(0, "rgba(90,40,140,0)");
        g.addColorStop(1, "rgba(90,40,140,0.55)");
        c.fillStyle = g;
        c.fillRect(0, 0, w, h);
        b._baseTexture.update();
        Sprite.prototype.initialize.call(this, b);
        this.opacity = 0;
    };
    Sprite_MindVeil.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const on = mind.confuseT > 0 || mind.fearT > 0;
        this.opacity = on ? Math.round(150 + 80 * Math.sin(Graphics.frameCount / 10)) : Math.max(0, this.opacity - 10);
        this.setColorTone(mind.fearT > 0 ? [-60, -40, 60, 0] : [0, 0, 0, 0]);
    };

    // ==================================================================
    // The map drives it
    // ==================================================================
    let auto = true;   // tests switch the floors' filling off
    let pending = null;
    T.on("load", clearAll, { owner: PLUGIN });
    T.on("mapEnter", () => { clearAll(); if ($gameSystem) rotDrops(); }, { owner: PLUGIN });
    // a noise (a blow, a shot): who hears it turns round
    function heard(x, y, r) {
        for (const c of creatures) {
            if (c._dead || c._engaged) continue;
            const d = Math.hypot(c.centerX() - x, c.centerY() - y);
            if (d > r) continue;
            c._alarm = 240;
            c._aware = Math.max(c._aware, 0.75);
        }
    }
    let hooked = false;
    function hookHunting() {
        if (hooked) return;
        const Hn = H(), Cb = C();
        if (!Hn || !Hn.addTargets) return;
        hooked = true;
        registerLooks();
        // the hero's blows and shots find them (a hidden wraith, a bat high up for a blade, one dying: not)
        Hn.addTargets(() => {
            const Cb2 = C(), ranged = !!(Cb2 && Cb2.hand && Cb2.hand() === "ranged");
            const out = creatures.filter(c => c.targetable(ranged))
                .map(c => ({ x: c.centerX(), y: c.centerY() - 0.1 - (c._alt || 0) / 64, radius: c._radius, ref: c, hit: (d, how, extra) => hitCreature(c, d, how, extra) }));
            return out.concat(guardianTarget());
        });
        Hn.onNoise(heard);
        if (Cb && Cb.addFoes) Cb.addFoes(() => creatures.filter(c => !c._hidden && !(c._def.flying && c._alt > 16) && !c._dying));
        registerWithUnderground();
    }
    function summon() {
        const p = pending;
        pending = null;
        if (!p) return;
        const kind = typeof p === "string" ? p : p.kind;
        const boss = !!BOSSES[kind];
        const spots = openNear($gamePlayer.x, $gamePlayer.y, boss ? 5 : 4, boss ? 7 : 6).filter(s => HP().clearLine(HP().pathGrid(), s.x, s.y, $gamePlayer.x, $gamePlayer.y, true));
        const s = spots[0];
        if (!s) { popup(0, "Nie ma tu miejsca", "#bcd8ff"); return; }
        if (kind === "guardian" && guardianEvent() && !S().guardian) { guardianFightWanted = true; startGuardianFight(guardianEvent()); return; }
        const c = spawn(kind, s.x, s.y, { tag: "f9", engaged: kind !== "cien" && kind !== "upior" });
        if (c) { c._summoned = true; popup(0, "Z ciemności wychodzi... " + (boss ? BOSSES[kind].name : KINDS[kind].name.toLowerCase()) + "!", "#ffd98f"); }
        if (c && kind === "upior") c.engage();
    }
    T.onMapUpdate(scene => {
        if (!$gamePlayer || !$gameMap) return;
        hookHunting();
        if (pending) summon();
        for (const c of creatures) if (!c._sprite || !c._sprite.parent) RoamingActor.addSprite(c);
        if (Graphics.frameCount % 300 === 0) rotDrops();
    }, { owner: PLUGIN, name: "update" });

    // ------------------------------------------------------------------
    // Engine hooks
    // ------------------------------------------------------------------
    // the creatures, their webs and the grip move with the map (inside its update: they hold still with the world in Combat.js's hitstop)
    const _Game_Map_update = Game_Map.prototype.update;
    Game_Map.prototype.update = function(sceneActive) {
        _Game_Map_update.call(this, sceneActive);
        for (const c of creatures.slice()) c.update();
        updateSwarms();
        updateWebs();
        updateGrab();
        updatePull();
        updateLift();
        updateWaves();
        updateRings();
        if (mind.confuseT > 0) mind.confuseT--;
        if (mind.fearT > 0) mind.fearT--;
    };
    // their sprites when the spriteset is (re)built; the layer of remains, webs, rings and smoke
    const _Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        _Spriteset_Map_createCharacters.call(this);
        for (const c of creatures) { c._sprite = null; c._markSprite = null; c._markHolder = null; RoamingActor.addSprite(c, this); }
        this._creaturesLayer = new Sprite_CreaturesLayer(this._tilemap);
        this._tilemap.addChild(this._creaturesLayer);
    };
    // the glows over the floors' dark: over the lower layer (RoomLighting puts its darkness there), under the pictures
    const _Spriteset_Map_createUpperLayer = Spriteset_Map.prototype.createUpperLayer;
    Spriteset_Map.prototype.createUpperLayer = function() {
        this._creatureGlow = new Sprite_CreatureGlow();
        this.addChild(this._creatureGlow);
        _Spriteset_Map_createUpperLayer.call(this);
    };
    const _Scene_Map_createSpriteset = Scene_Map.prototype.createSpriteset;
    Scene_Map.prototype.createSpriteset = function() {
        _Scene_Map_createSpriteset.call(this);
        this._mindVeil = new Sprite_MindVeil();
        this.addChild(this._mindVeil);
        this._bossBar = new Sprite_BossBar();
        this.addChild(this._bossBar);
    };
    // a creature's own look on its sprite: its size, its tone (a boss, a shadow), how see-through it is (a wraith), a drowned one sinking
    const _Sprite_Character_update = Sprite_Character.prototype.update;
    Sprite_Character.prototype.update = function() {
        _Sprite_Character_update.call(this);
        const c = this._character;
        if (!c || !c.isCreature) return;
        const sx = Math.sign(this.scale.x) || 1, rushX = Math.abs(this.scale.x) || 1, rushY = this.scale.y || 1;
        const stretch = c._mode === "charge" && c._running ? [1.06, 0.96] : [1, 1];
        let s = c._drawScale || c._scale || 1;   // (a boss with its own art: the art's own size)
        if (c._def.flying && c._mode === "dive" && c._modeT > 0) s *= 1 + 0.06 * Math.sin(c._poseT);
        const sink = c._sink || 0;
        this.scale.set(sx * s * stretch[0] * (rushX > 1.01 ? 1 : 1), s * stretch[1] * (1 - 0.6 * sink));
        if (c._mode === "wake" && c._base === "zbroja") this.x += Math.round(Math.sin(c._poseT * 1.3));
        // a small one without an end sheet of its own (a rat, a bat): it rolls over onto its back as it dies
        if (c._dying && !(LOOKS[c._look] || {}).die && c._base !== "upior" && c._base !== "cien") {
            const k = Math.min(1, (c._dyingT || 0) / 12);
            this.rotation = Math.PI * k * (c.centerX() >= heroX() ? 1 : -1);
            this.anchor.y = 0.5;
            this.y -= Math.round(this.patternHeight() * 0.25 * s);
        } else if (this.rotation && c.isCreature) { this.rotation = 0; this.anchor.y = 1; }
        const op = c._opacity !== undefined ? c._opacity : 255;
        this.opacity = c._hidden ? (c._base === "upior" && perk("mind.see") > 0 ? 46 : 0) : op;
        const tone = c._tone || null;
        if (tone) this.setColorTone(tone);
        else if (this._crTone) this.setColorTone([0, 0, 0, 0]);
        this._crTone = !!tone;
        if (c._def.flying) this.z = c._alt > 14 ? 5 : 3;
        if (c._markHolder) { c._markHolder.x = this.x; c._markHolder.y = this.y; }
    };
    // lifted by the spider's thread: drawn higher
    const _Game_Player_screenY = Game_Player.prototype.screenY;
    Game_Player.prototype.screenY = function() { return _Game_Player_screenY.call(this) - (this === $gamePlayer ? Math.round(heroLift) : 0); };
    // slowed by a web: one speed lower
    const _Game_Player_realMoveSpeed = Game_Player.prototype.realMoveSpeed;
    Game_Player.prototype.realMoveSpeed = function() {
        const s = _Game_Player_realMoveSpeed.call(this);
        return this === $gamePlayer && webbed() ? Math.max(2, s - 1) : s;
    };
    // confused: the arrows turned round (FreeMovement and the engine both read Input's direction)
    const _signX = Input._signX, _signY = Input._signY;
    Input._signX = function() { const v = _signX.call(this); return confused() ? -v : v; };
    Input._signY = function() { const v = _signY.call(this); return confused() ? -v : v; };
    // the action button by remains: searched
    const _Game_Player_triggerButtonAction = Game_Player.prototype.triggerButtonAction;
    Game_Player.prototype.triggerButtonAction = function() {
        if (Input.isTriggered("ok")) {
            const d = dropAhead();
            if (d) return searchDrop(d);
        }
        return _Game_Player_triggerButtonAction.call(this);
    };
    // the 8-way sheets come with the map
    const _Scene_Map_create = Scene_Map.prototype.create;
    Scene_Map.prototype.create = function() {
        _Scene_Map_create.call(this);
        registerLooks();
        registerWithUnderground();
    };

    // ------------------------------------------------------------------
    // API (window.Creatures)
    // ------------------------------------------------------------------
    registerWithUnderground();   // (Underground.js is above on the list: its floors know the makers before the first one is built)
    window.Creatures = T.register(PLUGIN, {
        KINDS, BOSSES, LOOKS, Game_Creature, AI, BOSS_AI, mind,
        get list() { return creatures; }, get swarms() { return swarms; }, get webs() { return webs; }, get patches() { return patches; }, get rings() { return rings; },
        get grab() { return grab; }, get pull() { return pull; }, get boss() { return bossNow; }, get pools() { return pools; }, get waves() { return waves; }, get lines() { return lines; },
        get pending() { return pending; }, set pending(v) { pending = v; },
        auto: v => { auto = !!v; }, state: S, spawn, spawnOne, populate, kindFor, clearAll,
        clear: tag => {
            for (const c of creatures.slice()) if (!tag || c._tag === tag) removeCreature(c);
            const gone = o => !o.c || o.c._dead;   // (what the removed ones left on the floor: their rings, webs, pools, shard rings)
            rings = rings.filter(o => !gone(o)); patches = patches.filter(o => !gone(o)); pools = pools.filter(o => !gone(o)); waves = waves.filter(o => !gone(o));
            webs = webs.filter(o => !o.from._dead); lines = lines.filter(o => !gone(o));
            grab = null; pull = null; heroLift = 0; webT = 0; mind.confuseT = 0; mind.fearT = 0; bossNow = null;
        },
        hit: hitCreature, die, collapse, rise, startGrab, releaseGrab, mindHit, webbed, confused, spitWeb, startTruth, startCharge, startDive,
        drops: () => dropsOf(), dropAhead, searchDrop, guardianHook, startGuardianFight, guardianEvent,
        bossBeaten: bossBeatenAt, setWeb: n => { webT = n; }, creatures: () => creatures
    });
})();
