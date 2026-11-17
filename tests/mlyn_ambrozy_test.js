// Nowy świat (2026-11-15): W19 z nowym młynarzem - rozmowa z Ambrożym o skrzydłach (po wyznaniu Jaśka), a po złapaniu przemytników
// Ambroży znika i Walenty znów miele przy drzwiach młyna.
const kit = require("./lib/kit.js");
kit.test({ port: Number(process.env.CDP_PORT) || 9397, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    await t.newGame({ story: true, skipIntro: true, map: 224, x: 2, y: 5, deadline: false, quiet: true, minimap: false });
    await t.setDay(30, 10);
    await t.eval("Mlyn.debugGo(4); 0");
    await t.go(218, 7, 37, 8);
    await t.frames(200);
    const a0 = await t.json("(function(){ const e = TownLife.eventOf('nowy_mlynarz'); return e ? [e.x, e.y, !e.isTransparent()] : null; })()");
    t.check("Ambroży jest przy wiatraku", !!a0 && a0[2], a0);
    await t.eval("Mlyn.stan().ch4.jasiek = ''; Mlyn.stan().amb = 0; 0");
    const before = await t.talkTo("TownLife.eventOf('nowy_mlynarz')", []);
    t.check("przed wyznaniem Jaśka Ambroży nie ma tematu o skrzydłach", !/Pytam o skrzydła/.test(JSON.stringify(before.choices || [])), before.choices);
    await t.eval("Mlyn.stan().ch4.jasiek = 'pomoc'; 0");
    const r = await t.talkTo("TownLife.eventOf('nowy_mlynarz')", ["Pytam o skrzydła nocą."]);
    const s = await t.json("({ amb: Mlyn.stan().amb })");
    t.check("po wyznaniu Jaśka: „Pytam o skrzydła nocą” - Ambroży zrzuca na wiatr i ostrzega; zapisane", /Wiatr, chłopcze/.test(r.text) && /plaży/.test(r.text) && s.amb === 30, { text: r.text.slice(0, 200), s });
    const again = await t.talkTo("TownLife.eventOf('nowy_mlynarz')", []);
    t.check("drugi raz tematu już nie ma", !/Pytam o skrzydła/.test(JSON.stringify(again.choices || [])), again.choices);
    // the smugglers taken: Ambroży gone, Walenty at the mill's door by day
    await t.eval("Mlyn.stan().koniec = 1; TownLife.setGone('nowy_mlynarz', true); 0");
    await t.setDay(31, 10); await t.go(218, 7, 38, 8); await t.frames(400);
    const end = await t.json("(function(){ const a = TownLife.eventOf('nowy_mlynarz'), w = TownLife.eventOf('mlynarz'); return { amb: a ? !a.isTransparent() && !(a._town && a._town.hidden) : false, gone: TownLife.gone('nowy_mlynarz'), w: w ? [w.x, w.y] : null }; })()");
    t.check("po złapaniu przemytników: Ambroży zniknął, Walenty pracuje przy drzwiach młyna (7,35)", end.gone && !end.amb && end.w && end.w[0] === 7 && end.w[1] === 35, end);
});
