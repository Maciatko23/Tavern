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
    // (2026-11-16 the new world: grandpa's hut Map224 in Podgrodzie Map218 - his plot is on it -, Kruczogród Map220, the manor Map221;
    // the maps meet edge to edge: graf.js gives the seams as exits "seam")
    const MAP = { house: 224, yard: 218, field: 218, town: 220, tavern: 1, manor: 221, cellar: 9 };
    const KETTLE = /Palenisko z kotłem|Kocioł/i, BED = /^Posłanie \(sen\)/, COUNTER = [14, 17];
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

    // ------------------------------------------------------------------ złoto według źródeł (2026-11-17): każda zmiana sakiewki i skąd przyszła
    // (Game_Party.gainGold - loseGold goes through it too). The source: the plan's own word (FAB.goldCtx: a shift, the debt, a camp),
    // else the scene (the quest board, a shop), the bandits' robbery, the underground, a talk or a quest's event. A save loaded after a
    // death takes back what was earned since it: counted apart (FAB.rep.ledger.reload).
    function goldSource(d) {
        if (FAB.goldCtx) return FAB.goldCtx;
        const sc = SceneManager._scene, n = sc ? sc.constructor.name : "";
        if (n === "Scene_TavernShift") return "zmiany";
        if (n === "Scene_QuestBoard") return "zlecenia";
        if (n === "Scene_BronSklep") return d > 0 ? "sprzedaż" : "zakupy";
        if (window.Humans && Humans.robbery) return "obrabowany";
        if (window.Underground && Underground.isUnderground && Underground.isUnderground(mapId())) return "podziemia";
        if (busy()) return d > 0 ? "zadania i rozmowy" : "wydatki w rozmowach";
        return d > 0 ? "inne" : "inne wydatki";
    }
    const ledger = () => (FAB.rep.ledger = FAB.rep.ledger || { since: { day: day(), hour: +hour().toFixed(2) }, in: {}, out: {}, n: {}, reload: 0, log: [] });
    FAB.onGold = function(d) {
        if (!d || FAB.loadingSave) return;
        const lg = ledger(), src = goldSource(d), side = d > 0 ? lg.in : lg.out;
        side[src] = (side[src] || 0) + Math.abs(d);
        lg.n[src] = (lg.n[src] || 0) + 1;
        lg.log.push([day(), +hour().toFixed(2), src, d, mapId()]);
        if (lg.log.length > 400) lg.log.splice(0, 100);
    };
    if (!FAB.goldHooked) {
        FAB.goldHooked = true;
        const _gainGold = Game_Party.prototype.gainGold;
        Game_Party.prototype.gainGold = function(amount) {
            const g0 = this._gold, r = _gainGold.apply(this, arguments);
            try { if (window.FAB && FAB.onGold && this === $gameParty) FAB.onGold(this._gold - g0); } catch (e) { /* (only the counting) */ }
            return r;
        };
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
        // (2026-11-18: a menu that comes back after each answer - a hall guest's „Kim jesteś?” - was asked 97 times in a row: the
        // same menu a third time within a minute and the policy says goodbye)
        const key = labels.join("|");
        const rep = FAB._menuRep && FAB._menuRep.key === key && AP.frame - FAB._menuRep.at < 60 * 60 ? FAB._menuRep : (FAB._menuRep = { key, n: 0, at: 0 });
        rep.n++; rep.at = AP.frame;
        if (i < 0 && rep.n >= 3) { const j = labels.findIndex(l => LEAVE.test(l)); i = j >= 0 ? j : labels.length - 1; why = (why ? why + "; " : "") + "to samo menu " + rep.n + ". raz - koniec rozmowy"; }
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
                const nx = x + dx, ny = y + dy, k = ny * W + nx;
                if (!$gameMap.isValid(nx, ny) || set.has(k)) continue;
                // (2026-11-19: Mosty.js's bridges - over the deck by its ends, along the bed under it: either level lets him)
                const MO = window.Mosty && Mosty.heroStep && (Mosty.at(x, y) || Mosty.at(nx, ny)) ? Mosty : null;
                if (MO) { const a = MO.heroStep(x, y, d, 0), b = MO.heroStep(x, y, d, 1); if (!((a && a.ok) || (b && b.ok))) continue; }
                else if (!$gameMap.isPassable(x, y, d) || !$gameMap.isPassable(nx, ny, 10 - d)) continue;
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
        // (2026-11-17: the tavern's store behind the loose brick opens into the kitchen, whose doormat 14,10 leads to the hall 14,14 - a
        // door within the same map is the way out of such a "room", not a fault: he walks out through it like a player)
        const inner = $gameMap.events().find(e => { const pg = e.page(); return pg && near(e.x, e.y) && pg.list.some(c => c.code === 201 && c.parameters[0] === 0 && c.parameters[1] === mapId()); });
        if (inner) {
            const trig = inner.page().trigger, name = (inner.event() && inner.event().name) || String(inner.eventId());
            say("wychodzę przez: " + name + " (" + inner.x + "," + inner.y + ")");
            if (yield* approach([[inner.x, inner.y]])) {
                if (trig === 0) yield* L.press("ok");
                else { for (let n = 0; n < 90 && !P().isTransferring() && !busy(); n++) { L.setMove(L.keysToward(inner.x - P()._realX, inner.y - P()._realY)); yield; } L.setMove([]); }
                for (let n = 0; n < 180 && (P().isTransferring() || $gameMap.isEventRunning()); n++) yield;
                yield* L.wait(10);
                if (regionFrom(P().x, P().y, 600).size >= 600) return true;
            }
        }
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
        // (the new world's seams of this map: only the edge cells one can stand on)
        for (const x of byMap(here)) if (x.trig === "seam" && $gameMap.isValid(x.x, x.y) && [2, 4, 6, 8].some(d => $gameMap.isPassable(x.x, x.y, d))) out.push(x);
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
        if (x.trig === "seam") {   // (the new world: to the edge cell, then on off the edge - the neighbour map takes over)
            const spot = yield* approach([[x.x, x.y]]);
            if (!spot) { say("nie dojdę do krawędzi (" + x.x + "," + x.y + ")"); FAB.blocked[blockKey(x)] = now() + 0.5; return false; }
            const key = { E: "right", W: "left", N: "up", S: "down" }[x.side];
            for (let n = 0; n < 240 && mapId() === from && !P().isTransferring() && !busy(); n++) { L.setMove([key]); yield; }
            L.setMove([]);
        } else if (x.trig === 0) {   // a door on the action button (the loose brick...)
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
        if (mapId() === ((window.Farming && Farming.HUT_MAP) || 100) && target !== mapId()) yield* AP.TASKS.leaveHut();   // (his own hut: out over the doormat first)
        const r0 = mapId() !== target ? routeInfo(target) : null, t0 = now(), f0 = FAB.rep.choices.length;
        let waited = false;
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
            // (2026-11-16: day 20 "brak drogi do TAWERNA" - the tavern's door had not let him through a moment before - someone in it -
            // and was held shut for two hours) an exit held shut after a failed try: a quarter of an hour aside, then all exits again
            if (!r && !waited && Object.keys(FAB.blocked).some(k => FAB.blocked[k] > now())) {
                waited = true;
                say("przejście chwilę nie puszcza (ktoś w drzwiach?) - kwadrans i próbuję znowu");
                for (let n = 0, until = now() + 0.25; n < 300 && now() < until; n++) yield* idle(60);   // (a quarter of the game's hour)
                FAB.blocked = {};
                continue;
            }
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
            const r = FoodTable.get(it.id), held = AP.hold ? AP.hold(it.id) : 0;   // (a contract's goods: not eaten - qbHold)
            if (!r || !r.eat || r.raw || $gameParty.numItems(it) <= held) continue;
            out.push({ id: it.id, fed: r.fed || 0, water: r.water || 0, stamina: r.stamina || 0, n: $gameParty.numItems(it) - held });
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
    // (2026-11-17, the player: "a gracz robi wiadra, beczki, garnki i zbiera wodę?") his own well on the plot (Farming "well": 12 stone,
    // 3 planks, a Lina and a forged bucket over a dug 2x2 pit - AP.PLAN "Studnia", buildWell): no ration there - he drinks his fill
    // and fills the skin before every trip down; the town's well (2 draws a day) only when he is in town anyway
    const ownWell = () => builtOn(MAP.field).find(b => b.type === "well") || null;
    const wellLeft = () => (ownWell() ? 99 : townWellLeft());
    function townWellLeft() {
        try {
            const R = (Farming.farm().rations) || {}, rk = Object.keys(R).find(k => k.indexOf(MAP.town + ":") === 0 && /Studnia/.test(k));
            const rec = rk ? R[rk] : null;
            const today = Farming.today ? Farming.today() : day();
            // (and his own count of attempts: a draw that gave nothing used to loop well <-> tavern for hours)
            const mine = FAB.well.day === day() ? FAB.well.n : 0;
            return Math.min(rec && rec.day === today ? Math.max(0, 2 - rec.n) : 2, Math.max(0, 2 - mine));
        } catch (e) { return FAB.well.day === day() ? Math.max(0, 2 - FAB.well.n) : 2; }
    }
    // the waterskin (the player 2026-11-17: "to musi bukłak napełniony nosić"): Needs' skin, 4 sips of 35 water; one draw of the town's
    // well fills it whole; drunk with G down there
    const SKIN = 129, skinOwned = () => count(SKIN) > 0, skinSips = () => { try { return Needs.skinCharges(); } catch (e) { return 0; } },
        skinMax = () => { try { return Needs.SKIN.max; } catch (e) { return 4; } }, skinWater = () => skinSips() * ((window.Needs && Needs.SKIN && Needs.SKIN.sip) || 35);
    function* fillSkinWell() { return yield* drinkWell("Napełnij bukłak"); }
    // a sip from the skin, as a player: the G key (Needs: drink)
    function* sipSkin() {
        const n0 = skinSips();
        L.key("drink", true); yield; yield; L.key("drink", false);
        for (let n = 0; n < 30 && skinSips() === n0; n++) yield;
        say(skinSips() < n0 ? "napił się z bukłaka (woda " + Math.round(needs().water) + ", zostało " + skinSips() + ")" : "bukłak nie dał wody");
        return skinSips() < n0;
    }
    // the skin's way (no shop sells one): the tannery on the plot, a raw hide (the snares, the dog, a carcass) tanned there, 3 fibre, by hand
    const tanneryUp = () => builtOn(MAP.field).some(b => b.type === "tannery");
    function* makeSkin(why) {
        if (!tanneryUp()) {
            setDoing("Stawiam garbarnię (na bukłak)", why);
            yield* fieldWork(["Garbarnia"], () => tanneryUp() || hour() >= 20.5 || hour() < 5.5, why);
            if (!tanneryUp()) return false;
        }
        if (count(97) < 1) {
            if (!(yield* goMap(MAP.field, why))) return false;
            yield* AP.TASKS.collectJobs();
            if (count(97) < 1) {
                // (a raw hide: the snares on the plot - bait in, the rabbit out and dressed - and any carcass lying near)
                if (count(96) < 1) { setDoing("Doglądam wnyków (skóra na bukłak)", why); yield* AP.TASKS.tend(); yield* AP.TASKS.dressCarcasses(); }
                if (count(96) < 1) { say("bukłak: nie mam surowej skóry (wnyki, pies, upolowane zwierzę)"); return false; }
                setDoing("Wyprawiam skórę w garbarni (na bukłak)", why);
                yield* AP.TASKS.craft("tannery", "Wyprawiaj skórę");
                yield* AP.TASKS.collectJobs();
            }
            if (count(97) < 1) { say("bukłak: skóra się wyprawia - odbiorę ją później"); return false; }
        }
        if (count(92) < 3) yield* AP.TASKS.collect({ 92: 3 }, 20);
        if (count(92) < 3) { say("bukłak: brak 3 włókien lnu"); return false; }
        setDoing("Robię bukłak (skóra i len)", why);
        yield* AP.TASKS.handCraft("Zrób bukłak");
        if (skinOwned()) { say("zrobił bukłak"); note("notes", { what: "zrobił bukłak (" + skinMax() + " łyki) - woda na podziemia" }); }
        return skinOwned();
    }
    function* drinkWell(entry) {
        entry = entry || "Napij się";
        if (ownWell() && !((mapId() === MAP.town || mapId() === MAP.tavern) && townWellLeft() > 0)) return yield* drinkOwnWell(entry);
        setDoing(entry === "Napij się" ? "Piję ze studni miejskiej" : "Napełniam bukłak przy studni miejskiej", "woda " + Math.round(needs().water) + ", bukłak " + skinSips() + "/" + skinMax() + " (2 nabrania dziennie)");
        if (!(yield* goMap(MAP.town, "woda"))) return false;
        const wells = $gameMap.events().filter(e => /<Studnia:/i.test((e.event() && e.event().note) || ""));
        if (!wells.length) { note("unclear", { what: "brak studni na mapie miasta" }); return false; }
        yield* combatOff();
        const spot = yield* approach(wells.map(e => [e.x, e.y]));
        if (!spot) return false;
        yield* L.press("ok");
        const ok = yield* L.choose(entry);
        yield* L.wait(entry === "Napij się" ? 20 : 60);
        yield* L.closeMenus();
        if (FAB.well.day !== day()) FAB.well = { day: day(), n: 0 };
        FAB.well.n++;
        say(entry !== "Napij się" ? (ok ? "napełnił bukłak przy studni (" + skinSips() + "/" + skinMax() + ")" : "studnia nie napełniła bukłaka") : ok ? "napił się ze studni (woda " + Math.round(needs().water) + ")" : "studnia nie dała wody");
        return ok;
    }
    function* drinkOwnWell(entry) {
        const drink = entry === "Napij się";
        setDoing(drink ? "Piję z własnej studni (działka)" : "Napełniam bukłak przy własnej studni (działka)", "woda " + Math.round(needs().water) + ", bukłak " + skinSips() + "/" + skinMax() + " (bez przydziału)");
        if (!(yield* goMap(MAP.field, "woda ze studni na działce"))) return false;
        const b = ownWell();
        if (!b) return false;
        yield* combatOff();
        const tiles = Farming.tilesOfBuilding(b.type, b.x, b.y).map(t => [t.x, t.y]);
        const w0 = needs().water, s0 = skinSips();
        for (let n = 0; n < (drink ? 3 : 1); n++) {   // (a drink is +40: to the full in two or three)
            if (!(yield* approach(tiles))) break;
            const w1 = needs().water;
            yield* L.press("ok");
            const ok = yield* L.choose(entry);
            yield* L.wait(drink ? 20 : 60);
            yield* L.closeMenus();
            if (!ok || !drink || needs().water <= w1 || needs().water >= 90) break;
        }
        const ok = drink ? needs().water > w0 : skinSips() > s0;
        say(drink ? (ok ? "napił się z własnej studni (woda " + Math.round(needs().water) + ")" : "własna studnia nie dała wody") : ok ? "napełnił bukłak przy własnej studni (" + skinSips() + "/" + skinMax() + ")" : "własna studnia nie napełniła bukłaka");
        return ok;
    }
    // the own well, as the player would: AP.PLAN's "Studnia" (the shovel's pit, the bucket from the forge, the Lina of ten strings,
    // stone and planks - obtained the plan's way); once a day before the trips down, given up after 6 days without it
    function* buildOwnWell(why) {
        FAB.wellDay = day();
        const ok = yield* fieldWork(["Studnia"], () => !!ownWell() || hour() >= 20.5 || hour() < 5.5, why);
        if (ownWell()) { note("notes", { what: "zbudował własną studnię na działce - woda bez przydziału" }); say("studnia na działce stoi"); return true; }
        FAB.wellFails = (FAB.wellFails || 0) + 1;
        if (FAB.wellFails >= 6) { FAB.wellGaveUp = true; note("unclear", { what: "własna studnia: 6 dni bez skutku (" + ((AP.PLAN || []).find(g => g.n === "Studnia") || {}).fails + " nieudanych prób planu)" }); }
        return ok;
    }
    // the bigger skin (the tannery: a tanned hide and two sinews - 8 sips instead of 4): once a day when the things are there or near
    // (the plot's snares, a carcass); the skin stays the same item
    const skinBig = () => { try { return !!Needs.skinBig(); } catch (e) { return true; } };
    function* enlargeSkin(why) {
        FAB.skinBigDay = day();
        if (!(yield* goMap(MAP.field, why))) return false;
        yield* AP.TASKS.collectJobs();
        if (count(163) < 2 || count(97) < 1 && count(96) < 1) { yield* AP.TASKS.tend(); yield* AP.TASKS.dressCarcasses(); }
        if (count(97) < 1 && count(96) > 0) { yield* AP.TASKS.craft("tannery", "Wyprawiaj skórę"); yield* AP.TASKS.collectJobs(); }
        if (count(97) < 1 || count(163) < 2) { say("większy bukłak: brak " + (count(97) < 1 ? "wyprawionej skóry" : "") + (count(97) < 1 && count(163) < 2 ? " i " : "") + (count(163) < 2 ? "2 ścięgien" : "")); return false; }
        setDoing("Powiększam bukłak w garbarni (8 łyków)", why);
        yield* AP.TASKS.craft("tannery", "Powiększ bukłak");
        yield* AP.TASKS.collectJobs();
        if (skinBig()) { note("notes", { what: "powiększył bukłak: " + skinMax() + " łyków - woda na dłuższe zejścia" }); say("bukłak powiększony (" + skinMax() + " łyków)"); }
        return skinBig();
    }
    function* takeSoup() {
        const before = count(SOUP);
        const kettle = $gameMap.events().find(e => KETTLE.test((e.event() && e.event().name) || ""));
        yield* talkTo(kettle ? kettle.eventId() : 1, {});   // (2026-11-17: the event's own tiles - "tiles" are the event's, the old 5,5 made him face the floor)
        FAB.soupDay = day();
        say(count(SOUP) > before ? "kapuśniak w plecaku (" + count(SOUP) + ")" : "kocioł nie dał kapuśniaku");
        return true;
    }
    // (the night's hours do not count towards "stuck": the clock of no progress moves on by them - the morning's wait was the one
    // that tipped it over the 16 hours each day)
    function sleptOff(hrs) { if (hrs > 1 && hrs < 30 && FAB.lastKeyAt !== null) FAB.lastKeyAt += hrs; }
    // (2026-11-16 the new world's "Wezwanie króla": on day 3 grandpa is summoned before his hut, the hut is sealed from dusk, and with
    // grandpa's letter Szczepan Kołodziej takes the hero into the stable's hay loft - Map181, the loft event 3250, "Prześpij noc")
    const STABLE = 181, LOFT = 3250;
    const wezNow = () => (window.Story && Story.wezwanie ? Story.wezwanie() : null);
    const homeSealed = () => { const z = wezNow(); return !!(z && z.sealed); };
    function* sleepStable() {
        if (!(yield* goMap(STABLE, "sen na stryszku"))) return false;
        const d0 = day(), t0 = now();
        const loft = $gameMap.event(LOFT);
        if (!loft) { note("unclear", { what: "brak stryszka w stajni (zdarzenie " + LOFT + ")" }); return false; }
        const r = yield* talkTo(LOFT, { picks: ["Prześpij noc"] });
        for (let n = 0; n < 600 && !(SceneManager._scene instanceof Scene_Map && onMapReady()); n++) yield;
        yield* drive({});
        sleptOff(now() - t0);
        say("spał na stryszku w stajni (dzień " + d0 + " → " + day() + ", " + clock() + ")");
        FAB.safeSave();
        return r.ok;
    }
    function* sleepHome() {
        if (!(yield* goMap(MAP.house, "sen"))) return false;
        const d0 = day(), t0 = now();
        // (2026-11-17 run: the bed is the events 10/11 at 1,4 / 1,5 - the old tiles 2,4 / 2,5 were the floor beside it, he pressed O at
        // nothing and "slept" every 5 minutes for 87 hours awake) the bed's own tiles; slept = the clock jumped
        const beds = $gameMap.events().filter(e => BED.test((e.event() && e.event().name) || ""));
        const bedTiles = beds.length ? beds.map(e => [e.x, e.y]) : [[1, 4], [1, 5]];
        const r = yield* talkTo(() => beds[0] || $gameMap.event(10), { tiles: bedTiles, picks: ["Spać"] });
        for (let n = 0; n < 600 && !(SceneManager._scene instanceof Scene_Map && onMapReady()); n++) yield;
        yield* drive({});
        const slept = now() - t0 > 2;
        sleptOff(now() - t0);
        if (!slept) {
            FAB.homeBedNo = now() + 12;
            say("łóżko dziadka nie dało spać (" + clock() + ") - inny nocleg");
            note("unclear", { what: "sen u dziadka: „Posłanie (sen)” nie dało spać o " + clock() });
            if (hasBedroll() && (yield* goMap(MAP.field, "sen"))) return yield* sleepField();
            return yield* campSleep("sen");
        }
        say("spał (dzień " + d0 + " → " + day() + ", " + clock() + ", wytrzymałość " + Math.round(stamina()) + ")");
        FAB.safeSave();
        return r.ok;
    }

    // ------------------------------------------------------------------ rozdział 1: działka, praca, zmiany, spłata
    const borgarCounter = () => ($gameMap.mapId() === MAP.tavern ? $gameMap.event(52) || (window.Story && Story.borgarEvent()) : null);
    function* toCounter() {
        if (!(yield* goMap(MAP.tavern, "Borgar"))) return false;
        return !!(yield* approach([COUNTER]));
    }
    function shiftOpen() {
        const s = S();
        return s && s.flags.hired && s.shiftDay !== day() && FAB.shiftTried !== day() && hour() < 20.6 && stamina() >= 15;
    }
    function installShiftBot() {
        // (2026-11-18: in the tavern a shift is played on the map, Zmiana_Sala.js - this bot plays the shift's scene: asked for in so many words)
        // (2026-11-18: in the tavern the shift is played live on the map, Zmiana_Sala.js - playLiveShift below walks it; FAB.sceneShift =
        // true asks for the old scene instead. The close-ups (keg, stove) and the summary are still the scene: this bot plays them)
        if (FAB.sceneShift && !TavernShift.start._scene) { const s0 = TavernShift.start; TavernShift.start = o => s0(Object.assign({ scene: true }, o || {})); TavernShift.start._scene = true; }
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
    // (2026-11-18) the shift played LIVE on the tavern's map (Zmiana_Sala.js): the hero walks the real hall as a player would - the dirty
    // tables (O held), the rubbish into the kitchen's bin, the wood from the pile by the entrance to a fireplace, the barrels behind the
    // bar and the stove behind the kitchen door (their close-ups and the summary: the scene bot above), the evening's orders carried
    // from the counter to the guests (the most impatient first), a log when the fire is low, a wipe when nobody waits
    function* playLiveShift() {
        const Z = window.ZmianaSala;
        const st = () => Z.state();
        function* go(x, y, d) { const ok = yield* L.walkTo(x, y); if (d) $gamePlayer.setDirection(d); yield* L.wait(4); return ok; }
        // (O only while the shift lasts: just after its end the same press at a seat started a guest's talk)
        function* tap() { if (!TavernShift.liveRunning()) return; yield* L.press("ok"); yield* L.wait(6); }
        // (2026-11-19: each fireplace burns on its own - before opening the one still short of its logs, in the evening the lower one)
        const FIREPLACES = [[5, 14, 4], [23, 14, 6]];
        const nearFire = () => {
            const s = st(), d = i => Math.hypot($gamePlayer.x - FIREPLACES[i][0], $gamePlayer.y - FIREPLACES[i][1]);
            let pick = [0, 1].sort((a, b) => d(a) - d(b));
            if (s && s.phase === "clean" && s.wood && s.wood.at) { const short = pick.filter(i => s.wood.at[i] < s.wood.each); if (short.length) pick = short; }
            else if (s && s.fires) pick = [0, 1].sort((a, b) => s.fires[a] - s.fires[b]);
            return FIREPLACES[pick[0]];
        };
        // a free cell beside a table (8 round it), the nearest to the hero
        const standBy = tb => {
            let best = null, bd = 1e9;
            for (let y = tb.y0 - 1; y <= tb.y1 + 1; y++) for (let x = tb.x0 - 1; x <= tb.x1 + 1; x++) {
                if (x >= tb.x0 && x <= tb.x1 && y >= tb.y0 && y <= tb.y1) continue;
                if (!$gameMap.checkPassage(x, y, 0x0f) || $gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority())) continue;
                const d = Math.hypot(x - $gamePlayer.x, y - $gamePlayer.y);
                if (d < bd) { bd = d; best = [x, y, y < tb.y0 ? 2 : y > tb.y1 ? 8 : x < tb.x0 ? 6 : 4]; }
            }
            return best;
        };
        function* wipe(tb) {
            const at = standBy(tb);
            if (!at) return false;
            setDoing("Zmiana: przecieram stół", "stół brudny - goście siadają tylko przy czystych");
            if (!(yield* go(at[0], at[1], at[2]))) return false;
            L.key("ok", true); yield* L.wait(72); L.key("ok", false); yield* L.wait(6);
            return true;
        }
        function* putOnFire(depth = 0) {
            const f = nearFire(), fi = FIREPLACES.indexOf(f);
            setDoing("Zmiana: dokładam do kominka", fi ? "prawy kominek" : "lewy kominek");
            if (!(yield* go(f[0], f[1], f[2]))) return false;
            for (let i = 0; i < 3 && st() && st().carry[0] === "log"; i++) {
                const s = st();   // (before opening: this one has its share and the other one has not - the log goes there)
                if (s.phase === "clean" && s.wood && s.wood.at && s.wood.at[fi] >= s.wood.each && s.wood.at.some(v => v < s.wood.each)) break;
                // (the evening, 2026-11-19: both logs went into one fireplace and the other half of the hall stayed cold - after one log the
                // next goes to the other fireplace when that one burns no higher)
                if (i > 0 && s.phase !== "clean" && s.fires && s.fires[1 - fi] <= s.fires[fi]) break;
                yield* tap();
            }
            if (st() && st().carry[0] === "log" && depth < 1) return yield* putOnFire(depth + 1);
            return true;
        }
        function* wood(n) {
            setDoing("Zmiana: idę po drewno", "stos przy kominku koło wejścia");
            if (!(yield* go(21, 37, 8))) return false;
            for (let i = 0; i < n; i++) yield* tap();
            return yield* putOnFire();
        }
        // a dish to a seated guest: from his chair's aisle, else any free cell round his chair; O only when the game offers "give" there
        // (another waiting guest nearer to the hero would take the press: then the next cell)
        function* deliver(g) {
            const seat = GoscieSala.shift.seats().find(q => q.x === g.seat[0] && q.y === g.seat[1]);
            const cells = seat ? [[seat.ax, seat.ay, seat.side === 6 ? 6 : 4]] : [];
            for (const [dx, dy] of [[-1, 0], [1, 0], [0, 1], [0, -1], [-1, 1], [1, 1], [-1, -1], [1, -1]]) cells.push([g.seat[0] + dx, g.seat[1] + dy, 0]);
            for (const [x, y, d] of cells) {
                if (!$gameMap.isValid(x, y) || !$gameMap.checkPassage(x, y, 0x0f) || $gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority())) continue;
                if (!(yield* go(x, y, d || null))) continue;
                const tg = st() && st().target;
                if (tg && tg.kind === "give") { yield* tap(); return true; }
                const now = st() && st().guests.find(q => q.id === g.id);
                if (!now || now.state !== "wait") return false;   // (he left meanwhile)
            }
            return false;
        }
        // the kitchen: through the door behind the bar (a transfer on the same map) and back
        function* intoKitchen() {
            if ($gamePlayer.y <= 11) return true;
            yield* go(14, 14, 8);
            for (let i = 0; i < 40 && $gamePlayer.y > 11; i++) { L.key("up", true); yield* L.wait(4); L.key("up", false); yield* L.wait(6); }
            yield* L.wait(30);
            return $gamePlayer.y <= 11;
        }
        function* outOfKitchen() {
            if ($gamePlayer.y > 11) return true;
            yield* go(14, 9, 2);   // (the exit's own cell (14,10) is a crossing: walkTo never aims at one - the last step is a key)
            for (let i = 0; i < 40 && $gamePlayer.y <= 11; i++) { L.key("down", true); yield* L.wait(4); L.key("down", false); yield* L.wait(6); }
            yield* L.wait(30);
            return $gamePlayer.y > 11;
        }
        let guard = 0, phase = "", since = AP.frame;
        while (TavernShift.liveRunning() && guard++ < 4000) {
            if (TavernShift.isRunning() || !(SceneManager._scene instanceof Scene_Map)) { yield* L.wait(10); continue; }   // (a close-up / the summary: the scene bot)
            if ($gameMap.isEventRunning() || $gameMessage.isBusy()) { yield* L.press("ok"); yield* L.wait(12); continue; }   // (Borgar's words)
            const s = st();
            if (!s) break;
            if (s.phase !== phase) { phase = s.phase; since = AP.frame; }
            if (AP.frame - since > 60 * 60 * 6) { say("zmiana: utknąłem w części " + phase + " - pomijam"); Z.skip(); since = AP.frame; continue; }
            const carry = s.carry[0];
            if (s.phase === "intro" || s.phase === "end") { yield* L.wait(20); continue; }
            if (s.phase === "clean") {
                // (the rubbish into the kitchen's bin, right of the door from the hall: from the door's cell, facing it)
                if (carry === "sack") { setDoing("Zmiana: wyrzucam śmieci", "kosz w kuchni"); if (yield* intoKitchen()) { yield* go(14, 9, 6); yield* tap(); } else yield* L.wait(30); continue; }
                if ($gamePlayer.y <= 11) { yield* outOfKitchen(); continue; }
                if (carry === "log") { yield* putOnFire(); continue; }
                const dirty = s.tables.filter(t => s.dirty.includes(t.id));
                if (dirty.length) {
                    dirty.sort((a, b) => Math.hypot(a.x0 - $gamePlayer.x, a.y0 - $gamePlayer.y) - Math.hypot(b.x0 - $gamePlayer.x, b.y0 - $gamePlayer.y));
                    if (!(yield* wipe(dirty[0]))) yield* L.wait(30);
                    continue;
                }
                // (2026-11-19: the wood before the rubbish - at level 5 the time ran out on the sacks and the right fireplace stayed cold all
                // evening: guests there lose patience 1.5x faster)
                if (s.wood.done < s.wood.need) { yield* wood(Math.min(2, s.wood.need - s.wood.done)); continue; }
                const sack = s.sacks.find(q => q.state === "lying");
                if (sack) { setDoing("Zmiana: zbieram śmieci", "worki i kubły z sali"); yield* go(sack.x, sack.y); yield* tap(); continue; }
                yield* L.wait(20);
                continue;
            }
            if (s.phase === "beer") {
                if ($gamePlayer.y <= 11) { yield* outOfKitchen(); continue; }
                setDoing("Zmiana: nalewam piwo", "beczki za barem");
                yield* go(11, 15, 8); yield* tap(); yield* L.wait(30);
                continue;
            }
            if (s.phase === "kitchen") {
                setDoing("Zmiana: gotuję z Jagną", "kuchnia za drzwiami za barem");
                if (!(yield* intoKitchen())) { yield* L.wait(30); continue; }
                yield* go(9, 6, 8); yield* tap(); yield* L.wait(30);
                continue;
            }
            if (s.phase === "serve") {
                if ($gamePlayer.y <= 11) { yield* outOfKitchen(); continue; }
                const waiting = s.guests.filter(g => g.state === "wait").sort((a, b) => a.patience - b.patience);
                const want = [];
                for (const g of waiting) g.order.forEach((k, i) => { if (!g.got[i]) want.push({ g, k }); });
                // (2026-11-19: he always ran to the guest with the least patience - who left before he got there - and then on with the same
                // dishes to the next one: 1 of 19 served at level 5. Now: who can still be reached in time, the most urgent of those; a
                // frame budget from the tiles to walk)
                const FPT = 1.3 * 256 / Math.pow(2, $gamePlayer.realMoveSpeed()), eta = (seat, from) => (Math.abs(seat[0] - from[0]) + Math.abs(seat[1] - from[1])) * FPT;   // (frames a tile at his real pace, with the turns round tables)
                const slack = (x, from) => x.g.patience - eta(x.g.seat, from);
                const best = (list, from) => { const ok = list.filter(x => slack(x, from) > 30).sort((a, b) => slack(a, from) - slack(b, from)); return ok.length ? ok : list.slice().sort((a, b) => b.g.patience - a.g.patience); };
                // what he holds goes to whoever wants it and can be reached
                if (carry && carry !== "log" && carry !== "sack") {
                    const to = best(want.filter(x => s.carry.includes(x.k)), [$gamePlayer.x, $gamePlayer.y])[0];
                    if (to) {
                        setDoing("Zmiana: niosę zamówienie", "gość czeka (" + Math.round(to.g.patience / 60) + " s cierpliwości)");
                        yield* deliver(to.g);
                        continue;
                    }
                    const slot = s.slots.find(q => q.key === carry);   // (nobody wants it any more: back on the counter)
                    if (slot) { yield* go(slot.tx, 18, 8); yield* tap(); }
                    continue;
                }
                if (carry === "log") { yield* putOnFire(); continue; }
                if (want.length) {
                    // (from the counter: the first for the guest who can still be reached, the second for the same guest or one near him)
                    const order = best(want.filter(x => s.slots.some(q => q.key === x.k)), [14, 18]);
                    const first = order[0];
                    if (!first) { yield* L.wait(20); continue; }
                    const second = order.slice(1).find(x => x.g === first.g) || order.slice(1).find(x => Math.abs(x.g.seat[0] - first.g.seat[0]) + Math.abs(x.g.seat[1] - first.g.seat[1]) <= 4);
                    const pick = [first].concat(second ? [second] : []);
                    setDoing("Zmiana: biorę z lady", pick.map(x => x.k).join(", "));
                    for (const x of pick) { const slot = s.slots.find(q => q.key === x.k); if (slot) { yield* go(slot.tx, 18, 8); yield* tap(); } }
                    continue;
                }
                if (s.fire < 1.2) { yield* wood(2); continue; }
                const dirty = s.tables.filter(t => s.dirty.includes(t.id));
                if (dirty.length) { yield* wipe(dirty[0]); continue; }
                setDoing("Zmiana: czekam na gości przy ladzie", "sala gotowa");
                yield* go(14, 19, 8); yield* L.wait(30);
                continue;
            }
            yield* L.wait(20);
        }
        L.key("ok", false);
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
        let r;
        FAB.goldCtx = "zmiany";
        try {
            r = yield* talkTo(borgarCounter, { tiles: [COUNTER], picks: ["Weź zmianę"], leave: true });
            if (TavernShift.liveRunning && TavernShift.liveRunning()) yield* playLiveShift();
        } finally { FAB.goldCtx = null; }
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
            let r;
            FAB.goldCtx = "spłata długu";
            try { r = yield* talkTo(lordEvent, { picks: [pick], leave: true, strict: true }); } finally { FAB.goldCtx = null; }
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
    // (2026-11-17, the player: "zawsze może budować skrzynie i tam przechowywać rzeczy, a jedzenie do spiżarni") the pantry and a chest
    // as soon as the sawmill gives planks - the bag never fills with food and seeds again
    const PLAN_STORE = ["Mała skrzynia", "Spiżarnia"];
    const PLAN_IRON = PLAN_SPADE.concat(["Piec ziemny", "Kamienny kilof", "Tartak"], PLAN_STORE, ["Cegielnia", "Kuźnia"]);
    const PLAN_FARM = () => PLAN_IRON.concat((AP.PLAN || []).map(g => g.n).filter(n => !PLAN_IRON.includes(n)));   // (the whole homestead, W4's first)
    function* fieldWork(names, until, why, extra) {
        if (!(yield* goMap(MAP.field, why))) return false;
        if (AP.day !== day()) { AP.day = day(); AP.PLAN.forEach(g => { g.fails = 0; }); }
        const inner = (function* () {
            for (let r = 0; r < 400; r++) {
                // (the plan is for the field: gathering by the edge took him over it once - Krawedzie - and the meadow is no place to build)
                if (mapId() !== MAP.field) { say("poza działką (" + mapName(mapId()) + ") - wracam"); if (!(yield* goMap(MAP.field, why))) return false; }
                yield* AP.TASKS.reflexes();
                // (2026-11-16 run: worn out, the workbench said "Jesteś zbyt zmęczony" to every tool for a day and a half - the axe never
                // came, so no wood, no charcoal, no iron, and he only waited by the kiln) tired: a rest first, too tired still - the brain
                // takes over (food, water, sleep)
                if (stamina() < 15) {
                    setDoing("Na działce: odpoczywam (siły " + Math.round(stamina()) + ")", why);
                    yield* AP.TASKS.rest();
                    if (stamina() < 15) { say("za mało sił na pracę (" + Math.round(stamina()) + ") - najpierw jedzenie, woda, sen"); return false; }
                }
                if (now() - (FAB.failReset || 0) >= 2) { FAB.failReset = now(); AP.PLAN.forEach(g => { g.fails = 0; }); }   // (a job done meanwhile: try again)
                const g = AP.PLAN.find(g => names.includes(g.n) && !g.done() && (g.fails || 0) < 3);
                if (!g) {
                    // (one frame a pass: 2026-11-17 runs - autumn, no herbs, gather() found nothing and gave back at once, 400 passes of
                    // whole-map scans went in one frame, the page stood a minute and timeboxed's clock was never asked)
                    if (extra) { const v = yield* extra(); if (v === "dalej") { yield; continue; } return v; }
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
            { id: "bandage", name: "zbieram zioła, krwawnik i włókno - opatrunki na podziemia", where: "field", want: () => FAB.done1 && deepNow < UNDER_GOAL && count(152) < BANDAGES && !FAB.bandageGaveUp && bandageSeason(), run: function* () {
                for (let k = 0; k < 6 && count(152) < BANDAGES; k++) {
                    for (const [id, kind] of [[104, "herb"], [150, "yarrow"], [92, "fiber"]]) if (count(id) < 2) yield* AP.TASKS.gather([kind], 2 - count(id));
                    if (count(104) >= 2 && count(150) >= 2 && count(92) >= 2) yield* AP.TASKS.handCraft("Zrób opatrunek"); else { setBarren(mapId(), "bandage"); return true; }
                }
                return true;
            } },
            { id: "crops", name: "zbieram plony z grządek", where: "field", want: () => ripeCrops(), run: () => AP.TASKS.harvestCrops() },
            // (2026-11-17) a contract from the quest board in hand: its goods gathered / made, its hunt on its map in its animal's hours
            { id: "contract", name: "zlecenie z tablicy: " + qbWorkName(), where: qbWorkWhere(), want: () => !!qbWorkNext(), run: () => qbWork("wolny czas: zlecenie z tablicy") },
            // (the player 2026-11-17: "gracz może względnie wcześniej zasadzić kilka drzew" - run 10 stood a whole day by the forge with
            // "nie ma drzew": every tree of the plot cut. A cone goes into the ground whole (Forestry.js, 10 days to a full pine))
            { id: "pines", name: "sadzę sosny z szyszek (drewno na później)", where: "field",
                want: () => fieldOk && count(CONE) > 0 && plantedPines() < PINES_WANT && stamina() > 30, run: function* () {
                if (!(yield* plantPines(4))) setBarren(mapId(), "pines");
                return true;
            } },
            // (the player 2026-11-16: "pomiędzy czekaniem na zmianę może pracować na działce i budować") the whole farm of AP.PLAN in the
            // free hours - the tools and the forge W4 needs first, then the rest of the homestead (bedroll, campfire, kiln, sawmill, well...)
            { id: "build", name: "buduję na działce (" + ((AP.PLAN || []).find(g => PLAN_FARM().includes(g.n) && !g.done() && (g.fails || 0) < 3) || {}).n + ")", where: "field",
                want: () => fieldOk && (AP.PLAN || []).some(g => !g.done() && (g.fails || 0) < 3), run: () => fieldWork(PLAN_FARM(), () => false, "wolny czas: gospodarstwo na działce (najpierw narzędzia i kuźnia na W4)") },
            // (iron for the homestead - the nails, the hut's 10 iron, the iron tools: the ore is in Krucze Turnie only)
            { id: "ore", name: "kopię rudę żelaza w Kruczych Turniach (żelazo na gospodarstwo)", where: 222,
                want: () => fieldOk && (count(63) > 0 || count(116) > 0) && builtOn(MAP.field).some(b => b.type === "forge") && count(85) < 4 &&
                    (AP.PLAN || []).some(g => !g.done() && Object.keys(g.need || {}).some(id => [86, 88, 117, 119, 120].includes(+id))), run: function* () {
                for (let k = 0; k < 12 && count(85) < 8; k++) {
                    if (stamina() < 15) { yield* AP.TASKS.rest(); if (stamina() < 15) break; }
                    if (!(yield* AP.TASKS.mineOre())) { setBarren(mapId(), "ore"); break; }
                }
                return true;
            } },
            // (a tent for the bag: a bed anywhere - sewn in the tannery once the dog and the snares have brought four hides)
            { id: "tent", name: "szyję namiot w garbarni (nocleg gdziekolwiek)", where: "field",
                want: () => fieldOk && builtOn(MAP.field).some(b => b.type === "tannery") && count(TENT) === 0 && !builtAnywhere("tent") && count(HIDE) >= 4, run: function* () {
                if (!(yield* AP.TASKS.obtain({ 93: 3, 61: 4 }))) return true;
                yield* AP.TASKS.craft("tannery", "Zszyj namiot");
                return true;
            } },
            { id: "sow", name: "sieję na grządkach", where: "field", want: () => count(65) > 0 && count(66) > 0 && stamina() > 40, run: () => AP.TASKS.plantSeeds() },
            { id: "mats", name: "zbieram gałęzie, kamienie i włókno (na narzędzia i naprawy)", where: "any", want: () => count(77) < 20 || count(64) < 20 || count(92) < 20, run: function* () {
                const got = yield* AP.TASKS.collect({ 77: 20, 64: 20, 92: 20 }, 30);
                if (!got) setBarren(mapId(), "mats");
                return true;
            } }
        ];
    }
    // a plan for the free time before `deadline` (an hour of today) at map `target`, or null (too little time / nothing to do)
    // (only: one job's id - the contract window between the trips down)
    function freeTimePlan(deadline, target, label, minOnSite, only) {
        const h = hour(), margin = 0.3, minSite = minOnSite || 0.5;
        if (stamina() < 40 || needUrgent() || inUnder()) return null;
        if (deadline - h - travelH(target) - margin < minSite) return null;
        const jobs = freeJobs().filter(j => (!only || j.id === only) && j.want());
        if (!jobs.length) return null;
        // (the plot, the coast, the mountains: the wild things by the way; a job of one map - the hunt's - its map too. 2026-11-17: the
        // filter had slipped into the comment of this line, so the tavern or the town counted as a place to gather in)
        // (2026-11-19: four deaths in one day gathering berries in Krucze Turnie at level 1-2 - its wolves, boars and bear are level 5:
        // no wild gathering there below its level)
        const places = [...new Set([mapId(), MAP.field, MAP.yard, 222, 219].concat(jobs.filter(j => typeof j.where === "number").map(j => j.where)))]
            .filter(m => !inUnder() && m !== MAP.house && m !== MAP.tavern && m !== MAP.town && m !== MAP.manor && !(PLACE_LV[m] && heroLevel() < PLACE_LV[m] && m !== mapId()));
        let best = null;
        for (const j of jobs) {
            for (const m of places) {
                if (j.where === "field" && m !== MAP.field) continue;
                if (typeof j.where === "number" && m !== j.where) continue;   // (a job of one map: the ore in the mountains)
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
        if (!ok) return homeSealed() ? yield* campSleep("sen") : yield* sleepHome();
        return ok;
    }
    // ---- a camp anywhere (2026-11-16, the player: "jak nie ma gdzie spać to może zebrać materiały na namiot i go gdziekolwiek postawić
    // i się przespać"): the tent from the bag (sewn in the tannery, packed again in the morning), else a forest bed of branches and fibre
    // made where he stands - the tent and the forest bed go up anywhere under the sky (Farming_Data: anywhere)
    const TENT = 121, FOREST_BED = 128, HIDE = 96;
    const builtOn = m => { try { return ((Farming.farm().buildings || {})[m] || []).filter(b => b && !b.site); } catch (e) { return []; } };
    const builtAnywhere = type => { try { return Object.values(Farming.farm().buildings || {}).some(l => (l || []).some(b => b && b.type === type && !b.site)); } catch (e) { return false; } };
    const campHere = () => { const l = builtOn(mapId()); return l.find(b => b.type === "tent") || (mapId() !== MAP.field ? l.find(b => b.type === "bedroll") : null) || null; };
    FAB.campNo = FAB.campNo || {};
    const campOk = () => !((FAB.campNo[mapId()] || 0) > now());
    function* campSleep(why) {
        let bed = campHere();
        if (!bed && count(TENT) > 0) { setDoing("Rozkładam namiot (" + mapName(mapId()) + ")", why); yield* AP.TASKS.camp("tent"); bed = campHere(); }
        if (!bed && !builtAnywhere("bedroll")) {   // (one forest bed in the world: the game's rule)
            if (!count(FOREST_BED) && (count(77) < 10 || count(92) < 10)) { setDoing("Zbieram gałęzie i włókno na leśne legowisko", why); yield* AP.TASKS.collect({ 77: 10, 92: 10 }, 20); }
            if (!count(FOREST_BED) && count(77) >= 10 && count(92) >= 10) yield* AP.TASKS.handCraft("Zrób leśne legowisko");
            setDoing("Kładę leśne legowisko (" + mapName(mapId()) + ")", why);
            yield* AP.TASKS.camp("bedroll");
            bed = campHere();
        }
        if (!bed) {
            FAB.campNo[mapId()] = now() + 8;
            say("nie da się tu rozbić obozu (" + mapName(mapId()) + ")");
            note("notes", { what: "nocleg: nie rozbił obozu na mapie " + mapName(mapId()) + (count(TENT) ? " (namiot w plecaku)" : "") });
            return false;
        }
        const t0 = now(), d0 = day();
        const ok = yield* AP.TASKS.sleep();
        sleptOff(now() - t0);
        if (ok) { say("spał w " + (bed.type === "tent" ? "namiocie" : "leśnym legowisku") + " (" + mapName(mapId()) + ", dzień " + d0 + " → " + day() + ")"); FAB.safeSave(); }
        else FAB.campNo[mapId()] = now() + 2;
        return ok;
    }
    function* borgarTalk(picks) {
        if (!(yield* toCounter())) return false;
        return yield* talkTo(borgarCounter, { tiles: [COUNTER], picks, leave: true });
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
    // ---- iron ore (2026-11-16/17 runs: "nie ma rudy żelaza w zasięgu" for days by the forge): the new world's ore is in the mountains
    // only - Krucze Turnie (Map222, the quarry's veins); with the forge up and a pickaxe, a day trip there for `want` ore
    const ORE_MAP = 222;
    const oreTripOk = () => (count(63) > 0 || count(116) > 0) && builtOn(MAP.field).some(b => b.type === "forge") && hour() >= 5.5 && hour() < 15 && !inUnder();
    function oreTrip(why, want) {
        return { what: "Idę po rudę żelaza w Krucze Turnie", why: why + " - na Podgrodziu nie ma rudy, żyły są w górach", run: function* () {
            if (!(yield* goMap(ORE_MAP, why))) return false;
            for (let k = 0; k < 12 && count(85) < want && hour() < 16.5; k++) {   // (back before dusk: two deaths at 19:00, the wolves)
                if (stamina() < 15) { setDoing("Krucze Turnie: odpoczywam (siły " + Math.round(stamina()) + ")", why); yield* AP.TASKS.rest(); if (stamina() < 15) break; }
                setDoing("Krucze Turnie: kopię rudę żelaza (" + count(85) + "/" + want + ")", why);
                if (!(yield* AP.TASKS.mineOre())) break;
            }
            say("ruda żelaza w plecaku: " + count(85));
            if (count(85) < Math.min(2, want)) note("notes", { what: "Krucze Turnie: tylko " + count(85) + " rudy żelaza (chciał " + want + ")" });
            return count(85) > 0;
        } };
    }
    // ---- pines from cones on the plot (see freeJobs "pines") and wood from the woods when the plot has no standing tree left
    const CONE = 147, PINES_WANT = 8;
    const plantedPines = () => { try { return (Forestry.treesOf(MAP.field) || []).length; } catch (e) { return 0; } };
    // a player's spot: free ground right by a stump of a felled tree (where the wood was), no building within 2 tiles, the nearest walk
    function pineSpot() {
        if (mapId() !== MAP.field || !window.Forestry) return null;
        const f = L.field(P().x, P().y), bad = FAB.pineBad || {}, seen = new Set();
        const nearBuilding = (x, y) => { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (Farming.buildingAt(x + dx, y + dy)) return true; return false; };
        const reach = (x, y) => Math.min(...[[0, 1], [0, -1], [1, 0], [-1, 0]].map(([dx, dy]) => f.at(x + dx, y + dy)));
        const stumps = $gameMap.events().filter(e => ChoppableTree.isTree(e) && $gameSelfSwitches.value([mapId(), e.eventId(), "A"]) && !$gameSelfSwitches.value([mapId(), e.eventId(), "B"]));
        let best = null;
        const tryTile = (x, y, extra) => {
            const k = x + "," + y;
            if (seen.has(k)) return; seen.add(k);
            if (!$gameMap.isValid(x, y) || bad[k] === day() || Forestry.whyNot(x, y) || nearBuilding(x, y)) return;
            const c = reach(x, y) + extra;
            if (isFinite(c) && (!best || c < best.c)) best = { x, y, c };
        };
        for (const e of stumps) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === 2) tryTile(e.x + dx, e.y + dy, 0);
        if (!best) for (let dy = -10; dy <= 10; dy++) for (let dx = -10; dx <= 10; dx++) tryTile(P().x + dx, P().y + dy, 20);
        return best;
    }
    // up to n pines from cones at pineSpot()s, as a player: the ground menu's "Posadź sosnę" (false: no spot for one)
    function* plantPines(n) {
        for (let k = 0; k < n && count(CONE) > 0 && plantedPines() < PINES_WANT; k++) {
            const s = pineSpot();
            if (!s) { say("sosny: nie ma gdzie posadzić (wolna ziemia przy pniakach, z dala od budowli)"); return false; }
            const n0 = plantedPines();
            setDoing("Sadzę sosnę z szyszki (" + (n0 + 1) + "/" + PINES_WANT + ")", "drewno na później");
            yield* AP.TASKS.groundAction(s.x, s.y, "Posadź sosnę");
            yield* idle(30);
            if (plantedPines() > n0) { say("posadził sosnę (" + s.x + "," + s.y + "), na działce rośnie ich " + plantedPines()); note("notes", { what: "posadzona sosna (" + s.x + "," + s.y + "), razem " + plantedPines() }); }
            else (FAB.pineBad = FAB.pineBad || {})[s.x + "," + s.y] = day();
        }
        return true;
    }
    const WOOD_MAPS = [219, 222];
    const woodTripOk = () => (count(60) > 0 || count(115) > 0) && hour() >= 5.5 && hour() < 15 && !inUnder();
    function woodTrip(why, want) {
        return { what: "Idę po drewno do lasu", why: why + " - na działce nie ma już drzew do ścięcia", run: function* () {
            for (const m of WOOD_MAPS) {
                if (count(61) >= want || hour() >= 18) break;
                if (!(yield* goMap(m, why))) continue;
                for (let k = 0; k < 14 && count(61) < want && hour() < 18; k++) {
                    if (stamina() < 15) { setDoing(mapName(m) + ": odpoczywam (siły " + Math.round(stamina()) + ")", why); yield* AP.TASKS.rest(); if (stamina() < 15) break; }
                    setDoing(mapName(m) + ": ścinam drzewo (" + count(61) + "/" + want + " drewna)", why);
                    if (!(yield* AP.TASKS.chop(1))) break;
                }
            }
            FAB.fieldNoTrees = 0;
            say("drewno w plecaku: " + count(61));
            if (count(61) < want) note("notes", { what: "las: tylko " + count(61) + " drewna (chciał " + want + ")" });
            return count(61) > 0;
        } };
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
                yield* talkTo(() => $gameMap.event(952) || null, { tiles: [[21, 16]], leave: true });   // (the dig spot under the raven cairn on Podgrodzie: TownQuests_Data w4_dig 21,16 - "tiles" are the EVENT's tiles, the hero stands beside them)
                return true;
            } };
        }
        if (st === 2) {
            // (2026-11-16 run: "nie ma rudy żelaza w zasięgu" for days by the forge) the new world's iron ore is in the mountains only -
            // Krucze Turnie (Map222, the quarry's veins): with the forge up and a pickaxe, a day trip there for the ore first
            // (2026-11-19 series: a worn-out pickaxe - no ore trip any more and the forge "waited" for days; no ore and the coal made after
            // the trip's hours - nothing to smelt: the evening's shift or bed, the trip in the morning)
            if (count(86) < 1 && count(85) < 2 && !count(63) && !count(116)) return { what: "Robię kamienny kilof (stary się zużył)", why: why + " - bez kilofa nie ma rudy", run: function* () {
                yield* AP.TASKS.obtain({ 63: 1 });
            } };
            if (count(86) < 1 && count(85) < 2 && oreTripOk()) return oreTrip(why, 4);
            // (only when the trip waits for the day: the forge up and a pickaxe - 2026-11-19 run: with the forge still a building site it
            // "waited for the morning" for 25 days instead of finishing the forge below)
            if (count(86) < 1 && count(85) < 1 && count(79) >= 2 && (count(63) || count(116)) && builtOn(MAP.field).some(b => b.type === "forge")) {
                if (shiftOpen() && h >= 15 && h < 17) return { what: "Idę na zmianę do Borgara", why: why + " - rudy brak, po rudę jutro rano; wieczór na zarobek", run: doShift };
                if (h >= 19 || h < 5.5) return { what: "Idę spać (rano po rudę w Krucze Turnie)", why, run: sleepHome };
                return { what: "Czekam do rana na wyprawę po rudę", why: why + " - rudy brak, w góry tylko za dnia", run: () => idle(600) };
            }
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
                    const r = yield* talkTo(9, { tiles: [[31, 2]], picks: ["Zejść"], leave: true, remote: true, tries: 3 });   // (the loose brick in the store, Map001 31,2 - in the wall, reached from 31,3)
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
            if (a !== foe) { foe = a; foeT = AP.frame; best = 99; bestT = AP.frame; hp0 = a._hp; setDoing("Walczę: " + (a.isHuman && a.isHuman() && a.name ? a.name() : a.kindName ? a.kindName() : a.kind ? a.kind() : a._kind || "wróg"), why || FAB.why); }
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
            // (a losing fight with the empty armour: under 55% of life while it still has more than a third - away up the stairs, as a
            // player would; the guardian and the bosses are fought to the end - their own plans. 2026-11-17 run 12: at 40% he died on the
            // stairs 4 times out of 5 - 35-37% left was too little to reach them)
            if (plated && !a._boss && inUnder() && hpRatio() < 0.55 && a._maxHp && a._hp > a._maxHp * 0.35) {
                const fresh = !(FAB.fleeAt && AP.frame - FAB.fleeAt < 600);
                FAB.fleeAt = AP.frame; if (fresh) say("zbroja za mocna (życie " + Math.round(hpRatio() * 100) + "%) - uciekam w górę"); if (fresh) note("prep", { what: "ucieczka przed zbroją na piętrze " + floorNow() + " (życie " + Math.round(hpRatio() * 100) + "%, zbroja " + Math.round(a._hp / a._maxHp * 100) + "%)" });
                break;
            }
            // (2026-11-17, the user: "zobacz, czy ta pusta zbroja ma redukcję obrażeń całkowitą, czy trzeba ją z konkretnej strony
            // atakować") the empty armour: a light blow from the front only rings (15%, Creatures_Data plate.light) - a heavy one, one in
            // the back, a shot count in full; felled the first time it falls apart and rises with 40% unless the pile is hit ONCE
            if (plated && a._mode === "collapsed") { L.key("shoot", true); yield; yield; L.key("shoot", false); yield; yield; say("rozbił leżącą zbroję - już nie wstanie"); }
            else if (plated && ["recover", "stagger", "lie", "down", "stun"].includes(a._mode || "")) {
                L.key("shoot", true);
                for (let n = 0; n < 26; n++) { const c = foesNear(4).find(x => x.a === a); if (c && c.tell && c.tell.t < 8) break; yield; }
                L.key("shoot", false); yield; yield;
            } else if (plated && !a._boss) {
                // (its front lets half through now (the user, 2026-11-17): jabs from just out of its sword's reach (1.85-1.95) - the
                // spear's is longer; the heavy one while it recovers, the roll when its blow comes)
                if (d < 1.85 && reach > 2) { for (let n = 0; n < 6; n++) { L.setMove(L.keysToward(-dx, -dy)); yield; } L.setMove([]); }
                else { L.key("shoot", true); yield; yield; L.key("shoot", false); yield; yield; }
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
            const seen = seenFn();
            const st = stairsDown().filter(e => !seen || seen(e.x, e.y) || seen(e.x, e.y + 1));
            // (2026-11-17 with the player: not the whole floor - the stairs seen and no foe right on him: down them; he fights what blocks)
            const blocking = foesNear(2.5).length > 0;
            if (foesNear(7).length && (blocking || !st.length || hpRatio() < 0.5)) { yield* fightFoes(60 * 60, why); if (FAB.fleeAt && AP.frame - FAB.fleeAt < 120) return "ucieczka"; continue; }
            if (hpRatio() < 0.5 && !foesNear(8).length) return "słabo";
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
    // the water to get back up to the well from floor f (2026-11-17 run 11: 4 of 6 deaths walking up dry from floors 13-16): under 25
    // thirst caps the strength (Needs.js), each floor to the nearest lift stop above is about 2 game hours at 2.5 water an hour
    // (run 13: back from floor 17 with 36 water he died on floor 11 - the climb takes longer than 2 hours a floor: 30 + 6 a floor, at most 80)
    const waterBack = f => { const st = liftStops().filter(x => x <= f), top = st.length ? Math.max(...st) : 0; return Math.min(80, 30 + 6 * Math.max(0, f - top)); };
    const bossCleared = f => { try { return UG().bossCleared(f); } catch (e) { return true; } };
    const UNDER_GOAL = 50;   // Akt III: piętro 50 uzbraja napad na tawernę
    const BANDAGES = 6;      // (2026-11-17) opatrunki na każde zejście (run 12: two deaths wounded with none left at 4 - now 6)
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
            // (2026-11-17 run from po_pietrze10: at 59% of life, no bandage, water 28, the step below gave up at once - "nic nie
            // wychodzi" for hours on floor 10, the water and wound steps further down never asked. Hurt before the gate: a rest here
            // while the water lasts; wounded with a bandage: the bandage step below; hurt and dry: through the gate all the same - it
            // is a talk, not a fight - to the windlass behind it: the lift up instead of ten floors on foot without water)
            const gateShut = f === 10 && !$gameSwitches.value(14), gateHurt = gateShut && hpRatio() < 0.6 && !foesNear(9).length;
            const gateWet = needs().water + skinWater() > waterBack(f) + 5, gateBandage = !!($gameSystem.isWounded && $gameSystem.isWounded() && count(152) > 0);
            if (gateHurt && gateWet && !gateBandage) return { what: "Odpoczywam przed strażnikiem dziesiątej bramy", why: why + ", życie " + Math.round(hpRatio() * 100) + "%", run: function* () {
                for (let n = 0; n < 60 * 60 * 30 && hpRatio() < 0.9 && !foesNear(7).length && needs().water + skinWater() > waterBack(f); n += 60) yield* idle(60);
                return true;
            } };
            // the tenth gate's guardian: the words of the castellan (never in the combat mode - he fights then)
            if (gateShut && !(gateHurt && gateBandage)) return { what: "Strażnik dziesiątej bramy - słowa kasztelana", why, run: function* () {
                // (never in the combat mode and never O at him: a blow starts the fight - 300+ HP of armour; the threshold line before the
                // gate wakes him and he asks - the answer by the castellan's words from Borgar)
                // (the rats first: a talk that starts by itself - the rival by his fire, the guardian - leaves him standing while they bite)
                for (let k = 0; k < 6 && foesNear(9).length; k++) yield* fightFoes(60 * 60, why);
                if (hpRatio() < 0.6 && needs().water + skinWater() > waterBack(f) + 5) return false;   // (healed first - the rest before the gate; dry: on to the lift)
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
            if (f % 5 === 0 && f < 100 && !gateShut && !liftStops().includes(f) && evNamed(/^Kołowrót/)) return { what: "Kręcę kołowrotem windy (piętro " + f + ")", why, run: function* () {   // (floor 10's windlass is behind the gate)
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
            if ((wounded || hpRatio() < 0.4) && (wounded || hpRatio() < 0.7) && count(152) > 0 && !foesNear(6).length) return { what: "Opatruję ranę", why: why + ", życie " + Math.round(hpRatio() * 100) + "%", run: function* () {
                const n0 = count(152);
                yield* combatOn();
                L.key("heal", true); yield; yield; L.key("heal", false);
                for (let n = 0; n < 90 && count(152) === n0; n++) yield;
                say(count(152) < n0 ? "opatrunek założony (życie " + Math.round(hpRatio() * 100) + "%)" : "opatrunek nie wszedł");
                return true;
            } };
            if (hpRatio() < 0.55 && !wounded && !foesNear(9).length && needs().water > waterBack(f) + 5) return { what: "Odpoczywam pod ziemią (rany się goją)", why: why + ", życie " + Math.round(hpRatio() * 100) + "%", run: function* () {
                for (let n = 0; n < 60 * 60 * 30 && hpRatio() < 0.9 && !foesNear(7).length && needs().water > waterBack(f); n += 60) { yield* idle(60); }
                return true;
            } };
            if (hpRatio() < 0.25 && count(152) === 0) return { what: "Uciekam po schodach w górę (mało życia, bez opatrunków)", why, run: function* () { yield* goUp(why, true); yield* sleepHome(); } };
            // (2026-11-17 with the player: a wound and no bandage - up at once, not at 30% of life)
            if (wounded && count(152) === 0 && !foesNear(4).length) return { what: "Ranny bez opatrunku - wracam na górę", why: why + ", życie " + Math.round(hpRatio() * 100) + "%", run: function* () { yield* goUp(why); yield* sleepHome(); } };
            if (hpRatio() < 0.3 || (wounded && hpRatio() < 0.6)) return { what: "Ranny - wracam na górę odpocząć", why, run: function* () { yield* goUp(why); yield* sleepHome(); } };
            if (stamina() < 12 && !foesNear(8).length) return { what: "Wyczerpany - wracam na górę spać", why, run: function* () { yield* goUp(why); yield* sleepHome(); } };
            if (needs().water < 55 && skinSips() > 0 && !foesNear(5).length) return { what: "Piję z bukłaka", why: "woda " + Math.round(needs().water) + ", w bukłaku " + skinSips() + "/" + skinMax(), run: sipSkin };
            if (needs().water + skinWater() < waterBack(f) && !foesNear(8).length) return { what: "Mało wody na drogę powrotną - wracam na górę do studni", why: why + " (woda " + Math.round(needs().water) + ", na powrót z piętra " + f + " trzeba ~" + waterBack(f) + "; pod ziemią wody nie ma do piętra 50)", run: () => goUp(why) };
            return { what: "Schodzę: piętro " + f + " → " + (f + 1), why, run: () => floorDown(why) };
        }
        return { what: "Idę do podziemi (piwnica tawerny, krata)", why: why + " (najgłębiej: " + deep + ")", run: function* () { FAB.safeSave(); return yield* goMap(10, why); } };
    }
    // up: the lift from a stop, else the stairs up, back to the Ruins and the cellar
    function* goUp(why, flee) {
        for (let k = 0; k < 120 && inUnder(); k++) {
            // (fleeing: no fight unless one stands right in the way - and never the plated one it runs from: run 13 flipped between
            // "uciekam" and "walczę: zbroja" in the same minute and never reached the stairs)
            const inWay = flee ? foesNear(1.3).filter(t => { const a = t.a, kd = a._kind || (a.kind && a.kind()) || ""; return kd !== "zbroja" && !a._boss; }) : foesNear(5);   // (foesNear gives { a, d, tell })
            if (inWay.length) { yield* fightFoes(flee ? 60 * 5 : 60 * 30, why); continue; }
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
    // (2026-11-17, the user: "sam ustal") a point of Siła: +3.5% damage, +4.5% to break a foe's balance; of Kondycja: +5 life, +2 breath,
    // -1.4% chance of a wound (the spiders' bites); of Zręczność almost nothing at these levels; Czujność: a little crit, 12 opens
    // "Czujne oko"; Hart ducha: +3% against fear and the "truths" (the wraiths and shadows from floor 20). So: damage and life, more life,
    // perception to 12; from level 15 will to 15; past those marks their turn goes to Siła / Kondycja
    const ATTR_EARLY = ["str", "con", "str", "con", "con", "per"];
    const ATTR_LATE = ["con", "str", "con", "wil", "str", "per"];
    const ATTR_CAP = { per: 12, wil: 15 };
    function nextAttr(h, add, i) {
        const plan = h.level < 15 ? ATTR_EARLY : ATTR_LATE;
        let a = plan[i % plan.length];
        if (ATTR_CAP[a] && (h.attr[a] || 0) + (add[a] || 0) >= ATTR_CAP[a]) a = a === "per" ? "str" : "con";
        return a;
    }
    // the skills for a fighter: life, damage, the thick skin, the guard, healing and bandages, the roll, the heavy hand...
    const SKILL_PLAN = ["d_body", "m_power", "thickskin", "d_body", "m_power", "s_heal", "guard", "d_body", "m_power", "s_band", "s_heal", "d_roll", "m_power2",
        "d_body2", "m_power2", "d_body2", "combo4", "keen", "s_band", "d_roll", "acrobat", "d_block", "d_block", "m_breath", "m_breath", "secondwind", "d_knock", "d_knock"];
    function combatLevelUp() {
        if (!window.Combat || !Combat.hero || !Combat.spendPoints) return null;
        const h = Combat.hero(), said = [];
        if (h.points > 0) {
            const add = {};
            for (let i = 0; i < h.points; i++) { const a = nextAttr(h, add, (FAB.attrI = ((FAB.attrI || 0) + 1))); add[a] = (add[a] || 0) + 1; }
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
        // (2026-11-17 with the player: Tadek sells no torso armour - the gambeson is the seamstress's, the leather the tanner's)
        let rows = [];
        for (const who of Object.keys(SELLERS)) {
            try { rows = rows.concat(Bron.oferta(who, "kup").filter(r => r && r.act === "kup" && !r.locked && r.p).map(r => Object.assign({ who }, r))); } catch (e) { /* (not selling now) */ }
        }
        if (!rows.length) return out;
        const lvl = Bron.level ? Bron.level() : 1;
        for (const slot of ["torso", "left", "head", "legs", "hands", "feet", "right"]) {
            const now = wornIn(slot), nowP = now ? BD().przedmiot(now) : null;
            const nowV = slot === "right" ? weaponDmgNow() : valueOfItem(nowP);
            const cands = rows.filter(r => slotOf(r.p) === slot && r.p.poziom <= lvl + 1 && r.cost <= budget && valueOfItem(r.p) > nowV * (slot === "right" ? 1.15 : 1.0) + 0.0001 && !count(r.id));
            if (!cands.length) continue;
            cands.sort((a, b) => valueOfItem(b.p) - valueOfItem(a.p) || a.cost - b.cost);
            out.push({ id: cands[0].id, name: cands[0].p.nazwa, cost: cands[0].cost, slot, who: cands[0].who });
            budget -= cands[0].cost;
        }
        return out;
    }
    FAB.shopWishlist = shopWishlist;
    // the armour sellers: the map, the person (TownLife's key) and the row of their talk that opens the shop
    const SELLERS = {
        kowal: { map: () => MAP.town, who: () => tadek(), pick: "Pokaż broń", name: "kowal Tadek" },
        garbarz: { map: () => 218, who: () => (window.TownLife && TownLife.eventOf ? TownLife.eventOf("garbarz") : null), pick: "Skórzane zbroje", name: "garbarz Ignac" },
        szwaczka: { map: () => MAP.town, who: () => (window.TownLife && TownLife.eventOf ? TownLife.eventOf("szwaczka") : null), pick: "Przeszywanice", name: "szwaczka Dorota" }
    };
    // the cheapest good set to aim for (the shifts pay it): the torso, a shield, the head
    function gearTarget() {
        const all = shopWishlist(99999).filter(w => ["torso", "left", "head"].includes(w.slot));
        return all.reduce((s, w) => s + w.cost, 0);
    }
    // the shop window (Bron's Scene_BronSklep) by its keys: ↑↓ the row, ←→ the tab, O buy / mend, P out
    // (2026-11-17: the quest board's scene has its driver too - boardDriver, with the contracts)
    FAB.offMapDriver = (sc, n) => shopDriver(sc, n) || boardDriver(sc, n);
    function shopDriver(sc, n) {
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
                if (count(want.id) > job.c0) { job.bought.push(want.name); say("kupione u: " + (job.seller || "Tadek") + ": " + want.name + " (" + want.cost + " G)"); }
                else { job.skipped.push(want.name); say("nie kupione: " + want.name); }
                job.buy.shift(); job.pressed = false; return true;
            }
            if (i < 0) { job.skipped.push(want.name); job.buy.shift(); return true; }
            if (sc._list.index !== i) { I[sc._list.index < i ? "down" : "up"] = true; return true; }
            job.c0 = count(want.id); job.pressed = true; I.ok = true; return true;
        }
        if (job.repair && (job.repairs || 0) < 6 && (sc._tabs || []).includes("napraw")) {
            if (sc._tab !== "napraw") { I.right = true; return true; }
            // (2026-11-17 run: O always on the first row - often one he could not pay for, "Potrzebujesz N G": nothing mended, and back to
            // Tadek again and again) the first row he can pay for; a row still there after its O is not pressed again
            const all = sc._rows || [];
            if (job.repairPressed) {
                job.repairPressed = false;
                if (all.some(r => r && r.act === "napraw" && r.id === job.repairId)) (job.repairFailed = job.repairFailed || []).push(job.repairId);
                return true;
            }
            const i = all.findIndex(r => r && r.act === "napraw" && r.cost <= $gameParty.gold() && !(job.repairFailed || []).includes(r.id));
            if (i >= 0) {
                if (sc._list.index !== i) { I[sc._list.index < i ? "down" : "up"] = true; return true; }
                I.ok = true; job.repairPressed = true; job.repairId = all[i].id; job.repairs = (job.repairs || 0) + 1; return true;
            }
            job.repair = false;
        }
        I.cancel = true;
        return true;
    }
    function equipBought(ids) {
        for (const id of ids) {
            const p = BD() && BD().przedmiot(id), slot = p && slotOf(p);
            if (!slot) continue;
            try { if (slot === "right") { if (Combat.setHand("m" + id)) say("bierze do ręki: " + p.nazwa); } else if (Equipment.equip(slot, id)) say("zakłada: " + p.nazwa + " (jak w oknie Ekwipunek)"); } catch (e) { /* (no such slot) */ }
        }
    }
    function* shopAtTadek(list, repair, why, seller) {
        const S = SELLERS[seller || "kowal"];
        if (!(yield* goMap(S.map(), why))) return false;
        FAB.shopJob = { buy: list.slice(), bought: [], skipped: [], repair: repair && (seller || "kowal") === "kowal", seller: S.name };
        const ids = list.map(w => w.id);
        setDoing("Przygotowuję się: kupuję u: " + S.name + " - " + list.map(w => w.name).join(", "), why);
        // (his quests and offers speak first - a talk or two before the shop's row; talked to again until the shop opens)
        for (let k = 0; k < 5 && !FAB.shopJob.opened; k++) {
            const e = S.who();
            if (!e || e.isTransparent() || (e._town && e._town.hidden)) { setDoing("Czekam na: " + S.name, why); yield* idle(300); continue; }
            yield* talkTo(S.who, { picks: [S.pick], leave: true });
        }
        const job = FAB.shopJob;
        FAB.shopJob = null;
        equipBought(ids.filter(id => count(id) > 0));
        // (a visit for nothing - the shop did not open or had nothing of the list: counted, at most 4 a day; noted once, not every visit)
        // (2026-11-17 run: "naprawa: 6" on every visit and the gear still worn - 656 talks with Tadek in one day: a mending that left it
        // worn is a visit for nothing too, so the cap of 4 a day holds)
        const none = !job.bought.length && (!(job.repairs > 0) || !!(repair && wornOut()));
        // (a mending that left the gear worn - too dear for the purse now: no more mending today, the visits stop)
        if (repair && wornOut()) { FAB.noMend = day(); note("prep", { what: "naprawa u kowala nie wyszła (" + $gameParty.gold() + " G w sakiewce) - do jutra bez naprawy" }); }
        if (none) { FAB.shopNone = FAB.shopNone && FAB.shopNone.day === day() ? FAB.shopNone : { day: day(), n: 0 }; FAB.shopNone.n++; }
        if (!none || FAB.shopNone.n === 1 || FAB.shopNone.n === 4)
            note("prep", { what: "u: " + S.name + ": kupione " + (job.bought.join(", ") || "nic") + (job.skipped.length ? "; nie: " + job.skipped.join(", ") : "") + (repair ? "; naprawa: " + (job.repairs || 0) : "") + (none && FAB.shopNone.n === 4 ? " (4. raz dziś - do jutra bez kowala)" : "") });
        return job.bought.length > 0;
    }
    // (worn below 35% AND on Tadek's mending tab with the gold for it - he mends metal only; a wooden spear or leather is not his:
    // without this the hero walked to him again and again for a mend that never came)
    const wornOut = () => { try {
        if (FAB.noMend === day()) return false;
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
        if ((wish.length || repair) && h >= 6.2 && h < 16.5 && !shopTired) {
            const seller = wish.length ? wish[0].who || "kowal" : "kowal", list = wish.filter(w => (w.who || "kowal") === seller);
            return { what: "Przygotowuję się: " + SELLERS[seller].name + " (" + (list.length ? list.map(w => w.name).join(", ") : "naprawa") + ")", why, run: () => shopAtTadek(list, repair, why, seller) };
        }
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

    // ------------------------------------------------------------------ zlecenia z tablicy (2026-11-17, gracz: uczciwe złoto poza zmianami)
    // The quest board (QuestBoard.js) hangs in the tavern's hall (Map001, the event at 7,36) and in Kruczogród (Map220, 54,35) - one
    // board, the same notices. The autopilot reads it as a player does: O before it, the arrows to a card, O, „Przyjmij” (the scene's
    // own keys - boardDriver). It takes only what it can do safely - goods it has or can gather / make, a hunt it can win (its level and
    // gear against the animal; a named beast only far above it) - and works on it in its free time only: before a shift (freeJobs
    // "contract") or a few hours a day on the surface between the trips down (qbWindow, QB_DAY_H). Turned in at the board when he
    // passes it (or by a short way to it); one running out of time is given up there (-3 fame instead of -6). Every notice passed over
    // is noted once with the reason (FAB.rep.contracts).
    const QB = () => window.QuestBoard;
    const QB_MAPS = [MAP.tavern, MAP.town];
    const QB_MAX = 2;          // contracts in hand at once (the board allows 3)
    const QB_DAY_H = 2.5;      // game hours a day for contracts on the surface, outside the time before a shift
    // the ground's kinds that give a thing (ap.js gather), and what he keeps of a thing for himself (tools, mending, bandages,
    // charcoal) - a delivery is made from what is over that. (Not the wild potatoes and carrots: one tile in 250 - a contract for
    // them only with them in the bag already)
    const QB_GATHER = { 64: ["stone"], 77: ["branch"], 92: ["fiber"], 102: ["berries", "bush"], 103: ["mushroom"], 104: ["herb"], 147: ["cone"],
        149: ["nettle"], 150: ["yarrow"], 151: ["garlic"] };
    const QB_KEEP = { 64: 10, 77: 10, 92: 10, 61: 6, 80: 4, 93: 1, 104: 2, 150: 2, 152: BANDAGES, 85: 4, 86: 2, 79: 2, 147: 2 };
    const HUNT_MAP = { wolf: 222, boar: 221 };      // (the new world's: the wolves in Krucze Turnie at night, a boar by the weir)
    const HUNT_LV = { wolf: 6, boar: 8 };           // the hero's level for a plain hunt (a pack's leaps, a boar's charges)
    const PLACE_LV = { 222: 5, 29: 5 };             // (the maps' <Poziom:N> notes: the level of the animals and the men there)
    const seasonNow = () => { try { return Tawerna.time.season(); } catch (e) { return 0; } };
    const gatherable = id => (QB_GATHER[id] || []).some(k => { const g = window.Farming && Farming.GATHER && Farming.GATHER[k]; return !!g && (!g.seasons || g.seasons.includes(seasonNow())); });
    const hasAxe = () => count(60) > 0 || count(115) > 0;
    const qbMakeable = id => (id === 61 ? hasAxe() : id === 80 ? hasAxe() && builtOn(MAP.field).some(b => b.type === "sawmill") : id === 93 ? count(92) >= 4 || gatherable(92) : false);
    const heroLevel = () => { try { return Combat.hero().level || 1; } catch (e) { return 1; } };
    const armedNow = () => bestWeapon() > 0 || !!(window.Combat && Combat.handMelee && Combat.handMelee() > 0);
    const woundedNow = () => !!($gameSystem.isWounded && $gameSystem.isWounded());
    const placeLv = m => (m === mapId() && window.Combat && Combat.placeLevel ? Combat.placeLevel() : PLACE_LV[m] || 1);
    const huntHours = kind => { try { return Hunting.SPECIES[kind].hours || [[0, 24]]; } catch (e) { return [[0, 24]]; } };
    const inHours = (hrs, h) => hrs.some(([a, b]) => h >= a && h < b);
    const qbDaysLeft = n => (n.due || 0) - day() + 1;
    // a bandage from the ground: 2 herbs, 2 yarrow, 2 fibre - each in the bag or growing this season
    const bandageSeason = () => [104, 150, 92].every(id => count(id) >= 2 || gatherable(id));
    const itemName = id => ($dataItems[id] ? $dataItems[id].name : "#" + id);
    const bountyName = key => { try { return QB().BOUNTIES[key].name || key; } catch (e) { return key; } };
    // the goods of the contracts in hand are held in the bag (ap.js AP.hold: not eaten, not put in the pantry or a chest)
    function qbHold(id) {
        const Q = QB();
        if (!Q || !Q.active || !window.$gameSystem) return 0;
        let n = 0;
        for (const c of Q.active()) for (const q of c.req) if (q.k === "item" && q.id === id) n += q.n;
        return n;
    }
    AP.hold = qbHold;
    const qbReq = n => n.req.map(q => (q.k === "item" ? itemName(q.id) + " ×" + q.n : q.k === "bounty" ? "POSZUKIWANY " + bountyName(q.key) : q.kind + " ×" + q.n + (q.map ? " (" + mapName(q.map) + ")" : ""))).join(", ");
    function huntOk(kind) {
        if (kind === "rabbit" || kind === "deer") return { ok: false, why: (kind === "rabbit" ? "zające" : "jelenie") + " uciekają - autopilot nie poluje z łuku" };
        // (run 2026-11-17: "Wilki pod wsią" taken and run out - the wolves come out at night only (20-5, Krucze Turnie), and his
        // contract hours are the day's free time; nights are for sleep and the camps)
        if (!inHours(huntHours(kind), 7) && !inHours(huntHours(kind), 12)) return { ok: false, why: (kind === "wolf" ? "wilki" : kind) + " wychodzą tylko nocą - zlecenia robi za dnia" };
        const lv = heroLevel(), need = HUNT_LV[kind] || 99, what = kind === "wolf" ? "wilki" : kind === "boar" ? "dzik" : kind;
        if (!armedNow()) return { ok: false, why: what + " - bez broni w ręce" };
        if (lv < need) return { ok: false, why: what + " - za słaby (poziom " + lv + ", trzeba " + need + ")" };
        if (count(152) < 2) return { ok: false, why: what + " - za mało opatrunków (" + count(152) + "/2)" };
        return { ok: true };
    }
    // a named beast (POSZUKIWANY): its level on its map, its life and its pack against the hero's level - only well above it
    function bountyOk(key) {
        const B = ((QB() && QB().BOUNTIES) || {})[key];
        if (!B) return { ok: false, why: "nieznany list gończy " + key };
        const blv = placeLv(B.map) + (B.lv || 0), lv = heroLevel(), need = blv + 3 + (B.pack || 0) + (B.kind === "boar" ? 1 : 0);
        const what = bountyName(key) + " (poziom ~" + blv + ", życie ×" + B.hp + (B.pack ? ", wilki przy nim: " + B.pack : "") + ")";
        if (!armedNow()) return { ok: false, why: what + " - bez broni" };
        if (lv < need) return { ok: false, why: what + " - przegrałby: poziom " + lv + ", trzeba " + need };
        if (!inHours(huntHours(B.kind), 7) && !inHours(huntHours(B.kind), 12)) return { ok: false, why: what + " - wychodzi tylko nocą, zlecenia robi za dnia" };
        if (count(152) < 3) return { ok: false, why: what + " - za mało opatrunków (" + count(152) + "/3)" };
        return { ok: true };
    }
    // can he do this notice safely, and what does it want ({ item id: how many in the bag before it is turned in }, the hunts)
    function qbJudge(n) {
        if (n.state === "open" && n.days < 2) return { ok: false, why: "termin " + n.days + " dzień - za krótki" };
        const need = {}, hunts = [];
        for (const q of n.req) {
            if (q.k === "item") {
                const want = q.n + (QB_KEEP[q.id] || 0);
                if (count(q.id) >= want) continue;
                if (gatherable(q.id) || qbMakeable(q.id)) { need[q.id] = want; continue; }
                const how = QB_GATHER[q.id] ? "nie ta pora roku" : (q.id === 61 || q.id === 80) && !hasAxe() ? "bez siekiery" : q.id === 80 ? "bez tartaku" : "tego autopilot nie zbiera ani nie robi";
                return { ok: false, why: itemName(q.id) + " ×" + q.n + " - nie ma skąd wziąć (" + how + ")" };
            }
            const j = q.k === "bounty" ? bountyOk(q.key) : huntOk(q.kind);
            if (!j.ok) return j;
            hunts.push({ kind: q.kind, n: q.n, map: q.map || HUNT_MAP[q.kind], bounty: q.k === "bounty" });
        }
        return { ok: true, need, hunts };
    }
    // in hand and ready: turned in when all its goods are there with his own share left over - or on its last day as it is
    function qbReadyList() {
        const Q = QB();
        if (!Q || !Q.active) return [];
        return Q.active().filter(n => Q.isReady(n.id) && (qbDaysLeft(n) <= 1 || n.req.every(q => q.k !== "item" || count(q.id) >= q.n + (QB_KEEP[q.id] || 0))));
    }
    // in hand on its last day, not ready, no way to finish it today: given up at the board (-3 fame; run out it costs -6)
    function qbDropList() {
        const Q = QB();
        if (!Q || !Q.active) return [];
        return Q.active().filter(n => !Q.isReady(n.id) && qbDaysLeft(n) <= 1 && (hour() >= 15 || (FAB.qbStuck || {})[n.id] === day()));
    }
    // what to take now: the doable open notices, the best paid first, as many as there is room for
    function qbPick() {
        const Q = QB(), take = [], skip = [];
        if (!Q || !Q.board) return { take, more: [], skip };
        for (const n of Q.board()) {
            if (n.state !== "open") continue;
            const j = qbJudge(n);
            if (j.ok) take.push(n); else skip.push({ n, why: j.why });
        }
        take.sort((a, b) => b.gold - a.gold || b.days - a.days);
        const room = Math.max(0, Math.min(QB_MAX, Q.MAX_ACTIVE || 3) - Q.active().length + qbReadyList().length);
        return { take: take.slice(0, room), more: take.slice(room), skip };
    }
    // the next thing to do for a contract in hand (the soonest due first): goods short of what it wants, or its hunt in the animal's hours
    function qbWorkNext() {
        const Q = QB();
        if (!Q || !Q.active) return null;
        const h = hour(), list = Q.active().slice().sort((a, b) => a.due - b.due);
        for (const n of list) {
            if ((FAB.qbStuck || {})[n.id] === day()) continue;
            const items = {};
            let hunt = null;
            for (const q of n.req) {
                if (q.k === "item") { const want = q.n + (QB_KEEP[q.id] || 0); if (count(q.id) < want && (gatherable(q.id) || qbMakeable(q.id))) items[q.id] = want; }
                else if ((q.got || 0) < q.n && inHours(huntHours(q.kind), h)) hunt = { kind: q.kind, map: q.map || HUNT_MAP[q.kind], bounty: q.k === "bounty" ? n.id : null };
            }
            if (Object.keys(items).length || hunt) return { n, items, hunt };
        }
        return null;
    }
    function qbWorkName() { const w = qbWorkNext(); return w ? "„" + w.n.title + "” (" + qbReq(w.n) + ")" : "-"; }
    function qbWorkWhere() { const w = qbWorkNext(); return !w ? "any" : w.hunt ? w.hunt.map : w.items[80] ? "field" : "any"; }
    // the work: the goods short gathered here (nothing of it on this map today: another place next time) or made (ap.js obtain:
    // wood, planks, rope), then the hunt
    function* qbWork(why) {
        const w = qbWorkNext();
        if (!w) return true;
        const n = w.n;
        for (const id of Object.keys(w.items).map(Number)) {
            const want = w.items[id];
            if (count(id) >= want) continue;
            setDoing("Zlecenie „" + n.title + "”: " + itemName(id) + " " + count(id) + "/" + want, why);
            const before = count(id);
            // (stones, branches, fibre: his chests on the plot first, then the ground - ap.js obtain; the rest picked off the ground here)
            if ([64, 77, 92].includes(id)) yield* AP.TASKS.obtain({ [id]: want });
            else if (QB_GATHER[id] && gatherable(id)) yield* AP.TASKS.gather(QB_GATHER[id], want - count(id));
            else {
                if (id === 80 && mapId() !== MAP.field && !(yield* goMap(MAP.field, why))) return false;
                yield* AP.TASKS.obtain({ [id]: want });
            }
            if (count(id) <= before) {
                if (QB_GATHER[id]) setBarren(mapId(), "contract");
                else (FAB.qbStuck = FAB.qbStuck || {})[n.id] = day();
                say("zlecenie „" + n.title + "”: brak " + itemName(id) + " (" + mapName(mapId()) + ")");
                return true;
            }
            say("zlecenie „" + n.title + "”: " + itemName(id) + " " + count(id) + "/" + want);
        }
        if (w.hunt) yield* qbHunt(n, w.hunt, why);
        return true;
    }
    // a hunt: on its map in its animal's hours; wolves and boars come at him - the reflexes (ap.js fightPack / fight) and fightFoes do
    // the fight; one that keeps off is walked up to; a named beast shows itself after a while (QuestBoard: 11-16 tiles off)
    function* qbHunt(n, hu, why) {
        if (mapId() !== hu.map && !(yield* goMap(hu.map, why))) return false;
        const t0 = now(), Q = QB();
        for (let k = 0; k < 300; k++) {
            if (Q.isReady(n.id) || !inHours(huntHours(hu.kind), hour()) || now() - t0 > 3) break;
            if (hpRatio() < 0.5) { say("polowanie: życie " + Math.round(hpRatio() * 100) + "% - koniec na dziś"); (FAB.qbStuck = FAB.qbStuck || {})[n.id] = day(); break; }
            if (foesNear(9).length) { yield* fightFoes(60 * 60, why); continue; }
            const a = ((window.Hunting && Hunting.animals) || []).filter(x => x && !x._dead && x._hp > 0 && x._kind === hu.kind && (!hu.bounty || x._qbBounty === hu.bounty))
                .sort((p, q) => p.playerDistance() - q.playerDistance())[0];
            if (!a) { setDoing("Zlecenie „" + n.title + "”: wypatruję zwierzęcia (" + mapName(mapId()) + ")", why); yield* idle(180); continue; }
            if (a.playerDistance() > 3.5) {
                setDoing("Zlecenie „" + n.title + "”: podchodzę (" + (a._qbName || a._kind) + ")", why);
                if (!(yield* L.walkTo(Math.round(a._realX), Math.round(a._realY) + 1))) yield* idle(60);
                continue;
            }
            yield* idle(30);   // (close by: it comes at him - the reflexes take over)
        }
        return true;
    }
    // to the board (the event with <Tavern:board>), O; the scene is driven by boardDriver from FAB.boardJob; noted afterwards
    function* qbVisit(why) {
        const Q = QB();
        if (!Q || !Q.isBoardEvent) return false;
        const e = $gameMap.events().find(ev => ev && !ev._erased && Q.isBoardEvent(ev));
        if (!e) { note("unclear", { what: "brak tablicy zleceń na mapie " + mapName(mapId()) }); FAB.qbNext = now() + 6; return false; }
        yield* combatOff();
        const tiles = evTiles(e), spot = yield* approach(tiles);
        if (!spot) { say("nie dojdę do tablicy zleceń"); FAB.qbNext = now() + 3; return false; }
        if (!spot.counter) faceTiles(tiles);
        // what he does there - from what the board shows as he stands before it
        const pick = qbPick(), turn = qbReadyList(), drop = qbDropList();
        const job = FAB.boardJob = { turnIn: turn.map(n => n.id), abandon: drop.map(n => n.id), accept: pick.take.map(n => n.id), opened: false,
            done: { turnIn: [], abandon: [], accept: [] }, failed: [], moves: 0, tries: 0 };
        setDoing("Tablica zleceń: " + ([turn.length ? "oddaję " + turn.length : "", drop.length ? "porzucam " + drop.length : "", pick.take.length ? "biorę " + pick.take.length : ""].filter(Boolean).join(", ") || "czytam ogłoszenia"), why);
        try {
            yield* L.wait(2);
            yield* L.press("ok");
            for (let k = 0; k < 90 && !job.opened; k++) yield;   // (the board's scene: the generator stands still until it is closed)
            if (!job.opened) { say("tablica zleceń się nie otworzyła"); FAB.qbNext = now() + 2; return false; }
            for (let k = 0; k < 900 && !(SceneManager._scene instanceof Scene_Map && onMapReady()); k++) yield;
            yield* drive({});
        } finally { FAB.boardJob = null; L.key("ok", false); }
        FAB.qbLook = { day: day(), h: now(), cycle: Q.cycleOf(day()), more: pick.more.length };
        for (const id of job.done.turnIn) { const n = Q.find(id); note("contracts", { what: "oddane", id, title: n ? n.title : id, gold: n ? n.gold : 0, xp: n ? n.xp : 0 }); say("zlecenie oddane: „" + (n ? n.title : id) + "” +" + (n ? n.gold : "?") + " G"); }
        for (const id of job.done.abandon) { const n = drop.find(x => x.id === id); note("contracts", { what: "porzucone", id, title: n ? n.title : id, why: "ostatni dzień, nie zdąży" }); say("zlecenie porzucone: „" + (n ? n.title : id) + "”"); }
        for (const id of job.done.accept) { const n = Q.find(id); if (!n) continue; note("contracts", { what: "przyjęte", id, title: n.title, gold: n.gold, due: n.due, req: qbReq(n) }); say("przyjął zlecenie: „" + n.title + "” (" + qbReq(n) + ", " + n.gold + " G, do dnia " + n.due + ")"); }
        for (const f of job.failed) note("contracts", { what: "nie wyszło", why: f });
        FAB.qbSkipSeen = FAB.qbSkipSeen || {};
        for (const s of pick.skip) if (!FAB.qbSkipSeen[s.n.id]) { FAB.qbSkipSeen[s.n.id] = 1; note("contracts", { what: "pominięte", id: s.n.id, title: s.n.title, gold: s.n.gold, type: s.n.type, why: s.why }); }
        if (Object.keys(FAB.qbSkipSeen).length > 300) FAB.qbSkipSeen = {};
        return true;
    }
    FAB.qbVisit = qbVisit;
    // the board in the tavern / the town: a contract to turn in or give up, or a look at the notices (a new set every 3 days; again
    // after half a day while there is room and it showed more he could do) - when he is there anyway; a short way to it only for one
    // ready (or running out). Not just before an evening shift.
    function qbBoardPlan() {
        const Q = QB();
        if (!Q || !Q.board || inUnder()) return null;
        // (a contract run out - the game's own term - noted once, -6 fame)
        FAB.qbFailSeen = FAB.qbFailSeen || {};
        for (const hh of (Q.state().history || []).slice(0, 6)) if (hh.state === "failed" && !FAB.qbFailSeen[hh.id]) { FAB.qbFailSeen[hh.id] = 1; note("contracts", { what: "po terminie", id: hh.id, title: hh.title, why: "nie zdążył (" + hh.rep + " sławy)" }); }
        const h = hour();
        if (h < 6 || h >= 20.5 || (FAB.qbNext || 0) > now()) return null;
        if (shiftOpen() && h >= shiftLeave() - 0.25 && h < 21) return null;
        const due = qbReadyList().length + qbDropList().length;
        if (!QB_MAPS.includes(mapId())) {
            if (!due) return null;
            const m = QB_MAPS.slice().sort((a, b) => travelH(a) - travelH(b))[0];
            if (travelH(m) > 0.75) return null;
            return { what: "Niosę zlecenie do tablicy (" + mapName(m) + ")", why: "zlecenia: " + due + " do oddania / porzucenia", run: function* () {
                FAB.qbNext = now() + 1;
                if (yield* goMap(m, "tablica zleceń")) yield* qbVisit("zlecenia: oddaję");
            } };
        }
        const look = FAB.qbLook || {}, room = Q.active().length < QB_MAX;
        const fresh = look.cycle !== Q.cycleOf(day()) || (look.more > 0 && now() - (look.h || 0) >= 12);
        if (!due && !(room && fresh)) return null;
        return { what: "Patrzę na tablicę zleceń (" + mapName(mapId()) + ")", why: "zlecenia: uczciwe złoto poza zmianami (w toku " + Q.active().length + "/" + QB_MAX + ")",
            run: function* () { FAB.qbNext = now() + 0.5; yield* qbVisit("tablica zleceń"); } };
    }
    // the contracts between the trips down: a few hours a day (QB_DAY_H) in the daytime, the work timeboxed as the free time is
    function qbWindow() {
        const h = hour();
        if (h < 6.5 || h >= 16 || inUnder()) return null;
        const used = FAB.qbDay && FAB.qbDay.day === day() ? FAB.qbDay.h : 0, left = QB_DAY_H - used;
        if (left < 0.5 || !qbWorkNext()) return null;
        const fp = freeTimePlan(Math.min(17.5, h + left), MAP.tavern, "Zlecenie", 0.4, "contract");
        if (!fp) return null;
        const run = fp.run;
        fp.run = function* () { const t0 = now(); try { return yield* run(); } finally { FAB.qbDay = { day: day(), h: used + Math.max(0.25, now() - t0) }; } };
        return fp;
    }
    // the board's scene (QuestBoard_Scene.js) by its keys, as a player: ↑↓←→ to a card (the nearest one that way - the scene's own
    // rule), O opens its buttons, ←→ to „Przyjmij” / „Oddaj” / „Porzuć” (and „Tak”), O; P back and out. The first visit: Borgar
    // explains the board - O through it. What to do: FAB.boardJob (qbVisit)
    function boardDriver(sc, n) {
        if (!sc || sc.constructor.name !== "Scene_QuestBoard") return false;
        const I = Input._currentState, job = FAB.boardJob;
        for (const k of ["ok", "up", "down", "left", "right", "cancel"]) I[k] = false;
        if (job) job.opened = true;
        if (n < 30 || n % 5 !== 0 || !sc._cards) return true;   // (the cards fly in first)
        if (sc.anim || sc.mode === "anim" || (sc.isBusy && sc.isBusy())) return true;   // (the coins fly to the purse)
        if (sc.mode === "tutorial") { I.ok = true; return true; }
        if (!job) { I.cancel = true; return true; }
        let t = null;
        for (const want of ["turnIn", "abandon", "accept"]) if (job[want].length) { t = { id: job[want][0], want, list: job[want] }; break; }
        if (!t) { I.cancel = true; return true; }   // (a card's buttons open: P shuts them; the board: P leaves it)
        const card = sc._cards.find(c => c.n && c.n.id === t.id), cn = card ? card.n : null;
        const next = () => { t.list.shift(); job.moves = 0; job.tries = 0; job.lastFocus = null; job.flip = false; };
        const fail = why => { job.failed.push("„" + (cn ? cn.title : t.id) + "” (" + t.want + "): " + why); next(); };
        const done = t.want === "accept" ? !!cn && cn.state === "active" : t.want === "turnIn" ? !!cn && cn.state === "done" : !card;
        if (done) { job.done[t.want].push(t.id); next(); return true; }
        if (!card) { fail("kartki nie ma na tablicy"); return true; }
        if (sc.focus !== card) {
            if (sc.mode === "choice") { I.cancel = true; return true; }
            if (++job.moves > 40) { fail("strzałki nie trafiają w kartkę"); return true; }
            const pos = e => [e.baseX !== undefined ? e.baseX : e.x, e.baseY !== undefined ? e.baseY : e.y + (e.h || 0) / 2];
            const [fx, fy] = pos(sc.focus || sc._tag), [tx, ty] = pos(card), dx = tx - fx, dy = ty - fy;
            // (the same card in focus after a press: nothing that way - the other arrows)
            if (job.lastFocus === sc.focus && job.moves > 1) job.flip = !job.flip;
            job.lastFocus = sc.focus;
            let across = Math.abs(dx) >= Math.abs(dy);
            if (job.flip) across = !across;
            if (across && Math.abs(dx) > 12) I[dx > 0 ? "right" : "left"] = true;
            else if (Math.abs(dy) > 12) I[dy > 0 ? "down" : "up"] = true;
            else I[dx > 0 ? "right" : "left"] = true;
            return true;
        }
        if (sc.mode === "browse") { if (++job.tries > 8) fail("kartka się nie otwiera"); else I.ok = true; return true; }
        const wantId = t.want === "abandon" ? (sc._confirm ? "abandonYes" : "abandon") : t.want;
        const list = sc.choices || [], i = list.findIndex(c => c.id === wantId);
        if (i < 0 || list[i].enabled === false) { fail(i < 0 ? "brak przycisku" : "przycisk nieczynny"); I.cancel = true; return true; }
        if (sc.choiceIndex !== i) { I.right = true; return true; }
        if (++job.tries > 14) { fail("przycisk nie działa"); I.cancel = true; return true; }
        I.ok = true;
        return true;
    }

    // ------------------------------------------------------------------ obozy bandytów (2026-11-17, gracz: uczciwe złoto poza zmianami)
    // Night camps (Humans.js): Słony Brzeg (Map219, 25% a night), Krucze Turnie (Map222, 30%), Krucza Grań (Map029, 25%) - rolled once a
    // night for the map the hero is on, from 21:00, from day 4: 2-4 men (asleep, one or two awake by the fire, an archer, a knife, from
    // day 8 a mercenary with a shield) and a sack with 6-22 gold and supplies. Their blows never kill - a beaten hero is robbed of 40% of
    // his purse. He goes for one only when strong enough (BANDIT_FIT: level, life, no wound, bandages, a weapon) and the camp is small
    // (3 men at most, no mercenary below level 10, none far above him): up to the fire's light, sneaking (C) to a sleeper, a blow from
    // hiding, the fight; the ones who beg are spared (the honest choice), the beaten searched, the sack taken; under half his life (two
    // bandages used) he runs. An evening for it: Słony Brzeg next to grandpa's plot, every other day at most once the debt is paid - or
    // wherever he happens to be on a camp map at night (the ore trips to Krucze Turnie).
    const HM = () => window.Humans;
    const BANDIT_MAPS = [219, 222, 29];
    const BANDIT_FIT = { level: 6, hp: 0.8, bandages: 2, stamina: 45, men: 3, mercLevel: 10, flee: 0.5, heals: 2, every: 2 };
    const nightKeyNow = () => (hour() >= 12 ? day() : day() - 1);
    const banditMen = camp => ((HM() && HM().list) || []).filter(h => h && !h._dead && h._campRef && camp.members.includes(h._campRef));
    const menNear = r => foesNear(r).filter(t => t.a.isHuman && t.a.isHuman());
    const sneakingNow = () => !!(window.Hunting && Hunting.sneaking && Hunting.sneaking());
    function banditFit() {
        const lv = heroLevel(), nd = needs();
        if (lv < BANDIT_FIT.level) return { ok: false, why: "poziom " + lv + " (trzeba " + BANDIT_FIT.level + ")" };
        if (!armedNow()) return { ok: false, why: "bez broni w ręce" };
        if (woundedNow()) return { ok: false, why: "ranny" };
        if (hpRatio() < BANDIT_FIT.hp) return { ok: false, why: "życie " + Math.round(hpRatio() * 100) + "% (trzeba " + Math.round(BANDIT_FIT.hp * 100) + "%)" };
        if (count(152) < BANDIT_FIT.bandages) return { ok: false, why: "opatrunki " + count(152) + "/" + BANDIT_FIT.bandages };
        if (stamina() < BANDIT_FIT.stamina) return { ok: false, why: "siły " + Math.round(stamina()) };
        if (nd.food < 35 || nd.water < 35) return { ok: false, why: "głód / pragnienie (" + Math.round(nd.food) + "/" + Math.round(nd.water) + ")" };
        return { ok: true };
    }
    // the camp as seen by its fire: the men still there, their kinds and levels
    function banditJudge(camp) {
        const men = (camp.members || []).filter(m => m.state === "alive"), lv = heroLevel(), K = (HM() && HM().KINDS) || {};
        const txt = men.length + " (" + men.map(m => ((K[m.kind] || {}).name || m.kind) + (m.level ? " poz. " + m.level : "")).join(", ") + ")";
        if (!men.length) return { ok: false, why: "obóz pusty", txt };
        if (men.length > BANDIT_FIT.men) return { ok: false, why: "za dużo ludzi: " + txt, txt };
        if (men.some(m => m.kind === "mercenary") && lv < BANDIT_FIT.mercLevel) return { ok: false, why: "najemnik z tarczą - dopiero od poziomu " + BANDIT_FIT.mercLevel + " (jest " + lv + "): " + txt, txt };
        const top = Math.max(...men.map(m => m.level || 1));
        if (top > lv + 1) return { ok: false, why: "za silni (poziom " + top + " przy jego " + lv + "): " + txt, txt };
        return { ok: true, txt };
    }
    // the decide's step: a camp by his fire tonight (attack or pass it by, noted), an evening on its way (to the map, waiting for the
    // night's roll), or a new evening planned at 19-20:30
    // (an evening with no trip to a camp: why, counted once a day at 19-20:30 - FAB.rep.campNoEve for the report)
    function noEvening(why) {
        if (FAB.banditWhyDay === day() || hour() < 19 || hour() >= 20.6) return null;
        FAB.banditWhyDay = day();
        const m = FAB.rep.campNoEve = FAB.rep.campNoEve || {};
        m[why] = (m[why] || 0) + 1;
        return null;
    }
    function banditPlan() {
        const H = HM();
        if (!H || !H.campHere) return null;
        if (inUnder()) return noEvening("pod ziemią");
        const h = hour(), m = mapId(), key = nightKeyNow(), night = h >= 21 || h < 5;
        const ev = FAB.banditEve && FAB.banditEve.key === key ? FAB.banditEve : null;
        FAB.banditSeen = FAB.banditSeen || {};
        const camp = BANDIT_MAPS.includes(m) && night ? H.campHere() : null;
        // (an attack cut short - the brain started anew in its middle: its end - the fight if any, the loot, the record)
        const cur = FAB.banditCur;
        if (camp && cur && cur.id === camp.id && !cur.noted && FAB.banditSeen[camp.id] === "atak") return { what: "Obóz bandytów: dokańczam (pobici, worek)", why: "przerwany atak na obóz", run: function* () {
            if (foesNear(10).length) { yield* menFight("obóz bandytów"); if (hpRatio() < BANDIT_FIT.flee) cur.rec.result = "ucieczka (życie " + Math.round(hpRatio() * 100) + "%)"; }
            return yield* banditFinish(camp);
        } };
        if (camp && !FAB.banditSeen[camp.id]) {
            const fit = banditFit(), j = banditJudge(camp);
            if (!fit.ok || !j.ok) {
                FAB.banditSeen[camp.id] = "pominięty";
                note("camps", { what: "pominięty", men: j.txt, why: !fit.ok ? "za słaby: " + fit.why : j.why });
                say("obóz bandytów (" + mapName(m) + "): pomijam - " + (!fit.ok ? fit.why : j.why));
                if (ev) ev.done = true;
                FAB.campNo[m] = now() + 10;   // (no tent by their fire: the night elsewhere)
                return null;
            }
            return { what: "Obóz bandytów (" + mapName(m) + "): " + j.txt, why: "złoto z worka i od pobitych (poziom " + heroLevel() + ", życie " + Math.round(hpRatio() * 100) + "%, opatrunki " + count(152) + ")", run: () => banditAttack(camp) };
        }
        if (ev && !ev.done) {
            // (tired only: a sit by the way mends it - run 2026-11-17: the evening dropped at 19:12 for "siły 35" after the waiting's work)
            const fit = banditFit(), tiredOnly = !fit.ok && /^siły/.test(fit.why);
            if ((!fit.ok && !tiredOnly) || (h >= 23.5 || h < 5)) { ev.done = true; note("camps", { what: "wieczór przerwany", why: !fit.ok ? fit.why : "późna noc, obozu nie znalazł" }); return null; }
            if (m !== ev.map) return { what: "Idę na wieczór do obozów bandytów: " + mapName(ev.map), why: "ogniska płoną nocą od 21:00", run: function* () { if (!(yield* goMap(ev.map, "obóz bandytów"))) ev.done = true; } };
            const st = (H.state().camps || {})[m];
            if (night && st && st.night === H.nightKey() && (st.none || st.over)) {
                ev.done = true;
                FAB.campNo[m] = now() + 10;
                note("camps", { what: "brak obozu", why: "tej nocy nie ma ogniska na mapie " + mapName(m) });
                say("tej nocy nie ma obozu na " + mapName(m) + " - wracam spać");
                return null;
            }
            // (before the night: hungry or thirsty - a bite from the bag; time to spare - the free time's work near by, back by 21:00)
            const nd = needs();
            if (nd.food < 50 && bagFoods().some(f => f.fed > 0)) return { what: "Jem przed nocą przy obozach", why: "sytość " + Math.round(nd.food), run: () => eatBest(false) };
            if (nd.water < 50 && bagFoods().some(f => f.water > 0)) return { what: "Piję przed nocą przy obozach", why: "woda " + Math.round(nd.water), run: () => eatBest(true) };
            if (stamina() < 70 && L.staminaCap() >= 70 && (FAB.restDay || 0) !== day() * 24 + Math.floor(h)) return { what: "Odpoczywam przed nocą przy obozach (siadam - Z)", why: "siły " + Math.round(stamina()) + " - na walkę", run: function* () {
                FAB.restDay = day() * 24 + Math.floor(hour());
                yield* AP.TASKS.rest();
                return true;
            } };
            if (!night && h < 20 && stamina() >= 75) { const fp = freeTimePlan(20.95, m, "Do nocy (obóz)", 0.5); if (fp) return fp; }
            return { what: "Czekam na noc (" + mapName(m) + "): ogniska od 21:00", why: "wieczór na obóz bandytów", run: () => idle(240) };
        }
        // a new evening: the debt paid, every other day at most, strong enough, no shift tonight (from 16:30: on the surface between
        // the trips down the hero is seldom up at 19:00 - run 2026-11-17 from po_pietrze10: every evening under the ground)
        if (ev || h < 16.5 || h >= 20.6) return null;
        if (!FAB.done1) return noEvening("rozdział 1: wieczorem zmiana");
        if (FAB.shiftTried === day()) return noEvening("dziś zmiana u Borgara");
        if (day() <= 3 || day() - (FAB.banditLast || -99) < BANDIT_FIT.every) return noEvening("obóz był wczoraj (co drugi dzień)");
        const fitNow = banditFit();
        if (!fitNow.ok) return noEvening("nie gotów: " + fitNow.why.replace(/\s*[\d(].*$/, ""));   // ("życie 62% (trzeba 80%)" -> "życie")
        {
            const rest = (H.CAMP && H.CAMP.rest) || 2, cleared = (H.state().cleared || {});
            const maps = BANDIT_MAPS.filter(cm => !(cleared[cm] !== undefined && day() - cleared[cm] < rest) && travelH(cm) <= 1.25)
                .sort((a, b) => (b === 219) - (a === 219) || travelH(a) - travelH(b));
            if (!maps.length) return noEvening("obozy rozbite niedawno albo za daleko");
            FAB.banditEve = { key, map: maps[0], done: false };
            FAB.banditLast = day();
            note("camps", { what: "wieczór na obóz", map: maps[0], why: "poziom " + heroLevel() + ", życie " + Math.round(hpRatio() * 100) + "%, opatrunki " + count(152) });
            return { what: "Idę na wieczór do obozów bandytów: " + mapName(maps[0]), why: "uczciwe złoto: worek z łupem i sakiewki pobitych", run: () => goMap(maps[0], "obóz bandytów") };
        }
        return null;
    }
    // up beside a man (approach: the nearest free side), facing him, the blow (the combat mode's "shoot")
    function* banditStrike(h, why, sneak) {
        setDoing(sneak ? "Obóz: skradam się do śpiącego (" + h.name() + ")" : "Obóz: idę na " + h.name(), why);
        for (let k = 0; k < 3 && !h._dead && !h._surrendered; k++) { if (yield* approach([[h._x, h._y]])) break; yield* L.wait(20); }
        if (h._dead || h._surrendered || h.playerDistance() > 1.9) return false;
        yield* combatOn();
        const dx = h.centerX() - (P()._realX + 0.5), dy = h.centerY() - (P()._realY + 0.5);
        L.setMove(L.keysToward(dx, dy)); yield;
        L.setMove([]);
        P().setDirection(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 6 : 4) : (dy > 0 ? 2 : 8));
        L.key("shoot", true); yield; yield; L.key("shoot", false);
        yield* L.wait(12);
        return true;
    }
    // away from the fire and the men: the open tile 5-13 steps off farthest from them, running (Shift), until none is after him (their
    // leash: some 20 tiles from their place)
    function* banditFlee(fx, fy, why) {
        setDoing("Uciekam od bandytów (życie " + Math.round(hpRatio() * 100) + "%)", why);
        for (let r = 0; r < 12; r++) {
            if (HM() && HM().robbery) break;
            const th = menNear(12);
            if (!th.length && Math.hypot(P().x - fx, P().y - fy) > 14) break;
            const f = L.field(P().x, P().y), foe = th[0] ? th[0].a : null;
            let best = null;
            for (let y = P().y - 11; y <= P().y + 11; y++) for (let x = P().x - 11; x <= P().x + 11; x++) {
                if (!$gameMap.isValid(x, y)) continue;
                const c = f.at(x, y);
                if (!isFinite(c) || c < 5 || c > 13) continue;
                const s = Math.hypot(x - fx, y - fy) + (foe ? 0.7 * Math.hypot(x + 0.5 - foe.centerX(), y + 0.5 - foe.centerY()) : 0) - 0.3 * c;
                if (!best || s > best.s) best = { x, y, s };
            }
            if (!best) break;
            yield* combatOff();
            L.key("shift", true);
            yield* L.walkTo(best.x, best.y, f);
            L.key("shift", false);
        }
        L.key("shift", false);
    }
    // after the fight: the kneeling ones (up to him - the game asks; the policy spares him), the beaten searched, the sack taken (O on it)
    function* banditLoot(camp, why) {
        // (2026-11-17 test: once the camp beaten and its sack left lying - one try a drop, 16 rounds: now two tries each, more rounds;
        // the second try comes from beside it, not onto its cell)
        const H = HM(), tried = new Map(), asked = new Set();
        for (let k = 0; k < 30; k++) {
            if (busy()) { yield* drive({}); continue; }
            if (foesNear(9).length) { yield* timeboxed(fightFoes(60 * 30, why), () => hpRatio() < BANDIT_FIT.flee); if (hpRatio() < BANDIT_FIT.flee) return; continue; }
            const kneel = (H.list || []).find(h => h && !h._dead && h._surrendered && !h._defeated && !asked.has(h));
            if (kneel) {
                asked.add(kneel);
                setDoing("Obóz: " + kneel.name() + " błaga o litość - podchodzę", why);
                yield* combatOff();
                // (run 2026-11-17: the walk to a kneeling knifer stood a minute in place - ap.js's watchdog started the brain anew and
                // the sack was never taken: the walk time-boxed, the camp's end resumed by banditPlan when it happens all the same)
                const f0 = AP.frame;
                yield* timeboxed(approach([[kneel._x, kneel._y]]), () => AP.frame - f0 > 900);
                AP.saidAt = AP.frame;
                for (let n = 0; n < 150 && !busy(); n++) yield;   // (the game asks what to do with him)
                if (busy()) yield* drive({});
                continue;
            }
            const near = d => Math.hypot(d.x - camp.x, d.y - camp.y) < 16;
            const drops = (H.drops() || []).filter(d => (tried.get(d.id) || 0) < 2 && near(d) && ((d.kind === "sack" && d.camp === camp.id) || (d.kind === "body" && (d.gold > 0 || (d.items || []).length))));
            if (!drops.length) break;
            const px = P()._realX + 0.5, py = P()._realY + 0.5, d = drops.sort((a, b) => Math.hypot(a.x - px, a.y - py) - Math.hypot(b.x - px, b.y - py))[0];
            const again = (tried.get(d.id) || 0) > 0;
            tried.set(d.id, (tried.get(d.id) || 0) + 1);
            yield* combatOff();
            const tx = Math.floor(d.x), ty = Math.floor(d.y), g1 = gold();
            setDoing(d.kind === "sack" ? "Obóz: biorę worek z łupem" : "Obóz: przeszukuję pobitego", why);
            const f1 = AP.frame, slow = () => AP.frame - f1 > 900;
            if (!(P().x === tx && P().y === ty) && (again || (yield* timeboxed(L.walkTo(tx, ty), slow)) !== true) && !(yield* timeboxed(approach([[tx, ty]]), slow))) continue;
            AP.saidAt = AP.frame;
            const ddx = d.x - (P()._realX + 0.5), ddy = d.y - (P()._realY + 0.5);
            if (Math.hypot(ddx, ddy) > 0.3) P().setDirection(Math.abs(ddx) >= Math.abs(ddy) ? (ddx > 0 ? 6 : 4) : (ddy > 0 ? 2 : 8));
            yield* L.wait(2);
            yield* L.press("ok");
            yield* L.wait(50);
            yield* L.waitFree(120);
            say((d.kind === "sack" ? "worek z łupem" : "przeszukał pobitego") + ": +" + (gold() - g1) + " G");
        }
    }
    function* banditAttack(camp) {
        const H = HM(), m = mapId(), why = "obóz bandytów (" + mapName(m) + ")", g0 = gold(), b0 = count(152), beaten0 = H.state().beaten || 0;
        const rec = { what: "atak", map: m, men: banditJudge(camp).txt, result: "", gold: 0, hp0: Math.round(hpRatio() * 100), level: heroLevel() };
        FAB.banditCur = { id: camp.id, rec, g0, b0, noted: false };
        (FAB.banditSeen = FAB.banditSeen || {})[camp.id] = "atak";
        FAB.campNo[m] = now() + 12;   // (the night at home afterwards: not by their fire, where the raids come)
        let heals = 0;
        FAB.goldCtx = "obozy";
        try {
            yield* combatOff();
            // 1. to the edge of the fire's light (it shows from afar at night), then sneaking (C)
            setDoing("Obóz bandytów: idę do ogniska (widać je z daleka)", why);
            const f = L.field(P().x, P().y);
            let edge = null;
            for (let y = camp.y - 9; y <= camp.y + 9; y++) for (let x = camp.x - 9; x <= camp.x + 9; x++) {
                if (!$gameMap.isValid(x, y)) continue;
                const d = Math.hypot(x - camp.x, y - camp.y), c = f.at(x, y);
                if (d < 6 || d > 8.5 || !isFinite(c)) continue;
                if (!edge || c < edge.c) edge = { x, y, c };
            }
            if (edge && Math.hypot(P().x - camp.x, P().y - camp.y) > 8.5) yield* L.walkTo(edge.x, edge.y, f);
            if (!sneakingNow()) { yield* L.press("sneak"); yield* L.wait(4); }
            // 2. a sleeper first (a blow from hiding breaks his balance - he reels), else the nearest
            const men0 = banditMen(camp).sort((a, b) => a.playerDistance() - b.playerDistance());
            const first = men0.find(h => h._mode === "sleep") || men0[0];
            if (first) yield* banditStrike(first, why, true);
            if (sneakingNow()) yield* L.press("sneak");
            // 3. the fight: all who stand; under half his life a bandage (twice at most), then away
            for (let k = 0; k < 40; k++) {
                if (H.robbery || (H.state().beaten || 0) > beaten0) { rec.result = "pobity i obrabowany"; break; }
                const standing = banditMen(camp).filter(h => !h._surrendered && h._mode !== "flee" && h._mode !== "leave");
                if (!standing.length) break;
                if (hpRatio() < BANDIT_FIT.flee) {
                    if (count(152) > 0 && heals < BANDIT_FIT.heals && !foesNear(3).some(x => x.tell && x.tell.t < 40)) { heals++; yield* combatOn(); L.key("heal", true); yield; yield; L.key("heal", false); yield* L.wait(40); continue; }
                    rec.result = "ucieczka (życie " + Math.round(hpRatio() * 100) + "%)";
                    yield* banditFlee(camp.x, camp.y, why);
                    break;
                }
                if (foesNear(10).length) { yield* timeboxed(fightFoes(60 * 30, why), () => hpRatio() < BANDIT_FIT.flee || !!H.robbery); continue; }
                yield* banditStrike(standing.sort((a, b) => a.playerDistance() - b.playerDistance())[0], why, false);   // (one not fighting yet: up to him)
            }
            if (!rec.result) rec.result = banditMen(camp).some(h => !h._surrendered && h._mode !== "flee" && h._mode !== "leave") ? "nie dokończony" : "rozbity";
        } finally { FAB.goldCtx = null; L.releaseAll(); }
        return yield* banditFinish(camp);
    }
    // the camp's end: the kneeling ones spared, the beaten searched, the sack taken (not after a flight or a robbery), then the record.
    // (FAB.banditCur keeps the attack's start: a brain started anew in between - ap.js's watchdog - comes back here by banditPlan)
    function* banditFinish(camp) {
        const H = HM(), cur = FAB.banditCur, rec = cur.rec, why = "obóz bandytów (" + mapName(mapId()) + ")";
        if (!rec.result) rec.result = banditMen(camp).some(h => !h._surrendered && h._mode !== "flee" && h._mode !== "leave") ? "nie dokończony" : "rozbity";
        FAB.goldCtx = "obozy";
        try { if (!/pobity|ucieczka/.test(rec.result)) yield* banditLoot(camp, why); } finally { FAB.goldCtx = null; L.releaseAll(); }
        if (sneakingNow()) yield* L.press("sneak");
        Object.assign(rec, { gold: gold() - cur.g0, bandages: cur.b0 - count(152), hp: Math.round(hpRatio() * 100), sack: !(H.drops() || []).some(d => d.kind === "sack" && d.camp === camp.id) });
        if (!cur.noted) { cur.noted = true; note("camps", rec); }
        say("obóz bandytów: " + rec.result + ", złoto " + (rec.gold >= 0 ? "+" : "") + rec.gold + " G, worek " + (rec.sack ? "wzięty" : "nie") + ", życie " + rec.hp + "%");
        if (FAB.banditEve) FAB.banditEve.done = true;
        return true;
    }
    // (2026-11-17) men after him on the surface - a camp's band, a raid on his sleep, an ambush on the road: he fights (their blows never
    // kill; a beaten hero is robbed), a bandage under half his life, then away; the kneeling spared and the beaten searched afterwards
    function* menFight(why) {
        const x0 = P().x, y0 = P().y;
        let heals = 0;
        for (let k = 0; k < 30 && menNear(10).length; k++) {
            if (HM() && HM().robbery) break;
            if (hpRatio() < BANDIT_FIT.flee) {
                if (count(152) > 0 && heals < BANDIT_FIT.heals && !foesNear(3).some(x => x.tell && x.tell.t < 40)) { heals++; yield* combatOn(); L.key("heal", true); yield; yield; L.key("heal", false); yield* L.wait(40); continue; }
                const t = menNear(10)[0];
                note("camps", { what: "ucieczka przed bandytami", why: "życie " + Math.round(hpRatio() * 100) + "%" });
                yield* banditFlee(t ? t.a.centerX() : P().x, t ? t.a.centerY() : P().y, why);
                return true;
            }
            yield* timeboxed(fightFoes(60 * 30, why), () => hpRatio() < BANDIT_FIT.flee || !!(HM() && HM().robbery));
        }
        if (!(HM() && HM().robbery)) { const g0 = gold(); FAB.goldCtx = "obozy"; try { yield* banditLoot({ id: -1, x: x0, y: y0 }, why); } finally { FAB.goldCtx = null; } if (gold() > g0) say("łup po napadzie: +" + (gold() - g0) + " G"); }
        return true;
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
                if (mapId() === MAP.town) yield* L.walkTo(43, 37); else yield* L.walkTo(14, 30);
                yield* idle(120);
                return true;
            } };
        }
        if (ph === "armed") {
            const night = st.siegeDay && day() >= st.siegeDay && (h >= 20.5 || h < 4);
            if (night) {
                if (mapId() !== MAP.town && mapId() !== MAP.tavern) return { what: "Noc napadu: wracam pod tawernę", why, run: () => goMap(MAP.town, why) };
                return { what: "Noc napadu: czekam pod tawerną", why, run: function* () { yield* L.walkTo(43, 37); yield* idle(300); } };
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
        // 0. men after him on the surface (a camp's band, a raid on his sleep, an ambush): the fight first (2026-11-17)
        if (!inUnder() && a3 !== "siege" && menNear(10).length) return { what: "Bandyci! Bronię się", why: "ludzie z pałkami i łukami (ich ciosy nie zabijają - pobity zostaje obrabowany)", run: () => menFight("napad bandytów") };
        // 0a. a bandit camp tonight: its fire attacked or passed by, an evening on its way (2026-11-17, uczciwe złoto poza zmianami)
        if (!lastNight && !bellNight && !siegeNight && a3 !== "armed") { const bp = banditPlan(); if (bp) return bp; }
        if ((h >= 21.25 || h < 5.5) && !(lastNight && gold() > 0) && !inUnder() && !bellNight && !siegeNight) {
            if (mapId() === MAP.field && hasBedroll()) return { what: "Śpię na działce", why: "noc (" + clock() + "), leśne legowisko", run: sleepField };
            const camp = campOk() ? campHere() : null, sealed = homeSealed(), stableOk = !!(s.flags && s.flags.stajnia), far = m => travelH(m) > 1.25;
            if (camp) return { what: "Śpię w obozie (" + mapName(mapId()) + ")", why: "noc (" + clock() + "), " + (camp.type === "tent" ? "namiot" : "leśne legowisko") + " tutaj", run: () => campSleep("noc") };
            // (far from every bed with the tent in the bag: pitched where he stands)
            if (count(TENT) > 0 && campOk() && (sealed ? (!hasBedroll() || far(MAP.field)) && (!stableOk || far(STABLE)) : far(MAP.house)))
                return { what: "Rozkładam namiot tutaj i śpię (" + mapName(mapId()) + ")", why: "noc (" + clock() + "), do posłania daleko - namiot z plecaka", run: () => campSleep("noc") };
            if (sealed) {
                if (hasBedroll()) return { what: "Idę spać na działkę", why: "noc (" + clock() + "), chata zapieczętowana - leśne legowisko", run: function* () { if (yield* goMap(MAP.field, "sen")) return yield* sleepField(); return false; } };
                if (stableOk || !campOk()) return { what: "Idę spać na stryszek w stajni", why: "noc (" + clock() + "), chata dziadka zapieczętowana - Szczepan daje siano", run: sleepStable };
                return { what: "Nie mam gdzie spać - robię nocleg tutaj (" + mapName(mapId()) + ")", why: "noc (" + clock() + "), chata zapieczętowana, stryszku u Szczepana jeszcze nie ma - " + (count(TENT) ? "namiot" : "leśne legowisko z gałęzi i włókna"), run: () => campSleep("noc") };
            }
            return { what: "Idę spać do domu dziadka", why: "noc (" + clock() + "), posłanie u dziadka za darmo", run: sleepHome };
        }
        // (the morning: the tent packed back into the bag - the next night it goes up wherever he is)
        const pitched = campHere();
        if (pitched && pitched.type === "tent" && h >= 5.5 && h < 21 && !((FAB.packNo || 0) > now())) {
            return { what: "Składam namiot do plecaka", why: "rano - namiot idzie ze mną na następną noc", run: function* () {
                const ok = yield* AP.TASKS.useEntry(pitched, "Złóż namiot");
                if (!ok) FAB.packNo = now() + 3;
                return ok;
            } };
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
        // 2c. the quest board in the tavern / the town (2026-11-17): a contract turned in or given up, new ones looked at - a few minutes
        // when he is there anyway (QB_MAPS), a short way only for a ready one
        if (!inUnder() && !needUrgent()) { const qp = qbBoardPlan(); if (qp) return qp; }
        // 2a. pines from cones on the plot (the player 2026-11-17: "gracz może względnie wcześniej zasadzić kilka drzew" - the plot's
        // trees all cut by the time the forge wants charcoal): once a day while he is on the plot in the daytime with cones in the bag
        if (!inUnder() && mapId() === MAP.field && count(CONE) > 0 && plantedPines() < PINES_WANT && FAB.pineDay !== day() && h >= 6 && h < 18 && stamina() > 30 && !needUrgent())
            return { what: "Sadzę sosny z szyszek na działce", why: "drewno na później - rośnie ich " + plantedPines() + "/" + PINES_WANT, run: function* () { FAB.pineDay = day(); yield* plantPines(4); return true; } };
        // 2b. Wezwanie króla (the new world): be before the hut on day 3 (7-18) for the summons; the letter under the door when it waits
        // there; the letter to Szczepan in the stable (then the hay loft is his bed)
        const wz = wezNow();
        if (wz && !inUnder()) {
            if (!wz.called && day() >= 3 && h >= 7 && h < 15.5) return { what: "Wezwanie króla: czekam przed chatą dziadka", why: "dzień " + day() + " - goniec Lorda przychodzi po dziadka", run: function* () {
                if (!(yield* goTile(MAP.yard, 14, 22, "wezwanie"))) return false;
                yield* idle(240);
                return true;
            } };
            if (wz.called && !wz.letter && h >= 6 && h < 20) return { what: "Wezwanie króla: list dziadka pod drzwiami chaty", why: "dziadek odpłynął - list czeka", run: function* () {
                if (!(yield* goTile(MAP.yard, 14, 22, "list"))) return false;
                yield* idle(120);
                return true;
            } };
            // (Szczepan is not always in his stable: a look in, half an hour at most, then again in three hours - the day goes on meanwhile)
            // (where Szczepan is at this hour - TownLife_Data's kolodziej: inside the stable 20:30-5, by his cart / on the square 5-7,
            // 10:30-14, 17:30-20:30, away on the road the rest; 2026-11-19: looked for inside the stable by day, never there)
            const kolWhere = hh => (hh >= 20.5 || hh < 5) ? STABLE : ((hh >= 5 && hh < 7) || (hh >= 10.5 && hh < 14) || (hh >= 17.5 && hh < 20.5)) ? MAP.town : null;
            if (wz.letter && !(s.flags && s.flags.stajnia) && h >= 5 && h < 21.5 && kolWhere(h) && (FAB.letterNext || 0) <= now()) return { what: "Niosę list dziadka Szczepanowi (" + (kolWhere(h) === STABLE ? "stajnia" : "przy wozie / na placu") + ")", why: "Wezwanie króla: nocleg w stajni", run: function* () {
                if (!(yield* goMap(kolWhere(hour()) || STABLE, "list do Szczepana"))) return false;
                const kol = () => (window.TownLife && TownLife.eventOf ? TownLife.eventOf("kolodziej") : null);
                for (let k = 0; k < 3; k++) {
                    const e = kol();
                    if (!e || e.isTransparent() || (e._town && e._town.hidden) || (window.$gameMap && $gameMap.event(e.eventId()) !== e)) { setDoing("Czekam na Szczepana w stajni", "Wezwanie króla"); yield* idle(120); continue; }
                    const r = yield* talkTo(kol, { leave: true });
                    if (r.ok) return true;
                }
                FAB.letterNext = now() + 1;
                say("Szczepana tu nie ma - zajrzę za godzinę");
                return false;
            } };
        }
        // 3. rozdział 1: działka, praca, zmiany, spłata
        if (!chapterDone) {
            if (!s.flags.field) return { what: "Idę na działkę dziadka (Kruczy Jar)", why: "Rozdział 1: dziadek pozwala budować na swoim polu", run: function* () {
                checkGoal("field", MAP.field); yield* goMap(MAP.field, "działka"); yield* idle(40);
            } };
            if (!s.flags.hired) return { what: "Idę do Borgara po pracę", why: "Rozdział 1: praca w tawernie", run: function* () {
                checkGoal("hire", MAP.tavern);
                if (!(yield* toCounter())) return false;
                installShiftBot();
                yield* talkTo(borgarCounter, { tiles: [COUNTER], picks: shiftOpen() && h >= 16 ? ["Weź zmianę"] : [], leave: true });
                if (TavernShift.liveRunning && TavernShift.liveRunning()) yield* playLiveShift();
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
                if (mapId() === MAP.tavern && Math.abs(P().x - COUNTER[0]) + Math.abs(P().y - COUNTER[1]) <= 2) return { what: "Czekam w tawernie na zmianę (od 16:00)", why: ch1, run: () => idle(900) };
                return { what: "Idę do tawerny", why: ch1 + " - zmiana od 16:00", run: function* () { if (needs().water < 80 && wellLeft() > 1) yield* drinkWell(); return yield* toCounter(); } };
            }
            if (homeSealed()) return hasBedroll() ? { what: "Wracam na działkę", why: "wieczór - chata zapieczętowana, sen na legowisku", run: function* () { yield* goMap(MAP.field, "sen"); yield* idle(120); } }
                : { what: "Idę do stajni na noc", why: "wieczór - chata zapieczętowana, stryszek u Szczepana", run: function* () { yield* goMap(STABLE, "sen"); yield* idle(120); } };
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
        // (2026-11-17) contracts from the board between the trips down: QB_DAY_H hours a day at most, in the daytime, on the surface
        if (!inUnder() && deep < UNDER_GOAL) { const cw = qbWindow(); if (cw) return cw; }
        // a weapon before the underground: the iron spear from his own forge (Bron: „Wykuj: żelazna włócznia” - 2 iron, 1 coal, 2 wood),
        // else the oak staff from the workbench; put in hand as in the equipment window
        const weapon = bestWeapon();
        // (the spear's 2 iron: 2 ore each - the ore from the mountains first)
        if (weapon !== 331 && !inUnder() && !FAB.spearGaveUp && count(331) === 0 && count(86) < 2 && count(85) < 2 * (2 - count(86)) && oreTripOk())
            return oreTrip("przed podziemiami: żelazo na włócznię", 2 * (2 - count(86)));
        // (the charcoal for that iron wants 6 wood: the plot's trees all cut - the woods)
        if (weapon !== 331 && !inUnder() && !FAB.spearGaveUp && count(331) === 0 && FAB.fieldNoTrees === day() && count(61) < 8 && woodTripOk())
            return woodTrip("przed podziemiami: drewno na węgiel do żelaza na włócznię", 8);
        if (weapon !== 331 && !inUnder() && !FAB.spearGaveUp) return { what: "Kuję żelazną włócznię (kuźnia na działce)", why: "przed podziemiami: broń (pięści to za mało na stwory)", run: function* () {
            const r = yield* fieldWork(PLAN_IRON.concat(["Oszczep"]), () => count(331) > 0 || hour() >= 20.5 || hour() < 5.5, "broń na podziemia", function* () {
                if (count(86) < 2 || count(79) < 1 || count(61) < 2) {
                    setDoing("Na działce: żelazo na włócznię", "broń na podziemia");
                    if (yield* AP.TASKS.obtain({ 86: 2, 79: 1 + (count(86) < 2 ? 2 : 0), 61: 2 })) return "dalej";
                    // (no tree left to cut on the plot: off to the woods - the plan's next pass; not ten-minute waits all day)
                    if (count(61) < 8 && !AP.bestWood(true)) { FAB.fieldNoTrees = day(); say("na działce nie ma drzew do ścięcia - idę po drewno do lasu"); return true; }
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
        // (2026-11-17 balance with the player: 4 bandages - a spider's bite wounds; herbs off the plot too when it has none left)
        // (the herbs and the yarrow have their seasons - Farming GATHER: out of season no bandage is made from the ground)
        if (count(152) < BANDAGES && !inUnder() && !FAB.bandageGaveUp && deep < UNDER_GOAL && bandageSeason()) return { what: "Robię opatrunki na drogę (zioła, krwawnik, włókno)", why: "przed podziemiami: rany goją się tylko opatrunkiem albo snem", run: function* () {
            const r = yield* fieldWork([], () => count(152) >= BANDAGES || hour() >= 20.5 || hour() < 5.5 || (FAB.bandageField || 0) > 5, "opatrunki na podziemia", function* () {
                FAB.bandageField = (FAB.bandageField || 0) + 1;
                for (const [id, kind] of [[104, "herb"], [150, "yarrow"], [92, "fiber"]]) if (count(id) < 2) { setDoing("Na działce: zbieram " + $dataItems[id].name, "opatrunki"); yield* AP.TASKS.gather([kind], 2 - count(id)); }
                if (count(104) >= 2 && count(150) >= 2 && count(92) >= 2) { setDoing("Robię opatrunek", "opatrunki"); yield* AP.TASKS.handCraft("Zrób opatrunek"); FAB.bandageField = 0; }
                return count(152) >= BANDAGES ? true : "dalej";
            });
            if (count(152) >= BANDAGES || hour() >= 20.5 || hour() < 5.5) return r;
            // (the plot gave nothing for a while: the herbs and the yarrow of the wild - the mountains, the coast)
            FAB.bandageField = 0;
            FAB.bandageTries = (FAB.bandageTries || 0) + 1;
            if (FAB.bandageTries > 6) { FAB.bandageGaveUp = true; note("notes", { what: "opatrunki: nie udało się zebrać ziół / krwawnika (pora roku?) - schodzi z " + count(152) }); return true; }
            for (const m of [222, 219]) {
                if (count(152) >= BANDAGES || hour() >= 19) break;
                if (!(yield* goMap(m, "zioła na opatrunki"))) continue;
                for (let k = 0; k < 6 && count(152) < BANDAGES; k++) {
                    for (const [id, kind] of [[104, "herb"], [150, "yarrow"], [92, "fiber"]]) if (count(id) < 2) { setDoing(mapName(m) + ": zbieram " + $dataItems[id].name, "opatrunki"); yield* AP.TASKS.gather([kind], 2 - count(id)); }
                    if (count(104) >= 2 && count(150) >= 2 && count(92) >= 2) { setDoing("Robię opatrunek", "opatrunki"); yield* AP.TASKS.handCraft("Zrób opatrunek"); }
                    else break;
                }
            }
            return true;
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
                // (2026-11-17 run: 177 G in the purse and still no torso armour - the shops were only visited before the first trip and
                // after deaths) up on the surface with the gold for a better piece: to its seller first (the torso before the rest)
                const hs = hour(), shopTired = FAB.shopNone && FAB.shopNone.day === day() && FAB.shopNone.n >= 4;
                if (hs >= 6.2 && hs < 16.5 && !shopTired) {
                    const wish = shopWishlist($gameParty.gold() - 20);
                    if (wish.length) {
                        const seller = wish[0].who || "kowal", list = wish.filter(w => (w.who || "kowal") === seller);
                        return { what: "Kupuję lepszą zbroję: " + SELLERS[seller].name + " (" + list.map(w => w.name).join(", ") + ")", why: "na górze, w sakiewce " + $gameParty.gold() + " G", run: () => shopAtTadek(list, false, "zbroja przed zejściem", seller) };
                    }
                }
                // (2026-11-17 runs from po_pietrze10: life 100%, strength 30 at 9:48 - to bed until the next morning, a whole day and a
                // "stall". Only tired in the daytime: a seated rest (Z, an hour a second) - the bed for the wounds and the night)
                if (hpRatio() >= 0.7 && stamina() < 55 && L.staminaCap() >= 60 && hour() >= 6 && hour() < 18 && (FAB.restDay || 0) !== day() * 24 + Math.floor(hour())) return { what: "Odpoczywam przed zejściem (siadam - Z)", why: "siły " + Math.round(stamina()) + ", życie " + Math.round(hpRatio() * 100) + "%", run: function* () {
                    FAB.restDay = day() * 24 + Math.floor(hour());   // (one sit an hour: when it does not help, the bed below)
                    const s0 = stamina();
                    yield* AP.TASKS.rest();
                    say("odpoczął siedząc: siły " + Math.round(s0) + " → " + Math.round(stamina()));
                    return true;
                } };
                if (hpRatio() < 0.7 || stamina() < 55) return { what: "Odpoczywam przed zejściem (sen u dziadka)", why: "życie " + Math.round(hpRatio() * 100) + "%, siły " + Math.round(stamina()), run: sleepHome };
                // (no skin: its way once a day before a trip down - the tannery, a tanned hide, 3 fibre; else down without it)
                if (!skinOwned() && !FAB.skinGaveUp && FAB.skinDay !== day() && hour() >= 6 && hour() < 17) return { what: "Robię bukłak (garbarnia, skóra, len)", why: "woda na drogę pod ziemię - 4 łyki po 35", run: function* () {
                    FAB.skinDay = day();
                    const ok = yield* makeSkin("bukłak na podziemia");
                    if (!ok) { FAB.skinFails = (FAB.skinFails || 0) + 1; if (FAB.skinFails > 8) { FAB.skinGaveUp = true; note("unclear", { what: "bukłak: 8 dni bez skutku (garbarnia / surowa skóra / len)" }); } }
                    return true;
                } };
                // (2026-11-17: water for the deeper floors - his own well on the plot, no ration; then the skin made bigger, 8 sips)
                if (!ownWell() && !FAB.wellGaveUp && FAB.wellDay !== day() && deep >= 10 && hour() >= 6 && hour() < 15) return { what: "Buduję własną studnię na działce", why: "studnia miejska daje 2 nabrania dziennie - za mało na zejścia poniżej 10. piętra", run: () => buildOwnWell("własna studnia: woda bez przydziału") };
                if (skinOwned() && !skinBig() && tanneryUp() && FAB.skinBigDay !== day() && hour() >= 6 && hour() < 17 && (count(163) >= 2 || builtOn(MAP.field).some(b => b.type === "snare"))) return { what: "Powiększam bukłak (garbarnia: skóra i 2 ścięgna)", why: "8 łyków zamiast " + skinMax() + " - woda na powrót z głębszych pięter", run: () => enlargeSkin("większy bukłak") };
                if (skinOwned() && skinSips() < skinMax() && wellLeft() > 0) return { what: "Napełniam bukłak przed zejściem", why: "bukłak " + skinSips() + "/" + skinMax() + " (pod ziemią wody nie ma do piętra 50)" + (ownWell() ? ", własna studnia" : ""), run: fillSkinWell };
                if (nn.water < (ownWell() ? 85 : 70) && wellLeft() > 0) return { what: "Piję ze studni przed zejściem" + (ownWell() ? " (własna, na działce)" : ""), why: "woda " + Math.round(nn.water) + " (pod ziemią wody nie ma do piętra 50)", run: drinkWell };
                // (the well's two draws used up and too little water for a trip down: the night first, tomorrow's draws)
                if (nn.water < 50 && wellLeft() === 0) return { what: "Czekam do jutra na wodę (studnia: koniec przydziału)", why: "woda " + Math.round(nn.water) + " - za mało na wyprawę pod ziemię", run: sleepHome };
                if (count(SOUP) < 2 && FAB.soupDay !== day() && hour() >= 8 && hour() < 18) return { what: "Biorę kapuśniak na drogę", why: "jedzenie pod ziemię", run: function* () { if (yield* goMap(MAP.house, "kapuśniak")) yield* takeSoup(); } };
            }
            // training: dying again after a preparing - the floor above first, a few hours of its creatures (experience), then deeper
            // (on the training floor itself - from a deeper one he goes up first, underPlan; until one level more, a day at most)
            // (run 13: he trained on floor 9 until the water was 0 - no training while the water for the way back runs short: underPlan
            // takes him up to the well first)
            if (FAB.trainCap && inUnder() && floorNow() === FAB.trainCap && needs().water + skinWater() >= waterBack(floorNow())) {
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
            contracts: (FAB.rep.contracts || []).filter(c => c.what === "oddane").length, camps: (FAB.rep.camps || []).filter(c => c.what === "atak").length,
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
            // (2026-11-17 run from po_pietrze10: dead on floor 10 in its first minutes, before any autosave or safe save - no slot, no
            // reload, and the guard noted the same death 775 times. Then the newest save there is: the checkpoint the run began from)
            if (best < 0) for (let i = 0; i < info.length; i++) if (info[i] && info[i].timestamp > ts) { ts = info[i].timestamp; best = i; }
            if (best < 0) return false;
            // (the gold earned since that save is gone with the load: counted apart in the ledger, not taken off its sources)
            const g0 = $gameParty.gold();
            await DataManager.loadGame(best);
            $gameSystem.onAfterLoad();
            try { ledger().reload += $gameParty.gold() - g0; } catch (e) { /* (only the counting) */ }
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
    // (for tests/sosny_autopilot_test.js: the pines on their own - AP.run([["fab_plant", n]]))
    AP.TASKS.fab_plant = function* (n) { return yield* plantPines(n || 4); };
    AP.TASKS.fab_skin = function* (what) { return what === "fill" ? yield* fillSkinWell() : what === "sip" ? yield* sipSkin() : yield* makeSkin("test"); };
    // (for tests/woda_autopilot_test.js: the own well, a drink / the skin there, the bigger skin - AP.run([["fab_water", what]]))
    AP.TASKS.fab_water = function* (what) { return what === "well" ? yield* buildOwnWell("test") : what === "big" ? yield* enlargeSkin("test") : yield* drinkWell(what === "fill" ? "Napełnij bukłak" : "Napij się"); };
    FAB.trees = { pineSpot, plantedPines, PINES_WANT };
    // (for tests/autopilot_kontrakty_test.js and tests/autopilot_oboz_test.js: the board, a contract's work, a camp - on their own)
    AP.TASKS.fab_board = function* (m) { if (m && !(yield* goMap(m, "test: tablica"))) return false; return yield* qbVisit("test: tablica zleceń"); };
    AP.TASKS.fab_contract = function* (m) { if (m && !(yield* goMap(m, "test: zlecenie"))) return false; return yield* qbWork("test: zlecenie"); };
    AP.TASKS.fab_camp = function* () { const c = HM() && HM().campHere(); return c ? yield* banditAttack(c) : false; };
    FAB.qb = { judge: qbJudge, pick: qbPick, ready: qbReadyList, drop: qbDropList, next: qbWorkNext, huntOk, bountyOk, plan: qbBoardPlan };
    FAB.bandits = { fit: banditFit, judge: banditJudge, plan: banditPlan, FIT: BANDIT_FIT };
    FAB.unstickWalk = function() { AP.stop(); AP.restartWith = [["fabula"]]; AP.run([["fabula_unstick"], ["fabula"]]); FAB.on = true; return true; };
    FAB.stop = function() { FAB.on = false; AP.stop(); L.releaseAll(); return true; };
    return "ok v" + VERSION;
})();
