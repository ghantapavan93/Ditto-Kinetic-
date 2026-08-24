/**
 * Build the film exports from the source shots in public/film.
 *
 * Sources are never touched. Everything generated lands in
 * public/film/exports/: the ~54s master edit, the 14s teaser, the muted
 * homepage hero, the /film poster and one poster frame per shot for THE CUT.
 *
 * The trim map is the edit. Every cut is a hard cut — the physical rhythm
 * the brief asks for — and all typography stays in the DOM, so nothing here
 * burns text into a frame.
 */
import ffmpegPath from 'ffmpeg-static';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'public/film';
const OUT = 'public/film/exports';
mkdirSync(join(OUT, 'posters'), { recursive: true });

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

function concatArgs(cuts, outFile, { width = 1920, height = 1080, audio = true, crf = 20 } = {}) {
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
    '-c:v', 'libx264', '-preset', 'medium', '-crf', String(crf),
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

console.log('hero (muted, lighter)…');
ff(concatArgs([{ file: EDIT[3].file, in: 0.0, out: 8.0 }], join(OUT, 'hero.mp4'), { audio: false, crf: 26, width: 1280, height: 720 }));

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
