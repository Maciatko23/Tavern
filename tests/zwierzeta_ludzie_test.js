// Starcia.js (2026-10-17): the beasts and the men fight each other. 1. a wolf pack goes for a lone bandit at night and the fight is real
// (bites, blows, life, the loser lies there - a carcass or a body); the fire: no wolf steps into it, nobody by it is leapt at; a pack
// prowls round a camp, then goes for the most exposed - the men shout, take brands, a brand's blow frightens a wolf off. 2. the boar's
// charge rams whoever is on its line (a bandit, the hero), the boar goes for a bandit near it. 3. the bear goes for a bandit near it.
// 4. a camp archer shoots a hare, fetches it, the meat on the spit; a camp with an archer leaves less game round it. 5. raw meat thrown
// out at night (a bundle) draws a pack that eats it; a man among the wolves after the hero takes his place (running into a camp); a carcass
// left lying draws them too (weaker): gnawed to the bones, or dressed after a bite - less meat, no hide; the remains smell a little; no body.
// 6. the dog fights beside the hero, its own life, runs out of the fight badly hurt, at none - a day in the kennel (not dead).
// 7. another's kill gives no experience (the bus's kill with by and noXp); the quests' men and animals take no part; the warnings of
// Combat_Feel.js do not flash on a beast fighting another; the looks round are cheap.
// CDP_PORT=9513 node tests/zwierzeta_ludzie_test.js      (SHOTS=1: pictures and GIF frames into docs/zwierzeta_ludzie/)
const kit = require("./lib/kit.js");
const SHOTS = !!process.env.SHOTS;

kit.test({ port: 9513 }, async t => {
    t.check("a new game on the meadow (Map004) at 22:00", await t.newGame({ map: 4, x: 20, y: 14, hour: 22, quiet: true }));
    await t.eval("Hunting.RAID.perHour = 0; if (Humans.RAID) Humans.RAID.perHour = 0; $gameSystem.setStamina(100); $gameParty.leader().recoverAll(); Hunting.setSneak(true); 0");
    const shot = async name => { if (SHOTS) { await t.frames(2); await t.shot("../docs/zwierzeta_ludzie/" + name); } };
    const turbo = n => t.eval(`(function(){ if (!SceneManager.__zlOrig) SceneManager.__zlOrig = SceneManager.determineRepeatNumber; const o = SceneManager.__zlOrig, N = ${n};
        SceneManager.determineRepeatNumber = N > 1 ? function(dt) { return o.call(this, dt) * N; } : o; return 0; })()`);
    // the bus: the kills (who killed, experience or not)
    await t.eval("window.__kills = []; Tawerna.on('kill', e => __kills.push({ kind: e.kind, by: e.by, noXp: !!e.noXp, human: !!e.human }), { owner: 'ZLTest' }); 0");

    const ld = await t.json(`({ api: !!window.Starcia, listed: $plugins.some(p => p.name === 'Starcia' && p.status), ga: typeof Hunting.Game_Animal.prototype.takeHit,
        gh: typeof Humans.Game_Human.prototype.takeHit, gd: typeof Dog.Game_Dog.prototype.takeHit, every: Starcia.CFG.every })`);
    t.check("Starcia.js is in: on the plugin list, a takeHit on the animal, the man and the dog; the looks round every few frames", ld.api && ld.listed && ld.ga === "function" &&
        ld.gh === "function" && ld.gd === "function" && ld.every >= 5, ld);

    // the in-page helpers: an open field, everything cleared, the hero far off (and the camera on the fight)
    await t.eval(`(function(){
        window.__free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.hasObjectTile(x, y) && !Farming.buildingAt(x, y);
        window.__field = (w, h) => {
            let best = null;
            for (let y = 4; y < $gameMap.height() - 4; y++) for (let x = 4; x < $gameMap.width() - 4; x++) {
                let ok = true;
                for (let dx = -w; dx <= w && ok; dx++) for (let dy = -h; dy <= h; dy++) if (!__free(x + dx, y + dy)) { ok = false; break; }
                if (ok && (!best || Math.abs(x - $gameMap.width() / 2) + Math.abs(y - $gameMap.height() / 2) < Math.abs(best.x - $gameMap.width() / 2) + Math.abs(best.y - $gameMap.height() / 2))) best = { x, y };
            }
            return best;
        };
        window.__clear = () => { Humans.clear(); for (const d of Humans.drops().slice()) Humans.removeDrop(d); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a);
            Hunting.packs.length = 0; for (const c of Hunting.carcasses().slice()) Hunting.removeCarcass(c); const s = Humans.state(); s.camps[$gameMap.mapId()] = { night: Humans.nightKey(), none: true };
            for (const b of Drops.list()) for (const id of Object.keys(b.items)) Drops.take(b.id, Number(id), 999);   // (no bundle left lying: no bait)
            Combat.resetAct(); $gameParty.leader().recoverAll(); return 0; };
        // the hero on a free tile at least d from every point given (the farthest he can get), the camera on (fx, fy)
        window.__heroAway = (pts, d, fx, fy) => {
            let best = null, bs = -1;
            for (let y = 2; y < $gameMap.height() - 2; y++) for (let x = 2; x < $gameMap.width() - 2; x++) {
                if (!__free(x, y)) continue;
                const m = Math.min(...pts.map(p => Math.hypot(p.x - x, p.y - y)));
                const s = m >= d ? 1000 - Math.abs(m - d) : m;
                if (s > bs) { bs = s; best = { x, y, m }; }
            }
            $gamePlayer.locate(best.x, best.y);
            if (fx !== undefined) $gameMap.setDisplayPos(fx - $gameMap.screenTileX() / 2, fy - $gameMap.screenTileY() / 2);
            return best;
        };
        window.__cam = (fx, fy) => { $gameMap.setDisplayPos(fx - $gameMap.screenTileX() / 2, fy - $gameMap.screenTileY() / 2); return 0; };
        return 0; })()`);
    const xp0 = await t.eval("Combat.hero().xp");

    // ================= 1a. a wolf pack goes for a lone bandit; the fight is real; the loser lies there =================
    const A = await t.json(`(function(){
        __clear();
        const f = __field(7, 2);
        if (!f) return null;
        const h = Humans.spawn("bandit", f.x - 3, f.y, { tag: "f9", mode: "idle", level: 1 });
        h._noSurrender = true; h._maxHp = h._hp = 80;   // (he lives long enough to strike back - who wins is the fight's)
        const pack = Hunting.spawnPack(f.x + 4, f.y, 2);
        for (const w of pack.members) { w._summoned = true; w._level = 1; w._maxHp = w._hp = 34; }
        window.__A = { h, pack };
        const away = __heroAway([{ x: f.x, y: f.y }], 13, f.x, f.y);
        Starcia.tick();
        return { f, away: Math.round(away.m), clash: pack._clash === h, engaged: !!pack.engaged, wolves: pack.members.length };
    })()`);
    t.check("1. at night a pack (2) goes for a lone bandit 7 tiles off (the hero 13+ tiles away): the pack's foe is the man, it is up", !!A && A.clash && A.engaged && A.wolves === 2, A);
    await turbo(2);
    const Ar = { bitten: false, struck: false, foe: false, ring: false };
    for (let i = 0; i < 60; i++) {
        await t.frames(60);
        const s = await t.json(`(function(){ const { h, pack } = __A, live = pack.members.filter(m => !m._dead);
            return { hp: h._hp, max: h._maxHp, dead: h._dead, foe: !!(Humans.foeOf(h) && Humans.foeOf(h) instanceof Hunting.Game_Animal), wolves: live.length,
                wolfHurt: pack.members.some(m => m._hp < m._maxHp), mode: live.map(m => m._mode), ring: live.some(m => ["stalk", "windup", "lunge", "recover", "close"].includes(m._mode)) }; })()`);
        Ar.bitten = Ar.bitten || s.hp < s.max || s.dead;
        Ar.struck = Ar.struck || s.wolfHurt;
        Ar.foe = Ar.foe || s.foe;
        Ar.ring = Ar.ring || s.ring;
        if (s.dead || s.wolves === 0) { Ar.end = s; break; }
        if (i === 6) await shot("01_wilki_samotny_bandyta.png");
    }
    await turbo(1);
    t.check("the wolves ring him and leap (stalk / wind-up / leap), they bite him (his life down), he turns on a wolf and strikes back (a wolf's life down)",
        Ar.ring && Ar.bitten && Ar.foe && Ar.struck, Ar);
    const Aend = await t.json(`({ end: (function(){ const { h, pack } = __A; return { dead: h._dead, wolves: pack.members.filter(m => !m._dead && Hunting.animals.includes(m)).length }; })(),
        body: Humans.drops().some(d => d.kind === 'body'), carcass: Hunting.carcasses().some(c => c.kind === 'wolf'), kills: __kills.slice(), xp: Combat.hero().xp })`);
    t.check("the loser lies there: the bandit's body to search, or a wolf's carcass to dress; the kill on the bus by 'wolf' / 'human', no experience",
        (Aend.body || Aend.carcass) && Aend.kills.length > 0 && Aend.kills.every(k => (k.by === "wolf" || k.by === "human") && k.noXp), Aend);
    t.check("7. the hero gets no experience for the others' kills", Aend.xp === xp0, { xp0, xp: Aend.xp });

    // ================= 1b. fire: no wolf steps into it; the men by it are out of reach, the sleepers at the edge are not =================
    const B = await t.json(`(function(){
        __clear();
        const away = __heroAway([{ x: $gameMap.width() / 2, y: $gameMap.height() / 2 }], 0);
        const camp = Humans.camp({ far: 3, near: 40, kinds: ["bandit", "bandit", "bandit"], tag: "" });
        if (!camp) return null;
        const men = Humans.list.filter(h => h._campRef);
        for (const h of men) h._frozen = true;   // (here only the wolf and the fire)
        const fire = Starcia.fires().find(f => f.camp);
        const w = Hunting.spawn("wolf", camp.x + 1, camp.y + 1);
        w._summoned = true;
        window.__B = { camp, w };
        return { fire: !!fire, men: men.map(h => ({ mode: h._mode, d: Math.round(Math.hypot(h.centerX() - camp.x - 0.5, h.centerY() - camp.y - 0.5) * 10) / 10, shielded: Starcia.shielded(h) })) };
    })()`);
    t.check("the camp's fire is a fire (Starcia.fires); the ones sitting by it are out of the wolves' reach, the sleepers at the edge are not",
        !!B && B.fire && B.men.filter(m => m.mode === "sit").every(m => m.shielded) && B.men.filter(m => m.mode === "sleep").every(m => !m.shielded) && B.men.some(m => m.mode === "sleep"), B);
    await t.frames(150);
    const Bd = await t.eval("(function(){ const { camp, w } = __B; return Math.round(Math.hypot(w.centerX() - camp.x - 0.5, w.centerY() - camp.y - 0.5) * 100) / 100; })()");
    t.check("a wolf put down beside the fire steps away from it (" + Starcia_keep() + " tiles at least)", Bd >= 1.6, Bd);
    function Starcia_keep() { return "1.7"; }

    // ================= 1c. a pack prowls round a camp (F9 row), then goes for the most exposed; the men shout, take brands; a brand frightens =================
    await t.eval("__clear(); Starcia.pending = 'camp'; 0");
    await t.frames(6);
    const C0 = await t.json(`(function(){
        const camp = Humans.campHere(), pack = Hunting.packs.find(p => p.members.some(m => !m._dead && m._summoned));
        if (!camp || !pack) return { camp: !!camp, pack: !!pack };
        const L = pack.members[0];
        const away = __heroAway([{ x: camp.x, y: camp.y }, { x: L._x, y: L._y }], 14, camp.x, camp.y);
        window.__C = { camp, pack };
        return { camp: true, pack: true, wolves: pack.members.length, men: Humans.list.filter(h => h._campRef).length, away: Math.round(away.m),
            d: Math.round(Math.hypot(L._x - camp.x, L._y - camp.y)) };
    })()`);
    t.check("F9 'Wilki przy obozie bandytów (noc)': a camp with its fire and men, a pack of 3 some tiles off it", C0.camp && C0.pack && C0.wolves === 3 && C0.men >= 2, C0);
    await turbo(2);
    const Cr = { prowl: false, attack: false, watch: false, brand: false, fear: false, shout: false, heroAlarm: false, woke: false, hits: false };
    let gifC = 0;
    for (let i = 0; i < 90; i++) {
        await t.frames(40);
        const s = await t.json(`(function(){ const { camp, pack } = __C, live = pack.members.filter(m => !m._dead), men = Humans.list.filter(h => h._campRef), band = men[0] && men[0]._band;
            const L = live[0];
            return { prowl: !!(pack._prowl && L && L._goal), attack: !!(pack._clash && pack._clash._campRef), watch: men.some(h => Humans.foeOf(h) instanceof Hunting.Game_Animal),
                brand: men.some(h => h._brand), fear: live.some(m => m._brandFear > 0), shout: !!(band && band._beastShout), heroAlarm: !!(band && band._heroAlarm),
                woke: men.length > 0 && men.every(h => h._mode !== "sleep"), hits: men.some(h => h._hp < h._maxHp) || live.some(m => m._hp < m._maxHp),
                live: live.length, men: men.length, cx: camp.x, cy: camp.y };
        })()`);
        for (const k of Object.keys(Cr)) Cr[k] = Cr[k] || s[k];
        if (SHOTS && Cr.attack && gifC < 40 && i % 1 === 0) { await t.eval(`__cam(${s.cx}, ${s.cy})`); await t.shot("../docs/zwierzeta_ludzie/klatki_oboz/" + String(gifC++).padStart(2, "0") + ".png"); }
        if (Cr.attack && Cr.brand && Cr.fear && Cr.hits && (gifC >= 40 || !SHOTS)) break;
        if (s.live === 0 || s.men === 0) break;
    }
    await turbo(1);
    if (SHOTS) await shot("02_wilki_przy_ognisku.png");
    t.check("the pack goes round the camp first (at the edge of the firelight), then goes for one of the camp (the most exposed)", Cr.prowl && Cr.attack, Cr);
    t.check("the men shout ('Wilki!'), go for the wolves (a wolf their foe), take brands out of the fire; a brand's blow frightens a wolf off; the sleepers are up",
        Cr.shout && Cr.watch && Cr.brand && Cr.fear && Cr.woke && Cr.hits, Cr);
    t.check("the band is up for the wolves, not after the hero (he is far: no alarm of him)", !Cr.heroAlarm, Cr);

    // ================= 2. the boar: it rams whoever is on its line - a bandit, the hero too - and goes for a bandit near it (F9 row) =================
    const D = await t.json(`(function(){
        __clear();
        const f = __field(7, 1);
        if (!f) return null;
        const a = Humans.spawn("bandit", f.x + 5, f.y, { tag: "f9", mode: "idle", level: 1 }), b = Humans.spawn("bandit", f.x, f.y, { tag: "f9", mode: "idle", level: 1 });
        a._frozen = true; b._frozen = true; a._noSurrender = true; b._noSurrender = true; a._maxHp = a._hp = 200; b._maxHp = b._hp = 200;
        const boar = Hunting.spawn("boar", f.x - 4, f.y);
        boar._summoned = true;
        __heroAway([{ x: f.x, y: f.y }], 12, f.x, f.y);
        boar._clash = a; boar._aware = 1; boar.setDirection(6); boar.setMode("charge", 240);
        window.__D = { a, b, boar, f };
        return { f };
    })()`);
    let Dr = null;
    for (let i = 0; i < 20; i++) {
        await t.frames(15);
        Dr = await t.json(`(function(){ const { a, b, boar } = __D; return { bHit: b._hp < b._maxHp, aHit: a._hp < a._maxHp, mode: boar._mode, x: Math.round(boar._realX * 10) / 10 }; })()`);
        if (Dr.bHit && (Dr.aHit || i > 12)) break;
    }
    t.check("2. a boar charging at one bandit rams the other one standing on its line (his life down)", !!D && Dr && Dr.bHit, Dr);
    const Dh = await t.json(`(function(){
        const { a, b, f } = __D; Humans.remove(b);
        for (const x of Hunting.animals.slice()) Hunting.removeAnimal(x);
        const boar = Hunting.spawn("boar", f.x - 4, f.y); boar._summoned = true;
        $gameParty.leader().recoverAll(); Combat.resetAct();
        $gamePlayer.locate(f.x, f.y); $gamePlayer.setDirection(2);
        boar._clash = a; boar._aware = 1; boar.setDirection(6); boar.setMode("charge", 240);
        window.__D.boar = boar; window.__hp0 = $gameParty.leader().hp; return { hp: __hp0 };
    })()`);
    let Dhr = null;
    for (let i = 0; i < 20; i++) {
        await t.frames(15);
        Dhr = await t.json("({ hp: $gameParty.leader().hp, mode: __D.boar._mode })");
        if (Dhr.hp < Dh.hp) break;
    }
    t.check("the hero on the line of a boar charging at a bandit is rammed too", Dhr && Dhr.hp < Dh.hp, { before: Dh.hp, after: Dhr });
    await t.eval("__clear(); 0");
    await t.eval("(function(){ const f = __field(7, 2) || { x: 20, y: 14 }; __heroAway([{ x: f.x, y: f.y }], 0); Starcia.pending = 'boar'; return 0; })()");
    await t.frames(6);
    const Db = await t.json(`(function(){ const boar = Hunting.animals.find(a => a.kind() === 'boar'), h = Humans.list.find(o => o._tag === 'starcia');
        if (!boar || !h) return { boar: !!boar, h: !!h };
        __heroAway([{ x: boar._x, y: boar._y }, { x: h._x, y: h._y }], 12, h._x, h._y); h._noSurrender = true;
        window.__Db = { boar, h }; return { clash: boar._clash === h, d: Math.round(Math.hypot(boar._x - h._x, boar._y - h._y) * 10) / 10 }; })()`);
    t.check("F9 'Dzik i bandyta': a boar a few tiles from a bandit, its foe the bandit", Db.clash, Db);
    await turbo(2);
    let Dbr = { hurt: false, foe: false };
    for (let i = 0; i < 30; i++) {
        await t.frames(30);
        const s = await t.json(`(function(){ const { boar, h } = __Db; return { hurt: h._hp < h._maxHp || h._dead, foe: Humans.foeOf(h) === boar, mode: boar._mode, bh: boar._hp < boar._maxHp }; })()`);
        Dbr.hurt = Dbr.hurt || s.hurt; Dbr.foe = Dbr.foe || s.foe; Dbr.boarHurt = Dbr.boarHurt || s.bh;
        if (i === 4) await shot("03_dzik_i_bandyta.png");
        if (Dbr.hurt && Dbr.foe) break;
    }
    await turbo(1);
    t.check("the boar warns and charges at the bandit (gored: his life down), the bandit turns on the boar", Dbr.hurt && Dbr.foe, Dbr);

    // ================= 3. the bear goes for a bandit near it (F9 row); no meeting of the hero's counted =================
    const met0 = await t.eval("((Hunting.hunt().bears || {}).met) || 0");
    await t.eval("__clear(); (function(){ const f = __field(7, 2) || { x: 20, y: 14 }; __heroAway([{ x: f.x, y: f.y }], 0); })(); Starcia.pending = 'bear'; 0");
    await t.frames(6);
    const E = await t.json(`(function(){ const bear = Hunting.animals.find(a => a.kind() === 'bear'), h = Humans.list.find(o => o._tag === 'starcia');
        if (!bear || !h) return { bear: !!bear, h: !!h };
        __heroAway([{ x: bear._x, y: bear._y }, { x: h._x, y: h._y }], 12, h._x, h._y); h._noSurrender = true; h._maxHp = h._hp = 150;
        window.__E = { bear, h }; return { clash: bear._clash === h, mode: bear._mode }; })()`);
    t.check("3. F9 'Niedźwiedź i bandyta': a bear near a bandit, its foe the bandit (it rears up at him)", E.clash, E);
    await turbo(2);
    const Er = { chase: false, hurt: false, foe: false };
    for (let i = 0; i < 40; i++) {
        await t.frames(30);
        const s = await t.json(`(function(){ const { bear, h } = __E; return { chase: ["chase", "swipeWind", "swipe", "pinWind", "lunge", "recover"].includes(bear._mode), hurt: h._hp < h._maxHp || h._dead, foe: Humans.foeOf(h) === bear }; })()`);
        for (const k of Object.keys(Er)) Er[k] = Er[k] || s[k];
        if (i === 6) await shot("04_niedzwiedz_i_bandyta.png");
        if (Er.chase && Er.hurt && Er.foe) break;
    }
    await turbo(1);
    const met1 = await t.eval("((Hunting.hunt().bears || {}).met) || 0");
    t.check("the bear comes at him, strikes (his life down), he fights it; the hero's bear meetings unchanged", Er.chase && Er.hurt && Er.foe && met1 === met0, Object.assign({ met0, met1 }, Er));

    // ================= 4. a camp archer hunts a hare, fetches it, the meat on the spit; less game round a camp the next day =================
    const F = await t.json(`(function(){
        __clear();
        __heroAway([{ x: $gameMap.width() / 2, y: $gameMap.height() / 2 }], 0);
        const camp = Humans.camp({ far: 3, near: 40, kinds: ["archer", "bandit"], size: 2, tag: "" });
        if (!camp) return null;
        const archer = Humans.list.find(h => h._kind === "archer");
        archer.setMode("sit");
        const G = Hunting.pathGrid();
        let spot = null;
        for (let r = 4; r <= 6 && !spot; r++) for (let dy = -r; dy <= r && !spot; dy++) for (let dx = -r; dx <= r; dx++) {
            const x = archer._x + dx, y = archer._y + dy, d = Math.hypot(dx, dy);
            if (d < 4 || d > 6.5 || !__free(x, y) || !Hunting.clearLine(G, archer._x, archer._y, x, y, true)) continue;
            let open = true;   // (the arrow's own way: no herb or stump standing on it)
            for (let k = 1; k < 24 && open; k++) { const X = Math.floor(archer._x + 0.5 + (x - archer._x) * k / 24), Y = Math.floor(archer._y + 0.25 + (y - archer._y) * k / 24);
                if ((X !== x || Y !== y) && (X !== archer._x || Y !== archer._y) && $gameMap.eventsXy(X, Y).some(e => e.isNormalPriority() && e.characterName() !== "")) open = false; }
            if (!open) continue;
            if (Math.hypot(x - camp.x, y - camp.y) < 2.5) continue;
            spot = { x, y }; break;
        }
        if (!spot) return { spot: null };
        const hare = Hunting.spawn("rabbit", spot.x, spot.y); hare._summoned = true; hare._frozen = true;
        camp._stGame = null; camp.roast = null;   // (the evening's hunt left out: the spit only from this hare)
        __heroAway([{ x: camp.x, y: camp.y }], 13, camp.x, camp.y);
        window.__F = { camp, archer, hare };
        Starcia.tick();
        return { spot, hunt: !!archer._stHunt, mode: archer._mode, aim: !!archer._aim };
    })()`);
    t.check("4. a camp archer (awake by the fire) sees a hare in range: he stands and draws at it (no alarm for the band)", !!F && F.hunt && F.mode === "draw", F);
    const Fr = { dead: false, fetch: false, roast: false };
    for (let i = 0; i < 40; i++) {
        await t.frames(30);
        const s = await t.json(`(function(){ const { camp, archer, hare } = __F; return { dead: !!hare._dead, fetch: !!archer._stFetch, roast: !!camp.roast, mode: archer._mode, band: !!(archer._band && archer._band.engaged), hp: hare._hp, arrows: archer._arrows }; })()`);
        for (const k of ["dead", "fetch", "roast"]) Fr[k] = Fr[k] || s[k];
        Fr.band = Fr.band || s.band;
        Fr.last = [s.mode, s.hp, s.arrows];
        if (Fr.roast) break;
    }
    const Fs = await t.json(`({ spit: !!(SceneManager._scene._spriteset._starciaLayer && SceneManager._scene._spriteset._starciaLayer._spit), kill: __kills.filter(k => k.kind === 'rabbit').pop() || null })`);
    if (SHOTS) { await t.eval("__cam(__F.camp.x, __F.camp.y)"); await shot("05_lucznik_upolowal_rozen.png"); }
    t.check("the arrow kills it (the kill by 'human', no experience), he fetches the carcass, the meat goes on the spit over the fire (drawn)",
        Fr.dead && Fr.roast && Fs.spit && Fs.kill && Fs.kill.by === "human" && Fs.kill.noXp && !Fr.band, Object.assign({}, Fr, Fs));
    const Fg = await t.json(`(function(){ const c = __F.camp; c._stGame = "deer"; c._stGameDone = false; c.night = Tawerna.time.day() - 1;
        const before = Hunting.killedToday($gameMap.mapId(), "deer"); Starcia.campGame(c); return { before, after: Hunting.killedToday($gameMap.mapId(), "deer") }; })()`);
    t.check("a camp whose archer hunted: past midnight that game counts as taken round here (fewer deer on the map today)", Fg.after === Fg.before + 1, Fg);

    // ================= 5. bait: raw meat thrown out at night draws a pack that eats it; one among the wolves after the hero takes his place =================
    await t.eval("__clear(); window.__kit.pops.length = 0; 0");
    const G = await t.json(`(function(){
        const f = __field(6, 2);
        if (!f) return null;
        $gamePlayer.locate(f.x, f.y); $gamePlayer.setDirection(6);
        $gameParty.gainItem($dataItems[94], 3);
        const b = Drops.drop(94, 3);
        if (!b) return { drop: false };
        window.__G = { b };
        return { drop: true, x: b.x, y: b.y };
    })()`);
    const hint = (await t.popups()).some(p => /wilki go zwęszą/.test(p));
    t.check("5. raw meat thrown out of the bag at night (a bundle) - a hint: the wolves will smell it", !!G && G.drop && hint, { G, hint });
    const G1 = await t.json(`(function(){
        const { b } = __G, G2 = Hunting.pathGrid();
        let s = null, bd = -1;
        for (let y = 2; y < $gameMap.height() - 2; y++) for (let x = 2; x < $gameMap.width() - 2; x++) {
            const d = Math.hypot(x - b.x, y - b.y);
            if (d < 10 || d > 14 || !__free(x, y) || !__free(x + 1, y)) continue;
            if (d > bd) { bd = d; s = { x, y }; }
        }
        if (!s) return null;
        const pack = Hunting.spawnPack(s.x, s.y, 2);
        for (const w of pack.members) w._summoned = true;
        const away = __heroAway([{ x: b.x, y: b.y }, { x: s.x, y: s.y }], 13, b.x, b.y);
        window.__G.pack = pack;
        return { d: Math.round(bd), away: Math.round(away.m) };
    })()`);
    await turbo(2);
    const Gr = { goal: false, eat: false, less: false };
    for (let i = 0; i < 50; i++) {
        await t.frames(40);
        const s = await t.json(`(function(){ const { b, pack } = __G, L = pack.members.find(m => !m._dead), d = Drops.list().find(q => q.id === b.id);
            return { goal: !!(L && L._goal && Math.abs(L._goal.x - b.x) <= 1 && Math.abs(L._goal.y - b.y) <= 1), eat: !!pack._eat, left: d ? d.items[94] || 0 : 0, engaged: !!pack.engaged }; })()`);
        Gr.goal = Gr.goal || s.goal; Gr.eat = Gr.eat || s.eat; Gr.less = Gr.less || s.left < 3; Gr.engaged = Gr.engaged || s.engaged;
        if (i === 10 && SHOTS) await shot("06_przyneta.png");
        if (Gr.less) break;
    }
    await turbo(1);
    t.check("a pack 10+ tiles off goes to the meat and eats it (the bundle gets smaller)", Gr.goal && Gr.eat && Gr.less, Gr);
    const H5 = await t.json(`(function(){
        __clear();
        const f = __field(6, 1);
        const pack = Hunting.spawnPack(f.x, f.y, 2);
        for (const w of pack.members) w._summoned = true;
        const h = Humans.spawn("bandit", f.x + 1, f.y + 1, { tag: "", mode: "idle", level: 1 }); h._frozen = true;
        $gamePlayer.locate(f.x - 6, f.y);
        Hunting.wolfEngage(pack.members[0]);
        const before = pack._clash || null;
        Starcia.packTick(pack);
        return { before: !!before, after: pack._clash === h, engaged: !!pack.engaged };
    })()`);
    t.check("running into a camp: wolves after the hero, a man right among them (much nearer than the hero) - they turn on the man", !H5.before && H5.after && H5.engaged, H5);

    // ================= 5c. carrion: a carcass left lying draws a pack (weaker, nearer), they gnaw it (to the bones; a gnawed one gives less);
    // the remains of a dressed one smell a little; a man's body draws nothing; the first time a hint and a journal note =================
    await t.eval("__clear(); window.__kit.pops.length = 0; window.__eat0 = Starcia.CFG.carrion.eat; Starcia.CFG.carrion.eat = 120; 0");
    const R0 = await t.json(`(function(){
        const f = __field(6, 2);
        if (!f) return null;
        const rab = Hunting.dropCarcass("rabbit", f.x + 0.5, f.y + 0.5, 6);
        // a man's body near it (killed by a wolf): no bait
        const h = Humans.spawn("bandit", f.x + 2, f.y + 2, { tag: "f9", mode: "idle" }); h._killBy = "wolf"; Humans.kill(h, "beast");
        let s = null, bd = -1;
        for (let y = 2; y < $gameMap.height() - 2; y++) for (let x = 2; x < $gameMap.width() - 2; x++) {
            const d = Math.hypot(x - f.x, y - f.y);
            if (d < 8 || d > 10 || !__free(x, y) || !__free(x + 1, y)) continue;
            if (d > bd) { bd = d; s = { x, y }; }
        }
        const pack = Hunting.spawnPack(s.x, s.y, 2);
        for (const w of pack.members) w._summoned = true;
        const away = __heroAway([{ x: f.x, y: f.y }, { x: s.x, y: s.y }], 13, f.x, f.y);
        const bodyBait = Starcia.baits().some(b => !b.carcass && !b.meat && !b.remains);
        window.__R = { f, rab, pack };
        return { d: Math.round(bd), away: Math.round(away.m), body: Humans.drops().some(d => d.kind === 'body'), bodyBait,
            bait: Starcia.baits().filter(b => b.carcass).map(b => ({ smell: b.smell, penalty: b.penalty })) };
    })()`);
    t.check("5c. a carcass left lying is a bait - weaker than meat in a bundle (smell 11 against 18, a penalty); a man's body lying there is none",
        !!R0 && R0.body && !R0.bodyBait && R0.bait.length === 1 && R0.bait[0].smell < 18 && R0.bait[0].smell >= 10 && R0.bait[0].penalty > 0, R0);
    await turbo(2);
    const Rr = { goal: false, gnawed: false, bones: false };
    for (let i = 0; i < 50; i++) {
        await t.frames(40);
        const s = await t.json(`(function(){ const { f, rab, pack } = __R, L = pack.members.find(m => !m._dead);
            return { goal: !!(L && L._goal && Math.abs(L._goal.x - f.x) <= 1 && Math.abs(L._goal.y - f.y) <= 1), gnawed: (rab.gnawed || 0) > 0, bones: !Hunting.carcasses().includes(rab) }; })()`);
        for (const k of Object.keys(Rr)) Rr[k] = Rr[k] || s[k];
        if (Rr.bones) break;
    }
    const hintPop = (await t.popups()).some(p => /Wilki poczuły padlinę/.test(p)), note = await t.eval("Journal.data().notes.some(n => n.title === 'Padlina wabi wilki')");
    t.check("a pack 8-10 tiles off goes to it at night and gnaws it to the bones (gone); the first time: a hint over the hero and a journal note",
        Rr.goal && Rr.gnawed && Rr.bones && hintPop && note, Object.assign({ hintPop, note }, Rr));
    // a deer carcass: gnawed once, then dressed - less meat, no hide, the remains a faint bait
    const R2 = await t.json(`(function(){ const { f, pack } = __R; const deer = Hunting.dropCarcass("deer", f.x + 0.5, f.y + 0.5, 6); window.__R.deer = deer; return 0; })()`);
    let Rg = 0;
    for (let i = 0; i < 40; i++) { await t.frames(30); Rg = await t.eval("__R.deer.gnawed || 0"); if (Rg >= 1) break; }
    await turbo(1);
    const R3 = await t.json(`(function(){
        for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a);
        Hunting.packs.length = 0;
        const { f, deer } = __R;
        $gameParty.gainItem($dataItems[90], 1);
        $gamePlayer.locate(f.x - 1, f.y); $gamePlayer.setDirection(6);
        window.__before = { meat: $gameParty.numItems($dataItems[157]), hide: $gameParty.numItems($dataItems[96]), sinew: $gameParty.numItems($dataItems[163]) };
        window.__kit.pops.length = 0;
        Hunting.dressCarcass(deer);
        return { gnawed: deer.gnawed };
    })()`);
    await t.frames(120);
    const R4 = await t.json(`({ gnawed: __R.deer.gnawed, meat: $gameParty.numItems($dataItems[157]) - __before.meat, hide: $gameParty.numItems($dataItems[96]) - __before.hide,
        sinew: $gameParty.numItems($dataItems[163]) - __before.sinew, gone: !Hunting.carcasses().includes(__R.deer),
        remains: Starcia.baits().filter(b => b.remains).map(b => ({ smell: b.smell })) })`);
    const gnawPop = (await t.popups()).some(p => /ogryzły/.test(p));
    t.check("a deer gnawed " + R4.gnawed + "x and then dressed gives less (meat 3 - bites, the hide torn: none), a word about it; its remains smell a little (6 tiles)",
        Rg >= 1 && R4.gone && R4.meat === 3 - R4.gnawed && R4.hide === 0 && R4.sinew >= 1 && gnawPop && R4.remains.length === 1 && R4.remains[0].smell <= 6, Object.assign({ gnawPop }, R4));
    await t.eval("Starcia.CFG.carrion.eat = window.__eat0; Starcia.state().remains.length = 0; 0");

    // ================= 6. the dog fights beside the hero; its own life; badly hurt it runs out; at none a day in the kennel =================
    const I = await t.json(`(function(){
        __clear();
        const f = __field(6, 2);
        $gamePlayer.locate(f.x, f.y); $gamePlayer.setDirection(6);
        const s = Dog.state(); s.tame = true; s.trust = 3; s.map = $gameMap.mapId(); s.mode = "follow"; s.hp = Dog.maxHp(); s.st = Dog.maxSt(); s.food = 90; s.water = 90; s.hurtUntil = 0; s.clock = Tawerna.time.day() * 24 + Tawerna.time.hour();
        if (Dog.dog) Dog.removeDog();
        const g = Dog.spawnDog(f.x - 1, f.y);
        const pack = Hunting.spawnPack(f.x + 4, f.y, 2);
        for (const w of pack.members) { w._summoned = true; w._level = 1; w._maxHp = w._hp = 60; }
        Hunting.wolfEngage(pack.members[0]);
        $gameParty.leader().recoverAll();
        window.__I = { g, pack };
        return { dog: !!g, hp: s.hp, max: Dog.maxHp(), heroMhp: $gameParty.leader().mhp };
    })()`);
    t.check("6. the tame dog with the hero: its own life - half his", I.dog && I.hp === I.max && I.max === Math.round(I.heroMhp / 2), I);
    await turbo(2);
    const Ir = { fight: false, bite: false };
    let gifI = 0;
    for (let i = 0; i < 40; i++) {
        await t.frames(20);
        const s = await t.json(`(function(){ const { g, pack } = __I; $gameParty.leader().recoverAll(); return { fight: !!(g._stFight && g._stFight instanceof Hunting.Game_Animal), bite: pack.members.some(m => m._hp < m._maxHp), fx: g.x, fy: g.y }; })()`);
        Ir.fight = Ir.fight || s.fight; Ir.bite = Ir.bite || s.bite;
        if (SHOTS && Ir.fight && gifI < 30) { await t.eval(`__cam(${s.fx}, ${s.fy})`); await t.shot("../docs/zwierzeta_ludzie/klatki_pies/" + String(gifI++).padStart(2, "0") + ".png"); }
        if (Ir.fight && Ir.bite && (gifI >= 30 || !SHOTS)) break;
    }
    await turbo(1);
    if (SHOTS) await shot("07_pies_w_walce.png");
    t.check("the dog goes for a wolf that is after the hero and bites it (the wolf's life down)", Ir.fight && Ir.bite, Ir);
    const Iflee = await t.json(`(function(){
        const { g, pack } = __I, s = Dog.state(), w = pack.members.find(m => !m._dead) || Hunting.spawn("wolf", g.x + 2, g.y);
        s.hp = Math.round(Dog.maxHp() * 0.4);
        g.takeHit({ damage: Math.round(Dog.maxHp() * 0.15), from: w });
        const fleeing = (g._stFleeUntil || 0) > Graphics.frameCount;
        const prey = pack.members.filter(m => !m._dead).length ? Starcia.pickPrey(pack, pack.members.filter(m => !m._dead), 30, true) : null;
        return { hp: s.hp, fleeing, down: g.isDown(), notPrey: prey !== g };
    })()`);
    t.check("badly hurt (under 30%) it runs out of the fight - nobody's foe then", Iflee.fleeing && Iflee.down && Iflee.notPrey && Iflee.hp > 0, Iflee);
    const Idown = await t.json(`(function(){ const { g } = __I, s = Dog.state(); window.__kit.pops.length = 0; g._stFleeUntil = 0;
        g.takeHit({ damage: 999, from: null }); const now = Tawerna.time.day() * 24 + Tawerna.time.hour();
        return { hp: s.hp, hurt: s.hurtUntil > now, hours: Math.round(s.hurtUntil - now), still: !!Dog.dog, tame: s.tame, notNow: !Starcia.dogNow() }; })()`);
    await t.frames(4);
    const dogPop = (await t.popups()).some(p => /Pies jest ranny/.test(p));
    t.check("at no life it is not dead: hurt for a day (it drags itself to its kennel), still the hero's tame dog, out of every fight", Idown.hp === 0 && Idown.hurt && Idown.hours === 24 &&
        Idown.still && Idown.tame && Idown.notNow && dogPop, Object.assign({ dogPop }, Idown));
    await t.eval("(function(){ const s = Dog.state(); s.hurtUntil = 0; s.hp = Dog.maxHp(); Dog.removeDog(); s.tame = false; return 0; })()");

    // ================= 7. no experience for another's kill; the quests' men and beasts take no part; the warnings; cheap =================
    const K = await t.json(`(function(){
        const x0 = Combat.hero().xp;
        Tawerna.emit("kill", { kind: "wolf", by: "wolf", level: 3, mapId: $gameMap.mapId(), x: 0, y: 0 });
        Tawerna.emit("kill", { kind: "bandit", by: "human", level: 3, mapId: $gameMap.mapId(), x: 0, y: 0, human: true, name: "Bandyta" });
        const x1 = Combat.hero().xp;
        Tawerna.emit("kill", { kind: "wolf", by: "hero", level: 3, mapId: $gameMap.mapId(), x: 0, y: 0 });
        const x2 = Combat.hero().xp;
        return { x0, x1, x2 };
    })()`);
    t.check("7. the bus's kill by 'wolf' / 'human' gives no experience; by 'hero' does", K.x1 === K.x0 && K.x2 > K.x1, K);
    const Q = await t.json(`(function(){
        __clear();
        const f = __field(6, 2);
        $gamePlayer.locate(f.x - 13 > 2 ? f.x - 13 : 3, f.y);
        const quest = Humans.spawn("bandit", f.x, f.y, { tag: "w5Napad", mode: "idle" }), named = Humans.spawn("bandit", f.x, f.y + 1, { tag: "", name: "Rafał", mode: "idle" });
        const pack = Hunting.spawnPack(f.x + 4, f.y, 2);
        for (const w of pack.members) w._summoned = true;
        Starcia.packTick(pack);
        const bounty = Hunting.spawn("boar", f.x - 4, f.y); bounty._qbBounty = 7; bounty._summoned = true;
        const tq = Hunting.spawn("wolf", f.x - 4, f.y + 2); tq._noClash = true; tq._summoned = true;
        return { questFree: Starcia.freeMan(quest), namedFree: Starcia.freeMan(named), packClash: !!pack._clash, bountyFree: Starcia.freeBeast(bounty), tqFree: Starcia.freeBeast(tq),
            plainFree: Starcia.freeBeast(pack.members[0]) };
    })()`);
    t.check("the quests' men (a tag of their own, a name) and beasts (a contract's, a quest's wolf) take no part: no pack goes for them",
        !Q.questFree && !Q.namedFree && !Q.packClash && !Q.bountyFree && !Q.tqFree && Q.plainFree, Q);
    const W = await t.json(`(function(){
        __clear();
        const f = __field(6, 2);
        const h = Humans.spawn("bandit", f.x, f.y, { tag: "f9", mode: "idle" }); h._frozen = true;
        const pack = Hunting.spawnPack(f.x + 3, f.y, 2);
        for (const w of pack.members) w._summoned = true;
        $gamePlayer.locate(f.x - 4, f.y);
        Starcia.setPackClash(pack, h); Hunting.wolfEngage(pack.members[0]);
        const w = pack.members[0]; w.setMode("windup", 30);
        const threat = w.isThreat(), tell = w.combatTell();
        // cheap: a hundred looks round with a camp and a pack about
        const t0 = performance.now(); for (let i = 0; i < 100; i++) Starcia.tick(); const ms = performance.now() - t0;
        return { threat, tell, ms: Math.round(ms * 10) / 10 };
    })()`);
    t.check("a wolf winding up at a bandit is no threat of the hero's: no auto combat mode, no warning flash on it (Combat_Feel.js)", W.threat === false && W.tell === null, W);
    t.check("the looks round are cheap: 100 of them under 60 ms", W.ms < 60, W);

    await t.eval("__clear(); 0");
    t.check("no errors in the console", t.errors().length === 0, t.errors().slice(-5));
});
