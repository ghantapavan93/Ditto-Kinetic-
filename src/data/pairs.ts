import { JONAH, MAYA, PRIYA, THEO } from './people';
import { WEEK_TWO } from './weekTwo';
import type { MatchPair, Scene } from '@/lib/types';

/**
 * SYNTHETIC. Two pairs, six candidate openings each.
 *
 * The six scene *shapes* are identical across both pairs — same labels, same
 * artifacts, same physical vocabulary. Only the metrics differ. That is the
 * proof that this is a system and not a hardcoded cinematic: run the same
 * scorer over the same six rooms with different people in them and a different
 * room wins.
 *
 * For Maya × Jonah, POST SHOW WALK wins and COFFEE ranks near the bottom.
 * The exact position is not authored here -- `scheduleFit` is derived from the
 * two calendars, so where a room lands is a consequence of the data rather
 * than a decision recorded next to it.
 * For Priya × Theo, COFFEE wins and POST SHOW WALK comes last.
 *
 * `pairSignal` is constant within each pair — deliberately. These two people are
 * as compatible in the café at 6pm as they are on the walk at 8:32. Everything
 * that moves between rows is context.
 */

const MJ_PAIR_SIGNAL = 0.78;
const PT_PAIR_SIGNAL = 0.71;

/* ------------------------------------------------------------------------- */
/* PAIR 1 — Maya × Jonah                                                      */
/* ------------------------------------------------------------------------- */

const MJ_SCENES: Scene[] = [
  {
    id: 'coffee',
    label: 'COFFEE',
    time: '6:00 PM',
    location: 'campus café',
    premise: 'two chairs, one table, nothing else happening.',
    mood: 'rigid',
    verdict: 'possible. but too interview-y.',
    annotation:
      'both technically have things to talk about. neither wants to audition for the other.',
    artifacts: [
      { kind: 'cup', at: [-0.42, -0.34, 0.06], rotate: -0.08 },
      { kind: 'cup', at: [0.42, -0.34, 0.06], rotate: 0.11 },
      { kind: 'coffee-sleeve', at: [0.06, -0.62, 0.02], rotate: 0.03, label: '6:00 PM' },
    ],
    rationale: [
      'the table makes eye contact the default and silence the failure state.',
      'nothing external is happening, so the first ten minutes have to be carried by two people who both dislike carrying it.',
      'easy to schedule, easy to reach, easy to leave. none of which is the problem.',
    ],
    uncertainty: 'we may be underrating how much they would enjoy each other anyway.',
    metrics: {
      pairSignal: MJ_PAIR_SIGNAL,
      contextFit: 0.3,
      firstFifteenMinutesForecast: 0.22,
      scheduleFit: 0.92,
      travelFriction: 0.1,
      venueSafety: 0.95,
      attendanceLikelihood: 0.88,
      socialPressure: 0.82,
      noveltyValue: 0.15,
      explorationValue: 0.2,
      uncertainty: 0.3,
      rationale: ['schedule fit high', 'first fifteen weak', 'social pressure high'],
    },
  },
  {
    id: 'mission',
    label: 'MINI MISSION',
    time: '5:18 PM',
    location: 'campus bookstore',
    premise: 'find the strangest object in the store. ten minutes. go.',
    mood: 'shared',
    verdict: 'a tiny mission gives the silence a job.',
    annotation:
      'now there is a third thing in the room, and neither of them has to be the entertainment.',
    thirdThing: 'find the strangest object in the store',
    artifacts: [
      { kind: 'challenge-card', at: [0.0, -0.3, 0.1], rotate: -0.04, label: 'STRANGEST OBJECT' },
      { kind: 'marker', at: [-0.46, -0.5, 0.04], rotate: 0.42 },
      { kind: 'receipt', at: [0.48, -0.46, 0.03], rotate: -0.13, label: 'BOOKSTORE' },
    ],
    rationale: [
      'a shared task absorbs the first ten minutes so neither of them has to perform.',
      'it is short. if the energy is wrong, it ends without anyone deciding to end it.',
      'walking the aisles means side-by-side, not across-from.',
    ],
    uncertainty: 'a bit gimmicky if they both find the premise embarrassing.',
    metrics: {
      pairSignal: MJ_PAIR_SIGNAL,
      contextFit: 0.72,
      firstFifteenMinutesForecast: 0.75,
      scheduleFit: 0.74,
      travelFriction: 0.14,
      venueSafety: 0.92,
      attendanceLikelihood: 0.8,
      socialPressure: 0.42,
      noveltyValue: 0.7,
      explorationValue: 0.66,
      uncertainty: 0.38,
      rationale: ['shared object strong', 'short runway', 'novelty high'],
    },
  },
  {
    id: 'gallery',
    label: 'GALLERY DRIFT',
    time: '7:10 PM',
    location: 'student gallery',
    premise: 'a room full of other people’s decisions to have opinions about.',
    mood: 'curious',
    verdict: 'curiosity is doing most of the talking.',
    annotation:
      'she reads rooms for a living. he has opinions about everything. the walls do the work.',
    artifacts: [
      { kind: 'gallery-label', at: [-0.5, -0.28, 0.06], rotate: 0.05, label: 'UNTITLED, 2026' },
      { kind: 'poster', at: [0.52, -0.2, 0.02], rotate: -0.07 },
      { kind: 'notebook', at: [0.04, -0.58, 0.05], rotate: 0.09 },
    ],
    rationale: [
      'every ten steps supplies a new thing to react to. the conversation never has to be invented.',
      'moving between works means silences read as looking, not as stalling.',
      'closes at 8, which caps the evening without either of them calling it.',
    ],
    uncertainty: 'depends entirely on the show being any good this week.',
    metrics: {
      pairSignal: MJ_PAIR_SIGNAL,
      contextFit: 0.78,
      firstFifteenMinutesForecast: 0.8,
      scheduleFit: 0.68,
      travelFriction: 0.34,
      venueSafety: 0.9,
      attendanceLikelihood: 0.72,
      socialPressure: 0.34,
      noveltyValue: 0.66,
      explorationValue: 0.72,
      uncertainty: 0.36,
      rationale: ['shared stimulus strong', 'runway good', 'travel medium'],
    },
  },
  {
    id: 'postshow',
    label: 'POST SHOW WALK',
    time: '8:32 PM',
    location: 'theatre exit → tacos',
    premise: 'something already happened. now there are seven minutes of pavement.',
    mood: 'inevitable',
    verdict: 'THIS ONE.',
    verdictSub: 'they don’t need more compatibility. they need less pressure.',
    annotation: 'both of them open up after something has already happened.',
    artifacts: [
      { kind: 'ticket', at: [-0.52, -0.24, 0.1], rotate: -0.09, label: 'ROW H · 14' },
      { kind: 'timestamp', at: [0.0, 0.44, 0.02], rotate: 0, label: '8:32 PM' },
      { kind: 'route', at: [0.0, -0.52, 0.04], rotate: 0, label: '7 MIN WALK' },
      { kind: 'receipt', at: [0.54, -0.36, 0.05], rotate: 0.12, label: 'TACOS · $11' },
    ],
    rationale: [
      'neither likes carrying the first ten minutes alone.',
      'something already happened, so there is already something to react to.',
      'seven minute walk. enough runway. easy exit if the vibe isn’t there.',
    ],
    uncertainty: 'whether their energy still works once the shared event is gone.',
    metrics: {
      pairSignal: MJ_PAIR_SIGNAL,
      contextFit: 0.91,
      firstFifteenMinutesForecast: 0.93,
      scheduleFit: 0.71,
      travelFriction: 0.22,
      venueSafety: 0.86,
      attendanceLikelihood: 0.84,
      socialPressure: 0.18,
      noveltyValue: 0.74,
      explorationValue: 0.7,
      uncertainty: 0.42,
      rationale: ['shared stimulus strong', 'runway strong', 'social pressure low'],
    },
  },
  {
    id: 'group',
    label: 'GROUP LANDING',
    time: '6:45 PM',
    location: 'small group event',
    premise: 'six people, one of whom is the point.',
    mood: 'busy',
    verdict: 'comfortable. but the signal gets blurry.',
    annotation:
      'nobody has to perform, which also means nobody has to show up as themselves.',
    artifacts: [
      { kind: 'name-tag', at: [-0.5, -0.3, 0.06], rotate: -0.12, label: 'HI, I’M' },
      { kind: 'name-tag', at: [0.5, -0.26, 0.05], rotate: 0.14, label: 'HI, I’M' },
      { kind: 'cup', at: [-0.16, -0.56, 0.03], rotate: 0.2 },
      { kind: 'cup', at: [0.2, -0.6, 0.03], rotate: -0.16 },
      { kind: 'poster', at: [0.0, 0.36, 0.01], rotate: 0.03 },
    ],
    rationale: [
      'lowest possible stakes — almost nobody cancels on a group.',
      'but four other people are also generating conversation, and two of them are funnier than the situation needs.',
      'they could leave without having spoken to each other for more than nine minutes.',
    ],
    uncertainty: 'we cannot tell in advance whether they would find each other in the room.',
    metrics: {
      pairSignal: MJ_PAIR_SIGNAL,
      contextFit: 0.58,
      firstFifteenMinutesForecast: 0.68,
      scheduleFit: 0.8,
      travelFriction: 0.18,
      venueSafety: 0.94,
      attendanceLikelihood: 0.9,
      socialPressure: 0.3,
      noveltyValue: 0.48,
      explorationValue: 0.4,
      uncertainty: 0.62,
      rationale: ['attendance high', 'signal blurry', 'uncertainty high'],
    },
  },
  {
    id: 'study',
    label: 'STUDY BREAK',
    time: '9:15 PM',
    location: 'library steps',
    premise: 'both free. neither available.',
    mood: 'depleted',
    verdict: 'calendar fit isn’t human fit.',
    verdictSub: 'both technically free. neither actually socially alive.',
    annotation:
      'this is the slot a scheduler picks when it is optimising for the wrong variable.',
    artifacts: [
      { kind: 'notebook', at: [-0.44, -0.42, 0.03], rotate: -0.3 },
      { kind: 'cup', at: [0.4, -0.5, 0.02], rotate: 0.34 },
      { kind: 'timestamp', at: [0.0, 0.42, 0.01], rotate: -0.02, label: '9:15 PM' },
    ],
    rationale: [
      'the only scene where both calendars are completely clear — and it is the worst one.',
      'nine hours into a Wednesday, neither of them has a first impression left to make.',
      'a fifteen-minute window on library steps is not a date, it is a scheduling artefact.',
    ],
    uncertainty: 'low-stakes enough that it might work by accident.',
    metrics: {
      pairSignal: MJ_PAIR_SIGNAL,
      contextFit: 0.24,
      firstFifteenMinutesForecast: 0.2,
      scheduleFit: 0.96,
      travelFriction: 0.08,
      venueSafety: 0.88,
      attendanceLikelihood: 0.62,
      socialPressure: 0.55,
      noveltyValue: 0.1,
      explorationValue: 0.12,
      uncertainty: 0.5,
      rationale: ['schedule fit perfect', 'everything else empty'],
    },
  },
];

/* ------------------------------------------------------------------------- */
/* PAIR 2 — Priya × Theo                                                      */
/* Same six rooms. Different people. Different answer.                        */
/* ------------------------------------------------------------------------- */

const PT_SCENES: Scene[] = [
  {
    id: 'coffee',
    label: 'COFFEE',
    time: '3:40 PM',
    location: 'campus café',
    premise: 'two chairs, one table, and two people who both prefer that.',
    mood: 'inevitable',
    verdict: 'THIS ONE.',
    verdictSub: 'for these two, the table is not pressure. it’s permission.',
    annotation:
      'she skips the preamble. he likes being argued with. the empty table is the feature.',
    artifacts: [
      { kind: 'cup', at: [-0.42, -0.34, 0.06], rotate: -0.08 },
      { kind: 'cup', at: [0.42, -0.34, 0.06], rotate: 0.11 },
      { kind: 'timestamp', at: [0.0, 0.44, 0.02], rotate: 0, label: '3:40 PM' },
      { kind: 'coffee-sleeve', at: [0.06, -0.62, 0.02], rotate: 0.03, label: 'BETWEEN SHIFTS' },
    ],
    rationale: [
      'neither of them wants an activity — both read one as a way of avoiding the conversation.',
      'daylight, ninety minutes, between her shifts. it is the only window that reliably survives.',
      'no travel, no ticket, nothing to go wrong. for a schedule this broken, that is the whole game.',
    ],
    uncertainty: 'if the conversation stalls there is genuinely nothing to fall back on.',
    metrics: {
      pairSignal: PT_PAIR_SIGNAL,
      contextFit: 0.86,
      firstFifteenMinutesForecast: 0.82,
      scheduleFit: 0.93,
      travelFriction: 0.08,
      venueSafety: 0.95,
      attendanceLikelihood: 0.94,
      socialPressure: 0.22,
      noveltyValue: 0.2,
      explorationValue: 0.25,
      uncertainty: 0.24,
      rationale: ['schedule fit decisive', 'both prefer direct', 'nothing to cancel'],
    },
  },
  {
    id: 'mission',
    label: 'MINI MISSION',
    time: '5:18 PM',
    location: 'campus bookstore',
    premise: 'find the strangest object in the store. ten minutes. go.',
    mood: 'shared',
    verdict: 'fine. but they don’t need the crutch.',
    annotation: 'the mission solves a problem these two do not have.',
    thirdThing: 'find the strangest object in the store',
    artifacts: [
      { kind: 'challenge-card', at: [0.0, -0.3, 0.1], rotate: -0.04, label: 'STRANGEST OBJECT' },
      { kind: 'marker', at: [-0.46, -0.5, 0.04], rotate: 0.42 },
      { kind: 'receipt', at: [0.48, -0.46, 0.03], rotate: -0.13, label: 'BOOKSTORE' },
    ],
    rationale: [
      'the shared task is real, but it is buying down a first-ten-minutes risk that is already low.',
      '5:18 clips the end of her shift more often than not.',
      'he would probably treat the game as something to get through before talking.',
    ],
    uncertainty: 'he might enjoy it more than his history suggests.',
    metrics: {
      pairSignal: PT_PAIR_SIGNAL,
      contextFit: 0.58,
      firstFifteenMinutesForecast: 0.55,
      scheduleFit: 0.66,
      travelFriction: 0.16,
      venueSafety: 0.92,
      attendanceLikelihood: 0.72,
      socialPressure: 0.4,
      noveltyValue: 0.62,
      explorationValue: 0.6,
      uncertainty: 0.44,
      rationale: ['solves a risk they do not have', 'schedule marginal'],
    },
  },
  {
    id: 'gallery',
    label: 'GALLERY DRIFT',
    time: '7:10 PM',
    location: 'student gallery',
    premise: 'a room full of other people’s decisions to have opinions about.',
    mood: 'curious',
    verdict: 'good room. wrong hour.',
    annotation: 'everything about this works except the one thing that has to.',
    artifacts: [
      { kind: 'gallery-label', at: [-0.5, -0.28, 0.06], rotate: 0.05, label: 'UNTITLED, 2026' },
      { kind: 'poster', at: [0.52, -0.2, 0.02], rotate: -0.07 },
      { kind: 'notebook', at: [0.04, -0.58, 0.05], rotate: 0.09 },
    ],
    rationale: [
      '7:10 is after a twelve-hour shift. she will say yes and then not go.',
      'the walk across campus adds fifteen minutes to an evening that has none spare.',
      'the conversation would be good. that is not the constraint that is binding here.',
    ],
    uncertainty: 'on a rota week this becomes one of the better options.',
    metrics: {
      pairSignal: PT_PAIR_SIGNAL,
      contextFit: 0.52,
      firstFifteenMinutesForecast: 0.5,
      scheduleFit: 0.44,
      travelFriction: 0.42,
      venueSafety: 0.9,
      attendanceLikelihood: 0.58,
      socialPressure: 0.36,
      noveltyValue: 0.58,
      explorationValue: 0.62,
      uncertainty: 0.48,
      rationale: ['timing fails', 'travel high'],
    },
  },
  {
    id: 'postshow',
    label: 'POST SHOW WALK',
    time: '8:32 PM',
    location: 'theatre exit → tacos',
    premise: 'something already happened. now there are seven minutes of pavement.',
    mood: 'depleted',
    verdict: 'the best scene for someone else.',
    verdictSub: 'she is twelve hours into a shift. the walk is the reason this fails.',
    annotation:
      'this is the winning opening for the other pair. run the same six rooms for these two and it comes last.',
    artifacts: [
      { kind: 'ticket', at: [-0.52, -0.24, 0.1], rotate: -0.09, label: 'ROW H · 14' },
      { kind: 'timestamp', at: [0.0, 0.44, 0.02], rotate: 0, label: '8:32 PM' },
      { kind: 'route', at: [0.0, -0.52, 0.04], rotate: 0, label: '7 MIN WALK' },
      { kind: 'receipt', at: [0.54, -0.36, 0.05], rotate: 0.12, label: 'TACOS · $11' },
    ],
    rationale: [
      'an 8:32 start requires a ticket bought in advance for an evening she cannot promise.',
      'the shared event is doing work neither of them needs done.',
      'highest cancellation risk of the six. the plan is good; the people are wrong for it.',
    ],
    uncertainty: 'on a week off this might be the best night either of them has.',
    metrics: {
      pairSignal: PT_PAIR_SIGNAL,
      contextFit: 0.4,
      firstFifteenMinutesForecast: 0.62,
      scheduleFit: 0.18,
      travelFriction: 0.3,
      venueSafety: 0.8,
      attendanceLikelihood: 0.34,
      socialPressure: 0.2,
      noveltyValue: 0.7,
      explorationValue: 0.66,
      uncertainty: 0.55,
      rationale: ['attendance low', 'schedule fails', 'pressure genuinely low'],
    },
  },
  {
    id: 'group',
    label: 'GROUP LANDING',
    time: '6:45 PM',
    location: 'small group event',
    premise: 'six people, one of whom is the point.',
    mood: 'busy',
    verdict: 'she would run it. he would leave early.',
    annotation: 'a room that rewards exactly one of them.',
    artifacts: [
      { kind: 'name-tag', at: [-0.5, -0.3, 0.06], rotate: -0.12, label: 'HI, I’M' },
      { kind: 'name-tag', at: [0.5, -0.26, 0.05], rotate: 0.14, label: 'HI, I’M' },
      { kind: 'cup', at: [-0.16, -0.56, 0.03], rotate: 0.2 },
      { kind: 'cup', at: [0.2, -0.6, 0.03], rotate: -0.16 },
      { kind: 'poster', at: [0.0, 0.36, 0.01], rotate: 0.03 },
    ],
    rationale: [
      'easy to attend, hard to actually meet in.',
      'she is the most comfortable person in any group; he measures a room before entering it.',
      'they would both have a fine evening and learn almost nothing about each other.',
    ],
    uncertainty: 'group composition changes this result more than anything we control.',
    metrics: {
      pairSignal: PT_PAIR_SIGNAL,
      contextFit: 0.46,
      firstFifteenMinutesForecast: 0.6,
      scheduleFit: 0.72,
      travelFriction: 0.16,
      venueSafety: 0.94,
      attendanceLikelihood: 0.8,
      socialPressure: 0.44,
      noveltyValue: 0.44,
      explorationValue: 0.38,
      uncertainty: 0.58,
      rationale: ['asymmetric fit', 'signal blurry'],
    },
  },
  {
    id: 'study',
    label: 'STUDY BREAK',
    time: '9:15 PM',
    location: 'library steps',
    premise: 'both free. one of them still standing.',
    mood: 'rigid',
    verdict: 'closer than it should be. still no.',
    annotation:
      'it scores well because it is cheap, not because it is good. cheap is not the same as right.',
    artifacts: [
      { kind: 'notebook', at: [-0.44, -0.42, 0.03], rotate: -0.3 },
      { kind: 'cup', at: [0.4, -0.5, 0.02], rotate: 0.34 },
      { kind: 'timestamp', at: [0.0, 0.42, 0.01], rotate: -0.02, label: '9:15 PM' },
    ],
    rationale: [
      'zero travel, zero booking, zero cost — for a broken schedule that counts for a lot.',
      'he is unbothered by a low-key setting; she is post-shift and running on nothing.',
      'it survives contact with reality. it just does not produce a second date.',
    ],
    uncertainty: 'the model may be over-rewarding “nothing can go wrong” here.',
    metrics: {
      pairSignal: PT_PAIR_SIGNAL,
      contextFit: 0.62,
      firstFifteenMinutesForecast: 0.48,
      scheduleFit: 0.95,
      travelFriction: 0.06,
      venueSafety: 0.88,
      attendanceLikelihood: 0.86,
      socialPressure: 0.34,
      noveltyValue: 0.16,
      explorationValue: 0.2,
      uncertainty: 0.4,
      rationale: ['cheap and safe', 'low ceiling'],
    },
  },
];

export const PAIRS: MatchPair[] = [
  {
    id: 'maya-jonah',
    personA: MAYA,
    personB: JONAH,
    pairSignal: MJ_PAIR_SIGNAL,
    scenes: MJ_SCENES,
    fragments: [
      { text: 'both ambitious. | maybe too ambitious.', kind: 'tension', pull: 0, surfacesAt: 0.12 },
      { text: 'she plans everything. | he somehow never does. | weirdly promising.', kind: 'lopsided', pull: -1, surfacesAt: 0.3 },
      { text: 'both get funnier | after minute ten.', kind: 'shared', pull: 0, surfacesAt: 0.45 },
      { text: 'neither of them | fills a silence.', kind: 'shared', pull: 1, surfacesAt: 0.55 },
      { text: 'both secretly | sentimental.', kind: 'spark', pull: 0, surfacesAt: 0.72 },
      { text: 'same three shows. | neither posted about it.', kind: 'shared', pull: 0, surfacesAt: 0.82 },
    ],
    hearMeOut: {
      stated: 'not too outgoing',
      reading: 'they respond well to high energy — when the room is low pressure',
      line: 'i don’t think “outgoing” was the problem. i think being trapped across a table from it was.',
    },
  },
  {
    id: 'priya-theo',
    personA: PRIYA,
    personB: THEO,
    pairSignal: PT_PAIR_SIGNAL,
    scenes: PT_SCENES,
    fragments: [
      { text: 'her week is a rota. | his is a suggestion.', kind: 'tension', pull: 0, surfacesAt: 0.12 },
      { text: 'she skips the preamble. | he was going to anyway.', kind: 'shared', pull: 0, surfacesAt: 0.35 },
      { text: 'he likes being | argued with.', kind: 'lopsided', pull: 1, surfacesAt: 0.5 },
      { text: 'neither of them | wants an activity.', kind: 'shared', pull: 0, surfacesAt: 0.62 },
      { text: 'both awful | at being looked after.', kind: 'spark', pull: 0, surfacesAt: 0.78 },
    ],
    hearMeOut: {
      stated: 'someone spontaneous',
      reading: 'spontaneity costs her more than almost anyone — her calendar is the constraint',
      line: 'you asked for spontaneous. your last four cancellations disagree, and none of them were your fault.',
    },
  },
];

export const SCENE_ORDER = ['coffee', 'mission', 'gallery', 'postshow', 'group', 'study'] as const;

/**
 * Resolve any fully-modelled pair, not only the two the dial rotates between.
 *
 * The possibility layer can land the stage on Noor and Sam, who live in
 * `weekTwo.ts`. Before this, an unknown id fell back to pair one silently —
 * which would have meant arriving from /possibility with one pair promised and
 * a different pair shown, the exact kind of quiet lie this project exists to
 * refuse.
 */
export function pairById(id: string): MatchPair {
  return (
    PAIRS.find((p) => p.id === id) ??
    (WEEK_TWO.id === id ? WEEK_TWO : undefined) ??
    PAIRS[0]
  );
}
