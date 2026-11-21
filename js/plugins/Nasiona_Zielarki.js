//=============================================================================
// Nasiona_Zielarki.js
//=============================================================================
// (2026-11-19, the user: the new crops - their seeds "przy grabieniu, w dzikich formach i u wędrownej zielarki") the herbalist from
// the ferry (Podroznicy's pool person "zielarka") sells seeds: one row more in her talk menu ("Nasiona: ...") for each seed that can
// be sown in this season or the next one, and the apple pips always. A buy: the price from the purse (the coins, Monety), one into the
// bag, her word. Nothing is saved.

/*:
 * @target MZ
 * @plugindesc Zielarka z promu sprzedaje nasiona (te na tę i na następną porę roku) i pestki jabłoni. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Podroznicy
 *
 * @help
 * ============================================================================
 * Nasiona_Zielarki.js - nasiona u zielarki z promu
 * ============================================================================
 * Gdy zielarka z lądu jest na wyspie (podróżni z promu), w rozmowie z nią
 * są pozycje „Nasiona: ...” - po jednym nasionie za cenę z bazy przedmiotów.
 * ============================================================================
 */

(() => {
    "use strict";
    const PLUGIN = "Nasiona_Zielarki";
    const T = window.Tawerna;
    if (!T) throw new Error("Nasiona_Zielarki.js: brak TawernaCore.js (the Tawerna core is missing)");

    const PIPS = 499;
    // the herbalist's words (one picked at random)
    const SAID = {
        buy: ["Proszę. Siej w dobrą ziemię i nie żałuj wody.", "Dobre nasiona, z lądu. Wzejdą, zobaczysz.", "Trzymaj. Byle nie w suszę, to obrodzi."],
        poor: ["Za mało masz w sakiewce, kochaneczku.", "Nie stać cię dziś. Przyjdź, jak zarobisz."]
    };
    const pickOf = list => list[Math.floor(Math.random() * list.length)];

    // is this resident the herbalist now (the pool's place she holds)
    function isHerbalist(resKey) {
        const P = T.api("Podroznicy");
        if (!P || !P.osoba || !P.obecni) return false;
        try {
            const pk = P.osoba(resKey), e = pk ? P.obecni()[pk] : null;
            return !!e && e.pula === "zielarka";
        } catch (err) { return false; }
    }
    // what she has: the crops' seeds for this season and the next, the apple pips
    function goods() {
        const F = T.api("Farming");
        if (!F || !F.CROPS) return [];
        const s = T.time.season(), next = (s + 1) % 4, out = [];
        for (const c of Object.values(F.CROPS)) {
            if (!c.seasons || !(c.seasons.includes(s) || c.seasons.includes(next))) continue;
            if (!out.includes(c.seed)) out.push(c.seed);
        }
        out.push(PIPS);
        return out.filter(id => $dataItems[id]);
    }
    const C = (code, parameters) => ({ code, indent: 0, parameters });
    function rows() {
        return goods().map(id => {
            const it = $dataItems[id];
            return { label: "Nasiona: " + it.name + " (" + it.price + " G)", cmds: [C(355, ["Nasiona_Zielarki.kup(" + id + ")"])] };
        });
    }
    // a buy (from the talk's script call): the coins out, the seed in, her word in a bubble over her
    function kup(id) {
        const it = $dataItems[id];
        if (!it) return false;
        const ok = $gameParty.gold() >= it.price;
        if (ok) {
            $gameParty.loseGold(it.price);
            $gameParty.gainItem(it, 1);
            T.audio.se("Shop1", { volume: 80 });
        }
        const line = pickOf(ok ? SAID.buy : SAID.poor);
        if (window.SpeechBubbles && SpeechBubbles.say && T.talk.speaker) {
            try { const ev = T.talk.speaker(); if (ev) { SpeechBubbles.say(ev, line); return ok; } } catch (err) { /* (no speaker: a popup) */ }
        }
        T.popup(line, { icon: it.iconIndex, color: ok ? "#cfe6a8" : "#ffb070" });
        return ok;
    }

    T.talk.option({ owner: PLUGIN, id: "nasiona", who: isHerbalist, order: T.talk.ORDER.extra + 5, rows: () => { try { return rows(); } catch (err) { console.error("[Nasiona_Zielarki]", err); return []; } } });

    window.Nasiona_Zielarki = T.register(PLUGIN, { goods, rows, kup, isHerbalist });
})();
