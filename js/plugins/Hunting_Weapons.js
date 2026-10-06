//=============================================================================
// Hunting_Weapons.js
//=============================================================================
// The weapons and the prey (split out of Hunting.js, 2026-09-29): the sling and the bow (a straight shot, aiming with the shrinking
// circle, the stone / the arrow in flight), the spear's jab, what can be hit, a hit and a kill (the bus's "kill"), the end of a shot
// (the bus's "shot"), the carcasses (lying, rotting, dressed with a knife, the snare's rabbit) and their pictures. Classes and
// functions only: Hunting.js holds every engine hook and calls these.

/*:
 * @target MZ
 * @plugindesc Broń i łup (część Hunting.js): proca, łuk, celowanie, oszczep, pociski, trafienie i zabicie, zwłoki i oprawianie nożem. Sama nic nie robi - parametry i haki ma Hunting.js. v1.0.0
 * @author Tawerna
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base Hunting
 * @orderAfter Hunting
 * @base Hunting_AI
 * @orderAfter Hunting_AI
 *
 * @help
 * ============================================================================
 * Hunting_Weapons.js - broń i łup
 * ============================================================================
 * Część Hunting.js (wydzielona z niego): strzał z procy i łuku, celowanie
 * (krąg), pchnięcie oszczepem, lot pocisku, trafienie i zabicie zwierzęcia,
 * zwłoki (leżą, gniją, oprawia się je nożem) i zając z pułapki. Sama nic nie
 * robi: woła ją Hunting.js. Parametry ma Hunting.js.
 *
 * KOLEJNOŚĆ: Hunting, Hunting_Path, Hunting_AI, Hunting_Weapons. Dopóki nie
 * jest wpisana na listę wtyczek, Hunting.js wczytuje ją sam.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Hunting_Weapons.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const P = T.api("Hunting_parts") || T.register("Hunting_parts", {});
    if (P.weapons) return;   // (put into the page twice: kept as it was)
    if (!P.core || !P.ai) throw new Error("Hunting_Weapons.js: musi być pod Hunting.js i Hunting_AI.js na liście wtyczek (one of them is missing or below)");
    const { ENABLED, ITEM, SPECIES, DIR_VEC, carcassState, tally, removeAnimal, se, popup, C, perk, perkRoll, knowsSkill, canShoot, sneaking,
        targetSources, noiseListeners, animals, roamingSpriteset: spriteset } = P.core;
    const { stagger, knockBack, enrage } = P.ai;

    // range in tiles, speed in tiles per frame, damage, stamina per shot, cooldown in frames;
    // aiming (hold the shoot key): the circle shrinks from spread to focus (tiles of radius) in `steady` frames; holdAt: the frame of the
    // shooting animation that is held while aiming (the sling whirls over the head, the bow is drawn)
    const WEAPONS = {
        sling: { item: ITEM.sling, ammo: ITEM.stone, range: 6, speed: 0.34, damage: 14, stamina: 2, cooldown: 24, se: "Bow1", pitch: 130, spread: 1.3, focus: 0.12, steady: 70, holdAt: 30, release: 40, wobble: 5 },
        bow: { item: ITEM.bow, ammo: ITEM.arrows, range: 9, speed: 0.55, damage: 30, stamina: 3, cooldown: 30, se: "Bow3", pitch: 100, spread: 1.1, focus: 0.08, steady: 55, holdAt: 30, release: 36, wobble: 0, tremble: 240 }
    };
    // the spear: no ammunition, no aiming - a jab at what stands within reach (tiles from the player's centre) in front of him
    const SPEAR = { item: ITEM.spear, reach: 1.9, damage: 45, stamina: 3, cooldown: 36, noise: 4 };   // (without Combat.js; with it the spear is a melee weapon there)
    const NOISE_RADIUS = 7;

    // swing kinds of ChoppableTree.js: the body whirls the sling / draws the bow, and the shot leaves on the release frame; the spear's jab
    const SHOT_SWING = { sling: 9, bow: 10, spear: 15 };
    let animate = true;   // tests switch the shooting animation off (the shot then leaves at once)
    let projectiles = [];
    let cooldown = 0;

    // ------------------------------------------------------------------
    // Shooting
    // ------------------------------------------------------------------
    const countItem = id => $gameParty.numItems($dataItems[id]);
    // the bow when there are arrows, else the sling when there are stones; null with the reason (a popup) otherwise
    function pickWeapon() {
        const bow = countItem(ITEM.bow) > 0, sling = countItem(ITEM.sling) > 0;
        if (bow && countItem(ITEM.arrows) > 0) return "bow";
        if (sling && countItem(ITEM.stone) > 0) return "sling";
        if (bow) popup($dataItems[ITEM.arrows].iconIndex, "Potrzebujesz strzał", "#ff9f8f");
        else if (sling) popup($dataItems[ITEM.stone].iconIndex, "Potrzebujesz kamieni", "#ff9f8f");
        else popup($dataItems[ITEM.sling].iconIndex, "Potrzebujesz procy, łuku albo oszczepu", "#ff9f8f");
        return null;
    }
    const hasRanged = () => (countItem(ITEM.bow) > 0 && countItem(ITEM.arrows) > 0) || (countItem(ITEM.sling) > 0 && countItem(ITEM.stone) > 0);
    // unit vector of a shot: the two held arrows (a diagonal) or else the way the player faces
    function aimVector() {
        const d8 = Input.dir8;
        const diag = { 1: [-1, 1], 3: [1, 1], 7: [-1, -1], 9: [1, -1] }[d8];
        if (diag) { const n = Math.SQRT2; return [diag[0] / n, diag[1] / n]; }
        return { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] }[$gamePlayer.direction()] || [0, 1];
    }

    // ------------------------------------------------------------------
    // What can be hit: the animals here and whatever other plugins add (Birds.js: the birds on the ground):
    // { x, y (tiles, centre), radius, ref, hit(damage) }. Noise listeners hear every shot: fn(x, y, radius).
    // ------------------------------------------------------------------
    function allTargets() {
        const out = animals().filter(a => !a._dead).map(a => ({ x: a.centerX(), y: a.centerY(), radius: SPECIES[a.kind()].radius, ref: a, hit: (d, how, extra) => hit(a, d, how, extra) }));
        for (const src of targetSources) out.push(...src());
        return out;
    }
    function makeNoise(x, y, radius) {
        for (const a of animals()) if (Math.hypot(a.centerX() - x, a.centerY() - y) <= radius) a._alarm = 240;
        for (const fn of noiseListeners) fn(x, y, radius);
    }

    // stamina, the ammunition and the wear of the weapon, paid when the shot leaves; false (with a popup) when too tired
    function payShot(def) {
        if (!$gameSystem.trySpendStamina(def.stamina)) { popup(82, "Jesteś zbyt zmęczony", "#ff9f8f"); return false; }
        if (!perkRoll("ammo.save")) $gameParty.loseItem($dataItems[def.ammo], 1, false);   // (Zbieracz pocisków)
        T.call("Durability", "use", def.item);
        cooldown = Math.round(def.cooldown * (1 - Math.min(0.6, perk("shot.cooldown"))));   // (Szybki strzał)
        $gameTemp._farmLock = Math.max($gameTemp._farmLock || 0, 10);
        return true;
    }
    function faceVector(dx, dy) {
        if (Math.abs(dx) >= Math.abs(dy)) $gamePlayer.setDirection(dx < 0 ? 4 : 6); else $gamePlayer.setDirection(dy < 0 ? 8 : 2);
    }
    // the stone / the arrow leaves (the direction is a unit vector)
    function launch(w, dx, dy) {
        const def = WEAPONS[w];
        se(def.se, 85, def.pitch);
        const sx = $gamePlayer._realX + 0.5, sy = $gamePlayer._realY + 0.3;
        projectiles.push(makeProjectile(w, sx, sy, dx, dy));
        makeNoise(sx, sy, NOISE_RADIUS * (knowsSkill("r_silent") ? 0.5 : 1));   // (Cichy strzał)
    }
    // A straight shot, no aiming (tests, events). Returns true when a projectile left. dir: [dx, dy] (defaults to the facing),
    // which: "sling" | "bow" (defaults to the best weapon in the bag)
    function shoot(dir, which) {
        if (!ENABLED || cooldown > 0) return false;
        const w = which || pickWeapon();
        if (!w) return false;
        if (!payShot(WEAPONS[w])) return false;
        const [dx, dy] = dir || aimVector();
        faceVector(dx, dy);
        if (animate && typeof $gamePlayer.startToolSwing === "function" && $gamePlayer.startToolSwing(SHOT_SWING[w], () => launch(w, dx, dy))) {
            cooldown = Math.max(cooldown, 60);
            return true;
        }
        launch(w, dx, dy);
        return true;
    }

    // ------------------------------------------------------------------
    // Aiming: the shoot key held down. The sling whirls (the bow is drawn) and a circle sits on the nearest target in front of the player;
    // it shrinks while he holds still - a small bird needs a small circle. Let the key go: the shot flies at a random point of the
    // circle. Tired, it never gets small; sneaking, it shrinks faster; a drawn bow starts to tremble after a while. The
    // direction keys turn him to another target; cancel lowers the weapon without a shot.
    // ------------------------------------------------------------------
    let aim = null;   // { weapon, t, ref, point: {x, y}, radius, manual }
    // where he faces, a unit vector - on the slant too: HeroLook.js keeps the 8-way facing (_heroDir8) that goes with the 4-way one
    // (with only the four ways, a spear jab never reached a boar standing on the slant - the user's, 2026-09-26)
    const FITS8 = { 2: [2, 1, 3], 4: [4, 1, 7], 6: [6, 3, 9], 8: [8, 7, 9] };
    function facingVector() {
        const d4 = $gamePlayer.direction(), d8 = $gamePlayer._heroDir8;
        const v = DIR_VEC[d8 && FITS8[d4] && FITS8[d4].includes(d8) ? d8 : d4] || [0, 1], len = Math.hypot(v[0], v[1]);
        return [v[0] / len, v[1] / len];
    }
    // turns him to (dx, dy): the 4-way direction and, on the slant, the 8-way facing too
    function faceSlant(dx, dy) {
        faceVector(dx, dy);
        const d8 = [6, 3, 2, 1, 4, 7, 8, 9][((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8];
        if (FITS8[$gamePlayer.direction()].includes(d8)) $gamePlayer._heroDir8 = d8;
    }
    // targets in range within 60 degrees of where he faces, the best first (straight ahead, then near)
    function aimCandidates(def) {
        const px = $gamePlayer._realX + 0.5, py = $gamePlayer._realY + 0.5, [fx, fy] = facingVector();
        return allTargets().map(t => {
            const dx = t.x - px, dy = t.y - py, d = Math.hypot(dx, dy);
            return { t, d, cos: d > 0 ? (dx * fx + dy * fy) / d : 1 };
        }).filter(c => c.d <= def.range && c.d > 0.3 && c.cos > 0.5)
            .sort((a, b) => (1 - a.cos) * 6 + a.d - ((1 - b.cos) * 6 + b.d)).map(c => c.t);
    }
    function startAim() {
        if (!ENABLED || cooldown > 0 || aim) return false;
        const w = pickWeapon();
        if (!w) return false;
        const def = WEAPONS[w];
        if ($gameSystem.stamina() < def.stamina) { popup(82, "Jesteś zbyt zmęczony", "#ff9f8f"); return false; }
        aim = { weapon: w, t: 0, ref: null, point: null, radius: def.spread, manual: false };
        updateAim();
        // (the circle keeps shrinking from the press on, the whirl included - the map scene calls updateAim every frame)
        if (animate && typeof $gamePlayer.startToolSwing === "function" && $gamePlayer.startToolSwing(SHOT_SWING[w], fireAimed, null, {
            holdAt: def.holdAt, holdWhile: () => Input.isPressed("shoot"), keepOnMove: true, wobble: def.wobble, still: !def.wobble,
            onHoldEnd: cancelled => { if (cancelled) endAim(); }
        })) return true;
        aim.manual = true;   // no shooting animation (tests): the map scene aims until the key is let go and the whirl would be over
        return true;
    }
    function updateAim() {
        if (!aim) return;
        const def = WEAPONS[aim.weapon];
        aim.t++;
        const d4 = Input.dir4;
        if (d4 && d4 !== $gamePlayer.direction()) $gamePlayer.setDirection(d4);   // turning to another target
        const best = aimCandidates(def)[0] || null;
        if ((best ? best.ref : null) !== aim.ref) {
            aim.t = Math.min(aim.t, Math.round(def.steady * 0.4));   // a new target: the circle opens up a little again
            aim.ref = best ? best.ref : null;
        }
        const px = $gamePlayer._realX + 0.5, py = $gamePlayer._realY + 0.5, [fx, fy] = facingVector();
        aim.point = best ? { x: best.x, y: best.y } : { x: px + fx * def.range * 0.7, y: py + fy * def.range * 0.7 };
        const Cb = C(), dex = Cb && Cb.aimSteady ? Cb.aimSteady() : 1;   // (Zręczność: the circle closes sooner)
        const k = Math.min(1, aim.t / (def.steady * (sneaking() ? 0.8 : 1) * dex)), ease = 1 - (1 - k) * (1 - k);
        let r = def.spread - (def.spread - def.focus) * ease;
        if ($gameSystem.staminaRatio() < 0.3) r = Math.max(r, def.focus * 2.2);   // tired hands
        if (def.tremble && aim.t > def.tremble) r += (aim.t - def.tremble) * 0.004;   // the drawn bow starts to shake
        aim.radius = r;
    }
    function endAim() {
        aim = null;
    }
    // the shoot key let go: the shot flies at a random point of the circle
    function fireAimed() {
        if (!aim) return;
        const w = aim.weapon, a = aim.point, ang = Math.random() * Math.PI * 2, rr = aim.radius * Math.sqrt(Math.random());
        endAim();
        if (!a || !payShot(WEAPONS[w])) return;
        const sx = $gamePlayer._realX + 0.5, sy = $gamePlayer._realY + 0.3;
        let dx = a.x + Math.cos(ang) * rr - sx, dy = a.y + Math.sin(ang) * rr - sy;
        const len = Math.hypot(dx, dy) || 1;
        dx /= len; dy /= len;
        faceVector(dx, dy);
        launch(w, dx, dy);
    }
    // ------------------------------------------------------------------
    // The spear: the shoot key with a spear in the bag jabs at what stands within reach in front of the player (the nearest one); with nothing
    // that close, it aims the bow or the sling as before (and with neither, it jabs at the air). The hit lands on the jab's strike frame.
    // ------------------------------------------------------------------
    function spearTarget() {
        const px = $gamePlayer._realX + 0.5, py = $gamePlayer._realY + 0.5, [fx, fy] = facingVector();
        let best = null, bestD = Infinity;
        for (const t of allTargets()) {
            const dx = t.x - px, dy = t.y - py, d = Math.hypot(dx, dy);
            if (d < 0.01 || d > SPEAR.reach + t.radius * 0.5 || (dx * fx + dy * fy) / d < 0.5) continue;
            if (d < bestD) { best = t; bestD = d; }
        }
        return best;
    }
    function thrust() {
        if (!ENABLED || cooldown > 0 || aim) return false;
        if (!$gameSystem.trySpendStamina(SPEAR.stamina)) { popup(82, "Jesteś zbyt zmęczony", "#ff9f8f"); return false; }
        cooldown = SPEAR.cooldown;
        $gameTemp._farmLock = Math.max($gameTemp._farmLock || 0, 10);
        const strike = () => {
            const t = spearTarget();
            se("Wind7", 70, 140);   // the swish of the jab
            T.call("Durability", "use", ITEM.spear);
            if (t) t.hit(SPEAR.damage, "spear");
            makeNoise($gamePlayer._realX + 0.5, $gamePlayer._realY + 0.5, SPEAR.noise);
        };
        if (animate && typeof $gamePlayer.startToolSwing === "function" && $gamePlayer.startToolSwing(SHOT_SWING.spear, strike)) return true;
        strike();
        return true;
    }
    // the shoot key pressed: the spear for what is within reach (or when there is nothing to shoot with), else aim the bow / the sling
    function pressShoot() {
        const Cb = C();
        if (Cb && Cb.pressAttack) return Cb.pressAttack();   // (the weapon in hand: a blow, or aiming the bow / the sling)
        if (countItem(ITEM.spear) > 0 && (spearTarget() || !hasRanged())) return thrust();
        return startAim();
    }

    // the circle on the map: a yellow ring with four ticks and a dot; its size is the spread of the shot
    function Sprite_AimReticle() {
        this.initialize(...arguments);
    }
    Sprite_AimReticle.prototype = Object.create(PIXI.Graphics.prototype);
    Sprite_AimReticle.prototype.constructor = Sprite_AimReticle;
    Sprite_AimReticle.prototype.initialize = function() {
        PIXI.Graphics.call(this);
        this.z = 9;
        this.visible = false;
        this._drawn = -1;
    };
    Sprite_AimReticle.prototype.update = function() {
        if (!aim || !aim.point) { this.visible = false; return; }
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), r = Math.max(4, aim.radius * tw), S = T.api("UITheme"), accent = S && S.accent ? parseInt(S.accent.slice(1), 16) : 0xffd23f;
        this.visible = true;
        this.x = Math.round($gameMap.adjustX(aim.point.x) * tw);
        this.y = Math.round($gameMap.adjustY(aim.point.y) * th);
        const key = Math.round(r) + (aim.ref ? "t" : "f");
        if (key === this._drawn) return;
        this._drawn = key;
        this.clear();
        this.lineStyle(3, 0x000000, 0.45);
        this.drawCircle(0, 0, r);
        this.lineStyle(2, accent, aim.ref ? 0.95 : 0.55);
        this.drawCircle(0, 0, r);
        for (const [ux, uy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            this.moveTo(ux * (r - 3), uy * (r - 3));
            this.lineTo(ux * (r + 5), uy * (r + 5));
        }
        this.lineStyle(0);
        this.beginFill(accent, 0.9);
        this.drawCircle(0, 0, 1.5);
        this.endFill();
    };
    function makeProjectile(weapon, x, y, dx, dy) {
        const p = { weapon, x, y, dx, dy, travelled: 0, done: false, sprite: null };
        const set = spriteset();
        if (set && set._tilemap) {
            const arrow = weapon === "bow";
            const bmp = new Bitmap(arrow ? 22 : 8, arrow ? 6 : 8), ctx = bmp.context;
            if (arrow) {
                ctx.fillStyle = "#2a1c14"; ctx.fillRect(0, 1, 22, 4);
                ctx.fillStyle = "#b98a55"; ctx.fillRect(1, 2, 15, 2);
                ctx.fillStyle = "#c9c9c0"; ctx.fillRect(16, 1, 5, 4); ctx.fillRect(21, 2, 1, 2);
                ctx.fillStyle = "#f0e2b0"; ctx.fillRect(0, 0, 4, 1); ctx.fillRect(0, 5, 4, 1);
            } else {
                ctx.fillStyle = "#2a1c14"; ctx.beginPath(); ctx.arc(4, 4, 4, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "#9a9a90"; ctx.beginPath(); ctx.arc(4, 4, 3, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "#cfcfc4"; ctx.fillRect(2, 2, 2, 2);
            }
            bmp._baseTexture.update();
            const sprite = new Sprite(bmp);
            sprite.anchor.set(arrow ? 0.9 : 0.5, 0.5);
            sprite.rotation = Math.atan2(dy, dx);
            sprite.z = 5;
            set._tilemap.addChild(sprite);
            p.sprite = sprite;
        }
        return p;
    }
    function endProjectile(p) {
        p.done = true;
        if (p.sprite) {
            try {
                if (p.sprite.parent) p.sprite.parent.removeChild(p.sprite);
                p.sprite.destroy();
            } catch (e) { /* the scene (and with it the sprite) is already gone */ }
            p.sprite = null;
        }
    }
    function blockedAt(x, y) {
        const tx = Math.floor(x), ty = Math.floor(y);
        if (!$gameMap.isValid(tx, ty)) return true;
        if (!$gameMap.checkPassage(tx, ty, 0x0f)) return true;
        return $gameMap.eventsXy(tx, ty).some(e => e.isNormalPriority() && e.characterName() !== "");
    }
    function updateProjectiles() {
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const targets = projectiles.length ? allTargets() : [];
        for (const p of projectiles) {
            if (p.done) continue;
            const def = WEAPONS[p.weapon];
            const steps = 3, step = def.speed / steps;
            for (let i = 0; i < steps && !p.done; i++) {
                p.x += p.dx * step; p.y += p.dy * step; p.travelled += step;
                const target = targets.find(t => Math.hypot(t.x - p.x, t.y - p.y) <= t.radius);
                if (target) { shotHit(target, def); endProjectile(p); shotEnd(p, target); break; }
                if (p.travelled >= def.range || blockedAt(p.x, p.y)) { endProjectile(p); shotEnd(p, null); }
            }
            if (p.sprite && !p.sprite.parent) p.sprite = null;   // the scene was rebuilt: the flight goes on without the picture
            if (p.sprite && !p.done) {
                p.sprite.x = Math.round($gameMap.adjustX(p.x) * tw);
                p.sprite.y = Math.round($gameMap.adjustY(p.y) * th);
            }
        }
        projectiles = projectiles.filter(p => !p.done);
    }
    // a flight over: told on the Tawerna bus as "shot" { weapon: "sling" | "bow", hit, kind (what it hit: an animal's or a bird's kind;
    // "" - a miss), x, y (tiles) } - after the "kill" the shot made, if it made one
    function shotEnd(p, target) {
        const r = target && target.ref;
        T.emit("shot", { weapon: p.weapon, hit: !!target, kind: !r ? "" : typeof r.kind === "function" ? r.kind() : String(r.kind || ""), x: p.x, y: p.y });
    }

    // ------------------------------------------------------------------
    // A hit
    // ------------------------------------------------------------------
    // how: "spear" for a jab (a boar reels back from it), anything else for a shot
    // extra (Combat.js): { poise, knock, crit, heavy, tag } - how much of its balance the blow takes, whether it is thrown back
    // a stone / an arrow hits: Zręczność and the Strzelectwo skills make it stronger; a lucky shot (Słaby punkt) doubles it, a shot at
    // an animal that has not noticed the hero yet (Strzał w serce) triples it
    // A shot from hiding (stage 2, 2026-10-05): at an animal that has not noticed him yet (no "!" over it, not fighting him), while he
    // sneaks or from behind it (Combat.sneakAttack says) - Combat.sneakMult(true) (x2, more with Zręczność, Czujność and Zasadzka) and
    // a heavy knock to its balance; Strzał w serce makes any shot at an unaware one a triple (a shot from hiding at least that)
    function shotHit(target, def) {
        const Cb = C();
        let dmg = def.damage * (Cb ? 1 + 0.02 * (Cb.attr("dex") - 5) : 1) * (1 + perk("ranged.dmg")), tag = "", poise = Math.round(def.damage * 0.6);
        const a = target.ref && target.ref.isAnimal ? target.ref : null;
        const sneak = a && Cb && Cb.sneakAttack ? Cb.sneakAttack(a) : null;   // null | "unaware" | "hidden" (sneaking or from behind)
        const heart = a && knowsSkill("r_heart") && !!sneak;
        if (sneak === "hidden" || heart) {
            const m = Math.max(sneak === "hidden" ? Cb.sneakMult(true) : 1, heart ? 3 : 1);
            dmg *= m;
            poise = Math.max(Math.round(poise * (Cb.SNEAK ? Cb.SNEAK.poise : 3)), (a._poise || 0) + 1);   // (its balance broken whole: it reels)
            tag = heart && m === 3 ? "heart" : "sneak";
        }
        else if (perkRoll("ranged.crit")) { dmg *= 2; tag = "crit"; }
        target.hit(Math.round(dmg), "shot", { poise, crit: !!tag, tag, heavy: tag === "sneak" || tag === "heart" });
    }
    function hit(animal, damage, how, extra) {
        const sp = SPECIES[animal.kind()];
        if (animal._dead) return;
        damage = Math.round(damage * (1 + perk("hunt.dmg")));   // (Łowca, Tropiciel, Pogromca zwierząt: any weapon)
        extra = extra || {};
        animal._hp -= damage;
        animal._poiseT = 0;
        animal._engaged = true;
        const Cb = C();
        se("Damage1", Cb ? 55 : 80, sp.aggressive ? 90 : 120);
        if (Cb && Cb.enemyHurtFx) Cb.enemyHurtFx(animal, damage, how, extra);
        if (animal._hp > 0) {
            animal._wounded = true;
            if (!Cb) popup($dataItems[ITEM.carcass].iconIndex, sp.name + " ranny", "#ffd98f");
            // a heavy one (the bear) shrugs off the light blows: only BEAR_AI.light of their balance, never thrown back by them; a
            // heavy blow (a charged one, one from hiding) takes it whole and may throw it back
            const heavyBlow = !!extra.heavy || extra.tag === "sneak" || extra.tag === "heart";
            const poise = extra.poise !== undefined ? extra.poise : Math.round(damage * 0.8);
            animal._poise -= sp.heavy && !heavyBlow ? Math.round(poise * P.ai.BEAR_AI.light) : poise;
            const knock = !!extra.knock && (!sp.heavy || heavyBlow);
            if (animal._poise <= 0 && how !== "spear") stagger(animal, knock);
            else if (knock && animal._mode !== "charge" && !(sp.bear && animal.isJumping())) knockBack(animal);
            if (sp.aggressive) enrage(animal, how);
            makeNoise(animal.centerX(), animal.centerY(), NOISE_RADIUS);
            return;
        }
        kill(animal, how);
    }
    // how: the last blow ("spear", "shot", "melee"; "dog" - the dog's bite). Told on the Tawerna bus as "kill" { kind, by: "hero" |
    // "dog", how, mapId, x, y (tiles), level, bounty (a wanted one's contract), animal } (Combat.js: the experience, QuestBoard.js, Journal.js,
    // HomeDecor.js listen)
    function kill(animal, how) {
        if (typeof animal.bearOver === "function" && SPECIES[animal.kind()].bear) animal.bearOver();   // (a bear fight lived through)
        tally(animal);
        removeAnimal(animal);
        if (animal._pack && animal._pack.leader === animal) animal._pack.broken = true;   // the leader down: the pack loses heart
        const e = { kind: animal.kind(), by: how === "dog" ? "dog" : "hero", how: how || "", mapId: $gameMap.mapId(), x: animal.centerX(), y: animal.centerY(),
            level: animal._level || 1, animal };
        if (animal._qbBounty) e.bounty = animal._qbBounty;
        T.emit("kill", e);
        se("Collapse1", 70, 130);
        dropCarcass(animal.kind(), animal.centerX(), animal.centerY(), animal.direction());   // it lies where it fell
    }

    // ------------------------------------------------------------------
    // Carcasses (user, 2026-09-24): a killed animal lies where it fell. Only with a knife is it dressed - the action button in
    // front of it: the meat of that animal, raw hide and sinews (YIELD); without one it waits, and after CARCASS.rot hours it
    // has rotted away. Kept per map in $gameSystem._tw.carcasses (saved; Hunting.js); drawn in the tilemap on its back, darker, with blood.
    // ------------------------------------------------------------------
    const YIELD = {
        rabbit: { meat: 94, n: 1, skin: 1, sinew: 1 },
        deer: { meat: 157, n: 3, skin: 2, sinew: 2 },
        boar: { meat: 159, n: 4, skin: 2, sinew: 2 },
        wolf: { meat: 161, n: 2, skin: 1, sinew: 2 },
        bear: { meat: ITEM.bearMeat, n: 5, skin: 1, hide: ITEM.bearHide, sinew: 3 }   // (hide: its own skin - the bear's fur - instead of the plain raw hide)
    };
    const CARCASS = { rot: 24, reach: 1.3, max: 16 };   // rot: game hours; reach: tiles from the hero's centre; max: a map's
    const clockNow = () => $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour();
    function carcassList(mapId) {
        const s = carcassState(), id = mapId || $gameMap.mapId();
        return s[id] || (s[id] = []);
    }
    let carcassSeq = 0;
    function dropCarcass(kind, x, y, dir) {
        if (!YIELD[kind]) return null;
        const list = carcassList();
        const c = { kind, x, y, dir: dir || 6, until: clockNow() + CARCASS.rot, id: Date.now() + "-" + (carcassSeq++) };
        list.push(c);
        while (list.length > CARCASS.max) list.shift();
        return c;
    }
    function removeCarcass(c) {
        const list = carcassList(), i = list.indexOf(c);
        if (i >= 0) list.splice(i, 1);
    }
    function rotCarcasses() {
        const now = clockNow();
        for (const c of carcassList().slice()) if (c.until <= now) removeCarcass(c);
    }
    // the carcass in front of the hero (or under him), the nearest one
    function carcassAhead() {
        const px = $gamePlayer._realX + 0.5, py = $gamePlayer._realY + 0.5, d = $gamePlayer.direction();
        const fx = d === 4 ? -1 : d === 6 ? 1 : 0, fy = d === 8 ? -1 : d === 2 ? 1 : 0;
        let best = null, bestD = 99;
        for (const c of carcassList()) {
            const dx = c.x - px, dy = c.y - py, dist = Math.hypot(dx, dy);
            if (dist > CARCASS.reach || (dist > 0.6 && (dx * fx + dy * fy) / dist < 0.3)) continue;
            if (dist < bestD) { bestD = dist; best = c; }
        }
        return best;
    }
    const knifeOwned = () => [ITEM.knifeIron, ITEM.knifeStone].find(id => $gameParty.numItems($dataItems[id]) > 0) || 0;
    function giveYield(kind, knife) {
        const y = YIELD[kind];
        const more = k => (perkRoll(k) ? 1 : 0);   // (Rzeźnik, Skórnik, Ścięgna, Król puszczy)
        $gameParty.gainItem($dataItems[y.meat], y.n + more("carcass.meat"));   // (the popups "+N ..." come from SurvivalHUD)
        $gameParty.gainItem($dataItems[y.hide || ITEM.rawHide], y.skin + more("carcass.hide"));
        $gameParty.gainItem($dataItems[ITEM.sinew], y.sinew + more("carcass.sinew"));
        T.call("Durability", "use", knife);
        se("Slash1", 55, 85);
    }
    // the action button at a carcass: with a knife the hero crouches and dresses it, without one nothing (a popup)
    function dressCarcass(c) {
        const knife = knifeOwned();
        if (!knife) { popup($dataItems[ITEM.knifeStone].iconIndex, "Potrzebujesz noża, żeby oprawić: " + SPECIES[c.kind].name, "#ff9f8f"); return true; }
        if ($gamePlayer.isToolSwinging && $gamePlayer.isToolSwinging()) return true;
        const dx = c.x - ($gamePlayer._realX + 0.5), dy = c.y - ($gamePlayer._realY + 0.5);
        if (Math.hypot(dx, dy) > 0.3) $gamePlayer.setDirection(Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 4 : 6) : (dy < 0 ? 8 : 2));
        const finish = () => { if (!carcassList().includes(c)) return; removeCarcass(c); giveYield(c.kind, knife); };
        const CT = T.api("ChoppableTree"), crouch = CT && CT.swingKindOf ? CT.swingKindOf("Swing_Crouch") : -1;
        if (crouch < 0 || !$gamePlayer.startToolSwing(crouch, finish, null)) finish();
        return true;
    }
    // the snare's rabbit (Farming.js): dressed at once with a knife, else its carcass lies at the snare
    function takeFromSnare(x, y) {
        const knife = knifeOwned();
        if (knife) { giveYield("rabbit", knife); return; }
        dropCarcass("rabbit", x + 0.5, y + 0.6, 2);
        popup($dataItems[ITEM.knifeStone].iconIndex, "Zając leży przy pułapce: oprawisz go nożem", "#ffd98f");
    }
    // the sprites: made with the map scene, one per carcass of this map
    let carcassSprites = [], bloodBmp = null;
    function bloodBitmap() {
        if (bloodBmp) return bloodBmp;
        bloodBmp = new Bitmap(34, 12);
        const ctx = bloodBmp.context;
        ctx.fillStyle = "rgba(92,12,10,0.75)";
        ctx.beginPath(); ctx.ellipse(17, 6, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(120,20,16,0.6)";
        ctx.beginPath(); ctx.ellipse(12, 5, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
        bloodBmp._baseTexture.update();
        return bloodBmp;
    }
    function makeCarcassSprite(c, tm) {
        const root = new Sprite();
        root.z = 2.2;   // (on the ground over the herbs, stones and site markers lying there - Farming_Render's litter 1.5, footprint 2 - under the characters)
        const blood = new Sprite(bloodBitmap());
        blood.anchor.set(0.5, 0.5);
        blood.y = 4;
        root.addChild(blood);
        const body = new Sprite(ImageManager.loadCharacter(SPECIES[c.kind].sheet));
        body.anchor.set(0.5, 0.5);
        body.scale.y = -1;   // on its back, the legs up
        body.setBlendColor([30, 8, 8, 110]);   // (the life gone out of it)
        body.bitmap.addLoadListener(bmp => {
            const pw = bmp.width / 3, ph = bmp.height / 4, row = c.dir === 4 ? 1 : 2;
            body.setFrame(pw, row * ph, pw, ph);
            body.y = Math.round(ph * 0.2);   // (the animal fills the lower part of its cell: turned over it goes up, so back down onto the blood)
        });
        root.addChild(body);
        tm.addChild(root);
        return root;
    }
    function updateCarcassSprites() {
        const set = spriteset(), tm = set && set._tilemap;
        if (!tm) return;
        const list = carcassList();
        carcassSprites = carcassSprites.filter(e => {
            const keep = e.sprite.parent === tm && list.includes(e.c);
            if (!keep && e.sprite.parent) e.sprite.parent.removeChild(e.sprite);
            return keep;
        });
        for (const c of list) if (!carcassSprites.some(e => e.c === c)) carcassSprites.push({ c, sprite: makeCarcassSprite(c, tm) });
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        for (const e of carcassSprites) {
            e.sprite.x = Math.round($gameMap.adjustX(e.c.x) * tw);
            e.sprite.y = Math.round($gameMap.adjustY(e.c.y) * th);
            const held = e.c.held, blood = e.sprite.children[0], body = e.sprite.children[1];   // (held: in the dog's mouth, Dog.js)
            e.sprite.z = held ? (held.dir === 8 ? 2.9 : 3.6) : 2.2;
            e.sprite.scale.set(held ? held.scale || 0.8 : 1, held ? held.scale || 0.8 : 1);
            if (blood) blood.visible = !held;
            if (body) { body.rotation = held ? (held.dir === 4 ? 0.8 : held.dir === 6 ? -0.8 : 0) : 0; body.scale.y = held ? 1 : -1; }
        }
    }

    // ------------------------------------------------------------------
    // What Hunting.js's map clock calls every frame
    // ------------------------------------------------------------------
    // the shoot key: aiming while it is held (without the shooting animation - the tests - the same timing as the whirl), the shot when
    // it is let go; pressed: aim (or jab with the spear)
    function updateShootKey() {
        if (aim && aim.manual) {
            updateAim();
            if (!Input.isPressed("shoot") && aim.t >= WEAPONS[aim.weapon].release) fireAimed();
        } else if (aim && !$gamePlayer.isToolSwinging()) {
            endAim();   // the swing was taken away (a scene change...)
        } else if (aim) {
            updateAim();
        } else if (Input.isTriggered("shoot") && canShoot()) {
            pressShoot();
        }
    }

    P.weapons = { WEAPONS, SPEAR, SHOT_SWING, YIELD, CARCASS, animate: v => { animate = !!v; }, projectiles: () => projectiles, aim: () => aim,
        cooldown: () => cooldown, resetCooldown: () => { cooldown = 0; }, countDown: () => { if (cooldown > 0) cooldown--; }, clearShots: () => { projectiles = []; },
        clearCarcassSprites: () => { carcassSprites = []; }, pickWeapon, shoot, facingVector, faceSlant, startAim, updateAim, fireAimed, endAim, thrust, spearTarget,
        pressShoot, allTargets, makeNoise, updateProjectiles, hit, kill, dropCarcass, removeCarcass, rotCarcasses, carcasses: () => carcassList(), carcassAhead,
        dressCarcass, takeFromSnare, updateCarcassSprites, updateShootKey, Sprite_AimReticle };
})();
