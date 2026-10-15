// Animacje prologu (2026-10-14): klatki powiewających chorągwi (wieś, port) i chłopca na plaży (leży, wstaje, idzie, pada)
// z gry -> tools/prolog/klatki_anim/*, zrzuty docs/prolog/*.png; GIF-y składa tools/prolog/gify.py.
// Gra krok po kroku: zegar PIXI zatrzymany, każda klatka gry liczona ręcznie (Graphics._onTick), więc klatki są równe.
//   CDP_PORT=9470 node tools/prolog/animacje.js
"use strict";
const fs = require("fs");
const path = require("path");
const kit = require("../../tests/lib/kit.js");
const DOCS = path.join(__dirname, "..", "..", "docs", "prolog");
const FR = path.join(__dirname, "klatki_anim");

kit.test({ port: Number(process.env.CDP_PORT) || 9470, errorCheck: false }, async t => {
    const info = () => t.json("Prologue.info()");
    const step = n => t.eval(`(function(){ for (let i = 0; i < ${n}; i++) Graphics._onTick(1); return Graphics.frameCount; })()`);
    const fresh = dir => {
        const d = path.join(FR, dir);
        fs.mkdirSync(d, { recursive: true });
        for (const f of fs.readdirSync(d)) fs.unlinkSync(path.join(d, f));
        return d;
    };
    const log = {};
    const shoot = async (dir, i, extra) => {
        await t.shot(path.join(FR, dir, String(i).padStart(3, "0") + ".png"));
        (log[dir] = log[dir] || []).push(Object.assign({ fc: await t.eval("Graphics.frameCount") }, extra || {}));
    };
    await t.until("TitleScreen.info() && TitleScreen.info().open && TitleScreen.info().active", 20);
    await t.eval("SceneManager.goto(Prologue.Scene_Prologue); 0");
    await t.until("Prologue.info() && Prologue.info().screen === 'film'", 15);
    await t.frames(20);
    await t.eval("Graphics._app.ticker.stop(); 0");

    // ---- the village: the Watch's banner on its crossbar
    await t.eval("SceneManager._scene.beginScene(1); 0");
    await step(120);
    await t.shot(path.join(DOCS, "choragiew_wies.png"));
    fresh("wies");
    for (let i = 0; i < 90; i++) { await shoot("wies", i, { moved: (await info()).flags.map(f => f.moved) }); await step(3); }
    console.log("WIES", JSON.stringify((await info()).flags));

    // ---- the harbour: the flag on the ship's mast, in the rain
    await t.eval("SceneManager._scene.beginScene(3); 0");
    await step(120);
    await t.shot(path.join(DOCS, "choragiew_port.png"));
    fresh("port");
    for (let i = 0; i < 70; i++) { await shoot("port", i); await step(3); }
    console.log("PORT", JSON.stringify((await info()).flags));

    // ---- the beach: the boy lies, stirs, gets up, staggers up the beach, falls
    await t.eval("SceneManager._scene.beginScene(5); 0");
    fresh("plaza");
    await step(60);
    await t.shot(path.join(DOCS, "plaza_1_lezy.png"));
    let i = 0, done = 0;
    const seen = {};
    while (i < 700) {
        const n = await info();
        if (!n || n.scene !== "plaza") break;
        const b = n.boy;
        await shoot("plaza", i++, { seq: b && b.seq, frame: b && b.frame, x: b && b.x, y: b && b.y, bubble: !!n.bubble });
        if (b && !seen[b.seq]) { seen[b.seq] = i; console.log("SEQ", b.seq, "shot", i, JSON.stringify(b)); }
        if (b && b.seq === "getup" && b.frame === 6 && !seen.g6) { seen.g6 = 1; await t.shot(path.join(DOCS, "plaza_2_wstaje.png")); }
        if (b && b.seq === "walk" && seen.walk && i - seen.walk === 12 && !seen.w2) { seen.w2 = 1; await t.shot(path.join(DOCS, "plaza_3_idzie.png")); }
        if (b && b.seq === "fall" && b.frame === 28 && !seen.f7) { seen.f7 = 1; await t.shot(path.join(DOCS, "plaza_4_upadek.png")); }
        if (b && b.seq === "fall" && b.frame === 29 && ++done > 12) break;
        await step(b && (b.seq === "lie" || b.seq === "stand") ? 8 : 3);
    }
    await t.eval("Graphics._app.ticker.start(); 0");
    fs.writeFileSync(path.join(FR, "czasy.json"), JSON.stringify(log));
    console.log("SHOTS", JSON.stringify(Object.fromEntries(Object.entries(log).map(([k, v]) => [k, v.length]))));
    console.log("ERRORS", JSON.stringify(t.errors().slice(-8)));
});
