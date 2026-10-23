//=============================================================================
// Rywal_Data.js
//=============================================================================
// The data of W9 chapter 3 "Rywal w ruinach" (docs/QUESTY.md W9 ch. 3): someone from outside goes down for the Heart too - the one
// the hero did not win over. Exactly one party, by the state of the game (Rywal.js who()):
//   1. grum     - Grum Żelazna Pięść with his mercenaries: W8 went to the faction (w8Faction) or Grum beat the hero at the tunnel
//                 (w8Lost) - and he is not an ally, gone or dead
//   2. lord     - the Lord's men (the manor's guard): the Lord is a rival at the Heart (Underground.lordStance: W1 a, lordCold, the
//                 manor's branch of the cistern shut, the field lost and not bought back)
//   3. baltazar - Baltazar Vey's men (the Black Eyes' smugglers): Baltazar is not in the hero's grip (W5 unfinished, an enemy, his
//                 kantor shut and he back with mercenaries)
//   4. kopacze  - the Black Eyes' own diggers with their commander (Act III's "Dowódca kopaczy"): Baltazar is in the hero's grip -
//                 the double game, w5FactionWatches: the faction itself follows the hero - and nobody above is a rival (the case
//                 "everyone won over": the faction comes anyway, as Act III shows)
// They go in through the tavern's cellar the night after the grate was opened, a floor every TIME.pace hours, leave traces (their
// mark, boot prints, cold camps, a dropped rope, a tripwire with bells), empty chests and tear the Order's notes about the way down;
// they stop at the tenth gate (the armour lets nobody by without the words) and give up after TIME.giveUpDays days there. The hero
// meets them on the floor they are on: a talk with choices, or a fight (Humans.js - beaten, he is robbed, never killed).
// Rywal.js is the engine. Registered right under Kantor.js (Rywal_Data, then Rywal).

/*:
 * @target MZ
 * @plugindesc [W9 rozdz. 3] Dane „Rywal w ruinach”: kto schodzi po Serce przed bohaterem (Grum, ludzie Lorda, ludzie Baltazara, kopacze Czarnych Oczu), ślady na piętrach 1-10, spotkanie. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @orderAfter Kantor
 *
 * @help
 * ============================================================================
 * Rywal_Data.js - dane rozdziału 3 wątku W9 „Serce Twierdzy”
 * ============================================================================
 * Same dane: czyta je Rywal.js (silnik, zaraz pod tym plikiem). Teksty:
 * js/teksty/rywal.txt (Watki.js czyta je przy starcie gry). Numery
 * zdarzeń 828-839 (rejestr TawernaCore: "Rywal"), grafika !W9_Rywal.png
 * i strażnik dworu $Human_Dwor* (tools/w9_rywal/art.py).
 * ============================================================================
 */

(() => {
    "use strict";
    // (2026-10-23) the words: js/teksty/rywal.txt (Watki.js reads it when the game starts - docs/WATKI_DANE.md)
    const W = window.Watki;
    if (!W) { console.warn("Rywal_Data.js: brak Watki.js - rozdział „Rywal w ruinach” wyłączony"); return; }
    const TX = W.teksty("rywal");

    const MAP = { tavern: 1, cellar: 9, ruins: 10, floor10: 140, heart: 11 };
    const IDS = [828, 839];
    // the injected events (the same ids on every map - each map uses its own part):
    //   mark - the party's sign (chalk eye / the Lord's pennant), printsA / printsB - boot prints, fire - their fire (cold: burnt out;
    //   lit at the meeting), bed - a bedroll, rope - a dropped rope (taken: a rope), trap - the tripwire with bells, lead - the leader,
    //   man0-2 - his men, extra - a second bedroll / the wounded man at the tenth gate / a witness at the Heart
    const EV = { mark: 828, printsA: 829, printsB: 830, fire: 831, bed: 832, rope: 833, trap: 834, lead: 835, man0: 836, man1: 837, man2: 838, extra: 839 };
    // [sheet, index, direction, pattern] - !W9_Rywal (tools/w9_rywal/art.py)
    const ART = {
        eye: ["!W9_Rywal", 0, 2, 0], eyeArrow: ["!W9_Rywal", 0, 2, 1], eyeCrossed: ["!W9_Rywal", 0, 2, 2],
        pennant: ["!W9_Rywal", 0, 4, 0],
        printsV: ["!W9_Rywal", 0, 6, 0], printsH: ["!W9_Rywal", 0, 6, 1], printsX: ["!W9_Rywal", 0, 6, 2],
        rope: ["!W9_Rywal", 0, 8, 0], ropeEnd: ["!W9_Rywal", 0, 8, 1],
        bedRolled: ["!W9_Rywal", 1, 2, 0], bedSpread: ["!W9_Rywal", 1, 2, 1], bedHeap: ["!W9_Rywal", 1, 2, 2],
        wireH: ["!W9_Rywal", 1, 4, 0], wireV: ["!W9_Rywal", 1, 4, 1], wireCut: ["!W9_Rywal", 1, 4, 2],
        sack: ["!W9_Rywal", 1, 6, 0], sackOpen: ["!W9_Rywal", 1, 6, 1], papers: ["!W9_Rywal", 1, 6, 2],
        ash: ["!W9_Rywal", 1, 8, 0],
        fire: ["!Decoration", 2, 4, 0]
    };
    // every light is a flame: their camp fire at the meeting
    const FIRE_LIGHT = "<Light:180,255,150,70><LightFlicker:0.18,255,110,40><LightHeight:20>";

    // ------------------------------------------------------------------ the clock (game hours; an hour is a minute)
    // enter: the hour of the night after the grate was opened when they go in (the day the grate was first seen open + 1);
    // pace: hours a floor; giveUpDays: days at the tenth gate before they give up and go back up; meet: tiles from the leader
    // the talk starts at (the hero coming near their camp)
    const TIME = { enter: 1, pace: 6, giveUpDays: 3, meet: 6.5, cap: 10 };

    // ------------------------------------------------------------------ the traces of the floors they passed
    // camp: floors where they slept (a burnt-out fire and a bedroll in a middle room), rope: a dropped rope, trap: a tripwire with
    // bells across the way (stepped on: a fall, the bells - sneaking (C): seen and cut, a rope), rob: the part of the containers not
    // yet searched they empty (robKinds), torn: the Order's notes they tear out when the hero has not read them yet (the ones about
    // the way down: the castellan's keys, the steps, the tenth gate, the words)
    const TRAIL = {
        camp: [3, 6, 9], rope: [2, 5], trap: [4, 8], rob: 0.5,
        robKinds: ["skrzynia", "skrzynka", "beczka", "worek", "dzban", "sakwa", "relikwiarz", "monety"],
        torn: { 6: ["6"], 7: ["7"], 8: ["8"], 10: ["10d"] },
        trapDamage: 9, trapPerFloor: 1, ropeItem: 93
    };

    // ------------------------------------------------------------------ the hand-made places
    // Ruiny Zamku (Map010): boot prints from the narrow stairs to the great stairs down, the mark before them
    const RUINS = { prints: [[6, 8, "H"], [10, 8, "H"]], mark: [16, 8] };
    // floor 10 (Map140, Strażnica): their camp in the guard hall before the gate - the armour does not let them by. chest: the guard's
    // chest (its event, self switch A = opened); spider: the creature marker in the hall (their camp cleared it)
    const FLOOR10 = {
        fire: [22, 17], bed: [24, 16], bed2: [25, 18], lead: [15, 17, 4], men: [[21, 17, 6], [23, 18, 4], [22, 19, 8]], wounded: [19, 19, 2],
        mark: [14, 19], prints: [[12, 17, "H"], [14, 16, "H"]], chest: 30, spider: [21, 18], up: [5, 13]
    };
    // floor 100 (Map011): the ones who went down past the gate (the words sold / the hero as their guide) wait in the antechamber -
    // the three locks did not let them in either
    const HEART = { lead: [23, 17, 4], man: [24, 18, 4], ash: [25, 20] };

    // ------------------------------------------------------------------ the parties
    // lead / men: name, img [sheet, index], kind (Humans.js), look (its sheets), lv (levels over the place's), fights (the leader:
    // false - he goes off when it comes to blows); faction: the Black Eyes' men (Act III's attackers - Act3_Data reads w9Frakcja*);
    // mark: "eye" (the White Eye in chalk) or "pennant" (the Zaleskis' black horse)
    const PARTIES = {
        baltazar: {
            flag: "w9RywalBaltazar", faction: true, mark: "eye",
            lead: { img: ["$Npc_Kupiec", 0], fights: false },
            men: [{ kind: "bandit", img: ["$Human_Bandit", 0], lv: 0 },
                { kind: "knifer", img: ["$Human_Knife", 0], lv: 0 },
                { kind: "archer", img: ["$Human_Archer", 0], lv: 0 }],
            enemyMan: { kind: "mercenary", img: ["$Human_Merc", 0], lv: 0 },   // (instead of the archer: Baltazar an enemy, with mercenaries)
            wounded: ["$Human_Bandit_Lie", 0]
        },
        grum: {
            flag: "w9RywalGrum", faction: true, mark: "eye",
            lead: { img: ["$Npc_Grum", 0], fights: true, kind: "mercenary", lv: 2, gold: 30 },
            men: [{ kind: "mercenary", img: ["$Human_Merc", 0], lv: -1 }, { kind: "bandit", img: ["$Human_Bandit", 0], lv: 0 }],
            wounded: ["$Human_Merc_Lie", 0]
        },
        lord: {
            flag: "w9RywalDwor", faction: false, mark: "pennant",
            lead: { img: ["$Human_Dwor", 0], fights: true, kind: "mercenary", look: "Dwor", lv: 0 },
            men: [{ kind: "mercenary", look: "Dwor", img: ["$Human_Dwor", 0], lv: -2 },
                { kind: "mercenary", look: "Dwor", img: ["$Human_Dwor", 0], lv: -2 }],
            wounded: ["$Human_Dwor_Lie", 0]
        },
        kopacze: {
            flag: "w9RywalKopacze", faction: true, mark: "eye",
            lead: { img: ["$Human_Captain", 0], fights: true, kind: "mercenary", look: "Captain", lv: 2 },
            men: [{ kind: "bandit", img: ["$Human_Bandit", 0], lv: 0 }, { kind: "knifer", img: ["$Human_Knife", 0], lv: 0 }],
            wounded: ["$Human_Knife_Lie", 0]
        }
    };
    // the parties' words (their names over the bubbles, "kto" in the journal, the wounded man's name): js/teksty/rywal.txt partie.*
    for (const [k, P] of Object.entries(PARTIES)) {
        const at = "partie." + k + ".";
        W.zTekstu(P, { name: at + "name", kto: at + "kto", wName: at + "wName" }, "rywal");
        W.zTekstu(P.lead, { name: at + "lead.name" }, "rywal");
        P.men.forEach((m, i) => W.zTekstu(m, { name: at + "men." + i + ".name" }, "rywal"));
        if (P.enemyMan) W.zTekstu(P.enemyMan, { name: at + "enemyMan.name" }, "rywal");
    }
    const ORDER = ["grum", "lord", "baltazar", "kopacze"];
    // the manor's guard of Humans.js (a mercenary recoloured into the Zaleskis' red - tools/w9_rywal/art.py): its looks
    const LOOKS = { Dwor: { anim: { raise: 5, hit: 7, guard: 3 }, shield: true, crouch: "Crouch8" }, Captain: { anim: { raise: 5, hit: 7, guard: 3 }, shield: true, crouch: "Kneel8" } };

    // why this party (the journal and the report) and every word of the chapter: js/teksty/rywal.txt (why.*, the rest)

    // the steps added to TownQuests' W9 (Rywal.js appends them - the step numbers of old saves stay as they were)
    // (their text read from the words each time: a getter - Rywal.js copies them with it)
    const STEPS = [
        { ch: 3, type: "custom", vars: "w9Rywal", w9r: "rival", get text() { return TX.step; } },
        { ch: 3, type: "pause", vars: "w9Rywal", w9r: "after", get text() { return TX.stepAfter; } }
    ];

    window.RywalData = { MAP, IDS, EV, ART, FIRE_LIGHT, TIME, TRAIL, RUINS, FLOOR10, HEART, PARTIES, ORDER, LOOKS, get WHY() { return TX.why; }, TX, STEPS, OWNER: "Rywal" };
})();
