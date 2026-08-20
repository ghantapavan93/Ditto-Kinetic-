/**
 * The one thing that must never silently break.
 *
 * FIRST SCENE claims to be a system rather than a hardcoded cinematic. The
 * evidence for that claim is narrow and specific: run the *same* scorer with the
 * *same* weights over the *same* six rooms, change only the two people, and the
 * ranking inverts. If that stops being true, the piece is a lie regardless of
 * how good the animation looks.
 *
 *   npm run check
 */

import { PAIRS } from '../src/data/pairs';
import { rankScenes, scoreScene } from '../src/lib/rankScenes';

let failures = 0;

function expect(label: string, actual: unknown, wanted: unknown) {
  const ok = actual === wanted;
  if (!ok) failures++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}: ${actual}${ok ? '' : ` (expected ${wanted})`}`);
}

for (const pair of PAIRS) {
  console.log(`\n${pair.id}`);
  const ranked = rankScenes(pair);
  ranked.forEach((r) =>
    console.log(`  ${r.rank}. ${r.scene.label.padEnd(16)} ${r.utility.toFixed(4)}`),
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

console.log('\nCentral claim — same engine, different people, inverted answer:');
const one = rankScenes(PAIRS[0]);
const two = rankScenes(PAIRS[1]);
expect('pair 1 winner is the post-show walk', one[0].scene.id, 'postshow');
expect('pair 1 ranks coffee 5th', one.find((r) => r.scene.id === 'coffee')?.rank, 5);
expect('pair 2 winner is coffee', two[0].scene.id, 'coffee');
expect('pair 2 ranks the post-show walk last', two.find((r) => r.scene.id === 'postshow')?.rank, 6);

console.log(failures ? `\n${failures} assertion(s) FAILED` : '\nall assertions passed');
process.exit(failures ? 1 : 0);
