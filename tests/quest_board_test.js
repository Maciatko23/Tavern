// The quest board (QuestBoard.js): seeded notices that make sense for the tier (real items, pay in the tier's band, terms), the
// reputation tiers (reputation and day), the board's cycle every 3 days (what is in hand stays), at most 3 contracts in hand,
// accepting and turning in (the goods leave the bag; gold, experience, reputation, a gift and a special die come), kills counted
// through Hunting.onKill (on the named map only when the notice names one), a wanted animal that comes on its own map at its
// hour (bigger, stronger, its name over it) and counts when killed, a missed term (PO TERMINIE, reputation down), giving up,
// the <Tavern:board> event opening the board, the scene driven by keys (the tutorial, moving, accepting, the turn-in animation),
// the journal's "Zlecenia" tab and the goal window following a contract, a save round trip, and no errors in the console.
// (Loads QuestBoard.js into the page when js/plugins.js does not have it.) Screenshots: docs/tawerna_zycie/tablica_*.png
//   CDP_PORT=9382 node tests/quest_board_test.js
const { launch, sleep } = require("./cdp.js");
const fs = require("fs");
const path = require("path");
const SHOTS = path.join(__dirname, "..", "docs", "tawerna_zycie");

(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 30000))]);
    const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
    const results = [];
    const check = (name, ok, info) => { results.push(!!ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
    const until = async (cond, secs) => { const t0 = Date.now(); while (Date.now() - t0 < secs * 1000) { if (await ev(cond).catch(() => false)) return true; await sleep(200); } return false; };
    const onMap = id => `(SceneManager._scene instanceof Scene_Map && SceneManager._scene._started && !SceneManager.isSceneChanging() && !$gamePlayer.isTransferring() && $gameMap.mapId() === ${id})`;
    const onBoard = "(SceneManager._scene instanceof Scene_QuestBoard && SceneManager._scene._started && !SceneManager.isSceneChanging() && !SceneManager._scene.isBusy())";
    const quiet = "(function(){ if (window.Needs) Needs.setEnabled(false); if (window.Hunting) { Hunting.auto(false); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); } if (window.Livestock) Livestock.auto(false); if (window.Dog) Dog.auto(false); if (window.Survival && Survival.calmWeather) Survival.calmWeather(); $gameScreen.clearWeather(); $gameSystem._minimapHidden = true; return 0; })()";
    const go = async (map, x, y) => {
        await ev(`(function(){ $gamePlayer.reserveTransfer(${map}, ${x}, ${y}, 2, 0); return 0; })()`);
        const ok = await until(onMap(map), 40);
        await frames(20);
        await ev(quiet);
        return ok;
    };
    const press = async k => { await ev(`Input._currentState["${k}"] = true; Input._latestButton = "${k}"; Input._pressedTime = 0; 0`); await frames(3); await ev(`Input._currentState["${k}"] = false; 0`); await frames(4); };
    const setDay = (day, hour) => ev(`$gameSystem._dayNightDay = ${day}; $gameSystem.setDayNightHour(${hour === undefined ? 12 : hour}); 0`);
    const shot = async name => { await b.shot(path.join(SHOTS, "tablica_" + name + ".png")); };
    fs.mkdirSync(SHOTS, { recursive: true });
    try {
        // ---------------------------------------------------------------- boot
        let booted = false;
        for (let a = 0; a < 4 && !booted; a++) {
            await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
            for (let i = 0; i < 120; i++) {
                if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title' && DataManager._globalInfo)").catch(() => false)) { booted = true; break; }
                await sleep(500);
            }
        }
        check("the game boots", booted);
        const loaded = await ev(`new Promise(res => { if (window.QuestBoard) return res(true); const s = document.createElement("script"); s.src = "js/plugins/QuestBoard.js?" + Date.now(); s.onload = () => res(!!window.QuestBoard); s.onerror = () => res(false); document.body.appendChild(s); })`);
        check("QuestBoard.js loads into the page (and Journal.js has the tab / tracker hooks)", loaded && await ev("!!(Journal.addTab && Journal.addTrackerSource)"));
        await ev("(function(){ DataManager.setupNewGame(); SceneManager.goto(Scene_Map); return 0; })()");
        check("a new game starts", await until("SceneManager._scene instanceof Scene_Map && SceneManager._scene._started && !$gamePlayer.isTransferring()", 40));
        await ev("(function(){ if (window.Story) { Story.skipIntro(); Story.setDeadlineOn(false); } return 0; })()");
        await ev(quiet);
        await frames(30);
        await ev("(function(){ window.__tops = []; const o = $gameTemp.pushTopNotice.bind($gameTemp); $gameTemp.pushTopNotice = (t, c, op) => { window.__tops.push([t, op && op.sub || ''].join(' | ')); return o(t, c, op); }; return 0; })()");

        // ---------------------------------------------------------------- the data: templates, givers, items
        const tdata = await J(`(function(){
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
        check("every template names real items, animals and givers, sane counts and short texts", tdata.bad.length === 0 && tdata.gifts.length === 0, tdata.bad.slice(0, 5));
        check("all kinds of work are there: deliver, craft, gather, hunt, bounty, story (" + tdata.n + " templates, " + tdata.givers + " givers)",
            ["deliver", "craft", "gather", "hunt", "bounty", "story"].every(k => tdata.types[k] > 0) && tdata.n >= 40 && tdata.givers >= 12, tdata.types);

        // ---------------------------------------------------------------- seeded generation, sensible for the tier
        const gen = await J(`(function(){
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
        check("the same seed gives the same notices", gen.same);
        check("generated notices are sensible: tier within 2 of the board's, real items, gold/xp/terms inside the tier's band, season and first day kept, one urgent and one bounty at most, one torn corner",
            gen.bad.length === 0, gen.bad.slice(0, 8));
        check("the pay grows with the tier (average G per tier " + gen.avg.join(" / ") + "), up to about 120 G", gen.avg.every((v, i) => i === 0 || v > gen.avg[i - 1]) && gen.avg[0] <= 25 && gen.avg[4] >= 55 && gen.urgentMax <= 130, gen);
        check("wanted posters appear at the higher tiers", gen.bounty > 0, gen.bounty);

        // ---------------------------------------------------------------- the reputation tiers
        const tiers = await J(`(function(){
            const d = QuestBoard.state(), r = [];
            $gameSystem._dayNightDay = 40;
            for (const rep of [0, 19, 20, 39, 40, 59, 60, 79, 80, 100]) { d.rep = rep; r.push(QuestBoard.tier()); }
            d.rep = 95; $gameSystem._dayNightDay = 5; const early = QuestBoard.tierNow();
            $gameSystem._dayNightDay = 12; const mid = QuestBoard.tierNow();
            d.rep = 0; QuestBoard.addRep(250); const capHi = QuestBoard.reputation(); QuestBoard.addRep(-400); const capLo = QuestBoard.reputation();
            return { r, early, mid, capHi, capLo, names: QuestBoard.TIERS.map(t => t.name) };
        })()`);
        check("reputation tiers at 0/20/40/60/80: " + tiers.names.join(" > "), JSON.stringify(tiers.r) === JSON.stringify([0, 0, 1, 1, 2, 2, 3, 3, 4, 4]), tiers.r);
        check("the day caps the tier (95 reputation: tier 1 on day 5, tier 2 on day 12) and reputation stays in 0-100", tiers.early === 1 && tiers.mid === 2 && tiers.capHi === 100 && tiers.capLo === 0, tiers);

        // ---------------------------------------------------------------- the board, the cycle
        await setDay(10, 12);
        const cyc = await J(`(function(){
            const d = QuestBoard.state(); d.rep = 30; d.tutorial = false;
            const board = QuestBoard.refresh(99);
            const slots = board.map(n => n.look.slot);
            return { n: board.length, slots, uniq: new Set(slots).size, cycle: d.cycle, want: QuestBoard.cycleOf(10) };
        })()`);
        check("a board has 4-6 notices in different slots", cyc.n >= 4 && cyc.n <= 6 && cyc.uniq === cyc.n && cyc.cycle === cyc.want, cyc);

        // ---------------------------------------------------------------- accepting: at most three in hand
        const acc = await J(`(function(){
            const open = QuestBoard.board().filter(n => n.state === "open");
            const r = [];
            for (let i = 0; i < 4 && i < open.length; i++) r.push(QuestBoard.accept(open[i].id));
            const a = QuestBoard.active();
            return { r, active: a.length, due: a[0] ? [a[0].accepted, a[0].days, a[0].due] : null, again: QuestBoard.accept(a[0].id).ok };
        })()`);
        check("three contracts can be accepted, the fourth is refused with a reason", acc.active === 3 && acc.r.slice(0, 3).every(x => x.ok) && acc.r[3] && !acc.r[3].ok && /3 zlecenia/.test(acc.r[3].why), acc);
        check("an accepted contract gets its term: accepted day + days - 1, and cannot be taken twice", acc.due && acc.due[2] === acc.due[0] + acc.due[1] - 1 && acc.again === false, acc.due);
        // the cycle: three days on, new notices; the contracts in hand stay
        const before = await J("QuestBoard.active().map(n => n.id)");
        await setDay(13, 9);
        await frames(40);
        const after = await J("({ active: QuestBoard.active().map(n => n.id), board: QuestBoard.board().map(n => [n.id, n.state]), cycle: QuestBoard.state().cycle, notice: $gameTemp._lastTopNotice })");
        check("three days later the board has new notices and the contracts in hand stay pinned",
            JSON.stringify(after.active) === JSON.stringify(before) && after.cycle === 4 && after.board.filter(x => x[1] === "open").length >= 2 && after.board.every(x => x[1] === "open" || before.includes(x[0])), after);
        // giving up one: reputation -3
        const ab = await J(`(function(){ const d = QuestBoard.state(), r0 = d.rep, n = QuestBoard.active()[2]; const loss = QuestBoard.abandon(n.id); return { r0, r1: d.rep, loss, gone: !QuestBoard.find(n.id), stats: d.stats.abandoned, urgent: n.urgent }; })()`);
        check("giving up a contract takes it off the board and costs reputation (3, 5 if urgent)", ab.gone && ab.r0 - ab.r1 === ab.loss && ab.loss === (ab.urgent ? 5 : 3) && ab.stats === 1, ab);

        // ---------------------------------------------------------------- turning in: the goods go, the pay comes
        const ti = await J(`(function(){
            const d = QuestBoard.state(), got = [];
            QuestBoard.onComplete((n, res) => got.push(n.id));
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
                note: Journal.data().notes.length - notes0, noteTitle: Journal.data().notes.slice(-1)[0].title, expect: { gold: n.gold, xp: n.xp, rep: n.rep } };
        })()`);
        check("turning in before the goods are there does nothing", ti.notYet === null);
        check("turning in takes the goods from the bag (the rest stays)", ti.left === 2, ti);
        // (Combat adds 5 for the first time an item comes to the bag - the gift may be one)
        check("the pay: gold, experience (Combat), reputation and the gift", ti.gold === ti.expect.gold && ti.res.xp === ti.expect.xp && ti.xp >= ti.expect.xp && ti.xp <= ti.expect.xp + 10 && ti.rep === ti.expect.rep && ti.gift === 2, ti);
        check("done: the notice is WYKONANE, the history keeps it, a journal note, onComplete listeners hear it", ti.state === "done" && ti.hist && ti.note === 1 && /Zlecenie: /.test(ti.noteTitle) && ti.got.length === 1, ti);

        // Feliks (the manor) may put the pay straight onto grandpa's debt
        const fel = await J(`(function(){
            const n = QuestBoard.post("quills", 1, 808); QuestBoard.accept(n.id);
            $gameParty.gainItem($dataItems[146], n.req[0].n);
            const g0 = $gameParty.gold(), left0 = Story.left();
            const r = QuestBoard.turnIn(n.id, { debt: true });
            return { toDebt: r.toDebt, gold: $gameParty.gold() - g0, paid: left0 - Story.left(), pay: n.gold, giver: n.giver };
        })()`);
        check("Feliks's pay can go straight onto grandpa's debt (Story.pay), the purse stays as it was", fel.giver === "feliks" && fel.toDebt === fel.pay && fel.paid === fel.pay && fel.gold === 0, fel);

        // ---------------------------------------------------------------- kills counted through Hunting.onKill
        await go(22, 20, 15);
        await setDay(14, 12);
        const kills = await J(`(function(){
            const any = QuestBoard.post("wolves", 2, 31), named = QuestBoard.post("wolves_map", 2, 32);
            QuestBoard.accept(any.id); QuestBoard.accept(named.id);
            named.req[0].map = 21;   // (elsewhere than here, Polna droga)
            const kill = kind => { const p = $gamePlayer, a = Hunting.spawn(kind, p.x + 3, p.y); Hunting.kill(a); };
            kill("wolf"); kill("rabbit");
            const r1 = [any.req[0].got, named.req[0].got, $gameTemp._lastTopNotice];
            named.req[0].map = 22;
            kill("wolf");
            return { r1, anyGot: any.req[0].got, namedGot: named.req[0].got, n: any.req[0].n, ids: [any.id, named.id] };
        })()`);
        check("a wolf killed anywhere counts for 'Wilki pod wsią', a rabbit does not, a wolf on another map does not count for a named place",
            kills.r1[0] === 1 && kills.r1[1] === 0 && /Wilki/.test(kills.r1[2] || ""), kills.r1);
        check("on the named map it counts", kills.anyGot === 2 && kills.namedGot === 1, kills);
        const killDone = await J(`(function(){ const n = QuestBoard.find("${kills.ids[0]}"); while (n.req[0].got < n.req[0].n) { const a = Hunting.spawn("wolf", $gamePlayer.x + 3, $gamePlayer.y); Hunting.kill(a); } return { ready: QuestBoard.isReady(n.id), said: $gameTemp._lastTopNotice }; })()`);
        check("the last kill makes it ready and says so at the top", killDone.ready && /Zlecenie gotowe/.test(killDone.said), killDone);
        await ev(`(function(){ for (const id of ${JSON.stringify(kills.ids)}) QuestBoard.abandon(id); return 0; })()`);

        // ---------------------------------------------------------------- a wanted animal: Trójłap on Polna droga, at night
        await setDay(14, 22);
        const bid = await ev(`(function(){ const d = QuestBoard.state(); d.rep = 60; const n = QuestBoard.post("b_trojlap", 3, 77); QuestBoard.accept(n.id); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); SceneManager._scene._qbT = 0; return n.id; })()`);
        const came = await until(`Hunting.animals.some(a => a._qbBounty === "${bid}")`, 25);
        const beast = came ? await J(`(function(){ const a = Hunting.animals.find(x => x._qbBounty === "${bid}"); const plain = Hunting.SPECIES.wolf.hp; return { name: a._qbName, kind: a.kind(), hp: a._maxHp, plain, lv: a._level, scale: a._qbScale, pack: a._pack ? a._pack.members.length : 0, notice: $gameTemp._lastTopNotice }; })()`) : null;
        check("the wanted wolf comes on its map at night: named, stronger, bigger, with a companion, and a notice says so",
            came && beast.name === "Trójłap" && beast.kind === "wolf" && beast.hp >= beast.plain * 1.8 && beast.scale > 1.1 && beast.pack >= 2 && /Trójłap/.test(beast.notice), beast);
        await frames(10);
        const label = await ev(`(function(){ const a = Hunting.animals.find(x => x._qbBounty === "${bid}"); return !!(a && a._sprite && a._sprite._qbLabel && a._sprite._qbLabel.visible); })()`);
        check("its name hangs over it on the map", label);
        await ev(`(function(){ const a = Hunting.animals.find(x => x._qbBounty === "${bid}"); if (a) { $gamePlayer.locate(Math.max(1, a.x - 3), a.y); $gamePlayer.setDirection(6); } return 0; })()`);
        await frames(6);
        await b.shot(path.join(SHOTS, "tablica_poszukiwany_na_mapie.png"));
        const bk = await J(`(function(){ const a = Hunting.animals.find(x => x._qbBounty === "${bid}"); const other = Hunting.animals.find(x => !x._qbBounty && x.kind() === "wolf"); if (other) Hunting.kill(other); const n = QuestBoard.find("${bid}"); const g0 = n.req[0].got; Hunting.kill(a); return { g0, g1: n.req[0].got, ready: QuestBoard.isReady(n.id) }; })()`);
        check("another wolf of its pack does not count; killing the wanted one does", bk.g0 === 0 && bk.g1 === 1 && bk.ready, bk);
        // (the real TavernDice (registered): the die shows among the hero's own; else the stub above records it)
        const dice = await J(`(function(){ window.__dice = []; const real = !!(window.TavernDice && TavernDice.dice);
            const cnt = () => { const o = real ? TavernDice.dice().owned.find(d => d.key === "grusza") : null; return o ? o.count : 0; };
            const c0 = cnt(); const r = QuestBoard.turnIn("${bid}");
            return { die: r && r.die, got: real ? (cnt() > c0 ? ["grusza"] : []) : window.__dice, gold: r && r.gold, real }; })()`);
        check("the bounty pays 85-120 G and gives its special die (TavernDice.giveDie)", dice.die === "grusza" && JSON.stringify(dice.got) === JSON.stringify(["grusza"]) && dice.gold >= 85 && dice.gold <= 120, dice);

        // ---------------------------------------------------------------- a missed term
        await go(19, 5, 6);
        await setDay(20, 10);
        const due = await J(`(function(){ const d = QuestBoard.state(); d.rep = 50; const n = QuestBoard.post("stones", 0, 9); n.urgent = false; QuestBoard.accept(n.id); window.__due = n.id; return { id: n.id, due: n.due, rep: d.rep }; })()`);
        await setDay(due.due + 1, 7);
        await frames(40);
        const failed = await J(`(function(){ const d = QuestBoard.state(), n = QuestBoard.find(window.__due), h = d.history.find(x => x.id === window.__due); return { state: n ? n.state : h && h.state, rep: d.rep, failed: d.stats.failed, said: window.__tops.filter(t => /przepadło/.test(t)).pop() || "" }; })()`);
        check("the day after the term the contract fails (PO TERMINIE), reputation -6 and a notice says so",
            failed.state === "failed" && due.rep - failed.rep === 6 && failed.failed === 1 && /przepadło/.test(failed.said) && /-6/.test(failed.said), failed);

        // ---------------------------------------------------------------- the <Tavern:board> event opens the board
        const evInfo = await J(`(function(){
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
        check("an event with a page-1 comment <Tavern:board> is recognised", evInfo.tagged && JSON.stringify(evInfo.list) === JSON.stringify([355, 0]), evInfo);
        await frames(10);
        const mark = await ev(`(function(){ const e = $gameMap.event(950), s = SceneManager._scene._spriteset._characterSprites.find(x => x._character === e); return s && s._qbMark ? s._qbMark._kind : null; })()`);
        check("a small marker bobs over the board while it has notices not seen yet", mark === "new", mark);
        await press("ok");
        check("the action button in front of it opens the board", await until(onBoard, 15));

        // ---------------------------------------------------------------- the scene: tutorial, moving, accepting, turning in
        await ev(`(function(){ $gameParty.gainGold(300); return 0; })()`);
        await frames(40);
        check("the first visit starts with Borgar's explanation", await ev("SceneManager._scene.mode === 'tutorial' && SceneManager._scene._overlay.visible"));
        await b.shot(path.join(SHOTS, "tablica_samouczek.png"));
        await press("ok");
        await press("ok");
        check("two pages of it, then the board is free", await ev("SceneManager._scene.mode === 'browse' && QuestBoard.state().tutorial === true"));
        await ev("SceneManager.pop(); 0");
        await until(onMap(19), 15);
        // a fresh, rich board for the pictures (day 30, reputation 64: the upper tiers, a wanted poster)
        await setDay(30, 18);
        await ev(`(function(){
            const d = QuestBoard.state(); d.rep = 64;
            let board, s = 3100;
            do { board = QuestBoard.refresh(s++); } while ((board.length < 6 || !board.some(n => n.type === "bounty") || !board.some(n => n.urgent) || !board.some(n => String(n.look.pin).startsWith("seal"))) && s < 3900);
            window.__boardSeed = s - 1;
            return 0; })()`);
        const fresh = await J("QuestBoard.board().map(n => ({ id: n.id, title: n.title, tpl: n.tpl, type: n.type, urgent: n.urgent, items: n.req.every(q => q.k === 'item'), req: n.req.map(q => [q.k, q.id || q.kind, q.n]) }))");
        const deliver = fresh.find(n => n.items && n.type !== "bounty" && !n.urgent) || fresh.find(n => n.items);
        await ev(`(function(){ const n = QuestBoard.find("${deliver.id}"); for (const q of n.req) $gameParty.gainItem($dataItems[q.id], q.n); return 0; })()`);
        await ev("QuestBoard.open(); 0");
        check("the board opens again with QuestBoard.open()", await until(onBoard, 15));
        await frames(60);
        const sc = await J("({ cards: SceneManager._scene._cards.length, focus: SceneManager._scene.focus && SceneManager._scene.focus.n ? SceneManager._scene.focus.n.id : 'rules', mode: SceneManager._scene.mode })");
        check("all notices are on it as cards", sc.cards === fresh.length && sc.mode === "browse", sc);
        await shot("plansza");
        // the arrows move between the cards; the focused one lifts and straightens
        await press("right");
        await frames(20);
        const mv = await J("(function(){ const s = SceneManager._scene, f = s.focus; return { id: f.n ? f.n.id : 'rules', lift: f.lift, rot: f.rotation, base: f.baseRot }; })()");
        check("an arrow moves the focus; the card lifts and straightens", mv.id !== sc.focus && mv.lift > 0.9 && Math.abs(mv.rot) < Math.abs(mv.base) * 0.2 + 0.001, mv);
        // the mouse over a card focuses it too
        const target = fresh.find(n => n.type === "bounty") || fresh[0];
        await ev(`(function(){ const s = SceneManager._scene, c = s._cards.find(x => x.n.id === "${target.id}"); TouchInput._x = Math.round(c.baseX); TouchInput._y = Math.round(c.baseY); return 0; })()`);
        await frames(24);
        check("the mouse over a card focuses it", await ev(`SceneManager._scene.focus && SceneManager._scene.focus.n && SceneManager._scene.focus.n.id === "${target.id}"`));
        await shot("szczegoly");
        // O on the delivery notice: the buttons, "Przyjmij zlecenie"
        await ev(`(function(){ const s = SceneManager._scene; s.setFocus(s._cards.find(x => x.n.id === "${deliver.id}")); return 0; })()`);
        await frames(16);
        await press("ok");
        const ch = await J("({ mode: SceneManager._scene.mode, labels: SceneManager._scene.choices.map(c => c.label), i: SceneManager._scene.choiceIndex })");
        check("O opens the choices: Przyjmij zlecenie / Zostaw", ch.mode === "choice" && ch.labels[0] === "Przyjmij zlecenie" && ch.labels[1] === "Zostaw" && ch.i === 0, ch);
        await press("ok");
        await frames(24);
        const st = await J(`({ state: QuestBoard.find("${deliver.id}").state, stamp: SceneManager._scene._cards.find(x => x.n.id === "${deliver.id}")._stampKind, mode: SceneManager._scene.mode })`);
        check("accepted: the PRZYJĘTE stamp comes down on the card", st.state === "active" && st.stamp === "active" && st.mode === "browse", st);
        await shot("przyjete");
        // it is ready (the goods are in the bag): turn it in
        const g0 = await ev("$gameParty.gold()");
        await press("ok");
        const ch2 = await J("({ labels: SceneManager._scene.choices.map(c => c.label + (c.enabled === false ? '(x)' : '')) })");
        check("on an accepted, ready contract: Oddaj zlecenie / Śledź / Porzuć", /^Oddaj/.test(ch2.labels[0]) && !/\(x\)/.test(ch2.labels[0]) && ch2.labels.some(l => /Śledź/.test(l)) && ch2.labels.some(l => /Porzuć/.test(l)), ch2);
        await press("ok");
        await frames(56);
        const an = await J("({ mode: SceneManager._scene.mode, coins: (SceneManager._scene._flyers || []).filter(f => f.coin).length })");
        check("turning in plays the reward: coins fly to the purse", an.mode === "anim" && an.coins > 0, an);
        await frames(8);
        await shot("nagroda");
        await until("SceneManager._scene.mode === 'browse'", 12);
        const done = await J(`({ state: QuestBoard.find("${deliver.id}").state, stamp: SceneManager._scene._cards.find(x => x.n.id === "${deliver.id}")._stampKind, purse: Math.round(SceneManager._scene.purseShown), gold: $gameParty.gold(), got: $gameParty.gold() - ${g0} })`);
        check("then WYKONANE, and the purse on the slate shows the new gold", done.state === "done" && done.stamp === "done" && done.purse === done.gold && done.got === await ev(`QuestBoard.find("${deliver.id}").gold`), done);
        await shot("wykonane");
        // the rules tag under the sign
        await ev("(function(){ const s = SceneManager._scene; s.setFocus(s._tag); return 0; })()");
        await frames(16);
        check("the rules tag has its own page", await ev("SceneManager._scene.choiceList()[0].id === 'close'"));
        await shot("zasady");
        // accept one more and follow it; P leaves
        const second = fresh.find(n => n.id !== deliver.id && n.type !== "bounty");
        await ev(`(function(){ QuestBoard.accept("${second.id}"); QuestBoard.track("${second.id}"); return 0; })()`);
        await press("cancel");
        check("P leaves the board", await until(onMap(19), 15));
        await frames(20);
        await b.shot(path.join(SHOTS, "tablica_okienko_celu.png"));

        // ---------------------------------------------------------------- the journal and the goal window
        const trk = await J("(function(){ const t = SceneManager._scene._goalTracker; return t ? { key: t._key, vis: t.visible } : null; })()");
        check("the goal window follows the chosen contract (ZLECENIE)", trk && /^x\|/.test(trk.key) && trk.key.indexOf(second.id + "|") > 0, trk);
        await ev("SceneManager.push(Journal.Scene_Journal); 0");
        await until("SceneManager._scene instanceof Journal.Scene_Journal && SceneManager._scene._started", 15);
        await frames(20);
        const jr = await J(`(function(){
            const s = SceneManager._scene, names = s._tabs._list.map(c => c.name), tab = names.indexOf("Zlecenia");
            s._tab = tab; s.showTab();
            const items = s._list._items.map(i => i.label), first = s._list._items[0];
            const ops = s._detail._ops.map(o => o.k + ":" + (o.text || o.name || ""));
            return { names, tab, items, pin: first && first.mark, ops, legend: Journal.itemsForTab(tab).length };
        })()`);
        check("the journal has a 'Zlecenia' tab listing the contract in hand and the finished ones", jr.tab >= 0 && jr.items.includes(second.title) && jr.items.length >= 3, jr);
        check("its page shows what is needed (have/need), the pay and the term", jr.ops.some(o => /^h:Potrzeba/.test(o)) && jr.ops.some(o => /^cost:/.test(o)) && jr.ops.some(o => /^h:Nagroda/.test(o)), jr.ops);
        await frames(10);
        await b.shot(path.join(SHOTS, "tablica_dziennik.png"));
        await ev("(function(){ const s = SceneManager._scene; s._list.select(0); s.onListOk(); return 0; })()");
        check("OK on it in the journal stops following it", await ev("QuestBoard.state().track === null"));
        await ev("SceneManager.pop(); 0");
        await until(onMap(19), 15);

        // ---------------------------------------------------------------- save round trip
        const rt = await J(`(function(){
            const before = JSON.stringify($gameSystem._quests);
            const contents = DataManager.makeSaveContents(), json = JsonEx.stringify(contents);
            $gameSystem._quests = null;
            DataManager.extractSaveContents(JsonEx.parse(json));
            const after = JSON.stringify($gameSystem._quests);
            return { same: before === after, size: json.length, active: QuestBoard.active().length };
        })()`);
        check("the whole state is plain data and comes back the same from a save", rt.same && rt.active >= 1, rt);

        // ---------------------------------------------------------------- no errors
        const errs = b.logs.filter(l => /EXC|Error|TypeError|ReferenceError/.test(l) && !/favicon/.test(l));
        check("no errors in the console", errs.length === 0, errs.slice(0, 5));
    } catch (e) {
        console.log("FAIL (exception) " + (e && e.stack || e));
        for (const l of b.logs.filter(x => /EXC|Error/.test(x)).slice(0, 8)) console.log(l);
        results.push(false);
    } finally {
        const passed = results.filter(Boolean).length;
        console.log(passed + "/" + results.length + " passed");
        await b.close();
        process.exit(passed === results.length ? 0 : 1);
    }
})();
