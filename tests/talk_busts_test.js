// Talks with busts (SpeechBubbles.js): talking to a character with a bust (Borgar - People3_Tall 4 -> People3_5) brings the busts
// into the bottom corners (the hero's in SpeechBubbles.HERO_SIDE - the parameter heroSide, right by default - the other's across,
// each looking into the screen), the speaker bright, the listener dimmed, the bubble out of the speaker's
// bust, a yellow marker over the speaker on the map, the hero's choices in his bubble by his bust, the XP bar hidden meanwhile; a
// hero line lights his bust; a character without a bust (<Bust:none>, a sheet of our own), a cry and \SPK[-1] keep the old looks;
// a fade-out mid-talk and the end of the talk take the busts away; nothing of it goes into a save; grandpa's talk (Story, Map019)
// with his Stach_Bust when the file is there. After the review (2026-09-27): our own busts are asked for only once the database
// (the encryption) is known; the hero's own choice bubble whole after choices under his words; a line in the usual window ends the
// talk (its choices where RPG Maker puts them); long lines kept as written when they fit between the busts, else one bubble (the
// stage direction on its own line), the last page's bubble as high as its lines; the name plate in full on a short line; the marker
// over the windows and above the bubble or a balloon covering the speaker; a bubble over a head clear of the busts; another speaker
// with a bust comes by a cross-fade in place. Screenshots: docs/postacie/rozmowa_*.png
// The side checks read the sides from SpeechBubbles.HERO_SIDE / NPC_SIDE, so they hold for either heroSide. The plugin reads
// heroSide once, when it loads (it cannot be switched in a running game): TALK_HERO_SIDE=left (or right) runs the whole test with
// the parameter set so in the page before the plugins load (js/plugins.js untouched); the screenshots then go to the system's
// temp folder (talk_busts_left/), not to docs/.
//   CDP_PORT=9362 node tests/talk_busts_test.js          (or: node tests/run.js talk_busts_test --port 9410)
const kit = require("./lib/kit.js");
const os = require("os");
const path = require("path");
const FORCE = /^(left|right)$/.test(process.env.TALK_HERO_SIDE || "") ? process.env.TALK_HERO_SIDE : null;
const SHOTS = FORCE ? path.join(os.tmpdir(), "talk_busts_" + FORCE) : path.join(__dirname, "..", "docs", "postacie");
const { text: T, choice: CH, end: END } = kit.cmd;

// the bust files' checks (HEAD requests) noted from the page's start, with whether the database (and so the encryption) was loaded
const PROBES = "window.__probes = []; (function(){ const f = window.fetch; window.fetch = function(u, o) { if (o && o.method === 'HEAD' && /img\\/pictures/.test(String(u))) window.__probes.push({ u: String(u), db: !!window.$dataSystem }); return f.apply(this, arguments); }; })();";
// (TALK_HERO_SIDE: js/plugins.js's `var $plugins = [...]` goes through this setter, which gives SpeechBubbles its heroSide)
const HERO_SIDE_PARAM = !FORCE ? "" : `(function(){ let list; Object.defineProperty(window, "$plugins", { configurable: true, get: () => list, set: v => { list = v;
    (v || []).forEach(p => { if (p && p.name === "SpeechBubbles") p.parameters = Object.assign({}, p.parameters, { heroSide: ${JSON.stringify(FORCE)} }); }); } }); })();`;

kit.test({ beforeLoad: PROBES + HERO_SIDE_PARAM, bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    const shot = f => t.shot(path.join(SHOTS, f));
    // the sides: the hero's bust on HS, the other's on NS (an older plugin without them: the hero left, the other right)
    const sides = await t.json("({ hero: (window.SpeechBubbles && SpeechBubbles.HERO_SIDE) || 'left', npc: (window.SpeechBubbles && SpeechBubbles.NPC_SIDE) || 'right' })");
    const HS = sides.hero, NS = sides.npc;
    console.log("NOTE the sides in this run: the hero's bust " + HS + ", the other's " + NS + (FORCE ? " (heroSide set to " + FORCE + " by TALK_HERO_SIDE)" : ""));
    if (FORCE) t.check("TALK_HERO_SIDE=" + FORCE + ": the plugin took heroSide " + FORCE + " (the hero's bust " + FORCE + ", the other's across)", HS === FORCE && NS !== HS, sides);
    // the state of the talk on the screen (screen px); L / R the busts in the left / right corner, H / N the hero's / the other's
    const S0 = () => t.json(`(function(){ const s = SceneManager._scene, m = s._messageWindow, L = s._talkBusts, cl = s._choiceListWindow, lx = s._windowLayer.x, ly = s._windowLayer.y;
        const side = p => p.sprite.visible ? (function(){ const r = p.sprite.getBounds(); return { name: p.name, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), k: +p.k.toFixed(2), light: +p.light.toFixed(2), flip: p.sprite.scale.x < 0,
            fr: !!(SpeechBubbles.FACES_RIGHT && SpeechBubbles.FACES_RIGHT.has(p.name)) }; })() : null;
        const who = m._bubbleOf, head = who ? SpeechBubbles.headOf(who) : null, t = SpeechBubbles.talk(), bs = m._bubbleSprite;
        return { on: t.on, lit: t.lit, side: m._talkSide, who: who === $gamePlayer ? 0 : who ? who.eventId() : null, open: m.isOpen(), opacity: m.opacity, edge: m._bubbleEdge,
            m: { x: m.x + lx, y: m.y + ly, w: m.width, h: m.height }, bubble: !!(bs && bs.visible), head: head && { x: Math.round(head.x + lx), top: Math.round(head.top + ly), foot: Math.round(head.foot + ly) },
            L: side(L._sides.left), R: side(L._sides.right), marker: L._marker.visible ? { x: L._marker.x, y: L._marker.y } : null, xp: s._xpBar.visible,
            cl: cl.isOpen() ? { x: cl.x + lx, y: cl.y + ly, w: cl.width, h: cl.height, own: !!cl._talkOwn, panel: !!(cl._talkBubble && cl._talkBubble.visible), op: cl.opacity } : null,
            text: $gameMessage.allText().slice(0, 40), barks: s._barks.children.filter(c => c.visible).length,
            balloon: (function(){ const bl = who && s._spriteset._balloonSprites.find(o => o.targetObject === who && o.visible); return bl ? Math.round(bl.getBounds().y) : null; })() }; })()`);
    const S = async () => { const s = await S0(); s.H = HS === "left" ? s.L : s.R; s.N = NS === "left" ? s.L : s.R; return s; };
    const finish = async () => { await t.finish(30); await t.frames(30); };
    const near = (a, b2, d) => Math.abs(a - b2) <= d;
    // the sides' geometry (screen px): a bust in its bottom corner, flush with the screen's side; a panel (x, w) right beside a bust's
    // inner edge (the one towards the middle; within gap px, not over it); a panel clear of a bust; a bust looking into the screen
    // (the RTP busts face left: the one on the left mirrored to look right, the one on the right not)
    const inCorner = (b, side) => (side === "left" ? near(b.x, 0, 1) : near(b.x + b.w, 1280, 1));
    const byBust = (r, b, side, gap = 20) => (side === "left" ? r.x >= b.x + b.w && r.x <= b.x + b.w + gap : r.x + r.w <= b.x && r.x + r.w >= b.x - gap);
    const clearOf = (r, b, side) => (side === "left" ? r.x >= b.x + b.w : r.x + r.w <= b.x);
    const looksIn = (b, side) => b.flip === ((side === "left") !== b.fr);
    const untilPause = async () => { await t.until("SceneManager._scene._messageWindow.pause", 10); await t.frames(12); };   // (a paused message takes no key for 10 frames)
    const plateW = name => t.eval(`(function(){ const b = new Bitmap(8, 8); b.fontFace = $gameSystem.mainFontFace(); b.fontSize = SpeechBubbles.TALK.plate.font; return Math.ceil(b.measureTextWidth(${JSON.stringify(name)})) + SpeechBubbles.TALK.plate.pad * 2; })()`);

    const probes = await t.json("window.__probes");
    t.check("our own busts (Hero_Bust, Stach_Bust) are asked for only once the database is loaded (whether the images are encrypted is known then)",
        probes.some(p => /Hero_Bust\.png/.test(p.u)) && probes.every(p => p.db), probes);
    // (the new tavern: in front of the bar, Borgar across the counter)
    await t.newGame({ map: 1, x: 50, y: 64, dir: 4, hour: 12, minimap: false });
    await t.frames(240);   // (the popups of the start fade away)
    // the hero's bust: Hero_Bust (HeroLook's look) - while that file is not made yet, the actor's picture (HeroLook off) stands in
    const heroFile = await t.eval("fetch('img/pictures/Hero_Bust.png', { method: 'HEAD', cache: 'no-store' }).then(r => r.ok).catch(() => false)");
    const hb = await t.eval("SpeechBubbles.heroBust()");
    t.check("the hero's bust: Hero_Bust with HeroLook when the file is there, else none (no request errors)", heroFile ? hb === "Hero_Bust" : hb === null, { heroFile, hb });
    if (!hb) { await t.eval("HeroLook.setActive(false); 0"); console.log("NOTE Hero_Bust.png is not there yet: the hero's bust in this run is the actor's picture " + (await t.eval("SpeechBubbles.heroBust()"))); }
    const HERO = await t.eval("SpeechBubbles.heroBust()");
    const busts = await t.json("({ borgar: SpeechBubbles.bustOf($gameMap.event(1)), melia: SpeechBubbles.bustOf($gameMap.event(2)), grum: SpeechBubbles.bustOf($gameMap.event(3)), ozzy: SpeechBubbles.bustOf($gameMap.event(4)), brick: SpeechBubbles.bustOf($gameMap.event(9)) })");
    t.check("busts by the RTP rule: Borgar People3_5, Melia People2_8, Grum Actor2_5, Ozzy People2_1; the loose brick none", busts.borgar === "People3_5" && busts.melia === "People2_8" && busts.grum === "Actor2_5" && busts.ozzy === "People2_1" && busts.brick === null, busts);

    // ---- Borgar speaks: the busts slide in, his is bright, the hero's dimmed; the bubble out of his bust; the marker over him
    await t.eval(`(function(){ window.__slide = []; const L = SceneManager._scene._talkBusts; const f = () => { const p = L._sides[${JSON.stringify(NS)}]; window.__slide.push(p.sprite.visible ? Math.round(p.sprite.x) : null); if (window.__slide.length < 40) requestAnimationFrame(f); }; requestAnimationFrame(f);
        $gamePlayer.setDirection(8); $gameMap.event(1).start(); return 0; })()`);
    await t.frames(45);
    let s = await S();
    const slide = (await t.json("window.__slide")).filter(v => v !== null);
    t.check(`talking to Borgar: a talk (his bust on the ${NS}, the hero's on the ${HS}, the one on the left mirrored to look right), the window itself invisible`,
        s.on && s.side === "npc" && s.who === 1 && s.opacity === 0 && s.bubble && s.N && s.N.name === "People3_5" && inCorner(s.N, NS) && near(s.N.y + s.N.h, 720, 1) && near(s.N.h, 273, 1) &&
        s.H && s.H.name === HERO && inCorner(s.H, HS) && looksIn(s.H, HS) && looksIn(s.N, NS), s);
    // (in from the screen's side: on the right the x falls, on the left it grows)
    const inward = (a, b2) => (NS === "left" ? b2 >= a : b2 <= a);
    t.check("...the busts slid in from the side (~12 frames)", slide.length >= 5 && slide[0] !== slide[slide.length - 1] && inward(slide[0], slide[slide.length - 1]) && slide.every((v, i) => i === 0 || inward(slide[i - 1], v)), slide.slice(0, 16));
    t.check("...Borgar bright, the hero dimmed (~45%)", s.N.light === 1 && near(s.H.light, 0.45, 0.02) && s.lit === "npc", { N: s.N.light, H: s.H.light });
    t.check(`...the bubble at his bust: its ${NS === "right" ? "right edge just left" : "left edge just right"} of the bust, at the bottom, the tail level with the bubble, clear of the hero's bust`,
        byBust(s.m, s.N, NS) && s.m.y + s.m.h <= 712 && s.m.y >= 720 - 273 - 40 && clearOf(s.m, s.H, HS), s.m);
    // (his "Atmosfera" event puts a balloon over him now and then: the marker then rises above it - checked on its own below)
    t.check("...a yellow marker over Borgar's head on the map (above his balloon if he has one); the XP bar hidden", !!s.marker && !!s.head && near(s.marker.x, s.head.x, 2) &&
        s.marker.y <= s.head.top + 6 && s.marker.y >= (s.balloon ? Math.min(s.head.top, s.balloon) : s.head.top) - 64 && !s.xp, { marker: s.marker, head: s.head, balloon: s.balloon, xp: s.xp });
    await shot("rozmowa_1_borgar.png");
    // ---- his question: the choices in the hero's bubble at his bust (the hero lit while he chooses), clear of Borgar's bubble
    for (let i = 0; i < 12 && !(await t.eval("SceneManager._scene._choiceListWindow.isOpen()")); i++) { await t.press("ok"); await t.frames(24); }
    await t.frames(20);
    s = await S();
    t.check("his question with choices: the choice list in a bubble of the hero's own, beside the hero's bust, see-through (no window frame)",
        !!s.cl && s.cl.own && s.cl.panel && s.cl.op === 0 && byBust(s.cl, s.H, HS) && s.cl.y + s.cl.h <= 712, { cl: s.cl, H: s.H });
    // (the hero's choices between his bust and Borgar's bubble: left of it with the hero on the left, right of it with him on the right)
    t.check("...clear of Borgar's bubble, and the hero's bust lit while he chooses (Borgar's still lit: his question)", (HS === "left" ? s.cl.x + s.cl.w < s.m.x : s.cl.x > s.m.x + s.m.w) && s.H.light === 1 && s.N.light === 1,
        { cl: s.cl, m: s.m, H: s.H.light, N: s.N.light });
    await shot("rozmowa_2_wybor.png");
    await finish();
    s = await S();
    t.check("the end of the talk: the busts and the marker gone, the XP bar back", !s.on && !s.L && !s.R && !s.marker && s.xp, { on: s.on, L: s.L, R: s.R, marker: s.marker, xp: s.xp });

    // ---- the hero speaks to Borgar (\SPK[0] in an event of Borgar's): his bust bright, Borgar's dimmed, the choices under his words
    await t.run(T(["People3", 4], ["\\SPK[1]Coś jeszcze, młody?"]).concat(T(null, ["\\SPK[0]Tak. Muszę spłacić dług dziadka u Lorda."]), CH(["Weź zmianę", "Sprzedaj towar", "Pogadaj", "Nie teraz"]), END()), 1);
    await t.frames(40);
    await t.press("ok");
    await t.frames(50);
    s = await S();
    t.check(`a hero line in the talk: his bubble out of his bust (${HS}), he is lit, Borgar dimmed, no marker (the speaker is the hero)`,
        s.on && s.side === "hero" && s.who === 0 && byBust(s.m, s.H, HS) && s.H.light === 1 && near(s.N.light, 0.45, 0.02) && !s.marker, s);
    t.check("...the choices under his words in the same bubble (as wide, no frame of their own; the bubble drawn on under them)", !!s.cl && !s.cl.own && s.cl.panel && s.cl.op === 0 && s.cl.x === s.m.x && s.cl.w === s.m.w && near(s.cl.y, s.m.y + s.m.h - 12, 1), { cl: s.cl, m: s.m });
    await shot("rozmowa_3_bohater.png");
    // the bright/dim swap is a short fade
    await t.eval(`(function(){ window.__light = []; const L = SceneManager._scene._talkBusts; const f = () => { window.__light.push(+L._sides[${JSON.stringify(HS)}].light.toFixed(2)); if (window.__light.length < 20) requestAnimationFrame(f); }; requestAnimationFrame(f); return 0; })()`);
    await t.press("escape");
    await t.frames(30);
    const lights = await t.json("window.__light");
    t.check("...after the choice the hero's bust fades back to dim (steps between)", lights.some(v => v > 0.46 && v < 0.99), lights);
    await finish();
    // ---- Borgar's question after those choices under the hero's words: the hero's own choice bubble whole (not a corner of it)
    await t.run(T(["People3", 4], ["\\SPK[1]To co wybierasz?"]).concat(CH(["Piwo", "Wino", "Nic"]), END()), 1);
    for (let i = 0; i < 12 && !(await t.eval("SceneManager._scene._choiceListWindow.isOpen()")); i++) { await t.press("ok"); await t.frames(24); }
    await t.frames(20);
    const own = await t.json(`(function(){ const cl = SceneManager._scene._choiceListWindow, tb = cl._talkBubble; return { own: !!cl._talkOwn, vis: tb.visible, frame: [tb._frame.x, tb._frame.y, tb._frame.width, tb._frame.height], bmp: [tb.bitmap.width, tb.bitmap.height], at: [tb.x, tb.y] }; })()`);
    t.check("his question after the hero's choices: the hero's choice bubble drawn whole (its frame the whole picture, from 0,0)",
        own.own && own.vis && own.frame[0] === 0 && own.frame[1] === 0 && own.frame[2] === own.bmp[0] && own.frame[3] === own.bmp[1] && own.at[1] < 0, own);
    await shot("rozmowa_10_wybor_po_wyborach.png");
    await finish();

    // ---- a line in the usual window in the middle of a talk (the speaker nowhere to be seen): the talk ends, its choices where
    // RPG Maker puts them (not in a bubble of the hero's over the window)
    await t.run(T(["People3", 4], ["\\SPK[1]Słuchaj."]).concat(T(["People2", 7], ["\\SPK[99]Ktoś woła zza drzwi."]), CH(["Tak", "Nie"]), END()), 1);
    await t.frames(40);
    await t.press("ok");
    for (let i = 0; i < 12 && !(await t.eval("SceneManager._scene._choiceListWindow.isOpen()")); i++) { await t.press("ok"); await t.frames(24); }
    await t.frames(30);
    s = await S();
    t.check("a line in the usual window mid-talk: the talk over (the busts gone), the window at the bottom, its choices of RPG Maker's own above it",
        !s.on && !s.L && !s.R && s.who === null && s.m.w >= 800 && !!s.cl && !s.cl.own && !s.cl.panel && s.cl.op > 0 && s.cl.y + s.cl.h <= s.m.y + 1, s);
    await shot("rozmowa_11_zwykle_okno_w_rozmowie.png");
    await finish();

    // ---- the lines as written when they fit between the busts; else one bubble, the stage direction on its own line
    await t.eval("[1, 2, 3, 4].forEach(i => { $gameMap.event(i)._moveType = 0; }); $gameMap.event(1).locate(4, 2); $gamePlayer.locate(4, 3); $gamePlayer.setDirection(8); 0");
    const castle = ["*Borgar nagle poważnieje i unika Twojego wzroku*", "...Zamek? Nie wiem, o czym mówisz. To tylko piwnica.", "Wiesz co... starzy w rodzinie zawsze mówili: nie pytaj o to, czego naprawdę nie chcesz wiedzieć.", "Może... może lepiej zostawmy to. Napij się czegoś."];
    const hist = ["Ta tawerna stoi tu od pokoleń, jeszcze od czasów mojego pradziadka.", "Podobno kamienie w piwnicy są starsze niż sama tawerna...", "Ale to pewnie tylko gadanie starych kumpli przy piwie."];
    await t.run(T(["People3", 4], castle).concat(T(["People3", 4], hist), END()), 1);
    await untilPause();
    s = await S();
    const lines = await t.json("$gameMessage._texts");
    const inBox = await t.eval("SceneManager._scene._messageWindow.contents.height >= SceneManager._scene._messageWindow.lineHeight() * $gameMessage._texts.length");
    t.check("Borgar's answer about the castle (one line of it too long): one bubble of at most 4 lines, the stage direction on its own line, between the busts",
        lines.length <= 4 && lines[0] === castle[0] && inBox && s.m.x >= s.L.x + s.L.w && s.m.x + s.m.w <= s.R.x, { lines, m: s.m });
    await shot("rozmowa_6_zamek.png");
    await t.press("ok");
    await untilPause();
    t.check("...his history of the tavern: the three lines as written (each fits between the busts)", JSON.stringify(await t.json("$gameMessage._texts")) === JSON.stringify(hist), await t.json("$gameMessage._texts"));
    await finish();
    // (longer than one bubble even so: the last page's bubble as high as its own lines)
    const tale = ["Raz, dawno temu, kiedy jeszcze byłem młody i głupi, poszedłem w góry na wschodzie, żeby znaleźć skarb, o którym mówił mój dziadek przy każdym piwie.", "Szedłem trzy dni i trzy noce, aż doszedłem do jaskini, z której wychodził dym, choć nikt tam nie palił ognia.", "Wszedłem do środka, a tam... sam nie wiem, co to było. Coś wielkiego, co oddychało w ciemności i patrzyło na mnie.", "Uciekłem. Nigdy tam nie wróciłem."];
    await t.run(T(["People3", 4], tale).concat(END()), 1);
    await untilPause();
    const page1 = (await S()).m;
    await t.press("ok");
    await untilPause();
    const page2 = (await S()).m, left = await t.eval("$gameMessage._texts.length - 4");
    t.check("...a tale longer than one bubble: full pages, the last page's bubble only as high as its " + left + " line(s)",
        left > 0 && left < 4 && page2.h < page1.h && page2.h === left * 36 + 24, { page1, page2, left });
    await shot("rozmowa_12_ostatnia_strona.png");
    await finish();

    // ---- a short line: the name plate in full (the bubble at least as wide as it)
    await t.run(T(["People2", 7], ["\\SPK[2]Hej."]).concat(END()), 2);
    await t.frames(40);
    s = await S();
    const pw = await plateW("Melia Srebrogłosa");
    t.check("Melia's short \"Hej.\": the bubble wide enough for her whole name plate", s.side === "npc" && s.m.w >= pw + 2 * 14, { m: s.m, plate: pw });
    await shot("rozmowa_13_krotka_kwestia.png");
    await finish();

    // ---- the marker: over the windows; above the bubble when the speaker stands behind it
    await t.eval("$gameMap.event(4).locate(10, 11); $gameMap.event(4).setDirection(2); 0");   // (the big tavern, no zoom: a spot whose head is behind the bubble at the bottom)
    await t.frames(10);
    await t.run(T(["People2", 0], ["\\SPK[4]*czkawka* ...i wtedy mówię do niej: to nie ja zjadłem tę kozę!", "Ehh, młodzi już nie potrafią pić jak za moich czasów...", "Karczmarz! Jeszcze jedno...", "no dobra, zapłacę. Chyba."]).concat(END()), 4);
    await t.frames(50);
    // (the map's "Atmosfera" event puts a balloon over Ozzy now and then - the marker then rises over it, checked on its own below;
    // when it came depended on the machine's speed: off for this check)
    await t.eval("(function(){ const o = $gameMap.event(4); for (const b of SceneManager._scene._spriteset._balloonSprites) if (b.targetObject === o) b._duration = 0; $gameTemp._balloonQueue = $gameTemp._balloonQueue.filter(q => q.target !== o); return 0; })()");
    await t.frames(20);
    s = await S();
    const layer = await t.json("(function(){ const sc = SceneManager._scene; return { marker: sc.children.indexOf(sc._talkBusts._marker), windows: sc.children.indexOf(sc._windowLayer) }; })()");
    t.check("Ozzy talking from behind his own bubble: the marker at his x, just above the bubble's top edge, over the windows",
        !!s.marker && !!s.head && s.head.top > s.m.y && near(s.marker.x, s.head.x, 2) && s.marker.y <= s.m.y && s.marker.y >= s.m.y - 10 && layer.marker > layer.windows, { marker: s.marker, head: s.head, m: s.m, layer });
    await shot("rozmowa_7_znacznik_nad_dymkiem.png");
    await finish();
    // ...and above a balloon icon over the speaker (RPG Maker's drop, note, zzz)
    await t.run(T(["People3", 4], ["\\SPK[1]Hmm, słyszałeś to?"]).concat(END()), 1);
    await t.frames(30);
    await t.eval("$gameTemp.requestBalloon($gameMap.event(1), 1); 0");
    await t.frames(24);
    s = await S();
    const bal = await t.json("(function(){ const b = SceneManager._scene._spriteset._balloonSprites.find(b => b.targetObject === $gameMap.event(1)); if (!b) return null; const r = b.getBounds(); return { x: Math.round(r.x), y: Math.round(r.y), w: r.width, h: r.height }; })()");
    t.check("...a balloon over the speaker: the marker above it, not in it", !!bal && !!s.marker && s.marker.y <= bal.y + 1 && near(s.marker.x, s.head.x, 2), { marker: s.marker, balloon: bal, head: s.head });
    await finish();

    // ---- someone without a bust speaking in a talk, by Borgar's bust: the bubble over his head clear of it (and of the hero's)
    await t.eval(`(function(){ const oz = $gameMap.event(4); oz.page().list.unshift({ code: 108, indent: 0, parameters: ["<Bust:none>"] }); oz.locate(10, 6); oz.setDirection(2); return 0; })()`);   // (old map: 15,10)
    await t.frames(10);
    await t.run(T(["People3", 4], ["\\SPK[1]Słyszałeś? Stary Ozzy znowu coś gada."]).concat(T(["People2", 0], ["\\SPK[4]*czkawka* Wszystko słyszę, Borgar!"]), T(["People3", 4], ["\\SPK[1]No i dobrze."]), END()), 1);
    await untilPause();
    await t.press("ok");
    await untilPause();
    s = await S();
    t.check("Ozzy (no bust) in Borgar's talk, by Borgar's bust: his bubble over his head, clear of the bust (both busts dimmed)",
        s.on && s.who === 4 && !s.side && s.bubble && !!s.N && !!s.H && clearOf(s.m, s.N, NS) && clearOf(s.m, s.H, HS) && near(s.N.light, 0.45, 0.02), { m: s.m, N: s.N, H: s.H, edge: s.edge });
    await shot("rozmowa_8_bez_popiersia_w_rozmowie.png");
    await finish();
    await t.eval("$gameMap.event(4).page().list.shift(); 0");

    // ---- another speaker with a bust (Melia, then Grum): a short cross-fade where the bust stands (the tail always at a face)
    await t.run(T(["People2", 7], ["\\SPK[2]Grum, powiedz mu, co widziałeś w górach."]).concat(T(["Actor2", 4], ["\\SPK[3]Dym nad jaskiniami. Trzy noce z rzędu."]), END()), 2);
    await untilPause();
    // (the game held and stepped a frame at a time: each frame noted, the screenshot half-way through the cross-fade)
    await t.eval(`(function(){ const R = window.__R = { hold: true, steps: 0, rec: [], um: SceneManager.updateMain }; SceneManager.updateMain = function() { if (R.hold && R.steps <= 0) return; R.steps--; R.um.call(this);
        const p = SceneManager._scene._talkBusts._sides[${JSON.stringify(NS)}]; if (R.rec.length < 60) R.rec.push({ n: p.name, k: +p.k.toFixed(2), op: p.sprite.visible ? p.sprite.opacity : 0, g: p.ghost.visible ? p.ghost.opacity : 0, x: Math.round(p.sprite.x) }); };
        Input._currentState.ok = true; return 0; })()`);
    const step = () => t.eval(`new Promise(res => { __R.steps = 1; const iv = setInterval(() => { if (__R.steps <= 0) { clearInterval(iv); requestAnimationFrame(() => requestAnimationFrame(() => res(0))); } }, 4); })`);
    for (let i = 0; i < 20; i++) {
        await step();
        if (i === 2) await t.eval("Input._currentState.ok = false; 0");
        if (await t.eval(`(function(){ const p = SceneManager._scene._talkBusts._sides[${JSON.stringify(NS)}]; return p.ghost.visible && p.sprite.opacity >= 96; })()`)) break;
    }
    await shot("rozmowa_9_zmiana_mowcy.png");   // (half-way through the cross-fade)
    await t.eval("Input._currentState.ok = false; __R.hold = false; 0");
    await t.frames(40);
    await t.eval("SceneManager.updateMain = __R.um; 0");
    const sw = await t.json("__R.rec"), at = sw.findIndex(r => r.n === "Actor2_5"), after = at < 0 ? [] : sw.slice(at);
    t.check("Melia -> Grum: Grum's bust fades in where hers stood while hers fades out (never slid away: a face there every frame), full within ~10 frames",
        at > 0 && sw[at - 1].n === "People2_8" && sw[at - 1].k === 1 && after.every(r => r.k === 1 && r.op + r.g >= 200) && after.length > 12 && after[10].op === 255 && after[10].g === 0, sw.slice(Math.max(0, at - 2), at + 12));
    await finish();

    // ---- characters without a bust: the old bubble over the head
    await t.eval(`(function(){ $gameMap.event(2).page().list.unshift({ code: 108, indent: 0, parameters: ["<Bust:none>"] }); $gameMap.event(2).locate(7, 5); $gameMap.event(2).setDirection(2); return 0; })()`);   // (on the screen: her stage is far away on the big map)
    t.check("<Bust:none> in a comment on the event's page: Melia has no bust", (await t.eval("SpeechBubbles.bustOf($gameMap.event(2))")) === null);
    await t.run(T(["People2", 7], ["\\SPK[2]Nie mam dziś ochoty na pogawędki."]).concat(END()), 2);
    await t.frames(40);
    s = await S();
    t.check("...her words in a bubble over her head (not a talk; no busts)", !s.on && !s.side && s.who === 2 && s.bubble && ["bottom", "left", "right", "top"].includes(s.edge) && !s.L && !s.R, s);
    await shot("rozmowa_4_bez_popiersia.png");
    await finish();
    await t.eval(`(function(){ $gameMap.event(2).page().list.shift(); $gameMap.event(4).setImage("$Reid_Poor", 0); return 0; })()`);
    await t.run(T(null, ["\\SPK[4]Ja tu tylko sprzątam."]).concat(END()), 4);
    await t.frames(40);
    s = await S();
    t.check("a sheet of our own with no bust in the table ($Reid_Poor): a bubble over the head", !s.on && s.who === 4 && s.bubble && !s.L && !s.R, s);
    await finish();
    await t.eval(`$gameMap.event(4).setImage("People2_Tall", 0); 0`);

    // ---- a cry: over the head, no busts
    await t.eval(`SpeechBubbles.say($gamePlayer, "Idzie burza..."); 0`);
    await t.frames(20);
    s = await S();
    t.check("a cry (SpeechBubbles.say): a small bubble over the hero, no talk, no busts", s.barks === 1 && !s.on && !s.L && !s.R, { barks: s.barks, on: s.on });
    await t.frames(280);

    // ---- the hero alone (no partner with a bust): over his head
    await t.run(T(null, ["Hmm... trzeba się napić."]).concat(END()), 0);
    await t.frames(40);
    s = await S();
    t.check("the hero's thought outside a talk: a bubble over his head, no busts", !s.on && s.who === 0 && s.bubble && !s.side && !s.L && !s.R, s);
    await finish();

    // ---- \SPK[-1]: the usual window - also in the middle of a talk (the busts go)
    await t.run(T(["People3", 4], ["\\SPK[1]Słuchaj uważnie."]).concat(T(["People3", 4], ["\\SPK[-1]Zwykłe okno na dole ekranu."]), END()), 1);
    await t.frames(40);
    const before = await S();
    await t.press("ok");
    await t.frames(40);
    s = await S();
    t.check("\\SPK[-1] after Borgar's line: the usual window at the bottom (its own size), the busts gone", before.on && before.N && s.open && s.who === null && !s.bubble && s.m.w >= 800 && s.opacity > 0 && !s.on && !s.L && !s.R, { before: { on: before.on, N: !!before.N }, now: s });
    await finish();

    // ---- a fade-out mid-talk: the busts go with it; after the fade-in his next line brings them back
    await t.run(T(["People3", 4], ["\\SPK[1]Zaraz zgaszę światło."]).concat([{ code: 221, indent: 0, parameters: [] }, { code: 230, indent: 0, parameters: [30] }], (() => { const t = T(["People3", 4], ["\\SPK[1]No, już jasno."]); t.unshift({ code: 222, indent: 0, parameters: [] }); return t; })(), END()), 1);
    await t.frames(40);
    await t.press("ok");
    await t.frames(40);
    const dark = await S();
    await t.until("$gameMessage.isBusy()", 10);
    await t.frames(40);
    s = await S();
    t.check("a fade-out mid-talk: the busts go with the light; the next line after the fade-in brings them back", !dark.on && !dark.L && !dark.R && s.on && !!s.N && !!s.H, { dark: { on: dark.on, L: !!dark.L, R: !!dark.R }, after: { on: s.on, H: !!s.H, N: !!s.N } });
    // ---- a save in the middle of a talk: nothing of the talk in it
    const save = await t.eval("JsonEx.stringify(DataManager.makeSaveContents())");
    t.check("a save made mid-talk holds nothing of the busts or the talk", !/People3_5|Hero_Bust|Stach_Bust|_talkSide|_bubbleOf|_choiceSlot/.test(save), save.length);
    await finish();

    // ---- a new story game: grandpa's talk in his house (Map019), his bust Stach_Bust when the file is there
    const stachFile = await t.eval("fetch('img/pictures/Stach_Bust.png', { method: 'HEAD', cache: 'no-store' }).then(r => r.ok).catch(() => false)");
    // (the story's start set in the page: data/System.json may point elsewhere while the user tests something)
    await t.newGame({ story: true, minimap: false });
    if (!hb) await t.eval("HeroLook.setActive(false); 0");
    const intro = await t.until("$gameMessage.isBusy() && SceneManager._scene._messageWindow.isOpen()", 30);
    await t.frames(50);
    s = await S();
    const gb = await t.eval("SpeechBubbles.bustOf($gameMap.event(901))");
    t.check("grandpa's talk (Story, event 901): " + (stachFile ? "his bust Stach_Bust on the " + NS + ", bright, the bubble out of it" : "Stach_Bust.png not there yet - his words over his head"),
        intro && s.who === 901 && (stachFile ? gb === "Stach_Bust" && s.on && s.side === "npc" && s.N && s.N.name === "Stach_Bust" && inCorner(s.N, NS) && s.N.light === 1 && byBust(s.m, s.N, NS) : gb === null && !s.side && s.bubble), { stachFile, gb, s });
    await shot("rozmowa_5_dziadek.png");
    await t.eval("Story.skipIntro(); 0");
    await finish();
    s = await S();
    t.check("...the talk cut short (Story.skipIntro): no busts left", !s.on && !s.L && !s.R, { on: s.on, L: !!s.L, R: !!s.R });
});
