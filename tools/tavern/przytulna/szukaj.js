// szukanie źródła plamy w kadrze: chowa po kolei dzieci sceny i tilemapy, mierzy jasność prostokąta (domyślnie pas plamy w kadrze „kominek”)
const path = require("path"), fs = require("fs"), os = require("os");
process.env.CDP_PORT = process.env.CDP_PORT || "9380";
const kit = require(path.join(__dirname, "..", "..", "..", "tests", "lib", "kit.js"));
kit.test({ port: Number(process.env.CDP_PORT), overlay: "tools/tavern/przytulna/overlay", bootCheck: "boot" }, async t => {
    await t.eval("window.PRZYTULNA = true; 0");
    await t.newGame({ map: 1, x: 50, y: 34, day: 40, hour: 20, minimap: false });
    await t.go(1, 50, 34, 8);
    await t.eval("$gamePlayer.locate(57, 32); $gamePlayer.center(57, 32); $gameSystem.setDayNightHour(20.2); const sc = SceneManager._scene; for (const c of sc.children) if (c !== sc._spriteset) c.visible = false; 0");
    await t.frames(200);
    const shot = async name => { const f = path.join(os.tmpdir(), "szukaj_" + name + ".png"); await t.shot(f); return f; };
    const names = await t.json(`(function(){ const ss = SceneManager._scene._spriteset, o = []; ss.children.forEach((c, i) => o.push(["ss", i, c.constructor.name, c.children ? c.children.length : 0])); ss._tilemap.children.forEach((c, i) => { if (c.constructor.name !== "Sprite_Character") o.push(["tm", i, c.constructor.name, c.children ? c.children.length : 0]); }); return o; })()`);
    const out = [];
    await shot("base");
    for (const [w, i, n, k] of names) {
        const get = w === "ss" ? "ss.children[" + i + "]" : "ss._tilemap.children[" + i + "]";
        const vis = await t.json(`(function(){ const ss = SceneManager._scene._spriteset, c = ${get}; if (!c || c.visible === false) return null; c.visible = false; return true; })()`);
        if (!vis) continue;
        await t.frames(4);
        await shot(w + i);
        await t.eval(`(function(){ const ss = SceneManager._scene._spriteset; ${get}.visible = true; return 0; })()`);
        await t.frames(2);
        out.push([w + i, n, k]);
    }
    fs.writeFileSync(path.join(os.tmpdir(), "szukaj_lista.json"), JSON.stringify(out));
    console.log("zapisano", out.length);
});
