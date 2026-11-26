//=============================================================================
// Skills_Data.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Dane drzewek umiejętności (10 dziedzin, ~90 umiejętności): nazwy, opisy, stopnie, wymagania i działanie. Musi być przed Combat.js. v1.0.0
 * @author Claude
 *
 * @help
 * Same dane - czyta je Combat.js (ekran Postaci, menu P → Postać → zakładki
 * drzewek; Q / E zmieniają dziedzinę).
 *
 * Każda umiejętność:
 *   row, col   - miejsce w drzewku (rząd 0 u góry, kolumny 0-4)
 *   from       - umiejętności, z których do niej prowadzi droga (wystarczy
 *                znać JEDNĄ z nich); pusta lista = korzeń drzewka
 *   ranks      - ile razy można w nią włożyć punkt (każdy stopień: 1 punkt) -
 *                od 2026-11-26 każda ma 3 stopnie
 *   attrRanks  - progi atrybutów każdego stopnia: [1. stopień, 2., 3.], np.
 *                [{ str: 7 }, { str: 11 }, { str: 15, dex: 9 }] (stare `attr` -
 *                jeden próg na wszystkie - nadal działa, gdy nie ma attrRanks)
 *   fx         - działanie: klucz -> [razem na 1. stopniu, na 2., na 3.]
 *                (albo liczba: wartość na stopień, razy stopień); sumy wszystkich
 *                znanych umiejętności czytają inne wtyczki: Combat.perk(klucz)
 *   text       - opis; {klucz} wstawia wartość fx na danym stopniu
 *   (nazwy i opisy umiejętności i dziedzin: js/teksty/umiejetnosci.txt)
 * Rząd wymaga poziomu postaci: ROW_LEVEL (0: 1, 1: 3, 2: 6, 3: 10, 4: 14, 5: 18).
 *
 * Klucze fx i formaty (FX): "%" procent, "n" liczba, "s" klatki jako sekundy.
 */

(() => {
    "use strict";

    const ROW_LEVEL = [1, 3, 6, 10, 14, 18];   // (2026-11-26: was 1, 4, 10, 20, 32, 48)

    // how each effect key reads in the texts (the value per rank times the rank)
    const FX = {
        "melee.dmg": "%", "melee.crit": "%", "melee.poise": "%", "melee.breath": "%", "block.reduce": "%", "breath.regen": "%", "knock.resist": "%",
        "roll.iframes": "s", "dodge.tier": "n", "hp.max": "n", "hurt": "%", "run.breath": "%",
        "stamina.cost": "%", "hunger": "%", "thirst": "%", "cold": "%", "sleep.rest": "%", "bandage.heal": "%", "wound.heal": "%", "carry": "n",
        "needs.penalty": "%", "food.value": "%", "food.buff": "%", "spoil": "%", "spoil.store": "%",
        "chop.hits": "%", "mine.hits": "%", "gather.cost": "%", "chop.yield": "%", "mine.yield": "%", "forage.yield": "%", "ore": "%",
        "crop.growth": "%", "crop.yield": "%", "crop.double": "%", "seed.chance": "%", "water.days": "n", "can.charges": "n", "farm.cost": "%",
        "produce.more": "%", "birds.raid": "%",
        "build.hits": "%", "build.cost": "%", "build.refund": "%", "build.spare": "%",
        "craft.speed": "%", "cook.speed": "%", "smelt.speed": "%", "forge.luck": "%", "craft.save": "%", "craft.double": "%", "cook.double": "%", "tool.wear": "%", "fire.fuel": "%", "sell": "%",
        "aim.speed": "%", "ranged.dmg": "%", "ranged.crit": "%", "ammo.save": "%", "shot.cooldown": "%", "sneak": "%", "hunt.dmg": "%",
        "carcass.meat": "%", "carcass.hide": "%", "carcass.sinew": "%", "snare.lure": "%", "fish": "%", "feathers": "n", "sneak.dmg": "%",
        "disarm": "%", "surrender": "%", "surrender.at": "%", "mind.resist": "%", "mind.short": "%", "mind.back": "s", "mind.see": "n",
        "combo.last": "%", "heavy.charge": "%", "riposte.time": "s", "riposte.mult": "n", "execute.mult": "n", "block.breath": "%", "parry.window": "%", "wound.less": "%", "acrobat.cheap": "%", "secondwind.at": "%", "block.round": "n", "shot.quiet": "%", "heart.mult": "n", "pickup.cost": "%", "repair.save": "%",
        "melee.arc": "%", "melee.group": "%", "trap.see": "n", "hurt.crowd": "%", "rain.more": "%", "skin.sips": "n", "pets.learn": "%", "lock.ease": "n", "pick.save": "%", "buy": "%", "well.cost": "%", "barrel.more": "%", "tips": "%", "shift.cost": "%", "food.double": "n"
    };

    // the fields (the tabs of the trees): their names and descriptions - js/teksty/umiejetnosci.txt, dziedziny.<id>
    const TREES = [{ id: "melee" }, { id: "defense" }, { id: "ranged" }, { id: "survival" }, { id: "gather" }, { id: "hunting" }, { id: "farming" },
        { id: "craft" }, { id: "build" }, { id: "cooking" }];
    Watki.scal(TREES, "umiejetnosci", "dziedziny", "id");

    // a skill; its name and description (text) - js/teksty/umiejetnosci.txt, umiejetnosci.<id> (merged in by the id once the files are read)
    // (2026-11-26, the user: "niech każdy skill ma 3 poziomy" - every skill three ranks, each rank its own attributes: attrRanks)
    const S = (id, tree, row, col, o) => Object.assign({ id, tree, row, col, name: "", text: "", opis: "", stopnie: [], ranks: 3, from: [], attr: {}, attrRanks: null, fx: {} }, o || {});

    // (2026-11-26, the user: "2 na poziom, progi tak" - the trees rebuilt from the agreed page: 6 rows at levels 1 / 3 / 6 / 10 / 14 / 18,
    // the old double nodes merged (m_power2, d_body2, r_eagle, g_chop2, g_mine2, b_hits2 gone), new skills for fighting a group - their
    // rank tables live in the code that uses them: Combat_Fight.js (m_cleave, m_pierce, m_stun, m_victor, m_fury, m_whirl, d_push, Unik's
    // DODGE_TIERS), Hunting_Weapons.js (r_pierce, r_volley, r_pin); old saves get their points back once - Combat.js SKILLS_VERSION)
    const SKILLS = [
        // ---- Walka wręcz
        S("m_power", "melee", 0, 2, { attrRanks: [{}, { str: 8 }, { str: 12, dex: 8 }], fx: { "melee.dmg": [0.08, 0.16, 0.25] } }),
        S("combo4", "melee", 1, 1, { from: ["m_power"], attrRanks: [{ dex: 7 }, { dex: 11 }, { dex: 15, str: 9 }], fx: { "combo.last": [0, 0.25, 0.5] } }),
        S("m_cleave", "melee", 1, 2, { from: ["m_power"], attrRanks: [{ str: 7 }, { str: 11 }, { str: 15, dex: 9 }] }),
        S("charge", "melee", 1, 3, { from: ["m_power"], attrRanks: [{ str: 7 }, { str: 11 }, { str: 15, con: 9 }], fx: { "heavy.charge": [0.25, 0.4, 0.6] } }),
        S("riposte", "melee", 2, 0, { from: ["combo4"], attrRanks: [{ per: 9 }, { per: 13 }, { per: 18, dex: 11 }], fx: { "riposte.time": [120, 150, 180], "riposte.mult": [1.6, 1.8, 2] } }),
        S("sweep", "melee", 2, 1, { from: ["combo4", "m_cleave"], attrRanks: [{ str: 9 }, { str: 13 }, { str: 18, dex: 11 }], fx: { "melee.arc": [0.05, 0.1, 0.15] } }),
        S("m_pierce", "melee", 2, 2, { from: ["m_cleave"], attrRanks: [{ str: 9 }, { str: 13 }, { str: 18, dex: 11 }] }),
        S("m_stun", "melee", 2, 3, { from: ["m_cleave", "charge"], attrRanks: [{ str: 9 }, { str: 13 }, { str: 18, con: 11 }] }),
        S("m_breath", "melee", 2, 4, { from: ["charge"], attrRanks: [{ con: 9 }, { con: 13 }, { con: 18, str: 11 }], fx: { "melee.breath": [0.1, 0.2, 0.3] } }),
        S("m_poise", "melee", 3, 1, { from: ["sweep", "riposte"], attrRanks: [{ str: 11 }, { str: 16 }, { str: 21, per: 13 }], fx: { "melee.poise": [0.12, 0.24, 0.36] } }),
        S("m_fear", "melee", 3, 2, { from: ["m_pierce", "m_stun"], attrRanks: [{ wil: 11 }, { wil: 16 }, { wil: 21, str: 13 }], fx: { "surrender": [0.15, 0.3, 0.45], "surrender.at": [0.05, 0.1, 0.15] } }),
        S("m_victor", "melee", 3, 3, { from: ["m_stun", "m_breath"], attrRanks: [{ con: 11 }, { con: 16 }, { con: 21, str: 13 }] }),
        S("m_crit", "melee", 4, 1, { from: ["m_poise"], attrRanks: [{ per: 13 }, { per: 18 }, { per: 24, str: 15 }], fx: { "melee.crit": [0.04, 0.07, 0.1] } }),
        S("execute", "melee", 4, 2, { from: ["m_poise", "m_fear"], attrRanks: [{ str: 13 }, { str: 18 }, { str: 24, per: 15 }], fx: { "execute.mult": [2, 2.5, 3] } }),
        S("m_fury", "melee", 4, 3, { from: ["m_victor"], attrRanks: [{ str: 13 }, { str: 18 }, { str: 24, wil: 15 }] }),
        S("m_whirl", "melee", 5, 1, { from: ["m_crit"], attrRanks: [{ str: 16 }, { str: 22 }, { str: 28, con: 18 }] }),
        S("m_master", "melee", 5, 2, { from: ["execute", "m_fury"], attrRanks: [{ str: 16 }, { str: 22 }, { str: 28, dex: 18 }], fx: { "melee.dmg": [0.05, 0.1, 0.15], "melee.crit": [0.02, 0.04, 0.06], "melee.group": [0.1, 0.2, 0.3] } }),

        // ---- Obrona
        S("d_body", "defense", 0, 2, { attrRanks: [{}, { con: 8 }, { con: 12, str: 8 }], fx: { "hp.max": [20, 40, 60] } }),
        S("d_traps", "defense", 0, 4, { attrRanks: [{}, { per: 8 }, { per: 12, dex: 8 }], fx: { "trap.see": [1, 2, 3] } }),
        S("guard", "defense", 1, 1, { from: ["d_body"], attrRanks: [{ con: 7 }, { con: 11 }, { con: 15, str: 9 }], fx: { "block.breath": [0.25, 0.4, 0.55] } }),
        S("d_will", "defense", 1, 2, { from: ["d_body"], attrRanks: [{ wil: 7 }, { wil: 11 }, { wil: 15, con: 9 }], fx: { "mind.resist": [0.08, 0.16, 0.24], "mind.short": [0.1, 0.2, 0.3] } }),
        S("keen", "defense", 1, 3, { from: ["d_body"], attrRanks: [{ per: 7 }, { per: 11 }, { per: 15, dex: 9 }], fx: { "parry.window": [0.3, 0.5, 0.75] } }),
        S("d_block", "defense", 2, 0, { from: ["guard"], attrRanks: [{ str: 9 }, { str: 13 }, { str: 18, con: 11 }], fx: { "block.reduce": [0.07, 0.14, 0.21] } }),
        S("d_breath", "defense", 2, 1, { from: ["guard"], attrRanks: [{ con: 9 }, { con: 13 }, { con: 18, wil: 11 }], fx: { "breath.regen": [0.15, 0.3, 0.45] } }),
        S("thickskin", "defense", 2, 2, { from: ["guard", "keen"], attrRanks: [{ con: 9 }, { con: 13 }, { con: 18, str: 11 }], fx: { "wound.less": [0.3, 0.5, 0.7] } }),
        S("acrobat", "defense", 2, 4, { from: ["keen", "d_traps"], attrRanks: [{ dex: 9 }, { dex: 13 }, { dex: 18, con: 11 }], fx: { "acrobat.cheap": [0.4, 0.55, 0.7] } }),
        S("d_push", "defense", 3, 0, { from: ["d_block"], attrRanks: [{ str: 11 }, { str: 16 }, { str: 21, con: 13 }] }),
        S("d_knock", "defense", 3, 2, { from: ["thickskin", "d_breath"], attrRanks: [{ con: 11 }, { con: 16 }, { con: 21, str: 13 }], fx: { "knock.resist": [0.2, 0.4, 0.6] } }),
        S("d_disarm", "defense", 3, 3, { from: ["keen"], attrRanks: [{ per: 11 }, { per: 16 }, { per: 21, dex: 13 }], fx: { "disarm": [0.2, 0.35, 0.5] } }),
        S("d_roll", "defense", 0, 0, { attrRanks: [{}, { dex: 10 }, { dex: 16, con: 12 }] }),
        S("d_back", "defense", 4, 1, { from: ["d_push", "d_knock"], attrRanks: [{ con: 13 }, { con: 18 }, { con: 24, wil: 15 }], fx: { "hurt.crowd": [0.1, 0.2, 0.3] } }),
        S("secondwind", "defense", 4, 2, { from: ["d_knock"], attrRanks: [{ con: 13 }, { con: 18 }, { con: 24, wil: 15 }], fx: { "secondwind.at": [0.3, 0.4, 0.5] } }),
        S("d_truth", "defense", 4, 3, { from: ["d_will", "d_disarm"], attrRanks: [{ wil: 13 }, { wil: 18 }, { wil: 24, per: 15 }], fx: { "mind.back": [45, 75, 105], "mind.see": [1, 1, 1] } }),
        S("d_round", "defense", 5, 1, { from: ["d_back"], attrRanks: [{ con: 16 }, { con: 22 }, { con: 28, dex: 18 }], fx: { "block.round": [0.55, 0.85, 1.3] } }),
        S("d_stone", "defense", 5, 2, { from: ["d_back", "secondwind"], attrRanks: [{ con: 16 }, { con: 22 }, { con: 28, wil: 18 }], fx: { "hurt": [0.05, 0.1, 0.15] } }),

        // ---- Strzelectwo
        S("r_aim", "ranged", 0, 1, { attrRanks: [{}, { dex: 8 }, { dex: 12, per: 8 }], fx: { "aim.speed": [0.1, 0.2, 0.3] } }),
        S("r_ammo", "ranged", 0, 3, { attrRanks: [{}, { per: 8 }, { per: 12, dex: 8 }], fx: { "ammo.save": [0.15, 0.3, 0.45] } }),
        S("r_dmg", "ranged", 1, 2, { from: ["r_aim", "r_ammo"], attrRanks: [{ str: 7 }, { str: 11 }, { str: 15, dex: 9 }], fx: { "ranged.dmg": [0.08, 0.16, 0.25] } }),
        S("r_hunt", "ranged", 2, 0, { from: ["r_dmg"], attrRanks: [{ per: 9 }, { per: 13 }, { per: 18, dex: 11 }], fx: { "hunt.dmg": [0.1, 0.2, 0.3] } }),
        S("r_crit", "ranged", 2, 1, { from: ["r_dmg"], attrRanks: [{ per: 9 }, { per: 13 }, { per: 18, dex: 11 }], fx: { "ranged.crit": [0.05, 0.09, 0.13] } }),
        S("r_fast", "ranged", 2, 3, { from: ["r_dmg"], attrRanks: [{ dex: 9 }, { dex: 13 }, { dex: 18, per: 11 }], fx: { "shot.cooldown": [0.12, 0.24, 0.35] } }),
        S("r_pierce", "ranged", 3, 1, { from: ["r_crit"], attrRanks: [{ dex: 11 }, { dex: 16 }, { dex: 21, str: 13 }] }),
        S("r_silent", "ranged", 3, 3, { from: ["r_fast", "r_hunt"], attrRanks: [{ dex: 11 }, { dex: 16 }, { dex: 21, per: 13 }], fx: { "shot.quiet": [0.3, 0.5, 0.7] } }),
        S("r_volley", "ranged", 4, 1, { from: ["r_pierce"], attrRanks: [{ dex: 13 }, { dex: 18 }, { dex: 24, str: 15 }] }),
        S("r_heart", "ranged", 4, 2, { from: ["r_pierce", "r_silent"], attrRanks: [{ dex: 13 }, { dex: 18 }, { dex: 24, per: 15 }], fx: { "heart.mult": [2, 2.5, 3] } }),
        S("r_pin", "ranged", 4, 3, { from: ["r_silent"], attrRanks: [{ dex: 13 }, { dex: 18 }, { dex: 24, per: 15 }] }),
        S("r_master", "ranged", 5, 2, { from: ["r_volley", "r_heart", "r_pin"], attrRanks: [{ dex: 16 }, { dex: 22 }, { dex: 28, per: 18 }], fx: { "ranged.dmg": [0.05, 0.1, 0.15], "ranged.crit": [0.03, 0.05, 0.08] } }),

        // ---- Przetrwanie
        S("s_tough", "survival", 0, 2, { attrRanks: [{}, { con: 8 }, { con: 12, str: 8 }], fx: { "stamina.cost": [0.05, 0.1, 0.15] } }),
        S("s_food", "survival", 1, 0, { from: ["s_tough"], attrRanks: [{ con: 7 }, { con: 11 }, { con: 15, wil: 9 }], fx: { "hunger": [0.08, 0.16, 0.24] } }),
        S("s_water", "survival", 1, 1, { from: ["s_tough"], attrRanks: [{ con: 7 }, { con: 11 }, { con: 15, wil: 9 }], fx: { "thirst": [0.12, 0.24, 0.36] } }),
        S("s_rain", "survival", 1, 2, { from: ["s_tough"], attrRanks: [{ per: 7 }, { per: 11 }, { per: 15, con: 9 }], fx: { "rain.more": [0.25, 0.5, 0.75], "skin.sips": [1, 1, 2] } }),
        S("s_carry", "survival", 1, 4, { from: ["s_tough"], attrRanks: [{ str: 7 }, { str: 11 }, { str: 15, con: 9 }], fx: { "carry": [4, 8, 12] } }),
        S("s_sleep", "survival", 2, 0, { from: ["s_food"], attrRanks: [{ wil: 9 }, { wil: 13 }, { wil: 18, con: 11 }], fx: { "sleep.rest": [0.15, 0.3, 0.45] } }),
        S("s_cold", "survival", 2, 1, { from: ["s_water", "s_rain"], attrRanks: [{ con: 9 }, { con: 13 }, { con: 18, wil: 11 }], fx: { "cold": [0.25, 0.5, 0.75] } }),
        S("s_run", "survival", 2, 3, { from: ["s_carry"], attrRanks: [{ con: 9 }, { con: 13 }, { con: 18, dex: 11 }], fx: { "run.breath": [0.15, 0.3, 0.45] } }),
        S("s_band", "survival", 2, 4, { from: ["s_carry"], attrRanks: [{ per: 9 }, { per: 13 }, { per: 18, con: 11 }], fx: { "bandage.heal": [0.25, 0.5, 0.75] } }),
        S("s_heal", "survival", 3, 4, { from: ["s_band"], attrRanks: [{ con: 11 }, { con: 16 }, { con: 21, wil: 13 }], fx: { "wound.heal": [0.3, 0.6, 0.9] } }),
        S("s_iron", "survival", 4, 2, { from: ["s_cold", "s_heal", "s_sleep"], attrRanks: [{ con: 13 }, { con: 18 }, { con: 24, wil: 15 }], fx: { "needs.penalty": [0.2, 0.4, 0.6] } }),
        S("s_master", "survival", 5, 2, { from: ["s_iron"], attrRanks: [{ con: 16 }, { con: 22 }, { con: 28, wil: 18 }], fx: { "stamina.cost": [0.04, 0.07, 0.1], "hunger": [0.04, 0.07, 0.1], "thirst": [0.04, 0.07, 0.1], "rain.more": [0.35, 0.7, 1] } }),

        // ---- Zbieractwo
        S("g_chop", "gather", 0, 1, { attrRanks: [{}, { str: 8 }, { str: 12, dex: 8 }], fx: { "chop.hits": [0.15, 0.3, 0.4] } }),
        S("g_mine", "gather", 0, 3, { attrRanks: [{}, { str: 8 }, { str: 12, con: 8 }], fx: { "mine.hits": [0.15, 0.3, 0.4] } }),
        S("g_wood", "gather", 1, 0, { from: ["g_chop"], attrRanks: [{ str: 7 }, { str: 11 }, { str: 15, per: 9 }], fx: { "chop.yield": [0.2, 0.4, 0.6] } }),
        S("g_cost", "gather", 1, 2, { from: ["g_chop", "g_mine"], attrRanks: [{ con: 7 }, { con: 11 }, { con: 15, str: 9 }], fx: { "gather.cost": [0.12, 0.24, 0.35] } }),
        S("g_stone", "gather", 1, 4, { from: ["g_mine"], attrRanks: [{ str: 7 }, { str: 11 }, { str: 15, per: 9 }], fx: { "mine.yield": [0.2, 0.4, 0.6] } }),
        S("g_forage", "gather", 2, 1, { from: ["g_wood", "g_cost"], attrRanks: [{ per: 9 }, { per: 13 }, { per: 18, dex: 11 }], fx: { "forage.yield": [0.25, 0.5, 0.75] } }),
        S("g_ore", "gather", 2, 3, { from: ["g_stone", "g_cost"], attrRanks: [{ per: 9 }, { per: 13 }, { per: 18, str: 11 }], fx: { "ore": [0.1, 0.2, 0.3] } }),
        S("g_quick", "gather", 3, 2, { from: ["g_forage", "g_ore"], attrRanks: [{ dex: 11 }, { dex: 16 }, { dex: 21, con: 13 }], fx: { "pickup.cost": [0.4, 0.7, 1] } }),
        S("g_master", "gather", 4, 2, { from: ["g_quick"], attrRanks: [{ per: 13 }, { per: 18 }, { per: 24, str: 15 }], fx: { "chop.yield": [0.1, 0.2, 0.3], "mine.yield": [0.1, 0.2, 0.3], "forage.yield": [0.1, 0.2, 0.3] } }),

        // ---- Łowiectwo
        S("h_sneak", "hunting", 0, 2, { attrRanks: [{}, { dex: 8 }, { dex: 12, per: 8 }], fx: { "sneak": [0.15, 0.3, 0.4] } }),
        S("h_snare", "hunting", 1, 0, { from: ["h_sneak"], attrRanks: [{ per: 7 }, { per: 11 }, { per: 15, dex: 9 }], fx: { "snare.lure": [0.25, 0.5, 0.75] } }),
        S("h_meat", "hunting", 1, 1, { from: ["h_sneak"], attrRanks: [{ str: 7 }, { str: 11 }, { str: 15, per: 9 }], fx: { "carcass.meat": [0.3, 0.6, 0.9] } }),
        S("h_hide", "hunting", 1, 3, { from: ["h_sneak"], attrRanks: [{ dex: 7 }, { dex: 11 }, { dex: 15, per: 9 }], fx: { "carcass.hide": [0.3, 0.6, 0.9] } }),
        S("h_fish", "hunting", 2, 0, { from: ["h_snare"], attrRanks: [{ per: 9 }, { per: 13 }, { per: 18, wil: 11 }], fx: { "fish": [0.1, 0.2, 0.3] } }),
        S("h_pets", "hunting", 2, 1, { from: ["h_meat"], attrRanks: [{ wil: 9 }, { wil: 13 }, { wil: 18, per: 11 }], fx: { "pets.learn": [0.25, 0.5, 0.75] } }),
        S("h_sinew", "hunting", 2, 3, { from: ["h_hide"], attrRanks: [{ dex: 9 }, { dex: 13 }, { dex: 18, per: 11 }], fx: { "carcass.sinew": [0.25, 0.5, 0.75] } }),
        S("h_birds", "hunting", 2, 4, { from: ["h_hide"], attrRanks: [{ per: 9 }, { per: 13 }, { per: 18, dex: 11 }], fx: { "feathers": [1, 2, 3] } }),
        S("h_ambush", "hunting", 3, 1, { from: ["h_pets"], attrRanks: [{ dex: 11 }, { dex: 16 }, { dex: 21, per: 13 }], fx: { "sneak.dmg": [0.25, 0.5, 0.75] } }),
        S("h_track", "hunting", 3, 3, { from: ["h_sinew", "h_birds"], attrRanks: [{ per: 11 }, { per: 16 }, { per: 21, wil: 13 }], fx: { "hunt.dmg": [0.05, 0.1, 0.15] } }),
        S("h_beast", "hunting", 4, 2, { from: ["h_ambush", "h_track"], attrRanks: [{ str: 13 }, { str: 18 }, { str: 24, per: 15 }], fx: { "hunt.dmg": [0.1, 0.2, 0.3] } }),
        S("h_master", "hunting", 5, 2, { from: ["h_beast"], attrRanks: [{ per: 16 }, { per: 22 }, { per: 28, dex: 18 }], fx: { "carcass.meat": [0.2, 0.35, 0.5], "carcass.hide": [0.2, 0.35, 0.5], "sneak": [0.04, 0.07, 0.1] } }),

        // ---- Rolnictwo
        S("f_grow", "farming", 0, 2, { attrRanks: [{}, { con: 8 }, { con: 12, wil: 8 }], fx: { "crop.growth": [0.08, 0.16, 0.24] } }),
        S("f_yield", "farming", 1, 1, { from: ["f_grow"], attrRanks: [{ con: 7 }, { con: 11 }, { con: 15, per: 9 }], fx: { "crop.yield": [0.2, 0.4, 0.6] } }),
        S("f_can", "farming", 1, 3, { from: ["f_grow"], attrRanks: [{ str: 7 }, { str: 11 }, { str: 15, con: 9 }], fx: { "can.charges": [2, 4, 6] } }),
        S("f_water", "farming", 1, 4, { from: ["f_grow"], attrRanks: [{ per: 7 }, { per: 11 }, { per: 15, con: 9 }], fx: { "water.days": [1, 2, 3] } }),
        S("f_seed", "farming", 2, 1, { from: ["f_yield"], attrRanks: [{ per: 9 }, { per: 13 }, { per: 18, con: 11 }], fx: { "seed.chance": [0.25, 0.5, 0.75] } }),
        S("f_cost", "farming", 2, 2, { from: ["f_yield", "f_can"], attrRanks: [{ con: 9 }, { con: 13 }, { con: 18, str: 11 }], fx: { "farm.cost": [0.15, 0.3, 0.45] } }),
        S("f_birds", "farming", 3, 1, { from: ["f_seed"], attrRanks: [{ per: 11 }, { per: 16 }, { per: 21, wil: 13 }], fx: { "birds.raid": [0.25, 0.5, 0.75] } }),
        S("f_animals", "farming", 3, 3, { from: ["f_cost", "f_water"], attrRanks: [{ wil: 11 }, { wil: 16 }, { wil: 21, con: 13 }], fx: { "produce.more": [0.25, 0.5, 0.75] } }),
        S("f_double", "farming", 4, 2, { from: ["f_birds", "f_animals"], attrRanks: [{ con: 13 }, { con: 18 }, { con: 24, per: 15 }], fx: { "crop.double": [0.06, 0.12, 0.18] } }),
        S("f_master", "farming", 5, 2, { from: ["f_double"], attrRanks: [{ con: 16 }, { con: 22 }, { con: 28, wil: 18 }], fx: { "crop.growth": [0.05, 0.1, 0.15], "produce.more": [0.1, 0.2, 0.3] } }),

        // ---- Rzemiosło
        S("c_fast", "craft", 0, 2, { attrRanks: [{}, { dex: 8 }, { dex: 12, per: 8 }], fx: { "craft.speed": [0.08, 0.16, 0.24] } }),
        S("c_lock", "craft", 1, 0, { from: ["c_fast"], attrRanks: [{ dex: 7 }, { dex: 11 }, { dex: 15, per: 9 }], fx: { "lock.ease": [1, 2, 3], "pick.save": [0.2, 0.4, 0.6] } }),
        S("c_save", "craft", 1, 1, { from: ["c_fast"], attrRanks: [{ per: 7 }, { per: 11 }, { per: 15, dex: 9 }], fx: { "craft.save": [0.1, 0.2, 0.3] } }),
        S("c_trade", "craft", 1, 3, { from: ["c_fast"], attrRanks: [{ per: 7 }, { per: 11 }, { per: 15, wil: 9 }], fx: { "sell": [0.1, 0.2, 0.3] } }),
        S("c_haggle", "craft", 1, 4, { from: ["c_fast"], attrRanks: [{ wil: 7 }, { wil: 11 }, { wil: 15, per: 9 }], fx: { "buy": [0.07, 0.14, 0.2] } }),
        S("c_smelt", "craft", 2, 1, { from: ["c_save"], attrRanks: [{ str: 9 }, { str: 13 }, { str: 18, con: 11 }], fx: { "smelt.speed": [0.15, 0.3, 0.45], "forge.luck": [0.05, 0.1, 0.15] } }),
        S("c_wear", "craft", 2, 2, { from: ["c_save", "c_trade"], attrRanks: [{ dex: 9 }, { dex: 13 }, { dex: 18, con: 11 }], fx: { "tool.wear": [0.12, 0.24, 0.36] } }),
        S("c_double", "craft", 3, 1, { from: ["c_smelt"], attrRanks: [{ dex: 11 }, { dex: 16 }, { dex: 21, per: 13 }], fx: { "craft.double": [0.06, 0.12, 0.18] } }),
        S("c_repair", "craft", 3, 3, { from: ["c_wear"], attrRanks: [{ dex: 11 }, { dex: 16 }, { dex: 21, str: 13 }], fx: { "repair.save": [0.3, 0.5, 0.7] } }),
        S("c_master", "craft", 4, 2, { from: ["c_double", "c_repair"], attrRanks: [{ dex: 13 }, { dex: 18 }, { dex: 24, per: 15 }], fx: { "craft.speed": [0.05, 0.1, 0.15], "craft.save": [0.04, 0.07, 0.1], "forge.luck": [0.04, 0.07, 0.1] } }),

        // ---- Budownictwo
        S("b_hits", "build", 0, 2, { attrRanks: [{}, { str: 8 }, { str: 12, con: 8 }], fx: { "build.hits": [0.15, 0.3, 0.4] } }),
        S("b_cost", "build", 1, 1, { from: ["b_hits"], attrRanks: [{ con: 7 }, { con: 11 }, { con: 15, str: 9 }], fx: { "build.cost": [0.15, 0.3, 0.45] } }),
        S("b_refund", "build", 1, 3, { from: ["b_hits"], attrRanks: [{ per: 7 }, { per: 11 }, { per: 15, str: 9 }], fx: { "build.refund": [0.15, 0.3, 0.45] } }),
        S("b_spare", "build", 2, 2, { from: ["b_cost", "b_refund"], attrRanks: [{ per: 9 }, { per: 13 }, { per: 18, dex: 11 }], fx: { "build.spare": [0.2, 0.35, 0.5] } }),
        S("b_well", "build", 2, 4, { from: ["b_refund"], attrRanks: [{ str: 9 }, { str: 13 }, { str: 18, con: 11 }], fx: { "well.cost": [0.25, 0.4, 0.5], "barrel.more": [0.25, 0.5, 0.75] } }),
        S("b_master", "build", 4, 2, { from: ["b_spare", "b_well"], attrRanks: [{ str: 13 }, { str: 18 }, { str: 24, con: 15 }], fx: { "build.hits": [0.04, 0.07, 0.1], "build.cost": [0.07, 0.14, 0.2] } }),

        // ---- Kuchnia
        S("k_value", "cooking", 0, 1, { attrRanks: [{}, { per: 8 }, { per: 12, con: 8 }], fx: { "food.value": [0.08, 0.16, 0.24] } }),
        S("k_fire", "cooking", 0, 3, { attrRanks: [{}, { con: 8 }, { con: 12, per: 8 }], fx: { "fire.fuel": [0.25, 0.5, 0.75] } }),
        S("k_spoil", "cooking", 1, 1, { from: ["k_value"], attrRanks: [{ per: 7 }, { per: 11 }, { per: 15, wil: 9 }], fx: { "spoil": [0.12, 0.24, 0.36] } }),
        S("k_tips", "cooking", 1, 3, { from: ["k_value", "k_fire"], attrRanks: [{ wil: 7 }, { wil: 11 }, { wil: 15, per: 9 }], fx: { "tips": [0.15, 0.3, 0.45] } }),
        S("k_buff", "cooking", 2, 0, { from: ["k_spoil"], attrRanks: [{ per: 9 }, { per: 13 }, { per: 18, con: 11 }], fx: { "food.buff": [0.25, 0.5, 0.75] } }),
        S("k_speed", "cooking", 2, 2, { from: ["k_spoil", "k_fire"], attrRanks: [{ dex: 9 }, { dex: 13 }, { dex: 18, per: 11 }], fx: { "cook.speed": [0.15, 0.3, 0.45] } }),
        S("k_shift", "cooking", 2, 4, { from: ["k_tips"], attrRanks: [{ con: 9 }, { con: 13 }, { con: 18, wil: 11 }], fx: { "shift.cost": [0.15, 0.25, 0.35] } }),
        S("k_portion", "cooking", 3, 2, { from: ["k_buff", "k_speed"], attrRanks: [{ per: 11 }, { per: 16 }, { per: 21, dex: 13 }], fx: { "cook.double": [0.1, 0.2, 0.3] } }),
        S("k_salt", "cooking", 4, 1, { from: ["k_portion"], attrRanks: [{ per: 13 }, { per: 18 }, { per: 24, wil: 15 }], fx: { "spoil.store": [0.3, 0.45, 0.6] } }),
        S("k_master", "cooking", 5, 2, { from: ["k_salt", "k_portion"], attrRanks: [{ per: 16 }, { per: 22 }, { per: 28, con: 18 }], fx: { "food.value": [0.05, 0.1, 0.15], "food.buff": [0.1, 0.2, 0.3], "food.double": [0, 0, 1] } })
    ];

    Watki.scal(SKILLS, "umiejetnosci", "umiejetnosci", "id");

    window.SkillData = { TREES, SKILLS, FX, ROW_LEVEL };
})();
