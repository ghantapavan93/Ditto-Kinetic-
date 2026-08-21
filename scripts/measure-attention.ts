import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Measure what this site costs to look at.
 *
 * The attention budget is only worth building if the numbers are measured
 * rather than estimated, and the one population I can measure honestly is this
 * repository. So this walks the component source for every route, counts the
 * words a reader is actually shown and the decisions they are actually offered,
 * and writes the result into `src/data/attentionInventory.ts`.
 *
 * `npm run check` re-runs it with `--check` and fails if the committed
 * inventory has drifted, so the audit cannot quietly go stale while the site
 * grows — which would be a particularly embarrassing way for a page about
 * attention cost to be wrong.
 *
 * The method and its limits, stated because a measurement whose method is
 * hidden is an estimate wearing better clothes:
 *
 *   WORDS      text between JSX tags, plus prose held in string literals —
 *              the copy tables several surfaces render from. Interpolated
 *              values count as one word each, which under-counts a long
 *              derived sentence and over-counts a number.
 *   DECISIONS  `<button`, `<Link` and `onClick` occurrences. A control rendered
 *              in a loop counts once in source and many times on screen, so
 *              this is a floor rather than a ceiling.
 *
 * The literal pass exists because the first version did not have one, and the
 * audit's own assertion caught the consequence: the index renders seventeen
 * sentences out of a `const` object, the scanner saw one interpolation, and the
 * page measured as the cheapest thing on the site. Copy is copy wherever it
 * happens to be declared.
 *
 * Literals are extracted with a character scanner rather than a regular
 * expression. Two regex attempts both failed the same way — pairing the closing
 * quote of one entry with the opening quote of the next, so a copy table read
 * as a list of ": " and every sentence in it vanished. A scanner cannot make
 * that mistake, because it only ever looks for the delimiter it opened with.
 */

const ROOT = join(process.cwd(), 'src');

/** Which component tree belongs to which route. */
const ROUTES: { path: string; dir: string; kind: 'argument' | 'product' }[] = [
  { path: '/', dir: 'components/stage', kind: 'argument' },
  { path: '/compiler', dir: 'components/compiler', kind: 'product' },
  { path: '/app', dir: 'components/app', kind: 'product' },
  { path: '/wednesday', dir: 'components/drop', kind: 'product' },
  { path: '/after', dir: 'components/after', kind: 'product' },
  { path: '/next-wednesday', dir: 'components/nextwednesday', kind: 'product' },
  { path: '/profile', dir: 'components/profile', kind: 'product' },
  { path: '/held-back', dir: 'components/restraint', kind: 'argument' },
  { path: '/double', dir: 'components/double', kind: 'argument' },
  { path: '/ending', dir: 'components/ending', kind: 'argument' },
  { path: '/odds', dir: 'components/odds', kind: 'argument' },
  { path: '/network', dir: 'components/network', kind: 'argument' },
  { path: '/world', dir: 'components/world', kind: 'argument' },
  { path: '/zoom', dir: 'components/zoom', kind: 'argument' },
  { path: '/gravity', dir: 'components/gravity', kind: 'argument' },
  { path: '/weather', dir: 'components/weather', kind: 'argument' },
  { path: '/next', dir: 'components/next', kind: 'argument' },
  // Including itself. An audit that exempted the auditor would be worth nothing.
  { path: '/attention', dir: 'components/attention', kind: 'argument' },
  { path: '/all', dir: 'components/all', kind: 'argument' },
  { path: '/autonomy', dir: 'components/autonomy', kind: 'argument' },
  { path: '/end', dir: 'components/end', kind: 'product' },
  { path: '/possibility', dir: 'components/possibility', kind: 'product' },
  { path: '/moments', dir: 'components/moments', kind: 'product' },
  { path: '/vision', dir: 'components/vision', kind: 'argument' },
];

function files(dir: string): string[] {
  const full = join(ROOT, dir);
  try {
    return readdirSync(full)
      .filter((f) => f.endsWith('.tsx'))
      .map((f) => join(full, f))
      .filter((f) => statSync(f).isFile());
  } catch {
    return [];
  }
}

const QUOTES = new Set(["'", '"']);
const BACKSLASH = String.fromCharCode(92);

/** Every quoted string in source order. Delimiters pair by construction. */
function stringLiterals(source: string): string[] {
  const out: string[] = [];
  let i = 0;

  while (i < source.length) {
    const quote = source[i];

    if (!QUOTES.has(quote)) {
      i++;
      continue;
    }

    let j = i + 1;
    let value = '';

    while (j < source.length && source[j] !== quote && source[j] !== '\n') {
      if (source[j] === BACKSLASH) {
        j += 2;
        continue;
      }
      value += source[j];
      j++;
    }

    // Unterminated on this line: not a literal. Step past and keep scanning.
    if (source[j] !== quote) {
      i++;
      continue;
    }

    out.push(value);
    i = j + 1;
  }

  return out;
}

const WORD = /^[a-z][a-z'’,.—-]*$/i;
const STYLING = /(?:flex|grid|absolute|relative|rounded|border|tracking|leading|uppercase|lowercase)/;

/** Does this literal read as something a person was meant to read? */
function isProse(text: string): boolean {
  if (!text.includes(' ')) return false;
  if (!/[a-z]{3}/.test(text)) return false;
  // Class lists, CSS, paths and arrow functions are not copy.
  if (/[-:/]\d|rgba?\(|=>|@\//.test(text)) return false;
  if (STYLING.test(text)) return false;
  return true;
}

function measure(source: string): { words: number; decisions: number } {
  const withoutComments = source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ');

  const decisions =
    (withoutComments.match(/<button\b/g)?.length ?? 0) +
    (withoutComments.match(/<Link\b/g)?.length ?? 0) +
    (withoutComments.match(/onClick=/g)?.length ?? 0);

  // Text nodes: what sits between a closing bracket and an opening one.
  const between = withoutComments.match(/>[^<>{}]+</g) ?? [];
  const prose = between
    .map((chunk) => chunk.slice(1, -1))
    .join(' ')
    .replace(/&[a-z]+;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  const inlineWords = prose ? prose.split(' ').filter((w) => WORD.test(w)).length : 0;

  // Every interpolated value is one more thing to read.
  const interpolations = withoutComments.match(/\{[a-zA-Z][\w.?[\]()]*\}/g)?.length ?? 0;

  const declaredWords = stringLiterals(withoutComments)
    .filter(isProse)
    .join(' ')
    .split(/\s+/)
    .filter((w) => WORD.test(w)).length;

  return { words: inlineWords + interpolations + declaredWords, decisions };
}

const rows = ROUTES.map((route) => {
  const totals = files(route.dir).reduce(
    (acc, file) => {
      const m = measure(readFileSync(file, 'utf8'));
      return { words: acc.words + m.words, decisions: acc.decisions + m.decisions };
    },
    { words: 0, decisions: 0 },
  );
  return { ...route, ...totals };
});

const out = `import type { Surface } from '@/lib/attention';

/**
 * GENERATED by \`scripts/measure-attention.ts\`. Do not edit by hand.
 *
 * Counted from component source rather than authored, and re-measured by
 * \`npm run check\` so it cannot drift as the site grows. The method and its
 * limits are documented in the script.
 */
export const SURFACES: Surface[] = ${JSON.stringify(
  rows.map((r) => ({ path: r.path, kind: r.kind, words: r.words, decisions: r.decisions })),
  null,
  2,
)};
`;

const target = join(ROOT, 'data', 'attentionInventory.ts');

if (process.argv.includes('--check')) {
  const current = readFileSync(target, 'utf8');
  if (current.trim() !== out.trim()) {
    console.error('attention inventory is stale — run: npm run measure');
    process.exit(1);
  }
  console.log('attention inventory is current');
} else {
  writeFileSync(target, out);
  console.log(`wrote ${relative(process.cwd(), target)} — ${rows.length} surfaces`);
}
