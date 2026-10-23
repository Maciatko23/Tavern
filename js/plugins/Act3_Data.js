//=============================================================================
// Act3_Data.js
//=============================================================================
// The data of Act III's siege of the tavern (Act3.js, docs/AKT3.md): when it comes, the warnings, the bell, the waves of the faction's
// men (Humans.js), the defenders by what the hero did (Grum, Borgar, Rafał, Marek, the townsfolk at Opinia 60+), the doors, the
// damage and the three outcomes, and every line said. Data only - Act3.js reads it (window.Act3Data).

/*:
 * @target MZ
 * @plugindesc Dane Aktu III (napad frakcji na tawernę): kiedy, ostrzeżenia, dzwon, fale, obrońcy, wyniki, teksty. Musi być nad Act3.js. v1.0.0
 * @author Tawerna
 * @base TawernaCore
 * @orderAfter TawernaCore
 *
 * @help
 * ============================================================================
 * Act3_Data.js - dane napadu na tawernę (Akt III)
 * ============================================================================
 * Same dane: czyta je Act3.js. Odległości w polach mapy, czasy w klatkach
 * (60 na sekundę) albo w godzinach gry (60 sekund to godzina).
 * ============================================================================
 */

(() => {
    "use strict";

    // ---------------------------------------------------------------------------------------------------------------------------
    // When: the hero has been down to floor `floor` (Underground.deepest()) with the cellar's grate open - the floor of the diggers'
    // cut (50), where the faction's own tunnel meets the Order's stairs: they learn that the way down starts under the tavern's floor.
    // Armed the first time he is on one of `maps` after that; the warnings run from then on, the strike comes the next night
    // (`delayDays`), from `from` o'clock to `to` - while he is in the tavern or the town. A night he is away the men wait; after
    // `waitNights` such nights they strike without him (the outcome reckoned from his allies).
    // ---------------------------------------------------------------------------------------------------------------------------
    const fill = (text, vars) => String(text).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined ? vars[k] : m));
    const TRIGGER = { floor: 50, needOpen: true, maps: [1, 8, 9], delayDays: 1, from: 21, to: 4, waitNights: 3, siegeMaps: [1, 8] };

    // the maps and their places: the town (Map008) - the tavern's door, the yard's gate the men come through, where the townsfolk
    // stand, the bell's rope; the tavern (Map001) - the old door to the cellar ("Stare drzwi", the loose brick behind it), the kitchen
    // the men come in through, the front door, Borgar's place
    const TOWN = 8, TAVERN = 1;
    const SPOTS = {
        8: {
            door: [51, 17], doorTile: [51, 16],
            gate: [[51, 31], [52, 31], [51, 30], [52, 30], [50, 30], [53, 29], [50, 29], [51, 32], [52, 32]],
            guard: [[48, 18], [54, 18], [46, 19], [56, 19], [49, 28], [53, 28], [44, 18], [58, 18]],
            from: [[51, 32], [52, 32], [51, 31], [52, 31]],
            bell: [85, 30], bellStand: [85, 31],
            fires: [[48, 15, 0.9], [54, 15, 1.0], [45, 16, 0.75], [57, 16, 0.8], [51, 14, 0.7]]
        },
        1: {
            door: [9, 14], doorTile: [9, 13],
            kitchen: [[45, 11], [47, 11], [43, 12], [49, 12], [45, 13], [41, 12]],
            front: [[50, 51], [49, 51], [51, 51], [50, 50], [48, 50], [52, 50]],
            guard: [[10, 16], [8, 16], [11, 17], [7, 17]],
            hall: [[50, 30], [47, 31], [53, 31]],
            borgar: [52, 31], entry: [50, 53]
        }
    };
    Watki.scal(SPOTS, "akt3", "miejsca");   // (its words: js/teksty/akt3.txt, miejsca)
    // the events Act3 puts into the maps (Tawerna.inject, its range 840-859): 859 - the bell's rope on the town map (the alarm); 854-858
    // kept for later (the whole 840-858 in the core's registry; tests/core_test.js moved its free test ids to the 700s, 2026-10-07)
    const IDS = { from: 840, to: 859, rope: 859 };

    // ---------------------------------------------------------------------------------------------------------------------------
    // The waves, in order. map: where they come; kinds: Humans.js kinds; from: the spots they come in at (SPOTS[map][from]); march:
    // where the ones not fighting go (the door of that map); extra(ctx): who else comes (Grum and Rafał on the faction's side, the
    // commander) - { kind, name, look, lv (levels over the siege's), noSurrender, boss }; shout: what the first one calls out; notice:
    // the top line when it comes
    // ---------------------------------------------------------------------------------------------------------------------------
    const WAVES = [
        // (2026-10-18, the white eagle - Orzel.js) the adult eagle (bond 60+, at home) defends the tavern from the air: one man fewer in each
        // group that comes from outside (Orzel.defends())
        { id: "w1", map: 8, from: "gate", kinds: ["bandit", "bandit", "knifer"],
          fewer: c => (window.Orzel && Orzel.defends && Orzel.defends() ? 1 : 0),
          fewerNotice: c => [TEXT.fale.orzel, fill(TEXT.fale.orzelSpada, { imie: window.Orzel ? Orzel.nameOf() : TEXT.fale.orzelImie })] },
        // (2026-10-17, W5 "Towary z kontynentu", Kantor.js) Baltazar Vey made an enemy (his kantor shut by the town, the register
        // burnt by Wit, or blackmailed - flag w5BaltazarWrog): his mercenary comes with the second group
        { id: "w2", map: 8, from: "gate", kinds: ["bandit", "archer", "knifer", "archer"],
          extra: c => (c.rafal === "enemy" ? [{ kind: "knifer", name: TEXT.fale.imiona.rafal, lv: 0, noSurrender: false }] : [])
              .concat(c.flags.w5BaltazarWrog ? [{ kind: "mercenary", name: TEXT.fale.imiona.najemnik, lv: 0 }] : []),
          fewer: c => (window.Orzel && Orzel.defends && Orzel.defends() ? 1 : 0),
          fewerNotice: c => [TEXT.fale.orzel, fill(TEXT.fale.orzelLucznik, { imie: window.Orzel ? Orzel.nameOf() : TEXT.fale.orzelImieMale })] },
        // (2026-10-16, W12 "Rozbitek", Wrak.js) Ansgar Wiel - the castaway made an ally (flag ansgarAlly) - knew the plan: the kitchen's
        // back door barred, one man fewer comes in that way (fewer(c): how many of `kinds` stay out; fewerNotice: the top line after)
        // (2026-10-17, W9 rozdz. 3 "Rywal w ruinach", Rywal.js) the Black Eyes' scouts met in the ruins under the tavern: beaten there
        // (w9FrakcjaPobita) - one man fewer comes this way, they lost their scouts and their notes; they took the Order's notes up or
        // went down past the tenth gate (w9FrakcjaWie) - they know the cellars: a scout of the ruins comes with this group
        { id: "w3", map: 1, from: "kitchen", kinds: ["knifer", "bandit", "bandit"],
          fewer: c => (c.flags.ansgarAlly ? 1 : 0) + (c.flags.w9FrakcjaPobita ? 1 : 0),
          fewerNotice: c => (c.flags.ansgarAlly ? [TEXT.fale.kuchnia, TEXT.fale.kuchniaSub + (c.flags.w9FrakcjaPobita ? TEXT.fale.kuchniaZwiadowcy : "")]
              : [TEXT.fale.mniej, TEXT.fale.mniejSub]),
          // (2026-10-17, W7 ch. 6 - Dwor.js) the hero kept silent to the Lord with Feliks still at the manor: Feliks told the faction of
          // every descent (w7FeliksDonosi) - they know the cellars as well
          extra: c => ((c.flags.w9FrakcjaWie || c.flags.w7FeliksDonosi) && !c.flags.w9FrakcjaPobita ? [{ kind: "knifer", name: TEXT.fale.imiona.zwiadowca, lv: 0 }] : []) },
        { id: "w4", map: 1, from: "front", kinds: ["mercenary", "bandit"],
          // (2026-10-16, W11 "Soczewka", Latarnia.js) the lighthouse's lens sold to Baltazar (soczewkaSprzedana): the Black Eyes know
          // more of the island - one more of their knifemen comes with the commander
          // (2026-10-17, W9 rozdz. 3) the commander killed in the ruins under the tavern (w9DowodcaPolegl): the Black Eyes sent a new one
          extra: c => [{ kind: "mercenary", name: c.flags.w9DowodcaPolegl ? TEXT.fale.imiona.nowyDowodca : TEXT.fale.imiona.dowodca, look: "Captain", lv: 2, boss: true }]
              .concat(c.grum === "enemy" ? [{ kind: "mercenary", name: TEXT.fale.imiona.grum, lv: 1, grum: true }] : [])
              .concat(c.flags.soczewkaSprzedana ? [{ kind: "knifer", name: TEXT.fale.imiona.nozownik, lv: 1 }] : []) }
    ];
    Watki.scal(WAVES, "akt3", "fale.lista");   // (its words: js/teksty/akt3.txt, fale.lista)
    // the commander's own look (PixelLab a8bb43b1, styled on the hero; tools/humans "captain"): a mercenary's sheets of his own -
    // img/characters/anim8/Captain_<Walk8|Atk8|Guard8|Kneel8|Lie8>.png and $Human_Captain[_Atk|_Guard|_Kneel|_Lie].png; anim: the
    // frames of his blow sheet (Humans.js LOOKS)
    const CAPTAIN = { look: "Captain", anim: { raise: 5, hit: 7, guard: 3 } };
    // the siege's level: the hero's level and the place's (Combat.placeLevel), kept between min and max; each kind's own levels over it
    const LEVEL = { heroDelta: -1, min: 3, max: 40, kinds: { bandit: 0, knifer: 0, archer: 0, mercenary: 1 } };
    // between two waves (frames); a wave on the map the hero is not on: after `offBreach` hours of the game it breaks the door
    // without him (the ones who got through the town's door come in with the next wave inside)
    const PACE = { gap: 360, firstGap: 240, offBreach: 1.0, offDamage: 6, reMarch: 120, workAt: 1.6 };

    // ---------------------------------------------------------------------------------------------------------------------------
    // The doors: life 100; each man at a door (not fighting) takes `per` of it every `every` frames. The town door broken: `breach`
    // damage, the ones there go in (they join the next wave inside). The old door broken: each man there goes down into the cellar
    // (`down` damage each) - the faction is under the tavern
    // ---------------------------------------------------------------------------------------------------------------------------
    // (2026-10-17, W4 "Krew kasztelana" - Kasztelan.js) Borgar keeps the cellar's grate (flag borgarPilnuje): the men through the old
    // door are held on the cellar's stairs - less damage each
    const qflags = () => { try { const q = window.TownQuests; return (q && q.state && q.state() && q.state().flags) || {}; } catch (e) { return {}; } };
    const DOORS = { 8: { hp: 100, every: 30, per: 1, breach: 20 }, 1: { hp: 100, every: 36, per: 1, get down() { return qflags().borgarPilnuje ? 20 : 35; } } };
    // the outcome: damage 0-100 (the doors, the fires, the men who got through); held: under `held` and at most `heldLost` defenders
    // down (or `heldPart` of those who fought, whichever is more); fallen: `fallen` and more; costly: the rest. The hero beaten (robbed, not killed - Humans.js): the defenders left finish it
    // (their strength against the men left - POWER) - costly when they hold, fallen when not
    const OUTCOME = { held: 35, heldLost: 1, heldPart: 0.25, fallen: 100, beatenCostly: 50 };
    const POWER = { bandit: 1, knifer: 0.8, archer: 0.8, mercenary: 2, boss: 3, grum: 2.5 };
    // what each outcome brings (Opinia in the town, experience, gold from Borgar)
    const REWARD = {
        held: { opinion: 8, xp: 600, gold: 120 },
        costly: { opinion: 3, xp: 400, gold: 40 },
        fallen: { opinion: -3, xp: 150, gold: 0 }
    };
    // the damage the tavern shows afterwards (soot on the walls, broken shutters, embers): for how many days
    const SCARS = { days: 6 };

    // ---------------------------------------------------------------------------------------------------------------------------
    // The defenders. key (the outcome's lists), name, sheet (the 8-way walk, img/characters), atk (an attack sheet of Humans.js's -
    // the mercenary's look; else the blow is the body thrown forward and a swing drawn), maps (where they fight), from (where they
    // come in: "here" - on the spot; "gate" - the yard's gate after `delay` frames), hp / dmg / poise at level 1 (they grow with the
    // siege's level like the men), cd: frames between blows, speed, armor (part of a blow held off), follow: keeps by the hero (else
    // guards its spot), hide: TownLife residents / map events this one stands in for (hidden while the siege runs), when(c): whether
    // he comes (c: the state of the town - see Act3.js ctx())
    // ---------------------------------------------------------------------------------------------------------------------------
    const DEFENDERS = [
        // (2026-10-17, W4 - Kasztelan.js) Borgar who went down with the hero to the tenth gate (borgarIdzie) knows what he defends - he
        // holds more; the one keeping the grate (borgarPilnuje) says so
        { key: "borgar", sheet: "Npc_Borgar_Walk8", maps: [1], from: "here", get hp() { return qflags().borgarIdzie ? 180 : 140; }, dmg: 12, poise: 30, cd: [70, 100], speed: 3.9, armor: 0.1,
          guard: "door", hideEvent: 1, swing: "#d9c6a0", when: () => true,
          get lines() { const f = qflags(), B = TEXT.borgarObrona; return Object.assign({}, f.borgarIdzie ? B.idzie : f.borgarPilnuje ? B.pilnuje : B.zwykle); } },
        { key: "grum", sheet: "anim8/Merc_Walk8", atk: "Merc", maps: [1, 8], from: "here", hp: 200, dmg: 20, poise: 70, cd: [60, 90], speed: 4.1, armor: 0.3,
          follow: true, hideEvent: 3, swing: "#e8e8e8", when: c => c.grum === "ally",
          lines: {} },
        { key: "rafal", sheet: "Npc_Rafal_Walk8", maps: [8], from: "gate", delay: 420, hp: 85, dmg: 10, poise: 24, cd: [80, 110], speed: 3.9,
          hide: ["rafal"], swing: "#b0a090", when: c => c.rafal === "ally",
          lines: {} },
        { key: "marek", sheet: "Npc_Marek_Walk8", maps: [8], from: "gate", delay: 480, hp: 95, dmg: 11, poise: 26, cd: [80, 110], speed: 3.8,
          hide: ["marek"], swing: "#b0a090", when: c => c.marek,
          lines: {} },
        { key: "tadek", sheet: "Npc_Kowal_Walk8", maps: [8], from: "gate", delay: 600, hp: 120, dmg: 14, poise: 32, cd: [85, 115], speed: 3.7,
          hide: ["kowal"], swing: "#c8c8d0", help: true, when: c => c.helpers || (c.bell && c.flags.tadekFriend),
          lines: {} },
        { key: "ignac", sheet: "Npc_Garbarz_Walk8", maps: [8], from: "gate", delay: 720, hp: 85, dmg: 9, poise: 22, cd: [85, 120], speed: 3.7,
          hide: ["garbarz"], swing: "#b0a090", help: true, when: c => c.helpers,
          lines: {} },
        { key: "kuba", sheet: "Npc_Woziwoda_Walk8", maps: [8], from: "gate", delay: 780, hp: 80, dmg: 8, poise: 20, cd: [85, 120], speed: 3.8,
          hide: ["woziwoda"], swing: "#b0a090", help: true, when: c => c.helpers,
          lines: {} },
        { key: "uchodzcy", sheet: "Npc_Uchodzca_Walk8", maps: [8], from: "gate", delay: 840, hp: 70, dmg: 7, poise: 18, cd: [90, 125], speed: 3.7,
          swing: "#a89070", help: true, n: 2, when: c => c.helpers && c.camp,
          lines: {} },
        // (2026-10-17, W5) Kapral Wit Czerwień - he confessed his five groszy a week to the hero and stands with him (flag w5WitAlly)
        { key: "wit", sheet: "Npc_Kapral_Walk8", maps: [8], from: "gate", delay: 500, hp: 120, dmg: 13, poise: 30, cd: [80, 110], speed: 3.8, armor: 0.15,
          hide: ["kapral"], swing: "#d8d8e0", when: c => !!c.flags.w5WitAlly,
          lines: {} },
        { key: "straz", sheet: "Npc_Straznik_Walk8", maps: [8], from: "gate", delay: 540, hp: 115, dmg: 13, poise: 30, cd: [80, 110], speed: 3.8, armor: 0.15,
          // (2026-10-17, W7 - Dwor.js) also when the hero tells the Lord everything he finds (w7LordFirst) - not after a lie found out
          swing: "#d8d8e0", n: 2, when: c => !!(c.flags.lordAlly || c.flags.w7LordFirst) && !c.flags.w7KlamstwoWyszlo,
          lines: {} }
    ];
    Watki.scal(DEFENDERS, "akt3", "obroncy");   // (its words: js/teksty/akt3.txt, obroncy)

    // ---------------------------------------------------------------------------------------------------------------------------
    // Ambroży trusts the hero (he rings the alarm himself): the bell's lessons (D16 - the key of the tower), the chronicles given to
    // him, the truth told, his trust flag - or W2 at its fourth chapter and on (the talk at the bell). f: TownQuests' flags, rec: its
    // record of a quest
    // ---------------------------------------------------------------------------------------------------------------------------
    const AMBROZY = {
        trusts: (f, rec) => !!(f.ambrozyTrust || f.bellKey || f.ambrozyChronicles || f.chroniclesForAmbrozy || f.w9Bell ||
            (rec && rec("W2") && (rec("W2").s === "done" || (rec("W2").step || 0) >= 3))),
        delay: 300   // frames after the strike begins: his first strike
    };
    // the townsfolk come at Opinia `opinion`+ once the alarm is rung (QUESTY.md W2 rozdz. 8)
    const HELP = { opinion: 60 };

    // ---------------------------------------------------------------------------------------------------------------------------
    // The words
    // ---------------------------------------------------------------------------------------------------------------------------
    const TEXT = Watki.teksty("akt3");

    window.Act3Data = { TRIGGER, TOWN, TAVERN, SPOTS, IDS, WAVES, CAPTAIN, LEVEL, PACE, DOORS, OUTCOME, POWER, REWARD, SCARS, DEFENDERS, AMBROZY, HELP, TEXT };
})();
