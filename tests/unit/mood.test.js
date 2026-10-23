// Mood.js (the picture's mood) without the game: what the browser test tests/mood_test.js asks of the look - the numbers the one
// filter gets - with the sun of Sky.js (+ DayNightCycle.js), the sky under it (Survival.js) and the floors below (Underground.js), and
// the game's real map notes (data/MapNNN.json). Every look complete; the time of day (noon almost nothing; the golden hour warm in
// the lights and cool in the shadows; the night blue in the darks with the fire warm, a strong glow, dark corners; the morning cooler
// than the afternoon) and no jumps through any day of the year; rain, a storm, a lightning flash, winter; the options (strength 50%,
// each effect off, everything off) and their config round trip; the kinds of places from the notes (the tavern and the houses
// interiors, Jaskinia and the cellar caves, the Heart's chamber below, Mroczny Las by its id or its name, <Mood:...> winning,
// <Mood:off>) and their looks (interior amber, cave and underground heavier corners, the dark forest gloomy by day with its lights
// still warm).
"use strict";
const fs = require("fs");
const path = require("path");
const unit = require("../lib/unit.js");
const W = require("../lib/wtyczki.js");

const ORDER = W.lista().map(p => p.name);
const FILES = ["TawernaCore", "DayNightCycle", "Sky", "Mood", "Survival", "Underground_Data", "Underground"].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
const noteOf = id => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "data", "Map" + String(id).padStart(3, "0") + ".json"), "utf8")).note || "";

unit.test(t => {
    const sys = { day: 10, hour: 12, dayNightDay() { return this.day; }, dayNightHour() { return this.hour; } };
    const screen = { type: "none", power: 0, weatherType() { return this.type; }, weatherPower() { return this.power; } };
    const env = { $dataMap: { note: noteOf(3) }, $gameMap: { id: 3, mapId() { return this.id; } }, $dataMapInfos: [] };
    const ConfigManager = { makeData() { return {}; }, applyData() {} };
    const globals = { $gameSystem: sys, $gameScreen: screen, ConfigManager, Graphics: { frameCount: 0, width: 1280, height: 720 } };
    for (const k of Object.keys(env)) Object.defineProperty(globals, k, { get: () => env[k], enumerable: true, configurable: true });
    const w = unit.load(FILES, { globals });
    const M = w.Mood, T = w.Tawerna;
    const look = (h, d) => { sys.hour = h; if (d !== undefined) sys.day = d; return M.target().look; };
    const onMap = (id, note) => { env.$gameMap.id = id; env.$dataMap = { note: note === undefined ? noteOf(id) : note }; return M.kindOf(); };

    // ---------------------------------------------------------------- the looks
    const keys = Object.keys(M.NEUTRAL);
    const bad = Object.entries(M.LOOKS).filter(([n, l]) => keys.some(k => Array.isArray(M.NEUTRAL[k]) ? !Array.isArray(l[k]) || l[k].length !== M.NEUTRAL[k].length : typeof l[k] !== "number"));
    t.check("every look (" + Object.keys(M.LOOKS).length + ") has every part of the neutral one (numbers, colours of 3, the split of 4); the kinds: outdoor, interior, cave, underground, darkforest, off",
        bad.length === 0 && Object.keys(M.LOOKS).length >= 9 && M.KINDS.join() === "outdoor,interior,cave,underground,darkforest,off" && T.api("Mood") === M, bad.map(b => b[0]));

    // ---------------------------------------------------------------- the time of day (Map003, outdoors, day 10: spring)
    t.eq("Map003 (<Clouds:on>) is outdoors", onMap(3), "outdoor");
    const noon = look(12), golden = look(19.95), night = look(23.5), morning = look(7.5), afternoon = look(16);
    t.check("noon: almost nothing (vignette at most 0.25, glow at most 0.3, saturation about 1)", noon.vig <= 0.25 && noon.bloom <= 0.3 && Math.abs(noon.satHi - 1) < 0.1, noon);
    t.check("the golden hour: warmer in the lights and cooler in the shadows than noon", golden.high[0] > noon.high[0] && golden.high[2] < noon.high[2] && golden.shadow[2] > noon.shadow[2], { golden, noon });
    t.check("the night: blue in the darks, the fire warm in the lights, a strong glow and dark corners; the morning cooler in the shadows than the afternoon",
        night.shadow[2] > 1.1 && night.high[0] > 1 && night.high[2] < 1 && night.bloom >= 1 && night.vig >= 0.4 && morning.shadow[2] > afternoon.shadow[2], { night, morning: morning.shadow, afternoon: afternoon.shadow });
    const max = {};
    for (const day of [10, 38, 66, 94]) {
        let last = null;
        for (let h = 0; h <= 24.001; h += 0.05) {
            const l = look(h % 24, day);
            if (last) {
                for (const k of ["vig", "bloom", "satLo", "satHi", "con"]) max[k] = Math.max(max[k] || 0, Math.abs(l[k] - last[k]));
                for (const k of ["shadow", "high"]) for (let i = 0; i < 3; i++) max[k] = Math.max(max[k] || 0, Math.abs(l[k][i] - last[k][i]));
            }
            last = l;
        }
    }
    t.check("no jumps through a whole day (every 3 minutes, past midnight, in every season): each part moves less than 0.1 a step", Object.values(max).every(v => v < 0.1), max);

    // ---------------------------------------------------------------- the weather and the season
    sys.day = 10;
    const clear = look(15);
    Object.assign(screen, { type: "rain", power: 5 });
    const rain = look(15);
    w.Storm = { level: () => 0.9, flash: () => 0 };
    const storm = look(15);
    w.Storm = { level: () => 0.9, flash: () => 1 };
    const flash = look(15);
    w.Storm = undefined;
    Object.assign(screen, { type: "none", power: 0 });
    const winter = look(15, 94);
    sys.day = 10;
    t.check("rain: the colours dimmed (saturation -20% and more) and a grey haze", rain.satLo < clear.satLo * 0.8 && rain.lift[2] > clear.lift[2] + 0.01, { clear: clear.satLo, rain: rain.satLo });
    t.check("a storm: greyer still, more contrast, darker corners; a lightning flash puts the glow out (the flash is the light)",
        storm.satLo < rain.satLo && storm.con > rain.con && storm.vig > rain.vig + 0.05 && flash.bloom < 0.02 && storm.bloom > 0, { storm, flash: flash.bloom });
    t.check("winter: paler (less saturated, a lighter haze) and cooler in the shadows", winter.satLo < clear.satLo * 0.85 && winter.lift[2] > clear.lift[2] + 0.02 && winter.shadow[2] > clear.shadow[2], winter);

    // ---------------------------------------------------------------- the options
    look(23);
    const full = M.wanted();
    const withOpt = o => { const keep = {}; for (const k of Object.keys(o)) { keep[k] = ConfigManager[k]; ConfigManager[k] = o[k]; } const r = M.wanted(); Object.assign(ConfigManager, keep); return r; };
    const half = withOpt({ moodPower: 50 }), noBloom = withOpt({ moodBloom: false }), noVig = withOpt({ moodVignette: false }), noGrade = withOpt({ moodGrade: false });
    const off = withOpt({ moodFx: false }), zero = withOpt({ moodPower: 0 });
    t.check("strength 50%: the vignette and the glow halved, the colours halfway to neutral", Math.abs(half.vig - full.vig / 2) < 1e-9 && Math.abs(half.bloom - full.bloom / 2) < 1e-9 &&
        Math.abs(half.satLo - (1 + full.satLo) / 2) < 1e-9, { half, full });
    t.check("each effect on its own: Poświata off - no glow; Winieta off - no vignette; Barwy off - no grading (saturation, contrast, balance 1); Efekty obrazu off or 0% - nothing at all",
        noBloom.bloom === 0 && noBloom.vig === full.vig && noVig.vig === 0 && noVig.bloom === full.bloom && noGrade.satLo === 1 && noGrade.con === 1 && noGrade.shadow.every(v => v === 1) &&
        noGrade.vig === full.vig && off === null && zero === null && M.isOn(), { noBloom: noBloom.bloom, noVig: noVig.vig, noGrade });
    const saved = ConfigManager.makeData();
    ConfigManager.applyData({ moodFx: false, moodPower: 40, moodBloom: false, moodGrade: true, moodVignette: false });
    const got = [ConfigManager.moodFx, ConfigManager.moodPower, ConfigManager.moodBloom, ConfigManager.moodGrade, ConfigManager.moodVignette];
    ConfigManager.applyData({ moodPower: 150 });
    const clamp = [ConfigManager.moodPower, ConfigManager.moodFx];
    ConfigManager.applyData({ moodPower: "abc" });
    const junk = ConfigManager.moodPower;
    ConfigManager.applyData({});
    const dflt = [ConfigManager.moodFx, ConfigManager.moodPower, ConfigManager.moodBloom, ConfigManager.moodGrade, ConfigManager.moodVignette];
    t.check("the options in the config file: saved (all on, 100%), read back, the strength kept within 0-100, an old file without them: the defaults",
        [saved.moodFx, saved.moodPower, saved.moodBloom, saved.moodGrade, saved.moodVignette].join() === "true,100,true,true,true" && got.join() === "false,40,false,true,false" &&
        clamp.join() === "100,true" && junk === 0 && dflt.join() === "true,100,true,true,true", { saved, got, clamp, junk, dflt });

    // ---------------------------------------------------------------- the kinds of places
    const kinds = { tavern: onMap(1), cellar: onMap(9), heart: onMap(11), darkForest: onMap(12), cave: onMap(14), house: onMap(19), hut: onMap(100), town: onMap(8), harbour: onMap(125) };
    t.check("the places from the game's notes: the tavern (Map001), grandpa's house (19) and the hut (100) interiors; the cellar (9) and Jaskinia (14) caves; the Heart's chamber (11) below; Mroczny Las (12, no tag) by its id; the town and the harbour outdoors",
        kinds.tavern === "interior" && kinds.house === "interior" && kinds.hut === "interior" && kinds.cellar === "cave" && kinds.cave === "cave" && kinds.heart === "underground" &&
        kinds.darkForest === "darkforest" && kinds.town === "outdoor" && kinds.harbour === "outdoor", kinds);
    env.$dataMapInfos = [];
    env.$dataMapInfos[50] = { id: 50, name: "Mroczny  Las (północ)" };
    const tagged = { name: onMap(50, ""), cave: onMap(3, "<Clouds:on><Mood:cave>"), off: onMap(3, "<Clouds:on><Mood:off>"), unknown: onMap(3, "<Clouds:on><Mood:bajka>"), bare: onMap(60, "") };
    onMap(3, "<Clouds:on><Mood:off>");
    const offLook = M.target().look;
    t.check("... a map named 'Mroczny Las' is the dark forest too; <Mood:cave> wins over the sky; <Mood:off> - no effects (the neutral look); an unknown <Mood:...> is left alone; a bare note: outdoors",
        tagged.name === "darkforest" && tagged.cave === "cave" && tagged.off === "off" && tagged.unknown === "outdoor" && tagged.bare === "outdoor" &&
        JSON.stringify(offLook) === JSON.stringify(M.LOOKS.neutral), tagged);
    sys.hour = 12;
    const lookOn = id => { onMap(id); return M.target().look; };
    const tav = lookOn(1), cave = lookOn(14), deep = lookOn(11);
    t.check("the places' looks: the tavern warm amber (lights warmer), the cave heavier corners than the tavern, the Heart's chamber green-grey darks and the heaviest corners",
        tav.high[0] > 1.03 && tav.high[2] < 0.95 && cave.vig > tav.vig && deep.shadow[1] > deep.shadow[0] && deep.vig > cave.vig, { tav: tav.high, vig: [tav.vig, cave.vig, deep.vig], deep: deep.shadow });
    const outDay = lookOn(3), dfDay = lookOn(12);
    sys.hour = 23.5;
    const dfNight = lookOn(12), outNight = lookOn(3);
    t.check("Mroczny Las: by day darker, more muted and colder in the darks than outdoors, heavy corners also by day; the lights stay warm, the glow at least 0.5; at night still gloomier than outdoors",
        dfDay.gain < outDay.gain && dfDay.satLo < outDay.satLo && dfDay.shadow[0] < outDay.shadow[0] && dfDay.vig >= 0.48 && outDay.vig < 0.3 && dfDay.high[0] >= 1 && dfDay.bloom >= 0.5 &&
        dfNight.vig >= outNight.vig && dfNight.satLo < outNight.satLo, { dfDay, outDay: { gain: outDay.gain, satLo: outDay.satLo, vig: outDay.vig } });
});
