import { PAIRS } from '@/data/pairs';
import { HELD_BACK } from '@/data/heldBack';
import { SEND_THRESHOLD, rankScenes } from '@/lib/rankScenes';
import { readExits } from '@/lib/exit';
import { readSchedule } from '@/lib/schedule';

/**
 * What would have to be true.
 *
 * Fourteen surfaces arguing a thesis, with no plan for finding out whether the
 * thesis is right, is the exact failure this project keeps pointing at in other
 * people's products. So the last thing built here is not another surface. It is
 * the measurement it would take to kill this idea, and the order you would ship
 * in to find out cheaply.
 *
 * Everything below is derived from the engine rather than asserted next to it,
 * for the same reason as everywhere else — a roadmap whose numbers drift from
 * the thing it describes is a slide, not a plan.
 *
 * The honesty line that governs this file: every number here is computed over
 * SYNTHETIC people. None of it is evidence about Ditto's real users, and none
 * of it is a prediction of what would happen if they shipped it. They are the
 * priors that make the experiment worth running, and stating them as anything
 * more would undo the whole project.
 */

export type Step = {
  n: number;
  title: string;
  /** What it actually takes to ship. */
  cost: string;
  /** What in the existing system it touches. */
  touches: string;
  /** Why it is worth doing, in this project's own numbers. */
  worth: string;
  /** Days, roughly, and deliberately rough. */
  effort: 'days' | 'weeks' | 'a quarter';
};

/** The size of the bet: how much the room alone is worth to the same two people. */
export function roomSpread(): { pair: string; spread: number }[] {
  return PAIRS.map((p) => {
    const ranked = rankScenes(p);
    return {
      pair: `${p.personA.name} & ${p.personB.name}`,
      spread: ranked[0].utility - ranked[ranked.length - 1].utility,
    };
  });
}

export function roadmap(): Step[] {
  const needEnding = readExits(PAIRS[0]).filter((r) => r.needsAnEnding).length;
  const rooms = PAIRS[0].scenes.length;

  const consideredPairs = [...PAIRS, ...HELD_BACK];
  const held = HELD_BACK.filter((p) => rankScenes(p)[0].utility < SEND_THRESHOLD).length;

  const worstDropCost = Math.max(
    ...PAIRS.map((p) => readSchedule(p.personA, p.personB).dropDayCost ?? 0),
  );

  const spread = Math.max(...roomSpread().map((r) => r.spread));

  return [
    {
      n: 1,
      title: 'say how it ends',
      cost: 'one more line in a message that already sends',
      touches: 'nothing. no model change, no new data, no new screen.',
      worth: `${needEnding} of ${rooms} rooms supply no ending of their own, and those are the ones people have to perform leaving. saying the length out loud to both people costs nothing and removes the reason somebody says no.`,
      effort: 'days',
    },
    {
      n: 2,
      title: 'say why this room',
      cost: 'one more line, drawn from the score you already computed',
      touches: 'the message. the ranking is unchanged.',
      worth:
        'a match that arrives as an assertion is a thing to be sceptical of. a match that arrives with a reason is a thing to agree with. the reason already exists — it is just never shown.',
      effort: 'days',
    },
    {
      n: 3,
      title: 'let the room vary',
      cost: 'venue data per campus, and a ranking pass over it',
      touches: 'the matcher. this is the real one.',
      worth: `for the same two people in the same week, the best room and the worst differ by ${spread.toFixed(2)} of utility here. if that spread is anything like real, the room is the largest untouched lever in the funnel.`,
      effort: 'weeks',
    },
    {
      n: 4,
      title: 'be allowed to send nothing',
      cost: 'the hardest, and not technically',
      touches: 'the growth model, the weekly cadence, and every dashboard.',
      worth: `${held} of ${consideredPairs.length} pairs here do not clear the bar. sending them anyway is the cheapest possible way to hit a weekly number and the most expensive way to lose somebody's trust. holding wednesday sacred also costs up to ${worstDropCost.toFixed(2)} of joint energy when a better hour exists two days later.`,
      effort: 'a quarter',
    },
  ];
}

export type Falsifier = {
  claim: string;
  /** The observation that would end the argument. */
  killedBy: string;
};

/**
 * What would make this wrong.
 *
 * A thesis that cannot fail is not a thesis, and this one has four specific
 * ways to lose. They are written as observations somebody could actually make
 * rather than as risks, because "we might be wrong" is not a falsifier.
 */
export function falsifiers(): Falsifier[] {
  return [
    {
      claim: 'the room is a real lever on whether two people meet',
      killedBy:
        'vary the venue against a fixed-café control and watch match-to-date conversion. if it does not move, the room was never the variable and everything on this site is decoration.',
    },
    {
      claim: 'declining beats sending a weak match',
      killedBy:
        'withhold the lowest-scoring matches from one cohort. if their next-week engagement drops rather than holds, restraint is costing more trust than it buys and the send bar should come down.',
    },
    {
      claim: 'showing the reasoning increases confidence rather than doubt',
      killedBy:
        'ship the why-this-room line to half the cohort. if acceptance falls, explaining the machine makes people trust it less, and the honest response is to stop explaining rather than to explain harder.',
    },
    {
      claim: 'a stated ending lowers the cost of saying yes',
      killedBy:
        'add the length to the message for one arm. if acceptance is flat, then nobody was worried about being stuck, and the cheapest idea here was also an imaginary one.',
    },
  ];
}

/** Named and declined, with the reason. */
export const OUT_OF_SCOPE = [
  {
    title: 'safety',
    why: '.edu verification is the entire public mechanism, and it stops working the moment they leave campus — which they have said they intend to do. it is the most important unsolved thing here and it needs domain expertise this project does not have. building a pretty version of it would be worse than leaving it alone.',
  },
  {
    title: 'identity after college',
    why: 'the same boundary from the other side. everything here assumes a verified, bounded, shared-context population. none of it obviously survives contact with a city.',
  },
  {
    title: 'the model itself',
    why: 'every weight on this site was chosen to make an argument legible, not because it is correct. the structure is the contribution. the numbers are a demonstration and should be replaced by measured ones on contact with a single real week.',
  },
] as const;
