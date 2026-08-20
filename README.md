# DITTO // FIRST SCENE

**Same two people. Different first moments. One finally feels right.**

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
| **why this one?** | three pieces of evidence and one thing the system admits it doesn't know |
| **see the decision** (`D`) | the ranking with the arithmetic left in |
| **hear me out** | stated preference vs. what the history suggests |
| **break it** | three ways to sabotage the plan. context is replanned; the pair is never touched |
| **make it exam week** | capacity drops, nobody's calendar changes — and the system stops sending |
| **other pair** | same six rooms, different people. **coffee wins**, and it's the only opening that clears the bar |
| **make it real** | the interface removes itself |

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

## Stack

Next.js 14 · React 18 · TypeScript (strict) · Tailwind · three.js ·
@react-three/fiber · framer-motion · zustand · zod

Zero image assets — every portrait and artifact is drawn procedurally to a canvas
and cached. Scoring is a deterministic linear model with no LLM in the main path.

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
