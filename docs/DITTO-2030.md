# Ditto 2030 — the intersection thesis

Where this project goes if the argument holds. Written 2026-08-20, with the same
evidence discipline as [GAP-ANALYSIS.md](GAP-ANALYSIS.md): first-party and press
claims are cited, inference is marked, and nothing is asserted about Ditto's
internals.

> **No access to Ditto systems.** Synthetic people, simulated signals.

---

## 1. The thesis is theirs, not ours

The single most important research finding for this direction is that the
expansion beyond dating is **Ditto's own stated position**, not something this
project is proposing on their behalf.

> "In the long run, Wang believes Ditto can go beyond dating, seeing themselves
> as becoming an experience platform that can help like-minded people to meet up
> for all sorts of reasons—maybe in pursuit of romance, or maybe because they
> want to find someone to explore a new business idea or play a sport."
> — [Forbes, 2026-07-11](https://www.forbes.com/sites/sofiachierchio/2026/07/11/these-gen-z-founders-are-reinventing-dating-apps-without-the-swipe/) **[P]**

That is romance / cofounder / sport, from the CEO. Which means the unit of the
product is already, in their own framing, larger than a match.

**A note on their manifesto page.** Search indexes return its `<title>` as
*"The Future is Agentic Social Network."*, while the page body reads
*"The Future is Human Again"* and contains no agentic language at all. Both are
first-party; they are different fields of the same page. Worth knowing, and not
worth over-reading — this project builds on the Forbes quote, which is
unambiguous.

**Not repeated:** third-party write-ups describe profiles becoming "agents" that
"simulate conversations and know when something clicks." That traces to blogs,
not to Ditto, and is treated as **[UNVERIFIED]** — same as the "thousand
simulations" claim.

---

## 2. The unit changes

| generation | model |
|---|---|
| swipe apps | `A ↔ B` |
| Ditto today | `A × B × context` (person, time, location) |
| **the thesis** | **`A × B × intent × moment × room × readiness × shape`** |

The fundamental object stops being a MATCH and becomes an **INTERSECTION**: two
people, a reason, a moment, a room, and a way of first touching.

A person can be right for you and still be wrong *today*, *in this room*, *under
this pressure*, *for this purpose*. Dating becomes the first application of a
connection engine rather than the whole product.

---

## 3. What is built (this repo)

The compiler at [`/compiler`](../src/app/compiler/page.tsx) is the connective
layer — one messy sentence in, one evening out, through nine stages. Six of the
nine are computed by machinery asserted elsewhere in `npm run check`:

```
INTENT      read    regex on your sentence — no model, no network
INTERSECTION read   romantic / friendship / collaborator
READINESS   read    tired routes to a room that carries more
WHO         derived pair signal, constant across rooms
SCAFFOLD    derived how much of the conversation the room does
WHEN        derived joint energy = the less present person
WHERE       derived clears the send bar, then fits the ask
SHAPE       derived direct / mission / parallel / group landing / afterglow
ENDING      derived the room's, or one we supply
```

The result that fell out rather than being written: **asking for a date is the
only input that produces a café.** Every other sentence earns a room that
carries more of the conversation. Asserted as claim 17.

**The rule that keeps it honest:** intent reorders the rooms that already clear
the send bar. It never reaches below it. Wanting something specific does not
entitle you to a bad evening.

**The shape it cannot produce:** BRIDGE — a mutual friend saying the sentence
for you. Nothing here models who knows whom. It is named on the surface rather
than omitted, because leaving it out would imply six rooms are the whole space
of ways to meet.

---

## 4. What is not built, ranked by what it would prove

1. **Three zoom levels** — one continuous camera from a person, to a pair, to a
   campus. The existing R3F stage is the middle level; the other two do not
   exist. Highest visual payoff, and it needs a network to zoom out to.
2. **Connection gravity** — forces rather than percentages. Shared curiosity
   pulls, scheduling friction pushes, a changed day snaps two worlds together.
   The engine already produces every one of those numbers; only the physics is
   missing.
3. **The missing edge** — highlight the introduction with the highest *network*
   consequence rather than the highest compatibility. Requires a social graph
   this project has no data for, and it is the same gap as BRIDGE.
4. **Social weather** — the campus as a changing environment: midterms, rain,
   venues closed, high cancellation likelihood. The `Conditions` type already
   models a strained week for one pair; this is that, at population scale.
5. **Autonomy levels** — from "you browse" to "Thursday, 7:40, wear something
   warm." The existing surfaces are roughly level 3.
6. **Attention budget** — every pixel costs the user something, and a connection
   going well should drive the interface toward zero. The Fading is a first
   version of this; making it an explicit optimisation target is not built.

---

## 5. What this deliberately will not become

**A soulmate predictor.** The system increases the quality of introductions, the
quality of circumstances, and the likelihood of showing up. It does not claim to
manufacture love. Opportunity, not destiny — and the difference is the whole
ethical position.

**A surveillance map.** The city as an interface is only acceptable if
complexity stays inside and simplicity comes out. Strangers as dots is the
version that must not be built. The frosted-glass work at
[`/profile`](../src/app/profile/page.tsx) is the standard: you may see that
something is held, never what it says.

**A cast of agents.** Named characters arguing in chat bubbles would be more
immediately entertaining and would make the system the protagonist. THE ROOM is
the alternative that was actually built: reasoning as a partition of the same
weights, which cannot say anything the scorer does not already say.

---

## 6. The arc

Fourteen acts, and the ones with routes already exist.

| act | | route |
|---|---|---|
| I | person — what kind of life do you want more of | [`/compiler`](../src/app/compiler/page.tsx) |
| II | possibility | — |
| III | intersection | [`/compiler`](../src/app/compiler/page.tsx) |
| IV | first scene — same people, six rooms | [`/`](../src/app/page.tsx) |
| V | failure — venue, schedule, environment | [`/`](../src/app/page.tsx) (disruptions) |
| VI | replan | [`/`](../src/app/page.tsx) |
| VII | trust — why, uncertainty, provenance | [`/`](../src/app/page.tsx) THE ROOM, the cloud |
| VIII | handoff | [`/wednesday`](../src/app/wednesday/page.tsx) |
| IX | disappear | [`/compiler`](../src/app/compiler/page.tsx) — "now get out of the way" |
| X | memory | [`/after`](../src/app/after/page.tsx) |
| XI | learning — I thought X, I learned Y | [`/after`](../src/app/after/page.tsx) |
| XII | world — one relationship becomes a network | — |
| XIII | beyond dating | [`/compiler`](../src/app/compiler/page.tsx) (intersection kinds) |
| XIV | full circle | — |

Two gaps, and they are the same gap: **there is no network here.** Acts II and
XII both need a population, and every unbuilt idea in section 4 traces back to
it. That is the next real piece of work, and it is data before it is graphics.

---

## 7. The pacing rule

Not visually loud every second. Quiet, quiet, quiet, one extraordinary
transformation, silence. The compiler is built to that shape: stages land one at
a time, and when it finishes everything except the single line goes away.

Which is their sentence, not ours:

> "We use technology to make the introduction, then get out of the way."
> — [ditto.ai/manifesto](https://ditto.ai/manifesto) **[1P]**

---

## Sources

- [Forbes — These Gen Z Founders Are Reinventing Dating Apps, Without The Swipe (2026-07-11)](https://www.forbes.com/sites/sofiachierchio/2026/07/11/these-gen-z-founders-are-reinventing-dating-apps-without-the-swipe/)
- [TechCrunch — Gen Z dating apps like Ditto ditch swiping (2026-08-06)](https://techcrunch.com/2026/08/06/gen-z-dating-apps-like-ditto-ditch-swiping-in-favor-of-ai-matchmaking/)
- [ditto.ai](https://ditto.ai/) and [ditto.ai/manifesto](https://ditto.ai/manifesto) (first-party, retrieved 2026-08-20)
