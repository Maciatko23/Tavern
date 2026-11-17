const kit = require("../../../tests/lib/kit.js");
const path = require("path");
kit.test({ port: 9758, overlay: path.join(__dirname, "..", "staging"), overlayJs: true, lightGpu: true, bootCheck: "gra" }, async t => {
    await t.newGame({ map: 3, x: 50, y: 40, day: 40, hour: 12, quiet: true, minimap: false });
    console.log(await t.json(`JSON.stringify(Object.keys(TownQuests.Q.K3.steps[0]))`));
    console.log(await t.json(`JSON.stringify({ text: TownQuests.Q.K3.steps[0].text, where: TownQuests.Q.K3.where, keys: Object.keys(TownQuests.Q.K3) })`));
    await t.eval(`TownQuests.start("K3"); 0`);
    console.log(await t.json(`JSON.stringify(TownQuests.rec("K3"))`));
    console.log(await t.json(`JSON.stringify(Object.keys(TownQuests).slice(0,80))`));
});
