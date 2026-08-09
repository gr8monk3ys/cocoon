# Cocoon brand guide

Cocoon wraps overwhelming feeds in something softer. The identity should feel
like the product: quiet, warm, and predictable. Nothing in the brand may move,
flash, or shout.

## Logo

The mark is a silk pod wrapped in three diagonal threads, set on a rounded
square that fades from periwinkle indigo into calm teal — dusk settling into
still water.

The pod is **asymmetric**: rounded at the top, tapering to a soft point at the
bottom, like a chrysalis hanging from a branch. Three cues make it read as
wound silk rather than as a stack of discs, and all three are load-bearing:

1. threads tilted off horizontal (`BAND_SLOPE`)
2. uneven spacing, tighter toward the narrow end, as real winding is
3. an asymmetric silhouette, so there *is* a narrow end

An earlier version used three parallel horizontal bands inside a symmetric
ellipse and read as a stack of coins. Parallel horizontal lines say "layers
stacked"; a subtle centre dip is not enough to overcome that. If you adjust the
mark, keep the diagonal.

- Vector master: `docs/assets/icon.svg`
- Raster sizes: regenerate everything with `npm run icons`
  (`scripts/generate-icons.py`, dependency-free)
- **The SVG is generated from the same geometry as the PNGs.** Don't hand-edit
  `icon.svg` — it is overwritten on every run. It used to be a separate
  hand-written constant, which meant a redesign could silently leave the site
  and store logo on the old mark.
- Extension sizes (`public/icons/`): 16, 32, 48, 128
- Site/store sizes (`docs/assets/`): 128, 512

Don't recolor the mark, add text inside it, or place it on busy imagery. On
dark surfaces it needs no treatment; on mid-tone surfaces give it a
`#F5F7FF` keyline or padding.

## Color

| Token | Hex | Use |
| --- | --- | --- |
| Periwinkle | `#636EFA` | Gradient start, focus rings |
| Calm teal | `#33C9C0` | Gradient end, decorative accents |
| Indigo ink | `#3B4AC4` | Primary buttons, links, silk threads |
| Deep ink | `#20264A` | Body text |
| Muted ink | `#5A6180` | Secondary text |
| Silk | `#F5F7FF` | Pod fill, light surfaces |
| Mist | `#F4F5FC` | Page background |
| Teal ink | `#17706B` | Success/confirmation text |
| Quiet red | `#A3333D` | Inline validation errors |

The indigo→teal gradient (`#636EFA → #33C9C0`, vertical or 90°) is the one
expressive element; use it sparingly — the icon, a hairline "silk thread"
divider, a hero band. Everything else stays flat and calm.

All text pairings above meet WCAG AA on their intended backgrounds. The UI
theme (`src/ui/theme.css`) defines the same tokens as CSS custom properties,
with a dark-scheme variant.

## Layout

Two rules govern both the extension UI and the site. Both are product
constraints before they are taste — the audience is people reducing sensory
load, so edges and contrast are costs, not neutral.

**Separate with space and one thread, never with boxes.** Each section hangs
off a 2px indigo→teal rail on its left, at 50% opacity. Nested bordered cards
give every section identical weight and fill the view with edges; one line does
the same job with a quarter of the noise. A section nested inside another gets
a flat tinted panel instead of a second rail, so rails never stack.

The same thread appears once more as a 44px stub under the masthead. It was
previously a full-width bar, which competed with the rails and read as a plain
underline. This is the only gradient in the UI, and it earns its place by doing
structural work.

**Never ship a native form control.** `appearance: none` on every `select` and
`checkbox`, with the chevron and checkmark drawn as inline SVG data URIs (one
pair per colour scheme, since a data URI cannot inherit `currentColor`).
`accent-color` alone is not enough — it recolors the tick while leaving the box
the platform's, which is what makes an otherwise-styled UI look unfinished.

## Typography

System UI stack everywhere: `ui-sans-serif, system-ui, -apple-system,
"Segoe UI", Roboto, sans-serif`. No webfonts — they add load, motion (FOUT),
and a privacy surface.

Hierarchy comes from **treatment, not size**, which keeps contrast low while
still making structure obvious:

| Role | Treatment |
| --- | --- |
| Page title | 19px popup / 26–30px site, 600, `-0.015em` |
| Section heading | 11.5px, 600, uppercase, `+0.09em`, muted — an eyebrow |
| Body | 14px/1.5 extension, 16px site |
| Hint | 12.5px muted |

Section headings are deliberately *smaller* than body text. Making them large
and dark would add contrast the audience is here to avoid; letterspaced
uppercase reads as a label at a glance without shouting. Six near-identical
sizes between 12 and 15px — the previous scale — is not a hierarchy, it is
noise.

## Motion

None. No transitions, no animations, no parallax, no auto-playing anything.
This is a hard rule, not a preference — reduce-motion is a core product
feature and the brand must model it.

## Voice

- Calm and concrete: "Feed filtered on this site." — not "Success! 🎉"
- Never clinical or diagnostic: profiles are starting points users own, not
  labels applied to them.
- No urgency, no guilt, no streaks, no engagement mechanics.
- Sentence case everywhere, including buttons.
