import type { MatchPair, Scene } from '@/lib/types';
import type { Person } from '@/lib/types';

/**
 * SYNTHETIC. Next Wednesday.
 *
 * This pair exists to answer one question honestly: does last week's learning
 * actually change anything, or is "the system learned" just a sentence?
 *
 * The metrics are tuned so COFFEE leads GALLERY DRIFT by a hair on the original
 * weights — and loses to it once social pressure costs more. Not a landslide: a
 * genuine near-tie that a modest re-weighting is enough to tip. That is what a
 * single date's worth of evidence should be able to do, and no more.
 *
 * The consequence is bigger than the reorder. On last week's weights COFFEE was
 * comfortably sendable; on this week's it falls below the send bar entirely. So
 * the learning does not merely change the answer, it changes whether the old
 * answer was ever acceptable.
 */

const PAIR_SIGNAL = 0.74;

export const NOOR: Person = {
  id: 'noor',
  name: 'Noor',
  age: 21,
  major: 'Biochemistry',
  fictionalCampus: 'Westbrook',
  profileLine: 'runs the lab group chat and answers at 2am.',
  statedPreferences: ['someone easy to talk to', 'nothing intense', 'daytime'],
  revealedHypotheses: [
    'is easy to talk to and finds being told so exhausting',
    'does better when the room gives her something to do with her hands',
  ],
  surface: 'the easy one to talk to',
  contradiction: 'which is exactly why being watched do it is the hard part',
  tinyDetail: 'has never once finished a coffee before it went cold',
  conversationStyle: ['warm', 'quick', 'deflects with questions'],
  socialEnergy: ['generous', 'depletes quietly', 'best mid-afternoon'],
  availability: [
    { day: 3, startMin: 14 * 60, endMin: 20 * 60, energy: 0.8 },
    { day: 4, startMin: 15 * 60, endMin: 21 * 60, energy: 0.72 },
  ],
  portraitSeed: 61204,
  portraitTint: ['#E8913C', '#2B44FF'],
};

export const SAM: Person = {
  id: 'sam',
  name: 'Sam',
  age: 22,
  major: 'Urban Planning',
  fictionalCampus: 'Westbrook',
  profileLine: 'will tell you why that junction is badly designed.',
  statedPreferences: ['someone curious', 'likes walking', 'no pressure'],
  revealedHypotheses: [
    'needs a subject before he can have a conversation',
    'reads a quiet table as a test he is currently failing',
  ],
  surface: 'happy to talk to anyone',
  contradiction: 'as long as there is something in the room to talk about',
  tinyDetail: 'photographs bad signage and has a folder of it',
  conversationStyle: ['discursive', 'better with a prompt', 'warms fast'],
  socialEnergy: ['steady', 'needs an object', 'unfazed by crowds'],
  availability: [
    { day: 3, startMin: 13 * 60, endMin: 21 * 60, energy: 0.82 },
    { day: 4, startMin: 16 * 60, endMin: 22 * 60, energy: 0.78 },
  ],
  portraitSeed: 48815,
  portraitTint: ['#2B44FF', '#5FE3AE'],
};

const SCENES: Scene[] = [
  {
    id: 'coffee',
    label: 'COFFEE',
    time: '4:15 PM',
    location: 'campus café',
    premise: 'two chairs, one table, and two people who are good at this.',
    mood: 'rigid',
    verdict: 'on paper, the obvious one.',
    verdictSub: 'both easy to talk to. both aware they are being easy to talk to.',
    annotation: 'the safest room in the set, and the one with nowhere to look.',
    artifacts: [
      { kind: 'cup', at: [-0.42, -0.34, 0.06], rotate: -0.08 },
      { kind: 'cup', at: [0.42, -0.34, 0.06], rotate: 0.11 },
      { kind: 'timestamp', at: [0.0, 0.44, 0.02], rotate: 0, label: '4:15 PM' },
    ],
    rationale: [
      'daylight, on campus, both free — almost nothing can go wrong logistically.',
      'they are both genuinely good at conversation, which is why this scores well.',
      'and it is still two people performing being good at conversation.',
    ],
    uncertainty: 'they might simply carry it. plenty of people do.',
    metrics: {
      pairSignal: PAIR_SIGNAL,
      contextFit: 0.74,
      firstFifteenMinutesForecast: 0.7,
      scheduleFit: 0.9,
      travelFriction: 0.07,
      venueSafety: 0.95,
      attendanceLikelihood: 0.92,
      socialPressure: 0.78,
      noveltyValue: 0.18,
      explorationValue: 0.22,
      uncertainty: 0.26,
      rationale: ['logistics excellent', 'pressure high'],
    },
  },
  {
    id: 'gallery',
    label: 'GALLERY DRIFT',
    // Late, deliberately. `scheduleFit` is derived from these two calendars
    // now, so a room's hour has to be authored with the calendars in mind
    // rather than compensated for afterwards with a hand-written score. This
    // one sits near the end of their shared window: the gallery is open, but
    // barely, and the model should be able to see that from the clock alone.
    time: '7:50 PM',
    location: 'student gallery',
    premise: 'a room that supplies the subject so neither of them has to.',
    mood: 'curious',
    verdict: 'less convenient. much less pressure.',
    annotation: 'he needs a subject. she needs to not be the subject. the walls solve both.',
    artifacts: [
      { kind: 'gallery-label', at: [-0.5, -0.28, 0.06], rotate: 0.05, label: 'UNTITLED, 2026' },
      { kind: 'poster', at: [0.52, -0.2, 0.02], rotate: -0.07 },
      { kind: 'notebook', at: [0.04, -0.58, 0.05], rotate: 0.09 },
    ],
    rationale: [
      'nobody has to be interesting; the room is already doing it.',
      'she can be warm without being watched being warm.',
      'harder to reach, shorter window, and worth both.',
    ],
    uncertainty: 'a thin show would leave them with the café problem anyway.',
    metrics: {
      pairSignal: PAIR_SIGNAL,
      contextFit: 0.7,
      firstFifteenMinutesForecast: 0.66,
      scheduleFit: 0.66,
      travelFriction: 0.32,
      venueSafety: 0.9,
      attendanceLikelihood: 0.7,
      socialPressure: 0.24,
      noveltyValue: 0.55,
      explorationValue: 0.6,
      uncertainty: 0.4,
      rationale: ['pressure low', 'logistics weaker'],
    },
  },
  {
    id: 'mission',
    label: 'MINI MISSION',
    time: '5:05 PM',
    location: 'campus bookstore',
    premise: 'find the strangest object in the store. ten minutes. go.',
    mood: 'shared',
    verdict: 'good instinct. slightly too much theatre.',
    annotation: 'the task helps him and makes her the host of it.',
    thirdThing: 'find the strangest object in the store',
    artifacts: [
      { kind: 'challenge-card', at: [0.0, -0.3, 0.1], rotate: -0.04, label: 'STRANGEST OBJECT' },
      { kind: 'marker', at: [-0.46, -0.5, 0.04], rotate: 0.42 },
      { kind: 'receipt', at: [0.48, -0.46, 0.03], rotate: -0.13, label: 'BOOKSTORE' },
    ],
    rationale: [
      'a shared object is right for him and he would relax immediately.',
      'she would end up running it, which is the exact job she needs a night off from.',
      'a good room for one of them.',
    ],
    uncertainty: 'she may enjoy running it more than we think.',
    metrics: {
      pairSignal: PAIR_SIGNAL,
      contextFit: 0.6,
      firstFifteenMinutesForecast: 0.68,
      scheduleFit: 0.72,
      travelFriction: 0.14,
      venueSafety: 0.92,
      attendanceLikelihood: 0.78,
      socialPressure: 0.44,
      noveltyValue: 0.62,
      explorationValue: 0.58,
      uncertainty: 0.42,
      rationale: ['asymmetric', 'solid logistics'],
    },
  },
  {
    id: 'postshow',
    label: 'POST SHOW WALK',
    time: '8:32 PM',
    location: 'theatre exit → tacos',
    premise: 'something already happened. now there are seven minutes of pavement.',
    mood: 'inevitable',
    verdict: 'right shape. wrong hour for her.',
    annotation: 'she is generous until about eight, and then she is finished.',
    artifacts: [
      { kind: 'ticket', at: [-0.52, -0.24, 0.1], rotate: -0.09, label: 'ROW H · 14' },
      { kind: 'timestamp', at: [0.0, 0.44, 0.02], rotate: 0, label: '8:32 PM' },
      { kind: 'route', at: [0.0, -0.52, 0.04], rotate: 0, label: '7 MIN WALK' },
    ],
    rationale: [
      'the structure is exactly right and the timing is exactly wrong.',
      'her energy is a mid-afternoon resource and this spends it at the end of the day.',
      'worth revisiting on a week she is not on lab rota.',
    ],
    uncertainty: 'a lighter week makes this the best of the six.',
    metrics: {
      pairSignal: PAIR_SIGNAL,
      contextFit: 0.72,
      firstFifteenMinutesForecast: 0.74,
      scheduleFit: 0.3,
      travelFriction: 0.26,
      venueSafety: 0.86,
      attendanceLikelihood: 0.46,
      socialPressure: 0.2,
      noveltyValue: 0.68,
      explorationValue: 0.64,
      uncertainty: 0.46,
      rationale: ['shape right', 'hour wrong'],
    },
  },
  {
    id: 'group',
    label: 'GROUP LANDING',
    time: '6:45 PM',
    location: 'small group event',
    premise: 'six people, one of whom is the point.',
    mood: 'busy',
    verdict: 'she would host it. he would enjoy it. separately.',
    annotation: 'the room rewards exactly the habit she needs a break from.',
    artifacts: [
      { kind: 'name-tag', at: [-0.5, -0.3, 0.06], rotate: -0.12, label: 'HI, I’M' },
      { kind: 'name-tag', at: [0.5, -0.26, 0.05], rotate: 0.14, label: 'HI, I’M' },
      { kind: 'poster', at: [0.0, 0.36, 0.01], rotate: 0.03 },
    ],
    rationale: [
      'almost nobody cancels on a group, so it will happen.',
      'she will spend the night making other people comfortable.',
      'they would leave having learned very little about each other.',
    ],
    uncertainty: 'group composition changes this more than anything we control.',
    metrics: {
      pairSignal: PAIR_SIGNAL,
      contextFit: 0.48,
      firstFifteenMinutesForecast: 0.6,
      scheduleFit: 0.76,
      travelFriction: 0.16,
      venueSafety: 0.94,
      attendanceLikelihood: 0.84,
      socialPressure: 0.5,
      noveltyValue: 0.42,
      explorationValue: 0.38,
      uncertainty: 0.54,
      rationale: ['attendance high', 'signal blurry'],
    },
  },
  {
    id: 'study',
    label: 'STUDY BREAK',
    time: '9:15 PM',
    location: 'library steps',
    premise: 'both free. neither has anything left.',
    mood: 'depleted',
    verdict: 'calendar fit isn’t human fit.',
    annotation: 'the slot a scheduler picks when it is optimising for the wrong variable.',
    artifacts: [
      { kind: 'notebook', at: [-0.44, -0.42, 0.03], rotate: -0.3 },
      { kind: 'cup', at: [0.4, -0.5, 0.02], rotate: 0.34 },
      { kind: 'timestamp', at: [0.0, 0.42, 0.01], rotate: -0.02, label: '9:15 PM' },
    ],
    rationale: [
      'zero cost, zero travel, zero booking.',
      'and nine at night is well past the hour either of them is any good.',
      'it survives contact with reality without producing anything.',
    ],
    uncertainty: 'low stakes enough that it might work by accident.',
    metrics: {
      pairSignal: PAIR_SIGNAL,
      contextFit: 0.34,
      firstFifteenMinutesForecast: 0.3,
      scheduleFit: 0.94,
      travelFriction: 0.06,
      venueSafety: 0.88,
      attendanceLikelihood: 0.68,
      socialPressure: 0.42,
      noveltyValue: 0.12,
      explorationValue: 0.16,
      uncertainty: 0.46,
      rationale: ['cheap', 'empty'],
    },
  },
];

export const WEEK_TWO: MatchPair = {
  id: 'noor-sam',
  personA: NOOR,
  personB: SAM,
  pairSignal: PAIR_SIGNAL,
  scenes: SCENES,
  fragments: [
    { text: 'both good at this. | both tired of being good at it.', kind: 'tension', pull: 0, surfacesAt: 0.12 },
    { text: 'he needs a subject. | she needs to not be one.', kind: 'shared', pull: 0, surfacesAt: 0.34 },
    { text: 'she answers at 2am. | he photographs signage.', kind: 'lopsided', pull: -1, surfacesAt: 0.5 },
    { text: 'neither has ever | finished a coffee.', kind: 'spark', pull: 0, surfacesAt: 0.74 },
  ],
  hearMeOut: {
    stated: 'nothing intense',
    reading: 'the intensity she is avoiding is being looked at, not being interested',
    line: 'you asked for easy. the café is easy. it is also two hours of eye contact.',
  },
};
