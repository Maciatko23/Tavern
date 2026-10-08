// In-game check of the talk busts (2026-10-07): a real talk with each given character - a TownLife resident (in the town, in
// Podgrodzie...) or a tavern regular (Map001, found by the RTP bust name its event carries) - a screenshot of the first line to
// docs/popiersia/rozmowa_<key>.png, and what the talk showed: the bust's name and the file drawn for it (SpeechBubbles.bustFile).
// Run (the game served on 8765): CDP_PORT=9484 node tools/busts/game_shots.js kowal dzwonnik borgar ...
const path = require("path");
const kit = require("../../tests/lib/kit.js");

const OUT = path.join(__dirname, "..", "..", "docs", "popiersia");
const TAVERN = { borgar: "People3_5", melia: "People2_8", grum: "Actor2_5", ozzy: "People2_1", wanda: "People1_6" };
const keys = process.argv.slice(2);

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    await t.eval(kit.DRIVER + "; 0");
    const talk = async (key, evExpr) => {
        await t.eval(`(function(){ const e = ${evExpr}; __standBy(e.eventId()); e.start(); return 0; })()`);
        const on = await t.until("SpeechBubbles.talk().on && $gameMessage.isBusy() && SceneManager._scene._messageWindow.isOpen()", 15);
        await t.frames(110);
        const s = await t.json(`(function(){ const L = SceneManager._scene._talkBusts, side = L._sides[SpeechBubbles.NPC_SIDE];
            return { on: SpeechBubbles.talk().on, name: side && side.name, shown: !!(side && side.sprite.visible),
                file: side && side.name ? SpeechBubbles.bustFile(side.name) : null,
                url: side && side.sprite.bitmap ? String(side.sprite.bitmap._url || "") : null }; })()`);
        await t.shot(path.join(OUT, "rozmowa_" + key + ".png"));
        await t.finish(40);
        await t.frames(30);
        return Object.assign({ talk: !!on }, s);
    };
    for (const key of keys) {
        let res = null;
        if (TAVERN[key]) {
            if (!(await t.eval("$gameMap.mapId()")) || (await t.eval("$gameMap.mapId()")) !== 1) await t.newGame({ map: 1, x: 10, y: 10, hour: 19, minimap: false });
            const find = `$gameMap.events().find(e => SpeechBubbles.bustOf(e) === ${JSON.stringify(TAVERN[key])})`;
            if (await t.eval(`!!(${find})`)) res = await talk(key, find);
        } else {
            const home = await t.eval(`(function(){ const r = TownLife.RESIDENTS.find(r => r.key === ${JSON.stringify(key)}); return r && TownLife.homeOf ? TownLife.homeOf(r) : 8; })()`);
            for (const hour of [10, 13, 16, 8, 19]) {
                if ((await t.eval("$gameMap.mapId()")) !== home) await t.newGame({ map: home, x: home === 8 ? 20 : 1, y: home === 8 ? 30 : 1, hour, minimap: false, quiet: true });
                else await t.setHour(hour);
                // (Marek lives in the town only once he is out of the cave: TownQuests' flag marekSaved)
                if (key === "marek") await t.eval("(function(){ const s = TownQuests.state(); s.flags = s.flags || {}; s.flags.marekSaved = true; return 0; })()");
                await t.eval("TownLife.placeAll(); 0");
                await t.frames(20);
                const ev = `TownLife.eventOf(${JSON.stringify(key)})`;
                if (await t.eval(`!!(${ev}) && !${ev}.isTransparent()`)) { res = await talk(key, ev); break; }
            }
        }
        console.log("TALK " + key + " " + JSON.stringify(res));
        t.check(key + ": a talk with the bust shown" + (res ? " (" + res.name + " -> " + res.file + ")" : ""), !!(res && res.talk && res.shown && res.file), res);
    }
});
