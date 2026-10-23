//=============================================================================
// Krawedzie.js
//=============================================================================
// (2026-10-22, the user: "gdziekolwiek gracz nie dotknie ściany mapy, przejdzie na następną (jeśli jest), a nie tylko na ścieżce") - walking
// into a map's edge anywhere takes the hero to the next map, without transfer events along the whole edge. A side is open when the map
// already has a transfer event on it whose page is active now (its 201 command, a fixed place): so every gate stays as it is (the field
// shut by the Lord - Homes.js refuses the transfer, the island's places opened by the story, the Orla Grań path...). The arrival keeps his
// place along the edge, by the offset of the nearest such event (its own spot -> its target), and after the map loads he is moved to the
// nearest tile he can stand on, if that one is blocked.
// Not while an event runs, in build mode, in the eagle's flight (Orzel_Lot crosses the edges itself) or on a map with <EdgeWalk:off>.
// A transfer behind a condition in its event (a branch: Wrak's sandbar open only when the garrison is ready) is not taken out of it:
// the event itself is started, as if he walked into it (its refusal and its popup stay).

/*:
 * @target MZ
 * @plugindesc Przejścia na całej krawędzi mapy: dojście do brzegu mapy w dowolnym miejscu przenosi na sąsiednią mapę (gdy ta strona ma przejście). v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter FreeMovement
 * @orderAfter Homes
 * @orderAfter Orzel_Lot
 *
 * @help
 * ============================================================================
 * Krawedzie.js - przejścia na całej krawędzi mapy
 * ============================================================================
 * Gdy bohater dojdzie do brzegu mapy w dowolnym miejscu i dalej idzie w tę
 * stronę (ok. 1/10 sekundy), przechodzi na sąsiednią mapę - bez zdarzeń
 * wzdłuż całej krawędzi.
 * Sąsiada wskazują istniejące przejścia na tej krawędzi (zdarzenie z
 * poleceniem „Przenieś gracza” na brzegu mapy, z aktywną stroną). Bez
 * takiego przejścia - albo gdy jest zamknięte warunkiem - nic się nie
 * dzieje. Blokady innych wtyczek (np. działka zajęta przez Lorda) działają.
 * Przejście ukryte w warunku zdarzenia (np. łacha Wraku: tylko gdy garnizon
 * gotowy) uruchamia samo zdarzenie - jego odmowa i dymek zostają.
 * Na nowej mapie bohater staje w tym samym miejscu wzdłuż krawędzi
 * (przesunięcie z najbliższego przejścia), a gdy tam nie da się stać -
 * na najbliższym wolnym polu.
 * Notatka mapy <EdgeWalk:off> wyłącza to na tej mapie.
 * ============================================================================
 */

(() => {
    "use strict";
    const PLUGIN = "Krawedzie";
    const T = window.Tawerna;
    if (!T || T.api(PLUGIN)) return;

    const HOLD = 6;          // frames of pushing into the edge before the transfer
    const NEAR = 0.3;        // how close to the outermost tile's middle counts as "at the edge" (tiles)
    const SNAP_R = 10;       // the arrival: the farthest a blocked spot is moved to a free one (tiles)

    let hold = { side: null, n: 0 }, cool = 0;
    let pending = null;      // { mapId, x, y, side } - set before the transfer, used after the map loads

    const flying = () => !!(window.OrzelLot && OrzelLot.flying && OrzelLot.flying());
    const off = () => /<EdgeWalk:off>/i.test(String(($dataMap && $dataMap.note) || ""));

    // the side he pushes into, standing at the map's edge (null: none)
    function pushedSide() {
        const p = $gamePlayer, W = $gameMap.width(), H = $gameMap.height();
        const v = p.freeInput ? p.freeInput() : (() => { const d = Input.dir4; return d ? [d === 6 ? 1 : d === 4 ? -1 : 0, d === 2 ? 1 : d === 8 ? -1 : 0] : null; })();
        if (!v) return null;
        const [vx, vy] = v;
        if (vx < -0.3 && p._realX <= NEAR) return "W";
        if (vx > 0.3 && p._realX >= W - 1 - NEAR) return "E";
        if (vy < -0.3 && p._realY <= NEAR) return "N";
        if (vy > 0.3 && p._realY >= H - 1 - NEAR) return "S";
        return null;
    }
    const onSide = (e, side, W, H) => side === "W" ? e.x === 0 : side === "E" ? e.x === W - 1 : side === "N" ? e.y === 0 : e.y === H - 1;
    // the active edge transfers on this side: [{ ev, cmd: [designation, mapId, x, y, dir, fade] }]
    function exitsOn(side) {
        const W = $gameMap.width(), H = $gameMap.height(), out = [];
        for (const ev of $gameMap.events()) {
            if (!ev || ev._erased || !onSide(ev, side, W, H)) continue;
            const page = ev.page && ev.page();
            if (!page || !page.list) continue;
            const c = page.list.find(cmd => cmd.code === 201 && cmd.parameters && cmd.parameters[0] === 0);
            if (c && c.parameters[1] !== $gameMap.mapId()) out.push({ ev, cmd: c.parameters, gated: (c.indent || 0) > 0 });
        }
        return out;
    }
    function go(side) {
        const p = $gamePlayer, list = exitsOn(side);
        if (!list.length) return false;
        const along = side === "W" || side === "E" ? p.y : p.x;
        list.sort((a, b) => Math.abs((side === "W" || side === "E" ? a.ev.y : a.ev.x) - along) - Math.abs((side === "W" || side === "E" ? b.ev.y : b.ev.x) - along));
        const { ev, cmd, gated } = list[0];
        // (2026-10-23) the transfer inside a branch of its event (Wrak's sandbar: "if Wyspa.isReady(162) - over, else a popup"): the
        // event decides, as if he walked into it - it used to be taken out of the branch, so he went onto a map not ready yet
        if (gated) { if (!ev.isStarting() && !$gameMap.isEventRunning()) ev.start(); return true; }
        const [, mapId, cx, cy, dir, fade] = cmd;
        const x = side === "W" || side === "E" ? cx : cx + (p.x - ev.x);
        const y = side === "W" || side === "E" ? cy + (p.y - ev.y) : cy;
        pending = { mapId, x, y, side };
        p.reserveTransfer(mapId, Math.max(0, x), Math.max(0, y), dir || p.direction(), fade === undefined ? 0 : fade);
        if (!p.isTransferring()) { pending = null; return false; }   // (refused - Homes.js: the field shut)
        return true;
    }
    T.onMapUpdate(() => {
        if (cool > 0) cool--;
        if (cool > 0 || !$gamePlayer || $gamePlayer.isTransferring() || $gameMap.isEventRunning() || $gameMessage.isBusy() || !$gamePlayer.canMove()
            || ($gameTemp && $gameTemp._buildMode) || flying() || off()) { hold = { side: null, n: 0 }; return; }
        const side = pushedSide();
        if (!side) { hold = { side: null, n: 0 }; return; }
        if (hold.side !== side) hold = { side, n: 0 };
        if (++hold.n < HOLD) return;
        hold = { side: null, n: 0 };
        cool = 45;   // (refused, or no way on this side: not again at once)
        go(side);
    }, { owner: PLUGIN, name: "edge" });

    // after the map loads: on the map, and on a tile he can stand on (the nearest free one, the arrival edge's side first)
    function free(x, y) {
        if (!$gameMap.isValid(x, y)) return false;
        if (![2, 4, 6, 8].some(d => $gameMap.isPassable(x, y, d))) return false;
        return !$gameMap.eventsXyNt(x, y).some(e => e.isNormalPriority());
    }
    function snap() {
        const s = pending;
        pending = null;
        if (!s || $gameMap.mapId() !== s.mapId) return;
        const W = $gameMap.width(), H = $gameMap.height();
        let x = Math.min(W - 1, Math.max(0, s.x)), y = Math.min(H - 1, Math.max(0, s.y));
        if (!free(x, y)) {
            let best = null, bd = 1e9;
            for (let dy = -SNAP_R; dy <= SNAP_R; dy++) for (let dx = -SNAP_R; dx <= SNAP_R; dx++) {
                const nx = x + dx, ny = y + dy;
                if (!free(nx, ny)) continue;
                // (along the arrival edge costs less than going inland)
                const inland = s.side === "W" || s.side === "E" ? Math.abs(dx) : Math.abs(dy);
                const d = Math.hypot(dx, dy) + inland * 0.5;
                if (d < bd) { bd = d; best = [nx, ny]; }
            }
            if (best) [x, y] = best;
        }
        if (x !== $gamePlayer.x || y !== $gamePlayer.y) $gamePlayer.locate(x, y);
    }
    T.on("mapReady", () => { if (pending) snap(); }, { owner: PLUGIN });

    window.Krawedzie = T.register(PLUGIN, { pushedSide, exitsOn, go, snap, pending: () => pending, HOLD });
})();
