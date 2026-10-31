// średnia jasność kadru sali dla wariantów przełączników (diagnoza): node tools/tavern/przytulna/jasnosc.js
const path = require("path"), fs = require("fs"), os = require("os");
process.env.CDP_PORT = process.env.CDP_PORT || "9380";
const kit = require(path.join(__dirname, "..", "..", "..", "tests", "lib", "kit.js"));
const { PNG } = (() => { try { return require("pngjs"); } catch (e) { return {}; } })();
const VARS = [["off", "false", []], ["on", "true", []], ["bez nastroju", "true", ["nastroj"]], ["bez blasku", "true", ["blask"]], ["bez swiatla", "true", ["swiatlo"]], ["tylko swiatlo", "true", ["nastroj", "blask"]]];
kit.test({ port: Number(process.env.CDP_PORT), overlay: "tools/tavern/przytulna/overlay", bootCheck: "boot" }, async t => {
    for (const [name, v, bez] of VARS) {
        await t.eval(`window.PRZYTULNA = ${v}; window.PRZYTULNA_BEZ = ${JSON.stringify(bez)}; 0`);
        await t.newGame({ map: 1, x: 50, y: 34, day: 40, hour: 20.2, minimap: false, quiet: true });
        await t.eval("(function(){ const sc = SceneManager._scene; for (const c of sc.children) if (c !== sc._spriteset) c.visible = false; return 0; })()");
        await t.frames(200);
        const f = path.join(os.tmpdir(), "przyt_" + VARS.findIndex(v => v[0] === name) + ".png"); await t.shot(f); console.log(name, f);
    }
});
