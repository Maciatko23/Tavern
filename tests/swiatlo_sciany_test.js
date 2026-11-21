// Światło płomienia nie przechodzi przez ściany (js/plugins/RoomLighting.js WallCut + Pokoje.lightArea, 2026-11-19, gracz: "a da się
// zrobić, żeby światło pochodni nie przechodziło poza ściany?"): pochodnia na ścianie piętra 1 (ziarno z zapisu gracza) nie rozjaśnia
// podłogi za ścianą, przed sobą tak; pochodnia w ręce tak samo; bez Pokoje (window.POKOJE = false) jak dawniej - światło przechodziło.
"use strict";
const kit = require("./lib/kit.js");
kit.test({ port: Number(process.env.CDP_PORT) || 9452, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    await t.newGame({ map: 1, x: 14, y: 35, day: 12, hour: 12, quiet: true, minimap: false });
    await t.eval("Underground.setSeed(2859706888); 0");
    await t.go(131, 15, 44, 2);
    await t.eval("window.Creatures && Creatures.auto && Creatures.auto(false); 0");
    // w stronie: ciemność (alfa warstwy ciemności 0-255) pod środkiem kratki; wycięcia od nowa
    await t.eval(`(() => {
        const set = () => SceneManager._scene._spriteset;
        window.__ciemno = (x, y) => {
            const s = set(), tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), k = 0.5;
            const px = Math.floor(((x - $gameMap.displayX()) + 0.5) * tw * k), py = Math.floor(((y - $gameMap.displayY()) + 0.5) * th * k);
            if (s._lgOn) { const t = s._lgDark, d = Graphics._app.renderer.extract.pixels(t.rt); return d[(py * t.w + px) * 4 + 3]; }
            return s._darknessSprite.bitmap.context.getImageData(px, py, 1, 1).data[3];
        };
        window.__odnow = () => { const s = set(); for (const h of s._roomHoles) delete h._wallCut; if (s._playerTorch) delete s._playerTorch._wallCut; s._darkKey = ""; };
        return 0;
    })()`);
    // pochodnia, której krąg sięga za ścianę: kratki podłogi w zasięgu, których płomień nie widzi
    const wybor = await t.json(`(() => {
        const s = SceneManager._scene._spriteset, tw = $gameMap.tileWidth(), out = [];
        const cv = document.createElement("canvas").getContext("2d");
        // (podłoga: nie szczyt ściany - skała w środku jest "przechodnia" w zestawie - i da się po niej chodzić)
        const floor = (x, y) => $gameMap.isValid(x, y) && !Tilemap.isWallTopTile($gameMap.tileId(x, y, 0)) && [2, 4, 6, 8].every(d => $gameMap.isPassable(x, y, d));
        const flames = s._roomHoles.filter(h => h.shape === "circle" && h.sprite._flicker);
        const areaOf = h => { const sp = h.sprite; return h.__area !== undefined ? h.__area : (h.__area = Pokoje.lightArea(sp._tileX + sp._offsetX / tw, sp._tileY + sp._offsetY / tw, sp._reach / tw)); };
        // (kratka, do której nie sięga żadne inne światło)
        const onlyThis = (h0, x, y) => flames.every(h => { if (h === h0) return true; const sp = h.sprite, lx = sp._tileX + sp._offsetX / tw, ly = sp._tileY + sp._offsetY / tw;
            if (Math.hypot(x + 0.5 - lx, y + 0.5 - ly) > sp._reach / tw) return true; const a = areaOf(h); return !a || !cv.isPointInPath(a, x + 0.5, y + 0.5); });
        for (const h of flames) {
            const sp = h.sprite;
            const lx = sp._tileX + sp._offsetX / tw, ly = sp._tileY + sp._offsetY / tw, path = areaOf(h);
            if (!path) continue;
            const r = h.radius / tw * 0.55, za = [], przed = [];
            for (let y = Math.floor(ly - r); y <= ly + r; y++) for (let x = Math.floor(lx - r); x <= lx + r; x++) {
                if (Math.hypot(x + 0.5 - lx, y + 0.5 - ly) > r || !floor(x, y)) continue;
                const inside = cv.isPointInPath(path, x + 0.5, y + 0.5);
                if (!inside && !onlyThis(h, x, y)) continue;
                (inside ? przed : za).push([x, y, Math.hypot(x + 0.5 - lx, y + 0.5 - ly)]);
            }
            if (za.length && przed.length) { za.sort((a, b) => a[2] - b[2]); przed.sort((a, b) => a[2] - b[2]); out.push({ id: sp._eventId, x: sp._tileX, y: sp._tileY, za: za[0], przed: przed[0], n: za.length }); }
        }
        out.sort((a, b) => b.n - a.n);
        return out.slice(0, 3);
    })()`);
    console.log("   pochodnie z kratkami za ścianą: " + JSON.stringify(wybor));
    t.check("jest pochodnia, której krąg sięga za ścianę", wybor.length > 0, wybor.length);
    if (!wybor.length) return;
    const p = wybor[0];
    // bohater przy niej (żeby była na ekranie); w dzień pod ziemią i tak ciemno
    await t.eval(`(() => { const [x, y] = ${JSON.stringify(p.przed)}; $gamePlayer.locate(x, y); return 0; })()`);
    await t.frames(30);
    const pelna = await t.json("Math.round(SceneManager._scene._spriteset._roomTimeOfDay.alpha * 255)");
    const zaW = await t.json(`__ciemno(${p.za[0]}, ${p.za[1]})`), przedW = await t.json(`__ciemno(${p.przed[0]}, ${p.przed[1]})`);
    await t.shot("out/swiatlo_sciany_pochodnia.png");
    // lico ściany z pochodnią oświetlone, skała (sufit) nad nim nie - światło kończy się na krawędzi ściany
    const sufit = await t.json(`(() => { const g = Pokoje.grid(); let y = ${p.y}; while (y > 0 && !g.rock[y * g.W + ${p.x}]) y--; return y; })()`);
    const lico = await t.json(`__ciemno(${p.x}, ${p.y})`), naSuficie = await t.json(`__ciemno(${p.x}, ${sufit})`);
    console.log("   ściana z pochodnią: lico " + lico + ", skała nad nim (y " + sufit + ") " + naSuficie);
    t.check("lico ściany z pochodnią oświetlone", lico < pelna - 60, [lico, pelna]);
    t.check("skała nad licem (sufit) nieoświetlona", naSuficie >= pelna - 3, [naSuficie, pelna]);
    await t.eval("window.POKOJE = false; __odnow(); 0");
    await t.frames(6);
    const zaBez = await t.json(`__ciemno(${p.za[0]}, ${p.za[1]})`);
    await t.shot("out/swiatlo_sciany_pochodnia_bez.png");
    await t.eval("window.POKOJE = undefined; __odnow(); 0");
    await t.frames(6);
    console.log("   ciemność: pełna " + pelna + ", za ścianą " + zaW + " (bez wycięcia " + zaBez + "), przed pochodnią " + przedW);
    t.check("przed pochodnią jasno", przedW < pelna - 60, [przedW, pelna]);
    t.check("za ścianą tyle ciemności, co bez żadnego światła", zaW >= pelna - 3, [zaW, pelna]);
    t.check("bez wycięcia światło przechodziło za ścianę (test coś mierzy)", zaBez < pelna - 20, [zaBez, pelna]);

    // pochodnia w ręce: w sali przy cienkiej ścianie (x 70), korytarz za nią (x 71)
    await t.eval("$gamePlayer.locate(69, 8); $gameSwitches.setValue(2, true); 0");
    await t.frames(30);
    const pelna2 = await t.json("Math.round(SceneManager._scene._spriteset._roomTimeOfDay.alpha * 255)");
    const reka = [await t.json("__ciemno(68, 8)"), await t.json("__ciemno(71, 8)")];
    await t.eval("window.POKOJE = false; __odnow(); 0"); await t.frames(6);
    const rekaBez = await t.json("__ciemno(71, 8)");
    await t.eval("window.POKOJE = undefined; __odnow(); 0"); await t.frames(6);
    console.log("   pochodnia w ręce: obok " + reka[0] + ", za ścianą " + reka[1] + " (bez wycięcia " + rekaBez + "), pełna " + pelna2);
    t.check("pochodnia w ręce: obok jasno", reka[0] < pelna2 - 60, reka[0]);
    t.check("pochodnia w ręce: za cienką ścianą ciemno", reka[1] >= pelna2 - 3, [reka[1], pelna2]);
    t.check("pochodnia w ręce: bez wycięcia przechodziła", rekaBez < pelna2 - 5, rekaBez);
    await t.shot("out/swiatlo_sciany_reka.png");
    // koszt: pochodnia w ręce w ruchu - co dziesiątą część kratki nowe wycięcie: promienie, dziura w ciemności, poświata
    const koszt = await t.json(`(() => {
        const W = Tawerna.api("LightWallCut"), s = SceneManager._scene._spriteset, o = {}, x0 = s._playerTorch.x, y0 = s._playerTorch.y, n = 60;
        const t0 = performance.now();
        let cuts = 0;
        for (let i = 0; i < n; i++) { const c = s.torchCut(o, x0 - 6 * (i % 30), y0); if (c) { cuts++; W.texture(W.hole(c, 0, 1, 60)); s._playerTorch.cutBy(c); } }
        return { ms: +((performance.now() - t0) / n).toFixed(3), cuts };
    })()`);
    console.log("   jedno wycięcie pochodni w ręce: " + koszt.ms + " ms (" + koszt.cuts + " wycięć)");
    t.check("pochodnia w ruchu: wycięcie tanie (<= 0.5 ms)", koszt.cuts > 40 && koszt.ms <= 0.5, koszt);
    await t.eval("$gameSwitches.setValue(2, false); 0");
    // ciemność podziemi (2026-11-20, "żeby w tych podziemiach było ciemno"): piętro 1 245; ręcznie robione piętra co najmniej tyle,
    // co ich pasmo, choć w pliku mapy mają mniej (10: 215 -> 245, 80: 240 -> 250)
    const ciemnosc = () => t.json("Math.round(SceneManager._scene._spriteset._roomTimeOfDay.alpha * 255)");
    const c1 = await ciemnosc();
    await t.go(140, 15, 12, 2); const c10 = await ciemnosc();
    await t.go(152, 17, 13, 2); const c80 = await ciemnosc();
    console.log("   ciemność: piętro 1 " + c1 + ", piętro 10 " + c10 + ", piętro 80 " + c80);
    t.check("podziemia ciemne: piętro 1 245, piętro 10 245, piętro 80 250", c1 === 245 && c10 === 245 && c80 === 250, [c1, c10, c80]);
});
