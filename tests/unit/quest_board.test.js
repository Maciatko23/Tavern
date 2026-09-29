// QuestBoard.js without the game: the templates (real items, beasts, givers, sane counts, short texts), seeded generation (the
// same seed - the same notices; tier, pay, experience, term, season and first day inside the rules; one urgent, one bounty, one
// torn corner at most), the pay growing with the tier, the reputation tiers and the day cap, the board's cycle, the <Tavern:board>
// tag read through the core as the old expression read it (every event of every map).
// ($dataItems from data/Items.json; the core, Farming (the seasons) and Hunting (the hunts are possible) loaded as in the game;
// QuestBoard in its four files: QuestBoard_Data, QuestBoard, QuestBoard_Art, QuestBoard_Scene.)
const fs = require("fs");
const path = require("path");
const unit = require("../lib/unit.js");

unit.test(t => {
    const $dataItems = unit.data("Items");
    const sys = { _quests: null, _dayNightDay: 1, dayNightDay() { return this._dayNightDay; } };
    const w = unit.load(["TawernaCore", "TawernaUI", "Farming_Data", "Farming", "Hunting", "QuestBoard_Data", "QuestBoard", "QuestBoard_Art", "QuestBoard_Scene"],
        { globals: { $dataItems, $gameSystem: sys } });
    const Q = w.QuestBoard, Farming = w.Farming, parts = w.Tawerna.api("QuestBoard_parts") || {};
    t.check("QuestBoard loads in its four files (the tables, the pictures, the scene)", !!(parts.data && parts.core && parts.art && parts.Scene && Q.Scene_QuestBoard === parts.Scene),
        Object.keys(parts));

    // ---- the templates
    const bad = [];
    for (const tpl of Q.TEMPLATES) {
        if (!Q.GIVERS[tpl.giver]) bad.push(tpl.id + ": giver");
        for (const r of tpl.req) {
            if (r.item && !($dataItems[r.item] && $dataItems[r.item].name)) bad.push(tpl.id + ": item " + r.item);
            if (r.kill && !Q.BEASTS[r.kill]) bad.push(tpl.id + ": beast " + r.kill);
            if (r.bounty && !Q.BOUNTIES[r.bounty]) bad.push(tpl.id + ": bounty " + r.bounty);
            if (r.n) for (const v of r.n) if (v && !(v[0] >= 1 && v[1] >= v[0])) bad.push(tpl.id + ": count " + v);
        }
        if (!tpl.title.length || !tpl.text.length) bad.push(tpl.id + ": words");
        for (const s of tpl.text) if (s.length > 230) bad.push(tpl.id + ": text too long " + s.length);
    }
    const gifts = Object.values(Q.GIVERS).flatMap(g => g.gift).filter(g => !$dataItems[g[0]]);
    t.check("every template names real items, animals and givers, sane counts and short texts; every gift is a real item", bad.length === 0 && gifts.length === 0, bad.slice(0, 5));
    const types = {};
    for (const tpl of Q.TEMPLATES) types[tpl.type] = (types[tpl.type] || 0) + 1;
    t.check("all kinds of work are there: deliver, craft, gather, hunt, bounty, story (" + Q.TEMPLATES.length + " templates, " + Object.keys(Q.GIVERS).length + " givers)",
        ["deliver", "craft", "gather", "hunt", "bounty", "story"].every(k => types[k] > 0) && Q.TEMPLATES.length >= 40 && Object.keys(Q.GIVERS).length >= 12, types);

    // ---- seeded generation
    const a = Q.generate(4242, { tier: 2, day: 20, count: 6 }), b = Q.generate(4242, { tier: 2, day: 20, count: 6 });
    t.check("the same seed gives the same notices (6 of them)", JSON.stringify(a) === JSON.stringify(b) && a.length === 6);
    t.check("another seed gives other notices", JSON.stringify(Q.generate(4243, { tier: 2, day: 20, count: 6 })) !== JSON.stringify(a));
    const out = { bad: [], avg: [], urgentMax: 0, bounty: 0 }, dayFor = [3, 8, 14, 24, 36];
    for (let tier = 0; tier <= 4; tier++) {
        let sum = 0, k = 0;
        for (let s = 1; s <= 60; s++) {
            const day = dayFor[tier] + (s % 20);
            const list = Q.generate(s * 7919 + tier, { tier, day, count: 6 });
            if (list.filter(n => n.urgent).length > 1) out.bad.push("two urgent");
            if (list.filter(n => n.type === "bounty").length > 1) out.bad.push("two bounties");
            if (new Set(list.map(n => n.tpl)).size !== list.length) out.bad.push("a template twice");
            if (list.filter(n => n.look.torn).length !== 1) out.bad.push("torn corners " + list.filter(n => n.look.torn).length);
            for (const n of list) {
                const T = Q.TIERS[n.tier], tpl = Q.TEMPLATES.find(x => x.id === n.tpl);
                if (n.tier > tier || n.tier < Math.max(0, tier - 2)) out.bad.push(n.tpl + " tier " + n.tier + " on " + tier);
                for (const q of n.req) {
                    if (q.k === "item" && !($dataItems[q.id] && q.n >= 1)) out.bad.push(n.tpl + " item " + q.id);
                    if (q.k !== "item" && !(q.n >= 1)) out.bad.push(n.tpl + " count");
                }
                if (n.type === "bounty") {
                    out.bounty++;
                    if (n.gold < 85 || n.gold > 120) out.bad.push("bounty gold " + n.gold);
                    if (n.days !== 7) out.bad.push("bounty days " + n.days);
                } else {
                    const hi = n.urgent ? Math.round(T.gold[1] * 1.25 / 5) * 5 + 5 : T.gold[1];
                    if (n.gold < T.gold[0] || n.gold > hi) out.bad.push(n.tpl + " gold " + n.gold + " tier " + n.tier + (n.urgent ? " urgent" : ""));
                    if (n.xp < T.xp[0] - 5 || n.xp > T.xp[1] + 5) out.bad.push(n.tpl + " xp " + n.xp);
                    const dd = n.urgent ? [2, 3] : T.days;
                    if (n.days < dd[0] || n.days > dd[1]) out.bad.push(n.tpl + " days " + n.days);
                    if (n.urgent) out.urgentMax = Math.max(out.urgentMax, n.gold);
                }
                if (tpl.from && day < tpl.from) out.bad.push(n.tpl + " before day " + tpl.from + " (" + day + ")");
                if (tpl.seasons && !tpl.seasons.includes(Farming.seasonIndex(day))) out.bad.push(n.tpl + " out of season on day " + day);
                if (!(n.rep > 0)) out.bad.push(n.tpl + " rep");
                sum += n.gold; k++;
            }
        }
        out.avg.push(Math.round(sum / Math.max(1, k)));
    }
    t.check("300 boards: tier within 2 of the board's, real items, gold / xp / term inside the tier's band, season and first day kept, one urgent and one bounty at most, one torn corner",
        out.bad.length === 0, out.bad.slice(0, 8));
    t.check("the pay grows with the tier (average G per tier " + out.avg.join(" / ") + "), up to about 120 G",
        out.avg.every((v, i) => i === 0 || v > out.avg[i - 1]) && out.avg[0] <= 25 && out.avg[4] >= 55 && out.urgentMax <= 130, out);
    t.check("wanted posters appear at the higher tiers", out.bounty > 0, out.bounty);

    // ---- the reputation tiers (the state in a fake $gameSystem)
    const d = Q.state();
    sys._dayNightDay = 40;
    const r = [];
    for (const rep of [0, 19, 20, 39, 40, 59, 60, 79, 80, 100]) { d.rep = rep; r.push(Q.tier()); }
    t.eq("reputation tiers at 0/20/40/60/80: " + Q.TIERS.map(x => x.name).join(" > "), r, [0, 0, 1, 1, 2, 2, 3, 3, 4, 4]);
    d.rep = 95; sys._dayNightDay = 5; const early = Q.tierNow();
    sys._dayNightDay = 12; const mid = Q.tierNow();
    d.rep = 0; Q.addRep(250); const hi = Q.reputation(); Q.addRep(-400); const lo = Q.reputation();
    t.eq("the day caps the tier (95 reputation: tier 1 on day 5, tier 2 on day 12); reputation stays in 0-100", [early, mid, hi, lo], [1, 2, 100, 0]);

    // ---- the board's cycle: new notices every REFRESH_DAYS days
    t.eq("the cycle: days 1-3 -> 0, 4-6 -> 1, day 13 -> 4", [1, 3, 4, 6, 13].map(day => Q.cycleOf(day)), [0, 0, 1, 1, 4]);
    sys._dayNightDay = 10; d.rep = 30;
    const board = Q.refresh(99), slots = board.map(n => n.look.slot);
    t.check("a board has 4-6 notices in different slots", board.length >= 4 && board.length <= 6 && new Set(slots).size === board.length && d.cycle === Q.cycleOf(10), { n: board.length, slots });
    t.check("the state lives in the core ($gameSystem._tw.quests); the old key _quests reads the same object", sys._tw && sys._tw.quests === d && sys._quests === d);

    // ---- <Tavern:board> (the note or page 1's comments): the core's tags against the old expression, on every event of every map
    const OLD = /<Tavern:\s*board\s*>/i, comments = p => (p && p.list || []).filter(c => c.code === 108 || c.code === 408).map(c => String(c.parameters[0] || ""));
    const DATA = path.join(__dirname, "..", "..", "data"), diff = [];
    let boards = 0, events = 0;
    for (const f of fs.readdirSync(DATA).filter(n => /^Map\d+\.json$/.test(n))) {
        for (const ev of JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8")).events || []) {
            if (!ev) continue;
            events++;
            const old = OLD.test(ev.note || "") || comments(ev.pages && ev.pages[0]).some(c => OLD.test(c)), now = Q.isBoardEvent({ event: () => ev });
            if (old) boards++;
            if (old !== now) diff.push(f + " " + ev.id);
        }
    }
    t.check("<Tavern:board> read through the core as before on all " + events + " events of the maps (" + boards + " board)", diff.length === 0 && boards >= 1, diff.slice(0, 5));
    const fake = (note, lines) => ({ event: () => ({ note, pages: [{ list: lines.map(l => ({ code: 108, parameters: [l] })) }, { list: [{ code: 108, parameters: ["<Tavern:board>"] }] }] }) });
    t.eq("...and the odd ones: spaces and case count, another <Tavern:...> does not, page 2 does not",
        [fake("", ["<Tavern: Board >"]), fake("<TAVERN:board>", []), fake("", ["<Tavern:boards>"]), fake("", ["<Tavern:meal>", "<Tavern:board>"]), fake("", [])].map(e => Q.isBoardEvent(e)),
        [true, true, false, true, false]);
});
