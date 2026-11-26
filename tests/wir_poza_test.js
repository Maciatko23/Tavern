// Wir (the user, 2026-11-26): the pose - "jak się odpali wir, gracz może rotować, ale też się poruszać, więc animacja chodu nie może być
// wtedy używana; jak się obraca, to ma rękę z bronią wyciągniętą" - the sword's own swing sheet held on its blow, turning with the spin,
// he slides in it (the walk sheet's steps hidden); and the three ranks - "obrażenia raz na 1 s / co 0,7 s / co 0,3 s, wróg podczas ataku
// ma 30% / 20% / 10% szans na przerwanie wiru", one whole turn a cut (the animation's speed by the rank), the walk in it slow / medium /
// quicker, "linie jakby tornadka wokół gracza" (one ring of wind a rank), the breath: it stops by itself with a quarter left, never
// winded. Screenshots tests/wir_poza_*.png and wir_stopien_1..3.png. CDP_PORT=9447.
"use strict";
const path = require("path");
const kit = require("./lib/kit.js");

kit.test({ port: 9447, bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    t.check("a new game on the meadow (Map218)", await t.newGame({ hour: 11, quiet: true }));
    await t.eval(`(function(){ if (window.Humans) { Humans.auto(false); Humans.clear(); } if (window.Hunting) Hunting.auto(false); if (Combat.feel && Combat.feel.auto) Combat.feel.auto(false); return 0; })()`);
    const sword = await t.eval(`(function(){ const D = window.Bron_Data, p = D && D.PRZEDMIOTY.find(p => p.rodzaj === "miecz"); if (p) $gameParty.gainItem($dataItems[p.id], 1); return p ? p.id : 0; })()`);
    const setRank = r => t.eval(`(function(){ const h = Combat.hero(); h.skills = Object.assign({}, h.skills, { m_whirl: ${r} }); h.rev = (h.rev || 0) + 1; return 0; })()`);
    await setRank(1);
    await t.eval(`(function(){ Combat.setHand("m${sword}"); Combat.setCombatMode(true); return 0; })()`);
    await t.frames(10);
    const F = `Tawerna.api("Combat_parts").fight`;
    const start = () => t.eval(`(function(){ const f = ${F}; f.fillBreath(); f.act.mode = "idle"; f.act.stun = 0; f.startWhirl(); return f.act.whirlKind; })()`);
    const stop = () => t.eval(`(function(){ ${F}.endWhirl(); return 0; })()`);
    const back = () => t.eval(`(function(){ $gamePlayer.locate(30, 18); $gamePlayer.setDirection(2); return 0; })()`);
    // watching n frames: the pose's rows and columns, the walk sheet hidden, the blur's copies, the wind's rings, the way gone
    const watch = (walk, n) => t.json(`new Promise(res => { const f = ${F}, sp = SceneManager._scene._spriteset._characterSprites.find(s => s._character === $gamePlayer);
        const out = { rows: [], cols: new Set(), poseShown: 0, baseHidden: 0, frames: 0, x0: $gamePlayer._realX, y0: $gamePlayer._realY, ghosts: 0, rings: 0 }; let last = -1;
        if (${walk}) Input._currentState.up = true;
        const iv = setInterval(() => { if (Graphics.frameCount === last) return; last = Graphics.frameCount; out.frames++;
            const b = sp._swingBody;
            if (f.act.mode === "whirl" && b && b.visible) { out.poseShown++; const fr = b._frame; out.rows.push(fr.y / 96); out.cols.add(fr.x / 96); }
            if (sp._frame && sp._frame.width === 0) out.baseHidden++;
            if (sp._whirlBack && sp._whirlBack.visible && sp._whirlFront.visible && sp.children.indexOf(sp._whirlBack) < sp.children.indexOf(b) && sp.children[sp.children.length - 1] === sp._whirlFront) out.rings++;
            out.ghosts = Math.max(out.ghosts, sp.parent.children.filter(c => c.spriteId === -1 && c._life !== undefined && c.bitmap === (b && b.bitmap)).length);
            if (out.frames >= ${n}) { clearInterval(iv); Input._currentState.up = false; out.cols = [...out.cols]; out.rowSet = [...new Set(out.rows)].sort().join(); out.moved = Math.hypot($gamePlayer._realX - out.x0, $gamePlayer._realY - out.y0); out.rows = out.rows.slice(0, 30).join(""); res(out); } }, 2); })`);

    // ================= the pose (rank 1)
    await back();
    const kind = await start();
    const stand = await watch(false, 60);
    t.check("whirling in place: the sword's swing sheet held on its blow (one column a row), all four rows in one turn (a second at rank 1); the walk sheet hidden; the blur copies the pose; the wind's rings behind and in front of him",
        kind >= 0 && stand.poseShown >= 55 && stand.rowSet === "0,1,2,3" && stand.cols.length <= 4 && stand.baseHidden >= 55 && stand.ghosts >= 2 && stand.rings >= 55, Object.assign({ kind }, stand));
    await t.shot(path.join(__dirname, "wir_poza_stoi.png"));
    const walk1 = await watch(true, 60);
    t.check("walking in the whirl: he moves north in the same held pose (no steps - the walk sheet stays hidden)", walk1.moved > 0.3 && walk1.poseShown >= 55 && walk1.baseHidden >= 55 && walk1.cols.length <= 4, walk1);
    await t.shot(path.join(__dirname, "wir_poza_idzie.png"));
    await stop();
    await t.frames(8);
    const after = await t.json(`(function(){ const sp = SceneManager._scene._spriteset._characterSprites.find(s => s._character === $gamePlayer); return { pose: !!(sp._swingBody && sp._swingBody.visible), rings: !!(sp._whirlFront && sp._whirlFront.visible), base: sp._frame.width, held: Combat.heldPose() }; })()`);
    t.check("after the whirl: the pose and the rings gone, the walk sheet back", !after.pose && !after.rings && after.base > 0 && after.held === null, after);
    await back();
    const plain = await watch(true, 60);

    // ================= the ranks: the rhythm of the cuts, a cut's share, the walk, the rings
    const ranks = [];
    for (const r of [1, 2, 3]) {
        await setRank(r);
        await back();
        await t.eval(`(function(){ Humans.clear(); const m = Humans.spawn("bandit", 31, 18, { noBand: true }); m._frozen = true; m._hp = m._maxHp = 99999; window.__dummy = m; return 0; })()`);
        await start();
        const cuts = await t.json(`new Promise(res => { const m = window.__dummy, at = []; let hp = m._hp, last = -1, n = 0;
            const iv = setInterval(() => { if (Graphics.frameCount === last) return; last = Graphics.frameCount; n++;
                if (m._hp < hp) { at.push({ f: n, dmg: hp - m._hp }); hp = m._hp; }
                if (n >= 160) { clearInterval(iv); res({ gaps: at.slice(1).map((c, i) => c.f - at[i].f), dmg: at.map(c => c.dmg) }); } }, 2); })`);
        await t.shot(path.join(__dirname, "wir_stopien_" + r + ".png"));
        await t.eval("Humans.clear(); 0");
        await back();
        const w = await watch(true, 60);
        await stop();
        ranks.push({ r, gaps: cuts.gaps, dmg: cuts.dmg, walk: Math.round(w.moved / plain.moved * 100) / 100, rings: w.rings });
        await t.frames(6);
    }
    const gapOk = (g, every) => g.length >= 1 && g.every(x => Math.abs(x - every) <= 2);
    t.check("the rhythm by the rank: a cut every 1 s / 0.7 s / 0.3 s (60 / 42 / 18 frames)", gapOk(ranks[0].gaps, 60) && gapOk(ranks[1].gaps, 42) && gapOk(ranks[2].gaps, 18), ranks.map(x => ({ r: x.r, gaps: x.gaps })));
    const avg = a => a.reduce((s, v) => s + v, 0) / a.length;
    const d1 = avg(ranks[0].dmg), d2 = avg(ranks[1].dmg), d3 = avg(ranks[2].dmg);
    t.check("a cut's strength: 100% / 90% / 70% of a blow (rank 2 and 3 against rank 1: ~0.9 and ~0.7)", Math.abs(d2 / d1 - 0.9) < 0.1 && Math.abs(d3 / d1 - 0.7) < 0.1, { d1, d2, d3 });
    t.check("the walk in the whirl: slow / medium / quicker - about 40% / 57% / 78% of the plain walk", Math.abs(ranks[0].walk - 0.41) < 0.08 && Math.abs(ranks[1].walk - 0.57) < 0.08 && Math.abs(ranks[2].walk - 0.78) < 0.1, { plain: plain.moved, walk: ranks.map(x => x.walk) });
    t.check("the wind's rings shown at every rank (one, two, three rings - the sheets of Combat_UI)", ranks.every(x => x.rings >= 55), ranks.map(x => x.rings));

    // ================= a mercenary's shield (the user: "przy najemnikach wir jest jakby od razu zablokowany"; "niech tarcza ma szansę na
    // zablokowanie jakiejś ilości obrażeń"): his shield catches a cut half the times and holds back 60% of it; the whirl goes on
    await setRank(3);
    await back();
    const merc = await t.json(`new Promise(res => { Humans.clear(); const m = Humans.spawn("mercenary", 31, 18, { noBand: true }); m._hp = m._maxHp = 99999; m.engage(false); m.setMode("guard", 999); m._frozen = true; m.turnTowardCharacter($gamePlayer);
        const f = ${F}; f.fillBreath(); f.act.mode = "idle"; f.act.stun = 0; f.startWhirl();
        const hp0 = m._hp, t0 = Graphics.frameCount, up = m.guarding();
        const iv = setInterval(() => { if (Graphics.frameCount - t0 < 70) return; clearInterval(iv); const out = { up, mode: f.act.mode, stun: f.act.stun, lost: hp0 - m._hp }; f.endWhirl(); Humans.clear(); res(out); }, 4); })`);
    t.check("a mercenary with his shield up: the shield catches a cut only half the times and then holds back 60% of it - the whirl goes on, no stagger", merc.up && merc.mode === "whirl" && merc.stun === 0 && merc.lost >= 12, merc);
    await setRank(1);
    // ================= a blow that gets through: out of the whirl 30% of the times at rank 1 (the roll forced both ways)
    await setRank(1);
    await back();
    // (the user: "obojętnie kto - nawet najemnik - jak atakuje gracza podczas wiru, to może mu zadać obrażenia, ale ma małą szansę na
    // przerwanie wiru") a hard blow (poise 200 - it would throw him down) at rank 1: it hurts; a roll over 30% - he spins on, no fall
    const hit = async roll => { await start(); return t.json(`(function(){ const R = Math.random; Math.random = () => ${roll}; const f = ${F}, a = $gameParty.leader(); f.act.iframes = 0; a.setHp(a.mhp); const hp0 = a.hp;
        Combat.hitPlayer({ damage: 10, poise: 200, from: { x: $gamePlayer._realX + 1.5, y: $gamePlayer._realY + 0.5 }, name: "test" }); Math.random = R; return { mode: f.act.mode, stun: f.act.stun, kind: f.act.stunKind, lost: hp0 - a.hp }; })()`); };
    const kept = await hit(0.5);
    await stop();
    await t.frames(70);
    const broke = await hit(0.1);
    t.check("a hard blow in the whirl at rank 1: it hurts either way; a roll over 30% - he spins on (no fall, no stagger); under 30% - out of it and down", kept.mode === "whirl" && kept.lost > 0 && kept.stun === 0 && broke.mode !== "whirl" && broke.lost > 0 && broke.kind === "down", { kept, broke });
    await t.frames(70);
    await stop();
    // ================= the breath: it stops with a quarter left, he is not winded
    const breath = await t.json(`new Promise(res => { const f = ${F}; f.fillBreath(); f.act.mode = "idle"; f.startWhirl(); Combat.drainBreath(Combat.maxBreath() * 0.7);
        const t0 = Graphics.frameCount; const iv = setInterval(() => { if (f.act.mode !== "whirl" || Graphics.frameCount - t0 > 200) { clearInterval(iv); res({ mode: f.act.mode, left: Math.round(Combat.breathNow() / Combat.maxBreath() * 100), winded: f.isWinded() }); } }, 4); })`);
    t.check("little breath: the whirl stops by itself with about a quarter left, not winded (a dodge still there)", breath.mode !== "whirl" && breath.left >= 22 && !breath.winded, breath);
});
