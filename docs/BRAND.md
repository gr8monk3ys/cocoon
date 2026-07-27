# Cocoon brand guide

Cocoon wraps overwhelming feeds in something softer. The identity should feel
like the product: quiet, warm, and predictable. Nothing in the brand may move,
flash, or shout.

## Logo

The mark is a silk pod wrapped in three curved threads, set on a rounded
square that fades from periwinkle indigo into calm teal — dusk settling into
still water.

- Vector master: `docs/assets/icon.svg`
- Raster sizes: regenerate everything with `npm run icons`
  (`scripts/generate-icons.py`, dependency-free)
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

## Typography

System UI stack everywhere: `ui-sans-serif, system-ui, -apple-system,
"Segoe UI", Roboto, sans-serif`. No webfonts — they add load, motion (FOUT),
and a privacy surface. Headings are set tight (`letter-spacing: -0.01em`);
body text at 14px/1.45 in the extension, 16px on the site.

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
