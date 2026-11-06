// Kod do strony gry: każdy obrazek nazwy mapy, jaki gra może pokazać (CleanHUD „Kinowy”), z tymi samymi tekstami i kluczem co na mapie.
// Mapy z data/ (każda wizyta mała nazwa - od 2026-11-06 bez długiej pierwszej, CleanHUD KN_FIRST_LONG -, wnętrze, na dworze też
// nocą) i piętra podziemi. Wczytuje dane map jedna po drugiej: strona potem do niczego (zegar gry stoi).
// Używają: tools/nazwa_mapy/obrazki.js (robi obrazki), tests/nazwy_map_test.js (sprawdza, czy każdy jest).
"use strict";
module.exports = `(function(){
    if (window.__nazwy) return 0;
    Graphics._app.ticker.stop();   // (the scene stops: the maps' data change under it)
    const A = CleanHUD.nameArt, U = window.Underground, vis = CleanHUD.visits();
    const loadMap = id => new Promise(res => { DataManager.loadMapData(id); const w = () => DataManager.isMapLoaded() ? res() : setTimeout(w, 4); w(); });
    const one = (out, info, mode, night) => { const key = A.key(info, mode, night); if (!out.some(v => v.key === key)) out.push({ key, info, mode, night }); };
    window.__nazwy = {
        // the maps that are not the underground's floors
        ids: () => $dataMapInfos.filter(Boolean).map(m => m.id).filter(id => !(U && U.floorOf && U.floorOf(id))),
        floors: () => { const D = window.Underground_Data; return D ? D.BANDS.flatMap(b => Array.from({ length: b.to - b.from + 1 }, (_, i) => b.from + i)) : []; },
        async map(id) {
            await loadMap(id);
            if (!$dataMap) return [];
            $gameMap._mapId = id;
            $gameMap._tilesetId = $dataMap.tilesetId;
            if (!$dataMap.displayName || Tawerna.mapFlag("NazwaMapy", true, "off") === false) return [];
            const S = Tawerna.api("Survival"), outdoors = !S || !S.isOutdoors || S.isOutdoors(), out = [];
            for (const first of [true, false]) {
                vis.odw[id] = first ? 0 : 1;
                const info = CleanHUD.placeInfo(), mode = A.mode(info);
                for (const night of mode !== "inside" && outdoors ? [false, true] : [false]) one(out, info, mode, night);
            }
            delete vis.odw[id];
            return out;
        },
        floor(f) {
            const id = U.mapOf(f), band = U.bandOf(f) || {}, gen = U.isGenerated(id), out = [];
            if (!id) return out;
            $gameMap._mapId = id;
            for (const first of [true, false]) {
                if (gen && first && f !== band.from) continue;
                if (band.id) vis.pasma[band.id] = !first;
                vis.odw[id] = first ? 0 : 1;
                const info = CleanHUD.placeInfo();
                one(out, info, A.mode(info), false);
            }
            if (band.id) delete vis.pasma[band.id];
            delete vis.odw[id];
            return out;
        },
        // one picture as the map draws it: its key, what spis.json keeps, the PNG (base64)
        draw(v) {
            const lay = A.layout(v.info, v.mode, v.night), b = A.draw(lay), png = b.canvas.toDataURL("image/png").split(",")[1];
            b.destroy();
            return { key: v.key, meta: A.meta(lay), png, what: v.info.id + " " + v.mode + (v.night ? " noc" : "") + " " + v.info.title };
        }
    };
    return 0;
})()`;
