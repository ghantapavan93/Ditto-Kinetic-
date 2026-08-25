/**
 * SYNTHETIC. Two seekers, nine invented candidates, and one reconstructed
 * onboarding flow.
 *
 * The flow steps mirror what the live join flow was observed asking on
 * 2026-08-19 (27 screenshots, `reference/` — see RESEARCH.md). Wording is
 * kept close because the reconstruction is the point; every step is
 * labelled OBSERVED in the interface. Steps marked `proposed` are this
 * concept's additions and are labelled PROPOSED wherever they render.
 * Identity and orientation gating (the flow's first two questions) happens
 * before this candidate pool exists and is deliberately not dramatised —
 * everyone here is already mutually eligible on that axis.
 *
 * The candidates are written to differ in shape, not in quality: one is
 * one-sided, one is free next week but not this one, one lives inside a
 * travel window, one fails a hard boundary, two argue about what distance
 * means. No candidate is a clone of another; that would make the ranking
 * a beauty contest, which is the thing the engine exists to refuse.
 */

import type { AwayWindow, Belief, PersonModel } from '@/lib/personModel';

/* ----------------------------------------------------------------------- */
/* The observed flow, as data                                              */
/* ----------------------------------------------------------------------- */

export type FlowStep = {
  id: string;
  /** OBSERVED = seen in the live flow. PROPOSED = this concept's addition. */
  kind: 'observed' | 'proposed';
  prompt: string;
  /** The bolded word, matching the live flow's chat voice. */
  bold?: string;
  control: 'pills' | 'multi' | 'text' | 'range' | 'ruler' | 'map' | 'photos' | 'faces';
  options?: string[];
  /** The live flow's lock caption, where it showed one. */
  privacy?: string;
  note?: string;
  /** Steps the replay lets the reviewer actually answer. */
  interactive?: boolean;
};

export const FLOW_STEPS: FlowStep[] = [
  { id: 'gender', kind: 'observed', prompt: "what's your", bold: 'gender', control: 'pills', options: ['Man', 'Woman', 'Nonbinary'], interactive: true },
  { id: 'seeking', kind: 'observed', prompt: 'who are you looking to', bold: 'date', control: 'pills', options: ['Men', 'Women', 'Nonbinary', 'Everyone'], interactive: true },
  { id: 'birthday', kind: 'observed', prompt: "when's your", bold: 'birthday', control: 'text', note: 'Only your age is shown to others.' },
  { id: 'number', kind: 'observed', prompt: "what's ur", bold: 'number', control: 'text', note: "we'll text you when your match lands — never shown on your profile" },
  { id: 'hobbies', kind: 'observed', prompt: 'what are your', bold: 'hobbies & interests', control: 'multi', options: ['Cooking', 'Music', 'Travel', 'Reading', 'Gym', 'Gaming', 'Movies/TV', 'Art'] },
  { id: 'travel-style', kind: 'observed', prompt: "what's your", bold: 'travel style', control: 'multi', options: ['Backpacking', 'Adventure', 'City-hopping', 'Road trips', 'Foodie tours'] },
  { id: 'going-next', kind: 'observed', prompt: 'where u', bold: 'going next', control: 'text', interactive: true },
  { id: 'training', kind: 'observed', prompt: "what's your", bold: 'training style', control: 'multi', options: ['Lifting', 'Running', 'Climbing', 'Yoga', 'Dance'] },
  { id: 'content', kind: 'observed', prompt: 'what kinda', bold: 'content', control: 'multi', options: ['Indie', 'A24 stuff', 'Documentary', 'Sci-fi', 'Rom-com'] },
  { id: 'ethnicity', kind: 'observed', prompt: "what's your", bold: 'ethnicity', control: 'pills', privacy: 'Private. Only used to match you' },
  { id: 'ethnicity-pref', kind: 'observed', prompt: 'any', bold: 'ethnicity preferences', control: 'pills', options: ['No Preference'], privacy: 'Private. Only used to match you' },
  { id: 'age-range', kind: 'observed', prompt: "what's your preferred", bold: 'age range', control: 'range', privacy: 'Private. Only used to match you' },
  { id: 'height', kind: 'observed', prompt: 'how', bold: 'tall', control: 'ruler' },
  { id: 'radius', kind: 'observed', prompt: 'where do you want to', bold: 'date', control: 'map', note: '30 mins max transit' },
  { id: 'photos', kind: 'observed', prompt: "let's add at least", bold: '2 photos', control: 'photos', note: 'Include a clear close-up and a full-body shot' },
  { id: 'type', kind: 'observed', prompt: "which one's most your", bold: 'type', control: 'faces', note: 'Pick whoever catches your eye — it helps us learn your type.' },
  { id: 'looking-for', kind: 'observed', prompt: 'what are you', bold: 'looking for', control: 'pills', options: ['Life partner', 'Serious relationship', 'Casual dates', 'New friends', 'Not sure yet'], privacy: 'Private. Only used to match you', interactive: true },
  { id: 'pace', kind: 'observed', prompt: 'how do u want ditto to', bold: 'match u', control: 'pills', options: ['More dates, faster', 'A steady mix', 'Fewer, better matches', 'Wait for the one'], privacy: 'Private. Only used to match you' },
  { id: 'year', kind: 'observed', prompt: 'what', bold: 'year', control: 'pills', options: ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Master', 'PhD'] },
  { id: 'politics', kind: 'observed', prompt: "what's your", bold: 'political vibe', control: 'pills', privacy: 'Private. Only used to match you' },
  {
    id: 'politics-importance', kind: 'observed', prompt: 'does your match have to share your', bold: 'politics',
    control: 'pills', options: ["doesn't matter", 'kinda matters', 'super important'],
    privacy: 'Private. Only used to match you', interactive: true,
    note: 'the flow already asks how much an answer matters — that is a firmness question, and the compiler honours it',
  },
  { id: 'religion', kind: 'observed', prompt: "what's your", bold: 'religion', control: 'pills', privacy: 'Private. Only used to match you' },
  { id: 'one-thing', kind: 'observed', prompt: 'first thing your match should', bold: 'know', control: 'text', note: 'your match will see this', interactive: true },
  {
    id: 'this-week', kind: 'proposed', prompt: 'and just for this week —', bold: "how are you actually doing", control: 'pills',
    options: ['social', 'low-key', 'buried', 'spontaneous'], interactive: true,
    note: 'capacity, not personality. expires sunday, by construction.',
  },
];

/* ----------------------------------------------------------------------- */
/* The two seekers                                                         */
/* ----------------------------------------------------------------------- */

const maya = (key: string, rest: Omit<Belief, 'key' | 'status'>): Belief => ({ key, status: 'live', ...rest });

/**
 * Maya's compiled model. The beliefs mirror her observed-flow answers:
 * the smoking line arrived unhedged so it compiled hard; "usually more
 * outgoing than me" is hedged so it compiled soft — which is exactly the
 * signal the hear-me-out moment later argues with. Religion and politics
 * are private: they gate, they never explain.
 */
export const MAYA_MODEL: PersonModel = {
  id: 'maya',
  name: 'Maya',
  campus: 'Westbrook',
  intent: 'serious',
  pace: 'fewer-better',
  similarityBias: 0,
  thisWeek: { mode: 'buried', week: 1 },
  awayWindows: [{ city: 'New York', fromWeek: 2, toWeek: 3, optedIn: true }],
  oneThing: {
    said: "I'm quiet for the first ten minutes.",
    readAs: 'slow to open — wants a first scene that does not punish a soft start',
    confirmed: true,
  },
  beliefs: [
    maya('smoking', { label: 'smoking', value: "doesn't date smokers", firmness: 'hard', source: 'explicit', confidence: 0.9, isPrivate: false, saidAs: "I don't date smokers" }),
    maya('energy', { label: 'social energy', value: 'usually goes for very outgoing people', firmness: 'soft', source: 'explicit', confidence: 0.9, isPrivate: false, saidAs: 'usually more outgoing than me' }),
    maya('height', { label: 'height', value: 'usually dates taller', firmness: 'soft', source: 'explicit', confidence: 0.9, isPrivate: false, saidAs: 'usually taller than me' }),
    maya('distance', { label: 'distance', value: 'thirty transit minutes, softly', firmness: 'soft', source: 'explicit', confidence: 0.9, isPrivate: false, saidAs: '30 mins max transit' }),
    maya('politics', { label: 'politics', value: 'left-leaning · kinda matters', firmness: 'soft', source: 'explicit', confidence: 0.9, isPrivate: true, saidAs: 'kinda matters' }),
    maya('religion', { label: 'religion', value: 'agnostic · open', firmness: 'open', source: 'explicit', confidence: 0.9, isPrivate: true }),
    maya('ethnicity-pref', { label: 'ethnicity preference', value: 'no preference', firmness: 'open', source: 'explicit', confidence: 0.9, isPrivate: true }),
    maya('pace-read', { label: 'pace', value: 'fewer, better', firmness: 'open', source: 'explicit', confidence: 0.9, isPrivate: false }),
    maya('novelty', { label: 'sameness vs surprise', value: 'unasked', firmness: 'unknown', source: 'inferred', confidence: 0.3, isPrivate: false }),
    maya('conflict-style', { label: 'conflict style', value: 'unasked', firmness: 'unknown', source: 'inferred', confidence: 0.2, isPrivate: false }),
  ],
};

/**
 * Priya's model — the second-person proof. Different answers, different
 * unknowns, so the engine's one question for her is a different question,
 * and her Wednesday lands on a different person. Same machinery.
 */
export const PRIYA_MODEL: PersonModel = {
  id: 'priya',
  name: 'Priya',
  campus: 'Westbrook',
  intent: 'serious',
  pace: 'steady',
  similarityBias: 0,
  thisWeek: { mode: 'low-key', week: 1 },
  awayWindows: [],
  oneThing: {
    said: 'I skip the preamble.',
    readAs: 'direct opener — small talk reads as stalling to her',
    confirmed: true,
  },
  beliefs: [
    maya('smoking', { label: 'smoking', value: 'no stated boundary', firmness: 'open', source: 'explicit', confidence: 0.9, isPrivate: false }),
    maya('energy', { label: 'social energy', value: 'best in daylight, flat after a shift', firmness: 'soft', source: 'explicit', confidence: 0.9, isPrivate: false }),
    maya('distance', { label: 'distance', value: 'twenty transit minutes, firmly', firmness: 'soft', source: 'explicit', confidence: 0.9, isPrivate: false }),
    maya('politics', { label: 'politics', value: 'private · super important', firmness: 'hard', source: 'explicit', confidence: 0.9, isPrivate: true, saidAs: 'super important' }),
    maya('schedule-read', { label: 'evenings', value: 'weeknights end early', firmness: 'soft', source: 'observed', confidence: 0.55, isPrivate: false }),
    maya('novelty', { label: 'sameness vs surprise', value: 'unasked', firmness: 'unknown', source: 'inferred', confidence: 0.3, isPrivate: false }),
  ],
};

/* ----------------------------------------------------------------------- */
/* The candidate universe                                                  */
/* ----------------------------------------------------------------------- */

export type CandidateProfile = {
  id: string;
  name: string;
  year: string;
  /** An existing print from public/photos — lived life, never a headshot. */
  photo: string;
  /** One line in their own voice. */
  line: string;
  /** Genuinely shared ground with the seeker. */
  anchors: string[];
  /** Differences that pull somewhere new. */
  complements: string[];
  /** 0..1 — how outgoing their week actually runs. */
  energy: number;
  intent: PersonModel['intent'];
  /** Their side of it: how much this seeker matches THEIR stated asks, 0..1. */
  interestBack: number;
  /** Real friction, not miles. */
  travel: { miles: number; minutes: number; transfers: number };
  /** Prototype weeks with a genuine shared slot. */
  freeWeeks: number[];
  base: 'campus' | 'away-city';
  awayCity?: string;
  smokes: boolean;
  /**
   * Whether this candidate clears the seeker's private politics boundary.
   * A plain boolean on purpose: the VALUE of anyone's politics never enters
   * the engine's outputs, only whether a hard, private gate passes — which
   * is exactly the shape the redaction eval verifies.
   */
  sharesPolitics: boolean;
  /** Which existing FIRST SCENE pair this candidate opens, if selected. */
  bridgesTo?: string;
};

export const CANDIDATES: CandidateProfile[] = [
  {
    id: 'jonah', name: 'Jonah', year: 'senior', photo: '/photos/print-selfie-02.webp',
    line: 'will absolutely lose a debate on purpose to keep it going',
    anchors: ['long walks that outlast the plan', 'documentary rabbit holes'],
    complements: ['peaks late evening where she fades', 'needs a side activity — she needs a warm-up object'],
    energy: 0.45, intent: 'serious', interestBack: 0.82,
    travel: { miles: 3, minutes: 17, transfers: 0 }, freeWeeks: [1, 2],
    base: 'campus', smokes: false, sharesPolitics: true, bridgesTo: 'maya-jonah',
  },
  {
    id: 'kai', name: 'Kai', year: 'junior', photo: '/photos/print-selfie-03.webp',
    line: 'same playlists, same seminar, same order at the same cart',
    anchors: ['identical media diet', 'same major track', 'same gym hours'],
    complements: [],
    energy: 0.55, intent: 'serious', interestBack: 0.74,
    travel: { miles: 1, minutes: 9, transfers: 0 }, freeWeeks: [1, 2],
    base: 'campus', smokes: false, sharesPolitics: true,
  },
  {
    id: 'dean', name: 'Dean', year: 'senior', photo: '/photos/print-selfie-01.webp',
    line: 'reads as perfect on paper, which is the tell',
    anchors: ['film houses', 'trail runs', 'cooking projects'],
    complements: ['organises group nights she would love'],
    energy: 0.7, intent: 'serious', interestBack: 0.2,
    travel: { miles: 4, minutes: 15, transfers: 0 }, freeWeeks: [1, 4],
    base: 'campus', smokes: false, sharesPolitics: true,
  },
  {
    id: 'leah', name: 'Leah', year: 'master', photo: '/photos/print-laughing-blur.webp',
    line: 'laughs first, apologises to nobody',
    anchors: ['bookstore drift'],
    complements: ['drags people somewhere new weekly', 'loud where she is quiet, warmly'],
    energy: 0.8, intent: 'serious', interestBack: 0.78,
    travel: { miles: 6, minutes: 22, transfers: 1 }, freeWeeks: [2, 3],
    base: 'campus', smokes: false, sharesPolitics: true,
  },
  {
    id: 'marcus', name: 'Marcus', year: 'phd', photo: '/photos/print-hands-cups.webp',
    line: 'good talk, better silences, smoke breaks between both',
    anchors: ['archive documentaries', 'long walks'],
    complements: ['teaches without lecturing'],
    energy: 0.5, intent: 'serious', interestBack: 0.8,
    travel: { miles: 2, minutes: 12, transfers: 0 }, freeWeeks: [1, 2, 4],
    base: 'campus', smokes: true, sharesPolitics: false,
  },
  {
    id: 'rosa', name: 'Rosa', year: 'senior', photo: '/photos/bookstore-reading.webp',
    line: 'twelve miles out and worth eleven of them',
    anchors: ['annotates margins', 'gallery slow-walker'],
    complements: ['small-town patience in a campus that has none'],
    energy: 0.4, intent: 'serious', interestBack: 0.76,
    travel: { miles: 12, minutes: 45, transfers: 2 }, freeWeeks: [1, 3],
    base: 'campus', smokes: false, sharesPolitics: true,
  },
  {
    id: 'inez', name: 'Inez', year: 'senior abroad', photo: '/photos/neon-tacos.webp',
    line: 'in new york until the ninth, then gone',
    anchors: ['street food maps', 'photographs strangers kindly'],
    complements: ['city pace against her campus pace'],
    energy: 0.6, intent: 'serious', interestBack: 0.8,
    travel: { miles: 0, minutes: 14, transfers: 0 }, freeWeeks: [2, 3],
    base: 'away-city', awayCity: 'New York', smokes: false, sharesPolitics: true,
  },
  {
    id: 'theo', name: 'Theo', year: 'senior', photo: '/photos/print-selfie-04.webp',
    line: 'unbothered by silence, undefeated at daylight plans',
    anchors: ['morning museum trips', 'ends evenings early too'],
    complements: ['formal then loose — she skips the preamble'],
    energy: 0.35, intent: 'serious', interestBack: 0.84,
    travel: { miles: 2, minutes: 11, transfers: 0 }, freeWeeks: [1, 2],
    base: 'campus', smokes: false, sharesPolitics: true, bridgesTo: 'priya-theo',
  },
  {
    id: 'imani', name: 'Imani', year: 'master', photo: '/photos/study-picnic.webp',
    line: 'runs a reading picnic like a small benevolent government',
    anchors: ['daylight plans', 'campus lawns'],
    complements: ['gathers groups where priya goes solo', 'plans the follow-up before the first ends'],
    energy: 0.65, intent: 'serious', interestBack: 0.78,
    travel: { miles: 5, minutes: 19, transfers: 1 }, freeWeeks: [1, 3],
    base: 'campus', smokes: false, sharesPolitics: true,
  },
];

/** Which candidates each seeker's run draws from. */
export const POOLS: Record<string, string[]> = {
  maya: ['jonah', 'kai', 'dean', 'leah', 'marcus', 'rosa', 'inez'],
  priya: ['theo', 'imani', 'dean', 'marcus', 'rosa'],
};

/** The away window that "where u going next — New York" becomes. */
export const NYC_WINDOW: AwayWindow = { city: 'New York', fromWeek: 2, toWeek: 3, optedIn: true };

/* ----------------------------------------------------------------------- */
/* The spoken lines                                                        */
/* ----------------------------------------------------------------------- */

/**
 * Every sentence the surface says, in one place — the acts read like one
 * story because they are written as one. Components interpolate these.
 */
export const MM_COPY = {
  cold: {
    eyebrow: 'the matchmaker · who should meet?',
    label: 'observed flow · concept reconstruction',
    open1: 'you already told the system your type.',
    open2: 'what should it ask next?',
    replay: 'replay the flow',
    skip: 'skip to what it heard',
    disclosure: 'a speculative layer for Ditto — reconstructed from the public join flow, everything synthetic',
  },
  phone: {
    header: 'back to school date',
    sender: 'Ditto',
    finding: 'finding your match…',
    accelNote: 'the rest of the observed flow, at speed —',
  },
  payoff: {
    a: 'you gave the matchmaker a lot of answers.',
    b: 'but answers aren’t the same as understanding.',
    c: 'what did it actually hear?',
  },
  heard: {
    eyebrow: 'act two · what I heard',
    compiler: 'what you said → what I think it means',
    correct: 'wrong? tap a card — your correction outranks the compiler.',
    unknownEyebrow: 'act three · what I don’t know',
    unknownLine: 'more answers don’t always mean more understanding.',
  },
  question: {
    eyebrow: 'act four · one question',
    setup: 'two of these Wednesdays are close enough that one thing could still change it.',
    measured: 'measured, not vibes: an answer to this question changes who Wednesday belongs to. the inert questions got refused.',
    done: 'that’s all I needed.',
  },
  who: {
    eyebrow: 'act five · who',
    mutualLine: 'one score can hide two completely different dates.',
    sliderNote: 'an explanatory instrument, not the production control — drag it and watch the field argue.',
    clone: 'clone me',
    surprise: 'surprise me',
    frictionLine: 'distance isn’t miles. it’s friction.',
    windowLine: 'travel opens a second, expiring universe — never a new home.',
  },
  whyNot: {
    eyebrow: 'act six · why / why not',
    heldBack: 'held back',
    selected: 'selected',
    change: 'what would change this?',
    hearMeOut: 'hear me out',
    hearBody: 'you said you usually go for very outgoing people. I know. this one breaks the stated pattern — the dates you rated best didn’t match it either. I kept them in.',
    trust: 'trust you',
    notNow: 'not this time',
    never: 'never use that signal',
  },
  wednesday: {
    eyebrow: 'act eight · wednesday',
    abstainA: 'not this wednesday.',
    abstainB: 'I found people. I didn’t find one worth spending your Wednesday on.',
    thin: 'run a thinner week',
    normal: 'back to this week',
  },
  bridge: {
    found: 'found someone.',
    then: 'one more question:',
    ask: 'what should their first hour feel like?',
    cta: 'open first scene →',
    second: 'run it for priya instead',
    carried: 'her buried week travels with her — the stage opens with capacity, not just chemistry, already known.',
  },
  xray: {
    open: 'x-ray',
    close: 'close x-ray',
    hint: 'press D',
    run: 'the run',
    trace: 'trace',
    replay: 'replay',
    evals: 'evals',
    policy: 'confidence × consequence × reversibility',
    replayNote: 'change one signal, run again, diff the Wednesday.',
  },
  after: {
    eyebrow: 'act eleven · after',
    line: 'outcomes update hypotheses. only you update your record.',
    momentum: 'and when it works, the system’s last feature is leaving:',
  },
  thread: {
    before: 'before the room, there was a decision.',
  },
  scenarios: {
    'free-thursday': 'the boundary moved — and the next one showed itself. one thing at a time, honestly.',
    'nyc-window': 'a second universe, active. it closes on its own when the window does.',
    'ease-the-week': 'capacity came back — the far room is reachable again.',
  },
  hearNotes: {
    trust: 'kept in. the stated pattern stays on file; tonight argues with it.',
    'not-now': 'held out this time. the signal stands; the candidate keeps their place in the pool.',
    never: 'retired. the reasoning is gone for good — the person was never the problem.',
  },
} as const;

/* ----------------------------------------------------------------------- */
/* The askable questions                                                   */
/* ----------------------------------------------------------------------- */

export type AskableQuestion = {
  key: string;
  prompt: string;
  options: { label: string; effect: { kind: 'bias' | 'energy-target' | 'none'; value: number } }[];
};

/**
 * Each seeker's candidate questions. The engine measures every one and asks
 * only the question whose answers produce more than one possible winner —
 * the others are answers the system already has, whatever they feel like.
 * One deliberately inert question sits in each list so the measurement has
 * something honest to reject.
 */
export const ASKABLE: Record<string, AskableQuestion[]> = {
  maya: [
    {
      key: 'novelty',
      prompt: 'would you rather meet someone who already lives a lot like you — or someone who pulls you somewhere new?',
      options: [
        { label: 'mostly like me', effect: { kind: 'bias', value: -1 } },
        { label: 'somewhere in between', effect: { kind: 'bias', value: 0 } },
        { label: 'surprise me', effect: { kind: 'bias', value: 0.8 } },
      ],
    },
    {
      key: 'training',
      prompt: 'does it matter whether they train the way you train?',
      options: [
        { label: 'yes', effect: { kind: 'none', value: 0 } },
        { label: 'no', effect: { kind: 'none', value: 0 } },
        { label: 'never thought about it', effect: { kind: 'none', value: 0 } },
      ],
    },
  ],
  priya: [
    {
      key: 'evenings',
      prompt: 'after a long shift, is a plan with someone new a rescue — or a tax?',
      options: [
        { label: 'a rescue, honestly', effect: { kind: 'energy-target', value: 0.65 } },
        { label: 'depends on the person', effect: { kind: 'energy-target', value: 0.5 } },
        { label: 'a tax. a worthwhile one, sometimes', effect: { kind: 'bias', value: -0.5 } },
      ],
    },
    {
      key: 'training',
      prompt: 'does it matter whether they train the way you train?',
      options: [
        { label: 'yes', effect: { kind: 'none', value: 0 } },
        { label: 'no', effect: { kind: 'none', value: 0 } },
        { label: 'never thought about it', effect: { kind: 'none', value: 0 } },
      ],
    },
  ],
};
