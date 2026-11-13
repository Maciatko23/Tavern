// Silhouettes and outlines: the shared per-sheet pixel cache (Sky.sheetPixels / Sky.sheetRect) behind Sky.silhouette, Cienie's silhouette and
// CharacterPolish's outline picture gives the SAME pictures, byte for byte, as the old way (a bitmap, a blt and a getImageData per frame).
// The old functions are kept below as a reference and run on the page (Cienie's from git HEAD). Also: a bitmap drawn on later is read
// again, the cache is bounded.
//   CDP_PORT=9491 node tests/sylwetki_test.js
"use strict";
const kit = require("./lib/kit.js");
const { execSync } = require("child_process");
const path = require("path");

// Cienie's old silhouette (with its strips) as committed: from "const STRIP_W" up to silhouetteOf
function cienieOld() {
    const src = execSync("git show HEAD:js/plugins/Cienie.js", { cwd: path.join(__dirname, ".."), maxBuffer: 1 << 26 }).toString().replace(/\r\n/g, "\n");
    const a = src.indexOf("    const STRIP_W"), b = src.indexOf("    function silhouetteOf");
    if (a < 0 || b < a) throw new Error("Cienie.js at HEAD has another shape");
    return "(function(){ const PAD = 4, silCache = new Map();\n" + src.slice(a, b) + "\nwindow.__sylCienie = silhouette; return 1; })()";
}

// the old algorithms, copied as they were before 2026-11-12
const OLD = `(function(){
    const SHADOW_PAD = 4, OUTLINE_RGB = [0.09, 0.05, 0.03], OUTLINE_A = 0.8;
    function oldOutline(src, f) {
        const w = f.width, h = f.height, tmp = new Bitmap(w, h);
        tmp.blt(src, f.x, f.y, w, h, 0, 0);
        const d = tmp.context.getImageData(0, 0, w, h).data;
        tmp.destroy();
        const alpha = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[(y * w + x) * 4 + 3]);
        const out = new Bitmap(w + 2, h + 2);
        const img = out.context.createImageData(w + 2, h + 2), o = img.data, R = Math.round(OUTLINE_RGB[0] * 255), G = Math.round(OUTLINE_RGB[1] * 255),
            B = Math.round(OUTLINE_RGB[2] * 255);
        for (let Y = 0; Y < h + 2; Y++) {
            for (let X = 0; X < w + 2; X++) {
                const x = X - 1, y = Y - 1, a = Math.max(alpha(x - 1, y), alpha(x + 1, y), alpha(x, y - 1), alpha(x, y + 1));
                if (!a) continue;
                const i = (Y * (w + 2) + X) * 4;
                o[i] = R; o[i + 1] = G; o[i + 2] = B; o[i + 3] = Math.round(OUTLINE_A * a);
            }
        }
        out.context.putImageData(img, 0, 0);
        out._baseTexture.update();
        out.smooth = src.smooth;
        return out;
    }
    function oldSilhouette(src, sx, sy, pw, ph, skipPainted, blurPx) {
        const tmp = new Bitmap(pw, ph);
        tmp.blt(src, sx, sy, pw, ph, 0, 0);
        const img = tmp.context.getImageData(0, 0, pw, ph), d = img.data;
        let painted = 0, footRow = -1;
        for (let y = 0; y < ph; y++) {
            for (let x = 0; x < pw; x++) {
                const i = (y * pw + x) * 4;
                if (y >= ph * 0.7 && d[i + 3] > 0 && d[i + 3] < 230 && d[i] + d[i + 1] + d[i + 2] < 240) painted++;
                if (d[i + 3] > 128) footRow = y;
            }
        }
        let out = null;
        if (footRow >= 0 && !(skipPainted && painted >= 15)) {
            let left = pw, right = -1;
            for (let y = Math.max(0, footRow - 5); y <= footRow; y++) {
                for (let x = 0; x < pw; x++) if (d[(y * pw + x) * 4 + 3] > 128) { left = Math.min(left, x); right = Math.max(right, x); }
            }
            for (let i = 0; i < d.length; i += 4) { d[i] = d[i + 1] = d[i + 2] = 0; }
            tmp.context.putImageData(img, 0, 0);
            out = new Bitmap(pw + 2 * SHADOW_PAD, ph + 2 * SHADOW_PAD);
            const ctx = out.context;
            ctx.filter = "blur(" + (blurPx !== undefined ? blurPx : ph > 80 ? 2 : 1.2) + "px)";
            ctx.drawImage(tmp.canvas, SHADOW_PAD, SHADOW_PAD);
            ctx.filter = "none";
            out._baseTexture.update();
            out.smooth = true;
            out._footRow = footRow;
            out._footX = (left + right + 1) / 2;
        }
        tmp.destroy();
        return out;
    }
    const load = name => new Promise(res => { const b = ImageManager.loadCharacter(name); const iv = setInterval(() => { if (b.isReady() || b.isError()) { clearInterval(iv); res(b); } }, 20); });
    const same = (a, b) => { if (!a || !b) return a === b; if (a.width !== b.width || a.height !== b.height) return false;
        const x = a.context.getImageData(0, 0, a.width, a.height).data, y = b.context.getImageData(0, 0, b.width, b.height).data;
        for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return false; return true; };
    window.__syl = { oldOutline, oldSilhouette, load, same };
    return 1;
})()`;

// frames of a sheet: cols x rows cells (or square cells of a given size), a spread of them
const RUN = (name, cols, rows, cell) => `(async function(){
    const S = window.__syl, b = await S.load(${JSON.stringify(name)}), O = Tawerna.api("Outline"), Sk = Tawerna.api("Sun");
    const cw = ${cell ? cell : "Math.floor(b.width / " + cols + ")"}, ch = ${cell ? cell : "Math.floor(b.height / " + rows + ")"};
    const nc = Math.max(1, Math.floor(b.width / cw)), nr = Math.max(1, Math.floor(b.height / ch));
    let n = 0, bad = [], nulls = 0, cold = [];
    for (let r = 0; r < nr; r += Math.max(1, Math.floor(nr / 6))) for (let c = 0; c < nc; c += Math.max(1, Math.floor(nc / 8))) {
        const f = { x: c * cw, y: r * ch, width: cw, height: ch };
        const oo = S.oldOutline(b, f), t0 = performance.now(), no = O.bitmap(b, f);
        cold.push(performance.now() - t0);
        if (!S.same(oo, no) || oo.smooth !== no.smooth) bad.push("outline " + c + "," + r);
        for (const [sp, bl] of [[false, undefined], [true, undefined], [false, 0.5]]) {
            const os = S.oldSilhouette(b, f.x, f.y, cw, ch, sp, bl), ns = Sk.silhouette(b, f.x, f.y, cw, ch, sp, bl);
            if (!os !== !ns) { bad.push("silhouette existence " + c + "," + r + "," + sp); continue; }
            if (!os) { nulls++; continue; }
            if (!S.same(os, ns) || os._footRow !== ns._footRow || os._footX !== ns._footX || ns.smooth !== true || !ns._key) bad.push("silhouette " + c + "," + r + "," + sp + "," + bl);
        }
        for (const feet of [false, true]) {
            const oc = window.__sylCienie(b, f.x, f.y, cw, ch, feet), nc2 = Cienie.silhouette(b, f.x, f.y, cw, ch, feet);
            if (!oc !== !nc2) { bad.push("cienie existence " + c + "," + r + "," + feet); continue; }
            if (!oc) continue;
            if (!S.same(oc, nc2) || oc._footRow !== nc2._footRow || oc._footX !== nc2._footX || oc._key !== nc2._key || JSON.stringify(oc._strips) !== JSON.stringify(nc2._strips)) bad.push("cienie " + c + "," + r + "," + feet);
        }
        n++;
    }
    return JSON.stringify({ name: ${JSON.stringify(name)}, size: [b.width, b.height], frames: n, bad, nulls, outlineColdMax: +Math.max(...cold).toFixed(2) });
})()`;

kit.test({ port: Number(process.env.CDP_PORT) || 9491, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 300000 }, async t => {
    await t.newGame({ map: 8, x: 50, y: 53, hour: 12, day: 40, quiet: true, minimap: false });
    await t.eval(OLD);
    await t.eval(cienieOld());
    t.check("the plugins export the pixel cache, the outline and Cienie's silhouette", await t.json(`!!Tawerna.api("Sun").sheetPixels && !!Tawerna.api("Sun").sheetRect && !!Tawerna.api("Outline") && !!Cienie.silhouette`));
    const sheets = [
        ["$Human_Archer", 3, 4], ["$Cr_Armor", 3, 4], ["Hero_Walk", 3, 4], ["anim8/Cr_SkSword_Walk8", 0, 0, 96], ["!$Big_Trees_green", 1, 1], ["!$Big_Trees_green", 3, 2], ["!$Boulder_A", 1, 1],
    ];
    for (const [name, c, r, cell] of sheets) {
        const res = JSON.parse(await t.eval(RUN(name, c, r, cell)));
        console.log("   ", JSON.stringify(res));
        t.check(name + ": outline and both silhouettes byte-identical to the old way (" + res.frames + " frames, " + res.nulls + " empty)", res.frames > 0 && res.bad.length === 0, res);
    }
    // frames partly or wholly outside the sheet
    const edge = JSON.parse(await t.eval(`(async function(){ const S = window.__syl, b = await S.load("$Human_Archer"), O = Tawerna.api("Outline"), Sk = Tawerna.api("Sun"), bad = [];
        for (const f of [{ x: b.width - 10, y: 5, width: 30, height: 40 }, { x: -7, y: -9, width: 40, height: 50 }, { x: 5, y: b.height - 12, width: 36, height: 48 }, { x: b.width + 5, y: 0, width: 20, height: 20 }]) {
            if (!S.same(S.oldOutline(b, f), O.bitmap(b, f))) bad.push("outline " + JSON.stringify(f));
            const os = S.oldSilhouette(b, f.x, f.y, f.width, f.height, false), ns = Sk.silhouette(b, f.x, f.y, f.width, f.height, false);
            if (!os !== !ns || (os && (!S.same(os, ns) || os._footRow !== ns._footRow || os._footX !== ns._footX))) bad.push("silhouette " + JSON.stringify(f));
        }
        return JSON.stringify(bad); })()`));
    t.check("frames partly outside the sheet are identical too", edge.length === 0, edge);
    // a bitmap drawn on later is read again; an untouched one is read once
    const dirty = JSON.parse(await t.eval(`(async function(){ const Sk = Tawerna.api("Sun"), b = new Bitmap(16, 16);
        b.fillRect(0, 0, 16, 16, "#ff0000");
        const p1 = Sk.sheetPixels(b), p1b = Sk.sheetPixels(b);
        b.clearRect(0, 0, 8, 16);
        const p2 = Sk.sheetPixels(b);
        return JSON.stringify({ same: p1 === p1b, reread: p2 !== p1, a1: p1.data[3], a2: p2.data[3], a3: p2.data[8 * 4 + 3] }); })()`));
    t.check("the same bitmap untouched gives the same read; drawn on later it is read again", dirty.same && dirty.reread && dirty.a1 === 255 && dirty.a2 === 0 && dirty.a3 === 255, dirty);
    // bounded
    const bound = JSON.parse(await t.eval(`(function(){ const Sk = Tawerna.api("Sun"), keep = []; let ok = true;
        for (let i = 0; i < 20; i++) { const b = new Bitmap(1500, 1500); b.fillRect(0, 0, 10, 10, "#fff"); keep.push(b); if (!Sk.sheetPixels(b)) ok = false; }
        const first = Sk.sheetPixels(keep[0]), last = Sk.sheetPixels(keep[19]);
        return JSON.stringify({ ok, last: !!last, firstStillFine: !!first && first.w === 1500 }); })()`));
    t.check("many big sheets: still answered (the oldest go, bounded to 48 MB)", bound.ok && bound.last && bound.firstStillFine, bound);
    // what the town draws
    await t.frames(60);
    const town = JSON.parse(await t.eval(`(function(){ const S = window.__syl, set = SceneManager._scene._spriteset, bad = []; let n = 0;
        for (const s of set._characterSprites) { const ol = s._outlineSprite; if (!ol || !ol._on || !ol.bitmap || !s._frame) continue; n++;
            if (!S.same(S.oldOutline(s.bitmap, s._frame), ol.bitmap)) bad.push(s._characterName); }
        return JSON.stringify({ n, bad }); })()`));
    t.check("the people on the town screen: their drawn outline is the old one", town.n > 0 && town.bad.length === 0, town);
});
