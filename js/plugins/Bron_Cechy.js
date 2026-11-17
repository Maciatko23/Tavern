//=============================================================================
// Bron_Cechy.js
//=============================================================================
// The weapons' traits at work (2026-11-17, the user's: "broniom małe bonusy, szczególnie tym lepszym"; the traits are FIXED by the
// weapon - Bron_Cechy_Data.js, made by tools/bron/cechy_wtyczka.py from tools/bron/cechy.json; what each is and how strong:
// tools/bron/cechy.py). The fight asks this plugin in one line where each thing happens:
//   - Combat_Fight.js: strike (stwory, krytyk_mocniej, ogluszenie, obrazenia, przebicie; then afterHit), weaponNow (zasieg, oddech),
//     startAttack / afterBlow (szybkosc: the swing and the pause after a series quicker); Combat.js parryWindow (parowanie)
//   - Hunting_Weapons.js: shotHit (stwory, obrazenia, ogluszajacy_kamien; then afterHit), launch / updateProjectiles
//     (przebijajaca_strzala: the arrow goes on through); Bron.js rangedDef (a bow's szybkosc: the aim closes sooner)
//   - Durability.js lifeOf (trwalosc), Creatures.js hitCreature (przebicie: the empty armour's plate), Humans.js hitHuman (przebicie:
//     the mercenary's shield - the only man in armour)
// afterHit: what a blow or a shot that hurt does next - a stun held its seconds (the target reels: the stars over it, Combat_UI.js;
// the skill "execute" then x2.5), the bleeding, krew za krew (life back), postrach (a man runs), odrzut (thrown farther).
// The bleeding: a damage over time on men, creatures and animals - not on what has no blood: the empty armours (and the bosses of
// armour), the stone men, the wraiths and the shadows, the straw dummy (Combat_Fight.surfaceOf: "armor" / "stone" / "spirit" / "straw").
// One list, one tick a second, red numbers and drops; its kill is the hero's (the bus's "kill", how "bleed").
// "Udane kucie": a weapon the hero makes himself (the forge, the workbench, the tannery - Bron_Data.przepisy, Farming's bus "craft")
// comes out well with KUCIE.szansa (+ the skills Hutnik and Mistrz cechu: Combat.perk("forge.luck")): one trait more of its kind's pool
// at its material's strength (none left: obrażenia +1). RPG Maker's items are not copies - it is kept by the item id in the save and
// works while the hero has that item (in the bag, a chest or a bundle on the ground); gone with the last one (sold, lost, broken).
// Bus: emits bronUdaneKucie { id, cecha, v }, bronKrwawienie { kind, dps, s }.

/*:
 * @target MZ
 * @plugindesc Cechy broni - działanie: zakres obrażeń ±10%, szybkość, ogłuszenie, krwawienie, przebicie pancerza, odrzut, zasięg, oddech, parowanie, krytyk, wytrzymałość, stwory, krew za krew, postrach, przebijająca strzała, ogłuszający kamień; udane kucie. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter Bron_Data
 * @orderAfter Bron_Cechy_Data
 * @orderAfter Combat
 * @orderAfter Hunting_Weapons
 * @orderAfter Humans
 * @orderAfter Creatures
 * @orderAfter Farming
 * @orderAfter Bron
 *
 * @help
 * ============================================================================
 * Bron_Cechy.js - cechy broni w grze
 * ============================================================================
 * Każda broń ma stałe cechy (dane: Bron_Cechy_Data.js). Ta wtyczka sprawia, że
 * działają: ogłuszenie (wróg się chwieje - gwiazdki nad głową), krwawienie
 * (obrażenia co sekundę; nie krwawią puste zbroje, kamienniki, upiory i cienie),
 * krew za krew (życie wraca), postrach (człowiek ucieka), odrzut, przebicie
 * pancerza i inne. Obrażenia każdego ciosu i strzału: 90-110% podstawy.
 *
 * Udane kucie: broń zrobiona przez bohatera w kuźni, warsztacie albo garbarni
 * ma 20% szans (więcej z umiejętnościami Hutnik i Mistrz cechu) na jedną cechę
 * więcej. Działa, dopóki bohater ma tę broń.
 *
 * Skrypt: Bron_Cechy.of(id), .slowa(id), .udaneSlowo(id), .szansaKucia()
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Bron_Cechy.js: brak TawernaCore.js (the Tawerna core is missing)");
    const PLUGIN = "Bron_Cechy";
    if (T.api(PLUGIN)) return;   // (put into the page twice: kept as it was)
    const CD = () => T.api("Bron_Cechy_Data");
    const BD = () => T.api("Bron_Data");
    const fight = () => { const P = T.api("Combat_parts"); return P && P.fight ? P.fight : null; };
    const report = (where, e) => console.error("[Bron_Cechy] " + where + ":", e);
    if (!window.Bron_Cechy_Data) console.warn("[Bron_Cechy] Bron_Cechy_Data.js not found - put it above this plugin");

    // KUCIE: the chance a weapon made by the hero comes out well (+ Combat.perk("forge.luck"): Hutnik 5% a rank, Mistrz cechu 10%);
    // its most. BLEED: the colour of its numbers and drops, a tick's frames. WORDS: the words over a target, the colour of the life given back
    const KUCIE = { szansa: 0.2, max: 0.6, kolor: "#ffe9a8" };
    const BLEED = { color: "#ff5a4a", drops: "#b8322a", every: 60 };
    const WORDS = { stun: ["Ogłuszony!", "#ffe066"], bleed: ["Krwawi!", "#ff7a6a"], fear: ["Postrach!", "#ffb070"], heal: "#7be08a" };
    const NONE = Object.freeze({});
    // the rolls of the traits (the stun, the bleeding, the fear, the forge): Math.random, or the tests' own (Bron_Cechy.rng = () => 0)
    const api = {};
    const rnd = () => (typeof api.rng === "function" ? api.rng() : Math.random());

    // ------------------------------------------------------------------
    // The save: the weapons forged well - { kucie: { id: { c, v, plus, d } }, udane: how many came out well, proby: weapons made }
    // ------------------------------------------------------------------
    const store = T.state.define("bron_cechy", () => ({ kucie: {}, udane: 0, proby: 0 }), { version: 1, owner: PLUGIN });
    const kucie = () => (window.$gameSystem ? store().kucie : {});

    // ------------------------------------------------------------------
    // A weapon's traits: its own (Bron_Cechy_Data.CECHY) and its forged one merged - one object a weapon, kept until something changes
    // (a weapon forged well, one given up, a new game, a load): nothing is made in the fight
    // ------------------------------------------------------------------
    let cache = Object.create(null), cacheRev = -1, cacheSys = null, rev = 0;
    const changed = () => { rev++; heldAt = -1; };
    function of(id) {
        id = Number(id) || 0;
        if (!id) return NONE;
        if (cacheRev !== rev || cacheSys !== window.$gameSystem) { cache = Object.create(null); cacheRev = rev; cacheSys = window.$gameSystem; }
        const had = cache[id];
        if (had) return had;
        const d = CD(), own = d ? d.of(id) : null, k = kucie()[id] || null;
        if ((!own || !Object.keys(own).length) && !k) return (cache[id] = NONE);
        const c = Object.assign({}, own || {});
        if (k) c[k.c] = k.plus ? (c[k.c] || 0) + k.v : k.v;
        return (cache[id] = c);
    }
    // the melee weapon in his hand (asked once a frame at most: the guard asks every frame it is up - Combat.parryWindow)
    let heldAt = -1, heldTr = NONE;
    function held() {
        if (heldAt === Graphics.frameCount) return heldTr;
        heldAt = Graphics.frameCount;
        const C = T.api("Combat");
        let id = 0;
        try { id = C && C.handMelee ? C.handMelee() : 0; } catch (e) { id = 0; }
        heldTr = id ? of(id) : NONE;
        return heldTr;
    }
    const heldTrait = key => (window.$gameSystem ? held()[key] || 0 : 0);
    const trwalosc = id => of(id).trwalosc || 0;

    // ------------------------------------------------------------------
    // What a target is
    // ------------------------------------------------------------------
    const isOf = (name, cls) => ref => { const A = T.api(name), C = A && A[cls]; return !!(ref && C && ref instanceof C); };
    const isCreature = isOf("Creatures", "Game_Creature");
    const isMan = isOf("Humans", "Game_Human");
    const isBeast = isOf("Hunting", "Game_Animal");
    // blood: flesh, a man, the mercenary in his mail - not the iron, the stone, a wraith, the straw
    function canBleed(ref) {
        if (!ref || !ref.isAnimal || ref._dummy || typeof ref._hp !== "number") return false;
        const F = fight(), s = F && F.surfaceOf ? F.surfaceOf(ref) : "flesh";
        return s === "flesh" || s === "man" || s === "mail";
    }
    // a stun rolled at a hit (k: { szansa, s }): only on what can reel (no boss - they keep their own rules)
    function stunRoll(k, a) {
        if (!k || !a || a._dead || a._dying || a._boss || typeof a._stun !== "number") return false;
        return rnd() < k.szansa;
    }

    // ------------------------------------------------------------------
    // A hit: what the target was just before it (kept here - no object made a blow), and what the traits do after it
    // ------------------------------------------------------------------
    const pre = { ref: null, hp: 0, x: 0, y: 0, jump: false };
    function beforeHit(ref) {
        pre.ref = ref || null;
        pre.hp = ref && typeof ref._hp === "number" ? ref._hp : 0;
        pre.x = ref ? ref._x : 0;
        pre.y = ref ? ref._y : 0;
        pre.jump = !!(ref && typeof ref.isJumping === "function" && ref.isJumping());
    }
    const word = (ref, w, scale) => { const F = fight(); if (F && F.numberAt && ref.centerX) F.numberAt(ref.centerX(), ref.centerY() - 1.55, w[0], w[1], scale || 0.8); };
    // tr: the weapon's traits; stunK: the stun rolled for this hit ({ szansa, s }) or null
    function afterHit(ref, tr, stunK) {
        if (!ref || pre.ref !== ref || !tr || tr === NONE) return;
        pre.ref = null;
        if (typeof ref._hp === "number" && !(ref._hp < pre.hp)) return;   // (blocked, rang off the plate whole, a hit on nothing: no trait)
        if (tr.krew_za_krew && ref.isAnimal && !ref._dummy) heal(tr.krew_za_krew);   // (the killing blow too)
        if (ref._dead || ref._dying || !(ref._hp > 0)) return;
        // the stun: the blow broke its balance whole (strike / shotHit) - it reels at least the trait's seconds
        if (stunK && ref._stun > 0) {
            ref._stun = Math.max(ref._stun, Math.round(stunK.s * 60));
            word(ref, WORDS.stun);
            api.stuns = (api.stuns || 0) + 1;
        }
        if (tr.krwawienie && canBleed(ref) && rnd() < tr.krwawienie.szansa) bleed(ref, tr.krwawienie);
        // fear: a man (not one who never gives up - a quest's) runs as when he loses heart (Humans.js flee)
        if (tr.postrach && isMan(ref) && !ref._surrendered && !ref._noSurrender && ref._mode !== "flee" && ref._mode !== "leave" && typeof ref.flee === "function" && rnd() < tr.postrach) {
            ref.flee();
            word(ref, WORDS.fear);
        }
        // the knock back farther: a hit that threw it back (its own rules - not the bosses, the stone, the iron, the flying) throws it
        // `odrzut` tiles more, while the way is free
        if (tr.odrzut && !pre.jump && typeof ref.isJumping === "function" && ref.isJumping()) push(ref, tr.odrzut);
    }
    function push(ref, n) {
        const bx = Math.sign(ref._x - pre.x), by = Math.sign(ref._y - pre.y);
        if ((!bx && !by) || (bx && by) || typeof ref.canPass !== "function") return;
        const d = bx > 0 ? 6 : bx < 0 ? 4 : by > 0 ? 2 : 8;
        let x = ref._x, y = ref._y, k = 0;
        while (k < n && ref.canPass(x, y, d)) { x += bx; y += by; k++; }
        if (!k) return;
        ref._x = pre.x;
        ref._y = pre.y;
        ref.jump(x - pre.x, y - pre.y);   // (one jump of the whole way, from where it stood)
    }
    // krew za krew: a part of his most life back
    function heal(part) {
        const a = window.$gameParty ? $gameParty.leader() : null;
        if (!a || a.isDead() || a.hp >= a.mhp) return 0;
        const n = Math.min(a.mhp - a.hp, Math.max(1, Math.round(a.mhp * part)));
        a.gainHp(n);
        const F = fight();
        if (F && F.numberAt) F.numberAt($gamePlayer._realX + 0.5, $gamePlayer._realY - 0.75, "+" + n, WORDS.heal, 0.85);
        api.healed = (api.healed || 0) + n;
        return n;
    }

    // ------------------------------------------------------------------
    // The bleeding: { ref, dps, left (seconds), t (frames to the next tick) } - the map's one list
    // ------------------------------------------------------------------
    const bleeds = [];
    const BLEED_HIT = Object.freeze({ poise: 0, bleed: true });
    function bleed(ref, k) {
        if (!canBleed(ref) || !k) return false;
        for (const b of bleeds) if (b.ref === ref) { b.left = Math.max(b.left, k.s); b.dps = Math.max(b.dps, k.dps); return true; }
        bleeds.push({ ref, dps: k.dps, left: k.s, t: BLEED.every });
        word(ref, WORDS.bleed, 0.75);
        T.emit("bronKrwawienie", { kind: typeof ref.kind === "function" ? ref.kind() : "", dps: k.dps, s: k.s });
        return true;
    }
    function gone(r) {
        if (!r || r._dead || r._dying || r._gone || r._surrendered || r._hidden || !(r._hp > 0)) return true;
        const list = isMan(r) ? T.call("Humans", "humans") : isCreature(r) ? T.call("Creatures", "creatures") : (T.api("Hunting") || {}).animals;
        return !Array.isArray(list) || list.indexOf(r) < 0;
    }
    function tick(b) {
        const r = b.ref, d = b.dps, F = fight(), x = r.centerX(), y = r.centerY();
        if (F && F.sparksAt) F.sparksAt(x, y - 0.35, BLEED.drops, 4);
        api.bled = (api.bled || 0) + Math.min(d, r._hp);
        if (r._hp - d > 0) {
            r._hp -= d;
            if (F && F.numberAt) F.numberAt(x, y - 0.9, String(d), BLEED.color, 0.85);
            return;
        }
        // the last drop: its own end - a creature's through its hit (a boss's phase, its fall), a man's and an animal's kill
        if (isCreature(r)) { T.call("Creatures", "hit", r, d, "bleed", BLEED_HIT); return; }
        if (F && F.numberAt) F.numberAt(x, y - 0.9, String(d), BLEED.color, 0.85);
        r._hp = 0;
        if (isMan(r)) T.call("Humans", "kill", r, "bleed");
        else T.call("Hunting", "kill", r, "bleed");
    }
    T.onMapUpdate(() => {
        if (!bleeds.length) return;
        for (let i = bleeds.length - 1; i >= 0; i--) {
            const b = bleeds[i];
            if (--b.t > 0) continue;
            b.t = BLEED.every;
            if (gone(b.ref)) { bleeds.splice(i, 1); continue; }
            try { tick(b); } catch (e) { report("bleed", e); }
            if (--b.left <= 0 || gone(b.ref)) bleeds.splice(i, 1);
        }
    }, { owner: PLUGIN, name: "bleed" });
    const clearBleeds = () => { bleeds.length = 0; };
    T.on("mapEnter", clearBleeds, { owner: PLUGIN });

    // ------------------------------------------------------------------
    // "Udane kucie"
    // ------------------------------------------------------------------
    const perk = key => { const C = T.api("Combat"); return C && C.perk ? C.perk(key) || 0 : 0; };
    const szansaKucia = () => Math.min(KUCIE.max, KUCIE.szansa + perk("forge.luck"));
    const itemOf = id => (window.$dataItems && $dataItems[id] && $dataItems[id].name ? $dataItems[id] : null);
    function forged(e) {
        if (!e || typeof e.recipe !== "string" || e.recipe.indexOf("bron_") !== 0 || !window.$gameSystem) return null;
        const id = Number(e.item), d = BD(), p = d ? d.przedmiot(id) : null, it = itemOf(id), C = CD();
        if (!p || p.typ !== "bron" || p.unikat || !it || !C) return null;
        const st = store();
        st.proby = (st.proby || 0) + 1;
        if (!(rnd() < szansaKucia())) return null;
        const k = C.wylosuj(p, C.of(id), rnd);
        if (!k) return null;
        st.kucie[id] = { c: k.c, v: k.v, plus: !!k.plus, d: T.time.day() };
        st.udane = (st.udane || 0) + 1;
        changed();
        T.call("Bron", "refresh");
        const w = C.slowo(k.c, k.v, p.rodzaj);
        T.popup("Udane kucie! " + it.name + ": " + w, { top: true, color: KUCIE.kolor });
        T.audio.se("Item3", { volume: 70 });
        T.emit("bronUdaneKucie", { id, cecha: k.c, v: k.v });
        return k;
    }
    T.on("craft", e => { try { forged(e); } catch (err) { report("craft", err); } }, { owner: PLUGIN });
    // its words on the card ("Udane kucie: obrażenia +2"): "" when the weapon has none
    function udaneSlowo(id) {
        const k = kucie()[Number(id)], C = CD(), d = BD(), p = d ? d.przedmiot(id) : null;
        return k && C ? C.slowo(k.c, k.v, p ? p.rodzaj : "") : "";
    }
    // all a weapon's words (Equipment's right hand): its own traits and the forged one
    function slowa(id) {
        const C = CD(), d = BD(), p = d ? d.przedmiot(id) : null, out = C ? C.slowa(C.of(id), p ? p.rodzaj : "") : [], u = udaneSlowo(id);
        if (u) out.push("udane kucie: " + u);
        return out.join(" · ");
    }
    // the forged one goes with the last copy: none in the bag, none in a chest (Farming), none in a bundle on the ground (Drops)
    function stillHas(id) {
        const it = itemOf(id);
        if (it && $gameParty.numItems(it) > 0) return true;
        const k = "i" + id;
        if (T.api("Farming")) {
            const f = T.state("farm"), b = f && f.buildings ? f.buildings : {};
            for (const m in b) for (const x of b[m] || []) if (x && x.store && x.store[k] > 0) return true;
        }
        const list = T.call("Drops", "list");
        return Array.isArray(list) && list.some(x => x.items && x.items[id] > 0);
    }
    function lose(id) {
        const st = window.$gameSystem ? store() : null;
        if (!st || !st.kucie[id] || stillHas(id)) return false;
        delete st.kucie[id];
        changed();
        return true;
    }
    const _gainItem = Game_Party.prototype.gainItem;
    Game_Party.prototype.gainItem = function(it, amount, includeEquip) {
        _gainItem.apply(this, arguments);
        if (amount < 0 && it && this === window.$gameParty && window.$gameSystem && DataManager.isItem(it) && store().kucie[it.id] && this.numItems(it) <= 0) {
            try { lose(it.id); } catch (e) { report("lose", e); }
        }
    };
    for (const ev of ["newGame", "load"]) T.on(ev, () => {
        clearBleeds();
        changed();
        try { if (ev === "load") for (const id of Object.keys(kucie())) lose(Number(id)); } catch (e) { report(ev, e); }
    }, { owner: PLUGIN });

    Object.assign(api, { VERSION: "1.0.0", KUCIE, BLEED, NONE, of, held, heldTrait, trwalosc, isCreature, isMan, isBeast, canBleed, stunRoll, beforeHit, afterHit,
        bleed, bleeds, heal, szansaKucia, forged, udaneSlowo, slowa, lose, state: () => store(), refresh: changed, rng: null });
    window.Bron_Cechy = T.register(PLUGIN, api);
})();
