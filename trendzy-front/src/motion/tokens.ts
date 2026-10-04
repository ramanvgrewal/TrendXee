/**
 * TrendXee motion tokens.
 *
 * One vocabulary for every animated thing on the site, so the board moves like
 * one object rather than a collection of effects. Keep UI transitions inside
 * 150–500ms; only hero-scale moments may run longer.
 */

/** Cubic-bezier curves. `drift` mirrors the `--ease-drift` CSS token. */
export const ease = {
  drift: [0.32, 0.72, 0, 1],
  out: [0.2, 0.7, 0.2, 1],
  inOut: [0.65, 0, 0.35, 1],
} as const;

/** Durations in seconds. */
export const duration = {
  instant: 0.12,
  fast: 0.18,
  base: 0.28,
  slow: 0.45,
  hero: 0.7,
} as const;

/** Spring transitions for `transition` props. */
export const spring = {
  /** Presses, toggles, small physical feedback. */
  tactile: { type: "spring", stiffness: 420, damping: 30, mass: 0.6 },
  /** Larger surfaces settling into place. */
  soft: { type: "spring", stiffness: 220, damping: 26, mass: 0.8 },
  /** Shared-layout moves: active pills, expanding cards. */
  layout: { type: "spring", stiffness: 500, damping: 42, mass: 1 },
} as const;

/** Spring options for `useSpring` followers (no `type` key). */
export const follow = {
  /** The cursor dot: almost on the pointer, never jittery. */
  cursorDot: { stiffness: 1100, damping: 70, mass: 0.2 },
  /** The cursor ring/label: a hair behind the dot. */
  cursorRing: { stiffness: 420, damping: 38, mass: 0.5 },
  /** Magnetic pull and its return. */
  magnetic: { stiffness: 260, damping: 20, mass: 0.5 },
  /** Pointer parallax on imagery and type. */
  parallax: { stiffness: 140, damping: 22, mass: 0.6 },
  /** Smoothing for scroll-linked progress. */
  scroll: { stiffness: 220, damping: 40, mass: 0.4, restDelta: 0.0005 },
} as const;

/** Maximum travel in px. Restraint is the point: content beats motion. */
export const travel = {
  magnetic: 6,
  hero: 4,
  product: 4,
  meta: 2,
  card: 1.5,
} as const;

/** Staggered reveals: only the first batch waits; later items arrive at once. */
export const stagger = {
  step: 0.06,
  maxItems: 6,
} as const;
