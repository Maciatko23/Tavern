//=============================================================================
// Mlynarz.js
//=============================================================================
// (2026-11-19, the user: the flour from a mill - before the hero's own) the miller of Podgrodzie (TownLife's "nowy_mlynarz", by his
// windmill by day) grinds the hero's barley for a few coppers: one row in his talk menu per choice - three handfuls, or all the barley
// in the bag. 3 barley + FEE -> 2 flour, at once (the sails turn all day). Nothing is saved.

/*:
 * @target MZ
 * @plugindesc Młynarz z Podgrodzia miele jęczmień na mąkę za kilka miedziaków (zanim gracz postawi własny młyn). v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TownLife
 *
 * @help
 * ============================================================================
 * Mlynarz.js - mielenie u młynarza w Podgrodziu
 * ============================================================================
 * W rozmowie z młynarzem (przy wiatraku w Podgrodziu, za dnia): „Zmiel
 * jęczmień” - 3 jęczmienia i opłata dają 2 mąki. Własny młyn na działce
 * (Farming_Data: mill) miele za darmo.
 * ============================================================================
 */

(() => {
    "use strict";
    const PLUGIN = "Mlynarz";
    const T = window.Tawerna;
    if (!T) throw new Error("Mlynarz.js: brak TawernaCore.js (the Tawerna core is missing)");

    const WHO = "nowy_mlynarz";
    const BARLEY = 74, FLOUR = 82, PER = 3, OUT = 2, FEE = 3;
    const SAID = {
        done: ["Zmielone. Mąka jak puch, sam zobaczysz.", "Proszę bardzo. Wiatr dziś dobry, kamień chodzi lekko.", "Gotowe. Z takiego ziarna chleb wyjdzie jak trzeba."],
        noGrain: ["Przynieś choć trzy garście jęczmienia, to zmielę.", "Z pustymi rękami nie zmielę, sąsiedzie."],
        noCoin: ["Za mielenie biorę parę miedziaków. Wróć, jak będziesz miał.", "Kamień się ściera, a ja też muszę coś jeść. Parę miedziaków."]
    };
    const pickOf = list => list[Math.floor(Math.random() * list.length)];
    const count = id => $gameParty.numItems($dataItems[id]);
    const C = (code, parameters) => ({ code, indent: 0, parameters });

    // how many batches the bag and the purse allow (max: the most wanted)
    function batches(max) {
        return Math.max(0, Math.min(max, Math.floor(count(BARLEY) / PER), Math.floor($gameParty.gold() / FEE)));
    }
    function rows() {
        const have = Math.floor(count(BARLEY) / PER), out = [{ label: "Zmiel jęczmień: " + PER + " na " + OUT + " mąki (" + FEE + " G)", cmds: [C(355, ["Mlynarz.miel(1)"])] }];
        if (have >= 2) out.push({ label: "Zmiel cały jęczmień: " + have + " razy (" + have * FEE + " G)", cmds: [C(355, ["Mlynarz.miel(" + have + ")"])] });
        return out;
    }
    // the grinding (from the talk's script call): n batches, as many as the barley and the coins allow
    function miel(n) {
        const k = batches(Math.max(1, n | 0));
        let line;
        if (k < 1) line = pickOf(count(BARLEY) < PER ? SAID.noGrain : SAID.noCoin);
        else {
            $gameParty.loseItem($dataItems[BARLEY], k * PER);
            $gameParty.loseGold(k * FEE);
            $gameParty.gainItem($dataItems[FLOUR], k * OUT);
            T.audio.se("Machine", { volume: 70, pitch: 80 });
            line = pickOf(SAID.done);
        }
        T.popup(line, { icon: $dataItems[k < 1 ? BARLEY : FLOUR].iconIndex, color: k < 1 ? "#ffb070" : "#cfe6a8" });
        return k;
    }

    T.talk.option({ owner: PLUGIN, id: "miel", who: WHO, order: T.talk.ORDER.extra + 5, rows: () => { try { return rows(); } catch (err) { console.error("[Mlynarz]", err); return []; } } });

    window.Mlynarz = T.register(PLUGIN, { WHO, PER, OUT, FEE, rows, miel, batches });
})();
