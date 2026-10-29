//=============================================================================
// Zasoby.js
//=============================================================================
// PACZKA A „Woda i zasoby” (docs/rozszerzenia/PLAN.md, punkt 4) - the engine. The data and texts: Zasoby_Data.js. Event ids 2100-2299
// (Tawerna.inject, owner "Zasoby"), its state Tawerna.state("zasoby") and its quests: the thread "zasoby" of Zasoby_Data.js (the
// engine Watki.js - this file gives its conditions' hooks), its F9 rows through Okolice.f9.add, its places through
// Okolice.registerSpots("A", ...), its discoveries through Okolice.discoverable / Okolice.discover.
//   A1 five hidden springs (Map017/021/013/155/168): portions a day by the season and the weather (dry in the heat and the drought,
//      frozen in snow); the menu of a well (drink, waterskin, can, bucket) - each draw takes a portion; the dog sniffs towards one it
//      does not know yet, frogs croak at dusk by the forest one. A wild rare herb by three of them (Jagna's D30)
//   A2 the neighbour's farm (Map003): the ruined hut (searched once: Rzepka's letter, a rope, nails), the wild garden (hoe), the dry
//      well: cleared (shovel), mended (blocks, rope, planks, hammer), then it gathers ONLY rain (4 portions; the heat takes one a day;
//      snow freezes it); switch 21 Zas_Studnia = mended. K57 (grandpa)
//   A3 three wild hives by the pines (Map003): a knife; without smoke (a lit torch in hand or a fire within 3) stings and one honey only
//   A4 two fairy rings after rain (Map017): eight mushrooms each; at night the middle of a ring: fog, a whisper, the discovery
//   A5 Babka Jagna (TownLife 2900) and her glade: herbs not hers to take; D30 teaches the grafting salve and the valerian brew
//      (the deep sleep: +20% strength after the first sleep)
//   A6 Podgrodzie (Map111): three gardens (help in the morning, theft at night - seen: opinion), the rubbish heap (D31's things),
//      the clay pit (muddy water after rain - not for drinking). K56, D31
//   A7 the mountains (Map013): the block wall (6 blocks a week), three ore veins of ChoppableTree that grow back in 7 days
//   A8 the coast: crabs in the tidal pools of the cove at low tide (Map125), driftwood after storms and once a day (125, 155, 162)
//   A9 the burnt orchard of the Ługs (Map168): prune, dress, water on three days - leaves, then blossom, then apples. K58 (Marta)
//   A10 the townsfolk's fields (Map008): a day's wage at sowing and harvest, theft
// DROUGHT (the user's rule): the springs and the rain well are the only new water; the sea, the pools, the clay pit give none.

/*:
 * @target MZ
 * @plugindesc [paczka A] Woda i zasoby: źródełka, zagroda sąsiada ze studnią deszczową, dzikie ule, kręgi grzybów, Babka Jagna i jej zioła, ogródki, wysypisko i glinianka, kamieniołom bloków i żyły rudy, kraby i drewno z morza, spalony sad, pola mieszczan. v1.1.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @base Zasoby_Data
 * @orderAfter Okolice
 *
 * @help
 * ============================================================================
 * Zasoby.js - silnik paczki A „Woda i zasoby”
 * ============================================================================
 * Plan i kontrakt: docs/rozszerzenia/PLAN.md. Dane: Zasoby_Data.js.
 * Numery zdarzeń: 2100-2299. Test: tests/zasoby_test.js (port 9551).
 *
 * Źródełka (5, ukryte): 1-2 porcje dziennie, w upał i suszę suche,
 * w śnieg zamarznięte. Studnia sąsiada: tylko deszczówka, najwyżej 4.
 * Dzikie ule, kręgi grzybów, zioła i Babka Jagna, ogródki, wysypisko,
 * glinianka, ściana ciosowa, żyły rudy, kraby, drewno z morza, sad Ługów,
 * pola mieszczan. Zadania K55-K58, D30-D31.
 *
 * W zdarzeniach: Zasoby.use(this). Dla testów i F9: Zasoby.state(),
 * Zasoby.springLeft(klucz), Zasoby.wellUnits(), Zasoby.ringBorn(),
 * Zasoby.sync(), Zasoby.dbg (deszcz wczoraj, upał, śnieg).
 * ============================================================================
 */

(() => {
    "use strict";
    const TK = Watki.teksty("zasoby");   // (the words of this file: js/teksty/zasoby.txt, kod.*)

    const PLUGIN = "Zasoby";
    const T = window.Tawerna;
    if (!T) throw new Error("Zasoby.js: brak TawernaCore.js");
    const D = window.ZasobyData;
    if (!D) throw new Error("Zasoby.js: brak Zasoby_Data.js - musi stać wyżej na liście wtyczek");
    const OK = T.api("Okolice") || window.Okolice;
    if (!OK) throw new Error("Zasoby.js: brak Okolice.js - musi stać wyżej na liście wtyczek");
    // the thread (Zasoby_Data.js, the engine Watki.js): the state "zasoby", K55-K58 / D30-D31, the hero's thoughts, the flags
    const w = Watki.get("zasoby");
    if (!w) throw new Error("Zasoby.js: brak wątku „zasoby” (Zasoby_Data.js / Watki.js)");
    const VERSION = "1.1.0";
    const { ITEM, TX } = D;
    const ICON = D.ICON;

    // ------------------------------------------------------------------
    // The state in the save: the thread's (Zasoby_Data.js)
    // ------------------------------------------------------------------
    const has = () => !!window.$gameSystem;
    const S = () => w.S();

    // ------------------------------------------------------------------
    // Small helpers
    // ------------------------------------------------------------------
    const { C } = Watki.mowa;
    const day = () => T.time.day(), hour = () => T.time.hour();
    const season = d => T.time.season(d === undefined ? day() : d);
    const item = id => (window.$dataItems && $dataItems[id]) || null;
    const count = id => (item(id) ? $gameParty.numItems(item(id)) : 0);
    const iconOf = id => (item(id) ? item(id).iconIndex : 0);
    const nameOf = id => (item(id) && item(id).name ? item(id).name : "?");
    const gain = (id, n) => { if (item(id) && n > 0) $gameParty.gainItem(item(id), n); };
    const lose = (id, n) => { if (item(id) && n > 0) $gameParty.loseItem(item(id), n, false); };
    const need = (icon, text) => T.popup.need(icon, text);
    const pop = (text, icon, color) => T.popup(text, { icon: icon || 0, color: color || "#cfe6ff" });
    const good = (text, icon) => T.popup(text, { icon: icon || 0, kind: "good" });
    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const se = (name, vol, pitch) => T.audio && T.audio.se && T.audio.se(name, { volume: vol || 80, pitch: pitch || 100 });
    const F = () => T.api("Farming");
    const TQ = () => T.api("TownQuests");
    const TL = () => T.api("TownLife");
    const SB = () => T.api("SpeechBubbles");
    const isDone = id => w.done(id);
    const isActive = id => w.active(id);
    const opinion = (n, why) => T.call("TownQuests", "addOpinion", n, why);
    const tqState = () => w.qstate();
    const flag = k => w.flag(k);
    const mapId = () => (window.$gameMap ? $gameMap.mapId() : 0);
    const hash = (a, b) => { let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
    const inHours = (h, r) => (r[0] <= r[1] ? h >= r[0] && h < r[1] : h >= r[0] || h < r[1]);
    const night = h => h >= 21 || h < 4;
    const note = (title, text) => T.call("Journal", "addNote", title, text);
    const xp = (n, why) => T.call("Combat", "gainXp", n, why, true);

    // ------------------------------------------------------------------
    // The weather (Okolice's words) and the F9 overrides (runtime only, not saved)
    // ------------------------------------------------------------------
    const dbg = { rain: false, hot: false, snow: false };
    const rainOn = d => !!OK.rainOn(d) || (dbg.rain && d === day() - 1);
    const rainedRecently = d => rainOn(d) || rainOn(d - 1);
    const hot = d => (dbg.hot && d === day()) || !!OK.hot(d);
    const drought = d => !dbg.rain && !!OK.drought(d);
    const snowOn = d => (dbg.snow && d === day()) || !!OK.snowOn(d);

    // ------------------------------------------------------------------
    // Speech: the hero's thoughts one after another (the thread's - Zasoby_Data mysli); messages for talks and notes (Watki.mowa:
    // "\n" a new line, "> " the hero; plain - a title line and the text wrapped at 52, four lines a page)
    // ------------------------------------------------------------------
    const think = lines => w.mysl(lines);
    const linesTo = (out, spk, arr) => w.linie(out, spk, [].concat(arr || []));
    const plain = (out, title, lines) => Watki.mowa.plain(out, title, lines);
    function runList(list) {
        if (window.$gameMap && !$gameMap._interpreter.isRunning()) w.uruchom(null, list);
    }

    // ------------------------------------------------------------------
    // The menus (Farming's menu at the bottom left), opened once the event that asked is over
    // ------------------------------------------------------------------
    let pendingMenu = null;
    function menu(title, entries, noteText) { pendingMenu = { title, entries: entries.filter(Boolean), note: noteText || "" }; }
    T.onMapUpdate(scene => {
        if (!pendingMenu || $gameMap.isEventRunning() || $gameMessage.isBusy()) return;
        const m = pendingMenu;
        pendingMenu = null;
        if (m.entries.length && scene && typeof scene.openFarmMenu === "function") scene.openFarmMenu(m.title, m.entries, "", 0, null, null, m.note);
    }, { owner: PLUGIN, name: "menu" });

    // ------------------------------------------------------------------
    // Work: blow after blow with a tool (the swing of ChoppableTree), held O goes on while he faces the thing
    //   spec: { key, cells, tools (ids, the first owned; [] = hands), kind (swing; a function of the tool), cost, need(tool) (blows),
    //           se, fx, missing (text), can() (still worth a blow), done(tool) }
    // ------------------------------------------------------------------
    const KIND = { pick: 1, shovel: 2, axe: 3, hoe: 5, crouch: 6, hammer: 7 };
    const workSpeed = () => { const v = Number(T.call("Combat", "workSpeed")); return v > 0 ? v : 1; };
    const toolOf = ids => { for (const id of ids || []) if (count(id) > 0) return id; return 0; };
    let again = null;
    const SPECS = {};   // key prefix -> (key) => spec
    function specFor(key) {
        const k = String(key).split(":")[0], f = SPECS[k];
        return f ? f(key) : null;
    }
    function workOf(spec, tool) {
        const w = S().work[spec.key];
        if (w) return w;
        return (S().work[spec.key] = { done: 0, need: Math.max(1, typeof spec.need === "function" ? spec.need(tool) : spec.need || 1) });
    }
    function strike(spec) {
        if (!spec || (spec.can && !spec.can())) return false;
        const tool = spec.tools && spec.tools.length ? toolOf(spec.tools) : -1;
        if (tool === 0) { need(iconOf(spec.tools[0]), spec.missing || TK.kod.strike[0]); return false; }
        if (spec.cost > 0 && typeof $gameSystem.trySpendStamina === "function" && !$gameSystem.trySpendStamina(spec.cost)) { need(ICON.stamina, TX.needs.tired); return false; }
        const kind = typeof spec.kind === "function" ? spec.kind(tool) : spec.kind, rate = workSpeed();
        const next = () => { again = { key: spec.key, at: Graphics.frameCount + Math.max(2, Math.round(12 / rate)) }; };
        const started = $gamePlayer.startToolSwing && $gamePlayer.startToolSwing(kind, () => blow(spec, tool), next, { rate });
        if (!started) blow(spec, tool);
        return true;
    }
    function blow(spec, tool) {
        if (tool > 0) T.call("Durability", "use", tool);
        const w = workOf(spec, tool);
        w.done++;
        const last = w.done >= w.need;
        if (spec.se) se(spec.se, 85, 95 + Math.floor(Math.random() * 10));
        const c = (spec.cells && spec.cells[0]) || [$gamePlayer.x, $gamePlayer.y];
        if (spec.fx && $gameTemp) ($gameTemp._hitFx || ($gameTemp._hitFx = [])).push({ type: spec.fx, final: last, bx: c[0] + 0.5, by: c[1] + 1,
            dx: Math.sign(c[0] - $gamePlayer.x), dy: Math.sign(c[1] - $gamePlayer.y) });
        if (last) {
            delete S().work[spec.key];
            again = null;
            spec.done(tool);
            syncSoon();
        }
    }
    function facing(cells) {
        const p = $gamePlayer, d = p.direction();
        const x = $gameMap.roundXWithDirection(p.x, d), y = $gameMap.roundYWithDirection(p.y, d);
        return (cells || []).some(([cx, cy]) => (cx === x && cy === y) || (cx === p.x && cy === p.y));
    }
    T.onMapUpdate(() => {
        if (!again || Graphics.frameCount < again.at) return;
        const a = again;
        again = null;
        if (!Input.isPressed("ok") || !T.isCalm(null, { only: ["farmMenu", "build", "event", "message", "tool"] })) return;
        const spec = specFor(a.key);
        if (!spec || !facing(spec.cells)) return;
        strike(spec);
    }, { owner: PLUGIN, name: "hold" });
    const workLeft = key => { const w = S().work[key]; return w ? w.need - w.done : 0; };
    const workText = (key, total) => { const w = S().work[key]; return w ? " (" + w.done + "/" + w.need + ")" : total ? Watki.wstaw(TK.kod.workText[0], { total: total }) : ""; };

    // ------------------------------------------------------------------
    // The water menu: Farming's well entries (drink, waterskin, can, bucket), each draw takes a portion of this source
    // ------------------------------------------------------------------
    function waterEntries(left, use, help, emptyText) {
        const parts = T.api("Farming_parts"), well = parts && parts.plots && parts.plots.wellEntries ? parts.plots.wellEntries() : [];
        return well.map(e => e && Object.assign({}, e, { help: (e.help || "") + help, enabled: e.enabled && left() > 0,
            run: () => {
                if (left() < 1) { need(ICON.water, emptyText); return false; }
                const ok = e.run();
                if (ok) { use(); syncSoon(); }
                return ok;
            } })).filter(Boolean);
    }

    // ------------------------------------------------------------------
    // The events (Tawerna.inject): object pictures !$Zas_* (3 x 4 cells; the look = row (direction) and column (pattern), set by
    // the code), a hidden first page for things that come and go (self switch A shows them)
    // ------------------------------------------------------------------
    const REG = {};   // mapId -> id -> { kind, ref }
    const reg = (map, id, kind, ref) => { (REG[map] || (REG[map] = {}))[id] = { kind, ref }; };
    const onA = { selfSwitchValid: true, selfSwitchCh: "A" };
    function objEvent(id, name, x, y, image, o) {
        const opt = o || {};
        const p = OK.page({ image: { characterName: image, direction: opt.dir || 2, pattern: opt.pat || 0, characterIndex: opt.index || 0 },
            list: opt.noUse ? [] : [C(355, ["Zasoby.use(this)"])], priority: opt.priority === undefined ? 1 : opt.priority, through: !!opt.through,
            directionFix: true, stepAnime: !!opt.step, cond: opt.hide ? onA : null });
        const pages = opt.hide ? [OK.page({ priority: 0, through: true }), p] : [p];
        return OK.event(id, name, x, y, pages, (opt.note || "") + "<Zasoby:" + opt.kind + ">");
    }
    // Farming's random dry bush dies under any event: a blank on every cell of the package's areas that has one and no event of ours
    function bushAt(x, y) {
        const f = F();
        try { return !!(f && f.hash2 && f.BUSH_SHARE !== undefined && f.hash2(x, y, 811) < f.BUSH_SHARE); } catch (e) { return false; }
    }
    function withBlanks(map, events) {
        const [from, to] = D.IDS[map], used = new Set(events.map(e => e.id)), taken = new Set(events.map(e => e.x + "," + e.y));
        let next = from;
        const freeId = () => { while (next <= to && used.has(next)) next++; return next <= to ? next++ : 0; };
        for (const s of D.SPOTS.filter(s => s.map === map && s.mode !== "zone")) {
            for (const [x, y] of OK.cellsOf(s)) {
                if (taken.has(x + "," + y) || !bushAt(x, y)) continue;
                const id = freeId();
                if (!id) break;
                taken.add(x + "," + y);
                events.push(OK.blank(id, x, y, TK.kod.withBlanks[0]));
            }
        }
        return events;
    }

    // ---- the pictures (img/characters, tools/rozszerzenia/A/build_art.py)
    const IMG = { spring: "!$Zas_Zrodlo", stones: "!$Zas_Kamienie", herb: "!$Zas_Ziolo", ruin: "!$Zas_Ruina", garden: "!$Zas_Ogrodek",
        well: "!$Zas_Studnia", fence: "!$Zas_Plot", hive: "!$Zas_DzikiUl", mushroom: "!$Zas_Grzyb", dump: "!$Zas_Wysypisko", clay: "!$Zas_Glinianka",
        quarry: "!$Zas_ScianaCiosowa", pool: "!$Zas_Kaluza", drift: "!$Zas_Drewno", tree: "!$Zas_SadSpalony", crops: "!Zas_Uprawy", marta: "$Npc_Praczka" };

    // ---- A1 springs (+ the stones, the wild herb) on five maps
    function springEvents(sp) {
        const out = [objEvent(sp.id, sp.name, sp.sx, sp.sy, IMG.spring, { kind: "spring:" + sp.key, step: true })];
        reg(sp.map, sp.id, "spring", sp);
        const right = [sp.sx + 1, sp.sy + 1], left = [sp.sx - 1, sp.sy + 1];
        out.push(objEvent(sp.stones[0], TK.kod.springEvents[0], right[0], right[1], IMG.stones, { kind: "stones", noUse: true, through: true, pat: 0 }));
        if (sp.herb) {
            out.push(objEvent(sp.herb.id, D.HERBS[sp.herb.kind].name, left[0], left[1], IMG.herb, { kind: "herb:" + sp.herb.kind, through: true, dir: 2 }));
            reg(sp.map, sp.herb.id, "herb", { kind: sp.herb.kind, wild: true, x: left[0], y: left[1] });
        } else out.push(objEvent(sp.stones[1], TK.kod.springEvents[0], left[0], left[1], IMG.stones, { kind: "stones", noUse: true, through: true, pat: 1 }));
        return out;
    }
    const springOf = map => D.SPRINGS.find(s => s.map === map) || null;

    // ---- Map017: the spring, Jagna's glade, the fairy rings
    T.inject(17, { ids: D.IDS[17], owner: PLUGIN, build: () => {
        const out = springEvents(springOf(17));
        for (const h of D.GLADE.herbs) {
            out.push(objEvent(h.id, D.HERBS[h.kind].name, h.x, h.y, IMG.herb, { kind: "herb:" + h.kind, through: true }));
            reg(17, h.id, "herb", { kind: h.kind, glade: true, x: h.x, y: h.y });
        }
        D.RINGS.forEach((r, ri) => r.cells.forEach(([x, y], i) => {
            const id = r.ids[i];
            out.push(objEvent(id, "Grzyb", x, y, IMG.mushroom, { kind: "mushroom", hide: true, through: true, dir: 2 + 2 * ((i + ri) % 2), pat: (i * 2 + ri) % 3 }));
            reg(17, id, "mushroom", { ring: r.key, i, look: [2 + 2 * ((i + ri) % 2), (i * 2 + ri) % 3] });
        }));
        return withBlanks(17, out);
    } });
    T.inject(21, { ids: D.IDS[21], owner: PLUGIN, build: () => withBlanks(21, springEvents(springOf(21))) });

    // ---- Map013: the spring, the block wall, the ore veins (ChoppableTree's mining, our own commands and note)
    T.inject(13, { ids: D.IDS[13], owner: PLUGIN, build: () => {
        const out = springEvents(springOf(13)), Q = D.QUARRY;
        Q.ids.forEach((id, i) => {
            out.push(objEvent(id, TK.kod.build[0], Q.at[i][0], Q.at[i][1], IMG.quarry, { kind: "quarry", note: "<Occupy:right=1,up=1>" }));
            reg(13, id, "quarry", { i, cells: [[Q.at[i][0], Q.at[i][1]], [Q.at[i][0] + 1, Q.at[i][1]], [Q.at[i][0], Q.at[i][1] - 1], [Q.at[i][0] + 1, Q.at[i][1] - 1]] });
        });
        for (const v of D.VEINS) {
            const p = OK.page({ image: { characterName: v.image, direction: 2, pattern: 1 }, list: [C(357, ["ChoppableTree", "mine", TK.kod.build[1], {}])], priority: 1 });
            out.push(OK.event(v.id, TK.kod.build[2], v.x, v.y, [p], D.VEIN_RULE.note + "<Zasoby:vein>"));
            reg(13, v.id, "vein", v);
        }
        return withBlanks(13, out);
    } });

    // ---- Map155 / Map162 / Map125: springs, driftwood, the tidal pools
    function driftEvents(map) {
        return (D.DRIFT[map] || []).map((d, i) => {
            reg(map, d.id, "drift", { map, i });
            return objEvent(d.id, TK.kod.driftEvents[0], d.x, d.y, IMG.drift, { kind: "drift", hide: true, through: true, pat: i % 3 });
        });
    }
    T.inject(155, { ids: D.IDS[155], owner: PLUGIN, build: () => withBlanks(155, springEvents(springOf(155)).concat(driftEvents(155))) });
    T.inject(162, { ids: D.IDS[162], owner: PLUGIN, build: () => withBlanks(162, driftEvents(162)) });
    T.inject(125, { ids: D.IDS[125], owner: PLUGIN, build: () => {
        const out = D.POOLS.map((p, i) => { reg(125, p.id, "pool", Object.assign({ i }, p)); return objEvent(p.id, TK.kod.build[3], p.x, p.y, IMG.pool, { kind: "pool", hide: true, through: true, step: true }); });
        return withBlanks(125, out.concat(driftEvents(125)));
    } });

    // ---- Map168: the old spring of the Ługs, the orchard, Marta among the trees
    T.inject(168, { ids: D.IDS[168], owner: PLUGIN, build: () => {
        const out = springEvents(springOf(168)), O = D.ORCHARD;
        O.trees.forEach(([x, y], i) => {
            out.push(objEvent(O.ids[i], TK.kod.build[4], x, y, IMG.tree, { kind: "tree" }));
            reg(168, O.ids[i], "tree", { i, x, y });
        });
        const m = O.marta;
        out.push(OK.event(m.id, TK.kod.build[5], m.x, m.y, [OK.page({ priority: 0, through: true }),
            OK.page({ image: { characterName: IMG.marta, direction: 2, pattern: 1 }, list: [C(355, ["Zasoby.use(this)"])], priority: 1, cond: onA, stepAnime: false, walkAnime: true })],
            "<Zasoby:marta>"));
        reg(168, m.id, "marta", m);
        return withBlanks(168, out);
    } });

    // ---- Map003: the neighbour's farm and the wild hives
    T.inject(3, { ids: D.IDS[3], owner: PLUGIN, build: () => {
        const Fs = D.FARMSTEAD, out = [];
        out.push(objEvent(Fs.ruin.id, TK.kod.build[6], Fs.ruin.x, Fs.ruin.y, IMG.ruin, { kind: "ruin", note: Fs.ruin.occupy }));
        reg(3, Fs.ruin.id, "ruin", Fs.ruin);
        Fs.garden.ids.forEach((id, i) => {
            const [x, y] = Fs.garden.cells[i];
            out.push(objEvent(id, TK.kod.build[7], x, y, IMG.garden, { kind: "garden", through: true, pat: i % 3 }));
            reg(3, id, "garden", { i, x, y });
        });
        out.push(objEvent(Fs.well.id, TK.kod.build[8], Fs.well.x, Fs.well.y, IMG.well, { kind: "well" }));
        reg(3, Fs.well.id, "well", Fs.well);
        out.push(objEvent(Fs.fence.id, TK.kod.build[9], Fs.fence.x, Fs.fence.y, IMG.fence, { kind: "fence", through: true }));
        reg(3, Fs.fence.id, "fence", Fs.fence);
        for (const h of D.HIVES) {
            out.push(objEvent(h.id, TK.kod.build[10], h.x, h.y, IMG.hive, { kind: "hive", step: true }));
            reg(3, h.id, "hive", h);
        }
        return withBlanks(3, out);
    } });

    // ---- Map111: the gardens, the rubbish heap, the clay pit
    T.inject(111, { ids: D.IDS[111], owner: PLUGIN, build: () => {
        const out = [];
        for (const g of D.GARDENS) g.ids.forEach((id, i) => {
            const [x, y] = g.cells[i];
            out.push(objEvent(id, TK.kod.build[11], x, y, IMG.crops, { kind: "plot", through: true, index: g.crop }));
            reg(111, id, "plot", g);
        });
        for (const h of D.DUMP.heaps) {
            out.push(objEvent(h.id, "Wysypisko", h.x, h.y, IMG.dump, { kind: "dump", through: !h.main, note: h.main ? "<Occupy:left=1,right=1>" : "", pat: h.pat || 0 }));
            reg(111, h.id, "dump", h);
        }
        const c = D.CLAYPIT;
        out.push(objEvent(c.id, "Glinianka", c.ex, c.ey, IMG.clay, { kind: "clay", note: c.occupy }));
        reg(111, c.id, "clay", c);
        return withBlanks(111, out);
    } });

    // ---- Map008: the townsfolk's fields (a crop on every other cell)
    const FIELD_CELLS = (() => {
        const out = [];
        let id = D.IDS[8][0];
        for (const f of D.FIELDS) {
            for (let y = f.y; y < f.y + f.h; y++) for (let x = f.x + ((y - f.y) % 2); x < f.x + f.w; x += 2) out.push({ id: id++, x, y, f });
        }
        return out;
    })();
    T.inject(8, { ids: D.IDS[8], owner: PLUGIN, build: () => {
        const out = FIELD_CELLS.map(c => { reg(8, c.id, "field", c.f); return objEvent(c.id, TK.kod.build[12], c.x, c.y, IMG.crops, { kind: "field", through: true, index: c.f.crop }); });
        return withBlanks(8, out);
    } });

    // ------------------------------------------------------------------
    // The looks: computed on the map's clock (every 20 frames, on mapReady, after an action) and kept for the event's page refresh
    // ------------------------------------------------------------------
    const LOOK = {};   // "map:id" -> [dir, pattern, stepAnime]
    function look(ev, dir, pat, step) {
        if (!ev) return;
        LOOK[ev._mapId + ":" + ev._eventId] = [dir, pat, step];
        applyLook(ev);
    }
    function applyLook(ev) {
        const L = LOOK[ev._mapId + ":" + ev._eventId];
        if (!L) return;
        const [dir, pat, step] = L;
        if (ev._direction !== dir) ev._direction = dir;
        const anim = !!step;
        if (ev._stepAnime !== anim) ev._stepAnime = anim;
        if (!anim && pat !== undefined && (ev._pattern !== pat || ev._originalPattern !== pat)) { ev._pattern = pat; ev._originalPattern = pat; }
    }
    const _setupPageSettings = Game_Event.prototype.setupPageSettings;
    Game_Event.prototype.setupPageSettings = function() {
        _setupPageSettings.call(this);
        if (LOOK[this._mapId + ":" + this._eventId]) applyLook(this);
    };
    function show(map, id, on) {
        const key = [map, id, "A"];
        if (!!$gameSelfSwitches.value(key) !== !!on) $gameSelfSwitches.setValue(key, !!on);
    }
    const evOf = id => (window.$gameMap ? $gameMap.event(id) : null);

    // ---- A1: portions a day
    function springMax(d) {
        if (snowOn(d) || hot(d) || drought(d)) return 0;
        let n = D.SPRING_RULE.base[season(d)];
        if (rainedRecently(d)) n = Math.min(D.SPRING_RULE.max, n + D.SPRING_RULE.rainBonus);
        return n;
    }
    function springLeft(key) {
        const r = S().springs[key], d = day(), max = springMax(d);
        return r && r.day === d ? Math.max(0, max - r.used) : max;
    }
    function springUse(key) {
        const d = day(), r = S().springs[key];
        S().springs[key] = r && r.day === d ? { day: d, used: r.used + 1 } : { day: d, used: 1 };
    }

    // ---- A2: the rain well (stage 2): +1 portion for each RAIN_HOURS hours of rain since the last look (Farming's rain hours over
    // Survival's plan, also while away), the heat takes one a hot day, snow freezes it
    function wellSync() {
        const w = S().well;
        if (w.stage < 2) return w;
        const f = F(), now = f && f.clockHours ? f.clockHours() : day() * 24 + hour();
        if (!(w.wt >= 0) || now < w.wt) w.wt = now;
        if (now > w.wt) {
            const rh = f && f.rainHoursBetween ? f.rainHoursBetween(w.wt, now) : 0;
            w.water = Math.min(D.FARMSTEAD.well.max, (w.water || 0) + rh / D.FARMSTEAD.well.rainHours);
            w.wt = now;
        }
        const d = day();
        if (hot(d) && w.hot !== d) { w.hot = d; w.water = Math.max(0, (w.water || 0) - 1); }
        return w;
    }
    const wellUnits = () => (S().well.stage >= 2 ? Math.floor((wellSync().water || 0) + 1e-6) : 0);
    const wellFrozen = () => snowOn(day());

    // ---- A3: the hives
    const hiveReady = h => { const t = S().hives[h.key]; return season() !== 3 && (t === undefined || day() - t >= D.HIVE_RULE.every); };

    // ---- A4: the rings - the rain day they come from (0: none now)
    function ringBorn() {
        const d = day(), h = hour();
        if (season(d) === 3) return 0;
        if (rainOn(d) && h >= 5) return d;
        if (rainOn(d - 1)) return d - 1;
        if (rainOn(d - 2) && h < 6) return d - 2;
        return 0;
    }
    function ringState(key) {
        const born = ringBorn(), r = S().rings[key];
        if (!born) return { born: 0, picked: [] };
        if (!r || r.born !== born) S().rings[key] = { born, picked: [] };
        return S().rings[key];
    }

    // ---- A5: the herbs (key: map:id) - "grown", "picked", "season"
    const herbKey = (map, id) => map + ":" + id;
    function herbState(map, id, kind) {
        const H = D.HERBS[kind], d = day();
        if (!H.seasons.includes(season(d))) return "season";
        const t = S().herbs[herbKey(map, id)];
        return t === undefined || d - t >= H.regrow ? "grown" : "picked";
    }

    // ---- A9: the orchard - a tree's record and what it shows
    const L4 = () => T.time.seasonLength() * 4;
    function tree(i) {
        const o = S().orchard;
        while (o.length < D.ORCHARD.trees.length) o.push({ st: 0, wd: [], leaf: 0, fruit: 0 });
        return o[i];
    }
    // the first day of the spring after a day (its own spring's first day when it is that very day)
    function springAfter(d) {
        const len = L4(), y0 = Math.floor((d - 1) / len), start = y0 * len + 1;
        return d <= start ? start : start + len;
    }
    function treeView(i) {
        const t = tree(i), d = day(), s = season(d);
        if (t.st < 4) return t.st === 0 ? "charred" : t.st === 1 ? "pruned" : "dressed";
        if (d < t.leaf) return "dressed";
        if (s === 3) return "winter";
        const ready = d >= springAfter(t.leaf);   // (a spring with leaves has gone by: it blossoms and bears)
        if (s === 0) return ready ? "bloom" : "leafy";
        return ready && d - (t.fruit || -99) >= D.ORCHARD.fruitEvery ? "fruit" : "leafy";
    }
    const treesAlive = () => D.ORCHARD.trees.filter((_, i) => tree(i).st >= 4).length;
    function martaInOrchard() {
        if (!has() || !flag("zasSadMarta")) return false;
        const d = day(), h = hour(), s = season(d);
        return (s === 1 || s === 2) && d % D.ORCHARD.fruitEvery === 2 && inHours(h, D.ORCHARD.marta.hours);
    }

    // ---- A6 / A10: the crops' look: character = the crop, row/column = the stage (0-3 growing, 4 stubble, 5 bare)
    const CROP_LOOK = [[2, 0], [2, 1], [2, 2], [4, 0], [4, 1], [4, 2]];
    function gardenStage(g) {
        const s = season(), st = S().steal[g.key];
        if (s === 3) return 5;
        if (st !== undefined && day() - st < 3) return 4;
        return [1, 2, 3][s];
    }
    function fieldStage(f) {
        const d = day(), s = season(d), dos = T.time.dayOfSeason(d);
        if (s === 3) return 5;
        if (s === 0) return dos <= D.FIELD_RULE.sow[1] ? 0 : 1;
        if (s === 1) return dos <= 14 ? 2 : 3;
        return dos <= D.FIELD_RULE.reap[1] ? 3 : 4;
    }

    // ---- A8: the tide - which low water this is (its number) and the crabs of a pool in it
    function lowWaterId() {
        const W = T.api("Wyspa"), TD = W && W.DATA && W.DATA.TIDE ? W.DATA.TIDE : { period: 12.42, offset: 3.5 };
        const t = (day() - 1) * 24 + hour() - TD.offset;
        return Math.floor(t / TD.period);
    }
    const tideLow = () => { const W = T.api("Wyspa"); try { return !!(W && W.tide && W.tide().low); } catch (e) { return false; } };
    function crabsLeft(p) {
        const id = lowWaterId(), max = 1 + Math.floor(hash(id, 31 + p.i) * D.CRAB_RULE.max), r = S().crabs[p.key];
        return Math.max(0, max - (r && r.id === id ? r.n : 0));
    }
    const driftOf = map => (S().drift[map] || (S().drift[map] = []));
    function addDrift(maps) {
        for (const map of maps || Object.keys(D.DRIFT).map(Number)) {
            const slots = D.DRIFT[map], have = driftOf(map), free = slots.map((_, i) => i).filter(i => !have.includes(i));
            for (let k = rnd(1, 2); k > 0 && free.length; k--) have.push(free.splice(Math.floor(Math.random() * free.length), 1)[0]);
        }
    }

    // ---- all the looks of the map the hero is on
    let syncAt = 0;
    const syncSoon = () => { syncAt = 0; };
    function syncAll() {
        if (!has() || !window.$gameMap) return;
        const map = mapId(), R = REG[map];
        if (!R) return;
        const d = day(), s = season(d);
        for (const idStr of Object.keys(R)) {
            const id = Number(idStr), ev = evOf(id), r = R[id];
            if (!ev) continue;
            switch (r.kind) {
                case "spring": {
                    const left = springLeft(r.ref.key), max = springMax(d);
                    if (snowOn(d)) look(ev, 8, 0, false);
                    else if (left <= 0) look(ev, 6, 1, false);
                    else look(ev, left >= 2 || (left === max && max > 0) ? 2 : 4, 1, true);
                    break;
                }
                case "herb": {
                    const st = herbState(map, id, r.ref.kind), row = 2 + 2 * D.HERBS[r.ref.kind].look;
                    look(ev, row, st === "grown" ? 0 : st === "picked" ? 1 : 2, false);
                    break;
                }
                case "mushroom": {
                    const rs = ringState(r.ref.ring), on = rs.born > 0 && !rs.picked.includes(r.ref.i);
                    show(map, id, on);
                    look(ev, r.ref.look[0], r.ref.look[1], false);
                    break;
                }
                case "well": {
                    const w = S().well;
                    if (w.stage === 0) look(ev, 2, 0, false);
                    else if (w.stage === 1) look(ev, 2, 1, false);
                    else if (wellFrozen()) look(ev, 4, 2, false);
                    else look(ev, 4, wellUnits() > 0 ? 1 : 0, false);
                    if ($gameSwitches && $gameSwitches.value(D.SWITCHES.studnia) !== (w.stage >= 2)) $gameSwitches.setValue(D.SWITCHES.studnia, w.stage >= 2);
                    break;
                }
                case "garden": {
                    const weeded = d - S().garden < D.FARMSTEAD.garden.regrow;
                    look(ev, weeded ? 4 : 2, r.ref.i % 3, false);
                    break;
                }
                case "hive": {
                    if (s === 3) look(ev, 6, 0, false);
                    else look(ev, hiveReady(r.ref) ? 2 : 4, 0, s === 1 || s === 2);
                    break;
                }
                case "plot": { const L = CROP_LOOK[gardenStage(r.ref)]; look(ev, L[0], L[1], false); break; }
                case "field": { const L = CROP_LOOK[fieldStage(r.ref)]; look(ev, L[0], L[1], false); break; }
                case "dump": look(ev, S().dump.day === d && S().dump.n >= D.DUMP.perDay ? 4 : 2, r.ref.pat || 0, false); break;
                case "clay": look(ev, rainedRecently(d) ? 4 : 2, 0, false); break;
                case "quarry": {
                    const left = quarryLeft();
                    look(ev, left >= D.QUARRY.perWeek ? 2 : left > 0 ? 4 : 6, r.ref.i % 3, false);
                    break;
                }
                case "pool": {
                    const low = tideLow();
                    show(map, id, low);
                    const n = crabsLeft(r.ref);
                    look(ev, n >= 2 ? 2 : n === 1 ? 4 : 6, 0, n > 0);
                    break;
                }
                case "drift": show(map, id, driftOf(map).includes(r.ref.i)); look(ev, 2, r.ref.i % 3, false); break;
                case "tree": {
                    const v = treeView(r.ref.i), L = { charred: [2, 0], pruned: [2, 1], dressed: [2, 2], leafy: [4, 0], bloom: [4, 1], fruit: [4, 2], winter: [6, 0] }[v];
                    look(ev, L[0], L[1], false);
                    break;
                }
                case "marta": show(map, id, martaInOrchard()); break;
                default: break;
            }
        }
    }
    T.onMapUpdate(() => {
        if (Graphics.frameCount < syncAt) return;
        syncAt = Graphics.frameCount + 20;
        syncAll();
    }, { owner: PLUGIN, name: "looks" });
    T.on("mapReady", () => { syncAll(); }, { owner: PLUGIN });
    function quarryLeft() {
        const q = S().quarry;
        if (!(q.from > 0) || day() - q.from >= D.QUARRY.week) return D.QUARRY.perWeek;
        return Math.max(0, D.QUARRY.perWeek - q.n);
    }

    // ------------------------------------------------------------------
    // The action button on one of our events: Zasoby.use(this)
    // ------------------------------------------------------------------
    function use(interp) {
        if (!has()) return;
        const id = interp && interp.eventId ? interp.eventId() : 0, map = mapId(), r = REG[map] && REG[map][id];
        if (!r) return;
        syncAll();
        try {
            switch (r.kind) {
                case "spring": return useSpring(r.ref);
                case "herb": return useHerb(map, id, r.ref);
                case "mushroom": return useMushroom(map, id, r.ref);
                case "ruin": return useRuin();
                case "garden": return useGarden();
                case "well": return useWell();
                case "fence": return pop(TX.farm.fence, 0, "#d8d0c0");
                case "hive": return useHive(r.ref);
                case "plot": return usePlot(r.ref);
                case "dump": return useDump();
                case "clay": return useClay();
                case "quarry": return useQuarry(r.ref);
                case "pool": return usePool(r.ref);
                case "drift": return useDrift(map, r.ref);
                case "tree": return useTree(r.ref);
                case "marta": return useMarta(interp);
                case "field": return useField(r.ref);
                default: return;
            }
        } catch (e) { console.error("[Zasoby] use " + r.kind, e); }
    }
    const crouch = fn => { if (!($gamePlayer.startToolSwing && $gamePlayer.startToolSwing(KIND.crouch, fn))) fn(); };

    // ---- A1 a spring
    function useSpring(sp) {
        if (!OK.isFound(sp.key)) OK.discover(sp.key);
        const left = springLeft(sp.key);
        if (left < 1) { need(ICON.water, snowOn(day()) ? TX.spring.ice : TX.spring.dry); return; }
        menu(Watki.wstaw(TK.kod.useSpring[0], { name: sp.name, left: left }), waterEntries(() => springLeft(sp.key), () => springUse(sp.key), TX.spring.helpPortion, TX.spring.dry), TX.spring.left(left));
    }

    // ---- A5 a herb (Jagna's glade: not the hero's till she lets him; wild ones by the springs: anyone's)
    function jagnaHere() {
        const tl = TL(), ev = tl && tl.eventOf ? tl.eventOf("jagna") : null;
        return !!ev && mapId() === D.GLADE.map && !(ev._town && ev._town.hidden);
    }
    function useHerb(map, id, ref) {
        const H = D.HERBS[ref.kind], st = herbState(map, id, ref.kind);
        if (st === "season") { need(iconOf(H.item), TX.herb.season); return; }
        if (st === "picked") { need(iconOf(H.item), TX.herb.picked); return; }
        const j = S().jagna;
        if (ref.glade && !j.permit) {
            if (jagnaHere()) {
                need(iconOf(H.item), TX.herb.notYours);
                if (j.scold !== day()) { j.scold = day(); j.trust -= 1; }
                const tl = TL();
                if (tl && tl.say) tl.say("jagna", TX.herb.notYours);
                return;
            }
        }
        crouch(() => {
            gain(H.item, 1);
            S().herbs[herbKey(map, id)] = day();
            if (ref.glade && !j.permit) j.taken[H.item] = (j.taken[H.item] || 0) + 1;
            se("Item3", 70, 110);
            syncSoon();
        });
    }

    // ---- A4 a mushroom of a ring
    function useMushroom(map, id, ref) {
        const rs = ringState(ref.ring);
        if (!rs.born || rs.picked.includes(ref.i)) return;
        crouch(() => {
            rs.picked.push(ref.i);
            gain(ITEM.mushroom, 1);
            se("Item3", 60, 115);
            syncSoon();
        });
    }

    // ---- A2 the ruined hut, the garden, the well
    function useRuin() {
        if (!OK.isFound("zagroda")) OK.discover("zagroda");
        if (S().ruin) { pop(TX.farm.searched, 0, "#d8d0c0"); return; }
        menu(TX.farm.ruinMenu, [{ name: TX.farm.search, icon: 189, help: TX.farm.searchHelp, enabled: true, run: () => { searchRuin(); return true; } }]);
    }
    function searchRuin() {
        crouch(() => {
            if (S().ruin) return;
            S().ruin = day();
            for (const [id, n] of D.FARMSTEAD.ruin.gives) gain(id, n);
            se("Chest1", 70, 90);
            runList(plain([], TX.farm.letterTitle, TX.farm.letter));
            note(TX.farm.letterTitle, Watki.wstaw(TK.kod.searchRuin[0], { "1": day() }));
            T.call("TownQuests", "autoChecks");
        });
    }
    function useGarden() {
        if (!OK.isFound("zagroda")) OK.discover("zagroda");
        if (day() - S().garden < D.FARMSTEAD.garden.regrow && !S().work.garden) { pop(TX.farm.gardenDone, iconOf(ITEM.hoe), "#d8d0c0"); return; }
        menu(TX.farm.gardenMenu, [{ name: TX.farm.weed + workText("garden", D.FARMSTEAD.garden.hits), icon: iconOf(ITEM.hoe), right: "-3", help: TX.farm.weedHelp, enabled: true,
            run: () => strike(specFor("garden")) }]);
    }
    SPECS.garden = () => ({ key: "garden", cells: D.FARMSTEAD.garden.cells, tools: [ITEM.hoe], kind: KIND.hoe, cost: 3, need: D.FARMSTEAD.garden.hits,
        se: "Earth2", fx: "dirt", missing: TX.farm.needHoe, can: () => day() - S().garden >= D.FARMSTEAD.garden.regrow,
        done: () => {
            const G = D.FARMSTEAD.garden;
            S().garden = day();
            const got = [];
            for (let n = rnd(G.n[0], G.n[1]); n > 0; n--) { const v = G.veg[Math.floor(Math.random() * G.veg.length)]; gain(v, 1); got.push(v); }
            if (Math.random() < G.seedChance) gain(G.seeds[Math.floor(Math.random() * G.seeds.length)], rnd(1, 2));
            good(TX.farm.gardenDone, iconOf(ITEM.hoe));
        } });

    function useWell() {
        if (!OK.isFound("zagroda")) OK.discover("zagroda");
        const w = S().well, W = D.FARMSTEAD.well;
        if (w.stage === 0) {
            menu(TX.well.names[0], [{ name: TX.well.clear + workText("well:clear", W.clearHits), icon: iconOf(ITEM.shovel), right: "-3", help: TX.well.clearHelp, enabled: true,
                run: () => strike(specFor("well:clear")) }]);
            return;
        }
        if (w.stage === 1) {
            const going = !!S().work["well:fix"];
            const cost = W.cost.map(([id, n]) => Watki.wstaw(TK.kod.useWell[0], { "1": nameOf(id), n: n, "3": count(id) })).join(", ");
            menu(TX.well.names[1], [{ name: TX.well.fix + workText("well:fix", W.fixHits), icon: iconOf(ITEM.hammer), right: "-2", help: TX.well.fixHelp + "\n" + (going ? TK.kod.useWell[1] : Watki.wstaw(TK.kod.useWell[2], { cost: cost })), enabled: true,
                run: () => {
                    if (!going) {
                        if (!count(ITEM.hammer)) { need(iconOf(ITEM.hammer), TX.well.needHammer); return false; }
                        const miss = W.cost.filter(([id, n]) => count(id) < n);
                        if (miss.length) { for (const [id, n] of miss.slice(0, 2)) need(iconOf(id), TX.needs.missing(nameOf(id), count(id), n)); return false; }
                        for (const [id, n] of W.cost) lose(id, n);
                        S().work["well:fix"] = { done: 0, need: W.fixHits };
                    }
                    return strike(specFor("well:fix"));
                } }]);
            return;
        }
        if (wellFrozen()) { need(ICON.water, TX.well.ice); return; }
        const n = wellUnits();
        if (n < 1) { need(ICON.water, TX.well.empty); return; }
        menu(TX.well.names[2] + " (" + n + "/" + W.max + ")", waterEntries(() => (wellFrozen() ? 0 : wellUnits()), () => { const x = wellSync(); x.water = Math.max(0, x.water - 1); },
            "\n" + TX.well.note(n), TX.well.empty), TX.well.note(n));
    }
    SPECS.well = key => {
        const W = D.FARMSTEAD.well, cells = [[W.x, W.y]];
        if (key === "well:clear") return { key, cells, tools: [ITEM.shovel], kind: KIND.shovel, cost: 3, need: W.clearHits, se: "Earth1", fx: "dirt", missing: TX.well.needShovel,
            can: () => S().well.stage === 0,
            done: () => {
                S().well.stage = 1;
                gain(ITEM.zlom, 1);
                T.popup(TX.well.cleared[0], { top: true, color: "#cfe6a8", sub: TX.well.cleared[1] });
                T.call("TownQuests", "autoChecks");
            } };
        return { key, cells, tools: [ITEM.hammer], kind: KIND.hammer, cost: 2, need: W.fixHits, se: "Hammer", fx: "rock", missing: TX.well.needHammer,
            can: () => S().well.stage === 1 && !!S().work["well:fix"],
            done: () => {
                const w = S().well;
                w.stage = 2; w.water = 0; w.wt = -1;
                wellSync();
                T.popup(TX.well.fixed[0], { top: true, color: "#9ff0a8", sub: TX.well.fixed[1] });
                note(TK.kod.done[0], Watki.wstaw(TK.kod.done[1], { "1": day() }));
                T.call("TownQuests", "autoChecks");
            } };
    };

    // ---- A3 a wild hive
    function smokeNear() {
        const tor = T.api("Torch");
        if (tor && ((tor.held && tor.held()) || (tor.isLit && tor.isLit() && tor.planted && (() => { const p = tor.planted(); return p && p.map === mapId() && Math.hypot(p.x - $gamePlayer.x, p.y - $gamePlayer.y) <= D.HIVE_RULE.smokeRange; })()))) return true;
        const f = F(), list = f && f.farm ? (f.farm().buildings || {})[mapId()] || [] : [];
        return list.some(b => ["campfire", "tripod", "cauldron"].includes(b.type) && !b.site && (!f.fireLit || f.fireLit(b))
            && Math.hypot(b.x - $gamePlayer.x, b.y - $gamePlayer.y) <= D.HIVE_RULE.smokeRange + 1);
    }
    function useHive(h) {
        if (!OK.isFound("dzikie_ule")) OK.discover("dzikie_ule");
        if (season() === 3) { pop(TX.hive.sleep, ICON.honey, "#d8d0c0"); return; }
        if (!hiveReady(h)) { pop(TX.hive.empty, ICON.honey, "#d8d0c0"); return; }
        menu(TX.hive.menu, [{ name: TX.hive.take, icon: ICON.honey, help: TX.hive.takeHelp, enabled: true, run: () => takeHive(h) }]);
    }
    function takeHive(h) {
        const knife = toolOf([ITEM.knifeIron, ITEM.knifeStone]);
        if (!knife) { need(iconOf(ITEM.knifeStone), TX.hive.needKnife); return false; }
        const smoke = smokeNear();
        crouch(() => {
            if (!hiveReady(h)) return;
            T.call("Durability", "use", knife);
            S().hives[h.key] = day();
            const s = season();
            if (!smoke) {
                gain(ITEM.honey, 1);
                if (Math.random() < D.HIVE_RULE.sting) {
                    if (typeof $gameSystem.changeStamina === "function") $gameSystem.changeStamina(-D.HIVE_RULE.stingStamina);
                    if (typeof $gameSystem.addBuff === "function") $gameSystem.addBuff("uzadlenie", D.HIVE_RULE.stingHours);
                    need(ICON.honey, TX.hive.stung);
                    se("Damage2", 80, 130);
                    if ($gameScreen) $gameScreen.startShake(2, 6, 12);
                }
            } else {
                if (s === 0) { gain(ITEM.honey, 1); pop(TX.hive.spring, ICON.honey); }
                else { gain(ITEM.honey, rnd(1, 2)); gain(ITEM.wosk, 1); pop(TX.hive.calm, ICON.honey); }
            }
            se("Item3", 70, 100);
            syncSoon();
        });
        return true;
    }

    // ---- A6 the gardens of Podgrodzie, the heap, the clay pit
    function witness(range) {
        const tl = TL();
        if (!tl || !tl.residents) return false;
        return tl.residents().some(ev => ev._mapId === mapId() && !(ev._town && ev._town.hidden) && Math.hypot(ev.x - $gamePlayer.x, ev.y - $gamePlayer.y) <= range);
    }
    function usePlot(g) {
        const h = hour(), R = D.GARDEN_RULE, entries = [];
        if (season() === 3) { pop(TX.garden.winter, iconOf(g.veg), "#d8d0c0"); return; }
        if (night(h)) {
            entries.push({ name: TX.garden.steal, icon: iconOf(g.veg), help: TX.garden.stealHelp, enabled: true, run: () => stealPlot(g) });
        } else {
            entries.push({ name: TX.garden.help + workText("plot:" + g.key, R.hits), icon: iconOf(ITEM.hoe), right: "-3", help: TX.garden.helpHelp, enabled: true,
                run: () => {
                    if (!inHours(hour(), R.hours)) { need(iconOf(ITEM.hoe), TX.garden.hours); return false; }
                    if (S().plotDay === day()) { need(iconOf(ITEM.hoe), TX.garden.doneToday); return false; }
                    return strike(specFor("plot:" + g.key));
                } });
        }
        menu(TX.garden.menu, entries);
    }
    SPECS.plot = key => {
        const g = D.GARDENS.find(x => "plot:" + x.key === key), R = D.GARDEN_RULE;
        if (!g) return null;
        return { key, cells: g.cells, tools: [ITEM.hoe], kind: KIND.hoe, cost: 3, need: R.hits, se: "Earth2", fx: "dirt", missing: TX.farm.needHoe,
            can: () => S().plotDay !== day() && inHours(hour(), R.hours) && season() !== 3,
            done: () => {
                S().plotDay = day();
                gain(g.veg, R.give);
                opinion(R.opinion, TK.kod.done[2]);
                if (isActive("K56") && !S().k56.includes(day())) S().k56.push(day());
                const tl = TL();
                if (tl && tl.say) tl.say(g.owner, TX.garden.thanks);
                good(TX.garden.thanks, iconOf(g.veg));
                T.call("TownQuests", "autoChecks");
            } };
    };
    function stealPlot(g) {
        const st = S().steal[g.key];
        if (st !== undefined && day() - st < D.GARDEN_RULE.stealGap) { need(iconOf(g.veg), TX.garden.stolenRecently); return false; }
        crouch(() => {
            S().steal[g.key] = day();
            gain(g.veg, D.GARDEN_RULE.steal);
            if (witness(D.GARDEN_RULE.seeRange)) { opinion(D.GARDEN_RULE.stealOpinion, TK.kod.stealPlot[0]); need(iconOf(g.veg), TX.garden.seen); }
            syncSoon();
        });
        return true;
    }
    function useDump() {
        if (!OK.isFound("wysypisko")) OK.discover("wysypisko");
        const dp = S().dump, d = day();
        if (dp.day !== d) { dp.day = d; dp.n = 0; }
        if (dp.hero === d) { need(ICON.stamina, TX.dump.done); return; }
        if (dp.n >= D.DUMP.perDay) { need(ICON.stamina, TX.dump.out); return; }
        menu(TX.dump.menu, [{ name: TX.dump.dig, icon: count(ITEM.shovel) ? iconOf(ITEM.shovel) : 0, help: TX.dump.digHelp, enabled: true, run: () => digDump() }]);
    }
    function dumpRoll() {
        if (isActive("D31")) {
            const s = tqState(), next = D.D31_THINGS.find(k => !(s && s.v && s.v[k] > 0));
            if (next && Math.random() < 0.4) { s.v[next] = 1; return { v: next }; }
        }
        const total = D.DUMP.loot.reduce((a, l) => a + l[1], 0);
        let r = Math.random() * total;
        for (const [id, w] of D.DUMP.loot) { r -= w; if (r <= 0) return { id }; }
        return { id: 0 };
    }
    function digDump() {
        const shovel = count(ITEM.shovel) > 0, dp = S().dump;
        const go = () => {
            if (dp.hero === day()) return;
            dp.hero = day();
            const draws = Math.min(D.DUMP.perDay - dp.n, 1 + (shovel ? D.DUMP.shovelBonus : 0));
            const found = [];
            for (let k = 0; k < draws; k++) {
                dp.n++;
                const r = dumpRoll();
                if (r.v) { found.push(r.v); T.popup(TX.dump.found + vitemName(r.v), { icon: 314, kind: "good" }); }
                else if (r.id) gain(r.id, 1);
                else found.push(0);
            }
            if (found.length === draws && found.every(x => x === 0)) pop(TX.dump.nothing, 0, "#d8d0c0");
            se("Earth3", 70, 110);
            T.call("TownQuests", "autoChecks");
            syncSoon();
        };
        if (shovel) { T.call("Durability", "use", ITEM.shovel); if (!($gamePlayer.startToolSwing && $gamePlayer.startToolSwing(KIND.shovel, go))) go(); }
        else crouch(go);
        return true;
    }
    const vitemName = k => (D.VITEMS[k] && D.VITEMS[k].name) || k;   // (D31's things: js/teksty/zasoby.txt, rzeczy)
    function useClay() {
        if (!OK.isFound("glinianka")) OK.discover("glinianka");
        const c = S().clay, d = day(), wet = rainedRecently(d);
        if (c.day !== d) { c.day = d; c.n = 0; }
        const entries = [{ name: TX.clay.dig, icon: iconOf(ITEM.clay), help: TX.clay.digHelp + (wet ? TX.clay.water : ""), enabled: true, run: () => digClay() }];
        if (wet) entries.push({ name: TX.clay.drink, icon: ICON.water, help: TX.clay.muddy, enabled: true, run: () => { need(ICON.water, TX.clay.muddy); return false; } });
        menu(TX.clay.menu, entries);
    }
    function digClay() {
        if (!count(ITEM.shovel)) { need(iconOf(ITEM.shovel), TX.clay.needShovel); return false; }
        const c = S().clay;
        if (c.day !== day()) { c.day = day(); c.n = 0; }
        if (c.n >= D.CLAYPIT.perDay) { need(iconOf(ITEM.clay), TX.clay.out); return false; }
        if (typeof $gameSystem.trySpendStamina === "function" && !$gameSystem.trySpendStamina(4)) { need(ICON.stamina, TX.needs.tired); return false; }
        const go = () => {
            T.call("Durability", "use", ITEM.shovel);
            const n = Math.min(D.CLAYPIT.perDig, D.CLAYPIT.perDay - c.n);
            c.n += n;
            gain(ITEM.clay, n);
            se("Earth5", 80, 95);
        };
        if (!($gamePlayer.startToolSwing && $gamePlayer.startToolSwing(KIND.shovel, go))) go();
        return true;
    }

    // ---- A7 the block wall
    function useQuarry(ref) {
        if (!OK.isFound(D.QUARRY.key)) OK.discover(D.QUARRY.key);
        if (quarryLeft() <= 0 && !S().work.quarry) { need(ICON.stamina, TX.quarry.out); return; }
        menu(TX.quarry.menu + " (" + quarryLeft() + "/" + D.QUARRY.perWeek + ")", [{ name: TX.quarry.cut + workText("quarry"), icon: iconOf(ITEM.blok) || iconOf(ITEM.pick), right: "-" + D.QUARRY.cost,
            help: TX.quarry.cutHelp, enabled: true, run: () => strike(specFor("quarry")) }]);
    }
    SPECS.quarry = () => ({ key: "quarry", cells: D.QUARRY.ids.map((_, i) => [D.QUARRY.at[i], [D.QUARRY.at[i][0] + 1, D.QUARRY.at[i][1]],
        [D.QUARRY.at[i][0], D.QUARRY.at[i][1] - 1], [D.QUARRY.at[i][0] + 1, D.QUARRY.at[i][1] - 1]]).reduce((a, l) => a.concat(l), []),
        tools: [ITEM.ironPick, ITEM.pick], kind: KIND.pick, cost: D.QUARRY.cost, need: tool => (tool === ITEM.ironPick ? D.QUARRY.ironHits : D.QUARRY.hits),
        se: "Hammer", fx: "rock", missing: TX.quarry.needPick, can: () => quarryLeft() > 0,
        done: () => {
            const q = S().quarry;
            if (!(q.from > 0) || day() - q.from >= D.QUARRY.week) { q.from = day(); q.n = 0; }
            q.n++;
            gain(ITEM.blok, 1);
            good(TX.quarry.got, iconOf(ITEM.blok));
            if ($gameScreen) $gameScreen.startShake(2, 8, 10);
            T.call("TownQuests", "autoChecks");
        } });
    // the veins: ChoppableTree mines them (self switch A); they grow back after VEIN_RULE.regrow days while the hero is away
    const VEIN_IDS = new Set(D.VEINS.map(v => v.id));
    T.on("chop", e => { if (e && e.mapId === 13 && VEIN_IDS.has(e.id) && has()) S().veins[e.id] = day(); }, { owner: PLUGIN });
    function regrowVeins() {
        if (!has()) return;
        for (const v of D.VEINS) {
            const d = S().veins[v.id];
            if (d && day() - d >= D.VEIN_RULE.regrow) { $gameSelfSwitches.setValue([13, v.id, "A"], false); delete S().veins[v.id]; }
        }
    }
    T.on("mapLeave", e => { if (e && e.to === 13 && e.mapId !== 13) regrowVeins(); }, { owner: PLUGIN });

    // ---- A8 the pools and the driftwood
    function usePool(p) {
        if (!OK.isFound("zatoczka")) OK.discover("zatoczka");
        const n = crabsLeft(p), entries = [];
        if (n > 0) entries.push({ name: TX.pool.catch, icon: ICON.krab, right: "×" + n, help: TX.pool.catchHelp, enabled: true, run: () => catchCrab(p) });
        entries.push({ name: TX.pool.drink, icon: ICON.water, help: TX.pool.salt, enabled: true, run: () => { need(ICON.water, TX.pool.salt); return false; } });
        if (!n) pop(TX.pool.none, ICON.krab, "#d8d0c0");
        menu(TX.pool.menu, entries);
    }
    function catchCrab(p) {
        if (crabsLeft(p) < 1) { need(ICON.krab, TX.pool.none); return false; }
        crouch(() => {
            const id = lowWaterId(), r = S().crabs[p.key] && S().crabs[p.key].id === id ? S().crabs[p.key] : (S().crabs[p.key] = { id, n: 0 });
            const perk = Number(T.call("Combat", "perk", "sneak")) || 0;
            const chance = D.CRAB_RULE.chance + (perk > 0 ? D.CRAB_RULE.sneakBonus : 0);
            if (Math.random() < chance) { r.n++; gain(ITEM.krab, 1); se("Item3", 70, 120); }
            else {
                need(ICON.krab, TX.pool.pinch);
                if (typeof $gameSystem.changeStamina === "function") $gameSystem.changeStamina(-D.CRAB_RULE.failStamina);
                se("Damage1", 60, 140);
                if (Math.random() < D.CRAB_RULE.flee) { r.n++; pop(TX.pool.fled, ICON.krab, "#d8d0c0"); }
            }
            syncSoon();
        });
        return true;
    }
    function useDrift(map, ref) {
        const have = driftOf(map), k = have.indexOf(ref.i);
        if (k < 0) return;
        if (map === 125 && !OK.isFound("zatoczka")) OK.discover("zatoczka");
        crouch(() => {
            const j = driftOf(map).indexOf(ref.i);
            if (j < 0) return;
            driftOf(map).splice(j, 1);
            gain(ITEM.drewnoDryfowe, 1);
            se("Item1", 70, 95);
            syncSoon();
        });
    }
    T.on("stormEnd", () => { if (has()) { addDrift(); syncSoon(); } }, { owner: PLUGIN });
    T.on("dayStart", () => { if (has() && S().driftDay !== day()) { S().driftDay = day(); addDrift(); syncSoon(); } }, { owner: PLUGIN });

    // ---- A9 the orchard
    function useTree(ref) {
        if (!OK.isFound(D.ORCHARD.key)) OK.discover(D.ORCHARD.key);
        const t = tree(ref.i), v = treeView(ref.i), title = TX.orchard.menu + " " + (ref.i + 1) + "/8 (" + TX.orchard.stages[Math.min(4, t.st)] + ")";
        if (t.st === 0) {
            menu(title, [{ name: TX.orchard.prune + workText("tree:" + ref.i, D.ORCHARD.pruneHits), icon: iconOf(count(ITEM.shears) ? ITEM.shears : ITEM.axe), right: "-3",
                help: TX.orchard.pruneHelp, enabled: true, run: () => strike(specFor("tree:" + ref.i)) }]);
            return;
        }
        if (t.st === 1) {
            menu(title, [{ name: TX.orchard.dress, icon: iconOf(ITEM.masc), right: count(ITEM.masc) ? "×" + count(ITEM.masc) : "", help: TX.orchard.dressHelp, enabled: true,
                run: () => {
                    if (!count(ITEM.masc)) { need(iconOf(ITEM.masc), TX.orchard.needSalve); return false; }
                    crouch(() => { if (tree(ref.i).st !== 1) return; lose(ITEM.masc, 1); tree(ref.i).st = 2; se("Heal1", 60, 110); syncSoon(); T.call("TownQuests", "autoChecks"); });
                    return true;
                } }]);
            return;
        }
        if (t.st < 4) {
            menu(title, [{ name: TX.orchard.water + " (" + t.wd.length + "/3)", icon: iconOf(ITEM.can), help: TX.orchard.waterHelp, enabled: true, run: () => waterTree(ref.i) }]);
            return;
        }
        if (v === "fruit") {
            menu(title, [{ name: TX.orchard.pick, icon: iconOf(ITEM.wildApple), help: TX.orchard.fruit, enabled: true,
                run: () => { crouch(() => { if (treeView(ref.i) !== "fruit") return; tree(ref.i).fruit = day(); gain(ITEM.wildApple, rnd(D.ORCHARD.fruit[0], D.ORCHARD.fruit[1])); se("Item3", 70, 105); syncSoon(); }); return true; } }]);
            return;
        }
        pop(day() < t.leaf ? TX.orchard.alive : TX.orchard.noFruit, iconOf(ITEM.wildApple), "#d8d0c0");
    }
    function waterTree(i) {
        const t = tree(i), f = F();
        if (!count(ITEM.can)) { need(iconOf(ITEM.can), TX.orchard.needCan); return false; }
        const charges = f && f.canCharges ? f.canCharges() : 0;
        if (charges < 1) { need(iconOf(ITEM.can), TX.orchard.canEmpty); return false; }
        if (t.wd.includes(day())) { need(iconOf(ITEM.can), TX.orchard.wateredToday); return false; }
        crouch(() => {
            const tt = tree(i);
            if (tt.st < 2 || tt.st >= 4 || tt.wd.includes(day())) return;
            const ff = F(), fm = ff && ff.farm ? ff.farm() : null;
            if (fm) fm.can = { charges: Math.max(0, (ff.canCharges ? ff.canCharges() : 1) - 1) };
            tt.wd.push(day());
            tt.st = 3;
            se("Water1", 70, 105);
            if (tt.wd.length >= 3) { tt.st = 4; tt.leaf = day() + D.ORCHARD.leafDays; good(TX.orchard.alive, iconOf(ITEM.wildApple)); T.call("TownQuests", "autoChecks"); }
            syncSoon();
        });
        return true;
    }
    SPECS.tree = key => {
        const i = Number(String(key).split(":")[1]), xy = D.ORCHARD.trees[i];
        if (!xy) return null;
        return { key, cells: [xy], tools: [ITEM.shears, ITEM.ironAxe, ITEM.axe], kind: tool => (tool === ITEM.shears ? KIND.crouch : KIND.axe), cost: 3, need: D.ORCHARD.pruneHits,
            se: "Slash1", fx: "char", missing: TX.orchard.needCut, can: () => tree(i).st === 0,
            done: () => { tree(i).st = 1; gain(ITEM.charcoal, 1); T.call("TownQuests", "autoChecks"); } };
    };
    function useMarta(interp) {
        const lines = [TK.kod.useMarta[0], TK.kod.useMarta[1]];
        const ev = evOf(interp.eventId()), out = linesTo([], { id: interp.eventId(), name: TK.kod.useMarta[2] }, [lines[day() % 2]]);
        if (ev) w.uruchom(interp, out);
    }

    // ---- A10 the fields
    function fieldWork() {
        const d = day(), s = season(d), dos = T.time.dayOfSeason(d), R = D.FIELD_RULE;
        if (s === 0 && dos >= R.sow[0] && dos <= R.sow[1]) return "sow";
        if (s === 2 && dos >= R.reap[0] && dos <= R.reap[1]) return "reap";
        return null;
    }
    function useField(f) {
        const what = fieldWork(), R = D.FIELD_RULE, entries = [], stage = fieldStage(f);
        if (what) entries.push({ name: (what === "sow" ? TX.field.sow : TX.field.reap) + workText("field:" + f.key, R.hits), icon: iconOf(what === "sow" ? ITEM.hoe : f.item), right: "-" + R.cost,
            help: TX.field.workHelp, enabled: true,
            run: () => {
                if (!inHours(hour(), R.hours)) { need(ICON.stamina, TX.field.hours); return false; }
                if (S().fieldDay === day()) { need(ICON.stamina, TX.field.doneToday); return false; }
                return strike(specFor("field:" + f.key));
            } });
        if (stage === 3 && S().fieldSteal !== day()) entries.push({ name: TX.field.steal, icon: iconOf(f.item), help: TX.field.stealHelp, enabled: true,
            run: () => { crouch(() => { if (S().fieldSteal === day()) return; S().fieldSteal = day(); gain(f.item, 2); opinion(R.theft, TK.kod.run[0]); need(iconOf(f.item), TX.field.stolen); }); return true; } });
        if (!entries.length) { pop(TX.field.notNow, iconOf(f.item), "#d8d0c0"); return; }
        menu(TX.field.menu, entries);
    }
    SPECS.field = key => {
        const f = D.FIELDS.find(x => "field:" + x.key === key), R = D.FIELD_RULE;
        if (!f) return null;
        const cells = FIELD_CELLS.filter(c => c.f === f).map(c => [c.x, c.y]);
        return { key, cells, tools: [], kind: () => (fieldWork() === "sow" ? KIND.hoe : KIND.crouch), cost: R.cost, need: R.hits, se: "Earth2", fx: "dirt",
            can: () => !!fieldWork() && S().fieldDay !== day() && inHours(hour(), R.hours),
            done: () => {
                S().fieldDay = day();
                $gameParty.gainGold(R.gold);
                gain(f.item, R.give);
                opinion(R.opinion, TK.kod.done[3]);
                T.popup(TX.field.paid + ": +" + R.gold + " G", { icon: ICON.coin, kind: "gold" });
            } };
    };

    // ------------------------------------------------------------------
    // The discoveries, the places (the collision test), the first find of a spring, the hives found by walking near
    // ------------------------------------------------------------------
    // (their names and texts are js/teksty/zasoby.txt's - registered again once the words are in, still before any game; the first
    // registration at load keeps the package's places and discoveries where they always stood among the other packages')
    function registerPlaces() {
        OK.registerSpots("A", D.SPOTS);
        for (const d of D.DISCOVERIES) {
            const icon = /^zrodlo_/.test(d.key) ? ICON.water : d.key === "dzikie_ule" ? ICON.honey : /^grzyby_/.test(d.key) ? ICON.mushroom : d.key === "ziola_jagny" ? ICON.herb : d.key === "glinianka" ? ICON.clay : ICON.wosk;
            OK.discoverable(Object.assign({ pkg: "A", xp: 25, icon }, d));
        }
    }
    registerPlaces();
    Watki.poTekstach(registerPlaces);
    T.on("okoliceDiscover", e => {
        if (!e || e.pkg !== "A") return;
        if (/^zrodlo_/.test(e.key)) think(TX.spring.found);
    }, { owner: PLUGIN });
    T.onMapUpdate(() => {
        if (!has() || mapId() !== 3 || OK.isFound("dzikie_ule")) return;
        if (D.HIVES.some(h => Math.max(Math.abs(h.x - $gamePlayer.x), Math.abs(h.y - $gamePlayer.y)) <= 2)) OK.discover("dzikie_ule");
    }, { owner: PLUGIN, name: "hives", every: 30, calm: true });

    // ---- the night in a fairy ring: fog, a whisper, the discovery (once a night a ring)
    let fog = null;
    function fogBitmap() {
        const b = new Bitmap(192, 192), ctx = b.context;
        if (ctx) {
            const g = ctx.createRadialGradient(96, 96, 4, 96, 96, 94);
            g.addColorStop(0, "rgba(232,238,242,0.85)");
            g.addColorStop(0.55, "rgba(222,230,236,0.45)");
            g.addColorStop(1, "rgba(222,230,236,0)");
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 192, 192);
            if (b._baseTexture && b._baseTexture.update) b._baseTexture.update();
        }
        return b;
    }
    function startFog(cx, cy) {
        const sc = SceneManager._scene, sp = sc && sc._spriteset;
        if (!sp || !sp._tilemap) return;
        if (fog) for (const s of fog.list) if (s.parent) s.parent.removeChild(s);
        const bmp = fogBitmap(), list = [];
        for (let k = 0; k < 6; k++) {
            const s = new Sprite(bmp);
            s.anchor.set(0.5, 0.5);
            s.z = 7;
            s._fx = { dx: (k % 3 - 1) * 1.4 + (Math.random() - 0.5), dy: (Math.floor(k / 3) - 0.5) * 1.2 + (Math.random() - 0.5) * 0.6, ph: Math.random() * 6.28, sc: 1.2 + Math.random() * 0.8 };
            s.opacity = 0;
            sp._tilemap.addChild(s);
            list.push(s);
        }
        fog = { list, cx, cy, t: 0, life: 420, sp };
    }
    T.onMapUpdate(() => {
        if (!fog) return;
        const sc = SceneManager._scene;
        if (!sc || sc._spriteset !== fog.sp || fog.list.some(s => !s.transform)) { fog = null; return; }   // (a new scene: the old sprites are gone)
        fog.t++;
        const f = fog, k = f.t < 60 ? f.t / 60 : f.t > f.life - 90 ? Math.max(0, (f.life - f.t) / 90) : 1;
        for (const s of f.list) {
            const x = $gameMap.adjustX(f.cx + 0.5 + s._fx.dx + Math.sin(f.t / 90 + s._fx.ph) * 0.3) * $gameMap.tileWidth();
            const y = $gameMap.adjustY(f.cy + 0.5 + s._fx.dy) * $gameMap.tileHeight();
            s.x = x; s.y = y; s.scale.set(s._fx.sc, s._fx.sc * 0.55);
            s.opacity = Math.round(150 * k);
        }
        if (f.t >= f.life) { for (const s of f.list) if (s.parent) s.parent.removeChild(s); fog = null; }
    }, { owner: PLUGIN, name: "fog" });
    T.on("mapLeave", () => { fog = null; }, { owner: PLUGIN });
    T.onMapUpdate(() => {
        if (!has() || mapId() !== 17 || !night(hour())) return;
        const nk = hour() >= 21 ? day() : day() - 1;   // (the night that began that evening)
        for (const r of D.RINGS) {
            if ($gamePlayer.x !== r.centre[0] || $gamePlayer.y !== r.centre[1] || S().fairy[r.key] === nk) continue;
            if (!ringBorn()) continue;
            S().fairy[r.key] = nk;
            startFog(r.centre[0], r.centre[1]);
            se("Darkness3", 45, 70);
            setTimeout(() => se("Wind2", 40, 60), 900);
            think([TX.ring.fog, TX.ring.whisper]);
            if (!OK.isFound(r.key)) OK.discover(r.key);
        }
    }, { owner: PLUGIN, name: "fairyRing", every: 10 });

    // ---- the dog sniffs towards a spring it does not know yet (once a day, while it follows); frogs at dusk by the forest spring
    T.onMapUpdate(() => {
        if (!has() || S().dog === day()) return;
        const sp = springOf(mapId());
        if (!sp || OK.isFound(sp.key)) return;
        const Dg = T.api("Dog"), st = Dg && Dg.state ? Dg.state() : null, dog = Dg ? Dg.dog : null;
        if (!st || !st.tame || !dog || st.mode !== "follow" || (st.map !== undefined && st.map !== mapId())) return;
        if (Math.hypot(sp.sx - $gamePlayer.x, sp.sy - $gamePlayer.y) > 12) return;
        S().dog = day();
        const sb = SB();
        if (sb && sb.say) sb.say(dog, TX.spring.dog, 160); else pop(TX.spring.dog);
        if (dog.setDirection) dog.setDirection(Math.abs(sp.sx - dog.x) > Math.abs(sp.sy - dog.y) ? (sp.sx > dog.x ? 6 : 4) : (sp.sy > dog.y ? 2 : 8));
    }, { owner: PLUGIN, name: "dog", every: 120, calm: true });
    T.onMapUpdate(() => {
        const sp = springOf(mapId());
        if (!has() || !sp || !sp.frogs || !inHours(hour(), [18, 21]) || Math.random() > 0.35) return;
        const dist = Math.hypot(sp.sx - $gamePlayer.x, sp.sy - $gamePlayer.y);
        if (dist > 16) return;
        AudioManager.playSe({ name: "Frog", volume: Math.round(25 + 45 * (1 - dist / 16)), pitch: 85 + Math.floor(Math.random() * 30), pan: Math.max(-100, Math.min(100, (sp.sx - $gamePlayer.x) * 8)) });
        if (S().frogs !== day() && dist < 12) { S().frogs = day(); think(TX.spring.frogs); }
    }, { owner: PLUGIN, name: "frogs", every: 240, calm: true });

    // ------------------------------------------------------------------
    // Babka Jagna: her conditions in TownLife, her talk (first: the meeting, the herbs taken from her glade, the ring), Marta in the
    // orchard (TownLife keeps her away from Podgrodzie for those hours)
    // ------------------------------------------------------------------
    (function townLife() {
        const tl = TL();
        if (!tl) return;
        if (tl.addCondition) {
            tl.addCondition("zasRosa", () => !has() || !rainOn(day()));
            tl.addCondition("zasPoDeszczu", () => has() && rainedRecently(day()));
        }
        const praczka = (tl.RESIDENTS || []).find(r => r.key === "praczka");
        if (praczka && !praczka._zasoby) {
            const was = praczka.when;
            praczka.when = () => !martaInOrchard() && (was === undefined || was === null || (tl.condOk ? tl.condOk(was) : true));
            praczka._zasoby = true;
        }
        // (2026-10-23, docs/ROZMOWY.md) the core's talk service: an "owner" takeover of Jagna's talk (after Lowy's, as the old hooks)
        T.talk.takeover({ owner: PLUGIN, who: "jagna", priority: T.talk.PRIORITY.owner + 30, run: ctx => {
            const key = ctx.who, ev = ctx.ev;
            if (key !== "jagna" || !has()) return null;
            const j = S().jagna, spk = { id: ev.eventId(), name: D.JAGNA.name };
            if (!j.met) { j.met = day(); return linesTo([], spk, TX.herb.first); }
            const taken = Object.keys(j.taken).filter(k => j.taken[k] > 0);
            if (taken.length && !j.permit) {
                j.trust -= 2;
                for (const k of taken) lose(Number(k), Math.min(count(Number(k)), j.taken[k]));
                j.taken = {};
                return linesTo([], spk, TX.herb.noticed);
            }
            if (!j.ring && D.RINGS.some(r => OK.isFound(r.key))) { j.ring = day(); return linesTo([], spk, TX.herb.ring); }
            // (2026-10-22, integration) the cliff herbs of package D: she buys them, once a day, when she trusts the hero
            const buys = (D.JAGNA_BUYS || []).filter(b => item(b.id) && item(b.id).name && count(b.id) > 0);
            if (buys.length && j.trust >= 0 && j.buyDay !== day()) {
                j.buyDay = day();
                const out = linesTo([], spk, D.JAGNA_BUY_TX.ask);
                const labels = buys.map(b => item(b.id).name + " ×" + count(b.id) + " - " + b.price * count(b.id) + " G").concat([D.JAGNA_BUY_TX.no]);
                return Watki.mowa.choiceTo(out, labels, labels.map((l, i) => (i < buys.length ? [C(355, ["Zasoby.jagnaSell(" + buys[i].id + ")"])] : [])), labels.length - 1);
            }
            return null;
        } });
    })();
    // she buys every piece of one cliff herb the hero has (the price of PLAN 7.5's note: szarotka 20 G, warzucha 6 G)
    function jagnaSell(id) {
        const b = (D.JAGNA_BUYS || []).find(x => x.id === id), n = count(id);
        if (!b || n <= 0 || !has()) return 0;
        $gameParty.loseItem(item(id), n, false);
        $gameParty.gainGold(b.price * n);
        T.popup("+" + b.price * n + " G", { icon: 314, kind: "gold" });
        T.audio.se("Coin", { volume: 70 });
        const tl = TL();
        if (tl && tl.say) tl.say("jagna", D.JAGNA_BUY_TX.thanks[0]);
        return b.price * n;
    }

    // ------------------------------------------------------------------
    // The quests (the thread's - Zasoby_Data.js, the engine Watki.js): what their conditions ask of the game; the recipes D30
    // teaches, the deep sleep, the food, the buffs
    // ------------------------------------------------------------------
    w.haki({
        zagrodaZnaleziona: () => OK.isFound("zagroda"),                       // K57: the neighbour's farm found
        masz: (ctx, id, n) => count(id) >= n,                                 // K57: the materials for the well in the bag
        ileMasz: (ctx, id, max) => Math.min(max, count(id)),
        sadOdratowany: () => has() && treesAlive() >= 8,                      // K58: the eight trees of the Ługs' orchard alive
        zyweDrzewa: () => (has() ? treesAlive() : 0),
        rzeczyD31: () => D.D31_THINGS.filter(k => w.vcount(k) > 0).length   // D31: the things found in the heap
    });
    T.on("townQuestAccepted", e => { if (e && e.id === "K56" && has()) S().k56 = []; }, { owner: PLUGIN });
    T.on("townQuestDone", e => {
        if (!e || !has()) return;
        if (e.id === "D30") { S().jagna.permit = true; S().jagna.trust = Math.max(S().jagna.trust, 1); syncRecipes(); think(TX.herb.permit); }
    }, { owner: PLUGIN });

    // the recipes: always - roasting a crab (campfire), splitting driftwood (workbench), melting scrap (forge); after D30 - the
    // grafting salve (by hand) and the valerian brew (cauldron, one portion of the bucket's water). Their words (name, doing, desc):
    // js/teksty/zasoby.txt, receptury.* - merged into these very objects (the ones in Farming's lists)
    const RECIPES = {
        crab: { id: "zas_roast_crab", inputs: [[ITEM.krab, 1]], output: [ITEM.krabPieczony, 1], hours: 0.5, stamina: 1, startSe: "Fire2" },
        drift: { id: "zas_split_drift", inputs: [[ITEM.drewnoDryfowe, 1]], output: [ITEM.wood, 2], manual: true, hours: 0.25, stamina: 2, startSe: "Hammer" },
        scrap: { id: "zas_scrap_iron", inputs: [[ITEM.zlom, 3], [ITEM.charcoal, 1]], output: [86, 1], hours: 6, stamina: 3 },
        salve: { id: "zas_masc", inputs: [[ITEM.clay, 1], [ITEM.wosk, 1]], output: [ITEM.masc, 1], manual: true, swing: "crouch", hours: 0.25, stamina: 1, startSe: "Item1" },
        brew: { id: "zas_napar", inputs: [[ITEM.kozlek, 1]], water: 1, output: [ITEM.napar, 1], hours: 1, stamina: 1, startSe: "Liquid" }
    };
    Watki.scal(RECIPES, "zasoby", "receptury");   // (its words: js/teksty/zasoby.txt, receptury)
    function addRecipe(list, r) { if (list && !list.some(x => x.id === r.id)) list.push(r); }
    function dropRecipe(list, r) { if (!list) return; const i = list.findIndex(x => x.id === r.id); if (i >= 0) list.splice(i, 1); }
    (function staticRecipes() {
        const f = F(), B = f && f.BUILDINGS;
        if (!B) return;
        if (B.campfire) addRecipe(B.campfire.recipes, RECIPES.crab);
        if (B.workbench) addRecipe(B.workbench.recipes, RECIPES.drift);
        if (B.forge) addRecipe(B.forge.recipes, RECIPES.scrap);
    })();
    function syncRecipes() {
        const f = F(), B = f && f.BUILDINGS, on = has() && (S().jagna.permit || isDone("D30"));
        if (!f) return;
        if (on) { addRecipe(f.HAND_RECIPES, RECIPES.salve); if (B && B.cauldron) addRecipe(B.cauldron.recipes, RECIPES.brew); }
        else { dropRecipe(f.HAND_RECIPES, RECIPES.salve); if (B && B.cauldron) dropRecipe(B.cauldron.recipes, RECIPES.brew); }
    }
    T.on("newGame", syncRecipes, { owner: PLUGIN });
    T.on("load", syncRecipes, { owner: PLUGIN });
    T.on("mapReady", syncRecipes, { owner: PLUGIN });

    (function food() {
        const FT = window.FoodTable;
        if (FT && FT.ROWS) {
            const rows = { 186: { raw: true, spoil: 24, dog: 30 }, 187: { stamina: 18, fed: 20, water: 0, spoil: 48, dog: 35 },
                196: { stamina: 6, buff: "gleboki_sen", hours: 18, fed: 2, water: 12, spoil: 240 } };
            for (const k of Object.keys(rows)) {
                if (FT.ROWS[k]) continue;
                FT.ROWS[k] = rows[k];
                if (rows[k].spoil && FT.LIFE) FT.LIFE[k] = rows[k].spoil;
                if (rows[k].stamina !== undefined && FT.FEED) FT.FEED[k] = [rows[k].fed, rows[k].water];
            }
        }
    })();
    // the buffs (once the words are in - their names: js/teksty/zasoby.txt, premie; still before any game)
    Watki.poTekstach(function defineBuffs() {
        const Sv = T.api("Survival"), P = TK.premie;
        if (Sv && Sv.defineBuff) {
            Sv.defineBuff("uzadlenie", { name: P.uzadlenie.name, icon: ICON.honey, bad: true, cost: D.HIVE_RULE.stingCost || 1.15, desc: P.uzadlenie.desc });
            Sv.defineBuff("gleboki_sen", { name: P.gleboki_sen.name, icon: ICON.napar, desc: P.gleboki_sen.desc });
        }
    });
    // the deep sleep: the first night's sleep after the brew gives a fifth of the strength more (after the bed's own rest is set)
    let deepPending = false;
    T.on("wake", () => { if (has() && typeof $gameSystem.hasBuff === "function" && $gameSystem.hasBuff("gleboki_sen")) deepPending = true; }, { owner: PLUGIN });
    T.onMapUpdate(() => {
        if (!deepPending || $gameScreen.brightness() < 255) return;
        deepPending = false;
        if (typeof $gameSystem.changeStamina === "function" && typeof $gameSystem.maxStamina === "function") $gameSystem.changeStamina(Math.round($gameSystem.maxStamina() * 0.2));
        if ($gameSystem.buffs) delete $gameSystem.buffs().gleboki_sen;
        S().deep = day();
        good(TK.kod.glowna[0], ICON.napar);
    }, { owner: PLUGIN, name: "deepSleep", every: 10 });

    // ------------------------------------------------------------------
    // F9 (Debug.js, the tab "Wyspa i fabuła"): go to each thing, the weather, the tide, the storm's end, the well, the orchard, D30
    // ------------------------------------------------------------------
    // the places to go to: the springs, then the others (their names: js/teksty/zasoby.txt, f9.idz.<key>)
    const GO_TO = [["zagroda", 3, 42, 52, 8], ["studnia", 3, 47, 54, 8], ["ul", 3, 66, 39, 8], ["polanka", 17, 67, 16, 8],
        ["krag", 17, 54, 45, 8], ["ogrodki", 111, 66, 15, 8], ["wysypisko", 111, 72, 66, 8], ["glinianka", 111, 48, 74, 8],
        ["sciana", 13, 108, 82, 8], ["zyla", 13, 114, 79, 8], ["zatoczka", 125, 17, 67, 8], ["drewnoPustelnia", 155, 4, 53, 4],
        ["drewnoGarnizon", 162, 3, 47, 4], ["sad", 168, 62, 22, 2], ["pola", 8, 10, 108, 8]];
    const GO = () => [].concat(D.SPRINGS.map(s => [s.name, s.map, s.sx, s.sy + 1, 8]), GO_TO.map(([k, ...at]) => [TK.f9.idz[k]].concat(at)));
    const GO_N = D.SPRINGS.length + GO_TO.length;
    let goPick = 0, wellPick = 0, treePick = 0, d30Pick = 0;
    const onOff = v => (v ? TK.kod.onOff[0] : TK.kod.onOff[1]);
    OK.f9.add({ owner: PLUGIN, get title() { return TK.f9.tytul; },
        rows: () => [
            { owner: PLUGIN, label: Watki.wstaw(TK.kod.rows[0], { "1": GO()[goPick][0], "2": goPick + 1, length: GO_N }), icon: ICON.water, desc: TK.kod.rows[1], what: "go", pick: goPick },
            { owner: PLUGIN, label: Watki.wstaw(TK.kod.rows[2], { "1": onOff(dbg.rain) }), icon: 70, desc: TK.kod.rows[3], what: "rain" },
            { owner: PLUGIN, label: Watki.wstaw(TK.kod.rows[4], { "1": onOff(dbg.hot) }), icon: 70, desc: TK.kod.rows[5], what: "hot" },
            { owner: PLUGIN, label: Watki.wstaw(TK.kod.rows[6], { "1": onOff(dbg.snow) }), icon: 70, desc: TK.kod.rows[7], what: "snow" },
            { owner: PLUGIN, label: Watki.wstaw(TK.kod.rows[8], { "1": T.call("Wyspa", "tideForced") || TK.f9.naturalny }), icon: ICON.krab, desc: TK.kod.rows[9], what: "tide" },
            { owner: PLUGIN, label: TK.kod.rows[10], icon: ICON.drewno, desc: TK.kod.rows[11], what: "storm" },
            { owner: PLUGIN, label: Watki.wstaw(TK.kod.rows[12], { wellPick: wellPick }), icon: ICON.water, desc: TK.kod.rows[13], what: "well", pick: wellPick },
            { owner: PLUGIN, label: Watki.wstaw(TK.kod.rows[14], { treePick: treePick }), icon: iconOf(ITEM.wildApple), desc: TK.kod.rows[15], what: "tree", pick: treePick },
            { owner: PLUGIN, label: Watki.wstaw(TK.kod.rows[16], { "1": d30Pick + 1 }), icon: ICON.kozlek, desc: TK.kod.rows[17], what: "d30", pick: d30Pick },
            { owner: PLUGIN, label: TK.kod.rows[18], icon: ICON.water, desc: TK.kod.rows[19], what: "reset" }
        ],
        pick(row, delta) {
            if (row.what === "go") { goPick = row.pick = (goPick + delta + GO_N) % GO_N; row.label = Watki.wstaw(TK.kod.pick[0], { "1": GO()[goPick][0], "2": goPick + 1, length: GO_N }); }
            if (row.what === "well") { wellPick = row.pick = (wellPick + delta + 3) % 3; row.label = Watki.wstaw(TK.kod.pick[1], { wellPick: wellPick }); }
            if (row.what === "tree") { treePick = row.pick = (treePick + delta + 5) % 5; row.label = Watki.wstaw(TK.kod.pick[2], { treePick: treePick }); }
            if (row.what === "d30") { d30Pick = row.pick = (d30Pick + delta + 3) % 3; row.label = Watki.wstaw(TK.kod.pick[3], { "1": d30Pick + 1 }); }
        },
        ok(row) {
            switch (row.what) {
                case "go": return { go: GO()[goPick] };
                case "rain": dbg.rain = !dbg.rain; syncSoon(); return { say: Watki.wstaw(TK.kod.ok[0], { "1": onOff(dbg.rain) }) };
                case "hot": dbg.hot = !dbg.hot; syncSoon(); return { say: Watki.wstaw(TK.kod.ok[1], { "1": onOff(dbg.hot) }) };
                case "snow": dbg.snow = !dbg.snow; syncSoon(); return { say: Watki.wstaw(TK.kod.ok[2], { "1": onOff(dbg.snow) }) };
                case "tide": {
                    const W = T.api("Wyspa"), now = W && W.tideForced ? W.tideForced() : null, next = now === null ? "low" : now === "low" ? "high" : null;
                    if (W && W.forceTide) W.forceTide(next);
                    syncSoon();
                    return { say: Watki.wstaw(TK.kod.ok[3], { "1": next || TK.f9.naturalny }) };
                }
                case "storm": addDrift(); syncSoon(); return { say: TK.kod.ok[4] };
                case "well": { const w = S().well; w.stage = wellPick; delete S().work["well:clear"]; delete S().work["well:fix"]; if (wellPick === 2) { w.water = D.FARMSTEAD.well.max; w.wt = -1; wellSync(); w.water = D.FARMSTEAD.well.max; } syncSoon(); return { say: Watki.wstaw(TK.kod.ok[5], { wellPick: wellPick }) }; }
                case "tree": {
                    for (let i = 0; i < D.ORCHARD.trees.length; i++) {
                        const t = tree(i);
                        t.st = treePick; t.wd = treePick === 3 ? [day() - 1] : treePick >= 4 ? [day() - 3, day() - 2, day() - 1] : [];
                        t.leaf = treePick >= 4 ? day() - 200 : 0; t.fruit = 0;
                    }
                    syncSoon();
                    return { say: Watki.wstaw(TK.kod.ok[6], { treePick: treePick }) };
                }
                case "d30": {
                    const q = TQ();
                    if (!q || !q.start) return { say: TK.kod.ok[7], bad: true };
                    S().jagna.met = S().jagna.met || day();
                    q.start("D30", d30Pick);
                    gain([ITEM.arcydziegiel, ITEM.dziurawiec, ITEM.kozlek][d30Pick], 1);
                    return { say: Watki.wstaw(TK.kod.ok[8], { "1": d30Pick + 1 }) };
                }
                case "reset": {
                    const s = S();
                    s.springs = {}; s.dump = { day: 0, n: 0, hero: 0 }; s.clay = { day: 0, n: 0 }; s.quarry = { from: 0, n: 0 }; s.hives = {}; s.herbs = {};
                    s.plotDay = 0; s.fieldDay = 0; s.fieldSteal = 0; s.steal = {}; s.crabs = {};
                    syncSoon();
                    return { say: TK.kod.ok[9] };
                }
                default: return null;
            }
        } });

    // (2026-10-22, integration) the epilogue after the Heart: Underground.js asks Zasoby.epilogue(kind, w) - a line, a list or null
    function epilogue() {
        if (!has() || !D.EPILOG) return null;
        const n = (D.SPRINGS || []).filter(sp => OK && OK.isFound && OK.isFound(sp.key)).length;
        if (n >= 3) return D.EPILOG.springs;
        if (S().well && S().well.stage >= 2) return D.EPILOG.well;
        return null;
    }
    window.Zasoby = T.register(PLUGIN, { VERSION, PKG: "A", ready: true, epilogue, use, state: () => S(), dbg, sync: () => { syncAll(); return true; },
        springLeft, springMax, wellUnits, wellSync, ringBorn, ringState, herbState: (map, id, kind) => herbState(map, id, kind), treeView, treesAlive,
        quarryLeft, crabsLeft: key => { const p = D.POOLS.find(x => x.key === key); return p ? crabsLeft(Object.assign({ i: D.POOLS.indexOf(p) }, p)) : 0; },
        lowWaterId, addDrift, regrowVeins, martaInOrchard, fieldStage, gardenStage, fieldWork, smokeNear, syncRecipes, specFor, strike,
        REG, LOOK, FIELD_CELLS, IMG, RECIPES, jagnaSell });
})();
