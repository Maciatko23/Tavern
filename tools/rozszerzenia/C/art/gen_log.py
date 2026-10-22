# Dopisuje generację PixelLab do tools/rozszerzenia/C/generacje.json (LF, UTF-8) i liczy "zuzyte".
#   python gen_log.py "<co>" <narzedzie> <id> <generacje>
import json, os, sys, datetime
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "generacje.json")
co, narz, jid, g = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])
with open(P, "rb") as f:
    d = json.loads(f.read().decode("utf-8"))
d["lista"].append({"co": co, "narzedzie": narz, "id": jid, "generacje": int(g) if g == int(g) else g,
                   "dzien": datetime.date.today().isoformat()})
d["zuzyte"] = sum(e["generacje"] for e in d["lista"])
with open(P, "wb") as f:
    f.write((json.dumps(d, ensure_ascii=False, indent=2) + "\n").encode("utf-8"))
print("zuzyte:", d["zuzyte"], "/", d["budzet"])
