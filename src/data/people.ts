import type { Person } from '@/lib/types';

/**
 * SYNTHETIC. Four invented people at two invented campuses.
 *
 * None of these are real students and none are derived from real profiles.
 * They exist to demonstrate one thing: a person's *stated* preference and their
 * *behavioural* pattern are different objects, and a matching system that only
 * reads the first one will keep booking the wrong room.
 *
 * Each has a contradiction rather than a hobby list. "Likes travel and music"
 * cannot produce an interesting decision; "warms up only once there is something
 * external to react to" can.
 */

export const MAYA: Person = {
  id: 'maya',
  name: 'Maya',
  age: 20,
  major: 'Architecture',
  fictionalCampus: 'Westbrook',
  profileLine: 'will redraw the seating plan of any room she is in.',
  statedPreferences: ['someone ambitious', 'not too outgoing', 'likes a plan'],
  revealedHypotheses: [
    'warms up sharply once there is something external to react to',
    'reads "getting to know you" questions as an interview and goes formal',
    'likes ambition — dislikes when it is the entire conversation',
  ],
  conversationStyle: ['dry', 'observational', 'slow to open, then fast'],
  socialEnergy: ['steady', 'needs a warm-up object', 'fades after 90 minutes'],
  availability: [
    { day: 3, startMin: 17 * 60, endMin: 22 * 60, energy: 0.72 },
    { day: 4, startMin: 18 * 60, endMin: 23 * 60, energy: 0.85 },
    { day: 5, startMin: 16 * 60, endMin: 21 * 60, energy: 0.6 },
  ],
  portraitSeed: 20481,
  portraitTint: ['#FF2E88', '#2B44FF'],
};

export const JONAH: Person = {
  id: 'jonah',
  name: 'Jonah',
  age: 21,
  major: 'Music Technology',
  fictionalCampus: 'Westbrook',
  profileLine: 'has four unfinished songs and one very finished opinion about them.',
  statedPreferences: ['someone funny', 'chill', 'not a big planner'],
  revealedHypotheses: [
    'performs too hard when seated across a table one-on-one',
    'settles once he is walking, building, or reacting to something',
    'does not want to carry the first ten minutes by himself',
  ],
  conversationStyle: ['fast', 'associative', 'funnier when not being watched'],
  socialEnergy: ['spiky', 'peaks late evening', 'needs a side activity'],
  availability: [
    { day: 3, startMin: 19 * 60, endMin: 24 * 60, energy: 0.8 },
    { day: 4, startMin: 20 * 60, endMin: 24 * 60, energy: 0.9 },
    { day: 6, startMin: 14 * 60, endMin: 22 * 60, energy: 0.65 },
  ],
  portraitSeed: 71339,
  portraitTint: ['#2B44FF', '#FFD84D'],
};

export const PRIYA: Person = {
  id: 'priya',
  name: 'Priya',
  age: 22,
  major: 'Nursing',
  fictionalCampus: 'Westbrook',
  profileLine: 'twelve-hour shifts. still texts back faster than you.',
  statedPreferences: ['someone spontaneous', 'up for anything', 'no small talk'],
  revealedHypotheses: [
    'schedule is genuinely broken — spontaneity costs her more than it costs most people',
    'socially confident: does not need an activity to open up',
    'anything starting after 8pm has a real chance of not happening at all',
  ],
  conversationStyle: ['direct', 'fast', 'skips the preamble'],
  socialEnergy: ['high but narrow', 'flat after a shift', 'best in daylight'],
  availability: [
    { day: 3, startMin: 15 * 60, endMin: 18 * 60 + 30, energy: 0.86 },
    { day: 5, startMin: 12 * 60, endMin: 17 * 60, energy: 0.9 },
    { day: 0, startMin: 11 * 60, endMin: 19 * 60, energy: 0.7 },
  ],
  portraitSeed: 55127,
  portraitTint: ['#5FE3AE', '#FF2E88'],
};

export const THEO: Person = {
  id: 'theo',
  name: 'Theo',
  age: 21,
  major: 'Economics',
  fictionalCampus: 'Westbrook',
  profileLine: 'competitive debater. losing an argument improves his mood.',
  statedPreferences: ['someone interesting', 'likes doing stuff', 'low pressure'],
  revealedHypotheses: [
    'is most himself in direct conversation — activities read to him as avoidance',
    'over-plans anything unstructured and arrives already tired',
    'the "low pressure" he asked for is not the low pressure he responds to',
  ],
  conversationStyle: ['formal then loose', 'likes being challenged', 'long-form'],
  socialEnergy: ['even', 'daylight-stable', 'unbothered by silence'],
  availability: [
    { day: 3, startMin: 14 * 60, endMin: 19 * 60, energy: 0.8 },
    { day: 5, startMin: 13 * 60, endMin: 18 * 60, energy: 0.82 },
    { day: 0, startMin: 12 * 60, endMin: 20 * 60, energy: 0.75 },
  ],
  portraitSeed: 30902,
  portraitTint: ['#FFD84D', '#2B44FF'],
};
