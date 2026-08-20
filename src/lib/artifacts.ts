import * as THREE from 'three';
import type { ArtifactKind } from './types';
import { seeded } from './motion';

/**
 * Artifact textures, drawn once to a canvas and cached forever.
 *
 * Every artifact encodes one field of the evaluation rather than decorating the
 * scene: a ticket is event context, a receipt is memory, a route is real-world
 * transition friction, a timestamp is scheduling, a name tag is social pressure.
 * If an object cannot name the thing it represents, it should not be on stage.
 */

type Spec = { w: number; h: number; draw: (c: CanvasRenderingContext2D, label: string, rand: () => number) => void };

const PAPER = '#F2EEE3';
const INK = '#0B0D12';
const COBALT = '#2B44FF';
const ACID = '#FF2E88';
const TICKET = '#FFD84D';

function paper(c: CanvasRenderingContext2D, w: number, h: number, fill = PAPER) {
  c.fillStyle = fill;
  c.fillRect(0, 0, w, h);
  // print unevenness
  const g = c.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, 'rgba(255,255,255,0.5)');
  g.addColorStop(0.6, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.08)');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
}

function mono(c: CanvasRenderingContext2D, size: number, weight = 700) {
  c.font = `${weight} ${size}px ui-monospace, "SF Mono", Menlo, monospace`;
}

const SPECS: Record<ArtifactKind, Spec> = {
  ticket: {
    w: 420,
    h: 200,
    draw: (c, label) => {
      paper(c, 420, 200);
      c.fillStyle = COBALT;
      c.fillRect(0, 0, 420, 34);
      mono(c, 20);
      c.fillStyle = PAPER;
      c.fillText('ADMIT ONE', 16, 24);
      c.fillStyle = INK;
      mono(c, 40, 800);
      c.fillText(label || 'ROW H · 14', 16, 100);
      mono(c, 16, 500);
      c.fillStyle = '#0B0D1299';
      c.fillText('WESTBROOK PLAYHOUSE', 16, 134);
      c.fillText('NO REFUNDS · NO LATE SEATING', 16, 160);
      // perforation
      c.fillStyle = '#0B0D1233';
      for (let y = 44; y < 200; y += 14) c.fillRect(330, y, 3, 7);
    },
  },
  receipt: {
    w: 300,
    h: 380,
    draw: (c, label) => {
      paper(c, 300, 380, '#FBF9F3');
      c.fillStyle = INK;
      mono(c, 22, 800);
      c.fillText(label || 'RECEIPT', 20, 48);
      mono(c, 15, 500);
      c.fillStyle = '#0B0D12AA';
      const lines = ['ITEM ......... 1', 'SUB ...... $ 9.40', 'TAX ...... $ 1.60', '', 'TOTAL .... $11.00', '', 'THANK YOU'];
      lines.forEach((l, i) => c.fillText(l, 20, 92 + i * 26));
      c.fillStyle = INK;
      for (let x = 20; x < 280; x += 6) {
        c.fillRect(x, 320, Math.random() > 0.5 ? 2 : 3, 34);
      }
    },
  },
  cup: {
    w: 240,
    h: 300,
    draw: (c) => {
      c.clearRect(0, 0, 240, 300);
      c.fillStyle = '#EDE8DA';
      c.beginPath();
      c.moveTo(48, 40);
      c.lineTo(192, 40);
      c.lineTo(168, 268);
      c.lineTo(72, 268);
      c.closePath();
      c.fill();
      c.fillStyle = '#D9D2C0';
      c.fillRect(44, 36, 152, 20);
      c.fillStyle = '#0B0D1218';
      c.fillRect(60, 130, 120, 46);
      c.fillStyle = '#0B0D1266';
      mono(c, 17, 700);
      c.fillText('WESTBROOK', 74, 160);
    },
  },
  'coffee-sleeve': {
    w: 360,
    h: 120,
    draw: (c, label) => {
      paper(c, 360, 120, '#CBBFA6');
      c.fillStyle = '#0B0D12';
      mono(c, 26, 800);
      c.fillText(label || 'CAUTION HOT', 20, 74);
    },
  },
  marker: {
    w: 300,
    h: 90,
    draw: (c) => {
      c.clearRect(0, 0, 300, 90);
      c.fillStyle = '#1B1E28';
      c.fillRect(20, 30, 230, 32);
      c.fillStyle = ACID;
      c.fillRect(250, 34, 34, 24);
      c.fillStyle = '#3A404F';
      c.fillRect(20, 30, 40, 32);
    },
  },
  'challenge-card': {
    w: 420,
    h: 260,
    draw: (c, label) => {
      paper(c, 420, 260);
      c.strokeStyle = INK;
      c.lineWidth = 3;
      c.setLineDash([9, 7]);
      c.strokeRect(14, 14, 392, 232);
      c.setLineDash([]);
      c.fillStyle = '#0B0D1288';
      mono(c, 15, 600);
      c.fillText('TEN MINUTES', 34, 58);
      c.fillStyle = INK;
      mono(c, 30, 800);
      const words = (label || 'STRANGEST OBJECT').split(' ');
      words.forEach((w, i) => c.fillText(w, 34, 112 + i * 40));
      c.fillStyle = ACID;
      c.fillRect(34, 210, 90, 6);
    },
  },
  'gallery-label': {
    w: 380,
    h: 160,
    draw: (c, label) => {
      paper(c, 380, 160, '#FBF9F3');
      c.fillStyle = INK;
      mono(c, 22, 800);
      c.fillText(label || 'UNTITLED, 2026', 22, 54);
      c.fillStyle = '#0B0D1299';
      mono(c, 15, 500);
      c.fillText('graphite, tape, found paper', 22, 88);
      c.fillText('student collection', 22, 114);
      c.strokeStyle = '#0B0D1222';
      c.lineWidth = 2;
      c.strokeRect(1, 1, 378, 158);
    },
  },
  poster: {
    w: 340,
    h: 460,
    draw: (c, _label, rand) => {
      c.fillStyle = '#12151E';
      c.fillRect(0, 0, 340, 460);
      c.fillStyle = COBALT;
      c.fillRect(0, 0, 340, 300);
      c.fillStyle = ACID;
      c.beginPath();
      c.arc(170, 150, 90 + rand() * 20, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = PAPER;
      mono(c, 34, 800);
      c.fillText('SPRING', 24, 360);
      c.fillText('SHOWCASE', 24, 400);
      c.fillStyle = TICKET;
      c.fillRect(24, 420, 120, 8);
    },
  },
  route: {
    w: 520,
    h: 200,
    draw: (c, label) => {
      c.clearRect(0, 0, 520, 200);
      c.strokeStyle = PAPER;
      c.lineWidth = 4;
      c.setLineDash([14, 10]);
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(40, 150);
      c.bezierCurveTo(170, 40, 330, 190, 470, 70);
      c.stroke();
      c.setLineDash([]);
      c.fillStyle = ACID;
      c.beginPath();
      c.arc(40, 150, 11, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = TICKET;
      c.beginPath();
      c.arc(470, 70, 11, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = PAPER;
      mono(c, 22, 700);
      c.fillText(label || '7 MIN WALK', 190, 178);
    },
  },
  timestamp: {
    w: 560,
    h: 150,
    draw: (c, label) => {
      c.clearRect(0, 0, 560, 150);
      c.fillStyle = PAPER;
      c.font = '800 108px ui-monospace, "SF Mono", Menlo, monospace';
      c.fillText(label || '8:32 PM', 10, 110);
    },
  },
  'name-tag': {
    w: 380,
    h: 260,
    draw: (c, label) => {
      paper(c, 380, 260);
      c.fillStyle = ACID;
      c.fillRect(0, 0, 380, 78);
      c.fillStyle = PAPER;
      mono(c, 30, 800);
      c.fillText(label || 'HI, I’M', 22, 52);
      c.strokeStyle = '#0B0D1233';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(22, 200);
      c.lineTo(358, 200);
      c.stroke();
    },
  },
  notebook: {
    w: 360,
    h: 440,
    draw: (c, _label, rand) => {
      paper(c, 360, 440, '#EDE7D7');
      c.strokeStyle = '#2B44FF33';
      c.lineWidth = 2;
      for (let y = 60; y < 440; y += 34) {
        c.beginPath();
        c.moveTo(28, y);
        c.lineTo(332, y);
        c.stroke();
      }
      c.strokeStyle = '#0B0D1266';
      c.lineWidth = 3;
      c.lineCap = 'round';
      for (let i = 0; i < 7; i++) {
        const y = 90 + i * 34;
        c.beginPath();
        c.moveTo(38, y - 8);
        c.lineTo(38 + 120 + rand() * 150, y - 8);
        c.stroke();
      }
    },
  },
};

const cache = new Map<string, THREE.CanvasTexture>();

export function artifactTexture(kind: ArtifactKind, label = ''): THREE.CanvasTexture {
  const key = `${kind}::${label}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const spec = SPECS[kind];
  const canvas = document.createElement('canvas');
  canvas.width = spec.w;
  canvas.height = spec.h;
  const ctx = canvas.getContext('2d');
  if (ctx) spec.draw(ctx, label, seeded(kind.length * 977 + label.length * 31));

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  cache.set(key, texture);
  return texture;
}

export function artifactAspect(kind: ArtifactKind): number {
  const s = SPECS[kind];
  return s.w / s.h;
}

/** On-stage scale in world units, per kind. Keeps the composition legible. */
export const ARTIFACT_SCALE: Record<ArtifactKind, number> = {
  ticket: 0.95,
  receipt: 0.62,
  cup: 0.42,
  'coffee-sleeve': 0.7,
  marker: 0.5,
  'challenge-card': 0.9,
  'gallery-label': 0.8,
  poster: 0.72,
  route: 1.5,
  timestamp: 1.35,
  'name-tag': 0.62,
  notebook: 0.6,
};

export function disposeArtifacts() {
  cache.forEach((t) => t.dispose());
  cache.clear();
}
