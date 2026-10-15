//=============================================================================
// Combat_Feel.js
//=============================================================================
// The fight made pleasanter, smoother and handier (2026-10-14, the user's list: "po kolei robimy, co uważasz za OK"). A: the combat mode
// switching itself on when a foe starts an attack (and off after a calm moment, when it came on by itself), the soft target (a copper
// ring under the foe the blows, the guard and the roll go by; F the next one). B: the attacks' warnings (a red or white-gold outline and
// a sound just before a blow), the last blow's slowed moment (the perfect parry, the counter, the hits' white and sounds: Combat_Fight.js
// / Combat_UI.js). C: the arrows at the screen's edge, the quick heal (H), the training dummy, the difficulty. Functions and classes
// only: Combat.js holds every engine hook and calls these (update, addLayer, addHud); Combat_Fight.js asks target(), nearestThreat(),
// diff() and busy().

/*:
 * @target MZ
 * @plugindesc Walka (część Combat.js): automatyczny tryb walki, miękkie namierzanie (F), zapowiedzi ataków, ostatni cios, strzałki przy krawędzi, szybkie leczenie (H), manekin treningowy, trudność walki. Sama nic nie robi - haki ma Combat.js. v1.0.0
 * @author Tawerna
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base Combat
 * @orderAfter Combat
 * @base Combat_Fight
 * @orderAfter Combat_Fight
 * @base Combat_UI
 * @orderAfter Combat_UI
 *
 * @help
 * ============================================================================
 * Combat_Feel.js - wygoda i czytelność walki
 * ============================================================================
 * Część Combat.js (2026-10-14). Sama nic nie robi: woła ją Combat.js.
 *
 * Automatyczny tryb walki: gdy wróg (wilk, dzik, niedźwiedź, człowiek,
 * stwór) zaczyna atak w pobliżu, gra sama włącza tryb walki i bierze do ręki
 * ostatnią broń (zapalona pochodnia zostaje w ręku - to też broń). Po ok.
 * 5 s spokoju (żadnego wroga w walce w pobliżu) sama wraca do trybu
 * normalnego - tylko wtedy, gdy tryb włączył się sam. Tab dalej przełącza
 * ręcznie; ręczne wyłączenie ma pierwszeństwo do następnego ataku. Nie
 * wybija z rozmów, menu, wydarzeń, snu ani budowania. Opcje: „Automatyczny
 * tryb walki: Wł / Wył”.
 *
 * Miękkie namierzanie: najbliższy wróg w walce w kierunku patrzenia ma pod
 * sobą subtelny miedziany krąg. Ciosy, garda i przewrót liczą się względem
 * niego (bohater sam się do niego zwraca, także po skosie). F - następny cel
 * (zgodnie z ruchem wskazówek zegara). Krąg gaśnie, gdy wróg ginie, ucieka
 * albo odejdzie dalej niż ok. 9 pól.
 *
 * Zapowiedzi ataków: tuż przed ciosem wróg błyska obrysem - ciepły czerwony
 * (da się zablokować / sparować, krótki świst) albo biało-złoty (zwykła garda
 * nie wystarczy: łapa i skok niedźwiedzia, cios łamiący gardę, szarża, krąg,
 * „prawda”; niski dzwon). Markowany cios nie błyska.
 * Idealne parowanie (Combat_Fight.js): dźwięk stali, iskry, ok. 0,25 s
 * zwolnienia, wróg się zatacza, 1 s na kontratak (+30%); Kontra: 2 s i cios
 * krytyczny. Ostatni cios walki: ok. 0,4 s zwolnienia i lekkie przybliżenie.
 *
 * Strzałki przy krawędzi ekranu: wróg w walce poza ekranem - mała strzałka
 * (miedziana; czerwona / biało-złota, gdy szykuje cios).
 * H - szybkie leczenie (tylko w trybie walki): opatrunek, gdy jest rana albo
 * mało życia, inaczej najlepsze jedzenie; ok. 0,6 s przykucnięcia bez obrony
 * (cios przerywa - nic nie zużyte), kosztuje oddech. Brak środka: dymek.
 * Manekin treningowy (Farming_Data.js „dummy”, menu budowy Q): w trybie walki
 * obok niego powoli się zamachuje z zapowiedzią; mówi „Idealne parowanie!”,
 * „Za wcześnie”, „Za późno” albo „Unik!”; nie rani; pierwsze 5 idealnych
 * parowań daje po 5 doświadczenia.
 * Trudność walki (Opcje): Łatwy - okno parowania x1,5, zamachy wrogów x1,3
 * dłuższe, ich ciosy x0,7; Trudny - x0,75, x0,85, x1,3; Normalny - jak dotąd.
 *
 * KOLEJNOŚĆ: Skills_Data, Combat, Combat_Fight, Combat_UI, Combat_Feel.
 * Dopóki nie jest wpisana na listę wtyczek, Combat.js wczytuje ją sam.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Combat_Feel.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const P = T.api("Combat_parts") || T.register("Combat_parts", {});
    if (P.feel) return;   // (put into the page twice: kept as it was)
    if (!P.core || !P.fight || !P.ui) throw new Error("Combat_Feel.js: musi być pod Combat.js, Combat_Fight.js i Combat_UI.js na liście wtyczek (one of them is missing or below)");
    const { modes, combatMode, setCombatMode, mapFreePlay, se, foes, option } = P.core;
    const { act, px, py, setHand, facingVec } = P.fight;
    const H = () => T.api("Hunting");

    const tw = () => $gameMap.tileWidth(), th = () => $gameMap.tileHeight();
    const toScreenX = x => Math.round($gameMap.adjustX(x - 0.5) * tw() + tw() / 2);
    const toScreenY = y => Math.round($gameMap.adjustY(y - 0.5) * th() + th() / 2);
    const distTo = (x, y) => Math.hypot(x - px(), y - py());
    // a foe's size (tiles): Hunting's species, a man's or a creature's own
    function radiusOf(a) {
        const Hn = H(), sp = Hn && Hn.SPECIES && typeof a.kind === "function" ? Hn.SPECIES[a.kind()] : null;
        return (sp && sp.radius) || (a._def && a._def.radius) || a._radius || 0.5;
    }
    const keyWas = {};
    function pressedNow(name) {
        const now = Input.isPressed(name), was = !!keyWas[name];
        keyWas[name] = now;
        return now && !was;
    }

    // ==================================================================
    // The foes in a fight with the hero (Combat.foes(): Hunting.js's animals, Humans.js's men, Creatures.js's creatures). Each family
    // says it itself: isThreat() - it fights him; combatTell() - an attack on the way: { t: frames till it lands, heavy: no plain guard
    // holds it }. One without them: engaged and not running or kneeling.
    // ==================================================================
    const SCAN = { far: 18 };
    let threats = [];   // [{ a, d, tell }] this frame, the nearest first
    function isThreat(a) {
        if (!a || a._dead) return false;
        if (typeof a.isThreat === "function") return !!a.isThreat();
        return !!a._engaged && !a._surrendered && !a._fleeing;
    }
    const tellOf = a => (typeof a.combatTell === "function" ? a.combatTell() : null);
    function scan() {
        let list = [];
        try { list = foes(); } catch (e) { list = []; }
        const out = [];
        for (const a of list) {
            if (!isThreat(a)) continue;
            const d = distTo(a.centerX(), a.centerY());
            if (d > SCAN.far) continue;
            out.push({ a, d, tell: tellOf(a) });
        }
        out.sort((p, q) => p.d - q.d);
        threats = out;
    }
    // the foe whose blow comes first, within r tiles: { ref, x, y } (the guard turns to it - Combat_Fight.js updateBlock)
    function nextBlow(r) {
        let best = null;
        for (const t of threats) if (t.tell && t.d <= r && (!best || t.tell.t < best.tell.t)) best = t;
        return best ? { ref: best.a, x: best.a.centerX(), y: best.a.centerY() } : null;
    }
    // the nearest foe in a fight within r tiles: { ref, x, y } (the roll without the arrows springs away from it)
    function nearestThreat(r) {
        const t = threats.find(x => x.d <= r);
        return t ? { ref: t.a, x: t.a.centerX(), y: t.a.centerY() } : null;
    }

    // ==================================================================
    // 1. The automatic combat mode. A foe within AUTO.near tiles starts an attack (its combatTell appears), or a blow reaches the hero:
    // the combat mode comes on by itself (the weapon he fought with last in hand; a burning torch stays - it is a weapon) - not in a
    // talk, a menu, an event, the night's sleep (the screen dark, the hero held) or while placing a building: then the moment it is calm
    // again, while the fight is still near. Back to the normal mode after AUTO.calm frames with no foe in a fight within AUTO.far tiles -
    // only when it came on by itself (the hero's own Tab stays). The hero's own Tab "off" holds till a new attack starts.
    // ==================================================================
    // calm: the frames of calm before the normal mode comes back when the foes only stopped (alive, gone a little off); quick: when the
    // last of them died, ran or knelt (2026-10-14: then O dresses the carcass at once)
    const AUTO = { near: 8, far: 12, calm: 300, quick: 60 };
    let autoAllowed = true;   // (tests: Combat.feel.auto(false) - the kit's quiet mode keeps the old behaviour)
    const autoOn = () => autoAllowed && option("auto") !== false;
    let calmT = 0, manualOff = false, pendingOn = false, hitNow = false, prevTell = new Set(), lastNear = [], endQuick = false, heldBefore = false;
    // Encounters that begin with a talk or a riddle (2026-10-14, the user's): no automatic combat mode there - a map note <AutoWalka:off>,
    // a foe with _noAutoCombat (its attacks do not switch it on), or what another plugin says (Combat.feel.holdAuto(fn): Creatures.js -
    // the tenth gate's guardian waiting with his riddle). An automatic mode there goes off at once; and before any map event with a talk
    // (a message, a choice - or <AutoWalka:off> in its note) starts, an automatic mode goes off (beforeEvent: Combat.js's Game_Event hook)
    const holds = [];
    function autoHeld() {
        const tag = $gameMap && T.mapTag ? T.mapTag("AutoWalka") : null;
        if (tag && /^(off|wył|wyl|nie)$/i.test(String(tag.raw === undefined ? "" : tag.raw).trim())) return true;
        for (const fn of holds) { try { if (fn()) return true; } catch (e) { /* a source that failed: not held */ } }
        return false;
    }
    const TALK_CODES = [101, 102];
    function beforeEvent(ev) {
        if (!combatMode() || !modes().auto || !ev) return false;
        const list = typeof ev.list === "function" ? ev.list() || [] : [], data = typeof ev.event === "function" ? ev.event() : null;
        const talk = list.some(c => c && TALK_CODES.includes(c.code)) || /<AutoWalka:(off|wył|nie)>/i.test((data && data.note) || "");
        if (!talk) return false;
        setCombatMode(false, true);
        return true;
    }
    T.on("combatMode", e => {
        if (!e.auto && !e.on) manualOff = true;   // (Tab off: the hero's word - till a new attack)
        if (e.on) pendingOn = false;
        calmT = 0;
    }, { owner: "Combat" });
    T.on("heroHit", e => { if (e.result !== "dodged") hitNow = true; }, { owner: "Combat" });
    const SWITCH_CALM = { only: ["onMap", "sceneChange", "transfer", "message", "event", "farmMenu", "build", "miniGame", "fade", "lock"] };
    const canSwitch = () => T.isCalm(null, SWITCH_CALM);
    function switchOn() {
        const Tc = T.api("Torch");
        if (Tc && Tc.inHand && Tc.inHand()) setHand("m59");   // (the burning torch stays in his hand)
        setCombatMode(true, true);
    }
    function updateAuto() {
        let start = hitNow;
        hitNow = false;
        const now = new Set();
        for (const t of threats) if (t.tell && t.d <= AUTO.near && !t.a._noAutoCombat) { now.add(t.a); if (!prevTell.has(t.a)) start = true; }
        prevTell = now;
        const held = autoHeld();
        if (heldBefore && !held && now.size) start = true;   // (the hold over while an attack goes on: as a new one)
        heldBefore = held;
        if (start) {   // a new attack: the hero's own "off" is over
            manualOff = false;
            if (autoOn() && !held && !combatMode()) pendingOn = true;
        }
        const nearList = threats.filter(t => t.d <= AUTO.far).map(t => t.a), near = nearList.length > 0;
        // the fight over: how - the last foes dead, run off or kneeling (quick), or only no longer at him (the full calm)
        if (near) { lastNear = nearList; endQuick = false; }
        else if (lastNear.length) {
            endQuick = lastNear.every(a => a._dead || a._dying || a._fleeing || a._surrendered || ["flee", "leave", "surrender"].includes(a._mode));
            lastNear = [];
        }
        if (!near || held) pendingOn = false;
        if (pendingOn && !manualOff && canSwitch()) { pendingOn = false; switchOn(); }
        if (combatMode() && modes().auto && held && canSwitch()) { setCombatMode(false, true); return; }   // (a talk or a riddle comes here first)
        if (combatMode() && modes().auto && autoOn()) {
            const Hn = H(), busy = near || act.mode !== "idle" || act.stun > 0 || !!(Hn && Hn.aim);
            calmT = busy ? 0 : calmT + 1;
            if (calmT >= (endQuick ? AUTO.quick : AUTO.calm) && canSwitch()) { calmT = 0; endQuick = false; setCombatMode(false, true); }
        } else calmT = 0;
    }

    // ==================================================================
    // 2. The soft target: of the foes in a fight within TARGET.pick tiles, the one nearest and most in front of the hero (or the training
    // dummy near him) gets a copper ring under its feet. The blows, the guard and the roll go by it (Combat_Fight.js: autoFace, rollWay,
    // updateBlock, faceAfterRoll). It keeps its target while it lives, fights and stays within TARGET.keep tiles; every TARGET.recheck
    // frames a clearly better one (TARGET.switchBy) takes over - not for TARGET.hold frames after F picked one. F: the next one round him
    // (clockwise).
    // ==================================================================
    const TARGET = { pick: 6.5, keep: 9, recheck: 15, hold: 240, switchBy: 0.8 };
    let target = null, manualT = 0, targetT = 0, snapT = 0;
    const posOf = ref => ({ x: ref.centerX(), y: ref.centerY() });
    function score(ref) {
        const [fx, fy] = facingVec(), p = posOf(ref), dx = p.x - px(), dy = p.y - py(), d = Math.hypot(dx, dy) || 0.01;
        return d + (1 - (dx * fx + dy * fy) / d) * 2;
    }
    // (stage C: the training dummies near him join the list)
    const DUMMY = { target: 4 };
    let dummyRefs = () => [];
    function candidates() {
        const out = threats.filter(t => t.d <= TARGET.pick).map(t => t.a);
        for (const d of dummyRefs()) if (distTo(d.centerX(), d.centerY()) <= DUMMY.target) out.push(d);
        return out;
    }
    function stillGood(ref) {
        if (!ref || ref._dead) return false;
        if (ref._dummy) return dummyRefs().includes(ref) && distTo(ref.centerX(), ref.centerY()) <= DUMMY.target + 1.5;
        return isThreat(ref) && distTo(ref.centerX(), ref.centerY()) <= TARGET.keep;
    }
    function setTarget(ref, manual) {
        if (ref !== target) snapT = 10;
        target = ref;
        if (manual) manualT = TARGET.hold;
    }
    function updateTarget() {
        if (!combatMode()) { target = null; manualT = 0; return; }
        if (target && !stillGood(target)) target = null;
        if (manualT > 0) manualT--;
        if (snapT > 0) snapT--;
        if (target && ++targetT % TARGET.recheck !== 0) return;
        const list = candidates();
        if (!list.length) { target = null; return; }
        let best = list[0], bs = score(best);
        for (const r of list) { const s = score(r); if (s < bs) { bs = s; best = r; } }
        if (!target) setTarget(best);
        else if (manualT <= 0 && best !== target && bs < score(target) - TARGET.switchBy) setTarget(best);
    }
    // F: the next foe round him, clockwise from the one in the ring (from where he looks, with none); a soft click
    function nextTarget() {
        const list = candidates();
        if (!list.length) { se("Cursor1", 35, 70); return false; }
        const TWO = Math.PI * 2, ang = r => { const p = posOf(r); return Math.atan2(p.y - py(), p.x - px()); };
        const [fx, fy] = facingVec(), a0 = target ? ang(target) : Math.atan2(fy, fx);
        const gap = r => (r === target ? TWO : ((ang(r) - a0) % TWO + TWO) % TWO);
        setTarget(list.slice().sort((p, q) => gap(p) - gap(q))[0], true);
        se("Cursor2", 50, 125);
        return true;
    }
    // { ref, x, y } of the soft target, or null
    function targetInfo() {
        if (!target || !combatMode()) return null;
        const p = posOf(target);
        return { ref: target, x: p.x, y: p.y };
    }

    // the ring: a thin copper ellipse on the ground with four small notches, a dark edge under it; it snaps in when the target changes and
    // breathes slowly (no light - it does not glow)
    const RING = { color: "#d08a5a", dark: "rgba(24,14,8,0.62)", alpha: [150, 215], beat: 90, snap: 0.35 };
    const ringCache = {};
    function ringBitmap(r) {
        if (ringCache[r]) return ringCache[r];
        const rx = r, ry = Math.max(6, Math.round(r * 0.42)), w = rx * 2 + 12, h = ry * 2 + 12, b = new Bitmap(w, h), c = b.context, cx = w / 2, cy = h / 2;
        const ell = (lw, col) => { c.lineWidth = lw; c.strokeStyle = col; c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); c.stroke(); };
        const tick = (x0, y0, x1, y1) => {
            for (const [lw, col] of [[3.5, RING.dark], [1.6, RING.color]]) { c.lineWidth = lw; c.strokeStyle = col; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
        };
        ell(3.2, RING.dark);
        ell(1.5, RING.color);
        tick(cx - rx - 4, cy, cx - rx + 4, cy);
        tick(cx + rx + 4, cy, cx + rx - 4, cy);
        tick(cx, cy - ry - 4, cx, cy - ry + 3);
        tick(cx, cy + ry + 4, cx, cy + ry - 3);
        b._baseTexture.update();
        return (ringCache[r] = b);
    }
    function Sprite_TargetRing() { this.initialize(...arguments); }
    Sprite_TargetRing.prototype = Object.create(Sprite.prototype);
    Sprite_TargetRing.prototype.constructor = Sprite_TargetRing;
    Sprite_TargetRing.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this.anchor.set(0.5, 0.5);
        this.z = 1.55;   // (on the ground: under every character, over the floor)
        this.visible = false;
        this._r = 0;
    };
    Sprite_TargetRing.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const t = targetInfo();
        this.visible = !!t && !$gameMessage.isBusy();
        if (!this.visible) return;
        const r = Math.round(Math.max(14, Math.min(46, radiusOf(t.ref) * tw() * (t.ref._dummy ? 0.6 : 0.8))));
        if (r !== this._r) { this._r = r; this.bitmap = ringBitmap(r); }
        this.x = toScreenX(t.x);
        this.y = toScreenY(t.y) + Math.round(th() * 0.38);
        const k = snapT / 10, beat = 0.5 + 0.5 * Math.cos(Graphics.frameCount * 2 * Math.PI / RING.beat);
        this.scale.set(1 + RING.snap * k, 1 + RING.snap * k);
        this.opacity = Math.round(RING.alpha[0] + (RING.alpha[1] - RING.alpha[0]) * beat);
    };

    // ==================================================================
    // 6. The attacks' warnings (stage B). Just before an attack lands (its combatTell: TELE.lead frames or less to go) the foe flashes
    // a moment: a warm red outline when a guard holds it (a block, a parry), a white-gold one when no plain guard does (the bear's paw
    // and pin, a blow that breaks the guard, a charge, a ring on the floor, a truth) - a roll or a step aside then. With it a short sound:
    // a swish (Wind4), or a low bell for the white-gold (Bell3). The same for the animals, the men and the creatures; a feint never
    // flashes (Humans.js: no tell). The outline: four copies of its own picture a few pixels round it, in the colour, under it.
    // The first wolf's leap of a game also says, over the hero, how to parry it (once).
    // ==================================================================
    const TELE = { lead: 16, rise: 4, fade: 8, off: 2, alpha: 215, red: [255, 84, 46], gold: [255, 236, 156], se: ["Wind4", 50, 150], seHeavy: ["Bell3", 42, 70] };
    const tellFx = new Map();   // foe -> { heavy, on, k (0..1 - the outline's strength), n (the attacks flashed) }
    const panOf = x => Math.max(-80, Math.min(80, Math.round((x - px()) * 12)));
    function updateTells() {
        const seen = new Set(), dummies = dummyRefs().map(r => ({ a: r, d: distTo(r.centerX(), r.centerY()), tell: r.combatTell() }));
        for (const t of threats.concat(dummies)) {
            const tl = t.tell;
            if (!tl || tl.t > TELE.lead) continue;
            seen.add(t.a);
            let e = tellFx.get(t.a);
            if (!e) { e = { heavy: false, on: false, k: 0, n: 0 }; tellFx.set(t.a, e); }
            e.heavy = !!tl.heavy;
            if (!e.on) {   // (a new attack: its sound)
                e.on = true;
                e.n++;
                const [name, vol, pitch] = e.heavy ? TELE.seHeavy : TELE.se;
                T.audio.se(name, { volume: vol, pitch, pan: panOf(t.a.centerX()) });
                firstWolfHint(t.a);
            }
        }
        for (const [a, e] of tellFx) {
            if (!seen.has(a)) e.on = false;
            e.k = e.on ? Math.min(1, e.k + 1 / TELE.rise) : Math.max(0, e.k - 1 / TELE.fade);
            if (!e.on && e.k <= 0 && (a._dead || !threats.some(t => t.a === a))) tellFx.delete(a);
        }
    }
    function firstWolfHint(a) {
        if (typeof a.kind !== "function" || a.kind() !== "wolf") return;
        const m = modes();
        if (m.hintWolf) return;
        m.hintWolf = true;
        P.core.popup(0, "P tuż przed ugryzieniem = parowanie", "#fff2b0");
    }
    // the outlines: a sprite in the tilemap that keeps the copies of each flashing foe's picture (right under it, as its own children
    // can't be: they have to sort with the characters)
    function Sprite_TellLayer() { this.initialize(...arguments); }
    Sprite_TellLayer.prototype = Object.create(Sprite.prototype);
    Sprite_TellLayer.prototype.constructor = Sprite_TellLayer;
    Sprite_TellLayer.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this._ghosts = new Map();   // foe -> [Sprite x4]
    };
    const OFFS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    Sprite_TellLayer.prototype.update = function() {
        Sprite.prototype.update.call(this);
        for (const [a, list] of this._ghosts) if (!tellFx.has(a) || !a._sprite || !a._sprite.parent) this.drop(a);
        for (const [a, e] of tellFx) {
            const sp = a._sprite;
            if (!sp || !sp.parent || !sp.bitmap || !sp.visible || e.k <= 0) { this.drop(a); continue; }
            let list = this._ghosts.get(a);
            if (!list) {
                list = OFFS.map(() => { const g = new Sprite(); sp.parent.addChild(g); return g; });
                this._ghosts.set(a, list);
            }
            const col = e.heavy ? TELE.gold : TELE.red, f = sp._frame;
            const beat = 0.85 + 0.15 * Math.sin(Graphics.frameCount * 0.9);
            list.forEach((g, i) => {
                if (g.parent !== sp.parent) sp.parent.addChild(g);
                if (g.bitmap !== sp.bitmap) g.bitmap = sp.bitmap;
                g.setFrame(f.x, f.y, f.width, f.height);
                g.anchor.set(sp.anchor.x, sp.anchor.y);
                g.scale.set(sp.scale.x, sp.scale.y);
                g.rotation = sp.rotation;
                g.x = sp.x + OFFS[i][0] * TELE.off;
                g.y = sp.y + OFFS[i][1] * TELE.off;
                g.z = sp.z - 0.01;   // (under the foe: only the rim shows)
                g.spriteId = sp.spriteId - 0.5;
                g.setBlendColor([col[0], col[1], col[2], 255]);
                g.opacity = Math.round(TELE.alpha * e.k * beat * (sp.opacity / 255));
                g.visible = true;
            });
        }
    };
    Sprite_TellLayer.prototype.drop = function(a) {
        const list = this._ghosts.get(a);
        if (!list) return;
        for (const g of list) { if (g.parent) g.parent.removeChild(g); g.destroy(); }
        this._ghosts.delete(a);
    };

    // ==================================================================
    // 8. The last blow of a fight (stage B): the hero's blow or shot kills the last foe in the fight near him - the world slows for
    // ~0.4 s (Combat_Fight's slowMotion), a faint light flash, and the camera leans in a little on him (the engine's screen zoom,
    // FINALE.zoom times what it was) and back. Not for a hare or a deer (no fight), not when another foe is still at him.
    // ==================================================================
    const FINALE = { zoom: 1.07, in: 10, hold: 34, out: 24 };
    let finale = null;   // { t, base, x, y }
    T.on("kill", e => {
        if (!e || e.by !== "hero" || !e.animal || !$gamePlayer) return;
        if (!threats.some(t => t.a === e.animal)) return;
        if (threats.some(t => t.a !== e.animal && t.d <= AUTO.far && isThreat(t.a))) return;
        startFinale();
    }, { owner: "Combat" });
    function startFinale() {
        const F = P.fight;
        F.slowMotion(F.SLOW.finale, 2);
        $gameScreen.startFlash([255, 248, 230, 48], 14);
        T.emit("fightWon", { at: Graphics.frameCount });
        if ($gameScreen._zoomDuration > 0) return;   // (a map's own zoom on its way: no lean)
        const base = $gameScreen.zoomScale(), x = $gamePlayer.screenX(), y = $gamePlayer.screenY() - 24;
        finale = { t: 0, base, x, y };
        $gameScreen.startZoom(x, y, base * FINALE.zoom, FINALE.in);
    }
    function updateFinale() {
        if (!finale) return;
        finale.t++;
        if (finale.t === FINALE.hold) $gameScreen.startZoom(finale.x, finale.y, finale.base, FINALE.out);
        if (finale.t > FINALE.hold + FINALE.out) finale = null;
    }
    T.on("mapLeave", () => { if (finale) { $gameScreen.setZoom(finale.x, finale.y, finale.base); finale = null; } tellFx.clear(); }, { owner: "Combat" });

    // ==================================================================
    // 12. The difficulty of the fight (stage C; Opcje: "Trudność walki", Combat.js keeps it in the config). Łatwy: a wider parry
    // window, slower wind-ups (Hunting_AI.js, Humans.js, Creatures.js ask windupK()), smaller blows of the foes; Trudny: the other way.
    // ==================================================================
    const DIFF = [
        { name: "Łatwy", parry: 1.5, windup: 1.3, dmg: 0.7 },
        { name: "Normalny", parry: 1, windup: 1, dmg: 1 },
        { name: "Trudny", parry: 0.75, windup: 0.85, dmg: 1.3 }
    ];
    const diff = () => DIFF[option("diff")] || DIFF[1];
    const windupK = () => diff().windup;

    // ==================================================================
    // 9. The arrows at the screen's edge (stage C): a foe in a fight that the screen does not show (an archer far off, a wolf behind
    // him) - a small arrow at the edge, pointing at it: copper while it only fights, warm red while it winds up a blow a guard holds,
    // white-gold for one no guard holds; it breathes while the blow comes.
    // ==================================================================
    // inset: from the screen's sides and bottom; top: below the notices at the top (a goal done, the map's name, the experience)
    const EDGE = { inset: 22, top: 96, out: 10, max: 8, size: 20, copper: "#d08a5a", red: "#ff5a3a", gold: "#ffe8a0", dark: "rgba(16,10,6,0.85)" };
    const arrowCache = {};
    function arrowBitmap(color) {
        if (arrowCache[color]) return arrowCache[color];
        const s = EDGE.size, b = new Bitmap(s, s), c = b.context;
        const tri = () => { c.beginPath(); c.moveTo(s - 3, s / 2); c.lineTo(4, 3); c.lineTo(8, s / 2); c.lineTo(4, s - 3); c.closePath(); };
        tri(); c.lineWidth = 3; c.strokeStyle = EDGE.dark; c.stroke();
        tri(); c.fillStyle = color; c.fill();
        b._baseTexture.update();
        return (arrowCache[color] = b);
    }
    function Sprite_EdgeArrows() { this.initialize(...arguments); }
    Sprite_EdgeArrows.prototype = Object.create(Sprite.prototype);
    Sprite_EdgeArrows.prototype.constructor = Sprite_EdgeArrows;
    Sprite_EdgeArrows.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this._pool = [];
        this._shown = [];   // (the tests: [{ kind, x, y, color }])
    };
    // where a map point (tiles) is on the screen: the tilemap's place, the screen's zoom
    function onScreen(x, y) {
        const z = $gameScreen.zoomScale(), sx = toScreenX(x), sy = toScreenY(y);
        return { x: z * sx - $gameScreen.zoomX() * (z - 1), y: z * sy - $gameScreen.zoomY() * (z - 1) };
    }
    Sprite_EdgeArrows.prototype.update = function() {
        Sprite.prototype.update.call(this);
        const W = Graphics.width, Hh = Graphics.height, cx = W / 2, cy = Hh / 2, out = [];
        const show = !!$gamePlayer && !$gameMessage.isBusy() && !$gameTemp._farmMenuOpen && !$gameTemp._buildMode;
        if (show) {
            for (const t of threats) {
                if (out.length >= EDGE.max) break;
                const p = onScreen(t.a.centerX(), t.a.centerY() - 0.4);
                if (p.x >= -EDGE.out && p.x <= W + EDGE.out && p.y >= -EDGE.out && p.y <= Hh + EDGE.out) continue;
                const ang = Math.atan2(p.y - cy, p.x - cx), dx = Math.cos(ang), dy = Math.sin(ang);
                const kx = (W / 2 - EDGE.inset) / Math.max(1e-6, Math.abs(dx)), ky = (dy < 0 ? Hh / 2 - EDGE.top : Hh / 2 - EDGE.inset) / Math.max(1e-6, Math.abs(dy));
                const k = Math.min(kx, ky);
                const tl = t.tell && t.tell.t <= TELE.lead * 3 ? t.tell : null;
                out.push({ a: t.a, x: cx + dx * k, y: cy + dy * k, ang, color: tl ? (tl.heavy ? EDGE.gold : EDGE.red) : EDGE.copper, pulse: !!tl });
            }
        }
        while (this._pool.length < out.length) { const s = new Sprite(); s.anchor.set(0.5, 0.5); this.addChild(s); this._pool.push(s); }
        this._pool.forEach((s, i) => {
            const o = out[i];
            s.visible = !!o;
            if (!o) return;
            s.bitmap = arrowBitmap(o.color);
            s.x = Math.round(o.x);
            s.y = Math.round(o.y);
            s.rotation = o.ang;
            const beat = o.pulse ? 0.75 + 0.25 * Math.sin(Graphics.frameCount * 0.5) : 1;
            s.opacity = Math.round(225 * beat);
            s.scale.set(o.pulse ? 1.15 : 1, o.pulse ? 1.15 : 1);
        });
        this._shown = out.map(o => ({ kind: o.a.kind ? o.a.kind() : "?", x: Math.round(o.x), y: Math.round(o.y), color: o.color }));
    };

    // ==================================================================
    // 10. The quick heal (stage C): H in the combat mode - the best bandage when he is wounded or low on life (under HEAL.low), else the
    // food that gives the most strength (only what would do something now). A short crouch (~0.6 s, HEAL.frames) in which he is open:
    // no guard, no roll, no blow - a blow that reaches him cuts it short and the bandage or the food is not used. It costs breath.
    // Nothing to use: a popup over him.
    // ==================================================================
    const HEAL = { frames: 36, breath: 18, low: 0.4, kind: 6 };
    let healing = null;   // { item, kind }
    const hpRatio = () => { const a = $gameParty.leader(); return a && a.mhp > 0 ? a.hp / a.mhp : 1; };
    const isBandage = it => !!(it && it.meta && it.meta.Bandage);
    function foodGain(it) {
        const FT = window.FoodTable, info = FT && FT.eatInfo ? FT.eatInfo(it) : null;
        return info ? (info.stamina || 0) + (info.fed || 0) * 0.2 : 0;
    }
    function healChoice() {
        const wounded = typeof $gameSystem.isWounded === "function" && $gameSystem.isWounded(), low = hpRatio() < HEAL.low;
        const items = $gameParty.items().filter(it => DataManager.isItem(it));
        const bandage = items.find(isBandage);
        if ((wounded || low) && bandage) return { item: bandage, kind: "bandage" };
        const foods = items.filter(it => foodGain(it) > 0);
        const usable = foods.filter(it => $gameParty.canUse(it)).sort((p, q) => foodGain(q) - foodGain(p));
        if (usable.length) return { item: usable[0], kind: "food" };
        if (wounded || low) return { none: true, icon: $dataItems[152] ? $dataItems[152].iconIndex : 0, text: "Nie masz opatrunku ani jedzenia" };
        if (foods.length) return { none: true, icon: foods[0].iconIndex, text: "Jesteś cały - nie ma czego leczyć" };
        return { none: true, icon: 0, text: "Nie masz nic do jedzenia ani opatrunku" };
    }
    function pressHeal() {
        const F = P.fight;
        if (act.mode !== "idle" || act.stun > 0 || $gamePlayer._toolSwing) return false;
        const c = healChoice();
        if (c.none) { P.core.popup(c.icon, c.text, "#ff9f8f"); return false; }
        if (!F.spendBreath(HEAL.breath)) return false;
        healing = c;
        act.mode = "heal";
        act.combatT = Math.max(act.combatT, 300);
        const CT = T.api("ChoppableTree"), def = CT && CT.swingKind ? CT.swingKind(HEAL.kind) : null;
        const started = !!def && $gamePlayer.startToolSwing(HEAL.kind, null, finishHeal, { rate: def.frames / HEAL.frames });
        se(c.kind === "bandage" ? "Equip1" : "Item1", 55, c.kind === "bandage" ? 120 : 90);
        if (!started) finishHeal();
        return true;
    }
    function finishHeal() {
        const c = healing;
        healing = null;
        if (act.mode === "heal") act.mode = "idle";
        if (!c) return;
        const a = $gameParty.leader();
        if (a && $gameParty.numItems(c.item) > 0) a.useItem(c.item);   // (Survival.js / Needs.js: what it gives, their own popup over him)
        T.emit("quickHeal", { item: c.item.id, kind: c.kind });
    }
    function updateHeal() {
        if (healing && (act.mode !== "heal" || !$gamePlayer._toolSwing)) {   // (cut short: a blow, a fall - nothing used)
            healing = null;
            if (act.mode === "heal") act.mode = "idle";
            P.fight.numberAt(px(), py() - 1.3, "Przerwane!", "#ff9f8f", 0.8);
        }
    }

    // ==================================================================
    // 11. The training dummy (stage C; Farming_Data.js "dummy" - built with Q on grandpa's field). While the hero is in the combat mode
    // within DUMMY.reach of it, it "strikes" slowly: it leans back (the wind-up, windupK as a real foe's, with the warm red warning
    // flash and the swish), then swings at him. No harm: it says how it went - "Idealne parowanie!" (the guard raised in the parry window:
    // the steel, the sparks, the slowed moment, a counter waits), "Za wcześnie" (the guard up too long before, or pressed and dropped),
    // "Za późno" (no guard), "Unik!" (rolled through or stepped out of its reach). The first DUMMY.xpTimes perfect parries give DUMMY.xp
    // experience each. It can be struck (the hero's blows and shots: its straw thud, it wobbles; a heavy blow stops its swing).
    // Not an event: Farming's building and its picture (Farm_Dummy) - this only moves the picture and reads the keys.
    // ==================================================================
    Object.assign(DUMMY, { reach: 1.9, windup: 46, wait: [90, 150], back: 26, early: 30, xp: 5, xpTimes: 5, lean: 0.13, swing: 0.24 });
    const dummyCache = new WeakMap();
    function dummiesHere() {
        const Fm = T.api("Farming"), farm = Fm && Fm.farm ? Fm.farm() : null;
        const list = farm && farm.buildings && $gameMap ? farm.buildings[$gameMap.mapId()] || [] : [];
        return list.filter(b => b && b.type === "dummy" && !b.site);
    }
    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    function dummyRef(b) {
        let r = dummyCache.get(b);
        if (r) return r;
        r = {
            _dummy: true, b, mode: "idle", t: rnd(DUMMY.wait[0], DUMMY.wait[1]), len: 1, wob: 0, wobT: 0, side: 1, flashAt: -99, verdicts: [], hits: 0,
            _radius: 0.45, _dead: false,
            centerX() { return this.b.x + 0.5; }, centerY() { return this.b.y + 0.5; }, kind() { return "dummy"; },
            get _sprite() { const s = SceneManager._scene && SceneManager._scene._spriteset, B = s && s._buildingSprites, e = B ? B._sprites.find(x => x.b === this.b) : null; return e ? e.sprite : null; },
            combatTell() { return this.mode === "wind" ? { t: Math.max(0, this.t), heavy: false } : null; }
        };
        dummyCache.set(b, r);
        return r;
    }
    dummyRefs = () => dummiesHere().map(dummyRef);
    // the hero's blows and shots find it (Hunting.addTargets: the same targets as the animals')
    let dummyHooked = false;
    function hookDummies() {
        const Hn = H();
        if (dummyHooked || !Hn || !Hn.addTargets) return;
        dummyHooked = true;
        Hn.addTargets(() => dummyRefs().map(r => ({ x: r.centerX(), y: r.centerY() - 0.1, radius: r._radius, ref: r, hit: (d, how, extra) => hitDummy(r, d, how, extra || {}) })));
    }
    function hitDummy(r, d, how, extra) {
        r.hits++;
        r.wob = Math.min(0.22, 0.07 + (d || 0) * 0.004);
        r.wobT = 0;
        r.flashAt = Graphics.frameCount;
        if (how !== "melee") { P.fight.numberAt(r.centerX(), r.centerY() - 0.9, String(d), "#ffffff"); se("Blow1", 70, 125); }
        if (extra.heavy && r.mode === "wind") { r.mode = "back"; r.t = DUMMY.back; r.len = DUMMY.back; }   // (a heavy blow stops its swing)
        P.fight.sparksAt(r.centerX(), r.centerY() - 0.6, "#d8c27a", 5);   // (straw)
    }
    function dummyActive(r) {
        return combatMode() && mapFreePlay() && distTo(r.centerX(), r.centerY()) <= DUMMY.reach && act.stun <= 0;
    }
    function updateDummies() {
        const list = dummyRefs();
        if (!list.length) return;
        hookDummies();
        const held = P.fight.isHeld();
        for (const r of list) {
            if (!held) {
                if (r.wob > 0) { r.wobT++; r.wob *= 0.93; if (r.wob < 0.004) r.wob = 0; }
                if (r.mode === "idle") {
                    if (dummyActive(r) && --r.t <= 0) {
                        r.mode = "wind";
                        r.len = r.t = Math.round(DUMMY.windup * windupK());
                        const dx = px() - r.centerX();
                        r.side = Math.abs(dx) < 0.3 ? 1 : Math.sign(dx);
                        se("Push", 40, 130);   // (the post creaks back)
                    }
                } else if (r.mode === "wind") {
                    if (--r.t <= 0) { dummyStrike(r); r.mode = "back"; r.t = r.len = DUMMY.back; }
                } else if (r.mode === "back") {
                    if (--r.t <= 0) { r.mode = "idle"; r.t = rnd(DUMMY.wait[0], DUMMY.wait[1]); }
                }
            }
            drawDummy(r);
        }
    }
    const easeIO = x => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
    function drawDummy(r) {
        const sp = r._sprite;
        if (!sp) return;
        let rot = 0;
        if (r.mode === "wind") rot = -DUMMY.lean * r.side * easeIO(1 - r.t / Math.max(1, r.len));
        else if (r.mode === "back") {
            const g = 1 - r.t / Math.max(1, r.len);   // (0 at the swing, 1 back upright)
            rot = g < 0.2 ? r.side * DUMMY.swing * (g / 0.2) : r.side * DUMMY.swing * (1 - easeIO((g - 0.2) / 0.8));
        }
        if (r.wob > 0) rot += r.wob * Math.sin(r.wobT * 0.7);
        sp.rotation = rot;
        const white = Graphics.frameCount - r.flashAt <= 3;
        if (white) { sp.setBlendColor([255, 255, 255, 255]); sp._dummyTint = true; }
        else if (sp._dummyTint) { sp.setBlendColor([0, 0, 0, 0]); sp._dummyTint = false; }
    }
    // the swing reaches him: how he met it (no harm - words, sounds; the perfect parry as a real one)
    function dummyStrike(r) {
        const F = P.fight, d = distTo(r.centerX(), r.centerY()), now = Graphics.frameCount;
        const mx = (px() + r.centerX()) / 2, my = (py() + r.centerY()) / 2 - 0.5;
        let verdict;
        if (act.iframes > 0 || d > DUMMY.reach + 0.5) verdict = "dodge";
        else if (act.mode === "block" && act.blockT <= P.core.parryWindow()) verdict = "perfect";
        else if (act.mode === "block" || now - (act.blockPressAt || -9999) <= DUMMY.early) verdict = "early";
        else verdict = "late";
        r.verdicts.push(verdict);
        const say = (text, color) => F.numberAt(px(), py() - 1.3, text, color, 0.9);
        if (verdict === "perfect") {
            se("Parry", 90, 100);
            se("Sword4", 60, 130);
            F.sparksAt(mx, my, "#fff2b0", 14);
            say("Idealne parowanie!", "#fff2b0");
            act.counterT = F.COUNTER.frames;
            act.counterMult = F.COUNTER.mult;
            F.slowMotion(F.SLOW.parry, 2);
            r.wob = 0.16; r.wobT = 0;
            const m = modes();
            m.dummyXp = m.dummyXp || 0;
            if (m.dummyXp < DUMMY.xpTimes) { m.dummyXp++; const Cb = T.api("Combat"); if (Cb && Cb.gainXp) Cb.gainXp(DUMMY.xp, "trening z manekinem"); }
        } else if (verdict === "early") {
            se("Blow3", 70, 115);
            F.sparksAt(mx, my, "#e8e8e8", 6);
            say("Za wcześnie", "#ffb07f");
        } else if (verdict === "late") {
            se("Blow1", 65, 125);
            act.flinchT = 10; act.flinchLen = 10; act.hitFrom = [Math.sign(px() - r.centerX()) || 1, 0];
            say("Za późno", "#ff9f8f");
        } else {
            se("Evasion2", 55, 120);
            say("Unik!", "#bfe3ff");
        }
        T.emit("dummyStrike", { verdict });
    }

    // ==================================================================
    // Combat.js's hooks: a map frame (after Combat_Fight's), the map's sprites, the screen's
    // ==================================================================
    function update() {
        if (!$gamePlayer || !$gameSystem) return;
        scan();
        updateAuto();
        updateTarget();
        updateTells();
        updateFinale();
        updateHeal();
        updateDummies();
        const play = combatMode() && mapFreePlay();
        if (pressedNow("target") && play) nextTarget();
        if (pressedNow("heal") && play) pressHeal();
    }
    function addLayer(spriteset) {
        spriteset._targetRing = new Sprite_TargetRing();
        spriteset._tilemap.addChild(spriteset._targetRing);
        spriteset._tellLayer = new Sprite_TellLayer();
        spriteset._tilemap.addChild(spriteset._tellLayer);
    }
    function addHud(scene) {
        scene._edgeArrows = new Sprite_EdgeArrows();
        scene.addChild(scene._edgeArrows);
    }

    P.feel = {
        AUTO, TARGET, TELE, FINALE, update, addLayer, addHud, isThreat, tellOf, nearestThreat, nextBlow, nextTarget, Sprite_TargetRing, Sprite_TellLayer,
        DIFF, diff, windupK, HEAL, EDGE, DUMMY, Sprite_EdgeArrows, pressHeal, busy: () => act.mode === "heal",
        autoHeld, beforeEvent, holdAuto: fn => { if (typeof fn === "function") holds.push(fn); },
        dummies: () => dummyRefs().map(r => ({ x: r.b.x, y: r.b.y, mode: r.mode, t: r.t, verdicts: r.verdicts.slice(), hits: r.hits })),
        tells: () => [...tellFx].map(([a, e]) => ({ kind: a.kind ? a.kind() : "?", heavy: e.heavy, on: e.on, k: Math.round(e.k * 100) / 100, n: e.n })), finale: () => finale,
        target: targetInfo, setTarget: ref => setTarget(ref, true), threats: () => threats.slice(),
        auto(v) { if (v !== undefined) autoAllowed = !!v; return autoAllowed; },
        state: () => ({ calmT, manualOff, pendingOn, target: target ? (target._dummy ? "dummy" : target.kind ? target.kind() : "?") : null, manualT,
            threats: threats.map(t => ({ kind: t.a.kind ? t.a.kind() : "?", d: Math.round(t.d * 10) / 10, tell: t.tell ? { t: t.tell.t, heavy: !!t.tell.heavy } : null })) })
    };
})();
