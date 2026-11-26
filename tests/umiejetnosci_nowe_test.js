// (2026-11-26) the rebuilt skill trees (Skills_Data.js): the data (116 skills, rows at 1/3/6/10/14/18, 2 points a level), the refund in
// an old save, and the new skills at work: Zamaszyste cięcie, Przebicie, Wstrząs, Szał bitewny, Zwycięzca, Wir, Plecy do ściany,
// Tarcza dookoła, Odepchnięcie tarczą, Salwa, Przeszywająca strzała, Przygważdżający strzał, Wytrych, Targowanie, Łapacz deszczu, Studniarz.
// Run: CDP_PORT=9768 node tests/umiejetnosci_nowe_test.js
const { launch, sleep } = require("./cdp.js");
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 30000))]);
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    const JP = async e => JSON.parse(await ev("(" + e + ").then(r => JSON.stringify(r))"));
    const results = [];
    const check = (name, ok, info) => { results.push(!!ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(218, 27, 26, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===218").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev(`(function(){ SceneManager._scene.startFadeIn(1,false); if (window.Needs && Needs.setEnabled) Needs.setEnabled(false); if (window.Hunting) { Hunting.auto(false); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); }
            if (window.Humans) { Humans.auto(false); Humans.clear(); } $gameSystem.setDayNightHour(11); if (Combat.feel && Combat.feel.auto) Combat.feel.auto(false); return 0; })()`);

        // ================= the data
        const data = await J(`(function(){ const D = window.SkillData, core = Tawerna.api("Combat_parts").core;
            return { n: D.SKILLS.length, rows: D.ROW_LEVEL, perLevel: core.SKILL_POINTS_PER_LEVEL, gone: ["m_power2","d_body2","r_eagle","g_chop2","g_mine2","b_hits2"].filter(id => D.SKILLS.some(s => s.id === id)),
                fresh: ["m_cleave","m_pierce","m_stun","m_victor","m_fury","m_whirl","d_traps","d_push","d_back","d_round","r_pierce","r_volley","r_pin","s_rain","h_pets","c_lock","c_haggle","b_well","k_tips","k_shift"].filter(id => !D.SKILLS.some(s => s.id === id)),
                names: D.SKILLS.filter(s => !s.name || !s.text).map(s => s.id), ver: Combat.hero().skillsVer,
                three: D.SKILLS.filter(s => s.ranks !== 3 || !s.attrRanks || s.attrRanks.length !== 3).length, badFrom: D.SKILLS.filter(s => s.from.some(f => !D.SKILLS.some(o => o.id === f) || D.SKILLS.find(o => o.id === f).row >= s.row)).map(s => s.id) }; })()`);
        check("the trees: 116 skills, rows at 1/3/6/10/14/18, 2 points a level, the merged ones gone, the new ones there, every one named, every path from a lower row",
            data.n === 116 && data.rows.join() === "1,3,6,10,14,18" && data.perLevel === 2 && !data.gone.length && !data.fresh.length && !data.names.length && !data.badFrom.length && data.ver === 4 && data.three === 0, data);
        const lv = await J(`(function(){ const h = Combat.hero(), p0 = h.skillPoints, l0 = h.level; Combat.gainXp(Combat.xpToNext(1), "test", true); return { l0, l1: h.level, got: h.skillPoints - p0 }; })()`);
        check("a level gives 2 skill points", lv.l1 === lv.l0 + 1 && lv.got === 2, lv);
        // ================= the refund in an old save
        const ref = await J(`(function(){ const h = Combat.hero(); h.level = 12; h.skills = { m_power: 3, d_body2: 2, g_chop2: 1 }; h.skillPoints = 1; delete h.skillsVer; h.rev = (h.rev || 0) + 1;
            Tawerna.emit("load"); return { skills: Object.keys(h.skills).length, d_roll: h.skills.d_roll, pts: h.skillPoints, ver: h.skillsVer }; })()`);
        check("an old save: its skills come back as points once - 2 for each level after the first (level 12: 22); no skill left, Unik too", ref.skills === 0 && !ref.d_roll && ref.pts === 22 && ref.ver === 4, ref);
        const ref2 = await J(`(function(){ const h = Combat.hero(); Combat.learnSkill("m_power"); Tawerna.emit("load"); return { rank: Combat.skillRank("m_power"), pts: h.skillPoints }; })()`);
        check("...and only once (a second load keeps what was learnt)", ref2.rank === 1 && ref2.pts === 21, ref2);

        // ================= the melee group skills: frozen bandits, the rolls fixed
        const setup = `(function(o){
            Humans.clear(); const h = Combat.hero(); h.skills = Object.assign({}, o.skills); h.rev = (h.rev || 0) + 1; h.attr.str = 5;
            const f = Tawerna.api("Combat_parts").fight; f.fillBreath(); f.act.mode = "idle"; f.act.stun = 0; f.act.comboCd = 0; f.act.comboGrace = 0; f.act.iframes = 0;
            $gamePlayer.locate(o.x, o.y); $gamePlayer.setDirection(6); Combat.setCombatMode(true); Combat.setHand("m" + o.weapon);
            window.__foes = o.foes.map(([dx, dy]) => { const m = Humans.spawn("bandit", o.x + dx, o.y + dy, { noBand: true }); m._frozen = true; m._hp = m._maxHp = 999; m._noSurrender = true; return m; });
            window.__rnd = Math.random; Math.random = () => o.rnd;
            return 0; })`;
        const blow = async (o) => {
            await ev(setup + "(" + JSON.stringify(o) + ")");
            await frames(2);
            return await JP(`new Promise(res => { const f = Tawerna.api("Combat_parts").fight, hp0 = __foes.map(m => m._hp); f.pressAttack();
                let n = 0; const iv = setInterval(() => { if (++n > 60 || (f.act.mode === "idle" && n > 10)) { clearInterval(iv); Math.random = __rnd;
                    res({ lost: __foes.map((m, i) => hp0[i] - m._hp), stun: __foes.map(m => m._stun || 0) }); } }, 16); })`);
        };
        const swordId = await ev(`(function(){ const D = window.Bron_Data; const p = D && D.PRZEDMIOTY.find(p => p.rodzaj === "miecz"); if (p) $gameParty.gainItem($dataItems[p.id], 1); return p ? p.id : 0; })()`);
        await ev("$gameParty.gainItem($dataItems[154], 1); $gameParty.gainItem($dataItems[156], 1); 0");
        // an open piece of ground: 11 x 5 free tiles round the hero's spot
        const spot = await J(`(function(){
            const ok = (x, y) => $gameMap.isValid(x, y) && [2, 4, 6, 8].every(d => $gameMap.isPassable(x, y, d)) && $gameMap.eventsXyNt(x, y).length === 0;
            for (let r = 0; r < 30; r++) for (let y = 30 - r; y <= 30 + r; y++) for (let x = 30 - r; x <= 30 + r; x++) {
                let all = true; for (let dx = -3; dx <= 6 && all; dx++) for (let dy = -2; dy <= 2 && all; dy++) if (!ok(x + dx, y + dy)) all = false;
                if (all) return { x, y };
            }
            return { x: 30, y: 30 }; })()`);
        const X = spot.x, Y = spot.y;
        const c0 = await blow({ x: X, y: Y, weapon: swordId, skills: {}, foes: [[1, 0], [1, 1]], rnd: 0.5 });
        const c3 = await blow({ x: X, y: Y, weapon: swordId, skills: { m_cleave: 3 }, foes: [[1, 0], [1, 1]], rnd: 0.5 });
        check("Zamaszyste cięcie (sword): without it one is hit; at rank 3 the one beside takes ~50% of the blow", c0.lost[0] > 0 && c0.lost[1] === 0 && c3.lost[1] > 0 && Math.abs(c3.lost[1] / c3.lost[0] - 0.5) < 0.12, { c0, c3 });
        const arc = await J(`(function(){ const f = Tawerna.api("Combat_parts").fight, h = Combat.hero(), w = f.weaponNow(${swordId}), pick = f.weaponNow(116) || f.MELEE[116];
            h.skills = {}; h.rev++; const a0 = Math.acos(f.coneOf(w, false)) * 180 / Math.PI, p0 = Math.acos(f.coneOf(pick, false)) * 180 / Math.PI;
            h.skills = { sweep: 3 }; h.rev++; const a3 = Math.acos(f.coneOf(w, false)) * 180 / Math.PI, p3 = Math.acos(f.coneOf(pick, false)) * 180 / Math.PI;
            h.skills = {}; h.rev++; return { a0: +a0.toFixed(1), a3: +a3.toFixed(1), p0: +p0.toFixed(1), p3: +p3.toFixed(1) }; })()`);
        check("Szeroki zamach: the sword's arc 15% wider at rank 3; the pick's stays (it hits one)", Math.abs(arc.a3 / arc.a0 - 1.15) < 0.01 && arc.p3 === arc.p0, arc);
        const p3 = await blow({ x: X, y: Y, weapon: 154, skills: { m_pierce: 3 }, foes: [[1, 0], [2, 0]], rnd: 0.5 });
        const p0 = await blow({ x: X, y: Y, weapon: 154, skills: {}, foes: [[1, 0], [2, 0]], rnd: 0.5 });
        check("Przebicie (spear): the one behind takes ~90% at rank 3, nothing without it", p3.lost[1] > 0 && Math.abs(p3.lost[1] / p3.lost[0] - 0.9) < 0.12 && p0.lost[1] === 0, { p0, p3 });
        const st = await blow({ x: X, y: Y, weapon: 156, skills: { m_stun: 3 }, foes: [[1, 0]], rnd: 0.1 });
        check("Wstrząs (club): the stun roll (20%) - the one hit stunned 36 frames at rank 3", st.stun[0] >= 30, st);
        const fu0 = await blow({ x: X, y: Y, weapon: swordId, skills: {}, foes: [[1, 0], [-1, 1]], rnd: 0.5 });
        const fu3 = await blow({ x: X, y: Y, weapon: swordId, skills: { m_fury: 3 }, foes: [[1, 0], [-1, 1]], rnd: 0.5 });
        check("Szał bitewny: two foes within 3 tiles - the blow +24% at rank 3", Math.abs(fu3.lost[0] / fu0.lost[0] - 1.24) < 0.06, { fu0, fu3 });
        const vic = await J(`(function(){ const h = Combat.hero(); h.skills = { m_victor: 3 }; h.rev++; const a = $gameParty.leader(); a.setHp(Math.max(1, a.mhp - 50)); const hp0 = a.hp;
            Tawerna.emit("kill", { kind: "bandit", by: "hero" }); const mid = a.hp; Tawerna.emit("kill", { kind: "wolf", by: "dog" }); return { gain: mid - hp0, dog: a.hp - mid }; })()`);
        check("Zwycięzca: a kill of his heals 10 at rank 3; the dog's kill does not", vic.gain === 10 && vic.dog === 0, vic);

        // ================= the defence
        const crowd = await J(`(function(){ Humans.clear(); const h = Combat.hero(); const f = Tawerna.api("Combat_parts").fight, a = $gameParty.leader();
            $gamePlayer.locate(${X}, ${Y}); window.__rnd = Math.random; Math.random = () => 0.5;
            const foes = [[1,0],[-1,0],[0,1]].map(([dx,dy]) => { const m = Humans.spawn("bandit", ${X} + dx, ${Y} + dy, { noBand: true }); m._frozen = true; return m; });
            const hit = () => { a.setHp(a.mhp); f.act.iframes = 0; f.act.mode = "idle"; f.act.stun = 0; f.hitPlayer({ damage: 40, poise: 0, from: { x: foes[0].centerX(), y: foes[0].centerY() }, attacker: foes[0], name: "t" }); return a.mhp - a.hp; };
            h.skills = {}; h.rev++; const plain = hit(); h.skills = { d_back: 3 }; h.rev++; const back = hit(); Math.random = __rnd; return { plain, back }; })()`);
        check("Plecy do ściany: three foes within 2 tiles - a blow 30% less at rank 3", crowd.back > 0 && Math.abs(crowd.back / crowd.plain - 0.7) < 0.08, crowd);
        const side = await J(`(function(){ Humans.clear(); const h = Combat.hero(); const f = Tawerna.api("Combat_parts").fight, a = $gameParty.leader();
            $gamePlayer.locate(${X}, ${Y}); $gamePlayer.setDirection(6);
            const m = Humans.spawn("bandit", ${X}, ${Y} + 1, { noBand: true }); m._frozen = true;
            const hit = () => { a.setHp(a.mhp); f.act.iframes = 0; f.act.stun = 0; f.act.mode = "block"; f.act.blockT = 99; $gamePlayer.setDirection(6); const r = f.hitPlayer({ damage: 30, poise: 0, from: { x: m.centerX(), y: m.centerY() }, attacker: m, name: "t" }); f.act.mode = "idle"; return r; };
            h.skills = {}; h.rev++; const plain = hit(); h.skills = { d_round: 1 }; h.rev++; const round = hit(); return { plain, round }; })()`);
        check("Tarcza dookoła: facing east, a blow from the south (the side) - without it a clean hit, with it blocked", side.plain === "hit" && side.round === "blocked", side);
        const push = await JP(`new Promise(res => { Humans.clear(); const h = Combat.hero(); const f = Tawerna.api("Combat_parts").fight, a = $gameParty.leader();
            $gamePlayer.locate(${X}, ${Y}); $gamePlayer.setDirection(6);
            const m = Humans.spawn("bandit", ${X} + 1, ${Y}, { noBand: true }); m._frozen = true; const x0 = m._x;
            h.skills = { d_push: 1 }; h.rev++; a.setHp(a.mhp); f.act.iframes = 0; f.act.stun = 0; f.act.mode = "block"; f.act.blockT = 99;
            const r = f.hitPlayer({ damage: 30, poise: 0, from: { x: m.centerX(), y: m.centerY() }, attacker: m, name: "t" }); f.act.mode = "idle";
            res({ r, x0, x1: m._x, jumping: m.isJumping() }); })`);   // (the jump puts him on the next tile at once; left frozen - else he walks back home)
        check("Odepchnięcie tarczą: a blocked blow throws the attacker back a tile", push.r === "blocked" && push.x1 === push.x0 + 1, push);

        // ================= Wir
        const whirl = await JP(`new Promise(res => { Humans.clear(); const h = Combat.hero(); const f = Tawerna.api("Combat_parts").fight;
            h.skills = { m_whirl: 1 }; h.rev++; f.fillBreath(); f.act.mode = "idle"; f.act.stun = 0; f.act.comboCd = 0; f.act.comboGrace = 0;
            $gamePlayer.locate(${X}, ${Y}); $gamePlayer.setDirection(6); Combat.setHand("m${swordId}");
            const foes = [[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy]) => { const m = Humans.spawn("bandit", ${X} + dx, ${Y} + dy, { noBand: true }); m._frozen = true; m._hp = m._maxHp = 999; return m; });
            Input._currentState.shoot = true; f.pressAttack();
            let n = 0, seen = false, dirs = new Set();
            const iv = setInterval(() => { n++; if (f.act.mode === "whirl") { seen = true; dirs.add($gamePlayer._heroDir8 || $gamePlayer.direction()); }
                if (n === 150) { Input._currentState.shoot = false; Input._currentState.block = true; }
                if (n === 156) { Input._currentState.block = false; }
                if (n > 175) { clearInterval(iv); res({ seen, dirs: dirs.size, after: f.act.mode, hurt: foes.map(m => 999 - m._hp) }); } }, 16); })`);
        check("Wir: O held - he whirls (turns all round), cuts the four around him; P ends it", whirl.seen && whirl.dirs >= 6 && whirl.hurt.every(v => v > 0) && whirl.after !== "whirl", whirl);
        await ev("Humans.clear(); Input._currentState.shoot = false; Input._currentState.block = false; 0");

        // ================= the bow: Salwa, Przeszywająca strzała, Przygważdżający strzał
        await JP(`new Promise(res => { Humans.clear(); const h = Combat.hero(); h.skills = { r_volley: 2, r_pierce: 3, r_pin: 2 }; h.rev++;
            $gameParty.gainItem($dataItems[126], 1);
            const ammo = (Hunting.WEAPONS && Hunting.WEAPONS.bow && Hunting.WEAPONS.bow.ammo) || 0; if (ammo) $gameParty.gainItem($dataItems[ammo], 20);
            $gamePlayer.locate(${X}, ${Y}); $gamePlayer.setDirection(6); $gameSystem.setStamina(100);
            const a = Humans.spawn("bandit", ${X} + 3, ${Y}, { noBand: true }); a._frozen = true; a._hp = a._maxHp = 999;
            const b2 = Humans.spawn("bandit", ${X} + 4, ${Y}, { noBand: true }); b2._frozen = true; b2._hp = b2._maxHp = 999;
            res(0); })`);
        await ev("window.__shots = []; Tawerna.on('shot', e => __shots.push(e), { owner: 'SkillTest' }); 0");
        const shot = await JP(`new Promise(res => { const W = Tawerna.api("Hunting_parts").weapons; Combat.setHand("ranged");
            $gamePlayer.setDirection(6); $gamePlayer._heroDir8 = 6; if (window.Birds && Birds.auto) Birds.auto(false);
            Input._currentState.shoot = true; const ok = W.startAim(); let n = 0, maxFly = 0, full = false;
            const iv = setInterval(() => { n++; maxFly = Math.max(maxFly, W.projectiles().length); const a = W.aim(); if (a && a.full) full = true;
                if (n === 160) Input._currentState.shoot = false;
                if (n > 230) { clearInterval(iv); res({ ok, maxFly, full, weapon: W.pickWeapon ? W.pickWeapon() : "" }); } }, 16); })`);
        check("Salwa: the bow's circle closed - 3 arrows fanned out at rank 2", shot.ok && shot.full && shot.maxFly >= 3, shot);
        await frames(60);
        // (a straight shot east at the two in line - the aim's own direction was the test's trouble, not the skills')
        await ev(`(function(){ const W = Tawerna.api("Hunting_parts").weapons; if (W.resetCooldown) W.resetCooldown(); for (const m of Humans.list) { m._hp = 999; m._slowT = 0; } __shots = [];
            $gameSystem.setStamina(100); Hunting.shoot([1, 0], "bow"); return 0; })()`);
        await frames(60);
        const pin = await J(`(function(){ const hs = Humans.list.filter(m => !m._dead); return { foes: hs.map(m => ({ lost: 999 - m._hp, slow: m._slowT || 0, x: m.centerX(), y: m.centerY() })), shots: __shots, hero: [$gamePlayer._realX, $gamePlayer._realY] }; })()`);
        check("Przeszywająca strzała + Przygważdżający strzał: the first and the one behind it hit; the hit ones slowed", pin.foes.length >= 2 && pin.foes[0].lost > 0 && pin.foes[1].lost > 0 && pin.foes.some(p => p.slow > 0), pin);

        // ================= the work skills
        const work = await J(`(function(){ const h = Combat.hero(); const Z = window.Zamki, lock = { level: 3 };
            h.skills = {}; h.rev++; const s0 = Z ? Z.secsOf(lock) : 0, b0 = Z ? Z.breakOf(lock) : 0, skin0 = window.Needs && Needs.SKIN ? Needs.SKIN.max : -1;
            const barrel0 = JSON.stringify(Farming.BUILDINGS.barrel.cost), well0 = JSON.stringify(Farming.BUILDINGS.well.cost);
            const B = window.Bron, D = window.Bron_Data, sw = D && D.PRZEDMIOTY.find(p => p.rodzaj === "miecz"), shopKey = B && B.SKLEPY ? Object.keys(B.SKLEPY)[0] : null;
            const price0 = B && B.buyPrice && sw ? B.buyPrice(shopKey, sw.id, false) : 0;
            h.skills = { c_lock: 2, s_rain: 1, b_well: 3, c_haggle: 3 }; h.rev++;
            const s1 = Z ? Z.secsOf(lock) : 0, b1 = Z ? Z.breakOf(lock) : 0, skin1 = window.Needs && Needs.SKIN ? Needs.SKIN.max : -1;
            const price1 = B && B.buyPrice && sw ? B.buyPrice(shopKey, sw.id, false) : 0;
            const out = { s0, s1, b0, b1, skin0, skin1, barrel0, barrel1: JSON.stringify(Farming.BUILDINGS.barrel.cost), well0, well1: JSON.stringify(Farming.BUILDINGS.well.cost), price0, price1 };
            h.skills = {}; h.rev++; return out; })()`);
        check("Wytrych: a lock 2 levels easier (quicker) and the pick breaks less", work.s1 < work.s0 && work.b1 < work.b0, work);
        check("Łapacz deszczu: the waterskin +1 sip; Studniarz: the barrel and the well cost less", (work.skin0 < 0 || work.skin1 === work.skin0 + 1) && work.barrel1 !== work.barrel0 && work.well1 !== work.well0, work);
        check("Targowanie: a sword bought 20% cheaper at rank 3", !work.price0 || Math.abs(work.price1 / work.price0 - 0.8) < 0.05, work);
        const err = await ev("(document.getElementById('errorPrinter') || {}).innerText || ''");
        check("no game error", !err, err.slice(0, 200));
    } catch (e) { console.log("FAIL test crashed: " + e.message); results.push(false); }
    finally {
        console.log(results.filter(Boolean).length + "/" + results.length + " passed");
        await b.close();
        process.exit(results.every(Boolean) ? 0 : 1);
    }
})();
