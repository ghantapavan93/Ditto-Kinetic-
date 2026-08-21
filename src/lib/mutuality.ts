import { WEIGHTS, metricsFor, scoreScene, type WeightKey } from '@/lib/rankScenes';
import type { MatchPair, Person, Scene, SceneEvaluation } from '@/lib/types';

/**
 * Mutuality, which is not compatibility.
 *
 * This is a correction to something the rest of the engine got wrong, quietly,
 * from the first commit. `rankScenes` scores a scene with one weight vector and
 * calls the result the pair's utility. But nine of its ten weighted dimensions are
 * things two people experience *separately* — how much pressure a room carries,
 * how far it is, whether the first fifteen minutes will go well, whether they
 * will actually show up. A single score for those is an average, and an average
 * of 0.9 and 0.2 looks exactly like an average of 0.55 and 0.55.
 *
 * Those two situations are not the same situation. One is two people who both
 * half-want an evening. The other is one person who badly wants it and one who
 * does not — which is not a date, it is an obligation with a start time.
 *
 * So the fix is not another dimension. It is the same ten weighted terms, scored
 * twice, with weights belonging to each person:
 *
 *     mutual = min(hers, his)
 *
 * An introduction is only as good as the person who wants it less. That is the
 * invariant this file exists to hold, and `npm run check` asserts it cannot be
 * violated by any scene, any pair, any weighting.
 *
 * `min` rather than a mean is the entire argument. A mean lets one person's
 * enthusiasm pay for the other's reluctance, and nobody has ever had a good
 * evening on borrowed enthusiasm.
 *
 * On where the weights come from: they are read off each person's own trait
 * strings — the `socialEnergy` and `conversationStyle` lines that were already
 * in the data being used as display copy. Nothing is invented for this file.
 * Every disposition below names the exact phrase it derives from, and claim 31
 * checks that phrase still exists in that person's record. A personal weight
 * that cannot be traced to something the person told us is just a number with a
 * name on it.
 */

/**
 * A reading taken from one phrase in a person's own record.
 *
 * `shifts` may only re-weight dimensions that already exist — the same rule
 * `Learned` follows. A disposition can change how much something counts for
 * someone. It can never add a dimension, remove one, or touch the scene.
 */
export type Disposition = {
  key: string;
  /** The exact phrase in the person's own data this is read from. Asserted. */
  phrase: string;
  /** Which field the phrase lives in. */
  field: 'socialEnergy' | 'conversationStyle';
  shifts: Partial<Record<WeightKey, number>>;
  /** What it means, in the site's register. */
  because: string;
};

/**
 * The dispositions this project can read.
 *
 * Deliberately few. Each one is a claim that a specific phrase implies a
 * specific re-weighting, and every one of those claims is arguable — which is
 * why they are listed here in the open rather than folded into a scoring
 * function where nobody could see them.
 */
export const DISPOSITIONS: Disposition[] = [
  /* --- crowds: the sharpest disagreement two people can have about a room --- */
  {
    key: 'shuts-down-in-a-crowd',
    phrase: 'shuts down in a crowd',
    field: 'socialEnergy',
    shifts: { socialPressure: -0.16 },
    because: 'crowd pressure is not a minor term for them, it is the whole evening',
  },
  {
    key: 'unfazed-by-crowds',
    phrase: 'unfazed by crowds',
    field: 'socialEnergy',
    shifts: { socialPressure: 0.07 },
    because: 'a full room costs them nothing, so it should not be priced as if it does',
  },
  {
    key: 'very-high-in-company',
    phrase: 'very high in company',
    field: 'socialEnergy',
    shifts: { socialPressure: 0.08, noveltyValue: 0.04 },
    because: 'other people are the fuel, not the tax',
  },
  {
    key: 'steady-one-to-one',
    phrase: 'steady one-to-one',
    field: 'socialEnergy',
    shifts: { socialPressure: -0.09, pairSignal: 0.06 },
    because: 'two people is their format; a group is a different, worse night',
  },

  /* --- whether the room has to do some of the talking --- */
  {
    key: 'needs-a-warm-up-object',
    phrase: 'needs a warm-up object',
    field: 'socialEnergy',
    shifts: { contextFit: 0.1, firstFifteenMinutesForecast: 0.06 },
    because: 'a room that hands them something to react to is doing half the work',
  },
  {
    key: 'needs-an-object',
    phrase: 'needs an object',
    field: 'socialEnergy',
    shifts: { contextFit: 0.09, firstFifteenMinutesForecast: 0.05 },
    because: 'give them something to point at and the evening starts on its own',
  },
  {
    key: 'needs-a-side-activity',
    phrase: 'needs a side activity',
    field: 'socialEnergy',
    shifts: { contextFit: 0.1, socialPressure: -0.05 },
    because: 'facing a task together beats facing each other',
  },
  {
    key: 'better-with-a-prompt',
    phrase: 'better with a prompt',
    field: 'conversationStyle',
    shifts: { contextFit: 0.08, firstFifteenMinutesForecast: 0.05 },
    because: 'they are good once asked, and worse when nothing asks',
  },
  {
    key: 'unbothered-by-silence',
    phrase: 'unbothered by silence',
    field: 'socialEnergy',
    shifts: { contextFit: -0.06, firstFifteenMinutesForecast: -0.05 },
    because: 'a gap in the conversation is not an emergency, so the room matters less',
  },

  /* --- how long the evening can be before it stops being one --- */
  {
    key: 'fades-after-90',
    phrase: 'fades after 90 minutes',
    field: 'socialEnergy',
    shifts: { socialPressure: -0.05, uncertainty: -0.04 },
    because: 'a long night costs them more than it costs most people',
  },
  {
    key: 'high-but-short',
    phrase: 'high but short',
    field: 'socialEnergy',
    shifts: { socialPressure: -0.06, noveltyValue: 0.04 },
    because: 'brilliant for an hour, and the hour is the whole budget',
  },
  {
    key: 'runs-out-abruptly',
    phrase: 'runs out abruptly',
    field: 'socialEnergy',
    shifts: { socialPressure: -0.07, scheduleFit: 0.05 },
    because: 'there is no gentle ending available, so the ending has to be built in',
  },
  {
    key: 'long-fuse',
    phrase: 'long fuse',
    field: 'socialEnergy',
    shifts: { firstFifteenMinutesForecast: -0.06, explorationValue: 0.05 },
    because: 'they do not need the opening to land, so it counts for less',
  },

  /* --- when they are actually any good --- */
  {
    key: 'peaks-late-evening',
    phrase: 'peaks late evening',
    field: 'socialEnergy',
    shifts: { scheduleFit: 0.09 },
    because: 'the hour is not a detail for them, it is most of the outcome',
  },
  {
    key: 'best-in-daylight',
    phrase: 'best in daylight',
    field: 'socialEnergy',
    shifts: { scheduleFit: 0.09 },
    because: 'put them out after dark and you are meeting a different person',
  },
  {
    key: 'best-mid-afternoon',
    phrase: 'best mid-afternoon',
    field: 'socialEnergy',
    shifts: { scheduleFit: 0.08 },
    because: 'a narrow window, and everything outside it is worse',
  },
  {
    key: 'flat-after-a-shift',
    phrase: 'flat after a shift',
    field: 'socialEnergy',
    shifts: { scheduleFit: 0.08, socialPressure: -0.05 },
    because: 'what happened before the date decides more than the date does',
  },

  /* --- moving, and the first fifteen minutes --- */
  {
    key: 'better-walking',
    phrase: 'better walking than sitting',
    field: 'socialEnergy',
    shifts: { travelFriction: 0.09, noveltyValue: 0.05 },
    because: 'the walk is not friction for them, it is the part that works',
  },
  {
    key: 'never-still',
    phrase: 'never still',
    field: 'conversationStyle',
    shifts: { travelFriction: 0.07, noveltyValue: 0.05 },
    because: 'sitting across a table is the hard version for them',
  },
  {
    key: 'slow-to-open',
    phrase: 'slow to open, then fast',
    field: 'conversationStyle',
    shifts: { firstFifteenMinutesForecast: 0.09, uncertainty: -0.03 },
    because: 'the first fifteen minutes decide more for them than for anyone',
  },
  {
    key: 'formal-then-loose',
    phrase: 'formal then loose',
    field: 'conversationStyle',
    shifts: { firstFifteenMinutesForecast: 0.08 },
    because: 'they have to get through the formal part, so the opening has to help',
  },
  {
    key: 'allergic-to-preamble',
    phrase: 'allergic to preamble',
    field: 'conversationStyle',
    shifts: { firstFifteenMinutesForecast: 0.07, contextFit: 0.05 },
    because: 'small talk is the failure mode, so the room has to skip it for them',
  },
  {
    key: 'skips-the-preamble',
    phrase: 'skips the preamble',
    field: 'conversationStyle',
    shifts: { firstFifteenMinutesForecast: 0.06, contextFit: 0.04 },
    because: 'they start in the middle, which works or lands badly, fast',
  },
  {
    key: 'warms-fast',
    phrase: 'warms fast',
    field: 'conversationStyle',
    shifts: { firstFifteenMinutesForecast: -0.05, explorationValue: 0.04 },
    because: 'the opening takes care of itself, so it is not where the risk is',
  },

  /*
   * --- cold start, which the data was already carrying ---
   *
   * "unread" and "untested alone" are not personality. They are the system
   * admitting it has not seen this person in this situation yet, and they were
   * sitting in the trait data being rendered as display copy. Read properly they
   * mean uncertainty should cost this person MORE, which is the difference
   * between a system that knows it is guessing and one that presents a guess as
   * a reading.
   */
  {
    key: 'unread',
    phrase: 'unread',
    field: 'socialEnergy',
    shifts: { uncertainty: -0.1, explorationValue: 0.06 },
    because: 'nobody has seen them in a room like this yet, so the guess costs more',
  },
  {
    key: 'untested-alone',
    phrase: 'untested alone',
    field: 'socialEnergy',
    shifts: { uncertainty: -0.09, pairSignal: -0.04 },
    because: 'every reading of them so far came with other people in the frame',
  },
];

/** Which dispositions this person actually holds, by their own words. */
export function dispositionsOf(person: Person): Disposition[] {
  return DISPOSITIONS.filter((d) => {
    const field = d.field === 'socialEnergy' ? person.socialEnergy : person.conversationStyle;
    return field.some((line) => line.includes(d.phrase));
  });
}

/**
 * One person's weights.
 *
 * Base weights, shifted by whatever they told us about themselves, then
 * renormalised so the positive terms still sum to what they summed to before.
 * Without that last step a person with three dispositions would simply score
 * everything higher than a person with none, and the comparison that this whole
 * file exists to make — hers against his — would be measuring the wrong thing.
 */
export function weightsOf(person: Person): Record<WeightKey, number> {
  const keys = Object.keys(WEIGHTS) as WeightKey[];
  const out = { ...WEIGHTS } as Record<WeightKey, number>;

  for (const d of dispositionsOf(person)) {
    for (const [key, shift] of Object.entries(d.shifts)) {
      out[key as WeightKey] += shift as number;
    }
  }

  const basePositive = keys.reduce((t, k) => t + Math.max(0, WEIGHTS[k]), 0);
  const newPositive = keys.reduce((t, k) => t + Math.max(0, out[k]), 0);
  if (newPositive > 0) {
    const scale = basePositive / newPositive;
    for (const k of keys) if (out[k] > 0) out[k] *= scale;
  }

  return out;
}

/** What one person makes of one scene, using their own weights. */
export function sideOf(person: Person, metrics: SceneEvaluation): number {
  const w = weightsOf(person);
  return (Object.keys(w) as WeightKey[]).reduce((total, key) => total + w[key] * metrics[key], 0);
}

export type Mutuality = {
  scene: Scene;
  /** personA's own reading. */
  a: number;
  /** personB's own reading. */
  b: number;
  /**
   * The one that decides. Never better than the reluctant person's reading,
   * because an evening cannot be better than that.
   */
  mutual: number;
  /**
   * What the model that ACTUALLY SHIPS says about this room.
   *
   * This used to be `(a + b) / 2` -- the mean of the two personalised readings
   * -- and comparing that against `min(a, b)` was comparing this file to
   * itself. It could only ever produce `mean >= min`, which is arithmetic, not
   * a finding, and it made the page report that mutuality changed nothing.
   *
   * The honest comparison is against `scoreScene`, the single-weight-vector
   * ranker running on `/` and `/thread`. A reviewer who owns matching caught
   * this; they were right, and the real answer is more interesting than the
   * one the mistake was hiding.
   */
  shipped: number;
  /** How far apart the two people are on this scene. */
  gap: number;
  /** Whose reading is lower — the person the evening actually depends on. */
  reluctant: 'a' | 'b' | 'neither';
  /**
   * True when one person wants this materially more than the other. Not a
   * failure of the pair. A fact about this room, for these two, this week.
   */
  oneSided: boolean;
};

/**
 * How far apart two readings may be before the evening stops being shared.
 *
 * A quarter of the scale. Below that the two are having roughly the same night;
 * above it, one of them is going along with something.
 */
export const RECIPROCITY_GAP = 0.25;

export function mutualityOf(pair: MatchPair, scene: Scene): Mutuality {
  /*
   * The same metrics the ranker uses.
   *
   * This read the raw data file, so `shipped` was not what ships -- the exact
   * mistake this field was created to stop making. The page compares the
   * shipping model against the reluctant reading; both sides have to be
   * computed the same way or the comparison is between two strangers.
   */
  const metrics = metricsFor(pair, scene);
  const a = sideOf(pair.personA, metrics);
  const b = sideOf(pair.personB, metrics);
  const gap = Math.abs(a - b);

  return {
    scene,
    a,
    b,
    mutual: Math.min(a, b),
    shipped: scoreScene(metrics),
    gap,
    reluctant: Math.abs(a - b) < 1e-9 ? 'neither' : a < b ? 'a' : 'b',
    oneSided: gap >= RECIPROCITY_GAP,
  };
}

/** Every scene for a pair, read from both sides, best mutual first. */
export function readMutuality(pair: MatchPair): Mutuality[] {
  return pair.scenes
    .map((scene) => mutualityOf(pair, scene))
    .sort((x, y) => y.mutual - x.mutual);
}

/**
 * Rooms the shipping model would send that the reluctant person refuses.
 *
 * This is the whole layer in one function, and it is not empty: GROUP LANDING
 * scores 0.494 for Maya and Jonah, clears the 0.48 bar, and would go out --
 * while Maya's own reading of the same room is 0.430. The single-vector model
 * cannot see that, because it never asked her separately.
 */
export function overruled(pair: MatchPair, threshold: number): Mutuality[] {
  return pair.scenes
    .map((scene) => mutualityOf(pair, scene))
    .filter((m) => m.shipped >= threshold && m.mutual < threshold);
}

/** By how much the shipping score overstates the reluctant person's reading. */
export function overstatement(m: Mutuality): number {
  return m.shipped - m.mutual;
}

/**
 * What a person told us, against what the model actually used.
 *
 * `statedPreferences` and `revealedHypotheses` are authored on all twelve
 * people in this project and, until this function existed, read by nothing —
 * the same defect `venueSafety` was: data that looks priced and is not.
 *
 * Surfacing them turns out to say something worth saying. The weights above are
 * derived from `socialEnergy` and `conversationStyle` — how somebody behaves in
 * a room. They are NOT derived from `statedPreferences` — what somebody asked
 * for. So the model re-weights on temperament and ignores the stated wish,
 * which is a real position and an arguable one, and much better said out loud
 * than left as an accident of which fields happened to get read.
 *
 * The gap between the two columns is the site's oldest idea in its smallest
 * form: what people say they want, and what the evenings suggest.
 */
export type Belief = {
  person: Person;
  /** In their words, from onboarding. High confidence it came from them. */
  told: string[];
  /** What the history suggests. A hypothesis, and labelled as one. */
  suspected: string[];
  /** The phrases that actually moved a weight. */
  used: string[];
};

export function beliefsFor(pair: MatchPair): Belief[] {
  return [pair.personA, pair.personB].map((person) => ({
    person,
    told: person.statedPreferences,
    suspected: person.revealedHypotheses,
    used: dispositionsOf(person).map((d) => d.phrase),
  }));
}
