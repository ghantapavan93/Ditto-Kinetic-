import { sendDecision, winningScene } from '@/lib/rankScenes';
import { endingClock, readExits } from '@/lib/exit';
import { readSchedule } from '@/lib/schedule';
import { WORDS_PER_MINUTE } from '@/lib/attention';
import { clockToMinutes, minutesToClock } from '@/lib/booking';
import type { MatchPair, Person, Scene } from '@/lib/types';
import { NO_CONDITIONS, type Conditions } from '@/lib/rankScenes';

/**
 * The thread.
 *
 * Everything else in this project is a surface you look at. This is the one
 * that argues the surfaces should mostly not exist.
 *
 * Ditto has publicly signalled a direction away from swiping and toward
 * something message-native — the whole loop living in a text thread rather than
 * an app you open. Taken seriously, that is not a smaller version of this site.
 * It inverts it. The enormous cinematic reasoning at `/`, `/compiler`,
 * `/mutual`, `/world` stops being the product and becomes the thing underneath
 * the product, available if you want it and invisible if you don't.
 *
 * So this page has three worlds:
 *
 *   NORMAL    a thread. eight messages across nine days. almost no interface.
 *   THINKING  tap one message and it opens into the whole ranked apparatus.
 *   HUMAN     it collapses back to the thread, and then the thread goes quiet.
 *
 * The inversion is the point: **the fewer seconds you spend here, the better it
 * did**. Every other product measures the opposite. This file therefore counts
 * the words in the thread and prices them, the same way `/attention` prices the
 * rest of the site, so the claim that the whole product fits in half a minute is
 * a measurement rather than a boast.
 *
 * Nothing here is a mock-up of a real messaging client, and none of the content
 * is written: the name, the hour, the place, the walk, the ending and whether
 * anything gets sent at all are read out of the same engine every other surface
 * uses. If the engine changes its mind, the thread changes what it says.
 */

export type Sender = 'ditto' | 'you';

export type Beat = {
  id: string;
  sender: Sender;
  text: string;
  /** Clock time, for the thread's own timestamps. */
  at: string;
  /** Short day marker. A new one starts a new group in the thread. */
  day: string;
  /** The one message that opens the thinking world. Exactly one, asserted. */
  opens?: boolean;
  /** Quiet grey line under a message, like a receipt. */
  receipt?: string;
};

export type Thread = {
  beats: Beat[];
  scene: Scene;
  other: Person;
  /** How the engine described the ending, said out loud before it starts. */
  ending: string;
  /**
   * The one concrete logistical fact, lifted from the scene's own artifacts.
   * Null for rooms that carry none -- a cafe has no walk to mention.
   */
  detail: string | null;
  words: number;
  /** Reading time at 240wpm, the same rate `/attention` uses. */
  seconds: number;
};

/*
 * Imported, not restated. This was a second literal `240` whose comment claimed
 * it was "the same reading rate the attention audit uses" -- true only for as
 * long as nobody changed the other one. Two copies of a number that must agree
 * is the same defect as a count written into copy, in a quieter place.
 */

/**
 * The copy, with holes in it.
 *
 * Written by a three-writer panel judged twice on texture, economy, honesty and
 * payoff. Every brace is filled from the engine below — a thread that hardcoded
 * a name and a venue would be a screenshot, not a product.
 */
const SCRIPT = {
  lastWeek: [
    'nothing last wednesday. nobody fit.',
    'back wednesday, 7.',
  ],
  /** {COUNT} is how many evenings the engine actually considered. */
  drop: '{NAME}. i ran {COUNT} evenings for you two. one of them wasn\u2019t a compromise.',
  tapHint: 'tap it if you want the working. it\u2019s long.',
  settled: ['{DAY}, {TIME}, {PLACE}. both of you already said yes.'],
  /** Only sent when the room actually carries a logistical fact worth texting. */
  detail: '{DETAIL}. {NAME} will be early to it. don\u2019t read into that.',
  dayOf: '{TIME} tonight. you don\u2019t have to be interesting, just there.',
  after: 'not asking how it went. you\u2019ll say something or you won\u2019t.',
  momentum: 'you two picked next week yourselves. no drop wednesday \u2014 you don\u2019t need one.',
  abstain: 'nothing this week clears the bar. i\u2019d rather send nothing than send anything.',
} as const;

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? `{${key}}`);
}

/**
 * Pull the one concrete logistical fact the scene already carries.
 *
 * The scenes were authored with physical artifacts — a ticket stub, a route, a
 * time. One of them is almost always the thing a real text would actually say
 * ("7 MIN WALK"), so the thread takes it rather than inventing a detail.
 */
function detailFor(scene: Scene): string | null {
  const route = scene.artifacts.find((a) => a.kind === 'route' && a.label);
  return route?.label ? route.label.toLowerCase() : null;
}

/**
 * The ending, cut down to something a person would actually text.
 *
 * `readExits` writes for a reading surface, in full sentences. A room that ends
 * itself gets its first clause -- that is the whole useful content. A room that
 * needs an ending gets the hour, computed with the site's own arithmetic rather
 * than scraped back out of the sentence that already contains it.
 */
function endingLine(scene: Scene, how: string, needsAnEnding: boolean): string {
  if (needsAnEnding) {
    return `it’s an hour. over at ${endingClock(scene.time, 60).toLowerCase()}, so neither of you has to be the one to call it.`;
  }
  const first = how.split(/(?<=\.)\s+/)[0] ?? how;
  return first.trim();
}

export function buildThread(pair: MatchPair, conditions: Conditions = NO_CONDITIONS): Thread {
  const decision = sendDecision(pair, conditions);
  const scene = winningScene(pair, conditions) ?? pair.scenes[0];
  const other = pair.personB;

  // The ending, in the engine's own words. Said before it starts, because the
  // whole site argues that knowing how a night ends is what makes yes cheap.
  const exits = readExits(pair);
  const forScene = exits.find((e) => e.scene.id === scene.id);
  // `how` is the room's own ending; `supplied` is the one we add when the room
  // has none. Preferring the room's is the whole point of the exit layer -- a
  // built-in ending costs nobody anything to take.
  const ending = forScene
    ? endingLine(scene, forScene.how, forScene.needsAnEnding)
    : 'it ends when it ends.';

  /*
   * The day, from the schedule engine that already exists.
   *
   * This was the string literal 'thursday'. For Priya and Theo it named a day
   * they have no mutual window on at all -- their overlaps are wednesday,
   * friday and sunday -- on the one surface whose own header promises that the
   * name, the hour and the place are read out of the same engine as everything
   * else. It is now read out of that engine.
   */
  const schedule = readSchedule(pair.personA, pair.personB);
  const day = schedule.best?.dayName ?? 'wednesday';

  const detail = detailFor(scene);
  const values: Record<string, string> = {
    NAME: other.name,
    TIME: scene.time.toLowerCase(),
    PLACE: scene.location,
    DAY: day,
    DETAIL: detail ?? '',
    ENDING: ending,
  };

  values.COUNT = String(pair.scenes.length);

  const beats: Beat[] = [];
  const push = (b: Omit<Beat, 'id'>) => beats.push({ ...b, id: `beat-${beats.length}` });

  // last week, already read. this is a habit, not a launch.
  SCRIPT.lastWeek.forEach((text, i) =>
    push({ sender: 'ditto', text, at: i === 0 ? '11:40 pm' : '11:41 pm', day: 'last sunday' }),
  );

  // the drop. the one message that opens the whole apparatus.
  push({
    sender: 'ditto',
    text: fill(SCRIPT.drop, values),
    at: '7:00 pm',
    day: 'wednesday',
    opens: true,
  });
  push({ sender: 'ditto', text: SCRIPT.tapHint, at: '7:00 pm', day: 'wednesday' });

  // If the engine would not send, the thread does not pretend otherwise. This
  // is the same abstention every other surface honours, and it matters more
  // here: a product that texts you every week regardless is just a newsletter.
  if (!decision.send) {
    push({
      sender: 'ditto',
      text: SCRIPT.abstain,
      at: '7:02 pm',
      day: 'wednesday',
    });
    return finish(beats, scene, other, ending, detail);
  }

  push({ sender: 'you', text: 'go on then', at: '7:04 pm', day: 'wednesday' });

  SCRIPT.settled.forEach((t) =>
    push({ sender: 'ditto', text: fill(t, values), at: '7:04 pm', day: 'wednesday' }),
  );

  // Silence beats filler. A room with no walk, no ticket and no route has
  // nothing extra worth a message, and sending one anyway would cost attention
  // to say nothing -- which is the exact failure this whole project is about.
  if (detail) {
    push({ sender: 'ditto', text: fill(SCRIPT.detail, values), at: '7:05 pm', day: 'wednesday' });
  }

  push({ sender: 'ditto', text: values.ENDING, at: '7:05 pm', day: 'wednesday' });

  /*
   * Three hours before the thing it is reminding you about.
   *
   * This was pinned at '5:30 pm' whatever the plan was, so for a 3:40 pm coffee
   * the product sent "3:40 pm tonight" a hundred and ten minutes after the date
   * had started. Only the 8:32 pm walk read correctly, which is exactly why it
   * survived: the pair on screen by default was the one it happened to suit.
   */
  const sceneStart = clockToMinutes(scene.time);
  const remindAt = sceneStart === null ? '9:00 am' : minutesToClock(sceneStart - 180);
  push({ sender: 'ditto', text: fill(SCRIPT.dayOf, values), at: remindAt, day });
  push({ sender: 'ditto', text: SCRIPT.after, at: '9:12 am', day: `the morning after` });
  push({
    sender: 'ditto',
    text: SCRIPT.momentum,
    at: '6:03 pm',
    day: 'the following tuesday',
    receipt: 'no reply needed',
  });

  return finish(beats, scene, other, ending, detail);
}

function finish(
  beats: Beat[],
  scene: Scene,
  other: Person,
  ending: string,
  detail: string | null,
): Thread {
  const words = beats.reduce((t, b) => t + b.text.split(/\s+/).filter(Boolean).length, 0);
  return {
    beats,
    scene,
    other,
    ending,
    detail,
    words,
    seconds: (words / WORDS_PER_MINUTE) * 60,
  };
}

/**
 * The closing narration. Not a message — the page speaking, once.
 *
 * Derived, because the earlier version of this line said "eight messages" while
 * the thread rendered eleven, and would have said it on the abstention path too,
 * where there is no plan and far fewer messages. A sentence about how little
 * this product says cannot itself be careless about the number.
 */
export function silenceFor(thread: Thread): string {
  return `${thread.beats.length} messages. ${thread.seconds.toFixed(0)} seconds. the rest happened where the app couldn\u2019t see.`;
}
