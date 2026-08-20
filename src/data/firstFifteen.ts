/**
 * SYNTHETIC. The opening fifteen minutes of each candidate evening.
 *
 * This is not a generated conversation and it is deliberately not dialogue —
 * putting words in two invented mouths would be a worse product than saying
 * nothing. Each beat describes a *social condition*: what the room is doing for
 * them, or to them, at that minute.
 *
 * That distinction is the whole reason `firstFifteenMinutesForecast` is a field
 * in the first place. The hardest part of a first date is not compatibility, it
 * is the opening — and the opening is mostly a property of the setting. These
 * beats are that claim written out longhand.
 *
 * Kept in its own file rather than added to `pairs.ts` so the scoring data stays
 * exactly as it was.
 */

export type Beat = {
  /** Minutes in. */
  at: 0 | 5 | 10 | 15;
  note: string;
};

type BeatsByScene = Record<string, [Beat, Beat, Beat, Beat]>;

const MAYA_JONAH: BeatsByScene = {
  coffee: [
    { at: 0, note: 'sat down. menus gone. nothing has happened yet.' },
    { at: 5, note: 'majors, hometowns. the interview has started on its own.' },
    { at: 10, note: 'one of them reaches for a phone and puts it back.' },
    { at: 15, note: 'it is going fine. fine is the whole problem.' },
  ],
  mission: [
    { at: 0, note: 'somebody has to read the card out loud. she does.' },
    { at: 5, note: 'the shelves are doing most of the talking.' },
    { at: 10, note: 'they are arguing about what counts as strange.' },
    { at: 15, note: 'the ten minutes are up. they are still in aisle four.' },
  ],
  gallery: [
    { at: 0, note: 'two strangers pretending to read the same wall label.' },
    { at: 5, note: 'he says something unkind about a sculpture.' },
    { at: 10, note: 'she has started quoting it back at him.' },
    { at: 15, note: 'neither of them is looking at the art any more.' },
  ],
  postshow: [
    { at: 0, note: 'the crowd is still doing some of the work.' },
    { at: 5, note: 'they already have something to react to.' },
    { at: 10, note: 'walking has taken the eye contact down to almost nothing.' },
    { at: 15, note: 'it has momentum, and neither of them had to start it.' },
  ],
  group: [
    { at: 0, note: 'introductions. six names, none of them retained.' },
    { at: 5, note: 'the group has absorbed them both.' },
    { at: 10, note: 'they have spoken directly to each other twice.' },
    { at: 15, note: 'a good night. not obviously with each other.' },
  ],
  study: [
    { at: 0, note: 'both arrive already finished with the day.' },
    { at: 5, note: 'the conversation is polite and quiet and small.' },
    { at: 10, note: 'somebody mentions how much work is left.' },
    { at: 15, note: 'they leave on time. exactly on time.' },
  ],
};

const PRIYA_THEO: BeatsByScene = {
  coffee: [
    { at: 0, note: 'she sits down already mid-sentence.' },
    { at: 5, note: 'he disagrees with her about something small.' },
    { at: 10, note: 'neither of them has checked the time.' },
    { at: 15, note: 'the table stopped mattering about ten minutes ago.' },
  ],
  mission: [
    { at: 0, note: 'he is reading the card like it is a contract.' },
    { at: 5, note: 'she has already found three candidates.' },
    { at: 10, note: 'the game is over before it warmed anything up.' },
    { at: 15, note: 'now they are talking. it took the game ending.' },
  ],
  gallery: [
    { at: 0, note: 'she is twenty minutes late off a shift.' },
    { at: 5, note: 'the room is quiet in a way neither of them enjoys.' },
    { at: 10, note: 'he is doing most of the work and knows it.' },
    { at: 15, note: 'she is kind about it. she is also completely spent.' },
  ],
  postshow: [
    { at: 0, note: 'the show ran twenty minutes long.' },
    { at: 5, note: 'she has been awake since five this morning.' },
    { at: 10, note: 'the walk is lovely and she is not really here for it.' },
    { at: 15, note: 'he offers to call it early. she is relieved.' },
  ],
  group: [
    { at: 0, note: 'she already knows four of the six.' },
    { at: 5, note: 'he is deep in conversation with somebody else.' },
    { at: 10, note: 'they orbit each other. they do not land.' },
    { at: 15, note: 'she had a great night. so did he. separately.' },
  ],
  study: [
    { at: 0, note: 'library steps. cold. two coffees going colder.' },
    { at: 5, note: 'it is easy. it is also not very much.' },
    { at: 10, note: 'nobody is performing. nobody is really trying either.' },
    { at: 15, note: 'fifteen minutes was exactly right, and that is the ceiling.' },
  ],
};

const BY_PAIR: Record<string, BeatsByScene> = {
  'maya-jonah': MAYA_JONAH,
  'priya-theo': PRIYA_THEO,
};

export const MINUTES = [0, 5, 10, 15] as const;
export type Minute = (typeof MINUTES)[number];

export function beatsFor(pairId: string, sceneId: string): [Beat, Beat, Beat, Beat] | null {
  return BY_PAIR[pairId]?.[sceneId] ?? null;
}

export function beatAt(pairId: string, sceneId: string, minute: Minute): Beat | null {
  return beatsFor(pairId, sceneId)?.find((b) => b.at === minute) ?? null;
}
