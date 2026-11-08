"""
Prepare the portrait for the particle engine.

- Removes the flat studio background (GrabCut seeded from the image border).
- Crops to head + upper shoulders so the face dominates the composition.
- Writes an RGBA WebP used at runtime by the particle sampler worker.

Usage:  python3 scripts/prepare-portrait.py <input.png> <output.webp>
"""
import sys

import cv2
import numpy as np
from PIL import Image

src_path, out_path = sys.argv[1], sys.argv[2]

img = cv2.imread(src_path, cv2.IMREAD_COLOR)
h, w = img.shape[:2]

# --- GrabCut segmentation -----------------------------------------------------
scale = 640 / max(h, w)
small = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
sh, sw = small.shape[:2]

mask = np.full((sh, sw), cv2.GC_PR_BGD, np.uint8)
# Anything close to the measured background grey is "probably background"
border = np.concatenate([small[:8].reshape(-1, 3), small[:, :8].reshape(-1, 3), small[:, -8:].reshape(-1, 3)])
bg = np.median(border, axis=0)
dist = np.linalg.norm(small.astype(np.float32) - bg, axis=2)
mask[dist > 38] = cv2.GC_PR_FGD
# Hard constraints: borders are background, face core is foreground
mask[:6, :] = cv2.GC_BGD
mask[:, :6] = cv2.GC_BGD
mask[:, -6:] = cv2.GC_BGD
cx, cy = int(sw * 0.51), int(sh * 0.40)
mask[cy - int(sh * 0.18): cy + int(sh * 0.2), cx - int(sw * 0.15): cx + int(sw * 0.15)] = cv2.GC_FGD

bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
cv2.grabCut(small, mask, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
fg = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)

# keep the largest component, fill holes, smooth edges
n, labels, stats, _ = cv2.connectedComponentsWithStats(fg)
largest = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
fg = np.where(labels == largest, 255, 0).astype(np.uint8)
fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
fg = cv2.resize(fg, (w, h), interpolation=cv2.INTER_NEAREST)

# Remove background-grey pockets GrabCut kept (e.g. the gap between neck and collar):
# pixels that are both close to the backdrop colour and low-saturation.
full_dist = np.linalg.norm(img.astype(np.float32) - bg, axis=2)
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
greyish = (full_dist < 30) & (hsv[:, :, 1] < 40)
greyish = cv2.morphologyEx(greyish.astype(np.uint8) * 255, cv2.MORPH_OPEN,
                           cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
greyish[int(h * 0.64):, :] = 0  # only above the shirt, where shadows in the fabric are grey too
fg[greyish > 0] = 0
fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
fg = cv2.GaussianBlur(fg, (0, 0), 2.2)

rgba = cv2.cvtColor(img, cv2.COLOR_BGR2RGBA)
rgba[:, :, 3] = fg

# --- Crop: head + top of the shoulders ------------------------------------------
x0, x1 = int(w * 0.12), int(w * 0.88)
y0, y1 = 0, int(h * 0.86)
crop = Image.fromarray(rgba[y0:y1, x0:x1])
target_h = 760
crop = crop.resize((round(crop.width * target_h / crop.height), target_h), Image.LANCZOS)
crop.save(out_path, "WEBP", quality=88, method=6)

# debug preview on black
prev = Image.new("RGBA", crop.size, (0, 0, 0, 255))
prev.alpha_composite(crop)
prev.convert("RGB").save("/tmp/portrait-preview.png")
print("saved", out_path, crop.size)
