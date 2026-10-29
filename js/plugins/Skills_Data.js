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
 *   ranks      - ile razy można w nią włożyć punkt (każdy stopień: 1 punkt)
 *   attr       - progi atrybutów (np. { str: 12 })
 *   fx         - działanie na stopień: klucz -> wartość (sumy stopni wszystkich
 *                znanych umiejętności czytają inne wtyczki: Combat.perk(klucz))
 *   text       - opis; {klucz} wstawia wartość fx razy stopień
 *   (nazwy i opisy umiejętności i dziedzin: js/teksty/umiejetnosci.txt)
 * Rząd wymaga poziomu postaci: ROW_LEVEL (0: 1, 1: 4, 2: 10, 3: 20, 4: 32, 5: 48).
 *
 * Klucze fx i formaty (FX): "%" procent, "n" liczba, "s" klatki jako sekundy.
 */

(() => {
    "use strict";

    const ROW_LEVEL = [1, 4, 10, 20, 32, 48];

    // how each effect key reads in the texts (the value per rank times the rank)
    const FX = {
        "melee.dmg": "%", "melee.crit": "%", "melee.poise": "%", "melee.breath": "%", "block.reduce": "%", "breath.regen": "%", "knock.resist": "%",
        "roll.iframes": "s", "hp.max": "n", "hurt": "%", "run.breath": "%",
        "stamina.cost": "%", "hunger": "%", "thirst": "%", "cold": "%", "sleep.rest": "%", "bandage.heal": "%", "wound.heal": "%", "carry": "n",
        "needs.penalty": "%", "food.value": "%", "food.buff": "%", "spoil": "%", "spoil.store": "%",
        "chop.hits": "%", "mine.hits": "%", "gather.cost": "%", "chop.yield": "%", "mine.yield": "%", "forage.yield": "%", "ore": "%",
        "crop.growth": "%", "crop.yield": "%", "crop.double": "%", "seed.chance": "%", "water.days": "n", "can.charges": "n", "farm.cost": "%",
        "produce.more": "%", "birds.raid": "%",
        "build.hits": "%", "build.cost": "%", "build.refund": "%", "build.spare": "%",
        "craft.speed": "%", "cook.speed": "%", "smelt.speed": "%", "craft.save": "%", "craft.double": "%", "cook.double": "%", "tool.wear": "%", "fire.fuel": "%", "sell": "%",
        "aim.speed": "%", "ranged.dmg": "%", "ranged.crit": "%", "ammo.save": "%", "shot.cooldown": "%", "sneak": "%", "hunt.dmg": "%",
        "carcass.meat": "%", "carcass.hide": "%", "carcass.sinew": "%", "snare.lure": "%", "fish": "%", "feathers": "n", "sneak.dmg": "%",
        "disarm": "%", "surrender": "%", "surrender.at": "%", "mind.resist": "%", "mind.short": "%", "mind.back": "s", "mind.see": "n"
    };

    // the fields (the tabs of the trees): their names and descriptions - js/teksty/umiejetnosci.txt, dziedziny.<id>
    const TREES = [{ id: "melee" }, { id: "defense" }, { id: "ranged" }, { id: "survival" }, { id: "gather" }, { id: "hunting" }, { id: "farming" },
        { id: "craft" }, { id: "build" }, { id: "cooking" }];
    Watki.scal(TREES, "umiejetnosci", "dziedziny", "id");

    // a skill; its name and description (text) - js/teksty/umiejetnosci.txt, umiejetnosci.<id> (merged in by the id once the files are read)
    const S = (id, tree, row, col, o) => Object.assign({ id, tree, row, col, name: "", text: "", ranks: 1, from: [], attr: {}, fx: {} }, o || {});

    const SKILLS = [
        // ---- Walka wręcz (the old stage-1 ids stay: combo4, charge, riposte, sweep, execute)
        S("m_power", "melee", 0, 2, { ranks: 3, fx: { "melee.dmg": 0.05 } }),
        S("combo4", "melee", 1, 1, { from: ["m_power"] }),
        S("charge", "melee", 1, 3, { from: ["m_power"], attr: { str: 12 } }),
        S("riposte", "melee", 2, 1, { from: ["combo4"], attr: { per: 12 } }),
        S("m_breath", "melee", 2, 2, { ranks: 2, from: ["combo4", "charge"], fx: { "melee.breath": 0.1 } }),
        S("m_poise", "melee", 2, 3, { ranks: 2, from: ["charge"], fx: { "melee.poise": 0.12 } }),
        // (stage 3, 2026-10-06 - the men of Humans.js): men give up sooner before him
        S("m_fear", "melee", 3, 2, { ranks: 2, from: ["m_breath"], attr: { wil: 10 }, fx: { "surrender": 0.15, "surrender.at": 0.05 } }),
        S("m_crit", "melee", 3, 1, { ranks: 2, from: ["riposte"], fx: { "melee.crit": 0.03 } }),
        S("sweep", "melee", 3, 3, { from: ["m_poise"], attr: { str: 20 } }),
        S("execute", "melee", 4, 1, { from: ["m_crit"] }),
        S("m_power2", "melee", 4, 3, { ranks: 2, from: ["sweep", "m_breath"], attr: { str: 28 }, fx: { "melee.dmg": 0.06 } }),
        S("m_master", "melee", 5, 2, { from: ["execute", "m_power2"], attr: { str: 35 }, fx: { "melee.dmg": 0.1, "melee.crit": 0.05 } }),

        // ---- Obrona (old ids: guard, keen, acrobat, thickskin, secondwind)
        S("d_body", "defense", 0, 2, { ranks: 3, fx: { "hp.max": 12 } }),
        S("guard", "defense", 1, 1, { from: ["d_body"] }),
        S("keen", "defense", 1, 3, { from: ["d_body"], attr: { per: 12 } }),
        S("d_block", "defense", 2, 0, { ranks: 2, from: ["guard"], fx: { "block.reduce": 0.07 } }),
        S("d_breath", "defense", 2, 2, { ranks: 2, from: ["guard", "keen"], fx: { "breath.regen": 0.15 } }),
        // (stage 3, 2026-10-06): a parried man may lose his weapon
        S("d_disarm", "defense", 2, 3,
            { ranks: 2, from: ["keen"], attr: { per: 14 }, fx: { "disarm": 0.3 } }),
        // (stage 4, 2026-10-06 - the creatures of the ruins, Creatures.js): Hart ducha against what hits the mind
        S("d_will", "defense", 1, 2,
            { ranks: 3, from: ["d_body"], attr: { wil: 8 }, fx: { "mind.resist": 0.08, "mind.short": 0.1 } }),
        S("d_truth", "defense", 3, 3,
            { from: ["d_will"], attr: { wil: 18 }, fx: { "mind.back": 45, "mind.see": 1 } }),
        S("acrobat", "defense", 2, 4, { from: ["keen"], attr: { dex: 14 } }),
        S("thickskin", "defense", 3, 1, { from: ["d_block", "d_breath"], attr: { con: 16 } }),
        S("d_knock", "defense", 3, 2, { ranks: 2, from: ["d_breath"], fx: { "knock.resist": 0.2 } }),
        S("d_roll", "defense", 3, 4, { ranks: 2, from: ["acrobat"], fx: { "roll.iframes": 3 } }),
        S("secondwind", "defense", 4, 1, { from: ["thickskin"] }),
        S("d_body2", "defense", 4, 3, { ranks: 2, from: ["d_knock", "d_roll"], attr: { con: 25 }, fx: { "hp.max": 20 } }),
        S("d_stone", "defense", 5, 2, { from: ["secondwind", "d_body2"], attr: { con: 35 }, fx: { "hurt": 0.12 } }),

        // ---- Strzelectwo
        S("r_aim", "ranged", 0, 2, { ranks: 3, fx: { "aim.speed": 0.08 } }),
        S("r_dmg", "ranged", 1, 1, { ranks: 3, from: ["r_aim"], fx: { "ranged.dmg": 0.08 } }),
        S("r_ammo", "ranged", 1, 3, { ranks: 2, from: ["r_aim"], fx: { "ammo.save": 0.2 } }),
        S("r_hunt", "ranged", 2, 0, { ranks: 2, from: ["r_dmg"], fx: { "hunt.dmg": 0.1 } }),
        S("r_crit", "ranged", 2, 1, { ranks: 2, from: ["r_dmg"], attr: { per: 14 }, fx: { "ranged.crit": 0.06 } }),
        S("r_fast", "ranged", 2, 3, { ranks: 2, from: ["r_ammo"], fx: { "shot.cooldown": 0.15 } }),
        S("r_silent", "ranged", 3, 2, { from: ["r_crit", "r_fast"], attr: { dex: 18 } }),
        S("r_heart", "ranged", 4, 2, { from: ["r_silent"], attr: { dex: 26 } }),
        S("r_eagle", "ranged", 4, 4, { ranks: 2, from: ["r_fast"], attr: { per: 22 }, fx: { "aim.speed": 0.1, "ranged.dmg": 0.05 } }),
        S("r_master", "ranged", 5, 2, { from: ["r_heart", "r_eagle"], attr: { dex: 35 }, fx: { "ranged.dmg": 0.15, "ranged.crit": 0.08 } }),

        // ---- Przetrwanie
        S("s_tough", "survival", 0, 2, { ranks: 3, fx: { "stamina.cost": 0.05 } }),
        S("s_food", "survival", 1, 1, { ranks: 3, from: ["s_tough"], fx: { "hunger": 0.08 } }),
        S("s_water", "survival", 1, 3, { ranks: 3, from: ["s_tough"], fx: { "thirst": 0.08 } }),
        S("s_sleep", "survival", 2, 0, { ranks: 2, from: ["s_food"], fx: { "sleep.rest": 0.15 } }),
        S("s_cold", "survival", 2, 2, { ranks: 2, from: ["s_food", "s_water"], fx: { "cold": 0.3 } }),
        S("s_run", "survival", 2, 4, { ranks: 2, from: ["s_water"], fx: { "run.breath": 0.15 } }),
        S("s_band", "survival", 3, 1, { ranks: 2, from: ["s_sleep", "s_cold"], fx: { "bandage.heal": 0.25 } }),
        S("s_heal", "survival", 3, 3, { ranks: 2, from: ["s_cold", "s_run"], attr: { con: 15 }, fx: { "wound.heal": 0.3 } }),
        S("s_carry", "survival", 4, 1, { ranks: 3, from: ["s_band"], attr: { str: 15 }, fx: { "carry": 4 } }),
        S("s_iron", "survival", 4, 3, { ranks: 2, from: ["s_heal"], fx: { "needs.penalty": 0.25 } }),
        S("s_master", "survival", 5, 2, { from: ["s_carry", "s_iron"], attr: { con: 30 }, fx: { "stamina.cost": 0.1, "hunger": 0.1, "thirst": 0.1 } }),

        // ---- Zbieractwo
        S("g_chop", "gather", 0, 1, { ranks: 3, fx: { "chop.hits": 0.1 } }),
        S("g_mine", "gather", 0, 3, { ranks: 3, fx: { "mine.hits": 0.1 } }),
        S("g_wood", "gather", 1, 0, { ranks: 2, from: ["g_chop"], fx: { "chop.yield": 0.2 } }),
        S("g_cost", "gather", 1, 2, { ranks: 2, from: ["g_chop", "g_mine"], fx: { "gather.cost": 0.12 } }),
        S("g_stone", "gather", 1, 4, { ranks: 2, from: ["g_mine"], fx: { "mine.yield": 0.2 } }),
        S("g_forage", "gather", 2, 1, { ranks: 2, from: ["g_wood", "g_cost"], fx: { "forage.yield": 0.25 } }),
        S("g_ore", "gather", 2, 3, { ranks: 2, from: ["g_stone", "g_cost"], attr: { per: 12 }, fx: { "ore": 0.1 } }),
        S("g_chop2", "gather", 3, 0, { ranks: 2, from: ["g_wood"], attr: { str: 16 }, fx: { "chop.hits": 0.1 } }),
        S("g_quick", "gather", 3, 2, { from: ["g_forage", "g_ore"] }),
        S("g_mine2", "gather", 3, 4, { ranks: 2, from: ["g_ore", "g_stone"], attr: { str: 16 }, fx: { "mine.hits": 0.1 } }),
        S("g_master", "gather", 4, 2, { from: ["g_quick", "g_chop2", "g_mine2"], attr: { per: 20 }, fx: { "chop.yield": 0.25, "mine.yield": 0.25, "forage.yield": 0.25 } }),

        // ---- Łowiectwo
        S("h_sneak", "hunting", 0, 2, { ranks: 3, fx: { "sneak": 0.1 } }),
        S("h_meat", "hunting", 1, 1, { ranks: 2, from: ["h_sneak"], fx: { "carcass.meat": 0.3 } }),
        S("h_hide", "hunting", 1, 3, { ranks: 2, from: ["h_sneak"], fx: { "carcass.hide": 0.3 } }),
        S("h_fish", "hunting", 2, 0, { ranks: 2, from: ["h_meat"], fx: { "fish": 0.1 } }),
        S("h_snare", "hunting", 2, 1, { ranks: 2, from: ["h_meat"], fx: { "snare.lure": 0.25 } }),
        S("h_sinew", "hunting", 2, 3, { from: ["h_hide"], fx: { "carcass.sinew": 0.5 } }),
        S("h_birds", "hunting", 2, 4, { ranks: 2, from: ["h_hide"], fx: { "feathers": 1 } }),
        // (stage 2 of the fight, 2026-10-05: the blow and the shot from hiding - Combat_Fight.js SNEAK)
        S("h_ambush", "hunting", 3, 1, { ranks: 2, from: ["h_snare"], attr: { per: 12 }, fx: { "sneak.dmg": 0.25 } }),
        S("h_track", "hunting", 3, 2, { ranks: 2, from: ["h_snare", "h_sinew"], attr: { per: 15 }, fx: { "sneak": 0.1, "hunt.dmg": 0.05 } }),
        S("h_beast", "hunting", 4, 2, { ranks: 2, from: ["h_track"], attr: { str: 18 }, fx: { "hunt.dmg": 0.1 } }),
        S("h_master", "hunting", 5, 2, { from: ["h_beast"], attr: { per: 30 }, fx: { "carcass.meat": 0.5, "carcass.hide": 0.5, "sneak": 0.1 } }),

        // ---- Rolnictwo
        S("f_grow", "farming", 0, 2, { ranks: 3, fx: { "crop.growth": 0.08 } }),
        S("f_yield", "farming", 1, 1, { ranks: 3, from: ["f_grow"], fx: { "crop.yield": 0.2 } }),
        S("f_can", "farming", 1, 3, { ranks: 2, from: ["f_grow"], fx: { "can.charges": 2 } }),
        S("f_seed", "farming", 2, 1, { ranks: 2, from: ["f_yield"], fx: { "seed.chance": 0.25 } }),
        S("f_cost", "farming", 2, 2, { ranks: 2, from: ["f_yield", "f_can"], fx: { "farm.cost": 0.2 } }),
        S("f_water", "farming", 2, 3, { ranks: 2, from: ["f_can"], fx: { "water.days": 1 } }),
        S("f_birds", "farming", 3, 1, { ranks: 2, from: ["f_seed"], fx: { "birds.raid": 0.3 } }),
        S("f_animals", "farming", 3, 3, { ranks: 2, from: ["f_water", "f_cost"], fx: { "produce.more": 0.25 } }),
        S("f_double", "farming", 4, 2, { ranks: 2, from: ["f_birds", "f_animals"], fx: { "crop.double": 0.08 } }),
        S("f_master", "farming", 5, 2, { from: ["f_double"], attr: { con: 20 }, fx: { "crop.growth": 0.15, "produce.more": 0.25 } }),

        // ---- Rzemiosło
        S("c_fast", "craft", 0, 2, { ranks: 3, fx: { "craft.speed": 0.08 } }),
        S("c_save", "craft", 1, 1, { ranks: 3, from: ["c_fast"], fx: { "craft.save": 0.1 } }),
        S("c_smelt", "craft", 1, 3, { ranks: 2, from: ["c_fast"], attr: { str: 12 }, fx: { "smelt.speed": 0.15 } }),
        S("c_wear", "craft", 2, 2, { ranks: 3, from: ["c_save", "c_smelt"], fx: { "tool.wear": 0.12 } }),
        S("c_double", "craft", 2, 0, { ranks: 2, from: ["c_save"], fx: { "craft.double": 0.08 } }),
        S("c_repair", "craft", 3, 3, { from: ["c_wear"] }),
        S("c_trade", "craft", 3, 1, { ranks: 2, from: ["c_double", "c_wear"], attr: { per: 10 }, fx: { "sell": 0.15 } }),
        S("c_master", "craft", 4, 2, { from: ["c_trade", "c_repair"], attr: { per: 20 }, fx: { "craft.speed": 0.15, "craft.save": 0.1 } }),

        // ---- Budownictwo
        S("b_hits", "build", 0, 2, { ranks: 3, fx: { "build.hits": 0.1 } }),
        S("b_cost", "build", 1, 1, { ranks: 2, from: ["b_hits"], fx: { "build.cost": 0.2 } }),
        S("b_refund", "build", 1, 3, { ranks: 2, from: ["b_hits"], fx: { "build.refund": 0.15 } }),
        S("b_spare", "build", 2, 2, { ranks: 2, from: ["b_cost", "b_refund"], fx: { "build.spare": 0.25 } }),
        S("b_hits2", "build", 3, 2, { ranks: 2, from: ["b_spare"], attr: { str: 15 }, fx: { "build.hits": 0.1 } }),
        S("b_master", "build", 4, 2, { from: ["b_hits2"], attr: { con: 18 }, fx: { "build.hits": 0.1, "build.cost": 0.2 } }),

        // ---- Kuchnia
        S("k_value", "cooking", 0, 2, { ranks: 3, fx: { "food.value": 0.08 } }),
        S("k_spoil", "cooking", 1, 1, { ranks: 3, from: ["k_value"], fx: { "spoil": 0.12 } }),
        S("k_fire", "cooking", 1, 3, { ranks: 2, from: ["k_value"], fx: { "fire.fuel": 0.25 } }),
        S("k_buff", "cooking", 2, 1, { ranks: 2, from: ["k_spoil"], fx: { "food.buff": 0.25 } }),
        S("k_speed", "cooking", 2, 3, { ranks: 2, from: ["k_fire"], fx: { "cook.speed": 0.15 } }),
        S("k_portion", "cooking", 3, 2, { ranks: 2, from: ["k_buff", "k_speed"], fx: { "cook.double": 0.12 } }),
        S("k_salt", "cooking", 4, 1, { from: ["k_portion"], fx: { "spoil.store": 0.5 } }),
        S("k_master", "cooking", 5, 2, { from: ["k_salt", "k_portion"], attr: { con: 15 }, fx: { "food.value": 0.15, "food.buff": 0.25 } })
    ];

    Watki.scal(SKILLS, "umiejetnosci", "umiejetnosci", "id");

    window.SkillData = { TREES, SKILLS, FX, ROW_LEVEL };
})();
