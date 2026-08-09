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

# Palette (the brand anchors documented in docs/BRAND.md)
TOP = (0x63, 0x6E, 0xFA)  # periwinkle indigo
BOTTOM = (0x33, 0xC9, 0xC0)  # calm teal
POD = (245, 247, 255)  # near-white silk
BAND = (0x3B, 0x4A, 0xC4)  # indigo wrap thread
# Silk threads.
#
# The previous mark used three PARALLEL HORIZONTAL bands inside a SYMMETRIC
# ellipse, which reads as a stack of coins rather than a wrapped pod: parallel
# horizontal lines say "layers stacked", and a 0.12 dip is far too subtle to
# overcome that. Wound thread reads instead from three cues, all used here:
#   1. bands tilted off horizontal (BAND_SLOPE)
#   2. uneven spacing, tighter toward the narrow end, as real winding is
#   3. an asymmetric silhouette so there IS a narrow end (see pod_half_width)
BANDS = (-0.46, 0.06, 0.56)  # band centers in pod-normalized y
BAND_SLOPE = -0.42  # rise across the pod's half-width: tilts bands off horizontal
BAND_DIP = 0.10  # extra dip at the pod's horizontal center (wrap illusion)
BAND_HALF_WIDTH = 0.078  # half-thickness of a band in pod-normalized y

# Pod silhouette: rounded at the top, tapering to a soft point at the bottom,
# like a chrysalis hanging from a branch. The asymmetry is what stops it
# reading as an egg or a jar.
POD_TOP_POWER = 0.50  # ~0.5 is a true ellipse half
POD_BOTTOM_POWER = 1.35  # >0.5 tapers to a point


def pod_half_width(t):
    """Half-width of the pod at pod-normalized height t in [-1, 1], where
    t = -1 is the top tip and t = +1 the bottom tip. Returns a fraction of the
    pod's max half-width."""
    if abs(t) >= 1.0:
        return 0.0
    power = POD_TOP_POWER if t < 0 else POD_BOTTOM_POWER
    return (1.0 - t * t) ** power


def band_offset(ex):
    """Vertical offset applied to every band centre at normalized x `ex`.
    Tilt plus a centre dip: together they read as thread passing around a
    three-dimensional form rather than lying flat across a disc."""
    return BAND_SLOPE * ex + BAND_DIP * (1.0 - ex * ex)


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
    pod_rx = 0.20 * size
    pod_ry = 0.345 * size
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
                    if abs(ey) < 1.0 and abs(ex) <= pod_half_width(ey):
                        r, g, b = POD
                        # Normalize x across the pod's width AT THIS HEIGHT, so
                        # the tilt+dip follow the silhouette instead of running
                        # off it near the tapered end.
                        w = pod_half_width(ey)
                        exn = ex / w if w > 0.0 else 0.0
                        if any(
                            abs(ey - (ly + band_offset(exn))) < BAND_HALF_WIDTH
                            for ly in BANDS
                        ):
                            # 0.35/0.65 rather than an even blend: at an even
                            # mix the indigo thread washes out to pale lavender
                            # against the silk pod and the wrap stops reading.
                            r = r * 0.35 + BAND[0] * 0.65
                            g = g * 0.35 + BAND[1] * 0.65
                            b = b * 0.35 + BAND[2] * 0.65
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


def build_svg(size=128):
    """Vector master, derived from the SAME pod_half_width/band_offset used by
    the raster renderer.

    Previously the SVG was a hand-written constant duplicating the raster
    geometry, so the two could drift silently — a redesign that touched only
    the Python constants would leave the site and store logo on the old mark.
    Sampling both from one source removes that class of bug entirely.
    """
    cx = cy = size / 2.0
    pod_rx = 0.20 * size
    pod_ry = 0.345 * size
    margin = 0.03 * size
    rect_xy = margin
    rect_wh = size - 2 * margin
    steps = 96

    def fmt(x, y):
        return f"{x:.2f} {y:.2f}"

    # Pod outline: down the right edge, back up the left.
    right, left = [], []
    for i in range(steps + 1):
        t = -1.0 + 2.0 * i / steps
        w = pod_half_width(t) * pod_rx
        y = cy + t * pod_ry
        right.append(fmt(cx + w, y))
        left.append(fmt(cx - w, y))
    outline = "M" + " L".join(right + list(reversed(left))) + " Z"

    # Band centrelines, parametrised across the pod's width at each height.
    bands = []
    for ly in BANDS:
        pts = []
        for i in range(steps + 1):
            exn = -1.0 + 2.0 * i / steps
            ey = ly + band_offset(exn)
            if abs(ey) >= 1.0:
                continue
            w = pod_half_width(ey) * pod_rx
            pts.append(fmt(cx + exn * w, cy + ey * pod_ry))
        if len(pts) > 1:
            bands.append("M" + " L".join(pts))

    stroke = 2.0 * BAND_HALF_WIDTH * pod_ry
    band_paths = "\n    ".join(f'<path d="{d}"/>' for d in bands)
    pod_hex = "#%02X%02X%02X" % POD
    band_hex = "#%02X%02X%02X" % BAND
    top_hex = "#%02X%02X%02X" % TOP
    bottom_hex = "#%02X%02X%02X" % BOTTOM

    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{top_hex}"/>
      <stop offset="1" stop-color="{bottom_hex}"/>
    </linearGradient>
    <clipPath id="pod">
      <path d="{outline}"/>
    </clipPath>
  </defs>
  <rect x="{rect_xy:.0f}" y="{rect_xy:.0f}" width="{rect_wh:.0f}" height="{rect_wh:.0f}" rx="{0.28 * size:.0f}" fill="url(#g)"/>
  <path d="{outline}" fill="{pod_hex}"/>
  <g clip-path="url(#pod)" fill="none" stroke="{band_hex}" stroke-width="{stroke:.1f}" stroke-linecap="round" opacity="0.9">
    {band_paths}
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

    # The SVG master lives with the site assets (not public/) so it is not
    # copied into dist/ — the manifest only references the PNG sizes.
    os.makedirs(DOCS_ASSETS, exist_ok=True)
    with open(os.path.join(DOCS_ASSETS, "icon.svg"), "w") as f:
        f.write(build_svg())
    print("wrote docs/assets/icon.svg")

    for size in SITE_SIZES:
        px = rendered.get(size) or render(size)
        write_png(os.path.join(DOCS_ASSETS, f"icon-{size}.png"), size, px)
        print(f"wrote docs/assets/icon-{size}.png")


if __name__ == "__main__":
    main()
