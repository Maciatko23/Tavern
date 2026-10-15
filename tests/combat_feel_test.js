// The fight's feel (Combat_Feel.js + Combat_Fight.js, 2026-10-14 - the user's list "walka przyjemniejsza, płynniejsza i wygodniejsza"):
// A - the combat mode switching itself on and off, the soft target (the copper ring, F), the input buffer, the roll cutting a blow's end,
//     the roll without the arrows springing away from the foe;
// B - the attacks' warnings, the perfect parry for everyone, the juicy hits, the last blow's slowed moment;
// C - the arrows at the screen's edge, the quick heal (H), the training dummy, the difficulty.
// CDP_PORT=9491 node tests/combat_feel_test.js        (SHOTS=1: pictures into docs/walka/)
const kit = require("./lib/kit.js");
const SHOTS = !!process.env.SHOTS;

// keys pressed inside the game loop (CDP round trips are too slow for a parry): __press(code, after, hold) - down `after` frames from
// now, up `hold` frames later; put before the engine reads the keys (SceneManager.updateInputData)
const KEYS = `(function(){
    if (window.__ks) return 0;
    window.__ks = [];
    const _ui = SceneManager.updateInputData;
    SceneManager.updateInputData = function() {
        const now = Graphics.frameCount;
        for (const k of window.__ks) if (!k.done && now >= k.at) { k.done = true; if (k.up) Input._onKeyUp({ keyCode: k.code }); else Input._onKeyDown({ keyCode: k.code, preventDefault() {} }); }
        window.__ks = window.__ks.filter(k => !k.done);
        _ui.call(this);
    };
    window.__press = (code, after, hold) => { const t = Graphics.frameCount + (after || 0); window.__ks.push({ at: t, code }, { at: t + (hold || 3), code, up: true }); };
    return 0; })()`;
const K = { O: 79, P: 80, SPACE: 32, TAB: 9, F: 70, H: 72, LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40 };

kit.test({ port: 9491 }, async t => {
    t.check("a new game on the meadow (Map004), noon", await t.newGame({ map: 4, x: 20, y: 14, hour: 12, quiet: true }));
    await t.eval(KEYS);
    await t.eval("$gameSystem.setStamina(100); $gameParty.leader().recoverAll(); Hunting.RAID.perHour = 0; Combat.feel.auto(true); 0");
    const shot = async name => { if (SHOTS) { await t.frames(2); await t.shot("../docs/walka/" + name); } };
    const room = await t.json(`(function(){
        const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.hasObjectTile(x, y) && !Farming.buildingAt(x, y);
        let best = null;
        for (let y = 6; y < $gameMap.height() - 6; y++) for (let x = 8; x < $gameMap.width() - 8; x++) {
            let ok = true;
            for (let dx = -7; dx <= 7 && ok; dx++) for (let dy = -4; dy <= 4; dy++) if (!free(x + dx, y + dy)) { ok = false; break; }
            if (ok && (!best || Math.abs(x - $gameMap.width() / 2) < Math.abs(best.x - $gameMap.width() / 2))) best = { x, y };
        }
        return best; })()`);
    t.check("an open field (15 x 9 tiles)", !!room, room);
    const cx = room.x, cy = room.y;
    const clear = () => t.eval("for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); for (const c of Hunting.carcasses().slice()) Hunting.removeCarcass(c); Humans.clear(); Creatures.clear(); 0");
    const home = async (dir, combat) => {
        await clear();
        await t.eval(`(function(){ Combat.resetAct(); $gamePlayer._toolSwing = null; $gamePlayer._swingEvent = null; $gamePlayer.locate(${cx}, ${cy}); $gamePlayer.setDirection(${dir || 2}); $gamePlayer._heroDir8 = ${dir || 2};
            $gameMap.setDisplayPos(${cx} - 13, ${cy} - 7); $gameSystem.setStamina(100); $gameParty.leader().recoverAll(); $gameSystem._combatMode = ${!!combat}; $gameSystem._tw.combat.auto = false; Combat.feel.setTarget(null); return 0; })()`);
        await t.frames(6);
    };
    // a boar standing still (frozen) at (dx, dy) from the hero, level 1, in the fight or not
    const boar = (dx, dy, engaged, name) => t.eval(`(function(){ const a = Hunting.spawn("boar", ${cx + dx}, ${cy + dy}); a._frozen = true; a._level = 1; a._maxHp = a._hp = 110;
        a._maxPoise = a._poise = Hunting.SPECIES.boar.poise || 60; a._engaged = ${!!engaged}; window.${name || "__b"} = a; return 0; })()`);
    const st = () => t.json("Combat.feel.state()");

    // ======================================================== A. comfort and flow
    // ---- A0: the part is in, the keys, the options
    const fam = await t.json(`({ parts: Object.keys(Tawerna.api("Combat_parts")), feel: !!Combat.feel, scripts: document.querySelectorAll('script[src*="/Combat_Feel.js"]').length,
        F: Input.keyMapper[70] || null, V: Input.keyMapper[86] || null })`);
    t.check("A0 Combat_Feel.js is in (once), the family's bag has core, fight, ui, feel; F = 'target', V stays free", fam.feel && fam.parts.join() === "core,fight,ui,feel" && fam.scripts === 1 && fam.F === "target" && fam.V === null, fam);
    const opts = await t.json(`(function(){ const w = new Window_Options(new Rectangle(0, 0, 600, 400)), L = w._list.map(c => c.symbol), i = s => w.findSymbol(s);
        const a = i("combatAuto"), d = i("combatDifficulty"), sw = Math.max(...["alwaysDash", "commandRemember", "touchUI", "switchABButtons", "fastMessage"].map(i));
        const out = { list: L, a, d, sw, aName: w.commandName(a), dName: w.commandName(d), aText: w.statusText(a), dText: w.statusText(d), cfg: ConfigManager.makeData() };
        w.select(d); w.cursorRight(); out.right = w.statusText(d); w.cursorRight(); out.right2 = w.statusText(d); w.cursorLeft(); w.cursorLeft(); w.cursorLeft(); out.left = w.statusText(d);
        w.select(d); w.processOk(); w.processOk(); w.processOk(); out.round = w.statusText(d);
        w.select(a); w.processOk(); out.off = w.statusText(a); out.offCfg = ConfigManager.combatAuto; w.processOk(); out.on = w.statusText(a);
        ConfigManager.combatDifficulty = 1; ConfigManager.combatAuto = true; w.destroy(); return out; })()`);
    t.check("A0 options: 'Automatyczny tryb walki' (Wł) and 'Trudność walki' (Normalny) right after the game's switches; saved in the config",
        opts.a === opts.sw + 1 && opts.d === opts.a + 1 && opts.aName === "Automatyczny tryb walki" && opts.aText === "Wł" && opts.dName === "Trudność walki" && opts.dText === "Normalny" &&
        opts.cfg.combatAuto === true && opts.cfg.combatDifficulty === 1, { a: opts.a, d: opts.d, sw: opts.sw, aText: opts.aText, dText: opts.dText, cfg: [opts.cfg.combatAuto, opts.cfg.combatDifficulty] });
    t.check("A0 options: the difficulty steps Normalny -> Trudny (no further) -> Łatwy with A/D, round with O; the switch Wł <-> Wył",
        opts.right === "Trudny" && opts.right2 === "Trudny" && opts.left === "Łatwy" && opts.round === "Łatwy" && opts.off === "Wył" && opts.offCfg === false && opts.on === "Wł", opts);

    // ---- A1: the automatic combat mode
    await home(6, false);
    await boar(4, 0, true);
    await t.frames(4);
    t.check("A1 a boar in the fight, standing: the mode stays normal (no attack yet)", (await t.eval("Combat.combatMode()")) === false, await st());
    await t.eval("__b._frozen = false; __b.setMode('warn', 40); __b.turnTowardCharacter($gamePlayer); 0");
    await t.until("Combat.combatMode()", 3, 30);
    const on1 = await t.json("({ mode: Combat.combatMode(), auto: Combat.hero && $gameSystem._tw.combat.auto, hand: Combat.hand() })");
    const pops1 = await t.popups({ clear: true });
    t.check("A1 it warns (the snort, the charge coming): the combat mode comes on by itself, the keys said over him", on1.mode && on1.auto && pops1.some(p => /Tryb walki: O atak/.test(p) && /F cel/.test(p)), { on1, pops1 });
    await t.eval("__b._engaged = false; __b._aware = 0; __b._frozen = true; __b.setMode('roam'); Combat.resetAct(); 0");   // (it only stopped: alive, near)
    let back = null;
    for (let i = 0; i < 30 && back === null; i++) { await t.frames(20); if (!(await t.eval("Combat.combatMode()"))) back = i * 20; }
    t.check("A1 the boar stops attacking (alive, near): about 5 s of calm and the normal mode is back (the weapon put away)", back !== null && back >= 260 && back <= 360, { back });
    // the last foe killed (or run off): back to the normal mode after ~1 s - O dresses the carcass at once
    await home(6, false);
    await boar(3, 0, true);
    await t.eval("__b._frozen = false; __b.setMode('warn', 300); 0");
    await t.until("Combat.combatMode()", 3, 30);
    await t.eval("__b._frozen = true; const tg = Hunting.allTargets().find(x => x.ref === __b); tg.hit(999, 'melee', {}); Combat.resetAct(); 0");
    const kf0 = await t.eval("Graphics.frameCount");
    await t.until("!Combat.combatMode()", 6, 10);
    const quick = (await t.eval("Graphics.frameCount")) - kf0;
    t.check("A1 the boar killed: about 1 s and the normal mode is back (only 5 s when they just stop, alive)", quick >= 50 && quick <= 110, { quick });
    // a talk or a riddle first: held by another plugin (Combat.feel.holdAuto - the tenth gate's guardian), and an event with a talk turns
    // an automatic mode off before it starts
    await home(6, false);
    await t.eval("window.__hold = true; if (!window.__holdSet) { window.__holdSet = true; Combat.feel.holdAuto(() => window.__hold); } 0");
    await boar(4, 0, true);
    await t.eval("__b._frozen = false; __b.setMode('warn', 300); 0");
    await t.frames(30);
    const heldOn = await t.eval("Combat.combatMode()");
    await t.eval("window.__hold = false; __b.setMode('roam'); 0");
    await t.frames(3);
    await t.eval("__b.setMode('warn', 300); 0");
    await t.until("Combat.combatMode()", 3, 30);
    t.check("A1 an encounter held for a talk (holdAuto): no automatic combat mode; released: it comes", heldOn === false && (await t.eval("Combat.combatMode()")) === true, { heldOn });
    await t.eval(`(function(){ const ev = $gameMap.events().find(e => !e._erased) ; window.__ev = ev; ev.list = () => [{ code: 101, indent: 0, parameters: ["", 0, 0, 2, ""] }, { code: 401, indent: 0, parameters: ["Kto idzie?"] }, { code: 0, indent: 0, parameters: [] }];
        ev.start(); return 0; })()`);
    const talkOff = await t.json("({ mode: Combat.combatMode(), running: $gameMap.isEventRunning() || $gameMap.isAnyEventStarting() })");
    await t.dismiss();
    await t.eval("delete __ev.list; 0");
    t.check("A1 an event with a talk starts while the mode came on by itself: it goes off first (the talk in the normal mode)", talkOff.mode === false && talkOff.running, talkOff);
    // the hero's own Tab: on by hand - it stays; off by hand during a fight - it holds till a new attack
    await home(6, false);
    await t.key("Tab");
    await t.frames(400);
    t.check("A1 Tab on by hand with no foe: it stays on (only a mode that came on by itself goes off)", (await t.eval("Combat.combatMode()")) === true);
    await t.key("Tab");
    await boar(5, 0, true);
    await t.eval("__b._frozen = false; __b.setMode('warn', 200); 0");
    await t.until("Combat.combatMode()", 3, 30);
    await t.key("Tab");
    await t.frames(40);
    const held = await t.json("({ mode: Combat.combatMode(), st: Combat.feel.state() })");
    t.check("A1 Tab off while the boar warns: the hero's word holds (the mode stays off)", held.mode === false && held.st.manualOff, held);
    await t.eval("__b.setMode('roam'); 0");
    await t.frames(3);
    await t.eval("__b.setMode('warn', 60); 0");
    await t.until("Combat.combatMode()", 3, 30);
    t.check("A1 ... a new attack (it warns again): on again", (await t.eval("Combat.combatMode()")) === true);
    // not in a talk: it waits till the message is gone
    await home(6, false);
    await t.eval("$gameMessage.add('Rozmowa trwa.'); 0");
    await t.until("$gameMessage.isBusy() && SceneManager._scene._messageWindow.isOpen()", 3, 30);
    await boar(4, 0, true);
    await t.eval("__b._frozen = false; __b.setMode('warn', 300); 0");
    await t.frames(30);
    const inTalk = await t.eval("Combat.combatMode()");
    for (let i = 0; i < 10 && (await t.eval("$gameMessage.isBusy()")); i++) await t.key("O");
    await t.until("Combat.combatMode()", 3, 30);
    t.check("A1 during a message it does not switch; once the message is gone it does", inTalk === false && (await t.eval("Combat.combatMode()")) === true, { inTalk });
    // the burning torch stays in his hand
    await home(6, false);
    await t.eval("$gameParty.gainItem($dataItems[156], 1); $gameSystem._combatHand = 'm156'; Torch.light(); 0");
    await t.frames(4);
    await boar(4, 0, true);
    await t.eval("__b._frozen = false; __b.setMode('warn', 300); 0");
    await t.until("Combat.combatMode()", 3, 30);
    t.check("A1 with the torch burning in his hand: the mode comes on with the torch as the weapon (not the club he had)", (await t.eval("Combat.hand()")) === "m59", await t.eval("Combat.hand()"));
    await t.eval("Torch.douse(''); $gameSystem._combatHand = 'm156'; 0");
    // the option off: nothing by itself
    await home(6, false);
    await t.eval("ConfigManager.combatAuto = false; 0");
    await boar(4, 0, true);
    await t.eval("__b._frozen = false; __b.setMode('warn', 300); 0");
    await t.frames(30);
    t.check("A1 'Automatyczny tryb walki: Wył': the mode stays normal", (await t.eval("Combat.combatMode()")) === false);
    await t.eval("ConfigManager.combatAuto = true; 0");

    // ---- A2: the soft target
    await home(6, true);
    await boar(1, 0, true, "__b1");
    await boar(-1, 1, true, "__b2");
    await t.frames(20);
    const tg1 = await t.json("({ st: Combat.feel.state(), is1: Combat.feel.target() && Combat.feel.target().ref === __b1, ring: SceneManager._scene._spriteset._targetRing.visible, rx: SceneManager._scene._spriteset._targetRing.x, bx: __b1._sprite ? __b1._sprite.x : -1 })");
    t.check("A2 two boars, he faces the right one: the copper ring is under it (the soft target)", tg1.is1 && tg1.ring && Math.abs(tg1.rx - tg1.bx) <= 4, tg1);
    await shot("walka_cel.png");
    await t.key("F");
    const tg2 = await t.json("({ is2: Combat.feel.target() && Combat.feel.target().ref === __b2, rx: SceneManager._scene._spriteset._targetRing.x, bx: __b2._sprite ? __b2._sprite.x : -1 })");
    await t.key("F");
    const tg3 = await t.json("({ is1: Combat.feel.target() && Combat.feel.target().ref === __b1 })");
    t.check("A2 F: the other boar; F again: back to the first", tg2.is2 && Math.abs(tg2.rx - tg2.bx) <= 4 && tg3.is1, { tg2, tg3 });
    // the blow turns him to the target, behind him too
    await t.key("F");   // (the left one, behind him)
    await t.eval("$gamePlayer.setDirection(6); $gamePlayer._heroDir8 = 6; Combat.resetAct(); 0");
    const hp2 = await t.eval("__b2._hp");
    await t.key("O");
    await t.until(`__b2._hp < ${hp2}`, 3, 30);
    const turned = await t.json(`({ hp: __b2._hp, hp1: __b1._hp, dir: $gamePlayer.direction(), dir8: $gamePlayer._heroDir8 })`);
    t.check("A2 O with the target behind him (down-left): he turns to it and the blow lands on it, not on the boar in front", turned.hp < hp2 && turned.hp1 === 110 && [1, 4].includes(turned.dir8), turned);
    // the target goes out with its foe
    await t.eval("__b2._dead = true; Hunting.removeAnimal(__b2); 0");
    await t.frames(4);
    const tg4 = await t.json("({ is1: Combat.feel.target() && Combat.feel.target().ref === __b1 })");
    await t.eval("__b1._frozen = false; __b1._engaged = false; __b1.setMode('flee'); 0");
    await t.frames(20);
    const tg5 = await t.json("({ t: Combat.feel.target(), ring: SceneManager._scene._spriteset._targetRing.visible })");
    t.check("A2 the targeted boar dead: the ring goes to the other; that one runs off: no target, no ring", tg4.is1 && !tg5.t && !tg5.ring, { tg4, tg5 });

    // ---- A3: the input buffer, the roll cutting a blow short, the roll without arrows
    await home(6, true);
    await boar(5, 0, true);
    await t.frames(4);
    // O pressed 6 frames before the roll's end: the blow comes right after it (it used to be lost)
    await t.eval(`Combat.resetAct(); __press(${K.SPACE}, 0, 3); 0`);
    await t.until("Combat.act.mode === 'roll'", 2, 10);
    const rollLen = await t.eval("Combat.act.rollLen");
    await t.eval(`(function(){ const left = Combat.act.rollLen - Combat.act.rollT; __press(${K.O}, Math.max(1, left - 6), 3); window.__rollEnd = null; window.__atk = null;
        const _u = Scene_Map.prototype.update; window.__restoreU = () => { Scene_Map.prototype.update = _u; };
        Scene_Map.prototype.update = function() { _u.call(this); const a = Combat.act; if (__rollEnd === null && a.mode !== 'roll') __rollEnd = Graphics.frameCount; if (__atk === null && a.mode === 'attack') __atk = Graphics.frameCount; }; return 0; })()`);
    await t.frames(rollLen + 20);
    const bufA = await t.json("({ end: __rollEnd, atk: __atk })");
    await t.eval("__restoreU(); 0");
    t.check("A3 O pressed in the roll's last frames: the blow starts the moment the roll is over", bufA.end !== null && bufA.atk !== null && bufA.atk - bufA.end <= 1, bufA);
    // Space before the blow lands: the roll comes the moment it lands (the swing's end cut short)
    await t.frames(40);
    await t.eval("Combat.resetAct(); $gamePlayer.setDirection(6); 0");
    await t.eval(`__press(${K.O}, 0, 3); 0`);
    await t.until("Combat.act.mode === 'attack'", 2, 10);
    const sw = await t.json("({ kind: $gamePlayer._toolSwing._swingKind, t: $gamePlayer._toolSwing._swingT, impact: ChoppableTree.swingKind($gamePlayer._toolSwing._swingKind).impact, frames: ChoppableTree.swingKind($gamePlayer._toolSwing._swingKind).frames })");
    await t.eval(`(function(){ __press(${K.SPACE}, Math.max(1, ${sw.impact} - ${sw.t} - 6), 3); window.__imp = null; window.__roll = null; const _u = Scene_Map.prototype.update; window.__restoreU = () => { Scene_Map.prototype.update = _u; };
        if (!window.__impHooked) { window.__impHooked = true; Tawerna.on('attack', () => { if (window.__imp === null) window.__imp = Graphics.frameCount; }, { owner: 'FeelTest' }); }
        Scene_Map.prototype.update = function() { _u.call(this); if (__roll === null && Combat.act.mode === 'roll') __roll = { f: Graphics.frameCount }; }; return 0; })()`);
    await t.frames(sw.frames + 20);
    const cut = await t.json("({ imp: __imp, roll: __roll })");
    await t.eval("__restoreU(); 0");
    t.check("A3 Space pressed during the swing, before the blow: the roll comes right when the blow has landed (the rest of the swing cut)", cut.imp !== null && cut.roll !== null && cut.roll.f - cut.imp >= 0 && cut.roll.f - cut.imp <= 2 && cut.roll.f - cut.imp < sw.frames - sw.impact, { cut, sw });
    // P in the roll's last frames: the guard comes up fresh (a parry) as the roll ends
    await t.frames(40);
    await t.eval(`Combat.resetAct(); __press(${K.SPACE}, 0, 3); 0`);
    await t.until("Combat.act.mode === 'roll'", 2, 10);
    await t.eval(`(function(){ const left = Combat.act.rollLen - Combat.act.rollT; __press(${K.P}, Math.max(1, left - 5), 3); return 0; })()`);
    await t.until("Combat.act.mode === 'block'", 2, 10);
    const grd = await t.json("({ mode: Combat.act.mode, blockT: Combat.act.blockT })");
    t.check("A3 P tapped in the roll's last frames: the guard comes up as it ends, fresh - in the parry window", grd.mode === "block" && grd.blockT <= 3, grd);
    await t.frames(30);
    // Space with no arrow: away from the target (the boar to his right: he springs left), then he faces it again
    await home(6, true);
    await boar(2, 0, true);
    await t.frames(20);
    const x0 = await t.eval("$gamePlayer._realX");
    await t.eval(`__press(${K.SPACE}, 0, 3); 0`);
    await t.until("Combat.act.mode === 'roll'", 2, 10);
    const dirR = await t.json("({ dir: Combat.act.rollDir })");
    await t.until("Combat.act.mode !== 'roll'", 3, 20);
    await t.frames(2);
    const after = await t.json("({ x: $gamePlayer._realX, dir: $gamePlayer.direction() })");
    t.check("A3 Space without arrows: a roll away from the target (the boar on the right: to the left), then he faces it again", dirR.dir[0] < -0.9 && after.x < x0 - 1.5 && after.dir === 6, { x0, dirR, after });
    await home(8, true);
    const y0 = await t.eval("$gamePlayer._realY");
    await t.eval(`__press(${K.SPACE}, 0, 3); 0`);
    await t.until("Combat.act.mode === 'roll'", 2, 10);
    await t.until("Combat.act.mode !== 'roll'", 3, 20);
    await t.frames(2);
    const back2 = await t.json("({ y: $gamePlayer._realY, dir: $gamePlayer.direction() })");
    t.check("A3 ... with no foe near: backwards (he looked up: he springs down) and looks the way he looked", back2.y > y0 + 1.5 && back2.dir === 8, { y0, back2 });

    // ---- A4: the guard turns to the foe whose blow comes (not to the ring's foe on the other side)
    await home(6, true);
    await boar(2, 0, true);
    await t.eval(`(function(){ const a = Hunting.spawn("wolf", ${cx - 2}, ${cy}); a._frozen = true; a._engaged = true; a.setMode("windup", 14); window.__w = a; return 0; })()`);
    await t.frames(8);
    const gd0 = await t.json("({ ring: Combat.feel.target() && Combat.feel.target().ref === __b, dir: $gamePlayer.direction() })");
    await t.eval(`__press(${K.P}, 0, 12); 0`);
    await t.frames(6);
    const gd1 = await t.json("({ mode: Combat.act.mode, dir: $gamePlayer.direction() })");
    t.check("A4 the ring on the boar (right), a wolf winds up on the left: P - the guard turns to the wolf", gd0.ring && gd0.dir === 6 && gd1.mode === "block" && gd1.dir === 4, { gd0, gd1 });
    await t.frames(20);

    // ======================================================== B. reading the fight, the blows that land
    await t.eval("window.__se = []; const _se = Tawerna.audio.se; Tawerna.audio.se = function(n) { window.__se.push(n); return _se.apply(this, arguments); }; 0");
    const fx = name => t.json(`(function(){ const L = SceneManager._scene._spriteset._tellLayer, a = ${name}, g = L._ghosts.get(a) || [];
        return { tells: Combat.feel.tells(), ghosts: g.length, vis: g.filter(s => s.visible && s.opacity > 0).length, col: g[0] ? g[0].getBlendColor() : null, se: window.__se.slice(-3) }; })()`);
    // ---- B6: the warnings - a wolf's leap (red), the bear's paw (white-gold), a bandit's blow (red), his feint (none), the mercenary's
    // overhead blow (white-gold), an empty armour's overhead blow (white-gold)
    await home(6, true);
    await t.eval(`(function(){ const a = Hunting.spawn("wolf", ${cx + 3}, ${cy}); a._frozen = true; a._engaged = true; a.setMode("windup", 30); window.__w = a; return 0; })()`);
    await t.frames(6);
    const w0 = await fx("__w");
    await t.eval("__w._modeT = 8; window.__se = []; 0");
    await t.frames(6);
    const w1 = await fx("__w");
    await shot("walka_zapowiedz.png");
    t.check("B6 a wolf crouched to leap: no flash while the bite is far; 8 frames (+6) before it - a warm red outline round it and a swish",
        w0.ghosts === 0 && w1.ghosts === 4 && w1.vis === 4 && w1.col && w1.col[0] === 255 && w1.col[1] < 120 && w1.se.includes("Wind4") && w1.tells.some(x => x.kind === "wolf" && !x.heavy), { w0, w1 });
    const hint = await t.popups({ clear: true });
    t.check("B6 ... the first wolf's leap of the game: over the hero 'P tuż przed ugryzieniem = parowanie' (once)", hint.includes("P tuż przed ugryzieniem = parowanie"), hint);
    await clear();
    await t.eval(`(function(){ const a = Hunting.spawn("bear", ${cx + 2}, ${cy}); a._frozen = true; a._engaged = true; a._lock = [-1, 0]; a.setMode("swipeWind", 6); window.__br = a; window.__se = []; return 0; })()`);
    await t.frames(6);
    const b1 = await fx("__br");
    t.check("B6 the bear drawing its paw back: a white-gold outline (no guard holds it) and a low bell", b1.vis === 4 && b1.col && b1.col[2] > 120 && b1.se.includes("Bell3") && b1.tells.some(x => x.kind === "bear" && x.heavy), b1);
    await clear();
    await t.eval(`(function(){ const h = Humans.spawn("bandit", ${cx + 2}, ${cy}, { engaged: true, noSurrender: true }); h._frozen = true; h._blow = "main"; h._feint = true; h.setMode("windup", 6); window.__h = h; window.__se = []; return 0; })()`);
    await t.frames(4);
    const f1 = await fx("__h");
    await t.eval("__h._feint = false; __h.setMode('windup', 6); 0");
    await t.frames(4);
    const h1 = await fx("__h");
    t.check("B6 a bandit's feint does not flash (the flash never lies); his real blow - red", f1.ghosts === 0 && h1.vis === 4 && h1.col && h1.col[1] < 120, { f1, h1 });
    await clear();
    await t.eval(`(function(){ const h = Humans.spawn("mercenary", ${cx + 2}, ${cy}, { engaged: true, noSurrender: true }); h._frozen = true; h._blow = "heavy"; h._feint = false; h.setMode("windup", 6); window.__m = h; return 0; })()`);
    await t.frames(4);
    const m1 = await fx("__m");
    await clear();
    await t.eval(`(function(){ let c = Creatures.spawn("zbroja", ${cx + 2}, ${cy}, { engaged: true, level: 3 }); if (Array.isArray(c)) c = c[0]; c._frozen = true; c._engaged = true; c._move = "over"; c.setMode("windup", 6); window.__z = c; return 0; })()`);
    await t.frames(4);
    const z1 = await fx("__z");
    t.check("B6 the mercenary's overhead blow and an empty armour's (both break the guard): white-gold", m1.vis === 4 && m1.col && m1.col[2] > 120 && z1.vis === 4 && z1.col && z1.col[2] > 120, { m1, z1 });

    await clear();
    await t.eval(`(function(){ const a = Hunting.spawn("boar", ${cx + 2}, ${cy}); a._frozen = true; a._engaged = true; a.setMode("charge", 240); window.__bo = a; return 0; })()`);
    await t.frames(4);
    const bo1 = await fx("__bo");
    t.check("B6 the boar's charge: white-gold (no guard, no parry holds it - a roll aside)", bo1.vis === 4 && bo1.col && bo1.col[2] > 120 && bo1.tells.some(x => x.kind === "boar" && x.heavy), bo1);

    // ---- B7: the perfect parry, for everyone: the steel, the sparks, the slowed moment, the foe reels, the counter
    await home(6, true);
    await boar(1, 0, true);
    await t.eval(`(function(){ const a = Hunting.spawn("wolf", ${cx + 2}, ${cy + 1}); a._frozen = true; a._engaged = true; window.__w = a; return 0; })()`);
    await t.frames(4);
    const par = await t.json(`(function(){ window.__se = []; const a = Combat.act; a.mode = "block"; a.blockT = 0; const r = Combat.hitPlayer({ damage: 12, poise: 30, from: { x: __w.centerX(), y: __w.centerY() }, attacker: __w, name: "wilk" });
        const F = Tawerna.api("Combat_parts").fight; return { r, slow: F.slowNow(), counter: a.counterT, stun: __w._stun, words: F.floaters.map(f => f.text), se: window.__se.slice(), hp: $gameParty.leader().hp, mhp: $gameParty.leader().mhp }; })()`);
    t.check("B7 P just before the bite: 'Idealne parowanie!', the steel (Parry + Sword4), the world slowed (~0.25 s), the wolf reels, a counter waits (1 s)",
        par.r === "parried" && par.words.includes("Idealne parowanie!") && par.se.includes("Parry") && par.se.includes("Sword4") && par.slow >= 10 && par.stun > 0 && par.counter === 60 && par.hp === par.mhp, par);
    await t.eval("Combat.act.mode = 'idle'; $gamePlayer.setDirection(6); $gamePlayer._heroDir8 = 6; Combat.feel.setTarget(__b); window.__rnd = Math.random; Math.random = () => 0.99; 0");   // (no critical blow by chance)
    await t.frames(16);
    const hpC = await t.eval("__b._hp");
    await t.key("O");
    await t.until(`__b._hp < ${hpC}`, 3, 30);
    const cnt = await t.json(`({ dmg: ${hpC} - __b._hp, plain: Math.round(Combat.MELEE[Combat.handMelee()].dmg * Combat.strMult() * (1 + Combat.perk("melee.dmg"))), boosted: Math.round(Combat.MELEE[Combat.handMelee()].dmg * 1.3 * Combat.strMult() * (1 + Combat.perk("melee.dmg"))), words: Tawerna.api("Combat_parts").fight.floaters.map(f => f.text), counter: Combat.act.counterT })`);
    await t.eval("Math.random = window.__rnd; 0");
    t.check("B7 ... the next blow within the second: 'Kontratak!', 30% more (the club: 13 -> 17)", cnt.dmg === cnt.boosted && cnt.dmg > cnt.plain && cnt.words.includes("Kontratak!") && cnt.counter === 0, cnt);
    await t.frames(30);
    // with the skill Kontra: two seconds and a critical blow
    await t.eval("Combat.hero().skills.riposte = 1; Combat.hero().rev = (Combat.hero().rev || 0) + 1; Combat.act.mode = 'block'; Combat.act.blockT = 0; Combat.hitPlayer({ damage: 12, poise: 30, from: { x: __w.centerX(), y: __w.centerY() }, attacker: __w, name: 'wilk' }); 0");
    const rip = await t.json("({ rip: Combat.act.riposteT, counter: Combat.act.counterT, text: Combat.SKILLS.find(s => s.id === 'riposte').text })");
    await t.eval("delete Combat.hero().skills.riposte; Combat.hero().rev++; Combat.act.mode = 'idle'; Combat.act.riposteT = 0; 0");
    t.check("B7 the skill Kontra: 2 s (120 frames) and a critical blow instead of the plain counter; its text says how it is stronger", rip.rip === 120 && rip.counter === 0 && /1 sekundy/.test(rip.text) && /2 sekundy/.test(rip.text), rip);

    // ---- B8: the hit: a crisp white figure 3 frames; the sound by the weapon and what it struck
    await home(6, true);
    await boar(1, 0, true);
    await t.frames(4);
    await t.eval(`(function(){ window.__wh = []; const _u = Scene_Map.prototype.update; window.__restoreU = () => { Scene_Map.prototype.update = _u; };
        Scene_Map.prototype.update = function() { _u.call(this); if (__b._sprite) __wh.push(__b._sprite.getBlendColor()[3]); }; return 0; })()`);
    await t.eval("$gameParty.gainItem($dataItems[156], 1); $gameSystem._combatHand = 'm156'; Combat.resetAct(); 0");
    await t.key("O");
    await t.until("Combat.act.mode === 'idle'", 3, 30);
    const wh = await t.json("__wh");
    await t.eval("__restoreU(); 0");
    const full = wh.filter(v => v === 255).length, first = wh.indexOf(255);
    t.check("B8 a blow lands: the boar pure white for 3 frames, then the white fades", full === 3 && wh[first + 3] < 255 && wh[first + 3] > 0, { wh: wh.slice(Math.max(0, first - 1), first + 8) });
    t.check("B8 the club on a boar: its own thud (Blow2, flesh)", (await t.eval("Combat.act.lastHitSe")) === "Blow2:flesh", await t.eval("Combat.act.lastHitSe"));
    await clear();
    await t.eval(`(function(){ const h = Humans.spawn("bandit", ${cx + 1}, ${cy}, { engaged: true, noSurrender: true }); h._frozen = true; h._guardCd = 9999; window.__h = h; return 0; })()`);
    await t.eval("$gameParty.gainItem($dataItems[115], 1); $gameSystem._combatHand = 'm115'; Combat.resetAct(); Combat.feel.setTarget(__h); 0");
    await t.frames(4);
    await t.key("O");
    await t.until("Combat.act.mode === 'idle'", 3, 30);
    const s2 = await t.eval("Combat.act.lastHitSe");
    await clear();
    await t.eval(`(function(){ let c = Creatures.spawn("zbroja", ${cx + 1}, ${cy}, { engaged: true, level: 3 }); if (Array.isArray(c)) c = c[0]; c._frozen = true; c._engaged = true; if (c._mode === "dormant" || c._mode === "wake") c.setMode("chase"); window.__z = c; return 0; })()`);
    await t.eval("$gameSystem._combatHand = 'm156'; Combat.resetAct(); Combat.feel.setTarget(__z); 0");
    await t.frames(4);
    await t.key("O");
    await t.until("Combat.act.mode === 'idle'", 3, 30);
    const s3 = await t.eval("Combat.act.lastHitSe");
    t.check("B8 the iron axe on a bandit: a cut (Slash3, man); the club bouncing off an empty armour's front: iron (Blow3, armor)", s2 === "Slash3:man" && s3 === "Blow3:armor", { s2, s3 });

    // ---- B9: the last blow of the fight: slowed, a faint light, the camera leans in and back; not while another foe is there
    await home(6, true);
    await boar(1, 0, true);
    await boar(-3, 0, true, "__b2");
    await t.eval("$gameSystem._combatHand = 'm156'; __b._hp = 3; Combat.resetAct(); Combat.feel.setTarget(__b); 0");
    await t.frames(4);
    await t.key("O");
    await t.until("__b._dead", 3, 30);
    const notLast = await t.json("({ fin: !!Combat.feel.finale(), zoom: $gameScreen.zoomScale() })");
    await t.eval(`(function(){ __b2._dead = true; Hunting.removeAnimal(__b2); return 0; })()`);
    await t.frames(60);
    await boar(1, 0, true);
    await t.eval("__b._hp = 3; Combat.resetAct(); Combat.feel.setTarget(__b); 0");
    await t.frames(4);
    await t.eval(`(function(){ window.__fin = []; const _u = Scene_Map.prototype.update; window.__restoreU = () => { Scene_Map.prototype.update = _u; };
        Scene_Map.prototype.update = function() { _u.call(this); __fin.push([Math.round($gameScreen.zoomScale() * 1000) / 1000, Tawerna.api("Combat_parts").fight.slowNow()]); }; return 0; })()`);
    await t.key("O");
    await t.until("__b._dead", 3, 30);
    await t.frames(80);
    const fin = await t.json("__fin");
    await t.eval("__restoreU(); 0");
    const maxZ = Math.max(...fin.map(f => f[0])), slowed = fin.filter(f => f[1] > 0).length;
    t.check("B9 another boar still there: no slowing, no lean", !notLast.fin && notLast.zoom === 1, notLast);
    t.check("B9 the last boar of the fight killed: ~0.4 s slowed, the camera leans in (x1.07) and comes back to 1", slowed >= 24 && slowed <= 34 && maxZ >= 1.06 && maxZ <= 1.08 && fin[fin.length - 1][0] === 1, { slowed, maxZ, last: fin[fin.length - 1] });

    // ======================================================== C. extras
    // ---- C9: the arrows at the screen's edge
    await home(2, true);
    await t.eval(`$gameMap.setDisplayPos(${cx} - 13, ${cy} - 1); 0`);   // (the hero near the top of the screen)
    await t.eval(`(function(){ const h = Humans.spawn("bandit", ${cx + 1}, ${cy - 4}, { engaged: true, noSurrender: true }); h._frozen = true; window.__h = h; return 0; })()`);
    await t.frames(6);
    const e1 = await t.json("({ shown: SceneManager._scene._edgeArrows._shown, sy: __h._sprite ? __h._sprite.y : null })");
    await t.eval("__h._blow = 'main'; __h._feint = false; __h.setMode('windup', 20); 0");
    await t.frames(4);
    const e2 = await t.json("SceneManager._scene._edgeArrows._shown");
    await shot("walka_strzalki.png");
    t.check("C9 a bandit in the fight above the screen: a small copper arrow at the top (below the notices there) pointing at him; while he winds up a blow - red",
        e1.shown.length === 1 && e1.shown[0].kind === "bandit" && e1.shown[0].y >= 90 && e1.shown[0].y <= 100 && e1.shown[0].color === "#d08a5a" && e2.length === 1 && e2[0].color === "#ff5a3a", { e1, e2 });
    await t.eval(`$gameMap.setDisplayPos(${cx} - 13, ${cy} - 7); 0`);
    await t.frames(4);
    t.check("C9 ... on the screen: no arrow", (await t.json("SceneManager._scene._edgeArrows._shown")).length === 0);

    // ---- C10: the quick heal (H)
    await home(2, true);
    await t.eval("$gameSystem.injure(0); $gameParty.gainItem($dataItems[152], 2); $gameParty.leader().setHp(60); 0");
    const q0 = await t.json("({ wound: $gameSystem.isWounded(), band: $gameParty.numItems($dataItems[152]), breath: Combat.breath, hp: $gameParty.leader().hp })");
    await t.key("H");
    const q1 = await t.json("({ mode: Combat.act.mode, swing: $gamePlayer._toolSwing ? $gamePlayer._toolSwing._swingKind : -1 })");
    await t.until("Combat.act.mode === 'idle'", 3, 20);
    const q2 = await t.json("({ wound: $gameSystem.isWounded(), band: $gameParty.numItems($dataItems[152]), breath: Combat.breath, hp: $gameParty.leader().hp })");
    t.check("C10 H, wounded: he crouches (~0.6 s, open), binds the wound with a bandage - the wound gone, life back, breath spent",
        q0.wound && q1.mode === "heal" && q1.swing === 6 && !q2.wound && q2.band === q0.band - 1 && q2.hp > q0.hp && q0.breath - q2.breath >= 15, { q0, q1, q2 });
    await t.frames(30);
    await t.eval("$gameSystem.setStamina(40); $gameParty.gainItem($dataItems[83], 1); $gameParty.gainItem($dataItems[71], 2); 0");
    const g0 = await t.json("({ st: $gameSystem.stamina(), bread: $gameParty.numItems($dataItems[83]), potato: $gameParty.numItems($dataItems[71]) })");
    await t.key("H");
    await t.until("Combat.act.mode === 'idle'", 3, 20);
    const g1 = await t.json("({ st: $gameSystem.stamina(), bread: $gameParty.numItems($dataItems[83]), potato: $gameParty.numItems($dataItems[71]) })");
    t.check("C10 H, not wounded, tired: the best food (bread, not the potato) - strength back", g1.bread === g0.bread - 1 && g1.potato === g0.potato && g1.st > g0.st, { g0, g1 });
    await t.frames(30);
    // cut short by a blow: nothing used
    await t.eval("$gameSystem.injure(0); 0");
    const k0 = await t.eval("$gameParty.numItems($dataItems[152])");
    await t.key("H");
    await t.frames(8);
    await t.eval("Combat.hitPlayer({ damage: 5, poise: 5, from: { x: $gamePlayer._realX + 1.5, y: $gamePlayer._realY + 0.5 }, name: 'test' }); 0");
    await t.frames(40);
    const k1 = await t.json("({ band: $gameParty.numItems($dataItems[152]), mode: Combat.act.mode, wound: $gameSystem.isWounded(), words: Tawerna.api('Combat_parts').fight.floaters.map(f => f.text) })");
    t.check("C10 a blow while he binds it: cut short ('Przerwane!'), the bandage not used, still wounded", k1.band === k0 && k1.mode === "idle" && k1.wound && k1.words.includes("Przerwane!"), k1);
    // nothing to use: a popup over him
    await t.eval("$gameParty.loseItem($dataItems[152], 99); for (const it of $gameParty.items().slice()) if (it.meta && it.meta.Food) $gameParty.loseItem(it, 99); 0");
    await t.popups({ clear: true });
    await t.frames(30);
    await t.key("H");
    const noMed = await t.popups({ clear: true });
    t.check("C10 H with nothing to use: a popup over him, no crouch", noMed.some(p => /Nie masz opatrunku ani jedzenia/.test(p)) && (await t.eval("Combat.act.mode")) === "idle", noMed);
    await t.eval("$gameSystem.healWound && $gameSystem.healWound(); $gameParty.leader().recoverAll(); 0");
    t.check("C10 the combat mode's hint names H", (await t.json("Combat.feel && Tawerna.api('Combat_parts').core.COMBAT_KEYS")).includes("H leczenie"));

    // ---- C11: the training dummy
    await home(6, true);
    const def = await t.json("({ d: Farming.BUILDINGS.dummy ? { name: Farming.BUILDINGS.dummy.name, cost: Farming.BUILDINGS.dummy.cost, image: Farming.BUILDINGS.dummy.image } : null })");
    t.check("C11 the dummy is a building: 'Manekin treningowy', cheap (wood + flax), its own picture", !!def.d && def.d.name === "Manekin treningowy" && def.d.image === "Farm_Dummy" && def.d.cost.length === 2, def);
    await t.eval(`Farming.placeFree("dummy", ${cx + 1}, ${cy}); 0`);
    await t.frames(10);
    const pic = await t.json(`(function(){ const B = SceneManager._scene._spriteset._buildingSprites, e = B._sprites.find(x => x.b.type === "dummy"); return e ? { w: e.sprite.bitmap.width, h: e.sprite.bitmap.height, ready: e.sprite.bitmap.isReady() } : null; })()`);
    t.check("C11 placed beside him: its picture (48 x 72) stands there", !!pic && pic.ready && pic.w === 48 && pic.h === 72, pic);
    // the swing with its warning; P at the right moment
    const verdictBy = async (how) => {
        await t.eval(`(function(){ window.__dv = null; const d = Combat.feel.dummies()[0]; window.__dvBefore = d.verdicts.length; window.__how = ${JSON.stringify(how)}; window.__pressed = false;
            const _u = Scene_Map.prototype.update; window.__restoreU = () => { Scene_Map.prototype.update = _u; };
            Scene_Map.prototype.update = function() { _u.call(this); const d = Combat.feel.dummies()[0]; if (!d) return;
                if (__how === "perfect" && d.mode === "wind" && d.t <= 6 && !__pressed) { __pressed = true; __press(${K.P}, 0, 12); }
                if (__how === "early" && d.mode === "wind" && !__pressed) { __pressed = true; __press(${K.P}, 0, d.t + 20); }
                if (d.verdicts.length > __dvBefore && !window.__dv) window.__dv = { v: d.verdicts[d.verdicts.length - 1], tell: Combat.feel.tells().some(x => x.kind === "dummy") || window.__sawTell };
                if (d.mode === "wind" && d.t <= 14 && Combat.feel.tells().some(x => x.kind === "dummy" && x.on)) window.__sawTell = true; }; return 0; })()`);
        await t.eval("window.__sawTell = false; 0");
        await t.until("!!window.__dv", 8, 50);
        const r = await t.json("window.__dv");
        await t.eval("__restoreU(); 0");
        await t.frames(30);
        return r;
    };
    const xp0 = await t.json("(function(){ const h = Combat.hero(); let x = h.xp; for (let L = 1; L < h.level; L++) x += Combat.xpToNext(L); return x; })()");
    const vP = await verdictBy("perfect");
    const xp1 = await t.json("(function(){ const h = Combat.hero(); let x = h.xp; for (let L = 1; L < h.level; L++) x += Combat.xpToNext(L); return x; })()");
    await shot("walka_manekin_parowanie.png");
    t.check("C11 in the combat mode beside it, it leans back and swings, with the red warning; P just before: 'Idealne parowanie!' and +5 XP (the first times)",
        !!vP && vP.v === "perfect" && vP.tell && xp1 - xp0 === 5, { vP, gained: xp1 - xp0 });
    const vE = await verdictBy("early");
    const vL = await verdictBy("late");
    const words = await t.json("Tawerna.api('Combat_parts').fight.floaters.map(f => f.text)");
    t.check("C11 the guard raised long before: 'Za wcześnie'; no guard: 'Za późno' - and no harm", vE && vE.v === "early" && vL && vL.v === "late" && (await t.eval("$gameParty.leader().hp === $gameParty.leader().mhp")), { vE, vL, words });
    await t.eval("Combat.resetAct(); $gamePlayer.setDirection(6); 0");
    const hits0 = await t.json("Combat.feel.dummies()[0].hits");
    await t.key("O");
    await t.until("Combat.act.mode === 'idle'", 3, 30);
    const dh = await t.json("({ hits: Combat.feel.dummies()[0].hits, se: Combat.act.lastHitSe })");
    t.check("C11 a blow at it: it takes it (a wobble, the straw's own thud)", dh.hits === hits0 + 1 && /:straw$/.test(dh.se), dh);
    await t.eval("$gameSystem._combatMode = false; 0");
    await t.frames(200);
    t.check("C11 in the normal mode it stands still", (await t.json("Combat.feel.dummies()[0].mode")) === "idle");

    // ---- C12: the difficulty: Łatwy / Normalny / Trudny
    await home(6, true);
    const dif = await t.json(`(function(){
        const out = {}, h = Humans.spawn("bandit", ${cx + 3}, ${cy}, { engaged: true, noSurrender: true }); h._frozen = true;
        for (const [k, v] of [["easy", 0], ["normal", 1], ["hard", 2]]) {
            ConfigManager.combatDifficulty = v;
            h.startBlow("main", false);
            const a = $gameParty.leader(); a.recoverAll(); Combat.act.mode = "idle"; Combat.act.iframes = 0;
            const hp0 = a.hp; Combat.hitPlayer({ damage: 20, poise: 0, from: { x: $gamePlayer._realX + 1.5, y: $gamePlayer._realY + 0.5 }, name: "test", knock: 0 });
            out[k] = { parry: Combat.parryWindow(), windup: h._modeT, lost: hp0 - a.hp };
        }
        ConfigManager.combatDifficulty = 1; Humans.clear(); $gameParty.leader().recoverAll(); return out; })()`);
    t.check("C12 Łatwy: a wider parry window, slower wind-ups, smaller blows; Trudny: the other way (Normalny as before)",
        dif.easy.parry > dif.normal.parry && dif.normal.parry > dif.hard.parry && dif.easy.windup > dif.normal.windup && dif.normal.windup > dif.hard.windup &&
        dif.easy.lost === 14 && dif.normal.lost === 20 && dif.hard.lost === 26, dif);

    // ---- C11b: the dummy is in the Q build list on grandpa's field (Map003)
    await clear();
    t.check("C11b to grandpa's field (Map003)", await t.go(3, 22, 14, 2));
    const qList = await t.json(`(function(){ const scene = SceneManager._scene; let got = null; const _o = scene.openFarmMenu; scene.openFarmMenu = function(tt, en) { got = en.map(x => x.name); }; Farming.openBuildKeyMenu(); scene.openFarmMenu = _o; return got; })()`);
    t.check("C11b Q (build): 'Manekin treningowy' is on the list", Array.isArray(qList) && qList.includes("Manekin treningowy"), qList);

    // ---- A1b: floor 10 - the guardian waits with his riddle: no automatic combat mode there; one that came in with the hero goes off
    await t.eval("Underground.go(10); 0");
    t.check("A1b floor 10 (Map140)", await t.until(t.onMap(140), 20));
    await t.frames(20);
    const f10 = await t.json("({ held: Combat.feel.autoHeld(), guardian: !!Creatures.guardianEvent() })");
    await t.eval("Combat.setCombatMode(true, true); 0");
    await t.frames(6);
    const f10b = await t.json("({ mode: Combat.combatMode() })");
    t.check("A1b the guardian's floor holds the automatic mode (the riddle first); an automatic mode brought in goes off", f10.held && f10.guardian && f10b.mode === false, { f10, f10b });
});
