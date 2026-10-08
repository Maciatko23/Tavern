# Writes tools/torch/tips.json into Torch.js (its TIPS table: [x, y] or [x, y, 1] = behind him) after build_torch_walk.py.
#   python tools/torch/write_tips.py
import json
GAME = __file__.replace("\\", "/").rsplit("/tools/", 1)[0] + "/"
t = json.load(open(GAME + "tools/torch/tips.json", encoding="utf8"))
p = GAME + "js/plugins/Torch.js"
s = open(p, "rb").read().decode("utf8")


def rows(name):
    return json.dumps([[[int(round(x)), int(round(y))] + ([1] if b else []) for x, y, b in row] for row in t[name]["tips"]], separators=(",", ":"))


start = s.index("    const TIPS = {")
end = s.index("    };", start) + len("    };\n")
new = "    const TIPS = {\n        Hero_TorchWalk: %s,\n        Hero_TorchRun: %s,\n        Hero_TorchSneak: %s\n    };\n" % (rows("Hero_TorchWalk"), rows("Hero_TorchRun"), rows("Hero_TorchSneak"))
s = s[:start] + new + s[end:]
open(p, "wb").write(s.encode("utf8"))
print("TIPS ->", p)
