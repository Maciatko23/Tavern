const kit = require("./lib/kit.js");
kit.test({ port: 9452, bootCheck: "boot" }, async t => {
    await t.newGame({ map: 218, x: 58, y: 58, day: 12, hour: 11, quiet: true, minimap: false });
    await t.frames(200);
    console.log(JSON.stringify(await t.json(`(() => { const g = Ziemia.geometry(); const W = g.W, out = {};
        for (const [x, y] of [[53,60],[52,61],[54,60]]) { const i = y*W+x, slot = g.painted.get(i); if (slot === undefined) { out[x+','+y] = 'none'; continue; }
          const s = typeof slot === 'object' ? slot.slot : slot; const a = g.atlases[Math.floor(s/100)], l = s % 100, sx = (l%10)*48, sy = Math.floor(l/10)*48;
          const d = a.bm.context.getImageData(sx, sy, 48, 48).data; const col = []; for (let c = 0; c < 48; c += 8) { let e = 0; for (let r = 0; r < 48; r++) { const q = (r*48+c)*4; if (d[q] > d[q+1]) e++; } col.push(e); }
          const row = []; for (let r = 0; r < 48; r += 8) { let e = 0; for (let c = 0; c < 48; c++) { const q = (r*48+c)*4; if (d[q] > d[q+1]) e++; } row.push(e); }
          out[x+','+y] = { slotType: typeof slot, earthByCol: col, earthByRow: row }; }
        return out; })()`)));
});
