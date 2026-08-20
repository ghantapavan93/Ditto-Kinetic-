import * as THREE from 'three';
import type { FragmentKind } from './types';
import { seeded } from './motion';

/**
 * Handwritten reason fragments, drawn to canvas.
 *
 * These are the only place handwriting carries actual content, which is
 * deliberate: a fragment is an *interpretation*, not a fact, and it should look
 * like somebody's marginal note rather than a system output. Nothing here is a
 * score and nothing here is phrased as a conclusion.
 *
 * Text uses ` | ` as the line separator so the data stays on one line and never
 * needs escaping.
 */

const PAPER = '#F2EEE3';
const INK = '#0B0D12';
const COBALT = '#2B44FF';
const ACID = '#FF2E88';
const TICKET = '#FFD84D';

const ACCENT: Record<FragmentKind, string> = {
  shared: COBALT,
  lopsided: TICKET,
  tension: ACID,
  spark: '#FF7AB8',
};

const PAD = 26;
const LINE = 44;
const FONT = '600 34px Caveat, "Segoe Script", "Bradley Hand", cursive';

function draw(canvas: HTMLCanvasElement, text: string, kind: FragmentKind) {
  const lines = text.split('|').map((l) => l.trim());
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.font = FONT;
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const w = Math.ceil(widest + PAD * 2);
  const h = Math.ceil(lines.length * LINE + PAD * 2);
  canvas.width = w;
  canvas.height = h;

  const rand = seeded(text.length * 7717 + kind.length * 131);

  // torn paper, very slightly off-square
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate((rand() - 0.5) * 0.03);
  ctx.translate(-w / 2, -h / 2);

  ctx.fillStyle = kind === 'spark' ? '#F7EFE6' : PAPER;
  ctx.beginPath();
  ctx.moveTo(0, 4);
  for (let x = 0; x <= w; x += 18) ctx.lineTo(x, 2 + rand() * 5);
  ctx.lineTo(w, h - 3);
  for (let x = w; x >= 0; x -= 18) ctx.lineTo(x, h - 2 - rand() * 5);
  ctx.closePath();
  ctx.fill();

  // accent stripe down the left edge — the only colour on the note
  ctx.fillStyle = ACCENT[kind];
  ctx.fillRect(0, 6, 4, h - 12);

  ctx.font = FONT;
  ctx.fillStyle = INK;
  ctx.textBaseline = 'top';
  lines.forEach((line, i) => {
    ctx.fillText(line, PAD + (rand() - 0.5) * 3, PAD + i * LINE);
  });

  // tension gets struck through with a nervous double line; spark gets a mark
  if (kind === 'tension') {
    ctx.strokeStyle = `${ACID}88`;
    ctx.lineWidth = 2;
    for (let k = 0; k < 2; k++) {
      ctx.beginPath();
      const y = PAD + (lines.length - 0.55) * LINE + k * 4;
      for (let x = PAD; x < w - PAD; x += 9) ctx.lineTo(x, y + (rand() - 0.5) * 4);
      ctx.stroke();
    }
  }
  if (kind === 'spark') {
    ctx.fillStyle = ACCENT.spark;
    ctx.beginPath();
    ctx.arc(w - PAD * 0.7, PAD * 0.8, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  if (kind === 'lopsided') {
    ctx.strokeStyle = TICKET;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(PAD, h - PAD * 0.55);
    ctx.lineTo(w - PAD, h - PAD * 0.55);
    ctx.stroke();
  }

  ctx.restore();
}

/** On-stage size of a note, in world units of height. */
export const FRAGMENT_SCALE = 0.46;

/** Widest a note gets, in world units, at FRAGMENT_SCALE. */
export const FRAGMENT_MAX_WIDTH = 1.35;

/**
 * Where a note sits, as a pure function.
 *
 * Two rows, evenly slotted. The first version spread every note across one
 * 3-unit band, which put their centres 0.6 apart while each note is roughly
 * 1.2 wide -- so they stacked and buried the middle ones completely. Notes you
 * cannot read are worse than no notes.
 *
 * Extracted so `npm run check` can assert the slot pitch stays wider than a
 * note and the rows stay clear of the photographs.
 */
export function fragmentSlot(index: number, total: number, pull: number) {
  const row = index % 2; // 0 above the pair, 1 below
  const inRow = Math.floor(index / 2);
  const rowCount = Math.max(1, row === 0 ? Math.ceil(total / 2) : Math.floor(total / 2));
  const u = rowCount > 1 ? inRow / (rowCount - 1) - 0.5 : 0;
  return {
    row,
    // 4.6 across three slots gives a 2.3 pitch against a ~1.2 note.
    x: u * 4.6 + pull * 0.3,
    // Clear of the cards, whose half-height is 0.87.
    y: (row === 0 ? 1 : -1) * 1.42,
  };
}

const cache = new Map<string, { texture: THREE.CanvasTexture; aspect: number }>();

export function fragmentTexture(text: string, kind: FragmentKind) {
  const key = `${kind}::${text}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const canvas = document.createElement('canvas');
  draw(canvas, text, kind);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  const entry = { texture, aspect: canvas.width / canvas.height };

  // The handwriting face is loaded by next/font and may not be ready when the
  // first frame rasterises. Redraw once it is, rather than shipping a fallback
  // that quietly looks wrong.
  if (typeof document !== 'undefined' && 'fonts' in document) {
    void document.fonts.ready.then(() => {
      draw(canvas, text, kind);
      entry.aspect = canvas.width / canvas.height;
      texture.needsUpdate = true;
    });
  }

  cache.set(key, entry);
  return entry;
}

export function disposeFragments() {
  cache.forEach((e) => e.texture.dispose());
  cache.clear();
}
