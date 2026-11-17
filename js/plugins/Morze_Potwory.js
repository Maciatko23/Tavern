//=============================================================================
// Morze_Potwory.js
//=============================================================================
// The creatures of the sea (docs/POTWORY_Z_MORZA.md 4, 5, 7; 2026-11-12: the drowned soldiers of the war): the kinds are put into Creatures' tables
// (KINDS, AI, LOOKS) so that they use the stock fight - the ring of the rats for the clubs (a pair: one strikes, the other waits), the grab and the
// slam of the drowned for the crabs - with what is new here being the sword's combo, the spear's distance, the hammer's guard-breaking blow, the
// captain's mind, the fear of fire, the retreat to the water, the wet tracks and bones on the shore, the kraken's tentacles (an animated water
// object, twice the size) and the town's watch. No per-frame scans: the
// sea creatures (at most five) are looked at every 15th frame, the tracks and the tentacles live in small lists that are empty most of the time.
// The chance, the nights, the thread: Morze.js. The data: Morze_Data.js.

/*:
 * @target MZ
 * @plugindesc [W23] Potwory z morza: szkielety (pałka, miecz, włócznia, młot, kapitan z chorągwią), kraby i krab-kolos, duże macki krakena, ślady i kości, odwrót do wody o świcie, straż w mieście. v1.1.0
 * @author Claude
 * @base TawernaCore
 * @base Creatures
 * @base Morze_Data
 * @orderAfter Creatures
 * @orderAfter Poselstwo
 *
 * @help
 * Silnik stworów morza. Szansa i wątek: Morze.js. API: window.MorzePotwory.
 */

(() => {
    "use strict";
    const T = window.Tawerna, D = window.MorzeData;
    if (!T || !D) throw new Error("Morze_Potwory.js: brak TawernaCore.js / Morze_Data.js - muszą być wyżej na liście wtyczek");
    const PLUGIN = "Morze_Potwory";
    const w = D.watek;
    const tx = k => w.tekst(k);
    const has = () => !!window.$gameMap && !!window.$gamePlayer && !!window.$gameSystem;
    const Cr = () => window.Creatures;
    const Cb = () => T.api("Combat");
    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const pick = T.util.pick;
    const se = (name, volume, pitch, pan) => T.audio.se(name, { volume, pitch, pan: pan || 0 });
    const heroX = () => $gamePlayer._realX + 0.5, heroY = () => $gamePlayer._realY + 0.5;
    const tw = () => $gameMap.tileWidth(), th = () => $gameMap.tileHeight();
    const panOf = x => Math.max(-80, Math.min(80, Math.round((x - heroX()) * 12)));
    const numberAt = (x, y, text, color, scale) => { const C = Cb(); if (C && C.numberAt) C.numberAt(x, y, text, color, scale); };
    const sparksAt = (x, y, color, n) => { const C = Cb(); if (C && C.sparksAt) C.sparksAt(x, y, color, n); };
    const report = (where, e) => console.error("[Morze_Potwory] " + where + ":", e);
    const DIR_OF = (dx, dy) => (Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 4 : 6) : (dy < 0 ? 8 : 2));
    const TAG = "morze";

    // ==================================================================
    // 1. The looks, the kinds, the minds (put into Creatures' tables)
    // ==================================================================
    // (the Atk8 sheets: 8 frames; `raise` the wound-up frame, `hit` the frame of the blow - per weapon)
    const LOOKS = {
        SeaCrab: { cell: 96, stride: 1.2, turn: 3, atk: { cell: 96, raise: 3, hit: 5 }, die: { cell: 96 } },
        SkClub: { cell: 96, stride: 1.7, turn: 2, atk: { cell: 96, raise: 3, hit: 5 }, die: { cell: 96 } },
        SkSword: { cell: 96, stride: 1.5, turn: 2, atk: { cell: 96, raise: 3, hit: 5 }, die: { cell: 96 } },
        SkSpear: { cell: 96, stride: 1.5, turn: 2, atk: { cell: 96, raise: 3, hit: 5 }, die: { cell: 96 } },
        SkHammer: { cell: 96, stride: 1.3, turn: 3, atk: { cell: 96, raise: 3, hit: 5 }, die: { cell: 96 } },
        SkCaptain: { cell: 96, stride: 1.4, turn: 2, atk: { cell: 96, raise: 3, hit: 5 }, die: { cell: 96 } }
    };
    let registered = false;
    const AIS = {};

    // the stock walk-in-and-strike of Creatures.js (its melee() is not exported): in to blow range, else walk at the hero
    function melee(c, name) {
        const m = c.moveDef(name), dist = c.playerDistance(), at = m.at * Math.max(1, c._scale * 0.85);
        if (c.mayAttack() && dist <= at && c.clearRun()) { c.startMove(name); return true; }
        if (c.isMoving()) return false;
        if (c._mode !== "chase") c.setMode("chase");
        if (dist <= 1.1) { c.faceHero(); return false; }
        if (!c.walkTo($gamePlayer.x, $gamePlayer.y, "in", 1)) c.faceHero();
        return false;
    }

    // ---- the wraps every sea mind gets: the retreat to the water (dawn, a leash), the fear of fire (a step back and a wait)
    function withSea(base) {
        const ai = Object.assign({}, base);
        const think = base.think;
        ai.think = function(c) {
            if (c._culled && !c._retreat && (Graphics.frameCount + c._cid) % 4 !== 0) return;   // (off the screen: its mind every 4th frame)
            if (c._retreat) return retreatThink(c);
            if (c._hunt) {   // (it comes for the hero from the water: far off it stalks - a mode the leash of Creatures does not drop)
                const d = c.playerDistance();
                if (d > 13) { if (c._mode !== "stalk") c.setMode("stalk"); if (!c.isMoving()) c.walkTo($gamePlayer.x, $gamePlayer.y, "in", 2); return; }
                if (c._mode === "stalk") c.setMode("chase");
            }
            if (c._scared > 0) { c._scared--; if (!c.isMoving() && c._mode !== "grab" && c._mode !== "drag") { c.setMode("keep"); c.faceHero(); if (c._scared % 20 === 5) c.stepAway(); } return; }
            return think.call(this, c);
        };
        return ai;
    }
    function retreatThink(c) {
        const r = c._retreat;
        if (c._mode === "drag" || c._mode === "grab" || c._mode === "windup" || c._mode === "strike") return;
        if (!c.isMoving()) {
            c.setMode("flee");
            const d = Math.hypot(r.x - c._x, r.y - c._y);
            if (d <= 1.4) return goIntoWater(c);
            if (!c.walkTo(r.x, r.y, "sea", 0)) { if (++r.stuck > 120) return goIntoWater(c); }
            else r.stuck = 0;
        }
    }
    function goIntoWater(c) {
        const C = Cr();
        if (C && C.grab && C.grab.c === c) return;
        splash(c.centerX(), c.centerY() + 0.3);
        removeSea(c, true);
    }
    function removeSea(c, soft) {
        const C = Cr(), list = C.creatures();
        const i = list.indexOf(c);
        c._dead = true; c._gone = true;
        if (c._markSprite && c._markSprite.parent) c._markSprite.parent.removeChild(c._markSprite);
        if (c._markHolder && c._markHolder.parent) c._markHolder.parent.removeChild(c._markHolder);
        if (window.RoamingActor) RoamingActor.dropSprite(c);
        if (i >= 0) list.splice(i, 1);
        T.emit("morzeGone", { kind: c._kind, soft: !!soft });
    }
    function splash(x, y) {
        se("Splash", 55, 100, panOf(x));
        const C = Cr();
        if (C && C.rings) C.rings.push({ x, y, r: 0.9, t: 0, life: 40, kind: "ripple" });
        sparksAt(x, y - 0.3, "#9fd8ff", 8);
    }

    function registerAll() {
        if (registered || !window.Creatures || !Creatures.KINDS || !Creatures.AI) return;
        registered = true;
        const C = Creatures, A = C.AI;
        // the crab: stock grab and slam, its own leash (Morze tick) - a mind of the drowned
        AIS.krab = {
            think(c) {
                const m = c._def.moves, dist = c.playerDistance();
                if (c._mode === "drag") return;
                melee(c, dist <= m.slam.at && Math.random() < m.slam.chance ? "slam" : "grab");
            },
            landed(c, m, res) { if (c._move === "grab" && res === "hit") C.startGrab(c, m); }
        };
        AIS.szczur = Object.assign({}, A.szczur, { calm() { return false; } });   // (the clubs: no squeaks)
        // the sword (and the captain): a combo of slashes - after a cut, if it is still close and was not parried, the next comes quick
        AIS.miecz = comboMind(false);
        AIS.kapitan = comboMind(true);
        // the spear: keeps its distance, thrusts from afar, steps back after it
        AIS.wlocznia = {
            think(c) {
                const m = c._def.moves, keep = c._def.keep, dist = c.playerDistance();
                if (c.isMoving()) return;
                if (c.mayAttack() && dist <= m.thrust.at && c.clearRun()) { c.startMove("thrust"); return; }
                if (dist < keep[0] - 0.3) { c.setMode("keep"); if (!c.stepAway()) c.faceHero(); return; }
                if (dist > keep[1]) { if (c._mode !== "chase") c.setMode("chase"); if (!c.walkTo($gamePlayer.x, $gamePlayer.y, "in", 2)) c.faceHero(); return; }
                if (c.mayAttack()) { if (c._mode !== "chase") c.setMode("chase"); if (!c.walkTo($gamePlayer.x, $gamePlayer.y, "in", 2)) c.faceHero(); return; }
                c.faceHero();
            },
            afterMove(c) { c._backT = 1; c._gapT = rnd(25, 60); }
        };
        // the hammer: slow, only the one heavy blow
        AIS.mlot = { think(c) { melee(c, "smash"); } };
        for (const [kind, d] of Object.entries(D.KINDS)) {
            // (not enumerable: the lists of the ruins' kinds - F9, the floors' fit, the tests of the eight - never see the sea's, but KINDS[kind] works)
            Object.defineProperty(C.KINDS, kind, { value: Object.assign({}, d), enumerable: false, writable: true, configurable: true });
            C.AI[kind] = withSea(AIS[d.ai]);
        }
        const L = window.Hunting && Hunting.LOOK8;
        for (const [look, d] of Object.entries(LOOKS)) {
            C.LOOKS[look] = d;
            if (!L) continue;
            const walk = "anim8/Cr_" + look + "_Walk8", name = "$Cr_" + look;
            L[name] = Object.assign({ sheet: walk, cell: d.cell, stride: d.stride, turn: d.turn }, d.idle ? { idle: { sheet: walk, cell: d.cell, rate: d.idle, turn: d.turn } } : {});
            if (d.atk) L[name + "_Atk"] = { sheet: "anim8/Cr_" + look + "_Atk8", cell: d.atk.cell, pose: true };
            if (d.die) L[name + "_Die"] = { sheet: "anim8/Cr_" + look + "_Die8", cell: d.die.cell, pose: true };
        }
    }
    // the sword's and the captain's mind: in to blow range, the chain of cuts (chance per link: def.combo), the captain also the overhead blow
    function comboMind(captain) {
        return {
            think(c) {
                const m = c._def.moves, dist = c.playerDistance();
                if (c._mode === "windup" || c._mode === "strike") return;
                melee(c, captain && dist <= m.over.at && c.mayAttack() && Math.random() < (c._def.overChance || 0.3) ? "over" : "cut");
            },
            afterMove(c) {
                const chain = c._def.combo, name = c._move;
                if (name === "over" || !chain) { c._chain = 0; return; }
                const n = c._chain = (c._chain || 0) + 1;
                if (n <= chain.length && c.playerDistance() <= (c._def.moves.cut.at || 1.7) + 0.5 && !c._parried && Math.random() < chain[n - 1]) {
                    c.startMove(n === 1 ? "cut2" : "cut3");
                    return;
                }
                c._chain = 0;
            }
        };
    }
    // the loot names -> the items of the database (the new items are added by the installer: by name)
    function resolveLoot() {
        if (!window.$dataItems || !window.Creatures || !Creatures.KINDS) return;
        const byName = {};
        for (const [key, name] of Object.entries(D.ITEM_NAMES)) { const it = $dataItems.find(i => i && i.name === name); if (it) byName[key] = it.id; }
        for (const kind of Object.keys(D.KINDS)) {
            const k = Creatures.KINDS[kind];
            if (!k) continue;
            k.loot = D.KINDS[kind].loot.map(e => [typeof e[0] === "string" ? byName[e[0]] : e[0], e[1], e[2]]).filter(e => e[0]);
        }
    }
    T.on("mapReady", () => { registerAll(); resolveLoot(); }, { owner: PLUGIN });
    T.on("load", () => { registerAll(); resolveLoot(); }, { owner: PLUGIN });

    const say = (c, text) => { try { T.call("SpeechBubbles", "say", c, text, 180); } catch (e) { /* no bubble */ } };

    // ==================================================================
    // 2. The tick of the sea creatures (every 15th frame): fire and torch -> scared; the crab's leash -> back to the water
    // ==================================================================
    const seaList = () => { const C = Cr(); return C ? C.creatures().filter(c => c._def && c._def.sea && !c._dead && !c._dying) : []; };
    let fireCache = { at: -999, list: [] };
    // the fires of the map (the camp-fires, the stuck torches: Starcia.fires, looked at once a second) and the hero's own torch (always fresh)
    function fires() {
        if (Graphics.frameCount - fireCache.at >= 60) {
            fireCache.at = Graphics.frameCount;
            let list = [];
            const S = T.api("Starcia");
            try { if (S && S.fires) list = S.fires().slice(); } catch (e) { list = []; }
            fireCache.list = list;
        }
        const Tc = T.api("Torch");
        try { if (Tc && Tc.isLit && Tc.isLit()) return fireCache.list.concat([{ x: heroX(), y: heroY(), torch: true, hero: true }]); } catch (e) { /* none */ }
        return fireCache.list;
    }
    // off the screen (and its margin) a sea creature costs nothing to draw: its sprite stops updating and rendering (its mind goes on every 4th
    // frame); on the screen again it is the same sprite. Looked at every 15th frame.
    function cull(c, off) {
        const sp = c._sprite;
        if (off && !c._culled) {
            if (!sp) return;
            c._culled = true; c._cullUpd = sp.update;
            sp.update = function() {};
            sp.visible = false;
        } else if (!off && c._culled) {
            c._culled = false;
            if (sp) { if (sp.update !== Object.getPrototypeOf(sp).update) delete sp.update; sp.visible = true; }
        }
    }
    // The sun's shadow of a sheet's frame is cut once (Sky.silhouette: a canvas read-back, ~0.3 ms) - a monster walking in cold would do it in the
    // middle of the fight. So the frames of the sheets of the coming kind are cut beforehand, a few at a time, in the signs' five seconds.
    let warmQ = [];
    function warm(kinds) {
        const Sun = window.Sky;
        if (!Sun || !Sun.silhouette) return;
        for (const kind of kinds) {
            const k = D.KINDS[kind], L = k && LOOKS[k.look];
            if (!L || L.warmed) continue;
            L.warmed = true;
            for (const part of ["Walk8", "Atk8"]) {   // (the fall: one blow of the end, cut when it comes - a sheet more would stretch the signs' five seconds)
                const bmp = ImageManager.loadCharacter("anim8/Cr_" + k.look + "_" + part);
                warmQ.push({ bmp, cell: L.cell, col: 0, row: 0 });
            }
        }
    }
    function warmTick() {
        if (!warmQ.length) return;
        let n = 0;
        while (warmQ.length && n < 3) {   // (every 5th frame: three frames' shadows and outlines - the cost of one frame kept small)
            const w = warmQ[0];
            if (w.bmp) {   // (a sheet: once it is loaded, its frames are queued - the Atk sheets have a number of columns of their own)
                if (!w.bmp.isReady()) return;
                warmQ.shift();
                const cols = Math.max(1, Math.round(w.bmp.width / w.cell)), frames = [];
                for (let col = 0; col < cols; col++) for (let row = 0; row < 8; row++) frames.push([w.bmp, col * w.cell, row * w.cell, w.cell]);
                warmQ = frames.concat(warmQ);
                continue;
            }
            warmQ.shift(); n++;
            try { window.Sky.silhouette(w[0], w[1], w[2], w[3], w[3], false); } catch (e) { /* a frame off the sheet */ }
            // (its outline too: a creature not scaled gets it as a picture - CharacterPolish.js -, made here, not in the fight)
            try { if (window.CharacterPolish && CharacterPolish.outlineFrame) CharacterPolish.outlineFrame(w[0], w[1], w[2], w[3], w[3]); } catch (e) { /* the same */ }
        }
    }
    let seaTick = 0;
    function creaturesTick() {
        if (++seaTick % 5 === 0) warmTick();
        if (seaTick % 15 !== 0) return;
        const list = seaList();
        if (!list.length) return;
        const F = fires();
        const hx = (Graphics.width / tw()) / 2 + 3, hy = (Graphics.height / th()) / 2 + 3;
        for (const c of list) {
            const d = c._def;
            cull(c, Math.abs(c.centerX() - heroX()) > hx || Math.abs(c.centerY() - heroY()) > hy);
            // fear of fire / the torch in the hand
            if (d.fearFire && F.length && !c._retreat) {
                for (const f of F) {
                    if (Math.hypot(f.x - c.centerX(), f.y - c.centerY()) < d.fearFire + (f.hero ? 0.8 : 0)) { if (!(c._scared > 0)) { c._scared = 60; if (Math.random() < 0.5) numberAt(c.centerX(), c.centerY() - 1.3, tx("kod.ogien"), "#ffd27f", 0.7); } break; }
                }
            }
            // the crab keeps to its bit of shore: after `leash` seconds without the hero near it goes back to the water
            if (d.leash && !c._retreat) {
                if (c.playerDistance() > (d.sight || 5) + 1) c._lost = (c._lost || 0) + 15; else c._lost = 0;
                if (c._lost > d.leash * 60) retreat(c, nearestWater(c));
            }
        }
    }
    function retreat(c, pt) {
        if (!pt) return;
        c._retreat = { x: pt.x, y: pt.y, stuck: 0 };
        c._engaged = true;
        c.setMode("flee");
    }
    const waterNear = (x, y) => {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (isWater(x + dx, y + dy)) return true;
        return false;
    };
    function isWater(x, y) {
        if (!$gameMap.isValid(x, y)) return false;
        for (let z = 0; z < 2; z++) { const id = $gameMap.tileId(x, y, z); if (id > 0 && Tilemap.isWaterTile(id)) return true; }
        return false;
    }
    // the nearest standable cell next to the sea (a ring search round the creature)
    function nearestWater(c) {
        const cx = c._x, cy = c._y;
        let best = null, bd = 1e9;
        for (let r = 1; r <= 40 && !best; r++) {
            for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
                if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
                const x = cx + dx, y = cy + dy;
                if (!$gameMap.isValid(x, y) || !$gameMap.isPassable(x, y, 2) && !$gameMap.isPassable(x, y, 6)) continue;
                if (!waterNear(x, y)) continue;
                const d = Math.hypot(dx, dy);
                if (d < bd) { bd = d; best = { x, y }; }
            }
        }
        return best;
    }
    // dawn: every living one goes back to the water (the dead do not mind the sun - they are the sea's)
    function dawn() {
        let n = 0;
        for (const c of seaList()) {
            n++;
            const pt = nearestWater(c);
            if (pt) retreat(c, pt); else removeSea(c, true);
        }
        return n;
    }

    // ==================================================================
    // 3. Spawning a group
    // ==================================================================
    function spawnGroup(kind, count, x, y, level, extra) {
        const C = Cr();
        if (!C || !C.spawn) return [];
        registerAll(); resolveLoot();
        const before = new Set(C.creatures());
        C.spawn(kind, x, y, Object.assign({ tag: TAG, engaged: true, level: level || 1, count: count > 1 ? count : undefined, single: count <= 1 }, extra || {}));
        const made = C.creatures().filter(o => !before.has(o));
        for (const c of made) { c._hunt = true; if (c.playerDistance() > 13) c.setMode("stalk"); }
        return made;
    }

    // ==================================================================
    // 4. Wet tracks and bones (small sprites in one container; ~10 to a landing, gone by noon)
    // ==================================================================
    let trackBmp = null;
    function trackBitmap() {
        if (trackBmp) return trackBmp;
        const b = new Bitmap(24, 12), c = b.context;
        c.fillStyle = "rgba(20,28,34,0.55)";
        c.beginPath(); c.ellipse(12, 6, 9, 4.2, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = "rgba(40,60,70,0.45)";
        c.beginPath(); c.ellipse(11, 5, 5.5, 2.4, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = "rgba(160,205,225,0.35)";
        c.fillRect(8, 4, 3, 1); c.fillRect(14, 7, 2, 1);
        b._baseTexture.update();
        return (trackBmp = b);
    }
    let weed = null;
    function weedBitmap() {
        if (weed) return weed;
        const b = new Bitmap(24, 16), c = b.context;
        c.strokeStyle = "#1f4a2a"; c.lineWidth = 2;
        for (const [x0, x1, y1] of [[6, 3, 2], [11, 12, 1], [15, 20, 3], [10, 6, 9]]) { c.beginPath(); c.moveTo(x0, 14); c.quadraticCurveTo(x1, 8, x1 + 2, y1 + 3); c.stroke(); }
        c.strokeStyle = "#2f7a3e"; c.lineWidth = 1;
        for (const [x0, x1, y1] of [[8, 5, 4], [13, 16, 2]]) { c.beginPath(); c.moveTo(x0, 14); c.quadraticCurveTo(x1, 9, x1 + 1, y1 + 4); c.stroke(); }
        b._baseTexture.update();
        return (weed = b);
    }
    // a little heap of wet bones with a rusty sword, for the first sign of day 10 (a skull, ribs, a rusty blade, a weed)
    let bonesBmp = null;
    function bonesBitmap() {
        if (bonesBmp) return bonesBmp;
        const b = new Bitmap(48, 30), c = b.context;
        const px = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
        px(6, 22, 36, 3, "rgba(20,28,34,0.35)");   // a wet patch under it
        px(24, 5, 14, 3, "#5b5a52"); px(24, 4, 14, 1, "#8d8b7d"); px(37, 5, 2, 3, "#3b3a36"); px(21, 7, 3, 5, "#4a3a2a"); px(19, 12, 7, 2, "#6a4a2a");   // the rusty sword: blade, guard, grip
        px(9, 10, 9, 7, "#d9d0b4"); px(9, 10, 9, 1, "#f2ecd6"); px(10, 17, 7, 2, "#c4bb9d");   // the skull
        px(11, 13, 2, 2, "#2a2a26"); px(15, 13, 2, 2, "#2a2a26"); px(13, 16, 2, 2, "#2a2a26");
        px(8, 9, 1, 8, "#1a1a18"); px(18, 9, 1, 8, "#1a1a18"); px(9, 9, 9, 1, "#1a1a18"); px(9, 19, 9, 1, "#1a1a18");
        for (const [x, y, w] of [[22, 16, 11], [21, 19, 12], [23, 22, 9]]) { px(x, y, w, 2, "#d9d0b4"); px(x, y + 2, w, 1, "#8f8872"); }   // the ribs
        px(34, 15, 6, 2, "#d9d0b4"); px(35, 20, 7, 2, "#d9d0b4");   // the arm bones
        px(14, 20, 5, 1, "#1f4a2a"); px(16, 21, 6, 1, "#2f7a3e"); px(13, 22, 3, 1, "#1f4a2a");   // a weed
        b._baseTexture.update();
        return (bonesBmp = b);
    }
    let marks = [];   // { x, y, kind, sprite, seen }
    let markLayer = null;   // ONE container for all the marks: its sprites stand still in map pixels, the layer alone moves with the map
    function addMarks(list) {
        for (const m of list) marks.push({ x: m.x, y: m.y, kind: m.kind || "track", seen: false });
        refreshMarks();
    }
    function dropLayer() { if (markLayer && markLayer.parent) markLayer.parent.removeChild(markLayer); markLayer = null; }
    function clearMarks() { dropLayer(); marks = []; }
    const spriteset = () => { const s = SceneManager._scene; return s && s._spriteset ? s._spriteset : null; };
    function refreshMarks() {
        const ss = spriteset();
        if (!ss || !ss._tilemap || !marks.length) return;
        if (!markLayer || !markLayer.parent) {
            markLayer = new Sprite();
            markLayer.z = 1;
            ss._tilemap.addChild(markLayer);
            for (const m of marks) m.sprite = null;
        }
        for (const m of marks) if (!m.sprite) {
            const s = new Sprite(m.kind === "weed" ? weedBitmap() : m.kind === "bones" ? bonesBitmap() : trackBitmap());
            s.anchor.set(0.5, 0.5);
            s.x = Math.round(m.x * tw() + tw() / 2); s.y = Math.round(m.y * th() + th() / 2);
            s.rotation = m.kind === "weed" || m.kind === "bones" ? 0 : (((m.x * 7 + m.y * 13) % 5) - 2) * 0.15;
            if (m.kind === "bones") s.scale.set(1.6, 1.6);   // (a heap of bones to be seen from a few tiles)
            markLayer.addChild(s);
            m.sprite = s;
        }
    }
    function marksUpdate() {
        if (!marks.length) return;
        if (!markLayer || !markLayer.parent) refreshMarks();
        if (!markLayer) return;
        markLayer.x = Math.round(-$gameMap.displayX() * tw());
        markLayer.y = Math.round(-$gameMap.displayY() * th());
    }
    const marksSeenBy = (r) => { let n = 0; for (const m of marks) if (!m.seen && Math.hypot(m.x - $gamePlayer._realX, m.y - $gamePlayer._realY) < r) { m.seen = true; n++; } return n; };

    // ==================================================================
    // 5. The tentacles (an animated water object, twice the size of the first version): rings 2 s before, the strike (a zone of 2 tiles), the grab (the keys tear him free),
    //    the sink. Only at the harbour's quays; never on land.
    // ==================================================================
    const MA = { file: "Morze_Macka_Duza", cw: 176, ch: 128, rise: [0, 1, 2, 3], idle: [3, 4], strike: [5, 6, 7], hold: [7, 8], sink: [9, 10, 11] };
    const TENT_SCALE = D.TENTACLE.scale || 2;   // (the sheet's cells are 176 x 128 - a kraken's arm is big: hard-edged, drawn at twice that, 2026-11-12)
    let tents = [];
    let tentBmp = null;
    const tentBitmap = () => tentBmp || (tentBmp = ImageManager.loadBitmap("img/characters/", MA.file));
    function addTentacle(x, y) {
        const hp = D.TENTACLE.hp;
        const t = { x, y, phase: "warn", t: 0, hp, max: hp, sprite: null, cd: rnd(60, 160), held: 0, presses: 0, hit: false };
        tents.push(t);
        const C = Cr();
        if (C && C.rings) C.rings.push({ x: x + 0.5, y: y + 0.5, r: D.TENTACLE.zone * 0.5, t: 0, life: D.TENTACLE.warn, kind: "ripple", c: { _dead: false } });
        se("Water1", 55, 70, panOf(x));
        return t;
    }
    function tentSprite(t) {
        const ss = spriteset();
        if (!ss || !ss._tilemap) return null;
        if (t.sprite && t.sprite.parent) return t.sprite;
        const bmp = tentBitmap();
        bmp.smooth = false;
        const s = new Sprite(bmp);
        s.anchor.set(0.5, 0.92);
        s.scale.set(TENT_SCALE, TENT_SCALE);
        s.z = 3;
        ss._tilemap.addChild(s);
        t.sprite = s;
        return s;
    }
    function frameOf(t) {
        const f = (list, k) => list[Math.min(list.length - 1, Math.floor(k * list.length))];
        if (t.phase === "warn") return null;
        if (t.phase === "rise") return f(MA.rise, t.t / 40);
        if (t.phase === "idle") return MA.idle[Math.floor(t.t / 20) % MA.idle.length];
        if (t.phase === "strike") return f(MA.strike, t.t / 24);
        if (t.phase === "hold") return MA.hold[Math.floor(t.t / 12) % MA.hold.length];
        if (t.phase === "sink") return f(MA.sink, t.t / 40);
        return null;
    }
    function tentaclesTick() {
        if (!tents.length) return;
        const ss = spriteset();
        for (const t of tents) {
            t.t++;
            const near = Math.hypot(heroX() - (t.x + 0.5), heroY() - (t.y + 0.5));
            if (t.phase === "warn" && t.t >= D.TENTACLE.warn) { t.phase = "rise"; t.t = 0; se("Water2", 70, 60, panOf(t.x)); }
            else if (t.phase === "rise" && t.t >= 40) { t.phase = "idle"; t.t = 0; }
            else if (t.phase === "idle") {
                if (t.t >= t.cd && near <= D.TENTACLE.reach + D.TENTACLE.zone * 0.5) { t.phase = "strike"; t.t = 0; t.hit = false; t.side = heroX() < t.x + 0.5 ? -1 : 1; se("Monster1", 60, 60, panOf(t.x)); }
                else if (t.t >= D.TENTACLE.rest * 3) { t.phase = "sink"; t.t = 0; }
            } else if (t.phase === "strike") {
                if (!t.hit && t.t === 12) {
                    t.hit = true;
                    if (near <= D.TENTACLE.zone) {
                        const C = Cb();
                        if (C && C.hitPlayer) C.hitPlayer({ damage: D.TENTACLE.strike, poise: 60, from: { x: t.x + 0.5, y: t.y + 0.5 }, attacker: { _kind: "macka", name: () => tx("kod.macka"), centerX: () => t.x + 0.5, centerY: () => t.y + 0.5 }, name: tx("kod.macka"), wound: 0.15, knock: 0.8 });
                        sparksAt(heroX(), heroY() - 0.4, "#9fd8ff", 10);
                        if (Math.random() < 0.6) { t.phase = "hold"; t.t = 0; t.held = D.TENTACLE.grab; t.presses = 0; numberAt(heroX(), heroY() - 1.5, tx("kod.chwyt"), "#ff9f8f", 0.95); const Cc = Cb(); if (Cc && Cc.stunPlayer) Cc.stunPlayer(t.held, "grab"); }
                    }
                }
                if (t.phase === "strike" && t.t >= 24) { t.phase = "idle"; t.t = 0; t.cd = rnd(100, 200); }
            } else if (t.phase === "hold") {
                for (const k of ["ok", "cancel", "escape"]) if (Input.isTriggered(k)) t.presses++;
                if (t.t % 30 === 0) { const dx = t.x + 0.5 - heroX(), dy = t.y + 0.5 - heroY(); if (Math.hypot(dx, dy) > 1.4 && !$gamePlayer.isMoving()) { const dir = DIR_OF(dx, dy); if ($gamePlayer.canPass($gamePlayer.x, $gamePlayer.y, dir)) $gamePlayer.moveStraight(dir); } }
                if (t.presses >= 7) { t.phase = "idle"; t.t = 0; t.cd = rnd(160, 260); t.held = 0; numberAt(heroX(), heroY() - 1.5, tx("kod.wyrwal"), "#9ff0a8", 0.9); const Cc = Cb(); if (Cc && Cc.stunPlayer) Cc.stunPlayer(1, "grab"); }
                else if (t.t >= t.held) { drown(t); }
            } else if (t.phase === "sink" && t.t >= 40) { t.phase = "gone"; }
            if (t.phase === "sink" && t.t === 1) splash(t.x + 0.5, t.y + 0.7);
            if (ss && t.phase !== "gone") {
                const f = frameOf(t), s = tentSprite(t);
                if (s && f !== null && s.bitmap && s.bitmap.isReady()) {
                    s.setFrame(f * MA.cw, 0, MA.cw, MA.ch);
                    s.scale.x = TENT_SCALE * (t.phase === "strike" || t.phase === "hold" ? (t.side || 1) : 1);   // (the arm tips over towards the hero)
                    s.x = Math.round($gameMap.adjustX(t.x) * tw() + tw() / 2);
                    s.y = Math.round($gameMap.adjustY(t.y) * th() + th());
                    s.visible = true;
                } else if (s) s.visible = false;
            }
        }
        for (const t of tents) if (t.phase === "gone" && t.sprite && t.sprite.parent) t.sprite.parent.removeChild(t.sprite);
        tents = tents.filter(t => t.phase !== "gone");
    }
    // the drowning: a heavy blow and something from the bag's edge is lost to the water
    function drown(t) {
        t.phase = "sink"; t.t = 0; t.held = 0;
        const C = Cb();
        if (C && C.hitPlayer) C.hitPlayer({ damage: 22, poise: 90, from: { x: t.x + 0.5, y: t.y + 0.5 }, attacker: { _kind: "macka", name: () => tx("kod.macka"), centerX: () => t.x + 0.5, centerY: () => t.y + 0.5 }, name: tx("kod.macka"), knock: 1 });
        const lost = lostItem();
        if (lost) T.popup(tx("kod.utracil").replace("{item}", lost), { kind: "need" });
        const Cc = Cb(); if (Cc && Cc.stunPlayer) Cc.stunPlayer(1, "grab");
    }
    function lostItem() {
        if (!window.$gameParty) return "";
        const items = $gameParty.items().filter(i => i && i.itypeId === 1 && i.id !== D.ITEM.torch && !/Klucz|Mapa|Księga/i.test(i.name));
        if (!items.length) return "";
        const it = pick(items);
        $gameParty.loseItem(it, 1);
        return it.name;
    }
    // the hero's blows (the bus "attack"): a tentacle shown (strike, hold, idle) within his reach and in front takes the blow
    T.on("attack", e => {
        if (!tents.length || !has()) return;
        const C = Cb(), k = C && C.strMult ? C.strMult() : 1, dmg = Math.round(22 * k * (e && e.heavy ? 1.8 : 1));
        const fx = Math.cos(Math.PI / 2), dir = $gamePlayer.direction();
        for (const t of tents) {
            if (t.phase === "warn" || t.phase === "sink" || t.phase === "gone") continue;
            const dx = t.x + 0.5 - heroX(), dy = t.y + 0.5 - heroY(), d = Math.hypot(dx, dy);
            if (d > 3.4) continue;   // (the arm is big: the hero's blow reaches its thick stem from further off)
            const facing = (dir === 2 && dy > -0.3) || (dir === 8 && dy < 0.3) || (dir === 4 && dx < 0.3) || (dir === 6 && dx > -0.3);
            if (!facing) continue;
            t.hp -= dmg;
            sparksAt(t.x + 0.5, t.y + 0.1, "#b8f0ff", 6);
            numberAt(t.x + 0.5, t.y - 0.4, String(dmg), "#ffffff");
            if (t.phase === "hold") { t.presses += 2; }
            if (t.hp <= 0) { t.phase = "sink"; t.t = 0; t.cut = true; T.emit("morzeTentacle", { cut: true }); }
        }
    }, { owner: PLUGIN });
    const tentaclesLeft = () => tents.filter(t => t.phase !== "gone" && t.phase !== "sink").length;

    // ==================================================================
    // 6. The watch: in the town the watchmen come out of the guardhouse (2, the watchmen's sheet, path8) at the alarm bell (3 + 1 strokes) and
    //    go at the monster - the two kill a drowned one in about eight seconds, a crab in twelve; a hurt watchman is not dead: he limps back to the
    //    guardhouse (the door) and is seen no more tonight. On the maps with a guard resident (the manor, the harbour) he does the same, by TownLife.hold
    // ==================================================================
    const GUARD_RE = /(straznik|zolnierz|kapral|patrol|wartownik)/i;
    const HOUSE = { map: 220, door: [43, 20], out: [[43, 22], [44, 22]] };   // (2026-11-16: Kruczogród - the watch comes out of the town hall, where the corporal lives)
    const watch = { on: false, hurt: {}, t: 0, men: [], bell: false };
    function Watchman() { this.initialize(...arguments); }
    Watchman.prototype = Object.create(Game_Character.prototype);
    Watchman.prototype.constructor = Watchman;
    Watchman.prototype.initialize = function(x, y, i) {
        Game_Character.prototype.initialize.call(this);
        this._watch = true; this._i = i; this._hurt = false; this._swing = rnd(10, 50);
        this.setImage("$Npc_Straznik", 0);
        this.setPosition(x, y);
        this.setMoveSpeed(3.7); this.setMoveFrequency(5); this.setWalkAnime(true); this.setStepAnime(false);
        this.setPriorityType(1); this.setThrough(false);
    };
    Watchman.prototype.centerX = function() { return this._realX + 0.5; };
    Watchman.prototype.centerY = function() { return this._realY + 0.5; };
    Watchman.prototype.isMapPassable = function(x, y, d) {
        const F = T.api("Farming");
        if (F && F.buildingAt && F.buildingAt($gameMap.roundXWithDirection(x, d), $gameMap.roundYWithDirection(y, d))) return false;
        return Game_Character.prototype.isMapPassable.call(this, x, y, d);
    };
    Watchman.prototype.walkTo = function(tx, ty, near) {
        const HP = T.api("Hunting_parts") && T.api("Hunting_parts").path;
        if (!HP || this.isMoving()) return false;
        const r = HP.path8(this, Math.round(tx), Math.round(ty), { animal: true, key: "watch" + this._i, near: near || 0 });
        const went = HP.takeStep(this, r.dir);
        if (HP.stalled(this, "watch" + this._i, Math.hypot(this._x - tx, this._y - ty), (near || 0) + 0.5, tx, ty)) HP.unstall(this);
        return went;
    };
    Watchman.prototype.faceTo = function(x, y) { this.setDirection(DIR_OF(x - this.centerX(), y - this.centerY())); };
    function watchSpawn() {
        if (watch.men.length || !window.RoamingActor || $gameMap.mapId() !== HOUSE.map) return;
        HOUSE.out.forEach((p, i) => { const m = new Watchman(p[0], p[1], i); watch.men.push(m); RoamingActor.addSprite(m); });
        for (let i = 0; i < 3; i++) setTimeout(() => se("Bell1", 80, 70), i * 650);
        setTimeout(() => se("Bell1", 80, 90), 3 * 650 + 600);
    }
    function watchClear() {
        for (const m of watch.men) if (window.RoamingActor) RoamingActor.dropSprite(m);
        watch.men = [];
    }
    let watchTick = 0;
    function watchUpdate() {
        if (!watch.on) return;
        for (const m of watch.men) m.update();
        if (++watchTick % 20 !== 0) return;
        const mons = seaList();
        if ($gameMap.mapId() === HOUSE.map) {
            if (mons.length && !watch.men.length) watchSpawn();
            for (const m of watch.men.slice()) {
                if (m._hurt || !mons.length) {   // the way home: the door of the guardhouse, then he is inside
                    if (Math.hypot(m._x - HOUSE.door[0], m._y - HOUSE.door[1]) <= 1.5) { if (window.RoamingActor) RoamingActor.dropSprite(m); watch.men.splice(watch.men.indexOf(m), 1); continue; }
                    m.walkTo(HOUSE.door[0], HOUSE.door[1], 1);
                    continue;
                }
                // (2026-11-16, the player: "jeden może zająć strażnika i walczyć, inny wejść do miasta") one watchman takes one monster - the
                // nearest not taken by the other; beside it he keeps it busy (it stands and fights him), the rest go on after the hero
                const taken = new Set(watch.men.filter(o => o !== m && o._foe && !o._hurt).map(o => o._foe));
                const all = mons.map(c => ({ c, d: Math.hypot(c.centerX() - m.centerX(), c.centerY() - m.centerY()) })).sort((a, b) => a.d - b.d);
                const t = (m._foe && mons.includes(m._foe) ? all.find(o => o.c === m._foe) : null) || all.find(o => !taken.has(o.c)) || all[0];
                if (!t) continue;
                m._foe = t.c;
                if (t.d > 1.7) { m.walkTo(t.c._x, t.c._y, 1); continue; }
                m.faceTo(t.c.centerX(), t.c.centerY());
                pinTo(t.c, m);
                if ((m._swing -= 20) <= 0) {
                    m._swing = 70;
                    const dmg = t.c._kind === "krab_kolos" ? 2.5 : t.c._kind === "krab_olbrzym" ? 4 : 6;
                    t.c._hp -= dmg;
                    sparksAt(t.c.centerX(), t.c.centerY() - 0.4, "#e8e8e8", 3);
                    se("Blow1", 40, 100, panOf(t.c.centerX()));
                    if (Math.random() < 0.07) { m._hurt = true; say(m, tx("kod.straznikRanny")); }
                    if (t.c._hp <= 0 && !t.c._dying) { const C = Cr(); try { C.die(t.c, "guard"); } catch (e) { t.c._hp = 1; } }
                }
            }
            if (!mons.length && !watch.men.length) watch.on = false;
            return;
        }
        const L = T.api("TownLife"), G = guards();
        if (!L || !G.length) return;
        const busy = new Set();   // (one guard to one monster: the others go on)
        for (const m of mons) {
            const near = G.filter(g => !busy.has(g.key)).map(g => ({ g, d: Math.hypot(g.ev._realX - m.centerX(), g.ev._realY - m.centerY()) })).sort((a, b) => a.d - b.d).slice(0, 1);
            for (const n of near) busy.add(n.g.key);
            let hitters = 0;
            for (const n of near) {
                if (n.d > 2.2) { L.hold(n.g.key, true, [Math.round(m.centerX() - 1), Math.round(m.centerY())]); continue; }
                hitters++;
                if (Math.random() < 0.08 && !watch.hurt[n.g.key]) { watch.hurt[n.g.key] = true; guardHurt(n.g); }
            }
            if (hitters) {
                pinTo(m, near[0].g.ev);
                m._hp -= hitters * (m._kind === "krab_kolos" ? 2.6 : m._kind === "krab_olbrzym" ? 4.2 : 6.5) * 0.5;
                sparksAt(m.centerX(), m.centerY() - 0.4, "#e8e8e8", 3);
                se("Blow1", 30, 100, panOf(m.centerX()));
                if (m._hp <= 0 && !m._dying) { const C = Cr(); try { C.die(m, "guard"); } catch (e) { m._hp = 1; } }
            }
        }
        if (!mons.length) watchEnd();
    }
    // a monster a guard stands at is busy with him: held a moment at a time (renewed while he fights it), turned to him - when he falls
    // back hurt it goes on after the hero
    function pinTo(c, by) {
        if (!c || c._dead || c._dying) return;
        c._stun = Math.max(c._stun || 0, 24);
        try { const dx = (by.centerX ? by.centerX() : by._realX + 0.5) - c.centerX(), dy = (by.centerY ? by.centerY() : by._realY + 0.5) - c.centerY(); c.setDirection(DIR_OF(dx, dy)); } catch (e) { /* (no turning) */ }
    }
    function guards() {
        const L = T.api("TownLife");
        if (!L || !L.RESIDENTS) return [];
        const out = [];
        for (const r of L.RESIDENTS) {
            if (!GUARD_RE.test(r.key || "") && !GUARD_RE.test(r.sheet || "")) continue;
            const ev = L.eventOf(r.key);
            if (ev && !(ev._town && ev._town.hidden) && !watch.hurt[r.key]) out.push({ key: r.key, ev });
        }
        return out;
    }
    function guardHurt(g) {
        const L = T.api("TownLife");
        say(g.ev, tx("kod.straznikRanny"));
        try { L.hold(g.key, true, [Math.round(g.ev._realX) - 3, Math.round(g.ev._realY) + 3]); } catch (e) { /* none */ }
        setTimeout(() => { try { L.hold(g.key, false); } catch (e) { /* gone */ } delete watch.hurt[g.key]; }, 90000);
    }
    function watchBegin() { watch.on = true; }
    function watchEnd() {
        watch.on = false;
        const L = T.api("TownLife");
        if (L) for (const g of guards()) { try { L.hold(g.key, false); } catch (e) { /* gone */ } }
    }

    // ==================================================================
    // 7. The frame: one update hook on the map
    // ==================================================================
    T.onMapUpdate(() => {
        if (!has()) return;
        if (!tents.length && !marks.length && !watch.on) { creaturesTick(); return; }
        tentaclesTick(); marksUpdate(); watchUpdate(); creaturesTick();
    }, { owner: PLUGIN, name: "morzePotwory" });
    T.on("mapLeave", () => {
        dropLayer(); marks = [];
        for (const t of tents) if (t.sprite && t.sprite.parent) t.sprite.parent.removeChild(t.sprite);
        tents = [];
        watch.on = false; watchClear();
    }, { owner: PLUGIN });

    window.MorzePotwory = T.register(PLUGIN, {
        LOOKS, MA, warm, warmLeft: () => warmQ.length, registerAll, resolveLoot, spawnGroup, seaList, dawn, retreat, nearestWater, removeSea, splash, isWater, waterNear,
        marks: { add: addMarks, clear: clearMarks, seenBy: marksSeenBy, list: () => marks },
        tentacles: { add: addTentacle, list: () => tents, left: tentaclesLeft, clear: () => { for (const t of tents) if (t.sprite && t.sprite.parent) t.sprite.parent.removeChild(t.sprite); tents = []; } },
        watch: { begin: watchBegin, end: watchEnd, state: watch, guards, clear: watchClear, HOUSE },
        fires
    });
})();
