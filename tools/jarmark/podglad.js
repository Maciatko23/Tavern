// podglad.js - zdjęcia fragmentów Map008 (do projektowania kamienic jarmarku). CDP_PORT=9460 node tools/jarmark/podglad.js x0 y0 x1 y1 plik [overlay]
const path = require("path");
const kit = require("../../tests/lib/kit.js");
const [x0, y0, x1, y1, out, ov] = process.argv.slice(2);
const OVER = ov ? { overlay: ov, overlayJs: true } : {};
kit.test(Object.assign({ port: 9460 }, OVER), async t => {
    await t.newGame({ map: 8, x: Number(x0), y: Number(y0), hour: 12, quiet: true, minimap: false });
    await t.eval(`(function(){ $gamePlayer.setThrough(true); $gamePlayer.setTransparent(true); const w=${x1}-${x0}+1, h=${y1}-${y0}+1; const sc=Math.min(Graphics.width/(w*48), Graphics.height/(h*48), 1);
        window.__z = sc; $gameScreen._zoomScale = sc; $gameScreen._zoomX = 0; $gameScreen._zoomY = 0; $gameMap.setDisplayPos(${x0}, ${y0}); return 0; })()`);
    await t.frames(40);
    await t.eval(`(function(){ $gameMap.setDisplayPos(${x0}, ${y0}); return 0; })()`);
    await t.frames(10);
    await t.shot(path.resolve(out));
});
