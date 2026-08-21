import { PAIRS } from '@/data/pairs';
import { WEEK_TWO } from '@/data/weekTwo';

/**
 * A synthetic campus.
 *
 * SYNTHETIC AND GENERATED. Nobody in here is real, nothing was scraped, and no
 * social graph belonging to any actual person was used, consulted or
 * approximated. This is a population produced by a seeded generator from the
 * rules written below, and those rules are the entire input.
 *
 * It exists because every remaining idea in this project turned out to need the
 * same missing thing. Zoom levels need a world to zoom out to. Connection
 * gravity needs more than two bodies. A bridge introduction — a mutual friend
 * saying the sentence for you, which the compiler names as the one shape it
 * cannot offer — needs somebody to be mutual. And "the introduction with the
 * highest network consequence" is not even a question you can ask about a pair.
 *
 * The generator is deliberately structured rather than uniform, because a
 * uniformly random graph has no bridges, no clusters and no isolates, and
 * therefore nothing interesting to find. Real social structure is lumpy:
 *
 *   CLUSTERS      people mostly know people in their own corner of campus
 *   WEAK TIES     a thin scatter of edges between corners, which is what makes
 *                 the graph one graph rather than six
 *   ISOLATES      a handful of people with almost no edges at all, who are
 *                 exactly the people an engagement-optimising product never
 *                 reaches, because they generate no activity to optimise
 *
 * The six people the rest of this site is about are seeded into it rather than
 * living somewhere separate. The world contains Maya and Jonah; it is not a
 * different dataset that happens to sit next to them.
 */

const CLUSTERS = [
  'the architecture studio',
  'the music tech floor',
  'the marine lab',
  'third-year politics',
  'the film society',
  'the climbing gym',
] as const;

/** Fictional given names only. No surnames, no handles, nothing resolvable. */
const NAMES = [
  'Ada', 'Bo', 'Cass', 'Devi', 'Eli', 'Fen', 'Gia', 'Hana', 'Ines', 'Jax',
  'Kai', 'Lena', 'Mira', 'Nils', 'Oona', 'Pia', 'Quin', 'Ravi', 'Sana', 'Tam',
  'Uma', 'Vero', 'Wes', 'Xan', 'Yuki', 'Zev', 'Arlo', 'Brie', 'Cleo', 'Dara',
  'Emi', 'Finn', 'Gus', 'Hugo', 'Iris', 'Juno', 'Kit', 'Lux', 'Moss', 'Nia',
  'Odie', 'Pax', 'Remy', 'Sol', 'Tove', 'Ula', 'Vida', 'Wren', 'Yara', 'Zia',
] as const;

export const POPULATION = 96;

/** Deterministic 0..1 stream. The campus is the same campus on every render. */
function seeded(seed: number): () => number {
  let h = seed >>> 0;
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Node = {
  id: string;
  name: string;
  cluster: number;
  clusterName: string;
  /** Position on the stage, in cluster space. */
  at: [number, number, number];
  /** True for the six people the rest of this site follows. */
  known: boolean;
};

export type Edge = { a: number; b: number; /** true when it crosses clusters */ weak: boolean };

export type Campus = {
  nodes: Node[];
  edges: Edge[];
  /** Adjacency, by index. */
  neighbours: number[][];
};

/** The six the site already follows, seeded into the population. */
const KNOWN = [
  { person: PAIRS[0].personA, cluster: 0 },
  { person: PAIRS[0].personB, cluster: 1 },
  { person: PAIRS[1].personA, cluster: 3 },
  { person: PAIRS[1].personB, cluster: 4 },
  { person: WEEK_TWO.personA, cluster: 2 },
  { person: WEEK_TWO.personB, cluster: 5 },
];

/**
 * Build the campus.
 *
 * Intra-cluster density is high and inter-cluster density is very low, which is
 * what produces bridges worth finding. The isolate rule is applied last and
 * deliberately: a few people have their edges stripped back to almost nothing,
 * because a graph where everybody is reasonably connected cannot demonstrate
 * the one thing this layer exists to demonstrate.
 */
export function buildCampus(seed = 20260820): Campus {
  const rand = seeded(seed);
  const nodes: Node[] = [];

  for (let i = 0; i < POPULATION; i++) {
    const known = seed === 20260820 ? KNOWN[i] : undefined;
    const cluster = known ? known.cluster : Math.floor(rand() * CLUSTERS.length);

    // Clusters sit on a ring, each person jittered inside their own.
    const angle = (cluster / CLUSTERS.length) * Math.PI * 2;
    const radius = 4.2;
    const spread = 1.45;

    nodes.push({
      id: known ? known.person.id : `p${i}`,
      name: known ? known.person.name : NAMES[i % NAMES.length],
      cluster,
      clusterName: CLUSTERS[cluster],
      at: [
        Math.cos(angle) * radius + (rand() - 0.5) * spread * 2,
        (rand() - 0.5) * spread * 1.15,
        Math.sin(angle) * radius + (rand() - 0.5) * spread * 2,
      ],
      known: Boolean(known),
    });
  }

  const edges: Edge[] = [];
  for (let a = 0; a < POPULATION; a++) {
    for (let b = a + 1; b < POPULATION; b++) {
      const same = nodes[a].cluster === nodes[b].cluster;
      const p = same ? 0.16 : 0.006;
      if (rand() < p) edges.push({ a, b, weak: !same });
    }
  }

  // Isolates. Applied last so the rest of the graph is already formed, and
  // chosen from people the site does not otherwise follow.
  const isolates = new Set<number>();
  for (let k = 0; k < 5; k++) {
    const i = 6 + Math.floor(rand() * (POPULATION - 6));
    isolates.add(i);
  }
  const kept = edges.filter((e) => {
    if (!isolates.has(e.a) && !isolates.has(e.b)) return true;
    return rand() < 0.12;
  });

  // Nobody is left with zero.
  //
  // Two passes were needed here and the first one was wrong. The probabilistic
  // strip can take all of an isolate's edges, so I restored one for each of the
  // five designated isolates — and the minimum degree was still zero, because
  // most people with no edges never had any: at this density a fair number of
  // nodes simply never win a coin flip. The invariant has to be universal or it
  // is not an invariant.
  //
  // It matters beyond tidiness. A person with no edges is not lonely, they are
  // *unreachable* — no bridge can find them, no path runs through them, and the
  // newly-reachable arithmetic downstream quietly counts them as unavailable to
  // everyone forever. Lonely is the case worth modelling. Unreachable is a bug.
  const degrees = new Array(POPULATION).fill(0);
  for (const e of kept) {
    degrees[e.a]++;
    degrees[e.b]++;
  }
  for (let i = 0; i < POPULATION; i++) {
    if (degrees[i] > 0) continue;
    // Nearest person in their own corner of campus, so a restored thread still
    // looks like a real one rather than an arbitrary wire across the room.
    const mate = nodes
      .map((n, j) => ({ j, n }))
      .filter((x) => x.j !== i && x.n.cluster === nodes[i].cluster)
      .sort(
        (x, y) =>
          Math.hypot(x.n.at[0] - nodes[i].at[0], x.n.at[2] - nodes[i].at[2]) -
          Math.hypot(y.n.at[0] - nodes[i].at[0], y.n.at[2] - nodes[i].at[2]),
      )[0];
    if (!mate) continue;
    kept.push({ a: Math.min(i, mate.j), b: Math.max(i, mate.j), weak: false });
    degrees[i]++;
    degrees[mate.j]++;
  }

  const neighbours: number[][] = Array.from({ length: POPULATION }, () => []);
  for (const e of kept) {
    neighbours[e.a].push(e.b);
    neighbours[e.b].push(e.a);
  }

  return { nodes, edges: kept, neighbours };
}
