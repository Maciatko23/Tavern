// Talks with busts (SpeechBubbles.js): talking to a character with a bust (Borgar - People3_Tall 4 -> People3_5) brings the busts
// into the bottom corners (the hero left, the other right), the speaker bright, the listener dimmed, the bubble out of the speaker's
// bust, a yellow marker over the speaker on the map, the hero's choices in his bubble by his bust, the XP bar hidden meanwhile; a
// hero line lights his bust; a character without a bust (<Bust:none>, a sheet of our own), a cry and \SPK[-1] keep the old looks;
// a fade-out mid-talk and the end of the talk take the busts away; nothing of it goes into a save; grandpa's talk (Story, Map019)
// with his Stach_Bust when the file is there. After the review (2026-09-27): our own busts are asked for only once the database
// (the encryption) is known; the hero's own choice bubble whole after choices under his words; a line in the usual window ends the
// talk (its choices where RPG Maker puts them); long lines kept as written when they fit between the busts, else one bubble (the
// stage direction on its own line), the last page's bubble as high as its lines; the name plate in full on a short line; the marker
// over the windows and above the bubble or a balloon covering the speaker; a bubble over a head clear of the busts; another speaker
// with a bust comes by a cross-fade in place. Screenshots: docs/postacie/rozmowa_*.png
//   CDP_PORT=9362 node tests/talk_busts_test.js
const { launch, sleep } = require("./cdp.js");
const path = require("path");
const SHOTS = path.join(__dirname, "..", "docs", "postacie");
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 30000))]);
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    const results = [];
    const check = (name, ok, info) => { results.push(!!ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
    const until = async (cond, secs) => { const t0 = Date.now(); while (Date.now() - t0 < secs * 1000) { if (await ev(cond).catch(() => false)) return true; await sleep(200); } return false; };
    const press = async k => { await ev(`Input._currentState.${k} = true; 0`); await frames(3); await ev(`Input._currentState.${k} = false; 0`); await frames(3); };
    const shot = f => b.shot(path.join(SHOTS, f));
    // the state of the talk on the screen (screen px)
    const S = () => J(`(function(){ const s = SceneManager._scene, m = s._messageWindow, L = s._talkBusts, cl = s._choiceListWindow, lx = s._windowLayer.x, ly = s._windowLayer.y;
        const side = p => p.sprite.visible ? (function(){ const r = p.sprite.getBounds(); return { name: p.name, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), k: +p.k.toFixed(2), light: +p.light.toFixed(2), flip: p.sprite.scale.x < 0 }; })() : null;
        const who = m._bubbleOf, head = who ? SpeechBubbles.headOf(who) : null, t = SpeechBubbles.talk(), bs = m._bubbleSprite;
        return { on: t.on, lit: t.lit, side: m._talkSide, who: who === $gamePlayer ? 0 : who ? who.eventId() : null, open: m.isOpen(), opacity: m.opacity, edge: m._bubbleEdge,
            m: { x: m.x + lx, y: m.y + ly, w: m.width, h: m.height }, bubble: !!(bs && bs.visible), head: head && { x: Math.round(head.x + lx), top: Math.round(head.top + ly), foot: Math.round(head.foot + ly) },
            L: side(L._sides.left), R: side(L._sides.right), marker: L._marker.visible ? { x: L._marker.x, y: L._marker.y } : null, xp: s._xpBar.visible,
            cl: cl.isOpen() ? { x: cl.x + lx, y: cl.y + ly, w: cl.width, h: cl.height, own: !!cl._talkOwn, panel: !!(cl._talkBubble && cl._talkBubble.visible), op: cl.opacity } : null,
            text: $gameMessage.allText().slice(0, 40), barks: s._barks.children.filter(c => c.visible).length,
            balloon: (function(){ const bl = who && s._spriteset._balloonSprites.find(o => o.targetObject === who && o.visible); return bl ? Math.round(bl.getBounds().y) : null; })() }; })()`);
    const run = (list, eventId) => ev(`(function(){ $gameMap._interpreter.setup(${JSON.stringify(list)}, ${eventId || 0}); })(); 0`);
    const T = (face, lines, extra) => [{ code: 101, indent: 0, parameters: [face ? face[0] : "", face ? face[1] : 0, 0, 2, ""] }].concat(lines.map(t => ({ code: 401, indent: 0, parameters: [t] }))).concat(extra || []);
    const END = [{ code: 0, indent: 0, parameters: [] }];
    const CH = labels => [{ code: 102, indent: 0, parameters: [labels, labels.length - 1, 0, 2, 0] }].concat(...labels.map((l, i) => [{ code: 402, indent: 0, parameters: [i, l] }, { code: 0, indent: 1, parameters: [] }]), [{ code: 404, indent: 0, parameters: [] }]);
    const finish = async () => { for (let i = 0; i < 30 && (await ev("$gameMessage.isBusy() || $gameMap.isEventRunning() || SceneManager._scene._messageWindow.openness > 0")); i++) { if (await ev("SceneManager._scene._choiceListWindow.active")) await press("escape"); else await press("ok"); await frames(12); } await frames(30); };
    const near = (a, b2, d) => Math.abs(a - b2) <= d;
    const untilPause = async () => { await until("SceneManager._scene._messageWindow.pause", 10); await frames(12); };   // (a paused message takes no key for 10 frames)
    const plateW = name => ev(`(function(){ const b = new Bitmap(8, 8); b.fontFace = $gameSystem.mainFontFace(); b.fontSize = SpeechBubbles.TALK.plate.font; return Math.ceil(b.measureTextWidth(${JSON.stringify(name)})) + SpeechBubbles.TALK.plate.pad * 2; })()`);
    try {
        // the bust files' checks (HEAD requests) noted from the page's start, with whether the database (and so the encryption) was loaded
        await b.send("Page.addScriptToEvaluateOnNewDocument", { source: "window.__probes = []; (function(){ const f = window.fetch; window.fetch = function(u, o) { if (o && o.method === 'HEAD' && /img\\/pictures/.test(String(u))) window.__probes.push({ u: String(u), db: !!window.$dataSystem }); return f.apply(this, arguments); }; })();" });
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        let booted = false;
        for (let i = 0; i < 120 && !booted; i++) { booted = await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false); if (!booted) await sleep(500); }
        check("the game boots", booted);
        const probes = await J("window.__probes");
        check("our own busts (Hero_Bust, Stach_Bust) are asked for only once the database is loaded (whether the images are encrypted is known then)",
            probes.some(p => /Hero_Bust\.png/.test(p.u)) && probes.every(p => p.db), probes);
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(1, 50, 64, 4, 0);   /* (the new tavern: in front of the bar, Borgar across the counter) */ SceneManager.goto(Scene_Map); })()`);
        await until("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===1", 60);
        await sleep(1000);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Survival) Survival.calmWeather(); if (window.Needs) Needs.setEnabled(false); $gameSystem.setDayNightHour(12); $gameSystem._minimapHidden = true; 0");
        await frames(240);   // (the popups of the start fade away)
        // the hero's bust: Hero_Bust (HeroLook's look) - while that file is not made yet, the actor's picture (HeroLook off) stands in
        const heroFile = await ev("fetch('img/pictures/Hero_Bust.png', { method: 'HEAD', cache: 'no-store' }).then(r => r.ok).catch(() => false)");
        const hb = await ev("SpeechBubbles.heroBust()");
        check("the hero's bust: Hero_Bust with HeroLook when the file is there, else none (no request errors)", heroFile ? hb === "Hero_Bust" : hb === null, { heroFile, hb });
        if (!hb) { await ev("HeroLook.setActive(false); 0"); console.log("NOTE Hero_Bust.png is not there yet: the hero's bust in this run is the actor's picture " + (await ev("SpeechBubbles.heroBust()"))); }
        const HERO = await ev("SpeechBubbles.heroBust()");
        const busts = await J("({ borgar: SpeechBubbles.bustOf($gameMap.event(1)), melia: SpeechBubbles.bustOf($gameMap.event(2)), grum: SpeechBubbles.bustOf($gameMap.event(3)), ozzy: SpeechBubbles.bustOf($gameMap.event(4)), brick: SpeechBubbles.bustOf($gameMap.event(9)) })");
        check("busts by the RTP rule: Borgar People3_5, Melia People2_8, Grum Actor2_5, Ozzy People2_1; the loose brick none", busts.borgar === "People3_5" && busts.melia === "People2_8" && busts.grum === "Actor2_5" && busts.ozzy === "People2_1" && busts.brick === null, busts);

        // ---- Borgar speaks: the busts slide in, his is bright, the hero's dimmed; the bubble out of his bust; the marker over him
        await ev(`(function(){ window.__slide = []; const L = SceneManager._scene._talkBusts; const f = () => { const p = L._sides.right; window.__slide.push(p.sprite.visible ? Math.round(p.sprite.x) : null); if (window.__slide.length < 40) requestAnimationFrame(f); }; requestAnimationFrame(f);
            $gamePlayer.setDirection(8); $gameMap.event(1).start(); return 0; })()`);
        await frames(45);
        let s = await S();
        const slide = (await J("window.__slide")).filter(v => v !== null);
        check("talking to Borgar: a talk (his bust on the right, the hero's on the left, the hero's mirrored to look right), the window itself invisible",
            s.on && s.side === "npc" && s.who === 1 && s.opacity === 0 && s.bubble && s.R && s.R.name === "People3_5" && near(s.R.x + s.R.w, 1280, 1) && near(s.R.y + s.R.h, 720, 1) && near(s.R.h, 273, 1) &&
            s.L && s.L.name === HERO && near(s.L.x, 0, 1) && s.L.flip && !s.R.flip, s);
        check("...the busts slid in from the side (~12 frames)", slide.length >= 5 && slide[0] > slide[slide.length - 1] && slide.every((v, i) => i === 0 || v <= slide[i - 1]), slide.slice(0, 16));
        check("...Borgar bright, the hero dimmed (~45%)", s.R.light === 1 && near(s.L.light, 0.45, 0.02) && s.lit === "npc", { R: s.R.light, L: s.L.light });
        check("...the bubble at his bust: its right edge just left of the bust, at the bottom, the tail level with the bubble, clear of the hero's bust",
            s.m.x + s.m.w <= s.R.x && s.m.x + s.m.w >= s.R.x - 20 && s.m.y + s.m.h <= 712 && s.m.y >= 720 - 273 - 40 && s.m.x >= s.L.x + s.L.w, s.m);
        // (his "Atmosfera" event puts a balloon over him now and then: the marker then rises above it - checked on its own below)
        check("...a yellow marker over Borgar's head on the map (above his balloon if he has one); the XP bar hidden", !!s.marker && !!s.head && near(s.marker.x, s.head.x, 2) &&
            s.marker.y <= s.head.top + 6 && s.marker.y >= (s.balloon ? Math.min(s.head.top, s.balloon) : s.head.top) - 64 && !s.xp, { marker: s.marker, head: s.head, balloon: s.balloon, xp: s.xp });
        await shot("rozmowa_1_borgar.png");
        // ---- his question: the choices in the hero's bubble at his bust (the hero lit while he chooses), clear of Borgar's bubble
        for (let i = 0; i < 12 && !(await ev("SceneManager._scene._choiceListWindow.isOpen()")); i++) { await press("ok"); await frames(24); }
        await frames(20);
        s = await S();
        check("his question with choices: the choice list in a bubble of the hero's own, beside the hero's bust, see-through (no window frame)",
            !!s.cl && s.cl.own && s.cl.panel && s.cl.op === 0 && s.cl.x >= s.L.x + s.L.w && s.cl.x <= s.L.x + s.L.w + 20 && s.cl.y + s.cl.h <= 712, { cl: s.cl, L: s.L });
        check("...clear of Borgar's bubble, and the hero's bust lit while he chooses (Borgar's still lit: his question)", s.cl.x + s.cl.w < s.m.x && s.L.light === 1 && s.R.light === 1, { cl: s.cl, m: s.m, L: s.L.light, R: s.R.light });
        await shot("rozmowa_2_wybor.png");
        await finish();
        s = await S();
        check("the end of the talk: the busts and the marker gone, the XP bar back", !s.on && !s.L && !s.R && !s.marker && s.xp, { on: s.on, L: s.L, R: s.R, marker: s.marker, xp: s.xp });

        // ---- the hero speaks to Borgar (\SPK[0] in an event of Borgar's): his bust bright, Borgar's dimmed, the choices under his words
        await run(T(["People3", 4], ["\\SPK[1]Coś jeszcze, młody?"]).concat(T(null, ["\\SPK[0]Tak. Muszę spłacić dług dziadka u Lorda."]), CH(["Weź zmianę", "Sprzedaj towar", "Pogadaj", "Nie teraz"]), END), 1);
        await frames(40);
        await press("ok");
        await frames(50);
        s = await S();
        check("a hero line in the talk: his bubble out of his bust (left), he is lit, Borgar dimmed, no marker (the speaker is the hero)",
            s.on && s.side === "hero" && s.who === 0 && s.m.x >= s.L.x + s.L.w && s.m.x <= s.L.x + s.L.w + 20 && s.L.light === 1 && near(s.R.light, 0.45, 0.02) && !s.marker, s);
        check("...the choices under his words in the same bubble (as wide, no frame of their own; the bubble drawn on under them)", !!s.cl && !s.cl.own && s.cl.panel && s.cl.op === 0 && s.cl.x === s.m.x && s.cl.w === s.m.w && near(s.cl.y, s.m.y + s.m.h - 12, 1), { cl: s.cl, m: s.m });
        await shot("rozmowa_3_bohater.png");
        // the bright/dim swap is a short fade
        await ev(`(function(){ window.__light = []; const L = SceneManager._scene._talkBusts; const f = () => { window.__light.push(+L._sides.left.light.toFixed(2)); if (window.__light.length < 20) requestAnimationFrame(f); }; requestAnimationFrame(f); return 0; })()`);
        await press("escape");
        await frames(30);
        const lights = await J("window.__light");
        check("...after the choice the hero's bust fades back to dim (steps between)", lights.some(v => v > 0.46 && v < 0.99), lights);
        await finish();
        // ---- Borgar's question after those choices under the hero's words: the hero's own choice bubble whole (not a corner of it)
        await run(T(["People3", 4], ["\\SPK[1]To co wybierasz?"]).concat(CH(["Piwo", "Wino", "Nic"]), END), 1);
        for (let i = 0; i < 12 && !(await ev("SceneManager._scene._choiceListWindow.isOpen()")); i++) { await press("ok"); await frames(24); }
        await frames(20);
        const own = await J(`(function(){ const cl = SceneManager._scene._choiceListWindow, tb = cl._talkBubble; return { own: !!cl._talkOwn, vis: tb.visible, frame: [tb._frame.x, tb._frame.y, tb._frame.width, tb._frame.height], bmp: [tb.bitmap.width, tb.bitmap.height], at: [tb.x, tb.y] }; })()`);
        check("his question after the hero's choices: the hero's choice bubble drawn whole (its frame the whole picture, from 0,0)",
            own.own && own.vis && own.frame[0] === 0 && own.frame[1] === 0 && own.frame[2] === own.bmp[0] && own.frame[3] === own.bmp[1] && own.at[1] < 0, own);
        await shot("rozmowa_10_wybor_po_wyborach.png");
        await finish();

        // ---- a line in the usual window in the middle of a talk (the speaker nowhere to be seen): the talk ends, its choices where
        // RPG Maker puts them (not in a bubble of the hero's over the window)
        await run(T(["People3", 4], ["\\SPK[1]Słuchaj."]).concat(T(["People2", 7], ["\\SPK[99]Ktoś woła zza drzwi."]), CH(["Tak", "Nie"]), END), 1);
        await frames(40);
        await press("ok");
        for (let i = 0; i < 12 && !(await ev("SceneManager._scene._choiceListWindow.isOpen()")); i++) { await press("ok"); await frames(24); }
        await frames(30);
        s = await S();
        check("a line in the usual window mid-talk: the talk over (the busts gone), the window at the bottom, its choices of RPG Maker's own above it",
            !s.on && !s.L && !s.R && s.who === null && s.m.w >= 800 && !!s.cl && !s.cl.own && !s.cl.panel && s.cl.op > 0 && s.cl.y + s.cl.h <= s.m.y + 1, s);
        await shot("rozmowa_11_zwykle_okno_w_rozmowie.png");
        await finish();

        // ---- the lines as written when they fit between the busts; else one bubble, the stage direction on its own line
        await ev("[1, 2, 3, 4].forEach(i => { $gameMap.event(i)._moveType = 0; }); $gameMap.event(1).locate(4, 2); $gamePlayer.locate(4, 3); $gamePlayer.setDirection(8); 0");
        const castle = ["*Borgar nagle poważnieje i unika Twojego wzroku*", "...Zamek? Nie wiem, o czym mówisz. To tylko piwnica.", "Wiesz co... starzy w rodzinie zawsze mówili: nie pytaj o to, czego naprawdę nie chcesz wiedzieć.", "Może... może lepiej zostawmy to. Napij się czegoś."];
        const hist = ["Ta tawerna stoi tu od pokoleń, jeszcze od czasów mojego pradziadka.", "Podobno kamienie w piwnicy są starsze niż sama tawerna...", "Ale to pewnie tylko gadanie starych kumpli przy piwie."];
        await run(T(["People3", 4], castle).concat(T(["People3", 4], hist), END), 1);
        await untilPause();
        s = await S();
        const lines = await J("$gameMessage._texts");
        const inBox = await ev("SceneManager._scene._messageWindow.contents.height >= SceneManager._scene._messageWindow.lineHeight() * $gameMessage._texts.length");
        check("Borgar's answer about the castle (one line of it too long): one bubble of at most 4 lines, the stage direction on its own line, between the busts",
            lines.length <= 4 && lines[0] === castle[0] && inBox && s.m.x >= s.L.x + s.L.w && s.m.x + s.m.w <= s.R.x, { lines, m: s.m });
        await shot("rozmowa_6_zamek.png");
        await press("ok");
        await untilPause();
        check("...his history of the tavern: the three lines as written (each fits between the busts)", JSON.stringify(await J("$gameMessage._texts")) === JSON.stringify(hist), await J("$gameMessage._texts"));
        await finish();
        // (longer than one bubble even so: the last page's bubble as high as its own lines)
        const tale = ["Raz, dawno temu, kiedy jeszcze byłem młody i głupi, poszedłem w góry na wschodzie, żeby znaleźć skarb, o którym mówił mój dziadek przy każdym piwie.", "Szedłem trzy dni i trzy noce, aż doszedłem do jaskini, z której wychodził dym, choć nikt tam nie palił ognia.", "Wszedłem do środka, a tam... sam nie wiem, co to było. Coś wielkiego, co oddychało w ciemności i patrzyło na mnie.", "Uciekłem. Nigdy tam nie wróciłem."];
        await run(T(["People3", 4], tale).concat(END), 1);
        await untilPause();
        const page1 = (await S()).m;
        await press("ok");
        await untilPause();
        const page2 = (await S()).m, left = await ev("$gameMessage._texts.length - 4");
        check("...a tale longer than one bubble: full pages, the last page's bubble only as high as its " + left + " line(s)",
            left > 0 && left < 4 && page2.h < page1.h && page2.h === left * 36 + 24, { page1, page2, left });
        await shot("rozmowa_12_ostatnia_strona.png");
        await finish();

        // ---- a short line: the name plate in full (the bubble at least as wide as it)
        await run(T(["People2", 7], ["\\SPK[2]Hej."]).concat(END), 2);
        await frames(40);
        s = await S();
        const pw = await plateW("Melia Srebrogłosa");
        check("Melia's short \"Hej.\": the bubble wide enough for her whole name plate", s.side === "npc" && s.m.w >= pw + 2 * 14, { m: s.m, plate: pw });
        await shot("rozmowa_13_krotka_kwestia.png");
        await finish();

        // ---- the marker: over the windows; above the bubble when the speaker stands behind it
        await ev("$gameMap.event(4).locate(8, 8); $gameMap.event(4).setDirection(2); 0");   // (the big tavern at zoom 1.5: where (11,11) stood on the old 17x13 map)
        await frames(10);
        await run(T(["People2", 0], ["\\SPK[4]*czkawka* ...i wtedy mówię do niej: to nie ja zjadłem tę kozę!", "Ehh, młodzi już nie potrafią pić jak za moich czasów...", "Karczmarz! Jeszcze jedno...", "no dobra, zapłacę. Chyba."]).concat(END), 4);
        await frames(50);
        s = await S();
        const layer = await J("(function(){ const sc = SceneManager._scene; return { marker: sc.children.indexOf(sc._talkBusts._marker), windows: sc.children.indexOf(sc._windowLayer) }; })()");
        check("Ozzy talking from behind his own bubble: the marker at his x, just above the bubble's top edge, over the windows",
            !!s.marker && !!s.head && s.head.top > s.m.y && near(s.marker.x, s.head.x, 2) && s.marker.y <= s.m.y && s.marker.y >= s.m.y - 10 && layer.marker > layer.windows, { marker: s.marker, head: s.head, m: s.m, layer });
        await shot("rozmowa_7_znacznik_nad_dymkiem.png");
        await finish();
        // ...and above a balloon icon over the speaker (RPG Maker's drop, note, zzz)
        await run(T(["People3", 4], ["\\SPK[1]Hmm, słyszałeś to?"]).concat(END), 1);
        await frames(30);
        await ev("$gameTemp.requestBalloon($gameMap.event(1), 1); 0");
        await frames(24);
        s = await S();
        const bal = await J("(function(){ const b = SceneManager._scene._spriteset._balloonSprites.find(b => b.targetObject === $gameMap.event(1)); if (!b) return null; const r = b.getBounds(); return { x: Math.round(r.x), y: Math.round(r.y), w: r.width, h: r.height }; })()");
        check("...a balloon over the speaker: the marker above it, not in it", !!bal && !!s.marker && s.marker.y <= bal.y + 1 && near(s.marker.x, s.head.x, 2), { marker: s.marker, balloon: bal, head: s.head });
        await finish();

        // ---- someone without a bust speaking in a talk, by the right bust: the bubble over his head clear of it
        await ev(`(function(){ const oz = $gameMap.event(4); oz.page().list.unshift({ code: 108, indent: 0, parameters: ["<Bust:none>"] }); oz.locate(10, 6); oz.setDirection(2); return 0; })()`);   // (old map: 15,10)
        await frames(10);
        await run(T(["People3", 4], ["\\SPK[1]Słyszałeś? Stary Ozzy znowu coś gada."]).concat(T(["People2", 0], ["\\SPK[4]*czkawka* Wszystko słyszę, Borgar!"]), T(["People3", 4], ["\\SPK[1]No i dobrze."]), END), 1);
        await untilPause();
        await press("ok");
        await untilPause();
        s = await S();
        check("Ozzy (no bust) in Borgar's talk, by Borgar's bust: his bubble over his head, clear of the bust (both busts dimmed)",
            s.on && s.who === 4 && !s.side && s.bubble && !!s.R && s.m.x + s.m.w <= s.R.x && s.m.x >= s.L.x + s.L.w && near(s.R.light, 0.45, 0.02), { m: s.m, R: s.R, edge: s.edge });
        await shot("rozmowa_8_bez_popiersia_w_rozmowie.png");
        await finish();
        await ev("$gameMap.event(4).page().list.shift(); 0");

        // ---- another speaker with a bust (Melia, then Grum): a short cross-fade where the bust stands (the tail always at a face)
        await run(T(["People2", 7], ["\\SPK[2]Grum, powiedz mu, co widziałeś w górach."]).concat(T(["Actor2", 4], ["\\SPK[3]Dym nad jaskiniami. Trzy noce z rzędu."]), END), 2);
        await untilPause();
        // (the game held and stepped a frame at a time: each frame noted, the screenshot half-way through the cross-fade)
        await ev(`(function(){ const R = window.__R = { hold: true, steps: 0, rec: [], um: SceneManager.updateMain }; SceneManager.updateMain = function() { if (R.hold && R.steps <= 0) return; R.steps--; R.um.call(this);
            const p = SceneManager._scene._talkBusts._sides.right; if (R.rec.length < 60) R.rec.push({ n: p.name, k: +p.k.toFixed(2), op: p.sprite.visible ? p.sprite.opacity : 0, g: p.ghost.visible ? p.ghost.opacity : 0, x: Math.round(p.sprite.x) }); };
            Input._currentState.ok = true; return 0; })()`);
        const step = () => ev(`new Promise(res => { __R.steps = 1; const iv = setInterval(() => { if (__R.steps <= 0) { clearInterval(iv); requestAnimationFrame(() => requestAnimationFrame(() => res(0))); } }, 4); })`);
        for (let i = 0; i < 20; i++) {
            await step();
            if (i === 2) await ev("Input._currentState.ok = false; 0");
            if (await ev("(function(){ const p = SceneManager._scene._talkBusts._sides.right; return p.ghost.visible && p.sprite.opacity >= 96; })()")) break;
        }
        await shot("rozmowa_9_zmiana_mowcy.png");   // (half-way through the cross-fade)
        await ev("Input._currentState.ok = false; __R.hold = false; 0");
        await frames(40);
        await ev("SceneManager.updateMain = __R.um; 0");
        const sw = await J("__R.rec"), at = sw.findIndex(r => r.n === "Actor2_5"), after = at < 0 ? [] : sw.slice(at);
        check("Melia -> Grum: Grum's bust fades in where hers stood while hers fades out (never slid away: a face there every frame), full within ~10 frames",
            at > 0 && sw[at - 1].n === "People2_8" && sw[at - 1].k === 1 && after.every(r => r.k === 1 && r.op + r.g >= 200) && after.length > 12 && after[10].op === 255 && after[10].g === 0, sw.slice(Math.max(0, at - 2), at + 12));
        await finish();

        // ---- characters without a bust: the old bubble over the head
        await ev(`(function(){ $gameMap.event(2).page().list.unshift({ code: 108, indent: 0, parameters: ["<Bust:none>"] }); $gameMap.event(2).locate(7, 5); $gameMap.event(2).setDirection(2); return 0; })()`);   // (on the screen: her stage is far away on the big map)
        check("<Bust:none> in a comment on the event's page: Melia has no bust", (await ev("SpeechBubbles.bustOf($gameMap.event(2))")) === null);
        await run(T(["People2", 7], ["\\SPK[2]Nie mam dziś ochoty na pogawędki."]).concat(END), 2);
        await frames(40);
        s = await S();
        check("...her words in a bubble over her head (not a talk; no busts)", !s.on && !s.side && s.who === 2 && s.bubble && ["bottom", "left", "right", "top"].includes(s.edge) && !s.L && !s.R, s);
        await shot("rozmowa_4_bez_popiersia.png");
        await finish();
        await ev(`(function(){ $gameMap.event(2).page().list.shift(); $gameMap.event(4).setImage("$Reid_Poor", 0); return 0; })()`);
        await run(T(null, ["\\SPK[4]Ja tu tylko sprzątam."]).concat(END), 4);
        await frames(40);
        s = await S();
        check("a sheet of our own with no bust in the table ($Reid_Poor): a bubble over the head", !s.on && s.who === 4 && s.bubble && !s.L && !s.R, s);
        await finish();
        await ev(`$gameMap.event(4).setImage("People2_Tall", 0); 0`);

        // ---- a cry: over the head, no busts
        await ev(`SpeechBubbles.say($gamePlayer, "Idzie burza..."); 0`);
        await frames(20);
        s = await S();
        check("a cry (SpeechBubbles.say): a small bubble over the hero, no talk, no busts", s.barks === 1 && !s.on && !s.L && !s.R, { barks: s.barks, on: s.on });
        await frames(280);

        // ---- the hero alone (no partner with a bust): over his head
        await run(T(null, ["Hmm... trzeba się napić."]).concat(END), 0);
        await frames(40);
        s = await S();
        check("the hero's thought outside a talk: a bubble over his head, no busts", !s.on && s.who === 0 && s.bubble && !s.side && !s.L && !s.R, s);
        await finish();

        // ---- \SPK[-1]: the usual window - also in the middle of a talk (the busts go)
        await run(T(["People3", 4], ["\\SPK[1]Słuchaj uważnie."]).concat(T(["People3", 4], ["\\SPK[-1]Zwykłe okno na dole ekranu."]), END), 1);
        await frames(40);
        const before = await S();
        await press("ok");
        await frames(40);
        s = await S();
        check("\\SPK[-1] after Borgar's line: the usual window at the bottom (its own size), the busts gone", before.on && before.R && s.open && s.who === null && !s.bubble && s.m.w >= 800 && s.opacity > 0 && !s.on && !s.L && !s.R, { before: { on: before.on, R: !!before.R }, now: s });
        await finish();

        // ---- a fade-out mid-talk: the busts go with it; after the fade-in his next line brings them back
        await run(T(["People3", 4], ["\\SPK[1]Zaraz zgaszę światło."]).concat([{ code: 221, indent: 0, parameters: [] }, { code: 230, indent: 0, parameters: [30] }], (() => { const t = T(["People3", 4], ["\\SPK[1]No, już jasno."]); t.unshift({ code: 222, indent: 0, parameters: [] }); return t; })(), END), 1);
        await frames(40);
        await press("ok");
        await frames(40);
        const dark = await S();
        await until("$gameMessage.isBusy()", 10);
        await frames(40);
        s = await S();
        check("a fade-out mid-talk: the busts go with the light; the next line after the fade-in brings them back", !dark.on && !dark.L && !dark.R && s.on && !!s.R && !!s.L, { dark: { on: dark.on, L: !!dark.L, R: !!dark.R }, after: { on: s.on, L: !!s.L, R: !!s.R } });
        // ---- a save in the middle of a talk: nothing of the talk in it
        const save = await ev("JsonEx.stringify(DataManager.makeSaveContents())");
        check("a save made mid-talk holds nothing of the busts or the talk", !/People3_5|Hero_Bust|Stach_Bust|_talkSide|_bubbleOf|_choiceSlot/.test(save), save.length);
        await finish();

        // ---- a new story game: grandpa's talk in his house (Map019), his bust Stach_Bust when the file is there
        const stachFile = await ev("fetch('img/pictures/Stach_Bust.png', { method: 'HEAD', cache: 'no-store' }).then(r => r.ok).catch(() => false)");
        await ev("(function(){ SceneManager.goto(Scene_Title); return 0; })()");
        await until("SceneManager._scene instanceof Scene_Title && SceneManager._scene._started && !SceneManager.isSceneChanging()", 30);
        await ev("(function(){ DataManager.setupNewGame(); SceneManager.goto(Scene_Map); return 0; })()");
        await until("SceneManager._scene instanceof Scene_Map && SceneManager._scene._started && !SceneManager.isSceneChanging() && $gameMap.mapId() === 19", 40);
        await ev(`(function(){ if (window.Needs) Needs.setEnabled(false); if (window.Survival) Survival.calmWeather(); $gameSystem._minimapHidden = true;${hb ? "" : " HeroLook.setActive(false);"} return 0; })()`);
        const intro = await until("$gameMessage.isBusy() && SceneManager._scene._messageWindow.isOpen()", 30);
        await frames(50);
        s = await S();
        const gb = await ev("SpeechBubbles.bustOf($gameMap.event(901))");
        check("grandpa's talk (Story, event 901): " + (stachFile ? "his bust Stach_Bust on the right, bright, the bubble out of it" : "Stach_Bust.png not there yet - his words over his head"),
            intro && s.who === 901 && (stachFile ? gb === "Stach_Bust" && s.on && s.side === "npc" && s.R && s.R.name === "Stach_Bust" && s.R.light === 1 : gb === null && !s.side && s.bubble), { stachFile, gb, s });
        await shot("rozmowa_5_dziadek.png");
        await ev("Story.skipIntro(); 0");
        await finish();
        s = await S();
        check("...the talk cut short (Story.skipIntro): no busts left", !s.on && !s.L && !s.R, { on: s.on, L: !!s.L, R: !!s.R });
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    check("no errors in the console", !err.length, err.slice(-6));
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
