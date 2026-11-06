// Widok na dworze (js/plugins/Widok.js, 2026-11-06): budynki zasłaniają, dachy widać z góry, na otwartej łące widać wszystko, w nocy blisko (z pochodnią dalej),
// ludzie poza wzrokiem niewidoczni (w scenie widać wszystkich), poznane miejsca w zapisie (krótko), we wnętrzach i lochach nie działa, koszt w limicie;
// na każdej mapie pod gołym niebem: działa, wokół bohatera jasno, bez błędów.
// Ze stagingu: GAME_OVERLAY=tools/widok/staging GAME_OVERLAY_JS=1 CDP_PORT=9435 node tests/widok_test.js
"use strict";
const fs = require("fs"), path = require("path");
const kit = require("./lib/kit.js");
const DATA = path.join(__dirname, "..", "data");
const info = JSON.parse(fs.readFileSync(path.join(DATA, "MapInfos.json"), "utf8"));
const plener = [], wejscia = {};
for (const it of info) {
    if (!it) continue;
    const p = path.join(DATA, "Map" + String(it.id).padStart(3, "0") + ".json");
    if (!fs.existsSync(p)) continue;
    const m = JSON.parse(fs.readFileSync(p, "utf8"));
    if (![8, 10, 12].includes(m.tilesetId) && /<Clouds:on>/i.test(m.note || "")) plener.push(it.id);
    for (const e of m.events) if (e) for (const pg of e.pages) for (const c of pg.list) if (c.code === 201 && c.parameters[0] === 0 && c.parameters[1] !== it.id) (wejscia[c.parameters[1]] = wejscia[c.parameters[1]] || []).push([c.parameters[2], c.parameters[3]]);
}
kit.test({ port: Number(process.env.CDP_PORT) || 9435, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 300000 }, async t => {
    t.check("wtyczka wczytana", await t.json("!!window.Widok"));
    const settle = async () => { await t.frames(30); await t.until("Widok.settled()", 12); await t.frames(3); };
    const near = (x, y) => `(() => { for (let r = 0; r < 30; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const a = ${x} + dx, b = ${y} + dy; if ($gameMap.isValid(a, b) && $gameMap.checkPassage(a, b, 0x0f)) { $gamePlayer.locate(a, b); return; } } })()`;
    const hidden = r => `(() => { const P = $gamePlayer, out = []; for (let dy = -${r}; dy <= ${r}; dy++) for (let dx = -${r}; dx <= ${r}; dx++) { const x = P.x + dx, y = P.y + dy; if ($gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && Widok.sees(x, y) < 0.2) out.push([x, y]); } return out; })()`;
    // łąka: otwarte pole
    await t.newGame({ map: 4, x: 40, y: 30, day: 12, hour: 11, quiet: true, minimap: false });
    await t.eval(near(40, 30) + "; 0"); await settle();
    t.check("działa pod gołym niebem", await t.json("Widok.active()"));
    const lakaSchowane = await t.json(hidden(8));
    t.check("na otwartej łące w dzień w promieniu 8 kratek nic nie jest zakryte (poza tym, co za drzewem)", lakaSchowane.length <= 6, lakaSchowane.length);
    t.check("wokół bohatera nic nie zakrywa", (await t.json("Widok.cover($gamePlayer.x, $gamePlayer.y)")) === 0);
    // noc: blisko; z pochodnią dalej
    await t.setHour(23.5); await t.eval("Widok.reach(); 0"); await t.frames(40); await t.until("Widok.settled()", 12);
    const noc = await t.json("Widok.reach()");
    t.check("w nocy widać blisko (do 7 kratek)", noc <= 7, noc);
    const daleko = await t.json(`(() => { const P = $gamePlayer; for (const [dx, dy] of [[11, 0], [-11, 0], [0, 9], [0, -9]]) { const x = P.x + dx, y = P.y + dy; if ($gameMap.isValid(x, y)) return Widok.sees(x, y); } return -1; })()`);
    t.check("w nocy 9-11 kratek dalej nic nie widać", daleko >= 0 && daleko < 0.05, daleko);
    await t.eval("window.__lit = Torch.isLit; Torch.isLit = () => true; 0"); await t.frames(30);
    const zPochodnia = await t.json("Widok.reach()");
    await t.eval("Torch.isLit = window.__lit; 0");
    t.check("z pochodnią w ręce w nocy widać dalej", zPochodnia > noc + 3, [noc, zPochodnia]);
    await t.setHour(11); await settle();
    // miasto: dachy z góry, za domami zakryte
    await t.go(8, 52, 70, 2); await t.eval(near(52, 70) + "; 0"); await settle();
    const dachy = await t.json(`(() => { const P = $gamePlayer, out = []; for (let dy = -9; dy <= 9; dy++) for (let dx = -12; dx <= 12; dx++) { const x = P.x + dx, y = P.y + dy; if ($gameMap.isValid(x, y) && Widok.pass(x, y)[0] === 0) out.push(Widok.sees(x, y)); } return out; })()`);
    t.check("w mieście dachy widać z góry, także za innymi domami", dachy.length > 10 && dachy.every(s => s > 0.8), [dachy.length, Math.min(...dachy)]);
    const miastoSchowane = await t.json(hidden(10));
    t.check("w mieście za domami są miejsca, których nie widać", miastoSchowane.length > 5, miastoSchowane.length);
    // ludzie: ukryty za domem znika, w zasięgu wzroku widoczny, w scenie widoczny
    const ktos = await t.json(`(() => { const e = $gameMap.events().find(q => q.characterName() && q.characterName()[0] !== "!" && !q.isTransparent()); return e ? e.eventId() : 0; })()`);
    if (ktos && miastoSchowane.length) {
        const [hx, hy] = miastoSchowane[Math.floor(miastoSchowane.length / 2)];
        await t.eval(`(() => { const e = $gameMap.event(${ktos}); if (e._town) e._town.held = true; e.locate(${hx}, ${hy}); })(); 0`);
        await t.frames(40);
        const op = () => t.json(`(() => { const s = SceneManager._scene._spriteset._characterSprites.find(c => c._character === $gameMap.event(${ktos})); return s ? s.opacity : -1; })()`);
        const schowany = await op();
        t.check("człowiek za domem jest niewidoczny", schowany >= 0 && schowany < 20, { schowany, at: [hx, hy] });
        await t.eval(`$gameMap._interpreter.setup([{ code: 230, indent: 0, parameters: [60] }, { code: 0, indent: 0, parameters: [] }], 0); 0`); await t.frames(30);
        t.check("w czasie sceny widać wszystkich", (await op()) > 200, await op());
        await t.until("!$gameMap.isEventRunning()", 10); await t.frames(10);
        const powiedzial = await t.json(`Tawerna.api("SpeechBubbles").say($gameMap.event(${ktos}), "test")`);
        t.check("kogo nie widać, ten nic nie mówi w dymku", powiedzial === false, powiedzial);
        await t.eval(`(() => { const e = $gameMap.event(${ktos}); e.locate($gamePlayer.x + 2, $gamePlayer.y); })(); 0`); await t.frames(60);
        t.check("w zasięgu wzroku znów widoczny", (await op()) > 200, await op());
        await t.eval(`(() => { const e = $gameMap.event(${ktos}); if (e._town) e._town.held = false; })(); 0`);
    }
    // zapis: poznane miejsca zostają, zapis krótki
    const zn = await t.json("Widok.known(8)");
    await t.saveTo(6);
    const dl = await t.json(`(() => { const s = $gameSystem._tw && $gameSystem._tw.widok; return s ? JSON.stringify(s).length : -1; })()`);
    await t.loadFrom(6); await settle();
    const zn2 = await t.json("Widok.known(8)");
    t.check("po wczytaniu poznane miejsca te same", zn > 100 && Math.abs(zn2 - zn) <= 50, [zn, zn2]);
    t.check("w zapisie zajmuje mało (< 6 KB)", dl > 0 && dl < 6000, dl);
    // koszt
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    const koszt = await t.json("Widok.cost(60)");
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    console.log("   koszt w mieście przy CPU 4x: spojrzenie " + koszt.look.toFixed(3) + " ms, rysowanie " + koszt.draw.toFixed(3) + " ms");
    t.check("spojrzenie <= 1.2 ms, rysowanie <= 0.3 ms (CPU 4x)", koszt.look <= 1.2 && koszt.draw <= 0.3, koszt);
    // gdzie nie działa
    await t.go(1, 50, 35, 8); await t.frames(20);
    t.check("we wnętrzu nie działa (tam Pokoje.js)", !(await t.json("Widok.active()")));
    await t.go(130, 10, 10, 2); await t.frames(20);
    t.check("w podziemiach nie działa", !(await t.json("Widok.active()")));
    // każda mapa pod gołym niebem
    const zle = [];
    for (const id of plener) {
        const w = wejscia[id] && wejscia[id][0];
        await t.go(id, w ? w[0] : 10, w ? w[1] : 10, 2);
        await t.frames(4);
        if (!w) await t.eval(near(Math.floor(10), 10) + "; 0");
        await t.frames(12);
        const r = await t.json(`({ on: Widok.active(), map: $gameMap.mapId(), c: Widok.cover($gamePlayer.x, $gamePlayer.y), want: Widok.want($gamePlayer.x, $gamePlayer.y) })`);
        if (!r.on || r.map !== id || r.want > 0.05) zle.push([id, r]);
    }
    console.log("   map pod gołym niebem: " + plener.length);
    t.check("na każdej mapie pod gołym niebem działa i wokół bohatera jest jasno", zle.length === 0, zle);
});
