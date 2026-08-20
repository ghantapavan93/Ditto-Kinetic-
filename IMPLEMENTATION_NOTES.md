# IMPLEMENTATION NOTES

Engineering decisions worth defending, and the things I'd fix next.

---

## Architecture

```
DOM  ─ typography, reasoning, decision view, feedback, accessibility, all copy
WebGL ─ physical feeling: separation, misalignment, settling, the snap
```

The split is strict. **No text a user needs lives inside the canvas.** Every
label, every verdict, every piece of evidence is real DOM: selectable,
translatable, screen-readable, and present when WebGL is unavailable. The canvas
owns exactly one job — making a bad context *feel* bad before it is explained.

### State

One Zustand store (`src/store/prototypeStore.ts`), with domain and view state
kept distinct in meaning even though they share a container:

- **Domain** — `phase`, `pairId`, `sceneId`, `brokenSceneId`, `feedback`. Survives
  resize, remount, hot reload.
- **View** — `dialPosition`. Free to be clobbered at any time.

`phase` is a nine-state machine (`intro → exploring → selected → reasoning →
decision → handoff → quiet → post-date → memory`). One rule is load-bearing:
changing scene while a scene is selected drops back to `exploring`, because the
commitment was to *that* opening and cannot survive changing it.

### The scoring layer

`src/lib/rankScenes.ts` is a deterministic linear utility over eleven
dimensions. No LLM, no randomness, no hidden state — the same six rooms score
identically on every machine and every reload.

That is a product decision, not laziness:

- The decision view can show the arithmetic, so the ranking is arguable rather
  than authoritative.
- The demo cannot fail because a network call did.
- Ties break on *lower uncertainty* — when two openings look equally good, prefer
  the one we understand better.

Three terms enter negatively, and `uncertainty` is one of them. The system is
penalised for what it doesn't know rather than allowed to round it away.

### Abstention

`sendDecision(pair, conditions)` is the layer above ranking, and it is the
difference between a sort and a decision: `rankScenes` always has a first
element, but `sendDecision` can return `{ send: false }`.

The send bar (`SEND_THRESHOLD = 0.48`) is placed deliberately. In a normal week
it sits *above* COFFEE and STUDY BREAK for Maya × Jonah — the system would
rather send nothing than send those — and for Priya × Theo exactly one of six
openings clears it, which is the honest shape of that week rather than a menu.

The strain transform is the interesting part. It degrades `scheduleFit`,
`attendanceLikelihood`, `firstFifteenMinutesForecast`, `socialPressure` and
`uncertainty`, and deliberately leaves `pairSignal` and `contextFit` untouched.
That is not a detail — it is what lets the abstention copy make a true claim
("pair signal did not move, the week did") rather than a consoling one. There is
an assertion in `npm run check` that fails if a future edit ever lets a bad week
reach either field.

### The reason field

Fragments belong to the **pair**, not the scene. "both ambitious, maybe too
ambitious" is true of Maya and Jonah in every room; what the room decides is
whether it ever surfaces. Each fragment carries a `surfacesAt` threshold, so a
bad context is not just two people held apart — it is two people held apart with
almost nothing visible between them, and the winning scene fills that space with
evidence.

`tension` fragments are the honest ones: they surface *first*, they vibrate
rather than settle, and they do not go away when the scene improves, because
"maybe too ambitious" is not fixed by picking a better venue. `npm run check`
asserts that ordering — if the difficult reasons ever surfaced later than the
flattering ones, the field would be flattery rather than evidence.

### Magnetism

`magnetismFor(pair, sceneId)` normalises a scene's utility against the best and
worst that *this pair* can achieve, and that single 0..1 number drives everything
physical: card separation, rotational misalignment, line slack, artifact settling,
camera distance, opacity. One scalar, derived from the domain model, driving the
entire stage. Nothing in the WebGL layer holds its own opinion about which scene
is good.

---

## WebGL specifics

- **Camera is authored.** No orbit controls. The user gets a few degrees of
  pointer parallax and nothing else, because a user-framed shot would break every
  composition in the piece.
- **No per-frame allocation.** The connection line allocates its geometry once
  and rewrites the position attribute in place. Card geometry and paper material
  are module-scope singletons shared by both polaroids.
- **All textures are procedural and cached.** Portraits (`lib/portrait.ts`) and
  artifacts (`lib/artifacts.ts`) are drawn once to a canvas, keyed, and reused —
  so a scene change or pair swap never re-rasterises anything. Zero image bytes
  ship.
- **`dpr` capped at 1.5.** Above that the grain and paper stop reading better and
  start costing frames.
- **`delta` clamped to 1/30** in every `useFrame`, so a stalled tab returning to
  the foreground doesn't teleport objects.
- **No postprocessing.** Bloom and chromatic aberration were considered and cut —
  a bloom pass would have made the "inevitable" scene louder, not more inevitable,
  and it costs a full-screen pass on every device. The mood work is done by
  lighting and composition instead.
- **`@react-three/drei` was removed.** It was pulled in for one `RoundedBox`;
  that is now a hand-built `ExtrudeGeometry` with a small bevel — the bevel is
  what gives the paper edge a highlight instead of a hard black line.

## Motion

One vocabulary (`src/lib/motion.ts`) shared by DOM and WebGL: `settle` for
objects coming to rest, `snap` for the selection, `copy` for text (no overshoot —
copy should never bounce). Frame-rate independent exponential damping everywhere,
so behaviour is identical at 60 and 120 Hz.

## Accessibility

- Full keyboard path: `←/→` scene, `Enter` select then open reasoning, `D`
  decision view, `Esc` close.
- The dial is a real `role="slider"` with `aria-valuenow`/`aria-valuetext`, so it
  announces "POST SHOW WALK, 8:32 PM" rather than a number.
- 44px minimum touch targets on every action.
- `prefers-reduced-motion` is a **product mode**, not a degradation: objects
  arrive at their positions instead of travelling, and the idle unrest that
  expresses "this hasn't settled" becomes static offset. State still changes; it
  just doesn't move.
- WebGL failure renders a flat DOM composition rather than an empty stage.
- `<noscript>` carries the thesis in prose.

## Privacy

The optional `/api/feedback` route sends **only the sentence the user typed** —
no names, ages, campus, scene metrics or identifiers. Model output is validated
with Zod against the same schema the deterministic reader satisfies, so a
malformed completion degrades to the local reader instead of reaching the UI.
Every failure path returns HTTP 200 with the fallback. With no
`ANTHROPIC_API_KEY` set — the default — the route is a pure function and the
whole demo is offline.

---

## Bugs found and fixed during QA

1. **Arrow keys double-advanced.** The window-level keyboard handler and the
   dial's own `onKeyDown` both fired when the dial had focus, skipping a scene
   per press. Fixed by having the window handler yield to `role="slider"`.
2. **`prototype_loaded` fired twice.** React's development double-invoked effects
   were corrupting the funnel. Session-scoped events are now idempotent.
3. **Headline lagged the dial.** `AnimatePresence mode="wait"` serialises each
   swap behind the previous exit animation, so spinning the dial left the copy
   several scenes behind. Changed to `popLayout` with a short fixed-duration exit
   that can never gate the next scene.
4. **OG image failed to build.** `@vercel/og` under the Node runtime resolves its
   fonts via `fileURLToPath`, which throws on any project path containing a space
   — and this one has two. Pinned back to the edge runtime.
5. **The ending could never arrive.** `AnimatePresence mode="wait"` in the handoff
   gated the final screen — *"go have a real life."* — behind the message card's
   exit animation completing. Any stall in that animation and the last beat of the
   entire piece simply never renders. Found because a backgrounded tab pauses
   `requestAnimationFrame`, but the fragility is real regardless: the closing
   state of a product should not depend on an animation finishing. Both stages now
   share one grid cell and the quiet screen mounts the instant state changes. The
   post-date receipt had the same flaw and got the same fix.

5. **The stage could never render if the page loaded in a background tab.**
   R3F sizes its canvas from a ResizeObserver and does not start the render
   loop until it has non-zero dimensions. If that first measurement never
   arrives, the canvas sits at its intrinsic 300x150, no frame ever renders,
   and there is **no recovery path** — the stage is black forever. This is not
   theoretical: it happened twice during this build, and both times it looked
   like a rendering bug rather than a measurement one. `SpatialStage` now nudges
   the observer on mount (rAF *and* a timer, since rAF is suspended while
   hidden) and again on `visibilitychange`, and drops the default 250ms measure
   debounce.
6. **The physical language had nowhere near enough range.** The whole argument
   is that a bad context should *feel* wrong, and the cards were moving about a
   third of their own width between the worst opening and the best — which reads
   as "shifted slightly", not "held apart". Worse, `spreadMin` was smaller than
   the card, so at full magnetism the two photographs *overlapped*, which reads
   as a z-fighting fault rather than as closeness. The gap now travels 1.93 →
   0.14 world units against a 1.42-wide card (3.6x the previous range) and never
   crosses. Three more channels were added alongside separation — height, depth
   and a stronger roll — so a weak scene is askew, unlevel, and on two different
   planes, and the winning one is square, level and sharing one.
7. **The wider separation immediately broke portrait viewports**, running the
   cards off both edges. Layout is now derived from the actual viewport
   (`computeStageLayout`), stacking the pair vertically and scaling the rig down
   in portrait.

## On verifying a physical interface

Three of the four bugs above were invisible to every check that existed. The
type-checker, the linter, the production build, the DOM assertions and the
ranking assertions all passed while the stage was rendering nothing at all.

Two of them I then misdiagnosed by eye, in opposite directions, by estimating
card positions from a compressed screenshot. So the stage now reports its own
geometry:

- `StageProbe` (development only) publishes live separation, scale, camera and
  per-card transforms to `window.__fsStage`.
- `magnetism` is attached to every `scene_changed` event, so the single number
  the entire stage is driven by is visible in the funnel. That is what proved
  magnetism was correct — spanning `coffee 0.06` to `postshow 1.0` — and moved
  the investigation to the geometry, where the bug actually was.
- `computeStageLayout` was extracted from its hook so the geometry can be
  asserted in `npm run check` with no browser: across five viewports, a wrong
  context must open a gap wider than a third of a card, a right one must come
  close *without* overlapping, and the arrangement must fit the screen.

The general lesson: when motion carries the meaning, "does it render" and "does
it move enough to be read" are correctness properties, and they need
instrumentation rather than screenshots.

## Known issues

- **The 3D stage still has not been watched in motion.** It has now been *seen*
  — rendered in a real Chrome window, which is how the four bugs above surfaced
  — but that browser tab was backgrounded, so `requestAnimationFrame` stayed
  suspended and only single un-animated frames were ever captured. The
  geometry is asserted and the still frames are right; the settling, the snap
  and the mood lighting in motion are not verified.

  What *was* verified programmatically, end to end: WebGL context creation and
  canvas sizing at capped DPR; the full phase machine (intro → exploring →
  selected → reasoning → decision → handoff → quiet → post-date → memory); the
  dial's `aria-valuetext` tracking through all six scenes; winner detection
  following the pair; the decision view's ranking and utilities matching the
  scorer exactly; the handoff message, the quiet ending, the feedback prompt,
  fragment highlighting, and the hypothesis rewrite; and the pair-swap inversion
  (COFFEE 0.633 first, POST SHOW WALK 0.328 last).

  What was *not* verified: anything visual. Composition, framing, the mood
  lighting, whether the snap actually reads as a snap, type sizing at real
  breakpoints, and whether the procedural portraits look like photographs or like
  smudges. Open it before showing it to anyone.
- **First Load JS is 373 kB**, almost entirely three.js. Acceptable for a WebGL
  piece, but a lazy `<Suspense>` boundary around the canvas with a DOM-only first
  paint would improve time-to-interactive on a phone.
- **The taste-calibration step from Ditto's real onboarding is not represented.**
  It would need generated faces to be meaningful, and stand-in silhouettes can't
  carry a "which one's your type" interaction honestly.
- **Second-pair copy is thinner than the first pair's.** Priya × Theo proves the
  system inverts, but Maya × Jonah got the writing.
- **Test coverage is one file.** `npm run check` asserts the three load-bearing
  claims: the ranking inverts between pairs; both pairs abstain under a strained
  week *without* `pairSignal` or `contextFit` moving; and piled disruptions
  withdraw the plan rather than shipping something under the bar. Nothing covers
  the components — the interaction layer is untested.
- **Sound is synthesised and minimal** — five short oscillator voices. Off by
  default; a real pass would use recorded paper and detent samples.

## Running it

```bash
npm install
npm run dev
```

Then `http://localhost:3000`. No environment variables required. Set
`ANTHROPIC_API_KEY` only if you want the post-date feedback interpreted by a
model instead of the deterministic reader; everything else works offline.

```bash
npm run build && npm start   # production
npm run typecheck && npm run lint
```

Deploys to Vercel with no configuration. Set `NEXT_PUBLIC_SITE_URL` to the
deployed origin so the OG card resolves absolutely.
