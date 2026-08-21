/**
 * The ubiquitous language.
 *
 * Domain-driven design's sharpest idea is that a product IS its language: the
 * words the team actually uses, kept precise, kept identical in conversation
 * and in code. This site has been building one since the first commit without
 * ever collecting it — the drop, the send bar, the opening, the intersection,
 * the shape, the quiet. Words that mean one exact thing here and nothing
 * anywhere else.
 *
 * So this is the glossary, and it is held to the same standard as everything
 * else: every term names the file and symbol it lives in, and `npm run check`
 * opens each file and asserts the symbol is really there. A glossary whose
 * words are not the code's words is marketing — the whole point of a
 * ubiquitous language is that there is only one.
 *
 * Definitions are written in the site's register, because the language belongs
 * to the product, not to a spec document.
 */

export type Term = {
  word: string;
  says: string;
  /** Which station of the vision flight coined it. */
  station: 'tonight' | 'campus' | 'meeting' | 'city' | 'quiet';
  /** Where it lives. Asserted, not decorative. */
  file: string;
  symbol: string;
};

export const LANGUAGE: Term[] = [
  {
    word: 'the drop',
    says: 'wednesday, 7pm. one match, a whole week riding on it.',
    station: 'tonight',
    file: 'src/components/drop/DropStage.tsx',
    symbol: 'DropStage',
  },
  {
    word: 'the send bar',
    says: 'the score an evening clears, or nobody hears about it.',
    station: 'tonight',
    file: 'src/lib/rankScenes.ts',
    symbol: 'SEND_THRESHOLD',
  },
  {
    word: 'the ending',
    says: 'said out loud before it starts, so saying yes costs a known amount.',
    station: 'tonight',
    file: 'src/lib/exit.ts',
    symbol: 'NEEDS_AN_ENDING',
  },
  {
    word: 'an opening',
    says: 'a possibility with an hour on it and no name yet.',
    station: 'campus',
    file: 'src/lib/intersections.ts',
    symbol: 'openWorld',
  },
  {
    word: 'the missing edge',
    says: 'the introduction no friend can make, because nobody knows both of them.',
    station: 'campus',
    file: 'src/lib/network.ts',
    symbol: 'readNetwork',
  },
  {
    word: 'an intersection',
    says: 'two people, a reason, a moment, a room, a shape. match was too small a word.',
    station: 'meeting',
    file: 'src/lib/compiler.ts',
    symbol: 'compile',
  },
  {
    word: 'the shape',
    says: 'how two lives first touch — direct, mission, parallel, group, afterglow.',
    station: 'meeting',
    file: 'src/lib/compiler.ts',
    symbol: 'SHAPES',
  },
  {
    word: 'scaffolding',
    says: 'how much of the conversation the room carries, so the humans don’t have to.',
    station: 'meeting',
    file: 'src/lib/compiler.ts',
    symbol: 'scaffolding',
  },
  {
    word: 'coherence',
    says: 'whether a score is an agreement or a truce. the number can’t say — this can.',
    station: 'city',
    file: 'src/lib/gravity.ts',
    symbol: 'coherence',
  },
  {
    word: 'social weather',
    says: 'a full campus can have nothing left in it. headcounts can’t tell.',
    station: 'city',
    file: 'src/lib/weather.ts',
    symbol: 'readWeather',
  },
  {
    word: 'the database',
    says: 'the thing the world never shows you. people arrive as openings or not at all.',
    station: 'city',
    file: 'src/lib/redaction.ts',
    symbol: 'privateSignals',
  },
  {
    word: 'the bill',
    says: 'every pixel is something you spent. this site prices itself too.',
    station: 'quiet',
    file: 'src/lib/attention.ts',
    symbol: 'audit',
  },
  {
    word: 'the quiet',
    says: 'the interface knowing when you don’t need it. the trade above every rung.',
    station: 'quiet',
    file: 'src/lib/autonomy.ts',
    symbol: 'lastWorthClimbing',
  },
];

/** The terms a station coins, in glossary order. */
export function termsFor(station: Term['station']): Term[] {
  return LANGUAGE.filter((t) => t.station === station);
}
