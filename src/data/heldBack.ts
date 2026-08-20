import type { MatchPair, Person, Scene, SceneEvaluation } from '@/lib/types';

/**
 * SYNTHETIC. Six more invented people, at two invented campuses.
 *
 * None of these are real students, none are derived from real profiles, and no
 * signal here was observed anywhere. They exist to make one argument the main
 * stage cannot make on its own.
 *
 * The stage shows a decision being made well. This shows the decisions that
 * were not made at all — the pairs Ditto had in hand this Wednesday and did not
 * send. Restraint is invisible by construction: a system that declines produces
 * no screen, no notification, and no evidence it was ever thinking. Which is
 * exactly why it is worth building a surface for. Sending is the easy half.
 *
 * Each of these three is tuned to fail differently, because one phrase covering
 * three unrelated situations would be a UI state rather than a judgement:
 *
 *   ISLA × RAFAEL   a near miss. one dimension short, and it is reachable.
 *   TOBI × WREN     the only thing that would fix it is more time.
 *   AMARA × LUCA    no single change clears the bar. the week is wrong twice.
 *
 * Those verdicts are produced by the real scorer rather than asserted next to
 * it. `npm run check` recomputes all three.
 */

function evaluation(
  m: Omit<SceneEvaluation, 'rationale'>,
  rationale: string[],
): SceneEvaluation {
  return { ...m, rationale };
}

const ISLA: Person = {
  id: 'isla',
  name: 'Isla',
  age: 21,
  major: 'Marine Biology',
  fictionalCampus: 'Ardenmoor',
  profileLine: 'talks about tide charts the way other people talk about music.',
  statedPreferences: ['someone curious', 'outdoors', 'no small talk'],
  revealedHypotheses: [
    'needs a subject before she needs a person',
    'reads a quiet room as a room that wants her to perform',
  ],
  surface: 'intense about one thing',
  contradiction: 'is easy company the moment nobody is waiting on her',
  tinyDetail: 'has named three of the campus crows',
  conversationStyle: ['specific', 'tangential', 'allergic to preamble'],
  socialEnergy: ['long fuse', 'better walking than sitting'],
  availability: [
    { day: 3, startMin: 16 * 60, endMin: 20 * 60, energy: 0.6 },
    { day: 6, startMin: 9 * 60, endMin: 14 * 60, energy: 0.88 },
  ],
  portraitSeed: 51204,
  portraitTint: ['#2FD8A8', '#1B3FCC'],
};

const RAFAEL: Person = {
  id: 'rafael',
  name: 'Rafael',
  age: 22,
  major: 'Civil Engineering',
  fictionalCampus: 'Ardenmoor',
  profileLine: 'will explain why the bridge is that shape, unprompted.',
  statedPreferences: ['someone who talks', 'low key', 'nothing organised'],
  revealedHypotheses: [
    'says low key and means unhurried, not uneventful',
    'goes quiet in groups larger than four and calls it being tired',
  ],
  surface: 'relaxed to the point of unbothered',
  contradiction: 'prepares far more than he admits to',
  tinyDetail: 'owns a laminated card of local bridge load ratings',
  conversationStyle: ['unhurried', 'explanatory', 'warm'],
  socialEnergy: ['steady one-to-one', 'shuts down in a crowd'],
  availability: [
    { day: 3, startMin: 17 * 60, endMin: 21 * 60, energy: 0.7 },
    { day: 6, startMin: 10 * 60, endMin: 15 * 60, energy: 0.75 },
  ],
  portraitSeed: 33871,
  portraitTint: ['#E8913C', '#7A2BFF'],
};

const TOBI: Person = {
  id: 'tobi',
  name: 'Tobi',
  age: 19,
  major: 'Linguistics',
  fictionalCampus: 'Westbrook',
  profileLine: 'joined four days ago and has told us almost nothing.',
  statedPreferences: ['open to anything'],
  revealedHypotheses: ['nothing yet — there is no history to read'],
  surface: 'agreeable',
  contradiction: 'unknown, and pretending otherwise would be the mistake',
  tinyDetail: 'writes down words they like on the back of their hand',
  conversationStyle: ['unread'],
  socialEnergy: ['unread'],
  availability: [{ day: 3, startMin: 18 * 60, endMin: 22 * 60, energy: 0.7 }],
  portraitSeed: 77120,
  portraitTint: ['#C9A227', '#2B44FF'],
};

const WREN: Person = {
  id: 'wren',
  name: 'Wren',
  age: 20,
  major: 'Public Health',
  fictionalCampus: 'Westbrook',
  profileLine: 'answered three questions and then closed the app for a week.',
  statedPreferences: ['someone kind', 'not a big night out'],
  revealedHypotheses: ['one data point, and one data point is not a pattern'],
  surface: 'careful',
  contradiction: 'not established — we have seen them once',
  tinyDetail: 'keeps every ticket stub in a tin',
  conversationStyle: ['measured'],
  socialEnergy: ['unread'],
  availability: [{ day: 3, startMin: 17 * 60, endMin: 21 * 60, energy: 0.66 }],
  portraitSeed: 90233,
  portraitTint: ['#FF2E88', '#2FD8A8'],
};

const AMARA: Person = {
  id: 'amara',
  name: 'Amara',
  age: 22,
  major: 'Politics',
  fictionalCampus: 'Ardenmoor',
  profileLine: 'has an exam on thursday and a shift on every other day.',
  statedPreferences: ['someone who argues back', 'evenings only'],
  revealedHypotheses: [
    'the evenings she offers are the ones she is least able to keep',
    'cancels late rather than declining early',
  ],
  surface: 'always busy',
  contradiction: 'is not avoiding anyone — the week is genuinely full',
  tinyDetail: 'reads the footnotes first',
  conversationStyle: ['fast', 'combative in a friendly way'],
  socialEnergy: ['high but short', 'runs out abruptly'],
  availability: [{ day: 3, startMin: 20 * 60, endMin: 22 * 60, energy: 0.4 }],
  portraitSeed: 64019,
  portraitTint: ['#FF2E88', '#E8913C'],
};

const LUCA: Person = {
  id: 'luca',
  name: 'Luca',
  age: 21,
  major: 'Film',
  fictionalCampus: 'Ardenmoor',
  profileLine: 'knows everyone at every venue, which is the problem.',
  statedPreferences: ['somewhere with atmosphere', 'people around'],
  revealedHypotheses: [
    'is a different person the moment someone he knows walks in',
    'chooses rooms where he already has an audience',
  ],
  surface: 'effortlessly social',
  contradiction: 'has not had an unobserved first conversation in two years',
  tinyDetail: 'still shoots on a camcorder he found in a skip',
  conversationStyle: ['performative', 'generous', 'never still'],
  socialEnergy: ['very high in company', 'untested alone'],
  availability: [{ day: 3, startMin: 19 * 60, endMin: 23 * 60, energy: 0.8 }],
  portraitSeed: 12488,
  portraitTint: ['#7A2BFF', '#C9A227'],
};

/** Neither room is bad. Neither is quite enough. */
const ISLA_RAFAEL_SCENES: Scene[] = [
  {
    id: 'harbour-walk',
    label: 'HARBOUR WALK',
    time: '4:30 PM',
    location: 'the long way round the water',
    premise: 'ninety minutes of moving, and something to look at the whole time.',
    mood: 'shared',
    verdict: 'close. genuinely close.',
    verdictSub: 'the room is right. the week it lands in is not.',
    annotation:
      'she needs a subject before she needs a person, and the water is a subject. he explains things for a living. it should work.',
    artifacts: [{ kind: 'ticket', at: [0.1, -0.5, 0.02], rotate: 0.04, label: '4:30 PM' }],
    rationale: [
      'walking removes the eye contact that turns her formal.',
      'there is something external to react to for the whole ninety minutes.',
      'it is the best room either of them has open, and it is still short.',
    ],
    uncertainty: 'the forecast is poor and neither has said whether that matters.',
    metrics: evaluation(
      {
        pairSignal: 0.72,
        contextFit: 0.55,
        firstFifteenMinutesForecast: 0.52,
        scheduleFit: 0.7,
        travelFriction: 0.3,
        venueSafety: 0.9,
        attendanceLikelihood: 0.8,
        socialPressure: 0.4,
        noveltyValue: 0.45,
        explorationValue: 0.4,
        uncertainty: 0.38,
      },
      ['context fit short', 'first fifteen unproven', 'everything else adequate'],
    ),
  },
  {
    id: 'lab-open-day',
    label: 'LAB OPEN DAY',
    time: '1:00 PM',
    location: 'marine sciences, ground floor',
    premise: 'her territory, on a day it is full of strangers.',
    mood: 'rigid',
    verdict: 'her subject, her building, his disadvantage.',
    annotation:
      'putting one person on home ground and the other in a queue is not a first meeting, it is a tour.',
    artifacts: [{ kind: 'ticket', at: [-0.2, -0.48, 0.02], rotate: -0.06, label: '1:00 PM' }],
    rationale: [
      'she would be explaining, which is not the same as talking.',
      'the asymmetry is the whole scene and it never resolves.',
      'busy enough that leaving early would go unnoticed, which is not a feature.',
    ],
    uncertainty: 'he might genuinely love it. we have no evidence either way.',
    metrics: evaluation(
      {
        pairSignal: 0.72,
        contextFit: 0.34,
        firstFifteenMinutesForecast: 0.38,
        scheduleFit: 0.62,
        travelFriction: 0.22,
        venueSafety: 0.92,
        attendanceLikelihood: 0.74,
        socialPressure: 0.66,
        noveltyValue: 0.5,
        explorationValue: 0.44,
        uncertainty: 0.46,
      },
      ['asymmetric ground', 'social pressure high'],
    ),
  },
];

/** Two people the system has barely met. Nothing here is a room problem. */
const TOBI_WREN_SCENES: Scene[] = [
  {
    id: 'record-fair',
    label: 'RECORD FAIR',
    time: '6:30 PM',
    location: 'the old sports hall',
    premise: 'crates to dig through, and no obligation to face each other.',
    mood: 'shared',
    verdict: 'a reasonable guess. that is the problem.',
    verdictSub: 'we are guessing, and we can tell that we are guessing.',
    annotation:
      'this would be a good room for a lot of people. we do not yet know whether it is a good room for these two.',
    artifacts: [{ kind: 'ticket', at: [0.0, -0.5, 0.02], rotate: 0.02, label: '6:30 PM' }],
    rationale: [
      'plenty to react to, which covers a first ten minutes reliably.',
      'both are free, both are close, nothing about the logistics fails.',
      'every read on the two of them is thin, and thin reads are what this costs.',
    ],
    uncertainty: 'almost everything. four days and three answers between them.',
    metrics: evaluation(
      {
        pairSignal: 0.66,
        contextFit: 0.62,
        firstFifteenMinutesForecast: 0.58,
        scheduleFit: 0.6,
        travelFriction: 0.35,
        venueSafety: 0.94,
        attendanceLikelihood: 0.8,
        socialPressure: 0.5,
        noveltyValue: 0.5,
        explorationValue: 0.45,
        uncertainty: 0.72,
      },
      ['nothing is wrong', 'nothing is known'],
    ),
  },
  {
    id: 'late-canteen',
    label: 'LATE CANTEEN',
    time: '8:45 PM',
    location: 'the one that stays open',
    premise: 'strip lighting and a table.',
    mood: 'rigid',
    verdict: 'convenient. that is the only argument for it.',
    annotation:
      'when we know this little, the safe room is the one most likely to produce nothing we can learn from.',
    artifacts: [{ kind: 'cup', at: [-0.3, -0.4, 0.05], rotate: 0.05 }],
    rationale: [
      'nothing external happening, and no read on whether either can carry that.',
      'easy to reach and easy to leave, which is how it produces no signal.',
      'a night we learn nothing from costs the same week as one we do.',
    ],
    uncertainty: 'we would end the evening knowing exactly as much as we started with.',
    metrics: evaluation(
      {
        pairSignal: 0.66,
        contextFit: 0.34,
        firstFifteenMinutesForecast: 0.3,
        scheduleFit: 0.86,
        travelFriction: 0.1,
        venueSafety: 0.95,
        attendanceLikelihood: 0.86,
        socialPressure: 0.44,
        noveltyValue: 0.14,
        explorationValue: 0.16,
        uncertainty: 0.6,
      },
      ['safe and uninformative'],
    ),
  },
];

/** A full week and a room he cannot be himself in. Two problems, not one. */
const AMARA_LUCA_SCENES: Scene[] = [
  {
    id: 'late-set',
    label: 'LATE SET',
    time: '9:30 PM',
    location: 'the basement room he books',
    premise: 'his crowd, her two free hours, at the end of both.',
    mood: 'busy',
    verdict: 'not one thing wrong. two.',
    verdictSub: 'fixing either on its own still does not get there.',
    annotation:
      'she has two hours and no energy left in them. he has an audience and becomes someone else in front of it. separate failures, and they compound.',
    artifacts: [{ kind: 'ticket', at: [0.16, -0.46, 0.02], rotate: -0.05, label: '9:30 PM' }],
    rationale: [
      'the only hour she has free is the last one of a fourteen-hour day.',
      'six people he knows will come over, he will be delighted, and she will meet none of him.',
      'the room is his, so every version of the evening is one she is a guest at.',
    ],
    uncertainty: 'she might love the room. it would still not be a first conversation.',
    metrics: evaluation(
      {
        pairSignal: 0.58,
        contextFit: 0.4,
        firstFifteenMinutesForecast: 0.3,
        scheduleFit: 0.85,
        travelFriction: 0.2,
        venueSafety: 0.88,
        attendanceLikelihood: 0.55,
        socialPressure: 0.65,
        noveltyValue: 0.35,
        explorationValue: 0.3,
        uncertainty: 0.3,
      },
      ['schedule technically fits', 'attendance and audience both fail'],
    ),
  },
  {
    id: 'exam-eve-coffee',
    label: 'EXAM EVE COFFEE',
    time: '7:15 PM',
    location: 'the place by the library',
    premise: 'the night before the thing she has been dreading.',
    mood: 'rigid',
    verdict: 'the wrong tuesday, whoever she meets.',
    annotation:
      'we could book this. she would come. she would be somewhere else the whole time, and he would learn that she is distant.',
    artifacts: [{ kind: 'cup', at: [0.34, -0.36, 0.05], rotate: -0.07 }],
    rationale: [
      'the hour is free in the calendar and occupied in every other sense.',
      'a bad first read is worse than no first read, and this manufactures one.',
      'nothing about the room is at fault. it is the day.',
    ],
    uncertainty: 'she may well insist she is fine. that is not the same as being fine.',
    metrics: evaluation(
      {
        pairSignal: 0.58,
        contextFit: 0.3,
        firstFifteenMinutesForecast: 0.24,
        scheduleFit: 0.7,
        travelFriction: 0.14,
        venueSafety: 0.95,
        attendanceLikelihood: 0.5,
        socialPressure: 0.4,
        noveltyValue: 0.16,
        explorationValue: 0.2,
        uncertainty: 0.44,
      },
      ['wrong day for anyone'],
    ),
  },
];

function pair(
  id: string,
  personA: Person,
  personB: Person,
  pairSignal: number,
  scenes: Scene[],
  hearMeOut: MatchPair['hearMeOut'],
): MatchPair {
  return { id, personA, personB, pairSignal, scenes, fragments: [], hearMeOut };
}

export const HELD_BACK: MatchPair[] = [
  pair('isla-rafael', ISLA, RAFAEL, 0.72, ISLA_RAFAEL_SCENES, {
    stated: 'he said nothing organised.',
    reading: 'he means unhurried. she reads unstructured as being left to perform.',
    line: 'the same word, meaning two different rooms.',
  }),
  pair('tobi-wren', TOBI, WREN, 0.66, TOBI_WREN_SCENES, {
    stated: 'they both said they are open to anything.',
    reading: 'open to anything is what people say before they have said anything.',
    line: 'we have no idea yet, and we would rather say so.',
  }),
  pair('amara-luca', AMARA, LUCA, 0.58, AMARA_LUCA_SCENES, {
    stated: 'she said evenings only.',
    reading: 'the evenings she offers are the ones she is least able to keep.',
    line: 'her calendar agrees. nothing else does.',
  }),
];
