// Zrzuty zwiadu kruka (2026-10-17): docs/miejsca_wyspy/kruk_zwiad_popup.png (powrót: podsumowanie u góry, czerwone ostrzeżenie,
// dymek nad krukiem) i kruk_zwiad_notatka.png (notatka „Zwiad kruka: Łąka” w dzienniku). Nakładka staging_B, gdy Map157 to szkielet.
//   CDP_PORT=9502 node tools/kruk/zwiad_shots.js   (serwer: node tools/serve.js)
"use strict";
const fs = require("fs");
const path = require("path");
const kit = require("../../tests/lib/kit.js");
const ROOT = path.join(__dirname, "..", "..");
const DOCS = path.join(ROOT, "docs", "miejsca_wyspy");
const skeleton = /Wyspa:szkielet/.test(fs.readFileSync(path.join(ROOT, "data", "Map157.json"), "utf8"));
const OVERLAY = process.env.GAME_OVERLAY || (skeleton ? "tools/miejsca_wyspy/staging_B" : null);

kit.test({ port: Number(process.env.CDP_PORT) || 9502, overlay: OVERLAY, errorCheck: "bez błędów w konsoli" }, async t => {
    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, minimap: false });
    await t.eval("(function(){ const s = Kruk.state(); s.stage = 'tame'; s.name = 'Węgielek'; s.mode = 'follow'; s.tamedDay = 10; return 0; })()");
    await t.setDay(12, 8.5);
    await t.go(4, 20, 20, 2);
    await t.until("!!(Kruk.state().cat && Kruk.state().cat[4])", 15);
    await t.go(3, 22, 21, 2);
    await t.setDay(12, 9);
    await t.dismiss();
    await t.frames(600);   // (the notices of the start of the game gone first: the top shows one at a time)
    await t.notices({ clear: true });
    await t.eval("Kruk.sendScout(4); 0");
    await t.frames(150);
    await t.eval("$gameSystem.setDayNightHour($gameSystem.dayNightHour() + 1.6); 0");
    await t.until("!Kruk.state().away", 10);
    // (the autosave's notice after the clock's jump would hold the top place: it goes, the raven's report is shown)
    await t.eval(`(function(){ const q = $gameTemp._topNotices || []; for (let i = q.length - 1; i >= 0; i--) if (!/^Zwiad kruka/.test(q[i].text || "")) q.splice(i, 1);
        const n = SceneManager._scene._topNotice; if (n && n._data && !/^Zwiad kruka/.test(n._data.text || "")) { n._age = -1; n.visible = false; } return 0; })()`);
    await t.until("(function(){ const n = SceneManager._scene._topNotice; return !!(n && n._data && /^Zwiad kruka/.test(n._data.text) && n._age > 24); })()", 10);
    console.log("u góry:", JSON.stringify(await t.notices()), "popupy:", JSON.stringify(await t.popups()));
    await t.shot(path.join(DOCS, "kruk_zwiad_popup.png"));
    for (let i = 0; i < 60; i++) {   // (then the raven lands by the hero and says it again in a bubble)
        const st = await t.json("Kruk.pet && Kruk.pet.state");
        if (st === "sit" || st === "shoulder") break;
        await t.frames(6);
    }
    await t.frames(20);
    await t.shot(path.join(DOCS, "kruk_zwiad_dymek.png"));
    console.log("raport:", JSON.stringify(await t.json("Kruk.state().scout")));
    await t.frames(200);
    await t.dismiss();
    await t.eval("SceneManager.push(Journal.Scene_Journal); 0");
    const opened = await t.until("SceneManager._scene && SceneManager._scene.constructor !== Scene_Map && !SceneManager.isSceneChanging()", 15);
    console.log("dziennik:", opened, await t.scene());
    await t.frames(20);
    // (MenuRing.js: J opens the menu on its journal view - find that view in the menu scene and turn it to "Notatki")
    const got = await t.eval(`(function(){ const s = SceneManager._scene, seen = new Set(), want = Journal.TABS.indexOf('Notatki');
        const find = (o, d) => { if (!o || typeof o !== "object" || seen.has(o) || d > 2) return null; seen.add(o);
            if (o.J && typeof o.changeTab === "function" && o._list) return o;
            for (const k of Object.keys(o)) { const r = find(o[k], d + 1); if (r) return r; } return null; };
        const v = s instanceof Journal.Scene_Journal ? s : find(s, 0);
        if (!v) return "brak widoku dziennika";
        for (let i = 0; i < 12 && v._tab !== want; i++) v.changeTab(1);
        v._list.select(0); if (v._list.updateHelp) v._list.updateHelp(); if (v._list._onSelect) v._list._onSelect(v._list.currentItem ? v._list.currentItem() : null);
        return "zakładka " + v._tab; })()`);
    console.log("dziennik:", got);
    await t.frames(20);
    await t.shot(path.join(DOCS, "kruk_zwiad_notatka.png"));
});
