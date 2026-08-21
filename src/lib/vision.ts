import { PHOTOS } from '@/data/photoManifest';

/**
 * The future, as one camera move.
 *
 * Five stations from tonight to 2030, flown through rather than paginated —
 * the same discipline the zoom established: nested space, a camera that eases
 * to a stop at every station, and continuity that `npm run check` samples
 * rather than takes on faith.
 *
 * Each station is a continuation, not an invention. Tonight is the stage's
 * thesis. The campus is the network layer. Every-kind-of-meeting is the
 * intersection model — and Ditto's own CEO's stated long-term direction, which
 * is the reason this page gets to exist without being fan fiction. The city is
 * that model after `.edu` ends, carrying the one rule this site has enforced
 * since the possibility layer: the world never shows you the database. And the
 * quiet is where every argument here has been pointing — the interface knowing
 * when you no longer need it.
 *
 * The photography rides in the scene as textured planes, chosen from the
 * generated manifest by slug so the claim suite can assert that every frame
 * the flight uses actually ships. Only the named photos are placed — the
 * numbered ones have no stable identity to compose with.
 */

export type Vec3 = [number, number, number];

export type Station = {
  key: 'tonight' | 'campus' | 'meeting' | 'city' | 'quiet';
  /** Where this station's content sits, along the flight line. */
  at: Vec3;
  /** Photo slugs placed here, from the manifest. */
  photos: string[];
  /** A faint room plate behind the station, when one fits. */
  plate?: string;
};

export const STATIONS: Station[] = [
  {
    key: 'tonight',
    at: [0, 0, 0],
    photos: ['coffee-date', 'twilight-stroll'],
    plate: '/rooms/coffee.webp',
  },
  {
    key: 'campus',
    at: [1.6, 0.3, -14],
    photos: ['study-picnic', 'photo-grid'],
  },
  {
    key: 'meeting',
    at: [-1.8, -0.2, -28],
    photos: ['bookstore-reading', 'moodboard'],
  },
  {
    key: 'city',
    at: [1.2, 0.5, -42],
    photos: ['neon-tacos', 'neon-downtown', 'bridgeside', 'stadium-night'],
  },
  {
    key: 'quiet',
    at: [0, 0, -58],
    photos: [],
  },
];

/** Aspect ratio for a slug, from the manifest, so planes never distort. */
export function aspectOf(slug: string): number {
  const hit = PHOTOS.find((p) => p.src === `/photos/${slug}.webp`);
  return hit ? hit.w / hit.h : 1.5;
}

export type Shot = { eye: Vec3; target: Vec3 };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);
const mix = (a: Vec3, b: Vec3, t: number): Vec3 => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

/** Where the camera parks for a station: pulled back and slightly above. */
function parkAt(s: Station): Shot {
  return {
    eye: [s.at[0] * 0.65, s.at[1] + 0.55, s.at[2] + 4.6],
    target: [s.at[0], s.at[1], s.at[2] - 0.6],
  };
}

/**
 * The shot at t ∈ [0,1], eased to a stop at every station.
 *
 * Zero velocity at both ends of every segment, so the flight arrives, holds,
 * and moves — the pacing every act of this site has kept. A linear sweep would
 * read as a showreel; stopping reads as looking.
 */
export function visionCameraAt(t: number): Shot {
  const clamped = Math.max(0, Math.min(1, t));
  const segments = STATIONS.length - 1;
  const scaled = clamped * segments;
  const i = Math.min(segments - 1, Math.floor(scaled));
  const local = ease(scaled - i);

  const from = parkAt(STATIONS[i]);
  const to = parkAt(STATIONS[i + 1]);

  return { eye: mix(from.eye, to.eye, local), target: mix(from.target, to.target, local) };
}

/** Which station the flight is currently reading as. */
export function stationAt(t: number): Station {
  const segments = STATIONS.length - 1;
  const scaled = Math.max(0, Math.min(1, t)) * segments;
  return STATIONS[Math.round(scaled)];
}

/** 0..1 visibility of one station's content, by camera distance along z. */
export function stationOpacity(t: number, index: number): number {
  const segments = STATIONS.length - 1;
  const centre = index / segments;
  const spread = 0.5 / segments;
  const d = Math.abs(Math.max(0, Math.min(1, t)) - centre);
  return Math.max(0, 1 - d / (spread * 2.4));
}
