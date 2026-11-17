// Pokojówka Zośka (Pokojowka.js; gracz 2026-11-16: „sprząta pokoje, zamiata wszędzie podłogę i dokłada do kominków drewna”).
const kit = require("./lib/kit.js");
kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    const until = async (cond, sec) => { for (let i = 0; i < sec * 4; i++) { if (await J(cond)) return true; await t.frames(15); } return false; };
    const idle = () => until("Pokojowka.state().state === 'idle'", 60);
    t.check("nowa gra", await t.newGame());
    await t.setHour(7);
    await t.go(1, 14, 28, 8); await t.frames(60);
    const s1 = await J("Pokojowka.state()");
    t.check("rano (7:00) pokojówka jest w sali na parterze", !!s1 && s1.map === 1 && !s1.hidden && await J("Pokojowka.shift()") === 1, s1);
    await idle(); await t.eval("Pokojowka.force('sweep'); 0");
    t.check("zamiata: staje w miejscu z miotłą", await until("Pokojowka.state().state === 'sweep' && Pokojowka.state().broom", 60), await J("Pokojowka.state()"));
    if (process.env.SHOT) { await t.eval("(function(){ const s = Pokojowka.state(); $gamePlayer.locate(s.x + 2, s.y + 1); return 0; })()"); await t.frames(20); await t.shot(process.env.SHOT); }
    await idle(); await t.eval("Pokojowka.force('fire'); 0");
    const f = await until("Pokojowka.state().state === 'fire'", 80), fs = await J("Pokojowka.state()");
    t.check("dokłada do kominka: staje pod jednym z dwóch kominków sali", f && fs.y === 16 && (fs.x === 4 || fs.x === 24), fs);
    await idle();
    await t.setHour(9.2);
    t.check("o dziewiątej kończy zmianę: idzie do schodów i znika z sali", await until("Pokojowka.state().state === 'away' && Pokojowka.state().hidden", 120), await J("Pokojowka.state()"));
    await t.go(25, 14, 18, 8); await t.frames(60);
    const s2 = await J("Pokojowka.state()");
    t.check("...i jest na piętrze I", !!s2 && s2.map === 25 && !s2.hidden, s2);
    await idle(); await t.eval("Pokojowka.force('room'); 0");
    const r = await until("Pokojowka.state().state === 'inside'", 90), rs = await J("Pokojowka.state()");
    t.check("sprząta pokój: podchodzi pod drzwi w korytarzu i wchodzi (znika za drzwiami)", r && rs.y === 16 && rs.hidden, rs);
    t.check("...i po chwili wychodzi", await until("Pokojowka.state().state === 'idle' && !Pokojowka.state().hidden", 40), await J("Pokojowka.state()"));
    await t.setHour(14);
    await t.go(26, 14, 18, 8); await t.frames(60);
    t.check("po południu (14:00) jest na piętrze II", await J("Pokojowka.state().map === 26 && !Pokojowka.state().hidden"), await J("Pokojowka.state()"));
    await t.setHour(23);
    await t.go(1, 14, 28, 8); await t.frames(60);
    t.check("nocą śpi - nie ma jej w sali", await J("Pokojowka.state().hidden && Pokojowka.shift() === 0"), await J("Pokojowka.state()"));
});
