// KONTRAKT KRAWĘDZI w grze (styki świata): pomiar każdej mapy świata (kratki krawędzi: chodliwe, w głównym obszarze, otwarte dla Krawedzie.js albo nie)
// + prawdziwe przejścia klawiszami w obie strony na próbce styków (tools/swiat/styki/staging/ogon_styki.json), także przy nowych mapach 960-964.
// Statyczny odpowiednik: python tools/mapy/swiat_styki.py. Wyjątki fabularne: 13 -> 175 (wspinaczka), 162 <-> 165 (łacha), 175 <-> 934/120/962 (uszczelnione).
// GAME_OVERLAY=tools/swiat/styki/staging GAME_OVERLAY_JS=1 CDP_PORT=9396 node tests/swiat_styki_test.js      Zdjęcia: docs/swiat_styki/
const kit = require("./lib/kit.js");
const fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, "..", "docs", "swiat_styki");
fs.mkdirSync(OUT, { recursive: true });
const LINKS = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "tools", "swiat", "styki", "staging", "ogon_styki.json"), "utf8")).linki;
const WYJATKI = [[13, 175], [175, 13], [175, 934], [934, 175], [175, 120], [120, 175], [162, 165], [165, 162]];
kit.test({ port: Number(process.env.CDP_PORT) || 9396, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, minimap: false });
    await t.frames(10);
    const ids = await t.json(`Object.keys(SwiatData.maps).map(Number)`);
    t.check("każda mapa świata ma plik (żadna kratka nie prowadzi do mapy bez pliku)", await t.json(`Object.keys(SwiatData.maps).every(k => !!$dataMapInfos[k])`) && !ids.includes(936));
    t.check("nowe mapy 960-964 w świecie", [960, 961, 962, 963, 964].every(i => ids.includes(i)), ids);
    // ---- pomiar: żadnej niewidzialnej ściany ani lądu donikąd (po stronie mapy; sąsiad: statyczny swiat_styki.py)
    let zle = 0; const szczegoly = []; const wyjscia = {};      // wyjscia: {mapa: [cele zdarzeń przejścia na krawędziach, bez tych w warunku]}
    for (const id of ids) {
        await t.go(id, 3, 3, 2);
        await t.frames(8); for (let k = 0; k < 20 && (await t.json("$gameMap.mapId()")) !== id; k++) await t.frames(30);
        const r = await t.json(`(function(){ const id = ${id}; if ($gameMap.mapId() !== id) return null;
            const sw = SwiatData, me = sw.maps[id], W = $gameMap.width(), H = $gameMap.height(), [x0, y0] = me;
            const pass = (x, y, d) => $gameMap.isPassable(x, y, d), D = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] }, R = { 2: 8, 8: 2, 4: 6, 6: 4 };
            const comp = new Int32Array(W * H).fill(-1), sizes = [];
            for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
                if (comp[y * W + x] >= 0 || ![2, 4, 6, 8].some(d => pass(x, y, d))) continue;
                const c = sizes.length; let n = 0; const st = [[x, y]]; comp[y * W + x] = c;
                while (st.length) { const [a, b] = st.pop(); n++; for (const d of [2, 4, 6, 8]) { const u = a + D[d][0], v = b + D[d][1];
                    if (u < 0 || v < 0 || u >= W || v >= H || comp[v * W + u] >= 0 || !pass(a, b, d) || !pass(u, v, R[d])) continue; comp[v * W + u] = c; st.push([u, v]); } }
                sizes.push(n); }
            const owner = (wx, wy) => { for (const k of Object.keys(sw.maps)) { const [bx, by, bw, bh] = sw.maps[k]; if (+k !== id && wx >= bx && wx < bx + bw && wy >= by && wy < by + bh) return +k; } return 0; };
            const bad = [], ex = [];
            for (const side of ["N", "S", "W", "E"]) { const list = Krawedzie.exitsOn(side); for (const o of list) if (!o.gated) ex.push(o.cmd[1]); const n = side === "N" || side === "S" ? W : H;
                for (let i = 0; i < n; i++) {
                    const x = side === "W" ? 0 : side === "E" ? W - 1 : i, y = side === "N" ? 0 : side === "S" ? H - 1 : i;
                    if (!([2, 4, 6, 8].some(d => pass(x, y, d))) || $gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority() && !e.isThrough()) || sizes[comp[y * W + x]] < 40) continue;
                    const wx = side === "W" ? x0 - 1 : side === "E" ? x0 + W : x0 + x, wy = side === "N" ? y0 - 1 : side === "S" ? y0 + H : y0 + y;
                    const b = owner(wx, wy), along = side === "W" || side === "E" ? y : x, alongW = side === "W" || side === "E" ? wy : wx;
                    if (list.some(o => Math.abs((side === "W" || side === "E" ? o.ev.y : o.ev.x) - along) <= 3 && o.cmd[1] !== b)) continue;   // własne wyjście miejsca
                    const open = b > 0 && (list.some(o => o.cmd[1] === b) || sw.links.some(l => l.a === id && l.b === b && l.side === side && alongW >= l.from && alongW <= l.to));
                    if (!open) bad.push([side, i, b]); } }
            return { bad, ex }; })()`, 60000);
        if (!r) { t.check(`mapa ${id} wczytana`, false); continue; }
        wyjscia[id] = r.ex;
        const bad = r.bad.filter(([side, i, b]) => !WYJATKI.some(([p, q]) => p === id && q === b));
        if (bad.length) { zle += bad.length; szczegoly.push({ id, n: bad.length, przyklad: bad.slice(0, 4) }); }
    }
    t.check("kontrakt krawędzi: 0 chodliwych kratek krawędzi bez przejścia (niewidzialna ściana / ląd donikąd)", zle === 0, { zle, szczegoly });
    // ---- OSIĄGALNOŚĆ PIESZO z mapy 8 (SwiatData.links + zdarzenia przejść na krawędziach poza tymi w warunku; bez wyjątków 13<->175, 162<->165):
    // 175, 931, 935 (tylko wspinaczka orła) i 165 (tylko łacha w odpływie) NIE mogą być osiągalne, każda inna mapa świata MUSI
    const links = await t.json("SwiatData.links");
    const wyj = (a, b) => WYJATKI.some(([p, q]) => p === a && q === b);
    const graf = {}; const dodaj = (a, b) => { if (wyj(a, b) || !ids.includes(a) || !ids.includes(b)) return; (graf[a] = graf[a] || new Set()).add(b); };
    for (const l of links) dodaj(l.a, l.b);
    for (const [a, cele] of Object.entries(wyjscia)) for (const b of cele) dodaj(Number(a), b);
    const widziane = new Set([8]); const stos = [8];
    while (stos.length) { const u = stos.pop(); for (const v of (graf[u] || [])) if (!widziane.has(v)) { widziane.add(v); stos.push(v); } }
    const ZAKAZANE = [175, 931, 935, 165];
    t.check("osiągalność pieszo z mapy 8: 175, 931, 935 i 165 NIEosiągalne", ZAKAZANE.every(i => !widziane.has(i)), ZAKAZANE.filter(i => widziane.has(i)));
    t.check("osiągalność pieszo z mapy 8: każda inna mapa świata osiągalna", ids.filter(i => !ZAKAZANE.includes(i)).every(i => widziane.has(i)), ids.filter(i => !ZAKAZANE.includes(i) && !widziane.has(i)));
    // ---- prawdziwe przejścia klawiszami
    const maps = await t.json(`SwiatData.maps`);
    const at = () => t.json(`({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y })`);
    const KEY = { N: "up", S: "down", W: "left", E: "right" }, OPP = { N: "S", S: "N", E: "W", W: "E" };
    async function pass(a, side, pos, b, shot) {
        const [x0, y0, w, h] = maps[a];
        const ex = side === "W" ? 0 : side === "E" ? w - 1 : pos - x0, ey = side === "N" ? 0 : side === "S" ? h - 1 : pos - y0;
        await t.newGame({ map: a, x: ex, y: ey, day: 12, hour: 11, quiet: true, minimap: false });
        await t.frames(30);
        await t.eval(`(function(){ const ex = ${ex}, ey = ${ey}; let best = null;
            for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) { const x = ex + dx, y = ey + dy; if (!$gameMap.isValid(x, y)) continue;
                const edge = ${JSON.stringify(side)}; const ok = edge === "W" ? x <= 1 : edge === "E" ? x >= $gameMap.width() - 2 : edge === "N" ? y <= 1 : y >= $gameMap.height() - 2;
                if (!ok || ![2, 4, 6, 8].some(d => $gameMap.isPassable(x, y, d))) continue; const d = Math.hypot(dx, dy); if (!best || d < best[0]) best = [d, x, y]; }
            if (best) $gamePlayer.locate(best[1], best[2]); return 0; })()`);
        await t.frames(10);
        const start = await at();
        let p = start;
        for (let i = 0; i < 25 && p.map === a; i++) { await t.hold(KEY[side], 12); p = await at(); }
        await t.frames(30); p = await at();
        if (shot) await t.shot(path.join(OUT, `przejscie_${a}_${b}.png`));
        const [bx, by] = maps[b];
        const along = side === "N" || side === "S" ? bx + p.x : by + p.y;
        t.check(`${a} ${side} -> ${b}: ta sama kratka świata (${along} ~ ${pos})`, p.map === b && Math.abs(along - pos) <= 3, { start, p });
    }
    const nowe = [960, 961, 962, 963, 964];
    const prob = LINKS.filter(l => nowe.includes(l.a) || nowe.includes(l.b)).slice(0, 10)
        .concat(LINKS.filter(l => [[4, 900], [17, 20], [159, 900], [4, 159], [21, 914]].some(([p, q]) => (l.a === p && l.b === q))).slice(0, 5));
    for (const l of prob) {
        const mid = Math.floor((l.from + l.to) / 2);
        await pass(l.a, l.side, mid, l.b, nowe.includes(l.a) || nowe.includes(l.b));
        await pass(l.b, OPP[l.side], mid, l.a, false);
    }
});
