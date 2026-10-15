// "Wyrzuć" in the bag (MenuRing.js BagView, the user 2026-10-14) and the bundles on the ground (Drops.js): X on a thing - how many
// (A / D by one, W / S by ten, Tab all), O, then Tak / Nie; the things lie in a bundle in front of the hero (another drop on the same
// place adds to it), the bag's load at once lower; the bundle stays in the save; O on it takes everything back (the gains' list);
// a keepsake (the pendant) cannot go - a plate over it, no message window; a worn thing whose last one goes is taken off.
// Screenshots: docs/ui_grafit/plecak_wyrzuc_ilosc.png, tobolek_na_ziemi.png. CDP_PORT=9460.
"use strict";
const path = require("path");
const kit = require("./lib/kit.js");
const OUT = path.join(__dirname, "..", "docs", "ui_grafit");

kit.test({ port: 9460, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", plugins: ["Drops", "MenuRing", "Equipment"] }, async t => {
    t.check("zapis wczytany (dzień 40, farma)", await t.loadFixture("day40_farm", {}));
    // a free tile in front of the hero (the bundle goes there), the things to throw out, the pendant
    const setup = await t.json(`(function(){ ConfigManager.uiClean = true; if (window.Hunting) Hunting.auto(false); if (window.Humans && Humans.auto) { Humans.auto(false); Humans.clear(); }
        if (window.Birds && Birds.auto) Birds.auto(false); ConfigManager.bagSort = "groups";
        $gameParty.gainItem($dataItems[64], 12); $gameParty.gainItem($dataItems[95], 2);
        if (!$gameParty.numItems($dataItems[171])) $gameParty.gainItem($dataItems[171], 1);
        if ($dataItems[172] && !$gameParty.numItems($dataItems[172])) $gameParty.gainItem($dataItems[172], 1);
        // (for the picture: an open bit of ground near him - no tree or other event two tiles round - facing down)
        const px = $gamePlayer.x, py = $gamePlayer.y;
        let open = null;
        for (let r = 0; r < 14 && !open; r++) for (let dy = -r; dy <= r && !open; dy++) for (let dx = -r; dx <= r && !open; dx++) {
            const x = px + dx, y = py + dy;
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || x < 10 || y < 6 || x > $gameMap.width() - 11 || y > $gameMap.height() - 7) continue;
            if (!Drops.canPlace(x, y) || !Drops.canPlace(x, y + 1) || !$gamePlayer.canPass(x, y, 2)) continue;
            if (!$gameMap.events().some(e => Math.abs(e.x - x) <= 1 && e.y >= y - 1 && e.y <= y + 4)) open = { x, y };   // (no tree over him or the bundle)
        }
        if (open) { $gamePlayer.locate(open.x, open.y); $gamePlayer.setDirection(2); }
        let dir = 0;
        for (const d of [2, 4, 6, 8]) { $gamePlayer.setDirection(d); const f = Drops.frontTile(); if (Drops.canPlace(f.x, f.y)) { dir = d; break; } }
        window.dispatchEvent(new Event("pointerdown"));
        return { open, dir, front: Drops.frontTile(), stones: $gameParty.numItems($dataItems[64]), meat: $gameParty.numItems($dataItems[95]), worn: Equipment.worn(171), drops: Drops.list().length }; })()`);
    t.check("przed bohaterem wolny kafelek, w plecaku kamienie, mięso, kurtka (noszona), wisior; na ziemi nic", setup.dir > 0 && setup.stones >= 12 && setup.worn && setup.drops === 0, setup);
    await t.frames(30);
    const info = () => t.json("MenuRing.info()");
    const bag = async () => (await info()).bag;
    const inMenu = "SceneManager._scene instanceof Scene_Menu && !SceneManager.isSceneChanging()";
    const key = async (k, n) => { await t.key(k); await t.frames(n || 4); return bag(); };
    const pick = id => t.eval(`(function(){ const l = SceneManager._scene._views.item._list; const i = l._data.findIndex(it => it && it.id === ${id}); if (i >= 0) { l.select(i); l.ensureCursorVisible(false); SceneManager._scene._views.item._detail.setItem(l.item()); } return i; })()`);
    const load = () => t.eval("Survival.carriedWeight()");

    // ---------------------------------------------------------------- into the bag's grid (level 3)
    await t.key("P");
    t.check("P otwiera menu", await t.until(inMenu, 10));
    await t.frames(45);
    await t.key("D"); await t.frames(18);
    await t.key("O"); await t.frames(6);
    await t.key("O"); await t.frames(6);
    let m = await info();
    t.check("Plecak: siatka (poziom 3), w podpowiedziach X wyrzuć", m.level === 3 && m.bag.active && m.keyCaps.includes("X") && m.keys.includes("wyrzuć"), { level: m.level, keys: m.keys });

    // ---------------------------------------------------------------- X: how many
    t.check("kamień wybrany", (await pick(64)) >= 0);
    let b = await key("X", 6);
    t.check("X: pytanie „ile” (domyślnie 1, z tylu, ile w plecaku)", b.drop && b.drop.step === "qty" && b.drop.n === 1 && b.drop.max === setup.stones && b.drop.item === 64 && !b.active, b.drop);
    m = await info();
    t.check("podpowiedzi: A/D ±1 · W/S ±10 · Tab wszystko · O dalej · P anuluj", m.keyCaps.join() === "A/D,W/S,Tab,O,P" && m.keys.join() === "±1,±10,wszystko,dalej,anuluj", m.keys);
    b = await key("D");
    t.check("D: o jeden więcej (2)", b.drop.n === 2, b.drop.n);
    b = await key("W");
    t.check("W: o dziesięć więcej (12)", b.drop.n === Math.min(12, setup.stones), b.drop.n);
    b = await key("S");
    t.check("S: o dziesięć mniej (2)", b.drop.n === 2, b.drop.n);
    b = await key("A"); b = await key("A");
    t.check("A: mniej, nie poniżej 1", b.drop.n === 1, b.drop.n);
    b = await key("Tab");
    t.check("Tab: wszystko jednym ruchem", b.drop.n === setup.stones, b.drop.n);
    b = await key("Tab");
    t.check("Tab znowu: z powrotem 1", b.drop.n === 1, b.drop.n);
    b = await key("D"); b = await key("D");
    t.check("plecak bez zmian, póki nie potwierdzisz", (await t.count(64)) === setup.stones);
    await t.frames(10);
    await t.shot(path.join(OUT, "plecak_wyrzuc_ilosc.png"));
    b = await key("O", 6);
    t.check("O: pytanie Tak / Nie (3 kamienie, Tak wybrane)", b.drop && b.drop.step === "ask" && b.drop.n === 3 && b.drop.yes === true, b.drop);
    b = await key("P", 6);
    t.check("P: z powrotem do „ile” (liczba zostaje)", b.drop && b.drop.step === "qty" && b.drop.n === 3, b.drop);
    b = await key("O", 6);
    await t.frames(6);
    await t.shot(path.join(OUT, "plecak_wyrzuc_pytanie.png"));
    b = await key("D");
    t.check("D: Nie", b.drop.yes === false);
    b = await key("A");
    t.check("A: Tak", b.drop.yes === true);
    b = await key("O", 6);
    let d = await t.json("Drops.list()");
    t.check("O na Tak: 3 kamienie z plecaka w tobołku przed bohaterem", (await t.count(64)) === setup.stones - 3 && d.length === 1 && d[0].items[64] === 3 && d[0].x === setup.front.x && d[0].y === setup.front.y, { d, n: await t.count(64) });
    t.check("okno pytania zamknięte, siatka znowu ma klawisze, plakietka „Wyrzucone”", !b.drop && b.active && /^Wyrzucone: Kamie/.test(b.toast), b);

    // ---------------------------------------------------------------- the same place: added to the bundle; the load at once
    await key("X", 6);
    await key("D"); b = await key("O", 6); b = await key("O", 6);
    d = await t.json("Drops.list()");
    t.check("kolejne wyrzucenie w to samo miejsce dokłada do tobołka (5 kamieni, jeden tobołek)", d.length === 1 && d[0].items[64] === 5 && (await t.count(64)) === setup.stones - 5, d);
    t.check("mięso wybrane", (await pick(95)) >= 0);
    const load0 = await load(), head0 = await t.eval("SceneManager._scene._views.item._head.bitmap.context.getImageData(1000, 116, 160, 28).data.join()");
    await key("X", 6); await key("D"); await key("O", 6); b = await key("O", 6);
    const load1 = await load(), head1 = await t.eval("SceneManager._scene._views.item._head.bitmap.context.getImageData(1000, 116, 160, 28).data.join()");
    d = await t.json("Drops.list()");
    t.check("2 mięsa wyrzucone: obciążenie od razu mniejsze (i napis w nagłówku inny)", load1 === load0 - 2 && head1 !== head0 && d[0].items[95] === 2, { load0, load1, items: d[0].items });

    // ---------------------------------------------------------------- what cannot go
    t.check("wisior wybrany", (await pick(172)) >= 0);
    b = await key("X", 6);
    t.check("wisior (pamiątka): nie pyta, plakietka „Tego nie wyrzucę”, nadal w plecaku", !b.drop && /^Tego nie wyrzucę/.test(b.toast) && (await t.count(172)) === 1 && b.active, b);
    t.check("bez okna wiadomości", !(await t.eval("$gameMessage.isBusy()")));
    t.check("kurtka wybrana (noszona)", (await pick(171)) >= 0 && (await t.eval("Equipment.worn(171)")));
    b = await key("X", 6);
    t.check("kurtka (jedna): od razu Tak / Nie, z ostrzeżeniem o zdjęciu", b.drop && b.drop.step === "ask" && b.drop.n === 1 && (await t.eval("Drops.wornLast($dataItems[171], 1)")), b.drop);
    b = await key("O", 6);
    t.check("kurtka zdjęta i w tobołku", !(await t.eval("Equipment.worn(171)")) && (await t.count(171)) === 0 && (await t.json("Drops.list()"))[0].items[171] === 1);

    // ---------------------------------------------------------------- on the map: the bundle lies there
    await t.key("P"); await t.frames(6);
    await t.key("P"); await t.frames(6);
    await t.key("P");
    t.check("P, P, P: z powrotem na mapie", await t.until(t.onMap(), 10));
    await t.frames(40);
    let layer = await t.json("Drops.layer()");
    t.check("na mapie tobołek (obrazek Gather_Bundle_0) przed bohaterem", layer.length === 1 && layer[0].pic === "Gather_Bundle_0", layer);
    await t.shot(path.join(OUT, "tobolek_na_ziemi.png"));

    // ---------------------------------------------------------------- the save keeps it
    await t.saveTo(2);
    t.check("wczytanie zapisu", await t.loadFrom(2));
    d = await t.json("Drops.list()");
    t.check("po wczytaniu tobołek leży dalej (te same rzeczy, ta sama mapa i kafelek)", d.length === 1 && d[0].items[64] === 5 && d[0].items[95] === 2 && d[0].items[171] === 1 && d[0].x === setup.front.x, d);
    await t.frames(20);
    layer = await t.json("Drops.layer()");
    t.check("...i widać go na mapie", layer.length === 1, layer);

    // ---------------------------------------------------------------- O on it: everything back
    await t.eval(`(function(){ $gamePlayer.setDirection(${setup.dir}); window.dispatchEvent(new Event("pointerdown")); return 0; })()`);
    await t.key("O");
    t.check("O przed tobołkiem: zabrany (przykucnięcie, potem nic na ziemi)", await t.until("Drops.list().length === 0", 10));
    await t.frames(30);
    const back = { stones: await t.count(64), meat: await t.count(95), jacket: await t.count(171), worn: await t.eval("Equipment.worn(171)"), gain: await t.eval("$gameTemp._lastGainNotice || ''") };
    t.check("rzeczy wróciły do plecaka (kamienie, mięso, kurtka - i kurtka znowu założona)", back.stones === setup.stones && back.meat === setup.meat && back.jacket === 1 && back.worn, back);
    t.check("zysk na liście zysków (jak przy zbieraniu)", /^\+\d+ /.test(back.gain), back.gain);
    t.check("na mapie już bez tobołka", (await t.json("Drops.layer()")).length === 0);
});
