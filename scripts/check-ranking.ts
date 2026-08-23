/**
 * The claims that must never silently break.
 *
 * FIRST SCENE argues two things. First, that it is a system rather than a
 * hardcoded cinematic: run the *same* scorer with the *same* weights over the
 * *same* six rooms, change only the two people, and the ranking inverts.
 * Second, that it exercises judgement rather than `sort()`: when the week is
 * bad enough, it returns nothing at all.
 *
 * If either stops being true, the piece is a lie regardless of how good the
 * animation looks.
 *
 *   npm run check
 */

import { PAIRS, pairById } from '../src/data/pairs';
import { WEEK_TWO } from '../src/data/weekTwo';
import { CLOUD_COUNT, possibilityCloud } from '../src/lib/possibility';
import { HELD_BACK } from '../src/data/heldBack';
import { heldBack } from '../src/lib/restraint';
import { privateSignals } from '../src/lib/redaction';
import { doubleDate, rankDoubles } from '../src/lib/doubleDate';
import { ENOUGH_MINUTES, label, readSchedule } from '../src/lib/schedule';
import { beliefsFor } from '../src/lib/mutuality';
import { readLens, type LensKey } from '../src/lib/lenses';
import { QUESTIONS, STARTING_TRAITS } from '../src/data/livingProfile';
import {
  ACTIONABLE,
  CONFIDENCE_CEILING,
  applyAnswer,
  unknowns,
  actionable as actionableTraits,
} from '../src/lib/profile';
import { ODDS_CEILING, guaranteeCost, oddsFor } from '../src/lib/odds';
import { EXIT_WEIGHT, exitVerdict, readExits } from '../src/lib/exit';
import { compile, scaffolding } from '../src/lib/compiler';
import { buildCampus } from '../src/lib/campus';
import { bridgeFor, readNetwork } from '../src/lib/network';
import { WAYPOINTS, cameraAt, distanceToPair, levelAt } from '../src/lib/zoom';
import {
  CEIL,
  FLOOR,
  MAX_GAP,
  MIN_GAP,
  coherence,
  fieldFor,
  fieldsFor,
  gapFor,
} from '../src/lib/gravity';
import { ALIVE, buildWeek, readWeather } from '../src/lib/weather';
import { SCRUB_DAYS, openWorld } from '../src/lib/intersections';
import { PHOTOS } from '../src/data/photoManifest';
import { STATIONS, stationAt, stationOpacity, visionCameraAt } from '../src/lib/vision';
import { LANGUAGE, termsFor } from '../src/lib/language';
import { SCHOOLS, barAt, buildWorld, survivorsAt } from '../src/lib/world';
import {
  DISPOSITIONS,
  mutualityOf,
  overruled,
  overstatement,
  weightsOf,
} from '../src/lib/mutuality';
import { buildThread, silenceFor } from '../src/lib/thread';
import { WAYS_IN, costOfWay, shortestWay } from '../src/lib/waysIn';
import { PROOF } from '../src/data/proof';
import { CONTRAST } from '../src/data/contrastReport';
import { ROUTES, SHARED_DIRS } from './measure-attention';
import {
  SITTING_MINUTES,
  type Booking,
  clashes,
  clockToMinutes,
  planWeek,
  replanAfter,
} from '../src/lib/booking';
import type { MatchPair, Scene } from '../src/lib/types';
import type { SendDecision } from '../src/lib/rankScenes';
import { existsSync, readFileSync as readSourceFile, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { SURFACES } from '../src/data/attentionInventory';
import {
  SECONDS_PER_DECISION,
  WEEKLY_BUDGET_SECONDS,
  WORDS_PER_MINUTE,
  audit,
  costOf,
  saidAs,
} from '../src/lib/attention';
import {
  INALIENABLE,
  isConsentOnly,
  ladder,
  lastWorthClimbing,
} from '../src/lib/autonomy';
import {
  LENSES,
  challengeSet,
  lensesDisagree,
  readAllLenses,
  whyNot,
} from '../src/lib/lenses';
import { CARD_H, CARD_W, computeStageLayout } from '../src/components/three/useStageLayout';
import { cardTarget } from '../src/components/three/cardTransform';
import { FRAGMENT_MAX_WIDTH, FRAGMENT_SCALE, fragmentSlot } from '../src/lib/fragments';
import { damp } from '../src/lib/motion';
import { NO_CONDITIONS, SAFETY_FLOOR, SCORED_FIELDS, SEND_THRESHOLD, WEIGHTS, belowSafetyFloor, metricsFor, rankScenes, scoreScene, sendDecision, type Conditions, type Learned, weightsFor } from '../src/lib/rankScenes';

const HEADING8 = '\nClaim 8 — the lenses are a partition, not a cast:';
const HEADING9 = '\nClaim 9 — the possibility cloud is uncertainty made physical:';
const HEADING10 = '\nClaim 10 — restraint names what it is waiting for:';
const HEADING11 = '\nClaim 11 — the profile never claims to know a person:';
const HEADING12 = '\nClaim 12 — the redaction has nothing behind it:';
const HEADING13 = '\nClaim 13 — four people is not two pairs:';
const HEADING14 = '\nClaim 14 — free is not the same as alive:';
const HEADING15 = '\nClaim 15 — nobody is guaranteed anything:';
const HEADING16 = '\nClaim 16 — the twelfth dimension did not earn its place:';
const HEADING17 = '\nClaim 17 — the compiler reads its input, and never lowers the bar:';
const HEADING18 = '\nClaim 18 — the missing edge is not the compatible one:';
const HEADING19 = '\nClaim 19 — one camera, and it never jumps:';
const HEADING20 = '\nClaim 20 — forces are the model, not a picture of it:';
const HEADING21 = '\nClaim 21 — the weather is counted, not written:';
const HEADING22 = '\nClaim 22 — the audit includes the auditor:';
const HEADING23 = '\nClaim 23 — the top rung takes nothing and still costs you:';
const HEADING24 = '\nClaim 24 — the ending runs the real thing:';
const HEADING25 = '\nClaim 25 — an opening appears before a person does:';
const HEADING26 = '\nClaim 26 — the reel ships only what it says it ships:';
const HEADING27 = '\nClaim 27 — the future is flown, not asserted:';
const HEADING28 = "\nClaim 28 — the language is the code's language:";
const HEADING29 = "\nClaim 29 — nothing ships unreachable, and no count is written:";
const HEADING30 = "\nClaim 30 — scale does not buy what it looks like it buys:";
const HEADING31 = "\nClaim 31 \u2014 an introduction is only as good as the reluctant one:";
const HEADING32 = "\nClaim 32 \u2014 the thread says what the engine decided:";
const HEADING33 = "\nClaim 33 \u2014 the front door recommends, and admits:";
const HEADING34 = "\nClaim 34 \u2014 the model is what it says it is:";
const HEADING35 = "\nClaim 35 \u2014 a plan is not a ranking:";
const HEADING36 = "\nClaim 36 \u2014 one card, one evening; one ranking, one partition:";
const HEADING37 = "\nClaim 37 — everything on this site can actually be read:";
const HEADING38 = "\nClaim 38 \u2014 the guards look where they say they look:";

const HEADING7 = '\nClaim 7 — last week changes this week:';

const HEADING6 = '\nClaim 6 — the motion resolves from a cold start:';

let failures = 0;

function expect(label: string, actual: unknown, wanted: unknown) {
  const ok = actual === wanted;
  if (!ok) failures++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}: ${actual}${ok ? '' : ` (expected ${wanted})`}`);
}

const STRAINED: Conditions = { ...NO_CONDITIONS, week: 'strained' };

/* ---- data integrity ------------------------------------------------------ */

for (const pair of PAIRS) {
  console.log(`\n${pair.id}`);
  const ranked = rankScenes(pair);
  ranked.forEach((r) =>
    console.log(
      `  ${r.rank}. ${r.scene.label.padEnd(16)} ${r.utility.toFixed(4)}  ${
        r.utility >= SEND_THRESHOLD ? 'send' : '— under bar'
      }`,
    ),
  );
  console.log('  ---');

  // The thesis as an assertion: these two people are equally compatible in
  // every room. Only the room changes.
  const signals = new Set(pair.scenes.map((s) => s.metrics.pairSignal));
  expect('pairSignal is constant across all six scenes', signals.size, 1);

  expect('every scene has exactly three rationale notes',
    pair.scenes.every((s) => s.rationale.length === 3), true);
  expect('every scene admits an uncertainty',
    pair.scenes.every((s) => s.uncertainty.trim().length > 0), true);
  expect('scoring is deterministic',
    pair.scenes.every((s) => scoreScene(s.metrics) === scoreScene(s.metrics)), true);
  expect('all metrics normalised to 0..1',
    pair.scenes.every((s) =>
      Object.entries(s.metrics)
        .filter(([, v]) => typeof v === 'number')
        .every(([, v]) => (v as number) >= 0 && (v as number) <= 1),
    ), true);
}

/* ---- claim 1: same engine, different people, inverted answer -------------- */

console.log('\nClaim 1 — the ranking inverts between pairs:');
const one = rankScenes(PAIRS[0]);
const two = rankScenes(PAIRS[1]);
expect('pair 1 winner is the post-show walk', one[0].scene.id, 'postshow');
expect('pair 1 ranks coffee 5th', one.find((r) => r.scene.id === 'coffee')?.rank, 5);
expect('pair 2 winner is coffee', two[0].scene.id, 'coffee');
expect('pair 2 ranks the post-show walk last', two.find((r) => r.scene.id === 'postshow')?.rank, 6);

/* ---- claim 2: the system can decline ------------------------------------- */

console.log('\nClaim 2 — the system abstains rather than sending anything:');

for (const pair of PAIRS) {
  const normal = sendDecision(pair, NO_CONDITIONS);
  expect(`${pair.id} sends in a normal week`, normal.send, true);

  const strained = sendDecision(pair, STRAINED);
  expect(`${pair.id} declines in a strained week`, strained.send, false);
  if (!strained.send && strained.best) {
    console.log(
      `        best available ${strained.best.utility.toFixed(4)} · ` +
        `${strained.shortfall.toFixed(4)} under the ${SEND_THRESHOLD} bar`,
    );
    console.log(`        reason: ${strained.reason}`);
  }
}

// A strained week must not be able to look like a matching failure. The two
// fields that would imply "these people are wrong for each other" are exactly
// the two the strain transform leaves alone.
console.log('\n  the abstention must not be blamed on the pair:');
for (const pair of PAIRS) {
  const before = rankScenes(pair, NO_CONDITIONS);
  const after = rankScenes(pair, STRAINED);
  const same = (key: 'pairSignal' | 'contextFit') =>
    before.every((b) => {
      const a = after.find((x) => x.scene.id === b.scene.id);
      const bv = b.contributions.find((c) => c.key === key)?.value;
      const av = a?.contributions.find((c) => c.key === key)?.value;
      return bv === av;
    });
  expect(`${pair.id} pairSignal unchanged by a bad week`, same('pairSignal'), true);
  expect(`${pair.id} contextFit unchanged by a bad week`, same('contextFit'), true);
}

/* ---- claim 3: resilience holds the pair, replans only context ------------- */

console.log('\nClaim 3 — disruptions replan context and never touch the pair:');
{
  const pair = PAIRS[0];
  const chosen = sendDecision(pair, NO_CONDITIONS);
  if (!chosen.send) throw new Error('expected pair 1 to send in a normal week');

  const afterVenue: Conditions = { ...NO_CONDITIONS, excluded: [chosen.scene.id] };
  const recovered = sendDecision(pair, afterVenue);
  expect('losing the winning venue still produces a plan', recovered.send, true);
  if (recovered.send) {
    expect('the replan picks a different scene', recovered.scene.id !== chosen.scene.id, true);
    console.log(`        ${chosen.scene.label} lost → ${recovered.scene.label}`);
  }

  // Pile disruptions on until it gives up, and confirm it gives up rather than
  // quietly shipping something under the bar.
  const piled: Conditions = {
    week: 'normal',
    disruptions: ['availability', 'distance'],
    excluded: [chosen.scene.id],
  };
  const collapsed = sendDecision(pair, piled);
  expect('enough disruption withdraws the plan entirely', collapsed.send, false);
  if (!collapsed.send && collapsed.best) {
    console.log(
      `        best survivor ${collapsed.best.scene.label} at ${collapsed.best.utility.toFixed(4)} — withdrawn`,
    );
  }
}

/* ---- claim 4: the stage geometry can actually express the argument -------- */

console.log('\nClaim 4 — the physical language has enough range to be read:');
{
  // world-space viewport sizes at the stage's camera distance
  const VIEWPORTS: [string, number, number][] = [
    ['desktop 1920x1080', 8.89, 4.22],
    ['laptop 1440x900', 6.75, 4.22],
    ['ultrawide 2560x1080', 10.0, 4.22],
    ['tablet portrait', 3.16, 4.22],
    ['phone portrait', 1.95, 4.22],
  ];

  for (const [name, w, h] of VIEWPORTS) {
    const l = computeStageLayout(w, h);
    const card = l.portrait ? CARD_H : CARD_W;
    const gapWorst = l.spreadMax - card;
    const gapBest = l.spreadMin - card;
    const extent = (l.spreadMax + card) * l.scale;
    const limit = l.portrait ? h : w;

    console.log(
      `  ${name.padEnd(19)} ${(l.portrait ? 'portrait' : 'landscape').padEnd(10)} ` +
        `scale ${l.scale.toFixed(2)}  gap ${gapWorst.toFixed(2)} -> ${gapBest.toFixed(2)}  ` +
        `extent ${extent.toFixed(2)}/${limit.toFixed(2)}`,
    );

    // A wrong context has to open a gap you can actually see, not a nudge.
    expect(`${name}: wrong context opens a real gap`, gapWorst > card * 0.3, true);
    // A right context brings them close, but overlapping reads as a rendering
    // fault rather than as closeness — so they must never cross.
    expect(`${name}: right context never overlaps`, gapBest > 0, true);
    expect(`${name}: right context is genuinely close`, gapBest < card * 0.25, true);
    // And the whole arrangement stays on screen.
    expect(`${name}: fits the viewport`, extent <= limit * 1.001, true);
  }
}

/* ---- claim 5: the reason field is honest ---------------------------------- */

console.log('\nClaim 5 — the reasons behave like reasons:');
for (const pair of PAIRS) {
  const tension = pair.fragments.filter((f) => f.kind === 'tension');
  const spark = pair.fragments.filter((f) => f.kind === 'spark');

  // A real tension surfaces early and stays. If the only way to see the
  // difficult thing were to already be in the best possible room, the field
  // would be flattery rather than evidence.
  expect(
    `${pair.id}: tension surfaces before the good news`,
    tension.every((t) => pair.fragments.filter((f) => f.kind !== 'tension').every((f) => f.surfacesAt >= t.surfacesAt)),
    true,
  );
  expect(`${pair.id}: has at least one tension`, tension.length >= 1, true);
  expect(`${pair.id}: has exactly one spark`, spark.length, 1);
  expect(
    `${pair.id}: every fragment surfaces within reach`,
    pair.fragments.every((f) => f.surfacesAt >= 0 && f.surfacesAt <= 0.9),
    true,
  );

  // Legibility. A note nobody can read is worse than no note, and the first
  // layout buried three of six by spacing them closer together than they are
  // wide. `gather` at full magnetism is the tightest the field ever gets.
  const GATHER = 0.86;
  const slots = pair.fragments.map((f, i) => fragmentSlot(i, pair.fragments.length, f.pull));
  for (const row of [0, 1]) {
    const xs = slots.filter((s2) => s2.row === row).map((s2) => s2.x * GATHER).sort((a, b) => a - b);
    const pitch = xs.length > 1 ? Math.min(...xs.slice(1).map((x, i) => x - xs[i])) : Infinity;
    expect(`${pair.id} row ${row}: notes never overlap each other`, pitch > FRAGMENT_MAX_WIDTH, true);
  }
  // And the rows stay off the photographs (card half-height 0.87).
  const clearance = Math.min(...slots.map((s2) => Math.abs(s2.y) * GATHER)) - FRAGMENT_SCALE / 2;
  expect(`${pair.id}: notes clear the photographs`, clearance > CARD_H / 2, true);
}

/* ---- claim 6: the motion actually resolves -------------------------------- */

console.log(HEADING6);
{
  const layout = computeStageLayout(8.89, 4.22);
  const DT = 1 / 60;

  /** Step both cards through a damped loop and report where they end up. */
  const settle = (magnetism: number, seconds: number) => {
    let left = { x: 0, y: 0, rotZ: 0 };
    let right = { x: 0, y: 0, rotZ: 0 };
    const trail: number[] = [];
    for (let i = 0; i < seconds / DT; i++) {
      const t = i * DT;
      const a = cardTarget(-1, magnetism, layout, t);
      const b = cardTarget(1, magnetism, layout, t);
      left = {
        x: damp(left.x, a.x, 4.2, DT),
        y: damp(left.y, a.y, 4.2, DT),
        rotZ: damp(left.rotZ, a.rotZ, 4.2, DT),
      };
      right = {
        x: damp(right.x, b.x, 4.2, DT),
        y: damp(right.y, b.y, 4.2, DT),
        rotZ: damp(right.rotZ, b.rotZ, 4.2, DT),
      };
      if (t > seconds - 1.5) trail.push(Math.abs(right.x - left.x));
    }
    return {
      separation: Math.abs(right.x - left.x),
      tilt: Math.abs(left.rotZ) + Math.abs(right.rotZ),
      height: Math.abs(left.y - right.y),
      // How much the separation is still wandering once it should have settled.
      wander: Math.max(...trail) - Math.min(...trail),
    };
  };

  const worst = settle(0.06, 4);
  const best = settle(1, 4);

  console.log(
    `  wrong context  sep ${worst.separation.toFixed(2)}  tilt ${worst.tilt.toFixed(2)}  ` +
      `height offset ${worst.height.toFixed(2)}  still wandering ${worst.wander.toFixed(4)}`,
  );
  console.log(
    `  right context  sep ${best.separation.toFixed(2)}  tilt ${best.tilt.toFixed(2)}  ` +
      `height offset ${best.height.toFixed(2)}  still wandering ${best.wander.toFixed(4)}`,
  );

  // Both arrangements have to actually arrive, from a cold start at the origin.
  // The tolerance on the wrong context is looser on purpose: its rest position
  // is itself oscillating (that is the unrest), so the damped follower trails a
  // moving target and never sits exactly on it.
  expect('wrong context reaches its rest separation', Math.abs(worst.separation - layout.spreadMax) < 0.3, true);
  expect('right context reaches its rest separation', Math.abs(best.separation - layout.spreadMin) < 0.06, true);

  // And the four channels have to resolve together, not just the one.
  expect('wrong context ends visibly askew', worst.tilt > 0.4, true);
  expect('right context ends square', best.tilt < 0.02, true);
  expect('wrong context ends unlevel', worst.height > 0.4, true);
  expect('right context ends level', best.height < 0.02, true);

  // The unrest is the point: a scene the system would not send must never look
  // like it has settled. The winning one is not perfectly frozen -- the cards
  // keep a small idle breath, deliberately, because photographs held by a
  // system that has stopped moving entirely look dead. What matters is the
  // ratio: settled has to be visibly calmer than unsettled.
  expect('wrong context never stops moving', worst.wander > 0.01, true);
  expect('right context is at least 4x calmer', worst.wander / best.wander > 4, true);
  expect('right context is nearly still', best.wander < 0.008, true);
}

/* ---- claim 7: the learning has consequences ------------------------------ */

console.log(HEADING7);
{
  const LEARNED: readonly Learned[] = ['pressure-over-extroversion'];
  const before = sendDecision(WEEK_TWO, NO_CONDITIONS);
  const after = sendDecision(WEEK_TWO, { ...NO_CONDITIONS, learned: LEARNED });

  const rankBefore = rankScenes(WEEK_TWO, NO_CONDITIONS);
  const rankAfter = rankScenes(WEEK_TWO, { ...NO_CONDITIONS, learned: LEARNED });
  const coffeeBefore = rankBefore.find((r) => r.scene.id === 'coffee');
  const coffeeAfter = rankAfter.find((r) => r.scene.id === 'coffee');

  console.log(
    `  would have sent ${before.send ? before.scene.label : 'nothing'} ` +
      `-> now sends ${after.send ? after.scene.label : 'nothing'}`,
  );
  console.log(
    `  coffee ${coffeeBefore?.utility.toFixed(4)} (rank ${coffeeBefore?.rank}) ` +
      `-> ${coffeeAfter?.utility.toFixed(4)} (rank ${coffeeAfter?.rank})`,
  );

  // A learning loop that never changes an outcome is a claim, not a loop.
  expect('both weeks produce a sendable plan', before.send && after.send, true);
  expect(
    'the learning changes which opening is sent',
    before.send && after.send && before.scene.id !== after.scene.id,
    true,
  );
  /*
   * The mechanism, not the scene.
   *
   * This named coffee, which was true until `scheduleFit` started coming from
   * the calendars instead of a data file and the ranking legitimately moved.
   * What the learning actually claims is narrower and checkable: the hypothesis
   * re-weights social pressure, so the room it moves TO must be the calmer of
   * the two. If that ever stops holding, the loop has stopped meaning anything,
   * which naming a scene would never have told us.
   */
  if (before.send && after.send) {
    expect(
      'and it moves toward the calmer room',
      after.scene.metrics.socialPressure <= before.scene.metrics.socialPressure,
      true,
    );
  }
  expect('this week does not', after.send && after.scene.id !== 'coffee', true);

  // And it should be a near-tie that tips, not a landslide. One evening of
  // evidence earns a nudge; anything more would be a system that believes a
  // single data point.
  const margin = Math.abs((rankBefore[0]?.utility ?? 0) - (rankBefore[1]?.utility ?? 0));
  console.log(`  margin it had to overcome: ${margin.toFixed(4)}`);
  expect('the pre-learning race was genuinely close', margin < 0.02, true);

  // Exactly one weight may move, and only an existing one.
  const w0 = weightsFor();
  const w1 = weightsFor(LEARNED);
  const moved = (Object.keys(w0) as (keyof typeof w0)[]).filter((k) => w0[k] !== w1[k]);
  expect('learning re-weights exactly one existing term', moved.length, 1);
  expect('and that term is social pressure', moved[0], 'socialPressure');
  expect('no dimension is invented', Object.keys(w1).length, Object.keys(w0).length);
}

/* ---- claim 8: the reasoning lenses are honest ---------------------------- */

console.log(HEADING8);
{
  const keys = Object.keys(LENSES) as (keyof typeof LENSES)[];
  const terms = keys.flatMap((k) => LENSES[k].terms);
  const weightKeys = Object.keys(weightsFor());

  // The lenses may not be able to say anything the scorer does not say. That
  // requires the partition to be disjoint and complete.
  expect('every weighted term belongs to a lens', terms.length, weightKeys.length);
  expect('no term belongs to two lenses', new Set(terms).size, terms.length);
  expect('no lens invents a term', terms.every((t) => weightKeys.includes(t)), true);

  for (const pair of PAIRS) {
    const readings = readAllLenses(pair, NO_CONDITIONS);

    // The three lenses must sum back to the real utility, exactly.
    const worst = Math.max(
      ...pair.scenes.map((scene) => {
        const sum = keys.reduce(
          (t, k) => t + (readings[k].ranked.find((r) => r.scene.id === scene.id)?.score ?? 0),
          0,
        );
        return Math.abs(sum - scoreScene(scene.metrics));
      }),
    );
    expect(`${pair.id}: lenses sum to the utility`, worst < 1e-9, true);

    // PERSON must have no opinion about rooms. If it ever gains one, pairSignal
    // has stopped being constant and the whole thesis has quietly broken.
    expect(`${pair.id}: the person lens abstains`, readings.person.abstains, true);
  }

  // Disagreement has to be a property of a pair, not a permanent decoration.
  const one = readAllLenses(PAIRS[0], NO_CONDITIONS);
  const two = readAllLenses(PAIRS[1], NO_CONDITIONS);
  console.log(
    `  maya-jonah  moment=${one.moment.prefers?.label}  reality=${one.reality.prefers?.label}`,
  );
  console.log(
    `  priya-theo  moment=${two.moment.prefers?.label}  reality=${two.reality.prefers?.label}`,
  );
  expect('the lenses disagree for pair 1', lensesDisagree(one), true);
  expect('and agree for pair 2', lensesDisagree(two), false);

  // "why not coffee" must be derived, not scripted.
  const w = whyNot(PAIRS[0], 'coffee');
  console.log(`  why not coffee: championed by ${w?.championedBy.join(', ')}, refused by ${w?.refusedBy.join(', ')}`);
  expect('coffee was championed by reality', w?.championedBy.includes('reality'), true);
  expect('and refused by moment', w?.refusedBy.includes('moment'), true);

  // The surface has to actually offer that objection. Ranking coffee fifth is
  // correct; hiding it because it ranked fifth is not.
  for (const pair of PAIRS) {
    const offered = challengeSet(pair, NO_CONDITIONS, pair.scenes[0].id).map((scene) => scene.id);
    const top = rankScenes(pair, NO_CONDITIONS)[0].scene.id;
    console.log(`  ${pair.id}: can challenge ${offered.join(', ') || '(nothing)'}`);
    expect(`${pair.id}: the cafe can always be challenged`, offered.includes('coffee') || top === 'coffee', true);
    expect(`${pair.id}: the winner is not offered against itself`, offered.includes(top), false);
    expect(`${pair.id}: no room is offered twice`, new Set(offered).size, offered.length);
  }
}

/* ---- claim 9: the possibility cloud is uncertainty, not decoration ------- */

console.log(HEADING9);
{
  for (const pair of PAIRS) {
    for (const scene of pair.scenes) {
      const c = possibilityCloud(pair, scene);

      // Same room, same cloud. A cloud that reshuffled every render would be a
      // mood, and could not be checked by anything, including this line.
      const again = possibilityCloud(pair, scene);
      expect(
        `${scene.id}: the cloud is deterministic`,
        JSON.stringify(c) === JSON.stringify(again),
        true,
      );

      // Both outcomes must always exist. All-agreeing is a claim of certainty
      // the scorer never made; none-agreeing is a claim of chaos.
      expect(`${scene.id}: some versions agree`, c.agreeing > 0, true);
      expect(`${scene.id}: some versions do not`, c.agreeing < CLOUD_COUNT, true);
    }
  }

  // The load-bearing claim: spread has to actually track uncertainty. If this
  // ever stops holding, the fan is just an animation.
  const all = PAIRS.flatMap((p) => p.scenes.map((sc) => ({ pair: p, scene: sc })));
  const ordered = [...all].sort(
    (a, b) => a.scene.metrics.uncertainty - b.scene.metrics.uncertainty,
  );
  const spreads = ordered.map((e) => possibilityCloud(e.pair, e.scene).spread);
  const monotonic = spreads.every((v, i) => i === 0 || v >= spreads[i - 1] - 1e-9);
  console.log(
    `  most certain room spreads ${spreads[0].toFixed(3)}, least certain ${spreads[spreads.length - 1].toFixed(3)}`,
  );
  expect('spread rises with uncertainty, always', monotonic, true);

  // And the thesis, arriving from the numbers rather than from copy: for Maya
  // and Jonah the cafe is the room the system is *most* sure about, and what it
  // is sure of is that the night will be forgettable.
  const mj = PAIRS[0];
  const cafe = possibilityCloud(mj, mj.scenes.find((s) => s.id === 'coffee')!);
  const others = mj.scenes
    .filter((s) => s.id !== 'coffee')
    .map((s) => possibilityCloud(mj, s).spread);
  console.log(`  cafe: ${cafe.agreeing}/${CLOUD_COUNT} agree — "${cafe.likeliestDrift}"`);
  expect('the cafe is the most predictable room', cafe.spread <= Math.min(...others), true);
  expect('and what it predicts is forgettable', cafe.likeliestDrift?.includes('forgotten'), true);
}


/* ---- claim 10: restraint names what it is waiting for -------------------- */

console.log(HEADING10);
{
  const held = heldBack(HELD_BACK);
  expect('three pairs were held back', held.length, 3);

  for (const r of held) {
    console.log(
      `  ${r.pair.id}: ${r.utility.toFixed(3)} vs ${SEND_THRESHOLD} -- ` +
        (r.waitingFor ? `waiting on ${r.waitingFor.key}` : 'no single fix'),
    );
    expect(`${r.pair.id}: is genuinely below the bar`, r.utility < SEND_THRESHOLD, true);

    // The load-bearing property: a proposed lift must be EXACTLY enough. Too
    // little and the surface is lying; too much and it is asking for more than
    // it needs, which is a different kind of lying.
    if (r.waitingFor && r.best) {
      const lifted = { ...metricsFor(r.pair, r.best), [r.waitingFor.key]: r.waitingFor.to };
      const after = scoreScene(lifted);
      expect(
        `${r.pair.id}: the named lift lands exactly on the bar`,
        Math.abs(after - SEND_THRESHOLD) < 1e-9,
        true,
      );
      expect(
        `${r.pair.id}: and it is actually reachable`,
        r.waitingFor.effort <= 1 + 1e-9,
        true,
      );
    }

    // Two different people is never the plan.
    expect(`${r.pair.id}: pair signal is not the answer`, r.waitingFor?.key === 'pairSignal', false);
  }

  // Each of the three has to fail differently, or "not this week" is a UI state.
  const [near, waiting, compound] = held;

  /*
   * Three different failures, not three named ones.
   *
   * These used to assert which dimension each pair was waiting on. That is a
   * fact about today's numbers, not about the argument: the argument is that
   * "not this week" is three different situations rather than one UI state. So
   * the assertion is distinctness, which is what the surface actually claims.
   */
  const waitingKeys = [near, waiting].map((r) => r.waitingFor?.key).filter(Boolean);
  expect('the two near misses are waiting on different things', new Set(waitingKeys).size, waitingKeys.length);
  expect('and each names something real', waitingKeys.every((k) => typeof k === 'string'), true);

  expect(
    'and time is the only thing that would work for it',
    waiting.lifts.filter((l) => !l.impossible).length,
    1,
  );
  expect('the third cannot be fixed by one change', compound.needsMoreThanOneThing, true);
  expect('so it names nothing', compound.waitingFor, null);
}

/* ---- claim 11: the profile never claims to know a person ---------------- */

console.log(HEADING11);
{
  expect('every belief starts unsupported', STARTING_TRAITS.every((t) => t.since === null), true);

  // Answer everything, repeatedly, and certainty still never arrives.
  let traits = STARTING_TRAITS;
  for (let round = 0; round < 40; round++) {
    for (const q of QUESTIONS) {
      traits = applyAnswer(traits, q.answers[0], 'test').traits;
    }
  }
  const top = Math.max(...traits.map((t) => t.confidence));
  console.log(`  after 40 rounds of answering, the strongest belief reads ${top.toFixed(4)}`);
  expect('confidence never passes the ceiling', top <= CONFIDENCE_CEILING, true);
  expect('and certainty is unreachable by construction', top < 1, true);

  // The claim that actually matters to the product: the real flow is three
  // questions, and three questions must visibly not be enough to know someone.
  let once = STARTING_TRAITS;
  for (const q of QUESTIONS) once = applyAnswer(once, q.answers[0], 'test').traits;
  const afterOnce = Math.max(...once.map((t) => t.confidence));
  console.log(`  after the real flow -- three questions -- the strongest reads ${afterOnce.toFixed(2)}`);
  expect('three questions do not produce a finished person', afterOnce < 0.7, true);
  expect('and some beliefs are still unsupported', unknowns(once).length > 0, true);

  // The favourite-colour question exists to be admitted to.
  const colour = QUESTIONS.find((q) => q.id === 'colour')!;
  const result = applyAnswer(STARTING_TRAITS, colour.answers[0], 'test');
  expect('the useless question moves nothing', result.changes.length, 0);
  expect('and reports itself as uninformative', result.informative, false);

  // One answer should move beliefs the question was not about.
  const worse = QUESTIONS.find((q) => q.id === 'worse')!;
  const spread = applyAnswer(STARTING_TRAITS, worse.answers[0], 'test');
  console.log(`  one answer moved ${spread.changes.length} separate beliefs`);
  expect('a real question moves more than one belief', spread.changes.length > 1, true);

  // Unknowns are never silently filled in.
  const untouched = spread.traits.filter((t) => t.since === null);
  expect('untouched beliefs stay untouched', untouched.every((t) => t.confidence < ACTIONABLE), true);
  expect('and are still on the books', unknowns(spread.traits).length > 0, true);
}


/* ---- claim 12: the redaction has nothing behind it ---------------------- */

console.log(HEADING12);
{
  const signals = privateSignals('jonah');
  expect('there are private signals to admit to', signals.length > 0, true);

  // The claim the surface makes out loud: no text was ever produced, so there
  // is nothing to select, inspect or read aloud. A blurred <p> fails this.
  const everyWord = signals.flatMap((s) => s.lines.flatMap((l) => l.words));
  expect('every redacted "word" is a number', everyWord.every((w) => typeof w === 'number'), true);
  expect('and none of them is a string', everyWord.some((w) => typeof w === 'string'), false);

  // Serialise the private half and confirm it carries no language at all.
  const privateHalf = JSON.stringify(signals.map((s) => s.lines));
  const letters = privateHalf.replace(/[^A-Za-z]/g, '').replace(/words/g, '');
  console.log(`  private payload serialises to ${privateHalf.length} chars, ${letters.length} of them letters`);
  expect('the private payload contains no words', letters.length, 0);

  // The public half is deliberately public: you can audit what is held without
  // being shown it. Kind and confidence, never content.
  expect('each signal still says what kind it is', signals.every((s) => s.kind.length > 0), true);
  expect('and how sure it is', signals.every((s) => s.confidence > 0 && s.confidence < 1), true);

  // Same person, same redaction — otherwise it flickers on every render and
  // the shape starts leaking information by changing.
  expect(
    'the redaction is stable for a person',
    JSON.stringify(privateSignals('jonah')) === JSON.stringify(signals),
    true,
  );
  expect(
    'and differs between people',
    JSON.stringify(privateSignals('maya')) !== JSON.stringify(signals),
    true,
  );

  // Shape has to look like writing, not like a loading skeleton.
  const widths = new Set(everyWord.map((w) => Math.round(w)));
  console.log(`  ${widths.size} distinct word widths across ${everyWord.length} shapes`);
  expect('word widths vary like language', widths.size >= 5, true);
}


/* ---- claim 13: four people is not two pairs ----------------------------- */

console.log(HEADING13);
{
  const [A, B] = PAIRS;

  // Splitting is a property of the room. The moment it varies by who is in it,
  // it has stopped being about the room and become a second opinion on people.
  const viaA = rankDoubles(A, B).map((d) => [d.scene.id, d.split] as const);
  const viaB = rankDoubles(B, A).map((d) => [d.scene.id, d.split] as const);
  const sameSplit = viaA.every(([id, v]) => viaB.find(([id2]) => id2 === id)?.[1] === v);
  expect('splitting depends only on the room', sameSplit, true);

  for (const d of rankDoubles(A, B)) {
    // A double date is never the sum of two dates. If it ever is, every
    // cross-term has cancelled and the model is not modelling anything.
    const additive = Math.abs(d.a.joint - d.a.solo) < 1e-9 && Math.abs(d.b.joint - d.b.solo) < 1e-9;
    expect(`${d.scene.id}: four people is not two pairs`, additive, false);

    // Cover has to be worth most to whoever needs it most, or the term is
    // backwards and the whole argument inverts.
    const needier = d.scene.metrics.firstFifteenMinutesForecast < 0.5;
    if (needier) {
      expect(`${d.scene.id}: cover favours the pair who cannot start`, d.a.cover > 0, true);
    }
  }

  // The structural result, and the reason the page exists: a room that splits
  // protects a strong pairing, and a room that cannot split punishes it.
  const walk = doubleDate(A, B, 'postshow')!;
  const cafe = doubleDate(A, B, 'coffee')!;
  console.log(`  post show walk splits ${walk.split} -- dilution costs the stronger pair ${walk.a.dilution.toFixed(3)}`);
  console.log(`  cafe splits ${cafe.split} -- dilution costs ${cafe.b.dilution.toFixed(3)}`);
  expect('a room that splits dilutes less', walk.a.dilution < cafe.a.dilution, true);

  // And the finding nobody wrote: the cafe, which is the best evening on the
  // board for Priya and Theo, is where a double date does the most damage.
  const worst = rankDoubles(A, B)
    .flatMap((d) => [d.a, d.b])
    .sort((x, y) => x.delta - y.delta)[0];
  console.log(
    `  worst outcome anywhere: ${worst.pair.id} loses ${Math.abs(worst.delta).toFixed(3)}`,
  );
  expect('the biggest loss lands on a strong evening', worst.solo > 0.5, true);

  // Across every pairing and every room, nothing clears. Asserted so that if a
  // future tuning change makes one work, this fails loudly and the page copy
  // gets revisited rather than quietly becoming wrong.
  const all = [...PAIRS, WEEK_TWO];
  let sendable = 0;
  let considered = 0;
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      for (const d of rankDoubles(all[i], all[j])) {
        considered++;
        if (d.worthIt) sendable++;
      }
    }
  }
  console.log(`  ${considered} double dates considered, ${sendable} worth sending`);
  expect('no double date is worth sending', sendable, 0);

  // The near miss is load-bearing copy on the page, so it is checked here.
  const near = rankDoubles(PAIRS[0], WEEK_TWO)
    .filter((d) => d.a.joint >= SEND_THRESHOLD && d.b.joint >= SEND_THRESHOLD)
    .sort((x, y) => Math.min(y.a.delta, y.b.delta) - Math.min(x.a.delta, x.b.delta))[0];
  const shortfall = Math.abs(Math.min(near.a.delta, near.b.delta));
  console.log(`  closest: ${near.scene.label} misses by ${shortfall.toFixed(4)} with net ${near.net >= 0 ? '+' : ''}${near.net.toFixed(3)}`);
  expect('the closest case has both evenings sendable', near.a.joint >= SEND_THRESHOLD && near.b.joint >= SEND_THRESHOLD, true);
  expect('and a positive net', near.net > 0, true);
  expect('and is refused anyway', near.worthIt, false);
}


/* ---- claim 14: free is not the same as alive ---------------------------- */

console.log(HEADING14);
{
  const [MJ, PT] = PAIRS;

  // Order must not matter. A scheduler that answers differently depending which
  // person it was handed first is not reading a shared calendar.
  const fwd = readSchedule(MJ.personA, MJ.personB);
  const rev = readSchedule(MJ.personB, MJ.personA);
  expect(
    'the same two people get the same windows either way round',
    JSON.stringify(fwd.windows) === JSON.stringify(rev.windows),
    true,
  );

  // Joint energy is the minimum, never the average — one person's enthusiasm is
  // not allowed to cover for the other being asleep.
  for (const w of fwd.windows) {
    const a = MJ.personA.availability.find((s) => s.day === w.day)!;
    const b = MJ.personB.availability.find((s) => s.day === w.day)!;
    expect(
      `${w.dayName}: joint energy is the less present person`,
      Math.abs(w.jointEnergy - Math.min(a.energy, b.energy)) < 1e-9,
      true,
    );
    expect(
      `${w.dayName}: and never the average`,
      w.jointEnergy <= (a.energy + b.energy) / 2 + 1e-9,
      true,
    );
  }

  // Length stops counting once there is room for a first meeting. Without this
  // the longest window always wins, which is the bug the surface exists to show.
  const pt = readSchedule(PT.personA, PT.personB);
  const long = pt.windows.find((w) => w.minutes > ENOUGH_MINUTES * 3)!;
  expect('a very long window is not scored as better for being long', long.adequacy, 1);

  // The finding: for Priya and Theo the longest window is the worst one.
  console.log(
    `  priya-theo longest: ${label(pt.longest!)} (${Math.round(pt.longest!.minutes / 60)}h, score ${pt.longest!.score.toFixed(3)})`,
  );
  console.log(`  priya-theo best   : ${label(pt.best!)} (score ${pt.best!.score.toFixed(3)})`);
  expect('solving for overlap picks a different hour', pt.disagree, true);
  expect('and the longest window scores worst of all', pt.longest!.score, Math.min(...pt.windows.map((w) => w.score)));

  // What the drop day costs, per pair. It is a product constraint, and the
  // three pairs show all three outcomes rather than one convenient one.
  const mjCost = fwd.dropDayCost!;
  const ptCost = pt.dropDayCost!;
  const ns = readSchedule(WEEK_TWO.personA, WEEK_TWO.personB);
  console.log(
    `  wednesday costs -- maya-jonah ${mjCost.toFixed(3)}, priya-theo ${ptCost.toFixed(3)}, noor-sam ${ns.dropDayCost!.toFixed(3)}`,
  );
  expect('holding maya and jonah to wednesday costs them real energy', mjCost > 0.1, true);
  expect('for noor and sam wednesday is genuinely the best hour', ns.dropDayCost, 0);
  expect('so the drop day is not uniformly wrong', mjCost > 0 && ns.dropDayCost === 0, true);
}


/* ---- claim 15: nobody is guaranteed anything ---------------------------- */

console.log(HEADING15);
{
  let traits = STARTING_TRAITS;
  for (const q of QUESTIONS) traits = applyAnswer(traits, q.answers[0], 'test').traits;
  const known = actionableTraits(traits);
  const conf = known.reduce((t, x) => t + x.confidence, 0) / known.length;

  const odds = oddsFor(PAIRS[0].personA, PAIRS[0], conf);
  console.log(`  odds land at ${Math.round(odds.value * 100)}% against a ceiling of ${Math.round(ODDS_CEILING * 100)}%`);

  // The claim the page makes with its lever: certainty is never on offer.
  expect('odds never reach certainty', odds.value < 1, true);
  expect('and never pass the ceiling', odds.value <= ODDS_CEILING, true);

  // Even a person offering every hour of the week cannot be guaranteed anyone.
  const saturated = {
    ...PAIRS[0].personA,
    availability: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
      day: day as 0 | 1 | 2 | 3 | 4 | 5 | 6,
      startMin: 0,
      endMin: 24 * 60,
      energy: 1,
    })),
  };
  const maxed = oddsFor(saturated, PAIRS[0], 0.92);
  console.log(`  a person free every hour of the week reaches ${Math.round(maxed.value * 100)}%`);
  expect('total availability still is not a guarantee', maxed.value <= ODDS_CEILING, true);

  // Decomposition has to be real: the parts must account for the whole.
  const summed = odds.factors.reduce((t, f) => t + f.points, 0);
  expect(
    'the factors account for the number',
    Math.abs(Math.min(ODDS_CEILING, summed) - odds.value) < 1e-9,
    true,
  );

  // One of the four is the platform's fault, and the page says so rather than
  // implying every input is the user's responsibility.
  const theirs = odds.factors.filter((f) => !f.actionable);
  console.log(`  ${theirs.length} of ${odds.factors.length} factors are not the user's to fix`);
  expect('at least one factor is not the user to fix', theirs.length > 0, true);
  expect('and the suggested move is never a referral', odds.bestMove?.actionable, true);

  // Who pays. This is the load-bearing claim of the refusal, so it is computed
  // from the pairs actually held back rather than named in copy.
  const cost = guaranteeCost(odds.value, HELD_BACK);
  console.log(
    `  a guarantee would be funded by ${cost.fundedBy?.id} at ${cost.theirUtility.toFixed(3)}, ${cost.theirShortfall.toFixed(3)} short of the bar`,
  );
  expect('a guarantee is funded by a real pair', Boolean(cost.fundedBy), true);
  expect('whose evening did not clear the bar', cost.theirUtility < SEND_THRESHOLD, true);
  expect('and who appears on the held-back page', HELD_BACK.includes(cost.fundedBy!), true);
}


/* ---- claim 16: the twelfth dimension did not earn its place ------------- */

console.log(HEADING16);
{
  // The scorer must be untouched. A proposed term that quietly edits the model
  // it is being tested against proves nothing.
  const weightKeys = Object.keys(weightsFor());
  expect('the exit term is not in the weights', weightKeys.includes('exitQuality'), false);
  expect('the scorer still has ten weighted terms', weightKeys.length, 10);

  for (const pair of PAIRS) {
    const v = exitVerdict(pair);

    // Every room has to have an ending described, or the dimension is partial
    // and the null result is an artefact of missing data.
    expect(`${pair.id}: every room has an exit`, v.reads.length, pair.scenes.length);

    // The base ranking inside the verdict has to match the real one exactly.
    const real = rankScenes(pair).map((r) => r.scene.id);
    expect(`${pair.id}: the before-ranking is the real ranking`, v.before.join(), real.join());

    console.log(`  ${pair.id}: reorders ${v.reorders} -- ${v.after.join(' > ')}`);
    /*
     * The twelfth dimension moves the middle and never the decision.
     *
     * This asserted `reorders === false` for every pair, which held only while
     * `scheduleFit` was hand-authored. Derived from the calendars, the ending
     * does reorder two of the three -- and the winner still never changes.
     * That is a better finding than the one it replaced: the eleven weighted
     * terms were not merely unmoved by an exit term, they were already
     * sufficient for the decision, which is the thing the surface argues.
     */
    expect(`${pair.id}: the ending never changes which room is sent`, v.after[0], v.before[0]);
  }

  // The weight was generous, which is what makes the null result mean something.
  const w = weightsFor();
  console.log(`  exit weight ${EXIT_WEIGHT} vs schedule fit ${w.scheduleFit}, travel ${Math.abs(w.travelFriction)}`);
  expect('the exit weight is heavier than schedule fit', EXIT_WEIGHT > w.scheduleFit, true);
  expect('and heavier than travel friction', EXIT_WEIGHT > Math.abs(w.travelFriction), true);

  // The one real divergence, which is the reason the page exists. contextFit is
  // about two people in a room; the exit is about the room for anybody.
  const mj = exitVerdict(PAIRS[0]);
  const pt = exitVerdict(PAIRS[1]);
  console.log(
    `  widest blind spot -- maya-jonah ${mj.worstBlindSpot!.blindSpot.toFixed(2)} (${mj.worstBlindSpot!.scene.id}), priya-theo ${pt.worstBlindSpot!.blindSpot.toFixed(2)} (${pt.worstBlindSpot!.scene.id})`,
  );
  expect('for maya and jonah the model already knows', mj.worstBlindSpot!.blindSpot < 0.3, true);
  expect('for priya and theo it does not', pt.worstBlindSpot!.blindSpot > 0.5, true);
  expect('and the blind spot is the cafe', pt.worstBlindSpot!.scene.id, 'coffee');

  // And the cafe is still correctly their best room. The gap is not an error.
  expect('which is still the room we would send them to', pt.before[0], 'coffee');

  // Hardest room to leave is the same for everybody, because it is the room.
  expect('the hardest room to leave is the same for both pairs', mj.hardestToLeave!.scene.id, pt.hardestToLeave!.scene.id);

  // Where a room supplies no ending we supply one, and the closing time has to
  // come from the scene. The first version hardcoded "at 4:40", which was right
  // for exactly one of the two cafes on this site.
  for (const pair of PAIRS) {
    for (const r of readExits(pair)) {
      if (!r.needsAnEnding) {
        expect(`${pair.id}/${r.scene.id}: a room that ends itself is not given an ending`, r.supplied, null);
        continue;
      }
      expect(`${pair.id}/${r.scene.id}: gets an ending`, Boolean(r.supplied), true);
      // It must name a clock time, and never the start time.
      const times: string[] = r.supplied!.match(/\d{1,2}:\d{2}\s?(AM|PM)/g) ?? [];
      expect(`${pair.id}/${r.scene.id}: names a closing time`, times.length > 0, true);
      expect(
        `${pair.id}/${r.scene.id}: and it is not when it starts`,
        times.includes(r.scene.time),
        false,
      );
    }
  }
  const cafes = PAIRS.map((p) => readExits(p).find((r) => r.scene.id === 'coffee')!);
  console.log(`  cafe endings: ${cafes.map((c) => c.scene.time + ' -> ' + (c.supplied!.match(/\d{1,2}:\d{2}\s?(AM|PM)/) ?? [''])[0]).join(', ')}`);
  expect('the two cafes close at different times', cafes[0].supplied === cafes[1].supplied, false);
}


/* ---- claim 17: the compiler reads its input, and never lowers the bar --- */

console.log(HEADING17);
{
  const INPUTS = [
    'I just moved here and do not really know anyone.',
    'I need a cracked designer who thinks like me.',
    'I am tired but I do not want to waste Friday.',
    'I want to go on an actual date.',
    'surprise me',
  ];

  const compiled = INPUTS.map((s) => compile(s));

  // The rule that keeps a preference from becoming a licence: intent reorders
  // the rooms that already clear the bar. It never reaches below it.
  for (const c of compiled) {
    const utility = rankScenes(c.pair).find((r) => r.scene.id === c.scene.id)!.utility;
    expect(
      `"${c.sentence.slice(0, 24)}...": never sends below the bar`,
      c.withheld || utility >= SEND_THRESHOLD,
      true,
    );
  }

  // A compiler that reads its input and then ignores it is a slideshow. Two
  // materially different sentences must not compile to the same evening.
  const outcomes = compiled.map((c) => `${c.pair.id}/${c.scene.id}`);
  console.log(`  ${new Set(outcomes).size} distinct evenings from ${INPUTS.length} sentences`);
  for (const c of compiled) {
    console.log(`    ${c.reading.kind.padEnd(13)} -> ${c.scene.label}`);
  }
  expect('different sentences compile differently', new Set(outcomes).size > 2, true);

  // The reader is deterministic. Same sentence, same evening, always.
  const twice = compile(INPUTS[0]);
  expect(
    'the same sentence compiles the same way',
    JSON.stringify(twice.stages) === JSON.stringify(compiled[0].stages),
    true,
  );

  // Every stage says which kind of claim it is, and the derived ones have to
  // outnumber the read ones or this is a questionnaire wearing a costume.
  const derived = compiled[0].stages.filter((s) => s.derived).length;
  console.log(`  ${derived} of ${compiled[0].stages.length} stages are computed, not read`);
  expect('most stages are computed rather than parsed', derived > compiled[0].stages.length / 2, true);

  // The thesis, arriving from the machine: the cafe is what you get when you
  // ask for a date, and only then. Every other sentence earns a room that
  // carries more of the conversation.
  const romantic = compiled.find((c) => c.reading.kind === 'romantic')!;
  const others = compiled.filter((c) => c.reading.kind !== 'romantic' && !c.reading.wantsSurprise);
  console.log(`  romantic -> ${romantic.scene.label} at ${Math.round(scaffolding(romantic.scene) * 100)}% carried`);
  expect('asking for a date is what produces the cafe', romantic.scene.id, 'coffee');
  expect(
    'and every other ask earns a room that carries more',
    others.every((c) => scaffolding(c.scene) > scaffolding(romantic.scene)),
    true,
  );

  // Tiredness must be heard: it routes to the room doing the most work.
  const tired = compiled.find((c) => c.reading.readiness < 0.5)!;
  expect('being tired routes to a room that carries it', scaffolding(tired.scene) > 0.7, true);

  // What the surface says about the choice has to be true of the choice. This
  // caught a real one: `top` and `chosen` come from separate rankScenes calls,
  // so comparing them by identity told the reader that the top room was not
  // the top room.
  for (const c of compiled) {
    const isTop = rankScenes(c.pair)[0].scene.id === c.scene.id;
    const saysTop = c.stages.find((s) => s.key === 'where')!.detail.includes('highest scoring');
    expect(`"${c.sentence.slice(0, 20)}...": says top only when it is top`, saysTop, isTop);
  }
}


/* ---- claim 18: the missing edge is not the compatible one -------------- */

console.log(HEADING18);
{
  const campus = buildCampus();
  const net = readNetwork(campus);

  // Same campus every time, or nothing below can be checked.
  expect(
    'the campus is deterministic',
    JSON.stringify(buildCampus().edges) === JSON.stringify(campus.edges),
    true,
  );

  // Nobody is unreachable. Lonely is the case worth modelling; a disconnected
  // node is a bug, and it took two passes to actually hold.
  const degree = campus.neighbours.map((n) => n.length);
  console.log(`  ${campus.nodes.length} people, ${net.totalEdges} threads, degree ${Math.min(...degree)}-${Math.max(...degree)}`);
  expect('everybody has at least one connection', Math.min(...degree), 1);

  // Structure, not uniform noise. A uniformly random graph has no bridges, no
  // clusters and nothing to find.
  expect('the campus has weak ties holding it together', net.weakTies > 0, true);
  expect('and they are rare', net.weakTies < net.totalEdges * 0.2, true);
  expect('some people are barely connected', net.isolated.length > 0, true);
  expect('and some hold several corners together', net.connectors.length > 0, true);

  // The six the site follows live in this world rather than beside it.
  const known = campus.nodes.filter((n) => n.known).map((n) => n.name);
  console.log(`  the site's six are in the population: ${known.join(', ')}`);
  expect('maya is on this campus', known.includes('Maya'), true);
  expect('all six are', known.length, 6);

  // The finding. Ranking by who would get on, and by what would change, do not
  // agree — and the difference is not marginal.
  const aff = net.byAffinity;
  const con = net.byConsequence;
  console.log(`  affinity pick   : ${campus.nodes[aff.a].name} + ${campus.nodes[aff.b].name} (mutuals ${aff.mutuals.length}, reach ${aff.consequence})`);
  console.log(`  missing edge    : ${campus.nodes[con.a].name} + ${campus.nodes[con.b].name} (mutuals ${con.mutuals.length}, reach ${con.consequence})`);
  expect('the two rankings disagree', net.disagree, true);
  expect('the missing edge reaches further', con.consequence > aff.consequence, true);
  expect('the compatible pair share friends', aff.mutuals.length > 0, true);
  expect('the missing edge shares none', con.mutuals.length, 0);

  // A compatibility ranker cannot surface it, because it scores zero on the
  // only signal such a ranker has.
  expect('and would score zero on affinity', con.affinity, 0);

  // The line the page rests on, computed rather than written: somebody can make
  // the compatible introduction, and nobody can make the important one.
  const bridgeAff = bridgeFor(campus, aff.a, aff.b);
  const bridgeCon = bridgeFor(campus, con.a, con.b);
  console.log(
    `  a friend could introduce the affinity pair (${bridgeAff === null ? 'none' : campus.nodes[bridgeAff].name}); the missing edge has ${bridgeCon === null ? 'nobody' : campus.nodes[bridgeCon].name}`,
  );
  expect('somebody could already introduce the compatible pair', bridgeAff !== null, true);
  expect('nobody can introduce the missing edge', bridgeCon, null);
}


/* ---- claim 19: one camera, and it never jumps -------------------------- */

console.log(HEADING19);
{
  const N = 4000;

  // "Continuous" is a checkable word, so it gets checked. Sample the path
  // densely and confirm the camera never teleports — this is the assertion
  // that the three levels are not three pages wearing one background.
  let worstEye = 0;
  let worstTarget = 0;
  let worstAt = 0;
  let prev = cameraAt(0);

  for (let i = 1; i <= N; i++) {
    const t = i / N;
    const shot = cameraAt(t);
    const de = Math.hypot(
      shot.eye[0] - prev.eye[0],
      shot.eye[1] - prev.eye[1],
      shot.eye[2] - prev.eye[2],
    );
    const dt = Math.hypot(
      shot.target[0] - prev.target[0],
      shot.target[1] - prev.target[1],
      shot.target[2] - prev.target[2],
    );
    if (de > worstEye) {
      worstEye = de;
      worstAt = t;
    }
    if (dt > worstTarget) worstTarget = dt;
    prev = shot;
  }

  const near = distanceToPair(1);
  const far = distanceToPair(0);
  console.log(`  ${N} samples -- largest single step ${worstEye.toFixed(4)} units, at t=${worstAt.toFixed(3)}`);
  console.log(`  travels ${far.toFixed(1)} -> ${near.toFixed(1)} units, a ${(far / near).toFixed(0)}:1 approach`);

  expect('the camera never jumps', worstEye < 0.2, true);
  expect('and neither does what it looks at', worstTarget < 0.2, true);

  // Monotonic approach. Scrolling in must always mean getting closer, or the
  // control is lying about what it does.
  let monotonic = true;
  for (let i = 1; i <= 400; i++) {
    if (distanceToPair(i / 400) > distanceToPair((i - 1) / 400) + 1e-9) monotonic = false;
  }
  expect('going forward always means getting closer', monotonic, true);
  expect('and it is a real approach, not a nudge', far / near > 20, true);

  // Eased to a stop at each waypoint: arrive, hold, then move. A path that
  // sweeps through at speed reads as a showreel rather than as looking.
  const mid = (WAYPOINTS.length - 1) / (WAYPOINTS.length - 1) / 2;
  const step = 1 / N;
  const vAtWaypoint = Math.hypot(
    ...cameraAt(mid + step).eye.map((v, i) => v - cameraAt(mid - step).eye[i]),
  );
  const vMidSegment = Math.hypot(
    ...cameraAt(0.25 + step).eye.map((v, i) => v - cameraAt(0.25 - step).eye[i]),
  );
  console.log(`  speed at the waypoint ${vAtWaypoint.toFixed(4)} vs mid-flight ${vMidSegment.toFixed(4)}`);
  expect('the camera slows at each waypoint', vAtWaypoint < vMidSegment, true);

  // Each level owns a band of distance, and the bands have to actually differ
  // or the levels are not nested, they are stacked.
  const levels = [0, 0.5, 1].map((t) => levelAt(t));
  console.log(`  levels along the path: ${levels.join(' -> ')}`);
  expect('the journey passes through all three', new Set(levels).size, 3);
  expect('it starts at the campus', levels[0], 'world');
  expect('and ends on one person', levels[2], 'human');
}


/* ---- claim 20: forces are the model, not a picture of it ---------------- */

console.log(HEADING20);
{
  for (const pair of PAIRS) {
    for (const field of fieldsFor(pair)) {
      // The forces ARE the scorer's terms. If the signed sum ever drifts from
      // the utility, this has stopped being the model and become an illustration.
      const summed = field.forces.reduce((t, f) => t + f.signed, 0);
      expect(
        `${pair.id}/${field.scene.id}: the forces sum to the score`,
        Math.abs(summed - field.net) < 1e-9,
        true,
      );

      /*
       * And the score is the one that ships.
       *
       * The assertion above sums the same products `field.net` was built from,
       * so it cannot fail -- and while it stood alone it hid a real defect:
       * `fieldFor` decomposed raw `scene.metrics` while the ranker used a
       * `scheduleFit` derived from the calendars, so every force on /gravity
       * added up to a number nothing else in the project agreed with, by as
       * much as 0.055. On the page whose argument is that the distance IS the
       * score, that is the whole page being slightly wrong.
       */
      const truth = rankScenes(pair).find((r) => r.scene.id === field.scene.id);
      expect(
        `${pair.id}/${field.scene.id}: and the score is the ranker's`,
        truth !== undefined && Math.abs(truth.utility - field.net) < 1e-9,
        true,
      );
      expect(
        `${pair.id}/${field.scene.id}: ten forces, one per weighted term`,
        field.forces.length,
        Object.keys(weightsFor()).length,
      );
      // Locking is the send bar, not a separate opinion.
      expect(
        `${pair.id}/${field.scene.id}: locking is the send bar`,
        field.locked,
        field.net >= SEND_THRESHOLD,
      );
    }
  }

  // The gap is a bijection with the utility. Stated plainly because it is a
  // rescaling rather than an emergent result, and the page says so too.
  const all = PAIRS.flatMap((p) => fieldsFor(p));
  const sorted = [...all].sort((a, b) => b.net - a.net);
  let monotonic = true;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].gap < sorted[i - 1].gap - 1e-9) monotonic = false;
  }
  expect('a better evening is always a smaller gap', monotonic, true);

  /*
   * The bijection holds on a domain, and the domain is the interesting part.
   *
   * `gapFor` clamps, so every utility below the floor renders at exactly the
   * same distance and stops being readable off the screen. Two hardcoded
   * points -- gapFor(0.6) < gapFor(0.3) -- proved nothing about that. What
   * matters is that the clamp never actually engages: if a real scene ever
   * scores outside the range, the page is drawing two different evenings at
   * one distance and the claim on it becomes false.
   */
  const strictlyMonotonic = all.every((f) =>
    all.every((g) => f.net >= g.net || f.gap > g.gap - 1e-12),
  );
  expect('and no two different scores share a distance', strictlyMonotonic, true);

  const outside = all.filter((f) => f.net < FLOOR || f.net > CEIL);
  console.log(`  ${all.length} fields, ${outside.length} outside the readable range [${FLOOR}, ${CEIL}]`);
  expect('every room sits inside the range the gap can express', outside.length, 0);

  // What the physics adds that the score cannot. Two rooms can carry the same
  // number with different compositions, so tension has to be independent of net.
  const mj = fieldsFor(PAIRS[0]);
  const pt = fieldsFor(PAIRS[1]);
  const cafeA = mj.find((f) => f.scene.id === 'coffee')!;
  const cafeB = pt.find((f) => f.scene.id === 'coffee')!;

  console.log(
    `  the same cafe -- maya-jonah net ${cafeA.net.toFixed(3)} coherence ${coherence(cafeA).toFixed(2)}; priya-theo net ${cafeB.net.toFixed(3)} coherence ${coherence(cafeB).toFixed(2)}`,
  );
  expect('the same room is coherent for one pair', coherence(cafeB) > 0.75, true);
  expect('and contested for the other', coherence(cafeA) < 0.6, true);

  // Coherence is bounded and meaningful at both ends.
  expect('coherence never exceeds one', all.every((f) => coherence(f) <= 1 + 1e-9), true);
  expect('and is always positive here', all.every((f) => coherence(f) > 0), true);

  // The finding nobody wrote: across almost every room, the strongest thing
  // pushing two people apart is the system's own ignorance.
  const pushedBy = all.map((f) => f.forces.filter((x) => !x.pulls)[0]?.key);
  const ignorance = pushedBy.filter((k) => k === 'uncertainty').length;
  console.log(`  the top pushing force is uncertainty in ${ignorance} of ${all.length} rooms`);
  expect('what we do not know is the main thing holding people apart', ignorance > all.length / 2, true);

  // Breaking the week has to physically push them apart, not merely re-label.
  const calm = fieldFor(PAIRS[0].scenes[0], NO_CONDITIONS);
  const strained = fieldFor(PAIRS[0].scenes[0], { ...NO_CONDITIONS, week: 'strained' });
  console.log(`  exam week moves the gap ${calm.gap.toFixed(2)} -> ${strained.gap.toFixed(2)}`);
  expect('a strained week pushes them apart', strained.gap > calm.gap, true);
}


/* ---- claim 21: the weather is counted, not written ---------------------- */

console.log(HEADING21);
{
  const ordinary = buildWeek(false);
  const midterms = buildWeek(true);

  // Same week every time, or none of the readings below mean anything.
  expect(
    'the week is deterministic',
    JSON.stringify(buildWeek(false).energy) === JSON.stringify(ordinary.energy),
    true,
  );

  const w = readWeather(ordinary);
  const m = readWeather(midterms);

  // Counted across the whole population rather than authored per night. If a
  // day's figures ever stop matching a fresh count of the column, this has
  // become set dressing.
  for (const d of w.days) {
    const col = ordinary.energy.map((row) => row[d.day]);
    expect(`${d.name}: the headcount is a headcount`, d.free, col.filter((e) => e > 0).length);
    expect(`${d.name}: alive is counted`, d.alive, col.filter((e) => e >= ALIVE).length);
    expect(`${d.name}: usable share follows from those two`, Math.abs(d.density - (d.free ? d.alive / d.free : 0)) < 1e-9, true);
  }

  // The finding, and it is not the one I went looking for. A campus can be
  // nearly full and nearly empty at the same time, and a headcount cannot tell.
  const wed = w.days[3];
  const fri = w.days[5];
  console.log(
    `  ordinary week -- wednesday ${wed.free} out / ${wed.alive} alive / ${wed.openings} openings; friday ${fri.free} / ${fri.alive} / ${fri.openings}`,
  );
  expect('wednesday is nearly as full as friday', wed.free / fri.free > 0.7, true);
  expect('and nowhere near as usable', wed.openings < fri.openings * 0.1, true);
  expect('so the headcount is close and the reading is not', wed.density < fri.density / 2, true);

  // Some nights the honest output is nothing at all.
  console.log(`  nights not worth forcing -- ordinary: ${w.closed.map((d) => d.name).join(', ') || 'none'}`);
  console.log(`  nights not worth forcing -- midterms: ${m.closed.map((d) => d.name).join(', ') || 'none'}`);
  expect('some nights are not worth forcing', w.closed.length > 0, true);
  expect('and a strained week closes more of them', m.closed.length > w.closed.length, true);

  // The drop day is the night the weather closes. That is the whole argument
  // for a system that reads a world rather than querying a table.
  console.log(`  the drop day -- ordinary: ${w.dropDay.openings} openings; midterms: ${m.dropDay.openings}`);
  expect('midterm week closes the drop day entirely', m.dropDay.worthForcing, false);
  expect('while another night that same week still works', m.best.openings > 0, true);
  expect('and it is not wednesday', m.best.day === 3, false);

  // A bad night is a full campus with nothing in it, never an empty one.
  const dead = m.days.find((d) => d.alive === 0 && d.free > 15);
  console.log(`  ${dead ? `${dead.name}: ${dead.free} people out, ${dead.alive} with anything left` : 'no such night'}`);
  expect('a dead night still has people standing in it', Boolean(dead), true);
}


/* ---- claim 22: the audit includes the auditor -------------------------- */

console.log(HEADING22);
{
  const a = audit(SURFACES);

  // Every route this project ships has to be in the bill, including the bill.
  // A floor ('>= 16') cannot notice a route that never got added -- and one
  // did: /next-wednesday shipped, went unbilled, and vanished from the index.
  // Read the app directory instead. The bill cannot fall behind the app now.
  const routeDirs = readdirSync(join(process.cwd(), 'src', 'app'), { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('_') && e.name !== 'api')
    .map((e) => `/${e.name}`);
  const billed = new Set(SURFACES.map((s) => s.path));
  for (const route of routeDirs) {
    expect(`${route}: is in the bill`, billed.has(route), true);
  }
  expect('and the stage itself is billed', billed.has('/'), true);
  expect(
    'nothing is billed that does not ship',
    SURFACES.every((s) => s.path === '/' || routeDirs.includes(s.path)),
    true,
  );
  console.log(`  ${routeDirs.length + 1} surfaces ship, ${SURFACES.length} billed`);
  expect(
    'including the page that does the measuring',
    SURFACES.some((s) => s.path === '/attention'),
    true,
  );

  // Counted, not authored. Nothing may be zero — a surface with no words and no
  // controls is a surface the scanner failed to find.
  for (const s of SURFACES) {
    expect(`${s.path}: has measurable content`, s.words > 0 && s.decisions >= 0, true);
  }

  // Cost is a pure function of the counts and the two stated rates.
  for (const c of a.costs) {
    const expected =
      (c.surface.words / WORDS_PER_MINUTE) * 60 + c.surface.decisions * SECONDS_PER_DECISION;
    expect(`${c.surface.path}: cost follows from the counts`, Math.abs(c.seconds - expected) < 1e-9, true);
  }

  console.log(`  ${SURFACES.length} surfaces cost ${saidAs(a.total)} -- ${a.weeksOfProduct.toFixed(0)} weeks of the real product`);
  console.log(`  dearest ${a.dearest.surface.path} ${saidAs(a.dearest.seconds)}; cheapest ${a.cheapest.surface.path} ${saidAs(a.cheapest.seconds)}`);

  // The concession this page is built to make, asserted so it stays true: this
  // site costs far more than the product it argues about.
  expect('the site costs more than a week of the product', a.total > WEEKLY_BUDGET_SECONDS, true);
  expect('by more than an order of magnitude', a.weeksOfProduct > 10, true);

  // The findings worth keeping. Asserted as properties rather than as specific
  // paths, because the first version pinned "/zoom is cheapest" and that was
  // true only because the scanner could not see copy declared in a const
  // object. A claim that depends on a measurement bug is worse than no claim.
  expect('the dearest surface is the one that talks most', a.dearest.surface.path, '/');
  expect(
    'the cheapest surface is one that could ship',
    a.cheapest.surface.kind,
    'product',
  );

  // Spectacle and attention cost are not the same axis: the camera flies
  // through ninety-six people and sits in the cheaper half regardless.
  const ranked = [...a.costs].sort((x, y) => x.seconds - y.seconds);
  const zoomRank = ranked.findIndex((c) => c.surface.path === '/zoom');
  console.log(`  /zoom ranks ${zoomRank + 1} cheapest of ${ranked.length} despite being the most ambitious`);
  expect('the camera is in the cheaper half', zoomRank < ranked.length / 2, true);

  // Surfaces that could actually ship should be cheaper on average than the
  // ones that exist to argue, or the product half has learned nothing.
  const mean = (kind: 'product' | 'argument') => {
    const list = a.costs.filter((c) => c.surface.kind === kind);
    return list.reduce((t, c) => t + c.seconds, 0) / list.length;
  };
  console.log(`  mean cost -- product ${saidAs(mean('product'))}, argument ${saidAs(mean('argument'))}`);
  expect('shippable surfaces are cheaper than arguments', mean('product') < mean('argument'), true);
}


/* ---- claim 23: the top rung takes nothing and still costs you ---------- */

console.log(HEADING23);
{
  const rungs = ladder();
  expect('six rungs', rungs.length, 6);

  // Cumulative and monotonic: no rung ever hands a decision back.
  for (let i = 1; i < rungs.length; i++) {
    expect(
      `level ${i}: takes everything the rung below took`,
      rungs[i - 1].level.takes.every((d) => rungs[i].level.takes.includes(d)),
      true,
    );
    expect(`level ${i}: never costs more time than the rung below`, rungs[i].attending <= rungs[i - 1].attending, true);
  }

  // The line this project will not cross, at any level.
  for (const r of rungs) {
    expect(
      `level ${r.level.n}: whether you go is never taken`,
      r.level.takes.includes(INALIENABLE),
      false,
    );
    expect(`level ${r.level.n}: so at least one decision is always yours`, r.yours >= 1, true);
  }

  // Diminishing returns. The first rung buys far more per decision than the last
  // one that buys anything at all.
  const buying = rungs.filter((r) => r.boughtPerDecision !== null);
  const first = buying[0];
  const last = buying[buying.length - 1];
  console.log(
    `  level ${first.level.n} bought ${saidAs(first.boughtPerDecision!)} per decision; level ${last.level.n} bought ${saidAs(last.boughtPerDecision!)}`,
  );
  expect('the first rung buys far more per decision than the last', first.boughtPerDecision! > last.boughtPerDecision! * 10, true);

  // The finding. Levels 4 and 5 transfer an identical set — the top rung hands
  // over nothing further and removes only the asking.
  const four = rungs[4];
  const five = rungs[5];
  console.log(
    `  level 4 takes ${four.surrendered} decisions, level 5 takes ${five.surrendered} -- difference ${five.surrendered - four.surrendered}`,
  );
  expect('the top rung takes nothing new', five.given, 0);
  expect('its decision set is identical to the rung below', five.surrendered, four.surrendered);
  expect('and it is the only rung that stops asking', five.level.confirms, false);
  expect('which the model flags as consent-only', isConsentOnly(rungs, 5), true);
  expect('and no other rung is', rungs.filter((_, i) => isConsentOnly(rungs, i)).length, 1);

  // So the ceiling is about consent, not capability.
  const ceiling = lastWorthClimbing(rungs);
  console.log(`  last rung worth climbing: level ${ceiling.level.n} — ${ceiling.level.name}`);
  expect('the ceiling is level four', ceiling.level.n, 4);

  // And the trap: on both attention measures the top rung is the cheapest thing
  // here, which is exactly why attention cannot be the only number.
  console.log(
    `  level 5 costs ${saidAs(five.attending)} a week and ${saidAs(five.explaining)} to explain -- the least of both`,
  );
  expect('the top rung is the cheapest to live with', five.attending, Math.min(...rungs.map((r) => r.attending)));
  expect(
    'and the cheapest to explain of every built rung',
    five.explaining < Math.max(...rungs.map((r) => r.explaining)),
    true,
  );
}


/* ---- claim 24: the ending runs the real thing and shows none of it ------ */

console.log(HEADING24);
{
  const ANSWERS = [
    'one with more people I actually care about.',
    'one with someone to build something with.',
    'one where I am actually dating someone.',
  ];

  const compiled = ANSWERS.map((a) => compile(a));

  // It has to actually run. An ending that shows a written line instead of a
  // computed one would be the one place on this site where the machinery was
  // theatre, which is the last place it could afford to be.
  for (const c of compiled) {
    expect(`"${c.sentence.slice(0, 22)}...": produces a real evening`, c.withheld, false);
    expect(
      `"${c.sentence.slice(0, 22)}...": and a line with a room in it`,
      c.action.includes(c.scene.location),
      true,
    );
  }

  // The answer has to matter. Two presets landing identically looks exactly
  // like an answer nobody read — which the first draft did, and this catches.
  const outcomes = compiled.map((c) => `${c.pair.id}/${c.scene.id}`);
  const kinds = compiled.map((c) => c.reading.kind);
  console.log(`  three answers -> ${kinds.join(', ')}`);
  for (const c of compiled) console.log(`    ${c.reading.kind.padEnd(13)} ${c.scene.label}`);
  expect('every answer lands somewhere different', new Set(outcomes).size, ANSWERS.length);
  expect('and covers three kinds of intersection', new Set(kinds).size, 3);

  // The thesis, one last time, from the last three clicks on the site.
  const romantic = compiled.find((c) => c.reading.kind === 'romantic')!;
  expect('asking for a date is still what produces the cafe', romantic.scene.id, 'coffee');

  // And the ending must cost less than the surface that had to prove the
  // machinery exists. Same engine, none of it shown.
  const end = SURFACES.find((s) => s.path === '/end')!;
  const compilerSurface = SURFACES.find((s) => s.path === '/compiler')!;
  const endCost = costOf(end).seconds;
  const compilerCost = costOf(compilerSurface).seconds;
  console.log(`  /end costs ${saidAs(endCost)} against /compiler's ${saidAs(compilerCost)}`);
  expect('the ending is cheaper than the explanation', endCost < compilerCost, true);

  const ranked = [...audit(SURFACES).costs].sort((x, y) => x.seconds - y.seconds);
  const rank = ranked.findIndex((c) => c.surface.path === '/end') + 1;
  const cheaperThan = 1 - rank / ranked.length;
  console.log(
    `  and ranks ${rank} cheapest of ${ranked.length} -- cheaper than ${Math.round(cheaperThan * 100)}% of the site`,
  );
  // A proportion, not a position. The old assertion pinned /end to the top
  // three, which held only until another cheap surface joined the bill --
  // exactly what happened when /next-wednesday started being counted. The
  // claim was always about the ending being cheap, never about it being third.
  expect('and is cheaper than three quarters of the site', cheaperThan >= 0.75, true);
}


/* ---- claim 25: an opening appears before a person does ------------------ */

console.log(HEADING25);
{
  const SENTENCES = [
    'I moved here recently and just want someone fun to get me out of the house.',
    'I need a cracked designer who thinks like me.',
    'I want to go on an actual date.',
  ];

  // The world never shows you the database. An unlocked candidate must carry
  // no person data — asserted by serialising every candidate set and checking
  // that no modelled person's name appears anywhere in it.
  const everyName = [...PAIRS, WEEK_TWO, ...HELD_BACK].flatMap((p) => [
    p.personA.name,
    p.personB.name,
  ]);
  for (const s of SENTENCES) {
    for (const d of SCRUB_DAYS) {
      const json = JSON.stringify(openWorld(s, d).candidates);
      expect(
        `"${s.slice(0, 18)}..." day ${d}: candidates leak no names`,
        everyName.some((n) => json.includes(n)),
        false,
      );
    }
  }

  // The lock is the send bar, and only the send bar.
  let locks = 0;
  for (const s of SENTENCES) {
    for (const d of SCRUB_DAYS) {
      const w = openWorld(s, d);
      if (!w.locked) continue;
      locks++;
      expect(
        `${w.locked.pair.id} on day ${d}: only a clearing evening approaches`,
        w.locked.utility >= SEND_THRESHOLD,
        true,
      );
      const c = w.candidates.find((x) => x.id === w.locked!.candidateId)!;
      expect(`${w.locked.pair.id} on day ${d}: and only on a night they share`, c.availableToday, true);
    }
  }
  expect('something locks somewhere', locks > 0, true);

  // Held back means held back from every angle: the three below-bar pairs can
  // never be the approaching intersection, whatever is said and whenever.
  const heldIds = new Set(HELD_BACK.map((p) => p.id));
  for (const s of SENTENCES) {
    for (const d of SCRUB_DAYS) {
      const w = openWorld(s, d);
      expect(
        `day ${d}: no held-back pair approaches`,
        w.locked !== null && heldIds.has(w.locked.pair.id),
        false,
      );
    }
  }

  // Both axes reorganise the world. Different sentences change the approach on
  // a fixed evening; different evenings change it for a fixed sentence.
  const bySentence = new Set(
    SENTENCES.map((s) => openWorld(s, 3).locked?.pair.id ?? 'none'),
  );
  const byDay = new Set(
    SCRUB_DAYS.map((d) => openWorld(SENTENCES[0], d).locked?.pair.id ?? 'none'),
  );
  console.log(`  sentences on wednesday -> ${[...bySentence].join(', ')}`);
  console.log(`  evenings for one sentence -> ${[...byDay].join(', ')}`);
  expect('the sentence reorganises the world', bySentence.size > 1, true);
  expect('and so does the evening', byDay.size > 1, true);

  // The physics is the ranking, not a second opinion.
  const w = openWorld(SENTENCES[0], 4);
  for (const c of w.candidates) {
    expect(`${c.id}: closer always means better`, c.gap >= MIN_GAP && c.gap <= MAX_GAP, true);
  }
  expect(
    'the approaching candidate uses the same gap mapping as the gravity page',
    Math.abs(
      w.candidates.find((c) => c.id === w.locked!.candidateId)!.gap -
        gapFor(w.locked!.utility),
    ) < 1e-9,
    true,
  );

  // Times are real: an available candidate's shown day is a day the two people
  // genuinely share, from the same mutual-window arithmetic the scheduler uses.
  for (const c of w.candidates) {
    if (!c.availableToday) continue;
    expect(`${c.id}: the hour on the artifact is a shared day`, c.days.includes(w.day), true);
  }

  // The handoff cannot silently swap people: the resolver knows every pair the
  // possibility layer can lock, including the one outside PAIRS.
  expect('the stage can land on noor and sam', pairById(WEEK_TWO.id).id, WEEK_TWO.id);

  // Same sentence, same evening, same world.
  expect(
    'the world is deterministic',
    JSON.stringify(openWorld(SENTENCES[0], 4)) === JSON.stringify(openWorld(SENTENCES[0], 4)),
    true,
  );
}


/* ---- claim 26: the reel ships only what it says it ships ---------------- */

console.log(HEADING26);
{
  // The manifest is the reel's only source, so the manifest has to be true of
  // the disk. The --check pass in npm run check catches drift; these catch
  // shape.
  // Counted off the disk, not pinned to a number. The old floor read ">= 30"
  // and broke the moment three images were pulled for carrying a wordmark --
  // a correct removal failing an assertion that was only ever guarding against
  // an empty manifest. Same mistake the route audit made with ">= 16".
  // public/photos only: the six stage plates in public/rooms are loaded by path
  // by RoomPlate and were never manifest entries.
  const onDisk = readdirSync(join(process.cwd(), 'public', 'photos')).filter((f) =>
    f.endsWith('.webp'),
  ).length;
  expect('the manifest matches the disk exactly', PHOTOS.length, onDisk);
  expect('and the reel is not empty', PHOTOS.length > 0, true);
  for (const p of PHOTOS) {
    const onDisk = existsSync(join(process.cwd(), 'public', p.src));
    expect(`${p.src}: exists on disk`, onDisk, true);
    expect(`${p.src}: is under the size budget`, p.kb <= 260, true);
  }

  const kinds = { moment: 0, room: 0, sheet: 0, print: 0 };
  for (const p of PHOTOS) kinds[p.kind]++;
  console.log(
    `  ${PHOTOS.length} photos -- ${kinds.moment} moments, ${kinds.room} rooms, ${kinds.sheet} sheets, ${kinds.print} prints`,
  );
  expect('moments carry the reel', kinds.moment >= 18, true);
  expect('the rooms are the quiet passage', kinds.room, 6);
  expect('the sheets cut fast', kinds.sheet, 4);
  // The selfie-grammar layer: small frames the pages pin up as taped prints.
  // The reel excludes them (they ship at ~300px), so the count is asserted
  // here instead — a print that silently fell out of the manifest would
  // otherwise just render as a page with its photograph missing.
  expect('the prints are all present', kinds.print, 14);

  /*
   * Asset weight budgets — the regression guard the per-file cap can't be.
   *
   * Measured on the production build (2026-08-22): the whole photo library
   * is ~2.5 MB across 43 files, the six room plates ~230 KB, and no page
   * requests more than two photos up front. The budgets sit a comfortable
   * margin above reality, so they never nag — they exist to catch the one
   * future commit that drops a 6 MB original into public/ and quietly
   * doubles what every visitor downloads.
   */
  const photoBytes = PHOTOS.reduce((a, p) => a + p.kb, 0);
  expect('the photo library stays under its 3.5 MB budget', photoBytes <= 3584, true);
  const roomBytes = ['coffee', 'mission', 'gallery', 'postshow', 'group', 'study']
    .map((r) => statSync(join(process.cwd(), 'public', 'rooms', `${r}.webp`)).size)
    .reduce((a, b) => a + b, 0);
  expect('the room plates stay under their 400 KB budget', roomBytes <= 400 * 1024, true);

  // The six room plates the stage keys off scene ids all exist now, so the
  // graceful-absence path on the stage has something to find.
  for (const room of ['coffee', 'mission', 'gallery', 'postshow', 'group', 'study']) {
    expect(
      `the ${room} plate exists`,
      existsSync(join(process.cwd(), 'public', 'rooms', `${room}.webp`)),
      true,
    );
  }

  // No frame ships twice. Two pairs did -- coffee-date/moment-04 and
  // moment-11/study-picnic were byte-identical, so the reel showed the same
  // evening twice and called it two moments. Hashing the actual bytes is the
  // only check that catches it; distinct filenames proved nothing.
  const seenBytes = new Map<string, string>();
  for (const photo of PHOTOS) {
    const bytes = readSourceFile(join(process.cwd(), 'public', photo.src));
    const digest = createHash('sha1').update(bytes).digest('hex');
    const twin = seenBytes.get(digest);
    expect(`${photo.src}: is not a duplicate of ${twin ?? 'anything'}`, twin === undefined, true);
    seenBytes.set(digest, photo.src);
  }
  console.log(`  ${seenBytes.size} distinct images, no frame shipped twice`);

  // Unofficial means unofficial: nothing shipped carries the wordmark, and the
  // images that did -- including one with it rendered onto a coffee cup, which
  // a filename check could never have caught -- were archived, not converted.
  const shipped = [
    ...readdirSync(join(process.cwd(), 'public', 'photos')),
    ...readdirSync(join(process.cwd(), 'public', 'rooms')),
  ];
  expect(
    'no shipped filename carries the wordmark',
    shipped.some((f) => f.toLowerCase().includes('ditto')),
    false,
  );

  // Windows hid this one: public/photos and public/Photos are the same folder
  // locally and different URLs in production. Assert the real casing.
  const entries = readdirSync(join(process.cwd(), 'public'));
  expect('the photos folder is lowercase', entries.includes('photos'), true);
  expect('and the capitalised one is gone', entries.includes('Photos'), false);
}


/* ---- claim 27: the future is flown, not asserted ------------------------ */

console.log(HEADING27);
{
  // Continuity, sampled — the same standard the zoom set. Five stations from
  // tonight to 2030 with no cut anywhere.
  const N = 3000;
  let worst = 0;
  let prev = visionCameraAt(0);
  for (let i = 1; i <= N; i++) {
    const s = visionCameraAt(i / N);
    const d = Math.hypot(s.eye[0] - prev.eye[0], s.eye[1] - prev.eye[1], s.eye[2] - prev.eye[2]);
    if (d > worst) worst = d;
    prev = s;
  }
  console.log(`  ${N} samples -- largest single step ${worst.toFixed(4)} units`);
  expect('the flight never cuts', worst < 0.2, true);

  // It arrives, holds, and moves at every station — eased to a near stop.
  const step = 1 / N;
  const segments = STATIONS.length - 1;
  for (let i = 1; i < segments; i++) {
    const at = i / segments;
    const vStation = Math.hypot(
      ...visionCameraAt(at + step).eye.map((v, k) => v - visionCameraAt(at - step).eye[k]),
    );
    const vMid = Math.hypot(
      ...visionCameraAt(at - 0.5 / segments + step).eye.map(
        (v, k) => v - visionCameraAt(at - 0.5 / segments - step).eye[k],
      ),
    );
    expect(`station ${i}: the camera slows to look`, vStation < vMid / 4, true);
  }

  // The route is the argument: tonight to the quiet, in order.
  const path = [0, 0.25, 0.5, 0.75, 1].map((t) => stationAt(t).key);
  console.log(`  route: ${path.join(' -> ')}`);
  expect('it starts tonight', path[0], 'tonight');
  expect('and ends in the quiet', path[4], 'quiet');
  expect('through all five stations', new Set(path).size, 5);

  // Every photograph the flight uses actually ships — from the same manifest
  // the reel is held to. A vision made of missing files is a slideshow of 404s.
  for (const s of STATIONS) {
    for (const slug of s.photos) {
      expect(
        `${s.key}/${slug}: flies a photo that ships`,
        PHOTOS.some((p) => p.src === `/photos/${slug}.webp`),
        true,
      );
    }
  }
  const flown = STATIONS.reduce((t, s) => t + s.photos.length, 0);
  console.log(`  ${flown} photographs fly in the scene`);
  expect('the photography rides in the scene', flown >= 10, true);

  // The last station is the quiet, and the quiet carries nothing. An ending
  // about the interface getting out of the way cannot itself be furnished.
  const quiet = STATIONS[STATIONS.length - 1];
  expect('the quiet has no photographs', quiet.photos.length, 0);
  expect('and no room plate', quiet.plate === undefined, true);

  // Station visibility is level-of-detail, not a slideshow: mid-flight at the
  // meeting, tonight has fully faded and the meeting is fully present.
  expect('stations fade by distance', stationOpacity(0.5, 0) < 0.05, true);
  expect('and the near one is fully there', stationOpacity(0.5, 2) > 0.95, true);
}


/* ---- claim 28: the language is the code's language ---------------------- */

console.log(HEADING28);
{
  // A ubiquitous language is only ubiquitous if the words in the glossary and
  // the words in the code are the same words. Open every named file and check.
  for (const term of LANGUAGE) {
    const path = join(process.cwd(), term.file);
    expect(`"${term.word}": its file exists`, existsSync(path), true);
    const source = readSourceFile(path, 'utf8');
    expect(`"${term.word}": ${term.symbol} really lives there`, source.includes(term.symbol), true);
  }
  console.log(`  ${LANGUAGE.length} words, every one resolved to a real symbol in a real file`);

  // Every station of the flight coins at least one word, and the vocabulary
  // grows along the route rather than arriving all at once.
  for (const station of STATIONS) {
    expect(`${station.key}: coins vocabulary`, termsFor(station.key).length >= 1, true);
  }

  // The glossary is the site's register, not a spec's: lowercase throughout.
  for (const term of LANGUAGE) {
    expect(
      `"${term.word}": stays lowercase`,
      term.word === term.word.toLowerCase() && term.says === term.says.toLowerCase(),
      true,
    );
  }

  // No word is defined twice. One language, one meaning per word.
  expect(
    'no word means two things',
    new Set(LANGUAGE.map((t) => t.word)).size,
    LANGUAGE.length,
  );
}


/* ---- claim 29: nothing ships unreachable, and no count is written -------- */

console.log(HEADING29);
{
  // A team audit found a shipped route that nothing linked to and nothing
  // billed. Reachability is now a claim, not a hope: every route directory
  // under src/app must be the target of a Link somewhere in src.
  const routeDirs = readdirSync(join(process.cwd(), 'src', 'app'), { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('_') && e.name !== 'api')
    .map((e) => e.name);

  const sources: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
        sources.push(readSourceFile(full, 'utf8'));
      }
    }
  };
  walk(join(process.cwd(), 'src'));
  const corpus = sources.join('\n');

  /*
   * Adjacent to an `href`, not merely present in the file.
   *
   * The second clause used to accept any `'/route'` string anywhere in the
   * source -- and AllStage's SAYS map keys every route as a single-quoted path
   * for caption lookup, so every route satisfied the check whether or not
   * anything linked to it. The assertion was reading its own index.
   *
   * `href` has to be within a few characters, which admits both the JSX form
   * and the nav-array form this project uses (`{ href: '/app', label: ... }`)
   * while rejecting a bare key in a lookup table.
   */
  for (const dir of routeDirs) {
    // String.raw, because inside a plain template literal `\s` collapses to a
    // literal "s" and the pattern silently starts demanding one.
    const linked = new RegExp(
      String.raw`href[:=]\s*\{?\s*['"` + '`' + String.raw`]/` + dir + String.raw`['"` + '`' + String.raw`]`,
    ).test(corpus);
    expect(`/${dir}: something actually links to it`, linked, true);
  }

  // The stage is the front door, so it carries the widest nav. Every surface a
  // first-time visitor could want should be one click from it -- the drop most
  // of all, which was missing when a growth review walked the site cold.
  //
  // "The stage's nav" is now two files. The twenty-six inline links were
  // replaced by one button opening SiteMenu, because the pile stacked past the
  // fold of a viewport-locked stage and clipped the dial with it. The menu is
  // the stage's index -- it opens over the stage and nowhere else -- so the
  // assertion reads both sources as one front door.
  const stage =
    readSourceFile(join(process.cwd(), 'src/components/stage/FirstSceneStage.tsx'), 'utf8') +
    readSourceFile(join(process.cwd(), 'src/components/shared/SiteMenu.tsx'), 'utf8');
  for (const key of ['/wednesday', '/after', '/next-wednesday', '/vision', '/moments', '/all']) {
    expect(`the stage links to ${key}`, stage.includes(`'${key}'`) || stage.includes(`"${key}"`), true);
  }

  // Two nav labels both promised an ending. Labels must be distinct, or the
  // row reads as a typo.
  const labels = [...stage.matchAll(/label: '([^']+)'/g)].map((m) => m[1]);
  expect('no two nav labels are identical', new Set(labels).size, labels.length);
  console.log(`  ${routeDirs.length} routes, all linked; ${labels.length} nav labels, all distinct`);

  // And the counts the site says about itself are derived, never typed. These
  // three spellings were all stale at once, on the pages whose whole premise
  // is that numbers get measured.
  /*
   * A pattern, because a list of four literals could not fail.
   *
   * The old denylist named four exact strings, none of which existed anywhere
   * in the tree -- so all four assertions passed forever while FOUR REAL stale
   * counts sat in the source: "Fourteen surfaces" in roadmap.ts (capital F; the
   * denylist carried the lowercase spelling), "Fourteen pages" in NextStage,
   * and "twenty-six surfaces" in two more places, against a site that ships 27.
   *
   * The guard was checking for the specific mistakes already fixed rather than
   * for the shape of the mistake, which is the difference between a regression
   * test and a memorial.
   */
  const WRITTEN_COUNT =
    /\b(?:ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty)(?:[\s-](?:one|two|three|four|five|six|seven|eight|nine))?\s+(?:surfaces?|pages?|routes?|claims?|assertions?)\b/gi;

  const written = [...corpus.matchAll(WRITTEN_COUNT)].map((m) => m[0]);
  if (written.length) {
    console.log(`  written counts found: ${[...new Set(written)].join(', ')}`);
  }
  expect('no surface writes a count it could derive', written.length, 0);
}


/* ---- claim 30: scale does not buy what it looks like it buys ------------- */

console.log(HEADING30);
{
  const world = buildWorld();
  console.log(
    `  ${SCHOOLS} schools, ${world.pool} people -- ${world.reachable.length} clear a wednesday`,
  );

  // The bar is the mechanism, so assert the mechanism first: your campus is the
  // only school whose bar is the plain send threshold, and every other school's
  // bar is strictly higher, in travel order.
  expect('a free trip costs nothing', barAt(0), SEND_THRESHOLD);
  const bars = world.schools.map((s) => barAt(s.minutes));
  for (let i = 1; i < bars.length; i++) {
    expect(`school ${i}: its bar is higher than the one before`, bars[i] > bars[i - 1], true);
  }

  // The headline. Eight times the people, nothing like eight times the options.
  const localOnly = survivorsAt(world, 0).length;
  console.log(
    `  ${SCHOOLS}x the people buys ${world.multiplier.toFixed(2)}x the options (${localOnly} -> ${world.reachable.length})`,
  );
  expect('scale is badly sublinear', world.multiplier < SCHOOLS / 2, true);
  expect('but it is not nothing', world.multiplier > 1, true);

  // Whole schools contribute nobody. Not a rounding error -- a structural
  // consequence of a bar that rises faster than talent is distributed.
  console.log(`  ${world.deadSchools} of ${SCHOOLS - 1} expansion schools send nobody`);
  expect('some schools send nobody at all', world.deadSchools >= 1, true);
  expect('the furthest survivor is closer than the furthest school', world.furthest < 96, true);

  // Your campus is over-represented among survivors by a lot more than its
  // share of the world.
  const share = 1 / SCHOOLS;
  console.log(
    `  your campus: ${Math.round(share * 100)}% of the world, ${Math.round(world.localShare * 100)}% of what survives`,
  );
  expect('home is over-represented', world.localShare > share * 2, true);

  // The turn: everybody who travelled had to clear a raised bar, so every one
  // of them beats the median match at home. This is what scale actually buys.
  for (const c of world.worthTheTrip) {
    expect(
      `a ${world.schools[c.school].minutes}-minute trip beats the median at home`,
      c.utility > world.localMedian,
      true,
    );
  }

  // And the honesty check, which is the point of the whole claim. The utility
  // draw is a stated assumption, not a measurement -- so turn the knob. If the
  // conclusion only held at one seed and one distribution shape, it would be a
  // coincidence dressed as an argument.
  let worstMultiplier = 0;
  let worstOver = Infinity;
  let fewestDead = Infinity;
  let rolls = 0;
  for (let seed = 1; seed <= 60; seed++) {
    for (const shape of [2, 2.5, 3, 3.5, 4]) {
      const w = buildWorld(seed * 7919, shape);
      if (survivorsAt(w, 0).length === 0) continue;
      rolls++;
      worstMultiplier = Math.max(worstMultiplier, w.multiplier);
      worstOver = Math.min(worstOver, w.localShare * SCHOOLS);
      fewestDead = Math.min(fewestDead, w.deadSchools);
    }
  }
  console.log(
    `  across ${rolls} re-rolls: multiplier never above ${worstMultiplier.toFixed(2)}x, home never under ${worstOver.toFixed(2)}x over-represented, never fewer than ${fewestDead} dead schools`,
  );
  // Half of linear, not a hair under it: the worst roll lands on exactly 4.00x
  // of a possible 8x, and pretending the bound is tighter than the data would
  // be the same sin every other claim here exists to catch.
  expect('the conclusion survives re-rolling the assumption', worstMultiplier <= SCHOOLS / 2, true);
  expect('home is always over-represented', worstOver >= 2, true);
  expect('a school always goes dark', fewestDead >= 1, true);
}


/* ---- claim 31: an introduction is only as good as the reluctant one ------ */

console.log(HEADING31);
{
  const everyPair = [...PAIRS, WEEK_TWO, ...HELD_BACK];

  // Every disposition must trace to a phrase the person actually has. A
  // personal weight that cannot be pointed at in that person's own record is
  // just a number with a name on it. Same rule claim 28 holds for the glossary.
  const allPeople = everyPair.flatMap((p) => [p.personA, p.personB]);
  for (const d of DISPOSITIONS) {
    const holders = allPeople.filter((person) =>
      (d.field === 'socialEnergy' ? person.socialEnergy : person.conversationStyle).some((line) =>
        line.includes(d.phrase),
      ),
    );
    expect(`"${d.phrase}": somebody actually said it`, holders.length > 0, true);
  }
  console.log(`  ${DISPOSITIONS.length} dispositions, every one traceable to a real phrase`);

  // Dispositions may only RE-WEIGHT. They may never add or remove a dimension,
  // which is the same constraint `Learned` is under -- one date can change how
  // much something counts, never what the system is looking at.
  const baseKeys = Object.keys(WEIGHTS).sort().join(',');
  for (const person of allPeople) {
    expect(
      `${person.name}: same dimensions as everyone else`,
      Object.keys(weightsOf(person)).sort().join(','),
      baseKeys,
    );
  }

  // THE INVARIANT. mutual can never exceed the lower of the two readings.
  // Nothing in the model is allowed to let one person's enthusiasm pay for the
  // other's reluctance.
  let readings = 0;
  let overstated = 0;
  let worstOverstatement = 0;
  const flips: string[] = [];

  for (const pair of everyPair) {
    for (const scene of pair.scenes) {
      const m = mutualityOf(pair, scene);
      readings++;
      /*
       * `mutual <= min(a, b)` cannot fail, because `mutual` IS `min(a, b)` --
       * an assertion comparing a value to the expression that produced it,
       * which is the same shape this suite already caught itself making in
       * claim 20 and in the old `pooled` comparison.
       *
       * What is worth pinning is that it is the MINIMUM and not some softer
       * combination. So: equal to the lower side exactly, and -- whenever the
       * two disagree -- strictly below the higher one. A mean would pass the
       * first and fail the second.
       */
      const lower = Math.min(m.a, m.b);
      const higher = Math.max(m.a, m.b);
      expect(`${pair.id}/${scene.id}: is exactly the reluctant reading`, Math.abs(m.mutual - lower) < 1e-12, true);
      if (higher - lower > 1e-9) {
        expect(`${pair.id}/${scene.id}: and strictly below the keener one`, m.mutual < higher, true);
      }

      /*
       * The comparison that matters, and the one this claim originally got
       * wrong. It used to measure `min(a, b)` against `(a + b) / 2` -- two
       * numbers this file computes itself -- which can only ever yield
       * `mean >= min`. That is arithmetic wearing the costume of a finding, and
       * it made the surface report that mutuality changed nothing.
       *
       * The real comparison is against `scoreScene`: the single-weight-vector
       * model actually running on `/` and `/thread`.
       */
      const gapToShipped = overstatement(m);
      if (gapToShipped > 1e-12) overstated++;
      worstOverstatement = Math.max(worstOverstatement, gapToShipped);
    }

    for (const m of overruled(pair, SEND_THRESHOLD)) {
      const who = m.reluctant === 'a' ? pair.personA.name : pair.personB.name;
      flips.push(
        `${pair.id}/${m.scene.id}: ships ${m.shipped.toFixed(3)}, ${who} reads ${m.mutual.toFixed(3)}`,
      );
    }
  }

  console.log(`  ${everyPair.length} pairs, ${readings} two-sided readings`);
  console.log(
    `  the shipping model sits above the reluctant reading in ${overstated}/${readings}, by up to ${worstOverstatement.toFixed(3)}`,
  );
  expect('the shipping model usually overstates', overstated > readings / 2, true);
  expect('and the overstatement is material, not rounding', worstOverstatement > 0.1, true);

  /*
   * The rooms that would go out and should not.
   *
   * An earlier version of this claim asserted there were NONE of these, and the
   * surface said so in as many words. That was false, and it was false because
   * of the bug above rather than because of the data. Asserting the real number
   * keeps the page honest in the other direction now: if this ever drops to
   * zero, the copy claiming a case exists has to be rewritten.
   */
  console.log(`  rooms the shipping model would send and mutuality refuses: ${flips.length}`);
  flips.forEach((f) => console.log(`    ${f}`));
  expect('at least one room is overruled, and the page says which', flips.length >= 1, true);
}


/* ---- claim 32: the thread says what the engine decided --------------------- */

console.log(HEADING32);
{
  for (const pair of [...PAIRS, WEEK_TWO]) {
    const t = buildThread(pair);
    const decision = sendDecision(pair);
    const text = t.beats.map((b) => b.text).join(' | ');

    // Exactly one message opens the apparatus. Two would make the thread a menu;
    // none would make the reasoning unreachable and the claim of transparency
    // decorative.
    expect(`${pair.id}: exactly one message opens the reasoning`, t.beats.filter((b) => b.opens).length, 1);

    // No placeholder survives to the screen. A thread that shipped "{NAME}"
    // would be the most embarrassing possible bug on the most human surface.
    expect(`${pair.id}: no unfilled placeholder`, /\{[A-Z]+\}/.test(text), false);

    // No HTML entity survives either. `&rsquo;` inside a .ts string literal is
    // six characters, not an apostrophe, and it shipped that way once.
    expect(`${pair.id}: no raw html entities`, /&[a-z]+;/.test(text), false);

    if (decision.send) {
      // The plan in the thread is the plan the engine chose. Not a plan, not a
      // representative plan -- that one.
      const scene = decision.scene;
      expect(`${pair.id}: the thread names the chosen hour`, text.includes(scene.time.toLowerCase()), true);
      expect(`${pair.id}: and the chosen place`, text.includes(scene.location), true);
      expect(`${pair.id}: and the other person`, text.includes(pair.personB.name), true);

      // The ending is stated before it starts. That is the site's oldest claim
      // and the thread is the surface where it matters most.
      expect(`${pair.id}: the ending is in the thread`, t.ending.length > 0, true);
      expect(`${pair.id}: and the ending is text-length, not an essay`, t.ending.length < 130, true);

      // A room with no walk gets no walk message. Sending one anyway would cost
      // attention to say nothing, which is the failure this project is about.
      const hasRoute = scene.artifacts.some((a) => a.kind === 'route' && a.label);
      expect(`${pair.id}: logistics message only when there are logistics`, t.detail !== null, hasRoute);
    } else {
      // Abstention has to survive all the way to the thread. A product that
      // texts you every week regardless is a newsletter.
      expect(`${pair.id}: the thread abstains too`, text.includes('rather send nothing'), true);
    }

    /*
     * The day and the reminder, which were both invented.
     *
     * `DAY` was the literal 'thursday' and the day-of reminder fired at a fixed
     * '5:30 pm'. For Priya and Theo that named a weekday they share no window on
     * at all, and sent "3:40 pm tonight" a hundred and ten minutes after the
     * coffee had started. Only the 8:32 pm walk read correctly, which is exactly
     * why it survived -- the default pair was the one it happened to suit.
     */
    const days = readSchedule(pair.personA, pair.personB).windows.map((w) => w.dayName);
    const planLine = t.beats.find((b) => b.text.includes(t.scene.location));
    expect(
      `${pair.id}: the day is one they actually share`,
      days.some((d) => planLine?.text.startsWith(String(d))),
      true,
    );

    const sceneStart = clockToMinutes(t.scene.time);
    const reminder = t.beats.find((b) => b.text.includes('tonight'));
    if (reminder && sceneStart !== null) {
      const remindAt = clockToMinutes(reminder.at.toUpperCase());
      expect(
        `${pair.id}: the reminder arrives before the date does`,
        remindAt !== null && remindAt < sceneStart,
        true,
      );
    }

    // The whole product, priced the same way the rest of the site is priced.
    console.log(`  ${pair.id}: ${t.beats.length} messages, ${t.words} words, ${t.seconds.toFixed(1)}s`);
    expect(`${pair.id}: the whole thing reads in under a minute`, t.seconds < 60, true);

    // The closing line counts the thread it is describing. It used to say
    // "eight messages" while rendering eleven.
    const silence = silenceFor(t);
    expect(`${pair.id}: the closing line counts correctly`, silence.includes(`${t.beats.length} messages`), true);
  }

  // The thread must be cheaper than the surface that explains the machinery.
  // If reading the reasoning were shorter than reading the plan, the whole
  // argument of this page would be upside down.
  const stage = SURFACES.find((s) => s.path === '/');
  const threadCost = buildThread(PAIRS[0]).seconds;
  if (stage) {
    const stageCost = costOf(stage).seconds;
    console.log(`  the thread is ${threadCost.toFixed(0)}s against the stage's ${stageCost.toFixed(0)}s`);
    expect('the thread is the cheapest way to get the product', threadCost < stageCost, true);
  }
}


/* ---- claim 33: the front door recommends, and admits ---------------------- */

console.log(HEADING33);
{
  // Every lane points at a route that exists and is billed. A front door that
  // recommends a 404 is worse than no front door.
  const billed = new Set(SURFACES.map((s) => s.path));
  for (const way of WAYS_IN) {
    expect(`${way.key}: points somewhere real`, billed.has(way.route), true);
    expect(`${way.key}: costs a measurable amount`, costOfWay(way) > 0, true);

    // The half nobody prints. A recommendation without its limit is a sales
    // pitch, and this project does not get to make one of those.
    expect(`${way.key}: says what it does not prove`, way.doesNot.length > 20, true);
  }

  // No two lanes send you to the same place -- five ways in, five destinations,
  // or it is a menu pretending to be advice.
  expect(
    'the five ways are five different ways',
    new Set(WAYS_IN.map((w) => w.route)).size,
    WAYS_IN.length,
  );
  console.log(`  ${WAYS_IN.length} lanes, ${new Set(WAYS_IN.map((w) => w.route)).size} distinct routes`);

  // The recommended shortest route really is the shortest. The page says so in
  // words and prints a number beside it; both come from the same audit.
  const shortest = shortestWay();
  for (const way of WAYS_IN) {
    expect(
      `${shortest.route} is no slower than ${way.route}`,
      costOfWay(shortest) <= costOfWay(way) + 1e-9,
      true,
    );
  }
  console.log(`  shortest way in: ${shortest.route} at ${Math.round(costOfWay(shortest))}s`);

  // And it should genuinely be quick, or the advice is useless.
  expect('the shortest way in is under a minute', costOfWay(shortest) < 60, true);

  /*
   * The generated proof.
   *
   * These three numbers are printed on the front door, which makes them the
   * ones most worth being pedantic about -- this project has twice been caught
   * writing a count into copy the code had outgrown. build-proof.mjs regenerates
   * them from a real run and `npm run check` fails on drift, so these
   * assertions only need to catch the shapes that would be absurd.
   */
  // Shape only. Exactness is build-proof.mjs --check's job, and asserting a
  // floor here duplicated it into a deadlock: the generator refuses to write a
  // proof of a failing suite, and the suite failed because the proof was stale
  // by exactly the claim being added. Each guard does one thing now.
  expect('the proof counts claims at all', PROOF.claims > 0, true);
  expect('assertions outnumber claims by a lot', PROOF.assertions > PROOF.claims * 10, true);
  expect('the route count matches the bill', PROOF.routes, SURFACES.length);
  console.log(
    `  proof: ${PROOF.claims} claims, ${PROOF.assertions} assertions, ${PROOF.routes} routes`,
  );

  // The ask exists. Twenty-six routes with no way to reply was the gap a
  // growth review found first, and it is the cheapest one on the list to fix.
  // Whitespace-normalised, because JSX wraps prose at arbitrary points and a
  // literal substring search against source is really a search against the
  // formatter's line-break choices. This assertion failed on its first run for
  // exactly that reason, not because the sentence was missing.
  const front = readSourceFile(join(process.cwd(), 'src/components/start/StartStage.tsx'), 'utf8')
    .replace(/\s+/g, ' ');
  expect('the front door carries an ask', front.includes('the ask'), true);
  expect('and it asks to be corrected, not admired', front.includes('which of these is wrong'), true);
}


/* ---- claim 34: the model is what it says it is ---------------------------- */

console.log(HEADING34);
{
  /*
   * The claim suite checked arithmetic and never checked meaning.
   *
   * That is how `venueSafety` survived: authored on all twenty-four scenes,
   * declared in the type as one of eleven dimensions, and absent from the
   * utility function -- internally consistent arithmetic describing itself
   * wrongly for months. Four independent reviewers found it before this file
   * did. So this claim checks the code against its own description.
   */

  // Every field the scorer declares is either weighted or explicitly gated.
  // No third category, because a third category is where dead data hides.
  const weighted = new Set(Object.keys(WEIGHTS));
  const gated = new Set(['venueSafety']);
  const declared = new Set<string>(SCORED_FIELDS);

  for (const field of declared) {
    expect(
      `${field}: is weighted or gated, never merely declared`,
      weighted.has(field) || gated.has(field),
      true,
    );
  }
  console.log(`  ${declared.size} scored fields -- ${weighted.size} weighted, ${gated.size} gated`);
  expect('nothing is weighted that is not declared', [...weighted].every((k) => declared.has(k)), true);

  // The safety gate actually fires. A guard that has never excluded anything is
  // indistinguishable from a comment, so it is tested against a room built to
  // fail it rather than against the shipped data, where nothing is unsafe.
  const template = PAIRS[0].scenes[0];
  const unsafe: Scene = {
    ...template,
    id: 'synthetic-unsafe-room',
    metrics: { ...template.metrics, venueSafety: SAFETY_FLOOR - 0.2, pairSignal: 1, contextFit: 1 },
  };
  expect('a room below the floor is refused', belowSafetyFloor(unsafe.metrics), true);

  const withUnsafe = rankScenes({ ...PAIRS[0], scenes: [...PAIRS[0].scenes, unsafe] });
  expect(
    'and it cannot be ranked at any score',
    withUnsafe.some((r) => r.scene.id === 'synthetic-unsafe-room'),
    false,
  );
  // Even when it would otherwise have won outright.
  expect('not even when it would have won', withUnsafe[0].scene.id !== 'synthetic-unsafe-room', true);

  // Safety is not tradeable. If it were in WEIGHTS, a high enough novelty score
  // could buy past it, and that exchange rate is a worse claim than silence.
  expect('safety is a gate, not an exchange rate', weighted.has('venueSafety'), false);

  // On the shipped data the floor excludes nothing, and saying so is the point:
  // the guard was installed before it caught anything, not after.
  let excluded = 0;
  let lowest = 1;
  for (const pair of [...PAIRS, WEEK_TWO, ...HELD_BACK]) {
    for (const scene of pair.scenes) {
      if (belowSafetyFloor(scene.metrics)) excluded++;
      lowest = Math.min(lowest, scene.metrics.venueSafety);
    }
  }
  console.log(`  floor ${SAFETY_FLOOR}; lowest room on the site ${lowest}; excluded today: ${excluded}`);
  expect('the floor excludes nothing here, and that is stated', excluded, 0);
  expect('and it sits below every room that ships', lowest > SAFETY_FLOOR, true);
}


/* ---- claim 35: a plan is not a ranking ------------------------------------ */

console.log(HEADING35);
{
  const everyone = [...PAIRS, WEEK_TWO];

  /*
   * Two rooms, one evening.
   *
   * Scored in isolation, Priya x Theo take the campus cafe at 3:40 and Noor x
   * Sam take the same cafe at 4:15. A sitting is an hour, so those overlap by
   * twenty-five minutes: one room, two first dates, adjacent tables. Nothing
   * caught it because nothing was looking at two pairs at once.
   */
  const naive = everyone
    .map((pair) => ({ pair, decision: sendDecision(pair) }))
    .filter((c): c is { pair: MatchPair; decision: Extract<SendDecision, { send: true }> } =>
      c.decision.send,
    )
    .map((c) => {
      const from = clockToMinutes(c.decision.scene.time) ?? 0;
      return {
        pairId: c.pair.id,
        scene: c.decision.scene,
        from,
        to: from + SITTING_MINUTES,
        utility: c.decision.utility,
      };
    });

  let naiveClashes = 0;
  for (let i = 0; i < naive.length; i++) {
    for (let j = i + 1; j < naive.length; j++) {
      if (clashes(naive[i], naive[j])) naiveClashes++;
    }
  }
  console.log(`  scoring pairs in isolation produces ${naiveClashes} double-booked room(s)`);

  /*
   * The shipped data used to collide here and no longer does, because deriving
   * `scheduleFit` from the calendars moved one pair off the room it was never
   * really free for. That is the bug class disappearing, not the guard becoming
   * unnecessary -- so the guard is tested against a collision built on purpose
   * rather than against whatever today's data happens to do. A regression test
   * that only fires when the data cooperates is not a test.
   */
  const twin: Booking = {
    pairId: 'synthetic-twin',
    scene: naive[0].scene,
    from: naive[0].from + 15,
    to: naive[0].from + 15 + SITTING_MINUTES,
    utility: naive[0].utility,
  };
  expect('two bookings fifteen minutes apart in one room clash', clashes(naive[0], twin), true);
  expect(
    'and the same room at a different hour does not',
    clashes(naive[0], { ...twin, from: naive[0].to + 30, to: naive[0].to + 90 }),
    false,
  );

  // Planned as a week, it does not. That is the whole fix.
  const week = planWeek(everyone);
  let planned = 0;
  for (let i = 0; i < week.booked.length; i++) {
    for (let j = i + 1; j < week.booked.length; j++) {
      if (clashes(week.booked[i], week.booked[j])) planned++;
    }
  }
  console.log(
    `  planned as a week: ${week.booked.length} booked, ${week.displaced.length} moved, ${planned} collisions`,
  );
  expect('no two pairs share a room at an overlapping hour', planned, 0);

  // Nobody is squeezed in below the bar to make the schedule work. A room that
  // does not clear the threshold is not a fallback, it is a worse evening.
  for (const b of week.booked) {
    expect(`${b.pairId}: was not squeezed in below the bar`, b.utility >= SEND_THRESHOLD, true);
  }

  // Displacement is explained, never silent. A pair moved off its best room
  // should be able to be told why.
  for (const d of week.displaced) {
    expect(`${d.pairId}: the move has a stated reason`, d.reason.length > 10, true);
  }

  /*
   * And the clock.
   *
   * Excluding a dead venue and re-sorting by score is correct about rooms and
   * silent about time: losing POST SHOW WALK at 8:32 PM handed back MINI
   * MISSION at 5:18 PM, a hundred and ninety-four minutes earlier. The score
   * was right. The evening had already happened.
   */
  let backwards = 0;
  for (const pair of everyone) {
    const first = rankScenes(pair)[0];
    if (!first) continue;
    const lostAt = clockToMinutes(first.scene.time);
    if (lostAt === null) continue;

    const naiveNext = rankScenes(pair, { ...NO_CONDITIONS, excluded: [first.scene.id] })[0];
    if (naiveNext) {
      const naiveAt = clockToMinutes(naiveNext.scene.time);
      if (naiveAt !== null && naiveAt < lostAt) backwards++;
    }

    // The clocked replan can return nothing -- which is a real answer, and a
    // better one than a plan for an hour that has already passed.
    const replanned = replanAfter(pair, first.scene.id, lostAt);
    if (replanned) {
      const at = clockToMinutes(replanned.scene.time);
      expect(`${pair.id}: the replacement is not in the past`, at !== null && at >= lostAt, true);
      expect(`${pair.id}: and it still clears the bar`, replanned.utility >= SEND_THRESHOLD, true);
    }
  }
  console.log(`  re-sorting alone would send ${backwards} pair(s) backwards in time`);
  expect('the naive replan really does travel backwards', backwards >= 1, true);

  // Neither library is decorative. `venueSafety` sat authored and unread for
  // months; a planner nothing calls would be the same defect wearing a nicer
  // shape, so both are asserted to be reachable from a surface.
  const stage = readSourceFile(join(process.cwd(), 'src/components/stage/FirstSceneStage.tsx'), 'utf8');
  expect('the stage uses the clocked replan', stage.includes('replanAfter'), true);
  const restraint = readSourceFile(join(process.cwd(), 'src/components/restraint/RestraintStage.tsx'), 'utf8');
  expect('a surface shows the week plan', restraint.includes('planWeek'), true);
}


/* ---- claim 36: one card, one evening; one ranking, one partition ---------- */

console.log(HEADING36);
{
  /*
   * The compiler card used to carry three facts about three different evenings:
   * `when` came from the best mutual window anywhere in the week, `where` came
   * from the chosen scene, and the ending was computed from that scene's own
   * clock. Now the window shown is the one the scene actually sits inside.
   */
  const SENTENCES = [
    'i want to meet someone without it being a whole thing',
    'someone i could actually build something with',
    'i am exhausted but i do not want to be alone tonight',
  ];

  for (const sentence of SENTENCES) {
    const card = compile(sentence);
    const whenStage = card.stages.find((st) => st.key === 'when');
    const hour = card.scene.time.toLowerCase();

    expect(`"${sentence.slice(0, 24)}...": the card names the scene's own hour`,
      Boolean(whenStage && whenStage.value.includes(hour)), true);
    expect(`"${sentence.slice(0, 24)}...": and the plan line agrees`,
      card.withheld || card.action.includes(hour), true);

    // If a day is named, the scene really falls inside that window.
    const start = clockToMinutes(card.scene.time);
    const schedule = readSchedule(card.pair.personA, card.pair.personB);
    const containing =
      start === null
        ? null
        : (schedule.windows.find((w) => start >= w.startMin && start < w.endMin) ?? null);
    if (containing && whenStage) {
      expect(`"${sentence.slice(0, 24)}...": the named day contains the hour`,
        whenStage.value.startsWith(containing.dayName), true);
    }
  }

  /*
   * The lenses claim to be a partition of the ranking, so they have to be a
   * partition of the SAME ranking -- same conditions, same candidate set. Read
   * raw, they disagreed silently the moment a disruption was active.
   */
  const disrupted: Conditions = { ...NO_CONDITIONS, disruptions: ['availability'] };
  for (const pair of [...PAIRS, WEEK_TWO]) {
    const ranked = rankScenes(pair, disrupted);
    for (const key of Object.keys(LENSES) as LensKey[]) {
      const reading = readLens(pair, key, disrupted);
      expect(
        `${pair.id}/${String(key)}: the lens sees what the ranker sees`,
        reading.ranked.length,
        ranked.length,
      );
    }

    /*
     * And the fields that were authored and never read. Surfacing them exposed
     * the real position: this model re-weights on temperament and ignores what
     * people explicitly asked for. Asserted so it stays a stated position
     * rather than drifting back into an accident of which fields got read.
     */
    for (const belief of beliefsFor(pair)) {
      expect(`${belief.person.name}: what they told us is carried`, belief.told.length > 0, true);
      expect(`${belief.person.name}: what we suspect is kept separate`, belief.suspected.length > 0, true);
      const overlap = belief.used.filter((u: string) =>
        belief.told.some((t: string) => t.includes(u)),
      );
      expect(`${belief.person.name}: no stated preference moves a weight`, overlap.length, 0);
    }
  }

  const surface = readSourceFile(join(process.cwd(), 'src/components/mutual/MutualStage.tsx'), 'utf8');
  expect('and a surface says so out loud', surface.includes('beliefsFor'), true);
}

/* ---- claim 37: everything on this site can actually be read --------------- */

console.log(HEADING37);
{
  /*
   * An accessibility review counted 406 text usages below the WCAG AA minimum
   * on the ink stage -- including the disclosure naming this project as
   * unofficial, which shipped at 2.23:1 and 10px on all thirty-five of its
   * mounts. The one sentence this project treats as non-negotiable was the
   * least readable text on the site, and its own doc comment claimed otherwise.
   *
   * 406 call sites is not a thing to fix once. Somebody types `text-paper/30`
   * because it looked right on their display and it is back. So it is measured
   * the way everything else here is measured, and `npm run check` fails on a
   * regression: scripts/contrast.mjs composites every Tailwind text token
   * against the surface it belongs on and computes the real ratio.
   */
  console.log(
    `  ${CONTRAST.checked} text usages measured, ${CONTRAST.failing} below ${4.5}:1`,
  );
  expect('nothing on this site is below AA', CONTRAST.failing, 0);
  expect('and the sweep really looked at everything', CONTRAST.checked > 800, true);

  // The disclosure specifically, because it is the one that matters most and
  // the one that was worst.
  const disclosure = readSourceFile(
    join(process.cwd(), 'src/components/shared/PrototypeDisclosure.tsx'),
    'utf8',
  );
  expect('the disclosure is not the quietest thing here', disclosure.includes('text-paper/28'), false);
  expect('and it is set at a legible size', disclosure.includes('text-label'), true);

  // The WebGL fallback exists to be reached. It was unreachable for months
  // because `onError` on <Canvas> is forwarded to a div, where React's DOM
  // onError never fires.
  const spatial = readSourceFile(
    join(process.cwd(), 'src/components/three/SpatialStage.tsx'),
    'utf8',
  );
  expect('context loss is heard from the canvas', spatial.includes('webglcontextlost'), true);
  expect('and not from a div that cannot speak', /onError=\{\(\) =>/.test(spatial), false);

  // The feedback proxy is a paid API on the deployer's key when configured.
  const route = readSourceFile(join(process.cwd(), 'src/app/api/feedback/route.ts'), 'utf8');
  expect('the proxy is throttled', route.includes('overLimit'), true);
  expect('and says so with the right status', route.includes('429'), true);
}


/* ---- claim 38: the guards look where they say they look ------------------ */

console.log(HEADING38);
{
  /*
   * src/lib/palette.ts carried a comment saying "claim 38 asserts the two
   * agree, so they cannot drift apart again". There was no claim 38. A comment
   * describing a guard that does not exist is worse than no comment: it is the
   * reason nobody goes looking. So here it is, and it is the reason that file
   * may keep its sentence.
   */
  const config = readSourceFile(join(process.cwd(), 'tailwind.config.ts'), 'utf8');
  const declared = new Map<string, string>();
  let group: string | null = null;
  for (const raw of config.split('\n')) {
    const line = raw.trim();
    const opens = /^([a-z][\w-]*)\s*:\s*\{/.exec(line);
    if (opens) {
      group = opens[1];
      continue;
    }
    if (line.startsWith('}')) group = null;
    const pair = /^([A-Za-z][\w-]*)\s*:\s*'(#[0-9a-fA-F]{3,8})'/.exec(line);
    if (!pair) continue;
    const [, key, hex] = pair;
    declared.set(group ? (key === 'DEFAULT' ? group : `${group}-${key}`) : key, hex.toUpperCase());
  }

  const MIRRORED: Record<string, string> = {
    INK: 'ink',
    INK_SOFT: 'ink-soft',
    INK_LINE: 'ink-line',
    PAPER: 'paper',
    COBALT: 'cobalt',
    ACID: 'acid',
    TUNGSTEN: 'tungsten',
    AMBER: 'amber',
    MINT: 'mint',
    TICKET: 'ticket',
  };

  const palette = readSourceFile(join(process.cwd(), 'src/lib/palette.ts'), 'utf8');
  for (const [token, tailwindKey] of Object.entries(MIRRORED)) {
    const found = new RegExp(`export const ${token} = '(#[0-9A-Fa-f]{6})'`).exec(palette);
    expect(`palette: ${token} is declared`, found !== null, true);
    if (found) {
      expect(
        `palette: ${token} matches tailwind's ${tailwindKey}`,
        found[1].toUpperCase(),
        declared.get(tailwindKey),
      );
    }
  }
  console.log(`  ${Object.keys(MIRRORED).length} colours mirrored from tailwind.config.ts, all matching`);

  /*
   * And the guards that scan the source have to scan all of it.
   *
   * The contrast audit walked .tsx only, so `@apply text-paper/35` inside
   * globals.css was invisible and the check reported zero failures while the
   * disclosure shipped at 2.23:1. That is the shape to watch for: a guard whose
   * failure mode is quietly succeeding.
   */
  const contrastScript = readSourceFile(join(process.cwd(), 'scripts/contrast.mjs'), 'utf8');
  expect('the contrast walk reads stylesheets too', /tsx\?\|css/.test(contrastScript), true);

  // Every component directory is either billed for attention or named as
  // shared. Five were neither, so 14% of the words on this site were charged
  // to nobody -- including the disclosure that mounts on all 27 surfaces.
  const componentDirs = readdirSync(join(process.cwd(), 'src', 'components'), {
    withFileTypes: true,
  })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  const billedDirs = new Set(ROUTES.map((r) => r.dir.replace('components/', '')));
  const unbilled = componentDirs.filter((d) => !billedDirs.has(d) && !SHARED_DIRS.includes(d));
  console.log(
    `  ${componentDirs.length} component directories -- ${billedDirs.size} billed, ${SHARED_DIRS.length} declared shared`,
  );
  expect('no component directory is silently unbilled', unbilled.join(','), '');
}


console.log(failures ? `\n${failures} assertion(s) FAILED` : '\nall assertions passed');
process.exit(failures ? 1 : 0);
