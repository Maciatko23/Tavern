// W17 "Jarmark Kruczogrodu": an honest A/B of the heaviest scenes at 4x CPU throttle, best of 3 (frames in 3 s), INTERLEAVED in one page:
// the same moment with the fair's things shown ("z") and with them taken away ("bez": the fair closed - Jarmark.S().zamkniecie = 1 - and the
// events hidden), so the machine's load hits both alike. The market at noon of a fair day (stage, stalls, lamps, barrels, troupe), the play at 19:05 of
// day 51 (the crowd of 8, the torches), the night at the bell tower with the chase running (Map220; Szept running, the hero's torch).
// On a day with no fair nothing of the thread is in the map (when(): no events injected) - the day 27 line shows it.
// Run: JARMARK_PERF_GO=1 CDP_PORT=9462 node tests/jarmark_perf.js     (the overlay of tools/jarmark before the install; the live game after)
if (process.env.JARMARK_PERF_GO !== "1") { console.log("(perf of W17: run with JARMARK_PERF_GO=1 CDP_PORT=<port>)"); process.exit(0); }
const fs = require("fs"), path = require("path");
const kit = require("./lib/kit.js");
const LIVE = /"name":"Jarmark"/.test(fs.readFileSync(path.join(__dirname, "..", "js", "tawerna_wtyczki.js"), "utf8"));
kit.test({ port: Number(process.env.CDP_PORT) || 9461, overlay: LIVE ? null : "tools/jarmark/overlay", overlayJs: !LIVE, bootCheck: "gra się uruchamia" }, async t => {
    const out = {};
    const meas = async () => {
        const n0 = await t.eval("Graphics.frameCount"), c0 = Date.now();
        await t.wait(3000);
        return ((await t.eval("Graphics.frameCount")) - n0) / ((Date.now() - c0) / 1000);
    };
    async function ab(label, on, off) {
        const z = [], b = [];
        for (let i = 0; i < 3; i++) {
            await t.eval(on); await t.frames(30); z.push(await meas());
            await t.eval(off); await t.frames(30); b.push(await meas());
        }
        const zb = Math.max(...z), bb = Math.max(...b);
        out[label] = { z: zb, bez: bb, roznica: (1 - zb / bb) * 100 };
        console.log("PERF " + label + ": z " + zb.toFixed(1) + " fps (" + z.map(x => x.toFixed(1)).join(", ") + ")  bez " + bb.toFixed(1) + " fps (" + b.map(x => x.toFixed(1)).join(", ") + ")  koszt " + ((1 - zb / bb) * 100).toFixed(1) + "%");
    }
    await t.b.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await t.newGame({ story: true, skipIntro: true, map: 220, x: 62, y: 68, dir: 8, day: 27, hour: 12.5, quiet: true, minimap: false });
    await t.frames(120);
    const ev27 = await t.json("$gameMap.events().filter(e => e.eventId() >= 4800 && e.eventId() < 5000).length");
    console.log("PERF dzień 27 (poza jarmarkiem): zdarzeń jarmarku na mapie " + ev27);
    const prep = "(function(){ const s = Jarmark.S(); s.zmus = 1; s.z = 1; s.otw = 1; s.prace.kramy = [0,1,2,3,4,5]; s.prace.lampy = [0,1,2,3,4,5,6,7]; s.prace.beczki = 1; s.prace.wydane = 1; s.zamkniecie = 0; })(); 0";
    const wlacz = "(function(){ Jarmark.S().zamkniecie = 0; Jarmark.api.crowd = true; Jarmark.odswiezMape(true); })(); 0";
    const wylacz = "(function(){ Jarmark.S().zamkniecie = 1; Jarmark.api.crowd = false; Jarmark.odswiezMape(true); })(); 0";
    await t.eval(prep); await t.setDay(50, 12.5); await t.calm(); await t.go(220, 62, 68, 8); await t.frames(200);
    await ab("jarmark pod wiatrakiem w południe (scena, 6 kramów, 8 lamp, beczki, trupa)", wlacz.replace("Jarmark.api.crowd = true", "Jarmark.api.crowd = false"), wylacz);
    await t.setDay(51, 19.05); await t.calm(); await t.go(220, 62, 68, 8); await t.frames(200);
    await ab("jarmark podczas sztuki (dzień 51, 19:05: tłum 8 osób, pochodnie, scena, trupa)", wlacz, wylacz);
    await t.eval("(function(){ Jarmark.S().zamkniecie = 0; Jarmark.S().przed.kradziez = 1; })(); 0");
    await t.setDay(52, 23.7); await t.calm(); await t.go(220, 17, 29, 8); await t.frames(120);
    await t.eval("Jarmark_Sceny.pogonStart(); 0");
    await t.until("Jarmark_Sceny.bieg.on", 60, 200); await t.frames(150);
    await ab("pościg uliczkami (Szept biegnie, sołtys, kapral, latarnie, pochodnia bohatera)", "Jarmark_Sceny.bieg.on = true; 0", "Jarmark_Sceny.bieg.on = false; 0");
    console.log("JSON " + JSON.stringify(out));
});
