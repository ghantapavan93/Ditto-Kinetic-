import type { Scene, SceneEvaluation } from './types';

/**
 * The possibility cloud.
 *
 * Every score on this stage is a single number, and a single number is a lie of
 * confidence. `uncertainty` has been a real weighted dimension since the first
 * commit, and until now it has been completely invisible — it moved the ranking
 * and the reader never saw it. This turns it into the one thing it actually is:
 * distance.
 *
 * One evening becomes seven versions of itself. How far they drift apart *is*
 * the uncertainty, rendered. A room the system is sure about produces a tight
 * cluster; a room it is not produces a scatter you can see across the stage
 * before you can read a word about it.
 *
 * Two rules of honesty govern this file, and they are why it is built the way
 * it is rather than the obvious way.
 *
 * The count is FIXED at seven. It is tempting to fan out hundreds of ghosts —
 * it would look extraordinary — but a visible count reads as a sample size, and
 * a sample size is a claim about a model nobody here has. Seven is openly a
 * device for showing a range. The spread carries the information; the count
 * carries none, and is not allowed to imply any.
 *
 * And nothing here is random. `Math.random` would make the cloud different on
 * every render and unprovable in a test, which for a project whose whole
 * argument is "the reasoning is inspectable" would be self-defeating. The
 * offsets come from a seeded hash of the scene id, so the same room always
 * produces the same cloud, and `npm run check` can assert its shape.
 *
 * The drift labels are derived too. They are chosen by reading which dimensions
 * are actually weak in this specific room, so a version that goes wrong goes
 * wrong for a reason the scorer already knows about.
 */

export const CLOUD_COUNT = 7;

/** Deterministic 0..1 stream from a string. Same room, same cloud, always. */
function seeded(id: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * What can go wrong in a room, and how badly.
 *
 * Each entry reads one dimension and says what its failure looks like from
 * inside the evening. `risk` is written so that higher always means worse,
 * which is why the two dimensions you want *less* of are inverted rather than
 * given their own special case downstream.
 */
const DRIFTS: {
  key: keyof SceneEvaluation;
  risk: (m: SceneEvaluation) => number;
  says: string;
}[] = [
  {
    key: 'attendanceLikelihood',
    risk: (m) => 1 - m.attendanceLikelihood,
    says: 'one of them almost cancels',
  },
  {
    key: 'firstFifteenMinutesForecast',
    risk: (m) => 1 - m.firstFifteenMinutesForecast,
    says: 'the first ten minutes stay stiff',
  },
  {
    key: 'socialPressure',
    risk: (m) => m.socialPressure,
    says: 'there are people watching, and they both feel it',
  },
  {
    key: 'travelFriction',
    risk: (m) => m.travelFriction,
    says: 'someone arrives late and flustered',
  },
  {
    key: 'contextFit',
    risk: (m) => 1 - m.contextFit,
    says: 'the room never hands them anything',
  },
  {
    key: 'scheduleFit',
    risk: (m) => 1 - m.scheduleFit,
    says: 'it gets cut short',
  },
  {
    key: 'noveltyValue',
    risk: (m) => 1 - m.noveltyValue,
    says: 'it is fine, and forgotten by friday',
  },
];

export type Possibility = {
  /** Stable across renders — used as the React key and the ghost's identity. */
  id: string;
  /** Offset from the real card, in stage units. */
  offset: [number, number, number];
  /** How far off-centre, 0..1. Drives opacity and blur. */
  distance: number;
  /** True when this version lands where the ranking says it will. */
  converges: boolean;
  /** What differs in this version, or null when nothing does. */
  drift: string | null;
};

export type Cloud = {
  possibilities: Possibility[];
  /** How many of the seven land in the same place. */
  agreeing: number;
  /** RMS drift, 0..1 — the uncertainty as one number. */
  spread: number;
  /** The single most likely thing to go wrong here. */
  likeliestDrift: string | null;
};

/**
 * Fan one evening into seven versions of itself.
 *
 * The split between versions that agree and versions that do not is driven
 * straight off `uncertainty`, and clamped so that both outcomes always exist:
 * a cloud where everything agrees would be a claim of certainty the scorer
 * never made, and a cloud where nothing agrees would be a claim of chaos.
 */
export function possibilityCloud(scene: Scene): Cloud {
  const rand = seeded(scene.id);
  const u = scene.metrics.uncertainty;

  const diverging = Math.min(CLOUD_COUNT - 2, Math.max(1, Math.round(u * CLOUD_COUNT)));

  // Worst first, so the version most likely to go wrong is the one that says so.
  const ranked = [...DRIFTS].sort((a, b) => b.risk(scene.metrics) - a.risk(scene.metrics));

  // Where the diverging run starts. The drift list is indexed from HERE, not
  // from the absolute card index -- otherwise the first diverging card reads
  // ranked[2] and the two riskiest drifts, the whole point of sorting worst
  // first, can never appear on screen.
  const firstOff = CLOUD_COUNT - diverging;

  const possibilities: Possibility[] = [];
  for (let i = 0; i < CLOUD_COUNT; i++) {
    const off = i >= firstOff;

    // Versions that agree still are not identical — pinning them to the exact
    // same point would read as one card, not as several that concur.
    const reach = off ? 0.75 + u * 2.6 : 0.1 + u * 0.22;
    const theta = rand() * Math.PI * 2;
    const lift = (rand() - 0.5) * reach * 0.7;
    const depth = (rand() - 0.5) * reach * 0.55;

    possibilities.push({
      id: `${scene.id}-v${i}`,
      offset: [Math.cos(theta) * reach, lift, depth],
      distance: Math.min(1, reach / 3.35),
      converges: !off,
      drift: off ? (ranked[(i - firstOff) % ranked.length]?.says ?? null) : null,
    });
  }

  const spread = Math.sqrt(
    possibilities.reduce((t, p) => t + p.distance * p.distance, 0) / possibilities.length,
  );

  return {
    possibilities,
    agreeing: possibilities.filter((p) => p.converges).length,
    spread,
    likeliestDrift: ranked[0]?.says ?? null,
  };
}
