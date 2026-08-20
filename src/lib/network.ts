import type { Campus } from './campus';

/**
 * What one introduction is worth to a network.
 *
 * Every "people you may know" system in existence ranks candidates by some
 * version of triadic closure: you share friends, you are in the same places,
 * therefore you should meet. It works, and it has a structural consequence
 * nobody looks at — the people it recommends are the people you are already
 * socially adjacent to, which makes them the introductions that change the
 * least. A recommender optimising for how likely two people are to get on will
 * reliably suggest the edge that adds almost nothing to the graph.
 *
 * So this computes both, side by side, and they disagree:
 *
 * AFFINITY is the classic signal — mutual friends, same corner of campus. It is
 * a good predictor of two people liking each other and a terrible predictor of
 * anything changing.
 *
 * CONSEQUENCE is how many people become newly reachable through one
 * introduction. Connect two people inside the same friend group and almost
 * nobody is newly reachable, because they already share everyone. Connect two
 * clusters and a whole population moves within one step of another one.
 *
 * Neither is the right answer on its own. Consequence alone would introduce
 * people who have nothing to say to each other, which is how you get a
 * networking event. The point of computing both is that a system optimising
 * only the first will never even see the second, and the second is where the
 * life-changing introductions live.
 */

export type EdgeRead = {
  a: number;
  b: number;
  /** Mutual friends plus a bonus for sharing a corner of campus. */
  affinity: number;
  /** How many people become newly reachable in one step. */
  consequence: number;
  /** True when they already share at least one friend — a bridge is possible. */
  bridgeable: boolean;
  /** Mutual friends, by index. Who could actually make the introduction. */
  mutuals: number[];
};

const setOf = (xs: number[]) => new Set(xs);

export function readEdge(campus: Campus, a: number, b: number): EdgeRead {
  const na = campus.neighbours[a];
  const nb = campus.neighbours[b];
  const sa = setOf(na);
  const sb = setOf(nb);

  const mutuals = na.filter((x) => sb.has(x));

  // Newly reachable: everyone on their side you could not previously get to in
  // one step, and vice versa.
  const newToA = nb.filter((x) => x !== a && !sa.has(x)).length;
  const newToB = na.filter((x) => x !== b && !sb.has(x)).length;

  const sameCluster = campus.nodes[a].cluster === campus.nodes[b].cluster;

  return {
    a,
    b,
    affinity: mutuals.length + (sameCluster ? 3 : 0),
    consequence: newToA + newToB,
    bridgeable: mutuals.length > 0,
    mutuals,
  };
}

/** Every pair who do not already know each other. */
function candidates(campus: Campus): EdgeRead[] {
  const existing = new Set(campus.edges.map((e) => `${e.a}:${e.b}`));
  const out: EdgeRead[] = [];

  for (let a = 0; a < campus.nodes.length; a++) {
    for (let b = a + 1; b < campus.nodes.length; b++) {
      if (existing.has(`${a}:${b}`)) continue;
      out.push(readEdge(campus, a, b));
    }
  }
  return out;
}

export type NetworkRead = {
  /** What a "people you may know" ranker would pick. */
  byAffinity: EdgeRead;
  /** The introduction that would change the most. */
  byConsequence: EdgeRead;
  /** True when those are different people. They are. */
  disagree: boolean;
  /** People with almost no edges. The ones engagement optimisation never sees. */
  isolated: number[];
  /** People already holding two clusters together. */
  connectors: number[];
  /** Edges that cross clusters at all. */
  weakTies: number;
  totalEdges: number;
};

export function readNetwork(campus: Campus): NetworkRead {
  const all = candidates(campus);

  const byAffinity = [...all].sort(
    (x, y) => y.affinity - x.affinity || y.consequence - x.consequence,
  )[0];

  const byConsequence = [...all].sort(
    (x, y) => y.consequence - x.consequence || y.affinity - x.affinity,
  )[0];

  const degree = campus.neighbours.map((n) => n.length);
  const isolated = degree
    .map((d, i) => ({ d, i }))
    .filter((x) => x.d <= 1)
    .sort((x, y) => x.d - y.d)
    .map((x) => x.i);

  // Somebody holding clusters together: their neighbours span more than one.
  const connectors = campus.neighbours
    .map((ns, i) => {
      const spans = new Set(ns.map((n) => campus.nodes[n].cluster));
      return { i, spans: spans.size };
    })
    .filter((x) => x.spans >= 3)
    .sort((x, y) => y.spans - x.spans)
    .map((x) => x.i);

  return {
    byAffinity,
    byConsequence,
    disagree: byAffinity.a !== byConsequence.a || byAffinity.b !== byConsequence.b,
    isolated,
    connectors,
    weakTies: campus.edges.filter((e) => e.weak).length,
    totalEdges: campus.edges.length,
  };
}

/**
 * The introduction a mutual friend could make.
 *
 * This is the shape the compiler names as the one it cannot produce, and the
 * only reason it could not is that there was no graph. With one, it is simply a
 * lookup: who do these two both already know.
 */
export function bridgeFor(campus: Campus, a: number, b: number): number | null {
  const read = readEdge(campus, a, b);
  if (!read.mutuals.length) return null;

  // Whoever spans the most clusters is the most credible person to be making
  // an introduction across one.
  return [...read.mutuals].sort((x, y) => {
    const sx = new Set(campus.neighbours[x].map((n) => campus.nodes[n].cluster)).size;
    const sy = new Set(campus.neighbours[y].map((n) => campus.nodes[n].cluster)).size;
    return sy - sx;
  })[0];
}
