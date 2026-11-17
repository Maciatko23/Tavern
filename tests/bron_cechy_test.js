// Cechy broni w grze (2026-11-17, gracz: małe stałe premie, lepsze bronie więcej; obrażenia ±10%; udane kucie). Nowy świat: piętro 1
// podziemi (stwory) i Podgrodzie Map218 (ludzie, kuźnia, karty). Sprawdza: zakres obrażeń w serii ciosów (90-110% podstawy), ogłuszenie
// buzdyganem na pająku (trwa swoje sekundy, gwiazdki, potem „dobicie”), krwawienie tasakiem (2 co sekundę przez 4 s; pusta zbroja nie
// krwawi), krew za krew mieczem Bogumiła, przebicie pancerza na przodzie pustej zbroi (50% -> 65% z mizerykordią), postrach i odrzut
// na bandycie, zasięg / oddech / parowanie / celowanie z cech, udane kucie wymuszone (Bron_Cechy.rng), słowa na karcie Ekwipunku i w
// sklepie kowala. Zrzuty: docs/ekwipunek/cechy/.
// Uruchom: node tests/run.js bron_cechy --port 9531
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "ekwipunek", "cechy");

// the page's helpers: a free tile in front of the hero, a frozen foe there (it neither moves nor strikes - its stun still counts down), one
// blow with a weapon, the raw damage every target got (Hunting.allTargets wrapped), what afterHit saw
const HELPERS = `(function(){
    if (window.__ce) return 0;
    const F = () => Tawerna.api("Combat_parts").fight;
    window.__ce = {
        raw: [], seen: [],
        spot() {
            const p = $gamePlayer;
            for (const d of [6, 4, 2, 8]) {
                const dx = d === 6 ? 1 : d === 4 ? -1 : 0, dy = d === 2 ? 1 : d === 8 ? -1 : 0;
                if ($gameMap.isPassable(p.x, p.y, d) && $gameMap.isPassable(p.x + dx, p.y + dy, d) && $gameMap.isPassable(p.x + 2 * dx, p.y + 2 * dy, d)) {
                    p.setDirection(d); return { x: p.x + dx, y: p.y + dy, d, dx, dy };
                }
            }
            return null;
        },
        freeze(c) {
            c.think = function() {}; c.turnFront = function() {}; c._engaged = true;
            c._faceAng = Math.atan2($gamePlayer._realY + 0.5 - c.centerY(), $gamePlayer._realX + 0.5 - c.centerX());
            return c;
        },
        creature(kind, hp) {
            Creatures.clear();
            const s = this.spot(), c = Creatures.spawnOne(kind, s.x, s.y, { level: 1 });
            if (hp) { c._maxHp = hp; c._hp = hp; }
            return this.freeze(c);
        },
        man(kind, hp) {
            Humans.clear();
            const s = this.spot(), h = Humans.spawn(kind, s.x, s.y, { noBand: true });
            h.think = function() {}; h._engaged = true;
            if (hp) { h._maxHp = hp; h._hp = hp; }
            return h;
        },
        hand(id) {
            if (id && $gameParty.numItems($dataItems[id]) < 1) $gameParty.gainItem($dataItems[id], 1);
            Combat.resetAct(); Bron.refresh();
            return Combat.setHand("m" + id);
        },
        blow(id) {
            this.hand(id);
            const s = this.spot();
            return new Promise(res => {
                const ok = Combat.pressAttack();
                let n = 0;
                const wait = () => { if (++n > 6 && (Combat.act.mode !== "attack" || n > 150)) res(ok); else requestAnimationFrame(wait); };
                wait();
            });
        },
        words() { return F().floaters.map(f => f.text); },
        // an open lane of n tiles to the right near the hero (no wall, no bush or other thing that stops a shot): he stands at its start
        lane(n) {
            const p = $gamePlayer, free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.isPassable(x, y, 6) &&
                !$gameMap.eventsXy(x, y).some(e => e.isNormalPriority() && e.characterName() !== "");
            for (let r = 0; r < 20; r++) for (let y = p.y - r; y <= p.y + r; y++) for (let x = p.x - r; x <= p.x + r; x++) {
                let ok = true;
                for (let k = 0; k <= n && ok; k++) ok = free(x + k, y);
                if (ok) { p.locate(x, y); p.setDirection(6); return { x, y }; }
            }
            return null;
        }
    };
    const at = Hunting.allTargets;
    Hunting.allTargets = function() {
        return at.apply(this, arguments).map(t => { const h = t.hit; t.hit = (d, how, ex) => { window.__ce.raw.push({ d, how, crit: !!(ex && ex.crit), przebicie: ex ? ex.przebicie || 0 : 0 }); return h(d, how, ex); }; return t; });
    };
    const ah = Bron_Cechy.afterHit;
    Bron_Cechy.afterHit = function(ref, tr, k) { const r = ah.apply(this, arguments); window.__ce.seen.push({ stun: ref ? ref._stun : null, k: !!k }); return r; };
    return 0;
})()`;
const HERO = `(function(){ const h = Combat.hero(); h.level = 30; h.skills = Object.assign({}, h.skills || {}, { execute: true }); h.rev = (h.rev || 0) + 1;
    $gameSystem.setStamina && $gameSystem.setStamina(250); const a = $gameParty.leader(); a.recoverAll(); Combat.setCombatMode(true); Bron.wire(); Bron.refresh(); return a.mhp; })()`;

kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    const m = await t.eval("Underground.mapOf(1)");
    t.check("nowa gra na 1. piętrze podziemi (Map" + m + ")", await t.newGame({ map: m, x: 0, y: 0, hour: 12, quiet: true, minimap: false }));
    await t.frames(20);
    await t.eval(HELPERS);
    await t.eval(HERO);
    await t.eval("Creatures.auto(false); Creatures.clear(); Humans.auto(false); 0");
    const loaded = await J(`({ data: !!window.Bron_Cechy_Data && Object.keys(Bron_Cechy_Data.CECHY).length, mech: !!window.Bron_Cechy, list: $plugins.map(p => p.name).filter(n => /^Bron/.test(n)) })`);
    t.check("wtyczki Bron_Cechy_Data (77 broni) i Bron_Cechy wczytane z listy gry, po Bron_Data i Bron", loaded.data === 77 && loaded.mech &&
        loaded.list.join() === "Bron_Data,Bron_Cechy_Data,Bron,Bron_Cechy", loaded);

    // ---- the range: 16 blows of the iron sword (27) at a straw target: 24-30 each (crits aside), several numbers
    const range = await J(`new Promise(async res => {
        const hits = []; window.__tgt = null;
        if (!window.__tgtHooked) { window.__tgtHooked = true; Hunting.addTargets(() => window.__tgt ? [window.__tgt] : []); }
        const s = __ce.spot();
        window.__tgt = { x: $gamePlayer._realX + 0.5 + s.dx, y: $gamePlayer._realY + 0.5 + s.dy, radius: 0.5, ref: { kind: () => "" }, hit: (d, how, ex) => hits.push({ d, crit: !!(ex && ex.crit) }) };
        for (let i = 0; i < 16; i++) await __ce.blow(305);
        window.__tgt = null;
        const plain = hits.filter(h => !h.crit).map(h => h.d);
        res({ n: hits.length, plain, min: Math.min(...plain), max: Math.max(...plain), kinds: new Set(plain).size, roll: Array.from({ length: 2000 }, () => Tawerna.api("Combat_parts").fight.dmgRoll()) .reduce((a, v) => [Math.min(a[0], v), Math.max(a[1], v)], [9, 0]) });
    })`, 90000);
    t.check("zakres obrażeń: 16 ciosów żelaznym mieczem (27) - każdy 24-30 (" + (range.plain || []).join(", ") + "), różne liczby; mnożnik losowany 0,9-1,1",
        range.n === 16 && range.min >= 24 && range.max <= 30 && range.kinds >= 3 && range.roll[0] >= 0.9 && range.roll[1] <= 1.1 && range.roll[1] - range.roll[0] > 0.18,
        { n: range.n, min: range.min, max: range.max, kinds: range.kinds, roll: range.roll });

    // ---- the stun: the iron mace (ogłuszenie 10% na 1,5 s, forced) on a spider - it reels 90 frames (its own reel: 50), the stars; then "dobicie"
    await t.eval("Bron_Cechy.rng = () => 0; 0");
    const stun = await J(`new Promise(async res => {
        const c = __ce.creature("pajak", 400); __ce.seen = [];
        await __ce.blow(317);
        const seen = __ce.seen.slice(), words = __ce.words(), stars = !!(c._sprite && c._sprite._stunStars && c._sprite._stunStars.visible);
        res({ seen, stunNow: c._stun, own: c._def.stun, words, stars, hp: c._hp });
    })`);
    t.check("ogłuszenie buzdyganem: pająk chwieje się 1,5 s (90 klatek, sam z siebie tylko " + stun.own + "), nad nim „Ogłuszony!” i gwiazdki",
        stun.seen.length === 1 && stun.seen[0].k && stun.seen[0].stun === 90 && stun.stunNow > stun.own && stun.words.includes("Ogłuszony!") && stun.stars, stun);
    const exec = await J(`new Promise(async res => { const c = Creatures.list.find(x => x._kind === "pajak"); const hp0 = c._hp; __ce.raw = [];
        Tawerna.api("Combat_parts").fight.floaters.length = 0; await __ce.blow(317); res({ stun: c._stun > 0, words: __ce.words(), lost: hp0 - c._hp, raw: __ce.raw.map(r => r.d) }); })`);
    t.check("ogłuszony dostaje „dobicie” (umiejętność Dobicie x2,5)", exec.words.some(w => /dobicie/.test(w)) && exec.lost >= 2 * 23, exec);

    // ---- the bleeding: the cleaver (krwawienie: 2 na sekundę przez 4 s) on a spider; the empty armour does not bleed
    const bleed = await J(`new Promise(async res => {
        const c = __ce.creature("pajak", 400); Bron_Cechy.bled = 0;
        await __ce.blow(306);
        const out = { list: Bron_Cechy.bleeds.length, dps: Bron_Cechy.bleeds[0] && Bron_Cechy.bleeds[0].dps, hp0: c._hp, words: __ce.words() };
        const t0 = Graphics.frameCount; out.ticks = [];
        const wait = () => { if (Graphics.frameCount - t0 > 290) { out.hp1 = c._hp; out.bled = Bron_Cechy.bled; out.after = Bron_Cechy.bleeds.length; res(out); }
            else { if (out.ticks[out.ticks.length - 1] !== c._hp) out.ticks.push(c._hp); requestAnimationFrame(wait); } };
        wait();
    })`, 30000);
    t.check("krwawienie tasakiem: rana na pająku, co sekundę 2 (" + (bleed.ticks || []).join(" > ") + "), przez 4 s razem 8, potem koniec",
        bleed.list === 1 && bleed.dps === 2 && bleed.hp0 - bleed.hp1 === 8 && bleed.bled === 8 && bleed.after === 0 && bleed.words.includes("Krwawi!"), bleed);
    const noBleed = await J(`new Promise(async res => { const c = __ce.creature("zbroja", 400); c._faceAng += Math.PI; await __ce.blow(306); res({ list: Bron_Cechy.bleeds.filter(b => b.ref === c).length, lost: 400 - c._hp, canBleed: Bron_Cechy.canBleed(c) }); })`);
    t.check("pusta zbroja nie krwawi (dostaje cios, rany nie ma)", noBleed.list === 0 && noBleed.lost > 0 && !noBleed.canBleed, noBleed);

    // ---- krew za krew: Bogumił's sword (2% of the most life a hit) - half the life, a blow at the spider
    const steal = await J(`new Promise(async res => {
        const c = __ce.creature("pajak", 400), a = $gameParty.leader(); a.setHp(Math.round(a.mhp / 2)); const hp0 = a.hp; Bron_Cechy.healed = 0;
        Tawerna.api("Combat_parts").fight.floaters.length = 0;
        await __ce.blow(396);
        res({ mhp: a.mhp, hp0, hp1: a.hp, healed: Bron_Cechy.healed, words: __ce.words() });
    })`);
    const want = Math.max(1, Math.round(steal.mhp * 0.02));
    t.check("krew za krew: trafienie mieczem Bogumiła oddaje 2% życia (+" + want + "), widać zieloną liczbę", steal.healed === want && steal.hp1 - steal.hp0 === want &&
        steal.words.includes("+" + want), steal);

    // ---- the plate: the empty armour's front takes 50% of a light blow; the misericorde (przebicie 30%) gets 65% through
    const plate = await J(`new Promise(async res => {
        const out = {};
        const c = __ce.creature("zbroja", 1000);
        Creatures.hit(c, 100, "melee", { poise: 0 }); out.plain = 1000 - c._hp;
        c._hp = 1000; Creatures.hit(c, 100, "melee", { poise: 0, przebicie: 0.3 }); out.pierced = 1000 - c._hp;
        c._hp = 1000; __ce.raw = []; await __ce.blow(303); out.raw = __ce.raw.slice(); out.real = 1000 - c._hp;
        c._hp = 1000; __ce.raw = []; await __ce.blow(305); out.raw2 = __ce.raw.slice(); out.real2 = 1000 - c._hp;
        res(out);
    })`);
    const r1 = plate.raw && plate.raw[0], r2 = plate.raw2 && plate.raw2[0];
    t.check("przebicie pancerza: przód pustej zbroi - zwykły cios 50% (100 -> " + plate.plain + "), z przebiciem 30% 65% (" + plate.pierced + "); mizerykordią naprawdę " +
        (r1 ? r1.d + " -> " + plate.real : "?") + ", żelaznym mieczem " + (r2 ? r2.d + " -> " + plate.real2 : "?"),
        plate.plain === 50 && plate.pierced === 65 && r1 && r1.przebicie === 0.3 && plate.real === Math.max(1, Math.round(r1.d * 0.65)) && r2 && r2.przebicie === 0 &&
        plate.real2 === Math.max(1, Math.round(r2.d * 0.5)), plate);
    await t.eval("Bron_Cechy.rng = null; Creatures.clear(); 0");

    // ---- the numbers the traits change: reach, breath, parry, the bow's aim, the wear
    const nums = await J(`(function(){ const w = Combat.weaponNow, out = {};
        out.reach = [Combat.MELEE[309].reach, w(309).reach]; out.cost = [Combat.MELEE[402] && Combat.MELEE[402].cost, w(402) && w(402).cost];
        $gameParty.gainItem($dataItems[311], 1); Combat.setHand("m311"); Bron.refresh(); Bron_Cechy.refresh(); const p1 = Combat.parryWindow();
        Combat.setHand("m0"); Bron_Cechy.refresh(); const p0 = Combat.parryWindow(); out.parry = [p0, p1];
        $gameParty.gainItem($dataItems[127], 10); $gameParty.gainItem($dataItems[472], 1); const d = Bron.rangedDef("bow"); out.bow = [d && d.item, d && d.steady, Bron_Data.staty(472).steady];
        out.life = [Durability.lifeOf(407), Bron_Data.trwalosc(Bron_Data.przedmiot(407))];
        return out; })()`);
    t.check("zasięg +0,2 (długi miecz 1,75 -> 1,95), oddech -2 (szabla spod Brzozowej Woli 9 -> 7), parowanie +20% w ręku (miecz zakonny), łuk wojenny celuje o 15% szybciej, stalowa siekiera wytrzymuje o 25% dłużej",
        nums.reach[0] === 1.75 && nums.reach[1] === 1.95 && nums.cost[0] === 9 && nums.cost[1] === 7 && Math.abs(nums.parry[1] - nums.parry[0] * 1.2) <= 1 && nums.parry[1] > nums.parry[0] &&
        nums.bow[0] === 472 && nums.bow[1] === Math.round(nums.bow[2] / 1.15) && nums.life[0] === Math.round(nums.life[1] * 1.25), nums);

    // ---- Podgrodzie: a bandit - postrach (the old sword of the First: 5%, forced) and odrzut (the shod staff: +1 tile)
    t.check("Podgrodzie (Map218)", await t.go(218, 30, 18, 6));
    await t.eval(HERO);
    await t.eval("Humans.auto(false); Creatures.clear(); 0");
    // (in the daylight, for the pictures: a man reels and bleeds as a creature does)
    const manStun = await J(`new Promise(async res => { Bron_Cechy.rng = () => 0; const h = __ce.man("bandit", 400); __ce.seen = []; await __ce.blow(317); Bron_Cechy.rng = null;
        res({ seen: __ce.seen.slice(), own: h._def.stun, stun: h._stun, words: __ce.words(), stars: !!(h._sprite && h._sprite._stunStars && h._sprite._stunStars.visible) }); })`);
    await t.shot(path.join(SHOTS, "ogluszenie_gwiazdki.png"));
    t.check("ogłuszenie na człowieku: bandyta po ciosie buzdyganem chwieje się 1,5 s (sam z siebie " + manStun.own + " klatek), gwiazdki nad głową",
        manStun.seen.length === 1 && manStun.seen[0].stun === 90 && manStun.stun > manStun.own && manStun.stars && manStun.words.includes("Ogłuszony!"), manStun);
    const manBleed = await J(`new Promise(async res => { Bron_Cechy.rng = () => 0; const h = __ce.man("bandit", 400); await __ce.blow(306); Bron_Cechy.rng = null;
        const hp0 = h._hp; let n = 0; const wait = () => { if (h._hp < hp0 || ++n > 120) res({ hp0, hp: h._hp, words: __ce.words(), list: Bron_Cechy.bleeds.filter(b => b.ref === h).length }); else requestAnimationFrame(wait); }; wait(); })`);
    await t.shot(path.join(SHOTS, "krwawienie.png"));
    t.check("krwawienie na człowieku: po sekundzie bandyta traci 2, czerwona liczba „2” nad nim", manBleed.list === 1 && manBleed.hp0 - manBleed.hp === 2 && manBleed.words.includes("2"), manBleed);
    await t.eval("Humans.clear(); Bron_Cechy.bleeds.length = 0; 0");
    const fear = await J(`new Promise(async res => { Bron_Cechy.rng = () => 0; const h = __ce.man("bandit", 400); await __ce.blow(310); Bron_Cechy.rng = null;
        res({ mode: h._mode, words: __ce.words(), hp: h._hp }); })`);
    t.check("postrach: trafiony prastarym mieczem bandyta ucieka", fear.mode === "flee" && fear.words.includes("Postrach!"), fear);
    const push = await J(`(function(){ const h = __ce.man("bandit", 400), s = __ce.spot(); h._poise = 999; const x0 = h._x, y0 = h._y;
        Bron_Cechy.beforeHit(h); Humans.hit(h, 5, "melee", { poise: 0, knock: true }); const one = [h._x - x0, h._y - y0];
        Bron_Cechy.afterHit(h, Bron_Cechy.of(453), null); return { one, two: [h._x - x0, h._y - y0], way: [s.dx, s.dy], jumping: h.isJumping() }; })()`);
    t.check("odrzut +1 pole: cios, który odrzuca bandytę o pole, z okutym kosturem odrzuca go o dwa",
        push.one[0] === push.way[0] && push.one[1] === push.way[1] && push.two[0] === 2 * push.way[0] && push.two[1] === 2 * push.way[1] && push.jumping, push);
    await t.eval("Humans.clear(); 0");

    // ---- the swing of a quick weapon (the iron sabre: szybkość +10%), the arrow through (the war bow: 2 in a line), the stunning stone (the
    // thong sling: 12% na 1 s, forced) at a bandit 3 tiles off
    const quick = await J(`(function(){ __ce.hand(307); __ce.spot(); Combat.pressAttack(); const s = $gamePlayer._toolSwing; const r = s && s.opts ? s.opts.rate : 1;
        Tawerna.api("Combat_parts").fight.endSwing(); Combat.resetAct(); return { rate: r }; })()`);
    const lane = await J("__ce.lane(5)");
    t.check("szybkość ataku +10%: zamach żelaznej szabli idzie 1,1 raza szybciej", Math.abs(quick.rate - 1.1) < 1e-9, quick);
    const pierce = await J(`new Promise(res => { const s = { dx: 1, dy: 0 }, hits = [];
        if (!window.__tgtsHooked) { window.__tgtsHooked = true; Hunting.addTargets(() => window.__tgts || []); }
        const mk = (k, name) => { const ref = { kind: () => name, _hp: 200 }; return { x: $gamePlayer._realX + 0.5 + s.dx * k, y: $gamePlayer._realY + 0.5 + s.dy * k, radius: 0.5, ref,
            hit: (d, how) => { ref._hp -= d; hits.push(name + ":" + how); } }; };
        window.__tgts = [mk(1.6, "pierwszy"), mk(2.8, "drugi")];
        $gameParty.gainItem($dataItems[472], 1); $gameParty.gainItem($dataItems[127], 10); Hunting.resetCooldown(); Hunting.animate(false);
        const ok = Hunting.shoot([s.dx, s.dy], "bow"); let n = 0;
        const wait = () => { if (++n > 90) { window.__tgts = null; Hunting.animate(true); res({ ok, hits, item: Bron.rangedDef("bow").item }); } else requestAnimationFrame(wait); }; wait(); })`);
    t.check("strzała przebija 2 wrogów: z łuku wojennego trafia pierwszego i leci dalej do drugiego", !!lane && pierce.ok && pierce.item === 472 && pierce.hits.join() === "pierwszy:shot,drugi:shot", pierce);
    const stone = await J(`new Promise(res => { Humans.clear(); const p = $gamePlayer, s = { dx: 1, dy: 0 }; const h = Humans.spawn("bandit", p.x + 3 * s.dx, p.y + 3 * s.dy, { noBand: true });
        h.think = function() {}; h._engaged = true; h._maxHp = h._hp = 400; __ce.seen = [];
        for (const id of [125, 126, 335, 336, 337, 338, 406, 471, 472]) $gameParty.loseItem($dataItems[id], 9);
        $gameParty.gainItem($dataItems[339], 1); $gameParty.gainItem($dataItems[64], 10); Hunting.resetCooldown(); Hunting.animate(false); Bron_Cechy.rng = () => 0;
        const ok = Hunting.shoot([s.dx, s.dy], "sling"); let n = 0;
        const wait = () => { if (h._hp < 400 || ++n > 90) { Bron_Cechy.rng = null; Hunting.animate(true); res({ ok, hp: h._hp, stun: h._stun, own: h._def.stun, seen: __ce.seen.slice(), sling: Bron.rangedDef("sling").item }); }
            else requestAnimationFrame(wait); }; wait(); })`);
    t.check("ogłuszający kamień: kamień z procy rzemiennej ogłusza bandytę na 1 s (60 klatek; sam z siebie " + stone.own + ")", stone.ok && stone.sling === 339 && stone.hp < 400 &&
        stone.seen.length === 1 && stone.seen[0].k && stone.seen[0].stun === 60, stone);
    await t.eval("Humans.clear(); 0");

    // ---- udane kucie (forced): the iron sword forged at the forge gets obrażenia +2 - the notice, the save, the card
    const forge = await J(`(function(){ Bron_Cechy.rng = () => 0; if ($gameParty.numItems($dataItems[305]) < 1) $gameParty.gainItem($dataItems[305], 1);
        if ($gameTemp._topNotices) $gameTemp._topNotices.length = 0;
        Tawerna.emit("craft", { station: "forge", item: 305, n: 1, recipe: "bron_305" }); Bron_Cechy.rng = null;
        const st = Bron_Cechy.state(), n = $gameTemp._topNotices || [];
        return { k: st.kucie[305], of: Bron_Cechy.of(305), notice: n.map(x => x.text || x[0] || String(x)), opis: Bron.opis(305), chance: Bron_Cechy.szansaKucia() }; })()`);
    const shown = await t.until("(function(){ const n = SceneManager._scene._topNotice, d = n && n._data; return !!(d && /Udane kucie/.test(d.text || '')); })()", 15, 100);
    await t.frames(12);
    await t.shot(path.join(SHOTS, "udane_kucie.png"));
    t.check("napis „Udane kucie!” widać u góry ekranu", shown);
    t.check("udane kucie (wymuszone): żelazny miecz z kuźni dostaje obrażenia +2 - napis „Udane kucie! Żelazny miecz: obrażenia +2”, zapis, karta; szansa bez umiejętności 20%",
        forge.k && forge.k.c === "obrazenia" && forge.k.v === 2 && forge.of.obrazenia === 2 && forge.of.parowanie === 0.12 && /Udane kucie: obrażenia \+2/.test(forge.opis) &&
        Math.abs(forge.chance - 0.2) < 1e-9 && JSON.stringify(forge.notice).includes("Udane kucie! Żelazny miecz: obrażenia +2"), forge);

    // ---- the card in Ekwipunek (the right hand: the iron sword forged well) and the smith's window
    await t.eval(`(function(){ Combat.setHand("m305"); Bron.refresh(); $gameTemp._menuTab = "equip"; $gameTemp._menuLevel = 2; SceneManager.push(Scene_Menu); return 0; })()`);
    await t.until("SceneManager._scene instanceof Scene_Menu && SceneManager._scene._started && !SceneManager.isSceneChanging()", 20, 100);
    await t.frames(30);
    const card = await J(`(function(){ const sc = SceneManager._scene, eq = (sc._views && sc._views.equip) || sc._view; if (!eq) return null;
        eq._cell = "right"; eq.inside = true; eq.redraw(); const b = eq._bubble; return b ? { title: b.title, lines: b.lines } : null; })()`);
    await t.frames(5);
    await t.shot(path.join(SHOTS, "karta_ekwipunek.png"));
    const cardText = card ? card.lines.join(" ") : "";
    t.check("karta w Ekwipunku (prawa ręka): obrażenia 24-30, cecha parowanie +12% i udane kucie: obrażenia +2", card && /Żelazny miecz/.test(card.title) &&
        /obrażenia 24-30/i.test(cardText) && /parowanie \+12%/.test(cardText) && /udane kucie: obrażenia \+2/i.test(cardText), card);
    await t.eval("SceneManager.pop(); 0");
    await t.until("SceneManager._scene instanceof Scene_Map && !SceneManager.isSceneChanging()", 20, 100);
    await t.eval(`(function(){ Bron.otworz("kowal", "kup"); return 0; })()`);
    await t.until("SceneManager._scene && SceneManager._scene.constructor.name === 'Scene_BronSklep' && SceneManager._scene._started && !SceneManager.isSceneChanging()", 20, 100);
    const shop = await J(`(function(){ const sc = SceneManager._scene, i = sc.rows().findIndex(r => r.id === 317); if (i >= 0) { sc._list.select(i); sc.drawInfo(); }
        return { i, row: i >= 0 ? sc.rows()[i].name : "", words: Bron_Data.opis(317, true), cechy: Bron_Cechy_Data.slowa(Bron_Cechy_Data.of(317), "buzdygan") }; })()`);
    await t.frames(5);
    await t.shot(path.join(SHOTS, "sklep_kowala.png"));
    t.check("sklep kowala: żelazny buzdygan - obrażenia 23-28, osobno cecha „ogłuszenie 10% na 1,5 s”", shop.i >= 0 && /obrażenia 23-28/.test(shop.words) &&
        shop.cechy.join() === "ogłuszenie 10% na 1,5 s", shop);
    await t.eval("SceneManager.pop(); 0");
    await t.until("SceneManager._scene instanceof Scene_Map && !SceneManager.isSceneChanging()", 20, 100);

    // ---- the forged trait goes with the last copy
    const gone = await J(`(function(){ const it = $dataItems[305]; $gameParty.loseItem(it, $gameParty.numItems(it), true); return { k: Bron_Cechy.state().kucie[305] || null, of: Bron_Cechy.of(305) }; })()`);
    t.check("sprzedany / zgubiony ostatni miecz: udane kucie znika (nowy z kuźni losuje od nowa)", gone.k === null && gone.of.obrazenia === undefined, gone);
});
