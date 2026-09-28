# python ab_compare.py <a.png> <b.png> <out.png> : side by side + the mean absolute difference (0-255) of two game screens
import sys
import numpy as np
from PIL import Image, ImageDraw
a, b = Image.open(sys.argv[1]).convert("RGB"), Image.open(sys.argv[2]).convert("RGB")
A, B = np.array(a).astype(np.int32), np.array(b).astype(np.int32)
diff = np.abs(A - B)
print("mean abs diff %.2f, 99th percentile %.1f, max %d" % (diff.mean(), np.percentile(diff, 99), diff.max()))
out = Image.new("RGB", (a.size[0] * 2 + 10, a.size[1]), (0, 0, 0))
out.paste(a, (0, 0)); out.paste(b, (a.size[0] + 10, 0))
out.save(sys.argv[3])
