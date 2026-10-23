// Zrzuty i klatki GIF-ów motyli (Motyle.js) do docs/motyle/: łąka latem, motyl na ramieniu, ćmy wokół ogniska nocą, gablotka
// w Dzienniku (menu P), Ela i pawik (K54). Klatki wycinków idą do <katalog>, GIF-y składa tools/motyle/make_gif.py.
//   CDP_PORT=9541 node tools/motyle/capture.js <katalog na klatki> [ujęcie...]
// Ujęcia: swieca, laka, ramie, cmy, gablotka, ela (bez nazw: wszystkie). Serwer: node tools/serve.js (8765).
"use strict";
const path = require("path");
const fs = require("fs");
const kit = require("../../tests/lib/kit.js");
const DIR = process.argv[2] || path.join(__dirname, "frames");
const want = process.argv.slice(3);
const on = name => !want.length || want.includes(name);
const DOCS = path.join(__dirname, "..", "..", "docs", "motyle");
fs.mkdirSync(DIR, { recursive: true });
fs.mkdirSync(DOCS, { recursive: true });

kit.test({ port: 9541, errorCheck: false }, async t => {
    t.check("nowa gra", await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, minimap: false }));
    // a clip (screen px) round a point, saved as <name>_<i>.png
    const clip = async (name, i, cx, cy, w, h) => {
        const r = await t.b.send("Page.captureScreenshot", { format: "png", clip: { x: Math.max(0, Math.round(cx - w / 2)), y: Math.max(0, Math.round(cy - h / 2)), width: w, height: h, scale: 1 } });
        fs.writeFileSync(path.join(DIR, name + "_" + String(i).padStart(2, "0") + ".png"), Buffer.from(r.data, "base64"));
    };
    const heroAt = () => t.json("(function(){ const s = SceneManager._scene._spriteset._characterSprites.find(c => c._character === $gamePlayer); return { x: s.x, y: s.y }; })()");

    if (on("swieca")) {   // grandpa's house (a dark room) at night: moths at the candles
        await t.setDay(35, 22.5);
        await t.frames(320);
        await t.shot(path.join(DOCS, "cmy_przy_swiecy.png"));
        const l = await t.json(`(function(){ const L = Motyle.readLights(); let best = null, bn = -1; for (const l of L) { const n = Motyle.moths.filter(m => m.moth.light === l.id).length; if (n > bn) { bn = n; best = l; } }
            return best ? { x: best.fx - $gameMap.displayX() * 48, y: best.fy - $gameMap.displayY() * 48, n: bn } : null; })()`);
        if (l) for (let i = 0; i < 50; i++) { await clip("swieca", i, l.x, l.y - 6, 200, 150); await t.frames(2); }
        console.log("SHOT swieca " + JSON.stringify(l));
    }
    await t.setDay(35, 11);
    await t.go(4, 20, 15, 2);
    await t.eval("Survival.calmWeather(); $gameScreen.clearWeather(); $gameSystem.setStamina && $gameSystem.setStamina(100); $gameParty.gainItem($dataItems[180], 1); 0");
    if (on("laka")) {
        // the hero in the middle of the thickest flowers
        const at = await t.json(`(function(){ const S = Motyle.spots.filter(s => s.kind !== 'ground'); let best = null, bn = -1;
            for (const s of S) { const n = S.filter(o => Math.hypot(o.x - s.x, o.y - s.y) < 240).length; if (n > bn) { bn = n; best = s; } }
            return best ? { x: Math.floor(best.x / 48), y: Math.floor(best.y / 48), n: bn } : null; })()`);
        if (at) { await t.eval(`(function(){ let x = ${at.x}, y = ${at.y}; for (let r = 0; r < 6; r++) for (const [dx, dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]) { if ($gamePlayer.canPass && $gameMap.isPassable(x + dx * r, y + dy * r, 2) && !$gameMap.eventsXy(x + dx * r, y + dy * r).length) { $gamePlayer.locate(x + dx * r, y + dy * r); $gamePlayer.center(x + dx * r, y + dy * r); return 0; } } return 0; })()`); }
        await t.eval("Motyle.clear(); Motyle.reset(); 0");
        await t.frames(420);
        await t.shot(path.join(DOCS, "motyle_laka.png"));
        // the GIF: F9's "Motyle teraz" (a summer meadow after rain - the most there are) round the hero
        await t.eval("Motyle.clear(); Motyle.pending = 'motyle'; 0");
        await t.frames(240);
        const h = await heroAt();
        for (let i = 0; i < 40; i++) { await clip("laka", i, h.x, h.y - 30, 720, 400); await t.frames(3); }
        console.log("SHOT laka " + JSON.stringify(await t.json("{ n: Motyle.flyers.length, kinds: Motyle.flyers.map(b => b.kind + ':' + b.state) }")));
    }

    if (on("ramie")) {
        await t.eval("Motyle.auto(false); Motyle.clear(); $gamePlayer.setDirection(2); 0");
        await t.frames(10);
        await t.eval(`(function(){ const p = $gamePlayer, b = Motyle.spawn('cytrynek', { at: { x: (p.x + 3) * 48, y: (p.y + 0.5) * 48, z: 34 } }); b.free = 0; Motyle.sendToShoulder(b, false); b.sit && (b.sit.left = 99999); return 0; })()`);
        const h = await heroAt();
        for (let i = 0; i < 40; i++) { await clip("ramie", i, h.x, h.y - 34, 200, 150); await t.frames(3); }
        await t.frames(60);
        await t.eval("Motyle.shoulder && (Motyle.shoulder.sit.phase = 'open', Motyle.shoulder.sit.hold = 400); 0");
        await t.frames(2);
        await clip("ramie_stop", 0, h.x, h.y - 34, 160, 120);
        await t.shot(path.join(DOCS, "motyl_na_ramieniu_caly.png"));
        console.log("SHOT ramie " + JSON.stringify(await t.json("{ sh: Motyle.shoulder && Motyle.shoulder.state }")));
        await t.eval("Motyle.auto(true); 0");
    }

    if (on("cmy")) {
        await t.eval("Motyle.clear(); $gameSystem.setDayNightHour(22.6); Survival.calmWeather(); 0");
        const p = await t.json("{ x: $gamePlayer.x, y: $gamePlayer.y }");
        // a campfire burning two tiles to the right (Farming's own building, plenty of fuel)
        await t.eval(`(function(){ const F = Farming.farm(), m = $gameMap.mapId(), L = (F.buildings[m] = F.buildings[m] || []);
            let x = ${p.x} + 2, y = ${p.y}; for (let k = 0; k < 8; k++) { if (Farming.tileIsFree ? true : true) break; }
            L.push({ id: F.nextId++, type: 'campfire', x, y, last: Farming.today(), fuel: 30, fuelSince: Farming.clockHours() }); F.rev++; window.__fire = { x, y }; return 0; })()`);
        await t.eval(`$gamePlayer.setDirection(6); $gamePlayer.center(${p.x} + 1, ${p.y}); 0`);
        await t.frames(300);
        await t.shot(path.join(DOCS, "cmy_przy_ognisku.png"));
        const f = await t.json("(function(){ const e = SceneManager._scene._spriteset._buildingSprites._sprites.find(e => e.b.type === 'campfire'); return e ? { x: e.sprite.x, y: e.sprite.y } : null; })()");
        if (f) for (let i = 0; i < 60; i++) { await clip("cmy", i, f.x, f.y - 30, 240, 170); await t.frames(2); }
        console.log("SHOT cmy " + JSON.stringify(await t.json("{ moths: Motyle.moths.length, lights: Motyle.readLights().length }")));
        await t.eval("$gameSystem.setDayNightHour(11); 0");
    }

    if (on("gablotka")) {
        await t.eval(`(function(){ const s = Motyle.store(); for (const k of ['cytrynek', 'pawik', 'bielinek', 'cma']) { s.caught[k] = s.caught[k] || 35; s.counts[k] = (s.counts[k] || 0) + 2; } return 0; })()`);
        await t.key("J", 4);
        await t.until("!!(SceneManager._scene && SceneManager._scene._views && SceneManager._scene._views.journal)", 10);
        await t.frames(30);
        await t.eval(`(function(){ const v = SceneManager._scene._views.journal; v._tab = Journal.TABS.indexOf('Gablotka'); v.showTab(false); v._list.select(1); v._list.updateHelp(); return 0; })()`);
        await t.frames(40);
        await t.shot(path.join(DOCS, "gablotka.png"));
        await t.eval(`(function(){ const v = SceneManager._scene._views.journal; v._list.select(2); v._list.updateHelp(); return 0; })()`);
        await t.frames(30);
        await t.shot(path.join(DOCS, "gablotka_nie_zlapany.png"));
        await t.eval("SceneManager.goto(Scene_Map); 0");
        await t.until(t.onMap(4), 10);
        await t.frames(20);
        console.log("SHOT gablotka");
    }

    if (on("ela")) {
        await t.setDay(35, 10);
        await t.go(8, 53, 46, 2);
        await t.frames(60);
        const id = await t.eval("(function(){ const e = TownLife.eventOf('ela'); return e ? e.eventId() : 0; })()");
        if (id) {
            await t.eval(`(function(){ if (!TownQuests.isActive('K54') && !TownQuests.isDone('K54')) TownQuests.start('K54'); TownQuests.state().v.pawik = 1;
                const e = TownLife.eventOf('ela'); TownLife.hold('ela', true); const p = $gamePlayer;
                for (const [dx, dy, d] of [[0, 1, 8], [-1, 0, 6], [1, 0, 4], [0, -1, 2]]) { const x = e.x + dx, y = e.y + dy; if ($gameMap.isPassable(x, y, d) && !$gameMap.eventsXy(x, y).length) { p.locate(x, y); p.setDirection(d); break; } }
                return 0; })()`);
            await t.frames(30);
            await t.eval("TownLife.eventOf('ela').start(); 0");
            await t.frames(10);
            for (let i = 0; i < 40 && (await t.eval("$gameMessage.isBusy() || $gameMap.isEventRunning()")); i++) {
                const txt = await t.eval("$gameMessage.allText()");
                if (/Leć, motylku/.test(txt)) { await t.frames(20); await t.shot(path.join(DOCS, "ela_pawik_rozmowa.png")); }
                await t.press("ok"); await t.frames(16);
            }
            await t.eval("TownLife.hold('ela', false); 0");
            await t.frames(30);
            const e = await t.json(`(function(){ const ev = TownLife.eventOf('ela'), s = SceneManager._scene._spriteset._characterSprites.find(c => c._character === ev); return s ? { x: s.x, y: s.y } : null; })()`);
            if (e) for (let i = 0; i < 50; i++) { await clip("ela", i, e.x, e.y - 50, 300, 220); await t.frames(3); }
            await t.shot(path.join(DOCS, "ela_pawik.png"));
            console.log("SHOT ela " + JSON.stringify(await t.json("{ done: TownQuests.isDone('K54'), pawik: Motyle.flyers.filter(b => b.kind === 'pawik').map(b => b.state) }")));
        } else console.log("NOTE Eli nie ma na mapie 8");
    }
});
