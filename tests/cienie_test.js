// Cienie.js: sun shadows of buildings made of tiles, of the player's buildings and of standing "!" events (props); none at night / indoors.
//   node tests/run.js cienie_test
"use strict";
const kit = require("./lib/kit.js");
kit.test({ port: Number(process.env.CDP_PORT) || 9505, lightGpu: true, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 300000 }, async t => {
    t.check("wtyczka wczytana", await t.json("!!window.Cienie && !!Cienie.opts"));
    const NOCLOUDS = "(function(){ const sp = SceneManager._scene._spriteset; if (sp._cloudSprites) { for (const c of sp._cloudSprites) if (c.parent) c.parent.removeChild(c); sp._cloudSprites.length = 0; } return 0; })()";
    const BAD = "^!\\\\$?(Fantasy_door|Roof_Windows|Fantasy_chimney)";
    // what lies in the sun layer now, by part
    const layerInfo = `(() => { const set = SceneManager._scene._spriteset, layer = set._tilemap._sunShadowLayer, st = set._cienie, root = layer && layer._cienRoot;
        const vis = p => p ? p.list.filter(e => e.spr.visible && e.spr.renderable && root && e.spr.parent && e.spr.parent.parent === root).length : 0;
        const props = set._characterSprites.filter(s => s._cienShadow && s._cienShadow.visible && s._cienShadow.renderable && root && s._cienShadow.parent === root.props);
        return { layer: !!layer, layerVisible: !!layer && layer.visible, rootFirst: !!root && layer.children[0] === root, blocks: vis(st && st.blocks), sides: vis(st && st.sides),
            erasers: vis(st && st.erasers), tiles: vis(st && st.things), players: vis(st && st.players), props: props.length,
            names: props.map(s => s._characterName), stats: Cienie.stats }; })()`;
    // ---- the town by day
    await t.newGame({ map: 8, x: 52, y: 70, day: 40, hour: 14, quiet: true, minimap: false });
    await t.eval(NOCLOUDS);
    await t.frames(90);
    let info = await t.json(layerInfo);
    console.log("   town 14:00", JSON.stringify(info));
    t.check("the town: buildings found in the tiles (fronts of roof and wall)", info.stats.comps > 30 && info.stats.runs > 30, info.stats);
    t.check("the town by day: a building throws a shadow in the sun layer (its part first in the layer, the erasers on)", info.layerVisible && info.rootFirst && info.blocks > 0 && info.erasers > 0, info);
    t.check("the town by day: things made of tiles (barrels, crates, fences) throw one", info.tiles > 0, info);
    t.check("the town by day: a lamp (a standing event) throws one", info.props > 0 && info.names.includes("!lamp"), info.names);
    const wrong = await t.json(`(() => { const set = SceneManager._scene._spriteset, re = new RegExp("${BAD}"), bad = [];
        for (const s of set._characterSprites) { const n = s._characterName || ""; if (s._cienShadow && s._cienShadow.visible && (re.test(n) || s._character._priorityType === 0)) bad.push(n); }
        const doors = set._characterSprites.filter(s => re.test(s._characterName || ""));
        return { bad, doors: doors.length, doorsWith: doors.filter(s => s._cienShadow).length }; })()`);
    t.check("doors, roof windows, chimneys and flat things have no shadow of their own", wrong.doors > 0 && wrong.bad.length === 0 && wrong.doorsWith === 0, wrong);
    // the stone house east of the start (columns 57-62, its wall's foot on row 74 - the round corners are B-E tiles): a box's shadow
    const box = async () => t.json(`(() => { const st = SceneManager._scene._spriteset._cienie, tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const vx = Math.ceil($gameMap.displayX() * tw), vy = Math.ceil($gameMap.displayY() * th), S = Tawerna.api("Sun").now();
        const m = Cienie.solids(), mine = m.runs.filter(r => r.x0 >= 57 && r.x1 <= 62 && r.f >= 73 && r.f <= 75);
        const lt = e => e.spr.transform.localTransform;
        // (laid in the map's px: their part of the layer moved by the map's scroll)
        const root = SceneManager._scene._spriteset._tilemap._sunShadowLayer._cienRoot;
        const front = st.blocks.list.find(e => e.spr.visible && lt(e).tx === 57 * tw && lt(e).ty === 74 * th);
        const sideX = (S.dx > 0 ? 63 : 57) * tw, side = st.sides.list.find(e => e.spr.visible && lt(e).tx === sideX);
        const er = st.erasers.list.find(e => e.spr.visible && e.spr.x <= 58 * tw && e.spr.x + e.spr.scale.x * 8 >= 59 * tw && e.spr.y <= 72 * th && e.spr.y + e.spr.scale.y * 8 >= 74 * th);
        return { runs: mine.map(r => [r.x0, r.x1, r.f, r.h]), front: front ? [lt(front).a, lt(front).b] : null, side: side ? [lt(side).a, lt(side).b, lt(side).c] : null, dx: S.dx, eraser: !!er,
            rootAt: [root.x, root.y], scroll: [-vx, -vy] }; })()`);
    let b = await box();
    t.check("the stone house is one front 57-62 with its foot on row 74 (the round corners joined) and one height", b.runs.length === 1 && b.runs[0][0] === 57 && b.runs[0][1] === 62 && b.runs[0][2] === 74 && b.runs[0][3] > 4 * 48, b);
    t.check("its front's shadow starts along the wall's foot (not turned to the sun)", !!b.front && b.front[0] === 1 && b.front[1] === 0, b);
    t.check("its side away from the sun throws a shadow the sun's way (afternoon: the right side)", !!b.side && b.side[0] === 0 && b.side[1] === 1 && Math.sign(-b.side[2]) === Math.sign(b.dx), b);
    t.check("the house's own cells are erased from the shadows", b.eraser, b);
    t.check("the shadows' part of the layer lies at the map's scroll (the tiles' own)", b.rootAt[0] === b.scroll[0] && b.rootAt[1] === b.scroll[1], b);
    // walking: the shadows stay laid (no laying again each frame) until the screen leaves their window or the sun moves
    const lays = await t.json(`(() => { const st = SceneManager._scene._spriteset._cienie; window.__lays = 0; const f0 = Graphics.frameCount; let last = st.key + JSON.stringify(st.win);
        window.__laysU = Tawerna.onMapUpdate(() => { const k = st.key + JSON.stringify(st.win); if (k !== last) { __lays++; last = k; } Input._currentState.right = Graphics.frameCount - f0 < 40; }, { owner: "lays" });
        return 0; })()`);
    await t.frames(60);
    const nLays = await t.json("__lays");
    await t.eval("__laysU.off(); Input._currentState.right = false; 0");
    t.check("walking a few steps lays the shadows again only a few times (not each frame)", nLays <= 12, nLays);
    await t.setHour(9); await t.frames(30);
    b = await box();
    t.check("in the morning the left side throws it", !!b.side && b.dx < 0 && b.side[2] > 0, b);
    await t.setHour(14); await t.frames(30);
    // the switches
    await t.eval("Cienie.opts.buildings = false; 0"); await t.frames(10);
    info = await t.json(layerInfo);
    t.check("opts.buildings = false: no block and no tile shadows, props stay", info.blocks === 0 && info.tiles === 0 && info.props > 0, info);
    await t.eval("Cienie.opts.buildings = true; Cienie.opts.props = false; 0"); await t.frames(10);
    info = await t.json(layerInfo);
    t.check("opts.props = false: no standing-event shadows, blocks stay", info.props === 0 && info.blocks + info.tiles > 0, info);
    await t.eval("Cienie.opts.props = true; 0"); await t.frames(10);
    // the night: Sky decides - none; and nothing for the fires' shadows (no sprite._occluder from here)
    await t.setHour(23); await t.frames(30);
    info = await t.json(layerInfo);
    t.check("at night there are no sun shadows of buildings and props", info.blocks === 0 && info.tiles === 0 && info.props === 0, info);
    const sharing = await t.json("SceneManager._scene._spriteset._characterSprites.filter(s => s._cienOcc && s._occluder === s._cienOcc).length");
    t.check("Cienie sets no sprite._occluder (the night's fire shadows cost what they did)", sharing === 0, sharing);
    await t.setHour(11); await t.frames(60);
    info = await t.json(layerInfo);
    t.check("the shadows come back by day", info.blocks > 0 && info.props > 0, info);
    await t.eval("Sky.shadows = false; 0"); await t.frames(10);
    info = await t.json(layerInfo);
    t.check("Sky.shadows = false takes these shadows away too", info.blocks === 0 && info.props === 0, info);
    await t.eval("Sky.shadows = true; 0"); await t.frames(10);
    // ---- indoors: no outdoor flag, nothing
    await t.newGame({ map: 19, x: 10, y: 8, day: 40, hour: 11, quiet: true, minimap: false });
    await t.frames(60);
    const inside = await t.json(`({ clouds: !!Tawerna.mapFlag("Clouds", false), stats: Cienie.stats, props: SceneManager._scene._spriteset._characterSprites.filter(s => s._cienShadow && s._cienShadow.visible).length })`);
    t.check("indoors (Map019): no building or prop shadows", inside.props === 0 && inside.stats.blocks === 0 && inside.stats.tiles === 0, inside);
    // ---- Podgrodzie and the harbour
    for (const [map, x, y] of [[111, 43, 37], [125, 24, 14]]) {
        await t.newGame({ map, x, y, day: 40, hour: 11, quiet: true, minimap: false });
        await t.eval(NOCLOUDS);
        await t.frames(90);
        info = await t.json(layerInfo);
        t.check("map " + map + " by day: building / thing / prop shadows", info.blocks + info.tiles + info.props > 3, info);
    }
    // ---- the player's building: its sun shadow, the flat ellipse under it turned down
    await t.newGame({ map: 3, x: 22, y: 14, day: 40, hour: 11, quiet: true, minimap: false });
    await t.frames(30);
    const ok = await t.json("Farming.placeFree('well', $gamePlayer.x + 3, $gamePlayer.y + 2)");
    await t.frames(60);
    const pb = await t.json(`(() => { const set = SceneManager._scene._spriteset, bs = set._buildingSprites, st = set._cienie, e = bs && bs._sprites.find(q => q.b.type === "well");
        return { placed: ${JSON.stringify(ok)}, entry: !!e, ellipse: e && e.shadow ? e.shadow.alpha : null, laid: st ? st.players.list.filter(p => p.spr.visible).length : 0 }; })()`);
    t.check("a building of the player throws a sun shadow and its flat ellipse is turned down", pb.entry && pb.laid > 0 && pb.ellipse !== null && pb.ellipse < 0.6, pb);
    await t.setHour(23); await t.frames(30);
    const night = await t.json(`(() => { const set = SceneManager._scene._spriteset, e = set._buildingSprites._sprites.find(q => q.b.type === "well"); return { ellipse: e.shadow ? e.shadow.alpha : null, laid: set._cienie.players.list.filter(p => p.spr.visible).length }; })()`);
    t.check("at night the player's building has no sun shadow and its ellipse is back to full", night.laid === 0 && night.ellipse === 1, night);
});
