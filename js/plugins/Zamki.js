//=============================================================================
// Zamki.js
//=============================================================================
// (2026-11-19, the user: lockpicks for "zamknięte skrzynie w podziemiach albo w obozach bandytów, zamknięte drzwi w fabule, kłódki na
// cudzych skrzyniach w miasteczku, gdzie złapanie na gorącym uczynku obniża opinię mieszkańców" - "włamywanie i użycie wytrychu można tylko
// w trybie skradania (C)")
//   - THE LOCKS:
//       town   - the town's chests: every "Skrzynia..." / "Kufer..." event with an empty page in the houses round the town (they were
//                bare decoration). Opened: coppers and a thing or two (the strongboxes more); locked and filled again after REFILL days.
//       ruins  - the underground: half the chests ("skrzynia") of the generated floors (by their place - the same every visit). Opened:
//                the chest's own loot (Underground.search) and a purse more; it stays open (its self switch A).
//       camp   - the bandits' night camps: an iron-bound box by the fire (Humans.js draws it, a drop of kind "chest"). Opened: what is in
//                it (Humans.searchDrop). The clicks of the pick are a noise (one awake by the fire may hear).
//       + what other systems register (Zamki.register(mapId, eventId, { level, loot, owner, onOpen })).
//   - PICKING: O at a lock - not sneaking: "only while sneaking (C)"; no lockpick: "no lockpick". Sneaking with one: hold O, the ring
//     over the lock fills (LEVEL's seconds, Zręczność quicker); every second a pick may break (LEVEL's chance, Zręczność less): one
//     lockpick gone, the ring falls back. Let go: the ring waits; walk away or get hit: it is lost. In the town the people's meters run
//     (Widzenie.illicit) - someone's full meter = CAUGHT: "Złodziej!" over him, the town's opinion down (TownQuests.addOpinion), and that
//     lock is not tried again today.
// Saved: Tawerna.state("zamki") = { locks: { "mapId:eventId": { open: day, caught: day } } } (the town's chests; the others keep theirs).

/*:
 * @target MZ
 * @plugindesc Zamki i wytrychy: zamknięte skrzynie (domy miasteczka, podziemia, obozy bandytów), wytrych tylko w skradaniu (przytrzymaj O), pęka, złapany - opinia w dół. v1.3.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Widzenie
 *
 * @help
 * ============================================================================
 * Zamki.js - zamki i wytrychy
 * ============================================================================
 * Skrzynie w domach miasteczka, połowa skrzyń w podziemiach i okute
 * skrzynki w obozach bandytów są zamknięte. Wytrychem (kuźnia: 5 z jednej
 * sztabki) otworzysz je tylko w skradaniu (C): stań przy skrzyni
 * i przytrzymaj O. Wytrych może pęknąć. W miasteczku, jeśli ktoś cię
 * zobaczy - „Złodziej!”, opinia spada, a tej skrzyni do jutra nie ruszysz.
 * W obozie stukanie wytrycha może obudzić bandytów.
 * ============================================================================
 */

(() => {
    "use strict";
    const PLUGIN = "Zamki";
    const T = window.Tawerna;
    if (!T) throw new Error("Zamki.js: brak TawernaCore.js (the Tawerna core is missing)");

    const PICK = 515;
    // (2026-11-19, the user: "warto też dodać poziomy trudności zamka") the levels: the name said at the lock, the seconds of picking
    // (Zręczność 5), the chance a pick breaks each second, the Zręczność a lock asks for (the master's and the Order's)
    const LEVEL = {
        1: { name: "prosty", secs: 2.5, brk: 0.04, dex: 0 },
        2: { name: "solidny", secs: 4, brk: 0.07, dex: 0 },
        3: { name: "okuty", secs: 6, brk: 0.1, dex: 0 },
        4: { name: "mistrzowski", secs: 8, brk: 0.13, dex: 10 },
        5: { name: "zakonny", secs: 10, brk: 0.16, dex: 15 }
    };
    const PIP = [0, 0x9fe08a, 0xffd23f, 0xffa040, 0xff6050, 0xc890ff];   // (the level's colour: the dots under the ring)
    const REFILL = 7, CAUGHT_OPINION = -5, NOISE = 2;
    // the town's houses (the maps whose chests are locked): the interiors of the new world's town, village and coast
    const TOWN_PARENTS = [218, 219, 220, 221];
    const NOT_MAPS = [1, 100, 166, 224];   // (the tavern, the hero's hut, the wreck - its own story, grandpa's house)
    // the underground: which share of the chests is locked, the level by the floor, the purse more in a locked one (coppers)
    // (a level of two by the floor: 1-2 on 1-10, 2-3 on 11-30, 3-4 on 31-60, 4-5 deeper - the place's number picks which)
    const RUINS = { share: 0.5, kinds: ["skrzynia"], level: (f, h) => (f <= 10 ? 1 : f <= 30 ? 2 : f <= 60 ? 3 : 4) + (h < 0.5 ? 0 : 1),
        purse: { 1: [5, 15], 2: [15, 40], 3: [40, 100], 4: [100, 220], 5: [200, 400] } };
    // what is in a town chest: [item, chance, min, max]; the coppers [min, max]
    const LOOT = {
        1: { coins: [3, 20], items: [[83, 0.3, 1, 1], [92, 0.3, 1, 3], [93, 0.25, 1, 2], [152, 0.15, 1, 1], [124, 0.15, 1, 1]] },
        2: { coins: [10, 40], items: [[83, 0.3, 1, 2], [105, 0.25, 1, 1], [88, 0.25, 3, 8], [152, 0.25, 1, 2], [93, 0.3, 1, 3]] },
        3: { coins: [40, 140], items: [[105, 0.35, 1, 2], [88, 0.35, 5, 12], [514, 0.2, 1, 2], [152, 0.3, 1, 2], [124, 0.3, 1, 2]] },
        4: { coins: [120, 300], items: [[86, 0.4, 1, 2], [514, 0.35, 1, 3], [152, 0.4, 1, 2], [105, 0.4, 1, 2]] }
    };
    const SAY = {
        notSneak: "Zamek {name}. Wytrychem otworzysz tylko w skradaniu (C).",
        noPick: "Zamek {name}. Nie masz wytrycha (kuźnia: z jednej sztabki pięć).",
        tooHard: "Zamek {name} - za trudny. Potrzebujesz Zręczności {need} (masz {have}).",
        caughtToday: "Dziś już tu nie spróbujesz - ktoś cię przyłapał.",
        hold: "Zamek {name} ({lv}/5) - trzymaj O.",
        broke: "Wytrych pękł!",
        open: "Zamek puścił.",
        empty: "Pusto.",
        caught: ["Złodziej!", "Hej! Zostaw to!", "Łapać złodzieja!"]
    };
    const store = T.state.define("zamki", () => ({ locks: {} }), { version: 1, owner: PLUGIN });
    const today = () => T.time.day();
    const keyOf = ev => ev._mapId + ":" + ev._eventId;
    const rec = key => { const s = store().locks; return s[key] || (s[key] = {}); };
    const sneaking = () => !!T.call("Hunting", "sneaking");
    const attrOf = id => { const C = T.api("Combat"); try { return C && C.attr ? C.attr(id) : 5; } catch (e) { return 5; } };
    const dex = () => attrOf("dex"), per = () => attrOf("per");
    // (2026-11-26, Wytrych - c_lock in Rzemiosło: "lock.ease" levels easier, "pick.save" fewer broken picks)
    const perkOf = key => { try { return T.call("Combat", "perk", key) || 0; } catch (e) { return 0; } };
    const easeOf = lock => Math.max(1, (lock.level || 1) - Math.round(perkOf("lock.ease")));
    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const popup = (text, icon, color) => T.popup(text, { icon: icon === undefined ? $dataItems[PICK].iconIndex : icon, color: color || "#cfe6a8" });
    const need = text => T.popup.need($dataItems[PICK].iconIndex, text);
    // (2026-11-19, the user: a door touched - "milion wiadomości") the same words at the same lock: once in QUIET frames
    const QUIET = 300, saidAt = {};
    const needAt = (key, text) => { const k = key + "|" + text, f = Graphics.frameCount; if (saidAt[k] > f - QUIET) return; saidAt[k] = f; need(text); };
    const say = (text, lock, more) => text.replace(/\{(\w+)\}/g, (m, k) => (k === "name" ? LEVEL[lock.level].name : k === "lv" ? lock.level : more && more[k] !== undefined ? more[k] : m));
    // a place's own number (the same every visit): which underground chests are locked
    function hash01(a, b, c, d) {
        let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x632be5ab, 0xc2b2ae35) ^ Math.imul(c + 7, 0x27d4eb2f) ^ Math.imul(d + 13, 0x165667b1);
        h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12;
        return ((h >>> 0) % 10000) / 10000;
    }

    // ---- the event locks: registered ones, the town's bare chests, the underground's chests
    const registered = {};   // "mapId:eventId" -> { level, loot, owner, onOpen }
    const LOCK_OF = new WeakMap();   // an event -> its lock or null, worked out once (not on the event: the event is saved with the game)
    function townMap(mapId) {
        if (NOT_MAPS.includes(mapId)) return false;
        const info = $dataMapInfos[mapId];
        return !!info && TOWN_PARENTS.includes(info.parentId);
    }
    function levelOfName(n) {
        if (/zamknięt/i.test(n)) return 4;   // (Baltazar's strongbox in the kantor)
        if (/okut|kupca|straży/i.test(n)) return 3;
        if (/szynkarz|opiekunk|listami|kapitan/i.test(n)) return 2;
        return 1;
    }
    function ruinsLock(ev) {
        const U = T.api("Underground");
        if (!U || !U.isUnderground || !U.isUnderground(ev._mapId) || !U.isGenerated(ev._mapId)) return null;
        const info = U.info(ev._mapId), e = info && info.loot && info.loot[ev._eventId];
        if (!e || !RUINS.kinds.includes(e.kind)) return null;
        if (hash01(ev._mapId, ev._eventId, ev.event().x, ev.event().y) >= RUINS.share) return null;
        return { level: RUINS.level(U.floorOf(ev._mapId) || 1, hash01(ev._eventId, ev._mapId, 3, 5)), loot: null, owner: "ruins", name: "skrzynia" };
    }
    function lockOf(ev) {
        if (!ev || !(ev instanceof Game_Event) || ev._erased) return null;
        const reg = registered[keyOf(ev)];
        if (reg) return reg;
        if (!LOCK_OF.has(ev)) {   // (worked out once an event: its page's list does not change while the map is up)
            let l = null;
            const data = ev.event(), name = (data && data.name) || "";
            if (townMap(ev._mapId) && /skrzyni|kufer/i.test(name)) {
                const page = ev.page(), list = page ? page.list : [];
                if (list.every(c => c.code === 0)) l = { level: levelOfName(name), loot: /pusta/i.test(name) ? null : Math.min(4, levelOfName(name)), owner: "town", name };
            } else if (data && /<Lup:/.test(data.note || "")) l = ruinsLock(ev);
            LOCK_OF.set(ev, l);
        }
        return LOCK_OF.get(ev);
    }
    // locked now? the town's: not opened within REFILL days; the underground's: not searched yet (its self switch A); registered: theirs
    function evLocked(ev, lock) {
        if (lock.owner === "ruins" || lock.selfSwitch) return !$gameSelfSwitches.value([ev._mapId, ev._eventId, "A"]);
        const r = rec(keyOf(ev));
        return !(r.open && today() - r.open < (lock.refill || REFILL));
    }
    function isLocked(ev) { const l = lockOf(ev); return !!l && evLocked(ev, l); }

    // ---- a target: an event or a camp's box (a Humans drop) - the same picking for both
    function targetOfEvent(ev, lock) {
        return { kind: "event", ev, lock, key: keyOf(ev), mapId: ev._mapId, cx: () => ev._realX + 0.5, cy: () => ev._realY + 0.5, ringDy: -30,
            gone: () => !!ev._erased, locked: () => evLocked(ev, lock) };
    }
    function targetOfDrop(d) {
        const H = T.api("Humans");
        const lock = { level: d.level || 2, owner: "camp", name: "skrzynka" };
        return { kind: "drop", drop: d, lock, key: "drop:" + d.id, mapId: $gameMap.mapId(), cx: () => d.x, cy: () => d.y, ringDy: -40,
            gone: () => !H || !H.drops().includes(d), locked: () => !!d.locked };
    }

    // ---- the picking: one at a time
    let pick = null;   // { tgt, p (0..1), sec (frames to the next break roll) }
    function begin(tgt) {
        if (!tgt.locked()) return false;
        if (pick && pick.tgt.key === tgt.key) return true;
        const lock = tgt.lock, L = LEVEL[easeOf(lock)] || LEVEL[1];
        if (tgt.task) {   // (another system's work by the same hands - a trap disarmed: its own words, no lockpick)
            if (!sneaking()) { needAt(tgt.key, tgt.task.notSneak); return true; }
        } else {
            const r = rec(tgt.key);
            if (r.caught === today()) { needAt(tgt.key, SAY.caughtToday); return true; }
            if (!sneaking()) { needAt(tgt.key, say(SAY.notSneak, lock)); return true; }
            if (dex() < L.dex) { needAt(tgt.key, say(SAY.tooHard, lock, { need: L.dex, have: dex() })); return true; }
            if ($gameParty.numItems($dataItems[PICK]) < 1) { needAt(tgt.key, say(SAY.noPick, lock)); return true; }
        }
        pick = { tgt, p: 0, sec: 60 };
        // (2026-11-19, the user) the mini-game on the screen (Zamki_Gra.js): the pins of a lock, a trap's own; the ring when it is off
        const G = T.api("ZamkiGra");
        if (G && G.enabled() && (!tgt.task || tgt.task.game)) pick.game = G.open(tgt.task ? tgt.task.game : "lock", gameOpts(tgt));
        if (!pick.game) popup(tgt.task ? tgt.task.hold : say(SAY.hold, lock), tgt.task ? tgt.task.icon : undefined);
        T.audio.se("Equip1", { volume: 50, pitch: 140 });
        return true;
    }
    // what the mini-game is told and what it calls back: the noise of the clicks, a pick snapping, done, a trap gone off, let go
    function gameOpts(tgt) {
        const lock = tgt.lock, t = tgt.task, G = () => T.api("ZamkiGra");
        const clicks = () => {
            if (lock.owner !== "town" && lock.owner !== "tavern") T.call("Hunting", "makeNoise", tgt.cx(), tgt.cy(), NOISE);   // (a camp's sitter may hear)
            T.emit("zamekStuk", { x: tgt.cx(), y: tgt.cy(), owner: lock.owner });   // (a sleeper close by may wake - Wlamania)
        };
        const finish = () => { pick = null; if (G()) G().close("done"); };
        if (t) return { title: t.title || t.hold, dex: dex(), per: per(), depth: t.depth || 1, secs: t.secs ? t.secs() : 3, pic: t.pic,
            onDone: () => { finish(); t.onDone(); }, onFail: () => { finish(); t.onFail(); },
            onNoise: () => T.call("Hunting", "makeNoise", tgt.cx(), tgt.cy(), 10), onQuit: () => { pick = null; } };
        return {
            title: "Zamek " + LEVEL[lock.level].name + " (" + lock.level + "/5)", level: easeOf(lock), dex: dex(), per: per(), seed: tgt.key,
            picks: () => $gameParty.numItems($dataItems[PICK]),
            onClick: clicks,
            onBreak: () => {
                $gameParty.loseItem($dataItems[PICK], 1);
                T.emit("zamekPekl", { x: tgt.cx(), y: tgt.cy(), owner: lock.owner });
                clicks();
                const left = $gameParty.numItems($dataItems[PICK]) > 0;
                if (!left) need(say(SAY.noPick, lock));
                return left;
            },
            onDone: () => { finish(); open(tgt); },
            onQuit: () => { pick = null; }
        };
    }
    // another system's work done the same way (Pulapki: a trap disarmed): { key, cx(), cy(), mapId, level, locked(), gone(), ringDy,
    // task: { hold, notSneak, icon, secs, fail(), onDone(), onFail() } } - hold O sneaking, the ring; a failed second = onFail (over)
    function task(t) {
        const tgt = Object.assign({ kind: "task", ringDy: -24, gone: () => false, mapId: $gameMap.mapId() }, t);
        tgt.lock = { level: t.level || 1, owner: "task" };
        return begin(tgt);
    }
    // the action button on an event lock: the picking - or, open, the event's own page (the underground's search says "empty")
    function start(ev) {
        const lock = lockOf(ev);
        if (!lock) return false;
        if (!evLocked(ev, lock)) {
            if (lock.owner === "town") { popup(SAY.empty, 0, "#d8d0c0"); return true; }
            return false;
        }
        return begin(targetOfEvent(ev, lock));
    }
    // an event's lock given by its owner at the moment (a talk's choice - the tavern's guests' doors): { level, owner, locked(), onOpen,
    // onCaught }; the action button on that event then goes on picking (the hook below), not into its talk again
    function pickEvent(ev, lock) {
        const l = Object.assign({ level: 1, owner: "" }, lock || {});
        return begin({ kind: "event", ev, lock: l, key: keyOf(ev), mapId: ev._mapId, cx: () => ev._realX + 0.5, cy: () => ev._realY + 0.5, ringDy: -30,
            gone: () => !!ev._erased, locked: () => (l.locked ? l.locked() : true) });
    }
    // a camp's box (Humans.searchDrop asks first): true - taken by the lock
    function startDrop(d) { return !!(d && d.locked) && begin(targetOfDrop(d)); }

    function secsOf(lock) { return LEVEL[easeOf(lock)].secs * Math.max(0.5, Math.min(1.3, 1 - 0.04 * (dex() - 5))); }
    function breakOf(lock) { return LEVEL[easeOf(lock)].brk * Math.max(0.3, 1 - 0.05 * (dex() - 5)) * Math.max(0.2, 1 - perkOf("pick.save")); }
    const near = tgt => Math.hypot($gamePlayer._realX + 0.5 - tgt.cx(), $gamePlayer._realY + 0.5 - tgt.cy()) <= 1.6;
    const holding = () => Input.isPressed("ok");   // (O / Enter outside combat - Combat.js's mapping)
    function update() {
        if (!pick) return;
        const tgt = pick.tgt;
        if (tgt.gone() || $gameMap.mapId() !== tgt.mapId || !near(tgt) || !sneaking() || !tgt.locked()) { stopGame("away"); pick = null; return; }
        if (pick.game) {   // (the mini-game drives the work; here only who sees him at it)
            if (tgt.lock.owner === "town" || tgt.lock.owner === "tavern" || tgt.lock.watched) {
                T.call("Widzenie", "illicit", 20);
                const W = T.api("Widzenie"), seen = W && W.spotted ? W.spotted() : [];
                if (seen.length) caught(seen[0]);
            }
            return;
        }
        if ($gameMessage.isBusy() || !holding()) return;
        if (tgt.lock.owner === "town" || tgt.lock.owner === "tavern" || tgt.lock.watched) {
            T.call("Widzenie", "illicit", 20);
            const W = T.api("Widzenie"), seen = W && W.spotted ? W.spotted() : [];
            if (seen.length) { caught(seen[0]); return; }
        }
        pick.p += 1 / ((tgt.task && tgt.task.secs ? tgt.task.secs() : secsOf(tgt.lock)) * 60);
        if (Graphics.frameCount % 20 === 0) T.audio.se("Cursor1", { volume: 25, pitch: 150 + Math.floor(Math.random() * 30) });
        if (--pick.sec <= 0) {
            pick.sec = 60;
            if (tgt.lock.owner !== "town" && tgt.lock.owner !== "tavern") T.call("Hunting", "makeNoise", tgt.cx(), tgt.cy(), NOISE);   // (the clicks: a camp's sitter may hear)
            T.emit("zamekStuk", { x: tgt.cx(), y: tgt.cy(), owner: tgt.lock.owner });   // (a sleeper close by may wake - Wlamania)
            if (tgt.task && Math.random() < (tgt.task.fail ? tgt.task.fail() : breakOf(tgt.lock))) { pick = null; tgt.task.onFail(); return; }
            if (!tgt.task && Math.random() < breakOf(tgt.lock)) {
                $gameParty.loseItem($dataItems[PICK], 1);
                pick.p = Math.max(0, pick.p - 0.4);
                T.emit("zamekPekl", { x: tgt.cx(), y: tgt.cy(), owner: tgt.lock.owner });
                need(SAY.broke);
                T.audio.se("Hammer", { volume: 60, pitch: 150 });
                if ($gameParty.numItems($dataItems[PICK]) < 1) { pick = null; return; }
            }
        }
        if (pick.p >= 1) open(tgt);
    }
    function stopGame(why) { if (pick && pick.game) { const G = T.api("ZamkiGra"); pick.game = null; if (G) G.close(why); } }
    function caught(watcher) {
        const tgt = pick.tgt;
        stopGame("caught");
        pick = null;
        rec(tgt.key).caught = today();
        const line = SAY.caught[Math.floor(Math.random() * SAY.caught.length)];
        if (window.SpeechBubbles && SpeechBubbles.say) SpeechBubbles.say(watcher, line); else popup(line, 0, "#ffb070");
        if (tgt.lock.onCaught) tgt.lock.onCaught(watcher); else T.call("TownQuests", "addOpinion", CAUGHT_OPINION, "Przyłapany na włamaniu");
        T.audio.se("Buzzer1", { volume: 60 });
        T.emit("zamekPrzylapany", { mapId: tgt.mapId, key: tgt.key, watcher: watcher && watcher.eventId ? watcher.eventId() : 0 });
    }
    function open(tgt) {
        pick = null;
        const lock = tgt.lock;
        if (tgt.task) { tgt.task.onDone(); return; }
        T.audio.se("Open1", { volume: 80 });
        popup(SAY.open);
        if (tgt.kind === "drop") {   // the camp's box: unlocked, then taken as the sack is (Humans)
            tgt.drop.locked = false;
            T.call("Humans", "searchDrop", tgt.drop);
        } else if (lock.owner === "ruins") {   // the underground's chest: its own loot (the self switch A: open) and a purse more
            const pr = RUINS.purse[lock.level] || RUINS.purse[1], c = rnd(pr[0], pr[1]);
            T.call("Underground", "search", tgt.ev.eventId());
            if (c > 0) $gameParty.gainGold(c);   // (the gains feed shows it)
        } else if (lock.onOpen) {
            if (!lock.locked) rec(tgt.key).open = today();
            lock.onOpen(tgt.ev);
        } else {
            rec(tgt.key).open = today();
            const L = lock.loot ? LOOT[lock.loot] || LOOT[1] : null;
            let got = 0;
            if (L) {
                const c = rnd(L.coins[0], L.coins[1]);
                if (c > 0) { $gameParty.gainGold(c); got++; }
                for (const [id, ch, a, b] of L.items) if ($dataItems[id] && Math.random() < ch) { $gameParty.gainItem($dataItems[id], rnd(a, b)); got++; }
            }
            if (!got) popup(SAY.empty, 0, "#d8d0c0");
        }
        if (tgt.ev) showLid(tgt.ev);
        T.emit("zamekOtwarty", { mapId: tgt.mapId, key: tgt.key, level: lock.level, owner: lock.owner });
    }
    // a town chest shows its lid up while open (the chest sheets: the 4th row), shut again when it is locked and filled anew
    function showLid(ev) {
        const l = lockOf(ev);
        if (!l || l.owner !== "town" || !/chest/i.test(ev.characterName() || "")) return;
        const fix = ev.isDirectionFixed();
        ev.setDirectionFix(false); ev.setDirection(evLocked(ev, l) ? 2 : 8); ev.setDirectionFix(fix);
    }
    const showLids = () => { if (window.$gameMap) for (const ev of $gameMap.events()) showLid(ev); };

    // ---- the ring over the lock while picking
    function Sprite_Zamek() { this.initialize(...arguments); }
    Sprite_Zamek.prototype = Object.create(PIXI.Container.prototype);
    Sprite_Zamek.prototype.constructor = Sprite_Zamek;
    Sprite_Zamek.prototype.initialize = function() { PIXI.Container.call(this); this.z = 8; this._g = new PIXI.Graphics(); this.addChild(this._g); this._last = -1; };
    Sprite_Zamek.prototype.update = function() {
        const p = pick && !pick.game ? pick : null;   // (the ring only without a mini-game)
        this.visible = !!p;
        if (!p) { this._last = -1; return; }
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        this.x = Math.round($gameMap.adjustX(p.tgt.cx() - 0.5) * tw + tw / 2);
        this.y = Math.round($gameMap.adjustY(p.tgt.cy() - 0.5) * th + th / 2) + p.tgt.ringDy;
        const k = Math.round(p.p * 60);
        if (k === this._last) return;
        this._last = k;
        const g = this._g;
        g.clear();
        g.lineStyle(5, 0x000000, 0.55); g.drawCircle(0, 0, 13);
        g.lineStyle(3, 0xffd23f, 1);
        g.arc(0, 0, 13, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, p.p));
        g.lineStyle(0);
        if (!p.tgt.task) {   // the lock's level: as many dots as it has, in its colour
            const n = p.tgt.lock.level, c = PIP[n] || 0xffffff;
            for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * 7; g.beginFill(0x000000, 0.6); g.drawCircle(x, 21, 3); g.endFill(); g.beginFill(c, 1); g.drawCircle(x, 21, 2); g.endFill(); }
        }
    };
    const _createLower = Spriteset_Map.prototype.createLowerLayer;
    Spriteset_Map.prototype.createLowerLayer = function() {
        _createLower.call(this);
        this._zamek = new Sprite_Zamek();
        this._tilemap.addChild(this._zamek);
    };
    const _upd = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() { _upd.call(this); if (this._zamek) this._zamek.update(); };

    // O at a lock: picking instead of its page
    T.onEventStart(ev => (!!pick && pick.tgt.ev === ev) || (lockOf(ev) ? start(ev) : false), { owner: PLUGIN, priority: "instead" });
    T.onMapUpdate(() => update(), { owner: PLUGIN, name: "pick" });
    T.on("mapReady", () => { pick = null; showLids(); }, { owner: PLUGIN });
    T.on("dayStart", showLids, { owner: PLUGIN });
    T.on("heroHit", () => { stopGame("hit"); pick = null; }, { owner: PLUGIN });
    T.on("zamkiGra", e => { if (e && !e.on && pick && pick.game) pick = null; }, { owner: PLUGIN });   // (the game shut by itself: a snap with no pick left, P)

    window.Zamki = T.register(PLUGIN, {
        LEVEL, LOOT, RUINS, REFILL, PICK, lockOf, isLocked, start, startDrop, pickEvent, task, secsOf, breakOf, hash01, levelName: n => (LEVEL[n] || LEVEL[1]).name,
        register: (mapId, eventId, o) => { registered[mapId + ":" + eventId] = Object.assign({ level: 1, loot: 1, owner: "" }, o || {}); },
        cancel: () => { stopGame("cancel"); pick = null; },
        picking: () => (pick ? { key: pick.tgt.key, id: pick.tgt.ev ? pick.tgt.ev.eventId() : 0, p: pick.p, level: pick.tgt.lock.level, owner: pick.tgt.lock.owner } : null),
        state: store
    });
})();
