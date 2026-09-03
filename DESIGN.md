---
name: Cocoon
description: A calm, flat, motionless control surface for an extension that removes algorithmic feeds.
colors:
  ink: "#20264a"
  muted: "#5a6180"
  bg: "#f7f8fd"
  surface: "#ffffff"
  border: "#d8dcef"
  field: "#ffffff"
  primary: "#3b4ac4"
  primary-hover: "#333fa8"
  on-primary: "#ffffff"
  primary-soft: "#eef1fe"
  primary-soft-border: "#c7cdf4"
  focus: "#636efa"
  teal-ink: "#17706b"
  error: "#a3333d"
  error-soft: "#fdeef0"
  thread-start: "#636efa"
  thread-end: "#33c9c0"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "19px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "-0.015em"
  title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "normal"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "11.5px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.09em"
rounded:
  thread: "2px"
  focus: "4px"
  check: "6px"
  icon: "7px"
  control: "9px"
  panel: "10px"
  dialog: "14px"
  pill: "999px"
spacing:
  hairline: "2px"
  xs: "6px"
  sm: "8px"
  md: "10px"
  lg: "12px"
  field: "14px"
  gutter: "16px"
  edge: "18px"
  section: "22px"
components:
  button-secondary:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 14px"
    typography: "{typography.title}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.control}"
    padding: "9px 14px"
    typography: "{typography.title}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
  button-small:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "7px 12px"
  input-text:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 11px"
  select:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 32px 9px 11px"
  checkbox:
    backgroundColor: "{colors.field}"
    rounded: "{rounded.check}"
    width: "18px"
    height: "18px"
  checkbox-checked:
    backgroundColor: "{colors.primary}"
    rounded: "{rounded.check}"
    width: "18px"
    height: "18px"
  section-rail:
    padding: "2px 0 2px 16px"
  panel-nested:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "12px 14px"
  notice-error:
    backgroundColor: "{colors.error-soft}"
    textColor: "{colors.error}"
    rounded: "{rounded.control}"
    padding: "8px 11px"
  suggestion:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.ink}"
    padding: "11px 13px"
---

# Design System: Cocoon

## Overview

**Creative North Star: "The Silk Thread"**

Cocoon is a control surface for people actively reducing sensory load, so the
interface has to survive the standard it sets for other people's websites. It is
built almost entirely from space. Structure is marked by a single 2px gradient
thread — first as the mark under the masthead, then as the left rail of every
section — and that thread is the only ornament in the system. It is also the only
gradient. Because it is doing structural work rather than decorating, it earns
its place; a second decorative flourish anywhere would not.

The system is mineral rather than soft: Deep Slate Navy text on a cool near-white
ground, a Quiet Cobalt accent used sparingly, and a Cobalt-to-Verdigris thread.
Hierarchy comes from **treatment rather than size** — section headings are small
letterspaced eyebrows, quieter and smaller than the body text they introduce.
That keeps overall contrast low, which is correct for this audience, while still
making structure obvious at a glance.

Two absolutes shape everything else. There is **no motion** — not a transition,
not an animation, nowhere — because reduce-motion is a product feature and the
interface models what it sells. And there are **no native controls**: Chrome's
own chevrons, checkboxes and borders are replaced outright, because a
half-styled control is what makes an otherwise-considered UI look unfinished.

**Key Characteristics:**

- One 2px gradient thread carries all structural marking; no bordered cards
- Zero shadows, zero transitions, zero animations in Cocoon's own pages
- Headings smaller and quieter than body text; hierarchy from letterspacing
- Every form control drawn by Cocoon, none by the platform
- Full light and dark schemes; every token has both
- Cool, mineral, low-contrast; the accent is rare enough to mean something

## Colors

A cool mineral palette: slate-navy ink on near-white, one cobalt accent, and a
verdigris reserved for confirmation.

### Primary

- **Quiet Cobalt** (`#3b4ac4`): the single accent. Primary buttons, checked
  checkboxes, the accent rail on a suggestion. Rare on purpose.
- **Cobalt Deep** (`#333fa8`): primary button hover only.
- **Cobalt Wash** (`#eef1fe`): the tinted ground for secondary buttons, nested
  panels and the suggestion block. This is how depth is expressed instead of shadow.
- **Cobalt Edge** (`#c7cdf4`): the hairline on a secondary button.

### Secondary

- **Signal Iris** (`#636efa`): the focus ring, and the top stop of the thread
  gradient. Brighter than the accent because it must be unmissable.
- **Verdigris** (`#33c9c0`): the bottom stop of the thread gradient.
- **Deep Verdigris** (`#17706b`): confirmation text only ("Saved.").

### Tertiary

The error role, and the only warm colour in the system.

- **Muted Oxblood** (`#a3333d`) on **Oxblood Wash** (`#fdeef0`): inline validation.
  Errors get a 2px left border, the same vocabulary as the section rail.

### Neutral

- **Deep Slate Navy** (`#20264a`): all primary text.
- **Slate Muted** (`#5a6180`): section eyebrows, hints, placeholders, secondary
  copy — everything explicitly demoted.
- **Cool Paper** (`#f7f8fd`): the page ground.
- **Surface White** (`#ffffff`): fields, and the raised surface where one is needed.
- **Cool Grey Edge** (`#d8dcef`): the only border colour — inputs and checkboxes.

### Dark scheme

Every token above has a dark counterpart under `prefers-color-scheme: dark`, and
the roles invert cleanly: the accent lightens to **Periwinkle** (`#8d96ff`) and
carries dark ink (`#171a2f`) on top, because a dark-scheme accent that keeps
white text fails contrast. The chevron and checkmark are inlined per scheme as
separate data URIs — a data URI cannot inherit `currentColor`.

### Named Rules

**The One Gradient Rule.** The Cobalt→Verdigris thread is the only gradient in
the system. It appears exactly twice per page: the masthead mark and the section
rails. A second gradient anywhere is a defect.

**The Rare Accent Rule.** Quiet Cobalt is load-bearing precisely because it is
scarce. It marks the one primary action and the one checked state. It never
becomes a heading colour, a border default, or decoration.

**The Verdigris-for-Done Rule.** Deep Verdigris appears only on confirmation. It
never labels, never decorates, never becomes a second accent.

## Typography

**Display Font:** the system UI stack (`ui-sans-serif, system-ui, -apple-system,
"Segoe UI", Roboto, sans-serif`)
**Body Font:** the same stack
**Label Font:** the same stack

**Character:** one family throughout, deliberately. A webfont would mean a
network request, which the product forbids, and the system stack renders
instantly and matches the browser chrome the popup hangs off. Personality comes
from weight, letterspacing and case rather than from a typeface.

### Hierarchy

- **Display** (600, 26px, 1.5, `-0.015em`): the options page title only.
- **Headline** (600, 19px, 1.5, `-0.015em`): the popup title only.
- **Title** (600, 13px, 1.5): sub-headings inside a section, and button labels.
- **Body** (400, 14px, 1.5): all running text and control labels. Field labels
  take weight 500.
- **Label** (600, 11.5px, 1.5, `0.09em`, uppercase, Slate Muted): section
  eyebrows. Smaller and quieter than the body text beneath them.

Supporting sizes: hints and small buttons at 12.5px; buttons, errors and
suggestions at 13px.

### Named Rules

**The Eyebrow Rule.** A section heading is never larger than the text it
introduces. Structure reads from letterspacing, case and colour — 11.5px, 600,
`0.09em`, uppercase, muted — never from size. Making a heading bigger to make it
clearer is the wrong fix here.

**The One Step Down Rule.** Controls sit one step below body text (13px against
14px). The interface never shouts a label at the user.

## Layout

Two fixed surfaces, both single-column.

- **Popup:** 340px wide, fixed. `16px 18px 18px` padding. It is never
  responsive — a browser popup has exactly one width.
- **Options:** 680px max-width, centred, `40px` above and `64px` below, `20px`
  side padding. Comfortably under a measure that would hurt readability.

Sections stack with `22px` between them and hang off a 16px left gutter, which is
where the thread rail sits. Within a section: fields `14px` apart, checkbox rows
`10px` apart, and a hint indents `28px` so it aligns under its checkbox's label
rather than the checkbox itself.

Inline forms are explicit CSS grids sized to their content, not flex wraps — the
hostname row is `1fr auto auto`, the schedule row is `84px 84px 1fr auto`. Scenario
buttons sit in a grid: one column in the popup, two on the options page
(`minmax(140px, 1fr)`).

The spacing scale is `2 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 22`, plus `40` and
`64` for page margins.

### Named Rules

**The Fixed Popup Rule.** 340px is the popup's only width. Do not add
breakpoints, fluid widths or responsive behaviour to it.

## Elevation & Depth

**Cocoon's own pages are completely flat. There are no shadows in `theme.css` at
all.** Depth is expressed two other ways: tonal layering (a nested panel is a
flat Cobalt Wash fill, never a raised card) and the thread rail, which separates
by marking rather than by lifting.

The exception is deliberate and worth stating precisely: the two surfaces Cocoon
**injects into other people's pages** — the rot banner and the grounding overlay
— do carry shadow, because they must read as belonging to Cocoon rather than to
the host site, and they have no ground of their own to sit on.

### Shadow Vocabulary (injected surfaces only)

- **Banner lift** (`box-shadow: 0 2px 8px rgba(32,38,74,0.08)`): the in-page feed
  notice. Just enough to detach from unknown markup.
- **Overlay lift** (`box-shadow: 0 18px 50px rgba(23,26,47,0.35)`): the grounding
  dialog panel.
- **Overlay scrim** (`background: rgba(23,26,47,0.55)`): the grounding backdrop.

### Named Rules

**The Flat-Home Rule.** No shadow appears on the popup or the options page, in
any state. If a surface needs separation there, it gets space, a tonal fill, or
the rail.

**The Foreign Ground Rule.** Injected in-page surfaces carry a fixed light
treatment (`#fdfdff` / `#eef1fe` grounds, Deep Slate Navy ink) that does **not**
follow Cocoon's dark tokens. This is deliberate: they render on markup Cocoon
does not control and underneath Cocoon's own colour-inversion filter, where
predictable is worth more than consistent. Do not "fix" them by theming them.

## Shapes

A short radius ladder, applied by function rather than by size:

- **2px** — the thread, in both its roles.
- **4px** — the focus ring's own radius.
- **6px** — the custom checkbox.
- **7px** — the masthead icon.
- **9px** — every control: buttons, selects, text and number inputs, error
  notices. This is the system's default corner.
- **10px** — a nested tinted panel, and the injected in-page banner.
- **14px** — the injected grounding dialog panel.
- **999px** — pill controls, used only inside injected surfaces (the banner's
  Dismiss and the dialog's Continue browsing).
- **36px on a 128px canvas** — the app icon's superellipse.

Radii are literal values throughout; the system deliberately has no
`--cocoon-radius-*` custom properties, unlike its colours.

Borders are used almost nowhere. The only 1px border in the system is the
`#d8dcef` hairline on inputs and unchecked checkboxes; secondary buttons carry a
Cobalt Edge hairline. Everything else that needs to be marked gets a **2px left
border** — the rail vocabulary — which is how sections, suggestions and errors
are all distinguished with one idea. The suggestion block asymmetrically rounds
`0 9px 9px 0` so its accent edge stays a straight line.

The icon is a cocoon pod: a rounded-square cobalt-to-verdigris field, a pale pod
silhouette, and three cobalt filament strokes clipped inside it.

### Named Rules

**The No Box Rule.** A section is marked by a 2px thread rail at 50% opacity and
16px of left padding — never by a border on four sides. Nested bordered cards are
what the system was built to remove.

**The Rails Never Stack Rule.** A section inside a section is a sub-step, not a
peer: it gets a flat Cobalt Wash panel at 10px radius and no rail. Nesting must
never compound into rails inside rails.

## Components

### Buttons

- **Shape:** the default corner (9px), `9px 14px` padding, 13px/500 label.
- **Primary:** Quiet Cobalt fill, white label, border matching the fill.
  Hover deepens to Cobalt Deep. Disabled drops to `opacity: 0.45` and
  `cursor: default`.
- **Secondary (`.btn`):** Cobalt Wash fill, Deep Slate Navy label, Cobalt Edge
  hairline. Hover darkens the border to Quiet Cobalt and nothing else — the
  fill does not move.
- **Small (`.btn-small`):** `7px 12px`, 12.5px, `8px` left margin. Used for the
  Remove control at the end of a list row.
- **Block (`.btn-block`):** full width, `8px` bottom margin.
- **No transitions on any state.** The change is instant.

### Selects

Platform appearance is stripped (`appearance: none`) and Cocoon draws its own
chevron as an inlined SVG data URI, positioned `right 12px center`, with `32px`
of right padding reserved for it. The chevron is defined separately per colour
scheme.

### Checkboxes

18×18, 6px radius, Cool Grey Edge hairline on a Surface White ground. Checked
fills Quiet Cobalt and paints an inlined white checkmark data URI, centred. The
row is a flex line with a `10px` gap and a clickable label.

### Section rail (signature component)

`position: relative`, transparent, no border, `2px 0 2px 16px` padding, `22px`
below. A `::before` pseudo-element draws a 2px full-height thread gradient at
`0.5` opacity down the left edge, with 2px of inset top and bottom. Its heading
is an eyebrow. This is the system's defining component: it replaced a stack of
bordered white cards that nested three deep on the options page.

### Inputs

Surface White ground, Cool Grey Edge hairline, 9px radius, `9px 11px` padding,
inheriting the body font at weight 400. Placeholders are Slate Muted at `0.75`
opacity. Inside a `.field` they go full width with `6px` of space under the label.

### Feedback

- **Inline error:** Oxblood Wash ground, Muted Oxblood text, 2px Muted Oxblood
  left border, 9px radius, `role="alert"`.
- **Suggestion:** Cobalt Wash ground, 2px Quiet Cobalt left border, asymmetric
  `0 9px 9px 0` radius.
- **Save toast:** text only. Deep Verdigris, weight 600, no chrome around it.
- **Empty note:** Slate Muted body text, no icon, no illustrated empty state.

### Focus

One ring everywhere: `outline: 2px solid` Signal Iris, `outline-offset: 2px`,
and the focus corner (4px), on `:focus-visible`. It is never removed or
overridden per component.

### In-page banner (injected)

Flex row, `12px 14px` padding, `12px` margin, 10px radius, Cobalt Wash ground,
Cobalt Edge border, banner-lift shadow, `max-width: 460px`, prepended to the host
page's body with `role="status"`. Its dismiss control is a pill (`999px`) in
Quiet Cobalt with a white label.

### Grounding overlay (injected)

Fixed full-viewport scrim at `z-index: 2147483647` over the overlay scrim colour,
centring a 420px panel: `#fdfdff` ground, `#e3e6f7` hairline, 14px radius, 24px
padding, overlay-lift shadow. `role="dialog"`, `aria-modal="true"`, focus-trapped,
focus restored on close. The breathing cue is an `aria-live="polite"` region
whose **text** changes each second — the guide is text, never animation.

## Do's and Don'ts

### Do:

- **Do** mark a section with the thread rail: `2px 0 2px 16px` padding and a 2px
  `::before` gradient at `0.5` opacity.
- **Do** set section headings as eyebrows — 11.5px, 600, `0.09em`, uppercase,
  Slate Muted — smaller than the body beneath them.
- **Do** strip and redraw every native control with `appearance: none` plus an
  inlined data-URI glyph, defined once per colour scheme.
- **Do** give every new colour token both a light and a dark value in the same
  commit. There are no single-scheme tokens.
- **Do** use 9px as the default corner for anything a user clicks or types into.
- **Do** express depth with a flat Cobalt Wash fill.
- **Do** render every notice as real DOM with a role (`role="status"`,
  `role="alert"`), so assistive tech can reach it.

### Don't:

- **Don't** add a `transition`, an `animation`, or a `scroll-behavior` anywhere
  in Cocoon's UI. The current count is zero and that is the specification.
- **Don't** put a shadow on the popup or the options page, in any state.
- **Don't** nest a rail inside a rail. One level down is a flat tinted panel.
- **Don't** wrap a section in a bordered card. That is the pattern this system
  was built to remove.
- **Don't** style a checkbox with `accent-color` — it recolours the tick and
  leaves the platform's box, which is the exact half-finished look the No Native
  Controls rule exists to prevent.
- **Don't** introduce a second gradient, or reuse the thread gradient as a fill.
- **Don't** theme the injected in-page surfaces to follow dark mode.
- **Don't** deliver a notice as CSS `content` text on a pseudo-element.
- **Don't** add a webfont. A network request is forbidden by the product.
