/**
 * Build the film exports from the source shots in public/film.
 *
 * Source FOOTAGE is never touched — no re-encode, no trim, no rename. The
 * one thing this script does do to a source is normalize its container to
 * faststart (a `-c copy` remux that moves the moov index to the front,
 * streams bit-identical): THE CUT plays the sources directly, and nine of
 * the ten originally parked their moov after the mdat, which forced a
 * browser to download 8–12MB before showing a first frame.
 *
 * Everything generated lands in public/film/exports/: the ~54s master
 * edit, the 14s teaser, the muted homepage hero, the combined cold-open
 * intro, the /film poster and one poster frame per shot for THE CUT.
 *
 * The trim map is the edit. Every cut is a hard cut — the physical rhythm
 * the brief asks for — and all typography stays in the DOM, so nothing here
 * burns text into a frame.
 */
import ffmpegPath from 'ffmpeg-static';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, openSync, readSync, closeSync, renameSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'public/film';
const OUT = 'public/film/exports';
mkdirSync(join(OUT, 'posters'), { recursive: true });

/** True when the file's moov atom precedes its mdat (streams progressively). */
function isFaststart(path) {
  const fd = openSync(path, 'r');
  try {
    const head = Buffer.alloc(8);
    let pos = 0;
    const order = [];
    while (order.length < 6) {
      if (readSync(fd, head, 0, 8, pos) < 8) break;
      let size = head.readUInt32BE(0);
      const name = head.toString('latin1', 4, 8);
      order.push(name);
      if (size === 1) {
        const big = Buffer.alloc(8);
        readSync(fd, big, 0, 8, pos + 8);
        size = Number(big.readBigUInt64BE(0));
      } else if (size === 0) break;
      pos += size;
    }
    return order.includes('moov') && order.includes('mdat') && order.indexOf('moov') < order.indexOf('mdat');
  } finally {
    closeSync(fd);
  }
}

console.log('sources (faststart normalize)…');
for (const entry of readdirSync(SRC, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.mp4')) continue;
  const path = join(SRC, entry.name);
  if (isFaststart(path)) continue;
  const tmp = `${path}.faststart.tmp.mp4`;
  ff(['-i', path, '-c', 'copy', '-movflags', '+faststart', tmp]);
  if (statSync(tmp).size > 0) renameSync(tmp, path);
  console.log(`  normalized: ${entry.name}`);
}

/** The nine shots, in narrative order, with the master's in/out points. */
export const EDIT = [
  { id: 'wednesday', file: 'Phone_vibrating_on_desk_SCENE -1.mp4', in: 0.5, out: 4.5 },
  { id: 'open', file: 'Transition_from_message_to_thought_SHOT SCENE-2.mp4', in: 1.0, out: 4.0 },
  { id: 'coffee', file: 'Two_students_talking_in_café_SHOT-3.mp4', in: 1.0, out: 6.0 },
  { id: 'turn', file: 'People_transforming_environment_1080p_SHOT -4.mp4', in: 0.0, out: 8.0 },
  { id: 'thisone', file: 'Maya_and_Jonah_walking_1080p_SHOT-5.mp4', in: 0.5, out: 6.5 },
  { id: 'break', file: 'People_approaching_food_stand_1080p_SHOT-6.mp4', in: 0.8, out: 6.8 },
  { id: 'collapse', file: 'Paper_ticket_transitions_to_mess…_SHOT-7.mp4', in: 1.0, out: 6.0 },
  { id: 'phonesdown', file: 'Smartphones_left_on_counter_1080p_SHOT-8.mp4', in: 0.5, out: 7.5 },
  { id: 'ditto', file: 'Brand Marketing wherever needed.mp4', in: 0.0, out: 10.0 },
];

const ff = (args) => execFileSync(ffmpegPath, ['-y', '-v', 'error', ...args], { stdio: 'inherit' });

function concatArgs(cuts, outFile, { width = 1920, height = 1080, audio = true, crf = 20, preset = 'medium' } = {}) {
  const inputs = cuts.flatMap((c) => ['-i', join(SRC, c.file)]);
  const parts = cuts
    .map((c, i) => {
      const v = `[${i}:v]trim=${c.in}:${c.out},setpts=PTS-STARTPTS,scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:-1:-1,fps=24,format=yuv420p[v${i}];`;
      const a = audio ? `[${i}:a]atrim=${c.in}:${c.out},asetpts=PTS-STARTPTS,aresample=48000[a${i}];` : '';
      return v + a;
    })
    .join('');
  const maps = cuts.map((_, i) => (audio ? `[v${i}][a${i}]` : `[v${i}]`)).join('');
  const concat = `${maps}concat=n=${cuts.length}:v=1:a=${audio ? 1 : 0}[v]${audio ? '[a]' : ''}`;
  return [
    ...inputs,
    '-filter_complex', parts + concat,
    '-map', '[v]', ...(audio ? ['-map', '[a]'] : []),
    '-c:v', 'libx264', '-preset', preset, '-crf', String(crf),
    ...(audio ? ['-c:a', 'aac', '-b:a', '192k'] : ['-an']),
    '-movflags', '+faststart',
    outFile,
  ];
}

console.log('master…');
ff(concatArgs(EDIT, join(OUT, 'first-scene-film.mp4'), { crf: 23 }));

console.log('teaser…');
const TEASER = [
  { file: EDIT[0].file, in: 1.5, out: 3.5 },
  { file: EDIT[2].file, in: 2.0, out: 4.0 },
  { file: EDIT[3].file, in: 1.0, out: 6.0 },
  { file: EDIT[4].file, in: 2.0, out: 5.0 },
  { file: EDIT[7].file, in: 5.0, out: 7.0 },
];
ff(concatArgs(TEASER, join(OUT, 'first-scene-teaser.mp4'), { crf: 24 }));

console.log('hero (muted, full-bleed)…');
// Full 1080p: this plays sharp behind the homepage intro now, not blurred,
// so it renders at viewport width and 720p would visibly soften.
ff(concatArgs([{ file: EDIT[3].file, in: 0.0, out: 8.0 }], join(OUT, 'hero.mp4'), { audio: false, crf: 27 }));

// The intro's companion stills: the exact first frame doubles as the video
// poster (paint and playback stay continuous), and the final marquee frame
// stands in for the whole video under reduced motion.
ff(['-i', join(OUT, 'hero.mp4'), '-frames:v', '1', '-vf', 'scale=1600:-1', join(OUT, 'hero-first.webp')]);
ff(['-sseof', '-0.15', '-i', join(OUT, 'hero.mp4'), '-frames:v', '1', '-vf', 'scale=1600:-1', '-q:v', '68', join(OUT, 'hero-hold.webp')]);

// The homepage cold open: the storyboard cut whole, then the world-turn out
// of its black — one faststart file, never the raw sources (the storyboard
// source parks its moov atom after the mdat, which makes a browser fetch
// nearly the entire file before frame one). The poster is the export's own
// first frame so paint and playback are continuous.
if (existsSync(join(SRC, 'Ditto_brand_sequence_storyboard_1080p_202608240400.mp4'))) {
  console.log('intro (storyboard + world-turn, faststart, with audio)…');
  ff(concatArgs(
    [
      { file: 'Ditto_brand_sequence_storyboard_1080p_202608240400.mp4', in: 0.0, out: 10.0 },
      { file: EDIT[3].file, in: 0.0, out: 8.0 },
    ],
    join(OUT, 'intro.mp4'),
    // The opening is the first thing anyone sees; it gets the patient
    // encode. CRF 22 at preset slow keeps the source's texture — the paper
    // grain in the baked lettering, the tonal falloff on the campus walk —
    // that the earlier CRF 26 visibly flattened.
    { crf: 22, preset: 'slow' },
  ));
  // The same cut at 720p/~1.9Mbps for clients that report a slow or
  // data-saving connection — the intro chooses at runtime.
  ff(concatArgs(
    [
      { file: 'Ditto_brand_sequence_storyboard_1080p_202608240400.mp4', in: 0.0, out: 10.0 },
      { file: EDIT[3].file, in: 0.0, out: 8.0 },
    ],
    join(OUT, 'intro-720.mp4'),
    { crf: 24, preset: 'slow', width: 1280, height: 720 },
  ));
  ff(['-i', join(OUT, 'intro.mp4'), '-frames:v', '1', '-vf', 'scale=1600:-1', join(OUT, 'intro-first.webp')]);
}

console.log('posters…');
const POSTER_AT = { wednesday: 2.0, open: 2.5, coffee: 3.0, turn: 4.0, thisone: 2.0, break: 4.0, collapse: 4.0, phonesdown: 6.0, ditto: 4.0 };
for (const c of EDIT) {
  ff(['-ss', String(POSTER_AT[c.id]), '-i', join(SRC, c.file), '-frames:v', '1', '-vf', 'scale=960:-1', join(OUT, 'posters', `${c.id}.webp`)]);
}
// the /film pre-play poster: the marquee laugh
ff(['-ss', '2.0', '-i', join(SRC, EDIT[4].file), '-frames:v', '1', '-vf', 'scale=1600:-1', join(OUT, 'poster.webp')]);

// the tenth strip for THE CUT: the storyboard alternate (baked type, so it
// never enters the master — but it is part of the record)
if (existsSync(join(SRC, 'Ditto_brand_sequence_storyboard_1080p_202608240400.mp4'))) {
  ff(['-ss', '1.0', '-i', join(SRC, 'Ditto_brand_sequence_storyboard_1080p_202608240400.mp4'), '-frames:v', '1', '-vf', 'scale=960:-1', join(OUT, 'posters', 'storyboard.webp')]);
}
console.log('done.');
