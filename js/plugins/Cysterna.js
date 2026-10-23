//=============================================================================
// Cysterna.js
//=============================================================================
// PAKIET F (docs/miejsca_wyspy/PAKIETY.md) - the engine of "Stara cysterna zakonu" (Map167), concept approved by the user
// 2026-10-16 (docs/miejsca_wyspy/KONCEPCJA.md section 8). The data and texts: Cysterna_Data.js.
//   - the way in: on floor 30 (Map147, the file stays as it is) the three events "Zasuwa główna" get one more page here, on switch
//     18 "Wyspa_ZasuwaCysterny" - an open sluice that leads to Map167 (3,20). The switch is on once W1 rozdz. 7 is done (the flag
//     cisternOpen: the bell's four and two) and Map167 is the real map (Wyspa.ready(167))
//   - the reserve of water (0-100, 55 at the first visit; the state "cysterna"): day by day the town's well (1) and the Lord's
//     garden (1, 0.5 with the sluice half open, 0 with the manor branch shut) drink from it, each draw of the hero takes 1; a rainy
//     day (Survival.weatherPlan) gives back only through the rain gate: 1 + 0.5 a cleaned gutter on the Urwisko (K53: all four 3).
//     The basin shows it: its north wall stands out of the water by bands (CysternaData.LEVEL_TILES), the measuring post in the
//     water has its marks, the iron band at the third mark shows once the chain cannot reach
//   - the ladle of the Order (after D28): ONE draw a day - drink your fill, or fill ONE vessel (waterskin, bucket, clay pot, watering
//     can). Under the third mark (30) the bucket hangs over the water - no draw. The water of the tank anywhere else: not drunk.
//     Under 15 the town's well gives one draw a day less (Cysterna.wellLow() -> TownQuests.wellBonus -1, Farming_Plots.rationOf; since
//     the integration 2026-10-16 - no wrapper of Farming.rationWell any more) and the town grumbles (opinion, remarks)
//   - the gates: the rain gate (shut since the fall of the Order - K53), the manor branch (half open since W1 - shut it: the
//     Lord's garden dries, opinion +3, the Lord turns cold - ALWAYS, the coordinator's decision 2026-10-16: the flag lordCold; at the
//     Heart Underground.lordStance makes him a rival unless the hero told him his truth), the lever of the raven grate
//     (switch 17 "Wyspa_KrataUrwisko": the overflow channel (33,2) leads to the Urwisko 157 (41,16) once Wyspa.isReady(157))
//   - the drowned (Creatures.js "topielec") at the markers "Miejsce: topielec_N": two the first time, then now and then one
//   - D28 "Zapas zakonu", K53 "Rynny zakonu" (TownQuests packs from Cysterna_Data.js; FX here)
// Ids 680-689 (Tawerna.inject, owner "Cysterna"): 680-683 the choked gutters on the Urwisko (at package B's markers rynna_1..4).
// DROUGHT (the user's rule): the only new water of the game - late, limited, felt; nothing here goes round the one draw a day.

/*:
 * @target MZ
 * @plugindesc [pakiet F] Stara cysterna zakonu (mapa 167): zapas wody, czerpak raz dziennie, słup miary, zasuwy, krata na Urwisku, D28 i K53. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Wyspa
 *
 * @help
 * ============================================================================
 * Cysterna.js - stara cysterna zakonu pod wzgórzem tawerny
 * ============================================================================
 * Wejście: piętro 30 podziemi (Wielka cysterna), Zasuwa główna - otwarta po
 * W1 rozdz. 7 (przełącznik 18). Wyjście: kanał przelewu i krata z krukiem na
 * Urwisku (dźwignia od środka, przełącznik 17).
 *
 * Zapas wody 0-100 (na start 55): studnia na rynku i ogród dworu piją z niego
 * codziennie, deszcz dolewa przez zasuwę deszczową i rynny na Urwisku (K53).
 * Czerpak zakonu (po D28): jedno nabranie dziennie - napić się do syta albo
 * napełnić jedno naczynie. Łańcuch sięga do trzeciego znaku: poniżej 30 nic.
 * Poniżej 15 studnia na rynku daje mniej.
 *
 * W skryptach zdarzeń: Cysterna.ladle(this), Cysterna.post(this),
 * Cysterna.read("ksiega", this), Cysterna.grate(this), Cysterna.lever(this),
 * Cysterna.rainGate(this), Cysterna.branch(this).
 * Dla testów i F9: Cysterna.state(), Cysterna.level(), Cysterna.setLevel(n),
 * Cysterna.settle(), Cysterna.band().
 * ============================================================================
 */

(() => {
    "use strict";
    const TK = Watki.teksty("cysterna");   // (the words of this file: js/teksty/cysterna.txt, kod.*)

    const T = window.Tawerna, D = window.CysternaData;
    if (!T) throw new Error("Cysterna.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    if (!D) throw new Error("Cysterna.js: brak Cysterna_Data.js - musi być wyżej na liście wtyczek (the cistern's data is missing)");
    const PLUGIN = "Cysterna";
    const MAP = D.MAP, F30 = D.FLOOR30, URW = D.URWISKO, TOWN = D.TOWN, R = D.RESERVE, TX = D.TX;   // (TX: js/teksty/cysterna.txt; TX.kod - the words of this file)
    const fill = (text, vars) => String(text).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined ? vars[k] : m));
    const HERO = { id: 0, name: "" };
    const C = (code, parameters, indent) => ({ code, indent: indent || 0, parameters });
    const has = () => !!window.$gameSystem;
    const day = () => T.time.day();
    const item = id => (window.$dataItems && $dataItems[id]) || null;
    const count = id => (item(id) ? $gameParty.numItems(item(id)) : 0);
    const iconOf = id => (item(id) ? item(id).iconIndex : 0);
    const TQ = () => T.api("TownQuests") || window.TownQuests || null;
    const W = () => window.Wyspa || T.api("Wyspa") || null;
    const FM = () => T.api("Farming") || window.Farming || null;
    const qs = () => { const q = TQ(); return q && q.state ? q.state() : null; };
    const flags = () => { const s = qs(); return s && s.flags ? s.flags : {}; };
    const flag = k => !!flags()[k];
    const isDone = id => { const q = TQ(); return !!(q && q.isDone && q.isDone(id)); };
    const rec = id => { const q = TQ(); return q && q.rec ? q.rec(id) : null; };
    const clamp = v => Math.max(0, Math.min(R.max, v));
    const pop = (text, icon, color) => T.popup(text, { icon: icon || 0, color: color || "#cfe6ff" });
    const need = (icon, text) => T.popup.need(icon, text);
    function setFlag(k) {
        const w = W();
        if (w && w.setFlag) w.setFlag(k);
        else { const f = flags(); if (!f[k]) f[k] = day(); }
    }
    function autoChecks() {
        const q = TQ();
        if (q && q.autoChecks) q.autoChecks();
        if (q && q.refreshMarkers) q.refreshMarkers();
    }

    // ------------------------------------------------------------------
    // The state (the save)
    // ------------------------------------------------------------------
    const store = T.state.define("cysterna", () => ({ reserve: R.start, day: 0, been: 0, visits: 0, read: {}, rainGate: 0, gutters: {},
        branch: "", branchDay: 0, branchSeen: 0, lever: 0, drawDay: 0, draws: 0, low: 0, drownedDay: 0, unwedged: 0 }), { version: 1, owner: PLUGIN });
    const S = () => store();
    const level = () => (has() ? S().reserve : R.start);

    // ------------------------------------------------------------------
    // The map is built (package 0's stub has the note <Wyspa:szkielet>): Wyspa.ready(167) - read once, like the engine reads its data
    // ------------------------------------------------------------------
    let built = false;
    (function checkBuilt() {
        try {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", "data/Map" + String(MAP).padStart(3, "0") + ".json");
            xhr.overrideMimeType("application/json");
            xhr.onload = () => {
                try {
                    const note = xhr.status < 400 ? String(JSON.parse(xhr.responseText).note || "") : "<Wyspa:szkielet>";
                    if (!/<Wyspa:szkielet>/.test(note) && /<Cysterna:mapa>/.test(note)) {
                        built = true;
                        const w = W();
                        if (w && w.ready) w.ready(MAP);
                        syncSwitches();
                    }
                } catch (e) { /* (no map: not built) */ }
            };
            xhr.send();
        } catch (e) { /* (no XHR: not built) */ }
    })();

    // ------------------------------------------------------------------
    // The reserve, day by day (from the first visit on: till then it stays at the start)
    // ------------------------------------------------------------------
    const gutterCount = () => (has() ? Object.keys(S().gutters).filter(k => S().gutters[k]).length : 0);
    const manorDrain = () => (S().branch === "closed" ? 0 : flag("sluiceHalf") ? R.manorHalf : R.manor);
    const townDrain = () => (flag("cisternOpen") ? R.town : 0);
    const rainGain = () => (S().rainGate ? R.rainOpen + R.rainGutter * Math.min(D.GUTTER.n, gutterCount()) : 0);
    function rainyDay(d) {
        const sv = T.api("Survival");
        try { const p = sv && sv.weatherPlan ? sv.weatherPlan(d) : null; return !!p && p.type === "rain"; } catch (e) { return false; }
    }
    const dayChange = d => -townDrain() - manorDrain() + (rainyDay(d) ? rainGain() : 0);
    function settle() {
        if (!has()) return level();
        const s = S(), today = day();
        if (!s.been) return s.reserve;
        if (!s.day) s.day = today;
        if (s.day < today) {
            for (let d = s.day + 1; d <= today && d <= s.day + 400; d++) s.reserve = clamp(s.reserve + dayChange(d));
            s.reserve = Math.round(s.reserve * 100) / 100;
            s.day = today;
            lowCheck();
        }
        refreshLevel();
        return s.reserve;
    }
    // the town feels it: under 15 the well gives less, people grumble (once each time it falls there)
    function lowCheck() {
        const s = S();
        if (!s.been) return;
        if (s.reserve < R.low && !s.low) {
            s.low = day();
            setFlag("cysternaNisko");
            const got = T.call("TownQuests", "addOpinion", R.lowOpinion, TX.kod.opiniaNisko) || 0;
            T.popup(TX.lowNotice, { top: true, color: "#ff9f8f", sub: TX.lowSub + (got ? fill(TX.kod.opinia, { n: got }) : "") });
            autoChecks();
        } else if (s.reserve >= R.lowBack && s.low) s.low = 0;
    }
    const bandOf = lv => { for (let b = 0; b < D.BANDS.length; b++) if (lv >= D.BANDS[b]) return b; return D.BANDS.length - 1; };

    // ------------------------------------------------------------------
    // The basin's tiles by the band (LEVEL_TILES: [index, the file's tile, the band's tile] - a cell changed in the editor stays)
    // ------------------------------------------------------------------
    function applyTiles(arr, band, reverse) {
        const flat = D.LEVEL_TILES[band];
        if (!flat || !arr) return 0;
        let n = 0;
        for (let k = 0; k + 2 < flat.length; k += 3) {
            const i = flat[k], a = flat[k + 1], b = flat[k + 2];
            if (!reverse && arr[i] === a) { arr[i] = b; n++; } else if (reverse && arr[i] === b) { arr[i] = a; n++; }
        }
        return n;
    }
    function setBand(data, band) {
        const now = data._cysternaBand === undefined ? D.BASE_BAND : data._cysternaBand;
        if (now === band) return false;
        if (now !== D.BASE_BAND) applyTiles(data.data, now, true);
        if (band !== D.BASE_BAND) applyTiles(data.data, band, false);
        data._cysternaBand = band;
        return true;
    }
    const isCistern = data => !!data && /<Cysterna:mapa>/.test(String(data.note || ""));
    // on the map: the band follows the reserve at once (a draw, a day passing) - the tilemap drawn anew
    function refreshLevel() {
        if (!has() || !window.$gameMap || $gameMap.mapId() !== MAP || !isCistern(window.$dataMap)) return;
        if (setBand($dataMap, bandOf(level()))) {
            const sc = SceneManager._scene, tm = sc && sc._spriteset && sc._spriteset._tilemap;
            if (tm && tm.refresh) tm.refresh();
        }
    }

    // ------------------------------------------------------------------
    // The maps' data: floor 30's sluice opens (one more page, switch 18); the cistern's water at its band
    // ------------------------------------------------------------------
    function patchSluice(data) {
        for (const e of data.events || []) {
            if (!e || !/^Zasuwa główna/.test(e.name || "") || e.y !== 5 || e.x < 19 || e.x > 21 || !e.pages || !e.pages.length) continue;
            if (e.pages.some(p => p.conditions && p.conditions.switch1Valid && p.conditions.switch1Id === D.SW.zasuwa)) continue;
            const p0 = e.pages[0], pg = JSON.parse(JSON.stringify(p0));
            pg.conditions = Object.assign({}, p0.conditions, { switch1Valid: true, switch1Id: D.SW.zasuwa });
            pg.image = Object.assign({}, p0.image, { direction: 8, pattern: 0 });
            pg.trigger = 1;
            pg.priorityType = 1;
            pg.through = false;
            pg.list = [C(250, [{ name: "Gate1", volume: 80, pitch: 90, pan: 0 }]), C(201, [0, MAP, 3, 20, 6, 0]), C(0, [])];
            e.pages.push(pg);
        }
    }
    T.onMapData((data, mapId) => {
        if (mapId === F30) patchSluice(data);
        if (mapId === MAP && isCistern(data) && has()) { settle(); setBand(data, bandOf(level())); }
    }, { owner: PLUGIN });
    // the switches: 18 the sluice (W1 rozdz. 7 done and the map built), 17 the raven grate (the lever pulled)
    function syncSwitches() {
        if (!has() || !window.$gameSwitches) return;
        const open = built && flag("cisternOpen");
        if ($gameSwitches.value(D.SW.zasuwa) !== open) $gameSwitches.setValue(D.SW.zasuwa, open);
        if (S().lever && !$gameSwitches.value(D.SW.krata)) $gameSwitches.setValue(D.SW.krata, true);
    }

    // ------------------------------------------------------------------
    // Speech: the hero's thoughts (bubbles one after another), event commands for the talks
    // ------------------------------------------------------------------
    const thoughts = [];
    let thoughtAt = 0;
    function think(lines) { for (const l of [].concat(lines || [])) if (l) thoughts.push(String(l).replace(/^> /, "")); }
    function updateThoughts() {
        if (!thoughts.length || Graphics.frameCount < thoughtAt || !(SceneManager._scene instanceof Scene_Map) || $gameMessage.isBusy()) return;
        const SB = T.api("SpeechBubbles"), text = thoughts.shift();
        if (SB && SB.say) SB.say($gamePlayer, text, 200); else pop(text, 0, "#eceef0");
        thoughtAt = Graphics.frameCount + 210;
    }
    const LINE = 46, PAGE = 3;
    function wrap(text, width) {
        const out = [];
        for (const para of String(text).split("\n")) {
            let line = "";
            for (const w of para.split(/\s+/)) {
                if (!w) continue;
                if (line && (line + " " + w).length > (width || LINE)) { out.push(line); line = w; } else line = line ? line + " " + w : w;
            }
            if (line) out.push(line);
        }
        return out;
    }
    function sayTo(out, spk, text, ind) {
        const lines = wrap(text);
        for (let i = 0; i < lines.length; i += PAGE) {
            out.push(C(101, ["", 0, 0, 2, spk.name || ""], ind));
            lines.slice(i, i + PAGE).forEach((l, j) => out.push(C(401, [(j === 0 && spk.id !== null ? "\\SPK[" + spk.id + "]" : "") + l], ind)));
        }
        return out;
    }
    const linesTo = (out, spk, arr) => { for (const l of [].concat(arr || [])) if (l) sayTo(out, spk, String(l).replace(/^> /, "")); return out; };
    const act = (out, args) => (out.push(C(355, ["Cysterna.act(this, " + JSON.stringify(args) + ")"])), out);
    function choiceTo(out, labels, branches, cancel) {
        out.push(C(102, [labels, cancel === undefined ? labels.length - 1 : cancel, 0, 2, 0]));
        labels.forEach((l, i) => {
            out.push(C(402, [i, l]));
            for (const c of branches[i] || []) out.push(Object.assign({}, c, { indent: (c.indent || 0) + 1 }));
            out.push(C(0, [], 1));
        });
        out.push(C(404, []));
        return out;
    }
    // a plain message (the Order's notes, the post): a title line and the text wrapped, four lines a page
    function plain(out, title, lines) {
        const all = (title ? ["\\C[6]" + title + "\\C[0]"] : []).concat(...[].concat(lines).map(l => wrap(l, 52)));
        for (let i = 0; i < all.length; i += 4) {
            out.push(C(101, ["", 0, 0, 2, ""]));
            all.slice(i, i + 4).forEach(l => out.push(C(401, [l])));
        }
        return out;
    }
    function runList(interp, list) {
        if (interp && interp.setupChild) interp.setupChild(list.concat([C(0, [])]), interp.eventId());
        else if (window.$gameMap) $gameMap._interpreter.setup(list.concat([C(0, [])]), 0);
    }

    // ------------------------------------------------------------------
    // The events of the cistern (by their note tags - the editor may move them)
    // ------------------------------------------------------------------
    const evCache = { map: 0, events: null, tags: {} };
    const evByTag = tag => {
        if (!window.$gameMap || $gameMap.mapId() !== MAP) return null;
        if (evCache.map !== MAP || evCache.events !== $gameMap._events) { evCache.map = MAP; evCache.events = $gameMap._events; evCache.tags = {}; }
        if (!(tag in evCache.tags)) {
            const re = new RegExp("<Cysterna:" + tag + ">");
            evCache.tags[tag] = $gameMap.events().find(e => e && e.event() && re.test(e.event().note || "")) || null;
        }
        return evCache.tags[tag];
    };
    function selfSwitch(ev, on) {
        if (!ev) return;
        const key = [$gameMap.mapId(), ev.eventId(), "A"];
        if ($gameSelfSwitches.value(key) !== !!on) $gameSelfSwitches.setValue(key, !!on);
    }
    function setFrame(ev, dir, pat) {
        if (!ev) return;
        if (ev._direction !== dir) ev._direction = dir;
        if (ev._pattern !== pat || ev._originalPattern !== pat) { ev._pattern = pat; ev._originalPattern = pat; }
    }
    function syncEvents() {
        if (!has() || $gameMap.mapId() !== MAP) return;
        selfSwitch(evByTag("deszcz"), !!S().rainGate);
        selfSwitch(evByTag("galaz"), S().branch === "closed");
    }
    // the measuring post: a frame for each ten of the reserve (0 the whole post above the water ... 10 only the capital)
    const postFrame = lv => { const i = Math.max(0, Math.min(10, Math.floor(lv / 10))); return [[2, 4, 6, 8][Math.floor(i / 3)], i % 3]; };

    // ------------------------------------------------------------------
    // The ladle: its chain and bucket go down to the water of the band (or to the chain's end), the windlass turns
    // ------------------------------------------------------------------
    let anim = null;
    function play(kind, done) {
        const seq = D.LADLE_SEQ[kind];
        if (!seq) { if (done) done(); return; }
        anim = { seq, i: 0, t: 0, n: 0, done, kind: String(kind) };
        T.audio.se("Chain", { volume: 75, pitch: 90 });
    }
    function updateAnim() {
        if (!anim) return;
        anim.t++;
        anim.n++;
        if (anim.t < anim.seq[anim.i][1]) return;
        anim.i++;
        anim.t = 0;
        const nx = anim.seq[anim.i];
        if (!nx) { const d = anim.done; anim = null; if (d) d(); refreshLevel(); return; }
        if (nx[0] >= 3 && nx[0] <= 5) T.audio.se("Water1", { volume: 75, pitch: 80 });
        else if (nx[0] === 2 || nx[0] === 6) T.audio.se("Chain", { volume: 60, pitch: nx[0] === 2 ? 70 : 100 });
    }
    function updateFrames() {
        if (!has() || $gameMap.mapId() !== MAP) return;
        const chain = evByTag("lancuch"), wind = evByTag("czerpak"), post = evByTag("slup");
        const f = D.LADLE_FRAMES[anim ? anim.seq[anim.i][0] : 0];
        setFrame(chain, f[0], f[1]);
        setFrame(wind, anim && anim.i < anim.seq.length - 1 ? D.WINDLASS[Math.floor(anim.n / 7) % D.WINDLASS.length] : 4, 0);
        const pf = postFrame(level());
        setFrame(post, pf[0], pf[1]);
    }
    const busy = () => !!anim && window.$gameMap && $gameMap.mapId() === MAP;
    const _canMove = Game_Player.prototype.canMove;
    Game_Player.prototype.canMove = function() {
        if (busy()) return false;
        return _canMove.call(this);
    };

    // one draw a day: the rule, the chain, the day's draw
    const drawnToday = () => has() && S().drawDay === day();
    const canDraw = () => has() && isDone("D28") && !drawnToday() && level() >= R.reach && !anim;
    function useDraw(kind) {
        const s = S(), lv = s.reserve;
        s.drawDay = day();
        s.draws = (s.draws || 0) + 1;
        s.lastDraw = { day: day(), kind };
        s.reserve = clamp(s.reserve - R.draw);
        play(Math.min(2, bandOf(lv)));
        T.emit("cysternaDraw", { kind, reserve: s.reserve, day: day() });
    }
    const needsOn = () => !!T.call("Needs", "enabled");
    function drinkEntry() {
        const N = T.api("Needs"), on = needsOn() && N && N.state;
        const w = on ? N.state().water : 0, amount = on ? Math.max(0, Math.round(100 - w)) : 8;
        const ok = on ? w < 95 : (typeof $gameSystem.staminaRatio === "function" ? $gameSystem.staminaRatio() < 0.98 : true);
        return { name: TX.drinkName, icon: D.ICON.water, right: "+" + amount, enabled: ok, help: TX.drinkHelp,
            run: () => {
                if (!canDraw()) return false;
                if (!ok) { need(D.ICON.water, TX.notThirsty); return false; }
                if (on) {
                    const got = N.drink(Math.max(0, 100 - N.state().water));
                    if (typeof $gameSystem.changeStamina === "function") $gameSystem.changeStamina(3);
                    pop(TX.drank + got, D.ICON.water, "#9fd4ff");
                } else {
                    if (typeof $gameSystem.changeStamina === "function") $gameSystem.changeStamina(8);
                    pop(TX.drankStamina, D.ICON.stamina, "#9ff0a8");
                }
                T.audio.se("Water1", { volume: 80, pitch: 105 });
                useDraw("drink");
                return true;
            } };
    }
    // the clay pots carried in the bag (Farming's vesselBag.clay_pot: [{ water, uses }] - the last one stowed is the last one)
    function potEntry() {
        const F = FM(), n = count(D.ITEM.firedPot), icon = iconOf(D.ITEM.firedPot);
        const max = F && F.BUILDINGS && F.BUILDINGS.clay_pot && F.BUILDINGS.clay_pot.rain ? F.BUILDINGS.clay_pot.rain.max : 3;
        const bag = () => { const f = F && F.farm ? F.farm() : null; if (!f) return []; const vb = f.vesselBag || (f.vesselBag = {}); return vb.clay_pot || (vb.clay_pot = []); };
        const room = () => n > 0 && (bag().length < n || bag().slice(-n).some(v => (v.water || 0) < max));
        return { name: TX.potName, icon, right: n ? "×" + n : "", enabled: room(), help: n ? TX.potHelp + TX.oneDraw : TX.potNone,
            run: () => {
                if (!canDraw()) return false;
                if (!n) { need(icon, TX.potNone); return false; }
                if (!room()) { need(icon, TX.potFull); return false; }
                const list = bag();
                if (list.length < n) list.push({ water: max, uses: 0 });
                else { const v = list.slice(-n).reverse().find(x => (x.water || 0) < max); v.water = max; }
                T.audio.se("Water2", { volume: 75, pitch: 100 });
                pop(fill(TX.kod.garnekPelny, { n: max }), icon, "#9fd4ff");
                useDraw("pot");
                return true;
            } };
    }
    // the waterskin, the bucket, the watering can: Farming's own entries of a well (an unlimited source) - each one is the day's draw
    function wellEntry(e, kind) {
        if (!e) return null;
        return Object.assign({}, e, { help: e.help + TX.oneDraw, enabled: e.enabled && canDraw(),
            run: () => {
                if (!canDraw()) return false;
                const ok = e.run();
                if (ok) useDraw(kind);
                return ok;
            } });
    }
    function ladleMenu() {
        const scene = SceneManager._scene;
        if (!scene || typeof scene.openFarmMenu !== "function") return false;
        const parts = T.api("Farming_parts"), well = parts && parts.plots && parts.plots.wellEntries ? parts.plots.wellEntries() : [];
        const entries = [drinkEntry(), wellEntry(well[1], "skin"), wellEntry(well[3], "bucket"), potEntry(), wellEntry(well[2], "can")].filter(Boolean);
        scene.openFarmMenu(fill(TX.kod.menuZapas, { tytul: TX.menuTitle, n: Math.round(level()) }), entries, "", 0, null, null, TX.menuNote);
        return true;
    }
    function ladle(interp) {
        if (!has() || anim) return;
        settle();
        if (!isDone("D28")) { need(D.ICON.water, TX.wedged); think(TX.wedgedThink); return; }
        if (drawnToday()) { need(D.ICON.water, TX.usedToday); return; }
        if (level() < R.reach) { play("dry", () => { need(D.ICON.water, TX.tooLow); think(TX.tooLowThink); }); return; }
        ladleMenu();
    }

    // ------------------------------------------------------------------
    // The post, the notes, the gates, the grate
    // ------------------------------------------------------------------
    function post(interp) {
        if (!has()) return;
        settle();
        const lv = level(), k = Math.min(10, Math.floor(lv / 10));
        runList(interp, plain([], TX.kod.slup, [TX.post(lv, D.ORD_GEN[k]), lv >= R.reach ? TX.postReach : TX.postDry, fill(TX.kod.zapasWody, { n: Math.round(lv) })]));
        if (!S().read.slup) { S().read.slup = day(); autoChecks(); }
    }
    function read(key, interp) {
        if (!has()) return false;
        const n = D.NOTES[key];
        if (!n) return false;
        runList(interp || null, plain([], n.title, n.lines));
        if (!S().read[key]) {
            S().read[key] = day();
            if (n.note) T.call("Journal", "addNote", fill(TX.kod.zapiskiTytul, { tytul: n.title }), n.note);
            T.call("Combat", "discover", "cysterna_" + key, fill(TX.kod.zapiskiOdkrycie, { tytul: n.title }), 20);
            autoChecks();
        }
        return true;
    }
    let lastPop = 0;
    const once = () => { if (Graphics.frameCount - lastPop < 60) return false; lastPop = Graphics.frameCount; return true; };
    function grate(interp) {
        if (!has()) return;
        if (!$gameSwitches.value(D.SW.krata)) { if (once()) pop(TX.grateShut); return; }
        const w = W();
        if (!(w && w.isReady && w.isReady(URW))) { if (once()) pop(TX.grateBlocked); return; }
        T.audio.se("Move1", { volume: 80, pitch: 95 });
        $gamePlayer.reserveTransfer(URW, 41, 16, 2, 0);
    }
    function lever(interp) {
        if (!has()) return;
        if (S().lever) { pop(TX.leverDone); return; }
        S().lever = day();
        $gameSwitches.setValue(D.SW.krata, true);
        T.audio.se("Switch2", { volume: 85, pitch: 90 });
        T.audio.se("Gate2", { volume: 75, pitch: 85 });
        T.popup(TX.leverPull, { top: true, color: "#9ff0a8", sub: TX.leverSub });
        const w = W();
        think(w && w.isReady && w.isReady(URW) ? TX.leverThink : TX.kod.kanalZasypany);
        autoChecks();
    }
    function rainGate(interp) {
        if (!has()) return;
        const s = S();
        if (s.rainGate) { pop(TX.rainLook(gutterCount())); return; }
        if (typeof $gameSystem.trySpendStamina === "function" && !$gameSystem.trySpendStamina(D.GUTTER.gateStamina)) { need(D.ICON.stamina, TX.rainTired); return; }
        s.rainGate = day();
        syncEvents();
        T.audio.se("Gate1", { volume: 85, pitch: 80 });
        T.popup(TX.rainOpen, { top: true, color: "#9fd4ff", sub: TX.rainOpenSub });
        if (gutterCount() < D.GUTTER.n) think(TX.rainClogged);
        autoChecks();
    }
    function branch(interp) {
        if (!has()) return;
        const s = S();
        if (s.branch === "closed") { pop(TX.branchShut); return; }
        const out = [];
        if (!s.branchSeen) { s.branchSeen = day(); linesTo(out, HERO, TX.branchFirst); }
        sayTo(out, HERO, TX.branchAsk);
        choiceTo(out, [TX.branchClose, TX.branchLeave], [act([], ["close"]), act([], ["leave"]).concat(linesTo([], HERO, TX.branchLeft))], 1);
        runList(interp, out);
    }
    function closeBranch() {
        const s = S();
        if (s.branch === "closed") return false;
        s.branch = "closed";
        s.branchDay = day();
        setFlag("galazDworskaZamknieta");
        const got = T.call("TownQuests", "addOpinion", 3, TX.kod.opiniaGalaz) || 0;
        setFlag("lordCold");   // (always - not only when he was an ally: the coordinator's decision 2026-10-16)
        think(TX.branchLord);
        syncEvents();
        T.audio.se("Gate2", { volume: 85, pitch: 75 });
        T.popup(TX.branchClosed, { top: true, color: "#ffe27a", sub: TX.branchClosedSub + (got ? fill(TX.kod.opiniaPlus, { n: got }) : "") });
        autoChecks();
        return true;
    }
    function actCall(interp, args) {
        if (!has() || !Array.isArray(args)) return;
        try {
            if (args[0] === "close") closeBranch();
            else if (args[0] === "leave") { const s = S(); if (!s.branch) { s.branch = "open"; s.branchDay = day(); } autoChecks(); }
        } catch (e) { console.error("[Cysterna] act " + JSON.stringify(args), e); }
    }

    // ------------------------------------------------------------------
    // The water of the tank is seen, not drunk: the action button facing it (no event there) says so - Farming's water menu never opens
    // ------------------------------------------------------------------
    function waterAt(x, y) {
        if (!$gameMap.isValid(x, y)) return false;
        for (let z = 0; z < 2; z++) { const id = $gameMap.tileId(x, y, z); if (id > 0 && Tilemap.isWaterTile(id)) return true; }
        return false;
    }
    const _triggerButtonAction = Game_Player.prototype.triggerButtonAction;
    Game_Player.prototype.triggerButtonAction = function() {
        if (Input.isTriggered("ok") && has() && $gameMap.mapId() === MAP && !this.isInVehicle()) {
            const dir = this.direction(), x = $gameMap.roundXWithDirection(this.x, dir), y = $gameMap.roundYWithDirection(this.y, dir);
            const there = $gameMap.eventsXy(x, y).some(e => e.isNormalPriority() && e.isTriggerIn([0, 1, 2]));
            const here = $gameMap.eventsXy(this.x, this.y).some(e => e.isTriggerIn([0]) && e.page() && e.list().length > 1);
            if (waterAt(x, y) && !there && !here) { if (once()) need(D.ICON.water, TX.tankWater); return true; }
        }
        return _triggerButtonAction.call(this);
    };

    // ------------------------------------------------------------------
    // The town's well under 15: one draw a day less - TownQuests.wellBonus asks this (minus one), Farming_Plots.rationOf takes it
    // (never under one draw a day). Since the integration 2026-10-16 instead of a wrapper of Farming.rationWell.
    // ------------------------------------------------------------------
    function wellLow() {
        try { return has() && !!S().been && flag("cisternOpen") && level() < R.low; } catch (e) { return false; }
    }

    // ------------------------------------------------------------------
    // The drowned (Creatures.js): at the markers "Miejsce: topielec_N"
    // ------------------------------------------------------------------
    let drownedOn = true;
    function spawnDrowned(first) {
        const s = S(), Cr = T.api("Creatures");
        if (!drownedOn || !Cr || !Cr.spawn || s.drownedDay === day()) return 0;
        s.drownedDay = day();
        const n = first ? D.DROWNED.first : (Math.random() < D.DROWNED.later ? 1 : 0);
        const spots = $gameMap.events().filter(e => e.event() && /^Miejsce: topielec_/.test(e.event().name || ""))
            .filter(e => Math.hypot(e.x - $gamePlayer.x, e.y - $gamePlayer.y) >= 5);
        let made = 0;
        for (let i = 0; i < n && spots.length; i++) {
            const sp = spots.splice(Math.floor(Math.random() * spots.length), 1)[0];
            try { if (Cr.spawn("topielec", sp.x, sp.y, { tag: D.DROWNED.tag })) made++; } catch (e) { console.error("[Cysterna] drowned", e); }
        }
        return made;
    }

    // ------------------------------------------------------------------
    // The gutters on the Urwisko (K53): the debris at package B's markers "Miejsce: rynna_1..4" (ids 680-683)
    // ------------------------------------------------------------------
    const BLANK = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1,
        switch1Valid: false, switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    function gutterEvent(id, n, x, y) {
        const page = { conditions: Object.assign({}, BLANK), directionFix: true,
            image: { tileId: 0, characterName: "!Cysterna_Rzeczy", direction: 2, pattern: 0, characterIndex: 1 },
            list: [C(355, ["Cysterna.gutter(this, " + n + ");"]), C(0, [])],
            moveFrequency: 3, moveRoute: { list: [C(0, [])], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0,
            priorityType: 1, stepAnime: false, through: false, trigger: 0, walkAnime: false };
        return { id, name: Watki.wstaw(TK.kod.gutterEvent[0], { n: n }), note: "<Cysterna:rynna_" + n + ">", pages: [page], x, y };
    }
    function gutterEvents(data) {
        if (!has() || !data || !Array.isArray(data.events)) return [];
        const out = [];
        for (let n = 1; n <= D.GUTTER.n; n++) {
            if (S().gutters[n]) continue;
            const m = data.events.find(e => e && e.name === "Miejsce: rynna_" + n);
            if (m) out.push(gutterEvent(D.IDS[0] + n - 1, n, m.x, m.y));
        }
        return out;
    }
    T.inject([URW], { ids: D.IDS, owner: PLUGIN, build: data => gutterEvents(data) });
    function gutter(interp, n) {
        if (!has() || S().gutters[n]) return false;
        const tools = [D.ITEM.steelPick, D.ITEM.ironPick, D.ITEM.pickaxe, D.ITEM.shovel].filter(Boolean);
        if (!tools.some(id => count(id) > 0)) { need(iconOf(D.ITEM.pickaxe), TX.gutterNeed); return false; }
        if (typeof $gameSystem.trySpendStamina === "function" && !$gameSystem.trySpendStamina(D.GUTTER.stamina)) { need(D.ICON.stamina, TX.rainTired); return false; }
        S().gutters[n] = day();
        T.audio.se("Earth2", { volume: 80, pitch: 110 });
        const c = gutterCount();
        pop(TX.gutterDone(c), iconOf(D.ITEM.pickaxe), "#9ff0a8");
        if (c >= D.GUTTER.n) think(TX.gutterAll);
        const ev = interp && window.$gameMap ? $gameMap.event(interp.eventId()) : null;
        if (ev && ev.eventId() >= D.IDS[0] && ev.eventId() <= D.IDS[1]) ev.erase();
        autoChecks();
        return true;
    }

    // ------------------------------------------------------------------
    // TownQuests: D28 "Zapas zakonu", K53 "Rynny zakonu"
    // ------------------------------------------------------------------
    function hookQuests() {
        const q = TQ();
        if (!q || !q.FX || hookQuests.done) return;
        hookQuests.done = true;
        Object.assign(q.FX, {
            // D28 starts by itself when the hero is on floor 30 (or in the cistern) with the sluice open - W1 rozdz. 7 done
            d28Start: () => has() && built && flag("cisternOpen") && !!window.$gameMap && [F30, MAP].includes($gameMap.mapId()),
            d28Wejdz: { check: () => S().been > 0 },
            d28Ksiega: { check: () => !!(S().read.ksiega && S().read.slup) },
            d28Vars: { vars: () => ({ n: (S().read.ksiega ? 1 : 0) + (S().read.slup ? 1 : 0) }) },
            d28Krata: { check: () => !!S().lever },
            d28Galaz: { check: () => !!S().branch },
            // K53 starts after D28 in the cistern or on the Urwisko - once the Urwisko is built (package B)
            k53Start: () => has() && isDone("D28") && !!W() && W().isReady(URW) && !!window.$gameMap && [MAP, URW].includes($gameMap.mapId()),
            k53Zasuwa: { check: () => !!S().rainGate },
            k53Rynny: { check: () => gutterCount() >= D.GUTTER.n },
            k53Vars: { vars: () => ({ n: gutterCount() }) }
        });
    }
    hookQuests();
    // the ladle's wedge out once D28 is done (the hero is in the cistern: the last step is taken by the manor branch)
    T.on("townQuestDone", e => {
        if (!has() || !e || e.id !== "D28" || S().unwedged) return;
        S().unwedged = day();
        think(TX.unwedge);
    }, { owner: PLUGIN });

    // ------------------------------------------------------------------
    // The day, the map, the frame
    // ------------------------------------------------------------------
    function arrive(transfer) {
        const s = S(), first = !s.been;
        if (first) {
            s.been = day();
            s.day = day();
            setFlag("cysternaOtwarta");
            think(TX.firstVisit);
        }
        settle();
        if (transfer) {
            s.visits = (s.visits || 0) + 1;
            spawnDrowned(first);
            T.popup(TX.arrive(level()), { top: true, color: "#9fd4ff" });
        }
        syncEvents();
        autoChecks();
    }
    T.on("mapReady", e => {
        if (!has()) return;
        hookQuests();
        syncSwitches();
        const m = $gameMap.mapId();
        if (m === MAP) arrive(!!(e && e.transfer));
        else if (m === F30) autoChecks();
    }, { owner: PLUGIN });
    T.on("dayStart", () => { if (has()) { settle(); syncSwitches(); } }, { owner: PLUGIN });
    T.on("load", () => { anim = null; thoughts.length = 0; }, { owner: PLUGIN });
    T.on("newGame", () => { anim = null; thoughts.length = 0; }, { owner: PLUGIN });
    let tick = 0;
    T.onMapUpdate(() => {
        if (!has()) return;
        updateAnim();
        updateFrames();
        updateThoughts();
        if (++tick % 60 === 0) syncSwitches();
    }, { owner: PLUGIN, name: "cistern" });

    // ------------------------------------------------------------------
    // The API
    // ------------------------------------------------------------------
    const api = {
        MAP, DATA: D, state: () => S(), built: () => built, level, band: () => bandOf(level()), bandOf, settle, dayChange,
        setLevel: v => { if (!has()) return 0; S().reserve = clamp(Number(v) || 0); refreshLevel(); return S().reserve; },
        ladle, post, read: (key, interp) => read(key, interp), grate, lever, rainGate, branch, closeBranch, act: actCall, gutter, gutterEvents,
        gutterCount, canDraw, drawnToday, ladleMenu, playing: () => (anim ? anim.kind : null), spawnDrowned, drowned: v => { drownedOn = v !== false; return drownedOn; },
        postFrame, ladleFrame: () => D.LADLE_FRAMES[anim ? anim.seq[anim.i][0] : 0], syncSwitches, patchSluice,
        wellLow, rainyDay, manorDrain, townDrain, rainGain, thoughts: () => thoughts.length, hush: () => { thoughts.length = 0; return 0; }
    };
    window.Cysterna = T.register(PLUGIN, api);
})();
