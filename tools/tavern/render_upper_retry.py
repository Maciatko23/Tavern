# python render_upper_retry.py <jobs.json>  - runs render_upper.js and runs again the jobs whose picture did not come out
# (the headless page now and then misses its first frames and the job times out); up to 3 rounds. CDP_PORT from env.
import sys, os, json, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
jobs = json.load(open(sys.argv[1], encoding="utf-8"))
todo = jobs
for rnd in range(3):
    jf = os.path.join(HERE, "staging", "_jobs_round.json")
    with open(jf, "w", encoding="utf-8") as f:
        json.dump(todo, f)
    r = subprocess.run(["node", os.path.join(HERE, "render_upper.js"), jf], cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace")
    saved = {l.split()[1] for l in r.stdout.splitlines() if l.startswith("saved ")}
    todo = [j for j in todo if j["out"] not in saved]
    print("round", rnd + 1, "saved", len(saved), "left", len(todo))
    if not todo: break
for j in todo: print("FAILED", j["out"])
