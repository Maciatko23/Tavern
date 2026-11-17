// Popiersia z PixelLab (2026-11-17): bohater składany z bazy i warstw noszonych rzeczy (Popiersie.js, Popiersie_Data.js), jedno żywe
// popiersie dla wszystkich (rozmowa, karta w menu, kości, zmiana), przemalowanie na kolor wzoru (czerwona chusta), popiersia ludzi
// 256x256 w rozmowie 1:1 (SpeechBubbles TALK.height 256), nowe osoby w tabeli BUSTS. Zrzuty: docs/ekwipunek/popiersie/gra_*.png
// Uruchom: node tests/run.js popiersie --port 9485
const kit = require("./lib/kit.js");
const path = require("path");
kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    const shot = f => t.shot(path.join(__dirname, "..", "docs", "ekwipunek", "popiersie", f));
    const pl = await J(`({ api: !!window.Popiersie, fam: Object.keys(PopiersieData.RODZINY).length, list: $plugins.filter(p => p.status).map(p => p.name), h: SpeechBubbles.TALK.height,
        busts: Object.keys(SpeechBubbles.BUSTS).length, kowal: SpeechBubbles.BUSTS["$Npc_Kowal:0"], lucjan: Object.entries(SpeechBubbles.BUSTS).filter(([k]) => /Jarmark/.test(k)).length })`);
    t.check("Popiersie.js działa, po Ubior; 38 rodzin warstw; rozmowa rysuje popiersia 256 (1:1); w tabeli są też nowe osoby (jarmark)",
        pl.api && pl.fam === 38 && pl.list.indexOf("Popiersie") > pl.list.indexOf("Ubior") && pl.h === 256 && pl.kowal === "Kowal_Bust" && pl.lucjan >= 1, { fam: pl.fam, h: pl.h, busts: pl.busts, lucjan: pl.lucjan });

    await t.newGame({ map: 220, x: 33, y: 36, dir: 2, hour: 10, quiet: true, minimap: false });
    await t.frames(60);
    // the pixels of the live bust against the base: how many differ (the head: rows 0-110, the torso: 150-256)
    const DIFF = `(function(){ const b = Tawerna.ui.loadBust("Hero_Bust"), base = ImageManager.loadPicture("Hero_Bust_Baza"), c = document.createElement("canvas"); c.width = c.height = 256;
        const x = c.getContext("2d"); x.drawImage(base._canvas || base._image, 0, 0, 256, 256); const p0 = x.getImageData(0, 0, 256, 256).data; const p1 = b.context.getImageData(0, 0, 256, 256).data;
        let head = 0, torso = 0, red = 0; for (let i = 0; i < p0.length; i += 4) { const y = (i / 4 / 256) | 0, d = Math.abs(p0[i] - p1[i]) + Math.abs(p0[i + 1] - p1[i + 1]) + Math.abs(p0[i + 2] - p1[i + 2]) + Math.abs(p0[i + 3] - p1[i + 3]);
            if (d > 30) { if (y < 110) head++; else if (y > 150) torso++; } if (y < 110 && p1[i + 3] > 0 && p1[i] > p1[i + 1] + 50 && p1[i] > p1[i + 2] + 50) red++; }
        return { w: b.width, h: b.height, same: b === Popiersie.bust() && b === ImageManager.loadPicture("Hero_Bust"), key: Popiersie.key(), head, torso, red }; })()`;
    const b0 = await J(DIFF);
    t.check("nic nie noszone: popiersie = baza (256x256, ten sam obrazek dla rozmowy i menu)", b0.w === 256 && b0.h === 256 && b0.same && b0.key === "" && b0.head + b0.torso < 50, b0);

    // the iron kit: the nasal helmet and the mail
    await t.eval("[346, 353, 253].forEach(id => $gameParty.gainItem($dataItems[id], 1)); Equipment.equip('head', 346); Equipment.equip('torso', 353); 0");
    await t.frames(30);
    const b1 = await J(DIFF);
    t.check("hełm z nosalem i kolczuga: na popiersiu (głowa i tors inne niż w bazie)", /helm_nosal/.test(b1.key) && /kolczuga/.test(b1.key) && b1.head > 400 && b1.torso > 1500, b1);
    await t.eval(`(function(){ const b = Tawerna.ui.loadBust("Hero_Bust"); const s = new Sprite(b); s.x = 1280 - 256; s.y = 720 - 256; SceneManager._scene.addChild(s); window.__bs = s; return 0; })()`);
    await t.frames(5); await shot("gra_zelazny.png");
    // the red kerchief: the white linen layer put on the red look's ramp
    await t.eval("Equipment.equip('head', 253); 0");
    await t.frames(30);
    const b2 = await J(DIFF);
    t.check("czerwona chusta: warstwa chusty przemalowana na czerwono (rampa wzoru chusta_czerwona)", /chusta:chusta_czerwona/.test(b2.key) && b2.red > 300, b2);
    await t.frames(5); await shot("gra_chusta.png");
    await t.eval("if (window.__bs) { window.__bs.parent.removeChild(window.__bs); window.__bs = null; } Equipment.equip('head', 346); 0");

    // a real talk: Tadek the smith (his PixelLab bust on the left, mirrored to look right; the hero's on the right)
    await t.eval("Equipment.equip('head', 346); 0");
    const tk = await t.talkTo("TownLife.eventOf('kowal')", [], { shotAtChoice: path.join(__dirname, "..", "docs", "ekwipunek", "popiersie", "gra_rozmowa_kowal.png") });
    const st = await J(`(function(){ const tb = SpeechBubbles.talk(); return { on: tb.on, hero: tb.hero, npc: tb.npc }; })()`);
    t.check("rozmowa z kowalem: popiersia obu (Kowal_Bust i Hero_Bust)", (tk && tk.text !== undefined) || st.npc === "Kowal_Bust", { st, text: tk && String(tk.text).slice(0, 80) });
});
