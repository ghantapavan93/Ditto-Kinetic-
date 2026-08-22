# DITTO // FIRST SCENE

**Same two people. Different first moments. One finally feels right.**

> **Stack parity:** ditto.ai itself ships Next 16.2, React, Tailwind, Radix and
> Lucide on Vercel — and so does this repo, dependency for dependency. Nothing
> here would need a rewrite to live in their codebase.

An unofficial interaction concept for [Ditto](https://tryditto.com). Drag a dial
through six ways the same pair could meet and watch the interface physically
resist the ones that don't work — then watch it delete itself once the
introduction is made.

> Unofficial Ditto interaction concept. Synthetic people and simulated signals.
> No access to Ditto systems.

```bash
npm install && npm run dev
```

No environment variables required. Everything runs offline.

---

## The thesis, in one line

**The right person can still get the wrong first date.**

Ditto solved the hard half — it removed the deck and picks one person. But only
**20% of matched pairs actually go on the date** (their number), and their own
site says those dates happen at on-campus coffee spots.

So the ranking object shouldn't be `Person A × Person B`. It should be
`Person A × Person B × context`.

In this prototype `pairSignal` is one field out of eleven, and it is **identical
across all six candidate openings**. The same two people are exactly as
compatible in every row. Everything separating the best opening from the worst
is context — which you can see as a flat line in the decision view.

And the conclusion of that argument: if context is the variable, some weeks
*every* context is wrong. So there's a send bar. When nothing clears it the
system declines — **not this Wednesday** — and says the true thing about why:

> pair signal did not move. the week did.

Full argument: [PRODUCT_THESIS.md](PRODUCT_THESIS.md)

## What to do with it

| | |
|---|---|
| **Drag the dial** (or `←` `→`) | six openings for Maya × Jonah |
| **COFFEE** | the one Ditto currently books. it fails, and the stage shows you why before it tells you |
| **POST SHOW WALK** | everything snaps into one composition |
| **the first fifteen** | appears once you choose. scrub 0 → 15 and watch what the *room* is doing for them, minute by minute |
| **why this one?** | three pieces of evidence and one thing the system admits it doesn't know |
| **see the decision** (`D`) | the ranking with the arithmetic left in |
| **hear me out** | a folded note against the edge, not a modal. it disagrees with you, then offers to prove it — `change the scene and see` |
| **break it** | three ways to sabotage the plan. context is replanned; the pair is never touched |
| **make it exam week** | capacity drops, nobody's calendar changes — and the system stops sending |
| **other pair** | same six rooms, different people. **coffee wins**, and it's the only opening that clears the bar |
| **hover a reason** | the space between them fills with handwritten evidence as the context improves. hover the soft one and the paper blushes |
| **too much?** | bottom right. the whole production collapses to four lines on white. it rebuilds when you ask |
| **make it real** | you get a ticket you could put in a pocket — then the interface removes itself |

The last one is the point. Ditto's manifesto says technology should *"make the
introduction, then get out of the way."* The richest screen collapses into one
text message, then into one line.

## Twenty seconds

`0:00` two photographs, apart · `0:02` COFFEE — *possible. but too interview-y.*
· `0:05` rotate, things start aligning · `0:08` POST SHOW WALK — **snap** ·
`0:13` why this one? · `0:16` make it real · `0:20` *go have a real life.*

For the systems version, press **break it** three times: the venue falls through
and it replans, the shift moves and it holds, the walk doubles and it withdraws
the plan rather than downgrading it.

## Four surfaces, one loop

| | |
|---|---|
| **`/wednesday`** | THE DROP — the hour before the match lands |
| **`/`** | FIRST SCENE — the same two people through six openings |
| **`/after`** | AFTER — 12:14 AM, and the only place the system changes its mind |
| **`/next-wednesday`** | +7 DAYS — the same six rooms, one term weighted differently |

```
match arrives  →  choose the room  →  the date  →  what it revised  →  and what that cost
  /wednesday          /                              /after            /next-wednesday  ↺
```

Ditto's product has one ritual and it is unusually strong: preferences close
Tuesday at 11:59, and at 7pm Wednesday exactly one match arrives. A weekly
appointment a whole campus keeps is rare to own, and it currently has no visual
form — it happens in a text message.

`/after` closes the loop, and it refuses three things on purpose. **No rating** —
a star compresses the one high-information thing a person produces after a date,
a messy sentence, into a number nobody can reason about. **No "profile
updated"** — that is a claim of certainty about a person from one evening.
**No deletion** — the belief that turned out to be wrong stays on the board,
crossed out, because a system that quietly overwrites what it used to think
cannot be audited.

`/next-wednesday` is what makes that mean anything. A learning loop that never
changes an outcome is a claim, not a loop — so it runs the same six rooms for a
new pair on *last week's* weights and *this week's*, and shows both:

| | last week's weights | this week's |
|---|---|---|
| coffee | **0.5190 — sent** | 0.4722 — under the bar |
| gallery drift | 0.5116 | **0.4972 — sent** |

One term moved: social pressure, 0.10 → 0.16. No dimension invented, no room
changed. The café is still the easiest thing to organise — it just costs more
than it used to. `npm run check` asserts the flip, and asserts that the race it
had to overturn was genuinely close (a margin of 0.0026) rather than rigged.

## Stack

Next.js 16 · React 19 · TypeScript (strict) · Tailwind · three.js ·
@react-three/fiber · framer-motion · zustand · zod

Every portrait, artifact and handwritten fragment **in the ranking surfaces** is
drawn procedurally to a canvas and cached — no polaroid, profile or scene tile
is a photograph. Nobody real appears anywhere in this project.

The photography is a separate, deliberate layer and it does contain generated
faces: the reel at `/moments` is AI-generated imagery of people who do not
exist, and the six room plates behind the stage are empty rooms. Both are listed
in a generated manifest that `npm run check` verifies against the disk. Saying
otherwise would be the one lie this project cannot afford, so it is said plainly
here: the reel is synthetic photography of synthetic people, generated, not
shot, and not of anyone.

Scoring is a deterministic linear model with no LLM in the main path.

## Honesty

Everything I know about Ditto, sorted by how well I know it —
verified / inferred / invented — is in [RESEARCH.md](RESEARCH.md). All four
people are fictional, all portraits depict nobody, and the eleven-dimension
scoring schema and its weights are mine, not Ditto's.

Engineering decisions, the four bugs QA caught, and what I'd fix next:
[IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md).

**One caveat up front:** the browser pane was unavailable in the session that
built this, so it was verified programmatically — DOM, state machine, winner
detection, ARIA, WebGL context — but not looked at. Open it before you show it
to anyone.

## Prior work in this repo

Built on a teardown of Ditto's live product done first:
[docs/TEARDOWN.md](docs/TEARDOWN.md) (architecture),
[docs/ONBOARDING-FLOW.md](docs/ONBOARDING-FLOW.md) (all 24 signup steps verbatim),
[docs/COMPANY-RESEARCH.md](docs/COMPANY-RESEARCH.md) (founders, funding, traction),
[docs/REFERENCES.md](docs/REFERENCES.md) (three.js technique references),
[reference/](reference) (27 screenshots of the live flow).
