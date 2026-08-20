import type { Question, Trait } from '@/lib/profile';

/**
 * SYNTHETIC. One invented person's profile, mid-construction.
 *
 * These beliefs are not about anybody. They exist to demonstrate the shape of
 * an honest profile: a small number of specific claims, each with a confidence
 * and a source, sitting next to an explicit list of what is still unknown.
 *
 * The traits are written as behavioural claims rather than as interests,
 * because "likes live music" cannot produce a decision and "goes quiet in any
 * room where she already knows four people" can. That is the same argument the
 * scenes make, applied one level down.
 *
 * Every trait starts unsupported. Nothing here is seeded with a flattering
 * pre-read, so the profile you see after three questions is genuinely what
 * three questions buys — which is the point being made.
 */
export const STARTING_TRAITS: Trait[] = [
  {
    id: 'external-object',
    label: 'warms up once there is something outside the two of you to react to',
    confidence: 0.12,
    provenance: 'stated',
    since: null,
  },
  {
    id: 'interview-read',
    label: 'hears a direct question as an interview and answers it formally',
    confidence: 0.1,
    provenance: 'stated',
    since: null,
  },
  {
    id: 'moving',
    label: 'is better company walking than sitting across a table',
    confidence: 0.08,
    provenance: 'stated',
    since: null,
  },
  {
    id: 'crowd-fade',
    label: 'goes quiet in any room where four people already know her',
    confidence: 0.1,
    provenance: 'stated',
    since: null,
  },
  {
    id: 'audience',
    label: 'wants to be watched while she is meeting someone',
    confidence: 0.06,
    provenance: 'stated',
    since: null,
  },
  {
    id: 'ninety',
    label: 'runs out at ninety minutes regardless of how well it is going',
    confidence: 0.05,
    provenance: 'stated',
    since: null,
  },
];

/**
 * Three questions, and the third one is deliberately worthless.
 *
 * The favourite-colour question is not filler. Every onboarding flow is full of
 * questions like it, and no product ever admits which of its own questions did
 * nothing — the twenty-question flow is presented as though all twenty
 * mattered. Having one that provably moves no belief, and having the system say
 * so and drop it, is the strongest available argument for asking three.
 */
export const QUESTIONS: Question[] = [
  {
    id: 'worse',
    prompt: 'which of these sounds worse?',
    note: 'two of those were not about the question you were answering.',
    answers: [
      {
        id: 'dinner',
        label: 'a long dinner, one table, just the two of you',
        effects: [
          { trait: 'external-object', strength: 0.62, provenance: 'inferred' },
          { trait: 'interview-read', strength: 0.5, provenance: 'inferred' },
          { trait: 'moving', strength: 0.34, provenance: 'inferred' },
          { trait: 'audience', strength: 0.12, provenance: 'inferred' },
        ],
      },
      {
        id: 'party',
        label: 'a party where you know three people',
        effects: [
          { trait: 'crowd-fade', strength: 0.58, provenance: 'inferred' },
          { trait: 'audience', strength: 0.3, provenance: 'inferred' },
          { trait: 'external-object', strength: 0.2, provenance: 'inferred' },
        ],
      },
    ],
  },
  {
    id: 'early',
    prompt: 'you arrive twenty minutes early. what actually happens?',
    note: 'one strong read, and it contradicts what most people say about themselves.',
    answers: [
      {
        id: 'outside',
        label: 'wait outside. look busy on your phone.',
        effects: [
          { trait: 'interview-read', strength: 0.44, provenance: 'inferred' },
          { trait: 'audience', strength: 0.18, provenance: 'inferred' },
          { trait: 'ninety', strength: 0.26, provenance: 'inferred' },
        ],
      },
      {
        id: 'inside',
        label: 'go in. talk to whoever is behind the counter.',
        effects: [
          { trait: 'audience', strength: 0.56, provenance: 'inferred' },
          { trait: 'crowd-fade', strength: 0.22, provenance: 'inferred' },
        ],
      },
    ],
  },
  {
    id: 'colour',
    prompt: 'favourite colour?',
    note: 'that changed nothing. we are not going to ask it again.',
    answers: [
      { id: 'green', label: 'green', effects: [] },
      { id: 'blue', label: 'blue', effects: [] },
    ],
  },
];

/** Shown against each answered question, so the cost of asking is visible. */
export const WHEN = ['just now', 'a minute ago', 'a minute ago'];
