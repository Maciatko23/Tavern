//=============================================================================
// Karczma_Noc.js
//=============================================================================
// The tavern's night (2026-11-16; the user, asked whether Borgar should sleep in his new room: "reszte uzgodnij sam byle dobrze"):
//   - Borgar keeps the bar all night (rooms and food at any hour - the hero comes in late), but from 2 to 6 he dozes behind it: a
//     "Zzz" over him and a word through his sleep when the hero stands near; spoken to (him or the counter) he wakes - a sleepy word
//     first, then his usual talk. His room upstairs is where he keeps his book and sleeps by day when the hall is empty.
//   - Wanda, the bath's attendant (Map025), sleeps 22-6 in the servants' room: her event is away then (the bath is shut - she is the
//     one who runs it). Changed only when she is not on the screen: nobody vanishes in sight.
//   - the servants' room (its door on floor I) is shut 22-6: Wanda, Jagna, Zośka and Jadzia the cook sleep there.
// Nothing of a map file changes: the events are found by name.

/*:
 * @target MZ
 * @plugindesc Noc w tawernie: Borgar drzemie za ladą (2-6, budzi się zagadnięty), łaźnia nieczynna 22-6 (Wanda śpi), izba służby zamknięta nocą. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @orderAfter Pokojowka
 *
 * @help
 * Karczma_Noc.js - noc w tawernie
 *   Borgar 2:00-6:00 drzemie za ladą: nad nim „Zzz”, przez sen mruczy, gdy
 *   bohater stoi blisko; zagadnięty budzi się i obsługuje jak zawsze.
 *   Łaziebna Wanda 22:00-6:00 śpi w izbie służby (łaźnia nieczynna).
 *   Izba służby 22:00-6:00 zamknięta: „Służba śpi”.
 *   Teksty: js/teksty/karczma_noc.txt.
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T || !window.Watki) throw new Error("Karczma_Noc.js: brak TawernaCore.js / Watki.js - muszą być wyżej na liście wtyczek");
    const PLUGIN = "Karczma_Noc";
    const TK = Watki.teksty("karczma_noc");
    const HALL = 1, FLOOR1 = 25;
    const DOZE = [2, 6], BATH_SHUT = [22, 6], ROOM_SHUT = [22, 6];
    const ZZZ = 10;   // (the engine's balloon: Zzz)
    const hour = () => ($gameSystem && typeof $gameSystem.dayNightHour === "function" ? $gameSystem.dayNightHour() : T.time.hour());
    const within = (h, a) => (a[0] <= a[1] ? h >= a[0] && h < a[1] : h >= a[0] || h < a[1]);
    const pick = a => a[Math.floor(Math.random() * a.length)];
    // (a dotted key of the words is a path: [borgar.budzi] is TK.borgar.budzi)
    const tekst = k => String(k).split(".").reduce((o, p) => (o && typeof o === "object" ? o[p] : undefined), TK);
    const lines = k => { const v = tekst(k); return Array.isArray(v) ? v : v && typeof v === "object" ? Object.values(v) : v ? [v] : []; };
    const report = (where, e) => console.error("[Karczma_Noc] " + where + ":", e);
    const nameOf = ev => String(((ev && ev.event && ev.event()) || {}).name || "");
    const find = re => ($gameMap ? $gameMap.events().find(e => re.test(nameOf(e))) || null : null);
    const borgar = () => ($gameMap && $gameMap.mapId() === HALL ? find(/^Borgar\b/) : null);
    const wanda = () => ($gameMap && $gameMap.mapId() === FLOOR1 ? find(/Łaziebn|^Wanda/i) : null);
    const SB = () => T.api("SpeechBubbles");
    const onScreen = ev => { const x = ev.screenX(), y = ev.screenY(); return x > -48 && y > -48 && x < Graphics.width + 48 && y < Graphics.height + 96; };
    const dozing = () => within(hour(), DOZE);

    // ------------------------------------------------------------------ Borgar dozes (2-6)
    let nextZ = 0, nextMumble = 0;
    function borgarTick() {
        const b = borgar();
        if (!b || !dozing() || $gameMap.isEventRunning() || $gameMessage.isBusy()) return;
        const near = Math.hypot(b.x - $gamePlayer.x, b.y - $gamePlayer.y);
        if (near > 12) return;
        const now = Graphics.frameCount;
        if (now >= nextZ) { $gameTemp.requestBalloon(b, ZZZ); nextZ = now + 420 + Math.floor(Math.random() * 240); }
        if (near <= 4 && now >= nextMumble && SB() && SB().say) { SB().say(b, pick(lines("borgar.chrapie")), 150); nextMumble = now + 1500 + Math.floor(Math.random() * 900); }
    }
    // spoken to while he dozes: he wakes first (a word over him), then the talk goes on as always (the start is never taken)
    let wokeAt = -9999;
    T.onEventStart(ev => {
        try {
            if (!$gameMap || $gameMap.mapId() !== HALL || !dozing()) return false;
            const n = nameOf(ev);
            if (!/^Borgar\b|^Lada\b/.test(n)) return false;
            const b = borgar();
            if (b && Graphics.frameCount - wokeAt > 600) {
                wokeAt = Graphics.frameCount;
                $gameTemp.requestBalloon(b, 1);
                if (SB() && SB().say) SB().say(b, pick(lines("borgar.budzi")), 170);
                nextZ = Graphics.frameCount + 1800;   // (awake a while after a talk)
            }
        } catch (e) { report("budzi", e); }
        return false;
    }, { owner: PLUGIN, name: "budzi", priority: T.onEventStart.PRIORITY.before });   // (each gate its own name: one owner's gates with one name replace each other)

    // ------------------------------------------------------------------ Wanda sleeps (22-6): the bath shut
    function wandaApply(force) {
        const w = wanda();
        if (!w) return;
        const away = within(hour(), BATH_SHUT);
        if (!!w._kNocAway === away) return;
        if (!force && onScreen(w) && !w.isTransparent()) return;   // (in sight: she stays till the hero looks away)
        if (!force && away === false && onScreen(w)) return;       // (nor does she pop in before his eyes)
        w._kNocAway = away;
        if (away) { w._kNocTrigger = w._trigger; w.setTransparent(true); w.setThrough(true); w._trigger = -1; }
        else { w.setTransparent(false); w.setThrough(false); if (w._kNocTrigger !== undefined) w._trigger = w._kNocTrigger; }
    }
    T.onEventStart(ev => !!ev._kNocAway, { owner: PLUGIN, name: "wanda", priority: T.onEventStart.PRIORITY.hidden });

    // ------------------------------------------------------------------ the servants' room shut (22-6)
    T.onEventStart(ev => {
        try {
            if (!$gameMap || $gameMap.mapId() !== FLOOR1 || !within(hour(), ROOM_SHUT)) return false;
            if (!/^Wejście -> Izba służby/.test(nameOf(ev))) return false;
            T.popup(tekst("izba.zamknieta") || "Służba śpi.", { kind: "info" });
            return true;
        } catch (e) { report("izba", e); return false; }
    }, { owner: PLUGIN, name: "izba", priority: T.onEventStart.PRIORITY.instead });

    // ------------------------------------------------------------------ the clock
    let tick = 0;
    T.onMapUpdate(() => {
        try {
            if (!$gameMap) return;
            borgarTick();
            if (++tick % 30 === 0) wandaApply(false);
        } catch (e) { report("tick", e); }
    }, { owner: PLUGIN, name: "night" });
    T.on("mapReady", () => { try { wandaApply(true); } catch (e) { report("mapa", e); } }, { owner: PLUGIN });

    window.Karczma_Noc = T.register(PLUGIN, { dozing, wandaApply, borgar, wanda, DOZE, BATH_SHUT, ROOM_SHUT });
})();
