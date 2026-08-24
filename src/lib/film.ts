/**
 * The film, as data.
 *
 * Three manifests: the nine source shots (mapped to real files in
 * public/film, names untouched), the chapter map of the 54-second master
 * edit, and the cue list — every line of typography the player draws, with
 * its in/out point, voice and entrance. The edit lives in
 * scripts/build-film.mjs; this file is its mirror on the reading side, and
 * `npm run check` asserts every referenced file exists so the film can never
 * ship with a hole in it.
 */

export type FilmShot = {
  id: string;
  /** Actual filename inside public/film — never renamed. */
  file: string;
  title: string;
  /** Why the shot exists, in one line. THE CUT prints nothing longer. */
  oneLiner: string;
  poster: string;
  duration: number;
};

const src = (file: string) => encodeURI(`/film/${file}`);

export const SHOTS: FilmShot[] = [
  {
    id: 'wednesday',
    file: 'Phone_vibrating_on_desk_SCENE -1.mp4',
    title: 'WEDNESDAY',
    oneLiner: 'something arrives.',
    poster: '/film/exports/posters/wednesday.webp',
    duration: 8,
  },
  {
    id: 'open',
    file: 'Transition_from_message_to_thought_SHOT SCENE-2.mp4',
    title: 'OPEN THE NIGHT',
    oneLiner: 'one message opens a much larger question.',
    poster: '/film/exports/posters/open.webp',
    duration: 8,
  },
  {
    id: 'coffee',
    file: 'Two_students_talking_in_café_SHOT-3.mp4',
    title: 'COFFEE',
    oneLiner: 'good people can still get a bad opening.',
    poster: '/film/exports/posters/coffee.webp',
    duration: 8,
  },
  {
    id: 'turn',
    file: 'People_transforming_environment_1080p_SHOT -4.mp4',
    title: 'MOVE THE WORLD',
    oneLiner: 'keep the people. move the world.',
    poster: '/film/exports/posters/turn.webp',
    duration: 8,
  },
  {
    id: 'thisone',
    file: 'Maya_and_Jonah_walking_1080p_SHOT-5.mp4',
    title: 'THIS ONE',
    oneLiner: 'when the room settles, the people move.',
    poster: '/film/exports/posters/thisone.webp',
    duration: 8,
  },
  {
    id: 'break',
    file: 'People_approaching_food_stand_1080p_SHOT-6.mp4',
    title: 'REALITY BREAKS',
    oneLiner: 'preserve what is still true.',
    poster: '/film/exports/posters/break.webp',
    duration: 8,
  },
  {
    id: 'collapse',
    file: 'Paper_ticket_transitions_to_mess…_SHOT-7.mp4',
    title: 'COLLAPSE',
    oneLiner: 'complexity should collapse before it reaches the person.',
    poster: '/film/exports/posters/collapse.webp',
    duration: 8,
  },
  {
    id: 'phonesdown',
    file: 'Smartphones_left_on_counter_1080p_SHOT-8.mp4',
    title: 'GO HAVE A REAL LIFE',
    oneLiner: 'the interface knows when to leave.',
    poster: '/film/exports/posters/phonesdown.webp',
    duration: 8,
  },
  {
    id: 'ditto',
    file: 'Brand Marketing wherever needed.mp4',
    title: 'DITTO',
    oneLiner: 'one introduction is only the beginning.',
    poster: '/film/exports/posters/ditto.webp',
    duration: 10,
  },
];

/**
 * The storyboard alternate: same campaign, different draft, with type baked
 * into the frames — which is exactly why it never enters the master (the
 * film's typography must stay sharp, responsive DOM). It lives in THE CUT as
 * part of the record.
 */
export const STORYBOARD_ALT: FilmShot = {
  id: 'storyboard',
  file: 'Ditto_brand_sequence_storyboard_1080p_202608240400.mp4',
  title: 'STORYBOARD',
  oneLiner: 'an earlier draft of the ending, kept honest.',
  poster: '/film/exports/posters/storyboard.webp',
  duration: 10,
};

export const shotSrc = (s: FilmShot) => src(s.file);

export const MASTER = {
  src: '/film/exports/first-scene-film.mp4',
  poster: '/film/exports/poster.webp',
  teaser: '/film/exports/first-scene-teaser.mp4',
  hero: '/film/exports/hero.mp4',
  /** Sum of the trim map in scripts/build-film.mjs. */
  duration: 54,
};

/** Chapter marks on the master timeline — the hairline's ticks. */
export const CHAPTERS: { id: string; label: string; at: number }[] = [
  { id: 'wednesday', label: 'WED', at: 0 },
  { id: 'open', label: 'OPEN', at: 4 },
  { id: 'coffee', label: 'COFFEE', at: 7 },
  { id: 'turn', label: 'MOVE', at: 12 },
  { id: 'thisone', label: 'THIS ONE', at: 20 },
  { id: 'break', label: 'BREAK', at: 26 },
  { id: 'collapse', label: 'COLLAPSE', at: 32 },
  { id: 'phonesdown', label: 'REAL LIFE', at: 37 },
  { id: 'ditto', label: 'DITTO', at: 44 },
];

export type CueVoice =
  | 'campaign' // Anton, uppercase, the poster voice
  | 'human' // Instrument Serif italic, sentence case
  | 'system' // JetBrains Mono, small, tracked
  | 'bubble' // the cobalt message
  | 'plan'; // the three useful lines the person actually receives

export type Cue = {
  at: number;
  until: number;
  voice: CueVoice;
  text: string;
  /** Second line, smaller, same voice unless voice2 overrides. */
  sub?: string;
  voice2?: CueVoice;
  /** 'cut' enters on a hard frame; 'dissolve' fades. Campaign claims cut. */
  enter: 'cut' | 'dissolve';
  /** Scale of the campaign voice when it matters. */
  size?: 'md' | 'lg' | 'xl';
  /** Vertical anchor. Default centers in the lower third. */
  pos?: 'center' | 'lower' | 'upper';
};

/**
 * The whole edit's typography. Timing follows the trim map: wednesday@0,
 * open@4, coffee@7, turn@12, thisone@20, break@26, collapse@32,
 * phonesdown@37, ditto@44, end 54.
 */
export const CUES: Cue[] = [
  // 01 — WEDNESDAY
  { at: 0.5, until: 2.3, voice: 'system', text: 'WED · 7:00 PM', enter: 'dissolve', pos: 'upper' },
  { at: 2.3, until: 4.0, voice: 'bubble', text: 'found someone.', enter: 'cut', pos: 'center' },

  // 02 — OPEN THE NIGHT
  { at: 4.4, until: 5.8, voice: 'campaign', text: 'MAYA × JONAH', enter: 'cut', size: 'md', pos: 'center' },
  { at: 5.9, until: 7.0, voice: 'human', text: 'but the first scene matters too.', enter: 'dissolve', pos: 'center' },

  // 03 — COFFEE
  { at: 7.5, until: 8.8, voice: 'human', text: 'right person.', enter: 'dissolve', pos: 'lower' },
  { at: 9.0, until: 10.9, voice: 'campaign', text: 'WRONG FIRST DATE.', enter: 'cut', size: 'lg', pos: 'lower' },
  { at: 10.9, until: 12.0, voice: 'system', text: '01 / COFFEE', sub: 'too much conversational pressure', enter: 'cut', pos: 'lower' },

  // 04 — THE TURN (system ticks ride the transformation; text stays small)
  { at: 12.4, until: 13.7, voice: 'system', text: '01 / COFFEE', sub: 'too much pressure', enter: 'cut', pos: 'lower' },
  { at: 14.0, until: 15.3, voice: 'system', text: '02 / MINI MISSION', sub: 'gives the silence something to do', enter: 'cut', pos: 'lower' },
  { at: 15.6, until: 16.9, voice: 'system', text: '03 / GALLERY DRIFT', sub: 'something to react to', enter: 'cut', pos: 'lower' },
  { at: 17.2, until: 18.3, voice: 'system', text: '04 / POST SHOW', sub: 'shared moment first', enter: 'cut', pos: 'lower' },
  // SNAP — all system language leaves; one claim
  { at: 18.7, until: 20.0, voice: 'campaign', text: 'THIS ONE.', enter: 'cut', size: 'lg', pos: 'center' },

  // 05 — THIS ONE (the people are the explanation; type stays out of the way)
  { at: 20.8, until: 22.3, voice: 'human', text: 'they don’t need more compatibility.', enter: 'dissolve', pos: 'lower' },
  { at: 22.6, until: 25.2, voice: 'campaign', text: 'THEY NEED LESS PRESSURE.', enter: 'cut', size: 'xl', pos: 'lower' },

  // 06 — REALITY BREAKS (state inspected, then erased for the sentence)
  { at: 26.4, until: 27.2, voice: 'system', text: 'REALITY CHANGED', enter: 'cut', pos: 'lower' },
  { at: 27.3, until: 28.1, voice: 'system', text: 'VENUE', sub: 'INVALIDATED', enter: 'cut', pos: 'lower' },
  { at: 28.2, until: 29.0, voice: 'system', text: 'PAIR', sub: 'PRESERVED', enter: 'cut', pos: 'lower' },
  { at: 29.1, until: 29.9, voice: 'system', text: 'ACTION · REPLAN', sub: 'REMATCH · FALSE', enter: 'cut', pos: 'lower' },
  { at: 30.2, until: 31.1, voice: 'human', text: 'the place broke.', enter: 'dissolve', pos: 'center' },
  { at: 31.2, until: 32.0, voice: 'campaign', text: 'THE MATCH DIDN’T.', enter: 'cut', size: 'md', pos: 'center' },

  // 07 — COLLAPSE (three useful lines; nothing else)
  { at: 33.4, until: 36.6, voice: 'plan', text: 'Thursday · 8:32 PM', sub: 'post-show walk → tacos', enter: 'dissolve', pos: 'center' },
  { at: 35.4, until: 36.8, voice: 'human', text: 'both good with that?', enter: 'dissolve', pos: 'lower' },

  // 08 — PHONES DOWN
  { at: 37.7, until: 39.4, voice: 'human', text: 'you two take it from here.', enter: 'dissolve', pos: 'center' },
  { at: 40.6, until: 43.6, voice: 'campaign', text: 'GO HAVE A REAL LIFE.', enter: 'cut', size: 'lg', pos: 'center' },

  // 09 — DITTO (first second: no text; then the two fixed claims)
  { at: 45.0, until: 46.8, voice: 'campaign', text: 'THE INTERNET\nGAVE YOU EVERYONE.', enter: 'cut', size: 'md', pos: 'center' },
  { at: 46.8, until: 49.0, voice: 'campaign', text: 'DITTO GIVES YOU\nSOMEONE.', enter: 'cut', size: 'xl', pos: 'center' },
  { at: 49.3, until: 50.1, voice: 'system', text: '100+ SCHOOLS JOINED', enter: 'cut', pos: 'center' },
  { at: 50.2, until: 51.5, voice: 'campaign', text: 'ONE WEDNESDAY.', enter: 'cut', size: 'lg', pos: 'center' },
  { at: 51.9, until: 54.0, voice: 'human', text: 'the best part of Ditto', sub: 'happens after Ditto.', enter: 'dissolve', pos: 'center' },
];

/**
 * The campus names in the brand shot — schools from Ditto's publicly listed
 * college footprint, names only, never framed as partnerships. Deterministic
 * placement across three depth layers, kept out of the center band where the
 * faces live. The first `mobileCount` render on small screens.
 */
export type SchoolMark = {
  name: string;
  x: number; // vw %
  y: number; // vh %
  depth: 0.55 | 1 | 1.55; // far / mid / near
  delay: number; // s after the layer opens
};

export const SCHOOLS_OPEN = 45.2;
export const SCHOOLS_CLOSE = 49.1;
export const SCHOOLS_MOBILE_COUNT = 7;

export const SCHOOLS: SchoolMark[] = [
  { name: 'USC', x: 8, y: 18, depth: 1, delay: 0.0 },
  { name: 'UCLA', x: 78, y: 12, depth: 1.55, delay: 0.2 },
  { name: 'UC BERKELEY', x: 16, y: 82, depth: 1, delay: 0.35 },
  { name: 'STANFORD', x: 70, y: 86, depth: 0.55, delay: 0.5 },
  { name: 'MICHIGAN', x: 30, y: 10, depth: 0.55, delay: 0.65 },
  { name: 'NYU', x: 88, y: 74, depth: 1, delay: 0.8 },
  { name: 'UT AUSTIN', x: 6, y: 55, depth: 0.55, delay: 0.95 },
  { name: 'HARVARD', x: 58, y: 8, depth: 0.55, delay: 1.1 },
  { name: 'COLUMBIA', x: 90, y: 30, depth: 0.55, delay: 1.25 },
  { name: 'PURDUE', x: 22, y: 92, depth: 1.55, delay: 1.4 },
  { name: 'DUKE', x: 46, y: 90, depth: 0.55, delay: 1.55 },
  { name: 'UCSD', x: 84, y: 90, depth: 1, delay: 1.7 },
  { name: 'UIUC', x: 4, y: 32, depth: 1, delay: 1.85 },
  { name: 'WISCONSIN', x: 40, y: 6, depth: 1, delay: 2.0 },
  { name: 'YALE', x: 66, y: 20, depth: 0.55, delay: 2.15 },
  { name: 'UNC', x: 12, y: 70, depth: 1.55, delay: 2.3 },
];
