// Pomiar 3: jedna zmiana u Borgara w realnym czasie (zwykła prędkość, bez turbo), grana botem z tests/tavern_shift_test.js
// („dobry” i „średni”); karty Borgara bot zamyka po ~0,5 s - czas czytania kart doliczam osobno z liczby słów.
//   CDP_PORT=9540 node tools/pomiar_czasu/pomiar3.js        (wyniki: tools/pomiar_czasu/pomiar3.json)
"use strict";
const fs = require("fs"), path = require("path");
const kit = require("../../tests/lib/kit.js");
const OUT = path.join(__dirname, "pomiar3.json");
const src = fs.readFileSync(path.join(__dirname, "..", "..", "tests", "tavern_shift_test.js"), "utf8");
const BOT = /const BOT = String\.raw`([\s\S]*?)`;\n/.exec(src)[1];
const R = { when: new Date().toISOString(), zmiany: [] };
const save = () => fs.writeFileSync(OUT, JSON.stringify(R, null, 1));

(async () => {
    const t = await kit.open({ port: Number(process.env.CDP_PORT) || 9540 });
    try {
        await t.newGame({ map: 1, x: 50, y: 53, quiet: true, hour: 16 });
        await t.eval(BOT + "; 0");
        for (const [mode, level] of [["good", 2], ["medium", 4]]) {
            await t.eval(`(function(){ $gameSystem.setDayNightHour(16.2); window.__res = null; window.__bot.mode = "${mode}"; return 0; })()`);
            await t.eval(`TavernShift.start({ level: ${level}, onEnd: r => { window.__res = r; } })`);
            const t0 = Date.now(), phases = [];
            let last = "";
            while (Date.now() - t0 < 15 * 60 * 1000) {
                const st = await t.json("(function(){ const s = TavernShift.state(); return { s: s ? s.phase + '|' + (s.part || '') + '|' + (s.card || '') : 'none', res: !!window.__res, map: SceneManager._scene instanceof Scene_Map }; })()").catch(() => ({}));
                if (st.s && st.s !== last) { phases.push([st.s, Math.round((Date.now() - t0) / 100) / 10]); last = st.s; }
                if (st.res && st.map) break;
                await t.wait(200);
            }
            const res = await t.json("window.__res");
            const rec = { mode, level, sekundy: Math.round((Date.now() - t0) / 100) / 10, wynik: res && { total: res.total, pay: res.pay, tips: res.tips, grade: res.grade, score: res.score, hours: res.hours }, phases };
            R.zmiany.push(rec);
            console.log(JSON.stringify(rec));
            save();
            await t.wait(1500);
        }
    } catch (e) { console.log("ERR", e && e.stack); R.blad = String(e && e.message); save(); }
    await t.b.close();
    process.exit(0);
})();
