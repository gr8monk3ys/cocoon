#!/usr/bin/env python3
"""Generate Cocoon extension icons with no third-party dependencies.

Renders a rounded-square app icon with a calm indigo->teal gradient and a
white "cocoon pod" motif wrapped in silk bands. Anti-aliased via 4x4
supersampling and written as straight-alpha RGBA PNGs (hand-rolled encoder so
the repo needs no Pillow/sharp/ImageMagick).

Usage: python3 scripts/generate-icons.py
Outputs: public/icons/icon-16.png, -32, -48, -128 and icon.svg
"""

import math
import os
import struct
import zlib

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "icons")
DOCS_ASSETS = os.path.join(os.path.dirname(__file__), "..", "docs", "assets")
# Sizes the extension manifest references (shipped in the zip).
SIZES = [16, 32, 48, 128]
# Sizes mirrored into the GitHub Pages site so its logo matches the extension.
# 512 is site/store-only, so it is not written into public/icons.
SITE_SIZES = [128, 512]

# Palette
TOP = (0x63, 0x6E, 0xFA)  # periwinkle indigo
BOTTOM = (0x33, 0xC9, 0xC0)  # calm teal
POD = (245, 247, 255)  # near-white silk
BAND = (0x3B, 0x4A, 0xC4)  # indigo wrap line
BANDS = (-0.55, 0.0, 0.55)  # band centers in pod-normalized y


def write_png(path, size, pixels):
    raw = bytearray()
    stride = size * 4
    for y in range(size):
        raw.append(0)  # filter: none
        raw.extend(pixels[y * stride : (y + 1) * stride])
    comp = zlib.compress(bytes(raw), 9)

    def chunk(tag, data):
        body = tag + data
        return (
            struct.pack(">I", len(data))
            + body
            + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)
        )

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(chunk(b"IHDR", ihdr))
        f.write(chunk(b"IDAT", comp))
        f.write(chunk(b"IEND", b""))


def render(size):
    ss = 4
    cx = cy = size / 2.0
    margin = 0.03 * size
    half = size / 2.0 - margin
    corner = 0.28 * size
    pod_rx = 0.215 * size
    pod_ry = 0.33 * size
    px = bytearray(size * size * 4)

    for y in range(size):
        for x in range(size):
            sum_r = sum_g = sum_b = 0.0
            covered = 0.0
            for sy in range(ss):
                for sx in range(ss):
                    fx = x + (sx + 0.5) / ss
                    fy = y + (sy + 0.5) / ss
                    # signed distance to rounded rect (<=0 means inside)
                    dx = abs(fx - cx) - (half - corner)
                    dy = abs(fy - cy) - (half - corner)
                    dist = (
                        math.hypot(max(dx, 0.0), max(dy, 0.0))
                        + min(max(dx, dy), 0.0)
                        - corner
                    )
                    if dist > 0.0:
                        continue
                    t = fy / size
                    r = TOP[0] + (BOTTOM[0] - TOP[0]) * t
                    g = TOP[1] + (BOTTOM[1] - TOP[1]) * t
                    b = TOP[2] + (BOTTOM[2] - TOP[2]) * t
                    ex = (fx - cx) / pod_rx
                    ey = (fy - cy) / pod_ry
                    if ex * ex + ey * ey <= 1.0:
                        r, g, b = POD
                        yy = (fy - cy) / pod_ry
                        if any(abs(yy - ly) < 0.07 for ly in BANDS):
                            r = r * 0.5 + BAND[0] * 0.5
                            g = g * 0.5 + BAND[1] * 0.5
                            b = b * 0.5 + BAND[2] * 0.5
                    sum_r += r
                    sum_g += g
                    sum_b += b
                    covered += 1.0

            idx = (y * size + x) * 4
            if covered > 0.0:
                px[idx] = int(sum_r / covered + 0.5)
                px[idx + 1] = int(sum_g / covered + 0.5)
                px[idx + 2] = int(sum_b / covered + 0.5)
                px[idx + 3] = int(covered / (ss * ss) * 255 + 0.5)
            # else fully transparent (already zeroed)
    return px


SVG = """<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#636EFA"/>
      <stop offset="1" stop-color="#33C9C0"/>
    </linearGradient>
  </defs>
  <rect x="4" y="4" width="120" height="120" rx="34" fill="url(#g)"/>
  <g>
    <ellipse cx="64" cy="64" rx="27.5" ry="42" fill="#F5F7FF"/>
    <g stroke="#3B4AC4" stroke-width="3.4" stroke-linecap="round" opacity="0.85">
      <line x1="41" y1="41" x2="87" y2="41"/>
      <line x1="37" y1="64" x2="91" y2="64"/>
      <line x1="41" y1="87" x2="87" y2="87"/>
    </g>
  </g>
</svg>
"""


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    rendered = {}
    for size in SIZES:
        rendered[size] = render(size)
        write_png(os.path.join(OUT_DIR, f"icon-{size}.png"), size, rendered[size])
        print(f"wrote icon-{size}.png")
    with open(os.path.join(OUT_DIR, "icon.svg"), "w") as f:
        f.write(SVG)
    print("wrote icon.svg")

    os.makedirs(DOCS_ASSETS, exist_ok=True)
    for size in SITE_SIZES:
        px = rendered.get(size) or render(size)
        write_png(os.path.join(DOCS_ASSETS, f"icon-{size}.png"), size, px)
        print(f"wrote docs/assets/icon-{size}.png")


if __name__ == "__main__":
    main()
