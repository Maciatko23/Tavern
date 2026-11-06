// Goście w sali tawerny (js/plugins/Goscie_Sala.js, 2026-11-05): wieczorem siedzą na okrągłych krzesłach, jedzą i piją, wstają, chodzą, wracają; z każdym można porozmawiać;
// dwóch na jednym krześle nigdy; nie zajmują miejsc mieszkańców ani miejsca bohatera przy stole; koszt klatki w limicie.
// Ze stagingu: GAME_OVERLAY=tools/tavern/siadanie/staging GAME_OVERLAY_JS=1 CDP_PORT=9413 node tests/goscie_sala_test.js   (ZRZUTY=folder: zrzuty)
"use strict";
const kit = require("./lib/kit.js");
const FRAME_LIMIT = 0.3;
kit.test({ port: Number(process.env.CDP_PORT) || 9413, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 300000 }, async t => {
    t.check("wtyczka wczytana", await t.json("!!window.GoscieSala"));
    await t.newGame({ map: 1, x: 50, y: 37, day: 12, hour: 20, quiet: true, minimap: false });
    await t.frames(120);
    const list = () => t.json("GoscieSala.guests()");
    const noDupSeat = gs => { const k = gs.filter(x => x.seat).map(x => x.seat.join()); return new Set(k).size === k.length; };
    let g = await list();
    t.check("23 gości, wszyscy mają imię", g.length === 23 && g.every(x => x.imie), g.filter(x => !x.imie).map(x => x.id));
    t.check("o 20:00 siedzą (kilku może właśnie wchodzić)", g.filter(x => x.state === "sit").length >= 18, await t.json("GoscieSala.stats()"));
    const seats = await t.json("GoscieSala.seats()");
    console.log("   krzeseł " + seats.length + ", stats " + JSON.stringify(await t.json("GoscieSala.stats()")));
    t.check("krzesła znalezione przy stołach, z przejściem obok", seats.length >= 40 && seats.every(s => s.side && (s.ax !== s.x || s.ay !== s.y)), seats.length);
    const zBoku = seats.filter(s => s.ax !== s.x).length;
    console.log("   wejście z boku: " + zBoku + " z " + seats.length + "; z góry lub dołu: " + JSON.stringify(seats.filter(s => s.ax === s.x).map(s => [s.x, s.y])));
    t.check("na każde krzesło, które ma wolny bok albo ukos, wchodzi się bokiem", seats.filter(s => s.ax === s.x).length <= 4, seats.filter(s => s.ax === s.x).map(s => [s.x, s.y]));
    const clash = await t.json(`(() => { const out = []; for (const s of GoscieSala.seats()) for (const e of $gameMap.eventsXy(s.x, s.y)) { const n = e.event().name; if (e.eventId() < 400 || e.eventId() > 422) out.push([s.x, s.y, n]); } return out; })()`);
    t.check("żadne krzesło na liście nie ma cudzego zdarzenia (gosc_N, miejsce bohatera, Ozzy)", clash.length === 0, clash);
    t.check("każdy siedzący na krześle z listy, dwóch na jednym nigdy", (() => { const k = g.filter(x => x.state === "sit").map(x => x.seat.join()); return new Set(k).size === k.length && g.filter(x => x.state === "sit").every(x => x.x === x.seat[0] && x.y === x.seat[1]); })(), g.map(x => x.seat));
    const draw = await t.json(`(() => { const ss = SceneManager._scene._spriteset, p = Array.from(ss._salaPics.values()); return { n: p.length, vis: p.filter(x => x.sp.visible).length, url: p[0] && p[0].bmp._url, w: p[0] && p[0].bmp.width, h: p[0] && p[0].bmp.height }; })()`);
    t.check("siedzących rysują arkusze Przytulna_Siedzi", draw.vis >= 18 && /Przytulna_Siedzi/.test(draw.url || "") && draw.h >= 176, draw);
    if (process.env.ZRZUTY) await t.shot(process.env.ZRZUTY + "/siedza.png");
    // jedzenie: miska na stole, wiersz jedzenia
    const first = g.find(x => x.state === "sit").id;
    await t.eval(`GoscieSala.force(${first}, "eat"); 0`); await t.frames(20);
    const e1 = await t.json(`(() => { const p = SceneManager._scene._spriteset._salaPics.get(${first}); return { bowl: p.bowl.visible, row: p.sp._frame.y / 88, col: p.sp._frame.x / 88 }; })()`);
    t.check("je: miska na stole, klatki (jedzenia, gdy arkusz je ma)", e1.bowl && e1.col >= 1, e1);
    await t.frames(70);
    await t.eval(`GoscieSala.force(${first}, "drink"); 0`); await t.frames(20);
    const e2 = await t.json(`(() => { const p = SceneManager._scene._spriteset._salaPics.get(${first}); return { bowl: p.bowl.visible, row: p.sp._frame.y / 88, col: p.sp._frame.x / 88 }; })()`);
    t.check("pije: bez miski, klatki picia", !e2.bowl && e2.row < 2 && e2.col >= 1, e2);
    // wstaje, chodzi, wraca i siada
    await t.frames(80);
    await t.eval(`GoscieSala.force(${first}, "rise"); 0`);
    await t.until(`GoscieSala.guests().find(x => x.id === ${first}).state === "walk" || GoscieSala.guests().find(x => x.id === ${first}).state === "stand"`, 8);
    const w0 = (await list()).find(x => x.id === first);
    t.check("wstał: idzie albo już stoi, widać go jako chodzącą postać", ["walk", "stand"].includes(w0.state) && await t.json(`$gameMap.event(${first}).characterName().indexOf("$Npc_") === 0 && !$gameMap.event(${first}).isTransparent()`), w0);
    await t.until(`GoscieSala.guests().find(x => x.id === ${first}).state === "stand"`, 30);
    const w1 = (await list()).find(x => x.id === first);
    t.check("doszedł na miejsce i stoi, nie na ścianie ani krześle", w1.state === "stand" && await t.json(`$gameMap.checkPassage(${w1.x}, ${w1.y}, 0x0f)`), w1);
    if (process.env.ZRZUTY) await t.shot(process.env.ZRZUTY + "/chodzi.png");
    await t.eval(`GoscieSala.force(${first}, "back"); 0`);
    await t.until(`GoscieSala.guests().find(x => x.id === ${first}).state === "sit"`, 40);
    const w2 = (await list()).find(x => x.id === first);
    t.check("wrócił i usiadł na wolnym krześle", w2.state === "sit" && w2.x === w2.seat[0] && w2.y === w2.seat[1], w2);
    // rozmowa: z siedzącym, przez przycisk, kwestie z pliku
    const talkTo = async id => {
        const c = await t.json(`(() => { const s = GoscieSala.seats().find(q => q.by === ${id}); return s; })()`);
        const skos = c.ax !== c.x && c.ay !== c.y, hx = skos ? c.x : c.ax, hy = c.ay;   // (wejście ukośne: bohater staje nad lub pod krzesłem)
        const dir = hx > c.x ? 4 : hx < c.x ? 6 : hy > c.y ? 8 : 2;
        await t.eval(`$gamePlayer.locate(${hx}, ${hy}); $gamePlayer.setDirection(${dir}); 0`); await t.frames(6);
        await t.eval(`Input._currentState.ok = true; 0`); await t.frames(4); await t.eval(`Input._currentState.ok = false; 0`); await t.frames(30);
        return t.json(`({ busy: $gameMessage.isBusy(), run: $gameMap.isEventRunning(), name: $gameMessage.speakerName && $gameMessage.speakerName(), text: $gameMessage.allText && $gameMessage.allText() })`);
    };
    const pick = (await list()).filter(x => x.state === "sit")[3];
    const tk = await talkTo(pick.id);
    t.check("przycisk przy siedzącym: mówi swoim imieniem", tk.busy && tk.name === pick.imie && tk.text.length > 3, { tk, pick });
    if (process.env.ZRZUTY) await t.shot(process.env.ZRZUTY + "/rozmowa.png");
    // do końca: przywitanie, wybór „Co słychać?”, odpowiedź, „Bywaj”
    const adv = async n => { for (let i = 0; i < n; i++) { await t.eval(`Input._currentState.ok = true; 0`); await t.frames(3); await t.eval(`Input._currentState.ok = false; 0`); await t.frames(14); } };
    for (let k = 0; k < 8 && !(await t.json("$gameMessage.isChoice()")); k++) await adv(1);
    const ch = await t.json("$gameMessage.choices()");
    t.check("menu rozmowy: kim, co słychać, rada, bywaj", ch.length === 4 && /Bywaj/.test(ch[3]), ch);
    await t.eval("$gameMessage.onChoice(1); $gameMessage.clear(); 0"); await t.frames(40);
    const ans = await t.json("({ busy: $gameMessage.isBusy(), name: $gameMessage.speakerName(), text: $gameMessage.allText() })");
    t.check("odpowiada na „Co słychać?”", ans.busy && ans.name === pick.imie && ans.text.length > 10, ans);
    for (let k = 0; k < 8 && !(await t.json("$gameMessage.isChoice()")); k++) await adv(1);
    t.check("po odpowiedzi znów menu", await t.json("$gameMessage.isChoice()"));
    await t.eval("$gameMessage.onChoice(3); $gameMessage.clear(); 0"); await t.frames(30);
    for (let k = 0; k < 8 && (await t.json("$gameMap.isEventRunning()")); k++) await adv(1);
    t.check("po „Bywaj” rozmowa się kończy", !(await t.json("$gameMap.isEventRunning()")));
    // rozmowa z idącym: staje, mówi swoim imieniem, potem wraca do swoich spraw
    const wk = (await list()).filter(x => x.state === "sit")[5];
    await t.eval(`GoscieSala.force(${wk.id}, "rise"); 0`);
    await t.until(`["walk", "stand"].includes(GoscieSala.guests().find(x => x.id === ${wk.id}).state)`, 20);
    let wkTalk = null;
    for (let k = 0; k < 12 && !wkTalk; k++) {
        await t.eval(`(() => { const e = $gameMap.event(${wk.id}); for (const [dx, dy, d] of [[0, 1, 8], [0, -1, 2], [1, 0, 4], [-1, 0, 6]]) { const x = e.x + dx, y = e.y + dy; if ($gameMap.checkPassage(x, y, 0x0f) && !$gameMap.eventsXy(x, y).length) { $gamePlayer.locate(x, y); $gamePlayer.setDirection(d); Input._currentState.ok = true; return; } } })(); 0`);
        await t.frames(4); await t.eval(`Input._currentState.ok = false; 0`); await t.frames(20);
        const r = await t.json(`({ busy: $gameMessage.isBusy(), name: $gameMessage.speakerName && $gameMessage.speakerName(), st: GoscieSala.guests().find(x => x.id === ${wk.id}).state })`);
        if (r.busy) wkTalk = r;
    }
    t.check("idący też rozmawia: przycisk przy nim, mówi swoim imieniem", !!wkTalk && wkTalk.name === wk.imie, { wkTalk, wk });
    const whereWk = `[$gameMap.event(${wk.id})._realX, $gameMap.event(${wk.id})._realY]`;
    await t.frames(30);
    const wp0 = await t.json(whereWk); await t.frames(120); const wp1 = await t.json(whereWk);
    t.check("w czasie rozmowy stoi w miejscu", wp0.join() === wp1.join(), [wp0, wp1]);
    for (let k = 0; k < 8 && !(await t.json("$gameMessage.isChoice()")); k++) await adv(1);
    await t.eval("$gameMessage.onChoice(3); $gameMessage.clear(); 0"); await t.frames(30);
    for (let k = 0; k < 8 && (await t.json("$gameMap.isEventRunning()")); k++) await adv(1);
    await t.eval(`GoscieSala.force(${wk.id}, "back"); 0`);
    await t.until(`GoscieSala.guests().find(x => x.id === ${wk.id}).state === "sit"`, 60);
    t.check("po rozmowie idzie dalej i siada", (await list()).find(x => x.id === wk.id).state === "sit", (await list()).find(x => x.id === wk.id));
    // wszyscy mają wszystkie kwestie
    const braki = await t.json(`(() => { const out = []; for (const x of GoscieSala.guests()) { const k = Watki.teksty("goscie_sali").goscie["g" + x.id]; for (const f of ["witaj", "kim", "slychac", "rada"]) if (!k || !k[f] || !k[f].length) out.push(x.id + ":" + f); if (!k || !k.bye) out.push(x.id + ":bye"); } return out; })()`);
    t.check("każdy z 23 ma: przywitanie, kim jest, co słychać, radę, pożegnanie", braki.length === 0, braki);
    // zapis: nic z sali nie idzie do zapisu (także gdy ktoś właśnie idzie), po wczytaniu sala żyje dalej
    const sv = (await list()).filter(x => x.state === "sit")[2];
    await t.eval(`GoscieSala.force(${sv.id}, "rise"); 0`);
    await t.until(`GoscieSala.guests().find(x => x.id === ${sv.id}).state === "walk"`, 20);
    const extra = await t.json(`(() => { const std = new Set(Object.keys(new Game_Event(1, 4))), out = {}; for (let i = 400; i <= 422; i++) for (const k of Object.keys($gameMap.event(i))) if (!std.has(k)) out[k] = typeof $gameMap.event(i)[k]; return out; })()`);
    console.log("   pola zdarzeń gości spoza zwykłego zdarzenia: " + JSON.stringify(extra));
    t.check("zdarzenia gości nie trzymają sprite'ów ani obiektów (poza _p8: zwykły zapas drogi każdego chodzącego, liczby)", Object.entries(extra).every(([k, v]) => k === "_p8" || (v !== "object" && v !== "function")), extra);
    const saved = await t.json(`(() => { try { return JsonEx.stringify(DataManager.makeSaveContents()).length; } catch (e) { return String(e); } })()`);
    t.check("zapis działa, gdy goście żyją i ktoś idzie", typeof saved === "number" && saved > 1000, saved);
    await t.saveTo(3);
    const loaded = await t.loadFrom(3);
    await t.frames(120);
    const afterLoad = await list();
    t.check("po wczytaniu goście są: siedzą albo idą, dwóch na krześle nigdy", loaded && afterLoad.filter(x => x.state === "sit").length >= 15 && noDupSeat(afterLoad), await t.json("GoscieSala.stats()"));
    const lf = afterLoad.find(x => x.state === "sit");
    const lfAt = await t.json(`[$gameMap.event(${lf.id}).x, $gameMap.event(${lf.id}).y]`);
    t.check("po wczytaniu sala rusza prawdziwymi zdarzeniami (siedzący stoi na swoim krześle)", lfAt[0] === lf.seat[0] && lfAt[1] === lf.seat[1], { lfAt, lf });
    await t.eval(`GoscieSala.force(${lf.id}, "rise"); 0`);
    await t.until(`["walk", "stand"].includes(GoscieSala.guests().find(x => x.id === ${lf.id}).state)`, 20);
    await t.frames(60);
    const lfMoved = await t.json(`[$gameMap.event(${lf.id}).x, $gameMap.event(${lf.id}).y]`);
    t.check("po wczytaniu wstaje i idzie (zdarzenie gry naprawdę się rusza)", lfMoved[0] !== lf.seat[0] || lfMoved[1] !== lf.seat[1], lfMoved);
    const tkL = await t.json(`(() => { const s = $gameMap.event(${lf.id}); return !!s && !s.isTransparent(); })()`);
    t.check("po wczytaniu widać go i można go zaczepić", tkL);
    // poza wieczorem pusto; drzwi osiągalne
    await t.eval("GoscieSala.layOut(); 0");
    const door = await t.json("$gameMap.checkPassage(50, 52, 0x0f)");
    t.check("drzwi wejściowe gości to przechodnia kratka", door);
    // koszt
    // wielu naraz: wstają, idą, wracają; nigdy dwóch na jednym krześle, nikt nie stoi na ścianie
    const noDup = gs => { const k = gs.filter(x => x.seat).map(x => x.seat.join()); return new Set(k).size === k.length; };
    await t.setHour(20); await t.eval("GoscieSala.layOut(); 0"); await t.frames(30);   // (zegar biegnie: długi test nie może dojść do ich godziny wyjścia)
    const ids = (await list()).filter(x => x.state === "sit").slice(0, 10).map(x => x.id);
    await t.eval(`${JSON.stringify(ids)}.forEach(i => GoscieSala.force(i, "rise")); 0`);
    let dup = 0, stood = 0;
    const wstali = new Set(), wrocili = new Set();   // (siedząc, po chwili sami znów wstają: każdy ma raz wrócić, nie wszyscy naraz siedzieć)
    for (let k = 0; k < 150; k++) {   // (przez całą salę to do 30 s w jedną stronę)
        await t.frames(60);
        await t.setHour(20);
        const gs = await list();
        if (!noDup(gs)) dup++;
        const st = gs.filter(x => ids.includes(x.id) && x.state === "stand");
        if (st.length) { stood += st.length; await t.eval(`${JSON.stringify(st.map(x => x.id))}.forEach(i => GoscieSala.force(i, "back")); 0`); }
        for (const x of gs) if (ids.includes(x.id)) { if (x.state !== "sit") wstali.add(x.id); else if (wstali.has(x.id)) wrocili.add(x.id); }
        if (ids.every(i => wrocili.has(i))) break;
    }
    const after = await list();
    t.check("dziesięciu wstaje naraz: chodzą i wszyscy wracają na krzesła", stood > 0 && ids.every(i => wrocili.has(i)), { brak: ids.filter(i => !wrocili.has(i)), stan: after.filter(x => ids.includes(x.id)).map(x => [x.id, x.state, x.x, x.y, x.goal]) });
    t.check("nigdy dwóch na jednym krześle", dup === 0 && noDup(after), dup);
    // wieczór: wchodzą od drzwi i siadają
    await t.setHour(16.9); await t.eval("GoscieSala.layOut(); 0"); await t.frames(10);
    t.check("przed wieczorem ich nie ma, a pusta kratka nie zaczyna rozmowy", (await t.json("GoscieSala.stats()")).out === 23 && !(await t.json("$gameMap.event(400).isTransparent() === false")));
    await t.setHour(19.0); await t.frames(30);
    const walkers = (await list()).filter(x => x.state === "walk");
    t.check("o 19 ci, których godzina właśnie mija, idą od drzwi", walkers.length > 0 && walkers.length <= 5, (await list()).map(x => x.state).join());
    if (process.env.ZRZUTY) { await t.eval("$gamePlayer.locate(50, 45); 0"); await t.frames(60); await t.shot(process.env.ZRZUTY + "/wchodza.png"); }
    await t.until(`GoscieSala.stats().walking === 0 && GoscieSala.stats().out < 23`, 60);
    t.check("doszli i siedzą", (await t.json("GoscieSala.stats()")).sit > 5, await t.json("GoscieSala.stats()"));
    // noc: wychodzą drzwiami
    await t.setHour(1.8); await t.frames(30);
    await t.until(`GoscieSala.stats().out === 23`, 200);
    t.check("po północy wszyscy wyszli", (await t.json("GoscieSala.stats()")).out === 23, (await list()).filter(x => x.state !== "out"));
    await t.setHour(20); await t.eval("GoscieSala.layOut(); 0"); await t.frames(30);
    // koszt
    // mieszkaniec przy stole: kowal o 20 siedzi w tej samej warstwie co bohater (bohater za nim), po 22:30 poszedł do domu - nie ma go na krześle
    const kowalPic = `(() => { const k = SceneManager._scene._spriteset._tilemap.children.find(s => s.visible !== false && s.bitmap && /Siedzi_Kowal/.test(s.bitmap.url || "")); return k ? { z: k.z, y: k.y } : null; })()`;
    await t.until(`!!(${kowalPic})`, 20);
    const kw1 = await t.json(kowalPic);
    await t.eval(`$gamePlayer.locate(43, 32); $gamePlayer.setDirection(2); 0`); await t.frames(20);
    const order = await t.json(`(() => { const set = SceneManager._scene._spriteset, kids = set._tilemap.children, pl = set._characterSprites.find(s => s._character === $gamePlayer), k = kids.find(s => s.visible !== false && s.bitmap && /Siedzi_Kowal/.test(s.bitmap.url || "")); return { pl: kids.indexOf(pl), k: kids.indexOf(k) }; })()`);
    t.check("bohater kratkę nad siedzącym jest za nim", kw1 && kw1.z === 3 && order.pl < order.k, { kw1, order });
    await t.setHour(22.7); await t.frames(30);
    await t.until(`$gameMap.event(910).isTransparent()`, 20); await t.frames(10);
    t.check("kowal poszedł do domu: nie ma go na krześle", await t.json(`$gameMap.event(910).isTransparent()`) && !(await t.json(kowalPic)), await t.json(kowalPic));
    const allZ = await t.json(`SceneManager._scene._spriteset._tilemap.children.filter(s => s.visible !== false && s.bitmap && /Przytulna_Siedzi/.test(s.bitmap.url || "")).map(s => s.z)`);
    t.check("każdy widoczny siedzący jest w warstwie postaci", allZ.every(z => z === 3), allZ);
    await t.setHour(20); await t.eval("GoscieSala.layOut(); 0"); await t.frames(30);
    // nikt nie znika: mieszkaniec wstaje i wychodzi drzwiami; przychodzi od drzwi i siada (zegar idzie, bez skoku)
    const kw = `(() => { const e = $gameMap.event(910); return { x: e.x, y: e.y, hid: e.isTransparent(), mv: e.isMoving() }; })()`;
    await t.eval(`$gamePlayer.locate(50, 37); 0`);
    await t.setHour(22.3); await t.frames(30);
    await t.until(`!!(${kowalPic})`, 20);
    t.check("kowal o 22:20 siedzi na swoim krześle", (await t.json(kw)).x === 43 && !(await t.json(kw)).hid, await t.json(kw));
    await t.setHour(22.52);
    let path = [], last = await t.json(kw);
    for (let k = 0; k < 240 && !last.hid; k++) { await t.frames(15); last = await t.json(kw); path.push([last.x, last.y]); }
    const cells = new Set(path.map(c => c.join())).size;
    t.check("o 22:30 wstaje i idzie przez salę (nie znika na krześle)", cells >= 15, path.length + " pomiarów, kratek " + cells);
    t.check("znika dopiero w drzwiach", last.hid && last.y === 54 && last.x >= 49 && last.x <= 51, last);
    await t.setHour(18.85); await t.frames(30);
    t.check("przed jego godziną go nie ma", (await t.json(kw)).hid, await t.json(kw));
    await t.setHour(19.02); await t.frames(4);
    const in0 = await t.json(kw);
    t.check("o 19 wchodzi drzwiami", !in0.hid && in0.y >= 53, in0);
    let sat = false;
    for (let k = 0; k < 240 && !sat; k++) { await t.frames(15); sat = !!(await t.json(kowalPic)); }
    const in1 = await t.json(kw);
    t.check("doszedł i siedzi na swoim krześle", sat && in1.x === 43 && in1.y === 33 && !in1.hid, in1);
    // u siebie w domu tak samo: wchodzi drzwiami (Map105, kowal)
    await t.setHour(22.3);
    await t.go(105, 7, 8, 8); await t.frames(20);
    t.check("kowala nie ma w domu, póki jest w tawernie", (await t.json(kw)).hid, await t.json(kw));
    await t.setHour(22.52); await t.frames(4);
    const h0 = await t.json(kw);
    t.check("o 22:30 wchodzi do domu drzwiami", !h0.hid && h0.x === 7 && h0.y >= 9, h0);
    await t.frames(360);
    const h1 = await t.json(kw), spot = await t.json(`(() => { const d = $dataMap.events.find(e => e && /^Miejsce:\\s*kowal_wnetrze/i.test(e.name)); return [d.x, d.y]; })()`);
    t.check("doszedł na swoje miejsce w domu", h1.x === spot[0] && h1.y === spot[1], { h1, spot });
    await t.go(1, 50, 37, 8); await t.setHour(20); await t.eval("GoscieSala.layOut(); 0"); await t.frames(30);
    // siadanie: na stołek wchodzi swoją normalną postacią i dopiero tam przechodzi w siedzenie; wstaje na stołku i schodzi z niego
    const klatka = id => `(() => { const g = GoscieSala.guests().find(x => x.id === ${id}), set = SceneManager._scene._spriteset, p = set._salaPics && set._salaPics.get(${id}), e = $gameMap.event(${id}); return { st: g.state, x: e.x, y: e.y, seat: g.seat, pic: !!(p && p.sp.visible), row: p ? Math.floor(p.sp._frame.y / 88) : -1, mv: e.isMoving() }; })()`;
    const sampl = async (id, until, n) => { const out = []; for (let k = 0; k < n; k++) { const s = await t.json(klatka(id)); out.push(s); if (s.st === until) break; await t.frames(4); } return out; };
    const sg = (await list()).find(x => x.state === "sit");
    await t.eval(`GoscieSala.force(${sg.id}, "rise"); 0`);
    const up = await sampl(sg.id, "walk", 200);
    const seq = st => up.filter(s => s.st === st);
    t.check("wstaje na stołku: klatki przejścia (wiersze 4-5), bez ruchu", seq("rising").length >= 2 && seq("rising").slice(1).every(s => s.pic && s.row >= 4 && s.x === sg.seat[0] && s.y === sg.seat[1]), up.slice(0, 6));   // (pierwszy pomiar: jeszcze przed rysowaniem klatki)
    t.check("schodzi ze stołka swoją normalną postacią, zdjęcie siedzącego schowane", seq("dismount").length >= 2 && seq("dismount").every(s => !s.pic), seq("dismount").slice(0, 3));
    await t.until(`GoscieSala.guests().find(x => x.id === ${sg.id}).state === "stand"`, 60);
    await t.eval(`GoscieSala.force(${sg.id}, "back"); 0`);
    const down = await sampl(sg.id, "sit", 900);
    const dq = st => down.filter(s => s.st === st);
    t.check("wchodzi na stołek swoją normalną postacią (nie sunie w pozie siedzącej)", dq("mount").length >= 2 && dq("mount").every(s => !s.pic), dq("mount").slice(0, 3));
    t.check("na stołku przechodzi w siedzenie: stoi na krześle, klatki przejścia, potem siedzi", dq("settle").length >= 2 && dq("settle").every(s => s.pic && s.row >= 4 && s.x === s.seat[0] && s.y === s.seat[1]) && down[down.length - 1].st === "sit", dq("settle").slice(0, 3));
    t.check("po siadaniu zwykłe wiersze siedzenia", down[down.length - 1].row < 4, down[down.length - 1]);
    // mieszkaniec tak samo: wstaje, schodzi; przychodzi, wchodzi, siada
    await t.setHour(22.3); await t.frames(30); await t.until(`!!(${kowalPic})`, 20);
    await t.setHour(22.52);
    let resUp = -1; for (let k = 0; k < 40 && resUp < 0; k++) { await t.frames(2); resUp = await t.json(`TownLife.risingT($gameMap.event(910))`); }
    const kr = `(() => { const k = SceneManager._scene._spriteset._tilemap.children.find(s => s.visible !== false && s.bitmap && /Siedzi_Kowal/.test(s.bitmap.url || "")); return k ? Math.floor(k._frame.y / 88) : -1; })()`;
    await t.frames(1);
    const krow = await t.json(kr);
    t.check("mieszkaniec: najpierw wstaje na krześle (klatki przejścia)", resUp >= 0 && krow >= 4, { resUp, krow });
    await t.setHour(20); await t.eval("GoscieSala.layOut(); 0"); await t.frames(30);
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    const own = await t.json(`(() => { const t0 = performance.now(); for (let i = 0; i < 300; i++) GoscieSala.frame(); return (performance.now() - t0) / 300; })()`);
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    console.log("   koszt życia sali na klatkę (CPU 4x): " + own.toFixed(3) + " ms");
    t.check("koszt życia sali na klatkę <= " + FRAME_LIMIT + " ms (CPU 4x)", own <= FRAME_LIMIT, own);
});
