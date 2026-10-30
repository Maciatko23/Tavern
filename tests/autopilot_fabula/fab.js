// Autopilot fabuły (2026-10-28) - wstrzykiwany przez CDP (tests/autopilot_fabula_test.js, tools/autopilot/ogladaj.js), NIE wtyczka gry.
// Gra jak gracz: klawisze (Input._currentState), prawdziwe przejścia między mapami, prawdziwe rozmowy (O na wiadomościach, wybory
// strzałkami), jedzenie, picie, sen, zmiany u Borgara (mini-gra grana klawiszami - bot z tests/tavern_shift_test.js), spłata długu
// z zarobionych pieniędzy. Bez setDay, teleportów i dosypywania złota. Stoi na tests/autopilot/ap.js (AP.lib: chodzenie, menu, walka
// ze zwierzętami) i chodzi jako jego zadanie "fabula" (AP.TASKS.fabula), więc odruchy AP (unik, walka z dzikiem i wilkami) działają.
// Cel bierze z gry (Story, Journal.tracked, CleanCompass.target, TownQuests); każdy wybór i każda niejasność trafia do FAB.rep.
// window.FAB_GRAPH (tests/autopilot_fabula/graf.js) - przejścia map z plików data/MapXXX.json; bieżąca mapa czytana na żywo.
(function() {
    "use strict";
    const VERSION = 5;
    if (!window.AP || !AP.lib) return "brak ap.js (AP.lib)";
    const L = AP.lib;
    const old = window.FAB;
    if (old && old.version === VERSION && old.started) return "same";

    // ------------------------------------------------------------------ stan autopilota i raport
    function newReport() {
        return { start: null, days: {}, choices: [], deaths: [], stalls: [], unclear: [], grind: [], chapters: [], shifts: [], payments: [], gold: [], notes: [], errors: [], workarounds: [], prep: [] };
    }
    const FAB = window.FAB = Object.assign(old || {}, {
        version: VERSION, started: true, log: (old && old.log) || [], talkLog: (old && old.talkLog) || [],
        rep: (old && old.rep) || newReport(), graph: (old && old.graph) || window.FAB_GRAPH || null,
        doing: "", why: "", stage: "", stuck: null, paused: false, mode: (old && old.mode) || "test",
        blocked: {}, soupDay: -1, well: { day: -1, n: 0 }, shiftTried: -1, payTried: -1, unclearSeen: {}
    });
    FAB.policyName = "uczciwie i pomocnie";

    // ------------------------------------------------------------------ czas i stan gry
    const day = () => $gameSystem.dayNightDay();
    const hour = () => $gameSystem.dayNightHour();
    const now = () => day() * 24 + hour();
    const clock = () => { const h = hour(); return Math.floor(h) + ":" + String(Math.floor((h % 1) * 60)).padStart(2, "0"); };
    const mapId = () => $gameMap.mapId();
    const P = () => $gamePlayer;
    const gold = () => $gameParty.gold();
    const S = () => (window.Story && Story.state ? Story.state() : null);
    const needs = () => (window.Needs && Needs.enabled && Needs.enabled() ? Needs.state() : { food: 100, water: 100 });
    const stamina = () => ($gameSystem.stamina ? $gameSystem.stamina() : 100);
    const count = id => $gameParty.numItems($dataItems[id]);
    const busy = () => $gameMap.isEventRunning() || $gameMessage.isBusy();
    const onMapReady = () => SceneManager._scene instanceof Scene_Map && SceneManager._scene._started && !SceneManager.isSceneChanging() && !$gamePlayer.isTransferring();
    const mapName = id => { const G = FAB.graph; return (G && G.names && G.names[id]) || ($dataMapInfos[id] && $dataMapInfos[id].name) || ("mapa " + id); };
    const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
    const MAP = { house: 19, yard: 20, field: 3, town: 8, tavern: 1, manor: 24, cellar: 9 };
    const SOUP = 131, ROTTEN = 122;
    const KEEP = 30;          // złoto, które zostaje w sakiewce przy spłatach (jedzenie w tawernie)
    const PAY_AT = 300;       // od tylu złota idzie do dworu z ratą (mniej do stracenia, gdy obrabują w nocy na drodze)

    function say(t) {
        FAB.mirrorOff = true;
        try { L.say(t); } finally { FAB.mirrorOff = false; }
        FAB.log.push("d" + day() + " " + clock() + " " + t);
        if (FAB.log.length > 600) FAB.log.splice(0, 150);
    }
    FAB.say = say;
    // (AP's own words - "nie ma drogi do...", fights, eating - into this log too)
    if (!AP.log.__fab) {
        const push = AP.log.push;
        AP.log.push = function(x) { const r = push.apply(this, arguments); try { if (!FAB.mirrorOff && !/▶/.test(x)) { FAB.log.push("d" + day() + " AP " + String(x).replace(/^\[[^\]]*\]\s*/, "")); if (FAB.log.length > 600) FAB.log.splice(0, 150); } } catch (e) {} return r; };
        AP.log.__fab = true;
    }
    function note(kind, data) {
        // (an unclear place noted again within a day: once is enough)
        if (kind === "unclear" && data && data.what && (FAB.rep.unclear || []).some(u => u.what === data.what && (day() * 24 + hour()) - (u.day * 24 + u.hour) < 24)) return null;
        const rec = Object.assign({ day: day(), hour: +hour().toFixed(2), map: mapId() }, data || {});
        (FAB.rep[kind] = FAB.rep[kind] || []).push(rec);
        return rec;
    }
    function dayRec() {
        const d = day(), R = FAB.rep.days;
        if (!R[d]) R[d] = { ch: FAB.stage, acts: [], gold0: gold(), paid0: (S() && S().paid) || 0, deep0: window.Underground && Underground.deepest ? Underground.deepest() : 0 };
        return R[d];
    }
    function setDoing(what, why) {
        // (the free time's job: the bar keeps "Do zmiany 2 h 30 min - w tym czasie: ..." with the hours left, whatever the step)
        if (FAB.freePrefix && what && !/^Do (zmiany|kapuśniaku)/.test(what)) what = FAB.freePrefix.label + " " + fmtH(FAB.freePrefix.deadline - hour()) + " - w tym czasie: " + what;
        if (FAB.doing === what && FAB.why === why) return;
        FAB.doing = what; FAB.why = why || "";
        say("▶ " + what + (why ? " - " + why : ""));
        const r = dayRec(), last = r.acts[r.acts.length - 1];
        if (!last || last.w !== what) { r.acts.push({ h: +hour().toFixed(1), w: what, y: why || "" }); if (r.acts.length > 60) r.acts.splice(0, 20); }
    }
    FAB.setDoing = setDoing;
    function setStage(name) {
        if (FAB.stage === name) return;
        FAB.stage = name;
        note("chapters", { name, real: Date.now() });
        say("=== " + name + " ===");
    }

    // ------------------------------------------------------------------ zapisy rozmów (dla raportu): każda wiadomość z mówiącym
    if (!FAB.msgHooked) {
        FAB.msgHooked = true;
        const _start = Window_Message.prototype.startMessage;
        Window_Message.prototype.startMessage = function() {
            _start.call(this);
            try {
                FAB.talkLog.push({ t: $gameMessage.allText().replace(/\s+/g, " ").slice(0, 400), name: $gameMessage.speakerName(), day: day(), hour: +hour().toFixed(2), map: mapId() });
                if (FAB.talkLog.length > 500) FAB.talkLog.splice(0, 150);
            } catch (e) { /* (tylko zapis) */ }
        };
        if (window.Tawerna && Tawerna.on) {
            Tawerna.on("shiftDone", e => { try { note("shifts", { grade: e.grade, pay: e.pay, tips: e.tips, total: e.total, level: e.level, n: e.done }); } catch (x) {} }, { owner: "AutopilotFabuly" });
            Tawerna.on("debtPayment", e => { try { note("payments", { n: e && (e.n || e.amount || e.paid), paid: S() && S().paid, gold: gold() }); } catch (x) {} }, { owner: "AutopilotFabuly" });
        }
    }

    // ------------------------------------------------------------------ polityka wyborów: uczciwie i pomocnie
    const LEAVE = /^(Nie teraz|Bywaj|Odejdź|Nic, dzięki|Jeszcze nie|Zostaw|Zostać|Nie, jeszcze nie|Wróć|Anuluj|To wszystko)/;
    const PREFER = [/^Puść go wolno/, /^Zanieś je/, /^Nie sprzedam/, /całą prawdę/i, /^Nie pytam o to, czego nie chcę wiedzieć/, /^Pomogę/, /^Będę przychodził/,
        /^Spłać cały dług/, /^Zapieczętować/, /^Tak\b/, /^Zgoda/, /^Dobrze/, /^Zejść/, /^Zakręcić/];
    const AVOID = [/Dobij/, /Zabierz mu sakiewkę/, /^Sprzedam/, /Okradnij|Ukradnij|Oszukaj|Skłam|Zabij|Wydaj go|Donieś/i, /\(\s*\d+\s*G\s*\)/, /\d+\s*G$/,
        /^Wynajmij/, /^Zjedz coś/, /^Sprzedaj towar/, /^Kupię/, /^Przerwij/, /Do ekranu tytułowego/];
    // (side quests - K/D offers - are not taken: the autopilot plays the story threads only and says no politely)
    const DECLINE = /^(Nie teraz|Nie mam|Nie mogę|Nie dziś|Nie chcę|Nie stanę|Innym razem|Odmawiam|Nie dam rady)/;
    function policy(labels, o) {
        if (o && o.leave) {
            let i = labels.findIndex(l => LEAVE.test(l));
            if (i >= 0) return { i, why: "koniec rozmowy" };
            i = labels.findIndex(l => DECLINE.test(l));
            if (i >= 0) return { i, why: "odmowa (zadania poboczne poza planem autopilota)" };
        }
        for (const re of PREFER) { const i = labels.findIndex(l => re.test(l)); if (i >= 0) return { i, why: "polityka: " + FAB.policyName }; }
        const i = labels.findIndex(l => !LEAVE.test(l) && !AVOID.some(re => re.test(l)));
        if (i >= 0) return { i, why: "polityka: pierwsza uczciwa opcja" };
        const j = labels.findIndex(l => LEAVE.test(l));
        return { i: j >= 0 ? j : labels.length - 1, why: "polityka: wyjście" };
    }
    FAB.policy = policy;

    // ------------------------------------------------------------------ klawisze i rozmowy
    function* combatOff() {
        if (window.Combat && Combat.combatMode && Combat.combatMode()) { yield* L.press("tab"); yield* L.wait(6); }
    }
    function evTiles(e) {
        const m = /<Occupy:([^>]*)>/i.exec((e.event() && e.event().note) || ""), o = { left: 0, right: 0, up: 0, down: 0 };
        if (m) for (const part of m[1].split(",")) { const kv = part.split("=").map(s => s.trim()); if (kv[0] in o) o[kv[0]] = Number(kv[1]) || 0; }
        const out = [];
        for (let y = e.y - o.up; y <= e.y + o.down; y++) for (let x = e.x - o.left; x <= e.x + o.right; x++) out.push([x, y]);
        return out;
    }
    function faceTiles(tiles) {
        const p = P();
        let best = null;
        for (const [x, y] of tiles) { const d = Math.abs(x - p.x) + Math.abs(y - p.y); if (!best || d < best.d) best = { x, y, d }; }
        if (!best || best.d !== 1) return false;
        p.setDirection(best.x > p.x ? 6 : best.x < p.x ? 4 : best.y > p.y ? 2 : 8);
        return true;
    }
    // where to stand to talk to / use these tiles: beside them (L.spotsFor), or across a counter tile (the bar - RMMZ's counter: O reaches
    // over it); the nearest by the path; walks there and faces the tiles
    function* approach(tiles, front) {
        yield* L.closeMenus();
        yield* L.standUp();
        const f = L.field(P().x, P().y);
        const spots = L.spotsFor(tiles, f, front).slice();
        const set = new Set(tiles.map(t => t[0] + "," + t[1]));
        for (const [tx, ty] of tiles) for (const [dx, dy, d] of [[0, 1, 8], [0, -1, 2], [1, 0, 4], [-1, 0, 6]]) {
            const cx = tx + dx, cy = ty + dy;
            if (!$gameMap.isValid(cx, cy) || set.has(cx + "," + cy) || !$gameMap.isCounter(cx, cy)) continue;
            const sx = cx + dx, sy = cy + dy;
            if (!$gameMap.isValid(sx, sy)) continue;
            const c = f.at(sx, sy);
            if (isFinite(c)) spots.push({ x: sx, y: sy, d, c, counter: true });
        }
        spots.sort((a, b) => a.c - b.c);
        for (const sp of spots.slice(0, 4)) {
            if (!(yield* L.walkTo(sp.x, sp.y, f))) continue;
            yield* L.standUp();
            yield* L.waitFree(240);
            P().setDirection(sp.d);
            yield* L.wait(3);
            return sp;
        }
        return null;
    }
    FAB.approach = approach;
    // a choice on the screen: by the plan's picks (a prefix), else by the policy; arrows to it, O
    function* chooseNow(cw, picks, o) {
        const labels = $gameMessage.choices().slice();
        let i = -1, why = "";
        if (picks.length) {
            const want = picks[0];
            i = labels.findIndex(l => l.indexOf(want) === 0);
            if (i < 0) i = labels.findIndex(l => l.indexOf(want) >= 0);
            if (i >= 0) { picks.shift(); why = "plan"; }
            else if (o && o.strict) { why = "brak opcji „" + want + "”"; }
        }
        if (i < 0) { const r = policy(labels, o); i = r.i; why = why ? why + "; " + r.why : r.why; }
        const last = FAB.talkLog[FAB.talkLog.length - 1];
        note("choices", { labels, picked: labels[i], why, who: (last && last.name) || "", said: last ? last.t.slice(0, 160) : "" });
        say("wybór: „" + labels[i] + "” (" + why + ")");
        for (let g = 0; g < 30 && cw.index() !== i; g++) yield* L.press(cw.index() < i ? "down" : "up");
        yield* L.wait(2);
        yield* L.press("ok");
        yield* L.wait(4);
        return labels[i];
    }
    // drives what is on the screen (messages: O; choices; number input) until the map is free again
    function* drive(o = {}) {
        const picks = (o.picks || []).slice(), mark = FAB.talkLog.length, max = o.max || 60 * 60 * 8;
        let calm = 0, t = 0;
        const chosen = [];
        for (let n = 0; n < max; n++) {
            const sc = SceneManager._scene;
            if (!(sc instanceof Scene_Map)) { calm = 0; L.key("ok", false); yield; continue; }   // (a scene of its own: its own driver)
            const cw = sc._choiceListWindow, mw = sc._messageWindow;
            if ($gameMessage.isChoice() && cw && cw.active && cw.isOpen()) { L.key("ok", false); chosen.push(yield* chooseNow(cw, picks, o)); calm = 0; continue; }
            if ($gameMessage.isNumberInput && $gameMessage.isNumberInput()) { yield* L.press("ok"); calm = 0; continue; }
            if ($gameMessage.isItemChoice && $gameMessage.isItemChoice()) { yield* L.press("cancel"); calm = 0; continue; }
            if ($gameMessage.isBusy() || (mw && mw.isOpen() && mw.openness > 0)) { calm = 0; L.key("ok", ++t % 6 === 0); yield; continue; }
            L.key("ok", false);
            if (L.menuOpen()) { if (o.menuOk) break; yield* L.closeMenus(); calm = 0; continue; }
            if ($gameMap.isEventRunning()) { calm = 0; yield; continue; }
            if (++calm > 10) break;
            yield;
        }
        L.key("ok", false);
        const log = FAB.talkLog.slice(mark);
        return { ok: true, chosen, text: log.map(l => l.t).join(" / "), log };
    }
    FAB.drive = drive;
    // talks to an event (an id, or a function giving the event - a resident that walks): beside it, facing it, O, the talk driven
    function* talkTo(get, o = {}) {
        for (let a = 0; a < (o.tries || 5); a++) {
            let e = typeof get === "function" ? get() : $gameMap.event(get);
            if (!e) { yield* L.wait(30); continue; }
            yield* combatOff();
            const spot = yield* approach(o.tiles || evTiles(e), o.front);
            if (!spot) {
                say("nie dojdę do rozmowy: " + ((e.event() && e.event().name) || e.eventId()));
                // (a thing in the wall nobody can stand by - a map's fault: started from the nearest tile, ONLY with the map fixes on, noted)
                if (o.remote && FAB.mapFixes && a >= 1) return yield* remoteStart(e, o);
                yield* L.wait(30); continue;
            }
            e = (typeof get === "function" ? get() : $gameMap.event(get)) || e;
            if (!o.tiles && !spot.counter) faceTiles(evTiles(e));
            yield* L.wait(2);
            yield* L.press("ok");
            let started = false;
            for (let n = 0; n < 45; n++) { if (busy() || L.menuOpen() || !(SceneManager._scene instanceof Scene_Map)) { started = true; break; } yield; }
            if (!started) { yield* L.closeMenus(); continue; }
            return yield* drive(o);
        }
        return { ok: false, chosen: [], text: "", log: [] };
    }
    FAB.talkTo = talkTo;
    // ---- map faults (2026-10-28, the tavern Map001: the loose brick 9,4 and its landing 9,5 are in the wall since the tavern was rebuilt):
    // a workaround, ON by default (FAB.mapFixes; the test's --bez-obejsc switches it off), each use noted in the report as NOT a player's
    // move - the event started from the nearest tile he can reach; a landing inside a wall left for the nearest free tile
    function nearestFree(x0, y0, r) {
        let best = null;
        for (let y = y0 - r; y <= y0 + r; y++) for (let x = x0 - r; x <= x0 + r; x++) {
            if (!$gameMap.isValid(x, y) || ![2, 4, 6, 8].some(d => $gameMap.isPassable(x, y, d))) continue;
            if ($gameMap.eventsXy(x, y).some(e => e.isNormalPriority() && !e.isThrough())) continue;
            const d = Math.hypot(x - x0, y - y0);
            if (!best || d < best.d) best = { x, y, d };
        }
        return best;
    }
    function* remoteStart(e, o) {
        const name = (e.event() && e.event().name) || String(e.eventId()), at = [e.x, e.y];
        const f = L.field(P().x, P().y);
        let best = null;
        for (let y = e.y - 12; y <= e.y + 12; y++) for (let x = e.x - 12; x <= e.x + 12; x++) {
            if (!$gameMap.isValid(x, y) || !isFinite(f.at(x, y))) continue;
            const d = Math.hypot(x - e.x, y - e.y);
            if (!best || d < best.d) best = { x, y, d };
        }
        if (best) yield* L.walkTo(best.x, best.y, f);
        note("workarounds", { what: "OBEJŚCIE BŁĘDU MAPY: „" + name + "” (" + mapName(mapId()) + " " + at.join(",") + ") stoi w ścianie - nie da się przy nim stanąć; zdarzenie uruchomione z najbliższego pola " + (best ? best.x + "," + best.y : "-"), why: FAB.why });
        say("OBEJŚCIE BŁĘDU MAPY: " + name + " uruchomione z " + (best ? best.x + "," + best.y : "?"));
        e.start();
        return yield* drive(o);
    }
    function heroInWall() { const p = P(); return ![2, 4, 6, 8].some(d => $gameMap.isPassable(p.x, p.y, d)); }
    function* unwall() {
        if (!heroInWall() || !FAB.mapFixes) return false;
        const p = P(), at = [p.x, p.y], f = nearestFree(p.x, p.y, 12);
        if (!f) return false;
        note("workarounds", { what: "OBEJŚCIE BŁĘDU MAPY: przejście wysadziło bohatera w ścianie (" + mapName(mapId()) + " " + at.join(",") + ") - przestawiony na najbliższe wolne pole " + f.x + "," + f.y, why: FAB.why });
        say("OBEJŚCIE BŁĘDU MAPY: ze ściany " + at.join(",") + " na " + f.x + "," + f.y);
        p.locate(f.x, f.y);
        yield* L.wait(10);
        return true;
    }
    // a closed pocket: the landing's room has no way out but the one he came by (Map001: the cellar's stairs land in a walled-in store
    // room). Workaround (noted): the nearest free tile outside the pocket.
    function regionFrom(x0, y0, max) {
        const W = $gameMap.width(), set = new Set([y0 * W + x0]), q = [[x0, y0]];
        while (q.length && set.size < max) {
            const [x, y] = q.shift();
            for (const [d, dx, dy] of [[2, 0, 1], [8, 0, -1], [4, -1, 0], [6, 1, 0]]) {
                if (!$gameMap.isPassable(x, y, d)) continue;
                const nx = x + dx, ny = y + dy, k = ny * W + nx;
                if (!$gameMap.isValid(nx, ny) || set.has(k) || !$gameMap.isPassable(nx, ny, 10 - d)) continue;
                set.add(k); q.push([nx, ny]);
            }
        }
        return set;
    }
    function* unpocket(from) {
        if (!FAB.mapFixes) return false;
        const p = P(), W = $gameMap.width(), set = regionFrom(p.x, p.y, 600);
        if (set.size >= 600) return false;
        const near = (x, y) => [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => set.has((y + dy) * W + x + dx));
        if (liveExits().some(x => x.to !== from && near(x.x, x.y))) return false;
        // the main part of the map: the region by an exit that does not lead back
        let main = null;
        for (const x of liveExits().filter(x => x.to !== from)) {
            for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0], [0, 0]]) {
                const tx = x.x + dx, ty = x.y + dy;
                if (!$gameMap.isValid(tx, ty) || ![2, 4, 6, 8].some(d => $gameMap.isPassable(tx, ty, d))) continue;
                const r = regionFrom(tx, ty, 5000);
                if (r.size > 300 && !r.has(p.y * W + p.x)) { main = r; break; }
            }
            if (main) break;
        }
        if (!main) return false;
        let best = null;
        for (const k of main) { const x = k % W, y = (k / W) | 0, d = Math.hypot(x - p.x, y - p.y); if (!best || d < best.d) best = { x, y, d }; }
        if (!best) return false;
        const at = [p.x, p.y];
        note("workarounds", { what: "OBEJŚCIE BŁĘDU MAPY: przejście z mapy " + mapName(from) + " wysadziło bohatera w zamkniętym pomieszczeniu (" + mapName(mapId()) + " " + at.join(",") + ", " + set.size + " pól, bez wyjścia) - przestawiony na najbliższe pole poza nim " + best.x + "," + best.y, why: FAB.why });
        say("OBEJŚCIE BŁĘDU MAPY: zamknięte pomieszczenie " + at.join(",") + " → " + best.x + "," + best.y);
        p.locate(best.x, best.y);
        yield* L.wait(10);
        return true;
    }
    FAB.mapFixes = FAB.mapFixes !== false;
    FAB._unpocket = unpocket; FAB._regionFrom = regionFrom;
    function* idle(frames, what) {
        L.setMove([]);
        for (let n = 0; n < frames; n++) {
            if (busy()) { yield* drive({}); continue; }
            if (n % 1200 === 0) AP.saidAt = AP.frame;   // (AP's "stoi od minuty" watchdog: standing still on purpose)
            yield;
        }
        return true;
    }

    // ------------------------------------------------------------------ drogi między mapami
    function condOk(c, m, id) {
        if (!c) return true;
        if (c.s1 && !$gameSwitches.value(c.s1)) return false;
        if (c.s2 && !$gameSwitches.value(c.s2)) return false;
        if (c.v && $gameVariables.value(c.v[0]) < c.v[1]) return false;
        if (c.ss && !$gameSelfSwitches.value([m, id, c.ss])) return false;
        if (c.item && !$gameParty.hasItem($dataItems[c.item])) return false;
        return true;
    }
    let byMapCache = null;
    function byMap(m) {
        if (!byMapCache) { byMapCache = {}; for (const x of (FAB.graph && FAB.graph.exits) || []) (byMapCache[x.m] = byMapCache[x.m] || []).push(x); }
        return byMapCache[m] || [];
    }
    function liveExits() {
        const out = [], here = mapId();
        for (const e of $gameMap.events()) {
            if (!e || e._erased) continue;
            const pg = e.page();
            if (!pg || !pg.list) continue;
            const c = pg.list.find(c => c.code === 201 && c.parameters && c.parameters[0] === 0);
            if (!c || c.parameters[1] === here) continue;
            out.push({ m: here, id: e.eventId(), x: e.x, y: e.y, trig: pg.trigger, prio: pg.priorityType, to: c.parameters[1], tx: c.parameters[2], ty: c.parameters[3],
                br: c.indent > 0 ? 1 : 0, name: e.event().name || "" });
        }
        return out;
    }
    const blockKey = x => x.m + ":" + x.id;
    const isBlocked = x => (FAB.blocked[blockKey(x)] || 0) > now();
    // maps the route never passes through (only as the goal): the guests' rooms, houses with two doors, the underground
    const NO_THROUGH = new Set([25]);
    function planRoute(target) {
        const here = mapId();
        if (here === target) return { here: true };
        const heap = [], seen = new Set();
        for (const x of liveExits()) if (!isBlocked(x)) heap.push({ c: dist(P().x, P().y, x.x, x.y) + 3 + (x.br ? 10 : 0), first: x, m: x.to, x: x.tx, y: x.ty });
        while (heap.length) {
            let k = 0;
            for (let i = 1; i < heap.length; i++) if (heap[i].c < heap[k].c) k = i;
            const n = heap.splice(k, 1)[0];
            if (n.m === target) return n.first;
            const key = n.m + ":" + n.x + ":" + n.y;
            if (seen.has(key)) continue;
            seen.add(key);
            if (n.m === here || NO_THROUGH.has(n.m)) continue;
            for (const x of byMap(n.m)) {
                if (!condOk(x.cond, x.m, x.id) || isBlocked(x)) continue;
                heap.push({ c: n.c + dist(n.x, n.y, x.x, x.y) + 3 + (x.br ? 10 : 0), first: n.first, m: x.to, x: x.tx, y: x.ty });
            }
        }
        return null;
    }
    FAB.planRoute = planRoute;
    // the route's length in tiles and its hops (from here, or from another map's exits: from = { m, x, y }) - the time of the way
    function routeInfo(target, from) {
        const here = from ? from.m : mapId();
        if (here === target) return { c: 0, hops: 0 };
        const heap = [], seen = new Set();
        const live = !from || from.m === mapId();
        const px = live ? P().x : from.x, py = live ? P().y : from.y;
        const starts = live ? liveExits().filter(x => !isBlocked(x)) : byMap(here).filter(x => condOk(x.cond, x.m, x.id) && !isBlocked(x));
        for (const x of starts) heap.push({ c: (px === undefined ? 15 : dist(px, py, x.x, x.y)) + 3 + (x.br ? 10 : 0), hops: 1, m: x.to, x: x.tx, y: x.ty });
        while (heap.length) {
            let k = 0;
            for (let i = 1; i < heap.length; i++) if (heap[i].c < heap[k].c) k = i;
            const n = heap.splice(k, 1)[0];
            if (n.m === target) return { c: n.c, hops: n.hops };
            const key = n.m + ":" + n.x + ":" + n.y;
            if (seen.has(key)) continue;
            seen.add(key);
            if (n.m === here || NO_THROUGH.has(n.m)) continue;
            for (const x of byMap(n.m)) {
                if (!condOk(x.cond, x.m, x.id) || isBlocked(x)) continue;
                heap.push({ c: n.c + dist(n.x, n.y, x.x, x.y) + 3 + (x.br ? 10 : 0), hops: n.hops + 1, m: x.to, x: x.tx, y: x.ty });
            }
        }
        return null;
    }
    // game hours of the way: tiles / the walking pace measured on his own walks (FAB.tph, tiles an hour of the game), + the doors
    FAB.tph = (old && old.tph) || FAB.tph || 150;
    function travelH(target, from) {
        const r = routeInfo(target, from);
        if (!r) return 3;
        return r.c / FAB.tph + r.hops * 0.03;
    }
    FAB.travelH = travelH;
    function* waitArrive(from, max = 900) {
        for (let n = 0; n < max; n++) {
            if (busy()) { yield* drive({ leave: true }); continue; }
            if (mapId() !== from && onMapReady()) { yield* L.wait(20); FAB.lastFrom = from; if (heroInWall()) yield* unwall(); else yield* unpocket(from); return true; }
            if (mapId() === from && onMapReady() && n > 40 && !P().isTransferring()) return false;
            yield;
        }
        return mapId() !== from;
    }
    function* takeExit(x) {
        const from = mapId();
        yield* combatOff();
        if (x.trig === 0) {   // a door on the action button (the loose brick...)
            yield* talkTo(x.id, { tiles: [[x.x, x.y]], picks: ["Zejść", "Wejść"], remote: true, tries: 3 });
        } else {
            const spot = yield* approach([[x.x, x.y]]);
            // (someone in the way for a moment - a resident by the door: a quarter of an hour, then again)
            if (!spot) { say("nie dojdę do przejścia " + x.name + " (" + x.x + "," + x.y + ")"); FAB.blocked[blockKey(x)] = now() + 0.25; return false; }
            for (let n = 0; n < 150 && mapId() === from && !P().isTransferring() && !busy(); n++) { L.setMove(L.keysToward(x.x - P()._realX, x.y - P()._realY)); yield; }
            L.setMove([]);
        }
        const ok = yield* waitArrive(from);
        if (!ok) { say("przejście nie puściło: " + (x.name || x.id) + " (" + mapName(from) + ")"); FAB.blocked[blockKey(x)] = now() + 2; }
        return ok;
    }
    // to another map over the real exits (each hop: the path to the exit, the step onto it, the new map)
    function* goMap(target, why) {
        const r0 = mapId() !== target ? routeInfo(target) : null, t0 = now(), f0 = FAB.rep.choices.length;
        for (let hop = 0; hop < 40; hop++) {
            if (mapId() === target) {
                const dt = now() - t0;
                if (r0 && r0.hops >= 2 && dt > 0.05 && dt < 5 && FAB.rep.choices.length === f0 && !inUnder()) {
                    const v = r0.c / dt;
                    if (v > 30 && v < 2000) FAB.tph = Math.round(FAB.tph * 0.7 + v * 0.3);
                }
                return true;
            }
            if (busy()) { yield* drive({ leave: true }); continue; }
            const r = planRoute(target);
            if (!r) { say("nie znam drogi z " + mapName(mapId()) + " do " + mapName(target)); note("unclear", { what: "brak drogi do " + mapName(target), why: why || FAB.why }); return false; }
            if (r.here) return true;
            say("idę: " + mapName(mapId()) + " → " + mapName(r.to) + " (cel: " + mapName(target) + ")");
            yield* takeExit(r);
        }
        return mapId() === target;
    }
    FAB.goMap = goMap;
    function* goTile(m, x, y, why) {
        if (!(yield* goMap(m, why))) return false;
        if (P().x === x && P().y === y) return true;
        return yield* L.walkTo(x, y);
    }

    // ------------------------------------------------------------------ życie: jedzenie, picie, sen
    function bagFoods() {
        const out = [];
        if (!window.FoodTable) return out;
        for (const it of $gameParty.items()) {
            if (!it || it.id === ROTTEN) continue;
            const r = FoodTable.get(it.id);
            if (!r || !r.eat || r.raw) continue;
            out.push({ id: it.id, fed: r.fed || 0, water: r.water || 0, stamina: r.stamina || 0, n: $gameParty.numItems(it) });
        }
        return out;
    }
    function* eatBest(thirsty) {
        const k = thirsty === "stamina" ? "stamina" : thirsty ? "water" : "fed";
        const list = bagFoods().filter(f => f[k] > 0).sort((a, b) => b[k] - a[k]);
        if (!list.length) return false;
        setDoing("Jem: " + $dataItems[list[0].id].name, k === "stamina" ? "siły" : thirsty ? "pragnienie" : "głód");
        return (yield* L.eat(list[0].id, 1)) > 0;
    }
    function wellLeft() {
        try {
            const rec = ((Farming.farm().rations) || {})["8:Studnia miejska"];
            const today = Farming.today ? Farming.today() : day();
            // (and his own count of attempts: a draw that gave nothing used to loop well <-> tavern for hours)
            const mine = FAB.well.day === day() ? FAB.well.n : 0;
            return Math.min(rec && rec.day === today ? Math.max(0, 2 - rec.n) : 2, Math.max(0, 2 - mine));
        } catch (e) { return FAB.well.day === day() ? Math.max(0, 2 - FAB.well.n) : 2; }
    }
    function* drinkWell() {
        setDoing("Piję ze studni miejskiej", "woda " + Math.round(needs().water) + " (2 nabrania dziennie)");
        if (!(yield* goMap(MAP.town, "woda"))) return false;
        const wells = $gameMap.events().filter(e => /<Studnia:/i.test((e.event() && e.event().note) || ""));
        if (!wells.length) { note("unclear", { what: "brak studni na mapie miasta" }); return false; }
        yield* combatOff();
        const spot = yield* approach(wells.map(e => [e.x, e.y]));
        if (!spot) return false;
        yield* L.press("ok");
        const ok = yield* L.choose("Napij się");
        yield* L.wait(20);
        yield* L.closeMenus();
        if (FAB.well.day !== day()) FAB.well = { day: day(), n: 0 };
        FAB.well.n++;
        say(ok ? "napił się ze studni (woda " + Math.round(needs().water) + ")" : "studnia nie dała wody");
        return ok;
    }
    function* takeSoup() {
        const before = count(SOUP);
        yield* talkTo(3, { tiles: [[9, 4]] });
        FAB.soupDay = day();
        say(count(SOUP) > before ? "kapuśniak w plecaku (" + count(SOUP) + ")" : "kocioł nie dał kapuśniaku");
        return true;
    }
    // (the night's hours do not count towards "stuck": the clock of no progress moves on by them - the morning's wait was the one
    // that tipped it over the 16 hours each day)
    function sleptOff(hrs) { if (hrs > 1 && hrs < 30 && FAB.lastKeyAt !== null) FAB.lastKeyAt += hrs; }
    function* sleepHome() {
        if (!(yield* goMap(MAP.house, "sen"))) return false;
        const d0 = day(), t0 = now();
        const r = yield* talkTo(22, { tiles: [[1, 4], [1, 5]], picks: ["Spać"] });
        for (let n = 0; n < 600 && !(SceneManager._scene instanceof Scene_Map && onMapReady()); n++) yield;
        yield* drive({});
        sleptOff(now() - t0);
        say("spał (dzień " + d0 + " → " + day() + ", " + clock() + ", wytrzymałość " + Math.round(stamina()) + ")");
        FAB.safeSave();
        return r.ok;
    }

    // ------------------------------------------------------------------ rozdział 1: działka, praca, zmiany, spłata
    const borgarCounter = () => ($gameMap.mapId() === MAP.tavern ? $gameMap.event(52) || (window.Story && Story.borgarEvent()) : null);
    function* toCounter() {
        if (!(yield* goMap(MAP.tavern, "Borgar"))) return false;
        return !!(yield* approach([[50, 29]]));
    }
    function shiftOpen() {
        const s = S();
        return s && s.flags.hired && s.shiftDay !== day() && FAB.shiftTried !== day() && hour() < 20.6 && stamina() >= 15;
    }
    function installShiftBot() {
        if (window.__fabShiftBot) { TavernShift.onTick = window.__fabShiftBot; return; }
        // (the bot of tests/tavern_shift_test.js, "good" mode: it presses the keys of the mini-game, nothing else)
        const bot = window.__bot = { mode: "good", t: 0, path: null, goal: "", last: null, still: 0, cardWait: 0 };
        const KEYS = ["ok", "up", "down", "left", "right", "shift", "escape", "cancel"];
        const dist2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
        const near = (a, b) => Math.abs(a.x - b.x) <= 3 && Math.abs(a.y - b.y) <= 3;
        const nearest = (h, list) => list.reduce((best, p) => (!best || dist2(h, p) < dist2(h, best) ? p : best), null);
        function stand(key, h, list) {
            const c = bot.stick && bot.stick.key === key && list.find(p => p.x === bot.stick.p.x && p.y === bot.stick.p.y);
            if (c) return c;
            const p = nearest(h, list);
            bot.stick = { key, p };
            return p;
        }
        function steer(I, h, goal) {
            const key = Math.round(goal.x) + "," + Math.round(goal.y);
            if (bot.goal !== key || !bot.path) { bot.goal = key; bot.path = TavernShift.path(h.x, h.y, goal.x, goal.y) || [goal]; }
            while (bot.path.length && near(bot.path[0], h)) bot.path.shift();
            if (near(goal, h)) return true;
            const p = bot.path[0] || goal, dx = p.x - h.x, dy = p.y - h.y;
            if (Math.abs(dx) > 3) I[dx > 0 ? "right" : "left"] = true;
            if (Math.abs(dy) > 3) I[dy > 0 ? "down" : "up"] = true;
            I.shift = true;
            if (bot.last && dist2(bot.last, h) < 0.5) { if (++bot.still > 20) { bot.path = null; bot.still = 0; } } else bot.still = 0;
            bot.last = { x: h.x, y: h.y };
            return false;
        }
        function clean(I, d) {
            const h = d.hero;
            let goal = null, kind = null;
            if (d.carry === "log") { goal = stand("fire", h, d.fire); kind = "fire"; }
            else if (d.carry === "trash") { goal = d.door; kind = "door"; }
            else {
                const opts = [];
                d.tables.forEach(tb => { if (tb.dirty > 0) opts.push({ kind: "wipe", key: "table" + tb.i, list: tb.stands }); });
                if (d.wood.done < d.wood.need) opts.push({ kind: "log", key: "pile", list: d.pile });
                d.sacks.forEach((s, i) => { if (s.state === "lying") opts.push({ kind: "sack", key: "sack" + i, list: s.stands }); });
                if (!opts.length) return;
                const o = opts.find(x => bot.stick && x.key === bot.stick.key) || opts.reduce((best, x) => (!best || dist2(h, nearest(h, x.list)) < dist2(h, nearest(h, best.list)) ? x : best), null);
                goal = stand(o.key, h, o.list); kind = o.kind;
            }
            if (steer(I, h, goal)) {
                if (kind === "wipe") { if (d.target === "wipe") I.ok = true; }
                else if (d.target === kind && bot.t % 2 === 0) I.ok = true;
            }
        }
        function beer(I, d) {
            if (d.phase === "ready") { if (bot.t % 2 === 0) I.ok = true; }
            else if (d.phase === "pour") { if (d.after < d.line - 0.003) I.ok = true; }
        }
        function kitchen(I, d) {
            d.notes.forEach(n => { if (!n.res && n.t === d.t) I[n.key] = true; });
        }
        function serve(I, d) {
            const h = d.hero, waiting = d.guests.filter(g => g.state === "wait").sort((a, b) => a.patience - b.patience);
            let goal = null, kind = null;
            if (d.hands[0] === "log") { goal = stand("fire", h, d.fireStand); kind = "fire"; }
            else {
                const servable = waiting.filter(g => g.want.some(k => d.hands.includes(k)));
                const needed = [];
                for (const g of waiting) for (const k of g.want) needed.push(k);
                for (const k of d.hands) { const i = needed.indexOf(k); if (i >= 0) needed.splice(i, 1); }
                const useless = d.hands.length && !servable.length;
                const nearBar = h.y < 190;
                if (useless) { goal = d.tray; kind = "tray"; }
                else if (d.fire < 0.7 && !d.hands.length) { goal = stand("pile", h, d.pile); kind = "log"; }
                else if (needed.length && d.hands.length < 2 && (d.hands.length === 0 || nearBar)) { goal = d.spots.find(s => s.key === needed[0]).stand; kind = "spot"; }
                else if (servable.length) { goal = stand("guest" + servable[0].id, h, servable[0].stands); kind = "guest"; }
                else if (d.fire < 1.5 && !d.hands.length) { goal = stand("pile", h, d.pile); kind = "log"; }
                else {
                    const dirty = d.tables.filter(t => t.dirty > 0 && !t.busy);
                    const tb = dirty.find(t => bot.stick && bot.stick.key === "table" + t.i) || dirty[0];
                    if (tb) { goal = stand("table" + tb.i, h, tb.stands); kind = "wipe"; }
                    else { goal = d.spots[1].stand; kind = "idle"; }
                }
            }
            if (steer(I, h, goal)) {
                if (kind === "wipe") { if (d.target === "wipe") I.ok = true; }
                else if (kind !== "idle" && d.target === kind && bot.t % 2 === 0) I.ok = true;
            }
        }
        window.__fabShiftBot = TavernShift.onTick = function() {
            const I = Input._currentState;
            for (const k of KEYS) I[k] = false;
            bot.t++;
            const st = TavernShift.state();
            if (!st) return;
            const where = st.phase + "|" + st.card + "|" + st.part;
            if (where !== bot.where) { bot.where = where; bot.cardWait = 0; }
            if (st.phase === "card" || st.phase === "banner" || st.phase === "summary") {
                if (++bot.cardWait > 30 && bot.t % 2 === 0) I.ok = true;
                return;
            }
            bot.cardWait = 0;
            if (st.phase !== "play" || !st.data) return;
            const d = st.data;
            if (st.part === "clean") clean(I, d);
            else if (st.part === "beer") beer(I, d);
            else if (st.part === "kitchen") kitchen(I, d);
            else if (st.part === "serve") serve(I, d);
        };
    }
    function* doShift() {
        if (!(yield* toCounter())) return false;
        const sd = S();
        const shiftWhy = sd && (sd.done || sd.paid >= sd.debt) ? "zarobek na jedzenie, ekwipunek i naprawy (dług spłacony)" : "Rozdział 1: dług " + debtLine();
        if (hour() < 16) {
            setDoing("Czekam w tawernie na zmianę (od 16:00)", shiftWhy);
            while (hour() < 16 && hour() > 6) { yield* idle(300); if (needUrgent()) return true; }
        }
        setDoing("Biorę zmianę u Borgara", shiftWhy);
        installShiftBot();
        const g0 = gold(), n0 = (TavernShift.stats() || {}).done || 0;
        const r = yield* talkTo(borgarCounter, { tiles: [[50, 29]], picks: ["Weź zmianę"], leave: true });
        const n1 = (TavernShift.stats() || {}).done || 0;
        FAB.shiftTried = day();
        if (n1 > n0) {
            const last = FAB.rep.shifts[FAB.rep.shifts.length - 1];
            say("zmiana zagrana: +" + (gold() - g0) + " G" + (last ? " (ocena " + last.grade + ", napiwki " + last.tips + ")" : ""));
        } else say("zmiany nie było: " + r.text.slice(-140));
        return true;
    }
    function debtLine() { const s = S(); return s ? Math.min(s.paid, s.debt) + "/" + s.debt + " G" : "-"; }
    function lordEvent() {
        if (mapId() !== MAP.manor) return null;
        const l = $gameMap.event(902);
        const lordHere = hour() >= 8 && hour() < 20;
        if (l && lordHere && l.page() && !l.isTransparent()) return l;
        return (window.Story && Story.doorEvent && Story.doorEvent()) || $gameMap.event(1);
    }
    function payPick() {
        const s = S(), left = s.debt - s.paid, g = gold();
        if (g >= left) return "Spłać cały dług";
        if (g > 500 + KEEP) return "Oddaj 500 G";
        if (g > 100 + KEEP) return "Oddaj 100 G";
        return null;
    }
    function* payDebt() {
        if (!(yield* goMap(MAP.manor, "spłata"))) return false;
        for (let k = 0; k < 8; k++) {
            const pick = payPick();
            if (!pick) break;
            const s = S(), p0 = s.paid;
            const r = yield* talkTo(lordEvent, { picks: [pick], leave: true, strict: true });
            if (S().paid > p0) say("spłata: " + (S().paid - p0) + " G (razem " + debtLine() + ")");
            else { say("spłata nie przeszła: " + r.text.slice(-160)); break; }
            if (S().done || S().paid >= S().debt) break;
        }
        FAB.payTried = day();
        return true;
    }

    // ------------------------------------------------------------------ etap 2: W4 „Krew kasztelana” (klucz, krata) i praca na działce
    function qrec(id) { try { return window.TownQuests && TownQuests.rec ? TownQuests.rec(id) : null; } catch (e) { return null; } }
    // the step of a town quest: -1 not begun, its index while active, 99 done
    function qstep(id) { const r = qrec(id); return !r ? -1 : r.s === "active" ? r.step : r.s === "done" ? 99 : -1; }
    const qflags = () => { try { return TownQuests.state().flags || {}; } catch (e) { return {}; } };
    // a generator stepped until `until()` says stop (then ended: its finally blocks run, the keys let go)
    function* timeboxed(gen, until) {
        for (;;) {
            if (until()) { try { gen.return(); } catch (e) {} L.releaseAll(); yield* L.closeMenus(); return "czas"; }
            const r = gen.next();
            if (r.done) return r.value;
            yield r.value;
        }
    }
    // the field (Map003, inside grandpa's wall): ap.js's plan entries by name, in its order - what a player builds there to make the
    // tools and the forge (only what the story's step needs)
    const PLAN_SPADE = ["Młotek", "Warsztat", "Kamienna siekiera", "Leśne legowisko", "Kamienna łopata"];
    const PLAN_IRON = PLAN_SPADE.concat(["Piec ziemny", "Kamienny kilof", "Tartak", "Cegielnia", "Kuźnia"]);
    function* fieldWork(names, until, why, extra) {
        if (!(yield* goMap(MAP.field, why))) return false;
        if (AP.day !== day()) { AP.day = day(); AP.PLAN.forEach(g => { g.fails = 0; }); }
        const inner = (function* () {
            for (let r = 0; r < 400; r++) {
                // (the plan is for the field: gathering by the edge took him over it once - Krawedzie - and the meadow is no place to build)
                if (mapId() !== MAP.field) { say("poza działką (" + mapName(mapId()) + ") - wracam"); if (!(yield* goMap(MAP.field, why))) return false; }
                yield* AP.TASKS.reflexes();
                if (now() - (FAB.failReset || 0) >= 2) { FAB.failReset = now(); AP.PLAN.forEach(g => { g.fails = 0; }); }   // (a job done meanwhile: try again)
                const g = AP.PLAN.find(g => names.includes(g.n) && !g.done() && (g.fails || 0) < 3);
                if (!g) {
                    if (extra) { const v = yield* extra(); if (v === "dalej") continue; return v; }
                    return true;
                }
                setDoing("Na działce: " + g.n, why);
                if (!(yield* AP.TASKS.obtain(g.need))) { g.fails = (g.fails || 0) + 1; say("brakuje na: " + g.n); yield* L.wait(30); continue; }
                const ok = yield* g.run();
                if (!ok && !g.done()) { g.fails = (g.fails || 0) + 1; say("nie wyszło: " + g.n); }
                else say("gotowe na działce: " + g.n);
            }
            return false;
        })();
        return yield* timeboxed(inner, until);
    }
    // ------------------------------------------------------------------ wolny czas (uwaga gracza 2026-10-29: „bohater niepotrzebnie CZEKA”)
    // Do terminu (zmiana o 16:00, kapuśniak od 8:00) zostało więcej niż droga + zapas: robi coś pożytecznego, co się zmieści - wg tego,
    // czego mu najbardziej trzeba - i wraca na czas (droga liczona z grafu map i jego własnego tempa marszu, FAB.tph).
    const fmtH = x => { const m = Math.max(0, Math.round(x * 60)); return m >= 60 ? Math.floor(m / 60) + " h" + (m % 60 >= 10 ? " " + (m % 60) + " min" : "") : m + " min"; };
    const foodStock = () => bagFoods().reduce((a, f) => a + f.fed * f.n, 0);
    const ripeCrops = () => { try { const pl = (Farming.farm().plots || {})[MAP.field] || {}; return Object.keys(pl).some(k => { const [x, y] = k.split(",").map(Number); return pl[k] && pl[k].crop && Farming.isRipe(x, y, pl[k]); }); } catch (e) { return false; } };
    const barren = (m, job) => FAB.barren && FAB.barren[m + ":" + job] === day();
    const setBarren = (m, job) => { (FAB.barren = FAB.barren || {})[m + ":" + job] = day(); };
    // the jobs, by need: [name for the bar, where (field = only on grandpa's field), wanted now?, the work (a generator - stopped by the clock)]
    function freeJobs() {
        const s = S() || {}, deepNow = UG() ? UG().deepest() : 0;
        const fieldOk = !!(s.flags && s.flags.field);
        return [
            { id: "food", name: "zbieram jedzenie (jagody, grzyby, dzikie warzywa)", where: "any", want: () => foodStock() < 150, run: function* () {
                for (let k = 0; k < 12; k++) { const got = yield* AP.TASKS.forage(3); if (!got) { setBarren(mapId(), "food"); return true; } }
                return true;
            } },
            { id: "bandage", name: "zbieram zioła, krwawnik i włókno - opatrunki na podziemia", where: "field", want: () => FAB.done1 && deepNow < UNDER_GOAL && count(152) < 4 && !FAB.bandageGaveUp, run: function* () {
                for (let k = 0; k < 6 && count(152) < 4; k++) {
                    for (const [id, kind] of [[104, "herb"], [150, "yarrow"], [92, "fiber"]]) if (count(id) < 2) yield* AP.TASKS.gather([kind], 2 - count(id));
                    if (count(104) >= 2 && count(150) >= 2 && count(92) >= 2) yield* AP.TASKS.handCraft("Zrób opatrunek"); else { setBarren(mapId(), "bandage"); return true; }
                }
                return true;
            } },
            { id: "crops", name: "zbieram plony z grządek", where: "field", want: () => ripeCrops(), run: () => AP.TASKS.harvestCrops() },
            // (the tools and the forge W4 needs - what a player builds on the field in the free hours; later W4 does not wait for them)
            { id: "build", name: "buduję na działce (" + ((AP.PLAN || []).find(g => PLAN_IRON.includes(g.n) && !g.done()) || {}).n + ")", where: "field",
                want: () => fieldOk && (AP.PLAN || []).some(g => PLAN_IRON.includes(g.n) && !g.done() && (g.fails || 0) < 3), run: () => fieldWork(PLAN_IRON, () => false, "wolny czas: narzędzia i kuźnia na W4") },
            { id: "sow", name: "sieję na grządkach", where: "field", want: () => count(65) > 0 && count(66) > 0 && stamina() > 40, run: () => AP.TASKS.plantSeeds() },
            { id: "mats", name: "zbieram gałęzie, kamienie i włókno (na narzędzia i naprawy)", where: "any", want: () => count(77) < 20 || count(64) < 20 || count(92) < 20, run: function* () {
                const got = yield* AP.TASKS.collect({ 77: 20, 64: 20, 92: 20 }, 30);
                if (!got) setBarren(mapId(), "mats");
                return true;
            } }
        ];
    }
    // a plan for the free time before `deadline` (an hour of today) at map `target`, or null (too little time / nothing to do)
    function freeTimePlan(deadline, target, label, minOnSite) {
        const h = hour(), margin = 0.3, minSite = minOnSite || 0.5;
        if (stamina() < 40 || needUrgent() || inUnder()) return null;
        if (deadline - h - travelH(target) - margin < minSite) return null;
        const jobs = freeJobs().filter(j => j.want());
        if (!jobs.length) return null;
        const places = [...new Set([mapId(), MAP.field, MAP.yard, 23, 22, 21])]   // (+ Skraj lasu, Polna droga, Leśna droga: the wild things by the way).filter(m => !inUnder() && m !== MAP.house && m !== MAP.tavern && m !== MAP.town && m !== MAP.manor);
        let best = null;
        for (const j of jobs) {
            for (const m of places) {
                if (j.where === "field" && m !== MAP.field) continue;
                if (barren(m, j.id)) continue;
                const go = m === mapId() ? 0 : travelH(m), back = travelH(target, { m });
                const onSite = deadline - margin - h - go - back;
                if (onSite < minSite) continue;
                if (!best || onSite > best.onSite + 0.25) best = { j, m, onSite, back };
            }
            if (best) break;   // (the first job by need that fits somewhere)
        }
        if (!best) return null;
        const { j, m, back } = best;
        const leaveAt = day() * 24 + deadline - margin - back;
        const what = label + " " + fmtH(deadline - h) + " - w tym czasie: " + j.name + (m !== mapId() ? " (" + mapName(m) + ")" : "");
        return { what, why: "wolny czas do " + h2s(deadline) + " (droga z powrotem ~" + fmtH(back) + ", wyjdę o " + h2s(deadline - margin - back) + ")", run: function* () {
            const t0 = now();
            FAB.freePrefix = { label, deadline };
            try {
                if (m !== mapId() && !(yield* goMap(m, "wolny czas"))) return false;
                const until = () => now() >= leaveAt || needUrgent() || stamina() < 35;
                yield* timeboxed(j.run(), until);
                if (now() - t0 < 0.08 && mapId() === m) setBarren(m, j.id);   // (ended at once: nothing of it here today)
            } finally { FAB.freePrefix = null; L.releaseAll(); }
            const used = Math.round((now() - t0) * 60);
            note("free", { job: j.name, place: mapName(m), min: used, until: label });
            return true;
        } };
    }
    const h2s = x => { const H = Math.floor(x), M = Math.round((x - H) * 60); return H + ":" + String(M).padStart(2, "0"); };
    // when to set off to the evening shift (arriving about a quarter before 16:00)
    const shiftLeave = () => 16 - travelH(MAP.tavern) - 0.3;
    const hasBedroll = () => { try { return ((Farming.farm().buildings || {})[MAP.field] || []).some(b => b && (b.type === "bedroll" || b.type === "tent") && !b.site); } catch (e) { return false; } };
    function* sleepField() {
        const t0 = now();
        const ok = yield* AP.TASKS.sleep();
        sleptOff(now() - t0);
        if (!ok) return yield* sleepHome();
        return ok;
    }
    function* borgarTalk(picks) {
        if (!(yield* toCounter())) return false;
        return yield* talkTo(borgarCounter, { tiles: [[50, 29]], picks, leave: true });
    }
    const tadek = () => (window.TownLife && TownLife.eventOf ? TownLife.eventOf("kowal") : null);
    function* talkTadek(why) {
        if (!(yield* goMap(MAP.town, why))) return false;
        for (let k = 0; k < 3; k++) {
            const e = tadek();
            if (!e || e.isTransparent() || (e._town && e._town.hidden)) { setDoing("Czekam na Tadka", why); yield* idle(300); continue; }
            const r = yield* talkTo(tadek, { leave: true });
            if (r.ok) return r;
        }
        return null;
    }
    // a thread of the town (W...) is not followed by itself: a player pins it in the journal (J, Zadania, O) - the same here, said in the log
    function pinQuest(id) {
        try {
            const st = TownQuests.state();
            if (st.track === id) return;
            TownQuests.track(id);
            say("przypinam w dzienniku: " + id + " (jak gracz: J → Zadania → O)");
            note("notes", { what: "przypięty w dzienniku: " + id });
        } catch (e) { /* (no journal pin) */ }
    }
    function w4Plan(st) {
        const h = hour(), why = "W4 Krew kasztelana: " + (["Borgar i stare kamienie", "kopiec z krukiem (łopata)", "połówki do Tadka (żelazo, węgiel)", "odbiór klucza od Tadka", "krata w piwnicy", "powiedz Borgarowi"][st] || "krok " + st);
        if (st === 0) return { what: "Pytam Borgara o stare kamienie pod tawerną", why, run: function* () { checkGoal("w4_0", MAP.tavern); yield* borgarTalk(["Zapytaj o stare kamienie"]); } };
        if (st === 1) {
            if (!count(62)) return { what: "Robię kamienną łopatę na działce", why, run: function* () {
                checkGoal("w4_1", MAP.yard);
                yield* fieldWork(PLAN_SPADE, () => count(62) > 0 || hour() >= 20.5 || hour() < 5.5, why);
            } };
            return { what: "Kopię pod kopcem z krukiem (podwórze dziadka)", why, run: function* () {
                if (!(yield* goMap(MAP.yard, why))) return false;
                yield* talkTo(() => $gameMap.event(951) || null, { tiles: [[8, 6]], leave: true });
                return true;
            } };
        }
        if (st === 2) {
            if (count(86) < 1 || count(79) < 2) return { what: "Robię żelazo i węgiel na działce (kuźnia)", why: why + " - żelaza nie ma w sklepach, jest z rudy w kuźni", run: function* () {
                checkGoal("w4_2", MAP.town);
                yield* fieldWork(PLAN_IRON, () => (count(86) >= 1 && count(79) >= 2) || hour() >= 20.5 || hour() < 5.5, why, function* () {
                    const coal = Math.min(4, 2 + (count(86) < 1 ? 2 : 0));
                    if (count(79) < coal) { setDoing("Na działce: węgiel drzewny (piec ziemny)", why); if (yield* AP.TASKS.obtain({ 79: coal })) return "dalej"; }
                    if (count(86) < 1) { setDoing("Na działce: wytop żelaza (kuźnia)", why); if (yield* AP.TASKS.obtain({ 86: 1 })) return "dalej"; }
                    if (count(86) >= 1 && count(79) >= 2) return true;
                    setDoing("Na działce: czekam na piec / kuźnię", why);
                    yield* idle(600);   // (a job in the kiln or the forge: waiting by it)
                    return "dalej";
                });
            } };
            if (h >= 5.5 && h < 16.5) return { what: "Niosę połówki klucza, żelazo i węgiel Tadkowi", why, run: () => talkTadek(why) };
            return null;
        }
        if (st === 3) {
            const fd = ((qrec("W4") || {}).t || {}).forgeDay || 0;
            if (day() < fd) return { what: "Tadek łączy połówki - klucz jutro rano", why, run: () => idle(900) };
            if (h >= 5.5 && h < 16.5) return { what: "Odbieram klucz kasztelana od Tadka", why, run: () => talkTadek(why) };
            return null;
        }
        if (st === 4) {
            if ($gameVariables.value(1) < 1) {
                if (!FAB.brickTried) return { what: "Szukam luźnej cegły w tawernie", why, run: function* () {
                    if (!(yield* goMap(MAP.tavern, why))) return false;
                    const r = yield* talkTo(9, { tiles: [[9, 4]], picks: ["Zejść"], leave: true, remote: true, tries: 3 });
                    FAB.brickTried = true;
                    if (mapId() === MAP.tavern) note("unclear", { what: "krok W4 „Zejdź do piwnicy tawerny (za luźną cegłą)”: cegła nie otwiera się, dopóki Borgar w „Pogadaj” nie usłyszy „Zapytaj wprost o zamek” - krok o tym nie mówi", why });
                    return r.ok;
                } };
                return { what: "Pytam Borgara wprost o zamek (Pogadaj)", why, run: () => borgarTalk(["Pogadaj", "Zapytaj wprost o zamek"]) };
            }
            return { what: "Schodzę do piwnicy i otwieram kratę kluczem", why, run: function* () {
                if (!(yield* goMap(MAP.cellar, why))) return false;
                yield* talkTo(7, { tiles: [[15, 2]], leave: true });
                return true;
            } };
        }
        if (st === 5) return { what: "Mówię Borgarowi o otwartej kracie", why, run: () => borgarTalk(["Krata w piwnicy"]) };
        return null;
    }

    // ------------------------------------------------------------------ walka (stwory podziemi, ludzie Aktu III): tryb walki, cios, blok, unik
    // (a foe he cannot get at - below a wall he stands on, across a gap - is left alone for a while: FAB.ignored, frames)
    FAB.ignored = new Map();
    const ignoredNow = a => (FAB.ignored.get(a) || 0) > AP.frame;
    const foesNear = r => { try { return (Combat.feel && Combat.feel.threats ? Combat.feel.threats() : []).filter(t => t.d <= r && t.a && !t.a._dead && !ignoredNow(t.a)); } catch (e) { return []; } };
    const hpRatio = () => { const a = $gameParty.leader(); return a && a.mhp ? a.hp / a.mhp : 1; };
    function* combatOn() {
        if (window.Combat && Combat.combatMode && !Combat.combatMode()) { yield* L.press("tab"); yield* L.wait(4); }
    }
    // one fight: the nearest foe; a blow coming - the guard (P) for a plain one at the parry moment, a roll across it (Space) for a heavy
    // one; else close in and strike (O). Ends when no foe is near (or after `max` frames).
    function* fightFoes(max, why) {
        const t0 = AP.frame;
        let foe = null, hits = 0, foeT = 0, best = 99, bestT = 0, hp0 = 0;
        yield* combatOn();
        while (AP.frame - t0 < (max || 60 * 90)) {
            const th = foesNear(8);
            if (!th.length) break;
            const t = th[0], a = t.a;
            if (a !== foe) { foe = a; foeT = AP.frame; best = 99; bestT = AP.frame; hp0 = a._hp; setDoing("Walczę: " + (a.kindName ? a.kindName() : a.kind ? a.kind() : a._kind || "wróg"), why || FAB.why); }
            // (no closer and no blow landed for 8 s: out of reach - left alone for a minute of the game)
            if (t.d < best - 0.2) { best = t.d; bestT = AP.frame; }
            if (a._hp < hp0) { hp0 = a._hp; bestT = AP.frame; }
            if (AP.frame - bestT > 60 * 8) { FAB.ignored.set(a, AP.frame + 60 * 60); say("nie dosięgnę: " + (a.kind ? a.kind() : a._kind || "wróg") + " - zostawiam"); foe = null; continue; }
            // (little life and no bandage: out of the fight - the plan runs up the stairs)
            if (hpRatio() < 0.25 && count(152) === 0 && inUnder()) { say("mało życia - wycofuję się"); break; }
            let reach = 1.15;
            try { const w = Combat.weaponNow(Combat.handMelee()); if (w && w.reach) reach = w.reach; } catch (e) { /* (fists) */ }
            const coming = th.filter(x => x.tell && x.d < 3.6).sort((p, q) => p.tell.t - q.tell.t)[0];
            if (coming && coming.tell.t <= 10) {
                const cx = coming.a.centerX() - (P()._realX + 0.5), cy = coming.a.centerY() - (P()._realY + 0.5);
                if (coming.tell.heavy || coming.d < 1.4) {
                    // a roll away from the blow - across and back (the arrows one frame before Space: Combat reads them a frame late)
                    const L2 = Math.hypot(cx, cy) || 1;
                    L.setMove(L.keysToward(-cx / L2 - cy / L2 * 0.7, -cy / L2 + cx / L2 * 0.7)); yield;
                    L.key("dodge", true); yield; yield; L.key("dodge", false); L.setMove([]);
                    yield* L.wait(8);
                } else {
                    // farther off: a step back out of its reach, the spear's reach is longer
                    for (let n = 0; n < 8; n++) { L.setMove(L.keysToward(-cx, -cy)); yield; }
                    L.setMove([]);
                }
                continue;
            }
            const dx = a.centerX() - (P()._realX + 0.5), dy = a.centerY() - (P()._realY + 0.5), d = Math.hypot(dx, dy);
            // (the weapon's reach: the spear strikes from over two tiles - pushing into a foe that blocks the way never closes the gap)
            if (d > Math.max(0.9, reach - 0.3)) { L.setMove(L.keysToward(dx, dy)); yield; continue; }
            // (facing it: the arrows toward it for a frame - 8 directions - then the blow)
            L.setMove(L.keysToward(dx, dy)); yield;
            L.setMove([]);
            P().setDirection(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 6 : 4) : (dy > 0 ? 2 : 8));
            // (a plated foe - the empty armour - or a boss: a light blow from the front only rings; a heavy one - O held - while it recovers
            // from its own blow, else a light one)
            const kind = a._kind || (a.kind && a.kind()) || "", plated = kind === "zbroja" || !!a._boss;
            // (a losing fight with the empty armour: under 40% of life while it still has more than a third - away up the stairs, as a
            // player would; the guardian and the bosses are fought to the end - their own plans)
            if (plated && !a._boss && inUnder() && hpRatio() < 0.4 && a._maxHp && a._hp > a._maxHp * 0.35) {
                FAB.fleeAt = AP.frame; say("zbroja za mocna (życie " + Math.round(hpRatio() * 100) + "%) - uciekam w górę"); note("prep", { what: "ucieczka przed zbroją na piętrze " + floorNow() + " (życie " + Math.round(hpRatio() * 100) + "%, zbroja " + Math.round(a._hp / a._maxHp * 100) + "%)" });
                break;
            }
            if (plated && ["recover", "stagger", "lie", "down", "stun"].includes(a._mode || "")) {
                L.key("shoot", true);
                for (let n = 0; n < 26; n++) { const c = foesNear(4).find(x => x.a === a); if (c && c.tell && c.tell.t < 8) break; yield; }
                L.key("shoot", false); yield; yield;
            } else if (!plated || d > 1.3) { L.key("shoot", true); yield; yield; L.key("shoot", false); yield; yield; }
            else yield* L.wait(4);
            hits++;
            // (a bandage - H in the combat mode - when life is low; it takes a moment in which he is open: not with a blow on the way)
            if (hpRatio() < 0.35 && $gameParty.numItems($dataItems[152]) > 0 && !foesNear(3).some(x => x.tell && x.tell.t < 40)) { L.key("heal", true); yield; yield; L.key("heal", false); yield* L.wait(40); }
        }
        L.releaseAll();
        return hits;
    }
    FAB.fightFoes = fightFoes;

    // ------------------------------------------------------------------ podziemia: piętro po piętrze (labirynt po mgle - jak gracz z minimapą)
    const UG = () => window.Underground;
    const floorNow = () => { const u = UG(); return u && u.floorOf ? u.floorOf(mapId()) : 0; };
    const inUnder = () => { const u = UG(); return !!(u && u.isUnderground && u.isUnderground(mapId())); };
    const stairsDown = () => $gameMap.events().filter(e => e && !e._erased && /^(Schody w dół|Wielkie schody w dół)/.test((e.event() && e.event().name) || ""));
    // the tiles he has seen on this generated floor (the game's own fog - what the minimap shows); null: a floor without fog (handmade)
    function seenFn() { const u = UG(); const f = u && u.fog ? u.fog(mapId()) : null; return f ? f.seen : null; }
    // takes stairs (a touch event standing in a wall's face): from the tile below it, pushing up
    function* takeStairs(e) {
        const from = mapId();
        const sp = yield* approach([[e.x, e.y]]);
        if (!sp) return false;
        for (let n = 0; n < 120 && mapId() === from && !P().isTransferring() && !busy(); n++) { L.setMove(L.keysToward(e.x - P()._realX, e.y - P()._realY)); yield; }
        L.setMove([]);
        if (busy()) yield* drive({ leave: true });
        return yield* waitArrive(from);
    }
    // the nearest seen open tile next to an unseen one, by a path over the seen tiles only; walks a piece of that path
    function* exploreStep(seen) {
        if (yield* exploreStepBy(seen, false)) return true;
        return yield* exploreStepBy(seen, true);   // (FreeMovement's looser rule: only when the tiles' own rule finds nothing)
    }
    function* exploreStepBy(seen, loose) {
        const p = P(), W = $gameMap.width(), H = $gameMap.height(), start = p.y * W + p.x;
        const prev = new Int32Array(W * H).fill(-2), q = [start];
        prev[start] = -1;
        let goal = -1;
        for (let qi = 0; qi < q.length && goal < 0; qi++) {
            const i = q[qi], x = i % W, y = (i / W) | 0;
            for (const [d, dx, dy] of [[2, 0, 1], [8, 0, -1], [4, -1, 0], [6, 1, 0]]) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
                const j = ny * W + nx;
                if (prev[j] !== -2) continue;
                if (!seen(nx, ny)) { goal = i; break; }
                // (the map's own walls only - a creature asleep in a corridor is no wall, it is fought or it moves; loose: FreeMovement's
                // rule since 2026-10-29 - a tile is entered by its edge towards the feet, 10 - d, as the engine's grid)
                if (loose ? !$gameMap.isPassable(nx, ny, 10 - d) : !($gameMap.isPassable(x, y, d) && $gameMap.isPassable(nx, ny, 10 - d))) continue;
                // (a barrel, a chest, a crate - the map's own things in the way - do block; the creatures are no events of the map)
                if ($gameMap.eventsXyNt(nx, ny).some(e => e.isNormalPriority() && !e.isThrough())) continue;
                prev[j] = i; q.push(j);
            }
        }
        if (goal < 0 || goal === start) return false;
        const path = [];
        for (let i = goal; i !== -1; i = prev[i]) path.unshift([i % W, (i / W) | 0]);
        const segs = L.segments(path.slice(0, 30));
        for (const s of segs) {
            if (foesNear(5).length) break;
            if (!(yield* L.followSeg(s))) break;
        }
        L.setMove([]);
        return true;
    }
    // one floor down: the stairs if seen, else exploring; foes fought on the way
    function* floorDown(why) {
        const f0 = floorNow(), m0 = mapId();
        for (let k = 0; k < 600 && mapId() === m0; k++) {
            if (busy()) { yield* drive({ leave: true }); continue; }
            if (foesNear(7).length) { yield* fightFoes(60 * 60, why); if (FAB.fleeAt && AP.frame - FAB.fleeAt < 120) return "ucieczka"; continue; }
            if (hpRatio() < 0.5 && !foesNear(8).length) return "słabo";
            const seen = seenFn();
            const st = stairsDown().filter(e => !seen || seen(e.x, e.y) || seen(e.x, e.y + 1));
            if (st.length) { setDoing("Schodzę niżej (piętro " + (f0 + 1) + ")", why); if (yield* takeStairs(st[0])) return true; yield* L.wait(30); continue; }
            if (!seen) { const all = stairsDown(); if (all.length) { if (yield* takeStairs(all[0])) return true; } return false; }
            setDoing("Szukam schodów w dół (piętro " + f0 + ")", why);
            if (!(yield* exploreStep(seen))) { say("nie widzę, dokąd iść na piętrze " + f0); return false; }
            if (k % 20 === 0) AP.saidAt = AP.frame;
        }
        return mapId() !== m0;
    }
    FAB.floorDown = floorDown;
    const evNamed = re => $gameMap.events().find(e => e && !e._erased && re.test((e.event() && e.event().name) || "")) || null;
    const liftStops = () => { try { return UG().liftStops(); } catch (e) { return []; } };
    const bossCleared = f => { try { return UG().bossCleared(f); } catch (e) { return true; } };
    const UNDER_GOAL = 50;   // Akt III: piętro 50 uzbraja napad na tawernę
    const WEAPONS = [331, 317, 326, 312, 154];   // żelazna włócznia, buzdygan, kamienny młot, dębowy kostur, oszczep
    const bestWeapon = () => WEAPONS.find(id => count(id) > 0) || 0;
    function equipBest() {
        const w = bestWeapon();
        if (!w || !window.Combat || !Combat.setHand || !Combat.handMelee) return;
        if (Combat.handMelee() === w) return;
        try { if (Combat.setHand("m" + w)) { say("bierze do ręki: " + $dataItems[w].name + " (jak w oknie Ekwipunek)"); note("notes", { what: "broń w ręce: " + $dataItems[w].name }); } } catch (e) { /* (no such hand) */ }
    }
    function underPlan(goalFloor, why) {
        const u = UG(), deep = u ? u.deepest() : 0;
        // (the Ruins are underground too: the lift first - from floor 10 on it takes him down past the floors he has walked)
        if (mapId() === 10) {
            // (wounded, worn out or dry in the Ruins: up to the cellar and home first, never down the lift like that)
            if (hpRatio() < 0.6 || stamina() < 25 || needs().water < 30) return { what: "Z Ruin wracam na górę (życie " + Math.round(hpRatio() * 100) + "%, siły " + Math.round(stamina()) + ", woda " + Math.round(needs().water) + ")", why, run: function* () {
                if (!(yield* goMap(MAP.tavern, why))) return false;
                if (hpRatio() < 0.6 || stamina() < 25) yield* sleepHome();
                return true;
            } };
            const stops = liftStops().filter(s => s <= goalFloor);
            const best = stops.length ? Math.max(...stops) : 0;
            if (best > 0 && best > (FAB.liftRodeFrom || 0) - 1) return { what: "Zjeżdżam windą na piętro " + best, why, run: function* () {
                const cageEv = evNamed(/^Winda/);
                if (!cageEv) return false;
                const r = yield* talkTo(cageEv.eventId(), { picks: ["Piętro " + best], leave: true });
                yield* waitArrive(10);
                return r.ok;
            } };
            return { what: "Schodzę Wielkimi schodami (piętro 1)", why, run: function* () {
                const st = stairsDown();
                if (!st.length) return false;
                return yield* takeStairs(st[0]);
            } };
        }
        if (inUnder()) {
            const f = floorNow();
            if (FAB.fleeAt && AP.frame - FAB.fleeAt < 60 * 60) return { what: "Uciekam przed zbroją po schodach w górę (życie " + Math.round(hpRatio() * 100) + "%)", why, run: function* () {
                FAB.fleeAt = 0; yield* goUp(why, true); yield* sleepHome();
            } };
            // (the training floor above this one: up the stairs to it)
            if (f > goalFloor && FAB.trainCap === goalFloor) return { what: "Idę piętro wyżej (ćwiczenie na piętrze " + goalFloor + ")", why, run: function* () {
                if (foesNear(6).length) { yield* fightFoes(60 * 30, why); return true; }
                const up = evNamed(/^Schody w górę/);
                return up ? yield* takeStairs(up) : false;
            } };
            if (f >= goalFloor) return null;
            // the tenth gate's guardian: the words of the castellan (never in the combat mode - he fights then)
            if (f === 10 && !$gameSwitches.value(14)) return { what: "Strażnik dziesiątej bramy - słowa kasztelana", why, run: function* () {
                // (never in the combat mode and never O at him: a blow starts the fight - 300+ HP of armour; the threshold line before the
                // gate wakes him and he asks - the answer by the castellan's words from Borgar)
                // (the rats first: a talk that starts by itself - the rival by his fire, the guardian - leaves him standing while they bite)
                for (let k = 0; k < 6 && foesNear(9).length; k++) yield* fightFoes(60 * 60, why);
                if (hpRatio() < 0.6) return false;   // (healed first - the plan's rest)
                if (window.Combat && Combat.combatMode && Combat.combatMode()) { yield* L.press("tab"); yield* L.wait(6); }
                if (!(yield* L.walkTo(19, 17))) yield* L.walkTo(18, 17);
                for (let n = 0; n < 90 && !busy(); n++) {
                    if (window.Combat && Combat.combatMode && Combat.combatMode()) { L.setMove([]); yield* L.press("tab"); }
                    L.setMove(["up"]); yield;
                }
                L.setMove([]);
                if (busy()) yield* drive({ picks: ["Nie pytam"], leave: true });
                return $gameSwitches.value(14);
            } };
            // a stop of the lift on this floor: its windlass turned (later the cage brings him back here)
            if (f % 10 === 0 && f < 100 && !liftStops().includes(f) && evNamed(/^Kołowrót/)) return { what: "Kręcę kołowrotem windy (piętro " + f + ")", why, run: function* () {
                const w = evNamed(/^Kołowrót/);
                return (yield* talkTo(w.eventId(), { picks: ["Zakręcić"], leave: true })).ok;
            } };
            if (f % 10 === 0 && f >= 20 && !bossCleared(f)) return { what: "Walka z bossem piętra " + f, why, run: function* () {
                const b = (Creatures.list || []).find(c => c && !c._dead && c._boss) || (Creatures.list || []).find(c => c && !c._dead);
                if (b && !foesNear(10).length) { yield* L.walkTo(Math.round(b.x), Math.round(b.y) + 2); }
                yield* fightFoes(60 * 240, why);
                return true;
            } };
            // wounds: 3% of health an hour heals by itself (Survival.js), not while "wounded" - waiting where no foe is, else up to sleep
            const wounded = $gameSystem.isWounded && $gameSystem.isWounded();
            if ((wounded || hpRatio() < 0.4) && hpRatio() < 0.7 && count(152) > 0 && !foesNear(6).length) return { what: "Opatruję ranę", why: why + ", życie " + Math.round(hpRatio() * 100) + "%", run: function* () {
                const n0 = count(152);
                yield* combatOn();
                L.key("heal", true); yield; yield; L.key("heal", false);
                for (let n = 0; n < 90 && count(152) === n0; n++) yield;
                say(count(152) < n0 ? "opatrunek założony (życie " + Math.round(hpRatio() * 100) + "%)" : "opatrunek nie wszedł");
                return true;
            } };
            if (hpRatio() < 0.55 && !wounded && !foesNear(9).length && needs().water > 12) return { what: "Odpoczywam pod ziemią (rany się goją)", why: why + ", życie " + Math.round(hpRatio() * 100) + "%", run: function* () {
                for (let n = 0; n < 60 * 60 * 30 && hpRatio() < 0.9 && !foesNear(7).length && needs().water > 10; n += 60) { yield* idle(60); }
                return true;
            } };
            if (hpRatio() < 0.25 && count(152) === 0) return { what: "Uciekam po schodach w górę (mało życia, bez opatrunków)", why, run: function* () { yield* goUp(why, true); yield* sleepHome(); } };
            if (hpRatio() < 0.3 || (wounded && hpRatio() < 0.6)) return { what: "Ranny - wracam na górę odpocząć", why, run: function* () { yield* goUp(why); yield* sleepHome(); } };
            if (stamina() < 12 && !foesNear(8).length) return { what: "Wyczerpany - wracam na górę spać", why, run: function* () { yield* goUp(why); yield* sleepHome(); } };
            if (needs().water < 12 && !foesNear(8).length) return { what: "Bez wody - wracam na górę do studni", why: why + " (pod ziemią wody nie ma do piętra 50)", run: () => goUp(why) };
            return { what: "Schodzę: piętro " + f + " → " + (f + 1), why, run: () => floorDown(why) };
        }
        return { what: "Idę do podziemi (piwnica tawerny, krata)", why: why + " (najgłębiej: " + deep + ")", run: function* () { FAB.safeSave(); return yield* goMap(10, why); } };
    }
    // up: the lift from a stop, else the stairs up, back to the Ruins and the cellar
    function* goUp(why, flee) {
        for (let k = 0; k < 120 && inUnder(); k++) {
            // (fleeing: no fight unless one stands right in the way)
            if (flee ? foesNear(1.3).length : foesNear(5).length) { yield* fightFoes(flee ? 60 * 5 : 60 * 30, why); continue; }
            const f = floorNow();
            const cageEv = evNamed(/^Winda kasztelana/);
            if (cageEv && liftStops().includes(f)) { yield* talkTo(cageEv.eventId(), { picks: ["Ruiny"], leave: true }); yield* L.wait(30); continue; }
            const up = $gameMap.events().find(e => e && /^Schody w górę/.test((e.event() && e.event().name) || ""));
            if (!up) return false;
            if (!(yield* takeStairs(up))) return false;
        }
        return yield* goMap(MAP.tavern, why);
    }

    // ------------------------------------------------------------------ przygotowanie (prośba gracza 2026-10-29): gdy ginie pod ziemią, wraca na górę
    // i robi to, co gracz - punkty w walkę, lepszy ekwipunek u Tadka (kupiony za złoto ze zmian), naprawa, zapasy; gdy dalej ginie - ćwiczy
    // piętro wyżej. Wszystko widać na pasku („Przygotowuję się: ...”, „Rozdaję punkty: ...”).
    const ATTR_NAME = { str: "Siła", dex: "Zręczność", con: "Kondycja", per: "Czujność", wil: "Hart ducha" };
    const ATTR_PLAN = ["str", "con", "str", "con", "dex", "per"];   // (damage and life first, then the roll and the parry)
    // the skills for a fighter: life, damage, the thick skin, the guard, healing and bandages, the roll, the heavy hand...
    const SKILL_PLAN = ["d_body", "m_power", "thickskin", "d_body", "m_power", "s_heal", "guard", "d_body", "m_power", "s_band", "s_heal", "d_roll", "m_power2",
        "d_body2", "m_power2", "d_body2", "combo4", "keen", "s_band", "d_roll", "acrobat", "d_block", "d_block", "m_breath", "m_breath", "secondwind", "d_knock", "d_knock"];
    function combatLevelUp() {
        if (!window.Combat || !Combat.hero || !Combat.spendPoints) return null;
        const h = Combat.hero(), said = [];
        if (h.points > 0) {
            const add = {};
            for (let i = 0; i < h.points; i++) { const a = ATTR_PLAN[(FAB.attrI = ((FAB.attrI || 0) + 1)) % ATTR_PLAN.length]; add[a] = (add[a] || 0) + 1; }
            if (Combat.spendPoints(add)) said.push(Object.entries(add).map(([k, n]) => ATTR_NAME[k] + " +" + n).join(", "));
        }
        for (let guard = 0; h.skillPoints > 0 && guard < 10; guard++) {
            const seen = {};
            const id = (SKILL_PLAN.map(id => [id, (seen[id] = (seen[id] || 0) + 1)]).find(([id, r]) => Combat.skillRank(id) < r && !(Combat.skillBlock && Combat.skillBlock(id))) || [])[0];
            if (!id || !Combat.learnSkill(id)) break;
            const sk = (Combat.SKILLS || []).find(s => s.id === id);
            said.push((sk ? sk.name : id) + (sk && sk.ranks > 1 ? " " + Combat.skillRank(id) + "/" + sk.ranks : ""));
        }
        if (!said.length) return null;
        const text = "Rozdaję punkty: " + said.join("; ");
        setDoing(text, "walka w podziemiach: obrażenia, życie, unik, parowanie");
        note("prep", { what: text });
        if ($gameTemp.pushTopNotice) $gameTemp.pushTopNotice(text, "#ffe070");
        return text;
    }
    FAB.combatLevelUp = combatLevelUp;
    // what the hero wears now, by Equipment's slot, and what a thing of Bron gives (armour: obrona, shield: blok, weapon: dmg)
    const BD = () => window.Bron_Data;
    const wornIn = slot => { try { return Equipment.current(slot) || 0; } catch (e) { return 0; } };
    const valueOfItem = p => (!p ? 0 : p.typ === "zbroja" ? p.obrona || 0 : p.typ === "tarcza" ? p.blok || 0 : (BD().staty && BD().staty(p.id) ? BD().staty(p.id).dmg || 0 : 0));
    const slotOf = p => (p.typ === "zbroja" ? (BD().MIEJSCA[p.miejsce] || {}).eq : p.typ === "tarcza" ? "left" : p.typ === "bron" ? "right" : null);
    function weaponDmgNow() { try { const w = Combat.weaponNow(Combat.handMelee()); return w ? w.dmg || 0 : 0; } catch (e) { return 0; } }
    // the shopping list at Tadek's, best first: the torso, a shield, the head, the legs, the hands, the feet, a better weapon - the best
    // thing of each place the level allows (a level above: a little weaker - Bron's „brak”), better than what he wears, while the purse lasts
    function shopWishlist(budget) {
        const out = [];
        if (!window.Bron || !Bron.oferta || !BD()) return out;
        let rows = [];
        try { rows = Bron.oferta("kowal", "kup").filter(r => r && r.act === "kup" && !r.locked && r.p); } catch (e) { return out; }
        const lvl = Bron.level ? Bron.level() : 1;
        for (const slot of ["torso", "left", "head", "legs", "hands", "feet", "right"]) {
            const now = wornIn(slot), nowP = now ? BD().przedmiot(now) : null;
            const nowV = slot === "right" ? weaponDmgNow() : valueOfItem(nowP);
            const cands = rows.filter(r => slotOf(r.p) === slot && r.p.poziom <= lvl + 1 && r.cost <= budget && valueOfItem(r.p) > nowV * (slot === "right" ? 1.15 : 1.0) + 0.0001 && !count(r.id));
            if (!cands.length) continue;
            cands.sort((a, b) => valueOfItem(b.p) - valueOfItem(a.p) || a.cost - b.cost);
            out.push({ id: cands[0].id, name: cands[0].p.nazwa, cost: cands[0].cost, slot });
            budget -= cands[0].cost;
        }
        return out;
    }
    FAB.shopWishlist = shopWishlist;
    // the cheapest good set to aim for (the shifts pay it): the torso, a shield, the head
    function gearTarget() {
        const all = shopWishlist(99999).filter(w => ["torso", "left", "head"].includes(w.slot));
        return all.reduce((s, w) => s + w.cost, 0);
    }
    // the shop window (Bron's Scene_BronSklep) by its keys: ↑↓ the row, ←→ the tab, O buy / mend, P out
    FAB.offMapDriver = function(sc, n) {
        if (!sc || sc.constructor.name !== "Scene_BronSklep") return false;
        const I = Input._currentState, job = FAB.shopJob;
        if (job) job.opened = true;
        for (const k of ["ok", "up", "down", "left", "right", "cancel"]) I[k] = false;
        if (n < 25 || n % 5 !== 0) return true;
        if (!job) { I.cancel = true; return true; }
        if (job.buy.length) {
            if (sc._tab !== "kup") { I.left = true; return true; }
            const want = job.buy[0], i = (sc._rows || []).findIndex(r => r && r.act === "kup" && r.id === want.id);
            if (job.pressed) {
                if (count(want.id) > job.c0) { job.bought.push(want.name); say("kupione u Tadka: " + want.name + " (" + want.cost + " G)"); }
                else { job.skipped.push(want.name); say("nie kupione: " + want.name); }
                job.buy.shift(); job.pressed = false; return true;
            }
            if (i < 0) { job.skipped.push(want.name); job.buy.shift(); return true; }
            if (sc._list.index !== i) { I[sc._list.index < i ? "down" : "up"] = true; return true; }
            job.c0 = count(want.id); job.pressed = true; I.ok = true; return true;
        }
        if (job.repair && (job.repairs || 0) < 6 && (sc._tabs || []).includes("napraw")) {
            if (sc._tab !== "napraw") { I.right = true; return true; }
            const rows = (sc._rows || []).filter(r => r && r.act === "napraw" && r.cost <= $gameParty.gold());
            if (rows.length && !job.repairPressed) { if (sc._list.index !== 0) { I.up = true; return true; } I.ok = true; job.repairPressed = true; job.repairs = (job.repairs || 0) + 1; return true; }
            if (rows.length && job.repairPressed) { job.repairPressed = false; return true; }
            job.repair = false;
        }
        I.cancel = true;
        return true;
    };
    function equipBought(ids) {
        for (const id of ids) {
            const p = BD() && BD().przedmiot(id), slot = p && slotOf(p);
            if (!slot) continue;
            try { if (slot === "right") { if (Combat.setHand("m" + id)) say("bierze do ręki: " + p.nazwa); } else if (Equipment.equip(slot, id)) say("zakłada: " + p.nazwa + " (jak w oknie Ekwipunek)"); } catch (e) { /* (no such slot) */ }
        }
    }
    function* shopAtTadek(list, repair, why) {
        if (!(yield* goMap(MAP.town, why))) return false;
        FAB.shopJob = { buy: list.slice(), bought: [], skipped: [], repair };
        const ids = list.map(w => w.id);
        setDoing("Przygotowuję się: kupuję u Tadka " + list.map(w => w.name).join(", "), why);
        // (his quests and offers speak first - a talk or two before the shop's row; talked to again until the shop opens)
        for (let k = 0; k < 5 && !FAB.shopJob.opened; k++) yield* talkTo(tadek, { picks: ["Pokaż broń"], leave: true });
        const job = FAB.shopJob;
        FAB.shopJob = null;
        equipBought(ids.filter(id => count(id) > 0));
        // (a visit for nothing - the shop did not open or had nothing of the list: counted, at most 4 a day; noted once, not every visit)
        const none = !job.bought.length && !(job.repairs > 0);
        if (none) { FAB.shopNone = FAB.shopNone && FAB.shopNone.day === day() ? FAB.shopNone : { day: day(), n: 0 }; FAB.shopNone.n++; }
        if (!none || FAB.shopNone.n === 1 || FAB.shopNone.n === 4)
            note("prep", { what: "u Tadka: kupione " + (job.bought.join(", ") || "nic") + (job.skipped.length ? "; nie: " + job.skipped.join(", ") : "") + (repair ? "; naprawa: " + (job.repairs || 0) : "") + (none && FAB.shopNone.n === 4 ? " (4. raz dziś - do jutra bez kowala)" : "") });
        return job.bought.length > 0;
    }
    // (worn below 35% AND on Tadek's mending tab with the gold for it - he mends metal only; a wooden spear or leather is not his:
    // without this the hero walked to him again and again for a mend that never came)
    const wornOut = () => { try {
        const du = window.Durability; if (!du || !du.left || !du.TOOLS) return false;
        const mendable = new Set((window.Bron && Bron.oferta ? Bron.oferta("kowal", "napraw") : []).filter(r => r && r.act === "napraw" && !r.short).map(r => r.id));
        for (const id of [Combat.handMelee(), ...["torso", "head", "left", "legs", "hands", "feet"].map(wornIn)]) if (id && du.TOOLS[id] && mendable.has(id) && du.left(id) / Math.max(1, du.lifeOf(id)) < 0.35) return true;
    } catch (e) {} return false; };
    // a death underground: noted by the floor; two on one floor (or three since the last preparing) - up and prepare
    FAB.onDeathUnder = function(floor) {
        const d = FAB.ugDeaths = (FAB.ugDeaths || []).concat([{ floor, day: day() }]);
        const same = d.filter(x => x.floor === floor && day() - x.day <= 5).length, since = d.length - (FAB.prepAtDeaths || 0);
        if (same >= 2 || since >= 3) {
            FAB.prep = { floor, why: "zginął " + same + "× na piętrze " + floor, n: (FAB.prep ? FAB.prep.n : 0) + 1 };
            FAB.prepCount = (FAB.prepCount || 0) + 1;
            FAB.prepAtDeaths = d.length;
            // (still dying after a preparing: the floor above first - experience where the creatures are weaker)
            if (FAB.prepCount >= 2) { let c = Math.max(1, floor - 1); if (c % 10 === 0 && c > 1) c--; FAB.trainCap = c; FAB.trainFrom = floor; FAB.trainUntil = null; }
            note("prep", { what: "PRZYGOTOWANIE: " + FAB.prep.why + (FAB.trainCap ? " - najpierw ćwiczenie na piętrze " + FAB.trainCap : "") });
            say("PRZYGOTOWANIE: " + FAB.prep.why);
        }
    };
    function prepPlan() {
        const why = "Przygotowuję się: " + (FAB.prep ? FAB.prep.why : "przed podziemiami");
        const h = hour();
        // the gear: what Tadek has that the purse (less 20 G for food) buys
        const wish = shopWishlist($gameParty.gold() - 20);
        const repair = wornOut();
        const shopTired = FAB.shopNone && FAB.shopNone.day === day() && FAB.shopNone.n >= 4;
        if ((wish.length || repair) && h >= 6.2 && h < 16.5 && !shopTired) return { what: "Przygotowuję się: kowal Tadek (" + (wish.length ? wish.map(w => w.name).join(", ") : "naprawa") + ")", why, run: () => shopAtTadek(wish, repair, why) };
        // not enough gold for the torso / the shield / the head: the evening shifts at Borgar's (at most 4 a preparing)
        const target = gearTarget();
        if (target > $gameParty.gold() - 20 && (FAB.prepShifts || 0) < 4) {
            if (shiftOpen() && h >= Math.min(shiftLeave(), 15.5)) return { what: "Przygotowuję się: zarabiam na zbroję (zmiana u Borgara)", why: why + " - brakuje " + Math.max(0, target - $gameParty.gold() + 20) + " G", run: function* () {
                const n0 = FAB.rep.shifts.length;
                yield* doShift();
                if (FAB.rep.shifts.length > n0) FAB.prepShifts = (FAB.prepShifts || 0) + 1;
            } };
            if (h >= 6 && h < shiftLeave() && shiftOpen()) { const fp = freeTimePlan(16, MAP.tavern, "Do zmiany"); if (fp) { fp.why = why + "; " + fp.why; return fp; } }
            if (h >= 6 && h < 15.5 && shiftOpen()) return { what: "Przygotowuję się: czekam na zmianę u Borgara (złoto na zbroję)", why, run: function* () { if (!(yield* toCounter())) return false; yield* idle(900); return true; } };
            // (the evening, today's shift done or missed: the night at grandpa's, tomorrow the smith and the shift - not down short of gear)
            if (h >= 16.5 && FAB.prep) return { what: "Przygotowuję się: do jutra (rano kowal, wieczorem zmiana)", why: why + " - brakuje " + Math.max(0, target - $gameParty.gold() + 20) + " G", run: sleepHome };
        }
        return null;
    }

    // ------------------------------------------------------------------ Akt III: noc napadu na tawernę
    const A3 = () => window.Act3;
    function act3Plan(why) {
        const A = A3();
        if (!A) return null;
        const ph = A.phase(), st = A.state ? A.state() : {}, h = hour();
        if (ph === "siege") {
            const sg = A.siege ? A.siege() : null;
            const W = sg && sg.waves ? sg.waves[sg.wave] : null, waveMap = W && W.map ? W.map : (sg && sg.wave >= 2 ? MAP.tavern : MAP.town);
            if (mapId() !== waveMap && (waveMap === MAP.tavern || waveMap === MAP.town)) return { what: "Oblężenie: idę tam, gdzie fala (" + mapName(waveMap) + ")", why, run: () => goMap(waveMap, why) };
            return { what: "Oblężenie: bronię tawerny (fala " + ((sg && sg.wave) || 0) + ")", why, run: function* () {
                if (foesNear(14).length) { yield* fightFoes(60 * 120, why); return true; }
                // the wave not here yet: towards the tavern's door (Map008) / the hall (Map001)
                if (mapId() === MAP.town) yield* L.walkTo(51, 20); else yield* L.walkTo(50, 40);
                yield* idle(120);
                return true;
            } };
        }
        if (ph === "armed") {
            const night = st.siegeDay && day() >= st.siegeDay && (h >= 20.5 || h < 4);
            if (night) {
                if (mapId() !== MAP.town && mapId() !== MAP.tavern) return { what: "Noc napadu: wracam pod tawernę", why, run: () => goMap(MAP.town, why) };
                return { what: "Noc napadu: czekam pod tawerną", why, run: function* () { yield* L.walkTo(51, 20); yield* idle(300); } };
            }
            if (st.siegeDay && day() >= st.siegeDay && h >= 17) return { what: "Noc napadu tuż-tuż: idę do miasta", why, run: () => goMap(MAP.town, why) };
            return { what: "Akt III uzbrojony - napad dnia " + st.siegeDay, why, run: () => idle(600) };
        }
        return null;
    }

    // ------------------------------------------------------------------ etap 3: drugi zamek Serca (W2 „Kod dzwonu”) - tak daleko, jak da się bez zadań pobocznych
    const dzwonnik = () => (window.TownLife && TownLife.eventOf ? TownLife.eventOf("dzwonnik") : null);
    function stage3Plan() {
        const why = "Etap 3: drugi zamek Serca - W2 Kod dzwonu", st = qstep("W2"), h = hour();
        let lk = null;
        try { lk = Underground.locks(); } catch (e) { lk = null; }
        if (lk && lk.signalKnown) { FAB.stop3 = "zamek sygnału znany - dalej piętra 51-100 i Komnata Serca (w budowie)"; return null; }
        if (st < 0) {
            // W2 begins with a bell's signal heard in the town: the bell rings "1-1-1-1" at 23:00 (and "3" at 3:00)
            if (mapId() !== MAP.town || h < 22.5) return { what: "Czekam w mieście na nocny dzwon (23:00)", why: why + " - W2 rusza po usłyszeniu sygnału dzwonu", run: function* () { if (yield* goMap(MAP.town, why)) { yield* L.walkTo(50, 46); yield* idle(600); } } };
            return { what: "Słucham dzwonu o 23:00", why, run: () => idle(600) };
        }
        pinQuest("W2");
        if (st === 1) {
            if (h >= 6.3 && h < 17.7) return { what: "Rozmawiam z Ambrożym (dzwonnik)", why, run: function* () { if (yield* goMap(MAP.town, why)) yield* talkTo(dzwonnik, { leave: true }); } };
            return null;
        }
        if (st === 2) {
            const op = (window.TownQuests && TownQuests.opinion) ? TownQuests.opinion() : 0;
            FAB.stop3 = "W2 rozdz. 2 wymaga D16 „Uczeń dzwonnika”, a D16 - Opinii miasta ≥ 40 (jest " + op + "); Opinię dają zadania poboczne K/D, których autopilot nie robi";
            if (!FAB.stop3Noted) { FAB.stop3Noted = true; note("unclear", { what: "BLOKADA etapu 3: " + FAB.stop3 }); say("BLOKADA: " + FAB.stop3); }
            FAB.done3blocked = true;
            return { what: "Etap 3 zatrzymany: W2 czeka na D16 (Opinia " + op + "/40)", why, run: () => idle(1200) };
        }
        FAB.stop3 = "W2 krok " + st + " - dalsze kroki w budowie";
        return { what: "W2 krok " + st + " - w budowie", why, run: () => idle(1200) };
    }

    // ------------------------------------------------------------------ niejasności: kompas i dziennik vs. dokąd naprawdę trzeba iść
    function trackedInfo() {
        let t = null, c = null;
        try { t = window.Journal && Journal.tracked ? Journal.tracked() : null; } catch (e) { t = null; }
        try { c = window.CleanCompass && CleanCompass.target ? CleanCompass.target() : null; } catch (e) { c = null; }
        return { title: t ? t.title || "" : "", line: t ? t.line || "" : "", source: t ? t.source : "", compass: c ? { map: c.map, x: c.x, y: c.y, name: c.name } : null };
    }
    FAB.trackedInfo = trackedInfo;
    // a story beat begins: does the game's goal (the journal's tracked goal and the compass) point there?
    function checkGoal(beat, wantMap) {
        const key = beat + ":" + day();
        if (FAB.unclearSeen[beat]) return;
        const t = trackedInfo();
        let what = null;
        if (!t.title) what = "dziennik nie pokazuje celu";
        else if (!t.compass) what = "kompas bez celu (cel: „" + t.title + "”)";
        else if (wantMap && t.compass.map !== wantMap) what = "kompas wskazuje „" + (t.compass.name || mapName(t.compass.map)) + "” (" + mapName(t.compass.map) + "), a krok fabuły jest na mapie " + mapName(wantMap) + " (cel: „" + t.title + "”)";
        if (what) { FAB.unclearSeen[beat] = 1; note("unclear", { beat, what, title: t.title, compass: t.compass }); say("NIEJASNE: " + what); }
        void key;
    }

    // ------------------------------------------------------------------ mózg: co teraz
    function needUrgent() {
        const n = needs();
        return n.water < 30 && wellLeft() > 0 || n.food < 30 && bagFoods().some(f => f.fed > 0);
    }
    function chapter() {
        const s = S();
        if (!s) return "brak fabuły";
        if (s.intro !== 2) return "Prolog: dom dziadka";
        if (!(s.done || s.paid >= s.debt) && !(window.Story && Story.chapterEnded && Story.chapterEnded())) return "Rozdział 1: Dług dziadka";
        if (!qflags().borgarSaying) return "W4: Krew kasztelana (klucz i krata)";
        const A = window.Act3, ph = A ? A.phase() : "idle", deep = window.Underground ? Underground.deepest() : 0;
        if (ph === "armed" || ph === "siege") return "Akt III: napad na tawernę";
        if (ph === "done") return "Po Akcie III";
        return deep >= 10 ? "Podziemia: piętra 11-50" : "Podziemia: piętra 1-10";
    }
    function decide() {
        const s = S(), n = needs(), h = hour();
        if (!s) return { what: "Brak fabuły w tej grze", why: "", run: () => idle(600) };
        setStage(chapter());
        if (busy()) return { what: "Rozmowa", why: "", quiet: true, run: () => drive({}) };
        if (s.intro !== 2) return { what: "Słucham dziadka", why: "Prolog: dom dziadka", run: function* () {
            if (!busy() && mapId() === MAP.house) { const g = $gameMap.event(901); if (g) yield* talkTo(901); }
            yield* idle(60);
        } };
        const chapterDone = s.done || s.paid >= s.debt;
        // (after the debt the evening shift is the purse for food, gear and repairs - the bar says so, not the paid debt)
        const ch1 = chapterDone ? "zarobek na jedzenie, ekwipunek i naprawy (dług spłacony)" : "Rozdział 1: dług " + debtLine();
        // 1. noc: spać w domu dziadka (w ostatnią noc przed terminem najpierw spłata)
        const lastNight = !chapterDone && window.Story && Story.daysLeft && Story.daysLeft() <= 0;
        // (underground the night does not count: he goes up to sleep when worn out - underPlan)
        const bellNight = FAB.done2 && qstep("W2") < 0 && h >= 21 && h < 23.3;   // (etap 3: W2 begins with the night bell heard in town)
        const a3 = window.Act3 ? Act3.phase() : "idle";
        const siegeNight = a3 === "siege" || (a3 === "armed" && Act3.state().siegeDay && day() >= Act3.state().siegeDay);   // (Akt III: the night of the raid he stays by the tavern)
        if ((h >= 21.25 || h < 5.5) && !(lastNight && gold() > 0) && !inUnder() && !bellNight && !siegeNight) {
            if (mapId() === MAP.field && hasBedroll()) return { what: "Śpię na działce", why: "noc (" + clock() + "), leśne legowisko", run: sleepField };
            return { what: "Idę spać do domu dziadka", why: "noc (" + clock() + "), posłanie u dziadka za darmo", run: sleepHome };
        }
        // 2. jedzenie i picie (hunger and thirst never kill - they cap the strength; the town's well gives 2 draws a day)
        if (n.food < 50 && bagFoods().some(f => f.fed > 0)) return { what: "Jem", why: "sytość " + Math.round(n.food), run: () => eatBest(false) };
        if (mapId() === MAP.house && FAB.soupDay !== day() && h >= 8 && h < 20 && count(SOUP) < 3) return { what: "Biorę kapuśniak z kotła dziadka", why: "jedzenie na dzień (raz dziennie od 8:00)", run: takeSoup };
        if (mapId() === MAP.house && FAB.soupDay !== day() && h >= 5.5 && h < 8 && count(SOUP) < 2) {
            const fp = freeTimePlan(8, MAP.house, "Do kapuśniaku", 0.3);
            if (fp) return fp;
            // (food in the bag and not hungry in chapter 1: no standing by the kettle - the day goes on, the soup when he passes by;
            // before a trip down - the soup is the food for it - he waits the hour)
            if (!(!FAB.done1 && bagFoods().some(f => f.fed > 0) && n.food >= 40))
                return { what: "Czekam na kapuśniak (od 8:00)", why: "jedzenie na dzień (nic pożytecznego się nie zmieści do 8:00)", run: () => idle(240) };
        }
        if (n.water < 60 && wellLeft() > 0 && !inUnder() && (mapId() === MAP.town || mapId() === MAP.tavern || n.water < 35)) return { what: "Piję ze studni miejskiej", why: "woda " + Math.round(n.water) + " (2 nabrania dziennie)", run: drinkWell };
        if (n.water < 25 && bagFoods().some(f => f.water > 0)) return { what: "Piję (jedzenie z wodą)", why: "woda " + Math.round(n.water), run: () => eatBest(true) };
        if (stamina() < 30 && inUnder() && bagFoods().some(f => f.stamina > 0) && !foesNear(8).length) return { what: "Jem dla sił", why: "siły " + Math.round(stamina()), run: () => eatBest("stamina") };
        // 3. rozdział 1: działka, praca, zmiany, spłata
        if (!chapterDone) {
            if (!s.flags.field) return { what: "Idę na działkę dziadka (Kruczy Jar)", why: "Rozdział 1: dziadek pozwala budować na swoim polu", run: function* () {
                checkGoal("field", MAP.field); yield* goMap(MAP.field, "działka"); yield* idle(40);
            } };
            if (!s.flags.hired) return { what: "Idę do Borgara po pracę", why: "Rozdział 1: praca w tawernie", run: function* () {
                checkGoal("hire", MAP.tavern);
                if (!(yield* toCounter())) return false;
                installShiftBot();
                yield* talkTo(borgarCounter, { tiles: [[50, 29]], picks: shiftOpen() && h >= 16 ? ["Weź zmianę"] : [], leave: true });
                return true;
            } };
            if (gold() >= s.debt - s.paid) return { what: "Idę do Lorda spłacić cały dług", why: ch1 + ", w sakiewce " + gold() + " G", run: function* () { checkGoal("payAll", MAP.manor); yield* payDebt(); } };
            const leave = shiftLeave();
            if (shiftOpen() && h >= Math.min(leave, 15.5)) return { what: "Idę na zmianę do Borgara", why: ch1 + " - zmiana 16-21 to główny zarobek (droga ~" + fmtH(travelH(MAP.tavern)) + ")", run: function* () { if (FAB.rep.shifts.length === 0) checkGoal("shift", MAP.tavern); yield* doShift(); } };
            if (gold() >= PAY_AT && FAB.payTried !== day() && ((h >= 8 && h < 13) || (h >= 20 && h < 21.25))) return { what: "Idę do dworu z ratą długu", why: ch1 + ", w sakiewce " + gold() + " G (mniej do stracenia w nocy na drodze)", run: payDebt };
            // free time: something useful that fits (the field, gathering), back about 15:45; nothing fits - to town (the well on the
            // way) and the tavern
            if (h >= 5.5 && h < Math.max(leave, 13.5)) {
                if (shiftOpen() && h < leave) { const fp = freeTimePlan(16, MAP.tavern, "Do zmiany"); if (fp) return fp; }
                if (mapId() === MAP.tavern && Math.abs(P().x - 50) + Math.abs(P().y - 31) <= 2) return { what: "Czekam w tawernie na zmianę (od 16:00)", why: ch1, run: () => idle(900) };
                return { what: "Idę do tawerny", why: ch1 + " - zmiana od 16:00", run: function* () { if (needs().water < 80 && wellLeft() > 1) yield* drinkWell(); return yield* toCounter(); } };
            }
            return { what: "Wracam do domu dziadka", why: "wieczór - sen u dziadka", run: function* () { yield* goMap(MAP.house, "dom"); yield* idle(120); } };
        }
        FAB.done1 = true;
        // 4. etap 2: W4 do kraty i hasła Borgara
        if (!qflags().borgarSaying) {
            const st = qstep("W4");
            if (st < 0) return { what: "Czekam, aż ruszy W4", why: "po spłacie długu", run: () => idle(600) };
            pinQuest("W4");
            const p = w4Plan(st);
            if (p) return p;
            return { what: "Czekam (W4: godziny Tadka)", why: "W4 krok " + st, run: () => idle(600) };
        }
        FAB.done2a = true;
        // 5. podziemia do piętra 50 (strażnik na 10, bossowie 20-40), potem Akt III w mieście
        const deep = UG() ? UG().deepest() : 0;
        const A = A3(), ph = A ? A.phase() : "idle";
        if (ph === "armed" || ph === "siege") { const p = act3Plan("Akt III: napad na tawernę"); if (p) return p; }
        // a weapon before the underground: the iron spear from his own forge (Bron: „Wykuj: żelazna włócznia” - 2 iron, 1 coal, 2 wood),
        // else the oak staff from the workbench; put in hand as in the equipment window
        const weapon = bestWeapon();
        if (weapon !== 331 && !inUnder() && !FAB.spearGaveUp) return { what: "Kuję żelazną włócznię (kuźnia na działce)", why: "przed podziemiami: broń (pięści to za mało na stwory)", run: function* () {
            const r = yield* fieldWork(PLAN_IRON.concat(["Oszczep"]), () => count(331) > 0 || hour() >= 20.5 || hour() < 5.5, "broń na podziemia", function* () {
                if (count(86) < 2 || count(79) < 1 || count(61) < 2) {
                    setDoing("Na działce: żelazo na włócznię", "broń na podziemia");
                    if (yield* AP.TASKS.obtain({ 86: 2, 79: 1 + (count(86) < 2 ? 2 : 0), 61: 2 })) return "dalej";
                    yield* idle(600); return "dalej";
                }
                setDoing("Kuję: żelazna włócznia", "broń na podziemia");
                if (yield* AP.TASKS.craft("forge", "Wykuj: żelazna włócznia")) return true;
                FAB.spearTries = (FAB.spearTries || 0) + 1;
                if (FAB.spearTries > 3) { FAB.spearGaveUp = true; note("unclear", { what: "nie udało się wykuć żelaznej włóczni w kuźni (przepis „Wykuj: żelazna włócznia”)" }); return true; }
                return "dalej";
            });
            equipBest();
            return r;
        } };
        equipBest();
        // bandages before going down (the only thing that heals a wound - +20% life; „Zrób opatrunek”: fibre, herbs, yarrow from the field)
        if (count(152) < 3 && !inUnder() && !FAB.bandageGaveUp && deep < UNDER_GOAL) return { what: "Robię opatrunki na drogę (zioła, krwawnik, włókno)", why: "przed podziemiami: rany goją się tylko opatrunkiem albo snem", run: function* () {
            yield* fieldWork([], () => count(152) >= 3 || hour() >= 20.5 || hour() < 5.5, "opatrunki na podziemia", function* () {
                FAB.bandageTries = (FAB.bandageTries || 0) + 1;
                if (FAB.bandageTries > 12) { FAB.bandageGaveUp = true; note("notes", { what: "opatrunki: nie udało się zebrać ziół / krwawnika (pora roku?) - schodzi bez nich" }); return true; }
                for (const [id, kind] of [[104, "herb"], [150, "yarrow"], [92, "fiber"]]) if (count(id) < 2) { setDoing("Na działce: zbieram " + $dataItems[id].name, "opatrunki"); yield* AP.TASKS.gather([kind], 2 - count(id)); }
                if (count(104) >= 2 && count(150) >= 2 && count(92) >= 2) { setDoing("Robię opatrunek", "opatrunki"); yield* AP.TASKS.handCraft("Zrób opatrunek"); }
                return count(152) >= 3 ? true : "dalej";
            });
        } };
        // preparing: before the first descent, and after dying twice on a floor (gear from Tadek, mending; the points are spent all the time)
        if (!inUnder() && (FAB.prep || !FAB.firstPrepDone) && deep < UNDER_GOAL) {
            const pp = prepPlan();
            if (pp) return pp;
            if (FAB.prep) note("prep", { what: "przygotowanie skończone - wraca pod ziemię" + (FAB.trainCap ? " (najpierw ćwiczenie na piętrze " + FAB.trainCap + ")" : "") });
            FAB.prep = null; FAB.firstPrepDone = true; FAB.prepShifts = 0;
        }
        if (deep < UNDER_GOAL) {
            // before going down: rested, healed, watered (no water down there until floor 50; hunger and thirst cap the strength)
            if (!inUnder()) {
                const nn = needs();
                if (hpRatio() < 0.7 || stamina() < 55) return { what: "Odpoczywam przed zejściem (sen u dziadka)", why: "życie " + Math.round(hpRatio() * 100) + "%, siły " + Math.round(stamina()), run: sleepHome };
                if (nn.water < 70 && wellLeft() > 0) return { what: "Piję ze studni przed zejściem", why: "woda " + Math.round(nn.water) + " (pod ziemią wody nie ma do piętra 50)", run: drinkWell };
                // (the well's two draws used up and too little water for a trip down: the night first, tomorrow's draws)
                if (nn.water < 50 && wellLeft() === 0) return { what: "Czekam do jutra na wodę (studnia: koniec przydziału)", why: "woda " + Math.round(nn.water) + " - za mało na wyprawę pod ziemię", run: sleepHome };
                if (count(SOUP) < 2 && FAB.soupDay !== day() && hour() >= 8 && hour() < 18) return { what: "Biorę kapuśniak na drogę", why: "jedzenie pod ziemię", run: function* () { if (yield* goMap(MAP.house, "kapuśniak")) yield* takeSoup(); } };
            }
            // training: dying again after a preparing - the floor above first, a few hours of its creatures (experience), then deeper
            // (on the training floor itself - from a deeper one he goes up first, underPlan; until one level more, a day at most)
            if (FAB.trainCap && inUnder() && floorNow() === FAB.trainCap) {
                const lv = Combat.hero ? Combat.hero().level : 0;
                if (!FAB.trainUntil) { FAB.trainUntil = now() + 24; FAB.trainLevel = lv + 1; }
                if (now() < FAB.trainUntil && lv < FAB.trainLevel) return { what: "Ćwiczę na piętrze " + floorNow() + " (doświadczenie przed niższymi)", why: "po zgonach na piętrze " + (FAB.trainFrom || FAB.trainCap + 1) + ", do poziomu " + FAB.trainLevel, run: function* () {
                    const seen = seenFn();
                    if (foesNear(9).length) { yield* fightFoes(60 * 60, "ćwiczenie"); return true; }
                    if (!seen || !(yield* exploreStep(seen))) yield* idle(300);
                    return true;
                } };
                note("prep", { what: "ćwiczenie na piętrze " + FAB.trainCap + " skończone (poziom " + (Combat.hero ? Combat.hero().level : "?") + ")" });
                FAB.trainCap = null; FAB.trainUntil = null; FAB.trainLevel = null;
            }
            const p = underPlan(FAB.trainCap || UNDER_GOAL, "Podziemia: do piętra 50 (najgłębiej " + deep + ")");
            if (p) return p;
        }
        if (ph === "idle" && deep >= UNDER_GOAL) return { what: "Piętro 50 osiągnięte - wracam do miasta", why: "Akt III uzbraja się w mieście", run: function* () { if (inUnder()) yield* goUp("Akt III"); yield* goMap(MAP.town, "Akt III"); yield* idle(300); } };
        if (ph === "done") { FAB.done2 = true; const p3 = stage3Plan(); if (p3) return p3; return { what: "Etap 3 zatrzymany", why: FAB.stop3 || "", run: () => idle(900) }; }
        return { what: "Czekam (etap 2)", why: "faza Aktu III: " + ph, run: () => idle(600) };
    }
    FAB.decide = decide;

    function* fabula() {
        say("autopilot fabuły v" + VERSION + " (polityka: " + FAB.policyName + ")");
        if (!FAB.rep.start) FAB.rep.start = { day: day(), hour: +hour().toFixed(2), real: Date.now() };
        for (;;) {
            if (FAB.paused) { L.releaseAll(); yield; continue; }
            if (!onMapReady() && !busy()) { yield; continue; }
            try { combatLevelUp(); } catch (e) { /* (the points: a fighter's plan - Siła, Kondycja, Zręczność, Czujność; life and damage skills) */ }
            const plan = decide();
            if (!plan) { yield* idle(60); continue; }
            if (!plan.quiet) setDoing(plan.what, plan.why);
            const f0 = AP.frame;
            try { yield* plan.run(); } finally { L.releaseAll(); }
            // (a plan that ends at once again and again: nothing works there now - a pause, noted once)
            if (AP.frame - f0 < 30 && plan.what === FAB.lastPlan) {
                // (stuck in a walled-in room after a transfer? the map's fault - out of it, noted)
                if (FAB.quick === 1 && FAB.lastFrom && (yield* unpocket(FAB.lastFrom))) { FAB.quick = 0; continue; }
                if (++FAB.quick >= 3) { FAB.quick = 0; say("nic nie wychodzi: " + plan.what + " - chwila przerwy"); yield* idle(600); }
            } else FAB.quick = 0;
            FAB.lastPlan = plan.what;
            yield;
        }
    }
    AP.TASKS.fabula = fabula;
    AP.restartWith = [["fabula"]];
    AP.noNightSleep = true;
    AP.wantPlay = false;
    AP.freeWalk = true;   // (paths by FreeMovement's rule - ap.js passStep)

    // ------------------------------------------------------------------ sceny poza mapą, prędkość, strażnik (zgon, utknięcie, krzywa złota)
    // the scenes off the map (the day's summary: O; the shift: its own bot; others unknown: P after a while) and the heartbeat for AP's
    // watchdog; FAB.sceneTick is set anew by each injection, the hook into SceneManager only once
    let other = 0, otherName = "";
    FAB.sceneTick = function(sc) {
        const name = sc ? sc.constructor.name : "";
        if (!FAB.on || !sc) return;
        if (!(sc instanceof Scene_Map) && !SceneManager.isSceneChanging()) {
            if (name !== otherName) { otherName = name; other = 0; }
            other++;
            const I = Input._currentState;
            if (name === "Scene_DaySummary") { I.ok = other > 30 && other % 10 === 0; }
            else if (name === "Scene_TavernShift" || name === "Scene_Gameover" || name === "Scene_Title" || name === "Scene_Prologue" || name === "Scene_HeroName" || name === "Scene_Load") { /* (own drivers) */ }
            else if (FAB.offMapDriver && FAB.offMapDriver(sc, other)) { /* (a mini-game's driver) */ }
            else if (other > 900 && other % 30 === 0) { I.escape = true; if (other % 60 === 0) say("nieznana scena " + name + " - P"); }
            else if (other > 900) I.escape = false;
            return;
        }
        otherName = ""; other = 0;
        // (AP's watchdog "stoi od minuty" counts frames without a word: a hero who walks is not standing)
        if (window.AP && $gamePlayer && (FAB.hb = (FAB.hb || 0) + 1) % 120 === 0) {
            const k = Math.round($gamePlayer._realX * 2) + ":" + Math.round($gamePlayer._realY * 2) + ":" + $gameMap.mapId();
            if (k !== FAB.hbKey) { FAB.hbKey = k; AP.saidAt = AP.frame; }
        }
    };
    if (!FAB.sceneHooked2) {
        FAB.sceneHooked2 = true;
        const _updateScene = SceneManager.updateScene;
        SceneManager.updateScene = function() {
            try { if (window.FAB && FAB.sceneTick) FAB.sceneTick(this._scene); } catch (e) { /* (driver only) */ }
            return _updateScene.apply(this, arguments);
        };
    }
    if (!FAB.speedHooked) {
        FAB.speedHooked = true;
        const orig = SceneManager.determineRepeatNumber;
        SceneManager.determineRepeatNumber = function(dt) { const k = orig.call(this, dt); return k > 0 ? k * Math.max(1, (window.FAB && FAB.speed) || 1) : 0; };
    }
    FAB.speed = (old && old.speed) || 1;
    FAB.setSpeed = n => { FAB.speed = Math.max(1, Math.min(24, Math.round(n) || 1)); return FAB.speed; };

    // progress: what counts as moving forward (the story's state, the quests' steps, the map, the gold)
    FAB.progressKey = function() {
        const s = S() || {};
        let q = "";
        try { if (window.TownQuests && TownQuests.state) { const st = TownQuests.state().q || {}; q = Object.keys(st).map(k => k + st[k].s + st[k].step).join(","); } } catch (e) {}
        let fb = 0;
        let jobs = "";
        try {
            const list = ((Farming.farm().buildings || {})[3] || []).filter(b => b && !b.site);
            fb = list.length;
            // (a job in a station - the kiln, the forge - is waited for: its hours going down count as moving forward)
            jobs = list.filter(b => b.job).map(b => Math.round(Farming.jobHoursLeft ? Farming.jobHoursLeft(b) : 0)).join("/");
        } catch (e) {}
        const items = [61, 62, 64, 78, 79, 80, 84, 85, 86, 88, 331].map(id => count(id)).join(",");
        return [mapId(), gold(), s.paid, s.done, s.intro, Object.keys(s.flags || {}).join(","), q, window.Underground && Underground.deepest ? Underground.deepest() : 0, fb, items, jobs, Math.floor(hpRatio() * 5)].join("|");   // (health coming back - a rest underground - is progress too)
    };
    FAB.STUCK_HOURS = 16;
    FAB.status = function() {
        const s = S();
        let deb = null;
        if (s) deb = { paid: s.paid, debt: s.debt, left: Math.max(0, s.debt - s.paid), done: !!s.done, daysLeft: window.Story && Story.daysLeft ? Story.daysLeft() : null };
        return { doing: FAB.doing, why: FAB.why, stage: FAB.stage, day: day(), hour: +hour().toFixed(2), clock: clock(), gold: gold(), debt: deb, speed: FAB.speed, paused: !!FAB.paused,
            stuck: FAB.stuck, map: mapId(), mapName: mapName(mapId()), x: P().x, y: P().y, deaths: FAB.rep.deaths.length, shifts: FAB.rep.shifts.length,
            deepest: window.Underground && Underground.deepest ? Underground.deepest() : 0 };
    };
    if (FAB.guard) clearInterval(FAB.guard);
    FAB.lastKey = null; FAB.lastKeyAt = null;
    FAB.guard = setInterval(() => {
        try {
            if (!FAB.on) return;
            const sc = SceneManager._scene, name = sc ? sc.constructor.name : "";
            // a death: the last save is loaded again (AP's autosave every 3 min, the game's after sleep), the run goes on
            if (name === "Scene_Gameover" && !FAB.reloading) {
                FAB.reloading = true;
                const fl = inUnder() ? floorNow() : 0;
                const d = note("deaths", { doing: FAB.doing, why: FAB.why, floor: fl, hp: $gameParty.leader() ? $gameParty.leader().hp : null, log: FAB.log.slice(-6) });
                if (fl > 0) try { FAB.onDeathUnder(fl); } catch (e) { /* (only the counting) */ }
                say("ZGON (" + FAB.doing + ") - wczytuję ostatni zapis");
                FAB.reloadLatest().then(ok => { d.reloaded = ok; FAB.reloading = false; });
                return;
            }
            if (!(sc instanceof Scene_Map) || !$gameSystem || !$gameMap) return;
            // the gold curve (each game hour)
            const t = now(), s = S();
            const g = FAB.rep.gold, lastG = g[g.length - 1];
            if (!lastG || t - lastG[0] >= 1 || lastG[1] !== gold() || (s && lastG[2] !== s.paid)) g.push([+t.toFixed(2), gold(), s ? s.paid : 0]);
            if (g.length > 4000) g.splice(0, g.length - 3000);
            dayRec();
            // waiting: the game's minutes under a "Czekam..." label (a night's jump is not counted)
            const dt = FAB.idleT === undefined ? 0 : t - FAB.idleT;
            FAB.idleT = t;
            if (dt > 0 && dt < 0.75 && /^(Czekam|Przygotowuję się: czekam)/.test(FAB.doing || "")) {
                const I = FAB.rep.idle = FAB.rep.idle || { byLabel: {}, byDay: {} };
                const lab = FAB.doing.replace(/\s*\(.*$/, "");
                I.byLabel[lab] = +((I.byLabel[lab] || 0) + dt * 60).toFixed(1);
                I.byDay[day()] = +((I.byDay[day()] || 0) + dt * 60).toFixed(1);
            }
            // stuck: nothing moved forward for STUCK_HOURS game hours
            if (FAB.paused) { FAB.lastKeyAt = t; return; }   // (paused by the watcher: no clock of being stuck)
            const k = FAB.progressKey();
            if (k !== FAB.lastKey || FAB.lastKeyAt === null || t < FAB.lastKeyAt) { FAB.lastKey = k; FAB.lastKeyAt = t; if (FAB.stuck && !FAB.stuck.manual) FAB.stuck = null; }
            else if (!FAB.stuck && t - FAB.lastKeyAt >= FAB.STUCK_HOURS) {
                FAB.stuck = { since: FAB.lastKeyAt, at: t, day: day(), clock: clock(), doing: FAB.doing, why: FAB.why, map: mapId(), mapName: mapName(mapId()), pos: [P().x, P().y],
                    tracked: trackedInfo(), log: FAB.log.slice(-12), key: k };
                say("UTKNĄŁEM: " + FAB.doing + " (" + FAB.STUCK_HOURS + " godz. gry bez postępu)");
                if (FAB.onStuck) FAB.onStuck(FAB.stuck);
            }
        } catch (e) { FAB.rep.errors.push(String(e && e.stack || e).slice(0, 300)); }
    }, 500);
    // saves: AP's autosave (slot 0, every 3 min) only when it is safe (AP.saveOk); our own safe saves after each night's sleep (slots
    // 10-12 in turn). After a death the newest of them; a slot that let him die again soon after is skipped next time.
    AP.saveOk = () => { try { return hpRatio() >= 0.8 && !foesNear(12).length && !inUnder() && !busy(); } catch (e) { return false; } };
    FAB.SAFE_SLOTS = [10, 11, 12];
    FAB.safeSave = function() {
        if (!$gameSystem.isSaveEnabled() || !AP.saveOk()) return false;
        const slot = FAB.SAFE_SLOTS[day() % FAB.SAFE_SLOTS.length];
        $gameSystem.onBeforeSave();
        DataManager.saveGame(slot).then(() => say("zapis bezpieczny (slot " + slot + ")")).catch(() => {});
        return true;
    };
    FAB.badSlots = FAB.badSlots || {};
    FAB.reloadLatest = async function() {
        try {
            const info = DataManager._globalInfo || [];
            // (died again within 3 game hours of the last reload: that save is a trap - the next older one)
            if (FAB.lastReload && now() - FAB.lastReload.t < 3) FAB.badSlots[FAB.lastReload.slot] = FAB.lastReload.ts;
            // (two deaths close together: the game's own autosave of the map change - slot 0, made whatever the health - is not trusted
            // for a while; the safe saves after a night's sleep or before going down are)
            FAB.deathTimes = (FAB.deathTimes || []).filter(t => now() - t < 6).concat([now()]);
            const onlySafe = FAB.deathTimes.length >= 2 && FAB.SAFE_SLOTS.some(i => info[i]);
            let best = -1, ts = -1;
            for (let i = 0; i < info.length; i++) {
                if (!info[i] || !(i === 0 || FAB.SAFE_SLOTS.includes(i)) || (onlySafe && i === 0)) continue;
                if (FAB.badSlots[i] && FAB.badSlots[i] === info[i].timestamp) continue;
                if (info[i].timestamp > ts) { ts = info[i].timestamp; best = i; }
            }
            if (best < 0) return false;
            await DataManager.loadGame(best);
            $gameSystem.onAfterLoad();
            $gamePlayer.reserveTransfer($gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, $gamePlayer.direction(), 0);
            $gamePlayer.requestMapReload();
            SceneManager.goto(Scene_Map);
            FAB.lastReload = { slot: best, ts, t: now() };
            FAB.restart();
            say("wczytany zapis " + best);
            return true;
        } catch (e) { say("wczytanie nieudane: " + e.message); return false; }
    };
    FAB.restart = function() {
        AP.stop();
        AP.restartWith = [["fabula"]]; AP.noNightSleep = true; AP.wantPlay = false; AP.freeWalk = true;
        AP.run([["fabula"]]);
        FAB.on = true;
    };
    FAB.start = function(o) {
        Object.assign(FAB, o || {});
        if (window.Needs && Needs.setEnabled) Needs.setEnabled(true);
        FAB.restart();
        return true;
    };
    // a stall's second remedy: a few steps to a random free tile, then the brain from the start
    AP.TASKS.fabula_unstick = function* () {
        const f = L.field(P().x, P().y), cand = [];
        for (let y = P().y - 10; y <= P().y + 10; y++) for (let x = P().x - 10; x <= P().x + 10; x++) {
            const d = Math.hypot(x - P().x, y - P().y);
            if (d >= 4 && $gameMap.isValid(x, y) && isFinite(f.at(x, y))) cand.push([x, y]);
        }
        if (cand.length) { const [x, y] = cand[Math.floor(Math.random() * cand.length)]; say("obejście utknięcia: kilka kroków na " + x + "," + y); yield* L.walkTo(x, y, f); }
        return true;
    };
    FAB.unstickWalk = function() { AP.stop(); AP.restartWith = [["fabula"]]; AP.run([["fabula_unstick"], ["fabula"]]); FAB.on = true; return true; };
    FAB.stop = function() { FAB.on = false; AP.stop(); L.releaseAll(); return true; };
    return "ok v" + VERSION;
})();
