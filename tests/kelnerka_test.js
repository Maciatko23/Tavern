// Kelnerka Jagna (Kelnerka.js; gracz 2026-11-16: „kelnerka, która z kuchni nosi ludziom do stołów rzeczy”).
const kit = require("./lib/kit.js");
kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    const until = async (cond, sec) => { for (let i = 0; i < sec * 4; i++) { if (await J(cond)) return true; await t.frames(15); } return false; };
    t.check("nowa gra", await t.newGame());
    await t.setHour(20);
    await t.go(1, 14, 30, 8); await t.frames(60);
    const st0 = await J("Kelnerka.state()");
    t.check("wieczorem kelnerka stoi w kuchni przy piecu", !!st0 && st0.state === "cook" && st0.y <= 9 && !st0.hidden, st0);
    const guests = await until("GoscieSala.guests().some(g => g.state === 'sit')", 60);
    t.check("przy stołach siedzą goście", guests, await J("GoscieSala.stats()"));
    await t.eval("Kelnerka.force(); 0");
    const carrying = await until("Kelnerka.state().carry && Kelnerka.state().y >= 14", 30);
    t.check("bierze miskę i wychodzi drzwiami za ladą do sali", carrying, await J("Kelnerka.state()"));
    if (process.env.SHOT) { await t.eval("(function(){ const s = Kelnerka.state(); $gamePlayer.locate(s.x, s.y + 3); return 0; })()"); await t.frames(20); await t.shot(process.env.SHOT); }
    const served = await until("Kelnerka.state().state === 'serve'", 60);
    const at = await J("(function(){ const s = Kelnerka.state(); return { s, near: GoscieSala.guests().some(g => g.seat && Math.abs(g.seat[0] - s.x) + Math.abs(g.seat[1] - s.y) <= 2) }; })()");
    t.check("donosi ją do siedzącego gościa", served && at.near, at);
    const back = await until("Kelnerka.state().state === 'cook' && Kelnerka.state().y <= 9", 80);
    t.check("i wraca do kuchni", back, await J("Kelnerka.state()"));
    await t.eval("Kelnerka.force('wipe'); 0");
    t.check("bez zamówień przeciera ladę (za ladą Borgara)", await until("Kelnerka.state().state === 'wipe'", 40), await J("Kelnerka.state()"));
    await until("Kelnerka.state().state === 'cook'", 60);
    await t.setHour(1);
    const bed = await until("Kelnerka.state().state === 'asleep' && Kelnerka.state().hidden", 120);
    t.check("po północy idzie schodami na górę spać i znika z sali", bed, await J("Kelnerka.state()"));
    await t.setHour(7);
    t.check("rano schodzi i wraca do kuchni", await until("Kelnerka.state().state === 'cook' && !Kelnerka.state().hidden", 120), await J("Kelnerka.state()"));
});
