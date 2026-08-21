import { spawnSync } from 'node:child_process';

/**
 * Run every check, then report all of them.
 *
 * `npm run check` was a chain of `&&`, which stops at the first failure. That
 * is the right default for a build step and the wrong one for this: the suite
 * exists to tell you what is wrong, and a chain tells you only what is wrong
 * first. Corrupting all four generated files produced exactly one line of
 * output, because the claim suite failed ahead of them and the drift guards
 * never ran at all.
 *
 * So every stage runs, every failure is reported, and the exit code is still
 * non-zero if any of them failed. Output from a passing stage is summarised to
 * its last line; a failing stage prints in full, because that is the one you
 * needed to see.
 */

const STAGES = [
  { name: 'claims', cmd: 'npx', args: ['tsx', 'scripts/check-ranking.ts'] },
  { name: 'attention inventory', cmd: 'npx', args: ['tsx', 'scripts/measure-attention.ts', '--check'] },
  { name: 'photo manifest', cmd: 'node', args: ['scripts/build-photo-manifest.mjs', '--check'] },
  { name: 'proof', cmd: 'node', args: ['scripts/build-proof.mjs', '--check'] },
  { name: 'contrast', cmd: 'node', args: ['scripts/contrast.mjs', '--check'] },
];

const results = [];

for (const stage of STAGES) {
  const run = spawnSync(stage.cmd, stage.args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    maxBuffer: 64 * 1024 * 1024,
  });

  const output = `${run.stdout ?? ''}${run.stderr ?? ''}`.trimEnd();
  const ok = run.status === 0;
  results.push({ name: stage.name, ok, output });

  if (ok) {
    const lines = output.split('\n').filter(Boolean);
    console.log(`\n✓ ${stage.name} — ${lines[lines.length - 1] ?? 'passed'}`);
  } else {
    console.log(`\n✗ ${stage.name}`);
    console.log(output);
  }
}

const failed = results.filter((r) => !r.ok);

console.log('\n' + '─'.repeat(60));
if (failed.length === 0) {
  console.log(`all ${results.length} checks passed`);
} else {
  console.log(
    `${failed.length} of ${results.length} checks failed: ${failed.map((f) => f.name).join(', ')}`,
  );
}

process.exit(failed.length === 0 ? 0 : 1);
