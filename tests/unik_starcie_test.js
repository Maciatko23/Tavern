// (2026-11-25) Space = a dodge (a spring back on his feet: slow, then a fast blurred slide, his face on the foe) instead of the roll;
// two blows at the same moment = the blades cross (sparks, both thrown off, nobody hurt); a planted seedling is walked over.
// Run: node tests/unik_starcie_test.js   (tools/serve.js on 8765; CDP_PORT for another port)
const path = require("path");
const { launch, sleep } = require("./cdp.js");
const OUT = path.join(__dirname, "unik_starcie");
require("fs").mkdirSync(OUT, { recursive: true });
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 25000))]);
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    const JP = async e => JSON.parse(await ev("(" + e + ").then(r => JSON.stringify(r))"));   // (a promise in the page: its result)
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(218, 27, 26, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===218").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev(`(function(){ SceneManager._scene.startFadeIn(1,false); if (window.Needs && Needs.setEnabled) Needs.setEnabled(false); if (window.Birds) Birds.auto(false); if (window.Hunting) { Hunting.auto(false); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); }
            if (window.Humans) { Humans.auto(false); Humans.clear(); } $gameSystem.setDayNightHour(11); $gameSystem.setStamina(100); $gameTemp._story = null; return 0; })()`);
        // an open row: the hero in the middle of 9 free tiles east-west (and the row under it free)
        const spot = await J(`(function(){
            const ok = (x, y) => $gameMap.isValid(x, y) && [2, 4, 6, 8].every(d => $gameMap.isPassable(x, y, d)) && $gameMap.eventsXyNt(x, y).length === 0;
            for (let r = 0; r < 14; r++) for (let y = 26 - r; y <= 26 + r; y++) for (let x = 27 - r; x <= 27 + r; x++) {
                let all = true; for (let dx = -4; dx <= 4 && all; dx++) for (let dy = 0; dy <= 1 && all; dy++) if (!ok(x + dx, y + dy)) all = false;
                if (all) return { x, y };
            }
            return null; })()`);
        if (!spot) throw new Error("no open row near the plot's gate");
        await ev(`(function(){ $gamePlayer.locate(${spot.x}, ${spot.y}); $gamePlayer.setDirection(6); $gameParty.gainItem($dataItems[60], 1); Combat.setHand("m60"); Combat.setCombatMode(true); return 0; })()`);
        await frames(20);
        const F = "Tawerna.api('Combat_parts').fight";
        await ev(`(function(){ const u = SceneManager.updateScene; window.__frozen = false; window.__freezeWhen = null;
            SceneManager.updateScene = function() { if (window.__frozen) return; u.call(this); if (window.__freezeWhen && window.__freezeWhen()) { window.__frozen = true; window.__freezeWhen = null; } }; return 0; })()`);
        const shotFrozen = async (when, file) => {
            await ev("window.__freezeWhen = " + when + "; 0");
            for (let i = 0; i < 100 && !(await ev("window.__frozen")); i++) await sleep(30);
            await sleep(150);
            await b.shot(path.join(OUT, file));
            await ev("window.__frozen = false; 0");
        };

        // ================= 1. the dodge: three steps with Unik mistrza (0: a slow hop, 1: a quicker longer hop, 2: the blurred slide) =================
        const actE = "Tawerna.api('Combat_parts').fight.act";
        const setRank = r => ev(`(function(){ const h = Combat.hero(); h.skills.d_roll = ${r} + 1; h.rev = (h.rev || 0) + 1; return Tawerna.api('Combat_parts').fight.dodgeTier(); })()`);
        const dodge = () => JP(`new Promise(res => {
            const f = ${F}; f.act.rollCd = 0; f.act.iframes = 0; f.fillBreath();
            $gamePlayer.locate(${spot.x}, ${spot.y}); $gamePlayer.setDirection(6);
            const spr = SceneManager._scene._spriteset._characterSprites.find(s => s._character === $gamePlayer);
            const x0 = $gamePlayer._realX, dir0 = $gamePlayer.direction(), out = { started: f.pressDodge(), tier: f.act.rollTier, len: f.act.rollLen, dir0, xs: [], dirs: [], d8: [], still: 99, ghosts: 0, lift: 0, swing: !!$gamePlayer._toolSwing };
            const tm = SceneManager._scene._spriteset._tilemap;
            let last = -1;
            const iv = setInterval(() => {
                if (Graphics.frameCount === last) return;
                last = Graphics.frameCount;
                out.xs.push(+($gamePlayer._realX - x0).toFixed(3)); out.dirs.push($gamePlayer.direction()); out.d8.push($gamePlayer._heroDir8); out.still = Math.min(out.still, $gamePlayer._heroStill || 0);
                out.lift = Math.max(out.lift, Math.round($gamePlayer.screenY() - spr.y));
                out.ghosts = Math.max(out.ghosts, tm.children.filter(c => c.spriteId === -1 && c._life !== undefined).length);
                if (f.act.mode !== "roll" || out.xs.length > 120) { clearInterval(iv); out.mode = f.act.mode; const t = Graphics.frameCount + 14; const iv2 = setInterval(() => { if (Graphics.frameCount < t) return; clearInterval(iv2); out.rotation = spr.rotation; out.ghostsAfter = tm.children.filter(c => c.spriteId === -1 && c._life !== undefined).length; out.shadow = !!(spr._hopShadow && spr._hopShadow.visible); res(out); }, 4); }
            }, 2);
        })`);
        // (2026-11-26, the user) no Unik learnt: Space does nothing
        const none = await J(`(function(){ const h = Combat.hero(), f = ${F}; h.skills.d_roll = 0; h.rev = (h.rev || 0) + 1; f.act.rollCd = 0; f.act.mode = "idle"; f.fillBreath(); const ok = f.pressDodge(); return { ok, mode: f.act.mode }; })()`);
        check("no Unik learnt: Space does nothing (no dodge at all)", none.ok === false && none.mode !== "roll", none);
        const res = [];
        for (const r of [0, 1, 2]) { const tierNow = await setRank(r); const d = await dodge(); d.rank = r; d.tierNow = tierNow; res.push(d); await frames(20); }
        const end = d => d.xs[d.xs.length - 1], at = (d, k) => d.xs[Math.min(d.xs.length - 1, Math.floor(k * d.xs.length))];
        const sum = res.map(d => ({ rank: d.rank, tier: d.tier, frames: d.xs.length, end: end(d), lift: d.lift, ghosts: d.ghosts, early: at(d, 0.12) }));
        check("Space: a dodge (no roll sheet - no swing); he keeps facing east (the picture too, 8-way), standing, no steps - at every step", res.every(d => d.started && !d.swing && d.dirs.every(v => v === d.dir0) && d.d8.every(v => v === 6) && d.still >= 4), res.map(d => ({ s: d.started, sw: d.swing, dirs: [...new Set(d.dirs)], d8: [...new Set(d.d8)], still: d.still })));
        check("Unik picks the step: rank 1 -> the slow hop, 2 -> the further hop, 3 -> the blur", res.map(d => d.tier).join() === "0,1,2", sum);
        check("step 0: a slow hop back (~34 frames, 1.25 tiles), he crouches first (no move), leaves the ground (lift > 10 px), no blur", Math.abs(at(res[0], 0.12)) < 0.05 && res[0].lift >= 10 && res[0].ghosts === 0 && end(res[0]) < -1.15 && end(res[0]) > -1.35 && res[0].xs.length >= 30,
            Object.assign({ ok: [Math.abs(at(res[0], 0.12)) < 0.05, res[0].lift >= 10, res[0].ghosts === 0, end(res[0]) < -1.15, end(res[0]) > -1.35, res[0].xs.length >= 30] }, sum[0]));
        check("step 1: a little quicker and further (~30 frames, 1.6 tiles), a lower hop, no blur", res[1].xs.length < res[0].xs.length && end(res[1]) < -1.45 && end(res[1]) > -1.75 && res[1].lift >= 6 && res[1].ghosts === 0, sum[1]);
        check("step 2: the fast blurred slide (~16 frames, 2.6 tiles): on the ground, fading copies behind, gone after", res[2].xs.length < res[1].xs.length && end(res[2]) < -2.4 && res[2].lift <= 1 && res[2].ghosts >= 2 && res[2].ghostsAfter === 0, sum[2]);
        // the rest before the next dodge: shorter with Zręczność (Combat.js rollChain: 26 frames at 5, 0.6 less a point, 6 at least)
        const chain = await J(`(function(){ const h = Combat.hero(), core = Tawerna.api("Combat_parts").core, d0 = h.attr.dex, out = {};
            for (const v of [5, 15, 25, 60]) { h.attr.dex = v; h.rev = (h.rev || 0) + 1; out[v] = core.rollChain(); }
            h.attr.dex = d0; h.rev++; return out; })()`);
        check("the rest after a dodge shortens with Zręczność: 26 / 20 / 14 frames at 5 / 15 / 25, never under 6", chain[5] === 26 && chain[15] === 20 && chain[25] === 14 && chain[60] === 6, chain);
        // the safety: the dodge and 3 frames at most - the master's slide with Zręczność 50 is no endless safety any more
        const safe = await JP(`new Promise(res => {
            const h = Combat.hero(), f = ${F}, d0 = h.attr.dex, r0 = h.skills.d_roll;
            h.attr.dex = 50; h.skills.d_roll = 3; h.rev = (h.rev || 0) + 1;
            f.act.rollCd = 0; f.act.iframes = 0; f.act.mode = "idle"; f.fillBreath();
            $gamePlayer.locate(${spot.x}, ${spot.y}); $gamePlayer.setDirection(6);
            f.pressDodge();
            const out = { len: f.act.rollLen, start: f.act.iframes, afterEnd: null, inPause: null };
            let last = -1;
            const iv = setInterval(() => {
                if (Graphics.frameCount === last) return; last = Graphics.frameCount;
                if (f.act.mode !== "roll" && out.afterEnd === null) { out.afterEnd = f.act.iframes; out.endF = last; }
                if (out.afterEnd !== null && last >= out.endF + 4) { out.inPause = f.act.iframes; out.cd = f.act.rollCd; clearInterval(iv); h.attr.dex = d0; h.skills.d_roll = r0; h.rev++; res(out); }
            }, 2);
        })`);
        check("the dodge's safety lasts the dodge and 3 frames at most (master's slide, Zręczność 50: 16 + 3), none left in the pause after it", safe.len === 16 && safe.start === 19 && safe.afterEnd <= 3 && safe.inPause === 0, safe);
        await frames(20);
        check("after every dodge he stands straight again, the hop's shadow gone", res.every(d => Math.abs(d.rotation) < 0.001 && !d.shadow), res.map(d => [d.rotation, d.shadow]));
        // (2026-11-26) the weight he wears slows the base hop: 25 kg (every worn thing's weight forced) - 50% slower, 20% shorter; the master's slide does not feel it
        await ev("window.__iw = Survival.itemWeight; Survival.itemWeight = () => 25; 0");
        await setRank(0);
        const hv = await dodge();
        await setRank(1);
        const hv1 = await dodge();
        await setRank(2);
        const hv2 = await dodge();
        await ev("Survival.itemWeight = window.__iw; 0");
        check("heavy gear (25 kg on him): rank 1 - 50% slower (51 frames), 20% shorter (1 tile); rank 2 - half that (38 frames, 1.44 tiles); rank 3 - no weight (16)",
            hv.len === 51 && end(hv) > -1.1 && end(hv) < -0.9 && hv1.len === 38 && end(hv1) > -1.55 && end(hv1) < -1.33 && hv2.len === 16, { len: hv.len, end: end(hv), r2: hv1.len, end2: end(hv1), master: hv2.len });
        await setRank(0);
        // screenshots: the hop in the air (step 0), the blur (step 2)
        await setRank(0);
        await ev(`$gamePlayer.locate(${spot.x}, ${spot.y}); $gamePlayer.setDirection(6); ${F}.act.rollCd = 0; ${F}.fillBreath(); 0`);
        await frames(10);
        await ev(`${F}.pressDodge(); 0`);
        await shotFrozen(`() => ${actE}.mode === "roll" && ${actE}.rollT >= 6`, "unik_0_przysiad.png");
        await shotFrozen(`() => ${actE}.mode === "roll" && ${actE}.rollT >= 15`, "unik_0_w_powietrzu.png");
        await frames(30);
        await setRank(2);
        await ev(`$gamePlayer.locate(${spot.x}, ${spot.y}); $gamePlayer.setDirection(6); ${F}.act.rollCd = 0; ${F}.fillBreath(); 0`);
        await frames(10);
        await ev(`${F}.pressDodge(); 0`);
        await shotFrozen(`() => ${actE}.mode === "roll" && ${actE}.rollT >= 9`, "unik_2_rozmycie.png");
        await frames(30);
        await setRank(0);

        // ================= 2. the clash =================
        await ev("window.__clash = []; Tawerna.on('weaponClash', e => __clash.push(e), { owner: 'UnikTest' }); Tawerna.on('heroHit', e => __clash.push(Object.assign({ hit: e.result }, e)), { owner: 'UnikTest' }); 0");
        // (a) his blow lands while the bandit's is a few frames from landing
        const a = await JP(`new Promise(res => {
            const f = ${F}; f.act.rollCd = 0; f.act.mode = "idle"; f.act.comboCd = 0; f.act.stun = 0;
            $gamePlayer.locate(${spot.x}, ${spot.y}); $gamePlayer.setDirection(6);
            const h = Humans.spawn("bandit", ${spot.x + 1}, ${spot.y}, { engaged: true, noBand: true });
            h._noSurrender = true; window.__h = h;
            window.__clashAt = -1; Tawerna.on("weaponClash", () => { __clashAt = Graphics.frameCount; }, { owner: "UnikTestShot" });
            window.__freezeWhen = () => __clashAt >= 0 && Graphics.frameCount >= __clashAt + 3;
            const hp0 = $gameParty.leader().hp, bh0 = h._hp;
            if (f.fillBreath) f.fillBreath();
            if (!f.pressAttack()) return res({ err: "no attack", mode: f.act.mode });
            const CT = window.ChoppableTree, s = $gamePlayer._toolSwing, def = s && CT.swingKind(s._swingKind);
            const lead = def ? Math.max(0, def.impact - s._swingT) : 6;
            h.startBlow("main");
            h._feint = false;   // (a real blow, not a feint)
            const at = (h.blowDef() || {}).hitAt || 3;
            h._modeT = Math.max(0, lead - at - 1);   // (its blow ~1 frame after his impact)
            let n = 0;
            const iv = setInterval(() => { if (++n > 60) { clearInterval(iv); res({ clash: __clash.slice(), hp: $gameParty.leader().hp - hp0, bandit: h._hp - bh0, mode: h._mode, clashes: f.act.clashes || 0, lead }); } }, 16);
        })`);
        check("(a) his blow at the moment of the bandit's: the blades cross - sparks and the cry, nobody hurt, the bandit thrown off his stroke", a.clashes >= 1 && a.clash.some(e => e.by === "bandit" && !e.hit) && a.hp === 0 && a.bandit === 0, a);
        for (let i = 0; i < 50 && !(await ev("window.__frozen")); i++) await sleep(30);
        await sleep(150);
        await b.shot(path.join(OUT, "starcie_a.png"));
        await ev("window.__frozen = false; window.__freezeWhen = null; 0");
        await ev("Humans.clear(); __clash = []; 0");
        await frames(20);
        // (b) the bandit's blow lands while his own is just at its impact
        const bb = await JP(`new Promise(res => {
            const f = ${F}; f.act.rollCd = 0; f.act.mode = "idle"; f.act.comboCd = 0; f.act.stun = 0; f.act.clashes = 0;
            $gamePlayer.locate(${spot.x}, ${spot.y}); $gamePlayer.setDirection(6);
            const h = Humans.spawn("bandit", ${spot.x + 1}, ${spot.y}, { engaged: true, noBand: true });
            h._noSurrender = true;
            const hp0 = $gameParty.leader().hp;
            if (!f.pressAttack()) return res({ err: "no attack" });
            const CT = window.ChoppableTree, s = $gamePlayer._toolSwing, def = s && CT.swingKind(s._swingKind);
            let n = 0, fired = false;
            const iv = setInterval(() => {
                // (his swing 2 frames before its impact: the bandit's blow lands now, from the front)
                if (!fired && s && s._swingT >= def.impact - 2) { fired = true; h.startBlow("main"); h.blowLand(h.blowDef()); }
                if ((f.act.clashes || 0) >= 1 && !window.__clashSeen) window.__clashSeen = n;
                if (++n > 400 || (window.__clashSeen && n > window.__clashSeen + 20)) { clearInterval(iv); window.__clashSeen = 0; res({ clash: __clash.slice(), hp: $gameParty.leader().hp - hp0, clashes: f.act.clashes || 0, fired }); }
            }, 4);
        })`);
        check("(b) the bandit's blow lands while his is at its impact: crossed too (result 'clashed', no health lost)", bb.fired && bb.clashes >= 1 && bb.clash.some(e => e.hit === "clashed") && bb.hp === 0, bb);
        await ev("Humans.clear(); __clash = []; 0");
        // (c) with fists no clash: the blow simply lands
        const c = await JP(`new Promise(res => {
            const f = ${F}; f.act.mode = "idle"; f.act.stun = 0; f.act.flinchT = 0; f.act.comboCd = 0; f.act.clashes = 0; f.act.iframes = 0; f.fillBreath(); Combat.setHand("m0");
            $gamePlayer.locate(${spot.x}, ${spot.y}); $gamePlayer.setDirection(6);
            const h = Humans.spawn("bandit", ${spot.x + 1}, ${spot.y}, { engaged: true, noBand: true });
            f.pressAttack();
            const s = $gamePlayer._toolSwing, def = s && ChoppableTree.swingKind(s._swingKind);
            let n = 0, fired = false;
            const iv = setInterval(() => {
                if (!fired && s && s._swingT >= def.impact - 2) { fired = true; h.startBlow("main"); h.blowLand(h.blowDef()); }
                if (++n > 400) { clearInterval(iv); res({ clashes: f.act.clashes || 0, hits: __clash.map(e => e.hit || "clash") }); }
            }, 4);
        })`);
        check("(c) bare fists: no crossing - the bandit's blow lands", c.clashes === 0 && c.hits.includes("hit"), c);
        await ev("Humans.clear(); Combat.setHand('m60'); 0");

        // ================= 3. a seedling is walked over =================
        // (the map's event list is kept one frame - Wydajnosc.js eventsMemo: a frame after the planting the new tree is in it)
        await ev(`(function(){ const x = ${spot.x + 2}, y = ${spot.y}, id = Forestry.nextId(218); window.__rec = { id, x, y, day: Tawerna.time.day(), graphic: "!$Pine_A" };
            Forestry.treesOf(218).push(__rec); window.__tree = Forestry.spawn(__rec); return 0; })()`);
        await frames(3);
        const s3a = await J(`({ id: __rec.id, through: __tree.isThrough(), pass: $gamePlayer.canPass(__rec.x - 1, __rec.y, 6), pic: __tree.characterName() })`);
        await ev("__rec.day -= 4; Forestry.applyGrowth(__tree); 0");
        await frames(3);
        const s3 = Object.assign(s3a, await J(`({ grownThrough: __tree.isThrough(), grownPass: $gamePlayer.canPass(__rec.x - 1, __rec.y, 6), grownPic: __tree.characterName() })`));
        check("a planted seedling (heap with a sprout) is walked over; from the young tree on it stands in the way", s3.through && s3.pass && !s3.grownThrough && !s3.grownPass, s3);
        const err = await ev("(document.getElementById('errorPrinter') || {}).innerText || ''");
        check("no game error", !err, err.slice(0, 200));
    } catch (e) {
        console.log("FAIL test crashed: " + e.message);
        results.push(false);
    } finally {
        console.log(results.filter(Boolean).length + "/" + results.length + " passed");
        await b.close();
        process.exit(results.every(Boolean) ? 0 : 1);
    }
})();
