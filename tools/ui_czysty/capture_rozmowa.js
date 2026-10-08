// Zrzuty czystego widoku w rozmowie (popiersia w dolnych rogach) i w menu budowy (Q, lewy dół): docs/ui_czysty/czysty_rozmowa.png,
// czysty_budowa.png.   CDP_PORT=9486 node tools/ui_czysty/capture_rozmowa.js
"use strict";
const path = require("path");
const fs = require("fs");
const kit = require("../../tests/lib/kit.js");
const OUT = path.join(__dirname, "..", "..", "docs", "ui_czysty");
const PLUGINS = ["CleanHUD", "CleanHUD_Compass", "MenuRing"].filter(n => fs.existsSync(path.join(__dirname, "..", "..", "js", "plugins", n + ".js")));
kit.test({ port: 9486, errorCheck: false, plugins: PLUGINS }, async t => {
    await t.newGame({ story: true, hour: 10, quiet: true });
    const talk = await t.until("$gameMessage.isBusy() && SceneManager._scene._messageWindow.openness >= 255", 20);
    await t.frames(30);
    console.log("talk", talk, JSON.stringify(await t.json("(function(){ const d = CleanHUD.debug(); return { needs: d.parts.needs.visible, xp: d.parts.xp.visible, gains: d.parts.gains.visible, clock: d.parts.clock }; })()")));
    await t.shot(path.join(OUT, "czysty_rozmowa.png"));
    await t.eval("Story.skipIntro(); 0");
    await t.finish();
    await t.go(3, 20, 15, 2);
    await t.frames(30);
    await t.key("Q");
    await t.frames(30);
    console.log("build", JSON.stringify(await t.json("(function(){ const d = CleanHUD.debug(); return { menu: !!$gameTemp._farmMenuOpen, needs: d.parts.needs.visible, xp: d.parts.xp.visible }; })()")));
    await t.shot(path.join(OUT, "czysty_budowa.png"));
    t.check("zrzuty", true);
});
