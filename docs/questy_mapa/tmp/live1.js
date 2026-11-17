const kit = require("../../../tests/lib/kit.js");
kit.test({ port: 9743 }, async t => {
    await t.newGame({ map: 8, x: 60, y: 60, quiet: true, minimap: false, hour: 10, day: 20 });
    console.log("ready", JSON.stringify(await t.json("Wyspa.readyMaps()")));
    console.log("api", JSON.stringify(await t.json("({ cys: typeof Cysterna, w: typeof Wrak, k: typeof Kruk, p: typeof Pustelnia, l: typeof Latarnia, g: typeof Garnizon })")));
    console.log("wrak flags", JSON.stringify(await t.json("(function(){ try { return { boat: Wrak.state ? Object.keys(Wrak.state()) : null } } catch(e){ return String(e) } })()")));
    t.check("done", true);
});
