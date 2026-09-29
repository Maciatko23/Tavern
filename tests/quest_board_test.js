// The quest board (QuestBoard.js): seeded notices that make sense for the tier (real items, pay in the tier's band, terms), the
// reputation tiers (reputation and day), the board's cycle every 3 days (what is in hand stays), at most 3 contracts in hand,
// accepting and turning in (the goods leave the bag; gold, experience, reputation, a gift and a special die come), kills counted
// through Hunting.onKill (on the named map only when the notice names one), a wanted animal that comes on its own map at its
// hour (bigger, stronger, its name over it) and counts when killed, a missed term (PO TERMINIE, reputation down), giving up,
// the <Tavern:board> event opening the board, the scene driven by keys (the tutorial, moving, accepting, the turn-in animation),
// the journal's "Zlecenia" tab and the goal window following a contract, a save round trip, an old save (the tavern_evening
// fixture: its $gameSystem._quests, _tavernShift taken over by the core) with a contract turned in after the load, and no errors in
// the console. QuestBoard in its four files: QuestBoard_Data, QuestBoard, QuestBoard_Art, QuestBoard_Scene (the ones js/plugins.js
// does not have yet are put into the page). REGISTERED=1: they are put into the page's plugin list as they will be registered.
// Screenshots: docs/tawerna_zycie/tablica_*.png
//   CDP_PORT=9382 node tests/quest_board_test.js
const kit = require("./lib/kit.js");
const path = require("path");
const SHOTS = path.join(__dirname, "..", "docs", "tawerna_zycie");
const PARTS = ["QuestBoard_Data", "QuestBoard", "QuestBoard_Art", "QuestBoard_Scene"];
// (REGISTERED=1: the parts in $plugins round QuestBoard, as the plugin manager will list them - js/plugins.js itself is not touched)
const REGISTERED = process.env.REGISTERED ? `(function(){
    let real;
    const mk = name => ({ name, status: true, description: "", parameters: {} });
    Object.defineProperty(window, "$plugins", { configurable: true, get() { return real; }, set(v) {
        const list = v.filter(p => !["QuestBoard_Data", "QuestBoard_Art", "QuestBoard_Scene"].includes(p.name)), at = list.findIndex(p => p.name === "QuestBoard");
        list.splice(at + 1, 0, mk("QuestBoard_Art"), mk("QuestBoard_Scene"));
        list.splice(at, 0, mk("QuestBoard_Data"));
        real = list;
    } });
})();` : undefined;

kit.test({ plugins: PARTS, beforeLoad: REGISTERED, bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    const onBoard = "(SceneManager._scene instanceof Scene_QuestBoard && SceneManager._scene._started && !SceneManager.isSceneChanging() && !SceneManager._scene.isBusy())";
    const setDay = (day, hour) => t.eval(`$gameSystem._dayNightDay = ${day}; $gameSystem.setDayNightHour(${hour === undefined ? 12 : hour}); 0`);
    const shot = name => t.shot(path.join(SHOTS, "tablica_" + name + ".png"));
    t.check("QuestBoard.js loads into the page (and Journal.js has the tab / tracker hooks)", t.plugins.QuestBoard !== "failed" && await t.eval("!!window.QuestBoard") && await t.eval("!!(Journal.addTab && Journal.addTrackerSource)"));
    const fam = await t.json(`(function(){ const P = Tawerna.api("QuestBoard_parts") || {}, order = $plugins.map(p => p.name).filter(n => /^QuestBoard/.test(n));
        return { data: !!P.data, art: !!P.art, scene: !!(P.Scene && window.Scene_QuestBoard === P.Scene && QuestBoard.Scene_QuestBoard === P.Scene), order }; })()`);
    t.check("...in its four files: the tables, the pictures and the scene are there" + (REGISTERED ? " (registered: " + fam.order.join(", ") + ")" : ""),
        fam.data && fam.art && fam.scene && PARTS.every(n => t.plugins[n] !== "failed") && (!REGISTERED || fam.order.join() === PARTS.join()), Object.assign(fam, { plugins: t.plugins }));
    // (a story game in grandpa's cottage, whatever data/System.json says)
    t.check("a new game starts", await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true }));
    await t.frames(30);

    // ---------------------------------------------------------------- the data: templates, givers, items
    const tdata = await t.json(`(function(){
        const Q = QuestBoard, bad = [];
        for (const t of Q.TEMPLATES) {
            if (!Q.GIVERS[t.giver]) bad.push(t.id + ": giver");
            for (const r of t.req) {
                if (r.item && !($dataItems[r.item] && $dataItems[r.item].name)) bad.push(t.id + ": item " + r.item);
                if (r.kill && !Q.BEASTS[r.kill]) bad.push(t.id + ": beast " + r.kill);
                if (r.bounty && !Q.BOUNTIES[r.bounty]) bad.push(t.id + ": bounty " + r.bounty);
                if (r.n) for (const v of r.n) if (v && !(v[0] >= 1 && v[1] >= v[0])) bad.push(t.id + ": count " + v);
            }
            if (!t.title.length || !t.text.length) bad.push(t.id + ": words");
            for (const s of t.text) if (s.length > 230) bad.push(t.id + ": text too long " + s.length);
        }
        const types = {};
        for (const t of Q.TEMPLATES) types[t.type] = (types[t.type] || 0) + 1;
        const gifts = Object.values(Q.GIVERS).flatMap(g => g.gift).filter(g => !$dataItems[g[0]]);
        return { n: Q.TEMPLATES.length, bad, types, givers: Object.keys(Q.GIVERS).length, gifts, bounties: Object.keys(Q.BOUNTIES) };
    })()`);
    t.check("every template names real items, animals and givers, sane counts and short texts", tdata.bad.length === 0 && tdata.gifts.length === 0, tdata.bad.slice(0, 5));
    t.check("all kinds of work are there: deliver, craft, gather, hunt, bounty, story (" + tdata.n + " templates, " + tdata.givers + " givers)",
        ["deliver", "craft", "gather", "hunt", "bounty", "story"].every(k => tdata.types[k] > 0) && tdata.n >= 40 && tdata.givers >= 12, tdata.types);

    // ---------------------------------------------------------------- seeded generation, sensible for the tier
    const gen = await t.json(`(function(){
        const Q = QuestBoard, out = { same: false, bad: [], avg: [], urgentMax: 0, bounty: 0, perBoard: [], days: {} };
        const a = Q.generate(4242, { tier: 2, day: 20, count: 6 }), b = Q.generate(4242, { tier: 2, day: 20, count: 6 });
        out.same = JSON.stringify(a) === JSON.stringify(b) && a.length === 6;
        const dayFor = [3, 8, 14, 24, 36];
        for (let t = 0; t <= 4; t++) {
            let sum = 0, k = 0;
            for (let s = 1; s <= 60; s++) {
                const day = dayFor[t] + (s % 20);
                const list = Q.generate(s * 7919 + t, { tier: t, day, count: 6 });
                out.perBoard.push(list.length);
                if (list.filter(n => n.urgent).length > 1) out.bad.push("two urgent");
                if (list.filter(n => n.type === "bounty").length > 1) out.bad.push("two bounties");
                const tpls = new Set(list.map(n => n.tpl));
                if (tpls.size !== list.length) out.bad.push("a template twice");
                if (list.filter(n => n.look.torn).length !== 1) out.bad.push("torn corners " + list.filter(n => n.look.torn).length);
                for (const n of list) {
                    const T = Q.TIERS[n.tier], tpl = Q.TEMPLATES.find(x => x.id === n.tpl);
                    if (n.tier > t || n.tier < Math.max(0, t - 2)) out.bad.push(n.tpl + " tier " + n.tier + " on " + t);
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
        return out;
    })()`);
    t.check("the same seed gives the same notices", gen.same);
    t.check("generated notices are sensible: tier within 2 of the board's, real items, gold/xp/terms inside the tier's band, season and first day kept, one urgent and one bounty at most, one torn corner",
        gen.bad.length === 0, gen.bad.slice(0, 8));
    t.check("the pay grows with the tier (average G per tier " + gen.avg.join(" / ") + "), up to about 120 G", gen.avg.every((v, i) => i === 0 || v > gen.avg[i - 1]) && gen.avg[0] <= 25 && gen.avg[4] >= 55 && gen.urgentMax <= 130, gen);
    t.check("wanted posters appear at the higher tiers", gen.bounty > 0, gen.bounty);

    // ---------------------------------------------------------------- the reputation tiers
    const tiers = await t.json(`(function(){
        const d = QuestBoard.state(), r = [];
        $gameSystem._dayNightDay = 40;
        for (const rep of [0, 19, 20, 39, 40, 59, 60, 79, 80, 100]) { d.rep = rep; r.push(QuestBoard.tier()); }
        d.rep = 95; $gameSystem._dayNightDay = 5; const early = QuestBoard.tierNow();
        $gameSystem._dayNightDay = 12; const mid = QuestBoard.tierNow();
        d.rep = 0; QuestBoard.addRep(250); const capHi = QuestBoard.reputation(); QuestBoard.addRep(-400); const capLo = QuestBoard.reputation();
        return { r, early, mid, capHi, capLo, names: QuestBoard.TIERS.map(t => t.name) };
    })()`);
    t.check("reputation tiers at 0/20/40/60/80: " + tiers.names.join(" > "), JSON.stringify(tiers.r) === JSON.stringify([0, 0, 1, 1, 2, 2, 3, 3, 4, 4]), tiers.r);
    t.check("the day caps the tier (95 reputation: tier 1 on day 5, tier 2 on day 12) and reputation stays in 0-100", tiers.early === 1 && tiers.mid === 2 && tiers.capHi === 100 && tiers.capLo === 0, tiers);

    // ---------------------------------------------------------------- the board, the cycle
    await setDay(10, 12);
    const cyc = await t.json(`(function(){
        const d = QuestBoard.state(); d.rep = 30; d.tutorial = false;
        const board = QuestBoard.refresh(99);
        const slots = board.map(n => n.look.slot);
        return { n: board.length, slots, uniq: new Set(slots).size, cycle: d.cycle, want: QuestBoard.cycleOf(10) };
    })()`);
    t.check("a board has 4-6 notices in different slots", cyc.n >= 4 && cyc.n <= 6 && cyc.uniq === cyc.n && cyc.cycle === cyc.want, cyc);

    // ---------------------------------------------------------------- accepting: at most three in hand
    const acc = await t.json(`(function(){
        const open = QuestBoard.board().filter(n => n.state === "open");
        const r = [];
        for (let i = 0; i < 4 && i < open.length; i++) r.push(QuestBoard.accept(open[i].id));
        const a = QuestBoard.active();
        return { r, active: a.length, due: a[0] ? [a[0].accepted, a[0].days, a[0].due] : null, again: QuestBoard.accept(a[0].id).ok };
    })()`);
    t.check("three contracts can be accepted, the fourth is refused with a reason", acc.active === 3 && acc.r.slice(0, 3).every(x => x.ok) && acc.r[3] && !acc.r[3].ok && /3 zlecenia/.test(acc.r[3].why), acc);
    t.check("an accepted contract gets its term: accepted day + days - 1, and cannot be taken twice", acc.due && acc.due[2] === acc.due[0] + acc.due[1] - 1 && acc.again === false, acc.due);
    // the cycle: three days on, new notices; the contracts in hand stay
    const before = await t.json("QuestBoard.active().map(n => n.id)");
    await setDay(13, 9);
    await t.frames(40);
    const after = await t.json("({ active: QuestBoard.active().map(n => n.id), board: QuestBoard.board().map(n => [n.id, n.state]), cycle: QuestBoard.state().cycle, notice: $gameTemp._lastTopNotice })");
    t.check("three days later the board has new notices and the contracts in hand stay pinned",
        JSON.stringify(after.active) === JSON.stringify(before) && after.cycle === 4 && after.board.filter(x => x[1] === "open").length >= 2 && after.board.every(x => x[1] === "open" || before.includes(x[0])), after);
    // giving up one: reputation -3
    const ab = await t.json(`(function(){ const d = QuestBoard.state(), r0 = d.rep, n = QuestBoard.active()[2]; const loss = QuestBoard.abandon(n.id); return { r0, r1: d.rep, loss, gone: !QuestBoard.find(n.id), stats: d.stats.abandoned, urgent: n.urgent }; })()`);
    t.check("giving up a contract takes it off the board and costs reputation (3, 5 if urgent)", ab.gone && ab.r0 - ab.r1 === ab.loss && ab.loss === (ab.urgent ? 5 : 3) && ab.stats === 1, ab);

    // ---------------------------------------------------------------- turning in: the goods go, the pay comes
    const ti = await t.json(`(function(){
        const d = QuestBoard.state(), got = [];
        QuestBoard.onComplete((n, res) => got.push(n.id));
        const bus = []; Tawerna.on("questDone", e => bus.push([e.id, e.kind, e.gold, e.title]), { owner: "QuestBoardTest", once: true });
        window.TavernDice = window.TavernDice || { giveDie: k => { (window.__dice = window.__dice || []).push(k); return true; }, DIE_TYPES: { wdowa: { name: "Kość wdowy" }, grusza: { name: "Kość z gruszy" }, szczesciarz: { name: "Kość szczęściarza" }, krucze: { name: "Kość z Kruczych Skał" } } };
        for (const n of QuestBoard.active()) QuestBoard.abandon(n.id);
        d.rep = 30;
        const n = QuestBoard.post("hides", 1, 555);
        n.gift = [152, 2];
        QuestBoard.accept(n.id);
        const it = $dataItems[96];
        $gameParty.loseItem(it, 99);
        const notYet = QuestBoard.turnIn(n.id);
        $gameParty.gainItem(it, n.req[0].n + 2);
        const g0 = $gameParty.gold(), xp0 = Combat.hero().xp + Combat.hero().level * 100000, rep0 = d.rep, band0 = $gameParty.numItems($dataItems[152]);
        const notes0 = Journal.data().notes.length;
        const res = QuestBoard.turnIn(n.id);
        return { notYet, res, n: n.req[0].n, left: $gameParty.numItems(it), gold: $gameParty.gold() - g0, xp: Combat.hero().xp + Combat.hero().level * 100000 - xp0,
            rep: d.rep - rep0, gift: $gameParty.numItems($dataItems[152]) - band0, state: n.state, got, hist: d.history[0].title === n.title && d.history[0].state === "done",
            note: Journal.data().notes.length - notes0, noteTitle: Journal.data().notes.slice(-1)[0].title, expect: { gold: n.gold, xp: n.xp, rep: n.rep },
            bus, quest: [n.id, n.type, n.gold, n.title] };
    })()`);
    t.check("turning in before the goods are there does nothing", ti.notYet === null);
    t.check("turning in takes the goods from the bag (the rest stays)", ti.left === 2, ti);
    // (Combat adds 5 for the first time an item comes to the bag - the gift may be one)
    t.check("the pay: gold, experience (Combat), reputation and the gift", ti.gold === ti.expect.gold && ti.res.xp === ti.expect.xp && ti.xp >= ti.expect.xp && ti.xp <= ti.expect.xp + 10 && ti.rep === ti.expect.rep && ti.gift === 2, ti);
    t.check("done: the notice is WYKONANE, the history keeps it, a journal note, onComplete listeners hear it", ti.state === "done" && ti.hist && ti.note === 1 && /Zlecenie: /.test(ti.noteTitle) && ti.got.length === 1, ti);
    t.check("...and the Tawerna bus hears it once: 'questDone' { id, kind, gold, title }", ti.bus.length === 1 && JSON.stringify(ti.bus[0]) === JSON.stringify(ti.quest), { bus: ti.bus, quest: ti.quest });

    // Feliks (the manor) may put the pay straight onto grandpa's debt
    const fel = await t.json(`(function(){
        const n = QuestBoard.post("quills", 1, 808); QuestBoard.accept(n.id);
        $gameParty.gainItem($dataItems[146], n.req[0].n);
        const g0 = $gameParty.gold(), left0 = Story.left();
        const r = QuestBoard.turnIn(n.id, { debt: true });
        return { toDebt: r.toDebt, gold: $gameParty.gold() - g0, paid: left0 - Story.left(), pay: n.gold, giver: n.giver };
    })()`);
    t.check("Feliks's pay can go straight onto grandpa's debt (Story.pay), the purse stays as it was", fel.giver === "feliks" && fel.toDebt === fel.pay && fel.paid === fel.pay && fel.gold === 0, fel);

    // ---------------------------------------------------------------- kills counted through Hunting.onKill
    await t.go(22, 20, 15, 2);
    await setDay(14, 12);
    const kills = await t.json(`(function(){
        const any = QuestBoard.post("wolves", 2, 31), named = QuestBoard.post("wolves_map", 2, 32);
        QuestBoard.accept(any.id); QuestBoard.accept(named.id);
        named.req[0].map = 21;   // (elsewhere than here, Polna droga)
        const kill = kind => { const p = $gamePlayer, a = Hunting.spawn(kind, p.x + 3, p.y); Hunting.kill(a); };
        kill("wolf"); kill("rabbit");
        const said = ($gameTemp._topNotices || []).map(n => n.text).concat([$gameTemp._lastTopNotice]).filter(Boolean);   // (HomeDecor's keepsake notice may come last)
        const r1 = [any.req[0].got, named.req[0].got, said.find(x => /Wilki/.test(x)) || said.join(" | ")];
        named.req[0].map = 22;
        kill("wolf");
        return { r1, anyGot: any.req[0].got, namedGot: named.req[0].got, n: any.req[0].n, ids: [any.id, named.id] };
    })()`);
    t.check("a wolf killed anywhere counts for 'Wilki pod wsią', a rabbit does not, a wolf on another map does not count for a named place",
        kills.r1[0] === 1 && kills.r1[1] === 0 && /Wilki/.test(kills.r1[2] || ""), kills.r1);
    t.check("on the named map it counts", kills.anyGot === 2 && kills.namedGot === 1, kills);
    const killDone = await t.json(`(function(){ const n = QuestBoard.find("${kills.ids[0]}"); while (n.req[0].got < n.req[0].n) { const a = Hunting.spawn("wolf", $gamePlayer.x + 3, $gamePlayer.y); Hunting.kill(a); } return { ready: QuestBoard.isReady(n.id), said: $gameTemp._lastTopNotice }; })()`);
    t.check("the last kill makes it ready and says so at the top", killDone.ready && /Zlecenie gotowe/.test(killDone.said), killDone);
    await t.eval(`(function(){ for (const id of ${JSON.stringify(kills.ids)}) QuestBoard.abandon(id); return 0; })()`);

    // ---------------------------------------------------------------- a wanted animal: Trójłap on Polna droga, at night
    await setDay(14, 22);
    const bid = await t.eval(`(function(){ const d = QuestBoard.state(); d.rep = 60; const n = QuestBoard.post("b_trojlap", 3, 77); QuestBoard.accept(n.id); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); SceneManager._scene._qbT = 0; return n.id; })()`);
    const came = await t.until(`Hunting.animals.some(a => a._qbBounty === "${bid}")`, 25);
    const beast = came ? await t.json(`(function(){ const a = Hunting.animals.find(x => x._qbBounty === "${bid}"); const plain = Hunting.SPECIES.wolf.hp; return { name: a._qbName, kind: a.kind(), hp: a._maxHp, plain, lv: a._level, scale: a._qbScale, pack: a._pack ? a._pack.members.length : 0, notice: $gameTemp._lastTopNotice }; })()`) : null;
    t.check("the wanted wolf comes on its map at night: named, stronger, bigger, with a companion, and a notice says so",
        came && beast.name === "Trójłap" && beast.kind === "wolf" && beast.hp >= beast.plain * 1.8 && beast.scale > 1.1 && beast.pack >= 2 && /Trójłap/.test(beast.notice), beast);
    await t.frames(10);
    const label = await t.eval(`(function(){ const a = Hunting.animals.find(x => x._qbBounty === "${bid}"); return !!(a && a._sprite && a._sprite._qbLabel && a._sprite._qbLabel.visible); })()`);
    t.check("its name hangs over it on the map", label);
    await t.eval(`(function(){ const a = Hunting.animals.find(x => x._qbBounty === "${bid}"); if (a) { $gamePlayer.locate(Math.max(1, a.x - 3), a.y); $gamePlayer.setDirection(6); } return 0; })()`);
    await t.frames(6);
    await t.shot(path.join(SHOTS, "tablica_poszukiwany_na_mapie.png"));
    const bk = await t.json(`(function(){ const a = Hunting.animals.find(x => x._qbBounty === "${bid}"); const other = Hunting.animals.find(x => !x._qbBounty && x.kind() === "wolf"); if (other) Hunting.kill(other); const n = QuestBoard.find("${bid}"); const g0 = n.req[0].got; Hunting.kill(a); return { g0, g1: n.req[0].got, ready: QuestBoard.isReady(n.id) }; })()`);
    t.check("another wolf of its pack does not count; killing the wanted one does", bk.g0 === 0 && bk.g1 === 1 && bk.ready, bk);
    // (the real TavernDice (registered): the die shows among the hero's own; else the stub above records it)
    const dice = await t.json(`(function(){ window.__dice = []; const real = !!(window.TavernDice && TavernDice.dice);
        const cnt = () => { const o = real ? TavernDice.dice().owned.find(d => d.key === "grusza") : null; return o ? o.count : 0; };
        const c0 = cnt(); const r = QuestBoard.turnIn("${bid}");
        return { die: r && r.die, got: real ? (cnt() > c0 ? ["grusza"] : []) : window.__dice, gold: r && r.gold, real }; })()`);
    t.check("the bounty pays 85-120 G and gives its special die (TavernDice.giveDie)", dice.die === "grusza" && JSON.stringify(dice.got) === JSON.stringify(["grusza"]) && dice.gold >= 85 && dice.gold <= 120, dice);

    // ---------------------------------------------------------------- a missed term
    await t.go(19, 5, 6, 2);
    await setDay(20, 10);
    const due = await t.json(`(function(){ const d = QuestBoard.state(); d.rep = 50; const n = QuestBoard.post("stones", 0, 9); n.urgent = false; QuestBoard.accept(n.id); window.__due = n.id; return { id: n.id, due: n.due, rep: d.rep }; })()`);
    await setDay(due.due + 1, 7);
    await t.frames(40);
    const failed = await t.json(`(function(){ const d = QuestBoard.state(), n = QuestBoard.find(window.__due), h = d.history.find(x => x.id === window.__due); return { state: n ? n.state : h && h.state, rep: d.rep, failed: d.stats.failed, said: window.__kit.tops.filter(t => /przepadło/.test(t)).pop() || "" }; })()`);
    t.check("the day after the term the contract fails (PO TERMINIE), reputation -6 and a notice says so",
        failed.state === "failed" && due.rep - failed.rep === 6 && failed.failed === 1 && /przepadło/.test(failed.said) && /-6/.test(failed.said), failed);

    // ---------------------------------------------------------------- the <Tavern:board> event opens the board
    const evInfo = await t.json(`(function(){
        const id = 950, p = $gamePlayer, x = p.x, y = p.y - 1;
        const page = { conditions: { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false, switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 },
            directionFix: true, image: { tileId: 0, characterName: "", direction: 2, pattern: 0, characterIndex: 0 }, list: [{ code: 108, indent: 0, parameters: ["<Tavern:board>"] }, { code: 0, indent: 0, parameters: [] }],
            moveFrequency: 3, moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0, priorityType: 1, stepAnime: false, through: false, trigger: 0, walkAnime: false };
        const data = { id, name: "Tablica zleceń (test)", note: "", pages: [page], x, y }, mapId = $gameMap.mapId();
        const put = m => { for (let i = m.events.length; i < id; i++) m.events[i] = null; m.events[id] = data; };
        put($dataMap);
        // (the map's data is loaded anew after every scene on top of the map: like a real event it has to be there again)
        const _onLoad = DataManager.onLoad;
        DataManager.onLoad = function(o) { _onLoad.call(this, o); if (o === $dataMap && $gameMap && $gameMap.mapId() === mapId) put(o); };
        const e = new Game_Event($gameMap.mapId(), id);
        $gameMap._events[id] = e;
        const set = SceneManager._scene._spriteset, spr = new Sprite_Character(e);
        set._characterSprites.push(spr); set._tilemap.addChild(spr);
        p.setDirection(8);
        return { tagged: QuestBoard.isBoardEvent(e), list: e.list().map(c => c.code) };
    })()`);
    t.check("an event with a page-1 comment <Tavern:board> is recognised", evInfo.tagged && JSON.stringify(evInfo.list) === JSON.stringify([355, 0]), evInfo);
    await t.frames(10);
    const mark = await t.eval(`(function(){ const e = $gameMap.event(950), s = SceneManager._scene._spriteset._characterSprites.find(x => x._character === e); return s && s._qbMark ? s._qbMark._kind : null; })()`);
    t.check("a small marker bobs over the board while it has notices not seen yet", mark === "new", mark);
    await t.press("ok");
    t.check("the action button in front of it opens the board", await t.until(onBoard, 15));

    // ---------------------------------------------------------------- the scene: tutorial, moving, accepting, turning in
    await t.eval(`(function(){ $gameParty.gainGold(300); return 0; })()`);
    await t.frames(40);
    t.check("the first visit starts with Borgar's explanation", await t.eval("SceneManager._scene.mode === 'tutorial' && SceneManager._scene._overlay.visible"));
    await t.shot(path.join(SHOTS, "tablica_samouczek.png"));
    await t.press("ok");
    await t.press("ok");
    t.check("two pages of it, then the board is free", await t.eval("SceneManager._scene.mode === 'browse' && QuestBoard.state().tutorial === true"));
    await t.eval("SceneManager.pop(); 0");
    await t.until(t.onMap(19), 15);
    // a fresh, rich board for the pictures (day 30, reputation 64: the upper tiers, a wanted poster)
    await setDay(30, 18);
    await t.eval(`(function(){
        const d = QuestBoard.state(); d.rep = 64;
        let board, s = 3100;
        do { board = QuestBoard.refresh(s++); } while ((board.length < 6 || !board.some(n => n.type === "bounty") || !board.some(n => n.urgent) || !board.some(n => String(n.look.pin).startsWith("seal"))) && s < 3900);
        window.__boardSeed = s - 1;
        return 0; })()`);
    const fresh = await t.json("QuestBoard.board().map(n => ({ id: n.id, title: n.title, tpl: n.tpl, type: n.type, urgent: n.urgent, items: n.req.every(q => q.k === 'item'), req: n.req.map(q => [q.k, q.id || q.kind, q.n]) }))");
    const deliver = fresh.find(n => n.items && n.type !== "bounty" && !n.urgent) || fresh.find(n => n.items);
    await t.eval(`(function(){ const n = QuestBoard.find("${deliver.id}"); for (const q of n.req) $gameParty.gainItem($dataItems[q.id], q.n); return 0; })()`);
    await t.eval("QuestBoard.open(); 0");
    t.check("the board opens again with QuestBoard.open()", await t.until(onBoard, 15));
    await t.frames(60);
    const sc = await t.json("({ cards: SceneManager._scene._cards.length, focus: SceneManager._scene.focus && SceneManager._scene.focus.n ? SceneManager._scene.focus.n.id : 'rules', mode: SceneManager._scene.mode })");
    t.check("all notices are on it as cards", sc.cards === fresh.length && sc.mode === "browse", sc);
    await shot("plansza");
    // the arrows move between the cards; the focused one lifts and straightens
    await t.press("right");
    await t.frames(20);
    const mv = await t.json("(function(){ const s = SceneManager._scene, f = s.focus; return { id: f.n ? f.n.id : 'rules', lift: f.lift, rot: f.rotation, base: f.baseRot }; })()");
    t.check("an arrow moves the focus; the card lifts and straightens", mv.id !== sc.focus && mv.lift > 0.9 && Math.abs(mv.rot) < Math.abs(mv.base) * 0.2 + 0.001, mv);
    // the mouse over a card focuses it too
    const target = fresh.find(n => n.type === "bounty") || fresh[0];
    await t.eval(`(function(){ const s = SceneManager._scene, c = s._cards.find(x => x.n.id === "${target.id}"); TouchInput._x = Math.round(c.baseX); TouchInput._y = Math.round(c.baseY); return 0; })()`);
    await t.frames(24);
    t.check("the mouse over a card focuses it", await t.eval(`SceneManager._scene.focus && SceneManager._scene.focus.n && SceneManager._scene.focus.n.id === "${target.id}"`));
    await shot("szczegoly");
    // O on the delivery notice: the buttons, "Przyjmij zlecenie"
    await t.eval(`(function(){ const s = SceneManager._scene; s.setFocus(s._cards.find(x => x.n.id === "${deliver.id}")); return 0; })()`);
    await t.frames(16);
    await t.press("ok");
    const ch = await t.json("({ mode: SceneManager._scene.mode, labels: SceneManager._scene.choices.map(c => c.label), i: SceneManager._scene.choiceIndex })");
    t.check("O opens the choices: Przyjmij zlecenie / Zostaw", ch.mode === "choice" && ch.labels[0] === "Przyjmij zlecenie" && ch.labels[1] === "Zostaw" && ch.i === 0, ch);
    await t.press("ok");
    await t.frames(24);
    const st = await t.json(`({ state: QuestBoard.find("${deliver.id}").state, stamp: SceneManager._scene._cards.find(x => x.n.id === "${deliver.id}")._stampKind, mode: SceneManager._scene.mode })`);
    t.check("accepted: the PRZYJĘTE stamp comes down on the card", st.state === "active" && st.stamp === "active" && st.mode === "browse", st);
    await shot("przyjete");
    // it is ready (the goods are in the bag): turn it in
    const g0 = await t.eval("$gameParty.gold()");
    await t.press("ok");
    const ch2 = await t.json("({ labels: SceneManager._scene.choices.map(c => c.label + (c.enabled === false ? '(x)' : '')) })");
    t.check("on an accepted, ready contract: Oddaj zlecenie / Śledź / Porzuć", /^Oddaj/.test(ch2.labels[0]) && !/\(x\)/.test(ch2.labels[0]) && ch2.labels.some(l => /Śledź/.test(l)) && ch2.labels.some(l => /Porzuć/.test(l)), ch2);
    await t.press("ok");
    await t.frames(56);
    const an = await t.json("({ mode: SceneManager._scene.mode, coins: (SceneManager._scene._flyers || []).filter(f => f.coin).length })");
    t.check("turning in plays the reward: coins fly to the purse", an.mode === "anim" && an.coins > 0, an);
    await t.frames(8);
    await shot("nagroda");
    await t.until("SceneManager._scene.mode === 'browse'", 12);
    const done = await t.json(`({ state: QuestBoard.find("${deliver.id}").state, stamp: SceneManager._scene._cards.find(x => x.n.id === "${deliver.id}")._stampKind, purse: Math.round(SceneManager._scene.purseShown), gold: $gameParty.gold(), got: $gameParty.gold() - ${g0} })`);
    t.check("then WYKONANE, and the purse on the slate shows the new gold", done.state === "done" && done.stamp === "done" && done.purse === done.gold && done.got === await t.eval(`QuestBoard.find("${deliver.id}").gold`), done);
    await shot("wykonane");
    // the rules tag under the sign
    await t.eval("(function(){ const s = SceneManager._scene; s.setFocus(s._tag); return 0; })()");
    await t.frames(16);
    t.check("the rules tag has its own page", await t.eval("SceneManager._scene.choiceList()[0].id === 'close'"));
    await shot("zasady");
    // accept one more and follow it; P leaves
    const second = fresh.find(n => n.id !== deliver.id && n.type !== "bounty");
    await t.eval(`(function(){ QuestBoard.accept("${second.id}"); QuestBoard.track("${second.id}"); return 0; })()`);
    await t.press("cancel");
    t.check("P leaves the board", await t.until(t.onMap(19), 15));
    await t.frames(20);
    await t.shot(path.join(SHOTS, "tablica_okienko_celu.png"));

    // ---------------------------------------------------------------- the journal and the goal window
    const trk = await t.json("(function(){ const t = SceneManager._scene._goalTracker; return t ? { key: t._key, vis: t.visible } : null; })()");
    t.check("the goal window follows the chosen contract (ZLECENIE)", trk && /^x\|/.test(trk.key) && trk.key.indexOf(second.id + "|") > 0, trk);
    await t.eval("SceneManager.push(Journal.Scene_Journal); 0");
    await t.until("SceneManager._scene instanceof Journal.Scene_Journal && SceneManager._scene._started", 15);
    await t.frames(20);
    const jr = await t.json(`(function(){
        const s = SceneManager._scene, names = s._tabs._list.map(c => c.name), tab = names.indexOf("Zlecenia");
        s._tab = tab; s.showTab();
        const items = s._list._items.map(i => i.label), first = s._list._items[0];
        const ops = s._detail._ops.map(o => o.k + ":" + (o.text || o.name || ""));
        return { names, tab, items, pin: first && first.mark, ops, legend: Journal.itemsForTab(tab).length };
    })()`);
    t.check("the journal has a 'Zlecenia' tab listing the contract in hand and the finished ones", jr.tab >= 0 && jr.items.includes(second.title) && jr.items.length >= 3, jr);
    t.check("its page shows what is needed (have/need), the pay and the term", jr.ops.some(o => /^h:Potrzeba/.test(o)) && jr.ops.some(o => /^cost:/.test(o)) && jr.ops.some(o => /^h:Nagroda/.test(o)), jr.ops);
    await t.frames(10);
    await t.shot(path.join(SHOTS, "tablica_dziennik.png"));
    await t.eval("(function(){ const s = SceneManager._scene; s._list.select(0); s.onListOk(); return 0; })()");
    t.check("OK on it in the journal stops following it", await t.eval("QuestBoard.state().track === null"));
    await t.eval("SceneManager.pop(); 0");
    await t.until(t.onMap(19), 15);

    // ---------------------------------------------------------------- save round trip
    const rt = await t.json(`(function(){
        const before = JSON.stringify($gameSystem._quests);
        const contents = DataManager.makeSaveContents(), json = JsonEx.stringify(contents);
        $gameSystem._quests = null;
        DataManager.extractSaveContents(JsonEx.parse(json));
        const after = JSON.stringify($gameSystem._quests);
        return { same: before === after, size: json.length, active: QuestBoard.active().length, core: $gameSystem._tw.quests === $gameSystem._quests,
            hidden: !Object.keys($gameSystem).includes("_quests") && !/"_quests"/.test(json) };
    })()`);
    t.check("the whole state is plain data and comes back the same from a save", rt.same && rt.active >= 1, rt);
    t.check("...kept by the core in $gameSystem._tw.quests (the old key _quests reads the same object and is not saved twice)", rt.core && rt.hidden, rt);

    // ---------------------------------------------------------------- an old save: the tavern_evening fixture (made by the game before the core)
    t.check("the tavern_evening fixture (an older save with $gameSystem._quests) loads", await t.loadFixture("tavern_evening", { quiet: true }));
    const old = await t.json(`(function(){ const d = QuestBoard.state();
        return { rep: QuestBoard.reputation(), core: $gameSystem._tw.quests === d, alias: $gameSystem._quests === d, cycle: d.cycle, board: d.board.length,
            shifts: TavernShift.stats().done, shiftCore: !!($gameSystem._tw.tavernShift && $gameSystem._tw.tavernShift.done === 2), map: $gameMap.mapId() }; })()`);
    t.check("...its contracts are taken over by the core: reputation 60, the board; and TavernShift's shifts done (2) in $gameSystem._tw.tavernShift",
        old.rep === 60 && old.core && old.alias && old.board > 0 && old.shifts === 2 && old.shiftCore, old);
    const late = await t.json(`(function(){
        const n = QuestBoard.post("hides", 1, 555), g0 = $gameParty.gold(), it = $dataItems[96];
        QuestBoard.accept(n.id);
        $gameParty.gainItem(it, n.req[0].n);
        const res = QuestBoard.turnIn(n.id);
        return { res: !!res, gold: $gameParty.gold() - g0, pay: n.gold, state: n.state, rep: QuestBoard.reputation(), left: $gameParty.numItems(it) };
    })()`);
    t.check("...and a contract can be turned in after the load (the goods go, the pay comes, reputation up)", late.res && late.gold === late.pay && late.state === "done" && late.rep > 60 && late.left === 0, late);
});
