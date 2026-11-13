// questy_mapa: czy kompas (CleanCompass.route) prowadzi do miejsc w kieszeniach i na przeniesionych miejscach z roznych map planszy.
//   node tools/questy_mapa/kompas_test.js   (nakladka)   NOOVERLAY=1 - gra jak jest
const kit = require("../../tests/lib/kit.js");
const path = require("path");
const OVERLAY = process.env.NOOVERLAY ? undefined : path.join(__dirname, "staging");
kit.test({ port: +(process.env.CDP_PORT || 9754), overlay: OVERLAY, overlayJs: !!OVERLAY, lightGpu: true, bootCheck: "gra", errorCheck: "bez bledow w konsoli", evalTimeout: 300000, beforeLoad: "window.WIDOK = false;" }, async t => {
    await t.newGame({ map: 3, x: 50, y: 40, day: 40, hour: 11, quiet: true, minimap: false });
    await t.eval("CleanCompass.loadAll(); 0");
    await t.until("CleanCompass.allLoaded()", 90, 500);
    const T = [["Pustelnia (kopiec 155)", 155, 70, 41], ["Urwisko (strażnica 157)", 157, 96, 54], ["Osada (Grum 120)", 120, 21, 25], ["Spalona zagroda (168)", 168, 89, 28],
        ["Menhiry (Łąka)", 4, 50, 78], ["Nora (Kruczy Jar)", 3, 95, 30], ["Mielerz (Łąka)", 4, 46, 24], ["Jagna (Kruczy Jar)", 3, 20, 75]];
    for (const [from, mx, my] of [[3, 50, 40], [8, 60, 45], [13, 30, 60]]) {
        await t.go(from, mx, my, 2);
        for (const [name, map, x, y] of T) {
            const r = await t.json(`JSON.stringify((function(){ const r = CleanCompass.route({ map: ${map}, x: ${x}, y: ${y} }); return r ? { pending: !!r.pending, steps: r.steps, to: r.to || null, via: r.via || null, keys: Object.keys(r) } : null; })())`);
            console.log("  z mapy " + from + " do " + name + ": " + r);
            t.check("kompas z " + from + " -> " + name, r !== "null" && !!r && !/"pending":true/.test(r));
        }
    }
});
