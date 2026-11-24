"""Render a 1080x1920 product reel (silent, timed for a voiceover) from a spec.

Usage: python3 make_reel.py spec.json out_dir
spec: {"hook": [lines], "hook_sub": str, "outro_title": [lines], "outro_lines": [..],
       "products": [{"brand": str, "name": str, "price": int, "orig": int|null,
                     "images": [paths]}], "seconds_per_product": 5.5}
"""
import json, math, subprocess, sys, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 1080, 1920, 30
BG = (42, 29, 23); CREAM = (240, 228, 212); ORANGE = (217, 132, 90); MUTED = (190, 170, 150)
LORA = "/usr/share/fonts/truetype/google-fonts/Lora-Variable.ttf"
INTER_B = "/usr/share/fonts/opentype/inter/Inter-Bold.otf"
INTER_S = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
INTER_R = "/usr/share/fonts/opentype/inter/Inter-Regular.otf"
_fc = {}
def F(p, s):
    if (p, s) not in _fc: _fc[(p, s)] = ImageFont.truetype(p, s)
    return _fc[(p, s)]

def inr(n):
    s = str(int(n));
    if len(s) <= 3: return "₹" + s
    head, tail = s[:-3], s[-3:]
    parts = []
    while len(head) > 2: parts.insert(0, head[-2:]); head = head[:-2]
    if head: parts.insert(0, head)
    return "₹" + ",".join(parts) + "," + tail

def load(p):
    im = Image.open(p)
    if im.mode in ("P", "RGBA", "LA"):
        im = im.convert("RGBA"); bg = Image.new("RGB", im.size, (255, 255, 255)); bg.paste(im, mask=im.split()[-1]); im = bg
    return im.convert("RGB")

def cover(im, w, h):
    s = max(w / im.width, h / im.height)
    r = im.resize((math.ceil(im.width * s), math.ceil(im.height * s)), Image.LANCZOS)
    x, y = (r.width - w) // 2, (r.height - h) // 2
    return r.crop((x, y, x + w, y + h))

def blurred_bg(im):
    b = cover(im, W // 4, H // 4).filter(ImageFilter.GaussianBlur(6)).resize((W, H), Image.BILINEAR)
    return Image.blend(b, Image.new("RGB", (W, H), BG), 0.55)

def text_c(d, y, txt, font, fill):
    w = d.textlength(txt, font=font); d.text(((W - w) / 2, y), txt, font=font, fill=fill)

def ease(t): return 0.5 - 0.5 * math.cos(math.pi * max(0, min(1, t)))

class Writer:
    def __init__(self, path):
        self.p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
            "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
            "-pix_fmt", "yuv420p", "-movflags", "+faststart", path], stdin=subprocess.PIPE)
        self.n = 0
    def put(self, im): self.p.stdin.write(im.tobytes()); self.n += 1
    def close(self): self.p.stdin.close(); self.p.wait()

def product_frame(prod, idx, total, img, bgim, t, seg_t):
    """t: 0..1 within this image; seg_t: 0..1 within the product."""
    frame = bgim.copy()
    # product image, slow push-in, fitted into a card
    box_w, box_h = 900, 1200
    z = 1.0 + 0.06 * t
    s = min(box_w / img.width, box_h / img.height) * z
    pim = img.resize((int(img.width * s), int(img.height * s)), Image.LANCZOS)
    cx, cy = W // 2, 300 + box_h // 2
    # crop to box
    left = max(0, (pim.width - box_w) // 2); top = max(0, (pim.height - box_h) // 2)
    pim = pim.crop((left, top, left + min(box_w, pim.width), top + min(box_h, pim.height)))
    mask = Image.new("L", pim.size, 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, *pim.size), radius=36, fill=255)
    frame.paste(pim, (cx - pim.width // 2, cy - pim.height // 2), mask)
    d = ImageDraw.Draw(frame)
    # top bar: counter + brand
    a = ease(seg_t * 6)  # quick slide-in
    d.text((90, 150), f"{idx:02d}/{total:02d}", font=F(INTER_B, 40), fill=ORANGE)
    d.text((90 - int(40 * (1 - a)), 200), prod["brand"], font=F(LORA, 76), fill=CREAM)
    # bottom info card
    y0 = 1540
    d.rounded_rectangle((60, y0, W - 60, y0 + 230), radius=32, fill=(30, 20, 16))
    name = prod["name"]
    nf = F(INTER_S, 40)
    while d.textlength(name, font=nf) > W - 200 and nf.size > 28: nf = F(INTER_S, nf.size - 2)
    d.text((100, y0 + 36), name, font=nf, fill=CREAM)
    px = 100
    d.text((px, y0 + 110), inr(prod["price"]), font=F(INTER_B, 72), fill=ORANGE)
    if prod.get("orig") and prod["orig"] > prod["price"]:
        x2 = px + d.textlength(inr(prod["price"]), font=F(INTER_B, 72)) + 30
        o = inr(prod["orig"]); of = F(INTER_R, 44)
        d.text((x2, y0 + 132), o, font=of, fill=MUTED)
        ow = d.textlength(o, font=of); d.line((x2, y0 + 160, x2 + ow, y0 + 160), fill=MUTED, width=4)
    return frame

def main():
    spec = json.load(open(sys.argv[1])); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
    prods = spec["products"]; n = len(prods); spp = spec.get("seconds_per_product", 5.5)
    imgs = [[load(p) for p in pr["images"]] for pr in prods]
    bgs = [blurred_bg(ims[0]) for ims in imgs]
    wr = Writer(os.path.join(out, "reel_silent.mp4"))
    timeline = []
    # HOOK: flash each product 0.35s with headline over it
    hook_flash = 0.35; t0 = 0.0
    for k in range(n):
        base = cover(imgs[k][0], W, H)
        base = Image.blend(base, Image.new("RGB", (W, H), (0, 0, 0)), 0.45)
        for f in range(int(hook_flash * FPS)):
            fr = base.copy(); d = ImageDraw.Draw(fr)
            y = 640
            for line in spec["hook"]:
                text_c(d, y, line, F(INTER_B, 110), (255, 255, 255)); y += 130
            text_c(d, y + 30, spec["hook_sub"], F(INTER_S, 50), ORANGE)
            wr.put(fr)
    # hold the headline on brand colour for 0.9s
    for f in range(int(0.9 * FPS)):
        fr = Image.new("RGB", (W, H), BG); d = ImageDraw.Draw(fr); y = 640
        for line in spec["hook"]:
            text_c(d, y, line, F(INTER_B, 110), CREAM); y += 130
        text_c(d, y + 30, spec["hook_sub"], F(INTER_S, 50), ORANGE)
        text_c(d, 1700, "TRENDXEE", F(INTER_B, 40), ORANGE)
        wr.put(fr)
    timeline.append(("Hook", 0.0, wr.n / FPS))
    # PRODUCTS
    for i, (pr, ims) in enumerate(zip(prods, imgs), 1):
        start = wr.n / FPS
        frames = int(spp * FPS); per = frames // len(ims)
        for f in range(frames):
            j = min(f // per, len(ims) - 1)
            t = (f - j * per) / per
            wr.put(product_frame(pr, i, n, ims[j], bgs[i - 1], t, f / frames))
        timeline.append((f"{i}. {pr['brand']}", start, wr.n / FPS))
    # OUTRO
    start = wr.n / FPS
    for f in range(int(4.0 * FPS)):
        fr = Image.new("RGB", (W, H), BG); d = ImageDraw.Draw(fr); y = 560
        for line in spec["outro_title"]:
            text_c(d, y, line, F(LORA, 96), CREAM); y += 120
        y += 40
        for line in spec["outro_lines"]:
            text_c(d, y, line, F(INTER_R, 50), MUTED); y += 80
        a = ease(f / 12)
        bw = 560; bx = (W - bw) // 2; by = 1300 + int(30 * (1 - a))
        d.rounded_rectangle((bx, by, bx + bw, by + 110), radius=55, fill=ORANGE)
        text_c(d, by + 28, "trendxee.com", F(INTER_B, 50), BG)
        wr.put(fr)
    timeline.append(("Outro", start, wr.n / FPS))
    wr.close()
    with open(os.path.join(out, "timeline.json"), "w") as fh: json.dump(timeline, fh, indent=1)
    for name, a, b in timeline: print(f"{a:5.1f}s - {b:5.1f}s  {name}")

if __name__ == "__main__":
    main()
