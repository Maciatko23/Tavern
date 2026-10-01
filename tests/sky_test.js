// Dawn and sunset like the real ones (user 2026-10-01): one sun (T.api("Sun").sky) for the screen's colour (DayNightCycle.js), the
// dark of the night (Farming_Render.js), the shadows and the light from the side: the blue hour before sunrise (cool, grey), the warm
// golden hour, the day; in the evening the gold, the red, the blue hour, the night; longer days in summer; the side the sun is on warmer
// (the right in the morning, the left in the evening); the shadows blue at the golden hour. CDP_PORT=9450.
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "niebo");

kit.test({ port: 9450, bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    require("fs").mkdirSync(SHOTS, { recursive: true });
    await t.newGame({ map: 3, x: 34, y: 9, day: 5, hour: 12, quiet: true, minimap: false });   // (day 5: spring - sunrise 5:30, sunset 20:30)
    await t.eval(`(function(){ const set = SceneManager._scene._spriteset; for (const c of set._cloudSprites || []) set.removeChild(c); set._cloudSprites = []; $gamePlayer.center(34, 9); return 0; })()`);
    const at = async h => { await t.setHour(h); await t.frames(8);
        return t.json(`(function(){ const S = Tawerna.api("Sun"), sky = S.sky(${h}), set = SceneManager._scene._spriteset, side = set._sideLight, layer = set._tilemap._sunShadowLayer;
            return { h: ${h}, elev: +sky.elev.toFixed(1), tone: $gameScreen.tone().slice(), dark: +Farming.nightAmount().toFixed(2), golden: +sky.golden.toFixed(2),
                side: side && side.visible ? { warmLeft: side._warm.scale.x > 0, warm: +side._warm.alpha.toFixed(3) } : null, shade: layer && layer._shadeColour ? layer._shadeColour.map(v => +v.toFixed(2)) : null }; })()`); };
    const blueHour = await at(4.6), sunrise = await at(5.5), golden = await at(6.2), noon = await at(12), eveGold = await at(19.8), sunset = await at(20.5), dusk = await at(21.2), night = await at(23);
    t.check("before sunrise: the blue hour - cool and grey (blue up, red down, grey), darker than day", blueHour.elev < 0 && blueHour.tone[2] > 10 && blueHour.tone[0] < 10 && blueHour.tone[3] > 15 && blueHour.dark > 0.3, blueHour);
    t.check("at sunrise warm and light (red up, blue down), almost no dark", sunrise.tone[0] > 15 && sunrise.tone[2] < 0 && sunrise.dark < 0.2, sunrise);
    t.check("at noon no tint, no dark", noon.tone.every(v => v === 0) && noon.dark === 0, noon);
    t.check("in the evening the gold, at sunset warm red, after it the blue hour, then night", eveGold.tone[0] > 10 && sunset.tone[0] > 20 && dusk.tone[2] > 10 && dusk.dark > 0.4 && night.dark === 1, { eveGold, sunset, dusk, night });
    t.check("the golden hour: the light from the side - in the morning warm on the right, in the evening on the left", golden.side && !golden.side.warmLeft && eveGold.side && eveGold.side.warmLeft && !noon.side, { golden: golden.side, eve: eveGold.side, noon: noon.side });
    t.check("the shadows take the sky's colour: blue-violet at the golden hour, dark grey-blue at noon", golden.shade && noon.shade && golden.shade[2] > noon.shade[2] + 0.1 && golden.shade[2] > golden.shade[0] * 2, { golden: golden.shade, noon: noon.shade });
    // seasons: a summer evening is still light when a winter one is night
    const seasons = await t.json(`(function(){ const S = Tawerna.api("Sun"), L = Tawerna.time.seasonLength(), out = {};
        for (const [name, s] of [["spring", 0], ["summer", 1], ["autumn", 2], ["winter", 3]]) out[name] = +S.sky(20, 1 + s * L).dark.toFixed(2);
        return out; })()`);
    t.check("the days are longer in summer: at 20:00 the summer is light, the winter dark", seasons.summer < 0.05 && seasons.winter > 0.8 && seasons.spring < seasons.autumn, seasons);
    // pictures: the blue hour, the sunrise, the golden morning, the evening gold, the sunset, the dusk
    for (const [h, n] of [[5.0, "1_niebieska_godzina"], [5.5, "2_wschod"], [6.2, "3_zlota_godzina_rano"], [19.8, "4_zlota_godzina_wieczor"], [20.5, "5_zachod"], [21.2, "6_zmierzch"]]) {
        await t.setHour(h); await t.frames(10);
        await t.shot(path.join(SHOTS, n + ".png"));
    }
});
