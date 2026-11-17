//=============================================================================
// Jarmark_Sceny.js
//=============================================================================
// The thread W17 "Jarmark Kruczogrodu" - the SCENES and the chase (the core: Jarmark.js, the words: js/teksty/jarmark.txt):
//   S1 the procession of the opening (day 49, 14:30), S3 "Legenda o Kruku i Wilku" on the stage (day 51, 19:00) and S4 the put-out torches
//   and the theft, the ambush at the bell tower (day 52, 23:30), S5 the chase through the lanes, the morning's decisions (day 53), S6
//   the closing of the fair (noon of day 53).
// THE CHASE (2026-11-16, the new Kruczogród Map220; the player chose "pościg uliczkami"): on foot. Szept slips out behind the bell
// tower and runs his route of legs (JarmarkData.POGON.trasa) - a leg when the hero is near, or after 4 s while the hero still sees him;
// the hero far behind (out of sight) for 3 s: +15 s, Szept waits. In the one-cell gap between the houses he tips barrels over behind
// him (the hero runs round by the next gap). Szept standing and the hero beside him - caught (a shortcut pays); at the end of his
// route he gives up under the windmill. Nothing of the map changes; nothing runs outside the chase.
// A scene is an interpreter's list: one script command per step (Jarmark_Sceny.krok); P skips (the rest runs at once).

/*:
 * @target MZ
 * @plugindesc [W17] Jarmark - sceny (pochód, sztuka i kradzież, zasadzka, zamknięcie) i pościg uliczkami. v1.1.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @base Jarmark
 * @orderAfter Jarmark
 *
 * @help
 * ============================================================================
 * Jarmark_Sceny.js - sceny wątku W17 „Jarmark Kruczogrodu”
 * ============================================================================
 * Pościg uliczkami (biegiem): Szept ucieka od dzwonnicy do wiatraka; kto zgubi
 * go z oczu na 3 s, traci 15 s. P - pomija scenę.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna, J = window.Jarmark;
    if (!T || !J) throw new Error("Jarmark_Sceny.js: brak Jarmark.js - musi stać wyżej na liście wtyczek");
    const D = J.D, w = J.w, C = J.C, tx = J.tx, tx1 = J.tx1, fill = J.fill;
    const PLUGIN = "Jarmark_Sceny";
    const S = () => J.S(), day = () => J.day(), hour = () => J.hour(), has = () => J.has(), report = J.report, mapNow = J.mapNow;
    const SB = () => J.SB();
    const HERO = () => J.HERO();
    const AK = { lord: 4860, teodor: 4861, strazA: 4862, strazB: 4863, dziecko0: 4864, dziecko1: 4865, dziecko2: 4866, szept: D.ID.szept, ofelia: D.ID.ofelia, pimpek: D.ID.pimpek,
        zar: D.ID.zar, bonawentura: D.ID.bonawentura, ania: D.ID.ania, marcel: D.ID.marcel, ambrozy: D.ID.ambrozy, soltys: 4867, kapral: 4881, szeptBieg: 4882, beczki: 4883, kruk: D.ID.poduszka };
    const scena = { stale: 0, on: false, id: "", steps: [], skip: false, cw: 0, next: null };
    const ev = k => (k === "hero" ? $gamePlayer : J.evOf(typeof k === "number" ? k : AK[k]));
    const spkEv = J.spkEv;

    // ==================================================================
    // 1. Moving actors (a route round the map: the breadth-first search of the events' own passability)
    // ==================================================================
    function bfs(e, tx2, ty2, pass) {
        const W = $gameMap.width(), H = $gameMap.height(), key = (x, y) => y * W + x;
        const prev = new Map([[key(e.x, e.y), null]]), q = [[e.x, e.y]];
        const dirs = [[2, 0, 1], [4, -1, 0], [6, 1, 0], [8, 0, -1]];
        let n = 0;
        while (q.length && n++ < 12000) {
            const [x, y] = q.shift();
            if (x === tx2 && y === ty2) break;
            for (const [d, dx, dy] of dirs) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= W || ny >= H || prev.has(key(nx, ny))) continue;
                if (pass ? !pass(x, y, d) : !e.canPass(x, y, d)) continue;
                prev.set(key(nx, ny), [x, y, d]);
                q.push([nx, ny]);
            }
        }
        if (!prev.has(key(tx2, ty2))) return null;
        const route = [];
        let c = prev.get(key(tx2, ty2)), cx = tx2, cy = ty2;
        while (c) { route.unshift(c[2]); cx = c[0]; cy = c[1]; c = prev.get(key(cx, cy)); }
        return route;
    }
    const CODE = { 2: 1, 4: 2, 6: 3, 8: 4 };
    function idz(e, x, y, speed) {
        if (!e || e === $gamePlayer) { return false; }
        if (scena.skip) { e.locate(x, y); return true; }
        const wasThrough = e.isThrough();
        e.setThrough(false);
        const r = bfs(e, x, y);
        e.setThrough(wasThrough);
        if (!r) { e.locate(x, y); return false; }
        if (speed) e.setMoveSpeed(speed);
        e.forceMoveRoute({ list: r.map(d => ({ code: CODE[d] })).concat([{ code: 0 }]), repeat: false, skippable: true, wait: false });
        return true;
    }
    const idzie = () => [AK.lord, AK.teodor, AK.strazA, AK.strazB, AK.dziecko0, AK.dziecko1, AK.dziecko2, AK.ofelia, AK.bonawentura, AK.ania, AK.szept].some(id => { const e = J.evOf(id); return e && e.isMoveRouteForcing && e.isMoveRouteForcing(); });

    // ==================================================================
    // 2. The scene runner (an interpreter's list, one script command per step)
    // ==================================================================
    // a step: { say: [actor, key, frames], emo: [actor, balloon], se: [name, volume, pitch], idz: [actor, x, y, speed], dir: [actor, d], fn: () => {}, wait: frames, wm: true (wait the walkers) }
    function krok(interp, id, i) {
        const st = scena.steps[i];
        if (!st) return;
        const skip = scena.skip;
        try {
            for (const g of [].concat(st.idz && Array.isArray(st.idz[0]) ? st.idz : st.idz ? [st.idz] : [])) { const a = ev(g[0]); if (a) idz(a, g[1], g[2], g[3]); }
            for (const g of [].concat(st.dir && Array.isArray(st.dir[0]) ? st.dir : st.dir ? [st.dir] : [])) { const a = ev(g[0]); if (a) a.setDirection(g[1]); }
            if (!skip) {
                if (st.say) { const a = ev(st.say[0]); if (a && SB() && SB().say) SB().say(a, [].concat(tx(st.say[1]))[0], st.say[2] || 150); }
                if (st.emo) { const a = ev(st.emo[0]); if (a) $gameTemp.requestBalloon(a, st.emo[1]); }
                if (st.se) T.audio.se(st.se[0], { volume: st.se[1] || 70, pitch: st.se[2] || 100 });
            }
            if (typeof st.fn === "function") st.fn(interp);
        } catch (e) { report("krok " + id + "/" + i, e); }
        interp.wait(skip ? 1 : (st.wait === undefined ? 30 : st.wait));
    }
    function czekajChod(interp) { scena.cw++; if (idzie() && !scena.skip && scena.cw < 400) { interp._index -= 1; interp.wait(6); } else scena.cw = 0; }
    function graj(id, steps, o) {
        o = o || {};
        if (scena.on || !has() || $gameMap._interpreter.isRunning()) return false;
        scena.on = true; scena.id = id; scena.steps = steps; scena.skip = false;
        const list = [];
        if (o.pasy !== false) list.push(C(355, ["Jarmark.pasy(true);"]));
        steps.forEach((st, i) => { list.push(C(355, ["Jarmark_Sceny.krok(this, " + JSON.stringify(id) + ", " + i + ");"])); if (st.wm) list.push(C(355, ["Jarmark_Sceny.czekajChod(this);"])); });
        list.push(C(355, ["Jarmark_Sceny.koniecSceny(this, " + JSON.stringify(id) + ");"]));
        list.push(C(0));
        $gameMap._interpreter.setup(list, 0);
        return true;
    }
    function koniecSceny(interp, id) {
        scena.on = false; scena.steps = []; scena.skip = false;
        J.pasy(false);
        const f = KONIEC[id]; if (f) { try { f(); } catch (e) { report("koniec " + id, e); } }
        J.sprawdz();
    }
    const KONIEC = {};
    const _upd = Game_Interpreter.prototype.update;
    Game_Interpreter.prototype.update = function() {
        if (scena.on && !scena.skip && Input.isTriggered("keyP") && this === $gameMap._interpreter) { scena.skip = true; this._waitCount = 0; }
        _upd.call(this);
    };
    const zajete = () => scena.on || (bieg.on && has() && S().zasadzka === 1) || !!(has() && $gameMap._interpreter && $gameMap._interpreter.isRunning());
    const spokojnie = () => has() && !scena.on && !bieg.on && !$gameMap.isEventRunning() && !$gameMessage.isBusy() && SceneManager._scene instanceof Scene_Map && (!T.isCalm || T.isCalm(SceneManager._scene));

    // ==================================================================
    // 3. S1 the procession of the opening (day 49, 14:30)
    // ==================================================================
    const POCHOD = D.POCHOD;   // [key, sheet, start x, y (the town's east edge), the place x, y (before the stage)]
    const naMiejsce = back => POCHOD.map(p => [p[0], back ? p[2] : p[4], back ? p[3] : p[5], 3]);
    function pochodSpec(on, final) {
        J.api.pochod = on ? POCHOD.map(p => ({ name: tx1("imiona." + p[0]), x: final ? p[4] : p[2], y: final ? p[5] : p[3], sheet: p[1], index: 0, dir: final ? 2 : 4, pat: 1, through: true })) : null;
        J.odswiezMape(true);
    }
    function otwarcie() {
        const s = S();
        pochodSpec(true);
        const steps = [
            { fn: () => { J.heroNa(...D.SCENA.hero.otwarcie); }, wait: 20 },
            { say: ["ambrozy", "pochod.dzwon", 90], se: ["Bell3", 80, 90], wait: 60 },
            { se: ["Bell3", 80, 90], wait: 50 },
            { idz: naMiejsce(false), wm: true, wait: 10 },
            { dir: [["lord", 2], ["teodor", 2], ["strazA", 2], ["strazB", 2], ["dziecko0", 2], ["dziecko1", 2], ["dziecko2", 2], ["soltys", 2]], wait: 10 },
            { say: ["lord", "pochod.lord", 200], wait: 190 },
            { say: ["soltys", "pochod.soltys", 160], wait: 150 },
            { say: ["ofelia", "pochod.ofelia", 130], emo: ["pimpek", 1], wait: 100 },
            { fn: () => { T.audio.se("Applause1", { volume: 60 }); }, wait: 60 },
            { fn: () => { s.otw = 1; J.opinia(1); J.note("notatki.otwarcie"); J.popup(tx("napis.otwarty"), { top: true, color: "#ffe27a", sub: tx("napis.otwartyPod") }); }, wait: 40 },
            { idz: naMiejsce(true), wm: true, wait: 10 },   // (all of them back to the town's edge before they are taken away: nobody vanishes in sight)
            { fn: () => { pochodSpec(false); }, wait: 5 }
        ];
        // (the speaker "soltys": the resident's own event when he is on the square, else a nameless voice of the message window)
        graj("otwarcie", steps);
    }
    KONIEC.otwarcie = () => { pochodSpec(false); S().otw = 1; };

    // ==================================================================
    // 4. S3 the play and S4 the theft (day 51, 19:00)
    // ==================================================================
    // Ania (the Wolf) and Bonawentura (the Knight) go up on the stage for the play (Zygfryd stays by its edge)
    function naScenie(on) {
        // (on the boards they are drawn above the characters' layer: the stage's picture - an object one row lower - must not cover them)
        const put = (k, x, y, d) => { const e = ev(k); if (!e) return; e._jarFree = on; e.setThrough(on); e._priorityType = on ? 2 : 1; e.locate(on ? x : D.TRUPA[k].pos[0], on ? y : D.TRUPA[k].pos[1]); e.setDirection(on ? d : D.TRUPA[k].pos[2]); };
        for (const [k, c] of Object.entries(D.SCENA.naScenie)) put(k, c[0], c[1], c[2]);
    }
    function sztuka() {
        const s = S();
        J.api.crowd = true; J.odswiezMape(true);
        const steps = [
            { fn: () => { J.heroNa(...D.SCENA.hero.sztuka); naScenie(true); }, wait: 20 },
            { say: ["ofelia", "sztuka.ofelia", 200], wait: 190 },
            { say: ["ania", "sztuka.akt1.ania", 170], se: ["Wolf", 70, 100], wait: 160 },
            { say: ["bonawentura", "sztuka.akt1.bonawentura", 170], wait: 160 },
            { say: ["pimpek", "sztuka.akt2.pimpek", 150], emo: ["pimpek", 1], fn: () => { ev("pimpek") && ev("pimpek").jump(0, 0); }, wait: 120 },
            { say: ["zar", "sztuka.akt2.zar", 150], se: ["Flame1", 70, 90], wait: 140 },
            { say: ["ambrozy", "sztuka.ambrozy", 150], wait: 120 },
            { say: ["ania", "sztuka.akt3.ania", 160], wait: 150 },
            { say: ["bonawentura", "sztuka.akt3.bonawentura", 160], wait: 150 },
            // S4: the big flame, the wind, the torches out
            { say: ["zar", "sztuka.plomien", 100], se: ["Flame3", 80, 80], emo: ["zar", 6], wait: 70 },
            { se: ["Wind7", 80, 100], fn: () => { s.przed.cien = 1; J.odswiezMape(true); $gameScreen.startTint([-110, -110, -85, 130], 25); }, wait: 40 },
            { say: ["ofelia", "sztuka.ciemno", 100], wait: 60 },
            { se: ["Run", 60, 130], fn: () => { const e = ev("szept"); if (e) { /* the shadow runs behind the stage */ const u = D.SCENA.ucieczka; e.setThrough(true); e.locate(u[0], u[1]); e.setMoveSpeed(5); e.forceMoveRoute({ list: Array.from({ length: u[3] }, () => ({ code: u[2] })).concat([{ code: 0 }]), repeat: false, skippable: true, wait: false }); } }, wait: 50 },
            { se: ["Crash", 70, 110], say: ["ania", "sztuka.krzyk", 90], wait: 80 },
            { fn: () => { s.przed.cien = 0; s.przed.kradziez = 1; s.przed.scena = 1; $gameScreen.startTint([0, 0, 0, 0], 30); J.odswiezMape(true); }, wait: 50 },
            { se: ["Bell3", 90, 70], say: ["ambrozy", "sztuka.pusta", 170], wait: 90 },
            { se: ["Bell3", 90, 70], wait: 100 },
            { say: ["ofelia", "sztuka.ofeliaKrzyk", 150], wait: 150 },
            { fn: () => { J.note("notatki.kradziez"); J.popup(tx("napis.kradziez"), { top: true, color: "#ff8a6b", sub: tx("napis.kradziezPod") }); }, wait: 40 }
        ];
        if (!graj("sztuka", steps)) { J.api.crowd = false; return false; }
        return true;
    }
    KONIEC.sztuka = () => { naScenie(false); J.api.crowd = false; $gameScreen.startTint([0, 0, 0, 0], 1); const s = S(); s.przed.cien = 0; s.przed.kradziez = 1; J.odswiezMape(true); };
    // the play missed (the hero elsewhere at 19:40): the theft by itself, the alarm bell
    function kradziezBezBohatera() {
        const s = S();
        if (s.przed.kradziez === 1) return;
        s.przed.kradziez = 1; s.przed.scena = 0;
        T.audio.se("Bell3", { volume: 70, pitch: 70 });
        J.note("notatki.kradziez");
        J.popup(tx("napis.kradziez"), { top: true, color: "#ff8a6b", sub: tx("napis.dzwon") });
        J.odswiezMape(false); J.sprawdz();
    }

    // ==================================================================
    // 5. The ambush at the bell tower and the chase through the lanes (on foot)
    // ==================================================================
    const bieg = { on: false, phase: "", segment: 0, legT: 0, frames: 0, lostT: 0, lost: false, done: false, torch: false, beczki: false, drwi: 0 };
    const odl = e => Math.max(Math.abs(e.x - $gamePlayer.x), Math.abs(e.y - $gamePlayer.y));
    // the ambush: the sołtys and the corporal wait by the tower from 23:30 of day 52 (and stay there through the chase)
    function zasadzkaSpec(on) {
        const z = D.POGON.zasadzka;
        J.api.pogonEv = on ? { 0: { name: tx1("imiona.soltys"), x: z[0] - 2, y: z[1], sheet: "$Npc_Soltys", index: 0, dir: 6, pat: 1, through: false, trigger: 0, say: "zasadzka", note: "" },
            1: { name: tx1("imiona.kapral"), x: z[0] + 2, y: z[1], sheet: "$Npc_Kapral", index: 0, dir: 4, pat: 1, through: false } } : null;
        J.odswiezMape(true);
    }
    const zasadzkaOkno = () => has() && day() === D.DNI.pogon && hour() >= D.GODZ.pogon && S().przed.kradziez === 1 && !S().zasadzka || (has() && day() === D.DNI.pogon + 1 && hour() < D.GODZ.pogonDo && S().przed.kradziez === 1 && !S().zasadzka);
    function zasadzkaRozmowa() {
        const out = [], n = J.sladyN();
        const sp = { id: J.evOf(4880) ? 4880 : -1, name: tx1("imiona.soltys") };
        J.linie(out, sp, n >= D.SLADY_MIN ? "zasadzka.dobrze" : "zasadzka.slabo", { n });
        J.skrypt(out, "Jarmark_Sceny.pogonStart();");
        J.uruchom(null, out);
    }
    function pogonStart() {
        const s = S();
        if (bieg.on || s.zasadzka === 1) return;
        s.zasadzka = 1; s.pogon.faza = 1; s.pogon.upadki = 0; s.pogon.czas = 0; s.pogon.bezFory = J.sladyN() >= D.SLADY_MIN ? 0 : 1;
        J.note("notatki.pogon");
        J.sprawdz();
        $gameScreen.startFadeOut(24);
        setTimeout(() => { try { pogonWejscie(); } catch (e) { report("pogon", e); } }, 500);
    }
    function pogonWejscie() {
        const s = S(), P = D.POGON, st = P.start, sz = P.szept;
        // Szept: the injected event 4882 (through - he slips past people; his route keeps to the lanes)
        J.api.pogonEv = Object.assign({}, J.api.pogonEv || {}, { 2: { name: tx1("imiona.szept"), x: sz[0], y: sz[1], sheet: "$Npc_Jarmark_Szept", index: 0, dir: sz[2] || 2, pat: 1, through: true, free: true, move: true } });
        J.odswiezMape(true);
        Object.assign(bieg, { on: true, phase: "bieg", segment: 0, legT: 0, frames: 0, lostT: 0, lost: false, done: false, beczki: false, drwi: 0 });
        $gamePlayer.locate(st[0], st[1]); $gamePlayer.setDirection(st[2] || 8);
        const e = ev(AK.szeptBieg);
        if (e) { e.setMoveSpeed(s.pogon.bezFory ? P.predkoscBez : P.predkosc); e.locate(sz[0], sz[1]); e.setDirectionFix(false); e.setWalkAnime(true); }
        J.pasy(false);
        // the night chase: the hero carries a torch (every light is fire) - lit for the chase and left burning after it
        bieg.torch = false;
        try { if (window.Torch && !Torch.isLit()) { Torch.light(); bieg.torch = true; } } catch (e) { report("pochodnia", e); }
        $gameScreen.startFadeIn(24);
        if (e && SB() && SB().say) SB().say(e, [].concat(tx(s.pogon.bezFory ? "pogon.szept.biegnie2" : "pogon.szept.biegnie"))[0], 150);
        J.popup(tx("pogon.start"), { top: true, color: "#ffe27a", sub: tx("pogon.startPod") });
        T.audio.se("Run", { volume: 50, pitch: 120 });
    }
    // Szept's next leg: the hero near - at once; the hero still in sight - after 4 s; the hero lost - he waits (and whistles)
    const MAPA = (x, y, d) => { const x2 = $gameMap.roundXWithDirection(x, d), y2 = $gameMap.roundYWithDirection(y, d), o = 10 - d;
        return $gameMap.isValid(x2, y2) && $gameMap.isPassable(x, y, d) && $gameMap.isPassable(x2, y2, o); };
    function szeptDalej(e, d) {
        const s = S(), P = D.POGON;
        if (e.isMoveRouteForcing() || e.isMoving()) { bieg.legT = 0; return; }
        bieg.legT++;
        if (bieg.segment >= P.trasa.length || bieg.frames < 40) return;   // (a breath at the start: the hero sees him slip out)
        if (d > P.zgubiony) return;
        if (d > (s.pogon.bezFory ? P.odleglosc + 3 : P.odleglosc) && bieg.legT < 240) return;
        const t = P.trasa[bieg.segment];
        // the route round the solid things (the stalls, the barrels, the people); people in a narrow lane: by the map alone (he is through)
        e.setThrough(false);
        const r = bfs(e, t[0], t[1]) || bfs(e, t[0], t[1], MAPA);
        e.setThrough(true);
        bieg.segment++; bieg.legT = 0;
        if (!r) { report("pogon", new Error("brak drogi do " + t)); return; }   // (never a jump in sight: the next leg is tried from here)
        e.forceMoveRoute({ list: r.map(dd => ({ code: CODE[dd] })).concat([{ code: 0 }]), repeat: false, skippable: true, wait: false });
        if (bieg.segment === 4 || bieg.segment === 8) {   // (a taunt over his shoulder now and then)
            const k = "pogon.szept.drwi." + (++bieg.drwi);
            if (SB() && SB().say && w.tekstMoze(k)) SB().say(e, [].concat(tx(k))[0], 120);
        }
    }
    // the barrels: tipped over behind him in the one-cell gap (when the hero is not right at it)
    function przeszkoda(e) {
        const pz = D.POGON.przeszkoda;
        if (!pz || bieg.beczki || bieg.segment !== pz.po + 1 || e.x !== pz.x || e.y <= pz.y) return;
        bieg.beczki = true;
        if (Math.max(Math.abs($gamePlayer.x - pz.x), Math.abs($gamePlayer.y - pz.y)) < 2) return;
        J.api.pogonEv = Object.assign({}, J.api.pogonEv || {}, { 3: { name: "Przewrócone beczki", x: pz.x, y: pz.y, sheet: "!Tavern_Yard", index: 0, dir: 8, pat: 0, through: false } });
        J.odswiezMape(true);
        T.audio.se("Crash", { volume: 70, pitch: 90 });
        J.popup(tx("pogon.beczki"), { top: true, color: "#ffe27a" });
    }
    function pogonTick() {
        if (bieg.on && has() && S().zasadzka !== 1) { bieg.on = false; bieg.phase = ""; return; }   // (a stale chase of another game: nothing started it here)
        if (!bieg.on || !has() || mapNow() !== D.MAP.miasto) return;
        const s = S(), e = ev(AK.szeptBieg);
        bieg.frames++;
        if (!bieg.done && bieg.frames % 60 === 0) s.pogon.czas += 1;
        if (bieg.phase === "koniec" || !e || $gameMessage.isBusy()) return;
        const d = odl(e);
        // out of sight for 3 s: the penalty (once a time), Szept waits for him
        if (d > D.POGON.zgubiony) {
            if (++bieg.lostT === 180 && !bieg.lost) {
                bieg.lost = true; s.pogon.upadki++; s.pogon.czas += D.POGON.kara;
                T.audio.se("Whistle1", { volume: 60, pitch: 110 }) || T.audio.se("Bell1", { volume: 40, pitch: 150 });
                J.popup(fill(tx("pogon.zgubiony"), { n: D.POGON.kara }), { top: true, color: "#ff8a6b" });
            }
        } else { bieg.lostT = 0; if (d <= D.POGON.odleglosc) bieg.lost = false; }
        przeszkoda(e);
        // caught: Szept standing (at the end of a leg - the hero on his heels or come by a shortcut - or given up at the end of his
        // route) and the hero beside him; else he runs on
        const stoi = !e.isMoveRouteForcing() && !e.isMoving(), meta = bieg.segment >= D.POGON.trasa.length;
        if (stoi && bieg.frames > 40 && d <= (meta ? 2 : 1)) { pogonKoniec(); return; }
        szeptDalej(e, d);
    }
    function pogonKoniec() {
        const s = S(), out = [], hero = HERO(), sp = { id: AK.szeptBieg, name: tx1("imiona.szept") }, e = ev(AK.szeptBieg);
        bieg.phase = "koniec"; bieg.done = true;
        s.pogon.koniec = 1;
        if (e) { e.turnTowardCharacter($gamePlayer); $gamePlayer.turnTowardCharacter(e); }
        J.linie(out, hero, "pogon.meta.1");
        J.linie(out, sp, "pogon.meta.2");
        J.linie(out, sp, "pogon.meta.3");
        J.wybor(out, [tx1("pogon.opcja.kapral"), tx1("pogon.opcja.wolny"), tx1("pogon.opcja.swiadek")], [
            J.bran(hero, "pogon.kapral", null, "Jarmark_Sceny.szeptLos('kapral')"), J.bran(hero, "pogon.wolny", null, "Jarmark_Sceny.szeptLos('wolny')"),
            J.bran(sp, "pogon.swiadek", null, "Jarmark_Sceny.szeptLos('swiadek')")], 2);
        J.skrypt(out, "Jarmark_Sceny.pogonZejscie();");
        J.pasy(true);
        J.uruchom(null, out);
    }
    function szeptLos(k) {
        const s = S();
        s.szept = k; w.vgive("srebrny_kruk", 1);
        if (k === "swiadek") w.vgive("bilet_ferry", 1);
        T.audio.se("Item3", { volume: 70 });
        J.popup(tx("pogon.kruk"), { top: true, color: "#ffe27a", sub: tx("pogon.krukPod") });
    }
    // after the choice: a short dark (the corporal comes for Szept, or Szept goes) - the hero stays where he is
    function pogonZejscie() {
        J.pasy(false);
        $gameScreen.startFadeOut(24);
        setTimeout(() => {
            try {
                bieg.on = false; bieg.phase = ""; bieg.torch = false;   // (the torch stays in his hand: it burns down by itself)
                J.api.pogonEv = null; J.odswiezMape(true);
                $gameScreen.startFadeIn(24);
                J.note("notatki.pogonKoniec");
                J.popup(fill(tx("pogon.koniec"), { c: S().pogon.czas, u: S().pogon.upadki }), { top: true, color: "#ffe27a", sub: tx("pogon.koniecPod") });
                J.sprawdz();
            } catch (e) { report("zejscie", e); }
        }, 600);
    }
    // (during the chase the action button does nothing: a torch in the hand must not open its "stick it in the ground" menu, nobody is talked to)
    const _tba = Game_Player.prototype.triggerButtonAction;
    Game_Player.prototype.triggerButtonAction = function() { if (bieg.on) return false; return _tba.call(this); };

    // ==================================================================
    // 6. The morning of day 53: the decisions, the closing
    // ==================================================================
    // the sołtys at the town hall (8-18) after the chase: what to do with Marcel
    function ranoOkno() { return has() && S().pogon.koniec === 1 && !S().koniec && !S().marcel && day() === D.DNI.rozstrzygniecie && hour() >= 6 && hour() < D.GODZ.zamkniecie; }
    function ranoRozmowa() {
        const s = S(), out = [], hero = HERO(), sp = { id: -1, name: tx1("imiona.soltys") }, n = J.sladyN();
        J.linie(out, sp, "rano.start", { n });
        J.wybor(out, [tx1("rano.opcja.oskarz"), tx1("rano.opcja.szantaz"), tx1("rano.opcja.puscic")], [
            J.bran(hero, n >= D.SLADY_MIN && s.szept === "swiadek" ? "rano.oskarz" : "rano.oskarzSlabo", null, "Jarmark_Sceny.marcelLos('oskarz')"),
            J.bran(hero, "rano.szantaz", null, "Jarmark_Sceny.marcelLos('szantaz')"), J.bran(hero, "rano.puscic", null, "Jarmark_Sceny.marcelLos('puscic')")], 2);
        return out;
    }
    function marcelLos(k) { S().marcel = k; J.note("notatki.rano"); J.sprawdz(); }
    function jak() {
        const s = S(), n = J.sladyN();
        if (s.marcel === "szantaz") return "D";
        if (s.marcel === "oskarz" && n >= D.SLADY_MIN && s.szept === "swiadek") return "A";
        if (s.szept === "wolny") return "C";
        return "B";
    }
    function rozstrzygnij(bezSceny) {
        const s = S();
        if (s.koniec) return;
        if (!s.marcel) s.marcel = "puscic";
        const how = jak();
        J.koniec(how);
        s.zamkniecie = 1;
        if (!bezSceny) return how;
        return how;
    }
    function zamkniecie() {
        const s = S();
        if (!s.marcel) s.marcel = "puscic";
        const how = jak();
        J.api.crowd = true; J.odswiezMape(true);
        const steps = [
            { fn: () => { J.heroNa(...D.SCENA.hero.zamkniecie); pochodSpec(true, true); }, wait: 20 },
            { say: ["lord", "zamk.lord", 200], wait: 190 },
            { say: ["soltys", "zamk.soltys." + how, 200], wait: 190 },
            { say: ["ambrozy", "zamk.ambrozy", 150], se: ["Bell3", 80, 90], wait: 120 },
            { fn: () => { T.audio.se("Applause1", { volume: 70 }); }, say: ["pimpek", "zamk.pimpek", 150], emo: ["pimpek", 1], wait: 110 },
            { say: ["ofelia", "zamk.ofelia." + (how === "A" ? "A" : "inne"), 170], wait: 150 },
            { fn: () => { J.koniec(how); S().zamkniecie = 1; pochodSpec(false); J.api.crowd = false; J.odswiezMape(true); J.popup(tx("zamk.napis." + how), { top: true, color: "#ffe27a", sub: tx("zamk.napisPod") }); }, wait: 60 }
        ];
        if (!graj("zamkniecie", steps)) { J.api.crowd = false; return false; }
        return true;
    }
    KONIEC.zamkniecie = () => { J.api.crowd = false; if (!S().koniec) rozstrzygnij(true); S().zamkniecie = 1; J.odswiezMape(true); };

    // ==================================================================
    // 7. The clock of the scenes (called by Jarmark.zegar, and every half second on the map)
    // ==================================================================
    function zegar() {
        if (!has()) return;
        const s = S(), d = day(), h = hour();
        if (mapNow() !== D.MAP.miasto) {
            // the play at 19:40 without the hero: the theft by itself
            if (d === D.DNI.sztuka && h >= D.GODZ.sztukaKoniec && s.przed.kradziez !== 1) kradziezBezBohatera();
            if (d > D.DNI.sztuka && s.przed.kradziez !== 1) kradziezBezBohatera();
            return;
        }
        if (d === D.DNI.sztuka && h >= D.GODZ.sztukaKoniec && s.przed.kradziez !== 1 && !scena.on) kradziezBezBohatera();
    }
    let ticker = 0;
    function tick() {
        if (!has() || J.api.noTick) return;
        pogonTick();
        if (++ticker % 30) return;
        // a scene whose interpreter is gone (a new game, a load in the middle of it): the flag does not stay
        if (scena.on && !$gameMap.isEventRunning()) { if (++scena.stale > 3) { scena.on = false; scena.stale = 0; scena.steps = []; J.pasy(false); J.api.crowd = false; pochodSpec(false); } } else scena.stale = 0;
        if (day() >= D.DNI.rozstrzygniecie && !S().koniec && S().przed.kradziez === 1 && !zajete()) J.zegar();   // (noon of the last day: the closing even when no hour struck on the map)
        if (!spokojnie() || mapNow() !== D.MAP.miasto) return;
        const s = S(), d = day(), h = hour();
        const blisko = r => Math.abs($gamePlayer.x - D.SCENA.x) <= r && Math.abs($gamePlayer.y - D.SCENA.y) <= r;   // (round the stage)
        if (d === D.DNI.otwarcie && h >= D.GODZ.otwarcie && h < 15.5 && !s.otw && blisko(22)) { otwarcie(); return; }
        if (d === D.DNI.sztuka && h >= D.GODZ.sztuka && h < D.GODZ.sztukaKoniec && s.przed.kradziez !== 1 && s.z !== 0 && blisko(20)) { sztuka(); return; }
        if (d === D.DNI.rozstrzygniecie && h >= 11.8 && h < 12.3 && !s.zamkniecie && s.pogon.koniec === 1 && !s.koniec && blisko(24)) { zamkniecie(); return; }
        // the ambush by the tower (the places are shown from 23:30; killed at 0:30)
        const zo = zasadzkaOkno();
        if (zo && !J.api.pogonEv && !bieg.on) zasadzkaSpec(true);
        if (!zo && J.api.pogonEv && J.api.pogonEv[0] && !bieg.on) { zasadzkaSpec(false); if (s.przed.kradziez === 1 && !s.zasadzka && day() === D.DNI.pogon + 1) { s.pogon.koniec = 3; J.popup(tx("pogon.uciekl"), { top: true, color: "#ff8a6b" }); J.sprawdz(); } }
    }
    T.on("load", () => { scena.on = false; scena.skip = false; bieg.on = false; bieg.phase = ""; }, { owner: PLUGIN });
    T.onMapUpdate(() => { try { tick(); } catch (e) { report("tick", e); } });

    // the night of the ambush (day 52 after the theft): the watch guards the town - Morze.js sends nothing in from the sea that night
    const nocStrzezona = n => has() && n === D.DNI.pogon && S().przed.kradziez === 1 && !S().koniec && !J.zamkniety();
    // the sołtys at the ambush: the talk through the event's script (Jarmark.dotknij(…"zasadzka"))
    const _dotknij = J.dotknij;
    J.dotknij = function(interp, what, key) {
        if (!what) { const sp = J.spec(interp.eventId()); if (sp && sp.say === "zasadzka") return zasadzkaRozmowa(); }
        if (what === "zasadzka") return zasadzkaRozmowa();
        return _dotknij(interp, what, key);
    };
    // the sołtys's morning talk (a takeover of his talk first when there is a decision to make)
    T.talk.takeover({ owner: PLUGIN, who: "soltys", name: "rano", priority: T.talk.PRIORITY.errand, run: () => {
        try { return ranoOkno() ? ranoRozmowa() : null; } catch (e) { report("rano", e); return null; } } });

    // ==================================================================
    // 8. The lanterns lit (J4: "the lit town"): a short scene when the eighth is hung - only a notice (no walk-away of the hero)
    // ==================================================================
    function zapalone() { J.popup(tx("napis.zapalone"), { top: true, color: "#ffe27a", sub: tx("napis.zapalonePod") }); T.audio.se("Item2", { volume: 60, pitch: 120 }); }

    window.Jarmark_Sceny = T.register(PLUGIN, { krok, czekajChod, koniecSceny, otwarcie, sztuka, zamkniecie, pogonStart, pogonZejscie, szeptLos, marcelLos, rozstrzygnij, jak, zegar, zajete, zapalone,
        zasadzkaRozmowa, ranoRozmowa, bieg, scena, pogonTick, kradziezBezBohatera, graj, pochodSpec, zasadzkaSpec, zasadzkaOkno, przeszkoda, nocStrzezona, AK });
})();
