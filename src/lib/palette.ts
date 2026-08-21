/**
 * The colours the WebGL layer is allowed to use.
 *
 * Three.js cannot read Tailwind classes, so every scene reached for a hex
 * literal, and eighty-one of them accumulated across thirteen components. Two
 * had quietly drifted off the real palette: `#F4EDE4` was being used as paper
 * where the config says `#F5EFE3`, and `#2FD8A8` as mint where the config says
 * `#5FE3AE`. Nobody would ever notice by eye, which is exactly the problem —
 * the DOM and the canvas were rendering two slightly different sites.
 *
 * This file is the one place a scene may take a colour from. The first group
 * mirrors `tailwind.config.ts` and claim 38 asserts the two agree, so they
 * cannot drift apart again. The second group is colours that exist only in the
 * canvas — a cold blue for distance, the warm board a polaroid is printed on —
 * which the DOM has no use for and which therefore have no business in the
 * Tailwind config either. They are named here rather than typed inline so that
 * "the cold one" is a thing with a name instead of a number somebody matched by
 * eye in a different file.
 */

/* ---- mirrored from tailwind.config.ts, asserted equal by claim 38 -------- */

export const INK = '#0B0907';
export const INK_SOFT = '#171310';
export const INK_LINE = '#332A23';
export const PAPER = '#F5EFE3';
export const COBALT = '#2B44FF';
export const ACID = '#FF2E88';
export const TUNGSTEN = '#FFB865';
export const AMBER = '#E8913C';
export const MINT = '#5FE3AE';
export const TICKET = '#FFD84D';

/* ---- canvas only: no DOM equivalent, so no Tailwind token ---------------- */

/** Distance and disinterest. Everything far away or unchosen cools to this. */
export const COLD = '#4A6C8C';
/** A further, dimmer cold for the world scale, where distance is the argument. */
export const COLD_FAR = '#3F5872';
/** The muted marker a dead cluster keeps so it still reads as a place. */
export const COLD_MARK = '#6B7F96';
/** Weather's overcast, a shade off COLD so the two layers stay separable. */
export const OVERCAST = '#3E5F80';
/** The board a polaroid is printed on. Warmer and duller than paper. */
export const BOARD = '#D8C7AE';
/** Polaroid stock under cold light. */
export const STOCK_COLD = '#F4F1E8';
/** Polaroid stock under warm light — the same card, later in the evening. */
export const STOCK_WARM = '#FFE2E9';
/** The unlit end of a connection, before magnetism warms it. */
export const THREAD_COLD = '#3A4470';
/** The lit end of a connection that has not locked. */
export const THREAD_WARM = '#5C6CFF';
/** A book's cloth in the possibility cloud. */
export const CLOTH = '#8A6CC8';
/** The stage's own shadow, a hair off INK so depth reads without banding. */
export const INK_SHADOW = '#120C0A';
