// The test map's picking (tests/lib/mapa.js - `node tests/run.js zmiany`) without the game and without .git: the line diff against an
// independent longest-common-subsequence, the comments and blank lines that change nothing, the names a top-level line stands for,
// and select() on a made-up plugin measured by ten tests - a changed line inside a function picks the tests that ran it, a block
// (the rest of a function after an early return) only the ones that got there, a function every test runs asks for the smoke set,
// a table's line picks the tests of the functions that read the table, a function no test ran is told, lines moved by an edit made
// after the measurement still find their functions; a map file picks the tests that went onto it, a picture the ones that loaded it.
"use strict";
const unit = require("../lib/unit.js");
const M = require("../lib/mapa.js");

// the plugin as it was measured (version "v1")
const V1 = [
    "(() => {",                         // 1
    "    \"use strict\";",              // 2
    "    const TABLE = {",              // 3
    "        wolf: 30,",                // 4
    "        boar: 50",                 // 5
    "    };",                           // 6
    "    // the hit points of a kind",  // 7
    "    function hp(kind) {",          // 8
    "        return TABLE[kind] || 0;", // 9
    "    }",                            // 10
    "    function onlyA() {",           // 11
    "        return 1;",                // 12
    "    }",                            // 13
    "    function everyFrame() {",      // 14
    "        if (!window.x) return;",   // 15
    "        doRare();",                // 16
    "    }",                            // 17
    "    function never() {",           // 18
    "        return 4;",                // 19
    "    }",                            // 20
    "})();"                             // 21
];
const REL = "js/plugins/Proba.js";
const bits = ids => ids.reduce((b, i) => M.bitsPut(b, i, true), "");
const ALL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
function makeMap() {
    const testy = {};
    ALL.forEach(i => { testy["t" + i + "_test"] = { id: i, wynik: "1/1", status: "ok", sek: 10 }; });
    return {
        opis: "", zmierzono: "2026-10-23 12:00", bloki: true, testy,
        pliki: { "img/pictures/Proba.png": bits([5, 6]), "data/System.json": bits(ALL) },
        mapy: { "data/Map005.json": bits([4]) },
        wtyczki: { [REL]: { v1: [
            [1, 21, "", bits(ALL), 0, 4],
            [1, 21, "", bits(ALL), 1, 1],
            [8, 10, "hp", bits([1])],
            [11, 13, "onlyA", bits([0])],
            [14, 17, "everyFrame", bits(ALL)],
            [16, 16, "everyFrame#", bits([3]), 8, 16],
            [18, 20, "never", ""]
        ] } }
    };
}
const blobs = new Map([["v1", V1.join("\n")]]);
// select() for one changed plugin text (base: as measured, unless given)
function pick(nowLines, baseLines) {
    const r = M.select(makeMap(), [{ path: REL, base: (baseLines || V1).join("\n"), now: nowLines.join("\n") }], { blobs });
    return { tests: [...r.tests.keys()].sort(), smoke: r.smoke.length > 0, notes: r.notes };
}
const edit = (i, text) => { const l = V1.slice(); l[i - 1] = text; return l; };

unit.test(t => {
    // ---- the diff
    let bad = 0, seed = 7;
    const rnd = n => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
    const lcs = (a, b) => { const d = Array.from({ length: a.length + 1 }, () => new Int32Array(b.length + 1)); for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) d[i][j] = a[i] === b[j] ? d[i + 1][j + 1] + 1 : Math.max(d[i + 1][j], d[i][j + 1]); return d[0][0]; };
    for (let k = 0; k < 400; k++) {
        const a = Array.from({ length: rnd(12) }, () => "abc"[rnd(3)]), b = Array.from({ length: rnd(12) }, () => "abc"[rnd(3)]);
        let kept = 0, ai = 0, bj = 0, ok = true;
        for (const h of M.diffLines(a, b)) { while (ai < h.a0) { if (a[ai++] !== b[bj++]) ok = false; kept++; } if (bj !== h.b0) ok = false; ai = h.a1; bj = h.b1; }
        while (ai < a.length) { if (a[ai++] !== b[bj++]) ok = false; kept++; }
        if (!ok || bj !== b.length || kept !== lcs(a, b)) bad++;
    }
    t.eq("the line diff: 400 random pairs, the kept lines are equal and as many as the longest common subsequence", bad, 0);
    const big = Array.from({ length: 4000 }, (_, i) => "line " + i), big2 = big.slice();
    big2.splice(100, 3, "x"); big2.splice(3000, 0, "y");
    t.eq("...a long file with two edits: two blocks where they are", M.diffLines(big, big2), [{ a0: 100, a1: 103, b0: 100, b1: 101 }, { a0: 3002, a1: 3002, b0: 3000, b1: 3001 }]);
    t.eq("comments and blank lines changed or added change no code; a code line cut leaves the two lines round it",
        [M.codeChanges(V1, edit(7, "    // another comment")), M.codeChanges(V1, V1.slice(0, 7).concat(["", "    // more"], V1.slice(7))),
            M.codeChanges(V1, V1.slice(0, 11).concat(V1.slice(12)))], [[], [], [10, 11]]);
    t.eq("a top-level line's names: what it declares (one letter is too common to follow); a table's row - the table it is in",
        [[...M.namesAt(V1, 2)], [...M.namesAt(V1, 3)], [...M.namesAt(["    const { alpha, beta: gamma, d } = X;"], 0)]], [["TABLE"], ["TABLE"], ["alpha", "gamma"]]);
    t.eq("...an assignment into the plugin's own object - that object (BUSTS); not into the engine's classes",
        [[...M.namesAt(["    BUSTS[\"$Npc_X:0\"] = \"X_Bust\";"], 0)], [...M.namesAt(["    Game_Event.prototype.speed = 3;"], 0)]], [["BUSTS"], []]);

    const TXT = ["# a comment", "rozmowa.start = Witaj.", "[rozmowa.dalej]", "Pierwsza linia.", "Druga linia.", "", "rzeczy.noz = Nóż"];
    const txtEdit = (i, s) => { const l = TXT.slice(); l[i] = s; return l.join("\n"); };
    t.eq("a words file (js/teksty, Watki.js): the key of a changed line - a key = value line, a line of a [block] its block, a comment none",
        [M.changedTextKeys(TXT.join("\n"), txtEdit(1, "rozmowa.start = Dzień dobry.")), M.changedTextKeys(TXT.join("\n"), txtEdit(4, "Druga, inna linia.")),
            M.changedTextKeys(TXT.join("\n"), txtEdit(0, "# another comment"))], [["rozmowa.start"], ["rozmowa.dalej"], []]);

    // ---- select() on the made-up plugin
    let r = pick(edit(12, "        return 11;"));
    t.eq("a line in a function: exactly the test that ran it (onlyA - t0), no smoke", [r.tests, r.smoke], [["t0_test"], false]);
    r = pick(edit(7, "    // the hit points of each kind"));
    t.eq("a comment changed: no test, no smoke", [r.tests, r.smoke], [[], false]);
    r = pick(edit(4, "        wolf: 35,"));
    t.eq("a row of a top-level table: the tests of the functions reading the table (hp - t1)", [r.tests, r.smoke], [["t1_test"], false]);
    r = pick(edit(16, "        doRare(2);"));
    t.eq("after an early return (a block of its own): only the test that got there (t3), not every test running the function", [r.tests, r.smoke], [["t3_test"], false]);
    r = pick(edit(15, "        if (!window.y) return;"));
    t.eq("a line of a function every test runs: the smoke set, no list of all", [r.tests, r.smoke], [[], true]);
    r = pick(edit(19, "        return 5;"));
    t.check("a function no measured test ran: no test, told in the notes", r.tests.length === 0 && !r.smoke && r.notes.some(n => /never.*żaden zmierzony test/.test(n)), r);
    const later = V1.slice(0, 2).concat(["    const EXTRA = 1;   // (added after the measurement)", ""], V1.slice(2));
    r = pick(later.map((l, i) => (i === 13 ? "        return 12;" : l)), later);
    t.eq("an edit made after the measurement moved the lines: the change still finds its function (onlyA - t0)", [r.tests, later[13]], [["t0_test"], "        return 1;"]);
    r = pick(V1.slice(0, 11).concat(V1.slice(12)));
    t.eq("a code line cut out: the function it was in (t0)", r.tests, ["t0_test"]);

    // ---- the game's files
    const files = M.select(makeMap(), [{ path: "data/Map005.json" }, { path: "img/pictures/Proba.png" }], { blobs });
    t.eq("a map file: the tests that went onto it; a picture: the tests that loaded it", [...files.tests.keys()].sort(), ["t4_test", "t5_test", "t6_test"]);
    const sys = M.select(makeMap(), [{ path: "data/System.json" }], { blobs });
    t.check("a file every test loads (System.json): the smoke set", sys.tests.size === 0 && sys.smoke.length === 1, { tests: [...sys.tests.keys()], smoke: sys.smoke });
    t.check("the bit sets: a test's bit on and off again", M.bitsIds(M.bitsPut(M.bitsPut("", 17, true), 3, true)).join() === "3,17" && M.bitsPut(M.bitsPut("", 17, true), 17, false) === "");
});
