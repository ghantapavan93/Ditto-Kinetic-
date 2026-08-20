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

**BRIDGE is now producible.** The compiler named it as the one shape it could
not offer, because nothing modelled who knows whom. The network layer supplies
that, and `bridgeFor()` is a lookup: who do these two already both know.

---

## 4. The network layer

Built at [`/network`](../src/app/network/page.tsx). A generated campus of 96
people — six clusters, 143 threads, 16 of them crossing between clusters, 21
people with one connection or fewer, and the site's own six seeded into the
population rather than living beside it.

The finding, computed rather than written and asserted as claim 18:

| ranked by | pair | mutual friends | newly reachable |
|---|---|---|---|
| who would get on | Noor × Lux, same lab | 3 | 11 |
| **what would change** | **Noor × Xan, lab → climbing gym** | **0** | **17** |

Every "people you may know" system ranks by triadic closure. It predicts
whether two people will get on, and it is structurally a machine for
recommending the introduction that changes least — because the people it
favours are the ones you are already adjacent to.

And then the line that made the layer worth building. The compatible pair has a
mutual friend who could make the introduction, so **those two never needed a
product**. The missing edge has nobody: no friend, no party where it happens by
itself. That is the introduction only a system can make, and it scores **zero**
on every signal a compatibility ranker has.

### The camera

Built at [`/zoom`](../src/app/zoom/page.tsx). One camera, three scales, no page
transition — 86 units out to 2.4, a **36:1 approach**, asserted continuous in
claim 19 across 4,000 samples with a largest single step of 0.058 units.

The levels are *nested*, not cross-faded. The campus is translated so the
midpoint of the thread between Maya and Jonah sits at the origin, which means
the camera does not fly toward "the pair view" — it flies into the specific edge
between two specific dots. Distant geometry fades on the way down, and that is
level-of-detail rather than a transition: every object stays where it was built.

The path eases to a near-stop at each waypoint (0.0001 vs 0.1166 mid-flight), so
it arrives, holds, and then moves. A continuous sweep would read as a showreel.

### Still not built

1. **Connection gravity** — forces rather than percentages. The engine already
   produces every number; only the physics is missing.
3. **Social weather** — the campus as a changing environment, at population
   scale. `Conditions` models a strained week for one pair; this is that for 96.
4. **Autonomy levels** — the existing surfaces are roughly level 3.
5. **Attention budget** — the Fading is a first version; making it an explicit
   optimisation target is not built.

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
| II | possibility | [`/network`](../src/app/network/page.tsx) |
| III | intersection | [`/compiler`](../src/app/compiler/page.tsx) |
| IV | first scene — same people, six rooms | [`/`](../src/app/page.tsx) |
| V | failure — venue, schedule, environment | [`/`](../src/app/page.tsx) (disruptions) |
| VI | replan | [`/`](../src/app/page.tsx) |
| VII | trust — why, uncertainty, provenance | [`/`](../src/app/page.tsx) THE ROOM, the cloud |
| VIII | handoff | [`/wednesday`](../src/app/wednesday/page.tsx) |
| IX | disappear | [`/compiler`](../src/app/compiler/page.tsx) — "now get out of the way" |
| X | memory | [`/after`](../src/app/after/page.tsx) |
| XI | learning — I thought X, I learned Y | [`/after`](../src/app/after/page.tsx) |
| XII | world — one relationship becomes a network | [`/network`](../src/app/network/page.tsx) |
| XIII | beyond dating | [`/compiler`](../src/app/compiler/page.tsx) (intersection kinds) |
| XIV | full circle | [`/end`](../src/app/end/page.tsx) |

All fourteen acts have a route. The arc closes at
[`/end`](../src/app/end/page.tsx), which asks the question the compiler opens
with, runs the same nine stages, and shows none of them — 32 seconds against the
compiler's 59, second cheapest of nineteen surfaces.

Which is the site making its own argument on itself rather than describing it.
The compiler spends a minute proving the machinery exists. The ending, having
nothing left to prove, spends almost nothing.

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
