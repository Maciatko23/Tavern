// TavernDice.js without the game: the scoring (fixed cases, the names, every throw of 1-6 dice against an independent reference),
// the bust table, the best set-aside, the seeded dice (the same seed, the same faces; the special dice's weights), the <Tavern:dice>
// tag read through the core as the old expression read it (every event of every map). TavernDice in its four files (TavernDice_Data,
// TavernDice, TavernDice_Art, TavernDice_Scene) on the core and the UI kit.
const fs = require("fs");
const path = require("path");
const unit = require("../lib/unit.js");

// an independent way to count a throw: every split of the dice into groups, each group a known figure (-1: some die does not count)
function reference(faces) {
    const n = faces.length, blocks = [];
    let best = -1;
    const value = b => {
        const s = b.slice().sort((x, y) => x - y), k = s.length, key = s.join("");
        if (k === 1) return s[0] === 1 ? 100 : s[0] === 5 ? 50 : -1;
        if (k >= 3 && s.every(v => v === s[0])) return (s[0] === 1 ? 1000 : s[0] * 100) * Math.pow(2, k - 3);
        return key === "12345" ? 500 : key === "23456" ? 750 : key === "123456" ? 1500 : -1;
    };
    const rec = i => {
        if (i === n) { let sum = 0; for (const b of blocks) { const v = value(b); if (v < 0) return; sum += v; } if (sum > best) best = sum; return; }
        for (const b of blocks) { b.push(faces[i]); rec(i + 1); b.pop(); }
        blocks.push([faces[i]]); rec(i + 1); blocks.pop();
    };
    rec(0);
    return best;
}

unit.test(t => {
    const w = unit.load(["TawernaCore", "TawernaUI", "TavernDice_Data", "TavernDice", "TavernDice_Art", "TavernDice_Scene"]);
    const D = w.TavernDice, parts = w.Tawerna.api("TavernDice_parts") || {};
    t.check("TavernDice loads in its four files (the rivals, the pictures, the scene)", !!(parts.data && parts.core && parts.art && parts.Scene && D.OPPONENTS === parts.data.OPPONENTS),
        Object.keys(parts));
    const pts = d => { const s = D.score(d); return s.valid ? s.points : null; };

    const cases = [
        [[1], 100], [[5], 50], [[2], null], [[3], null], [[1, 5], 150], [[1, 1], 200], [[5, 5], 100], [[1, 1, 5, 5], 300],
        [[1, 1, 1], 1000], [[2, 2, 2], 200], [[3, 3, 3], 300], [[4, 4, 4], 400], [[5, 5, 5], 500], [[6, 6, 6], 600],
        [[4, 4, 4, 4], 800], [[4, 4, 4, 4, 4], 1600], [[4, 4, 4, 4, 4, 4], 3200], [[1, 1, 1, 1], 2000], [[1, 1, 1, 1, 1], 4000],
        [[1, 1, 1, 1, 1, 1], 8000], [[2, 2, 2, 2, 2, 2], 1600], [[5, 5, 5, 5, 5, 5], 4000], [[5, 5, 5, 5], 1000],
        [[1, 2, 3, 4, 5], 500], [[2, 3, 4, 5, 6], 750], [[6, 5, 4, 3, 2, 1], 1500], [[1, 1, 2, 3, 4, 5], 600], [[1, 2, 3, 4, 5, 5], 550],
        [[5, 2, 3, 4, 6, 5], 800], [[2, 3, 4, 5, 6, 6], null], [[2, 2, 2, 3, 3, 3], 500], [[1, 1, 1, 5, 5, 5], 1500],
        [[1, 1, 1, 1, 5], 2050], [[2, 2, 2, 2, 5, 5], 500], [[4, 4], null], [[1, 2, 3, 4], null], [[6, 6, 6, 1], 700], [[3, 3, 3, 5], 350],
        [[], null], [[2, 3, 4, 6, 6, 2], null], [[1, 2, 3, 4, 5, 2], null], [[0], null], [[7], null]
    ];
    const bad = cases.filter(([d, want]) => pts(d) !== want).map(([d, want]) => ({ d, want, got: pts(d) }));
    t.check("scoring: " + cases.length + " fixed cases (singles, 3-6 of a kind, straights, straight + extra, two triples, invalid ones)", bad.length === 0, bad.slice(0, 5));
    t.eq("scoring: { face } objects count as their faces", pts([{ face: 1 }, { face: 5 }]), 150);
    t.eq("scoring: the names of the figures",
        [[4, 4, 4, 1], [1, 1, 5], [6, 6, 6, 6, 6], [1, 2, 3, 4, 5, 6], [2, 3, 4, 5, 6]].map(d => D.score(d).name),
        ["Trzy czwórki + jedynka", "Dwie jedynki + piątka", "Pięć szóstek", "Pełny strit", "Duży strit"]);

    // every throw of 1-6 dice (as sets of faces) against the reference
    let n = 0;
    const wrong = [];
    const rec = (a, from, len) => {
        if (a.length === len) { n++; const got = pts(a) === null ? -1 : pts(a), want = reference(a); if (got !== want && wrong.length < 5) wrong.push({ a: a.slice(), got, want }); return; }
        for (let f = from; f <= 6; f++) { a.push(f); rec(a, f, len); a.pop(); }
    };
    for (let len = 1; len <= 6; len++) rec([], 1, len);
    t.check("scoring: every throw of 1-6 dice (" + n + " sets of faces) agrees with an independent reference", n === 923 && wrong.length === 0, wrong);

    // the bust chances over every ordered throw
    const exact = [];
    for (let k = 1; k <= 6; k++) {
        let bust = 0, tot = 0;
        const all = a => { if (a.length === k) { tot++; if (!D.hasScore(a)) bust++; return; } for (let f = 1; f <= 6; f++) { a.push(f); all(a); a.pop(); } };
        all([]);
        exact.push(+(bust / tot).toFixed(4));
    }
    t.eq("the bust chances counted over every throw match the AI's table (P_BUST)", exact, D.P_BUST.slice(1));

    // the best set-aside
    t.eq("best: [1,1,1,1,5,2] -> 2050 with five dice", [D.best([1, 1, 1, 1, 5, 2]).points, D.best([1, 1, 1, 1, 5, 2]).n], [2050, 5]);
    t.eq("best: a full straight takes all six (hot dice)", D.best([1, 5, 2, 3, 4, 6]).n, 6);
    t.eq("best: nothing in [2,3,4,6,6,2] (a bust)", D.best([2, 3, 4, 6, 6, 2]), null);
    const opts = D.options([1, 5, 5]);
    t.check("options: each distinct set of faces once, all of them valid", opts.length === 5 && opts.every(o => o.points > 0), opts.map(o => o.idx.map(i => [1, 5, 5][i]).join("")));

    // the seeded dice
    const roll = (seed, k) => { const r = D.makeRng(seed); return Array.from({ length: k }, () => D.rollFace(r)); };
    t.eq("the same seed gives the same throws", roll(42, 30), roll(42, 30));
    t.check("another seed gives other throws", roll(42, 30).join() !== roll(43, 30).join());
    const plain = D.rollStats("std", 60000, 7);
    t.check("a plain die: each face about 1/6 of 60000 throws (within 3%)", plain.every(c => Math.abs(c - 10000) < 300), plain);
    t.eq("rollStats is seeded (the same counts again)", D.rollStats("std", 5000, 7), D.rollStats("std", 5000, 7));
    const special = Object.keys(D.DIE_TYPES).filter(k => k !== "std" && D.DIE_TYPES[k].w);
    const skew = special.map(k => { const w = D.DIE_TYPES[k].w, sum = w.reduce((a, b) => a + b, 0), c = D.rollStats(k, 60000, 11); return { k, off: Math.max(...c.map((v, i) => Math.abs(v / 60000 - w[i] / sum))) }; });
    t.check("the special dice (" + special.length + ") come up as their weights say (within 1%)", special.length > 0 && skew.every(s => s.off < 0.01), skew);

    // ---- <Tavern:dice[:rival]> (the comments of the page on, then of page 1; not the note): the core's tags against the old expression
    const OLD = /<Tavern\s*:\s*dice(?:\s*:\s*(\w+))?\s*>/i;
    const oldTag = ev => {
        for (const p of [ev.pages[0], ev.pages[0]]) for (const c of (p && p.list) || []) {
            if (c.code !== 108 && c.code !== 408) continue;
            const m = OLD.exec(String(c.parameters[0] || ""));
            if (m) return { only: m[1] && D.OPPONENTS[m[1].toLowerCase()] ? m[1].toLowerCase() : null };
        }
        return null;
    };
    const DATA = path.join(__dirname, "..", "..", "data"), diff = [];
    let tables = 0, events = 0;
    for (const f of fs.readdirSync(DATA).filter(n => /^Map\d+\.json$/.test(n))) {
        for (const ev of JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8")).events || []) {
            if (!ev || !ev.pages) continue;
            events++;
            const old = oldTag(ev), now = parts.core.diceTag({ event: () => ev, page: () => ev.pages[0] });
            if (old) tables++;
            if (JSON.stringify(old) !== JSON.stringify(now)) diff.push(f + " " + ev.id + " " + JSON.stringify([old, now]));
        }
    }
    t.check("<Tavern:dice> read through the core as before on all " + events + " events of the maps (" + tables + " tables)", diff.length === 0 && tables >= 1, diff.slice(0, 5));
    const fake = (lines, note) => ({ event: () => ({ note: note || "", pages: [{ list: lines.map(l => ({ code: 108, parameters: [l] })) }] }), page: () => null });
    t.eq("...and the odd ones: a rival, spaces and case, an unknown rival, another word, the note does not count",
        [fake(["<Tavern:dice:grum>"]), fake(["<TAVERN : Dice : OZZY >"]), fake(["<Tavern:dice:kot>"]), fake(["<Tavern:dices>"]), fake([], "<Tavern:dice>"), fake(["<Tavern:meal>", "<Tavern:dice>"])].map(e => parts.core.diceTag(e)),
        [{ only: "grum" }, { only: "ozzy" }, { only: null }, null, null, { only: null }]);
});
