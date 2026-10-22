// Symulacja rozdziału 1: dzień po dniu, ile złota przy różnym stylu gry - do kiedy 2500 G. Tylko liczy (dane z wtyczek i pomiarów).
// Zmiana (TavernShift.js): dniówka 15 + 3*L, premia do 40 * wynik, +5 przy ocenie 5, potrącenia; L = liczba zmian (do 5).
// Napiwki: z pomiarów botów (L0 dobry 29 G, L2 dobry 45 G, L4 dobry 66 G, L4 średni 28 G - pomiar3) ~ (29 + 9,25 L) * wynik^2,5.
// Tablica zleceń (QuestBoard): średnia zapłata progów 15/21/34/52/70 G, sława +4/+5/+6/+7/+8, progi 0/20/40/60/80 i dni 1/4/10/18/28.
"use strict";
const DEBT = 2500;
function shift(L, p) {   // p: wynik 0..1
    const pay = Math.max(3, 15 + 3 * L + 40 * p + (p >= 0.88 ? 5 : 0) - Math.round((1 - p) * 12));
    const tips = (29 + 9.25 * L) * Math.pow(p, 2.5);
    return pay + tips;
}
const TIERS = [[0, 1, 15, 4], [20, 4, 21, 5], [40, 10, 34, 6], [60, 18, 52, 7], [80, 28, 70, 8]];
function tier(rep, day) { let t = TIERS[0]; for (const x of TIERS) if (rep >= x[0] && day >= x[1]) t = x; return t; }
const PROFILES = {
    szybki: { p: 0.9, shiftEvery: 1, firstShiftDay: 1, boardEvery: 1, quests: 8, sales: 15, games: 15, spend: 8 },
    typowy: { p: 0.72, shiftEvery: 1 / 0.85, firstShiftDay: 2, boardEvery: 2, quests: 10, sales: 8, games: 0, spend: 10 },
    spokojny: { p: 0.6, shiftEvery: 1 / 0.6, firstShiftDay: 3, boardEvery: 3, quests: 7, sales: 5, games: 0, spend: 10 },
    tylkoZmiany: { p: 0.72, shiftEvery: 1, firstShiftDay: 1, boardEvery: 0, quests: 0, sales: 0, games: 0, spend: 6 }
};
const out = {};
for (const [name, P] of Object.entries(PROFILES)) {
    let gold = 0, shifts = 0, rep = 0, nextShift = P.firstShiftDay, nextBoard = 1, day = 0, log = [];
    while (gold < DEBT && day < 120) {
        day++;
        let g = 0;
        if (day >= nextShift) { g += shift(Math.min(5, shifts), P.p); shifts++; nextShift += P.shiftEvery; }
        if (P.boardEvery && day >= nextBoard) { const t = tier(rep, day); g += t[2]; rep += t[3]; nextBoard += P.boardEvery; }
        g += P.quests + P.sales + P.games - P.spend;
        gold += g;
        log.push(Math.round(gold));
    }
    out[name] = { dni: day, zmian: shifts, slawa: rep, srZmiana: Math.round(shift(5, P.p)), zmianaL0: Math.round(shift(0, P.p)), co10: log.filter((_, i) => i % 10 === 9) };
}
console.log(JSON.stringify(out, null, 1));
require("fs").writeFileSync(require("path").join(__dirname, "ekonomia.json"), JSON.stringify(out, null, 1));
