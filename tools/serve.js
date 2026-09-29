// The local game server for the tests and for playing in a browser: the project's files over http://127.0.0.1:8765.
// Replaces `python -m http.server 8765`, which lost files under load (a busy test run pressed MZ's Retry button dozens of times).
// Files are kept in memory and read again only when their size or time changes on disk, the connections are kept alive,
// nothing is cached by the browser (a plugin edited between two tests is always the new one).
//
//   node tools/serve.js                 port 8765
//   node tools/serve.js --port 8766     another port
//   (tests/run.js starts it by itself when nothing answers on 8765)
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const argPort = process.argv.indexOf("--port");
const PORT = Number(argPort > 0 ? process.argv[argPort + 1] : process.env.GAME_PORT) || 8765;
const HOST = "127.0.0.1";
const MAX_CACHED = 8 * 1024 * 1024;        // (bigger files - long music - are streamed, not kept)

const TYPES = {
    ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
    ".css": "text/css; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".md": "text/plain; charset=utf-8",
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml",
    ".ico": "image/x-icon", ".ogg": "audio/ogg", ".m4a": "audio/mp4", ".mp3": "audio/mpeg", ".wav": "audio/wav",
    ".webm": "video/webm", ".mp4": "video/mp4", ".ttf": "font/ttf", ".otf": "font/otf", ".woff": "font/woff", ".woff2": "font/woff2",
    ".wasm": "application/wasm", ".efkefc": "application/octet-stream", ".rpgsave": "application/octet-stream"
};
const cache = new Map();   // path -> { size, mtime, body }
let served = 0, missing = 0;

function send(res, code, headers, body, head) {
    res.writeHead(code, Object.assign({ "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" }, headers));
    res.end(head ? undefined : body);
}

const server = http.createServer((req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, { "Content-Type": "text/plain" }, "method");
    let rel;
    try { rel = decodeURIComponent(new URL(req.url, "http://x").pathname); } catch (e) { return send(res, 400, {}, "bad url"); }
    if (rel.endsWith("/")) rel += "index.html";
    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT + path.sep) && file !== ROOT) return send(res, 403, {}, "no");
    fs.stat(file, (err, st) => {
        if (err || !st.isFile()) { missing++; return send(res, 404, { "Content-Type": "text/plain" }, "not found: " + rel, req.method === "HEAD"); }
        const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
        const headers = { "Content-Type": type, "Content-Length": st.size };
        served++;
        if (req.method === "HEAD") return send(res, 200, headers, null, true);
        const c = cache.get(file);
        if (c && c.size === st.size && c.mtime === st.mtimeMs) return send(res, 200, headers, c.body);
        if (st.size > MAX_CACHED) {
            res.writeHead(200, Object.assign({ "Cache-Control": "no-store" }, headers));
            return fs.createReadStream(file).on("error", () => res.destroy()).pipe(res);
        }
        fs.readFile(file, (e2, body) => {
            if (e2) return send(res, 500, { "Content-Type": "text/plain" }, "read error");
            cache.set(file, { size: st.size, mtime: st.mtimeMs, body });
            send(res, 200, Object.assign(headers, { "Content-Length": body.length }), body);
        });
    });
});
server.keepAliveTimeout = 60000;
server.headersTimeout = 65000;
server.on("error", e => { console.error("serve.js:", e.code === "EADDRINUSE" ? "port " + PORT + " is taken (another server runs there)" : e.message); process.exit(1); });
server.listen(PORT, HOST, () => console.log(`serving ${ROOT} on http://${HOST}:${PORT}/ (Ctrl+C stops)`));
if (process.argv.includes("--stats")) setInterval(() => console.log(`served ${served}, missing ${missing}, cached ${cache.size}`), 10000);
