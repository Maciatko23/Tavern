// Notifications to the phone during long runs (the marathon, the fast forward) - the user, 2026-09-27: "wysyłać mi co jakiś czas
// powiadomienia". Through ntfy.sh: the ntfy app on the phone subscribes to a private topic, kept in tests/marathon/notify.json
// ({ "ntfy": "<topic>" }, not in git). No settings file: nothing is sent. A failed send never stops the run.
const fs = require("fs"), path = require("path"), https = require("https");

function topic() {
    try { return JSON.parse(fs.readFileSync(path.join(__dirname, "marathon", "notify.json"), "utf8")).ntfy || null; } catch (e) { return null; }
}
function request(method, url, headers, body) {
    return new Promise(res => {
        try {
            const req = https.request(url, { method, headers, timeout: 15000 }, r => { r.resume(); r.on("end", () => res(r.statusCode)); });
            req.on("error", () => res(0));
            req.on("timeout", () => { req.destroy(); res(0); });
            req.end(body);
        } catch (e) { res(0); }
    });
}
// text: the message; opts.title, opts.tags (e.g. ["warning"]), opts.priority (1-5), opts.file (a picture sent along)
async function notify(text, opts = {}) {
    const t = topic();
    if (!t) return 0;
    if (opts.file && fs.existsSync(opts.file)) {   // (a picture: the file is the body, the words go in the query - UTF-8 safe)
        const q = new URLSearchParams({ message: text, filename: path.basename(opts.file) });
        if (opts.title) q.set("title", opts.title);
        if (opts.tags) q.set("tags", opts.tags.join(","));
        if (opts.priority) q.set("priority", String(opts.priority));
        return request("PUT", `https://ntfy.sh/${encodeURIComponent(t)}?${q}`, {}, fs.readFileSync(opts.file));
    }
    const body = JSON.stringify({ topic: t, message: text, title: opts.title, tags: opts.tags, priority: opts.priority });
    return request("POST", "https://ntfy.sh/", { "Content-Type": "application/json" }, body);
}
module.exports = { notify, topic };

if (require.main === module) {   // node notify.js "a message" - a test
    notify(process.argv[2] || "Test: powiadomienia z Tawerny działają", { title: "Tawerna", tags: ["white_check_mark"] }).then(code => console.log(code ? "sent (" + code + ")" : "not sent (no notify.json or no network)"));
}
