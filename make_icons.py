from PIL import Image, ImageDraw, ImageFont

KRAFT = (223, 203, 164, 255)
STAMP = (153, 42, 27, 255)
SIZE = 512

img = Image.new("RGBA", (SIZE, SIZE), KRAFT)
layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
d = ImageDraw.Draw(layer)
d.rounded_rectangle([106, 176, 406, 336], radius=18, outline=STAMP, width=12)

font = None
for p in [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
]:
    try:
        font = ImageFont.truetype(p, 120)
        break
    except Exception:
        pass

if font:
    bbox = d.textbbox((0, 0), "MS", font=font)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text(((SIZE - w) / 2 - bbox[0], (SIZE - h) / 2 - bbox[1]), "MS", font=font, fill=STAMP)

layer = layer.rotate(-4, resample=Image.BICUBIC, center=(SIZE / 2, SIZE / 2))
img.alpha_composite(layer)
img.convert("RGB").save("icon-512.png")
img.convert("RGB").resize((192, 192), Image.LANCZOS).save("icon-192.png")
print("icons written")
