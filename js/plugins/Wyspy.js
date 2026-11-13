//=============================================================================
// Wyspy.js
//=============================================================================
// The islands on the sea maps (user 2026-11-07: "te mapy, gdzie jest kawałek lądu i mnóstwo wody, to można dorobić wyspę"; the
// land: tools/wyspy/buduj.py, in the style of the test map A). Here what they are for and how one gets there - each its own way:
//   917 Wyspa Kormoranów    the sandbar from the shore, dry only at low tide (region 61: Wrak.js's flood, Wyspa.tide); cormorants'
//                           nests: eggs in spring and summer, a feather now and then
//   918 Wysepka Samotnej Sosny  a sandbar too; under the pine the stones hide a sailor's purse (a shovel), once
//   920 Wyspa Solna         a hired boat from the harbour (by day): salt crusts on the shore rocks (a knife), new ones after sunny days
//   922 Wyspa Przemytników  the same boat, only at night: the smugglers' cache, filled again every week, and their hidden boat
//   923 Kamień Rybaków      the old fishermen's boat on the cove under grandpa's yard - mended (4 planks, 4 nails, pitch) it rows to
//                           the islet: the fishermen's cross - a fish left there once a day blesses (as the order's shrines)
//   935 Orla Iglica         only with the eagle (no stairs on the stack): an old nest with feathers; a brushwood signal brings a
//                           fisherman's boat (the way down if the eagle cannot take him)
//   951 Skała Strażnicza    the garrison's boat by its pier, by day: the old post's chest, once
//   914 Zatoczka pod ogonem the wreck of a boat on the shore, searched once
// Events: Tawerna.inject ids 3140-3199 (owner "Wyspy"); state Tawerna.state("wyspy"). Texts: js/teksty/wyspy.txt.
// DROUGHT (the user's rule): nothing here gives water - the sea is salt.

/*:
 * @target MZ
 * @plugindesc Wyspy: drogi na wyspy (mielizny w odpływie, łódki z przystani i garnizonu, stara łódź rybaków, orzeł) i to, co na nich jest: gniazda kormoranów, sól, skrytka przemytników, krzyż rybaków, posterunek, skarb pod sosną. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Wrak
 *
 * @help
 * Wyspy.js - wyspy na mapach morza (917, 918, 920, 922, 923, 935, 951) i wrak w zatoczce (914).
 * Mielizny na 917 i 918 są pod wodą poza odpływem (region 61, rysuje i zamyka je Wrak.js).
 * Zdarzenia 3140-3199 dokłada gra (mapy w edytorze ich nie mają). Teksty: js/teksty/wyspy.txt.
 * Wyspy.state(), Wyspy.use(interp), Wyspy.act(interp, co, ...), Wyspy.SPOTS.
 */
(() => {
    "use strict";
    const PLUGIN = "Wyspy";
    const T = window.Tawerna;
    if (!T || !window.Watki) throw new Error("Wyspy.js: brak TawernaCore.js / Watki.js");
    const TK = Watki.teksty("wyspy");
    const M = Watki.mowa;
    const IDS = [3140, 3199];
    const ITEM = { egg: 75, feathers: 146, salt: 200, knife: [90, 91], shovel: 62, planks: 80, nails: 88, pitch: 176, fish: [98, 173, 174],
        spice: 210, beer: 81, arrows: 127, rope: 93, amber: 382 };
    // where a boat lands (the cell by the boat, which floats beside it): the harbour's and the garrison's piers, the islands' shores
    // (923: the islet; 9230: the cove's shore of the same map, by the old boat)
    const HARBOUR = { map: 125, land: [13, 8, 2] }, GARRISON = { map: 162, land: [27, 51, 2] };
    const LANDING = { 920: [37, 9, 2], 922: [15, 19, 6], 951: [37, 19, 4], 923: [22, 15, 2], 9230: [54, 3, 8] };
    const FLOOD_REGION = 61, FLOOD_MAPS = [917, 918];
    const REGROW = { nest: 4, salt: 3, cache: 7, eaglenest: 7 };
    const PRICE = { solna: 5, przemyt: 10 };
    // the events: [id, map, x, y, kind, key, picture, direction, pattern, priority]
    const SPOTS = [
        [3140, 125, 13, 9, "hire", "", "!$Przystan_Lodz_Mala", 2, 1, 1],
        [3141, 162, 5, 28, "guard", "", "!$Przystan_Lodz_Mala", 2, 1, 1],
        [3142, 917, 44, 49, "nest", "n1", "!$Wys_Kormoran", 2, 1, 1],
        [3143, 917, 50, 49, "nest", "n2", "!$Wys_Kormoran", 2, 1, 1],
        [3144, 917, 58, 48, "nest", "n3", "!$Wys_Kormoran", 2, 1, 1],
        [3145, 917, 66, 47, "nest", "n4", "!$Wys_Kormoran", 2, 1, 1],
        [3146, 920, 26, 30, "salt", "s1", "!$Wys_Sol", 2, 1, 1],
        [3147, 920, 47, 24, "salt", "s2", "!$Wys_Sol", 2, 1, 1],
        [3148, 920, 23, 17, "salt", "s3", "!$Wys_Sol", 2, 1, 1],
        [3149, 920, 37, 8, "back", "harbour", "!$Przystan_Lodz_Mala", 2, 1, 1],
        [3150, 922, 14, 19, "back", "harbour", "!$Przystan_Lodz_Mala", 2, 1, 1],
        [3151, 922, 33, 19, "cache", "", "!$Lud_Skrzynia", 2, 1, 1],
        [3152, 922, 40, 29, "smugboat", "", "!$Przystan_Lodz_Mala", 4, 1, 1],
        [3153, 923, 54, 4, "oldboat", "", "!$Przystan_Lodz_Mala", 2, 1, 1],
        [3154, 923, 22, 14, "isletboat", "", "!$Przystan_Lodz_Mala", 2, 1, 1],
        [3155, 923, 24, 19, "cross", "", "!$Lud_KrzyzStary", 2, 1, 1],
        [3156, 935, 14, 8, "eaglenest", "", "!$Zak_Gniazdo", 2, 1, 1],
        [3157, 935, 17, 10, "signal", "", "!$Zi_Galaz", 2, 1, 1],
        [3158, 951, 38, 19, "back", "garrison", "!$Przystan_Lodz_Mala", 2, 1, 1],
        [3159, 951, 22, 12, "post", "", "!$Lud_Skrzynia", 2, 1, 1],
        [3160, 918, 29, 13, "dig", "", "!$Zas_Kamienie", 2, 0, 1],
        [3161, 914, 43, 37, "wreck", "", "!$Przystan_Kuter_Wrak", 2, 1, 1]
    ];

    // ------------------------------------------------------------------ state and small helpers
    const state = T.state.define("wyspy", () => ({ nests: {}, salt: {}, cache: 0, cacheNote: 0, boat923: 0, cross: 0, crossNote: 0, eagle: 0,
        post: 0, dug: 0, wreck: 0, smug: 0, tideLow: -1 }), { version: 1, owner: PLUGIN });
    const S = () => state();
    const has = () => !!window.$gameSystem && !!window.$gameMap && !!window.$gameParty;
    const day = () => T.time.day(), hour = () => T.time.hour();
    const item = id => window.$dataItems && $dataItems[id];
    const count = id => (item(id) ? $gameParty.numItems(item(id)) : 0);
    const give = (id, n) => { if (item(id)) $gameParty.gainItem(item(id), n); };
    const take = (id, n) => { if (item(id)) $gameParty.loseItem(item(id), n); };
    const icon = id => (item(id) ? item(id).iconIndex : 0);
    const fill = (s, v) => String(s || "").replace(/\{(\w+)\}/g, (m, k) => (v && v[k] !== undefined ? v[k] : m));
    const se = (name, vol, pitch) => AudioManager.playSe({ name, volume: vol || 80, pitch: pitch || 100, pan: 0 });
    const got = (id, n, title, sub) => { give(id, n); T.popup((title || (item(id) ? item(id).name : "")) + (n > 1 ? " ×" + n : ""), { icon: icon(id), kind: "good", sub: sub || "" }); };
    const storming = () => { const St = T.api("Storm"); try { return !!(St && St.level && St.level() > 0.3); } catch (e) { return false; } };
    const raining = () => { try { return $gameScreen.weatherType() === "rain" && $gameScreen.weatherPower() > 0; } catch (e) { return false; } };
    const night = () => hour() >= 21 || hour() < 5;
    const daytime = () => hour() >= 6 && hour() < 20;
    const spotOf = id => SPOTS.find(s => s[0] === id) || null;
    const C = M.C;
    const ready = (last, days) => !last || day() - last >= days;

    // ------------------------------------------------------------------ the events (Tawerna.inject)
    function eventOf(s) {
        const OK = T.api("Okolice");
        const [id, map, x, y, kind, key, image, dir, pat, prio] = s;
        const name = (TK.nazwa && TK.nazwa[kind]) || kind;
        const page = OK.page({ image: { characterName: image, direction: dir, pattern: pat, characterIndex: 0 }, list: [C(355, ["Wyspy.use(this)"])],
            priority: prio, through: false, directionFix: true, stepAnime: false, walkAnime: false });
        return OK.event(id, name, x, y, [page], "<Wyspy:" + kind + (key ? ":" + key : "") + ">");
    }
    const MAPS = Array.from(new Set(SPOTS.map(s => s[1])));
    for (const map of MAPS) {
        T.inject(map, { ids: IDS, owner: PLUGIN, build: () => (T.api("Okolice") ? SPOTS.filter(s => s[1] === map).map(eventOf) : []) });
    }
    const kindOf = ev => { const m = /<Wyspy:(\w+)(?::(\w+))?>/.exec((ev && ev.event && ev.event().note) || ""); return m ? { kind: m[1], key: m[2] || "" } : null; };

    // the look of a thing by its state: eggs / none, salt / scraped, a chest shut / open, the stones / dug
    function lookOf(kind, key) {
        const s = S();
        if (kind === "nest") return ready(s.nests[key], REGROW.nest) && season() ? 2 : 4;
        if (kind === "salt") return ready(s.salt[key], REGROW.salt) ? 2 : 4;
        if (kind === "cache") return ready(s.cache, REGROW.cache) ? 2 : 4;
        if (kind === "post") return s.post ? 4 : 2;
        if (kind === "dig") return s.dug ? 4 : 2;
        return 0;
    }
    function syncLooks() {
        if (!has()) return;
        for (const ev of $gameMap.events()) {
            const k = kindOf(ev);
            if (!k) continue;
            const d = lookOf(k.kind, k.key);
            if (d && ev._direction !== d) { ev._direction = d; ev._originalDirection = d; }
        }
    }
    T.on("mapReady", syncLooks, { owner: PLUGIN });
    const season = () => { const se_ = T.time.season(); return se_ === 0 || se_ === 1; };

    // ------------------------------------------------------------------ talks: plain windows and choices
    function run(interp, list) { if (list && list.length) M.uruchom(interp, list); }
    const script = (out, code) => M.script(out, code);
    const call = (what, a) => "Wyspy.act(this, " + JSON.stringify([what, a === undefined ? null : a]) + ")";
    function ask(interp, lines, labels, codes) {
        const out = [];
        M.plain(out, "", [].concat(lines || []));
        M.choiceTo(out, labels, codes.map(c => (c ? script([], c) : [])), labels.length - 1);
        run(interp, out);
    }
    function think(interp, lines) {
        const out = [];
        M.linesTo(out, M.HERO, [].concat(lines || []), null, 0, null);
        run(interp, out);
    }
    function note(interp, lines) { const out = []; M.plain(out, "", [].concat(lines || []).map(l => String(l).replace(/^> /, ""))); run(interp, out); }

    // ------------------------------------------------------------------ Wyspy.use(this): an island's thing used
    function use(interp) {
        if (!has() || !interp) return;
        const ev = $gameMap.event(interp.eventId()), k = kindOf(ev);
        if (!k) return;
        const s = S();
        switch (k.kind) {
            case "hire": {
                const labels = [fill(TK.hire.solna, { cena: PRICE.solna }), fill(TK.hire.przemyt, { cena: PRICE.przemyt }), TK.hire.nie];
                ask(interp, TK.hire.ask, labels, [call("hire", 920), call("hire", 922), null]);
                return;
            }
            case "guard": ask(interp, TK.guard.ask, [TK.guard.go, TK.guard.nie], [call("guard"), null]); return;
            case "back": ask(interp, TK.back.ask, [TK.back.go, TK.back.zostan], [call("back", k.key), null]); return;
            case "oldboat":
                if (!s.boat923) ask(interp, TK.old.broken, [TK.old.fix, TK.old.nie], [call("fix"), null]);
                else ask(interp, TK.old.ask, [TK.old.go, TK.old.nie], [call("row923", "islet"), null]);
                return;
            case "isletboat": ask(interp, TK.old.ask, [TK.islet.go, TK.islet.zostan], [call("row923", "shore"), null]); return;
            case "nest": {
                if (!season()) { T.popup(TK.nest.season, { color: "#e8eef4" }); return; }
                if (!ready(s.nests[k.key], REGROW.nest)) { T.popup(TK.nest.empty, { color: "#e8eef4" }); return; }
                s.nests[k.key] = day();
                se("Crow", 55, 60);
                const feather = Math.random() < 0.4;
                got(ITEM.egg, 2, TK.nest.take, feather ? TK.nest.feather : "");
                if (feather) give(ITEM.feathers, 1);
                T.popup(TK.nest.hiss, { color: "#e8eef4" });
                syncLooks();
                return;
            }
            case "salt": {
                if (!ITEM.knife.some(id => count(id) > 0)) { T.popup.need(icon(ITEM.knife[0]), TK.salt.knife); return; }
                if (!ready(s.salt[k.key], REGROW.salt)) { T.popup(TK.salt.empty, { color: "#e8eef4" }); return; }
                if (raining()) { T.popup(TK.salt.rain, { color: "#9fd4ff" }); return; }
                s.salt[k.key] = day();
                se("Sword1", 50, 140);
                got(ITEM.salt, T.time.season() === 1 ? 2 : 1, TK.salt.take);
                syncLooks();
                return;
            }
            case "cache": {
                if (!ready(s.cache, REGROW.cache)) { T.popup(TK.cache.empty, { color: "#e8eef4" }); return; }
                s.cache = day();
                se("Chest1", 80, 100);
                give(ITEM.spice, 2); give(ITEM.beer, 2); give(ITEM.pitch, 1); $gameParty.gainGold(15);
                T.popup(TK.cache.take, { icon: icon(ITEM.spice), kind: "good", sub: (item(ITEM.spice) ? item(ITEM.spice).name : "") + " ×2, " + (item(ITEM.beer) ? item(ITEM.beer).name : "") + " ×2, 15 G" });
                syncLooks();
                if (!s.cacheNote) { s.cacheNote = day(); note(interp, TK.cache.note); }
                return;
            }
            case "smugboat": s.smug = s.smug || day(); think(interp, TK.smugboat.look); return;
            case "cross": {
                if (!s.crossNote) { s.crossNote = day(); note(interp, TK.cross.look); }
                if (s.cross === day()) { T.popup(TK.cross.today, { color: "#ffe9b0" }); return; }
                const fish = ITEM.fish.find(id => count(id) > 0);
                if (!fish) { T.popup.need(icon(ITEM.fish[0]), TK.cross.fish); return; }
                ask(interp, [], [TK.cross.offer, TK.cross.nie], [call("offer", fish), null]);
                return;
            }
            case "eaglenest": {
                if (!ready(s.eagle, REGROW.eaglenest)) { T.popup(TK.eagle.empty, { color: "#e8eef4" }); return; }
                s.eagle = day();
                se("Wind7", 50, 130);
                got(ITEM.feathers, 3, TK.eagle.take);
                return;
            }
            case "signal": ask(interp, TK.signal.ask, [TK.signal.go, TK.signal.nie], [call("signal"), null]); return;
            case "post": {
                if (s.post) { T.popup(TK.post.empty, { color: "#e8eef4" }); return; }
                s.post = day();
                se("Chest1", 80, 90);
                give(ITEM.arrows, 10); give(ITEM.rope, 1); give(ITEM.pitch, 1); $gameParty.gainGold(8);
                T.popup(TK.post.take, { icon: icon(ITEM.arrows), kind: "good", sub: (item(ITEM.arrows) ? item(ITEM.arrows).name : "") + " ×10, " + (item(ITEM.rope) ? item(ITEM.rope).name : "") + ", 8 G" });
                syncLooks();
                note(interp, TK.post.note);
                return;
            }
            case "dig": {
                if (s.dug) { T.popup(TK.dig.empty, { color: "#e8eef4" }); return; }
                if (count(ITEM.shovel) <= 0) { T.popup.need(icon(ITEM.shovel), TK.dig.shovel); return; }
                s.dug = day();
                se("Earth2", 70, 110);
                give(ITEM.amber, 1); $gameParty.gainGold(30);
                T.popup(TK.dig.take, { icon: icon(ITEM.amber), kind: "good", sub: (item(ITEM.amber) ? item(ITEM.amber).name : "") + ", 30 G" });
                syncLooks();
                note(interp, TK.dig.note);
                return;
            }
            case "wreck": {
                if (s.wreck) { T.popup(TK.wreck.empty, { color: "#e8eef4" }); return; }
                s.wreck = day();
                se("Break", 60, 90);
                give(ITEM.rope, 2); give(ITEM.nails, 6); give(ITEM.planks, 2);
                T.popup(TK.wreck.take, { icon: icon(ITEM.planks), kind: "good", sub: (item(ITEM.rope) ? item(ITEM.rope).name : "") + " ×2, " + (item(ITEM.nails) ? item(ITEM.nails).name : "") + " ×6, " + (item(ITEM.planks) ? item(ITEM.planks).name : "") + " ×2" });
                return;
            }
        }
    }

    // ------------------------------------------------------------------ Wyspy.act(this, [what, a, b]): the choices' actions
    function go(map, at) { $gamePlayer.reserveTransfer(map, at[0], at[1], at[2] || 2, 0); }
    function act(interp, args) {
        if (!has() || !Array.isArray(args)) return;
        const [what, a] = args, s = S();
        if (what === "hire") {
            const dest = Number(a), price = dest === 922 ? PRICE.przemyt : PRICE.solna;
            if (storming()) { T.popup(TK.hire.burza, { color: "#9fd4ff" }); return; }
            if (dest === 922 && !night()) { T.popup(TK.hire.noc, { color: "#ffe9a8" }); return; }
            if (dest === 920 && !daytime()) { T.popup(TK.hire.dzien, { color: "#ffe9a8" }); return; }
            if ($gameParty.gold() < price) { T.popup.need(313, fill(TK.hire.gold, { cena: price })); return; }
            $gameParty.loseGold(price);
            se("Water1", 60, 90);
            T.popup(TK.hire.row, { color: "#9fd4ff" });
            go(dest, LANDING[dest]);
        } else if (what === "guard") {
            if (storming()) { T.popup(TK.hire.burza, { color: "#9fd4ff" }); return; }
            if (!daytime()) { T.popup(TK.guard.noc, { color: "#ffe9a8" }); return; }
            se("Water1", 60, 90);
            go(951, LANDING[951]);
        } else if (what === "back") {
            if (storming()) { T.popup(TK.hire.burza, { color: "#9fd4ff" }); return; }
            se("Water1", 60, 90);
            const H = a === "garrison" ? GARRISON : HARBOUR;
            go(H.map, H.land);
        } else if (what === "fix") {
            if (count(ITEM.planks) < 4 || count(ITEM.nails) < 4 || count(ITEM.pitch) < 1) { T.popup.need(icon(ITEM.planks), TK.old.need); return; }
            take(ITEM.planks, 4); take(ITEM.nails, 4); take(ITEM.pitch, 1);
            s.boat923 = day();
            se("Hammer", 80, 100);
            T.popup(TK.old.fixed, { icon: icon(ITEM.planks), kind: "good" });
        } else if (what === "row923") {
            if (storming()) { T.popup(TK.hire.burza, { color: "#9fd4ff" }); return; }
            se("Water1", 60, 90);
            go(923, a === "islet" ? LANDING[923] : LANDING[9230]);
        } else if (what === "offer") {
            const fish = Number(args[1]);
            if (s.cross === day() || count(fish) <= 0) return;
            take(fish, 1);
            s.cross = day();
            const hours = 4;
            if ($gameSystem.addBuff) $gameSystem.addBuff("blogoslawienstwo", hours);
            se("Item3", 70, 90);
            T.popup(TK.cross.done, { top: true, color: "#ffe9b0", sub: fill(TK.cross.sub, { h: hours }) });
        } else if (what === "signal") {
            se("Fire1", 60, 100);
            T.popup(TK.signal.row, { color: "#ffe9a8" });
            go(HARBOUR.map, HARBOUR.land);
        }
    }

    // ------------------------------------------------------------------ the sandbars: Wrak.js floods region 61 on these maps too
    if (window.WrakData && WrakData.FLOOD) for (const m of FLOOD_MAPS) WrakData.FLOOD[m] = WrakData.FLOOD[m] || { [FLOOD_REGION]: "low" };
    const W = () => T.api("Wrak"), WY = () => T.api("Wyspa");
    const tideNow = () => { const w = WY(); try { return w && w.tide ? w.tide() : null; } catch (e) { return null; } };
    const hhmm = h => { const t = ((h % 24) + 24) % 24, hh = Math.floor(t), mm = Math.round((t - hh) * 60 / 10) * 10; return hh + ":" + String(mm >= 60 ? 50 : mm).padStart(2, "0"); };
    function lowLeft(t) {
        const w = WY();
        if (!t || !t.low || !w || !w.tide) return 0;
        for (let dt = 0.05; dt < 4; dt += 0.05) { const hh = hour() + dt, dd = day() + Math.floor(hh / 24); if (!w.tide(dd, hh % 24).low) return dt; }
        return 4;
    }
    function tideWarnings() {
        const t = tideNow(), s = S();
        if (!t) return;
        if (t.low) {
            if (lowLeft(t) < 0.45 && s.tideLow < 0) { s.tideLow = day() * 100 + Math.floor(hour() * 2); T.popup(TK.tide.ending, { color: "#9fd4ff" }); }
        } else if (s.tideLow >= 0) {
            s.tideLow = -1;
            T.popup(fill(TK.tide.flooded, { t: hhmm(hour() + (t.nextLow || 0)) }), { color: "#9fd4ff" });
        }
    }
    // the hero caught on the bar by the water: carried to the nearest dry cell along the bar (the shore or the island)
    function rescue() {
        const w = W();
        if (!w || !w.floodedAt || $gamePlayer.isTransferring()) return;
        const px = $gamePlayer.x, py = $gamePlayer.y;
        if (!w.floodedAt(px, py)) return;
        const seen = new Set([px + "," + py]), q = [[px, py]];
        while (q.length) {
            const [x, y] = q.shift();
            for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
                const nx = x + dx, ny = y + dy, key = nx + "," + ny;
                if (seen.has(key) || !$gameMap.isValid(nx, ny)) continue;
                seen.add(key);
                if ($gameMap.regionId(nx, ny) === FLOOD_REGION) { q.push([nx, ny]); continue; }
                if (!w.floodedAt(nx, ny) && [2, 4, 6, 8].some(d => $gameMap.isPassable(nx, ny, d))) {
                    T.popup(TK.tide.pushed, { color: "#9fd4ff" });
                    $gamePlayer.reserveTransfer($gameMap.mapId(), nx, ny, $gamePlayer.direction(), 0);
                    return;
                }
            }
        }
    }
    let tick = 0;
    T.onMapUpdate(() => {
        if (!has()) return;
        const m = $gameMap.mapId();
        if (FLOOD_MAPS.indexOf(m) < 0) return;
        tick++;
        if (tick % 15 === 0) rescue();
        if (tick % 60 === 0) tideWarnings();
    }, { owner: PLUGIN, name: "sandbars" });

    window.Wyspy = T.register(PLUGIN, { state: () => S(), use, act, SPOTS, LANDING, syncLooks });
})();
