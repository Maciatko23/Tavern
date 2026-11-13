// Runs a STAGED test against the staging overlay: node tools/osada_laka/run.js <name> [port]
// (the staged test's relative require of ./lib/kit.js stays as it will be after the install; here it is pointed at the live kit, and __dirname at the live tests folder)
const fs = require("fs"), path = require("path"), { spawnSync } = require("child_process");
const ROOT = path.resolve(__dirname, "..", ".."), name = process.argv[2], port = process.argv[3] || "9421";
const src = path.join(__dirname, "staging", "tests", name + ".js");
let code = fs.readFileSync(src, "utf8");
const kitPath = JSON.stringify(path.join(ROOT, "tests", "lib", "kit.js")), testsDir = JSON.stringify(path.join(ROOT, "tests"));
code = code.split('require("./lib/kit.js")').join("require(" + kitPath + ")").split("__dirname").join(testsDir);
const tmp = path.join(__dirname, "staging", "_run_" + name + ".js");
fs.writeFileSync(tmp, code);
const r = spawnSync("node", [tmp], { stdio: "inherit", cwd: ROOT, env: Object.assign({}, process.env, { CDP_PORT: port, GAME_OVERLAY: "tools/osada_laka/staging", GAME_OVERLAY_JS: "1" }) });
fs.unlinkSync(tmp);
process.exit(r.status === null ? 1 : r.status);
