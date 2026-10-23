// The skill trees without the game (Skills_Data.js, read by Combat.js): the 10 trees and their 100+ skills - unique ids, places in the
// tree (rows 0-5, columns 0-4, one skill a cell), the paths (a root in row 0, every other skill led to from a row above in its own tree,
// all of them reachable), the ranks, the attribute thresholds a hero can have by the row's level, the effects (every key in FX and read by
// some plugin through Combat.perk, every {key} of a text an effect of the skill), the skill ids the plugins ask by name; Combat's side:
// perk sums the ranks, the texts with the values, why a skill cannot be learnt yet, learning it, spending the attribute points.
// Mirrors tests/skills_test.js (Mocna ręka 2 + Mistrz oręża = +20% / +5%), tests/combat_test.js ("Szeroki zamach" wants level 20,
// "Płynne kombo" level 4, no more points) and the skill counts of tests/humans_test.js / tests/creatures_test.js (100+, 102).
const fs = require("fs");
const path = require("path");
const unit = require("../lib/unit.js");

const PLUGINS = path.join(__dirname, "..", "..", "js", "plugins");
const ATTRS = ["str", "dex", "con", "per", "wil"];

unit.test(t => {
    function Game_System() {}
    let sys = null;
    const globals = { Game_System, $gameParty: { leader: () => null } };
    Object.defineProperty(globals, "$gameSystem", { get: () => sys, enumerable: true, configurable: true });
    const w = unit.load(["TawernaCore", "Skills_Data", "Combat", "Combat_Fight", "Combat_UI"], { globals });
    const SD = w.SkillData, C = w.Combat, S = SD.SKILLS, byId = id => S.find(s => s.id === id);
    const fresh = (o = {}) => {
        sys = new Game_System();
        const h = C.hero();
        Object.assign(h, { level: o.level || 1, points: o.points || 0, skillPoints: o.sp || 0, skills: Object.assign({}, o.skills || {}) });
        Object.assign(h.attr, o.attr || {});
        return h;
    };

    // ---- the trees and the skills
    t.check("10 trees with their ids and names (Walka wręcz ... Kuchnia); Tawerna.api(\"Skills_Data\") is window.SkillData; Combat reads the same lists",
        SD.TREES.map(x => x.id).join() === "melee,defense,ranged,survival,gather,hunting,farming,craft,build,cooking" && SD.TREES.every(x => x.name && x.desc) &&
        w.Tawerna.api("Skills_Data") === SD && C.SKILLS === S && C.TREES === SD.TREES && C.ROW_LEVEL === SD.ROW_LEVEL);
    const ids = S.map(s => s.id), trees = new Set(SD.TREES.map(x => x.id));
    t.check(S.length + " skills (100+ since stage 3, 102 with Hart ducha's two), unique ids, each in a known tree with a name and a text",
        S.length >= 102 && new Set(ids).size === ids.length && S.every(s => trees.has(s.tree) && s.name && s.text), ids.filter((id, i) => ids.indexOf(id) !== i));
    const cells = new Set(), place = [];
    for (const s of S) {
        const c = s.tree + ":" + s.row + ":" + s.col;
        if (cells.has(c) || !(s.row >= 0 && s.row < SD.ROW_LEVEL.length && s.col >= 0 && s.col <= 4)) place.push(s.id + " " + c);
        cells.add(c);
    }
    const rowsOk = SD.TREES.every(tr => { const rows = new Set(S.filter(s => s.tree === tr.id).map(s => s.row)); return Array.from({ length: rows.size }, (_, i) => i).every(r => rows.has(r)); });
    t.check("places: rows 0-5, columns 0-4, one skill a cell of its tree, no empty row in any tree", place.length === 0 && rowsOk, place);
    const paths = [];
    for (const s of S) {
        if (s.row === 0 && s.from.length) paths.push(s.id + ": a root with a path into it");
        if (s.row > 0 && !s.from.length) paths.push(s.id + ": no path");
        for (const f of s.from) { const p = byId(f); if (!p || p.tree !== s.tree || p.row >= s.row) paths.push(s.id + " <- " + f); }
    }
    const reach = new Set(S.filter(s => !s.from.length).map(s => s.id));
    for (let grew = true; grew;) { grew = false; for (const s of S) if (!reach.has(s.id) && s.from.some(f => reach.has(f))) { reach.add(s.id); grew = true; } }
    t.check("paths: the roots in row 0 (each tree has one), every other skill led to from a skill of its own tree in a row above; all reachable from a root",
        paths.length === 0 && reach.size === S.length && SD.TREES.every(tr => S.some(s => s.tree === tr.id && s.row === 0)), paths.concat(ids.filter(id => !reach.has(id))));

    // ---- the ranks, the levels, the attributes
    t.check("the rows' levels rise 1, 4, 10, 20, 32, 48 (under MAX_LEVEL); ranks 1-3", JSON.stringify(SD.ROW_LEVEL) === "[1,4,10,20,32,48]" &&
        SD.ROW_LEVEL[SD.ROW_LEVEL.length - 1] < C.MAX_LEVEL && S.every(s => Number.isInteger(s.ranks) && s.ranks >= 1 && s.ranks <= 3), S.filter(s => !(s.ranks >= 1 && s.ranks <= 3)).map(s => s.id));
    // the cheapest way to a skill: the fewest skills on a path from a root, and the attributes all of them want (kept together)
    const way = {};
    const wayOf = id => {
        if (way[id]) return way[id];
        const s = byId(id), mine = { n: 1, attr: Object.assign({}, s.attr) };
        let bestFrom = null;
        for (const f of s.from) { const o = wayOf(f); if (!bestFrom || o.n < bestFrom.n) bestFrom = o; }
        if (bestFrom) { mine.n += bestFrom.n; for (const a of ATTRS) mine.attr[a] = Math.max(mine.attr[a] || 0, bestFrom.attr[a] || 0); }
        return (way[id] = mine);
    };
    const tooHigh = S.filter(s => {
        const lv = SD.ROW_LEVEL[s.row], o = wayOf(s.id), need = ATTRS.reduce((a, k) => a + Math.max(0, (o.attr[k] || 0) - 5), 0);
        return Object.keys(s.attr).some(k => !ATTRS.includes(k) || s.attr[k] <= 5 || s.attr[k] > C.ATTR_MAX) || o.n > Math.max(1, lv - 1) || need > C.POINTS_PER_LEVEL * (lv - 1);
    }).map(s => s.id);
    t.check("every skill can be learnt at its row's level: the attribute thresholds (6-60) of its path fit the points a hero has by then (3 a level), " +
        "the skills on its way the skill points (1 a level; a root: the first point)", tooHigh.length === 0, tooHigh);

    // ---- the effects
    const fmt = Object.values(SD.FX), used = new Set(S.flatMap(s => Object.keys(s.fx)));
    const fxBad = S.filter(s => Object.keys(s.fx).some(k => !SD.FX[k] || !(typeof s.fx[k] === "number" && s.fx[k] > 0)) ||
        [...s.text.matchAll(/\{([^}]+)\}/g)].some(m => !(m[1] in s.fx))).map(s => s.id);
    t.check("the effects: every key of a skill in FX with a positive value, every {key} of a text an effect of that skill; every FX key used by some skill, " +
        "its format %, n or s", fxBad.length === 0 && Object.keys(SD.FX).every(k => used.has(k)) && fmt.every(f => ["%", "n", "s"].includes(f)),
        fxBad.concat(Object.keys(SD.FX).filter(k => !used.has(k))));
    const others = fs.readdirSync(PLUGINS).filter(f => f.endsWith(".js") && f !== "Skills_Data.js").map(f => fs.readFileSync(path.join(PLUGINS, f), "utf8")).join("\n");
    const unread = [...used].filter(k => !others.includes('"' + k + '"') && !others.includes("'" + k + "'"));
    t.check("every effect key (" + used.size + ") is named by some other plugin (it asks Combat.perk for it) - no skill that does nothing", unread.length === 0, unread);
    const asked = new Set();
    for (const m of others.matchAll(/(?:hasSkill|knowsSkill|skillRank)\(\s*["']([a-z0-9_]+)["']/g)) asked.add(m[1]);
    for (const m of others.matchAll(/["'](?:hasSkill|skillRank)["'],\s*["']([a-z0-9_]+)["']/g)) asked.add(m[1]);
    t.check("every skill the plugins ask by name (" + [...asked].sort().join(", ") + ") is in the trees, the stage-1 ids among them",
        asked.size >= 10 && [...asked].every(id => byId(id)) && ["combo4", "charge", "riposte", "sweep", "execute", "guard", "keen", "acrobat", "thickskin", "secondwind"].every(id => asked.has(id)),
        [...asked].filter(id => !byId(id)));

    // ---- Combat's side: perk, the texts
    fresh({ skills: { m_power: 2, m_master: 1, combo4: true } });
    t.check("Combat.perk sums the ranks: Mocna ręka 2 + Mistrz oręża = +20% melee damage, +5% crit; a stage-1 `true` is rank 1; an effect of no learnt skill 0",
        Math.abs(C.perk("melee.dmg") - 0.2) < 1e-9 && Math.abs(C.perk("melee.crit") - 0.05) < 1e-9 && C.skillRank("combo4") === 1 && C.perk("crop.growth") === 0);
    t.eq("the texts with the values: Mocna ręka rank 1 and 3, Hart ciała 3, Unik mistrza 2 (frames as seconds), Duża konewka 2 (a number), rank 0 reads as rank 1",
        [C.skillText(byId("m_power"), 1), C.skillText(byId("m_power"), 3), C.skillText(byId("d_body"), 3), C.skillText(byId("d_roll"), 2), C.skillText(byId("f_can"), 2), C.skillText(byId("m_power"), 0)],
        ["Obrażenia wręcz +5%.", "Obrażenia wręcz +15%.", "Życie +36.", "Nietykalność w przewrocie dłuższa o 0,10 s.", "Konewka mieści 4 podlania więcej.", "Obrażenia wręcz +5%."]);

    // ---- why not yet, learning, the points
    fresh({ level: 4, sp: 0 });
    const why = [C.skillBlock("nope"), C.skillBlock("sweep"), C.skillBlock("combo4"), C.skillBlock("charge"), C.skillBlock("m_power")];
    t.eq("why not yet: no such skill; Szeroki zamach wants level 20; Płynne kombo and Rozpęd first Mocna ręka (the path before Siła 12); Mocna ręka - no point",
        why, ["Nie ma takiej umiejętności.", "Wymaga poziomu 20.", "Najpierw: Mocna ręka.", "Najpierw: Mocna ręka.", "Brak punktów umiejętności."]);
    let h = fresh({ level: 4, sp: 5, attr: { str: 5 } });
    const steps = [C.learnSkill("m_power"), C.learnSkill("m_power"), C.learnSkill("m_power"), C.skillBlock("m_power"), C.learnSkill("m_power"), C.learnSkill("combo4"),
        C.skillBlock("combo4"), C.skillBlock("charge"), C.skillBlock("m_breath")];
    t.eq("learning: Mocna ręka three times (its top: refused), then Płynne kombo (known: refused), Rozpęd wants Siła 12, Oszczędny cios level 10; 4 points spent",
        steps.concat([h.skills.m_power, h.skills.combo4, h.skillPoints]),
        [true, true, true, "Masz już najwyższy stopień.", false, true, "Już ją znasz.", "Wymaga: Siła 12.", "Wymaga poziomu 10.", 3, 1, 1]);
    h = fresh({ points: 4, attr: { str: 58 } });
    const spend = [C.spendPoints({ con: 5 }), C.spendPoints({ str: 3 }), C.spendPoints({}), C.spendPoints({ str: 2, con: 1 }), h.attr.str, h.attr.con, h.points, C.unspent()];
    t.eq("spending attribute points: not more than there are, not past 60, not nothing; Siła 58 + 2 = 60 and Kondycja +1: 1 point left", spend,
        [false, false, false, true, 60, 6, 1, 1]);
});
