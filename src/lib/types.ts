/**
 * Domain model for FIRST SCENE.
 *
 * The load-bearing idea lives in the shape of these types, not in the copy:
 * `SceneEvaluation` scores *a pair under conditions*, not a pair. `pairSignal`
 * is one field out of eleven, and it is constant across every scene for a given
 * pair. Everything else is context. That asymmetry is the product thesis,
 * expressed as a type.
 *
 * All values are synthetic prototype data. See RESEARCH.md.
 */

export type AvailabilitySlot = {
  /** 0 = Sunday, per Date#getDay. */
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Minutes from midnight, local campus time. */
  startMin: number;
  endMin: number;
  /** How much social energy they actually have in this slot, 0..1. */
  energy: number;
};

export type Person = {
  id: string;
  name: string;
  age: number;
  major: string;
  fictionalCampus: string;
  /** One line, in their own register. Shown on the polaroid back. */
  profileLine: string;
  /** What they told Ditto they want. */
  statedPreferences: string[];
  /**
   * What the synthetic history suggests. Deliberately in tension with
   * `statedPreferences` — that gap is the "hear me out" moment.
   */
  revealedHypotheses: string[];
  /** The surface read. What you would say about them after ten minutes. */
  surface: string;
  /** The turn. What is actually true, and cuts against the surface. */
  contradiction: string;
  /** One specific, useless, human fact. The thing that makes them a person. */
  tinyDetail: string;
  conversationStyle: string[];
  socialEnergy: string[];
  availability: AvailabilitySlot[];
  /** Drives the procedural portrait. Same seed always yields the same face. */
  portraitSeed: number;
  /** Hex tints for the procedural portrait's light leak + colour cast. */
  portraitTint: [string, string];
};

/**
 * Eleven dimensions. Ten are context. One (`pairSignal`) is the pair.
 * All normalised 0..1. Higher is more of the named thing — which means
 * `travelFriction`, `socialPressure` and `uncertainty` are costs, not virtues.
 */
export type SceneEvaluation = {
  /** How well this setting suits these two specifically. */
  pairSignal: number;
  contextFit: number;
  /** Forecast quality of the opening fifteen minutes — the hardest part. */
  firstFifteenMinutesForecast: number;
  scheduleFit: number;
  travelFriction: number;
  venueSafety: number;
  attendanceLikelihood: number;
  socialPressure: number;
  noveltyValue: number;
  explorationValue: number;
  /** How much the system does *not* know. Penalised, never hidden. */
  uncertainty: number;
  rationale: string[];
};

export type SceneMood = 'rigid' | 'shared' | 'curious' | 'inevitable' | 'busy' | 'depleted';

/** Artifacts are not decoration — each one encodes a specific field. */
export type ArtifactKind =
  | 'cup'
  | 'receipt'
  | 'ticket'
  | 'marker'
  | 'challenge-card'
  | 'gallery-label'
  | 'poster'
  | 'route'
  | 'timestamp'
  | 'name-tag'
  | 'notebook'
  | 'coffee-sleeve';

export type SceneArtifact = {
  kind: ArtifactKind;
  /** Normalised stage position, -1..1 on x/y. z is depth in metres. */
  at: [number, number, number];
  rotate: number;
  label?: string;
};

export type Scene = {
  id: string;
  label: string;
  time: string;
  location: string;
  premise: string;
  mood: SceneMood;
  /** The verdict line. Short, observant, never a score. */
  verdict: string;
  /** Optional second beat under the verdict. */
  verdictSub?: string;
  /** Longhand annotation, in Ditto's voice. */
  annotation: string;
  artifacts: SceneArtifact[];
  /** The three evidence notes shown in "why this one?". */
  rationale: string[];
  /** The fourth, translucent note. Always present. Never resolved. */
  uncertainty: string;
  metrics: SceneEvaluation;
  /** A shared external object, where the scene has one. */
  thirdThing?: string;
};

/**
 * A reason these two might work, as a physical object.
 *
 * Fragments belong to the *pair*, not the scene — "both ambitious, maybe too
 * ambitious" is true of Maya and Jonah in every room. What the room decides is
 * whether it ever surfaces. So the fragments are constant and their visibility
 * is a function of magnetism, which is the thesis stated one more way.
 */
export type FragmentKind =
  /** Pulls toward both people. The reasons they work. */
  | 'shared'
  /** Pulled toward one person only. Asymmetric, and it leans. */
  | 'lopsided'
  /** Real, and unresolved. It never settles — it vibrates. */
  | 'tension'
  /** The soft one. Hovering it makes the paper blush. */
  | 'spark';

export type Fragment = {
  text: string;
  kind: FragmentKind;
  /** -1 pulled toward A, +1 toward B, 0 held between them. */
  pull: -1 | 0 | 1;
  /** How good the context has to be before this surfaces at all, 0..1. */
  surfacesAt: number;
};

export type MatchPair = {
  id: string;
  personA: Person;
  personB: Person;
  /** Constant across all this pair's scenes. Displayed as such. */
  pairSignal: number;
  scenes: Scene[];
  /** Reasons they might work, rendered as objects in the space between them. */
  fragments: Fragment[];
  /** The contradiction between stated and revealed preference. */
  hearMeOut: {
    stated: string;
    reading: string;
    line: string;
  };
};

export type RankedScene = {
  scene: Scene;
  utility: number;
  /** Signed contribution of each term, for the decision view. */
  contributions: { key: string; label: string; value: number; weight: number; signed: number }[];
  rank: number;
};

export type Phase =
  | 'intro'
  | 'exploring'
  | 'selected'
  | 'reasoning'
  | 'decision'
  | 'handoff'
  | 'quiet'
  | 'post-date'
  | 'memory';
