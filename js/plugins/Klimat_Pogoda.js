//=============================================================================
// Klimat_Pogoda.js
//=============================================================================
// Pogoda na ziemi (gracz 2026-11-09: „wszystko, co się da i doda klimatu”): mokry bruk w deszczu i po nim, nocą odbicia latarni,
// koszy żaru i okien na mokrym; śnieg zimą (grunt z wydeptanymi ulicami, dachy, czapy na płotach, murkach i blankach, sople pod
// okapami), narasta, gdy pada, topnieje powoli; ślady stóp, kopyt i łap w błocie i w śniegu, z czasem znikają.
// Mokro i śnieg to GOTOWE obrazki z kafli mapy (tools/klimat/pogoda_miasta.py -> img/klimat/pogoda/MapNNN/*.png, w kawałkach 20 x 20
// kratek; spis w BAKED niżej - narzędzie go wpisuje), wczytywane tylko dla kawałków przy ekranie (Bitmap.load, bez pamięci podręcznej
// - dalekie kawałki są niszczone). Ślady i odbicia działają na każdej mapie pod gołym niebem (Survival.isOutdoors).
// Warstwy w tilemapie: mokro 1.1, śnieg 1.25, ślady 1.3 (nad trawą Laka 0.85 i glebą 1, pod kałużami/kamieniami/cieniami słońca), śnieg na
// kaflach nad postaciami 4.5 (nad górną warstwą 4); odbicia ADD nad nocą (pojemnik na Spriteset_Map, po Klimat_Miasta).
// Load order: after Klimat_Miasta, Puddles, Farming_Render, Survival.

/*:
 * @target MZ
 * @plugindesc Pogoda na ziemi: mokry bruk w deszczu i po nim (nocą odbicia świateł), śnieg zimą (dachy, czapy, sople, wydeptane ulice), ślady stóp i kopyt w błocie i śniegu. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Klimat_Miasta
 * @orderAfter Puddles
 *
 * @help
 * MOKRO: w deszczu ulice szybko ciemnieją i błyszczą na wierzchach kamieni; po deszczu schną razem z kałużami (Puddles.level()).
 *   Nocą na mokrym pod latarniami, koszami żaru i zapalonymi oknami ciepłe smugi odbić.
 * ŚNIEG: zima (plan pogody z Survival: śnieg w zimowe dni) - śnieg przybywa, gdy pada, i leży, topnieje powoli (zimą prawie wcale,
 *   wiosną w kilka dni). Na ulicach pośrodku wydeptany, przy brzegach gruby; na dachach z zarysem dachówek; czapy na płotach, murkach,
 *   beczkach, blankach i kominach; sople pod okapami.
 * ŚLADY: bohater, mieszkańcy, konie, psy zostawiają ślady w błocie (po deszczu na ziemi i trawie, w ulewie i na bruku) i w śniegu;
 *   bledną po minucie-dwóch.
 * Obrazki mokra i śniegu robi tools/klimat/pogoda_miasta.py (po zmianie mapy uruchomić znowu).
 * API: KlimatPogoda.state(), KlimatPogoda.force({ wet, snow }) (testy; null = z pogody), KlimatPogoda.info()
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Klimat_Pogoda.js: brak TawernaCore.js");
    const PLUGIN = "Klimat_Pogoda";
    // <POGODA_DANE>
    const BAKED = {"8":{"c":20,"cols":6,"rows":6,"mokro":["0_0","1_0","2_0","3_0","4_0","5_0","0_1","1_1","2_1","3_1","4_1","5_1","0_2","1_2","2_2","3_2","4_2","5_2","0_3","1_3","2_3","3_3","4_3","5_3","0_4","1_4","2_4","3_4","4_4","5_4","0_5","1_5","2_5","3_5","4_5","5_5"],"snieg":["0_0","1_0","2_0","3_0","4_0","5_0","0_1","1_1","2_1","3_1","4_1","5_1","0_2","1_2","2_2","3_2","4_2","5_2","0_3","1_3","2_3","3_3","4_3","5_3","0_4","1_4","2_4","3_4","4_4","5_4","0_5","1_5","2_5","3_5","4_5","5_5"],"gora":["0_0","1_0","2_0","3_0","4_0","5_0","0_1","1_1","2_1","3_1","4_1","5_1","0_2","1_2","2_2","4_2","5_2","0_3","1_3","2_3","3_3","4_3","5_3","0_4","1_4","2_4","3_4","4_4","5_4","0_5","1_5","2_5","3_5","4_5","5_5"]}};
    const KIND_CLASS = {"2":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,2,1,1,3,0,0,0,2,3,1,1,2,0,0,1,2,3,1,2,2,0,0,3,1,2,1,2,1,0,0,2],"3":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,1,2,2,0,0,0,0,2,1,2,2,0,0,2,0,2,2,1,2,0,2,3,0,2,1,2,1,0,2,3,0],"8":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,1,0,0,0,0,0,1,2,3,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0],"9":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,2,1,1,3,3,1,1,2,3,2,3,0,0,2,3,1,2,3,3,1,1,1,2,1,1,1,1,3,3,3,0],"10":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,2,3,2,0,1,0,0,3,1,1,1,0,1,3,0,1,1,1,1,0,2,1,0,1,1,1,1,0,3,2,0],"11":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,2,1,1,0,3,0,1,2,3,2,3,0,0,0,3,1,2,1,1,1,1,0,2,1,1,1,1,3,3,0,1],"12":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,2,3,2,0,1,0,0,3,1,1,1,0,1,3,0,1,1,1,1,0,2,1,0,1,1,1,1,0,3,2,0],"13":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,2,1,1,0,3,0,1,2,3,2,3,0,0,0,3,1,2,1,1,1,1,0,2,1,1,1,1,3,3,0,1],"14":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,2,1,1,0,3,0,1,2,3,2,3,0,0,0,3,1,2,1,1,1,1,0,2,1,1,1,1,3,3,0,1],"15":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,2,1,1,3,3,1,1,2,3,2,3,0,0,2,3,1,2,3,3,1,1,1,2,1,1,1,1,3,3,3,0],"16":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,2,1,1,0,3,0,1,2,3,2,3,0,0,0,3,1,2,1,1,1,1,0,2,1,1,1,1,3,3,0,1],"17":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,2,1,1,0,3,0,1,2,3,2,3,0,0,0,3,1,2,1,1,1,1,0,2,1,1,1,1,3,3,0,1],"18":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,2,1,1,0,3,0,1,2,3,2,3,0,0,0,3,1,2,1,1,1,1,0,2,1,1,1,1,3,3,0,1],"19":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,2,1,1,0,3,0,1,2,3,2,3,0,0,0,3,1,2,1,1,1,1,0,2,1,1,1,1,3,3,0,1],"20":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,2,3,2,0,1,0,0,3,1,1,1,0,1,3,0,1,1,1,1,0,2,1,0,1,1,1,1,0,3,2,0],"21":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,1,0,0,0,0,0,1,2,3,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0]};
    // </POGODA_DANE>
    // (Laka's grass tint 0.85 and the farm's soil 1 lie under the snow - white over the green; Puddles 1.2 under the prints; the litter 1.5,
    //  the sun's shadows 1.8 and the characters over everything)
    const Z = { wet: 1.1, snow: 1.25, prints: 1.3, snowUp: 4.5 };
    const G_STONE = 1, G_EARTH = 2, G_GRASS = 3;

    const hour = () => (typeof $gameSystem.dayNightHour === "function" ? $gameSystem.dayNightHour() : 12);
    const dayNo = () => (typeof $gameSystem.dayNightDay === "function" ? $gameSystem.dayNightDay() : 1);
    const night = () => (window.Farming && Farming.nightAmount ? Farming.nightAmount() : 0);
    const outdoors = () => (window.Survival && Survival.isOutdoors ? Survival.isOutdoors() : T.mapFlag("Weather", false));
    const seasonOf = d => (window.Farming && Farming.seasonIndex ? Farming.seasonIndex(d) : Math.floor(((Math.max(1, d) - 1) / 28) % 4));
    const baked = () => BAKED[String($gameMap.mapId())] || null;
    const forced = { wet: null, snow: null };
    const cur = { wet: 0, snow: 0, mapId: 0, sys: null };

    // ------------------------------------------------------------------ how wet, how much snow
    function wetTarget() {
        if (forced.wet !== null) return forced.wet;
        if (!outdoors()) return 0;
        const lvl = window.Puddles && Puddles.level ? Puddles.level() : 0;
        const w = $gameScreen.weatherType(), pw = $gameScreen.weatherPower();
        const rain = (w === "rain" || w === "storm") && pw > 0 ? Math.min(1, 0.5 + 0.1 * pw) : 0;
        return Math.min(1, Math.max(lvl * 1.5, rain));
    }
    let snowCache = { key: null, v: 0 };
    function snowTarget() {
        if (forced.snow !== null) return forced.snow;
        if (!outdoors() || !(window.Survival && Survival.weatherPlan)) return 0;
        const now = dayNo() * 24 + hour(), key = Math.floor(now * 12);
        if (snowCache.key === key) return snowCache.v;
        let v = 0;
        for (let t = Math.max(24, now - 240); t < now; t += 0.5) {
            const d = Math.floor(t / 24), h = t - d * 24, plan = Survival.weatherPlan(d), s = seasonOf(d);
            if (plan && plan.type === "snow" && h >= plan.start && h < plan.end) v = Math.min(1.2, v + 0.045 * (plan.power || 4) * 0.5);
            else {
                const sunny = h >= 7 && h < 18;
                const melt = s === 3 ? (sunny ? 0.006 : 0.001) : s === 0 ? (sunny ? 0.07 : 0.025) : 0.25;
                v = Math.max(0, v - melt * 0.5);
            }
        }
        snowCache = { key, v: Math.min(1, v) };
        return snowCache.v;
    }
    function stepState() {
        if (cur.mapId !== $gameMap.mapId() || cur.sys !== $gameSystem) { cur.mapId = $gameMap.mapId(); cur.sys = $gameSystem; cur.wet = wetTarget(); cur.snow = snowTarget(); return; }   // (a new game / a loaded save: its own weather at once)
        const tw = wetTarget(), ts = snowTarget();
        cur.wet += (tw - cur.wet) * (tw > cur.wet ? 0.004 : 0.0015);
        cur.snow += (ts - cur.snow) * 0.002;
        if (Math.abs(tw - cur.wet) < 0.002) cur.wet = tw;
        if (Math.abs(ts - cur.snow) < 0.002) cur.snow = ts;
    }

    // ------------------------------------------------------------------ the ground under each cell (prints, reflections)
    let ground = null;
    function groundOf() {
        if (ground && ground.data === $dataMap) return ground;
        const W = $dataMap.width, H = $dataMap.height, d = $dataMap.data, tsId = $gameMap.tilesetId(), kc = KIND_CLASS[String(tsId)] || [];
        const flags = $gameMap.tileset().flags, g = new Uint8Array(W * H);
        const at = (z, x, y) => d[(z * H + y) * W + x] || 0;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const t0 = at(0, x, y);
            let c = 0;
            if (t0 >= 2048) { const k = Math.floor((t0 - 2048) / 48); c = k >= 16 && k < 48 ? kc[k] || G_GRASS : 0; }
            else if (t0 >= 1536 && (flags[t0] & 0x0F) !== 0x0F) c = G_STONE;
            if (c) {
                for (const z of [1, 2, 3]) {
                    const t = at(z, x, y);
                    if (!t || (flags[t] & 0x10)) continue;
                    const blocking = (flags[t] & 0x0F) === 0x0F;
                    if (t >= 2048) { const k = Math.floor((t - 2048) / 48); if (k < 16 || blocking) c = 0; else if (k < 48 && kc[k]) c = kc[k]; else if (k >= 48) c = 0; }
                    else if (blocking) c = 0;
                }
            }
            g[y * W + x] = c;
        }
        ground = { data: $dataMap, W, H, g };
        return ground;
    }
    const groundAt = (x, y) => { const G = groundOf(); x = Math.floor(x); y = Math.floor(y); return x < 0 || y < 0 || x >= G.W || y >= G.H ? 0 : G.g[y * G.W + x]; };

    // ------------------------------------------------------------------ sprites
    let ss = null;
    const _createLower = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _createLower.call(this);
        if (ss) dropAll(ss);
        ss = null;
        if (!outdoors()) return;
        const top = new Sprite(); this.addChild(top);
        ss = { set: this, tm: this._tilemap, top, chunks: new Map(), prints: [], printPool: [], refl: [], tracked: new Map(), lights: null, mapId: $gameMap.mapId() };
        if (ss.mapId !== printsMap || printsSys !== $gameSystem) { printsData.length = 0; printsMap = ss.mapId; printsSys = $gameSystem; }
    };
    function dropAll(s) {   // (the old spriteset's sprites go with it; only the chunks' own bitmaps - not in the image cache - are freed)
        for (const [, sp] of s.chunks) { try { if (sp.bitmap && !sp.bitmap._destroyed) { sp.bitmap.destroy(); sp.bitmap._destroyed = true; } } catch (e) { /* (gone already) */ } }
        s.chunks.clear();
    }
    const _update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _update.call(this);
        if (!ss || ss.set !== this) return;
        try { frame(); } catch (e) { if (!failed++) console.warn("[Klimat_Pogoda] " + (e && e.message)); }
    };
    let failed = 0;
    const view = () => {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        return { tw, th, x0: $gameMap.displayX(), y0: $gameMap.displayY(), x1: $gameMap.displayX() + Graphics.width / tw, y1: $gameMap.displayY() + Graphics.height / th };
    };
    const sx = (x, v) => Math.round($gameMap.adjustX(x) * v.tw), sy = (y, v) => Math.round($gameMap.adjustY(y) * v.th);

    function frame() {
        stepState();
        const v = view();
        chunks(v);
        reflections(v);
        prints(v);
    }

    // ---- 1. the baked chunks (wet, snow, snow over the characters)
    function chunks(v) {
        const B = baked();
        if (!B) return;
        const C = B.c, wetA = cur.wet * Math.max(0, 1 - cur.snow * 3), snowA = Math.min(1, cur.snow * 1.15);
        const want = new Set();
        const cx0 = Math.max(0, Math.floor((v.x0 - 4) / C)), cx1 = Math.min(B.cols - 1, Math.floor((v.x1 + 4) / C));
        const cy0 = Math.max(0, Math.floor((v.y0 - 4) / C)), cy1 = Math.min(B.rows - 1, Math.floor((v.y1 + 4) / C));
        const kinds = [["mokro", wetA, Z.wet, B.mokro], ["snieg", snowA, Z.snow, B.snieg], ["snieg_gora", snowA, Z.snowUp, B.gora]];
        for (const [kind, a, z, list] of kinds) {
            if (a < 0.01) continue;
            if (!list._set) list._set = new Set(list);
            for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
                const key = cx + "_" + cy;
                if (!list._set.has(key)) continue;
                const id = kind + "_" + key;
                want.add(id);
                let s = ss.chunks.get(id);
                if (!s) {
                    s = new Sprite(Bitmap.load("img/klimat/pogoda/Map" + String($gameMap.mapId()).padStart(3, "0") + "/" + id + ".png"));
                    s.z = z; ss.tm.addChild(s); ss.chunks.set(id, s);
                }
                s.visible = true;
                s.opacity = Math.round(255 * a);
                s.x = sx(cx * C, v); s.y = sy(cy * C, v);
            }
        }
        for (const [id, s] of ss.chunks) if (!want.has(id)) {
            if (s.parent) s.parent.removeChild(s);
            const bm = s.bitmap;
            s.bitmap = null;
            if (bm && !bm._destroyed) { bm.destroy(); bm._destroyed = true; }
            ss.chunks.delete(id);
        }
    }

    // ---- 2. reflections of the lights on the wet ground at night
    let reflBmp = null;
    function lightsOf() {
        if (ss.lights && ss.lights.data === $dataMap) return ss.lights;
        const list = [];
        for (const e of $dataMap.events) {
            if (!e || !e.note) continue;
            const im = e.pages && e.pages[0] && e.pages[0].image;
            const fire = im && ((im.characterName === "!$Smith" && (im.direction === 2 || im.direction === 6)) || (im.characterName === "!Decoration" && im.characterIndex === 0 && im.direction === 2));
            if (!fire && (!/<Light(?::|>)/i.test(e.note) || /<LightSoft>/i.test(e.note) || /<LightWhen:\s*day>/i.test(e.note) || !im || !im.characterName)) continue;
            const lamp = im.characterName === "!lamp" || /Latarnia/i.test(im.characterName);
            list.push({ id: e.id, x: e.x + 0.5, y: e.y + 1, len: lamp ? 2.3 : 1.5, a: fire ? 0.55 : lamp ? 0.5 : 0.42, w: lamp ? 1 : 1.25, col: fire ? 0xffc890 : 0xffe0b0, im });
        }
        ss.lights = { data: $dataMap, list };
        return ss.lights;
    }
    // (gracz 2026-11-09: „to odbicie światła nie powinno iść od samej podstawy?”) the picture's foot: transparent rows under the drawn
    // post / basket in its frame, read once from the loaded sheet (the middle column, from the bottom up); the streak starts there
    const gaps = new Map();
    function baseGap(im) {
        if (!im) return 0;
        const key = im.characterName + "|" + im.characterIndex + "|" + im.direction + "|" + im.pattern;
        if (gaps.has(key)) return gaps.get(key);
        const bmp = ImageManager.loadCharacter(im.characterName);
        if (!bmp.isReady()) return 0;
        const big = ImageManager.isBigCharacter(im.characterName), pw = bmp.width / (big ? 3 : 12), ph = bmp.height / (big ? 4 : 8);
        const ox = big ? 0 : (im.characterIndex % 4) * 3 * pw, oy = big ? 0 : Math.floor(im.characterIndex / 4) * 4 * ph;
        const fx = ox + im.pattern * pw, fy = oy + ((im.direction - 2) / 2) * ph;
        let gap = 0;
        for (let y = ph - 1; y >= 0; y--) {
            let hit = false;
            for (let dx = -6; dx <= 6 && !hit; dx += 3) if (bmp.getAlphaPixel(Math.floor(fx + pw / 2 + dx), Math.floor(fy + y)) > 100) hit = true;
            if (hit) break;
            gap++;
        }
        gap = Math.min(gap, Math.floor(ph / 3));
        gaps.set(key, gap);
        return gap;
    }
    // the streaks on the screen now: [{ X, Y (the top, px), L (length px), wd, a, col, ph }] - drawn in the tilemap UNDER the people
    // (gracz 2026-11-09: „jest nad graczem, a powinno być pod graczem”) and cut out of the night's dark (the night layer's lights: a
    // row of small holes down each streak), so the wet stones show them in the dark like the lit windows
    // (gracz 2026-11-13: „na przystani wywalić odbicie światła latarni”) no streaks on the maps of NO_REFL_MAPS; a map note <Odbicia:off> / on wins
    const NO_REFL_MAPS = [219];
    function reflOff() {
        const tag = T.mapFlag("Odbicia", null, "first");
        return tag !== null ? !tag : NO_REFL_MAPS.includes($gameMap.mapId());
    }
    function reflList(v) {
        const out = [], a0 = cur.wet * Math.max(0, 1 - cur.snow * 3) * night();
        if (a0 <= 0.03 || reflOff()) return out;
        const fc = Graphics.frameCount;
        const use = (x, y, len, a, wd, col, ph, gap) => {
            if (x < v.x0 - 1 || x > v.x1 + 1 || y < v.y0 - 1 || y > v.y1 + 1) return;
            const g = groundAt(x, y);
            if (g !== G_STONE && g !== G_EARTH) return;
            out.push({ X: sx(x, v) + Math.round(Math.sin(fc * 0.05 + ph) * 1.2), Y: sy(y, v) - (gap || 0) - 1, L: len * v.th, wd, col, ph,
                a: Math.min(1, a0 * a * (0.88 + 0.12 * Math.sin(fc * 0.13 + ph))) });
        };
        for (const l of lightsOf().list) use(l.x, l.y, l.len, l.a, l.w, l.col, l.id, baseGap(l.im));
        const KM = window.KlimatMiasta && KlimatMiasta.places ? (KlimatMiasta.places() || null) : null;
        if (KM && KM.windows) for (const w of KM.windows) if (w.v > 0.05 && w.pool && w.halo) use(w.x + 0.5, w.pool, 1.1, 0.38 * w.v, 1.35, 0xffd9a0, w.x * 3 + w.y);
        return out;
    }
    function reflections(v) {
        const list = reflList(v);
        if (list.length && !reflBmp) reflBmp = ImageManager.loadSystem("Klimat_Odbicie");
        let n = 0;
        for (const r of list) {
            let s = ss.refl[n];
            if (!s || s.parent !== ss.tm) { s = new Sprite(reflBmp); s.anchor.set(0.5, 0); s.blendMode = 1; s.z = 1.35; ss.tm.addChild(s); ss.refl[n] = s; }
            n++;
            s.visible = true; s.x = r.X; s.y = r.Y; s.scale.set(r.wd, r.L / 112); s.tint = r.col; s.opacity = Math.round(255 * r.a);
        }
        for (let i = n; i < ss.refl.length; i++) ss.refl[i].visible = false;
    }
    function reflHoles(out) {   // (inside the night layer's update: exactly this frame's view)
        if (!ss || !$dataMap) return;
        for (const r of reflList(view())) {
            const k = Math.min(1, r.a * 1.15);
            for (const f of [0.18, 0.45, 0.75]) out.push({ x: r.X, y: r.Y + r.L * f, r: Math.max(12, r.L * (0.26 - f * 0.1)), i: k * (1.05 - f * 0.6), id: 9900 + (r.ph % 90) });
        }
    }
    const _createLowerHoles = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _createLowerHoles.call(this);
        const nl = this._nightLight, proto = nl && Object.getPrototypeOf(nl);
        if (proto && !proto._pogodaOdbicia) {
            proto._pogodaOdbicia = true;
            const upd = proto.update, lights = proto.lights;
            proto.update = function() { this._pogodaNow = true; try { upd.call(this); } finally { this._pogodaNow = false; } };
            proto.lights = function() { const out = lights.call(this); if (this._pogodaNow && ss && ss.set && ss.set._nightLight === this) reflHoles(out); return out; };
        }
    };

    // ---- 3. footprints
    let printsMap = 0, printsSys = null, slady = null;
    const printsData = [];                      // { x, y, row, col, born, life, a } (map tiles) - kept while the map is the same
    const LIFE = { mud: 3600, snow: 5400 }, MAX_PRINTS = 260;
    function kindOfWalker(ch) {
        const n = ch.characterName ? ch.characterName() : "";
        if (/Kon|Horse|Krowa|Cow|Owca|Sheep|Koza|Goat|Swin|Pig|Dzik|Boar|Jelen|Deer|Sarn/i.test(n)) return "H";
        if (/Dog|Pies|Wolf|Wilk|Lis|Fox|Zaj|Rabbit|Kot|Cat/i.test(n)) return "P";
        return "F";
    }
    function walkers(v) {
        const out = [$gamePlayer];
        for (const e of $gameMap.events()) {
            const n = e.characterName();
            if (!n || n[0] === "!" || e._erased || e.isTransparent() || e._opacity < 60) continue;
            if (e._realX < v.x0 - 2 || e._realX > v.x1 + 2 || e._realY < v.y0 - 2 || e._realY > v.y1 + 3) continue;
            out.push(e);
        }
        return out;
    }
    function prints(v) {
        const snowy = !!baked() && cur.snow > 0.25, muddy = cur.wet > 0.3 && cur.snow < 0.15;
        const fc = Graphics.frameCount;
        if (snowy || muddy) {
            for (const ch of walkers(v)) {
                if (ch === $gamePlayer && ($gamePlayer.isTransparent() || $gamePlayer.opacity() < 60 || $gamePlayer.isInVehicle())) continue;
                let st = ss.tracked.get(ch);
                if (!st) { st = { x: ch._realX, y: ch._realY, acc: 0, side: 1, kind: kindOfWalker(ch) }; ss.tracked.set(ch, st); continue; }
                const dx = ch._realX - st.x, dy = ch._realY - st.y, d = Math.hypot(dx, dy);
                if (d < 0.001) continue;
                st.x = ch._realX; st.y = ch._realY;
                if (d > 1.5) { st.acc = 0; continue; }
                st.acc += d;
                const stride = st.kind === "H" ? 0.55 : st.kind === "P" ? 0.4 : 0.42;
                if (st.acc < stride) continue;
                st.acc = 0;
                const fx = ch._realX + 0.5, fy = ch._realY + 0.84, g = groundAt(fx, fy);
                if (!g) continue;
                // (gracz 2026-11-13: „jak się idzie pod mostem i deszcz pada, to się potrafią ślady stóp na moście pojawić”) none on a bridge's cells
                // (Mosty.js): under it they would show on the deck once he is out, on the deck the planks keep no mud
                if (window.Mosty && Mosty.at(Math.floor(fx), Math.floor(fy))) continue;
                const mode = snowy ? "snow" : (g === G_EARTH || g === G_GRASS || (g === G_STONE && cur.wet > 0.75)) ? "mud" : null;
                if (!mode) continue;
                const ang = Math.atan2(dx, -dy), dir8 = ((Math.round(ang / (Math.PI / 4)) % 8) + 8) % 8;
                const px = -dy / d, py = dx / d;   // (across the walk: the feet side by side)
                st.side = -st.side;
                const off = st.kind === "F" ? 0.09 * st.side : st.kind === "H" ? 0.12 * st.side : 0.06 * st.side;
                const row = (mode === "snow" ? 4 : 0) + (st.kind === "F" ? (st.side > 0 ? 0 : 1) : st.kind === "H" ? 2 : 3);
                const life = LIFE[mode] * ($gameScreen.weatherType() === "snow" && $gameScreen.weatherPower() > 0 ? 0.6 : 1);
                const a = mode === "mud" ? (g === G_STONE ? 0.45 : g === G_GRASS ? 0.6 : 0.85) : 0.9;
                printsData.push({ x: fx + px * off, y: fy + py * off, row, col: dir8, born: fc, life, a });
                if (printsData.length > MAX_PRINTS) printsData.shift();
            }
        } else ss.tracked.clear();
        // draw: one sprite per living print near the screen
        if (!slady) slady = ImageManager.loadSystem("Klimat_Slady");
        let n = 0;
        for (let i = printsData.length - 1; i >= 0; i--) {
            const p = printsData[i], age = fc - p.born;
            if (age > p.life) { printsData.splice(i, 1); continue; }
            if (p.x < v.x0 - 1 || p.x > v.x1 + 1 || p.y < v.y0 - 1 || p.y > v.y1 + 1) continue;
            let s = ss.prints[n];
            if (!s) { s = new Sprite(slady); s.anchor.set(0.5, 0.5); s.z = Z.prints; ss.tm.addChild(s); ss.prints[n] = s; }
            n++;
            const fade = Math.min(1, (p.life - age) / (p.life * 0.4)), dim = p.row >= 4 ? 1 : Math.min(1, cur.wet * 1.4 + 0.3);
            s.visible = true; s.setFrame(p.col * 16, p.row * 16, 16, 16);
            s.x = sx(p.x, v); s.y = sy(p.y, v);
            s.opacity = Math.round(255 * p.a * fade * dim);
        }
        for (let i = n; i < ss.prints.length; i++) ss.prints[i].visible = false;
    }

    window.KlimatPogoda = {
        state: () => ({ wet: +cur.wet.toFixed(3), snow: +cur.snow.toFixed(3), wetTarget: +wetTarget().toFixed(3), snowTarget: +snowTarget().toFixed(3) }),
        force: o => { if ("wet" in o) forced.wet = o.wet; if ("snow" in o) forced.snow = o.snow; if (o.now) { cur.wet = wetTarget(); cur.snow = snowTarget(); } snowCache.key = null; },
        info: () => ss ? { chunks: [...ss.chunks.keys()], visibleChunks: [...ss.chunks.values()].filter(s => s.visible).length, prints: printsData.length,
            printSprites: ss.prints.filter(s => s.visible).length, reflections: ss.refl.filter(s => s.visible).length, baked: !!baked() } : null,
        groundAt
    };
})();
