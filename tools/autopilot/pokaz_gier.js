// The games room shown by the autopilot (2026-11-19, the player: "najpierw na autopilocie pokaż mi, jak gracz gra w te gry, może mu
// dodać jakieś pieniądze na start"). Injected over CDP by tools/autopilot/ogladaj.js --gry after tests/autopilot/ap.js - NOT a game
// plugin. On the map it walks like a player (AP.lib: the real keys): to the darts line, the dice table, Grum's arm-wrestling table;
// O, the talk's choices by the arrows; in the games' own scenes the "hands" are the games' test hooks, made a little human:
//   darts (TavernLife.onTick): throws when the swaying sight is near the bull - nearer or farther each dart, so the scores differ;
//   dice (TavernDice.onTick): the lobby by the arrows and O (the rival, the stake, "Graj"), the hero's turns by the game's own steady
//     player (opts.auto), Esc at the end;
//   arm wrestling (TavernLife.onTick): holds O to keep the needle in the green field, a little late now and then.
// What it is doing is said at the top of the screen (Tawerna.popup top) and by POKAZ.status() for the launcher's console.
(function() {
    if (!window.AP || !AP.lib || !AP.TASKS) return "brak autopilota (ap.js)";
    const L = AP.lib;
    const P = window.POKAZ = { doing: "", done: false, step: 0 };
    const hour = () => ($gameSystem.dayNightHour ? $gameSystem.dayNightHour() : 12);
    const clock = () => { const h = hour(); return Math.floor(h) + ":" + String(Math.floor((h % 1) * 60)).padStart(2, "0"); };
    P.status = () => ({ doing: P.doing, day: $gameSystem.dayNightDay ? $gameSystem.dayNightDay() : 0, clock: clock(), gold: $gameParty.gold(), done: P.done, paused: false, stuck: null });
    const tell = (text, sub) => { P.doing = text; if (window.Tawerna && Tawerna.popup) Tawerna.popup(text, { top: true, color: "key", sub: sub || "" }); };
    const coins = n => (window.Monety && Monety.krotko ? Monety.krotko(n) : n + " G");

    // ---- a talk on the map: O through the lines, the choices by the arrows (picks: label prefixes, "a|b" = the first one there)
    function* talk(picks, max) {
        picks = (picks || []).slice();
        let calm = 0;
        for (let n = 0; n < (max || 60 * 40); n++) {
            const sc = SceneManager._scene;
            if (!(sc instanceof Scene_Map)) { calm = 0; yield; continue; }
            const cw = sc._choiceListWindow;
            if ($gameMessage.isChoice() && cw && cw.active && cw.isOpen()) {
                const labels = $gameMessage.choices().slice(), want = (picks.shift() || "").split("|");
                let i = labels.findIndex(l => want.some(w => w && l.indexOf(w) === 0));
                if (i < 0) i = labels.length - 1;
                yield* L.wait(30);
                for (let g = 0; g < 20 && cw.index() !== i; g++) { yield* L.press(cw.index() < i ? "down" : "up"); yield* L.wait(8); }
                yield* L.wait(20);
                yield* L.press("ok");
                calm = 0;
                continue;
            }
            if ($gameMessage.isBusy()) { yield* L.wait(40); yield* L.press("ok"); calm = 0; continue; }
            if ($gameMap.isEventRunning()) { calm = 0; yield; continue; }
            if (++calm > 40) return true;
            yield;
        }
        return false;
    }

    // ---- the games' hands
    let tick = 0;
    const press = (I, k, every) => { if (tick % (every || 12) === 0) I[k] = true; };
    function dartsHand(scene) {
        const I = Input._currentState, s = scene.state();
        I.ok = false; I.left = false; I.right = false; I.up = false; I.down = false;
        tick++;
        if (s.phase === "card") { press(I, "ok", 40); return; }
        if (s.phase === "summary") { if (scene.phaseT > 150) press(I, "ok", 20); return; }
        if (s.phase !== "aim") return;
        const dartKey = s.round + "/" + s.turn + "/" + s.dart;
        if (scene._pokazDart !== dartKey) { scene._pokazDart = dartKey; scene._pokazNeed = 4 + Math.random() * 22; }   // (each dart its own steadiness)
        const d = Math.hypot(s.cross.x - s.centre.x, s.cross.y - s.centre.y);
        if (scene.phaseT > 20 && (d < scene._pokazNeed || scene.phaseT > 300)) I.ok = true;
    }
    function armHand(scene) {
        const I = Input._currentState, s = scene.state();
        I.ok = false;
        tick++;
        if (s.phase === "card") { press(I, "ok", 40); return; }
        if (s.phase === "summary") { if (scene.phaseT > 150) press(I, "ok", 20); return; }
        if (s.phase === "pull") I.ok = s.n < (s.lo + s.hi) / 2 - 0.015 + (Math.random() - 0.5) * 0.05;
    }
    let diceWant = { key: "grum", stake: 10 };
    function diceHand(scene) {
        const I = Input._currentState, st = window.TavernDice && TavernDice.state ? TavernDice.state() : null;
        for (const k of ["ok", "left", "right", "up", "down", "escape"]) I[k] = false;
        tick++;
        if (!st) return;
        if (st.phase === "rules") { if (scene.phaseT > 90) press(I, "ok", 20); return; }
        if (st.phase === "lobby" && st.lobby) {
            const Lb = st.lobby, cards = Lb.cards || [];
            const pick = cards.findIndex(c => c.key === diceWant.key && !c.tired && c.afford) >= 0 ? cards.findIndex(c => c.key === diceWant.key) : cards.findIndex(c => !c.tired && c.afford);
            if (Lb.row === "cards") { if (Lb.sel !== pick) press(I, Lb.sel < pick ? "right" : "left", 24); else press(I, "ok", 30); }
            else if (Lb.row === "stake") { if (Lb.stake !== diceWant.stake) press(I, "right", 24); else press(I, "ok", 30); }
            else if (Lb.row === "dice") press(I, "down", 24);
            else if (Lb.row === "buttons") { if (Lb.btn !== 1) press(I, "right", 24); else { scene.opts.auto = "steady"; press(I, "ok", 30); } }
            return;
        }
        if (st.phase === "end") { if (scene.phaseT > 180) press(I, "escape", 20); return; }
    }

    // ---- the show, as a task of the autopilot (one step a map frame; the games' scenes pause it till the map is back)
    AP.TASKS.pokazGier = function* () {
        yield* L.wait(30);
        if ($gameParty.gold() < 60) $gameParty.gainGold(60 - $gameParty.gold());
        if ($gameSystem.setDayNightHour) $gameSystem.setDayNightHour(19);
        if ($gameSystem.setStamina) $gameSystem.setStamina(100);
        $gameSystem._minimapHidden = true;
        tell("Pokaz gier: na start " + coins($gameParty.gold()) + " w sakiewce", "rzutki, kości, siłowanie na rękę - stawki 5 m albo 1 sr");
        yield* L.wait(150);
        if (window.TavernLife) TavernLife.onTick = null;

        // 1. darts: onto the oak line before the board, O, the opponent, the stake
        P.step = 1;
        tell("Idę do rzutek", "staję na dębowej listwie przed tarczą");
        yield* L.walkTo(30, 35);
        $gamePlayer.setDirection(8);
        yield* L.wait(70);
        TavernLife.onTick = dartsHand;
        tell("Rzutki: wybieram rywala i stawkę 5 miedziaków");
        yield* L.press("ok");
        yield* talk(["Z Dziadkiem Ozzym|Z furmanem Wieśkiem", "Stawka 5"]);
        TavernLife.onTick = null;
        yield* talk([]);
        tell("Po rzutkach w sakiewce: " + coins($gameParty.gold()));
        yield* L.wait(150);

        // 2. dice: the chair by the dice table, O, the lobby (Grum, 1 srebrnik, "Graj"), the game, Esc
        P.step = 2;
        tell("Idę do stołu z kośćmi", "przy stole pojawia się „O – Zagraj w kości”");
        yield* L.walkTo(36, 33);
        $gamePlayer.setDirection(8);
        yield* L.wait(70);
        diceWant = { key: "grum", stake: 10 };
        TavernDice.onTick = diceHand;
        tell("Kości: Grum, stawka 1 srebrnik");
        yield* L.press("ok");
        yield* L.wait(60);
        for (let n = 0; n < 60 * 60 * 5 && !(SceneManager._scene instanceof Scene_Map && !SceneManager.isSceneChanging() && !$gameMap.isEventRunning()); n++) yield;
        TavernDice.onTick = null;
        yield* talk([]);
        tell("Po kościach w sakiewce: " + coins($gameParty.gold()));
        yield* L.wait(150);

        // 3. arm wrestling with Grum at his table: O, the stake
        P.step = 3;
        tell("Idę do stołu Gruma na siłowanie", "przy stole pojawia się „O – Siłuj się na rękę”");
        yield* L.walkTo(42, 33);
        $gamePlayer.setDirection(8);
        yield* L.wait(70);
        TavernLife.onTick = armHand;
        tell("Siłowanie: stawka 5 miedziaków");
        yield* L.press("ok");
        yield* talk(["Stawka 5"]);
        TavernLife.onTick = null;
        yield* talk([]);
        tell("Koniec pokazu - w sakiewce " + coins($gameParty.gold()), "Esc zamyka okno");
        P.done = true;
        return true;
    };
    P.start = () => { AP.stop(); AP.run([["pokazGier"]]); return "ok"; };
    return "ok";
})();
