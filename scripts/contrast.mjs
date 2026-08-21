import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Measure the contrast of every Tailwind text colour in the source.
 *
 * An accessibility review counted 406 text usages below the WCAG AA 4.5:1
 * minimum on this site's ink background, including the disclosure that names
 * the project as unofficial. That is not a thing to fix once — 406 call sites
 * will drift back the moment somebody types `text-paper/30` because it looked
 * right on their screen.
 *
 * So it is measured the way everything else here is measured: composite each
 * `text-<token>/<alpha>` against the surface it actually sits on, compute the
 * ratio, and let `npm run check` fail on a regression. The palette is read from
 * tailwind.config.ts rather than restated, because a second copy of a colour is
 * the same defect as a second copy of a number.
 */

const ROOT = process.cwd();
const CHECK_ONLY = process.argv.includes('--check');
const OUT = join(ROOT, 'src', 'data', 'contrastReport.ts');

/** WCAG AA for normal-size text. */
export const AA_NORMAL = 4.5;

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

function luminance([r, g, b]) {
  const srgb = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function ratio(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/** Alpha-composite a foreground over an opaque background. */
function composite(fg, bg, alpha) {
  return fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha)));
}

/** Read the palette out of the Tailwind config rather than restating it. */
function palette() {
  const config = readFileSync(join(ROOT, 'tailwind.config.ts'), 'utf8');
  const out = {};
  let group = null;

  // The palette is nested -- `ink: { DEFAULT, soft, line }` -- so a flat regex
  // would happily record a colour called "DEFAULT" and then fail to find `ink`.
  for (const raw of config.split(String.fromCharCode(10))) {
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

    if (group) {
      out[key === 'DEFAULT' ? group : `${group}-${key}`] = hex;
    } else {
      out[key] = hex;
    }
  }
  return out;
}

const PALETTE = palette();

/**
 * Which surface a token belongs on.
 *
 * An earlier version of this script tried to infer the background by scanning
 * backwards through the file for a light-surface class. It was not sound --
 * a `u-paper` anywhere in the previous nine hundred characters captured every
 * token after it -- and it produced obvious nonsense: `text-paper` reported at
 * 1:1, which would mean invisible text on the busiest surface in the project.
 *
 * Inference was the wrong tool. The design system already pairs them: `paper`
 * is the token FOR dark surfaces and `ink` is the token FOR light ones. That
 * pairing is the whole reason both exist, so it is used directly instead of
 * guessed at. Accent colours sit on the dark stage.
 *
 * The cost of this is honest and worth stating: a `text-paper` deliberately
 * placed on a light panel would be scored against the wrong background. Nothing
 * in this project does that -- it would be invisible -- and a wrong reading
 * that loud would be caught by looking.
 */
const ON_LIGHT = new Set([
  'ink', 'ink-line', 'ink-soft', 'ink-raised',
  'cobalt', 'cobalt-deep', 'acid-deep',
]);

function surfaceFor(token) {
  return ON_LIGHT.has(token) ? PALETTE.paper : PALETTE.ink;
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    // .css too: `@apply ... text-paper/35` inside globals.css is a text
    // colour like any other, and leaving it out let the guard report zero
    // failures while `.u-micro` shipped at 2.86:1 -- a check that passes
    // because it is not looking is worse than no check.
    else if (/\.(tsx?|css)$/.test(entry)) files.push(full);
  }
  return files;
}

// Hyphenated variants are their own tokens: `text-cobalt-glow` must not match
// as `text-cobalt`. A word boundary sits between them, so the prefix matched
// and a legible variant was reported as its illegible base -- which then sent
// a sweep to "fix" a span that was already correct on its light card.
const TOKEN = new RegExp(
  'text-(' +
    ['paper-dim','paper-bright','paper-shadow','paper',
     'ink-line','ink-soft','ink-raised','ink',
     'acid-deep','acid','mint','tungsten','amber','rust','ticket',
     'cobalt-glow','cobalt-deep','cobalt'].join('|') +
    ')(?:\\/(\\d{1,3}))?(?![\\w-])',
  'g',
);

function audit() {
  const failures = [];
  let checked = 0;

  for (const file of walk(join(ROOT, 'src'))) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(TOKEN)) {
      const [full, token, alphaRaw] = match;
      const hex = PALETTE[token];
      if (!hex) continue;

      /*
       * The exemption belongs to the token, not the line.
       *
       * This skipped the whole physical line if `disabled:` appeared anywhere
       * on it -- and these are long className strings, so one disabled variant
       * excused every other colour sitting beside it. Only a token actually
       * prefixed `disabled:` is exempt now, which is what 1.4.3 exempts.
       */
      if (source.slice(Math.max(0, match.index - 9), match.index) === 'disabled:') continue;

      const alpha = alphaRaw === undefined ? 1 : Number(alphaRaw) / 100;
      const bg = hexToRgb(surfaceFor(token));
      const fg = composite(hexToRgb(hex), bg, alpha);
      const value = ratio(fg, bg);
      checked++;

      if (value < AA_NORMAL) {
        failures.push({
          file: relative(ROOT, file).replace(/\\/g, '/'),
          line: source.slice(0, match.index).split('\n').length,
          className: full,
          ratio: Number(value.toFixed(2)),
        });
      }
    }
  }
  return { checked, failures };
}

const { checked, failures } = audit();

const byClass = new Map();
for (const f of failures) byClass.set(f.className, (byClass.get(f.className) ?? 0) + 1);
const worst = [...byClass.entries()].sort((a, b) => b[1] - a[1]);

const next = `// GENERATED by scripts/contrast.mjs — do not edit.
// Run \`npm run contrast\` after changing a text colour. \`npm run check\` fails on drift.
//
// Every Tailwind text token in src/, composited against the surface it sits on
// and measured against WCAG AA for normal text (4.5:1). An earlier review found
// 406 failures, including the unofficial-project disclosure at 2.23:1.

export type ContrastReport = {
  /** Text-colour usages measured. */
  checked: number;
  /** Usages below 4.5:1. */
  failing: number;
};

export const CONTRAST: ContrastReport = {
  checked: ${checked},
  failing: ${failures.length},
};
`;

if (CHECK_ONLY) {
  let current = '';
  try {
    current = readFileSync(OUT, 'utf8');
  } catch {
    console.error('contrast report missing — run: npm run contrast');
    process.exit(1);
  }
  if (current.trim() !== next.trim()) {
    console.error('contrast report is stale — run: npm run contrast');
    process.exit(1);
  }
  console.log(`contrast report is current (${failures.length} failing of ${checked})`);
} else {
  writeFileSync(OUT, next);
  console.log(`${checked} text usages measured, ${failures.length} below ${AA_NORMAL}:1\n`);
  for (const [cls, count] of worst.slice(0, 18)) {
    const sample = failures.find((f) => f.className === cls);
    console.log(`  ${String(count).padStart(3)}x  ${cls.padEnd(22)} ${sample.ratio}:1`);
  }
  if (failures.length) {
    console.log('\nworst individual:');
    for (const f of [...failures].sort((a, b) => a.ratio - b.ratio).slice(0, 6)) {
      console.log(`  ${f.ratio}:1  ${f.file}:${f.line}  ${f.className}`);
    }
  }
}
