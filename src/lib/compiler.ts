import { PAIRS } from '@/data/pairs';
import { SEND_THRESHOLD, rankScenes } from '@/lib/rankScenes';
import { readSchedule, label as clockLabel } from '@/lib/schedule';
import { readExits } from '@/lib/exit';
import type { MatchPair, Scene } from '@/lib/types';

/**
 * The compiler.
 *
 * Everything else on this site answers a question somebody already knew how to
 * ask: which room, which hour, send or wait. This takes the input people
 * actually arrive with — one messy sentence about their life — and compiles it
 * down to a single real-world moment.
 *
 * The structural claim underneath it is the one Ditto's own founder has made
 * publicly: in the long run this is not a dating product, it is an experience
 * platform for people who should meet for any reason — romance, or a business
 * idea, or a sport. Which means the fundamental unit stops being a MATCH
 * between two people and becomes an INTERSECTION: two people, a reason, a
 * moment, a room, and a way of first touching. A person can be right for you
 * and wrong today, in this room, for this purpose.
 *
 * Three rules keep this from being a demo of nothing.
 *
 * The reader is deterministic and local. It is regular expressions over a
 * sentence, exactly like the feedback reader this project already ships, and it
 * says so on the surface. A compiler front-end that quietly called a model
 * would make every stage below it unfalsifiable, and the whole point is that
 * you can check the work.
 *
 * Every stage after intent is computed by machinery that already exists and is
 * already asserted — the ranking, the scheduler, the exits, the send bar. This
 * file composes; it does not invent a second opinion. That is the difference
 * between a connective layer and a new feature that happens to sit on top.
 *
 * And each stage carries whether it was READ off the sentence or DERIVED from
 * the engine, because those are different kinds of claim and collapsing them is
 * how products end up asserting things about people they merely guessed.
 */

export type Kind = 'romantic' | 'friendship' | 'collaborator' | 'open';

export type Reading = {
  kind: Kind;
  /** What they are actually asking for, in their words made specific. */
  need: string;
  /** 0..1. Low means tired, cautious, or new. Drives how much is asked of them. */
  readiness: number;
  /** True when they explicitly asked not to be given the obvious thing. */
  wantsSurprise: boolean;
  /** The phrases that fired, so the read can be audited. */
  matched: string[];
};

type Signal = {
  test: RegExp;
  kind?: Kind;
  need?: string;
  readiness?: number;
  surprise?: boolean;
  label: string;
};

/**
 * The reader. Regular expressions, deliberately.
 *
 * Ordered least to most specific: later matches overwrite earlier ones, so
 * "I just moved here and want to build something" reads as collaborator rather
 * than as arrival, which is the correct precedence — the reason is sharper
 * evidence than the circumstance.
 */
const SIGNALS: Signal[] = [
  {
    test: /\b(mov(ed|ing)|new (here|in town|to the city)|don'?t (really )?know (anyone|anybody))\b/i,
    kind: 'friendship',
    need: 'somebody to know here, before anything else',
    label: 'newly arrived',
  },
  {
    test: /\b(tired|exhausted|drained|low ?(social )?battery|no energy|worn out)\b/i,
    readiness: 0.3,
    need: 'something small enough to survive a bad week',
    label: 'running on empty',
  },
  {
    test: /\b(leave|get out of|outside|out of) (my |the )?(apartment|room|house|flat)\b/i,
    kind: 'friendship',
    need: 'a reason to be somewhere that is not your room',
    label: 'wants to be got out of the house',
  },
  {
    test: /\b(co-?founder|designer|engineer|build|business|start ?up|collaborat|project|work with)\b/i,
    kind: 'collaborator',
    need: 'somebody to make a thing with',
    label: 'looking for a collaborator',
  },
  {
    test: /\b(run(ning)?|climb(ing)?|gym|train(ing)?|sport|team|play)\b/i,
    kind: 'friendship',
    need: 'somebody to do the thing with, not talk about it',
    label: 'wants a partner for something physical',
  },
  {
    test: /\b(date|romantic|someone to date|relationship|dating)\b/i,
    kind: 'romantic',
    need: 'one evening that is worth the nerves',
    label: 'explicitly about dating',
  },
  {
    test: /\b(surprise me|anything|whatever|open to)\b/i,
    surprise: true,
    need: 'to be handed something you would not have picked',
    label: 'asked not to be given the obvious thing',
  },
  {
    test: /\b(friend|friendship|people|someone to hang|company)\b/i,
    kind: 'friendship',
    need: 'people, without it having to mean anything yet',
    label: 'about people rather than a person',
  },
];

/** Read one sentence. No model, no network, no second opinion. */
export function read(sentence: string): Reading {
  const hits = SIGNALS.filter((s) => s.test.test(sentence));

  let kind: Kind = 'open';
  let need = 'something worth leaving the house for';
  let readiness = 0.68;
  let wantsSurprise = false;

  for (const h of hits) {
    if (h.kind) kind = h.kind;
    if (h.need) need = h.need;
    if (h.readiness !== undefined) readiness = h.readiness;
    if (h.surprise) wantsSurprise = true;
  }

  return { kind, need, readiness, wantsSurprise, matched: hits.map((h) => h.label) };
}

/**
 * How much of the conversation the room is willing to carry.
 *
 * "Give the silence a job" as a number. Two chairs and a coffee leave the
 * humans holding effectively all of it; a task, a crowd, or something that just
 * happened take most of it off them. The question a matcher should be asking is
 * not which venue is nicer — it is how much work these two specific people
 * should be asked to do, and then choosing a room that does the rest.
 */
export function scaffolding(scene: Scene): number {
  const m = scene.metrics;
  const external =
    m.contextFit * 0.45 + m.noveltyValue * 0.2 + m.explorationValue * 0.15 + (scene.thirdThing ? 0.2 : 0);
  return Math.max(0, Math.min(1, external));
}

/** How two lives are allowed to first touch. A property of the room. */
export const SHAPES: Record<string, { name: string; how: string }> = {
  coffee: {
    name: 'direct',
    how: 'two people, one table, and no cover story for either of you.',
  },
  study: {
    name: 'direct',
    how: 'nothing between you but the step you are both sitting on.',
  },
  mission: {
    name: 'mission',
    how: 'a shared objective, and the objective does the introducing.',
  },
  gallery: {
    name: 'parallel',
    how: 'the same room, with no obligation to face each other for the first ten minutes.',
  },
  group: {
    name: 'group landing',
    how: 'you meet inside a group, and peel off only if you both want to.',
  },
  postshow: {
    name: 'afterglow',
    how: 'something already happened. you are just two people leaving it at the same time.',
  },
};

/**
 * A shape this project cannot offer, named rather than hidden.
 *
 * The strongest introduction humans have ever had is a mutual friend saying
 * "you two should talk". Nothing in this data models a social graph, so BRIDGE
 * cannot be produced here — and leaving it off the list entirely would imply
 * the six rooms are the whole space of ways to meet, which is a much bigger
 * claim than anything else on this page.
 */
export const MISSING_SHAPE = {
  name: 'bridge',
  how: 'a mutual friend says the sentence for you. the oldest and best introduction there is.',
  why: 'nothing here models who knows whom, so this project cannot produce it. it is the largest missing piece.',
};

/**
 * How much work the sentence needs the room to do.
 *
 * This is the hinge of the whole compiler, and the first version did not have
 * it: intent picked the pair and was then ignored, so three unrelated sentences
 * produced the same café. A compiler that reads its input and discards it is a
 * slideshow.
 *
 * So the sentence sets a REQUIREMENT and the engine satisfies it. Somebody new
 * in a city has no shared history to spend, so the room has to supply the
 * material. Somebody looking for a collaborator needs an object between them,
 * not a table. Somebody exhausted needs the evening to hold itself up.
 *
 * The rule that keeps this honest: a requirement reorders the rooms that
 * already clear the send bar. It never reaches below the bar to satisfy a
 * preference. Wanting something specific does not entitle you to a bad evening,
 * and the assertion for it is in `npm run check`.
 */
export function requiredScaffolding(reading: Reading): number {
  if (reading.readiness < 0.5) return 0.8;
  switch (reading.kind) {
    case 'collaborator':
      return 0.75;
    case 'friendship':
      return 0.65;
    case 'romantic':
      return 0.45;
    default:
      return 0.55;
  }
}

export type Stage = {
  key: string;
  label: string;
  value: string;
  detail: string;
  /** DERIVED means computed by machinery that is separately asserted. */
  derived: boolean;
};

export type Compiled = {
  sentence: string;
  reading: Reading;
  pair: MatchPair;
  scene: Scene;
  stages: Stage[];
  /** The single line the whole thing collapses to. */
  action: string;
  /** True when nothing cleared the bar and the honest output is nothing. */
  withheld: boolean;
};

/**
 * Compile one sentence into one moment.
 *
 * The pair is chosen by which one the sentence is actually about rather than by
 * score, because a compiler that ignores its own input is a slideshow. Kind
 * selects the pair; the engine selects everything after it.
 */
export function compile(sentence: string): Compiled {
  const reading = read(sentence);

  // Search the whole pool, not a pre-assigned pair.
  //
  // The first version routed by kind — friendship went to one pair, romance to
  // another — and it trapped three different sentences in a pair where only one
  // room clears the send bar, so they all compiled to the same café. Which was
  // the original bug wearing a different hat: intent read, then ignored.
  //
  // An intersection is not "which room for these two". It is "who, and where,
  // and in what shape", searched together. So every sendable room belonging to
  // every pair is a candidate, and the sentence chooses among them.
  const need = requiredScaffolding(reading);

  const candidates = PAIRS.flatMap((p) =>
    rankScenes(p)
      .filter((r) => r.utility >= SEND_THRESHOLD)
      .map((r) => ({ pair: p, ranked: r, fit: Math.abs(scaffolding(r.scene) - need) })),
  );

  // Nothing anywhere clears the bar: the honest output is nothing, and it is
  // taken from the best available pair so the page can still say whose week it
  // would have been.
  const fallbackPair = PAIRS[0];
  const fallback = { pair: fallbackPair, ranked: rankScenes(fallbackPair)[0], fit: 1 };

  const ordered = candidates.length
    ? [...candidates].sort((a, b) =>
        // Near-ties fall back to the ranking, so a preference never overrides
        // the scorer by more than it has to.
        Math.abs(a.fit - b.fit) < 0.02 ? b.ranked.utility - a.ranked.utility : a.fit - b.fit,
      )
    : [fallback];

  const bestFit = ordered[0];

  // "Surprise me" is honoured by spending a little of the fit rather than by
  // ignoring the bar — the next best-fitting room that is still sendable.
  const picked = reading.wantsSurprise && ordered[1] ? ordered[1] : bestFit;

  const pair = picked.pair;
  const ranked = rankScenes(pair);
  const top = ranked[0];
  const chosen = picked.ranked;

  const scene = chosen.scene;
  const withheld = chosen.utility < SEND_THRESHOLD;

  const schedule = readSchedule(pair.personA, pair.personB);
  const when = schedule.best;
  const exit = readExits(pair).find((r) => r.scene.id === scene.id)!;
  const shape = SHAPES[scene.id];
  const work = scaffolding(scene);

  const stages: Stage[] = [
    {
      key: 'intent',
      label: 'intent',
      value: reading.need,
      detail: reading.matched.length
        ? `read from your words: ${reading.matched.join(', ')}`
        : 'nothing specific fired. treated as open.',
      derived: false,
    },
    {
      key: 'kind',
      label: 'intersection',
      value: reading.kind,
      detail:
        reading.kind === 'romantic'
          ? 'the only kind this prototype has people for. the others are the same machinery.'
          : 'not a date. the engine does not care which — it is the same intersection either way.',
      derived: false,
    },
    {
      key: 'readiness',
      label: 'readiness',
      value: reading.readiness < 0.5 ? 'low — you told me you are tired' : 'ordinary',
      detail:
        reading.readiness < 0.5
          ? 'so this routes to whichever room does the most of the work for you.'
          : 'nothing in the sentence suggests you need handling.',
      derived: false,
    },
    {
      key: 'who',
      label: 'who',
      value: `${pair.personA.name} & ${pair.personB.name}`,
      detail: `pair signal ${pair.pairSignal.toFixed(2)}, constant in every room. the people were never the variable.`,
      derived: true,
    },
    {
      key: 'scaffolding',
      label: 'how much the room carries',
      value: `${Math.round(work * 100)}%`,
      detail: `your sentence asked for about ${Math.round(requiredScaffolding(reading) * 100)}%, so the two of you carry ${Math.round((1 - work) * 100)}%. that is the actual question, not which venue is nicer.`,
      derived: true,
    },
    {
      key: 'when',
      label: 'when',
      value: when ? clockLabel(when) : 'no shared hour',
      detail: when
        ? `joint energy ${when.jointEnergy.toFixed(2)} — the less present of you, never the average.`
        : 'they share no window at all this week.',
      derived: true,
    },
    {
      key: 'where',
      label: 'where',
      value: scene.label,
      // Compared by id, not identity. `top` and `chosen` come from separate
      // rankScenes calls, so the two objects are never the same reference even
      // when they are plainly the same room — and the first version therefore
      // told you the top room was not the top room.
      detail: `${chosen.utility.toFixed(3)} against a bar of ${SEND_THRESHOLD}${
        chosen.scene.id === top.scene.id
          ? ' — and also the highest scoring room these two have'
          : ' — not their top room, chosen because it fits what you asked for and still clears the bar'
      }.`,
      derived: true,
    },
    {
      key: 'shape',
      label: 'how you first touch',
      value: shape.name,
      detail: shape.how,
      derived: true,
    },
    {
      key: 'ending',
      label: 'how it ends',
      value: exit.needsAnEnding ? 'we supply one' : 'the room supplies one',
      detail: exit.needsAnEnding && exit.supplied ? exit.supplied : exit.how,
      derived: true,
    },
  ];

  const action = withheld
    ? 'nothing this week. none of it cleared the bar, and sending it anyway would cost you a wednesday.'
    : `${pair.personB.name} · ${when ? clockLabel(when) : scene.time} · ${scene.location}`;

  return { sentence, reading, pair, scene, stages, action, withheld };
}
