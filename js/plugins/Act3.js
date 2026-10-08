//=============================================================================
// Act3.js
//=============================================================================
// Act III: the faction strikes the tavern (docs/AKT3.md; QUESTY.md W2 rozdz. 8 "Alarm", W8 rozdz. 7 "Przy drzwiach tawerny", 6.3).
// Once the hero has been down to the diggers' cut (floor 50) through the cellar's grate, the faction knows the way down starts under the
// tavern's floor. From the next time he is up the town warns him (the people's calls, Borgar, Grum, Ambroży), and the next night they
// come: waves of Humans.js's men - outside the tavern's door (the town, Map008), then through the kitchen and the front door to the old
// door by the cellar (the tavern, Map001). The bell's alarm "three and one" - rung by Ambroży when he trusts the hero, else by the hero
// at the rope under the bell - brings the townsfolk with hammers and pitchforks at Opinia 60+; Borgar holds the cellar, Grum fights
// beside the hero, against him, or sits it out (W8), Rafał and Marek come from the camp (W6), the manor's guards (W1 b). The doors
// take blows while nobody stops the men; a broken town door lets them in, a broken old door lets them down. Beaten, the hero is robbed,
// not killed (Humans.js) - the rest is decided by who is still standing. Outcome: held / costly / fallen - kept in the save,
// Act3.outcome() (T.api("Act3")) and the bus's "act3Done". Data and words: Act3_Data.js.

/*:
 * @target MZ
 * @plugindesc Akt III: frakcja uderza na tawernę - ostrzeżenia, alarm dzwonu (3 + 1), fale ludzi frakcji pod drzwiami i w środku, obrońcy według twoich wyborów, wynik: obroniona / drogo / padła. v1.0.0
 * @author Tawerna
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base Act3_Data
 * @orderAfter Act3_Data
 * @base Humans
 * @orderAfter Humans
 * @orderAfter TownQuests
 * @orderAfter TownLife
 * @orderAfter Underground
 * @orderAfter Creatures
 * @orderAfter Debug
 *
 * @help
 * ============================================================================
 * AKT III - NAPAD NA TAWERNĘ (docs/AKT3.md)
 * ============================================================================
 * KIEDY: bohater zszedł do 50. piętra (przekop kopaczy) przez kratę w piwnicy
 *   tawerny. Od najbliższej chwili w tawernie albo w miasteczku miasto go
 *   ostrzega (okrzyki mieszkańców, Borgar, Grum, Ambroży), a następnej nocy
 *   (21-4) frakcja uderza - kiedy bohater jest w tawernie albo w miasteczku.
 *   Noc bez niego: czekają. Po trzech takich nocach uderzają bez niego
 *   (wynik liczony z sojuszników).
 * ALARM: trzy uderzenia i jedno. Jeśli Ambroży ci ufa (lekcje dzwonu, kroniki,
 *   prawda, rozmowa przy dzwonie), dzwoni sam. Jeśli nie - lina wisi pod
 *   dzwonem przy jego wieży (mini-gra dzwonu, 4 uderzenia). Przy Opinii 60+
 *   mieszkańcy przychodzą z pomocą; przy niższej zamykają drzwi.
 * FALE: 1-2 pod drzwiami tawerny (dziedziniec, mapa 8), 3 przez kuchnię
 *   do starych drzwi przy piwnicy, 4 - dowódca kopaczy frontowymi drzwiami
 *   (mapa 1). Ci, którzy nie walczą, idą do drzwi i je wyważają (pasek nad
 *   drzwiami). Wyważone drzwi tawerny: wchodzą do środka. Wyważone stare
 *   drzwi: schodzą do piwnicy - frakcja jest pod tawerną.
 * OBROŃCY: Borgar (zawsze, pilnuje starych drzwi), Grum (sojusznik z W8 -
 *   walczy u twojego boku; po stronie frakcji - jest wśród napastników; bez
 *   wyboru - siedzi i pije; odpłynął albo nie żyje - nie ma go), Rafał
 *   i Marek (W6), strażnicy dworu (Lord sprzymierzony), mieszkańcy
 *   (Tadek, Ignac, Kuba, uchodźcy - po alarmie przy Opinii 60+).
 * WYNIK: obroniona (mało szkód, najwyżej jeden ranny), obroniona drogo,
 *   padła (zeszli do piwnicy albo nikt ich nie zatrzymał). Pobity bohater
 *   jest obrabowany, nie zabity - resztę rozstrzygają ci, którzy jeszcze stoją.
 *
 * F9 (Zdarzenia): "Akt III: uzbrój napad", "Akt III: napad na tawernę teraz",
 *   "Akt III: wyczyść stan napadu".
 *
 * DLA INNYCH WTYCZEK (window.Act3, Tawerna.api("Act3")):
 *   Act3.outcome() -> null (jeszcze nie było) albo { result: "held" |
 *     "costly" | "fallen", defenders: [...], lost: [...], day, damage,
 *     bell, grum, rafal, heroBeaten, offscreen, killed, spared, robbed }
 *   Act3.phase() -> "idle" | "armed" | "siege" | "done"
 *   Szyna: act3Armed { day, siegeDay }, act3Start { day, hour },
 *   act3Wave { wave, id, map }, act3Bell { by }, act3Done (jak outcome()).
 *   Flagi TownQuests (zapas): act3Held / act3Costly / act3Fallen.
 *   Act3.auto(false) - nic samo się nie uzbraja ani nie zaczyna (testy innych
 *   systemów); F9 i wywołania z kodu działają dalej.
 * Zdarzenia mapy: 859 (lina dzwonu na mapie 8 - zawsze w danych, cicha, póki
 *   napad się nie szykuje); 840-858 zarezerwowane dla Act3 (cały przydział
 *   to 840-859).
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Act3.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const D = window.Act3Data;
    if (!D) throw new Error("Act3.js: brak Act3_Data.js - musi stać nad Act3.js na liście wtyczek");
    const PLUGIN = "Act3";
    const TX = D.TEXT;

    const Q = () => T.api("TownQuests");
    const UG = () => T.api("Underground");
    const HM = () => T.api("Humans");
    const HN = () => T.api("Hunting");
    const CB = () => T.api("Combat");
    const TL = () => T.api("TownLife");
    const say = (ch, text, frames) => T.call("SpeechBubbles", "say", ch, text, frames || 220);
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const hour = () => T.time.hour();
    const day = () => T.time.day();
    const clockNow = () => day() * 24 + hour();
    const mapId = () => (window.$gameMap ? $gameMap.mapId() : 0);
    const top = (pair, color) => T.popup(pair[0], { top: true, color: color || "#ffd98f", sub: pair[1] || "" });
    const se = (name, volume, pitch) => T.audio.se(name, { volume: volume || 80, pitch: pitch || 100 });
    const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const OCT = { 0: 6, 1: 3, 2: 2, 3: 1, 4: 4, "-4": 4, "-3": 7, "-2": 8, "-1": 9 };
    const octOf = (dx, dy) => OCT[Math.round(Math.atan2(dy, dx) / (Math.PI / 4))] || 2;
    const DIR4 = (dx, dy) => (Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 4 : 6) : (dy < 0 ? 8 : 2));
    const STEP = { 1: [-1, 1], 2: [0, 1], 3: [1, 1], 4: [-1, 0], 6: [1, 0], 7: [-1, -1], 8: [0, -1], 9: [1, -1] };
    const tagOf = w => "act3_" + w.id;
    const isAct3Tag = tag => typeof tag === "string" && tag.indexOf("act3_") === 0;

    // ------------------------------------------------------------------
    // Saved state (TawernaCore): _tw.act3
    // ------------------------------------------------------------------
    const store = T.state.define("act3", () => ({
        phase: "idle", armedDay: 0, armedHour: 0, siegeDay: 0, warn: { day: 0, who: {} }, noted: false, siege: null, outcome: null, scarsUntil: 0, told: true
    }), { version: 1, owner: PLUGIN });
    const S = () => store();
    const siege = () => (S().phase === "siege" ? S().siege : null);

    // TownQuests' flags (W6, W8, W1...), read defensively
    function flags() {
        const q = Q();
        try { return (q && q.state && q.state().flags) || {}; } catch (e) { return {}; }
    }
    function setFlag(name) {
        const f = flags();
        if (f && typeof f === "object" && !f[name]) f[name] = day();
    }
    function opinion() { const q = Q(); return q && q.opinion ? q.opinion() : 0; }
    // what the town is now: Grum (W8), Rafał and Marek and the camp (W6), Ambroży's trust, the alarm, the help
    function ctx() {
        const f = flags(), q = Q(), s = S().siege;
        let w6 = null;
        try { w6 = q && typeof q.w6 === "function" ? q.w6() : null; } catch (e) { w6 = null; }
        const grum = f.grumDead ? "dead" : f.grumGone ? "gone" : f.grumAlly ? "ally" : f.w8Faction ? "enemy" : "neutral";
        const rafal = (w6 && w6.rafal) || (f.rafalAlly ? "ally" : f.rafalEnemy || f.rafalGiven ? "enemy" : f.rafalSmuggled ? "gone" : f.rafalTaken ? "taken" : null);
        const camp = (w6 && w6.camp) || (f.campInside ? "inside" : f.campOutside ? "outside" : "inside");
        const rec = q && q.rec ? id => { try { return q.rec(id); } catch (e) { return null; } } : null;
        const bell = !!(s && s.bell);
        return { flags: f, opinion: opinion(), grum, rafal, marek: !!((w6 && w6.marekSaved) || f.marekSaved), camp,
            ambrozy: D.AMBROZY.trusts(f, rec), bell, helpers: bell && opinion() >= D.HELP.opinion };
    }
    // (asked every frame while the siege runs: kept for half a second; the bell clears it)
    let ctxKeep = null, ctxAt = -1e9;
    function ctxC() {
        if (!ctxKeep || Graphics.frameCount - ctxAt > 30 || Graphics.frameCount < ctxAt) { ctxKeep = ctx(); ctxAt = Graphics.frameCount; }
        return ctxKeep;
    }
    function siegeLevel() {
        const C = CB(), place = C && C.placeLevel ? C.placeLevel() : 1, hero = C && C.hero ? C.hero().level : 1;
        return clamp(Math.max(place, hero + D.LEVEL.heroDelta), D.LEVEL.min, D.LEVEL.max);
    }

    // ------------------------------------------------------------------
    // The trigger: floor 50 reached with the grate open -> armed; the next night (21-4) on the tavern / town map -> the siege
    // ------------------------------------------------------------------
    const nightOf = (d, h) => (h < 12 ? d - 1 : d);
    const inWindow = h => h >= D.TRIGGER.from || h < D.TRIGGER.to;
    function nightsPassed() {
        const s = S(), d = day(), h = hour();
        return nightOf(d, h) - s.siegeDay + (h >= D.TRIGGER.to && h < 12 ? 1 : 0);
    }
    function armReady() {
        const U = UG();
        if (!U || typeof U.deepest !== "function") return false;
        if (U.deepest() < D.TRIGGER.floor) return false;
        if (D.TRIGGER.needOpen && typeof U.isOpen === "function" && !U.isOpen()) return false;
        return D.TRIGGER.maps.includes(mapId());
    }
    function arm(opts) {
        const s = S();
        if (s.phase !== "idle" && !(opts && opts.force)) return false;
        s.phase = "armed";
        s.armedDay = day();
        s.armedHour = hour();
        s.siegeDay = day() + (opts && opts.now ? 0 : D.TRIGGER.delayDays);
        s.warn = { day: 0, who: {} };
        s.noted = false;
        T.emit("act3Armed", { day: s.armedDay, siegeDay: s.siegeDay });
        return true;
    }
    function maySiegeNow(scene) {
        if (!D.TRIGGER.siegeMaps.includes(mapId())) return false;
        return T.isCalm(scene, { only: ["onMap", "sceneChange", "transfer", "message", "event", "miniGame", "summary", "farmMenu", "build"] });
    }

    // ------------------------------------------------------------------
    // The warnings (armed): the people's calls on the town map, Borgar and Grum in the tavern, the journal's note; Ambroży's talk
    // ------------------------------------------------------------------
    let warnT = 0;
    function warnings() {
        const s = S(), d = day();
        if (s.warn.day !== d) s.warn = { day: d, who: {} };
        if (!s.noted) {
            s.noted = true;
            T.call("Journal", "addNote", TX.noteArmed[0], TX.noteArmed[1]);
        }
        if (--warnT > 0) return;
        warnT = 90;
        if ($gameMap.isEventRunning() || $gameMessage.isBusy()) return;
        const px = $gamePlayer.x, py = $gamePlayer.y, near = ev => ev && !ev.isTransparent() && Math.hypot(ev.x - px, ev.y - py) <= 5;
        if (mapId() === D.TOWN) {
            const L = TL();
            if (!L || !L.residents) return;
            for (const r of L.RESIDENTS) {
                if (s.warn.who[r.key]) continue;
                const ev = L.eventOf(r.key);
                if (!near(ev)) continue;
                const lines = TX.warnBarks[r.key] || TX.warnBarks["*"];
                s.warn.who[r.key] = true;
                say(ev, pick(lines), 300);
                warnT = 360;
                return;
            }
        } else if (mapId() === D.TAVERN) {
            const borgar = $gameMap.event(1), grum = $gameMap.event(3);
            if (!s.warn.who.borgar && near(borgar)) {
                s.warn.who.borgar = true;
                say(borgar, TX.borgarWarn[(d - s.armedDay) % TX.borgarWarn.length], 300);
                warnT = 360;
                return;
            }
            const c = ctx(), g = TX.grumWarn[c.grum];
            if (g && !s.warn.who.grum && near(grum)) {
                s.warn.who.grum = true;
                say(grum, g, 300);
                warnT = 360;
            }
        }
    }
    // Ambroży spoken to while it is coming (TownLife's talk hook - TownQuests speaks first, if it has something)
    function ambrozyTalk(key, ev) {
        const ph = S().phase;
        if (key !== "dzwonnik" || (ph !== "armed" && ph !== "siege")) return null;
        const lines = ctx().ambrozy ? TX.ambrozyTrusts : TX.ambrozyNot, out = [];
        lines.forEach((l, i) => {
            out.push({ code: 101, indent: 0, parameters: ["", 0, 0, 2, "Ambroży"] });
            out.push({ code: 401, indent: 0, parameters: [(i === 0 ? "\\SPK[" + ev.eventId() + "]" : "\\SPK[" + ev.eventId() + "]") + l] });
        });
        return out;
    }
    function hookTalk() {
        const L = TL();
        if (L && L.addTalkHook && !hookTalk.done) { hookTalk.done = true; L.addTalkHook(ambrozyTalk); }
    }

    // ------------------------------------------------------------------
    // The siege: its start, the bell, the waves, the doors, the end
    // ------------------------------------------------------------------
    function makeSiege() {
        const c = ctx();
        return {
            startDay: day(), startHour: hour(), t: 0, wave: 0, gapT: D.PACE.firstGap, level: siegeLevel(),
            waves: D.WAVES.map(w => ({ id: w.id, map: w.map, state: "pending", alive: null, offSince: null, carry: [] })),
            doors: { 8: D.DOORS[8].hp, 1: D.DOORS[1].hp }, broken: { 8: false, 1: false }, damage: 0,
            bell: null, bellT: null, helpers: null, told: {}, defenders: {}, killed: 0, spared: 0, robbed: 0, fled: 0, wentDown: 0,
            beaten: false, grum: c.grum, rafal: c.rafal, grumFate: null, rafalFate: null, bossBeaten: false
        };
    }
    function startSiege(opts) {
        const s = S();
        if (s.phase === "siege" || s.phase === "done") return false;
        if (s.phase === "idle") arm({ now: true });
        s.phase = "siege";
        s.siege = makeSiege();
        if (opts && typeof opts.wave === "number") { s.siege.wave = clamp(opts.wave, 0, D.WAVES.length - 1); for (let i = 0; i < s.siege.wave; i++) s.siege.waves[i].state = "done"; }
        runtime.reset();
        top(TX.start, "#ff9f8f");
        se("Horse", 70, 80);
        if (mapId() === D.TAVERN) { const b = $gameMap.event(1); if (b) say(b, TX.startInside, 240); }
        T.emit("act3Start", { day: s.siege.startDay, hour: s.siege.startHour });
        return true;
    }

    // ---- the bell: Ambroży (he trusts the hero) or the hero at the rope; then the town comes - or keeps its doors shut
    function ringBell(by) {
        const s = siege();
        if (!s || s.bell) return false;
        s.bell = by;
        s.bellT = s.t;
        ctxKeep = null;
        const q = Q();
        if (q && q.ringPattern && mapId() === D.TOWN) q.ringPattern([3, 1], by === "hero" ? 10 : 30);
        else if (by !== "hero") { for (let i = 0; i < 4; i++) setTimeout(() => se("Bell3", mapId() === D.TOWN ? 70 : 35, 85), i * 800 + (i === 3 ? 900 : 0)); }
        if (q && q.hearSignal) { try { q.hearSignal("3+1"); } catch (e) { /* (the signal noted or not) */ } }
        top(by === "hero" ? TX.bellHero : TX.bellAmbrozy, "#ffe27a");
        const L = TL();   // (Ambroży comes out to his bell while it lasts - TownLife's hold)
        if (by === "ambrozy" && L && L.hold && L.hold("dzwonnik", true, D.SPOTS[8].bellStand)) s.ambrozyHeld = true;
        const c = ctx();
        s.helpers = c.helpers;
        runtime.helpNoticeT = 200;
        T.emit("act3Bell", { by });
        return true;
    }
    // the rope (event 859 on the town map): the bell's mini-game - four strikes, three and one
    function bellRope() {
        const s = siege();
        const where = mapId() === D.TOWN ? $gamePlayer : null;
        if (!s) { if (where && S().phase === "armed") say($gamePlayer, TX.bellCalm, 150); return false; }
        if (s.bell) { if (where) say($gamePlayer, TX.bellDone, 150); return false; }
        const q = Q();
        if (!q || !q.openBell) { ringBell("hero"); return true; }
        q.openBell({ target: 4, title: "Trzy i jeden", sub: "dzwonnica - alarm", who: "Trzy, przerwa, jeden: cztery uderzenia", period: 100, window: 0.87 }, res => {
            if (res && (res.ok || res.right || res.none)) ringBell("hero");
            else say($gamePlayer, TX.bellWrong, 200);
        });
        return true;
    }

    // ---- the waves: who comes (the data's kinds and extras, the men carried in from a broken town door)
    function specsOf(i) {
        const s = siege(), w = D.WAVES[i], W = s.waves[i], c = ctx();
        if (W.alive) return W.alive.slice();
        const out = w.kinds.map(k => ({ kind: k, lv: D.LEVEL.kinds[k] || 0 }));
        if (w.extra) for (const x of w.extra(c) || []) out.push(Object.assign({ lv: D.LEVEL.kinds[x.kind] || 0 }, x));
        return out.concat(W.carry || []);
    }
    function freeSpot(x, y, taken) {
        const ok = (a, b) => $gameMap.isValid(a, b) && $gameMap.checkPassage(a, b, 0x0f) && !taken.has(a + "," + b) &&
            !$gameMap.eventsXyNt(a, b).some(e => e.isNormalPriority() && !e.isThrough()) && !($gamePlayer.x === a && $gamePlayer.y === b);
        for (let r = 0; r <= 4; r++) {
            for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
                if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
                if (ok(x + dx, y + dy)) return [x + dx, y + dy];
            }
        }
        return null;
    }
    const doorOf = m => D.SPOTS[m] && D.SPOTS[m].door;
    function spawnWave(i) {
        const s = siege(), w = D.WAVES[i], W = s.waves[i], Hm = HM();
        if (!Hm || !Hm.spawn) return false;
        const specs = specsOf(i), spots = (D.SPOTS[w.map] && D.SPOTS[w.map][w.from]) || [], taken = new Set(), door = doorOf(w.map);
        let band = null, first = null, n = 0;
        for (const sp of specs) {
            const base = spots[n % Math.max(1, spots.length)] || [$gamePlayer.x, $gamePlayer.y - 6];
            n++;
            const at = freeSpot(base[0], base[1], taken);
            const lv = s.level + (sp.lv || 0);
            const opts = { tag: tagOf(w), level: lv, name: sp.name || "", noSurrender: !!sp.noSurrender, look: sp.look || undefined };
            if (band) opts.band = band;
            let h = at ? Hm.spawn(sp.kind, at[0], at[1], opts) : null;
            if (!h && Hm.spawnNear) h = Hm.spawnNear(sp.kind, 6, 10, opts);
            if (!h) continue;
            taken.add(h._x + "," + h._y);
            h._act3 = Object.assign({}, sp, { wave: i });
            if (sp.hp !== undefined) h._hp = Math.max(1, Math.round(h._maxHp * sp.hp));
            if (!band) { band = h._band; first = h; }
            if (sp.kind === "archer") h.engage(false);
            else if (door && Hm.march) Hm.march(h, door[0], door[1]);
            runtime.live.push(h);
        }
        W.spawned = true;
        W.alive = null;
        W.carry = [];
        if (first) {
            say(first, w.shout, 220);
            const g = runtime.live.find(h => h._act3 && h._act3.grum && h._act3.wave === i);
            if (g) setTimeout(() => say(g, TX.grumEnemy, 240), 1400);
        }
        return !!first;
    }
    // the men of wave i still about on this map (not dead, not taken off); fighting: not kneeling, not running
    const membersOf = i => runtime.live.filter(h => h._act3 && h._act3.wave === i && !h._dead);
    const fighting = h => !h._dead && !h._defeated && !h._surrendered && h._mode !== "flee" && h._mode !== "leave";
    // what is left of a wave as specs (kept when the hero leaves the map, saved with the game)
    function snapshot(i) {
        const W = siege().waves[i];
        if (!W.spawned) return;
        W.alive = membersOf(i).filter(fighting).map(h => Object.assign({}, h._act3, { hp: Math.max(0.1, h._hp / h._maxHp), wave: undefined }));
    }
    function powerOf(spec) { return spec.grum ? D.POWER.grum : spec.boss ? D.POWER.boss : D.POWER[spec.kind] || 1; }

    // ---- a frame of the siege
    function tickSiege(scene) {
        const s = siege();
        if (!s) return;
        const Hr = HM();
        if (Hr && Hr.robbery) return;   // (the hero beaten down and robbed: his hour on the ground is decided by heroRobbed - finish("beaten"))
        s.t++;
        const here = mapId(), i = s.wave, w = D.WAVES[i], W = s.waves[i];
        // the bell: Ambroży, a moment after it begins (he trusts the hero); else the rope waits for the hero
        const c = ctxC();
        if (!s.bell && c.ambrozy && s.t >= D.AMBROZY.delay) ringBell("ambrozy");
        if (!s.bell && !c.ambrozy && !s.told.bell && s.t >= 150) { s.told.bell = true; top(TX.bellNeeded, "#ffe27a"); }
        if (runtime.helpNoticeT > 0 && --runtime.helpNoticeT === 0 && s.bell) {
            if (s.helpers) top(TX.helpComes, "#9ff0a8");
            else {
                top(TX.helpNot, "#cfd6de");
                const L = TL(), ev = L && L.residents ? L.residents().find(e => !e.isTransparent()) : null;
                if (ev) say(ev, pick(TX.helpNotBark), 200);
            }
        }
        if (!w) { finish("done"); return; }
        if (W.state === "pending") {
            if (s.gapT > 0) { s.gapT--; return; }
            W.state = "live";
            W.liveAt = clockNow();
            top(w.notice, "#ffb08f");
            T.emit("act3Wave", { wave: i, id: w.id, map: w.map });
            if (here !== w.map) top(w.map === D.TAVERN ? TX.inside : TX.outside, "#ffd98f");
        }
        if (W.state !== "live") return;
        if (here === w.map && D.TRIGGER.siegeMaps.includes(here)) {
            W.offSince = null;
            if (!W.spawned && T.isCalm(scene, { only: ["onMap", "sceneChange", "transfer"] })) { spawnWave(i); return; }
            if (!W.spawned) return;
            if (s.t % 30 === 0) snapshot(i);
            driveMembers(i);
            doors(i);
            if (!membersOf(i).some(fighting) && !(HM() && HM().robbery)) waveDone(i);
        } else {
            // the hero is not where they are: the doors take it without him, then they get through
            if (W.offSince === null) W.offSince = clockNow();
            const off = clockNow() - W.offSince;
            if (s.t % 60 === 0) addDamage(D.PACE.offDamage / 60);   // (offDamage an hour: 60 seconds of the game's clock)
            if (off >= D.PACE.offBreach) breachOff(i);
        }
        if (s.damage >= D.OUTCOME.fallen) finish("fallen");
    }
    function addDamage(n) { const s = siege(); if (s) s.damage = clamp(s.damage + n, 0, 100); }
    // the men: those near the hero turn on him; the idle ones not at the door march again; who is at the door works at it
    function driveMembers(i) {
        const Hm = HM(), w = D.WAVES[i], door = doorOf(w.map);
        const s = siege(), foesOn = d => runtime.live.filter(x => !x._dead && Hm.foeOf && Hm.foeOf(x) === d).length;
        for (const h of membersOf(i)) {
            if (!fighting(h)) continue;
            if (!h._engaged && h.playerDistance() < 5.5 && h._mode !== "wake") h.engage(true);
            // a man on his own with the hero far off and a defender close: he takes the defender on (two at most on one)
            if ((s.t + h._hid) % 20 === 0 && h._kind !== "archer" && Hm.setFoe && Hm.foeOf && !Hm.foeOf(h) && h.playerDistance() > 7) {
                let best = null, bd = 5.5;
                for (const d of runtime.defenders) {
                    if (d._down) continue;
                    const dd = Math.hypot(d.centerX() - h.centerX(), d.centerY() - h.centerY());
                    if (dd < bd && foesOn(d) < 2) { bd = dd; best = d; }
                }
                if (best) Hm.setFoe(h, best);
            }
            if (!h._engaged && h._mode === "idle" && door && Math.hypot(h._x - door[0], h._y - door[1]) > D.PACE.workAt && Hm.march && (h._act3.mt = (h._act3.mt || 0) + 1) % D.PACE.reMarch === 0) Hm.march(h, door[0], door[1]);
        }
        // the archers stay on the hero (no march): nothing else
    }
    function atDoor(h, door) { return !h._engaged && fighting(h) && Math.hypot(h._x - door[0], h._y - door[1]) <= D.PACE.workAt; }
    function doors(i) {
        const s = siege(), w = D.WAVES[i], m = w.map, door = doorOf(m), Dd = D.DOORS[m], Hm = HM();
        if (!door || !Dd) return;
        const workers = membersOf(i).filter(h => atDoor(h, door));
        for (const h of workers) { const dx = door[0] - h._x, dy = (door[1] - 1) - h._y; h.setDirection(DIR4(dx, dy || -1)); }
        if (!workers.length) return;
        if (s.broken[m]) { for (const h of workers) goThrough(h, m); return; }
        if (s.t % Dd.every === 0) {
            s.doors[m] = Math.max(0, s.doors[m] - Dd.per * workers.length);
            se(m === D.TOWN ? "Blow3" : "Blow1", 55, 70 + rnd(0, 20));
            runtime.doorHitT = 10;
            if (s.doors[m] <= 0) {
                s.broken[m] = true;
                top(m === D.TOWN ? TX.doorBreach : TX.cellarBreach, "#ff9f8f");
                se("Crash", 80, 90);
                if (m === D.TOWN) addDamage(Dd.breach);
                for (const h of workers) goThrough(h, m);
            }
        }
    }
    // one man through a broken door: into the tavern (he comes with the next wave inside) or down into the cellar
    function goThrough(h, m) {
        const s = siege(), Hm = HM();
        if (m === D.TOWN) {
            const next = s.waves.findIndex((W, k) => k > s.wave && D.WAVES[k].map === D.TAVERN);
            if (next >= 0) s.waves[next].carry.push(Object.assign({}, h._act3, { hp: Math.max(0.1, h._hp / h._maxHp), wave: undefined }));
        } else {
            s.wentDown++;
            addDamage(D.DOORS[1].down);
        }
        h._act3.through = true;
        if (Hm && Hm.remove) Hm.remove(h);
    }
    // a wave left alone on its map: the door gives, they get through
    function breachOff(i) {
        const s = siege(), w = D.WAVES[i], W = s.waves[i], specs = specsOf(i);
        if (w.map === D.TOWN) {
            if (!s.broken[8]) { s.broken[8] = true; s.doors[8] = 0; addDamage(D.DOORS[8].breach); }
            const next = s.waves.findIndex((X, k) => k > i && D.WAVES[k].map === D.TAVERN);
            if (next >= 0) for (const sp of specs) if (sp.kind !== "archer") s.waves[next].carry.push(sp);
        } else {
            s.broken[1] = true;
            s.doors[1] = 0;
            const n = specs.filter(sp => sp.kind !== "archer").length;
            s.wentDown += n;
            addDamage(D.DOORS[1].down * n);
        }
        top(w.map === D.TOWN ? TX.doorBreach : TX.cellarBreach, "#ff9f8f");
        W.state = "breached";
        W.alive = [];
        nextWave();
    }
    function waveDone(i) {
        const s = siege(), W = s.waves[i];
        W.state = "done";
        W.alive = [];
        // Grum and Rafał on the faction's side, the commander: how they ended
        for (const h of runtime.live.filter(x => x._act3 && x._act3.wave === i)) fateOf(h);
        nextWave();
    }
    function fateOf(h) {
        const s = siege(), a = h._act3;
        if (!s || !a || a.fated) return;
        const how = h._defeated || (h._surrendered ? "spared" : h._dead && !a.through ? "killed" : null);
        if (!how) return;
        a.fated = true;
        if (a.grum) { s.grumFate = how === "killed" ? "dead" : "gone"; if (how !== "killed") say(h, TX.grumEnemyBeaten, 240); }
        if (a.name === "Rafał") s.rafalFate = how === "killed" ? "dead" : "gone";
        if (a.boss) { s.bossBeaten = true; if (how !== "killed") say(h, TX.bossBeaten, 240); }
    }
    function nextWave() {
        const s = siege();
        s.wave++;
        s.gapT = D.PACE.gap;
        if (s.wave >= D.WAVES.length) finish("done");
    }

    // ------------------------------------------------------------------
    // The end: the outcome, what it brings, the bus, the flags
    // ------------------------------------------------------------------
    function defenderKeysOf(list) {
        const out = [];
        for (const id of list) { const k = id.replace(/\d+$/, ""); if (!out.includes(k)) out.push(k); }
        return out;
    }
    // the defenders who would stand (for a siege without the hero, or the rest of it after he was beaten)
    function availableDefs(c) {
        return D.DEFENDERS.filter(def => { try { return !!def.when(c); } catch (e) { return false; } });
    }
    function defPower(def) { return (def.power || def.hp / 100) * (def.n || 1); }
    function remainingEnemyPower() {
        const s = siege();
        let p = 0;
        s.waves.forEach((W, i) => {
            if (W.state === "done" || W.state === "breached") return;
            const specs = i === s.wave && W.spawned ? membersOf(i).filter(fighting).map(h => h._act3) : specsOf(i);
            for (const sp of specs) p += powerOf(sp);
        });
        return p;
    }
    function finish(how) {
        const s = siege();
        if (!s) return null;
        let result;
        const downIds = Object.keys(s.defenders).filter(id => s.defenders[id].down);
        const tookPart = Object.keys(s.defenders).filter(id => s.defenders[id].fought || s.defenders[id].present);
        if (how === "beaten") {
            const c = ctx(), stand = availableDefs(c).filter(def => !downIds.some(id => id.indexOf(def.key) === 0));
            const ours = stand.reduce((a, def) => a + defPower(def), 0), theirs = remainingEnemyPower();
            result = ours >= theirs * 0.8 ? "costly" : "fallen";
            s.damage = result === "costly" ? Math.max(s.damage, D.OUTCOME.beatenCostly) : 100;
            for (const def of stand) if (!tookPart.some(id => id.indexOf(def.key) === 0)) tookPart.push(def.key);
        } else if (how === "fallen" || s.damage >= D.OUTCOME.fallen) result = "fallen";
        else result = s.damage < D.OUTCOME.held && downIds.length <= Math.max(D.OUTCOME.heldLost, Math.floor(tookPart.length * D.OUTCOME.heldPart)) ? "held" : "costly";
        // who fought for the faction and how it ended for them
        for (const h of runtime.live) fateOf(h);
        if (s.grum === "enemy" && !s.grumFate) s.grumFate = "gone";
        if (s.rafal === "enemy" && !s.rafalFate) s.rafalFate = "gone";
        const out = buildOutcome(result, { defenders: defenderKeysOf(tookPart), lost: defenderKeysOf(downIds), offscreen: false, heroBeaten: how === "beaten" });
        conclude(out);
        return out;
    }
    // the night came and went without the hero (three nights): his allies alone
    function finishOffscreen() {
        const S0 = S();
        S0.phase = "siege";
        S0.siege = makeSiege();
        const s = S0.siege, c = ctx();
        if (c.ambrozy) { s.bell = "ambrozy"; s.helpers = opinion() >= D.HELP.opinion; }
        const c2 = ctx(), defs = availableDefs(c2);
        const ours = defs.reduce((a, def) => a + defPower(def), 0);
        let theirs = 0;
        D.WAVES.forEach((w, i) => { for (const sp of specsOf(i)) theirs += powerOf(sp); });
        const result = ours >= theirs * 0.7 ? "costly" : "fallen";
        s.damage = result === "costly" ? 60 : 100;
        const sorted = defs.slice().sort((a, b) => defPower(a) - defPower(b)), lost = result === "fallen" ? sorted : sorted.slice(0, Math.ceil(sorted.length / 2));
        if (s.grum === "enemy") s.grumFate = "gone";
        if (s.rafal === "enemy") s.rafalFate = "gone";
        const out = buildOutcome(result, { defenders: defs.map(d => d.key), lost: lost.map(d => d.key), offscreen: true, heroBeaten: false });
        conclude(out);
        return out;
    }
    function buildOutcome(result, o) {
        const s = siege();
        return { result, defenders: o.defenders, lost: o.lost, day: day(), damage: Math.round(s.damage), bell: s.bell || null, grum: s.grumFate ? s.grumFate : s.grum,
            rafal: s.rafalFate || s.rafal || null, heroBeaten: !!o.heroBeaten, offscreen: !!o.offscreen, killed: s.killed, spared: s.spared, robbed: s.robbed,
            fled: s.fled, wentDown: s.wentDown, bossBeaten: !!s.bossBeaten, helpers: !!s.helpers };
    }
    function conclude(out) {
        const S0 = S(), s = S0.siege, R = D.REWARD[out.result], T1 = TX.outcome[out.result];
        if (s.ambrozyHeld) { const L = TL(); if (L && L.hold) L.hold("dzwonnik", false); s.ambrozyHeld = false; }
        S0.outcome = out;
        S0.phase = "done";
        if (out.result !== "held") S0.scarsUntil = day() + D.SCARS.days;
        // the fallback flags (TownQuests) and Grum's end (W8 rozdz. 7): gone from the tavern - on the ferry, or dead
        setFlag(out.result === "held" ? "act3Held" : out.result === "costly" ? "act3Costly" : "act3Fallen");
        if (s.grum === "enemy") setFlag(s.grumFate === "dead" ? "grumDead" : "grumGone");
        // what it brings: the town's opinion; experience and Borgar's gold for a hero who fought
        const q = Q();
        const op = out.offscreen ? (out.result === "fallen" ? -5 : -2) : R.opinion;
        if (q && q.addOpinion && op) q.addOpinion(op, out.offscreen ? "nie było cię, kiedy frakcja uderzyła na tawernę" : "noc pod tawerną");
        if (!out.offscreen) {
            const C = CB();
            if (C && C.gainXp && R.xp) C.gainXp(R.xp, "Akt III");
            if (R.gold && !out.heroBeaten) $gameParty.gainGold(R.gold);
        }
        const names = out.lost.map(k => TX.names[k] || k).join(", ") || "nikt";
        T.call("Journal", "addNote", T1.note[0], T1.note[1].replace("{lost}", names));
        S0.told = !(out.offscreen && !D.TRIGGER.siegeMaps.includes(mapId()));
        if (S0.told) tellOutcome(out);
        // the men of the faction still about go (a kneeling one too); the defenders say their word and go a little later
        runtime.endT = 480;
        for (const d of runtime.defenders) if (!d._down && d._def.lines && out.result !== "fallen") say(d, d._def.lines.win, 260);
        T.emit("act3Done", Object.assign({}, out));
        return out;
    }
    function tellOutcome(out) {
        const T1 = TX.outcome[out.result];
        if (out.offscreen) top(TX.offscreenNotice, "#ffd98f");
        T.popup(T1.title, { top: true, color: out.result === "held" ? "#9ff0a8" : out.result === "costly" ? "#ffe27a" : "#ff9f8f", sub: T1.sub });
        const b = runtime.defenders.find(d => d._key === "borgar" && !d._down) || (mapId() === D.TAVERN ? $gameMap.event(1) : null);
        if (b) setTimeout(() => say(b, T1.say, 360), 1600);
        S().told = true;
    }

    // ==================================================================
    // The defenders: the hero's allies in the fight (not events: their own list, like the men). They go for the faction's men near
    // their place (or near the hero - Grum), strike them (Humans.hit), and the man they strike fights them back (Humans.setFoe)
    // ==================================================================
    function Game_Defender() {
        this.initialize(...arguments);
    }
    Game_Defender.prototype = Object.create(Game_Character.prototype);
    Game_Defender.prototype.constructor = Game_Defender;
    Game_Defender.prototype.initialize = function(def, n, x, y, lv, saved) {
        Game_Character.prototype.initialize.call(this);
        this._def = def;
        this._key = def.key;
        this._id = def.key + ((def.n || 1) > 1 ? n : "");
        this._label = def.name + ((def.n || 1) > 1 && def.key === "uchodzcy" ? "" : "");
        const g = 1 + 0.12 * (lv - 1), gd = 1 + 0.1 * (lv - 1);
        this._maxHp = Math.round(def.hp * g);
        this._hp = saved && typeof saved.hp === "number" ? Math.round(this._maxHp * saved.hp) : this._maxHp;
        this._down = !!(saved && saved.down) || this._hp <= 0;
        this._dmg = def.dmg * gd;
        this._maxPoise = Math.round(def.poise * (1 + 0.08 * (lv - 1)));
        this._poise = this._maxPoise;
        this._cdT = rnd(20, 60);
        this._faceAng = Math.PI / 2;
        this._target = null;
        this._thinkT = 0;
        this._flashT = 0;
        this._swingT = 0;
        this._spot = null;
        this.setImage(def.sheet, 0);
        this.setPosition(x, y);
        this.setDirection(2);
        this.setMoveSpeed(def.speed || 3.8);
        this.setMoveFrequency(5);
        this.setWalkAnime(true);
        this.setStepAnime(false);
        this.setThrough(this._down);
        this.setPriorityType(this._down ? 0 : 1);
        this.setMode(this._down ? "down" : "idle");
    };
    Game_Defender.prototype.isDefender = function() { return true; };
    Game_Defender.prototype.centerX = function() { return this._realX + 0.5; };
    Game_Defender.prototype.centerY = function() { return this._realY + 0.5; };
    Game_Defender.prototype.isDown = function() { return this._down; };
    Game_Defender.prototype.name = function() { return this._def.name; };
    Game_Defender.prototype.isMapPassable = function(x, y, d) {
        const F = T.api("Farming");
        if (F && F.buildingAt && F.buildingAt($gameMap.roundXWithDirection(x, d), $gameMap.roundYWithDirection(y, d))) return false;
        return Game_Character.prototype.isMapPassable.call(this, x, y, d);
    };
    Game_Defender.prototype.setMode = function(mode, frames) {
        this._mode = mode;
        this._modeT = frames || 0;
        this._modeLen = this._modeT;
        const atk = this._def.atk && (mode === "windup" || mode === "strike" || mode === "recover");
        const name = atk ? "$Human_" + this._def.atk + "_Atk" : this._def.sheet;
        if (this.characterName() !== name) this.setImage(name, 0);
    };
    // the attack sheet's frame (Hunting's LOOK8 pose, the mercenary's 13 cells: raise 5, hit 7)
    Game_Defender.prototype.look8Col = function(cells) {
        const last = cells - 1, raise = Math.min(last, 5), hit = Math.min(last, 7), after = Math.min(last, 9);
        const len = Math.max(1, this._modeLen || 1), el = len - Math.max(0, this._modeT), gone = Math.min(1, el / len);
        if (this._mode === "windup") return Math.round(easeInOut(gone) * raise);
        if (this._mode === "strike") return el <= 4 ? raise + Math.round((el / 4) * (hit - raise)) : Math.min(after, hit + Math.round(gone * (after - hit)));
        if (this._mode === "recover") return Math.min(last, after + Math.round(gone * (last - after)));
        return 0;
    };
    Game_Defender.prototype.face8 = function() {
        if (this._down) return 0;
        if (this._target || this._mode !== "idle") return octOf(Math.cos(this._faceAng), Math.sin(this._faceAng));
        return 0;
    };
    // the blow's weight: the body back on the wind-up, thrown forward on the strike
    Game_Defender.prototype.lungeOffset = function() {
        if (this._mode !== "windup" && this._mode !== "strike") return null;
        const len = Math.max(1, this._modeLen || 1), el = len - Math.max(0, this._modeT), k = this._mode === "windup" ? -3 * easeInOut(el / len) : -3 + 11 * Math.sin(Math.min(1, el / len) * Math.PI);
        return [Math.round(Math.cos(this._faceAng) * k), Math.round(Math.sin(this._faceAng) * k * 0.7)];
    };
    Game_Defender.prototype.faceTo = function(x, y) {
        const dx = x - this.centerX(), dy = y - this.centerY();
        this._faceAng = Math.atan2(dy, dx);
        if (!this.isMoving()) this.setDirection(DIR4(dx, dy));
    };
    Game_Defender.prototype.occupied = function(x, y) {
        const Hm = HM();
        if (Hm && Hm.list && Hm.list.some(h => !h._dead && h._x === x && h._y === y)) return true;
        if (runtime.defenders.some(d => d !== this && !d._down && d._x === x && d._y === y)) return true;
        return $gamePlayer.x === x && $gamePlayer.y === y;
    };
    Game_Defender.prototype.walkTo = function(tx, ty, key, near) {
        const Hn = HN();
        if (!Hn || !Hn.path8) return false;
        const r = Hn.path8(this, tx, ty, { animal: true, key, near: near || 0 });
        if (!r.dir) return false;
        const [ox, oy] = STEP[r.dir];
        if (this.occupied(this._x + ox, this._y + oy)) return false;
        return Hn.takeStep ? Hn.takeStep(this, r.dir) : false;
    };
    Game_Defender.prototype.update = function() {
        Game_Character.prototype.update.call(this);
        if (this._flashT > 0) this._flashT--;
        if (this._swingT > 0) this._swingT--;
        if (this._down) { this._mode = "down"; return; }
        if (this._modeT > 0) this._modeT--;
        if (this._cdT > 0) this._cdT--;
        if (this._poise < this._maxPoise) this._poise = Math.min(this._maxPoise, this._poise + this._maxPoise / 300);
        this.think();
    };
    // the faction's men this one goes for: fighting, near its place (a guard) or near the hero (Grum); its own foe first
    Game_Defender.prototype.pickTarget = function() {
        const Hm = HM();
        if (!Hm || !Hm.list) return null;
        const def = this._def, home = def.follow ? [$gamePlayer._realX + 0.5, $gamePlayer._realY + 0.5] : this._spot ? [this._spot[0] + 0.5, this._spot[1] + 0.5] : [this.centerX(), this.centerY()];
        let best = null, bestS = Infinity;
        for (const h of Hm.list) {
            if (!h._act3 || !fighting(h)) continue;
            const dMe = Math.hypot(h.centerX() - this.centerX(), h.centerY() - this.centerY()), dHome = Math.hypot(h.centerX() - home[0], h.centerY() - home[1]);
            if (dHome > (def.follow ? 8 : 9) && dMe > 3) continue;
            const foe = Hm.foeOf ? Hm.foeOf(h) : null;
            const score = dMe + (foe === this ? -4 : foe ? 3 : 0) + (runtime.defenders.filter(d => d !== this && d._target === h).length * 2);
            if (score < bestS) { bestS = score; best = h; }
        }
        return best;
    };
    Game_Defender.prototype.think = function() {
        const m = this._mode, def = this._def;
        if (m === "hurt") { if (this._modeT <= 0) this.setMode("idle"); return; }
        if (m === "windup") {
            if (this._target) this.faceTo(this._target.centerX(), this._target.centerY());
            if (this._modeT <= 0) { this.setMode("strike", 16); this._struck = false; se("Wind7", 55, 110 + rnd(0, 15)); }
            return;
        }
        if (m === "strike") {
            if (!this._struck && this._modeLen - this._modeT >= 4) { this._struck = true; this.blowLand(); }
            if (this._modeT <= 0) this.setMode("recover", 26);
            return;
        }
        if (m === "recover") { if (this._modeT <= 0) this.setMode("idle"); return; }
        // look round now and then
        if (--this._thinkT <= 0) { this._thinkT = 20; this._target = this.pickTarget(); }
        const h = this._target;
        if (h && !fighting(h)) { this._target = null; return; }
        if (h) {
            const d = Math.hypot(h.centerX() - this.centerX(), h.centerY() - this.centerY());
            if (d <= 1.45) {
                this.faceTo(h.centerX(), h.centerY());
                if (this._cdT <= 0 && !this.isMoving()) { this.setMode("windup", def.atk ? 24 : 18); this._cdT = rnd(def.cd[0], def.cd[1]); }
                return;
            }
            if (!this.isMoving() && !this.walkTo(h._x, h._y, "foe", 1)) this.faceTo(h.centerX(), h.centerY());
            return;
        }
        if (this.isMoving()) return;
        // nobody to fight: by the hero (Grum) or at its place
        if (def.follow) {
            const d = Math.hypot($gamePlayer._realX - this._realX, $gamePlayer._realY - this._realY);
            if (d > 2.6) this.walkTo($gamePlayer.x, $gamePlayer.y, "hero", 2);
            return;
        }
        if (this._spot && (this._x !== this._spot[0] || this._y !== this._spot[1])) { if (!this.walkTo(this._spot[0], this._spot[1], "spot", 0)) this._spotStuck = (this._spotStuck || 0) + 1; }
        else if (this._spot && this._spot[2]) this.setDirection(this._spot[2]);
    };
    // the blow lands: the man in reach and in front takes it (his guard, his shield - Humans.js); he fights this one back
    Game_Defender.prototype.blowLand = function() {
        const h = this._target, Hm = HM();
        this._swingT = 12;
        if (!h || !fighting(h) || !Hm) return;
        const dx = h.centerX() - this.centerX(), dy = h.centerY() - this.centerY(), d = Math.hypot(dx, dy);
        if (d > 1.7) return;
        const dmg = Math.max(1, Math.round(this._dmg * (0.85 + Math.random() * 0.3)));
        Hm.hit(h, dmg, "melee", { from: { x: this.centerX(), y: this.centerY() }, poise: Math.round(dmg * 1.1), knock: Math.random() < 0.2, ally: this._key });
        se("Blow1", 65, 95 + rnd(0, 20));
        const st = siege() && siege().defenders[this._id];
        if (st) st.fought = true;
        if (!h._dead && !h._surrendered && Hm.setFoe && Hm.foeOf && !Hm.foeOf(h) && h._kind !== "archer") Hm.setFoe(h, this);
        if (Math.random() < 0.12 && this._def.lines) say(this, this._def.lines.hit, 140);
    };
    // a man's blow on this one (Humans.js blowLand -> foe.takeHit): Grum's shield from the front, the armour, the balance, down
    Game_Defender.prototype.takeHit = function(info) {
        if (this._down) return "miss";
        const from = info.from, F2 = (T.api("Combat_parts") || {}).fight;
        let dmg = info.damage || 1;
        if (this._def.atk === "Merc" && from && !info.heavy && this._mode !== "windup" && this._mode !== "strike") {
            const fx = from.centerX() - this.centerX(), fy = from.centerY() - this.centerY(), dd = Math.hypot(fx, fy) || 1;
            if ((fx * Math.cos(this._faceAng) + fy * Math.sin(this._faceAng)) / dd > 0.3 && Math.random() < 0.6) {
                dmg = Math.round(dmg * 0.2);
                if (F2) F2.numberAt(this.centerX(), this.centerY() - 1.3, dmg > 0 ? "Blok -" + dmg : "Zablokowane!", "#cfd6de", 0.75);
                se("Sword4", 70, 115);
                this._hp -= dmg;
                if (this._hp <= 0) this.goDown();
                return "block";
            }
        }
        dmg = Math.max(1, Math.round(dmg * (1 - (this._def.armor || 0))));
        this._hp -= dmg;
        this._flashT = 8;
        if (F2) { F2.numberAt(this.centerX(), this.centerY() - 0.9, String(dmg), "#ff8f7a", 0.85); F2.sparksAt(this.centerX(), this.centerY() - 0.3, "#b8322a", 6); }
        se("Damage1", 55, 90);
        const st = siege() && siege().defenders[this._id];
        if (st) st.hp = Math.max(0, this._hp / this._maxHp);
        if (this._hp <= 0) { this.goDown(); return "hit"; }
        this._poise -= info.poise || 0;
        if (this._poise <= 0) {
            this._poise = this._maxPoise;
            this.setMode("hurt", 36);
            if (from && !this.isJumping()) {
                const ax = this._x - from._x, ay = this._y - from._y, bx = Math.abs(ax) >= Math.abs(ay) ? Math.sign(ax) : 0, by = Math.abs(ax) >= Math.abs(ay) ? 0 : Math.sign(ay);
                const dir = bx > 0 ? 6 : bx < 0 ? 4 : by > 0 ? 2 : 8;
                if ((bx || by) && this.canPass(this._x, this._y, dir) && !this.occupied(this._x + bx, this._y + by)) this.jump(bx, by);
            }
        }
        return "hit";
    };
    Game_Defender.prototype.goDown = function() {
        this._hp = 0;
        this._down = true;
        this._target = null;
        this.setMode("down");
        this.setThrough(true);
        this.setPriorityType(0);
        if (this._def.lines) say(this, this._def.lines.down, 260);
        se("Collapse1", 60, 95);
        const s = siege();
        if (s && s.defenders[this._id]) { s.defenders[this._id].down = true; s.defenders[this._id].hp = 0; }
    };

    // their 8-way walks (Hunting's LOOK8): each sheet is its own name (no $Npc_ name taken over: the town's residents keep theirs)
    // and the commander's own look (a mercenary with his sheets: Humans.js's LOOKS and Hunting's LOOK8, like Humans registers its kinds)
    function registerLooks() {
        const Hn = HN(), L = Hn && Hn.LOOK8;
        if (!L) return;
        for (const def of D.DEFENDERS) if (!L[def.sheet]) L[def.sheet] = { sheet: def.sheet, cell: 64, stride: def.atk ? 1.7 : 1.5, turn: 2 };
        const Hm = HM(), cap = D.CAPTAIN;
        if (cap && Hm && Hm.LOOKS && !Hm.LOOKS[cap.look]) Hm.LOOKS[cap.look] = { anim: Object.assign({}, cap.anim), shield: true };
        if (cap && !L["$Human_" + cap.look]) {
            const a = "anim8/" + cap.look + "_";
            L["$Human_" + cap.look] = { sheet: a + "Walk8", cell: 64, stride: 1.7, turn: 2, runAt: 4.2 };
            L["$Human_" + cap.look + "_Atk"] = { sheet: a + "Atk8", cell: 96, pose: true };
            L["$Human_" + cap.look + "_Guard"] = { sheet: a + "Guard8", cell: 96, pose: true };
            L["$Human_" + cap.look + "_Kneel"] = { sheet: a + "Kneel8", cell: 96, pose: true };
            L["$Human_" + cap.look + "_Crouch"] = { sheet: a + "Kneel8", cell: 96, pose: true };   // (he never sits by a camp fire)
            L["$Human_" + cap.look + "_Lie"] = { sheet: a + "Lie8", cell: 64, pose: true };
        }
    }
    registerLooks();
    const _Scene_Map_create = Scene_Map.prototype.create;
    Scene_Map.prototype.create = function() {
        registerLooks();
        _Scene_Map_create.call(this);
    };
    // where each defender comes in (and when), its place
    function defendersFor(m) {
        const s = siege(), c = ctxC(), out = [];
        if (!s) return out;
        for (const def of D.DEFENDERS) {
            if (!def.maps.includes(m)) continue;
            let ok = false;
            try { ok = !!def.when(c); } catch (e) { ok = false; }
            if (!ok) continue;
            for (let n = 0; n < (def.n || 1); n++) out.push({ def, n, id: def.key + ((def.n || 1) > 1 ? n : "") });
        }
        return out;
    }
    function arrivalOf(def) {
        const s = siege();
        if (def.from !== "gate") return 0;
        const base = def.help ? (s.bellT === null ? Infinity : s.bellT) : 0;
        return base + (def.delay || 0);
    }
    // the defenders of this map come: on their places (or by the hero), or through the yard's gate when their time comes
    function updateDefenders() {
        const s = siege(), m = mapId();
        if (!s || !D.TRIGGER.siegeMaps.includes(m)) return;
        const sp = D.SPOTS[m], guard = (sp && sp.guard) || [];
        let gi = 0;
        for (const e of defendersFor(m)) {
            const spot = e.def.guard === "door" ? guard[0] : guard[(gi++) % Math.max(1, guard.length)] || null;
            if (runtime.defenders.some(d => d._id === e.id)) continue;
            const at = arrivalOf(e.def);
            if (s.t < at) continue;
            const saved = s.defenders[e.id] || null, taken = new Set(runtime.defenders.map(d => d._x + "," + d._y));
            let pos = null;
            if (e.def.follow) pos = freeSpot($gamePlayer.x + 1, $gamePlayer.y, taken);
            else if (e.def.from === "here" && e.def.key === "borgar") pos = freeSpot(sp.borgar ? sp.borgar[0] : spot[0], sp.borgar ? sp.borgar[1] : spot[1], taken);
            else if (s.t >= at + 300 && spot) pos = freeSpot(spot[0], spot[1], taken);
            else { const f = (sp.from || [])[runtime.defenders.length % Math.max(1, (sp.from || []).length)] || spot; pos = f ? freeSpot(f[0], f[1], taken) : null; }
            if (!pos) continue;
            const d = new Game_Defender(e.def, e.n, pos[0], pos[1], s.level, saved);
            d._spot = spot ? [spot[0], spot[1], 2] : null;
            if (e.def.guard === "door" && m === D.TAVERN) d._spot = [guard[0][0], guard[0][1], 8];
            runtime.defenders.push(d);
            RoamingActor.addSprite(d);
            if (!s.defenders[e.id]) s.defenders[e.id] = { hp: 1, down: false, fought: false, present: true };
            s.defenders[e.id].present = true;
            if (!d._down && e.def.lines && !s.told["in_" + e.id] && e.n === 0) { s.told["in_" + e.id] = true; say(d, e.def.lines.start, 240); }
        }
        for (const d of runtime.defenders) if (!d._sprite || !d._sprite.parent) RoamingActor.addSprite(d);
    }
    // the map's own characters who are in the fight now (Borgar's and Grum's events, the town's residents who came) are hidden while
    // it lasts; Melia and Ozzy hide; Grum who sits it out says so
    function hideOne(ev) {
        if (!ev) return;
        if (!ev.isTransparent()) ev.setTransparent(true);
        if (!ev.isThrough()) ev.setThrough(true);
        runtime.hidden.add(ev);
    }
    function updateHidden() {
        const s = siege(), m = mapId();
        if (!s) return;
        const c = ctxC(), L = TL();
        for (const def of D.DEFENDERS) {   // (whoever is in the fight - on this map or the other one: not at his table, not at home)
            let ok = false;
            try { ok = !!def.when(c); } catch (e) { ok = false; }
            if (!ok || (def.help && !s.bell)) continue;
            if (def.hideEvent && m === D.TAVERN && def.maps.includes(m)) hideOne($gameMap.event(def.hideEvent));
            if (L && L.eventOf) for (const key of def.hide || []) hideOne(L.eventOf(key));
        }
        if (m === D.TAVERN && c.grum === "enemy") hideOne($gameMap.event(3));
        if (L && L.eventOf && c.rafal === "enemy") hideOne(L.eventOf("rafal"));
        if (m === D.TAVERN && !s.told["hide_" + s.startDay]) {
            s.told["hide_" + s.startDay] = true;
            const melia = $gameMap.event(2), ozzy = $gameMap.event(4), grum = $gameMap.event(3);
            if (melia && !melia.isTransparent()) setTimeout(() => say(melia, TX.meliaHide, 200), 600);
            if (ozzy && !ozzy.isTransparent()) setTimeout(() => say(ozzy, TX.ozzyHide, 200), 1800);
            if (c.grum === "neutral" && grum && !grum.isTransparent()) setTimeout(() => say(grum, TX.grumNeutral, 240), 3000);
        }
    }
    function restoreHidden() {
        for (const ev of runtime.hidden) {
            if (ev._town && ev._town.hidden) continue;   // (a resident TownLife keeps indoors now: as it is)
            ev.setTransparent(false);
            ev.setThrough(false);
        }
        runtime.hidden = new Set();
    }

    // ------------------------------------------------------------------
    // The runtime (not saved: made again on each map)
    // ------------------------------------------------------------------
    const runtime = {
        live: [], defenders: [], hidden: new Set(), helpNoticeT: 0, endT: 0, doorHitT: 0,
        reset() {
            for (const d of this.defenders) RoamingActor.dropSprite(d);
            this.live = [];
            this.defenders = [];
            this.hidden = new Set();
            this.endT = 0;
            const s = S().siege;
            if (s) for (const W of s.waves) W.spawned = false;
        }
    };
    // a map change or a load: the men are gone (Humans.js clears them) - what was left of the wave is kept; the defenders made again
    function onMapChange() {
        const s = S().siege;
        if (s && S().phase === "siege") {
            const W = s.waves[s.wave];
            if (W && W.spawned) snapshot(s.wave);
        }
        runtime.reset();
    }
    T.on("mapLeave", onMapChange, { owner: PLUGIN });
    T.on("load", () => runtime.reset(), { owner: PLUGIN });
    T.on("newGame", () => runtime.reset(), { owner: PLUGIN });
    // the bus: the faction's men beaten (the tallies), the hero beaten (the rest without him)
    T.on("humanDefeated", e => {
        const s = siege();
        if (!s || !isAct3Tag(e.tag)) return;
        if (e.how === "killed") s.killed++; else if (e.how === "spared") s.spared++; else if (e.how === "robbed") s.robbed++; else if (e.how === "fled") s.fled++;
    }, { owner: PLUGIN });
    T.on("heroRobbed", e => {
        const s = siege();
        if (!s || !isAct3Tag(e.tag)) return;
        s.beaten = true;
        top([TX.beaten, ""], "#ff9f8f");
        finish("beaten");
    }, { owner: PLUGIN });

    // ------------------------------------------------------------------
    // The map's frame
    // ------------------------------------------------------------------
    let checkT = 0;
    let auto = true;   // (Act3.auto(false): nothing armed, started or decided by itself - the tests of other systems; F9 and the API still work)
    T.onMapUpdate(scene => {
        if (!window.$gameMap || !window.$gamePlayer) return;
        hookTalk();
        const s = S();
        if (s.phase === "idle") {
            if (auto && --checkT <= 0) { checkT = 60; if (armReady()) arm(); }
            return;
        }
        if (s.phase === "armed") {
            if (!auto) return;
            if (D.TRIGGER.siegeMaps.includes(mapId()) || mapId() === D.TOWN) warnings();
            if (--checkT <= 0) {
                checkT = 30;
                const passed = nightsPassed();
                if (passed >= D.TRIGGER.waitNights) { finishOffscreen(); return; }
                if (passed >= 0 && day() * 24 + hour() >= s.siegeDay * 24 + D.TRIGGER.from - 0.001 && inWindow(hour()) && maySiegeNow(scene)) startSiege();
            }
            return;
        }
        if (s.phase === "siege") {
            if (D.TRIGGER.siegeMaps.includes(mapId())) { updateDefenders(); updateHidden(); }
            tickSiege(scene);
            return;
        }
        if (s.phase === "done") {
            if (!s.told && s.outcome && D.TRIGGER.siegeMaps.includes(mapId()) && T.isCalm(scene)) tellOutcome(s.outcome);
            if (runtime.endT > 0 && --runtime.endT === 0) {
                for (const d of runtime.defenders) RoamingActor.dropSprite(d);
                runtime.defenders = [];
                restoreHidden();
                const Hm = HM();
                if (Hm && Hm.list) for (const h of Hm.list.slice()) if (isAct3Tag(h._tag) && Hm.remove) Hm.remove(h);
                runtime.live = [];
            }
        }
    }, { owner: PLUGIN, name: "act3" });

    // the defenders move with the map (inside its update, like the men)
    const _Game_Map_update = Game_Map.prototype.update;
    Game_Map.prototype.update = function(sceneActive) {
        _Game_Map_update.call(this, sceneActive);
        const Hm = HM();
        if (Hm && Hm.robbery) return;
        for (const d of runtime.defenders.slice()) d.update();
    };

    // ------------------------------------------------------------------
    // The look: the doors' bars, the fires on the tavern's front, the defenders' bars and names, their swings, the rope's marker, the
    // scars of the night afterwards; the fires' light at night (the night layer's lights - every light is fire)
    // ------------------------------------------------------------------
    const bmpCache = {};
    const cached = (key, make) => bmpCache[key] || (bmpCache[key] = make());
    function textBitmap(text, size, color) {
        const w = Math.max(24, Math.ceil(String(text).length * size * 0.6) + 14), b = new Bitmap(w, size + 10);
        b.fontSize = size; b.fontBold = true; b.outlineColor = "rgba(0,0,0,0.9)"; b.outlineWidth = 4; b.textColor = color;
        b.drawText(text, 0, 0, w, size + 10, "center");
        return b;
    }
    function flameFrames() {
        return cached("flames", () => {
            const out = [];
            for (let f = 0; f < 6; f++) {
                const b = new Bitmap(40, 52), ctx = b.context;
                for (let k = 0; k < 5; k++) {
                    const x = 20 + Math.sin(f * 1.3 + k * 2.1) * 5, h = 30 + ((f * 7 + k * 11) % 14), w = 9 + (k % 3) * 3;
                    const g = ctx.createRadialGradient(x, 50 - h * 0.35, 1, x, 50 - h * 0.35, h * 0.7);
                    g.addColorStop(0, "rgba(255,244,190,0.95)"); g.addColorStop(0.35, "rgba(255,170,60,0.85)"); g.addColorStop(0.75, "rgba(210,70,20,0.5)"); g.addColorStop(1, "rgba(120,20,0,0)");
                    ctx.fillStyle = g;
                    ctx.beginPath(); ctx.ellipse(x, 50 - h * 0.4, w * 0.6, h * 0.55, 0, 0, Math.PI * 2); ctx.fill();
                }
                b._baseTexture.update();
                out.push(b);
            }
            return out;
        });
    }
    function sootBitmap(seed) {
        return cached("soot" + seed, () => {
            const b = new Bitmap(64, 64), ctx = b.context;
            for (let k = 0; k < 9; k++) {
                const x = 32 + Math.sin(seed * 3.1 + k * 1.7) * 16, y = 40 - k * 3 + Math.cos(seed + k) * 6, r = 10 + (k % 4) * 4;
                const g = ctx.createRadialGradient(x, y, 1, x, y, r);
                g.addColorStop(0, "rgba(20,14,10,0.55)"); g.addColorStop(1, "rgba(20,14,10,0)");
                ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
            }
            b._baseTexture.update();
            return b;
        });
    }
    function markerBitmap() {
        return cached("marker", () => {
            const b = new Bitmap(24, 28), ctx = b.context;
            ctx.fillStyle = "#1a1408"; ctx.beginPath(); ctx.moveTo(12, 1); ctx.lineTo(23, 12); ctx.lineTo(12, 27); ctx.lineTo(1, 12); ctx.closePath(); ctx.fill();
            ctx.fillStyle = "#ffd23f"; ctx.beginPath(); ctx.moveTo(12, 4); ctx.lineTo(20, 12); ctx.lineTo(12, 24); ctx.lineTo(4, 12); ctx.closePath(); ctx.fill();
            b._baseTexture.update();
            return b;
        });
    }
    const tw = () => $gameMap.tileWidth(), th = () => $gameMap.tileHeight();
    const scrX = x => Math.round($gameMap.adjustX(x - 0.5) * tw() + tw() / 2);
    const scrY = y => Math.round($gameMap.adjustY(y - 0.5) * th() + th() / 2);
    function firesLit() {
        const s = S();
        if (mapId() !== D.TOWN) return [];
        const list = D.SPOTS[8].fires || [];
        if (s.phase === "siege" && s.siege) return list.slice(0, clamp(Math.floor(s.siege.damage / 18) + (s.siege.broken[8] ? 1 : 0), 0, list.length));
        if (s.phase === "done" && s.outcome && s.outcome.result !== "held" && day() <= s.outcome.day && (hour() >= 18 || hour() < 6)) return list.slice(0, 2);   // (the embers of that night)
        return [];
    }

    function Sprite_Act3Layer() {
        this.initialize(...arguments);
    }
    Sprite_Act3Layer.prototype = Object.create(Sprite.prototype);
    Sprite_Act3Layer.prototype.constructor = Sprite_Act3Layer;
    Sprite_Act3Layer.prototype.initialize = function(back) {
        Sprite.prototype.initialize.call(this);
        this._back = !!back;
        this.z = back ? 2 : 8;
        this._age = 0;
        this._fires = [];
        this._soot = [];
        this._bars = new Map();
        this._door = new Sprite(new Bitmap(96, 30));
        this._door.anchor.set(0.5, 1);
        this._door.visible = false;
        this._doorKey = "";
        this.addChild(this._door);
        this._marker = new Sprite(markerBitmap());
        this._marker.anchor.set(0.5, 1);
        this._marker.visible = false;
        this.addChild(this._marker);
        this._swings = new Sprite(new Bitmap(Graphics.width, Graphics.height));
        this.addChild(this._swings);
    };
    Sprite_Act3Layer.prototype.update = function() {
        Sprite.prototype.update.call(this);
        this._age++;
        try { if (this._back) { this.updateScars(); this.updateFires(); } else { this.updateDoor(); this.updateMarker(); this.updateDefenders(); } }
        catch (e) { /* (a picture must never stop the map) */ }
    };
    Sprite_Act3Layer.prototype.updateScars = function() {
        const s = S(), on = s.scarsUntil && day() <= s.scarsUntil && D.TRIGGER.siegeMaps.includes(mapId());
        const want = !on ? [] : mapId() === D.TOWN ? (D.SPOTS[8].fires || []).map(f => [f[0], f[1] - 0.3, 1.4]) : [[D.SPOTS[1].doorTile[0], D.SPOTS[1].doorTile[1], 1.2]];
        while (this._soot.length > want.length) { const sp = this._soot.pop(); this.removeChild(sp); }
        while (this._soot.length < want.length) { const sp = new Sprite(sootBitmap(this._soot.length + 1)); sp.anchor.set(0.5, 0.75); this.addChildAt(sp, 0); this._soot.push(sp); }
        want.forEach((f, k) => { const sp = this._soot[k]; sp.x = scrX(f[0] + 0.5); sp.y = scrY(f[1] + 0.5); sp.scale.set(f[2], f[2]); sp.opacity = 200; });
    };
    Sprite_Act3Layer.prototype.updateFires = function() {
        const list = firesLit(), frames = flameFrames();
        while (this._fires.length > list.length) { const sp = this._fires.pop(); this.removeChild(sp); }
        while (this._fires.length < list.length) { const sp = new Sprite(); sp.anchor.set(0.5, 1); sp.blendMode = 1; this.addChild(sp); this._fires.push(sp); }
        list.forEach((f, k) => {
            const sp = this._fires[k];
            sp.bitmap = frames[Math.floor((this._age + k * 3) / 5) % frames.length];
            sp.x = scrX(f[0] + 0.5);
            sp.y = scrY(f[1] + 0.5) + 10;
            sp.scale.set(f[2] || 1, (f[2] || 1) * (0.92 + 0.08 * Math.sin(this._age * 0.3 + k)));
        });
        if (list.length && this._age % 50 === 0) se("Fire1", 25, 90 + rnd(0, 20));
    };
    Sprite_Act3Layer.prototype.updateDoor = function() {
        const s = siege(), m = mapId(), sp = this._door;
        const w = s ? D.WAVES[s.wave] : null, show = !!s && D.DOORS[m] && ((w && w.map === m && s.waves[s.wave].state === "live") || s.doors[m] < D.DOORS[m].hp);
        sp.visible = !!show;
        if (!show) return;
        const dt = D.SPOTS[m].doorTile, hp = s.doors[m], key = Math.round(hp) + "|" + s.broken[m];
        sp.x = scrX(dt[0] + 0.5);
        sp.y = scrY(dt[1]) - 6 + (runtime.doorHitT > 0 ? (runtime.doorHitT-- % 2) * 2 : 0);
        if (key === this._doorKey) return;
        this._doorKey = key;
        const b = sp.bitmap, ctx = b.context;
        b.clear();
        b.fontSize = 13; b.fontBold = true; b.outlineWidth = 3; b.outlineColor = "rgba(0,0,0,0.9)"; b.textColor = s.broken[m] ? "#ff9f8f" : "#ffe9a8";
        b.drawText(s.broken[m] ? (m === D.TOWN ? "Wyważone!" : "Puściły!") : D.SPOTS[m].doorName, 0, 0, 96, 16, "center");
        ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.fillRect(10, 18, 76, 9);
        ctx.fillStyle = "#3a2414"; ctx.fillRect(11, 19, 74, 7);
        ctx.fillStyle = hp > 50 ? "#d9a441" : hp > 25 ? "#e07a2f" : "#e5484d"; ctx.fillRect(11, 19, Math.round(74 * hp / 100), 7);
        b._baseTexture.update();
    };
    Sprite_Act3Layer.prototype.updateMarker = function() {
        const s = siege(), sp = this._marker, b = D.SPOTS[8].bell;
        sp.visible = !!s && !s.bell && mapId() === D.TOWN && !ctx().ambrozy;
        if (!sp.visible) return;
        sp.x = scrX(b[0] + 0.5);
        sp.y = scrY(b[1]) - 30 + Math.round(Math.sin(this._age * 0.08) * 4);
    };
    // the defenders: the green bar and the name over each, lying when down, a flash when hit, the swing of a blow
    Sprite_Act3Layer.prototype.updateDefenders = function() {
        const seen = new Set(), sw = this._swings.bitmap, ctx = sw.context;
        sw.clear();
        for (const d of runtime.defenders) {
            const sp = d._sprite;
            if (!sp || !sp.parent) continue;
            seen.add(d);
            let bar = this._bars.get(d);
            if (!bar) { bar = new Sprite(new Bitmap(90, 30)); bar.anchor.set(0.5, 1); this.addChild(bar); this._bars.set(d, bar); bar._key = ""; }
            const key = Math.round(100 * d._hp / d._maxHp) + "|" + d._down;
            if (bar._key !== key) {
                bar._key = key;
                const b = bar.bitmap, c2 = b.context, hp = Math.max(0, d._hp / d._maxHp);
                b.clear();
                b.fontSize = 12; b.fontBold = true; b.outlineWidth = 3; b.outlineColor = "rgba(0,0,0,0.9)"; b.textColor = d._down ? "#cfd6de" : "#bdf5a8";
                b.drawText(d._down ? d._def.name + " (ranny)" : d._def.name, 0, 0, 90, 15, "center");
                if (!d._down) {
                    c2.fillStyle = "rgba(0,0,0,0.75)"; c2.fillRect(23, 17, 44, 7);
                    c2.fillStyle = "#1d3a1c"; c2.fillRect(24, 18, 42, 5);
                    c2.fillStyle = "#5fd35a"; c2.fillRect(24, 18, Math.round(42 * hp), 5);
                }
                b._baseTexture.update();
            }
            bar.x = sp.x;
            bar.y = sp.y - (d._down ? 26 : 58);
            bar.visible = sp.visible;
            // down: lying on his side; hit: a red flash
            sp.rotation = d._down ? 1.35 : 0;
            if (d._down) sp.setColorTone([-30, -30, -30, 80]);
            else if (d._flashT > 0) sp.setBlendColor([255, 60, 40, 140 * d._flashT / 8]);
            else sp.setBlendColor([0, 0, 0, 0]);
            // the swing: an arc of the weapon's colour in front of him
            if (d._swingT > 0 && !d._def.atk) {
                const k = d._swingT / 12, a = d._faceAng, cx = sp.x + Math.cos(a) * 14, cy = sp.y - 22 + Math.sin(a) * 10;
                ctx.strokeStyle = d._def.swing || "#e8e8e8";
                ctx.globalAlpha = 0.85 * k;
                ctx.lineWidth = 4;
                ctx.beginPath(); ctx.arc(cx, cy, 20, a - 1.1 + (1 - k) * 0.9, a + 0.3 + (1 - k) * 0.9); ctx.stroke();
                ctx.globalAlpha = 1;
            }
        }
        for (const [d, bar] of this._bars) if (!seen.has(d)) { this.removeChild(bar); this._bars.delete(d); }
        sw._baseTexture.update();
    };
    // the fires' light at night (the town's night layer - Farming_Render.js) - warm and flickering, as every light in the game
    function fireLights() {
        const out = [];
        firesLit().forEach((f, k) => {
            const x = scrX(f[0] + 0.5), y = scrY(f[1] + 0.5);
            out.push({ x, y: y - 14, r: 260, i: 1, id: 8400 + k, gx: x, gy: y, hf: 18, glow: true });
        });
        // the torches of the men outside
        const s = siege();
        if (s && mapId() === D.TOWN) for (const h of runtime.live) if (!h._dead && h._act3 && D.WAVES[h._act3.wave] && D.WAVES[h._act3.wave].map === D.TOWN && fighting(h)) {
            out.push({ x: scrX(h.centerX()), y: scrY(h.centerY()) - 30, r: 150, i: 0.8, id: 8420 + (h._hid % 30), gx: scrX(h.centerX()), gy: scrY(h.centerY()), hf: 12 });
        }
        return out;
    }
    const _Spriteset_Map_createCharacters = Spriteset_Map.prototype.createCharacters;
    Spriteset_Map.prototype.createCharacters = function() {
        _Spriteset_Map_createCharacters.call(this);
        for (const d of runtime.defenders) { d._sprite = null; RoamingActor.addSprite(d, this); }
        this._act3Back = new Sprite_Act3Layer(true);
        this._tilemap.addChild(this._act3Back);
        this._act3Layer = new Sprite_Act3Layer(false);
        this._tilemap.addChild(this._act3Layer);
        const nl = this._nightLight;
        if (nl && typeof nl.lights === "function" && !nl._act3Lit) {
            const base = nl.lights;
            nl.lights = function() { const out = base.call(this); try { out.push(...fireLights()); } catch (e) { /* no fire light this frame */ } return out; };
            nl._act3Lit = true;
        }
    };

    // ------------------------------------------------------------------
    // The rope under the bell: an event always in the town map's data (Tawerna.inject 859; the action button) - quiet unless the strike
    // is coming. (Not put in only while it is: a transfer within the same map keeps the map's events but loads its data again, and an
    // event whose data went away with a when() turned false broke the characters' sprites - WaterFx reads every event's note)
    // ------------------------------------------------------------------
    if (T.inject.reserve) {
        try { T.inject.reserve(PLUGIN, D.IDS.from, D.IDS.rope - 1, "Akt III: rezerwa (napad na tawernę)"); } catch (e) { /* (kept already) */ }
    }
    T.inject(D.TOWN, { ids: [D.IDS.rope, D.IDS.rope], owner: PLUGIN, build() {
        const b = D.SPOTS[8].bell;
        const page = {
            conditions: { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
                          switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 },
            directionFix: false, image: { tileId: 0, characterName: "", direction: 2, pattern: 1, characterIndex: 0 },
            list: [{ code: 355, indent: 0, parameters: ["Act3.bellRope();"] }, { code: 0, indent: 0, parameters: [] }],
            moveFrequency: 3, moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false },
            moveSpeed: 3, moveType: 0, priorityType: 1, stepAnime: false, through: false, trigger: 0, walkAnime: false
        };
        return [{ id: D.IDS.rope, name: "Akt III: lina dzwonu (alarm)", note: "<Act3:rope>", pages: [page], x: b[0], y: b[1] }];
    } });

    // ------------------------------------------------------------------
    // F9 (Debug.js's menu, the events tab): arm it, start it now, clear it
    // ------------------------------------------------------------------
    function hookDebug() {
        const SD = window.Scene_Debug;
        if (!SD || SD._act3) return;
        SD._act3 = true;
        const _create = SD.prototype.create;
        SD.prototype.create = function() {
            _create.call(this);
            const list = this._list;
            if (!list || !list._all) return;
            list._all.push({ tab: 0, kind: "act3_arm", label: TX.f9Arm, icon: 76 }, { tab: 0, kind: "act3_start", label: TX.f9Start, icon: 76 }, { tab: 0, kind: "act3_reset", label: TX.f9Reset, icon: 76 });
            if (list._tab === 0 && typeof list.setTab === "function") list.setTab(0, list.index());
        };
        const _onOk = SD.prototype.onOk;
        SD.prototype.onOk = function() {
            const row = this._list && this._list.rowData ? this._list.rowData() : null;
            if (row && row.kind === "act3_arm") { debugArm(); this.popScene(); return; }
            if (row && row.kind === "act3_start") { debugStart(); this.popScene(); return; }
            if (row && row.kind === "act3_reset") { reset(); $gameTemp.pushLootPopup(row.icon, "Akt III: wyczyszczony", "#9ff0a8"); this._list.activate(); return; }
            _onOk.call(this);
        };
    }
    hookDebug();
    function debugArm() {
        const s = S();
        if (s.phase === "siege") return false;
        s.phase = "idle";
        s.outcome = null;
        arm();
        T.popup("Akt III: napad następnej nocy (dzień " + s.siegeDay + ")", { top: true, color: "#ffd98f" });
        return true;
    }
    // the strike now: on the town map in front of the tavern at 22:00 (from anywhere)
    function debugStart(opts) {
        const s = S();
        if (s.phase === "siege") return false;
        s.phase = "idle";
        s.outcome = null;
        if (hour() < D.TRIGGER.from && hour() >= D.TRIGGER.to) $gameSystem.setDayNightHour(22);
        if (!D.TRIGGER.siegeMaps.includes(mapId())) $gamePlayer.reserveTransfer(D.TOWN, D.SPOTS[8].door[0], D.SPOTS[8].door[1] + 2, 2, 0);
        arm({ now: true });
        return startSiege(opts);
    }
    function reset() {
        const s = S();
        runtime.reset();
        restoreHidden();
        const Hm = HM();
        if (Hm && Hm.list) for (const h of Hm.list.slice()) if (isAct3Tag(h._tag) && Hm.remove) Hm.remove(h);
        Object.assign(s, { phase: "idle", armedDay: 0, armedHour: 0, siegeDay: 0, warn: { day: 0, who: {} }, noted: false, siege: null, outcome: null, scarsUntil: 0, told: true });
        return true;
    }

    // ------------------------------------------------------------------
    // API (window.Act3, Tawerna.api("Act3"))
    // ------------------------------------------------------------------
    window.Act3 = T.register(PLUGIN, {
        DATA: D, Game_Defender,
        outcome: () => { if (!window.$gameSystem) return null; const o = S().outcome; return o ? JSON.parse(JSON.stringify(o)) : null; },
        phase: () => (window.$gameSystem ? S().phase : "idle"),
        auto: v => { auto = v === undefined ? auto : !!v; return auto; },
        state: S, siege, ctx, arm, start: startSiege, debugArm, debugStart, reset, bellRope, ringBell, finish, finishOffscreen, siegeLevel, nightsPassed,
        defenders: () => runtime.defenders, live: () => runtime.live, members: membersOf, snapshot, spawnWave, damage: n => { addDamage(n); return siege() ? siege().damage : 0; },
        // (tests) the wave on: every man of it beaten at once (their tallies as the bus tells them), the doors
        clearWave() {
            const s = siege(), Hm = HM();
            if (!s || !Hm) return false;
            for (const h of membersOf(s.wave).filter(fighting)) Hm.kill(h, "melee");
            return true;
        }
    });
})();
