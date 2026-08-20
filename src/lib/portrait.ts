import * as THREE from 'three';
import { seeded } from './motion';

/**
 * Procedural stand-in portraits.
 *
 * No image generation capability is available here and no real photographs are
 * used, so rather than pass off stock photos of real people as "synthetic",
 * each person gets a deterministically generated abstract figure: a head-and-
 * shoulders silhouette under a colour cast, a light leak and film grain.
 *
 * It reads as a photograph at polaroid scale and depicts nobody. Same seed
 * always produces the same portrait, so the two people are stable across
 * reloads, scenes and pair swaps.
 */

const W = 512;
const H = 640;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function drawPortrait(
  ctx: CanvasRenderingContext2D,
  seed: number,
  tint: [string, string],
): void {
  const rand = seeded(seed);
  const [warm, cool] = tint;

  // --- ground -------------------------------------------------------------
  const bg = ctx.createLinearGradient(0, 0, W * 0.6, H);
  bg.addColorStop(0, '#171A23');
  bg.addColorStop(0.55, '#0D0F15');
  bg.addColorStop(1, '#05060A');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // --- a soft off-centre key light ---------------------------------------
  const keyX = W * (0.3 + rand() * 0.4);
  const keyY = H * (0.18 + rand() * 0.18);
  const key = ctx.createRadialGradient(keyX, keyY, 10, keyX, keyY, W * 0.95);
  key.addColorStop(0, `${cool}55`);
  key.addColorStop(0.45, `${cool}18`);
  key.addColorStop(1, '#00000000');
  ctx.fillStyle = key;
  ctx.fillRect(0, 0, W, H);

  // --- figure: shoulders then head, as one filled silhouette --------------
  const cx = W * (0.46 + rand() * 0.1);
  const headR = W * (0.17 + rand() * 0.03);
  const headY = H * (0.36 + rand() * 0.05);
  const shoulderY = headY + headR * 2.25;
  const shoulderW = headR * (2.6 + rand() * 0.5);

  const figure = ctx.createLinearGradient(cx - headR, headY - headR, cx + headR, H);
  figure.addColorStop(0, '#39404F');
  figure.addColorStop(0.5, '#232936');
  figure.addColorStop(1, '#12161F');

  ctx.save();
  ctx.filter = 'blur(1.5px)';
  ctx.fillStyle = figure;

  ctx.beginPath();
  ctx.moveTo(cx - shoulderW, H);
  ctx.quadraticCurveTo(cx - shoulderW * 0.95, shoulderY, cx - headR * 0.92, shoulderY - headR * 0.2);
  ctx.quadraticCurveTo(cx - headR * 1.15, headY + headR * 0.5, cx - headR, headY);
  ctx.arc(cx, headY, headR, Math.PI, 0);
  ctx.quadraticCurveTo(cx + headR * 1.15, headY + headR * 0.5, cx + headR * 0.92, shoulderY - headR * 0.2);
  ctx.quadraticCurveTo(cx + shoulderW * 0.95, shoulderY, cx + shoulderW, H);
  ctx.closePath();
  ctx.fill();

  // hair mass — an offset cap, so the silhouettes are not interchangeable
  ctx.fillStyle = '#0E1119';
  ctx.beginPath();
  ctx.ellipse(
    cx + (rand() - 0.5) * headR * 0.3,
    headY - headR * (0.22 + rand() * 0.16),
    headR * (1.02 + rand() * 0.12),
    headR * (0.86 + rand() * 0.3),
    (rand() - 0.5) * 0.4,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.restore();

  // --- rim light on one edge of the figure --------------------------------
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const rimSide = rand() > 0.5 ? 1 : -1;
  const rim = ctx.createLinearGradient(cx + rimSide * headR * 1.4, 0, cx, 0);
  rim.addColorStop(0, `${warm}66`);
  rim.addColorStop(1, '#00000000');
  ctx.fillStyle = rim;
  ctx.fillRect(0, headY - headR * 1.6, W, H);
  ctx.restore();

  // --- light leak across a corner -----------------------------------------
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const leakX = rand() > 0.5 ? W : 0;
  const leak = ctx.createRadialGradient(leakX, H * 0.08, 0, leakX, H * 0.08, W * 0.8);
  leak.addColorStop(0, `${warm}70`);
  leak.addColorStop(0.4, `${warm}20`);
  leak.addColorStop(1, '#00000000');
  ctx.fillStyle = leak;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // --- film grain ---------------------------------------------------------
  const img = ctx.getImageData(0, 0, W, H);
  const data = img.data;
  const [wr, wg, wb] = hexToRgb(warm);
  for (let i = 0; i < data.length; i += 4) {
    const n = (rand() - 0.5) * 26;
    // A very slight cast toward the person's warm tint keeps the two portraits
    // distinguishable even as thumbnails.
    data[i] = Math.min(255, Math.max(0, data[i] + n + (wr - 128) * 0.02));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n + (wg - 128) * 0.02));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n + (wb - 128) * 0.02));
  }
  ctx.putImageData(img, 0, 0);

  // --- vignette -----------------------------------------------------------
  const vig = ctx.createRadialGradient(W / 2, H / 2, W * 0.28, W / 2, H / 2, W * 0.82);
  vig.addColorStop(0, '#00000000');
  vig.addColorStop(1, '#000000B0');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}

const cache = new Map<number, THREE.CanvasTexture>();

/** Cached so a pair swap or scene change never re-rasterises a portrait. */
export function portraitTexture(seed: number, tint: [string, string]): THREE.CanvasTexture {
  const existing = cache.get(seed);
  if (existing) return existing;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (ctx) drawPortrait(ctx, seed, tint);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  cache.set(seed, texture);
  return texture;
}

export function disposePortraits() {
  cache.forEach((t) => t.dispose());
  cache.clear();
}
