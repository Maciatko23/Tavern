// Motyle i ćmy (js/plugins/Motyle.js + Motyle_Data.js; grafika tools/motyle/motyle_art.py, arkusz zamachu siatką
// tools/motyle/build_net_swing.py). Sprawdza pakiet A-D:
//   A  - kiedy i gdzie (mapy, pory roku, godziny, pogoda: deszcz / po deszczu / susza / wiatr), kwiaty z kafelków, krzaków, ziół
//        i upraw jako miejsca lądowania, lot zygzakiem, powolne skrzydła na kwiecie, ucieczka przed biegnącym, ramię i kruk,
//        pawik o świcie po deszczu, ćmy nocą wokół ognia (nie zasłaniają płomienia), limity i koszt na klatkę
//   B  - siatka (przepis w warsztacie, przedmiot 180, ikona), zamach (Hero_Net), złapanie / pudło, gablotka w Dzienniku, ćma w gablotce
//   C  - K54 „Motyl z oczkami”: oferta Eli tylko gdy latają pawiki, pawik w siatce do zmierzchu, pokazany Eli - rysunek (181),
//        Opinia, zaufanie obozu (w6TrustCount); brat Kleofas zapisuje gatunki w kronice (pełna gablotka - miód i doświadczenie)
//   D  - zapylanie (ziemniaki, ul, drzewa owocowe) i bielinki na kapuście (strach na wróble odpędza)
//   F9 - wiersze „Motyle teraz”, „Ćmy przy ogniu (noc)”, „Daj siatkę na motyle”; zapis i wczytanie gablotki
// Uruchom: CDP_PORT=9541 node tests/motyle_test.js (serwer: node tools/serve.js na 8765)
const kit = require("./lib/kit.js");
const path = require("path");

kit.test({ port: 9541, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const M = expr => t.json("(function(){ return " + expr + "; })()");
    const SUMMER = 35;   // (dzień 35 = lato)

    // ---------------------------------------------------------------- dane, grafika, wtyczki
    const base = await M(`{ api: !!window.Motyle, data: !!window.MotyleData, order: Motyle.ORDER.join(),
        reg: $plugins.filter(p => /^Motyle/.test(p.name)).map(p => p.name).join(), birds: $plugins.findIndex(p => p.name === 'Birds'), at: $plugins.findIndex(p => p.name === 'Motyle_Data'),
        tqd: $plugins.findIndex(p => p.name === 'TownQuests_Data'),
        net: $dataItems[180] && [$dataItems[180].name, $dataItems[180].iconIndex, $dataItems[180].itypeId],
        draw: $dataItems[181] && [$dataItems[181].name, $dataItems[181].iconIndex, /Pamiatka/.test($dataItems[181].note)],
        recipe: (Farming.BUILDINGS.workbench.recipes.find(r => r.id === 'butterfly_net') || null),
        k54: !!TownQuests.Q.K54 && TownQuests.Q.K54.giver, pack: TownQuestsData.PACKS.filter(p => p.owner === 'Motyle').map(p => p.quests.join()).join() }`);
    t.check("Motyle_Data.js i Motyle.js na liście zaraz pod Birds (przed TownQuests_Data); pięć gatunków",
        base.api && base.data && base.reg === "Motyle_Data,Motyle" && base.at === base.birds + 1 && base.at < base.tqd && base.order === "cytrynek,pawik,modraszek,bielinek,cma", base);
    t.check("przedmioty: 180 „Siatka na motyle” (narzędzie, ikona 441), 181 „Rysunek Eli” (pamiątka, ikona 442)",
        base.net && base.net.join() === "Siatka na motyle,441,2" && base.draw && base.draw.join() === "Rysunek Eli,442,true", { net: base.net, draw: base.draw });
    t.check("warsztat: „Zrób siatkę na motyle” - 2× Gałęzie + 3× Włókno, ręcznie, jedna sztuka",
        !!base.recipe && base.recipe.inputs.map(i => i.join("x")).join() === "77x2,92x3" && base.recipe.output.join() === "180,1" && base.recipe.manual && base.recipe.unique, base.recipe);
    t.check("K54 „Motyl z oczkami” u Eli, paczka TownQuests właściciela „Motyle”", base.k54 === "ela" && base.pack === "K54", { k54: base.k54, pack: base.pack });
    await t.eval("['Motyle','Hero_Net','Motyle_Gablotka_Pawik','Motyle_Gablotka_Pawik_Cien','Motyle_Rysunek_Eli','IconSet'].forEach(n => ImageManager.loadSystem(n)); 0");
    await t.frames(20);
    const img = await M(`['Motyle','Hero_Net','Motyle_Gablotka_Pawik','Motyle_Gablotka_Pawik_Cien','Motyle_Rysunek_Eli'].map(n => { const b = ImageManager.loadSystem(n); return n + ':' + b.width + 'x' + b.height; })`);
    const icons = await M(`(function(){ const b = ImageManager.loadSystem('IconSet'), c = document.createElement('canvas'); c.width = 32; c.height = 32; const x = c.getContext('2d');
        return [441, 442, 443].map(i => { x.clearRect(0, 0, 32, 32); x.drawImage(b._image || b._canvas, (i % 16) * 32, Math.floor(i / 16) * 32, 32, 32, 0, 0, 32, 32); const d = x.getImageData(0, 0, 32, 32).data; let n = 0; for (let k = 3; k < d.length; k += 4) if (d[k] > 0) n++; return n; }); })()`);
    t.check("grafika: arkusz Motyle 112x140 (5 gatunków x 4 klatki po 28 px - motyl ok. 20 px), Hero_Net 1632x384 (17 klatek x 4 kierunki), karty gablotki 120x120, rysunek Eli",
        img.join() === "Motyle:112x140,Hero_Net:1632x384,Motyle_Gablotka_Pawik:120x120,Motyle_Gablotka_Pawik_Cien:120x120,Motyle_Rysunek_Eli:120x120", img);
    const width = await M(`(function(){ const b = ImageManager.loadSystem('Motyle'), c = document.createElement('canvas'); c.width = 112; c.height = 140; const x = c.getContext('2d'); x.drawImage(b._image || b._canvas, 0, 0);
        const d = x.getImageData(0, 0, 112, 140).data, out = []; for (let r = 0; r < 5; r++) { let x0 = 99, x1 = -1; for (let yy = r * 28; yy < r * 28 + 28; yy++) for (let xx = 0; xx < 28; xx++) if (d[(yy * 112 + xx) * 4 + 3] > 0) { x0 = Math.min(x0, xx); x1 = Math.max(x1, xx); } out.push(x1 - x0 + 1); } return out; })()`);
    t.check("motyle i ćma na arkuszu mają 18-24 px szerokości (z obrysem) - widoczne, ale delikatne", width.every(w => w >= 18 && w <= 24), width);
    t.check("ikony 441 (siatka), 442 (rysunek), 443 (motyl) narysowane w IconSet", icons.every(n => n > 60), icons);
    const row = await M(`(function(){ const b = ImageManager.loadSystem('IconSet'), c = document.createElement('canvas'); c.width = 32; c.height = 32; const x = c.getContext('2d');
        const n = [448, 449, 450, 451, 452, 453].map(i => { x.clearRect(0, 0, 32, 32); x.drawImage(b._image || b._canvas, (i % 16) * 32, Math.floor(i / 16) * 32, 32, 32, 0, 0, 32, 32); const d = x.getImageData(0, 0, 32, 32).data; let k = 0; for (let j = 3; j < d.length; j += 4) if (d[j] > 0) k++; return k; });
        return { h: b.height, n, kinds: MotyleData.ICON.kinds }; })()`);
    // (2026-10-18: 453-457 are the white eagle's icons now - Orzel.js; the butterflies' own row ends at 452)
    // (2026-10-23: IconSet rośnie dalej - ubiór i broń dokładają rzędy pod motylami: wysokość co najmniej 928)
    t.check("IconSet urósł o rząd (928 px): ikony gatunków 448-452 narysowane (453 to już ikona orła - Orzel.js)", row.h >= 928 && row.n.slice(0, 5).every(k => k > 60) && row.kinds.pawik === 449 && Object.values(row.kinds).every(i => i >= 448 && i <= 452), row);

    // ---------------------------------------------------------------- ciemny pokój: dom dziadka (Map019) nocą - ćmy przy świecach
    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, minimap: false });
    await t.setDay(SUMMER, 22.5);
    await t.frames(260);
    const room = await M(`(function(){ const L = Motyle.readLights(); return { map: $gameMap.mapId(), out: Survival.isOutdoors(), lights: L.map(l => l.id + ':' + l.r + ':' + l.count + ':' + l.room), n: Motyle.moths.length,
        states: Motyle.moths.map(m => m.state).join(), near: Motyle.moths.map(m => { const l = L.find(x => x.id === m.moth.light); return l ? Math.round(Math.hypot(m.x - l.fx, (m.y - m.z) - l.fy)) : -1; }), flyers: Motyle.flyers.length }; })()`);
    t.check("dom dziadka nocą (ciemny pokój): ćmy przy płomieniach świec i paleniska - po 1-2 na źródło, razem najwyżej 4, żadnych motyli",
        room.map === 19 && !room.out && room.lights.length >= 1 && room.lights.every(l => /:true$/.test(l)) && room.n >= 1 && room.n <= 4 && room.near.every(d => d >= 0 && d < 70) && room.flyers === 0, room);
    await t.shot(path.join("..", "docs", "motyle", "test_cmy_dom.png"));
    await t.setHour(12);
    await t.frames(90);
    t.check("w dzień w pokoju ćmy odlatują", (await M("Motyle.moths.filter(m => m.state !== 'go').length")) === 0, await M("Motyle.moths.map(m => m.state)"));

    // ---------------------------------------------------------------- gra: łąka #1 (Map004), lato, 11:00
    await t.setDay(SUMMER, 11);
    await t.go(4, 20, 15, 2);
    await t.eval("Survival.calmWeather(); $gameScreen.clearWeather(); 0");
    await t.frames(60);
    const prof = await M("{ p: Motyle.profile(), spots: Motyle.spots.length, kinds: [...new Set(Motyle.spots.map(s => s.kind))].join(), tiles: Motyle.spots.filter(s => s.tx !== undefined && !s.plant).length, plants: Motyle.spots.filter(s => s.plant).length }");
    t.check("łąka (Map004): motyle pełną siłą (k 1); kwiaty do lądowania z kafelków i z ziół na ziemi",
        prof.p && prof.p.k === 1 && prof.spots >= 6 && prof.tiles >= 1 && prof.plants >= 1, prof);
    const w = await M("Motyle.wanted()");
    t.check("lato, 11:00, sucha pogoda: chce latać kilka motyli (najwyżej 12)", w.n >= 3 && w.n <= 12, w);
    await t.frames(240);
    const pop = await M(`(function(){ const v = { x0: $gameMap.displayX() * 48, y0: $gameMap.displayY() * 48 }; const on = Motyle.flyers.filter(b => b.x > v.x0 && b.x < v.x0 + Graphics.width && b.y > v.y0 && b.y < v.y0 + Graphics.height);
        return { n: Motyle.flyers.length, on: on.length, kinds: Motyle.flyers.map(b => b.kind), states: Motyle.flyers.map(b => b.state), sprites: Motyle.flyers.filter(b => b.holder && b.holder.parent === SceneManager._scene._spriteset._tilemap).length }; })()`);
    t.check("po chwili lata kilka motyli (gatunki dzienne, nie ćmy), sprite'y w tilemapie, na ekranie najwyżej 8", pop.n >= 2 && pop.on <= 8 && pop.n <= 12 && !pop.kinds.includes("cma") && pop.sprites >= 1, pop);
    await t.shot(path.join("..", "docs", "motyle", "test_laka.png"));

    // ---------------------------------------------------------------- pory roku, godziny, pogoda
    const when = await M(`(function(){ const d = $gameSystem.dayNightDay(), h = $gameSystem.dayNightHour(), out = {};
        const at = (day, hour) => { $gameSystem._dayNightDay = day; $gameSystem.setDayNightHour(hour); const w = Motyle.wanted(); return w.n + ':' + w.why; };
        out.spring = at(8, 11); out.summer = at(${SUMMER}, 11); out.autumn = at(64, 11); out.winter = at(92, 11); out.night = at(${SUMMER}, 23.5); out.dawn = at(${SUMMER}, 5);
        $gameSystem._dayNightDay = d; $gameSystem.setDayNightHour(h); return out; })()`);
    const nOf = s => Number(String(s).split(":")[0]);
    t.check("wiosna i lato pełno, jesienią pojedyncze (najwyżej 2), zimą i nocą żadnych",
        nOf(when.spring) >= 3 && nOf(when.summer) >= 3 && nOf(when.autumn) <= 2 && nOf(when.winter) === 0 && nOf(when.night) === 0 && nOf(when.dawn) === 0, when);
    const weather = await M(`(function(){ const S = Survival, plan = S.weatherPlan, sf = $gameSystem._stormForce, d = $gameSystem.dayNightDay(), out = {};
        const w = () => { const r = Motyle.wanted(); return r.n + ':' + r.why; };
        S.weatherPlan = day => day === d ? { type: 'rain', start: 9, end: 15, power: 3 } : null; out.rain = w();
        S.weatherPlan = day => day === d - 1 ? { type: 'rain', start: 18, end: 23, power: 3 } : null; out.after = w(); out.afterN = Motyle.wanted().n;
        S.weatherPlan = day => (day > d - 3 ? null : { type: 'rain', start: 9, end: 15, power: 3 }); out.normalN = Motyle.wanted().n;
        S.weatherPlan = () => null; out.drought = w(); out.dry = Motyle.dryDays();
        const W = Storm.wind; Storm.wind = () => 0.8; S.weatherPlan = day => (day > d - 3 ? null : { type: 'rain', start: 9, end: 15, power: 3 }); out.windyN = Motyle.wanted().n; Storm.wind = W;
        S.weatherPlan = plan; return out; })()`);
    t.check("w deszcz żadnych; dzień po deszczu więcej; w suszę (10+ dni bez deszczu) mniej; w silnym wietrze mniej",
        nOf(weather.rain) === 0 && /po deszczu/.test(weather.after) && weather.afterN > weather.normalN && /susza/.test(weather.drought) && nOf(weather.drought) < weather.normalN && weather.dry >= 10 && weather.windyN < weather.normalN, weather);
    // rain now: they hide (fly to a flower, settle down and fade)
    await t.eval(`(function(){ window.__wp = Survival.weatherPlan; const d = $gameSystem.dayNightDay(); Survival.weatherPlan = day => day === d ? { type: 'rain', start: 9, end: 15, power: 3 } : null; return 0; })()`);
    await t.frames(260);
    const hid = await M("{ n: Motyle.flyers.length, states: Motyle.flyers.map(b => b.state) }");
    await t.eval("Survival.weatherPlan = window.__wp; 0");
    t.check("zaczyna padać: motyle chowają się (siadają i znikają)", hid.n === 0 || hid.states.every(s => s === "hide"), hid);

    // ---------------------------------------------------------------- lot i siedzenie (jeden motyl pod kontrolą)
    // (the population off for the controlled checks: no butterfly comes or goes by itself - the ones made by hand stay)
    await t.eval("Motyle.clear(); Motyle.force = null; Motyle.auto(false); 0");
    await M(`(function(){ const hp = { x: ($gamePlayer._realX + 0.5) * 48, y: ($gamePlayer._realY + 0.9) * 48 };
        const b = Motyle.spawn('cytrynek', { at: { x: hp.x - 200, y: hp.y - 96, z: 24 } }); b.tx = hp.x + 200; b.ty = hp.y - 96; b.spot = null; b.state = 'fly'; b.free = 9999;
        window.__b = b; window.__path = []; return 0; })()`);
    await t.eval(`(function(){ const b = window.__b; window.__iv = setInterval(() => { if (window.__path.length < 400) window.__path.push([b.x, b.y, b.z, b.vx]); }, 4); return 0; })()`);
    await t.frames(150);
    const zig = await M(`(function(){ clearInterval(window.__iv); const p = window.__path; if (p.length < 20) return null; const y0 = p[0][1];
        let dev = 0, turns = 0, last = 0; for (let i = 1; i < p.length; i++) { dev = Math.max(dev, Math.abs(p[i][1] - y0)); const dy = Math.sign(p[i][1] - p[i - 1][1]); if (dy && last && dy !== last) turns++; if (dy) last = dy; }
        const zs = p.map(q => q[2]); return { n: p.length, dev: Math.round(dev), turns, zmin: Math.min(...zs).toFixed(1), zmax: Math.max(...zs).toFixed(1), moved: Math.round(p[p.length - 1][0] - p[0][0]) }; })()`);
    t.check("lot zygzakiem z łagodnymi skrętami: zbacza z prostej i faluje w górę i w dół, ale leci do celu", !!zig && zig.dev >= 6 && zig.turns >= 2 && zig.moved > 60 && Number(zig.zmax) - Number(zig.zmin) >= 2, zig);
    // the wind carries it: the same butterfly flying straight up the screen, Storm.wind 0.9 against none -> it drifts right
    await M(`(function(){ const b = window.__b, tw = 48, hp = { x: ($gamePlayer._realX + 0.5) * tw, y: ($gamePlayer._realY + 0.9) * tw };
        b.state = 'fly'; b.x = hp.x; b.y = hp.y; b.tx = hp.x; b.ty = hp.y - 600; b.h = -Math.PI / 2; b.free = 9999; window.__x0 = b.x; window.__W = Storm.wind; Storm.wind = () => 0.9; return 0; })()`);
    await t.frames(60);
    const windy = await M("(function(){ const dx = window.__b.x - window.__x0; Storm.wind = window.__W; return Math.round(dx); })()");
    await t.eval(`(function(){ const b = window.__b, tw = 48, hp = { x: ($gamePlayer._realX + 0.5) * tw, y: ($gamePlayer._realY + 0.9) * tw };
        b.state = 'fly'; b.x = hp.x; b.y = hp.y; b.tx = hp.x; b.ty = hp.y - 600; b.h = -Math.PI / 2; window.__x0 = b.x; window.__W = Storm.wind; Storm.wind = () => 0; return 0; })()`);
    await t.frames(60);
    const calm = await M("(function(){ const dx = window.__b.x - window.__x0; Storm.wind = window.__W; return Math.round(dx); })()");
    t.check("wiatr (Storm.wind) znosi lot w prawo (z wiatrem gry)", windy - calm >= 25, { windy, calm });
    // sitting on a flower: the wings open and shut slowly
    // (2026-10-23: the hero - and the screen - beside the flower: a butterfly off the screen is not drawn, its frame stood still)
    await t.eval(`(function(){ const b = window.__b, s = Motyle.spots.find(s => s.kind === 'flower') || Motyle.spots[0]; $gamePlayer.locate(Math.floor(s.x / 48), Math.min($gameMap.height() - 1, Math.floor(s.y / 48) + 2)); $gamePlayer.center($gamePlayer.x, $gamePlayer.y);
        Motyle.land(b, s); b.sit.left = 2000; b.sit.hold = 5; window.__fr = []; b.free = 9999;
        window.__iv = setInterval(() => { if (b.spr && window.__fr.length < 2000) window.__fr.push(Math.round(b.spr._frame.x / 16)); }, 4); return 0; })()`);
    await t.frames(400);
    const sitFr = await M(`(function(){ clearInterval(window.__iv); const f = window.__fr; let changes = 0; for (let i = 1; i < f.length; i++) if (f[i] !== f[i - 1]) changes++; return { n: f.length, set: [...new Set(f)].sort().join(), changes, state: window.__b.state }; })()`);
    t.check("na kwiecie: siedzi, powoli otwiera i zamyka skrzydła (klatki otwarte / w pół / złożone, niewiele zmian)",
        sitFr.state === "sit" && /0/.test(sitFr.set) && /2/.test(sitFr.set) && sitFr.changes >= 2 && sitFr.changes <= 40, sitFr);

    // ---------------------------------------------------------------- płoszenie: bieg vs skradanie
    const scareRun = async (mode) => {
        await t.eval(`(function(){ Motyle.clear(); $gameSystem._sneak = ${mode === "sneak"}; const p = $gamePlayer; p.locate(${20}, ${15}); p.setDirection(6);
            const s = { x: (p.x + 3.5) * 48, y: (p.y + 0.9) * 48, z: 6, kind: 'flower' }; const b = Motyle.spawn('bielinek', { at: { x: s.x, y: s.y, z: 6 } }); Motyle.land(b, s); b.sit.left = 99999; b.free = 0; window.__b = b; return 0; })()`);
        await t.frames(10);
        // (2026-10-23: the distance in the very frame it takes off, noted in the game's own loop - looked at from outside every 4
        // frames a running hero was a step nearer already: 1.98 under a loaded machine)
        await t.eval(`(function(){ window.__scare = null; window.__bx = window.__b.x; const u = window.__scareU = SceneManager.updateMain; SceneManager.updateMain = function() { u.apply(this, arguments);
            const b = window.__b; if (b && window.__scare === null && b.state === 'flee') window.__scare = Math.abs(window.__bx / 48 - ($gamePlayer._realX + 0.5)); if (b && b.state !== 'flee') window.__bx = b.x; }; return 0; })()`);
        await t.eval(`Input._currentState.right = true; ${mode === "run" ? "Input._currentState.shift = true;" : ""} 0`);
        let fled = false;
        for (let i = 0; i < 30 && !fled; i++) { await t.frames(4); fled = await t.eval("window.__b.state === 'flee'"); if (await t.eval("$gamePlayer._realX > " + (20 + 3.2))) break; }
        await t.eval("Input._currentState.right = false; Input._currentState.shift = false; $gameSystem._sneak = false; SceneManager.updateMain = window.__scareU; 0");
        const d = await t.eval("(window.__scare !== null ? window.__scare : Math.abs(window.__b.x / 48 - ($gamePlayer._realX + 0.5))).toFixed(2)");
        return { fled, d };
    };
    const run = await scareRun("run");
    const sneak = await scareRun("sneak");
    t.check("biegnący bohater płoszy motyla z daleka; skradając się (C) można podejść blisko", run.fled && Number(run.d) > 2 && (!sneak.fled || Number(sneak.d) < 1), { run, sneak });

    // ---------------------------------------------------------------- ramię i kruk
    await t.eval("Motyle.clear(); $gamePlayer.locate(20, 15); $gamePlayer.setDirection(2); 0");
    await t.frames(5);
    await t.eval(`(function(){ const p = $gamePlayer, b = Motyle.spawn('cytrynek', { at: { x: (p.x + 2.5) * 48, y: (p.y + 0.9) * 48, z: 24 } }); b.free = 0; Motyle.sendToShoulder(b, false); window.__b = b; return 0; })()`);
    await t.frames(140);
    const sh = await M(`(function(){ const b = window.__b, p = $gamePlayer; return { state: b.state, landing: b.landing, dx: +(b.x / 48 - (p._realX + 0.5)).toFixed(2), dy: +(b.y / 48 - (p._realY + 0.98)).toFixed(2), z: Math.round(b.z), holderY: b.holder && b.holder.y, heroY: Math.round(p.screenY()) }; })()`);
    t.check("stoi spokojnie: motyl siada mu na ramieniu (przy głowie, rysowany zaraz po bohaterze)", sh.state === "shoulder" && !sh.landing && Math.abs(sh.dx) < 0.3 && Math.abs(sh.dy) < 0.1 && sh.z >= 44 && sh.z <= 56, sh);
    await t.shot(path.join("..", "docs", "motyle", "test_ramie.png"));
    await t.eval("Input._currentState.left = true; 0");
    await t.frames(16);
    await t.eval("Input._currentState.left = false; 0");
    const off = await M("window.__b.state");
    t.check("rusza zwykłym krokiem: motyl zrywa się z ramienia", off === "flee", off);
    // the natural way: standing still for a while, a butterfly near comes by itself (chance raised for the test)
    await t.eval("Motyle.clear(); MotyleData.SHOULDER.chance = 1; 0");
    await t.eval(`(function(){ const p = $gamePlayer; for (let i = 0; i < 3; i++) { const b = Motyle.spawn('modraszek', { at: { x: (p.x + 2 + i) * 48, y: (p.y + 0.9) * 48, z: 20 } }); b.free = 0; } return 0; })()`);
    const came = await t.until("!!Motyle.shoulder", 12);
    await t.eval("MotyleData.SHOULDER.chance = 0.06; 0");
    t.check("po ~2,5 s bez ruchu motyl z okolicy sam leci na ramię", came, await M("{ sh: !!Motyle.shoulder, n: Motyle.flyers.length }"));
    // the raven (Kruk.js): a pet sitting near - the butterfly may land on its head; the raven may peck at it
    const raven = await M(`(function(){ Motyle.clear(); const real = Tawerna.api('Kruk'), p = $gamePlayer;
        const pet = { x: p._realX + 1.5, y: p._realY + 1, z: 0, state: 'sit', anim: null };
        const fake = Object.create(real); Object.defineProperty(fake, 'pet', { value: pet }); Tawerna.register('Kruk', fake); window.__realKruk = real; window.__pet = pet;
        const b = Motyle.spawn('bielinek', { at: { x: (p.x + 3) * 48, y: (p.y + 1) * 48, z: 30 } }); b.free = 0; Motyle.sendToShoulder(b, true); b.peck = 200; window.__b = b; return 0; })()`);
    void raven;
    await t.frames(150);
    const onRaven = await M("{ state: window.__b.state, onRaven: window.__b.onRaven, z: Math.round(window.__b.z), dx: +(window.__b.x / 48 - window.__pet.x).toFixed(2) }");
    await t.frames(120);
    const pecked = await M("{ state: window.__b.state, anim: !!window.__pet.anim }");
    await t.eval("Tawerna.register('Kruk', window.__realKruk); 0");
    t.check("motyl siada na kruku (na głowie), a kruk dziobie w jego stronę - motyl odlatuje", onRaven.state === "shoulder" && onRaven.onRaven && onRaven.z >= 22 && Math.abs(onRaven.dx) < 0.2 && pecked.state === "flee" && pecked.anim, { onRaven, pecked });

    // ---------------------------------------------------------------- pawik: tylko o świcie po deszczu
    const pawik = await M(`(function(){ const S = Survival, plan = S.weatherPlan, d0 = $gameSystem.dayNightDay(), h0 = $gameSystem.dayNightHour(), out = {};
        let found = 0;
        for (let d = ${SUMMER}; d < ${SUMMER} + 20 && !found; d++) {
            $gameSystem._dayNightDay = d; const rise = Sky.sunTimes(d).rise; $gameSystem.setDayNightHour(rise + 0.5);
            S.weatherPlan = day => day === d - 1 ? { type: 'rain', start: 17, end: 22, power: 3 } : null;
            if (Motyle.pawikNow()) found = d;
        }
        out.dawnAfterRain = found;
        const rise = Sky.sunTimes(found || d0).rise;
        $gameSystem.setDayNightHour(12); out.noon = Motyle.pawikNow();
        $gameSystem.setDayNightHour(rise + 0.5); S.weatherPlan = () => null; out.noRain = Motyle.pawikNow();
        S.weatherPlan = plan; $gameSystem._dayNightDay = d0; $gameSystem.setDayNightHour(h0); return out; })()`);
    t.check("pawik jest o świcie po deszczu (w któryś z kolejnych dni), nie w południe i nie bez deszczu", pawik.dawnAfterRain > 0 && !pawik.noon && !pawik.noRain, pawik);

    // ---------------------------------------------------------------- B: siatka, zamach, złapanie, pudło, gablotka
    const caseIdx = await M("Journal.TABS.indexOf('Gablotka')");
    t.check("Dziennik: osobny dział „Gablotka”", caseIdx >= 0, await M("Journal.TABS"));
    await t.eval("Motyle.clear(); $gamePlayer.locate(20, 15); $gamePlayer.setDirection(6); $gameSystem.setStamina && $gameSystem.setStamina(100); 0");
    await t.frames(5);
    const sitAhead = kind => t.eval(`(function(){ Motyle.clear(); const p = $gamePlayer, s = { x: (p.x + 1.4) * 48, y: (p.y + 0.9) * 48, z: 6, kind: 'flower' };
        const b = Motyle.spawn('${kind}', { at: { x: s.x, y: s.y, z: 6 } }); Motyle.land(b, s); b.sit.left = 99999; b.free = 0; window.__b = b; return 0; })()`);
    await sitAhead("cytrynek");
    await t.press("ok");
    const noNet = await M("!!$gamePlayer._swingEvent");
    t.check("bez siatki O przy motylu niczego nie łapie (zwykłe O)", !noNet, noNet);
    for (let i = 0; i < 3 && (await t.eval("!!$gameTemp._farmMenuOpen")); i++) { await t.press("escape"); await t.frames(10); }   // (O opened the ground's menu)
    await t.give(180, 1);
    await t.eval("Motyle.netOpts.roll = 0; 0");
    await sitAhead("cytrynek");   // (2026-10-23: again, right before the swing - the steps above take long enough on a busy machine for it to fly off)
    await t.popups({ clear: true });
    await t.press("ok");
    const sw = await M("{ swing: !!$gamePlayer._swingEvent, kind: $gamePlayer._swingEvent && $gamePlayer._swingEvent._swingKind, sheet: ChoppableTree.swingKind(Motyle.netKind).sheet }");
    t.check("z siatką O przy motylu: zamach siatką (arkusz Hero_Net)", sw.swing && sw.kind === (await M("Motyle.netKind")) && sw.sheet === "Hero_Net", sw);
    await t.frames(60);
    const got = await M("{ caught: Motyle.store().caught, counts: Motyle.store().counts, state: window.__b.state, free: window.__b.free }");
    const pops = await t.popups();
    const tops = await t.notices({ clear: true });
    t.check("złapany: cytrynek trafia do gablotki (dymek nad bohaterem, nowy okaz u góry), a sam motyl odlatuje wolny",
        !!got.caught.cytrynek && got.counts.cytrynek === 1 && got.state === "released" && got.free > 0 && pops.some(p => /Złapany: Cytrynek/.test(p)) && tops.some(n => /Nowy okaz/.test(n)), { got, pops, tops });
    await sitAhead("modraszek");
    await t.eval("Motyle.netOpts.roll = 0.999; 0");
    await t.popups({ clear: true });
    await t.press("ok");
    await t.frames(60);
    const miss = await M("{ caught: !!Motyle.store().caught.modraszek, state: window.__b.state, missed: Motyle.store().stats.missed }");
    t.check("pudło: modraszek ucieka (dymek „Uciekł...”), gablotka bez niego", !miss.caught && miss.state === "flee" && miss.missed >= 1 && (await t.popups()).some(p => /Uciekł/.test(p)), miss);
    const chances = await M(`(function(){ const mk = (k, st) => ({ kind: k, state: st }); return { pawikFly: Motyle.netChance(mk('pawik', 'fly'), false).toFixed(2), pawikSit: Motyle.netChance(mk('pawik', 'sit'), true).toFixed(2), cytFly: Motyle.netChance(mk('cytrynek', 'fly'), false).toFixed(2), bielSit: Motyle.netChance(mk('bielinek', 'sit'), true).toFixed(2), max: Motyle.netChance(mk('cma', 'shoulder'), true).toFixed(2) }; })()`);
    t.check("płochliwość zależy od gatunku: pawik najtrudniejszy, siedzący i skradanie łatwiej, najwyżej 95%",
        Number(chances.pawikFly) < Number(chances.cytFly) && Number(chances.pawikSit) > Number(chances.pawikFly) && Number(chances.max) <= 0.95, chances);
    await t.eval("Motyle.netOpts.roll = null; 0");
    const kase = await M(`(function(){ const i = Journal.TABS.indexOf('Gablotka'), items = Journal.itemsForTab(i), d0 = Journal.detailFor(i, items[0]), d2 = Journal.detailFor(i, items[2]);
        return { labels: items.map(x => x.label), marks: items.map(x => x.mark), icons: items.map(x => x.icon), img0: d0.image, img2: d2.image, legend: Journal.TAB_DEFS[i].legend(), text0: d0.ops.map(o => o.text).join(' | ').slice(0, 200) }; })()`);
    t.check("gablotka: pięć gatunków (złapany z rysunkiem i opisem, reszta jako cień „nie złapany”), zapylanie, licznik „1 z 5”",
        kase.labels.length >= 6 && kase.labels[0] === "Cytrynek" && /nie złapany/.test(kase.labels[2]) && kase.img0 === "Motyle_Gablotka_Cytrynek" && kase.img2 === "Motyle_Gablotka_Modraszek_Cien" && /1 z 5/.test(kase.legend) && kase.labels.includes("Zapylanie") && kase.icons[0] === 448 && kase.icons[2] === 0, kase);

    // ---------------------------------------------------------------- A5: ćmy nocą przy ogniu (pochodnia wbita w ziemię)
    await t.eval("Motyle.clear(); $gameSystem.setDayNightHour(22.5); Survival.calmWeather(); $gamePlayer.locate(20, 15); $gamePlayer.setDirection(6); 0");
    await t.frames(30);
    const planted = await t.eval("(function(){ Torch.light(); return Torch.plantTorch(21, 15, { instant: true, quiet: true }); })()");
    if (!planted) console.log("NOTE pochodnia nie wbita: " + JSON.stringify(await M("{ lit: Torch.isLit(), can: Torch.canPlantAt(21, 15) }")));
    await t.frames(240);
    const mo = await M(`(function(){ const L = Motyle.readLights(), l = L[0]; return { lights: L.length, n: Motyle.moths.length, flyers: Motyle.flyers.length,
        states: Motyle.moths.map(m => m.state).join(), d: l ? Motyle.moths.map(m => Math.round(Math.hypot(m.x - l.fx, (m.y - m.z) - l.fy))) : [],
        scale: Motyle.moths.map(m => m.spr && m.spr.scale.x.toFixed(2)), tint: Motyle.moths.map(m => m.spr && m.spr.tint), front: Motyle.moths.map(m => m.moth.front),
        hy: Motyle.moths.map(m => m.holder && Math.round(m.holder.y)), gy: l ? Math.round(l.gy - $gameMap.displayY() * 48) : null }; })()`);
    const orb = mo.states.split(",").map((s, i) => s === "orbit" ? i : -1).filter(i => i >= 0);
    t.check("nocą: ćmy krążą wokół pochodni wbitej w ziemię, ciepło podświetlone, ani jednego motyla",
        mo.lights >= 1 && mo.n >= 1 && mo.flyers === 0 && orb.length >= 1 && orb.every(i => mo.d[i] < 85) && mo.scale.every(s => s === "1.00") && mo.tint.every(c => c !== 0xffffff), mo);
    t.check("ćma przed płomieniem rysowana nad ogniem, za nim pod ogniem (sortowanie w tilemapie)", orb.length >= 1 && orb.every(i => mo.hy[i] === mo.gy + (mo.front[i] ? 2 : -2)), { front: mo.front, hy: mo.hy, gy: mo.gy, orb });
    // crossing the flame's middle in front: see-through a little (never a solid blot on the fire)
    const alphas = [];
    for (let i = 0; i < 40; i++) { await t.frames(3); alphas.push(await M("Motyle.moths[0] ? [Motyle.moths[0].moth.front && Math.abs(Math.cos(Motyle.moths[0].moth.a)) < 0.45, +Motyle.moths[0].holder.alpha.toFixed(2)] : null")); }
    const inFront = alphas.filter(a => a && a[0]).map(a => a[1]), aside = alphas.filter(a => a && !a[0]).map(a => a[1]);
    t.check("ćma przelatująca przed środkiem płomienia jest półprzezroczysta (nie zasłania ognia)", (!inFront.length || Math.max(...inFront) <= 0.63) && aside.length > 0, { inFront: inFront.slice(0, 6), aside: aside.slice(0, 6) });
    await t.shot(path.join("..", "docs", "motyle", "test_cmy.png"));
    // a moth in the net (the display case: the night kind)
    // (not facing the stuck torch: O at it takes it back into the hand - Torch.js; from below-left / below-right, facing up)
    await t.eval("Motyle.netOpts.roll = 0; 0");
    // (2026-10-23: the moth goes round the flame - by the time the swing comes it can be past the net: up to four swings, each aimed)
    for (let tries = 0; tries < 4 && !(await t.eval("!!Motyle.store().caught.cma")); tries++) {
        let aimed = false;
        for (let i = 0; i < 40 && !aimed; i++) {
            await t.eval("(function(){ const at = [[20, 16], [22, 16]][" + (i % 2) + "]; $gamePlayer.locate(at[0], at[1]); $gamePlayer.setDirection(8); return 0; })()");
            await t.frames(3);
            aimed = await t.eval("Motyle.netTargets().length > 0");
        }
        await t.press("ok");
        await t.frames(60);
    }
    const moth = await M("{ cma: !!Motyle.store().caught.cma, n: Motyle.moths.length }");
    await t.eval("Motyle.netOpts.roll = null; 0");
    t.check("ćmę też łapie się siatką (gatunek nocny w gablotce), wraca do ognia", moth.cma && moth.n >= 1, moth);
    await t.eval("$gameSystem.setDayNightHour(12); 0");
    await t.frames(60);
    const day = await M("{ moths: Motyle.moths.filter(m => m.state !== 'go').length }");
    t.check("za dnia ćmy odlatują", day.moths === 0, day);

    // ---------------------------------------------------------------- wydajność
    await t.eval("Motyle.clear(); Motyle.auto(true); Motyle.pending = 'motyle'; 0");
    await t.frames(200);
    const perf = await M(`(function(){ const u = Tawerna.debug.updaters().find(x => x.name === 'motyle'); return { n: Motyle.flyers.length, ms: u ? u.ms : null, max: u ? u.max : null, perf: Motyle.perf }; })()`);
    const fps = await t.eval(`new Promise(res => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else res(Math.round(n / ((performance.now() - t0) / 1000))); }; requestAnimationFrame(f); })`);
    t.check("koszt: motyle (F9, ~12) kosztują < 0,5 ms na klatkę, gra trzyma ~60 FPS", perf.n >= 4 && perf.ms !== null && perf.ms < 0.5 && fps >= 50, { perf, fps });
    console.log("NOTE wydajność: " + JSON.stringify({ motyle: perf.n, ms: perf.ms, max: perf.max, fps }));
    await t.eval("Motyle.clear(); Motyle.force = null; Motyle.auto(false); 0");

    // ---------------------------------------------------------------- D: zapylanie i bielinki
    const pol = await M(`(function(){ const s = Motyle.spots.find(s => s.kind === 'flower' && s.tx !== undefined); if (!s) return null; const x = s.tx, y = s.ty;
        const d0 = $gameSystem.dayNightDay(); const out = { x, y, summer: Motyle.pollen($gameMap.mapId(), x, y) };
        $gameSystem._dayNightDay = 64; out.autumn = Motyle.pollen($gameMap.mapId(), x, y); $gameSystem._dayNightDay = 92; out.winter = Motyle.pollen($gameMap.mapId(), x, y);
        $gameSystem._dayNightDay = d0; return out; })()`);
    t.check("zapylenie przy kwiatach: latem pełne, jesienią połowa, zimą zero", !!pol && pol.summer > 0.4 && Math.abs(pol.autumn - pol.summer / 2) < 0.01 && pol.winter === 0, pol);
    // a ripe potato by flowers: with the roll on its side one potato more ("Zapylone kwiaty")
    const harvestAt = async (crop, rnd, scare) => {
        await t.eval(`(function(){ const s = Motyle.spots.find(s => s.kind === 'flower' && s.tx !== undefined), F = Farming.farm(), m = $gameMap.mapId();
            let x = s.tx + 1, y = s.ty; for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1]]) { if ($gameMap.isPassable(s.tx + dx, s.ty + dy, 2) && !$gameMap.eventsXy(s.tx + dx, s.ty + dy).length) { x = s.tx + dx; y = s.ty + dy; break; } }
            (F.plots[m] = F.plots[m] || {})[x + ',' + y] = { s: 'tilled', crop: '${crop}', day: Farming.today() - 20 }; F.rev++;
            F.buildings[m] = (F.buildings[m] || []).filter(b => b.type !== 'scarecrow');
            ${scare ? "F.buildings[m].push({ id: 99901, type: 'scarecrow', x: x + 1, y: y + 1, last: Farming.today() }); F.rev++;" : ""}
            $gamePlayer.locate(x - 1, y); $gamePlayer.setDirection(6); $gameSystem.setStamina && $gameSystem.setStamina(100); window.__hx = x; window.__hy = y; return 0; })()`);
        await t.frames(4);
        const id = crop === "potato" ? 71 : 73;
        const before = await t.count(id);
        await t.popups({ clear: true });
        await t.eval(`(function(){ window.__rnd = Math.random; Math.random = () => ${rnd}; ${crop === "cabbage" ? "Motyle.markNibbled($gameMap.mapId(), window.__hx, window.__hy);" : ""} Farming.harvest(window.__hx, window.__hy); return 0; })()`);
        await t.frames(70);
        await t.eval("Math.random = window.__rnd; 0");
        return { got: (await t.count(id)) - before, pops: await t.popups() };
    };
    const pot = await harvestAt("potato", 0, false);
    t.check("ziemniaki przy kwiatach: +1 dzięki zapyleniu (dymek „Zapylone kwiaty: +1 Ziemniaki”)", pot.got === 3 && pot.pops.some(p => /Zapylone kwiaty: \+1/.test(p)), pot);
    const cab = await harvestAt("cabbage", 0.99, false);
    t.check("bielinki podgryzły kapustę: -1 główka (z dwóch zostaje jedna)", cab.got === 1 && cab.pops.some(p => /Bielinki podgryzły kapustę/.test(p)), cab);
    const cabGuard = await harvestAt("cabbage", 0.99, true);
    t.check("strach na wróble obok: bielinki nie ruszają kapusty (obie główki)", cabGuard.got === 2 && !cabGuard.pops.some(p => /Bielinki/.test(p)), cabGuard);
    // live: a cabbage white sitting on a cabbage marks it; on a guarded one it does not stay
    const live = await M(`(function(){ const m = $gameMap.mapId(), x = window.__hx, y = window.__hy, F = Farming.farm(); F.buildings[m] = (F.buildings[m] || []).filter(b => b.type !== 'scarecrow'); F.rev++;
        (F.plots[m] = F.plots[m] || {})[x + ',' + y] = { s: 'tilled', crop: 'cabbage', day: Farming.today() - 2 }; F.rev++; delete (Motyle.store().nibble[m] || {})[x + ',' + y];
        Motyle.refreshSpots(); const s = Motyle.spots.find(s => s.kind === 'cabbage' && s.tx === x && s.ty === y); if (!s) return null;
        Motyle.clear(); const b = Motyle.spawn('bielinek', { at: { x: s.x, y: s.y, z: s.z } }); Motyle.land(b, s); b.sit.left = 99999; b.free = 9999; b.nib = MotyleData.CABBAGE.nibble - 3; window.__b = b; window.__s = s; return 0; })()`);
    await t.frames(20);
    const nib = await M("{ marked: !!(Motyle.store().nibble[$gameMap.mapId()] || {})[window.__hx + ',' + window.__hy], state: window.__b.state }");
    await t.eval("window.__s.guard = true; 0");
    await t.frames(10);
    const shooed = await M("window.__b.state");
    t.check("bielinek siedzący na kapuście ją podgryza; przy strachu na wróble / kruku odlatuje", live !== null && nib.marked && shooed !== "sit", { nib, shooed });
    // the hive by flowers: every jar a chance of one more
    const hive = await M(`(function(){ const m = $gameMap.mapId(), F = Farming.farm(), x = window.__hx, y = window.__hy + 1;
        F.buildings[m] = (F.buildings[m] || []).filter(b => b.type !== 'hive'); const b = { id: 99902, type: 'hive', x, y, last: Farming.today() - 10 }; F.buildings[m].push(b); F.rev++;
        window.__hive = b; return Farming.readyProduce(b); })()`);
    const honey0 = await t.count(76);
    await t.popups({ clear: true });
    await t.eval("window.__rnd = Math.random; Math.random = () => 0; Farming.collect(window.__hive); 0");
    await t.frames(70);
    await t.eval("Math.random = window.__rnd; 0");
    const honey = (await t.count(76)) - honey0;
    t.check("ul przy kwiatach: każdy słoik z szansą 15% na drugi (tu wszystkie: 3 + 3), dymek „Motyle przy kwiatach”", hive === 3 && honey === 6 && (await t.popups()).some(p => /Motyle przy kwiatach: \+3/.test(p)), { ready: hive, honey });
    // a fruit tree (ChoppableTree's pick): one fruit more now and then
    const fruit = await M(`(function(){ const ev = $gameMap.events().find(e => /^!\\$Tree_(Apple|Pear)/.test(e.characterName()) && !$gameSelfSwitches.value([e._mapId, e._eventId, 'C'])); if (!ev) return null;
        const p = Motyle.pollen($gameMap.mapId(), ev.x, ev.y, false); return { id: ev.eventId(), p, fruit: ChoppableTree.treeConfig(ev).fruit }; })()`);
    if (fruit && fruit.p > 0) {
        const f0 = await t.count(fruit.fruit);
        await t.popups({ clear: true });
        await t.eval(`(function(){ window.__rnd = Math.random; Math.random = () => 0; Tawerna.api('ChoppableTree_parts').objects.pickFruit({ _eventId: ${fruit.id} }); Math.random = window.__rnd; return 0; })()`);
        await t.frames(10);
        const got2 = (await t.count(fruit.fruit)) - f0;
        t.check("dzika jabłoń / grusza przy kwiatach: o jeden owoc więcej (najmniej 2 + 1)", got2 >= 3 && (await t.popups()).some(p => /Zapylone kwiaty/.test(p)), { fruit, got2 });
    } else t.check("drzewo owocowe przy kwiatach (owocujące latem) - w tej chwili brak na mapie, pominięte", true, fruit);

    // ---------------------------------------------------------------- C: K54 u Eli, pawik w siatce, rysunek; Kleofas
    const pora = await M(`(function(){ const d = $gameSystem.dayNightDay(), f = TownQuests.FX.k54Pora, out = {}; $gameSystem._dayNightDay = 8; out.spring = f.cond(); $gameSystem._dayNightDay = ${SUMMER}; out.summer = f.cond(); $gameSystem._dayNightDay = 70; out.autumn = f.cond(); $gameSystem._dayNightDay = 92; out.winter = f.cond(); $gameSystem._dayNightDay = d; return out; })()`);
    t.check("K54 oferowane tylko gdy latają pawiki (wiosna, lato, pierwszy tydzień jesieni)", pora.spring && pora.summer && !pora.autumn && !pora.winter, pora);
    await t.setDay(SUMMER, 10);
    await t.go(8, 53, 46, 2);
    await t.frames(60);
    const elaId = await t.eval("(function(){ const e = TownLife.eventOf('ela'); return e ? e.eventId() : 0; })()");
    let started = false;
    if (elaId) {
        const talk = await t.talkTo(elaId, ["Złapię"], { secs: 40 });
        started = await t.eval("TownQuests.isActive('K54')");
        t.check("Ela: „motyl z oczkami” - przyjmujesz zadanie K54", started && /oczkami/.test(talk.text), talk.text.slice(0, 300));
    } else t.check("Ela w obozie (TownLife) - nie znaleziono", false);
    if (!started) await t.eval("TownQuests.start('K54'); 0");
    const trust0 = await t.eval("TownQuests.w6TrustCount()");
    const op0 = await t.eval("TownQuests.opinion()");
    // held in the net too long: let go at dusk
    await t.eval("(function(){ TownQuests.state().v.pawik = 1; Motyle.store().pawikNet = $gameSystem.dayNightDay(); $gameSystem.setDayNightHour(21.2); Tawerna.emit('hourChange', { hour: 21, prev: 20 }); return 0; })()");
    const gone = await M("{ v: TownQuests.vcount('pawik'), pops: window.__kit.pops.slice(-3).map(p => p.text) }");
    t.check("pawik trzymany w siatce do zmierzchu osłabł: wypuszczony (dymek), w siatce pusto", gone.v === 0 && gone.pops.some(p => /osłabł/.test(p)), gone);
    await t.eval("$gameSystem.setDayNightHour(10); 0");
    // the catch: a peacock on a flower in front of him, the roll on its side
    // (away from Ela: O in front of her would talk to her, not swing the net)
    await t.eval(`(function(){ const e = TownLife.eventOf('ela'), p = $gamePlayer; for (let r = 3; r < 9; r++) for (const [dx, dy] of [[0, r], [0, -r], [r, 0], [-r, 0]]) {
        const x = (e ? e.x : p.x) + dx, y = (e ? e.y : p.y) + dy; if ([0, 1, 2].every(k => $gameMap.isPassable(x + k, y, 6) && !$gameMap.eventsXy(x + k, y).length)) { p.locate(x, y); return 0; } } return 0; })()`);
    await t.eval(`(function(){ const p = $gamePlayer; Motyle.clear(); Motyle.auto(false); const s = { x: (p.x + 1.4) * 48, y: (p.y + 0.9) * 48, z: 6, kind: 'flower' };
        const b = Motyle.spawn('pawik', { at: { x: s.x, y: s.y, z: 6 } }); Motyle.land(b, s); b.sit.left = 99999; b.free = 0; p.setDirection(6); Motyle.netOpts.roll = 0; window.__b = b; return 0; })()`);
    await t.press("ok");
    await t.frames(60);
    const inNet = await M("{ v: TownQuests.vcount('pawik'), inWorld: Motyle.flyers.includes(window.__b), caught: !!Motyle.store().caught.pawik }");
    await t.eval("Motyle.netOpts.roll = null; 0");
    t.check("K54: złapany pawik zostaje w siatce (rzecz zadania), znika ze świata, jest w gablotce", inNet.v === 1 && !inNet.inWorld && inNet.caught, inNet);
    let done = false;
    if (elaId) {
        const talk2 = await t.talkTo(elaId, [], { secs: 40 });
        done = await t.eval("TownQuests.isDone('K54')");
        await t.shot(path.join("..", "docs", "motyle", "test_ela.png"));
        t.check("pokazany Eli: wypuszczają go razem, Ela daje rysunek", done && /Leć, motylku/.test(talk2.text), talk2.text.slice(0, 300));
    }
    if (!done) { await t.eval("TownQuests.state().v.pawik = 1; TownQuests.completeStep('K54'); 0"); done = await t.eval("TownQuests.isDone('K54')"); }
    const after = await M(`{ flag: !!TownQuests.state().flags.elaMotyl, drawing: $gameParty.numItems($dataItems[181]), op: TownQuests.opinion(), trust: TownQuests.w6TrustCount(),
        released: Motyle.flyers.some(b => b.kind === 'pawik'), note: Journal.data().notes.some(n => n.title === 'Motyl z oczkami'),
        keep: !!(window.MenuPanel && MenuPanel.isKeepsake && MenuPanel.isKeepsake($dataItems[181])) }`);
    t.check("nagroda: rysunek Eli (pamiątka), Opinia +2, zaufanie obozu +1 (w6TrustCount), notatka w dzienniku, pawik wylatuje przy Eli",
        done && after.flag && after.drawing === 1 && after.op === op0 + 2 && after.trust === trust0 + 1 && after.released && after.note && after.keep, Object.assign({ op0, trust0 }, after));
    const drawRow = await M("(function(){ const i = Journal.TABS.indexOf('Gablotka'), it = Journal.itemsForTab(i).find(x => x.info === 'drawing'); return it ? Journal.detailFor(i, it).image : null; })()");
    t.check("gablotka pokazuje rysunek Eli", drawRow === "Motyle_Rysunek_Eli", drawRow);
    // Kleofas: the kinds caught, ink (K50 done -> kleofasCzyta): a short talk, everything written - honey and experience
    const kl = await M(`(function(){ const st = Motyle.store(); TownQuests.state().flags.kleofasCzyta = 1;
        const part = Motyle.kleofasTalk({ eventId: () => 944 }); const partText = part ? part.filter(c => c.code === 401).map(c => c.parameters[0]).join(' ') : '';
        Motyle.act(null, ['kron', Object.keys(st.caught), false]);
        for (const k of Motyle.ORDER) { st.caught[k] = st.caught[k] || $gameSystem.dayNightDay(); st.counts[k] = st.counts[k] || 1; }
        const full = Motyle.kleofasTalk({ eventId: () => 944 }); const fullText = full ? full.filter(c => c.code === 401).map(c => c.parameters[0]).join(' ') : '';
        const honey0 = $gameParty.numItems($dataItems[76]); Motyle.act(null, ['kron', Motyle.ORDER.filter(k => !st.kron[k]), true]);
        return { partText: partText.slice(0, 160), fullText: fullText.slice(0, 160), done: !!st.kronDone, honey: $gameParty.numItems($dataItems[76]) - honey0, again: Motyle.kleofasTalk({ eventId: () => 944 }),
            note: Journal.data().notes.some(n => n.title === 'Kronika motyli') }; })()`);
    t.check("brat Kleofas zapisuje złapane gatunki w kronice; pełna gablotka: krótka kwestia, 2× Miód, notatka „Kronika motyli”, potem już cisza",
        /Zapisane/.test(kl.partText) && /Pięć/.test(kl.fullText) && kl.done && kl.honey === 2 && kl.again === null && kl.note, kl);

    // ---------------------------------------------------------------- F9 i zapis
    await t.go(4, 20, 15, 2);
    await t.eval("$gameSystem.setDayNightHour(12); Survival.calmWeather(); Motyle.clear(); Motyle.auto(true); 0");
    await t.frames(30);
    console.log("NOTE przed F9: " + JSON.stringify(await M("{ msg: $gameMessage.isBusy(), ev: $gameMap.isEventRunning(), farm: !!$gameTemp._farmMenuOpen, build: !!$gameTemp._buildMode, swing: !!($gamePlayer.isToolSwinging && $gamePlayer.isToolSwinging()), scene: SceneManager._scene.constructor.name }")));
    await t.eval("Input._onKeyDown({ keyCode: 120, preventDefault() {} }); 0");
    await t.frames(3);
    await t.eval("Input._onKeyUp({ keyCode: 120 }); 0");
    await t.until("SceneManager._scene && SceneManager._scene.constructor.name === 'Scene_Debug' && !!SceneManager._scene._list", 10);
    const f9 = await M("SceneManager._scene._list._rows.filter(r => ['motyle','cmy','siatka'].includes(r.kind)).map(r => r.kind + ':' + r.label)");
    t.check("F9, „Zdarzenia”: wiersze „Motyle teraz (łąka, lato, po deszczu)”, „Ćmy przy ogniu (noc)”, „Daj siatkę na motyle”",
        f9.join("|") === "motyle:Motyle teraz (łąka, lato, po deszczu)|cmy:Ćmy przy ogniu (noc)|siatka:Daj siatkę na motyle", f9);
    await t.eval("(function(){ const s = SceneManager._scene, l = s._list, i = l._rows.findIndex(r => r.kind === 'motyle'); l.select(i); s.onOk(); return 0; })()");
    await t.until(t.onMap(4), 10);
    await t.frames(90);
    const f9m = await M("{ n: Motyle.flyers.length, pawik: Motyle.flyers.some(b => b.kind === 'pawik'), force: !!Motyle.force }");
    t.check("„Motyle teraz”: lato po deszczu tu i teraz (z pawikiem)", f9m.n >= 4 && f9m.pawik && f9m.force, f9m);
    await t.shot(path.join("..", "docs", "motyle", "test_f9_motyle.png"));
    await t.eval("Motyle.clear(); Motyle.force = null; Motyle.pending = 'cmy'; 0");
    await t.frames(200);
    const f9c = await M("{ hour: Math.floor($gameSystem.dayNightHour()), moths: Motyle.moths.length, lights: Motyle.readLights().length }");
    t.check("„Ćmy przy ogniu”: noc, ćmy przy ogniu (bez ognia na ekranie - pochodnia wbita obok)", f9c.hour >= 22 && f9c.moths >= 1 && f9c.lights >= 1, f9c);
    // the save keeps the display case
    await t.eval("$gameSystem.setDayNightHour(12); 0");
    await t.saveTo(3);
    await t.eval("Motyle.store().caught = {}; 0");
    await t.loadFrom(3);
    const saved = await M("Object.keys(Motyle.store().caught).sort().join()");
    t.check("zapis i wczytanie: gablotka zostaje", saved === "bielinek,cma,cytrynek,modraszek,pawik", saved);
});
