// Pomiar 2: (a) piętra podziemi 1-99 z generatora gry (droga schody-schody, stwory, skrzynie, zapiski) dla dwóch ziaren,
// (b) prawdziwe przejście kilku pięter (chód, bez stworów) - realny czas od schodów w górę do schodów w dół,
// (c) długości dróg na mapach wyspy, gór, miasteczka, piwnicy (Dijkstra po polach, bez chodzenia).
//   CDP_PORT=9540 node tools/pomiar_czasu/pomiar2.js        (wyniki: tools/pomiar_czasu/pomiar2.json)
"use strict";
const fs = require("fs"), path = require("path");
const kit = require("../../tests/lib/kit.js");
const WALKER = fs.readFileSync(path.join(__dirname, "walker.js"), "utf8");
const OUT = path.join(__dirname, "pomiar2.json");
const R = { when: new Date().toISOString() };
const save = () => fs.writeFileSync(OUT, JSON.stringify(R, null, 1));

(async () => {
    const t = await kit.open({ port: Number(process.env.CDP_PORT) || 9540 });
    try {
        await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, hour: 9 });
        // ---- (a) piętra z generatora
        const floors = async () => t.json(`(function(){
            const U = Underground, out = [];
            for (let f = 1; f <= 99; f++) {
                const v = U.verify(f), hm = U.handmadeOf(f);
                let cr = 0, loot = 0, notes = 0, boss = 0, rocks = 0, w = 0, h = 0;
                const got = U.floorData ? U.floorData(f) : null;
                const evs = got ? got.map.events : (hm ? ($dataMapInfos[hm] ? [] : []) : []);
                if (got) { w = got.map.width; h = got.map.height; }
                for (const e of evs) { if (!e) continue; const s = JSON.stringify(e);
                    if (/Stwor:boss/.test(s)) boss++; else if (/Stwor:/.test(s)) cr++;
                    if (/<Lup:/.test(s)) loot++; if (/<Zapiski>|Zapiski/.test(e.name || "") || /<Zapiski>/.test(s)) notes++; if (/Rock_/.test(s)) rocks++; }
                out.push({ f, hm, ok: v.ok, steps: v.steps || null, why: v.why || "", cr, boss, loot, notes, rocks, w, h });
            }
            return { seed: U.seed(), floors: out };
        })()`, 120000);
        R.pietra = [await floors()];
        await t.eval("Underground.setSeed(987654321); 0");
        R.pietra.push(await floors());
        await t.eval("Underground.setSeed(" + R.pietra[0].seed + "); 0");
        console.log("piętra: ziarna", R.pietra.map(p => p.seed).join(", "));
        save();

        // ---- (b) prawdziwe przejście pięter (bez stworów i rywala; chód) i droga 8-kierunkowa
        await t.eval("Underground.open(); 0");
        R.przejscia = [];
        for (const f of [1, 5, 11, 25, 45, 77, 95]) {
            const up = await t.json(`Underground.landing(${f}, "up")`), down = await t.json(`Underground.landing(${f}, "down")`);
            if (!up || !down) { R.przejscia.push({ f, why: "no landing" }); continue; }
            const ok = await t.go(up[0], up[1], up[2], 2);
            await t.quiet();
            await t.eval(WALKER);
            await t.eval("$gameSystem.setStamina && $gameSystem.setStamina(100); 0");
            const d8 = await t.eval(`WALK.dist(${down[1]}, ${down[2]})`);
            const tw = Date.now();
            await t.eval(`WALK.go(${down[1]}, ${down[2]}, false)`);
            await t.until("!WALK.busy", 300, 100);
            const res = await t.json("WALK.state().res");
            const rec = { f, map: up[0], from: up.slice(1), to: down.slice(1), arrived: ok, d8, sekundy: Math.round((Date.now() - tw) / 100) / 10, res };
            R.przejscia.push(rec);
            console.log(JSON.stringify(rec));
            save();
        }

        // ---- (c) drogi na mapach (Dijkstra; start = pole wejścia, cel = pole przejścia / miejsce)
        const ROUTES = [
            [8, 23, 17, 0, 50, "miasteczko: tawerna -> brama zachodnia (Podgrodzie)"],
            [8, 23, 17, 25, 33, "miasteczko: tawerna -> studnia na rynku"],
            [8, 23, 17, 48, 31, "miasteczko: tawerna -> dzwonnica"],
            [8, 23, 17, 47, 40, "miasteczko: tawerna -> ratusz"],
            [8, 23, 17, 12, 47, "miasteczko: tawerna -> dom kowala"],
            [8, 23, 17, 10, 40, "miasteczko: tawerna -> kantor"],
            [8, 23, 17, 51, 50, "miasteczko: tawerna -> brama dworu"],
            [8, 24, 67, 23, 17, "miasteczko: brama płd. -> tawerna"],
            [111, 44, 17, 0, 19, "Podgrodzie: brama -> droga na przystań"],
            [125, 54, 19, 15, 0, "Przystań: wejście -> ścieżka do pustelni"],
            [125, 54, 19, 22, 39, "Przystań: wejście -> garnizon"],
            [125, 54, 19, 24, 5, "Przystań: wejście -> chata Janka"],
            [155, 24, 34, 47, 17, "Pustelnia: zejście -> Urwisko"],
            [155, 24, 34, 14, 9, "Pustelnia: zejście -> skryptorium"],
            [157, 1, 19, 55, 19, "Urwisko -> Przylądek"],
            [159, 1, 33, 29, 39, "Przylądek: od urwiska -> zejście w góry"],
            [162, 22, 1, 0, 20, "Garnizon -> łacha do wraku"],
            [165, 38, 20, 17, 15, "Wrak: łacha -> zejście pod pokład"],
            [21, 19, 1, 0, 19, "Leśna droga: od dziadka -> Polna droga"],
            [21, 19, 1, 39, 8, "Leśna droga: od dziadka -> Góry"],
            [22, 38, 19, 11, 0, "Polna droga: od Leśnej -> miasteczko"],
            [22, 23, 28, 11, 0, "Polna droga: od Skraju lasu -> miasteczko"],
            [13, 1, 38, 44, 7, "Góry: od Leśnej drogi -> Jaskinia"],
            [13, 1, 38, 5, 0, "Góry: od Leśnej drogi -> Osada Milczących"],
            [13, 1, 38, 59, 12, "Góry: od Leśnej drogi -> Przylądek"],
            [14, 20, 27, 3, 9, "Jaskinia: wejście -> przekop (piętro 50)"],
            [1, 50, 53, 9, 4, "Tawerna: wejście -> drzwi piwnicy"],
            [9, 10, 8, 15, 2, "Piwnica -> krata zakonu"],
            [10, 3, 7, 14, 6, "Ruiny Zamku: od piwnicy -> wielkie schody"],
            [10, 3, 7, 24, 8, "Ruiny Zamku: od piwnicy -> winda"],
            [24, 1, 14, 7, 24, "Posiadłość: brama -> oranżeria"],
            [23, 1, 12, 23, 0, "Skraj lasu: od pola -> Polna droga"],
            [20, 15, 8, 14, 21, "Podwórze dziadka: drzwi -> Leśna droga"]
        ];
        R.drogi = [];
        for (const [map, x, y, tx, ty, name] of ROUTES) {
            const ok = await t.go(map, x, y, 2, { timeout: 30 }).catch(() => false);
            if (!ok) { R.drogi.push({ name, map, why: "map did not load" }); continue; }
            await t.quiet();
            await t.eval(WALKER);
            const at = await t.json("[$gamePlayer.x, $gamePlayer.y]");
            const d = await t.eval(`WALK.dist(${tx}, ${ty})`);
            const rec = { name, map, from: at, to: [tx, ty], dist: d, size: await t.json("[$gameMap.width(), $gameMap.height()]") };
            R.drogi.push(rec);
            console.log(JSON.stringify(rec));
            save();
        }
    } catch (e) { console.log("ERR", e && e.stack); R.blad = String(e && e.message); save(); }
    await t.b.close();
    process.exit(0);
})();
