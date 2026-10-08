//=============================================================================
// Humans.js
//=============================================================================
// The human enemies - combat stage 3 (docs/WALKA.md 4, 8, 11.3): the bandit (a club: two blows in a row, a feint, a guard), the knife
// bandit (quicker: up to three weak, cutting stabs, springs back from a blow), the archer
// (keeps his distance, aims with a line the hero sees, backs off), the mercenary (a shield that stops light blows from the front, a heavy
// blow that breaks the hero's guard, goes round to his back). They read the hero's roll, guard and parry like the animals do (Combat.js
// hitPlayer), reel when their balance goes, and under a part of their life may beg for mercy (spare, rob, or finish - the town hears of a
// beggar killed). Night camps on the roads and in the forests: a fire, men asleep and awake, a sack of loot - a sneak attack (C) works on
// the sleepers, the noise of a fight wakes them; and a band may come for the hero himself asleep outdoors (nightRaid - Farming_Build.js asks it
// as it asks Hunting.js about the wolves). Their blows never kill the hero: beaten down he is robbed. Data: Humans_Data.js.
// They are not Hunting.js's animals: their own list and their own targets (Hunting.addTargets), the 8-way looks of Hunting.LOOK8 and its
// way round what is in the way (Hunting_Path.js); Combat.js asks Combat.foes() for the bars and the roll's bump.

/*:
 * @target MZ
 * @plugindesc Ludzie-wrogowie (etap 3 walki): bandyta, nożownik, łucznik, najemnik z tarczą, nocne obozy, napady na śpiącego, poddawanie się (oszczędź / obrabuj / dobij). Bandyci nie zabijają - pobity bohater zostaje obrabowany. v1.1.0
 * @author Tawerna
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base Hunting
 * @orderAfter Hunting
 * @orderAfter Hunting_Weapons
 * @base Combat
 * @orderAfter Combat
 * @orderAfter Combat_UI
 * @base Humans_Data
 * @orderAfter Humans_Data
 *
 * @help
 * ============================================================================
 * LUDZIE - etap 3 walki (docs/WALKA.md)
 * ============================================================================
 * BANDYTA (pałka): szybki, niezbyt silny. Bije dwa razy pod rząd (drugi cios
 *   szybciej), czasem tylko markuje zamach i uderza zaraz po nim. Czasem
 *   podnosi pałkę przeciw twojemu ciosowi (garda: lekki cios traci większość
 *   siły, ciężki ją łamie).
 * NOŻOWNIK (bandyta z nożem): lżejszy i szybszy - krótki zamach, do trzech
 *   pchnięć pod rząd (każde słabe, ale tnie: rana); nie zasłania się, tylko
 *   odskakuje przed twoim ciosem. Szybciej ucieka.
 * ŁUCZNIK: trzyma się 3,5-6,5 pola od ciebie, cofa się, gdy podchodzisz.
 *   Napina łuk - widać linię, w którą celuje; na chwilę przed strzałem linia
 *   staje (krok w bok, przewrót albo tarcza). Bez strzał albo przyparty
 *   do muru odpycha cię łukiem.
 * NAJEMNIK (tarcza): najsilniejszy. Tarcza zatrzymuje lekki cios i strzałę
 *   z przodu - ciężki cios łamie mu gardę, z boku i od tyłu jej nie ma; po
 *   kilku ciosach w tarczę od razu oddaje uderzeniem tarczy. Gdy długo
 *   trzymasz gardę, obchodzi cię od tyłu. Trzy ciosy: cięcie, uderzenie
 *   tarczą (szybkie, odrzuca) i cios z góry (długi zamach, duży "!":
 *   przełamuje gardę - przewrót albo parowanie w porę).
 * Każdy ma poziom i atrybuty zależne od miejsca (notatka mapy <Poziom:N>).
 * Każdy atak: zamach ("!", poza) -> cios -> odsłonięcie. Parowanie (P tuż
 * przed ciosem) ogłusza; z umiejętnością Rozbrojenie może wytrącić broń.
 *
 * PODDANIE SIĘ: przy małym życiu człowiek może rzucić broń i klęknąć
 * ("Litości!"). Przypadkiem go nie trafisz - podejdź, a zdecydujesz: puścić
 * wolno (odejdzie; czasem odwdzięczy się plotką albo groszem; Opinia +1),
 * zabrać mu sakiewkę (ucieknie), dobić (miasteczko się dowie: Opinia -2)
 * albo zostawić. Zostawiony po chwili ucieka. Doświadczenie dostajesz za
 * pokonanie - tak samo przy każdym wyborze.
 * POBITY BOHATER: ludzie nie zabijają - gdy zbiją ci życie do zera, leżysz,
 * a oni zabierają część pieniędzy i jedzenia; budzisz się godzinę później,
 * ranny. (Zwierzęta zabijają jak dotąd.)
 * ŁUP: zabity leży na ziemi - przeszukasz go przyciskiem akcji (pieniądze,
 * chleb, lina, strzały, czasem jego broń). Ciało znika po dobie.
 *
 * NOCNE OBOZY: na drogach i w lasach (Leśna droga, Polna droga, Skraj lasu,
 * Las, Wzgórza, Mroczny Las, łąki) czasem nocą (21-5) płonie ognisko: 2-4
 * bandytów (czasem łucznik, później najemnik), część śpi, jeden-dwóch
 * czuwa przy ogniu; obok worek z łupem. Śpiący słyszą tylko z bliska -
 * skradaj się (C): atak z ukrycia na śpiącego zbija mu równowagę; hałas
 * walki budzi resztę. Worek można ukraść po cichu. Nie w pierwsze 3 dni, nie
 * w miasteczku ani na polu dziadka; rozbity obóz nie wraca przez 2 dni.
 * O świcie obóz się zwija. Od 5. dnia w obozie bywa też nożownik.
 * NAPAD NA ŚPIĄCEGO: kto śpi pod gołym niebem (namiot, legowisko) tam, gdzie
 * bywają obozy, może się obudzić z bandytami tuż obok (23-4; jak wilki, ale
 * rzadziej: ok. 10% na noc od 15. dnia, mniej przez pierwsze dni; ognisko
 * przy posłaniu widać z daleka - częściej; obóz na tej mapie - dużo
 * częściej). Pies szczeka wcześniej. Nigdy w chacie ani w miasteczku.
 * Notatka mapy <Raid:0.02> (szansa na godzinę) albo <Raid:off>.
 * Notatka mapy: <Camp:0.3> (szansa na noc) albo
 * <Camp:off>; <Ambush:0.03> - zasadzki na drodze za dnia (szansa na godzinę,
 * domyślnie wyłączone); <Humans:off> - żadnych ludzi-wrogów sami z siebie.
 *
 * F9 (Zdarzenia): "Bandyta w pobliżu", "Nożownik w pobliżu", "Łucznik
 * w pobliżu", "Najemnik w pobliżu", "Zasadzka (3)", "Obóz bandytów (noc)",
 * "Napad na śpiącego".
 *
 * DLA QUESTÓW (window.Humans, Tawerna.api("Humans")):
 *   Humans.spawn(kind, x, y, opts) -> człowiek; kind: "bandit" | "knifer" |
 *     "archer" | "mercenary"; opts: { level, tag, engaged (od razu walczy), mode ("idle",
 *     "sit", "sleep", "roam"), band (wspólna grupa), name (nad paskiem), noSurrender,
 *     lethal (jego ciosy mogą zabić), gold, loot [[id, n]] (zamiast losowego),
 *     look (inny wygląd, np. "Merc"), say (okrzyk na start) }
 *   Humans.ambush(kinds, opts) -> grupa ludzi 7-10 pól od bohatera, od razu
 *     w walce, z okrzykiem; opts jak wyżej + { far: [od, do], shout }
 *   Humans.camp(opts) -> obóz tej nocy na tej mapie (opts: { size, kinds, near })
 *   Humans.list(), Humans.band(tag), Humans.clear(tag)
 *   Humans.setFoe(człowiek, sojusznik | null) - walczy z sojusznikiem
 *     bohatera (Act3.js: obrońcy tawerny) zamiast z bohaterem; łucznik nie
 *   Humans.march(człowiek, x, y) - idzie na miejsce (jego "dom"), walczy
 *     z tym, kogo spotka, i tam wraca; Humans.remove(człowiek) - znika
 *     z mapy (przeszedł przez drzwi), bez ciała
 *   Humans.nightRaid(od, do, { fire }) -> godzina napadu (dzień*24+godzina)
 *     albo null; Humans.raidBand(piesSzczekał, opts) -> grupa napastników
 * SZYNA (Tawerna.on): humanSurrender { kind, tag, level, x, y },
 *   humanDefeated { kind, how: "killed" | "spared" | "robbed" | "fled",
 *   begged, tag, level, x, y }, humansDone { tag, killed, spared, robbed,
 *   fled } (cała grupa), heroRobbed { tag, gold, items }, campCleared
 *   { mapId }, humansRaid { tag, n, dog }; i jak u zwierząt kill { kind, human: true, ... }.
 * Zdarzenia (id) - żadnych: ludzie, ogniska, worki i ciała to postacie
 * i obrazki wtyczki, nie zdarzenia mapy.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Humans.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const D = window.HumansData;
    if (!D) throw new Error("Humans.js: brak Humans_Data.js - musi stać nad Humans.js na liście wtyczek");
    const PLUGIN = "Humans";
    const KINDS = D.KINDS, BAND = D.BAND, CAMP = D.CAMP, AMBUSH = D.AMBUSH, LINES = D.LINES, RAID = D.RAID || null;

    const H = () => T.api("Hunting");
    const HP = () => { const p = T.api("Hunting_parts"); return p && p.path; };   // the way round what is in the way (Hunting_Path.js)
    const C = () => T.api("Combat");
    const se = (name, volume, pitch, pan) => T.audio.se(name, { volume, pitch, pan: pan || 0 });
    const popup = (icon, text, color) => T.popup(text, { icon, color, menu: true });
    const say = (ch, text, frames) => T.call("SpeechBubbles", "say", ch, text, frames);
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const perk = key => T.call("Combat", "perk", key) || 0;
    const hour = () => T.time.hour();
    const day = () => T.time.day();
    const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const STEP = { 1: [-1, 1], 2: [0, 1], 3: [1, 1], 4: [-1, 0], 6: [1, 0], 7: [-1, -1], 8: [0, -1], 9: [1, -1] };
    const OCT = { 0: 6, 1: 3, 2: 2, 3: 1, 4: 4, "-4": 4, "-3": 7, "-2": 8, "-1": 9 };   // octant of (dx, dy) (y down) -> numpad
    const octOf = (dx, dy) => OCT[Math.round(Math.atan2(dy, dx) / (Math.PI / 4))] || 2;
    const DIR4 = (dx, dy) => (Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 4 : 6) : (dy < 0 ? 8 : 2));
    const heroX = () => $gamePlayer._realX + 0.5, heroY = () => $gamePlayer._realY + 0.5;
    const panOf = x => Math.max(-80, Math.min(80, Math.round((x - heroX()) * 12)));
    const onScreen = ch => { const x = ch.screenX(), y = ch.screenY(), m = $gameMap.tileWidth(); return x > -m && x < Graphics.width + m && y > -m && y < Graphics.height + 2 * m; };
    const toHero = h => [heroX() - h.centerX(), heroY() - h.centerY()];
    // (2026-10-06, Act3.js) a man may fight someone other than the hero - h._foe, an ally of his (Act3's defenders of the tavern):
    // { centerX(), centerY(), _x, _y, _realX, _realY, takeHit({ damage, poise, from, heavy, knock, wound, name }) -> "hit" | "block" |
    // "miss", isDown() }. While he has one he goes for it, faces it and his blows land on it (Humans.setFoe); without one - the hero,
    // as always. A kneeling, dead or fleeing man, or a foe that is down, has none
    function foeOf(h) {
        const f = h._foe;
        if (!f) return null;
        if (h._dead || h._surrendered || h._fleeing || (typeof f.isDown === "function" && f.isDown())) { h._foe = null; return null; }
        return f;
    }
    const toTgt = h => { const f = foeOf(h); return f ? [f.centerX() - h.centerX(), f.centerY() - h.centerY()] : toHero(h); };
    const tgtTile = h => { const f = foeOf(h); return f ? [f._x, f._y] : [$gamePlayer.x, $gamePlayer.y]; };
    // the hero faces him (within the cosine `cos` of his facing - HeroLook's 8-way one)
    function heroFaces(h, cos) {
        const Hn = H(), [fx, fy] = Hn && Hn.facingVector ? Hn.facingVector() : [0, 1], dx = h.centerX() - heroX(), dy = h.centerY() - heroY(), d = Math.hypot(dx, dy) || 1;
        return (dx * fx + dy * fy) / d > cos;
    }
    const SETTLE = 14;   // frames the blow's follow-through is shown after it (the opening's first frames)

    // ------------------------------------------------------------------
    // Saved state (TawernaCore): _tw.humans - the camps per map (this night's, who of them is still about), the drops per map (the bodies,
    // the dropped weapons, the camps' sacks: what can still be taken), the day a camp was last cleared on a map, the tallies
    // ------------------------------------------------------------------
    const state = T.state.define("humans", () => ({ camps: {}, drops: {}, cleared: {}, killed: 0, spared: 0, robbed: 0, begged: 0, beaten: 0, opinionDay: {}, rumours: [] }),
        { version: 1, owner: PLUGIN });
    const S = () => state();
    const dropsOf = mapId => { const s = S(), id = mapId || $gameMap.mapId(); return s.drops[id] || (s.drops[id] = []); };
    const clockNow = () => day() * 24 + hour();

    // ------------------------------------------------------------------
    // The looks: the 8-way sheets (Hunting.js LOOK8) - walking (and running from runAt), the blows (_Atk, 96 px cells: the weapon reaches
    // out), the mercenary's shield (_Guard), on his knees (_Kneel), crouched by the fire (_Crouch), lying (_Lie). Each has its 4-way
    // $Human_* sheet for a game with the 8-way looks off.
    // ------------------------------------------------------------------
    // the frames of a blow sheet (_Atk8, 13 cells: the reference stance, then PixelLab's 12): raise - the weapon drawn back (the archer: the
    // bow fully drawn, held while he aims), hit - the frame the blow lands on (the arrow leaves), guard - the bandit's club held up
    // (the knife: a short stab - drawn back by cell 4, in on 7)
    const LOOKS = { Bandit: { anim: { raise: 5, hit: 7, guard: 3 } }, Knife: { anim: { raise: 4, hit: 7, guard: 3 } }, Archer: { anim: { raise: 5, hit: 7, guard: 2 } },
        Merc: { anim: { raise: 5, hit: 7, guard: 3 } } };
    const sheetName = (look, part) => "$Human_" + look + (part ? "_" + part : "");
    function registerLooks() {
        const L = H() && H().LOOK8;
        if (!L) return;
        for (const k of Object.keys(KINDS)) {
            const look = KINDS[k].look;
            if (L[sheetName(look)]) continue;
            // (the run from runAt, and while he flees - a kind that never goes that fast, the mercenary in his mail, only walks)
            const run = KINDS[k].chase >= KINDS[k].runAt ? { sheet: "anim8/" + look + "_Run8", cell: 64, stride: 2.8, turn: 2 } : null;
            L[sheetName(look)] = Object.assign({ sheet: "anim8/" + look + "_Walk8", cell: 64, stride: 1.7, turn: 2, runAt: KINDS[k].runAt }, run ? { run } : {});
            L[sheetName(look, "Atk")] = { sheet: "anim8/" + look + "_Atk8", cell: 96, pose: true };
            L[sheetName(look, "Kneel")] = { sheet: "anim8/" + look + "_Kneel8", cell: 96, pose: true };   // (96: the weapon he let fall lies beside him)
            L[sheetName(look, "Crouch")] = { sheet: "anim8/" + look + "_Crouch8", cell: 96, pose: true };   // (sitting by the fire, the weapon across his lap)
            L[sheetName(look, "Lie")] = { sheet: "anim8/" + look + "_Lie8", cell: 64, pose: true };
            if (look === "Merc") L[sheetName(look, "Guard")] = { sheet: "anim8/" + look + "_Guard8", cell: 96, pose: true };
        }
    }
    registerLooks();

    // ==================================================================
    // Game_Human: a character that thinks for itself (not an event: its own list, like the animals)
    // ==================================================================
    let humans = [];   // the live ones on this map
    let bands = [];
    let seq = 0;
    function Game_Human() {
        this.initialize(...arguments);
    }
    Game_Human.prototype = Object.create(Game_Character.prototype);
    Game_Human.prototype.constructor = Game_Human;

    Game_Human.prototype.initialize = function(kind, x, y, opts) {
        Game_Character.prototype.initialize.call(this);
        opts = opts || {};
        const k = KINDS[kind];
        this._kind = kind;
        this._def = k;
        this._hid = ++seq;
        this._look = opts.look || k.look;
        const Cb = C(), place = Cb && Cb.placeLevel ? Cb.placeLevel() : 1;
        const lv = Math.max(1, Math.round(opts.level || place + (k.lv || 0) + (Math.random() < 0.3 ? 1 : 0)));
        this._level = lv;
        this._attr = {};
        for (const a of ["str", "dex", "con", "per", "wil"]) this._attr[a] = Math.round(k.attr.base[a] + k.attr.grow[a] * (lv - 1));
        this._maxHp = Math.round(k.hp * (1 + 0.12 * (lv - 1)) + 4 * (this._attr.con - 5));
        this._hp = this._maxHp;
        this._maxPoise = Math.round(k.poise * (1 + 0.08 * (lv - 1)) + 2 * (this._attr.con - 5));
        this._poise = this._maxPoise;
        this._poiseT = 0;
        this._stun = 0;
        this._flashT = 0;
        this._engaged = false;
        this._aware = 0;
        this._alarm = 0;
        this._gapT = 0;
        this._dead = false;
        this._frozen = false;
        this._fleeing = false;
        this._surrendered = false;
        this._disarmed = false;
        this._gold = opts.gold !== undefined ? opts.gold : rnd(k.gold[0], k.gold[1]);
        this._loot = opts.loot ? opts.loot.map(l => l.slice()) : rollLoot(k.loot);
        this._arrows = k.shot ? rnd(k.shot.arrows[0], k.shot.arrows[1]) : 0;
        this._tag = opts.tag || "";
        this._lethal = !!opts.lethal;
        this._noSurrender = !!opts.noSurrender;
        this._label = opts.name || "";
        this._home = { x, y };
        this._faceAng = Math.PI / 2;
        this._f8 = 0;
        this._poseT = 0;
        this._settle = 0;
        this._blocks = [];
        this.setImage(sheetName(this._look), 0);
        this.setPosition(x, y);
        this.setDirection(2);
        this.setMoveSpeed(k.speed);
        this.setMoveFrequency(5);
        this.setWalkAnime(true);
        this.setStepAnime(false);
        this.setThrough(false);
        this.setPriorityType(1);
        this.setMode(opts.mode || "idle");
    };
    const rollLoot = list => (list || []).filter(([, p]) => Math.random() < p).map(([id, , n]) => [id, Math.max(1, rnd(1, n || 1))]);
    // the duck type the fight asks (Combat.js, Hunting_Weapons.js: a living target with life, balance and awareness - the blow from hiding,
    // the white flash, the stars of a reeling one)
    Game_Human.prototype.isAnimal = function() { return true; };
    Game_Human.prototype.isHuman = function() { return true; };
    Game_Human.prototype.kind = function() { return this._kind; };
    Game_Human.prototype.centerX = function() { return this._realX + 0.5; };
    Game_Human.prototype.centerY = function() { return this._realY + 0.5; };
    Game_Human.prototype.playerDistance = function() { return Math.hypot(this.centerX() - heroX(), this.centerY() - heroY()); };
    // the distance to the one he fights: his foe (Act3's defender) or the hero
    Game_Human.prototype.tgtDistance = function() { const [x, y] = toTgt(this); return Math.hypot(x, y); };
    Game_Human.prototype.name = function() { return this._label || this._def.name; };
    // keeps out of buildings (as the animals do)
    Game_Human.prototype.isMapPassable = function(x, y, d) {
        const F = T.api("Farming");
        if (F && F.buildingAt($gameMap.roundXWithDirection(x, d), $gameMap.roundYWithDirection(y, d))) return false;
        return Game_Character.prototype.isMapPassable.call(this, x, y, d);
    };
    // what an attribute gives: Siła the blows, Zręczność the wind-ups (shorter), Czujność the eyes
    Game_Human.prototype.strK = function() { return (1 + 0.035 * (this._attr.str - 5)) * (1 + 0.1 * (this._level - 1)); };
    Game_Human.prototype.dexK = function() { return Math.max(0.75, 1 - 0.012 * (this._attr.dex - 5)); };
    Game_Human.prototype.sight = function() { return this._def.sight * (1 + 0.03 * (this._attr.per - 5)); };
    Game_Human.prototype.mercy = function() { return this._def.mercy && !this._lethal; };
    // what his body does to the hero who rolls into him (Combat.js rollBump)
    Game_Human.prototype.bumpAtk = function() {
        return this._engaged && !this._surrendered && !this._dead && this._stun <= 0 ? Math.round(this._def.blow.dmg * this.strK() * 0.5) : 0;
    };

    // ---- the modes. sleep / sit / idle / roam (calm), wake, alert, chase, circle, windup -> strike -> recover, feint, guard, draw ->
    // loose -> reload, backoff, flank, surrender, flee, leave, gloat (the hero beaten). The picture: updateSheet
    Game_Human.prototype.setMode = function(mode, frames) {
        const k = this._def;
        this._mode = mode;
        this._modeT = frames || 0;
        this._modeLen = this._modeT;
        this._fleeing = mode === "flee";
        const fast = mode === "chase" || mode === "flee" || mode === "backoff" || mode === "flank";
        this.setMoveSpeed(fast ? k.chase : mode === "leave" ? k.speed - 0.2 : k.speed);
        // (planting his feet for a blow or a shot: the step he is in is finished at once, not glided on under a still pose)
        if (mode === "windup" || mode === "draw" || mode === "guard") this.setMoveSpeed(5);
        this.updateSheet();
    };
    Game_Human.prototype.sheetPart = function() {
        const m = this._mode, merc = this._look === "Merc" || !!(LOOKS[this._look] && LOOKS[this._look].shield);   // (a look of its own with a shield sheet - Act3's captain)
        if (m === "windup" || m === "strike" || m === "feint") return merc && this._blow === "bash" ? "Guard" : "Atk";
        if (m === "recover" && this._settle > 0) return merc && this._blow === "bash" ? "Guard" : "Atk";
        if (m === "draw" || m === "loose") return "Atk";
        if (m === "guard") return merc ? "Guard" : "Atk";
        if (merc && this._engaged && (m === "chase" || m === "circle" || m === "flank") && !this.isMoving() && this._shieldUp()) return "Guard";
        if (m === "surrender") return "Kneel";
        if (m === "sit") return "Crouch";
        if (m === "sleep") return "Lie";
        return "";
    };
    Game_Human.prototype.updateSheet = function() {
        const name = sheetName(this._look, this.sheetPart());
        if (this.characterName() !== name) { this.setImage(name, 0); this._poseT = 0; }
    };
    // the frame of a pose sheet (Hunting.js LOOK8 asks it; cells: how many it has)
    Game_Human.prototype.look8Col = function(cells, look) {
        const last = cells - 1, A = LOOKS[this._look].anim, raise = Math.min(last, A.raise), hit = Math.min(last, A.hit), after = Math.min(last, hit + 2);
        const len = Math.max(1, this._modeLen || 1), el = len - Math.max(0, this._modeT), gone = Math.min(1, el / len), part = this.sheetPart();
        if (part === "Lie") return 0;
        if (part === "Kneel") return this._poseT < last * 4 ? Math.floor(this._poseT / 4) : last - (Math.floor(this._poseT / 40) % 2);   // down on his knees, the hands up - pleading
        if (part === "Crouch") return Math.min(last, Math.floor(this._poseT / 5));
        if (part === "Guard") {   // the shield raised (the bash: raised, then thrown forward - lungeOffset)
            if (this._mode === "windup") return Math.round(easeInOut(gone) * last);
            return Math.min(last, Math.floor(this._poseT / 3));
        }
        const b = this.blowDef();
        switch (this._mode) {
            case "windup": return Math.round(easeInOut(gone) * raise);
            case "feint": return Math.round((1 - easeInOut(gone)) * raise);
            case "strike": {
                const at = Math.max(1, b ? b.hitAt : 3);
                if (el <= at) return raise + Math.round((el / at) * (hit - raise));
                return hit + Math.round(Math.min(1, (el - at) / Math.max(1, len - at)) * (after - hit));
            }
            case "recover": return after + Math.round((1 - this._settle / SETTLE) * (last - after));
            case "guard": return Math.min(last, A.guard);
            case "draw": return Math.round(Math.min(1, el / Math.max(1, len * 0.55)) * raise);
            case "loose": return Math.min(last, raise + 1 + Math.round(gone * (last - raise - 1)));
        }
        return 0;
    };
    // the 8-way facing a pose (and a standing fighter) shows: towards the hero (his guard turns at the kind's pace), the fire when calm
    Game_Human.prototype.face8 = function() {
        if (this._mode === "sit" || this._mode === "sleep") return this._seatF8 || 0;
        if (this._engaged || this._mode === "surrender" || this._mode === "alert" || this._mode === "gloat" || this.sheetPart()) {
            const a = this._lockAng !== null && this._lockAng !== undefined ? this._lockAng : this._faceAng;
            return octOf(Math.cos(a), Math.sin(a));
        }
        return 0;
    };
    // the body thrown into the blow (the sprite pushed the locked way, back again after it)
    Game_Human.prototype.lungeOffset = function() {
        if (!this._lock || (this._mode !== "strike" && this._mode !== "windup")) return null;
        const len = Math.max(1, this._modeLen || 1), el = len - Math.max(0, this._modeT), b = this.blowDef(), at = Math.max(1, b ? b.hitAt : 3);
        const far = this._blow === "bash" ? 12 : this._blow === "heavy" ? 9 : 6;
        let k = 0;
        if (this._mode === "windup") k = -2 * easeInOut(el / len);
        else k = el <= at ? -2 + (far + 2) * easeInOut(el / at) : far * (1 - easeInOut(Math.min(1, (el - at) / Math.max(1, len - at))));
        return [Math.round(this._lock[0] * k), Math.round(this._lock[1] * k * 0.7)];
    };

    // ---- moving: a step of the 8 ways (not onto another man), a walk round what is in the way (Hunting_Path.js)
    Game_Human.prototype.stepTo = function(d) {
        if (!d) return false;
        const [ox, oy] = STEP[d], nx = this._x + ox, ny = this._y + oy;
        if (humans.some(o => o !== this && !o._dead && o._x === nx && o._y === ny)) return false;
        return HP().takeStep(this, d);
    };
    Game_Human.prototype.walkTo = function(tx, ty, key, near) {
        const P = HP(), r = P.path8(this, tx, ty, { animal: true, key, near: near || 0 });
        const went = this.stepTo(r.dir);
        if (P.stalled(this, key, Math.hypot(this._x - tx, this._y - ty), (near || 0) + 0.5, tx, ty)) P.unstall(this);
        return went;
    };
    Game_Human.prototype.faceHero = function() {   // (his foe, when he has one - toTgt)
        const [hx, hy] = toTgt(this);
        this.setDirection(DIR4(hx, hy));
    };
    // a straight run at the hero (no tree, rock, building, wall between): for a blow, a shot (at his foe, when he has one)
    Game_Human.prototype.clearRun = function() {
        const [tx, ty] = tgtTile(this);
        return HP().clearLine(HP().pathGrid(), this._x, this._y, tx, ty, true);
    };

    // ==================================================================
    // A frame
    // ==================================================================
    Game_Human.prototype.update = function() {
        Game_Character.prototype.update.call(this);
        this._poseT++;
        if (this._flashT > 0) this._flashT--;
        if (this._alarm > 0) this._alarm--;
        if (this._offerCd > 0 && this._offerCd < 99999) this._offerCd--;
        if (this._offerAway && this.playerDistance() > 3) this._offerAway = false;
        if (++this._poiseT > 120 && this._poise < this._maxPoise && !this._dead) this._poise = Math.min(this._maxPoise, this._poise + this._maxPoise / 90);
        if (this._dead) return;
        this.updateSenses();
        this.updateMarks();
        if (this._frozen) return;
        if (this._hitStop > 0) { this._hitStop--; return; }
        if (this._stun > 0) {
            this._lockAng = null;
            if (this.sheetPart()) { this._mode = "chase"; this.updateSheet(); }   // (reeling: on his feet, the stars over his head - Combat_UI.js)
            if (--this._stun === 0) this.afterStun();
            return;
        }
        if (this._modeT > 0) this._modeT--;
        if (this._gapT > 0) this._gapT--;
        if (this._settle > 0) this._settle--;
        this.turnGuard();
        this.think();
        this.updateSheet();
    };
    // the way he faces (his guard): towards the hero, at the kind's pace (a slow one can be got behind); a blow's way is locked
    Game_Human.prototype.turnGuard = function() {
        if (!this._engaged && this._mode !== "alert" && this._mode !== "surrender" && this._mode !== "gloat") return;
        if (this._mode === "windup" || this._mode === "strike" || this._mode === "feint") return;
        const [hx, hy] = toTgt(this), want = Math.atan2(hy, hx);
        let d = want - this._faceAng;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        const step = this._def.turn * (this._mode === "draw" ? 0.6 : 1);
        this._faceAng += Math.max(-step, Math.min(step, d));
        if (!this.isMoving()) this.setDirection(DIR4(Math.cos(this._faceAng), Math.sin(this._faceAng)));
    };
    // the hero in front of his guard (the mercenary's shield, the bandit's raised club)
    Game_Human.prototype.heroInFront = function(cos) {
        const [hx, hy] = toHero(this), d = Math.hypot(hx, hy) || 1;
        return (hx * Math.cos(this._faceAng) + hy * Math.sin(this._faceAng)) / d > (cos === undefined ? 0.3 : cos);
    };
    // the same for a blow from (x, y) - not the hero's (an ally's: Act3.js's defenders hit through Humans.hit with extra.from)
    Game_Human.prototype.inFrontOf = function(x, y, cos) {
        const hx = x - this.centerX(), hy = y - this.centerY(), d = Math.hypot(hx, hy) || 1;
        return (hx * Math.cos(this._faceAng) + hy * Math.sin(this._faceAng)) / d > (cos === undefined ? 0.3 : cos);
    };
    // his eyes and ears: the awareness meter of the animals (Hunting.noticeRate - cover, sneaking, the dark); asleep he only hears
    // what is right beside him, by the fire he looks into the flames
    Game_Human.prototype.updateSenses = function() {
        if (this._engaged || this._surrendered || this._mode === "flee" || this._mode === "leave" || this._mode === "gloat") return;
        const Hn = H();
        if (!Hn || !Hn.updateAwareness) return;
        const k = this._mode === "sleep" ? 0.22 : this._mode === "sit" ? 0.75 : 1;
        Hn.updateAwareness(this, this.centerX(), this.centerY(), this.sight() * k);
    };
    // "?" / "!" over his head (Hunting.updateMark), "!" while he winds up or aims; a "z" over a sleeper
    Game_Human.prototype.updateMarks = function() {
        const sp = this._sprite, Hn = H();
        if (!sp || !sp.bitmap || !sp.bitmap.isReady() || !Hn) return;
        const m = this._mode, tele = m === "windup" || m === "draw" || m === "feint" || m === "wake";
        const calm = m === "sleep" || m === "sit" || m === "idle" || m === "roam" || m === "alert";
        const lying = m === "sleep" || m === "surrender";
        Hn.updateMark(this, sp, lying ? -40 : -68, this._stun > 0 || this._surrendered ? 0 : tele ? 1 : calm ? (m === "alert" ? Math.max(0.35, this._aware) : this._aware) : 0);
        updateZzz(this, sp, m === "sleep" && this._aware < 0.3);
    };

    // ---- the brain
    Game_Human.prototype.think = function() {
        const m = this._mode;
        if (m === "sleep" || m === "sit" || m === "idle" || m === "roam") return this.thinkCalm();
        if (m === "wake") { if (this._modeT <= 0) this.engage(); return; }
        if (m === "alert") return this.thinkAlert();
        if (m === "surrender") return this.thinkSurrender();
        if (m === "flee" || m === "leave") return this.thinkLeave();
        if (m === "gloat") { this.faceHero(); return; }
        if (m === "return") return this.thinkReturn();
        return this.thinkFight();
    };
    Game_Human.prototype.thinkCalm = function() {
        const band = this._band;
        if (band && band.engaged && !this._engaged) { this.wakeUp(rnd(10, 50)); return; }
        if (this._aware >= 1 || (this._alarm > 0 && this._mode !== "sleep")) { this.notice(); return; }
        if (this._alarm > 0 && this._mode === "sleep") { this._wasAsleep = true; this.setMode("alert", 50); this._aware = Math.max(this._aware, 0.45); return; }
        if (this._aware >= 0.3 && this._mode !== "sleep") { if (this._mode !== "sit") { this.setMode("alert", 60); } return; }
        // a camp's talk: one by the fire mumbles now and then while the hero is near and unseen
        if (this._mode === "sit" && !this.isMoving() && --this._chatT <= 0) {
            this._chatT = rnd(480, 900);
            if (this.playerDistance() < 7 && onScreen(this)) say(this, pick(LINES.camp), 200);
        }
        if (this._mode === "roam") this.wanderNearHome();
    };
    Game_Human.prototype.wanderNearHome = function() {
        if (this.isMoving()) return;
        if (this._wait > 0) { this._wait--; return; }
        const h = this._home, far = Math.hypot(this._x - h.x, this._y - h.y) > 3;
        if (far) this.walkTo(h.x, h.y, "home", 1);
        else {
            const dirs = [2, 4, 6, 8, 1, 3, 7, 9].filter(d => RoamingActor.canStep(this, this._x, this._y, d));
            if (dirs.length && Math.random() < 0.6) this.stepTo(pick(dirs));
        }
        this._wait = rnd(60, 200);
    };
    // he heard something and looks round ("?"); sure - he calls the others and comes
    Game_Human.prototype.thinkAlert = function() {
        if (this._band && this._band.engaged) { this.engage(); return; }
        if (this._aware >= 1) { this.notice(); return; }
        if (this._modeT <= 0 && this._aware < 0.3) this.setMode(this._seat ? (this._wasAsleep ? "sleep" : "sit") : "idle");
    };
    // sure it is someone: a shout, and the band is after him
    Game_Human.prototype.notice = function() {
        if (this._mode === "sleep") { this.wakeUp(24); return; }
        this.engage(true);
    };
    Game_Human.prototype.wakeUp = function(frames) {
        if (this._engaged || this._mode === "wake") return;
        this._wasAsleep = this._mode === "sleep";
        const roused = this._mode === "sleep" || this._mode === "sit";
        this.setMode("wake", frames || 30);
        if (roused && this._band && !this._band.woke) { this._band.woke = true; say(this, pick(LINES.wake)); }
    };
    Game_Human.prototype.engage = function(shout) {
        if (this._engaged || this._surrendered || this._dead) return;
        this._engaged = true;
        this._aware = 1;
        this._seatLeft = true;
        if (this._campRef) this._campRef.alert = true;   // (a camp that fought: awake when the hero comes back)
        const band = this._band;
        if (band) {
            if (!band.engaged) {
                band.engaged = true;
                band.gapT = 50;
                if (shout !== false && !band.shouted) { band.shouted = true; say(this, pick(band.ambush ? LINES.ambush : LINES.engage)); }
            }
            for (const m of band.members) if (m !== this && !m._engaged && !m._dead && !m._surrendered) m.wakeUp(m._mode === "sleep" ? rnd(20, 70) : rnd(4, 20));
        }
        const [hx, hy] = toTgt(this);
        this._faceAng = Math.atan2(hy, hx);
        this.setMode("chase");
        this._gapT = rnd(20, 50);
    };
    // after a fight that went away from him: back to his place (a camp: awake by the fire)
    Game_Human.prototype.disengage = function() {
        this._engaged = false;
        this._aware = 0.5;
        this.setMode("return");
    };
    Game_Human.prototype.thinkReturn = function() {
        if (this._aware >= 1) { this.engage(false); return; }
        const h = this._seat || this._home;
        if (Math.hypot(this._x - h.x, this._y - h.y) <= 0.5 || (this._returnT = (this._returnT || 0) + 1) > 900) {
            this._returnT = 0;
            this.setMode(this._seat ? "sit" : "idle");
            return;
        }
        if (!this.isMoving()) this.walkTo(h.x, h.y, "back", 0);
    };
    // reeling no more: back into the fight
    Game_Human.prototype.afterStun = function() {
        this._poise = this._maxPoise;
        this._guardBroken = false;
        if (this._surrendered || this._dead) return;
        if (!this._engaged) this.engage(false);
        else { this.setMode("chase"); this._gapT = Math.max(this._gapT, 16); }
    };

    // ==================================================================
    // The fight
    // ==================================================================
    Game_Human.prototype.blowDef = function(name) {
        const n = name || this._blow || "main", k = this._def;
        return n === "bash" ? k.bash : n === "heavy" ? k.heavy : k.blow;
    };
    // the band's turn: one blow at a time (the archer shoots on his own)
    // (a man with his own foe - Act3's defender - fights it on his own: no turn of the band's taken or waited for)
    const myTurn = h => !!foeOf(h) || !h._band || !h._band.attacker || h._band.attacker === h;
    const takeTurn = h => { if (h._band && !foeOf(h)) h._band.attacker = h; };
    function endTurn(h) {
        const b = h._band;
        if (b && b.attacker === h) { b.attacker = null; b.gapT = rnd(BAND.gap[0], BAND.gap[1]); }
    }
    Game_Human.prototype.thinkFight = function() {
        const dist = this.tgtDistance(), band = this._band;
        // lost him: too far, or too far from home - back
        if (dist > BAND.lose || Math.hypot(this._x - this._home.x, this._y - this._home.y) > BAND.leash) {
            if (!band || band.members.every(m => m._dead || m._surrendered || m.playerDistance() > BAND.lose * 0.8)) {
                endTurn(this);
                if (band) { band.engaged = false; band.shouted = false; }
                this.disengage();
                return;
            }
        }
        if (this.thinkBlow(dist)) return;
        if (this._kind === "archer") return this.thinkArcher(dist);
        if (this._kind === "mercenary") return this.thinkMerc(dist);
        return this.thinkBandit(dist);
    };
    // a blow under way (the wind-up, the feint, the strike, the opening after it, a guard): true while it lasts
    Game_Human.prototype.thinkBlow = function(dist) {
        const m = this._mode;
        if (m === "windup") {
            if (this._feint && this._modeLen - this._modeT >= this._modeLen * 0.6) {   // (only a feint: he pulls the blow back)
                this._feint = false;
                this.setMode("feint", 11);
                return true;
            }
            if (this._modeT <= 0) {
                this.setMode("strike", this.blowDef().strike);
                this._struck = false;
                se(this._blow === "heavy" ? "Wind7" : "Wind7", 70, this._blow === "heavy" ? 70 : 105 + rnd(0, 12), panOf(this.centerX()));
            }
            return true;
        }
        if (m === "feint") {
            if (this._modeT <= 0) this.startBlow("main", true);   // and now for real - a quick one
            return true;
        }
        if (m === "strike") {
            const b = this.blowDef();
            if (!this._struck && this._modeLen - this._modeT >= b.hitAt) {
                this._struck = true;
                this.blowLand(b);
                if (this._mode !== "strike") return true;   // (the blow beat him down: they stand over him now - gloat)
            }
            if (this._modeT <= 0) {
                // (another blow at once: the club's second, the knife's second and third - `chain` blows at most)
                const again = this._blow === "main" && (this._combo || 0) < (b.chain || 2) - 1 && (b.combo || 0) > 0 && !this._parried && dist <= b.reach + 0.8 && Math.random() < b.combo;
                if (again) { this.startBlow("main", true); return true; }
                this._lockAng = null;
                this.setMode("recover", b.recover);
                this._settle = SETTLE;
                endTurn(this);
            }
            return true;
        }
        if (m === "recover") {
            if (this._modeT <= 0) { this.setMode("chase"); this._gapT = rnd(10, 30); }
            return true;
        }
        if (m === "guard") {
            this.faceHero();
            if (this._modeT <= 0) { this.setMode("chase"); this._gapT = Math.max(this._gapT, 10); }
            return true;
        }
        return false;
    };
    // a blow: the way to the hero is locked now (a step back, a roll - and it goes into the air), the "!" and the drawn-back weapon
    Game_Human.prototype.startBlow = function(name, quick) {
        const b = this.blowDef(name), [hx, hy] = toTgt(this), d = Math.hypot(hx, hy) || 1;
        this._blow = name;
        this._combo = quick ? (this._combo || 0) + 1 : 0;
        this._lock = [hx / d, hy / d];
        this._lockAng = Math.atan2(hy, hx);
        this._faceAng = this._lockAng;
        this._parried = false;
        this.setDirection(DIR4(hx, hy));
        const frames = Math.round((quick && b.windup2 ? b.windup2 : b.windup) * this.dexK());
        this.setMode("windup", frames);
        this._feint = !quick && name === "main" && !!this._def.feint && Math.random() < this._def.feint;
        takeTurn(this);
        if (name === "heavy") { se("Equip1", 80, 60, panOf(this.centerX())); T.call("Combat", "sparksAt", this.centerX() + this._lock[0] * 0.2, this.centerY() - 1.1, "#fff2b0", 6); }
        else se("Equip2", 45, 120, panOf(this.centerX()));
    };
    // the blow lands (its frame): the hero within its reach and in its cone (the locked way) takes it - his roll, guard or parry decide
    Game_Human.prototype.blowLand = function(b) {
        const foe = foeOf(this), [hx, hy] = toTgt(this), d = Math.hypot(hx, hy), [lx, ly] = this._lock || [0, 1], Cb = C();
        if (d > b.reach || (d > 0.3 && (hx * lx + hy * ly) / d < b.cone)) return false;   // (out of reach, or beside it: through the air)
        if (foe) {   // (his foe - Act3's defender - takes it: its own guard, its own life)
            const res = foe.takeHit({ damage: Math.max(1, Math.round(b.dmg * this.strK() * (this._disarmed ? 0.45 : 1))), poise: Math.round(b.poise * (1 + 0.03 * (this._attr.str - 5))),
                from: this, heavy: this._blow === "heavy", knock: b.knock, wound: b.wound, name: this._def.name.toLowerCase() });
            if (res === "hit") { this._hitStop = 2; se(this._blow === "bash" ? "Blow3" : "Blow1", 70, 90, panOf(this.centerX())); }
            return true;
        }
        if (!Cb || !Cb.hitPlayer) return false;
        const res = Cb.hitPlayer({ damage: Math.max(1, Math.round(b.dmg * this.strK() * (this._disarmed ? 0.45 : 1))), poise: Math.round(b.poise * (1 + 0.03 * (this._attr.str - 5))),
            from: { x: this.centerX(), y: this.centerY() }, attacker: this, name: this._def.name.toLowerCase(), wound: b.wound, knock: b.knock,
            guardBreak: this._blow === "heavy", nonLethal: this.mercy(), onBeaten: () => beatenBy(this) });
        if (res === "hit") { this._hitStop = 2; se(this._blow === "bash" ? "Blow3" : "Blow1", 80, 90, panOf(this.centerX())); }
        return true;
    };
    // the hero parried the blow (Combat.js): he reels a long moment - and may lose his weapon (Rozbrojenie)
    Game_Human.prototype.onParried = function() {
        this._parried = true;
        this._stun = Math.max(this._stun, this._def.stun + 30);
        this._poise = 0;
        this._lockAng = null;
        endTurn(this);
        knockBack(this);
        if (!this._disarmed && this._def.weapon !== undefined && Math.random() < perk("disarm")) this.disarm();
    };
    Game_Human.prototype.disarm = function() {
        this._disarmed = true;
        const C2 = T.api("Combat_parts"), F2 = C2 && C2.fight;
        if (F2) F2.numberAt(this.centerX(), this.centerY() - 1.5, "Rozbrojony!", "#9ff0a8", 0.85);
        se("Sword4", 80, 120, panOf(this.centerX()));
        const w = this._def.weapon;
        if (w && w[0]) dropPile(this.centerX() + (Math.random() - 0.5), this.centerY() + 0.4, [[w[0], 1]], 0);
        this._weaponGone = true;
    };

    // ---- the bandit: in to blow range when it is his turn, two blows (maybe a feint first); round the hero on the ring while waiting;
    // now and then his club up against the hero's blow
    Game_Human.prototype.thinkBandit = function(dist) {
        const b = this._def.blow, Cb = C(), act = Cb && Cb.act;
        // the hero swings at him: a guard now and then (not while he is about his own blow) - the knife bandit springs back instead
        const swinging = !!act && act.mode === "attack";
        const dg = this._def.dodge, hd = foeOf(this) ? this.playerDistance() : dist;   // (the hero's swing: how far the hero is, whoever he fights)
        if (dg && swinging && !this._sawSwing && hd < 2.2 && (this._guardCd || 0) <= 0 && Math.random() < dg.chance && this.springBack()) {
            this._guardCd = dg.cd;
            this._sawSwing = swinging;
            return;
        }
        if (swinging && !this._sawSwing && hd < 2.4 && (this._guardCd || 0) <= 0 && this._def.guard && Math.random() < this._def.guard.chance) {
            this._guardCd = this._def.guard.cd;
            this.faceHero();
            this.setMode("guard", this._def.guard.frames);
            this._sawSwing = swinging;
            return;
        }
        this._sawSwing = swinging;
        if (this._guardCd > 0) this._guardCd--;
        this.meleeApproach(dist, b, () => this.startBlow("main"));
    };
    // a quick jump away from the hero's blow (the knife bandit): a tile or two straight back, where there is room
    Game_Human.prototype.springBack = function() {
        if (this.isJumping()) return false;
        const [hx, hy] = toHero(this), d = Math.hypot(hx, hy) || 1, ux = -hx / d, uy = -hy / d;
        for (const n of [2, 1]) {
            const bx = Math.round(ux * n), by = Math.round(uy * n), x = this._x + bx, y = this._y + by;
            if (!(bx || by) || !$gameMap.isValid(x, y) || !$gameMap.checkPassage(x, y, 0x0f) || humans.some(o => o !== this && !o._dead && o._x === x && o._y === y)) continue;
            if (!HP().clearLine(HP().pathGrid(), this._x, this._y, x, y, true)) continue;
            this.faceHero();
            this.jump(bx, by);
            se("Jump1", 55, 130, panOf(this.centerX()));
            return true;
        }
        return false;
    };
    // in to his blow's range when it is his turn (and the pause is over), else round the hero on the ring
    Game_Human.prototype.meleeApproach = function(dist, b, attack) {
        const band = this._band, foe = foeOf(this), turn = foe ? this._gapT <= 0 : myTurn(this) && (!band || band.gapT <= 0) && this._gapT <= 0;
        if (turn && dist <= b.at && this.clearRun()) { attack(); return; }
        if (this.isMoving()) return;
        if (turn || foe) {   // (his foe - Act3's defender: in to it, or waits facing it; no ring round the hero)
            if (this._mode !== "chase") this.setMode("chase");
            if (dist <= 1.15) { this.faceHero(); return; }   // (right beside him: no closer)
            const [tx, ty] = tgtTile(this);
            if (!this.walkTo(tx, ty, "in", 1)) this.faceHero();
            return;
        }
        this.circle(dist);
    };
    // waiting for his turn: a place of his own on a ring round the hero (they spread round him), a step along it now and then
    Game_Human.prototype.circle = function(dist) {
        if (this._mode !== "circle") this.setMode("circle");
        const band = this._band, live = band ? band.members.filter(m => !m._dead && !m._surrendered && m._engaged && m._kind !== "archer") : [this];
        const i = Math.max(0, live.indexOf(this)), n = Math.max(1, live.length), turn = (band ? band.angle : 0) + (this._ringOff || 0);
        const G = HP().pathGrid();
        let spot = null;
        for (let k = 0; k < 8 && !spot; k++) {
            const a = turn + (i / n) * Math.PI * 2 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * Math.PI / 6;
            const x = Math.round($gamePlayer._realX + Math.cos(a) * BAND.ring), y = Math.round($gamePlayer._realY + Math.sin(a) * BAND.ring * 0.8);
            if (HP().gridOpen(G, x, y, true) && !humans.some(o => o !== this && !o._dead && o._x === x && o._y === y)) spot = { x, y };
        }
        if (!spot) { this.faceHero(); return; }
        const off = Math.hypot(spot.x - this._x, spot.y - this._y);
        if (dist < 1.4) {   // (too close while not his turn: a step back)
            const away = [2, 4, 6, 8, 1, 3, 7, 9].map(d => ({ d, s: Math.hypot(this._x + STEP[d][0] - $gamePlayer._realX, this._y + STEP[d][1] - $gamePlayer._realY) }))
                .filter(o => RoamingActor.canStep(this, this._x, this._y, o.d)).sort((a, b) => b.s - a.s)[0];
            if (away && this.stepTo(away.d)) return;
        }
        if (off > 0.6) { if (!this.walkTo(spot.x, spot.y, "ring", 0)) this.faceHero(); }
        else {
            this.faceHero();
            if ((this._still = (this._still || 0) + 1) > rnd(50, 110)) { this._still = 0; this._ringOff = (this._ringOff || 0) + (Math.random() < 0.5 ? -0.5 : 0.5); }
        }
    };

    // ---- the mercenary: shield up (the front), goes round to the hero's back while he keeps his guard up; the cut, the shield bash, the
    // overhead blow; a few blows on his shield in a row and he hits back with it at once
    Game_Human.prototype._shieldUp = function() {
        if (this._kind !== "mercenary" || this._disarmedShield || this._guardBroken) return false;
        const m = this._mode;
        return this._engaged && (m === "chase" || m === "circle" || m === "flank" || m === "guard") && this._stun <= 0;
    };
    Game_Human.prototype.guarding = function() {
        if (this._kind === "mercenary") return this._shieldUp();
        return this._mode === "guard" && this._stun <= 0;
    };
    Game_Human.prototype.thinkMerc = function(dist) {
        const k = this._def, Cb = C(), act = Cb && Cb.act, band = this._band;
        const turn = myTurn(this) && (!band || band.gapT <= 0);
        // blows taken on the shield: hit back at once
        const now = Graphics.frameCount;
        this._blocks = this._blocks.filter(t => now - t < k.shield.counterIn);
        if (this._blocks.length >= k.shield.counter && dist <= k.bash.at + 0.4 && this._stun <= 0) { this._blocks = []; this.startBlow("bash", false); this._modeT = this._modeLen = Math.round(k.bash.windup * 0.7); return; }
        // the hero keeps his guard up, facing him: round to his side / back
        const guardUp = !!act && act.mode === "block";
        this._guardSeen = guardUp ? (this._guardSeen || 0) + 1 : 0;
        if (this._mode === "flank") { if (foeOf(this)) this.setMode("chase"); else { this.thinkFlank(dist); return; } }
        if (!foeOf(this) && this._guardSeen > k.flank.after && dist < 3.5 && heroFaces(this, 0.4) && turn) { this.setMode("flank", k.flank.frames); this._flankSide = Math.random() < 0.5 ? 1 : -1; return; }
        this.meleeApproach(dist, k.blow, () => this.startBlow(this.pickMercBlow(dist)));
    };
    Game_Human.prototype.pickMercBlow = function(dist) {
        const k = this._def;
        if (dist <= k.bash.at && Math.random() < 0.3) return "bash";
        if (dist <= k.heavy.at && Math.random() < k.heavy.chance) return "heavy";
        return "main";
    };
    // going round him to a place at his side or back (where his guard does not reach); there - the blow at once
    Game_Human.prototype.thinkFlank = function(dist) {
        const k = this._def;
        if (this._modeT <= 0) { this.setMode("chase"); return; }
        if (!heroFaces(this, 0.25) && dist <= k.blow.at + 0.2 && this._gapT <= 0) { this.startBlow(this.pickMercBlow(dist)); return; }
        if (this.isMoving()) return;
        const Hn = H(), [fx, fy] = Hn && Hn.facingVector ? Hn.facingVector() : [0, 1];
        const back = Math.atan2(-fy, -fx), a = back + this._flankSide * Math.PI / 3, R = k.flank.radius;
        const x = Math.round($gamePlayer._realX + Math.cos(a) * R), y = Math.round($gamePlayer._realY + Math.sin(a) * R);
        if (!this.walkTo(x, y, "flank", 0)) this._flankSide = -this._flankSide;
    };

    // ---- the archer: keeps his distance (backs off when the hero comes near, comes nearer when too far or without a clear line), draws,
    // shoots, reloads; too close and cornered - a shove with the bow
    Game_Human.prototype.thinkArcher = function(dist) {
        const s = this._def.shot, m = this._mode;
        if (m === "draw") { this.thinkDraw(dist); return; }
        if (m === "loose") { if (this._modeT <= 0) this.setMode("reload", Math.round(s.reload * this.dexK())); return; }
        if (m === "reload") {
            this.faceHero();
            if (dist < s.keepMin - 0.4 && !this.isMoving()) this.backOff(dist);
            if (this._modeT <= 0) this.setMode("chase");
            return;
        }
        // pressed hard (or no arrows left): a shove with the bow
        const b = this._def.blow;
        if ((dist <= b.at && (this._cornered || 0) > 40) || (this._arrows <= 0 && dist <= b.at)) {
            if (this._gapT <= 0) { this._cornered = 0; this.startBlow("main"); return; }
        }
        if (this._arrows <= 0) {   // nothing to shoot: he keeps off, and runs when he can
            if (!this.isMoving()) { if (dist < 4) this.backOff(dist); else if (Math.random() < 0.01) this.flee(); else this.faceHero(); }
            return;
        }
        if (this.isMoving()) return;
        if (dist < s.keepMin) { this.backOff(dist); return; }
        this._cornered = 0;
        if (dist <= s.range && dist >= s.keepMin - 0.3 && this.clearRun() && this._gapT <= 0) { this.startDraw(); return; }
        const spot = this.shootSpot();
        if (spot && (spot.x !== this._x || spot.y !== this._y)) { if (this._mode !== "chase") this.setMode("chase"); if (!this.walkTo(spot.x, spot.y, "spot", 0)) this.faceHero(); }
        else this.faceHero();
    };
    // a tile keepMin..keepMax from the hero with a clear line at him, the nearest to walk to (away from him when backing off)
    Game_Human.prototype.shootSpot = function(away) {
        const s = this._def.shot, now = Graphics.frameCount, px = $gamePlayer.x, py = $gamePlayer.y, P = HP(), G = P.pathGrid();
        const S2 = this._spot;
        if (S2 && now - S2.t < 60 && Math.abs(S2.px - px) + Math.abs(S2.py - py) <= 1 && !!S2.away === !!away) return S2;
        let best = null, bestS = Infinity;
        const R = Math.ceil(s.keepMax);
        for (let y = py - R; y <= py + R; y++) for (let x = px - R; x <= px + R; x++) {
            const r = Math.hypot(x - px, y - py);
            if (r < s.keepMin + 0.6 || r > s.keepMax || !P.gridOpen(G, x, y, true)) continue;
            if (humans.some(o => o !== this && !o._dead && o._x === x && o._y === y)) continue;
            if (!P.clearLine(G, x, y, px, py, true)) continue;
            const walk = Math.hypot(x - this._x, y - this._y), toward = ((x - this._x) * (px - this._x) + (y - this._y) * (py - this._y)) > 0;
            const score = walk + Math.abs(r - 5) * 0.6 + (away && toward ? 6 : 0);
            if (score < bestS) { bestS = score; best = { x, y }; }
        }
        this._spot = best ? Object.assign(best, { t: now, px, py, away: !!away }) : null;
        return this._spot;
    };
    Game_Human.prototype.backOff = function(dist) {
        const spot = this.shootSpot(true);
        if (this._mode !== "backoff") this.setMode("backoff");
        const went = spot ? this.walkTo(spot.x, spot.y, "back", 0) : false;
        if (!went) {   // (nowhere to go: a wall, a corner - he is cornered)
            this._cornered = (this._cornered || 0) + 20;
            this.faceHero();
        } else this._cornered = Math.max(0, (this._cornered || 0) - 4);
    };
    Game_Human.prototype.startDraw = function() {
        const s = this._def.shot, [hx, hy] = toHero(this);
        this._faceAng = Math.atan2(hy, hx);
        this.setDirection(DIR4(hx, hy));
        this.setMode("draw", Math.round(s.draw * this.dexK()));
        this._aim = { x: heroX(), y: heroY(), locked: false };
        se("Bow1", 55, 75, panOf(this.centerX()));
    };
    // drawn: the aim follows the hero, then locks (lockAt frames before the arrow leaves - the moment to step aside or roll)
    Game_Human.prototype.thinkDraw = function(dist) {
        const s = this._def.shot, aim = this._aim;
        if (!aim) { this.setMode("chase"); return; }
        if (dist < 1.6) { this._aim = null; this.setMode("chase"); this._cornered = 60; return; }   // (he is on him: no shot now)
        if (this._modeT > s.lockAt) {
            const ax = heroX(), ay = heroY();
            aim.x += (ax - aim.x) * 0.35;
            aim.y += (ay - aim.y) * 0.35;
            this._faceAng = Math.atan2(aim.y - this.centerY(), aim.x - this.centerX());
            if (!this.clearRun()) { this._aim = null; this.setMode("chase"); this._gapT = 20; return; }   // (he went behind a tree)
        } else if (!aim.locked) { aim.locked = true; se("Bow2", 40, 140, panOf(this.centerX())); }
        this._lockAng = this._faceAng;
        if (this._modeT <= 0) this.loose();
    };
    Game_Human.prototype.loose = function() {
        const s = this._def.shot, aim = this._aim;
        this._aim = null;
        this._lockAng = null;
        if (!aim) { this.setMode("chase"); return; }
        const sx = this.centerX(), sy = this.centerY() - 0.25, dx = aim.x - sx, dy = aim.y - sy, d = Math.hypot(dx, dy) || 1;
        arrows.push({ x: sx, y: sy, vx: dx / d, vy: dy / d, from: this, dmg: Math.max(1, Math.round(s.dmg * (1 + 0.1 * (this._level - 1)) * (1 + 0.02 * (this._attr.dex - 5)))),
            poise: s.poise, speed: s.speed, gone: 0, range: s.range + 2, sprite: null, done: false });
        this._arrows--;
        se("Bow3", 75, 95, panOf(sx));
        this.setMode("loose", 14);
        this._gapT = rnd(10, 40);
    };

    // ---- he begs for his life: kneeling, the weapon down; the hero comes up to him - the choice (offerChoice); left alone, he runs
    Game_Human.prototype.thinkSurrender = function() {
        this.faceHero();
        this._surrT = (this._surrT || 0) + 1;
        if (this._surrT > 60 * 45 || (this._surrT > 120 && this.playerDistance() > 11)) this.flee(true);
    };
    // running off (or walking off, spared): to a far spot by the map's edge, gone once out of sight
    Game_Human.prototype.thinkLeave = function() {
        if (this.isMoving()) return;
        if (!onScreen(this) || this.atEdge()) { gone(this); return; }
        const P = HP();
        if (!this._fleeTo || (this._fleeStuck || 0) > 5 || (this._x === this._fleeTo.x && this._y === this._fleeTo.y)) {
            this._fleeTo = P.escapeSpot(this, $gamePlayer.x, $gamePlayer.y, this._fleeTo);
            this._fleeStuck = 0;
        }
        const to = this._fleeTo;
        if (this.walkTo(to.x, to.y, "away", 0)) this._fleeStuck = 0;
        else this._fleeStuck = (this._fleeStuck || 0) + 1;
        if (++this._leaveT > 60 * 40) gone(this);
    };
    Game_Human.prototype.atEdge = function() {
        const w = $gameMap.width(), h = $gameMap.height();
        return this._x <= 1 || this._y <= 1 || this._x >= w - 2 || this._y >= h - 2;
    };
    Game_Human.prototype.flee = function(fromSurrender) {
        if (this._dead) return;
        if (!this._surrendered || fromSurrender) {
            if (!this._defeated) defeated(this, "fled");
            if (!fromSurrender) say(this, pick(LINES.broken));
        }
        this._engaged = false;
        endTurn(this);
        this._leaveT = 0;
        this.setMode("flee");
    };

    // ==================================================================
    // A hit on a man: his guard first (the mercenary's shield, the bandit's raised club - from the front, against a light blow), then
    // the hurt, the balance, the reeling; maybe he begs
    // ==================================================================
    function hitHuman(h, damage, how, extra) {
        if (h._dead || h._surrendered) return;
        extra = extra || {};
        const k = h._def, Cb = C(), F2 = (T.api("Combat_parts") || {}).fight;
        const heavy = !!extra.heavy, hidden = extra.tag === "sneak" || extra.tag === "heart";
        // (extra.from {x, y}: a blow not of the hero's - an ally's, Act3.js - its own side for the guard and the push)
        const from = extra.from && typeof extra.from.x === "number" ? extra.from : null;
        const inFront = cos => (from ? h.inFrontOf(from.x, from.y, cos) : h.heroInFront(cos));
        if (!hidden && h.guarding() && inFront(k.shield ? k.shield.front : 0.3)) {
            if (heavy && how !== "shot") {   // a heavy blow breaks the guard: he reels, open
                h._guardBroken = true;
                h._stun = Math.max(h._stun, k.shield ? k.shield.breakStun : 50);
                h._poise = 0;
                damage = Math.round(damage * (k.shield ? k.shield.breakDmg : 0.8));
                if (F2) F2.numberAt(h.centerX(), h.centerY() - 1.5, "Garda przełamana!", "#ffc080", 0.85);
                se("Sword4", 90, 70, panOf(h.centerX()));
                endTurn(h);
                if (h._mode === "guard") h.setMode("chase");
            } else {   // blocked: next to nothing gets through; a blow bounces the hero's weapon back
                const part = k.shield ? k.shield.block : 0.25;
                damage = how === "shot" && k.shield ? 0 : Math.round(damage * part);
                h._poise = Math.max(1, h._poise - Math.round((extra.poise || 10) * 0.3));
                h._poiseT = 0;
                h._blocks.push(Graphics.frameCount);
                if (F2) { F2.numberAt(h.centerX(), h.centerY() - 1.3, damage > 0 ? "Blok -" + damage : "Zablokowane!", "#cfd6de", 0.8); F2.sparksAt(h.centerX() - (h.centerX() - (from ? from.x : heroX())) * 0.3, h.centerY() - 0.5, "#f0f0e0", 9); }
                se(k.shield ? "Sword4" : "Blow3", 85, k.shield ? 110 : 120, panOf(h.centerX()));
                if (how !== "shot" && !from && Cb && Cb.recoil) Cb.recoil(k.shield ? 14 : 8);
                if (Math.random() < 0.35) say(h, pick(LINES.block), 90);
                if (damage > 0) { h._hp -= damage; h._flashT = 4; }
                if (!h._engaged) h.engage(false);
                if (h._hp <= 0) kill(h, how);
                return;
            }
        }
        // from behind the mercenary (his shield on the other side): it hurts more
        if (k.shield && !hidden && h._engaged && !inFront(-0.35)) {
            damage = Math.round(damage * k.shield.back);
            if (F2) F2.numberAt(h.centerX(), h.centerY() - 1.55, "Cios w plecy!", "#ffd27f", 0.8);
        }
        h._hp -= damage;
        h._poiseT = 0;
        if (Cb && Cb.enemyHurtFx) Cb.enemyHurtFx(h, damage, how, extra);
        se("Damage1", 60, 105, panOf(h.centerX()));
        const Hn = H();
        if (Hn && Hn.makeNoise) Hn.makeNoise(h.centerX(), h.centerY(), hidden ? 3 : 7);   // (a fight wakes the camp; a blow from hiding hardly)
        if (h._hp <= 0) { kill(h, how); return; }
        const poise = extra.poise !== undefined ? extra.poise : Math.round(damage * 0.8);
        if (!h._engaged && !(hidden && poise >= h._poise)) h.engage(true);   // (a blow from hiding that breaks him: he reels first, then fights - afterStun)
        h._poise -= poise;
        if (h._poise <= 0) stagger(h, !!extra.knock, from);
        else if (extra.knock) knockBack(h, from);
        if (Math.random() < 0.18) say(h, pick(LINES.hurt), 80);
        if (!maybeSurrender(h)) morale(h._band);
    }
    function stagger(h, knock, from) {
        h._stun = h._def.stun;
        h._poise = 0;
        h._lockAng = null;
        h._aim = null;
        if (h._mode === "windup" || h._mode === "strike" || h._mode === "feint" || h._mode === "draw" || h._mode === "guard" || h._mode === "flank") h.setMode("chase");
        endTurn(h);
        if (knock) knockBack(h, from);
    }
    // thrown one tile away from the hero (a jump), when there is room
    function knockBack(h, from) {   // (from {x, y}: away from an ally's blow - Act3.js; else from the hero)
        if (h.isJumping()) return;
        const ax = h._x - (from ? Math.floor(from.x) : $gamePlayer.x), ay = h._y - (from ? Math.floor(from.y) : $gamePlayer.y);
        const bx = Math.abs(ax) >= Math.abs(ay) ? Math.sign(ax) : 0, by = Math.abs(ax) >= Math.abs(ay) ? 0 : Math.sign(ay);
        const d = bx > 0 ? 6 : bx < 0 ? 4 : by > 0 ? 2 : 8;
        if ((bx || by) && h.canPass(h._x, h._y, d) && !humans.some(o => o !== h && o._x === h._x + bx && o._y === h._y + by)) h.jump(bx, by); else h.jump(0, 0);
    }
    // under a part of his life: he may beg for mercy - or run (Hart ducha holds him; the skill Postrach breaks him sooner)
    function maybeSurrender(h, push) {
        const s = h._def.surrender;
        if (!s || h._surrenderTried || h._noSurrender) return false;
        if (h._hp > h._maxHp * (s.at + perk("surrender.at")) && !push) return false;
        h._surrenderTried = true;
        const chance = s.chance * Math.max(0.3, 1 - 0.025 * (h._attr.wil - 5)) + perk("surrender") + (push || 0);
        if (Math.random() < chance) { surrender(h); return true; }
        if (Math.random() < s.flee) { h.flee(); morale(h._band); return true; }
        return false;
    }
    // the band losing heart: the hurt ones beg or run when the others are down
    function morale(band) {
        if (!band) return;
        const live = band.members.filter(m => !m._dead && !m._surrendered && m._mode !== "flee" && m._mode !== "leave");
        const down = band.members.length - live.length;
        if (!down) return;
        for (const m of live) if (m._engaged && m._hp < m._maxHp * BAND.morale && !m._surrenderTried) maybeSurrender(m, 0.2 * down);
    }
    function surrender(h) {
        h._surrendered = true;
        h._engaged = false;
        h._stun = 0;
        h._lockAng = null;
        h._aim = null;
        h._surrT = 0;
        h._offerCd = 40;
        endTurn(h);
        h.setMode("surrender");
        say(h, pick(LINES.surrender), 240);
        se("Equip1", 60, 80, panOf(h.centerX()));
        const w = h._def.weapon;   // (the weapon he threw down - his kneeling picture shows it on the ground: it goes with his things, taken or left on his body)
        if (w && w[0] && !h._weaponGone && Math.random() < w[1] + 0.3) { h._weaponGone = true; h._loot.push([w[0], 1]); }
        giveXp(h);
        S().begged++;
        T.emit("humanSurrender", { kind: h._kind, tag: h._tag, level: h._level, x: h.centerX(), y: h.centerY(), human: h });
        morale(h._band);
        bandCheck(h._band);
    }
    // the experience for beating him (once: at the surrender, or at his death - Combat.js's "kill" then gets noXp)
    function giveXp(h) {
        if (h._xpGiven) return;
        h._xpGiven = true;
        const Cb = C();
        if (Cb && Cb.gainXp && Cb.killXp) Cb.gainXp(Cb.killXp(h._kind, h._level), h._def.name);
    }
    // killed: he lies where he fell (a body to search); the bus's "kill" as for an animal (Combat.js: the experience, quests' kill steps)
    function kill(h, how, begged) {
        if (h._dead) return;
        const camp = h._campRef;
        h._dead = true;
        endTurn(h);
        removeHuman(h);
        S().killed++;
        const loot = (h._loot || []).slice();
        const w = h._def.weapon;
        if (w && w[0] && !h._weaponGone && Math.random() < w[1]) loot.push([w[0], 1]);
        if (h._kind === "archer" && h._arrows > 0) loot.push([D.ITEM.arrows, Math.min(6, h._arrows)]);
        dropBody(h, h._gold, loot);
        const e = { kind: h._kind, by: "hero", how: how || "", mapId: $gameMap.mapId(), x: h.centerX(), y: h.centerY(), level: h._level, animal: h, human: true,
            name: h._def.name, noXp: !!h._xpGiven, tag: h._tag };
        h._xpGiven = true;
        T.emit("kill", e);
        se("Collapse1", 60, 95, panOf(h.centerX()));
        if (camp) camp.state = "dead";
        defeated(h, "killed", begged);
        if (begged) {
            const s = S(), d = day();
            if (s.opinionDay.kill !== d) { s.opinionDay.kill = d; T.call("TownQuests", "addOpinion", D.OPINION.killBeggar, "dobiłeś człowieka, który błagał o litość"); }
        }
        morale(h._band);
        bandCheck(h._band);
    }
    // the end of one man's part in the fight (killed, spared, robbed, fled) - once
    function defeated(h, how, begged) {
        if (h._defeated) return;
        h._defeated = how;
        if (how === "spared") S().spared++;
        if (how === "robbed") S().robbed++;
        if (h._campRef && how !== "killed") h._campRef.state = how;
        if (h._band) h._band.tally[how] = (h._band.tally[how] || 0) + 1;
        T.emit("humanDefeated", { kind: h._kind, how, begged: !!(begged || h._surrendered), tag: h._tag, level: h._level, x: h.centerX(), y: h.centerY() });
    }
    // the whole band done (none left fighting): its tally on the bus; a camp cleared
    function bandCheck(band) {
        if (!band || band.done) return;
        if (band.members.some(m => !m._dead && !m._defeated && !m._surrendered)) return;
        if (band.members.some(m => m._surrendered && !m._defeated)) return;   // (one still kneeling: the choice first)
        band.done = true;
        band.engaged = false;
        T.emit("humansDone", Object.assign({ tag: band.tag, killed: 0, spared: 0, robbed: 0, fled: 0 }, band.tally));
        if (band.camp) {
            S().cleared[band.camp.mapId] = day();
            T.emit("campCleared", { mapId: band.camp.mapId });
        }
    }
    function gone(h) {
        if (h._surrendered && !h._defeated) defeated(h, "fled");
        removeHuman(h);
        bandCheck(h._band);
    }
    function removeHuman(h) {
        h._dead = true;
        if (h._markSprite && h._markSprite.parent) h._markSprite.parent.removeChild(h._markSprite);
        RoamingActor.dropSprite(h);
        humans = humans.filter(o => o !== h);
    }

    // ==================================================================
    // The choice over a kneeling man: spare him, take his purse, finish him, leave him (an interpreter's choice - bubbles over the hero)
    // ==================================================================
    const CHOICES = ["Puść go wolno", "Zabierz mu sakiewkę", "Dobij go", "Zostaw"];
    function offerChoice(h) {
        h._offerCd = 99999;
        const list = [
            { code: 101, indent: 0, parameters: ["", 0, 0, 2, ""] },
            { code: 401, indent: 0, parameters: ["\\SPK[0]" + h.name() + " klęczy i błaga o życie. Co z nim zrobić?"] },
            { code: 102, indent: 0, parameters: [CHOICES, 3, 0, 2, 0] }
        ];
        const what = ["spare", "rob", "kill", "leave"];
        CHOICES.forEach((label, i) => {
            list.push({ code: 402, indent: 0, parameters: [i, label] });
            list.push({ code: 355, indent: 1, parameters: ["Humans.decide(" + h._hid + ", \"" + what[i] + "\")"] });
            list.push({ code: 0, indent: 1, parameters: [] });
        });
        list.push({ code: 403, indent: 0, parameters: [6, null] }, { code: 355, indent: 1, parameters: ["Humans.decide(" + h._hid + ", \"leave\")"] }, { code: 0, indent: 1, parameters: [] });
        list.push({ code: 404, indent: 0, parameters: [] }, { code: 0, indent: 0, parameters: [] });
        $gameMap._interpreter.setup(list, 0);
    }
    function decide(id, what) {
        const h = humans.find(o => o._hid === id);
        if (!h || h._dead || !h._surrendered) return false;
        if (what === "leave") { h._offerCd = 30; h._offerAway = true; return true; }
        if (what === "spare") {
            say(h, pick(LINES.spared), 200);
            h._defeatedHow = "spared";
            defeated(h, "spared");
            const s = S(), d = day();
            if (s.opinionDay.spare !== d) { s.opinionDay.spare = d; T.call("TownQuests", "addOpinion", D.OPINION.spare, "puściłeś wolno pokonanego"); }
            if (Math.random() < 0.45) tellRumour(h);
            else if (Math.random() < 0.4) { const g = Math.max(1, Math.round(h._gold * 0.3)); $gameParty.gainGold(g); }
            h._surrendered = false;
            h._leaveT = 0;
            h.setMode("leave");
        } else if (what === "rob") {
            say(h, pick(LINES.robbed), 180);
            if (h._gold > 0) $gameParty.gainGold(h._gold);
            for (const [itemId, n] of h._loot || []) if ($dataItems[itemId]) $gameParty.gainItem($dataItems[itemId], n);
            h._gold = 0;
            h._loot = [];
            defeated(h, "robbed");
            h._surrendered = false;
            h._leaveT = 0;
            h.setMode("flee");
        } else if (what === "kill") {
            finishBeggar(h);
            return true;
        }
        bandCheck(h._band);
        return true;
    }
    // the hero's own blow (the weapon in hand), then he is dead
    function finishBeggar(h) {
        const Cb = C();
        const dx = h.centerX() - heroX(), dy = h.centerY() - heroY(), Hn = H();
        if (Hn && Hn.faceSlant) Hn.faceSlant(dx, dy); else $gamePlayer.setDirection(DIR4(dx, dy));
        const id = Cb && Cb.handMelee ? Cb.handMelee() : 0, w = Cb && Cb.MELEE ? Cb.MELEE[id] : null, kind = w ? w.combo[0] : -1;
        const done = () => { if (h._dead) return; se(w ? w.se : "Blow1", 85, 90); T.call("Combat", "sparksAt", h.centerX(), h.centerY() - 0.4, "#b8322a", 10); kill(h, "melee", true); };
        if (kind >= 0 && typeof $gamePlayer.startToolSwing === "function" && $gamePlayer.startToolSwing(kind, done)) return;
        done();
    }
    function tellRumour(h) {
        const s = S(), left = D.RUMOURS.filter(r => !s.rumours.includes(r)), r = pick(left.length ? left : D.RUMOURS);
        if (!s.rumours.includes(r)) s.rumours.push(r);
        T.popup("Plotka od pokonanego", { top: true, color: "#ffe9a8", sub: r });
        T.call("Journal", "addNote", "Plotka od pokonanego " + (h._def.name.toLowerCase()), r);
    }
    // the hero next to a kneeling man, nobody else after him: the choice
    function checkOffer(scene) {
        if (!T.isCalm(scene, { only: ["onMap", "sceneChange", "transfer", "message", "event", "farmMenu", "build"] })) return;
        if ($gamePlayer.isToolSwinging && $gamePlayer.isToolSwinging()) return;
        const h = humans.find(o => o._surrendered && !o._dead && o._offerCd <= 0 && !o._offerAway && o.playerDistance() <= 1.7);
        if (!h) return;
        const Cb = C(), foes = Cb && Cb.foes ? Cb.foes() : humans;
        if (foes.some(a => a !== h && !a._dead && a._engaged && !a._surrendered && !(a.isHuman && foeOf(a)) && Math.hypot(a.centerX() - heroX(), a.centerY() - heroY()) < 9)) return;
        offerChoice(h);
    }

    // ==================================================================
    // Beaten down by them (their blows never kill): he lies, they take part of his gold and food, he comes to an hour later, hurt
    // ==================================================================
    let robbery = null;   // { band, t, gold, items }
    function beatenBy(h) {
        if (robbery) return;
        const band = h._band || makeBand([h], {});
        robbery = { band, t: 0, by: h };
        S().beaten++;
        for (const m of humans) {   // (every man after him stops: they have what they wanted)
            if (m._dead || m._surrendered) continue;
            m._lockAng = null;
            m._aim = null;
            if (m._band === band || m._engaged) { m._engaged = false; m._robber = true; m.setMode("gloat"); }
        }
        endTurn(h);
        T.call("Combat", "downPlayer", 300);
    }
    function updateRobbery() {
        const r = robbery;
        if (!r) return;
        r.t++;
        if (r.t === 40) { const m = r.band.members.find(o => !o._dead && o._mode === "gloat"); if (m) say(m, pick(LINES.beat), 160); }
        if (r.t === 110) $gameScreen.startFadeOut(36);
        if (r.t === 150) {
            const R = D.ROBBED, gold = Math.floor($gameParty.gold() * R.gold), items = [];
            if (gold > 0) $gameParty.loseGold(gold);
            const food = $gameParty.items().filter(it => /<Food:/.test(it.note || "") && Math.random() < R.food).slice(0, 3);
            for (const it of food) { const n = Math.max(1, Math.ceil($gameParty.numItems(it) / 2)); $gameParty.loseItem(it, n); items.push([it.id, n]); }
            r.gold = gold;
            r.items = items;
            const gone2 = new Set();
            for (const m of humans.slice()) {   // (they go with the loot - the camp packs up)
                if (m._dead || !(m._robber || m._band === r.band)) continue;
                if (m._campRef) m._campRef.state = "away";
                if (m._band) gone2.add(m._band);
                removeHuman(m);
            }
            for (const b of gone2) {
                if (b.camp) { b.camp.over = true; removeCampSack(b.camp); }
                b.done = true;
            }
            bands = bands.filter(b => !gone2.has(b));
            arrows.length = 0;
            $gameSystem.advanceDayNight(R.hours);
            const a = $gameParty.leader();
            if (a) a.setHp(Math.max(1, Math.round(a.mhp * R.hp)));
            if (typeof $gameSystem.injure === "function") $gameSystem.injure(0);
            T.call("Combat", "resetAct");
        }
        if (r.t === 180) {
            $gameScreen.startFadeIn(36);
            T.popup("Pobili cię i obrabowali", { top: true, color: "#ff9f8f", sub: (r.gold > 0 ? "Zabrali " + r.gold + " G" : "Nie mieli czego zabrać") + (r.items.length ? " i trochę jedzenia" : "") + ". Jesteś ranny." });
            T.emit("heroRobbed", { tag: r.band.tag, gold: r.gold, items: r.items });
            robbery = null;
        }
    }

    // ==================================================================
    // Bands (who fights together), spawning
    // ==================================================================
    function makeBand(members, opts) {
        opts = opts || {};
        const band = { members: [], attacker: null, gapT: 40, engaged: false, angle: Math.random() * Math.PI * 2, tag: opts.tag || "", camp: opts.camp || null,
            ambush: !!opts.ambush, tally: {}, done: false, shouted: false, woke: false };
        for (const m of members) { m._band = band; band.members.push(m); }
        bands.push(band);
        return band;
    }
    function updateBands() {
        for (const b of bands) {
            if (b.gapT > 0) b.gapT--;
            b.angle += 0.003;
        }
        bands = bands.filter(b => b.members.some(m => !m._dead));
    }
    // a man of `kind` on tile (x, y); opts: see the help (Humans.spawn)
    function spawn(kind, x, y, opts) {
        if (!KINDS[kind] || !$gameMap || !$gameMap.isValid(x, y)) return null;
        opts = opts || {};
        const h = new Game_Human(kind, x, y, opts);
        humans.push(h);
        RoamingActor.addSprite(h);
        // (a band: the one given, else the one of the men about here - they fight together, one blow at a time -, else his own)
        const near = !opts.band && !opts.noBand ? humans.find(o => o !== h && !o._dead && o._band && !o._band.done && !o._band.camp && Math.hypot(o._x - x, o._y - y) <= 12) : null;
        const band = opts.band || (near && near._band);
        if (band) { h._band = band; band.members.push(h); } else makeBand([h], opts);
        if (opts.say) say(h, opts.say, 200);
        if (opts.engaged) h.engage(!opts.say);
        return h;
    }
    // open tiles lo..hi from the hero a man can stand on (and get to him from)
    function openSpots(lo, hi, opts) {
        opts = opts || {};
        const P = HP(), G = P.pathGrid(), F = T.api("Farming"), px = $gamePlayer.x, py = $gamePlayer.y, out = [];
        const field = P.heroField(hi * 2 + 6);
        for (let y = 1; y < $gameMap.height() - 1; y++) for (let x = 1; x < $gameMap.width() - 1; x++) {
            const d = Math.hypot(x - px, y - py);
            if (d < lo || d > hi || !P.gridOpen(G, x, y, true)) continue;
            if (F && (F.hasObjectTile(x, y) || F.buildingAt(x, y))) continue;
            if (humans.some(o => o._x === x && o._y === y)) continue;
            if (!opts.anywhere && field[y * G.w + x] === Infinity) continue;   // (not across a wall from him)
            out.push({ x, y, d });
        }
        return out;
    }
    function spawnNear(kind, lo, hi, opts) {
        const spots = openSpots(lo, hi);
        if (!spots.length) return null;
        const s = pick(spots);
        return spawn(kind, s.x, s.y, opts);
    }
    // a band of `kinds` some tiles off, after him at once, with a shout (for the quests: Humans.ambush(["bandit", "bandit", "archer"]))
    function ambush(kinds, opts) {
        opts = Object.assign({}, opts || {});
        const far = opts.far || AMBUSH.far, spots = openSpots(far[0], far[1]);
        if (!spots.length) return null;
        const c = pick(spots), band = makeBand([], { tag: opts.tag, ambush: true });
        const near = spots.filter(s => Math.hypot(s.x - c.x, s.y - c.y) <= 3).sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y));
        let i = 0;
        for (const kind of kinds || ["bandit", "bandit"]) {
            const s = near[i++] || pick(spots);
            spawn(kind, s.x, s.y, Object.assign({}, opts, { band, engaged: false, say: null }));
        }
        if (!band.members.length) return null;
        if (opts.shout !== false) say(band.members[0], opts.say || pick(LINES.ambush), 200);
        band.shouted = true;
        for (const m of band.members) m.engage(false);
        return band;
    }

    // ==================================================================
    // Arrows in flight (the archer's): straight on; the hero's roll lets one through, his shield stops it from the front
    // ==================================================================
    let arrows = [];
    function blockedAt(x, y) {
        const tx = Math.floor(x), ty = Math.floor(y);
        if (!$gameMap.isValid(tx, ty) || !$gameMap.checkPassage(tx, ty, 0x0f)) return true;
        return $gameMap.eventsXy(tx, ty).some(e => e.isNormalPriority() && e.characterName() !== "");
    }
    function updateArrows() {
        const Cb = C();
        for (const a of arrows) {
            if (a.done) continue;
            const steps = 3, st = a.speed / steps;
            for (let i = 0; i < steps && !a.done; i++) {
                a.x += a.vx * st;
                a.y += a.vy * st;
                a.gone += st;
                if (!a.passed && Math.hypot(a.x - heroX(), a.y - (heroY() - 0.2)) < 0.45 && Cb && Cb.hitPlayer) {
                    const res = Cb.hitPlayer({ damage: a.dmg, poise: a.poise, from: { x: a.x - a.vx, y: a.y - a.vy }, attacker: a.from, name: "strzała", wound: a.from._def.shot.wound,
                        knock: a.from._def.shot.knock, unparryable: true, unblockable: !(Cb.shield && Cb.shield()), projectile: true, nonLethal: a.from.mercy(),
                        onBeaten: () => beatenBy(a.from) });
                    if (res === "dodged") { a.passed = true; continue; }
                    if (res === "blocked" || res === "guardbreak") T.call("Combat", "sparksAt", a.x, a.y - 0.3, "#e8e0c8", 6);
                    a.done = true;
                    break;
                }
                if (a.gone >= a.range || blockedAt(a.x, a.y)) { a.done = true; if (!a.passed) T.call("Combat", "sparksAt", a.x, a.y, "#9c8260", 4); }
            }
        }
        arrows = arrows.filter(a => !a.done);
    }

    // ==================================================================
    // Drops: the bodies, the weapons thrown down, the camps' sacks - searched with the action button (saved per map, gone after a day)
    // ==================================================================
    let dropSeq = 0;
    const DROP_LIFE = 24;
    function addDrop(d) {
        const list = dropsOf();
        d.id = Date.now() + "-" + (dropSeq++);
        d.until = clockNow() + (d.life || DROP_LIFE);
        list.push(d);
        while (list.length > 24) list.shift();
        return d;
    }
    function dropBody(h, gold, items) {
        const fx = h.centerX() - heroX();
        return addDrop({ kind: "body", look: h._look, x: h.centerX(), y: h.centerY(), right: fx >= 0, gold: gold || 0, items: items || [] });
    }
    function dropPile(x, y, items, gold) {
        return addDrop({ kind: "pile", x, y, gold: gold || 0, items: items || [] });
    }
    function removeDrop(d) {
        const list = dropsOf(), i = list.indexOf(d);
        if (i >= 0) list.splice(i, 1);
    }
    function rotDrops() {
        const now = clockNow();
        for (const d of dropsOf().slice()) if (d.until <= now) removeDrop(d);
    }
    function dropAhead() {
        const px = heroX(), py = heroY(), d = $gamePlayer.direction();
        const fx = d === 4 ? -1 : d === 6 ? 1 : 0, fy = d === 8 ? -1 : d === 2 ? 1 : 0;
        let best = null, bestD = 99;
        for (const c of dropsOf()) {
            if (c.kind === "body" && !(c.gold > 0) && !(c.items || []).length) continue;
            const dx = c.x - px, dy = c.y - py, dist = Math.hypot(dx, dy);
            if (dist > 1.35 || (dist > 0.6 && (dx * fx + dy * fy) / dist < 0.3)) continue;
            if (dist < bestD) { bestD = dist; best = c; }
        }
        return best;
    }
    // the hero crouches and takes what is there (a body stays, emptied; a pile, a sack goes)
    function searchDrop(c) {
        if ($gamePlayer.isToolSwinging && $gamePlayer.isToolSwinging()) return true;
        const dx = c.x - heroX(), dy = c.y - heroY();
        if (Math.hypot(dx, dy) > 0.3) $gamePlayer.setDirection(DIR4(dx, dy));
        const take = () => {
            if (!dropsOf().includes(c)) return;
            if (c.gold > 0) $gameParty.gainGold(c.gold);
            for (const [id, n] of c.items || []) if ($dataItems[id]) $gameParty.gainItem($dataItems[id], n);
            if (!(c.gold > 0) && !(c.items || []).length) popup(0, c.kind === "sack" ? "Worek jest pusty" : "Nic tu nie ma", "#cfd6de");
            c.gold = 0;
            c.items = [];
            if (c.kind !== "body") removeDrop(c);
            if (c.kind === "sack") {
                se("Equip1", 50, 90);
                const Hn = H();
                if (Hn && Hn.makeNoise) Hn.makeNoise(c.x, c.y, 2.5);   // (a rustle - one awake by the fire may hear it)
            }
        };
        const CT = T.api("ChoppableTree"), crouch = CT && CT.swingKindOf ? CT.swingKindOf("Swing_Crouch") : -1;
        if (crouch < 0 || !$gamePlayer.startToolSwing(crouch, take, null)) take();
        return true;
    }

    // ==================================================================
    // Night camps
    // ==================================================================
    const nightNow = () => { const h = hour(); return h >= CAMP.from || h < CAMP.to; };
    const nightKey = () => (hour() >= CAMP.from ? day() : day() - 1);
    function mapOff() { const t = T.mapTag("Humans"); return !!(t && /^off$/i.test(t.raw)); }
    function campChance() {
        if (mapOff()) return 0;
        const tag = T.mapTag("Camp");
        if (tag) return /^off$/i.test(tag.raw) ? 0 : Math.max(0, Math.min(1, Number(tag.raw) || 0));
        return CAMP.maps[$gameMap.mapId()] || 0;
    }
    // a place for a fire: open ground with room round it (seats), far from the hero and from the map's edge - and out from under the
    // trees: a tree's crown hangs over the two tiles above its trunk, so nothing of the camp may stand there (the fire went under a
    // pine, sleepers lay across trunks; 2026-10-06). A forest too thick for that: the old rule (only the tiles themselves free)
    const underCrown = (x, y) => [1, 2].some(k => $gameMap.eventsXy(x, y + k).length > 0);
    function campSpot(far, near) {
        const P = HP(), G = P.pathGrid(), F = T.api("Farming"), px = $gamePlayer.x, py = $gamePlayer.y, out = [], loose = [];
        const free = (x, y) => P.gridOpen(G, x, y, true) && !(F && (F.hasObjectTile(x, y) || F.buildingAt(x, y))) && $gameMap.eventsXy(x, y).length === 0;
        for (let y = 4; y < $gameMap.height() - 4; y++) for (let x = 4; x < $gameMap.width() - 4; x++) {
            const d = Math.hypot(x - px, y - py);
            if (d < far || (near && d > near) || !free(x, y)) continue;
            let room = 0, open = 0;
            for (let oy = -2; oy <= 2; oy++) for (let ox = -2; ox <= 2; ox++) if (free(x + ox, y + oy)) { room++; if (!underCrown(x + ox, y + oy)) open++; }
            if (room >= 19 && (G.s4a[y * G.w + x] || 0)) (open >= 15 && !underCrown(x, y) ? out : loose).push({ x, y });
        }
        return out.length ? pick(out) : loose.length ? pick(loose) : null;
    }
    const SEATS = [[-1, 0], [1, 0], [0, 1], [-1, -1], [1, -1], [0, -1], [-1, 1], [1, 1]];
    const SLEEP_SEATS = [[-2, 0], [2, 0], [0, 2], [-2, 1], [2, 1], [-1, 2], [1, 2], [0, -2]];
    function makeCamp(opts) {
        opts = opts || {};
        const at = campSpot(opts.far || CAMP.far, opts.near);
        if (!at) return null;
        const n = opts.size || rnd(CAMP.size[0], CAMP.size[1]), kinds = opts.kinds ? opts.kinds.slice() : [];
        if (!opts.kinds) {
            for (let i = 0; i < n; i++) kinds.push("bandit");
            if (n >= 2 && Math.random() < CAMP.archer) kinds[1] = "archer";
            if (n >= 3 && day() >= CAMP.mercFrom && Math.random() < CAMP.mercenary) kinds[0] = "mercenary";
            if (KINDS.knifer && day() >= (CAMP.knifeFrom || 0)) kinds.forEach((k, i) => { if (k === "bandit" && Math.random() < (CAMP.knife || 0)) kinds[i] = "knifer"; });
        }
        const awake = Math.max(1, Math.min(kinds.length - 1, rnd(CAMP.awake[0], CAMP.awake[1])));   // (one at least asleep, one awake)
        const P = HP(), G = P.pathGrid(), free = (x, y) => P.gridOpen(G, x, y, true) && $gameMap.eventsXy(x, y).length === 0;
        const used = new Set(), members = [];
        // (a sleeper lies across a tile and a half: the tiles beside him free too, not a trunk under his head)
        const fits = (x, y, sit) => free(x, y) && !underCrown(x, y) && (sit || (free(x - 1, y) && free(x + 1, y)));
        kinds.forEach((kind, i) => {
            const sit = i < awake, list = sit ? SEATS : SLEEP_SEATS;
            let seat = null;
            for (const [ox, oy] of list) { const x = at.x + ox, y = at.y + oy; if (!used.has(x + "," + y) && fits(x, y, sit)) { seat = { x, y }; break; } }
            if (!seat) for (const [ox, oy] of list) { const x = at.x + ox, y = at.y + oy; if (!used.has(x + "," + y) && free(x, y)) { seat = { x, y }; break; } }
            if (!seat) for (const [ox, oy] of SEATS.concat(SLEEP_SEATS)) { const x = at.x + ox, y = at.y + oy; if (!used.has(x + "," + y) && free(x, y)) { seat = { x, y }; break; } }
            if (!seat) return;
            used.add(seat.x + "," + seat.y);
            members.push({ kind, seat, mode: sit ? "sit" : "sleep", state: "alive", level: 0 });
        });
        if (!members.length) return null;
        const camp = { id: Date.now() % 1e9, mapId: $gameMap.mapId(), night: nightKey(), x: at.x, y: at.y, members, over: false, tag: opts.tag || "" };
        const sk = CAMP.sack, items = rollLoot(sk.loot).map(([id, n]) => [id, rnd(1, n)]);
        const sx = at.x + (Math.random() < 0.5 ? 1 : -1), sy = at.y + 1;
        camp.sack = addDrop({ kind: "sack", x: sx + 0.5, y: sy + 0.2, gold: rnd(sk.gold[0], sk.gold[1]), items, camp: camp.id, life: 30 }).id;
        return camp;
    }
    function removeCampSack(camp) {
        const d = dropsOf(camp.mapId).find(o => o.id === camp.sack);
        if (d) removeDrop(d);
    }
    let campSpawned = null;   // the camp whose men are on this map now
    function spawnCamp(camp) {
        campSpawned = camp;
        const band = makeBand([], { tag: camp.tag || "camp", camp });
        for (const mem of camp.members) {
            if (mem.state !== "alive") continue;
            const h = spawn(mem.kind, mem.seat.x, mem.seat.y, { band, level: mem.level || undefined, mode: mem.alert ? "idle" : mem.mode, tag: camp.tag || "camp" });
            if (!h) continue;
            mem.level = h._level;
            h._campRef = mem;
            h._seat = mem.seat;
            h._home = { x: mem.seat.x, y: mem.seat.y };
            h._seatF8 = octOf(camp.x - mem.seat.x, camp.y - mem.seat.y);
            h._faceAng = Math.atan2(camp.y - mem.seat.y, camp.x - mem.seat.x);
            h._chatT = rnd(120, 600);
            h._poseT = 999;   // (found sitting - not sitting down as the hero comes)
            if (h._mode === "sleep") h._seatF8 = octOf(mem.seat.x - camp.x, 0) === 4 ? 4 : 6;
        }
    }
    // each second: a new night may bring a camp (rolled once a night per map), dawn ends it
    function campCheck() {
        if (!auto || !$gameMap || mapOff()) return;
        const s = S(), id = $gameMap.mapId();
        let camp = s.camps[id];
        if (!nightNow()) {
            if (camp && !camp.none && !camp.over) endCamp(camp);
            return;
        }
        const key = nightKey();
        if (!camp || camp.night !== key) {
            const p = campChance(), rested = s.cleared[id] !== undefined && day() - s.cleared[id] < CAMP.rest;
            if (day() <= CAMP.calmDays || rested || !(p > 0) || Math.random() >= p) { s.camps[id] = { night: key, none: true }; return; }
            camp = s.camps[id] = makeCamp() || { night: key, none: true };
        }
        if (!camp.none && !camp.over && campSpawned !== camp) spawnCamp(camp);
    }
    // dawn: the band packs up - those not fighting go (off the screen at once, on it they walk off), the sack with them if any is left
    function endCamp(camp) {
        if (humans.some(h => h._campRef && camp.members.includes(h._campRef) && h._engaged)) return;   // (a fight still on: after it)
        camp.over = true;
        let alive = false;
        for (const h of humans.slice()) {
            if (!h._campRef || !camp.members.includes(h._campRef) || h._dead || h._surrendered) continue;
            alive = true;
            if (onScreen(h)) { h._leaveT = 0; h.setMode("leave"); } else removeHuman(h);
        }
        if (alive || camp.members.some(m => m.state === "alive")) removeCampSack(camp);
        if (campSpawned === camp) campSpawned = null;
    }
    // F9 / quests: a camp now (the hour put to the night when it is day), `near` tiles off at most
    function forceCamp(opts) {
        opts = opts || {};
        if (!nightNow()) $gameSystem.setDayNightHour ? $gameSystem.setDayNightHour(22) : 0;
        const s = S(), id = $gameMap.mapId();
        const camp = makeCamp(Object.assign({ far: opts.far || 9, near: opts.near || 16 }, opts));
        if (!camp) return null;
        s.camps[id] = camp;
        if (campSpawned && campSpawned !== camp) for (const h of humans.slice()) if (h._campRef) removeHuman(h);
        spawnCamp(camp);
        return camp;
    }
    const campHere = () => { const c = $gameMap ? S().camps[$gameMap.mapId()] : null; return c && !c.none && !c.over ? c : null; };

    // ---- a daytime ambush on the road (only where a map note <Ambush:x> or AMBUSH.maps says so)
    let ambushHour = null;
    function ambushCheck() {
        if (!auto || mapOff() || robbery) return;
        const now = day() * 24 + Math.floor(hour());
        if (ambushHour === now) return;
        ambushHour = now;
        const tag = T.mapTag("Ambush"), p = tag ? (/^off$/i.test(tag.raw) ? 0 : Number(tag.raw) || 0) : AMBUSH.maps[$gameMap.mapId()] || 0;
        const h = hour();
        if (!(p > 0) || h < AMBUSH.hours[0] || h >= AMBUSH.hours[1] || day() <= AMBUSH.calmDays || humans.length) return;
        if (Math.random() >= p) return;
        const n = rnd(AMBUSH.size[0], AMBUSH.size[1]), kinds = [];
        for (let i = 0; i < n; i++) kinds.push(i === n - 1 && Math.random() < AMBUSH.archer ? "archer" : KINDS.knifer && Math.random() < (AMBUSH.knife || 0) ? "knifer" : "bandit");
        ambush(kinds, { tag: "road" });
    }

    // ---- bandits for a sleeper (HumansData.RAID; Farming_Build.js asks nightRaid when he lies down outdoors, as it asks Hunting.js about
    // the wolves - the earlier of the two wakes him): the clock hour (day * 24 + hour) they come, or null; then raidBand puts them on the map
    function raidRate() {
        if (!RAID || !$gameMap || mapOff()) return 0;
        const tag = T.mapTag("Raid");
        if (tag) return /^off$/i.test(tag.raw) ? 0 : Math.max(0, Number(tag.raw) || 0);
        return campChance() > 0 ? RAID.perHour : 0;   // (where the camps are: the roads and the forests - not the town, not grandpa's field)
    }
    function raidChance(d, fire) {
        if (!RAID) return 0;
        const k = d <= RAID.calmDays ? RAID.calm : d >= RAID.fullDay ? 1 : RAID.calm + (1 - RAID.calm) * (d - RAID.calmDays) / (RAID.fullDay - RAID.calmDays);
        return raidRate() * k * (fire ? RAID.fire : 1) * (campHere() ? RAID.camp : 1);
    }
    function nightRaid(from, to, opts) {
        if (!auto || robbery || !(raidRate() > 0)) return null;
        for (let t = Math.floor(from) + 1; t < to; t++) {   // (the whole hours after lying down)
            const h = ((t % 24) + 24) % 24, inHours = RAID.from > RAID.to ? h >= RAID.from || h < RAID.to : h >= RAID.from && h < RAID.to;
            if (inHours && Math.random() < raidChance(Math.floor(t / 24), opts && opts.fire)) return t;
        }
        return null;
    }
    // the band that woke him: 2-3 men some tiles off (farther when the dog barked first), after him at once, with a word
    function raidBand(dogWarned, opts) {
        opts = opts || {};
        const R = RAID || { size: [2, 3], archer: 0.35, knife: 0.4, near: 8, dogNear: 13 }, want = dogWarned ? R.dogNear : R.near;
        const n = opts.size || rnd(R.size[0], R.size[1]), kinds = opts.kinds ? opts.kinds.slice() : [];
        if (!opts.kinds) for (let i = 0; i < n; i++) kinds.push(i === n - 1 && n > 1 && Math.random() < R.archer ? "archer" : KINDS.knifer && Math.random() < R.knife ? "knifer" : "bandit");
        const band = ambush(kinds, { tag: opts.tag || "raid", far: [Math.max(3, want - 2), want + 3], say: pick(LINES.raid || LINES.ambush) }) ||
            ambush(kinds, { tag: opts.tag || "raid", far: [3, want + 6], say: pick(LINES.raid || LINES.ambush) });
        if (!band) return null;
        band.raid = true;
        S().raids = (S().raids || 0) + 1;
        T.emit("humansRaid", { tag: band.tag, n: band.members.length, dog: !!dogWarned });
        return band;
    }

    // ==================================================================
    // The pictures: the camp fire (stones, logs, flames, smoke, its light at night), the sack, the bodies and piles, the arrows and the
    // archer's aim line, a sleeper's "z"
    // ==================================================================
    const bmpCache = {};
    function cached(key, make) { return bmpCache[key] || (bmpCache[key] = make()); }
    // the stone ring with logs and embers (pixel art, 2 px cells)
    function ringBitmap() {
        return cached("ring", () => {
            const b = new Bitmap(44, 26), c = b.context;
            const px = (x, y, col, w, h) => { c.fillStyle = col; c.fillRect(x, y, w || 2, h || 2); };
            c.fillStyle = "rgba(20,14,10,0.45)";
            c.beginPath(); c.ellipse(22, 15, 20, 9, 0, 0, Math.PI * 2); c.fill();
            for (let i = 0; i < 10; i++) {   // the stones
                const a = (i / 10) * Math.PI * 2, x = Math.round(22 + Math.cos(a) * 17) - 3, y = Math.round(14 + Math.sin(a) * 7.5) - 2;
                px(x - 1, y - 1, "#1e1a17", 8, 6);
                px(x, y, i % 3 ? "#7d7a74" : "#8e8a82", 6, 4);
                px(x, y, "#a9a59c", 2, 2);
            }
            px(12, 13, "#2a170c", 20, 4);   // the logs (two, crossed)
            px(13, 13, "#6a4022", 18, 2);
            px(19, 9, "#2a170c", 6, 10);
            px(20, 10, "#5a361d", 4, 8);
            for (const [x, y] of [[15, 15], [23, 12], [27, 15], [19, 16], [24, 16]]) px(x, y, "#ff7a1e");
            for (const [x, y] of [[17, 14], [25, 14], [21, 17]]) px(x, y, "#ffcf5a");
            b._baseTexture.update();
            return b;
        });
    }
    // the flames: tongues of fire in steps, FRAMES frames
    const FLAME_FRAMES = 8;
    function flameFrames() {
        return cached("flames", () => {
            const out = [];
            const LAYERS = [["#b8321a", 1, 0], ["#ee6a1a", 0.78, 2], ["#ffb43a", 0.55, 4], ["#fff1a6", 0.3, 6]];
            const TONGUES = [[-8, 0.55, 1.3], [-3, 1, 0.7], [3, 0.85, 1.9], [8, 0.5, 2.6]];
            for (let f = 0; f < FLAME_FRAMES; f++) {
                const b = new Bitmap(32, 36), c = b.context, ph = (f / FLAME_FRAMES) * Math.PI * 2;
                for (const [col, hk, inset] of LAYERS) {
                    c.fillStyle = col;
                    for (const [tx, th, p] of TONGUES) {
                        const h = Math.round((22 + 9 * Math.sin(ph * 1 + p) + 4 * Math.sin(ph * 2 + p * 1.7)) * th * hk);
                        const w = Math.max(2, Math.round((9 - inset) * (0.6 + 0.4 * th)));
                        for (let y = 0; y < h; y += 2) {
                            const k = 1 - y / Math.max(1, h), ww = Math.max(2, Math.round(w * k / 2) * 2), sway = Math.round(Math.sin(ph + y * 0.25 + p) * (y / 10));
                            c.fillRect(16 + tx - ww / 2 + sway, 34 - y, ww, 2);
                        }
                    }
                }
                b._baseTexture.update();
                out.push(b);
            }
            return out;
        });
    }
    function sackBitmap() {
        return cached("sack", () => {
            const b = new Bitmap(22, 24), c = b.context;
            const r = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
            r(3, 21, 16, 3, "rgba(20,14,10,0.45)");
            r(4, 8, 14, 14, "#1d140c");   // outline
            r(5, 9, 12, 12, "#8a6a42");
            r(5, 9, 4, 12, "#6e5233");
            r(13, 10, 3, 9, "#a5845a");
            r(7, 3, 8, 6, "#1d140c");
            r(8, 4, 6, 5, "#8a6a42");
            r(7, 7, 8, 2, "#3a2414");   // the rope
            r(15, 6, 3, 2, "#3a2414");
            b._baseTexture.update();
            return b;
        });
    }
    function bloodBitmap() {
        return cached("blood", () => {
            const b = new Bitmap(40, 14), c = b.context;
            c.fillStyle = "rgba(92,12,10,0.7)";
            c.beginPath(); c.ellipse(20, 7, 18, 5, 0, 0, Math.PI * 2); c.fill();
            c.fillStyle = "rgba(120,20,16,0.55)";
            c.beginPath(); c.ellipse(14, 6, 8, 3, 0, 0, Math.PI * 2); c.fill();
            b._baseTexture.update();
            return b;
        });
    }
    function textBitmap(text, size, color) {
        return cached("t:" + text + size + color, () => {
            const b = new Bitmap(24, size + 8);
            b.fontSize = size;
            b.fontBold = true;
            b.outlineColor = "rgba(0,0,0,0.85)";
            b.outlineWidth = 3;
            b.textColor = color;
            b.drawText(text, 0, 0, 24, size + 8, "center");
            return b;
        });
    }
    function updateZzz(h, sp, on) {
        if (!on) { if (h._zzz) h._zzz.visible = false; return; }
        if (!h._zzz || h._zzz.parent !== sp) {
            h._zzz = new Sprite(textBitmap("z", 14, "#dfe8ff"));
            h._zzz.anchor.set(0.5, 1);
            sp.addChild(h._zzz);
        }
        const t = (Graphics.frameCount + h._hid * 37) % 120;
        h._zzz.visible = true;
        h._zzz.x = 8 + Math.round(t / 12);
        h._zzz.y = -30 - Math.round(t / 5);
        h._zzz.opacity = t < 90 ? 230 : Math.round(230 * (1 - (t - 90) / 30));
    }
    // the layer in the tilemap: everything of this plugin that is not a character
    function Sprite_HumansLayer() {
        this.initialize(...arguments);
    }
    Sprite_HumansLayer.prototype = Object.create(Sprite.prototype);
    Sprite_HumansLayer.prototype.constructor = Sprite_HumansLayer;
    Sprite_HumansLayer.prototype.initialize = function(tilemap) {
        Sprite.prototype.initialize.call(this);
        this._tilemap = tilemap;
        this._drops = new Map();
        this._arrows = new Map();
        this._fire = null;
        this._aims = new Map();
        this._smoke = [];
        this._age = 0;
    };
    const toSX = x => Math.round($gameMap.adjustX(x - 0.5) * $gameMap.tileWidth() + $gameMap.tileWidth() / 2);
    const toSY = y => Math.round($gameMap.adjustY(y - 0.5) * $gameMap.tileHeight() + $gameMap.tileHeight() / 2);
    Sprite_HumansLayer.prototype.update = function() {
        Sprite.prototype.update.call(this);
        if (!$gameMap) return;
        this._age++;
        this.updateFire();
        this.updateDrops();
        this.updateArrowSprites();
        this.updateAims();
    };
    Sprite_HumansLayer.prototype.add = function(s, z) {
        s.z = z;
        this._tilemap.addChild(s);
        return s;
    };
    Sprite_HumansLayer.prototype.drop = function(s) { if (s && s.parent) s.parent.removeChild(s); };
    Sprite_HumansLayer.prototype.updateFire = function() {
        const camp = campHere();
        if (!camp) {
            if (this._fire) { for (const s of [this._fire.ring, this._fire.flame]) this.drop(s); for (const p of this._smoke) this.drop(p.s); this._smoke = []; this._fire = null; }
            return;
        }
        if (!this._fire || this._fire.camp !== camp) {
            if (this._fire) { this.drop(this._fire.ring); this.drop(this._fire.flame); }
            const ring = new Sprite(ringBitmap()), flame = new Sprite(flameFrames()[0]);
            ring.anchor.set(0.5, 0.75);
            flame.anchor.set(0.5, 1);
            this._fire = { camp, ring: this.add(ring, 1.8), flame: this.add(flame, 3) };
        }
        const F = this._fire, x = toSX(camp.x + 0.5), y = toSY(camp.y + 0.5);
        F.ring.x = x; F.ring.y = y + 6;
        F.flame.x = x; F.flame.y = y + 6;
        F.flame.bitmap = flameFrames()[Math.floor(this._age / 5) % FLAME_FRAMES];
        // a little smoke going up
        if (this._age % 14 === 0) {
            const s = new Sprite(cached("puff", () => { const b = new Bitmap(10, 10), c = b.context; c.fillStyle = "rgba(170,165,160,0.5)"; c.beginPath(); c.arc(5, 5, 4, 0, Math.PI * 2); c.fill(); b._baseTexture.update(); return b; }));
            s.anchor.set(0.5, 0.5);
            this._smoke.push({ s: this.add(s, 6), t: 0, x: camp.x + 0.5 + (Math.random() - 0.5) * 0.3, y: camp.y + 0.1, vx: 0.004 + Math.random() * 0.006 });
        }
        for (const p of this._smoke) {
            p.t++;
            p.x += p.vx;
            p.y -= 0.012;
            p.s.x = toSX(p.x); p.s.y = toSY(p.y) - 20;
            p.s.scale.set(0.8 + p.t / 60, 0.8 + p.t / 60);
            p.s.opacity = Math.round(150 * (1 - p.t / 90));
        }
        for (const p of this._smoke.filter(p => p.t >= 90)) this.drop(p.s);
        this._smoke = this._smoke.filter(p => p.t < 90);
        // the crackle, softer further off
        const dist = Math.hypot(camp.x + 0.5 - heroX(), camp.y + 0.5 - heroY());
        if (this._age % 50 === 0 && dist < 10) se("Fire1", Math.round(30 * (1 - dist / 10)), 80 + rnd(0, 30), panOf(camp.x + 0.5));
    };
    Sprite_HumansLayer.prototype.updateDrops = function() {
        const list = dropsOf(), seen = new Set();
        for (const d of list) {
            seen.add(d);
            let e = this._drops.get(d);
            if (!e) {
                const root = new Sprite();
                if (d.kind === "body") {
                    const blood = new Sprite(bloodBitmap());
                    blood.anchor.set(0.5, 0.5);
                    blood.y = 2;
                    root.addChild(blood);
                    const body = new Sprite(ImageManager.loadCharacter("anim8/" + (d.look || "Bandit") + "_Lie8"));
                    body.anchor.set(0.5, 1);
                    body.y = 10;
                    body.setFrame(0, (d.right ? 6 : 2) * 64, 64, 64);
                    body.setBlendColor([40, 20, 20, 70]);
                    root.addChild(body);
                } else if (d.kind === "sack") {
                    const s = new Sprite(sackBitmap());
                    s.anchor.set(0.5, 1);
                    s.y = 8;
                    root.addChild(s);
                } else {   // a pile: the items' icons on the ground
                    const set = ImageManager.loadSystem("IconSet");
                    (d.items || []).slice(0, 2).forEach(([id], i) => {
                        const it = $dataItems[id];
                        if (!it) return;
                        const s = new Sprite(set);
                        s.setFrame((it.iconIndex % 16) * 32, Math.floor(it.iconIndex / 16) * 32, 32, 32);
                        s.anchor.set(0.5, 0.5);
                        s.scale.set(0.75, 0.75);
                        s.rotation = 0.4 + i * 0.5;
                        s.x = i * 6;
                        root.addChild(s);
                    });
                }
                e = { root: this.add(root, d.kind === "sack" ? 3 : 2.2) };
                this._drops.set(d, e);
            }
            e.root.x = toSX(d.x);
            e.root.y = toSY(d.y);
            if (d.kind === "body" && e.root.children[1]) e.root.children[1].opacity = d.gold > 0 || (d.items || []).length ? 255 : 215;
        }
        for (const [d, e] of this._drops) if (!seen.has(d)) { this.drop(e.root); this._drops.delete(d); }
    };
    Sprite_HumansLayer.prototype.updateArrowSprites = function() {
        const seen = new Set();
        for (const a of arrows) {
            seen.add(a);
            let s = this._arrows.get(a);
            if (!s) {
                s = new Sprite(cached("arrow", () => {
                    const b = new Bitmap(22, 6), c = b.context;
                    c.fillStyle = "#2a1c14"; c.fillRect(0, 1, 22, 4);
                    c.fillStyle = "#b98a55"; c.fillRect(1, 2, 15, 2);
                    c.fillStyle = "#c9c9c0"; c.fillRect(16, 1, 5, 4); c.fillRect(21, 2, 1, 2);
                    c.fillStyle = "#7a9a6a"; c.fillRect(0, 0, 4, 1); c.fillRect(0, 5, 4, 1);
                    b._baseTexture.update();
                    return b;
                }));
                s.anchor.set(0.9, 0.5);
                s.rotation = Math.atan2(a.vy, a.vx);
                this._arrows.set(a, this.add(s, 5));
            }
            s.x = toSX(a.x);
            s.y = toSY(a.y);
        }
        for (const [a, s] of this._arrows) if (!seen.has(a)) { this.drop(s); this._arrows.delete(a); }
    };
    // the archer's aim: a thin line from his bow to where he aims - pale while he follows the hero, red once it is locked
    Sprite_HumansLayer.prototype.updateAims = function() {
        const seen = new Set();
        for (const h of humans) {
            if (h._mode !== "draw" || !h._aim) continue;
            seen.add(h);
            let g = this._aims.get(h);
            if (!g) { g = this.add(new PIXI.Graphics(), 7); this._aims.set(h, g); }
            const a = h._aim, x0 = toSX(h.centerX()), y0 = toSY(h.centerY()) - 18, x1 = toSX(a.x), y1 = toSY(a.y) - 10;
            const k = 1 - Math.max(0, h._modeT) / Math.max(1, h._modeLen), locked = a.locked;
            g.clear();
            g.lineStyle(locked ? 2 : 1, locked ? 0xff4b3e : 0xffe9a8, locked ? 0.85 : 0.2 + 0.4 * k);
            const n = 14, len = Math.hypot(x1 - x0, y1 - y0) || 1;
            for (let i = 0; i < n; i += 2) {   // (dashes)
                g.moveTo(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n);
                g.lineTo(x0 + (x1 - x0) * (i + 1) / n, y0 + (y1 - y0) * (i + 1) / n);
            }
            if (locked) { g.lineStyle(0); g.beginFill(0xff4b3e, 0.7); g.drawCircle(x1, y1, 3 + Math.abs(Math.sin(Graphics.frameCount / 3)) * 2); g.endFill(); }
            g.visible = len > 4;
        }
        for (const [h, g] of this._aims) if (!seen.has(h)) { this.drop(g); this._aims.delete(h); }
    };
    // the camp fire's light at night (Farming_Render.js's dark: its lights list gets the fire - glow and flicker like every flame)
    function campLights(set) {
        const camp = campHere();
        if (!camp) return [];
        const x = toSX(camp.x + 0.5), y = toSY(camp.y + 0.5);
        return [{ x, y: y - 8, r: 300, i: 1, id: 7100 + (camp.id % 100), gx: x, gy: y + 4, hf: 18, glow: true }];
    }

    // ==================================================================
    // The map drives it
    // ==================================================================
    let auto = true;   // tests switch the camps and ambushes off
    let pending = null;
    function clearAll() {
        for (const h of humans) {
            if (h._surrendered && !h._defeated && h._campRef) h._campRef.state = "fled";   // (left kneeling: he got away meanwhile)
            RoamingActor.dropSprite(h);
        }
        humans = [];
        bands = [];
        arrows = [];
        robbery = null;
        campSpawned = null;
        ambushHour = null;
    }
    T.on("load", clearAll, { owner: PLUGIN });
    T.on("mapEnter", () => { clearAll(); if ($gameSystem) rotDrops(); }, { owner: PLUGIN });
    // a noise (a blow, a shot, a fall): who hears it wakes up / turns round (Hunting.makeNoise tells the listeners)
    function heard(x, y, r) {
        for (const h of humans) {
            if (h._dead || h._engaged || h._surrendered) continue;
            const d = Math.hypot(h.centerX() - x, h.centerY() - y);
            if (d > r) continue;
            if (h._mode === "sleep" && r <= 3 && d > 1.3) continue;   // (a sleeper does not wake at a rustle - a sack taken, a blow from hiding - unless it is right by him)
            h._alarm = 240;
            h._aware = Math.max(h._aware, h._mode === "sleep" ? 0.5 : 0.75);
        }
    }
    let hooked = false;
    function hookHunting() {
        if (hooked) return;
        const Hn = H(), Cb = C();
        if (!Hn || !Hn.addTargets) return;
        hooked = true;
        registerLooks();
        // the hero's blows and shots find them (not one kneeling: a beggar is finished only by choice)
        Hn.addTargets(() => humans.filter(h => !h._dead && !h._surrendered && h._mode !== "flee" && h._mode !== "leave")
            .map(h => ({ x: h.centerX(), y: h.centerY() - 0.1, radius: h._def.radius, ref: h, hit: (d, how, extra) => hitHuman(h, d, how, extra) })));
        Hn.onNoise(heard);
        if (Cb && Cb.addFoes) Cb.addFoes(() => humans);
    }
    function summon() {
        const p = pending;
        pending = null;
        if (p === "bandit" || p === "knifer" || p === "archer" || p === "mercenary") {
            const h = spawnNear(p, p === "archer" ? 6 : 5, p === "archer" ? 8 : 7, { tag: "f9" });
            if (h) { h._summoned = true; popup(0, "Ktoś idzie... " + h._def.name.toLowerCase() + "!", "#ffd98f"); }
            else popup(0, "Nie ma tu miejsca", "#bcd8ff");
        } else if (p === "raid") {   // (as if he had been asleep: the band that came for the sleeper)
            if (raidBand(false, { tag: "f9" })) popup(0, "Ktoś się skradał do śpiącego...", "#ffd98f");
            else popup(0, "Nie ma tu miejsca na napad", "#bcd8ff");
        } else if (p === "ambush") {
            if (!ambush(["bandit", "bandit", "archer"], { tag: "f9" })) popup(0, "Nie ma tu miejsca na zasadzkę", "#bcd8ff");
        } else if (p === "camp") {
            if (forceCamp({ tag: "" })) popup(0, "Gdzieś między drzewami płonie ognisko...", "#ffd98f");
            else popup(0, "Nie ma tu miejsca na obóz", "#bcd8ff");
        }
    }
    let campWait = 0, rotWait = 0;
    T.onMapUpdate(scene => {
        if (!$gamePlayer || !$gameMap) return;
        hookHunting();
        if (pending) summon();
        if (--campWait <= 0) { campWait = 60; campCheck(); ambushCheck(); }
        if (--rotWait <= 0) { rotWait = 300; rotDrops(); }
        for (const h of humans) if (!h._sprite || !h._sprite.parent) RoamingActor.addSprite(h);
        updateRobbery();
        checkOffer(scene);
    }, { owner: PLUGIN, name: "update" });

    // ------------------------------------------------------------------
    // Engine hooks
    // ------------------------------------------------------------------
    // the men and the arrows move with the map (inside its update: they hold still with the world in Combat.js's hitstop)
    const _Game_Map_update = Game_Map.prototype.update;
    Game_Map.prototype.update = function(sceneActive) {
        _Game_Map_update.call(this, sceneActive);
        if (robbery) return;
        for (const h of humans.slice()) h.update();
        updateArrows();
        updateBands();
    };
    // their sprites when the spriteset is (re)built; the layer of fires, drops, arrows and aim lines; the camp fire's light
    const _Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        _Spriteset_Map_createCharacters.call(this);
        for (const h of humans) { h._sprite = null; h._markSprite = null; h._zzz = null; RoamingActor.addSprite(h, this); }
        this._humansLayer = new Sprite_HumansLayer(this._tilemap);
        this._tilemap.addChild(this._humansLayer);
        const nl = this._nightLight;
        if (nl && typeof nl.lights === "function" && !nl._humansLit) {
            const base = nl.lights;
            nl.lights = function() { const out = base.call(this); try { out.push(...campLights(this._spriteset)); } catch (e) { /* no camp light this frame */ } return out; };
            nl._humansLit = true;
        }
    };
    // the action button by a body, a dropped weapon, a camp's sack: searched
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
    };

    // ------------------------------------------------------------------
    // API (window.Humans)
    // ------------------------------------------------------------------
    window.Humans = T.register(PLUGIN, {
        KINDS, BAND, CAMP, AMBUSH, LOOKS, Game_Human,
        get list() { return humans; }, get bands() { return bands; }, get arrows() { return arrows; }, get robbery() { return robbery; },
        get pending() { return pending; }, set pending(v) { pending = v; },
        auto: v => { auto = !!v; }, state: S, spawn, spawnNear, ambush, makeBand, camp: forceCamp, campHere, campCheck, makeCamp, endCamp, nightKey,
        RAID, nightRaid, raidBand, raidChance, raidRate,
        band: tag => bands.find(b => b.tag === tag) || null,
        clear: tag => { for (const h of humans.slice()) if (!tag || h._tag === tag) removeHuman(h); },
        hit: hitHuman, kill, surrender, decide, offerChoice, drops: () => dropsOf(), dropAhead, searchDrop, removeDrop, beatenBy, campChance,
        humans: () => humans,
        // (2026-10-06, Act3.js - the tavern's defenders) a man's foe other than the hero (null: the hero again; never an archer - he
        // shoots the hero), the march to a place (his home: he walks there, fights who he meets, comes back to it), a man taken off
        // the map (gone through a door: no body, his band told)
        setFoe(h, foe) {
            if (!h || h._dead || (foe && (h._kind === "archer" || h._surrendered))) return false;
            h._foe = foe || null;
            if (foe && !h._engaged) h.engage(false);
            return true;
        },
        foeOf: h => (h ? foeOf(h) : null),
        march(h, x, y) {
            if (!h || h._dead) return false;
            h._home = { x, y };
            h._seat = null;
            if (!h._engaged && !h._surrendered && h._mode !== "flee" && h._mode !== "leave") { h._returnT = 0; h.setMode("return"); }
            return true;
        },
        remove(h) { if (!h || h._dead) return false; endTurn(h); removeHuman(h); bandCheck(h._band); return true; }
    });
})();
