//=============================================================================
// Humans_Data.js
//=============================================================================
// The data of the human enemies (combat stage 3, docs/WALKA.md): the kinds (bandit, knife bandit, archer, mercenary) with their life, balance,
// attributes by level, blows and timings, what they carry; the night camps (which maps, how often), the raids on a sleeper; what they shout. Data only -
// Humans.js reads it (window.HumansData).

/*:
 * @target MZ
 * @plugindesc Dane ludzi-wrogów (etap 3 walki): bandyta, nożownik, łucznik, najemnik - życie, atrybuty, ciosy, łup; nocne obozy, napady na śpiącego; okrzyki. Musi być nad Humans.js. v1.1.0
 * @author Tawerna
 * @base TawernaCore
 * @orderAfter TawernaCore
 *
 * @help
 * ============================================================================
 * Humans_Data.js - dane ludzi-wrogów
 * ============================================================================
 * Same dane: czyta je Humans.js. Liczby ciosów są w klatkach (60 na sekundę),
 * odległości w polach mapy. Atrybuty (Siła, Zręczność, Kondycja, Czujność,
 * Hart ducha) rosną z poziomem - poziom zależy od miejsca (Combat.placeLevel,
 * notatka mapy <Poziom:N>), nie od poziomu bohatera.
 * ============================================================================
 */

(() => {
    "use strict";

    // the item ids the loot uses (data/Items.json)
    const ITEM = { bread: 83, beer: 81, rope: 93, arrows: 127, bow: 126, club: 156, bandage: 152, smoked: 105, knifeStone: 90, knifeIron: 91, iron: 86, cheese: 124 };

    // ---------------------------------------------------------------------------------------------------------------------------
    // The kinds. Common fields:
    //   name, look (the sheets: $Human_<look> walking, _Atk the blows, _Kneel on his knees, _Crouch by the fire, _Lie lying; anim8/<look>_*8),
    //   hp, poise (balance), stun (frames it reels), radius (its body, tiles), lv (levels over the place's), xp (beaten, level 1),
    //   attr: base at level 1 and grow per level (str, dex, con, per, wil - as the hero's, docs/WALKA.md 5 and 8),
    //   speed: walking (MZ move speed: 4 = the hero's), chase: after the hero (the run sheet from runAt), sight: tiles it sees him at,
    //   turn: radians a frame it turns its guard round (a slow one can be got behind), gold: [min, max] coins on him,
    //   loot: [[item, chance, n]], weapon: [item, chance] - the weapon that can be taken off him (bandit: the club),
    //   surrender: { at: the part of life under which he may beg, chance (Hart ducha takes it down), flee: the chance he runs instead },
    //   mercy: his blows never kill the hero - beaten down to 1 life the hero is robbed instead (Humans.js robbed)
    // and the blows of the kind (see each).
    // ---------------------------------------------------------------------------------------------------------------------------
    const KINDS = {
        // the bandit with a club: quick, not strong; two blows in a row (the second one sooner), sometimes he only feints the first one and
        // strikes right after it; now and then he raises his club against the hero's blow (a guard: light blows lose most of their force,
        // a heavy one breaks it)
        bandit: {
            name: "Bandyta", look: "Bandit", hp: 60, poise: 34, stun: 55, radius: 0.5, lv: 0, xp: 30,
            attr: { base: { str: 6, dex: 8, con: 5, per: 6, wil: 4 }, grow: { str: 0.8, dex: 1, con: 0.6, per: 0.6, wil: 0.3 } },
            speed: 3.6, chase: 4.2, runAt: 4.1, sight: 7.5, turn: 0.12,
            blow: { dmg: 12, poise: 34, reach: 1.75, cone: 0.3, at: 1.5, windup: 26, combo: 0.55, windup2: 12, hitAt: 3, strike: 12, recover: 46, wound: 0.25, knock: 0.45 },
            feint: 0.22, guard: { chance: 0.3, frames: 34, keep: 0.25, cd: 150 },
            gold: [2, 11], loot: [[ITEM.bread, 0.35, 1], [ITEM.rope, 0.3, 1], [ITEM.beer, 0.15, 1], [ITEM.knifeStone, 0.08, 1], [ITEM.bandage, 0.12, 1]],
            weapon: [ITEM.club, 0.35],
            surrender: { at: 0.25, chance: 0.6, flee: 0.25 }, mercy: true
        },
        // the bandit with a knife: lighter and quicker than the one with the club - short wind-ups, up to three stabs in a row (chain), each
        // weak but cutting (wounds); no guard to raise - he springs back from the hero's blow instead (dodge); quick to run when it goes badly
        knifer: {
            name: "Nożownik", look: "Knife", hp: 46, poise: 26, stun: 50, radius: 0.45, lv: 0, xp: 30,
            attr: { base: { str: 5, dex: 11, con: 4, per: 7, wil: 4 }, grow: { str: 0.6, dex: 1.2, con: 0.5, per: 0.6, wil: 0.3 } },
            speed: 3.8, chase: 4.4, runAt: 4.1, sight: 7.5, turn: 0.17,
            blow: { dmg: 7, poise: 16, reach: 1.45, cone: 0.3, at: 1.3, windup: 17, combo: 0.75, chain: 3, windup2: 8, hitAt: 2, strike: 9, recover: 38, wound: 0.4, knock: 0.15 },
            feint: 0.12, dodge: { chance: 0.35, cd: 110 },
            gold: [3, 12], loot: [[ITEM.bread, 0.3, 1], [ITEM.rope, 0.2, 1], [ITEM.beer, 0.2, 1], [ITEM.bandage, 0.15, 1], [ITEM.knifeIron, 0.08, 1]],
            weapon: [ITEM.knifeStone, 0.4],
            surrender: { at: 0.28, chance: 0.5, flee: 0.4 }, mercy: true
        },
        // the archer: keeps keepMin-keepMax tiles from the hero (backs off when he comes nearer), draws the bow - a line shows where he aims,
        // it locks lockAt frames before the arrow leaves (a step, a roll or the shield then) - and reloads; out of arrows, or pressed hard,
        // he shoves with the bow
        archer: {
            name: "Łucznik", look: "Archer", hp: 44, poise: 24, stun: 60, radius: 0.5, lv: 0, xp: 30,
            attr: { base: { str: 4, dex: 9, con: 4, per: 9, wil: 4 }, grow: { str: 0.4, dex: 1, con: 0.4, per: 1, wil: 0.3 } },
            speed: 3.6, chase: 4.1, runAt: 4.0, sight: 9.5, turn: 0.15,
            shot: { dmg: 14, poise: 22, range: 8.5, keepMin: 3.4, keepMax: 6.5, draw: 52, lockAt: 14, speed: 0.3, reload: 70, arrows: [8, 14], wound: 0.35, knock: 0.25 },
            blow: { dmg: 5, poise: 40, reach: 1.45, cone: 0.35, at: 1.35, windup: 18, combo: 0, hitAt: 3, strike: 12, recover: 40, wound: 0, knock: 1.0 },
            gold: [3, 13], loot: [[ITEM.arrows, 0.7, 3], [ITEM.bread, 0.25, 1], [ITEM.smoked, 0.15, 1], [ITEM.rope, 0.15, 1]],
            weapon: [ITEM.bow, 0.12],
            surrender: { at: 0.3, chance: 0.65, flee: 0.35 }, mercy: true
        },
        // the mercenary with a shield: the strongest. His shield stops a light blow (and an arrow) from the front - a heavy blow breaks his
        // guard, from behind or the side he has none; a few blows on the shield in a row and he hits back with it at once. He goes round
        // the hero to his back while the hero keeps his own guard up. Three blows: the sword cut, the shield bash (quick, throws the hero
        // back) and the overhead blow (a long wind-up, a big "!": it breaks the hero's guard - roll, or parry it in time)
        mercenary: {
            name: "Najemnik", look: "Merc", hp: 130, poise: 80, stun: 70, radius: 0.55, lv: 1, xp: 60,
            attr: { base: { str: 9, dex: 5, con: 9, per: 6, wil: 7 }, grow: { str: 1, dex: 0.5, con: 1, per: 0.5, wil: 0.5 } },
            speed: 3.4, chase: 3.8, runAt: 4.2, sight: 8, turn: 0.06,
            blow: { dmg: 19, poise: 48, reach: 1.85, cone: 0.3, at: 1.6, windup: 30, combo: 0, hitAt: 4, strike: 14, recover: 52, wound: 0.35, knock: 0.5 },
            bash: { dmg: 8, poise: 72, reach: 1.35, cone: 0.35, at: 1.25, windup: 15, hitAt: 3, strike: 12, recover: 36, wound: 0, knock: 1.0 },
            heavy: { dmg: 30, poise: 95, reach: 1.95, cone: 0.25, at: 1.7, windup: 46, hitAt: 4, strike: 16, recover: 70, wound: 0.5, knock: 0.8, chance: 0.3 },
            shield: { block: 0.1, front: 0.3, counter: 3, counterIn: 150, breakStun: 70, breakDmg: 0.7, back: 1.25 },
            flank: { after: 40, radius: 1.9, frames: 150 },
            gold: [10, 30], loot: [[ITEM.smoked, 0.4, 1], [ITEM.bandage, 0.35, 1], [ITEM.iron, 0.25, 1], [ITEM.cheese, 0.2, 1], [ITEM.knifeIron, 0.1, 1]],
            weapon: null,
            surrender: { at: 0.18, chance: 0.3, flee: 0.1 }, mercy: true
        }
    };

    // ---------------------------------------------------------------------------------------------------------------------------
    // The fight together: one blow at a time (the others go round the hero, `ring` tiles off), gap: the frames before the next one comes
    // ---------------------------------------------------------------------------------------------------------------------------
    const BAND = { ring: 2.7, gap: [30, 75], lose: 15, leash: 22, shout: 9, morale: 0.5 };

    // ---------------------------------------------------------------------------------------------------------------------------
    // Night camps: on the roads and in the forests, sometimes at night (from `from` to `to` o'clock) a campfire with `size` bandits - some
    // asleep, one or two awake by the fire - and a sack of loot. The chance is per night and map (a map note <Camp:0.3> or <Camp:off> wins),
    // none in the first calmDays days, none on a map whose camp was cleared within `rest` days. It stands `far` tiles from the hero at least.
    // archer / mercenary: the chance one of the band is an archer (a mercenary from day mercFrom). Not in the town, not on grandpa's field.
    // ---------------------------------------------------------------------------------------------------------------------------
    const CAMP = {
        maps: { 21: 0.3, 22: 0.25, 23: 0.35, 5: 0.25, 6: 0.2, 12: 0.3, 4: 0.12, 17: 0.12, 18: 0.15 },
        from: 21, to: 5, calmDays: 3, rest: 2, size: [2, 4], far: 14, archer: 0.45, mercenary: 0.3, mercFrom: 8, knife: 0.3, knifeFrom: 5, awake: [1, 2],
        sack: { gold: [6, 22], loot: [[ITEM.bread, 0.6, 2], [ITEM.rope, 0.4, 2], [ITEM.arrows, 0.35, 5], [ITEM.beer, 0.3, 2], [ITEM.smoked, 0.3, 1], [ITEM.iron, 0.15, 1], [ITEM.bandage, 0.25, 1]] }
    };
    // a daytime ambush on the road (off by default - a map note <Ambush:0.03> turns it on there: the chance an hour, 7-19)
    const AMBUSH = { maps: {}, hours: [7, 19], size: [2, 3], archer: 0.4, knife: 0.3, far: [7, 10], calmDays: 5 };
    // (CAMP.knife, AMBUSH.knife: the chance each bandit of the band carries a knife instead of the club - from day knifeFrom in the camps)

    // ---------------------------------------------------------------------------------------------------------------------------
    // Bandits for a sleeper (as the wolves' raid - Hunting.js RAID): on a map where the camps are (CAMP.maps, a note <Camp:x> over 0) or
    // with a note <Raid:x> (x: perHour there; <Raid:off> none), in the hours from-to, each hour he sleeps outdoors (never in the hut,
    // a tavern bed, the town, grandpa's field) a chance: perHour x the day's part (calm the first calmDays days, up to full on fullDay)
    // x fire (a lit fire by the bed is seen from afar) x camp (a camp on this map that night). Then 2-3 of them (an archer, a knife maybe)
    // come at him from `near` tiles - from dogNear when the tame dog barked first. A beaten sleeper is robbed, as always (ROBBED).
    // ---------------------------------------------------------------------------------------------------------------------------
    const RAID = { perHour: 0.02, from: 23, to: 4, calmDays: 5, fullDay: 15, calm: 0.2, fire: 1.4, camp: 2.5, size: [2, 3], archer: 0.35, knife: 0.4, near: 8, dogNear: 13 };

    // what they say (SpeechBubbles barks over their heads)
    const LINES = {
        alert: ["Hej! Kto tam?", "Coś szeleści...", "Stój!", "Kto idzie?"],
        engage: ["Brać go!", "Mamy gościa!", "Sakiewka albo życie!", "Nie uciekniesz!", "Dawaj, co masz!"],
        ambush: ["Sakiewka albo życie!", "Stój! Droga płatna!", "Dawaj grosz, chłopku!"],
        raid: ["Śpi jak kamień... Bierzemy wszystko!", "Cicho... Teraz!", "Pobudka, chłopku! Sakiewka!"],
        wake: ["Wstawać! Ktoś tu jest!", "Pobudka!", "Co jest?!"],
        hurt: ["Ach!", "Psiakrew!", "Ty draniu!"],
        block: ["Ha!", "Za wolno!"],
        broken: ["Uciekać!", "Nie warto za to ginąć!"],
        surrender: ["Litości! Poddaję się!", "Nie zabijaj! Mam dzieci!", "Dość! Poddaję się!"],
        spared: ["Dzięki ci... nie zapomnę.", "Niech cię Bóg prowadzi.", "Już mnie tu nie zobaczysz!"],
        robbed: ["Bierz i daj mi odejść!", "Masz, masz, tylko nie bij!"],
        fled: ["Jeszcze się spotkamy!", "Nogi za pas!"],
        beat: ["Leż i nie wstawaj.", "Zabieramy, co twoje.", "Następnym razem nie pyskuj."],
        camp: ["...kupiec miał pełny wóz, mówię ci...", "...ognia nie gaś, zimno...", "...jutro idziemy na Polną drogę...", "...kto ma wartę?..."]
    };
    // what a spared man may tell out of thanks (one at random, a top notice; the journal keeps it when Journal.addNote is there)
    const RUMOURS = [
        "W kantorze Baltazara nocą ktoś wynosi worki tylnymi drzwiami.",
        "Najemnicy z kontynentu pytają w tawernie o drogę w góry, do jaskiń.",
        "Za Kruczymi Skałami ludzie kopią coś pod ziemią. Płacą dobrze, ale nikt nie wraca.",
        "Ze starego zamku nocą słychać szepty. My tam nie chodzimy.",
        "Kapral przy bramie bierze grosz od każdego wozu, co wjeżdża po zmroku.",
        "Na Skraju lasu jest dziupla w starym dębie - przemytnicy zostawiają tam znaki."
    ];
    // the hero beaten down by them (their blows never kill - KINDS.mercy): the part of his gold they take, the food they may take, the hours
    // he lies, and the wound
    const ROBBED = { gold: 0.4, food: 0.5, hours: 1, hp: 0.15 };
    // a man who begged for his life and was killed all the same: the town hears of it (TownQuests' Opinia), at most once a day
    const OPINION = { killBeggar: -2, spare: 1 };

    window.HumansData = { ITEM, KINDS, BAND, CAMP, AMBUSH, RAID, LINES, RUMOURS, ROBBED, OPINION };
})();
