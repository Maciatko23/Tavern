// The balance check of the fights (docs/WALKA.md "Próba sił"): a bot plays the hero against each band's creatures of the underground,
// each boss, and the men, with a hero of the level and the gear a player would have there (the curve below - from the experience the
// floors give, Combat.js xpToNext). The bot fights as a fair player does: it goes in and strikes (combos; heavy blows at a plate's front,
// round to the back of the armour and the stone), and reads the shown attacks - it rolls out of a wind-up, a ring on the floor, a charge
// line, a dive, a web or an arrow in flight - but only SKILL of the time (it misses some, as anyone does). It does not eat or bandage:
// the life it lost is counted, and below REFILL of it it gets its life back (a "refill" - what a player pays in food and bandages).
// Not a pass / fail test (not *_test.js): it prints the table and writes tests/balance/wyniki.json.
//
//   CDP_PORT=9465 node tests/combat_balance.js [filter|filter...] [--skill 0.75] [--reps 2] [--speed 4] [--limit 240] [--grow '{"dmg":0.05}']
// (--grow: CreaturesData.GROW for this run - the old rates were {"hp":0.12,"bossHp":0.06,"dmg":0.1,"str":0.035})
"use strict";
const fs = require("fs");
const path = require("path");
const kit = require("./lib/kit.js");

const argv = process.argv.slice(2);
const opt = (name, def) => { const i = argv.indexOf("--" + name); if (i < 0) return def; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const SKILL = Number(opt("skill", 0.75));
const REPS = Number(opt("reps", 2));
const SPEED = Number(opt("speed", 4));
const GROW = opt("grow", "");
const SET = opt("set", "");   // (a trial of the bosses' / kinds' numbers: '{"boss_70":{"dmg":0.9},"kamiennik":{"moves":{"slam":{"dmg":18}}}}')
const LIMIT = Number(opt("limit", 240));   // seconds of game time a fight may last
const FILTER = argv[0] || "";

// the hero at each depth: level, attributes (3 points a level: Siła 35%, Kondycja 30%, Zręczność 15%, Czujność 10%, Hart ducha 10% -
// deeper Hart ducha 15%), the weapon in hand (60 stone axe, 115 iron axe), the wooden shield 155, the leather jacket 171
function heroAt(level, opts = {}) {
    const pts = 3 * (level - 1), w = opts.wil || 0.1, split = { str: 0.35, con: 0.3, dex: 0.15, per: 0.2 - w, wil: w };
    const attr = {};
    let left = pts;
    for (const k of ["str", "con", "dex", "per", "wil"]) { attr[k] = Math.min(60, 5 + Math.floor(pts * split[k])); left -= attr[k] - 5; }
    attr.str = Math.min(60, attr.str + Math.max(0, left));
    return { level, attr, weapon: opts.weapon || 115, shield: opts.shield !== false, jacket: opts.jacket !== false };
}
// the fights: [name, depth (floor), spawn kind, level of it, the hero, opts]
const FIGHTS = [
    ["Rój szczurów (piętro 5)", 5, "szczur", 6, heroAt(4, { weapon: 60, jacket: false }), { count: 4 }],
    ["Pająk (piętro 5)", 5, "pajak", 6, heroAt(4, { weapon: 60, jacket: false })],
    ["Strażnik bramy (piętro 10)", 10, "guardian", 9, heroAt(6)],
    ["Pusta zbroja (piętro 20)", 20, "zbroja", 13, heroAt(9)],
    ["Pająk (piętro 20)", 20, "pajak", 13, heroAt(9)],
    ["Przeor w zbroi (boss 20)", 20, "boss_20", 14, heroAt(9)],
    ["Królowa szczurów (boss 30)", 30, "boss_30", 19, heroAt(12)],
    ["Topielec (piętro 40)", 40, "topielec", 23, heroAt(15)],
    ["Rój nietoperzy (piętro 40)", 40, "nietoperz", 22, heroAt(15), { count: 4 }],
    ["Matka pająków (boss 40)", 40, "boss_40", 24, heroAt(15)],
    ["Topielec z głębiny (boss 50)", 50, "boss_50", 29, heroAt(17)],
    ["Kamiennik (piętro 60)", 60, "kamiennik", 33, heroAt(19)],
    ["Pusta zbroja (piętro 60)", 60, "zbroja", 33, heroAt(19)],
    ["Kamienny Odźwierny (boss 60)", 60, "boss_60", 34, heroAt(19)],
    ["Zbroja bez herbu (boss 70)", 70, "boss_70", 39, heroAt(21)],
    ["Upiór prawdy (piętro 85)", 85, "upior", 46, heroAt(24, { wil: 0.15 })],
    ["Cień (piętro 85)", 85, "cien", 46, heroAt(24, { wil: 0.15 })],
    ["Upiór pytającego (boss 80)", 80, "boss_80", 45, heroAt(23, { wil: 0.15 })],
    ["Ostatni Strażnik (boss 90)", 90, "boss_90", 50, heroAt(25, { wil: 0.15 })],
    ["Bandyta + nożownik (droga, poz. 2)", 0, "h:bandit,knifer", 2, heroAt(3, { weapon: 60, jacket: false })],
    ["Najemnik (droga, poz. 4)", 0, "h:mercenary", 4, heroAt(5)]
];

// the bot, inside the game's loop (CDP round trips are far too slow for a roll in time)
const BOT = String.raw`(function(){
    if (window.__bot) return 0;
    const B = window.__bot = { by: {}, on: false, skill: 0.75, t: 0, refill: 0.3, lost: 0, refills: 0, hitsTaken: 0, dodged: 0, tried: new Map(), rollT: 0, oT: 0, heavyT: 0, mode: "", log: [] };
    const KEYS = ["left", "right", "up", "down", "dodge", "keyO", "keyP"];
    const hx = () => $gamePlayer._realX + 0.5, hy = () => $gamePlayer._realY + 0.5;
    const F = () => Combat;
    // the life lost (the bus: every blow that got through)
    Tawerna.on("heroHit", e => { if (B.on && B.debug) B.log.push([B.t, "HIT", e.result, e.damage, e.by, (Combat.act || {}).mode].join(" ")); if (!B.on) return; if (e.damage > 0) { B.lost += e.damage; B.hitsTaken++; const k = e.name || e.by || "?"; B.by[k] = (B.by[k] || 0) + e.damage; } if (e.result === "dodged") B.dodged++; }, { owner: "Balance" });
    const _gain = Game_Battler.prototype.gainHp;
    Game_Battler.prototype.gainHp = function(v) {   // (every life lost - the blows, the choke, a bite up the thread, a question)
        const lead = B.on && this === $gameParty.leader();
        if (lead && v < 0) B.lostRaw = (B.lostRaw || 0) + Math.min(-v, this.hp);
        const r = _gain.call(this, v);
        if (lead && this.hp <= 0) { B.refills++; this.setHp(this.mhp); }   // (no game over in the trial: a "refill" instead)
        return r;
    };
    function arrows(want, vx, vy) {
        const d = Math.hypot(vx, vy);
        if (d < 0.01) return;
        vx /= d; vy /= d;
        if (vx < -0.38) want.left = true;
        if (vx > 0.38) want.right = true;
        if (vy < -0.38) want.up = true;
        if (vy > 0.38) want.down = true;
    }
    // a threat it may roll from: once per thing (the bot "sees" SKILL of them in time)
    function sees(key) {
        if (!B.tried.has(key)) B.tried.set(key, Math.random() < B.skill);
        return B.tried.get(key);
    }
    function foes() {
        return Combat.foes().filter(f => !f._dead && !f._dying && !f._gone && !(f._surrendered) && (f._hp > 0 || f._mode === "collapsed"));
    }
    // the way out of a line from (x, y) along (lx, ly): to the side the hero is already on
    function sideOf(x, y, lx, ly) {
        const rx = hx() - x, ry = hy() - y, cross = rx * ly - ry * lx;
        return cross >= 0 ? [ly, -lx] : [-ly, lx];
    }
    // what is coming at him: { dir: the way out, left: frames before it lands, see: he reads it in time (SKILL), block: a guard holds it }
    function threat() {
        const C = window.Creatures, H = window.Humans;
        B.coming = false;
        // an enemy's blow under way (wind-up / a ring on the floor) with the hero in its reach (the creatures' own list too: a bat high up
        // is no foe for the bars, but its dive comes all the same)
        const all = foes();
        if (C) for (const c of C.list) if (!all.includes(c) && !c._dead && !c._dying) all.push(c);
        for (const f of all) {
            const m = f._mode;
            if ((m === "windup" || m === "answer" || m === "slamUp") && f._lock !== undefined) {
                const def = f.moveDef ? f.moveDef() : f.blowDef ? f.blowDef() : null, reach = def ? (def.reach || def.radius || 2) : 2;
                const sc = Math.max(1, (f._scale || 1) * 0.85), dx = hx() - f.centerX(), dy = hy() - f.centerY(), d = Math.hypot(dx, dy);
                const left = (f._modeT || 0) + ((def && def.hitAt) || 3);
                if (d < reach * sc + 1.2) {
                    if (left <= 30) B.coming = true;   // (no new swing into a shown blow)
                    if (left <= 11 && sees("w" + (f._cid || f._hid || f._eventId || 0) + ":" + (f._windT = f._windT || Graphics.frameCount))) {
                        const l = f._lock || [dx / (d || 1), dy / (d || 1)], s = sideOf(f.centerX(), f.centerY(), l[0], l[1]);
                        return [s[0] + l[0] * 0.6, s[1] + l[1] * 0.6];
                    }
                }
            } else f._windT = 0;
            if ((m === "charge" || m === "ram") && f._lock && f._modeT > 0 && f._modeT <= 10) {
                const dx = hx() - f.centerX(), dy = hy() - f.centerY(), along = dx * f._lock[0] + dy * f._lock[1], perp = Math.abs(dx * f._lock[1] - dy * f._lock[0]);
                if (along > 0 && perp < 1.3 && sees("c" + (f._cid || 0) + ":" + (f._chargeKey = f._chargeKey || Graphics.frameCount))) return sideOf(f.centerX(), f.centerY(), f._lock[0], f._lock[1]);
            } else if (m !== "charge" && m !== "ram") f._chargeKey = 0;
            if (m === "dive" && f._modeT > 0 && f._modeT <= 8 && f._lock) {
                const dx = hx() - f.centerX(), dy = hy() - f.centerY(), perp = Math.abs(dx * f._lock[1] - dy * f._lock[0]);
                if (perp < 1.0 && sees("d" + f._cid + ":" + (f._diveKey = f._diveKey || Graphics.frameCount))) return sideOf(f.centerX(), f.centerY(), f._lock[0], f._lock[1]);
            } else if (m !== "dive") f._diveKey = 0;
        }
        if (C) {
            for (const r of C.rings) {   // a slam's, a staff's ring; a drop's shadow; a thread
                if (!(r.kind === "warn" || r.kind === "shadow" || r.kind === "thread" || r.kind === "rock")) continue;
                const d = Math.hypot(hx() - r.x, hy() - r.y), left = r.life - r.t;
                if (d < r.r + 0.5 && left <= 30) B.coming = true;
                if (d < r.r + 0.5 && left <= 12 && sees("r" + C.rings.indexOf(r) + ":" + r.life + ":" + Math.round(r.x * 10))) {
                    if (d > 0.35) return [(hx() - r.x) / d, (hy() - r.y) / d];
                    // (a ring under him - the prior's staff, a drop's shadow: out of it away from the nearest foe, not into it)
                    const n = foes().sort((a, b) => Math.hypot(a.centerX() - hx(), a.centerY() - hy()) - Math.hypot(b.centerX() - hx(), b.centerY() - hy()))[0];
                    if (!n) return [1, 0];
                    const ax = hx() - n.centerX(), ay = hy() - n.centerY(), ad = Math.hypot(ax, ay) || 1;
                    return [ax / ad - ay / ad * 0.5, ay / ad + ax / ad * 0.5];
                }
            }
            for (const w of C.waves || []) {   // the doorkeeper's rings of shards: roll through as it reaches him
                if (w.delay > 0 || w.hit) continue;
                const d = Math.hypot(hx() - w.x, (hy() - w.y) / 0.8);
                if (d - w.r > 0 && d - w.r < 0.9 && sees("v" + Math.round(w.x * 10) + ":" + w.delay + ":" + (w.key = w.key || Graphics.frameCount))) return [w.x - hx() || 1, w.y - hy()];
            }
            for (const w of C.webs) {   // a web in flight
                const dx = hx() - w.x, dy = hy() - w.y, along = dx * w.vx + dy * w.vy, perp = Math.abs(dx * w.vy - dy * w.vx);
                if (along > 0 && along < 2.2 && perp < 0.7 && sees("b" + (w.key = w.key || Math.random()))) return sideOf(w.x, w.y, w.vx, w.vy);
            }
        }
        if (H) for (const a of H.arrows) {
            const dx = hx() - a.x, dy = hy() - a.y, along = dx * a.vx + dy * a.vy, perp = Math.abs(dx * a.vy - dy * a.vx);
            if (along > 0 && along < 3 && perp < 0.7 && sees("a" + (a.key = a.key || Math.random()))) return sideOf(a.x, a.y, a.vx, a.vy);
        }
        return null;
    }
    // whom to hit: the nearest that a blade reaches (a bat high up, a hidden wraith: not)
    function target() {
        let best = null, bd = 1e9;
        for (const f of foes()) {
            if (f.targetable && !f.targetable(false)) continue;
            if (f._hidden) continue;
            const d = Math.hypot(f.centerX() - hx(), f.centerY() - hy());
            if (d < bd) { bd = d; best = f; }
        }
        return best;
    }
    B.frame = function() {
        const I = Input._currentState, want = {}, act = Combat.act || (Tawerna.api("Combat_parts").fight.act), C = window.Creatures;
        B.t++;
        const a = $gameParty.leader();
        if (a.hp < a.mhp * B.refill) { B.refills++; a.setHp(a.mhp); }
        if ((C && (C.grab || C.pull))) {   // held: O again and again
            if (B.t % 4 < 2) want.keyO = true;
        } else if (act.stun > 0 || act.mode === "roll") {
            // nothing to do
        } else {
            const out = threat();
            if (!out) B.armT = 0;
            if (B.debug && (out || B.coming) && B.t % 2 === 0) B.log.push([B.t, out ? "out" : "coming", act.mode, Math.round(Combat.breath), B.rollT, Combat.foes().map(f => f._mode + ":" + f._modeT).join(",")].join(" "));
            if (out && (Combat.winded || Combat.breath < 22)) { if (Combat.shield()) want.keyP = true; B.mode = "guard"; }   // (no breath for a roll: the shield)
            else if (out) {
                // the arrows first, the roll a frame later (the roll goes the way the arrows held the frame before - Input reads them
                // before the scene's update); pressed again a moment later if a swing did not let it go
                arrows(want, out[0], out[1]);
                if (++B.armT >= 2 && B.rollT <= 0) { want.dodge = true; B.rollT = 3; }
                B.mode = "roll";
            } else {
                const t = target();
                if (!t) {   // nothing to hit now (a bat up high, a wraith unseen): keep moving round slowly
                    if (B.t % 120 < 40) arrows(want, Math.cos(B.t / 60), Math.sin(B.t / 60));
                } else {
                    const tx = t.centerX(), ty = t.centerY(), dx = tx - hx(), dy = ty - hy(), d = Math.hypot(dx, dy) || 1;
                    const w = Combat.MELEE[Combat.handMelee()] || { reach: 1.4 }, reach = w.reach + (t._radius || (t._def && t._def.radius) || 0.5) * 0.5 - 0.1;
                    const fa = t._faceAng !== undefined ? t._faceAng : Math.atan2(-dy, -dx), fx = Math.cos(fa), fy = Math.sin(fa);
                    const front = (-dx * fx + -dy * fy) / d;   // (the hero in front of it: > 0)
                    const armoured = t._def && ((t._def.plate && !(t._boss && t._boss.noPlate)) || t._def.stone) && !t._stoneStunned && t._stun <= 0 && t._mode !== "collapsed";
                    let gx = tx - dx / d * (reach - 0.35), gy = ty - dy / d * (reach - 0.35);
                    if (armoured && front > -0.2) {   // round to its back (by its side)
                        const s = sideOf(tx, ty, fx, fy), side = [tx + s[0] * 1.5 - fx * 0.6, ty + s[1] * 1.5 - fy * 0.6], back = [tx - fx * 1.3, ty - fy * 1.3];
                        [gx, gy] = front > 0.5 ? side : back;
                    }
                    const winded = Combat.winded || Combat.breath < 12;
                    // in front of a stone / a plate, close: a roll past its side towards its back (what a player does - it turns slowly; not
                    // through it: a roll into a body bounces off it and hurts), with breath kept for a roll away from its blows
                    const rollPast = armoured && front > 0.35 && d < 2.4 && d > 1.0 && Combat.breath > 70 && B.passT <= 0 && !B.coming;
                    if (winded) { arrows(want, -dx, -dy); B.mode = "breath"; }
                    else if (rollPast) {
                        const sd = sideOf(tx, ty, fx, fy);   // (its side the hero is on: across its front, a little past it)
                        arrows(want, sd[0] - fx * 0.5, sd[1] - fy * 0.5);
                        if (++B.passArm >= 2) { want.dodge = true; B.passT = 50; B.passArm = 0; }
                        B.mode = "past";
                    }
                    else if (d <= reach + 0.15 && (!armoured || front <= 0.1 || B.heavyT > 0)) {
                        // in reach: strike (a heavy blow at an armour's front when getting round takes too long) - not into a blow it shows,
                        // and with breath kept for a roll
                        // (one that parries light blows from the front - the armour without arms: heavy blows, as its rule says)
                        if (B.heavyT <= 0 && t._boss && t._boss.parry && act.mode === "idle" && !B.coming && Combat.breath > 45 && front > 0.2) B.heavyT = 42;
                        if (B.heavyT > 0) { want.keyO = true; if (--B.heavyT === 0) B.oT = 0; }
                        else if ((!B.coming && Combat.breath > 38) || act.mode === "attack") { if (++B.oT % 6 < 3) want.keyO = true; }
                        B.mode = "hit";
                    } else {
                        arrows(want, gx - hx(), gy - hy());
                        B.mode = "go";
                        if (armoured && d < reach + 0.6 && (B.stuckT = (B.stuckT || 0) + 1) > 150) { B.stuckT = 0; B.heavyT = 42; }
                    }
                }
            }
        }
        if (B.rollT > 0) B.rollT--;
        if (B.passT > 0) B.passT--;
        for (const k of KEYS) I[k] = !!want[k];
    };
    const _up = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() { if (B.on && B.frame) B.frame(); _up.call(this); };
    return 0;
})()`;

kit.test({ port: 9465 }, async t => {
    t.check("a new game on the meadow (Map004), 12:00", await t.newGame({ map: 4, x: 20, y: 14, hour: 12, quiet: true }));
    await t.eval("Hunting.RAID.perHour = 0; Creatures.auto(false); Humans.auto(false); Combat.setCombatMode(true); 0");
    if (GROW) await t.eval(`Object.assign(CreaturesData.GROW, ${GROW}); 0`);
    if (SET) await t.eval(`(function(){ const deep = (a, b) => { for (const k of Object.keys(b)) { if (b[k] && typeof b[k] === "object" && !Array.isArray(b[k]) && a[k] && typeof a[k] === "object") deep(a[k], b[k]); else a[k] = b[k]; } };
        const v = ${SET}; for (const k of Object.keys(v)) deep(CreaturesData.BOSSES[k] || CreaturesData.KINDS[k] || HumansData.KINDS[k], v[k]); return 0; })()`);
    await t.eval(BOT);
    const room = await t.json(`(function(){
        const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.hasObjectTile(x, y) && !Farming.buildingAt(x, y);
        let best = null;
        for (let y = 7; y < $gameMap.height() - 7; y++) for (let x = 9; x < $gameMap.width() - 9; x++) {
            let ok = true;
            for (let dx = -7; dx <= 7 && ok; dx++) for (let dy = -3; dy <= 3; dy++) if (!free(x + dx, y + dy)) { ok = false; break; }
            if (ok && (!best || Math.abs(x - $gameMap.width() / 2) < Math.abs(best.x - $gameMap.width() / 2))) best = { x, y };
        }
        return best; })()`);
    t.check("an open field 15 x 7", !!room, room);
    // (a wall round the field: the creatures' charges and rams end in it, as in their rooms underground)
    await t.eval(`SceneManager.determineRepeatNumber = function() { return ${SPEED}; }; 0`);
    const rows = [];
    for (const [name, floor, kind, level, hero, opts = {}] of FIGHTS) {
        if (FILTER && !FILTER.split("|").some(f => name.toLowerCase().includes(f.toLowerCase()) || kind.indexOf(f) >= 0)) continue;   // (a|b|c: any of them)
        const runs = [];
        for (let rep = 0; rep < REPS; rep++) {
            await t.eval(`(function(){
                Creatures.clear(); Humans.clear(); for (const l of [Creatures.drops(), Humans.drops()]) l.length = 0; Combat.resetAct();
                const h = Combat.hero(); h.level = ${hero.level}; h.attr = ${JSON.stringify(hero.attr)}; h.points = 0; h.skillPoints = 0; h.skills = {}; h.rev = (h.rev || 0) + 1;
                for (const id of [60, 63, 115, 116, 155, 171, 156, 154, 125, 126]) $gameParty.loseItem($dataItems[id], 99);
                $gameParty.gainItem($dataItems[${hero.weapon}], 1); if (${hero.shield}) $gameParty.gainItem($dataItems[155], 1); if (${hero.jacket}) $gameParty.gainItem($dataItems[171], 1);
                const a = $gameParty.leader(); a.refresh(); a.recoverAll(); $gameSystem.setStamina(100);
                $gamePlayer.locate(${room.x - 3}, ${room.y}); $gamePlayer.setDirection(6); $gameMap.setDisplayPos(${room.x} - 13, ${room.y} - 7);
                const kind = ${JSON.stringify(kind)}, out = [];
                if (kind.indexOf('h:') === 0) { for (const [i, k] of kind.slice(2).split(',').entries()) out.push(Humans.spawn(k, ${room.x + 3}, ${room.y} - 1 + i * 2, { level: ${level}, engaged: true, noSurrender: true })); }
                else out.push(Creatures.spawn(kind, ${room.x + 3}, ${room.y}, { level: ${level}, engaged: true, count: ${opts.count || 0} || undefined, tag: 'bal' }));
                const B = window.__bot; B.log = []; B.debug = ${!!process.env.BOTLOG}; Object.assign(B, { on: true, skill: ${SKILL}, t: 0, lost: 0, lostRaw: 0, refills: 0, hitsTaken: 0, dodged: 0, rollT: 0, armT: 0, oT: 0, heavyT: 0, passT: 0, passArm: 0, by: {} }); B.tried.clear();
                window.__fight = { t0: Graphics.frameCount, hp0: Creatures.list.concat(Humans.list).reduce((s, c) => s + (c._maxHp || 0), 0) };
                return 0; })()`);
            const res = await t.json(`new Promise(res => { const iv = setInterval(() => {
                // (the creatures' own list: a bat high up, a spider under the vault, the drowned one under the water are still there)
                const live = Creatures.list.filter(c => !c._dead && !c._dying && !c._gone).concat(Humans.list.filter(h => !h._dead && !h._surrendered && h._mode !== 'flee' && h._mode !== 'leave'));
                const el = __bot.t;   // (the game's own frames: the bot counts them, SPEED of them a screen frame)
                if (!live.length || el > ${LIMIT * 60} || SceneManager._scene.constructor !== Scene_Map) {
                    clearInterval(iv);
                    const B = __bot; B.on = false; for (const k of ["left", "right", "up", "down", "dodge", "keyO", "keyP"]) Input._currentState[k] = false;
                    const a = $gameParty.leader();
                    res({ won: !live.length, s: Math.round(el / 6) / 10, lost: Math.max(B.lost, B.lostRaw || 0), mhp: a.mhp, refills: B.refills, hits: B.hitsTaken, dodged: B.dodged,
                        left: live.map(f => f._kind + ':' + Math.round(f._hp) + '/' + f._maxHp).join(' '), by: B.by, foeHp: __fight.hp0, scene: SceneManager._scene.constructor.name });
                } }, 50); })`, (LIMIT * 60 / SPEED / 60 + 30) * 1000);
            runs.push(res);
            if (process.env.BOTLOG) console.log((await t.json("__bot.log")).slice(0, 400).join(String.fromCharCode(10)));
            console.log("   " + name + " #" + (rep + 1) + ": " + JSON.stringify(res));
            await t.frames(10);
        }
        const avg = k => Math.round(runs.reduce((s, r) => s + r[k], 0) / runs.length * 10) / 10;
        rows.push({ name, floor, kind, level, hero: hero.level, attr: hero.attr, weapon: hero.weapon, won: runs.filter(r => r.won).length + "/" + runs.length,
            s: avg("s"), lostPct: Math.round(runs.reduce((s, r) => s + r.lost / r.mhp, 0) / runs.length * 100), refills: avg("refills"), mhp: runs[0].mhp, foeHp: runs[0].foeHp });
    }
    console.log("\n| Walka | Wróg (poz.) | Bohater (poz., Siła/Kond.) | Wygrane | Czas [s] | Stracone życie [% max] | Odnowienia |");
    console.log("|---|---|---|---|---|---|---|");
    for (const r of rows) console.log(`| ${r.name} | ${r.level} (${r.foeHp} życia) | ${r.hero} (${r.attr.str}/${r.attr.con}, ${r.mhp} życia) | ${r.won} | ${r.s} | ${r.lostPct} | ${r.refills} |`);
    fs.mkdirSync(path.join(__dirname, "balance"), { recursive: true });
    fs.writeFileSync(path.join(__dirname, "balance", "wyniki" + (FILTER ? "_" + FILTER.replace(/\W+/g, "_") : "") + ".json"), JSON.stringify({ skill: SKILL, grow: GROW || null, rows }, null, 1));
    t.check("the fights ran", rows.length > 0);
});
