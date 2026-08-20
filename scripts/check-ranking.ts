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

import { PAIRS } from '../src/data/pairs';
import { WEEK_TWO } from '../src/data/weekTwo';
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

console.log(failures ? `\n${failures} assertion(s) FAILED` : '\nall assertions passed');
process.exit(failures ? 1 : 0);
