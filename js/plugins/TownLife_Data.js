//=============================================================================
// TownLife_Data.js
//=============================================================================
// The town's residents (Map008 "Kruczogród"; since 2026-10-05 also Podgrodzie, Map111 - "map" in their data): who they are, their sheets, their day hour by hour, what they call out and what
// they say when spoken to (user 2026-10-04: "the town has a daily schedule; residents in the hero's style"). TownLife.js reads it.
//
// SPOTS: key -> [x, y, direction] on Map008. An event named "Miejsce: <key>" on the map moves the spot to it (the editor wins).
// Two residents never "stand"/"work" on the same spot at the same hour (a stroll - "wander" - picks free cells round its spot).
// plan: [hour, act, spot] from that hour on (the last one runs on past midnight to the first); acts:
//   inside  - walks to the spot and goes in (hidden: a door, the tavern's gate)
//   stand   - stands on the spot facing its direction
//   work    - the same, busy (a little movement now and then)
//   wander  - strolls round the spot (3 tiles)
//   patrol  - walks from spot to spot of a list, round and round
//   bell    - stands at the bell; on the full hour inside this act the bell rings (Ambroży)
// barks: what they call out when the hero passes - by act, plus "rain" (rain or a storm) and "night"; indoors "tavern" (in the
// tavern, Map001 "Miejsce: gosc_N") and "home" (in their own interior, "Miejsce: <key>_wnetrze")
// talk: what they say when spoken to - "morning" (5-11), "day" (11-17), "evening" (17-22), "night", "rain"
// (v1.2.0) when: a condition ("market") - the resident is there only while it holds (hidden all the other days); a plan entry's 4th
// field: a condition for that entry (TownLife.addCondition registers more - TownQuests adds "w1Water": Kuba's night trips for water)
// (v1.3.0, 2026-10-07) alt: { map, when, plan, talk, barks } - the resident moves to another outdoor map while `when` (a registered
// condition) holds: W6 "campOutside" sends Ludmila, Ela, Rafal and Marek to Podgrodzie's tents; TownQuests also adds "w6Fire" (Rafal
// by the camp's fire in W6 rozdz. 3). Marek (W6 rozdz. 7) is the last resident.

/*:
 * @target MZ
 * @plugindesc Dane mieszkańców miasteczka i Podgrodzia: plany dnia, okrzyki, rozmowy (dla TownLife.js). v1.3.0
 * @author Claude
 * @help Same dane - działa z TownLife.js (ma stać nad nim na liście).
 */

(() => {
    "use strict";

    const SPOTS = {
        tawerna: [51, 17, 8], przed_tawerna: [58, 19, 2], brama_twierdzy: [51, 29, 2], ogrod_zakonu: [33, 17, 8], staw: [66, 10, 6],
        stragan1: [33, 59, 2], stragan2: [33, 45, 2], studnia_rynek: [50, 50, 2], rynek_srodek: [53, 52, 2], rynek_lawka: [50, 46, 2],
        piekarnia_drzwi: [38, 73, 8], kantor_drzwi: [18, 47, 8], kantor_przed: [16, 48, 2], kantor_rog: [20, 48, 4],
        ratusz_drzwi: [85, 48, 8], ratusz_przed: [83, 48, 2], dzwonnica: [85, 31, 8],
        schody_rzem: [51, 65, 2], ulica_rzem: [12, 64, 2], kowadlo: [8, 63, 8], kuznia_dom: [13, 61, 8], garbarnia: [15, 85, 8],
        garbarz_dom: [6, 89, 8], woziwoda_dom: [59, 74, 8], brama_wsch: [116, 49, 4], brama_pld: [31, 109, 2],
        dom_mieszczan: [36, 39, 8], pod_murem: [89, 98, 2], stodola: [79, 98, 2], rynek_rog: [71, 47, 2],
        ratusz_obok: [84, 48, 4], stragan1_obok: [31, 58, 6],
        // (2026-11-11 questy_mapa) the fronts of the six new buildings (Map008 markers "Miejsce: <key>": tools/questy_mapa/markery_miasta.py)
        wiatrak_przed: [97, 88, 2], cech_przed: [91, 88, 2], lazn_przed: [97, 74, 2], przytulek_przed: [97, 105, 2], garbarnia_przed: [114, 89, 2], sukiennice_przed: [51, 63, 2],
        // (2026-10-05, the quests' new people) Lucjan's dice by the right stall; the carter's cart on the street before the south gate
        stragan_kosci: [35, 45, 4], woz_pld: [35, 108, 2],
        // (2026-10-07, W6 "Ludzie z promu") Rafał's seat by the camp's fire under the wall (the fire: TownQuests' prop "w6_fire" 32,51)
        w6_ognisko: [91, 98, 4]
    };
    const PATROL = ["brama_wsch", "ulica_rzem", "schody_rzem", "rynek_srodek", "brama_twierdzy", "przed_tawerna", "brama_twierdzy", "rynek_srodek", "schody_rzem", "brama_pld"];
    // the manor guard's night round in the west garden (Map024, its "Miejsce: straz_1..4" events - docs/miasta_miejsca_zadan.md)
    const STRAZ = ["straz_1", "straz_2", "straz_3", "straz_4"];

    const RESIDENTS = [
        {
            key: "kowal", name: "", title: "", sheet: "$Npc_Kowal",
            plan: [[0, "inside", "kuznia_dom"], [5.5, "work", "kowadlo"], [12, "wander", "stragan1"], [13, "work", "kowadlo"], [17, "wander", "ulica_rzem"],
                   [19, "inside", "tawerna"], [22.5, "inside", "kuznia_dom"]],
            barks: {
                work: [],
                wander: [],
                rain: [],
                night: [],
                tavern: [],
                home: []
            },
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        },
        {
            key: "piekarka", name: "", title: "", sheet: "$Npc_Piekarka",
            plan: [[0, "inside", "piekarnia_drzwi"], [6, "stand", "stragan1"], [12, "wander", "rynek_lawka"], [14, "inside", "piekarnia_drzwi"]],
            barks: {
                stand: [],
                wander: [],
                rain: [],
                home: [],
                night: []
            },
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        },
        {
            key: "woziwoda", name: "", title: "", sheet: "$Npc_Woziwoda",
            plan: [[0, "inside", "woziwoda_dom"], [1.8, "work", "staw", "w1Water"], [3.2, "inside", "woziwoda_dom"], [7, "stand", "studnia_rynek"], [14, "wander", "rynek_srodek"],
                   [16, "inside", "tawerna"], [20.5, "inside", "woziwoda_dom"]],
            barks: {
                stand: [],
                wander: [],
                work: [],
                rain: [],
                tavern: [],
                home: [],
                night: []
            },
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        },
        {
            key: "kapral", name: "", title: "", sheet: "$Npc_Kapral", speed: 4,
            plan: [[0, "inside", "brama_wsch"], [6, "stand", "brama_wsch"], [18, "patrol", PATROL], [23, "inside", "brama_wsch"]],
            barks: {
                stand: [],
                patrol: [],
                rain: [],
                home: [],
                night: []
            },
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        },
        {
            key: "dzwonnik", name: "", title: "", sheet: "$Npc_Dzwonnik", speed: 2,
            plan: [[0, "inside", "dzwonnica"], [2.8, "bell", "dzwonnica"], [3.2, "inside", "dzwonnica"], [5.7, "bell", "dzwonnica"], [6.3, "wander", "rynek_lawka"],
                   [11.7, "bell", "dzwonnica"], [12.3, "stand", "ogrod_zakonu"], [17.7, "bell", "dzwonnica"], [18.3, "inside", "dzwonnica"]],
            barks: {
                bell: [],
                wander: [],
                stand: [],
                rain: [],
                home: [],
                night: []
            },
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        },
        {
            key: "kupiec", name: "", title: "", sheet: "$Npc_Kupiec",
            plan: [[0, "inside", "kantor_drzwi"], [8, "stand", "kantor_przed"], [12, "wander", "stragan2"], [14, "stand", "kantor_przed"], [18, "inside", "tawerna"],
                   [21.5, "stand", "kantor_rog"], [23, "inside", "kantor_drzwi"]],
            barks: {
                stand: [],
                wander: [],
                rain: [],
                tavern: [],
                home: [],
                night: []
            },
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        },
        {
            key: "soltys", name: "", title: "", sheet: "$Npc_Soltys",
            plan: [[0, "inside", "ratusz_drzwi"], [8, "stand", "ratusz_przed"], [12, "wander", "rynek_srodek"], [13, "inside", "ratusz_drzwi"], [16, "wander", "studnia_rynek"],
                   [18, "inside", "tawerna"], [21, "inside", "ratusz_drzwi"]],
            barks: {
                stand: [],
                wander: [],
                rain: [],
                tavern: [],
                home: [],
                night: []
            },
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        },
        {
            key: "garbarz", name: "", title: "", sheet: "$Npc_Garbarz",
            plan: [[0, "inside", "garbarz_dom"], [6.5, "work", "garbarnia"], [17, "wander", "ulica_rzem"], [19, "inside", "tawerna"], [22, "inside", "garbarz_dom"]],
            barks: {
                work: [],
                wander: [],
                rain: [],
                tavern: [],
                home: [],
                night: []
            },
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        },
        {
            key: "feliks", name: "", title: "", sheet: "$Npc_Feliks",
            plan: [[0, "inside", "brama_wsch"], [7, "wander", "stragan1"], [8.5, "stand", "stragan2"], [9.5, "stand", "ratusz_obok"], [10.5, "inside", "brama_wsch"]],
            barks: {
                wander: [],
                stand: [],
                rain: [], night: []
            },
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        },
        {
            key: "bronek", name: "", title: "", sheet: "$Npc_Bronek", speed: 4,
            plan: [[0, "inside", "dom_mieszczan"], [8, "wander", "rynek_srodek"], [12, "inside", "dom_mieszczan"], [13, "wander", "rynek_rog"], [18.5, "inside", "dom_mieszczan"]],
            barks: {
                wander: [],
                rain: [], night: []
            },
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        },
        {
            key: "zosia", name: "", title: "", sheet: "$Npc_Zosia", speed: 4,
            plan: [[0, "inside", "dom_mieszczan"], [8.2, "wander", "rynek_lawka"], [12, "inside", "dom_mieszczan"], [13.2, "wander", "rynek_srodek"], [18.5, "inside", "dom_mieszczan"]],
            barks: {
                wander: [],
                rain: [], night: []
            },
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        },
        {
            // (2026-10-28, docs/PODROZNI.md 5.2) Ludmiła and Ela come with the first wave (the ferry of day 10, in the town from noon);
            // "w6Obecni" - TownQuests: from then, or once the camp's quests / flags say they are here (older saves keep them)
            key: "ludmila", name: "", title: "", sheet: "$Npc_Ludmila", when: "w6Obecni",
            plan: [[0, "inside", "pod_murem"], [6.5, "wander", "pod_murem"], [9, "stand", "stragan1_obok"], [11, "wander", "rynek_rog"], [15, "stand", "ratusz_przed"],
                   [17, "wander", "pod_murem"], [20, "inside", "pod_murem"]],
            barks: {
                stand: [],
                wander: [],
                rain: [], night: []
            },
            // (2026-10-07, W6 rozdz. 5 a) the town shut its gate: the camp lives outside the wall, in Podgrodzie by the refugees' tents
            alt: { map: 111, when: "campOutside",
                plan: [[0, "inside", "namioty"], [6.5, "wander", "namioty"], [9, "wander", "plac"], [12, "wander", "kram"], [15, "wander", "namioty"], [20, "inside", "namioty"]],
                barks: { wander: [], rain: [], night: [] },
                talk: {
                    morning: [],
                    day: [],
                    evening: [], night: [], rain: []
                } },
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        },
        {
            key: "ela", name: "", title: "", sheet: "$Npc_Ela", speed: 3, when: "w6Obecni",
            plan: [[0, "inside", "pod_murem"], [6.6, "wander", "pod_murem"], [9.2, "wander", "stragan1"], [11.2, "wander", "rynek_rog"], [15.2, "wander", "ratusz_przed"],
                   [17.2, "wander", "pod_murem"], [20, "inside", "pod_murem"]],
            barks: { wander: [], rain: [], night: [] },
            talk: {
                morning: [],
                day: [],
                evening: [], night: [], rain: []
            },
            alt: { map: 111, when: "campOutside",
                plan: [[0, "inside", "namioty"], [6.6, "wander", "namioty"], [9.2, "wander", "zabawa"], [12.2, "wander", "plac"], [15.2, "wander", "namioty"], [20, "inside", "namioty"]],
                barks: { wander: [], rain: [], night: [] },
                talk: { morning: [], day: [],
                    evening: [], night: [], rain: [] } }
        },
        {
            key: "rafal", name: "", title: "", sheet: "$Npc_Rafal", speed: 4,
            // (2026-10-07, W6 rozdz. 3: "w6Fire" - while the camp trusts the hero enough, Rafał sits by the camp's fire 20:30-23:30)
            plan: [[0, "inside", "stodola"], [4.5, "wander", "stodola"], [6.5, "inside", "stodola"], [20.5, "stand", "w6_ognisko", "w6Fire"], [21, "wander", "ulica_rzem", "!w6Fire"],
                   [23.5, "inside", "stodola"]],
            barks: {
                wander: [],
                stand: [],
                rain: [], night: []
            },
            alt: { map: 111, when: "campOutside",
                plan: [[0, "inside", "namioty"], [4.5, "wander", "namioty"], [8, "wander", "drewutnia"], [13, "wander", "skraj_lasu"], [18, "wander", "namioty"], [23.5, "inside", "namioty"]],
                barks: { wander: [], night: [] },
                talk: { morning: [],
                    day: [], evening: [],
                    night: [], rain: [] } },
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        },
        // ---------------- Podgrodzie (Map111): the poor suburb outside the west wall (2026-10-05) - its spots are its own
        // "Miejsce: <key>" events (docs/podgrodzie/MIEJSCA.md)
        {
            key: "praczka", name: "", title: "", sheet: "$Npc_Praczka", map: 111, indoor: { tawerna: "gosc_praczka" },
            plan: [[0, "inside", "praczka_drzwi"], [5, "work", "pranie"], [11, "wander", "plac"], [12.5, "work", "pranie"], [16.5, "wander", "studnia_sucha"],
                   [17.5, "inside", "tawerna"], [20, "inside", "praczka_drzwi"]],
            barks: {
                work: [],
                wander: [],
                rain: [],
                night: [],
                home: []
            },
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        },
        {
            key: "franek", name: "", title: "", sheet: "$Npc_Franek", map: 111, speed: 4, indoor: { tawerna: "gosc_franek" },
            plan: [[0, "inside", "praczka_drzwi"], [7, "wander", "zabawa"], [10, "wander", "kram"], [12, "wander", "pranie"], [14, "wander", "brama_zach"],
                   [16, "wander", "zabawa"], [17.5, "inside", "tawerna"], [19.5, "inside", "praczka_drzwi"]],
            barks: {
                wander: [],
                rain: [],
                night: [],
                home: []
            },
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        },
        {
            key: "drwal", name: "", title: "", sheet: "$Npc_Drwal", map: 111, indoor: { tawerna: "gosc_drwal" },
            plan: [[0, "inside", "drwal_drzwi"], [5, "work", "drewutnia"], [10, "inside", "skraj_lasu"], [15, "work", "drewutnia"], [17.5, "inside", "tawerna"],
                   [21.5, "inside", "drwal_drzwi"]],
            // (2026-10-17) "inside skraj_lasu" at midday = gone to the forest for wood: away, not in his hut
            away: ["skraj_lasu"],
            barks: {
                work: [],
                wander: [],
                rain: [],
                night: [],
                home: []
            },
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        },
        {
            key: "klusownik", name: "", title: "", sheet: "$Npc_Klusownik", map: 111, speed: 4,
            plan: [[0, "inside", "skraj_lasu"], [4.5, "inside", "klusownik_drzwi"], [13, "wander", "plac"], [15, "wander", "kram"], [17, "wander", "namioty"],
                   [19.5, "inside", "tawerna"], [22.5, "inside", "skraj_lasu"]],
            // (2026-10-17) "inside skraj_lasu" = in the woods at night, not in his hut: he crouches by his snares on Skraj lasu (Map023,
            // spot klusownik_las in SPOTS_BY_MAP below), and says his forest lines there (barks / talk "skraj_lasu")
            indoor: { skraj_lasu: "klusownik_las", tawerna: "gosc_klusownik" },
            barks: {
                skraj_lasu: [],
                wander: [],
                rain: [],
                night: [],
                home: []
            },
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: [],
                // (in the woods, Skraj lasu - whatever the hour)
                skraj_lasu: []
            }
        },
        {
            key: "znachorka", name: "", title: "", sheet: "$Npc_Znachorka", map: 111, speed: 2, indoor: { tawerna: "gosc_znachorka" },
            plan: [[0, "inside", "znachorka_drzwi"], [6, "work", "ziola"], [10, "wander", "kapliczka"], [12, "work", "ziola"], [15.5, "stand", "kapliczka"],
                   [18, "inside", "tawerna"], [21, "inside", "znachorka_drzwi"]],
            barks: {
                work: [],
                wander: [],
                stand: [],
                rain: [],
                night: [],
                home: []
            },
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        },
        {
            key: "szmaciarz", name: "", title: "", sheet: "$Npc_Szmaciarz", map: 111, indoor: { tawerna: "gosc_szmaciarz" },
            plan: [[0, "inside", "szmaciarz_drzwi"], [7, "stand", "kram"], [12, "wander", "brama_zach"], [13, "stand", "kram"], [18, "wander", "plac"],
                   [19, "inside", "tawerna"], [22, "inside", "szmaciarz_drzwi"]],
            barks: {
                stand: [],
                wander: [],
                rain: [],
                night: [],
                home: []
            },
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        },
        {
            key: "uchodzca", name: "", title: "", sheet: "$Npc_Uchodzca", map: 111, indoor: { tawerna: "gosc_uchodzca" },
            plan: [[0, "inside", "uchodzcy_drzwi"], [6, "wander", "namioty"], [8, "wander", "brama_zach"], [12, "work", "drewutnia"], [15, "wander", "plac"],
                   [17.5, "inside", "tawerna"], [21.5, "inside", "uchodzcy_drzwi"]],
            barks: {
                wander: [],
                work: [],
                stand: [],
                rain: [],
                night: [],
                home: []
            },
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        },
        {
            key: "zebrak", name: "", title: "", sheet: "$Npc_Zebrak", map: 111, speed: 2,
            plan: [[0, "inside", "zebrak_noc"], [6.5, "stand", "zebrak"], [12, "wander", "plac"], [13.5, "stand", "zebrak"], [19, "wander", "namioty"],
                   [21.5, "inside", "zebrak_noc"]],
            barks: {
                stand: [],
                wander: [],
                rain: [],
                night: []
            },
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        },
        // ---------------- the quests' people (2026-10-05, TownQuests: K37, K39, K15, W1). Sheets in the hero's style.
        {
            key: "zlodziej", name: "", title: "", sheet: "$Npc_Zlodziej", speed: 4,
            plan: [[0, "inside", "pod_murem"], [6.5, "wander", "pod_murem"], [8.3, "wander", "rynek_rog"], [12, "wander", "stragan1_obok"], [14, "wander", "schody_rzem"],
                   [17.5, "wander", "pod_murem"], [20.5, "inside", "pod_murem"]],
            barks: {
                wander: [],
                rain: [], night: []
            },
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        },
        {
            key: "gracz", name: "", title: "", sheet: "$Npc_Gracz", when: "market",   // (only on the market days)
            plan: [[0, "inside", "brama_pld"], [9.7, "stand", "stragan_kosci"], [14, "inside", "brama_pld"]],
            barks: {
                stand: [],
                rain: [], night: []
            },
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        },
        {
            key: "bartek", name: "", title: "", sheet: "$Npc_Bartek",
            plan: [[0, "inside", "brama_pld"], [9.5, "wander", "rynek_rog"], [14, "inside", "tawerna"], [21, "inside", "brama_pld"]],
            barks: {
                wander: [],
                rain: [],
                tavern: [],
                night: []
            },
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        },
        {
            key: "woznica", name: "", title: "", sheet: "$Npc_Woznica",
            // (2026-10-24, Woz.js: by day he drives his round - at the cart before the south gate while the timetable has it in the town
            // ("wozMiasto"), out through the gate ("inside brama_pld") when the cart is on the road or at another stop, his dinner in the
            // tavern 12:30-13:30 while the cart is away (he stays among the tavern's guests - gosc_N seats as before); K15: 21:20-22:40 as before)
            plan: [[0, "stand", "woz_pld", "wozMiasto"], [0, "inside", "brama_pld", "!wozMiasto"], [12.5, "inside", "tawerna", "!wozMiasto"], [13.5, "inside", "brama_pld", "!wozMiasto"],
                   [21.3, "stand", "woz_pld"], [22.7, "inside", "brama_pld"]],
            barks: {
                work: [],
                stand: [],
                tavern: [],
                rain: [],
                night: []
            },
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        },
        {
            key: "straznik", name: "", title: "", sheet: "$Npc_Straznik", map: 24, speed: 3,
            plan: [[0, "patrol", STRAZ], [5, "stand", "straz_dzien"], [21, "patrol", STRAZ]],
            barks: {
                stand: [],
                patrol: [],
                rain: [],
                // (barks.night, talk.morning and talk.night stay here, not in js/teksty: Dwor_Data.js swaps them for getters while the
                // plugins load - its getter keeps the list it found then)
                night: ["Zimno... do świtu jeszcze daleko.", "Ciekawe, co ten Feliks robi po nocach w oranżerii..."]
            },
            talk: {
                morning: ["Straż dworu. Pilnuję, żeby nikt obcy nie deptał jaśnie panu kwiatów.", "Ogród zielony jak na wiosnę, co? Feliks dba. Nie pytaj, czym podlewa."],
                day: [],
                evening: [],
                night: ["Nocą do ogrodu nie wolno. Rozkaz Feliksa. Znaczy - jaśnie pana."],
                rain: []
            }
        },
        {
            // (last in the list: a resident's event id is FIRST + its place here - appended, the others keep their ids)
            // the new butler (user 2026-10-05): once W1 has sent Feliks away (TownLife "gone"), Teodor does the manor's errands in his stead
            key: "kamerdyner", name: "", title: "", sheet: "$Npc_Kamerdyner",
            when: () => !!(window.TownLife && typeof TownLife.gone === "function" && TownLife.gone("feliks")),
            plan: [[0, "inside", "brama_wsch"], [7, "wander", "stragan1"], [8.5, "stand", "stragan2"], [9.5, "stand", "ratusz_obok"], [10.5, "inside", "brama_wsch"]],
            barks: {
                wander: [],
                stand: [],
                rain: [], night: []
            },
            talk: {
                morning: [],
                // (talk.day stays here, not in js/teksty: Dwor_Data.js swaps it for a getter while the plugins load)
                day: ["Śluza pod oranżerią jest teraz pod moim kluczem. Ani kropli więcej dla dworu, niż trzeba - tak kazał jaśnie pan."],
                evening: [],
                night: [],
                rain: []
            }
        },
        {
            // (2026-10-07, W6 rozdz. 7) Marek, Ludmiła's husband - brought out of the diggers' cave (TownQuests' flag marekSaved): he lives
            // with his wife and daughter - under the wall, or in Podgrodzie when the town shut its gate (alt). Few words yet: the rock
            // took his speech, the kerchief is giving it back. (appended: the others keep their ids)
            key: "marek", name: "", title: "", sheet: "$Npc_Marek", speed: 3,
            when: () => { const Q = window.TownQuests; return !!(Q && typeof Q.marekHome === "function" && Q.marekHome()); },
            plan: [[0, "inside", "pod_murem"], [6.8, "wander", "pod_murem"], [10, "stand", "w6_ognisko"], [13, "wander", "pod_murem"], [17, "stand", "w6_ognisko"],
                   [20, "inside", "pod_murem"]],
            barks: {
                wander: [],
                stand: [],
                rain: [], night: []
            },
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [], rain: []
            },
            alt: { map: 111, when: "campOutside",
                plan: [[0, "inside", "namioty"], [6.8, "wander", "namioty"], [10, "wander", "drewutnia"], [14, "wander", "namioty"], [20, "inside", "namioty"]] }
        },
        // ==================================================================== (2026-10-14) the harbour, Map125 (docs/przystan/KONCEPCJA.md)
        // Their first meetings, Janek's fish trade, Roch's runs, the ferry: Przystan.js (it speaks first). The conditions are Przystan's
        // (functions - the ferry today, the cutter away on a night run). away: "inside" there means away, not at home (TownLife).
        {
            // Janek, the fisherman who found the hero on the beach and carried him to Stach (the prologue). At sea at dawn, smoking
            // and mending later, the evening at Borgar's (the tavern's free guest place gosc_8)
            key: "janek", name: "", title: "", sheet: "$Npc_Janek", map: 125, speed: 3, away: ["na_morze"],
            plan: [[0, "inside", "janek_drzwi"], [4, "work", "lodz"], [5, "inside", "na_morze"], [8.5, "work", "pomost"], [9.5, "work", "wedzarnia"],
                   [12, "stand", "lawka"], [13, "work", "sieci"], [15, "stand", "stol_ryb"], [17, "wander", "nabrzeze"], [19, "inside", "tawerna"],
                   [22.5, "inside", "janek_drzwi"]],
            barks: {
                work: [],
                stand: [],
                wander: [],
                rain: [],
                night: [],
                tavern: [],
                home: []
            },
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        },
        {
            // Roch Szkwał, the smuggler of the prologue (the cutter, the last coins, the storm). Hides by the slipway under his first name,
            // mends nets and carries sacks on ferry days. Never goes to the town. Gone for good if the hero gives him to the customs (D20)
            key: "przemytnik", name: "", title: "", sheet: "$Npc_Przemytnik", map: 125, speed: 3, away: ["pochylnia"],
            when: () => { const P = window.Przystan; return !(P && typeof P.rochGone === "function" && P.rochGone()); },
            plan: [[0, "inside", "szopa_drzwi"], [0, "inside", "pochylnia", () => !!(window.Przystan && Przystan.kuterAway())],
                   [6, "stand", "wrak"], [9, "work", "pochylnia"], [9, "work", "molo", () => !!(window.Przystan && Przystan.ferryNow())],
                   [13, "stand", "nabrzeze_rog"], [13, "work", "molo", () => !!(window.Przystan && Przystan.ferryNow())], [15, "stand", "nabrzeze_rog"],
                   [16, "work", "beczka_ogien"], [21, "wander", "plaza"], [21, "inside", "pochylnia", () => !!(window.Przystan && Przystan.kuterAway())],
                   [23.5, "inside", "szopa_drzwi"], [23.5, "inside", "pochylnia", () => !!(window.Przystan && Przystan.kuterAway())]],
            barks: {
                stand: [],
                work: [],
                wander: [],
                rain: [],
                night: [],
                home: []
            },
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        },
        {
            // the Lord's customs officer: the ledger, the port fee, the order to report every raven stone. At his desk in the customs house
            // (Map128) by day, on the pier on ferry days
            key: "celnik", name: "", title: "", sheet: "$Npc_Celnik", map: 125, speed: 2, indoor: { tawerna: "gosc_celnik" },
            plan: [[0, "inside", "komora_drzwi"], [9, "stand", "molo_kontrola", () => !!(window.Przystan && Przystan.ferryNow())], [15, "inside", "komora_drzwi"],
                   [18, "stand", "komora_przed"], [19.5, "inside", "tawerna"], [21.5, "inside", "komora_drzwi"]],
            barks: {
                stand: [],
                wander: [],
                rain: [],
                night: [],
                home: []
            },
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        },
        {
            // the guard at the barrier (the manor guard's sheet: the Lord's colours) - by day at the barrier, at night round the quay
            key: "straznik_przystan", name: "", title: "", sheet: "$Npc_Straznik", map: 125, speed: 3,
            plan: [[0, "patrol", ["szlaban", "nabrzeze", "molo_wejscie", "nabrzeze"]], [6, "stand", "szlaban"],
                   [22, "patrol", ["szlaban", "nabrzeze", "molo_wejscie", "nabrzeze"]]],
            barks: {
                stand: [],
                patrol: [],
                rain: [],
                night: []
            },
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        }
    ];

    // ==================================================================== (2026-10-22) THE NEW TOWN: the eight residents of the new houses
    // of Map008 (docs/miasteczko/NOWE_MIASTO.md, "Nowi mieszkańcy"; fixed ids 2940-2947 of EXTRA_RANGE). Sheets in the hero's style
    // (tools/npc/build_npc.py, npcs.json), talk busts tools/busts/make_<key>.py (registered below). Their places are ONLY the new map's
    // "Miejsce: <key>" events (<house>_drzwi, plac_1..12, plac_studnia, plac_tablica, stragan_1..6, skwer, brama_pd, stajnia_woz,
    // straznica_warta, kaplica_lawka, ciesla_warsztat) - on purpose no coordinates in SPOTS; at home "Miejsce: <key>_wnetrze" in their
    // interiors (Map181-189). Until Map008 has the "Miejsce:" of a resident's door (the old map) the resident is away (when) - nobody
    // stands in the map's corner. The carter's key is "kolodziej" (Szczepan Kołodziej): "woznica" is Wojciech's (above).
    // Barks by the time of day: getters (morning 5-11, day 11-17, evening from 17; rain and night first, as for everyone - TownLife),
    // the raw lists in "zaczepki" (rano / dzien / wieczor / deszcz / noc / dom).
    const hourOf = () => (window.$gameSystem && typeof $gameSystem.dayNightHour === "function" ? $gameSystem.dayNightHour() : 12);
    function byTime(z) {
        const now = () => { const h = hourOf(); return h >= 5 && h < 11 ? z.rano : h >= 11 && h < 17 ? z.dzien : z.wieczor; };
        return { get stand() { return now(); }, get work() { return now(); }, get wander() { return now(); }, get patrol() { return now(); },
                 rain: z.deszcz, night: z.noc, home: z.dom || [] };
    }
    const onNewMap = door => () => !window.$gameMap || $gameMap.mapId() !== 8 || !(window.TownLife && TownLife.spot) || !!TownLife.spot(door);
    const newTown = (r, door, z) => Object.assign(r, { map: 8, when: onNewMap(door), zaczepki: z, barks: byTime(z) });
    const NEW_TOWN = [
        newTown({
            // Szczepan, the carter of the stable with the cart shed: early to the fields beyond the south gate and back twice a day
            // ("inside brama_pd" = out on the road, away), the horses' water his worry
            key: "kolodziej", id: 2940, name: "", title: "", sheet: "$Npc_Kolodziej", speed: 3, away: ["brama_pd"],
            plan: [[0, "inside", "stajnia_drzwi"], [5, "work", "stajnia_woz"], [7, "inside", "brama_pd"], [10.5, "work", "stajnia_woz"],
                   [12, "wander", "plac_studnia"], [13, "stand", "stragan_2"], [14, "inside", "brama_pd"], [17.5, "work", "stajnia_woz"],
                   [19, "wander", "plac_5"], [20.5, "inside", "stajnia_drzwi"]],
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        }, "stajnia_drzwi", {
            rano: [],
            dzien: [],
            wieczor: [],
            deszcz: [],
            noc: [],
            dom: []
        }),
        newTown({
            // Agata, the market woman with the basket: her stall on the square, a round with the basket, the notice board's gossip
            key: "przekupka", id: 2941, name: "", title: "", sheet: "$Npc_Przekupka", speed: 3,
            plan: [[0, "inside", "dom1_drzwi"], [5.5, "wander", "plac_studnia"], [6.5, "work", "stragan_1"], [10, "wander", "plac_3"],
                   [11, "work", "stragan_1"], [13, "wander", "plac_tablica"], [14, "work", "stragan_1"], [17, "wander", "plac_9"],
                   [18.5, "inside", "dom1_drzwi"]],
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        }, "dom1_drzwi", {
            rano: [],
            dzien: [],
            wieczor: [],
            deszcz: [],
            noc: [],
            dom: []
        }),
        newTown({
            // Dorota, the seamstress: sews at home in the morning and after noon (her interior), to the stalls for cloth and thread,
            // the guard's mended tabards to the guardhouse before the evening
            key: "szwaczka", id: 2942, name: "", title: "", sheet: "$Npc_Szwaczka", speed: 3,
            plan: [[0, "inside", "dom3_drzwi"], [9.5, "wander", "sukiennice_przed"], [11, "wander", "plac_2"], [12, "inside", "dom3_drzwi"],
                   [15.5, "wander", "plac_8"], [16.5, "wander", "straznica_warta"], [17.5, "inside", "dom3_drzwi"]],
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        }, "dom3_drzwi", {
            rano: [],
            dzien: [],
            wieczor: [],
            deszcz: [],
            noc: [],
            dom: []
        }),
        newTown({
            // Halina, the widow (her husband Michał, Leon's journeyman, fell off the chapel roof last autumn): the water queue at the
            // well morning and evening, the square and the green with her children
            key: "wdowa", id: 2943, name: "", title: "", sheet: "$Npc_Wdowa", speed: 3,
            plan: [[0, "inside", "dom4_drzwi"], [6, "stand", "plac_studnia"], [7.5, "inside", "dom4_drzwi"], [9, "wander", "plac_6"],
                   [12, "inside", "dom4_drzwi"], [13.5, "wander", "skwer"], [16, "stand", "plac_studnia"], [17, "wander", "plac_6"],
                   [18.5, "inside", "dom4_drzwi"]],
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        }, "dom4_drzwi", {
            rano: [],
            dzien: [],
            wieczor: [],
            deszcz: [],
            noc: [],
            dom: []
        }),
        newTown({
            // Kostek, Halina's son (8): carries water with his mother, plays soldier on the square, listens to Wacław, loves the horses
            key: "kostek", id: 2944, name: "", title: "", sheet: "$Npc_Kostek", speed: 4,
            plan: [[0, "inside", "dom4_drzwi"], [6.1, "wander", "plac_studnia"], [7.5, "inside", "dom4_drzwi"], [9, "wander", "plac_6"],
                   [10.5, "wander", "plac_1"], [12, "inside", "dom4_drzwi"], [13.5, "wander", "skwer"], [15, "wander", "stajnia_woz"],
                   [16.5, "wander", "plac_6"], [18.5, "inside", "dom4_drzwi"]],
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        }, "dom4_drzwi", {
            rano: [],
            dzien: [],
            wieczor: [],
            deszcz: [],
            noc: [],
            dom: []
        }),
        newTown({
            // Jagódka, Halina's daughter (6): never far from her mother - the well, the square, the green
            key: "jagodka", id: 2945, name: "", title: "", sheet: "$Npc_Jagodka", speed: 3,
            plan: [[0, "inside", "dom4_drzwi"], [6.2, "wander", "plac_studnia"], [7.5, "inside", "dom4_drzwi"], [9.1, "wander", "plac_6"],
                   [12, "inside", "dom4_drzwi"], [13.6, "wander", "skwer"], [16.1, "wander", "plac_studnia"], [17.1, "wander", "plac_6"],
                   [18.3, "inside", "dom4_drzwi"]],
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        }, "dom4_drzwi", {
            rano: [],
            dzien: [],
            wieczor: [],
            deszcz: [],
            noc: [],
            dom: []
        }),
        newTown({
            // Leon, the carpenter: his workshop yard, mending the stalls of the square, the chapel's roof (where Michał fell)
            key: "ciesla", id: 2946, name: "", title: "", sheet: "$Npc_Ciesla", speed: 3,
            plan: [[0, "inside", "dom6_drzwi"], [6, "work", "ciesla_warsztat"], [9.5, "wander", "plac_4"], [10.5, "work", "stragan_3"],
                   [12, "inside", "dom6_drzwi"], [13, "work", "ciesla_warsztat"], [16, "wander", "kaplica_lawka"], [17, "work", "ciesla_warsztat"],
                   [18.5, "wander", "plac_10"], [20, "inside", "dom6_drzwi"]],
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        }, "dom6_drzwi", {
            rano: [],
            dzien: [],
            wieczor: [],
            deszcz: [],
            noc: [],
            dom: []
        }),
        newTown({
            // Wacław, the old soldier on a crutch: his bench on the square (plac_1) with his stories, the guard at the east gate in the
            // evening (he grumbles at their posture)
            key: "weteran", id: 2947, name: "", title: "", sheet: "$Npc_Weteran", speed: 2,
            plan: [[0, "inside", "dom8_drzwi"], [8, "stand", "plac_1"], [11.5, "wander", "plac_studnia"], [12.5, "inside", "dom8_drzwi"],
                   [14, "stand", "plac_1"], [17, "wander", "straznica_warta"], [18, "stand", "plac_1"], [20.5, "inside", "dom8_drzwi"]],
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        }, "dom8_drzwi", {
            rano: [],
            dzien: [],
            wieczor: [],
            deszcz: [],
            noc: [],
            dom: []
        })
    ];
    RESIDENTS.push(...NEW_TOWN);
    // their talk busts (tools/busts/make_<key>.py; SpeechBubbles stands above this plugin and checks the files at the database's load)
    if (window.SpeechBubbles && SpeechBubbles.BUSTS) for (const r of NEW_TOWN) SpeechBubbles.BUSTS[r.sheet + ":0"] = r.sheet.slice(5) + "_Bust";

    // ==================================================================== (2026-10-22) NOWE PODGRODZIE: the four residents of the new
    // houses of Map111 (docs/podgrodzie/NOWE_PODGRODZIE.md, "Nowi mieszkańcy"; fixed ids 2950-2953 of the third range, EXTRA_RANGES
    // below - 2900-2949 is given out). Sheets in the hero's style (tools/npc/build_npc.py, npcs.json), talk busts
    // tools/busts/make_<key>.py (registered below). Their places are ONLY the new map's "Miejsce: <key>" events (szynk_drzwi,
    // przytulek_drzwi, garncarnia_drzwi, lepianka1_drzwi, placyk_1..6, szynk_lawy, przytulek_kociol, garncarnia_lawy, glinianka, wybieg
    // and the moved old ones brama_zach, namioty, ziola, zebrak, zabawa); at home "Miejsce: <key>_wnetrze" in their interiors
    // (Map201-204). Until Map111 has the "Miejsce:" of a resident's door (the old map) the resident is away (when), as THE NEW TOWN's.
    // Barks by the time of day (byTime above; the raw lists in "zaczepki"). No new quests: talk and barks only.
    const onNewPodgrodzie = door => () => !window.$gameMap || $gameMap.mapId() !== 111 || !(window.TownLife && TownLife.spot) || !!TownLife.spot(door);
    const newPodgrodzie = (r, door, z) => Object.assign(r, { map: 111, when: onNewPodgrodzie(door), zaczepki: z, barks: byTime(z) });
    const NEW_PODGRODZIE = [
        newPodgrodzie({
            // Mietek, the keeper of the poor man's szynk: kvass of stale bread crusts, thin beer, the benches before the door till late;
            // in the afternoon to the town for Hanka's unsold bread ("inside brama_zach" = gone to the town, away)
            key: "szynkarz", id: 2950, name: "", title: "", sheet: "$Npc_Szynkarz", speed: 3, away: ["brama_zach"],
            plan: [[0, "inside", "szynk_drzwi"], [7.5, "work", "szynk_lawy"], [10, "inside", "szynk_drzwi"], [11.5, "wander", "placyk_1"],
                   [12.5, "work", "szynk_lawy"], [14, "inside", "brama_zach"], [16, "work", "szynk_lawy"], [23, "inside", "szynk_drzwi"]],
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        }, "szynk_drzwi", {
            rano: [],
            dzien: [],
            wieczor: [],
            deszcz: [],
            noc: [],
            dom: []
        }),
        newPodgrodzie({
            // Stefa, the keeper of the poorhouse: the cauldron before the door morning, noon and evening, the poorhouse's water ration from
            // the town's well ("inside brama_zach" = away), the tents of the ferry people, herbs from babka Jadwiga, a bowl for old Gaweł
            key: "opiekunka", id: 2951, name: "", title: "", sheet: "$Npc_Opiekunka", speed: 3, away: ["brama_zach"],
            plan: [[0, "inside", "przytulek_drzwi"], [5.5, "work", "przytulek_kociol"], [7.5, "inside", "brama_zach"], [9, "work", "przytulek_kociol"],
                   [12, "wander", "namioty"], [13, "wander", "ziola"], [14, "inside", "przytulek_drzwi"], [16, "work", "przytulek_kociol"],
                   [18.5, "wander", "zebrak"], [19.5, "inside", "przytulek_drzwi"]],
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        }, "przytulek_drzwi", {
            rano: [],
            dzien: [],
            wieczor: [],
            deszcz: [],
            noc: [],
            dom: []
        }),
        newPodgrodzie({
            // Wit, the potter: clay dug in the pit beyond the palisade at dawn, the pots drying on the benches before the workshop, the
            // wheel indoors, selling on the little square in the afternoon, the kiln in the evening, a mug at Mietek's (the QuestBoard's
            // "Wit, garncarz" - QuestBoard_Data GIVERS.wit - is the same man)
            key: "garncarz", id: 2952, name: "", title: "", sheet: "$Npc_Garncarz", speed: 3,
            plan: [[0, "inside", "garncarnia_drzwi"], [5, "work", "glinianka"], [8, "work", "garncarnia_lawy"], [10, "inside", "garncarnia_drzwi"],
                   [13, "work", "placyk_3"], [16, "work", "garncarnia_lawy"], [19, "wander", "szynk_lawy"], [21, "inside", "garncarnia_drzwi"]],
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        }, "garncarnia_drzwi", {
            rano: [],
            dzien: [],
            wieczor: [],
            deszcz: [],
            noc: [],
            dom: []
        }),
        newPodgrodzie({
            // Tośka (7), the girl of the first mud hut: the hens and goats of the run in the morning, then with Franek (the play place,
            // the town gate, the play place again - his plan's hours), by her mother at the pottery, the noon soup at ciotka Stefa's
            key: "dziecko", id: 2953, name: "", title: "", sheet: "$Npc_Dziecko", speed: 4,
            plan: [[0, "inside", "lepianka1_drzwi"], [6.5, "wander", "wybieg"], [8, "wander", "zabawa"], [10, "wander", "garncarnia_lawy"],
                   [11, "wander", "przytulek_kociol"], [12, "wander", "placyk_5"], [14, "wander", "brama_zach"], [16, "wander", "zabawa"],
                   [18.5, "inside", "lepianka1_drzwi"]],
            talk: {
                morning: [],
                day: [],
                evening: [],
                night: [],
                rain: []
            }
        }, "lepianka1_drzwi", {
            rano: [],
            dzien: [],
            wieczor: [],
            deszcz: [],
            noc: [],
            dom: []
        })
    ];
    RESIDENTS.push(...NEW_PODGRODZIE);

    // ==================================================================== (2026-11-13) NOWY ŚWIAT: Podgrodzie = Map218 (docs/NOWY_SWIAT/
    // MIESZKANCY.md, „Podgrodzie”). The suburb's people move there from the old maps (111, 8): their plans on the new map's "Miejsce:"
    // events (the doors <dom>_drzwi, the yards <dom>_zagroda / _ogrodek, plac, kapliczka, studnia_sucha, gawel, wroble_szopa,
    // weglarz_mielerz, wiatrak_przed); "inside do_miasta" = gone through the east gate to Kruczogród (away - they walk out at the map's
    // edge in the gate, nobody vanishes in sight), "inside na_brzeg" = gone west to the shore (Słony Brzeg). No guest places in the old
    // tavern any more (indoor cleared). Their words stay as they were (js/teksty/mieszkancy.txt); 6 new people with words of their own.
    // Each lives there only while the new map has the "Miejsce:" of its door.
    const NEW_WORLD_PODGRODZIE = 218;
    const onPodgrodzie218 = door => () => !window.$gameMap || $gameMap.mapId() !== NEW_WORLD_PODGRODZIE || !(window.TownLife && TownLife.spot) || !!TownLife.spot(door);
    const MOVE_218 = {
        praczka: { door: "praczka_drzwi", away: ["na_brzeg"],
            plan: [[0, "inside", "praczka_drzwi"], [5, "inside", "na_brzeg"], [11, "wander", "plac"], [12.5, "inside", "na_brzeg"], [16.5, "wander", "studnia_sucha"],
                   [18, "work", "praczka_ogrodek"], [20, "inside", "praczka_drzwi"]] },
        franek: { door: "praczka_drzwi",
            plan: [[0, "inside", "praczka_drzwi"], [7, "wander", "wroble_szopa"], [10, "wander", "plac"], [12, "wander", "gawel"], [14, "wander", "brama_wsch"],
                   [16, "wander", "wroble_szopa"], [19.5, "inside", "praczka_drzwi"]] },
        drwal: { door: "drwal_drzwi", away: ["do_miasta"],
            plan: [[0, "inside", "drwal_drzwi"], [5, "work", "drwal_ogrodek"], [10, "inside", "do_miasta"], [15, "work", "drwal_ogrodek"], [18, "wander", "plac"],
                   [21.5, "inside", "drwal_drzwi"]] },
        klusownik: { door: "klusownik_drzwi", away: ["do_miasta"],
            plan: [[0, "inside", "do_miasta"], [4.5, "inside", "klusownik_drzwi"], [13, "wander", "gawel"], [15, "wander", "kramarz_drzwi"], [17, "wander", "gawel"],
                   [19.5, "wander", "studnia_sucha"], [22.5, "inside", "do_miasta"]] },
        znachorka: { door: "znachorka_drzwi",
            plan: [[0, "inside", "znachorka_drzwi"], [6, "work", "znachorka_ogrodek"], [10, "wander", "kapliczka"], [12, "work", "znachorka_ogrodek"],
                   [15.5, "stand", "kapliczka"], [18, "wander", "przytulek_drzwi"], [21, "inside", "znachorka_drzwi"]] },
        szmaciarz: { door: "kramarz_drzwi",
            plan: [[0, "inside", "kramarz_drzwi"], [7, "stand", "kramarz_drzwi"], [12, "wander", "brama_zach"], [13, "stand", "kramarz_drzwi"], [18, "wander", "plac"],
                   [22, "inside", "kramarz_drzwi"]] },
        zebrak: { door: "przytulek_drzwi",
            plan: [[0, "inside", "przytulek_drzwi"], [6.5, "stand", "gawel"], [12, "wander", "plac"], [13.5, "stand", "gawel"], [19, "wander", "kapliczka"],
                   [21.5, "inside", "przytulek_drzwi"]] },
        opiekunka: { door: "przytulek_drzwi", away: ["do_miasta"],
            plan: [[0, "inside", "przytulek_drzwi"], [5.5, "work", "przytulek_drzwi"], [7.5, "inside", "do_miasta"], [9, "work", "przytulek_drzwi"], [12, "wander", "plac"],
                   [13, "wander", "znachorka_drzwi"], [14, "inside", "przytulek_drzwi"], [16, "work", "przytulek_drzwi"], [18.5, "wander", "gawel"],
                   [19.5, "inside", "przytulek_drzwi"]] },
        garncarz: { door: "garncarz_drzwi",
            plan: [[0, "inside", "garncarz_drzwi"], [5, "wander", "studnia_nowa"], [8, "work", "garncarz_drzwi"], [10, "inside", "garncarz_drzwi"], [13, "work", "garncarz_drzwi"],
                   [16, "work", "garncarz_drzwi"], [19, "wander", "przytulek_drzwi"], [21, "inside", "garncarz_drzwi"]] },
        dziecko: { door: "rodzina_drzwi",
            plan: [[0, "inside", "rodzina_drzwi"], [6.5, "wander", "rodzina_zagroda"], [8, "wander", "wroble_szopa"], [10, "wander", "garncarz_drzwi"],
                   [11, "wander", "przytulek_drzwi"], [12, "wander", "plac"], [14, "wander", "brama_wsch"], [16, "wander", "wroble_szopa"], [18.5, "inside", "rodzina_drzwi"]] },
        woziwoda: { door: "kuba_drzwi", away: ["do_miasta"],
            plan: [[0, "inside", "kuba_drzwi"], [6, "work", "kuba_zagroda"], [7, "inside", "do_miasta"], [12, "wander", "plac"], [13, "inside", "do_miasta"],
                   [17, "wander", "studnia_sucha"], [18.5, "work", "kuba_ogrodek"], [20.5, "inside", "kuba_drzwi"]] },
        garbarz: { door: "garbarz_drzwi", away: ["do_miasta"],
            plan: [[0, "inside", "garbarz_drzwi"], [6, "work", "garbarz_drzwi"], [12, "wander", "plac"], [13, "work", "garbarz_drzwi"], [17, "wander", "studnia_sucha"],
                   [19, "inside", "do_miasta"], [22, "inside", "garbarz_drzwi"]] }
    };
    for (const r of RESIDENTS) {
        const m = MOVE_218[r.key];
        if (!m) continue;
        r.map = NEW_WORLD_PODGRODZIE; r.plan = m.plan; r.away = m.away || []; r.indoor = {}; r.when = onPodgrodzie218(m.door);
        delete r.alt;
    }
    // the new people of Podgrodzie (fixed ids 2960-2965 of their own range 2960-2969, TownLifeData.EXTRA_RANGES; the key "nowy_mlynarz" - "mlynarz" is Walenty of Mlyn_Data); sheets of the hero's style from the travellers' pool for now
    const podgrodzie218 = (r, door, z) => Object.assign(r, { map: NEW_WORLD_PODGRODZIE, when: onPodgrodzie218(door), zaczepki: z, barks: byTime(z) });
    const talk0 = () => ({ morning: [], day: [], evening: [], night: [], rain: [] });
    const z0 = () => ({ rano: [], dzien: [], wieczor: [], deszcz: [], noc: [], dom: [] });
    const NEW_218 = [
        // the new miller of the windmill on the hill: grinds by day, sells flour in the town in the afternoon (W19: he signals to ships at night)
        podgrodzie218({ key: "nowy_mlynarz", id: 8208, name: "", title: "", sheet: "$Npc_Pula_M", speed: 3, away: ["do_miasta"],
            plan: [[0, "inside", "mlynarz_drzwi"], [5.5, "work", "wiatrak_przed"], [12, "wander", "mlynarz_ogrodek"], [13, "work", "wiatrak_przed"],
                   [17, "inside", "do_miasta"], [19.5, "inside", "mlynarz_drzwi"]], talk: talk0() }, "mlynarz_drzwi", z0()),
        // Hela, the fisherman Jan's sister: at the shore at dawn and in the afternoon, sells the catch on the square
        podgrodzie218({ key: "rybaczka", id: 8209, name: "", title: "", sheet: "$Npc_Pula_K", speed: 3, away: ["na_brzeg"],
            plan: [[0, "inside", "rybaczka_drzwi"], [4.5, "inside", "na_brzeg"], [10, "stand", "plac"], [13, "wander", "rybaczka_drzwi"], [15, "inside", "na_brzeg"],
                   [19, "inside", "rybaczka_drzwi"]], talk: talk0() }, "rybaczka_drzwi", z0()),
        // the charcoal burner: the clamp by his hut, charcoal to the town in the evening
        podgrodzie218({ key: "weglarz", id: 2962, name: "", title: "", sheet: "$Npc_Pula_M3", speed: 3, away: ["do_miasta"],
            plan: [[0, "inside", "weglarz_drzwi"], [5, "work", "weglarz_mielerz"], [12, "wander", "studnia_nowa"], [13, "work", "weglarz_mielerz"], [19, "inside", "do_miasta"],
                   [22, "inside", "weglarz_drzwi"]], talk: talk0() }, "weglarz_drzwi", z0()),
        // the weaver: her sheep in the morning, the loom indoors, the garden in the afternoon
        podgrodzie218({ key: "tkaczka", id: 2963, name: "", title: "", sheet: "$Npc_Pula_K3", speed: 3,
            plan: [[0, "inside", "tkaczka_drzwi"], [7, "work", "tkaczka_zagroda"], [9, "inside", "tkaczka_drzwi"], [13, "wander", "kapliczka"], [15, "work", "tkaczka_ogrodek"],
                   [18, "wander", "kapliczka"], [20, "inside", "tkaczka_drzwi"]], talk: talk0() }, "tkaczka_drzwi", z0()),
        // the water seller: off before dawn (where to, nobody asks), sells water on the square at usurers' prices
        podgrodzie218({ key: "wodziarz", id: 2964, name: "", title: "", sheet: "$Npc_Pula_M2", speed: 3, away: ["do_miasta"],
            plan: [[0, "inside", "wodziarz_drzwi"], [4, "inside", "do_miasta"], [8, "stand", "studnia_sucha"], [12, "wander", "kapliczka"], [13, "stand", "studnia_sucha"],
                   [17, "work", "wodziarz_zagroda"], [19, "inside", "wodziarz_drzwi"]], talk: talk0() }, "wodziarz_drzwi", z0()),
        // the widow with the goat: the goat is all she has
        podgrodzie218({ key: "kozia_wdowa", id: 2965, name: "", title: "", sheet: "$Npc_Pula_K2", speed: 2,
            plan: [[0, "inside", "wdowa_drzwi"], [6, "work", "wdowa_zagroda"], [10, "wander", "wdowa_ogrodek"], [12, "wander", "kapliczka"], [14, "work", "wdowa_zagroda"],
                   [18, "work", "wdowa_ogrodek"], [20, "inside", "wdowa_drzwi"]], talk: talk0() }, "wdowa_drzwi", z0())
    ];
    RESIDENTS.push(...NEW_218);

    // ==================================================================== (2026-11-13) NOWY ŚWIAT: Słony Brzeg = Map219 (docs/NOWY_SWIAT/
    // MIESZKANCY.md, „Wybrzeże”): Janek, the fisherman who found the hero, moves from the old harbour (Map125) to his hut by the pier;
    // he fishes from the pier (no vanishing at sea in sight), mends the nets by the boat, goes to Kruczogród in the evening (east edge).
    // Hanna, his wife, boils salt in her salt works and knows every corner of the wreck. Spots: the map's "Miejsce:" events (jan_*,
    // hanna_*, wrak, do_podgrodzia = the east edge of the road).
    const NEW_WORLD_BRZEG = 219;
    const onBrzeg219 = door => () => !window.$gameMap || $gameMap.mapId() !== NEW_WORLD_BRZEG || !(window.TownLife && TownLife.spot) || !!TownLife.spot(door);
    for (const r of RESIDENTS) {
        if (r.key !== "janek") continue;
        r.map = NEW_WORLD_BRZEG; r.away = ["do_podgrodzia"]; r.indoor = {}; r.when = onBrzeg219("jan_drzwi"); delete r.alt;
        r.plan = [[0, "inside", "jan_drzwi"], [4, "work", "jan_lodz"], [5, "work", "jan_praca"], [9, "work", "jan_sieci"], [12, "stand", "jan_dom"],
                  [13, "work", "jan_sieci"], [15, "work", "jan_praca"], [17, "wander", "wrak"], [18.5, "inside", "do_podgrodzia"], [22.5, "inside", "jan_drzwi"]];
    }
    const NEW_219 = [
        Object.assign({ key: "hanna", id: 2966, name: "", title: "", sheet: "$Npc_Wanda", speed: 3, map: NEW_WORLD_BRZEG, when: onBrzeg219("jan_drzwi"),
            plan: [[0, "inside", "jan_drzwi"], [5.5, "work", "hanna_salina"], [9, "work", "hanna_kociol"], [12, "stand", "hanna_dom"], [13, "work", "hanna_kociol"],
                   [16, "wander", "wrak"], [18, "inside", "hanna_drzwi"], [20.5, "inside", "jan_drzwi"]],
            talk: { morning: [], day: [], evening: [], night: [], rain: [] } },
            { zaczepki: { rano: [], dzien: [], wieczor: [], deszcz: [], noc: [], dom: [] } })
    ];
    for (const r of NEW_219) r.barks = byTime(r.zaczepki);
    RESIDENTS.push(...NEW_219);
    // (2026-11-15, W19 on the new world) the smuggler Roch and the customs man Sambor leave the old harbour for Słony Brzeg (Map219):
    // Roch lives in the wreck's hold (its door: "wrak_ladownia") and hangs about the wreck and Janek's boat; Sambor walks down
    // from Kruczogród every morning (the east edge - away), watches the pier and the salt pans, and goes back before dusk
    {
        const BRZEG = {
            przemytnik: { away: [], plan: [[0, "inside", "wrak_ladownia"], [6, "stand", "wrak"], [9, "work", "jan_lodz"], [14, "wander", "wrak_rufa"], [18, "stand", "wrak_dziob"], [21, "inside", "wrak_ladownia"]] },
            celnik: { away: ["do_podgrodzia"], plan: [[0, "inside", "do_podgrodzia"], [9, "stand", "jan_praca"], [13, "wander", "hanna_salina"], [15.5, "stand", "jan_sieci"], [18, "inside", "do_podgrodzia"]] }
        };
        for (const r of RESIDENTS) { const b = BRZEG[r.key]; if (b) { r.map = NEW_WORLD_BRZEG; r.plan = b.plan; r.away = b.away; r.indoor = {}; delete r.alt; } }
    }

    // ==================================================================== (2026-11-14) NOWY ŚWIAT: Kruczogród = Map220 (docs/NOWY_SWIAT/
    // MIESZKANCY.md, "Miasteczko"; the user: "to teraz dodaj mieszkańców miasta"). The townsfolk of the old Map008 move to the new town:
    // their plans on the new map's "Miejsce:" events (the doors <dom>_drzwi, the works <kto>_praca, the square: rynek_srodek, rynek_rog,
    // rynek_lawka, plac_studnia, plac_tablica, stragan1 / stragan2, the gates brama_zach / brama_wsch). "inside tawerna_drzwi" = in the
    // tavern for the evening (through its door); "inside do_podgrodzia" / "inside do_dworu" = gone out by the west / east gate (the
    // map's edge in the gate - away; nobody vanishes in sight). Their words stay (js/teksty/mieszkancy.txt). Not moved yet: the camp
    // of W6 (Ludmiła, Ela, Rafał, Marek), the dice player of the market days, the carter of Woz.js - their plugins know the old map.
    const NEW_WORLD_MIASTO = 220;
    const onMiasto220 = door => () => !window.$gameMap || $gameMap.mapId() !== NEW_WORLD_MIASTO || !(window.TownLife && TownLife.spot) || !!TownLife.spot(door);
    const PATROL_220 = ["brama_wsch", "rynek_rog", "plac_tablica", "rynek_srodek", "plac_studnia", "brama_zach", "kaplica_lawka", "rynek_srodek", "rynek_lawka"];
    const MOVE_220 = {
        kowal: { door: "kuznia_drzwi",
            plan: [[0, "inside", "kuznia_drzwi"], [5.5, "work", "kowal_praca"], [12, "wander", "stragan1"], [13, "work", "kowal_praca"], [17, "wander", "rynek_srodek"],
                   [19, "inside", "tawerna_drzwi"], [22.5, "inside", "kuznia_drzwi"]] },
        piekarka: { door: "piekarnia_drzwi",
            plan: [[0, "inside", "piekarnia_drzwi"], [6, "stand", "stragan1"], [12, "wander", "rynek_lawka"], [14, "inside", "piekarnia_drzwi"]] },
        kapral: { door: "ratusz_drzwi",
            plan: [[0, "inside", "ratusz_drzwi"], [6, "stand", "brama_wsch"], [12, "wander", "rynek_rog"], [13, "stand", "brama_zach"], [18, "patrol", PATROL_220],
                   [23, "inside", "ratusz_drzwi"]] },
        dzwonnik: { door: "dzwonnica_drzwi",
            plan: [[0, "inside", "dzwonnica_drzwi"], [2.8, "bell", "dzwonnica_podstawa"], [3.2, "inside", "dzwonnica_drzwi"], [5.7, "bell", "dzwonnica_podstawa"],
                   [6.3, "wander", "rynek_lawka"], [11.7, "bell", "dzwonnica_podstawa"], [12.3, "stand", "kaplica_lawka"], [17.7, "bell", "dzwonnica_podstawa"],
                   [18.3, "inside", "dzwonnica_drzwi"]] },
        kupiec: { door: "spichlerz_drzwi",
            plan: [[0, "inside", "spichlerz_drzwi"], [8, "stand", "stragan2"], [12, "wander", "rynek_srodek"], [14, "stand", "stragan2"], [18, "inside", "tawerna_drzwi"],
                   [21.5, "wander", "rynek_rog"], [23, "inside", "spichlerz_drzwi"]] },
        soltys: { door: "ratusz_drzwi",
            plan: [[0, "inside", "ratusz_drzwi"], [8, "stand", "pisarz_praca"], [12, "wander", "rynek_srodek"], [13, "inside", "ratusz_drzwi"], [16, "wander", "studnia_rynek"],
                   [18, "inside", "tawerna_drzwi"], [21, "inside", "ratusz_drzwi"]] },
        bronek: { door: "dom7_drzwi",
            plan: [[0, "inside", "dom7_drzwi"], [8, "wander", "rynek_srodek"], [12, "inside", "dom7_drzwi"], [13, "wander", "rynek_rog"], [18.5, "inside", "dom7_drzwi"]] },
        zosia: { door: "dom7_drzwi",
            plan: [[0, "inside", "dom7_drzwi"], [8.2, "wander", "rynek_lawka"], [12, "inside", "dom7_drzwi"], [13.2, "wander", "rynek_srodek"], [18.5, "inside", "dom7_drzwi"]] },
        feliks: { door: "ratusz_drzwi", away: ["do_dworu"],
            plan: [[0, "inside", "do_dworu"], [7, "wander", "stragan1"], [8.5, "stand", "rynek_rog"], [9.5, "stand", "pisarz_gosc"], [10.5, "inside", "do_dworu"]] },
        kamerdyner: { door: "ratusz_drzwi", away: ["do_dworu"],
            plan: [[0, "inside", "do_dworu"], [7, "wander", "stragan1"], [8.5, "stand", "rynek_rog"], [9.5, "stand", "pisarz_gosc"], [10.5, "inside", "do_dworu"]] },
        zlodziej: { door: "tawerna_drzwi", away: ["do_podgrodzia"],
            plan: [[0, "inside", "do_podgrodzia"], [8.3, "wander", "rynek_rog"], [12, "wander", "stragan1"], [14, "wander", "plac_tablica"], [17.5, "wander", "brama_zach"],
                   [20.5, "inside", "do_podgrodzia"]] },
        bartek: { door: "tawerna_drzwi", away: ["do_podgrodzia"],
            plan: [[0, "inside", "do_podgrodzia"], [9.5, "wander", "rynek_rog"], [14, "inside", "tawerna_drzwi"], [21, "inside", "do_podgrodzia"]] },
        kolodziej: { door: "stajnia_drzwi", away: ["do_dworu"],
            plan: [[0, "inside", "stajnia_drzwi"], [5, "work", "stajnia_woz"], [7, "inside", "do_dworu"], [10.5, "work", "stajnia_woz"], [12, "wander", "plac_studnia"],
                   [13, "wander", "rynek_rog"], [14, "inside", "do_dworu"], [17.5, "work", "stajnia_woz"], [19, "wander", "stajnia_wybieg"], [20.5, "inside", "stajnia_drzwi"]] },
        przekupka: { door: "agata_praca", away: ["do_podgrodzia"],
            plan: [[0, "inside", "do_podgrodzia"], [5.5, "wander", "plac_studnia"], [6.5, "work", "agata_praca"], [10, "wander", "rynek_srodek"], [11, "work", "agata_praca"],
                   [13, "wander", "plac_tablica"], [14, "work", "agata_praca"], [17, "wander", "rynek_lawka"], [18.5, "inside", "do_podgrodzia"]] },
        szwaczka: { door: "dom3_drzwi",
            plan: [[0, "inside", "dom3_drzwi"], [8, "work", "dorota_praca"], [11, "wander", "rynek_srodek"], [12, "inside", "dom3_drzwi"], [14, "work", "dorota_praca"],
                   [16.5, "wander", "plac_tablica"], [17.5, "inside", "dom3_drzwi"]] },
        wdowa: { door: "dom4_drzwi",
            plan: [[0, "inside", "dom4_drzwi"], [6, "stand", "plac_studnia"], [7.5, "inside", "dom4_drzwi"], [9, "work", "wdowa_praca"], [12, "inside", "dom4_drzwi"],
                   [13.5, "wander", "kaplica_lawka"], [16, "stand", "plac_studnia"], [17, "wander", "rynek_srodek"], [18.5, "inside", "dom4_drzwi"]] },
        kostek: { door: "dom4_drzwi",
            plan: [[0, "inside", "dom4_drzwi"], [6.1, "wander", "plac_studnia"], [7.5, "inside", "dom4_drzwi"], [9, "wander", "wdowa_praca"], [10.5, "wander", "rynek_rog"],
                   [12, "inside", "dom4_drzwi"], [13.5, "wander", "kaplica_lawka"], [15, "wander", "stajnia_woz"], [16.5, "wander", "rynek_srodek"],
                   [18.5, "inside", "dom4_drzwi"]] },
        jagodka: { door: "dom4_drzwi",
            plan: [[0, "inside", "dom4_drzwi"], [6.2, "wander", "plac_studnia"], [7.5, "inside", "dom4_drzwi"], [9.1, "wander", "wdowa_praca"], [12, "inside", "dom4_drzwi"],
                   [13.6, "wander", "kaplica_lawka"], [16.1, "wander", "plac_studnia"], [17.1, "wander", "rynek_srodek"], [18.3, "inside", "dom4_drzwi"]] },
        ciesla: { door: "ciesla_drzwi",
            plan: [[0, "inside", "ciesla_drzwi"], [6, "work", "leon_praca"], [9.5, "wander", "rynek_srodek"], [10.5, "wander", "plac_tablica"], [12, "inside", "ciesla_drzwi"],
                   [13, "work", "leon_praca"], [16, "wander", "kaplica_lawka"], [17, "work", "leon_praca"], [18.5, "wander", "plac_tablica"], [20, "inside", "ciesla_drzwi"]] },
        weteran: { door: "dom8_drzwi",
            plan: [[0, "inside", "dom8_drzwi"], [8, "stand", "rynek_lawka"], [11.5, "wander", "plac_studnia"], [12.5, "inside", "dom8_drzwi"], [14, "stand", "rynek_lawka"],
                   [17, "wander", "brama_zach"], [18, "stand", "rynek_lawka"], [20.5, "inside", "dom8_drzwi"]] }
    };
    // (2026-11-15) the Lord's guard keeps his watch at Dwór nad Jazem (Map221): by day at the manor's gate, at night round the
    // west garden (the places: defaults of SPOTS_BY_MAP[221] - W1's night in the garden needs him there)
    { const g = RESIDENTS.find(r => r.key === "straznik"); if (g) { g.map = 221; delete g.alt; } }
    // (2026-11-15) the camp of W6 on Podgrodzie's meadow (Map218): Ludmiła, Ela, Rafał and Marek live there - their days between the
    // camp, the shrine, the square and the shelter (the camp's places: defaults of SPOTS_BY_MAP[218])
    {
        const CAMP = {
            ludmila: [[0, "inside", "pod_murem"], [6.5, "wander", "pod_murem"], [9, "stand", "plac"], [11, "wander", "kapliczka"], [15, "stand", "przytulek_drzwi"], [17, "wander", "pod_murem"], [20, "inside", "pod_murem"]],
            ela: [[0, "inside", "pod_murem"], [6.6, "wander", "pod_murem"], [9.2, "wander", "plac"], [11.2, "wander", "kapliczka"], [15.2, "wander", "przytulek_drzwi"], [17.2, "wander", "pod_murem"], [20, "inside", "pod_murem"]],
            rafal: [[0, "inside", "stodola"], [4.5, "wander", "stodola"], [6.5, "inside", "stodola"], [20.5, "stand", "w6_ognisko", "w6Fire"], [21, "wander", "kapliczka", "!w6Fire"], [23.5, "inside", "stodola"]],
            marek: [[0, "inside", "pod_murem"], [6.8, "wander", "pod_murem"], [10, "stand", "w6_ognisko"], [13, "wander", "pod_murem"], [17, "stand", "w6_ognisko"], [20, "inside", "pod_murem"]]
        };
        for (const r of RESIDENTS) if (CAMP[r.key]) { r.map = 218; r.plan = CAMP[r.key]; r.indoor = {}; delete r.alt; }
    }
    for (const r of RESIDENTS) {
        const m = MOVE_220[r.key];
        if (!m) continue;
        const here = onMiasto220(m.door), was = typeof r.when === "function" ? r.when : null;
        r.map = NEW_WORLD_MIASTO; r.plan = m.plan; r.away = m.away || []; r.indoor = {};
        r.when = was ? () => was() && here() : here;
        delete r.alt;
    }
    // ... and the people other data plugins add after this file (Majster_Data: the guild's Ostap, Ludwik, Jaś; Mlyn_Data: old
    // Walenty; Zakon_Data: the gravedigger): TownLife.js asks for TownLifeData.moveLate() when it starts, after every data plugin.
    // A "when" of their own (a named condition) stays as it is.
    const MOVE_220_LATE = {
        // the guild's three keep their own days (8-17 in the Cech's hall - Map215, shown there): only the map changes; their places
        // "cech_przed" and "<kto>_dom" are defaults of SPOTS_BY_MAP[220]
        ostap: { door: "cech1_drzwi", keep: true }, ludwik: { door: "cech1_drzwi", keep: true }, jas: { door: "cech1_drzwi", keep: true },
        grabarz: { door: "grabarz_drzwi",
            plan: [[0, "inside", "grabarz_drzwi"], [6, "work", "grabarz_praca"], [12, "wander", "cmentarz_lawka"], [13, "work", "cmentarz"], [17, "wander", "kaplica_lawka"],
                   [19, "inside", "grabarz_drzwi"]] }
    };
    // (2026-11-16) the rest of the plain townsfolk off the old maps: the dice player on the market of Kruczogród (in from Podgrodzie),
    // the refugee Darin in the shelter of Podgrodzie (his evening in the tavern: out through the east gate), the harbour's guard on Słony Brzeg.
    // Their own `when` and `indoor` stay. People of threads not moved yet (the carter, the castaway, the travellers, the raven keepers...) wait for those.
    const MOVE_REST = {
        gracz: { map: 220, away: ["do_podgrodzia"], plan: [[0, "inside", "do_podgrodzia"], [9.7, "stand", "stragan_kosci"], [14, "inside", "do_podgrodzia"]] },
        uchodzca: { map: 218, away: ["tawerna"] },
        straznik_przystan: { map: 219 },
        // Mietek's szynk in the north-east corner of Podgrodzie, by the town's wall (tools/nowy_swiat/szynk.py); in the afternoon to the town for Hanka's bread
        szynkarz: { map: 218, door218: "szynk_drzwi", away: ["do_miasta"],
            plan: [[0, "inside", "szynk_drzwi"], [7.5, "work", "szynk_lawy"], [10, "inside", "szynk_drzwi"], [11.5, "wander", "plac"],
                   [12.5, "work", "szynk_lawy"], [14, "inside", "do_miasta"], [16, "work", "szynk_lawy"], [23, "inside", "szynk_drzwi"]] }
    };
    const moveLate = () => {
        for (const r of RESIDENTS) { const m = MOVE_REST[r.key]; if (!m || r._movedRest) continue; r._movedRest = true; r.map = m.map; if (m.plan) r.plan = m.plan; if (m.away) r.away = (r.away || []).concat(m.away); if (m.door218) r.when = onPodgrodzie218(m.door218); delete r.alt; }
        for (const r of RESIDENTS.concat(Array.isArray(window.TownLifeExtra) ? window.TownLifeExtra : [])) {   // (TownLifeExtra: the data plugins' own people)
            const m = MOVE_220_LATE[r.key];
            if (!m || r._moved220) continue;
            r._moved220 = true;
            r.map = NEW_WORLD_MIASTO;
            if (m.keep) { delete r.alt; continue; }
            r.plan = m.plan; r.away = m.away || []; r.indoor = {};
            if (r.when === undefined || r.when === null) r.when = onMiasto220(m.door);
            delete r.alt;
        }
    };
    // the new people of Kruczogród (fixed ids 8200-8206 of the range 8200-8219, EXTRA_RANGES + TawernaCore's registry); sheets of the
    // hero's style from the travellers' pool for now
    const miasto220 = (r, door, z) => Object.assign(r, { map: NEW_WORLD_MIASTO, when: onMiasto220(door), zaczepki: z, barks: byTime(z) });
    const NEW_220 = [
        // the old couple of the house by the east gate: witnesses of the drought, the first to tell the truth about the debt
        miasto220({ key: "staruszek", id: 8200, name: "", title: "", sheet: "$Npc_Pula_S", speed: 2,
            plan: [[0, "inside", "dom7_drzwi"], [7.5, "stand", "staruszek_praca"], [11, "wander", "rynek_lawka"], [12.5, "inside", "dom7_drzwi"], [15, "stand", "staruszek_praca"],
                   [18.5, "inside", "dom7_drzwi"]], talk: talk0() }, "dom7_drzwi", z0()),
        miasto220({ key: "staruszka", id: 8201, name: "", title: "", sheet: "$Npc_Pula_K2", speed: 2,
            plan: [[0, "inside", "dom7_drzwi"], [6.5, "wander", "plac_studnia"], [8, "stand", "staruszka_praca"], [12.5, "inside", "dom7_drzwi"], [15.2, "stand", "staruszka_praca"],
                   [17.5, "wander", "kaplica_lawka"], [18.8, "inside", "dom7_drzwi"]], talk: talk0() }, "dom7_drzwi", z0()),
        // the town's scribe: the archive of the town hall (the trace of the town's water privilege)
        miasto220({ key: "pisarz", id: 8202, name: "", title: "", sheet: "$Npc_Pula_S2", speed: 2,
            plan: [[0, "inside", "ratusz_drzwi"], [7.5, "wander", "plac_tablica"], [8.5, "inside", "ratusz_drzwi"], [12, "wander", "rynek_lawka"], [13, "inside", "ratusz_drzwi"],
                   [16, "stand", "pisarz_praca"], [18.5, "inside", "ratusz_drzwi"]], talk: talk0() }, "ratusz_drzwi", z0()),
        // the Lord's steward: the books of debts and water; between the manor, the town hall and the counting-house
        miasto220({ key: "rzadca", id: 8203, name: "", title: "", sheet: "$Npc_Pula_M3", speed: 3, away: ["do_dworu"],
            plan: [[0, "inside", "do_dworu"], [8.5, "inside", "ratusz_drzwi"], [12, "wander", "rynek_srodek"], [13, "inside", "ratusz_drzwi"], [15, "wander", "kantor_drzwi"],
                   [16, "inside", "kantor_drzwi"], [17.5, "inside", "do_dworu"]], talk: talk0() }, "ratusz_drzwi", z0()),
        // the well keeper: guards the square's well, sells water "to friends"
        miasto220({ key: "studzienny", id: 8204, name: "", title: "", sheet: "$Npc_Pula_Z", speed: 3,
            plan: [[0, "inside", "budka_drzwi"], [5, "stand", "studzienny_praca"], [12, "wander", "plac_studnia"], [13, "stand", "studzienny_praca"], [19, "wander", "rynek_srodek"],
                   [20, "inside", "budka_drzwi"]], talk: talk0() }, "budka_drzwi", z0()),
        // the brewer, master of the guild: wants the tavern's guests, or the tavern itself
        miasto220({ key: "piwowar", id: 8205, name: "", title: "", sheet: "$Npc_Pula_Z2", speed: 3,
            plan: [[0, "inside", "browar_drzwi"], [6, "work", "piwowar_praca"], [11, "wander", "stragan2"], [12, "inside", "browar_drzwi"], [15, "wander", "rynek_rog"],
                   [16.5, "stand", "tawerna_szyld"], [17.5, "inside", "browar_drzwi"]], talk: talk0() }, "browar_drzwi", z0()),
        // the tavern's cook: water for the soup at dawn, the kitchen door, the market
        miasto220({ key: "kucharka", id: 8206, name: "", title: "", sheet: "$Npc_Pula_K", speed: 3,
            plan: [[0, "inside", "tawerna_drzwi"], [5.5, "wander", "plac_studnia"], [6.5, "inside", "tawerna_drzwi"], [10, "work", "kucharka_praca"], [11, "wander", "stragan1"],
                   [12, "inside", "tawerna_drzwi"], [16, "work", "kucharka_praca"], [17, "inside", "tawerna_drzwi"]], talk: talk0() }, "tawerna_drzwi", z0())
    ];
    RESIDENTS.push(...NEW_220);
    // (2026-11-14, the tiny hut: Map218 door (14,19), room Map224) grandpa Stach lives his modest day in Podgrodzie: the yard and the
    // chopping block at dawn, the shrine, his bench, the square; at night and at noon in his hut - by the hearth (the room's spot
    // "dziadek_wnetrze", a default of SPOTS_BY_MAP[224]). A plain resident for now: the story's own grandpa (Story.js, event 901)
    // still lives only in the old house, Map019 - when the story's start moves to the new world the two become one.
    RESIDENTS.push(podgrodzie218({ key: "dziadek", id: 8207, name: "", title: "", sheet: "$Npc_Dziadek", speed: 2,
        plan: [[0, "inside", "dziadek_drzwi"], [5.5, "work", "dom_dziadka_podworko"], [8, "wander", "dom_dziadka_podworko"], [10, "wander", "kapliczka"],
               [11.5, "inside", "dziadek_drzwi"], [13, "stand", "dom_dziadka_podworko"], [17, "wander", "plac"], [18.5, "stand", "dom_dziadka_podworko"],
               [20.5, "inside", "dziadek_drzwi"]], talk: talk0() }, "dziadek_drzwi", z0()));
    {   // (a story game has its own grandpa in the hut - Story.js: the plain one is not there then)
        const r = RESIDENTS[RESIDENTS.length - 1], here = r.when;
        r.when = () => here() && !(window.Story && typeof Story.active === "function" && Story.active());
    }
    if (window.SpeechBubbles && SpeechBubbles.BUSTS) SpeechBubbles.BUSTS["$Npc_Wanda:0"] = "Wanda_Bust";
    // the words of every resident (name, title, barks, talk, alt, zaczepki): js/teksty/mieszkancy.txt, mieszkancy.<key> - merged into
    // these very objects and lists once the files are read (the lists stay the same lists: TownLife and Dwor_Data hold them)
    Watki.scal(RESIDENTS, "mieszkancy", "mieszkancy", "key");
    if (window.SpeechBubbles && SpeechBubbles.BUSTS) for (const r of NEW_PODGRODZIE) SpeechBubbles.BUSTS[r.sheet + ":0"] = r.sheet.slice(5) + "_Bust";

    // the spots of the other maps residents live on ("map" in their data): defaults only - the map's "Miejsce: <key>" events win
    // (Map024: the guard's day post beside the left fire basket of the forecourt; his night round straz_1..4 - the map's "Miejsce:"
    // markers win; 2026-10-12: the user's rebuilt garden has no straz_4 any more - the defaults keep the round: the orangery's corner,
    // the middle path, the south path, back by the orangery's terrace)
    // (Map023 Skraj lasu: Rysiek's night place by his snares, in the small clearing by the stones - 2026-10-17)
    // (2026-11-11 dawcy_miasto) 111: "tawerna" = the way out to the town (the west gate); 162: the garrison's front gate; 1 = the tavern's hall: the
    // places of the evening's visitors (resident.indoor.tawerna), all standing: the notice board's corner (Marta, Franek, Jadwiga), the hearth
    // of the entrance hall (Józek, Zbych, Darin, Rysiek), the front of the bar (Sambor, Bazyli, Kłos); dir 8 = facing the board / fire / bar
    // (2026-11-13 nowy świat) Słony Brzeg (219): the east edge of the road = gone to Podgrodzie / Kruczogród (a default; a "Miejsce:" on the map wins)
    const SPOTS_BY_MAP = { 218: { pod_murem: [58, 17, 2], stodola: [60, 17, 2], w6_ognisko: [55, 16, 4], uchodzcy_drzwi: [41, 53, 8], namioty: [57, 18, 2], drewutnia: [66, 18, 8], tawerna: [79, 38, 6] }, 221: { straz_dzien: [42, 28, 2], straz_1: [10, 20, 6], straz_2: [24, 20, 2], straz_3: [24, 34, 4], straz_4: [10, 34, 8] }, 224: { dziadek_wnetrze: [4, 5, 8] }, 219: { do_podgrodzia: [79, 45, 6], szlaban: [72, 45, 4], nabrzeze: [40, 46, 2], molo_wejscie: [37, 47, 4] }, 220: { do_podgrodzia: [0, 38, 4], do_dworu: [79, 41, 6], dwor: [79, 41, 6], stragan_kosci: [56, 44, 4], cech_przed: [19, 59, 2], pisarz_gosc: [42, 21, 4], kaplica_lawka2: [9, 26, 2], ostap_dom: [19, 59, 8], jas_dom: [28, 59, 8], ludwik_dom: [35, 66, 8] }, 111: { tawerna: [105, 51, 6] }, 125: { tawerna: [53, 19, 6] }, 162: { tawerna: [55, 34, 2] },
        1: { gosc_praczka: [6, 37, 8], gosc_franek: [5, 37, 8], gosc_znachorka: [8, 37, 8], gosc_szmaciarz: [20, 38, 8], gosc_uchodzca: [22, 38, 8],
             gosc_drwal: [23, 37, 8], gosc_klusownik: [23, 39, 8], gosc_celnik: [9, 18, 8], gosc_latarnik: [17, 18, 8], gosc_kwatermistrz: [19, 18, 8] }, 23: { klusownik_las: [20, 23, 4] }, 24: { straz_dzien: [35, 76, 2], straz_1: [30, 79, 6], straz_2: [39, 79, 2], straz_3: [39, 88, 4], straz_4: [30, 88, 8] } };

    // (2026-10-21) EXTRA_RANGE: the second range of ids for TownLifeExtra (the new terrain's packages, docs/rozszerzenia/PLAN.md)
    // (2026-10-22) EXTRA_RANGES: every range past 910-949 - the second one and the new Podgrodzie's third (TawernaCore's registry)
    // (2026-10-28) the fourth, 3020-3049: the ferry's travellers (Podroznicy_Data.js, docs/PODROZNI.md 6.3)
    window.TownLifeData = { MAP: 8, FIRST_ID: 910, EXTRA_RANGE: [2900, 2949], EXTRA_RANGES: [[2900, 2949], [2950, 2959], [2960, 2969], [3020, 3049], [8200, 8219]], SPOTS, SPOTS_BY_MAP, RESIDENTS, moveLate };
})();
