// lista postaci w sali o 20:00 z podróżnymi: node tools/tavern/przytulna/goscie.js
const path = require("path");
process.env.CDP_PORT = process.env.CDP_PORT || "9380";
const kit = require(path.join(__dirname, "..", "..", "..", "tests", "lib", "kit.js"));
kit.test({ port: Number(process.env.CDP_PORT), overlay: process.env.OVL || "tools/tavern/przejscia/overlay", bootCheck: "boot" }, async t => {
    await t.eval("window.PRZYTULNA = false; 0");
    await t.newGame({ map: 1, x: 50, y: 34, day: 40, hour: 20, minimap: false });
    await t.eval(`(function(){ for (const k of ["tobiasz", "kartograf", "grajek", "kompania"]) { try { Podroznicy.przyplyn(k); } catch (e) {} } try { Podroznicy.przyplyn("pula"); } catch (e) {} return 0; })()`);
    await t.go(1, 50, 34, 8);
    await t.frames(240);
    const r = await t.json(`$gameMap.events().filter(e => e.characterName() && e.characterName()[0] !== "!" && e.x > 35 && e.x < 85 && e.y > 26 && e.y < 45).map(e => [e.eventId(), e.characterName(), e.x, e.y, e.direction(), e.isMoving(), e.event().name.slice(0, 24)])`);
    for (const x of r) console.log(JSON.stringify(x));
});
