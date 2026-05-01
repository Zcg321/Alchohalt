"""
Generate the Alchohalt app icon set.

Design: a sage-green ring with a small warm-amber dot at the ~5 o'clock
position. The ring intentionally has a small gap at the dot — suggesting
"a path / a moment / not full circle" — on a cream background.

Brand palette (Sprint 2A tokens):
  sage         #5A8073
  cream        #F8F5F0
  indigo       #3D4F7A   (unused here — reserved for accents elsewhere)
  warm amber   #E8A87C

Output (relative to repo root):
  public/icons/icon-1024.png
  public/icons/icon-512.png
  public/icons/icon-192.png
  public/icons/icon-180.png
  public/icons/icon-rounded-1024.png    (22% radius, App Store-style)
  public/icons/maskable-512.png         (PWA maskable, design inside safe zone)
  public/favicon.ico                    (16+32 multi-resolution)

Re-running this script regenerates all artifacts deterministically.
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw

LANCZOS = Image.Resampling.LANCZOS

REPO_ROOT = Path(__file__).resolve().parents[2]
ICON_DIR = REPO_ROOT / "public" / "icons"
FAVICON_PATH = REPO_ROOT / "public" / "favicon.ico"

CREAM = (248, 245, 240, 255)
SAGE = (90, 128, 115, 255)
AMBER = (232, 168, 124, 255)

SUPERSAMPLE = 4
MASTER_SIZE = 1024


def _render_master() -> Image.Image:
    """Render the canonical 1024 design at 4x supersample, downsample with LANCZOS."""
    work_size = MASTER_SIZE * SUPERSAMPLE
    img = Image.new("RGBA", (work_size, work_size), CREAM)
    draw = ImageDraw.Draw(img)

    cx = cy = work_size / 2
    # ring outer ~ 70% of canvas; stroke ~ 9% of canvas
    outer_r = work_size * 0.36
    stroke = work_size * 0.085
    inner_r = outer_r - stroke

    # full annulus
    draw.ellipse(
        [(cx - outer_r, cy - outer_r), (cx + outer_r, cy + outer_r)],
        fill=SAGE,
    )
    draw.ellipse(
        [(cx - inner_r, cy - inner_r), (cx + inner_r, cy + inner_r)],
        fill=CREAM,
    )

    # carve gap at 5 o'clock (~120 degrees in screen coords; PIL angles are CW from 3 o'clock)
    gap_center_deg = 60  # 5 o'clock-ish (3 o'clock = 0, going clockwise/down)
    gap_half_width_deg = 18

    # cover the gap with a cream pie slice that extends past the outer radius
    pie_r = outer_r + stroke  # slightly past the ring so anti-alias seams cleanly
    draw.pieslice(
        [(cx - pie_r, cy - pie_r), (cx + pie_r, cy + pie_r)],
        start=gap_center_deg - gap_half_width_deg,
        end=gap_center_deg + gap_half_width_deg,
        fill=CREAM,
    )

    # amber dot positioned in the center of the gap, on the ring's centerline
    ring_mid_r = (outer_r + inner_r) / 2
    angle_rad = math.radians(gap_center_deg)
    dot_cx = cx + ring_mid_r * math.cos(angle_rad)
    dot_cy = cy + ring_mid_r * math.sin(angle_rad)
    dot_r = stroke * 0.55
    draw.ellipse(
        [(dot_cx - dot_r, dot_cy - dot_r), (dot_cx + dot_r, dot_cy + dot_r)],
        fill=AMBER,
    )

    return img.resize((MASTER_SIZE, MASTER_SIZE), LANCZOS)


def _rounded(square_img: Image.Image, radius_ratio: float = 0.22) -> Image.Image:
    """Apply a rounded-rectangle alpha mask. radius_ratio is fraction of side length."""
    size = square_img.size[0]
    radius = int(size * radius_ratio)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [(0, 0), (size - 1, size - 1)], radius=radius, fill=255
    )
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(square_img, (0, 0), mask)
    return out


def main() -> None:
    ICON_DIR.mkdir(parents=True, exist_ok=True)
    FAVICON_PATH.parent.mkdir(parents=True, exist_ok=True)

    master = _render_master()
    master.save(ICON_DIR / "icon-1024.png", format="PNG", optimize=True)

    for size in (512, 192, 180):
        scaled = master.resize((size, size), LANCZOS)
        scaled.save(ICON_DIR / f"icon-{size}.png", format="PNG", optimize=True)

    rounded = _rounded(master, radius_ratio=0.22)
    rounded.save(ICON_DIR / "icon-rounded-1024.png", format="PNG", optimize=True)

    # PWA maskable: cream-on-cream background fills the full canvas; the design
    # itself sits inside the central 80% safe zone so platforms can crop the
    # outer 10% margin without clipping the mark.
    maskable_size = 512
    safe_size = int(maskable_size * 0.80)
    maskable = Image.new("RGBA", (maskable_size, maskable_size), CREAM)
    inner = master.resize((safe_size, safe_size), LANCZOS)
    offset = (maskable_size - safe_size) // 2
    maskable.paste(inner, (offset, offset), inner)
    maskable.save(ICON_DIR / "maskable-512.png", format="PNG", optimize=True)

    favicon_sizes = [(16, 16), (32, 32), (48, 48)]
    favicon_master = master.resize((48, 48), LANCZOS)
    favicon_master.save(FAVICON_PATH, format="ICO", sizes=favicon_sizes)

    print(f"Wrote icons to {ICON_DIR.relative_to(REPO_ROOT)}")
    print(f"Wrote favicon to {FAVICON_PATH.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
