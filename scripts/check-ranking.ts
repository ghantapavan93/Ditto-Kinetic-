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
import { CLOUD_COUNT, possibilityCloud } from '../src/lib/possibility';
import { HELD_BACK } from '../src/data/heldBack';
import { heldBack } from '../src/lib/restraint';
import { privateSignals } from '../src/lib/redaction';
import { QUESTIONS, STARTING_TRAITS } from '../src/data/livingProfile';
import { ACTIONABLE, CONFIDENCE_CEILING, applyAnswer, unknowns } from '../src/lib/profile';
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


console.log(failures ? `\n${failures} assertion(s) FAILED` : '\nall assertions passed');
process.exit(failures ? 1 : 0);
