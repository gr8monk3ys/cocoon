# Cocoon Feature Ideas Backlog

This backlog focuses on high-value additions that fit Cocoon's privacy-first mental health + neurodivergent support direction.

## Design goals for next phase

- Move from static presets to context-adaptive support
- Keep user control explicit (no hidden automation)
- Support mixed/comorbid needs without forcing one profile identity
- Preserve local-first processing and transparent behavior

## 1) Adaptive profile engine (highest impact)

- Time-of-day profile schedules (e.g., Work, Evening, Wind-down)
- Domain-based profile rules (different defaults per site)
- Activity-state triggers (e.g., prolonged scrolling, rapid tab switching)
- "Suggest, don’t force" mode: Cocoon recommends a profile shift and user confirms

Why it fits:
- Solves the static-profile tradeoff while preserving user autonomy.

## 2) Scenario quick-switches (high impact)

- One-tap states like:
  - Focus session
  - Low stimulation
  - Calm reset
  - Social browsing with guardrails
- Optional timed auto-expiry (e.g., 30 min)

Why it fits:
- Supports real-world context shifts without deep settings edits.

## 3) Feed-intensity controls (high impact)

- Replace binary hide/show with levels:
  - Full feed
  - Limited feed (hide recommendations, keep direct follows)
  - No feed

Why it fits:
- Reduces all-or-nothing behavior and improves retention.

## 4) Session guardrails (high impact)

- Gentle prompts after configurable scroll durations (10/20/30 min)
- "Continue intentionally" confirmation with one-tap extension
- Optional quality-of-use reflection prompts

Why it fits:
- Helps ADHD time-blindness and compulsive loops while avoiding hard locks.

## 5) Trigger-safe content softening (medium impact)

- Replace selected keywords with collapsible placeholders
- Pair content softening with coping actions (breathe, pause, reframe)

Why it fits:
- Prioritizes coping support over pure avoidance.

## 6) Reading support bundle (medium impact)

- Adjustable line-height/letter-spacing presets
- Focus line / paragraph spotlight mode
- Reading strip for dense content

Why it fits:
- Supports ADHD/autism/dyslexia reading challenges in one extension.

## 7) Transparency panel (medium impact)

- "What Cocoon changed on this page" panel
- Shows active profile, overrides, and interventions
- One-click disable/rollback for current domain

Why it fits:
- Increases trust and debuggability.

## 8) Safety/care escalation surfaces (careful rollout)

- Non-intrusive crisis resource suggestions for high-risk patterns
- Region-aware resources configurable by user

Why it fits:
- Supports urgent moments while preserving autonomy and privacy.

## Neurodivergent + use-case coverage matrix

- ADHD: session guardrails, focus switches, feed intensity
- Autism: low-stimulation scenarios, motion/contrast controls, predictable content softening
- Anxiety: calm reset switches, coping prompts, optional feed-limiting
- Mixed/comorbid: adaptive profile engine + domain rules + custom overrides

## Suggested implementation order

1. Adaptive profile engine (time/domain rules + user-confirmed recommendations)
2. Scenario quick-switches
3. Feed-intensity controls
4. Session guardrails
5. Transparency panel
6. Reading support bundle
7. Trigger-safe softening
8. Crisis resource expansion

## Notes

- Keep local-first defaults.
- Ship sensitive behavior behind feature flags.
- Add tests for each behavior branch (settings + UI + content script).
