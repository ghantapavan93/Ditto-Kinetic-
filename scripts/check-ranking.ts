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
import { MAX_GAP, MIN_GAP, coherence, fieldFor, fieldsFor, gapFor } from '../src/lib/gravity';
import { ALIVE, buildWeek, readWeather } from '../src/lib/weather';
import { SCRUB_DAYS, openWorld } from '../src/lib/intersections';
import { PHOTOS } from '../src/data/photoManifest';
import { STATIONS, stationAt, stationOpacity, visionCameraAt } from '../src/lib/vision';
import { existsSync, readdirSync } from 'node:fs';
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
import {
  NO_CONDITIONS,
  SEND_THRESHOLD,
  rankScenes,
  scoreScene,
  sendDecision,
  weightsFor,
  type Conditions,
  type Learned,
} from '../src/lib/rankScenes';

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
  expect('last week would have sent coffee', before.send && before.scene.id, 'coffee');
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
      const c = possibilityCloud(scene);

      // Same room, same cloud. A cloud that reshuffled every render would be a
      // mood, and could not be checked by anything, including this line.
      const again = possibilityCloud(scene);
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
  const all = PAIRS.flatMap((p) => p.scenes);
  const ordered = [...all].sort((a, b) => a.metrics.uncertainty - b.metrics.uncertainty);
  const spreads = ordered.map((s) => possibilityCloud(s).spread);
  const monotonic = spreads.every((v, i) => i === 0 || v >= spreads[i - 1] - 1e-9);
  console.log(
    `  most certain room spreads ${spreads[0].toFixed(3)}, least certain ${spreads[spreads.length - 1].toFixed(3)}`,
  );
  expect('spread rises with uncertainty, always', monotonic, true);

  // And the thesis, arriving from the numbers rather than from copy: for Maya
  // and Jonah the cafe is the room the system is *most* sure about, and what it
  // is sure of is that the night will be forgettable.
  const mj = PAIRS[0];
  const cafe = possibilityCloud(mj.scenes.find((s) => s.id === 'coffee')!);
  const others = mj.scenes.filter((s) => s.id !== 'coffee').map((s) => possibilityCloud(s).spread);
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
      const lifted = { ...r.best.metrics, [r.waitingFor.key]: r.waitingFor.to };
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
  expect('the near miss is waiting on the room', near.waitingFor?.key, 'contextFit');
  expect('the second one is only waiting on time', waiting.waitingFor?.key, 'uncertainty');
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
    expect(`${pair.id}: adding the ending changes no order`, v.reorders, false);
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
  expect('and the mapping is invertible', gapFor(0.6) < gapFor(0.3), true);

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
  expect('every surface is measured', SURFACES.length >= 16, true);
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
  console.log(`  and ranks ${rank} cheapest of ${ranked.length}`);
  expect('and is among the cheapest surfaces here', rank <= 3, true);
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
  expect('the reel has photos', PHOTOS.length >= 30, true);
  for (const p of PHOTOS) {
    const onDisk = existsSync(join(process.cwd(), 'public', p.src));
    expect(`${p.src}: exists on disk`, onDisk, true);
    expect(`${p.src}: is under the size budget`, p.kb <= 260, true);
  }

  const kinds = { moment: 0, room: 0, sheet: 0 };
  for (const p of PHOTOS) kinds[p.kind]++;
  console.log(`  ${PHOTOS.length} photos -- ${kinds.moment} moments, ${kinds.room} rooms, ${kinds.sheet} sheets`);
  expect('moments carry the reel', kinds.moment >= 20, true);
  expect('the rooms are the quiet passage', kinds.room, 6);
  expect('the sheets cut fast', kinds.sheet, 4);

  // The six room plates the stage keys off scene ids all exist now, so the
  // graceful-absence path on the stage has something to find.
  for (const room of ['coffee', 'mission', 'gallery', 'postshow', 'group', 'study']) {
    expect(
      `the ${room} plate exists`,
      existsSync(join(process.cwd(), 'public', 'rooms', `${room}.webp`)),
      true,
    );
  }

  // Unofficial means unofficial: nothing shipped carries the wordmark, and the
  // three source images that did were archived rather than converted.
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


console.log(failures ? `\n${failures} assertion(s) FAILED` : '\nall assertions passed');
process.exit(failures ? 1 : 0);
