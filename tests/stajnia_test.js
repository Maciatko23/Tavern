// Stajnia zajazdu (Stajnia.js + Stajnia_Zmiana.js): rozmowa Szczepana Kołodzieja (z listem od dziadka i bez), stryszek z sianem
// (nocleg płatny / darmowy po zmianie / odmowa bez pieniędzy), znacznik „Miejsce: stryszek”, zmiana w stajni zagrana przez bota od
// początku do końca (cztery części, płaca, napiwki, godziny, wytrzymałość, zaufanie), darmowy wóz przy pełnym zaufaniu (Woz.js),
// zapis i wczytanie. Zrzuty sceny: docs/stajnia/*.png.
//   CDP_PORT=9580 node tests/stajnia_test.js
"use strict";
const kit = require("./lib/kit.js");
const path = require("path");
const fs = require("fs");
const SHOTS = path.join(__dirname, "..", "docs", "stajnia");

// the bot: runs in the page before every logic tick of the scene (Stajnia_Zmiana.onTick) and presses the keys (Input._currentState)
const BOT = String.raw`
window.__bot = { mode: "good", t: 0, path: null, goal: "", last: null, still: 0, stick: null, freeze: null, frozen: null, shot: {}, cardWait: 0, turbo: 4, turboSet: false, where: "" };
(function() {
    const KEYS = ["ok", "up", "down", "left", "right", "shift", "escape", "cancel"];
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const near = (a, b) => Math.abs(a.x - b.x) <= 3 && Math.abs(a.y - b.y) <= 3;
    const nearest = (h, list) => list.reduce((best, p) => (!best || dist(h, p) < dist(h, best) ? p : best), null);
    function stand(bot, key, h, list) {
        const c = bot.stick && bot.stick.key === key && list.find(p => p.x === bot.stick.p.x && p.y === bot.stick.p.y);
        if (c) return c;
        const p = nearest(h, list);
        bot.stick = { key, p };
        return p;
    }
    function steer(bot, I, h, goal, run) {
        const key = Math.round(goal.x) + "," + Math.round(goal.y);
        if (bot.goal !== key || !bot.path) { bot.goal = key; bot.path = Stajnia_Zmiana.path(h.x, h.y, goal.x, goal.y) || [goal]; }
        while (bot.path.length && near(bot.path[0], h)) bot.path.shift();
        if (near(goal, h)) return true;
        const p = bot.path[0] || goal, dx = p.x - h.x, dy = p.y - h.y;
        if (Math.abs(dx) > 3) I[dx > 0 ? "right" : "left"] = true;
        if (Math.abs(dy) > 3) I[dy > 0 ? "down" : "up"] = true;
        if (run) I.shift = true;
        if (bot.last && dist(bot.last, h) < 0.5) { if (++bot.still > 20) { bot.path = null; bot.still = 0; } } else bot.still = 0;
        bot.last = { x: h.x, y: h.y };
        return false;
    }
    function groom(bot, I, d) {
        if (bot.mode === "bad" || d.stun > 0) return;
        const hs = d.horses.find(x => x.curry < 1 || x.comb < 1);
        if (!hs) return;
        const g = stand(bot, "h" + hs.i, d.hero, hs.stands.filter(p => p.y > 200));
        if (steer(bot, I, d.hero, g, true) && d.target && !hs.restless) I.ok = true;   // (holds O; lets go when the horse turns restless)
    }
    function feed(bot, I, d) {
        if (bot.mode === "bad") return;
        const h = d.hero, hands = d.hands, remain = k => d.horses.reduce((s, x) => s + x.need[k] - x.given[k], 0), need = k => d.horses.filter(x => x.given[k] < x.need[k]);
        let goal = null, kind = null;
        if (hands) {
            const hs = need(hands.kind)[0];
            if (hands.n < d.cap && remain(hands.kind) > hands.n && (hands.kind !== "water" || d.stock > 0)) { goal = stand(bot, "st" + hands.kind, h, d.stations[hands.kind]); kind = "take:" + hands.kind; }
            else if (hs) { goal = stand(bot, "hs" + hs.i, h, hs.stands.filter(p => p.y > 200)); kind = "give:" + hs.i; }
        } else {
            const k = ["water", "oats", "hay"].find(x => remain(x) > 0 && (x !== "water" || d.stock > 0));
            if (k) { goal = stand(bot, "st" + k, h, d.stations[k]); kind = "take:" + k; }
        }
        if (!goal) return;
        if (steer(bot, I, h, goal, !hands) && d.target === kind && bot.t % 2 === 0) I.ok = true;   // (no running with a load: the water spills)
    }
    function muck(bot, I, d) {
        if (bot.mode === "bad") return;
        const h = d.hero, bw = d.barrow, dirty = d.piles.filter(p => p.state === "dirty"), clean = d.piles.filter(p => p.state === "clean");
        let goal = null, kind = null, hold = false;
        if (dirty.length || (bw.on && bw.load > 0)) {
            if (!bw.on) { goal = stand(bot, "bar", h, d.stations.barrow); kind = "barrow"; }
            else if (bw.load >= d.cap || (!dirty.length && bw.load > 0)) { goal = stand(bot, "man", h, d.stations.manure); kind = "dump"; }
            else { const pl = dirty.find(p => bot.stick && bot.stick.key === "p" + p.i) || dirty[0]; goal = stand(bot, "p" + pl.i, h, pl.stands); kind = "scoop"; hold = true; }
        } else if (bw.on) { goal = stand(bot, "bar", h, d.stations.barrow); kind = "park"; }
        else if (clean.length) {
            if (!d.hands || d.hands.n < Math.min(d.strawCap, clean.length)) { goal = stand(bot, "hay", h, d.stations.hay); kind = "hay"; }
            else { const pl = clean[0]; goal = stand(bot, "c" + pl.i, h, pl.stands); kind = "spread"; }
        }
        if (!goal) return;
        if (steer(bot, I, h, goal, !bw.on) && d.target === kind) { if (hold || bot.t % 2 === 0) I.ok = true; }
    }
    function guests(bot, I, d) {
        if (bot.mode === "bad") return;
        const h = d.hero, tr = d.travellers, lead = d.lead;
        let goal = null, kind = null;
        if (lead) {
            const t = tr.find(x => x.id === lead.trav);
            if (t.state === "led") { const bx = d.boxes.find(b => b.free); if (bx) { goal = stand(bot, "bx" + bx.i, h, bx.stands); kind = "stable"; } }
            else if (t.state === "out") { goal = stand(bot, "door", h, d.stations.door); kind = "deliver"; }
        } else {
            const back = tr.filter(t => t.state === "back").sort((a, b) => b.waited - a.waited)[0];
            if (back) {
                if (!d.hands) { goal = stand(bot, "sad", h, d.stations.saddle); kind = "saddle"; }
                else { const bx = d.boxes.find(b => !b.free && b.coat === back.coat); if (bx) { goal = stand(bot, "fb" + bx.i, h, bx.stands); kind = "fetch"; } }
            } else if (tr.some(t => t.state === "waitIn") && !d.hands) { goal = stand(bot, "door", h, d.stations.door); kind = "take"; }
        }
        if (!goal) return;
        if (steer(bot, I, h, goal, !lead) && d.target === kind && bot.t % 2 === 0) I.ok = true;
    }
    Stajnia_Zmiana.onTick = function(scene) {
        const bot = window.__bot, I = Input._currentState;
        for (const k of KEYS) I[k] = false;
        bot.t++;
        const st = Stajnia_Zmiana.state();
        if (!st) return;
        if (!bot.turboSet) { bot.turboSet = true; scene.turbo = bot.turbo; }
        if (bot.freeze) {
            const tag = bot.freeze(st, scene);
            if (tag && !bot.shot[tag]) { bot.shot[tag] = true; bot.frozen = tag; bot.turbo = scene.turbo; scene.turbo = 0; return; }
        }
        const where = st.phase + "|" + st.card + "|" + st.part;
        if (where !== bot.where) { bot.where = where; bot.cardWait = 0; bot.path = null; bot.stick = null; }
        if (st.phase === "card" || st.phase === "banner" || st.phase === "summary") { if (++bot.cardWait > 30 && bot.t % 2 === 0) I.ok = true; return; }
        bot.cardWait = 0;
        if (st.phase !== "play" || !st.data) return;
        const d = st.data;
        if (st.part === "groom") groom(bot, I, d);
        else if (st.part === "feed") feed(bot, I, d);
        else if (st.part === "muck") muck(bot, I, d);
        else if (st.part === "guests") guests(bot, I, d);
    };
})();
`;

const FREEZE = `function(st, scene) {
    const d = st.data;
    if (st.phase === "card" && scene.phaseT > 16) return ({ intro: "01_karta_zmiany", groom: "02_obrzadek_karta", feed: "04_karmienie_karta", muck: "06_gnoj_karta", guests: "08_podrozni_karta" })[st.card];
    if (st.phase === "summary" && scene.phaseT > 16) return "10_podsumowanie";
    if (!d || st.phase !== "play") return null;
    if (st.part === "groom" && d.horses.some(x => x.curry > 0.5 && x.curry < 1)) return "03_obrzadek";
    if (st.part === "feed" && d.given >= 6 && d.hands) return "05_karmienie";
    if (st.part === "muck" && d.barrow.on && d.barrow.load >= 2) return "07_gnoj";
    if (st.part === "guests" && d.boxes.some(b => b.closed) && d.travellers.some(t => t.state === "stored")) return "09_podrozni";
    return null;
}`;

kit.test({ port: 9580, errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    const state = () => J("Stajnia.state()");
    const resolveText = () => J(`(function(){ const r = Tawerna.talk.resolve(null, "kolodziej", { ev: $gameMap.event(2940) });
        return { by: r.by, text: (r.list || []).filter(c => c.code === 401).map(c => c.parameters[0].replace(/\\\\SPK\\[\\d+\\]/, "")).join(" / "), choice: (r.list || []).filter(c => c.code === 102).map(c => c.parameters[0]) }; })()`);
    fs.mkdirSync(SHOTS, { recursive: true });

    t.check("wtyczki Stajnia i Stajnia_Zmiana są na liście, zaraz po Woz",
        await t.eval(`(function(){ const n = $plugins.map(p => p.name), a = n.indexOf("Woz"), b = n.indexOf("Stajnia"), c = n.indexOf("Stajnia_Zmiana"); return a >= 0 && b === a + 1 && c === b + 1 && !!window.Stajnia && !!window.Stajnia_Zmiana; })()`));

    // ---- 1. stara gra (bez fabuły): Szczepan wynajmuje stryszek i daje pracę
    t.check("nowa gra bez fabuły (21:00)", await t.newGame({ hour: 21, quiet: true }));
    t.check("w grze bez fabuły nie ma wezwania (Story.wezwanie -> null)", (await t.eval("Story.wezwanie() === null")) === true);
    const placed = await t.go(181, 12, 10, 8);
    const loft = await J(`(function(){ const e = $gameMap.event(3250); return e && { x: e.x, y: e.y, img: e.event().pages[0].image.characterName, marker: ($dataMap.events.find(m => m && /^Miejsce:\s*stryszek\s*$/i.test(m.name || "")) || { x: null, y: null }), reserved: Tawerna.inject.list().some(r => r.owner === "Stajnia" && r.ids === "3250-3259") }; })()`);
    t.check("na Map181 wstawiony stryszek (3250) z drabiną; rezerwa identyfikatorów w rdzeniu", placed && loft && loft.reserved === true && (loft.img === "!House_Town" || (loft.img === "" && loft.x === 13 && loft.y === 3)), loft);   // (Map181 now has "Miejsce: stryszek" at (13,3): the loft stands there with no picture of its own)
    const marker = await J(`(function(){ const mk = (n, x, y) => ({ id: 99, name: n, x, y, pages: [] }), a = Stajnia.build({ events: [null, mk("Miejsce: stryszek", 5, 6), mk("Miejsce: stajnia_zmiana", 9, 3)] }, 181), b = Stajnia.build({ events: [] }, 181), c = Stajnia.build({ events: [] }, 8);
        return { a: a.map(e => [e.id, e.x, e.y, e.pages[0].image.characterName]), b: b.map(e => [e.id, e.x, e.y]), c: c.length }; })()`);
    t.check("znacznik „Miejsce: stryszek” wygrywa z miejscem zapasowym; „Miejsce: stajnia_zmiana” dodaje tablicę; inne mapy nic",
        JSON.stringify(marker.a) === JSON.stringify([[3250, 5, 6, ""], [3251, 9, 3, ""]]) && JSON.stringify(marker.b) === JSON.stringify([[3250, 13, 3]]) && marker.c === 0, marker);

    let r = await resolveText();
    t.check("rozmowa bez listu: przejęcie Stajnia, Szczepan się przedstawia, menu ze zmianą i noclegiem",
        r.by === "Stajnia" && /Szczepan Kołodziej, woźnica/.test(r.text) && r.choice[0].includes("Chcę wziąć zmianę w stajni.") && r.choice[0].includes("Co z noclegiem?"), r);
    let talk = await t.talkTo(2940, ["Co z noclegiem?"]);
    t.check("„Co z noclegiem?” bez listu: stryszek za 5 G i zasada o darmowej nocy po zmianie",
        talk.done && /Stryszek nad boksami/.test(talk.text) && /kosztuje 5\sG/.test(talk.text) && !/od kiedy przyniosłeś list/.test(talk.text), talk.text);
    t.check("pierwsza rozmowa zapamiętana (met), bez „przyjęcia” (taken)", await J("Stajnia.state().met === true && Stajnia.state().taken === false"));
    talk = await t.talkTo(2940, ["Chcę wziąć zmianę"]);
    t.check("o 21:00 Szczepan odmawia zmiany (rano od 5 do 13)", /rano, od 5 do 13/.test(talk.text), talk.text);

    // ---- 2. nocleg na stryszku: płatny, bez pieniędzy, za wcześnie, darmowy
    const sleep = async () => {
        await t.eval("$gameSystem.setStamina(10); 0");
        const before = await J("({ day: $gameSystem.dayNightDay(), hour: $gameSystem.dayNightHour(), gold: $gameParty.gold() })");
        await t.eval("window.__kit.pops.splice(0); 0");
        const tk = await t.talkTo(3250, ["Prześpij noc"], { secs: 40 });
        await t.frames(60);
        await t.dismiss();
        const after = await J("({ day: $gameSystem.dayNightDay(), hour: $gameSystem.dayNightHour(), gold: $gameParty.gold(), stamina: $gameSystem.stamina(), max: $gameSystem.maxStamina() })");
        return { before, after, tk, pops: await t.popups() };
    };
    await t.gold(100); await t.setHour(21);
    const s1 = await sleep();
    t.check("stryszek bez zmiany dziś: „Noc kosztuje 5 G”, noc przespana do rana (7:00 następnego dnia), -5 G",
        /Noc kosztuje 5\sG/.test(s1.tk.text) && s1.after.day === s1.before.day + 1 && Math.abs(s1.after.hour - 7) < 0.3 && s1.after.gold === 95, { text: s1.tk.text, b: s1.before, a: s1.after });
    t.check("wytrzymałość po nocy na sianie: 80% maksimum (lepiej niż na ziemi, gorzej niż w łóżku)", Math.abs(s1.after.stamina - Math.round(s1.after.max * 0.8)) <= 2, [s1.after.stamina, s1.after.max]);
    await t.gold(0); await t.setHour(21);
    const s2 = await sleep();
    t.check("bez pieniędzy: odmowa dymkiem (nie oknem), doba bez zmian", s2.after.day === s2.before.day && s2.after.gold === 0 && s2.pops.some(x => /Brakuje 5 G na nocleg/.test(x)), s2.pops);
    await t.setHour(12);
    const s3 = await sleep();
    t.check("w południe za wcześnie na sen (dymek)", s3.after.day === s3.before.day && s3.pops.some(x => /za wcześnie na sen/.test(x)), s3.pops);
    await t.setHour(21);
    await t.eval("Stajnia.state().shiftDay = Stajnia.workDay(); 0");
    const s4 = await sleep();
    t.check("po zmianie tego dnia noc za darmo (0 G), „noc za darmo” w pytaniu", /noc\sza\sdarmo/.test(s4.tk.text) && s4.after.day === s4.before.day + 1 && s4.after.gold === 0, { text: s4.tk.text, a: s4.after });
    t.check("stan: 2 noce, zapłacone 5 G", (await state()).nights === 2 && (await state()).paid === 5, await state());

    // ---- 3. gra z fabułą: list od dziadka
    t.check("nowa gra z fabułą", await t.newGame({ story: true, skipIntro: true, hour: 21, quiet: true }));
    await t.eval("Object.assign(Story.state().wez, { called: 3, gone: true, letter: true }); 0");
    t.check("Story.wezwanie() podaje list (letter)", (await J("Story.wezwanie()")).letter === true, await J("Story.wezwanie()"));
    t.check("na Map181 w grze z fabułą", await t.go(181, 12, 10, 8));
    await t.eval("window.__steps = []; Tawerna.on('storyStep', e => window.__steps.push(e.step), { owner: 'StajniaTest' }); 0");
    r = await resolveText();
    t.check("z listem: Szczepan czyta list od Stacha, „Stach był mi winien”, stryszek jest twój",
        r.by === "Stajnia" && /Mam list od Stacha/.test(r.text) && /Stach był mi winien/.test(r.text) && /Stryszek nad boksami jest twój/.test(r.text), r.text);
    talk = await t.talkTo(2940, ["Bywaj"]);
    const steps = await J("window.__steps");
    t.check("po liście: przyjęty (taken) i krok „stajnia” w dzienniku fabuły (Story.step)", (await state()).taken === true && steps.includes("stajnia"), { steps, st: await state() });
    r = await resolveText();
    t.check("druga rozmowa: bez czytania listu, tylko menu", !/Mam list od Stacha/.test(r.text) && r.choice.length === 1, r);
    talk = await t.talkTo(2940, ["Co z noclegiem?"]);
    t.check("z listem w „Co z noclegiem?”: „od kiedy przyniosłeś list od Stacha”", /od kiedy przyniosłeś list\sod Stacha/.test(talk.text), talk.text);

    // ---- 4. zmiana w stajni (bot, od początku do końca)
    await t.eval(BOT + "; 0");
    await t.eval("window.__shifts = []; Tawerna.on('stajniaShift', e => window.__shifts.push(e), { owner: 'StajniaTest' }); 0");
    const runShift = async (mode, opts, freeze) => {
        await t.eval(`(function(){ $gameSystem.setDayNightHour(6); $gameSystem.setStamina(100); window.__res = null; Object.assign(window.__bot, { mode: "${mode}", freeze: ${freeze || "null"}, shot: {}, frozen: null, turboSet: false, turbo: 4, where: "" }); })()`);
        const before = await J("({ gold: $gameParty.gold(), hour: $gameSystem.dayNightHour(), day: $gameSystem.dayNightDay(), stamina: $gameSystem.stamina(), x: $gamePlayer.x, y: $gamePlayer.y, map: $gameMap.mapId(), st: Stajnia.state() })");
        const started = await t.eval(`Stajnia.startShift(Object.assign(${JSON.stringify(opts)}, { onEnd: r => { window.__res = r; window.__endScene = SceneManager._scene.constructor.name; } }))`);
        const t0 = Date.now();
        for (let i = 0; i < 2400; i++) {
            const frozen = await t.eval("window.__bot.frozen");
            if (frozen) { await t.wait(250); await t.shot(path.join(SHOTS, frozen + ".png")); await t.eval("Stajnia_Zmiana.scene().turbo = window.__bot.turbo; window.__bot.frozen = null; 0"); }
            if (await t.eval("!!window.__res") && await t.eval(t.onMap(181))) break;
            await t.wait(200);
        }
        await t.wait(500);
        const after = await J("({ gold: $gameParty.gold(), hour: $gameSystem.dayNightHour(), day: $gameSystem.dayNightDay(), stamina: $gameSystem.stamina(), x: $gamePlayer.x, y: $gamePlayer.y, map: $gameMap.mapId(), st: Stajnia.state(), scene: SceneManager._scene.constructor.name, endScene: window.__endScene, running: Stajnia_Zmiana.isRunning() })");
        return { started, before, after, res: await J("window.__res"), secs: Math.round((Date.now() - t0) / 1000) };
    };
    const brief = x => x && { total: x.total, pay: x.pay, tips: x.tips, grade: x.grade, score: x.score, parts: Object.fromEntries(Object.entries(x.parts || {}).map(([k, v]) => [k, v.score])) };

    await t.setHour(6);
    t.check("rano o 6:00 zmianę można wziąć (canShift = null)", (await J("Stajnia.canShift()")) === null, await J("Stajnia.canShift()"));
    await t.setHour(15);
    t.check("po południu nie (canShift: rano)", (await J("Stajnia.canShift()")).kind === "rano");
    // z menu rozmowy Szczepana: „Chcę wziąć zmianę” o 6:00 odpala scenę (talk -> Stajnia.offer -> begin)
    await t.setHour(6);
    await t.eval("window.__bot.mode = 'bad'; window.__bot.turboSet = false; window.__bot.turbo = 4; window.__res = null; 0");
    const viaTalk = t.talkTo(2940, ["Chcę wziąć zmianę"], { secs: 5 });
    const sawScene = await t.until("Stajnia_Zmiana.isRunning()", 25);
    t.check("„Chcę wziąć zmianę” w rozmowie ze Szczepanem (6:00) otwiera scenę zmiany", sawScene && /Konie głodne/.test((await J("window.__drv.log.map(l => l.t).join(' / ')"))), await J("window.__drv.log.map(l => l.t).join(' / ')"));
    await t.eval("Stajnia_Zmiana.abort(); 0");
    for (let i = 0; i < 80 && !(await t.eval(t.onMap(181))); i++) { await t.eval("Input._currentState.ok = true; 0"); await t.wait(100); await t.eval("Input._currentState.ok = false; 0"); await t.wait(200); }
    await viaTalk.catch(() => 0);
    await t.eval("window.__drv.on = false; window.__bot.mode = 'good'; 0");
    await t.eval("Stajnia.state().shifts = 0; Stajnia.state().trust = 0; Stajnia.state().shiftDay = 0; Stajnia.state().last = null; Stajnia.state().earned = 0; window.__shifts.length = 0; 0");

    const good = await runShift("good", { seed: 11, level: 0, turbo: 4 }, FREEZE);
    t.check("zmiana startuje z mapy i kończy się wynikiem w onEnd (pay, tips, total, grade, 4 części)", good.started === true && good.res && ["pay", "tips", "total", "grade", "parts"].every(k => k in good.res) &&
        ["groom", "feed", "muck", "guests"].every(k => good.res.parts[k] && typeof good.res.parts[k].score === "number"), brief(good.res));
    t.check("wracamy na mapę (Scene_Map), bohater tam, gdzie stał", good.after.endScene === "Scene_Map" && good.after.scene === "Scene_Map" && !good.after.running && good.after.map === 181 && good.after.x === good.before.x && good.after.y === good.before.y, good.after);
    t.check("płaca w sakiewce (złoto + total), total > 0", good.res && good.after.gold - good.before.gold === good.res.total && good.res.total > 0, { d: good.after.gold - good.before.gold, total: good.res && good.res.total });
    t.check("minęły 3 godziny (6:00 -> 9:00) i zeszło 25 wytrzymałości", Math.abs((good.after.day * 24 + good.after.hour) - (good.before.day * 24 + good.before.hour) - 3) < 0.05 && Math.abs(good.after.stamina - (good.before.stamina - 25)) <= 3, { b: good.before, a: good.after });
    t.check("dobry bot: obrządek >= 85 bez kopniaków, karmienie >= 85 bez zmarnowanej wody, gnój i słoma >= 85, konie podróżnych >= 85",
        good.res && good.res.parts.groom.score >= 85 && good.res.parts.groom.kicks === 0 && good.res.parts.feed.score >= 85 && good.res.parts.feed.spilled === 0 && good.res.parts.muck.score >= 85 && good.res.parts.guests.score >= 85, good.res && good.res.parts);
    t.check("podróżni: wszyscy obsłużeni, napiwki > 0", good.res && good.res.parts.guests.served === good.res.parts.guests.total && good.res.tips > 0, good.res && good.res.parts.guests);
    t.check("zmiana zaliczona: shifts 1, zaufanie rośnie, shiftDay = dziś, zdarzenie stajniaShift", good.after.st.shifts === 1 && good.after.st.trust >= (good.res.grade >= 4 ? 2 : 1) && good.after.st.shiftDay === good.after.day && (await J("window.__shifts")).length === 1, { st: good.after.st, grade: good.res && good.res.grade });
    t.check("po zmianie tego dnia: canShift mówi „zrobione”", (await J("Stajnia.canShift()")).kind === "zrobione");
    console.log("   good: " + JSON.stringify(brief(good.res)) + " (" + good.secs + " s)");

    const bad = await runShift("bad", { seed: 11, level: 0, turbo: 4 });
    t.check("zła zmiana też się kończy i wraca na mapę", bad.res && bad.after.scene === "Scene_Map" && bad.after.endScene === "Scene_Map", brief(bad.res));
    t.check("dobra zmiana płaci więcej i ma lepszą ocenę niż zła", good.res && bad.res && good.res.total > bad.res.total && good.res.grade > bad.res.grade && good.res.pay > bad.res.pay, { good: brief(good.res), bad: brief(bad.res) });
    console.log("   bad:  " + JSON.stringify(brief(bad.res)));

    // przerwanie z pauzy: bez płacy (bez bota - jego onTick czyści klawisze)
    await t.eval("Stajnia_Zmiana.onTick = null; 0");
    await t.eval("window.__res = null; Stajnia.startShift({ seed: 4, parts: ['groom'], cards: false, onEnd: r => window.__res = r }); 0");
    await t.until("Stajnia_Zmiana.state() && Stajnia_Zmiana.state().phase === 'play'", 20);
    const gold0 = await t.gold();
    await t.eval("Stajnia_Zmiana.scene().turbo = 1; 0");
    await t.key("P"); await t.frames(10);
    const paused = await J("Stajnia_Zmiana.state().paused");
    await t.key("S"); await t.frames(4); await t.key("O");
    await t.until("Stajnia_Zmiana.state() && Stajnia_Zmiana.state().phase === 'summary'", 10);
    for (let i = 0; i < 60 && !(await t.eval("!!window.__res") && await t.eval(t.onMap(181))); i++) { await t.key("O"); await t.wait(150); }
    const ab = await J("window.__res");
    t.check("P w grze pauzuje; „Przerwij zmianę” kończy bez płacy (aborted, pay 0) i wraca na mapę", paused && ab && ab.aborted && ab.pay === 0 && (await t.gold()) === gold0 + ab.total, { paused, ab: ab && { aborted: ab.aborted, pay: ab.pay, total: ab.total } });

    t.check("trudność rośnie ze zmianami (poziom = liczba zmian, do 5): więcej podróżnych, krótszy czas, więcej gnoju", (await J("(function(){ const a = Stajnia_Zmiana.levelCfg(0), c = Stajnia_Zmiana.levelCfg(3); return a.guests.n < c.guests.n && a.guests.time > c.guests.time && a.muck.piles < Stajnia_Zmiana.levelCfg(5).muck.piles && Stajnia_Zmiana.level() === Math.min(5, Stajnia.state().shifts); })()")) === true);
    const shots = fs.readdirSync(SHOTS).filter(f => /^\d\d_.*\.png$/.test(f));
    t.check("zrzuty sceny w docs/stajnia/ (karta, cztery części, podsumowanie)", ["01_karta_zmiany", "03_obrzadek", "05_karmienie", "07_gnoj", "09_podrozni", "10_podsumowanie"].every(n => shots.includes(n + ".png")), shots);

    // ---- 5. zaufanie i darmowy wóz (Woz.js)
    t.check("poziomy zaufania: 0 pkt = 0, 2 = 1, 5 = 2, 9 = 3", (await J(`[0, 2, 5, 9].map(p => { Stajnia.state().trust = p; return Stajnia.trustLevel(); })`)).join() === "0,1,2,3");
    await t.eval("Stajnia.state().trust = 4; 0");
    const fare = await J("Woz.priceOf(2)");
    await t.eval("Stajnia.state().trust = 9; 0");
    t.check("pełne zaufanie: przejazd Woz.priceOf = 0 (inaczej 6 G za dwie mapy)", fare === 6 && (await J("Woz.priceOf(2)")) === 0 && (await J("Stajnia.freeRide()")) === true, [fare, await J("Woz.priceOf(2)")]);
    await t.setHour(7.2);
    t.check("na miasto (Map008) do wozu", await t.go(8, 34, 108, 6));
    await t.setHour(7.2);
    await t.gold(0);
    const rode = await t.eval("Woz.go('podgrodzie')");
    await t.until(t.onMap(111), 40);
    t.check("przejazd wozem Wojciecha za darmo (0 G w sakiewce, jedzie na Podgrodzie)", rode === true && (await t.eval("$gameMap.mapId()")) === 111 && (await t.gold()) === 0, { rode, map: await t.eval("$gameMap.mapId()") });

    // ---- 6. zapis i wczytanie
    const snap = await state();
    await t.saveTo(3);
    t.check("powrót na tytuł i wczytanie zapisu", await t.toTitle() && await t.loadFrom(3));
    const loaded = await state();
    t.check("zaufanie, zmiany, dzień zmiany, spotkanie i przyjęcie przeżyły zapis", JSON.stringify(loaded) === JSON.stringify(snap) && loaded.taken === true && loaded.shifts >= 1, { snap, loaded });
    t.check("po wczytaniu stryszek jest dalej na Map181", await t.go(181, 12, 10, 8) && (await t.eval("!!$gameMap.event(3250)")) === true);
});
