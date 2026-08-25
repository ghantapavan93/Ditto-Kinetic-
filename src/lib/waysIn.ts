import { PROOF } from '@/data/proof';
import { SURFACES } from '@/data/attentionInventory';
import { costOf } from '@/lib/attention';

/**
 * Five ways in.
 *
 * Twenty-odd surfaces is a lot to hand somebody -- the exact figure is
 * generated, and deliberately not repeated here. The failure mode is obvious
 * and this project walked straight into it: everything is reachable and nothing
 * is recommended, so a person with four minutes opens the front page, admires
 * it, and never finds the two screens that would have convinced them.
 *
 * Different people need different first ninety seconds. Somebody who runs
 * growth needs to feel something and needs it to be postable. Somebody who owns
 * matching needs to know the model is real before they will look at anything.
 * Somebody protecting the brand needs the boundaries stated before the demo
 * starts. None of those is the "correct" entry, and pretending there is one is
 * how a portfolio site wastes the only visit it gets.
 *
 * Each lane carries the thing this project keeps insisting on and most work of
 * this kind omits: what it does NOT prove. A route recommended without its
 * limit is a sales pitch with extra steps.
 */

export type WayIn = {
  key: string;
  /** Who this is for, said as a situation rather than a job title. */
  forWhom: string;
  /** The single route to open. One. */
  route: string;
  /** What it does in one sentence. */
  does: string;
  /** What it does not settle. Never omitted. */
  doesNot: string;
};

export const WAYS_IN: WayIn[] = [
  {
    key: 'ninety-seconds',
    forWhom: 'you have ninety seconds and no patience',
    route: '/thread',
    does: 'the entire product as a text thread, then it stops talking. one message opens all the machinery, and you can skip it.',
    doesNot: 'prove the ranking underneath is any good. it only proves the ranking can stay out of your way.',
  },
  {
    key: 'is-it-real',
    forWhom: 'you assume a beautiful demo is hiding a hardcoded one',
    route: '/held-back',
    does: 'shows the weeks it refused to send anything, which is the behaviour a faked demo never has.',
    doesNot: 'validate the weights. they are argued for, not learned from anybody.',
  },
  {
    key: 'the-model',
    forWhom: 'you own matching and want the model before the mood',
    route: '/mutual',
    does: 'scores every room twice, once per person, from weights read off their own words — and finds a room the shipping model would send that the reluctant one refuses.',
    doesNot: 'come from real behaviour. six synthetic pairs is a demonstration, not evidence.',
  },
  {
    key: 'the-feeling',
    forWhom: 'you want to know whether this could be culture',
    route: '/moments',
    does: 'the world the argument is for, cut like a film. synthetic photography, edited rather than gridded.',
    doesNot: 'contain a single real person. every face is generated, and the reel says so.',
  },
  {
    key: 'who-decides',
    forWhom: 'you want the question before the room: who should meet at all',
    route: '/matchmaker',
    does: 'replays the observed onboarding, then opens the engine under it — beliefs with sources, one measured question, two-directional fit, and a Wednesday allowed to refuse.',
    doesNot: 'claim any of it is how Ditto decides. the flow is observed; the engine under it is this concept’s, and every number is synthetic.',
  },
  {
    key: 'the-whole-thing',
    forWhom: 'you want the argument, all of it, in order',
    route: '/',
    does: 'the stage: two people, six candidate evenings, one wins, and the reasoning is inspectable the whole way down.',
    doesNot: 'stay short. this is the long way in, and the attention page prices it honestly.',
  },
];

/** Reading cost of a lane's route, from the same audit that prices everything. */
export function costOfWay(way: WayIn): number {
  const surface = SURFACES.find((s) => s.path === way.route);
  return surface ? costOf(surface).seconds : 0;
}

/** The cheapest lane, derived. Used to recommend rather than assert. */
export function shortestWay(): WayIn {
  return [...WAYS_IN].sort((a, b) => costOfWay(a) - costOfWay(b))[0];
}

/**
 * What this project is willing to say about itself, in numbers it generated.
 *
 * Re-exported here so the entry surface cannot quietly disagree with the suite:
 * both read the same generated file, and `npm run check` fails if that file has
 * drifted from a real run.
 */
export const EVIDENCE = PROOF;
